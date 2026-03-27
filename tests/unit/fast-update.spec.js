import { describe, it, expect, vi } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'

describe('fastUpdate() — partial updateSeries fast path', () => {
  it('updates series data without a full SVG rebuild (axis chart)', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    await chart.updateSeries([{ data: [10, 20, 30] }])

    // Fast path should have been chosen (axis chart, same series count, no collapsed)
    expect(fastUpdateSpy).toHaveBeenCalledOnce()
    expect(updateSpy).not.toHaveBeenCalled()

    // Series data must reflect the new values
    expect(chart.getState().series).toEqual([[10, 20, 30]])
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

  it('reset zoom should force full update when previously zoomed', async () => {
    const chart = createChart('line', [{ data: [1, 2, 3, 4, 5] }])

    const fastUpdateSpy = vi.spyOn(chart, 'fastUpdate')
    const updateSpy = vi.spyOn(chart, 'update')

    chart.zoomX(2, 4)

    await chart.ctx.toolbar.handleZoomReset()

    expect(updateSpy).toHaveBeenCalled()
    expect(fastUpdateSpy).not.toHaveBeenCalled()
  })
})
