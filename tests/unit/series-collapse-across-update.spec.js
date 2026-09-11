/**
 * A legend collapse has to survive a data update.
 *
 * updateOptions({ series }) reconciled hides by name; updateSeries() dropped
 * them, so the two public ways of replacing a chart's data disagreed about
 * what the viewer was looking at. On a polling dashboard that meant every
 * series the viewer had switched off came back on the next refresh.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const opts = (series) => ({
  chart: { type: 'line', width: 800, height: 300 },
  series,
  xaxis: { categories: ['a', 'b', 'c'] },
})

const A = [1, 2, 3]
const B = [4, 5, 6]
const hidden = (chart) => chart.w.globals.collapsedSeries.map((c) => c.name)

describe('a legend collapse across a data update', () => {
  it('survives updateSeries, the same way it survives updateOptions', async () => {
    const chart = createChartWithOptions(
      opts([{ name: 'A', data: A }, { name: 'B', data: B }]),
    )
    await chart.render()

    chart.hideSeries('B')
    expect(hidden(chart)).toEqual(['B'])

    await chart.updateSeries([{ name: 'A', data: [9, 9, 9] }, { name: 'B', data: [8, 8, 8] }])
    expect(hidden(chart)).toEqual(['B'])

    // And the rise restores the data the update carried, not the stale copy
    // from when it was first hidden.
    chart.showSeries('B')
    expect(hidden(chart)).toEqual([])
    expect(chart.w.config.series[1].data).toEqual([8, 8, 8])
    chart.destroy()
  })

  it('survives appendSeries', async () => {
    const chart = createChartWithOptions(
      opts([{ name: 'A', data: A }, { name: 'B', data: B }]),
    )
    await chart.render()
    chart.hideSeries('B')

    await chart.appendSeries({ name: 'C', data: [7, 7, 7] })
    expect(chart.w.config.series.map((s) => s.name)).toEqual(['A', 'B', 'C'])
    expect(hidden(chart)).toEqual(['B'])
    chart.destroy()
  })

  // The behaviour the name matching exists for: a series the update no longer
  // carries cannot stay hidden, because it is not there to be shown again.
  it('drops the hide when the update no longer carries that series', async () => {
    const chart = createChartWithOptions(
      opts([{ name: 'A', data: A }, { name: 'B', data: B }]),
    )
    await chart.render()
    chart.hideSeries('B')

    await chart.updateSeries([{ name: 'A', data: A }, { name: 'C', data: [7, 7, 7] }])
    expect(hidden(chart)).toEqual([])
    chart.destroy()
  })

  // A reorder is the reason this matches on name rather than index.
  it('follows the series to its new index', async () => {
    const chart = createChartWithOptions(
      opts([{ name: 'A', data: A }, { name: 'B', data: B }]),
    )
    await chart.render()
    chart.hideSeries('B')

    await chart.updateSeries([{ name: 'B', data: B }, { name: 'A', data: A }])
    expect(hidden(chart)).toEqual(['B'])
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([0])
    chart.destroy()
  })

  // resetSeries is the call that means "put everything back", and it still does.
  it('is cleared by resetSeries', async () => {
    const chart = createChartWithOptions(
      opts([{ name: 'A', data: A }, { name: 'B', data: B }]),
    )
    await chart.render()
    chart.hideSeries('B')

    chart.resetSeries()
    expect(hidden(chart)).toEqual([])
    chart.destroy()
  })

  // Emptying a collapsed row must not reach back into the array the caller
  // still holds a reference to.
  it('does not empty the caller own series objects', async () => {
    const chart = createChartWithOptions(
      opts([{ name: 'A', data: A }, { name: 'B', data: B }]),
    )
    await chart.render()
    chart.hideSeries('B')

    const mine = [{ name: 'A', data: [9, 9, 9] }, { name: 'B', data: [8, 8, 8] }]
    await chart.updateSeries(mine)
    expect(mine[1].data).toEqual([8, 8, 8])
    chart.destroy()
  })
})
