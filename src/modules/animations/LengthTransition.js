// @ts-check
/**
 * Variable-length data transitions: the enter / update / exit layer.
 *
 * The engine's dynamic-update animation is a capture/replay of per-element
 * paths keyed by (realIndex, data-point index). Index pairing breaks the
 * moment the number of data points changes: an appended bar has no previous
 * path (pathFrom === pathTo, so it pops in at full size on frame 0), a
 * removed bar simply never re-renders (no exit), and an insert in the middle
 * silently morphs every later bar into a different datum.
 *
 * This module supplies the three missing pieces, modeled on the keyed data
 * join (object constancy) used by studio-grade transition engines:
 *
 *  - datum KEYS: every bar path is stamped with a stable datum key (category
 *    label, else numeric x value, else the index). Survivors are matched by
 *    key, not position, so insert/prepend/remove keep identity.
 *  - ENTER: a datum whose key has no previous path grows from the baseline of
 *    its final slot (the initial-mount rise, previously unreachable during
 *    updates).
 *  - EXIT: a previous path whose key is gone re-enters the DOM as a ghost
 *    element that shrinks to its own baseline edge and fades, then removes
 *    itself. Ghosts carry no `pathTo` attribute so the next capture ignores
 *    them, and no pointer events so tooltips/selection never see them.
 *
 * Line/area point-count changes are handled separately by PathReconcile
 * (union-anchor path padding); this module provides the shared key/join
 * primitives for both.
 *
 * @module modules/animations/LengthTransition
 */

import Graphics from '../Graphics'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'
import { Environment } from '../../utils/Environment'
import { resolveEasing } from './Easing'
import {
  buildUnionEntries,
  reconcilePathPair,
} from '../../svg/PathReconcile'

/**
 * Whether data-change updates are being animated at all in this render.
 * Mirrors the gate Graphics.renderPaths applies before scheduling a morph.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @returns {boolean}
 */
export function lengthTransitionEnabled(w) {
  const anim = w.config.chart.animations
  if (!anim || anim.enabled === false) return false
  if (!anim.dynamicAnimation || anim.dynamicAnimation.enabled === false) {
    return false
  }
  const largeThreshold = anim.largeDatasetThreshold ?? 0
  if (largeThreshold > 0 && w.globals.dataPoints > largeThreshold) return false
  return !!(
    Environment.isBrowser() &&
    w.globals.dataChanged &&
    w.globals.shouldAnimate
  )
}

/**
 * Stable identity for a datum in the CURRENT (being-rendered) frame.
 * Preference order: numeric/datetime x value, category label, index.
 * The prefixes keep the three namespaces from colliding.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {number} realIndex
 * @param {number} j
 * @returns {string}
 */
export function datumKey(w, realIndex, j) {
  if (w.axisFlags?.isXNumeric) {
    const sx = w.seriesData?.seriesX?.[realIndex]
    if (sx && sx.length && sx[j] != null) return 'x:' + sx[j]
  }
  const lbl = w.globals.labels?.[j]
  if (lbl != null && String(lbl) !== '') {
    return 'c:' + (Array.isArray(lbl) ? lbl.join(' ') : String(lbl))
  }
  return 'j:' + j
}

/**
 * Same identity derived from a captured previous frame (see
 * StreamScroll.captureStreamFrame): used where the previous render did not
 * stamp keys onto DOM elements (line/area series are single paths).
 *
 * @param {any} frame - w.globals.prevStreamFrame
 * @param {number} realIndex
 * @param {number} j
 * @returns {string}
 */
export function frameDatumKey(frame, realIndex, j) {
  if (frame.isXNumeric) {
    const sx = frame.seriesX?.[realIndex]
    if (sx && sx.length && sx[j] != null) return 'x:' + sx[j]
  }
  const lbl = frame.labels?.[j]
  if (lbl != null && String(lbl) !== '') {
    return 'c:' + (Array.isArray(lbl) ? lbl.join(' ') : String(lbl))
  }
  return 'j:' + j
}

