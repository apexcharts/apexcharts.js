/**
 * TrellisFrames: the histogram bin frame and the violin bandwidth are derived
 * from the UNION sample of every panel. That union is built in one pass, not
 * by re-copying the growing array once per series (60 panels x 3 series x
 * 5,000 observations used to copy about 81M elements), and the frames are
 * exactly what one series holding every observation produces.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildTypeFrames } from '../../src/modules/trellis/TrellisFrames'

const PANELS = 60
const SERIES = 3

// Deterministic pseudo-random sample.
let seed = 7
const rnd = () => {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}
const sample = (n, shift) =>
  Array.from({ length: n }, () => Math.round((rnd() * 40 + shift) * 10) / 10)

const histogramSplit = () => ({
  panels: Array.from({ length: PANELS }, (_, p) => ({
    key: `P${p}`,
    series: Array.from({ length: SERIES }, (_, s) => ({
      name: `S${s}`,
      data: sample(40, p % 7),
    })),
  })),
})

const violinSplit = () => ({
  panels: Array.from({ length: PANELS }, (_, p) => ({
    key: `P${p}`,
    series: Array.from({ length: SERIES }, (_, s) => ({
      name: `S${s}`,
      data: [
        { x: 'a', y: sample(30, p % 5) },
        { x: 'b', y: sample(30, s) },
      ],
    })),
  })),
})

/** The same observations as ONE panel with ONE series. */
const flatten = (split, pick) => ({
  panels: [
    {
      key: 'all',
      series: [
        {
          name: 'all',
          data: split.panels.flatMap((p) => p.series.flatMap(pick)),
        },
      ],
    },
  ],
})

const host = { plotOptions: { histogram: {}, violin: { kde: {} } } }

afterEach(() => vi.restoreAllMocks())

describe('trellis union sample', () => {
  it('histogram: no per-series concat of the union, frame unchanged', () => {
    const split = histogramSplit()
    const spy = vi.spyOn(Array.prototype, 'concat')
    const frames = buildTypeFrames(split, {}, host, 'histogram')
    const calls = spy.mock.calls.length
    spy.mockRestore()
    expect(calls).toBeLessThan(PANELS)

    const ref = buildTypeFrames(
      flatten(split, (s) => s.data),
      {},
      host,
      'histogram',
    )
    expect(frames.plotOptions).toEqual(ref.plotOptions)
    expect(frames.plotOptions.histogram.binWidth).toBeGreaterThan(0)
  })

  it('violin: no per-series concat of the union, bandwidth unchanged', () => {
    const split = violinSplit()
    const spy = vi.spyOn(Array.prototype, 'concat')
    const frames = buildTypeFrames(split, {}, host, 'violin')
    const calls = spy.mock.calls.length
    spy.mockRestore()
    expect(calls).toBeLessThan(PANELS)

    const ref = buildTypeFrames(
      flatten(split, (s) => s.data),
      {},
      host,
      'violin',
    )
    expect(frames.plotOptions).toEqual(ref.plotOptions)
    expect(frames.plotOptions.violin.kde.bandwidth).toBeGreaterThan(0)
  })
})
