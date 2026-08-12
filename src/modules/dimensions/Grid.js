// @ts-check
import AxesUtils from '../axes/AxesUtils'
import Graphics from '../Graphics'
import Utils from '../../utils/Utils'

export default class DimGrid {
  /**
   * @param {import('./Dimensions').default} dCtx
   */
  constructor(dCtx) {
    this.w = dCtx.w
    this.dCtx = dCtx
  }

  /**
   * @param {number} gridWidth
   */
  gridPadForColumnsInNumericAxis(gridWidth) {
    const { w } = this
    const { config: cnf, globals: gl } = w

    if (
      gl.noData ||
      gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length ===
        cnf.series.length
    ) {
      return 0
    }

    /**
     * @param {string} type
     */
    const hasBar = (type) =>
      ['bar', 'rangeBar', 'candlestick', 'boxPlot', 'violin'].includes(type)

    const type = cnf.chart.type
    let barWidth = 0
    let seriesLen = hasBar(type) ? cnf.series.length : 1

    if (gl.comboBarCount > 0) {
      seriesLen = gl.comboBarCount
    }

    /**
     * @param {any} c
     */
    gl.collapsedSeries.forEach((/** @type {any} */ c) => {
      if (hasBar(c.type)) {
        seriesLen -= 1
      }
    })

    if (cnf.chart.stacked) {
      seriesLen = 1
    }

    const barsPresent = hasBar(type) || gl.comboBarCount > 0
    let xRange = Math.abs(gl.initialMaxX - gl.initialMinX)

    if (
      barsPresent &&
      w.axisFlags.isXNumeric &&
      !gl.isBarHorizontal &&
      seriesLen > 0 &&
      xRange !== 0
    ) {
      if (xRange <= 3) {
        xRange = gl.dataPoints
      }

      const xRatio = xRange / gridWidth
      let xDivision =
        gl.minXDiff && gl.minXDiff / xRatio > 0 ? gl.minXDiff / xRatio : 0

      if (xDivision > gridWidth / 2) {
        xDivision /= 2
      }
      // Here, barWidth is assumed to be the width occupied by a group of bars.
      // There will be one bar in the group for each series plotted.
      // Note: This version of the following math is different to that over in
      // Helpers.js. Don't assume they should be the same. Over there,
      // xDivision is computed differently and it's used on different charts.
      // They were the same, but the solution to
      // https://github.com/apexcharts/apexcharts.js/issues/4178
      // was to remove the division by seriesLen.
      barWidth =
        (xDivision * parseInt(cnf.plotOptions.bar.columnWidth, 10)) / 100

      if (barWidth < 1) {
        barWidth = 1
      }

      gl.barPadForNumericAxis = barWidth
    }

    return barWidth
  }

  /**
   * Reserve room to the right of the plot for stacked *total* dataLabels on a
   * 100% horizontal bar chart.
   *
   * The total label is placed just past the end of the stack. Under
   * `stackType: '100%'` every stack ends at the axis maximum, i.e. exactly at
   * the right edge of the plot, so the label was drawn outside the grid and
   * clipped by the SVG viewport. See #3579.
   *
   * Scoped to the 100% case on purpose: with ordinary stacking the axis
   * maximum is a rounded "nice" number that normally sits beyond the longest
   * stack, so there is already room and padding every such chart would move
   * layouts that render correctly today.
   *
   * Raises `xPadRight`, which narrows `gridWidth` without translating the plot
   * origin, so the y-axis and its labels stay put and only the bars get
   * shorter.
   */
  gridPadForStackedTotalDataLabels() {
    const { w } = this
    const totalConfig = w.config.plotOptions.bar.dataLabels.total

    if (
      !w.globals.isBarHorizontal ||
      !w.config.chart.stacked ||
      w.config.chart.stackType !== '100%' ||
      !totalConfig.enabled
    ) {
      return
    }

    const totals = w.seriesData.stackedSeriesTotals || []
    if (!totals.length) return

    const formatter = totalConfig.formatter || w.config.dataLabels.formatter
    // getLargestStringFromArr compares `.length`, so these must be strings.
    const labels = totals.map(
      (/** @type {any} */ val, /** @type {number} */ j) =>
        String(
          formatter
            ? formatter(val, { ...w, seriesIndex: 0, dataPointIndex: j, w })
            : val,
        ),
    )

    const graphics = new Graphics(w)
    const rect = graphics.getTextRects(
      Utils.getLargestStringFromArr(labels),
      parseFloat(totalConfig.style.fontSize).toString(),
      totalConfig.style.fontFamily,
    )

    // The label starts at the stack end plus offsetX, so the space it needs is
    // its own width plus that offset, and a couple of px so the glyphs are not
    // flush against the viewport edge.
    const needed = rect.width + Math.abs(totalConfig.offsetX || 0) + 2
    this.dCtx.xPadRight = Math.max(this.dCtx.xPadRight, needed)
  }

  gridPadFortitleSubtitle() {
    const { w } = this
    const { globals: gl } = w
    let gridShrinkOffset = this.dCtx.isSparkline || !gl.axisCharts ? 0 : 10

    const titleSubtitle = ['title', 'subtitle']

    titleSubtitle.forEach((t) => {
      if (w.config[t].text !== undefined) {
        gridShrinkOffset += w.config[t].margin
      } else {
        gridShrinkOffset += this.dCtx.isSparkline || !gl.axisCharts ? 0 : 5
      }
    })

    if (
      w.config.legend.show &&
      w.config.legend.position === 'bottom' &&
      !w.config.legend.floating &&
      !gl.axisCharts
    ) {
      gridShrinkOffset += 10
    }

    const titleCoords = this.dCtx.dimHelpers.getTitleSubtitleCoords('title')
    const subtitleCoords =
      this.dCtx.dimHelpers.getTitleSubtitleCoords('subtitle')

    w.layout.gridHeight -=
      titleCoords.height + subtitleCoords.height + gridShrinkOffset
    w.layout.translateY +=
      titleCoords.height + subtitleCoords.height + gridShrinkOffset
  }

  /**
   * @param {{width: number, height: number}[]} yTitleCoords
   * @param {{width: number, height: number}[]} yaxisLabelCoords
   */
  setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords) {
    const { w } = this
    const axesUtils = new AxesUtils(this.w, { theme: this.dCtx.theme, timeScale: this.dCtx.timeScale })

    /**
     * @param {ApexYAxis} yaxe
     * @param {number} index
     */
    w.config.yaxis.forEach((/** @type {any} */ yaxe, /** @type {any} */ index) => {
      if (
        w.globals.ignoreYAxisIndexes.indexOf(index) === -1 &&
        !yaxe.floating &&
        !axesUtils.isYAxisHidden(index)
      ) {
        if (yaxe.opposite) {
          w.layout.translateX -=
            yaxisLabelCoords[index].width +
            yTitleCoords[index].width +
            parseInt(yaxe.labels.style.fontSize, 10) / 1.2 +
            12
        }

        // fixes apexcharts.js#1599
        if (w.layout.translateX < 2) {
          w.layout.translateX = 2
        }
      }
    })
  }
}
