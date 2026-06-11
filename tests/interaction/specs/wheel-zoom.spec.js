/**
 * Mouse-wheel zoom depth.
 *
 * Regression for: wheel-zoom-in stalled partway and then just panned the
 * timeline a few pixels toward the cursor on every further scroll, while the
 * toolbar zoom-in button still zoomed normally. Cause was a hard floor in
 * ZoomPanSelection.executeMouseWheelZoom that pinned the visible window at 1%
 * of the *full* data span — on this 2000-candle series ≈ 20 candles. Once hit,
 * the clamp re-centred the fixed-width window on the cursor each scroll (the
 * "shift by pixels" symptom). The toolbar's handleZoomIn has no such floor.
 *
 * Fix ties the floor to data granularity (~2 points, via globals.minXDiff), so
 * the wheel can zoom as deep as the toolbar. This test scrolls in repeatedly
 * and asserts the visible x-span drops well below the old 1%-of-span floor.
 *
 * Fixture: samples/vanilla-js/candlestick/large-dataset.html (2000 daily candles).
 */

import { test, expect } from '../fixtures/base.js'
import { wheelOnChart, getXRange } from '../helpers/chart.js'

test.describe('Mouse-wheel zoom', () => {
  test('keeps zooming in past the old 1%-of-span floor', async ({
    page,
    loadChart,
  }) => {
    await loadChart('candlestick', 'large-dataset')

    const full = await getXRange(page)
    const fullSpan = full.maxX - full.minX
    const oldFloor = fullSpan * 0.01 // the previous hard minimum range

    // Each scroll-in halves the window; ~7 halvings cross from 100% to <1%.
    // wheelOnChart waits 300ms; the extra settle clears the 400ms wheel debounce
    // so every wheel actually executes a zoom step.
    let span = fullSpan
    for (let i = 0; i < 14; i++) {
      await wheelOnChart(page, { x: 300, y: 150 }, -120)
      await page.waitForTimeout(250)
      const r = await getXRange(page)
      span = r.maxX - r.minX
    }

    // Bug: span would stall around the 1% floor and never drop below it.
    expect(span).toBeLessThan(oldFloor)
  })
})
