import { describe, it, expect } from 'vitest'
import { applyProgressiveReveal } from '../../src/modules/Animations.js'

// The marker / label sweep follows the line's pen. When the pen does not
// run, the sweep would hide marks for 1.6 s with nothing to follow.
function makeW({ speed = 800, renderer = null, shouldAnimate = true } = {}) {
  return {
    config: { chart: { type: 'line', animations: { enabled: true, speed } } },
    globals: {
      dataChanged: false,
      resized: false,
      shouldAnimate,
      activeRenderer: renderer ? { kind: renderer } : null,
    },
    layout: { gridWidth: 400 },
  }
}

function makeEl() {
  return { node: { style: {} } }
}

describe('applyProgressiveReveal gate', () => {
  it('sweeps when the draw effect runs', () => {
    const el = makeEl()
    expect(applyProgressiveReveal(el, 200, makeW())).toBe(true)
    expect(el.node.style.opacity).toBe('0')
  })

  it('does not sweep at speed 0, where the draw is skipped', () => {
    const el = makeEl()
    expect(applyProgressiveReveal(el, 200, makeW({ speed: 0 }))).toBe(false)
    expect(el.node.style.opacity).toBeUndefined()
  })

  it('does not sweep on the canvas renderer', () => {
    const el = makeEl()
    expect(applyProgressiveReveal(el, 200, makeW({ renderer: 'canvas' }))).toBe(
      false,
    )
  })

  it('does not sweep when this render does not animate', () => {
    const el = makeEl()
    expect(
      applyProgressiveReveal(el, 200, makeW({ shouldAnimate: false })),
    ).toBe(false)
  })
})
