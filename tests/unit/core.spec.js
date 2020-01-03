import Data from '../../src/modules/Data.js'
import seriesxy from './data/seriesxy.js'
import { createChart } from './utils/utils.js'

describe('Parse Data', () => {
  it('should parse data for cartesian charts', () => {
    const chart = createChart('line', seriesxy)
    chart.w.globals.series = []
    chart.w.globals.seriesX = []
    chart.w.globals.labels = []

    const data = new Data(chart)
    const w = data.parseDataAxisCharts(seriesxy, seriesxy, chart)

    expect(w.globals.series).toEqual([[300, 230, 210]])
    expect(w.globals.seriesX).toEqual([
      [1262304000000, 1262390400000, 1262476800000]
    ])
    expect(w.globals.labels).toEqual([
      [1262304000000, 1262390400000, 1262476800000]
    ])
  })

  it('should parse data for non-cartesian charts', () => {
    const series = [30, 23, 12, 43]
    const chart = createChart('donut', series)

    chart.w.globals.series = []
    chart.w.globals.seriesNames = []

    const data = new Data(chart)
    const w = data.parseDataNonAxisCharts(series)

    expect(w.globals.series).toEqual([30, 23, 12, 43])
    expect(w.globals.seriesNames).toEqual([
      'series-1',
      'series-2',
      'series-3',
      'series-4'
    ])
  })
})
