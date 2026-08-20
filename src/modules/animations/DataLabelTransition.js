// @ts-check
/**
 * Data-label transitions for data-change updates.
 *
 * Two behaviors, both bar/column only:
 *   - dataLabels.animate  : a surviving label RIDES to its new position on a
 *     reorder/update instead of snapping, on the same clock and easing as the
 *     bar morph. ON by default: the bars, the markers and the axis ticks all
 *     already reflow together, so a label that jumps to its final slot on the
 *     first frame arrives several hundred ms before the bar it labels.
 *   - dataLabels.countUp  : a surviving label's numeric value tweens from its
 *     previous value to the new one, like countUp.js. OFF by default: it
 *     changes the number on screen mid-flight, which is a deliberate choice
 *     (the bar chart race) rather than a default. The user's formatter runs
 *     each frame, so number formatting is preserved.
 *
 * Labels carry no persistent DOM identity across the full teardown/rebuild an
 * update performs, so the bar renderer stamps each label group with
 * `data:dlKey` (= `${realIndex}::${datumKey}`), `data:dlJ`, and `data:dlVal`.
 * Stacked totals are NOT inside those groups (they hang off the series-wide
 * label wrap) and track the top of the whole stack rather than any one segment,
 * so they carry their own `data:dlTotalKey` / `data:dlTotalVal` and are tweened
 * separately. captureDataLabels() snapshots the outgoing frame's positions and
 * values by key right before teardown; applyDataLabelTransition() matches the
 * incoming labels back and tweens position and/or value from old to new.
 *
 * Both halves run on the full render path AND on fastUpdate. A same-shape
 * updateSeries, which is the most common update there is, only ever reaches the
 * latter.
 *
 * Deliberately best-effort: any missing counterpart, unparseable coordinate, or
 * thrown formatter leaves that label exactly where the renderer put it.
 *
 * @module modules/animations/DataLabelTransition
 */

import { Environment } from '../../utils/Environment'
import Utils from '../../utils/Utils'
import { lengthTransitionEnabled, morphEasing, rafTween } from './LengthTransition'

const DL_GROUP_SEL = '.apexcharts-data-labels[data\\:dlKey]'
const DL_TEXT_SEL = '.apexcharts-datalabel'
const DL_TOTAL_SEL = '.apexcharts-datalabel-total[data\\:dlTotalKey]'

/**
 * @param {import('../../types/internal').ChartStateW} w
 * @returns {boolean}
 */
function dataLabelMotionEnabled(w) {
  const dl = w.config.dataLabels
  return !!(dl?.animate?.enabled || dl?.countUp?.enabled)
}

/**
 * Decimal places of a number (capped), so a count-up on integer data renders
 * clean integers with the default formatter rather than long floats.
 *
 * @param {number} n
 * @returns {number}
 */
export function decimalsOf(n) {
  if (!isFinite(n)) return 0
  const s = String(Math.abs(n))
  // Exponential notation (e.g. "1e-7", "1.5e-7") carries no '.', so the plain
  // indexOf below would report 0 decimals and a count-up on a tiny value would
  // render "0". Derive the decimal count from the mantissa + exponent instead.
  const e = s.indexOf('e')
  if (e !== -1) {
    const mantissa = s.slice(0, e)
    const exp = parseInt(s.slice(e + 1), 10)
    const dot = mantissa.indexOf('.')
    const mantissaDec = dot === -1 ? 0 : mantissa.length - dot - 1
    return Math.min(6, Math.max(0, mantissaDec - exp))
  }
  const dot = s.indexOf('.')
  return dot === -1 ? 0 : Math.min(6, s.length - dot - 1)
}

/**
 * Write a string into a data-label text node, honoring a tspan child when the
 * renderer produced one (multi-line), else the plain text content.
 *
 * @param {Element} textEl
 * @param {string} s
 */
function writeLabel(textEl, s) {
  const tspan = textEl.querySelector('tspan')
  if (tspan) tspan.textContent = s
  else textEl.textContent = s
}

/**
 * Snapshot the outgoing render's bar/column data labels by datum key. Called
 * from Series.getPreviousPaths(), i.e. before the DOM is torn down for the
 * incoming update. No-op unless a label-motion feature is on.
 *
 * @param {import('../../types/internal').ChartStateW} w
 */
