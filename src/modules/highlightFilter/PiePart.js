// @ts-check
/**
 * Highlight filter on pie, donut and polarArea. Each slice keeps its angle,
 * faded; its part is the same wedge cut to the part's share of the radius,
 * solid in front, from the centre (pie, polarArea) or from the hole (donut).
 *
 * Pie reaches this through one dispatch, before it sizes anything. The rest
 * hangs off that renderer instance, which is built for one render only: its
 * own arc animation draws each part on its whole's clock, and its own slice
 * movers, hover band and centre labels take the parts in.
 *
 * @module modules/highlightFilter/PiePart
 */

import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment'
import {
  PART,
  PLAIN,
  COVERED,
  look,
  finite,
  mix,
  info,
  drawnAt,
  bindHit,
  mirrorFilter,
  ownOpacity,
  solid,
} from './util'

const PIE = 'p:'
export const CIRCLE = ['pie', 'donut', 'polarArea']

/**
 * Pie.draw, once, before the value scale, the angles and the sizes are
 * worked out.
 * @param {any} hf the HighlightFilter
 * @param {any} p the Pie renderer
 */
export function piePass(hf, p) {
  const w = hf.w
  const hd = w.highlightData
  if (!hd) return
  if (hf._render !== p) hf._beginRender(p, PIE)
  if (!hd.active && !hf._prev()?.size) return
  // A part above every whole widens polarArea's value scale, and the rings
  // and every slice's radius follow it, unless the scale is held.
  if (hd.active && p.chartType === 'polarArea' && hf.cfg.axis !== 'clamp') {
    hd.parts.forEach((/** @type {any[]} */ r) => {
      if (finite(r[0])) p.maxY = Math.max(p.maxY, r[0])
    })
  }

  // The renderer's own methods, called directly: the wraps below are own
  // properties, which every proxy made from the renderer would inherit.
  const ap = p.animatePaths
  const da = p.drawArcs
  const gm = p.getSliceMovers
  const gh = p.getHoverOutlinePath
  const s = {
    /** Each slice's arc animation as the whole was handed it, and its mark.
     * @type {any[]} */
    arcs: [],
    /** What moves with each slice besides the renderer's own. @type {any[][]} */
    movers: [],
    /** How far a slice reaches where its part goes past it. @type {number[]} */
    reach: [],
    ap,
  }
  p.animatePaths = (/** @type {any} */ el, /** @type {any} */ a) => {
    // Copied first: the call rewrites the last slice's end angle.
    const c = { ...a }
    ap.call(p, el, a)
    // A slice with no angle to come from lands at once (see animateArc).
    c.run = a.dur
    s.arcs[a.i] = { a: c, el }
  }
  p.drawArcs = (/** @type {any[]} */ ...args) => {
    const g = da.apply(p, args)
    paint(hf, p, g, s)
    return g
  }
  p.getSliceMovers = (/** @type {number} */ i) =>
    gm.call(p, i).concat(s.movers[i] || [])
  p.getHoverOutlinePath = (/** @type {number} */ i) => {
    const sizes = p.sliceSizes
    if (!(s.reach[i] > sizes[i])) return gh.call(p, i)
    p.sliceSizes = sizes.slice()
    p.sliceSizes[i] = s.reach[i]
    try {
      return gh.call(p, i)
    } finally {
      p.sliceSizes = sizes
    }
  }
  wrapCentre(hf, p)
}

/**
 * The centre labels of this render's renderer (a donut's, a radialBar's)
 * state the parts: the total adds them up, a hovered slice or ring states
 * its own, and the formatters are told the highlight. Every centre pass
 * (the render, a hover, the revert on leaving) goes through the instance.
 * @param {any} hf @param {any} p the renderer
 */
