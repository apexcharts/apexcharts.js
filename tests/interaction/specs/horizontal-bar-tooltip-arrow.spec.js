/**
 * Horizontal bar tooltips: the arrow lands on the bar and the box stays on
 * screen.
 *
 * A horizontal bar-like (bar, range bar timeline, box plot, funnel, pyramid)
 * shows its tooltip above the hovered bar, or below it when there is no room
 * above inside the plot. A box that fit on neither side used to stay above
 * the bar all the same, past the plot's top, and with the chart near the top
 * of the page it started above the screen. It now goes out of the plot above
 * the bar where the page has room there, or else below it, and only with the
 * page out of room on both sides beside the bar, inside the plot or else out
 * of it.
 *
 * Beside a bar the box goes past its value end: the right of a positive bar,
 * the left of a negative one, never the zero line they share. A range bar has
 * a value at each end, so its box takes the side facing the plot's middle.
 *
 * Every chart is mounted at the very top of the page, so the page has no room
 * above it, with a card too tall to fit above or below a middle row inside
 * the plot; the cases that go beside a bar also cut the viewport off at the
 * chart's bottom. Each case checks that the arrow tip is on the bar, the box
 * covers none of it, and the box is inside the viewport. The last case checks
 * that keyboard focus puts the box where the pointer does.
 */

import { test as base, expect } from '../fixtures/base.js'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const BUNDLE = resolve(rootDir, 'dist/apexcharts.js')

/** ARROW_TIP_OVERHANG: the space between a bar and a box beside or over it. */
const GAP = 7

/** Tolerance for subpixel layout. */
const TOLERANCE = 1.5

/** Same as SHORT_PLOT_RATIO in src/modules/tooltip/constants.js. */
const SHORT_PLOT_RATIO = 0.78

// The charts here are mounted by hand rather than through `loadChart`, so
// watch every page for errors.
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
 * Mount one chart at the top of the page, 300px in from the left. `optsSrc`
 * is eval'ed in the page so formatter functions survive. `viewportHeight`
 * cuts the page off there (the chart's own height leaves no room below it).
 */
async function mount(page, optsSrc, { viewportHeight } = {}) {
  if (viewportHeight) {
    await page.setViewportSize({ width: 1280, height: viewportHeight })
  }
  await page.setContent(`<!doctype html>
    <body style="margin:0">
      <div id="stage" style="width:600px;margin-left:300px"></div>
    </body>`)
  await page.addScriptTag({ path: BUNDLE })
  await page.evaluate((src) => {
    const opts = eval(`(${src})`)
    window.chart = new window.ApexCharts(document.querySelector('#stage'), opts)
    return window.chart.render()
  }, optsSrc)
  await page.waitForFunction(() => window.chart.w.globals.animationEnded)
  await page.waitForTimeout(50)
}

/**
 * Real pointer moves: land 1px short, then on the target, then wait out the
 * 160ms left/top transition.
 */
async function hover(page, x, y) {
  await page.mouse.move(x - 1, y)
  await page.waitForTimeout(120)
  await page.mouse.move(x, y)
  await page.waitForTimeout(300)
}

/**
 * Union of the rects matching `selector`, in viewport px: a bar, or the row
 * of bars a shared tooltip captions.
 */
function rectOf(page, selector) {
  return page.evaluate((sel) => {
    const rs = Array.from(document.querySelectorAll(sel))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height > 0)
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
    }
  }, selector)
}

/**
 * The tooltip box, its placement, the plot, the viewport, and where the arrow
 * tip is: the corner of the rotated arrow square that points away from the
 * box.
 */
