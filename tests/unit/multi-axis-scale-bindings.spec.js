import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

// Three ways one axis leaked into another:
// - a log series drawn by Line in a combo was transformed by its index inside
//   the line/area subset, so on the second axis it ran off the canvas (#2800);
// - a min/max on y axis k was written into series k's extent, so a bound on
//   axis 1 squashed the series at index 1 even when it lived on axis 0;
// - the x scale probed the y formatter as formatter(1): a y formatter
//   changed the x tick count, and one reading its `w` argument threw.

const lg = Math.log10
const logPixel = (v, min, max, h) =>
  h * (1 - (lg(v) - lg(min)) / (lg(max) - lg(min)))

// y of each vertex of the series' stroke (the path with the fewest vertices)
const strokeYs = (chart, realIndex) =>
  [
    ...[...chart.el.querySelectorAll('.apexcharts-series')]
      .find((g) => g.getAttribute('data:realIndex') === String(realIndex))
      .querySelectorAll('path.apexcharts-area, path.apexcharts-line'),
  ]
    .map((p) =>
      [...(p.getAttribute('d') || '').matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map(
        (m) => +m[2],
      ),
    )
    .filter((a) => a.length)
    .sort((a, b) => a.length - b.length)[0]

describe('combo log series use their own axis', () => {
  const area = [1, 100, 10000]
  const opts = (areaFirst) => {
    const line = { name: 'Line', type: 'line', data: [10, 20, 30] }
    const log = { name: 'Area', type: 'area', data: area }
    return {
      chart: { type: 'line', width: 600, height: 400 },
      stroke: { curve: 'straight' },
      series: areaFirst ? [log, line] : [line, log],
      yaxis: [
        { seriesName: 'Line' },
        { seriesName: 'Area', logarithmic: true, opposite: true },
      ],
    }
  }

  ;[false, true].forEach((areaFirst) =>
    it(`places the log area exactly (area ${areaFirst ? 'first' : 'second'})`, () => {
      const chart = createChartWithOptions(opts(areaFirst))
      const gl = chart.w.globals
      const ai = areaFirst ? 0 : 1
      const sc = gl.yAxisScale[gl.seriesYAxisReverseMap[ai]]
      const h = chart.w.layout.gridHeight
      const ys = strokeYs(chart, ai)
      expect(ys.length).toBe(3)
      ys.forEach((y, i) =>
        expect(y).toBeCloseTo(logPixel(area[i], sc.niceMin, sc.niceMax, h), 1),
      )
    }),
  )
})

describe('y axis bounds stay on their own axis', () => {
  const opts = (bounds) => ({
    chart: { type: 'line', width: 600, height: 400 },
    series: [
      { name: 'A', data: [1, 2, 3] },
      { name: 'B', data: [100, 500, 1000] },
      { name: 'C', data: [4, 5, 6] },
    ],
    yaxis: [{ seriesName: 'B' }, { seriesName: ['A', 'C'], opposite: true, ...bounds }],
  })

  it('a max on axis 1 leaves axis 0 covering series B', () => {
    const gl = createChartWithOptions(opts({ min: 0, max: 10 })).w.globals
    expect(gl.yAxisScale[1].niceMax).toBe(10)
    expect(gl.yAxisScale[0].niceMax).toBeGreaterThanOrEqual(1000)
  })

  it('a function bound sees only its own axis extent', () => {
    const seen = []
    createChartWithOptions(opts({ max: (v) => (seen.push(v), v) }))
    expect(seen.length).toBeGreaterThan(0)
    seen.forEach((v) => expect(v).toBe(6))
  })
})

describe('the x scale ignores the y formatter', () => {
  const xTicks = (yaxis) =>
    createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [{ data: [[1, 10], [2, 20], [3, 30], [4, 5]] }],
      xaxis: { type: 'numeric', tickAmount: 6 },
      yaxis,
    }).w.globals.xAxisScale.result.length

  it('keeps the x tick count when a y formatter is added', () => {
    expect(xTicks({ labels: { formatter: (v) => String(Math.round(v)) } })).toBe(
      xTicks({}),
    )
  })

  it('renders with a y formatter that reads its w argument', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line', width: 600, height: 300 },
      series: [{ data: [10, 20, 30, 5] }],
      yaxis: { labels: { formatter: (v, i, w) => w.config.chart.type + v } },
    })
    const labels = chart.el.querySelectorAll('.apexcharts-yaxis-label')
    expect(labels.length).toBeGreaterThan(0)
    expect(labels[0].textContent).toMatch(/^line/)
  })
})
