import { it, expect, afterEach } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'

// setupBrushHandler injects zoomed/scrolled closures into the TARGET chart's
// config. They used to outlive the brush: the closure then called into a null
// updateHelpers on every pan frame, and a remounted brush skipped its own
// wiring because a function was already present.

const data = Array.from({ length: 20 }, (_, i) => [Date.UTC(2026, 0, 1 + i), i])
const brushOpts = () => ({
  chart: {
    id: 'brtd-brush',
    type: 'area',
    width: 500,
    height: 100,
    animations: { enabled: false },
    brush: { enabled: true, target: 'brtd-target' },
    selection: { enabled: true },
  },
  series: [{ data }],
  xaxis: { type: 'datetime' },
})
const targetOpts = (events = {}) => ({
  chart: {
    id: 'brtd-target',
    type: 'line',
    width: 500,
    height: 200,
    animations: { enabled: false },
    events,
  },
  series: [{ data }],
  xaxis: { type: 'datetime' },
})

afterEach(() => {
  document.body.innerHTML = ''
})

it('a remounted brush re-wires the target and the destroyed one leaves nothing behind', async () => {
  document.body.innerHTML = '<div id="t"></div><div id="b"></div>'
  const target = new ApexCharts(document.querySelector('#t'), targetOpts())
  await target.render()
  const b1 = new ApexCharts(document.querySelector('#b'), brushOpts())
  await b1.render()
  const z1 = target.w.config.chart.events.zoomed
  expect(typeof z1).toBe('function')
  b1.destroy()
  expect(target.w.config.chart.events.zoomed).toBeUndefined()
  expect(target.w.config.chart.events.scrolled).toBeUndefined()
  expect(target.w.globals.brushSource).toBeUndefined()

  const b2 = new ApexCharts(document.querySelector('#b'), brushOpts())
  await b2.render()
  const z2 = target.w.config.chart.events.zoomed
  const s2 = target.w.config.chart.events.scrolled
  expect(z2).not.toBe(z1)
  expect(target.w.globals.brushSource).toBe(b2)
  // Firing the target's handlers (what pan/zoom do) must not throw.
  const args = { xaxis: { min: data[2][0], max: data[8][0] } }
  expect(() => z2(target, args)).not.toThrow()
  expect(() => s2(target, args)).not.toThrow()

  target.destroy()
  b2.destroy()
})

it("a brush never replaces or removes the target's own handlers", async () => {
  document.body.innerHTML = '<div id="t"></div><div id="b"></div>'
  const zoomed = () => {}
  const target = new ApexCharts(
    document.querySelector('#t'),
    targetOpts({ zoomed }),
  )
  await target.render()
  const b = new ApexCharts(document.querySelector('#b'), brushOpts())
  await b.render()
  expect(target.w.config.chart.events.zoomed).toBe(zoomed)
  expect(typeof target.w.config.chart.events.scrolled).toBe('function')
  b.destroy()
  expect(target.w.config.chart.events.zoomed).toBe(zoomed)
  expect(target.w.config.chart.events.scrolled).toBeUndefined()
  target.destroy()
})
