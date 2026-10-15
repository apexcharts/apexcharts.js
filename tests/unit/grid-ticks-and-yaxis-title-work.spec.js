// Grid drew every x tick through a fresh XAxis, and each construction
// copies the whole label array, so a 2,000 category chart paid O(N^2) per
// render. One XAxis now serves a whole drawGrid, and none is built when
// ticks are off. yAxisTitleRotate measured the labels group even on an
// axis with no title to place; it now returns before any DOM read.
import { describe, it, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Grid from '../../src/modules/axes/Grid.js'
import YAxis from '../../src/modules/axes/YAxis.js'

const made = vi.hoisted(() => ({ n: 0 }))

vi.mock('../../src/modules/axes/XAxis.js', async (importOriginal) => {
  const mod = await importOriginal()
  class CountingXAxis extends mod.default {
    constructor(...args) {
      super(...args)
      made.n++
    }
  }
  return { ...mod, default: CountingXAxis }
})

const cats = (n) => Array.from({ length: n }, (_, i) => 'c' + i)
const vals = (n) => Array.from({ length: n }, (_, i) => (i * 7) % 13)

const xAxesPerDrawGrid = (opts) => {
  const chart = createChartWithOptions(opts)
  const ticksBefore = chart.el.querySelectorAll('.apexcharts-xaxis-tick').length
  made.n = 0
  const grid = new Grid(chart.w, chart)
  grid.drawGrid()
  return { made: made.n, ticks: ticksBefore }
}

describe('Grid builds at most one XAxis per drawGrid', () => {
  it('column chart with 40 categories', () => {
    const r = xAxesPerDrawGrid({
      chart: { type: 'line', width: 600, height: 300 },
      series: [{ data: vals(40) }],
      xaxis: { categories: cats(40) },
    })
    expect(r.ticks).toBeGreaterThan(30)
    expect(r.made).toBe(1)
  })

  it('horizontal bars', () => {
    const r = xAxesPerDrawGrid({
      chart: { type: 'bar', width: 600, height: 300 },
      plotOptions: { bar: { horizontal: true } },
      series: [{ data: vals(12) }],
      xaxis: { categories: cats(12) },
    })
    expect(r.ticks).toBeGreaterThan(3)
    expect(r.made).toBe(1)
  })

  it('none when axis ticks are off but vertical gridlines are on', () => {
    const r = xAxesPerDrawGrid({
      chart: { type: 'line', width: 600, height: 300 },
      grid: { xaxis: { lines: { show: true } } },
      series: [{ data: vals(40) }],
      xaxis: { categories: cats(40), axisTicks: { show: false } },
    })
    expect(r.ticks).toBe(0)
    expect(r.made).toBe(0)
  })
})

describe('yAxisTitleRotate without a title', () => {
  it('reads nothing from the DOM', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [{ data: vals(10) }],
    })
    const qs = vi.spyOn(chart.w.dom.baseEl, 'querySelector')
    new YAxis(chart.w, { theme: chart.theme, timeScale: chart.timeScale })
      .yAxisTitleRotate(0, false)
    expect(qs).toHaveBeenCalledTimes(0)
    qs.mockRestore()
  })

  it('still places a titled axis', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [{ data: vals(10) }],
      yaxis: { title: { text: 'Units' } },
    })
    const title = chart.el.querySelector('.apexcharts-yaxis-title text')
    title.removeAttribute('transform')
    new YAxis(chart.w, { theme: chart.theme, timeScale: chart.timeScale })
      .yAxisTitleRotate(0, false)
    expect(title.getAttribute('transform')).toMatch(/^rotate\(-90 /)
  })
})
