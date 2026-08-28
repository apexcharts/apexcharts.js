import { describe, test, expect, vi } from 'vitest'
import { createChartWithOptions } from './utils/utils.js'
import { streamgraphTransform } from '../../src/features/streamgraph'

// `chart.type: 'streamgraph'` is a stacked area on a computed baseline, drawn
// through the range-area pathway. Everything the type adds is in the transform:
// the band order, the baseline, and the accumulation that turns N ordinary
// series into N `[lo, hi]` bands.

const SERIES = [
  { name: 'Alpha', data: [3, 5, 8, 6, 4] },
  { name: 'Beta', data: [7, 6, 2, 3, 9] },
  { name: 'Gamma', data: [1, 4, 5, 9, 2] },
]

/** A throwaway `w` for exercising the transform on its own. */
function fakeW(overrides = {}) {
  const { config, globals, ...rest } = overrides
  return {
    config: { xaxis: {}, plotOptions: {}, ...config },
    globals: { collapsedSeriesIndices: [], ...globals },
    ...rest,
  }
}

/** Run the transform over a fresh `w` and hand back both. */
function run(series = SERIES, overrides = {}) {
  const w = fakeW(overrides)
  const out = streamgraphTransform(
    series.map((s) => ({ ...s, data: s.data.slice() })),
    w,
  )
  return { out, w, data: w.streamgraphData }
}

/** Every band's `[lo, hi]` at column j, bottom band first. */
function columnBands(data, j) {
  return data.order.map((k) => [data.lows[k][j], data.highs[k][j]])
}

describe('Accumulation: N series become N bands', () => {
  test('each band spans exactly its own value', () => {
    const { out, data } = run()

    out.forEach((s, k) => {
      s.data.forEach((d, j) => {
        expect(d.y[1] - d.y[0]).toBeCloseTo(data.values[k][j], 10)
      })
    })
  })

  test('a band top IS the next band bottom, not a copy of it', () => {
    // The invariant the whole form rests on: the curve interpolators are
    // deterministic and depend only on adjacent points, so identical inputs
    // produce identical geometry and the bands meet with no hairline gap.
    // Recomputing either edge from the values would round differently at some
    // columns and not others.
    const { data } = run()

    for (let j = 0; j < data.xs.length; j++) {
      const bands = columnBands(data, j)
      for (let i = 0; i < bands.length - 1; i++) {
        expect(bands[i][1]).toBe(bands[i + 1][0])
      }
    }
  })

  test('the series keep their names, their count and their order', () => {
    const { out } = run()
    expect(out.map((s) => s.name)).toEqual(['Alpha', 'Beta', 'Gamma'])
  })

  test('x comes from the categories when the data is bare numbers', () => {
    const { data } = run(SERIES, {
      config: { xaxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] } },
    })
    expect(data.xs).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May'])
  })
})

describe('Baselines', () => {
  test('zero puts the bottom band on the zero line', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { offset: 'zero' } } },
    })
    for (let j = 0; j < data.xs.length; j++) {
      expect(columnBands(data, j)[0][0]).toBe(0)
    }
  })

  test('silhouette centres every column on zero', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { offset: 'silhouette' } } },
    })
    for (let j = 0; j < data.xs.length; j++) {
      const bands = columnBands(data, j)
      const lo = bands[0][0]
      const hi = bands[bands.length - 1][1]
      expect(lo + hi).toBeCloseTo(0, 10)
    }
  })

  test('expand normalizes each column to its own total', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { offset: 'expand' } } },
    })
    for (let j = 0; j < data.xs.length; j++) {
      const bands = columnBands(data, j)
      expect(bands[bands.length - 1][1]).toBeCloseTo(1, 10)
    }
  })

  test('expand reports the values the reader gave, not the shares', () => {
    // The tooltip and the band labels read `values`, so normalizing in place
    // would have the chart quoting fractions nobody supplied.
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { offset: 'expand' } } },
    })
    expect(data.values[0]).toEqual([3, 5, 8, 6, 4])
  })

  test('wiggle keeps the first column at zero and then drifts', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { offset: 'wiggle' } } },
    })
    const baselines = data.xs.map((_, j) => columnBands(data, j)[0][0])
    expect(baselines[0]).toBe(0)
    expect(baselines.some((b) => b !== 0)).toBe(true)
  })

  test('wiggle flattens the bands more than a zero baseline does', () => {
    // This is the entire reason the form exists: minimizing the total weighted
    // slope has to actually produce less movement than stacking on zero.
    const wobble = (offset) => {
      const { data } = run(SERIES, {
        config: { plotOptions: { streamgraph: { offset } } },
      })
      let total = 0
      data.order.forEach((k) => {
        for (let j = 1; j < data.xs.length; j++) {
          const dLo = data.lows[k][j] - data.lows[k][j - 1]
          const dHi = data.highs[k][j] - data.highs[k][j - 1]
          total += Math.abs(dLo) + Math.abs(dHi)
        }
      })
      return total
    }
    expect(wobble('wiggle')).toBeLessThan(wobble('zero'))
  })

  test('an unknown offset falls back to wiggle rather than flat-lining', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { offset: 'nonsense' } } },
    })
    expect(data.offset).toBe('wiggle')
  })
})

