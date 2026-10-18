// The sunburst and the icicle used to carry two copies of the same transition
// scaffold (mode gate, clock, prev-geometry stash, label fade, glyph width),
// and the copies drifted: the icicle's mode gate never learned to honour
// updateSeries(data, false). Both now read one module; this pins its rules.
import { describe, it, expect } from 'vitest'
import {
  CHAR_W_EM,
  durationFor,
  fadeInAfter,
  handOffGeoms,
  lerp,
  resolveMode,
} from '../../src/charts/common/partition/Transitions.js'

const w = ({ enabled = true, dyn = true, dataChanged = false, resized = false, shouldAnimate = true } = {}) => ({
  config: {
    chart: {
      animations: {
        enabled,
        speed: 800,
        dynamicAnimation: { enabled: dyn, speed: 350 },
      },
    },
  },
  globals: { dataChanged, resized, shouldAnimate },
})

describe('partition transition scaffold', () => {
  it('resolves the render mode like the pie family', () => {
    expect(resolveMode(w())).toBe('intro')
    expect(resolveMode(w({ resized: true }))).toBe('none')
    expect(resolveMode(w({ enabled: false }))).toBe('none')
    expect(resolveMode(w({ dataChanged: true }))).toBe('update')
    expect(resolveMode(w({ dataChanged: true, dyn: false }))).toBe('none')
    // updateSeries(data, false)
    expect(resolveMode(w({ dataChanged: true, shouldAnimate: false }))).toBe('none')
  })

  it('runs the intro on animations.speed and a zoom or update on the interaction clock', () => {
    expect(durationFor(w(), 'intro')).toBe(800)
    expect(durationFor(w(), 'zoom')).toBe(350)
    expect(durationFor(w(), 'update')).toBe(350)
    expect(durationFor(w({ dyn: false }), 'zoom')).toBe(0)
    expect(durationFor(w({ enabled: false }), 'intro')).toBe(0)
    expect(durationFor(w(), 'none')).toBe(0)
  })

  it('reveals labels only while their pass is current', () => {
    const attrs = []
    let during
    const group = {
      attr: (a) => attrs.push(a.opacity),
      animate: (d, delay) => {
        attrs.push(`animate ${d} after ${delay}`)
        return { during: (fn) => (during = fn) }
      },
    }
    let alive = true
    fadeInAfter(group, 300, () => alive)
    during(0.5)
    alive = false
    during(0.9)
    expect(attrs).toEqual([0, 'animate 250 after 300', 0.5])

    const still = []
    fadeInAfter({ attr: (a) => still.push(a.opacity) }, 0, () => true)
    expect(still).toEqual([1])
  })

  it('hands geometry to the next render by key, skipping what is not kept', () => {
    const ctx = {}
    handOffGeoms(ctx, '_slot', [{ _key: 'a', on: 1 }, { _key: 'b' }], (n) => n.on && n)
    expect([...ctx._slot.keys()]).toEqual(['a'])
  })

  it('shares the glyph-width estimate and lerp', () => {
    expect(CHAR_W_EM).toBe(0.58)
    expect(lerp(10, 20, 0.25)).toBe(12.5)
  })
})