/**
 * Keyed join of the old datum order against the new one.
 *
 * @param {string[]} oldKeys
 * @param {string[]} newKeys
 * @returns {{
 *   toOld: number[],      // newJ -> oldJ, or -1 for an entering datum
 *   exits: number[],      // oldJ indices with no new counterpart
 *   ordered: boolean,     // survivors appear in the same relative order
 *   changed: boolean,     // false = pure identity mapping (legacy behavior)
 * }}
 */
export function joinKeys(oldKeys, newKeys) {
  const oldIndex = new Map()
  oldKeys.forEach((k, i) => {
    if (!oldIndex.has(k)) oldIndex.set(k, i)
  })

  const toOld = new Array(newKeys.length)
  const usedOld = new Set()
  let prev = -1
  let ordered = true
  let identity = oldKeys.length === newKeys.length

  newKeys.forEach((k, i) => {
    const oi =
      oldIndex.has(k) && !usedOld.has(oldIndex.get(k)) ? oldIndex.get(k) : -1
    toOld[i] = oi
    if (oi !== -1) {
      usedOld.add(oi)
      if (oi < prev) ordered = false
      prev = oi
    }
    if (oi !== i) identity = false
  })

  const exits = []
  for (let i = 0; i < oldKeys.length; i++) {
    if (!usedOld.has(i)) exits.push(i)
  }

  return { toOld, exits, ordered, changed: !identity }
}

/**
 * Disambiguate repeated keys by occurrence: scatter series legitimately carry
 * duplicate x values (a jitter strip plot has one shared band x per cloud of
 * points), and without a suffix every duplicate after the first would read as
 * an enter/exit pair. The first occurrence keeps the clean key, so charts
 * with unique keys (bars, time series) are untouched.
 *
 * @param {string[]} keys
 * @returns {string[]}
 */
function uniquifyKeys(keys) {
  /** @type {Map<string, number>} */
  const seen = new Map()
  return keys.map((k) => {
    const count = seen.get(k) || 0
    seen.set(k, count + 1)
    return count === 0 ? k : `${k}#${count}`
  })
}

/**
 * The keyed join for one series against the captured previous frame, or null
 * when this render is not an animated update for that series (no frame,
 * reordered keys, animations off).
 *
 * By default only LAYOUT changes qualify (datums entered/exited): that gates
 * the enter/exit machinery (ghosts, baseline enters, path reconciliation).
 * Pass `includeIdentity` to also accept identity joins, where the datum set
 * is unchanged but its pixel positions may have moved: an animated zoom or a
 * same-length value update. Marker rides and axis-chrome transitions use
 * that wider gate so the chrome moves with any animated re-projection.
 *
 * By default survivors that reordered (a "bar chart race" swap) return null,
 * because the enter/exit machinery (PathReconcile union building, marker rides)
 * assumes monotonic survivor order. Pass `allowReorder` to keep the join for a
 * pure reorder too: only the axis-chrome gate uses this, and its text-match
 * label tween is order-agnostic, so labels can ride a reorder the same way the
 * keyed bar morph already does. Do NOT pass it for path/marker reconciliation.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {number} realIndex
 * @param {boolean} [includeIdentity=false]
 * @param {boolean} [allowReorder=false]
 * @returns {{join: ReturnType<typeof joinKeys>, oldKeys: string[], newKeys: string[]} | null}
 */
export function seriesJoin(
  w,
  realIndex,
  includeIdentity = false,
  allowReorder = false,
) {
  if (!lengthTransitionEnabled(w)) return null
  const frame = w.globals.prevStreamFrame
  if (!frame) return null
  const oldY = frame.seriesY?.[realIndex]
  const newY = w.seriesData.series?.[realIndex]
  if (!Array.isArray(oldY) || !Array.isArray(newY)) return null
  if (!oldY.length || !newY.length) return null

  const oldKeys = uniquifyKeys(
    oldY.map((_, j) => frameDatumKey(frame, realIndex, j)),
  )
  const newKeys = uniquifyKeys(newY.map((_, j) => datumKey(w, realIndex, j)))
  const join = joinKeys(oldKeys, newKeys)
  if (!join.ordered && !allowReorder) return null
  if (!join.changed && !includeIdentity) return null
  return { join, oldKeys, newKeys }
}