describe('Band order', () => {
  test('none keeps the series order, bottom first', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { order: 'none' } } },
    })
    expect(data.order).toEqual([0, 1, 2])
  })

  test('inverse reverses it', () => {
    const { data } = run(SERIES, {
      config: { plotOptions: { streamgraph: { order: 'inverse' } } },
    })
    expect(data.order).toEqual([2, 1, 0])
  })

  test('inside-out is a permutation of every visible band', () => {
    const { data } = run()
    expect(data.order.slice().sort()).toEqual([0, 1, 2])
  })

  test('inside-out seats the earliest peak in the middle and fans later ones out', () => {
    // Five equal-sum series peaking one column apart, so only the peak times
    // can decide. The middle of the stack is the part a wiggle baseline moves
    // least, and it goes to the band that peaks first.
    const series = [0, 1, 2, 3, 4].map((p) => ({
      name: `P${p}`,
      data: [0, 1, 2, 3, 4].map((j) => (j === p ? 10 : 1)),
    }))
    const { data } = run(series)

    expect(data.names[data.order[2]]).toBe('P0')
    const edges = [data.names[data.order[0]], data.names[data.order[4]]].sort()
    expect(edges).toEqual(['P3', 'P4'])
  })

  test('the order is stable across repeated renders', () => {
    // An unstable sort would reshuffle the bands on every resize.
    const first = run().data.order
    const second = run().data.order
    expect(second).toEqual(first)
  })
})

