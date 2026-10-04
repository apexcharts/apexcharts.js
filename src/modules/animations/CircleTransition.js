// @ts-check
/**
 * Circle transitions: a circular chart re-centred and re-sized by its chrome.
 *
 * Pie, donut, polarArea, radialBar and radar size and centre their circle
 * from the room the plot has. When an update changes that room (a title
 * appears, the legend moves or wraps), the circle has a new centre and radius,
 * but the series morph only tweens angles and values: the circle jumped to its
 * new place and size on the first frame. For the types without axes the plot
 * origin and the clip rects jumped too, as LayoutTransition only ran for axis
 * charts.
 *
 * Each circle renderer records where it drew its circle, in
 * `w.globals.circleGeometry`: the visual centre in plot-local coordinates and
 * the visual radius, after plotOptions.pie.customScale and the radar offsets.
 * captureCircle snapshots it before the teardown (the in-flight circle while
 * an earlier circle tween still runs, so a quick second update continues from
 * what is on screen). After the new render mounts, applyCircleTransition
 * eases the plot rect and clips (types without axes; a radar's own
 * LayoutTransition already does that) and drives one transform on the
 * circle's root group, on the clock and easing of the series morph:
 *
 *   translate(c(e)) scale(s(e)) translate(-c1)
 *
 * c(e) is the centre eased from the old one to the new one, and s(e) the
 * radius eased the same way, over the new radius. Every shape drawn inside
 * the circle (slices, rings, spokes, the radar web) rides and scales with it.
 *
 * Text does not scale with it. A label is set a fixed number of px off the
 * geometry (a radar's category names, a pie label's offset, a donut's centre
 * lines) in a fixed font, so scaled with the circle it started the move off
 * its old place and at another size. Each text rides instead from exactly
 * where it was on screen, at the size it had, to where the new render put it.
 * A slice pulled out keeps its px offset the same way.
 *
 * Whatever the new render starts from that was captured in the OLD render's
 * pixels has to be in the new one's, or the scale counts twice: polarArea
 * keeps its previous radii as fractions of the radius (Pie.draw), and radar
 * rescales its previous polygons (Radar.draw).
 *
 * @module modules/animations/CircleTransition
 */

import { Environment } from '../../utils/Environment'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'
import {
  captureLayout,
  landOnGesture,
  pendingUntilPaint,
  transitionLayout,
} from './LayoutTransition'
import { lengthTransitionEnabled, morphEasing } from './LengthTransition'

/** @typedef {{cx: number, cy: number, r: number}} Circle */
/** @typedef {{x: number, y: number, k: number, o: number}} TextAt */

/**
 * The circle as drawn now: the in-flight one while a circle tween runs on
 * this render, else where the renderer put it.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{node: Element, cx: number, cy: number, r: number}} geom
 * @returns {Circle}
 */
function currentCircle(w, geom) {
  const live = w.globals.circleTween
  if (live && !live.done && live.node === geom.node) return { ...live.circle }
  return { cx: geom.cx, cy: geom.cy, r: geom.r }
}

/**
 * The map from an element's own space to plot-local (the graphical group's)
 * space, through whatever transforms sit between them right now.
 *
 * @param {Element} el
 * @param {Element} graphical
 * @returns {DOMMatrix | null}
 */
function toPlot(el, graphical) {
  const m = /** @type {SVGGraphicsElement} */ (el).getCTM?.()
  const g = /** @type {SVGGraphicsElement} */ (graphical).getCTM?.()
  if (!m || !g) return null
  const r = g.inverse().multiply(m)
  // A DOMMatrix: an SVGMatrix only multiplies other SVGMatrix objects.
  return new DOMMatrix([r.a, r.b, r.c, r.d, r.e, r.f])
}

/**
 * Where a text's middle is in plot-local space, how much it is scaled there,
 * and its own opacity (one still fading in); null when there is nothing to
 * measure (no layout engine, or a text with nothing in it, whose box sits at
 * its group's origin rather than where it would be drawn).
 *
 * @param {Element} el
 * @param {Element} graphical
 * @returns {TextAt | null}
 */
function textAt(el, graphical) {
  try {
    const m = toPlot(el, graphical)
    const b = /** @type {SVGGraphicsElement} */ (el).getBBox()
    if (!m || !(b.width > 0 || b.height > 0)) return null
    const p = new DOMPoint(b.x + b.width / 2, b.y + b.height / 2).matrixTransform(m)
    const k = Math.hypot(m.a, m.b)
    const own = parseFloat(el.getAttribute('opacity') ?? '')
    const o = Number.isFinite(own) ? own : 1
    return [p.x, p.y, k].every(Number.isFinite) && k > 0 ? { x: p.x, y: p.y, k, o } : null
  } catch (_) {
    return null
  }
}

