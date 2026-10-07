/**
 * Pointer tools are measured from the plot's own corner.
 *
 * Zoom, pan, the measure ruler, the ink layer, the context menu, the data
 * label overlap pass, the gradient legend and the trellis grid card all turn
 * a pointer (or a label) into plot pixels or data. They used to take the
 * `.apexcharts-grid` group's bounding box as the plot, and a group measures
 * to the union of what it draws:
 *
 *   - the plot outline `Grid.drawGridArea` adds starts a pixel down, so unless
 *     gridlines reach the top edge the box starts 1px below the plot;
 *   - on a numeric-x bar chart the horizontal gridlines run
 *     `barPadForNumericAxis` past both sides, tens of px on a short series;
 *   - and it is measured in screen px, which a chart inside a CSS-zoomed
 *     container does not draw in.
 *
 * The tooltip modules moved to TooltipUtils.plotRect earlier; these cases
 * cover the rest. Each one acts with the real mouse (or real touch) at whole
 * pixels and checks the result against the plot as the browser draws it (the
 * screen matrix of `.apexcharts-inner`).
 *
 * APEX_BUNDLE runs the same tests against another build; its add-ons are read
 * from the `features` folder next to it, or from APEX_FEATURES.
 */

import { test as base, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve, join } from 'path'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const BUNDLE = process.env.APEX_BUNDLE
  ? resolve(process.env.APEX_BUNDLE)
  : resolve(rootDir, 'dist/apexcharts.js')
const FEATURES = process.env.APEX_FEATURES
  ? resolve(process.env.APEX_FEATURES)
  : join(dirname(BUNDLE), 'features')
const feature = (name) => join(FEATURES, `${name}.js`)

/** The defects are whole pixels or more; anything subpixel is rounding. */
const TOLERANCE = 0.5

const VALUES = [44, 55, 41, 67, 22, 43, 21, 49]
/** A numeric x axis: a bar chart pads its gridlines out past the plot. */
const NUMERIC_BARS = VALUES.map((y, i) => ({ x: 10 + i * 5, y }))

const test = base.extend({
  pageErrors: [
    async ({ page }, use) => {
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message))
      await use(errors)
      expect(
        errors,
        `Unexpected JS errors:\n${errors.join('\n')}`,
      ).toHaveLength(0)
    },
    { auto: true },
  ],
})

/**
 * Mount one chart `top` px down the page, with animations off. `zoom` puts it
 * in a CSS-zoomed container; `features` are add-on bundles loaded after the
 * main one.
 */
async function mount(
  page,
  options,
  { top = 60, zoom = 1, features = [], width = 700 } = {},
) {
  await page.setContent(`<!doctype html>
    <body style="margin:0">
      <div style="zoom:${zoom}">
        <div id="stage" style="width:${width}px;margin:${top}px 0 0 40px"></div>
      </div>
    </body>`)
  await page.addScriptTag({ path: BUNDLE })
  for (const name of features) await page.addScriptTag({ path: feature(name) })
  await page.evaluate((opts) => {
    opts.chart.animations = { enabled: false }
    window.__events = { zoomed: [], selection: [] }
    opts.chart.events = {
      zoomed: (_c, o) => window.__events.zoomed.push(o),
      selection: (_c, o) => window.__events.selection.push(o),
    }
    window.chart = new window.ApexCharts(document.querySelector('#stage'), opts)
    return window.chart.render()
  }, options)
  await page.waitForTimeout(100)
}

/**
 * The plot's corner, size and scale on screen, from the browser's matrix.
 * `panel` reads a trellis panel's chart instead of the page's chart.
 */
function plotRect(page, { panel = null } = {}) {
  return page.evaluate((panel) => {
    const chart =
      panel === null ? window.chart : window.chart.getPanels()[panel].chart
    const w = chart.w
    const m = w.dom.baseEl.querySelector('.apexcharts-inner').getScreenCTM()
    return {
      left: m.e,
      top: m.f,
      width: w.layout.gridWidth * m.a,
      height: w.layout.gridHeight * m.d,
      zoom: m.a,
    }
  }, panel)
}

