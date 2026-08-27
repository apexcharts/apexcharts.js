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

  it('still records what the chart started with', () => {
    const chart = chartWith(SERIES)

    expect(chart.w.globals.initialConfig.series.map((s) => s.name)).toEqual([
      'A',
      'B',
    ])
    expect(chart.w.globals.initialConfig.series[0].data).toEqual([1, 2, 3])
  })
})
