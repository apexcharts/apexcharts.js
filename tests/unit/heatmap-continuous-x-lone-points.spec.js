// A numeric or datetime heatmap sizes its cells by the smallest x gap. When no
// series holds two x values that gap is a 0.5 sentinel, so a one-column
// datetime heatmap drew cells half a millisecond wide and looked empty.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const DAY = 86400000
const t0 = Date.UTC(2026, 0, 5)

const widths = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-heatmap-rect')].map((r) =>
    Number(r.getAttribute('width')),
  )

describe('continuous-x heatmap without a gap inside any series', () => {
  for (const type of ['datetime', 'numeric']) {
    it(`${type}: one column is one axis unit wide`, () => {
      const x = type === 'datetime' ? t0 : 10
      const chart = createChartWithOptions({
        chart: { type: 'heatmap', width: 600, height: 300 },
        xaxis: { type },
        series: [
          { name: 'A', data: [{ x, y: 3 }] },
          { name: 'B', data: [{ x, y: 6 }] },
        ],
      })
      const ws = widths(chart)
      expect(ws.length).toBe(2)
      ws.forEach((w) => expect(w).toBeCloseTo(chart.w.layout.gridWidth / 4, 3))
    })
  }

  it('one point per series at different x: the gap between them', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap', width: 600, height: 300 },
      xaxis: { type: 'datetime' },
      series: [
        { name: 'A', data: [{ x: t0, y: 3 }] },
        { name: 'B', data: [{ x: t0 + DAY, y: 6 }] },
        { name: 'C', data: [{ x: t0 + 3 * DAY, y: 6 }] },
      ],
    })
    const g = chart.w.globals
    const dayPx = (chart.w.layout.gridWidth * DAY) / (g.maxX - g.minX)
    const ws = widths(chart)
    expect(ws.length).toBe(3)
    ws.forEach((w) => expect(w).toBeCloseTo(dayPx, 3))
  })
})
