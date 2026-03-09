/**
 * Pure-function tests for src/libs/monotone-cubic.js
 *
 * tangents(), svgPath(), spline.points(), spline.slice() — all pure math,
 * zero DOM dependency, deterministic output. High branch density.
 */

import { describe, it, expect } from 'vitest'
import { tangents, svgPath, spline } from '../../src/libs/monotone-cubic.js'

// ─────────────────────────────────────────────────────────────────────────────
// tangents()
// ─────────────────────────────────────────────────────────────────────────────
describe('tangents(points)', () => {
  it('returns an array with the same length as points', () => {
    const pts = [[0, 0], [1, 1], [2, 4], [3, 9]]
    const t = tangents(pts)
    expect(t).toHaveLength(pts.length)
  })

  it('each tangent entry is a 2-element [dx, dy] array', () => {
    const pts = [[0, 0], [10, 5], [20, 3]]
    const t = tangents(pts)
    for (const entry of t) {
      expect(entry).toHaveLength(2)
      expect(typeof entry[0]).toBe('number')
      expect(typeof entry[1]).toBe('number')
    }
  })

  it('handles a perfectly flat horizontal line (zero slope)', () => {
    // All y-values the same → slope = 0, m[i] should be 0 everywhere
    const pts = [[0, 5], [1, 5], [2, 5], [3, 5]]
    const t = tangents(pts)
    expect(t).toHaveLength(4)
    // All tangent dy components should be 0 for a flat line
    for (const entry of t) {
      expect(entry[1]).toBe(0)
    }
  })

  it('handles 2-point input (minimum valid length)', () => {
    const pts = [[0, 0], [10, 10]]
    expect(() => tangents(pts)).not.toThrow()
    const t = tangents(pts)
    expect(t).toHaveLength(2)
  })

  it('handles a strictly increasing sequence', () => {
    const pts = [[0, 0], [1, 1], [2, 2], [3, 3]]
    const t = tangents(pts)
    expect(t).toHaveLength(4)
    // All tangents should be finite numbers
    for (const entry of t) {
      expect(Number.isFinite(entry[0])).toBe(true)
      expect(Number.isFinite(entry[1])).toBe(true)
    }
  })

  it('clamps over-large tangents (s > 9 branch)', () => {
    // Points with very steep change followed by very flat — triggers the s > 9 branch
    const pts = [[0, 0], [1, 1000], [2, 1001], [3, 1002]]
    expect(() => tangents(pts)).not.toThrow()
    const t = tangents(pts)
    expect(t).toHaveLength(4)
  })

  it('produces tangents that are all finite for a parabola', () => {
    const pts = [[0, 0], [1, 1], [2, 4], [3, 9], [4, 16]]
    const t = tangents(pts)
    for (const entry of t) {
      expect(Number.isFinite(entry[0])).toBe(true)
      expect(Number.isFinite(entry[1])).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// svgPath()
// ─────────────────────────────────────────────────────────────────────────────
describe('svgPath(points)', () => {
  it('produces a C command for 6-element points', () => {
    const pts = [[10, 20, 30, 40, 50, 60]]
    const result = svgPath(pts)
    expect(result).toContain('C')
    expect(result).toContain('10')
    expect(result).toContain('60')
  })

  it('produces an S command for 4-element points', () => {
    const pts = [[10, 20, 30, 40]]
    const result = svgPath(pts)
    expect(result).toContain('S')
    expect(result).toContain('10')
    expect(result).toContain('40')
  })

  it('skips entries with fewer than 3 elements', () => {
    const pts = [[10, 20]]  // n=2, not >2 and not >4 → skipped
    const result = svgPath(pts)
    expect(result).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(svgPath([])).toBe('')
  })

  it('concatenates multiple C entries', () => {
    const pts = [
      [1, 2, 3, 4, 5, 6],
      [7, 8, 9, 10, 11, 12],
    ]
    const result = svgPath(pts)
    const cCount = (result.match(/C/g) || []).length
    expect(cCount).toBe(2)
  })

  it('mixes C and S commands in correct order', () => {
    const pts = [
      [1, 2, 3, 4, 5, 6],  // 6-element → C
      [7, 8, 9, 10],         // 4-element → S
    ]
    const result = svgPath(pts)
    const cIdx = result.indexOf('C')
    const sIdx = result.indexOf('S')
    expect(cIdx).toBeGreaterThanOrEqual(0)
    expect(sIdx).toBeGreaterThan(cIdx)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// spline.points()
// ─────────────────────────────────────────────────────────────────────────────
describe('spline.points(points)', () => {
  it('returns an array', () => {
    const pts = [[0, 0], [10, 5], [20, 3], [30, 8]]
    const result = spline.points(pts)
    expect(Array.isArray(result)).toBe(true)
  })

  it('first entry is the first input point (M anchor)', () => {
    const pts = [[5, 10], [15, 20], [25, 15]]
    const result = spline.points(pts)
    expect(result[0]).toEqual([5, 10])
  })

  it('second entry is a 6-element cubic bezier command', () => {
    const pts = [[0, 0], [10, 10], [20, 5], [30, 15]]
    const result = spline.points(pts)
    expect(result[1]).toHaveLength(6)
  })

  it('subsequent entries are 4-element S commands (one per extra point)', () => {
    const pts = [[0, 0], [10, 5], [20, 3], [30, 8], [40, 2]]
    const result = spline.points(pts)
    // result[0] = M point, result[1] = 6-element C, rest are 4-element S
    for (let i = 2; i < result.length; i++) {
      expect(result[i]).toHaveLength(4)
    }
  })

  it('total point count equals input point count', () => {
    const pts = [[0, 0], [1, 2], [3, 1], [5, 4], [7, 2]]
    const result = spline.points(pts)
    expect(result).toHaveLength(pts.length)
  })

  it('handles 2-point minimal curve', () => {
    const pts = [[0, 0], [10, 10]]
    expect(() => spline.points(pts)).not.toThrow()
  })

  it('produces finite numbers for all control points', () => {
    const pts = [[0, 0], [5, 10], [10, 5], [15, 8]]
    const result = spline.points(pts)
    for (const entry of result) {
      for (const v of entry) {
        expect(Number.isFinite(v)).toBe(true)
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// spline.slice()
// ─────────────────────────────────────────────────────────────────────────────
describe('spline.slice(points, start, end)', () => {
  it('returns a slice of the specified range', () => {
    const pts = [[0, 0], [10, 5, 20, 8, 30, 3], [15, 7, 25, 1]]
    const sliced = spline.slice(pts, 0, 2)
    expect(sliced).toHaveLength(2)
  })

  it('when start=0, returns the slice unchanged', () => {
    const pts = [[0, 0], [10, 5, 20, 8, 30, 3], [15, 7, 25, 1]]
    const sliced = spline.slice(pts, 0, 3)
    // start=0: no modification, M entry kept as-is
    expect(sliced[0]).toEqual([0, 0])
  })

  it('when start>0, trims M entry to last 2 elements', () => {
    // pts[0] is a 6-element C entry; pts[1] is a 4-element S entry
    const pts = [
      [1, 2, 3, 4, 5, 6],  // 6-element
      [7, 8, 9, 10],         // 4-element S
    ]
    const sliced = spline.slice(pts, 1, 2)
    // start=1: pts[0] = pts[1].slice(-2) = last 2 of [7,8,9,10] = [9, 10]
    expect(sliced[0]).toEqual([9, 10])
  })

  it('when start>0 and segment is >1 point, upgrades S to C when needed', () => {
    // When pts[1].length < 6, it prepends control points from pts[0] last 4 coords
    const pts = [
      [1, 2, 3, 4, 5, 6],   // 6-element
      [7, 8, 9, 10],          // 4-element → needs upgrade
      [11, 12, 13, 14],
    ]
    const sliced = spline.slice(pts, 1, 3)
    // pts[1] should now be 6-element after the upgrade
    expect(sliced[1].length).toBe(6)
  })

  it('does not throw for a single-element slice', () => {
    const pts = [[0, 0], [10, 5, 20, 8, 30, 3]]
    expect(() => spline.slice(pts, 1, 2)).not.toThrow()
  })
})
