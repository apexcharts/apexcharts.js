/**
 * Weave v6: what is drawn on this chart, as one list.
 *
 * The assertions worth having here are about coverage and honesty rather than
 * formatting: that the list reaches OTHER features' output (which is the whole
 * reason it exists), that every row says who owns it (so a reader can tell what
 * the list does not cover), and that a plugin's declarations cannot outlive the
 * drawing they describe.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'

/** What the reader plugin saw on the last draw. */
let seen = null
/** Set by a test: what the drawer plugin declares on each draw. */
let declaring = []
/** The reader's facade, for asking again between draws. */
let readerApi = null

const reader = {
  name: 'reader',
  apiVersion: 2,
  setup(api) {
    readerApi = api
    api.on('draw', () => {
      seen = api.drawn()
    })
  },
}

/**
 * Ask again, without a redraw.
 *
 * The list is a projection of live state rather than a snapshot, so a test
 * about something changing BETWEEN draws has to re-ask rather than read what
 * the last draw captured.
 */
const reread = () => readerApi.drawn()

const drawer = {
  name: 'drawer',
  apiVersion: 2,
  setup(api) {
    api.on('draw', () => {
      const layer = api.layer({ z: 'front', className: 'drawer' })
      layer.line({ x1: 0, y1: 0, x2: 10, y2: 10, stroke: '#000' })
      declaring.forEach((d) => api.declare(d))
    })
  },
}

/** Adds a series, so the inventory has something to attribute to a plugin. */
const adder = {
  name: 'adder',
  apiVersion: 2,
  setup(api) {
    api.on('afterParse', () => {
      if (api.store.done) return
      api.store.done = true
      api.markDerived(['Computed'])
      api.chart.updateSeries([
        ...api.data.map((s) => ({ name: s.name, data: s.raw })),
        { name: 'Computed', data: [7, 8, 9] },
      ])
    })
  },
}

beforeAll(() => {
  ;[reader, drawer, adder].forEach((p) => ApexCharts.registerPlugin(p))
})

beforeEach(() => {
  seen = null
  declaring = []
})

function chartWith(plugins, extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'line',
      width: 400,
      height: 300,
      animations: { enabled: false },
      toolbar: { show: false },
    },
    legend: { show: false },
    series: [
      { name: 'S1', data: [1, 2, 3] },
      { name: 'S2', data: [4, 5, 6] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    plugins,
    ...extra,
  })
}

const kinds = () => seen.map((i) => i.kind)
const labels = () => seen.map((i) => i.label)

// ---------------------------------------------------------------------------

describe('the series half', () => {
  it('lists every series by name, in chart order', () => {
    chartWith([{ name: 'reader' }])
    expect(kinds()).toEqual(['series', 'series'])
    expect(labels()).toEqual(['S1', 'S2'])
  })

  it('says a series the viewer switched off is not visible', async () => {
    const chart = chartWith([{ name: 'reader' }])
    await chart.hideSeries('S2')
    expect(seen.map((i) => i.visible)).toEqual([true, false])
  })

  it('attributes a computed series to the plugin that added it', () => {
    chartWith([{ name: 'adder' }, { name: 'reader' }])
    const computed = seen.find((i) => i.label === 'Computed')
    expect(computed).toBeTruthy()
    expect(computed.owner).toBe('adder')
    // The caller's own series are not the plugin's, and saying so is the
    // difference between a list and a claim of ownership.
    expect(seen.find((i) => i.label === 'S1').owner).toBe('core')
  })
})

describe('other features, which is the point', () => {
  it('reaches the caller annotations a plugin cannot otherwise see', () => {
    chartWith([{ name: 'reader' }], {
      annotations: {
        xaxis: [{ x: 'b', label: { text: 'Launch' } }],
        yaxis: [{ y: 5, id: 'target-line', label: { text: 'Target' } }],
      },
    })
    const annotations = seen.filter((i) => i.kind === 'annotation')
    expect(annotations.map((a) => a.label)).toEqual(['Launch', 'Target'])
  })

  // Most config-declared annotations have no id of their own, so the list
  // synthesises one rather than leaving rows unaddressable.
  it('gives an annotation without an id a stable one', () => {
    chartWith([{ name: 'reader' }], {
      annotations: { points: [{ x: 'a', y: 1, label: { text: 'Spike' } }] },
    })
    const point = seen.find((i) => i.label === 'Spike')
    expect(point.id).toBe('annotation:points:0')
  })

  it('keeps an id its author chose', () => {
    chartWith([{ name: 'reader' }], {
      annotations: { yaxis: [{ y: 5, id: 'target-line' }] },
    })
    expect(seen.find((i) => i.kind === 'annotation').id).toBe('target-line')
  })
})

