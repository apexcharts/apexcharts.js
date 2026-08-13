// @ts-check
import { Environment } from '../utils/Environment.js'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'
import { prefersReducedMotion } from './Animations'
import { parsePath } from '../svg/PathMorphing'
import {
  gridDivideRect,
  makeColorLerp,
  runPieceTween,
  sortByHilbert,
} from './MorphPieces'

/**
 * Cross-chart-type morphing.
 *
 * Bridges the destroy+recreate flicker that normally happens when
 * `updateOptions({ chart: { type: '<other>' } })` is called. Captures the
 * outgoing chart's series-element `d` strings before destroy and feeds them
 * back to the new chart-type's renderer as the initial path — the existing
 * `morphPaths` engine in svg/SVGAnimation interpolates between the two.
 *
 * Supported pairs:
 *   - bar ↔ pie / donut / polarArea / radialBar
 *   - pie ↔ donut ↔ polarArea (trivial, same renderer)
 *
 * Strict data-shape contract: the user must pass a series shape that matches
 * the destination type. When the shape is incompatible the morph is skipped
 * and the chart falls back to the normal destroy+recreate flow.
 *
 * This is an OPTIONAL feature module — register it via
 * `import 'apexcharts/features/morph'` to opt in. When unregistered, all
 * `ctx.morphTypeChange?.X` call sites in the renderers no-op via optional
 * chaining and the chart behaves exactly as before.
 */

// funnel + pyramid are rendered by Bar.js internally (Config.js aliases them
// to `chart.type: 'bar'` with `plotOptions.bar.isFunnel: true, horizontal:
// true`). gauge is aliased to radialBar. Treating them as members of the
// bar / radial families lets the morph engine accept them as source or
// target without any renderer-side changes.
//
// histogram is the same kind of alias: Config maps it to `bar` and keeps the
// requested name on `chart.requestedType`, which is what the capture reads
// (see UpdateHelpers). Every mark it draws is an ordinary bar path, so it
// needs no capture branch of its own — only membership. A histogram bar
// stands for the observations it counted, which makes it the one bar the unit
// pair is literally true of.
const BAR_FAMILY = new Set(['bar', 'funnel', 'pyramid', 'histogram'])
const RADIAL_FAMILY = new Set(['pie', 'donut', 'polarArea', 'radialBar', 'gauge'])
// unit (dot-cluster / pictogram) morphs BOTH ways: a bar/radial shape comes
// apart into the objects it stood for (each leaving from the part of the shape
// that represented it, see getInitialSlotFor), and a dot cloud collapses back
// into the mark that aggregates it (the incoming mark grows out of the cloud's
// own footprint, see the `unit` branch of _captureFromDOM). As a target the
// renderer reads per-object slots rather than a path `d`, so its dots come out
// of the outgoing bar/wedge instead of gathering from the plot centre.
//
// waffle is an alias for the unit chart's square-grid layout (Config maps it to
// `unit`), so it draws the same `.apexcharts-unit-area` dots the capture reads
// and belongs to the same family. Without the alias here a waffle could morph
// with nothing at all, including with the `unit` chart it already is.
const UNIT_FAMILY = new Set(['unit', 'waffle'])
// Space-filling part-to-whole charts. A treemap tile and a sunburst arc are
// both exactly one mark per row, so this pair is an ordinary shape-to-shape
// morph: no explode/collapse, just rectangles unrolling into a radial partition
// and back. They map to each other by draw order (see the `partition` branch of
// _buildMapping) because neither renderer iterates the (realIndex, j) grid the
// bar family does.
const PARTITION_FAMILY = new Set(['treemap', 'sunburst'])
// Distribution summaries: one mark per category, each standing for a whole
// sample (a five-number box, a density silhouette). They are drawn through
// Bar's renderSeries but under their own classes, so unlike `histogram` they
// cannot join BAR_FAMILY and inherit its capture; they get their own branch in
// _captureFromDOM. What makes them worth pairing is the same thing that makes
// a histogram worth pairing: the sample behind each mark still exists, so the
// mark can genuinely come apart into it (see RowSourceRegistry).
const SUMMARY_FAMILY = new Set(['boxPlot', 'violin'])

// How much of the morph the outgoing marks get to fade over. Short of the full
// duration on purpose (see _mountGhost). Since the piece layer landed the
// ghost is the FALLBACK exit, used when pieces are infeasible (too many
// objects, a source family without piece support, a bailed mount).
const GHOST_FADE_FRACTION = 0.55

// Above this many objects the piece layer stands down and the ghost fade runs
// instead. Every piece is a live SVG node driven per frame; a unit chart's own
// gather animation moves this many dots comfortably, and past it the overlay
// would cost more than the effect is worth.
const PIECE_BUDGET = 1500

// The per-piece stagger never eats more than this many ms (or 35% of the
// morph, whichever is smaller): pieces sweep rather than march, but the last
// one still lands within the configured speed.
const PIECE_STAGGER_MAX = 300

/** @param {string} type */
function familyOf(type) {
  if (BAR_FAMILY.has(type)) return 'bar'
  if (RADIAL_FAMILY.has(type)) return 'radial'
  if (UNIT_FAMILY.has(type)) return 'unit'
  if (PARTITION_FAMILY.has(type)) return 'partition'
  if (SUMMARY_FAMILY.has(type)) return 'summary'
  return null
}

