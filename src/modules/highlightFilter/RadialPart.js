// @ts-check
/**
 * Highlight filter on radialBar and the gauge. A ring's part is shown one of
 * three ways: a solid arc on the same ring, from the same start, over the
 * ring faded ('arc'), the ring's band split in two lanes, the whole light
 * outside and the part solid inside ('lanes', opt-in), or a second needle
 * pointing at it, on any gauge shape, with the ring left as it is
 * ('needle'). Only the first ring gets a needle, as only it gets the
 * gauge's own; the other rings show their parts as arcs. Unset, every ring
 * gets the arc, except where the gauge draws its own needle: that one then
 * fades as the whole it points at. An arc part past its whole gets a tick
 * where the whole ends, and while a pick is active the tooltip is on.
 *
 * Radial reaches this through one dispatch, at the top of its arc pass,
 * before the centre labels and the rings are drawn. The rest hangs off that
 * renderer instance, which is built for one render only: its own arc
 * animation hands over each ring as it is drawn (and draws each part arc on
 * its ring's clock), and its centre labels state the parts.
 *
 * @module modules/highlightFilter/RadialPart
 */

import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'
import {
  PART,
  PLAIN,
  COVERED,
  finite,
  mix,
  info,
  ownOpacity,
  bindHit,
  mirrorFilter,
  insertAfter,
  addClass,
} from './util'
import { wrapCentre } from './PiePart'

const RAD = 'r:'
const NEEDLE = RAD + 'n'
const OWN = RAD + 'o'
const LINE = RAD + 'w'
const NEEDLE_KEYS = ['length', 'baseWidth', 'tipWidth', 'offsetY']
/** The whole lane's strength: light, and still clear on the default track. */
export const LANE = 0.45
const LANE_CLS = `${PART} apexcharts-radialbar-highlight-lane`

/**
 * Radial.drawArcs, once, before the centre labels and the rings.
 * @param {any} hf the HighlightFilter
 * @param {any} r the Radial renderer
 */
export function radialPass(hf, r) {
  const w = hf.w
  const hd = w.highlightData
  // An update that set tooltip.enabled is the page's own say (see _tipUser),
  // and the setting is the page's from then on. Otherwise a switch-on an
  // earlier render left (two renders in one tick: its afterRender has not
  // run yet) is put back first, and this render decides again.
  const said = hf.ctx.lastUpdateOptions?.tooltip?.enabled
  if (said != null) hf._tipUser = said
  else if (hf._tipOn) w.config.tooltip.enabled = false
  hf._tipOn = false
  if (!hd) return
  if (hf._render !== r) hf._beginRender(r, RAD)
  morphOut(hf)
  // Unset, every ring shares its track (the whole faded, the part solid in
  // front from the same start), unless the gauge draws its own needle:
  // then the part gets a needle beside it. 'lanes' is opt-in only.
  const rb = w.config.plotOptions.radialBar
  hf._ind =
    hf.cfg.radialBar?.indicator ?? (rb.shape === 'needle' ? 'needle' : 'arc')
  // A needle gauge with no value arc has no band to split (D17).
  if (
    hf._ind === 'lanes' &&
    rb.shape === 'needle' &&
    !rb.needle?.showValueArc
  ) {
    hf._ind = 'needle'
  }
  if (!hd.active && !hf._prev()?.size) return
  const tt = w.config.tooltip
  if (
    hd.active &&
    !tt.enabled &&
    hf._tipUser == null &&
    Environment.isBrowser()
  ) {
    // A pick turns the tooltip on (one "part / whole" row per ring) for the
    // render that draws it; the setting is put back once it is drawn (see
    // afterRender), so a clear returns to the chart's own.
    tt.enabled = true
    hf._tipOn = true
  }
  wrapCentre(hf, r)
  centreLanes(hf, r)
  // The gauge's own needle states the whole: faded with it.
  const dn = r.drawNeedle
  r.drawNeedle = (/** @type {any} */ o) => {
    const g = dn.call(r, o)
    ownNeedle(hf, r, g)
    return g
  }
  // The renderer's own method, called directly: the wrap is an own property.
  const ap = r.animatePaths
  r.animatePaths = (/** @type {any} */ el, /** @type {any} */ a) => {
    // Copied first: the call rewrites the last ring's end angle.
    const c = { ...a }
    ap.call(r, el, a)
    if (a.isTrack) return
    // A ring with no angle to come from lands at once (see animateArc).
    c.run = a.dur
    ring(hf, r, el, c, ap)
  }
  if (hf.ctx.morphTypeChange?.isActive() === true) {
    // A cross-type morph moves each ring in from the other chart's mark,
    // not through the arc animation: the parts come in at rest once it has,
    // so they are drawn once the rings are.
    Promise.resolve().then(() => {
      if (hf._render !== r || w.globals.isDestroyed) return
      w.dom.baseEl
        ?.querySelectorAll(
          '.apexcharts-radial-series .apexcharts-radialbar-area',
        )
        .forEach((/** @type {any} */ n) => ring(hf, r, n.instance, null, ap))
    })
  }
}

/**
 * One ring, just drawn: split it in lanes, or fade its whole and draw (or
 * retire) its part, and the needle on the first ring.
 * @param {any} hf @param {any} r
 * @param {any} el the whole (an svg element)
 * @param {any} c the ring's arc animation as the whole was handed it; null
 *   under a cross-type morph, when the ring is drawn at rest
 * @param {any} ap the renderer's own animatePaths
 */
