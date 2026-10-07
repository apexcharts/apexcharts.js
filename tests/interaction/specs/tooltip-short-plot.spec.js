/**
 * On a short plot the hover tooltip sits directly above the hovered mark,
 * chart type by chart type.
 *
 * Beside the point is the right place for a tooltip until the plot is about as
 * short as the box is tall (a sparkline, a strip in a dashboard, a chart whose
 * shared card has a row per series). From there a box beside the point covers
 * the plot from top to bottom, so it goes directly above what it captions
 * instead, the arrow tip touching it: everything below the mark stays in view,
 * and the box may stick out of the plot and the chart to do so. "Short" means
 * the box is at least 0.78 of the plot's height (SHORT_PLOT_RATIO).
 *
 * What the box sits above depends on what is hovered:
 *   - a single point: its hover marker (or the hover dot drawn for a line with
 *     no markers),
 *   - a shared tooltip over points: the topmost point of the column, so the
 *     box covers none of them,
 *   - a bar: the hovered bar; shared columns: every bar at that index; a
 *     horizontal shared row: the whole row,
 *   - a heatmap or treemap cell: the cell,
 *   - followCursor: the pointer itself.
 *
 * Every chart type reaches its tooltip through a different positioning path
 * (the shared sticky path for line, area and shared columns, the marker paths,
 * the intersect bar path, the horizontal-row placement, the heatmap arrow
 * placement, the legacy beside-the-cell placement treemaps use, the pointer
 * path for followCursor), and each had to be wired separately. So each case
 * here mounts a short chart of one type below a 250px spacer, hovers it with
 * the real mouse, and checks the same contract against the mark as it is
 * drawn on screen:
 *
 *   - the tooltip is shown and `data-placement` is 'top',
 *   - the box's bottom is exactly 7px (the arrow's overhang) above the mark's
 *     top, so it covers none of the mark,
 *   - the arrow tip (box left + `--apx-tt-arrow-x`) is on the mark's centre
 *     (or the pointer, for followCursor),
 *   - the box is inside the viewport horizontally, even when it is wider than
 *     the chart.
 *
 * With no room above (the chart at the top of the viewport) the box goes
 * directly below the mark instead, 7px off it, or 24px off a pointer so the
 * cursor graphic does not cover it. tooltip-short-plot-room.spec.js covers
 * what "room" means in detail.
 *
 * Then the boundaries of the rule: a fixed tooltip is never moved, a compact
 * box small enough to fit beside the point stays there, full-size line and
 * column charts keep their left/right placement inside the plot, and a tall
 * plot whose box finds no room beside the hovered row keeps the placement a
 * tall plot gives it. Two regressions follow, for callers that hand over a box y
 * already shifted away from the point (the no-arrow intersect lift,
 * followCursor): the stand-off must not depend on it. The last cases run the
 * shipped sparklines and synced-charts demos.
 */

import { test as base, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const BUNDLE = resolve(rootDir, 'dist/apexcharts.js')
const SPARKLINES_DEMO = resolve(
  rootDir,
  'samples/vanilla-js/sparklines/sparklines.html',
)
const SYNCING_DEMO = resolve(
  rootDir,
  'samples/vanilla-js/line/syncing-charts.html',
)

/**
 * ARROW_TIP_OVERHANG + POINT_TIP_GAP: the space between a mark and a box
 * placed above (or below) it, so the arrow tip just touches the mark.
 */
const GAP = 7

/**
 * POINTER_CLEARANCE_BELOW: under the pointer the box clears the cursor
 * graphic, which hangs below the hotspot.
 */
const POINTER_GAP_BELOW = 24

/** Tolerance on every stand-off, for subpixel layout. */
const GAP_TOLERANCE = 1.5

/** Tolerance on the arrow tip landing on its anchor. */
const ARROW_TOLERANCE = 2

/** Same as SHORT_PLOT_RATIO in src/modules/tooltip/constants.js. */
const SHORT_PLOT_RATIO = 0.78

// The base fixture only watches for page errors through `loadChart`; most
// charts here are mounted by hand, so watch every page.
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
 * Mount one chart below a spacer, so there is plenty of room above it, and
 * 300px in from the left, so a box wider than a sparkline can centre on its
 * anchor without being clamped. `optsSrc` is eval'ed in the page so
 * formatter functions survive.
 */
async function mount(page, optsSrc, { width = 600, spacer = 250 } = {}) {
  await page.setContent(`<!doctype html>
    <body style="margin:0">
      <div style="height:${spacer}px"></div>
      <div id="stage" style="width:${width}px;margin-left:300px"></div>
    </body>`)
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate((src) => {
    const opts = eval(`(${src})`)
    window.chart = new window.ApexCharts(document.querySelector('#stage'), opts)
    return window.chart.render()
  }, optsSrc)
  // Heatmaps and treemaps drawn without animation never raise
  // `animationEnded`; for them the resolved render() above is the signal.
  await page.waitForFunction(
    () =>
      window.chart.w.globals.animationEnded === true ||
      ['heatmap', 'treemap'].includes(window.chart.w.config.chart.type),
    null,
    { timeout: 10_000 },
  )
  await page.waitForTimeout(50)
}

/**
 * Real pointer moves: land 1px short, then on the target (the first entry
 * into a chart can be handled before its hover state is primed), then wait
 * out the 160ms left/top transition.
 */
async function hover(page, x, y) {
  await page.mouse.move(x - 1, y)
  await page.waitForTimeout(120)
  await page.mouse.move(x, y)
  await page.waitForTimeout(300)
}

/** Move off every chart so the next hover starts fresh. */
async function leave(page) {
  await page.mouse.move(2, 2)
  await page.waitForTimeout(250)
}

/** Plot rect of `window[chartVar]` in viewport px. */
function plotRect(page, chartVar = 'chart') {
  return page.evaluate((v) => {
    const w = window[v].w
    const r = w.dom.elWrap.getBoundingClientRect()
    const left = r.left + w.layout.translateX
    const top = r.top + w.layout.translateY
    return {
      left,
      top,
      right: left + w.layout.gridWidth,
      bottom: top + w.layout.gridHeight,
      height: w.layout.gridHeight,
    }
  }, chartVar)
}

/**
 * The mark as drawn: the union of every element matching `selector` that
 * has a size (a hidden hover dot has an empty path), in viewport px, plus the
 * individual rects for "covers none of them" checks. Null when none match.
 */
function markOf(page, selector) {
  return page.evaluate((sel) => {
    const rects = Array.from(document.querySelectorAll(sel))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 || r.height > 0)
      .map((r) => ({
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
        cx: (r.left + r.right) / 2,
        cy: (r.top + r.bottom) / 2,
      }))
    if (!rects.length) return null
    const left = Math.min(...rects.map((r) => r.left))
    const right = Math.max(...rects.map((r) => r.right))
    const top = Math.min(...rects.map((r) => r.top))
    const bottom = Math.max(...rects.map((r) => r.bottom))
    return {
      left,
      top,
      right,
      bottom,
      width: right - left,
      height: bottom - top,
      cx: (left + right) / 2,
      cy: (top + bottom) / 2,
      rects,
    }
  }, selector)
}

