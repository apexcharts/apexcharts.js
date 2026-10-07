/**
 * Short charts: which side of the hovered mark the tooltip goes to, and the
 * paths that reach that placement.
 *
 * On a plot about as short as the tooltip is tall (a sparkline, a dashboard
 * strip), a box beside the point covers the whole chart, so it goes directly
 * above the hovered mark instead (the arrow tip touching it) when there is
 * room above, directly below the mark when there is not, and back to the old
 * beside-the-point placement when neither side has room. The box may stick
 * out of the plot and the chart to do so. "Room" means what the reader can
 * actually see, which is the viewport cut down by every ancestor that clips
 * overflow. Getting that wrong in either direction is the failure this file
 * guards against: a box placed into a strip the page clips away is invisible,
 * and a box sent below the mark because of an ancestor that does not actually
 * clip the chart lands in the wrong place.
 *
 * Covered here:
 *   - the viewport edge (chart at the top of the page, and scrolled there),
 *   - no room on either side (the old placement is kept),
 *   - an overflow:hidden ancestor that clips, and one the chart escapes
 *     because it is absolutely positioned past it,
 *   - shadow DOM (the walk continues from a shadow root to its host, and from
 *     a slotted chart into the shadow tree),
 *   - pie sparklines, which keep the box above the pointer and flip it below
 *     only when the top has no room (and, like the axis charts, must keep a
 *     box wider than the pie inside the room sideways),
 *   - keyboard navigation and synced groups, which place the box through
 *     their own paths, and a keyboard step back into the plot dropping the
 *     top/bottom placement the previous step left,
 *   - interactive tooltips: with the hovered point on the plot's top edge the
 *     box sits outside the plot, and the pointer has to cross the chart's own
 *     margin to reach it, so leaving the plot that way closes the box only if
 *     the pointer stops short of it, and leaving any other way closes it at
 *     once. A hidden box must also stop catching the pointer, because outside
 *     the plot it sits over the rest of the page,
 *   - what counts as clipping: paint containment from `content-visibility`
 *     clips, `overflow` on a table row does not.
 *
 * The box stands off the mark by the arrow's overhang, 7px, measured from the
 * mark as drawn on screen: the hover dot of a line with no markers, the
 * enlarged marker, the bar.
 *
 * Every chart here is built from scratch on a bare page (no sample), so the
 * position of the chart on the page, and the ancestors around it, are exactly
 * what each case says they are.
 */

import { test as base, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const DIST = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../../dist/apexcharts.js',
)

// The shared fixture only collects page errors for sample pages; these pages
// are built by hand, so collect them here and fail the test on any.
const test = base.extend({
  pageErrors: [
    async ({ page }, use) => {
      const errors = []
      page.on('pageerror', (err) => errors.push(err.message))
      await use(errors)
      expect(errors, `Unexpected page errors:\n${errors.join('\n')}`).toEqual(
        [],
      )
    },
    { auto: true },
  ],
})

const TT = '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)'

// Same as SHORT_PLOT_RATIO in src/modules/tooltip/constants.js. Used only to
// check each fixture really is a short chart, so a failure below reads as a
// placement bug and not as a fixture that never triggered the feature.
const SHORT_PLOT_RATIO = 0.78

// ARROW_TIP_OVERHANG + POINT_TIP_GAP: the space between the mark and a box
// placed above or below it, so the arrow tip just touches the mark.
const GAP = 7
const GAP_TOLERANCE = 1.5
const ARROW_TOLERANCE = 2

/** Series `s`'s hover dot (a line with no visible markers draws one). */
const DOT = (s = 0) =>
  `.apexcharts-series[data\\:realIndex="${s}"] .apexcharts-series-markers path`

/** Series `s`'s marker at index `j` (visible markers). */
const MARKER = (s, j) =>
  `.apexcharts-series[data\\:realIndex="${s}"] .apexcharts-marker[rel="${j}"]`

const DATA = '[12, 14, 2, 47, 32, 44, 14, 55, 41, 69]'

/** A 160x40 line sparkline: its 40px plot is far shorter than the box. */
const sparkLine = (tooltip = '{}') => `{
  chart: {
    type: 'line', width: 160, height: 40,
    sparkline: { enabled: true }, animations: { enabled: false },
  },
  series: [{ name: 'Sales', data: ${DATA} }],
  stroke: { width: 2 },
  tooltip: ${tooltip},
}`
const SPARK_LINE = sparkLine()

/** A 40x40 pie sparkline. Slice A runs clockwise from 12 o'clock to 7. */
const SPARK_PIE = `{
  chart: {
    type: 'pie', width: 40, height: 40,
    sparkline: { enabled: true }, animations: { enabled: false },
  },
  series: [60, 25, 15],
  labels: ['A', 'B', 'C'],
  stroke: { width: 1 },
}`

/** A 90px line chart for a synced group (axes leave a ~20px plot). */
const GROUP_LINE = (id, data) => `{
  chart: {
    id: '${id}', group: 'short-room', type: 'line', height: 90,
    animations: { enabled: false },
  },
  series: [{ name: '${id}', data: ${data} }],
  dataLabels: { enabled: false },
}`

/**
 * A short interactive sparkline with a title. Its 11 points peak in the
 * middle (index 5, at half the width), so the point a pointer over the
 * plot's centre hovers sits on the plot's top edge, and the box above it is
 * wholly outside the plot: the pointer crosses a band of chart (the hover
 * dot's overhang plus the 7px gap) on its way up to it.
 */
const TITLED_INTERACTIVE = `{
  chart: {
    type: 'line', width: 360, height: 110,
    sparkline: { enabled: true }, animations: { enabled: false },
  },
  title: { text: 'Weekly sales', style: { fontSize: '16px' } },
  series: [{ name: 'Sales', data: [12, 14, 2, 47, 32, 69, 44, 14, 55, 41, 30] }],
  // The peak on the plot's top edge (a nice scale would round the top up).
  yaxis: { min: 0, max: 69 },
  tooltip: { interactive: true },
}`

const SPACER = (h) => `<div style="height:${h}px"></div>`

/**
 * Load a page and render charts into it.
 *
 * Each entry's `el` is a JS expression (evaluated in the page) returning the
 * element to render into, so a case can build a shadow root first; `src` is
 * the options object as source text, eval'ed so formatters survive.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} body
 * @param {Array<{ el?: string, src: string }>} charts
 */
