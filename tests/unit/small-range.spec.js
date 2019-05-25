import { createChartWithOptions } from './utils/utils.js'

describe('Y-axis with ultra-small values', () => {
  it('should return small range of min/max when ultra small values are provided', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line'
      },
      series: [
        {
          data: [
            [1553258700000, 0.0037721],
            [1553259000000, 0.0037814],
            [1553261100000, 0.003799],
            [1553262900000, 0.0037601]
          ]
        }
      ],
      xaxis: {
        type: 'datetime'
      },
      yaxis: {
        decimalsInFloat: 7
      }
    })

    const minY = chart.w.globals.minY
    const maxY = chart.w.globals.maxY

    expect(minY.toFixed(6)).toEqual('0.003760')
    expect(maxY.toFixed(6)).toEqual('0.003799')
  })

  it('should not round values for smaller range (less than 5)', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line'
      },
      series: [
        {
          data: [[1553258700000, 1], [1553259000000, 2], [1553261100000, 4]]
        }
      ],
      xaxis: {
        type: 'datetime'
      }
    })

    const yAxisScale = chart.w.globals.yAxisScale[0].result

    expect(yAxisScale).toEqual([1, 1.75, 2.5, 3.25, 4])
  })
})
