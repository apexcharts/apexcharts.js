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

    expect(minY.toFixed(6)).toEqual('0.003753')
    expect(maxY.toFixed(6)).toEqual('0.003843')
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

    expect(yAxisScale).toEqual([
      0.7000000000000001,
      1.4000000000000001,
      2.1,
      2.8000000000000003,
      3.5000000000000004,
      4.2
    ])
  })
})
