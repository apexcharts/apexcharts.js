// The canvas renderer paints markers with no node to hover: the renderer's
// hit test finds the one painted last, and the series painted under it went
// unlisted the way they did on SVG (apexcharts.js#4778). The painted
// positions (pointsArray) stand in for the marker nodes.
import { describe, it, expect, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/features/renderer-canvas.js'

let chart
afterEach(() => {
  chart?.destroy()
  chart = null
})

function mount(events) {
  chart = createChartWithOptions({
    chart: {
      type: 'line',
      width: 600,
      height: 320,
      renderer: 'canvas',
      events: {
        markerClick: (_e, _c, cfg) => events.push(cfg),
      },
    },
    series: [
      { name: 'A', data: [1, 5, 3] },
      { name: 'B', data: [2, 5, 4] },
      { name: 'C', data: [3, 2, 3] },
    ],
    xaxis: { categories: ['a', 'b', 'c'] },
    markers: { size: 5 },
    tooltip: { shared: false, intersect: true },
  })
  return chart
}

function hoverPainted(i, j, type = 'mousemove') {
  const ttCtx = chart.w.globals.tooltip
  const m = chart.ctx.renderer.findMarker(i, j)
  ttCtx.intersect.handlePaintedMarkerTooltip({
    e: { type, target: chart.el },
    opt: { ttItems: ttCtx.ttItems },
    marker: { i, j, cx: m.x, cy: m.y, size: m.size },
  })
}

function rows() {
  return [...chart.el.querySelectorAll('.apexcharts-tooltip-series-group')]
    .filter((r) => r.isConnected && r.style.display !== 'none')
    .sort((a, b) => (+a.style.order || 0) - (+b.style.order || 0))
    .map((r) => r.querySelector('.apexcharts-tooltip-text').textContent)
}

describe('painted markers drawn at one spot', () => {
  it('lists each series painted there, and markerClick names them', () => {
    const events = []
    mount(events)
    expect(chart.ctx.renderer.kind).toBe('canvas')

    hoverPainted(1, 1)
    expect(rows()).toEqual(['A: 5', 'B: 5'])

    hoverPainted(1, 1, 'mouseup')
    expect(events.at(-1).seriesIndex).toBe(1)
    expect(events.at(-1).dataPointIndex).toBe(1)
    expect(
      events.at(-1).coincident.map((p) => [p.seriesIndex, p.dataPointIndex]),
    ).toEqual([
      [0, 1],
      [1, 1],
    ])

    // A at 'c' is 3, so is C; B is 4
    hoverPainted(1, 2)
    expect(rows()).toEqual(['B: 4'])
    hoverPainted(2, 2)
    expect(rows()).toEqual(['A: 3', 'C: 3'])
  })
})
