// @ts-check
/**
 * Highlight filter: draws each datum's WHOLE value faded and a PART of it
 * solid in front, from the same baseline, in the same slot. The part is data
 * the chart is handed alongside the whole (a dashboard's "filter by" pick
 * leaves part of every value behind), so a pick and a clear are ordinary
 * updates and this module never changes the series the chart has.
 *
 * Data, one form per series:
 *   series[i].data[j] = { x, y, highlight }   per point (wins)
 *   series[i].highlightData = [ ... ]         parallel to data
 *
 * Core reaches this module through null-safe seams only (the lazy
 * `ctx.highlightFilter` getter, `w.highlightData`, one dispatch per bar), so a
 * bundle without the feature pays for those calls and nothing else.
 *
 * Supported here: column, bar (grouped, horizontal, distributed, negative
 * values), stacked column and bar (groups, 100%, diverging stacks), funnel
 * (rectangle, trapezoid, pyramid), line and area with every curve (stacked
 * area included), pie, donut and polarArea, radialBar and the gauge, and
 * treemap (flat and nested). Other types warn once and draw as they always
 * do.
 *
 * @module modules/highlightFilter/HighlightFilter
 */

import Graphics from '../Graphics'
import CoreUtils from '../CoreUtils'
import Series from '../Series'
import Utils from '../../utils/Utils'
import { prefersReducedMotion } from '../Animations'
import DataLabels from '../DataLabels'
import {
  datumKey,
  morphEasing,
  reconcileSeriesPaths,
  seriesJoin,
} from '../animations/LengthTransition'
import {
  detectStreamScroll,
  projectPathToPrevFrame,
} from '../animations/StreamScroll'
import { resolveEasing } from '../animations/Easing'
import { seriesEmitter } from '../../renderers/Renderer'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'
import { Environment } from '../../utils/Environment'
import {
  PART,
  PLAIN,
  COVERED,
  look,
  finite,
  mix,
  isPoint,
  ownOpacity,
  info,
  drawnAt,
  bindHit,
  stripSeries,
  carries,
  slicePoints,
  solid,
} from './util'
import { piePass, CIRCLE } from './PiePart'
import { radialPass, LANE } from './RadialPart'
import { treemapPass, treeParse, treeSeries } from './TreemapPart'

// Two updates in one frame (an updateOptions and an updateSeries from the same
// handler) must both start from what is on screen. Series restores only the
// keys listed in its static HELD array, so the part map joins that list. The
// array is on the shared Series class, so this reaches the core copy.
// The labels on screen (see _captureLabels) are held the same way.
;['prevHighlightParts', 'prevHighlightLabels'].forEach((k) => {
  if (Series.HELD.indexOf(k) === -1) Series.HELD.push(k)
})

const FLIP_X = 'apexcharts-flip-x'
const FLIP_Y = 'apexcharts-flip-y'
const HELD = 'apexcharts-flip-held'
// A label leaving the screen (see _rideLabels): no label pass reads it.
const LABEL_EXIT = 'apexcharts-highlight-label-exit'

// Every family records what it drew in one previous map, so each keys its
// entries under its own prefix: a category named like another family's key
// can never read that family's record.
const BAR = 'b:'
const LINE = 'l:'

/** @typedef {import('./util').Look} Look */

// A line or area whole's looks (see _fadeLine): plain, highlighted (dashed,
// or faded with its outline), and hidden under a part on its exact shape.
const L_PLAIN = { f: 1, o: 0 }
const L_REST = { f: 1, o: 1 }
const L_COVER = { f: 0, o: 1 }

/**
 * Whether a series carries a part, in either form. O(1) per series for the
 * parallel form. In the per-point form only the picked points need the key, so
 * object data is scanned until one has it; numeric and tuple data cannot carry
 * it and stop at the first value.
 * @param {any} s
 */
export function seriesHasHighlight(s) {
  if (!s) return false
  if (Array.isArray(s.highlightData)) return true
  const d = s.data
  if (!Array.isArray(d)) return false
  for (let j = 0; j < d.length; j++) {
    const p = d[j]
    if (isPoint(p)) {
      if ('highlight' in p) return true
    } else if (p != null) return false
  }
  return false
}

/**
 * A datum's part, as handed in: the per-point key wins over the parallel array.
 * @param {any} pt @param {any[] | null} hd @param {number} j
 */
function partAt(pt, hd, j) {
  return isPoint(pt) && 'highlight' in pt ? pt.highlight : hd ? hd[j] : null
}

export default class HighlightFilter {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** What this render drew, keyed by datum: the part path (null where the
     * datum is faded with no part) and the fade. Becomes the previous map at
     * the next capture, and starts empty with every render.
     * Lines and areas also keep the area path (`a`) and its node (`m`), a
     * treemap tile its colour (`col`) and its share and colour as drawn.
     * @type {Map<string, {d: string | null, a?: string | null, f: number, o?: number, base?: string, edge?: boolean, s?: number, flip?: boolean, n?: any, m?: any, c?: boolean, lf?: number, lo?: number, ls?: number, lc?: string, col?: string, run?: boolean, al?: number, la?: number, k?: number, lk?: number}>} */
    this._targets = new Map()
    /** The renderer drawing now; a new one is a new render. @type {any} */
    this._render = null
    /** Datums this render visited, and each series' group by realIndex, so a
     * part whose datum left can exit with its whole. */
    /** @type {Set<string>} */
    this._seen = new Set()
    /** @type {Map<string, any>} */
    this._seriesEls = new Map()
    /** @type {CoreUtils | null} */
    this._cu = null
    /** Per-render stack cursors, see _beginRender. @type {Map<string, any>} */
    this._stk = new Map()
    /**
     * The part stack's rows so far (stacked lines and areas), in series
     * order, as the renderer keeps its wholes'.
     * @type {any[]}
     */
    this._stkPrev = []
    /** The parts' corner states this render (stacked), and whether a part
     * holds a mirror across it. @type {string[][] | null} */
    this._br = null
    this._held = false
    /** @type {Set<string>} */
    this._warned = new Set()
    /** Each series' part row as last parsed, so a legend-hidden series (whose
     * rows read empty) keeps its pick in the signature. */
    /** @type {string[]} */
    this._rows = []
    /** The drill level on screen, so set() and clear() rebuild it rather than
     * the top level. @type {{series: any[], base: any} | null} */
    this._level = null
    /** Fade/exit tweens in flight, so an export can land them first. */
    /** @type {Set<{finish: () => void}>} */
    this._live = new Set()
    /** The parts signature of this parse, and of the last drawn render. */
    this._sig = ''
    this._drawnSig = ''
    // A circle's label rides, started once the render is on screen (see
    // afterRender).
    /** @type {(() => void) | null} */
    this._ride = null
    // A treemap's tiles this render by `${i}|${j}`, and the gradients they
    // are filled with (see TreemapPart).
    /** @type {Map<string, any> | null} */
    this._tiles = null
    /** @type {any[]} */
    this._tmDefs = []
    // What the page set tooltip.enabled to itself (undefined: left to the
    // type), from the chart's own options and then from each update's (see
    // RadialPart); and whether this render turned the tooltip on.
    /** @type {boolean | undefined} */
    this._tipUser = /** @type {any} */ (ctx).opts?.tooltip?.enabled
    this._tipOn = false
    // The radial indicator the last radial render resolved, and the ring
    // and lane last under the pointer (see RadialPart's lanes).
    /** @type {string | undefined} */
    this._ind = undefined
    /** @type {[number, 'part' | 'whole'] | null} */
    this._lane = null

