import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// hideSeries/showSeries/toggleSeries threw a TypeError for a name no series
// carries. And a stacked series hidden from the legend on a showAlways y axis
// got its values back on the next updateSeries: it stayed invisible, but the
// visible series stacked on top of it.

const sum = (a) => (a || []).reduce((s, v) => s + (v || 0), 0)

describe('series visibility API with an unknown name', () => {
  const mk = () =>
    createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'B', data: [3, 2, 1] },
      ],
    })

  it('hide, show and toggle are no-ops', () => {
    const c = mk()
    expect(() => c.hideSeries('nope')).not.toThrow()
    expect(() => c.showSeries('nope')).not.toThrow()
    expect(c.toggleSeries('nope')).toBe(false)
    expect(c.w.globals.collapsedSeriesIndices).toEqual([])
    expect(c.w.globals.ancillaryCollapsedSeriesIndices).toEqual([])
  })
})

describe('a series hidden on a showAlways y axis', () => {
  const series = () => [
    { name: 'A', data: [10, 10, 10] },
    { name: 'B', data: [1, 2, 3] },
    { name: 'C', data: [4, 5, 6] },
  ]

  it('stays out of the stack across updateSeries', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', stacked: true, width: 600, height: 300 },
      yaxis: { show: true, showAlways: true },
      xaxis: { categories: ['a', 'b', 'c'] },
      series: series(),
    })
    await chart.hideSeries('A')
    expect(chart.w.globals.ancillaryCollapsedSeriesIndices).toEqual([0])

    await chart.updateSeries(series())
    expect(chart.w.globals.ancillaryCollapsedSeriesIndices).toEqual([0])
    expect(sum(chart.w.seriesData.series[0])).toBe(0)

    // and comes back with the updated values
    await chart.showSeries('A')
    expect(sum(chart.w.seriesData.series[0])).toBe(30)
  })
})
