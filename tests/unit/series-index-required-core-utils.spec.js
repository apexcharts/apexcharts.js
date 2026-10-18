import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import CoreUtils from '../../src/modules/CoreUtils.js'

// getSeriesTotalByIndex / isSeriesNull defaulted `index = null` and read
// null as "a non-plot chart: scan w.config.series". Every caller passes an
// index, so the branch only ran by accident: a default parameter also fires
// for `undefined`, which a y axis that no series maps to hands over.

const twoSeries = [
  { name: 'a', data: [1, 2, 3] },
  { name: 'b', data: [4, 5, 6] },
]

describe('CoreUtils series lookups by index', () => {
  it('answer "no series" for an index that names none', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: twoSeries,
    })
    const cu = new CoreUtils(chart.w)
    expect(cu.isSeriesNull(undefined)).toBe(true)
    expect(cu.getSeriesTotalByIndex(undefined)).toBe(0)
    expect(cu.isSeriesNull(1)).toBe(false)
    expect(cu.getSeriesTotalByIndex(1)).toBe(15)
  })

  it('pie slices still read per index', () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 400, height: 300 },
      series: [3, 4, 5],
      labels: ['x', 'y', 'z'],
    })
    const cu = new CoreUtils(chart.w)
    expect(cu.getSeriesTotalByIndex(2)).toBe(5)
    expect(cu.isSeriesNull(0)).toBe(false)
    expect(cu.isSeriesNull(3)).toBe(true)
  })

  // Pins the visibility the old scan produced: an axis with no series is
  // kept while the chart has series, and hidden when it has none.
  /** @param {any[]} series */
  const visibleYAxes = (series) => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      yaxis: [
        { showForNullSeries: false },
        { showForNullSeries: false, opposite: true },
        { showForNullSeries: false, opposite: true },
      ],
      series,
    })
    return [0, 1, 2].map(
      (i) =>
        !!chart.w.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel="${i}"] .apexcharts-yaxis-label`,
        ),
    )
  }

  it('an extra y axis with no series keeps its visibility', () => {
    expect(visibleYAxes(twoSeries)).toEqual([true, true, true])
    expect(visibleYAxes([])).toEqual([false, false, false])
  })
})
