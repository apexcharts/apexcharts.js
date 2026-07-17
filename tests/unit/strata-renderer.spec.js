import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import ApexCharts from '../../src/entries/full.js'
import RendererController from '../../src/modules/RendererController.js'

// Strata P1: renderer interface + selection. The canvas backend is not built
// yet (P2), so real usage always resolves 'svg'; these tests exercise the
// selection engine + SVG adapter, and register a STUB canvas renderer to prove
// the registry mechanism P2 plugs into.

function chartOf(chartExtra = {}, { n = 5, type = 'line', top = {} } = {}) {
  const data = Array.from({ length: n }, (_, i) => [i, (i * 7) % 50])
  return createChartWithOptions({
    chart: {
      type,
      animations: { enabled: false },
      toolbar: { show: false },
      ...chartExtra,
    },
    legend: { show: false },
    series: [{ name: 'A', data }],
    xaxis: { type: 'numeric' },
    ...top,
  })
}

// ---------------------------------------------------------------------------
// These run FIRST, before any canvas renderer is registered.
// ---------------------------------------------------------------------------

describe('Strata: defaults + fallback (no canvas renderer bundled)', () => {
  // full.js now bundles the real canvas renderer (Strata P2), which registers
  // itself on import. These tests exercise the NOT-bundled fallback path, so
  // temporarily remove it, then restore for the later blocks.
  let savedCanvasFactory
  beforeAll(() => {
    savedCanvasFactory = RendererController._rendererRegistry.get('canvas')
    RendererController._rendererRegistry.delete('canvas')
  })
  afterAll(() => {
    if (savedCanvasFactory) {
      RendererController._rendererRegistry.set('canvas', savedCanvasFactory)
    }
  })

  it('defaults to the SVG renderer', () => {
    const chart = chartOf()
    expect(chart.getActiveRenderer()).toBe('svg')
    expect(chart.renderer.kind).toBe('svg')
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-series').length,
    ).toBeGreaterThanOrEqual(1)
    chart.destroy()
  })

  it("renderer:'auto' with many marks falls back to SVG silently when canvas is absent", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = chartOf(
      { renderer: 'auto', rendererThreshold: 10 },
      { n: 40, type: 'scatter' },
    )
    expect(chart.getActiveRenderer()).toBe('svg')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
    chart.destroy()
  })

  it("renderer:'canvas' warns and falls back to SVG when canvas is absent", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = chartOf({ renderer: 'canvas' })
    expect(chart.getActiveRenderer()).toBe('svg')
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
    chart.destroy()
  })

  it('exposes the public statics/methods', () => {
    expect(typeof ApexCharts.registerRenderer).toBe('function')
    const chart = chartOf()
    expect(typeof chart.getActiveRenderer).toBe('function')
    chart.destroy()
  })
})

describe('Strata: SVG adapter delegates to Graphics', () => {
  it('primitives return real SVG nodes; capabilities match SVG', () => {
    const chart = chartOf()
    const r = chart.renderer
    expect(r.group({ class: 'x' }).node.tagName).toBe('g')
    expect(r.drawCircle(5, { cx: 1, cy: 2 }).node.tagName).toBe('circle')
    expect(r.drawPath({ d: 'M0 0 L1 1', fill: 'none' }).node.tagName).toBe(
      'path',
    )
    expect(r.supports('gradientFill')).toBe(true)
    expect(r.hitTest(0, 0)).toBeNull()
    expect(r.toBitmap()).toBeNull()
    chart.destroy()
  })
})

// ---------------------------------------------------------------------------
// From here on a stub canvas renderer is registered (persists in the static
// registry). P1 does not route emit through it, so pixels stay SVG.
// ---------------------------------------------------------------------------

describe('Strata: selection with a registered canvas renderer', () => {
  beforeAll(() => {
    ApexCharts.registerRenderer('canvas', (w, ctx) => ({
      kind: 'canvas',
      beginSeries() {},
      present() {
        return null
      },
      clear() {},
      group: (a) => ctx.graphics.group(a),
      drawPath: (o) => ctx.graphics.drawPath(o),
      drawLine: (...a) => ctx.graphics.drawLine(...a),
      drawRect: (...a) => ctx.graphics.drawRect(...a),
      drawCircle: (r, a) => ctx.graphics.drawCircle(r, a),
      drawText: (o) => ctx.graphics.drawText(o),
      // P2 routes series emit through the active renderer, so a registered
      // 'canvas' backend must return real handles. This stub delegates to SVG
      // (present() → null tells plotChartType to keep the SVG-emitted marks).
      renderPaths: (o) => ctx.graphics.renderPaths(o),
      drawMarker: (x, y, o) => ctx.graphics.drawMarker(x, y, o),
      supports: () => true,
      hitTest: () => null,
      restyle() {},
      toBitmap: () => null,
      destroy() {},
    }))
  })

  it("renderer:'canvas' selects canvas without warning", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = chartOf({ renderer: 'canvas' })
    expect(chart.getActiveRenderer()).toBe('canvas')
    expect(warn).not.toHaveBeenCalled()
    // P1 does not swap emit sites, so the chart still renders as SVG DOM
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-series').length,
    ).toBeGreaterThanOrEqual(1)
    warn.mockRestore()
    chart.destroy()
  })

  it("renderer:'auto' picks canvas above threshold, SVG below (mark-count heuristic)", () => {
    const hi = chartOf(
      { renderer: 'auto', rendererThreshold: 10 },
      { n: 40, type: 'scatter' },
    )
    expect(hi.getActiveRenderer()).toBe('canvas')
    hi.destroy()

    const lo = chartOf(
      { renderer: 'auto', rendererThreshold: 10 },
      { n: 5, type: 'line' },
    ) // bare line, markers off → few marks
    expect(lo.getActiveRenderer()).toBe('svg')
    lo.destroy()
  })

  it('a canvas-unsupported feature (pattern fill) forces SVG even when canvas is requested', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const chart = chartOf(
      { renderer: 'canvas' },
      { n: 40, type: 'scatter', top: { fill: { type: 'pattern' } } },
    )
    expect(chart.getActiveRenderer()).toBe('svg')
    warn.mockRestore()
    chart.destroy()
  })

  it('renderer kind is stable across updateSeries', async () => {
    const chart = chartOf(
      { renderer: 'auto', rendererThreshold: 10 },
      { n: 40, type: 'scatter' },
    )
    expect(chart.getActiveRenderer()).toBe('canvas')
    await chart.updateSeries(
      [{ name: 'A', data: Array.from({ length: 40 }, (_, i) => [i, i % 30]) }],
      false,
    )
    expect(chart.getActiveRenderer()).toBe('canvas')
    chart.destroy()
  })
})