function ring(hf, r, el, c, ap) {
  const w = hf.w
  const gl = w.globals
  const cfg = hf.cfg
  const hd = w.highlightData
  const active = hd.active
  const node = el.node
  const i = c ? c.i : Number(node.getAttribute('j'))
  const key = RAD + i
  const morph = !c
  // A render that is no data change (a mount, a resize) draws each part
  // where it rests, whatever an older render left behind; so does an update
  // sent without animation, which captured nothing.
  const mount = !gl.dataChanged || !gl.shouldAnimate
  const prevMap = hf._prev()
  const prev = mount ? undefined : prevMap?.get(key)
  const rb = w.config.plotOptions.radialBar
  const ind = hf._ind
  // The ring's paint. A gauge drawn as a needle alone has no arc to fade or
  // to share (and, during a morph from a filled shape, the ring is filled
  // until the morph lands).
  const st = node.getAttribute('stroke')
  const fl = node.getAttribute('fill')
  const paint =
    st && st !== 'transparent' ? st : morph && fl && fl !== 'none' ? fl : null
  const needle = i === 0 && (ind === 'needle' || !paint)
  const whole = w.seriesData.series[i]
  // A ring of nothing still shows its part (past its whole, as any part
  // can be); a ring hidden from the legend drains with it.
  const pv =
    active && gl.collapsedSeriesIndices.indexOf(i) < 0
      ? (hd.parts[i]?.[0] ?? null)
      : null
  const start = r.startAngle
  const wholeEnd = c ? c.endAngle : r._arcEnd(whole)
  const run = c ? c.run : 0
  const anim = Environment.isBrowser() && run > 0
  const delayMs = c ? +c.animBeginArr[i] || 0 : 0
  const fadeTo = cfg.fadeOpacity ?? 0.2
  // The ring fades only while it shows its part as an arc.
  const faded = active && !needle && !!paint
  const REST = { f: fadeTo, o: 0 }

  const size = c
    ? c.size
    : Math.hypot(
        node.getAttribute('data:cx') - gl.circleGeometry.cx,
        node.getAttribute('data:cy') - gl.circleGeometry.cy,
      )

  // A needle gauge with no value arc has no band to split (see radialPass).
  if (ind === 'lanes' && paint) {
    lanes(hf, r, el, {
      i,
      c,
      prev,
      mount,
      pv,
      whole,
      wholeEnd,
      run,
      anim,
      delayMs,
      size,
      paint,
    })
    if (i === 0) needlePart(hf, r, el, false, pv, mount, morph, c)
    return
  }

  // The arc part ends where the ring's own mapping puts its value, so a part
  // equal to its whole is drawn exactly as the whole.
  const toE = faded && pv != null ? r._arcEnd(pv) : null
  const has = toE != null && toE - start > 0.01
  const was = prev?.e ?? null
  // A part with nothing to draw now leaves: on a clear (or when the ring
  // goes over to the needle) it grows back into its whole, which comes back
  // the frame it lands; under a pick it drains to the start.
  const exit = !has && was != null && anim
  const lands = exit && !faded
  const target = has ? toE : exit ? (lands ? wholeEnd : start) : null

  let fromE = target
  let cover = false
  if (target != null && anim && !mount) {
    if (was != null) fromE = was
    else if (prev || cfg.enter === 'baseline') fromE = start
    else {
      // A first pick starts each part as its whole on screen, with the
      // whole hidden under it, so frame 0 is the chart as it was.
      cover = true
      fromE = finite(c.prevEndAngle) ? c.prevEndAngle : wholeEnd
    }
  }

  /** The ring's arc from its start to `e`, as the arc animation draws it.
   * @param {number} e */
  const arcD = (e) => {
    const span = e - start
    return r.getPiePath({
      me: r,
      startAngle: start,
      angle: span === r.fullAngle ? r.fullAngle - 0.01 : span,
      size,
    })
  }

  /** @type {any} */
  let part = null
  if (target != null && paint) {
    part = new Graphics(w).drawPath({
      d: '',
      stroke: paint,
      strokeWidth: morph
        ? r.getStrokeWidth({
            size: gl.circleGeometry.r,
            series: w.seriesData.series,
          })
        : Number(node.getAttribute('stroke-width')),
      fill: 'none',
      // The whole's own strength, taken before the whole is faded.
      strokeOpacity: ownOpacity(node, 'stroke-opacity'),
      strokeDashArray: node.getAttribute('stroke-dasharray') ?? 0,
      classes: `${PART} apexcharts-radialbar-highlight-part`,
    })
    const pn = part.node
    pn.setAttribute('aria-hidden', 'true')
    insertAfter(node, pn)
    if (has && pv > (typeof rb.max === 'number' ? rb.max : 100)) {
      // Past the gauge's end: drawn to it, the true value in the readouts.
      addClass(pn, 'apexcharts-highlight-overflow')
    }
    mirrorFilter(node, pn)
    // A part past its whole has no whole under that stretch: the part
    // itself stands in for its whole under the pointer there.
    if (has && toE - wholeEnd > 0.01) bindHit(node, pn)
    else pn.setAttribute('pointer-events', 'none')
    if (c && anim && !mount) {
      // The first frame is where the part starts.
      pn.setAttribute('d', arcD(fromE))
      ap.call(r, part, {
        ...c,
        endAngle: target,
        prevStartAngle: start,
        prevEndAngle: fromE,
        isTrack: true,
      })
    } else if (c) {
      // On the ring's clock: a mount sweeps the part with its whole.
      ap.call(r, part, { ...c, endAngle: target, dur: run, isTrack: true })
    } else {
      pn.setAttribute('d', arcD(target))
    }
  }

  // A part past its whole covers where the whole ends, so a short tick
  // across the track marks it there (the dashed edge bars and pies trace).
  // It rides the whole's end on the whole's own clock, on a runner of its
  // own, so an export lands its strength (a fade) but never its angle; it
  // fades in as the overflow starts and out as it ends.
  const k1 = has && toE - wholeEnd > 0.01 ? 0.75 : 0
  const k0 = mount ? k1 : (prev?.tk ?? 0)
  /** @type {any} */
  let tick = null
  if (part && (k1 || (k0 && anim))) {
    const sw = Number(part.node.getAttribute('stroke-width')) || 0
    const cx = c ? c.centerX : gl.circleGeometry.cx
    const cy = c ? c.centerY : gl.circleGeometry.cy
    tick = new Graphics(w).drawPath({
      d: '',
      fill: 'none',
      stroke: '#fff',
      strokeWidth: 1,
      strokeDashArray: 3,
      classes: `${PART} apexcharts-highlight-edge apexcharts-radialbar-highlight-edge`,
    })
    const tn = tick.node
    tn.setAttribute('pointer-events', 'none')
    tn.setAttribute('aria-hidden', 'true')
    tn.setAttribute('stroke-opacity', String(k0))
    insertAfter(part.node, tn)
    /** @param {number} a */
    const at = (a) => {
      const p = Utils.polarToCartesian(cx, cy, size - sw / 2, a)
      const q = Utils.polarToCartesian(cx, cy, size + sw / 2, a)
      tn.setAttribute('d', `M ${p.x} ${p.y} L ${q.x} ${q.y}`)
    }
    // Where the whole's end starts this render: its previous end on an
    // update, the start on a mount's sweep.
    const a0 = anim
      ? finite(c.prevEndAngle) && !mount
        ? c.prevEndAngle
        : start
      : wholeEnd
    at(a0)
    if (a0 !== wholeEnd) {
      tick
        .animate(run, delayMs)
        .during((/** @type {number} */ t) => at(mix(a0, wholeEnd, t)))
    }
  }

  // What the morph brings in at rest, once it has landed.
  /** @type {any[]} */
  const shows = []
  if (part && morph) shows.push(part.node)
  if (tick && morph) shows.push(tick.node)

  // What this ring draws, for the next update to start from: the part's
  // live end angle (`e`) and the whole's look.
  /** @type {any} */
  const rec = { d: null, e: null, f: faded ? fadeTo : 1, c: !active }
  if (paint && (active || prev)) {
    hf._targets.set(key, rec)
    const e0 = fromE ?? 0
    const e1 = target ?? 0
    if (part) rec.e = e1
    if (part && c && anim && !mount && e0 !== e1) {
      // The angle on a runner of the part's own, beside its arc's, so an
      // export (which lands the fade) never lands it while the arc moves on.
      // Started before the fade, so a retired part's record is cleared
      // after its last frame.
      rec.e = e0
      part
        .animate(run, delayMs)
        .during(
          (/** @type {number} */ t) =>
            rec.e != null && (rec.e = mix(e0, e1, t)),
        )
    }
    const sp = w.config.chart.animations.dynamicAnimation.speed
    hf._fade(
      node,
      mount && !morph
        ? faded
          ? REST
          : PLAIN
        : cover
          ? COVERED
          : prev
            ? { f: prev.f, o: 0 }
            : PLAIN,
      lands ? COVERED : faded ? REST : PLAIN,
      morph
        ? { delayMs: hf.ctx.morphTypeChange.getSpeed(), speed: sp }
        : { delayMs, speed: run, el },
      {
        attr: 'stroke-opacity',
        anim: morph ? Environment.isBrowser() : anim,
        force: !!part && (morph || e0 !== e1 || k0 !== k1),
        also: (/** @type {number} */ t) => {
          if (tick) {
            rec.tk = mix(k0, k1, t)
            tick.node.setAttribute('stroke-opacity', String(rec.tk))
          }
          shows.forEach((s) =>
            t < 1 ? s.setAttribute('opacity', t) : s.removeAttribute('opacity'),
          )
        },
        land: lands ? PLAIN : undefined,
        // A retired part leaves on the frame its whole lands, and a tick
        // once it has faded.
        done:
          exit || (tick && !k1)
            ? () => {
                if (exit) {
                  part?.remove()
                  rec.e = null
                }
                tick?.remove()
                rec.tk = 0
              }
            : undefined,
        rec,
      },
    )
    if (part) rec.n = part.node
  }

  if (i === 0) needlePart(hf, r, el, needle, pv, mount, morph, c)
}

