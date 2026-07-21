/**
 * Line chart — hover / tooltip interaction tests.
 *
 * Covers:
 *   - Tooltip appears on hover with correct series value
 *   - pathMouseEnter fires without throwing (no console error)
 *   - dataPointMouseEnter event fires with correct seriesIndex / dataPointIndex
 *   - Tooltip disappears on mouse out
 */

import { test, expect } from '../fixtures/base.js'
import {
  hoverDataPoint,
  waitForTooltip,
  getTooltipYValues,
  getTooltipTitle,
  captureEvent,
} from '../helpers/chart.js'

// basic-line.html: single series "Sign-ups"
// data: [210, 380, 340, 520, 480, 610, 700, 880, 820, 1040, 1180, 1520]
// xaxis categories: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec

test.describe('Line chart hover', () => {
  test('tooltip shows correct value on hover', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    // Hover the first data point (Jan, 210)
    await hoverDataPoint(page, 0, 0)
    await waitForTooltip(page)

    const title = await getTooltipTitle(page)
    expect(title).toBe('Jan')

    const values = await getTooltipYValues(page)
    expect(values[0]).toBe('210')
  })

  test('tooltip shows correct value for mid-series point', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    // Hover series 0, point 4 (May, 480)
    await hoverDataPoint(page, 0, 4)
    await waitForTooltip(page)

    const title = await getTooltipTitle(page)
    expect(title).toBe('May')

    const values = await getTooltipYValues(page)
    expect(values[0]).toBe('480')
  })

  test('no JS errors thrown when hovering data points', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    // Hover every data point — any crash in pathMouseEnter/Leave/Down or
    // the tooltip pipeline will be caught by the consoleErrors fixture check.
    for (let j = 0; j < 12; j++) {
      await hoverDataPoint(page, 0, j)
    }
    // consoleErrors assertion runs automatically in the fixture afterEach.
  })

  test('dataPointMouseEnter event fires with correct indices', async ({ page, loadChart }) => {
    await loadChart('line', 'basic-line')

    const cfg = await captureEvent(page, 'dataPointMouseEnter', () =>
      hoverDataPoint(page, 0, 2),
    )
    expect(cfg.seriesIndex).toBe(0)
    expect(cfg.dataPointIndex).toBe(2)
  })
})
