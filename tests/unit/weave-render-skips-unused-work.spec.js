import { afterEach, describe, expect, it, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'

// Two pieces of per-render Weave work a chart paid for nothing:
// - every draw swept the plot with querySelectorAll for plugin layers, even on
//   a chart with no plugins. The host now removes the layers it tracks.
// - every dispatch with a subscribed handler built the full data snapshot up
//   front, whether or not the handler read `data`. It is now built on first
//   read, once per dispatch, and shared with api.data.

const LAYER_QUERY = /apexcharts-plugin-/

const drawn = { reads: 0, snapshots: [], apiSame: null }
ApexCharts.registerPlugin({
  name: 'lazy-reader',
  apiVersion: 1,
  setup(api) {
    api.on('draw', (payload) => {
      if (!payload.scales) return
      api.layer({ z: 'front' }).text({ x: 4, y: 4, text: 'L' })
    })
    api.on('afterUpdate', (payload) => {
      drawn.reads++
      drawn.snapshots.push(payload.data)
      drawn.apiSame = api.data === payload.data
    })
  },
})
ApexCharts.registerPlugin({
  name: 'second-reader',
  apiVersion: 1,
  setup(api) {
    api.on('afterUpdate', (payload) => drawn.snapshots.push(payload.data))
  },
})

function chart(plugins) {
  return createChartWithOptions({
    chart: { type: 'line', width: 400, height: 300 },
    series: [{ name: 'A', data: [1, 3, 2, 5] }],
    plugins,
  })
}

function countLayerQueries(fn) {
  const real = Element.prototype.querySelectorAll
  let n = 0
  const spy = vi
    .spyOn(Element.prototype, 'querySelectorAll')
    .mockImplementation(function (sel) {
      if (LAYER_QUERY.test(sel)) n++
      return real.call(this, sel)
    })
  return Promise.resolve(fn()).then(() => {
    spy.mockRestore()
    return n
  })
}

afterEach(() => vi.restoreAllMocks())

describe('Weave layer reset', () => {
  it('a chart with no plugins never queries for plugin layers', async () => {
    const c = chart(undefined)
    const n = await countLayerQueries(async () => {
      await c.updateSeries([{ data: [2, 2, 4, 1] }])
      await c.updateOptions({ title: { text: 'T' } })
    })
    expect(n).toBe(0)
  })

  it('a plugin layer is still replaced, never duplicated, on each draw', async () => {
    const c = chart([{ name: 'lazy-reader' }])
    const el = c.w.dom.baseEl
    expect(el.querySelectorAll('.apexcharts-plugin-lazy-reader').length).toBe(1)
    const n = await countLayerQueries(async () => {
      await c.updateSeries([{ data: [2, 2, 4, 1] }])
      await c.updateSeries([{ data: [3, 1, 4, 1] }])
    })
    expect(n).toBe(0)
    expect(el.querySelectorAll('.apexcharts-plugin-lazy-reader').length).toBe(1)
    expect(el.querySelectorAll('.apexcharts-plugin-lazy-reader text').length).toBe(1)
  })
})

describe('Weave data snapshot', () => {
  it('a draw handler that never reads data builds no snapshot', async () => {
    const c = chart([{ name: 'lazy-reader' }])
    const snap = vi.spyOn(c.weave, '_dataSnapshot')
    await c.updateSeries([{ data: [2, 2, 4, 1] }])
    // Only the afterUpdate read builds one; draw and afterScales do not.
    expect(snap).toHaveBeenCalledTimes(1)
  })

  it('every reader in one dispatch shares one snapshot, and api.data is it', async () => {
    drawn.snapshots = []
    const c = chart([{ name: 'lazy-reader' }, { name: 'second-reader' }])
    const snap = vi.spyOn(c.weave, '_dataSnapshot')
    await c.updateSeries([{ data: [9, 8, 7, 6] }])
    expect(snap).toHaveBeenCalledTimes(1)
    const [a, b] = drawn.snapshots.slice(-2)
    expect(a).toBe(b)
    expect(drawn.apiSame).toBe(true)
    expect(a[0].points.map((p) => p.y)).toEqual([9, 8, 7, 6])
  })

  it('a handler can still overwrite its own payload.data', async () => {
    const seen = {}
    ApexCharts.registerPlugin({
      name: 'data-writer',
      apiVersion: 1,
      setup(api) {
        api.on('afterUpdate', (payload) => {
          'use strict'
          payload.data = 'mine'
          seen.own = payload.data
        })
      },
    })
    drawn.snapshots = []
    const c = chart([{ name: 'data-writer' }, { name: 'second-reader' }])
    await c.updateSeries([{ data: [4, 4, 4, 4] }])
    expect(seen.own).toBe('mine')
    // The next plugin in the pass still reads the real snapshot.
    expect(drawn.snapshots.at(-1)[0].points.map((p) => p.y)).toEqual([4, 4, 4, 4])
  })
})
