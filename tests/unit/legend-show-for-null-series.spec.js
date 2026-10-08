import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// #4131: isSeriesNull filtered a series's data entries, not their y values,
// so an axis series whose points are {x, y: null} never counted as null.
describe('legend.showForNullSeries on axis charts (#4131)', () => {
  it('hides a series whose y values are all null', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', animations: { enabled: false } },
      legend: { showForNullSeries: false },
      series: [
        {
          name: 'a',
          data: [
            { x: 1, y: null },
            { x: 2, y: null },
          ],
        },
        {
          name: 'b',
          data: [
            { x: 1, y: 5 },
            { x: 2, y: 6 },
          ],
        },
      ],
    })
    const legendItems = [
      ...chart.w.globals.dom.baseEl.querySelectorAll('.apexcharts-legend-series'),
    ]
    expect(legendItems[0].classList.contains('apexcharts-hidden-null-series')).toBe(
      true,
    )
    expect(legendItems[1].classList.contains('apexcharts-hidden-null-series')).toBe(
      false,
    )
  })
})
