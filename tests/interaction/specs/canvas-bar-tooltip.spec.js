/**
 * Bar-likes painted to canvas: box plots, candlesticks and OHLC bars, bars
 * and columns, range bars (timelines, dumbbells, waterfalls).
 *
 * With `tooltip.intersect` the SVG chart hovers each mark's own path. On the
 * canvas renderer the marks are painted, so there was no node to hover and
 * no tooltip ever showed: the default tooltip of every bar, column, timeline,
 * dumbbell and waterfall chart, and the intersect one of box plots and
 * candlesticks. The plot is hovered instead, and the renderer finds the
 * painted path under the pointer, its stroke too (a candle's wick, a box
 * plot's whiskers). The shared tooltip read coords cached for the marks that
 * were not the rendered centre (a box plot's, a candle's) and took a box
 * plot's jitter for the box. The keyboard had no node to focus or to measure.
 *
 * Every placement here is checked against the same chart drawn as SVG.
 */

import { test, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..', '..', '..')

const TOLERANCE_PX = 1
const INTERSECT = { tooltip: { shared: false, intersect: true } }
const OHLC = { plotOptions: { candlestick: { type: 'ohlc' } } }

async function update(page, options) {
  await page.evaluate(async (options) => {
    await window.chart.updateOptions({
      ...options,
      chart: { ...(options.chart || {}), animations: { enabled: false } },
    })
  }, options)
  await page.waitForTimeout(250)
}

/** Load the canvas renderer, which is not in the bundle the samples load. */
async function loadCanvasFeature(page) {
  await page.addScriptTag({
    path: resolve(rootDir, 'dist', 'features', 'renderer-canvas.js'),
  })
}

/** Switch the loaded chart's renderer, and make sure it took. */
async function useRenderer(page, renderer, options) {
  await update(page, { ...options, chart: { renderer } })
  const state = await page.evaluate(() => ({
    kind: window.chart.w.globals.activeRenderer?.kind,
    marks: document.querySelectorAll(
      '.apexcharts-bar-area, .apexcharts-candlestick-area, .apexcharts-boxPlot-area, .apexcharts-rangebar-area, .apexcharts-violin-area',
    ).length,
  }))
  expect(state.kind).toBe(renderer)
  // Guard the guard: an SVG fallback would pass without covering canvas.
  if (renderer === 'canvas') expect(state.marks).toBe(0)
  else expect(state.marks).toBeGreaterThan(0)
}

async function readTooltip(page) {
  return page.evaluate(() => {
    const el = document.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    const r = el.getBoundingClientRect()
    const band = document.querySelector('.apexcharts-xcrosshairs')
    const b = band?.getBoundingClientRect()
    return {
      active: el.classList.contains('apexcharts-active'),
      placement: el.dataset.placement || null,
      text: el.textContent.replace(/\s+/g, ' '),
      left: r.left,
      top: r.top,
      dataPointIndex: window.chart.w.interact.capturedDataPointIndex,
      band:
        b && band.classList.contains('apexcharts-active')
          ? b.left + b.width / 2
          : null,
    }
  })
}

async function hover(page, { x, y }) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(60)
  await page.mouse.move(x - 2, y - 2)
  await page.mouse.move(x, y)
  await page.waitForTimeout(150)
}

async function expectSameSpot(actual, expected, label) {
  expect(actual.active, label).toBe(true)
  expect(actual.placement, label).toBe(expected.placement)
  expect(actual.text, label).toBe(expected.text)
  expect(Math.abs(actual.left - expected.left), label).toBeLessThanOrEqual(
    TOLERANCE_PX,
  )
  expect(Math.abs(actual.top - expected.top), label).toBeLessThanOrEqual(
    TOLERANCE_PX,
  )
  expect(actual.band === null, label).toBe(expected.band === null)
  if (expected.band !== null) {
    expect(Math.abs(actual.band - expected.band), label).toBeLessThanOrEqual(
      TOLERANCE_PX,
    )
  }
}