/**
 * Every text inside the circle with textAt, keyed so the same text pairs up
 * across renders: by its class, the slice or bar it labels when it says
 * (`data:slice`, `rel`), and its place among the texts sharing both (a radar's
 * k-th category name, a donut's centre lines). By slice, not by place alone:
 * a slice that draws no label (hidden, too thin) would shift every later one.
 *
 * @param {Element} node the circle's root group
 * @param {Element} graphical
 * @param {(el: Element, key: string) => void} [each] also called per text
 * @returns {Map<string, TextAt>}
 */
function readTexts(node, graphical, each) {
  /** @type {Map<string, TextAt>} */
  const out = new Map()
  /** @type {Record<string, number>} */
  const seen = {}
  node.querySelectorAll('text').forEach((el) => {
    const owner = el.closest('[data\\:slice], [rel]')
    const id = owner && node.contains(owner)
      ? owner.getAttribute('data:slice') ?? owner.getAttribute('rel')
      : ''
    const cls = `${el.getAttribute('class') || ''}|${id}`
    seen[cls] = (seen[cls] ?? -1) + 1
    const key = `${cls}#${seen[cls]}`
    const at = textAt(el, graphical)
    if (at) out.set(key, at)
    if (each) each(el, key)
  })
  return out
}

/**
 * The box of what the circle draws, in its svg's space, with that svg's
 * size; null without a layout engine.
 *
 * @param {Element} node
 * @param {Element} graphical
 * @returns {{l: number, t: number, r: number, b: number, W: number, H: number} | null}
 */
function drawnBox(node, graphical) {
  const svg = /** @type {SVGGraphicsElement} */ (graphical).ownerSVGElement
  if (!svg) return null
  const s = svg.getBoundingClientRect()
  const b = node.getBoundingClientRect()
  if (!(b.width > 0 && b.height > 0 && s.width > 0 && s.height > 0)) return null
  return {
    l: b.left - s.left,
    t: b.top - s.top,
    r: b.right - s.left,
    b: b.bottom - s.top,
    W: s.width,
    H: s.height,
  }
}

/**
 * Snapshot the outgoing circle (and, for the types without axes, the plot
 * rect and clips around it). Called from Series.getPreviousPaths() next to
 * captureAxisChrome, i.e. before the DOM is torn down for the incoming update.
 *
 * @param {import('../../types/internal').ChartStateW} w
 */
export function captureCircle(w) {
  const gl = w.globals
  // An update earlier in this same tick already captured what is on screen;
  // its render never got there (see pendingUntilPaint).
  if (gl.prevCircleFrame?.pending) return
  gl.prevCircleFrame = null
  const geom = gl.circleGeometry
  const graphical = w.dom.elGraphical?.node
  if (!geom || !graphical || !Environment.isBrowser()) return
  if (!graphical.contains(geom.node)) return
  try {
    const plot = captureLayout(w)
    gl.prevCircleFrame = pendingUntilPaint({
      type: w.config.chart.type,
      circle: currentCircle(w, geom),
      // As rendered, without any tween: what the previous render's own
      // pixels (a radar's polygons) were measured against.
      rendered: { cx: geom.cx, cy: geom.cy, r: geom.r },
      // Where the plot sat, which the circle is measured from.
      origin: { x: plot.rect.x, y: plot.rect.y },
      // What the circle drew, against the svg it was drawn in.
      drawn: drawnBox(geom.node, graphical),
      // An axis chart's plot rect is captured with its axis chrome.
      layout: gl.axisCharts ? null : plot,
      texts: readTexts(geom.node, graphical),
    })
  } catch (_) {
    gl.prevCircleFrame = null
  }
}

/**
 * Ease a circle the chrome moved or resized from where it was to where the
 * new render put it. Consumes the captured frame (one shot per update); a
 * no-op unless this is an animated update of a circle chart.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{layout?: boolean}} [opts] layout: false leaves the circle where it
 *   was rendered (a cross-type morph places its own start shapes)
 */