    // highlightFilterChanged fires once the render that changed the pick has
    // been drawn; mounted / updated are that moment for every update path.
    this._onRender = () => this.afterRender()
    ctx.events?.addEventListener('mounted', this._onRender)
    ctx.events?.addEventListener('updated', this._onRender)
  }

  /** @returns {any} */
  get cfg() {
    return this.w.config.highlightFilter || {}
  }

  isActive() {
    return !!this.w.highlightData?.active
  }

  /**
   * The part at a datum, or null.
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   */
  valueAt(seriesIndex, dataPointIndex) {
    // A slice of a circle is its own series and datum: one part per row.
    const v =
      this.w.highlightData?.parts?.[seriesIndex]?.[
        this.w.globals.axisCharts ? dataPointIndex : 0
      ]
    return v == null ? null : v
  }

  /** @param {string} key @param {string} msg */
  _warn(key, msg) {
    if (this._warned.has(key)) return
    this._warned.add(key)
    console.warn('ApexCharts highlightFilter: ' + msg)
  }

  /**
   * Called by Data at the end of every parse (create, update, fastUpdate).
   * Builds `w.highlightData` from the parsed series; never writes config.
   */
  parse() {
    const w = this.w
    const cnf = w.config
    const cfg = this.cfg
    const series = /** @type {any[]} */ (cnf.series || [])
    const values = w.seriesData.series || []
    if (!w.globals.axisCharts) return this._parseCircle()

    const stacked = !!cnf.chart.stacked
    const type = cnf.chart.type
    const bars = type === 'bar'
    // A nested treemap's rows are its leaves, each spread from its datum, so
    // a part on a leaf arrives on its row. The series' own highlightData does
    // not: it is spread onto the leaves unchanged, sized to the top level.
    const nested = treeParse(this, type)

    let present = false
    for (let i = 0; i < series.length; i++) {
      if (
        nested
          ? carries({ data: series[i]?.data })
          : seriesHasHighlight(series[i])
      ) {
        present = true
        break
      }
    }

    let supported =
      w.globals.axisCharts &&
      !w.globals.comboCharts &&
      (bars || type === 'line' || type === 'area' || type === 'treemap') &&
      !w.rangeData.seriesRange.length &&
      // A histogram's rows are bins built from the observations, so a part
      // per observation has no bar of its own to sit on.
      cnf.chart.requestedType !== 'histogram'
    if (present && !supported) this._unsupported()
    // A stack over several y axes has no single extent to stack the parts
    // to, and a log axis stacks the logs of its segments, which a part has no
    // share of. Counted over the axes that carry series: extra entries mapped
    // to the same scale (seriesName repeated, a hidden twin) are one axis.
    const axes = /** @type {number[][]} */ (w.globals.seriesYAxisMap || [])
      .map((s, k) => (s && s.length ? k : -1))
      .filter((k) => k > -1)
    if (
      present &&
      supported &&
      stacked &&
      (axes.length > 1 || axes.some((k) => cnf.yaxis[k]?.logarithmic))
    ) {
      supported = false
      this._warn(
        'stack',
        'parts are not drawn on a stacked chart with more than one y axis or a logarithmic y axis.',
      )
    }
    const active = !!(cfg.enabled !== false && present && supported)

    if (!active) {
      // Nothing reads an inactive chart's parts, so a large chart that only
      // shares a page with the feature pays nothing per point here.
      this._inactive(supported)
      return
    }

    /** @type {(number|null)[][]} */
    const parts = []
    let mismatch = false
    const gl = w.globals
    for (let i = 0; i < values.length; i++) {
      const s = series[i] || {}
      const data = Array.isArray(s.data) ? s.data : []
      const hd =
        !nested && Array.isArray(s.highlightData) ? s.highlightData : null
      // A legend-hidden series is parsed with its data emptied, which is not
      // a length the page handed in.
      const collapsed =
        gl.collapsedSeriesIndices.indexOf(i) > -1 ||
        gl.ancillaryCollapsedSeriesIndices.indexOf(i) > -1
      if (hd && !collapsed && hd.length !== data.length) mismatch = true
      const row = []
      const n = values[i] ? values[i].length : 0
      for (let j = 0; j < n; j++) {
        const v = partAt(data[j], hd, j)
        // A legend-hidden series reads as zeroes; its part goes with it so
        // the two shrink away together.
        row.push(finite(v) ? (collapsed ? 0 : v) : null)
      }
      parts.push(row)
    }
    if (active && mismatch) {
      this._warn(
        'length',
        'highlightData and data differ in length; the extra entries are ignored and the missing ones read as null.',
      )
    }
    // The reducer picks which points are drawn and streaming trims them from
    // the front: a parallel array cannot follow either, a part on its point
    // does.
    const parallel = series.some((s) => Array.isArray(s?.highlightData))
    if (parallel && cnf.chart.dataReducer?.enabled) {
      this._warn(
        'reducer',
        'highlightData cannot follow chart.dataReducer; put the part on each point as { x, y, highlight } instead.',
      )
    }
    if (parallel && cnf.chart.streaming?.enabled) {
      this._warn(
        'stream',
        'highlightData cannot follow chart.streaming; put the part on each point as { x, y, highlight } instead.',
      )
    }

    // Parts drive the value axis only where the shape has no edge of its own:
    // a funnel stage is a hard limit, and widening the axis for it would shrink
    // every stage. A 100% stack is pinned to 0..100, and its parts are capped
    // there instead. A treemap has no value axis: its extent shades the
    // tiles, which a part must never recolour.
    const extend =
      active &&
      cfg.axis !== 'clamp' &&
      type !== 'treemap' &&
      !cnf.plotOptions.bar.isFunnel &&
      !(stacked && cnf.chart.stackType === '100%')

    // Unstacked, each part reaches its own value. Stacked bars: the parts
    // form their own diverging stack per series group, restarting where the
    // renderer restarts its stack. Stacked lines and areas add up every
    // series in one running sum per x, whatever its sign, as Line stacks
    // its wholes (Line._stackKey: the x value on a numeric axis, else the
    // category).
    /** @type {any} */
    let keyOf = null
    if (stacked && bars) {
      const names = w.seriesData.seriesNames
      const group = parts.map((_, i) =>
        w.labelData.seriesGroups.findIndex(
          (/** @type {string[]} */ g) => g.indexOf(names[i]) > -1,
        ),
      )
      keyOf = (/** @type {number} */ i, /** @type {number} */ j) =>
        group[i] + '|' + j
    } else if (stacked) {
      const sx = w.seriesData.seriesX
      keyOf = (/** @type {number} */ i, /** @type {number} */ j) =>
        String(w.axisFlags.isXNumeric ? sx[i]?.[j] : j)
    }
    const ext = extend
      ? this._runningExt(
          parts,
          keyOf,
          bars,
          bars ? (i, j) => this._restarts(i, j) : undefined,
        )
      : null
    this._publish(parts, ext)
  }

  /** Warn once that this chart type draws no parts. */
  _unsupported() {
    const c = this.w.config.chart
    this._warn(
      'type',
      `parts are not drawn on this chart (type "${c.requestedType || c.type}"). Supported: column, bar, line and area (stacked too), funnel, pie, donut, polarArea, radialBar, gauge and treemap.`,
    )
  }

  /** @param {boolean} supported */
  _inactive(supported) {
    if (!supported) this._targets = new Map()
    this.w.highlightData = {
      active: false,
      parts: [],
      ext: null,
      capture: () => this.capture(),
    }
    this._sig = ''
    this._rows = []
  }

  /**
   * Pie, donut, polarArea and radialBar: one part per slice (or ring), from
   * the slice's own point (`{ x, y, highlight }` in the object form) or from
   * `highlightFilter.data`, parallel to the slices (the numeric form has
   * nowhere else to carry it). Stored as one row per slice, so a slice reads
   * like a one-datum series.
   */
  _parseCircle() {
    const w = this.w
    const cnf = w.config
    const cfg = this.cfg
    const gl = w.globals
    const n = (w.seriesData.series || []).length
    const pts = slicePoints(/** @type {any[]} */ (cnf.series))
    let point = pts.some((d) => 'highlight' in d)
    if (point && pts.length !== n) {
      // Points that were parsed some other way (raw `parsing`) do not line
      // up with the slices.
      this._warn(
        'points',
        'per-point highlight values do not line up with the slices; use highlightFilter.data instead.',
      )
      point = false
    }
    // Top-level config outlives the series it was written for: a different
    // slice count means it no longer applies.
    let arr = Array.isArray(cfg.data) ? cfg.data : null
    if (arr && arr.length !== n) {
      this._warn(
        'length',
        `highlightFilter.data has ${arr.length} values for ${n} slices; it is ignored until they match.`,
      )
      arr = null
    }
    // A slice (or ring) is a one-datum series, so rows of one value, the
    // shape set() takes on an axis chart, read as that value. A longer row
    // has no datum to land on.
    if (arr && arr.some((/** @type {any} */ v) => Array.isArray(v))) {
      if (
        arr.some((/** @type {any} */ v) => Array.isArray(v) && v.length !== 1)
      ) {
        this._warn(
          'rows',
          'highlightFilter.data takes one value per slice (or ring); a row of several values is ignored.',
        )
        arr = null
      } else {
        arr = arr.map((/** @type {any} */ v) => (Array.isArray(v) ? v[0] : v))
      }
    }
    const type = cnf.chart.type
    const supported = CIRCLE.indexOf(type) > -1 || type === 'radialBar'
    const present = point || !!arr
    if (present && !supported) this._unsupported()
    if (!(cfg.enabled !== false && present && supported)) {
      this._inactive(supported)
      return
    }
    const parts = []
    for (let i = 0; i < n; i++) {
      const pt = point ? pts[i] : null
      const v = pt && 'highlight' in pt ? pt.highlight : arr ? arr[i] : null
      // A legend-hidden slice reads as 0; its part goes with it.
      parts.push([
        finite(v) ? (gl.collapsedSeriesIndices.indexOf(i) > -1 ? 0 : v) : null,
      ])
    }
    this._publish(parts, null)
  }

  /**
   * The parts of this parse, and the signature highlightFilterChanged
   * compares once the render is drawn (one update can parse more than once,
   * so the phase is decided then). A legend-hidden series keeps the row it
   * last had: hiding a series is not a change of pick.
   * @param {(number | null)[][]} parts
   * @param {any} ext
   */
  _publish(parts, ext) {
    const gl = this.w.globals
    this.w.highlightData = {
      active: true,
      parts,
      ext,
      capture: () => this.capture(),
    }
    const prevRows = this._rows
    const rows = []
    for (let i = 0; i < parts.length; i++) {
      const hidden =
        gl.collapsedSeriesIndices.indexOf(i) > -1 ||
        gl.ancillaryCollapsedSeriesIndices.indexOf(i) > -1
      rows.push(
        hidden && i < prevRows.length ? prevRows[i] : parts[i].join(','),
      )
    }
    this._rows = rows
    // Prefixed, so an active pick never reads as the empty (inactive) one.
    this._sig = '#' + rows.join('|')
  }

  /** Series.capturePreviousPaths: what is on screen becomes "previous". A
   * render records where it was going; an update that lands mid-flight has
   * to start from where things are, so each part's shape and mirror and each
   * whole's look are read as they stand now, and so is every line and area
   * label. The tweens still running write into the old records, never into
   * these. A clear that has landed leaves nothing: that whole is plain and
   * its part gone. */
  capture() {
    const gl = /** @type {any} */ (this.w.globals)
    /** @type {Map<string, any>} */
    const prev = new Map()
    this._targets.forEach((t, key) => {
      if (t.c && !t.run) return
      const n = t.n
      const on = !!n?.isConnected
      prev.set(key, {
        ...t,
        d: (on && n.getAttribute('d')) || t.d,
        a: (t.m?.isConnected && t.m.getAttribute('d')) || t.a,
        flip: on
          ? n.classList.contains(FLIP_Y) || n.classList.contains(FLIP_X)
          : t.flip,
        f: t.lf ?? t.f,
        o: t.lo ?? t.o,
        // A treemap tile's share and colour as drawn (see TreemapPart).
        s: t.ls ?? t.s,
        col: t.lc ?? t.col,
        // A part's alpha and carried stroke as drawn (see _paintBar).
        al: t.la ?? t.al,
        k: t.lk ?? t.k,
        n: null,
        m: null,
        g: null,
        lb: null,
      })
    })
    gl.prevHighlightParts = prev
    gl.prevHighlightLabels = this._captureLabels()
    this._targets = new Map()
  }

  /** @returns {Map<string, {d: string | null, a?: string | null, f: number, o?: number, base?: string, edge?: boolean, s?: number, flip?: boolean, c?: boolean, al?: number, k?: number}> | undefined} */
  _prev() {
    return /** @type {any} */ (this.w.globals).prevHighlightParts
  }

  /** Whether this render should animate a data change (same rule the bar
   * morph uses, so the fade and the shape move on one clock). Only the SVG
   * renderer: the canvas paints its display list once, inside the render, so
   * a tween's first frame would be the one left on screen. */
  _animates() {
    const r = this.ctx.renderer
    return (
      (!r || !r.kind || r.kind === 'svg') &&
      this._animatesUpdate() &&
      !!this.w.globals.shouldAnimate
    )
  }

  /** Animations are on for updates at all, and this render is an update. */
  _animatesUpdate() {
    const w = this.w
    const a = w.config.chart.animations
    return !!(
      Environment.isBrowser() &&
      a.enabled &&
      a.dynamicAnimation.enabled &&
      w.globals.dataChanged &&
      !prefersReducedMotion()
    )
  }

  /**
   * One tween on the feature's own rAF clock, with the morph's curve (core's
   * easing registry is shared with add-ons). Given a mark (`el`), it runs on a
   * runner of that mark's own instead, so it starts, steps and eases exactly
   * as the mark's own runners do (each `animate()` is an independent runner).
   * Frame 0 is written at once either way.
   * @param {number} delayMs
   * @param {number} duration
   * @param {(t: number) => void} onFrame eased progress 0..1
   * @param {() => void} [onDone]
   * @param {(t: number) => number} [curve] in place of the morph's
   * @param {any} [el] the mark whose runner clock to run on
   */
  _tween(delayMs, duration, onFrame, onDone, curve, el) {
    const w = this.w
    const ease = curve || morphEasing(w)
    const live = this._live
    let done = false
    const job = {
      finish() {
        if (done) return
        done = true
        live.delete(job)
        onFrame(1)
        onDone && onDone()
      },
    }
    this._hold(job)
    const start = performance.now() + delayMs
    /** @param {number} now */
    const step = (now) => {
      if (done) return
      if (w.globals.isDestroyed) {
        done = true
        live.delete(job)
        return
      }
      const raw = Math.max(0, Math.min(1, (now - start) / duration))
      onFrame(ease(raw))
      if (raw < 1) BrowserAPIs.requestAnimationFrame(step)
      else job.finish()
    }
    onFrame(0)
    if (el) {
      el.animate(duration, delayMs)
        .during((/** @type {number} */ t) => done || onFrame(t))
        .after(() => job.finish())
    } else BrowserAPIs.requestAnimationFrame(step)
  }

  /**
   * Something an export lands before it serialises (Exports calls
   * `highlightTween.finish()`): a fade, never a shape, which moves on with
   * its mark. The job takes itself off the set when it is done.
   * @param {{finish: () => void}} job
   */
  _hold(job) {
    const live = this._live
    const gl = /** @type {any} */ (this.w.globals)
    live.add(job)
    gl.highlightTween = {
      finish: () => Array.from(live).forEach((t) => t.finish()),
    }
  }

  /**
   * Bar.draw, once per datum before it is rendered. Returns what renderSeries
   * needs: the label override and a paint step to run once the whole's path
   * exists. Undefined when there is nothing to do here.
   *
   * @param {any} bar the Bar renderer
   * @param {{i: number, j: number, realIndex: number, translationsIndex: number, paths: any, zeroH: number, zeroW: number}} o
   */
  bar(bar, o) {
    const w = this.w
    const hd = w.highlightData
    if (!hd) return undefined
    if (this._render !== bar) this._beginRender(bar, BAR)
    const prevMap = this._prev()
    const active = hd.active
    // A chart that is not highlighting and was not a frame ago: one check.
    if (!active && !prevMap?.size) return undefined
    const { j, realIndex } = o
    // datumKey names the category, which every series shares at that x.
    const key = BAR + `${realIndex}::${datumKey(w, realIndex, j)}`
    this._seen.add(key)
    const prev = prevMap?.get(key)
    const p = active ? hd.parts[realIndex]?.[j] : null
    if (!active && !prev) return undefined

    const cfg = this.cfg
    const fadeTo = active ? (cfg.fadeOpacity ?? 0.2) : 1
    const whole = w.seriesData.series[realIndex]?.[j]
    const stacked = !!w.config.chart.stacked
    // A stacked datum is placed even without a part: the stack cursor moves
    // past it, and a part that left drains to where it would sit.
    /** @type {any} */
    const geo =
      active && stacked
        ? this._stackGeometry(bar, o, p, whole, prev)
        : p == null
          ? null
          : this._barGeometry(bar, o, p, whole)

    /** @type {any} */
    const hl = {
      paint: (/** @type {any} */ el, /** @type {any} */ r) =>
        this._paintBar(o, el, r, {
          key,
          prev,
          geo,
          fadeTo,
          active,
          whole,
          bar: stacked ? bar : null,
        }),
    }

    if (active) {
      // Labels state the part by default. A datum with no part keeps no
      // label: its whole is a faded backdrop, not a reading. A stacked total
      // states the parts, at the edge of the part stack (core reads it only
      // on the series that draws the total, which is drawn last).
      /** @type {any} */
      const label = {}
      if ((cfg.dataLabels?.value ?? 'part') === 'part') {
        Object.assign(
          label,
          p == null ? { hide: true } : { val: geo?.val ?? p, ...geo?.label },
        )
      }
      if (stacked && (cfg.dataLabels?.total ?? 'part') === 'part') {
        label.total = geo.total(label.val != null ? label.val < 0 : whole < 0)
      }
      hl.label = label
    }
    return hl
  }

  /**
   * The first datum of a render. What the last render drew was handed over at
   * capture; whatever an uncaptured render left (an update without animation,
   * the second update in one frame) is dropped here, so the map always
   * describes the screen.
   * @param {any} renderer the renderer instance drawing this pass
   * @param {string} family the key prefix of what it draws
   */
  _beginRender(renderer, family) {
    this._render = renderer
    this._targets = new Map()
    this._seen = new Set()
    this._seriesEls = new Map()
    this._cu = new CoreUtils(this.w)
    // Where each stack's parts have reached in this render: stacked bars by
    // group and category, stacked lines and areas by x.
    this._stk = new Map()
    this._stkPrev = []
    this._br = null
    this._held = false
    // Datums that left with this update are not drawn by it. Once the
    // renderer has finished (its exit ghosts exist by then, and nothing has
    // been painted yet), their parts leave with the ghosts. Only unstacked
    // bars draw exit ghosts.
    if (family === BAR && !this.w.config.chart.stacked && this._prev()?.size) {
      Promise.resolve().then(() => this._orphans())
    }
  }

  /**
   * A datum that left while a pick was on screen: its whole leaves as the
   * renderer's exit ghost, drawn at full strength. The ghost takes the fade
   * the whole was drawn with, and the part rides out in front of it on the
   * ghost's own transform, so frame 0 is the screen as it was.
   */
  _orphans() {
    const w = this.w
    const prev = this._prev()
    if (!prev || w.globals.isDestroyed || !this._animates()) return
    prev.forEach((t, key) => {
      if (this._seen.has(key) || key.indexOf(BAR) !== 0) return
      // The renderer names its ghost by the datum alone.
      const datum = key.slice(BAR.length)
      const el = this._seriesEls.get(datum.slice(0, datum.indexOf('::')))
      if (!el) return
      const ghost = Array.from(
        el.querySelectorAll('.apexcharts-bar-ghost'),
      ).find(
        (/** @type {any} */ n) => n.getAttribute('data:ghostKey') === datum,
      )
      if (!ghost) return
      ghost.setAttribute('fill-opacity', String(t.f))
      if (!t.d) return
      const part = new Graphics(w, this.ctx).drawPath({
        d: t.d,
        stroke: 'none',
        strokeWidth: 0,
        // Solid, at the alpha it had on screen (see _paintBar).
        fill: solid(ghost.getAttribute('fill'))[0],
        fillOpacity: t.al ?? 1,
        classes: `${PART} apexcharts-highlight-ghost`,
      })
      const node = part.node
      node.setAttribute('pointer-events', 'none')
      node.setAttribute('clip-path', ghost.getAttribute('clip-path') || '')
      ghost.after(node)
      // The ghost shrinks toward its baseline edge; the part, sharing that
      // baseline, shrinks toward the same line in its own box.
      const origin = ghost.style.transformOrigin || ''
      const horiz = /^(left|right)/.test(origin)
      const edge = parseFloat(ghost.getAttribute('data:ghostEdge') || '')
      const [lo] = pathSpan(t.d, horiz ? 0 : 1)
      const st = node.style
      st.transformBox = 'fill-box'
      st.transformOrigin = isFinite(edge)
        ? horiz
          ? `${edge - lo}px 50%`
          : `50% ${edge - lo}px`
        : origin
      const step = () => {
        if (!ghost.parentNode || w.globals.isDestroyed) {
          node.remove()
          return
        }
        st.transform = ghost.style.transform
        st.opacity = ghost.style.opacity
        BrowserAPIs.requestAnimationFrame(step)
      }
      step()
    })
  }

  /**
   * Part geometry from the renderer's own builders, so the part matches the
   * whole's slot, width, stroke centering and corner rounding exactly.
   * @param {any} bar @param {any} o @param {number} p @param {number} whole
   */
  _barGeometry(bar, o, p, whole) {
    const w = this.w
    const { j, realIndex, translationsIndex, paths } = o
    const h = bar.barHelpers
    const strokeWidth = h.getStrokeWidth(o.i, j, realIndex)

    if (bar.isFunnel) {
      // A funnel stage is the part's hard limit: the part is the stage scaled
      // about the centreline by its share, clamped to the stage.
      const share = whole ? Math.min(Math.abs(p / whole), 1) : 0
      const c = w.layout.gridWidth / 2
      return {
        pathTo: scalePath(paths.pathTo, (x) => c + (x - c) * share, null),
        base: scalePath(paths.pathTo, () => c, null),
        overflow: false, // clamped to the stage, see above
      }
    }

    // On a log axis the renderer places the log of each value; the part is
    // placed the same way (the label and the overflow test keep the raw value).
    // A part under the axis floor sits on it rather than hanging below.
    const ax = w.config.yaxis[w.globals.seriesYAxisReverseMap[realIndex]]
    const pv =
      ax?.logarithmic && !w.globals.invalidLogScale && this._cu
        ? Math.max(0, this._cu.getLogValAtSeriesIndex(p, realIndex))
        : p

    if (bar.isHorizontal) {
      const x1 = o.zeroW
      const x2 = h.getXForValue(pv, o.zeroW)
      const r = this._rect(h, {
        a: paths.barYPosition,
        len: paths.barHeight,
        v1: x1,
        v2: x2,
        strokeWidth,
        realIndex,
        j,
        dir: pv >= 0 ? 1 : -1,
        horizontal: true,
      })
      return {
        pathTo: r.pathTo,
        base: r.base,
        overflow: overflows(p, whole),
        label: { x: x2, barWidth: Math.abs(x2 - x1) },
      }
    }
    const y1 = o.zeroH
    const y2 = h.getYForValue(pv, o.zeroH, translationsIndex)
    const r = this._rect(h, {
      a: paths.barXPosition,
      len: paths.barWidth,
      v1: y1,
      v2: y2,
      strokeWidth,
      realIndex,
      j,
      dir: pv >= 0 ? 1 : -1,
      horizontal: false,
    })
    return {
      pathTo: r.pathTo,
      base: r.base,
      overflow: overflows(p, whole),
      label: { y: y2, barHeight: Math.abs(y2 - y1) },
    }
  }

  /**
   * A part's rect, from the renderer's builder. That builder centres the
   * whole's stroke on each end, so a bar thinner than its stroke turns inside
   * out: a stroke-wide sliver past its baseline (a value of 0, a series the
   * legend hides or shows). The whole's own stroke paints over it; a part has
   * none, so the sliver would show as solid colour. A part that thin is drawn
   * as the line it collapses to, at its middle, which is where the rect it
   * grows into starts.
   * @param {any} h the bar helpers
   * @param {{a: number, len: number, v1: number, v2: number, strokeWidth: any, realIndex: number, j: number, dir: number, horizontal: boolean}} o
   */
  _rect(h, o) {
    const sw = Array.isArray(o.strokeWidth)
      ? o.strokeWidth[o.realIndex]
      : o.strokeWidth
    const c = (sw || 0) / 2
    const d = o.v2 - o.v1
    if (Math.abs(d) < 2 * c) {
      const m = o.v1 + d / 2
      // (barRect insets each end by the half stroke along `direction`)
      const s =
        c * o.dir * (h.barCtx.isReversed ? -1 : 1) * (o.horizontal ? -1 : 1)
      o = { ...o, v1: m + s, v2: m - s }
    }
    return h.barRect(o)
  }

  /**
   * A stacked part's geometry. The parts form their own diverging stack in
   * each series group (positives up from the baseline, negatives down), in
   * series order, so a part sits on the parts below it rather than on its
   * whole. The cursor is in pixels and advances through the renderer's own
   * value-to-pixel helpers with the cursor as their zero line, the way the
   * wholes stack. The rect, its corners and its mirror come from the same
   * builders as the wholes', with the corner states resolved over the parts.
   *
   * Also run for a datum without a part: it moves nothing, but a part that
   * left drains to where it would sit.
   * @param {any} bar the BarStacked renderer
   * @param {any} o @param {number | null} p @param {number} whole
   * @param {any} prev what this datum drew a frame ago
   */
  _stackGeometry(bar, o, p, whole, prev) {
    const w = this.w
    const { j, realIndex, translationsIndex: ti, paths } = o
    const h = bar.barHelpers
    const horiz = bar.isHorizontal
    const zero = horiz ? o.zeroW : o.zeroH

    if (!this._br) {
      // Only the signs matter, so the raw parts serve a 100% stack too.
      this._br = h.createBorderRadiusArr(
        (w.highlightData?.parts || []).map((r) => r.map((v) => v ?? 0)),
      )
      // As the renderer does for the wholes (bar/Helpers initVariables).
      if (Utils.isSafari()) {
        this._br = /** @type {string[][]} */ (this._br).map((r) =>
          r.map(() => 'none'),
        )
      }
    }
    const br = /** @type {string[][]} */ (this._br)

    const key = h.getSeriesGroupIndex(realIndex) + '|' + j
    let c = this._stk.get(key)
    if (!c || this._restarts(realIndex, j)) {
      c = { p: zero, n: zero, raw: 0, any: false }
      this._stk.set(key, c)
    }

    // A 100% stack is laid out in shares of the category's total, the same
    // signed total the wholes are divided by.
    const pct = w.config.chart.stackType === '100%'
    const total = w.seriesData.stackedSeriesTotals[j]
    const val = p == null ? null : pct ? (total ? (100 * p) / total : 0) : p
    const v = val ?? 0
    // A missing part sits on the side it last drew on, else its whole's.
    const neg = val != null ? val < 0 : prev?.s != null ? prev.s < 0 : whole < 0
    /** @param {number} x @param {number} from */
    const at = (x, from) =>
      horiz ? h.getXForValue(x, from) : h.getYForValue(x, from, ti)
    let v1 = neg ? c.n : c.p
    let v2 = at(v, v1)
    if (neg) c.n = v2
    else c.p = v2
    if (p != null) {
      c.raw += p
      c.any = true
    }
    const raw = c.raw
    const any = c.any
    const edge = { p: c.p, n: c.n }

    // A 100% stack has a hard edge at 100: a part stack past it (averages)
    // is capped there and marked, and its total sits on the cap.
    let overflow = false
    if (pct) {
      const a = at(100, zero)
      const b = at(-100, zero)
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      const cap = (/** @type {number} */ x) => Math.min(hi, Math.max(lo, x))
      overflow = cap(v2) !== v2
      v1 = cap(v1)
      v2 = cap(v2)
      edge.p = cap(edge.p)
      edge.n = cap(edge.n)
    }

    const save = h.arrBorderRadius
    h.arrBorderRadius = br
    let r
    try {
      r = this._rect(h, {
        a: horiz ? paths.barYPosition : paths.barXPosition,
        len: horiz ? w.globals.barHeight : w.globals.barWidth,
        v1,
        v2,
        // As the renderer strokes its stacked segments: columns with the
        // configured width, bars with the datum's.
        strokeWidth: horiz
          ? h.getStrokeWidth(o.i, j, realIndex)
          : bar.strokeWidth,
        realIndex,
        j,
        dir: neg ? -1 : 1,
        horizontal: horiz,
      })
    } finally {
      h.arrBorderRadius = save
    }

    return {
      pathTo: p == null ? null : r.pathTo,
      square: r.squarePathTo,
      base: r.base,
      flip: p != null && bar.cornerFlip(br[realIndex]?.[j], v),
      s: neg ? -1 : 1,
      overflow,
      val,
      label: horiz
        ? { x: v2, barWidth: Math.abs(v2 - v1) }
        : { y: v2, barHeight: Math.abs(v2 - v1) },
      // The stacked total, on the side of the stack core puts it (by the
      // sign the drawing series' label reads), or false when the stack has
      // no part at all.
      total: (/** @type {boolean} */ n) =>
        any ? { val: raw, edge: n ? edge.n : edge.p } : false,
    }
  }

  /**
   * Whether a stacked column starts a fresh stack at this datum: on a numeric
   * or datetime x axis the renderer stacks a series on the one before it only
   * where both have the same x at that index (BarStacked
   * drawStackedColumnPaths), and starts again from the baseline elsewhere.
   * Horizontal stacks never restart.
   * @param {number} realIndex @param {number} j
   */
  _restarts(realIndex, j) {
    const w = this.w
    const sx = w.seriesData.seriesX
    return (
      !w.config.plotOptions.bar.horizontal &&
      !!w.axisFlags.isXNumeric &&
      realIndex > 0 &&
      sx[realIndex - 1]?.[j] !== sx[realIndex]?.[j]
    )
  }

  /**
   * Line.draw, once per series right after its whole has been rendered and
   * before its markers and labels are appended (so they stay on top). The
   * part is built by the renderer's own path builder from the part row, so it
   * has the whole's start point, curve, gaps, stacking and area close. The
   * whole is then dashed (a line) or faded with its outline kept (an area);
   * its markers stay as they are, since hover, keyboard focus and the tooltip
   * are all keyed to them.
   * @param {any} ln the Line renderer, still holding this series' state
   * @param {string} type
   * @param {any[]} series the rows the whole was built from
   * @param {number} i @param {number} realIndex @param {number} ti
   * @param {any} paths what the whole was built into
   */
  line(ln, type, series, i, realIndex, ti, paths) {
    const w = this.w
    const hd = w.highlightData
    if (!hd || (type !== 'line' && type !== 'area')) return
    if (this._render !== ln) this._beginRender(ln, LINE)
    const prevMap = this._prev()
    const active = hd.active
    if (!active && !prevMap?.size) return
    const key = LINE + realIndex
    const prev = prevMap?.get(key)
    if (!active && !prev) return

    const gl = w.globals
    const animate = this._animates()
    const area = type === 'area'
    const raw = active ? hd.parts[realIndex] || [] : []
    const has = raw.some((v) => v != null)
    // A legend-hidden series is drawn flat, and its part (gone with its
    // data) flattens with it; the renderer clears both once they land.
    const flat = active && ln._shapeOnly
    /** @param {any} m @param {string} k */
    const paint = (m, k) => m && (m._cmd ? m._cmd[k] : m.node.getAttribute(k))
    const marks = /** @type {any[]} */ (ln.marks || [])
    const fillMark = area
      ? marks.find((m) => paint(m, 'fill') !== 'none')
      : null
    const strokeMark = marks.find((m) => m !== fillMark)
    // A stacked area's part is solid, as a bar's (see _paintBar): the part
    // stack sits off the whole stack, and the faded wholes and outlines under
    // it would show through. Unstacked areas overlap by design, so their
    // parts keep the fill's own alpha and the series behind stay seen.
    const [ink, alpha] =
      fillMark && w.config.chart.stacked
        ? solid(paint(fillMark, 'fill'))
        : [fillMark && paint(fillMark, 'fill'), 1]
    // Past the forecast cut the renderer draws the whole's stroke again,
    // dashed, right after it. An area's outline look reaches that copy too
    // (a line's copy is dashed already, and keeps the forecast dash).
    const looks = marks.concat(
      area
        ? marks
            .filter((m) => m !== fillMark && !m._cmd)
            .map((m) => m.node.nextElementSibling)
            .filter((x) =>
              /#forecastMask/.test(x?.getAttribute('clip-path') || ''),
            )
            .map((node) => ({ node }))
        : [],
    )

    // Every series of a stack builds into the part stack, with or without a
    // part, so the parts above it stack where the renderer would put them.
    /** @type {any} */
    const pp =
      active && !flat && (has || w.config.chart.stacked)
        ? this._lineBuild(
            ln,
            type,
            series,
            i,
            realIndex,
            ti,
            this._partRow(raw, i, realIndex),
          )
        : null

    /** @type {any} */
    let to = flat
      ? { d: paths.linePaths.join(' '), a: paths.areaPaths.join(' ') }
      : has
        ? {
            d: pp.linePaths.join(' '),
            a: pp.areaPaths.join(' '),
            num: pp.numericXY,
          }
        : null
    // A part with nothing to draw now leaves: on a clear it lands on the
    // whole, which comes back the frame it does; a series that lost its
    // part while the pick stays drains it to the baseline (or onto the part
    // stack below). A part arriving on a series already faded, or with
    // enter: 'baseline', rises from there. In a stack that is the part stack
    // below this series, so it is built before this series joins it.
    const exit = !to && !!prev?.d && animate
    const base =
      active &&
      animate &&
      (exit || (to && !prev?.d && (prev || this.cfg.enter === 'baseline')))
        ? this._lineBase(ln, type, series, i, realIndex, ti, has ? raw : null)
        : null
    if (pp && w.config.chart.stacked) {
      this._swap(ln, () => ln._recordStackTops(realIndex, pp.yArrj))
      this._stkPrev.push(pp.yArrj)
    }
    if (exit) {
      to = active
        ? base
        : { d: paths.linePaths.join(' '), a: paths.areaPaths.join(' ') }
    }
    const lands = exit && !active

    /** @type {any} */
    let from = to
    /** @type {any} */
    const interp = {}
    /** @type {any} */
    let scroll = null
    let cover = false
    if (to && animate) {
      if (prev?.d) {
        from = { d: prev.d, a: prev.a || to.a }
        if (!exit) {
          // A streaming window slides the part with its whole; a length
          // change or a zoom joins the old and new points by key, as the
          // whole does. Nulls fall back to the padded command morph.
          scroll = detectStreamScroll(w, realIndex, paths.xArrj, paths.yArrj)
          if (scroll) {
            from = {
              d: projectPathToPrevFrame(to.d, scroll),
              a: projectPathToPrevFrame(to.a, scroll),
            }
          } else {
            const b = pp || paths
            const r = reconcileSeriesPaths(w, {
              type,
              realIndex,
              pathFromLine: prev.d,
              pathFromArea: prev.a || '',
              linePaths: b.linePaths,
              areaPaths: b.areaPaths,
            })
            if (r?.line) [from.d, interp.d] = [r.line.from, r.line.toInterp]
            if (r?.area) [from.a, interp.a] = [r.area.from, r.area.toInterp]
          }
        }
      } else if (base) {
        from = base
      } else {
        // A first pick starts the part as the whole on screen (the shape
        // the whole moves from), with the whole hidden under it.
        cover = true
        from = {
          d: strokeMark?.node.getAttribute('pathFrom') || to.d,
          a: fillMark?.node.getAttribute('pathFrom') || to.a,
        }
      }
    }

    /** @type {any} */
    let m = null
    /** @type {any} */
    let n = null
    /** @type {any} */
    let nf = null
    if (to) {
      const g = this._partGroup(ln.elSeries, 'apexcharts-line-highlight')
      const num = to.num
      const base = {
        i,
        // Its own j: the mount reveal names its mask by series and j, and
        // the whole already has the series' masks.
        j: 'h',
        realIndex,
        delay: i,
        speed: w.config.chart.animations.dynamicAnimation.speed,
        cls: `apexcharts-${type} apexcharts-line-highlight-part`,
        chartType: type,
        clip: `url(#gridRectMask${gl.cuid})`,
        scroll: !!scroll,
      }
      if (fillMark) {
        m = this._emitPart(g, {
          ...base,
          from: from.a,
          to: to.a,
          interp: interp.a,
          paint: ink,
          num: num && { xs: num.xs, ys: num.ys, closeY: num.areaCloseY },
        })
      }
      if (strokeMark) {
        const stroke = {
          ...base,
          from: from.d,
          to: to.d,
          interp: interp.d,
          paint: 'none',
          stroke: paint(strokeMark, 'stroke'),
          width: ln.strokeWidth,
          num: num && { xs: num.xs, ys: num.ys },
        }
        n = this._emitPart(g, stroke)
        n?.attr('fill-rule', 'evenodd')
        // Past the forecast cut the whole's stroke is drawn again, dashed,
        // and so is the part's (the canvas paints no forecast masks).
        const clip =
          !strokeMark._cmd && strokeMark.node.getAttribute('clip-path')
        if (n && clip && clip.indexOf('nonForecast') > -1) {
          const fc = w.config.forecastDataPoints
          n.attr('clip-path', clip)
          nf = this._emitPart(g, {
            ...stroke,
            // (its own mount reveal mask)
            j: 'hf',
            clip: `url(#forecastMask${gl.cuid})`,
          })
          nf?.attr({
            'fill-rule': 'evenodd',
            'stroke-dasharray': fc.dashArray,
            'stroke-width': fc.strokeWidth || undefined,
          })
        }
      }
      // On mount a dashed stroke is revealed by a wipe across x and a solid
      // one along its length, which drift apart on a curve. Every stroke here
      // takes the wipe (a stroke the user dashed already does).
      const r = this.ctx.renderer
      if (
        (!r || !r.kind || r.kind === 'svg') &&
        w.config.chart.animations.enabled &&
        !gl.resized &&
        !gl.dataChanged
      ) {
        ;[n, area && strokeMark].forEach((el) => {
          const dash = el && el.node.getAttribute('stroke-dasharray')
          if (el && (!dash || dash === '0')) {
            el.node.setAttribute('stroke-dasharray', 'none')
          }
        })
      }
    }

    // What this series draws, for the next update to start from (see
    // capture): the part's line and area paths, and the whole's look.
    /** @type {any} */
    const rec = {
      d: null,
      a: null,
      f: 1,
      o: active ? 1 : 0,
      n: exit ? n?.node : null,
      m: exit ? m?.node : null,
      c: !active,
    }
    this._targets.set(key, rec)
    // The area part's alpha: the whole's while it starts on (or lands on) the
    // whole's exact shape, solid otherwise, from where it was on screen.
    const a0 = cover ? alpha : prev?.d ? (prev.al ?? 1) : 1
    const a1 = lands ? alpha : 1
    rec.al = a1
    this._fadeLine(
      type,
      looks,
      cover ? L_COVER : prev ? { f: prev.f, o: prev.o ?? 0 } : L_PLAIN,
      lands ? L_COVER : active ? L_REST : L_PLAIN,
      {
        width: ln.strokeWidth,
        also:
          m && (a0 < 1 || a1 < 1)
            ? (t) => {
                const a = mix(a0, a1, t)
                rec.la = a
                m.node.setAttribute('fill-opacity', String(a))
              }
            : undefined,
        force: !!m && a0 !== a1,
        land: lands ? L_PLAIN : undefined,
        // A retired part leaves on the frame its whole lands.
        done: exit
          ? () => {
              n?.remove()
              nf?.remove()
              m?.remove()
            }
          : undefined,
        rec,
        // A scroll morph runs at constant speed, and so does its fade.
        ease: scroll ? resolveEasing('linear') : undefined,
      },
    )
    if (to && !exit)
      Object.assign(rec, { d: to.d, a: to.a, n: n?.node, m: m?.node })
    this._lineLabels(ln, type, i, realIndex, raw, pp, paths)
  }

  /**
   * A part row in the units the renderer draws: logs on a log axis, and the
   * renderer's nudge for a flat row under a gradient, whose box would
   * otherwise have no height to paint (#358).
   * @param {any[]} raw @param {number} i @param {number} realIndex
   */
  _partRow(raw, i, realIndex) {
    const w = this.w
    const cu = /** @type {CoreUtils} */ (this._cu)
    const ax = w.config.yaxis[w.globals.seriesYAxisReverseMap[realIndex]]
    const row =
      ax?.logarithmic && !w.globals.invalidLogScale
        ? raw.map((v) => cu.getLogValAtSeriesIndex(v, realIndex))
        : raw.slice()
    const ft = /** @type {any} */ (w.config.fill.type)
    const last = row.length - 1
    if (
      (ft === 'gradient' || ft[i] === 'gradient') &&
      row[last] != null &&
      row.every((v) => v === row[0])
    ) {
      row[last] += 0.000001
    }
    return row
  }

  /**
   * Build a series' paths from another row, as a dry run of the renderer's
   * own builder: markers and labels off, and every piece of state the build
   * touches handed back afterwards (the tooltip's point cache included). In a
   * stack the build stands on the part stack instead of the whole one.
   * @param {any} ln @param {string} type @param {any[]} series
   * @param {number} i @param {number} realIndex @param {number} ti
   * @param {any[]} row
   */
  _lineBuild(ln, type, series, i, realIndex, ti, row) {
    const w = this.w
    const pa = w.globals.pointsArray
    const had = pa[realIndex]
    const len = had ? had.length : 0
    const keep = [ln._shapeOnly, ln.appendPathFrom]
    const S = series.slice()
    S[i] = row
    ln._shapeOnly = true
    try {
      const pp = this._swap(ln, () =>
        ln._buildSeriesPaths(type, S, i, realIndex, ti),
      )
      pp.S = S
      return pp
    } finally {
      ;[ln._shapeOnly, ln.appendPathFrom] = keep
      if (had) had.length = len
      else delete pa[realIndex]
    }
  }

  /**
   * Run `fn` with the renderer's stack (the tops by x, and the rows so far)
   * swapped for the part stack, in a stacked chart; the renderer's own is
   * handed back after. Returns what `fn` returns.
   * @template T
   * @param {any} ln @param {() => T} fn
   * @returns {T}
   */
  _swap(ln, fn) {
    if (!this.w.config.chart.stacked) return fn()
    const keep = [ln.prevSeriesYByX, ln.prevSeriesY]
    ln.prevSeriesYByX = this._stk
    ln.prevSeriesY = this._stkPrev
    try {
      return fn()
    } finally {
      ;[ln.prevSeriesYByX, ln.prevSeriesY] = keep
    }
  }

  /**
   * The part's zero-height shape: on the baseline, or on the part stack
   * below in a stack. With `pattern` it keeps that row's gaps, so the part
   * rises from it point for point.
   * @param {any} ln @param {string} type @param {any[]} series
   * @param {number} i @param {number} realIndex @param {number} ti
   * @param {any[] | null} [pattern]
   */
  _lineBase(ln, type, series, i, realIndex, ti, pattern) {
    const row = (pattern || series[i]).map((/** @type {any} */ v) =>
      v == null ? null : 0,
    )
    const b = this._lineBuild(ln, type, series, i, realIndex, ti, row)
    return {
      d: b.linePaths.join(' '),
      a: b.areaPaths.join(' '),
      num: b.numericXY,
    }
  }

  /**
   * Take a line or area whole from one look to another on the morph clock
   * (see _fade, whose control flow this shares). A look is `{f, o}`: `f` is
   * how much of the whole shows (0 while a part on its exact shape covers
   * it, since the part has the whole's own paint), `o` how far it is into
   * its highlighted look: a line dashed, an area faded with its outline.
   * The plain look is the mark's own attributes, as drawn.
   * @param {string} type
   * @param {any[]} marks the whole's rendered marks
   * @param {{f: number, o: number}} a @param {{f: number, o: number}} b
   * `also` runs on every frame with the progress (a part's alpha), and
   * `force` tweens even when the look stays.
   * @param {{width: number, land?: {f: number, o: number}, done?: () => void, rec: any, ease?: (t: number) => number, also?: (t: number) => void, force?: boolean}} opt
   */
  _fadeLine(type, marks, a, b, opt) {
    const cfg = this.cfg
    const fo = cfg.fadeOpacity ?? 0.2
    const ow = cfg.outline?.width ?? 1
    const oo = cfg.outline?.opacity ?? 1
    const dash = cfg.line?.dashArray ?? 4
    const rec = opt.rec
    const names = [
      'fill-opacity',
      'stroke-opacity',
      'stroke-width',
      'stroke-dasharray',
    ]
    const items = marks.map((m) => {
      const node = m.node
      const own = names.map((k) => node.getAttribute(k))
      const k = parseFloat(own[0] ?? '1')
      return {
        node,
        own,
        k: isFinite(k) ? k : 1,
        fill:
          type === 'area' &&
          (m._cmd ? m._cmd.fill : node.getAttribute('fill')) !== 'none',
      }
    })
    /** @param {number} f @param {number} o */
    const set = (f, o) => {
      rec.lf = f
      rec.lo = o
      items.forEach(({ node, own, k, fill }) => {
        if (f >= 1 && o <= 0) {
          names.forEach((x, q) =>
            own[q] == null
              ? node.removeAttribute(x)
              : node.setAttribute(x, own[q]),
          )
        } else if (fill) {
          node.setAttribute('fill-opacity', String(k * f * mix(1, fo, o)))
        } else if (type === 'area') {
          node.setAttribute('stroke-opacity', String(f * mix(1, oo, o)))
          node.setAttribute('stroke-width', String(mix(opt.width, ow, o)))
        } else {
          // The gap opens from nothing, so the dash comes in with the pick
          // (the canvas reads the dash as one number).
          node.setAttribute('stroke-opacity', String(f))
          node.setAttribute(
            'stroke-dasharray',
            o < 1 ? `${dash} ${dash * o}` : String(dash),
          )
        }
      })
    }
    /** @param {number} t */
    const frame = (t) => {
      set(mix(a.f, b.f, t), mix(a.o, b.o, t))
      opt.also && opt.also(t)
    }
    const land = () => {
      rec.run = false
      if (opt.land) set(opt.land.f, opt.land.o)
      opt.done && opt.done()
    }
    if (
      this._animates() &&
      (a.f !== b.f || a.o !== b.o || opt.done || opt.force)
    ) {
      rec.run = true
      this._tween(
        0,
        this.w.config.chart.animations.dynamicAnimation.speed,
        frame,
        land,
        opt.ease,
      )
    } else {
      frame(1)
      land()
    }
  }

  /**
   * Data labels state the part, at the part's points, drawn by the
   * renderer's own label pass with the part row in place of the values. The
   * whole's labels go (a faded backdrop is not a reading), and so does a
   * label where the part is null. The labels then ride from where the labels
   * on screen were drawn (see _rideLabels); the text changes at once.
   * @param {any} ln @param {string} type @param {number} i
   * @param {number} realIndex @param {any[]} raw @param {any} pp
   * @param {any} paths
   */
  _lineLabels(ln, type, i, realIndex, raw, pp, paths) {
    const w = this.w
    const gl = /** @type {any} */ (w.globals)
    const wrap = ln.elDataLabelsWrap
    if (!w.config.dataLabels.enabled || !wrap?.node || ln._shapeOnly) return
    const part =
      w.highlightData?.active &&
      (this.cfg.dataLabels?.value ?? 'part') === 'part'
    if (part) {
      const node = wrap.node
      while (node.firstChild) node.removeChild(node.firstChild)
      // The overlap test reads what this series drew (by point: one box
      // per point, in order); it drew the parts.
      const boxes = gl.dataLabelsRects
      boxes[realIndex] = []
      gl.lastDrawnDataLabelsIndexes[realIndex] = []
      if (pp && raw.some((v) => v != null)) {
        const dl = new DataLabels(w, this.ctx)
        for (let j = 0; j < pp.xArrj.length - 1; j++) {
          const pos = ln.lineHelpers.calculatePoints({
            series: pp.S,
            x: pp.xArrj[j + 1],
            y: pp.yArrj[j + 1],
            realIndex,
            i,
            j,
            prevY: pp.yArrj[0],
          })
          // The first step carries points 0 and 1, the others one each. Each
          // is drawn on its own (the renderer reads a pair on step 1), and a
          // null part keeps its box in the order with no label.
          pos.x.forEach((/** @type {number} */ x, /** @type {number} */ q) => {
            if (raw[j ? j + 1 : q] == null) {
              boxes[realIndex].push({ x: NaN, y: NaN, width: 0, height: 0 })
              return
            }
            const el = dl.drawDataLabel({
              type,
              pos: {
                x: j ? [x] : q ? [NaN, x] : [x, NaN],
                y: pos.y,
              },
              i: realIndex,
              j: j ? j + 1 : 1,
              row: raw,
            })
            if (el) wrap.add(el)
          })
        }
      }
    }
    const xs = part ? pp?.xArrj : paths.xArrj
    const ys = part ? pp?.yArrj : paths.yArrj
    // A layout change (zoom, points entering or leaving) keeps the labels
    // hidden until the morph lands; there is nothing to ride then.
    if (!this._animates() || !xs || seriesJoin(w, realIndex)) return
    // A series the legend shows again: its labels come in from its hidden
    // shape here, so the renderer's own rise must not move them as well.
    const rise = gl.riseLabels
    if (rise?.has(realIndex)) {
      const r = new Map(rise)
      r.delete(realIndex)
      gl.riseLabels = r.size ? r : null
    }
    const frame = gl.prevStreamFrame
    const src = gl.prevHighlightLabels?.get(realIndex)
    // It starts after the render's own label passes (overlap, backgrounds),
    // which place the labels where they come to rest.
    Promise.resolve().then(() =>
      this._rideLabels(wrap.node, xs, ys, src, [
        frame?.xPixels?.[realIndex],
        frame?.yPixels?.[realIndex],
      ]),
    )
  }

  /**
   * The line and area labels on screen, by series and by point: where each is
   * drawn (the overlap pass and a ride in flight move a label off its point),
   * how strongly, and its nodes. Read at capture, for the next render's
   * labels to start from.
   * @returns {Map<number, Map<number, {x: number, y: number, o: number, els: any[]}>> | null}
   */
  _captureLabels() {
    const w = this.w
    const type = w.config.chart.type
    const root = w.dom.baseEl
    const circle = CIRCLE.indexOf(type) > -1
    if (
      !w.config.dataLabels.enabled ||
      (type !== 'line' && type !== 'area' && !circle) ||
      !root ||
      !Environment.isBrowser()
    ) {
      return null
    }
    /** @type {Map<number, Map<number, any>>} */
    const out = new Map()
    if (circle) {
      // A slice's label, by slice, where it is drawn (a ride in flight
      // included), under -1: a circle has no series rows.
      /** @type {Map<number, any>} */
      const m = new Map()
      root
        .querySelectorAll('.apexcharts-pie-label')
        .forEach((/** @type {any} */ t) => {
          const [x, y] = drawnAt(t)
          m.set(Number(t.parentNode.getAttribute('data:slice')), { x, y })
        })
      out.set(-1, m)
      return out
    }
    root
      .querySelectorAll('.apexcharts-datalabels[data\\:realIndex]')
      .forEach((/** @type {any} */ wrap) => {
        const ri = Number(wrap.getAttribute('data:realIndex'))
        const xs = w.globals.seriesXvalues[ri] || []
        /** @type {Map<number, any>} */
        const m = new Map()
        wrap
          .querySelectorAll(`text.apexcharts-datalabel, text.${LABEL_EXIT}`)
          .forEach((/** @type {any} */ t) => {
            const k = nearest(xs, parseFloat(t.getAttribute('cx')))
            if (k < 0) return
            const [x, y] = drawnAt(t)
            m.set(k, {
              x,
              y,
              o: parseFloat(t.getAttribute('opacity') ?? '1'),
              els: withPill(t),
            })
          })
        out.set(ri, m)
      })
    return out
  }

  /**
   * Ride each label (and its background) from where the label of its point
   * was drawn on screen (`src`, by point) to where it is drawn now, on the
   * morph clock. A label with nothing on screen at its point fades in there;
   * one on screen with no label to become (a part that is null now) fades
   * out where it stands. A series with no labels on screen (the legend
   * showing it again) brings each in from its point's old place (`from`, by
   * point), as the renderer brings in a shown series' labels.
   * @param {any} root the series' label wrap
   * @param {any[]} xs @param {any[]} ys the points the labels were drawn at
   * @param {Map<number, any> | undefined} src
   * @param {any[]} from the old points' x and y pixels
   */
  _rideLabels(root, xs, ys, src, from) {
    const w = this.w
    if (w.globals.isDestroyed || !root.isConnected) return
    const [fx, fy] = from
    /** @type {{els: any[], dx: number, dy: number, o: number, to: number, out?: boolean, bases?: string[], ops?: number[]}[]} */
    const items = []
    /** @type {Set<number>} */
    const used = new Set()
    /** @param {any} v */
    const ok = (v) => typeof v === 'number' && isFinite(v)
    root
      .querySelectorAll('text.apexcharts-datalabel')
      .forEach((/** @type {any} */ t) => {
        const k = nearest(xs, parseFloat(t.getAttribute('cx')))
        if (k < 0) return
        const [x, y] = drawnAt(t)
        const s = src?.get(k)
        let dx = 0
        let dy = 0
        let o = 0
        if (s) {
          used.add(k)
          dx = s.x - x
          dy = s.y - y
          o = s.o
        } else if (!src?.size && [fx?.[k], fy?.[k], xs[k], ys[k]].every(ok)) {
          dx = fx[k] - xs[k]
          dy = fy[k] - ys[k]
        }
        if (o < 1 || Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
          items.push({ els: withPill(t), dx, dy, o, to: 1 })
        }
      })
    src?.forEach((s, k) => {
      if (used.has(k)) return
      // A copy of what was on screen, which no label pass reads.
      const els = s.els.map((/** @type {any} */ e) => {
        const c = e.cloneNode(true)
        c.setAttribute('class', LABEL_EXIT)
        c.setAttribute('pointer-events', 'none')
        c.removeAttribute('transform')
        root.appendChild(c)
        return c
      })
      const [x, y] = drawnAt(els[els.length - 1])
      items.push({ els, dx: s.x - x, dy: s.y - y, o: s.o, to: 0, out: true })
    })
    if (!items.length) return
    items.forEach((it) => {
      it.bases = it.els.map((e) => e.getAttribute('transform') || '')
      // Each node's own opacity (a pill's), which the fade multiplies; a
      // copy caught mid-fade carries the fade in it too.
      it.ops = it.els.map(
        (e) =>
          parseFloat(e.getAttribute('opacity') ?? '1') /
          (it.out && it.o > 0 ? it.o : 1),
      )
    })
    /** @param {number} e */
    const place = (e) =>
      items.forEach(({ els, dx, dy, o, to, out, bases, ops }) =>
        els.forEach((el, q) => {
          const b = /** @type {string[]} */ (bases)[q]
          const k = out ? 1 : 1 - e
          if (k) {
            el.setAttribute(
              'transform',
              `translate(${dx * k} ${dy * k}) ${b}`.trim(),
            )
          } else if (b) el.setAttribute('transform', b)
          else el.removeAttribute('transform')
          const op = mix(o, to, e)
          const own = /** @type {number[]} */ (ops)[q]
          if (op >= 1 && own >= 1) el.removeAttribute('opacity')
          else el.setAttribute('opacity', String(own * op))
        }),
      )
    this._tween(
      0,
      w.config.chart.animations.dynamicAnimation.speed,
      place,
      () =>
        items.forEach((it) => it.out && it.els.forEach((el) => el.remove())),
    )
  }

  /**
   * Fade the whole and draw (or retire) the part. Runs inside renderSeries
   * right after the whole's path is placed, so the part group lands above it
   * and below the labels.
   * @param {any} o
   * @param {any} el the whole's rendered path
   * @param {{delay: number, delayMs: number, speed: number, fill: string, elSeries: any, elBarShadows?: any, labels?: any, pathFrom: string, pathTo: string}} r
   * @param {{key: string, prev: any, geo: any, fadeTo: number, active: boolean, whole: any, bar: any}} s
   */
  _paintBar(o, el, r, s) {
    const w = this.w
    const cfg = this.cfg
    const animate = this._animates()
    const { key, prev, geo, fadeTo, active, bar } = s
    const elSeries = r.elSeries
    this._seriesEls.set(String(o.realIndex), elSeries.node)

    // Where the part goes, and whether it starts or lands on the whole's
    // exact shape (the whole then sits at 0 under it, see Look). In a stack
    // a part that left drains to where it would sit now, since the parts
    // below it may have moved.
    /** @type {string | null} */
    let to = geo?.pathTo || null
    const exit = !to && !!prev?.d && animate
    if (exit) to = this._exitTo(prev, active, r.pathTo, geo?.base)
    const start =
      to && !exit ? this._from(prev, geo?.base, r.pathFrom, !!bar) : null
    let from = start ? start.d : prev?.d || null
    // A clear lands each part on its whole: the whole comes back the frame
    // the part leaves.
    const lands = exit && !active

    // A stacked part's corners follow the part stack, so a pick that changes
    // which part tops it (or a first pick, which starts the part as its
    // whole) changes its corner state: the morph is padded the way the
    // renderer pads its own segments. Its mirror is held across the tween
    // (the union of where it was and where it goes), as the wholes' are, and
    // dropped once the shape has arrived.
    let cls = 'apexcharts-bar-highlight-part'
    let flip = false
    /** @type {string | null} */
    let interp = null
    if (bar && to) {
      if (from && from !== to) {
        const save = bar._pathToInterp
        bar._pathToInterp = null
        const m = bar.cornerMorph(from, to, exit ? undefined : geo.square)
        if (m !== to) {
          from = m
          interp = bar._pathToInterp
        }
        bar._pathToInterp = save
      }
      const flipCls = bar.isHorizontal ? FLIP_X : FLIP_Y
      const wholeFlip = el.node.classList.contains(flipCls)
      flip = exit ? (active ? !!prev.flip : wholeFlip) : geo.flip
      const was = prev?.d ? !!prev.flip : !!start?.cover && wholeFlip
      if (flip || (animate && was)) cls += ' ' + flipCls
      if (!flip && animate && was) {
        cls += ' ' + HELD
        this._settleHeld(bar)
      }
    }

    // The outline needs a plain colour; a gradient, pattern or image fill is
    // an object or a url, so it takes the datum's palette colour. The part
    // itself keeps the whole's own paint, made solid: a plain colour carries
    // the fill opacity in its alpha, and a part that let it through would
    // show the faded wholes and outlines under it wherever the part stack
    // sits off the whole stack (or its own whole's outline at its edges).
    // Its alpha starts at the whole's and comes up to 1 with the pick's
    // fade, so frame 0 is the whole as it was (see `alpha` below).
    const color =
      typeof r.fill === 'string' &&
      r.fill !== 'none' &&
      r.fill.indexOf('url') < 0
        ? r.fill
        : w.globals.colors[
            w.config.plotOptions.bar.distributed ? o.j : o.realIndex
          ]
    const [paint, alpha] = solid(r.fill && r.fill !== 'none' ? r.fill : color)

    // The 3D funnel draws a connector shadow above each stage after the
    // first, just before the stage itself, so the group's last child is this
    // stage's. It fades with the stage it joins, but no part covers it, so it
    // moves between the plain fades. (The group's own opacity is owned by
    // the reveal class.)
    const shadow =
      o.j > 0 && r.elBarShadows ? r.elBarShadows.node.lastElementChild : null
    const sf0 = prev ? prev.f : 1

    const g = this._partGroup(elSeries, 'apexcharts-bar-highlight')
    const part = to
      ? this._emitPart(g, {
          i: o.i,
          j: o.j,
          realIndex: o.realIndex,
          from: from || to,
          to,
          interp,
          paint,
          delay: r.delay,
          speed: r.speed,
          cls,
          chartType: 'bar',
          clip: `url(#gridRectBarMask${w.globals.cuid})`,
        })
      : null
    // A forecast datum's whole is drawn lighter, and its part with it, so
    // the forecast still reads (and a part on the whole's exact shape still
    // composites to the screen). On top of that the part's alpha: the
    // whole's while it starts on the whole's exact shape (a first pick) or
    // lands there (a clear), solid otherwise, from where it was on screen.
    const own = ownOpacity(el.node)
    const a0 = start?.cover && animate ? alpha : prev?.d ? (prev.al ?? 1) : 1
    const a1 = lands ? alpha : 1
    // The whole's own stroke (a page's 1px white seam between stacked
    // segments, or the series colour bars are stroked in by default) is
    // centred on its edge, and a part on the whole's exact shape covers the
    // inner half of it. So while the part starts there (a first pick) or
    // lands there (a clear) it carries that stroke itself, at full strength
    // over the whole's own, which is hidden under it: frame 0 and the landing
    // frame are the whole as drawn. The stroke eases out as the part leaves
    // the whole's shape (in, as it comes back), on the fade's clock, and a
    // part at rest has none. `k` is its strength, as `al` is the alpha's.
    const ow = s.whole || prev?.o ? (cfg.outline?.width ?? 1) : 0
    const wn = el.node
    const sc = wn.getAttribute('stroke')
    const k0 = start?.cover && animate ? 1 : prev?.d ? (prev.k ?? 0) : 0
    const k1 = lands ? 1 : 0
    const carry =
      !!part &&
      ow > 0 &&
      (k0 > 0 || k1 > 0) &&
      parseFloat(wn.getAttribute('stroke-width')) > 0 &&
      !!sc &&
      sc !== 'none' &&
      sc !== 'transparent'
    const so = ownOpacity(wn, 'stroke-opacity')
    const SK = ['stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray']
    /** @type {Record<string, string | null>} */
    const bare = {}
    if (carry) {
      SK.forEach((n) => {
        bare[n] = part.node.getAttribute(n)
        part.node.setAttribute(n, wn.getAttribute(n) ?? '')
      })
      if (!wn.hasAttribute('stroke-dasharray')) {
        part.node.removeAttribute('stroke-dasharray')
      }
    }

    // What this datum draws, for the next update to start from. The fade is
    // state of its own: a datum with no part is still drawn faded. The fade
    // writes the look it is at into `lf`/`lo` every frame, and a part on its
    // way out is kept in `n`, so an update landing mid-flight reads the
    // screen (see capture). A clear is kept only while its fade runs (`c`).
    /** @type {any} */
    const rec = {
      d: null,
      f: fadeTo,
      base: geo?.base ?? prev?.base,
      edge: false,
      s: geo?.s ?? prev?.s,
      n: exit ? part?.node : null,
      c: !active,
      al: a1,
      k: carry ? k1 : 0,
    }
    this._targets.set(key, rec)
    // (Written only when it is ever below 1: a part solid throughout keeps
    // the attribute it was drawn with, so a canvas command stays as it was.)
    /** @param {number} t */
    const strength = (t) => {
      const a = mix(a0, a1, t)
      rec.la = a
      if (part && (own < 1 || a0 < 1 || a1 < 1)) {
        part.node.setAttribute('fill-opacity', String(own * a))
      }
      if (!carry) return
      const k = mix(k0, k1, t)
      rec.lk = k
      if (k > 0 || t < 1) {
        part.node.setAttribute('stroke-opacity', String(so * k))
        // The whole shows its own stroke only on the frames its look has no
        // outline (the cover and the landing), and the part's is over it.
        if (!(rec.lo > 0) && k > 0) wn.setAttribute('stroke-opacity', '0')
      } else {
        // At rest a part draws no stroke: back as it was emitted.
        part.attr(bare)
      }
    }

    // Fade the whole. It multiplies with an opacity the bar already carries
    // (forecastDataPoints) instead of overwriting it. The thin outline that
    // keeps a faded whole readable rides the same fade, so it comes in with
    // the pick and leaves with the clear instead of snapping. A whole that
    // draws nothing (null or 0) has no outline at rest; one shrinking to
    // nothing (a series the legend hides) keeps it on the way down, fading
    // with the tween.
    const end = lands ? COVERED : look(fadeTo)
    this._fade(
      el.node,
      start?.cover && animate
        ? COVERED
        : prev
          ? { f: prev.f, o: prev.o ?? look(prev.f).o }
          : PLAIN,
      s.whole ? end : { f: end.f, o: 0 },
      r,
      {
        outline:
          ow > 0
            ? { color, width: ow, opacity: cfg.outline?.opacity ?? 1 }
            : null,
        also: (t) => {
          shadow?.setAttribute('fill-opacity', String(mix(sf0, fadeTo, t)))
          strength(t)
        },
        force: !!part && (a0 !== a1 || carry),
        land: lands ? PLAIN : undefined,
        // A retired part leaves on the frame its whole lands.
        done: exit ? () => part?.remove() : undefined,
        rec,
      },
    )
    if (!part || !to || exit) return

    // A part past its whole (an average) would hide where the whole ends, so
    // the whole's edge is traced over it. It arrives when the part does. In
    // a stack the part sits elsewhere than its whole, so there is nothing to
    // trace; a 100% part stack capped at 100 is only marked.
    if (geo?.overflow) {
      part.node.classList.add('apexcharts-highlight-overflow')
    }
    if (geo?.overflow && !bar) {
      const edge = new Graphics(w, this.ctx).drawPath({
        d: r.pathTo,
        stroke: '#fff',
        strokeWidth: 1,
        fill: 'none',
        strokeDashArray: 3,
        classes: `${PART} apexcharts-highlight-edge`,
      })
      edge.attr('clip-path', `url(#gridRectBarMask${w.globals.cuid})`)
      edge.node.setAttribute('pointer-events', 'none')
      g.add(edge)
      const show = (/** @type {number} */ t) =>
        edge.node.setAttribute('stroke-opacity', String(0.75 * t))
      if (animate && !prev?.edge) this._tween(r.delayMs, r.speed, show)
      else show(1)
    }

    // On canvas there are no nodes to hover: its hit test finds the part
    // as a painted mark of the same datum.
    const rk = this.ctx.renderer?.kind
    if ((!rk || rk === 'svg') && !w.config.plotOptions.bar.isFunnel) {
      this._hitProxy(g, to, r.pathTo, el.node, !!w.globals.isBarHorizontal)
    }
    if (r.labels) this._contrastLabels(r.labels, to)
    Object.assign(rec, {
      d: to,
      base: geo?.base,
      edge: !!geo?.overflow && !bar,
      s: geo?.s,
      flip,
      n: part.node,
    })
  }

  /**
   * The part's pixels outside its own whole (an average past it, a part on
   * the other side of zero, a part on a null whole) have no whole under them
   * to hover. Each such piece gets an invisible stand-in (see bindHit), so the
   * tooltip, the hover state and a click act on that bar wherever the pointer
   * is on it.
   * @param {any} g the part group
   * @param {string} partD the part's target path
   * @param {string} wholeD the whole's target path
   * @param {any} whole the whole's node
   * @param {boolean} horizontal
   */
  _hitProxy(g, partD, wholeD, whole, horizontal) {
    const ax = horizontal ? 0 : 1
    const [a, b] = pathSpan(partD, ax)
    const [c, d] = pathSpan(wholeD, ax)
    const [lo, hi] = pathSpan(partD, ax ? 0 : 1)
    if (!(b - a > 0.5) || !(hi - lo > 0.5)) return
    /** @type {number[][]} */
    const pieces = []
    if (!(d - c > 0.5)) pieces.push([a, b])
    else {
      if (a < c) pieces.push([a, Math.min(b, c)])
      if (b > d) pieces.push([Math.max(a, d), b])
    }
    const graphics = new Graphics(this.w, this.ctx)
    for (const [u, v] of pieces) {
      if (v - u < 0.5) continue
      const n = graphics.drawPath({
        d: horizontal
          ? `M ${u} ${lo} L ${v} ${lo} L ${v} ${hi} L ${u} ${hi} Z`
          : `M ${lo} ${u} L ${hi} ${u} L ${hi} ${v} L ${lo} ${v} Z`,
        stroke: 'none',
        strokeWidth: 0,
        fill: 'none',
        classes: 'apexcharts-highlight-hit',
      }).node
      n.setAttribute('pointer-events', 'all')
      n.setAttribute('clip-path', `url(#gridRectBarMask${this.w.globals.cuid})`)
      bindHit(whole, n)
      g.add(n)
    }
  }

  /**
   * A part held a mirror across this render's tween. The renderer drops the
   * held mirrors once its tweens have landed, but only when a whole held
   * one, so ask for that sweep once the render is done if no whole did.
   * @param {any} bar
   */
  _settleHeld(bar) {
    if (this._held) return
    this._held = true
    const w = this.w
    Promise.resolve().then(() => {
      if (
        !w.globals.isDestroyed &&
        !w.dom.baseEl?.querySelector(`.apexcharts-series > .${HELD}`)
      ) {
        bar.settleHeldMirrors()
      }
    })
  }

  /**
   * Where a new part starts. A part drawn a frame ago moves on from there. A
   * first pick starts it as the whole on screen, so frame 0 is the chart
   * before the pick and the solid drains down (or grows past the whole, for
   * an average): `cover` says the part sits on the whole's exact shape.
   * 'baseline' rises instead, and so does a part arriving at a datum that was
   * already faded. Null when there is no start shape to take (the caller
   * starts the part at its target).
   * In a stack the whole moves from its own place in the whole stack, so
   * only a first pick (the whole on screen, about to be covered) starts there;
   * a mount or a datum entering under a pick rises from the part's own base.
   * @param {any} prev what this datum drew a frame ago
   * @param {string | undefined} base the part's zero-length shape
   * @param {string | undefined} wholeFrom the shape the whole moves from
   * @param {boolean} [stacked]
   * @returns {{d: string, cover: boolean} | null}
   */
  _from(prev, base, wholeFrom, stacked) {
    if (prev?.d) return { d: prev.d, cover: false }
    if (
      base &&
      (prev ||
        this.cfg.enter === 'baseline' ||
        (stacked && !(this.w.globals.dataChanged && !this._prev()?.size)))
    ) {
      return { d: base, cover: false }
    }
    return wholeFrom ? { d: wholeFrom, cover: true } : null
  }

  /**
   * Where a part with nothing to draw now goes before it leaves. On a clear it
   * grows back into the whole as the whole comes back to full opacity, so the
   * last frame is the plain chart; a datum that lost its part while the pick
   * stays drains to its baseline.
   * @param {any} prev
   * @param {boolean} active
   * @param {string} wholeTo the shape the whole lands on
   * @param {string} [base] the part's zero-length shape now, when it has moved
   */
  _exitTo(prev, active, wholeTo, base) {
    return active ? base || prev.base || prev.d : wholeTo
  }

  /**
   * The group a series' parts nest in. It is re-appended on every call, so the
   * parts sit above every whole drawn so far, and the labels group (appended
   * after the paint step) stays on top. Nested, never a direct child of the
   * series group, so Series.pushPaths never captures a part as a whole.
   * @param {any} elSeries
   * @param {string} cls
   */
  _partGroup(elSeries, cls) {
    let g = elSeries.node._apxHighlight
    if (!g || g.node.parentNode !== elSeries.node) {
      g = new Graphics(this.w, this.ctx).group({ class: cls })
      elSeries.node._apxHighlight = g
    }
    elSeries.add(g)
    return g
  }

  /**
   * One part path, emitted through the renderer's own renderPaths (so it
   * morphs on the whole's clock and records on canvas), with no hit or
   * capture class, and its datum as the whole carries it.
   * @param {any} g the part group
   * A stroked part (a line) passes its `stroke` and `width`; `num` and
   * `scroll` are the renderer's numeric coordinates and scroll morph.
   * @param {{i: number, j: any, realIndex: number, from: string, to: string, interp?: string | null, paint: any, stroke?: any, width?: number, num?: any, scroll?: boolean, delay: number, speed: number, cls: string, chartType: string, clip: string}} p
   */
  _emitPart(g, p) {
    const w = this.w
    const emit = seriesEmitter(this.ctx, new Graphics(w, this.ctx))
    const part = /** @type {any} */ (
      emit.renderPaths({
        i: p.i,
        j: p.j,
        realIndex: p.realIndex,
        pathFrom: p.from,
        pathTo: p.to,
        pathToInterp: p.interp || undefined,
        pathToNumeric: p.num,
        scrollMorph: !!p.scroll,
        stroke: p.stroke || 'none',
        strokeWidth: p.width || 0,
        fill: p.paint,
        animationDelay: p.delay,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: p.speed,
        className: `${PART} ${p.cls}`,
        chartType: p.chartType,
        bindEventsOnPaths: false,
      })
    )
    if (!part || !part.node) return null
    part.attr('clip-path', p.clip)
    part.node.setAttribute('pointer-events', 'none')
    part.node.setAttribute('index', String(p.realIndex))
    part.node.setAttribute('j', String(p.j))
    g.add(part)
    return part
  }

  /**
   * Take a whole from one Look to another on its mark's clock: the delay and
   * speed the renderer gave the mark, so the fade and the shape move
   * together. Without an animation it lands at once. `land` is a look to jump
   * to on the landing frame (a clear's whole, back to plain the frame its part
   * leaves); `done` runs on that same frame, and holds a tween open even when
   * the look does not change (a part draining away under a faded whole).
   * @param {any} node the whole's mark
   * @param {Look} a @param {Look} b
   * @param {{delayMs: number, speed: number, el?: any}} r the mark's clock;
   * with `el`, the tween runs on a runner of that mark (see _tween)
   * `rec` is told the look on every frame (`lf`, `lo`) and whether the tween
   * is still running (`run`). `attr` is the strength attribute faded
   * (fill-opacity by default). `anim` decides whether to tween at all, in
   * place of the bar morph's rule, and `force` tweens even when the look
   * stays (something else, through `also`, still moves). An outline without
   * a `width` changes the stroke's colour only: its width is the renderer's.
   * @param {{outline?: {color: string, width?: number, opacity: number} | null, attr?: string, anim?: boolean, force?: boolean, curve?: (t: number) => number, also?: (t: number) => void, land?: Look, done?: () => void, rec?: any}} opt
   */
  _fade(node, a, b, r, opt) {
    const attr = opt.attr || 'fill-opacity'
    const k = ownOpacity(node, attr)
    const ol = opt.outline
    const rec = opt.rec || {}
    const attrs =
      ol && ol.width == null
        ? ['stroke', 'stroke-opacity']
        : ['stroke', 'stroke-width', 'stroke-opacity']
    const own = attrs.map((n) => node.getAttribute(n))
    /** @param {number} f @param {number} o */
    const set = (f, o) => {
      rec.lf = f
      rec.lo = ol ? o : 0
      node.setAttribute(attr, String(k * f))
      if (!ol) return
      if (o <= 0) {
        // The mark's own stroke, as drawn.
        attrs.forEach((n, x) =>
          own[x] == null
            ? node.removeAttribute(n)
            : node.setAttribute(n, own[x]),
        )
      } else {
        node.setAttribute('stroke', ol.color)
        if (ol.width != null) {
          node.setAttribute('stroke-width', String(ol.width))
        }
        node.setAttribute('stroke-opacity', String(ol.opacity * Math.min(1, o)))
      }
    }
    /** @param {number} t */
    const frame = (t) => {
      set(mix(a.f, b.f, t), mix(a.o, b.o, t))
      opt.also && opt.also(t)
    }
    const land = () => {
      rec.run = false
      if (opt.land) set(opt.land.f, opt.land.o)
      opt.done && opt.done()
    }
    if (
      (opt.anim ?? this._animates()) &&
      (a.f !== b.f || a.o !== b.o || opt.done || opt.force)
    ) {
      rec.run = true
      this._tween(r.delayMs, r.speed, frame, land, opt.curve, r.el)
    } else {
      frame(1)
      land()
    }
  }

  /**
   * Parse side: what each part reaches on the value axis. Unstacked, that is
   * the part itself. In a stack it is the running sum of the parts below it
   * and its own, per stack key (`keyOf(i, j)`), in series order; `split`
   * keeps positive and negative parts in separate sums, as diverging bar
   * stacks are drawn. A null part adds nothing and reaches nothing new.
   * `fresh(i, j)` says a stack starts over at that datum (both signs).
   * @param {(number | null)[][]} parts
   * @param {((i: number, j: number) => string) | null} keyOf
   * @param {boolean} [split]
   * @param {(i: number, j: number) => boolean} [fresh]
   * @returns {(number | null)[][]}
   */
  _runningExt(parts, keyOf, split, fresh) {
    if (!keyOf) return parts
    /** @type {Map<string, number>} */
    const sums = new Map()
    return parts.map((row, i) =>
      row.map((p, j) => {
        const k = keyOf(i, j)
        if (fresh && fresh(i, j)) {
          sums.delete(k + '+')
          sums.delete(k + '-')
        }
        if (p == null) return null
        const key = k + (split && p < 0 ? '-' : '+')
        const v = (sums.get(key) || 0) + p
        sums.set(key, v)
        return v
      }),
    )
  }

  /**
   * A label drawn in the default white reads on the solid part but not on the
   * faded tint around it. Where the text does not fit inside the part (a thin
   * funnel stage, a short column), it takes the chart's text colour instead.
   * @param {any} labels the datum's label group
   * @param {string} partPath
   */
  _contrastLabels(labels, partPath) {
    const w = this.w
    const node = labels.node
    if (!node || /rotate\((?!0\))/.test(node.getAttribute('transform') || ''))
      return
    const [x0, x1] = pathSpan(partPath, 0)
    const [y0, y1] = pathSpan(partPath, 1)
    const graphics = new Graphics(w)
    node.querySelectorAll('text').forEach((/** @type {any} */ t) => {
      const fill = (t.getAttribute('fill') || '').toLowerCase()
      if (fill !== '#fff' && fill !== '#ffffff' && fill !== 'white') return
      const rect = graphics.getTextRects(
        t.textContent,
        t.getAttribute('font-size'),
        t.getAttribute('font-family'),
        undefined,
        true,
        t.getAttribute('font-weight'),
      )
      const x = parseFloat(t.getAttribute('x'))
      const y = parseFloat(t.getAttribute('y'))
      const anchor = t.getAttribute('text-anchor')
      const left =
        anchor === 'middle'
          ? x - rect.width / 2
          : anchor === 'end'
            ? x - rect.width
            : x
      const fits =
        left >= x0 - 1 &&
        left + rect.width <= x1 + 1 &&
        y - rect.height * 0.75 >= y0 - 1 &&
        y + rect.height * 0.25 <= y1 + 1
      if (!fits) t.setAttribute('fill', w.config.chart.foreColor)
    })
  }

  /**
   * Tooltip, once a row is written: the value reads "part / whole" and the
   * marker is the mark in small, its part solid against the faded whole. Rows
   * are rewritten on every hover, so the marker is put back here too once
   * nothing is highlighted.
   * @param {any} refs the row's elements
   * @param {number} s the series the row shows
   * @param {any} j
   * @param {any} f the row's formatters
   */
  tooltipRow(refs, s, j, f) {
    const w = this.w
    const cfg = this.cfg
    const tt = cfg.tooltip || {}
    // A slice of a circle is a row with no datum index (j null).
    const ax = w.globals.axisCharts
    const on =
      this.isActive() &&
      tt.show !== false &&
      (j != null || !ax) &&
      !!refs.yValue
    // A ring split in lanes: the row is the hovered lane's (see RadialPart).
    const lane =
      !ax && this._ind === 'lanes' && w.config.chart.type === 'radialBar'
        ? this._lane?.[0] === s
          ? this._lane[1]
          : 'part'
        : undefined
    if (refs.marker) {
      // A row filled with its series colour hides its marker. A treemap tile
      // has a colour of its own (distributed, shaded or scaled).
      swatch(
        refs.marker,
        on && !w.config.tooltip.fillSeriesColor
          ? this._tiles?.get(s + '|' + j)?.base || w.globals.colors[s]
          : null,
        lane ? (cfg.radialBar?.lanes?.opacity ?? LANE) : cfg.fadeOpacity,
        lane,
      )
    }
    if (!on) return
    const p = this.valueAt(s, j)
    const series = /** @type {any[]} */ (w.seriesData.series)
    const whole = ax ? series[s]?.[j] : series[s]
    // The opts core hands a circle's row formatter (tooltip Labels), so a
    // formatter reading opts.globals keeps working.
    const opts = ax
      ? { series, seriesIndex: s, dataPointIndex: j, w }
      : {
          ...w,
          w,
          series,
          seriesIndex: s,
          dataPointIndex: s,
          highlight: info(p, whole),
          lane,
        }
    if (typeof tt.formatter === 'function') {
      refs.yValue.innerHTML = String(tt.formatter(p, whole ?? null, opts) ?? '')
      return
    }
    const muted =
      '<span class="apexcharts-highlight-total" style="font-weight: 400; opacity: 0.6">'
    if (lane === 'whole') {
      // The whole's lane: its value as the row reads it, the part beside it
      // for context, named in the chart's locale.
      if (p != null) {
        const word = w.globals.locale?.highlightFilter?.part ?? 'part'
        refs.yValue.innerHTML += ` ${muted}(${word} ${f.yLbFormatter(p, opts)})</span>`
      }
      return
    }
    // The whole as the row already formatted it, set back from the part.
    let rest = refs.yValue.innerHTML
    if (p != null) {
      rest = `/ ${rest}`
      if (tt.share && whole) {
        rest += ` \u00b7 ${Math.round((p / whole) * 100)}%`
      }
    }
    refs.yValue.innerHTML =
      (p == null ? '' : `${f.yLbFormatter(p, opts)} `) +
      `${muted}${rest}</span>`
  }

  /**
   * Drilldown, both directions: the pick belongs to the page, not to a drill
   * level. Drop it from the view and tell the page, which re-sends the pick
   * for the level now on screen.
   * @param {any} view
   */
  drillView(view) {
    if (Array.isArray(view?.series)) {
      view.series = view.series.map(stripSeries)
      // The drill applies its level without moving the chart's baseline
      // (initialSeries stays the top level), so remember the level itself.
      this._level = { series: view.series, base: this.w.globals.initialSeries }
    }
    // A level is applied as a merge, which keeps top-level config: a circle's
    // parts would land by index on a level with as many slices.
    if (view && this.cfg.data != null) {
      view.highlightFilter = { ...view.highlightFilter, data: null }
    }
    // The drilled render parses without parts, and afterRender reports the
    // clear once that level is on screen, where a re-sent pick belongs.
  }

  /** Whether a drill level is on screen and nothing has replaced it since. */
  _drilled() {
    const lv = this._level
    return !!(
      lv &&
      (this.ctx.drilldown?.depth || 0) > 0 &&
      this.w.globals.initialSeries === lv.base
    )
  }

  /** @param {'enter'|'update'|'clear'} phase */
  _fire(phase) {
    const fn = this.w.config.chart.events?.highlightFilterChanged
    if (typeof fn === 'function') {
      fn(this.ctx, { active: phase !== 'clear', phase })
    }
  }

  /**
   * Pie.draw, once, before anything is sized or drawn (see PiePart), and
   * Radial.drawArcs, once, before the centre labels and the rings (see
   * RadialPart).
   * @param {any} pie the Pie or Radial renderer
   */
  pie(pie) {
    if (pie.chartType === 'radialBar') radialPass(this, pie)
    else piePass(this, pie)
  }

  /**
   * Treemap.draw, once, after the layout and before any parent or tile is
   * drawn. Returns the pass's tile painter (see TreemapPart), or undefined.
   * @param {any} tm the Treemap renderer
   */
  treemap(tm) {
    return treemapPass(this, tm)
  }

  /** Fired once the render that changed the highlight has been drawn. */
  afterRender() {
    // A tooltip a radial pick turned on is drawn by now: the chart's own
    // setting goes back (the next pick turns it on again).
    if (this._tipOn) {
      this._tipOn = false
      this.w.config.tooltip.enabled = false
    }
    // A circle's labels ride from where they were once the render is on
    // screen, unless the circle itself moves: CircleTransition carries them
    // then, and two transforms on one label would fight.
    const ride = this._ride
    this._ride = null
    const ct = /** @type {any} */ (this.w.globals).circleTween
    if (ride && !(ct && !ct.done)) ride()
    const was = this._drawnSig
    const now = this._sig
    if (was === now) return
    this._drawnSig = now
    this._fire(!was ? 'enter' : !now ? 'clear' : 'update')
  }

  /**
   * Set the parts and redraw. `parts` is one row per series (null where there
   * is no part), or a function of the datum. A pie, donut, polarArea or
   * radialBar takes one value per slice (or ring); a row of one value reads
   * as that value there (_parseCircle).
   * @param {any} parts
   * @param {{animate?: boolean, series?: any[]}} [opts]
   */
  set(parts, opts = {}) {
    const w = this.w
    const gl = /** @type {any} */ (w.globals)
    if (!gl.axisCharts) return this._setCircle(parts, opts)
    const base = opts.series || this._rawSeries()
    // A nested treemap's parts sit on its leaves, by leaf index. The tree
    // outlives a change to another type, so the type decides.
    if (w.config.chart.type === 'treemap' && gl.treemapRoots) {
      return this._apply(treeSeries(this, base, parts), opts)
    }
    // Under the data reducer the rows here are the raw points, and the chart
    // draws a reduced subset of them: only a part riding on its own point
    // follows the reduction.
    const perPoint =
      !opts.series &&
      !!gl.dataReducerRawSeries &&
      !!w.config.chart.dataReducer?.enabled
    const series = base.map((s, i) => {
      const data = Array.isArray(s.data) ? s.data : []
      const row =
        typeof parts === 'function'
          ? data.map((/** @type {any} */ d, /** @type {number} */ j) =>
              parts({
                seriesIndex: i,
                dataPointIndex: j,
                seriesName: s.name,
                x: isPoint(d)
                  ? d.x
                  : Array.isArray(d)
                    ? d[0]
                    : w.labelData.labels[j],
                // From the datum itself, so it matches x and datum whatever
                // the chart has parsed (new series, a reduced or hidden row).
                value: valueOf(
                  d,
                  opts.series || perPoint ? null : w.seriesData.series[i]?.[j],
                ),
                datum: d,
                w,
              }),
            )
          : Array.isArray(parts?.[i])
            ? parts[i]
            : null
      const out = stripSeries(s)
      if (row) {
        if (
          perPoint &&
          out.data.every((/** @type {any} */ d) => typeof d !== 'number')
        ) {
          out.data = out.data.map(
            (/** @type {any} */ d, /** @type {number} */ j) =>
              d == null
                ? d
                : Array.isArray(d)
                  ? { x: d[0], y: d[1], highlight: row[j] }
                  : { ...d, highlight: row[j] },
          )
        } else {
          out.highlightData = row
        }
      }
      return out
    })
    return this._apply(series, opts)
  }

  /** @param {{animate?: boolean}} [opts] */
  clear(opts = {}) {
    if (!this.w.globals.axisCharts) return this._setCircle(null, opts)
    return this._apply(this._rawSeries().map(stripSeries), opts)
  }

  /**
   * set() and clear() on a pie, donut, polarArea or radialBar: the parts are one value
   * per slice in `highlightFilter.data` (a numeric series has nowhere else
   * to carry them). Parts on the slices' own points would win over it, so
   * they are taken off.
   * @param {any} parts (number|null)[], a function of the slice, or null
   * @param {{animate?: boolean, series?: any[]}} opts
   */
  _setCircle(parts, opts) {
    const w = this.w
    const raw = opts.series || this._rawSeries()
    /** @type {any} */
    const upd = {}
    if (opts.series || raw.some(carries)) {
      upd.series = raw.map(stripSeries)
    }
    if (typeof parts === 'function') {
      // The slices' own points, in order, when the series are objects.
      const pts = slicePoints(raw)
      const vals = opts.series ? [] : w.seriesData.series
      const names = w.seriesData.seriesNames
      const n = pts.length || raw.length
      const row = []
      for (let i = 0; i < n; i++) {
        const d = pts.length ? pts[i] : raw[i]
        row.push(
          parts({
            seriesIndex: i,
            dataPointIndex: i,
            seriesName: pts.length ? String(d.x) : names[i],
            x: pts.length ? d.x : names[i],
            value: valueOf(d, vals[i]),
            datum: d,
            w,
          }),
        )
      }
      parts = row
    }
    upd.highlightFilter = { data: Array.isArray(parts) ? parts : null }
    return this.ctx.updateOptions(
      upd,
      false,
      opts.animate !== false,
      true,
      !this._drilled(),
    )
  }

  /**
   * At a drill level the pick redraws that level, and leaves the baseline
   * resetSeries() returns to (the top level) where it is.
   * @param {any[]} series @param {{animate?: boolean}} opts
   */
  _apply(series, opts) {
    const drilled = this._drilled()
    if (drilled && this._level) this._level.series = series.map(stripSeries)
    return this.ctx.updateSeries(series, opts.animate !== false, !drilled)
  }

  /** The series as the chart was handed them: nested treemaps and reduced
   * rows are kept raw elsewhere, and re-feeding derived rows would lose them.
   * A drill level is the level on screen. */
  _rawSeries() {
    const gl = /** @type {any} */ (this.w.globals)
    const raw =
      (this._drilled() && this._level?.series) ||
      gl.treemapRawSeries ||
      (gl.dataReducerRawSeries && this.w.config.chart.dataReducer?.enabled
        ? gl.initialSeries
        : null) ||
      gl.initialSeries ||
      this.w.config.series
    return /** @type {any[]} */ (raw).map((/** @type {any} */ s) =>
      isPoint(s) ? { ...s } : s,
    )
  }

  teardown() {
    Array.from(this._live).forEach((t) => t.finish())
    this._live.clear()
    this._targets = new Map()
    this._render = null
    this._cu = null
    this._level = null
    this._seriesEls = new Map()
    this._tiles = null
    this._tmDefs = []
    this.ctx.events?.removeEventListener('mounted', this._onRender)
    this.ctx.events?.removeEventListener('updated', this._onRender)
  }
}

