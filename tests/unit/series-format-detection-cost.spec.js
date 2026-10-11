import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Series from '../../src/modules/Series'

// The data format is read off the active series, which is constant for a
// parse. Looking it up again for every format check of every series made the
// parse quadratic in the series count.

describe('format detection cost', () => {
  it('looks the active series up a bounded number of times per parse', async () => {
    const S = 60
    const series = Array.from({ length: S }, (_, i) => ({
      name: 's' + i,
      data: [
        { x: 'a', y: i },
        { x: 'b', y: i + 1 },
      ],
    }))
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series,
    })
    const spy = vi.spyOn(Series.prototype, 'getActiveConfigSeriesIndex')
    try {
      await chart.updateSeries(series.map((s) => ({ ...s })))
      expect(spy.mock.calls.length).toBeLessThan(S)
    } finally {
      spy.mockRestore()
    }
    expect(chart.w.seriesData.series.length).toBe(S)
    expect(chart.w.seriesData.series[S - 1]).toEqual([S - 1, S])
  })
})
