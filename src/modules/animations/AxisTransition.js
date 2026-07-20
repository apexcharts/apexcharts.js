// @ts-check
/**
 * Axis-chrome transitions for variable-length data updates.
 *
 * When a datum enters or exits, the series marks reflow smoothly (see
 * LengthTransition / PathReconcile) but the chrome around them: x-axis tick
 * labels, y-axis tick labels, gridlines: used to re-render instantly at the
 * new layout, so even a perfect mark reflow played against a snapped ruler.
 *
 * This module captures the outgoing render's tick geometry right before
 * teardown (label text + position, gridline positions aligned to those
 * labels) and, after the new render mounts, matches new ticks to old ones BY
 * TEXT: matched labels and their gridlines tween from the old position to the
 * new one on the same clock and easing as the series morph; unmatched (new)
 * labels and gridlines fade in. Removed ticks simply are not re-rendered.
 *
 * Deliberately best-effort: rotated labels are left alone (their rotation
 * transform bakes in the position), and gridlines are only paired when their
 * count matches the tick-label count on both sides. Any bail-out leaves the
 * new chrome exactly where the renderer put it.
 *
 * @module modules/animations/AxisTransition
 */

import { Environment } from '../../utils/Environment'
import Utils from '../../utils/Utils'
import {
  lengthTransitionEnabled,
  morphEasing,
  rafTween,
  seriesJoin,
} from './LengthTransition'

/**
 * @param {Element} root
 * @param {string} sel
 * @param {string} posAttr
 * @returns {{text: string, display: string, pos: number, transform: string | null}[]}
 */
function grabLabels(root, sel, posAttr) {
  return [...root.querySelectorAll(sel)].map((el) => ({
    // `text` is the matching KEY (textContent, which doubles tspan + title
    // but does so consistently on both sides); `display` is the visible
    // string, used when rendering an exit ghost.
    text: el.textContent || '',
    display: el.querySelector('tspan')?.textContent ?? el.textContent ?? '',
    pos: parseFloat(el.getAttribute(posAttr) || ''),
    transform: el.getAttribute('transform'),
  }))
}

/**
 * @param {Element} root
 * @param {string} sel
 * @param {string} posAttr
 * @returns {number[]}
 */
function grabLines(root, sel, posAttr) {
  return [...root.querySelectorAll(sel)].map((el) =>
    parseFloat(el.getAttribute(posAttr) || ''),
  )
}

// Exit ghosts spawned by a previous transition must never be captured or
// matched as real ticks.
const NO_GHOST = ':not(.apexcharts-tick-ghost)'
const X_LABELS_SEL = `.apexcharts-xaxis-texts-g text:not(.apexcharts-xaxis-group-label)${NO_GHOST}`
const Y_LABELS_SEL = `.apexcharts-yaxis-texts-g text${NO_GHOST}`
const V_GRID_SEL = `.apexcharts-gridlines-vertical line${NO_GHOST}`
const H_GRID_SEL = `.apexcharts-gridlines-horizontal line${NO_GHOST}`

/**
 * The x-axis value scale of the current render, when the label/gridline
 * coordinate space is affine in the data value: numeric/datetime axes where
 * `pos(v) = (v - min) / (max - min) * gridWidth`. Category axes (sentinel
 * bounds) and reversed axes return null, which limits the transition to
 * text matching + fades exactly as before.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @returns {{min: number, max: number, width: number} | null}
 */
function currentXScale(w) {
  const gl = w.globals
  if (!w.axisFlags?.isXNumeric || gl.isBarHorizontal) return null
  if (w.config.xaxis?.reversed) return null
  const min = gl.minX
  const max = gl.maxX
  const width = w.layout.gridWidth
  if (!isFinite(min) || !isFinite(max) || !(max > min) || !(width > 0)) {
    return null
  }
  return { min, max, width }
}

/**
 * The y-axis value anchors of the current render: the value range plus the
 * pixel positions of the outermost tick labels (which absorbs any constant
 * label offset, and handles reversed axes for free). Single non-log y axis
 * only; anything else falls back to text matching.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{pos: number}[]} labels - grabbed y labels of this render
 * @returns {{min: number, max: number, pLo: number, pHi: number} | null}
 */
function currentYAnchors(w, labels) {
  const gl = w.globals
  if (gl.isBarHorizontal) return null
  if (!Array.isArray(w.config.yaxis) || w.config.yaxis.length !== 1) return null
  if (w.config.yaxis[0]?.logarithmic) return null
  const min = gl.minY
  const max = gl.maxY
  if (!isFinite(min) || !isFinite(max) || !(max > min)) return null
  const ps = labels.map((l) => l.pos).filter((p) => isFinite(p))
  if (ps.length < 2) return null
  // min value renders at the LARGEST y (bottom), max at the smallest.
  return { min, max, pLo: Math.max(...ps), pHi: Math.min(...ps) }
}

