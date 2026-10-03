import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// A series hidden through the legend is re-parsed with `data: []`, and a
// stacked chart then pads its y with zeros. Its x has to come from somewhere:
// handleFormatXY has borrowed the active series' x since #368, but the
// [[x, y]] format did not, so a collapsed pair series carried an EMPTY x array
// next to a full row of zeros.
//
// Nothing about the static picture showed it, since the collapsed series is
// not painted at rest. It showed in the exit tween: every x came out NaN, the
// stack lookup (keyed by x value) missed and fell back to the axis baseline,
// and the morph's keyed join read every datum as an exit plus an enter. The
// hidden layer slid sideways into the plot's bottom-left corner instead of
// flattening onto the series below it. The tween itself is pinned in
// tests/interaction/specs/stacked-area-legend-toggle.spec.js; this pins the
// data contract it rests on.

const DAY = 864e5
const T0 = Date.UTC(2026, 8, 4)
const N = 6

function pairs(c, xOf) {
  return Array.from({ length: N }, (_, d) => [xOf(d), 100 + c * 10 + d])
}

function objects(c, xOf) {
  return Array.from({ length: N }, (_, d) => ({ x: xOf(d), y: 100 + c * 10 + d }))
}

function chartWith({ format = pairs, xType = 'datetime', hidden, yaxis } = {}) {
  const xOf = xType === 'datetime' ? (d) => T0 + d * DAY : (d) => d * 10
  return createChartWithOptions({
    chart: { type: 'area', stacked: true, width: 800, height: 400 },
    series: ['A', 'B', 'C'].map((name, c) => ({
      name,
      hidden: hidden === name,
      data: format(c, xOf),
    })),
    xaxis: { type: xType },
    ...(yaxis ? { yaxis } : {}),
  })
}

const expectedX = (xType) =>
  Array.from({ length: N }, (_, d) => (xType === 'datetime' ? T0 + d * DAY : d * 10))

describe('x values of a legend-collapsed series', () => {
  for (const [label, format] of [
    ['[x, y] pairs', pairs],
    ['{x, y} objects', objects],
  ]) {
    for (const xType of ['datetime', 'numeric']) {
      it(`${label}, ${xType} x: the collapsed series keeps a full x array`, () => {
        const chart = chartWith({ format, xType })
        chart.hideSeries('B')

        // control: it really is collapsed, with zero-padded y
        expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
        expect(chart.w.seriesData.series[1]).toEqual(Array(N).fill(0))

        expect(chart.w.seriesData.seriesX[1]).toEqual(expectedX(xType))
        // and the visible series are untouched
        expect(chart.w.seriesData.seriesX[0]).toEqual(expectedX(xType))
        expect(chart.w.seriesData.seriesX[2]).toEqual(expectedX(xType))
      })
    }
  }

  it('[x, y] pairs: the first series collapsed borrows from the next visible one', () => {
    const chart = chartWith()
    chart.hideSeries('A')

    expect(chart.w.globals.collapsedSeriesIndices).toEqual([0])
    expect(chart.w.seriesData.seriesX[0]).toEqual(expectedX('datetime'))
  })

  it('[x, y] pairs: a series declared hidden in the config has x from the first render', () => {
    const chart = chartWith({ hidden: 'B' })

    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
    expect(chart.w.seriesData.seriesX[1]).toEqual(expectedX('datetime'))
  })

  it('[x, y] pairs: an ancillary collapse (yaxis.showAlways) borrows x too', () => {
    const chart = chartWith({ yaxis: { show: true, showAlways: true } })
    chart.hideSeries('B')

    // control: it went down the ancillary branch, not the plain one
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
    expect(chart.w.globals.ancillaryCollapsedSeriesIndices).toEqual([1])

    expect(chart.w.seriesData.seriesX[1]).toEqual(expectedX('datetime'))
  })

  it('[x, y] pairs: showing the series again restores its own x', () => {
    const chart = chartWith()
    chart.hideSeries('B')
    chart.showSeries('B')

    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
    expect(chart.w.seriesData.series[1]).toEqual(
      Array.from({ length: N }, (_, d) => 110 + d),
    )
    expect(chart.w.seriesData.seriesX[1]).toEqual(expectedX('datetime'))
  })
})
