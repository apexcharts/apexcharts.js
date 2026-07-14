// @ts-check
/**
 * Linked Views (#4) P1: declarative crossfilter by linked highlighting.
 *
 * Charts that share a `chart.group` and opt in with `chart.link.enabled` form a
 * crossfilter set. Brushing a rectangle range on any member that has
 * `chart.selection.enabled` (the source gesture) dims every member's data marks
 * whose x falls OUTSIDE the brushed range, in place: axes are preserved and
 * nothing re-renders (a CSS opacity class cross-fades). Clearing restores.
 *
 * P1 is x-range membership (x is the join, so no join-key config is needed) and
 * highlight mode only. It shines on discrete-mark charts (bar/column/scatter/
 * bubble/candlestick): a continuous line/area path is not dimmed per segment,
 * only its markers. Pie/donut have no x-domain and are skipped. Filter-mode
 * reflow, non-x join keys, lasso/multi-region, and the pill bar are deferred.
 *
 * Eager module (like history/perspectives): `ctx.linkedViews`, self-inert unless
 * `chart.link.enabled`. Cross-chart fan-out reuses `getGroupedCharts()`; each
 * chart computes its own membership from its own `w.globals.seriesX`, so no
 * per-point map is sent between charts.
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

const DIMMED_CLASS = 'apexcharts-crossfilter-dimmed'

export default class LinkedViews {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    this._dimmed = false
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
    this._group().forEach((ch) => ch?.linkedViews?.clear())
  }

  teardown() {
    this.clear()
  }
}
