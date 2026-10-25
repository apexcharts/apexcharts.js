// @ts-check
import { morphPaths, morphPolygons } from './PathMorphing'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import Utils from '../utils/Utils.js'
import { lerpRGBA } from '../utils/Color.js'

// Sine ease in-out (matches SVG.js default '<>' easing). Kept as the fallback
// so behavior is unchanged when no easing is configured.
/**
 * @param {number} t
 */
function easeInOut(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5
}

// Cadence (#6) P1: pluggable easing. The runner tweens attrs, colors, and path
// morphs against a single eased position. A runner eases on its own `.ease(fn)`
// if set, else on its chart's easing (stamped on the chart's root <svg> by
// Animations), else on `_defaultEasing`, the module-level fallback Animations
// resolves from `chart.animations.easing` (see setDefaultEasing).
/** @type {(t:number)=>number} */
let _defaultEasing = easeInOut

/**
 * Set the process-wide fallback easing, for runners that neither set their own
 * via `.ease()` nor sit in a chart whose root <svg> carries one. The last render
 * to resolve config wins, which is why the per-chart stamp comes first.
 * @param {(t:number)=>number} fn
 */
export function setDefaultEasing(fn) {
  _defaultEasing = typeof fn === 'function' ? fn : easeInOut
}

class SVGAnimationRunner {
  /**
   * @param {any} element
   * @param {number} duration
   * @param {number} delay
   */
  constructor(element, duration, delay) {
    this.el = element
    this.duration = duration ?? 300
    this.delay = delay || 0
    this._attrTarget = null
    this._plotTarget = null
    /** @type {string | null} */
    this._plotSnap = null
    /** @type {'commands' | 'polygons'} */
    this._plotAlgorithm = 'commands'
    this._afterCb = null
    this._duringCb = null
    /** @type {((t:number)=>number) | null} */
    this._easing = null
    this._next = null
    /** @type {SVGAnimationRunner | null} */
    this._root = null
    this._scheduled = false
  }

  /**
   * Override the easing for this runner (else the module default is used).
   * @param {(t:number)=>number} fn
   */
  ease(fn) {
    if (typeof fn === 'function') this._easing = fn
    this._schedule()
    return this
  }

  /**
   * @param {Record<string, any>} to
   */
  attr(to) {
    this._attrTarget = to
    this._schedule()
    return this
  }

  /**
   * @param {string} d
   * @param {'commands' | 'polygons'} [algorithm] - morph engine to use for
   *   the d→d interpolation. 'commands' (default) is the legacy
   *   per-command lerp; 'polygons' resamples both paths into N evenly
   *   spaced points and tweens point-by-point (smoother for shapes with
   *   very different anchor-point counts).
   * @param {string} [snapTo] - final d to land on when it differs from the
   *   interpolation target. Used by reconciled length-change morphs: the
   *   tween runs against a padded path (extra anchors lying exactly on the
   *   final geometry) but the element must end with the renderer's clean,
   *   un-padded d so later captures and morphs stay stable.
   */
  plot(d, algorithm, snapTo) {
    this._plotTarget = d
    if (algorithm) this._plotAlgorithm = algorithm
    this._plotSnap = snapTo || null
    this._schedule()
    return this
  }

  /**
   * @param {Function} fn
   */
  after(fn) {
    this._afterCb = fn
    this._schedule()
    return this
  }

  /**
   * @param {Function} fn
   */
  during(fn) {
    this._duringCb = fn
    this._schedule()
    return this
  }

  /**
   * @param {number} duration
   * @param {number} delay
   */
  animate(duration, delay) {
    const next = new SVGAnimationRunner(this.el, duration, delay)
    this._next = next
    next._root = this._root || this
    return next
  }

  _schedule() {
    const root = this._root || this
    if (!root._scheduled) {
      root._scheduled = true
      queueMicrotask(() => root._executeChain())
    }
  }

  _executeChain() {
    const chain = []
    /** @type {any} */ let r = this
    while (r) {
      chain.push(r)
      r = r._next
    }

    let cumulativeDelay = 0
    chain.forEach((runner) => {
      cumulativeDelay += runner.delay
      runner._execute(cumulativeDelay)
      cumulativeDelay += runner.duration
    })
  }

