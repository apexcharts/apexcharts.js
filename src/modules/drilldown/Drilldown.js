// @ts-check
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'
import Breadcrumb from './Breadcrumb'
import DrilldownLoading from './DrilldownLoading'

/**
 * Opt-in drilldown navigation.
 *
 * Clicking a data point that carries a `drilldown: '<id>'` field swaps the chart
 * to the matching `chart.drilldown.series[id]` level; a breadcrumb and the
 * drillUp()/drillToRoot() methods navigate back. State lives on the instance
 * (this.stack) and survives updates because the module is created once in
 * InitCtxVariables and w.globals.events is never reset.
 *
 * Animation is delegated to the existing update pipeline:
 *   - same-type axis swap → updateSeries() (fastUpdate morph)
 *   - type change / non-axis / per-level overrides → updateOptions()
 *
 * @module Drilldown
 */

const MAX_DEPTH = 32

/**
 * Marks a `markers.discrete` entry as one we supplied for a drillable point, so
 * a resync replaces only our own and never an author's.
 */
const DRILL_MARKER = '__apexDrilldownMarker'

export default class Drilldown {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx

    /**
     * Restore-frames, one per level below root. stack[k] describes the level at
     * depth k+1: { id, name, restore } where `restore` is a snapshot of the
     * view at depth k (the parent), applied to navigate back to it.
     * @type {Array<{ id: string|number, name?: string, restore: object }>}
     */
    this.stack = []
    /** Full snapshot of the root view, captured lazily on the first drill. */
    this.rootSnapshot = null
    this._wired = false

    /**
     * Async levels already resolved, keyed by the requested id, so drilling back
     * down a branch does not re-fetch it. Cleared via `clearCache()`.
     * @type {Map<string|number, any>}
     */
    this._asyncCache = new Map()
    /**
     * The in-flight `onDrillDown` promise, if any. Guards against a second
     * click starting a second fetch (and a double drill) mid-resolve.
     * @type {Promise<any>|null}
     */
    this._pending = null
    /**
     * Whether the level on screen was given drill dots. A level that has none
     * must still send an empty `discrete` array so the previous level's dots
     * are cleared rather than left behind.
     * @type {boolean}
     */
    /** One warning per chart when a drillable point has nothing to click. */
    this._warnedUnreachable = false

    this.breadcrumb = new Breadcrumb(w, ctx, this)
    this.loading = new DrilldownLoading(w)

    this._onPointSelect = this._onPointSelect.bind(this)
    this._afterRender = this._afterRender.bind(this)
    this._onPlotDown = this._onPlotDown.bind(this)
    this._onPlotClick = this._onPlotClick.bind(this)
    /** Pointer-down position, to tell a click apart from a zoom drag. */
    this._downAt = null
    this._plotClickWired = null

