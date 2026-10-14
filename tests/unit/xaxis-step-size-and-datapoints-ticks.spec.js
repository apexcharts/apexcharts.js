import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Two numeric x-axis tick settings users saw ignored:
// - xaxis.stepSize printed labels 0..50 on 0..100 data, spread across the
//   full width, so "50" sat where x=100 was drawn;
// - xaxis.tickAmount: 'dataPoints' was ignored for a single series.

const labels = () =>
  [...document.querySelectorAll('.apexcharts-xaxis-label')].map((t) => ({
    text: t.textContent,
    x: +t.getAttribute('x'),
  }))

describe('xaxis.stepSize on a numeric axis', () => {
  it('ticks every step up to the end of the data, at the data positions', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 800, height: 300 },
      series: [{ data: Array.from({ length: 101 }, (_, i) => [i, i % 7]) }],
      xaxis: { type: 'numeric', stepSize: 10 },
    })
    const gl = chart.w.globals
    expect(gl.xAxisScale.result).toEqual([
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
    ])
    expect(gl.maxX).toBe(100)

    const l = labels()
    expect(l.map((d) => d.text)).toEqual(gl.xAxisScale.result.map(String))
    const at = (t) => l.find((d) => d.text === t).x
    expect(at('50') - at('0')).toBeCloseTo((at('100') - at('0')) / 2, 1)
  })

  it('ends the axis on the step past the last value', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 800, height: 300 },
      series: [{ data: [[0, 1], [37, 2], [95, 3]] }],
      xaxis: { type: 'numeric', stepSize: 20 },
    })
    expect(chart.w.globals.xAxisScale.result).toEqual([0, 20, 40, 60, 80, 100])
    expect(chart.w.globals.maxX).toBe(100)
  })

  it('adds a tick when the rounded step falls short of the data', () => {
    for (const [data, stepSize] of [
      [[[0, 1], [6, 2], [12.34, 3]], 1.234],
      [[[0, 1], [0.5, 2], [1, 3]], 1 / 3],
    ]) {
      const chart = createChartWithOptions({
        chart: { type: 'line', width: 800, height: 300 },
        series: [{ data }],
        xaxis: { type: 'numeric', stepSize },
      })
      const gl = chart.w.globals
      expect(gl.maxX).toBeGreaterThanOrEqual(data[2][0])
      expect(gl.xAxisScale.niceMax).toBe(gl.maxX)
      chart.destroy()
    }
  })

  it('a streaming xaxis.range keeps its window, newest point at the edge', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 800, height: 300 },
      series: [{ data: Array.from({ length: 101 }, (_, i) => [i, i % 7]) }],
      xaxis: { type: 'numeric', stepSize: 10, range: 35 },
    })
    expect(chart.w.globals.minX).toBe(65)
    expect(chart.w.globals.maxX).toBe(100)
  })

  it('a step too fine to draw keeps the default tick count', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 800, height: 300 },
      series: [{ data: [[0, 1], [50000, 2], [100000, 3]] }],
      xaxis: { type: 'numeric', stepSize: 1 },
    })
    const gl = chart.w.globals
    expect(gl.xAxisScale.result.length).toBeLessThan(20)
    expect(gl.xAxisScale.niceMax).toBe(gl.maxX)
  })
})

describe("xaxis.tickAmount: 'dataPoints'", () => {
  it('gives a single series one tick per point', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 800, height: 300 },
      series: [{ data: Array.from({ length: 12 }, (_, i) => [i * 10, i]) }],
      xaxis: { type: 'numeric', tickAmount: 'dataPoints' },
    })
    expect(chart.w.globals.xTickAmount).toBe(11)
    expect(labels().length).toBe(12)
  })
})
