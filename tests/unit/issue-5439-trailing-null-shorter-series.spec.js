import { describe, it, expect } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'

/**
 * #5439: a series ending in null, drawn beside a longer series, lost its whole
 * line on a numeric or datetime x axis.
 *
 * The loop runs to the longest series, so past this series' end its values are
 * undefined. The trailing null reset the segment state, and every undefined
 * point after it then opened a new "isolated point" subpath at x = NaN (the
 * series has no x there). Since #3249 all subpaths share one `d`, and a `d`
 * containing NaN is blanked whole, taking the real segment with it.
 */

const D = 86400000
const t0 = Date.UTC(2024, 0, 1)

/** @param {any} opts */
function shortSeriesD(opts) {
  createChartWithOptions({
    chart: {
      type: opts.type,
      width: 600,
      height: 300,
      animations: { enabled: false },
    },
    stroke: { curve: opts.curve ?? 'straight' },
    xaxis: opts.xaxis,
    series: [
      { name: 'short', data: opts.short },
      { name: 'long', data: opts.long },
    ],
  })
  const cls = opts.type === 'area' ? 'apexcharts-area' : 'apexcharts-line'
  return [
    ...document.querySelectorAll(
      `.apexcharts-series[seriesName="short"] path.${cls}`,
    ),
  ].map((p) => p.getAttribute('d'))
}

/** @param {string} d */
const drawsSegment = (d) => /[LCHV]/.test(d) && !/NaN|undefined/.test(d)

const long = Array.from({ length: 6 }, (_, i) => [t0 + i * D, 20 + i])

describe('Issue 5439: trailing null in a shorter series', () => {
  for (const type of ['line', 'area']) {
    for (const curve of ['straight', 'smooth', 'stepline', 'monotoneCubic']) {
      it(`${type}/${curve}: datetime x, duplicate x on the null (reporter data)`, () => {
        const ds = shortSeriesD({
          type,
          curve,
          xaxis: { type: 'datetime' },
          short: [
            [t0, 10],
            [t0 + D, 10],
            [t0 + D, null],
          ],
          long,
        })
        expect(ds.length).toBeGreaterThan(0)
        expect(ds.every(drawsSegment)).toBe(true)
      })
    }
  }

  it('numeric x, plain trailing null', () => {
    const ds = shortSeriesD({
      type: 'line',
      xaxis: { type: 'numeric' },
      short: [
        [0, 10],
        [1, 10],
        [2, null],
      ],
      long: long.map((p, i) => [i, p[1]]),
    })
    expect(ds.every(drawsSegment)).toBe(true)
  })

  it('a null mid-series still splits it, and nothing is drawn past its end', () => {
    const ds = shortSeriesD({
      type: 'line',
      xaxis: { type: 'datetime' },
      short: [
        [t0, 10],
        [t0 + D, 12],
        [t0 + 2 * D, null],
        [t0 + 3 * D, 14],
        [t0 + 4 * D, null],
      ],
      long,
    })
    expect(ds).toHaveLength(1)
    // one real two-point segment, then the isolated point at day 3; no
    // subpath beyond the series' own last x
    const moves = ds[0].match(/M/g) ?? []
    expect(drawsSegment(ds[0])).toBe(true)
    expect(moves.length).toBeLessThanOrEqual(3)
  })

  it('category x draws no stray subpaths past the series end', () => {
    const ds = shortSeriesD({
      type: 'line',
      xaxis: { categories: ['a', 'b', 'c', 'd', 'e', 'f'] },
      short: [10, 10, null],
      long: [20, 21, 22, 23, 24, 25],
    })
    expect(ds).toHaveLength(1)
    expect(drawsSegment(ds[0])).toBe(true)
    // the segment plus its closing move, nothing at categories d-f
    expect(ds[0].match(/M/g)).toHaveLength(2)
  })
})
