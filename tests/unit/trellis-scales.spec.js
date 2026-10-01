import { describe, it, expect } from 'vitest'
import {
  niceBounds,
  yExtent,
  yExtentInWindow,
  stackedYExtent,
  resolve,
} from '../../src/modules/trellis/TrellisScales'
import { split } from '../../src/modules/trellis/TrellisSplit'

describe('TrellisScales.niceBounds', () => {
  it('picks the nice step whose tick count lands closest to the target', () => {
    expect(niceBounds(3, 97, 4)).toEqual({ min: 0, max: 100, tickAmount: 4 })
    expect(niceBounds(0, 4000000, 4)).toEqual({
      min: 0,
      max: 4000000,
      tickAmount: 4,
    })
  })

  it('never lands far above the target (the 7-label small-panel bug)', () => {
    // 0..55000 with the old fixed thresholds stepped by 10000: 6 ticks and
    // 7 labels crammed into a 100px panel. Closest-count selection steps by
    // 20000 instead.
    expect(niceBounds(4000, 55000, 4)).toEqual({
      min: 0,
      max: 60000,
      tickAmount: 3,
    })
    // Default target is 3 (a small panel wears at most ~4 labels well).
    const b = niceBounds(0, 812)
    expect(b.tickAmount).toBeLessThanOrEqual(4)
  })

  it('handles a flat domain by padding it open', () => {
    const b = niceBounds(50, 50, 4)
    expect(b.min).toBeLessThan(50)
    expect(b.max).toBeGreaterThan(50)
    expect(b.tickAmount).toBeGreaterThanOrEqual(1)
  })

  it('handles negatives and non-finite input', () => {
    const b = niceBounds(-83, 42, 4)
    expect(b.min).toBeLessThanOrEqual(-83)
    expect(b.max).toBeGreaterThanOrEqual(42)
    expect(niceBounds(NaN, Infinity)).toEqual({ min: 0, max: 1, tickAmount: 1 })
  })

  it('is deterministic: same input, same bounds (the alignment contract)', () => {
    expect(niceBounds(17.3, 912.8, 4)).toEqual(niceBounds(17.3, 912.8, 4))
  })
})

describe('TrellisScales.yExtent', () => {
  const mkSplit = (series) => split(series, { by: 'k' })

  it('walks paired, object and plain forms', () => {
    const s = mkSplit([
      { name: 'a', k: 'p1', data: [[1, 5], [2, -3]] },
      { name: 'a', k: 'p2', data: [[1, 40]] },
    ])
    expect(yExtent(s.panels, s.xForm)).toEqual({ min: -3, max: 40 })
  })

  it('flattens array y values (OHLC / box summaries / ranges)', () => {
    const s = mkSplit([
      { name: 'a', k: 'p1', data: [{ x: 1, y: [5, 60, 2, 30] }] },
    ])
    expect(yExtent(s.panels, s.xForm)).toEqual({ min: 2, max: 60 })
  })

  it('ignores the nulls the union alignment inserted', () => {
    const s = mkSplit([
      { name: 'a', k: 'p1', data: [[1, 10], [2, 20]] },
      { name: 'a', k: 'p2', data: [[2, 5]] }, // gets [1, null] inserted
    ])
    expect(yExtent(s.panels, s.xForm)).toEqual({ min: 5, max: 20 })
  })

  it('returns null when nothing is finite', () => {
    const s = mkSplit([{ name: 'a', k: 'p1', data: [[1, null]] }])
    expect(yExtent(s.panels, s.xForm)).toBeNull()
  })
})

describe('TrellisScales.yExtentInWindow', () => {
  it('restricts the union to the x window (the autoscale-on-zoom input)', () => {
    const s = split(
      [
        { name: 'a', k: 'p1', data: [[1, 10], [2, 100], [3, 20]] },
        { name: 'a', k: 'p2', data: [[1, 1], [2, 2], [3, 300]] },
      ],
      { by: 'k' },
    )
    expect(yExtentInWindow(s.panels, s.xForm, 1, 2)).toEqual({
      min: 1,
      max: 100,
    })
    expect(yExtentInWindow(s.panels, s.xForm, 2.5, 3)).toEqual({
      min: 20,
      max: 300,
    })
  })
})

