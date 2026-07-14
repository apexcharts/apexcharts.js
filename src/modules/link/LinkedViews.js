// @ts-check
import Crossfilter from './Crossfilter'

/**
 * Linked Views (#4): the per-chart glue for crossfilter, in two modes.
 *
 * HIGHLIGHT mode (P1): `chart.link.enabled` with NO `dimension`. Charts sharing
 * a `chart.group` form a set; brushing a rectangle range on a member that has
 * `chart.selection.enabled` dims every member's marks whose x falls outside the
 * range, in place (axes preserved, nothing re-renders, a CSS opacity class
 * cross-fades). x is the join, so no key config is needed. Best on discrete-mark
 * charts; pie/donut have no x-domain and are skipped.
 *
 * FILTER mode (P2): `chart.link.dimension` is a function (its presence selects
 * this path). Real crossfilter (crossfilter.js / dc.js style): each chart
 * declares a dimension + reduction over a shared record set registered with
 * `ApexCharts.crossfilter({ id, records })`. Clicking a pie slice / bar toggles
 * that bucket's key; the source self-dims the non-selected buckets, and every
 * other participating chart re-aggregates over the filtered subset and animates
 * to its new values via `updateSeries`. A chart never filters itself.
 *
 * Eager module (like history/perspectives): `ctx.linkedViews`, self-inert unless
 * a `chart.link` mode is active. It survives update() (Destroy keeps eager
 * modules on isUpdating), so it registers its dimension, injects the initial
 * aggregated series before the first paint, and subscribes to the coordinator
 * exactly once. Cross-chart fan-out is driven by the coordinator's `change`
 * event: each chart re-applies its own aggregation.
 *
 * @module modules/link/LinkedViews
 */

// Discrete data marks that carry `index` (seriesIndex) + `j` (dataPointIndex).
const MARK_SELECTOR = [
  '.apexcharts-bar-area',
  '.apexcharts-candlestick-area',
  '.apexcharts-boxPlot-area',
  '.apexcharts-rangebar-area',
  '.apexcharts-marker',
].join(', ')

// Categorical filter-mode marks (pie/donut slices + bars) carry `j` = the
// bucket's dataPointIndex, which maps to the aggregation's key order.
const FILTER_MARK_SELECTOR = [
  '.apexcharts-pie-area',
  '.apexcharts-bar-area',
].join(', ')

const DIMMED_CLASS = 'apexcharts-crossfilter-dimmed'
const PIE_TYPES = ['pie', 'donut', 'polarArea', 'radialBar']

export default class LinkedViews {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    this._dimmed = false
    // FILTER-mode state (engine path).
    this._wired = false
    this._pending = false
    /** @type {string|null} */
    this._lastValues = null
    this._onPointSelect = this._onPointSelect.bind(this)
    this._afterRender = this._afterRender.bind(this)
    this._onChange = this._onChange.bind(this)