/**
 * Whole-pixel points (a pointer's position is whole) on every SVG path of
 * mark `j`: one inside its fill and, where it has one, one on its stroke
 * alone, clear of the fill (a wick, a whisker). Only measurable while the
 * chart is SVG. Also a point on the plot past the mark, on nothing.
 */
async function spotsOn(page, selector, j) {
  return page.evaluate(
    ({ selector, j }) => {
      const els = [...document.querySelectorAll(`${selector}[j='${j}']`)]
      const spots = []
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity
      let middle = 0
      for (const [n, el] of els.entries()) {
        const r = el.getBoundingClientRect()
        top = Math.min(top, r.top)
        right = Math.max(right, r.right)
        bottom = Math.max(bottom, r.bottom)
        middle = Math.round(r.left + r.width / 2)
        const m = el.getScreenCTM().inverse()
        const p = el.ownerSVGElement.createSVGPoint()
        const at = (x, y) => {
          p.x = x
          p.y = y
          const q = p.matrixTransform(m)
          return { fill: el.isPointInFill(q), stroke: el.isPointInStroke(q) }
        }
        const cx = Math.round(r.left + r.width / 2)
        const cy = Math.round(r.top + r.height / 2)
        search: for (let d = 0; d < Math.max(r.width, r.height); d++) {
          for (const [dx, dy] of [
            [0, d],
            [0, -d],
            [d, 0],
            [-d, 0],
          ]) {
            if (at(cx + dx, cy + dy).fill) {
              spots.push({ label: `path ${n}, fill`, x: cx + dx, y: cy + dy })
              break search
            }
          }
        }
        search: for (let y = Math.ceil(r.top); y < r.bottom; y++) {
          for (let x = Math.floor(r.left) - 1; x <= r.right + 1; x++) {
            const here = at(x, y)
            if (!here.stroke || here.fill) continue
            const clear = [
              [3, 0],
              [-3, 0],
              [0, 3],
              [0, -3],
            ].every(([dx, dy]) => !at(x + dx, y + dy).fill)
            if (clear) {
              spots.push({ label: `path ${n}, stroke`, x, y })
              break search
            }
          }
        }
      }
      const horizontal = window.chart.w.globals.isBarHorizontal
      return {
        spots,
        off: horizontal
          ? { x: Math.round(right + 12), y: Math.round((top + bottom) / 2) }
          : { x: middle, y: Math.round(top - 12) },
      }
    },
    { selector, j },
  )
}

test.describe('Canvas bar-likes: intersect tooltip', () => {
  const CASES = [
    ['boxPlot', 'basic', '.apexcharts-boxPlot-area', 2],
    ['boxPlot', 'horizontal-boxplot', '.apexcharts-boxPlot-area', 1],
    ['candlestick', 'candlestick-category', '.apexcharts-candlestick-area', 5],
    [
      'candlestick',
      'candlestick-category',
      '.apexcharts-candlestick-area',
      5,
      OHLC,
    ],
    ['column', 'basic-column', '.apexcharts-bar-area', 2],
    ['bar', 'grouped-bar', '.apexcharts-bar-area', 2],
    ['timelines', 'simple', '.apexcharts-rangebar-area', 1],
    ['dumbbell', 'basic-dumbbell', '.apexcharts-rangebar-area', 1],
    ['waterfall', 'basic-waterfall', '.apexcharts-rangebar-area', 2],
  ]

  for (const [type, sample, selector, j, extra] of CASES) {
    test(`${type}/${sample}${extra ? ' (ohlc)' : ''}: shows on fill and stroke where the SVG chart does, hides off the marks`, async ({
      page,
      loadChart,
    }) => {
      const options = { ...extra, ...INTERSECT }
      await loadChart(type, sample)
      await loadCanvasFeature(page)
      await useRenderer(page, 'svg', options)

      const { spots, off } = await spotsOn(page, selector, j)
      expect(spots.length).toBeGreaterThan(0)
      const svg = []
      for (const spot of spots) {
        await hover(page, spot)
        svg.push(await readTooltip(page))
        expect(svg.at(-1).active, `${spot.label} on SVG`).toBe(true)
      }

      await useRenderer(page, 'canvas', options)
      for (const [k, spot] of spots.entries()) {
        await hover(page, spot)
        const canvas = await readTooltip(page)
        await expectSameSpot(canvas, svg[k], spot.label)
        expect(canvas.dataPointIndex, spot.label).toBe(j)
      }

      // Still on the plot, but past the mark: nothing is under the pointer,
      // so nothing is captioned.
      await hover(page, off)
      expect((await readTooltip(page)).active).toBe(false)
    })
  }
})

