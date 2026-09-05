/**
 * Brush selection bounds (regression guard for apexcharts.js#5123).
 *
 * Dragging a selection handle past the first or last data point used to keep
 * widening the rect into empty space: SVGSelectable moves a handle freely (its
 * only guard is a negative width) and the resize listener in ZoomPanSelection
 * read the resulting attributes without a bound. The brush then pushed that
 * out-of-range window onto the target chart, which scrolled off the end of its
 * own data.
 *
 * The x-domain occupies exactly 0..gridWidth pixels in the selection rect's
 * coordinate space (see AxisMapping), so those two numbers are the data
 * boundary in rect coordinates and every assertion below is expressed against
 * them.
 *
 * Fixture: samples/vanilla-js/line/brush-charts.html
 *   - window.chart     = target chart (chart2), driven by the brush
 *   - window.chartLine = brush chart (chart1), owns the selection rect
 */

import { test, expect } from '../fixtures/base.js'
import { getXRange } from '../helpers/chart.js'

const CHART = 'line'
const FIXTURE = 'brush-charts'

// Handle order created by SVGSelectable: t, b, l, r, lt, rt, lb, rb.
const HANDLE_INDEX = { l: 2, r: 3 }

// A handle dragged this far past the plot edge is unambiguously out of range:
// wide enough that an unclamped rect overshoots by hundreds of pixels, so the
// test cannot pass by accident on a rounding difference.
const OVERSHOOT_PX = 400

// Geometry is compared to within a pixel's worth of data. Sub-pixel drift comes
// from float rounding in the px<->data round trip, not from a missing bound.
const TOLERANCE_PX = 1

/** Wait until both charts in the brush sample have settled. */
async function waitForBrushPair(page) {
  await page.waitForFunction(
    () =>
      window.chart &&
      window.chartLine &&
      window.chart.w.globals.animationEnded === true &&
      window.chartLine.w.globals.animationEnded === true,
    { timeout: 10_000 },
  )
}

/**
 * Drag a selection resize handle horizontally.
 *
 * dragOnChart() cannot be reused here: it dispatches on `.apexcharts-svg`,
 * whereas a handle drag starts with mousedown on the handle node and then moves
 * on `document` (that is where SVGSelectable listens).
 *
 * @param {import('@playwright/test').Page} page
 * @param {'l'|'r'} which
 * @param {number} dxPx signed horizontal distance
 */
async function dragSelectionHandle(page, which, dxPx) {
  await page.evaluate(
    ({ index, dxPx }) => {
      const handle = window.chartLine.el.querySelectorAll(
        '.svg_select_points > g',
      )[index]
      const box = handle.getBoundingClientRect()
      const cx = box.left + box.width / 2
      const cy = box.top + box.height / 2
      const mouse = (type, x) =>
        new MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: x,
          clientY: cy,
          button: 0,
          buttons: 1,
          which: 1,
        })

      handle.dispatchEvent(mouse('mousedown', cx))
      const steps = 10
      for (let i = 1; i <= steps; i++) {
        document.dispatchEvent(mouse('mousemove', cx + (dxPx * i) / steps))
      }
      document.dispatchEvent(mouse('mouseup', cx + dxPx))
    },
    { index: HANDLE_INDEX[which], dxPx },
  )
  // The resize listener re-reports through a 30ms debounce, which then updates
  // the target chart.
  await page.waitForTimeout(400)
}

/** Selection rect geometry plus the data bounds it must stay inside. */
function readSelectionBounds(page) {
  return page.evaluate(() => {
    const w = window.chartLine.w
    const rect = window.chartLine.el.querySelector('.apexcharts-selection-rect')
    const x = parseFloat(rect.getAttribute('x'))
    const width = parseFloat(rect.getAttribute('width'))
    const xRatio = (w.globals.maxX - w.globals.minX) / w.layout.gridWidth
    return {
      dataMinX: w.globals.minX,
      dataMaxX: w.globals.maxX,
      gridWidth: w.layout.gridWidth,
      xRatio,
      rectLeftPx: x,
      rectRightPx: x + width,
      rectWidthPx: width,
      // The range the rect claims under the shared mapping.
      impliedMinX: w.globals.minX + x * xRatio,
      impliedMaxX: w.globals.minX + (x + width) * xRatio,
    }
  })
}