/** The data x drawn at screen x, under the bar-placement mapping. */
function dataXAt(page, screenX) {
  return page.evaluate((sx) => {
    const w = window.chart.w
    const m = w.dom.baseEl.querySelector('.apexcharts-inner').getScreenCTM()
    const xRatio = (w.globals.maxX - w.globals.minX) / w.layout.gridWidth
    return {
      x: w.globals.minX + ((sx - m.e) / m.a) * xRatio,
      // data per screen px, to report an error in px
      perPx: xRatio / m.a,
    }
  }, screenX)
}

/** The first y axis' value drawn at screen y. */
function dataYAt(page, screenY) {
  return page.evaluate((sy) => {
    const w = window.chart.w
    const m = w.dom.baseEl.querySelector('.apexcharts-inner').getScreenCTM()
    const s = w.globals.yAxisScale[0]
    const perPx = (s.niceMax - s.niceMin) / (w.layout.gridHeight * m.d)
    return { y: s.niceMax - (sy - m.f) * perPx, perPx }
  }, screenY)
}

const rectOf = (page, sel) =>
  page.evaluate(
    (s) => window.chart.el.querySelector(s).getBoundingClientRect().toJSON(),
    sel,
  )

const centreOf = async (page, sel) => {
  const r = await rectOf(page, sel)
  return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 }
}

function expectNear(actual, expected, label) {
  expect(Math.abs(actual - expected), label).toBeLessThan(TOLERANCE)
}

/** Two fingers `d` px either side of `c`, spread by `step` px per move. */
async function pinch(page, c, { d = 20, step = 8, moves = 6 } = {}) {
  const cdp = await page.context().newCDPSession(page)
  const send = (type, half) =>
    cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints:
        type === 'touchEnd'
          ? []
          : [
              { x: c.x - half, y: c.y, id: 1 },
              { x: c.x + half, y: c.y, id: 2 },
            ],
    })
  await send('touchStart', d)
  for (let i = 1; i <= moves; i++) {
    await send('touchMove', d + i * step)
    await page.waitForTimeout(30)
  }
  await send('touchEnd', 0)
  await page.waitForTimeout(300)
  await cdp.detach()
}

const lineChart = (chart = {}) => ({
  chart: { type: 'line', height: 320, ...chart },
  series: [{ name: 's', data: VALUES.map((y, i) => [i + 1, y]) }],
  xaxis: { type: 'numeric' },
  dataLabels: { enabled: false },
})

const numericColumns = (chart = {}, extra = {}) => ({
  chart: { type: 'bar', height: 320, ...chart },
  series: [{ name: 's', data: NUMERIC_BARS }],
  xaxis: { type: 'numeric' },
  dataLabels: { enabled: false },
  ...extra,
})

