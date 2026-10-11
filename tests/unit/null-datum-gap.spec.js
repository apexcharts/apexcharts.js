import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A null entry in a series' data array (how many APIs and spreadsheet exports
// deliver a missing row) is a gap, the same as `{x, y: null}`. It used to be
// dereferenced and throw out of parseData, leaving the container empty.

const base = { width: 600, height: 300, animations: { enabled: false } }
const xy = [{ x: 'Jan', y: 1 }, null, { x: 'Mar', y: 3 }]

describe('a null datum inside a series', () => {
  it('{x, y} line: draws a gap with a blank category', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', ...base },
      series: [{ name: 'A', data: xy }],
    })
    expect(chart.w.seriesData.series[0]).toEqual([1, null, 3])
    expect(chart.w.labelData.categoryLabels).toEqual(['Jan', '', 'Mar'])
    expect(chart.el.innerHTML).not.toContain('NaN')
  })

  it('{x, y} bar: keeps the slot, so later bars stay in place', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', ...base },
      series: [{ name: 'A', data: xy }],
    })
    expect(chart.w.seriesData.series[0]).toEqual([1, null, 3])
    expect(chart.w.seriesData.seriesX[0]).toEqual(['Jan', '', 'Mar'])
    const bars = [...chart.el.querySelectorAll('.apexcharts-bar-area')]
    expect(bars.length).toBe(3)
    expect(bars.map((b) => b.getAttribute('d')).join()).not.toContain('NaN')
  })

  it('{x, y} numeric x: the gap stays out of the x range', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', ...base },
      series: [{ data: [{ x: 1, y: 1 }, null, { x: 3, y: 3 }] }],
    })
    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(3)
  })

  it('[x, y] series: draws a gap and keeps later points in place', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', ...base },
      series: [{ name: 'A', data: [[1, 10], null, [3, 30]] }],
    })
    expect(chart.w.seriesData.series[0]).toEqual([10, null, 30])
    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(3)
  })

  it('[x, y] datetime series: the gap does not pull the x range to 0', () => {
    const T0 = Date.UTC(2026, 0, 1)
    const chart = createChartWithOptions({
      chart: { type: 'area', ...base },
      xaxis: { type: 'datetime' },
      series: [{ data: [[T0, 10], null, [T0 + 2 * 864e5, 30]] }],
    })
    expect(chart.w.seriesData.series[0]).toEqual([10, null, 30])
    expect(chart.w.globals.minX).toBe(T0)
  })
})