export function wrapCentre(hf, p) {
  const ri = p.renderInnerDataLabels
  const pi = p.printInnerLabels
  p.renderInnerDataLabels = (
    /** @type {any} */ g,
    /** @type {any} */ c,
    /** @type {any} */ o,
  ) => centre(hf, () => ri.call(p, g, labelsCfg(hf, c, 0), o))
  p.printInnerLabels = (
    /** @type {any} */ c,
    /** @type {string} */ name,
    /** @type {any} */ val,
    /** @type {any} */ el,
  ) =>
    centre(hf, () =>
      pi.call(
        p,
        labelsCfg(hf, c, el ? +el.parentNode.getAttribute('rel') - 1 : -1),
        name,
        val,
        el,
      ),
    )
}

/**
 * Run a centre label pass with the totals reading the parts, when the total
 * states the part: the default total formatter, and one a page wrote the
 * documented way, both add up `w.globals.seriesTotals`. Nothing else runs
 * while they are swapped.
 * @param {any} hf @param {() => any} fn
 */
function centre(hf, fn) {
  const gl = hf.w.globals
  const hd = hf.w.highlightData
  if (!hd?.active || (hf.cfg.dataLabels?.total ?? 'part') !== 'part') {
    return fn()
  }
  const keep = gl.seriesTotals
  gl.seriesTotals = hd.parts.map((/** @type {any[]} */ r) => r[0] ?? 0)
  try {
    return fn()
  } finally {
    gl.seriesTotals = keep
  }
}

/**
 * The centre labels' config with formatters that are told the highlight
 * (`{ highlight }` after their usual arguments), and a value that states
 * slice `i`'s part (-1: no slice, the total shows).
 * @param {any} hf @param {any} c @param {number} i
 */
function labelsCfg(hf, c, i) {
  const w = hf.w
  const hd = w.highlightData
  if (!hd?.active) return c
  const vals = w.seriesData.series
  const parts = hd.parts.map((/** @type {any[]} */ r) => r[0])
  const part =
    i > -1 && (hf.cfg.dataLabels?.value ?? 'part') === 'part' ? parts[i] : null
  /** @param {any[]} a */
  const sum = (a) => a.reduce((t, v) => t + (finite(v) ? v : 0), 0)
  const tf = c.total.formatter
  const vf = c.value.formatter
  return {
    ...c,
    total: {
      ...c.total,
      formatter:
        tf &&
        ((/** @type {any} */ x) =>
          tf(x, { highlight: info(sum(parts), sum(vals)) })),
    },
    value: {
      ...c.value,
      formatter: (/** @type {any} */ v, /** @type {any} */ x) =>
        vf(part ?? v, x, {
          highlight: i > -1 ? info(parts[i], vals[i]) : undefined,
        }),
    },
  }
}

/**
 * The renderer, standing in for itself at another radius: spacing insets a
 * slice by an angle worked out from its radius, so a part keeps its whole's
 * (at a share of 1 it is the whole, path for path).
 * @param {any} p @param {number} size the whole's radius
 * @param {any} [own] own properties to add
 */
const proxy = (p, size, own) =>
  Object.create(p, {
    getSliceExtent: {
      value: (/** @type {any} */ o) => p.getSliceExtent({ ...o, size }),
    },
    ...own,
  })

/**
 * Draw (or retire) each slice's part right after its whole, and fade the
 * whole, once the renderer has drawn every slice.
 * @param {any} hf @param {any} p @param {any} g the slices group
 * @param {{arcs: any[], movers: any[][], reach: number[], ap: any}} s
 */
