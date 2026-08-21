/**
 * Trellis (#22, P5): the chart-type compatibility matrix (plan §10) as
 * BEHAVIOUR. Every row is exercised: the shared-scale contract, the shared
 * hidden frame (bin edges, color scale, z extent, bandwidth, radius), the
 * warning, or the block.
 *
 * The browser-side pixel gates (identical rendered bars/colors) live in
 * tests/interaction/specs/trellis.spec.js.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/full.js'
import { split } from '../../src/modules/trellis/TrellisSplit.js'
import * as TrellisScales from '../../src/modules/trellis/TrellisScales.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
  ApexCharts.registerSeriesType('p5dot', {
    renderItem({ x, y, api, color }) {
      api.circle({ cx: x, cy: y, r: 4, fill: color })
    },
  })
})

beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

async function mount(opts) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { height: 400, animations: { enabled: false }, ...opts.chart },
    ...opts,
  })
  await chart.render()
  return { chart, el }
}

const pairs = (base, n = 4) =>
  Array.from({ length: n }, (_, i) => [i + 1, base + i * 2])

/** Pushed yaxis of one panel. */
const yOf = (chart, key) => chart.getPanel(key).w.config.yaxis[0]

describe('matrix: the shared-y families (line, area, column, scatter, rangeArea, funnel, Marks)', () => {
  const CASES = [
    { type: 'line', data: (b) => pairs(b) },
    { type: 'area', data: (b) => pairs(b) },
    // 'column' is the vertical default of the bar pathway.
    { type: 'bar', data: (b) => pairs(b) },
    { type: 'scatter', data: (b) => pairs(b) },
    {
      type: 'rangeArea',
      data: (b) => pairs(b).map(([x, y]) => ({ x, y: [y - 1, y + 1] })),
    },
    { type: 'p5dot', data: (b) => pairs(b) },
  ]

  CASES.forEach(({ type, data }) => {
    it(`${type}: identical pushed bounds in every panel`, async () => {
      const { chart } = await mount({
        chart: { type },
        trellis: { by: 'k' },
        series: [
          { name: 's', k: 'a', data: data(10) },
          { name: 's', k: 'b', data: data(40) },
        ],
        xaxis: { type: 'numeric' },
        dataLabels: { enabled: false },
      })
      const a = yOf(chart, 'a')
      const b = yOf(chart, 'b')
      expect(a.min).toBe(b.min)
      expect(a.max).toBe(b.max)
      expect(a.tickAmount).toBe(b.tickAmount)
      chart.destroy()
    })
  })

  it('funnel (bar + isFunnel): shared bounds flow through the bar pathway', async () => {
    const { chart } = await mount({
      chart: { type: 'bar' },
      plotOptions: { bar: { horizontal: true, isFunnel: true } },
      trellis: { by: 'k' },
      series: [
        { name: 's', k: 'a', data: [{ x: 'S1', y: 100 }, { x: 'S2', y: 60 }] },
        { name: 's', k: 'b', data: [{ x: 'S1', y: 400 }, { x: 'S2', y: 90 }] },
      ],
      dataLabels: { enabled: false },
    })
    expect(yOf(chart, 'a').max).toBe(yOf(chart, 'b').max)
    chart.destroy()
  })
})

describe('matrix: baselines (bar zero-floored, positional ranges NOT)', () => {
  it('bar/column: an all-positive domain is floored at zero', () => {
    const r = split(
      [{ name: 's', k: 'a', data: [[1, 50], [2, 90]] }],
      { by: 'k' },
    )
    const scalesOf = (type) => TrellisScales.resolve(r, {}, { chartType: type })
    expect(scalesOf('bar').y.min).toBe(0)
    expect(scalesOf('column').y.min).toBe(0)
    // The positional range marks keep their own floor even in pure resolve:
    expect(scalesOf('candlestick').y.min).toBeGreaterThan(0)
    expect(scalesOf('boxPlot').y.min).toBeGreaterThan(0)
    expect(scalesOf('rangeBar').y.min).toBeGreaterThan(0)
  })

  it('candlestick/boxPlot/rangeBar/violin: position ranges keep their own floor', async () => {
    // A candlestick trellis at price 800-900 must not scale from 0 (the P1
    // bar-family list wrongly floored these).
    const { chart } = await mount({
      chart: { type: 'candlestick' },
      trellis: { by: 'k' },
      series: [
        {
          name: 's',
          k: 'a',
          data: [
            { x: 1, y: [850, 870, 840, 860] },
            { x: 2, y: [860, 890, 855, 880] },
          ],
        },
        {
          name: 's',
          k: 'b',
          data: [
            { x: 1, y: [800, 830, 795, 820] },
            { x: 2, y: [820, 845, 810, 840] },
          ],
        },
      ],
      xaxis: { type: 'numeric' },
    })
    const a = yOf(chart, 'a')
    expect(a.min).toBeGreaterThan(0)
    expect(a.min).toBe(yOf(chart, 'b').min)
    chart.destroy()
  })
})