/** A pointer position as a zero-size mark. */
const pointerMark = (x, y) => ({
  left: x,
  right: x,
  top: y,
  bottom: y,
  width: 0,
  height: 0,
  cx: x,
  cy: y,
  rects: [],
})

/**
 * Selector of series `s`'s hover dot: the one path a line or area with no
 * visible markers draws at the hovered point.
 */
const dotSel = (scope, s) =>
  `${scope} .apexcharts-series[data\\:realIndex="${s}"] .apexcharts-series-markers path`

/** Selector of series `s`'s marker at index `j` (visible markers, scatter). */
const markerSel = (scope, s, j) =>
  `${scope} .apexcharts-series[data\\:realIndex="${s}"] .apexcharts-marker[rel="${j}"]`

/**
 * Everything the assertions need about `window[chartVar]`'s main tooltip and
 * plot, plus the x of the hovered data point on line-like charts (from the
 * points the chart drew, at the index the tooltip captioned).
 */
function readTooltip(page, chartVar = 'chart') {
  return page.evaluate((v) => {
    const w = window[v].w
    const wrap = w.dom.elWrap.getBoundingClientRect()
    const tt = w.dom.elWrap.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    const b = tt.getBoundingClientRect()
    const arrowRaw = tt.style.getPropertyValue('--apx-tt-arrow-x')
    const j = w.interact.capturedDataPointIndex
    const pts = w.globals.pointsArray
    const pt = pts && pts[0] && j >= 0 ? pts[0][j] : null
    const plotLeft = wrap.left + w.layout.translateX
    const plotTop = wrap.top + w.layout.translateY
    return {
      active: tt.classList.contains('apexcharts-active'),
      placement: tt.dataset.placement ?? null,
      arrowX: arrowRaw ? parseFloat(arrowRaw) : null,
      hasArrowEl: !!tt.querySelector('.apexcharts-tooltip-arrow'),
      box: {
        left: b.left,
        top: b.top,
        right: b.right,
        bottom: b.bottom,
        width: b.width,
        height: b.height,
      },
      plot: {
        left: plotLeft,
        top: plotTop,
        right: plotLeft + w.layout.gridWidth,
        bottom: plotTop + w.layout.gridHeight,
        height: w.layout.gridHeight,
      },
      wrap: { left: wrap.left, top: wrap.top, svgWidth: w.globals.svgWidth },
      j,
      pointX: pt ? plotLeft + pt[0] : null,
      viewportWidth: document.documentElement.clientWidth,
      viewportHeight: document.documentElement.clientHeight,
    }
  }, chartVar)
}

/** A compact one-line dump for assertion messages. */
function describe(t, mark = null) {
  const r = (n) => (n == null ? n : Math.round(n * 10) / 10)
  return (
    `placement=${t.placement} active=${t.active} arrowX=${r(t.arrowX)} ` +
    `box=[${r(t.box.left)},${r(t.box.top)} ${r(t.box.width)}x${r(t.box.height)}] ` +
    `plot=[${r(t.plot.left)},${r(t.plot.top)}..${r(t.plot.right)},${r(t.plot.bottom)}] ` +
    `ratio=${r(t.box.height / t.plot.height)}` +
    (mark
      ? ` mark=[${r(mark.left)},${r(mark.top)}..${r(mark.right)},${r(mark.bottom)}]`
      : '')
  )
}

/** The arrow tip, or the box itself, lands on `anchorX`. */
function expectOnAnchor(t, info, anchorX, centreOnAnchor) {
  if (t.arrowX != null) {
    const tip = t.box.left + t.arrowX
    expect(
      Math.abs(tip - anchorX),
      `${info}\narrow tip at ${tip}, anchor at ${anchorX}`,
    ).toBeLessThanOrEqual(ARROW_TOLERANCE)
  }
  if (centreOnAnchor) {
    const centre = (t.box.left + t.box.right) / 2
    expect(
      Math.abs(centre - anchorX),
      `${info}\nbox centre at ${centre}, anchor at ${anchorX}`,
    ).toBeLessThanOrEqual(ARROW_TOLERANCE)
  }
  expect(
    t.box.left,
    `${info}\nbox inside the viewport (left)`,
  ).toBeGreaterThanOrEqual(-0.5)
  expect(
    t.box.right,
    `${info}\nbox inside the viewport (right)`,
  ).toBeLessThanOrEqual(t.viewportWidth + 0.5)
}

/**
 * The contract every short chart with room above has to meet: the box sits
 * directly above `mark` (viewport px), `gap` px off its top, covering none of
 * it (nor any of `mark.rects`, the separate points or bars of a shared
 * column). `anchorX` is where the arrow points (default: the mark's centre);
 * `centreOnAnchor` also requires the box itself to be centred there.
 */
function expectAboveMark(
  t,
  mark,
  label,
  { gap = GAP, anchorX = mark.cx, centreOnAnchor = false } = {},
) {
  const info = `${label}: ${describe(t, mark)}`
  expect(t.active, `${info}\ntooltip shown`).toBe(true)
  expect(t.placement, `${info}\nplacement`).toBe('top')
  expect(
    Math.abs(mark.top - t.box.bottom - gap),
    `${info}\nstand-off above the mark (${mark.top - t.box.bottom}px, want ${gap})`,
  ).toBeLessThanOrEqual(GAP_TOLERANCE)
  expect(
    t.box.bottom,
    `${info}\nthe box does not cover the mark`,
  ).toBeLessThanOrEqual(mark.top + 0.5)
  for (const r of mark.rects || []) {
    expect(
      t.box.bottom,
      `${info}\nthe box covers no point at this index (one at top ${r.top})`,
    ).toBeLessThanOrEqual(r.top + 0.5)
  }
  expectOnAnchor(t, info, anchorX, centreOnAnchor)
}

/** Directly below `mark`, `gap` px off its bottom. */
function expectBelowMark(
  t,
  mark,
  label,
  { gap = GAP, anchorX = mark.cx, centreOnAnchor = false } = {},
) {
  const info = `${label}: ${describe(t, mark)}`
  expect(t.active, `${info}\ntooltip shown`).toBe(true)
  expect(t.placement, `${info}\nplacement`).toBe('bottom')
  expect(
    Math.abs(t.box.top - mark.bottom - gap),
    `${info}\nstand-off below the mark (${t.box.top - mark.bottom}px, want ${gap})`,
  ).toBeLessThanOrEqual(GAP_TOLERANCE)
  expect(
    t.box.top,
    `${info}\nthe box does not cover the mark`,
  ).toBeGreaterThanOrEqual(mark.bottom - 0.5)
  expectOnAnchor(t, info, anchorX, centreOnAnchor)
}

