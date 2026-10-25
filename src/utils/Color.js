// @ts-check
import Utils from './Utils'

/**
 * Colour blending for every loop that tweens one fill into another: the core
 * attr runner, the unit chart's regroup and the morph pieces. Parsing is
 * Utils.parseColor, the one alpha-aware reader. Kept pure (no state), so a
 * feature bundle carrying its own copy behaves exactly like core's.
 * @module utils/Color
 */

/**
 * [r, g, b, a] of a solid colour, or null when it has none (a gradient's
 * url(), 'none'). Hex and rgb()/rgba() parse directly; a named, hsl() or var()
 * colour is resolved by the browser once per distinct colour per `memo`, so
 * the frame loop that follows never probes the DOM. It is resolved inside
 * `el` (the chart's elWrap), so a variable scoped to the chart's container or
 * a shadow root is found, and currentColor is the chart's.
 * @param {any} color
 * @param {Map<string, number[] | null>} memo one per run
 * @param {Element} [el] where to resolve; document.body when omitted
 * @returns {number[] | null}
 */
export function resolveRGBA(color, memo, el) {
  if (typeof color !== 'string') return null
  const c = color.trim()
  if (!memo.has(c)) {
    memo.set(
      c,
      Utils.parseColor(c) || Utils.parseColor(Utils.resolveColor(c, el)) || null,
    )
  }
  return /** @type {number[] | null} */ (memo.get(c))
}

/**
 * The colour `t` of the way from `a` to `b`, alpha included: rgb() while
 * opaque, rgba() otherwise.
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} t
 * @returns {string}
 */
export function lerpRGBA(a, b, t) {
  const c = [0, 1, 2].map((k) => Math.round(a[k] + (b[k] - a[k]) * t))
  const al = a[3] + (b[3] - a[3]) * t
  return al >= 1 ? `rgb(${c})` : `rgba(${c},${al})`
}
