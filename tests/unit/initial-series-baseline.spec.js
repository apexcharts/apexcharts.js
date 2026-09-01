import { createChartWithOptions } from './utils/utils.js'

// globals.initialSeries is the baseline resetSeries() and the toolbar
// reset-home button restore from, but Data.parseData() re-captured it from the
// live series on every parse. A legend collapse empties series[i].data and
// re-renders, so the baseline was overwritten with the emptied series and the
// reset had nothing left to restore. appendData(newData, false) lost the same
// way, through the re-render it triggers. (#5283)

const SERIES = [
  { name: 'A', data: [1, 2, 3] },
  { name: 'B', data: [4, 5, 6] },
]

const OBSERVATIONS = [1, 2, 2, 3, 3, 3, 4]

function histogramWith(data) {
  return createChartWithOptions({
    chart: { type: 'histogram', width: 600, height: 400 },
    series: [{ name: 'Sample', data: [...data] }],
  })
}

function reducerChartWith(points) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 400,
      dataReducer: { enabled: true, threshold: 50, targetPoints: 25 },
    },
    series: [{ name: 'S', data: points }],
  })
}

function ramp(count, from = 0) {
  return Array.from({ length: count }, (_, i) => ({
    x: from + i,
    y: (from + i) % 17,
  }))
}

function chartWith(series) {
  return createChartWithOptions({
    chart: { type: 'line' },
    series: series.map((s) => ({ name: s.name, data: [...s.data] })),
    xaxis: { categories: ['x', 'y', 'z'] },
  })
}

describe('initialSeries across a re-render', () => {
  it('keeps the hidden series data after hideSeries', () => {
    const chart = chartWith(SERIES)

    chart.hideSeries('B')

    expect(chart.w.globals.initialSeries[1].data).toEqual([4, 5, 6])
  })

  it('brings a hidden series back on resetSeries', async () => {
    const chart = chartWith(SERIES)
    chart.hideSeries('B')

    await chart.resetSeries()

    expect(chart.w.config.series[1].data).toEqual([4, 5, 6])
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
  })

  it('honours appendData(newData, false)', async () => {
    const chart = chartWith([SERIES[0]])

    await chart.appendData([{ data: [99] }], false)

    expect(chart.w.globals.initialSeries[0].data).toEqual([1, 2, 3])
    expect(chart.w.config.series[0].data).toEqual([1, 2, 3, 99])
  })

  it('honours appendData(newData, false) on a raw-stash chart type', async () => {
    const chart = histogramWith(OBSERVATIONS)

    await chart.appendData([{ data: [9, 9, 9] }], false)

    // The stash the snapshot points at, not the binned view.
    expect(chart.w.globals.initialSeries[0].data).toEqual(OBSERVATIONS)
  })

  it('still moves the baseline on appendData(newData, true) on a raw-stash chart type', async () => {
    const chart = histogramWith(OBSERVATIONS)

    await chart.appendData([{ data: [9, 9, 9] }])

    // Control: the appended observations, still not the binned view.
    expect(chart.w.globals.initialSeries[0].data).toEqual([
      ...OBSERVATIONS,
      9,
      9,
      9,
    ])
  })

  it('baselines the observations when updateSeries redefines a raw-stash chart', async () => {
    const chart = histogramWith(OBSERVATIONS)

    await chart.updateSeries([{ name: 'Sample', data: [5, 5, 6, 7, 7, 7, 8] }])

    expect(chart.w.globals.initialSeries[0].data).toEqual([5, 5, 6, 7, 7, 7, 8])
  })

  it('baselines the full input on appendData(newData, true) with dataReducer', async () => {
    const chart = reducerChartWith(ramp(400))

    await chart.appendData([{ data: ramp(1, 400) }])

    expect(chart.w.globals.initialSeries[0].data).toHaveLength(401)
  })

  it('keeps appended points across a re-render with dataReducer', async () => {
    const chart = reducerChartWith(ramp(400))

    await chart.appendData([{ data: ramp(1, 400) }])
    await chart.update()

    expect(chart.w.globals.dataReducerRawSeries[0].data).toHaveLength(401)
  })

  it('still moves the baseline on appendData(newData, true)', async () => {
    const chart = chartWith([SERIES[0]])

    await chart.appendData([{ data: [99] }])

    // Control: a call that redefines the series is allowed to move it.
    expect(chart.w.globals.initialSeries[0].data).toEqual([1, 2, 3, 99])
  })

  it('still moves the baseline when updateSeries redefines the series', async () => {
    const chart = chartWith(SERIES)
    chart.hideSeries('B')

    await chart.updateSeries([
      { name: 'A', data: [7, 8, 9] },
      { name: 'B', data: [10, 11, 12] },
    ])

    // Control, as above: the collapse must not survive as an empty baseline.
    expect(chart.w.globals.initialSeries[1].data).toEqual([10, 11, 12])
  })

  it('keeps the baseline across an unrelated updateOptions', async () => {
    const chart = chartWith(SERIES)
    chart.hideSeries('B')

    await chart.updateOptions({ title: { text: 'changed' } })

    expect(chart.w.globals.initialSeries[1].data).toEqual([4, 5, 6])
  })
})