/** The fixture really is a short plot for its tooltip. */
function expectShortPlot(t, label) {
  expect(
    t.box.height / t.plot.height,
    `${label} fixture is short: ${describe(t)}`,
  ).toBeGreaterThanOrEqual(SHORT_PLOT_RATIO)
}

// Same tooltip config as the sparklines demo's table charts: no x title, an
// empty series name, no marker, so the card is a single value.
const SPARK_TOOLTIP = `{
  x: { show: false },
  y: { title: { formatter: function () { return '' } } },
  marker: { show: false },
}`
const SPARK_DATA = '[25, 66, 41, 89, 63, 25, 44, 12, 36, 9, 54]'

const LINE_SPARK = (
  tooltip = SPARK_TOOLTIP,
  size = 'width: 100, height: 35',
) => `{
  chart: {
    type: 'line', ${size},
    sparkline: { enabled: true },
    animations: { enabled: false },
  },
  stroke: { width: 3 },
  series: [{ data: ${SPARK_DATA} }],
  tooltip: ${tooltip},
}`

test.describe('Short plots: the tooltip sits directly above the hovered mark', () => {
  test('line sparkline 100x35: just above the hover dot, arrow on it, follows it', async ({
    page,
  }) => {
    await mount(page, LINE_SPARK(), { width: 100 })
    const plot = await plotRect(page)

    const seen = []
    for (const f of [0.2, 0.5, 0.8]) {
      await hover(
        page,
        plot.left + (plot.right - plot.left) * f,
        (plot.top + plot.bottom) / 2,
      )
      const t = await readTooltip(page)
      const dot = await markOf(page, dotSel('#stage', 0))
      expect(dot, `hover dot drawn at ${f}`).not.toBeNull()
      expect(t.pointX, `point under ${f}`).not.toBeNull()
      expect(Math.abs(dot.cx - t.pointX), 'dot on the point').toBeLessThan(1)
      expectShortPlot(t, `line sparkline at ${f}`)
      // The same 7px stand-off at every point, high or low: it is measured
      // from the hovered point's dot, not from the plot.
      expectAboveMark(t, dot, `line sparkline at ${f}`)
      seen.push({ t, dot })
    }

    // Three different points, and the box moved with each: sideways, centred
    // on the point every time (there is room on both sides, so nothing is
    // clamped), and up and down with the point's height.
    expect(new Set(seen.map(({ t }) => t.j)).size).toBe(3)
    for (let i = 1; i < seen.length; i++) {
      expect(seen[i].t.box.left).toBeGreaterThan(seen[i - 1].t.box.left + 5)
    }
    expect(
      new Set(seen.map(({ dot }) => Math.round(dot.top))).size,
      'the fixture hovers points at different heights',
    ).toBe(3)
    for (const { t, dot } of seen) {
      const centre = (t.box.left + t.box.right) / 2
      expect(
        Math.abs(centre - dot.cx),
        `box centre ${centre} vs point ${dot.cx}`,
      ).toBeLessThanOrEqual(1.5)
    }
  })

  test('area sparkline 200x50, two series, shared: above the higher of the two dots', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: {
          type: 'area', width: 200, height: 50,
          sparkline: { enabled: true },
          animations: { enabled: false },
        },
        series: [
          { name: 'Sales', data: [31, 40, 33, 52, 46, 58, 49, 61, 55, 70] },
          { name: 'Costs', data: [28, 34, 30, 41, 37, 33, 45, 40, 52, 47] },
        ],
        tooltip: { shared: true },
      }`,
      { width: 200 },
    )
    const plot = await plotRect(page)
    await hover(
      page,
      plot.left + (plot.right - plot.left) * 0.45,
      plot.bottom - 8,
    )
    const t = await readTooltip(page)
    const column = await markOf(
      page,
      `${dotSel('#stage', 0)}, ${dotSel('#stage', 1)}`,
    )
    expect(column?.rects.length, 'both hover dots drawn').toBe(2)

    // A shared card over several series draws no arrow element.
    expect(t.hasArrowEl).toBe(false)
    expectShortPlot(t, 'area sparkline')
    expectAboveMark(t, column, 'area sparkline', { anchorX: t.pointX })
  })

  test('bar sparkline 100x35, intersect: just above the hovered bar, arrow on it', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: {
          type: 'bar', width: 100, height: 35,
          sparkline: { enabled: true },
          animations: { enabled: false },
        },
        series: [{ data: ${SPARK_DATA} }],
        tooltip: ${SPARK_TOOLTIP},
      }`,
      { width: 100 },
    )
    // The tallest bar (89, its top on the plot's top) and a short one (12).
    for (const k of [3, 7]) {
      const sel = `#stage .apexcharts-bar-area[j="${k}"]`
      let bar = await markOf(page, sel)
      expect(bar, `bar ${k} rendered`).not.toBeNull()
      // Inside the bar, near its foot (the short bars are only a few px tall).
      await hover(page, bar.cx, bar.bottom - Math.min(3, bar.height / 2))
      const t = await readTooltip(page)
      bar = await markOf(page, sel)
      expect(t.arrowX, `bar ${k}: arrow offset written`).not.toBeNull()
      expectShortPlot(t, `bar ${k}`)
      expectAboveMark(t, bar, `bar sparkline, bar ${k}`)
      await leave(page)
    }
  })

  test('column sparkline: a short bar between tall ones gets the box right above it', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: {
          type: 'bar', width: 100, height: 35,
          sparkline: { enabled: true },
          animations: { enabled: false },
        },
        series: [{ data: [80, 90, 12, 85, 75, 88] }],
        tooltip: ${SPARK_TOOLTIP},
      }`,
      { width: 100 },
    )
    const sel = '#stage .apexcharts-bar-area[j="2"]'
    let bar = await markOf(page, sel)
    expect(bar, 'short bar rendered').not.toBeNull()
    await hover(page, bar.cx, bar.bottom - Math.min(2, bar.height / 2))
    const t = await readTooltip(page)
    bar = await markOf(page, sel)
    const neighbours = await markOf(
      page,
      '#stage .apexcharts-bar-area[j="1"], #stage .apexcharts-bar-area[j="3"]',
    )
    expect(t.j).toBe(2)
    expectShortPlot(t, 'short bar')
    expectAboveMark(t, bar, 'short bar between tall ones')
    // It is the hovered bar the box sits on, not the tall neighbours: they
    // reach well above the box's bottom.
    expect(
      t.box.bottom,
      `box lower than the neighbours' tops: ${describe(t, bar)} neighbours top ${neighbours.top}`,
    ).toBeGreaterThan(neighbours.top + 5)
  })

  test('column chart 130px with axes, two series, shared: above both bars at the index', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'bar', height: 130, animations: { enabled: false } },
        dataLabels: { enabled: false },
        series: [
          { name: 'Revenue', data: [44, 55, 41, 64, 22, 43] },
          { name: 'Cost', data: [30, 32, 33, 52, 13, 44] },
        ],
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        tooltip: { shared: true, intersect: false },
      }`,
    )
    const plot = await plotRect(page)
    const sel = '#stage .apexcharts-bar-area[j="2"]'
    let col = await markOf(page, sel)
    expect(col.rects.length).toBe(2)
    await hover(page, col.cx, plot.bottom - 4)
    const t = await readTooltip(page)
    col = await markOf(page, sel)
    expect(t.j).toBe(2)
    expectShortPlot(t, 'shared columns')
    expectAboveMark(t, col, 'shared columns')
  })

  for (const shared of [true, false]) {
    test(`horizontal bar 110px, two categories, shared: ${shared}: above the ${shared ? 'row' : 'hovered bar'}`, async ({
      page,
    }) => {
      await mount(
        page,
        `{
          chart: { type: 'bar', height: 110, animations: { enabled: false } },
          plotOptions: { bar: { horizontal: true } },
          dataLabels: { enabled: false },
          series: [
            { name: 'Revenue', data: [44, 55] },
            { name: 'Cost', data: [30, 26] },
          ],
          xaxis: { categories: ['North', 'South'] },
          tooltip: ${shared ? '{ shared: true, intersect: false }' : '{ shared: false, intersect: true }'},
        }`,
      )
      for (const j of [0, 1]) {
        // Hover inside the SHORTER of the row's two bars ('Cost'), near its
        // root: its centre is not the row's, so the two variants point at
        // different x and the test can tell them apart.
        const sel = `#stage .apexcharts-bar-area[j="${j}"]`
        let row = await markOf(page, sel)
        expect(row.rects.length).toBe(2)
        const bar = row.rects[1]
        await hover(page, bar.left + 6, bar.cy)
        const t = await readTooltip(page)
        row = await markOf(page, sel)
        const hovered = row.rects[1]
        expect(Math.abs(row.cx - hovered.cx)).toBeGreaterThan(10)
        expect(t.arrowX, `row ${j}: arrow offset written`).not.toBeNull()
        expectShortPlot(t, `row ${j}`)
        // Shared: above the row (both bars), arrow on its centre. Otherwise
        // above the hovered bar alone.
        expectAboveMark(
          t,
          shared ? row : { ...hovered, rects: [] },
          `horizontal bar row ${j}, shared ${shared}`,
        )
        await leave(page)
      }
    })
  }

  test('one-row heatmap 80px: above the cell, arrow on it', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'heatmap', height: 80, animations: { enabled: false } },
        dataLabels: { enabled: false },
        series: [{
          name: 'Load',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x, i) {
            return { x: x, y: 10 + i * 9 }
          }),
        }],
      }`,
    )
    for (const j of [1, 4]) {
      const sel = `#stage .apexcharts-heatmap-rect[j="${j}"]`
      const cell = await markOf(page, sel)
      expect(cell, `cell ${j} rendered`).not.toBeNull()
      await hover(page, cell.cx, cell.cy)
      const t = await readTooltip(page)
      expect(t.arrowX, `cell ${j}: arrow offset written`).not.toBeNull()
      expectShortPlot(t, `cell ${j}`)
      expectAboveMark(t, await markOf(page, sel), `heatmap cell ${j}`)
      await leave(page)
    }
  })

  test('scatter 120px, intersect: just above the enlarged marker, arrow on it', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'scatter', height: 120, animations: { enabled: false } },
        series: [{
          name: 'Samples',
          data: [[1, 20], [2, 34], [3, 27], [4, 40], [5, 31], [6, 22]],
        }],
        xaxis: { type: 'numeric' },
        yaxis: { min: 0, max: 60 },
      }`,
    )
    // A marker in the lower half: the box comes down to it, into the plot.
    const sel = markerSel('#stage', 0, 2)
    const before = await markOf(page, sel)
    expect(before, 'marker rendered').not.toBeNull()
    await hover(page, before.cx, before.cy)
    const t = await readTooltip(page)
    const marker = await markOf(page, sel)
    expect(t.arrowX, 'arrow offset written').not.toBeNull()
    // The hover grew the marker; the box sits above the grown one.
    expect(marker.height).toBeGreaterThan(before.height)
    expect(marker.cy, 'marker in the lower half').toBeGreaterThan(
      (t.plot.top + t.plot.bottom) / 2,
    )
    expectShortPlot(t, 'scatter')
    expectAboveMark(t, marker, 'scatter marker')
    expect(t.box.bottom, 'the box reaches into the plot').toBeGreaterThan(
      t.plot.top + 10,
    )
  })

  test('bubble 120px, intersect: just above the bubble, arrow on it', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'bubble', height: 120, animations: { enabled: false } },
        dataLabels: { enabled: false },
        series: [{
          name: 'Samples',
          data: [[1, 20, 10], [2, 34, 20], [3, 27, 15], [4, 40, 30], [5, 31, 12], [6, 22, 18]],
        }],
        xaxis: { type: 'numeric', min: 0, max: 7 },
        yaxis: { min: 0, max: 60 },
      }`,
    )
    const sel = markerSel('#stage', 0, 2)
    const before = await markOf(page, sel)
    expect(before, 'bubble rendered').not.toBeNull()
    await hover(page, before.cx, before.cy)
    const t = await readTooltip(page)
    expect(t.arrowX, 'arrow offset written').not.toBeNull()
    expectShortPlot(t, 'bubble')
    // A bubble's radius is its own: the box sits on the bubble as drawn.
    expectAboveMark(t, await markOf(page, sel), 'bubble')
  })

  test('line 120px with followCursor: just above the pointer, centred on it', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'line', height: 120, animations: { enabled: false } },
        series: [
          { name: 'Visitors', data: [31, 40, 28, 51, 42, 60, 49, 62, 45, 70] },
          { name: 'Buyers', data: [11, 32, 25, 32, 34, 22, 30, 34, 25, 30] },
        ],
        yaxis: { min: 0, max: 100 },
        tooltip: { followCursor: true },
      }`,
    )
    const plot = await plotRect(page)
    const seen = []
    for (const f of [0.3, 0.6]) {
      const px = Math.round(plot.left + (plot.right - plot.left) * f)
      const py = plot.bottom - 6
      await hover(page, px, py)
      const t = await readTooltip(page)
      expectShortPlot(t, `followCursor at ${f}`)
      // The pointer is near the plot's bottom, so the y this path hands over
      // is already lifted by the box's height; the stand-off must not see it.
      // No clamp is in play (the page is wide), so the box itself centres on
      // the pointer.
      expectAboveMark(t, pointerMark(px, py), `followCursor at ${f}`, {
        centreOnAnchor: true,
      })
      seen.push(t)
    }
    expect(seen[1].box.left).toBeGreaterThan(seen[0].box.left)
  })

  test('line 120px with followCursor at the viewport top: below the pointer, clear of the cursor', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'line', height: 120, animations: { enabled: false } },
        series: [
          { name: 'Visitors', data: [31, 40, 28, 51, 42, 60, 49, 62, 45, 70] },
          { name: 'Buyers', data: [11, 32, 25, 32, 34, 22, 30, 34, 25, 30] },
        ],
        yaxis: { min: 0, max: 100 },
        tooltip: { followCursor: true },
      }`,
      { spacer: 0 },
    )
    const plot = await plotRect(page)
    const px = Math.round(plot.left + (plot.right - plot.left) * 0.4)
    const py = Math.round(plot.top + 6)
    await hover(page, px, py)
    const t = await readTooltip(page)
    expectShortPlot(t, 'followCursor at the top')
    // The premise: no room above the pointer.
    expect(py - GAP - t.box.height, describe(t)).toBeLessThan(0)
    // Below a pointer the box clears the cursor graphic, not just the arrow.
    expectBelowMark(t, pointerMark(px, py), 'followCursor at the top', {
      gap: POINTER_GAP_BELOW,
      centreOnAnchor: true,
    })
  })

  test('treemap: beside the tile at 90px; at 70px above the pointer, or the tile without followCursor', async ({
    page,
  }) => {
    const TREEMAP = (height, tooltip = '{}') => `{
      chart: { type: 'treemap', height: ${height}, animations: { enabled: false } },
      legend: { show: false },
      series: [{
        data: [
          { x: 'Alpha', y: 60 }, { x: 'Beta', y: 40 }, { x: 'Gamma', y: 30 },
          { x: 'Delta', y: 20 }, { x: 'Epsilon', y: 12 },
        ],
      }],
      tooltip: ${tooltip},
    }`
    const TILE = '#stage .apexcharts-treemap-rect[j="0"]'

    // 90px leaves a 70px plot, and the two-line card is about 0.6 of that:
    // below the cut, so the box keeps its place level with the tile, and
    // this path writes no placement at all.
    await mount(page, TREEMAP(90))
    let tile = await markOf(page, TILE)
    expect(tile, 'tile rendered').not.toBeNull()
    await hover(page, tile.cx, tile.cy)
    let t = await readTooltip(page)
    const info = `treemap 90: ${describe(t)}`
    expect(t.active, info).toBe(true)
    expect(t.box.height / t.plot.height, info).toBeLessThan(SHORT_PLOT_RATIO)
    expect(t.placement, info).toBeNull()
    expect(t.box.top, info).toBeGreaterThanOrEqual(t.plot.top - 1)

    // 70px leaves a 50px plot, which the card nearly fills. A treemap
    // follows the cursor by default, so the box sits on the pointer.
    await mount(page, TREEMAP(70))
    tile = await markOf(page, TILE)
    expect(tile, 'tile rendered').not.toBeNull()
    expect(
      await page.evaluate(() => window.chart.w.config.tooltip.followCursor),
      'treemaps follow the cursor by default',
    ).toBe(true)
    for (const dy of [-10, 10]) {
      const p = { x: Math.round(tile.cx), y: Math.round(tile.cy + dy) }
      await hover(page, p.x, p.y)
      t = await readTooltip(page)
      expectShortPlot(t, `treemap 70, pointer ${dy}`)
      expectAboveMark(
        t,
        pointerMark(p.x, p.y),
        `treemap 70, pointer at the tile centre ${dy > 0 ? '+' : ''}${dy}`,
        { centreOnAnchor: true },
      )
    }
    await leave(page)

    // Without followCursor the legacy path places it on the tile.
    await mount(page, TREEMAP(70, '{ followCursor: false }'))
    tile = await markOf(page, TILE)
    await hover(page, tile.cx, tile.cy + 10)
    t = await readTooltip(page)
    expectShortPlot(t, 'treemap 70, no followCursor')
    expectAboveMark(t, tile, 'treemap 70, no followCursor, tile 0', {
      centreOnAnchor: true,
    })
  })

  test('tooltip.arrow:false line sparkline: just above the dot all the same', async ({
    page,
  }) => {
    await mount(
      page,
      LINE_SPARK(`{
        arrow: false,
        x: { show: false },
        y: { title: { formatter: function () { return '' } } },
        marker: { show: false },
      }`),
      { width: 100 },
    )
    const plot = await plotRect(page)
    await hover(page, plot.left + 50, (plot.top + plot.bottom) / 2)
    const t = await readTooltip(page)
    expect(t.hasArrowEl).toBe(false)
    expectShortPlot(t, 'arrow:false')
    // No arrow is drawn, and the stand-off is the same as with one.
    expectAboveMark(t, await markOf(page, dotSel('#stage', 0)), 'arrow:false', {
      centreOnAnchor: true,
    })
  })

  test('shared line 110px: the box sits above the higher point and covers neither', async ({
    page,
  }) => {
    // Index 3: series 0 high, series 1 low. Index 6: the other way round.
    // With visible markers the marker path hands over the LAST series' point,
    // with none the dynamic-point path hands over the FIRST: either way the
    // box has to clear the whole column.
    for (const size of [0, 4]) {
      await mount(
        page,
        `{
          chart: { type: 'line', height: 110, animations: { enabled: false } },
          markers: { size: ${size} },
          series: [
            { name: 'High at 3', data: [30, 45, 50, 95, 40, 35, 5, 30] },
            { name: 'Low at 3', data: [20, 25, 30, 5, 20, 30, 95, 25] },
          ],
          xaxis: { categories: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
          yaxis: { min: 0, max: 100 },
          // No legend, so the 110px leave a plot tall enough for the two
          // points to be far apart.
          legend: { show: false },
          tooltip: { shared: true, intersect: false },
        }`,
      )
      const plot = await plotRect(page)
      for (const [j, high] of [
        [3, 0],
        [6, 1],
      ]) {
        const x = plot.left + ((plot.right - plot.left) * j) / 7
        await hover(page, x, (plot.top + plot.bottom) / 2)
        const t = await readTooltip(page)
        expect(t.j).toBe(j)
        const sel = (s) =>
          size ? markerSel('#stage', s, j) : dotSel('#stage', s)
        const hi = await markOf(page, sel(high))
        const lo = await markOf(page, sel(1 - high))
        const label = `markers ${size}, index ${j}`
        expect(hi, `${label}: high point drawn`).not.toBeNull()
        expect(lo, `${label}: low point drawn`).not.toBeNull()
        // Clearly apart, so a box sat on the low point would cover the high
        // one.
        expect(
          lo.top - hi.bottom,
          `${label}: points far apart`,
        ).toBeGreaterThan(10)
        expectShortPlot(t, label)
        expectAboveMark(
          t,
          { ...hi, rects: [hi, lo] },
          `${label} (high point top ${Math.round(hi.top * 10) / 10}, low point top ${Math.round(lo.top * 10) / 10})`,
        )
        await leave(page)
      }
    }
  })

  test('a point on the top of the plot near the viewport top: the box goes below it', async ({
    page,
  }) => {
    // 20px of page above the chart: a box above the topmost point would
    // start above the viewport, so it goes below the marker instead.
    await mount(
      page,
      `{
        chart: { type: 'line', height: 110, animations: { enabled: false } },
        markers: { size: 4 },
        series: [{ name: 'Visitors', data: [30, 50, 100, 40, 60, 20] }],
        xaxis: { categories: ['A', 'B', 'C', 'D', 'E', 'F'] },
        yaxis: { min: 0, max: 100 },
      }`,
      { spacer: 20 },
    )
    const plot = await plotRect(page)
    const sel = markerSel('#stage', 0, 2)
    const before = await markOf(page, sel)
    expect(
      Math.abs(before.cy - plot.top),
      'the point is on the plot top',
    ).toBeLessThan(1)
    await hover(page, before.cx, before.cy + 4)
    const t = await readTooltip(page)
    const marker = await markOf(page, sel)
    expect(t.j).toBe(2)
    expectShortPlot(t, 'top point')
    // The premise: no room above.
    expect(marker.top - GAP - t.box.height, describe(t, marker)).toBeLessThan(0)
    expectBelowMark(t, marker, 'top point near the viewport top')
    expect(t.box.bottom, 'inside the viewport').toBeLessThanOrEqual(
      t.viewportHeight + 0.5,
    )
  })
})

