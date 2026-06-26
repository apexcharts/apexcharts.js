// @ts-check
import Utils from '../../utils/Utils'
import { Environment } from '../../utils/Environment.js'
import Breadcrumb from './Breadcrumb'

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

    this.breadcrumb = new Breadcrumb(w, ctx, this)

    this._onPointSelect = this._onPointSelect.bind(this)
    this._afterRender = this._afterRender.bind(this)

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
   * @param {object} [meta]
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
   * Minimal async resolver (loading overlay lands in Phase 3).
   * @param {string|number|null} id
   * @param {any} point
   * @param {object} [meta]
   * @returns {Promise<any>}
   */
  _drillDownAsync(id, point, meta) {
    const fn = this.w.config.drilldown.onDrillDown
    let result
    try {
      result = fn({
        point,
        seriesIndex: meta && meta.seriesIndex,
        dataPointIndex: meta && meta.dataPointIndex,
      })
    } catch (error) {
      this._fire('drillDownError', { id, error })
      return Promise.resolve(this.ctx)
    }
    return Promise.resolve(result).then(
      (child) => {
        if (!child || !child.data) return this.ctx
        return this._drillInto(child, point, meta)
      },
      (error) => {
        this._fire('drillDownError', { id, error })
        return this.ctx
      },
    )
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
    const snap = { series: Utils.clone(c.series) }
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
    if (child.xaxis) view.xaxis = child.xaxis
    if (child.yaxis) view.yaxis = child.yaxis
    if (child.colors) view.colors = child.colors
    if (child.plotOptions) view.plotOptions = child.plotOptions
    if (child.fill) view.fill = child.fill
    if (child.legend) view.legend = child.legend
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
    if (snap.xaxis) view.xaxis = snap.xaxis
    if (snap.yaxis) view.yaxis = snap.yaxis
    if (snap.colors) view.colors = snap.colors
    if (snap.plotOptions) view.plotOptions = snap.plotOptions
    if (snap.fill) view.fill = snap.fill
    if (snap.legend) view.legend = snap.legend
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

    const animate =
      (!w.config.drilldown.animation || w.config.drilldown.animation.enabled !== false) &&
      w.config.chart.animations.enabled !== false

    if (direction === 'down') this._fire('drillDownStart', meta)

    const typeChanged =
      view.chart && view.chart.type && view.chart.type !== w.config.chart.type
    const stackedChanged =
      view.chart &&
      view.chart.stacked != null &&
      view.chart.stacked !== w.config.chart.stacked
    const otherOverrides = !!(
      view.xaxis ||
      view.yaxis ||
      view.colors ||
      view.plotOptions ||
      view.fill ||
      view.legend ||
      view.labels
    )
    // Pure series swap on an axis chart → fastUpdate path morphs old → new.
    const canFastSwap =
      w.globals.axisCharts && !typeChanged && !stackedChanged && !otherOverrides

    // overwriteInitial* stay false: resetSeries() must still return to the user's
    // original top-level data, not whichever level we drilled to.
    const p = canFastSwap
      ? this.ctx.updateSeries(view.series, animate, false)
      : this.ctx.updateOptions(view, false, animate, false, false)

    return p.then(() => {
      this._fire(direction === 'down' ? 'drillDownEnd' : 'drillUp', meta)
      return this.ctx
    })
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
    if (!this.w.config.drilldown || !this.w.config.drilldown.enabled) return
    this._markDrillableTargets()
    this.breadcrumb.render(this.path)
  }

  /**
   * Add the drilldown-target cursor class to every point that carries a
   * `drilldown` field. Best-effort and cosmetic — a missed selector is harmless.
   */
  _markDrillableTargets() {
    if (!Environment.isBrowser()) return
    const w = this.w
    const baseEl = w.dom.baseEl
    const series = w.config.series
    if (!baseEl || !Array.isArray(series)) return

    series.forEach((s, i) => {
      const data = s && Array.isArray(s.data) ? s.data : null
      if (!data) return
      data.forEach((point, j) => {
        if (!point || typeof point !== 'object' || point.drilldown == null) return
        // bar/column/line: [index="i"][j="j"]; pie/donut: series index is 0.
        const nodes = baseEl.querySelectorAll(`[index="${i}"][j="${j}"]`)
        nodes.forEach((node) =>
          node.classList.add('apexcharts-drilldown-target'),
        )
      })
    })
  }
}
