import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createChart, createChartWithOptions } from './utils/utils.js'

function getAnimations(chart) {
  return chart.animations
}

// Minimal SVG-element double that faithfully records the full animate() call chain.
// The key invariant: el.animate(speed) records `speed` in el.animateSpeeds, then
// returns a runner that supports the full builder chain (attr/plot/after).
function makeEl(attrs = {}) {
  const stored = { ...attrs }
  let afterCb = null
  const animateSpeeds = []

  const runner = {
    attr(to) {
      if (typeof to === 'object') Object.assign(stored, to)
      return runner
    },
    animate(speed, _delay) {
      animateSpeeds.push(speed)
      return runner
    },
    plot(_d) { return runner },
    after(fn) { afterCb = fn; return runner },
  }

  const el = {
    stored,
    animateSpeeds,
    node: { classList: { remove: vi.fn(), add: vi.fn() } },
    attr(key) {
      if (typeof key === 'string') return stored[key] ?? null
      Object.assign(stored, key)
      return this
    },
    animate(speed, _delay) {
      animateSpeeds.push(speed)
      return runner
    },
    plot(_d) { return runner },
    runAfter() { afterCb?.call(this) },
  }

  return el
}

describe('Animations — animationCompleted()', () => {
  it('sets animationEnded=true the first time it is called', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.animationEnded = false
    w.globals.delayedElements = []

    animations.animationCompleted(makeEl())

    expect(w.globals.animationEnded).toBe(true)
  })

  it('is idempotent — calling a second time leaves animationEnded=true unchanged', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.animationEnded = true
    w.globals.delayedElements = []

    animations.animationCompleted(makeEl())
    expect(w.globals.animationEnded).toBe(true)
  })

  it('fires chart.events.animationEnd callback with (chartInstance, { el, w })', () => {
    const animationEnd = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
        events: { animationEnd },
      },
      series: [{ data: [1, 2, 3] }],
    })
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.animationEnded = false
    w.globals.delayedElements = []

    const el = makeEl()
    animations.animationCompleted(el)

    expect(animationEnd).toHaveBeenCalledOnce()
    const [ctx, options] = animationEnd.mock.calls[0]
    expect(ctx).toBe(chart)
    expect(options.el).toBe(el)
    expect(options.w).toBe(w)
  })

  it('does NOT fire animationEnd when animation was already ended', () => {
    const animationEnd = vi.fn()
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
        events: { animationEnd },
      },
      series: [{ data: [1, 2, 3] }],
    })
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.animationEnded = true
    w.globals.delayedElements = []

    animations.animationCompleted(makeEl())

    expect(animationEnd).not.toHaveBeenCalled()
  })
})

describe('Animations — showDelayedElements()', () => {
  it('removes the hidden class and adds the shown class on each delayed element', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    const el1 = { classList: { remove: vi.fn(), add: vi.fn() } }
    const el2 = { classList: { remove: vi.fn(), add: vi.fn() } }
    w.globals.delayedElements = [{ el: el1 }, { el: el2 }]

    animations.showDelayedElements()

    expect(el1.classList.remove).toHaveBeenCalledWith('apexcharts-element-hidden')
    expect(el1.classList.add).toHaveBeenCalledWith('apexcharts-hidden-element-shown')
    expect(el2.classList.remove).toHaveBeenCalledWith('apexcharts-element-hidden')
    expect(el2.classList.add).toHaveBeenCalledWith('apexcharts-hidden-element-shown')
  })

  it('visits both elements exactly once each', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    const el1 = { classList: { remove: vi.fn(), add: vi.fn() } }
    const el2 = { classList: { remove: vi.fn(), add: vi.fn() } }
    w.globals.delayedElements = [{ el: el1 }, { el: el2 }]

    animations.showDelayedElements()

    expect(el1.classList.remove).toHaveBeenCalledTimes(1)
    expect(el2.classList.add).toHaveBeenCalledTimes(1)
  })

  it('handles empty delayedElements without throwing', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.delayedElements = []

    expect(() => animations.showDelayedElements()).not.toThrow()
  })
})