async function mount(page, body, charts) {
  await page.setContent(
    `<!doctype html><html><head><style>body { margin: 0 }</style></head><body>${body}</body></html>`,
  )
  await page.addScriptTag({ path: DIST })
  await page.evaluate(async (list) => {
    window.charts = []
    for (const c of list) {
      const target = eval(c.el || `document.querySelector('#stage')`)
      const chart = new window.ApexCharts(target, eval(`(${c.src})`))
      window.charts.push(chart)
      await chart.render()
    }
    window.chart = window.charts[0]
  }, charts)
  await page.waitForFunction(
    () => window.charts.every((c) => c.w.globals.animationEnded === true),
    undefined,
    { timeout: 10_000 },
  )
}

/**
 * Tooltip, grid, plot and SVG rects for the chart under `scope`: a selector
 * of an element holding the chart, or 'shadow' for the shadow root a case
 * stored in `window.chartRoot`.
 *
 * `plot` is the rect the layout reasons about (elWrap + translateX/Y, grid
 * width and height). The `.apexcharts-grid` group's own bounds are its grid
 * lines, which on a sparkline come out a pixel inside it.
 */
function readTip(page, scope = '#stage') {
  return page.evaluate(
    ([scope, TT]) => {
      const root =
        scope === 'shadow' ? window.chartRoot : document.querySelector(scope)
      const rect = (el) => {
        const r = el.getBoundingClientRect()
        return {
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          width: r.width,
          height: r.height,
        }
      }
      const tt = root.querySelector(TT)
      const grid = root.querySelector('.apexcharts-grid')
      const chart = window.charts.find(
        (c) => c.el === root || root.contains(c.el),
      )
      const w = chart.w
      const wrap = w.dom.elWrap.getBoundingClientRect()
      const plotLeft = wrap.left + w.layout.translateX
      const plotTop = wrap.top + w.layout.translateY
      const arrowRaw = tt.style.getPropertyValue('--apx-tt-arrow-x')
      return {
        active: tt.classList.contains('apexcharts-active'),
        placement: tt.dataset.placement || null,
        arrowX: arrowRaw ? parseFloat(arrowRaw) : null,
        box: rect(tt),
        grid: grid ? rect(grid) : null,
        plot: {
          left: plotLeft,
          top: plotTop,
          right: plotLeft + w.layout.gridWidth,
          bottom: plotTop + w.layout.gridHeight,
          width: w.layout.gridWidth,
          height: w.layout.gridHeight,
        },
        i: w.interact.capturedSeriesIndex,
        j: w.interact.capturedDataPointIndex,
        svg: rect(root.querySelector('.apexcharts-svg')),
        vw: document.documentElement.clientWidth,
        vh: document.documentElement.clientHeight,
      }
    },
    [scope, TT],
  )
}

/**
 * The mark as drawn under `scope` (as for readTip): the union of every
 * element matching `selector` that has a size (a hidden hover dot has an
 * empty path), in viewport px, with the separate rects in `rects`. Null when
 * nothing matches.
 */
function markOf(page, scope, selector) {
  return page.evaluate(
    ([scope, sel]) => {
      const root =
        scope === 'shadow' ? window.chartRoot : document.querySelector(scope)
      const rects = Array.from(root.querySelectorAll(sel))
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 || r.height > 0)
        .map((r) => ({
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          cx: (r.left + r.right) / 2,
        }))
      if (!rects.length) return null
      const left = Math.min(...rects.map((r) => r.left))
      const right = Math.max(...rects.map((r) => r.right))
      const top = Math.min(...rects.map((r) => r.top))
      const bottom = Math.max(...rects.map((r) => r.bottom))
      return {
        top,
        bottom,
        left,
        right,
        width: right - left,
        height: bottom - top,
        cx: (left + right) / 2,
        cy: (top + bottom) / 2,
        rects,
      }
    },
    [scope, selector],
  )
}

/** Is the main tooltip of the chart under `scope` shown? */
function isActive(page, scope = '#stage') {
  return page.evaluate(
    ([scope, TT]) =>
      document
        .querySelector(`${scope} ${TT}`)
        .classList.contains('apexcharts-active'),
    [scope, TT],
  )
}

/** Viewport rect of the element `expr` (a JS expression) evaluates to. */
function rectOf(page, expr) {
  return page.evaluate((expr) => {
    const r = eval(expr).getBoundingClientRect()
    return {
      top: r.top,
      bottom: r.bottom,
      left: r.left,
      right: r.right,
      width: r.width,
      height: r.height,
    }
  }, expr)
}

/**
 * Real pointer over the plot of the chart under `scope`, at a fraction of the
 * grid's width and height. Waits out the 160ms left/top transition and nudges
 * 1px so first-entry reads of the previous pointer are replaced. Returns the
 * final pointer position.
 */
async function hoverPlot(page, scope = '#stage', fx = 0.5, fy = 0.5) {
  const g = await page.evaluate((scope) => {
    const root =
      scope === 'shadow' ? window.chartRoot : document.querySelector(scope)
    const r = root.querySelector('.apexcharts-grid').getBoundingClientRect()
    return { left: r.left, top: r.top, width: r.width, height: r.height }
  }, scope)
  const p = { x: g.left + g.width * fx, y: g.top + g.height * fy }
  await page.mouse.move(p.x, p.y)
  await page.waitForTimeout(250)
  p.x += 1
  await page.mouse.move(p.x, p.y)
  await page.waitForTimeout(250)
  return p
}

/**
 * Park the pointer in an empty corner, away from every chart, and wait until
 * every tooltip has closed. An interactive box outside the plot waits up to
 * 750ms before it closes (the trip allowance grows with the pointer's
 * distance from the box), and until it closes it keeps the clipping
 * ancestors it found, so a case that changes the page in between has to wait
 * for the close.
 */
async function pointerAway(page) {
  await page.mouse.move(1250, 10)
  await expect
    .poll(
      () =>
        page.evaluate(
          (TT) =>
            Array.from(document.querySelectorAll('*'))
              .flatMap((el) => [el, el.shadowRoot].filter(Boolean))
              .flatMap((n) => Array.from(n.querySelectorAll(TT)))
              .some((tt) => tt.classList.contains('apexcharts-active')),
          TT,
        ),
      { timeout: 2_000, intervals: [50] },
    )
    .toBe(false)
  await page.waitForTimeout(50)
}

/** The fixture is short enough for the short-plot rule. */
function expectShortPlot(t, label = '') {
  expect(
    t.box.height,
    `${label} fixture: box ${t.box.height}px vs plot ${t.plot.height}px`,
  ).toBeGreaterThanOrEqual(t.plot.height * SHORT_PLOT_RATIO)
}

/** One-line dump of the box, plot and mark for assertion messages. */
function dump(t, mark) {
  const r = (n) => Math.round(n * 10) / 10
  return (
    `placement=${t.placement} box=[${r(t.box.left)},${r(t.box.top)}..${r(t.box.right)},${r(t.box.bottom)}] ` +
    `plot=[${r(t.plot.top)}..${r(t.plot.bottom)}] mark=[${r(mark.left)},${r(mark.top)}..${r(mark.right)},${r(mark.bottom)}]`
  )
}