test.describe('Zoom and selection are measured from the plot corner', () => {
  for (const [label, zoom, offsets] of [
    ['', 1, {}],
    [' with chart.offsetX/offsetY', 1, { offsetX: 30, offsetY: 20 }],
    [' in a CSS-zoomed container', 1.5, {}],
  ]) {
    test(`drag zoom${label}: the rect spans the drag and the y range is the pointer's`, async ({
      page,
    }) => {
      await mount(
        page,
        lineChart({ zoom: { enabled: true, type: 'xy' }, ...offsets }),
        {
          zoom,
        },
      )
      const plot = await plotRect(page)
      const a = {
        x: Math.round(plot.left + plot.width * 0.3),
        y: Math.round(plot.top + plot.height * 0.25),
      }
      const b = {
        x: Math.round(plot.left + plot.width * 0.6),
        y: Math.round(plot.top + plot.height * 0.7),
      }
      const top = await dataYAt(page, a.y)
      const bottom = await dataYAt(page, b.y)

      await page.mouse.move(a.x, a.y)
      await page.mouse.down()
      await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2)
      await page.mouse.move(b.x, b.y)
      await page.waitForTimeout(50)
      const rect = await rectOf(page, '.apexcharts-zoom-rect')
      await page.mouse.up()
      await page.waitForTimeout(200)

      expectNear(rect.left, a.x, 'rect left on the press')
      expectNear(rect.top, a.y, 'rect top on the press')
      expectNear(rect.right, b.x, 'rect right on the release')
      expectNear(rect.bottom, b.y, 'rect bottom on the release')

      const zoomed = await page.evaluate(() => window.__events.zoomed[0])
      expect(zoomed, 'zoomed fired').toBeTruthy()
      const y = Array.isArray(zoomed.yaxis) ? zoomed.yaxis[0] : zoomed.yaxis
      expect(
        Math.abs(y.max - top.y) / top.perPx,
        'zoomed y max is the value at the press, in px',
      ).toBeLessThan(TOLERANCE)
      expect(
        Math.abs(y.min - bottom.y) / bottom.perPx,
        'zoomed y min is the value at the release, in px',
      ).toBeLessThan(TOLERANCE)
    })
  }

  test('xy selection in a CSS-zoomed container: the reported y range is the rect, drawn and dragged', async ({
    page,
  }) => {
    await mount(
      page,
      lineChart({
        zoom: { enabled: false },
        selection: { enabled: true, type: 'xy' },
        toolbar: {
          autoSelected: 'selection',
          tools: { selection: true, zoom: false, pan: false },
        },
      }),
      { zoom: 1.5 },
    )
    const plot = await plotRect(page)
    const a = {
      x: Math.round(plot.left + plot.width * 0.2),
      y: Math.round(plot.top + plot.height * 0.3),
    }
    const b = {
      x: Math.round(plot.left + plot.width * 0.5),
      y: Math.round(plot.top + plot.height * 0.6),
    }

    /** The y range the selection rect covers, and data per px. */
    const rectRange = async () => {
      const r = await rectOf(page, '.apexcharts-selection-rect')
      const hi = await dataYAt(page, r.top)
      const lo = await dataYAt(page, r.bottom)
      return { max: hi.y, min: lo.y, perPx: hi.perPx, r }
    }
    // A fresh drag reports one entry per y axis; a dragged rect, the first.
    const lastSelection = () =>
      page.evaluate(() => {
        const s = window.__events.selection.at(-1)
        return s && (Array.isArray(s.yaxis) ? s.yaxis[0] : s.yaxis)
      })

    // a fresh drag (selectionDrawn)
    await page.mouse.move(a.x, a.y)
    await page.mouse.down()
    await page.mouse.move(b.x, b.y, { steps: 4 })
    await page.mouse.up()
    await page.waitForTimeout(200)
    let rr = await rectRange()
    expectNear(rr.r.top, a.y, 'selection rect top on the press')
    let sel = await lastSelection()
    expect(sel, 'selection fired').toBeTruthy()
    expect(Math.abs(sel.max - rr.max) / rr.perPx, 'y max').toBeLessThan(
      TOLERANCE,
    )
    expect(Math.abs(sel.min - rr.min) / rr.perPx, 'y min').toBeLessThan(
      TOLERANCE,
    )

    // dragging the rect body re-reports from the moved rect
    const grab = {
      x: Math.round((rr.r.left + rr.r.right) / 2),
      y: Math.round((rr.r.top + rr.r.bottom) / 2),
    }
    const before = await page.evaluate(() => window.__events.selection.length)
    await page.mouse.move(grab.x, grab.y)
    await page.mouse.down()
    await page.mouse.move(grab.x + 20, grab.y + 30, { steps: 4 })
    await page.mouse.up()
    await page.waitForTimeout(200)
    expect(
      await page.evaluate(() => window.__events.selection.length),
      'the drag re-reported',
    ).toBeGreaterThan(before)
    rr = await rectRange()
    sel = await lastSelection()
    expect(
      Math.abs(sel.max - rr.max) / rr.perPx,
      'dragged: y max',
    ).toBeLessThan(TOLERANCE)
    expect(
      Math.abs(sel.min - rr.min) / rr.perPx,
      'dragged: y min',
    ).toBeLessThan(TOLERANCE)
  })

  for (const [label, zoom] of [
    ['', 1],
    [' in a CSS-zoomed container', 1.5],
  ]) {
    test(`wheel zoom on numeric-x columns${label}: the value under the cursor stays under it`, async ({
      page,
    }) => {
      await mount(
        page,
        numericColumns({ zoom: { enabled: true, allowMouseWheelZoom: true } }),
        { zoom },
      )
      expect(
        await page.evaluate(() => window.chart.w.globals.barPadForNumericAxis),
      ).toBeGreaterThan(10)
      const plot = await plotRect(page)
      const cx = Math.round(plot.left + plot.width * 0.2)
      const cy = Math.round(plot.top + plot.height / 2)
      const before = await dataXAt(page, cx)
      await page.evaluate(
        ({ cx, cy }) => {
          window.chart.el.querySelector('.apexcharts-svg').dispatchEvent(
            new WheelEvent('wheel', {
              bubbles: true,
              cancelable: true,
              clientX: cx,
              clientY: cy,
              deltaY: -120,
            }),
          )
        },
        { cx, cy },
      )
      await page.waitForTimeout(400)
      const after = await dataXAt(page, cx)
      expect(after.perPx, 'the wheel zoomed in').toBeLessThan(before.perPx)
      expect(
        Math.abs(after.x - before.x) / after.perPx,
        'drift of the value under the cursor, px',
      ).toBeLessThan(TOLERANCE)
    })
  }

  for (const [label, options, zoom] of [
    [
      'numeric-x columns with the grid hidden',
      numericColumns(
        { zoom: { enabled: true, pinch: true } },
        { grid: { show: false } },
      ),
      1,
    ],
    [
      'a line in a CSS-zoomed container',
      lineChart({ zoom: { enabled: true, pinch: true } }),
      1.5,
    ],
  ]) {
    test(`pinch on ${label}: the value under the fingers stays under them`, async ({
      page,
    }) => {
      await mount(page, options, { zoom })
      const plot = await plotRect(page)
      const c = {
        x: Math.round(plot.left + plot.width * 0.3),
        y: Math.round(plot.top + plot.height / 2),
      }
      const before = await dataXAt(page, c.x)
      await pinch(page, c)
      const after = await dataXAt(page, c.x)
      expect(after.perPx, 'the pinch zoomed in').toBeLessThan(before.perPx)
      expect(
        Math.abs(after.x - before.x) / after.perPx,
        'drift of the value under the fingers, px',
      ).toBeLessThan(TOLERANCE)
    })
  }

  for (const [label, zoom] of [
    ['', 1],
    [' in a CSS-zoomed container', 1.5],
  ]) {
    test(`one-finger pan${label}: the value under the finger moves with it`, async ({
      page,
    }) => {
      await mount(
        page,
        lineChart({
          zoom: { enabled: true },
          pan: { inertia: true },
          toolbar: { autoSelected: 'pan' },
        }),
        { zoom },
      )
      // a window into the data, so there is room to pan either way
      await page.evaluate(() => window.chart.zoomX(3, 6))
      await page.waitForTimeout(150)
      const plot = await plotRect(page)
      const at = {
        x: Math.round(plot.left + plot.width * 0.6),
        y: Math.round(plot.top + plot.height / 2),
      }
      const to = at.x - 24
      const before = await dataXAt(page, at.x)

      const cdp = await page.context().newCDPSession(page)
      const send = (type, x) =>
        cdp.send('Input.dispatchTouchEvent', {
          type,
          touchPoints: type === 'touchEnd' ? [] : [{ x, y: at.y, id: 1 }],
        })
      await send('touchStart', at.x)
      // one move, past the rails threshold, held still before the release
      await send('touchMove', to)
      await page.waitForTimeout(150)
      const after = await dataXAt(page, to)
      await send('touchEnd', to)
      await cdp.detach()

      expect(
        Math.abs(after.x - before.x) / after.perPx,
        'drift of the value under the finger, px',
      ).toBeLessThan(TOLERANCE)
    })
  }
})

