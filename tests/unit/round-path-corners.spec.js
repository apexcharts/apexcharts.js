import Graphics from '../../src/modules/Graphics.js'

// roundPathCorners() (an externally-sourced SVG corner-rounder, used for bar
// borderRadius) had 0% coverage. It uses no instance state, so we can call it on
// a bare prototype. These tests lock its observable contract: valid output, the
// NaN guard, the pass-through for un-roundable paths, and that L->L corners
// become quadratic/cubic curves. Golden snapshots pin the exact emitted string
// so future edits to the rounding math surface as a diff.
const round = (d, r) =>
  Object.create(Graphics.prototype).roundPathCorners(d, r)

describe('Graphics.roundPathCorners', () => {
  it('rounds the corners of a closed square into curve commands', () => {
    const out = round('M0 0 L100 0 L100 100 L0 100 Z', 10)
    expect(out).toContain('C') // corners became cubic beziers
    expect(out.trim().startsWith('M')).toBe(true)
    expect(out).not.toContain('NaN')
  })

  it('neutralizes a path containing NaN (never emits NaN)', () => {
    const out = round('M0 0 L NaN 5 L100 100', 10)
    expect(out).not.toContain('NaN')
  })

  it('passes a single-command path through without adding curves', () => {
    const out = round('M5 5', 10)
    expect(out).not.toContain('C')
    expect(out).toContain('5')
    expect(out).not.toContain('NaN')
  })

  it('does not throw and stays finite for a zero radius', () => {
    const out = round('M0 0 L100 0 L100 100 L0 100 Z', 0)
    expect(out).not.toContain('NaN')
    expect(out.trim().startsWith('M')).toBe(true)
  })

  it('produces stable output for an open 3-point corner (golden)', () => {
    expect(round('M0 0 L50 0 L50 50', 8)).toMatchSnapshot()
  })

  it('produces stable output for a rounded square (golden)', () => {
    expect(round('M0 0 L100 0 L100 100 L0 100 Z', 12)).toMatchSnapshot()
  })
})
