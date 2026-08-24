import Scales from '../../src/modules/Scales.js'
import CoreUtils from '../../src/modules/CoreUtils.js'
import { createChartWithOptions } from './utils/utils.js'

// Regression tests for the logarithmic y-axis. The log axis is currently built
// from three pieces that each hold part of the truth: Scales generates the tick
// VALUES, CoreUtils.getLogSeries transforms the data into normalised space, and
// CoreUtils.getLogYRatios derives a pixel ratio. These tests pin the seams that
// were provably wrong; the "ink agrees with labels" invariant that ties all
// three together is a separate, larger piece of work.

function scalesFor(options) {
  const chart = createChartWithOptions(options)
  return { chart, s: new Scales(chart.w) }
}

// ─────────────────────────────────────────────────────────────────────────────
// _logDomainSpan / small-magnitude domains (#1341)
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales._logDomainSpan', () => {
  it('measures the domain in multiples of the base, not linear distance', () => {
    const { s } = scalesFor({
      chart: { type: 'line' },
      series: [{ data: [1, 100] }],
    })
    expect(s._logDomainSpan(1, 100, 10)).toBeCloseTo(2)
    expect(s._logDomainSpan(1, 1000, 10)).toBeCloseTo(3)
    // Same span, six orders of magnitude smaller. This is the case the old
    // linear `range <= 5` test could not see.
    expect(s._logDomainSpan(1e-5, 1e-3, 10)).toBeCloseTo(2)
  })

  it('reports less than one base multiple for a degenerate domain', () => {
    const { s } = scalesFor({
      chart: { type: 'line' },
      series: [{ data: [1, 3] }],
    })
    expect(s._logDomainSpan(1, 3, 10)).toBeLessThan(1)
  })

  it('does not divide by Math.log(1) for a degenerate base', () => {
    const { s } = scalesFor({
      chart: { type: 'line' },
      series: [{ data: [1, 100] }],
    })
    expect(s._logDomainSpan(1, 100, 1)).toBe(0)
    expect(s._logDomainSpan(1, 100, 0)).toBeCloseTo(2) // 0 -> default base 10
  })

  it('returns a finite span for non-positive bounds', () => {
    const { s } = scalesFor({
      chart: { type: 'line' },
      series: [{ data: [1, 100] }],
    })
    expect(isFinite(s._logDomainSpan(-10, 100, 10))).toBe(true)
    expect(isFinite(s._logDomainSpan(-10, -1, 10))).toBe(true)
  })
})

