import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Two range defects users saw:
// - stacked charts with very small values (around 1e-5) were drawn in the
//   bottom ~12% of the plot, because every positive value added 0.0001 to
//   the stacked maximum;
// - chart.getHighestValueInSeries(n) / getLowestValueInSeries(n) threw a
//   TypeError for an index with no series.

describe('stacked maximum', () => {
  it('fits tiny stacked values to the plot', () => {
    const chart = createChartWithOptions({
      chart: { type: 'area', width: 500, height: 300, stacked: true },
      series: [{ data: [1e-5, 2e-5, 1e-5] }, { data: [1e-5, 1e-5, 1e-5] }],
    })
    const { niceMax } = chart.w.globals.yAxisScale[0]
    expect(niceMax).toBeGreaterThanOrEqual(3e-5)
    expect(niceMax).toBeLessThan(5e-5)
  })

  it('a total landing on a nice tick still gets headroom above it', () => {
    const scale = (type, series, horizontal = false) =>
      createChartWithOptions({
        chart: { type, width: 500, height: 300, stacked: true },
        plotOptions: { bar: { horizontal } },
        series,
      }).w.globals.yAxisScale[0]
    const a = [{ data: [50, 30, 10] }, { data: [50, 20, 15] }]
    expect(scale('bar', a).niceMax).toBe(120)
    expect(scale('bar', a, true).niceMax).toBe(120)
    const b = [
      { data: [20, 30, 10] },
      { data: [20, 30, 15] },
      { data: [20, 0, 5] },
    ]
    expect(scale('bar', b).niceMax).toBe(80)
    const c = [{ data: [100, 40] }, { data: [100, 60] }]
    expect(scale('area', c).niceMax).toBe(250)
    const neg = scale('bar', [{ data: [-50, 30] }, { data: [-50, 20] }])
    expect([neg.niceMin, neg.niceMax]).toEqual([-100, 100])
  })

  it('an all-zero stack still gets an axis', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 500, height: 300, stacked: true },
      series: [{ data: [0, 0] }, { data: [0, 0] }],
    })
    const { niceMin, niceMax } = chart.w.globals.yAxisScale[0]
    expect(Number.isFinite(niceMax)).toBe(true)
    expect(niceMax).toBeGreaterThan(niceMin)
  })
})

describe('getHighestValueInSeries / getLowestValueInSeries', () => {
  it('return the extremes of a series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: [4, 1, 9] }, { data: [-2, 5, 3] }],
    })
    expect(chart.getHighestValueInSeries(0)).toBe(9)
    expect(chart.getLowestValueInSeries(0)).toBe(1)
    expect(chart.getHighestValueInSeries(1)).toBe(5)
    expect(chart.getLowestValueInSeries(1)).toBe(-2)
  })

  it('return undefined for an index with no series instead of throwing', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: [1, 2, 3] }],
    })
    expect(chart.getHighestValueInSeries(4)).toBeUndefined()
    expect(chart.getLowestValueInSeries(4)).toBeUndefined()
    expect(chart.getHighestValueInSeries(-1)).toBeUndefined()
  })
})
