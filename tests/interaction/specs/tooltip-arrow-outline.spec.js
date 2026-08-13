/**
 * Tooltip arrow — one continuous outline around body + arrow.
 *
 * The arrow used to be a `clip-path` triangle. `clip-path` erases `border` and
 * `box-shadow` along with everything outside the polygon, so the only way to
 * hint at an edge was `filter: drop-shadow`, which can blur an outline but
 * never draw one — the arrow read as a smudge against the chart.
 *
 * It's now a 45°-rotated square whose two outward-facing sides carry the same
 * 1px border as the tooltip body, centred on the body's border line so the two
 * meet end to end. This spec pins the properties that make that work, because
 * each one is individually easy to "tidy up" back into a broken state:
 *   - no `clip-path` and no `filter` (the old workaround),
 *   - exactly two 1px borders, in the body's own border colour,
 *   - the bordered pair is the one meeting at the tip, per placement,
 *   - `box-sizing: border-box`, without which the bordered sides grow the
 *     square asymmetrically and shove its centre off the body's border line,
 *   - the tip overhangs by ~ARROW_TIP_OVERHANG (tooltip/constants.js), which
 *     the JS placement math assumes when it reserves the gap to the data point.
 */

import { test, expect } from '../fixtures/base.js'
import { hoverDataPoint, waitForTooltip } from '../helpers/chart.js'

// A 10px square rotated 45° reaches 10/√2 from its centre to each corner.
const TIP_OVERHANG = 10 / Math.SQRT2

/** Read everything we assert on in one page round-trip. */
async function readArrow(page) {
  return page.evaluate(() => {
    const tt = document.querySelector('.apexcharts-tooltip.apexcharts-active')
    const ar = tt && tt.querySelector('.apexcharts-tooltip-arrow')
    if (!ar) return null

    const cs = getComputedStyle(ar)
    const ttCs = getComputedStyle(tt)
    const t = tt.getBoundingClientRect()
    const a = ar.getBoundingClientRect()
    const sides = ['Top', 'Right', 'Bottom', 'Left']

    return {
      placement: tt.getAttribute('data-placement'),
      clipPath: cs.clipPath,
      filter: cs.filter,
      boxSizing: cs.boxSizing,
      bodyBorderColor: ttCs.borderTopColor,
      // Sides carrying a visible border, lowercased: e.g. ['top', 'right'].
      bordered: sides
        .filter((s) => parseFloat(cs[`border${s}Width`]) > 0)
        .map((s) => s.toLowerCase()),
      borderColors: sides
        .filter((s) => parseFloat(cs[`border${s}Width`]) > 0)
        .map((s) => cs[`border${s}Color`]),
      // Rotated bounding box — a 10px square at 45° measures 10*√2 ≈ 14.14.
      boxW: a.width,
      boxH: a.height,
      // How far the arrow's bounding box escapes each side of the body.
      outLeft: t.left - a.left,
      outRight: a.right - t.right,
      outTop: t.top - a.top,
      outBottom: a.bottom - t.bottom,
    }
  })
}

/**
 * For each placement, the pair of borders that must be set is the two sides
 * sharing the square corner that `rotate(45deg)` swings around to the tip:
 * bottom-left → left, top-right → right, top-left → top, bottom-right → bottom.
 */
const OUTWARD_BORDERS = {
  right: ['bottom', 'left'], // tooltip right of the point, arrow points LEFT
  left: ['top', 'right'], // tooltip left of the point, arrow points RIGHT
  top: ['right', 'bottom'], // tooltip above the point, arrow points DOWN
  bottom: ['top', 'left'], // tooltip below the point, arrow points UP
}

/**
 * A grouped column chart in intersect mode — the case in the bug report, and
 * one of the few that resolves a single anchor point (shared tooltips on a
 * multi-series vertical chart are gated out of the arrow entirely).
 */
