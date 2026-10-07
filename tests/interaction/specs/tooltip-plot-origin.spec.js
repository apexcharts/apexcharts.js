/**
 * Tooltip geometry is measured from the plot's own corner.
 *
 * Every pointer and mark the tooltip works with is converted into plot-local
 * pixels, the space the series, the crosshairs and gridWidth/gridHeight live
 * in. That conversion used to take the `.apexcharts-grid` group's bounding box
 * as the plot's corner, and a group measures to the union of what it draws:
 *
 *   - the plot outline `Grid.drawGridArea` adds starts a pixel down, so unless
 *     gridlines or row bands reach the top edge the box starts 1px below the
 *     plot. Arrows stood a pixel off bars, a followCursor box a pixel off the
 *     pointer, the y crosshair a pixel above it, the plot's top row of pixels
 *     counted as off the plot, and a canvas heatmap hit-tested the top pixel
 *     row of every cell as the row above it;
 *   - on a numeric x axis the horizontal gridlines of a bar chart run
 *     `barPadForNumericAxis` past both sides, so the column crosshair landed
 *     about a bar's width right of the hovered bar and a followCursor box that
 *     far right of the pointer.
 *
 * Each case mounts one chart, hovers it with the real mouse at whole-pixel
 * positions and checks the result against the plot corner as the browser
 * draws it (the screen matrix of `.apexcharts-inner`), to well under a pixel.
 */

