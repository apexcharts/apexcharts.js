import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Multi-line (array) x labels size the x-axis band with a tighter line height.
// A line chart converts its category axis to numeric, and the detection used
// to probe that axis's formatter before the x range existed, so it never saw
// an array there.

const cats = [
  ['Jan', '2024'],
  ['Feb', '2024'],
  ['Mar', '2024'],
]

describe('multi-line x label detection', () => {
  it.each(['line', 'area', 'bar'])('%s with array categories', (type) => {
    const chart = createChartWithOptions({
      chart: { type, width: 500, height: 300 },
      series: [{ data: [1, 2, 3] }],
      xaxis: { categories: cats },
    })
    expect(chart.w.axisFlags.isMultiLineX).toBe(true)
  })

  it('line with array x in {x, y} data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: cats.map((x, i) => ({ x, y: i })) }],
    })
    expect(chart.w.axisFlags.isMultiLineX).toBe(true)
  })

  it('stays off for single-line categories', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: [1, 2, 3] }],
      xaxis: { categories: ['Jan', 'Feb', 'Mar'] },
    })
    expect(chart.w.axisFlags.isMultiLineX).toBe(false)
  })

  it('stays off for a numeric scatter of [x, y] pairs', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter', width: 500, height: 300 },
      series: [{ data: [[1.0, 52], [1.2, 49], [2.0, 38]] }],
      xaxis: { tickAmount: 10 },
    })
    expect(chart.w.axisFlags.isMultiLineX).toBe(false)
  })
})