test.describe('Short plots: what must not move', () => {
  test('a fixed tooltip stays in its corner', async ({ page }) => {
    await mount(
      page,
      LINE_SPARK(`{
        fixed: { enabled: true },
        x: { show: false },
        y: { title: { formatter: function () { return '' } } },
        marker: { show: false },
      }`),
      { width: 100 },
    )
    const plot = await plotRect(page)
    await hover(page, plot.left + 50, (plot.top + plot.bottom) / 2)
    const t = await readTooltip(page)
    const info = describe(t)
    expect(t.active, info).toBe(true)
    // Short enough that an unfixed box would have moved over the point.
    expect(t.box.height / t.plot.height, info).toBeGreaterThanOrEqual(
      SHORT_PLOT_RATIO,
    )
    expect(['top', 'bottom'], info).not.toContain(t.placement)
    // fixed.position defaults to 'topRight': the box's top-right corner on the
    // chart's top-right corner.
    expect(Math.abs(t.box.top - t.wrap.top), info).toBeLessThanOrEqual(1)
    expect(
      Math.abs(t.box.right - (t.wrap.left + t.wrap.svgWidth)),
      info,
    ).toBeLessThanOrEqual(1)
  })

  test('a compact box that fits beside the point stays beside it', async ({
    page,
  }) => {
    await mount(
      page,
      LINE_SPARK(
        `{
          compact: true,
          x: { show: false },
          y: { title: { formatter: function () { return '' } } },
          marker: { show: false },
        }`,
        'width: 200, height: 35',
      ),
      { width: 200 },
    )
    const plot = await plotRect(page)
    for (const f of [0.25, 0.75]) {
      await hover(page, plot.left + 200 * f, (plot.top + plot.bottom) / 2)
      const t = await readTooltip(page)
      const info = `compact at ${f}: ${describe(t)}`
      expect(t.active, info).toBe(true)
      // The premise: below the 0.78 cut, so this is not a short plot for it.
      expect(t.box.height / t.plot.height, info).toBeLessThan(SHORT_PLOT_RATIO)
      expect(['left', 'right'], info).toContain(t.placement)
      expect(t.box.bottom, info).toBeGreaterThan(t.plot.top + 1)
    }
  })

  test('full-size line and column charts keep their in-plot placement', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'line', height: 350, animations: { enabled: false } },
        series: [
          { name: 'Visitors', data: [31, 40, 28, 51, 42, 60, 49, 62, 45, 70] },
          { name: 'Buyers', data: [11, 32, 25, 32, 34, 22, 30, 34, 25, 30] },
        ],
      }`,
    )
    let plot = await plotRect(page)
    for (const f of [0.25, 0.75]) {
      await hover(
        page,
        plot.left + (plot.right - plot.left) * f,
        (plot.top + plot.bottom) / 2,
      )
      const t = await readTooltip(page)
      const info = `line 350 at ${f}: ${describe(t)}`
      expect(t.active, info).toBe(true)
      expect(['left', 'right'], info).toContain(t.placement)
      expect(t.box.top, info).toBeGreaterThanOrEqual(t.plot.top - 1)
      expect(t.box.bottom, info).toBeLessThanOrEqual(t.plot.bottom + 1)
    }

    await mount(
      page,
      `{
        chart: { type: 'bar', height: 350, animations: { enabled: false } },
        dataLabels: { enabled: false },
        series: [{ name: 'Revenue', data: [44, 55, 41, 64, 22, 43] }],
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
      }`,
    )
    plot = await plotRect(page)
    for (const k of [1, 4]) {
      const bar = await markOf(page, `#stage .apexcharts-bar-area[j="${k}"]`)
      await hover(page, bar.cx, bar.bottom - 10)
      const t = await readTooltip(page)
      const info = `column 350, bar ${k}: ${describe(t)}`
      expect(t.active, info).toBe(true)
      expect(['left', 'right'], info).toContain(t.placement)
      expect(t.box.top, info).toBeGreaterThanOrEqual(t.plot.top - 1)
      expect(t.box.bottom, info).toBeLessThanOrEqual(t.plot.bottom + 1)
      await leave(page)
    }
  })
})

