// @ts-check
/**
 * Trellis (#22): the top clearance of a panel's plot.
 *
 * A standalone axis chart keeps a band above its plot: the no-title gutter
 * (Grid.gridPadFortitleSubtitle) plus a fixed offset
 * (Dimensions.setGridCoordsForAxisCharts). A trellis panel has no use for
 * it: the panel header is its title and the grid gap its breathing room.
 * The trellis attaches `dropPanelTopBand` to each panel chart as the
 * `panelTopBand` hook, which Dimensions calls once per layout; it trades
 * the band for exactly the clearance the top ink needs. It lives here, not
 * in core, so only pages that load the trellis add-on pay for it.
 */
import Graphics from '../Graphics'
import { BAR_PATHWAY_TYPES } from '../settings/TypeAliases'

/**
 * The offset Dimensions.setGridCoordsForAxisCharts puts above every axis
 * plot (its `translateY = 10`), unless an x axis on top takes its place. It
 * is not charged to the grid height: the flat bottom slack pays for it.
 */
const PLOT_TOP_OFFSET = 10

/**
 * The `panelTopBand` hook: drop the band above the plot and keep only the
 * top ink's clearance. Runs inside Dimensions.plotCoords after the title
 * gutter is reserved (`titleBlockPad`) and before the grid pad is applied,
 * so everything goes through `gridPad.top`, which already holds the user's
 * own grid.padding.top: the plot grows by exactly what comes off its top,
 * and its bottom does not move. An x axis on top is real chrome in place of
 * the offset, so only the gutter goes there.
 * @param {any} dims the panel's Dimensions instance
 */
export function dropPanelTopBand(dims) {
  const w = dims.w
  if (!w.globals.axisCharts) return
  const gutter = dims.titleBlockPad || 0
  if (w.config.xaxis.position === 'top') {
    dims.gridPad.top -= gutter
    return
  }
  // The plot height the clearance comes out of: no band, no clearance.
  const plotH =
    w.layout.gridHeight -
    dims.gridPad.top -
    dims.gridPad.bottom +
    gutter +
    PLOT_TOP_OFFSET
  dims.gridPad.top += topInkClearance(dims, plotH) - PLOT_TOP_OFFSET - gutter
}

/**
 * How far ink can rise above the top gridline of an axis plot, in px:
 *  - the top y-axis label, centred on the top gridline: its em box rises
 *    `ascent - fontSize / 3` above it (YAxis draws the baseline fontSize/3
 *    below the tick). A horizontal bar's category label sits inside its
 *    row instead, so it only overhangs once rows get shorter than it;
 *  - half the series stroke, for a line through the top value;
 *  - a marker on the top value: its radius plus half its stroke (the hover
 *    enlargement is transient and is not reserved);
 *  - a point data label above the top value, from DataLabels' own baseline
 *    arithmetic (its y is clamped to the plot top, then offsetY applies);
 *  - a stacked column's total label, which sits above its stack end.
 * Ascents are measured (getTextRects' centerOffset), not guessed from the
 * font size, so a tall custom font reserves what it actually needs.
 *
 * @param {any} dims the panel's Dimensions instance
 * @param {number} plotH the plot height this clearance will come out of
 *   (the grid height with no band and no clearance above it)
 * @returns {number}
 */
export function topInkClearance(dims, plotH) {
  const w = dims.w
  const cnf = w.config
  const gl = w.globals
  const graphics = new Graphics(w)
  /**
   * Em-box height above the alphabetic baseline, and the full height.
   * @param {any} style
   */
  const measure = (style) => {
    const r = /** @type {{height: number, centerOffset?: number}} */ (
      graphics.getTextRects(
        '0',
        style.fontSize,
        style.fontFamily,
        undefined,
        true,
        style.fontWeight,
      )
    )
    const ascent = r.height / 2 - (r.centerOffset || 0)
    // A measurement that cannot be a real em box (no layout engine, e.g.
    // jsdom) falls back to the whole text height: never under-reserve.
    return {
      ascent: ascent >= 0 && ascent <= r.height ? ascent : r.height,
      height: r.height,
    }
  }
  /** @param {any} v */
  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0)
  /** @param {any} v */
  const largest = (v) => Math.max(0, ...[].concat(v).map(num))

  let need = 0

  cnf.yaxis.forEach((/** @type {any} */ yaxe) => {
    // Config only, not AxesUtils.isYAxisHidden: an axis that hides because
    // one panel's series are all null must still reserve the same clearance
    // as its siblings, or that panel's plot would fall out of alignment.
    if (!yaxe.show || !yaxe.labels.show) return
    const fs = parseFloat(yaxe.labels.style.fontSize) || 0
    const ascent = measure(yaxe.labels.style).ascent
    const offY = num(yaxe.labels.offsetY)
    if (!gl.isBarHorizontal) {
      need = Math.max(need, ascent - fs / 3 - offY)
      return
    }
    // Horizontal bars: XAxis.drawYaxisInversed puts the first category's
    // baseline K = 1 - 1/2.2 of a row below the plot top, raised by half
    // the line count for a multi-line label. The row is the final plot
    // height over the category count, and the final plot height is
    // `plotH - need` (the clearance comes out of it), so solve
    // need = rise - K * (plotH - need) / n for need directly.
    const labels = w.labelData.labels || []
    const n = Math.max(1, labels.length)
    const lines = Math.max(
      0,
      ...labels.map((/** @type {any} */ l) =>
        Array.isArray(l) ? l.length : 0,
      ),
    )
    const rise = ascent + (lines ? (lines / 2) * fs : 0) - offY
    const K = 1 - 1 / 2.2
    need = Math.max(need, (rise - (K * plotH) / n) / (1 - K / n))
  })

  if (cnf.stroke.show) need = Math.max(need, largest(cnf.stroke.width) / 2)

  const types = [cnf.chart.type].concat(
    cnf.series.map((/** @type {any} */ s) => s && s.type).filter(Boolean),
  )
  const pointTypes = ['line', 'area', 'scatter', 'bubble', 'rangeArea']
  if (types.some((t) => pointTypes.includes(t))) {
    const m = cnf.markers
    const size = Math.max(
      largest(m.size),
      ...(m.discrete || []).map((/** @type {any} */ d) => num(d.size)),
    )
    if (size > 0) need = Math.max(need, size + largest(m.strokeWidth) / 2)

    if (cnf.dataLabels.enabled) {
      // DataLabels.drawDataLabel: y = max(0, top + offsetY + strokeWidth)
      // + offsetY, with its default strokeWidth of 2, for a point on the
      // top gridline (top = 0).
      const offY = num(cnf.dataLabels.offsetY)
      const baseline = Math.max(0, offY + 2) + offY
      need = Math.max(need, measure(cnf.dataLabels.style).ascent - baseline)
    }
  }

  const total = cnf.plotOptions.bar.dataLabels.total
  if (
    cnf.chart.stacked &&
    total.enabled &&
    !gl.isBarHorizontal &&
    types.some((t) => BAR_PATHWAY_TYPES.includes(t))
  ) {
    // bar DataLabels: baseline = stack end - 0.3 * text height + offsets.
    const m = measure(total.style)
    need = Math.max(
      need,
      m.ascent +
        0.3 * m.height -
        num(cnf.dataLabels.offsetY) -
        num(total.offsetY),
    )
  }

  return Math.ceil(Math.max(0, need))
}
