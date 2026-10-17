import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Utils from '../../src/utils/Utils.js'

// Deep clones on the update path, counted. updateOptions({ series }) used to
// materialise the lazy initialSeries snapshot and clone it again only to
// overwrite both a few lines later; resetSeries() and the toolbar zoom reset
// cloned the snapshot twice; every `hidden: true` series deep-cloned the whole
// config.series on each full render; and update() kept a deep clone of the
// last options only to stringify it on the next call. Each spec counts how
// many data points Utils.clone visits, and checks that dropping a clone did
// not let the caller's objects and the chart's config reach each other.

const pts = (n, seed = 0) =>
  Array.from({ length: n }, (_, i) => ({ x: i, y: ((i + seed) * 7) % 23 }))

const lineOpts = (extra = {}) => ({
  chart: { type: 'line', width: 600, height: 300, zoom: { enabled: true } },
  dataLabels: { enabled: false },
  xaxis: { type: 'numeric' },
  series: [
    { name: 'A', data: pts(600) },
    { name: 'B', data: pts(600, 3) },
  ],
  ...extra,
})

const isPoint = (o) => !!o && typeof o === 'object' && 'x' in o && 'y' in o

/** Counts the data points Utils.clone visits while `fn` runs. */
async function cloneVisits(fn) {
  const spy = vi.spyOn(Utils, 'clone')
  try {
    await fn()
    return spy.mock.calls.filter((c) => isPoint(c[0])).length
  } finally {
    spy.mockRestore()
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('updateOptions({ series }) does not deep-clone the old series', () => {
  it('visits none of the old points', async () => {
    const chart = createChartWithOptions(lineOpts())
    const n = await cloneVisits(() =>
      chart.updateOptions({
        series: [
          { name: 'A', data: pts(600, 5) },
          { name: 'B', data: pts(600, 9) },
        ],
      }),
    )
    // Before: 2400 (the lazy snapshot, then a copy of it). After: 0.
    expect(n).toBe(0)
    chart.destroy()
  })

  it('still backfills a partial series from the baseline', async () => {
    const chart = createChartWithOptions(lineOpts())
    const bData = chart.w.config.series[1].data.map((p) => ({ ...p }))
    const payload = {
      series: [{ name: 'A', data: pts(600, 5) }, { name: 'B2' }],
    }
    await chart.updateOptions(payload)
    const s = chart.w.config.series
    expect(s[1].name).toBe('B2')
    expect(s[1].data).toEqual(bData)
    expect(s[0].zIndex).toBe(0)
    expect(s[1].zIndex).toBe(1)

    // The caller's payload and the chart's config stay apart both ways.
    payload.series[1].name = 'changed'
    payload.series.push({ name: 'C', data: pts(3) })
    expect(s[1].name).toBe('B2')
    expect(chart.w.config.series.length).toBe(2)
    chart.w.config.series[1].data = []
    expect(payload.series[1].data).toBeUndefined()
    expect(chart.w.globals._initialSeriesPeek[1].data).toEqual(bData)
    chart.destroy()
  })

  it('keeps a legend-hidden series hidden and its data restorable', async () => {
    const opts = lineOpts()
    const callerRows = opts.series.map((s) => ({ row: s, data: s.data }))
    const chart = createChartWithOptions(opts)
    chart.hideSeries('B')
    // The legend's copy of the rows is shallow now: the caller's rows and
    // data arrays are untouched.
    callerRows.forEach(({ row, data }) => {
      expect(row.data).toBe(data)
      expect(data.length).toBe(600)
    })
    const payload = {
      series: [{ name: 'A', data: pts(600, 5) }, { name: 'B' }],
    }
    await chart.updateOptions(payload)
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1])
    expect(chart.w.config.series[1].data).toEqual([])
    // A partial row inherits the collapsed (empty) row, as it did when the
    // baseline was restored in place: the collapse record keeps the data.
    expect(chart.w.globals.collapsedSeries[0].data.length).toBe(600)
    expect(payload.series[1].data).toBeUndefined()
    chart.destroy()
  })

  // The baseline is shorter than config.series after an update that does
  // not overwrite it (drilldown levels, updateSeries(..., false)). A payload
  // row past its end is new and inherits nothing from the live row there.
  it('a row past the end of the baseline inherits nothing', async () => {
    const chart = createChartWithOptions(
      lineOpts({ series: [{ name: 'A', data: [1, 2, 3] }] }),
    )
    await chart.updateSeries(
      [
        { name: 'A', data: [1, 2, 3] },
        { name: 'Bee', color: '#ff0000', type: 'column', data: [3, 2, 1] },
      ],
      true,
      false,
    )
    expect(chart.w.globals._initialSeriesPeek.length).toBe(1)
    await chart.updateOptions({
      series: [{ data: [4, 5, 6] }, { data: [6, 5, 4] }],
    })
    const row = chart.w.config.series[1]
    expect(row.name).toBeUndefined()
    expect(row.color).toBeUndefined()
    expect(row.type).toBeUndefined()
    expect(chart.w.seriesData.seriesNames).toEqual(['A', 'series-2'])
    chart.destroy()
  })

  it('a new row is not hidden because the old row at its index was', async () => {
    const chart = createChartWithOptions(
      lineOpts({ series: [{ name: 'A', data: [1, 2, 3] }] }),
    )
    await chart.updateSeries(
      [
        { name: 'A', data: [1, 2, 3] },
        { name: 'Bee', hidden: true, data: [3, 2, 1] },
      ],
      true,
      false,
    )
    await chart.updateOptions({
      series: [
        { name: 'A', data: [1, 2, 3] },
        { name: 'C', data: [6, 5, 4] },
      ],
    })
    expect(chart.w.config.series[1].hidden).toBeUndefined()
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([])
    expect(chart.w.config.series[1].data).toEqual([6, 5, 4])
    chart.destroy()
  })
})

