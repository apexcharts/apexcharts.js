import { decimalsOf } from '../../src/modules/animations/DataLabelTransition.js'

// decimalsOf drives the per-frame rounding of a count-up data label. It used to
// mis-read exponential notation (String(1e-7) has no '.'), reporting 0 decimals
// so a count-up on a tiny value rendered "0" throughout.
describe('DataLabelTransition.decimalsOf', () => {
  it('counts plain decimal places', () => {
    expect(decimalsOf(5)).toBe(0)
    expect(decimalsOf(5.25)).toBe(2)
    expect(decimalsOf(0.001)).toBe(3)
  })

  it('ignores the sign', () => {
    expect(decimalsOf(-2.5)).toBe(1)
    expect(decimalsOf(-100)).toBe(0)
  })

  it('caps at 6 decimals', () => {
    expect(decimalsOf(1.23456789)).toBe(6)
  })

  it('handles exponential notation (regression: was 0)', () => {
    expect(decimalsOf(1e-7)).toBe(6) // 0.0000001
    expect(decimalsOf(1.5e-7)).toBe(6)
    expect(decimalsOf(1e-3)).toBe(3) // 0.001
    expect(decimalsOf(1e3)).toBe(0) // 1000 (large exp -> no decimals)
    expect(decimalsOf(1e21)).toBe(0) // very large, String() uses "1e+21"
  })

  it('returns 0 for non-finite input', () => {
    expect(decimalsOf(NaN)).toBe(0)
    expect(decimalsOf(Infinity)).toBe(0)
  })
})