/** Union rect of every element matching `selector`, in viewport px. */
function unionRect(page, selector) {
  return page.evaluate((sel) => {
    const rs = Array.from(document.querySelectorAll(sel)).map((el) =>
      el.getBoundingClientRect(),
    )
    if (!rs.length) return null
    const left = Math.min(...rs.map((r) => r.left))
    const right = Math.max(...rs.map((r) => r.right))
    const top = Math.min(...rs.map((r) => r.top))
    const bottom = Math.max(...rs.map((r) => r.bottom))
    return {
      left,
      right,
      top,
      bottom,
      cx: (left + right) / 2,
      cy: (top + bottom) / 2,
      // The first match, which is what the test hovers: a box plot draws a
      // row as two halves, so the union's centre can sit on their seam.
      first: (() => {
        const r = rs[0]
        return { cx: (r.left + r.right) / 2, cy: (r.top + r.bottom) / 2 }
      })(),
    }
  }, selector)
}

/**
 * The premise of every case below: a tall plot (the box is well under the
 * short-plot cut) and a hovered row with no room for the box inside the plot,
 * either above or below it. The short-plot rule must not apply to it.
 */
function expectTallPlotNoRoomBesideRow(t, row, label) {
  const info = `${label}: ${describe(t)} row=[${Math.round(row.top)}..${Math.round(row.bottom)}]`
  expect(t.active, `${info}\ntooltip shown`).toBe(true)
  expect(
    t.box.height / t.plot.height,
    `${info}\nnot a short plot`,
  ).toBeLessThan(SHORT_PLOT_RATIO)
  expect(
    row.top - GAP - t.box.height,
    `${info}\nno room above the row inside the plot`,
  ).toBeLessThan(t.plot.top)
  expect(
    row.bottom + GAP + t.box.height,
    `${info}\nno room below the row inside the plot`,
  ).toBeGreaterThan(t.plot.bottom)
}

