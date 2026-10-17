import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/stats'
import '../../src/features/waterfall'
import '../../src/features/streamgraph'
import '../../src/features/dumbbell'
import '../../src/features/drilldown.js'

// Waterfall, streamgraph, dumbbell and histogram draw rows they derived from
// the user's series and keep the input in a raw stash. Switching chart.type
// away by updateOptions (no series in the payload) must draw the user's
// values, not the derived rows, and the stash must not outlive the type:
// appendData and resetSeries after the switch work on the live series, and
// switching back runs the transform again.

const noAnim = { animations: { enabled: false } }
const size = { width: 600, height: 300 }

const waterfall = () =>
  createChartWithOptions({
    chart: { type: 'waterfall', ...size, ...noAnim },
    series: [
      {
        name: 'cf',
        data: [
          { x: 'a', y: 100 },
          { x: 'b', y: 50 },
          { x: 'c', y: -30 },
        ],
      },
    ],
  })

const streamgraph = () =>
  createChartWithOptions({
    chart: { type: 'streamgraph', ...size, ...noAnim },
    series: [
      {
        name: 'A',
        data: [
          { x: 1, y: 5 },
          { x: 2, y: 8 },
          { x: 3, y: 4 },
        ],
      },
      {
        name: 'B',
        data: [
          { x: 1, y: 3 },
          { x: 2, y: 2 },
          { x: 3, y: 6 },
        ],
      },
    ],
  })

describe('alias type switch: waterfall', () => {
  it('waterfall -> bar draws the deltas, not the running levels', async () => {
    const chart = waterfall()
    expect(chart.w.seriesData.series).toEqual([[100, 150, 120]])
    await chart.updateOptions({ chart: { type: 'bar' } })
    expect(chart.w.seriesData.series).toEqual([[100, 50, -30]])
    expect(chart.w.globals.waterfallRawSeries).toBeNull()
    chart.destroy()
  })

  it('appendData after the switch appends to the drawn bars', async () => {
    const chart = waterfall()
    await chart.updateOptions({ chart: { type: 'bar' } })
    await chart.appendData([{ data: [{ x: 'd', y: 7 }] }])
    expect(chart.w.seriesData.series).toEqual([[100, 50, -30, 7]])
    chart.destroy()
  })

  it('resetSeries after the switch keeps the bar values', async () => {
    const chart = waterfall()
    await chart.updateOptions({ chart: { type: 'bar' } })
    chart.resetSeries()
    expect(chart.w.seriesData.series).toEqual([[100, 50, -30]])
    chart.destroy()
  })

  it('switching back to waterfall accumulates again', async () => {
    const chart = waterfall()
    await chart.updateOptions({ chart: { type: 'bar' } })
    await chart.updateOptions({ chart: { type: 'waterfall' } })
    expect(chart.w.seriesData.series).toEqual([[100, 150, 120]])
    await chart.appendData([{ data: [{ x: 'd', y: 10 }] }])
    expect(chart.w.seriesData.series).toEqual([[100, 150, 120, 130]])
    chart.destroy()
  })
})

describe('alias type switch with a series in the payload', () => {
  // overwriteInitialConfig=false keeps the stash (the library's replays rely
  // on it), so a payload that brings its own series must still be drawn.
  it('updateOptions(type + series, overwriteInitialConfig=false) draws the payload', async () => {
    const chart = waterfall()
    await chart.updateOptions(
      {
        chart: { type: 'bar' },
        series: [{ data: [{ x: 'p', y: 1 }, { x: 'q', y: 2 }] }],
      },
      false,
      false,
      true,
      false,
    )
    expect(chart.w.seriesData.series).toEqual([[1, 2]])
    await chart.appendData([{ data: [{ x: 'r', y: 3 }] }])
    expect(chart.w.seriesData.series).toEqual([[1, 2, 3]])
    chart.destroy()
  })

  it('a drilldown child with its own type draws its data, and drillUp restores the waterfall', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'waterfall', ...size, ...noAnim },
      series: [
        {
          name: 'cf',
          data: [
            { x: 'a', y: 100, drilldown: 'kid' },
            { x: 'b', y: 50 },
            { x: 'c', y: -30 },
          ],
        },
      ],
      drilldown: {
        enabled: true,
        series: [
          {
            id: 'kid',
            chart: { type: 'bar' },
            data: [
              { x: 'k1', y: 7 },
              { x: 'k2', y: 9 },
            ],
          },
        ],
      },
    })
    await chart.drillDown('kid')
    expect(chart.w.seriesData.series).toEqual([[7, 9]])
    await chart.appendData([{ data: [{ x: 'k3', y: 4 }] }])
    expect(chart.w.seriesData.series).toEqual([[7, 9, 4]])
    await chart.drillUp()
    expect(chart.w.seriesData.series).toEqual([[100, 150, 120]])
    chart.destroy()
  })
})

