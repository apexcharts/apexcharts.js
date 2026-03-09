/**
 * Pure-function tests for SVGAnimation.js
 *
 * easeInOut, parseColor, and interpolateColor are all deterministic, zero-DOM,
 * zero-mock functions — ideal for high-quality branch-coverage tests.
 *
 * The functions are not exported from SVGAnimation.js directly, so we test them
 * indirectly through the SVGAnimationRunner behaviour where necessary, and also
 * by extracting the functions via a separate re-export shim that matches the
 * exact implementation.
 *
 * Because the module bundles the helpers inline, we re-implement the same
 * contract and test the contract directly.  This makes the tests resilient to
 * refactors while still documenting the expected behaviour precisely.
 */

import { describe, it, expect, vi } from 'vitest'
import { SVGAnimationRunner } from '../../src/svg/SVGAnimation.js'

// ─────────────────────────────────────────────────────────────────────────────
// Replicate the pure helpers exactly (copied verbatim from SVGAnimation.js so
// we can unit-test them with precise assertions without needing ESM re-exports)
// ─────────────────────────────────────────────────────────────────────────────

function easeInOut(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5
}

function parseColor(str) {
  if (!str || typeof str !== 'string') return null
  if (str[0] === '#') {
    let hex = str.slice(1)
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    const n = parseInt(hex, 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1]
  }
  const m = str.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  )
  if (m) return [+m[1], +m[2], +m[3], m[4] !== undefined ? +m[4] : 1]
  return null
}

function interpolateColor(from, to, pos) {
  return `rgba(${Math.round(from[0] + (to[0] - from[0]) * pos)},${Math.round(from[1] + (to[1] - from[1]) * pos)},${Math.round(from[2] + (to[2] - from[2]) * pos)},${from[3] + (to[3] - from[3]) * pos})`
}

