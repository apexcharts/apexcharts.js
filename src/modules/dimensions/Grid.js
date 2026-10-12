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
   * The x span of one bar slot, as the bar Helpers' `barSlotXSpan()`
   * resolves it for the bars themselves (#4885): the smallest gap once every
   * series is merged onto one axis, since `minXDiff` only sees gaps inside
   * a series. With no usable x at all it falls back to `minXDiff`, sentinel
   * included, as this pad always did.
   *
   * @returns {number} the span, or something not above 0 for none
   */
  barSlotXSpan() {
    const sx = this.w.seriesData?.seriesX || []
    // one series is walked as is; several are merged (sorted runs are cheap)
    const xs =
      sx.length > 1
        ? sx
            .flat()
            .filter(Number.isFinite)
            .sort((a, b) => a - b)
        : sx[0] || []
    let prev = NaN
    let slot = Infinity
    for (const v of xs) {
      if (!Number.isFinite(v)) continue
      if (v - prev > 0 && v - prev < slot) slot = v - prev
      prev = v
    }
    return slot < Infinity ? slot : this.w.globals.minXDiff
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
    const xRange = Math.abs(gl.initialMaxX - gl.initialMinX)

    if (
      barsPresent &&
      w.axisFlags.isXNumeric &&
      !gl.isBarHorizontal &&
      seriesLen > 0 &&
      xRange !== 0
    ) {
      // The first and last slots are centred on the first and last x, so
      // half of each sits past the plot. Reserve that half: the edge columns
      // keep the margin a category axis gives them. The slot is measured on
      // the grid left once the pad comes off, g - 2p, so with n = xRange /
      // slot slots:  p = (g - 2p) / 2n  =>  p = g / (2n + 2)
      // A columnWidth over 100% spans k slots and needs k half slots; a px
      // columnWidth is a fixed group of seriesLen bars, half of which must
      // fit. The pad was a whole group measured before it came off, and from
      // within-series gaps, up to 3x this. The data range, not the zoomed
      // one, so zooming never resizes the plot.
      const colWidth = cnf.plotOptions.bar.columnWidth
      const cw = parseInt(colWidth, 10) || 0
      const pct = /%/.test(colWidth)
      const k = pct ? Math.max(1, cw / 100) : 1
      const slot = this.barSlotXSpan()
      const n = slot > 0 ? xRange / slot : gl.dataPoints || 1
      barWidth = gl.barPadForNumericAxis = Math.max(
        1,
        (gridWidth * k) / (2 * n + 2 * k),
        pct ? 0 : (cw * seriesLen) / 2,
      )
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
