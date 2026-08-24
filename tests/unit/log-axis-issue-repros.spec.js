import { createChartWithOptions } from './utils/utils.js'

// ─────────────────────────────────────────────────────────────────────────────
// Reproductions of the open logarithmic-axis issues, built from each report's
// stated steps. One passes; the other four are pinned with it.fails() so they
// flip red the moment they start working, which is the signal to unpin them.
//
// Each test asserts against the scale oracle (where a value must land, by
// definition) rather than a snapshot. See axis-scale-invariants.spec.js.
// ─────────────────────────────────────────────────────────────────────────────

const W = 600
const H = 400

function render(options) {
  return createChartWithOptions({
    ...options,
    chart: { width: W, height: H, ...(options.chart || {}) },
    stroke: { curve: 'straight', ...(options.stroke || {}) },
  })
}

const lg = (x) => Math.log10(x)
const logPixel = (v, min, max, h) => h * (1 - (lg(v) - lg(min)) / (lg(max) - lg(min)))
const linearPixel = (v, min, max, h) => h * (1 - (v - min) / (max - min))

// `.apexcharts-series` groups are NOT in series order, so index them by
// data:realIndex. For an area series the fill path carries extra
// baseline-closing vertices, so the stroke is the path with the fewest.
function seriesYs() {
  const byIndex = {}
  document.querySelectorAll('.apexcharts-series').forEach((g) => {
    const i = Number(g.getAttribute('data:realIndex'))
    const bars = [...g.querySelectorAll('path.apexcharts-bar-area')]
    if (bars.length) {
      byIndex[i] = bars.map((b) => {
        const ys = [...(b.getAttribute('d') || '').matchAll(/[-\d.]+\s+([-\d.]+)/g)]
          .map((m) => +m[1])
        return ys.length ? Math.min(...ys) : null
      })
      return
    }
    const paths = [
      ...g.querySelectorAll('path.apexcharts-line, path.apexcharts-area'),
    ]
      .map((p) =>
        [...(p.getAttribute('d') || '')
          .matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map((m) => +m[2]),
      )
      .filter((pts) => pts.length)
    if (paths.length) {
      byIndex[i] = paths.sort((a, b) => a.length - b.length)[0]
    }
  })
  return byIndex
}

const axisOf = (chart, seriesIndex) =>
  chart.w.globals.seriesYAxisReverseMap[seriesIndex]

const isLog = (chart, axisIndex) =>
  !!chart.w.config.yaxis[axisIndex]?.logarithmic

// ─────────────────────────────────────────────────────────────────────────────

describe('#4166 two series on a single log axis', () => {
  // "Each of the series works individually, but when I add both series to the
  // chart, the visualization gets bugged."
  it('places both series against one shared domain', () => {
    const a = [1, 10, 100]
    const b = [1000, 10000, 100000]
    const chart = render({
      chart: { type: 'line' },
      series: [{ name: 'A', data: a }, { name: 'B', data: b }],
      yaxis: { logarithmic: true },
    })
    const h = chart.w.layout.gridHeight
    const ys = seriesYs()

    // one visible axis, so both series must resolve through it
    expect(axisOf(chart, 0)).toBe(0)
    expect(axisOf(chart, 1)).toBe(0)

    const { niceMin, niceMax } = chart.w.globals.yAxisScale[0]
    expect(niceMin).toBe(1)
    expect(niceMax).toBe(100000)

    a.forEach((v, i) =>
      expect(ys[0][i]).toBeCloseTo(logPixel(v, niceMin, niceMax, h), 1))
    b.forEach((v, i) =>
      expect(ys[1][i]).toBeCloseTo(logPixel(v, niceMin, niceMax, h), 1))
  })
})

describe('#5035 log and linear axes with more series than axes', () => {
  // Config.extendYAxis rewrites a log chart's yaxis array to one axis per
  // series whenever the counts differ, which discards an explicit
  // seriesName ARRAY grouping. Two axes become three, and the series land on
  // the wrong ones: Logarithmic2 is drawn linearly, Linear1 logarithmically.
  it.fails('KNOWN BROKEN - honours an explicit series-to-axis assignment', () => {
    const chart = render({
      chart: { type: 'line' },
      series: [
        { name: 'Logarithmic1', data: [1, 100, 10000] },
        { name: 'Logarithmic2', data: [5, 500, 50000] },
        { name: 'Linear1', data: [10, 20, 30] },
      ],
      yaxis: [
        { seriesName: ['Logarithmic1', 'Logarithmic2'], logarithmic: true },
        { seriesName: 'Linear1', opposite: true },
      ],
    })

    // the user configured two axes; the rewrite makes three
    expect(chart.w.config.yaxis.length).toBe(2)
    // both log series share axis 0, the linear series is on axis 1
    expect(axisOf(chart, 0)).toBe(0)
    expect(axisOf(chart, 1)).toBe(0)
    expect(axisOf(chart, 2)).toBe(1)
    expect(isLog(chart, axisOf(chart, 1))).toBe(true)
    expect(isLog(chart, axisOf(chart, 2))).toBe(false)
  })
})

describe('#2697 log line beside a linear bar series', () => {
  // "Line is displayed, Bar is not-displayed." The log line is now exact; the
  // linear bars collapse to ~4px against a 339px grid.
  it('places the log line exactly', () => {
    const data = [10, 1000, 100000]
    const chart = render({
      chart: { type: 'line' },
      series: [
        { name: 'Line', type: 'line', data },
        { name: 'Bar', type: 'column', data: [20, 40, 60] },
      ],
      yaxis: [
        { seriesName: 'Line', logarithmic: true },
        { seriesName: 'Bar', opposite: true },
      ],
    })
    const h = chart.w.layout.gridHeight
    const { niceMin, niceMax } = chart.w.globals.yAxisScale[0]
    const ys = seriesYs()
    data.forEach((v, i) =>
      expect(ys[0][i]).toBeCloseTo(logPixel(v, niceMin, niceMax, h), 1))
  })

  it.fails('KNOWN BROKEN - gives the linear bars their real height', () => {
    const bars = [20, 40, 60]
    const chart = render({
      chart: { type: 'line' },
      series: [
        { name: 'Line', type: 'line', data: [10, 1000, 100000] },
        { name: 'Bar', type: 'column', data: bars },
      ],
      yaxis: [
        { seriesName: 'Line', logarithmic: true },
        { seriesName: 'Bar', opposite: true },
      ],
    })
    const h = chart.w.layout.gridHeight
    const scale = chart.w.globals.yAxisScale[axisOf(chart, 1)]
    const ys = seriesYs()
    bars.forEach((v, i) =>
      expect(ys[1][i]).toBeCloseTo(
        linearPixel(v, scale.niceMin, scale.niceMax, h), 1))
  })
})

describe('#2800 log axis on the second of two axes', () => {
  // "the related area chart is not plotted (seems to be constant to 0)".
  // The area lands at y = 0, -33543 and -3387861 on a 339px grid.
  it.fails('KNOWN BROKEN - draws the log area inside the grid', () => {
    const area = [1, 100, 10000]
    const chart = render({
      chart: { type: 'line' },
      series: [
        { name: 'Line', type: 'line', data: [10, 20, 30] },
        { name: 'Area', type: 'area', data: area },
      ],
      yaxis: [
        { seriesName: 'Line' },
        { seriesName: 'Area', logarithmic: true, opposite: true },
      ],
    })
    const h = chart.w.layout.gridHeight
    const scale = chart.w.globals.yAxisScale[axisOf(chart, 1)]
    const ys = seriesYs()

    ys[1].forEach((y) => {
      expect(y).toBeGreaterThanOrEqual(-1)
      expect(y).toBeLessThanOrEqual(h + 1)
    })
    area.forEach((v, i) =>
      expect(ys[1][i]).toBeCloseTo(
        logPixel(v, scale.niceMin, scale.niceMax, h), 1))
  })
})

describe('#3395 appending a series to a log chart', () => {
  // getLogVal(b, d, seriesIndex) reads minYArr[seriesIndex]/maxYArr[seriesIndex],
  // but those arrays are populated per AXIS. After updateSeries adds a second
  // series to a single-axis chart they still have length 1, so getLogVal reads
  // undefined, getBaseLog returns NaN, and the new series transforms to
  // [NaN, NaN, NaN] - a one-vertex path that draws nothing.
  it.fails('KNOWN BROKEN - draws a series added by updateSeries', () => {
    const added = [2, 200, 20000]
    const chart = render({
      chart: { type: 'line' },
      series: [{ name: 'A', data: [1, 100, 10000] }],
      yaxis: { logarithmic: true },
    })
    chart.updateSeries([
      { name: 'A', data: [1, 100, 10000] },
      { name: 'B', data: added },
    ])

    const h = chart.w.layout.gridHeight
    const { niceMin, niceMax } = chart.w.globals.yAxisScale[0]
    const ys = seriesYs()

    // no NaN may reach the transform
    chart.w.globals.seriesLog.forEach((s) =>
      s.forEach((v) => expect(Number.isNaN(v)).toBe(false)))

    expect(ys[1].length).toBe(added.length)
    added.forEach((v, i) =>
      expect(ys[1][i]).toBeCloseTo(logPixel(v, niceMin, niceMax, h), 1))
  })

  it('still places the original series correctly after the update', () => {
    const original = [1, 100, 10000]
    const chart = render({
      chart: { type: 'line' },
      series: [{ name: 'A', data: original }],
      yaxis: { logarithmic: true },
    })
    chart.updateSeries([
      { name: 'A', data: original },
      { name: 'B', data: [2, 200, 20000] },
    ])
    const h = chart.w.layout.gridHeight
    const { niceMin, niceMax } = chart.w.globals.yAxisScale[0]
    const ys = seriesYs()
    // the domain grew to include the new series' maximum
    expect(niceMax).toBe(20000)
    original.forEach((v, i) =>
      expect(ys[0][i]).toBeCloseTo(logPixel(v, niceMin, niceMax, h), 1))
  })
})
