/**
 * Trellis state across the host lifecycle: a destroy() that lands while the
 * first panels mount, and a panel-only updateOptions under a synced zoom
 * (the domains are not restated, so every panel, the sync record and the
 * panels' zoomed flag keep agreeing).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
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

const day = (i) => Date.UTC(2025, 0, 1) + i * 86400000
const rows = (base) => Array.from({ length: 4 }, (_, i) => [day(i), base + i])
const series = (regions, k = 1) =>
  regions.flatMap((region, j) => [
    { name: 'Revenue', region, data: rows((10 + j) * k) },
    { name: 'Cost', region, data: rows((5 + j) * k) },
  ])

function mk(extra = {}, s = series(['North', 'South'])) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const chart = new ApexCharts(el, {
    chart: { type: 'line', height: 400, animations: { enabled: false } },
    trellis: { by: 'region', virtualize: false },
    series: s,
    xaxis: { type: 'datetime' },
    ...extra,
  })
  return { chart, el }
}

describe('destroy() while the first panels mount (p2-trellis-1)', () => {
  it('render() settles without an error and nothing is wired after teardown', async () => {
    const { chart, el } = mk()
    const t = chart.trellis
    const p = chart.render()
    chart.destroy()
    let err = null
    try {
      await p
    } catch (e) {
      err = e
    }
    expect(err).toBe(null)
    expect(t._mounted).toBe(false)
    expect(el.querySelector('.apexcharts-trellis')).toBe(null)
    expect(t.chrome.elLegend).toBe(null)
    expect(Apex._chartInstances).toHaveLength(0)
  })
})

describe('a panel-only updateOptions keeps the synced zoom (p2-trellis-4)', () => {
  it('colors after a zoom: every panel, the sync record and the zoomed flag agree', async () => {
    const { chart } = mk()
    await chart.render()
    const t = chart.trellis
    const a = day(1)
    const b = day(2)
    t.panels[0].chart.zoomX(a, b)
    await new Promise((r) => setTimeout(r, 20))
    t.panels.forEach((p) => expect(p.chart.w.globals.minX).toBe(a))
    expect(t.sync.currentWindow.x).toEqual({ min: a, max: b })

    await chart.updateOptions({ colors: ['#ff0000'] })
    t.panels.forEach((p) => {
      expect(p.chart.w.globals.minX).toBe(a)
      expect(p.chart.w.globals.maxX).toBe(b)
    })
    expect(t.panels[0].chart.w.globals.colors[0]).toBe('#ff0000')
    expect(t.panels[0].chart.w.interact.zoomed).toBe(true)
    expect(t.sync.currentWindow.x).toEqual({ min: a, max: b })
    chart.destroy()
  })

  it('an autoscaled y window survives a tooltip change too', async () => {
    const { chart } = mk({
      chart: {
        type: 'line',
        height: 400,
        animations: { enabled: false },
        zoom: { autoScaleYaxis: true },
      },
    })
    await chart.render()
    const t = chart.trellis
    t.panels[0].chart.zoomX(day(2), day(3))
    await new Promise((r) => setTimeout(r, 20))
    const y = t.sync.currentWindow.y
    expect(y).toBeTruthy()

    await chart.updateOptions({ tooltip: { shared: false } })
    t.panels.forEach((p) => {
      expect(p.chart.w.config.yaxis[0].min).toBe(y.min)
      expect(p.chart.w.config.yaxis[0].max).toBe(y.max)
    })
    chart.destroy()
  })
})
