import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/violin.js'

// Violin and range defects users saw on non-default axes:
// - yaxis.reversed was ignored by violins and range bars (and by candles or
//   boxes in a combo), so the marks sat at the opposite end from the labels;
// - grouped violins on a numeric x axis sat right of their x;
// - on a log y axis the violin tooltip anchored far below the plot.

const mount = (options) =>
  createChartWithOptions({
    dataLabels: { enabled: false },
    ...options,
    chart: { width: 600, height: 400, ...options.chart },
  })

const ys = (el) =>
  el
    .getAttribute('d')
    .match(/-?\d+(\.\d+)?(e-?\d+)?/g)
    .map(Number)
    .filter((_, k) => k % 2 === 1)

const xs = (el) =>
  el
    .getAttribute('d')
    .match(/-?\d+(\.\d+)?(e-?\d+)?/g)
    .map(Number)
    .filter((_, k) => k % 2 === 0)

const mid = (el) => (Math.max(...ys(el)) + Math.min(...ys(el))) / 2

const low = [0.5, 0.8, 1, 1.1, 1.3, 1.5]

describe('reversed y axis', () => {
  const cases = {
    violin: {
      chart: { type: 'violin' },
      series: [{ data: [{ x: 'a', y: { points: low } }] }],
      sel: '.apexcharts-violin-area',
    },
    rangeBar: {
      chart: { type: 'rangeBar' },
      series: [{ data: [{ x: 'a', y: [0.5, 1.5] }] }],
      sel: '.apexcharts-rangebar-area',
    },
    'candlestick in a combo': {
      chart: { type: 'line' },
      series: [
        { type: 'candlestick', data: [{ x: 'a', y: [1, 1.5, 0.5, 1.2] }] },
        { type: 'line', data: [{ x: 'a', y: 1 }] },
      ],
      sel: '.apexcharts-candlestick-area',
    },
  }

  Object.entries(cases).forEach(([name, { sel, ...opts }]) => {
    it(`draws low ${name} values at the top`, () => {
      const at = (reversed) => {
        const chart = mount({
          ...structuredClone(opts),
          yaxis: { min: 0, max: 6, reversed },
        })
        return {
          y: mid(chart.el.querySelector(sel)),
          gh: chart.w.layout.gridHeight,
        }
      }
      const normal = at(false)
      const rev = at(true)
      expect(normal.y).toBeGreaterThan(normal.gh / 2)
      expect(rev.y).toBeLessThan(rev.gh / 2)
      expect(rev.y).toBeGreaterThan(0)
    })
  })

  it('keeps timeline bars on their dates, whose labels never reverse', () => {
    const d = (day) => Date.UTC(2019, 2, day)
    const chart = mount({
      chart: { type: 'rangeBar' },
      plotOptions: { bar: { horizontal: true } },
      xaxis: { type: 'datetime' },
      yaxis: { reversed: true },
      series: [
        {
          data: [
            { x: 'A', y: [d(2), d(4)] },
            { x: 'B', y: [d(10), d(14)] },
          ],
        },
      ],
    })
    const [a, b] = [
      ...chart.el.querySelectorAll('.apexcharts-rangebar-area'),
    ].map((p) => Math.min(...xs(p)))
    expect(a).toBeLessThan(b)
    expect(a).toBeLessThan(chart.w.layout.gridWidth / 4)
  })
})

describe('violin axes', () => {
  it('centres a group of violins on its numeric x', () => {
    const mk = (name, b) => ({
      name,
      data: [10, 20, 30].map((x) => ({
        x,
        y: { points: low.map((v) => v + b) },
      })),
    })
    const chart = mount({
      chart: { type: 'violin' },
      xaxis: { type: 'numeric' },
      series: [mk('A', 5), mk('B', 6), mk('C', 7)],
    })
    const { minX, maxX } = chart.w.globals
    const centres = [
      ...chart.el.querySelectorAll('path.apexcharts-violin-area[j="1"]'),
    ].map((p) => Number(p.getAttribute('data:center')))
    expect(centres.length).toBe(3)
    expect((centres[0] + centres[2]) / 2).toBeCloseTo(
      ((20 - minX) / (maxX - minX)) * chart.w.layout.gridWidth,
      0,
    )
  })

  it('anchors the tooltip inside the violin on a log axis', () => {
    const chart = mount({
      chart: { type: 'violin' },
      yaxis: { logarithmic: true },
      series: [
        {
          data: [
            { x: 'a', y: { points: [10, 20, 30, 50, 80, 100, 150, 200, 300] } },
          ],
        },
      ],
    })
    const body = chart.el.querySelector('path.apexcharts-violin-area')
    const cy = Number(body.getAttribute('cy'))
    expect(cy).toBeGreaterThanOrEqual(Math.min(...ys(body)))
    expect(cy).toBeLessThanOrEqual(Math.max(...ys(body)))
  })
})