/**
 * The extent of a path's coordinates along one axis (0 = x, 1 = y).
 * @param {string} d @param {0 | 1} axis
 * @returns {[number, number]}
 */
function pathSpan(d, axis) {
  let lo = Infinity
  let hi = -Infinity
  String(d).replace(/([MLQCT])([^MLQCTZz]*)/g, (_m, _c, args) => {
    const nums = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
    for (let n = axis; n < nums.length; n += 2) {
      if (nums[n] < lo) lo = nums[n]
      if (nums[n] > hi) hi = nums[n]
    }
    return ''
  })
  return [lo, hi]
}

/**
 * The index of the value in `xs` nearest to `x`, or -1.
 * @param {any[]} xs @param {number} x
 */
function nearest(xs, x) {
  let k = -1
  let best = Infinity
  xs.forEach((v, q) => {
    if (v != null && Math.abs(v - x) < best) {
      best = Math.abs(v - x)
      k = q
    }
  })
  return k
}

/**
 * A label's text with the background pill drawn just before it, if any.
 * @param {any} t
 */
function withPill(t) {
  const bg = t.previousElementSibling
  return bg && bg.tagName.toLowerCase() === 'rect' ? [bg, t] : [t]
}

/**
 * A part that runs past its whole on the same side of zero.
 * @param {number} p @param {number | null | undefined} whole
 */