describe('resetSeries() and the zoom reset clone the baseline once', () => {
  it('resetSeries visits each old point once', async () => {
    const chart = createChartWithOptions(lineOpts())
    // Before: 2400 (materialise the snapshot, then clone it). After: 1200.
    const n = await cloneVisits(() => chart.resetSeries())
    expect(n).toBe(1200)
    chart.destroy()
  })

  it('the toolbar zoom reset visits each old point once', async () => {
    const chart = createChartWithOptions(lineOpts())
    chart.w.interact.zoomed = true
    // Before: 2400. After: 1200.
    const n = await cloneVisits(() => chart.ctx.toolbar.handleZoomReset())
    expect(n).toBe(1200)
    expect(chart.w.config.series[0].data).toEqual(pts(600))
    // The restored rows are the chart's own: editing them leaves the
    // baseline whole for the next reset.
    chart.w.config.series[0].data[0].y = 999
    expect(chart.w.globals._initialSeriesPeek[0].data[0].y).toBe(0)
    chart.destroy()
  })
})

describe('a `hidden: true` series does not deep-clone config.series', () => {
  it('renders with no more clone visits than the same chart unhidden', async () => {
    const count = async (hidden) => {
      const series = [0, 1, 2, 3].map((k) => ({
        name: `S${k}`,
        data: pts(300, k),
        hidden: hidden && k % 2 === 1,
      }))
      let chart
      const n = await cloneVisits(() => {
        chart = createChartWithOptions(lineOpts({ series }))
      })
      return { n, chart, series }
    }
    const shown = await count(false)
    shown.chart.destroy()
    const hidden = await count(true)
    // Before: 2400 more (two hidden series, each a clone of 1200 points).
    expect(hidden.n).toBe(shown.n)

    const { chart, series } = hidden
    expect(chart.w.globals.collapsedSeriesIndices).toEqual([1, 3])
    expect(chart.w.config.series[1].data).toEqual([])
    // The caller's rows keep their data, and the baseline has it too.
    expect(series[1].data.length).toBe(300)
    expect(chart.w.globals._initialSeriesPeek[1].data.length).toBe(300)
    await chart.showSeries('S1')
    expect(chart.w.config.series[1].data).toEqual(pts(300, 1))
    chart.destroy()
  })
})

describe('update() keeps no deep clone of the last options', () => {
  it('does not clone the options it renders, and still skips a repeat', async () => {
    const chart = createChartWithOptions(lineOpts())
    const seen = []
    const update = chart.update.bind(chart)
    chart.update = (o, ...rest) => {
      seen.push(o)
      return update(o, ...rest)
    }
    const spy = vi.spyOn(Utils, 'clone')
    const create = vi.spyOn(chart, 'create')
    await chart.updateOptions({ title: { text: 'One' } })
    // Before: 1 (the options object passed to update()). After: 0.
    expect(spy.mock.calls.filter((c) => seen.includes(c[0])).length).toBe(0)
    expect(create).toHaveBeenCalledTimes(1)

    const payload = { title: { text: 'One' } }
    await chart.updateOptions(payload)
    expect(create).toHaveBeenCalledTimes(1)

    // The comparison is against what was rendered, not the caller's object.
    payload.title.text = 'Two'
    await chart.updateOptions(payload)
    expect(create).toHaveBeenCalledTimes(2)
    expect(chart.w.config.title.text).toBe('Two')

    // A payload of bare values, the one kind the removed quick check in
    // updateOptions could match, is still rendered once.
    await chart.updateOptions({})
    await chart.updateOptions({})
    expect(create).toHaveBeenCalledTimes(3)
    chart.destroy()
  })
})
