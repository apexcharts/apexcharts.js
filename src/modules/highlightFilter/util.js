// @ts-check
/**
 * Small pieces shared by the highlight filter's painters.
 *
 * @module modules/highlightFilter/util
 */

import { Environment } from '../../utils/Environment'

export const PART = 'apexcharts-highlight-part'

/** How a whole looks. `f` is its fill strength: 1 plain, fadeOpacity at rest,
 * 0 while a part on its exact shape covers it (the part then paints as the
 * whole does, its alpha included, so the pair would read darker than the
 * screen; see solid). `o` is
 * the outline's strength; at 0 the mark keeps its own stroke.
 * @typedef {{f: number, o: number}} Look */

/** @type {Look} */
export const PLAIN = { f: 1, o: 0 }
/** @type {Look} */
export const COVERED = { f: 0, o: 0 }
/**
 * The look a whole drawn at fade `f` has.
 * @param {number} f
 * @returns {Look}
 */
export const look = (f) => ({ f, o: f < 1 ? 1 : 0 })

/** @param {any} v */
export const finite = (v) =>
  typeof v === 'number' && v === v && v !== Infinity && v !== -Infinity

/** From x to y at progress t, landing exactly on y.
 * @param {number} x @param {number} y @param {number} t */
export const mix = (x, y, t) => (t >= 1 ? y : x + (y - x) * t)

/** @param {any} p */
export const isPoint = (p) => p && typeof p === 'object' && !Array.isArray(p)

/**
 * A mark's own opacity attribute as drawn (forecastDataPoints lowers the
 * fill), 1 when it has none. The canvas keeps it on the mark's command, not
 * on a node.
 * @param {any} node
 * @param {string} [attr] 'fill-opacity' or 'stroke-opacity'
 */
export const ownOpacity = (node, attr = 'fill-opacity') => {
  const cmd = node.instance?._cmd
  const v = parseFloat(
    cmd ? cmd[attr.replace('-o', 'O')] : node.getAttribute(attr),
  )
  return isFinite(v) ? v : 1
}

/**
 * A plain colour as its opaque ink and the alpha it was drawn with, so a part
 * can start at its whole's look and become solid. Fill opacity reaches a mark
 * inside its colour (`rgba(...)`, a CSS variable's `color-mix(...)`, or a page's
 * own `#rrggbbaa`); `[paint, 1]` for anything else, a gradient, pattern or image
 * included (their opacity belongs to the paint, so it is left as it is).
 * @param {any} paint
 * @returns {[any, number]}
 */
export function solid(paint) {
  const s = typeof paint === 'string' ? paint.trim() : ''
  /** @type {RegExpExecArray | null} */
  let m
  /** @type {[string, number] | null} */
  let r = null
  if ((m = /^rgba\(([^,]+,[^,]+,[^,]+),([^)]+)\)$/i.exec(s))) {
    r = [`rgb(${m[1]})`, parseFloat(m[2])]
  } else if (
    (m = /^color-mix\(in srgb, (.+) ([\d.]+)%, transparent\)$/.exec(s))
  ) {
    r = [m[1], parseFloat(m[2]) / 100]
  } else if ((m = /^(#[\da-f]{6})([\da-f]{2})$/i.exec(s))) {
    r = [m[1], parseInt(m[2], 16) / 255]
  }
  // A colour already opaque, or drawn invisible on purpose, stays as it is.
  return r && r[1] > 0 && r[1] < 1 ? r : [paint, 1]
}

/**
 * What a formatter is told about a part: the part, its whole, the share
 * (never clamped) and whether it overflows its whole (`'sign'` when the two
 * disagree in sign).
 * @param {number | null | undefined} p
 * @param {number | null | undefined} whole
 */
export function info(p, whole) {
  const share = p != null && whole ? p / whole : null
  return {
    value: p ?? null,
    total: whole ?? null,
    share,
    overflow: share == null ? false : share < 0 ? 'sign' : share > 1,
  }
}

/**
 * Where a label is drawn: its x and y plus every translate it carries.
 * @param {any} t
 * @returns {[number, number]}
 */
export function drawnAt(t) {
  let x = parseFloat(t.getAttribute('x'))
  let y = parseFloat(t.getAttribute('y'))
  String(t.getAttribute('transform') || '').replace(
    /translate\(\s*([^\s,)]+)[\s,]*([^\s,)]*)\s*\)/g,
    (_m, a, b) => {
      x += parseFloat(a) || 0
      y += parseFloat(b) || 0
      return ''
    },
  )
  return [x, y]
}

/** Pointer events a stand-in hands to its whole. */
const HIT_EVENTS = [
  'mousemove',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'click',
  'touchstart',
  'touchmove',
  'touchend',
]

/**
 * Make `n` stand in for `whole` under the pointer: a part's pixels outside its
 * whole have no whole under them to hover, so every pointer event on `n` is
 * handed to the whole (the tooltip, the hover state and a click then act on
 * that mark wherever the pointer is on it) and the original is stopped, so
 * nothing sees it twice. Crossing between the whole and a stand-in is staying
 * on the mark, so neither side reports leaving.
 * @param {any} whole the whole's node
 * @param {any} n the stand-in node
 */
