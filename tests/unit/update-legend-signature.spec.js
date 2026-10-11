import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The data-only fast path keeps the legend DOM, so an updateSeries() that
// changes what the legend shows (a name, a colour, `hidden`, or the text a
// data-reading legend.formatter returns) has to take the full render. One
// that changes only the data must keep the fast path, formatter or not.

const legendTexts = () =>
  [...document.querySelectorAll('.apexcharts-legend-text')].map(
    (n) => n.textContent,
  )

const twoLines = (extra = {}) =>
  createChartWithOptions({
    chart: { type: 'line' },
    series: [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [3, 2, 1] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    ...extra,
  })

describe('legend after updateSeries', () => {
  it('shows renamed and recoloured series', async () => {
    const chart = twoLines()
    expect(legendTexts()).toEqual(['A', 'B'])
    await chart.updateSeries([
      { name: 'Revenue', data: [2, 3, 4], color: '#00aa00' },
      { name: 'Cost', data: [4, 3, 2], color: '#cc0000' },
    ])
    expect(chart._updateStats.full).toBe(1)
    expect(legendTexts()).toEqual(['Revenue', 'Cost'])
  })

  it('hides a series that updateSeries marks hidden', async () => {
    const chart = twoLines()
    await chart.updateSeries([
      { name: 'A', data: [2, 3, 4] },
      { name: 'B', data: [4, 3, 2], hidden: true },
    ])
    expect(chart._updateStats.full).toBe(1)
    expect(chart.series.isSeriesHidden('B').isHidden).toBe(true)
  })

  it('regroups series through the full render', async () => {
    const chart = twoLines()
    await chart.updateSeries([
      { name: 'A', data: [2, 3, 4], group: 'g1' },
      { name: 'B', data: [4, 3, 2], group: 'g2' },
    ])
    expect(chart._updateStats.full).toBe(1)
    expect(chart.w.labelData.seriesGroups).toEqual([['A'], ['B']])
  })

  it('keeps the fast path for unnamed, ungrouped series', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }, { data: [3, 2, 1] }],
      xaxis: { categories: ['a', 'b', 'c'] },
    })
    await chart.updateSeries([{ data: [2, 3, 4] }, { data: [4, 3, 2] }])
    expect(chart._updateStats.full).toBe(0)
  })

  it('re-runs a data-reading legend formatter', async () => {
    const chart = twoLines({
      legend: {
        formatter: (name, opts) => {
          const d = opts.w.globals.series[opts.seriesIndex]
          return name + ': ' + d[d.length - 1]
        },
      },
    })
    expect(legendTexts()[0]).toBe('A: 3')
    await chart.updateSeries([
      { name: 'A', data: [10, 20, 30] },
      { name: 'B', data: [3, 2, 1] },
    ])
    expect(legendTexts()[0]).toBe('A: 30')
  })

  it('keeps the fast path when the formatted text does not change', async () => {
    const chart = twoLines({
      legend: { formatter: (name) => name + '!' },
    })
    await chart.updateSeries([
      { name: 'A', data: [2, 3, 4] },
      { name: 'B', data: [4, 3, 2] },
    ])
    expect(chart._updateStats.full).toBe(0)
    expect(legendTexts()).toEqual(['A!', 'B!'])
  })
})
