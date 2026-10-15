/**
 * The raw-sample transforms (boxPlot, violin, raincloud) derive a statistic
 * from every datum's observations on every parse. A re-render that changes
 * neither the sample nor the options that shape it (a resize, a legend click,
 * a title change) must reuse the last result instead of sorting the sample and
 * evaluating the kernel again. Counted by `Math.exp` calls (the KDE) and by
 * sorts of a sample-sized array (the five-number summary).
 */
import { vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
// Not in the default bundle since 8.0, so imported the way an app would.
import '../../src/entries/violin.js'
import { boxPlotTransform, violinTransform } from '../../src/features/stats'
import { raincloudTransform } from '../../src/features/raincloud'

const N = 120

function sample(seed = 7, n = N) {
  const out = []
  for (let i = 0; i < n; i++) {
    seed = (seed * 16807) % 2147483647
    out.push(10 + (seed % 400) / 10)
  }
  return out
}

/** Calls of Math.exp while `fn` runs: the KDE's whole cost. */
function expCalls(fn) {
  const spy = vi.spyOn(Math, 'exp')
  try {
    fn()
    return spy.mock.calls.length
  } finally {
    spy.mockRestore()
  }
}

/** Sorts of an N-long array while `fn` runs: the summary's whole cost. */
function sampleSorts(fn) {
  const orig = Array.prototype.sort
  let count = 0
  Array.prototype.sort = function (...args) {
    if (this.length === N) count++
    return orig.apply(this, args)
  }
  try {
    fn()
    return count
  } finally {
    Array.prototype.sort = orig
  }
}

const stubW = (plotOptions = {}) => ({ config: { plotOptions } })
// What parseData writes back, and what a legend toggle feeds back: a deep copy.
const clone = (v) => JSON.parse(JSON.stringify(v))

describe('violin transform reuses its density across re-renders', () => {
  const series = () => [
    { name: 'A', data: [{ x: 'G1', points: sample(3) }, { x: 'G2', points: sample(5) }] },
  ]

  it('a second pass over its own output evaluates no kernel', () => {
    const w = stubW()
    let out
    expect(expCalls(() => (out = violinTransform(series(), w)))).toBeGreaterThan(0)
    // the written-back series, and the deep copy a legend toggle passes
    let again
    expect(expCalls(() => (again = violinTransform(out, w)))).toBe(0)
    expect(expCalls(() => violinTransform(clone(out), w))).toBe(0)
    expect(again[0].data[0].y.density).toEqual(out[0].data[0].y.density)
  })

  it('new observations or a kde change recompute', () => {
    const w = stubW()
    const out = violinTransform(series(), w)
    const changed = clone(out)
    changed[0].data[1].points[0] += 1
    // only the datum whose sample moved pays: 64 grid points x N observations
    let next
    expect(expCalls(() => (next = violinTransform(changed, w)))).toBe(64 * N)

    w.config.plotOptions = { violin: { kde: { resolution: 32 } } }
    const n = expCalls(() => violinTransform(clone(next), w))
    expect(n).toBe(2 * 32 * N)
  })

  it('a sample mutated in place after the write-back is not mistaken for the old one', () => {
    // A flat `y` sample comes back as `y.points`, the very array the next pass
    // reads, so a memo holding that array would see its own mutation.
    const w = stubW()
    const out = violinTransform([{ data: [{ x: 'G1', y: sample(3) }] }], w)
    const before = out[0].data[0].y.density
    out[0].data[0].y.points.push(500)
    const next = violinTransform(out, w)
    expect(next[0].data[0].y.density).not.toEqual(before)
    expect(next[0].data[0].y.density.at(-1)[0]).toBeGreaterThan(500)
  })
})

describe('boxPlot transform reuses its summary across re-renders', () => {
  const series = () => [{ name: 'A', data: [{ x: 'G1', points: sample(9) }] }]

  it('a second pass does not sort the sample again; a whisker change does', () => {
    const w = stubW()
    let out
    expect(sampleSorts(() => (out = boxPlotTransform(series(), w)))).toBe(1)
    expect(sampleSorts(() => boxPlotTransform(clone(out), w))).toBe(0)
    w.config.plotOptions = { boxPlot: { whiskers: 'tukey' } }
    expect(sampleSorts(() => boxPlotTransform(clone(out), w))).toBe(1)
  })
})

describe('raincloud transform reuses density and summary', () => {
  it('a second pass derives nothing', () => {
    const w = stubW({ violin: { box: { whiskers: 'tukey' } } })
    const out = raincloudTransform([{ data: [{ x: 'G1', points: sample(13) }] }], w)
    let exp = -1
    const sorts = sampleSorts(() => {
      exp = expCalls(() => raincloudTransform(clone(out), w))
    })
    expect(exp).toBe(0)
    expect(sorts).toBe(0)
  })
})

describe('a live violin chart', () => {
  it('a legend toggle and an unrelated option change evaluate no kernel', async () => {
    const chart = createChartWithOptions({
      chart: { type: 'violin', animations: { enabled: false } },
      series: [
        { name: 'A', data: [{ x: 'G1', points: sample(3) }] },
        { name: 'B', data: [{ x: 'G1', points: sample(4) }] },
      ],
    })
    const density = chart.w.violinData.seriesViolinDensity[0][0].weights.slice()
    expect(
      expCalls(() => chart.updateOptions({ title: { text: 'again' } })),
    ).toBe(0)
    expect(expCalls(() => chart.toggleSeries('B'))).toBe(0)
    expect(chart.w.violinData.seriesViolinDensity[0][0].weights).toEqual(density)
  })
})
