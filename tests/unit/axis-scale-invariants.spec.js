import { createChartWithOptions } from './utils/utils.js'

// ─────────────────────────────────────────────────────────────────────────────
// Axis scale invariants.
//
// These are ORACLE tests: they assert where a value MUST land from the
// definition of the scale, rather than comparing against a recorded snapshot.
// Nothing else in the suite ties the painted ink to the printed tick labels,
// which is the gap that let a log axis draw a bar 47px away from its own
// gridline (#3046) and a sub-1 domain draw 1.7 million pixels off-canvas.
//
// jsdom performs no layout, so w.layout.gridHeight is NaN and every pixel
// assertion silently passes on "NaN" unless the chart is given explicit
// dimensions. Every chart here sets chart.width/height for that reason.
// ─────────────────────────────────────────────────────────────────────────────

const W = 600
const H = 400
const TOL = 0.5 // px

function render(options) {
  return createChartWithOptions({
    ...options,
    chart: { type: 'line', width: W, height: H, ...(options.chart || {}) },
    // straight segments keep the path as M/L commands we can read points from
    stroke: { curve: 'straight', ...(options.stroke || {}) },
  })
}

/** Every vertex of a series line, in data order. */
function seriesPixels(index = 0) {
  const path = [...document.querySelectorAll('.apexcharts-line')][index]
  const d = path?.getAttribute('d') || ''
  return [...d.matchAll(/[ML]\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/g)].map((m) => ({
    x: +m[1],
    y: +m[2],
  }))
}

/** Rendered y-axis ticks as {value, y}, read back out of the DOM. */
function tickLabels(axisIndex = 0) {
  const axis = [...document.querySelectorAll('.apexcharts-yaxis')][axisIndex]
  return [...axis.querySelectorAll('.apexcharts-yaxis-texts-g text')].map(
    (t) => ({
      // the bare text node duplicates the tspan, so read the tspan
      value: Number(t.querySelector('tspan')?.textContent.replace(/,/g, '')),
      y: Number(t.getAttribute('y')),
    }),
  )
}

// ── The oracles: where a value belongs, by definition of the scale ──────────

const linearPixel = (v, min, max, h) => h * (1 - (v - min) / (max - min))

const logPixel = (v, min, max, h, base = 10) => {
  const lg = (x) => Math.log(x) / Math.log(base)
  return h * (1 - (lg(v) - lg(min)) / (lg(max) - lg(min)))
}

