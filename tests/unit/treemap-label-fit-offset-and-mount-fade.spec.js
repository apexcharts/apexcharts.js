import { describe, it, expect, vi } from 'vitest'
import './__mocks__/ResizeObserver.js'
import ApexCharts from '../../src/entries/standard.js'
import Graphics from '../../src/modules/Graphics.js'
import Treemap from '../../src/charts/Treemap.js'
import { createChartWithOptions } from './utils/utils.js'

// Treemap labels were fitted and placed unlike the way they are drawn:
// dataLabels.offsetX/offsetY moved treemap and heatmap labels twice as far
// as configured; bold tile labels and branch headers were measured at
// regular weight, so they crossed their tile or strip edge before turning or
// clipping; and on first render every label sat at full strength in its
// final spot while its tile was still growing in.

const ONE = [{ data: [{ x: 'only', y: 10 }] }]

const labelX = (type, extra = {}) => {
  const c = createChartWithOptions({
    chart: { type, height: 400, width: 600 },
    series: type === 'heatmap' ? [{ name: 'r', data: [{ x: 'only', y: 10 }] }] : ONE,
    ...extra,
  })
  const t = c.el.querySelector('.apexcharts-data-labels text')
  return [parseFloat(t.getAttribute('x')), parseFloat(t.getAttribute('y'))]
}

describe('treemap labels', () => {
  it.each(['treemap', 'heatmap'])('%s applies dataLabels offsets once', (type) => {
    const [x0, y0] = labelX(type)
    const [x, y] = labelX(type, { dataLabels: { offsetX: 20, offsetY: -8 } })
    expect(x - x0).toBeCloseTo(20, 0)
    expect(y - y0).toBeCloseTo(-8, 0)
  })

  it('measures tile labels at their drawn family and weight', () => {
    let inside = false
    const seen = []
    const rot = Treemap.prototype.rotateToFitLabel
    const rects = Graphics.prototype.getTextRects
    const s1 = vi.spyOn(Treemap.prototype, 'rotateToFitLabel').mockImplementation(function (...a) {
      inside = true
      try {
        return rot.apply(this, a)
      } finally {
        inside = false
      }
    })
    const s2 = vi.spyOn(Graphics.prototype, 'getTextRects').mockImplementation(function (...a) {
      if (inside) seen.push(a)
      return rects.apply(this, a)
    })
    createChartWithOptions({
      chart: { type: 'treemap', height: 400, width: 600 },
      series: [{ data: [{ x: 'Alpha', y: 10 }, { x: 'Beta', y: 20 }] }],
      dataLabels: { style: { fontFamily: 'Georgia' } },
    })
    s1.mockRestore()
    s2.mockRestore()
    expect(seen.length).toBeGreaterThan(0)
    for (const a of seen) {
      expect(a[2]).toBe('Georgia')
      expect(String(a[5])).toBe('600')
    }
  })

  it('clips branch headers at their drawn family and weight', () => {
    const calls = []
    const orig = Graphics.prototype.getTextBasedOnMaxWidth
    const sp = vi.spyOn(Graphics.prototype, 'getTextBasedOnMaxWidth').mockImplementation(function (o) {
      calls.push(o)
      return orig.call(this, o)
    })
    createChartWithOptions({
      chart: { type: 'treemap', height: 400, width: 600 },
      series: [{ data: [{ x: 'Tech', children: [{ x: 'a', y: 3 }, { x: 'b', y: 2 }] }, { x: 'Oil', children: [{ x: 'c', y: 4 }] }] }],
    })
    sp.mockRestore()
    const tech = calls.find((o) => o.text === 'Tech')
    expect(String(tech.fontWeight)).toBe('600')
    expect(tech.fontFamily).toBeTruthy()
  })

  it('fades a label in with its tile on first render', async () => {
    document.body.innerHTML = '<div id="chart"></div>'
    const c = new ApexCharts(document.querySelector('#chart'), {
      chart: { type: 'treemap', height: 400, width: 600, animations: { enabled: true, speed: 800 } },
      series: [{ data: [{ x: 'Alpha', y: 10 }, { x: 'Beta', y: 20 }] }],
    })
    c.render()
    await new Promise((r) => setTimeout(r, 0))
    const rect = c.el.querySelector('.apexcharts-treemap-rect')
    const label = c.el.querySelector('.apexcharts-treemap .apexcharts-data-labels')
    // the tile is still growing in
    expect(parseFloat(rect.getAttribute('width'))).toBeLessThan(c.w.layout.gridWidth)
    expect(parseFloat(label.getAttribute('opacity'))).toBeLessThan(1)
    c.destroy()
  })
})