describe('log scale on small-magnitude domains (#1341)', () => {
  it('keeps the log scale when the domain spans decades below 1', () => {
    // |1e-3 - 1e-5| is 0.00099, which the old `range <= 5` guard read as
    // "degenerate" and silently demoted to a linear scale, ignoring
    // logarithmic: true without warning.
    const { chart, s } = scalesFor({
      chart: { type: 'line' },
      series: [{ data: [1e-5, 1e-4, 1e-3] }],
      yaxis: { logarithmic: true },
    })
    s.setYScaleForIndex(0, 1e-5, 1e-3)

    expect(chart.w.globals.invalidLogScale).toBe(false)

    const { result } = chart.w.globals.yAxisScale[0]
    // A log scale over two decades gives geometric, not arithmetic, spacing.
    // Consecutive ratios are constant; consecutive differences are not.
    expect(result.length).toBeGreaterThanOrEqual(3)
    const ratios = []
    for (let i = 1; i < result.length; i++) {
      ratios.push(result[i] / result[i - 1])
    }
    ratios.forEach((r) => expect(r).toBeCloseTo(ratios[0], 5))
  })

  it('still demotes a genuinely degenerate domain to linear', () => {
    const { chart, s } = scalesFor({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
      yaxis: { logarithmic: true },
    })
    s.setYScaleForIndex(0, 1, 3)
    expect(chart.w.globals.invalidLogScale).toBe(true)
  })

  it('keeps the log scale for domains that already had one (back-compat)', () => {
    // range > 5 is retained as an escape hatch, so nothing that renders a log
    // scale today loses it.
    const cases = [
      [10, 1000],
      [1, 100],
      [1, 8], // span 0.9 base multiples, but linear range 7
    ]
    cases.forEach(([min, max]) => {
      const { chart, s } = scalesFor({
        chart: { type: 'line' },
        series: [{ data: [min, max] }],
        yaxis: { logarithmic: true },
      })
      s.setYScaleForIndex(0, min, max)
      expect(chart.w.globals.invalidLogScale).toBe(false)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// tickAmount on a log axis (#4873, #3345)
//
// tickAmount counts INTERVALS everywhere else in the library, so N yields
// N + 1 labels. It never reached the log generators, so a log axis printed one
// label per multiple of the base whatever was configured.
// ─────────────────────────────────────────────────────────────────────────────

function labelCount() {
  const axis = document.querySelector('.apexcharts-yaxis')
  return axis.querySelectorAll('.apexcharts-yaxis-texts-g text').length
}

function logChart(yaxis, series = [{ data: [1, 1000, 1000000, 1000000000] }]) {
  return createChartWithOptions({
    chart: { type: 'line', width: 600, height: 400 },
    series,
    yaxis: { logarithmic: true, ...yaxis },
  })
}

describe('log axis honours tickAmount', () => {
  // nine decades: an unconstrained axis prints ten labels here, so any honoured
  // tickAmount below nine has to visibly reduce the count
  it('emits tickAmount + 1 labels, matching the linear convention', () => {
    ;[2, 3, 4, 6].forEach((tickAmount) => {
      logChart({ tickAmount })
      expect(labelCount()).toBe(tickAmount + 1)
    })
  })

  it('agrees with a linear axis given the same tickAmount', () => {
    logChart({ tickAmount: 4 })
    const logLabels = labelCount()
    createChartWithOptions({
      chart: { type: 'line', width: 600, height: 400 },
      series: [{ data: [1, 1000, 1000000, 1000000000] }],
      yaxis: { tickAmount: 4 },
    })
    expect(logLabels).toBe(labelCount())
  })

  it('keeps ticks geometrically spaced', () => {
    const chart = logChart({ tickAmount: 4 })
    const r = chart.w.globals.yAxisScale[0].result
    for (let i = 2; i < r.length; i++) {
      expect(r[i] / r[i - 1]).toBeCloseTo(r[1] / r[0], 4)
    }
  })

  it('leaves the count to the domain when tickAmount is unset', () => {
    logChart({})
    expect(labelCount()).toBe(10) // one per decade of 1..1e9
  })

  it('does not move the domain (the ink reads niceMin/niceMax)', () => {
    const unconstrained = logChart({}).w.globals.yAxisScale[0]
    const constrained = logChart({ tickAmount: 3 }).w.globals.yAxisScale[0]
    expect(constrained.niceMin).toBe(unconstrained.niceMin)
    expect(constrained.niceMax).toBe(unconstrained.niceMax)
  })

  it('resolves tickAmount: dataPoints', () => {
    const chart = logChart({ tickAmount: 'dataPoints' })
    expect(chart.w.globals.yAxisScale[0].result.length).toBe(
      chart.w.globals.dataPoints,
    )
  })

  describe('with forceNiceScale', () => {
    it('never exceeds the requested count', () => {
      ;[2, 3, 4, 6].forEach((tickAmount) => {
        logChart({ tickAmount, forceNiceScale: true })
        expect(labelCount()).toBeLessThanOrEqual(tickAmount + 1)
      })
    })

    it('keeps every tick on an exact power of the base', () => {
      const chart = logChart({ tickAmount: 3, forceNiceScale: true })
      chart.w.globals.yAxisScale[0].result.forEach((v) => {
        const exponent = Math.log10(v)
        expect(exponent).toBeCloseTo(Math.round(exponent), 6)
      })
    })

    it('keeps both endpoints and even spacing when thinning', () => {
      const chart = logChart({ tickAmount: 3, forceNiceScale: true })
      const r = chart.w.globals.yAxisScale[0].result
      expect(r[0]).toBe(1)
      expect(r[r.length - 1]).toBe(1000000000)
      // 1, 1e3, 1e6, 1e9 - a constant three-decade stride
      for (let i = 2; i < r.length; i++) {
        expect(r[i] / r[i - 1]).toBeCloseTo(r[1] / r[0], 4)
      }
    })
  })
})

describe('bubble and scatter log axes match line (#3345)', () => {
  const bubbleData = [
    [1, 0, 20],
    [2, 15, 30],
    [3, 500, 25],
    [4, 12000, 40],
  ]

  it('produce the same tick count as a line chart over the same range', () => {
    const counts = ['bubble', 'scatter', 'line'].map((type) => {
      createChartWithOptions({
        chart: { type, width: 600, height: 400 },
        series: [
          {
            name: 'S',
            data:
              type === 'bubble'
                ? bubbleData
                : bubbleData.map(([x, y]) => [x, y]),
          },
        ],
        yaxis: { logarithmic: true },
      })
      return labelCount()
    })
    expect(counts[0]).toBe(counts[2])
    expect(counts[1]).toBe(counts[2])
  })

  it('respect tickAmount so the labels stay readable', () => {
    createChartWithOptions({
      chart: { type: 'bubble', width: 600, height: 400 },
      series: [{ name: 'S', data: bubbleData }],
      yaxis: { logarithmic: true, tickAmount: 2 },
    })
    expect(labelCount()).toBe(3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// getLogYRatios index space and mixed axes (#5035, #2697, #2800)
// ─────────────────────────────────────────────────────────────────────────────

describe('CoreUtils.getLogYRatios', () => {
  // jsdom performs no layout, so w.layout.gridHeight is NaN and every ratio
  // derived from it is NaN whatever the code does. Stub a real grid height so
  // these assertions exercise the arithmetic instead of the environment.
  const GRID_HEIGHT = 300

  function ratiosFor(chart) {
    chart.w.layout.gridHeight = GRID_HEIGHT
    const yRatio = chart.w.globals.yRange.map((r) => r / GRID_HEIGHT)
    return { yRatio, out: new CoreUtils(chart.w).getLogYRatios(yRatio) }
  }

  function mixedLogLinearChart() {
    return createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'Log', data: [1, 100, 10000] },
        { name: 'Linear', data: [10, 20, 30] },
      ],
      yaxis: [
        { seriesName: 'Log', logarithmic: true },
        { seriesName: 'Linear', opposite: true },
      ],
    })
  }

  it('leaves no undefined entry in logYRange for a linear axis', () => {
    // The map callback used to fall out of the bottom for non-log axes, so
    // logYRange[i] was undefined and anything deriving from it became NaN.
    const chart = mixedLogLinearChart()
    ratiosFor(chart)

    const logYRange = chart.w.globals.logYRange
    expect(logYRange.length).toBe(chart.w.globals.yRange.length)
    logYRange.forEach((r) => {
      expect(r).toBeDefined()
      expect(Number.isNaN(r)).toBe(false)
    })
  })

  it('gives the linear axis in a mixed chart its own untouched range', () => {
    const chart = mixedLogLinearChart()
    const { out, yRatio } = ratiosFor(chart)

    // Axis 1 is linear (data 10..30), so its range passes through unchanged and
    // its ratio must equal the plain linear ratio it came in with.
    expect(chart.w.globals.logYRange[1]).toBe(chart.w.globals.yRange[1])
    expect(out[1]).toBeCloseTo(yRatio[1])
  })

  it('returns a finite ratio for every axis', () => {
    const chart = mixedLogLinearChart()
    const { out, yRatio } = ratiosFor(chart)

    expect(out.length).toBe(yRatio.length)
    out.forEach((r) => {
      expect(typeof r).toBe('number')
      expect(isFinite(r)).toBe(true)
    })
  })

  it('resolves the axis config through seriesYAxisReverseMap, not the series index', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [
        { name: 'A', data: [1, 100, 10000] },
        { name: 'B', data: [2, 200, 20000] },
      ],
      yaxis: { logarithmic: true },
    })
    const gl = chart.w.globals
    const { out } = ratiosFor(chart)

    // Every scaled axis slot must resolve to a real axis config.
    gl.yRange.forEach((_, i) => {
      expect(chart.w.config.yaxis[gl.seriesYAxisReverseMap[i]]).toBeDefined()
    })
    gl.logYRange.forEach((r) => {
      expect(r).toBeDefined()
      expect(Number.isNaN(r)).toBe(false)
    })
    out.forEach((r) => expect(isFinite(r)).toBe(true))
  })
})
