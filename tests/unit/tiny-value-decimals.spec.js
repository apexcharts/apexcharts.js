import Utils from '../../src/utils/Utils.js'
import { createChartWithOptions } from './utils/utils.js'

// Values below 1e-6 print in exponent notation, and the decimal scan used to
// round them to 0 through noExponents. All-tiny data was then classed as
// integer, and every default y-axis label read '0.0'.

describe('decimalPlaces counts fraction digits in any notation', () => {
  it.each([
    [0, 0],
    [42, 0],
    [3.14, 2],
    [-0.125, 3],
    [1e-7, 7],
    [1.5e-7, 8],
    [-2.25e-9, 11],
    [1e21, 0],
    [1.5e300, 0],
  ])('%s has %s', (v, n) => {
    expect(Utils.decimalPlaces(v)).toBe(n)
  })
})

describe('a series of values below 1e-6', () => {
  const series = [{ name: 'tiny', data: [1e-7, 2e-7, 3e-7, 4e-7] }]

  it.each([
    ['line', {}],
    ['bar', {}],
    // a rangeArea-free mixed path goes through the per-point Range scan
    ['line', { xaxis: { type: 'numeric' } }],
  ])('%s keeps its decimals and labels the y-axis apart', (type, extra) => {
    const chart = createChartWithOptions({
      chart: { type, height: 300, width: 500, animations: { enabled: false } },
      series:
        extra.xaxis?.type === 'numeric'
          ? [{ name: 'tiny', data: series[0].data.map((y, x) => ({ x, y })) }]
          : series,
      ...extra,
    })
    expect(chart.w.globals.yValueDecimal).toBeGreaterThanOrEqual(7)
    // labels thinned out for space are drawn empty
    const labels = Array.from(
      chart.el.querySelectorAll('.apexcharts-yaxis-label tspan'),
    )
      .map((t) => t.textContent)
      .filter(Boolean)
    expect(labels.length).toBeGreaterThan(2)
    expect(new Set(labels).size).toBe(labels.length)
  })
})