function overflows(p, whole) {
  return whole != null && whole !== 0 && p / whole > 1
}

/**
 * A tooltip marker drawn as the mark it stands for: the left half solid, the
 * right half the faded whole, outlined; for a ring in lanes, the hovered
 * lane (the part solid, the whole light and outlined). A null colour puts
 * the plain marker back.
 * @param {any} m the marker element
 * @param {string | null} c
 * @param {number} [fade]
 * @param {'part' | 'whole'} [lane]
 */
function swatch(m, c, fade = 0.2, lane) {
  const st = m.style
  const shape = m.firstElementChild
  if (!c) {
    if (!m._apxHl) return
    m._apxHl = false
    st.background = st.boxShadow = st.borderRadius = ''
    if (shape) shape.style.display = ''
    return
  }
  m._apxHl = true
  const tint =
    c.charAt(0) === '#'
      ? Utils.hexToRgba(c, fade)
      : `color-mix(in srgb, ${c} ${fade * 100}%, transparent)`
  st.background =
    lane === 'part'
      ? c
      : lane
        ? tint
        : `linear-gradient(90deg, ${c} 50%, ${tint} 50%)`
  st.boxShadow = `inset 0 0 0 1px ${c}`
  st.borderRadius = '3px'
  if (shape) shape.style.display = 'none'
}

/**
 * A datum's value as handed in, or the parsed one when the datum carries none.
 * @param {any} d @param {any} parsed
 */
function valueOf(d, parsed) {
  const v = isPoint(d) ? d.y : Array.isArray(d) ? d[1] : d
  return typeof v === 'number' ? v : (parsed ?? null)
}

/**
 * Apply an x mapping (and optionally a y mapping) to every coordinate pair of
 * an absolute path made of M/L/Q/C/Z commands, which is all the bar builders
 * emit. Used for the funnel part, which is its stage scaled about the
 * centreline.
 * @param {string} d
 * @param {(x: number) => number} fx
 * @param {((y: number) => number) | null} fy
 */
export function scalePath(d, fx, fy) {
  if (!d) return d
  return d.replace(/([MLQCT])([^MLQCTZz]*)/g, (_m, cmd, args) => {
    const nums = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
    for (let n = 0; n + 1 < nums.length; n += 2) {
      nums[n] = fx(nums[n])
      if (fy) nums[n + 1] = fy(nums[n + 1])
    }
    return `${cmd} ${nums.join(' ')} `
  })
}
