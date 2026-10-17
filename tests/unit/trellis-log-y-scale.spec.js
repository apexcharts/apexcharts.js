/**
 * The shared y scale ignored `yaxis.logarithmic`: it pushed linear nice
 * bounds from 0, so each panel picked its own log floor (North at 3..9,000
 * floored at 1, South at 120..8,000 at 100) and the same value sat at
 * different heights in a scale called shared. Log axes now share decade
 * bounds from the smallest positive value across every panel.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import { split } from '../../src/modules/trellis/TrellisSplit.js'
import { resolve } from '../../src/modules/trellis/TrellisScales.js'

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

const series = [
  { name: 'S', region: 'North', data: [3, 400, 9000] },
  { name: 'S', region: 'South', data: [0, 900, 8000] },
]

describe('trellis: logarithmic shared y', () => {
  it('resolves decade bounds from the smallest positive value', () => {
    const r = split(series, { by: 'region' })
    const log = resolve(r, {}, { chartType: 'bar', yaxis: [{ logarithmic: true, logBase: 10 }] })
    expect(log.y).toMatchObject({ min: 1, max: 10000, tickAmount: 4 })
    const two = resolve(r, {}, { yaxis: [{ logarithmic: true, logBase: 2 }] })
    expect(two.y).toMatchObject({ min: 2, max: 16384 })
  })

  it("a frame's zero-based count domain keeps linear bounds", () => {
    const r = split(series, { by: 'region' })
    const h = resolve(r, {}, {
      chartType: 'bar',
      yaxis: [{ logarithmic: true }],
      yExtentOverride: { min: 0, max: 40 },
    })
    // was min 0 with tickAmount Infinity
    expect(h.y).toMatchObject({ min: 0, max: 40, tickAmount: 2 })
  })

  it('every panel labels the log ticks alike, down to the smallest', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'k', virtualize: false },
      yaxis: { logarithmic: true },
      xaxis: { categories: ['a', 'b', 'c'] },
      series: [
        { name: 'S', k: 'p', data: [0.05, 0.2, 3] },
        { name: 'S', k: 'q', data: [0.5, 1.5, 7] },
      ],
    })
    await chart.render()
    const labels = chart.trellis.panels.map((p) => {
      const g = p.chart.w.globals
      const f = p.chart.w.config.yaxis[0].labels.formatter
      return g.yAxisScale[0].result.map((v) => f(v))
    })
    expect(labels[0]).toEqual(['0.01', '0.10', '1.00', '10.00'])
    expect(labels[1]).toEqual(labels[0])
    chart.destroy()
  })

  it('every panel gets the same log domain and ticks', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 400, animations: { enabled: false } },
      trellis: { by: 'region', virtualize: false },
      yaxis: { logarithmic: true },
      xaxis: { categories: ['a', 'b', 'c'] },
      series: [
        { name: 'S', region: 'North', data: [3, 400, 9000] },
        { name: 'S', region: 'South', data: [120, 900, 8000] },
      ],
    })
    await chart.render()
    const [a, b] = chart.trellis.panels.map((p) => p.chart.w.globals)
    expect(a.minY).toBe(1)
    expect(b.minY).toBe(a.minY)
    expect(b.yAxisScale[0].result).toEqual(a.yAxisScale[0].result)
    chart.destroy()
  })
})