/**
 * The arrow tip (box left + `--apx-tt-arrow-x`) is on the mark's centre, kept
 * off the box's rounded corners.
 */
function expectArrowOnMark(t, mark, label) {
  expect(t.arrowX, `${label} arrow offset written`).not.toBeNull()
  expect(t.arrowX, `${label} arrow off the left corner`).toBeGreaterThanOrEqual(
    10,
  )
  expect(t.arrowX, `${label} arrow off the right corner`).toBeLessThanOrEqual(
    t.box.width - 10,
  )
  expect(
    Math.abs(t.box.left + t.arrowX - mark.cx),
    `${label} arrow tip at ${t.box.left + t.arrowX}, mark centre at ${mark.cx}`,
  ).toBeLessThanOrEqual(ARROW_TOLERANCE)
}

/**
 * Directly above the mark: the box's bottom exactly 7px above its top, so
 * it covers none of it (nor any of its `rects`), and the arrow on it.
 */
function expectAboveMark(t, mark, label) {
  const info = `${label}: ${dump(t, mark)}`
  expect(t.active, `${info}\nactive`).toBe(true)
  expect(t.placement, `${info}\nplacement`).toBe('top')
  expect(
    Math.abs(mark.top - t.box.bottom - GAP),
    `${info}\nstand-off above the mark: ${mark.top - t.box.bottom}px, want ${GAP}`,
  ).toBeLessThanOrEqual(GAP_TOLERANCE)
  for (const r of mark.rects || [mark]) {
    expect(
      t.box.bottom,
      `${info}\nthe box covers no point of the mark (one at top ${r.top})`,
    ).toBeLessThanOrEqual(r.top + 0.5)
  }
  expectArrowOnMark(t, mark, label)
}

/** Directly below the mark, 7px off its bottom, arrow on it. */
function expectBelowMark(t, mark, label) {
  const info = `${label}: ${dump(t, mark)}`
  expect(t.active, `${info}\nactive`).toBe(true)
  expect(t.placement, `${info}\nplacement`).toBe('bottom')
  expect(
    Math.abs(t.box.top - mark.bottom - GAP),
    `${info}\nstand-off below the mark: ${t.box.top - mark.bottom}px, want ${GAP}`,
  ).toBeLessThanOrEqual(GAP_TOLERANCE)
  expect(
    t.box.top,
    `${info}\nthe box does not cover the mark`,
  ).toBeGreaterThanOrEqual(mark.bottom - 0.5)
  expectArrowOnMark(t, mark, label)
}

/** Above or below its own mark, whichever the page had room for. */
function expectAroundMark(t, mark, label) {
  expect(t.active, `${label} active`).toBe(true)
  expect(['top', 'bottom'], `${label} placement`).toContain(t.placement)
  if (t.placement === 'top') expectAboveMark(t, mark, label)
  else expectBelowMark(t, mark, label)
}

/** `inner` lies inside `outer` (half a pixel for subpixel layout). */
function expectInside(inner, outer, label = '') {
  expect(inner.top, `${label} top`).toBeGreaterThanOrEqual(outer.top - 0.5)
  expect(inner.bottom, `${label} bottom`).toBeLessThanOrEqual(
    outer.bottom + 0.5,
  )
  expect(inner.left, `${label} left`).toBeGreaterThanOrEqual(outer.left - 0.5)
  expect(inner.right, `${label} right`).toBeLessThanOrEqual(outer.right + 0.5)
}

/**
 * The hover dot is the point nearest the pointer. The sparkline's points are
 * 17.8px apart, so it is within 9px of it.
 */
function expectDotUnderPointer(dot, pointer, label = '') {
  expect(dot, `${label} hover dot drawn`).not.toBeNull()
  expect(
    Math.abs(dot.cx - pointer.x),
    `${label} dot at ${dot.cx}, pointer at ${pointer.x}`,
  ).toBeLessThanOrEqual(10)
}

test.describe('Short plot: the viewport decides which side', () => {
  test('a chart at the very top of the page puts the box below the point', async ({
    page,
  }) => {
    await mount(page, '<div id="stage"></div>', [{ src: SPARK_LINE }])
    const p = await hoverPlot(page)
    const t = await readTip(page)
    const dot = await markOf(page, '#stage', DOT())

    expectShortPlot(t)
    expectDotUnderPointer(dot, p)
    // The premise: no room above the point.
    expect(dot.top - GAP - t.box.height).toBeLessThan(0)
    expectBelowMark(t, dot, 'top of page')
    expectInside(
      t.box,
      { top: 0, left: 0, right: t.vw, bottom: t.vh },
      'viewport',
    )
  })

  test('scrolling the chart up to the viewport top flips the box below, and back', async ({
    page,
  }) => {
    await mount(page, `${SPACER(600)}<div id="stage"></div>${SPACER(1600)}`, [
      { src: SPARK_LINE },
    ])

    // Well below the viewport top: room above.
    let p = await hoverPlot(page)
    let t = await readTip(page)
    let dot = await markOf(page, '#stage', DOT())
    expectShortPlot(t)
    expectDotUnderPointer(dot, p, 'unscrolled')
    expectAboveMark(t, dot, 'unscrolled')

    // Scroll until the chart's top sits 10px under the viewport top: no room
    // above any more, plenty below.
    await pointerAway(page)
    await page.evaluate(() => {
      const top = document.querySelector('#stage').getBoundingClientRect().top
      window.scrollTo(0, window.scrollY + top - 10)
    })
    expect(
      (await rectOf(page, `document.querySelector('#stage')`)).top,
    ).toBeCloseTo(10, 0)
    p = await hoverPlot(page)
    t = await readTip(page)
    dot = await markOf(page, '#stage', DOT())
    expectDotUnderPointer(dot, p, 'scrolled')
    expectBelowMark(t, dot, 'scrolled')
    expectInside(
      t.box,
      { top: 0, left: 0, right: t.vw, bottom: t.vh },
      'viewport',
    )

    // And back.
    await pointerAway(page)
    await page.evaluate(() => window.scrollTo(0, 0))
    p = await hoverPlot(page)
    t = await readTip(page)
    dot = await markOf(page, '#stage', DOT())
    expectDotUnderPointer(dot, p, 'scrolled back')
    expectAboveMark(t, dot, 'scrolled back')
  })

  test('with room on neither side the old in-plot placement is kept', async ({
    page,
  }) => {
    // 60px of viewport for a 40px chart at top 5: 5px above it, 15px below,
    // and the box is ~70px tall.
    await page.setViewportSize({ width: 1280, height: 60 })
    await mount(page, `${SPACER(5)}<div id="stage"></div>`, [
      { src: SPARK_LINE },
    ])
    await hoverPlot(page)
    const t = await readTip(page)

    expectShortPlot(t)
    expect(t.active).toBe(true)
    expect(t.box.height).toBeGreaterThan(t.vh - t.plot.bottom)
    expect(['left', 'right']).toContain(t.placement)
    // Beside the point, so across the plot's height.
    expect(t.box.top).toBeLessThan(t.plot.bottom)
    expect(t.box.bottom).toBeGreaterThan(t.plot.top)
  })
})