/**
 * The morph easing dynamic updates run with (dynamicAnimation.easing when
 * set, else the chart-wide easing, else the default sine in-out). Marker
 * and axis-chrome tweens must use the exact same curve or they drift off
 * the moving marks mid-transition.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @returns {(t: number) => number}
 */
export function morphEasing(w) {
  const anim = w.config.chart.animations
  return resolveEasing(anim.dynamicAnimation?.easing ?? anim.easing)
}

/**
 * Minimal rAF tween shared by the marker, ghost, and axis-chrome animations.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {number} duration
 * @param {(t: number) => number} ease
 * @param {(eased: number, raw: number) => void} onFrame
 * @param {(() => void)} [onDone]
 */
export function rafTween(w, duration, ease, onFrame, onDone) {
  const startAt = performance.now()
  /** @param {number} now */
  const step = (now) => {
    if (w.globals.isDestroyed) return
    const raw = Math.max(0, Math.min(1, (now - startAt) / duration))
    onFrame(ease(raw), raw)
    if (raw < 1) {
      BrowserAPIs.requestAnimationFrame(step)
    } else if (onDone) {
      onDone()
    }
  }
  BrowserAPIs.requestAnimationFrame(step)
}

/**
 * Tween a series' markers across a layout change: surviving datums' markers
 * translate from their previous pixel position to the new one on the same
 * clock and easing as the path morph (so dots ride the moving line), and
 * entering datums' markers fade in. Exited markers simply are not re-rendered.
 *
 * Returns true when the tween engaged; the caller then keeps the marker wrap
 * visible instead of hiding it until the morph completes.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{elPointsMain: any, realIndex: number, speed: number}} opts
 * @returns {boolean}
 */
export function tweenSeriesMarkers(w, { elPointsMain, realIndex, speed }) {
  if (!elPointsMain?.node) return false
  // Identity joins qualify: markers also ride zooms and same-length value
  // updates, where every datum survives but its pixel position moves.
  const sj = seriesJoin(w, realIndex, true)
  if (!sj) return false
  const frame = w.globals.prevStreamFrame
  if (!frame) return false
  const oldXP = frame.xPixels?.[realIndex]
  const oldYP = frame.yPixels?.[realIndex]
  if (!oldXP || !oldYP) return false

  const markers = elPointsMain.node.querySelectorAll('.apexcharts-marker')
  if (!markers.length) return false
  const newXP = w.globals.seriesXvalues?.[realIndex] || []
  const newYP = w.globals.seriesYvalues?.[realIndex] || []
  const ease = morphEasing(w)
  const duration = Math.max(1, speed || 1)

  elPointsMain.node.classList.remove('apexcharts-element-hidden')

  markers.forEach((/** @type {Element} */ node) => {
    const j = parseInt(
      node.getAttribute('j') ?? node.getAttribute('rel') ?? '',
      10,
    )
    if (!isFinite(j) || j < 0 || j >= sj.join.toOld.length) return
    const oldJ = sj.join.toOld[j]
    const to =
      newXP[j] != null && newYP[j] != null ? [newXP[j], newYP[j]] : null

    if (oldJ === -1 || !to) {
      // Entering datum: fade its marker in over the shared clock.
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
      return
    }

    const dx = (oldXP[oldJ] ?? NaN) - to[0]
    const dy = (oldYP[oldJ] ?? NaN) - to[1]
    if (!isFinite(dx) || !isFinite(dy)) return

    // Bubble z updates change the marker's SIZE, not just its position.
    // Circle markers expose the radius as `r`; path-shaped markers (bubbles)
    // bake it into the path data but expose it as `default-marker-size`.
    // Size rides as a scale about the marker's own center, composed into the
    // same transform as the positional ride (the animatePop precedent).
    const rFrom = frame.rPixels?.[realIndex]?.[oldJ] ?? NaN
    const rTo = parseFloat(
      node.getAttribute('r') ?? node.getAttribute('default-marker-size') ?? '',
    )
    const scales =
      isFinite(rFrom) && isFinite(rTo) && rTo > 0 && Math.abs(rFrom - rTo) > 0.25

    const moves = Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5
    if (!moves && !scales) return

    /** @param {number} eased */
    const apply = (eased) => {
      const offX = dx * (1 - eased)
      const offY = dy * (1 - eased)
      if (scales) {
        const s = (rFrom + (rTo - rFrom) * eased) / rTo
        // scale about the marker's final center (to), shifted by the ride
        node.setAttribute(
          'transform',
          `translate(${offX + to[0] * (1 - s)}, ${offY + to[1] * (1 - s)}) scale(${s})`,
        )
      } else {
        node.setAttribute('transform', `translate(${offX}, ${offY})`)
      }
    }
    apply(0)
    rafTween(w, duration, ease, apply, () => {
      node.removeAttribute('transform')
    })
  })
  return true
}

