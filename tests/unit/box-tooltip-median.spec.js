/**
 * The box plot tooltip's Median row was guarded by a truthiness test on the
 * value, so zero-centred data (residuals, deltas, P&L) showed every row but
 * the median.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/boxPlot.js'
import '../../src/entries/candlestick.js'

const caption = (chart) =>
  chart.w.config.tooltip.custom({
    seriesIndex: 0,
    dataPointIndex: 0,
    w: chart.w,
  })

describe('the five-number tooltip', () => {
  it('shows a median of 0', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'boxPlot' },
      series: [{ name: 'r', data: [{ x: 'a', y: [-5, -2, 0, 3, 6] }] }],
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(caption(chart)).toMatch(/Median:\s*<span class="value">0</)
  })

  it('GUARD a candlestick still has no median row', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'candlestick' },
      series: [{ name: 'c', data: [{ x: 1, y: [1, 3, 0, 2] }] }],
    })
    await new Promise((r) => setTimeout(r, 0))
    expect(caption(chart)).toContain('Open')
    expect(caption(chart).match(/<div>/g)).toHaveLength(4)
  })
})