test.describe('Annotation tools land where the pointer is', () => {
  for (const [label, options, zoom] of [
    ['numeric-x columns', numericColumns, 1],
    ['a line', lineChart, 1],
    ['a line in a CSS-zoomed container', lineChart, 1.5],
  ]) {
    test(`measure ruler on ${label}: both ends on the pointer`, async ({
      page,
    }) => {
      await mount(page, options({ measure: { enabled: true, mode: 'free' } }), {
        zoom,
        features: ['measure'],
      })
      const plot = await plotRect(page)
      const a = {
        x: Math.round(plot.left + plot.width * 0.2),
        y: Math.round(plot.top + plot.height * 0.3),
      }
      const b = {
        x: Math.round(plot.left + plot.width * 0.7),
        y: Math.round(plot.top + plot.height * 0.8),
      }
      await page.evaluate(() => window.chart.startMeasure())
      await page.mouse.move(a.x, a.y)
      await page.mouse.down()
      await page.mouse.move(b.x, b.y)
      await page.waitForTimeout(30)
      const ends = await page.evaluate(() => {
        const ln = window.chart.el.querySelector(
          '.apexcharts-measure-live .apexcharts-measure-line',
        )
        const m = ln.getScreenCTM()
        const at = (x, y) => ({ x: m.a * x + m.e, y: m.d * y + m.f })
        const n = (k) => +ln.getAttribute(k)
        return [at(n('x1'), n('y1')), at(n('x2'), n('y2'))]
      })
      await page.mouse.up()
      expectNear(ends[0].x, a.x, 'A x')
      expectNear(ends[0].y, a.y, 'A y')
      expectNear(ends[1].x, b.x, 'B x')
      expectNear(ends[1].y, b.y, 'B y')
    })

    test(`ink note on ${label}: a create-click drops the note on the click`, async ({
      page,
    }) => {
      await mount(page, options({ ink: { enabled: true } }), {
        zoom,
        features: ['ink'],
      })
      const plot = await plotRect(page)
      const at = {
        x: Math.round(plot.left + plot.width * 0.37),
        y: Math.round(plot.top + plot.height * 0.3),
      }
      await page.evaluate(() => window.chart.ctx.ink.startCreate())
      await page.mouse.click(at.x, at.y)
      await page.waitForTimeout(80)
      const marker = await centreOf(page, '.apexcharts-point-annotation-marker')
      expectNear(marker.x, at.x, 'note x')
      expectNear(marker.y, at.y, 'note y')
    })

    test(`context menu on ${label}: opens at the click and adds the note there`, async ({
      page,
    }) => {
      await mount(
        page,
        options({ contextMenu: { enabled: true, items: ['annotate'] } }),
        { zoom, features: ['context-menu', 'ink'] },
      )
      const plot = await plotRect(page)
      const at = {
        x: Math.round(plot.left + plot.width * 0.37),
        y: Math.round(plot.top + plot.height * 0.3),
      }
      await page.mouse.click(at.x, at.y, { button: 'right' })
      await page.waitForTimeout(50)
      const menu = await rectOf(page, '.apexcharts-context-menu')
      expectNear(menu.left, at.x, 'menu left at the click')
      expectNear(menu.top, at.y, 'menu top at the click')

      await page.evaluate(() =>
        window.chart.el
          .querySelector('.apexcharts-context-menu-item')
          .dispatchEvent(new MouseEvent('click', { bubbles: true })),
      )
      await page.waitForTimeout(80)
      const marker = await centreOf(page, '.apexcharts-point-annotation-marker')
      expectNear(marker.x, at.x, 'note x')
      expectNear(marker.y, at.y, 'note y')
    })
  }
})

