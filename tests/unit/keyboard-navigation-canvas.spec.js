import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
// The canvas renderer is an opt-in feature, not part of `entries/standard.js`.
import '../../src/features/renderer-canvas.js'

/**
 * Keyboard focus on a heatmap whose cells are painted to canvas. There is no
 * <rect> per cell, so every step that found the focused cell by its node (the
 * tooltip placement, the synthetic pointer, the focus stroke) found nothing:
 * the tooltip opened wherever it last was and no cell looked focused. The
 * renderer keeps the box it painted each cell in, and focus reads it there.
 */

const series = ['A', 'B', 'C'].map((name, si) => ({
  name,
  data: Array.from({ length: 6 }, (_, i) => ({
    x: 'c' + i,
    y: ((i * 7 + si * 3) % 20) + 1,
  })),
}))

function canvasHeatmap({ renderer = 'canvas' } = {}) {
  return createChartWithOptions({
    chart: {
      type: 'heatmap',
      width: 480,
      height: 320,
      renderer,
      accessibility: {
        enabled: true,
        keyboard: { enabled: true, navigation: { enabled: true } },
      },
    },
    series,
  })
}

// Where the heatmap lays cell (i, j) out, plot-local: equal columns, and equal
// rows with series 0 at the bottom. Worked out from the layout rather than
// asked of the renderer, so it also holds the renderer to it.
function cellBox(w, i, j) {
  const width = w.layout.gridWidth / w.globals.dataPoints
  const height = w.layout.gridHeight / series.length
  return {
    x: j * width,
    y: (series.length - 1 - i) * height,
    width,
    height,
  }
}

function fireKey(chart, key) {
  chart.el
    .querySelector('.apexcharts-svg')
    .dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
    )
}

function focusSvg(chart) {
  chart.el
    .querySelector('.apexcharts-svg')
    .dispatchEvent(new FocusEvent('focus', { bubbles: true }))
}

function blurSvg(chart) {
  chart.el
    .querySelector('.apexcharts-svg')
    .dispatchEvent(new FocusEvent('blur', { bubbles: true }))
}