export function applyCircleTransition(w, { layout = true } = {}) {
  const gl = w.globals
  const from = gl.prevCircleFrame
  gl.prevCircleFrame = null
  const to = gl.circleGeometry
  // A circle tween from an earlier render drives a node that render owned:
  // stop it. Not one an update earlier in this tick started on this very
  // render (two updates in one tick render twice, then apply twice).
  if (gl.circleTween && gl.circleTween.node !== to?.node) gl.circleTween.finish()
  // Not pending any more: a frame was painted since it was captured, so it
  // is not what is on screen (its own update never consumed it).
  if (!from?.pending || !layout || !Environment.isBrowser()) return
  if (!lengthTransitionEnabled(w)) return
  const graphical = w.dom.elGraphical?.node
  if (!to || !graphical || !graphical.contains(to.node)) return
  if (!fitsTheChart(from, graphical)) return

  const duration = Math.max(1, w.config.chart.animations.dynamicAnimation.speed || 1)
  const ease = morphEasing(w)

  try {
    // The plot rect and clips first, as AxisTransition does for an axis chart.
    if (!gl.axisCharts && from.layout) {
      transitionLayout(w, from.layout, { driven: new Set(), duration, ease })
    }
    tweenCircle(w, {
      from: from.circle,
      texts: from.texts,
      to,
      graphical,
      duration,
      ease,
    })
  } catch (_) {
    // Chrome polish must never break a render, nor leave the circle stuck
    // part way: a tween that failed to start is landed.
    if (gl.circleTween && !gl.circleTween.done) gl.circleTween.finish()
  }
}

/**
 * Whether the old circle, where it starts, fits the chart as just resized.
 * An update that makes the chart itself smaller (a lower height, a gauge
 * whose svg hugs its arc) shrinks the svg at once; started at its old size
 * the circle would be cut off by the new edge until it had shrunk inside it.
 * Then it lands at once, with the svg, as it always did. Measured on what is
 * drawn (half a gauge is not), and against what already spilled over before
 * (a customScale above 1), so only a cut the update makes counts.
 *
 * @param {{drawn: {l: number, t: number, r: number, b: number, W: number, H: number} | null}} from
 * @param {Element} graphical
 * @returns {boolean}
 */
function fitsTheChart(from, graphical) {
  const d = from.drawn
  const svg = /** @type {SVGGraphicsElement} */ (graphical).ownerSVGElement
  if (!d || !svg) return true
  const s = svg.getBoundingClientRect()
  if (!(s.width > 0 && s.height > 0)) return true
  const TOL = 2
  const over = (/** @type {number} */ was, /** @type {number} */ now) =>
    now <= Math.max(0, was) + TOL
  return (
    over(-d.l, -d.l) &&
    over(-d.t, -d.t) &&
    over(d.r - d.W, d.r - s.width) &&
    over(d.b - d.H, d.b - s.height)
  )
}

/**
 * Drive the circle's root group from the captured circle to the rendered one,
 * and carry each text inside it from where it was to where it is.
 *
 * @param {import('../../types/internal').ChartStateW} w
 * @param {{
 *   from: Circle,
 *   texts: Map<string, TextAt>,
 *   to: {node: Element, cx: number, cy: number, r: number},
 *   graphical: Element,
 *   duration: number,
 *   ease: (t: number) => number,
 * }} opts
 */