describe('TrellisScales.resolve', () => {
  const mk = (series, cfg = {}, host = {}) =>
    resolve(split(series, { by: 'k' }), cfg, host)

  it('shared x uses the union extent; shared y is niced over all panels', () => {
    const r = mk([
      { name: 'a', k: 'p1', data: [[10, 3]] },
      { name: 'a', k: 'p2', data: [[50, 97]] },
    ])
    expect(r.x).toEqual({ min: 10, max: 50 })
    // Default targetTicks 3: ties between candidates prefer fewer ticks.
    expect(r.y).toEqual({ min: 0, max: 100, tickAmount: 2 })
  })

  it('independent y resolves to null (the gutter pass aligns instead)', () => {
    const r = mk(
      [{ name: 'a', k: 'p1', data: [[1, 5]] }],
      { scales: { y: 'independent' } },
    )
    expect(r.y).toBeNull()
  })

  it('category x resolves to null (union list is the alignment)', () => {
    const r = mk([{ name: 'a', k: 'p1', data: [{ x: 'Jan', y: 5 }] }])
    expect(r.x).toBeNull()
  })

  it('floors an all-positive bar-family domain at zero', () => {
    const r = mk(
      [{ name: 'a', k: 'p1', data: [[1, 50], [2, 90]] }],
      {},
      { chartType: 'bar' },
    )
    expect(r.y.min).toBe(0)
  })

  it('maps colors by series NAME across the trellis, cycling the palette', () => {
    const r = mk([
      { name: 'Rev', k: 'p1', data: [[1, 1]] },
      { name: 'Cost', k: 'p1', data: [[1, 2]] },
      // panel p2 declares them in the OPPOSITE order:
      { name: 'Cost', k: 'p2', data: [[1, 3]] },
      { name: 'Rev', k: 'p2', data: [[1, 4]] },
    ])
    expect(r.colorOf('Rev')).toBe(r.palette[0])
    expect(r.colorOf('Cost')).toBe(r.palette[1])
    // order inside a panel must not change the mapping
    expect(r.colorOf('Rev')).not.toBe(r.colorOf('Cost'))
  })

  it('prefers the user color list when given', () => {
    const r = mk(
      [{ name: 'Rev', k: 'p1', data: [[1, 1]] }],
      {},
      { userColors: ['#111111', '#222222'] },
    )
    expect(r.colorOf('Rev')).toBe('#111111')
  })
})