import { test as base, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const BUNDLE = resolve(rootDir, 'dist/apexcharts.js')
const CANVAS_RENDERER = resolve(rootDir, 'dist/features/renderer-canvas.js')

/** ARROW_TIP_OVERHANG + POINT_TIP_GAP (src/modules/tooltip/constants.js). */
const GAP = 7
/** POINTER_CLEARANCE_BELOW. */
const POINTER_GAP_BELOW = 24
/** The defect is a whole pixel; anything subpixel is layout rounding. */
const TOLERANCE = 0.5

const VALUES = [44, 55, 41, 67, 22, 43, 21, 49]
const CATEGORIES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

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
 * Mount one chart `top` px down the page, with animations off. `scripts` are
 * loaded after the bundle (the canvas renderer is an opt-in feature).
 */
async function mount(page, options, { top = 60, scripts = [] } = {}) {
  await page.setContent(`<!doctype html>
    <body style="margin:0">
      <div id="stage" style="width:700px;margin:${top}px 0 0 40px"></div>
    </body>`)
  await page.addScriptTag({ path: BUNDLE })
  for (const path of scripts) await page.addScriptTag({ path })
  await page.evaluate((opts) => {
    opts.chart.animations = { enabled: false }
    window.chart = new window.ApexCharts(document.querySelector('#stage'), opts)
    return window.chart.render()
  }, options)
  await page.waitForTimeout(50)
}

/** The plot's corner and size on screen, from the browser's own matrix. */
function plotRect(page) {
  return page.evaluate(() => {
    const w = window.chart.w
    const m = w.dom.baseEl.querySelector('.apexcharts-inner').getScreenCTM()
    return {
      left: m.e,
      top: m.f,
      width: w.layout.gridWidth,
      height: w.layout.gridHeight,
    }
  })
}

/** Land 2px short, then on the target, then nudge sideways so it settles. */
async function hover(page, x, y) {
  await page.mouse.move(x, y + 2)
  await page.mouse.move(x, y)
  await page.waitForTimeout(100)
  await page.mouse.move(x + 1, y)
  await page.waitForTimeout(250)
}

const rectOf = (page, sel) =>
  page.evaluate(
    (s) => document.querySelector(s).getBoundingClientRect().toJSON(),
    sel,
  )

/** The box, its placement and where its arrow tip is. */
function readTooltip(page) {
  return page.evaluate(() => {
    const tt = document.querySelector('.apexcharts-tooltip')
    const arrow = tt.querySelector('.apexcharts-tooltip-arrow')
    const box = tt.getBoundingClientRect().toJSON()
    const placement = tt.dataset.placement ?? null
    let tip = null
    if (arrow && getComputedStyle(arrow).display !== 'none') {
      // the corner of the rotated square that points away from the box
      const a = arrow.getBoundingClientRect()
      const mx = (a.left + a.right) / 2
      const my = (a.top + a.bottom) / 2
      const half = a.width / 2
      tip = {
        top: { x: mx, y: my + half },
        bottom: { x: mx, y: my - half },
        right: { x: mx - half, y: my },
        left: { x: mx + half, y: my },
      }[placement]
    }
    return {
      active: tt.classList.contains('apexcharts-active'),
      placement,
      tip,
      box,
    }
  })
}

test.describe('Tooltip geometry is measured from the plot corner', () => {
  test('a canvas heatmap resolves the top pixel row of each cell to that cell', async ({
    page,
  }) => {
    const series = Array.from({ length: 5 }, (_, s) => ({
      name: 'Row ' + s,
      data: Array.from({ length: 8 }, (_, j) => ({
        x: 'c' + j,
        y: (s * 13 + j * 7) % 40,
      })),
    }))
    await mount(
      page,
      {
        chart: {
          type: 'heatmap',
          height: 320,
          renderer: 'canvas',
          rendererThreshold: 1,
        },
        dataLabels: { enabled: false },
        series,
      },
      { scripts: [CANVAS_RENDERER] },
    )
    expect(
      await page.evaluate(() => window.chart.w.globals.activeRenderer?.kind),
      'expected the canvas renderer, or this covers the SVG path instead',
    ).toBe('canvas')

    const plot = await plotRect(page)
    const x = Math.round(plot.left + plot.width * 0.45)
    // Each row's top edge, down the column under the pointer.
    const rows = await page.evaluate((px) => {
      const renderer = window.chart.w.globals.activeRenderer
      const out = []
      for (let y = 0.5; y < window.chart.w.layout.gridHeight; y++) {
        const hit = renderer.hitTest(px, y)
        if (hit && hit.seriesIndex !== out.at(-1)?.i) {
          out.push({ i: hit.seriesIndex, top: hit.y })
        }
      }
      return out
    }, x - plot.left)
    expect(rows.length).toBe(5)

    // Below the first row, the first whole pixel inside each cell.
    for (const row of rows.slice(1)) {
      const y = Math.ceil(plot.top + row.top)
      await hover(page, x, y)
      const captured = await page.evaluate(
        () => window.chart.w.interact.capturedSeriesIndex,
      )
      expect(
        captured,
        `pointer at y ${y}, row ${row.i} starts at ${plot.top + row.top}`,
      ).toBe(row.i)
    }
  })

  test('horizontal bars: the arrow tip lands on the bar, above it and below it', async ({
    page,
  }) => {
    await mount(page, {
      chart: { type: 'bar', height: 320 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 's', data: VALUES.slice(0, 6) }],
      xaxis: { categories: CATEGORIES.slice(0, 6) },
      tooltip: { shared: false, intersect: true },
    })

    const placements = []
    for (const j of [0, 3]) {
      const bar = await rectOf(page, `.apexcharts-bar-area[j='${j}']`)
      await hover(
        page,
        Math.round((bar.left + bar.right) / 2),
        Math.round((bar.top + bar.bottom) / 2),
      )
      const t = await readTooltip(page)
      placements.push(t.placement)
      const edge = t.placement === 'top' ? bar.top : bar.bottom
      expect(
        Math.abs(t.tip.y - edge),
        `bar ${j} (${t.placement})`,
      ).toBeLessThan(TOLERANCE)
      expect(
        Math.abs(t.tip.x - (bar.left + bar.right) / 2),
        `bar ${j}: arrow centred on the bar`,
      ).toBeLessThan(TOLERANCE)
    }
    expect(placements.sort()).toEqual(['bottom', 'top'])
  })

  test('a column: the arrow beside the bar points at its middle', async ({
    page,
  }) => {
    await mount(page, {
      chart: { type: 'bar', height: 320 },
      series: [{ name: 's', data: VALUES }],
      xaxis: { categories: CATEGORIES },
      tooltip: { shared: false, intersect: true },
    })
    const bar = await rectOf(page, ".apexcharts-bar-area[j='3']")
    await hover(
      page,
      Math.round((bar.left + bar.right) / 2),
      Math.round((bar.top + bar.bottom) / 2),
    )
    const t = await readTooltip(page)
    expect(['left', 'right']).toContain(t.placement)
    expect(Math.abs(t.tip.y - (bar.top + bar.bottom) / 2)).toBeLessThan(
      TOLERANCE,
    )
  })

  test('a column on a numeric x axis: the crosshair sits on the hovered bar', async ({
    page,
  }) => {
    // No categories: the x axis is numeric and the grid's gridlines reach
    // `barPadForNumericAxis` past the plot on both sides.
    await mount(page, {
      chart: { type: 'bar', height: 320 },
      series: [{ name: 's', data: VALUES }],
      tooltip: { shared: false, intersect: true },
    })
    expect(
      await page.evaluate(() => window.chart.w.globals.barPadForNumericAxis),
    ).toBeGreaterThan(10)

    const bar = await rectOf(page, ".apexcharts-bar-area[j='3']")
    await hover(
      page,
      Math.round((bar.left + bar.right) / 2),
      Math.round((bar.top + bar.bottom) / 2),
    )
    const band = await rectOf(page, '.apexcharts-xcrosshairs')
    expect(
      Math.abs((band.left + band.right) / 2 - (bar.left + bar.right) / 2),
    ).toBeLessThan(TOLERANCE)
  })

  test('followCursor: the box corner is the pointer', async ({ page }) => {
    await mount(page, {
      chart: { type: 'line', height: 320 },
      series: [{ name: 's', data: VALUES }],
      xaxis: { categories: CATEGORIES },
      tooltip: { followCursor: true },
    })
    const plot = await plotRect(page)
    const x = Math.round(plot.left + plot.width * 0.3)

    // upper half: the box hangs from the pointer
    const yUp = Math.round(plot.top + plot.height * 0.25)
    await hover(page, x, yUp)
    let t = await readTooltip(page)
    expect(Math.abs(t.box.top - yUp), 'box top on the pointer').toBeLessThan(
      TOLERANCE,
    )

    // lower half: the box stands on it
    const yDown = Math.round(plot.top + plot.height * 0.75)
    await hover(page, x, yDown)
    t = await readTooltip(page)
    expect(
      Math.abs(t.box.bottom - yDown),
      'box bottom on the pointer',
    ).toBeLessThan(TOLERANCE)
  })

  test('followCursor on a numeric-x column: the box starts at the pointer', async ({
    page,
  }) => {
    await mount(page, {
      chart: { type: 'bar', height: 320 },
      series: [{ name: 's', data: VALUES }],
      tooltip: { followCursor: true, shared: true, intersect: false },
    })
    const plot = await plotRect(page)
    const x = Math.round(plot.left + plot.width * 0.3)
    const y = Math.round(plot.top + plot.height * 0.3)
    await hover(page, x, y)
    const t = await readTooltip(page)
    // the last move was 1px right of `x`
    expect(Math.abs(t.box.left - (x + 1))).toBeLessThan(TOLERANCE)
  })

  test('followCursor on a short plot: the box clears the pointer by the arrow above, the cursor below', async ({
    page,
  }) => {
    const options = {
      chart: { type: 'line', height: 60, sparkline: { enabled: true } },
      series: [{ name: 's', data: VALUES }],
      tooltip: { followCursor: true },
    }

    await mount(page, options, { top: 300 })
    let plot = await plotRect(page)
    const x = Math.round(plot.left + plot.width * 0.4)
    let y = Math.round(plot.top + plot.height / 2)
    await hover(page, x, y)
    let t = await readTooltip(page)
    expect(t.placement).toBe('top')
    expect(Math.abs(y - t.box.bottom - GAP)).toBeLessThan(TOLERANCE)

    // no room above the chart: below the pointer
    await mount(page, options, { top: 0 })
    plot = await plotRect(page)
    y = Math.round(plot.top + plot.height / 2)
    await hover(page, x, y)
    t = await readTooltip(page)
    expect(t.placement).toBe('bottom')
    expect(Math.abs(t.box.top - y - POINTER_GAP_BELOW)).toBeLessThan(TOLERANCE)
  })

  test('the y-axis crosshair is drawn at the pointer', async ({ page }) => {
    await mount(page, {
      chart: { type: 'line', height: 320 },
      series: [{ name: 's', data: VALUES }],
      xaxis: { categories: CATEGORIES },
      yaxis: { tooltip: { enabled: true } },
    })
    const plot = await plotRect(page)
    const y = Math.round(plot.top + plot.height * 0.4)
    await hover(page, Math.round(plot.left + plot.width * 0.3), y)
    const line = await rectOf(page, '.apexcharts-ycrosshairs')
    expect(Math.abs((line.top + line.bottom) / 2 - y)).toBeLessThan(TOLERANCE)
  })

  test("the plot's top row of pixels keeps the tooltip open", async ({
    page,
  }) => {
    // Bars that reach the top of the plot, so there is something to caption.
    await mount(page, {
      chart: { type: 'bar', height: 320 },
      series: [{ name: 's', data: [100, 100, 100] }],
      xaxis: { categories: ['a', 'b', 'c'] },
      yaxis: { max: 100 },
    })
    const plot = await plotRect(page)
    const x = Math.round(plot.left + plot.width / 2)
    await hover(page, x, Math.round(plot.top + plot.height / 2))
    expect((await readTooltip(page)).active).toBe(true)

    // Halfway down the plot's first row of pixels. (On the plot's exact top
    // edge the pointer is over the legend's foreignObject, not the plot.)
    await page.mouse.move(x, plot.top + 0.5)
    await page.waitForTimeout(250)
    expect((await readTooltip(page)).active).toBe(true)
  })
})