/**
 * Reconcile a line/area series' morph paths across a datum-length change.
 *
 * Joins the captured previous frame's datums against the new ones by key and,
 * when the layout changed, rebuilds the morph pair over the union of anchors
 * (see PathReconcile): entering points start ON the old curve, exiting points
 * melt INTO the new curve, and area closing blocks pair with each other so
 * the fill cannot tear. Returns null whenever the legacy morph should run
 * (identity mapping, null-segmented data, reordered keys, non-standard path
 * shapes, streaming/scroll handled elsewhere).
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{
 *   type: string,
 *   realIndex: number,
 *   pathFromLine: string,
 *   pathFromArea: string,
 *   linePaths: string[],
 *   areaPaths: string[],
 * }} opts
 * @returns {{line?: {from: string, toInterp: string} | null, area?: {from: string, toInterp: string} | null} | null}
 */
export function reconcileSeriesPaths(
  w,
  { type, realIndex, pathFromLine, pathFromArea, linePaths, areaPaths },
) {
  const sj = seriesJoin(w, realIndex)
  if (!sj) return null
  const { join, oldKeys, newKeys } = sj

  const frame = w.globals.prevStreamFrame
  if (!frame) return null
  const oldY = frame.seriesY?.[realIndex]
  const newY = w.seriesData.series?.[realIndex]
  if (oldY.length < 2 || newY.length < 2) return null
  // Null gaps segment the path into multiple M blocks: legacy morph.
  if (oldY.some((v) => v === null) || newY.some((v) => v === null)) return null

  const entries = buildUnionEntries(join, oldKeys.length)
  /** @type {{line?: any, area?: any}} */
  const out = {}
  if (Array.isArray(linePaths) && linePaths.length === 1 && pathFromLine) {
    out.line = reconcilePathPair(
      pathFromLine,
      linePaths[0],
      entries,
      oldKeys.length,
      newKeys.length,
      false,
    )
  }
  if (
    type === 'area' &&
    Array.isArray(areaPaths) &&
    areaPaths.length === 1 &&
    pathFromArea
  ) {
    out.area = reconcilePathPair(
      pathFromArea,
      areaPaths[0],
      entries,
      oldKeys.length,
      newKeys.length,
      true,
    )
  }
  if (!out.line && !out.area) return null
  return out
}

/**
 * Parse the first `M x y` of a path. Bar paths always start on their
 * baseline edge (see Helpers.getColumnPaths / getBarpaths), which lets the
 * exit ghost work out which edge to shrink toward without any scale math.
 *
 * @param {string} d
 * @returns {{x: number, y: number} | null}
 */
