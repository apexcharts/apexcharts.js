import { createChartWithOptions } from './utils/utils.js'

import { logData } from './data/log-data.js'

describe('Multiple Y-axis Scales', () => {
  it('should return correct scales for log and linear yaxis scales', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line'
      },
      series: [
        {
          name: 'Logarithmic',
          data: logData
        },
        {
          name: 'Linear',
          data: logData
        }
      ],
      yaxis: [
        {
          max: 500000000,
          tickAmount: 4,
          logarithmic: true,
          seriesName: 'Logarithmic'
        },
        {
          min: 1000000,
          max: 500000000,
          opposite: true,
          tickAmount: 4,
          seriesName: 'Linear'
        }
      ]
    })

    const minYArr = chart.w.globals.minYArr
    const maxYArr = chart.w.globals.maxYArr
    const yAxisScale = chart.w.globals.yAxisScale

    expect(minYArr).toEqual([1, 1000000])

    expect(maxYArr).toEqual([1000000000, 500000000])

    expect(yAxisScale).toEqual([
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [1000000, 5000000, 20000000, 100000000, 500000000]
      },
      {
        niceMax: 500000000,
        niceMin: 1000000,
        result: [1000000, 125750000, 250500000, 375250000, 500000000]
      }
    ])
  })
})
