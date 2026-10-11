/**
 * What the bar tooltip reads off the hovered bar (Intersect.getBarTooltipXY).
 */
import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

function hoverBar(chart, selector) {
  const tt = chart.ctx.tooltip
  const bar = chart.w.dom.baseEl.querySelector(selector)
  const e = { type: 'mousemove', target: bar, clientX: 0, clientY: 0 }
  return tt.intersect.getBarTooltipXY({ e, opt: { ttItems: tt.ttItems } })
}

const RANGE_SERIES = [
  {
    name: 'R',
    data: [
      { x: 'a', y: [1.5, 3.7] },
      { x: 'b', y: [-1.5, 2.25] },
    ],
  },
]

describe('rangeBar tooltip values', () => {
  it('keeps the decimals of a range', () => {
    const chart = createChartWithOptions({
      chart: { type: 'rangeBar', height: 300, width: 600 },
      series: RANGE_SERIES,
    })
    const spy = vi.spyOn(chart.ctx.tooltip.tooltipLabels, 'drawSeriesTexts')
    hoverBar(chart, '.apexcharts-rangebar-area[j="0"]')
    expect(spy.mock.calls[0][0]).toMatchObject({ y1: 1.5, y2: 3.7 })
    hoverBar(chart, '.apexcharts-rangebar-area[j="1"]')
    expect(spy.mock.calls[1][0]).toMatchObject({ y1: -1.5, y2: 2.25 })
  })
})

describe('grouped vertical rangeBar tooltip x', () => {
  const grouped = {
    chart: { type: 'rangeBar' },
    plotOptions: { bar: { horizontal: false, rangeBarGroupRows: true } },
    tooltip: { arrow: false, shared: false, intersect: true },
    series: RANGE_SERIES,
  }

  function xOf(chart) {
    const bar = chart.w.dom.baseEl.querySelector('.apexcharts-rangebar-area')
    const cx = parseInt(bar.getAttribute('cx'), 10)
    return hoverBar(chart, '.apexcharts-rangebar-area').x - cx
  }

  it('is read from the current config after an update', () => {
    const fresh = xOf(
      createChartWithOptions({
        ...grouped,
        chart: { ...grouped.chart, height: 300, width: 600 },
      }),
    )

    const chart = createChartWithOptions({
      chart: { type: 'bar', height: 300, width: 600 },
      series: [{ name: 'A', data: [1, 2] }],
    })
    chart.updateOptions(grouped, false, false)
    expect(xOf(chart)).toBe(fresh)
  })
})
