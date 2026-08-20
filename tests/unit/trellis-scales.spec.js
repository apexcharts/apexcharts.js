import { describe, it, expect } from 'vitest'
import {
  niceBounds,
  yExtent,
  yExtentInWindow,
  resolve,
} from '../../src/modules/trellis/TrellisScales'
import { split } from '../../src/modules/trellis/TrellisSplit'

describe('TrellisScales.niceBounds', () => {
  it('rounds to 1-2-5 steps with an integer tick count', () => {
    expect(niceBounds(3, 97, 4)).toEqual({ min: 0, max: 100, tickAmount: 5 })
    expect(niceBounds(0, 4000000, 4)).toEqual({
      min: 0,
      max: 4000000,
      tickAmount: 4,
    })
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
    expect(r.y).toEqual({ min: 0, max: 100, tickAmount: 5 })
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
