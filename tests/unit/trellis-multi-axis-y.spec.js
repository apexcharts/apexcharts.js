/**
 * A trellis with several y axes (a combo of Revenue in millions on the left
 * and a Margin rate on an opposite axis) used to pool every series into ONE
 * shared extent and push ONE yaxis object, which replaced the user's array:
 * the Margin axis was gone and its line lay flat on the 0..5,000,000
 * baseline. Series now map to axes by the core rules, every axis gets its
 * own shared bounds, and every user yaxis entry survives, on the first
 * render and on a host updateSeries.
 */
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'

beforeAll(() => {
  Object.defineProperty(window.SVGElement.prototype, 'getBBox', {
    writable: true,
    configurable: true,
    value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  })
})
beforeEach(() => {
  document.body.innerHTML = ''
  if (typeof Apex !== 'undefined') Apex._chartInstances = []
})

const series = (scale = 1) => [
  { name: 'Revenue', type: 'column', region: 'North', data: [1e6, 3e6, 5e6].map((v) => v * scale) },
  { name: 'Margin', type: 'line', region: 'North', data: [0.1, 0.2, 0.4] },
  { name: 'Revenue', type: 'column', region: 'South', data: [2e6, 2.5e6, 4e6].map((v) => v * scale) },
  { name: 'Margin', type: 'line', region: 'South', data: [0.05, 0.3, 0.35] },
]

const mount = async () => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    xaxis: { categories: ['q1', 'q2', 'q3'] },
    yaxis: [{ seriesName: 'Revenue' }, { seriesName: 'Margin', opposite: true }],
    series: series(),
  })
  await chart.render()
  return chart
}

/** @param {any} chart */
const axesOf = (chart) =>
  chart.trellis.panels.map((p) => {
    const w = p.chart.w
    return { cfg: w.config.yaxis, min: w.globals.minYArr, max: w.globals.maxYArr }
  })

describe('trellis: several y axes', () => {
  it('keeps every user axis, each with its own shared domain', async () => {
    const chart = await mount()
    const [a, b] = axesOf(chart)
    expect(a.cfg.length).toBe(2)
    expect(a.cfg[1].opposite).toBe(true)
    // the Margin axis is not stretched to the Revenue range
    expect(a.max[1]).toBeLessThan(10)
    expect(a.max[0]).toBeGreaterThanOrEqual(5e6)
    // and both panels share each axis
    expect(b.min).toEqual(a.min)
    expect(b.max).toEqual(a.max)
    // each axis is labelled by its own decimals, not the union's
    expect(a.cfg[0].labels.formatter(1000000)).toBe('1000000')
    expect(a.cfg[1].labels.formatter(0.1)).toBe('0.10')
    chart.destroy()
  })

  it('a host updateSeries restates every axis', async () => {
    const chart = await mount()
    await chart.updateSeries(series(2))
    const [a, b] = axesOf(chart)
    expect(a.cfg.length).toBe(2)
    expect(a.cfg[1].opposite).toBe(true)
    expect(a.max[1]).toBeLessThan(10)
    expect(a.max[0]).toBeGreaterThanOrEqual(1e7)
    expect(b.max).toEqual(a.max)
    chart.destroy()
  })

  it('a facet missing an axis series renders, its others on their own axis', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', virtualize: false },
      xaxis: { categories: ['q1', 'q2', 'q3'] },
      yaxis: [{ seriesName: 'Revenue' }, { seriesName: 'Margin', opposite: true }],
      series: [
        ...series().slice(0, 2),
        { name: 'Revenue', region: 'South', data: [2e6, 2.5e6, 4e6] },
        { name: 'Margin', region: 'West', data: [0.15, 0.25, 0.3] },
      ],
    })
    // per-panel mapping left a hole for South's missing Margin and crashed
    await chart.render()
    const west = chart.trellis.panels[2].chart.w
    expect(west.config.yaxis[1].seriesName).toEqual(['Margin'])
    // West's only series is Margin: it sits on the rate axis, not axis 0
    expect(west.globals.seriesYAxisReverseMap[0]).toBe(1)
    expect(west.config.yaxis[1].max).toBeLessThan(10)
    expect(west.globals.yAxisScale[1].niceMax).toBeLessThan(10)
    // index-mapped axes with a ragged facet render as well
    const el2 = document.createElement('div')
    document.body.appendChild(el2)
    const idx = new ApexCharts(el2, {
      chart: { type: 'line', height: 300, animations: { enabled: false } },
      trellis: { by: 'k', virtualize: false },
      yaxis: [{}, { opposite: true }],
      xaxis: { categories: ['a', 'b'] },
      series: [
        { name: 'Jan', k: 'p', data: [1, 2] },
        { name: 'Mar', k: 'p', data: [0.1, 0.2] },
        { name: 'Mar', k: 'q', data: [0.3, 0.4] },
      ],
    })
    await idx.render()
    expect(idx.trellis.panels[1].chart.w.globals.seriesYAxisReverseMap[0]).toBe(1)
    expect(idx.trellis.panels[1].chart.w.globals.yAxisScale[1].niceMax).toBeLessThan(1)
    idx.destroy()
    chart.destroy()
  })

  it("maps the axes once per derive: the core's warning does not repeat", async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', virtualize: false },
      xaxis: { categories: ['q1', 'q2', 'q3'] },
      // Margin named twice in the array style: the core warns once per run
      yaxis: [
        { seriesName: ['Revenue', 'Margin'] },
        { seriesName: ['Margin'], opposite: true },
      ],
      series: series(),
    })
    await chart.render()
    const n = warn.mock.calls.filter((c) => /more than once/.test(String(c[0]))).length
    warn.mockRestore()
    expect(n).toBe(1)
    chart.destroy()
  })

  it('the grid reset leaves each axis its own domain', async () => {
    const chart = await mount()
    const before = axesOf(chart)[0].max
    await chart.trellis.sync.resetAll()
    const [a] = axesOf(chart)
    expect(a.cfg.length).toBe(2)
    expect(a.max).toEqual(before)
    chart.destroy()
  })
})