describe('matrix: histogram (one bin frame over the union)', () => {
  const obs = (seed, base, n = 60) => {
    let s = seed
    return Array.from({ length: n }, () => {
      s = (s * 16807) % 2147483647
      return base + (s % 1000) / 25
    })
  }

  it('every panel carries the SAME explicit range + binWidth, and the count y domain', async () => {
    const { chart } = await mount({
      chart: { type: 'histogram' },
      trellis: { by: 'k' },
      series: [
        { name: 'd', k: 'a', data: obs(7, 10) },
        { name: 'd', k: 'b', data: obs(11, 30) },
        { name: 'd', k: 'c', data: obs(13, 22) },
      ],
      dataLabels: { enabled: false },
    })
    const h = (key) => chart.getPanel(key).w.config.plotOptions.histogram
    expect(h('a').range).toEqual(h('b').range)
    expect(h('a').binWidth).toBe(h('b').binWidth)
    expect(h('b').range).toEqual(h('c').range)
    // Identical DERIVED edges in the transform's own output:
    const edges = (key) => chart.getPanel(key).w.histogramData.edges
    expect(edges('a')).toEqual(edges('b'))
    expect(edges('b')).toEqual(edges('c'))
    // The shared y domain is bin COUNTS from zero, not the observations.
    const a = yOf(chart, 'a')
    expect(a.min).toBe(0)
    expect(a.max).toBe(yOf(chart, 'c').max)
    expect(a.max).toBeLessThan(60) // counts, not values (values reach ~70)
    chart.destroy()
  })

  it("group y modes fall back to 'shared' with a warning", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { chart } = await mount({
      chart: { type: 'histogram' },
      trellis: { row: 'k', scales: { y: 'independent-row' } },
      series: [
        { name: 'd', k: 'a', data: obs(7, 10) },
        { name: 'd', k: 'b', data: obs(11, 30) },
      ],
    })
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('histogram trellis')),
    ).toBe(true)
    expect(yOf(chart, 'a').max).toBe(yOf(chart, 'b').max)
    warn.mockRestore()
    chart.destroy()
  })
})

describe('matrix: violin (one KDE bandwidth over the union)', () => {
  it('pushes one derived bandwidth into every panel when the user set none', async () => {
    const obs = (base) => Array.from({ length: 40 }, (_, i) => base + (i % 13))
    const { chart } = await mount({
      chart: { type: 'violin' },
      trellis: { by: 'k' },
      series: [
        { name: 'd', k: 'a', data: [{ x: 'g', y: obs(10) }] },
        { name: 'd', k: 'b', data: [{ x: 'g', y: obs(50) }] },
      ],
    })
    const bw = (key) =>
      chart.getPanel(key).w.config.plotOptions.violin.kde.bandwidth
    expect(bw('a')).toBeGreaterThan(0)
    expect(bw('a')).toBe(bw('b'))
    chart.destroy()
  })
})

