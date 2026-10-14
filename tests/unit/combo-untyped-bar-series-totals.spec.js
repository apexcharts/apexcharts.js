import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Series from '../../src/modules/Series.js'

// A stacked bar + line combo whose bar series leave out `type` (they draw as
// chart.type) showed stacked totals of 0, and the top of the stack was taken
// to be the first series: the bar helpers read only an explicit series.type.

const opts = () => ({
  chart: { type: 'bar', stacked: true, width: 600, height: 300 },
  xaxis: { categories: ['a', 'b'] },
  plotOptions: { bar: { dataLabels: { total: { enabled: true } } } },
  series: [
    { name: 'A', data: [1, 2] },
    { name: 'B', data: [3, 4] },
    { name: 'L', type: 'line', data: [5, 5] },
  ],
})

describe('combo with untyped bar series', () => {
  it('counts them as bars', () => {
    const c = createChartWithOptions(opts())
    const s = new Series(c.w)
    expect(s.getBarSeriesIndices()).toEqual([0, 1])
    expect(s.getActiveConfigSeriesIndex('desc', ['bar', 'column'])).toBe(1)
    expect(s.getActiveConfigSeriesIndex('asc', ['line'])).toBe(2)
  })

  it('draws the stacked totals', () => {
    const c = createChartWithOptions(opts())
    const totals = [
      ...c.w.dom.baseEl.querySelectorAll('.apexcharts-datalabel-total'),
    ].map((t) => t.textContent)
    expect(totals).toEqual(['4', '6'])
  })

  it('caps grouped stacks with the last untyped bar of each group', () => {
    const c = createChartWithOptions({
      ...opts(),
      series: [
        { name: 'A', group: 'g1', data: [1, 2] },
        { name: 'B', group: 'g1', data: [3, 4] },
        { name: 'C', group: 'g2', data: [2, 2] },
        { name: 'L', type: 'line', data: [5, 5] },
      ],
    })
    const byGroup = new Series(c.w).getActiveConfigSeriesIndexByGroup([
      'bar',
      'column',
    ])
    expect(byGroup.slice(0, 2)).toEqual([1, 2])
  })
})