export function bindHit(whole, n) {
  const hits = whole._apxHits || (whole._apxHits = new Set())
  if (!whole._apxHitStop) {
    // The whole's own leave and out for a move onto its stand-in are not
    // a leave: stopped before the renderer's listeners see them.
    whole._apxHitStop = true
    const stop = (/** @type {any} */ e) => {
      if (hits.has(e.relatedTarget)) e.stopImmediatePropagation()
    }
    ;['mouseout', 'mouseleave', 'mouseover', 'mouseenter'].forEach((t) =>
      whole.addEventListener(t, stop, true),
    )
  }
  hits.add(n)
  HIT_EVENTS.forEach((t) =>
    n.addEventListener(
      t,
      (/** @type {any} */ e) => {
        e.stopPropagation()
        const enter = t === 'mouseover'
        const leave = t === 'mouseout'
        if ((enter || leave) && e.relatedTarget === whole) return
        forward(whole, t, e)
        if (enter) forward(whole, 'mouseenter', e)
        if (leave) forward(whole, 'mouseleave', e)
      },
      { passive: true },
    ),
  )
}

/**
 * Hover and selection light a whole through its `filter`; a part over it
 * lights too, however the whole's filter changes (the pointer, the API, the
 * keyboard, another mark's click clearing it).
 * @param {any} whole the whole's node
 * @param {any} n the part's node
 */
export function mirrorFilter(whole, n) {
  const sync = () => {
    const f = whole.getAttribute('filter')
    if (f) n.setAttribute('filter', f)
    else n.removeAttribute('filter')
  }
  sync()
  // A server render has no pointer, and its elements are not DOM nodes.
  Environment.isBrowser() &&
    typeof MutationObserver !== 'undefined' &&
    new MutationObserver(sync).observe(whole, {
      attributes: true,
      attributeFilter: ['filter'],
    })
}

/**
 * Put `n` right after `node` in its parent (the server renderer's elements
 * know no siblings).
 * @param {any} node @param {any} n
 */
export function insertAfter(node, n) {
  const parent = node.parentNode
  const kids = Array.from(parent.childNodes)
  parent.insertBefore(n, kids[kids.indexOf(node) + 1] || null)
}

/**
 * Add a class by rewriting the attribute (the server renderer serialises
 * the attribute, not classList).
 * @param {any} n @param {string} c
 */
export const addClass = (n, c) =>
  n.setAttribute('class', `${n.getAttribute('class') || ''} ${c}`.trim())

/**
 * Re-dispatch a pointer event on another element, as if it had happened
 * there (same position, buttons, keys and touches).
 * @param {any} target @param {string} type @param {any} e
 */
function forward(target, type, e) {
  try {
    // mouseenter and mouseleave never bubble, so they cannot copy the over
    // or out they come from.
    const init = e.touches
      ? {
          bubbles: true,
          cancelable: true,
          touches: Array.from(e.touches),
          targetTouches: Array.from(e.targetTouches),
          changedTouches: Array.from(e.changedTouches),
        }
      : type === 'mouseenter' || type === 'mouseleave'
        ? {
            clientX: e.clientX,
            clientY: e.clientY,
            screenX: e.screenX,
            screenY: e.screenY,
            relatedTarget: e.relatedTarget,
            buttons: e.buttons,
          }
        : e
    target.dispatchEvent(new e.constructor(type, init))
  } catch (_) {
    // An event type this browser cannot construct: that mark stays as it was.
  }
}

/**
 * A series without its parts, in either form, and its points' children (a
 * drill level's or a hierarchy's) without theirs.
 * @param {any} s
 * @returns {any}
 */
export function stripSeries(s) {
  if (!isPoint(s)) return s
  const { highlightData: _hd, highlight: _h, ...rest } = s
  ;['data', 'children'].forEach((k) => {
    if (Array.isArray(rest[k])) rest[k] = rest[k].map(stripPoint)
  })
  return rest
}

/**
 * A circle's slices in the object form `[{ data: [{ x, y }] }]`, read as
 * Data reads them: every point with an x and a y (or children) across the
 * series objects, in order.
 * @param {any[]} series
 * @returns {any[]}
 */
export function slicePoints(series) {
  /** @type {any[]} */
  const pts = []
  ;(series || []).forEach((s) =>
    (isPoint(s) && Array.isArray(s.data) ? s.data : []).forEach(
      (/** @type {any} */ d) => {
        if (
          isPoint(d) &&
          d.x !== undefined &&
          (d.y !== undefined || Array.isArray(d.children))
        ) {
          pts.push(d)
        }
      },
    ),
  )
  return pts
}

/**
 * Whether a series or a point carries a part, on itself or anywhere below.
 * @param {any} d
 * @returns {boolean}
 */
export const carries = (d) =>
  isPoint(d) &&
  ('highlight' in d ||
    'highlightData' in d ||
    [d.data, d.children].some((a) => Array.isArray(a) && a.some(carries)))

/** A point is copied only when it has something to strip.
 * @param {any} d */
const stripPoint = (d) =>
  isPoint(d) && ('highlight' in d || Array.isArray(d.children))
    ? stripSeries(d)
    : d