function readTooltip(page) {
  return page.evaluate(() => {
    const w = window.chart.w
    const tt = w.dom.elWrap.querySelector(
      '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
    )
    const arrow = tt.querySelector('.apexcharts-tooltip-arrow')
    const b = tt.getBoundingClientRect()
    const placement = tt.dataset.placement ?? null
    let tip = null
    if (arrow && placement) {
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
    const wrap = w.dom.elWrap.getBoundingClientRect()
    const plotLeft = wrap.left + w.layout.translateX
    const plotTop = wrap.top + w.layout.translateY
    return {
      active: tt.classList.contains('apexcharts-active'),
      placement,
      tip,
      box: { left: b.left, top: b.top, right: b.right, bottom: b.bottom },
      plot: {
        left: plotLeft,
        top: plotTop,
        right: plotLeft + w.layout.gridWidth,
        bottom: plotTop + w.layout.gridHeight,
      },
      vw: document.documentElement.clientWidth,
      vh: document.documentElement.clientHeight,
    }
  })
}

const round = (r) =>
  Object.fromEntries(
    Object.entries(r).map(([k, v]) => [
      k,
      typeof v === 'number' ? Math.round(v * 10) / 10 : v,
    ]),
  )

function info(t, bar, label) {
  return (
    `${label}: placement=${t.placement} box=${JSON.stringify(round(t.box))} ` +
    `bar=${JSON.stringify(round(bar))} plot=${JSON.stringify(round(t.plot))} ` +
    `tip=${t.tip ? JSON.stringify(round(t.tip)) : null}`
  )
}

/** Distance from point `p` to rect `r` (0 inside or on it). */
function distance(p, r) {
  const dx = Math.max(r.left - p.x, 0, p.x - r.right)
  const dy = Math.max(r.top - p.y, 0, p.y - r.bottom)
  return Math.hypot(dx, dy)
}

/** How far the two rects overlap along the narrower axis (0 if they don't). */
function overlap(a, b) {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return Math.max(0, Math.min(w, h))
}

/**
 * The premise of every case: the card fits neither above nor below the bar
 * inside the plot, and the page has no room for it above the bar either. The
 * plot is not short for the card, which would put it over the bar by another
 * rule (tooltip-short-plot.spec.js).
 */
function expectNoRoomAboveOrBelow(t, bar, label) {
  const s = info(t, bar, label)
  const height = t.box.bottom - t.box.top
  expect(
    height / (t.plot.bottom - t.plot.top),
    `${s}\nnot a short plot`,
  ).toBeLessThan(SHORT_PLOT_RATIO)
  expect(
    bar.top - GAP - height,
    `${s}\nno room above in the plot`,
  ).toBeLessThan(t.plot.top)
  expect(
    bar.bottom + GAP + height,
    `${s}\nno room below in the plot`,
  ).toBeGreaterThan(t.plot.bottom)
  expect(
    bar.top - GAP - height,
    `${s}\nno room above on the page`,
  ).toBeLessThan(0)
}

/**
 * The premise of a box beside the bar: the page has no room for it below
 * the bar either, out of the plot.
 */
function expectNoRoomBelowOnPage(t, bar, label) {
  const s = info(t, bar, label)
  const height = t.box.bottom - t.box.top
  expect(
    bar.bottom + GAP + height,
    `${s}\nno room below on the page`,
  ).toBeGreaterThan(t.vh)
}

/** The arrow is on the bar, the box covers none of it, all of it on screen. */
function expectArrowOnBar(t, bar, label) {
  const s = info(t, bar, label)
  expect(t.active, `${s}\ntooltip shown`).toBe(true)
  expect(t.tip, `${s}\nan arrow with a placement`).toBeTruthy()
  expect(distance(t.tip, bar), `${s}\narrow tip on the bar`).toBeLessThan(
    TOLERANCE,
  )
  expect(overlap(t.box, bar), `${s}\nbox clear of the bar`).toBeLessThan(
    TOLERANCE,
  )
  expect(
    t.box.top,
    `${s}\nbox inside the viewport (top)`,
  ).toBeGreaterThanOrEqual(-0.5)
  expect(
    t.box.bottom,
    `${s}\nbox inside the viewport (bottom)`,
  ).toBeLessThanOrEqual(t.vh + 0.5)
  expect(
    t.box.left,
    `${s}\nbox inside the viewport (left)`,
  ).toBeGreaterThanOrEqual(-0.5)
  expect(
    t.box.right,
    `${s}\nbox inside the viewport (right)`,
  ).toBeLessThanOrEqual(t.vw + 0.5)
}

/** Beside the bar on `side`, the box inside the plot top to bottom. */
function expectBeside(t, bar, side, label) {
  const s = info(t, bar, label)
  expect(t.placement, s).toBe(side)
  if (side === 'right') {
    expect(t.box.left, s).toBeGreaterThanOrEqual(bar.right + GAP - TOLERANCE)
    expect(t.box.right, s).toBeLessThanOrEqual(t.plot.right + TOLERANCE)
  } else {
    expect(t.box.right, s).toBeLessThanOrEqual(bar.left - GAP + TOLERANCE)
    expect(t.box.left, s).toBeGreaterThanOrEqual(t.plot.left - TOLERANCE)
  }
  expect(t.box.top, s).toBeGreaterThanOrEqual(t.plot.top - TOLERANCE)
  expect(t.box.bottom, s).toBeLessThanOrEqual(t.plot.bottom + TOLERANCE)
  expectArrowOnBar(t, bar, label)
}

// A seven-line card: about 150px, on a plot about 230px tall, so it fits
// neither above nor below any of the three middle rows.
const TALL_CARD = `{
  y: {
    formatter: function (v) {
      return v + '<br>two<br>three<br>four<br>five<br>six<br>seven'
    },
  },
}`

const HBAR = `{
  chart: { type: 'bar', height: 300, animations: { enabled: false } },
  plotOptions: { bar: { horizontal: true } },
  dataLabels: { enabled: false },
  series: [{ name: 'Sales', data: [44, 55, 41, 64, 22] }],
  xaxis: { categories: ['North', 'South', 'East', 'West', 'Central'] },
  tooltip: ${TALL_CARD},
}`

const barSel = (j) => `#stage .apexcharts-bar-area[j="${j}"]`

test.describe('Horizontal bar tooltip: a middle row with no room above or below', () => {
  test('a bar with room below it on the page: below it, out of the plot, before beside it', async ({
    page,
  }) => {
    await mount(page, HBAR)
    const bar = await rectOf(page, barSel(2))
    await hover(page, bar.cx, bar.cy)
    const t = await readTooltip(page)
    const s = info(t, bar, 'bar')

    expectNoRoomAboveOrBelow(t, bar, 'bar')
    expect(t.placement, s).toBe('bottom')
    expect(t.box.top, s).toBeGreaterThanOrEqual(bar.bottom + GAP - TOLERANCE)
    expectArrowOnBar(t, bar, 'bar')
  })

  test('a bar with no room on the page above or below it: beside its value end, inside the plot', async ({
    page,
  }) => {
    await mount(page, HBAR, { viewportHeight: 300 })
    const bar = await rectOf(page, barSel(2))
    await hover(page, bar.cx, bar.cy)
    const t = await readTooltip(page)

    expectNoRoomAboveOrBelow(t, bar, 'bar')
    expectNoRoomBelowOnPage(t, bar, 'bar')
    expectBeside(t, bar, 'right', 'bar')
  })

  test('bars either side of the zero line: beside the value end, not the zero line', async ({
    page,
  }) => {
    // The zero line is in the middle of the plot. The side facing the plot's
    // middle would put the box over the zero line, the arrow on the bar's
    // base. The middle row is the one with no room above or below it on the
    // page, so it is drawn once positive and once negative.
    for (const [label, value, side] of [
      ['positive', 20, 'right'],
      ['negative', -20, 'left'],
    ]) {
      await mount(
        page,
        `{
          chart: { type: 'bar', height: 300, animations: { enabled: false } },
          plotOptions: { bar: { horizontal: true } },
          dataLabels: { enabled: false },
          series: [{ name: 'Net', data: [-30, 25, ${value}, 12, 18] }],
          xaxis: { categories: ['a', 'b', 'c', 'd', 'e'], min: -60, max: 60 },
          tooltip: ${TALL_CARD},
        }`,
        { viewportHeight: 300 },
      )
      const bar = await rectOf(page, barSel(2))
      await hover(page, bar.cx, bar.cy)
      const t = await readTooltip(page)
      expectNoRoomAboveOrBelow(t, bar, label)
      expectNoRoomBelowOnPage(t, bar, label)
      expectBeside(t, bar, side, label)
    }
  })

  test('a range bar: beside it, on the side facing the plot middle', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'rangeBar', height: 300, animations: { enabled: false } },
        plotOptions: { bar: { horizontal: true } },
        series: [{ name: 'Plan', data: [
          { x: 'a', y: [1, 5] },
          { x: 'b', y: [3, 8] },
          { x: 'c', y: [6, 8.5] },
          { x: 'd', y: [2, 9] },
          { x: 'e', y: [5, 7] },
        ] }],
        // A range bar follows the cursor by default, which draws no arrow;
        // the box goes to the same place either way.
        tooltip: {
          followCursor: false,
          custom: function () {
            return '<div style="height:140px;width:120px;padding:6px">Range</div>'
          },
        },
      }`,
      { viewportHeight: 300 },
    )
    const bar = await rectOf(page, `#stage .apexcharts-rangebar-area[j="2"]`)
    await hover(page, bar.cx, bar.cy)
    const t = await readTooltip(page)

    expectNoRoomAboveOrBelow(t, bar, 'range')
    expectNoRoomBelowOnPage(t, bar, 'range')
    expect(bar.cx, 'premise: right of the plot middle').toBeGreaterThan(
      (t.plot.left + t.plot.right) / 2,
    )
    expectBeside(t, bar, 'left', 'range')
  })

  test('a funnel bar too wide for a box beside it: below it, on screen', async ({
    page,
  }) => {
    await mount(
      page,
      `{
        chart: { type: 'funnel', height: 300, animations: { enabled: false } },
        series: [{ name: 'Leads', data: [100, 80, 60, 40, 20] }],
        xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
        tooltip: {
          custom: function () {
            return '<div style="height:140px;width:140px;padding:6px">Stage</div>'
          },
        },
      }`,
    )
    const bar = await rectOf(page, barSel(2))
    await hover(page, bar.cx, bar.cy)
    const t = await readTooltip(page)
    const s = info(t, bar, 'funnel')

    expectNoRoomAboveOrBelow(t, bar, 'funnel')
    const width = t.box.right - t.box.left
    expect(bar.right + GAP + width, `${s}\nno room right`).toBeGreaterThan(
      t.plot.right,
    )
    expect(bar.left - GAP - width, `${s}\nno room left`).toBeLessThan(
      t.plot.left,
    )
    // Out of the plot below the bar, where the page has room, rather than
    // above it and off the top of the screen.
    expect(t.placement, s).toBe('bottom')
    expect(t.box.top, s).toBeGreaterThanOrEqual(bar.bottom + GAP - TOLERANCE)
    expectArrowOnBar(t, bar, 'funnel')
  })

  test('a shared row: beside the row, past its value end', async ({ page }) => {
    await mount(
      page,
      `{
        chart: { type: 'bar', height: 400, animations: { enabled: false } },
        plotOptions: { bar: { horizontal: true } },
        dataLabels: { enabled: false },
        series: [
          { name: 'Revenue', data: [44, 55, 41, 64, 22] },
          { name: 'Cost', data: [14, 25, 31, 24, 32] },
        ],
        xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
        tooltip: {
          shared: true,
          intersect: false,
          y: {
            formatter: function (v) {
              return v + '<br>two<br>three<br>four'
            },
          },
        },
      }`,
      // cut off just short of the room for the box below the row
      { viewportHeight: 390 },
    )
    const row = await rectOf(page, barSel(2))
    await hover(page, row.cx, row.cy)
    const t = await readTooltip(page)

    expectNoRoomAboveOrBelow(t, row, 'shared row')
    expectNoRoomBelowOnPage(t, row, 'shared row')
    expectBeside(t, row, 'right', 'shared row')
  })
})

