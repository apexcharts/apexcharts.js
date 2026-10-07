import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
// The canvas renderer is an opt-in feature, not part of `entries/full.js`.
import '../../src/features/renderer-canvas.js'
import RendererController from '../../src/modules/RendererController.js'

/**
 * The canvas renderer through data-only updates.
 *
 * Every hover path on a canvas chart (heatmap cells, intersect violins, the
 * legend dimming) reaches the renderer through `w.globals.activeRenderer`.
 * That handle was reset with the per-render globals on every parse but set
 * again only by a full render, so the data-only fast path of updateSeries()
 * left it null and the tooltip was gone for good.
 */

const heatmapSeries = (bump = 0) =>
  ['A', 'B', 'C'].map((name, si) => ({
    name,
    data: Array.from({ length: 6 }, (_, i) => ({
      x: 'c' + i,
      y: ((i * 7 + si * 3) % 20) + 1 + bump,
    })),
  }))

function canvasHeatmap(chart = {}) {
  return createChartWithOptions({
    chart: {
      type: 'heatmap',
      width: 480,
      height: 320,
      renderer: 'canvas',
      ...chart,
    },
    series: heatmapSeries(),
  })
}

const fastUpdates = (chart) =>
  chart._updateStats.fast + chart._updateStats.fastWithAxes

let chart = null
afterEach(() => {
  chart?.destroy()
  chart = null
})

describe('the active renderer through data-only updates', () => {
  it('stays the canvas renderer the chart paints with', async () => {
    chart = canvasHeatmap()
    const painter = chart.ctx.renderer
    expect(painter.kind).toBe('canvas')
    expect(chart.w.globals.activeRenderer).toBe(painter)

    for (let bump = 1; bump <= 3; bump++) {
      await chart.updateSeries(heatmapSeries(bump))
      expect(fastUpdates(chart)).toBe(bump)
      expect(chart.ctx.renderer).toBe(painter)
      expect(chart.w.globals.activeRenderer).toBe(painter)
    }
  })

  it('hovers a painted cell after updates, through the plot-wide listener', async () => {
    chart = canvasHeatmap()
    const w = chart.w
    await chart.updateSeries(heatmapSeries(1))
    await chart.updateSeries(heatmapSeries(2))
    expect(fastUpdates(chart)).toBe(2)

    // jsdom lays nothing out, so the svg sits at the page's corner and the
    // plot's corner is (translateX, translateY), as TooltipUtils.plotRect
    // measures it.
    const cell = w.globals.activeRenderer.findCell(1, 4)
    const clientX = w.layout.translateX + cell.x + cell.width / 2
    const clientY = w.layout.translateY + cell.y + cell.height / 2
    const ttCtx = w.globals.tooltip
    ttCtx.lastHoverTime = 0
    w.dom.Paper.node.dispatchEvent(
      new MouseEvent('mousemove', { bubbles: true, clientX, clientY }),
    )

    expect([
      w.interact.capturedSeriesIndex,
      w.interact.capturedDataPointIndex,
    ]).toEqual([1, 4])
    const tooltipEl = ttCtx.getElTooltip()
    expect(tooltipEl.classList.contains('apexcharts-active')).toBe(true)
    expect(
      tooltipEl.querySelector('.apexcharts-tooltip-text-y-value').textContent,
    ).toBe(String(heatmapSeries(2)[1].data[4].y))
  })

  it('still repaints the series dimming after an update', async () => {
    // The legend's hover dims the other series by repainting the canvas
    // (Series.canvasRestyle). jsdom cannot resolve the series lookup the
    // legend makes first, so the bridge is driven directly here; the
    // interaction suite hovers the real legend (canvas-update-tooltip).
    chart = createChartWithOptions({
      chart: { type: 'bar', height: 300, renderer: 'canvas' },
      series: ['A', 'B', 'C'].map((name, s) => ({
        name,
        data: [10 + s, 20, 15, 30 - s],
      })),
      xaxis: { categories: ['q1', 'q2', 'q3', 'q4'] },
    })
    expect(chart.ctx.renderer.kind).toBe('canvas')
    await chart.updateSeries(
      ['A', 'B', 'C'].map((name, s) => ({ name, data: [12, 22 + s, 14, 28] })),
    )
    expect(fastUpdates(chart)).toBe(1)

    const restyle = vi.spyOn(chart.ctx.renderer, 'restyle')
    chart.ctx.series.canvasRestyle({ active: 1, opacity: 0.2 })
    expect(restyle).toHaveBeenCalledWith({ active: 1, opacity: 0.2 })
  })

  it('drops the handle when the chart is destroyed', () => {
    const c = canvasHeatmap()
    expect(c.w.globals.activeRenderer.kind).toBe('canvas')
    c.destroy()
    expect(c.w.globals.activeRenderer).toBeNull()
  })
})

describe('the fast path and the renderer selection', () => {
  it('takes a full render when a full render would pick another backend', async () => {
    // Drawn while the canvas backend is missing: SVG, with a warning.
    const factory = RendererController._rendererRegistry.get('canvas')
    RendererController.unregisterRenderer('canvas')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      chart = canvasHeatmap()
    } finally {
      RendererController.registerRenderer('canvas', factory)
      warn.mockRestore()
    }
    expect(chart.getActiveRenderer()).toBe('svg')

    // Same shape, so a data-only update, but a full render would now paint
    // to canvas: the fast path would keep repainting SVG into a chart whose
    // config asks for canvas.
    await chart.updateSeries(heatmapSeries(1))
    expect(chart._updateStats.full).toBe(1)
    expect(fastUpdates(chart)).toBe(0)
    expect(chart.getActiveRenderer()).toBe('canvas')
    expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
    expect(chart.el.querySelectorAll('.apexcharts-heatmap-rect').length).toBe(0)

    // and from there on the fast path again
    await chart.updateSeries(heatmapSeries(2))
    expect(fastUpdates(chart)).toBe(1)
    expect(chart.w.globals.activeRenderer.kind).toBe('canvas')
  })
})

describe('hover listeners on the svg across data-only updates', () => {
  // The fast path keeps the svg and wires the tooltip again. The listeners
  // the previous wiring put on the svg used to stay, each holding the tooltip
  // element the update replaced, so every update added another set.
  for (const [label, make, updated] of [
    ['a canvas heatmap', () => canvasHeatmap(), (k) => heatmapSeries(k)],
    [
      'an svg line chart',
      () =>
        createChartWithOptions({
          chart: { type: 'line', height: 300 },
          series: [{ name: 'A', data: [3, 5, 4, 6, 8] }],
        }),
      (k) => [{ name: 'A', data: [3 + k, 5, 4 + k, 6, 8] }],
    ],
  ]) {
    it(`${label}: one pointer move runs one hover handler`, async () => {
      chart = make()
      const ttCtx = chart.w.globals.tooltip
      const onHover = vi.spyOn(ttCtx, 'onSeriesHover')
      for (let k = 1; k <= 3; k++) await chart.updateSeries(updated(k))
      expect(fastUpdates(chart)).toBe(3)

      chart.w.dom.Paper.node.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: 200,
          clientY: 120,
        }),
      )
      expect(onHover).toHaveBeenCalledTimes(1)
      // and that one is wired to the live tooltip element
      expect(onHover.mock.calls[0][0].tooltipEl).toBe(ttCtx.getElTooltip())
    })
  }
})