/**
 * One ring in lanes: while a pick is active its band splits radially in two,
 * with a small gap, each lane on a track of its own (the ring's track
 * narrowed to the outer lane, and a copy of it under the inner one). The
 * outer lane is the whole, light; the inner lane is the part, solid; both
 * on the dial's own angles. The ring stays where it is, unseen, as the
 * pointer's target over the whole band (the gap too), and comes back the
 * frame its lanes merge into it again.
 *
 * A first pick starts from the screen: the whole's lane is the ring, and as
 * it narrows outward and lightens, the part's lane comes out of the band's
 * inner edge and sweeps from the whole's end to its value, on the ring's
 * clock. A re-pick moves the lanes from where they are, a clear runs the
 * split backwards, and a ring hidden from the legend merges as it drains.
 * The shapes ride a runner of the whole lane's own, so an export lands the
 * lane's strength (a fade) but never a shape.
 * @param {any} hf @param {any} r @param {any} el the ring's whole
 * @param {any} o what ring() worked out for it
 */
function lanes(hf, r, el, o) {
  const { i, c, prev, mount, pv, whole, wholeEnd, run, anim, delayMs, size } = o
  const w = hf.w
  const gl = w.globals
  const cfg = hf.cfg
  const rb = w.config.plotOptions.radialBar
  const active = w.highlightData.active
  const node = el.node
  const morph = !c
  const start = r.startAngle
  // A ring hidden from the legend has no part: it merges as it drains.
  const s1 = active && gl.collapsedSeriesIndices.indexOf(i) < 0 ? 1 : 0
  const go = morph ? Environment.isBrowser() && !!s1 : anim && !mount
  const sweep = !morph && anim && mount
  const s0 = morph ? 0 : go ? (prev?.s ?? 0) : s1
  const clock = morph
    ? {
        delayMs: hf.ctx.morphTypeChange.getSpeed(),
        speed: w.config.chart.animations.dynamicAnimation.speed,
      }
    : { delayMs, speed: run }
  if (i === 0) lineClock(hf, go ? { ...clock, el } : null)
  if (!s1 && !s0) return

  const toE = pv != null ? r._arcEnd(pv) : start
  const we1 = wholeEnd
  // Leaving, the part sweeps back into the whole's end as its lane closes.
  const e1 = s1 ? toE : we1
  let we0 = we1
  let e0 = e1
  if (morph) e0 = cfg.enter === 'baseline' ? start : we1
  else if (go) {
    we0 = prev?.we ?? (finite(c.prevEndAngle) ? c.prevEndAngle : we1)
    e0 = prev?.e ?? (cfg.enter === 'baseline' ? start : we0)
  } else if (sweep) we0 = e0 = start
  const f1 = s1 ? (cfg.radialBar?.lanes?.opacity ?? LANE) : 1
  const f0 = morph ? 1 : go ? (prev ? prev.f : 1) : f1

  const sw = morph
    ? r.getStrokeWidth({
        size: gl.circleGeometry.r,
        series: w.seriesData.series,
      })
    : Number(node.getAttribute('stroke-width'))
  const own = node.getAttribute('stroke-opacity')
  /** @param {string} cls */
  const lane = (cls) => {
    const p = new Graphics(w).drawPath({
      d: '',
      stroke: o.paint,
      strokeWidth: sw,
      fill: 'none',
      // The whole's own strength, taken before the whole is hidden.
      strokeOpacity: ownOpacity(node, 'stroke-opacity'),
      strokeDashArray: node.getAttribute('stroke-dasharray') ?? 0,
      classes: `${LANE_CLS} ${cls}`,
    })
    p.node.setAttribute('aria-hidden', 'true')
    mirrorFilter(node, p.node)
    return p
  }
  const wl = lane('apexcharts-radialbar-highlight-whole')
  const pl = lane('apexcharts-radialbar-highlight-part')
  insertAfter(node, wl.node)
  insertAfter(wl.node, pl.node)
  // The ring under the lanes takes the pointer, gap included; a part past
  // its whole has no ring under that stretch, so it stands in for it there.
  wl.node.setAttribute('pointer-events', 'none')
  if (s1 && toE - we1 > 0.01) bindHit(node, pl.node)
  else pl.node.setAttribute('pointer-events', 'none')
  if (
    pv != null &&
    (pv > (whole ?? 0) || pv > (typeof rb.max === 'number' ? rb.max : 100))
  ) {
    // No tick here (the lanes never overlap): the class marks it.
    addClass(pl.node, 'apexcharts-highlight-overflow')
  }

  // The ring's own track becomes the outer lane's; the inner lane's is a
  // copy of it. Tracks are laid out outermost first, as the rings are drawn.
  const n = w.seriesData.series.length
  const tn = tracksOf(r)[rb.inverseOrder ? n - 1 - i : i]
  const t0 = tn && [tn.getAttribute('d'), tn.getAttribute('stroke-width')]
  const pct = t0 ? (parseFloat(t0[1]) || 0) / (sw || 1) : 0
  /** @type {any} */
  let it = null
  if (tn) {
    it = new Graphics(w).drawPath({
      d: '',
      stroke: tn.getAttribute('stroke'),
      strokeWidth: 0,
      fill: 'none',
      strokeOpacity: tn.getAttribute('stroke-opacity') ?? 1,
      classes: `${PART} apexcharts-radialbar-highlight-track`,
    })
    const tf = tn.getAttribute('filter')
    if (tf) it.node.setAttribute('filter', tf)
    it.node.setAttribute('pointer-events', 'none')
    it.node.setAttribute('aria-hidden', 'true')
    insertAfter(tn, it.node)
  }

  const R0 = size - sw / 2
  const R1 = size + sw / 2
  // A small gap inside the pair; between rings the margin stays the wider,
  // so pairs read as pairs (an inset makes room where the margin is thin).
  const one = n < 2
  const gap = one
    ? Math.max(2, sw * 0.12)
    : Math.max(1, Math.min(sw * 0.08, r.margin / 3))
  const inset = one ? 0 : Math.max(0, (3 * gap - r.margin) / 2)
  const lw = Math.max(0.5, (sw - gap) / 2 - inset)
  /** @param {number} e @param {number} R */
  const arcAt = (e, R) => {
    const span = e - start
    return span > 0.01
      ? r.getPiePath({
          me: r,
          startAngle: start,
          angle: span === r.fullAngle ? r.fullAngle - 0.01 : span,
          size: R,
        })
      : ''
  }
  /** The track's arc at radius R, as drawTracks lays it out.
   * @param {number} R */
  const trackAt = (R) => {
    const ts = r.trackStartAngle
    let te = r.trackEndAngle
    if (Math.abs(te) + Math.abs(ts) >= 360) {
      te = 360 - Math.abs(r.startAngle) - 0.1
    }
    const span = te < ts ? r.fullAngle + te - ts : te - ts
    return r.getPiePath({
      me: r,
      startAngle: ts,
      angle: span === r.fullAngle ? span - 0.01 : span,
      size: R,
    })
  }
  /** @param {any} m @param {string} d @param {number} width */
  const put = (m, d, width) => {
    m.setAttribute('d', d)
    m.setAttribute('stroke-width', String(width))
  }

  /** What this ring draws, for the next update to start from: the split
   * (`s`), each lane's live end angle, and the whole lane's strength. */
  /** @type {any} */
  const rec = {
    d: null,
    c: !active,
    f: f1,
    cx: c ? c.centerX : gl.circleGeometry.cx,
    cy: c ? c.centerY : gl.circleGeometry.cy,
  }
  hf._targets.set(RAD + i, rec)
  /** @param {number} s @param {number} we @param {number} e */
  const draw = (s, we, e) => {
    rec.s = s
    rec.we = we
    rec.e = e
    // Outer lane from the band's inner edge out, inner lane from nothing at
    // the inner edge: the two never overlap.
    const wo = R1 - inset * s
    const wi = R0 + s * (R1 - inset - lw - R0)
    const pi = R0 + inset * s
    const po = pi + s * lw
    rec.mid = (wi + po) / 2
    put(wl.node, arcAt(we, (wi + wo) / 2), wo - wi)
    put(pl.node, po > pi ? arcAt(e, (pi + po) / 2) : '', po - pi)
    if (!tn) return
    if (s) {
      put(tn, trackAt((wi + wo) / 2), (wo - wi) * pct)
      put(it.node, trackAt((pi + po) / 2), (po - pi) * pct)
    } else {
      put(tn, t0[0], t0[1])
      put(it.node, '', 0)
    }
  }
  const els = [wl.node, pl.node, it?.node].filter(Boolean)
  // Under a cross-type morph the ring moves in whole; the lanes split out
  // of it once it has landed.
  let shown = !morph
  const show = () => {
    shown = true
    node.setAttribute('stroke-opacity', '0')
    els.forEach((m) => m.removeAttribute('opacity'))
  }
  if (shown) show()
  else els.forEach((m) => m.setAttribute('opacity', '0'))
  draw(s0, we0, e0)
  let gone = false
  if (go || sweep) {
    // Started before the fade, so a retired ring's record is cleared after
    // its last frame.
    wl.animate(clock.speed, clock.delayMs).during((/** @type {number} */ t) => {
      if (gone) return
      if (!shown) show()
      draw(mix(s0, s1, t), mix(we0, we1, t), mix(e0, e1, t))
    })
  }
  hf._fade(
    wl.node,
    { f: f0, o: 0 },
    { f: f1, o: 0 },
    { ...clock, el: wl },
    {
      attr: 'stroke-opacity',
      anim: go,
      force: go,
      // Merged back: the ring comes back the frame its lanes leave.
      done: s1
        ? undefined
        : () => {
            gone = true
            els.forEach((m) => m.remove())
            if (tn) put(tn, t0[0], t0[1])
            if (own == null) node.removeAttribute('stroke-opacity')
            else node.setAttribute('stroke-opacity', own)
            rec.s = 0
          },
      rec,
    },
  )

  if (Environment.isBrowser()) {
    // Which lane the pointer is on, for the tooltip: by its distance from
    // the centre, split in the middle of the gap, so crossing it is staying
    // on the ring. Forwarded events carry the pointer's position too.
    const at = (/** @type {any} */ e) => {
      hf._lane = [i, laneAt(node, e, rec)]
    }
    ;['mouseover', 'mousemove', 'mousedown', 'touchstart', 'touchmove'].forEach(
      (t) => node.addEventListener(t, at, true),
    )
  }
}

