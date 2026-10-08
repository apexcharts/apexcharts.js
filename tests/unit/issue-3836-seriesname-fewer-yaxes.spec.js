import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #3836: string seriesName values with fewer yaxes than series threw
 * "Cannot read properties of undefined (reading 'push')". The first
 * setSeriesYAxisMappings() call (from parseDataAxisCharts) read
 * seriesData.series.length while it was still 0, so it took the one-to-one
 * branch and indexed axisSeriesMap past the last yaxis.
 */
describe('issue 3836: string seriesName with more series than yaxes', () => {
  it('renders the stacked column and line config from the issue', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', stacked: true },
      series: [
        { name: 'Serie 1', type: 'column', data: [26545.15, 0, 0, 35567.66] },
        { name: 'Series 2', type: 'column', data: [0, 15663.2, 7586.2, 0] },
        {
          name: 'Accumulated',
          type: 'line',
          data: [26545.15, 42208.35, 49794.55, 85362.21],
        },
      ],
      yaxis: [
        { seriesName: 'Serie 1' },
        { opposite: true, seriesName: 'Accumulated' },
      ],
    })
    await chart.render()

    const { seriesYAxisMap, seriesYAxisReverseMap } = chart.getState()
    expect(seriesYAxisMap).toEqual([[0], [2, 1]])
    expect(seriesYAxisReverseMap).toEqual([0, 1, 1])
    chart.destroy()
  })

  it('maps an unnamed middle series to the last free axis', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [10, 20, 30] },
        { name: 'C', data: [100, 200, 300] },
      ],
      yaxis: [{ seriesName: 'A' }, { opposite: true, seriesName: 'C' }],
    })
    await chart.render()

    const { seriesYAxisMap, seriesYAxisReverseMap, maxYArr } = chart.getState()
    expect(seriesYAxisMap).toEqual([[0], [2, 1]])
    expect(seriesYAxisReverseMap).toEqual([0, 1, 1])
    expect(maxYArr[0]).toBeLessThan(maxYArr[1])
    expect(chart.w.config.series.map((s) => s.group)).toEqual([
      'apexcharts-axis-0',
      'apexcharts-axis-1',
      'apexcharts-axis-1',
    ])
    chart.destroy()
  })
})
