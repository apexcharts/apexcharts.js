import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { waterfallTransform } from '../../src/features/waterfall'
import { streamgraphTransform } from '../../src/features/streamgraph'

// The waterfall and streamgraph transforms rebuild the series from a raw
// stash. A combo series of ANOTHER type (a target line over a waterfall, a
// reference line over a streamgraph) is not theirs to rebuild: it must be
// drawn at its own values, not accumulated into a running walk or stacked
// into a band.

describe('waterfall transform skips typed combo series', () => {
  it('a line series in a waterfall keeps its y values', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'waterfall',
        width: 600,
        height: 300,
        animations: { enabled: false },
      },
      series: [
        {
          name: 'cf',
          data: [
            { x: 'a', y: 100 },
            { x: 'b', y: 50 },
            { x: 'c', y: -30 },
          ],
        },
        {
          name: 'target',
          type: 'line',
          data: [
            { x: 'a', y: 90 },
            { x: 'b', y: 140 },
            { x: 'c', y: 130 },
          ],
        },
      ],
    })
    const w = chart.w
    expect(w.config.series[1].data.map((d) => d.y)).toEqual([90, 140, 130])
    // The waterfall itself still accumulates.
    expect(w.config.series[0].data.map((d) => d.y)).toEqual([
      [0, 100],
      [100, 150],
      [150, 120],
    ])
    // No step is recorded for the line, so its tooltip and labels read its
    // own value rather than a waterfall step.
    expect(w.waterfallData.values[0]).toEqual([100, 50, -30])
    expect(w.waterfallData.values[1] || []).toEqual([])
    chart.destroy()
  })

  it('a series typed waterfall is still accumulated', () => {
    const w = {
      config: { plotOptions: { waterfall: { colors: {} } }, xaxis: {} },
      globals: { collapsedSeriesIndices: [] },
    }
    const out = waterfallTransform(
      [
        {
          type: 'waterfall',
          data: [
            { x: 'a', y: 10 },
            { x: 'b', y: 5 },
          ],
        },
      ],
      w,
    )
    expect(out[0].data.map((d) => d.y)).toEqual([
      [0, 10],
      [10, 15],
    ])
  })
})

describe('streamgraph transform skips typed combo series', () => {
  const fakeW = () => ({
    config: { xaxis: {}, plotOptions: {} },
    globals: { collapsedSeriesIndices: [] },
  })
  const BANDS = [
    {
      name: 'A',
      data: [
        { x: 'a', y: 3 },
        { x: 'b', y: 5 },
        { x: 'c', y: 8 },
      ],
    },
    {
      name: 'B',
      data: [
        { x: 'a', y: 7 },
        { x: 'b', y: 6 },
        { x: 'c', y: 2 },
      ],
    },
  ]
  const LINE = {
    name: 'ref',
    type: 'line',
    // An x the bands never mention: it must not become a column.
    data: [
      { x: 'a', y: 1 },
      { x: 'b', y: 2 },
      { x: 'd', y: 4 },
    ],
  }

  it('a line series stays out of the join, the baseline and the output', () => {
    const alone = fakeW()
    streamgraphTransform(
      BANDS.map((s) => ({ ...s })),
      alone,
    )

    const w = fakeW()
    const out = streamgraphTransform(
      [...BANDS, LINE].map((s) => ({ ...s })),
      w,
    )
    const d = w.streamgraphData

    // Its own values, untouched.
    expect(out[2].data).toEqual(LINE.data)
    // Not stacked, and no column of its own.
    expect(d.order).not.toContain(2)
    expect(d.xs).toEqual(['a', 'b', 'c'])
    // Read out at the columns its x names ('d' is none of them), for the
    // tooltip, and listed apart from the bands.
    expect(d.values[2]).toEqual([1, 2, null])
    expect(d.lines).toEqual([2])
    // The bands come out exactly as they would without it.
    expect(d.lows[0]).toEqual(alone.streamgraphData.lows[0])
    expect(d.highs[1]).toEqual(alone.streamgraphData.highs[1])
  })
})