  /**
   * @param {number} startDelay
   */
  _execute(startDelay) {
    const el = this.el
    const duration = this.duration

    if (duration <= 1) {
      // Near-instant: just apply final state after delay
      const apply = () => {
        if (this._attrTarget) el.attr(this._attrTarget)
        if (this._plotTarget) el.plot(this._plotSnap || this._plotTarget)
        if (this._afterCb) this._afterCb.call(el)
      }
      if (startDelay > 0) {
        setTimeout(apply, startDelay)
      } else {
        apply()
      }
      return
    }

    const run = () => {
      // Capture "from" values for attr interpolation
      const fromAttrs = /** @type {Record<string, any>} */ ({})
      const fromColors = /** @type {Record<string, any>} */ ({})
      const toColors = /** @type {Record<string, any>} */ ({})
      if (this._attrTarget) {
        for (const key of Object.keys(this._attrTarget)) {
          const fromVal = el.attr(key)
          fromAttrs[key] = fromVal
          // Check if this is a color value (alpha included: #rrggbbaa too)
          const fc = Utils.parseColor(String(fromVal))
          const tc = Utils.parseColor(String(this._attrTarget[key]))
          if (fc && tc) {
            fromColors[key] = fc
            toColors[key] = tc
          }
        }
      }

      // Initialize path morpher if needed
      /** @type {Function | null} */
      let morphFn = null
      if (this._plotTarget) {
        const fromPath = el.attr('d') || ''
        try {
          morphFn =
            this._plotAlgorithm === 'polygons'
              ? morphPolygons(fromPath, this._plotTarget)
              : morphPaths(fromPath, this._plotTarget)
        } catch (e) {
          // If path morphing fails, just snap at the end
          morphFn = null
        }
      }

      const start = performance.now()
      // The chart's own easing, stamped on its root <svg> (see Animations).
      const root = el.node && el.node.ownerSVGElement
      const easing = this._easing || (root && root.__apexEase) || _defaultEasing

      /**
       * @param {number} now
       */
      const tick = (now) => {
        const elapsed = now - start
        const rawPos = Math.min(elapsed / duration, 1)
        const pos = easing(rawPos)

        // Interpolate attributes
        if (this._attrTarget) {
          if (rawPos >= 1) {
            el.attr(this._attrTarget)
          } else {
            const current = /** @type {Record<string, any>} */ ({})
            for (const key of Object.keys(this._attrTarget)) {
              if (fromColors[key] && toColors[key]) {
                current[key] = lerpRGBA(
                  fromColors[key],
                  toColors[key],
                  pos,
                )
              } else {
                const from = parseFloat(fromAttrs[key])
                const to = parseFloat(this._attrTarget[key])
                if (!isNaN(from) && !isNaN(to)) {
                  current[key] = from + (to - from) * pos
                }
              }
            }
            el.attr(current)
          }
        }

        // Path morphing
        if (morphFn && rawPos < 1) {
          el.attr('d', /** @type {any} */ (morphFn)(pos))
        }

        // During callback (pass raw linear position, matching SVG.js behavior)
        if (this._duringCb) this._duringCb(pos)

        if (rawPos < 1) {
          BrowserAPIs.requestAnimationFrame(tick)
        } else {
          // Set final path
          if (this._plotTarget) {
            el.attr('d', this._plotSnap || this._plotTarget)
          }
          if (this._afterCb) this._afterCb.call(el)
        }
      }

      BrowserAPIs.requestAnimationFrame(tick)
    }

    if (startDelay > 0) {
      setTimeout(run, startDelay)
    } else {
      run()
    }
  }
}

// Install .animate() on SVGElement prototype
/**
 * @param {any} ElementClass
 */
function installAnimationMethods(ElementClass) {
  /**
   * @param {number} duration
   * @param {number} delay
   */
  ElementClass.prototype.animate = function (duration, delay) {
    return new SVGAnimationRunner(this, duration, delay)
  }
}

export { SVGAnimationRunner, installAnimationMethods }