describe('TrellisScales: a stacked trellis shares the STACK domain', () => {
  // East piles 40 + 40 = 80 at Q1 while no single value tops 45. A shared
  // scale built from single values clips exactly the panel the shared scale
  // exists to make comparable.
  const stacked = [
    { name: 'A', k: 'East', data: [{ x: 'Q1', y: 40 }, { x: 'Q2', y: 45 }] },
    { name: 'B', k: 'East', data: [{ x: 'Q1', y: 40 }, { x: 'Q2', y: 35 }] },
    { name: 'A', k: 'West', data: [{ x: 'Q1', y: 20 }, { x: 'Q2', y: 25 }] },
    { name: 'B', k: 'West', data: [{ x: 'Q1', y: 15 }, { x: 'Q2', y: 10 }] },
  ]
  const mkSplit = (series) => split(series, { by: 'k' })

  it('stackedYExtent measures the piles, not the values', () => {
    const s = mkSplit(stacked)
    expect(yExtent(s.panels, s.xForm)).toEqual({ min: 10, max: 45 })
    expect(stackedYExtent(s.panels, s.xForm)).toEqual({ min: 0, max: 80 })
  })

  it('positive and negative runs accumulate away from the baseline separately', () => {
    const s = mkSplit([
      { name: 'A', k: 'p', data: [{ x: 1, y: 30 }] },
      { name: 'B', k: 'p', data: [{ x: 1, y: 20 }] },
      { name: 'C', k: 'p', data: [{ x: 1, y: -15 }] },
      { name: 'D', k: 'p', data: [{ x: 1, y: -25 }] },
    ])
    expect(stackedYExtent(s.panels, s.xForm)).toEqual({ min: -40, max: 50 })
  })

  it('groups pile separately, the way the core groups them', () => {
    const s = mkSplit([
      { name: 'A', k: 'p', group: 'g1', data: [{ x: 1, y: 30 }] },
      { name: 'B', k: 'p', group: 'g1', data: [{ x: 1, y: 20 }] },
      { name: 'C', k: 'p', group: 'g2', data: [{ x: 1, y: 40 }] },
    ])
    // 50, not 90: g1 and g2 are two piles side by side.
    expect(stackedYExtent(s.panels, s.xForm)).toEqual({ min: 0, max: 50 })
  })

  it('stackOnlyBar keeps a reference line out of the pile but on the axis', () => {
    const s = mkSplit([
      { name: 'A', k: 'p', data: [{ x: 1, y: 30 }] },
      { name: 'B', k: 'p', data: [{ x: 1, y: 20 }] },
      { name: 'Target', k: 'p', type: 'line', data: [{ x: 1, y: 70 }] },
    ])
    expect(stackedYExtent(s.panels, s.xForm, { stackOnlyBar: true })).toEqual({
      min: 0,
      max: 70,
    })
    // Without the flag everything stacks: 30 + 20 + 70.
    expect(stackedYExtent(s.panels, s.xForm)).toEqual({ min: 0, max: 120 })
  })

  it('resolve uses the stack totals when the chart is stacked', () => {
    const plain = resolve(mkSplit(stacked), {}, { chartType: 'bar' })
    // Sized by the largest single value: East's 80-tall stack draws off the top.
    expect(plain.y.max).toBeLessThan(80)

    const piled = resolve(
      mkSplit(stacked),
      {},
      { chartType: 'bar', stacked: true },
    )
    expect(piled.y.max).toBeGreaterThanOrEqual(80)
  })

  // Reported from the field: a '100%' trellis drew 0..100 on the first render
  // and dropped to the raw value range on the first update. The shared scale
  // used to be left to the core, which only rewrites the bounds when it reads
  // a config carrying `chart.stackType` — true of the initial options, never
  // of a panel update, which carries only what changed.
  it("'100%' draws percentages, so its domain is 0..100 whatever the data", () => {
    const pct = resolve(
      mkSplit(stacked),
      {},
      { chartType: 'bar', stacked: true, stackType: '100%' },
    )
    expect(pct.y.min).toBe(0)
    expect(pct.y.max).toBe(100)

    // Data an order of magnitude bigger lands on the same axis: it is the
    // normalization that fixes the domain, not the numbers.
    const big = resolve(
      mkSplit(
        stacked.map((s) => ({
          ...s,
          data: s.data.map((d) => ({ ...d, y: d.y * 100 })),
        })),
      ),
      {},
      { chartType: 'bar', stacked: true, stackType: '100%' },
    )
    expect(big.y).toEqual(pct.y)
  })

  it("'100%' fixes the per-row and per-column domains too", () => {
    for (const y of ['independent-row', 'independent-column']) {
      const r = resolve(
        mkSplit(stacked),
        { scales: { y } },
        { chartType: 'bar', stacked: true, stackType: '100%' },
      )
      const groups = [...(r.rowY || r.colY).values()]
      expect(groups.length).toBeGreaterThan(0)
      groups.forEach((g) => {
        expect(g.min).toBe(0)
        expect(g.max).toBe(100)
      })
    }
  })
})