/**
 * The lane under a pointer event on a ring: 'whole' outside the middle of
 * the gap, 'part' inside it (and wherever the ring is not split).
 * @param {any} node the ring's whole @param {any} e
 * @param {any} rec the ring's record (centre, live split and gap middle)
 * @returns {'part' | 'whole'}
 */
function laneAt(node, e, rec) {
  const p = e.touches?.[0] || e
  const m = node.getScreenCTM?.()
  if (!m || !(rec.s > 0)) return 'part'
  const x = p.clientX - m.e
  const y = p.clientY - m.f
  const det = m.a * m.d - m.b * m.c || 1
  const ux = (m.d * x - m.c * y) / det
  const uy = (m.a * y - m.b * x) / det
  return Math.hypot(ux - rec.cx, uy - rec.cy) > rec.mid ? 'whole' : 'part'
}

/**
 * A cross-type morph out of a dial under a pick starts from the screen. The
 * morph carries one mark per ring, captured as its band; where the pick has
 * the ring (lanes or arc) that mark is the ring's part as drawn, solid, and
 * comes out of nothing where no part shows. The rest of what the pick drew
 * (the whole's lane or the faded ring, a tick, the needle) is the morph's
 * ghost: a copy laid over the incoming chart that fades as the morph's own
 * ghosts do. Installed once per chart, on its morph module.
 * @param {any} hf
 */
