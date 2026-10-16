import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Work counts for three Series paths, with their output unchanged:
// - a hover move (legend or dataset) runs no query once the highlight list
//   is cached;
// - a heatmap range highlight writes each cell's class once;
// - capturing a heatmap or treemap for the next update reads each series'
//   cells and labels from its group, instead of two whole-chart selector
//   queries per series. previousPaths[realIndex][j] is still that cell.

afterEach(() => vi.restoreAllMocks())

const heatmap = () =>
  createChartWithOptions({
    chart: { type: 'heatmap' },
    dataLabels: { enabled: true },
    series: [0, 1, 2, 3].map((s) => ({
      name: 's' + s,
      data: [0, 1, 2].map((x) => ({ x: 'c' + x, y: s * 3 + x })),
    })),
  })

describe('series hover', () => {
  it('a hover move queries nothing once the highlight list is cached', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2] }, { data: [2, 1] }],
    })
    const legendItem = chart.el.querySelector(
      '.apexcharts-legend-text[rel="1"]',
    )
    const hover = () =>
      chart.series.toggleSeriesOnHover({ type: 'mousemove' }, legendItem)
    hover()
    const qsa = vi.spyOn(chart.w.dom.baseEl, 'querySelectorAll')
    hover()
    expect(qsa).toHaveBeenCalledTimes(0)
  })

  it('a heatmap range highlight writes each cell once', () => {
    const chart = createChartWithOptions({
      chart: { type: 'heatmap' },
      series: [
        { name: 'r1', data: [1, 8, 2].map((y, x) => ({ x: 'c' + x, y })) },
        { name: 'r2', data: [9, 3, 7].map((y, x) => ({ x: 'c' + x, y })) },
      ],
      plotOptions: {
        heatmap: {
          colorScale: {
            ranges: [
              { from: 0, to: 5, color: '#1e88e5' },
              { from: 6, to: 10, color: '#e53935' },
            ],
          },
        },
      },
    })
    const ops = ['add', 'remove', 'toggle'].map((m) =>
      vi.spyOn(DOMTokenList.prototype, m),
    )
    const count = () => ops.reduce((n, s) => n + s.mock.calls.length, 0)
    chart.series.highlightRangeInSeries(0, 'highlight')
    expect(count()).toBe(6)
    const dim = () =>
      [...chart.el.querySelectorAll('.apexcharts-heatmap-rect')]
        .filter((r) => r.classList.contains('legend-mouseover-inactive'))
        .map((r) => r.getAttribute('val'))
        .sort()
    expect(dim()).toEqual(['7', '8', '9'])
    chart.series.highlightRangeInSeries(0, 'reset')
    expect(dim()).toEqual([])
  })
})

describe('heatmap capture', () => {
  it('runs no whole-chart query per series', () => {
    const chart = heatmap()
    const qsa = vi.spyOn(chart.w.dom.baseEl, 'querySelectorAll')
    chart.w.globals.previousPaths = []
    chart.series.getPreviousPaths()
    const perSeries = qsa.mock.calls.filter(([sel]) => /realIndex/.test(sel))
    expect(perSeries.length).toBe(0)
  })

  it('stores each series by realIndex and each cell by j', () => {
    const chart = heatmap()
    chart.w.globals.previousPaths = []
    chart.series.getPreviousPaths()
    const prev = chart.w.globals.previousPaths
    expect(prev.length).toBe(4)
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 3; j++) {
        const cell = chart.el.querySelector(
          `.apexcharts-heatmap-rect[i="${i}"][j="${j}"]`,
        )
        expect(prev[i][j].fill).toBe(cell.getAttribute('fill'))
        expect(prev[i][j].rect.y).toBe(parseFloat(cell.getAttribute('y')))
      }
    }
  })

  it('captures every treemap tile', () => {
    const chart = createChartWithOptions({
      chart: { type: 'treemap' },
      series: [
        {
          data: [
            { x: 'a', y: 5 },
            { x: 'b', y: 3 },
            { x: 'c', y: 2 },
          ],
        },
      ],
    })
    const qsa = vi.spyOn(chart.w.dom.baseEl, 'querySelectorAll')
    chart.w.globals.previousPaths = []
    chart.series.getPreviousPaths()
    expect(qsa.mock.calls.filter(([s]) => /realIndex/.test(s)).length).toBe(0)
    const tiles = chart.w.globals.previousPaths[0]
    expect(tiles.length).toBe(3)
    expect(tiles.map((t) => t.fill)).toEqual(
      [...chart.el.querySelectorAll('.apexcharts-treemap-rect')].map((r) =>
        r.getAttribute('fill'),
      ),
    )
  })
})
