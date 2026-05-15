// @ts-check
import Utils from '../utils/Utils'
import { BrowserAPIs } from '../ssr/BrowserAPIs'
import { Environment } from '../utils/Environment'

const SVGNS = 'http://www.w3.org/2000/svg'

/**
 * Cubic ease-out — fast start, decelerates toward the end. Reads as a pen
 * sweeping across the chart and settling, which is the feel we want for the
 * draw effect (ease-in-out's fast middle makes it whip too aggressively).
 * @param {number} t
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Cubic ease-out-back — overshoots `1` near the end then settles. Used for the
 * `pop` effect (scatter/bubble markers) so each marker feels like it's
 * landing rather than just appearing.
 * Equivalent to CSS `cubic-bezier(0.34, 1.56, 0.64, 1)`.
 * @param {number} t
 */
function easeOutBack(t) {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

/**
 * Cached reduced-motion query — `matchMedia` evaluation is cheap but the
 * MediaQueryList instance is reused if a chart re-renders.
 * @type {MediaQueryList | null}
 */
let _reducedMotionMql = null

/**
 * @returns {boolean} true when the OS has prefers-reduced-motion: reduce active.
 */
export function prefersReducedMotion() {
  if (!Environment.isBrowser()) return false
  try {
    if (!_reducedMotionMql) {
      _reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)')
    }
    return !!_reducedMotionMql.matches
  } catch (_) {
    return false
  }
}

/**
 * @typedef {Object} StaggerOpts
 * @property {'sequential' | 'group' | 'diagonal' | 'centroid' | 'none'} style
 * @property {number} index - 0-based item index in its group
 * @property {number} [total] - total items (for centroid normalization)
 * @property {number} [baseDelay=40] - delay per stagger step in ms
 * @property {number} [row] - for 'diagonal' (heatmap)
 * @property {number} [col] - for 'diagonal'
 * @property {number} [groupIndex] - for 'group'
 * @property {number} [perGroup] - for 'group'
 * @property {number} [centerDistance] - for 'centroid' (0..1 normalized)
 */

/**
 * Apply the "progressive marker reveal" to an SVG element at grid-x `x`.
 * On initial mount of a line/area/rangeArea chart, each marker (or data label
 * or x-axis/point annotation) snaps in at the moment the line's pen-stroke
 * reaches its x position.
 *
 * Idempotent and SSR-safe — no-op when:
 *   - not running in a browser
 *   - this is a data-update / resize render
 *   - chart.animations.enabled is false
 *   - chart type isn't line/area/rangeArea
 *
 * @param {any} el       - svg.js element (uses el.node.style)
 * @param {number} x     - grid-coordinate x of the element
 * @param {import('../types/internal').ChartStateW} w
 * @returns {boolean}    - true if the reveal was applied
 */
export function applyProgressiveReveal(el, x, w) {
  if (!Environment.isBrowser()) return false
  if (w.globals.dataChanged || w.globals.resized) return false
  const animCfg = w.config.chart.animations
  if (!animCfg || animCfg.enabled === false) return false
  const chartType = w.config.chart.type
  if (chartType !== 'line' && chartType !== 'area' && chartType !== 'rangeArea') {
    return false
  }
  if (!(w.layout.gridWidth > 0)) return false

  // Line/area/radar draw mode internally doubles the configured speed (see
  // Graphics.renderPaths). The reveal must use the same effective duration
  // so markers land in sync with the pen tip.
  const drawSpeed = (animCfg.speed || 800) * 2
  const xRatio = Math.max(0, Math.min(1, x / w.layout.gridWidth))

  // Invert the line's easeOutCubic to find *when* the tip reaches this x.
  // The line covers ground fast at the start and slow at the end, so a marker
  // at xRatio=0.5 is reached at t ≈ 0.21, not t = 0.5. Linear timing was
  // making everything lag by exactly this eased-vs-linear difference.
  //   easeOutCubic(t) = 1 - (1 - t)^3
  //   inverse:          t = 1 - cbrt(1 - y)
  const easedT = 1 - Math.cbrt(1 - xRatio)
  const revealDelay = easedT * drawSpeed

  const node = el.node
  const style = node.style
  style.opacity = '0'

  // Anchor on the first rAF after render — the same frame `animateDraw` uses
  // as its t=0. All rAF callbacks scheduled in the current task receive the
  // same timestamp in the next frame, so reveal and draw share an origin.
  // Then poll rAFs (not setTimeout) so the snap happens on a frame boundary.
  /** @type {number | null} */
  let startAnchor = null
  /** @param {number} now */
  const tick = (now) => {
    if (startAnchor === null) startAnchor = now
    if (now - startAnchor >= revealDelay) {
      style.opacity = '1'
    } else {
      BrowserAPIs.requestAnimationFrame(tick)
    }
  }
  BrowserAPIs.requestAnimationFrame(tick)
  return true
}

