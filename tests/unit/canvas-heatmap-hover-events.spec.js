/**
 * A heatmap painted to canvas has no per-cell node to fire
 * dataPointMouseEnter / Leave from, so the tooltip's hit test fires them as
 * the hovered cell changes. The gradient legend's arrow and the chart's own
 * `chart.events` callbacks both listen to them.
 */
import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('canvas heatmap hover events', () => {
  it('fire on entering a cell, moving to another and leaving', () => {
    const enter = vi.fn()
    const leave = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'heatmap',
        height: 300,
        width: 600,
        events: { dataPointMouseEnter: enter, dataPointMouseLeave: leave },
      },
      series: [
        { name: 'A', data: [1, 2, 3].map((y, k) => ({ x: 'c' + k, y })) },
        { name: 'B', data: [4, 5, 6].map((y, k) => ({ x: 'c' + k, y })) },
      ],
    })
    const tt = chart.ctx.tooltip
    const w = chart.w
    const heard = vi.fn()
    chart.addEventListener('dataPointMouseEnter', heard)

    let cell = { seriesIndex: 1, dataPointIndex: 2 }
    w.globals.activeRenderer = {
      kind: 'canvas',
      hitTest: () => cell && { ...cell, x: 10, y: 10, width: 20, height: 20 },
    }
    const target = w.dom.baseEl.querySelector('.apexcharts-svg')
    const move = () =>
      tt.intersect.handleHeatTreeTooltip({
        e: { type: 'mousemove', target, clientX: 0, clientY: 0 },
        opt: { ttItems: tt.ttItems },
        x: 0,
        y: 0,
        type: 'heatmap',
      })

    move()
    move()
    expect(enter).toHaveBeenCalledTimes(1)
    expect(enter.mock.calls[0][2]).toMatchObject({
      seriesIndex: 1,
      dataPointIndex: 2,
    })
    expect(heard).toHaveBeenCalledTimes(1)
    expect(leave).not.toHaveBeenCalled()

    cell = { seriesIndex: 0, dataPointIndex: 1 }
    move()
    expect(leave).toHaveBeenCalledTimes(1)
    expect(leave.mock.calls[0][2]).toMatchObject({
      seriesIndex: 1,
      dataPointIndex: 2,
    })
    expect(enter).toHaveBeenCalledTimes(2)

    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(leave).toHaveBeenCalledTimes(2)
    expect(leave.mock.calls[1][2]).toMatchObject({
      seriesIndex: 0,
      dataPointIndex: 1,
    })
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(leave).toHaveBeenCalledTimes(2)
  })
})
