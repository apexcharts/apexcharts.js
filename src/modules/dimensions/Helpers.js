// @ts-check
import Utils from '../../utils/Utils'
import Graphics from '../Graphics'

export default class Helpers {
  /**
   * @param {import('./Dimensions').default} dCtx
   */
  constructor(dCtx) {
    this.w = dCtx.w
    this.dCtx = dCtx
  }

  /**
   * Get Chart Title/Subtitle Dimensions
   * @memberof Dimensions
   * @return {{width: number, height: number}}
   * @param {string} type
   **/
  getTitleSubtitleCoords(type) {
    const w = this.w
    let width = 0
    let height = 0

    const floating =
      type === 'title' ? w.config.title.floating : w.config.subtitle.floating

    const el = w.dom.baseEl.querySelector(`.apexcharts-${type}-text`)

    if (el !== null && !floating) {
      const coord = el.getBoundingClientRect()
      width = coord.width
      height = w.globals.axisCharts ? coord.height + 5 : coord.height
    }

    return {
      width,
      height,
    }
  }

  getLegendsRect() {
    const w = this.w

    const elLegendWrap = w.dom.elLegendWrap

    if (
      !w.config.legend.height &&
      (w.config.legend.position === 'top' ||
        w.config.legend.position === 'bottom')
    ) {
      // avoid legend to take up all the space
      if (elLegendWrap)
        elLegendWrap.style.maxHeight = w.globals.svgHeight / 2 + 'px'
    }

    const lgRect = /** @type {any} */ (
      Object.assign({}, Utils.getBoundingClientRect(elLegendWrap))
    )

    if (
      elLegendWrap !== null &&
      !w.config.legend.floating &&
      w.config.legend.show
    ) {
      this.dCtx.lgRect = {
        x: lgRect.x,
        y: lgRect.y,
        height: lgRect.height,
        width: lgRect.height === 0 ? 0 : lgRect.width,
      }
    } else {
      this.dCtx.lgRect = {
        x: 0,
        y: 0,
        height: 0,
        width: 0,
      }
    }

    // if legend takes up all of the chart space, we need to restrict it.
    if (
      w.config.legend.position === 'left' ||
      w.config.legend.position === 'right'
    ) {
      if (this.dCtx.lgRect.width * 1.5 > w.globals.svgWidth) {
        this.dCtx.lgRect.width = w.globals.svgWidth / 1.5
      }
    }

    return this.dCtx.lgRect
  }

  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width: number, height: number}}
   **/
  getDatalabelsRect() {
    const w = this.w

    /** @type {any[]} */
    const allLabels = []

    /**
     * @param {Object} serie
     * @param {number} seriesIndex
     */
    w.config.series.forEach(
      (/** @type {any} */ serie, /** @type {any} */ seriesIndex) => {
        /**
         * @param {any} datum
         * @param {number} dataPointIndex
         */
        serie.data.forEach(
          (/** @type {any} */ datum, /** @type {any} */ dataPointIndex) => {
            /**
             * @param {any} v
             */
            const getText = (v) => {
              return w.config.dataLabels.formatter(v, {
                seriesIndex,
                dataPointIndex,
                w,
              })
            }

            const labelText = getText(
              w.seriesData.series[seriesIndex][dataPointIndex],
            )

            allLabels.push(labelText)
          },
        )
      },
    )

    /** @type {any} */
    const val = Utils.getLargestStringFromArr(allLabels)

    const graphics = new Graphics(this.w)
    const dataLabelsStyle = w.config.dataLabels.style
    const labelrect = graphics.getTextRects(
      val,
      parseInt(dataLabelsStyle.fontSize).toString(),
      dataLabelsStyle.fontFamily,
    )

    return {
      width: labelrect.width * 1.05,
      height: labelrect.height,
    }
  }

  /**
   * @param {any} val
   * @param {any[]} arr
   */
  getLargestStringFromMultiArr(val, arr) {
    const w = this.w
    let valArr = val
    if (w.axisFlags.isMultiLineX) {
      // if the xaxis labels has multiline texts (array)
      /**
       * @param {any} xl
       */
      const maxArrs = arr.map((xl) => {
        return Array.isArray(xl) ? xl.length : 1
      })
      const maxArrLen = Math.max(...maxArrs)
      const maxArrIndex = maxArrs.indexOf(maxArrLen)
      valArr = arr[maxArrIndex]
    }

    return valArr
  }

  /**
   * Vertical space a sparkline has to keep free inside its SVG so the series
   * stroke isn't clipped at the top / bottom edge.
   *
   * A stroke is centred on its path, so half of it hangs outside the plot
   * wherever the path runs along an edge. Reserving that half unconditionally
   * lifts the whole plot away from the SVG edges even when nothing is drawn
   * there, which shows up as a strip of empty space under an area fill or a
   * bar base (#5137). So reserve only what the ink can't absorb itself: where
   * the stroke traces the data points, the distance between the extreme datum
   * and the axis extreme already swallows part or all of the overhang. Fills
   * need nothing: area fills are drawn unstroked (see Line.js renderPaths).
   *
   * @returns {{ top: number, bottom: number }}
   **/
  getSparklineStrokeInset() {
    const w = this.w
    const maxStrokeWidth = Array.isArray(w.config.stroke.width)
      ? Math.max(...w.config.stroke.width)
      : w.config.stroke.width
    const half = maxStrokeWidth / 2

    if (!w.config.stroke.show || !(half > 0)) {
      return { top: 0, bottom: 0 }
    }

    const yRange = w.globals.maxY - w.globals.minY
    const extremes = this._getSeriesYExtremes()
    if (!this._strokeTracesDataPoints() || !(yRange > 0) || !extremes) {
      // Can't reason about where the stroke runs (bars sit on the baseline,
      // heatmap cells fill the plot, stacks aren't the raw values), so reserve
      // the full overhang, which is what every sparkline used to get.
      return { top: half, bottom: half }
    }

    // Room is measured against the smallest plot the insets could leave, so it
    // is never optimistic: erring towards over-reserving keeps the stroke whole.
    const plotHeight = Math.max(w.globals.svgHeight - maxStrokeWidth, 0)
    const roomAbove = (plotHeight * (w.globals.maxY - extremes.max)) / yRange
    const roomBelow = (plotHeight * (extremes.min - w.globals.minY)) / yRange

    return {
      top: Math.min(Math.max(half - roomAbove, 0), half),
      bottom: Math.min(Math.max(half - roomBelow, 0), half),
    }
  }

  /**
   * Whether every drawn series is one whose stroke follows the data points, so
   * the extreme datum marks the outermost ink. False for anything that strokes
   * to the baseline or fills the plot (bar, heatmap, ...) and for stacked
   * charts, where the ink is the cumulative total rather than the raw values.
   * @returns {boolean}
   **/
  _strokeTracesDataPoints() {
    const w = this.w
    if (!w.globals.axisCharts || w.config.chart.stacked) return false

    const tracesPoints = ['line', 'area', 'scatter']
    return /** @type {any[]} */ (w.config.series).every(
      (/** @type {any} */ s) =>
        tracesPoints.includes(s.type || w.config.chart.type),
    )
  }

  /**
   * Min / max across every plotted y value, or null when nothing is plottable.
   * @returns {{ min: number, max: number } | null}
   **/
  _getSeriesYExtremes() {
    let min = Infinity
    let max = -Infinity

    this.w.seriesData.series.forEach((/** @type {any[]} */ data) => {
      if (!Array.isArray(data)) return
      data.forEach((/** @type {any} */ val) => {
        if (!Number.isFinite(val)) return
        if (val < min) min = val
        if (val > max) max = val
      })
    })

    return min === Infinity ? null : { min, max }
  }
}
