import { createChartWithOptions } from './utils/utils.js'

// globals.initialConfig is meant to be the untouched config the chart started
// with — resetSeries, the toolbar reset-home button and custom tooltips all
// read it. But Utils.extend() copies arrays by reference (isObject() excludes
// arrays), so initialConfig.series WAS w.config.series, and collapsing a
// series replaces series[i].data with [] in place. The "initial" config lost
// the data along with the live one. (#5118)

const SERIES = [
  { name: 'A', data: [1, 2, 3] },
  { name: 'B', data: [4, 5, 6] },
]

function chartWith(series) {
  return createChartWithOptions({
    chart: { type: 'line' },
    series: series.map((s) => ({ name: s.name, data: [...s.data] })),
    xaxis: { categories: ['x', 'y', 'z'] },
  })
}

describe('initialConfig with a hidden series', () => {
  it('keeps the hidden series data after hideSeries', () => {
    const chart = chartWith(SERIES)

    chart.hideSeries('B')

    expect(chart.w.globals.initialConfig.series[1].data).toEqual([4, 5, 6])
  })

  it('restores a hidden series on resetSeries', () => {
    const chart = chartWith(SERIES)

    chart.hideSeries('B')
    chart.resetSeries(false)

    expect(chart.w.config.series[1].data).toEqual([4, 5, 6])
  })

  it('preserves the baseline when appendData opts out of overwriting it', async () => {
    const chart = chartWith(SERIES)

    await chart.appendData([{ data: [7] }, { data: [8] }], false)

    expect(chart.w.globals.initialSeries[0].data).toEqual([1, 2, 3])
    expect(chart.w.globals.initialSeries[1].data).toEqual([4, 5, 6])
  })

  it('keeps the hidden series data across updateOptions', async () => {
    const chart = chartWith(SERIES)
    chart.hideSeries('B')

    await chart.updateOptions({ title: { text: 'changed' } })

    expect(chart.w.globals.initialConfig.series[1].data).toEqual([4, 5, 6])
  })

  it('does not share series objects with the live config', () => {
    const chart = chartWith(SERIES)

    expect(chart.w.globals.initialConfig.series).not.toBe(chart.w.config.series)
    expect(chart.w.globals.initialConfig.series[0]).not.toBe(
      chart.w.config.series[0],
    )
  })

  it('does not re-alias the live config when updateSeries redefines it', async () => {
    const chart = chartWith(SERIES)

    await chart.updateSeries([
      { name: 'A', data: [7, 8, 9] },
      { name: 'B', data: [10, 11, 12] },
    ])

    // This capture site used to assign w.config.series itself, which restored
    // the alias Globals.init no longer makes.
    expect(chart.w.globals.initialConfig.series).not.toBe(chart.w.config.series)
    expect(chart.w.globals.initialConfig.series[0]).not.toBe(
      chart.w.config.series[0],
    )
  })

  it('keeps a collapsed series intact when updateOptions redefines the series', async () => {
    const chart = chartWith(SERIES)
    chart.hideSeries('B')

    await chart.updateOptions({
      series: [
        { name: 'A', data: [7, 8, 9] },
        { name: 'B', data: [10, 11, 12] },
      ],
    })

    // The call redefines the series, so the baseline moves — to what was
    // passed in, not to the collapse-emptied version of it.
    expect(chart.w.globals.initialConfig.series[1].data).toEqual([10, 11, 12])
  })

  it('captures initialConfig.series in the same shape as initialSeries', () => {
    const chart = chartWith(SERIES)
    const { globals, config } = chart.w

    // Series objects copied, data arrays shared — both snapshots, one helper.
    // _initialSeriesPeek is the lazy snapshot's non-materializing view.
    for (const snapshot of [
      globals._initialSeriesPeek,
      globals.initialConfig.series,
    ]) {
      expect(snapshot[0]).not.toBe(config.series[0])
      expect(snapshot[0].data).toBe(config.series[0].data)
    }
  })

  it('still records what the chart started with', () => {
    const chart = chartWith(SERIES)

    expect(chart.w.globals.initialConfig.series.map((s) => s.name)).toEqual([
      'A',
      'B',
    ])
    expect(chart.w.globals.initialConfig.series[0].data).toEqual([1, 2, 3])
  })
})
