import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/stats'
import '../../src/features/streamgraph'
import '../../src/features/waterfall'
import '../../src/features/dumbbell'

// Histogram, streamgraph, waterfall and dumbbell keep a raw stash of the series and rebuild their rows from it. The stash has
// to agree with the legend in both directions:
//  - a series given `hidden: true` is emptied before the first parse, so the
//    stash has to take its rows from the collapse record, or showing it later
//    brings back nothing;
//  - a series hidden from the legend is hidden on either collapse list (a
//    series on a `showAlways` y axis goes on the ancillary one), and a
//    rebuild from the stash must not draw it again.

const size = (arr) => (arr || []).reduce((a, v) => a + (v == null ? 0 : 1), 0)
const sum = (arr) => (arr || []).reduce((a, v) => a + (v || 0), 0)

const obs = (n, base) =>
  Array.from({ length: n }, (_, i) => base + ((i * 37) % 50))

const xy = (base) =>
  ['a', 'b', 'c', 'd'].map((x, i) => ({ x, y: base + i * 3 }))

const DESIRED = [
  { x: 'Terraform', y: 15.7 },
  { x: 'Homebrew', y: 15.2 },
]
const ADMIRED = [
  { x: 'Terraform', y: 51.8 },
  { x: 'Homebrew', y: 56.4 },
]

const CASES = {
  histogram: () => [
    { name: 'A', data: obs(200, 0) },
    { name: 'B', data: obs(200, 20) },
  ],
  streamgraph: () => [
    { name: 'A', data: xy(10) },
    { name: 'B', data: xy(20) },
  ],
  waterfall: () => [
    { name: 'A', data: xy(10) },
    { name: 'B', data: xy(20) },
  ],
  dumbbell: () => [
    { name: 'A', data: DESIRED },
    { name: 'B', data: ADMIRED },
  ],
}

const drawn = (chart, i) => size(chart.w.seriesData.series[i])

describe('raw stash and hidden: true', () => {
  for (const type of ['histogram', 'streamgraph', 'waterfall']) {
    it(`${type}: showSeries brings back a series hidden at init`, async () => {
      const series = CASES[type]()
      series[1].hidden = true
      const chart = createChartWithOptions({
        chart: { type, width: 600, height: 300 },
        series,
      })
      expect(drawn(chart, 1)).toBe(0)
      await chart.showSeries('B')
      expect(drawn(chart, 1)).toBeGreaterThan(0)
    })
  }

  it('histogram: stays hidden across a re-render until shown', async () => {
    const series = CASES.histogram()
    series[1].hidden = true
    const chart = createChartWithOptions({
      chart: { type: 'histogram', width: 600, height: 300 },
      series,
    })
    await chart.updateOptions({ title: { text: 'x' } })
    expect(drawn(chart, 1)).toBe(0)
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
    await chart.showSeries('B')
    await chart.updateOptions({ title: { text: 'y' } })
    expect(drawn(chart, 1)).toBeGreaterThan(0)
  })

  it('histogram: new data for a legend-hidden series shows once shown', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'histogram', width: 600, height: 300 },
      series: CASES.histogram(),
    })
    await chart.hideSeries('B')
    await chart.updateSeries([
      { name: 'A', data: obs(100, 0) },
      { name: 'B', data: obs(300, 20) },
    ])
    expect(drawn(chart, 1)).toBe(0)
    expect(chart.w.globals.histogramRawSeries[1].data.length).toBe(300)
    await chart.showSeries('B')
    expect(drawn(chart, 1)).toBeGreaterThan(0)
  })

  it('dumbbell: showSeries restores the hidden endpoint', async () => {
    const series = CASES.dumbbell()
    series[1].hidden = true
    const chart = createChartWithOptions({
      chart: { type: 'dumbbell', width: 600, height: 300 },
      series,
    })
    expect(chart.w.dumbbellData.hidden).toEqual([1])
    await chart.showSeries('B')
    expect(chart.w.dumbbellData.hidden).toEqual([])
    expect(chart.w.globals.dumbbellRawSeries[1].data.length).toBe(2)
  })
})

describe('raw stash and a legend hide', () => {
  it('histogram: hides a series on a showAlways y axis', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'histogram', width: 600, height: 300 },
      yaxis: { show: true, showAlways: true },
      series: CASES.histogram(),
    })
    expect(sum(chart.w.seriesData.series[1])).toBeGreaterThan(0)
    await chart.hideSeries('B')
    expect(chart.w.globals.ancillaryCollapsedSeriesIndices).toEqual([1])
    expect(sum(chart.w.seriesData.series[1])).toBe(0)
  })
})