test.describe('Canvas bar-likes: the shared tooltip', () => {
  // Box plots and candlesticks default to a shared tooltip. On canvas it read
  // the cached cx as the rendered centre, which for a box or a candle it is
  // not (half the mark off), placed horizontal rows beside the plot, and on a
  // box plot with jitter took the jitter path, still SVG, for the box.
  const CASES = [
    ['boxPlot', 'basic', '.apexcharts-boxPlot-area', 2],
    ['boxPlot', 'horizontal-boxplot', '.apexcharts-boxPlot-area', 1],
    ['boxPlot', 'boxplot-with-points', '.apexcharts-boxPlot-area', 1],
    ['candlestick', 'basic', '.apexcharts-candlestick-area', 20],
    ['candlestick', 'candlestick-category', '.apexcharts-candlestick-area', 5],
  ]

  for (const [type, sample, selector, j] of CASES) {
    test(`${type}/${sample}: sits where the SVG chart puts it`, async ({
      page,
      loadChart,
    }) => {
      await loadChart(type, sample)
      await loadCanvasFeature(page)
      await useRenderer(page, 'svg', {})
      const [spot] = (await spotsOn(page, selector, j)).spots
      await hover(page, spot)
      const svg = await readTooltip(page)
      expect(svg.active).toBe(true)

      await useRenderer(page, 'canvas', {})
      await hover(page, spot)
      await expectSameSpot(await readTooltip(page), svg, spot.label)
    })
  }
})

test.describe('Canvas bar-likes: keyboard focus', () => {
  // Focus found no node to outline, to measure, or to keep the box clear of
  // (the focus-not-obscured nudge looks for a focused node), so the box sat
  // where the pointer's would without the nudge: a vertical violin's 61px
  // lower than on SVG. A horizontal box plot's box went to the chart's
  // corner. The painted path is outlined now, and focus reads it.
  const CASES = [
    ['boxPlot', 'basic', {}],
    ['boxPlot', 'horizontal-boxplot', INTERSECT],
    ['candlestick', 'candlestick-category', {}],
    ['violin', 'basic-violin', {}],
    ['timelines', 'simple', {}],
  ]

  async function focusAt(page, j) {
    await page.mouse.move(2, 2)
    await page.evaluate(() => {
      document.activeElement?.blur?.()
      document.querySelector('.apexcharts-svg').focus()
    })
    await page.waitForTimeout(150)
    for (let k = 0; k < j; k++) {
      await page.keyboard.press('ArrowRight')
      await page.waitForTimeout(60)
    }
    await page.waitForTimeout(200)
    return page.evaluate(() => {
      const f = document.querySelector('.apexcharts-keyboard-focused')
      const r = f?.getBoundingClientRect()
      return {
        j: window.chart.ctx.keyboardNavigation.dataPointIndex,
        focus: r
          ? {
              ring: f.classList.contains('apexcharts-keyboard-focus-ring'),
              left: r.left,
              top: r.top,
              right: r.right,
              bottom: r.bottom,
              label: f.getAttribute('aria-label'),
            }
          : null,
      }
    })
  }

  for (const [type, sample, options] of CASES) {
    test(`${type}/${sample}: the box and the outline where the SVG chart puts them`, async ({
      page,
      loadChart,
    }) => {
      await loadChart(type, sample)
      await loadCanvasFeature(page)

      await useRenderer(page, 'svg', options)
      const svgFocus = await focusAt(page, 2)
      const svg = await readTooltip(page)
      expect(svgFocus.j).toBe(2)
      expect(svg.active).toBe(true)
      expect(svgFocus.focus?.ring).toBe(false)

      await useRenderer(page, 'canvas', options)
      const canvasFocus = await focusAt(page, 2)
      const canvas = await readTooltip(page)
      expect(canvasFocus.j).toBe(2)
      await expectSameSpot(canvas, svg, 'keyboard')

      // The outline traces the painted path, so it spans what the focused
      // SVG path does, and carries its name.
      const ring = canvasFocus.focus
      expect(ring?.ring).toBe(true)
      for (const k of ['left', 'top', 'right', 'bottom']) {
        expect(Math.abs(ring[k] - svgFocus.focus[k]), k).toBeLessThanOrEqual(
          TOLERANCE_PX,
        )
      }
      expect(ring.label).toBe(svgFocus.focus.label)
    })
  }
})

