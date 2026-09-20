import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A series declared `hidden: true` is collapsed in ApexCharts.create() BEFORE
// parseData() runs, so the baseline that parse captures into
// globals.initialSeries holds `data: []` for it. Nothing refreshed it
// afterwards: the legend's own updates pass `overwriteInitialSeries: false` so
// that an internal re-render keeps the baseline it was given (#5283), which
// until then had been repairing this by accident on the first legend click.
//
// The baseline is read in two places that then get the wrong answer:
//
//   - resetSeries() clones it, so a config-hidden series comes back from a
//     reset EMPTY and its data is gone for the life of the chart;
//   - Tooltip's isInitialSeriesSameLen() skips collapsed rows but measures the
//     rest, so the moment the viewer un-hides one from the legend its length
//     of 0 is compared against its siblings' and the check fails -- which
//     silently downgrades every shared tooltip on the chart to the single
//     series nearest the cursor.
//
// Sibling of initial-config-hidden-series.spec.js (#5118), which is the same
// hazard one snapshot over.

const A = [1, 2, 3]
const B = [4, 5, 6]

function chartWith({ hidden }) {
  return createChartWithOptions({
    chart: { type: 'line', width: 800, height: 400 },
    series: [
      { name: 'A', data: [...A] },
      { name: 'B', hidden, data: [...B] },
    ],
    xaxis: { categories: ['x', 'y', 'z'] },
  })
}

describe('baseline of a series declared hidden in the config', () => {
  it('keeps the hidden series data in initialSeries', () => {
    const chart = chartWith({ hidden: true })

    // control: it really is collapsed, and the live config really is empty
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
    expect(chart.w.config.series[1].data).toEqual([])

    expect(chart.w.globals.initialSeries[1].data).toEqual(B)
    expect(chart.w.globals._initialSeriesPeek[1].data).toEqual(B)
  })

  it('restores the hidden series data on resetSeries', async () => {
    const chart = chartWith({ hidden: true })

    chart.resetSeries()

    expect(chart.w.config.series[1].data).toEqual(B)
  })

  it('keeps the shared tooltip once the hidden series is shown', () => {
    const chart = chartWith({ hidden: true })
    const sameLen = () =>
      chart.ctx.tooltip.tooltipUtil.isInitialSeriesSameLen()

    // hidden, the row is filtered out of the check and never measured
    expect(sameLen()).toBe(true)

    chart.showSeries('B')

    // shown, it is measured -- against a baseline that has to carry its data
    expect(sameLen()).toBe(true)
  })

  it('leaves the baseline of a visible chart alone', () => {
    const chart = chartWith({ hidden: false })

    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
    expect(chart.w.globals.initialSeries.map((s) => s.data)).toEqual([A, B])
  })

  it('does not disturb a series hidden through the legend instead', () => {
    const chart = chartWith({ hidden: false })

    chart.hideSeries('B')

    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
    expect(chart.w.globals.initialSeries[1].data).toEqual(B)
  })

  it('keeps the raw-stash baseline a derived chart type parses', () => {
    // A histogram's parsed series is the BINNED view, so parseData baselines
    // it from the raw observations instead. The repair must restore that row
    // from the same input, never from the binned one.
    const observations = [1, 1, 2, 3, 5, 8, 8, 8, 13, 21]
    const chart = createChartWithOptions({
      chart: { type: 'histogram', width: 800, height: 400 },
      series: [
        { name: 'A', data: [...observations] },
        { name: 'B', hidden: true, data: [...observations] },
      ],
    })

    expect(chart.w.globals.initialSeries[1].data).toEqual(observations)
  })
})
