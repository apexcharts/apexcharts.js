/**
 * Two shared-y-scale defects:
 * - the union extent read every datum through the DOMINANT data form, so a
 *   plain-number reference series (100, 200) beside [x, y] panel series was
 *   left out, the axis became about 5..6, and the reference line drew far
 *   above the plot. Each datum is now read by its own shape.
 * - niceBounds kept the float noise of `n * step` (0.6000000000000001), and
 *   the label decimals were counted from it, so 2-decimal rates printed
 *   "0.2000". The bounds are now rounded to the step's decimals, which come
 *   back with them for the label formatter, on render and on updateSeries.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import '../../src/features/trellis.js'
import { split } from '../../src/modules/trellis/TrellisSplit.js'
import { resolve, niceBounds } from '../../src/modules/trellis/TrellisScales.js'

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

describe('trellis: y extent reads every datum by its own shape', () => {
  it('a plain reference series beside [x, y] panel series is on the axis', () => {
    const r = split(
      [
        { name: 'A', k: 'p', data: [[1, 5], [2, 6]] },
        { name: 'A', k: 'q', data: [[1, 5.5], [2, 5.8]] },
        { name: 'Target', data: [100, 200] },
      ],
      { by: 'k' },
    )
    const s = resolve(r, {}, { chartType: 'line' })
    expect(s.y.max).toBeGreaterThanOrEqual(200)
  })
})

describe('trellis: nice bounds carry no float noise', () => {
  it('rounds the bounds and returns the step decimals', () => {
    expect(niceBounds(0.13, 0.57)).toEqual({ min: 0, max: 0.6, tickAmount: 3, decimals: 1 })
    expect(niceBounds(0, 0.3)).toEqual({ min: 0, max: 0.3, tickAmount: 3, decimals: 1 })
    expect(niceBounds(3, 97, 4)).toEqual({ min: 0, max: 100, tickAmount: 4, decimals: 0 })
  })

  it('2-decimal rates print 2 decimals on render and after updateSeries', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const rates = (a, b) => [
      { name: 'S', k: 'p', data: [a, b] },
      { name: 'S', k: 'q', data: [b, a] },
    ]
    const chart = new ApexCharts(el, {
      chart: { type: 'line', height: 300, animations: { enabled: false } },
      trellis: { by: 'k', virtualize: false },
      xaxis: { categories: ['a', 'b'] },
      series: rates(10, 25),
    })
    await chart.render()
    const label = () => chart.trellis.panels[0].chart.w.config.yaxis[0].labels.formatter(0.2)
    expect(label()).toBe('0')
    await chart.updateSeries(rates(0.13, 0.57))
    expect(label()).toBe('0.20')
    expect(chart.trellis.panels[0].chart.w.config.yaxis[0].max).toBe(0.6)
    chart.destroy()

    const el2 = document.createElement('div')
    document.body.appendChild(el2)
    const fresh = new ApexCharts(el2, {
      chart: { type: 'line', height: 300, animations: { enabled: false } },
      trellis: { by: 'k', virtualize: false },
      xaxis: { categories: ['a', 'b'] },
      series: rates(0.13, 0.57),
    })
    await fresh.render()
    expect(fresh.trellis.panels[1].chart.w.config.yaxis[0].labels.formatter(0.2)).toBe('0.20')
    fresh.destroy()
  })
})
