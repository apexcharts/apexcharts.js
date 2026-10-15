import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import '../../src/entries/violin.js'

// Box plot defects users saw:
// - a null datum, and every category past the end of a shorter series, drew
//   a full-height filled box that also took hover;
// - with candlestick.type 'ohlc' set, box plots were drawn as OHLC ticks;
// - with data labels on, each box showed its label twice (once per half),
//   and a violin with its box lane shown showed it three times.

const mount = (options) =>
  createChartWithOptions({
    ...options,
    chart: { width: 600, height: 400, ...options.chart },
  })

const height = (p) => {
  const ys = p
    .getAttribute('d')
    .match(/-?\d+(\.\d+)?(e-?\d+)?/g)
    .map(Number)
    .filter((_, k) => k % 2 === 1)
  return Math.max(...ys) - Math.min(...ys)
}

const boxes = (root) => [...root.querySelectorAll('.apexcharts-boxPlot-area')]

const box = (lo) => [lo, lo + 10, lo + 20, lo + 30, lo + 40]

describe('box plot holes', () => {
  it('draws nothing for a null datum', () => {
    const chart = mount({
      chart: { type: 'boxPlot' },
      series: [
        {
          data: [
            { x: 'a', y: box(50) },
            { x: 'b', y: null },
            { x: 'c', y: box(55) },
          ],
        },
      ],
    })
    const all = boxes(chart.el)
    expect(all.length).toBe(4)
    expect(all.filter((p) => p.getAttribute('j') === '1')).toEqual([])
    all.forEach((p) => expect(height(p)).toBeLessThan(200))
  })

  it('draws nothing past the end of a shorter series', () => {
    const chart = mount({
      chart: { type: 'boxPlot' },
      series: [
        {
          name: 'Long',
          data: ['a', 'b', 'c', 'd'].map((x, k) => ({ x, y: box(50 + k) })),
        },
        {
          name: 'Short',
          data: ['a', 'b'].map((x, k) => ({ x, y: box(40 + k) })),
        },
      ],
    })
    const short = chart.el.querySelectorAll(
      '.apexcharts-boxPlot-series .apexcharts-series',
    )[1]
    expect(boxes(short).map((p) => p.getAttribute('j'))).toEqual([
      '0',
      '0',
      '1',
      '1',
    ])
  })

  it('draws nothing for a null datum on horizontal boxes', () => {
    const chart = mount({
      chart: { type: 'boxPlot' },
      plotOptions: { bar: { horizontal: true } },
      series: [
        {
          data: [
            { x: 'a', y: box(50) },
            { x: 'b', y: null },
          ],
        },
      ],
    })
    expect(boxes(chart.el).map((p) => p.getAttribute('j'))).toEqual(['0', '0'])
  })
})

describe('box plot glyphs and labels', () => {
  it("keeps box halves when candlestick.type is 'ohlc'", () => {
    const chart = mount({
      chart: { type: 'boxPlot' },
      plotOptions: { candlestick: { type: 'ohlc' } },
      series: [{ data: [{ x: 'a', y: box(50) }] }],
    })
    const halves = boxes(chart.el)
    expect(halves.length).toBe(2)
    expect(halves.every((p) => /z/i.test(p.getAttribute('d')))).toBe(false)
    expect(halves.some((p) => /z/i.test(p.getAttribute('d')))).toBe(true)
  })

  // Counted chart-wide: a label built and then left out of its series lands
  // at the svg root, outside the grid translate.
  ;[false, true].forEach((horizontal) =>
    it(`draws one data label per box${horizontal ? ', horizontal' : ''}`, () => {
      const chart = mount({
        chart: { type: 'boxPlot' },
        dataLabels: { enabled: true },
        plotOptions: { bar: { horizontal } },
        series: [
          {
            data: [
              { x: 'a', y: box(50) },
              { x: 'b', y: box(55) },
            ],
          },
        ],
      })
      const labels = [...chart.el.querySelectorAll('.apexcharts-datalabel')]
      expect(labels.length).toBe(2)
      labels.forEach((t) =>
        expect(t.closest('.apexcharts-boxPlot-series')).not.toBeNull(),
      )
    }),
  )

  it('draws one data label per violin with its box lane shown', () => {
    const obs = (b) => Array.from({ length: 12 }, (_, k) => b + (k % 6) * 0.4)
    const chart = mount({
      chart: { type: 'violin' },
      dataLabels: { enabled: true },
      plotOptions: { violin: { box: { show: true } } },
      series: [
        {
          data: [
            { x: 'G1', y: { points: obs(4), summary: [4, 4.5, 5, 5.5, 6] } },
            { x: 'G2', y: { points: obs(6), summary: [6, 6.5, 7, 7.5, 8] } },
          ],
        },
      ],
    })
    expect(chart.el.querySelectorAll('.apexcharts-datalabel').length).toBe(2)
  })
})
