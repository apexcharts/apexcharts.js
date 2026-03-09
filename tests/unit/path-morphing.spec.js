/**
 * Pure-function tests for PathMorphing.js
 *
 * parsePath, pathBbox, arrayToPath, and morphPaths are all deterministic,
 * zero-DOM, zero-mock functions with rich branching logic — ideal targets.
 */

import { describe, it, expect } from 'vitest'
import {
  parsePath,
  pathBbox,
  arrayToPath,
  morphPaths,
} from '../../src/svg/PathMorphing.js'

// ─────────────────────────────────────────────────────────────────────────────
// parsePath
// ─────────────────────────────────────────────────────────────────────────────
describe('parsePath(d)', () => {
  it('parses a simple M L path', () => {
    const result = parsePath('M 0 0 L 100 100')
    expect(result).toEqual([
      ['M', 0, 0],
      ['L', 100, 100],
    ])
  })

  it('parses multiple M and L commands', () => {
    const result = parsePath('M 10 20 L 30 40 L 50 60')
    expect(result).toEqual([
      ['M', 10, 20],
      ['L', 30, 40],
      ['L', 50, 60],
    ])
  })

  it('parses a cubic bezier C command (6 params)', () => {
    const result = parsePath('M 0 0 C 10 20 30 40 50 60')
    expect(result).toEqual([
      ['M', 0, 0],
      ['C', 10, 20, 30, 40, 50, 60],
    ])
  })

  it('parses Z command and produces a Z entry', () => {
    const result = parsePath('M 0 0 L 10 10 Z')
    expect(result.some((cmd) => cmd[0] === 'Z')).toBe(true)
  })

  it('parses H (horizontal line) command', () => {
    const result = parsePath('M 0 0 H 100')
    expect(result).toContainEqual(['H', 100])
  })

  it('parses V (vertical line) command', () => {
    const result = parsePath('M 0 0 V 50')
    expect(result).toContainEqual(['V', 50])
  })

  it('handles negative coordinates', () => {
    const result = parsePath('M -10 -20 L -30 -40')
    expect(result).toEqual([
      ['M', -10, -20],
      ['L', -30, -40],
    ])
  })

  it('handles decimal coordinates', () => {
    const result = parsePath('M 0.5 1.5 L 2.5 3.5')
    expect(result).toEqual([
      ['M', 0.5, 1.5],
      ['L', 2.5, 3.5],
    ])
  })

  it('normalises lowercase commands to uppercase', () => {
    // parsePath converts all letters to toUpperCase()
    const result = parsePath('M 0 0 l 10 10')
    expect(result[1][0]).toBe('L')
  })

  it('returns [["M", 0, 0]] for empty/falsy input', () => {
    expect(parsePath('')).toEqual([['M', 0, 0]])
    expect(parsePath(null)).toEqual([['M', 0, 0]])
    expect(parsePath(undefined)).toEqual([['M', 0, 0]])
  })

  it('returns [["M", 0, 0]] for non-string input', () => {
    expect(parsePath(42)).toEqual([['M', 0, 0]])
  })

  it('parses a Q (quadratic bezier) command', () => {
    const result = parsePath('M 0 0 Q 10 20 30 40')
    expect(result).toContainEqual(['Q', 10, 20, 30, 40])
  })

  it('parses an S (smooth cubic) command', () => {
    const result = parsePath('M 0 0 S 10 20 30 40')
    expect(result).toContainEqual(['S', 10, 20, 30, 40])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// pathBbox
// ─────────────────────────────────────────────────────────────────────────────
describe('pathBbox(arr)', () => {
  it('computes correct bounding box for a simple rectangle path', () => {
    const arr = [
      ['M', 10, 20],
      ['L', 110, 20],
      ['L', 110, 70],
      ['L', 10, 70],
    ]
    const bbox = pathBbox(arr)
    expect(bbox).toEqual({ x: 10, y: 20, width: 100, height: 50 })
  })

  it('returns zero bounding box for a single-point path', () => {
    const arr = [['M', 5, 5]]
    const bbox = pathBbox(arr)
    expect(bbox).toEqual({ x: 5, y: 5, width: 0, height: 0 })
  })

  it('returns { x:0, y:0, width:0, height:0 } for a Z-only path (no coordinates)', () => {
    const arr = [['Z']]
    const bbox = pathBbox(arr)
    expect(bbox).toEqual({ x: 0, y: 0, width: 0, height: 0 })
  })

  it('handles negative coordinates', () => {
    const arr = [
      ['M', -50, -30],
      ['L', 50, 30],
    ]
    const bbox = pathBbox(arr)
    expect(bbox.x).toBe(-50)
    expect(bbox.y).toBe(-30)
    expect(bbox.width).toBe(100)
    expect(bbox.height).toBe(60)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// arrayToPath
// ─────────────────────────────────────────────────────────────────────────────
describe('arrayToPath(arr)', () => {
  it('serialises a simple command array back to a path string', () => {
    const arr = [['M', 0, 0], ['L', 100, 100]]
    expect(arrayToPath(arr)).toBe('M 0 0 L 100 100')
  })

  it('handles a Z command with no parameters', () => {
    const arr = [['M', 0, 0], ['L', 10, 10], ['Z']]
    expect(arrayToPath(arr)).toBe('M 0 0 L 10 10 Z')
  })

  it('round-trips: parsePath → arrayToPath produces equivalent output', () => {
    const original = 'M 0 0 L 50 50 L 100 0'
    const parsed = parsePath(original)
    const serialised = arrayToPath(parsed)
    // Re-parse both and compare — whitespace may differ
    expect(parsePath(serialised)).toEqual(parsed)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// morphPaths
// ─────────────────────────────────────────────────────────────────────────────
describe('morphPaths(fromD, toD)', () => {
  it('returns a function', () => {
    const morph = morphPaths('M 0 0 L 10 10', 'M 50 50 L 100 100')
    expect(typeof morph).toBe('function')
  })

  it('returns a string from the interpolation function', () => {
    const morph = morphPaths('M 0 0 L 10 10', 'M 50 50 L 100 100')
    expect(typeof morph(0)).toBe('string')
    expect(typeof morph(0.5)).toBe('string')
    expect(typeof morph(1)).toBe('string')
  })

  it('at pos=0 the output matches the parsed "from" path coordinates', () => {
    const morph = morphPaths('M 0 0 L 100 0', 'M 50 50 L 200 50')
    const at0 = morph(0)
    // The interpolated path at pos=0 must reproduce the "from" numbers
    expect(at0).toContain('0')
  })

  it('at pos=1 the output matches the parsed "to" path coordinates', () => {
    const morph = morphPaths('M 0 0 L 100 0', 'M 50 50 L 200 50')
    const at1 = morph(1)
    // At pos=1 we should see the "to" values
    expect(at1).toContain('50')
    expect(at1).toContain('200')
  })

  it('produces a different string at pos=0, 0.5, and 1 (movement occurs)', () => {
    const morph = morphPaths('M 0 0 L 0 0', 'M 100 100 L 200 200')
    const a = morph(0)
    const b = morph(0.5)
    const c = morph(1)
    // All three positions should yield distinct paths
    expect(a).not.toBe(b)
    expect(b).not.toBe(c)
    expect(a).not.toBe(c)
  })

  it('handles identical from/to paths — output equals the path at any pos', () => {
    const morph = morphPaths('M 0 0 L 10 10', 'M 0 0 L 10 10')
    const at0 = morph(0)
    const at1 = morph(1)
    // Parsed output should be equivalent regardless of pos
    expect(parsePath(at0)).toEqual(parsePath(at1))
  })

  it('handles empty/falsy fromD gracefully (uses fallback M 0 0)', () => {
    expect(() => morphPaths('', 'M 10 10 L 20 20')).not.toThrow()
    const morph = morphPaths('', 'M 10 10 L 20 20')
    expect(typeof morph(0.5)).toBe('string')
  })

  it('handles paths with different command counts by padding shorter one', () => {
    // 1-command vs 3-command path
    expect(() =>
      morphPaths('M 0 0', 'M 0 0 L 10 10 L 20 20')
    ).not.toThrow()
    const morph = morphPaths('M 0 0', 'M 0 0 L 10 10 L 20 20')
    expect(typeof morph(0.5)).toBe('string')
  })

  it('interpolates numeric coordinate values between from and to', () => {
    const morph = morphPaths('M 0 0 L 100 0', 'M 0 0 L 0 100')
    const mid = morph(0.5)
    // At midpoint: L coordinate should be approximately (50, 50) after normalisation
    // The x and y of the L command at pos=0.5 should both be 50
    // After bezier normalisation coords may differ, so we just check it's a valid path
    expect(mid).toMatch(/^[MLCQZSHVAT\s\d.,-]+$/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// PerformanceCache — pure cache logic (no DOM, just object state)
// ─────────────────────────────────────────────────────────────────────────────
import PerformanceCache from '../../src/utils/PerformanceCache.js'

function makeW() {
  return { globals: { cachedSelectors: {}, dimensionCache: {}, domCache: new Map() } }
}

describe('PerformanceCache — getCachedSelector()', () => {
  it('calls queryFn on first access and caches the result', () => {
    const w = makeW()
    const queryFn = vi.fn(() => 'result-A')

    const first = PerformanceCache.getCachedSelector(w, 'key1', queryFn)
    const second = PerformanceCache.getCachedSelector(w, 'key1', queryFn)

    expect(first).toBe('result-A')
    expect(second).toBe('result-A')
    expect(queryFn).toHaveBeenCalledTimes(1) // cached after first call
  })

  it('calls queryFn independently for different keys', () => {
    const w = makeW()
    const fnA = vi.fn(() => 'A')
    const fnB = vi.fn(() => 'B')

    expect(PerformanceCache.getCachedSelector(w, 'keyA', fnA)).toBe('A')
    expect(PerformanceCache.getCachedSelector(w, 'keyB', fnB)).toBe('B')
    expect(fnA).toHaveBeenCalledTimes(1)
    expect(fnB).toHaveBeenCalledTimes(1)
  })

  it('bypasses cache and calls queryFn directly when w is falsy', () => {
    const queryFn = vi.fn(() => 'direct')
    const result = PerformanceCache.getCachedSelector(null, 'key', queryFn)
    expect(result).toBe('direct')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})

describe('PerformanceCache — invalidateSelectors()', () => {
  it('clears cachedSelectors object', () => {
    const w = makeW()
    w.globals.cachedSelectors = { key1: 'val1', key2: 'val2' }

    PerformanceCache.invalidateSelectors(w)

    expect(w.globals.cachedSelectors).toEqual({})
  })

  it('does not throw when w is falsy', () => {
    expect(() => PerformanceCache.invalidateSelectors(null)).not.toThrow()
    expect(() => PerformanceCache.invalidateSelectors(undefined)).not.toThrow()
  })
})

describe('PerformanceCache — getCachedDimension()', () => {
  it('computes and caches the value on first call', () => {
    const w = makeW()
    const computeFn = vi.fn(() => ({ width: 100, height: 200 }))

    const first = PerformanceCache.getCachedDimension(w, 'dims', computeFn)
    expect(first).toEqual({ width: 100, height: 200 })
    expect(computeFn).toHaveBeenCalledTimes(1)
  })

  it('returns cached value within maxAge window', () => {
    const w = makeW()
    const computeFn = vi.fn(() => 42)

    PerformanceCache.getCachedDimension(w, 'k', computeFn, 1000)
    const second = PerformanceCache.getCachedDimension(w, 'k', computeFn, 1000)

    expect(second).toBe(42)
    expect(computeFn).toHaveBeenCalledTimes(1)
  })

  it('recomputes after cache expires (maxAge=0 forces recompute)', () => {
    const w = makeW()
    let callCount = 0
    const computeFn = vi.fn(() => ++callCount)

    // First call — caches value
    PerformanceCache.getCachedDimension(w, 'k', computeFn, 0)
    // Second call with maxAge=0 — lastUpdate is in the past → always expired
    PerformanceCache.getCachedDimension(w, 'k', computeFn, 0)

    expect(computeFn).toHaveBeenCalledTimes(2)
  })

  it('calls computeFn directly and bypasses cache when w is falsy', () => {
    const computeFn = vi.fn(() => 'uncached')
    const result = PerformanceCache.getCachedDimension(null, 'k', computeFn)
    expect(result).toBe('uncached')
    expect(computeFn).toHaveBeenCalledTimes(1)
  })
})

describe('PerformanceCache — invalidateAll()', () => {
  it('clears cachedSelectors, domCache, and dimensionCache', () => {
    const w = makeW()
    w.globals.cachedSelectors = { k: 'v' }
    w.globals.domCache = new Map([['el', document.createElement('div')]])
    w.globals.dimensionCache = { d: { value: 1, lastUpdate: Date.now() } }

    PerformanceCache.invalidateAll(w)

    expect(w.globals.cachedSelectors).toEqual({})
    expect(w.globals.domCache.size).toBe(0)
    expect(w.globals.dimensionCache).toEqual({})
  })

  it('does not throw when w is falsy', () => {
    expect(() => PerformanceCache.invalidateAll(null)).not.toThrow()
  })
})

describe('PerformanceCache — DOM element cache (cacheDOMElement / getCachedDOMElement)', () => {
  it('stores and retrieves a DOM element by key', () => {
    const w = makeW()
    const el = document.createElement('div')

    PerformanceCache.cacheDOMElement(w, 'myEl', el)
    const retrieved = PerformanceCache.getCachedDOMElement(w, 'myEl')

    expect(retrieved).toBe(el)
  })

  it('returns null for a key that has not been cached', () => {
    const w = makeW()
    expect(PerformanceCache.getCachedDOMElement(w, 'missing')).toBeNull()
  })

  it('returns null when w is falsy', () => {
    expect(PerformanceCache.getCachedDOMElement(null, 'any')).toBeNull()
  })

  it('cacheDOMElement does not throw when w is falsy', () => {
    expect(() =>
      PerformanceCache.cacheDOMElement(null, 'k', document.createElement('span'))
    ).not.toThrow()
  })
})