describe('alias type switch: streamgraph', () => {
  it('streamgraph -> area draws the band values, not the wiggle offsets', async () => {
    const chart = streamgraph()
    await chart.updateOptions({ chart: { type: 'area' } })
    expect(chart.w.seriesData.series).toEqual([
      [5, 8, 4],
      [3, 2, 6],
    ])
    expect(chart.w.globals.streamgraphRawSeries).toBeNull()
    chart.destroy()
  })

  it('appendData after the switch appends to the live series', async () => {
    const chart = streamgraph()
    await chart.updateOptions({ chart: { type: 'area' } })
    await chart.appendData([
      { data: [{ x: 4, y: 9 }] },
      { data: [{ x: 4, y: 1 }] },
    ])
    expect(chart.w.seriesData.series).toEqual([
      [5, 8, 4, 9],
      [3, 2, 6, 1],
    ])
    chart.destroy()
  })

  it('switching back to streamgraph offsets the bands again', async () => {
    const chart = streamgraph()
    const derived = chart.w.seriesData.series.map((r) => r.slice())
    await chart.updateOptions({ chart: { type: 'area' } })
    await chart.updateOptions({ chart: { type: 'streamgraph' } })
    expect(chart.w.seriesData.series).toEqual(derived)
    chart.destroy()
  })
})

describe('alias type switch: dumbbell and histogram', () => {
  it('dumbbell -> rangeBar hands back the measure series', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'dumbbell', ...size, ...noAnim },
      series: [
        { name: 'A', data: [{ x: 'p', y: 15 }, { x: 'q', y: 20 }] },
        { name: 'B', data: [{ x: 'p', y: 50 }, { x: 'q', y: 56 }] },
      ],
    })
    await chart.updateOptions({ chart: { type: 'bar' } })
    expect(chart.w.seriesData.series).toEqual([
      [15, 20],
      [50, 56],
    ])
    expect(chart.w.globals.dumbbellRawSeries).toBeNull()
    chart.destroy()
  })

  it('histogram -> line drops the stash and back re-bins', async () => {
    const obs = Array.from({ length: 60 }, (_, i) => (i * 37) % 50)
    const chart = createChartWithOptions({
      chart: { type: 'histogram', ...size, ...noAnim },
      series: [{ name: 'h', data: obs }],
    })
    const bins = chart.w.seriesData.series[0].slice()
    await chart.updateOptions({ chart: { type: 'line' } })
    expect(chart.w.globals.histogramRawSeries).toBeNull()
    expect(chart.w.config.series[0].data).toEqual(obs)
    await chart.updateOptions({ chart: { type: 'histogram' } })
    expect(chart.w.seriesData.series[0]).toEqual(bins)
    chart.destroy()
  })
})

describe('alias type switch with a legend-hidden series', () => {
  for (const [type, to] of [
    ['waterfall', 'bar'],
    ['streamgraph', 'area'],
  ]) {
    it(`${type} -> ${to} keeps the hidden series hidden, then shows its values`, async () => {
      const chart = createChartWithOptions({
        chart: { type, ...size, ...noAnim },
        series: [
          { name: 'A', data: [{ x: 1, y: 5 }, { x: 2, y: 8 }] },
          { name: 'B', data: [{ x: 1, y: 3 }, { x: 2, y: -2 }] },
        ],
      })
      await chart.hideSeries('B')
      await chart.updateOptions({ chart: { type: to } })
      expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
      expect(chart.w.seriesData.series[0]).toEqual([5, 8])
      expect((chart.w.seriesData.series[1] || []).length).toBe(0)
      await chart.showSeries('B')
      expect(chart.w.seriesData.series).toEqual([
        [5, 8],
        [3, -2],
      ])
      chart.destroy()
    })
  }
})

describe('nested treemap: plotOptions.treemap.nested.enabled toggle', () => {
  const NESTED = [
    {
      data: [
        {
          x: 'Tech',
          children: [
            { x: 'MSFT', y: 300 },
            { x: 'AAPL', y: 280 },
          ],
        },
        { x: 'Energy', children: [{ x: 'XOM', y: 200 }] },
      ],
    },
  ]
  const treemap = (enabled) =>
    createChartWithOptions({
      chart: { type: 'treemap', ...size, ...noAnim },
      series: NESTED,
      plotOptions: { treemap: { nested: { enabled } } },
    })

  it('turning nesting off by updateOptions lays the chart out flat', async () => {
    const flat = treemap(false)
    const expected = flat.w.seriesData.series.map((r) => r.slice())
    flat.destroy()

    const chart = treemap(true)
    expect(chart.w.globals.treemapRoots).not.toBeNull()
    await chart.updateOptions({
      plotOptions: { treemap: { nested: { enabled: false } } },
    })
    expect(chart.w.globals.treemapRoots).toBeNull()
    expect(chart.w.seriesData.series).toEqual(expected)

    await chart.updateOptions({
      plotOptions: { treemap: { nested: { enabled: true } } },
    })
    expect(chart.w.globals.treemapRoots?.length).toBe(1)
    expect(chart.w.seriesData.series).toEqual([[300, 280, 200]])
    chart.destroy()
  })

  it('appendData after nesting is turned off keeps the appended points', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'treemap', ...size, ...noAnim },
      series: [
        { name: 'S1', data: [{ x: 'c', y: 3 }] },
        { name: 'S2', data: [{ x: 'g2', children: [{ x: 'd', y: 2 }] }] },
      ],
    })
    expect(chart.w.globals.treemapRoots).not.toBeNull()
    await chart.updateOptions({
      plotOptions: { treemap: { nested: { enabled: false } } },
    })
    await chart.appendData([{ data: [{ x: 'z', y: 9 }] }])
    expect(chart.w.seriesData.series[0]).toEqual([3, 9])
    await chart.updateOptions({
      plotOptions: { treemap: { nested: { enabled: true } } },
    })
    expect(chart.w.globals.treemapRoots?.length).toBe(2)
    expect(chart.w.seriesData.series).toEqual([[3, 9], [2]])
    chart.destroy()
  })
})
