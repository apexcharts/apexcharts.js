import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('tooltip.cssClass', () => {
  it('takes a space-separated list of classes', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { cssClass: 'one  two' },
    })
    await tick()
    const el = chart.w.globals.tooltip.getElTooltip()
    expect(el).not.toBeNull()
    expect(el.classList.contains('one')).toBe(true)
    expect(el.classList.contains('two')).toBe(true)
    chart.destroy()
  })
})

describe('y-axis tooltip nodes follow a re-render', () => {
  it('after updateOptions the cached y-axis tooltip nodes are the live ones', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      yaxis: { tooltip: { enabled: true } },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(tt.yaxisTTEls[0].isConnected).toBe(true)

    await chart.updateOptions({ title: { text: 'x' } })
    expect(chart.w.globals.tooltip).toBe(tt)
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    tt.tooltipPosition.moveYAxisTooltip(0)
    expect(tt.yaxisTTEls[0].isConnected).toBe(true)
    chart.destroy()
  })

  it('adding a y-axis does not make moveYAxisTooltip throw', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3, 4] }],
      yaxis: { tooltip: { enabled: true } },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    await chart.updateOptions({
      yaxis: [
        { tooltip: { enabled: true } },
        { opposite: true, tooltip: { enabled: true } },
      ],
      series: [
        { name: 'a', data: [1, 2, 3, 4] },
        { name: 'b', data: [4, 3, 2, 1] },
      ],
    })
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip').length,
    ).toBe(2)
    expect(() => tt.tooltipPosition.moveYAxisTooltip(1)).not.toThrow()
    chart.destroy()
  })
})

describe('isBarShared follows the render', () => {
  it('is false for horizontal bars', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 300 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    expect(chart.w.globals.isBarHorizontal).toBe(true)
    expect(chart.w.globals.tooltip.isBarShared).toBe(false)
    chart.destroy()
  })

  it('follows tooltip.shared through updateOptions', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'bar', width: 400, height: 300 },
      series: [{ name: 'a', data: [1, 2, 3] }],
      tooltip: { shared: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(tt.isBarShared).toBe(false)
    await chart.updateOptions({ tooltip: { shared: true, intersect: false } })
    expect(chart.w.globals.tooltip.isBarShared).toBe(true)
    chart.destroy()
  })
})