test.describe('Canvas bar-likes: an interactive tooltip', () => {
  test('a box plot box can be reached across the plot and clicked, and closes on leaving', async ({
    page,
    loadChart,
  }) => {
    await loadChart('boxPlot', 'basic')
    await loadCanvasFeature(page)
    await page.evaluate(() => {
      window.linkClicks = 0
      document.addEventListener('click', (event) => {
        if (event.target.id === 'tooltip-link') {
          event.preventDefault()
          window.linkClicks += 1
        }
      })
    })
    await useRenderer(page, 'svg', INTERSECT)
    const [spot] = (await spotsOn(page, '.apexcharts-boxPlot-area', 2)).spots
    await page.evaluate(() =>
      window.chart.updateOptions({
        tooltip: {
          interactive: true,
          custom: () => '<a id="tooltip-link" href="#details">Details</a>',
        },
      }),
    )
    await useRenderer(page, 'canvas', INTERSECT)

    await hover(page, spot)
    const tooltip = page.locator(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    await expect(tooltip).toHaveClass(/apexcharts-active/)
    await expect(tooltip).toHaveClass(/apexcharts-tooltip-interactive/)

    // Across the gap to the box, over plot with no mark under it, in steps
    // a hand would take.
    const link = page.locator('#tooltip-link')
    const box = await link.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
      steps: 8,
    })
    await expect(tooltip).toHaveClass(/apexcharts-active/)
    await link.click()
    await expect.poll(() => page.evaluate(() => window.linkClicks)).toBe(1)

    await page.mouse.move(2, 2)
    await expect(tooltip).not.toHaveClass(/apexcharts-active/)
  })
})

test.describe('Canvas bar-likes: after a data-only update', () => {
  // The plot-wide listener and the hit test read the active renderer off the
  // globals, which a data-only updateSeries used to leave empty, so the
  // tooltip went for good after the most common update a live chart makes.
  test('column/basic-column: intersect hover after updateSeries is where the SVG chart puts it', async ({
    page,
    loadChart,
  }) => {
    await loadChart('column', 'basic-column')
    await loadCanvasFeature(page)
    const bumped = await page.evaluate(() =>
      window.chart.w.config.series.map((s) => ({
        name: s.name,
        data: s.data.map((v) => v + 3),
      })),
    )
    const updateData = () =>
      page.evaluate(async (series) => {
        await window.chart.updateSeries(series, false)
      }, bumped)

    await useRenderer(page, 'svg', INTERSECT)
    await updateData()
    const { spots } = await spotsOn(page, '.apexcharts-bar-area', 2)
    const svg = []
    for (const spot of spots) {
      await hover(page, spot)
      svg.push(await readTooltip(page))
      expect(svg.at(-1).active, `${spot.label} on SVG`).toBe(true)
    }

    // The same data again on canvas, which takes the data-only fast path.
    await useRenderer(page, 'canvas', INTERSECT)
    const fast = () =>
      page.evaluate(
        () =>
          window.chart._updateStats.fast +
          window.chart._updateStats.fastWithAxes,
      )
    const before = await fast()
    await updateData()
    expect(await fast(), 'a data-only update').toBe(before + 1)
    for (const [k, spot] of spots.entries()) {
      await hover(page, spot)
      await expectSameSpot(await readTooltip(page), svg[k], spot.label)
    }
  })
})