function morphOut(hf) {
  const mt = hf.ctx.morphTypeChange
  if (!mt || mt._hfOut) return
  mt._hfOut = true
  const cb = mt.captureBeforeDestroy
  mt.captureBeforeDestroy = (/** @type {any} */ a) => {
    const plan = outPlan(hf, a?.fromType)
    if (!plan) return cb.call(mt, a)
    const cf = mt._captureFromDOM
    mt._captureFromDOM = (/** @type {string} */ t) => {
      const got = cf.call(mt, t)
      got.marks.forEach((/** @type {any} */ m) => {
        m.d = plan.marks.get(m.realIndex) ?? m.d
      })
      return got
    }
    let ok
    try {
      ok = cb.call(mt, a)
    } finally {
      mt._captureFromDOM = cf
    }
    const snap = mt._snapshot
    // Not where the morph cuts the marks in pieces or keeps a ghost of its
    // own (a unit chart, either way).
    if (ok && snap && !mt._ghost && !snap.pieceOut && !snap.pieceIn) {
      mt._ghost = plan.ghost()
    }
    return ok
  }
}

/**
 * What a morph out of this dial starts from (see morphOut), or null when
 * nothing of the pick is on screen.
 * @param {any} hf @param {string} from the outgoing type
 */
function outPlan(hf, from) {
  const w = hf.w
  const gl = w.globals
  const root = w.dom.baseEl?.querySelector('.apexcharts-radialbar')
  if ((from !== 'radialBar' && from !== 'gauge') || !root) return null
  const mt = hf.ctx.morphTypeChange
  const cx = gl.circleGeometry?.cx ?? 0
  const cy = gl.circleGeometry?.cy ?? 0
  /** @type {Map<number, string>} */
  const marks = new Map()
  /** @type {Set<any>} */
  const keep = new Set()
  /** @type {Set<any>} */
  const out = new Set()
  root
    .querySelectorAll('.apexcharts-radial-series .apexcharts-radialbar-area')
    .forEach((/** @type {any} */ n) => {
      const g = n.parentNode
      const i = +g.getAttribute('data:realIndex')
      // What it draws, or, once the update has captured it, what it drew.
      const key = RAD + n.getAttribute('j')
      const rec = hf._targets.get(key) ?? hf._prev()?.get(key)
      const part = g.querySelector('.apexcharts-radialbar-highlight-part')
      // A ring the pick has: split, or faded under its arc.
      if (!part && !(rec?.s > 0) && !((rec?.lf ?? rec?.f ?? 1) < 1)) return
      keep.add(n)
      const pd = part?.getAttribute('d')
      const sw = +part?.getAttribute('stroke-width')
      let d = null
      if (pd && sw > 0 && part.getAttribute('opacity') !== '0') {
        d = mt._radialArcToFilledSegment(pd, sw, cx, cy) || pd
        out.add(part)
      } else {
        // No part on screen: from nothing, where the ring starts (a point:
        // an arc that ends where it starts would be taken as a full turn).
        const m = /M\s*(-?[\d.e]+)\s+(-?[\d.e]+)/.exec(
          n.getAttribute('d') || '',
        )
        if (m) d = `M ${m[1]} ${m[2]} L ${m[1]} ${m[2]} Z`
      }
      if (d) marks.set(i, d)
    })
  const parts = [...root.getElementsByClassName(PART)]
  if (!marks.size && !parts.length) return null
  // The tracks go at once, as in any morph out of a dial: copied over the
  // incoming marks, they would cover them.
  parts.forEach(
    (m) => out.has(m) || m.closest('.apexcharts-tracks') || keep.add(m),
  )
  return {
    marks,
    // A copy of the paper with only what leaves, its paint references kept
    // (renamed, so the live chart never resolves against the copy).
    ghost: () => {
      const KEEP = 'data-hf-ghost'
      keep.forEach((m) => m.setAttribute(KEEP, ''))
      const clone = w.dom.Paper.node.cloneNode(true)
      keep.forEach((m) => m.removeAttribute(KEEP))
      const kept = new Set(clone.querySelectorAll(`[${KEEP}]`))
      /** @type {Set<any>} */
      const up = new Set()
      kept.forEach((m) => {
        m.removeAttribute(KEEP)
        for (let p = m.parentNode; p && p !== clone; p = p.parentNode) up.add(p)
      })
      /** @param {any} el */
      const prune = (el) =>
        [...el.children].forEach((m) => {
          if (kept.has(m)) return
          if (up.has(m)) prune(m)
          else if (m.tagName.toLowerCase() !== 'defs') m.remove()
        })
      prune(clone)
      clone.removeAttribute('id')
      ;[clone, ...clone.querySelectorAll('*')].forEach((m) => {
        if (m.id) m.id += '-hf'
        ;[...m.attributes].forEach((/** @type {any} */ at) => {
          if (at.value.includes('url(#')) {
            m.setAttribute(
              at.name,
              at.value.replace(/url\(#([^)]+)\)/g, 'url(#$1-hf)'),
            )
          }
        })
      })
      return clone
    },
  }
}

/**
 * This render's ring tracks (paths, outermost first). They are drawn before
 * the arc pass, into a group not yet in the chart: found among the paper's
 * own children, newest first, by a childNodes walk (the server shim answers
 * no selectors).
 * @param {any} r
 * @returns {any[]}
 */
function tracksOf(r) {
  if (r._hfTracks) return r._hfTracks
  /** @param {any} m @param {string} cls */
  const is = (m, cls) => ` ${m.getAttribute?.('class')} `.includes(` ${cls} `)
  const kids = [...(r.w.dom.Paper?.node?.childNodes || [])]
  /** @type {any[]} */
  let found = []
  for (let k = kids.length - 1; k >= 0 && !found.length; k--) {
    const t = [...(kids[k].childNodes || [])].find((m) =>
      is(m, 'apexcharts-tracks'),
    )
    if (t) {
      found = [...t.childNodes].map((g) =>
        [...g.childNodes].find((m) => is(m, 'apexcharts-radialbar-area')),
      )
    }
  }
  return (r._hfTracks = found)
}

/**
 * Lanes only: under the centre's value, which states the part, a second,
 * smaller muted line states the whole ("/ 78", through the value formatter,
 * or the total's with several rings). A formatter that reads `opts.lane`
 * ('whole') writes that line itself. It comes in and leaves with the pick,
 * on the first ring's clock. Every centre pass (the render, a hover, the
 * revert on leaving) goes through the instance.
 * @param {any} hf @param {any} r
 */
function centreLanes(hf, r) {
  const ri = r.renderInnerDataLabels
  const pi = r.printInnerLabels
  r.renderInnerDataLabels = (
    /** @type {any} */ g,
    /** @type {any} */ c,
    /** @type {any} */ o,
  ) => {
    // A server render finds no labels group by selector: the renderer's own.
    const out = ri(g || r.dataLabelsGroup, c, o)
    wholeLine(hf, r, c, -1, out)
    return out
  }
  r.printInnerLabels = (
    /** @type {any} */ c,
    /** @type {string} */ name,
    /** @type {any} */ val,
    /** @type {any} */ el,
  ) => {
    pi(c, name, val, el)
    wholeLine(hf, r, c, el ? +el.parentNode.getAttribute('rel') - 1 : -1)
  }
}

/**
 * The centre's whole line, as of this centre pass: decided once a render
 * (shown, coming in, leaving or none), redrawn by each pass after it.
 * @param {any} hf @param {any} r @param {any} c the centre labels' config
 * @param {number} i the ring shown (-1: the render's own reading)
 * @param {any} [group] the labels group, when the pass rebuilt it
 */
function wholeLine(hf, r, c, i, group) {
  const w = hf.w
  const gl = w.globals
  if (hf._ind !== 'lanes') return
  const active = w.highlightData.active
  let st = r._hfLine
  if (!st) {
    const mount = !gl.dataChanged || !gl.shouldAnimate
    const prev = mount ? undefined : hf._prev()?.get(LINE)
    const now = active ? wholeText(hf, c, -1) : ''
    const o1 = now ? 1 : 0
    // A first pick brings it in; a clear (or a part gone) takes it out with
    // the lanes, saying what it said.
    const o0 = mount || !Environment.isBrowser() ? o1 : (prev?.f ?? 0)
    st = r._hfLine = { node: null, rec: null }
    if (!o1 && !o0) return
    st.rec = {
      d: null,
      c: !active,
      t: now || prev?.t || '',
      f: o1,
      lf: o0,
      o0,
      // The value it stood under, to hold while it leaves (see below).
      pv: o1 ? null : prev?.vt,
    }
    hf._targets.set(LINE, st.rec)
  }
  const rec = st.rec
  if (group) {
    // The pass rebuilt the labels: the line goes with them.
    st.node = null
    if (!rec || (!rec.lf && rec.done)) return
    const kids = group.node.childNodes
    // The value is the last label a centre pass draws.
    const v = c.value.show ? kids[kids.length - 1] : null
    if (!v) return
    if (rec.pv != null && !rec.done) {
      // A line leaving holds the value at the reading it states the whole
      // of, so the pair never reads as a part equal to its whole; the value
      // takes its own reading the frame the line has gone.
      rec.hold = v.textContent
      v.textContent = rec.pv
    }
    rec.vt = v.textContent
    const now = active ? wholeText(hf, c, -1) : ''
    // The pass's own reading (a revert after a hover reads the total).
    const t = drawLine(w, c, v, now || rec.t)
    group.add(t)
    st.node = t.node
  } else if (active) {
    // A hovered ring states its own part; the line its own whole, drawn
    // for the hover when the centre had none (several rings, no total).
    const t = wholeText(hf, c, i)
    const v = w.dom.baseEl?.querySelector('.apexcharts-datalabel-value')
    if (!st.node && t && i > -1 && v) {
      st.node = drawLine(w, c, v, t).node
      v.parentNode.appendChild(st.node)
    }
    if (st.node) st.node.textContent = t
    if (rec && v) rec.vt = v.textContent
  }
  lineLook(st)
}

/**
 * The whole line under the centre's value `v`: half its size (at least 11px),
 * clear of its descenders, muted.
 * @param {any} w @param {any} c the centre labels' config
 * @param {any} v the value's text @param {string} text
 * @returns {any} the text, not yet in a group
 */
function drawLine(w, c, v, text) {
  const fv = parseFloat(c.value.fontSize) || 14
  const fw = Math.max(11, Math.round(fv / 2))
  const t = new Graphics(w).drawText({
    x: +v.getAttribute('x'),
    // Clear of the value's descenders, at the default sizes too.
    y: +v.getAttribute('y') + fv / 4 + 4 + fw * 0.8,
    text,
    textAnchor: 'middle',
    fontSize: fw + 'px',
    fontFamily: c.value.fontFamily,
    fontWeight: 400,
    foreColor: v.getAttribute('fill'),
    cssClass: 'apexcharts-datalabel-whole',
  })
  t.node.setAttribute('aria-hidden', 'true')
  return t
}

/**
 * The line's strength, on its fill: a circle moving (CircleTransition) owns
 * every centre text's `opacity`, and puts back the one it found when it
 * lands.
 * @param {any} st the render's whole line
 */
function lineLook(st) {
  st.node?.setAttribute('fill-opacity', String(0.6 * (st.rec?.lf ?? 1)))
}

/**
 * The whole line moves on the first ring's clock: in with the lanes on a
 * pick, out with them on a clear (removed once it has faded). An export
 * lands it, as every fade.
 * @param {any} hf
 * @param {{delayMs: number, speed: number, el: any} | null} clock
 */
function lineClock(hf, clock) {
  const st = hf._render?._hfLine
  const rec = st?.rec
  if (!rec || rec.run || rec.lf === rec.f) return
  const o0 = rec.lf
  const done = () => {
    rec.run = false
    if (rec.f) return
    rec.done = true
    const v = st.node?.previousSibling
    if (rec.hold != null && v && v.textContent === rec.pv) {
      v.textContent = rec.vt = rec.hold
    }
    st.node?.remove()
    st.node = null
  }
  if (!clock) {
    rec.lf = rec.f
    lineLook(st)
    done()
    return
  }
  rec.run = true
  hf._tween(
    clock.delayMs,
    clock.speed,
    (/** @type {number} */ t) => {
      rec.lf = mix(o0, rec.f, t)
      lineLook(st)
    },
    done,
    undefined,
    clock.el,
  )
}

/**
 * The whole as the centre's second line states it: through the value's
 * formatter for one ring (or the total's for several), told the highlight
 * and, so it can write the line itself, `lane: 'whole'`. A formatter that
 * gives the same either way gets "/ " before it, the tooltip's notation.
 * '' when the centre does not state a part, or there is none: a ring with
 * no part has its value state its whole alone, as the tooltip does.
 * @param {any} hf @param {any} c @param {number} i the ring (-1: the centre's
 *   own reading)
 */
function wholeText(hf, c, i) {
  const w = hf.w
  const dl = hf.cfg.dataLabels || {}
  const vals = w.seriesData.series
  const parts = w.highlightData.parts.map((/** @type {any[]} */ p) => p[0])
  const k = i > -1 ? i : vals.length < 2 ? 0 : -1
  /** @param {(o: any) => any} fn @param {any} h */
  const say = (fn, h) => {
    const plain = String(fn(h))
    const own = String(fn({ ...h, lane: 'whole' }))
    return own !== plain ? own : '/ ' + plain
  }
  if (k > -1) {
    if ((dl.value ?? 'part') !== 'part' || !finite(parts[k])) return ''
    return say((h) => c.value.formatter(vals[k], w, h), {
      highlight: info(parts[k], vals[k]),
    })
  }
  if (
    !c.total.show ||
    (dl.total ?? 'part') !== 'part' ||
    !c.total.formatter ||
    !parts.some(finite)
  ) {
    return ''
  }
  /** @param {any[]} a */
  const sum = (a) => a.reduce((t, v) => t + (finite(v) ? v : 0), 0)
  return say((h) => c.total.formatter(w, h), {
    highlight: info(sum(parts), sum(vals)),
  })
}

/**
 * The first ring's needle at its part: the gauge's own needle's shape, in
 * the series colour unless styled, rotated on the gauge's needle clock (the
 * needle shape) or on the first ring's arc clock. It fades in where the
 * gauge pointed on a pick and out where it points on a clear, so the first
 * and last frames are the plain gauge.
 * @param {any} hf @param {any} r @param {any} el the first ring's whole
 * @param {boolean} needle whether the first ring shows its part this way
 * @param {number | null} pv its part
 * @param {boolean} mount @param {boolean} morph
 * @param {any} c the first ring's arc animation, null under a morph
 */
function needlePart(hf, r, el, needle, pv, mount, morph, c) {
  const w = hf.w
  const gl = w.globals
  const cfg = hf.cfg
  const active = w.highlightData.active
  const prev = mount ? undefined : hf._prev()?.get(NEEDLE)
  const toA = needle && pv != null ? r._angleAtValue(pv) : null
  if (toA == null && !prev) return

  // The gauge's needle shape moves on the gauge needle's own clock and
  // curve; on an arc the needle rides the first ring's arc.
  const rb = w.config.plotOptions.radialBar
  const motion = morph
    ? null
    : rb.shape === 'needle'
      ? r.needleMotion()
      : c && c.run > 0 && Environment.isBrowser()
        ? { speed: c.run, delay: +c.animBeginArr[0] || 0 }
        : null

  /** @type {number} */
  let a0
  let o0 = 1
  let a1 = /** @type {number} */ (toA)
  let o1 = 1
  const leave = toA == null
  if (leave) {
    if (!motion) return
    // Under a pick it drains to the start; on a clear (or when the ring
    // goes over to an arc) it goes where the gauge points, and fades.
    a0 = prev.ang
    o0 = prev.op
    a1 =
      active && needle ? r.startAngle : r._angleAtValue(w.seriesData.series[0])
    o1 = 0
  } else if (!motion) {
    a0 = a1
  } else if (mount) {
    // A mount sweeps it from the start, as the gauge's own needle.
    a0 = r.startAngle
  } else if (prev) {
    a0 = prev.ang
    o0 = prev.op
  } else {
    // A first pick: from where the gauge pointed, unseen.
    a0 = r._angleAtValue(
      gl.dataChanged ? gl.previousPaths[0] : w.seriesData.series[0],
    )
    o0 = 0
  }

  const cg = gl.circleGeometry
  const own = cfg.radialBar?.needle || {}
  const base = rb.needle || {}
  /** @type {Record<string, any>} */
  const ncfg = {}
  NEEDLE_KEYS.forEach((k) => (ncfg[k] = own[k] ?? base[k]))
  const color = own.color ?? gl.colors[0]
  const { path, cx, cy } = r.needlePath(
    {
      size: cg.r,
      centerX: cg.cx,
      centerY: cg.cy,
      series: w.seriesData.series,
    },
    ncfg,
  )
  const graphics = new Graphics(w)
  const g = graphics.group({ class: 'apexcharts-gauge-needle-highlight' })
  // The pointer on it is on the first ring (its tooltip, its centre); a
  // needle on its way out takes no pointer.
  if (leave || !Environment.isBrowser()) {
    g.node.setAttribute('pointer-events', 'none')
  } else bindHit(el.node, g.node)
  g.node.setAttribute('aria-hidden', 'true')
  g.node.setAttribute('transform-origin', `${cx} ${cy}`)
  g.add(
    graphics.drawPath({
      d: path,
      stroke: color,
      strokeWidth: 0,
      fill: color,
      classes: `${PART} apexcharts-gauge-needle-highlight-shape`,
    }),
  )
  if (pv != null && pv > (typeof rb.max === 'number' ? rb.max : 100)) {
    // Past the gauge's end: pinned to it, the true value in the readouts.
    addClass(g.node, 'apexcharts-highlight-overflow')
  }
  // Over the hollow (which may be filled) and under the centre labels: right
  // after the hollow, which a hollow in front only joins once the rings are
  // drawn, so the needle waits under everything until then. Walked by
  // childNodes: the server shim answers no selectors.
  const arcs = el.node.parentNode.parentNode
  arcs.insertBefore(g.node, arcs.childNodes[0] || null)
  const place = () => {
    const k = [...arcs.childNodes].filter((c) => c !== g.node)
    const h = k.findIndex((/** @type {any} */ c) =>
      ` ${c.getAttribute?.('class')} `.includes(
        ' apexcharts-radialbar-hollow ',
      ),
    )
    if (h < 0 || g.node.parentNode !== arcs) return false
    arcs.insertBefore(g.node, k[h + 1] || null)
    return true
  }
  if (!place()) Promise.resolve().then(place)

  /** @type {any} */
  const rec = { d: null, ang: a0, op: o0, c: !active }
  hf._targets.set(NEEDLE, rec)
  /** @param {number} a @param {number} o */
  const set = (a, o) => {
    rec.ang = a
    rec.op = o
    g.node.setAttribute('transform', `rotate(${a})`)
    if (o < 1) g.node.setAttribute('opacity', String(o))
    else g.node.removeAttribute('opacity')
  }
  // The angle follows the curve past its end (the mount's spring), the
  // strength stops at its end.
  /** @param {number} t */
  const frame = (t) => set(a0 + (a1 - a0) * t, mix(o0, o1, t))
  const land = () => {
    rec.run = false
    if (leave) g.remove()
    else set(a1, o1)
  }
  if (morph) {
    // Drawn at rest; it comes in once the morph has landed.
    set(a1, 0)
    hf._tween(
      hf.ctx.morphTypeChange.getSpeed(),
      w.config.chart.animations.dynamicAnimation.speed,
      (/** @type {number} */ t) => set(a1, t),
      land,
    )
    return
  }
  if (!motion || (a0 === a1 && o0 === o1)) {
    frame(1)
    land()
    return
  }
  rec.run = true
  frame(0)
  // A clock of the needle's own, which an export does not land (the gauge's
  // own needle and arcs are not landed either).
  const m = /** @type {any} */ (motion)
  if (m.ease) {
    // The needle shape: the gauge needle's own frames, timed from this
    // render as its swing is (a runner would start a frame later when the
    // render runs inside a timer).
    const at = performance.now()
    /** @param {number} now */
    const step = (now) => {
      if (gl.isDestroyed || hf._render !== r) return
      const t = Math.max(0, Math.min(1, (now - at) / m.speed))
      frame(m.ease(t))
      if (t < 1) BrowserAPIs.requestAnimationFrame(step)
      else land()
    }
    BrowserAPIs.requestAnimationFrame(step)
  } else {
    // On an arc, a runner on the first ring's arc clock.
    g.animate(m.speed, m.delay || 0)
      .during((/** @type {number} */ t) => frame(t))
      .after(land)
  }
}

/**
 * The gauge's own needle (the needle shape) points at the whole, so while a
 * pick is active it takes the whole's look, faded, and the part's needle
 * stays solid. The strength moves on that needle's own clock and curve (an
 * export lands it, as every fade), and comes back on a clear. The pointer on
 * it is on the first ring, as on the part's needle.
 * @param {any} hf @param {any} r @param {any} g the needle's group
 */
function ownNeedle(hf, r, g) {
  const w = hf.w
  const gl = w.globals
  const active = w.highlightData.active
  const mount = !gl.dataChanged || !gl.shouldAnimate
  const prev = mount ? undefined : hf._prev()?.get(OWN)
  if (!active && !prev) return
  const f1 = active ? (hf.cfg.fadeOpacity ?? 0.2) : 1
  // A first pick fades it from the plain needle on screen.
  const f0 = mount ? f1 : prev ? prev.f : 1
  /** @type {any} */
  const rec = { d: null, f: f1, c: !active }
  hf._targets.set(OWN, rec)
  /** @param {number} f */
  const set = (f) => {
    rec.lf = f
    if (f < 1) g.node.setAttribute('opacity', String(f))
    else g.node.removeAttribute('opacity')
  }
  // Under a cross-type morph it gives way once the morph has landed, as the
  // part's needle comes in.
  const mt = hf.ctx.morphTypeChange
  const m = mt?.isActive()
    ? {
        delay: mt.getSpeed(),
        speed: w.config.chart.animations.dynamicAnimation.speed,
      }
    : r.needleMotion()
  if (m && f0 !== f1) {
    rec.run = true
    hf._tween(
      m.delay || 0,
      m.speed,
      (/** @type {number} */ t) => set(mix(f0, f1, t)),
      () => (rec.run = false),
      m.ease,
    )
  } else set(f1)
  if (active && Environment.isBrowser()) {
    // The first ring is drawn by now, though not yet on the page. The hollow
    // in front of the needle passes the pointer through to it (it has none
    // of its own to take).
    Promise.resolve().then(() => {
      const el = w.dom.baseEl
      const whole = el?.querySelector('.apexcharts-radialbar-slice-0')
      if (!whole || !g.node.isConnected) return
      bindHit(whole, g.node)
      el.querySelector('.apexcharts-radialbar-hollow')?.setAttribute(
        'pointer-events',
        'none',
      )
    })
  }
}