function tweenCircle(w, { from: c0, texts, to, graphical, duration, ease }) {
  const gl = w.globals
  const node = to.node
  const c1 = { cx: to.cx, cy: to.cy, r: to.r }
  const sane = (/** @type {Circle} */ c) =>
    [c.cx, c.cy, c.r].every(Number.isFinite) && c.r > 0
  if (!sane(c0) || !sane(c1)) return
  const travel = Math.max(
    Math.abs(c0.cx - c1.cx),
    Math.abs(c0.cy - c1.cy),
    Math.abs(c0.r - c1.r),
  )
  if (travel < 0.5) return

  const lerp = (/** @type {number} */ a, /** @type {number} */ b, /** @type {number} */ e) =>
    a + (b - a) * e
  // Composed in front of the group's own transform (a radar's translate to
  // its centre), the way LayoutTransition's nudge() is.
  const base = node.getAttribute('transform')
  /** @type {Array<() => void>} */
  const finals = []
  /** @type {Array<(c: Circle, s: number, e: number) => void>} */
  const writers = []
  /**
   * @param {Element} el
   * @param {string | null} was
   */
  const restore = (el, was) => {
    if (was) el.setAttribute('transform', was)
    else el.removeAttribute('transform')
  }

  // Each text: from its old middle and scale (the screen's, so a move still
  // in flight continues), or, when the old render had no such text, from
  // where the scaled circle would draw it, fading in. Read at rest, before
  // the circle transform goes on.
  const s0 = c0.r / c1.r
  readTexts(node, graphical, (el, key) => {
    const parent = /** @type {Element | null} */ (el.parentNode)
    const M = parent ? toPlot(parent, graphical) : null
    const now = textAt(el, graphical)
    if (!M || !now) return
    const at = texts.get(key)
    const P0 = at ?? {
      x: c0.cx + s0 * (now.x - c1.cx),
      y: c0.cy + s0 * (now.y - c1.cy),
      k: now.k,
    }
    const own = el.getAttribute('transform')
    const opacity = el.getAttribute('opacity')
    const Minv = M.inverse()
    // A transform-origin applies to the whole transform list, so the matrix
    // put in front of the text's own transform is taken about it too.
    const origin = (el.getAttribute('transform-origin') || '')
      .split(/[\s,]+/)
      .map((v) => parseFloat(v))
    const [ox, oy] = origin.length === 2 && origin.every(Number.isFinite) ? origin : [0, 0]
    // Fading in: one the old render did not have, or one an earlier move
    // was still fading in.
    const fadeFrom = at ? at.o : 0
    writers.push((c, s, e) => {
      // In plot space: the text's middle at P, its size eased from the old
      // one, under the circle's scale s. That map (E) taken into the text's
      // parent space is the transform it gets.
      const P = { x: lerp(P0.x, now.x, e), y: lerp(P0.y, now.y, e) }
      const sigma = lerp(P0.k / now.k, 1, e)
      const E = new DOMMatrix([
        sigma / s,
        0,
        0,
        sigma / s,
        c1.cx + (P.x - c.cx - sigma * now.x) / s,
        c1.cy + (P.y - c.cy - sigma * now.y) / s,
      ])
      let X = Minv.multiply(E).multiply(M)
      if (ox || oy) {
        X = new DOMMatrix().translate(-ox, -oy).multiply(X).translate(ox, oy)
      }
      el.setAttribute(
        'transform',
        `matrix(${X.a}, ${X.b}, ${X.c}, ${X.d}, ${X.e}, ${X.f}) ${own || ''}`.trim(),
      )
      if (fadeFrom < 0.999) el.setAttribute('opacity', String(lerp(fadeFrom, 1, e)))
    })
    finals.push(() => {
      restore(el, own)
      if (fadeFrom < 0.999) {
        if (opacity === null) el.removeAttribute('opacity')
        else el.setAttribute('opacity', opacity)
      }
    })
  })

  // A slice pulled out (expandOnClick, a selected point) is parked a fixed
  // px off the centre: scaled with the circle, it would sit nearer or further
  // out on the first frame.
  // Selecting or deselecting it during the move (offsetSlice) takes it back.
  node.querySelectorAll('.apexcharts-pie-area[transform]').forEach((el) => {
    const own = el.getAttribute('transform') || ''
    const m = /^translate\(\s*([-+.\deE]+)[\s,]+([-+.\deE]+)\s*\)$/.exec(own.trim())
    if (!m) return
    const dx = parseFloat(m[1])
    const dy = parseFloat(m[2])
    let wrote = own
    let ours = true
    writers.push((_, s) => {
      if (!ours) return
      if (el.getAttribute('transform') !== wrote) {
        ours = false
        return
      }
      wrote = `translate(${dx / s} ${dy / s})`
      el.setAttribute('transform', wrote)
    })
    finals.push(() => {
      if (ours && el.getAttribute('transform') === wrote) el.setAttribute('transform', own)
    })
  })

  let unlisten = () => {}
  const token = {
    node,
    circle: { ...c0 },
    target: { ...c1 },
    done: false,
    finish() {
      if (token.done) return
      token.done = true
      unlisten()
      restore(node, base)
      finals.forEach((f) => f())
      if (gl.circleTween === token) gl.circleTween = null
    },
  }
  /** @param {number} e */
  const paint = (e) => {
    const c = {
      cx: lerp(c0.cx, c1.cx, e),
      cy: lerp(c0.cy, c1.cy, e),
      r: lerp(c0.r, c1.r, e),
    }
    token.circle = c
    const s = c.r / c1.r
    node.setAttribute(
      'transform',
      `translate(${c.cx}, ${c.cy}) scale(${s}) translate(${-c1.cx}, ${-c1.cy}) ${base || ''}`.trim(),
    )
    writers.forEach((fn) => fn(c, s, e))
  }

  gl.circleTween = token
  // One gesture lands this and the plot-layout tween together.
  unlisten = landOnGesture(w, () => token.finish())
  paint(0)
  const startAt = performance.now()
  /** @param {number} now */
  const step = (now) => {
    if (token.done) return
    if (
      gl.isDestroyed ||
      w.dom.elGraphical?.node !== graphical ||
      !graphical.contains(node)
    ) {
      // Replaced by a newer render: nothing left on screen to finish.
      token.done = true
      unlisten()
      if (gl.circleTween === token) gl.circleTween = null
      return
    }
    const raw = Math.max(0, Math.min(1, (now - startAt) / duration))
    if (raw < 1) {
      paint(ease(raw))
      BrowserAPIs.requestAnimationFrame(step)
    } else {
      token.finish()
    }
  }
  BrowserAPIs.requestAnimationFrame(step)
}