test.describe('Canvas bar-likes: a synced group', () => {
  // With chart.group every member takes the sticky path, which never
  // hit-tests. On SVG that only runs while the pointer is over a mark (the
  // mark's own listener); the canvas plot-wide listener runs on every move,
  // so the hovered chart has to say when it is on no mark at all.
  async function mountGroup(page, renderers, extra = {}) {
    await page.setContent(
      `<!doctype html><body style="margin:0"><div id="a" style="width:700px"></div><div id="b" style="width:700px"></div></body>`,
    )
    await page.addScriptTag({ path: resolve(rootDir, 'dist', 'apexcharts.js') })
    await loadCanvasFeature(page)
    await page.evaluate(
      async ({ renderers, extra }) => {
        window.charts = []
        for (const [k, id] of ['a', 'b'].entries()) {
          const chart = new window.ApexCharts(document.getElementById(id), {
            chart: {
              id,
              group: 'g',
              type: 'bar',
              height: 250,
              renderer: renderers[k],
              animations: { enabled: false },
            },
            series: [
              { name: id + '1', data: [44, 55, 57, 56, 61, 58] },
              { name: id + '2', data: [36, 42, 40, 47, 50, 45] },
            ],
            xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
            yaxis: { labels: { minWidth: 40 } },
            ...extra,
          })
          window.charts.push(chart)
          await chart.render()
        }
      },
      { renderers, extra },
    )
    await page.waitForTimeout(200)
  }

  /** Where the first chart has column `j` of series 0, and the gap after it. */
  async function spots(page, j) {
    return page.evaluate((j) => {
      const w = window.charts[0].w
      const box = w.dom.Paper.node.getBoundingClientRect()
      const slot = w.layout.gridWidth / w.globals.dataPoints
      const left = box.left + w.layout.translateX
      return {
        // the left column of the pair, a third of the way into the slot
        on: {
          x: Math.round(left + slot * j + slot * 0.38),
          y: Math.round(
            box.top + w.layout.translateY + w.layout.gridHeight * 0.8,
          ),
        },
        // between two categories, on no column
        off: {
          x: Math.round(left + slot * (j + 1)),
          y: Math.round(
            box.top + w.layout.translateY + w.layout.gridHeight * 0.8,
          ),
        },
      }
    }, j)
  }

  async function readGroup(page) {
    return page.evaluate(() =>
      window.charts.map((c) => {
        const el = c.w.dom.baseEl.querySelector(
          '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
        )
        return el.classList.contains('apexcharts-active')
          ? el.textContent.replace(/\s+/g, ' ')
          : 'off'
      }),
    )
  }

  test('off every mark the group closes, on one it shows, as with SVG members', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    const results = {}
    for (const renderers of [
      ['svg', 'svg'],
      ['canvas', 'canvas'],
      ['canvas', 'svg'],
    ]) {
      await mountGroup(page, renderers)
      const { on, off } = await spots(page, 1)
      await hover(page, on)
      const shown = await readGroup(page)
      await hover(page, off)
      const gap = await readGroup(page)
      results[renderers.join('+')] = { shown, gap }
    }
    expect(results['svg+svg'].shown[0]).not.toBe('off')
    expect(results['svg+svg'].gap).toEqual(['off', 'off'])
    for (const key of ['canvas+canvas', 'canvas+svg']) {
      expect(results[key], key).toEqual(results['svg+svg'])
    }
    expect(errors).toEqual([])
  })

  test('the dataset highlight reaches an SVG member from a canvas one', async ({
    page,
  }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    await mountGroup(page, ['canvas', 'svg'], {
      tooltip: {
        shared: false,
        intersect: true,
        onDatasetHover: { highlightDataSeries: true },
      },
    })
    const { on, off } = await spots(page, 1)
    await hover(page, on)
    const dimmed = () =>
      page.evaluate(() =>
        [
          ...window.charts[1].w.dom.baseEl.querySelectorAll(
            '.apexcharts-bar-series .apexcharts-series',
          ),
        ].map((g) => g.classList.contains('legend-mouseover-inactive')),
      )
    // series 0 is hovered: the SVG member dims its series 1
    expect(await dimmed()).toEqual([false, true])
    expect((await readGroup(page))[1]).not.toBe('off')
    await hover(page, off)
    expect(await dimmed()).toEqual([false, false])
    expect(errors).toEqual([])
  })

  for (const renderers of [
    ['canvas', 'svg'],
    ['svg', 'canvas'],
  ]) {
    test(`the dataset highlight without intersect (a histogram's default), ${renderers.join(' then ')}: both members show, nothing throws`, async ({
      page,
    }) => {
      // Without intersect the canvas member used to pass on no series, and
      // the SVG member read one off a node that names none and threw.
      const errors = []
      page.on('pageerror', (e) => errors.push(e.message))
      await mountGroup(page, renderers, {
        tooltip: {
          shared: false,
          intersect: false,
          onDatasetHover: { highlightDataSeries: true },
        },
      })
      const { on } = await spots(page, 1)
      await hover(page, on)
      const shown = await readGroup(page)
      expect(shown[0], 'the hovered chart').not.toBe('off')
      expect(shown[1], 'the other member').not.toBe('off')
      expect(errors).toEqual([])
    })
  }
})