describe('KeyboardNavigation on a canvas heatmap', () => {
  it('paints the cells, so there is no node per cell to focus', () => {
    const chart = canvasHeatmap()
    expect(chart.w.globals.activeRenderer?.kind).toBe('canvas')
    expect(chart.el.querySelectorAll('.apexcharts-heatmap-rect').length).toBe(0)
  })

  it('finds a painted cell by series and data point', () => {
    const chart = canvasHeatmap()
    const r = chart.w.globals.activeRenderer
    const cell = r.findCell(1, 2)
    expect(cell).toMatchObject({ seriesIndex: 1, dataPointIndex: 2 })
    const box = cellBox(chart.w, 1, 2)
    expect(box.width).toBeGreaterThan(0)
    for (const k of ['x', 'y', 'width', 'height']) {
      expect(cell[k]).toBeCloseTo(box[k])
    }
    // the same cell the pointer resolves at its centre
    const hit = r.hitTest(cell.x + cell.width / 2, cell.y + cell.height / 2)
    expect(hit).toMatchObject({ seriesIndex: 1, dataPointIndex: 2 })
    expect(r.findCell(7, 0)).toBeNull()
  })

  it('places the tooltip around the focused cell, as the pointer does', () => {
    const chart = canvasHeatmap()
    const w = chart.w
    const ttCtx = w.globals.tooltip
    const place = vi.spyOn(ttCtx.tooltipPosition, 'placeAroundCell')

    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    fireKey(chart, 'ArrowRight')
    fireKey(chart, 'ArrowUp')

    const kn = chart.ctx.keyboardNavigation
    const { seriesIndex: i, dataPointIndex: j } = kn
    expect([i, j]).toEqual([1, 2])
    const cell = cellBox(w, i, j)

    expect(place).toHaveBeenCalled()
    const [box, plot, opts] = place.mock.calls.at(-1)
    // jsdom lays nothing out, so the svg sits at the wrap's corner and the
    // plot's corner is (translateX, translateY), as the pointer path measures
    // it (TooltipUtils.plotRect).
    const top = w.layout.translateY
    const left = w.layout.translateX
    expect(box.top).toBeCloseTo(top + cell.y)
    expect(box.bottom).toBeCloseTo(top + cell.y + cell.height)
    expect(box.left).toBeCloseTo(left + cell.x)
    expect(box.right).toBeCloseTo(left + cell.x + cell.width)
    expect(plot.top).toBe(top)
    expect(plot.bottom).toBe(top + w.layout.gridHeight)
    expect(opts.el).toBeNull()

    const tooltipEl = ttCtx.getElTooltip()
    expect(tooltipEl.classList.contains('apexcharts-active')).toBe(true)
    expect(tooltipEl.dataset.placement).toBeTruthy()
    expect(tooltipEl.style.left).not.toBe('')
  })

  it('points the synthetic pointer at the focused cell, not the chart centre', () => {
    const chart = canvasHeatmap()
    const w = chart.w
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    fireKey(chart, 'ArrowUp')
    fireKey(chart, 'ArrowUp')

    const kn = chart.ctx.keyboardNavigation
    const cell = cellBox(w, kn.seriesIndex, kn.dataPointIndex)
    const e = w.globals.tooltip.e
    expect(e.clientX).toBeCloseTo(w.layout.translateX + cell.x + cell.width / 2)
    expect(e.clientY).toBeCloseTo(
      w.layout.translateY + cell.y + cell.height / 2,
    )
  })

  it('outlines the focused cell, names it, and drops the outline on blur', () => {
    const chart = canvasHeatmap()
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')

    const kn = chart.ctx.keyboardNavigation
    const cell = cellBox(chart.w, kn.seriesIndex, kn.dataPointIndex)
    let rings = chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring')
    expect(rings.length).toBe(1)
    const ring = rings[0]
    expect(ring.classList.contains('apexcharts-keyboard-focused')).toBe(true)
    // in the row's series group, where an SVG cell would be
    const row = ring.closest('.apexcharts-heatmap .apexcharts-series')
    expect(row?.getAttribute('data:realIndex')).toBe('0')
    expect(Number(ring.getAttribute('x'))).toBeCloseTo(cell.x)
    expect(Number(ring.getAttribute('y'))).toBeCloseTo(cell.y)
    expect(Number(ring.getAttribute('width'))).toBeCloseTo(cell.width)
    expect(Number(ring.getAttribute('height'))).toBeCloseTo(cell.height)
    expect(ring.getAttribute('fill')).toBe('none')
    expect(ring.getAttribute('role')).toBe('img')
    expect(ring.getAttribute('aria-label')).toContain('A:')

    // one outline at a time as focus moves
    fireKey(chart, 'ArrowUp')
    rings = chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring')
    expect(rings.length).toBe(1)
    expect(rings[0].getAttribute('aria-label')).toContain('B:')

    blurSvg(chart)
    expect(
      chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring').length,
    ).toBe(0)
  })

  it('keeps finding the painted cells after a data update', async () => {
    const chart = canvasHeatmap()
    const rings = () =>
      chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring').length
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    expect(rings()).toBe(1)

    await chart.updateSeries(
      series.map((s) => ({
        ...s,
        data: s.data.map((d) => ({ x: d.x, y: d.y + 1 })),
      })),
    )
    expect(chart.ctx.renderer.kind).toBe('canvas')
    // the update swept the outline away with its row, as it does an SVG
    // cell's focus stroke
    expect(rings()).toBe(0)

    const place = vi.spyOn(
      chart.w.globals.tooltip.tooltipPosition,
      'placeAroundCell',
    )
    fireKey(chart, 'ArrowRight')
    expect(rings()).toBe(1)
    expect(place).toHaveBeenCalled()
  })

  it('leaves an SVG heatmap focusing its own cell node', () => {
    const chart = canvasHeatmap({ renderer: 'svg' })
    expect(chart.w.globals.activeRenderer?.kind).toBe('svg')
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    expect(
      chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring').length,
    ).toBe(0)
    expect(
      chart.el.querySelector(
        '.apexcharts-heatmap-rect.apexcharts-keyboard-focused',
      ),
    ).not.toBeNull()
  })
})

