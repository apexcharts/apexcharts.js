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
    const formatters = new Formatters(chart)
    let gl = formatters.setLabelFormatters()

    const fnTtVal = gl.ttVal
    const fnYLabelFormatters = gl.yLabelFormatters

    const tooltipFormat = chart.w.globals.series.map((ser, i) => {
      return ser.map((s) => {
        return fnTtVal[i].formatter(s)
      })
    })

    const yFormat = chart.w.globals.series.map((ser) => {
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
    const formatters = new Formatters(chart)
    let gl = formatters.setLabelFormatters()

    const fnTtVal = gl.ttVal
    const fnYLabelFormatters = gl.yLabelFormatters

    const tooltipFormat = chart.w.globals.series.map((ser) => {
      return ser.map((s) => {
        return fnTtVal.formatter(s)
      })
    })

    const yFormat = chart.w.globals.series.map((ser) => {
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
    const formatters = new Formatters(chart)
    let gl = formatters.setLabelFormatters()

    const fnTtVal = gl.ttVal
    const fnYLabelFormatters = gl.yLabelFormatters

    const yFormat = chart.w.globals.series.map((ser) => {
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
})