// The add-on's own series may also be typed with the BASE type it draws
// through ('rangeBar' for a waterfall, 'rangeArea' for a streamgraph): that
// is the only explicit type core can draw, so it must still be transformed.
describe('a series typed with the base type is still the add-on own', () => {
  it('waterfall: a rangeBar-typed series accumulates', () => {
    const chart = createChartWithOptions({
      chart: { type: 'waterfall', width: 600, height: 300 },
      xaxis: { categories: ['a', 'b', 'c', 'd'] },
      series: [
        {
          name: 'cf',
          type: 'rangeBar',
          data: [100, 50, -30, { y: 0, isTotal: true }],
        },
        { name: 'target', type: 'line', data: [90, 140, 130, 120] },
      ],
    })
    const w = chart.w
    expect(w.config.series[0].data.map((d) => d.y)).toEqual([
      [0, 100],
      [100, 150],
      [150, 120],
      [0, 120],
    ])
    // The bare-number line keeps its own values and draws a path.
    expect(w.config.series[1].data.map((d) => d.y)).toEqual([90, 140, 130, 120])
    expect(w.globals.seriesX.length).toBe(2)
    const g = w.dom.baseEl.querySelector(
      '.apexcharts-series[seriesName="target"]',
    )
    const path = g && g.querySelector('path')
    expect(path && path.getAttribute('d')).toMatch(/^M/)
    chart.destroy()
  })

  it('streamgraph: rangeArea-typed bands are stacked', () => {
    const chart = createChartWithOptions({
      chart: { type: 'streamgraph', width: 600, height: 300 },
      xaxis: { categories: ['a', 'b', 'c'] },
      series: [
        { name: 'A', type: 'rangeArea', data: [3, 5, 8] },
        { name: 'B', type: 'rangeArea', data: [7, 6, 2] },
      ],
    })
    const d = chart.w.streamgraphData
    expect(d.order.slice().sort()).toEqual([0, 1])
    expect(chart.w.config.series[0].data[0].y).toHaveLength(2)
    chart.destroy()
  })
})

// The most common combo: plain number arrays with xaxis.categories. The bands
// come back as {x, y: [lo, hi]}, so a bare-number line beside them must be
// given the same x, or core finds no x for it and draws nothing.
describe('bare-number combo line beside a streamgraph', () => {
  const make = () =>
    createChartWithOptions({
      chart: { type: 'streamgraph', width: 600, height: 300 },
      xaxis: { categories: ['a', 'b', 'c'] },
      series: [
        { name: 'A', data: [3, 5, 8] },
        { name: 'B', data: [7, 6, 2] },
        { name: 'L', type: 'line', data: [4, 4, 4] },
      ],
    })

  it('draws the line at its own values', () => {
    const chart = make()
    const w = chart.w
    expect(w.globals.seriesX.length).toBe(3)
    expect(w.config.series[2].data.map((d) => d.y)).toEqual([4, 4, 4])
    expect(w.streamgraphData.order).not.toContain(2)
    const g = w.dom.baseEl.querySelector('.apexcharts-series[seriesName="L"]')
    const path = g && g.querySelector('path')
    expect(path && path.getAttribute('d')).toMatch(/^M/)
    chart.destroy()
  })

  it('the legend toggle still collapses a band, and the line', () => {
    const chart = make()
    chart.toggleSeries('A')
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([0])
    expect(chart.w.streamgraphData.order).toEqual([1])
    chart.toggleSeries('A')
    chart.toggleSeries('L')
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([2])
    expect(chart.w.streamgraphData.order.slice().sort()).toEqual([0, 1])
    chart.toggleSeries('L')
    expect(chart.w.config.series[2].data.map((d) => d.y)).toEqual([4, 4, 4])
    chart.destroy()
  })

  it('the default tooltip reads the line out, outside the total', () => {
    const chart = make()
    const w = chart.w
    const html = w.config.tooltip.custom({
      ctx: chart.ctx,
      w,
      series: w.seriesData.series,
      seriesIndex: 2,
      dataPointIndex: 1,
    })
    const text = html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    expect(text).toContain('L 4')
    expect(text).toContain('Total 11')
    chart.destroy()
  })
})
