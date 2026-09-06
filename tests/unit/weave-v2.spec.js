/**
 * Weave contract v2: the additions that let an analysis layer live OUTSIDE the
 * charting library, plus the non-axis snapshot bug that was disabling every
 * plugin on a pie.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const settle = () => sleep(80)

/** Registers a plugin that records what it was handed on each hook. */
function recorder(name) {
  const log = { setup: false, hooks: [], data: null, info: null, cats: null, err: null }
  ApexCharts.registerPlugin({
    name,
    setup(api) {
      log.setup = true
      log.api = api
      const capture = (hook) => () => {
        log.hooks.push(hook)
        try {
          log.data = JSON.parse(JSON.stringify(api.data))
          log.info = api.info
          log.cats = api.categories
        } catch (e) {
          log.err = String(e && e.message)
        }
      }
      api.on('draw', capture('draw'))
      api.on('afterUpdate', capture('afterUpdate'))
    },
  })
  return log
}

describe('Weave v2: version gating', () => {
  it('serves a v1 plugin on a v2 host instead of skipping it', async () => {
    let ran = false
    ApexCharts.registerPlugin({
      name: 'v1-legacy',
      apiVersion: 1,
      setup() {
        ran = true
      },
    })
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
      plugins: [{ name: 'v1-legacy' }],
    })
    await settle()
    // Exact-version matching would have disabled every existing plugin the
    // moment the contract gained a field.
    expect(ran).toBe(true)
    chart.destroy()
  })

  it('skips a plugin that needs a newer host than this one', async () => {
    let ran = false
    ApexCharts.registerPlugin({
      name: 'v99-future',
      apiVersion: 99,
      setup() {
        ran = true
      },
    })
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
      plugins: [{ name: 'v99-future' }],
    })
    await settle()
    expect(ran).toBe(false)
    chart.destroy()
  })
})

describe('Weave v2: non-axis charts', () => {
  it('runs plugins on a pie instead of disabling them', async () => {
    // Regression. The dispatch payload builds api.data up front, and the
    // snapshot called .map on the bare number a pie holds per slice. The
    // exception was caught by the per-plugin guard, so every Weave plugin
    // silently did nothing on a pie and the blame landed on the plugin.
    const log = recorder('v2-pie')
    const chart = createChartWithOptions({
      chart: { type: 'pie' },
      series: [30, 20, 50],
      labels: ['x', 'y', 'z'],
      plugins: [{ name: 'v2-pie' }],
    })
    await settle()

    expect(log.setup).toBe(true)
    expect(log.err).toBeNull()
    expect(log.hooks).toContain('draw')
    // Each slice is presented as a one-point series named for its label.
    expect(log.data).toHaveLength(3)
    expect(log.data.map((s) => s.name)).toEqual(['x', 'y', 'z'])
    expect(log.data.map((s) => s.points[0].y)).toEqual([30, 20, 50])
    expect(log.info.axisChart).toBe(false)
    chart.destroy()
  })
})

describe('Weave v2: api.data[].raw', () => {
  it('hands back the callers own data array, not the parsed view', async () => {
    const log = recorder('v2-raw')
    const data = [
      { x: 1756944000000, y: 1 },
      { x: 1757030400000, y: 2 },
    ]
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data }],
      xaxis: { type: 'datetime' },
      plugins: [{ name: 'v2-raw' }],
    })
    await settle()
    // The shape matters, not just the values: it is the only reliable template
    // for writing a derived series back.
    expect(log.data[0].raw).toEqual(data)
    chart.destroy()
  })

  it('is an empty array for a series that holds no data array', async () => {
    const log = recorder('v2-raw-pie')
    const chart = createChartWithOptions({
      chart: { type: 'pie' },
      series: [30, 20],
      labels: ['x', 'y'],
      plugins: [{ name: 'v2-raw-pie' }],
    })
    await settle()
    expect(log.data[0].raw).toEqual([])
    chart.destroy()
  })
})

describe('Weave v2: api.info and api.categories', () => {
  it('describes the chart well enough for a plugin to decide it applies', async () => {
    const log = recorder('v2-info')
    const chart = createChartWithOptions({
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'A', data: [1, 2, 3] }],
      xaxis: { categories: ['a', 'b', 'c'] },
      plugins: [{ name: 'v2-info' }],
    })
    await settle()
    expect(log.info.type).toBe('bar')
    expect(log.info.axisChart).toBe(true)
    expect(log.info.datetimeX).toBe(false)
    // The core refuses a horizontal bar in a combo, so a plugin adding a
    // derived series has to be able to see this.
    expect(log.info.horizontalBars).toBe(true)
    chart.destroy()
  })

  it('resolves categories that survive an update', async () => {
    // globals.categoryLabels is populated after a mount and EMPTY after an
    // updateSeries(), so a plugin reading it directly rendered real labels on
    // first paint and ordinals afterwards.
    const log = recorder('v2-cats')
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
      xaxis: { categories: ['Mon', 'Tue', 'Wed'] },
      plugins: [{ name: 'v2-cats' }],
    })
    await settle()
    expect(log.cats).toEqual(['Mon', 'Tue', 'Wed'])

    await chart.updateSeries([{ name: 'A', data: [4, 5, 6] }])
    await settle()
    expect(log.cats).toEqual(['Mon', 'Tue', 'Wed'])
    chart.destroy()
  })
})

describe('Weave v2: markDerived', () => {
  it('keeps a plugins own series out of the reset snapshot', async () => {
    // parseData() reassigns globals.initialSeries on EVERY parse, so
    // updateSeries(..., overwriteInitialSeries: false) does not keep a computed
    // series out of it. Without markDerived, resetSeries() restores the
    // plugin's output as if the caller had asked for it.
    ApexCharts.registerPlugin({
      name: 'v2-derive',
      setup(api) {
        api.on('draw', () => {
          if (api.store.done) return
          api.store.done = true
          api.markDerived(['Computed'])
          api.chart.updateSeries(
            [{ name: 'A', data: [1, 2, 3] }, { name: 'Computed', data: [2, 4, 6] }],
            false,
            false,
          )
        })
      },
    })
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
      plugins: [{ name: 'v2-derive' }],
    })
    await settle()
    await settle()

    expect(chart.w.config.series.map((s) => s.name)).toEqual(['A', 'Computed'])
    expect(chart.w.globals.initialSeries.map((s) => s.name)).toEqual(['A'])
    chart.destroy()
  })

  it('releases the claim when passed an empty list', async () => {
    let api = null
    ApexCharts.registerPlugin({
      name: 'v2-derive-clear',
      setup(a) {
        api = a
      },
    })
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 2, 3] }],
      plugins: [{ name: 'v2-derive-clear' }],
    })
    await settle()

    api.markDerived(['A'])
    api.markDerived([])
    await chart.updateSeries([{ name: 'A', data: [9, 9, 9] }])
    await settle()
    // No claim, so the snapshot is whatever the core recorded.
    expect(chart.w.globals.initialSeries.map((s) => s.name)).toEqual(['A'])
    chart.destroy()
  })
})