/**
 * Keyboard focus on markers painted to canvas. With no marker node, a scatter
 * with an intersect tooltip opened the box in the chart's corner and outlined
 * nothing. The renderer keeps each marker's centre and data point, so focus
 * hands the pointer's own handler the marker its hit test would have found.
 */
describe('KeyboardNavigation on canvas markers', () => {
  function canvasScatter({ renderer = 'canvas', intersect = true } = {}) {
    return createChartWithOptions({
      chart: {
        type: 'scatter',
        width: 480,
        height: 320,
        renderer,
        accessibility: {
          enabled: true,
          keyboard: { enabled: true, navigation: { enabled: true } },
        },
      },
      series: [
        {
          name: 'S',
          data: [
            [1, 4],
            [2, 9],
            [3, 6],
          ],
        },
      ],
      tooltip: { shared: false, intersect },
    })
  }

  it('finds a painted marker by series and data point', () => {
    const chart = canvasScatter()
    const r = chart.ctx.renderer
    expect(r.kind).toBe('canvas')
    const m = r.findMarker(0, 1)
    expect(m).toMatchObject({ seriesIndex: 0, dataPointIndex: 1 })
    // where the hit test reports it
    expect(r.hitTestMarker(m.x, m.y)).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 1,
    })
    expect(m.d).toMatch(/^M/)
    expect(r.findMarker(0, 7)).toBeNull()
  })

  it("places the box through the pointer's handler for the focused marker", () => {
    const chart = canvasScatter()
    const ttCtx = chart.w.globals.tooltip
    const hover = vi.spyOn(ttCtx.intersect, 'handlePaintedMarkerTooltip')
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    const kn = chart.ctx.keyboardNavigation
    const m = chart.ctx.renderer.findMarker(kn.seriesIndex, kn.dataPointIndex)
    expect(hover).toHaveBeenCalled()
    const { marker } = hover.mock.calls.at(-1)[0]
    expect(marker).toEqual({
      i: kn.seriesIndex,
      j: kn.dataPointIndex,
      cx: m.x,
      cy: m.y,
      size: m.size,
    })
    const tooltipEl = ttCtx.getElTooltip()
    expect(tooltipEl.style.left).not.toBe('')
    expect(tooltipEl.style.top).not.toBe('')
  })

  it('leaves a canvas marker the pointer does not hover one at a time to the dynamic point', () => {
    const chart = canvasScatter({ intersect: false })
    const ttCtx = chart.w.globals.tooltip
    const hover = vi.spyOn(ttCtx.intersect, 'handlePaintedMarkerTooltip')
    const dynamic = vi.spyOn(ttCtx.tooltipPosition, 'moveDynamicPointOnHover')
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    expect(hover).not.toHaveBeenCalled()
    expect(dynamic).toHaveBeenCalled()
  })

  it('outlines the focused marker in its series group, and names it', () => {
    const chart = canvasScatter()
    focusSvg(chart)
    fireKey(chart, 'ArrowRight')
    const kn = chart.ctx.keyboardNavigation
    const m = chart.ctx.renderer.findMarker(kn.seriesIndex, kn.dataPointIndex)
    const rings = chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring')
    expect(rings.length).toBe(1)
    const ring = rings[0]
    expect(ring.getAttribute('d')).toBe(m.d)
    expect(ring.getAttribute('fill')).toBe('none')
    expect(ring.getAttribute('clip-path')).toContain('gridRectMarkerMask')
    expect(
      ring.closest('.apexcharts-series')?.getAttribute('data:realIndex'),
    ).toBe('0')
    expect(ring.getAttribute('aria-label')).toContain('S:')
    blurSvg(chart)
    expect(
      chart.el.querySelectorAll('.apexcharts-keyboard-focus-ring').length,
    ).toBe(0)
  })
})
