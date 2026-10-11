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

describe('bar hover reset leaves untouched bars alone', () => {
  const cats = Array.from({ length: 10 }, (_, k) => 'c' + k)
  const mk = (n) => cats.map((_, k) => k + n)

  it('handleMouseOut does not call dataPointMouseLeave for untouched bars', async () => {
    const leave = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
        width: 400,
        height: 300,
        events: { dataPointMouseLeave: leave },
      },
      series: [
        { name: 'a', data: mk(1) },
        { name: 'b', data: mk(2) },
        { name: 'c', data: mk(3) },
      ],
      xaxis: { categories: cats },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(
      chart.w.dom.baseEl.querySelectorAll('.apexcharts-bar-area').length,
    ).toBe(30)
    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(leave).toHaveBeenCalledTimes(0)
    chart.destroy()
  })

  it('a shared bar tooltip leaves only the column it entered', async () => {
    const enter = vi.fn()
    const leave = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'bar',
        width: 400,
        height: 300,
        events: { dataPointMouseEnter: enter, dataPointMouseLeave: leave },
      },
      series: [
        { name: 'a', data: mk(1) },
        { name: 'b', data: mk(2) },
      ],
      xaxis: { categories: cats },
      tooltip: { shared: true, intersect: false },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    tt.deactivateHoverFilter()
    expect(leave).toHaveBeenCalledTimes(0)

    vi.spyOn(tt.tooltipUtil, 'getBarsHeight').mockReturnValue(10)
    vi.spyOn(tt.tooltipPosition, 'moveStickyTooltipOverBars').mockImplementation(
      () => {},
    )
    tt.create({ type: 'mousemove' }, tt, 0, 3, tt.ttItems)
    expect(enter).toHaveBeenCalledTimes(2)
    expect(enter.mock.calls.map((c) => c[2].dataPointIndex)).toEqual([3, 3])

    tt.handleMouseOut({ tooltipEl: tt.getElTooltip() })
    expect(leave).toHaveBeenCalledTimes(2)
    expect(leave.mock.calls.map((c) => c[2].dataPointIndex)).toEqual([3, 3])
    chart.destroy()
  })
})

describe('a non-shared tooltip row takes the hovered series config', () => {
  it('reads enabledOnSeries, marker.fillColors and markers.shape by series', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 400, height: 300 },
      series: [
        { name: 'a', data: [1, 2, 3] },
        { name: 'b', data: [3, 2, 1] },
      ],
      markers: { size: 4, shape: ['circle', 'square'] },
      tooltip: {
        shared: false,
        enabledOnSeries: [1],
        marker: { fillColors: ['#ff0000', '#00ff00'] },
      },
    })
    await tick()
    const tt = chart.w.globals.tooltip
    expect(tt.ttItems.length).toBe(1)
    const row = tt.ttItems[0]
    const marker = row.querySelector('.apexcharts-tooltip-marker')

    tt.tooltipLabels.drawSeriesTexts({
      shared: false,
      ttItems: tt.ttItems,
      i: 1,
      j: 0,
    })
    expect(row.style.display).not.toBe('none')
    expect(marker.style.color).toBe('rgb(0, 255, 0)')
    expect(marker.getAttribute('shape')).toBe('square')

    tt.tooltipLabels.drawSeriesTexts({
      shared: false,
      ttItems: tt.ttItems,
      i: 0,
      j: 0,
    })
    expect(row.style.display).toBe('none')
    expect(marker.getAttribute('shape')).toBe('circle')
    chart.destroy()
  })
})
