import { describe, it, expect } from 'vitest'
import { split, orderKeys } from '../../src/modules/trellis/TrellisSplit'

const pair = (x, y) => [x, y]

describe('TrellisSplit.split', () => {
  it('groups series by a string key, first-seen order', () => {
    const res = split(
      [
        { name: 'Rev', region: 'North', data: [pair(1, 10), pair(2, 11)] },
        { name: 'Rev', region: 'South', data: [pair(1, 20), pair(2, 21)] },
        { name: 'Rev', region: 'East', data: [pair(1, 30), pair(2, 31)] },
      ],
      { by: 'region' },
    )
    expect(res.panels.map((p) => p.key)).toEqual(['North', 'South', 'East'])
    expect(res.panels[0].series).toHaveLength(1)
    expect(res.seriesNames).toEqual(['Rev'])
    expect(res.xIsNumeric).toBe(true)
  })

  it('groups by a function accessor', () => {
    const res = split(
      [
        { name: 'a-x', data: [pair(1, 1)] },
        { name: 'b-x', data: [pair(1, 2)] },
      ],
      { by: (s) => s.name.split('-')[0] },
    )
    expect(res.panels.map((p) => p.key)).toEqual(['a', 'b'])
  })

  it('defaults `by` to the blessed `facet` field', () => {
    const res = split(
      [
        { name: 'Rev', facet: 'A', data: [pair(1, 1)] },
        { name: 'Rev', facet: 'B', data: [pair(1, 2)] },
      ],
      {},
    )
    expect(res.panels.map((p) => p.key)).toEqual(['A', 'B'])
  })

  it('repeats keyless series into every panel (reference series)', () => {
    const res = split(
      [
        { name: 'Rev', region: 'N', data: [pair(1, 10)] },
        { name: 'Rev', region: 'S', data: [pair(1, 20)] },
        { name: 'Target', data: [pair(1, 15)] }, // no region
      ],
      { by: 'region' },
    )
    expect(res.panels).toHaveLength(2)
    res.panels.forEach((p) => {
      expect(p.seriesNames).toEqual(['Rev', 'Target'])
    })
    expect(res.seriesNames).toEqual(['Rev', 'Target'])
  })

  it('returns no panels (with a warning) when nothing carries the key', () => {
    const res = split([{ name: 'A', data: [pair(1, 1)] }], { by: 'region' })
    expect(res.panels).toHaveLength(0)
    expect(res.warnings.length).toBeGreaterThan(0)
  })

  describe('union x alignment (22a D5)', () => {
    it('re-emits every panel against the union x list with null placeholders (paired form)', () => {
      const res = split(
        [
          { name: 'R', k: 'full', data: [pair(1, 10), pair(2, 11), pair(3, 12)] },
          { name: 'R', k: 'ragged', data: [pair(2, 21)] },
        ],
        { by: 'k' },
      )
      expect(res.unionX).toEqual([1, 2, 3])
      const ragged = res.panels[1].series[0].data
      expect(ragged).toEqual([
        [1, null],
        [2, 21],
        [3, null],
      ])
      // Index alignment: index i is the same x in every panel (what makes the
      // group's index-matched tooltip sync caption the right point).
      const full = res.panels[0].series[0].data
      expect(full.map((d) => d[0])).toEqual(ragged.map((d) => d[0]))
    })

    it('re-emits object-form data as { x, y: null } placeholders', () => {
      const res = split(
        [
          { name: 'R', k: 'a', data: [{ x: 'Jan', y: 1 }, { x: 'Feb', y: 2 }] },
          { name: 'R', k: 'b', data: [{ x: 'Feb', y: 9 }] },
        ],
        { by: 'k' },
      )
      // String categories keep first-seen order.
      expect(res.unionX).toEqual(['Jan', 'Feb'])
      expect(res.xIsNumeric).toBe(false)
      expect(res.panels[1].series[0].data).toEqual([
        { x: 'Jan', y: null },
        { x: 'Feb', y: 9 },
      ])
    })

    it('sorts a numeric/datetime union ascending and preserves Date datums', () => {
      const d1 = new Date('2025-01-01')
      const d2 = new Date('2025-01-02')
      const res = split(
        [
          { name: 'R', k: 'a', data: [{ x: d2, y: 2 }] },
          { name: 'R', k: 'b', data: [{ x: d1, y: 1 }] },
        ],
        { by: 'k' },
      )
      expect(res.unionX).toEqual([d1.getTime(), d2.getTime()])
      // The kept datum is the ORIGINAL object (custom fields survive).
      expect(res.panels[0].series[0].data[1].x).toBe(d2)
      expect(res.panels[0].series[0].data[0]).toEqual({
        x: d1.getTime(),
        y: null,
      })
    })

    it('pads plain value arrays by position to the longest', () => {
      const res = split(
        [
          { name: 'R', k: 'a', data: [1, 2, 3, 4] },
          { name: 'R', k: 'b', data: [9] },
        ],
        { by: 'k' },
      )
      expect(res.panels[1].series[0].data).toEqual([9, null, null, null])
      expect(res.unionX).toEqual([0, 1, 2, 3])
    })

    it('warns on duplicate x within one series and keeps the first', () => {
      const res = split(
        [{ name: 'R', k: 'a', data: [pair(1, 10), pair(1, 99)] }],
        { by: 'k' },
      )
      expect(res.panels[0].series[0].data).toEqual([[1, 10]])
      expect(res.warnings.some((w) => w.includes('duplicate x'))).toBe(true)
    })
  })

  describe('order and limit', () => {
    const series = ['C', 'A', 'B'].map((k) => ({
      name: 'R',
      k,
      data: [pair(1, 1)],
    }))

    it('orders asc / desc / explicit array / comparator', () => {
      expect(
        split(series, { by: 'k', order: 'asc' }).panels.map((p) => p.key),
      ).toEqual(['A', 'B', 'C'])
      expect(
        split(series, { by: 'k', order: 'desc' }).panels.map((p) => p.key),
      ).toEqual(['C', 'B', 'A'])
      expect(
        split(series, { by: 'k', order: ['B'] }).panels.map((p) => p.key),
      ).toEqual(['B', 'C', 'A'])
      expect(
        split(series, { by: 'k', order: (a, b) => b.localeCompare(a) }).panels.map(
          (p) => p.key,
        ),
      ).toEqual(['C', 'B', 'A'])
    })

    it('sorts numeric string keys numerically for asc/desc', () => {
      expect(orderKeys(['10', '2', '1'], 'asc')).toEqual(['1', '2', '10'])
    })

    it('limit keeps the first N panels and reports the dropped count', () => {
      const res = split(series, { by: 'k', order: 'asc', limit: 2 })
      expect(res.panels.map((p) => p.key)).toEqual(['A', 'B'])
      expect(res.dropped).toBe(1)
    })
  })

  it('keeps stable trellis-wide series-name order even when a panel lacks a series', () => {
    const res = split(
      [
        { name: 'Rev', k: 'a', data: [pair(1, 1)] },
        { name: 'Cost', k: 'a', data: [pair(1, 2)] },
        { name: 'Rev', k: 'b', data: [pair(1, 3)] }, // panel b has no Cost
      ],
      { by: 'k' },
    )
    expect(res.seriesNames).toEqual(['Rev', 'Cost'])
    expect(res.panels[1].seriesNames).toEqual(['Rev'])
  })
})
