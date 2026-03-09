/**
 * Pure-class tests for src/svg/math.js
 *
 * Point, Matrix, and Box — pure linear-algebra, zero DOM dependency.
 * Covers all branches in the constructors and methods.
 */

import { describe, it, expect } from 'vitest'
import { Point, Matrix, Box } from '../../src/svg/math.js'

// ─────────────────────────────────────────────────────────────────────────────
// Point
// ─────────────────────────────────────────────────────────────────────────────
describe('Point', () => {
  describe('constructor', () => {
    it('creates a point from two numbers', () => {
      const p = new Point(3, 4)
      expect(p.x).toBe(3)
      expect(p.y).toBe(4)
    })

    it('creates a point from an object with x/y', () => {
      const p = new Point({ x: 7, y: 9 })
      expect(p.x).toBe(7)
      expect(p.y).toBe(9)
    })

    it('defaults x and y to 0 when called with (0, 0)', () => {
      // x || 0 → when x=0 the || fires, but result is still 0
      const p = new Point(0, 0)
      expect(p.x).toBe(0)
      expect(p.y).toBe(0)
    })

    it('defaults missing y to 0', () => {
      const p = new Point(5)
      expect(p.x).toBe(5)
      expect(p.y).toBe(0)
    })

    it('handles negative values', () => {
      const p = new Point(-10, -20)
      expect(p.x).toBe(-10)
      expect(p.y).toBe(-20)
    })
  })

  describe('clone()', () => {
    it('returns a new Point with the same coordinates', () => {
      const p = new Point(5, 8)
      const c = p.clone()
      expect(c).not.toBe(p)
      expect(c.x).toBe(5)
      expect(c.y).toBe(8)
    })

    it('clone is independent — mutating original does not affect clone', () => {
      const p = new Point(1, 2)
      const c = p.clone()
      p.x = 99
      expect(c.x).toBe(1)
    })
  })

  describe('transform(matrix)', () => {
    it('applies identity matrix — point is unchanged', () => {
      const p = new Point(3, 4)
      const identity = new Matrix() // a=1, b=0, c=0, d=1, e=0, f=0
      const result = p.transform(identity)
      expect(result.x).toBe(3)
      expect(result.y).toBe(4)
    })

    it('applies a translation matrix correctly', () => {
      const p = new Point(0, 0)
      // Matrix(1,0,0,1,tx,ty) translates by (tx, ty)
      const translate = new Matrix(1, 0, 0, 1, 10, 20)
      const result = p.transform(translate)
      expect(result.x).toBe(10)
      expect(result.y).toBe(20)
    })

    it('applies a scale matrix correctly', () => {
      const p = new Point(3, 4)
      const scale2x = new Matrix(2, 0, 0, 2, 0, 0)
      const result = p.transform(scale2x)
      expect(result.x).toBe(6)
      expect(result.y).toBe(8)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Matrix
// ─────────────────────────────────────────────────────────────────────────────
describe('Matrix', () => {
  describe('constructor', () => {
    it('creates identity matrix with no arguments', () => {
      const m = new Matrix()
      expect(m.a).toBe(1)
      expect(m.b).toBe(0)
      expect(m.c).toBe(0)
      expect(m.d).toBe(1)
      expect(m.e).toBe(0)
      expect(m.f).toBe(0)
    })

    it('accepts all 6 explicit parameters', () => {
      const m = new Matrix(2, 3, 4, 5, 6, 7)
      expect(m.a).toBe(2)
      expect(m.b).toBe(3)
      expect(m.c).toBe(4)
      expect(m.d).toBe(5)
      expect(m.e).toBe(6)
      expect(m.f).toBe(7)
    })
  })

  describe('multiply(m)', () => {
    it('multiplying by identity leaves matrix unchanged', () => {
      const m = new Matrix(2, 3, 4, 5, 6, 7)
      const identity = new Matrix()
      const result = m.multiply(identity)
      expect(result.a).toBe(m.a)
      expect(result.d).toBe(m.d)
      expect(result.e).toBe(m.e)
    })

    it('multiplying two known matrices produces correct result', () => {
      // [a c e]   [1 0 1]
      // [b d f] × [0 1 1]
      // [0 0 1]   [0 0 1]
      // Result: a*1+c*0=a, etc.
      const m1 = new Matrix(1, 0, 0, 1, 3, 4) // translate(3,4)
      const m2 = new Matrix(2, 0, 0, 2, 0, 0) // scale(2)
      const result = m1.multiply(m2)
      // a = 1*2+0*0=2, d = 0*0+1*2=2
      expect(result.a).toBe(2)
      expect(result.d).toBe(2)
    })
  })

  describe('rotate(deg)', () => {
    it('rotate(0) returns an identity-like matrix', () => {
      const m = new Matrix()
      const rotated = m.rotate(0)
      expect(rotated.a).toBeCloseTo(1, 10)
      expect(rotated.b).toBeCloseTo(0, 10)
      expect(rotated.c).toBeCloseTo(0, 10)
      expect(rotated.d).toBeCloseTo(1, 10)
    })

    it('rotate(90) swaps x and y', () => {
      const m = new Matrix()
      const rotated = m.rotate(90)
      // cos(90°) ≈ 0, sin(90°) ≈ 1
      expect(rotated.a).toBeCloseTo(0, 5)
      expect(rotated.b).toBeCloseTo(1, 5)
      expect(rotated.c).toBeCloseTo(-1, 5)
      expect(rotated.d).toBeCloseTo(0, 5)
    })

    it('rotate(180) negates x and y', () => {
      const m = new Matrix()
      const rotated = m.rotate(180)
      expect(rotated.a).toBeCloseTo(-1, 5)
      expect(rotated.d).toBeCloseTo(-1, 5)
    })

    it('rotate(360) returns near-identity', () => {
      const m = new Matrix()
      const rotated = m.rotate(360)
      expect(rotated.a).toBeCloseTo(1, 5)
      expect(rotated.d).toBeCloseTo(1, 5)
      expect(rotated.b).toBeCloseTo(0, 5)
      expect(rotated.c).toBeCloseTo(0, 5)
    })

    it('applying a rotation transforms a point correctly', () => {
      const p = new Point(1, 0)
      const rot90 = new Matrix().rotate(90)
      const result = p.transform(rot90)
      // (1,0) rotated 90° → (0,1)
      expect(result.x).toBeCloseTo(0, 5)
      expect(result.y).toBeCloseTo(1, 5)
    })
  })

  describe('scale(sx, sy)', () => {
    it('scale(2) scales both axes equally', () => {
      const m = new Matrix()
      const scaled = m.scale(2)
      const p = new Point(3, 4).transform(scaled)
      expect(p.x).toBeCloseTo(6, 10)
      expect(p.y).toBeCloseTo(8, 10)
    })

    it('scale(2, 3) scales axes independently', () => {
      const m = new Matrix()
      const scaled = m.scale(2, 3)
      const p = new Point(1, 1).transform(scaled)
      expect(p.x).toBeCloseTo(2, 10)
      expect(p.y).toBeCloseTo(3, 10)
    })

    it('scale(sx) with single arg: sy defaults to sx (??sx branch)', () => {
      // In the code: sy ?? sx  — when sy is undefined, use sx
      const m = new Matrix()
      const scaled = m.scale(5)
      // Both axes should be scaled by 5
      const p = new Point(2, 3).transform(scaled)
      expect(p.x).toBeCloseTo(10, 10)
      expect(p.y).toBeCloseTo(15, 10)
    })
  })

  describe('apply(point)', () => {
    it('applies the matrix transform to a point directly', () => {
      // translate(10, 20) applied to (5, 5) → (15, 25)
      const m = new Matrix(1, 0, 0, 1, 10, 20)
      const result = m.apply(new Point(5, 5))
      expect(result.x).toBe(15)
      expect(result.y).toBe(25)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Box
// ─────────────────────────────────────────────────────────────────────────────
describe('Box', () => {
  it('stores x, y, w, h and computes width/height/x2/y2', () => {
    const b = new Box(10, 20, 100, 50)
    expect(b.x).toBe(10)
    expect(b.y).toBe(20)
    expect(b.w).toBe(100)
    expect(b.h).toBe(50)
    expect(b.width).toBe(100)
    expect(b.height).toBe(50)
    expect(b.x2).toBe(110)
    expect(b.y2).toBe(70)
  })

  it('handles zero-size boxes', () => {
    const b = new Box(0, 0, 0, 0)
    expect(b.x2).toBe(0)
    expect(b.y2).toBe(0)
  })

  it('handles negative origin', () => {
    const b = new Box(-5, -10, 20, 30)
    expect(b.x2).toBe(15)
    expect(b.y2).toBe(20)
  })
})
