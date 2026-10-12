// A numeric or datetime heatmap centres each cell on its x value. With the x
// axis ending at the first and last x, half of each edge column sat outside
// the plot and `gridRectMask` clipped it, which grid padding cannot undo.
// The axis now reaches half a cell past the data on each side.
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const DAY = 86400000
const t0 = Date.UTC(2026, 0, 5)

const cells = (chart) =>
  [...chart.el.querySelectorAll('.apexcharts-heatmap-rect')].map((r) => ({
    x: Number(r.getAttribute('x')),
    w: Number(r.getAttribute('width')),
  }))

const expectInsidePlot = (chart) => {
  const gw = chart.w.layout.gridWidth
  const cs = cells(chart)
  expect(cs.length).toBeGreaterThan(0)
  cs.forEach((c) => {
    expect(c.x).toBeGreaterThanOrEqual(-0.01)
    expect(c.x + c.w).toBeLessThanOrEqual(gw + 0.01)
  })
  return cs
}

describe('continuous-x heatmap edge columns', () => {
  for (const type of ['numeric', 'datetime']) {
    it(`${type}: first and last columns sit wholly inside the plot`, () => {
      const step = type === 'datetime' ? DAY : 1
      const x0 = type === 'datetime' ? t0 : 10
      const row = (k) =>
        Array.from({ length: 5 }, (_, i) => ({ x: x0 + i * step, y: i + k }))
      const chart = createChartWithOptions({
        chart: { type: 'heatmap', width: 600, height: 300 },
        xaxis: { type },
        series: [
          { name: 'A', data: row(0) },
          { name: 'B', data: row(3) },
        ],
      })
      const cs = expectInsidePlot(chart)
      // the columns still tile the plot edge to edge
      const gw = chart.w.layout.gridWidth
      expect(Math.min(...cs.map((c) => c.x))).toBeCloseTo(0, 3)
      expect(Math.max(...cs.map((c) => c.x + c.w))).toBeCloseTo(gw, 3)
      cs.forEach((c) => expect(c.w).toBeCloseTo(gw / 5, 3))
    })
  }

  it('lone points per series: the gap between them sets the edge room', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap', width: 600, height: 300 },
      xaxis: { type: 'datetime' },
      series: [
        { name: 'A', data: [{ x: t0, y: 3 }] },
        { name: 'B', data: [{ x: t0 + DAY, y: 6 }] },
        { name: 'C', data: [{ x: t0 + 3 * DAY, y: 6 }] },
      ],
    })
    expectInsidePlot(chart)
  })

  it('an explicit xaxis.min and max are honoured as given', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap', width: 600, height: 300 },
      xaxis: { type: 'numeric', min: 10, max: 14 },
      series: [
        {
          name: 'A',
          data: [0, 1, 2, 3, 4].map((i) => ({ x: 10 + i, y: i })),
        },
      ],
    })
    expect(chart.w.globals.minX).toBe(10)
    expect(chart.w.globals.maxX).toBe(14)
  })
})