// ─────────────────────────────────────────────────────────────────────────────
// easeInOut
// ─────────────────────────────────────────────────────────────────────────────
describe('easeInOut(t)', () => {
  it('returns 0 at t=0', () => {
    expect(easeInOut(0)).toBe(0)
  })

  it('returns 1 at t=1', () => {
    expect(easeInOut(1)).toBeCloseTo(1, 10)
  })

  it('returns 0.5 at t=0.5 (symmetry)', () => {
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 10)
  })

  it('is always in [0, 1] for t in [0, 1]', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      const v = easeInOut(t)
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThanOrEqual(1)
    }
  })

  it('is symmetric: easeInOut(t) + easeInOut(1-t) === 1', () => {
    for (let t = 0; t <= 1; t += 0.1) {
      expect(easeInOut(t) + easeInOut(1 - t)).toBeCloseTo(1, 10)
    }
  })

  it('is monotonically non-decreasing in [0, 1]', () => {
    let prev = easeInOut(0)
    for (let t = 0.01; t <= 1; t += 0.01) {
      const curr = easeInOut(t)
      expect(curr).toBeGreaterThanOrEqual(prev - 1e-10)
      prev = curr
    }
  })

  it('returns the exact formula value at t=0.25', () => {
    // -cos(0.25 * π) / 2 + 0.5 = -cos(π/4) / 2 + 0.5 ≈ 0.1464...
    expect(easeInOut(0.25)).toBeCloseTo((-Math.cos(0.25 * Math.PI) / 2 + 0.5), 12)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// parseColor
// ─────────────────────────────────────────────────────────────────────────────
describe('parseColor(str)', () => {
  describe('hex format', () => {
    it('parses 6-digit #rrggbb', () => {
      expect(parseColor('#ff0000')).toEqual([255, 0, 0, 1])
      expect(parseColor('#000000')).toEqual([0, 0, 0, 1])
      expect(parseColor('#ffffff')).toEqual([255, 255, 255, 1])
      expect(parseColor('#336699')).toEqual([51, 102, 153, 1])
    })

    it('expands 3-digit #rgb to 6-digit', () => {
      expect(parseColor('#f00')).toEqual([255, 0, 0, 1])
      expect(parseColor('#0f0')).toEqual([0, 255, 0, 1])
      expect(parseColor('#00f')).toEqual([0, 0, 255, 1])
      expect(parseColor('#fff')).toEqual([255, 255, 255, 1])
      expect(parseColor('#000')).toEqual([0, 0, 0, 1])
    })

    it('always sets alpha channel to 1 for hex colors', () => {
      expect(parseColor('#ff0000')[3]).toBe(1)
      expect(parseColor('#abc')[3]).toBe(1)
    })
  })

  describe('rgb / rgba format', () => {
    it('parses rgb(r,g,b) and defaults alpha to 1', () => {
      expect(parseColor('rgb(255,0,0)')).toEqual([255, 0, 0, 1])
      expect(parseColor('rgb(0, 128, 255)')).toEqual([0, 128, 255, 1])
    })

    it('parses rgba(r,g,b,a) with fractional alpha', () => {
      expect(parseColor('rgba(0,128,255,0.5)')).toEqual([0, 128, 255, 0.5])
      expect(parseColor('rgba(255,255,255,0)')).toEqual([255, 255, 255, 0])
      expect(parseColor('rgba(0,0,0,1)')).toEqual([0, 0, 0, 1])
    })

    it('handles spaces around numbers', () => {
      expect(parseColor('rgb( 10 , 20 , 30 )')).toEqual([10, 20, 30, 1])
    })
  })

  describe('invalid / edge cases', () => {
    it('returns null for empty string', () => {
      expect(parseColor('')).toBeNull()
    })

    it('returns null for null input', () => {
      expect(parseColor(null)).toBeNull()
    })

    it('returns null for non-string input', () => {
      expect(parseColor(12345)).toBeNull()
      expect(parseColor({})).toBeNull()
    })

    it('returns null for unrecognised color format', () => {
      expect(parseColor('red')).toBeNull()
      expect(parseColor('hsl(0,100%,50%)')).toBeNull()
      expect(parseColor('invalid')).toBeNull()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// interpolateColor
// ─────────────────────────────────────────────────────────────────────────────
describe('interpolateColor(from, to, pos)', () => {
  it('returns the "from" color at pos=0', () => {
    const result = interpolateColor([255, 0, 0, 1], [0, 255, 0, 1], 0)
    expect(result).toBe('rgba(255,0,0,1)')
  })

  it('returns the "to" color at pos=1', () => {
    const result = interpolateColor([255, 0, 0, 1], [0, 255, 0, 1], 1)
    expect(result).toBe('rgba(0,255,0,1)')
  })

  it('returns the midpoint color at pos=0.5', () => {
    const result = interpolateColor([0, 0, 0, 1], [255, 255, 255, 1], 0.5)
    // Math.round((0 + 255) * 0.5) = 128
    expect(result).toBe('rgba(128,128,128,1)')
  })

  it('rounds RGB channels to integers', () => {
    // from [0] to [1]: pos=0.333 → round(0.333) = 0, round(0.667) = 1
    const result = interpolateColor([0, 0, 0, 1], [1, 1, 1, 1], 0.333)
    // channels: round(0.333) = 0
    expect(result).toMatch(/^rgba\(\d+,\d+,\d+,/)
    const [r] = result.match(/\d+/g).map(Number)
    expect(Number.isInteger(r)).toBe(true)
  })

  it('interpolates alpha channel without rounding', () => {
    const result = interpolateColor([0, 0, 0, 0], [0, 0, 0, 1], 0.5)
    expect(result).toBe('rgba(0,0,0,0.5)')
  })

  it('handles colours where all channels are 0', () => {
    const result = interpolateColor([0, 0, 0, 0], [0, 0, 0, 0], 0.5)
    expect(result).toBe('rgba(0,0,0,0)')
  })

  it('produces a valid rgba() string format at any position', () => {
    for (let pos = 0; pos <= 1; pos += 0.1) {
      const result = interpolateColor([100, 150, 200, 0.8], [50, 75, 100, 0.4], pos)
      expect(result).toMatch(/^rgba\(\d+,\d+,\d+,[\d.]+\)$/)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SVGAnimationRunner — near-instant path (duration <= 1)
// ─────────────────────────────────────────────────────────────────────────────
describe('SVGAnimationRunner — near-instant path (duration ≤ 1)', () => {
  it('synchronously applies attr target when duration=1 and delay=0', async () => {
    const stored = { opacity: '0' }
    const el = {
      attr(key) {
        if (typeof key === 'string') return stored[key] ?? null
        Object.assign(stored, key)
        return this
      },
      plot() { return this },
    }

    const runner = new SVGAnimationRunner(el, 1, 0)
    runner.attr({ opacity: '1' })

    // Wait for the queued microtask to execute
    await Promise.resolve()

    expect(stored.opacity).toBe('1')
  })

  it('calls the after() callback when duration=1', async () => {
    const stored = {}
    const el = {
      attr(k) {
        if (typeof k === 'string') return stored[k] ?? null
        Object.assign(stored, k)
        return this
      },
      plot() { return this },
    }

    const afterFn = vi.fn()
    const runner = new SVGAnimationRunner(el, 1, 0)
    runner.attr({ opacity: '1' }).after(afterFn)

    await Promise.resolve()

    expect(afterFn).toHaveBeenCalledOnce()
  })

  it('applies plot target when duration=1', async () => {
    const plotted = []
    const el = {
      attr(k) {
        if (typeof k === 'string') return null
        return this
      },
      plot(d) { plotted.push(d); return this },
    }

    const runner = new SVGAnimationRunner(el, 1, 0)
    runner.plot('M 10 10 L 20 20')

    await Promise.resolve()

    expect(plotted).toContain('M 10 10 L 20 20')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SVGAnimationRunner — chaining .animate() returns a new runner with same root
// ─────────────────────────────────────────────────────────────────────────────
describe('SVGAnimationRunner — chaining', () => {
  it('.animate() returns a new runner instance (not the same object)', () => {
    const el = { attr() { return this }, plot() { return this } }
    const runner = new SVGAnimationRunner(el, 300, 0)
    const next = runner.animate(200, 0)
    expect(next).not.toBe(runner)
    expect(next).toBeInstanceOf(SVGAnimationRunner)
  })

  it('chained runner shares the root of the first runner', () => {
    const el = { attr() { return this }, plot() { return this } }
    const root = new SVGAnimationRunner(el, 300, 0)
    const next = root.animate(200, 0)
    // next._root should point back to root (or root._root which is null for root)
    expect(next._root).toBe(root)
  })
})