function axisGeometry(chart, index = 0) {
  const scale = chart.w.globals.yAxisScale[index]
  return {
    h: chart.w.layout.gridHeight,
    min: scale.niceMin,
    max: scale.niceMax,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// A log axis places its ink where the scale says
// ─────────────────────────────────────────────────────────────────────────────

describe('log axis: painted ink matches the scale definition', () => {
  const cases = [
    { name: 'four decades', data: [1, 100, 10000] },
    { name: 'under one decade of span', data: [1, 7, 21] },
    { name: 'entirely below 1', data: [1e-5, 1e-4, 1e-3] },
    { name: 'crossing 1', data: [0.01, 1, 100] },
    { name: 'wide, non-round bounds', data: [3, 700, 250000] },
  ]

  cases.forEach(({ name, data }) => {
    it(`places every point correctly: ${name}`, () => {
      const chart = render({
        series: [{ name: 'S', data }],
        yaxis: { logarithmic: true },
      })
      const { h, min, max } = axisGeometry(chart)
      const pts = seriesPixels()

      expect(pts.length).toBe(data.length)
      data.forEach((v, i) => {
        expect(pts[i].y).toBeCloseTo(logPixel(v, min, max, h), 1)
      })
    })
  })

  it('places points correctly when the data does not span the whole domain', () => {
    // The transform normalises against the AXIS domain, not the data extent, so
    // an explicit min/max wider than the data must compress the series
    // accordingly rather than stretch it to fill the plot.
    const chart = render({
      series: [{ name: 'S', data: [10, 100] }],
      yaxis: { logarithmic: true, min: 1, max: 10000 },
    })
    const { h, min, max } = axisGeometry(chart)
    const pts = seriesPixels()

    expect(min).toBe(1)
    expect(max).toBe(10000)
    // 10 is one decade of four, 100 is two of four
    expect(pts[0].y).toBeCloseTo(h * 0.75, 1)
    expect(pts[1].y).toBeCloseTo(h * 0.5, 1)
    expect(pts[0].y).toBeCloseTo(logPixel(10, min, max, h), 1)
    expect(pts[1].y).toBeCloseTo(logPixel(100, min, max, h), 1)
  })

  it('honours a custom logBase', () => {
    const base = 2
    const chart = render({
      series: [{ name: 'S', data: [1, 16, 256] }],
      yaxis: { logarithmic: true, logBase: base },
    })
    const { h, min, max } = axisGeometry(chart)
    const pts = seriesPixels()
    ;[1, 16, 256].forEach((v, i) => {
      expect(pts[i].y).toBeCloseTo(logPixel(v, min, max, h, base), 1)
    })
  })
})

describe('log axis: endpoint and ordering invariants', () => {
  it('puts the domain minimum on the baseline and the maximum on the ceiling', () => {
    const chart = render({
      series: [{ name: 'S', data: [1, 100, 10000] }],
      yaxis: { logarithmic: true },
    })
    const { h, min, max } = axisGeometry(chart)
    const pts = seriesPixels()

    // the data spans the full domain here, so first/last sit on the edges
    expect(min).toBe(1)
    expect(max).toBe(10000)
    expect(pts[0].y).toBeCloseTo(h, 1)
    expect(pts[pts.length - 1].y).toBeCloseTo(0, 1)
  })

  it('is strictly monotonic: a larger value is never painted lower', () => {
    const chart = render({
      series: [{ name: 'S', data: [1, 5, 25, 125, 625, 3125] }],
      yaxis: { logarithmic: true },
    })
    const pts = seriesPixels()
    for (let i = 1; i < pts.length; i++) {
      expect(pts[i].y).toBeLessThan(pts[i - 1].y)
    }
  })

  it('never paints outside the grid', () => {
    // A sub-1 domain used to land at y = -1_710_873 because the log baseline
    // divided a log-space value by a linear data-space ratio.
    const chart = render({
      series: [{ name: 'S', data: [1e-5, 1e-4, 1e-3] }],
      yaxis: { logarithmic: true },
    })
    const h = chart.w.layout.gridHeight
    seriesPixels().forEach((p) => {
      expect(p.y).toBeGreaterThanOrEqual(-TOL)
      expect(p.y).toBeLessThanOrEqual(h + TOL)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// The printed labels describe the same scale as the painted ink
// ─────────────────────────────────────────────────────────────────────────────

describe('log axis: tick labels agree with the ink', () => {
  // Label y carries a constant text-baseline offset that the path does not, so
  // these compare DIFFERENCES between ticks, which the offset cancels out of.
  it('spaces consecutive ticks exactly as the scale requires', () => {
    const chart = render({
      series: [{ name: 'S', data: [1, 100, 10000] }],
      yaxis: { logarithmic: true },
    })
    const { h, min, max } = axisGeometry(chart)
    const ticks = tickLabels()

    expect(ticks.length).toBeGreaterThanOrEqual(3)
    for (let i = 1; i < ticks.length; i++) {
      const actualGap = ticks[i].y - ticks[i - 1].y
      const oracleGap =
        logPixel(ticks[i].value, min, max, h) -
        logPixel(ticks[i - 1].value, min, max, h)
      expect(actualGap).toBeCloseTo(oracleGap, 1)
    }
  })

  it('spans exactly the grid height from first tick to last', () => {
    const chart = render({
      series: [{ name: 'S', data: [1, 100, 10000] }],
      yaxis: { logarithmic: true },
    })
    const h = chart.w.layout.gridHeight
    const ticks = tickLabels()
    const span = Math.abs(ticks[ticks.length - 1].y - ticks[0].y)
    expect(span).toBeCloseTo(h, 1)
  })

  it('powers of the base are evenly spaced', () => {
    const chart = render({
      series: [{ name: 'S', data: [1, 100, 10000] }],
      yaxis: { logarithmic: true },
    })
    const ticks = tickLabels()
    const gaps = []
    for (let i = 1; i < ticks.length; i++) {
      gaps.push(ticks[i].y - ticks[i - 1].y)
    }
    gaps.forEach((g) => expect(g).toBeCloseTo(gaps[0], 1))
  })

  it('a data point lands on the gridline of its own tick value', () => {
    // The headline invariant: value 100 is a rendered tick AND a data point, so
    // the ink and the label must resolve to the same place.
    const chart = render({
      series: [{ name: 'S', data: [1, 100, 10000] }],
      yaxis: { logarithmic: true },
    })
    const ticks = tickLabels()
    const pts = seriesPixels()
    const offset = ticks.find((t) => t.value === 1).y - pts[0].y

    const tick100 = ticks.find((t) => t.value === 100)
    expect(tick100).toBeDefined()
    expect(tick100.y - offset).toBeCloseTo(pts[1].y, 1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// A linear axis must not move. This is the safety net for any future refactor
// of the scale seam: linear output is expected to stay bit-for-bit identical.
// ─────────────────────────────────────────────────────────────────────────────

describe('linear axis: painted ink matches the scale definition', () => {
  const cases = [
    { name: 'from zero', data: [0, 50, 100] },
    { name: 'crossing zero', data: [-50, 0, 50] },
    { name: 'non-zero minimum', data: [1000, 2000, 3000] },
    { name: 'large magnitudes', data: [1e6, 5e6, 9e6] },
  ]

  cases.forEach(({ name, data }) => {
    it(`places every point correctly: ${name}`, () => {
      const chart = render({ series: [{ name: 'S', data }] })
      const { h, min, max } = axisGeometry(chart)
      const pts = seriesPixels()

      data.forEach((v, i) => {
        expect(pts[i].y).toBeCloseTo(linearPixel(v, min, max, h), 1)
      })
    })
  })

  // ── Known pre-existing defect, unrelated to the log scale ──────────────────
  // Some small non-zero-minimum linear domains misplace the point sitting AT
  // the domain maximum, leaving it a few px below its own gridline:
  //
  //   [10, 20, 30]       top point y = 5.684341886080802, gridline y = 0
  //   [-300, -200, -100] top point y = 2.842170943040401, gridline y = 0
  //
  // [0,50,100], [1000,2000,3000] and [1e6,5e6,9e6] are all exact, so it is not
  // a general scale error. 5.684341886080802 is exactly 2^-44 * 1e14, far too
  // large to be double-precision noise at this magnitude, so a precision or
  // rounding path is involved rather than plain accumulation. Only the point
  // exactly at the maximum moves; give the same data a max of 40 and value 30
  // lands on its gridline to the last digit.
  //
  // it.fails() pins this: it goes red the moment the defect is fixed, which is
  // the signal to delete this block and fold the cases back in above.
  const knownBad = [
    { name: 'small non-zero minimum', data: [10, 20, 30] },
    { name: 'all negative', data: [-300, -200, -100] },
  ]

  knownBad.forEach(({ name, data }) => {
    it.fails(`KNOWN DEFECT - max point misplaced: ${name}`, () => {
      const chart = render({ series: [{ name: 'S', data }] })
      const { h, min, max } = axisGeometry(chart)
      const pts = seriesPixels()

      data.forEach((v, i) => {
        expect(pts[i].y).toBeCloseTo(linearPixel(v, min, max, h), 1)
      })
    })
  })

  it('tick labels agree with the ink', () => {
    const chart = render({ series: [{ name: 'S', data: [0, 50, 100] }] })
    const { h, min, max } = axisGeometry(chart)
    const ticks = tickLabels()

    for (let i = 1; i < ticks.length; i++) {
      const actualGap = ticks[i].y - ticks[i - 1].y
      const oracleGap =
        linearPixel(ticks[i].value, min, max, h) -
        linearPixel(ticks[i - 1].value, min, max, h)
      expect(actualGap).toBeCloseTo(oracleGap, 1)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Domain ownership: a scale belongs to an AXIS, not to a series.
//
// Config.extendYAxis currently rewrites a log chart's yaxis array to one axis
// per series (show: false on the manufactured ones), which hands every series
// its own domain. These tests pin the property that rewrite violates.
// ─────────────────────────────────────────────────────────────────────────────

describe('log axis: all series on one axis share one domain', () => {
  it('does not rescale a small series to fill the plot (#4166)', () => {
    // Series A tops out at 100, series B at 1e6. On a single shared y-axis, A's
    // maximum must sit well below the ceiling, not at it.
    const chart = render({
      series: [
        { name: 'A', data: [1, 10, 100] },
        { name: 'B', data: [1, 1000, 1000000] },
      ],
      yaxis: { logarithmic: true },
    })
    const h = chart.w.layout.gridHeight
    const aTop = seriesPixels(0).slice(-1)[0].y

    // 100 out of a 1..1e6 domain is two of six decades, so it belongs at
    // roughly one third of the way up, nowhere near y = 0.
    expect(aTop).toBeGreaterThan(h * 0.5)
  })

  it('paints equal values from different series at the same height', () => {
    const chart = render({
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [10000, 100, 1] },
      ],
      yaxis: { logarithmic: true },
    })
    const a = seriesPixels(0)
    const b = seriesPixels(1)

    // A is 1,100,10000 and B is its reverse, so A[0] and B[2] are both 1,
    // A[1] and B[1] are both 100, A[2] and B[0] are both 10000.
    expect(a[0].y).toBeCloseTo(b[2].y, 1)
    expect(a[1].y).toBeCloseTo(b[1].y, 1)
    expect(a[2].y).toBeCloseTo(b[0].y, 1)
  })
})

describe('mixed log and linear axes stay independent', () => {
  it('resolves each series against its own axis', () => {
    const chart = render({
      series: [
        { name: 'Log', data: [1, 100, 10000] },
        // 1000..3000 rather than 10..30, to steer clear of the unrelated
        // max-point defect pinned above
        { name: 'Linear', data: [1000, 2000, 3000] },
      ],
      yaxis: [
        { seriesName: 'Log', logarithmic: true },
        { seriesName: 'Linear', opposite: true },
      ],
    })
    const h = chart.w.layout.gridHeight
    const logAxis = axisGeometry(chart, 0)
    const linAxis = axisGeometry(chart, 1)

    seriesPixels(0).forEach((p, i) => {
      const v = [1, 100, 10000][i]
      expect(p.y).toBeCloseTo(logPixel(v, logAxis.min, logAxis.max, h), 1)
    })
    seriesPixels(1).forEach((p, i) => {
      const v = [1000, 2000, 3000][i]
      expect(p.y).toBeCloseTo(linearPixel(v, linAxis.min, linAxis.max, h), 1)
    })
  })
})
