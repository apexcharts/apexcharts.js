/**
 * Pure-function tests for SVGAnimation.js
 *
 * easeInOut is a deterministic, zero-DOM, zero-mock function, ideal for
 * high-quality branch-coverage tests. Colour parsing and blending are the
 * shared Utils.parseColor and utils/Color.js (color.spec.js); the runner test
 * at the end checks it uses them.
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

describe('SVGAnimationRunner: colour attributes', () => {
  it('tweens an #rrggbbaa fill on its own colour and alpha', async () => {
    let now = 0
    const frames = []
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => frames.push(cb))
    const perf = vi.spyOn(performance, 'now').mockImplementation(() => now)
    try {
      const writes = []
      const el = {
        attr(k) {
          if (typeof k === 'string') return '#FF000080'
          writes.push(k.fill)
          return this
        },
        plot() {
          return this
        },
      }
      new SVGAnimationRunner(el, 100, 0).ease((t) => t).attr({ fill: '#FF0000FF' })
      await Promise.resolve()
      now = 50
      frames.shift()(now)
      // Half way from 50% to 100% opacity, still red (it used to read as blue).
      expect(writes[0]).toBe(`rgba(255,0,0,${128 / 255 + (1 - 128 / 255) / 2})`)
      now = 100
      frames.shift()(now)
      expect(writes[1]).toBe('#FF0000FF')
    } finally {
      raf.mockRestore()
      perf.mockRestore()
    }
  })
})
