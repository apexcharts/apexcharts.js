/**
 * Weave v7: a plugin drawing a PART of each value.
 *
 * The promise being protected is the same one claims protect, in a harder
 * place. A plugin with a second number per datum has only ever had
 * `markDerived()`, and a series is a large thing to put on someone else's
 * chart: a legend entry, a tooltip row, an export column, a rescaled value axis
 * and, on bars, half the width of every bar the caller had. `api.highlight()`
 * draws the second number inside the slot the first one already occupies, and
 * writes nothing.
 *
 * So the assertions that matter are: the parts are drawn, the caller's series
 * are untouched, the caller's bars keep their width, and nothing a plugin
 * registered can outlive the plugin. The four null answers are each pinned too,
 * because a plugin acts on them: it has a fallback to run, and a null it did
 * not expect means the fallback never runs.
 *
 * Driven through a real chart. A unit test of the resolver would agree with
 * itself about what is on screen.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/highlight-filter.js'

/** What the plugin registers at setup, and what it got back. */
let pending = null
let handle = null
let seen = null

const parter = {
  name: 'parter',
  apiVersion: 2,
  setup(api) {
    seen = { can: api.can('highlight'), capabilities: api.capabilities }
    handle = pending ? api.highlight(pending) : null
  },
}

/** Throws on every draw, so the host disables it after three. */
const breaker = {
  name: 'partbreaker',
  apiVersion: 2,
  setup(api) {
    api.highlight([{ series: 'Desktop', values: [10, 10, 10] }])
    api.on('draw', () => {
      throw new Error('partbreaker throws on every draw')
    })
  },
}

// A block body, not an expression: registerPlugin returns the ApexCharts class
// and vitest treats a returned value as a teardown function, which then fails
// with "Class constructor ApexCharts cannot be invoked without 'new'".
beforeAll(() => {
  ;[parter, breaker].forEach((p) => ApexCharts.registerPlugin(p))
})

beforeEach(() => {
  pending = null
  handle = null
  seen = null
})

const SERIES = [
  { name: 'Desktop', data: [42, 45, 48] },
  { name: 'Mobile', data: [58, 62, 66] },
]

function chart(extra = {}) {
  return createChartWithOptions({
    chart: {
      type: 'bar',
      width: 600,
      height: 360,
      animations: { enabled: false },
      toolbar: { show: false },
      ...(extra.chart || {}),
    },
    legend: { show: false },
    series: extra.series || SERIES,
    xaxis: { categories: ['a', 'b', 'c'] },
    plugins: [{ name: extra.plugin || 'parter' }],
    ...(extra.rest || {}),
  })
}

/** The registration re-renders one task later; let it. */
const settle = () => new Promise((r) => setTimeout(r, 0))

const q = (c, sel) => [...c.w.dom.baseEl.querySelectorAll(sel)]
const parts = (c) => q(c, '.apexcharts-bar-highlight-part')
const wholes = (c) =>
  q(c, '.apexcharts-series > .apexcharts-bar-area').filter(
    (n) => !n.classList.contains('apexcharts-highlight-part'),
  )
/** A bar's drawn width, from its path. */
const widthOf = (n) => {
  const xs = (String(n.getAttribute('d')).match(/-?\d+(\.\d+)?/g) || [])
    .filter((_, k) => k % 2 === 0)
    .map(Number)
  return Math.max(...xs) - Math.min(...xs)
}

// ---------------------------------------------------------------------------