/** The box overlaps the plot vertically: inside it, or partly inside. */
function expectOverlapsPlot(t, label) {
  const info = `${label}: ${describe(t)}`
  expect(
    t.box.bottom,
    `${info}\nbox not wholly above the plot`,
  ).toBeGreaterThan(t.plot.top + 1)
  expect(t.box.top, `${info}\nbox not wholly below the plot`).toBeLessThan(
    t.plot.bottom - 1,
  )
}

test.describe('Short plots: tall plots keep their in-plot placement', () => {
  test('horizontal boxPlot 350px, middle row: above the row where the page has room, below it where it has not', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'boxPlot', height: 350, animations: { enabled: false } },
        plotOptions: { bar: { horizontal: true } },
        series: [{
          name: 'Spread',
          data: [
            { x: 'North', y: [10, 20, 30, 40, 50] },
            { x: 'South', y: [12, 22, 32, 42, 52] },
            { x: 'East', y: [14, 24, 34, 44, 54] },
            { x: 'West', y: [16, 26, 36, 46, 56] },
            { x: 'Central', y: [18, 28, 38, 48, 58] },
          ],
        }],
      }`,
    )
    const rowSel = '#stage .apexcharts-boxPlot-area[j="2"]'
    let row = await unionRect(page, rowSel)
    expect(row, 'middle row rendered').not.toBeNull()
    await hover(page, row.first.cx, row.first.cy)
    let t = await readTooltip(page)

    expectTallPlotNoRoomBesideRow(t, row, 'boxPlot')
    expectOverlapsPlot(t, 'boxPlot')
    // The whiskers span most of the plot, so the box fits beside the row no
    // better than above or below it. It goes above the row, past the plot's
    // top, as the page has room there.
    expect(t.placement, describe(t)).toBe('top')
    expect(t.box.bottom, describe(t)).toBeLessThanOrEqual(row.top + 1)

    // Scrolled until the chart's top is past the viewport's, the page has no
    // room above the row any more. The box used to stay above it all the
    // same, off the top of the screen; it goes below the row instead.
    await leave(page)
    await page.evaluate(() => {
      document.body.style.minHeight = '3000px'
      window.scrollTo(0, 290)
    })
    row = await unionRect(page, rowSel)
    expect(
      row.top - GAP - t.box.height,
      `no room above the row on screen: row top ${row.top}`,
    ).toBeLessThan(0)
    await hover(page, row.first.cx, row.first.cy)
    t = await readTooltip(page)
    const info = `scrolled: ${describe(t)} row=[${Math.round(row.top)}..${Math.round(row.bottom)}]`
    expect(t.active, info).toBe(true)
    expect(t.placement, info).toBe('bottom')
    expect(t.box.top, info).toBeGreaterThanOrEqual(row.bottom - 1)
    expect(t.box.top, info).toBeGreaterThanOrEqual(-0.5)
    expect(t.box.bottom, info).toBeLessThanOrEqual(t.viewportHeight + 0.5)
  })

  test('5-row heatmap 270px with a 4-line card, middle row: beside the cell, inside the plot', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'heatmap', height: 270, animations: { enabled: false } },
        dataLabels: { enabled: false },
        series: ['R1', 'R2', 'R3', 'R4', 'R5'].map(function (name, s) {
          return {
            name: name,
            data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(function (x, i) {
              return { x: x, y: 10 + i * 9 + s * 3 }
            }),
          }
        }),
        tooltip: {
          y: {
            formatter: function (v) {
              return v + '<br>second line<br>third line<br>fourth line'
            },
          },
        },
      }`,
    )
    const cell = await markOf(
      page,
      '#stage .apexcharts-heatmap-rect[i="2"][j="3"]',
    )
    expect(cell, 'middle cell rendered').not.toBeNull()
    await hover(page, cell.cx, cell.cy)
    const t = await readTooltip(page)

    expectTallPlotNoRoomBesideRow(t, cell, 'heatmap')
    // Beside the cell, arrow on its middle, all inside the plot. It used to
    // be clamped to the plot top, over the cell, with the arrow on a row
    // above it.
    const info = `${describe(t, cell)}`
    expect(['left', 'right'], info).toContain(t.placement)
    if (t.placement === 'right') {
      expect(t.box.left, info).toBeGreaterThanOrEqual(cell.right + GAP - 1.5)
    } else {
      expect(t.box.right, info).toBeLessThanOrEqual(cell.left - GAP + 1.5)
    }
    expect(t.box.top, info).toBeGreaterThanOrEqual(t.plot.top - GAP_TOLERANCE)
    expect(t.box.bottom, info).toBeLessThanOrEqual(
      t.plot.bottom + GAP_TOLERANCE,
    )
    const arrowY = await page.evaluate(() =>
      parseFloat(
        window.chart.w.dom.elWrap
          .querySelector('.apexcharts-tooltip')
          .style.getPropertyValue('--apx-tt-arrow-y'),
      ),
    )
    expect(
      Math.abs(t.box.top + arrowY - cell.cy),
      `arrow on the cell's middle: arrowY=${arrowY} ${info}`,
    ).toBeLessThanOrEqual(GAP_TOLERANCE)
  })

  test('dumbbell 380px with a tall card, middle row: the box stays above the row', async ({
    page,
  }) => {
    // The dumbbell's own two-line card fits above the row; a taller custom
    // card is what leaves no room on either side.
    await mount(
      page,
      `{
        chart: { type: 'dumbbell', height: 380, animations: { enabled: false } },
        series: [{
          name: 'Range',
          data: [
            { x: 'North', y: [10, 40] },
            { x: 'South', y: [15, 45] },
            { x: 'East', y: [20, 50] },
            { x: 'West', y: [25, 55] },
            { x: 'Central', y: [30, 60] },
          ],
        }],
        tooltip: {
          custom: function () {
            return '<div style="height:170px;width:140px;padding:6px">Range</div>'
          },
        },
      }`,
    )
    expect(
      await page.evaluate(() => window.chart.w.globals.isBarHorizontal),
      'dumbbell draws horizontal rows',
    ).toBe(true)
    const row = await unionRect(page, '#stage .apexcharts-rangebar-area[j="2"]')
    expect(row, 'middle row rendered').not.toBeNull()
    await hover(page, row.first.cx, row.first.cy)
    const t = await readTooltip(page)

    expectTallPlotNoRoomBesideRow(t, row, 'dumbbell')
    expect(['top', 'bottom'], describe(t)).toContain(t.placement)
    expectOverlapsPlot(t, 'dumbbell')
    expect(t.box.bottom, describe(t)).toBeLessThanOrEqual(row.top + 1)
  })
})

