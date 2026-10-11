import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// update()'s identical-options dedupe compares
// against the options of the last FULL update. A fast-path updateSeries in
// between draws something else without invalidating that snapshot, so
// re-sending the earlier options is skipped while w.config takes them.

describe('dedupe after a fast-path updateSeries', () => {
  it('redraws options re-applied after a fast-path updateSeries', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    await chart.updateOptions({ series: [{ name: 'A', data: [10, 20, 30] }] })
    await chart.updateSeries([{ name: 'A', data: [11, 21, 31] }])
    const st = chart._updateStats
    expect(st.full).toBe(0) // the updateSeries took the fast path
    expect(chart.w.seriesData.series).toEqual([[11, 21, 31]])

    const updateSpy = vi.spyOn(chart, 'update')
    await chart.updateOptions({ series: [{ name: 'A', data: [10, 20, 30] }] })
    console.log(
      'update calls',
      updateSpy.mock.calls.length,
      'config',
      JSON.stringify(chart.w.config.series.map((s) => s.data)),
      'drawn',
      JSON.stringify(chart.w.seriesData.series),
      'y-ticks',
      JSON.stringify(
        [...document.querySelectorAll('.apexcharts-yaxis-label')].map(
          (n) => n.textContent,
        ),
      ),
    )
    expect(chart.w.config.series.map((s) => s.data)).toEqual([[10, 20, 30]])
    expect(chart.w.seriesData.series).toEqual([[10, 20, 30]])
  })
})
