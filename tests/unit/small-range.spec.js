import Range from '../../src/modules/Range.js'
import { createChartWithOptions } from './utils/utils.js'

describe('Y-axis with ultra-small values', () => {
  it('should return small range of min/max when ultra small values are provided', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            [1553258700000, 0.0037721],
            [1553259000000, 0.0037814],
            [1553261100000, 0.003799],
            [1553262900000, 0.0037601],
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
      yaxis: {
        decimalsInFloat: 7,
      },
    })

    const minY = chart.w.globals.minY
    const maxY = chart.w.globals.maxY

    expect(minY.toFixed(6)).toEqual('0.003760')
    expect(maxY.toFixed(6)).toEqual('0.003800')
  })

  it('should not apply nice scale for small values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            [1553258700000, 1],
            [1553259000000, 2],
            [1553261100000, 4],
          ],
        },
      ],
      xaxis: {
        type: 'datetime',
      },
    })

    const minY = chart.w.globals.minY
    const maxY = chart.w.globals.maxY

    expect(minY).toEqual(1)
    expect(maxY).toEqual(4)
  })
})

// Removal of duplicate labels can only be done within
// the formatter itself. See the new:
// samples/source/mixed/duplicate-labels.xml
//
// It appears that this unit test, when run against the current main branch code,
// succeeds only because the range of the Y axis is <= 2, which sends it through
// a path in niceScale() that happens to return just the two expected values.
// 
//describe('yaxis scale to not contain duplicated values when formatter is provided', () => {
//  it('yaxis scale should not contain duplicated values for small integer range', () => {
//    const chart = createChartWithOptions({
//      chart: {
//        type: 'line',
//      },
//      series: [
//        {
//          data: [1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 2],
//        },
//      ],
//      xaxis: {
//        categories: [
//          'Jan',
//          'Feb',
//          'Mar',
//          'Apr',
//          'May',
//          'Jun',
//          'Jul',
//          'Aug',
//          'Sep',
//          'Oct',
//          'Nov',
//          'Dec',
//        ],
//      },
//      yaxis: {
//        labels: {
//          formatter: (val) => {
//            return val.toFixed(0)
//          },
//        },
//      },
//    })
//
//    const range = new Range(chart)
//    const yRange = range.setYRange()
//
//    expect(yRange.yAxisScale[0].result).toEqual([1, 2])
//  })
//})

describe('yaxis scale to ignore duplication if fractions are present in series', () => {
  it('yaxis scale should ignore duplication of labels when non integers are provided', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
      },
      series: [
        {
          data: [
            1.2321908386878013, 1.956555241215017, 1.8841188009622953,
            1.8116823607095738, 1.7392459204568522, 1.6668094802041307,
            1.594373039951409, 1.5219365996986876, 1.449500159445966,
            1.3770637191932444, 1.3046272789405229, 1.2321908386878013,
          ],
        },
      ],
      xaxis: {
        categories: [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ],
      },
      yaxis: {
        labels: {
          formatter: (val) => {
            return val.toFixed(2)
          },
        },
      },
    })

    const range = new Range(chart)
    const yRange = range.setYRange()

    expect(yRange.yAxisScale[0].result).toEqual([1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2])
  })
})