test.describe('Horizontal bar tooltip: keyboard', () => {
  test('keyboard focus puts the box where the pointer does', async ({
    page,
  }) => {
    await mount(page, HBAR, { viewportHeight: 300 })
    const bar = await rectOf(page, barSel(2))
    await hover(page, bar.cx, bar.cy)
    const byPointer = await readTooltip(page)
    expectBeside(byPointer, bar, 'right', 'pointer')

    await page.mouse.move(2, 290)
    await page.waitForTimeout(250)
    await page.evaluate(() =>
      document.querySelector('#stage .apexcharts-svg').focus(),
    )
    const focusedJ = () =>
      page.evaluate(() =>
        Number(
          document
            .querySelector('.apexcharts-keyboard-focused')
            ?.getAttribute('j'),
        ),
      )
    for (let n = 0; n < 5 && (await focusedJ()) !== 2; n++) {
      await page.keyboard.press('ArrowRight')
    }
    expect(await focusedJ(), 'reached the middle bar').toBe(2)
    await page.waitForTimeout(300)

    const byKeyboard = await readTooltip(page)
    expectBeside(byKeyboard, bar, 'right', 'keyboard')
    for (const k of ['left', 'top', 'right', 'bottom']) {
      expect(
        Math.abs(byKeyboard.box[k] - byPointer.box[k]),
        `keyboard box ${k} matches the pointer's: ${info(byKeyboard, bar, 'keyboard')}`,
      ).toBeLessThanOrEqual(TOLERANCE)
    }
  })
})
