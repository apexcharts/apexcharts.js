/**
 * The x and y axis tooltips: the value the y-axis tooltip reads off the
 * pointer, and the width the x crosshair is drawn at.
 *
 * jsdom measures every rect as zero, so `TooltipUtils.plotRect` puts the plot
 * top at translateY and a pointer at translateY + py is plot y py.
 */
import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function yTooltipAt(chart, fraction) {
  const w = chart.w
  const tt = chart.ctx.tooltip
  const clientY = w.layout.translateY + w.layout.gridHeight * fraction
  tt.axesTooltip.drawYaxisTooltipText(0, clientY)
  return parseFloat(tt.yaxisTooltipText[0].textContent)
}

function yChart(yaxis) {
  return createChartWithOptions({
    chart: { type: 'line', height: 300, width: 600 },
    series: [{ name: 'A', data: [1, 10, 100, 1000] }],
    yaxis: {
      tooltip: { enabled: true },
      labels: { formatter: (v) => v.toFixed(2) },
      ...yaxis,
    },
  })
}

describe('y-axis tooltip value', () => {
  it('reads a linear axis linearly', () => {
    const chart = yChart({ min: 0, max: 1000 })
    expect(yTooltipAt(chart, 0)).toBeCloseTo(1000, 1)
    expect(yTooltipAt(chart, 0.5)).toBeCloseTo(500, 1)
    expect(yTooltipAt(chart, 1)).toBeCloseTo(0, 1)
  })

  it('reads a reversed axis from the top down', () => {
    const chart = yChart({ min: 0, max: 1000, reversed: true })
    expect(yTooltipAt(chart, 0)).toBeCloseTo(0, 1)
    expect(yTooltipAt(chart, 0.25)).toBeCloseTo(250, 1)
  })

  it('reads the pointer in plot px under CSS zoom', () => {
    const chart = yChart({ min: 0, max: 1000 })
    const w = chart.w
    const tt = chart.ctx.tooltip
    w.dom.Paper.node.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: w.globals.svgWidth / 2,
      height: w.globals.svgHeight / 2,
    })
    const plotY = w.layout.gridHeight * 0.25
    tt.axesTooltip.drawYaxisTooltipText(0, (w.layout.translateY + plotY) / 2)
    expect(parseFloat(tt.yaxisTooltipText[0].textContent)).toBeCloseTo(750, 1)
    expect(Number(tt.ycrosshairs.getAttribute('y1'))).toBeCloseTo(plotY, 5)
  })

  it('reads a logarithmic axis in log space', () => {
    const chart = yChart({ logarithmic: true })
    const w = chart.w
    const min = w.globals.minYArr[0]
    const max = w.globals.maxYArr[0]
    const mid = Math.sqrt(min * max)
    expect(yTooltipAt(chart, 0.5)).toBeCloseTo(mid, 1)
    expect(yTooltipAt(chart, 0)).toBeCloseTo(max, 1)
    expect(yTooltipAt(chart, 1)).toBeCloseTo(min, 1)
  })
})

describe('x crosshair width', () => {
  it("falls back to 1 for 'barWidth' on a combo with no bars", () => {
    const chart = createChartWithOptions({
      chart: { height: 300, width: 600 },
      xaxis: { crosshairs: { width: 'barWidth' } },
      series: [
        { name: 'A', type: 'line', data: [1, 2, 3, 4] },
        { name: 'B', type: 'area', data: [4, 3, 2, 1] },
      ],
    })
    expect(chart.w.globals.comboCharts).toBe(true)
    expect(chart.ctx.tooltip.xcrosshairsWidth).toBe(1)
  })

  it('stays finite for a numeric width string', () => {
    const chart = createChartWithOptions({
      chart: { height: 300, width: 600 },
      xaxis: { crosshairs: { width: '3' } },
      series: [{ name: 'A', type: 'line', data: [1, 2, 3, 4] }],
    })
    expect(chart.ctx.tooltip.xcrosshairsWidth).toBe(3)
  })
})