/**
 * Apply OS / config-driven animation policy to the chart's effective config.
 * Currently: if prefers-reduced-motion is active AND
 * `chart.animations.respectReducedMotion` is true, disable both initial-mount
 * and data-change animations so the chart renders instantly.
 *
 * Must be called once, after config finalization (Base.init) and before the
 * first render. Idempotent; safe to call again after a config update.
 *
 * @param {import('../types/internal').ChartStateW} w
 */
export function applyAnimationPolicy(w) {
  const anim = w.config.chart.animations
  if (!anim) return
  if (anim.respectReducedMotion !== false && prefersReducedMotion()) {
    anim.enabled = false
    if (anim.dynamicAnimation) anim.dynamicAnimation.enabled = false
  }
}

/**
 * Compute a per-element delay for staggered initial-mount animations.
 *
 * Recognized options on `opts`:
 *   style:          'sequential' | 'group' | 'diagonal' | 'centroid' | 'none'
 *   index:          0-based item index in its group
 *   baseDelay:      delay per stagger step in ms (default 40)
 *   row, col:       for 'diagonal' (heatmap)
 *   groupIndex,
 *   perGroup:       for 'group'
 *   centerDistance: for 'centroid' (0..1 normalized)
 *
 * @param {any} opts
 * @returns {number} delay in ms
 */
export function computeStagger(opts) {
  const style = opts.style
  const index = opts.index || 0
  const baseDelay = typeof opts.baseDelay === 'number' ? opts.baseDelay : 40
  const row = opts.row || 0
  const col = opts.col || 0
  const groupIndex = opts.groupIndex || 0
  const perGroup = opts.perGroup || 1
  const centerDistance = opts.centerDistance || 0
  switch (style) {
    case 'none':
      return 0
    case 'diagonal':
      return (row + col) * baseDelay
    case 'group':
      return groupIndex * baseDelay + (index % perGroup) * (baseDelay / 4)
    case 'centroid':
      return centerDistance * baseDelay * (index + 1)
    case 'sequential':
    default:
      return index * baseDelay
  }
}

/**
 * ApexCharts Animation Class.
 *
 * @module Animations
 **/