/**
 * Compose old->new / new->old pixel maps for the x axis from its bounds.
 *
 * @param {{min: number, max: number, width: number} | null | undefined} o
 * @param {{min: number, max: number, width: number} | null} n
 * @returns {{toNew: (p: number) => number, toOld: (p: number) => number} | null}
 */
function composeXMap(o, n) {
  if (!o || !n) return null
  const os = o.max - o.min
  const ns = n.max - n.min
  if (!(os > 0) || !(ns > 0) || !(o.width > 0) || !(n.width > 0)) return null
  return {
    toNew: (p) => ((o.min + (p / o.width) * os - n.min) / ns) * n.width,
    toOld: (p) => ((n.min + (p / n.width) * ns - o.min) / os) * o.width,
  }
}

/**
 * Compose old->new / new->old pixel maps for the y axis from tick anchors.
 *
 * @param {{min: number, max: number, pLo: number, pHi: number} | null | undefined} o
 * @param {{min: number, max: number, pLo: number, pHi: number} | null} n
 * @returns {{toNew: (p: number) => number, toOld: (p: number) => number} | null}
 */
function composeYMap(o, n) {
  if (!o || !n) return null
  const oSpanP = o.pHi - o.pLo
  const nSpanP = n.pHi - n.pLo
  const oSpanV = o.max - o.min
  const nSpanV = n.max - n.min
  if (!oSpanP || !nSpanP || !(oSpanV > 0) || !(nSpanV > 0)) return null
  /** @param {number} p */
  const oldVal = (p) => o.min + ((p - o.pLo) / oSpanP) * oSpanV
  /** @param {number} p */
  const newVal = (p) => n.min + ((p - n.pLo) / nSpanP) * nSpanV
  return {
    toNew: (p) => n.pLo + ((oldVal(p) - n.min) / nSpanV) * nSpanP,
    toOld: (p) => o.pLo + ((newVal(p) - o.min) / oSpanV) * oSpanP,
  }
}

/**
 * Snapshot the outgoing render's axis chrome. Called from
 * Series.getPreviousPaths() alongside the path/frame captures, i.e. before
 * the DOM is torn down for the incoming update.
 *
 * @param {import('../../types/internal').ChartStateW} w
 */
