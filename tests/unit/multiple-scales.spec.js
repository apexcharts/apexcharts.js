import { createChartWithOptions } from './utils/utils.js'

import { logData } from './data/log-data.js'

describe('Multiple Y-axis Scales', () => {
  it('should return correct scales for log and linear yaxis scales when no logarithmic base specified', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Logarithmic',
          data: logData,
        },
        {
          name: 'Linear',
          data: logData,
        },
      ],
      yaxis: [
        {
          min: 1000000,
          max: 500000000,
          tickAmount: 4,
          logarithmic: true,
          seriesName: 'Logarithmic',
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
          tickAmount: 4,
          seriesName: 'Linear',
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisScale = chart.w.globals.yAxisScale

    expect(minYArr).toEqual([1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000])

    expect(yAxisScale).toEqual([
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [
          999999.9999999979, 7937005.259840991, 62996052.4947437,
          499999999.99999994,
        ],
      },
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [1000000, 125750000, 250500000, 375250000, 500000000],
      },
    ])
  })

  it('should return correct scales for log and linear yaxis scales when logarithmic base is 20', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Logarithmic',
          data: logData,
        },
        {
          name: 'Linear',
          data: logData,
        },
      ],
      yaxis: [
        {
          min: 1000000,
          max: 500000000,
          tickAmount: 4,
          logarithmic: true,
          logBase: 20,
          seriesName: 'Logarithmic',
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
          tickAmount: 4,
          seriesName: 'Linear',
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisScale = chart.w.globals.yAxisScale

    expect(minYArr).toEqual([1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000])

    expect(yAxisScale).toEqual([
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [999999.9999999998, 22360679.77499791, 500000000.0000007],
      },
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [1000000, 125750000, 250500000, 375250000, 500000000],
      },
    ])
  })

  it('should associate multiple series to multiple yaxes according to seriesName array spec', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          seriesName: ['Series C', 'Series D'],
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisMap = chart.w.globals.seriesYAxisMap
    const yAxisRevMap = chart.w.globals.seriesYAxisReverseMap

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(yAxisMap).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(yAxisRevMap).toEqual([0, 0, 1, 1])
  })

  it('should associate series to yaxes according to seriesName then assign remainder to last free axis', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisMap = chart.w.globals.seriesYAxisMap
    const yAxisRevMap = chart.w.globals.seriesYAxisReverseMap

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(yAxisMap).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(yAxisRevMap).toEqual([0, 0, 1, 1])
  })

  it('should associate series to yaxes according to seriesName then assign remainder to last axis', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          seriesName: 'Series C',
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisMap = chart.w.globals.seriesYAxisMap
    const yAxisRevMap = chart.w.globals.seriesYAxisReverseMap

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(yAxisMap).toEqual([
      [0, 1],
      [2, 3],
    ])
    expect(yAxisRevMap).toEqual([0, 0, 1, 1])
  })

  it('should associate series to yaxes according to seriesName then assign remainder one-for-one', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisMap = chart.w.globals.seriesYAxisMap
    const yAxisRevMap = chart.w.globals.seriesYAxisReverseMap

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(yAxisMap).toEqual([[0, 1], [2], [3]])
    expect(yAxisRevMap).toEqual([0, 0, 1, 2])
  })

  it('should associate series to yaxes according to seriesName before assigning remainder one-for-one', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          name: 'Series A',
          data: logData,
        },
        {
          name: 'Series B',
          data: logData,
        },
        {
          name: 'Series C',
          data: logData,
        },
        {
          name: 'Series D',
          data: logData,
        },
      ],
      yaxis: [
        {
          min: 1000000,
          max: 500000000,
          tickAmount: 5,
        },
        {
          seriesName: ['Series A', 'Series B'],
          min: 1000000,
          max: 500000000,
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
        },
      ],
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisMap = chart.w.globals.seriesYAxisMap
    const yAxisRevMap = chart.w.globals.seriesYAxisReverseMap

    expect(minYArr).toEqual([1000000, 1000000, 1000000, 1000000])

    expect(maxYArr).toEqual([500000000, 500000000, 500000000, 500000000])

    expect(yAxisMap).toEqual([[2], [0, 1], [3]])
    expect(yAxisRevMap).toEqual([1, 1, 0, 2])
  })
})
