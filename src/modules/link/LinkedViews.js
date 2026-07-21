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
   * The source chart's rectangle brush produced a data-x range. In FILTER mode
   * this becomes a `[min,max]` range filter on the chart's dimension (the other
   * charts re-aggregate). In HIGHLIGHT mode (P1) it dims out-of-range marks
   * across the group. Called (null-safe) from ZoomPanSelection selectionDrawn /
   * selectionDragging.
   * @param {{min:number, max:number}} xaxis
   */
  onSourceSelection(xaxis) {
    const mode = this._mode()
    if (mode === 'off') return
    if (!xaxis || xaxis.min == null || xaxis.max == null) return
    let min = Math.min(xaxis.min, xaxis.max)
    let max = Math.max(xaxis.min, xaxis.max)

    // Snap to the plot's data bounds when the brush reaches an edge. The brush
    // clamps to the axis extent, but the pixel->data round-trip can leave min a
    // few units above globals.minX (or max below maxX), which would wrongly dim
    // the very first / last mark the brush visibly covers ("can't select past
    // the first column"). The tolerance is a tiny fraction of the range, far
    // smaller than the gap between marks, so a genuine near-edge selection (one
    // that should exclude the boundary mark) is left untouched.
    const gMinX = this.w.globals.minX
    const gMaxX = this.w.globals.maxX
    if (isFinite(gMinX) && isFinite(gMaxX) && gMaxX > gMinX) {
      const tol = (gMaxX - gMinX) * 1e-6
      if (min - gMinX <= tol) min = gMinX
      if (gMaxX - max <= tol) max = gMaxX
    }

    if (mode === 'filter') {
      const cf = this._cf()
      if (!cf) return
      cf.filter(this._chartId(), [min, max]) // emits 'change' -> fan-out
      this._fireFilterChange(cf, [min, max])
      return
    }

    // highlight mode (P1)
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

  _isHeatmap() {
    return this.w.config.chart.type === 'heatmap'
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
        // heatmap => 2D matrix dimension (accessor returns [xKey, yKey]).
        type: link.type || (this._isHeatmap() ? 'matrix' : undefined),
        bins: link.bins,
        order: link.order,
      })
    }
    this._injectSeries(cf.aggregateFor(chartId))
    this._wire(cf)
  }

  /**
   * Build the chart's series value from an aggregation, shaped by chart type:
   *   matrix (heatmap) -> [{ name:yKey, data:[{x:xKey, y:value}] }]
   *   pie/donut  -> number[]
   *   axis + category -> [{ name, data:number[] }] (categories set separately)
   *   axis + range    -> [{ name, data:[x,value][] }] on a numeric/time x-axis
   * @param {any} agg
   */
  _seriesFromAgg(agg) {
    if (agg.type === 'matrix') {
      return agg.yLabels.map((/** @type {any} */ yl, /** @type {number} */ yi) => ({
        name: String(yl),
        data: agg.xLabels.map((/** @type {any} */ xl, /** @type {number} */ xi) => ({
          x: String(xl),
          y: agg.matrix[yi][xi],
        })),
      }))
    }
    if (this._isPie()) return agg.values.slice()
    const name = this.w.config.chart.link.seriesName || 'Count'
    if (agg.type === 'range') {
      return [{ name, data: agg.labels.map((/** @type {any} */ x, /** @type {number} */ i) => [x, agg.values[i]]) }]
    }
    return [{ name, data: agg.values.slice() }]
  }

  /**
   * Value signature used to skip a reflow when only dimming changed.
   * @param {any} agg
   */
  _sigOf(agg) {
    return JSON.stringify(agg.matrix || agg.values)
  }

  /**
   * Write the aggregation into w.config as the chart's series/labels. Runs once
   * before the first paint; later updates go through updateSeries.
   * @param {any} agg
   */
  _injectSeries(agg) {
    const w = this.w
    this._lastValues = this._sigOf(agg)
    w.config.series = this._seriesFromAgg(agg)
    if (agg.type === 'matrix') return // heatmap x/y come from the series data
    if (this._isPie()) {
      w.config.labels = agg.labels.map(String)
    } else if (agg.type === 'category') {
      if (!w.config.xaxis) w.config.xaxis = {}
      w.config.xaxis.categories = agg.labels.map(String)
    }
    // range dims plot [x,value] tuples on the user's numeric/datetime x-axis;
    // no categories to inject (the bin edges are the x values).
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
    // Phase A: heatmap (matrix) is a re-aggregating target only; cell
    // click-to-filter is Phase B. Ignore clicks safely.
    if (agg.type === 'matrix') return
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
    const sig = this._sigOf(agg)
    if (sig === this._lastValues) {
      this._applySelfDim() // data unchanged: only the dimming may differ
      return
    }
    this._lastValues = sig
    this.ctx.updateSeries(this._seriesFromAgg(agg), true)
    // updateSeries re-renders -> 'updated' -> _afterRender applies self-dim.
  }

  _afterRender() {
    if (this._mode() !== 'filter') return
    // A wrapper that owns the `series` prop (react-apexcharts pushes it via
    // updateSeries right after mount, vue-apexcharts on any prop sync) can
    // clobber the injected aggregation with the empty placeholder series.
    // Filter-mode series are derived from the crossfilter, never user data,
    // so re-assert the aggregation instead of painting an empty chart.
    const series = this.w.config.series
    if (!series || series.length === 0) {
      this._reassertSeries()
      return
    }
    this._applySelfDim()
  }

  /** Restore the aggregated series after an external updateSeries emptied it.
   *  Deferred a microtask so the triggering update fully unwinds first. */
  _reassertSeries() {
    if (this._pending) return
    this._pending = true
    Promise.resolve().then(() => {
      this._pending = false
      if (this.w.globals.isDestroyed) return
      const cf = this._cf()
      if (!cf) return
      const agg = cf.aggregateFor(this._chartId())
      const series = this._seriesFromAgg(agg)
      if (!series.length) return // empty record set: nothing to restore
      this._lastValues = this._sigOf(agg)
      this.ctx.updateSeries(series, true)
    })
  }

  /**
   * Dim this chart's own buckets that are not in its own filter (no filter ->
   * none dimmed). Categorical: dim buckets whose key is not in the selected Set.
   * Range: dim bins lying fully outside the selected `[min,max]`. Keyed by each
   * mark's `j` (dataPointIndex) -> the aggregation key.
   */
  _applySelfDim() {
    const cf = this._cf()
    if (!cf) return
    const w = this.w
    const baseEl = w.dom.baseEl
    if (!baseEl) return
    const chartId = this._chartId()
    const filter = cf.filterOf(chartId) // Set (category) | [min,max] (range) | null
    const dimOpacity = w.config.chart.link.dimOpacity
    if (w.dom.elWrap && typeof dimOpacity === 'number') {
      w.dom.elWrap.style.setProperty('--apx-cf-dim', String(dimOpacity))
    }
    const isCategory = filter instanceof Set
    const isRange = Array.isArray(filter)
    const keys = cf.aggregateFor(chartId).keys
    baseEl.querySelectorAll(FILTER_MARK_SELECTOR).forEach((node) => {
      const jAttr = node.getAttribute('j')
      if (jAttr === null) return
      const key = keys[parseInt(jAttr, 10)]
      let dim = false
      if (isCategory) {
        dim = !(/** @type {Set<any>} */ (filter).has(key))
      } else if (isRange && Array.isArray(key)) {
        // key = [lo, hi] bin range; dim when the bin is fully outside [min,max].
        dim = key[1] <= filter[0] || key[0] >= filter[1]
      }
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
