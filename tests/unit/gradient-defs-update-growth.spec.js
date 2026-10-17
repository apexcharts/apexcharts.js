import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Guard for the gradient growth the 2026-10 bench measured (every
// updateSeries left one more linearGradient per gradient-filled series in
// <defs>, about 1,200 nodes per update on a 300-series area chart). The
// fast path sweeps unreferenced defs since 8a6613df3; these pin the count
// flat, the colours current and every url(#id) resolvable.

const series = (k, colors) =>
  ['A', 'B', 'C', 'D'].map((name, s) => ({
    name,
    ...(colors ? { color: colors[s] } : {}),
    data: [1, 2, 3, 4, 5, 6].map((v) => ((v * 7 + s * 3 + k) % 17) + 1),
  }))

const gradients = (chart) =>
  chart.w.dom.Paper.node.querySelectorAll('linearGradient, radialGradient')

const dangling = (chart) => {
  const svg = chart.w.dom.Paper.node
  return [...svg.querySelectorAll('[fill^=url],[stroke^=url]')]
    .map((n) =>
      (n.getAttribute('fill') || n.getAttribute('stroke')).slice(5, -1),
    )
    .filter((id) => !svg.querySelector(`[id="${id}"]`))
}

describe('gradient fills across updateSeries', () => {
  for (const type of ['area', 'bar']) {
    it(`${type}: the gradient count stays flat`, async () => {
      const chart = createChartWithOptions({
        chart: { type },
        fill: { type: 'gradient' },
        series: series(0),
      })
      const before = gradients(chart).length
      expect(before).toBeGreaterThan(0)
      for (let k = 1; k <= 20; k++) await chart.updateSeries(series(k))
      expect(gradients(chart).length).toBe(before)
      expect(dangling(chart)).toEqual([])
      chart.destroy()
    })
  }

  it('a colour change between updates paints the new colours', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'area' },
      fill: { type: 'gradient' },
      series: series(0, ['#ff0000', '#00ff00', '#0000ff', '#ffff00']),
    })
    const before = gradients(chart).length
    await chart.updateSeries(
      series(1, ['#112233', '#445566', '#778899', '#aabbcc']),
    )
    const svg = chart.w.dom.Paper.node
    const area = svg.querySelector('.apexcharts-area-series .apexcharts-area')
    const id = area.getAttribute('fill').slice(5, -1)
    const stop = svg.querySelector(`[id="${id}"] stop`)
    expect(stop.getAttribute('stop-color')).toContain('17,34,51')
    expect(gradients(chart).length).toBe(before)
    expect(dangling(chart)).toEqual([])
    chart.destroy()
  })
})
