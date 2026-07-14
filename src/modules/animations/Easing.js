// @ts-check
/**
 * Cadence (#6) P1: pluggable easing.
 *
 * A tiny name -> easing-fn registry that the core tween runner
 * (`SVGAnimation.SVGAnimationRunner`) resolves `chart.animations.easing`
 * against. An easing fn maps a linear progress `t` in [0,1] to an eased
 * progress (usually [0,1], back/elastic curves may overshoot). This lives in
 * core: it wraps machinery that already ships and is what
 * `ApexCharts.registerEasing` writes into.
 *
 * NOTE: the tuned per-effect easings used by the initial-draw animations
 * (`Animations.easeOutCubic` for the pen-stroke, `easeOutBack` for the scatter
 * pop) are intentionally NOT routed through here: `applyProgressiveReveal`
 * inverts `easeOutCubic` for reveal-sync timing, so those stay fixed. This
 * registry governs the GENERIC runner tweens (data-update value transitions,
 * path morphs, marker animate).
 *
 * @module modules/animations/Easing
 */

/** The runner's historical default (SVG.js '<>' sine ease-in-out). Keeping
 * this the default makes the config change behavior-neutral out of the box.
 * @param {number} t */
export function easeInOutSine(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5
}

export const DEFAULT_EASING_NAME = 'easeInOutSine'

/**
 * Build a cubic-bezier easing fn (CSS `cubic-bezier(x1,y1,x2,y2)` semantics)
 * via Newton-Raphson with a bisection fallback. `x1`/`x2` are clamped to [0,1]
 * as CSS requires; `y1`/`y2` may exceed it (overshoot).
 * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
 * @returns {(t:number)=>number}
 */
export function cubicBezier(x1, y1, x2, y2) {
  x1 = Math.min(Math.max(x1, 0), 1)
  x2 = Math.min(Math.max(x2, 0), 1)
  const cx = 3 * x1
  const bx = 3 * (x2 - x1) - cx
  const ax = 1 - cx - bx
  const cy = 3 * y1
  const by = 3 * (y2 - y1) - cy
  const ay = 1 - cy - by
  /** @param {number} t */
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t
  /** @param {number} t */
  const sampleY = (t) => ((ay * t + by) * t + cy) * t
  /** @param {number} t */
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx
  /** @param {number} x */
  const solveT = (x) => {
    let t = x
    for (let i = 0; i < 5; i++) {
      const d = slopeX(t)
      if (d === 0) break
      t -= (sampleX(t) - x) / d
    }
    // bisection fallback to stay in-domain
    let lo = 0
    let hi = 1
    t = x
    if (t < lo) return lo
    if (t > hi) return hi
    while (lo < hi) {
      const xt = sampleX(t)
      if (Math.abs(xt - x) < 1e-4) return t
      if (x > xt) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return t
  }
  return (t) => (t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solveT(t)))
}

/** @type {Map<string, (t:number)=>number>} */
const REGISTRY = new Map()

/** @param {number} t */
const linear = (t) => t

// Built-in named easings. Cubic/quad/back are defined directly (cheaper than
// routing every one through cubicBezier and exact for the polynomial forms).
REGISTRY.set('linear', linear)
REGISTRY.set('easeInOutSine', easeInOutSine)
REGISTRY.set('easeInSine', (t) => 1 - Math.cos((t * Math.PI) / 2))
REGISTRY.set('easeOutSine', (t) => Math.sin((t * Math.PI) / 2))
REGISTRY.set('easeInQuad', (t) => t * t)
REGISTRY.set('easeOutQuad', (t) => 1 - (1 - t) * (1 - t))
REGISTRY.set('easeInOutQuad', (t) =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
)
REGISTRY.set('easeInCubic', (t) => t * t * t)
REGISTRY.set('easeOutCubic', (t) => 1 - Math.pow(1 - t, 3))
REGISTRY.set('easeInOutCubic', (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
)
REGISTRY.set('easeOutBack', (t) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
})
REGISTRY.set('easeInOutBack', (t) => {
  const c1 = 1.70158
  const c2 = c1 * 1.525
  return t < 0.5
    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2
})

/**
 * Register a named easing fn (public via `ApexCharts.registerEasing`). Ignores
 * a missing name or non-function so a bad call cannot corrupt the registry.
 * @param {string} name
 * @param {(t:number)=>number} fn
 */
export function registerEasing(name, fn) {
  if (typeof name === 'string' && name && typeof fn === 'function') {
    REGISTRY.set(name, fn)
  }
}

/** @param {any} v @returns {v is [number,number,number,number]} */
function isBezierArray(v) {
  return (
    Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === 'number')
  )
}

/**
 * Resolve `chart.animations.easing` to a fn. Accepts a fn (used as-is), a
 * cubic-bezier `[x1,y1,x2,y2]` array, or a registered name. Anything
 * unrecognized falls back to the default sine ease-in-out.
 * @param {any} value
 * @returns {(t:number)=>number}
 */
export function resolveEasing(value) {
  if (typeof value === 'function') return value
  if (isBezierArray(value))
    return cubicBezier(value[0], value[1], value[2], value[3])
  if (typeof value === 'string' && REGISTRY.has(value)) {
    return /** @type {(t:number)=>number} */ (REGISTRY.get(value))
  }
  return easeInOutSine
}