test.describe('Brush selection handles stay inside the data range', () => {
  test.beforeEach(async ({ loadChart }) => {
    await loadChart(CHART, FIXTURE)
    // loadChart only waits on window.chart (the target); the brush chart that
    // owns the selection rect renders after it.
  })

  test('the right handle stops at the last data point', async ({ page }) => {
    await waitForBrushPair(page)
    const before = await readSelectionBounds(page)

    await dragSelectionHandle(page, 'r', OVERSHOOT_PX)

    const after = await readSelectionBounds(page)

    // The rect must not extend past the pixel the domain maximum sits on.
    expect(
      after.rectRightPx,
      'rect right edge ran past the plot (gridWidth)',
    ).toBeLessThanOrEqual(after.gridWidth + TOLERANCE_PX)

    // Same statement in data units: no selection beyond the last data point.
    expect(
      (after.impliedMaxX - after.dataMaxX) / after.xRatio,
      'selection extends past the data maximum',
    ).toBeLessThanOrEqual(TOLERANCE_PX)

    // The drag must still have done something, otherwise the clamp could be
    // passing by freezing the handle outright.
    expect(
      after.rectWidthPx,
      'the handle did not move at all',
    ).toBeGreaterThan(before.rectWidthPx)
  })

  test('the left handle stops at the first data point', async ({ page }) => {
    await waitForBrushPair(page)
    const before = await readSelectionBounds(page)

    await dragSelectionHandle(page, 'l', -OVERSHOOT_PX)

    const after = await readSelectionBounds(page)

    expect(
      after.rectLeftPx,
      'rect left edge ran past the plot origin',
    ).toBeGreaterThanOrEqual(-TOLERANCE_PX)

    expect(
      (after.dataMinX - after.impliedMinX) / after.xRatio,
      'selection extends before the data minimum',
    ).toBeLessThanOrEqual(TOLERANCE_PX)

    expect(
      after.rectWidthPx,
      'the handle did not move at all',
    ).toBeGreaterThan(before.rectWidthPx)
  })

  test('the target chart is not scrolled into empty space', async ({ page }) => {
    // The user-visible symptom: the brush pushes its range onto the target
    // chart, so an unbounded selection drags the target off the end of the data.
    await waitForBrushPair(page)

    await dragSelectionHandle(page, 'r', OVERSHOOT_PX)

    const bounds = await readSelectionBounds(page)
    const { maxX } = await getXRange(page) // window.chart = the target chart

    expect(
      (maxX - bounds.dataMaxX) / bounds.xRatio,
      'target chart shows empty space past the last data point',
    ).toBeLessThanOrEqual(TOLERANCE_PX)
  })

  test('a handle resize inside the plot still moves freely', async ({ page }) => {
    // Guard rail for the clamp itself: it must only bite at the boundary. A
    // modest inward drag has to keep tracking the pointer one-to-one.
    await waitForBrushPair(page)
    const before = await readSelectionBounds(page)

    // Shrink from the right, well clear of both edges.
    const shrinkPx = 60
    await dragSelectionHandle(page, 'r', -shrinkPx)

    const after = await readSelectionBounds(page)

    expect(
      Math.abs(after.rectWidthPx - (before.rectWidthPx - shrinkPx)),
      'an in-bounds resize did not follow the pointer',
    ).toBeLessThanOrEqual(TOLERANCE_PX)
    expect(after.rectLeftPx).toBeCloseTo(before.rectLeftPx, 1)
  })
})
