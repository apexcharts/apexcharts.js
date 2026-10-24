// @ts-check
import AxesUtils from '../axes/AxesUtils'
import { BAR_PATHWAY_TYPES } from '../settings/TypeAliases'
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
    const hasBar = (type) => BAR_PATHWAY_TYPES.includes(type)

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
    const span = Math.abs(gl.initialMaxX - gl.initialMinX)
    let xRange = span

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
      // A few bars (three daily ones) made this a whole group of a wide
      // slot, close to 200px a side of an empty plot. Cap it at an eighth of
      // the grid; denser charts sit under the cap and keep their margin. Never
      // under what the edge mark needs to stay whole: half its group, measured
      // on the grid left once the pad comes off (s slots across the data, a
      // cw fraction of each): p = (cw / 2) * (g - 2p) / s, plus its stroke.
      const cw = parseInt(cnf.plotOptions.bar.columnWidth, 10) / 100 || 0
      const s = gl.minXDiff > 0 ? span / gl.minXDiff : 1
      const need = ((cw / 2) * gridWidth) / (s + cw) + 4
      barWidth = Math.min(barWidth, Math.max(need, gridWidth / 8))

      barWidth = Math.max(
        barWidth,
        this._edgeNeedInWindow(cw, gridWidth, barWidth),
      )

      gl.barPadForNumericAxis = barWidth
    }

    return barWidth
  }

  /**
   * The pad the edge bar group needs while a window narrower than the data is
   * applied (zoom, pan, xaxis.min/max/range), 0 otherwise.
   *
   * The pad above is sized from the full data range, but the bars are sized
   * from the window on screen (minX..maxX), so zooming in widens them while
   * the pad stays put and the edge bars hang past the plot and get cut
   * (#5368, #2651). This is the same edge solve on the window's slot count.
   * It only ever raises the pad, and only once the window is narrow enough
   * that the full range pad no longer fits the edge bar, so a moderate zoom
   * keeps the un-zoomed layout and the plot only narrows as far as the
   * bars need.
   *
   * @param {number} cw column width as a fraction of the slot
   * @param {number} gridWidth the grid width before the pad comes off
   * @param {number} pad the pad sized from the full data range
   */
  _edgeNeedInWindow(cw, gridWidth, pad) {
    const gl = this.w.globals
    const fullSpan = Math.abs(gl.initialMaxX - gl.initialMinX)
    const visibleSpan = Math.abs(gl.maxX - gl.minX)
    if (
      !(visibleSpan > 0 && visibleSpan < fullSpan) ||
      !(gl.minXDiff > 0) ||
      // a px columnWidth is the same width at any zoom
      String(this.w.config.plotOptions.bar.columnWidth).indexOf('%') === -1
    ) {
      return 0
    }
    // Under one slot across, the bar is wider than the window whatever the
    // pad, and solving for it would squeeze the plot to nothing.
    const s = Math.max(visibleSpan / gl.minXDiff, 1)
    const half = ((cw / 2) * gridWidth) / (s + cw)
    // The 4px stroke allowance ramps in over the last few px before the half
    // group reaches the pad, so the pad never steps mid-gesture, and a dense
    // chart whose half group sits well inside the pad keeps its layout.
    return half + Math.min(4, Math.max(0, half - pad + 4))
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

    // The breathing room this leaves between the bottom of the title block and
    // the top of the plot. `gridPadForBreadcrumb` runs next and sits the strip
    // in it, so it only has to reserve whatever the strip does not already fit
    // into. Without this it reserved a full band on top of room that was
    // already there, and the strip floated in the middle of the gap.
    this.dCtx.titleBlockPad = gridShrinkOffset

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
    const axesUtils = new AxesUtils(this.w, { theme: this.dCtx.theme })

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
            // `|| 11`: a CSS keyword ('inherit') parses to NaN (#5064)
            (parseInt(yaxe.labels.style.fontSize, 10) || 11) / 1.2 +
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
