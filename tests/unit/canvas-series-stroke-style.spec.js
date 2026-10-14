import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/renderer-canvas.js'

// On the canvas renderer every series line painted solid with butt caps:
// stroke.dashArray (and a plugin's dash claim) and stroke.lineCap only
// reached the SVG path, because the canvas series command never recorded
// the dash and the line, bar and radar callers spelt the cap option
// `strokeLineCap` where renderPaths reads `strokeLinecap`.

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

const seriesPaths = (c) =>
  c.ctx.renderer._g._list.filter(
    (cmd) => cmd.tag === 'path' && cmd.stroke && cmd.stroke !== 'none',
  )

describe('canvas series stroke style', () => {
  it('records the per-series stroke.dashArray', () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      stroke: { dashArray: [6, 0] },
      series: [
        { name: 'a', data: [1, 4, 2, 5, 3] },
        { name: 'b', data: [2, 3, 4, 1, 2] },
      ],
    })
    expect(chart.ctx.renderer.kind).toBe('canvas')
    const paths = seriesPaths(chart)
    expect(paths.find((c) => c.si === 0).strokeDash).toBe(6)
    expect(paths.find((c) => c.si === 1).strokeDash).toBe(0)
  })

  it('records a scalar stroke.dashArray on every series', () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300, renderer: 'canvas' },
      stroke: { dashArray: 4 },
      series: [
        { name: 'a', data: [1, 4, 2, 5, 3] },
        { name: 'b', data: [2, 3, 4, 1, 2] },
      ],
    })
    const paths = seriesPaths(chart)
    expect(paths.length).toBeGreaterThan(1)
    expect(paths.every((c) => c.strokeDash === 4)).toBe(true)
  })

  it.each(['line', 'bar'])('carries stroke.lineCap on a %s series', (type) => {
    chart = createChartWithOptions({
      chart: { type, width: 500, height: 300, renderer: 'canvas' },
      stroke: { lineCap: 'round' },
      series: [{ name: 'a', data: [1, 4, 2, 5, 3] }],
    })
    const s0 = seriesPaths(chart).find((c) => c.si === 0)
    expect(s0).toBeTruthy()
    expect(s0.lineCap).toBe('round')
  })

  it('keeps the SVG series linecap from stroke.lineCap', () => {
    chart = createChartWithOptions({
      chart: { type: 'line', width: 500, height: 300 },
      stroke: { lineCap: 'square' },
      series: [{ name: 'a', data: [1, 4, 2, 5, 3] }],
    })
    const p = chart.w.dom.baseEl.querySelector('.apexcharts-line')
    expect(p.getAttribute('stroke-linecap')).toBe('square')
  })
})