export default class MorphTypeChange {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** @type {null | { fromType: string, toType: string, mapping: Map<string, {d: string, fill: string|null}>, oldLayout: { translateX: number, translateY: number }, pieceOut?: boolean, pieceIn?: boolean, sourceDots?: Map<number, Array<{x:number,y:number,r:number,fill:string|null}>>, keyOrder?: string[] }} */
    this._snapshot = null
    // A detached copy of the outgoing marks, kept alive across the teardown so
    // marks with no successor can still exit. Null whenever none is in flight.
    /** @type {any} */
    this._ghost = null
    // The live piece overlay: its <g> element and the cancel handle of the
    // rAF loop driving it. Null whenever no pieces are in flight.
    /** @type {any} */
    this._pieceLayer = null
    /** @type {null | (() => void)} */
    this._pieceCancel = null
  }

  /**
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  canMorphTypes(fromType, toType) {
    if (fromType === toType) return false
    const ff = familyOf(fromType)
    const tf = familyOf(toType)
    if (!ff || !tf) return false
    // The partition family pairs only with itself for now. treemap ↔ bar or
    // ↔ pie would work mechanically (every mark in all four is 1:1 with a row,
    // and the mapping is positional), but neither renderer has been driven
    // through those pairs, and claiming a morph that has not been watched is
    // worse than not offering it.
    if ((ff === 'partition') !== (tf === 'partition')) return false
    // A summary mark stands for a whole sample, so the pair that means
    // something is the one that takes it apart into that sample and puts it
    // back. boxPlot ↔ bar, boxPlot ↔ pie and even boxPlot ↔ violin are all
    // mechanically plausible and none of them has been driven, so they stay
    // closed for the same reason the partition family's cross-pairs do.
    if (ff === 'summary' || tf === 'summary') {
      return ff === 'unit' || tf === 'unit'
    }
    // bar ↔ radial covers the remaining cross-family cases; radial → radial
    // covers pie ↔ donut ↔ polarArea ↔ radialBar.
    return true
  }

  /**
   * @param {string} fromType
   * @param {string} toType
   * @param {any} newSeries
   * @returns {boolean}
   */
  isCompatibleSeriesShape(fromType, toType, newSeries) {
    if (!Array.isArray(newSeries) || newSeries.length === 0) return false
    const ff = familyOf(fromType)
    const tf = familyOf(toType)

    if (tf === 'unit') {
      // A unit chart is one SERIES per cluster, each carrying that cluster's
      // objects: [{ name, data: [datum, ...] }, ...]. Requiring a single series
      // (as the radial branch below does) rejected every multi-cluster unit
      // chart, which is the ordinary shape and the whole point of the pair.
      if (newSeries.every((v) => typeof v === 'number')) return true
      return newSeries.every(
        (/** @type {any} */ s) =>
          s && typeof s === 'object' && Array.isArray(s.data),
      )
    }

    if (tf === 'partition') {
      // A treemap takes [{ data: [...] }, ...]; a sunburst takes either that
      // (with a `children` tree or a drilldown config alongside) or the flat
      // form. The mapping is by draw order, so any non-empty series is workable
      // and the renderer decides how many marks it draws.
      return true
    }

    if (tf === 'radial') {
      // pie/donut/polarArea/radialBar accept either a flat number[] or the
      // single-series object form [{ data: [...] }] that the pie/donut data
      // parser also accepts. The mapping is positional, so the exact value
      // shape is irrelevant.
      if (newSeries.every((v) => typeof v === 'number')) return true
      return (
        newSeries.length === 1 &&
        newSeries[0] &&
        typeof newSeries[0] === 'object' &&
        Array.isArray(newSeries[0].data)
      )
    }
    if (tf === 'bar' || tf === 'summary') {
      // bar expects [{ name?, data: number[] }, ...]; boxPlot and violin take
      // the same envelope with richer datums, and the mapping is positional
      // either way, so the datum shape is the renderer's business.
      return newSeries.every(
        (s) => s && typeof s === 'object' && Array.isArray(s.data),
      )
    }
    return ff !== null && tf !== null
  }

  /**
   * Capture the live DOM of the *current* (outgoing) chart and stash it on
   * this module. Called from `apexcharts._updateOptions` before the config
   * merge that flips `chart.type`.
   *
   * Returns true if a morph is queued — caller doesn't need the value, but
   * tests use it.
   *
   * @param {{ fromType: string, toType: string, newSeries: any }} args
   * @returns {boolean}
   */
  captureBeforeDestroy({ fromType, toType, newSeries }) {
    this._snapshot = null
    // A second type change while the previous exit is still in flight: drop it
    // now rather than leave two dead charts stacked over the live one.
    this._removeGhost()
    this._cancelPieces()

    if (!Environment.isBrowser()) return false
    const animCfg = this.w.config.chart.animations
    if (!animCfg || animCfg.enabled === false) return false
    if (animCfg.chartTypeMorph && animCfg.chartTypeMorph.enabled === false)
      return false
    if (animCfg.respectReducedMotion && prefersReducedMotion()) return false
    if (!this.canMorphTypes(fromType, toType)) return false
    if (!this.isCompatibleSeriesShape(fromType, toType, newSeries)) return false

    const { marks, branches, unitDots } = this._captureFromDOM(fromType)
    if (!marks.length) return false

    const mapping = this._buildMapping(
      marks,
      fromType,
      toType,
      newSeries,
      branches,
    )
    if (mapping.size === 0) return false

    // Capture the OLD chart's elGraphical translate so getInitialPathFor can
    // shift the morphFrom `d` into the OLD chart's screen coordinates. Without
    // this, the path appears in the NEW chart's translate group and gets a
    // visible position jump at t=0 (e.g. bar reserves yaxis space → its
    // translateX differs from radialBar's). At capture time, this.w still
    // reflects the outgoing chart's layout.
    this._snapshot = {
      fromType,
      toType,
      mapping,
      oldLayout: {
        translateX: this.w.layout.translateX || 0,
        translateY: this.w.layout.translateY || 0,
      },
    }

    // Piece eligibility, decided now so the incoming renderer can coordinate
    // (a unit chart holds its dots for the pieces to land on; a bar renders
    // hidden until its mosaic assembles). Both directions conserve the ink:
    // instead of a photocopy of the old chart fading over the new one, the
    // outgoing marks are cut into one cell per object (or the outgoing dots
    // fly to one cell each) and the pieces travel. The ghost below survives as
    // the fallback for what pieces cannot serve.
    const ff = familyOf(fromType)
    const tf = familyOf(toType)
    const pieceFamilies = ff === 'bar' || ff === 'summary'
    if (tf === 'unit' && pieceFamilies) {
      // mark -> objects. The object count comes from the incoming series (one
      // datum per dot in the object form); the numeric form scales values by
      // unitValue and cannot be counted here, so it keeps the burst + ghost.
      const total = this._countUnitSeries(newSeries)
      this._snapshot.pieceOut = total > 0 && total <= PIECE_BUDGET
    } else if (ff === 'unit' && (tf === 'bar' || tf === 'summary')) {
      // objects -> mark. The dots were just captured, so the count is exact.
      let total = 0
      unitDots.forEach((list) => {
        total += list.length
      })
      if (total > 0 && total <= PIECE_BUDGET) {
        this._snapshot.pieceIn = true
        this._snapshot.sourceDots = unitDots
        // Flat mark order of the incoming chart, the same derivation
        // _buildMapping uses, so cluster k pairs with keyOrder[k].
        /** @type {string[]} */
        const keyOrder = []
        ;(Array.isArray(newSeries) ? newSeries : []).forEach(
          (/** @type {any} */ s, /** @type {number} */ seriesIdx) => {
            const data = s && Array.isArray(s.data) ? s.data : []
            for (let j = 0; j < data.length; j++) {
              keyOrder.push(`${seriesIdx}:${j}`)
            }
          },
        )
        this._snapshot.keyOrder = keyOrder
      }
    }

    // Marks with no successor need an exit, and the outgoing chart is torn
    // down before the incoming one draws its first frame, so the only way to
    // give them one is to take a copy now while it is still mounted. When the
    // piece layer will run, the copy is never mounted, so skip taking it.
    if (
      this._needsGhost(fromType, toType) &&
      !this._snapshot.pieceOut &&
      !this._snapshot.pieceIn
    ) {
      this._captureGhost()
    }

    // Clear w.globals.previousPaths so the destination chart's renderer
    // doesn't try to read entries from the outgoing chart (which would be
    // shaped wrong and produce NaN).
    this.w.globals.previousPaths = []

    return true
  }

  /**
   * Whether the outgoing marks need an exit animation of their own.
   *
   * Most pairs do not. bar → pie hands every wedge the exact `d` of the bar it
   * replaces, and treemap → sunburst does the same for its tiles: the outgoing
   * mark IS the incoming mark's first frame, so it never needs to leave, and
   * drawing a copy of it would only double the image at t=0.
   *
   * The unit pairs are the exception, in both directions, because the
   * correspondence is not 1:1. Going in, one bar becomes N dots, so the bar has
   * no successor to become. Coming out, N dots become one bar: the bar does
   * grow from the cloud's footprint, but no individual dot has anywhere to go.
   * Either way something on screen simply stops existing, which is exactly the
   * hard cut that made these pairs read as "the old chart vanished and the new
   * one animated" rather than as a morph.
   *
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  _needsGhost(fromType, toType) {
    return familyOf(fromType) === 'unit' || familyOf(toType) === 'unit'
  }

  /**
   * Take a detached copy of the outgoing chart's marks, to be mounted over the
   * incoming chart once it exists (see `_mountGhost`).
   *
   * The whole `<svg>` is cloned and the chrome then removed from the copy,
   * rather than lifting the series groups out on their own: every mark's
   * position depends on the transforms of the groups above it, and cloning
   * from the root is what keeps those intact without re-deriving any geometry.
   *
   * The chrome is dropped because `applyChromeFade` already fades the incoming
   * axes, grid and legend in from zero. Keeping the outgoing set as well would
   * put two sets of axis labels on screen at half opacity each.
   */
  _captureGhost() {
    /** @type {any} */
    const paper = this.w.dom?.Paper
    const node = paper && paper.node
    if (!node || typeof node.cloneNode !== 'function') return

    /** @type {any} */
    const clone = node.cloneNode(true)
    // Everything that is not a series mark. The tooltip and toolbar live
    // outside the svg, so they are not in the clone to begin with.
    const drop = [
      '.apexcharts-xaxis',
      '.apexcharts-yaxis',
      '.apexcharts-grid',
      '.apexcharts-gridlines-horizontal',
      '.apexcharts-gridlines-vertical',
      '.apexcharts-legend',
      '.apexcharts-title-text',
      '.apexcharts-subtitle-text',
      '.apexcharts-annotations',
      '.apexcharts-zoom-rect',
      '.apexcharts-selection-rect',
      '.apexcharts-xcrosshairs',
      '.apexcharts-ycrosshairs',
    ]
    if (typeof clone.querySelectorAll === 'function') {
      drop.forEach((sel) => {
        clone.querySelectorAll(sel).forEach((/** @type {any} */ el) => {
          if (el.parentNode) el.parentNode.removeChild(el)
        })
      })
    }

    // An id collision would let the live chart resolve a gradient or clip-path
    // against the dead one's defs, so the copy keeps no ids at all.
    if (typeof clone.querySelectorAll === 'function') {
      clone.querySelectorAll('[id]').forEach((/** @type {any} */ el) => {
        el.removeAttribute('id')
      })
    }
    clone.removeAttribute?.('id')

    this._ghost = clone
  }

  /**
   * Mount the captured copy over the newly-rendered chart and fade it out.
   *
   * It goes ON TOP of the live svg, which is what makes both directions read
   * as one motion rather than as a swap. Going into a unit chart the bars
   * dissolve and the dots are uncovered already in flight, having left from
   * inside the bar that held them. Coming out of one, the dots are still there
   * to fade while the bar grows underneath them; behind the incoming mark they
   * would be hidden on the first frame, because that mark starts out exactly
   * the size of the cloud it is replacing.
   *
   * The fade runs over a fraction of the morph so the outgoing marks are gone
   * before the incoming ones settle. Holding them for the full duration leaves
   * two charts overlapping right at the moment the eye is reading the final
   * shape, which looks like a rendering fault rather than a transition.
   */
  _mountGhost() {
    const ghost = this._ghost
    if (!ghost || !Environment.isBrowser()) return
    /** @type {any} */
    const wrap = this.w.dom?.elWrap
    if (!wrap || typeof wrap.appendChild !== 'function') {
      this._ghost = null
      return
    }

    // .apexcharts-canvas is position:relative, so this lands exactly over the
    // live svg. It must never take a pointer event: the chart underneath owns
    // every hover and click for the whole transition, and it must contribute
    // nothing but its marks, so the cloned background goes too.
    const style = ghost.style
    if (style) {
      style.position = 'absolute'
      style.left = '0'
      style.top = '0'
      style.background = 'transparent'
      style.pointerEvents = 'none'
      style.opacity = '1'
    }
    ghost.setAttribute?.('aria-hidden', 'true')
    ghost.setAttribute?.('class', 'apexcharts-morph-ghost')

    wrap.appendChild(ghost)

    const speed = this.getSpeed()
    const fade = Math.max(120, Math.round(speed * GHOST_FADE_FRACTION))
    BrowserAPIs.requestAnimationFrame(() => {
      if (!style) return
      // ease-in, so the outgoing marks hold briefly at full strength before
      // going. An ease-out drops most of the opacity in the first few frames,
      // which reads as a flicker rather than as coming apart.
      style.transition = `opacity ${fade}ms ease-in`
      style.opacity = '0'
    })
    setTimeout(() => this._removeGhost(), fade + 60)
  }

  /** Detach the ghost if one is mounted. Safe to call at any time. */
  _removeGhost() {
    const ghost = this._ghost
    this._ghost = null
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost)
  }

  /* ------------------------------------------------------------------ *
   * The piece layer (see MorphPieces for the geometry).
   * ------------------------------------------------------------------ */

  /**
   * Object count of an incoming unit series: one datum per dot in the object
   * form. The numeric form ([3, 5]) scales values by `plotOptions.unit
   * .unitValue`, which is not resolvable pre-merge, so it counts as zero and
   * keeps the burst-and-ghost behaviour.
   *
   * @param {any} newSeries
   * @returns {number}
   */
  _countUnitSeries(newSeries) {
    if (!Array.isArray(newSeries)) return 0
    let total = 0
    for (const s of newSeries) {
      if (!s || typeof s !== 'object' || !Array.isArray(s.data)) return 0
      total += s.data.length
    }
    return total
  }

  /**
   * Whether the incoming unit chart should hold its dots for the piece layer:
   * render them at their final slots, hidden, and let the pieces do the
   * flying. The reveal happens per dot as its piece lands.
   *
   * Consulted by the unit renderer during its draw, which runs after
   * `captureBeforeDestroy` and before `applyChromeFade`, so the decision was
   * already made from the same series the renderer is now drawing.
   *
   * @returns {boolean}
   */
  usesPieceTakeover() {
    return !!(this._snapshot && this._snapshot.pieceOut)
  }

  /**
   * Whether the piece layer claims the incoming mark at (realIndex, j): a
   * source cluster's dots will fly to it and tile it, so it must render
   * hidden and reveal only when its mosaic is complete. Consulted by the bar
   * renderer (boxPlot and violin render through it).
   *
   * @param {number|string} realIndex
   * @param {number|string} j
   * @returns {boolean}
   */
  claimsTargetMark(realIndex, j) {
    return !!(
      this._snapshot &&
      this._snapshot.pieceIn &&
      this._snapshot.mapping.has(`${realIndex}:${j}`)
    )
  }

  /**
   * Create the overlay group the pieces are driven in. It lives INSIDE the
   * new chart's elGraphical so every coordinate matches the marks' own local
   * space, and it never takes a pointer event.
   * @returns {any} the <g> node, or null
   */
  _makePieceLayer() {
    /** @type {any} */
    const graph = this.w.dom?.elGraphical
    const host = graph && graph.node
    if (!host || typeof host.appendChild !== 'function') return null
    const g = BrowserAPIs.createElementNS('http://www.w3.org/2000/svg', 'g')
    if (!g) return null
    g.setAttribute('class', 'apexcharts-morph-pieces')
    g.setAttribute('pointer-events', 'none')
    host.appendChild(g)
    this._pieceLayer = g
    return g
  }

  /**
   * Reveal everything a piece takeover hid, whether or not the pieces ran.
   * The attribute is plain (no namespace colon) so it stays selectable
   * everywhere.
   */
  _revealPieceHidden() {
    /** @type {any} */
    const baseEl = this.w.globals.dom?.baseEl
    if (!baseEl || typeof baseEl.querySelectorAll !== 'function') return
    baseEl.querySelectorAll('[data-piece-hidden]').forEach(
      (/** @type {any} */ el) => {
        el.removeAttribute('opacity')
        el.removeAttribute('data-piece-hidden')
      },
    )
  }

  /** Stop the piece run, drop the overlay, and reveal anything still hidden. */
  _cancelPieces() {
    if (this._pieceCancel) {
      this._pieceCancel()
      this._pieceCancel = null
    }
    const layer = this._pieceLayer
    this._pieceLayer = null
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer)
    this._revealPieceHidden()
  }

  /**
   * mark -> objects. Cut each captured mark into one cell per dot and fly
   * every cell to its dot, corners rounding off and fill blending on the way.
   * The real dots (rendered hidden by the unit chart, see usesPieceTakeover)
   * are revealed one by one as their piece lands, so the handoff is
   * geometrically exact and nothing ever fades.
   */
  _separatePieces() {
    const snap = this._snapshot
    /** @type {any} */
    const baseEl = this.w.globals.dom?.baseEl
    if (!snap || !baseEl) return this._revealPieceHidden()

    // The live dots, grouped by cluster. They exist and are hidden: the unit
    // renderer drew them at their final slots before this ran.
    /** @type {Map<number, Array<{el:any,x:number,y:number,r:number,fill:string|null}>>} */
    const byCluster = new Map()
    let total = 0
    baseEl
      .querySelectorAll('.apexcharts-unit-area')
      .forEach((/** @type {any} */ dot) => {
        const i = parseInt(dot.getAttribute('i') ?? '', 10)
        if (isNaN(i)) return
        const cxAttr = dot.getAttribute('cx')
        let x
        let y
        let r = 3
        if (cxAttr != null) {
          x = parseFloat(cxAttr)
          y = parseFloat(dot.getAttribute('cy') ?? '')
          r = parseFloat(dot.getAttribute('r') ?? '3') || 3
        } else {
          const wAttr = parseFloat(dot.getAttribute('width') ?? '0') || 0
          const hAttr = parseFloat(dot.getAttribute('height') ?? '0') || 0
          x = parseFloat(dot.getAttribute('x') ?? '') + wAttr / 2
          y = parseFloat(dot.getAttribute('y') ?? '') + hAttr / 2
          r = Math.max(wAttr, hAttr) / 2 || 3
        }
        if (!isFinite(x) || !isFinite(y)) return
        let list = byCluster.get(i)
        if (!list) {
          list = []
          byCluster.set(i, list)
        }
        list.push({ el: dot, x, y, r, fill: dot.getAttribute('fill') })
        total++
      })

    if (total === 0 || total > PIECE_BUDGET) return this._revealPieceHidden()

    const layer = this._makePieceLayer()
    if (!layer) return this._revealPieceHidden()

    /** @type {import('./MorphPieces').Piece[]} */
    const pieces = []
    const doc = layer.ownerDocument

    Array.from(byCluster.keys())
      .sort((a, b) => a - b)
      .forEach((i) => {
        const dots = /** @type {any[]} */ (byCluster.get(i))
        const box = this.getInitialBBoxFor(i)
        const entry = snap.mapping.get(`${i}:0`)
        if (!box || !entry) {
          // No outgoing mark stood for this cluster (an entering series): the
          // dots have nothing to come out of, so just show them.
          dots.forEach((d) => {
            d.el.removeAttribute('opacity')
            d.el.removeAttribute('data-piece-hidden')
          })
          return
        }

        // A gradient fill arrives as url(#...); the series colour is the
        // honest solid stand-in.
        const markFill =
          entry.fill && entry.fill.indexOf('url(') !== 0
            ? entry.fill
            : this.w.globals.colors?.[i] || dots[0].fill

        const cells = sortByHilbert(
          gridDivideRect(box, dots.length),
          (c) => [c.x + c.width / 2, c.y + c.height / 2],
        )
        const ordered = sortByHilbert(dots, (d) => [d.x, d.y])

        for (let k = 0; k < ordered.length; k++) {
          const cell = cells[k]
          const dot = ordered[k]
          const el = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
          // Which cluster this piece serves; diagnostics and tests key on it.
          el.setAttribute('data-i', String(i))
          el.setAttribute('x', String(cell.x))
          el.setAttribute('y', String(cell.y))
          el.setAttribute('width', String(cell.width))
          el.setAttribute('height', String(cell.height))
          el.setAttribute('rx', '0')
          el.setAttribute('fill', String(markFill))
          layer.appendChild(el)
          pieces.push({
            el,
            from: { x: cell.x, y: cell.y, width: cell.width, height: cell.height, rx: 0 },
            to: {
              x: dot.x - dot.r,
              y: dot.y - dot.r,
              width: dot.r * 2,
              height: dot.r * 2,
              rx: dot.r,
            },
            fill: makeColorLerp(markFill, dot.fill),
            fillEnd: dot.fill,
            delay: 0,
            meta: { dotEl: dot.el },
          })
        }
      })

    if (!pieces.length) return this._cancelPieces()

    this._runPieces(pieces, (piece) => {
      // The dot appears exactly where its piece just was, then the piece goes:
      // a swap, not a fade.
      const dotEl = piece.meta.dotEl
      dotEl.removeAttribute('opacity')
      dotEl.removeAttribute('data-piece-hidden')
      if (piece.el.parentNode) piece.el.parentNode.removeChild(piece.el)
    })
  }

  /**
   * objects -> mark. Each captured outgoing dot flies to one cell of the
   * incoming mark, squaring off and blending towards the mark's fill; the
   * mark itself (rendered hidden, see claimsTargetMark) is revealed the
   * moment its last piece lands and the mosaic is complete, which is also the
   * moment the seams disappear.
   */
  _combinePieces() {
    const snap = this._snapshot
    /** @type {any} */
    const baseEl = this.w.globals.dom?.baseEl
    if (!snap || !snap.sourceDots || !snap.keyOrder || !baseEl) {
      return this._revealPieceHidden()
    }

    // The incoming marks, keyed `${realIndex}:${j}` with every path element
    // that makes the mark up (a boxPlot draws two per category).
    const targets = this._collectTargetMarks(snap.toType)
    if (!targets.size) return this._revealPieceHidden()

    // Old-chart dot coordinates shift into the new chart's local space the
    // same way every captured path does (see getInitialPathFor).
    const dx = snap.oldLayout.translateX - (this.w.layout.translateX || 0)
    const dy = snap.oldLayout.translateY - (this.w.layout.translateY || 0)

    const clusterIdx = Array.from(snap.sourceDots.keys()).sort((a, b) => a - b)

    const layer = this._makePieceLayer()
    if (!layer) return this._revealPieceHidden()
    const doc = layer.ownerDocument

    /** @type {import('./MorphPieces').Piece[]} */
    const pieces = []

    for (let k = 0; k < clusterIdx.length; k++) {
      const dots = /** @type {any[]} */ (snap.sourceDots.get(clusterIdx[k]))
      const key = snap.keyOrder[k]
      const target = key ? targets.get(key) : null
      if (!target || !dots || !dots.length) {
        // A mark with no incoming dots (or dots with no mark) has no pieces;
        // whatever was hidden for it must still show.
        if (target) {
          target.els.forEach((/** @type {any} */ el) => {
            el.removeAttribute('opacity')
            el.removeAttribute('data-piece-hidden')
          })
        }
        continue
      }

      const markFill =
        target.fill && target.fill.indexOf('url(') !== 0
          ? target.fill
          : this.w.globals.colors?.[target.realIndex] || dots[0].fill

      const cells = sortByHilbert(
        gridDivideRect(target.bbox, dots.length),
        (c) => [c.x + c.width / 2, c.y + c.height / 2],
      )
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y])

      // Landed-piece bookkeeping: the mark reveals when ALL of its pieces are
      // down, and its tiles leave together, so the mosaic holds until the
      // moment it becomes the solid mark.
      const markState = { remaining: ordered.length, els: target.els, tiles: /** @type {any[]} */ ([]) }

      for (let m = 0; m < ordered.length; m++) {
        const dot = ordered[m]
        const cell = cells[m]
        const el = doc.createElementNS('http://www.w3.org/2000/svg', 'rect')
        const fx = dot.x + dx - dot.r
        const fy = dot.y + dy - dot.r
        // Which incoming mark this piece tiles; diagnostics and tests key on it.
        el.setAttribute('data-key', key)
        el.setAttribute('x', String(fx))
        el.setAttribute('y', String(fy))
        el.setAttribute('width', String(dot.r * 2))
        el.setAttribute('height', String(dot.r * 2))
        el.setAttribute('rx', String(dot.r))
        el.setAttribute('fill', String(dot.fill || markFill))
        layer.appendChild(el)
        markState.tiles.push(el)
        pieces.push({
          el,
          from: { x: fx, y: fy, width: dot.r * 2, height: dot.r * 2, rx: dot.r },
          to: { x: cell.x, y: cell.y, width: cell.width, height: cell.height, rx: 0 },
          fill: makeColorLerp(dot.fill, markFill),
          fillEnd: String(markFill),
          delay: 0,
          meta: { markState },
        })
      }
    }

    if (!pieces.length) return this._cancelPieces()

    this._runPieces(pieces, (piece) => {
      const state = piece.meta.markState
      state.remaining--
      if (state.remaining === 0) {
        state.els.forEach((/** @type {any} */ el) => {
          el.removeAttribute('opacity')
          el.removeAttribute('data-piece-hidden')
        })
        state.tiles.forEach((/** @type {any} */ t) => {
          if (t.parentNode) t.parentNode.removeChild(t)
        })
      }
    })
  }

  /**
   * Stagger and start a piece run. Delays sweep the (already spatially
   * sorted) list front to back, and the last piece still lands within the
   * configured morph speed.
   *
   * @param {import('./MorphPieces').Piece[]} pieces
   * @param {(piece: import('./MorphPieces').Piece) => void} onPieceDone
   */
  _runPieces(pieces, onPieceDone) {
    const speed = this.getSpeed()
    const stagger = Math.min(PIECE_STAGGER_MAX, speed * 0.35)
    const flight = Math.max(180, speed - stagger)
    for (let k = 0; k < pieces.length; k++) {
      pieces[k].delay = pieces.length > 1 ? (k / (pieces.length - 1)) * stagger : 0
    }
    this._pieceCancel = runPieceTween({
      pieces,
      duration: flight,
      onPieceDone,
      onAllDone: () => {
        this._pieceCancel = null
        this._cancelPieces()
      },
    })
  }

  /**
   * The incoming chart's marks, read live: every `path[pathTo]` grouped into
   * one mark per (realIndex, j), with the union bbox of its final geometry.
   * Bar marks are one path each; summary marks (boxPlot, violin) may be
   * several, walked exactly like the capture branch walks the outgoing ones.
   *
   * @param {string} toType
   * @returns {Map<string, { realIndex: number, j: number, bbox: {x:number,y:number,width:number,height:number}, fill: string|null, els: any[] }>}
   */
  _collectTargetMarks(toType) {
    /** @type {any} */
    const baseEl = this.w.globals.dom?.baseEl
    /** @type {Map<string, any>} */
    const out = new Map()
    if (!baseEl) return out

    const fam = familyOf(toType)
    const wrapClass =
      fam === 'summary'
        ? `.apexcharts-${toType}-series`
        : '.apexcharts-bar-series'

    baseEl
      .querySelectorAll(`${wrapClass} .apexcharts-series`)
      .forEach((/** @type {any} */ group) => {
        const realIndex =
          parseInt(group.getAttribute('data:realIndex') ?? '0', 10) || 0
        let order = 0
        group
          .querySelectorAll('path[pathTo]')
          .forEach((/** @type {any} */ p) => {
            const d = p.getAttribute('pathTo') || p.getAttribute('d')
            if (!d || !d.trim()) return
            // Summary paths carry their category on `j`; bar paths are read in
            // draw order, which is the same order the mapping was keyed in.
            const jAttr = parseInt(p.getAttribute('j') ?? '', 10)
            const j = isNaN(jAttr) ? order++ : jAttr
            const box = this._pathBBox(d)
            if (!box) return
            const key = `${realIndex}:${j}`
            const prev = out.get(key)
            if (prev) {
              prev.els.push(p)
              prev.bbox = {
                x: Math.min(prev.bbox.x, box.minX),
                y: Math.min(prev.bbox.y, box.minY),
                width:
                  Math.max(prev.bbox.x + prev.bbox.width, box.maxX) -
                  Math.min(prev.bbox.x, box.minX),
                height:
                  Math.max(prev.bbox.y + prev.bbox.height, box.maxY) -
                  Math.min(prev.bbox.y, box.minY),
              }
            } else {
              out.set(key, {
                realIndex,
                j,
                bbox: {
                  x: box.minX,
                  y: box.minY,
                  width: box.maxX - box.minX,
                  height: box.maxY - box.minY,
                },
                fill: p.getAttribute('fill'),
                els: [p],
              })
            }
          })
      })

    return out
  }

  /**
   * Walk the outgoing chart's DOM and collect path `d` strings keyed by
   * (realIndex, j). The selectors are scoped to the chart family — bar
   * elements have `pathTo` set; pie/radial elements use their final `d`.
   *
   * @param {string} fromType
   * @returns {{ marks: Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>, branches: Array<{ key: string, d: string, fill: string|null }>, unitDots: Map<number, Array<{x:number,y:number,r:number,fill:string|null}>> }}
   */
  _captureFromDOM(fromType) {
    /** @type {any} */
    const baseEl = this.w.globals.dom?.baseEl
    if (!baseEl) return { marks: [], branches: [], unitDots: new Map() }

    /** @type {Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>} */
    const captured = []
    // Non-leaf marks (treemap containers / sunburst inner rings). Only usable
    // when both charts carry branch keys, so they travel separately.
    /** @type {Array<{ key: string, d: string, fill: string|null }>} */
    const branches = []
    // Per-dot records when the outgoing chart is a unit chart, keyed by
    // cluster index. Only the unit branch fills this.
    /** @type {Map<number, Array<{x:number,y:number,r:number,fill:string|null}>>} */
    const unitDots = new Map()
    const fam = familyOf(fromType)

    if (fam === 'bar') {
      const seriesNodes = baseEl.querySelectorAll(
        '.apexcharts-bar-series .apexcharts-series',
      )
      seriesNodes.forEach((/** @type {Element} */ seriesNode) => {
        const realIndex = parseInt(
          seriesNode.getAttribute('data:realIndex') ?? '0',
          10,
        )
        const paths = seriesNode.querySelectorAll('path[pathTo]')
        paths.forEach((/** @type {Element} */ p, /** @type {number} */ j) => {
          const d = p.getAttribute('pathTo') || p.getAttribute('d')
          if (!d) return
          captured.push({
            realIndex,
            j,
            d,
            fill: p.getAttribute('fill'),
          })
        })
      })
    } else if (fam === 'summary') {
      // A summary mark is not reliably one path. Measured: a boxPlot draws TWO
      // per category (the box and the whisker line) and a violin draws one, and
      // neither stamps the `i` attribute the bar branch reads, so the series
      // index comes off the enclosing group instead.
      //
      // The paths belonging to one mark are concatenated into a single
      // multi-subpath `d`, which makes _pathBBox return the union of their
      // extents for free. Taking only the first would give an explode covering
      // the box but not its whiskers. Concatenation is safe precisely BECAUSE
      // this family pairs only with unit (see canMorphTypes): the unit renderer
      // reads slots off the bounding box and never interpolates the `d`, so the
      // combined path is never asked to be a shape.
      /** @type {Map<string, {realIndex: number, j: number, d: string, fill: string|null}>} */
      const byMark = new Map()
      baseEl
        .querySelectorAll(`.apexcharts-${fromType}-area`)
        .forEach((/** @type {any} */ p) => {
          const j = parseInt(p.getAttribute('j') ?? '', 10)
          if (isNaN(j)) return
          const d = p.getAttribute('pathTo') || p.getAttribute('d')
          if (!d || !d.trim()) return
          const group =
            typeof p.closest === 'function' ? p.closest('.apexcharts-series') : null
          const realIndex =
            parseInt(group?.getAttribute('data:realIndex') ?? '0', 10) || 0
          const key = `${realIndex}:${j}`
          const prev = byMark.get(key)
          if (prev) prev.d += ` ${d}`
          else byMark.set(key, { realIndex, j, d, fill: p.getAttribute('fill') })
        })

      Array.from(byMark.values())
        .sort((a, b) => a.realIndex - b.realIndex || a.j - b.j)
        .forEach((m) => captured.push(m))
    } else if (fam === 'partition') {
      if (fromType === 'treemap') {
        // Tiles are <rect>s, and the morph engine interpolates path data, so
        // each one is emitted as the equivalent closed rectangle path.
        //
        // Containers are captured too, so a nested treemap can hand a sunburst
        // its inner rings rather than leaving them to appear from nothing. They
        // only pair up when both sides carry a branch key (see _buildMapping);
        // a positional fallback would misalign every leaf, so containers are
        // kept in a separate list and dropped unless keys are usable.
        /** @type {(el: Element) => string|null} */
        const rectPath = (el) => {
          const x = parseFloat(el.getAttribute('x') ?? '')
          const y = parseFloat(el.getAttribute('y') ?? '')
          const width = parseFloat(el.getAttribute('width') ?? '')
          const height = parseFloat(el.getAttribute('height') ?? '')
          if (![x, y, width, height].every((v) => isFinite(v))) return null
          return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`
        }

        const tiles = baseEl.querySelectorAll('.apexcharts-treemap-rect')
        tiles.forEach((/** @type {Element} */ t) => {
          const d = rectPath(t)
          if (!d) return
          captured.push({
            realIndex: parseInt(t.getAttribute('i') ?? '0', 10) || 0,
            j: parseInt(t.getAttribute('j') ?? '0', 10) || 0,
            d,
            fill: t.getAttribute('fill'),
            key: t.getAttribute('data:key') || null,
          })
        })

        const containers = baseEl.querySelectorAll(
          '.apexcharts-treemap-parent-rect',
        )
        containers.forEach((/** @type {Element} */ c) => {
          const d = rectPath(c)
          const key = c.getAttribute('data:key')
          if (!d || !key) return
          branches.push({ key, d, fill: c.getAttribute('fill') })
        })
      } else {
        // Sunburst arcs are already paths. Only LEAVES are captured: they are
        // the level a flat partition can correspond to, and taking every ring
        // would hand a treemap's tiles their own ancestors.
        const arcs = baseEl.querySelectorAll('.apexcharts-sunburst-arc')
        /** @type {Element[]} */
        const leaves = []
        arcs.forEach((/** @type {Element} */ a) => {
          if (a.getAttribute('data:leaf') === 'true') leaves.push(a)
        })
        const source = leaves.length ? leaves : Array.from(arcs)
        source.forEach((/** @type {Element} */ a, /** @type {number} */ i) => {
          const d = a.getAttribute('d')
          // A zoomed-out or collapsed arc carries an empty `d`.
          if (!d || !d.trim()) return
          captured.push({
            realIndex: i,
            j: 0,
            d,
            fill: a.getAttribute('fill'),
            key: a.getAttribute('data:key') || null,
          })
        })

        // The inner rings, for the level-aware pairing. Leaves are already in
        // `captured`, so this is every arc that is not one.
        arcs.forEach((/** @type {Element} */ a) => {
          if (a.getAttribute('data:leaf') === 'true') return
          const d = a.getAttribute('d')
          const key = a.getAttribute('data:key')
          if (!d || !d.trim() || !key) return
          branches.push({ key, d, fill: a.getAttribute('fill') })
        })
      }
    } else if (fam === 'unit') {
      // A unit chart is N objects per cluster, not one mark per cluster, so
      // there is no path to hand the incoming bar or wedge. Capture where each
      // cluster's dots actually sat and synthesise the rect they filled: the
      // incoming mark then grows out of its own dot cloud, which is the mirror
      // of the burst that brought the dots out of it.
      const dots = baseEl.querySelectorAll('.apexcharts-unit-area')
      /** @type {Map<number, {minX:number,minY:number,maxX:number,maxY:number,fill:string|null}>} */
      const boxes = new Map()
      dots.forEach((/** @type {Element} */ dot) => {
        const i = parseInt(dot.getAttribute('i') ?? '', 10)
        if (isNaN(i)) return
        // Circles carry cx/cy; square / image dots carry their top-left x/y.
        const cxAttr = dot.getAttribute('cx')
        let x
        let y
        let r = 3
        if (cxAttr != null) {
          x = parseFloat(cxAttr)
          y = parseFloat(dot.getAttribute('cy') ?? '')
          r = parseFloat(dot.getAttribute('r') ?? '3') || 3
        } else {
          const wAttr = parseFloat(dot.getAttribute('width') ?? '0') || 0
          const hAttr = parseFloat(dot.getAttribute('height') ?? '0') || 0
          x = parseFloat(dot.getAttribute('x') ?? '') + wAttr / 2
          y = parseFloat(dot.getAttribute('y') ?? '') + hAttr / 2
          r = Math.max(wAttr, hAttr) / 2 || 3
        }
        if (!isFinite(x) || !isFinite(y)) return
        // The per-dot record, for the piece layer: when the target can be
        // tiled, each of these dots flies to its own cell of the incoming mark
        // instead of vanishing with the teardown.
        let list = unitDots.get(i)
        if (!list) {
          list = []
          unitDots.set(i, list)
        }
        list.push({ x, y, r, fill: dot.getAttribute('fill') })
        const box = boxes.get(i)
        if (!box) {
          boxes.set(i, {
            minX: x,
            minY: y,
            maxX: x,
            maxY: y,
            fill: dot.getAttribute('fill'),
          })
          return
        }
        if (x < box.minX) box.minX = x
        if (x > box.maxX) box.maxX = x
        if (y < box.minY) box.minY = y
        if (y > box.maxY) box.maxY = y
      })

      Array.from(boxes.keys())
        .sort((a, b) => a - b)
        .forEach((i) => {
          const b = /** @type {any} */ (boxes.get(i))
          // A single-dot cluster has a zero-area box; give it the width of one
          // dot so the incoming mark has something to grow from.
          const pad = 2
          const x1 = b.minX - pad
          const y1 = b.minY - pad
          const x2 = b.maxX + pad
          const y2 = b.maxY + pad
          captured.push({
            realIndex: i,
            j: 0,
            d: `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`,
            fill: b.fill,
          })
        })
    } else if (fam === 'radial') {
      // `gauge` is an alias for radialBar (see Config.normalizeAliasedChartType),
      // so it captures from the same selector / arc-shape.
      if (fromType === 'radialBar' || fromType === 'gauge') {
        // radialBar paths are STROKED open arcs (fill=none, stroke=color,
        // stroke-width ≈ ring thickness). If we hand the raw `d` to a pie/
        // polarArea/donut element (which fills, not strokes), the implicit
        // chord fill renders as a thin pie-slice — not the visible thick ring.
        // So we transform each captured arc into an equivalent closed
        // donut-segment whose FILLED rendering visually matches the
        // outgoing radialBar's stroked appearance.
        const centerX = this.w.layout.gridWidth / 2
        const centerY =
          Math.min(this.w.layout.gridWidth, this.w.layout.gridHeight) / 2
        const rings = baseEl.querySelectorAll(
          '.apexcharts-radial-series .apexcharts-radialbar-area',
        )
        rings.forEach((/** @type {Element} */ p) => {
          const parent = /** @type {Element|null} */ (p.parentElement)
          const realIndex = parseInt(
            parent?.getAttribute('data:realIndex') ?? '0',
            10,
          )
          const rawD = p.getAttribute('d')
          if (!rawD) return
          const strokeWidth = parseFloat(p.getAttribute('stroke-width') || '0')
          const d =
            strokeWidth > 1
              ? this._radialArcToFilledSegment(
                  rawD,
                  strokeWidth,
                  centerX,
                  centerY,
                ) || rawD
              : rawD
          captured.push({
            realIndex,
            j: 0,
            d,
            fill: p.getAttribute('stroke'),
          })
        })
      } else {
        // pie / donut / polarArea
        const slices = baseEl.querySelectorAll(
          '.apexcharts-pie-series .apexcharts-pie-area',
        )
        slices.forEach(
          (/** @type {Element} */ p, /** @type {number} */ i) => {
            const d = p.getAttribute('d')
            if (!d) return
            captured.push({
              realIndex: i,
              j: 0,
              d,
              fill: p.getAttribute('fill'),
            })
          },
        )
      }
    }

    return { marks: captured, branches, unitDots }
  }

  /**
   * Convert a radialBar's stroked open-arc `d` ("M x1 y1 A r r 0 large sweep
   * x2 y2") into a closed donut-segment polygon whose FILLED rendering
   * visually matches the original stroked arc — needed because the morph
   * target (pie/donut/polarArea) renders by fill, not stroke. Returns null
   * if the input doesn't match the expected M-then-A shape.
   *
   * @param {string} rawD
   * @param {number} strokeWidth
   * @param {number} centerX
   * @param {number} centerY
   * @returns {string | null}
   */
  _radialArcToFilledSegment(rawD, strokeWidth, centerX, centerY) {
    const m = rawD.match(
      /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+A\s*(-?[\d.]+)\s+(?:-?[\d.]+)\s+(?:-?[\d.]+)\s+(\d)\s+(\d)\s+(-?[\d.]+)\s+(-?[\d.]+)/,
    )
    if (!m) return null
    const x1 = parseFloat(m[1])
    const y1 = parseFloat(m[2])
    const r = parseFloat(m[3])
    const large = parseInt(m[4], 10)
    const sweep = parseInt(m[5], 10)
    const x2 = parseFloat(m[6])
    const y2 = parseFloat(m[7])
    if (!isFinite(r) || r <= 0) return null

    const half = strokeWidth / 2
    const rOuter = r + half
    const rInner = Math.max(0, r - half)

    // Project a point on the ring radius `r` onto a new radius around (cx, cy).
    const proj = (
      /** @type {number} */ px,
      /** @type {number} */ py,
      /** @type {number} */ newR,
    ) => {
      const dx = px - centerX
      const dy = py - centerY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist === 0) return { x: centerX, y: centerY }
      const k = newR / dist
      return { x: centerX + dx * k, y: centerY + dy * k }
    }

    const o1 = proj(x1, y1, rOuter)
    const o2 = proj(x2, y2, rOuter)
    const i1 = proj(x1, y1, rInner)
    const i2 = proj(x2, y2, rInner)
    // Inner arc traverses in the opposite sweep direction so the segment closes.
    const sweepBack = sweep ? 0 : 1

    return (
      `M ${o1.x} ${o1.y} ` +
      `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${o2.x} ${o2.y} ` +
      `L ${i2.x} ${i2.y} ` +
      `A ${rInner} ${rInner} 0 ${large} ${sweepBack} ${i1.x} ${i1.y} Z`
    )
  }

  /**
   * Build a closed donut-segment path for the given polar arc geometry. Used
   * by Radial.drawArcs when morphing FROM a filled wedge (pie/donut/polarArea)
   * TO a radialBar arc: the final radialBar is rendered as a stroked open arc,
   * but during the morph we tween d toward this closed-segment form (which
   * looks identical to the stroked arc when filled with the same color) so
   * the in-between frames remain visually consistent filled shapes rather
   * than a thick-outlined wedge.
   *
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} ringRadius - centerline radius of the radialBar ring
   * @param {number} strokeWidth - the ring's stroke thickness
   * @param {number} startAngleDeg - in degrees, 0° = top (12 o'clock)
   * @param {number} endAngleDeg
   * @returns {string}
   */
  buildRingSegmentPath(
    centerX,
    centerY,
    ringRadius,
    strokeWidth,
    startAngleDeg,
    endAngleDeg,
  ) {
    const halfStroke = strokeWidth / 2
    const rOuter = ringRadius + halfStroke
    const rInner = Math.max(0, ringRadius - halfStroke)
    const sRad = ((startAngleDeg - 90) * Math.PI) / 180
    const eRad = ((endAngleDeg - 90) * Math.PI) / 180

    const oStart = {
      x: centerX + rOuter * Math.cos(sRad),
      y: centerY + rOuter * Math.sin(sRad),
    }
    const oEnd = {
      x: centerX + rOuter * Math.cos(eRad),
      y: centerY + rOuter * Math.sin(eRad),
    }
    const iStart = {
      x: centerX + rInner * Math.cos(sRad),
      y: centerY + rInner * Math.sin(sRad),
    }
    const iEnd = {
      x: centerX + rInner * Math.cos(eRad),
      y: centerY + rInner * Math.sin(eRad),
    }
    const sweep = endAngleDeg > startAngleDeg ? 1 : 0
    const large = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0

    return (
      `M ${oStart.x} ${oStart.y} ` +
      `A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${oEnd.x} ${oEnd.y} ` +
      `L ${iEnd.x} ${iEnd.y} ` +
      `A ${rInner} ${rInner} 0 ${large} ${1 - sweep} ${iStart.x} ${iStart.y} Z`
    )
  }

  /**
   * @returns {string | null} the chart-type the active snapshot was captured
   *   from, or null when no morph is in flight.
   */
  getFromType() {
    return this._snapshot ? this._snapshot.fromType : null
  }

  /**
   * Build a (targetKey → captured) map. The targetKey matches the lookup
   * pattern each chart-type renderer uses when it asks
   * `getInitialPathFor(realIndex, j)`.
   *
   * Strategy: flatten the captured items into a linear sequence (matching the
   * source chart's natural DOM iteration order: series-then-point for bar,
   * ring-by-ring for radial), then walk the target's iteration positions in
   * the same order and pair them up 1:1. This handles every supported shape
   * without per-pair branching:
   *
   *   - bar (1 series, N pts) ↔ radial-family (N items)  → linear[k] ↔ k
   *   - bar (M series, 1 pt)  ↔ radial-family (M items)  → linear[k] ↔ k
   *   - radial-family (N items) ↔ bar (any matching shape) → linear[k] ↔ flat target
   *   - radial-family ↔ radial-family                    → linear[k] ↔ k
   *
   * @param {Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>} captured
   * @param {string} _fromType
   * @param {string} toType
   * @param {any} newSeries - the series array being passed to the new chart;
   *   used only to derive the bar target's (realIndex, j) iteration positions.
   * @param {Array<{ key: string, d: string, fill: string|null }>} [branches]
   *   non-leaf marks, for the key-based partition pairing.
   */
  _buildMapping(captured, _fromType, toType, newSeries, branches) {
    /** @type {Map<string, { d: string, fill: string|null }>} */
    const map = new Map()
    const tf = familyOf(toType)

    // Sort to a stable linear order. DOM order already gives us this for the
    // capture selectors we use, but a defensive sort makes the algorithm
    // robust to future selector changes.
    const flat = captured
      .slice()
      .sort((a, b) => a.realIndex - b.realIndex || a.j - b.j)

    // Partition -> partition, with a branch key on both sides: pair by the
    // branch each mark stands for rather than by draw order, so a sector keeps
    // its identity and every level tweens instead of only the leaves. Keyed
    // entries live in their own namespace so a positional lookup can still fall
    // through when a chart has no keys (a flat treemap, an older config).
    if (tf === 'partition' && branches && branches.length) {
      const keyedMarks = flat.filter((c) => c.key)
      if (keyedMarks.length === flat.length) {
        keyedMarks.forEach((c) => {
          map.set(`key:${c.key}`, { d: c.d, fill: c.fill })
        })
        branches.forEach((br) => {
          map.set(`key:${br.key}`, { d: br.d, fill: br.fill })
        })
      }
    }

    if (tf === 'radial' || tf === 'unit' || tf === 'partition') {
      // pie / donut / polarArea / radialBar iterate i = 0..N-1 with j=0. unit
      // clusters iterate the same way (one cluster per category), reading the
      // captured shape's centre rather than its `d`. treemap tiles and sunburst
      // leaves have no (realIndex, j) grid at all and pair up by draw order,
      // which this same index keying gives them (see getInitialPathAt).
      flat.forEach((c, i) => {
        map.set(`${i}:0`, { d: c.d, fill: c.fill })
      })
      return map
    }

    if (tf === 'bar' || tf === 'summary') {
      // Derive the target's iteration positions from newSeries: each
      // `{ data: number[] }` entry produces (realIndex=seriesIdx, j=k) tuples.
      // boxPlot and violin iterate the same grid through Bar's renderSeries,
      // so one branch serves both.
      /** @type {Array<{ realIndex: number, j: number }>} */
      const positions = []
      const series = Array.isArray(newSeries) ? newSeries : []
      series.forEach((/** @type {any} */ s, /** @type {number} */ seriesIdx) => {
        const data = s && Array.isArray(s.data) ? s.data : []
        for (let j = 0; j < data.length; j++) {
          positions.push({ realIndex: seriesIdx, j })
        }
      })
      flat.forEach((c, i) => {
        const pos = positions[i]
        if (pos) {
          map.set(`${pos.realIndex}:${pos.j}`, { d: c.d, fill: c.fill })
        }
      })
      return map
    }

    return map
  }

  isActive() {
    return this._snapshot !== null
  }

  /**
   * @param {number|string} realIndex
   * @param {number|string} j
   * @returns {string | null}
   */
  getInitialPathFor(realIndex, j) {
    if (!this._snapshot) return null
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`)
    if (!entry) return null

    // Shift the captured d into the OLD chart's screen position. The
    // captured coords are in the OLD elGraphical's translate space, but the
    // new chart's elGraphical has its own translateX/Y (different e.g. when
    // bar reserves yaxis space and radialBar doesn't). Without this offset
    // the morphFrom would render at the new chart's translate — producing a
    // visible position jump at t=0. The morph engine then interpolates the
    // shifted morphFrom toward the new-space target, so both the shape and
    // the position transition as one continuous tween.
    const dx =
      this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0)
    const dy =
      this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0)
    return dx === 0 && dy === 0 ? entry.d : this._translatePathD(entry.d, dx, dy)
  }

  /**
   * Offset every absolute coordinate in an SVG path `d` by (dx, dy).
   *
   * Assumes the path uses only uppercase (absolute) commands — every path
   * ApexCharts generates does. Relative-command paths would pass through
   * unchanged at the lowercase, which is also semantically correct (deltas
   * don't shift under a parent translate).
   *
   * @param {string} d
   * @param {number} dx
   * @param {number} dy
   * @returns {string}
   */
  _translatePathD(d, dx, dy) {
    if (dx === 0 && dy === 0) return d
    const commands = parsePath(d)
    return commands
      .map(/** @param {any[]} c */ (c) => {
        const cmd = c[0]
        if (cmd === 'Z') return 'Z'
        if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
          return `${cmd} ${c[1] + dx} ${c[2] + dy}`
        }
        if (cmd === 'H') return `${cmd} ${c[1] + dx}`
        if (cmd === 'V') return `${cmd} ${c[1] + dy}`
        if (cmd === 'C') {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy} ${c[5] + dx} ${c[6] + dy}`
        }
        if (cmd === 'S' || cmd === 'Q') {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy}`
        }
        if (cmd === 'A') {
          // rx, ry, rotation, large-arc, sweep stay; only the final (x, y) shifts
          return `${cmd} ${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6] + dx} ${c[7] + dy}`
        }
        return c.join(' ')
      })
      .join(' ')
  }

  /**
   * The centre point (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. Kept for callers that only need a point; the unit renderer
   * uses getInitialBBoxFor so its dots fill the shape rather than stack on a
   * single point.
   * @param {number} i
   * @returns {{ x: number, y: number } | null}
   */
  getInitialCenterFor(i) {
    const box = this.getInitialBBoxFor(i)
    if (!box) return null
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
  }

  /**
   * The `k`-th captured path in draw order, already shifted into the NEW
   * chart's coordinate space.
   *
   * For marks that pair up by position rather than by a (series, point) grid:
   * a treemap's tiles and a sunburst's leaves are each one mark per row, laid
   * out in the same reading order, so the k-th of one becomes the k-th of the
   * other.
   *
   * @param {number} k
   * @returns {string | null}
   */
  getInitialPathAt(k) {
    return this.getInitialPathFor(k, 0)
  }

  /**
   * The captured shape for a branch identity (charts/common/Hierarchy.morphKey),
   * or null when the outgoing chart had no mark for that branch.
   *
   * This is what lets a partition morph pair at every level: a sector, an
   * industry and a company each find the arc or tile that stood for the same
   * branch, instead of leaves pairing by draw order while the containers pop.
   *
   * @param {string} key
   * @returns {string | null}
   */
  getInitialPathForKey(key) {
    if (!this._snapshot || !key) return null
    return this.getInitialPathFor('key', key)
  }

  /** True when the active snapshot can pair by branch key. */
  hasKeyedMarks() {
    if (!this._snapshot) return false
    for (const k of this._snapshot.mapping.keys()) {
      if (typeof k === 'string' && k.startsWith('key:')) return true
    }
    return false
  }

  /**
   * Where the `j`-th of `n` objects in cluster `i` starts, INSIDE the shape it
   * came out of.
   *
   * An aggregate mark stands for a quantity, and its extent is that quantity: a
   * bar of height h representing n units gives its k-th unit the height
   * fraction (k + 0.5)/n. So a bar does not spray its dots from a single point,
   * it comes apart along its own length, bottom-up, and each dot leaves from
   * the part of the bar that was standing for it. The reverse direction reads
   * the same geometry, so explode and collapse are inverses.
   *
   * The distribution follows the captured shape's LONGER axis, which is what
   * makes one function serve both marks: a bar's box is tall and thin, so the
   * dots leave in a column; a wedge's box is squat, so they leave in a row
   * across it.
   *
   * @param {number} i - cluster index
   * @param {number} j - the object's rank within its cluster
   * @param {number} n - objects in the cluster
   * @returns {{ x: number, y: number } | null}
   */
  getInitialSlotFor(i, j, n) {
    const box = this.getInitialBBoxFor(i)
    if (!box) return null

    const cx = box.x + box.width / 2
    const cy = box.y + box.height / 2
    if (!(n > 1) || !(j >= 0)) return { x: cx, y: cy }

    const t = (Math.min(j, n - 1) + 0.5) / n
    if (box.height >= box.width) {
      // Tall: bottom-up, so the first unit leaves from the bar's base.
      return { x: cx, y: box.y + box.height * (1 - t) }
    }
    return { x: box.x + box.width * t, y: cy }
  }

  /**
   * The bounding box (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. `getInitialSlotFor` distributes a cluster's objects across
   * this box as their start positions, so a tall bar visibly breaks apart into
   * a tall column of dots that then swarm into the cluster.
   * @param {number} i
   * @returns {{ x: number, y: number, width: number, height: number } | null}
   */
  getInitialBBoxFor(i) {
    if (!this._snapshot) return null
    const entry = this._snapshot.mapping.get(`${i}:0`)
    if (!entry) return null
    const box = this._pathBBox(entry.d)
    if (!box) return null
    // Same OLD -> NEW translate shift getInitialPathFor applies (see there).
    const dx =
      this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0)
    const dy =
      this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0)
    return {
      x: box.minX + dx,
      y: box.minY + dy,
      width: box.maxX - box.minX,
      height: box.maxY - box.minY,
    }
  }

  /**
   * Bounding box of an absolute-command SVG path `d`. Good enough as the burst
   * footprint (we only need where the shape sat, not exact geometry).
   * @param {string} d
   * @returns {{ minX:number, minY:number, maxX:number, maxY:number } | null}
   */
  _pathBBox(d) {
    const commands = parsePath(d)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    let seen = false
    commands.forEach(/** @param {any[]} c */ (c) => {
      const cmd = c[0]
      if (cmd === 'Z') return
      // Walk the numeric args in (x, y) pairs; for A the final pair is (x, y),
      // the leading radii/flags are not coordinates, so read from the end.
      /** @type {Array<[number, number]>} */
      let pairs = []
      if (cmd === 'H') pairs = [[c[1], (minY + maxY) / 2 || c[1]]]
      else if (cmd === 'V') pairs = [[(minX + maxX) / 2 || c[1], c[1]]]
      else if (cmd === 'A') pairs = [[c[6], c[7]]]
      else {
        for (let k = 1; k + 1 < c.length; k += 2) pairs.push([c[k], c[k + 1]])
      }
      pairs.forEach(([x, y]) => {
        if (!isFinite(x) || !isFinite(y)) return
        seen = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      })
    })
    if (!seen) return null
    return { minX, minY, maxX, maxY }
  }

  /**
   * @param {number} realIndex
   * @param {number} j
   * @returns {string | null}
   */
  getInitialFillFor(realIndex, j) {
    if (!this._snapshot) return null
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`)
    return entry ? entry.fill : null
  }

  /** @returns {number} */
  getSpeed() {
    const animCfg = this.w.config.chart.animations
    return (
      (animCfg.chartTypeMorph && animCfg.chartTypeMorph.speed) ||
      animCfg.speed ||
      600
    )
  }

  /**
   * Fade newly-mounted axes / grid / legend / titles from opacity 0 → 1 in
   * parallel with the morph. Without this the chart's chrome would pop in
   * abruptly while the series elements are still mid-tween, which reads as a
   * jarring layout shift.
   */
  applyChromeFade() {
    if (!this._snapshot || !Environment.isBrowser()) return
    /** @type {any} */
    const baseEl = this.w.globals.dom?.baseEl
    if (!baseEl) return

    // The incoming chart exists now, so the outgoing marks captured before
    // the teardown finally have something to leave over. Pieces when the pair
    // can conserve its ink; the ghost fade otherwise; nothing at all for
    // pairs that inherit their shapes (see _needsGhost).
    if (this._snapshot.pieceOut) this._separatePieces()
    else if (this._snapshot.pieceIn) this._combinePieces()
    else this._mountGhost()

    const speed = this.getSpeed()
    const chromeSelectors = [
      '.apexcharts-xaxis',
      '.apexcharts-yaxis',
      '.apexcharts-grid',
      '.apexcharts-gridlines-horizontal',
      '.apexcharts-gridlines-vertical',
      '.apexcharts-legend',
      '.apexcharts-title-text',
      '.apexcharts-subtitle-text',
    ]
    chromeSelectors.forEach((sel) => {
      baseEl
        .querySelectorAll(sel)
        .forEach((/** @type {any} */ el) => {
          if (!el.style) return
          el.style.opacity = '0'
          el.style.transition = `opacity ${speed}ms ease-out`
          BrowserAPIs.requestAnimationFrame(() => {
            el.style.opacity = '1'
          })
          setTimeout(() => {
            el.style.transition = ''
            el.style.opacity = ''
          }, speed + 80)
        })
    })

    setTimeout(() => this.cleanup(), speed + 100)
  }

  cleanup() {
    this._snapshot = null
    this._removeGhost()
    // Belt and braces for the piece layer: normally it has already finished
    // and detached itself, but a throttled tab can leave it mid-flight, and
    // nothing hidden may survive the transition.
    this._cancelPieces()
  }
}
