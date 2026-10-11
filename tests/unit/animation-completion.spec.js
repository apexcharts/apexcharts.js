import { describe, it, expect, vi } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'

// A runner double: el.plot().animate().plot().after(fn) records `fn` so the
// test can land the morph when it chooses.
function makeEl() {
  let afterCb = null
  const runner = {
    animate: () => runner,
    ease: () => runner,
    plot: () => runner,
    after(fn) {
      afterCb = fn
      return runner
    },
  }
  return {
    node: { classList: { remove: vi.fn(), add: vi.fn() } },
    attr: () => null,
    plot: () => runner,
    land() {
      afterCb?.call(this)
    },
  }
}

describe('morphSVG completion', () => {
  it('fires animationEnd when a single-category morph lands', () => {
    const animationEnd = vi.fn()
    const chart = createChartWithOptions({
      chart: { type: 'bar', events: { animationEnd } },
      series: [{ data: [5] }],
      xaxis: { categories: ['A'] },
    })
    const w = chart.w
    w.globals.animationEnded = false
    w.globals.shouldAnimate = true
    w.globals.morphBatch = { pending: 0, onDone: null, series: new Map() }

    const el = makeEl()
    chart.animations.morphSVG(el, 0, 0, 'fill', 'M 0 0', 'M 1 1', 300, 0)
    // The penultimate-point rule has no point to wait for with one category.
    el.land()

    expect(animationEnd).toHaveBeenCalledOnce()
    expect(w.globals.animationEnded).toBe(true)
  })

  it('waits for the last morph of the render, not the first', () => {
    const chart = createChart('bar', [{ data: [5] }])
    const w = chart.w
    w.globals.animationEnded = false
    w.globals.shouldAnimate = true
    w.globals.morphBatch = { pending: 0, onDone: null, series: new Map() }

    const a = makeEl()
    const b = makeEl()
    chart.animations.morphSVG(a, 0, 0, 'fill', 'M 0 0', 'M 1 1', 300, 0)
    chart.animations.morphSVG(b, 1, 0, 'fill', 'M 0 0', 'M 1 1', 300, 0)
    a.land()
    expect(w.globals.animationEnded).toBe(false)
    b.land()
    expect(w.globals.animationEnded).toBe(true)
  })

  it('ignores a morph left over from an earlier render', () => {
    const chart = createChart('bar', [{ data: [5] }])
    const w = chart.w
    w.globals.animationEnded = false
    w.globals.shouldAnimate = true
    w.globals.morphBatch = { pending: 0, onDone: null, series: new Map() }

    const stale = makeEl()
    chart.animations.morphSVG(stale, 0, 0, 'fill', 'M 0 0', 'M 1 1', 300, 0)
    // The next render starts its own batch before the old morph lands.
    w.globals.morphBatch = { pending: 1, onDone: null, series: new Map() }
    w.globals.animationEnded = false
    stale.land()

    expect(w.globals.animationEnded).toBe(false)
  })

  it('does not fire animationEnd for a chart destroyed mid-morph', () => {
    const animationEnd = vi.fn()
    const chart = createChartWithOptions({
      chart: { type: 'bar', events: { animationEnd } },
      series: [{ data: [5, 6, 7] }],
    })
    const w = chart.w
    const animations = chart.animations
    w.globals.animationEnded = false
    w.globals.shouldAnimate = true

    const el = makeEl()
    animations.morphSVG(el, 0, 1, 'fill', 'M 0 0', 'M 1 1', 300, 0)
    chart.destroy()
    expect(() => el.land()).not.toThrow()
    expect(() => animations.animationCompleted(el)).not.toThrow()

    expect(animationEnd).not.toHaveBeenCalled()
  })
})
