import { describe, it, expect, afterEach, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import RendererController from '../../src/modules/RendererController.js'
import '../../src/features/renderer-canvas.js'

// Two renderer selection defects:
// - a renderer:'auto' chart that dropped back below rendererThreshold kept
//   the canvas renderer (display list and backing bitmap) alive until the
//   chart was destroyed;
// - renderer:'canvas' without the renderer-canvas feature repeated the same
//   console warning on every update.

let chart = null
afterEach(() => {
  vi.restoreAllMocks()
  chart?.destroy()
  chart = null
})

const pts = (n) => Array.from({ length: n }, (_, i) => (i * 7) % 50)

describe('renderer fallback lifecycle', () => {
  it('frees the canvas renderer when auto falls back to SVG, and rebuilds it', async () => {
    chart = createChartWithOptions({
      chart: {
        type: 'scatter',
        width: 500,
        height: 300,
        renderer: 'auto',
        rendererThreshold: 100,
      },
      series: [{ data: pts(400) }],
    })
    const rc = chart.rendererController
    expect(rc.getActiveKind()).toBe('canvas')
    const canvas = rc._instances.canvas
    const destroy = vi.spyOn(canvas, 'destroy')

    await chart.updateSeries([{ data: pts(10) }])
    expect(rc.getActiveKind()).toBe('svg')
    expect(destroy).toHaveBeenCalledTimes(1)
    expect(rc._instances.canvas).toBeUndefined()

    await chart.updateSeries([{ data: pts(400) }])
    expect(rc.getActiveKind()).toBe('canvas')
    expect(rc._instances.canvas).toBeTruthy()
    expect(rc._instances.canvas).not.toBe(canvas)
  })

  it('warns once about a missing canvas renderer, not on every render', async () => {
    const registry = RendererController._rendererRegistry
    const factory = registry.get('canvas')
    registry.delete('canvas')
    try {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      chart = createChartWithOptions({
        chart: { type: 'line', width: 400, height: 300, renderer: 'canvas' },
        series: [{ data: [1, 2, 3] }],
      })
      await chart.updateOptions({ title: { text: 'a' } })
      await chart.updateOptions({ title: { text: 'b' } })
      expect(chart.rendererController.getActiveKind()).toBe('svg')
      const n = warn.mock.calls.filter((c) =>
        String(c[0]).includes('renderer-canvas'),
      ).length
      expect(n).toBe(1)
    } finally {
      registry.set('canvas', factory)
    }
  })

  it('warns once about a canvas-unsupported fill, not on every render', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    chart = createChartWithOptions({
      chart: { type: 'area', width: 400, height: 300, renderer: 'canvas' },
      fill: { type: 'gradient' },
      series: [{ data: [1, 2, 3] }],
    })
    await chart.updateOptions({ title: { text: 'a' } })
    await chart.updateOptions({ title: { text: 'b' } })
    expect(chart.rendererController.getActiveKind()).toBe('svg')
    const n = warn.mock.calls.filter((c) =>
      String(c[0]).includes('falling back to SVG'),
    ).length
    expect(n).toBe(1)
  })
})