describe('Ragged and hostile input', () => {
  test('a column a series never mentions contributes zero, not NaN', () => {
    // One NaN in the accumulator poisons every band above it for the rest of
    // the row, so a missing column has to floor rather than propagate.
    const series = [
      {
        name: 'Full',
        data: [
          { x: 1, y: 5 },
          { x: 2, y: 6 },
          { x: 3, y: 7 },
        ],
      },
      { name: 'Partial', data: [{ x: 2, y: 4 }] },
    ]
    const { out, data } = run(series)

    expect(data.xs).toEqual([1, 2, 3])
    expect(data.values[1]).toEqual([0, 4, 0])
    out.forEach((s) =>
      s.data.forEach((d) => {
        expect(Number.isFinite(d.y[0])).toBe(true)
        expect(Number.isFinite(d.y[1])).toBe(true)
      }),
    )
  })

  test('nulls are holes of zero thickness, not gaps in the surface', () => {
    const { out } = run([
      { name: 'A', data: [3, null, 3] },
      { name: 'B', data: [2, 2, 2] },
    ])
    expect(out[0].data[1].y[1] - out[0].data[1].y[0]).toBe(0)
    expect(out[1].data[1].y[1] - out[1].data[1].y[0]).toBe(2)
  })

  test('columns are joined on x, never on position', () => {
    // Two series written in different orders is ordinary; an ordinal join would
    // stack a value onto the wrong column rather than failing.
    const series = [
      {
        name: 'A',
        data: [
          { x: 1, y: 10 },
          { x: 2, y: 20 },
        ],
      },
      {
        name: 'B',
        data: [
          { x: 2, y: 200 },
          { x: 1, y: 100 },
        ],
      },
    ]
    const { data } = run(series)
    expect(data.xs).toEqual([1, 2])
    expect(data.values[1]).toEqual([100, 200])
  })

  test('out-of-order numeric columns are sorted before the baseline is solved', () => {
    // The wiggle baseline is defined on ADJACENT columns, so an out-of-order
    // column feeds it a difference between two periods that are not neighbours.
    const series = [
      {
        name: 'A',
        data: [
          { x: 3, y: 1 },
          { x: 1, y: 2 },
          { x: 2, y: 3 },
        ],
      },
    ]
    const { data } = run(series)
    expect(data.xs).toEqual([1, 2, 3])
    expect(data.values[0]).toEqual([2, 3, 1])
  })

  test('negatives are floored at zero, with one warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { data } = run([{ name: 'A', data: [5, -3, 2] }])
    expect(data.values[0]).toEqual([5, 0, 2])
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  test('already-stacked bands pass straight through', () => {
    // parseData writes the transform's output back to config.series, so this is
    // the backstop for a lost raw stash: re-stacking already-stacked bands
    // would silently draw nonsense.
    const paired = [{ name: 'A', data: [{ x: 1, y: [0, 5] }] }]
    const w = fakeW()
    const out = streamgraphTransform(paired, w)
    expect(out).toBe(paired)
    expect(w.streamgraphData).toBe(null)
  })

  test('re-running over its own output does not stack a second time', () => {
    const w = fakeW()
    const input = SERIES.map((s) => ({ ...s, data: s.data.slice() }))
    const first = streamgraphTransform(input, w)
    // parseData assigns the result back to config.series; the next render hands
    // that back in.
    const second = streamgraphTransform(first, w)
    expect(second[0].data.map((d) => d.y)).toEqual(
      first[0].data.map((d) => d.y),
    )
  })
})

describe('Legend collapse', () => {
  test('a collapsed band leaves the stack and the rest close up', () => {
    const { data: full } = run()
    const { out, data } = run(SERIES, {
      globals: { collapsedSeriesIndices: [1] },
    })

    expect(data.order).not.toContain(1)
    expect(data.hidden).toEqual([1])
    expect(out[1].data).toEqual([])
    // The remaining bands are re-solved, not merely shifted: the surface at
    // every column is now exactly the two surviving values thick.
    for (let j = 0; j < data.xs.length; j++) {
      const bands = columnBands(data, j)
      const thickness = bands[bands.length - 1][1] - bands[0][0]
      expect(thickness).toBeCloseTo(data.values[0][j] + data.values[2][j], 10)
    }
    expect(full.order).toContain(1)
  })

  test('the collapsed band keeps its name for the legend', () => {
    const { data } = run(SERIES, {
      globals: { collapsedSeriesIndices: [1] },
    })
    expect(data.names[1]).toBe('Beta')
  })
})

describe('Wiring: the alias reaches the range-area pathway', () => {
  test('the type normalizes to rangeArea and remembers what was asked for', () => {
    const chart = createChartWithOptions({
      chart: { type: 'streamgraph', width: 700, height: 400 },
      series: SERIES,
    })
    expect(chart.w.config.chart.type).toBe('rangeArea')
    expect(chart.w.config.chart.requestedType).toBe('streamgraph')
    // Stacking is the transform's job here and would fight the range pathway.
    expect(chart.w.config.chart.stacked).toBe(false)
  })

  test('the defaults hide the y-axis, keep the legend, and open the fill', () => {
    const chart = createChartWithOptions({
      chart: { type: 'streamgraph', width: 700, height: 400 },
      series: SERIES,
    })
    expect(chart.w.config.yaxis[0].show).toBe(false)
    // The legend is the only clickable thing on a streamgraph, and pulling a
    // band out to watch the baseline re-solve is most of what there is to do.
    expect(chart.w.config.legend.show).toBe(true)
    expect(chart.w.config.fill.opacity).toBe(1)
    // Any stroke at all draws a seam down every band boundary.
    expect(chart.w.config.stroke.width).toBe(0)
    // monotoneCubic, not 'smooth': smooth puts an inflection at every point,
    // so a band that simply declines is drawn as a run of S-curves and appears
    // to stall and dip on the way down. Fritsch-Carlson is shape preserving.
    expect(chart.w.config.stroke.curve).toBe('monotoneCubic')
  })

  test('the chart parses as range data, so the y domain covers the bands', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'streamgraph',
        width: 700,
        height: 400,
        animations: { enabled: false },
      },
      series: SERIES,
    })
    const data = chart.w.streamgraphData
    expect(data).toBeTruthy()
    expect(chart.w.axisFlags.isRangeData).toBe(true)

    let lo = Infinity
    let hi = -Infinity
    data.order.forEach((k) => {
      data.lows[k].forEach((v) => (lo = Math.min(lo, v)))
      data.highs[k].forEach((v) => (hi = Math.max(hi, v)))
    })
    expect(chart.w.globals.minY).toBeLessThanOrEqual(lo)
    expect(chart.w.globals.maxY).toBeGreaterThanOrEqual(hi)
  })

  test('a chart that stops being a streamgraph drops the band data', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'streamgraph',
        width: 700,
        height: 400,
        animations: { enabled: false },
      },
      series: SERIES,
    })
    expect(chart.w.streamgraphData).toBeTruthy()

    chart.w.config.chart.requestedType = undefined
    chart.w.config.chart.type = 'area'
    chart.data.applySeriesTransform(chart.w.config.series)
    // Left behind, the band values would have a plain area chart writing the
    // names of a streamgraph it used to be.
    expect(chart.w.streamgraphData).toBe(null)
  })
})