test.describe('Canvas bar-likes: a combo, and a line with gaps', () => {
  // A line captured beside the bars of a combo positions off pointsArray on
  // canvas (no marker node to enlarge), and a line with null values cached
  // an extra entry there for the off-plot point the null handling parks, so
  // every later point was read one index on.
  for (const [type, sample] of [
    ['candlestick', 'candlestick-line'],
    ['line', 'line-with-missing-data'],
  ]) {
    test(`${type}/${sample}: the shared box sits where the SVG chart puts it`, async ({
      page,
      loadChart,
    }) => {
      // a grid of hovers on each renderer
      test.setTimeout(40_000)
      await loadChart(type, sample)
      await loadCanvasFeature(page)
      // (no bar-like nodes here to count, so not useRenderer)
      const render = async (renderer) => {
        await update(page, { chart: { renderer } })
        expect(
          await page.evaluate(
            () => window.chart.w.globals.activeRenderer?.kind,
          ),
        ).toBe(renderer)
      }
      await render('svg')
      const points = await page.evaluate(() => {
        const w = window.chart.w
        const box = w.dom.Paper.node.getBoundingClientRect()
        const out = []
        for (let a = 0; a < 6; a++) {
          for (let b = 0; b < 3; b++) {
            out.push({
              x: Math.round(
                box.left +
                  w.layout.translateX +
                  ((a + 0.5) * w.layout.gridWidth) / 6,
              ),
              y: Math.round(
                box.top +
                  w.layout.translateY +
                  ((b + 0.5) * w.layout.gridHeight) / 3,
              ),
            })
          }
        }
        return out
      })
      const svg = []
      for (const p of points) {
        await hover(page, p)
        svg.push(await readTooltip(page))
      }
      await render('canvas')
      for (const [k, p] of points.entries()) {
        await hover(page, p)
        const canvas = await readTooltip(page)
        const label = `(${p.x}, ${p.y})`
        expect(canvas.active, label).toBe(svg[k].active)
        if (svg[k].active) await expectSameSpot(canvas, svg[k], label)
      }
    })
  }
})