function firstMove(d) {
  const m = /^M\s*([+-]?[\d.eE]+)[\s,]+([+-]?[\d.eE]+)/.exec(d || '')
  if (!m) return null
  const x = parseFloat(m[1])
  const y = parseFloat(m[2])
  return isFinite(x) && isFinite(y) ? { x, y } : null
}

/**
 * Render exit ghosts for the previous render's bars whose datum keys are not
 * present in the new data. Each ghost is inserted UNDER the new bars (first
 * child), shrinks toward its baseline edge while fading, then removes itself.
 *
 * No-ops in SSR, when nothing exited, or when the update is not animating.
 *
 * @param {{
 *   w: import('../../types/internal').ChartStateW,
 *   elSeries: any,
 *   record: {realIndex: string | number, paths: {d: string, key?: string | null, fill?: string | null}[]} | null,
 *   newKeys: string[],
 *   isHorizontal: boolean,
 *   speed: number,
 * }} opts
 */
export function renderBarExitGhosts({
  w,
  elSeries,
  record,
  newKeys,
  isHorizontal,
  speed,
}) {
  if (!lengthTransitionEnabled(w)) return
  if (!record || !Array.isArray(record.paths) || !elSeries?.node) return

  const newKeySet = new Set(newKeys)
  const exits = record.paths.filter(
    (p) => p && p.d && p.key != null && !newKeySet.has(p.key),
  )
  if (!exits.length) return

  const graphics = new Graphics(w)
  const fallbackFill = w.globals.colors?.[parseInt(String(record.realIndex), 10)]

  exits.forEach((p) => {
    let fill = p.fill || fallbackFill || '#c8c8c8'
    // Gradient/pattern fills reference defs of the destroyed render; fall back
    // to the series' solid color rather than risking a dead url() reference.
    if (String(fill).indexOf('url(') === 0) fill = fallbackFill || '#c8c8c8'

    const ghost = graphics.drawPath({
      d: p.d,
      stroke: 'none',
      strokeWidth: 0,
      fill,
      fillOpacity: 1,
      classes: 'apexcharts-bar-ghost',
    })
    const node = ghost.node
    node.setAttribute('pointer-events', 'none')
    ghost.attr(
      'clip-path',
      `url(#gridRectBarMask${w.globals.cuid})`,
    )

    // Painted under the surviving bars so the reflow slides over the ghosts.
    elSeries.node.insertBefore(node, elSeries.node.firstChild)

    // The path's first M sits on the baseline edge; shrink toward it.
    const start = firstMove(p.d)
    let origin = isHorizontal ? 'left center' : 'center bottom'
    try {
      const bb = node.getBBox()
      if (start && bb) {
        if (isHorizontal) {
          origin =
            Math.abs(start.x - bb.x) <= Math.abs(start.x - (bb.x + bb.width))
              ? 'left center'
              : 'right center'
        } else {
          origin =
            Math.abs(start.y - (bb.y + bb.height)) <= Math.abs(start.y - bb.y)
              ? 'center bottom'
              : 'center top'
        }
      }
    } catch (_) {
      // getBBox can throw on detached/zero-size geometry; keep the default.
    }

    const style = node.style
    style.transformBox = 'fill-box'
    style.transformOrigin = origin

    const duration = Math.max(1, speed || 1)
    const startAt = performance.now()
    /** @param {number} now */
    const step = (now) => {
      if (w.globals.isDestroyed || !node.parentNode) return
      const t = Math.max(0, Math.min(1, (now - startAt) / duration))
      const eased = 1 - Math.pow(1 - t, 3)
      const scale = 1 - eased
      style.transform = isHorizontal ? `scaleX(${scale})` : `scaleY(${scale})`
      style.opacity = String(1 - eased)
      if (t < 1) {
        BrowserAPIs.requestAnimationFrame(step)
      } else {
        node.parentNode.removeChild(node)
      }
    }
    BrowserAPIs.requestAnimationFrame(step)
  })
}