describe('what a plugin declares', () => {
  it('appears, attributed to that plugin', () => {
    declaring = [{ id: 'trend', label: 'Trend line' }]
    chartWith([{ name: 'drawer' }, { name: 'reader' }])
    const overlay = seen.find((i) => i.kind === 'overlay')
    expect(overlay.label).toBe('Trend line')
    expect(overlay.owner).toBe('drawer')
  })

  it('is one row however many times it is declared', () => {
    declaring = [
      { id: 'trend', label: 'Trend line' },
      { id: 'trend', label: 'Trend line, renamed' },
    ]
    chartWith([{ name: 'drawer' }, { name: 'reader' }])
    const overlays = seen.filter((i) => i.kind === 'overlay')
    expect(overlays).toHaveLength(1)
    expect(overlays[0].label).toBe('Trend line, renamed')
  })

  /*
   * The honesty rule. Layers are wiped at the start of every draw and repainted
   * from state, so a declaration that survived that would describe drawing
   * which no longer exists.
   */
  it('goes when the plugin stops declaring it', async () => {
    declaring = [{ id: 'trend', label: 'Trend line' }]
    const chart = chartWith([{ name: 'drawer' }, { name: 'reader' }])
    expect(seen.filter((i) => i.kind === 'overlay')).toHaveLength(1)

    declaring = []
    await chart.update()
    expect(seen.filter((i) => i.kind === 'overlay')).toHaveLength(0)
  })

  it('ignores a declaration with no id rather than listing an unaddressable row', () => {
    declaring = [{ label: 'Nameless' }]
    chartWith([{ name: 'drawer' }, { name: 'reader' }])
    expect(seen.filter((i) => i.kind === 'overlay')).toHaveLength(0)
  })

  /*
   * Clearing at the start of each draw is not enough on its own, and the first
   * plugin to consume this found out the hard way.
   *
   * A plugin that repaints on an INTERACTION rather than on a chart render is
   * the normal case for an overlay: switching one off empties the layer and
   * never reaches a draw hook. The declaration made for the previous paint
   * would then go on being reported for something no longer on screen, and the
   * inventory would be confidently wrong rather than merely incomplete.
   *
   * Emptying the layer is the plugin saying, in the only way the API gives it,
   * that it is drawing nothing.
   */
  it('goes when the plugin empties its layer, without waiting for a redraw', () => {
    let handle = null
    ApexCharts.registerPlugin({
      name: 'clearer',
      apiVersion: 2,
      setup(api) {
        api.on('draw', () => {
          handle = api.layer()
          handle.line({ x1: 0, y1: 0, x2: 10, y2: 10, stroke: '#000' })
          api.declare({ id: 'mark', label: 'A mark' })
        })
      },
    })

    chartWith([{ name: 'clearer' }, { name: 'reader' }])
    expect(seen.filter((i) => i.kind === 'overlay')).toHaveLength(1)

    // What a plugin does when the viewer switches its overlay off.
    handle.clear()
    expect(reread().filter((i) => i.kind === 'overlay')).toHaveLength(0)
  })

  // Scoped to the plugin that cleared. Another plugin's inventory is none of
  // its business, and a clear that wiped the list would let one plugin erase
  // everyone's work from the readout.
  it('drops only the clearing plugins own declarations', () => {
    let mine = null
    ApexCharts.registerPlugin({
      name: 'selfish',
      apiVersion: 2,
      setup(api) {
        api.on('draw', () => {
          mine = api.layer()
          mine.line({ x1: 0, y1: 0, x2: 5, y2: 5, stroke: '#000' })
          api.declare({ id: 'mine', label: 'Mine' })
        })
      },
    })

    declaring = [{ id: 'trend', label: 'Trend line' }]
    chartWith([{ name: 'drawer' }, { name: 'selfish' }, { name: 'reader' }])
    expect(seen.filter((i) => i.kind === 'overlay')).toHaveLength(2)

    mine.clear()
    const left = reread().filter((i) => i.kind === 'overlay')
    expect(left).toHaveLength(1)
    expect(left[0].owner).toBe('drawer')
  })
})

describe('the list itself', () => {
  it('is read only, so one plugin cannot edit what another is told', () => {
    chartWith([{ name: 'reader' }])
    expect(Object.isFrozen(seen)).toBe(true)
    expect(Object.isFrozen(seen[0])).toBe(true)
    expect(() => seen.push({})).toThrow()
  })

  it('says who owns every row, so a reader knows what it covers', () => {
    declaring = [{ id: 'trend', label: 'Trend line' }]
    chartWith([{ name: 'drawer' }, { name: 'reader' }], {
      annotations: { yaxis: [{ y: 5, label: { text: 'Target' } }] },
    })
    for (const item of seen) {
      expect(typeof item.owner).toBe('string')
      expect(item.owner.length).toBeGreaterThan(0)
    }
  })

  it('is reported by the capability set', () => {
    let can = null
    ApexCharts.registerPlugin({
      name: 'asks',
      apiVersion: 2,
      setup(api) {
        can = api.can('drawn')
      },
    })
    chartWith([{ name: 'asks' }])
    expect(can).toBe(true)
  })
})
