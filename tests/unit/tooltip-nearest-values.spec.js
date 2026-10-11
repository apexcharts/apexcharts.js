/**
 * Tooltip hit-testing: which series and data index a hover resolves to.
 *
 * jsdom measures every rect as zero, so `TooltipUtils.plotRect` puts the plot
 * corner at (translateX, translateY) and a pointer at
 * (translateX + px, translateY + py) is plot point (px, py).
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function hover(chart, px, py) {
  const w = chart.w
  const hoverArea = document.createElement('div')
  return chart.ctx.tooltip.tooltipUtil.getNearestValues({
    hoverArea,
    clientX: w.layout.translateX + px,
    clientY: w.layout.translateY + py,
  })
}

describe('getNearestValues on numeric x with nulls', () => {
  it('pairs x and y by data index when a straight line has a null', () => {
    // Line writes a null x but a floor y for the null on a straight curve,
    // so compacting x and y separately shifted A's y one point right.
    const chart = createChartWithOptions({
      chart: { type: 'line', height: 300, width: 600 },
      stroke: { curve: 'straight' },
      xaxis: { type: 'numeric' },
      tooltip: { shared: false, intersect: false },
      series: [
        {
          name: 'A',
          data: [
            [0, 10],
            [1, null],
            [2, 90],
            [3, 10],
            [4, 90],
            [5, 10],
          ],
        },
        {
          name: 'B',
          data: [
            [0, 50],
            [1, 50],
            [2, 50],
            [3, 50],
            [4, 50],
            [5, 50],
          ],
        },
      ],
    })
    const w = chart.w
    for (const k of [2, 4]) {
      const res = hover(
        chart,
        w.globals.seriesXvalues[0][k],
        w.globals.seriesYvalues[0][k],
      )
      expect(res.capturedSeries).toBe(0)
      expect(res.j).toBe(k)
    }
  })

  it('scores every series at the same data index on the equal-x path', () => {
    const chart = createChartWithOptions({
      chart: { type: 'scatter', height: 300, width: 600 },
      xaxis: { type: 'numeric' },
      tooltip: { shared: false, intersect: false },
      series: [
        {
          name: 'A',
          data: [
            [0, 50],
            [1, null],
            [2, 90],
            [3, 50],
            [4, 50],
          ],
        },
        {
          name: 'B',
          data: [
            [0, 20],
            [1, 90],
            [2, 10],
            [3, 20],
            [4, 20],
          ],
        },
      ],
    })
    const w = chart.w
    const res = hover(
      chart,
      w.globals.seriesXvalues[1][2],
      w.globals.seriesYvalues[1][2],
    )
    expect(res.capturedSeries).toBe(1)
    expect(res.j).toBe(2)
  })
})

describe('getNearestValues under CSS zoom', () => {
  it('measures y in plot px, as it does x', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', height: 300, width: 600 },
      xaxis: { type: 'numeric' },
      tooltip: { shared: false, intersect: false },
      series: [
        {
          name: 'A',
          data: [
            [0, 10],
            [1, 20],
            [2, 90],
            [3, 20],
            [4, 10],
          ],
        },
        {
          name: 'B',
          data: [
            [0, 45],
            [1, 45],
            [2, 45],
            [3, 45],
            [4, 45],
          ],
        },
      ],
    })
    const w = chart.w
    const zoom = 0.5
    w.dom.Paper.node.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: w.globals.svgWidth * zoom,
      height: w.globals.svgHeight * zoom,
    })
    const px = w.globals.seriesXvalues[0][4]
    const py = w.globals.seriesYvalues[0][4]
    const res = chart.ctx.tooltip.tooltipUtil.getNearestValues({
      hoverArea: document.createElement('div'),
      clientX: (w.layout.translateX + px) * zoom,
      clientY: (w.layout.translateY + py) * zoom,
    })
    expect(res.capturedSeries).toBe(0)
    expect(res.j).toBe(4)
    expect(res.hoverY).toBeCloseTo(py, 5)
  })
})

describe('getNearestValues on a category axis', () => {
  it("resolves the slot under the pointer with tickPlacement 'between'", () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', height: 300, width: 600 },
      xaxis: {
        categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        tickPlacement: 'between',
      },
      series: [{ name: 'A', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] }],
    })
    const w = chart.w
    const slot = w.layout.gridWidth / 10
    for (let k = 0; k < 10; k++) {
      expect(hover(chart, k * slot + 2, 10).j).toBe(k)
      expect(hover(chart, (k + 0.5) * slot, 10).j).toBe(k)
      expect(hover(chart, (k + 1) * slot - 2, 10).j).toBe(k)
    }
  })

  it('never resolves past the last category at the right edge', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', height: 300, width: 600 },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
      tooltip: { shared: true, intersect: false },
      series: [{ name: 'A', data: [1, 2, 3, 4, 5] }],
    })
    const w = chart.w
    expect(hover(chart, w.layout.gridWidth - 1, 10).j).toBe(4)
    expect(hover(chart, w.layout.gridWidth + 0.5, 10).j).toBe(4)
  })

  it('never resolves past the last row at the bottom of horizontal bars', () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', height: 300, width: 600 },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e'] },
      tooltip: { shared: true, intersect: false },
      series: [{ name: 'A', data: [1, 2, 3, 4, 5] }],
    })
    const w = chart.w
    expect(hover(chart, 10, w.layout.gridHeight).j).toBe(4)
  })
})
