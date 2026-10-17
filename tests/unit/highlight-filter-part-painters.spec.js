import { describe, test, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { SSRRenderer } from '../../src/ssr/SSRRenderer.js'
import { BrowserAPIs } from '../../src/ssr/BrowserAPIs.js'
import Filters from '../../src/modules/Filters.js'
import '../../src/features/highlight-filter.js'
import '../../src/features/morph.js'

// The part painters (treemap, pie, radial) and the helpers they share: leaf
// numbering under drilldown levels, a morph's rings, the server render's
// classes and which filters a part mirrors.

afterEach(() => vi.restoreAllMocks())

const q = (chart, sel) => [...chart.w.dom.baseEl.querySelectorAll(sel)]

describe('treemap with drilldown ids read as levels', () => {
  const opts = (data) => ({
    series: [{ name: 'S', data }],
    chart: { type: 'treemap', width: 500, height: 300 },
    plotOptions: { treemap: { nested: { drilldownAsLevels: true } } },
    drilldown: {
      series: [
        {
          id: 'a',
          data: [
            { x: 'a1', y: 5 },
            { x: 'a2', y: 6 },
            { x: 'a3', y: 7 },
          ],
        },
      ],
    },
    highlightFilter: {},
  })
  const leafParts = (chart) => {
    const out = {}
    chart.w.globals.treemapRoots.forEach(function walk(n) {
      if (n.children?.length) n.children.forEach(walk)
      else out[n.name] = n._datum?.highlight
    })
    return out
  }

  test('set() numbers the leaves as the chart does, the drilled ones included', async () => {
    const chart = createChartWithOptions(
      opts([
        { x: 'A', drilldown: 'a' },
        { x: 'B', y: 10 },
      ]),
    )
    expect(chart.w.globals.treemapRoots[0].children[0].children.length).toBe(3)
    await chart.highlightFilter.set([[1, 2, 3, 4]], { animate: false })
    expect(chart.w.highlightData.parts).toEqual([[1, 2, 3, 4]])
    expect(leafParts(chart)).toEqual({ a1: 1, a2: 2, a3: 3, B: 4 })
    // the levels are still drawn as levels
    expect(chart.w.globals.treemapRoots[0].children[0].name).toBe('A')
    const seen = []
    await chart.highlightFilter.set(
      (o) => {
        seen.push([o.dataPointIndex, o.x, o.value])
        return 1
      },
      { animate: false },
    )
    expect(seen).toEqual([
      [0, 'a1', 5],
      [1, 'a2', 6],
      [2, 'a3', 7],
      [3, 'B', 10],
    ])
  })

  test("a drilled parent's own highlight warns as any parent's does", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    createChartWithOptions(
      opts([
        { x: 'A', drilldown: 'a', highlight: 3 },
        { x: 'B', y: 10 },
      ]),
    )
    expect(
      warn.mock.calls.filter((c) => /parent's highlight/.test(c[0])).length,
    ).toBe(1)
  })

  const two = () =>
    opts([
      { x: 'A', drilldown: 'a' },
      { x: 'B', y: 10 },
    ])
  const tree = (chart) =>
    (chart.w.globals.treemapRoots || []).map(function f(n) {
      return n.children?.length ? { [n.name]: n.children.map(f) } : n.name
    })
  const flat = {
    plotOptions: { treemap: { nested: { drilldownAsLevels: false } } },
  }

  test('the copied level keeps its parts through an unrelated update', async () => {
    const chart = createChartWithOptions(two())
    await chart.highlightFilter.set([[1, 2, 3, 4]], { animate: false })
    await chart.updateOptions({ colors: ['#0b7285'] }, false, false)
    expect(leafParts(chart)).toEqual({ a1: 1, a2: 2, a3: 3, B: 4 })
    expect(chart.w.highlightData.parts).toEqual([[1, 2, 3, 4]])
  })

  test('drilldown ids stop reading as levels once the option is off, set or cleared', async () => {
    for (const clear of [true, false]) {
      const chart = createChartWithOptions(two())
      await chart.highlightFilter.set([[1, 2, 3, 4]], { animate: false })
      if (clear) await chart.highlightFilter.set(null, { animate: false })
      await chart.updateOptions(flat, false, false)
      expect(chart.w.globals.treemapRoots).toBe(null)
      expect(q(chart, '.apexcharts-treemap-rect').length).toBe(2)
    }
  })

  test('a level follows a new drilldown series, and the next set() numbers it', async () => {
    const chart = createChartWithOptions(two())
    await chart.highlightFilter.set([[1, 2, 3, 4]], { animate: false })
    const data = ['n1', 'n2'].map((x, i) => ({ x, y: i + 1 }))
    await chart.updateOptions(
      { drilldown: { series: [{ id: 'a', data }] } },
      false,
      false,
    )
    expect(tree(chart)).toEqual([{ S: [{ A: ['n1', 'n2'] }, 'B'] }])
    await chart.highlightFilter.set([[5, 6, 7]], { animate: false })
    expect(leafParts(chart)).toEqual({ n1: 5, n2: 6, B: 7 })
  })

  test('an id already expanded on the path is a leaf there, as the chart reads it', async () => {
    const o = opts([{ x: 'A', drilldown: 'a' }])
    o.drilldown.series[0].data[0].drilldown = 'a'
    const chart = createChartWithOptions(o)
    await chart.highlightFilter.set([[1, 2, 3]], { animate: false })
    expect(chart.w.highlightData.parts).toEqual([[1, 2, 3]])
    expect(leafParts(chart)).toEqual({ a1: 1, a2: 2, a3: 3 })
  })
})

describe('radialBar', () => {
  test('a morph into rings draws a ring with no source mark its part once', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 400 },
      series: [{ name: 'A', data: [60] }],
      highlightFilter: { data: [[30]] },
    })
    chart.w.config.chart.animations.enabled = true
    const morph = chart.ctx.morphTypeChange
    let wasActive = false
    const cb = morph.captureBeforeDestroy
    morph.captureBeforeDestroy = function (...a) {
      const r = cb.apply(this, a)
      wasActive = true
      return r
    }
    await chart.updateOptions({
      chart: { type: 'radialBar' },
      series: [70, 50],
      labels: ['A', 'B'],
      highlightFilter: { data: [40, 30] },
    })
    // the morph's deferred pass
    await Promise.resolve()
    await Promise.resolve()
    expect(wasActive).toBe(true)
    const rings = q(
      chart,
      '.apexcharts-radial-series .apexcharts-radialbar-area',
    )
    expect(rings.length).toBe(2)
    const parts = q(chart, '.apexcharts-radialbar-highlight-part')
    expect(parts.length).toBe(2)
    for (const ring of rings) {
      expect(
        ring.parentNode.querySelectorAll('.apexcharts-radialbar-highlight-part')
          .length,
      ).toBe(1)
    }
  })
})