describe('matrix: heatmap (one color scale, one gradient legend)', () => {
  const row = (name, k, vals) => ({
    name,
    k,
    data: vals.map((v, i) => ({ x: `c${i}`, y: v })),
  })

  it('pushes the union color extent to every panel and never touches yaxis', async () => {
    const { chart, el } = await mount({
      chart: { type: 'heatmap' },
      trellis: { by: 'k' },
      series: [
        row('r1', 'a', [1, 2, 3]),
        row('r2', 'a', [4, 5, 6]),
        row('r1', 'b', [90, 95, 99]),
        row('r2', 'b', [80, 85, 88]),
      ],
      dataLabels: { enabled: false },
    })
    const cs = (key) =>
      chart.getPanel(key).w.config.plotOptions.heatmap.colorScale
    expect(cs('a').min).toBe(1)
    expect(cs('a').max).toBe(99)
    expect(cs('b').min).toBe(1)
    expect(cs('b').max).toBe(99)
    // The y axis is the ROW axis: no value bounds pushed.
    expect(chart.getPanel('a').w.config.yaxis[0].min).toBeUndefined()
    // One shared gradient strip is the grid's legend.
    expect(
      el.querySelectorAll('.apexcharts-trellis-gradient-legend svg'),
    ).toHaveLength(1)
    chart.destroy()
  })

  it("explicit user ranges are already absolute: nothing is pushed, scales.color 'independent' warns", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { chart } = await mount({
      chart: { type: 'heatmap' },
      trellis: { by: 'k', scales: { color: 'independent' } },
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [{ from: 0, to: 50, color: '#00A100' }],
          },
        },
      },
      series: [row('r1', 'a', [1, 2, 3]), row('r1', 'b', [40, 45, 48])],
    })
    const cs = chart.getPanel('a').w.config.plotOptions.heatmap.colorScale
    expect(cs.min).toBeUndefined()
    expect(cs.ranges).toHaveLength(1)
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('color scale')),
    ).toBe(true)
    warn.mockRestore()
    chart.destroy()
  })
})

describe('matrix: bubble (the size scale is shared, never independent)', () => {
  const bub = (k, z) => ({
    name: 's',
    k,
    data: [
      [1, 10, z],
      [2, 20, z * 2],
    ],
  })

  it('pushes the union z extent; the same z means the same radius everywhere', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { chart } = await mount({
      chart: { type: 'bubble' },
      trellis: { by: 'k', scales: { size: 'independent' } },
      series: [bub('a', 5), bub('b', 100)],
      xaxis: { type: 'numeric' },
      dataLabels: { enabled: false },
    })
    const bz = (key) => chart.getPanel(key).w.config.plotOptions.bubble
    expect(bz('a').minZ).toBe(5)
    expect(bz('a').maxZ).toBe(200)
    expect(bz('b').minZ).toBe(5)
    expect(bz('b').maxZ).toBe(200)
    // The core expands each panel's own z range to the pushed window:
    expect(chart.getPanel('a').w.globals.maxZ).toBe(200)
    expect(chart.getPanel('b').w.globals.minZ).toBe(5)
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('size scale')),
    ).toBe(true)
    warn.mockRestore()
    chart.destroy()
  })
})

describe('matrix: radar (shared max radius) and radialBar (cheapest row)', () => {
  it('radar: the shared y push IS the shared radius', async () => {
    const { chart } = await mount({
      chart: { type: 'radar' },
      trellis: { by: 'k' },
      series: [
        { name: 's', k: 'a', data: [10, 20, 30] },
        { name: 's', k: 'b', data: [60, 70, 90] },
      ],
      xaxis: { categories: ['x', 'y', 'z'] },
      dataLabels: { enabled: false },
    })
    const a = yOf(chart, 'a')
    expect(a.max).toBe(yOf(chart, 'b').max)
    expect(a.max).toBeGreaterThanOrEqual(90)
    chart.destroy()
  })

  it('radialBar: unwrapped value series, painted arcs, no scale pushes', async () => {
    const { chart, el } = await mount({
      chart: { type: 'radialBar' },
      trellis: { by: 'k' },
      series: [
        { name: 'pct', k: 'a', data: [72] },
        { name: 'pct', k: 'b', data: [45] },
      ],
      labels: ['Progress'],
    })
    // The radial family takes a BARE values array: the split's {name, data}
    // form must be unwrapped or the gauge renders an empty group (a real
    // regression the presence-only assertion missed).
    expect(chart.getPanel('a').w.config.series).toEqual([72])
    expect(chart.getPanel('b').w.config.series).toEqual([45])
    expect(
      el.querySelectorAll('.apexcharts-radialbar path').length,
    ).toBeGreaterThanOrEqual(2)
    expect(chart.getPanel('a').w.config.yaxis[0].min).toBeUndefined()
    chart.destroy()
  })
})