describe('Animations — morphSVG() speed override', () => {
  it('overrides speed to exactly 1 for every animate() call when shouldAnimate=false', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.shouldAnimate = false
    w.globals.delayedElements = []
    w.globals.dataChanged = false

    const el = makeEl({ pathFrom: 'M 0 0', pathTo: 'M 10 10' })

    // Pass speed=800 — must be overridden to 1
    animations.morphSVG(el, 0, null, 'fill', 'M 0 0', 'M 10 10', 800, 0)

    expect(el.animateSpeeds.length).toBeGreaterThan(0)
    expect(el.animateSpeeds.every((s) => s === 1)).toBe(true)
  })

  it('uses the caller-supplied speed when shouldAnimate=true', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.shouldAnimate = true
    w.globals.delayedElements = []
    w.globals.dataChanged = false
    w.globals.animationEnded = false

    const el = makeEl({ pathFrom: 'M 0 0', pathTo: 'M 10 10' })

    animations.morphSVG(el, 0, null, 'fill', 'M 0 0', 'M 10 10', 500, 0)

    // At least one animate() call must use the supplied speed
    expect(el.animateSpeeds.some((s) => s === 500)).toBe(true)
    // None should be the override value 1
    expect(el.animateSpeeds.every((s) => s === 1)).toBe(false)
  })

  it('plots "M 0 <gridHeight>" as the fallback when pathFrom contains "undefined"', () => {
    const chart = createChart('line', [{ data: [1, 2, 3] }])
    const w = chart.w
    const animations = getAnimations(chart)

    w.globals.shouldAnimate = false
    w.globals.delayedElements = []
    w.globals.dataChanged = false
    w.layout = { gridHeight: 300 }

    const plotCalls = []
    const el = {
      stored: {},
      animateSpeeds: [],
      node: { classList: { remove: vi.fn(), add: vi.fn() } },
      attr(key) {
        if (typeof key === 'string') return this.stored[key] ?? null
        Object.assign(this.stored, key)
        return this
      },
      plot(d) {
        plotCalls.push(d)
        return this
      },
      animate(speed) {
        this.animateSpeeds.push(speed)
        const runner = {
          attr() { return runner },
          animate() { return runner },
          plot(d) { plotCalls.push(d); return runner },
          after() { return runner },
        }
        return runner
      },
    }

    // pathFrom contains 'undefined' — triggers disableAnimationForCorruptPath
    animations.morphSVG(el, 0, null, 'fill', 'M undefined 0', 'M 10 10', 1, 0)

    // First plot() call must use the fallback path
    expect(plotCalls[0]).toBe('M 0 300')
  })
})

describe('Animations — animatePathsGradually() delayFactor', () => {
  it('passes delay*0=0 to morphSVG when animateGradually is disabled', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
        animations: {
          enabled: true,
          animateGradually: { enabled: false, delay: 150 },
          dynamicAnimation: { enabled: true },
        },
      },
      series: [{ data: [1, 2, 3] }],
    })
    const animations = getAnimations(chart)

    const morphSpy = vi.spyOn(animations, 'morphSVG').mockImplementation(() => {})

    animations.animatePathsGradually({
      el: {},
      realIndex: 0,
      j: 0,
      fill: 'solid',
      pathFrom: 'M 0 0',
      pathTo: 'M 10 10',
      speed: 300,
      delay: 1,
    })

    // delay * delayFactor = 1 * 0 = 0; the two trailing args are the
    // stream-scroll flag and the reconciled interp target (both unset here)
    expect(morphSpy).toHaveBeenCalledWith(
      {}, 0, 0,
      expect.any(String),
      'M 0 0', 'M 10 10',
      300,
      0,
      undefined,
      undefined
    )
  })

  it('applies delayFactor when animateGradually is enabled: delay * configuredDelay', () => {
    const chart = createChartWithOptions({
      chart: {
        type: 'line',
        animations: {
          enabled: true,
          animateGradually: { enabled: true, delay: 50 },
          dynamicAnimation: { enabled: false },
        },
      },
      series: [{ data: [1, 2, 3] }],
    })
    const animations = getAnimations(chart)

    const morphSpy = vi.spyOn(animations, 'morphSVG').mockImplementation(() => {})

    animations.animatePathsGradually({
      el: {},
      realIndex: 0,
      j: 0,
      fill: 'solid',
      pathFrom: 'M 0 0',
      pathTo: 'M 10 10',
      speed: 300,
      delay: 2,
    })

    // delay * delayFactor = 2 * 50 = 100; trailing stream-scroll flag and
    // interp target are unset outside a data-change morph
    expect(morphSpy).toHaveBeenCalledWith(
      {}, 0, 0,
      expect.any(String),
      'M 0 0', 'M 10 10',
      300,
      100,
      undefined,
      undefined
    )
  })
})

