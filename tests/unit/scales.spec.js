import Scales from '../../src/modules/Scales.js'
import { createChartWithOptions } from './utils/utils.js'

// Build a minimal w suitable for calling Scales methods directly.
// createChartWithOptions gives us a fully-initialised w so we don't need
// to hand-craft every property.
function makeScales(seriesData, yaxisOverride = {}, chartOverride = {}) {
  const chart = createChartWithOptions({
    chart: { type: 'line', ...chartOverride },
    series: seriesData,
    yaxis: { tickAmount: undefined, ...yaxisOverride },
  })
  return new Scales(chart.w)
}

// ─────────────────────────────────────────────────────────────────────────────
// niceScale
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales.niceScale', () => {
  it('produces ticks that span the requested range', () => {
    const s = makeScales([{ data: [10, 20, 30] }])
    const { result, niceMin, niceMax } = s.niceScale(0, 100)
    expect(niceMin).toBeLessThanOrEqual(0)
    expect(niceMax).toBeGreaterThanOrEqual(100)
    expect(result.length).toBeGreaterThanOrEqual(2)
    // ticks must be strictly increasing
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('niceMin is the first tick and niceMax is the last tick', () => {
    const s = makeScales([{ data: [1, 5, 9] }])
    const { result, niceMin, niceMax } = s.niceScale(1, 9)
    expect(niceMin).toBe(result[0])
    expect(niceMax).toBe(result[result.length - 1])
  })

  it('handles all-zero series (yMin === yMax === 0)', () => {
    const s = makeScales([{ data: [0, 0, 0] }])
    // When all values are 0, MIN_VALUE sentinel is passed
    const { result, niceMin, niceMax } = s.niceScale(Number.MIN_VALUE, 0)
    expect(result.length).toBeGreaterThanOrEqual(2)
    expect(niceMin).toBeLessThanOrEqual(0)
    expect(niceMax).toBeGreaterThanOrEqual(0)
  })

  it('handles all-identical non-zero values (yMin === yMax)', () => {
    const s = makeScales([{ data: [5, 5, 5] }])
    const { result, niceMin, niceMax } = s.niceScale(5, 5)
    // Should expand range so chart is visible
    expect(niceMin).toBeLessThan(5)
    expect(niceMax).toBeGreaterThan(5)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('handles all-negative range', () => {
    const s = makeScales([{ data: [-30, -20, -10] }])
    const { result, niceMin, niceMax } = s.niceScale(-30, -10)
    expect(niceMin).toBeLessThanOrEqual(-30)
    expect(niceMax).toBeGreaterThanOrEqual(-10)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('handles zero-crossing range (negative to positive)', () => {
    const s = makeScales([{ data: [-50, 0, 50] }])
    const { niceMin, niceMax } = s.niceScale(-50, 50)
    expect(niceMin).toBeLessThanOrEqual(-50)
    expect(niceMax).toBeGreaterThanOrEqual(50)
    // zero should be reachable within the tick range
    expect(niceMin).toBeLessThanOrEqual(0)
    expect(niceMax).toBeGreaterThanOrEqual(0)
  })

  it('swaps min and max when min > max and still returns a valid scale', () => {
    const s = makeScales([{ data: [1, 2, 3] }])
    // yMin > yMax — niceScale should swap them
    const { result, niceMin, niceMax } = s.niceScale(100, 10)
    expect(niceMin).toBeLessThanOrEqual(niceMax)
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('respects tickAmount from yaxis config', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 100] }],
      yaxis: { tickAmount: 5 },
    })
    const s = new Scales(chart.w)
    const { result } = s.niceScale(0, 100)
    // With tickAmount: 5 there should be exactly 6 result values (0..100 in 5 steps)
    expect(result.length).toBe(6)
  })

  it('respects explicit min/max from yaxis config via setYScaleForIndex', () => {
    // niceScale itself receives gotMin/gotMax from axisCnf; the config min/max
    // override is applied by setYScaleForIndex which passes the user-supplied
    // values as yMin/yMax arguments.  Verify round-trip via setYScaleForIndex.
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 80] }],
      yaxis: { min: 0, max: 100, tickAmount: 4 },
    })
    const s = new Scales(chart.w)
    s.setYScaleForIndex(0, 0, 100)
    const { niceMin, niceMax } = chart.w.globals.yAxisScale[0]
    expect(niceMin).toBe(0)
    expect(niceMax).toBe(100)
  })

  it('handles very large values without precision errors', () => {
    const s = makeScales([{ data: [1e9, 2e9, 3e9] }])
    const { result, niceMin, niceMax } = s.niceScale(1e9, 3e9)
    expect(niceMin).toBeLessThanOrEqual(1e9)
    expect(niceMax).toBeGreaterThanOrEqual(3e9)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('handles very small decimal values without precision errors', () => {
    const s = makeScales([{ data: [0.001, 0.002, 0.003] }])
    const { result, niceMin, niceMax } = s.niceScale(0.001, 0.003)
    expect(niceMin).toBeLessThanOrEqual(0.001)
    expect(niceMax).toBeGreaterThanOrEqual(0.003)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('snaps yMin to zero when close (proximity heuristic)', () => {
    // yMin is positive but < 15% of the range — should snap to 0
    const s = makeScales([{ data: [2, 50, 100] }])
    // range = 98, yMin/range = 2/98 ≈ 0.02 — well within 15% proximity
    const { niceMin } = s.niceScale(2, 100)
    expect(niceMin).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// linearScale
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales.linearScale', () => {
  it('returns the correct number of ticks', () => {
    const s = makeScales([{ data: [0, 100] }])
    const { result } = s.linearScale(0, 100, 10)
    // linearScale includes both endpoints: ticks + 1 values
    expect(result.length).toBe(11)
  })

  it('first value is yMin and last is yMax', () => {
    const s = makeScales([{ data: [0, 50] }])
    const { result, niceMin, niceMax } = s.linearScale(0, 50, 5)
    expect(result[0]).toBe(0)
    expect(result[result.length - 1]).toBe(50)
    expect(niceMin).toBe(0)
    expect(niceMax).toBe(50)
  })

  it('handles yMin === yMax (flat data)', () => {
    const s = makeScales([{ data: [42, 42] }])
    const { result, niceMin, niceMax } = s.linearScale(42, 42, 5)
    expect(result).toEqual([42])
    expect(niceMin).toBe(42)
    expect(niceMax).toBe(42)
  })

  it('handles negative range correctly', () => {
    const s = makeScales([{ data: [-100, -50] }])
    const { result } = s.linearScale(-100, -50, 5)
    expect(result[0]).toBe(-100)
    expect(result[result.length - 1]).toBe(-50)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('handles zero-crossing range', () => {
    const s = makeScales([{ data: [-50, 50] }])
    const { result } = s.linearScale(-50, 50, 4)
    expect(result[0]).toBe(-50)
    expect(result[result.length - 1]).toBe(50)
  })

  it('ends on yMax when the derived step has to be rounded', () => {
    const s = makeScales([{ data: [0, 200] }])
    // 200 / 19 rounds to 10.53; adding that up gave a last tick of 200.07
    const { result, niceMax } = s.linearScale(0, 200, 19)
    expect(result.length).toBe(20)
    expect(niceMax).toBe(200)
    result.forEach((v, i) => expect(v).toBeCloseTo((i * 200) / 19, 2))

    expect(s.linearScale(1, 8, 3).result).toEqual([1, 3.33, 5.67, 8])
  })

  it('handles a custom step value', () => {
    const s = makeScales([{ data: [0, 30] }])
    const { result } = s.linearScale(0, 30, 3, 0, 10)
    expect(result).toEqual([0, 10, 20, 30])
  })

  it('returns precise values without floating point drift', () => {
    const s = makeScales([{ data: [0, 1] }])
    const { result } = s.linearScale(0, 1, 4)
    // Values should be 0, 0.25, 0.5, 0.75, 1
    result.forEach((v) => {
      expect(isFinite(v)).toBe(true)
      expect(isNaN(v)).toBe(false)
    })
    // No value should exceed the bounds
    expect(result[0]).toBeGreaterThanOrEqual(0)
    expect(result[result.length - 1]).toBeLessThanOrEqual(1)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// logarithmicScaleNice
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales.logarithmicScaleNice', () => {
  it('produces ticks that are powers of the base', () => {
    const s = makeScales([{ data: [1, 1000] }])
    const { result, niceMin, niceMax } = s.logarithmicScaleNice(1, 1000, 10)
    // With base 10: should be [1, 10, 100, 1000]
    expect(result).toEqual([1, 10, 100, 1000])
    expect(niceMin).toBe(1)
    expect(niceMax).toBe(1000)
  })

  it('handles base 2', () => {
    const s = makeScales([{ data: [1, 16] }])
    const { result } = s.logarithmicScaleNice(1, 16, 2)
    expect(result).toEqual([1, 2, 4, 8, 16])
  })

  it('clamps non-positive yMin/yMax to avoid -Infinity in log', () => {
    const s = makeScales([{ data: [1, 100] }])
    // yMin <= 0 should be clamped
    const { result } = s.logarithmicScaleNice(0, 100, 10)
    result.forEach((v) => {
      expect(isFinite(v)).toBe(true)
      expect(v).toBeGreaterThan(0)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// logarithmicScale
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales.logarithmicScale', () => {
  it('first and last values span the input range', () => {
    const s = makeScales([{ data: [10, 10000] }])
    const { niceMin, niceMax } = s.logarithmicScale(10, 10000, 10)
    expect(niceMin).toBe(10)
    expect(niceMax).toBe(10000)
  })

  it('produces a monotonically increasing sequence', () => {
    const s = makeScales([{ data: [1, 1000] }])
    const { result } = s.logarithmicScale(1, 1000, 10)
    for (let i = 1; i < result.length; i++) {
      expect(result[i]).toBeGreaterThan(result[i - 1])
    }
  })

  it('clamps non-positive inputs', () => {
    const s = makeScales([{ data: [1, 100] }])
    const { result } = s.logarithmicScale(-10, 100, 10)
    result.forEach((v) => {
      expect(isFinite(v)).toBe(true)
      expect(v).toBeGreaterThan(0)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// setYScaleForIndex
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales.setYScaleForIndex', () => {
  it('assigns a scale to gl.yAxisScale[index]', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 20, 30] }],
    })
    const s = new Scales(chart.w)
    s.setYScaleForIndex(0, 10, 30)
    const scale = chart.w.globals.yAxisScale[0]
    expect(scale).toBeDefined()
    expect(scale.niceMin).toBeLessThanOrEqual(10)
    expect(scale.niceMax).toBeGreaterThanOrEqual(30)
  })

  it('uses niceScale for normal linear data', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [0, 50, 100] }],
    })
    const s = new Scales(chart.w)
    s.setYScaleForIndex(0, 0, 100)
    const { result } = chart.w.globals.yAxisScale[0]
    expect(result.length).toBeGreaterThanOrEqual(2)
  })

  it('uses logarithmicScale when yaxis.logarithmic is true and range > 5', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [10, 100, 1000] }],
      yaxis: { logarithmic: true },
    })
    const s = new Scales(chart.w)
    s.setYScaleForIndex(0, 10, 1000)
    const { result } = chart.w.globals.yAxisScale[0]
    // Log scale should have far fewer ticks than a linear 10..1000 scale
    expect(result.length).toBeLessThan(20)
  })

  it('falls back to niceScale(MIN_VALUE, 0) when no data (maxY is -MAX_VALUE)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [] }],
    })
    const s = new Scales(chart.w)
    s.setYScaleForIndex(0, Number.MAX_VALUE, -Number.MAX_VALUE)
    const scale = chart.w.globals.yAxisScale[0]
    expect(scale).toBeDefined()
    expect(scale.result.length).toBeGreaterThanOrEqual(2)
  })

  it('marks invalidLogScale when logarithmic with range <= 5', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 3] }],
      yaxis: { logarithmic: true },
    })
    const s = new Scales(chart.w)
    chart.w.globals.invalidLogScale = false
    s.setYScaleForIndex(0, 1, 3)
    expect(chart.w.globals.invalidLogScale).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// setXScale
// ─────────────────────────────────────────────────────────────────────────────

describe('Scales.setXScale', () => {
  it('assigns xAxisScale to globals when data exists', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [1, 2, 3] }],
      xaxis: { type: 'numeric' },
    })
    const s = new Scales(chart.w)
    const scale = s.setXScale(0, 10)
    expect(scale).toBeDefined()
    expect(chart.w.globals.xAxisScale).toBe(scale)
    expect(scale.niceMin).toBe(0)
    expect(scale.niceMax).toBe(10)
  })

  it('falls back to linearScale(0, 10) when maxX is -MAX_VALUE (no data)', () => {
    const chart = createChartWithOptions({
      chart: { type: 'line' },
      series: [{ data: [] }],
    })
    const s = new Scales(chart.w)
    const scale = s.setXScale(0, -Number.MAX_VALUE)
    expect(scale.niceMin).toBe(0)
    expect(scale.niceMax).toBe(10)
  })
})
