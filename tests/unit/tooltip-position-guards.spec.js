/**
 * Position.js on the paths a hover takes past the data a series has.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

describe('rangeArea shared hover past a shorter series', () => {
  function rangeChart() {
    return createChartWithOptions({
      chart: { type: 'rangeArea', height: 300, width: 600 },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
      series: [
        {
          name: 'A',
          data: [
            [1, 4],
            [2, 5],
            [3, 6],
            [2, 5],
            [1, 4],
            [2, 6],
          ].map((y, k) => ({
            x: 'abcdef'[k],
            y,
          })),
        },
        {
          name: 'B',
          data: [
            [7, 8],
            [8, 9],
            [9, 10],
          ].map((y, k) => ({ x: 'abc'[k], y })),
        },
      ],
    })
  }

  it('moves the hover dots without throwing', () => {
    const chart = rangeChart()
    const pos = chart.ctx.tooltip.tooltipPosition
    for (const j of [3, 4, 5]) {
      expect(() => pos.moveDynamicPointsOnHover(j)).not.toThrow()
    }
  })

  it("leaves the shorter series' end points out of the column extent", () => {
    const chart = rangeChart()
    const w = chart.w
    const pos = chart.ctx.tooltip.tooltipPosition
    const a = w.globals.pointsArray[0]
    const ys = [a[3][1], a[3 + 6][1]]
    expect(pos.columnExtent(3, 0)).toEqual({
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    })
  })
})

describe('y-axis tooltip with no node for the axis', () => {
  it('does not throw', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', height: 300, width: 600 },
      yaxis: { tooltip: { enabled: true } },
      series: [{ name: 'A', data: [1, 2, 3] }],
    })
    expect(() =>
      chart.ctx.tooltip.tooltipPosition.moveYAxisTooltip(3),
    ).not.toThrow()
  })
})
