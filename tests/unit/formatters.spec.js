import Formatters from '../../src/modules/Formatters'
import { case1, case2, case3 } from './data/sample-formatters'
import { createChartWithOptions } from './utils/utils.js'

describe('Format Y-axis and tooltip Labels', () => {
  it('should return correct format for multiple tooltip.y and single yaxis', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [0, 1, 5, 10, 100],
        },
        {
          data: [10, 21, 35, 20, 40],
        },
      ],
      ...case1,
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnTtVal = gl.ttVal
    const fnYLabelFormatters = gl.yLabelFormatters

    const tooltipFormat = chart.getState().series.map((ser, i) => {
      return ser.map((s) => {
        return fnTtVal[i].formatter(s)
      })
    })

    const yFormat = chart.getState().series.map((ser) => {
      return ser.map((s) => {
        return fnYLabelFormatters[0](s)
      })
    })

    expect(tooltipFormat).toEqual([
      ['0 points', '1 points', '5 points', '10 points', '100 points'],
      ['10 points', '21 points', '35 points', '20 points', '40 points'],
    ])

    expect(yFormat).toEqual([
      ['0.00', '1.00', '5.00', '10.00', '100.00'],
      ['10.00', '21.00', '35.00', '20.00', '40.00'],
    ])
  })

  it('should return correct format for single yaxis and multiple tooltip.y', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [0, 1, 5, 10, 100],
        },
        {
          data: [10, 21, 35, 20, 40],
        },
      ],
      ...case2,
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnTtVal = gl.ttVal
    const fnYLabelFormatters = gl.yLabelFormatters

    const tooltipFormat = chart.getState().series.map((ser) => {
      return ser.map((s) => {
        return fnTtVal.formatter(s)
      })
    })

    const yFormat = chart.getState().series.map((ser) => {
      return ser.map((s) => {
        return fnYLabelFormatters[0](s)
      })
    })

    expect(tooltipFormat).toEqual([
      ['0 points', '1 points', '5 points', '10 points', '100 points'],
      ['10 points', '21 points', '35 points', '20 points', '40 points'],
    ])

    expect(yFormat).toEqual([
      ['0', '1', '5', '10', '100'],
      ['10', '21', '35', '20', '40'],
    ])
  })

  it('should return correct format for single yaxis without formatter and no tooltip.y', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [0, 1, 5, 10, 100],
        },
        {
          data: [10, 21, 35, 20, 40],
        },
      ],
      ...case3,
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnTtVal = gl.ttVal
    const fnYLabelFormatters = gl.yLabelFormatters

    const yFormat = chart.getState().series.map((ser) => {
      return ser.map((s) => {
        return fnYLabelFormatters[0](s)
      })
    })

    expect(fnTtVal).toBe(undefined)

    expect(yFormat).toEqual([
      ['0', '1', '5', '10', '100'],
      ['10', '21', '35', '20', '40'],
    ])
  })

  it('should handle null and undefined values gracefully', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [null, 0, 5, 10] }],
      yaxis: {
        labels: {
          formatter(val) {
            return val === null || val === undefined ? 'N/A' : val.toFixed(1)
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series.map((ser) => {
      return ser.map((s) => {
        return fnYLabelFormatters[0](s)
      })
    })

    expect(yFormat).toEqual([['N/A', '0.0', '5.0', '10.0']])
  })

  it('should handle negative numbers', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [-100, -10, -1, 0, 1, 10, 100] }],
      yaxis: {
        labels: {
          formatter(val) {
            return val.toFixed(2)
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series[0].map((s) => {
      return fnYLabelFormatters[0](s)
    })

    expect(yFormat).toEqual([
      '-100.00',
      '-10.00',
      '-1.00',
      '0.00',
      '1.00',
      '10.00',
      '100.00',
    ])
  })

  it('should handle very large numbers', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1000000, 5000000, 10000000] }],
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series[0].map((s) => {
      return fnYLabelFormatters[0](s)
    })

    expect(yFormat).toEqual(['1000000', '5000000', '10000000'])
  })

  it('should handle very small decimal numbers', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0.001, 0.0025, 0.005, 0.01] }],
      yaxis: {
        labels: {
          formatter(val) {
            return val.toFixed(4)
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series[0].map((s) => {
      return fnYLabelFormatters[0](s)
    })

    expect(yFormat).toEqual(['0.0010', '0.0025', '0.0050', '0.0100'])
  })

  it('should handle multiple yaxis with different formatters', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }, { data: [100, 200, 300] }],
      yaxis: [
        {
          labels: {
            formatter(val) {
              return val + ' units'
            },
          },
        },
        {
          labels: {
            formatter(val) {
              return '$' + val
            },
          },
        },
      ],
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters

    expect(fnYLabelFormatters[0](25)).toBe('25 units')
    expect(fnYLabelFormatters[1](150)).toBe('$150')
  })

  it('should handle custom legend formatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'Series A', data: [10, 20, 30] },
        { name: 'Series B', data: [15, 25, 35] },
      ],
      legend: {
        formatter(seriesName, opts) {
          return (
            seriesName +
            ' - Total: ' +
            opts.w.globals.series[opts.seriesIndex].reduce((a, b) => a + b, 0)
          )
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(typeof gl.legendFormatter).toBe('function')
  })

  it('should handle custom xaxis tooltip formatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      xaxis: {
        tooltip: {
          formatter(val) {
            return 'Index: ' + val
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(gl.xaxisTooltipFormatter(5)).toBe('Index: 5')
  })

  it('should handle custom tooltip.z.formatter for bubble charts', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bubble' },
      series: [
        {
          data: [
            [10, 20, 30],
            [15, 25, 35],
          ],
        },
      ],
      tooltip: {
        z: {
          formatter(val) {
            return val + ' size'
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(gl.ttZFormatter(100)).toBe('100 size')
  })

  it('should handle array values in defaultYFormatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeBar' },
      series: [
        {
          data: [
            [10, 20],
            [30, 40],
          ],
        },
      ],
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const result = fnYLabelFormatters[0]([10.5, 20.8])

    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBe(2)
  })

  it('should handle numeric x-axis with decimalsInFloat specified', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            [1.234, 10],
            [2.567, 20],
            [3.891, 30],
          ],
        },
      ],
      xaxis: {
        type: 'numeric',
        decimalsInFloat: 2,
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(gl.xLabelFormatter(1.23456)).toBe('1.23')
    expect(gl.xLabelFormatter(2.56789)).toBe('2.57')
  })

  it('should handle numeric x-axis with small range (< 100)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            [1.1, 10],
            [1.5, 20],
            [2.3, 30],
          ],
        },
      ],
      xaxis: {
        type: 'numeric',
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    // Should return 1 decimal for small ranges
    const result = gl.xLabelFormatter(1.567)
    expect(result).toBe('1.6')
  })

  it('should handle numeric x-axis with large range (>= 100)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            [0, 10],
            [100, 20],
            [200, 30],
          ],
        },
      ],
      xaxis: {
        type: 'numeric',
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    // Should return no decimal for large ranges
    const result = gl.xLabelFormatter(125.7)
    expect(result).toBe('126')
  })

  it('should handle horizontal bar with small y-range (< 4)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      series: [{ data: [1, 2, 3] }],
      plotOptions: {
        bar: { horizontal: true },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    // For horizontal bars with small range, should show 1 decimal
    const result = gl.xLabelFormatter(2.5)
    expect(typeof result).toBe('string')
  })

  it('should handle empty series array', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [] }],
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    expect(fnYLabelFormatters[0]).toBeDefined()
  })

  it('should handle zero values', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 0, 0, 0] }],
      yaxis: {
        labels: {
          formatter(val) {
            return val === 0 ? 'Zero' : val
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series[0].map((s) => {
      return fnYLabelFormatters[0](s)
    })

    expect(yFormat).toEqual(['Zero', 'Zero', 'Zero', 'Zero'])
  })

  it('should handle custom tooltip.x.formatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      tooltip: {
        x: {
          formatter(val) {
            return 'Point #' + val
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(gl.ttKeyFormatter(3)).toBe('Point #3')
  })

  it('should use tooltip.x.formatter as fallback for ttKeyFormatter when xaxis.labels.formatter is undefined', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
      tooltip: {
        x: {
          formatter(val) {
            return 'X: ' + val
          },
        },
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(gl.ttKeyFormatter(5)).toBe('X: 5')
  })

  it('should handle datetime x-axis without custom formatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        {
          data: [
            [1609459200000, 10],
            [1609545600000, 20],
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy',
        },
      },
    })
    const formatters = new Formatters(chart.w)
    formatters.setLabelFormatters()

    // xLabelFormat should use datetime formatting
    const result = formatters.xLabelFormat(
      (val) => val,
      1609459200000,
      1609459200000,
      {}
    )
    expect(typeof result).toBe('string')
  })

  it('should handle non-numeric values in defaultYFormatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
    })
    const formatters = new Formatters(chart.w)

    // Test with string value
    expect(formatters.defaultYFormatter('test', {}, 0)).toBe('test')

    // Test with object
    const obj = { value: 123 }
    expect(formatters.defaultYFormatter(obj, {}, 0)).toBe(obj)
  })

  it('should handle decimalsInFloat in yaxis', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10.12345, 20.6789, 30.11111] }],
      yaxis: {
        decimalsInFloat: 3,
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series[0].map((s) => {
      return fnYLabelFormatters[0](s)
    })

    expect(yFormat).toEqual(['10.123', '20.679', '30.111'])
  })

  it('should handle integer-like floats correctly', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10.0, 20.0, 30.5] }],
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters

    // Test that the formatters work consistently
    const result1 = fnYLabelFormatters[0](10.0)
    const result2 = fnYLabelFormatters[0](20.0)
    const result3 = fnYLabelFormatters[0](30.5)

    // All should be formatted as strings with consistent decimal places
    expect(typeof result1).toBe('string')
    expect(typeof result2).toBe('string')
    expect(typeof result3).toBe('string')

    // Values should be numeric when parsed back
    expect(parseFloat(result1)).toBe(10)
    expect(parseFloat(result2)).toBe(20)
    expect(parseFloat(result3)).toBe(30.5)
  })

  it('should handle array values in defaultGeneralFormatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
    })
    const formatters = new Formatters(chart.w)

    const result = formatters.defaultGeneralFormatter([1, 2, 3])
    expect(result).toEqual([1, 2, 3])
  })

  it('should handle non-array values in defaultGeneralFormatter', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
    })
    const formatters = new Formatters(chart.w)

    expect(formatters.defaultGeneralFormatter(42)).toBe(42)
    expect(formatters.defaultGeneralFormatter('test')).toBe('test')
    expect(formatters.defaultGeneralFormatter(null)).toBe(null)
  })

  it('should handle heatmap label formatters', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap' },
      series: [
        { name: 'Short', data: [10, 20] },
        { name: 'Medium Name', data: [15, 25] },
        { name: 'Very Long Series Name', data: [20, 30] },
      ],
    })
    const formatters = new Formatters(chart.w)
    formatters.setLabelFormatters()
    formatters.heatmapLabelFormatters()

    // The longest name should be set as niceMax/niceMin
    expect(chart.w.globals.yAxisScale[0].niceMax).toBe('Very Long Series Name')
    expect(chart.w.globals.yAxisScale[0].niceMin).toBe('Very Long Series Name')
  })

  it('should handle tooltip.y as array with different formatters per series', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { data: [10, 20, 30] },
        { data: [40, 50, 60] },
        { data: [70, 80, 90] },
      ],
      tooltip: {
        y: [
          { formatter: (val) => val + ' kg' },
          { formatter: (val) => val + ' lbs' },
          { formatter: (val) => val + ' oz' },
        ],
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    expect(Array.isArray(gl.ttVal)).toBe(true)
    expect(gl.ttVal[0].formatter(50)).toBe('50 kg')
    expect(gl.ttVal[1].formatter(100)).toBe('100 lbs')
    expect(gl.ttVal[2].formatter(25)).toBe('25 oz')
  })

  it('should handle mixed positive and negative values with decimals', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [-2.5, -1.3, 0, 1.7, 3.9] }],
      yaxis: {
        decimalsInFloat: 2,
      },
    })
    const formatters = new Formatters(chart.w)
    const gl = formatters.setLabelFormatters()

    const fnYLabelFormatters = gl.yLabelFormatters
    const yFormat = chart.getState().series[0].map((s) => {
      return fnYLabelFormatters[0](s)
    })

    expect(yFormat).toEqual(['-2.50', '-1.30', '0.00', '1.70', '3.90'])
  })
})
