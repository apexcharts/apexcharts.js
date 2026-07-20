// @ts-check
/**
 * Data-label transitions for data-change updates (the "bar chart race").
 *
 * Two opt-in behaviors, both off by default and both bar/column only:
 *   - dataLabels.animate  : a surviving label RIDES to its new position on a
 *     reorder/update instead of snapping, on the same clock and easing as the
 *     bar morph (mirrors how the bars and axis labels already move).
 *   - dataLabels.countUp  : a surviving label's numeric value tweens from its
 *     previous value to the new one, like countUp.js. The user's
 *     dataLabels.formatter runs each frame, so number formatting is preserved.
 *
 * Labels carry no persistent DOM identity across the full teardown/rebuild an
 * update performs, so the bar renderer stamps each label group with
 * `data:dlKey` (= `${realIndex}::${datumKey}`), `data:dlJ`, and `data:dlVal`
 * when either feature is on. captureDataLabels() snapshots the outgoing frame's
 * label position + value by that key right before teardown;
 * applyDataLabelTransition() matches the incoming labels back by key and tweens
 * position and/or value from old to new.
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
function decimalsOf(n) {
  if (!isFinite(n)) return 0
  const s = String(n)
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

      // Position ride: shift the whole label group (text + background) via an
      // added translate composed over its existing rotate, tweened to zero.
      if (ride) {
        if (old && isFinite(old.cx) && isFinite(old.cy)) {
          const newCx = parseFloat(textEl.getAttribute('cx') || '')
          const newCy = parseFloat(textEl.getAttribute('cy') || '')
          const dx = old.cx - newCx
          const dy = old.cy - newCy
          if (isFinite(dx) && isFinite(dy) && Math.abs(dx) + Math.abs(dy) > 0.5) {
            const base = group.getAttribute('transform') || ''
            rafTween(
              w,
              duration,
              ease,
              (eased) => {
                const t = 1 - eased
                group.setAttribute(
                  'transform',
                  `translate(${dx * t} ${dy * t}) ${base}`.trim(),
                )
              },
              () => {
                group.setAttribute('transform', base)
              },
            )
          }
        } else if (!old) {
          // Entering label: no previous position to ride from, so fade it in.
          fadeIn(w, group, duration, ease)
        }
      }

      // Count-up: tween the numeric value, re-running the formatter per frame.
      if (countUp && old && isFinite(old.val)) {
        const newVal = parseFloat(group.getAttribute('data:dlVal') || '')
        if (isFinite(newVal) && Math.abs(newVal - old.val) > 1e-9) {
          const from = old.val
          const dec = Math.max(decimalsOf(from), decimalsOf(newVal))
          const realIndex = parseInt(key, 10)
          const j = parseInt(group.getAttribute('data:dlJ') || '', 10)
          /** @param {number} v */
          const format = (v) => {
            const rounded = Number(v.toFixed(dec))
            let out = rounded
            if (typeof formatter === 'function') {
              try {
                out = formatter(rounded, {
                  ...w,
                  seriesIndex: realIndex,
                  dataPointIndex: isFinite(j) ? j : 0,
                  w,
                })
              } catch (_) {
                out = rounded
              }
            }
            return String(out)
          }
          rafTween(
            w,
            duration,
            ease,
            (eased) => {
              writeLabel(textEl, format(from + (newVal - from) * eased))
            },
            () => {
              // Land exactly on the rendered final string.
              writeLabel(textEl, format(newVal))
            },
          )
        }
      }
    })
  } catch (_) {
    // Label polish must never break a render.
  }
}
