import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Series from '../../src/modules/Series.js'
import ApexCharts from '../../src/apexcharts.js'

// A legend item's highlight (and the legendHover event) runs once when the
// pointer enters the item, not on every mousemove inside it. Moving to the
// next item, leaving the legend, and a re-render all still take effect.

const INACTIVE = 'legend-mouseover-inactive'

const move = (el) =>
  el.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }))
const out = (el, relatedTarget = document.body) =>
  el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget }))
const item = (chart, rel, part = 'text') =>
  chart.el.querySelector(`.apexcharts-legend-${part}[rel="${rel}"]`)
const dimmed = (chart, sel) =>
  [...chart.el.querySelectorAll(sel)].map((g) => g.classList.contains(INACTIVE))

const donut = () =>
  createChartWithOptions({
    chart: { type: 'donut' },
    series: [40, 30, 30],
    labels: ['a', 'b', 'c'],
    legend: { show: true },
  })
// jsdom cannot match the data:realIndex selector the axis-chart highlight
// uses, so the dimming itself is read off a donut.
const slices = (chart) => dimmed(chart, '.apexcharts-pie .apexcharts-series')

const lines = () =>
  createChartWithOptions({
    chart: { type: 'line' },
    series: [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [3, 2, 1] },
    ],
    legend: { show: true },
  })

afterEach(() => vi.restoreAllMocks())

describe('legend hover runs once per item', () => {
  it('highlights once per entry, follows the next item, clears on leave', () => {
    const chart = donut()
    const spy = vi.spyOn(Series.prototype, 'highlightSeries')
    for (let k = 0; k < 5; k++) move(item(chart, 1))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(slices(chart)).toEqual([false, true, true])

    // to another part of the same item: nothing to undo or redo
    out(item(chart, 1), item(chart, 1, 'marker'))
    move(item(chart, 1, 'marker'))
    expect(spy).toHaveBeenCalledTimes(1)
    expect(slices(chart)).toEqual([false, true, true])

    // straight onto the adjacent item
    out(item(chart, 1, 'marker'), item(chart, 2))
    move(item(chart, 2))
    move(item(chart, 2))
    expect(spy).toHaveBeenCalledTimes(2)
    expect(slices(chart)).toEqual([true, false, true])

    out(item(chart, 2))
    expect(slices(chart)).toEqual([false, false, false])
    move(item(chart, 2))
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('clears on an out onto the same item of another chart', () => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
    const [a, b] = ['#a', '#b'].map((id) => {
      const chart = new ApexCharts(document.querySelector(id), {
        chart: { type: 'donut', animations: { enabled: false } },
        series: [40, 30, 30],
        labels: ['a', 'b', 'c'],
        legend: { show: true },
      })
      chart.render()
      return chart
    })
    move(item(a, 1))
    expect(slices(a)).toEqual([false, true, true])
    out(item(a, 1), item(b, 1))
    move(item(b, 1))
    expect(slices(a)).toEqual([false, false, false])
    expect(slices(b)).toEqual([false, true, true])
    // A's guard was dropped too, so coming back highlights again
    const spy = vi.spyOn(Series.prototype, 'highlightSeries')
    move(item(a, 1))
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('highlights again after updateSeries, updateOptions and a toggle', async () => {
    const chart = lines()
    const spy = vi.spyOn(Series.prototype, 'highlightSeries')
    move(item(chart, 1))
    await chart.updateSeries([
      { name: 'A', data: [2, 3, 4] },
      { name: 'B', data: [4, 3, 2] },
    ])
    move(item(chart, 1))
    expect(spy).toHaveBeenCalledTimes(2)

    await chart.updateOptions({ stroke: { width: 3 } })
    move(item(chart, 1))
    expect(spy).toHaveBeenCalledTimes(3)

    await chart.toggleSeries('B')
    move(item(chart, 1))
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('guards line and radialBar legends too', () => {
    for (const type of ['line', 'radialBar']) {
      const chart = createChartWithOptions({
        chart: { type },
        series:
          type === 'line' ? [{ data: [1, 2] }, { data: [2, 1] }] : [40, 30],
        labels: ['a', 'b'],
        legend: { show: true },
      })
      const spy = vi.spyOn(Series.prototype, 'highlightSeries')
      for (let k = 0; k < 4; k++) move(item(chart, 2))
      expect(spy).toHaveBeenCalledTimes(1)
      spy.mockRestore()
      out(item(chart, 2))
      expect(dimmed(chart, '.apexcharts-series').some(Boolean)).toBe(false)
    }
  })

  it('fires legendHover once per heatmap item and dims each cell once', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap' },
      series: [
        {
          name: 'r1',
          data: [
            { x: 'a', y: 1 },
            { x: 'b', y: 8 },
            { x: 'c', y: 2 },
          ],
        },
        {
          name: 'r2',
          data: [
            { x: 'a', y: 9 },
            { x: 'b', y: 3 },
            { x: 'c', y: 7 },
          ],
        },
      ],
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              { from: 0, to: 5, color: '#1e88e5', name: 'low' },
              { from: 6, to: 10, color: '#e53935', name: 'high' },
            ],
          },
        },
      },
      legend: { show: true },
    })
    const fired = []
    chart.addEventListener('legendHover', (_c, i) => fired.push(i))
    const ops = ['add', 'remove', 'toggle'].map((m) =>
      vi.spyOn(DOMTokenList.prototype, m),
    )
    const count = () => ops.reduce((n, s) => n + s.mock.calls.length, 0)

    move(item(chart, 1))
    // one class op per cell: 6 cells
    expect(count()).toBe(6)
    for (let k = 0; k < 4; k++) move(item(chart, 1))
    expect(count()).toBe(6)
    expect(dimmed(chart, '.apexcharts-heatmap-rect')).toEqual([
      // r2 is drawn first (heatmap rows stack bottom up)
      true,
      false,
      true,
      false,
      true,
      false,
    ])
    out(item(chart, 1))
    expect(dimmed(chart, '.apexcharts-heatmap-rect').some(Boolean)).toBe(false)
    move(item(chart, 2))
    expect(fired).toEqual([0, 1])
  })
})