describe('Animations — applyAnimationPolicy() reduced-motion latch', () => {
  // The module caches its MediaQueryList on first use, so hand matchMedia a
  // single object whose `matches` the test flips. Caching then works in our
  // favour: every later read sees the flip, exactly like a real OS toggle.
  const mql = { matches: false }
  let applyAnimationPolicy

  beforeEach(async () => {
    mql.matches = false
    vi.stubGlobal('matchMedia', () => mql)
    window.matchMedia = () => mql
    vi.resetModules()
    ;({ applyAnimationPolicy } = await import('../../src/modules/Animations.js'))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const makeW = (animations = {}) => ({
    config: {
      chart: {
        animations: {
          enabled: true,
          respectReducedMotion: true,
          dynamicAnimation: { enabled: true },
          ...animations,
        },
      },
    },
    globals: { reducedMotionLatch: null },
  })

  it('disables both animation switches while the OS preference is on', () => {
    const w = makeW()
    mql.matches = true
    applyAnimationPolicy(w)

    const anim = w.config.chart.animations
    expect(anim.enabled).toBe(false)
    expect(anim.dynamicAnimation.enabled).toBe(false)
    expect(w.globals.reducedMotionLatch).toEqual({
      enabled: true,
      dynamicEnabled: true,
    })
  })

  it('restores both switches when the OS preference is turned back off', () => {
    const w = makeW()
    mql.matches = true
    applyAnimationPolicy(w)

    mql.matches = false
    applyAnimationPolicy(w)

    const anim = w.config.chart.animations
    expect(anim.enabled).toBe(true)
    expect(anim.dynamicAnimation.enabled).toBe(true)
    expect(w.globals.reducedMotionLatch).toBe(null)
  })

  // The regression this guards: w.config is the object every updateOptions()
  // merges onto, so a `false` written by the policy survives each merge. Before
  // the latch, that made the disable permanent for the life of the chart.
  it('survives the updateOptions merge and still restores afterwards', () => {
    const w = makeW()
    mql.matches = true
    applyAnimationPolicy(w)

    // Three renders' worth of merges that never mention `animations`.
    for (let i = 0; i < 3; i++) {
      applyAnimationPolicy(w)
      expect(w.config.chart.animations.enabled).toBe(false)
    }

    mql.matches = false
    applyAnimationPolicy(w)
    expect(w.config.chart.animations.enabled).toBe(true)
    expect(w.config.chart.animations.dynamicAnimation.enabled).toBe(true)
  })

  it('leaves the config alone when respectReducedMotion is false', () => {
    const w = makeW({ respectReducedMotion: false })
    mql.matches = true
    applyAnimationPolicy(w)

    expect(w.config.chart.animations.enabled).toBe(true)
    expect(w.config.chart.animations.dynamicAnimation.enabled).toBe(true)
    expect(w.globals.reducedMotionLatch).toBe(null)
  })

  it('does not resurrect animations the user had disabled themselves', () => {
    const w = makeW({ enabled: false, dynamicAnimation: { enabled: false } })
    mql.matches = true
    applyAnimationPolicy(w)

    mql.matches = false
    applyAnimationPolicy(w)

    expect(w.config.chart.animations.enabled).toBe(false)
    expect(w.config.chart.animations.dynamicAnimation.enabled).toBe(false)
  })

  it('re-stashes a value the user changes while the latch is engaged', () => {
    const w = makeW()
    mql.matches = true
    applyAnimationPolicy(w)

    // updateOptions({ chart: { animations: { enabled: true } } }) merged in
    // while reduced motion is still on: the policy forces it back off for this
    // render, but must remember it for when the preference is lifted.
    w.config.chart.animations.enabled = true
    applyAnimationPolicy(w)
    expect(w.config.chart.animations.enabled).toBe(false)

    mql.matches = false
    applyAnimationPolicy(w)
    expect(w.config.chart.animations.enabled).toBe(true)
  })
})