export function captureDataLabels(w) {
  const gl = w.globals
  gl.prevDataLabels = null
  if (!gl.axisCharts || !Environment.isBrowser()) return
  if (!dataLabelMotionEnabled(w)) return
  const root = w.dom.baseEl
  if (!Utils.elementExists(root)) return
  try {
    /** @type {Map<string, {cx: number, cy: number, val: number}>} */
    const map = new Map()
    root.querySelectorAll(DL_GROUP_SEL).forEach((group) => {
      const key = group.getAttribute('data:dlKey')
      if (!key) return
      const textEl = group.querySelector(DL_TEXT_SEL)
      if (!textEl) return
      map.set(key, {
        cx: parseFloat(textEl.getAttribute('cx') || ''),
        cy: parseFloat(textEl.getAttribute('cy') || ''),
        val: parseFloat(group.getAttribute('data:dlVal') || ''),
      })
    })
    // Stacked totals hang off the series-wide label wrap rather than a keyed
    // per-segment group, so they are tracked in their own map.
    root.querySelectorAll(DL_TOTAL_SEL).forEach((el) => {
      const key = el.getAttribute('data:dlTotalKey')
      if (!key) return
      map.set(`total::${key}`, {
        cx: parseFloat(el.getAttribute('cx') || ''),
        cy: parseFloat(el.getAttribute('cy') || ''),
        val: parseFloat(el.getAttribute('data:dlTotalVal') || ''),
      })
    })
    gl.prevDataLabels = map.size ? map : null
  } catch (_) {
    gl.prevDataLabels = null
  }
}

/**
 * @param {import('../../types/internal').ChartStateW} w
 * @param {Element} node
 * @param {number} duration
 * @param {(t: number) => number} ease
 */
function fadeIn(w, node, duration, ease) {
  const style = /** @type {any} */ (node).style
  style.opacity = '0'
  rafTween(
    w,
    duration,
    ease,
    (eased) => {
      style.opacity = String(eased)
    },
    () => {
      style.opacity = ''
    },
  )
}

/**
 * Ride an element from where its counterpart sat last frame to where the
 * renderer has just put it: offset it by the old-minus-new delta and tween that
 * offset to zero, composed over whatever transform it already carries (the bar
 * label groups carry a rotate). No-op for a move under half a pixel.
 *
 * The element's own `cx`/`cy` attributes are the anchor on both sides, so this
 * works for a group (whose label text carries them) and for a bare text node.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{el: Element, oldCx: number, oldCy: number, duration: number, ease: (t: number) => number, delay?: number}} opts
 */
function rideTo(w, { el, oldCx, oldCy, duration, ease, delay = 0 }) {
  const anchor = el.hasAttribute('cx') ? el : el.querySelector(DL_TEXT_SEL)
  if (!anchor) return
  const dx = oldCx - parseFloat(anchor.getAttribute('cx') || '')
  const dy = oldCy - parseFloat(anchor.getAttribute('cy') || '')
  if (!isFinite(dx) || !isFinite(dy)) return
  if (Math.abs(dx) + Math.abs(dy) <= 0.5) return

  const base = el.getAttribute('transform') || ''
  const start = () =>
    rafTween(
      w,
      duration,
      ease,
      (eased) => {
        const t = 1 - eased
        el.setAttribute('transform', `translate(${dx * t} ${dy * t}) ${base}`.trim())
      },
      () => {
        if (base) el.setAttribute('transform', base)
        else el.removeAttribute('transform')
      },
    )

  if (delay > 0) {
    // Its bar starts this much later (the per-bar stagger), so hold the label
    // at its previous spot until then; the pair then move on one clock.
    el.setAttribute('transform', `translate(${dx} ${dy}) ${base}`.trim())
    setTimeout(() => {
      if (w.globals.isDestroyed) return
      start()
    }, delay)
  } else {
    start()
  }
}

/**
 * Tween one label's number from `from` to `to`, re-running the user's formatter
 * every frame so decimals, separators and prefixes survive the count. No-op
 * when either end is not a finite number or the value did not change.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{el: Element, from: number, to: number, formatter: any, fmtOpts: any, duration: number, ease: (t: number) => number, delay?: number}} opts
 */
function countUpText(w, { el, from, to, formatter, fmtOpts, duration, ease, delay = 0 }) {
  if (!isFinite(from) || !isFinite(to)) return
  if (Math.abs(to - from) <= 1e-9) return

  const dec = Math.max(decimalsOf(from), decimalsOf(to))
  /** @param {number} v */
  const format = (v) => {
    const rounded = Number(v.toFixed(dec))
    let out = rounded
    if (typeof formatter === 'function') {
      try {
        out = formatter(rounded, fmtOpts)
      } catch (_) {
        out = rounded
      }
    }
    return String(out)
  }
  const start = () =>
    rafTween(
      w,
      duration,
      ease,
      (eased) => {
        writeLabel(el, format(from + (to - from) * eased))
      },
      () => {
        // Land exactly on the rendered final string.
        writeLabel(el, format(to))
      },
    )

  if (delay > 0) {
    // Same hold as the position ride: show the old value until the bar moves.
    writeLabel(el, format(from))
    setTimeout(() => {
      if (w.globals.isDestroyed) return
      start()
    }, delay)
  } else {
    start()
  }
}