/**
 * `chart.offsetX/offsetY` move the whole svg inside the chart's wrapper
 * (Core translates the root svg by them), and with it the plot. The layout's
 * translateX/Y leave them out, so a mark measured against the plot and put
 * back into the wrapper with translateY landed offsetY px off: the heatmap
 * arrow stood off its cell by that much (the keyboard measured against the
 * wrapper and stayed right, so the two disagreed), and a short plot's box
 * covered the bars it sits above.
 */
test.describe('Tooltip geometry under chart.offsetY', () => {
  const OFFSET_Y = 20

  /** The arrow tip on the cell's near edge, centred on it. */
  function expectTipOnCell(t, cell, label) {
    expect(['top', 'bottom'], label).toContain(t.placement)
    const edge = t.placement === 'top' ? cell.top : cell.bottom
    expect(
      Math.abs(t.tip.y - edge),
      `${label}: tip on the cell edge`,
    ).toBeLessThan(TOLERANCE)
    expect(
      Math.abs(t.tip.x - (cell.left + cell.right) / 2),
      `${label}: tip centred on the cell`,
    ).toBeLessThan(TOLERANCE)
  }

  for (const renderer of ['svg', 'canvas']) {
    test(`a ${renderer} heatmap: the arrow lands on the cell by mouse and by keyboard`, async ({
      page,
    }) => {
      const series = Array.from({ length: 5 }, (_, s) => ({
        name: 'Row ' + s,
        data: Array.from({ length: 8 }, (_, j) => ({
          x: 'c' + j,
          y: (s * 13 + j * 7) % 40,
        })),
      }))
      await mount(
        page,
        {
          chart: {
            type: 'heatmap',
            height: 320,
            offsetY: OFFSET_Y,
            renderer,
            rendererThreshold: 1,
            accessibility: {
              enabled: true,
              keyboard: { enabled: true, navigation: { enabled: true } },
            },
          },
          dataLabels: { enabled: false },
          series,
        },
        { scripts: renderer === 'canvas' ? [CANVAS_RENDERER] : [] },
      )
      expect(
        await page.evaluate(() => window.chart.w.globals.activeRenderer?.kind),
      ).toBe(renderer)

      // Keyboard first: a middle row, a few columns in.
      await page.evaluate(() =>
        document.querySelector('.apexcharts-svg').focus(),
      )
      for (const key of ['ArrowRight', 'ArrowRight', 'ArrowUp', 'ArrowUp']) {
        await page.keyboard.press(key)
      }
      await page.waitForTimeout(250)
      const focused =
        renderer === 'canvas'
          ? '.apexcharts-keyboard-focus-ring'
          : '.apexcharts-keyboard-focused'
      const cell = await rectOf(page, focused)
      const byKey = await readTooltip(page)
      expectTipOnCell(byKey, cell, 'keyboard')

      // The pointer on the same cell: the same box.
      const x = Math.round((cell.left + cell.right) / 2)
      const y = Math.round((cell.top + cell.bottom) / 2)
      await hover(page, x, y)
      const byPointer = await readTooltip(page)
      expectTipOnCell(byPointer, cell, 'pointer')
      for (const side of ['left', 'top', 'right', 'bottom']) {
        expect(
          Math.abs(byPointer.box[side] - byKey.box[side]),
          `${side}: keyboard and pointer agree`,
        ).toBeLessThan(1)
      }
    })
  }

  test('horizontal bars: the arrow tip lands on the bar', async ({ page }) => {
    await mount(page, {
      chart: { type: 'bar', height: 320, offsetY: OFFSET_Y },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 's', data: VALUES.slice(0, 6) }],
      xaxis: { categories: CATEGORIES.slice(0, 6) },
      tooltip: { shared: false, intersect: true },
    })
    for (const j of [0, 3]) {
      const bar = await rectOf(page, `.apexcharts-bar-area[j='${j}']`)
      await hover(
        page,
        Math.round((bar.left + bar.right) / 2),
        Math.round((bar.top + bar.bottom) / 2),
      )
      expectTipOnCell(await readTooltip(page), bar, `bar ${j}`)
    }
  })

  test('a short plot: the box keeps its gap to the bars it sits over', async ({
    page,
  }) => {
    await mount(page, {
      chart: { type: 'bar', height: 130, offsetY: OFFSET_Y },
      series: [
        { name: 's', data: [44, 55, 41, 67] },
        { name: 't', data: [30, 20, 50, 10] },
      ],
      xaxis: { categories: CATEGORIES.slice(0, 4) },
      tooltip: { shared: true, intersect: false },
    })
    for (const j of [1, 2]) {
      const bars = await page.evaluate((j) => {
        const rs = [
          ...document.querySelectorAll(`.apexcharts-bar-area[j='${j}']`),
        ].map((e) => e.getBoundingClientRect())
        return {
          top: Math.min(...rs.map((r) => r.top)),
          bottom: Math.max(...rs.map((r) => r.bottom)),
          cx:
            (Math.min(...rs.map((r) => r.left)) +
              Math.max(...rs.map((r) => r.right))) /
            2,
        }
      }, j)
      await hover(page, Math.round(bars.cx), Math.round(bars.bottom - 3))
      const t = await readTooltip(page)
      expect(['top', 'bottom'], `bars ${j}`).toContain(t.placement)
      const gap =
        t.placement === 'top'
          ? bars.top - t.box.bottom
          : t.box.top - bars.bottom
      expect(Math.abs(gap - GAP), `bars ${j}: gap ${gap}`).toBeLessThan(
        TOLERANCE,
      )
    }
  })
})
