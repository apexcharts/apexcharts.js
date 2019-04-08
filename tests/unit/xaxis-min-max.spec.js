import Range from '../../src/modules/Range.js'
import series2dArrayNumeric from './data/series2dArrayNumeric.js'
import { createChartWithOptions } from './utils/utils.js'

describe('X-axis data', () => {
  it('should set the min and max of x-axis based on user input', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line'
      },
      series: series2dArrayNumeric,
      xaxis: {
        min: 0,
        max: 40
      }
    })

    const range = new Range(chart)
    const xRange = range.setXRange()

    expect(xRange.minX).toEqual(0)
    expect(xRange.maxX).toEqual(40)
  })
})