/**
 * Animate bar/column data labels after a data-change re-render: surviving
 * labels ride from their old position to the new one and/or count their value
 * up, entering labels fade in. Consumes the captured frame (one shot per
 * update); a no-op unless this is an animated update with a captured frame.
 *
 * @param {import('../../types/internal').ChartStateW} w
 */
export function applyDataLabelTransition(w) {
  const gl = w.globals
  const prev = gl.prevDataLabels
  gl.prevDataLabels = null
  if (!prev || !gl.axisCharts || !Environment.isBrowser()) return
  if (!dataLabelMotionEnabled(w)) return
  if (!lengthTransitionEnabled(w)) return
  const root = w.dom.baseEl
  if (!Utils.elementExists(root)) return

  const dl = w.config.dataLabels
  const ride = !!dl.animate?.enabled
  const countUp = !!dl.countUp?.enabled
  const formatter = dl.formatter
  const duration = Math.max(1, w.config.chart.animations.dynamicAnimation.speed || 1)
  const ease = morphEasing(w)

  try {
    root.querySelectorAll(DL_GROUP_SEL).forEach((group) => {
      const key = group.getAttribute('data:dlKey')
      if (!key) return
      const textEl = group.querySelector(DL_TEXT_SEL)
      if (!textEl) return
      const old = prev.get(key)
      // The bar renderer stamps its own stagger delay so the label waits for
      // ITS bar; without it, a staggered update had every label land on one
      // clock while the later bars had not even started (last category's label
      // arrived a full stagger-spread early).
      const delay = parseInt(group.getAttribute('data:dlDelay') || '0', 10) || 0

      // Position ride: shift the whole label group (text + background) via an
      // added translate composed over its existing rotate, tweened to zero.
      if (ride) {
        if (old && isFinite(old.cx) && isFinite(old.cy)) {
          rideTo(w, {
            el: group,
            oldCx: old.cx,
            oldCy: old.cy,
            duration,
            ease,
            delay,
          })
        } else if (!old) {
          // Entering label: no previous position to ride from, so fade it in.
          fadeIn(w, group, duration, ease)
        }
      }

      // Count-up: tween the numeric value, re-running the formatter per frame.
      if (countUp && old) {
        const realIndex = parseInt(key, 10)
        const j = parseInt(group.getAttribute('data:dlJ') || '', 10)
        countUpText(w, {
          el: textEl,
          from: old.val,
          to: parseFloat(group.getAttribute('data:dlVal') || ''),
          formatter,
          // The formatter opts don't change between tween frames (only the
          // value does), so build them once per label instead of spreading all
          // of `w` on every frame. Same shape the bar formatter gets.
          fmtOpts: {
            ...w,
            seriesIndex: realIndex,
            dataPointIndex: isFinite(j) ? j : 0,
            w,
          },
          duration,
          ease,
          delay,
        })
      }
    })

    // Stacked totals. Not inside a keyed per-segment group (they hang off the
    // series-wide label wrap), and they track the top of the whole stack rather
    // than any one segment, so they ride their own delta and count up on their
    // own numbers, with the total formatter when one is configured.
    const totalFormatter =
      w.config.plotOptions.bar.dataLabels.total.formatter || formatter
    root.querySelectorAll(DL_TOTAL_SEL).forEach((el) => {
      const key = el.getAttribute('data:dlTotalKey')
      if (!key) return
      const old = prev.get(`total::${key}`)
      if (!old) return
      // Totals track the top of the whole stack, and every layer of column j
      // shares one stagger delay on updates, so the stamped delay is the
      // stack's delay too.
      const delay = parseInt(el.getAttribute('data:dlDelay') || '0', 10) || 0

      if (ride && isFinite(old.cx) && isFinite(old.cy)) {
        rideTo(w, { el, oldCx: old.cx, oldCy: old.cy, duration, ease, delay })
      }
      if (countUp) {
        // The key's first segment is the GROUP index (stable across legend
        // toggles); the series that drew the total travels in its own attr.
        const realIndex = parseInt(
          el.getAttribute('data:dlTotalSeries') || key,
          10,
        )
        countUpText(w, {
          el,
          from: old.val,
          to: parseFloat(el.getAttribute('data:dlTotalVal') || ''),
          formatter: totalFormatter,
          fmtOpts: { ...w, seriesIndex: realIndex, dataPointIndex: 0, w },
          duration,
          ease,
          delay,
        })
      }
    })
  } catch (_) {
    // Label polish must never break a render.
  }
}
