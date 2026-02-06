import Range from '../../src/modules/Range.js'
import { createChartWithOptions } from './utils/utils.js'

describe('Bar chart', () => {
  it('columns should not overlap because of wrong minXDiff value', () => {
    const chart = createChartWithOptions({
      series: [
        {
          data: [
            [1, 1],
            [4, 4],
            [3, 3],
          ],
        },
      ],
      chart: {
        type: 'bar',
      },
    })

    const range = new Range(chart)
    range.setXRange()

    expect(range.w.globals.minXDiff).toEqual(1)
  })
})