test.describe('A chart with no x/y axes has no data point under a click', () => {
  const pie = (type, chart) => ({
    chart: { type, height: 320, ...chart },
    series: [44, 55, 13, 33],
    labels: ['A', 'B', 'C', 'D'],
  })
  const annotations = (page) =>
    page.evaluate(() => {
      const a = window.chart.w.config.annotations
      return [a.points || [], a.xaxis || [], a.yaxis || []].map((l) => l.length)
    })

  test('context menu on a pie: each default item leaves the chart alone', async ({
    page,
  }) => {
    for (let k = 0; k < 3; k++) {
      await mount(page, pie('pie', { contextMenu: { enabled: true } }), {
        features: ['context-menu'],
      })
      const svg = await rectOf(page, '.apexcharts-svg')
      await page.mouse.click(
        Math.round(svg.left + svg.width * 0.4),
        Math.round(svg.top + svg.height * 0.4),
        { button: 'right' },
      )
      await page.waitForTimeout(50)
      const items = page.locator('.apexcharts-context-menu-item')
      expect(await items.count(), 'the default items').toBeGreaterThan(k)
      await items.nth(k).dispatchEvent('click')
      await page.waitForTimeout(80)
      // no annotation at a junk position, and no error (pageErrors)
      expect(await annotations(page), `item ${k}`).toEqual([0, 0, 0])
    }
  })

  test("a custom item's context names no x or y on a donut", async ({
    page,
  }) => {
    await mount(
      page,
      pie('donut', {
        contextMenu: { enabled: true, items: [{ id: 'c', label: 'Custom' }] },
      }),
      { features: ['context-menu'] },
    )
    // (a function cannot cross into the page with the options)
    await page.evaluate(() => {
      window.chart.w.config.chart.contextMenu.items[0].onClick = (_c, ctx) => {
        window.__context = { x: ctx.x, y: ctx.y }
      }
    })
    const svg = await rectOf(page, '.apexcharts-svg')
    await page.mouse.click(
      Math.round(svg.left + svg.width * 0.4),
      Math.round(svg.top + svg.height * 0.4),
      { button: 'right' },
    )
    await page.waitForTimeout(50)
    await page
      .locator('.apexcharts-context-menu-item')
      .first()
      .dispatchEvent('click')
    await page.waitForTimeout(50)
    expect(await page.evaluate(() => window.__context)).toEqual({
      x: null,
      y: null,
    })
  })

  test('an ink create-click on a donut creates no note', async ({ page }) => {
    await mount(page, pie('donut', { ink: { enabled: true } }), {
      features: ['ink'],
    })
    await page.evaluate(() => {
      window.__created = 0
      window.chart.addEventListener('annotationCreated', () => {
        window.__created++
      })
      window.chart.ctx.ink.startCreate()
    })
    const svg = await rectOf(page, '.apexcharts-svg')
    await page.mouse.click(
      Math.round(svg.left + svg.width * 0.3),
      Math.round(svg.top + svg.height * 0.5),
    )
    await page.waitForTimeout(100)
    expect(await annotations(page)).toEqual([0, 0, 0])
    expect(await page.evaluate(() => window.__created)).toBe(0)
  })
})

