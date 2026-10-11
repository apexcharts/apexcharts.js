import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// The zoom-aware data reducer re-reduces each series from a raw stash on every
// parse. A legend-hidden row has to stay empty there, and a series hidden at
// init has to be stashed with its rows, not the emptied row the init collapse
// left behind.

const pts = (base) => Array.from({ length: 2000 }, (_, i) => [i, base + (i % 20)])

const reduced = (series) =>
  createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 300,
      dataReducer: { enabled: true, threshold: 500, targetPoints: 250 },
    },
    series,
  })

describe('dataReducer and legend collapse', () => {
  it('a hidden series no longer scales the y axis', async () => {
    const chart = reduced([
      { name: 'A', data: pts(-10) },
      { name: 'B', data: pts(40) },
    ])
    await chart.hideSeries('A')
    expect(chart.w.seriesData.series[0].filter((v) => v != null).length).toBe(0)
    expect(chart.w.globals.minY).toBeGreaterThanOrEqual(0)
    await chart.showSeries('A')
    expect(chart.w.seriesData.series[0].length).toBe(250)
  })

  it('a series hidden at init is reduced once shown', async () => {
    const chart = reduced([
      { name: 'A', data: pts(0), hidden: true },
      { name: 'B', data: pts(40) },
    ])
    await chart.showSeries('A')
    expect(chart.w.seriesData.series.map((s) => s.length)).toEqual([250, 250])
  })
})