test.describe('Short plots: a pre-shifted box y does not move the stand-off', () => {
  test('line 130px, intersect, no arrow: the box sits 7px above the marker', async ({
    page,
  }) => {
    // The no-arrow intersect path hands over a y already lifted by 1.4 box
    // heights above the marker. Deriving the mark from that y would float the
    // box tens of px above the point.
    await mount(
      page,
      `{
        chart: { type: 'line', height: 130, animations: { enabled: false } },
        markers: { size: 4 },
        series: [{ name: 'Visitors', data: [31, 40, 28, 51, 42, 60, 49, 62, 45, 70] }],
        yaxis: { min: 0, max: 100 },
        tooltip: { intersect: true, shared: false, arrow: false },
      }`,
    )
    // The lowest marker (28 on a 0..100 axis).
    const sel = markerSel('#stage', 0, 2)
    const before = await markOf(page, sel)
    expect(before, 'marker rendered').not.toBeNull()
    const plot = await plotRect(page)
    expect(before.cy, 'marker in the lower half').toBeGreaterThan(
      (plot.top + plot.bottom) / 2,
    )
    await hover(page, before.cx, before.cy)
    const t = await readTooltip(page)
    const marker = await markOf(page, sel)

    expectShortPlot(t, 'intersect line, no arrow')
    expect(t.hasArrowEl).toBe(false)
    expect(marker.height, 'the marker grew on hover').toBeGreaterThan(
      before.height,
    )
    expectAboveMark(t, marker, 'intersect line, no arrow', {
      centreOnAnchor: true,
    })
  })

  test('column 140px, shared, followCursor: 7px above the pointer wherever it is', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'bar', height: 140, animations: { enabled: false } },
        dataLabels: { enabled: false },
        series: [
          { name: 'Revenue', data: [44, 55, 41, 64, 22, 43] },
          { name: 'Cost', data: [30, 32, 33, 52, 13, 44] },
        ],
        xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
        tooltip: { shared: true, intersect: false, followCursor: true },
      }`,
    )
    const plot = await plotRect(page)
    const px = Math.round(plot.left + (plot.right - plot.left) * 0.42)
    const seen = []
    // Upper and lower half: below the middle the y this path hands over is
    // already lifted by the box's height.
    for (const f of [0.1, 0.5, 0.9]) {
      const py = Math.round(plot.top + (plot.bottom - plot.top) * f)
      await hover(page, px, py)
      const t = await readTooltip(page)
      expectShortPlot(t, `followCursor columns, pointer at ${f}`)
      expectAboveMark(
        t,
        pointerMark(px, py),
        `followCursor columns, pointer at ${f}`,
      )
      seen.push(t)
    }
    // Same pointer x every time: the box does not drift sideways.
    for (const t of seen.slice(1)) {
      expect(
        Math.abs(t.box.left - seen[0].box.left),
        `box left ${t.box.left} vs ${seen[0].box.left}`,
      ).toBeLessThanOrEqual(0.5)
    }
  })
})

test.describe('Short plots: the shipped demos', () => {
  test('table sparklines show their tooltip just above the hovered mark', async ({
    page,
  }) => {
    await page.goto(`file://${SPARKLINES_DEMO}`)
    await page.waitForFunction(
      () =>
        ['chart1', 'chart5'].every(
          (v) => window[v] && window[v].w.globals.animationEnded === true,
        ),
      null,
      { timeout: 10_000 },
    )

    // #chart-1: a 100x35 line.
    const linePlot = await plotRect(page, 'chart1')
    await hover(
      page,
      linePlot.left + (linePlot.right - linePlot.left) * 0.45,
      (linePlot.top + linePlot.bottom) / 2,
    )
    const line = await readTooltip(page, 'chart1')
    expectAboveMark(
      line,
      await markOf(page, dotSel('#chart-1', 0)),
      '#chart-1 line',
    )
    await leave(page)

    // #chart-5: a 100x35 column sparkline; hover inside one bar.
    const sel = '#chart-5 .apexcharts-bar-area[j="3"]'
    const bar = await markOf(page, sel)
    expect(bar, '#chart-5 bar rendered').not.toBeNull()
    await hover(page, bar.cx, bar.bottom - Math.min(3, bar.height / 2))
    const col = await readTooltip(page, 'chart5')
    expectAboveMark(col, await markOf(page, sel), '#chart-5 bar')
  })

  test('synced 130px charts: every box sits just above its own hovered marker', async ({
    page,
  }) => {
    // The case that set the rule: three synced 130px line/area charts with
    // markers. Hovering one shows a box on all three, and each has to sit
    // right on its own chart's point, not float above its plot.
    await page.goto(`file://${SYNCING_DEMO}`)
    const CHARTS = [
      { v: 'chart', el: '#chart-line' },
      { v: 'chartLine2', el: '#chart-line2' },
      { v: 'chartArea', el: '#chart-area' },
    ]
    await page.waitForFunction(
      (vs) =>
        vs.every(
          (v) => window[v] && window[v].w.globals.animationEnded === true,
        ),
      CHARTS.map((c) => c.v),
      { timeout: 10_000 },
    )

    const plot = await plotRect(page, 'chartLine2')
    await hover(
      page,
      plot.left + (plot.right - plot.left) * 0.47,
      (plot.top + plot.bottom) / 2,
    )

    const hoverSize = await page.evaluate(
      () => window.chartLine2.w.config.markers.hover.size,
    )
    const js = new Set()
    for (const { v, el } of CHARTS) {
      const t = await readTooltip(page, v)
      expect(t.j, `${v}: an index is captioned`).toBeGreaterThanOrEqual(0)
      js.add(t.j)
      const marker = await markOf(page, markerSel(el, 0, t.j))
      expect(marker, `${v}: hovered marker drawn`).not.toBeNull()
      // The enlarged marker, not a resting one.
      expect(
        Math.abs(marker.height - 2 * hoverSize),
        `${v}: marker enlarged to the hover size (${marker.height}px)`,
      ).toBeLessThanOrEqual(1)
      expectShortPlot(t, v)
      expectAboveMark(t, marker, `${v} (${el})`)
    }
    expect(js.size, 'the three charts caption the same index').toBe(1)
  })
})
