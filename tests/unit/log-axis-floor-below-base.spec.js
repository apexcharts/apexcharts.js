import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Two log-axis floors users saw:
// - a zero in the data floored the axis at the log base (10), so values like
//   2 and 3 were drawn below the plot area;
// - a logarithmic radar scaled from the Number.MIN_VALUE sentinel and drew
//   about 327 rings, every point squashed onto the rim.

const lineYs = () =>
  [
    ...(document
      .querySelector('path.apexcharts-line')
      .getAttribute('d')
      .matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g) || []),
  ].map((m) => +m[2])

describe('log axis floor', () => {
  it('drops below the base to keep small values on the plot', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, animations: { enabled: false } },
      stroke: { curve: 'straight' },
      series: [{ data: [0, 2, 3, 5000] }],
      yaxis: { logarithmic: true },
    })
    expect(chart.w.globals.yAxisScale[0].niceMin).toBe(1)
    const h = chart.w.layout.gridHeight
    // 2 and 3 sit inside the plot, above the floor
    lineYs()
      .slice(1)
      .forEach((y) => {
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThan(h)
      })
  })

  it('reaches fractional values too', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: [0, 0.5, 2, 400] }],
      yaxis: { logarithmic: true },
    })
    expect(chart.w.globals.yAxisScale[0].niceMin).toBeCloseTo(0.1, 10)
  })

  it('keeps the base floor when every value is at or above it', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      series: [{ data: [0, 20, 300, 5000] }],
      yaxis: { logarithmic: true },
    })
    expect(chart.w.globals.yAxisScale[0].niceMin).toBe(10)
  })

  it('a log radar scales from its data, not the sentinel', () => {
    const chart = createChartWithOptions({
      chart: { type: 'radar', width: 500, height: 300 },
      series: [{ data: [1, 10, 100, 1000] }],
      labels: ['a', 'b', 'c', 'd'],
      yaxis: { logarithmic: true },
    })
    const scale = chart.w.globals.yAxisScale[0]
    expect(scale.niceMin).toBe(1)
    expect(scale.niceMax).toBe(1000)
    expect(scale.result.length).toBeLessThan(10)
    expect(
      document.querySelectorAll('.apexcharts-radar-series polygon').length,
    ).toBeLessThan(10)
  })
})