export default class Animations {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} [ctx]
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // kept for animationEnd user callback: chart.events.animationEnd(ctx, …)
  }

  /**
   * @param {any} el
   * @param {Record<string, any>} from
   * @param {Record<string, any>} to
   * @param {object} speed
   */
  animateLine(el, from, to, speed) {
    el.attr(from).animate(speed).attr(to)
  }

  /*
   ** Animate radius of a circle element
   * @param {any} el
   * @param {number} speed
   * @param {string} easing
   * @param {Function} cb
   */
  /** @param {any} el @param {any} speed @param {any} easing @param {any} cb */
  animateMarker(el, speed, easing, cb) {
    el.attr({
      opacity: 0,
    })
      .animate(speed)
      .attr({
        opacity: 1,
      })
      .after(() => {
        cb()
      })
  }

  /**
   * Scale-up "pop" effect for scatter/bubble markers. Animates
   * `transform: scale(0 → 1)` (with `easeOutBack` overshoot) plus opacity,
   * around the marker's own center via `transform-box: fill-box`.
   *
   * Falls back to instant render in SSR / when shouldAnimate is false.
   *
   * @param {any} el
   * @param {{ speed: number, delay?: number, onComplete?: () => void }} params
   */
  animatePop(el, { speed, delay = 0, onComplete }) {
    const w = this.w

    if (!Environment.isBrowser() || !w.globals.shouldAnimate || speed < 1) {
      if (onComplete) onComplete()
      return
    }

    const node = el.node
    const style = node.style
    // SVG2 transform-box puts the origin at the element's geometric center
    // regardless of its (x,y) position, so each marker scales in place.
    style.transformBox = 'fill-box'
    style.transformOrigin = 'center'
    style.transform = 'scale(0)'
    style.opacity = '0'

    const startAt = performance.now() + delay
    /** @param {number} now */
    const step = (now) => {
      const t = Math.max(0, Math.min(1, (now - startAt) / speed))
      style.transform = `scale(${easeOutBack(t)})`
      // Fade in over the first half so the back-out overshoot is visible
      // (rather than blasted in at full opacity from frame 1).
      style.opacity = String(Math.min(1, t * 2))
      if (t < 1) {
        BrowserAPIs.requestAnimationFrame(step)
      } else {
        style.transform = ''
        style.transformOrigin = ''
        style.transformBox = ''
        style.opacity = ''
        if (onComplete) onComplete()
      }
    }
    BrowserAPIs.requestAnimationFrame(step)
  }

  /*
   ** Animate rect properties
   * @param {any} el
   * @param {any} from
   * @param {any} to
   * @param {number} speed
   * @param {Function} fn
   */
  /** @param {any} el @param {any} from @param {any} to @param {any} speed @param {any} fn @param {number} [delay] */
  animateRect(el, from, to, speed, fn, delay = 0) {
    el.attr(from)
      .animate(speed, delay)
      .attr(to)
      .after(() => fn())
  }

  /**
   * @param {Record<string, any>} params
   */
  animatePathsGradually(params) {
    const { el, realIndex, j, fill, pathFrom, pathTo, speed, delay } = params

    const me = this
    const w = this.w

    let delayFactor = 0

    if (w.config.chart.animations.animateGradually.enabled) {
      delayFactor = w.config.chart.animations.animateGradually.delay
    }

    if (
      w.config.chart.animations.dynamicAnimation.enabled &&
      w.globals.dataChanged &&
      w.config.chart.type !== 'bar'
    ) {
      // disabled due to this bug - https://github.com/apexcharts/vue-apexcharts/issues/75
      delayFactor = 0
    }
    me.morphSVG(
      el,
      realIndex,
      j,
      w.config.chart.type === 'line' && !w.globals.comboCharts
        ? 'stroke'
        : fill,
      pathFrom,
      pathTo,
      speed,
      delay * delayFactor,
    )
  }

  showDelayedElements() {
    /**
     * @param {object} d
     */
    this.w.globals.delayedElements.forEach((d) => {
      const ele = d.el
      ele.classList.remove('apexcharts-element-hidden')
      ele.classList.add('apexcharts-hidden-element-shown')
    })
  }

  /**
   * @param {any} el
   */
  animationCompleted(el) {
    const w = this.w
    if (w.globals.animationEnded) return

    w.globals.animationEnded = true
    this.showDelayedElements()

    if (typeof w.config.chart.events.animationEnd === 'function') {
      w.config.chart.events.animationEnd(this.ctx, { el, w })
    }
  }

  /**
   * Initial-mount "pen-stroke" draw effect for line / area / rangeArea paths.
   *
   * Stroke paths animate `stroke-dashoffset` from total length → 0.
   * Fill paths animate the width of a per-series SVG `<mask>` rect from 0 → gridWidth,
   * which coexists with the existing `clip-path: gridRectMask` (mask + clip-path
   * are independent SVG attributes).
   *
   * For radar / radial shapes, pass `mask: { type: 'radial', cx, cy, r }` to
   * use a circular mask that blooms from center outward instead of the default
   * left-to-right rect wipe.
   *
   * @param {any} el            - SVG.js path element
   * @param {{realIndex: number, j?: number, isFill: boolean, isLast: boolean, speed: number, delay: number, mask?: {type: 'rect'|'radial', cx?: number, cy?: number, r?: number}}} params
   */
  animateDraw(el, { realIndex, j, isFill, isLast, speed, delay, mask: maskShape }) {
    const w = this.w
    const me = this

    const finalize = () => {
      if (isLast && w.globals.shouldAnimate) {
        me.animationCompleted(el)
      }
      me.showDelayedElements()
    }

    if (!Environment.isBrowser() || !w.globals.shouldAnimate || speed < 1) {
      finalize()
      return
    }

    const node = el.node

    // Mask-based reveal — works for filled paths (area) and for stroked paths that
    // already have a custom dash pattern (forecast, user-set stroke.dashArray).
    const runMaskReveal = () => {
      const pad = 4
      const isRadial = maskShape && maskShape.type === 'radial'
      const targetWidth = w.layout.gridWidth + pad * 2
      const radialCx = (maskShape && maskShape.cx) || 0
      const radialCy = (maskShape && maskShape.cy) || 0
      const targetRadius =
        ((maskShape && maskShape.r) || w.layout.gridWidth / 2) + pad

      const maskId = `apexDrawMask${w.globals.cuid}-${realIndex}-${j ?? 0}-${isFill ? 'f' : 's'}`
      const mask = BrowserAPIs.createElementNS(SVGNS, 'mask')
      mask.setAttribute('id', maskId)
      mask.setAttribute('maskUnits', 'userSpaceOnUse')

      let revealEl
      if (isRadial) {
        // Region must cover the full radar bbox (centered at cx, cy with radius r + pad).
        const region = targetRadius
        mask.setAttribute('x', String(radialCx - region))
        mask.setAttribute('y', String(radialCy - region))
        mask.setAttribute('width', String(region * 2))
        mask.setAttribute('height', String(region * 2))

        revealEl = BrowserAPIs.createElementNS(SVGNS, 'circle')
        revealEl.setAttribute('cx', String(radialCx))
        revealEl.setAttribute('cy', String(radialCy))
        revealEl.setAttribute('r', '0')
        revealEl.setAttribute('fill', '#fff')
      } else {
        mask.setAttribute('x', String(-pad))
        mask.setAttribute('y', String(-pad))
        mask.setAttribute('width', String(targetWidth))
        mask.setAttribute('height', String(w.layout.gridHeight + pad * 2))

        revealEl = BrowserAPIs.createElementNS(SVGNS, 'rect')
        revealEl.setAttribute('x', String(-pad))
        revealEl.setAttribute('y', String(-pad))
        revealEl.setAttribute('width', '0')
        revealEl.setAttribute('height', String(w.layout.gridHeight + pad * 2))
        revealEl.setAttribute('fill', '#fff')
      }
      mask.appendChild(revealEl)
      w.dom.elDefs.node.appendChild(mask)

      node.setAttribute('mask', `url(#${maskId})`)

      const startAt = performance.now() + (delay || 0)
      /** @param {number} now */
      const step = (now) => {
        const t = Math.max(0, Math.min(1, (now - startAt) / speed))
        const eased = easeOutCubic(t)
        if (isRadial) {
          revealEl.setAttribute('r', String(eased * targetRadius))
        } else {
          revealEl.setAttribute('width', String(eased * targetWidth))
        }
        if (t < 1) {
          BrowserAPIs.requestAnimationFrame(step)
        } else {
          node.removeAttribute('mask')
          if (mask.parentNode) mask.parentNode.removeChild(mask)
          finalize()
        }
      }
      BrowserAPIs.requestAnimationFrame(step)
    }

    // Stroke draw via stroke-dashoffset (only safe when no custom dash pattern exists).
    /** @param {number} len */
    const runStrokeDraw = (len) => {
      node.setAttribute('stroke-dasharray', String(len))
      node.setAttribute('stroke-dashoffset', String(len))

      const startAt = performance.now() + (delay || 0)
      /** @param {number} now */
      const step = (now) => {
        const t = Math.max(0, Math.min(1, (now - startAt) / speed))
        node.setAttribute('stroke-dashoffset', String(len * (1 - easeOutCubic(t))))
        if (t < 1) {
          BrowserAPIs.requestAnimationFrame(step)
        } else {
          node.removeAttribute('stroke-dasharray')
          node.removeAttribute('stroke-dashoffset')
          finalize()
        }
      }
      BrowserAPIs.requestAnimationFrame(step)
    }

    // Defer one frame: callers (e.g. Line.js for forecast paths) set stroke-dasharray
    // *after* renderPaths returns, so a sync check would miss it.
    BrowserAPIs.requestAnimationFrame(() => {
      if (isFill) {
        runMaskReveal()
        return
      }

      const existingDash = node.getAttribute('stroke-dasharray')
      const hasCustomDash =
        !!existingDash && existingDash !== '0' && existingDash !== ''
      if (hasCustomDash) {
        // Preserve dash pattern; reveal via mask instead of fighting dashoffset.
        runMaskReveal()
        return
      }

      let len = 0
      try {
        if (typeof node.getTotalLength === 'function') {
          len = node.getTotalLength()
        }
      } catch (_) {
        len = 0
      }
      if (!len) {
        finalize()
        return
      }
      runStrokeDraw(len)
    })
  }

  // SVG.js animation for morphing one path to another
  /**
   * @param {any} el
   * @param {number} realIndex
   * @param {number} j
   * @param {string} fill
   * @param {string} pathFrom
   * @param {string} pathTo
   * @param {number} speed
   * @param {number} delay
   */
  morphSVG(el, realIndex, j, fill, pathFrom, pathTo, speed, delay) {
    const w = this.w

    if (!pathFrom) {
      pathFrom = el.attr('pathFrom')
    }

    if (!pathTo) {
      pathTo = el.attr('pathTo')
    }

    const disableAnimationForCorrupPath = () => {
      if (w.config.chart.type === 'radar') {
        // radar chart drops the path to bottom and hence a corrup path looks ugly
        // therefore, disable animation for such a case
        speed = 1
      }
      return `M 0 ${w.layout.gridHeight}`
    }

    if (
      !pathFrom ||
      pathFrom.indexOf('undefined') > -1 ||
      pathFrom.indexOf('NaN') > -1
    ) {
      pathFrom = disableAnimationForCorrupPath()
    }

    if (
      !pathTo.trim() ||
      pathTo.indexOf('undefined') > -1 ||
      pathTo.indexOf('NaN') > -1
    ) {
      pathTo = disableAnimationForCorrupPath()
    }
    if (!w.globals.shouldAnimate) {
      speed = 1
    }

    el.plot(pathFrom)
      .animate(1, delay)
      .plot(pathFrom)
      .animate(speed, delay)
      .plot(pathTo)
      .after(() => {
        // a flag to indicate that the original mount function can return true now as animation finished here
        if (Utils.isNumber(j)) {
          if (
            j ===
              w.seriesData.series[w.globals.maxValsInArrayIndex].length - 2 &&
            w.globals.shouldAnimate
          ) {
            this.animationCompleted(el)
          }
        } else if (fill !== 'none' && w.globals.shouldAnimate) {
          if (
            (!w.globals.comboCharts &&
              realIndex === w.seriesData.series.length - 1) ||
            w.globals.comboCharts
          ) {
            this.animationCompleted(el)
          }
        }

        this.showDelayedElements()
      })
  }
}