    // Set up the engine path before the first render. Constructed in the
    // ApexCharts constructor, so mutating w.config.series here reaches create().
    if (this._mode() === 'filter') this._initEngine()
  }

  /** @returns {'highlight'|'filter'|'off'} */
  _mode() {
    const link = this.w.config.chart.link
    if (link && typeof link.dimension === 'function') return 'filter'
    if (link && link.enabled) return 'highlight'
    return 'off'
  }

  _enabled() {
    const link = this.w.config.chart.link
    return !!(link && link.enabled)
  }

  /**
   * The source chart's rectangle brush produced a data-x range: broadcast a dim
   * to the group and fire `crossFilter` on the source. Called (null-safe) from
   * ZoomPanSelection.selectionDrawn.
   * @param {{min:number, max:number}} xaxis
   */
  onSourceSelection(xaxis) {
    if (!this._enabled()) return
    if (!xaxis || xaxis.min == null || xaxis.max == null) return
    const min = Math.min(xaxis.min, xaxis.max)
    const max = Math.max(xaxis.min, xaxis.max)

    this._group().forEach((ch) => {
      ch?.linkedViews?.applyDim(min, max)
    })

    const args = { xaxis: { min, max }, sourceChartID: this.w.globals.chartID }
    if (typeof this.w.config.chart.events.crossFilter === 'function') {
      this.w.config.chart.events.crossFilter(this.ctx, args)
    }
    // fireEvent applies an args ARRAY to addEventListener handlers, so pass
    // [chart, opts] to match the (chart, opts) signature used elsewhere.
    this.ctx.events?.fireEvent('crossFilter', [this.ctx, args])
  }

  /** self + grouped siblings (dedup-safe; getGroupedCharts excludes self). */
  _group() {
    const siblings =
      typeof this.ctx.getGroupedCharts === 'function'
        ? this.ctx.getGroupedCharts()
        : []
    return [this.ctx, ...siblings]
  }

  /**
   * Dim this chart's marks whose x is outside [min,max]; un-dim those inside.
   * No re-render, so mark identities are preserved.
   * @param {number} min @param {number} max
   */
  applyDim(min, max) {
    if (!this._enabled()) return
    const w = this.w
    const baseEl = w.dom.baseEl
    if (!baseEl) return

    const dimOpacity = w.config.chart.link.dimOpacity
    if (w.dom.elWrap && typeof dimOpacity === 'number') {
      w.dom.elWrap.style.setProperty('--apx-cf-dim', String(dimOpacity))
    }

    const seriesX = w.globals.seriesX || []
    const marks = baseEl.querySelectorAll(MARK_SELECTOR)
    marks.forEach((node) => {
      const jAttr = node.getAttribute('j')
      if (jAttr === null) return
      const j = parseInt(jAttr, 10)
      const iAttr = node.getAttribute('index')
      const i = iAttr === null ? 0 : parseInt(iAttr, 10)
      const row = seriesX[i] || seriesX[0]
      if (!row) return
      const x = row[j]
      if (x == null) return
      node.classList.toggle(DIMMED_CLASS, x < min || x > max)
    })
    this._dimmed = true
  }

  /** Remove dimming from this chart only. */
  clear() {
    const baseEl = this.w.dom.baseEl
    if (!baseEl) return
    baseEl
      .querySelectorAll('.' + DIMMED_CLASS)
      .forEach((n) => n.classList.remove(DIMMED_CLASS))
    this._dimmed = false
  }

  /** Clear dimming across the whole group (backs chart.clearCrossfilter). */
  clearGroup() {
    if (this._mode() === 'filter') {
      const cf = this._cf()
      if (cf) cf.reset() // emits 'change' -> every subscribed chart re-applies
      return
    }
    this._group().forEach((ch) => ch?.linkedViews?.clear())
  }

  // ─── FILTER mode (crossfilter engine glue) ───────────────────────────────

  /**
   * The chart's stable internal id (keys its dimension in the coordinator).
   * Always set by the ApexCharts constructor (falls back to a cuid).
   * @returns {string}
   */
  _chartId() {
    return /** @type {string} */ (this.w.globals.chartID)
  }

  /** @returns {import('./Crossfilter').default|null} the coordinator, or null */
  _cf() {
    const link = this.w.config.chart.link
    const id = link && (link.id || this.w.config.chart.group)
    return id ? Crossfilter.get(id) : null
  }

  _isPie() {
    return PIE_TYPES.indexOf(this.w.config.chart.type) !== -1
  }

  /**
   * Before the first render: resolve the coordinator, register this chart's
   * dimension, inject the initial aggregated series into w.config (so the first
   * paint is already aggregated, no empty flash), and wire the listeners.
   */
  _initEngine() {
    const cf = this._cf()
    const link = this.w.config.chart.link
    if (!cf) {
      const id = (link && link.id) || this.w.config.chart.group
      console.warn(
        `[apexcharts] chart.link.dimension is set but no crossfilter coordinator "${id}" exists. Call ApexCharts.crossfilter({ id, records }) before creating the chart.`,
      )
      return
    }
    const chartId = this._chartId()
    if (!cf.hasDimension(chartId)) {
      cf.registerDimension(chartId, {
        dimension: link.dimension,
        reduce: link.reduce,
        type: link.type,
        bins: link.bins,
        order: link.order,
      })
    }
    this._injectSeries(cf.aggregateFor(chartId))
    this._wire(cf)
  }

  /**
   * Write the aggregation into w.config as the chart's series/labels. Runs once
   * before the first paint; later updates go through updateSeries.
   * @param {{type:string, labels:any[], values:number[]}} agg
   */
  _injectSeries(agg) {
    const w = this.w
    const link = w.config.chart.link
    this._lastValues = JSON.stringify(agg.values)
    if (this._isPie()) {
      w.config.series = agg.values.slice()
      w.config.labels = agg.labels.map(String)
    } else {
      const name = link.seriesName || 'Count'
      w.config.series = [{ name, data: agg.values.slice() }]
      if (agg.type === 'category') {
        if (!w.config.xaxis) w.config.xaxis = {}
        w.config.xaxis.categories = agg.labels.map(String)
      }
    }
  }

  /** @param {import('./Crossfilter').default} cf */
  _wire(cf) {
    if (this._wired) return
    this._wired = true
    // Click-to-filter on this chart's own marks (coexists with any user
    // dataPointSelection handler; both fire via Graphics.pathMouseDown).
    this.ctx.addEventListener('dataPointSelection', this._onPointSelect)
    // Re-apply self-dim after each (re)render (new DOM nodes lose the class).
    this.ctx.addEventListener('mounted', this._afterRender)
    this.ctx.addEventListener('updated', this._afterRender)
    // Any filter change on the shared coordinator re-aggregates this chart.
    cf.on('change', this._onChange)
  }

  /**
   * A pie slice / bar was clicked: toggle its bucket key on the coordinator.
   * @param {any} _e @param {any} _ctx @param {{dataPointIndex?:number}} opts
   */
  _onPointSelect(_e, _ctx, opts) {
    if (this._mode() !== 'filter' || !opts || opts.dataPointIndex == null) return
    const cf = this._cf()
    if (!cf) return
    const chartId = this._chartId()
    const agg = cf.aggregateFor(chartId)
    const key = agg.keys[opts.dataPointIndex]
    if (key == null) return
    cf.toggleKey(chartId, key) // emits 'change' -> fan-out (deferred per chart)
    this._fireFilterChange(cf, key)
  }

  /** Coordinator filter changed: re-aggregate this chart on a microtask so the
   *  triggering click handler unwinds before we destroy/redraw the DOM. */
  _onChange() {
    if (this._mode() !== 'filter' || this._pending) return
    this._pending = true
    Promise.resolve().then(() => {
      this._pending = false
      if (this.w.globals.isDestroyed) return
      this._applyAggregation()
    })
  }

  /**
   * Pull this chart's crossfilter aggregation and push it through updateSeries
   * (animated). When the values are unchanged (e.g. only this chart's own
   * filter moved, which it ignores for itself), skip the reflow and just
   * refresh the self-dim.
   */
  _applyAggregation() {
    if (this._mode() !== 'filter') return
    const cf = this._cf()
    if (!cf) return
    const agg = cf.aggregateFor(this._chartId())
    const sig = JSON.stringify(agg.values)
    if (sig === this._lastValues) {
      this._applySelfDim() // data unchanged: only the dimming may differ
      return
    }
    this._lastValues = sig
    if (this._isPie()) {
      this.ctx.updateSeries(agg.values, true)
    } else {
      const name = this.w.config.chart.link.seriesName || 'Count'
      this.ctx.updateSeries([{ name, data: agg.values }], true)
    }
    // updateSeries re-renders -> 'updated' -> _afterRender applies self-dim.
  }

  _afterRender() {
    if (this._mode() !== 'filter') return
    this._applySelfDim()
  }

  /**
   * Dim this chart's own buckets not in its own filter Set (no filter -> none
   * dimmed). Keyed by each mark's `j` (dataPointIndex) -> the aggregation key.
   */
  _applySelfDim() {
    const cf = this._cf()
    if (!cf) return
    const w = this.w
    const baseEl = w.dom.baseEl
    if (!baseEl) return
    const chartId = this._chartId()
    const filter = cf.filterOf(chartId) // Set of selected keys, or null
    const dimOpacity = w.config.chart.link.dimOpacity
    if (w.dom.elWrap && typeof dimOpacity === 'number') {
      w.dom.elWrap.style.setProperty('--apx-cf-dim', String(dimOpacity))
    }
    const keys = cf.aggregateFor(chartId).keys
    baseEl.querySelectorAll(FILTER_MARK_SELECTOR).forEach((node) => {
      const jAttr = node.getAttribute('j')
      if (jAttr === null) return
      const key = keys[parseInt(jAttr, 10)]
      const dim = filter ? !filter.has(key) : false
      node.classList.toggle(DIMMED_CLASS, dim)
    })
    this._dimmed = !!filter
  }

  /**
   * Fire the `filterChange` event on this (source) chart.
   * @param {import('./Crossfilter').default} cf @param {any} key
   */
  _fireFilterChange(cf, key) {
    const args = {
      ...cf.state(),
      sourceChartID: this._chartId(),
      key,
    }
    const events = this.w.config.chart.events
    if (typeof events.filterChange === 'function') {
      events.filterChange(this.ctx, args)
    }
    this.ctx.events?.fireEvent('filterChange', [this.ctx, args])
  }

  teardown() {
    this.clear()
    if (this._wired) {
      this.ctx.removeEventListener?.('dataPointSelection', this._onPointSelect)
      this.ctx.removeEventListener?.('mounted', this._afterRender)
      this.ctx.removeEventListener?.('updated', this._afterRender)
      const cf = this._cf()
      if (cf) {
        cf.off('change', this._onChange)
        cf.removeDimension(this._chartId())
      }
      this._wired = false
    }
  }
}