function paint(hf, p, g, s) {
  const w = hf.w
  const gl = w.globals
  const cfg = hf.cfg
  const hd = w.highlightData
  const active = hd.active
  const prevMap = hf._prev()
  const type = p.chartType
  const polar = type === 'polarArea'
  const R = gl.radialSize
  const base = type === 'donut' ? p.donutSize : 0
  const fadeTo = active ? (cfg.fadeOpacity ?? 0.2) : 1
  const morph = hf.ctx.morphTypeChange?.isActive() === true
  // A render that is no data change (a mount, a resize) draws each part
  // where it rests, whatever an older render left behind. So does an update
  // sent without animation: it captured nothing, so the map from before it
  // is stale.
  const mount = !gl.dataChanged || !gl.shouldAnimate
  const area = cfg.pie?.encoding === 'area'
  const vals = w.seriesData.series
  const byPart = (cfg.dataLabels?.value ?? 'part') === 'part'
  // The outline that keeps a faded slice readable takes the slice's stroke
  // over in its colour; the width stays the renderer's (it is 0 while a
  // slice moves, and eased back after).
  const outline =
    p.strokeWidth > 0 && (cfg.outline?.width ?? 1) > 0
      ? { opacity: cfg.outline?.opacity ?? 1 }
      : null
  const labelsWas = gl.prevHighlightLabels?.get(-1)
  /** @type {any[]} */
  const rides = []

  // Each slice's group holds its whole alone so far. Walked by hand: the
  // server renderer's elements answer no selectors.
  /** @param {any} n @param {string} c */
  const has = (n, c) =>
    n.classList?.contains(c) ||
    ` ${n.getAttribute?.('class')} `.indexOf(` ${c} `) > -1
  Array.from(g.node.childNodes)
    .filter((/** @type {any} */ n) => has(n, 'apexcharts-pie-series'))
    .forEach((/** @type {any} */ sg) => {
      const node = Array.from(sg.childNodes).find((/** @type {any} */ n) =>
        has(n, 'apexcharts-pie-area'),
      )
      if (!node) return
      const i = Number(node.getAttribute('j'))
      const key = PIE + i
      const prev = mount ? undefined : prevMap?.get(key)
      if (!active && !prev) return
      const arc = s.arcs[i]
      const whole = vals[i]
      const pv = active ? hd.parts[i]?.[0] : null
      const size = p.sliceSizes[i]
      // The whole's own radius.
      const full = polar ? size : R
      // Whether this slice moves now, on the renderer's own rule (its clock
      // is the arc's; the svg runner draws it whatever the renderer kind).
      const anim = Environment.isBrowser() && !!arc && arc.a.run > 0 && !morph
      const delayMs = +arc?.a.animBeginArr[i] || 0

      // The part's radius. Only a share of the same sign as its whole has
      // one: a slice of nothing has no wedge to share, and an opposite-sign
      // part reads as an overflow, drawn as none.
      const share = pv != null && whole > 0 ? pv / whole : null
      /** @type {number | null} */
      let toR = null
      let over = false
      if (share != null && share > 0) {
        over = share > 1
        if (polar) {
          // polarArea draws a value as its radius, so a part is its whole's
          // radius scaled by the share; one past the rim (a scale the page
          // holds) is capped there.
          toR = Math.min(R, size * share)
        } else {
          // The rim is a hard edge: past it the part is drawn at it.
          const t = Math.min(share, 1)
          toR = area
            ? Math.sqrt(base * base + t * (R * R - base * base))
            : base + (R - base) * t
        }
      }

      // Where the part was a frame ago, as a share of the radius (so a
      // circle resized in between is not counted twice).
      const was = prev?.lr ?? prev?.fr
      /** @type {number | null} */
      let target = toR
      // A part with nothing to draw now leaves: a slice the legend hides
      // closes with its angle; on a clear it grows back into its whole,
      // which comes back the frame it lands; under a pick it drains away.
      const exit = toR == null && was != null && anim
      if (exit) {
        target =
          gl.collapsedSeriesIndices.indexOf(i) > -1
            ? was * R
            : active
              ? base
              : full
      }
      const lands = exit && !active

      let fromR = target
      let cover = false
      if (target != null && anim && !mount) {
        if (was != null) fromR = was * R
        else if (prev || cfg.enter === 'baseline') fromR = base
        else {
          // A first pick starts each part as its whole on screen, with the
          // whole hidden under it, so frame 0 is the chart as it was.
          cover = true
          fromR = polar ? (arc.a.prevSize ?? size) : R
        }
        // A slice shown again opens from no angle: at its own reach.
        if (
          !exit &&
          !(Math.abs(arc.a.prevEndAngle - arc.a.prevStartAngle) > 0.01)
        ) {
          fromR = target
          cover = false
        }
      }

      /** @type {any} */
      let part = null
      /** @type {any} */
      let edge = null
      /** @param {any} n */
      const moves = (n) => {
        // A slice already pulled out takes its part along from the start.
        const tf = node.getAttribute('transform')
        if (tf) {
          n.setAttribute('transform', tf)
          n.classList.add('apexcharts-slice-mover')
          n.style.transition = node.style.transition
        }
        ;(s.movers[i] = s.movers[i] || []).push(n)
      }
      /**
       * Draw `el` as slice i's wedge at `size`, on the whole's clock and
       * motion (angles, delay, duration, easing, the stroke it eases in,
       * the collapse), or at rest when the whole has no arc motion here.
       * @param {any} px @param {any} el @param {number} r @param {any} [from]
       */
      const wedge = (px, el, r, from) => {
        if (arc && !morph) {
          s.ap.call(px, el, {
            ...arc.a,
            size: r,
            prevSize: mount ? undefined : from,
            isTrack: true,
          })
        } else {
          const a = Number(node.getAttribute('data:angle'))
          el.attr({
            d: px.getPiePath({
              me: px,
              startAngle: Number(node.getAttribute('data:startAngle')),
              angle: a >= p.fullAngle ? p.fullAngle - 0.01 : a,
              size: r,
            }),
            'stroke-width': px.strokeWidth,
          })
        }
      }

      // The whole's own paint, taken before the whole is faded, made solid
      // as a bar's part is: past its whole a polarArea part covers its
      // whole's rim outline, which a translucent fill (0.7 by default) let
      // through as a dark band. A slice states its fill opacity twice, in
      // its colour and in fill-opacity, so a plain colour's part is drawn
      // in the ink alone and its strength is the pair's product: the
      // whole's on a first pick and on a clear's landing (both ends are the
      // whole's look), 1 otherwise. A gradient, pattern or image keeps the
      // whole's paint and strength as drawn.
      const fill = node.getAttribute('fill')
      const [ink, ca] = solid(fill)
      const own = ownOpacity(node)
      const plain = !!fill && fill !== 'none' && !/^url\(/i.test(fill)
      const alpha = plain ? ca * own : own
      const a0 = !plain ? own : cover ? alpha : was != null ? (prev.al ?? 1) : 1
      const a1 = !plain ? own : lands ? alpha : 1
      if (target != null) {
        const px = proxy(p, full)
        part = new Graphics(w).drawPath({
          d: '',
          fill: ink,
          stroke: node.getAttribute('stroke'),
          strokeWidth: 0,
          fillOpacity: a0,
          classes: `${PART} apexcharts-pie-highlight-part`,
        })
        const pn = part.node
        pn.setAttribute('pointer-events', 'none')
        if (share != null) pn.setAttribute('data:hl-share', String(share))
        sg.appendChild(pn)
        moves(pn)
        // The first frame is where the whole starts, as the whole's is.
        if (anim && !mount) {
          pn.setAttribute(
            'd',
            px.getChangedPath(arc.a.prevStartAngle, arc.a.prevEndAngle, fromR),
          )
        }
        wedge(px, part, target, fromR)
        if (over && !exit) pn.classList.add('apexcharts-highlight-overflow')
        mirrorFilter(node, pn)
        // A part past its whole would hide where the whole ends, so the
        // whole's edge is traced over it (just inside the rim, where a pie
        // part is capped; on a polarArea, where its whole ends).
        if ((over && !exit) || (exit && prev?.edge)) {
          edge = new Graphics(w).drawPath({
            d: '',
            fill: 'none',
            stroke: '#fff',
            strokeWidth: 1,
            strokeDashArray: 3,
            classes: `${PART} apexcharts-highlight-edge`,
          })
          edge.node.setAttribute('pointer-events', 'none')
          edge.node.setAttribute('stroke-opacity', '0')
          sg.appendChild(edge.node)
          moves(edge.node)
          // Its own 1px stroke: the arc eases each wedge's stroke to the
          // renderer's width once it lands.
          const ex = proxy(p, full, { strokeWidth: { value: 1 } })
          wedge(ex, edge, polar ? size : R - 2, polar ? arc?.a.prevSize : R - 2)
        }
        // A polarArea part past its whole has no whole under that stretch:
        // the part itself stands in for its whole under the pointer there.
        if (polar && over && !exit) {
          pn.removeAttribute('pointer-events')
          bindHit(node, pn)
          s.reach[i] = target
        }
        if (morph) {
          // A cross-type morph moves the wholes from the other chart's marks;
          // the parts come in at rest once it has.
          const els = [pn, edge?.node].filter(Boolean)
          /** @param {number} t */
          const show = (t) => els.forEach((n) => n.setAttribute('opacity', t))
          show(0)
          hf._tween(
            hf.ctx.morphTypeChange.getSpeed(),
            w.config.chart.animations.dynamicAnimation.speed,
            show,
            () => els.forEach((n) => n.removeAttribute('opacity')),
          )
        }
      }

      // What this slice draws, for the next update to start from: the
      // part's reach (`fr`, and live in `lr`) and the whole's look.
      /** @type {any} */
      const rec = {
        d: null,
        fr: null,
        f: fadeTo,
        edge: false,
        c: !active,
        al: a1,
      }
      hf._targets.set(key, rec)
      const e1 = over && toR != null ? 0.75 : 0
      const e0 = mount ? e1 : prev?.edge ? 0.75 : 0
      const r0 = fromR ?? 0
      const r1 = target ?? 0
      hf._fade(
        node,
        mount
          ? look(fadeTo)
          : cover
            ? COVERED
            : prev
              ? { f: prev.f, o: prev.o ?? look(prev.f).o }
              : PLAIN,
        lands ? COVERED : look(fadeTo),
        { delayMs, speed: arc?.a.run, el: arc?.el },
        {
          anim,
          force: !!part && (r0 !== r1 || e0 !== e1 || a0 !== a1),
          outline: outline && { ...outline, color: gl.colors[i] },
          also: (/** @type {number} */ t) => {
            if (part) {
              rec.lr = mix(r0, r1, t) / R
              rec.la = mix(a0, a1, t)
              part.node.setAttribute('fill-opacity', String(rec.la))
            }
            edge?.node.setAttribute('stroke-opacity', String(mix(e0, e1, t)))
          },
          land: lands ? PLAIN : undefined,
          // A retired part leaves on the frame its whole lands.
          done: exit
            ? () => {
                part?.remove()
                edge?.remove()
                rec.lr = null
              }
            : undefined,
          rec,
        },
      )
      if (toR != null) {
        Object.assign(rec, { fr: toR / R, edge: over, n: part.node })
      }

      // The slice's label states its part, at the part.
      const lg = p.sliceLabelGroups[i]
      const t =
        lg &&
        Array.from(lg.childNodes).find((/** @type {any} */ n) =>
          has(n, 'apexcharts-pie-label'),
        )
      if (t && active) {
        if (pv == null && byPart) {
          // No part, no reading: the faded whole is a backdrop.
          p.sliceLabels = p.sliceLabels.filter(
            (/** @type {any} */ x) => x.node !== lg,
          )
          lg.parentNode?.removeChild(lg)
          delete p.sliceLabelGroups[i]
          return
        }
        label(w, p, node, t, i, byPart ? pv : null, whole, toR, base)
      }
      if (t && anim && !mount && labelsWas) {
        rides.push({ t, src: labelsWas.get(i), el: arc.el, delayMs, arc })
      }
    })

  if (rides.length) hf._ride = () => ride(hf, rides)
}

/**
 * A slice's label: the part's share of the whole circle (the unit labels
 * have), placed on the renderer's label ring at the part's radius, and in the
 * chart's text colour where it does not sit on the part. Without a part to
 * state (`pv` null: the labels state the wholes) it is only recoloured.
 * @param {any} w @param {any} p @param {any} node the whole
 * @param {any} t the label text
 * @param {number} i @param {number | null} pv the part @param {number} whole
 * @param {number | null} r the part's radius @param {number} base
 */
function label(w, p, node, t, i, pv, whole, r, base) {
  const fmt = w.config.dataLabels.formatter
  if (pv != null) {
    const pct = w.globals.seriesPercent[i]?.[0] ?? 0
    const v = whole ? (pct * pv) / whole : 0
    t.textContent = String(
      fmt
        ? fmt(v, {
            seriesIndex: i,
            dataPointIndex: i,
            series: w.seriesData.series,
            w,
            highlight: info(pv, whole),
          })
        : v + '%',
    )
  }
  const fs = parseFloat(t.getAttribute('font-size')) || 12
  const a0 = Number(node.getAttribute('data:startAngle'))
  const span = Number(node.getAttribute('data:angle'))
  // A part too thin for its text keeps the label where its whole put it,
  // rather than piling every small part's label at the centre.
  if (pv != null && r != null && r - base >= 1.2 * fs) {
    const off = w.config.plotOptions.pie.dataLabels.offset
    const at = Utils.polarToCartesian(
      p.centerX,
      p.centerY,
      p.chartType === 'donut' ? (base + r) / 2 + off : r / 1.25 + off,
      (a0 + span / 2) % p.fullAngle,
    )
    t.setAttribute('x', at.x)
    t.setAttribute('y', at.y)
  }
  // On the faded tint the default white is unreadable.
  const box = new Graphics(w).getTextRects(
    t.textContent,
    t.getAttribute('font-size'),
    t.getAttribute('font-family'),
    undefined,
    true,
    t.getAttribute('font-weight'),
  )
  const x = parseFloat(t.getAttribute('x'))
  const y = parseFloat(t.getAttribute('y'))
  const on =
    r != null &&
    [
      [x - box.width / 2, y - box.height * 0.75],
      [x + box.width / 2, y - box.height * 0.75],
      [x - box.width / 2, y + box.height * 0.25],
      [x + box.width / 2, y + box.height * 0.25],
    ].every(([cx, cy]) => {
      const dx = cx - p.centerX
      const dy = cy - p.centerY
      const d = Math.hypot(dx, dy)
      // Degrees clockwise from 12 o'clock, as the slices are laid out.
      const ang =
        ((((Math.atan2(dy, dx) * 180) / Math.PI + 90 - a0) % 360) + 360) % 360
      return d >= base && d <= r && ang <= span
    })
  if (!on) {
    t.setAttribute('fill', w.config.chart.foreColor)
    t.removeAttribute('filter')
  }
}

/**
 * Ride each slice label from where it was on screen to where it is now, on
 * its slice's clock; one with nothing on screen fades in where it is. The
 * text changes at once.
 * @param {any} hf @param {any[]} rides
 */
function ride(hf, rides) {
  rides.forEach(({ t, src, el, delayMs, arc }) => {
    if (!t.isConnected) return
    const [x, y] = drawnAt(t)
    const dx = src ? src.x - x : 0
    const dy = src ? src.y - y : 0
    if (src && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
    hf._tween(
      delayMs,
      arc.a.run,
      (/** @type {number} */ e) => {
        const k = 1 - e
        if (k > 0 && src)
          t.setAttribute('transform', `translate(${dx * k} ${dy * k})`)
        else t.removeAttribute('transform')
        if (!src) {
          if (e < 1) t.setAttribute('opacity', String(e))
          else t.removeAttribute('opacity')
        }
      },
      undefined,
      undefined,
      el,
    )
  })
}
