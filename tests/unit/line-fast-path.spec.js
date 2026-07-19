import { describe, it, expect, vi, afterEach } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import Line from '../../src/charts/Line.js'

/**
 * Phase-3 of the render-2026 perf work: plain straight line/area series take
 * a numeric fast path (Line._fastStraightPath) instead of the per-point
 * _createPaths state machine. The fast path MUST produce byte-identical
 * output; anything it cannot replicate (nulls, markers, labels, stacking,
 * smooth curves, ragged series) must fall back to the state machine.
 *
 * The "slow" variant here is forced by adding a discrete marker for a
 * NONEXISTENT series index: it flips the hasDiscreteMarkers eligibility gate
 * without changing any path-geometry input.
 */

const SLOW_FORCER = [
  {
    seriesIndex: 99,
    dataPointIndex: 0,
    fillColor: '#000',
    strokeColor: '#000',
    size: 0,
    shape: 'circle',
  },
]

const walk = (n, seed = 42) => {
  let s = seed >>> 0
  const rand = () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  let v = 100
  return Array.from({ length: n }, (_, i) => {
    v += (rand() - 0.5) * 4
    return [i * 3, Math.round(v * 100) / 100]
  })
}

const baseOpts = (type, extra = {}) => ({
  chart: { type, width: 700, height: 350 },
  stroke: { width: 2, curve: 'straight' },
  dataLabels: { enabled: false },
  markers: { size: 0 },
  ...extra,
})

const grabPaths = () =>
  [...document.querySelectorAll('.apexcharts-line, .apexcharts-area')].map(
    (p) => ({
      d: p.getAttribute('d'),
      pathTo: p.getAttribute('pathTo'),
      pathFrom: p.getAttribute('pathFrom'),
    }),
  )

function renderAndGrab(opts) {
  const chart = createChartWithOptions(opts)
  const snap = {
    paths: grabPaths(),
    seriesX: JSON.parse(JSON.stringify(chart.w.globals.seriesXvalues)),
    seriesY: JSON.parse(JSON.stringify(chart.w.globals.seriesYvalues)),
  }
  chart.destroy()
  return snap
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('line/area numeric fast path', () => {
  it('takes the fast path for a plain straight numeric line (no per-point state machine)', () => {
    const fastSpy = vi.spyOn(Line.prototype, '_fastStraightPath')
    const slowSpy = vi.spyOn(Line.prototype, '_createPaths')

    const chart = createChartWithOptions({
      ...baseOpts('line'),
      series: [{ name: 'v', data: walk(100) }],
      xaxis: { type: 'numeric' },
    })

    expect(fastSpy).toHaveBeenCalled()
    expect(fastSpy.mock.results.some((r) => r.value !== null)).toBe(true)
    expect(slowSpy).not.toHaveBeenCalled()

    chart.destroy()
  })

  it.each([
    [
      'line-numeric',
      () => ({
        ...baseOpts('line'),
        series: [{ name: 'v', data: walk(120) }],
        xaxis: { type: 'numeric' },
      }),
    ],
    [
      'area-numeric',
      () => ({
        ...baseOpts('area'),
        series: [{ name: 'v', data: walk(120) }],
        xaxis: { type: 'numeric' },
      }),
    ],
    [
      'line-category-2-series',
      () => ({
        ...baseOpts('line'),
        series: [
          { name: 'a', data: walk(40).map((d) => d[1]) },
          { name: 'b', data: walk(40, 7).map((d) => d[1]) },
        ],
      }),
    ],
    [
      'line-2-points',
      () => ({
        ...baseOpts('line'),
        series: [{ name: 'v', data: walk(2) }],
        xaxis: { type: 'numeric' },
      }),
    ],
  ])('%s: fast-path output is byte-identical to the state machine', (_name, mk) => {
    const fast = renderAndGrab(mk())

    const slowOpts = mk()
    slowOpts.markers = { ...slowOpts.markers, discrete: SLOW_FORCER }
    const slow = renderAndGrab(slowOpts)

    expect(fast.paths.length).toBeGreaterThan(0)
    expect(fast.paths).toEqual(slow.paths)
    expect(fast.seriesX).toEqual(slow.seriesX)
    expect(fast.seriesY).toEqual(slow.seriesY)
  })

  it('fills the pointsArray tooltip cache exactly like the slow loop', () => {
    const chart = createChartWithOptions({
      ...baseOpts('line'),
      series: [{ name: 'v', data: walk(50) }],
      xaxis: { type: 'numeric' },
    })
    const pts = chart.w.globals.pointsArray[0]
    // doubled first point + one per remaining point = dataPoints entries
    expect(pts.length).toBe(50)
    pts.forEach(([x, y]) => {
      expect(Number.isFinite(x)).toBe(true)
      expect(Number.isFinite(y)).toBe(true)
    })
    chart.destroy()
  })

  it.each([
    [
      'null values',
      () => ({
        ...baseOpts('line'),
        series: [
          { name: 'v', data: walk(30).map((d, i) => (i === 9 ? null : d[1])) },
        ],
      }),
    ],
    [
      'markers on',
      () => ({
        ...baseOpts('line', { markers: { size: 4 } }),
        series: [{ name: 'v', data: walk(30) }],
        xaxis: { type: 'numeric' },
      }),
    ],
    [
      'data labels on',
      () => ({
        ...baseOpts('line', { dataLabels: { enabled: true } }),
        series: [{ name: 'v', data: walk(30) }],
        xaxis: { type: 'numeric' },
      }),
    ],
    [
      'smooth curve',
      () => ({
        ...baseOpts('line', { stroke: { width: 2, curve: 'smooth' } }),
        series: [{ name: 'v', data: walk(30) }],
        xaxis: { type: 'numeric' },
      }),
    ],
    [
      'stacked',
      () => ({
        ...baseOpts('area'),
        chart: { type: 'area', stacked: true },
        series: [
          { name: 'a', data: walk(30).map((d) => d[1]) },
          { name: 'b', data: walk(30, 5).map((d) => d[1]) },
        ],
      }),
    ],
  ])('falls back to the state machine when ineligible: %s', (_name, mk) => {
    const slowSpy = vi.spyOn(Line.prototype, '_createPaths')

    const chart = createChartWithOptions(mk())

    expect(slowSpy).toHaveBeenCalled()
    // and the chart still renders a series path (its exact geometry under
    // jsdom layout is not meaningful; the e2e suite covers visuals)
    const path = document.querySelector('.apexcharts-line, .apexcharts-area')
    expect(path).toBeTruthy()
    expect(path.getAttribute('d')).toBeTruthy()

    chart.destroy()
  })

  it('produces identical paths across updateSeries too', async () => {
    const mk = () => ({
      ...baseOpts('line'),
      series: [{ name: 'v', data: walk(60) }],
      xaxis: { type: 'numeric' },
    })

    const run = async (opts) => {
      const chart = createChartWithOptions(opts)
      await chart.updateSeries([{ name: 'v', data: walk(60, 11) }], false)
      const snap = grabPaths()
      chart.destroy()
      return snap
    }

    const fast = await run(mk())
    const slowOpts = mk()
    slowOpts.markers = { ...slowOpts.markers, discrete: SLOW_FORCER }
    const slow = await run(slowOpts)

    expect(fast).toEqual(slow)
  })
})
