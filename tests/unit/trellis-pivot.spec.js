/**
 * Trellis (#22, P2): the tidy-row pivot, pure.
 *
 * pivotRows turns a row table into the series form the split consumes; the
 * facet value rides under the SAME key `trellis.by` names, so everything
 * downstream (union x alignment, ragged padding) is the already-proven path.
 */
import { describe, it, expect } from 'vitest'
import { pivotRows } from '../../src/modules/trellis/pivotRows.js'

const rows = [
  { month: 'Jan', region: 'North', revenue: 10 },
  { month: 'Feb', region: 'North', revenue: 12 },
  { month: 'Jan', region: 'South', revenue: 20 },
  { month: 'Feb', region: 'South', revenue: 22 },
]

describe('pivotRows shapes', () => {
  it('pivots rows into one series per panel, named after the y column', () => {
    const { series, warnings } = pivotRows(rows, {
      by: 'region',
      x: 'month',
      y: 'revenue',
    })
    expect(warnings).toEqual([])
    expect(series).toHaveLength(2)
    expect(series[0]).toEqual({
      name: 'revenue',
      region: 'North',
      data: [
        { x: 'Jan', y: 10 },
        { x: 'Feb', y: 12 },
      ],
    })
    expect(series[1].region).toBe('South')
    expect(series[1].data.map((d) => d.y)).toEqual([20, 22])
  })

  it('seriesBy fans one panel into multiple named series', () => {
    const long = [
      { q: 'Q1', dept: 'A', metric: 'Revenue', value: 5 },
      { q: 'Q1', dept: 'A', metric: 'Cost', value: 3 },
      { q: 'Q2', dept: 'A', metric: 'Revenue', value: 6 },
      { q: 'Q1', dept: 'B', metric: 'Revenue', value: 7 },
    ]
    const { series } = pivotRows(long, {
      by: 'dept',
      x: 'q',
      y: 'value',
      seriesBy: 'metric',
    })
    expect(series.map((s) => [s.dept, s.name])).toEqual([
      ['A', 'Revenue'],
      ['A', 'Cost'],
      ['B', 'Revenue'],
    ])
    expect(series[0].data).toEqual([
      { x: 'Q1', y: 5 },
      { x: 'Q2', y: 6 },
    ])
  })

  it('keeps Date x values usable (epoch key, split-compatible)', () => {
    const d1 = new Date('2025-01-01')
    const d2 = new Date('2025-02-01')
    const { series } = pivotRows(
      [
        { t: d1, k: 'A', v: 1 },
        { t: d2, k: 'A', v: 2 },
      ],
      { by: 'k', x: 't', y: 'v' },
    )
    expect(series[0].data.map((d) => d.x)).toEqual([d1.getTime(), d2.getTime()])
  })
})

describe('pivotRows anomalies', () => {
  it('duplicate (panel, series, x) keeps the LAST and warns once', () => {
    const { series, warnings } = pivotRows(
      [
        { m: 'Jan', k: 'A', v: 1 },
        { m: 'Jan', k: 'A', v: 99 },
        { m: 'Jan', k: 'A', v: 7 },
      ],
      { by: 'k', x: 'm', y: 'v' },
    )
    expect(series[0].data).toEqual([{ x: 'Jan', y: 7 }])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('duplicate')
    expect(warnings[0]).toContain('kept the last')
  })

  it('skips rows missing the facet or x column, with one counted warning', () => {
    const { series, warnings } = pivotRows(
      [
        { m: 'Jan', k: 'A', v: 1 },
        { m: null, k: 'A', v: 2 },
        { m: 'Feb', v: 3 },
        null,
        { m: 'Feb', k: 'A', v: 4 },
      ],
      { by: 'k', x: 'm', y: 'v' },
    )
    expect(series[0].data.map((d) => d.y)).toEqual([1, 4])
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('3 row(s)')
  })

  it('missing y becomes an explicit null datum, not a skipped row', () => {
    const { series, warnings } = pivotRows(
      [
        { m: 'Jan', k: 'A', v: 1 },
        { m: 'Feb', k: 'A' },
      ],
      { by: 'k', x: 'm', y: 'v' },
    )
    expect(series[0].data).toEqual([
      { x: 'Jan', y: 1 },
      { x: 'Feb', y: null },
    ])
    expect(warnings).toEqual([])
  })

  it('facet keys that would collide in a naive composite key stay distinct', () => {
    // 'North A' + series 'B' vs 'North' + series 'A B': a string-concat
    // composite key would merge these; the nested-map accumulator must not.
    const { series } = pivotRows(
      [
        { m: 'Jan', k: 'North A', sub: 'B', v: 1 },
        { m: 'Jan', k: 'North', sub: 'A B', v: 2 },
      ],
      { by: 'k', x: 'm', y: 'v', seriesBy: 'sub' },
    )
    expect(series).toHaveLength(2)
    expect(series.map((s) => [s.k, s.name])).toEqual([
      ['North A', 'B'],
      ['North', 'A B'],
    ])
  })
})

describe('pivotRows validation', () => {
  it('refuses a non-string `by` (function accessors are series-form only)', () => {
    const { series, warnings } = pivotRows(rows, {
      by: (s) => s.region,
      x: 'month',
      y: 'revenue',
    })
    expect(series).toEqual([])
    expect(warnings[0]).toContain('string `by`')
  })

  it('refuses missing x/y column names', () => {
    const { series, warnings } = pivotRows(rows, { by: 'region' })
    expect(series).toEqual([])
    expect(warnings[0]).toContain('`x` and `y`')
  })

  it('empty rows warn and return no series', () => {
    const { series, warnings } = pivotRows([], {
      by: 'region',
      x: 'month',
      y: 'revenue',
    })
    expect(series).toEqual([])
    expect(warnings[0]).toContain('empty')
  })
})