describe('pie', () => {
  test('a server render keeps the overflow class on a part past its slice', async () => {
    // A server: no window, no document, no navigator.
    const saved = [global.window, global.document, global.navigator]
    global.window = global.document = global.navigator = undefined
    BrowserAPIs._resetShim()
    let svg
    try {
      svg = await SSRRenderer.renderToString({
        chart: { type: 'pie', width: 400, height: 400 },
        series: [40, 30, 20, 10],
        labels: ['North', 'South', 'East', 'West'],
        highlightFilter: { data: [60, 15, 5, null] },
      })
    } finally {
      ;[global.window, global.document, global.navigator] = saved
      BrowserAPIs._resetShim()
    }
    expect(svg.match(/apexcharts-pie-highlight-part/g)?.length).toBe(3)
    expect(svg.match(/apexcharts-highlight-overflow/g)?.length).toBe(1)
  })

  test("a part takes its slice's state filters but not its drop shadow", async () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'pie',
        width: 420,
        height: 420,
        dropShadow: { enabled: true },
      },
      series: [40, 30, 20, 10],
      labels: ['North', 'South', 'East', 'West'],
      highlightFilter: { data: [20, 15, 5, null] },
    })
    const whole = q(chart, '.apexcharts-pie-area')[0]
    const part = whole.parentNode.querySelector(
      '.apexcharts-pie-highlight-part',
    )
    // the primitives of the filter an element references
    const fes = (el) => {
      const id = /#([^)]+)/.exec(el.getAttribute('filter') || '')?.[1]
      const f = id && q(chart, 'filter').find((x) => x.id === id)
      return f ? [...f.children].map((k) => k.nodeName) : null
    }
    expect(fes(whole)).toContain('feGaussianBlur')
    expect(part.getAttribute('filter')).toBe(null)
    const filters = new Filters(chart.w)
    const copies = () => q(chart, 'filter').filter((x) => /p$/.test(x.id))
    // hovered or selected: the part lights with its slice, without the
    // shadow the slice's state filter runs after its colour step
    for (const type of ['lighten', 'darken']) {
      filters.applyFilter(whole.instance, 0, type, 0.15)
      await Promise.resolve()
      expect(fes(whole)).toContain('feGaussianBlur')
      expect(fes(part)).toEqual(['feColorMatrix'])
      expect(copies().length).toBe(1)
    }
    // back at rest: the shadow is the slice's alone, and the copy is gone
    filters.getDefaultFilter(whole.instance, 0)
    await Promise.resolve()
    expect(fes(whole)).toContain('feGaussianBlur')
    expect(part.getAttribute('filter')).toBe(null)
    expect(copies().length).toBe(0)
  })

  test('with no drop shadow a part takes its slice state filter as is', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie', width: 420, height: 420 },
      series: [40, 30, 20, 10],
      labels: ['North', 'South', 'East', 'West'],
      highlightFilter: { data: [20, 15, 5, null] },
    })
    const whole = q(chart, '.apexcharts-pie-area')[0]
    const part = whole.parentNode.querySelector(
      '.apexcharts-pie-highlight-part',
    )
    new Filters(chart.w).applyFilter(whole.instance, 0, 'lighten', 0.15)
    await Promise.resolve()
    expect(whole.getAttribute('filter')).toMatch(/^url\(/)
    expect(part.getAttribute('filter')).toBe(whole.getAttribute('filter'))
  })
})
