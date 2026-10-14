import { describe, it, expect, afterEach, vi } from 'vitest'
import ApexCharts from '../../src/entries/standard.js'
import { createChartWithOptions } from './utils/utils.js'
import Graphics from '../../src/modules/Graphics.js'

// Two series-option defects:
// - on a dense rangeArea chart the upper (end) data labels were never
//   thinned and piled on top of each other, because the overlap test looked
//   up the last drawn label by point index while the series records two
//   label boxes per point (all start labels, then all end labels);
// - markers.size given as an array grew after every render (it was padded
//   in place), and a frozen array made render() throw.

let chart = null
afterEach(() => {
  vi.restoreAllMocks()
  chart?.destroy()
  chart = null
})

describe('rangeArea data label thinning', () => {
  it('thins the end labels exactly like the start labels', () => {
    // jsdom has no layout: give every label a fixed 40x12 box
    vi.spyOn(Graphics.prototype, 'getTextRects').mockImplementation(() => ({
      width: 40,
      height: 12,
    }))
    const n = 30
    chart = createChartWithOptions({
      chart: { type: 'rangeArea', width: 400, height: 300 },
      dataLabels: { enabled: true },
      series: [
        {
          name: 'r',
          data: Array.from({ length: n }, (_, i) => ({
            x: 'c' + i,
            y: [10, 50],
          })),
        },
      ],
    })
    const labels = Array.from(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-datalabel'),
    )
    const xs = (t) =>
      labels
        .filter((l) => l.textContent === t)
        .map((l) => Math.round(Number(l.getAttribute('x'))))
    const start = xs('10')
    const end = xs('50')
    expect(start.length).toBeGreaterThan(1)
    expect(start.length).toBeLessThan(n)
    expect(end).toEqual(start)
  })
})

describe('markers.size array', () => {
  const series = [
    { name: 'a', data: [1, 2, 3] },
    { name: 'b', data: [3, 2, 1] },
  ]

  it('is left as given across renders and updates', async () => {
    const size = [4, 0]
    chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      markers: { size },
      series,
    })
    expect(chart.w.globals.markers.size).toEqual([4, 0, 4])
    await chart.updateSeries([
      { name: 'a', data: [2, 3, 4] },
      { name: 'b', data: [4, 3, 2] },
    ])
    expect(size).toEqual([4, 0])
    expect(chart.w.config.markers.size).toEqual([4, 0])
  })

  it('accepts a frozen array', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    chart = new ApexCharts(document.querySelector('#chart'), {
      chart: {
        type: 'line',
        width: 400,
        height: 300,
        animations: { enabled: false },
      },
      markers: { size: Object.freeze([4, 0]) },
      series,
    })
    await expect(chart.render()).resolves.toBeDefined()
    expect(chart.w.globals.markers.size.slice(0, 2)).toEqual([4, 0])
  })
})
