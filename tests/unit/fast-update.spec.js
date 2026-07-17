import { describe, it, expect, vi } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'

describe('fastUpdate() — partial updateSeries fast path', () => {
  it('updates series data without a full SVG rebuild (stable-domain axis chart)', async () => {
    // A fixed y-axis keeps the rendered scale identical across the update, so
    // the pure fast path applies: series repaint only, no axis/grid rebuild and
    // no fallback to update().
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
      yaxis: { min: 0, max: 100 },
    })

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    await chart.updateSeries([{ data: [10, 20, 30] }])

    // Fast path chosen (axis chart, same series count) and, because the axis
    // domain is unchanged, it stays on the fast path (no full rebuild).
    expect(fastUpdateSpy).toHaveBeenCalledOnce()
    expect(updateSpy).not.toHaveBeenCalled()

    // Series data must reflect the new values
    expect(chart.getState().series).toEqual([[10, 20, 30]])
  })

  it('falls back to a full render when a fast update changes the axis domain', async () => {
    // Auto y-axis: lowering the data domain must repaint the ruler, which the
    // fast path cannot do in place (axes are preserved), so it delegates to a
    // full update() rather than leave a bar drawn full-height against a stale
    // 0-20 ruler.
    const chart = createChart('bar', [{ data: [18, 20, 17, 19, 16] }])

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    await chart.updateSeries([{ data: [6, 6, 6, 5, 6] }])

    // fast path is entered (eligible) but detects the domain change and delegates
    expect(fastUpdateSpy).toHaveBeenCalledOnce()
    expect(updateSpy).toHaveBeenCalledOnce()

    const state = chart.getState()
    expect(state.series).toEqual([[6, 6, 6, 5, 6]])
    expect(state.maxY).toBe(6)
  })

  it('series values are correct after fast update', async () => {
    const chart = createChart('bar', [
      { name: 'A', data: [5, 10, 15] },
      { name: 'B', data: [2, 4, 6] },
    ])

    await chart.updateSeries([
      { name: 'A', data: [50, 100, 150] },
      { name: 'B', data: [20, 40, 60] },
    ])

    const state = chart.getState()
    expect(state.series[0]).toEqual([50, 100, 150])
    expect(state.series[1]).toEqual([20, 40, 60])
  })

  it('falls back to full update when series count changes', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    // Adding a second series — count changes, fast path ineligible
    await chart.updateSeries([{ data: [1, 2, 3] }, { data: [4, 5, 6] }])

    expect(fastUpdateSpy).not.toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalledOnce()
  })

  it('falls back to full update for non-axis charts (pie)', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'pie' },
      series: [10, 20, 30],
      labels: ['A', 'B', 'C'],
    })

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    await chart.updateSeries([15, 25, 35])

    expect(fastUpdateSpy).not.toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalledOnce()
  })

  it('updated() event fires after fast update', async () => {
    const updatedHandler = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
        events: { updated: updatedHandler },
      },
      series: [{ data: [1, 2, 3] }],
    })

    await chart.updateSeries([{ data: [4, 5, 6] }])

    expect(updatedHandler).toHaveBeenCalledOnce()
  })

  it('min/max are recalculated after fast update', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])

    const before = chart.getState()
    expect(before.maxY).toBe(3)

    await chart.updateSeries([{ data: [100, 200, 300] }])

    const after = chart.getState()
    expect(after.maxY).toBe(300)
  })

  it('multiple consecutive fast updates stay consistent', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])

    await chart.updateSeries([{ data: [10, 20, 30] }])
    await chart.updateSeries([{ data: [100, 200, 300] }])
    await chart.updateSeries([{ data: [7, 8, 9] }])

    expect(chart.getState().series).toEqual([[7, 8, 9]])
    expect(chart.getState().maxY).toBe(9)
  })

  it('reset zoom should restore axis state using full update', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3, 4, 5] }])

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    chart.zoomX(2, 4)
    fastUpdateSpy.mockClear()
    updateSpy.mockClear()

    chart.ctx.toolbar.handleZoomReset()
    expect(chart.w.interact.zoomed).toBe(false)
    expect(chart.w.globals.minX).toBe(1)
    expect(chart.w.globals.maxX).toBe(5)
    expect(fastUpdateSpy).not.toHaveBeenCalled()
    expect(updateSpy).toHaveBeenCalledOnce()
  })
})
