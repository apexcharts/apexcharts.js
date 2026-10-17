import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/renderer-canvas.js'

// CanvasGraphics.reset() sized BOTH columnar stores (markers and rect cells,
// seven typed arrays each) to the whole data length on every chart, whatever
// it draws. A 1M-point plain line allocated about 95 MB of arrays to record
// one path. The stores now pre-size only for the marks a chart can draw
// (markers for scatter/bubble or markers.size > 0, cells for heatmap) and
// grow on demand for the rest, such as the dots beside null points.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

const N = 400
const data = Array.from({ length: N }, (_, i) => (i * 7) % 23)
const g = (c) => c.ctx.renderer._g

describe('canvas store sizing', () => {
  it('does not pre-size the stores for a plain line', () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      series: [{ name: 'a', data }],
    })
    expect(chart.ctx.renderer.kind).toBe('canvas')
    expect(g(chart).markerCount()).toBe(0)
    expect(g(chart)._mcap).toBeLessThan(N)
    expect(g(chart)._crcap).toBeLessThan(N)
  })

  it('pre-sizes the marker store when markers draw, not the cell store', () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      markers: { size: 3 },
      series: [{ name: 'a', data }],
    })
    expect(g(chart).markerCount()).toBe(N)
    expect(g(chart)._mcap).toBeGreaterThanOrEqual(N)
    expect(g(chart)._crcap).toBeLessThan(N)
  })

  it('grows on demand for the dots beside nulls', () => {
    const gappy = data.map((v, i) => (i % 2 ? null : v))
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      series: [{ name: 'a', data: gappy }],
    })
    // every other point is isolated: each gets its own dot
    expect(g(chart).markerCount()).toBeGreaterThanOrEqual(N / 2)
  })
})