test.describe('Canvas bar-likes: keyboard focus where the pointer puts the box', () => {
  // With an intersect tooltip the pointer puts a vertical mark's box beside
  // it (Intersect.handleBarTooltip). Keyboard focus used the sticky box over
  // the category instead, on SVG as on canvas, and a vertical range column's
  // box went to the page's corner.
  const CASES = [
    ['column', 'basic-column'],
    ['column', 'range-column'],
    ['boxPlot', 'basic'],
  ]
  for (const [type, sample] of CASES) {
    for (const renderer of ['svg', 'canvas']) {
      test(`${type}/${sample} on ${renderer}: the focused mark's box is the hovered one's`, async ({
        page,
        loadChart,
      }) => {
        await loadChart(type, sample)
        await loadCanvasFeature(page)
        await useRenderer(page, renderer, INTERSECT)
        await page.evaluate(() =>
          document.querySelector('.apexcharts-svg').focus(),
        )
        await page.waitForTimeout(100)
        for (let k = 0; k < 2; k++) {
          await page.keyboard.press('ArrowRight')
          await page.waitForTimeout(60)
        }
        await page.waitForTimeout(150)
        const keyboard = await readTooltip(page)
        expect(keyboard.active).toBe(true)
        expect(keyboard.dataPointIndex).toBe(2)
        // the focused mark's middle, through its outline or its node
        const at = await page.evaluate(() => {
          const f = document.querySelector('.apexcharts-keyboard-focused')
          const r = f.getBoundingClientRect()
          return {
            x: Math.round(r.left + r.width / 2),
            y: Math.round(r.top + r.height / 2),
          }
        })
        await page.evaluate(() => document.activeElement.blur())
        await hover(page, at)
        await expectSameSpot(await readTooltip(page), keyboard, 'pointer')
      })
    }
  }

  test('a series left out of tooltip.enabledOnSeries: focus captions it alike on both renderers', async ({
    page,
    loadChart,
  }) => {
    // The pointer checks enabledOnSeries against the series it hovers; focus
    // never did on SVG, which hands over the mark's node. The painted mark
    // focus names must not be taken for one the hit test found, which is
    // checked, or canvas alone hid the box.
    await loadChart('column', 'basic-column')
    await loadCanvasFeature(page)
    const focusTwice = async () => {
      await page.evaluate(() =>
        document.querySelector('.apexcharts-svg').focus(),
      )
      await page.waitForTimeout(100)
      for (let k = 0; k < 2; k++) {
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(60)
      }
      await page.waitForTimeout(150)
      const tt = await readTooltip(page)
      await page.evaluate(() => document.activeElement.blur())
      return tt
    }
    const options = { tooltip: { ...INTERSECT.tooltip, enabledOnSeries: [1] } }
    await useRenderer(page, 'svg', options)
    const svg = await focusTwice()
    expect(svg.active, 'SVG: the focused series 0 is captioned').toBe(true)
    await useRenderer(page, 'canvas', options)
    await expectSameSpot(await focusTwice(), svg, 'canvas')
  })
})

test.describe('Canvas bar-likes: the part a clip cuts off', () => {
  test('a bar past the axis maximum takes no hover outside the plot, as on SVG', async ({
    page,
  }) => {
    await page.setContent(
      `<!doctype html><body style="margin:0"><div id="wrap" style="width:800px;margin:20px"><div id="stage"></div></div></body>`,
    )
    await page.addScriptTag({ path: resolve(rootDir, 'dist', 'apexcharts.js') })
    await loadCanvasFeature(page)
    const state = {}
    for (const renderer of ['svg', 'canvas']) {
      await page.evaluate(async (renderer) => {
        if (window.chart) window.chart.destroy()
        window.chart = new window.ApexCharts(document.querySelector('#stage'), {
          chart: {
            type: 'bar',
            height: 350,
            renderer,
            animations: { enabled: false },
          },
          plotOptions: { bar: { horizontal: true } },
          tooltip: { shared: false, intersect: true },
          series: [{ name: 'A', data: [400, 430, 448, 470, 540, 580] }],
          xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'], max: 450 },
          grid: { padding: { right: 120 } },
        })
        await window.chart.render()
      }, renderer)
      await page.waitForTimeout(150)
      // 15px right of the plot, on the rows of the bars that run past it
      const rows = await page.evaluate(() => {
        const w = window.chart.w
        const box = w.dom.Paper.node.getBoundingClientRect()
        const x = box.left + w.layout.translateX + w.layout.gridWidth + 15
        const row = w.layout.gridHeight / 6
        return [3, 4, 5].map((j) => ({
          x: Math.round(x),
          y: Math.round(box.top + w.layout.translateY + row * (j + 0.5)),
        }))
      })
      state[renderer] = []
      for (const p of rows) {
        await hover(page, p)
        state[renderer].push((await readTooltip(page)).active)
      }
    }
    expect(state.svg).toEqual([false, false, false])
    expect(state.canvas).toEqual(state.svg)
  })
})