export function captureAxisChrome(w) {
  const gl = w.globals
  gl.prevChromeFrame = null
  if (!gl.axisCharts || !Environment.isBrowser()) return
  const root = w.dom.baseEl
  if (!Utils.elementExists(root)) return
  try {
    const yLabels = grabLabels(root, Y_LABELS_SEL, 'y')
    gl.prevChromeFrame = {
      xLabels: grabLabels(root, X_LABELS_SEL, 'x'),
      yLabels,
      vGrid: grabLines(root, V_GRID_SEL, 'x1'),
      hGrid: grabLines(root, H_GRID_SEL, 'y1'),
      // Value scales of the outgoing render, so ticks whose TEXT has no
      // counterpart (e.g. a zoom across datetime granularities) can still be
      // re-projected: new ticks slide in from where their value sat, old
      // ticks ghost out to where their value lands.
      xScale: currentXScale(w),
      yAnchors: currentYAnchors(w, yLabels),
    }
  } catch (_) {
    gl.prevChromeFrame = null
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
 * @param {import('../../types/internal').ChartStateW} w
 * @param {Element} node
 * @param {string[]} attrs - attributes to drive (e.g. ['x'] or ['x1', 'x2'])
 * @param {number} from
 * @param {number} to
 * @param {number} duration
 * @param {(t: number) => number} ease
 */
function tweenPos(w, node, attrs, from, to, duration, ease) {
  attrs.forEach((a) => node.setAttribute(a, String(from)))
  rafTween(
    w,
    duration,
    ease,
    (eased) => {
      const v = String(from + (to - from) * eased)
      attrs.forEach((a) => node.setAttribute(a, v))
    },
    () => {
      attrs.forEach((a) => node.setAttribute(a, String(to)))
    },
  )
}

/**
 * Spawn a ghost of an outgoing tick label (or gridline): a clone that slides
 * to the projected new position of its value while fading out, then removes
 * itself. Ghosts carry `.apexcharts-tick-ghost` so captures, matching, and
 * later transitions never see them, plus pointer-events none.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{
 *   template: Element,
 *   display?: string,
 *   attrs: string[],
 *   from: number,
 *   to: number,
 *   duration: number,
 *   ease: (t: number) => number,
 * }} opts
 */
function spawnGhost(w, { template, display, attrs, from, to, duration, ease }) {
  const parent = template.parentNode
  if (!parent) return
  const ghost = /** @type {Element} */ (template.cloneNode(true))
  ghost.classList.add('apexcharts-tick-ghost')
  ghost.setAttribute('pointer-events', 'none')
  ghost.removeAttribute('id')
  if (display !== undefined) {
    const tspan = ghost.querySelector('tspan')
    if (tspan) tspan.textContent = display
    else ghost.textContent = display
    const title = ghost.querySelector('title')
    if (title) title.textContent = display
  }
  attrs.forEach((a) => ghost.setAttribute(a, String(from)))
  const style = /** @type {any} */ (ghost).style
  style.opacity = '1'
  parent.appendChild(ghost)

  rafTween(
    w,
    duration,
    ease,
    (eased) => {
      const v = String(from + (to - from) * eased)
      attrs.forEach((a) => ghost.setAttribute(a, v))
      style.opacity = String(1 - eased)
    },
    () => {
      if (ghost.parentNode) ghost.parentNode.removeChild(ghost)
    },
  )
}

// Zooming far out can retire many ticks at once; cap the ghost fan-out.
const MAX_GHOSTS = 20

/**
 * Match new tick labels to captured ones by text, tweening matches and
 * fading in the rest. When a value-space projection exists (numeric/datetime
 * axes), unmatched NEW ticks additionally slide in from where their value
 * sat in the old render, and unmatched OLD ticks ghost out to where their
 * value lands: the cross-granularity zoom case, where no texts match. When
 * the gridline count equals the label count on a side, each gridline rides
 * with its label.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{
 *   newLabels: Element[],
 *   oldLabels: {text: string, display: string, pos: number, transform: string | null}[],
 *   posAttr: string,
 *   newLines: Element[],
 *   oldLines: number[],
 *   lineAttrs: string[],
 *   duration: number,
 *   ease: (t: number) => number,
 *   project?: {toNew: (p: number) => number, toOld: (p: number) => number} | null,
 * }} opts
 */
function transitionAxis(
  w,
  {
    newLabels,
    oldLabels,
    posAttr,
    newLines,
    oldLines,
    lineAttrs,
    duration,
    ease,
    project,
  },
) {
  const oldByText = new Map()
  oldLabels.forEach((l, i) => {
    if (!oldByText.has(l.text)) oldByText.set(l.text, { ...l, i })
  })
  const matchedOld = new Set()

  const newLinesAligned = newLines.length === newLabels.length
  const oldLinesAligned = oldLines.length === oldLabels.length

  // Projected positions can land thousands of px off-axis on a deep zoom.
  // The axis groups are not clipped, so clamp travel to just beyond the
  // rendered span: visually identical (elements are near-transparent by the
  // time they cross the edge) and nothing ever paints far outside the chart.
  const spanPs = oldLabels
    .map((l) => l.pos)
    .concat(
      newLabels.map((l) => parseFloat(l.getAttribute(posAttr) || '')),
    )
    .filter((p) => isFinite(p))
  const spanLo = Math.min(...spanPs)
  const spanHi = Math.max(...spanPs)
  const margin = Math.max(40, (spanHi - spanLo) * 0.25)
  /** @param {number} p */
  const clamp = (p) =>
    Math.max(spanLo - margin, Math.min(spanHi + margin, p))

  /**
   * Ride a paired gridline from its old to its new position (gridlines are
   * never rotated, so a plain attribute tween always applies).
   * @param {Element | null} line
   * @param {{i: number}} old
   */
  const tweenPairedLine = (line, old) => {
    if (!line) return
    const lineTo = parseFloat(line.getAttribute(lineAttrs[0]) || '')
    const lineFrom = oldLines[old.i]
    if (isFinite(lineTo) && isFinite(lineFrom)) {
      tweenPos(w, line, lineAttrs, lineFrom, lineTo, duration, ease)
    }
  }

  newLabels.forEach((label, i) => {
    const to = parseFloat(label.getAttribute(posAttr) || '')
    const old = oldByText.get(label.textContent || '')
    const line = newLinesAligned ? newLines[i] : null
    if (old) matchedOld.add(old.i)
    const labelTransform = label.getAttribute('transform')

    // Entering tick (no text match): slide in from its value's projected old
    // position (numeric/datetime axes only) and fade up.
    if (!old || !isFinite(old.pos)) {
      if (!old) {
        if (project && isFinite(to) && !labelTransform) {
          const from = isFinite(project.toOld(to))
            ? clamp(project.toOld(to))
            : NaN
          if (isFinite(from) && Math.abs(from - to) > 0.5) {
            tweenPos(w, label, [posAttr], from, to, duration, ease)
            if (line) tweenPos(w, line, lineAttrs, from, to, duration, ease)
          }
        }
        fadeIn(w, label, duration, ease)
        if (line) fadeIn(w, line, duration, ease)
      }
      return
    }
    if (!isFinite(to) || Math.abs(old.pos - to) < 0.5) return

    if (labelTransform || old.transform) {
      // Rotated label (e.g. a vertical column chart's x-axis categories): the
      // position is baked behind a rotate() transform, so driving the x/y
      // attribute would fight it. Instead ride via a leading translate composed
      // in front of the existing rotate and tweened to zero — the glyph keeps
      // its rotation and slides along the axis (same trick the data-label ride
      // uses). Applied for any transformed match, so rotated ticks also move on
      // zoom / length-change updates, not just reorders.
      const delta = old.pos - to
      if (isFinite(delta)) {
        const base = labelTransform || ''
        rafTween(
          w,
          duration,
          ease,
          (eased) => {
            const v = delta * (1 - eased)
            const t = posAttr === 'x' ? `translate(${v} 0)` : `translate(0 ${v})`
            label.setAttribute('transform', `${t} ${base}`.trim())
          },
          () => {
            if (base) label.setAttribute('transform', base)
            else label.removeAttribute('transform')
          },
        )
      }
      tweenPairedLine(line, old)
      return
    }

    tweenPos(w, label, [posAttr], old.pos, to, duration, ease)
    tweenPairedLine(line, old)
  })

  // Exit ghosts: outgoing ticks whose text found no new counterpart slide to
  // their value's projected position while fading out.
  if (!project || !newLabels.length) return
  let ghosts = 0
  oldLabels.forEach((old, i) => {
    if (matchedOld.has(i)) return
    if (!isFinite(old.pos) || old.transform) return
    if (ghosts >= MAX_GHOSTS) return
    const rawTo = project.toNew(old.pos)
    if (!isFinite(rawTo) || Math.abs(rawTo - old.pos) < 0.5) return
    ghosts++
    spawnGhost(w, {
      template: newLabels[0],
      display: old.display,
      attrs: [posAttr],
      from: old.pos,
      to: clamp(rawTo),
      duration,
      ease,
    })
    if (oldLinesAligned && newLines.length && isFinite(oldLines[i])) {
      spawnGhost(w, {
        template: newLines[0],
        attrs: lineAttrs,
        from: oldLines[i],
        to: clamp(project.toNew(oldLines[i])),
        duration,
        ease,
      })
    }
  })
}

/**
 * Animate the axis chrome after a variable-length re-render. Consumes the
 * captured frame (one shot per update); a no-op unless this update is an
 * animated layout change for at least one series.
 *
 * @param {import('../../types/internal').ChartStateW} w
 */
export function applyAxisTransition(w) {
  const gl = w.globals
  const chrome = gl.prevChromeFrame
  gl.prevChromeFrame = null
  if (!chrome || !gl.axisCharts || !Environment.isBrowser()) return
  if (!lengthTransitionEnabled(w)) return
  // Any animated data-change render qualifies, including identity joins
  // (zoom re-projections, same-length value updates) and pure reorders (a
  // "bar chart race" swap): matched ticks slide, new ones fade in, and
  // unchanged chrome is a per-label no-op (the sub-half-pixel skip below).
  // allowReorder keeps the gate open on a reorder so labels ride the swap the
  // same way the keyed bar morph already does; the text-match tween below is
  // order-agnostic, so no reconciliation assumption is violated.
  const anyMotion = (w.seriesData.series || []).some(
    (_, i) => seriesJoin(w, i, true, true) !== null,
  )
  if (!anyMotion) return
  const root = w.dom.baseEl
  if (!Utils.elementExists(root)) return

  const duration = Math.max(1, w.config.chart.animations.dynamicAnimation.speed || 1)
  const ease = morphEasing(w)

  try {
    const newYLabels = [...root.querySelectorAll(Y_LABELS_SEL)]
    // Value-space projections (null on category/reversed/multi-axis/log,
    // where the transition stays text-match + fade).
    const projX = composeXMap(chrome.xScale, currentXScale(w))
    const projY = composeYMap(
      chrome.yAnchors,
      currentYAnchors(
        w,
        newYLabels.map((el) => ({
          pos: parseFloat(el.getAttribute('y') || ''),
        })),
      ),
    )

    transitionAxis(w, {
      newLabels: [...root.querySelectorAll(X_LABELS_SEL)],
      oldLabels: chrome.xLabels,
      posAttr: 'x',
      newLines: [...root.querySelectorAll(V_GRID_SEL)],
      oldLines: chrome.vGrid,
      lineAttrs: ['x1', 'x2'],
      duration,
      ease,
      project: projX,
    })
    transitionAxis(w, {
      newLabels: newYLabels,
      oldLabels: chrome.yLabels,
      posAttr: 'y',
      newLines: [...root.querySelectorAll(H_GRID_SEL)],
      oldLines: chrome.hGrid,
      lineAttrs: ['y1', 'y2'],
      duration,
      ease,
      project: projY,
    })
  } catch (_) {
    // Chrome polish must never break a render.
  }
}
