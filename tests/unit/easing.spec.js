import {
  easeInOutSine,
  DEFAULT_EASING_NAME,
  cubicBezier,
  registerEasing,
  resolveEasing,
} from '../../src/modules/animations/Easing.js'

// Easing.js is default-on (the generic runner tween resolves
// `chart.animations.easing` through resolveEasing) and was previously at 0%
// coverage. These tests lock the endpoints, the registry/resolve fallbacks, and
// the NaN-sanitization guard so future tuning can't silently poison tweens.

const BUILTIN_NAMES = [
  'linear',
  'easeInOutSine',
  'easeInSine',
  'easeOutSine',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'easeOutBack',
  'easeInOutBack',
]

describe('Easing: built-in named easings', () => {
  it('easeInOutSine pins endpoints and midpoint', () => {
    expect(easeInOutSine(0)).toBeCloseTo(0, 10)
    expect(easeInOutSine(1)).toBeCloseTo(1, 10)
    expect(easeInOutSine(0.5)).toBeCloseTo(0.5, 10)
  })

  it('DEFAULT_EASING_NAME resolves to the sine ease', () => {
    expect(DEFAULT_EASING_NAME).toBe('easeInOutSine')
    const fn = resolveEasing(DEFAULT_EASING_NAME)
    expect(fn(0.5)).toBeCloseTo(easeInOutSine(0.5), 10)
  })

  it('every built-in maps 0 -> 0 and 1 -> 1', () => {
    BUILTIN_NAMES.forEach((name) => {
      const fn = resolveEasing(name)
      expect(fn(0)).toBeCloseTo(0, 6)
      expect(fn(1)).toBeCloseTo(1, 6)
    })
  })

  it('linear is the identity', () => {
    const fn = resolveEasing('linear')
    expect(fn(0.25)).toBeCloseTo(0.25, 10)
    expect(fn(0.8)).toBeCloseTo(0.8, 10)
  })

  it('back easings overshoot above 1 before settling', () => {
    const back = resolveEasing('easeOutBack')
    const peak = Math.max(
      ...Array.from({ length: 99 }, (_, i) => back((i + 1) / 100)),
    )
    expect(peak).toBeGreaterThan(1)
  })
})

describe('cubicBezier', () => {
  it('pins the endpoints exactly', () => {
    const fn = cubicBezier(0.42, 0, 0.58, 1)
    expect(fn(0)).toBe(0)
    expect(fn(1)).toBe(1)
  })

  it('linear control points approximate the identity', () => {
    const fn = cubicBezier(0, 0, 1, 1)
    for (const t of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      expect(fn(t)).toBeCloseTo(t, 2)
    }
  })

  it('is monotonic non-decreasing for a standard ease', () => {
    const fn = cubicBezier(0.25, 0.1, 0.25, 1)
    let prev = -Infinity
    for (let i = 0; i <= 100; i++) {
      const y = fn(i / 100)
      expect(y).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = y
    }
  })

  it('clamps out-of-range x control points and stays finite', () => {
    const fn = cubicBezier(-5, 0, 5, 1)
    expect(Number.isFinite(fn(0.5))).toBe(true)
    expect(fn(0)).toBe(0)
    expect(fn(1)).toBe(1)
  })
})

describe('resolveEasing', () => {
  it('passes a user function through (guarded)', () => {
    const fn = resolveEasing((t) => t * t)
    expect(fn(0.5)).toBeCloseTo(0.25, 10)
  })

  it('accepts a [x1,y1,x2,y2] bezier array', () => {
    const fn = resolveEasing([0, 0, 1, 1])
    expect(fn(0.5)).toBeCloseTo(0.5, 2)
  })

  it('falls back to the default sine ease for an unknown name', () => {
    const fn = resolveEasing('does-not-exist')
    expect(fn(0.5)).toBeCloseTo(easeInOutSine(0.5), 10)
  })

  it('falls back to the default for a non-4 array or garbage input', () => {
    expect(resolveEasing([1, 2, 3])(0.5)).toBeCloseTo(easeInOutSine(0.5), 10)
    expect(resolveEasing(null)(0.5)).toBeCloseTo(easeInOutSine(0.5), 10)
    expect(resolveEasing(42)(0.5)).toBeCloseTo(easeInOutSine(0.5), 10)
  })

  it('sanitizes a NaN / undefined / Infinity easing to the linear position', () => {
    expect(resolveEasing(() => NaN)(0.37)).toBe(0.37)
    expect(resolveEasing(() => undefined)(0.6)).toBe(0.6)
    expect(resolveEasing(() => Infinity)(0.2)).toBe(0.2)
  })
})

describe('registerEasing', () => {
  it('registers a valid named easing that resolveEasing can find', () => {
    registerEasing('myTestEase', (t) => t * 0.5)
    expect(resolveEasing('myTestEase')(1)).toBeCloseTo(0.5, 10)
  })

  it('ignores a missing name or non-function without throwing', () => {
    expect(() => registerEasing('', (t) => t)).not.toThrow()
    expect(() => registerEasing('bad', 123)).not.toThrow()
    // 'bad' was never registered => resolves to the default sine ease.
    expect(resolveEasing('bad')(0.5)).toBeCloseTo(easeInOutSine(0.5), 10)
  })
})