    // Self-wire. The instance and w.globals.events both outlive updates, so the
    // listeners registered here persist for the chart's lifetime.
    this.init()
  }

  init() {
    const w = this.w
    if (!w.config.drilldown || !w.config.drilldown.enabled) return
    if (this._wired) return
    this._wired = true

    // Coexist with any user dataPointSelection handler: both the config callback
    // and the addEventListener registry fire (see Graphics.pathMouseDown).
    this.ctx.addEventListener('dataPointSelection', this._onPointSelect)
    // Re-mark drillable points + (re)render breadcrumb after every (re)render.
    // 'mounted' covers initial render; 'updated' covers fastUpdate + full update.
    this.ctx.addEventListener('mounted', this._afterRender)
    this.ctx.addEventListener('updated', this._afterRender)

    // Supply the drill dots for the FIRST render. Every later render gets them
    // from _apply (drills) or _afterRender (host-app updates).
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series)
    }
  }

  // ─── Observable state ──────────────────────────────────────────────────────

  /** @returns {Array<string|number>} e.g. ['root', '2024-quarters'] */
  get path() {
    return ['root', ...this.stack.map((f) => f.id)]
  }

  /** @returns {number} 0 at root */
  get depth() {
    return this.stack.length
  }

  // ─── Navigation API ────────────────────────────────────────────────────────

  /**
   * Drill into the child level with the given id.
   * @param {string|number} id
   * @param {any} [triggerPoint] - the clicked data point (for events / async ctx)
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  drillDown(id, triggerPoint, meta) {
    const child = this._resolveChild(id)
    if (child) return this._drillInto(child, triggerPoint, meta)

    if (typeof this.w.config.drilldown.onDrillDown === 'function') {
      return this._drillDownAsync(id, triggerPoint, meta)
    }

    // Unknown id, no resolver — warn and no-op (consistent with the rest of the API).
    console.warn(
      `ApexCharts: drilldown id "${id}" not found in chart.drilldown.series, and no onDrillDown resolver is set.`,
    )
    return Promise.resolve(this.ctx)
  }

  /**
   * Navigate back one level.
   * @returns {Promise<any>}
   */
  drillUp() {
    return this.drillToLevel(this.stack.length - 1)
  }

  /**
   * Navigate back to the root view.
   * @returns {Promise<any>}
   */
  drillToRoot() {
    return this.drillToLevel(0)
  }

  /**
   * Navigate to an arbitrary depth (0 = root). Used by breadcrumb clicks.
   * @param {number} targetDepth
   * @returns {Promise<any>}
   */
  drillToLevel(targetDepth) {
    const cur = this.stack.length
    if (targetDepth < 0 || targetDepth >= cur) return Promise.resolve(this.ctx)

    const from = this.path[this.path.length - 1]
    // To display depth D: apply the snapshot of that level's view.
    //   D === 0  → rootSnapshot
    //   D >= 1   → stack[D].restore (snapshot taken before drilling into D+1)
    const restore = targetDepth === 0 ? this.rootSnapshot : this.stack[targetDepth].restore
    this.stack = this.stack.slice(0, targetDepth)
    const to = this.path[this.path.length - 1]
    return this._apply(this._viewFromSnapshot(restore), 'up', { from, to })
  }

  // ─── Internals ─────────────────────────────────────────────────────────────

  /**
   * @param {string|number} id
   * @returns {any|null}
   */
  _resolveChild(id) {
    const list = this.w.config.drilldown && this.w.config.drilldown.series
    if (!Array.isArray(list)) return null
    return list.find((s) => s && s.id === id) || null
  }

  /**
   * @param {any} child
   * @param {any} [triggerPoint]
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillInto(child, triggerPoint, meta) {
    if (this.stack.length >= MAX_DEPTH) {
      console.warn(`ApexCharts: drilldown max depth (${MAX_DEPTH}) reached.`)
      return Promise.resolve(this.ctx)
    }
    if (!this.rootSnapshot) this.rootSnapshot = this._snapshot()
    const from = this.path[this.path.length - 1]
    this.stack.push({ id: child.id, name: child.name, restore: this._snapshot() })
    return this._apply(this._viewFromChild(child), 'down', {
      from,
      to: child.id,
      point: triggerPoint,
      seriesIndex: meta && meta.seriesIndex,
      dataPointIndex: meta && meta.dataPointIndex,
    })
  }

  /**
   * Resolve a level through `onDrillDown` and drill into it.
   *
   * Failure never changes state: on a throw, a rejection, or a resolver that
   * hands back something undrillable, the chart stays exactly where it was and
   * `drillDownError` fires. That is what makes this usable against a real
   * backend, where a fetch failing is ordinary rather than exceptional.
   *
   * @param {string|number|null} id
   * @param {any} point
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillDownAsync(id, point, meta) {
    const cfg = this.w.config.drilldown
    const fn = cfg.onDrillDown

    // Already resolved once: skip the round trip entirely. Drilling back down
    // the same branch is the common navigation pattern, so without this every
    // breadcrumb bounce re-fetches.
    const cached = this._cacheGet(id)
    if (cached) return this._drillInto(cached, point, meta)

    // A second click while a fetch is in flight must not start a second fetch
    // or drill twice. Returning the pending promise keeps the caller's
    // await-able contract intact.
    if (this._pending) return this._pending

    let result
    this.loading.show()
    try {
      result = fn({
        // `id` was missing here, so a resolver could not tell WHICH level was
        // asked for without re-deriving it from the point. It is the first
        // thing a real implementation needs (`fetch('/levels/' + id)`).
        id,
        point,
        seriesIndex: meta && meta.seriesIndex,
        dataPointIndex: meta && meta.dataPointIndex,
      })
    } catch (error) {
      this.loading.hide()
      this._fire('drillDownError', { id, error })
      return Promise.resolve(this.ctx)
    }

    const settle = () => {
      this._pending = null
      this.loading.hide()
    }

    const p = Promise.resolve(result).then(
      (child) => {
        settle()
        if (this._isDead()) return this.ctx
        if (!child || !child.data) {
          // Previously a silent no-op, which looks identical to "nothing
          // happened" and is the hardest kind of integration bug to chase.
          this._fire('drillDownError', {
            id,
            error: new Error(
              `drilldown: onDrillDown resolved without a drillable level for id "${id}" ` +
                `(expected an object with a \`data\` array).`,
            ),
          })
          return this.ctx
        }
        // A resolver naturally returns just the level, so default its id to the
        // one that was asked for; the breadcrumb and restore stack key off it.
        const level = child.id != null ? child : { ...child, id }
        this._cacheSet(id, level)
        return this._drillInto(level, point, meta)
      },
      (error) => {
        settle()
        if (this._isDead()) return this.ctx
        this._fire('drillDownError', { id, error })
        return this.ctx
      },
    )

    this._pending = p
    return p
  }

  /**
   * Whether the chart was torn down while a resolver was in flight.
   *
   * Clicking to drill and then navigating away is ordinary, not exceptional: a
   * component unmounts, `destroy()` runs, and the fetch settles afterwards.
   * Without this the resolved level would be applied to a destroyed chart,
   * which throws out of `updateOptions` and surfaces in the host app as an
   * unhandled rejection from a click the user has already forgotten about.
   *
   * @returns {boolean}
   */
  _isDead() {
    const w = this.w
    return !w || !w.globals || w.globals.isDestroyed === true
  }

  /** @returns {boolean} whether resolved async levels are cached. */
  _cacheEnabled() {
    const cfg = this.w.config.drilldown
    return !!(cfg && cfg.cache !== false)
  }

  /**
   * @param {string|number|null} id
   * @returns {any|null}
   */
  _cacheGet(id) {
    if (!this._cacheEnabled() || id == null) return null
    return this._asyncCache.get(id) || null
  }

  /**
   * @param {string|number|null} id
   * @param {any} level
   */
  _cacheSet(id, level) {
    if (!this._cacheEnabled() || id == null) return
    this._asyncCache.set(id, level)
  }

  /**
   * Drop cached async levels, so the next drill re-runs `onDrillDown`. Call it
   * when the underlying data changes behind a chart that has already drilled.
   * @param {string|number} [id] a single level, or every level when omitted
   * @returns {any} the chart, for chaining
   */
  clearCache(id) {
    if (id == null) this._asyncCache.clear()
    else this._asyncCache.delete(id)
    return this.ctx
  }

  /**
   * Capture the overridable surface of the current view so it can be restored.
   * Only fields that some drilldown.series entry can change are cloned; series
   * and chart.type/stacked are always captured.
   * @returns {object}
   */
  _snapshot() {
    const c = this.w.config
    const fields = this._overrideFields()
    /** @type {Record<string, any>} */
    // Capture the FULL data, not the post-collapse view: navigation clears the
    // legend-collapse bookkeeping (see _apply), so a snapshot that kept a
    // hidden slice/series at 0/[] would strand it on return — active in the
    // legend but zero-valued, with no collapse state left to restore it.
    const snap = { series: this._uncollapseSeries(Utils.clone(c.series)) }
    if (Array.isArray(c.labels) && c.labels.length) {
      snap.labels = Utils.clone(c.labels)
    }
    snap.chart = { type: c.chart.type, stacked: c.chart.stacked }
    if (fields.has('xaxis')) snap.xaxis = Utils.clone(c.xaxis)
    if (fields.has('yaxis')) snap.yaxis = Utils.clone(c.yaxis)
    if (fields.has('colors')) snap.colors = c.colors ? Utils.clone(c.colors) : undefined
    if (fields.has('plotOptions')) snap.plotOptions = Utils.clone(c.plotOptions)
    if (fields.has('fill')) snap.fill = Utils.clone(c.fill)
    if (fields.has('legend')) snap.legend = Utils.clone(c.legend)
    return snap
  }

  /**
   * Restore any legend-collapsed slices/series to their original values in a
   * cloned series array, so a drill snapshot captures the pre-collapse data.
   * Mirrors legend Helpers' collapse addressing: object-form pie/donut packs
   * every slice as a data point inside `series[0].data`; numeric pie stores a
   * slice per top-level element; axis series carry a `data` array. No-op when
   * nothing is collapsed.
   * @param {any[]} series
   * @returns {any[]}
   */
  _uncollapseSeries(series) {
    const w = this.w
    const gl = w.globals
    const entries = [
      ...(gl.collapsedSeries || []),
      ...(gl.ancillaryCollapsedSeries || []),
    ]
    if (!entries.length) return series

    const type = w.config.chart.type
    const objectFormPie =
      (type === 'pie' || type === 'donut' || type === 'polarArea') &&
      series.length === 1 &&
      series[0] &&
      typeof series[0] === 'object' &&
      Array.isArray(series[0].data)
    const container = objectFormPie ? series[0].data : series

    for (const entry of entries) {
      const i = entry.index
      if (gl.axisCharts) {
        if (series[i]) {
          series[i].data = Array.isArray(entry.data)
            ? entry.data.slice()
            : entry.data
        }
      } else if (container[i] && typeof container[i] === 'object') {
        container[i].y = entry.data
      } else if (container[i] !== undefined) {
        container[i] = entry.data
      }
    }
    return series
  }

  /**
   * Union of overridable fields across all declared drilldown levels. Ensures a
   * deep drillToRoot restores everything any intermediate level may have changed.
   * @returns {Set<string>}
   */
  _overrideFields() {
    const fields = new Set()
    const list = (this.w.config.drilldown && this.w.config.drilldown.series) || []
    for (const s of list) {
      if (!s) continue
      if (s.xaxis) fields.add('xaxis')
      if (s.yaxis) fields.add('yaxis')
      if (s.colors) fields.add('colors')
      if (s.plotOptions) fields.add('plotOptions')
      if (s.fill) fields.add('fill')
      if (s.legend) fields.add('legend')
    }
    return fields
  }

  /**
   * Copy the optional view fields shared by a drilldown child level and a
   * restore snapshot (`xaxis`, `yaxis`, `colors`, `plotOptions`, `fill`,
   * `legend`) from `src` onto `view`, only when present.
   * @param {Record<string, any>} view @param {Record<string, any>} src
   */
  _copyOptionalViewFields(view, src) {
    if (src.xaxis) view.xaxis = src.xaxis
    if (src.yaxis) view.yaxis = src.yaxis
    if (src.colors) view.colors = src.colors
    if (src.plotOptions) view.plotOptions = src.plotOptions
    if (src.fill) view.fill = src.fill
    if (src.legend) view.legend = src.legend
  }

  /**
   * Build an updateOptions/updateSeries payload for drilling INTO a child level.
   * Works for axis charts and pie/donut alike: both accept series objects with a
   * `data` array of `{ x, y }` points (pie derives slice labels from `x`).
   * @param {any} child
   * @returns {Record<string, any>}
   */
  _viewFromChild(child) {
    /** @type {Record<string, any>} */
    const view = {}
    // A level may declare a full multi-series array (`series`) to reveal a
    // grouped/stacked breakdown, or a single series' worth of points (`data`).
    if (Array.isArray(child.series)) {
      view.series = child.series
    } else {
      view.series = [{ name: child.name || '', data: child.data }]
    }
    const chart = {}
    if (child.chart && child.chart.type) chart.type = child.chart.type
    if (child.chart && child.chart.stacked != null) chart.stacked = child.chart.stacked
    if (Object.keys(chart).length) view.chart = chart
    this._copyOptionalViewFields(view, child)
    return view
  }

  /**
   * Build an updateOptions payload from a restore-snapshot.
   * @param {Record<string, any>} snap
   * @returns {Record<string, any>}
   */
  _viewFromSnapshot(snap) {
    /** @type {Record<string, any>} */
    const view = { series: snap.series, chart: snap.chart }
    if (snap.labels && snap.labels.length) view.labels = snap.labels
    this._copyOptionalViewFields(view, snap)
    return view
  }

  /**
   * Apply a view by delegating to the right update path, firing drill events
   * around it.
   * @param {Record<string, any>} view
   * @param {'down'|'up'} direction
   * @param {object} meta
   * @returns {Promise<any>}
   */
  _apply(view, direction, meta) {
    const w = this.w

    // A drill is navigation, not a data-point selection. Clear any selection
    // carried in from the click that triggered it: the child's data points are
    // different, and a stale selected index makes pie/donut levels render a
    // "pulled-out" slice AND makes pieClicked() reset every already-drawn
    // slice's path mid-render, which snaps earlier slices out of the cross-type
    // morph. (See Pie.pieClicked's "reset all elems" pass.)
    w.interact.selectedDataPoints = []

    // Legend-collapse state is per-level and indexed by series position, so it
    // is meaningless at the destination: a series hidden at this level points at
    // a different (or non-existent) series in the level we navigate to. Left in
    // place, a stale collapsed index re-collapses whatever series now sits at
    // that position — e.g. hiding series 0 in a multi-series child then drilling
    // back to a single-series root collapses the root's only series, which gets
    // the `apexcharts-series-collapsed` class (opacity 0) and the chart renders
    // blank. Reset it like resetSeries() does. (Re-collapsing on every navigation
    // would also be wrong: a fresh level should show all of its series.)
    w.globals.collapsedSeries = []
    w.globals.collapsedSeriesIndices = []
    w.globals.ancillaryCollapsedSeries = []
    w.globals.ancillaryCollapsedSeriesIndices = []
    w.globals.allSeriesCollapsed = false
    w.globals.risingSeries = []

    // Drill dots belong to the level being applied, not the one we are leaving:
    // the destination has different points, and different ones are drillable.
    // They ride along in the update payload because the level's series only
    // reach w.config inside updateOptions, which is too late to read them.
    // Always sent, even when empty: a level with nothing further to open has to
    // actively clear the dots, or the ones from the level we just left stay on
    // screen pointing at points that no longer open anything.
    view.markers = {
      ...(view.markers || {}),
      discrete: this._drillMarkers(view.series),
    }

    const animate =
      (!w.config.drilldown.animation || w.config.drilldown.animation.enabled !== false) &&
      w.config.chart.animations.enabled !== false

    if (direction === 'down') this._fire('drillDownStart', meta)

    // Always go through updateOptions, never the updateSeries fast path. A drill
    // navigates to a different dataset, so the child's x-axis categories almost
    // always differ from the parent's (years → quarters, sectors → companies).
    // updateSeries' fast path morphs the series in place but does NOT re-derive
    // category labels, so a same-type drill would leave the parent's axis labels
    // under the child's bars. updateOptions re-parses and rebuilds the axes, so
    // labels, scale, and series all match the level we navigated to.
    //
    // overwriteInitial* stay false: resetSeries() must still return to the user's
    // original top-level data, not whichever level we drilled to.
    const runUpdate = (anim) =>
      this.ctx.updateOptions(view, false, anim, false, false)

    const done = () => {
      this._fire(direction === 'down' ? 'drillDownEnd' : 'drillUp', meta)
      return this.ctx
    }

    // Trigger-point zoom: when enabled, the transition is a camera move anchored
    // at the clicked point — the current view scales up/out and fades, the child
    // is rendered instantly underneath (no morph, so the two don't fight), then
    // the child scales in from that same point. Additive polish: gated behind
    // drilldown.animation.zoomFromPoint, layered on top of the SVG via the Web
    // Animations API, and a no-op (falls back to the normal animated update) when
    // disabled, animations are off, or we are not in a capable browser.
    if (animate && this._zoomEnabled()) {
      const origin = this._triggerOrigin(meta)
      if (origin) {
        return this._zoomDrill(origin, direction, () => runUpdate(false)).then(done)
      }
    }

    return runUpdate(animate).then(done)
  }

  /** @returns {boolean} whether trigger-point zoom is configured on. */
  _zoomEnabled() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation
    return !!(a && a.zoomFromPoint)
  }

  /** @returns {SVGSVGElement|null} the chart's root <svg> node, if present. */
  _svgNode() {
    const paper = this.w.dom && this.w.dom.Paper
    return paper && paper.node ? paper.node : null
  }

  /**
   * The group wrapping ONLY the data marks (bars/cells/tiles) — not the axes,
   * grid, or titles. Animating this keeps the chart frame still while the marks
   * move. Covers bar/line/area (`.apexcharts-plot-series`), heatmap, and treemap.
   * @returns {SVGElement|null}
   */
  _markGroup() {
    const svg = this._svgNode()
    if (!svg || typeof svg.querySelector !== 'function') return null
    return svg.querySelector(
      '.apexcharts-plot-series, .apexcharts-heatmap, .apexcharts-treemap',
    )
  }

  /**
   * Centre of the clicked point in the SVG's view-box pixel space, used as the
   * transform-origin for the mark-group scale (which uses `transform-box:
   * view-box`, so the origin is resolved in SVG coordinates and stays stable
   * across the parent and child renders). Falls back to the mark group's centre
   * when there is no trigger point (e.g. drillUp / imperative drill). Returns
   * null when the marks / SVG / WAAPI are unavailable (SSR / old browsers).
   * @param {object} meta
   * @returns {{ x: number, y: number }|null}
   */
  _triggerOrigin(meta) {
    if (!Environment.isBrowser()) return null
    const svg = this._svgNode()
    const group = this._markGroup()
    if (
      !svg ||
      !group ||
      typeof group.animate !== 'function' ||
      typeof svg.getBoundingClientRect !== 'function'
    ) {
      return null
    }
    const svgRect = svg.getBoundingClientRect()
    let el = null
    if (meta && meta.seriesIndex != null && meta.dataPointIndex != null && this.w.dom.baseEl) {
      el = this.w.dom.baseEl.querySelector(
        `[index="${meta.seriesIndex}"][j="${meta.dataPointIndex}"]`,
      )
    }
    if (el && typeof el.getBoundingClientRect === 'function') {
      const r = el.getBoundingClientRect()
      return {
        x: r.left + r.width / 2 - svgRect.left,
        y: r.top + r.height / 2 - svgRect.top,
      }
    }
    const gRect = group.getBoundingClientRect()
    return {
      x: gRect.left + gRect.width / 2 - svgRect.left,
      y: gRect.top + gRect.height / 2 - svgRect.top,
    }
  }

  /**
   * Run the "expand from the clicked point" choreography around an instant
   * (un-animated) update. Only the data-mark group is animated — the axes, grid,
   * and titles stay fixed, so the effect doesn't drag the whole chart frame. The
   * current marks fade out near-in-place (a quick fade, not a balloon), the child
   * renders invisibly underneath, then the child marks unfold outward from the
   * clicked point: a horizontal-biased scale anchored there, so the bars read as
   * emerging from the column you clicked. Drilling up has no trigger column, so
   * it settles gently from the marks' centre.
   *
   * `transform-box: view-box` resolves the origin in SVG coordinates, so the same
   * origin applies cleanly to the parent and the freshly-rendered child group.
   * @param {{ x: number, y: number }} origin
   * @param {'down'|'up'} direction
   * @param {() => Promise<any>} runUpdate
   * @returns {Promise<void>}
   */
  async _zoomDrill(origin, direction, runUpdate) {
    const dur = this._zoomDuration()
    const down = direction === 'down'

    // Out phase: a quick fade, barely any scale (no dramatic zoom-out). It runs
    // shorter than the in phase so the child reveal carries the motion.
    const outDur = Math.round(dur * 0.55)
    const outTo = down ? 'scale(1.03)' : 'scale(0.97)'
    // In phase: drill-in unfolds the child outward from the point (X compressed
    // more than Y, so it spreads sideways out of the column); drill-up just
    // eases the parent in from a hair oversized.
    const inFrom = down ? 'scaleX(0.55) scaleY(0.85)' : 'scale(1.04)'

    /** @param {SVGElement} el */
    const anchor = (el) => {
      el.style.transformBox = 'view-box'
      el.style.transformOrigin = `${origin.x}px ${origin.y}px`
    }
    /** @param {SVGElement} el */
    const clear = (el) => {
      el.style.transform = ''
      el.style.opacity = ''
      el.style.transformOrigin = ''
      el.style.transformBox = ''
    }

    const outGroup = this._markGroup()
    let outAnim = null
    if (outGroup) {
      anchor(outGroup)
      outAnim = outGroup.animate(
        [
          { transform: 'scale(1)', opacity: 1 },
          { transform: outTo, opacity: 0 },
        ],
        { duration: outDur, easing: 'ease-in', fill: 'forwards' },
      )
      try {
        await outAnim.finished
      } catch (e) {
        /* cancelled by a rapid follow-up drill — fall through */
      }
    }

    // Swap content while the marks are invisible, so the change is unseen. The
    // update rebuilds the chart, so the mark group is a fresh element afterwards.
    await runUpdate()

    const inGroup = this._markGroup()
    if (inGroup) {
      // Pin the invisible start state inline before the first paint, so the
      // freshly-rendered marks never flash at full size for a frame.
      anchor(inGroup)
      inGroup.style.opacity = '0'
      inGroup.style.transform = inFrom
      if (outAnim && outGroup === inGroup) outAnim.cancel()

      const inAnim = inGroup.animate(
        [
          { transform: inFrom, opacity: 0 },
          { transform: 'scale(1)', opacity: 1 },
        ],
        // Decelerating ease so the unfold settles softly into place.
        { duration: dur, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' },
      )
      try {
        await inAnim.finished
      } catch (e) {
        /* cancelled */
      }
      // Restore the natural (untransformed) state and drop the WAAPI fill.
      clear(inGroup)
      inAnim.cancel()
    }
  }

  /** @returns {number} per-phase zoom duration in ms. */
  _zoomDuration() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation
    const speed = a && typeof a.speed === 'number' ? a.speed : 260
    return Math.max(80, speed)
  }

  /**
   * Fire a drill event through both the config callback and the listener registry.
   * @param {string} name
   * @param {object} payload
   */
  _fire(name, payload) {
    const cb = this.w.config.chart.events && this.w.config.chart.events[name]
    if (typeof cb === 'function') cb(payload, this.ctx, this.w)
    this.ctx.events.fireEvent(name, [payload, this.ctx, this.w])
  }

  // ─── Click + post-render hooks ───────────────────────────────────────────────

  /**
   * @param {Event} _event
   * @param {any} _ctx
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} opts
   */
  _onPointSelect(_event, _ctx, opts) {
    if (!opts) return undefined
    const point = this._pointAt(opts.seriesIndex, opts.dataPointIndex)
    if (point && typeof point === 'object' && point.drilldown != null) {
      return this.drillDown(point.drilldown, point, opts)
    }
    if (typeof this.w.config.drilldown.onDrillDown === 'function') {
      return this._drillDownAsync(null, point, opts)
    }
    return undefined
  }

  /**
   * @param {number|undefined} seriesIndex
   * @param {number|undefined} dataPointIndex
   * @returns {any|null}
   */
  _pointAt(seriesIndex, dataPointIndex) {
    const series = this.w.config.series
    if (!Array.isArray(series) || seriesIndex == null || dataPointIndex == null) {
      return null
    }
    const s = series[seriesIndex]
    if (!s || !Array.isArray(s.data)) return null
    return s.data[dataPointIndex] != null ? s.data[dataPointIndex] : null
  }

  _afterRender() {
    const w = this.w
    if (!w.config.drilldown || !w.config.drilldown.enabled) return
    this._markDrillableTargets()
    this._wirePlotClick()
    this.breadcrumb.render(this.path)
    // Keep the dots in step with a host-app update that changed which points
    // are drillable. There is no pre-update hook to run this in, so a plain
    // `chart.updateSeries()` introducing newly-drillable points shows them from
    // the next render. Drills are exact, since _apply computes them per level.
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series)
    }
  }

  /**
   * Mark every point that carries a `drilldown` field as an openable target.
   *
   * Two things have to be true for a point to be drillable, and on line/area
   * neither holds by default. It needs a mark to click (with `markers.size: 0`
   * there is no element at all), and that mark has to accept the click: core
   * gives line/area markers `no-pointer-events` so the shared tooltip can track
   * the whole plot, which silently swallows it. `_drillMarkers()` supplies the
   * missing dots; this re-enables pointer events on them.
   *
   * The cursor class only goes on marks that can actually take the click, so we
   * never promise an interaction that cannot happen.
   */
  _markDrillableTargets() {
    if (!Environment.isBrowser()) return
    const w = this.w
    const baseEl = w.dom.baseEl
    const series = w.config.series
    if (!baseEl || !Array.isArray(series)) return

    let unreachable = 0
    series.forEach((s, i) => {
      const data = s && Array.isArray(s.data) ? s.data : null
      if (!data) return
      data.forEach((point, j) => {
        if (!point || typeof point !== 'object' || point.drilldown == null) return
        // bar/column/line: [index="i"][j="j"]; pie/donut: series index is 0.
        const nodes = baseEl.querySelectorAll(`[index="${i}"][j="${j}"]`)
        if (!nodes.length) unreachable++
        nodes.forEach((node) => {
          if (this._isClickThroughMark(node)) {
            node.classList.remove('no-pointer-events')
          }
          node.classList.add('apexcharts-drilldown-target')
        })
      })
    })

    // A drillable point with nothing to click is a dead interaction, and it
    // looks identical to a broken one. Say so rather than no-opping: the only
    // way to reach this is to have turned the drill dots off without providing
    // markers of your own.
    if (unreachable && !this._warnedUnreachable) {
      this._warnedUnreachable = true
      console.warn(
        `ApexCharts: ${unreachable} drillable point(s) have no clickable mark, ` +
          `so clicking them cannot do anything. Leave \`drilldown.marker\` on, ` +
          `or give the series markers of its own (\`markers.size > 0\`).`,
      )
    }
  }

  /**
   * Make the whole band a drillable point owns clickable, not just its dot.
   *
   * A dot is ~6px across, so hitting it takes pixel-precise aim, it is far under
   * the ~44px a finger needs, and the tooltip's arrow points AT the point by
   * design, which puts a triangle over the very thing you are aiming at. Rather
   * than move the tooltip, widen the target: a click anywhere in the plot drills
   * whichever point the tooltip is currently reading. The hit area then matches
   * the feedback already on screen, so "the tooltip says 2024, I click, I get
   * 2024" holds, and the dot goes back to being an affordance rather than a
   * target you have to chase.
   *
   * Only for the point-based types, since a bar, slice or tile is already a
   * comfortably large mark and drilling one by clicking the background near it
   * would be surprising.
   */
  _wirePlotClick() {
    if (!Environment.isBrowser()) return
    const baseEl = this.w.dom.baseEl
    if (!baseEl || this._plotClickWired === baseEl) return
    if (this._plotClickWired) {
      this._plotClickWired.removeEventListener('mousedown', this._onPlotDown)
      this._plotClickWired.removeEventListener('click', this._onPlotClick)
    }
    baseEl.addEventListener('mousedown', this._onPlotDown)
    baseEl.addEventListener('click', this._onPlotClick)
    this._plotClickWired = baseEl
  }

  /** @param {any} e */
  _onPlotDown(e) {
    this._downAt = { x: e.clientX, y: e.clientY }
  }

  /**
   * @param {any} e
   * @returns {any}
   */
  _onPlotClick(e) {
    const w = this.w
    if (!w.config.drilldown || !w.config.drilldown.enabled) return undefined

    // A zoom/pan gesture ends in a click too. Only a click that did not travel
    // counts as one, or every zoom selection would drill on release.
    const down = this._downAt
    this._downAt = null
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
      return undefined
    }

    const target = /** @type {Element} */ (e.target)
    if (!target || typeof target.closest !== 'function') return undefined
    // The mark handles its own click through dataPointSelection; running here
    // as well would drill twice.
    if (target.closest('.apexcharts-drilldown-target')) return undefined
    // Chrome around the plot is not the plot.
    if (
      target.closest(
        '.apexcharts-legend, .apexcharts-toolbar, .apexcharts-breadcrumb, .apexcharts-menu, .apexcharts-tooltip',
      )
    ) {
      return undefined
    }

    const i = w.interact.capturedSeriesIndex
    const j = w.interact.capturedDataPointIndex
    if (i == null || j == null || i < 0 || j < 0) return undefined
    // Any point-based series, not just one drawn without markers: a 5px marker
    // the author supplied is no easier to hit than a 6px dot we supplied.
    if (!this._isPointBasedSeries(w.config.series[i])) return undefined

    const point = this._pointAt(i, j)
    if (!point || typeof point !== 'object' || point.drilldown == null) {
      return undefined
    }
    return this.drillDown(point.drilldown, point, {
      seriesIndex: i,
      dataPointIndex: j,
    })
  }

  /**
   * A series mark that is deliberately click-through. Restricted to markers
   * inside the plot: the tooltip draws its own `no-pointer-events` marker, and
   * that one must stay click-through or it would sit under the cursor and eat
   * the hover it exists to follow.
   * @param {Element} node
   * @returns {boolean}
   */
  _isClickThroughMark(node) {
    if (!node.classList || !node.classList.contains('no-pointer-events')) {
      return false
    }
    if (!node.classList.contains('apexcharts-marker')) return false
    return !(
      typeof node.closest === 'function' && node.closest('.apexcharts-tooltip')
    )
  }

  /**
   * Discrete-marker entries that give each drillable point a visible dot.
   *
   * Only series drawn WITHOUT markers get them, so an author who already shows
   * markers keeps their styling untouched, and only drillable points get one, so
   * the dots read as "these are the ones you can open" rather than turning every
   * point into a dot. Core renders discrete markers even when `markers.size` is
   * 0, which is what makes the affordance possible without a core change.
   *
   * Entries are tagged so a resync replaces ours and leaves the author's alone.
   * @param {any[]} series - the series being rendered (a drill applies its
   *   level's series, which are not yet on `w.config` when this runs)
   * @returns {any[]}
   */
  _drillMarkers(series) {
    const w = this.w
    const cfg = w.config.drilldown
    const authored = Array.isArray(w.config.markers && w.config.markers.discrete)
      ? w.config.markers.discrete.filter(
          (/** @type {any} */ d) => !d || !d[DRILL_MARKER],
        )
      : []
    const mk = (cfg && cfg.marker) || {}
    if (mk.show === false || !Array.isArray(series)) return authored

    /** @type {any[]} */
    const own = []
    series.forEach((/** @type {any} */ s, /** @type {number} */ i) => {
      if (!this._seriesNeedsDrillMarker(i, s)) return
      const data = s && Array.isArray(s.data) ? s.data : null
      if (!data) return
      data.forEach((/** @type {any} */ point, /** @type {number} */ j) => {
        if (!point || typeof point !== 'object' || point.drilldown == null) return
        /** @type {any} */
        const entry = { seriesIndex: i, dataPointIndex: j, [DRILL_MARKER]: true }
        // Declared fields only: an omitted one inherits the series default
        // rather than blanking it (see Markers.getMarkerConfig).
        if (mk.size !== undefined) entry.size = mk.size
        if (mk.shape !== undefined) entry.shape = mk.shape
        if (mk.fillColor !== undefined) entry.fillColor = mk.fillColor
        if (mk.strokeColor !== undefined) entry.strokeColor = mk.strokeColor
        own.push(entry)
      })
    })
    return authored.concat(own)
  }

  /**
   * Whether a series needs drill dots supplied for it: a point-based type whose
   * marks are the markers, drawn with markers off. Bar, pie, treemap and heatmap
   * marks are already real clickable elements, and a series that already shows
   * markers already has its affordance.
   * @param {number} i @param {any} s
   * @returns {boolean}
   */
  _seriesNeedsDrillMarker(i, s) {
    if (!this._isPointBasedSeries(s)) return false
    const size = this.w.config.markers && this.w.config.markers.size
    const effective = Array.isArray(size) ? size[i] : size
    return !(Number(effective) > 0)
  }

  /**
   * A series whose marks are markers (a point), rather than a shape big enough
   * to aim at on its own.
   * @param {any} s
   * @returns {boolean}
   */
  _isPointBasedSeries(s) {
    const type = (s && s.type) || this.w.config.chart.type
    return type === 'line' || type === 'area'
  }
}