async function loadIntersectColumn(page, loadChart, tooltip = {}) {
  await loadChart('column', 'basic-column')
  await page.evaluate(
    (tt) => window.chart.updateOptions({ tooltip: tt }),
    { shared: false, intersect: true, ...tooltip },
  )
  await page.waitForFunction(
    () => window.chart && window.chart.w.globals.animationEnded === true,
  )
}

/** Assertions that hold for every placement. */
function expectContinuousOutline(a) {
  // The old shadow workaround must not come back.
  expect(a.clipPath).toBe('none')
  expect(a.filter).toBe('none')

  // border-box keeps the square 10x10 whichever two sides are bordered.
  expect(a.boxSizing).toBe('border-box')
  expect(a.boxW).toBeCloseTo(10 * Math.SQRT2, 1)
  expect(a.boxH).toBeCloseTo(10 * Math.SQRT2, 1)

  // Exactly the two outward-facing sides are bordered, and in the body's own
  // colour — that identity is what makes the outline read as a single line.
  expect(a.bordered.sort()).toEqual(OUTWARD_BORDERS[a.placement].slice().sort())
  for (const c of a.borderColors) expect(c).toBe(a.bodyBorderColor)
}

test.describe('Tooltip arrow — continuous border', () => {
  test('horizontal placement: bordered facets meet the body, tip overhangs ~7px', async ({
    page,
    loadChart,
  }) => {
    await loadIntersectColumn(page, loadChart)

    // A column near the middle so the tooltip has room on either side.
    await hoverDataPoint(page, 0, 4)
    await waitForTooltip(page)

    const a = await readArrow(page)
    expect(a).not.toBeNull()
    expect(['left', 'right']).toContain(a.placement)
    expectContinuousOutline(a)

    // The arrow escapes the body on exactly the side it points at, by the
    // overhang the placement math budgets for.
    const out = a.placement === 'right' ? a.outLeft : a.outRight
    expect(out).toBeCloseTo(TIP_OVERHANG, 1)
  })

  test('vertical placement: same outline, overhang on the pointing side', async ({
    page,
    loadChart,
  }) => {
    await loadChart('heatmap', 'basic')

    await hoverDataPoint(page, 2, 4)
    await waitForTooltip(page)

    const a = await readArrow(page)
    expect(a).not.toBeNull()
    expect(['top', 'bottom']).toContain(a.placement)
    expectContinuousOutline(a)

    const out = a.placement === 'top' ? a.outBottom : a.outTop
    expect(out).toBeCloseTo(TIP_OVERHANG, 1)
  })

  test('dark theme recolours body and arrow together', async ({
    page,
    loadChart,
  }) => {
    await loadIntersectColumn(page, loadChart)

    await hoverDataPoint(page, 0, 4)
    await waitForTooltip(page)

    // Swap the theme class on the live element rather than through
    // updateOptions: the join is a pure CSS contract (both sides read the same
    // `--apx-tt-border`), so drive it at the level that owns it.
    const a = await page.evaluate(() => {
      const tt = document.querySelector('.apexcharts-tooltip.apexcharts-active')
      tt.classList.remove('apexcharts-theme-light')
      tt.classList.add('apexcharts-theme-dark')
      const ar = tt.querySelector('.apexcharts-tooltip-arrow')
      const cs = getComputedStyle(ar)
      return {
        bodyBorderColor: getComputedStyle(tt).borderTopColor,
        borderColors: ['Top', 'Right', 'Bottom', 'Left']
          .filter((s) => parseFloat(cs[`border${s}Width`]) > 0)
          .map((s) => cs[`border${s}Color`]),
      }
    })

    // The dark token is a light rim, not the light theme's dark one — and the
    // arrow's facets followed it, so the outline stays one colour end to end.
    expect(a.bodyBorderColor).toContain('255, 255, 255')
    expect(a.borderColors).toHaveLength(2)
    for (const c of a.borderColors) expect(c).toBe(a.bodyBorderColor)
  })
})