test.describe('Short plot: clipping ancestors', () => {
  test('an overflow:hidden card with no room above sends the box below, inside the card', async ({
    page,
  }) => {
    // The page has 300px above the chart, but the card clips 4px above it.
    // The card starts 200px in, so the box (wider than the space left of the
    // hovered point) also has to be held at the card's left edge, not the
    // viewport's.
    await mount(
      page,
      `${SPACER(300)}
      <div id="card" style="overflow:hidden; margin-left:200px; width:400px; height:200px; padding-top:4px; box-sizing:border-box">
        <div id="stage"></div>
      </div>`,
      [{ src: SPARK_LINE }],
    )
    const card = await rectOf(page, `document.querySelector('#card')`)

    let p = await hoverPlot(page, '#stage', 0.08)
    let t = await readTip(page)
    let dot = await markOf(page, '#stage', DOT())
    expectShortPlot(t)
    expectDotUnderPointer(dot, p, 'clipped')
    expectBelowMark(t, dot, 'clipped')
    expectInside(t.box, card, 'card')
    // Centred on the point it would start left of the card; it is held at the
    // card's edge instead, with the arrow still on the point.
    expect(dot.cx - t.box.width / 2).toBeLessThan(card.left)
    expect(t.box.left).toBeCloseTo(card.left, 0)

    // Control: the same page without the clip has room above, and the box is
    // held only by the viewport, so it centres on the point past the card's
    // left edge.
    await pointerAway(page)
    await page.evaluate(() => {
      document.querySelector('#card').style.overflow = 'visible'
    })
    p = await hoverPlot(page, '#stage', 0.08)
    t = await readTip(page)
    dot = await markOf(page, '#stage', DOT())
    expectDotUnderPointer(dot, p, 'unclipped')
    expectAboveMark(t, dot, 'unclipped')
    expect(t.box.left).toBeLessThan(card.left - 10)
    expect(t.box.left + t.arrowX).toBeCloseTo(t.box.left + t.box.width / 2, 0)
  })

  test('an overflow:hidden ancestor the chart escapes does not count', async ({
    page,
  }) => {
    // #wrap is absolutely positioned against #outer, past the static #card,
    // so #card's overflow does not clip the chart (or its tooltip).
    await mount(
      page,
      `${SPACER(300)}
      <div id="outer" style="position:relative; width:600px; height:220px">
        <div id="card" style="overflow:hidden; width:400px; height:200px">
          <div id="wrap" style="position:absolute; top:4px; left:0; width:160px">
            <div id="stage"></div>
          </div>
        </div>
      </div>`,
      // Interactive only so the box takes the pointer, for the hit test below.
      [{ src: sparkLine('{ interactive: true }') }],
    )
    const card = await rectOf(page, `document.querySelector('#card')`)

    const p = await hoverPlot(page)
    const t = await readTip(page)
    const dot = await markOf(page, '#stage', DOT())
    expectShortPlot(t)
    expectDotUnderPointer(dot, p)
    expectAboveMark(t, dot, 'escaped')
    // The box reaches past the card's top, where the card would clip it.
    expect(t.box.top).toBeLessThan(card.top - 5)

    // The browser agrees the box is visible above #card: hit testing honours
    // overflow clipping, and the interactive box takes the pointer there.
    const hit = await page.evaluate(
      ([x, y, TT]) => {
        const el = document.elementFromPoint(x, y)
        return !!el && !!el.closest(TT)
      },
      [t.box.left + t.box.width / 2, (t.box.top + card.top) / 2, TT],
    )
    expect(hit).toBe(true)

    // Control: once #wrap is in flow, #card does clip it, and the box goes
    // below.
    await pointerAway(page)
    await page.evaluate(() => {
      document.querySelector('#wrap').style.position = 'static'
    })
    await hoverPlot(page)
    const clipped = await readTip(page)
    expectBelowMark(clipped, await markOf(page, '#stage', DOT()), 'in flow')
    expectInside(clipped.box, card, 'card')
  })
})

test.describe('Short plot: shadow DOM', () => {
  test('a chart in a shadow root sees the clip on the container of its host', async ({
    page,
  }) => {
    await mount(
      page,
      `${SPACER(300)}
      <div id="card" style="overflow:hidden; width:400px; height:200px; padding-top:4px; box-sizing:border-box">
        <div id="host"></div>
      </div>`,
      [
        {
          el: `(() => {
            const root = document.querySelector('#host').attachShadow({ mode: 'open' })
            const target = document.createElement('div')
            root.appendChild(target)
            window.chartRoot = root
            return target
          })()`,
          src: SPARK_LINE,
        },
      ],
    )
    // The library put its stylesheet into the shadow root, so the tooltip is
    // styled (absolutely positioned) there.
    expect(
      await page.evaluate(
        () => !!window.chartRoot.getElementById('apexcharts-css'),
      ),
    ).toBe(true)
    const card = await rectOf(page, `document.querySelector('#card')`)

    const p = await hoverPlot(page, 'shadow')
    let t = await readTip(page, 'shadow')
    let dot = await markOf(page, 'shadow', DOT())
    expectShortPlot(t)
    expectDotUnderPointer(dot, p, 'shadow')
    expectBelowMark(t, dot, 'shadow, clipped')
    expectInside(t.box, card, 'card')

    // Control: the viewport alone has room above.
    await pointerAway(page)
    await page.evaluate(() => {
      document.querySelector('#card').style.overflow = 'visible'
    })
    await hoverPlot(page, 'shadow')
    t = await readTip(page, 'shadow')
    dot = await markOf(page, 'shadow', DOT())
    expectAboveMark(t, dot, 'shadow, unclipped')
  })

  test('a slotted chart sees the clip inside the shadow tree it is slotted into', async ({
    page,
  }) => {
    await mount(
      page,
      `${SPACER(300)}<div id="host"><div id="stage"></div></div>`,
      [
        {
          el: `(() => {
          const root = document.querySelector('#host').attachShadow({ mode: 'open' })
          root.innerHTML =
            '<div id="card" style="overflow:hidden; width:400px; height:200px; padding-top:4px; box-sizing:border-box"><slot></slot></div>'
          return document.querySelector('#stage')
        })()`,
          src: SPARK_LINE,
        },
      ],
    )
    const card = await rectOf(
      page,
      `document.querySelector('#host').shadowRoot.querySelector('#card')`,
    )

    const p = await hoverPlot(page)
    const t = await readTip(page)
    const dot = await markOf(page, '#stage', DOT())
    expectShortPlot(t)
    expectDotUnderPointer(dot, p)
    expectBelowMark(t, dot, 'slotted')
    expectInside(t.box, card, 'card')
  })
})