test.describe('Data labels are kept inside the plot', () => {
  /** Two series whose labels coincide near the top of the plot. */
  const options = {
    chart: { type: 'line', height: 320 },
    series: [
      { name: 'a', data: [10, 92, 30, 40] },
      { name: 'b', data: [12, 92, 32, 42] },
    ],
    yaxis: { min: 0, max: 100 },
    xaxis: { categories: ['a', 'b', 'c', 'd'] },
    dataLabels: { enabled: true },
  }

  /** Each label's box, relative to the plot corner. */
  async function labels(page) {
    const plot = await plotRect(page)
    const boxes = await page.evaluate(() =>
      Array.from(
        window.chart.el.querySelectorAll(
          '.apexcharts-datalabels text.apexcharts-datalabel',
        ),
        (t) => t.getBoundingClientRect().toJSON(),
      ),
    )
    return boxes.map((b) => ({ x: b.left - plot.left, y: b.top - plot.top }))
  }

  test('where the chart sits on the page does not change where they land', async ({
    page,
  }) => {
    // On the first render the overlap pass runs before the grid exists, and
    // it used to bound screen boxes by local 0..gridHeight, so a chart lower
    // on the page could push a label up out of the plot.
    await mount(page, options, { top: 0 })
    const atTop = await labels(page)
    await mount(page, options, { top: 400 })
    const lower = await labels(page)
    expect(lower.length).toBe(atTop.length)
    for (let i = 0; i < atTop.length; i++) {
      expectNear(lower[i].y, atTop[i].y, `label ${i} y`)
      expectNear(lower[i].x, atTop[i].x, `label ${i} x`)
    }
    for (const l of lower) {
      expect(l.y, 'label top inside the plot').toBeGreaterThan(-TOLERANCE)
    }
  })
})

test.describe('The gradient legend keeps its gap to the plot', () => {
  test('in a CSS-zoomed container the strip stays 16 chart px off the plot', async ({
    page,
  }) => {
    await mount(
      page,
      {
        chart: { type: 'heatmap', height: 340 },
        legend: { position: 'right' },
        plotOptions: {
          heatmap: { colorScale: { gradientLegend: { enabled: true } } },
        },
        dataLabels: { enabled: false },
        series: [0, 1, 2, 3].map((s) => ({
          name: 'r' + s,
          data: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((x, j) => ({
            x,
            y: (s * 7 + j * 13) % 40,
          })),
        })),
      },
      { zoom: 1.5 },
    )
    await page.waitForTimeout(100)
    const plot = await plotRect(page)
    const strip = await rectOf(page, '.apexcharts-legend svg rect')
    const gap = (strip.left - (plot.left + plot.width)) / plot.zoom
    expect(gap).toBeGreaterThan(16 - TOLERANCE)
  })
})