describe('api.highlight', () => {
  it('is advertised as a capability', () => {
    chart()
    expect(seen.can).toBe(true)
    expect(seen.capabilities).toContain('highlight')
  })

  it('draws a part for every value it was given', async () => {
    pending = [
      { series: 'Desktop', values: [20, 22, 23] },
      { series: 'Mobile', values: [24, 26, 28] },
    ]
    const c = chart()
    expect(handle).not.toBeNull()
    await settle()
    expect(parts(c).length).toBe(6)
  })

  // The whole point of a part over a derived series. A derived series takes
  // half the width of every bar the caller had; a part takes none of it.
  it('leaves the caller bars exactly the width they had', async () => {
    const plain = chart()
    await settle()
    const before = wholes(plain).map(widthOf)
    plain.destroy()

    pending = [{ series: 'Desktop', values: [20, 22, 23] }]
    const c = chart()
    await settle()
    // Parts first: without this the assertion below passes on a chart that
    // drew nothing at all, which is the same screen the fallback produces.
    expect(parts(c).length).toBe(3)
    expect(wholes(c).map(widthOf)).toEqual(before)
  })

  // The case the seam was added for: a running total is LARGER than the bar it
  // sits on at every position after the first. The core already draws a part
  // past its whole (its own comment names an average), extends the axis to
  // reach it and marks it, so the bar keeps its width and the reader can still
  // see where the month's own figure ended.
  it('draws a running total, which is larger than the bar it sits on', async () => {
    const plain = chart()
    await settle()
    const width = wholes(plain).map(widthOf)
    const axis = plain.w.globals.maxY
    plain.destroy()

    // The running totals of Desktop's [42, 45, 48].
    pending = [{ series: 'Desktop', values: [42, 87, 135] }]
    const c = chart()
    await settle()

    const drawn = parts(c)
    expect(drawn.length).toBe(3)
    // Both of the ones past their whole are marked; the first equals its whole.
    expect(
      drawn.filter((n) =>
        n.classList.contains('apexcharts-highlight-overflow'),
      ).length,
    ).toBe(2)
    // The bars are untouched...
    expect(wholes(c).map(widthOf)).toEqual(width)
    // ...and the axis grew to fit the total, which is the cost no route avoids.
    expect(c.w.globals.maxY).toBeGreaterThan(axis)
    expect(c.w.globals.maxY).toBeGreaterThanOrEqual(135)
  })

  // A null in a row shows no part at that datum, and does not shift the rest
  // of the row onto the wrong bars.
  it('skips a datum whose part is null', async () => {
    pending = [{ series: 'Desktop', values: [20, null, 23] }]
    const c = chart()
    await settle()
    const drawn = parts(c)
    expect(drawn.length).toBe(2)
    expect(drawn.map((n) => n.getAttribute('j'))).toEqual(['0', '2'])
  })

  it('never writes the caller series', async () => {
    pending = [{ series: 'Desktop', values: [20, 22, 23] }]
    const c = chart()
    await settle()
    expect(parts(c).length).toBe(3)
    for (const s of c.w.config.series) {
      expect(s.highlightData).toBeUndefined()
      expect(s.data.every((d) => typeof d === 'number')).toBe(true)
    }
  })

  it('stops drawing on release, and releasing twice is not an error', async () => {
    pending = [{ series: 'Desktop', values: [20, 22, 23] }]
    const c = chart()
    await settle()
    expect(parts(c).length).toBe(3)

    handle.release()
    await settle()
    expect(parts(c).length).toBe(0)
    expect(() => handle.release()).not.toThrow()
  })

  it('redraws the new parts on update', async () => {
    pending = [{ series: 'Desktop', values: [20, 22, 23] }]
    const c = chart()
    await settle()

    handle.update([{ series: 'Desktop', values: [20, null, null] }])
    await settle()
    expect(parts(c).length).toBe(1)
  })

  // Resolved on every parse rather than remembered, so the parts follow the
  // series the plugin named rather than the position it was in.
  it('follows the series it named when the caller reorders', async () => {
    pending = [{ series: 'Desktop', values: [20, 22, 23] }]
    const c = chart()
    await settle()
    expect(parts(c)[0].getAttribute('index')).toBe('0')

    c.updateSeries([SERIES[1], SERIES[0]])
    await settle()
    const drawn = parts(c)
    expect(drawn.length).toBe(3)
    expect(new Set(drawn.map((n) => n.getAttribute('index')))).toEqual(
      new Set(['1']),
    )
  })

  // A plugin that gets null must have a fallback to run, so each refusal is
  // pinned rather than left to be discovered by a customer.
  describe('says null rather than drawing', () => {
    it('on a chart that is not an axis chart', () => {
      pending = [{ series: 'Desktop', values: [20] }]
      chart({
        chart: { type: 'pie' },
        series: [42, 58],
        rest: { labels: ['Desktop', 'Mobile'] },
      })
      expect(handle).toBeNull()
    })

    it('on a type that draws no parts', () => {
      pending = [{ series: 'Desktop', values: [20, 22, 23] }]
      chart({
        chart: { type: 'rangeBar' },
        series: [
          {
            name: 'Desktop',
            data: [
              { x: 'a', y: [1, 5] },
              { x: 'b', y: [2, 6] },
            ],
          },
        ],
      })
      expect(handle).toBeNull()
    })

    // Two sources of parts in one slot leave a viewer unable to tell whose
    // pick they are looking at, and the plugin's is the one nobody asked for.
    it('on a chart already showing the caller own parts', () => {
      pending = [{ series: 'Desktop', values: [20, 22, 23] }]
      chart({
        series: [
          { name: 'Desktop', data: [42, 45, 48], highlightData: [8, 9, 10] },
          { name: 'Mobile', data: [58, 62, 66] },
        ],
      })
      expect(handle).toBeNull()
    })

    it('when nothing usable was handed in', () => {
      pending = [{ series: 'Desktop', values: 'not an array' }]
      chart()
      expect(handle).toBeNull()
    })
  })

  // The leak that must be unreachable: parts nobody is maintaining going on
  // being drawn over the caller's values.
  describe('cannot outlive the plugin', () => {
    it('drops them when the host disables the plugin', async () => {
      const c = chart({ plugin: 'partbreaker' })
      await settle()
      // Three failures disable it; each update draws once.
      for (let k = 0; k < 4; k++) {
        c.update()
        await settle()
      }
      expect(c.w.weaveHighlights.records.length).toBe(0)
    })

    it('drops them on destroy', async () => {
      pending = [{ series: 'Desktop', values: [20, 22, 23] }]
      const c = chart()
      await settle()
      expect(c.w.weaveHighlights.records.length).toBe(1)
      const w = c.w
      c.destroy()
      expect(w.weaveHighlights.records.length).toBe(0)
    })
  })
})