describe('matrix: pie family (radiusByTotal is what makes it honest)', () => {
  it('scales each panel radius by sqrt(total/maxTotal); off by default', async () => {
    const series = [
      { name: 'p', k: 'a', data: [10, 15] }, // total 25
      { name: 'p', k: 'b', data: [40, 60] }, // total 100
    ]
    const on = await mount({
      chart: { type: 'pie' },
      trellis: { by: 'k', radiusByTotal: true },
      series,
      labels: ['x', 'y'],
    })
    const scaleOf = (c, key) =>
      c.getPanel(key).w.config.plotOptions.pie.customScale
    expect(scaleOf(on.chart, 'b')).toBe(1)
    expect(scaleOf(on.chart, 'a')).toBeCloseTo(Math.sqrt(0.25), 10)
    // Unwrapped value series, really painted slices.
    expect(on.chart.getPanel('a').w.config.series).toEqual([10, 15])
    expect(
      on.el.querySelectorAll('.apexcharts-pie-area').length,
    ).toBeGreaterThanOrEqual(4)
    expect(on.chart.getPanel('a').w.config.yaxis[0].min).toBeUndefined()
    on.chart.destroy()

    const off = await mount({
      chart: { type: 'pie' },
      trellis: { by: 'k' },
      series,
      labels: ['x', 'y'],
    })
    expect(scaleOf(off.chart, 'a')).toBe(1)
    off.chart.destroy()
  })
})

describe('matrix: blocked and redirected types', () => {
  const TREE = [
    { x: 'A', y: 10 },
    { x: 'B', y: 20 },
  ]

  it('treemap: warns and renders a single chart (no trellis grid)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { el } = await mount({
      chart: { type: 'treemap' },
      trellis: { by: 'k' },
      series: [
        { name: 's', k: 'a', data: TREE },
        { name: 's', k: 'b', data: TREE },
      ],
      dataLabels: { enabled: false },
    })
    expect(el.querySelector('.apexcharts-trellis-grid')).toBeNull()
    expect(el.querySelectorAll('.apexcharts-canvas')).toHaveLength(1)
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('treemap')),
    ).toBe(true)
    warn.mockRestore()
  })

  it('sunburst: warns and renders a single chart', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { el } = await mount({
      chart: { type: 'sunburst' },
      trellis: { by: 'k' },
      series: [
        {
          name: 's',
          k: 'a',
          data: [{ id: 'r', parent: '', label: 'r', value: 10 }],
        },
      ],
    })
    expect(el.querySelector('.apexcharts-trellis-grid')).toBeNull()
    expect(
      warn.mock.calls.some((c) => String(c[0]).includes('sunburst')),
    ).toBe(true)
    warn.mockRestore()
  })

  it('unit: redirects to the native plotOptions.unit.grid.split', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { el } = await mount({
      chart: { type: 'unit' },
      trellis: { by: 'k' },
      series: [{ name: 's', k: 'a', data: [12] }],
    })
    expect(el.querySelector('.apexcharts-trellis-grid')).toBeNull()
    expect(
      warn.mock.calls.some((c) =>
        String(c[0]).includes('plotOptions.unit.grid.split'),
      ),
    ).toBe(true)
    warn.mockRestore()
  })
})

describe('matrix: boxPlot and rangeBar keep position semantics', () => {
  it('boxPlot from summaries: shared bounds, not zero-floored', async () => {
    const box = (base) => [
      { x: 'g', y: [base, base + 5, base + 10, base + 15, base + 20] },
    ]
    const { chart } = await mount({
      chart: { type: 'boxPlot' },
      trellis: { by: 'k' },
      series: [
        { name: 's', k: 'a', data: box(100) },
        { name: 's', k: 'b', data: box(140) },
      ],
    })
    const a = yOf(chart, 'a')
    expect(a.min).toBeGreaterThan(0)
    expect(a.max).toBe(yOf(chart, 'b').max)
    chart.destroy()
  })

  it('rangeBar: shared bounds, not zero-floored', async () => {
    const { chart } = await mount({
      chart: { type: 'rangeBar' },
      trellis: { by: 'k' },
      series: [
        { name: 's', k: 'a', data: [{ x: 'T1', y: [50, 60] }] },
        { name: 's', k: 'b', data: [{ x: 'T1', y: [70, 82] }] },
      ],
    })
    const a = yOf(chart, 'a')
    expect(a.min).toBeGreaterThan(0)
    expect(a.max).toBe(yOf(chart, 'b').max)
    chart.destroy()
  })
})