test.describe("The trellis 'grid' card answers for the plot only", () => {
  test('it shows on the plot, down to its top row, and not over the axis labels', async ({
    page,
  }) => {
    await page.setContent(
      `<div id="stage" style="width:1000px;margin:40px 0 0 30px"><div id="trellis"></div></div>`,
    )
    await page.addScriptTag({ path: BUNDLE })
    await page.addScriptTag({ path: feature('trellis') })
    await page.evaluate(() => {
      const walk = (seed) => {
        const d = []
        let v = 2.5
        let ts = Date.UTC(2025, 0, 1)
        for (let i = 0; i < 30; i++) {
          v += Math.sin(seed * 13 + i) * 0.4
          d.push([ts, Math.round(v * 1000) / 100])
          ts += 86400000
        }
        return d
      }
      window.chart = new window.ApexCharts(document.querySelector('#trellis'), {
        chart: { type: 'line', height: 560, animations: { enabled: false } },
        trellis: { by: 'k', columns: 3, tooltip: 'grid' },
        series: ['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => ({
          name: 's',
          k,
          data: walk(7 + i),
        })),
        xaxis: { type: 'datetime' },
        dataLabels: { enabled: false },
      })
      return window.chart.render()
    })
    await page.waitForTimeout(500)
    const plot = await plotRect(page, { panel: 0 })
    const x = Math.round(plot.left + plot.width / 2)

    const cardAt = async (y) => {
      await page.mouse.move(x - 3, y)
      await page.mouse.move(x, y, { steps: 3 })
      await page.waitForTimeout(250)
      const shown = await page.evaluate(() =>
        document
          .querySelector('.apexcharts-trellis-tooltip')
          .classList.contains('apexcharts-trellis-tooltip-active'),
      )
      await page.mouse.move(5, 5)
      await page.waitForTimeout(100)
      return shown
    }

    expect(await cardAt(plot.top + plot.height / 2), 'mid plot').toBe(true)
    expect(await cardAt(plot.top + 0.5), "the plot's top row").toBe(true)
    expect(
      await cardAt(plot.top + plot.height + 6),
      'over the x axis labels, inside the panel',
    ).toBe(false)
  })

  for (const zoom of [1, 1.5]) {
    test(`at zoom ${zoom} the card stands its 14 chart px off the pointer`, async ({
      page,
    }) => {
      await page.setContent(
        `<div style="zoom:${zoom}"><div id="stage" style="width:900px;margin:40px 0 0 30px"><div id="trellis"></div></div></div>`,
      )
      await page.addScriptTag({ path: BUNDLE })
      await page.addScriptTag({ path: feature('trellis') })
      await page.evaluate(() => {
        const data = (seed) =>
          Array.from({ length: 30 }, (_, i) => [
            Date.UTC(2025, 0, 1) + i * 86400000,
            Math.round((25 + Math.sin(seed * 13 + i) * 4) * 10) / 10,
          ])
        window.chart = new window.ApexCharts(
          document.querySelector('#trellis'),
          {
            chart: {
              type: 'line',
              height: 520,
              animations: { enabled: false },
            },
            trellis: { by: 'k', columns: 3, tooltip: 'grid' },
            series: ['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => ({
              name: 's',
              k,
              data: data(7 + i),
            })),
            xaxis: { type: 'datetime' },
            dataLabels: { enabled: false },
          },
        )
        return window.chart.render()
      })
      await page.waitForTimeout(500)
      const plot = await plotRect(page, { panel: 0 })
      // up and left in the first panel, so the card has room below right
      const at = {
        x: Math.round(plot.left + plot.width * 0.3),
        y: Math.round(plot.top + plot.height * 0.4),
      }
      await page.mouse.move(at.x - 3, at.y)
      await page.mouse.move(at.x, at.y, { steps: 3 })
      await page.waitForTimeout(250)
      const card = await page.evaluate(() => {
        const el = document.querySelector('.apexcharts-trellis-tooltip')
        return {
          active: el.classList.contains('apexcharts-trellis-tooltip-active'),
          ...el.getBoundingClientRect().toJSON(),
        }
      })
      expect(card.active).toBe(true)
      // style px are whole chart px, so up to half of one off, in screen px
      expect(Math.abs(card.left - at.x - 14 * zoom)).toBeLessThanOrEqual(zoom)
      expect(Math.abs(card.top - at.y - 14 * zoom)).toBeLessThanOrEqual(zoom)
    })
  }
})
