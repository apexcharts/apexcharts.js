/**
 * Mouse-wheel zoom-OUT must keep working at the lower (first-points) boundary
 * of a category x-axis.
 *
 * Regression for: after wheel-zooming in near the left edge until only the
 * first ~3 categories were visible, further wheel scrolls to zoom OUT did
 * nothing, while the toolbar zoom-out button and wheel zoom-out at the UPPER
 * boundary both worked. Cause was ZoomPanSelection._applyXRange flooring BOTH
 * edges of a converted-category window: with the low edge pinned at the first
 * category, a fractional zoom-out (e.g. range 2 -> 2.83) floored the high edge
 * straight back down, so the integer window never changed and the gesture
 * stalled. Fix: while zooming OUT, ceil the high edge so the span always grows
 * by at least one whole category (zoom-in and pan still floor both edges, so
 * zoom-in keeps tightening to the 3-point floor).
 *
 * Fixture: samples/vanilla-js/line/stepline.html (12 monthly categories).
 */
import { test, expect } from '../fixtures/base.js'
import { wheelOnChart, getXRange } from '../helpers/chart.js'

const LEFT = { x: 60, y: 150 }
const RIGHT = { x: 1100, y: 150 }
const MID = { x: 600, y: 150 }

test.describe('Wheel zoom-out at category-axis boundaries', () => {
  test('zoom-out progresses at the LOWER (first points) boundary', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'stepline')

    // Zoom in with the cursor pinned near the LEFT edge -> converges to the
    // first few categories.
    for (let i = 0; i < 12; i++) await wheelOnChart(page, LEFT, -120)
    const zoomedIn = await getXRange(page)
    const spanIn = zoomedIn.maxX - zoomedIn.minX

    // Realistic single wheel notches out. The window must widen (used to stall).
    await wheelOnChart(page, LEFT, 120)
    const afterOne = await getXRange(page)
    expect(afterOne.maxX - afterOne.minX).toBeGreaterThan(spanIn)
  })

  test('zoom-out progresses at the UPPER (last points) boundary', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'stepline')

    for (let i = 0; i < 12; i++) await wheelOnChart(page, RIGHT, -120)
    const zoomedIn = await getXRange(page)
    const spanIn = zoomedIn.maxX - zoomedIn.minX

    await wheelOnChart(page, RIGHT, 120)
    const afterOne = await getXRange(page)
    expect(afterOne.maxX - afterOne.minX).toBeGreaterThan(spanIn)
  })

  test('zoom-IN keeps tightening in the MIDDLE (ceil must not stall it)', async ({
    page,
    loadChart,
  }) => {
    await loadChart('line', 'stepline')

    let span = Infinity
    for (let i = 0; i < 10; i++) {
      await wheelOnChart(page, MID, -120)
      const r = await getXRange(page)
      span = r.maxX - r.minX
    }
    // Must reach the tight 3-point floor (span 2), not deadlock at a wider span.
    expect(span).toBeLessThanOrEqual(2)
  })
})