test.describe('Short plot: pie sparkline', () => {
  /**
   * Real pointer `dx` px right of the pie's centre, with a nudge. +8 is in
   * slice A, -12 in slice B.
   */
  async function hoverSlice(page, dx = 7) {
    const c = await page.evaluate(() => {
      const r = document
        .querySelector('#stage .apexcharts-svg')
        .getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
    const p = { x: c.x + dx, y: c.y }
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(250)
    p.x += 1
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(250)
    // The pointer really is over a slice.
    expect(
      await page.evaluate(
        ([x, y]) =>
          !!document.elementFromPoint(x, y)?.closest('.apexcharts-pie-area'),
        [p.x, p.y],
      ),
    ).toBe(true)
    return p
  }

  // 100px in from the page's left edge, so only the vertical room is in play.
  const PIE_STAGE =
    '<div id="stage" style="width:40px; margin-left:100px"></div>'

  test('at the top of the page the box flips below the pointer', async ({
    page,
  }) => {
    await mount(page, PIE_STAGE, [{ src: SPARK_PIE }])
    const p = await hoverSlice(page)
    const t = await readTip(page)

    expect(t.active).toBe(true)
    // Clear of the cursor graphic, which hangs below the hotspot.
    expect(t.box.top).toBeGreaterThanOrEqual(p.y + 20)
    expect(t.box.top).toBeLessThanOrEqual(p.y + 30)
    expect(Math.abs(t.box.left + t.box.width / 2 - p.x)).toBeLessThanOrEqual(2)
    expectInside(
      t.box,
      { top: 0, left: 0, right: t.vw, bottom: t.vh },
      'viewport',
    )
  })

  test('with room above the box stays above the pointer', async ({ page }) => {
    await mount(page, `${SPACER(300)}${PIE_STAGE}`, [{ src: SPARK_PIE }])
    const p = await hoverSlice(page)
    const t = await readTip(page)

    expect(t.active).toBe(true)
    expect(t.box.bottom).toBeLessThanOrEqual(p.y - 8)
    expect(t.box.bottom).toBeGreaterThanOrEqual(p.y - 14)
    expect(Math.abs(t.box.left + t.box.width / 2 - p.x)).toBeLessThanOrEqual(2)
  })

  test('a clipping card with no room above flips it below too', async ({
    page,
  }) => {
    await mount(
      page,
      `${SPACER(300)}
      <div id="card" style="overflow:hidden; width:400px; height:200px; padding-top:4px; box-sizing:border-box">
        ${PIE_STAGE}
      </div>`,
      [{ src: SPARK_PIE }],
    )
    const card = await rectOf(page, `document.querySelector('#card')`)
    const p = await hoverSlice(page)
    const t = await readTip(page)

    expect(t.active).toBe(true)
    expect(t.box.top).toBeGreaterThanOrEqual(p.y + 20)
    expectInside(t.box, card, 'card')
  })

  test('at the left edge of the page the box stays inside the viewport', async ({
    page,
  }) => {
    // A pie sparkline in the first column of a dashboard: centred on a
    // pointer over the left half of the pie, the box (wider than the pie)
    // would start left of the viewport.
    await mount(
      page,
      `${SPACER(300)}<div id="stage" style="width:40px"></div>`,
      [{ src: SPARK_PIE }],
    )
    const p = await hoverSlice(page, -12)
    const t = await readTip(page)

    expect(t.active).toBe(true)
    expect(t.box.bottom).toBeLessThanOrEqual(p.y - 8)
    expect(
      p.x - t.box.width / 2,
      'precondition: centring overflows',
    ).toBeLessThan(0)
    expectInside(
      t.box,
      { top: 0, left: 0, right: t.vw, bottom: t.vh },
      'viewport',
    )
  })
})

test.describe('Short plot: keyboard and synced groups', () => {
  async function arrowRight(page) {
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    return readTip(page)
  }

  test('keyboard navigation puts the box right above the focused point', async ({
    page,
  }) => {
    await mount(page, `${SPACER(300)}<div id="stage"></div>`, [
      { src: SPARK_LINE },
    ])
    await page.evaluate(() =>
      document.querySelector('#stage .apexcharts-svg').focus(),
    )

    // First press (nothing hovered before) and a second one.
    let t = await arrowRight(page)
    expectShortPlot(t, 'first press')
    expectAboveMark(t, await markOf(page, '#stage', DOT()), 'first press')
    const first = t.j
    t = await arrowRight(page)
    expect(t.j, 'the second press moved on').not.toBe(first)
    expectAboveMark(t, await markOf(page, '#stage', DOT()), 'second press')

    // At the top of the page: below the point instead.
    await mount(page, '<div id="stage"></div>', [{ src: SPARK_LINE }])
    await page.evaluate(() =>
      document.querySelector('#stage .apexcharts-svg').focus(),
    )
    t = await arrowRight(page)
    expectBelowMark(t, await markOf(page, '#stage', DOT()), 'top of page')
    t = await arrowRight(page)
    expectAroundMark(
      t,
      await markOf(page, '#stage', DOT()),
      'top of page, second press',
    )
  })

  /**
   * The keyboard step-back scenario: a 240px viewport, the chart 200px down
   * the page, a horizontal bar card taller than the plot. Step 1 focuses a
   * bar with room above it on the page; the page is then scrolled to put the
   * chart at the viewport's top, and step 2 focuses a bar with room on
   * neither side of it. Returns the box at step 2 and the bar it captions.
   */
  async function stepBackIntoPlot(page, { arrow }) {
    await page.setViewportSize({ width: 1280, height: 240 })
    await mount(
      page,
      `${SPACER(200)}<div id="stage" style="width:600px"></div>${SPACER(1200)}`,
      [
        {
          src: `{
            chart: { type: 'bar', height: 200, animations: { enabled: false } },
            plotOptions: { bar: { horizontal: true } },
            dataLabels: { enabled: false },
            series: [
              { name: 'Revenue', data: [44, 55] },
              { name: 'Cost', data: [30, 26] },
            ],
            xaxis: { categories: ['North', 'South'] },
            // Six lines a series, so the card is taller than the plot and,
            // in the 240px viewport, than the room on either side of a bar.
            tooltip: {
              arrow: ${arrow},
              y: {
                formatter: function (v) {
                  return v + '<br>two<br>three<br>four<br>five<br>six'
                },
              },
            },
          }`,
        },
      ],
    )
    await page.evaluate(() =>
      document
        .querySelector('#stage .apexcharts-svg')
        .focus({ preventScroll: true }),
    )
    const focusedBar = (t) =>
      markOf(
        page,
        '#stage',
        `.apexcharts-series[data\\:realIndex="${t.i}"] .apexcharts-bar-area[j="${t.j}"]`,
      )

    let t = await arrowRight(page)
    expectShortPlot(t, 'step 1')
    const bar1 = await focusedBar(t)
    expect(bar1, `step 1: focused bar ${t.i}/${t.j} drawn`).not.toBeNull()
    expectAboveMark(t, bar1, 'step 1')

    await page.evaluate(() => {
      const top = document.querySelector('#stage').getBoundingClientRect().top
      window.scrollTo(0, window.scrollY + top)
    })
    t = await arrowRight(page)
    const bar = await focusedBar(t)
    expect(bar, `step 2: focused bar ${t.i}/${t.j} drawn`).not.toBeNull()
    const info = `step 2: placement=${t.placement} box=${JSON.stringify(t.box)} bar=${JSON.stringify(bar)} plot=${t.plot.top}..${t.plot.bottom} vh=${t.vh}`
    // The premise: room on neither side of the focused bar any more.
    expect(bar.top - GAP - t.box.height, info).toBeLessThan(0)
    expect(bar.bottom + GAP + t.box.height, info).toBeGreaterThan(t.vh)
    expect(t.active, info).toBe(true)
    return { t, bar, info }
  }

  test('a keyboard step back into the plot drops the placement the last step left', async ({
    page,
  }) => {
    // Without an arrow the step back goes beside the bar's value end, held
    // inside the plot. That path writes no placement of its own, so a 'top'
    // left over from the step before would keep the shadow of a box above
    // the bar.
    const { t, info } = await stepBackIntoPlot(page, { arrow: false })
    expect(t.placement, info).toBeNull()
    expect(t.box.bottom, info).toBeGreaterThan(t.plot.top)
    expect(t.box.top, info).toBeLessThan(t.plot.bottom)
    expectInside(t.box, { top: 0, left: 0, right: t.vw, bottom: t.vh }, info)
  })

  test('with the arrow on, a keyboard step back goes beside the bar, on screen and off it', async ({
    page,
  }) => {
    // With room neither above nor below the bar on the page, the box goes
    // past the bar's value end (the plot has no room for it there, the page
    // has), with a placement of its own. It used to be pinned to the plot's
    // top, over the focused bar, its arrow on another row.
    const { t, bar, info } = await stepBackIntoPlot(page, { arrow: true })
    expect(t.placement, info).toBe('right')
    expect(t.box.left, info).toBeGreaterThanOrEqual(bar.right + GAP - 1)
    const covers =
      Math.min(t.box.right, bar.right) - Math.max(t.box.left, bar.left) > 0 &&
      Math.min(t.box.bottom, bar.bottom) - Math.max(t.box.top, bar.top) > 0
    expect(covers, `${info}: the box covers the focused bar`).toBe(false)
    expectInside(t.box, { top: 0, left: 0, right: t.vw, bottom: t.vh }, info)
  })

  test('a synced group places each box at its own point', async ({ page }) => {
    await mount(
      page,
      `${SPACER(300)}<div id="a" style="width:400px"></div><div id="b" style="width:400px"></div>`,
      [
        { el: `document.querySelector('#a')`, src: GROUP_LINE('a', DATA) },
        {
          el: `document.querySelector('#b')`,
          src: GROUP_LINE('b', '[30, 22, 41, 35, 28, 52, 47, 33, 25, 40]'),
        },
      ],
    )

    await hoverPlot(page, '#a')
    const a = await readTip(page, '#a')
    const b = await readTip(page, '#b')

    expectShortPlot(a, 'a')
    expectShortPlot(b, 'b')
    expect(b.j, 'the sibling captions the same index').toBe(a.j)
    expectAroundMark(a, await markOf(page, '#a', DOT()), 'hovered chart')
    expectAroundMark(b, await markOf(page, '#b', DOT()), 'synced sibling')
  })
})

test.describe('Short plot: interactive tooltip', () => {
  const STAGE = `${SPACER(300)}<div id="stage" style="width:360px"></div>`

  test('stays open while the pointer crosses the margin up into the box', async ({
    page,
  }) => {
    await mount(page, STAGE, [{ src: TITLED_INTERACTIVE }])
    const p = await hoverPlot(page)
    const t = await readTip(page)
    const dot = await markOf(page, '#stage', DOT())
    expectShortPlot(t)
    expect(t.j, 'the peak is hovered').toBe(5)
    expectAboveMark(t, dot, 'titled')
    // The peak's dot pokes out of the plot's top, so the box is wholly above
    // the plot, over the title: the pointer has to leave the plot to reach
    // it.
    expect(t.box.bottom).toBeLessThan(t.plot.top - 5)
    expect(t.plot.top - t.svg.top, 'title band').toBeGreaterThan(20)
    expect(p.x).toBeGreaterThan(t.box.left + 4)
    expect(p.x).toBeLessThan(t.box.right - 4)

    // Straight up, 3px a frame, until well inside the box.
    const target = t.box.bottom - 15
    let y = p.y
    let enteredAt = null
    while (y > target) {
      y -= 3
      await page.mouse.move(p.x, y)
      await page.waitForTimeout(16)
      const active = await page.evaluate(
        (TT) =>
          document
            .querySelector(`#stage ${TT}`)
            .classList.contains('apexcharts-active'),
        TT,
      )
      expect(active, `active with the pointer at y=${y}`).toBe(true)
      if (enteredAt === null && y < t.box.bottom) enteredAt = Date.now()
    }
    expect(enteredAt).not.toBeNull()

    // Still open well past the 150ms grace, the pointer resting in the box.
    await page.waitForTimeout(400)
    const inBox = await readTip(page)
    expect(inBox.active, '400ms after entering the box').toBe(true)
    // It did not move away from under the pointer.
    expect(inBox.box.top).toBeCloseTo(t.box.top, 0)
    expect(inBox.box.left).toBeCloseTo(t.box.left, 0)

    // Out of the chart altogether: it hides.
    await page.mouse.move(1250, 700)
    await expect
      .poll(
        () =>
          page.evaluate(
            (TT) =>
              document
                .querySelector(`#stage ${TT}`)
                .classList.contains('apexcharts-active'),
            TT,
          ),
        { timeout: 600, intervals: [50] },
      )
      .toBe(false)

    // The hidden box is over the page, above the chart. It must not catch
    // the pointer there any more.
    const cx = inBox.box.left + inBox.box.width / 2
    const cy = inBox.box.top + inBox.box.height / 2
    const caught = await page.evaluate(
      ([x, y, TT]) => {
        const el = document.elementFromPoint(x, y)
        return !!el && !!el.closest(TT)
      },
      [cx, cy, TT],
    )
    expect(caught, 'hidden box still takes the pointer').toBe(false)
  })

  test('closes when the pointer leaves the plot upward and stops short of the box', async ({
    page,
  }) => {
    await mount(page, STAGE, [{ src: TITLED_INTERACTIVE }])
    const p = await hoverPlot(page)
    const t = await readTip(page)
    expectAboveMark(t, await markOf(page, '#stage', DOT()), 'titled')

    // Up in 3px steps to the middle of the band between the plot and the box.
    const stop = Math.round((t.box.bottom + t.plot.top) / 2)
    expect(stop).toBeLessThan(t.plot.top)
    expect(stop).toBeGreaterThan(t.box.bottom)
    let y = p.y
    while (y - 3 > stop) {
      y -= 3
      await page.mouse.move(p.x, y)
      await page.waitForTimeout(16)
    }
    await page.mouse.move(p.x, stop)

    await expect
      .poll(
        () =>
          page.evaluate(
            (TT) =>
              document
                .querySelector(`#stage ${TT}`)
                .classList.contains('apexcharts-active'),
            TT,
          ),
        { timeout: 500, intervals: [50] },
      )
      .toBe(false)
  })

  test('a 100px line with visible markers: walking up 1px a frame into the box keeps it open', async ({
    page,
  }) => {
    await mount(
      page,
      `${SPACER(300)}<div id="stage" style="width:600px"></div>`,
      [
        {
          src: `{
            chart: { type: 'line', height: 100, width: 600, animations: { enabled: false } },
            markers: { size: 4 },
            series: [
              { name: 'Visitors', data: [31, 40, 28, 51, 42, 60, 49, 62, 45, 70] },
              { name: 'Buyers', data: [11, 32, 25, 32, 34, 22, 30, 34, 25, 30] },
              { name: 'Returns', data: [21, 22, 35, 42, 24, 32, 40, 24, 35, 40] },
            ],
            tooltip: { interactive: true },
          }`,
        },
      ],
    )
    // The marker paths (Marker.enlargePoints) place this box, through the
    // tooltip's own Position, so the tooltip knows where the box is.
    const m = await rectOf(
      page,
      `document.querySelector('#stage .apexcharts-series[data\\\\:realIndex="1"] .apexcharts-marker[rel="4"]')`,
    )
    const p = { x: m.left + m.width / 2, y: m.top + m.height / 2 }
    await page.mouse.move(p.x - 1, p.y)
    await page.waitForTimeout(150)
    await page.mouse.move(p.x, p.y)
    await page.waitForTimeout(300)
    const t = await readTip(page)
    expectShortPlot(t)
    expect(t.j).toBe(4)
    // A shared card over three series: above the column's topmost marker
    // (42, series 0), covering none of the three. The last series' marker
    // (24) is the lowest, so a box placed on it would cover the other two.
    const column = await markOf(
      page,
      '#stage',
      [0, 1, 2].map((s) => MARKER(s, 4)).join(', '),
    )
    expect(column.rects.length, 'three markers at index 4').toBe(3)
    const tops = []
    for (const s of [0, 1, 2]) {
      tops.push(
        Math.round((await markOf(page, '#stage', MARKER(s, 4))).top * 10) / 10,
      )
    }
    expectAboveMark(
      t,
      column,
      `visible markers (marker tops by series: ${tops.join(', ')})`,
    )
    expect(p.x).toBeGreaterThan(t.box.left + 4)
    expect(p.x).toBeLessThan(t.box.right - 4)

    // Straight up, 1px every 16ms, until 10px inside the box.
    const inactiveAt = []
    let y = p.y
    while (y > t.box.bottom - 10) {
      y -= 1
      await page.mouse.move(p.x, y)
      await page.waitForTimeout(16)
      if (!(await isActive(page))) inactiveAt.push(y)
    }
    expect(inactiveAt, 'pointer y where the box had closed').toEqual([])

    await page.waitForTimeout(400)
    const after = await readTip(page)
    expect(after.active, '400ms after entering the box').toBe(true)
    expect(after.box.top).toBeCloseTo(t.box.top, 0)
    expect(after.box.left).toBeCloseTo(t.box.left, 0)
  })

  test('intersect columns: a pointer moving from a short bar to the box at 250px/s finds it open', async ({
    page,
  }) => {
    await mount(
      page,
      `${SPACER(300)}<div id="stage" style="width:600px"></div>`,
      [
        {
          src: `{
            chart: { type: 'bar', height: 110, animations: { enabled: false } },
            dataLabels: { enabled: false },
            series: [{ name: 'Revenue', data: [44, 55, 6, 64, 22, 43] }],
            xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
            tooltip: { interactive: true, shared: false, intersect: true },
          }`,
        },
      ],
    )
    // The short bar: the box sits right above it, so the pointer leaves the
    // bar (a mouseout, which only starts the close) and crosses the 7px gap
    // into the box.
    const BAR = '.apexcharts-bar-area[j="2"]'
    const before = await markOf(page, '#stage', BAR)
    const start = {
      x: before.cx,
      y: before.bottom - Math.min(3, before.height / 2),
    }
    await page.mouse.move(start.x - 1, start.y)
    await page.waitForTimeout(150)
    await page.mouse.move(start.x, start.y)
    await page.waitForTimeout(300)
    const t = await readTip(page)
    const bar = await markOf(page, '#stage', BAR)
    expectShortPlot(t)
    expectAboveMark(t, bar, 'short bar')

    // A straight line to the box's centre, in ~4px steps paced by the clock
    // so the average speed is 250px/s whatever each step costs.
    const end = {
      x: t.box.left + t.box.width / 2,
      y: t.box.top + t.box.height / 2,
    }
    const dist = Math.hypot(end.x - start.x, end.y - start.y)
    expect(
      dist,
      'the trip runs out of the bar and well into the box',
    ).toBeGreaterThan(bar.height + GAP + 15)
    const SPEED = 0.25 // px per ms
    const steps = Math.ceil(dist / 4)
    const t0 = Date.now()
    for (let k = 1; k <= steps; k++) {
      await page.mouse.move(
        start.x + ((end.x - start.x) * k) / steps,
        start.y + ((end.y - start.y) * k) / steps,
      )
      const wait = t0 + (dist * k) / steps / SPEED - Date.now()
      if (wait > 0) await page.waitForTimeout(wait)
    }
    const elapsed = Date.now() - t0
    // The premise: the trip ran at about the intended speed, not at a crawl.
    expect(
      dist / elapsed,
      `trip of ${dist}px took ${elapsed}ms`,
    ).toBeGreaterThan(0.2)

    expect(await isActive(page), 'active on arrival').toBe(true)
    const over = await page.evaluate(
      ([x, y, TT]) => !!document.elementFromPoint(x, y)?.closest(TT),
      [end.x, end.y, TT],
    )
    expect(over, 'the pointer is over the box').toBe(true)
    await page.waitForTimeout(400)
    expect(await isActive(page), '400ms after arriving').toBe(true)
  })

  test('leaving the plot away from the box closes it at once', async ({
    page,
  }) => {
    await mount(
      page,
      `${SPACER(300)}<div id="stage" style="width:600px"></div>`,
      [
        {
          src: `{
            chart: { type: 'line', height: 130, animations: { enabled: false } },
            series: [
              { name: 'Visitors', data: [31, 40, 28, 51, 42, 60, 49, 62, 45, 70] },
              { name: 'Buyers', data: [11, 32, 25, 32, 34, 22, 30, 34, 25, 30] },
              { name: 'Returns', data: [21, 22, 35, 42, 24, 32, 40, 24, 35, 40] },
            ],
            xaxis: {
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
            },
            tooltip: { interactive: true, shared: true },
          }`,
        },
      ],
    )
    const p = await hoverPlot(page, '#stage', 0.4, 0.75)
    const t = await readTip(page)
    expectShortPlot(t)
    // A shared card: above the column's topmost hover dot, covering none.
    const column = await markOf(
      page,
      '#stage',
      [0, 1, 2].map((s) => DOT(s)).join(', '),
    )
    expect(column.rects.length, 'three hover dots').toBe(3)
    expectAboveMark(t, column, 'shared line')

    // Down onto the x-axis labels (inside the chart, below the plot), then
    // sideways along them: away from a box that is above the points.
    const labels = await rectOf(
      page,
      `document.querySelector('#stage .apexcharts-xaxis-texts-g')`,
    )
    expect(labels.top, 'labels below the plot').toBeGreaterThan(t.plot.bottom)
    const yl = labels.top + labels.height / 2
    let y = p.y
    let leftAt = null
    while (y < yl) {
      y = Math.min(y + 3, yl)
      await page.mouse.move(p.x, y)
      if (leftAt === null && y > t.plot.bottom) leftAt = Date.now()
      await page.waitForTimeout(16)
    }
    expect(leftAt).not.toBeNull()

    const samples = []
    let x = p.x
    while (Date.now() - leftAt < 600) {
      x += 3
      await page.mouse.move(x, yl)
      await page.waitForTimeout(16)
      samples.push({ at: Date.now() - leftAt, active: await isActive(page) })
    }
    const dumpSamples = samples.map((s) => `${s.at}:${s.active}`).join(' ')
    const closed = samples.find((s) => !s.active)
    expect(closed, `never closed: ${dumpSamples}`).toBeDefined()
    expect(closed.at, `closed late: ${dumpSamples}`).toBeLessThanOrEqual(300)
    expect(
      samples.filter((s) => s.at >= closed.at && s.active),
      `reopened while scrubbing the labels: ${dumpSamples}`,
    ).toEqual([])
  })
})

test.describe('Short plot: what counts as clipping', () => {
  test('content-visibility:auto clips: the box stays inside the section', async ({
    page,
  }) => {
    // The page has 300px above the section, but the section's paint
    // containment cuts off anything above it, so the box goes below the
    // point, where the section has room.
    await mount(
      page,
      `${SPACER(300)}
      <section id="sec" style="content-visibility:auto; width:600px; height:300px; padding-top:4px; box-sizing:border-box">
        <div id="stage" style="width:160px"></div>
      </section>`,
      [{ src: SPARK_LINE }],
    )
    expect(
      await page.evaluate(
        () =>
          getComputedStyle(document.querySelector('#sec')).contentVisibility,
      ),
    ).toBe('auto')
    const sec = await rectOf(page, `document.querySelector('#sec')`)

    await hoverPlot(page)
    let t = await readTip(page)
    expectShortPlot(t)
    expect(t.box.top, 'box not above the section').toBeGreaterThanOrEqual(
      sec.top - 0.5,
    )
    expectBelowMark(
      t,
      await markOf(page, '#stage', DOT()),
      'content-visibility:auto',
    )
    expectInside(t.box, sec, 'section')

    // Control: without the containment, the page's room above is used.
    await pointerAway(page)
    await page.evaluate(() => {
      document.querySelector('#sec').style.contentVisibility = 'visible'
    })
    await hoverPlot(page)
    t = await readTip(page)
    expectAboveMark(
      t,
      await markOf(page, '#stage', DOT()),
      'content-visibility:visible',
    )
  })

  test('overflow on a table row does not clip: the box goes above the point, past the row', async ({
    page,
  }) => {
    // overflow does not apply to table rows, so the row's `overflow:hidden`
    // clips nothing and the page's room above the row is usable.
    await mount(
      page,
      `${SPACER(300)}
      <table style="border-collapse:collapse"><tbody>
        <tr id="row" style="overflow:hidden">
          <td id="cell" style="padding:4px 0 0"><div id="stage" style="width:160px"></div></td>
        </tr>
      </tbody></table>`,
      // Interactive only so the box takes the pointer, for the hit test below.
      [{ src: sparkLine('{ interactive: true }') }],
    )
    const row = await rectOf(page, `document.querySelector('#row')`)

    await hoverPlot(page)
    let t = await readTip(page)
    expectShortPlot(t)
    expectAboveMark(
      t,
      await markOf(page, '#stage', DOT()),
      'tr overflow:hidden',
    )
    // The box reaches past the row's top, where a clip would cut it.
    expect(t.box.top).toBeLessThan(row.top - 5)

    // The browser agrees: the part of the box above the row is painted and
    // takes the pointer.
    const hit = await page.evaluate(
      ([x, y, TT]) => !!document.elementFromPoint(x, y)?.closest(TT),
      [t.box.left + t.box.width / 2, (t.box.top + row.top) / 2, TT],
    )
    expect(hit, 'box painted above the row').toBe(true)

    // Control: the same overflow on the cell does clip. The cell is no taller
    // than the box, so neither side of the point has room and the box stays
    // in the plot.
    await pointerAway(page)
    await page.evaluate(() => {
      document.querySelector('#cell').style.overflow = 'hidden'
    })
    await hoverPlot(page)
    t = await readTip(page)
    expect(t.active, 'td overflow:hidden active').toBe(true)
    expect(['left', 'right'], `td overflow:hidden placement`).toContain(
      t.placement,
    )
  })
})
