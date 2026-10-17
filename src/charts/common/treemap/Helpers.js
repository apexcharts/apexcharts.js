// @ts-check
import Utils from '../../../utils/Utils'
import Graphics from '../../../modules/Graphics'
import DataLabels from '../../../modules/DataLabels'

export default class TreemapHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   * @param {import('../../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w
  }

  /** Whether a colour range reaches zero or below. Runs once per draw. */
  checkColorRange() {
    const w = this.w
    // Drop the per-row extents determineColor memoises.
    this.rowExt = /** @type {number[][]} */ ([])
    return w.config.plotOptions[w.config.chart.type].colorScale.ranges.some(
      (/** @type {any} */ range) => range.from <= 0,
    )
  }

  /**
   * @param {string} chartType
   * @param {number} i
   * @param {number} j
   * @param {any} negRange
   */
  getShadeColor(chartType, i, j, negRange) {
    const w = this.w
    const opts = w.config.plotOptions[chartType]
    const shadeIntensity = opts.shadeIntensity
    const k = shadeIntensity * 1.25

    const colorProps = this.determineColor(chartType, i, j)
    const p = colorProps.percent / 100

    let colorShadePercent
    if (/** @type {any} */ (w.globals).hasNegs || negRange) {
      colorShadePercent = opts.reverseNegativeShade
        ? (p < 0 ? p : 1 - p) * k
        : p <= 0
          ? 1 - (1 + p) * shadeIntensity
          : (1 - p) * shadeIntensity
    } else {
      colorShadePercent = chartType === 'treemap' ? (1 - p) * k : 1 - p
    }

    let color = colorProps.color

    if (opts.enableShades) {
      // shadeColor may return rgb() or hex, and hexToRgba needs hex. Dark mode
      // shades the other way.
      const shadeColor = new Utils().shadeColor(
        w.config.theme.mode === 'dark' ? -colorShadePercent : colorShadePercent,
        color,
      )
      color = Utils.hexToRgba(
        Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
        w.config.fill.opacity,
      )
    }

    return { color, colorProps }
  }

  /**
   * @param {string} chartType
   * @param {number} i
   * @param {number} j
   */
  determineColor(chartType, i, j) {
    const w = this.w

    const val = w.seriesData.series[i][j]

    const chartOpts = w.config.plotOptions[chartType]

    let seriesNumber = chartOpts.colorScale.inverse ? j : i

    if (chartOpts.distributed && w.config.chart.type === 'treemap') {
      seriesNumber = j
    }

    let color = w.globals.colors[seriesNumber]
    let foreColor = null
    let min
    let max

    if (!chartOpts.distributed && chartType === 'heatmap') {
      // Non-distributed heatmap uses the global y-extent; the per-row min/max
      // below would only be computed and immediately discarded.
      min = w.globals.minY
      max = w.globals.maxY
    } else {
      // Per-row extent (distributed heatmap / treemap). Use a loop, not
      // Math.min(...row): a wide continuous-X heatmap row can exceed the call
      // argument limit and throw "RangeError: Maximum call stack size exceeded".
      // Scanned once per row per draw (checkColorRange resets the memo), not
      // once per cell, which made a wide row quadratic.
      let ext = /** @type {number[][]} */ (this.rowExt)[i]
      if (!ext) {
        const row = w.seriesData.series[i]
        min = row.length ? row[0] : 0
        max = min
        for (let k = 1; k < row.length; k++) {
          if (row[k] < min) min = row[k]
          if (row[k] > max) max = row[k]
        }
        ext = /** @type {number[][]} */ (this.rowExt)[i] = [min, max]
      }
      ;[min, max] = ext
    }

    const csMin = chartOpts.colorScale.min
    const csMax = chartOpts.colorScale.max
    if (
      typeof csMin !== 'undefined' &&
      typeof csMax !== 'undefined' &&
      csMax > csMin
    ) {
      // BOTH ends set: an explicit, ABSOLUTE window. This is what lets
      // several charts share one color scale (a trellis pushes the union
      // extent): comparing against each chart's own niced globals would
      // shift the mapping per chart by a nice-step. Values outside the
      // window saturate at its ends.
      min = csMin
      max = csMax
    } else if (typeof csMin !== 'undefined') {
      // One-sided: the historical expand-not-clamp semantics.
      min = csMin < w.globals.minY ? csMin : w.globals.minY
      max = csMax > w.globals.maxY ? csMax : w.globals.maxY
    }

    const total = Math.abs(max) + Math.abs(min)

    // Saturate into the scale window (only an explicit window can place a
    // value outside min..max).
    const clamped = Math.min(Math.max(val, min), max)

    // When min === max (total === 0), every cell sits at the midpoint of the
    // scale. Use a tiny positive epsilon so percent → 0 instead of exploding
    // to a large negative number (the previous `total - 0.000001` fallback
    // produced a negative divisor).
    let percent = total === 0 ? 0 : (100 * clamped) / total

    if (chartOpts.colorScale.ranges.length > 0) {
      const colorRange = chartOpts.colorScale.ranges
      /**
       * @param {number} range
       */
      colorRange.map((/** @type {any} */ range) => {
        if (val >= range.from && val <= range.to) {
          color = range.color
          foreColor = range.foreColor ? range.foreColor : null
          min = range.from
          max = range.to
          const rTotal = Math.abs(max) + Math.abs(min)
          percent = rTotal === 0 ? 0 : (100 * val) / rTotal
        }
      })
    }

    return {
      color,
      foreColor,
      percent,
    }
  }

  /** @param {{ text?: any, x?: any, y?: any, i?: any, j?: any, colorProps?: any, fontSize?: any }} opts */
  calculateDataLabels({ text, x, y, i, j, colorProps, fontSize }) {
    const w = this.w
    const dataLabelsConfig = w.config.dataLabels

    const graphics = new Graphics(this.w)

    const dataLabels = new DataLabels(this.w, this.ctx)

    let elDataLabelsWrap = null

    if (dataLabelsConfig.enabled) {
      elDataLabelsWrap = graphics.group({
        class: 'apexcharts-data-labels',
      })

      // plotDataLabelsText applies offsetX/offsetY itself
      dataLabels.plotDataLabelsText({
        x,
        y: y + parseFloat(dataLabelsConfig.style.fontSize) / 3,
        text,
        i,
        j,
        color: colorProps.foreColor,
        parent: elDataLabelsWrap,
        fontSize,
        dataLabelsConfig,
      })
    }

    return elDataLabelsWrap
  }
}
