import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #4999: a rangeArea chart always started its y axis at 0. `setYRange()` only
 * lets line/area/scatter/candlestick/boxPlot/violin/vertical rangeBar charts
 * take their lower bound from the data; every other type fell through to the
 * bar-style branch that merges in `Number.MIN_VALUE`, which pins the axis to 0.
 * Ranges far from zero were squashed into a thin band at the top of the plot,
 * and `chart.zoom.autoScaleYaxis` had no visible effect.
 *
 * A line chart over the same values is the oracle: it already scales to the
 * data, with and without a zoom window.
 */

const DAY = 24 * 60 * 60 * 1000
const START = Date.UTC(2026, 0, 1)
const LOWS = [
  100000, 102000, 101000, 105000, 107000, 104000, 108000, 110000, 109000,
  112000,
]
const SPREAD = 3000

function rangeArea(lows = LOWS, chartOverrides = {}) {
  return createChartWithOptions({
    chart: {
      type: 'rangeArea',
      width: 800,
      height: 300,
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
      ...chartOverrides,
    },
    series: [
      {
        name: 'Range',
        data: lows.map((low, i) => ({
          x: START + i * DAY,
          y: [low, low + SPREAD],
        })),
      },
    ],
    xaxis: { type: 'datetime' },
  })
}

function line(values) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 800,
      height: 300,
      zoom: { enabled: true, type: 'x', autoScaleYaxis: true },
    },
    series: [
      { name: 'Line', data: values.map((y, i) => [START + i * DAY, y]) },
    ],
    xaxis: { type: 'datetime' },
  })
}

describe('Issue 4999: rangeArea y axis follows the data', () => {
  it('does not pin the y axis to 0 when every range is far from zero', () => {
    const chart = rangeArea()
    const scale = chart.w.globals.yAxisScale[0]

    expect(scale.niceMin).toBeGreaterThan(0)
    expect(scale.niceMin).toBeLessThanOrEqual(Math.min(...LOWS))
    expect(scale.niceMax).toBeGreaterThanOrEqual(Math.max(...LOWS) + SPREAD)
  })

  it('starts where a line chart over the range lows starts', () => {
    expect(rangeArea().w.globals.yAxisScale[0].niceMin).toBe(
      line(LOWS).w.globals.yAxisScale[0].niceMin,
    )
  })

  it('rescales to the zoomed window with chart.zoom.autoScaleYaxis', () => {
    const chart = rangeArea()
    const fullMin = chart.w.globals.yAxisScale[0].niceMin

    // days 5..9: the lowest visible range starts at 104000
    chart.zoomX(START + 5 * DAY, START + 9 * DAY)
    const zoomed = chart.w.globals.yAxisScale[0]

    expect(zoomed.niceMin).toBeGreaterThan(fullMin)
    expect(zoomed.niceMin).toBeLessThanOrEqual(104000)
    expect(zoomed.niceMax).toBeGreaterThanOrEqual(112000 + SPREAD)
  })

  it('keeps ranges that dip below zero inside the axis', () => {
    const lows = [-5000, -2000, 1000, 3000]
    const scale = rangeArea(lows).w.globals.yAxisScale[0]

    expect(scale.niceMin).toBeLessThanOrEqual(-5000)
    expect(scale.niceMax).toBeGreaterThanOrEqual(3000 + SPREAD)
  })
})
