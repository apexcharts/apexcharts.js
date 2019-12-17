import Range from '../../src/modules/Range.js'
import { createChartWithOptions } from './utils/utils.js'

describe('user defined Y-axis min/max', () => {
  it('should set the min and max of y-axis based on user input', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line'
      },
      series: [
        {
          data: [
            3.536028,
            3.470967000000001,
            4.4500410000000015,
            4.263021,
            4.471937999999999,
            4.791986999999999,
            3.6769680000000005
          ]
        }
      ],
      yaxis: {
        min: 3.175199,
        max: 4.755433
      }
    })

    const range = new Range(chart)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(3.175199)
    expect(yRange.maxY).toEqual(4.755433)
  })
})

describe('yaxis range to not contain negative values', () => {
  it('yaxis should not contain negative values if all values are positive', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line'
      },
      series: [
        {
          data: [408, 23, 22537, 261, 242, 795, 33, 88, 54, 272]
        }
      ]
    })

    const range = new Range(chart)
    const yRange = range.setYRange()

    expect(yRange.minY).toEqual(0)
    expect(yRange.maxY).toEqual(24000)
  })
})
