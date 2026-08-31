// @ts-check
import YAxis from '../axes/YAxis'
import Helpers from './Helpers'
import DimXAxis from './XAxis'
import DimYAxis from './YAxis'
import Grid from './Grid'
import { LINE_HEIGHT_RATIO } from '../../utils/Constants'
import {
  BREADCRUMB_HEIGHT,
  BREADCRUMB_HEIGHT_FULL,
  breadcrumbConfig,
} from '../../charts/common/Breadcrumb'

/**
 * ApexCharts Dimensions Class for calculating rects of all elements that are drawn and will be drawn.
 *
 * @module Dimensions
 **/

export default class Dimensions {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: new XAxis(w, ctx) for xAxisLabelClick event callback
    this.theme = ctx.theme
    this.timeScale = ctx.timeScale
    this.lgRect = /** @type {any} */ ({})
    this.yAxisWidth = 0
    this.yAxisWidthLeft = 0
    this.yAxisWidthRight = 0
    this.xAxisHeight = 0
    this.isSparkline = this.w.config.chart.sparkline.enabled

    this.dimHelpers = new Helpers(this)
    this.dimYAxis = new DimYAxis(this)
    this.dimXAxis = new DimXAxis(this)
    this.dimGrid = new Grid(this)
    this.lgWidthForSideLegends = 0
    // A COPY, never the config object itself: the chart type folds its own
    // insets into this (sparkline markers/stroke, the treemap breadcrumb band)
    // and layout code reads them back, which must not leak into the user's
    // config. Consumers outside Dimensions read w.layout.gridPad.
    // Re-derived per run by plotCoords(), see there.
    this.gridPad = { ...this.w.config.grid.padding }
    this.xPadRight = 0
    // Room `gridPadFortitleSubtitle` leaves between the title block and the
    // plot; the breadcrumb band is sized against it. Re-derived every run.
    this.titleBlockPad = 0
    this.xPadLeft = 0
    this.datalabelsCoords = { width: 0, height: 0 }
    /** @type {number} */
    this.xAxisWidth = 0
    /** @type {any[]} */
    this.timescaleLabels = []
  }

  /**
   * @memberof Dimensions
   **/
  plotCoords() {
    const w = this.w
    const gl = w.globals

    // `update()` reuses this instance (Destroy.clear keeps the core modules
    // alive), so the pad has to start from the user's config every run. The
    // sparkline insets below only ever raise it to a floor and so survived
    // being stale, but the breadcrumb band ADDS, and compounded: each render
    // pushed the plot another 22px down and took 22px off its height.
    this.gridPad = { ...w.config.grid.padding }

    this.lgRect = this.dimHelpers.getLegendsRect()
    this.datalabelsCoords = { width: 0, height: 0 }

    if (this.isSparkline) {
      // largestSize covers both markers.size (incl. the array form) and
      // markers.discrete, so it is the one gate for "markers can overhang".
      if (this.w.globals.markers.largestSize > 0) {
        Object.entries(this.gridPad).forEach(([k, v]) => {
          this.gridPad[k] = Math.max(
            v,
            this.w.globals.markers.largestSize / 1.5,
          )
        })
      }

      const strokeInset = this.dimHelpers.getSparklineStrokeInset()
      this.gridPad.top = Math.max(strokeInset.top, this.gridPad.top)
      this.gridPad.bottom = Math.max(strokeInset.bottom, this.gridPad.bottom)
    }

    if (gl.axisCharts) {
      // for line / area / scatter / column
      this.setDimensionsForAxisCharts()
    } else {
      // for pie / donuts / circle
      this.setDimensionsForNonAxisCharts()
    }

    this.dimGrid.gridPadFortitleSubtitle()
    this.gridPadForBreadcrumb()
    // Must run before gridWidth has xPadRight subtracted from it below.
    this.dimGrid.gridPadForStackedTotalDataLabels()

    // Honeycomb heatmap: the hexagon lattice overhangs the grid box by a
    // quarter cell horizontally (the alternating row offsets) and a sixth of
    // the row pitch vertically (a tessellating hexagon is 4/3 of the pitch
    // tall), plus half the cell stroke. Reserve that overhang as a
    // grid-padding floor (same pattern as the sparkline marker inset above),
    // or the left-shifted rows paint over the y-axis labels. The pad depends
    // on the cell size, which depends on the padded grid, so solve the fixed
    // point directly. With clearance m (stroke half-width + a few px of air,
    // since the y-axis labels end slightly past the unpadded grid edge):
    //   horizontal: p = ((g - 2p) / n) / 4 + m  =>  p = (g + 4nm) / (4n + 2)
    //   vertical:   p = ((h - 2p) / r) / 6 + s  =>  p = (h + 6rs) / (6r + 2)
    // A larger user padding still wins. Skipped when hexagon falls back to
    // rect (continuous-X), mirroring the check in HeatMap.draw.
    if (
      w.config.chart.type === 'heatmap' &&
      w.config.plotOptions.heatmap.shape === 'hexagon' &&
      !(
        (w.config.xaxis.type === 'numeric' ||
          w.config.xaxis.type === 'datetime') &&
        w.axisFlags.isXNumeric
      )
    ) {
      const cols = gl.dataPoints || 1
      const rows = (w.seriesData.series || []).length || 1
      const gw = w.layout.gridWidth - this.xPadRight - this.xPadLeft
      const gh = w.layout.gridHeight
      const strokeW = w.config.stroke.show
        ? Array.isArray(w.config.stroke.width)
          ? Math.max(...w.config.stroke.width)
          : w.config.stroke.width
        : 0
      const mx = strokeW / 2 + 6
      const my = strokeW / 2
      const px = (gw + 4 * cols * mx) / (4 * cols + 2)
      const py = (gh + 6 * rows * my) / (6 * rows + 2)
      this.gridPad.left = Math.max(px, this.gridPad.left)
      this.gridPad.right = Math.max(px, this.gridPad.right)
      this.gridPad.top = Math.max(py, this.gridPad.top)
      this.gridPad.bottom = Math.max(py, this.gridPad.bottom)
    }

    // after calculating everything, apply padding set by user
    w.layout.gridHeight =
      w.layout.gridHeight - this.gridPad.top - this.gridPad.bottom

    w.layout.gridWidth =
      w.layout.gridWidth -
      this.gridPad.left -
      this.gridPad.right -
      this.xPadRight -
      this.xPadLeft

    const barWidth = this.dimGrid.gridPadForColumnsInNumericAxis(
      w.layout.gridWidth,
    )

    w.layout.gridWidth = w.layout.gridWidth - barWidth * 2

    w.layout.translateX =
      w.layout.translateX +
      this.gridPad.left +
      this.xPadLeft +
      (barWidth > 0 ? barWidth : 0)
    w.layout.translateY = w.layout.translateY + this.gridPad.top

    // Return a snapshot of all computed layout state grouped by future w.layout slice destination.
    // Phase 1: callers use named writer stubs (no-ops — mutations above already wrote to gl).
    // Phase 2: writers will assign to typed slices instead of gl.*.
    return {
      // w.layout (future slice)
      layout: {
        gridHeight: w.layout.gridHeight,
        gridWidth: w.layout.gridWidth,
        translateX: w.layout.translateX,
        translateY: w.layout.translateY,
        translateXAxisX: w.layout.translateXAxisX,
        translateXAxisY: w.layout.translateXAxisY,
        rotateXLabels: w.layout.rotateXLabels,
        xAxisHeight: w.layout.xAxisHeight,
        xAxisLabelsHeight: w.layout.xAxisLabelsHeight,
        xAxisGroupLabelsHeight: w.layout.xAxisGroupLabelsHeight,
        xAxisLabelsWidth: w.layout.xAxisLabelsWidth,
        yLabelsCoords: w.layout.yLabelsCoords,
        yTitleCoords: w.layout.yTitleCoords,
        gridPad: { ...this.gridPad },
      },
    }
  }

  /**
   * Reserve a strip above the plot for a navigation breadcrumb.
   *
   * A treemap fills its plot edge to edge, so unlike a sunburst - whose rings
   * leave the corners empty - an absolutely-positioned breadcrumb has nowhere
   * to float without covering a tile. Giving it real space is the only way it
   * never overlaps.
   *
   * Reserved whenever click-to-zoom is enabled, not only while zoomed in: the
   * strip appears and disappears as the reader navigates, and sizing the plot
   * around its presence would reflow every tile on each zoom.
   */
  gridPadForBreadcrumb() {
    const w = this.w
    const isTreemap = w.config.chart.type === 'treemap'

    if (isTreemap) {
      const zoom = w.config.plotOptions?.treemap?.zoom
      if (zoom && zoom.enabled) {
        if (breadcrumbConfig(w, zoom.breadcrumb).show === false) return
        this.gridPad.top += BREADCRUMB_HEIGHT + 4
        return
      }
      // Falls through on purpose: a treemap can be navigated by the drilldown
      // feature instead of its own zoom, and that renders the same strip into
      // the same place, so it needs the same band.
    }

    // As an overlay with nothing reserved, the drilldown strip was pushed below
    // the title and came to rest on the top gridline and the first y-axis label.
    // A pie or donut keeps floating instead: its corners are empty, which is
    // what the overlay was designed around.
    //
    // `ctx.drilldown` is the feature gate. The config block exists even when the
    // feature was never imported, and then no breadcrumb is ever rendered.
    if (!w.globals.axisCharts) return
    if (!this.ctx.drilldown) return
    if (!w.config.drilldown || !w.config.drilldown.enabled) return
    if (breadcrumbConfig(w).show === false) return

    // What the strip needs is its own height plus the overhang of the topmost
    // y-axis tick label, which is CENTRED on the plot's top edge and so hangs
    // above the grid: clearing the grid alone still leaves the strip resting on
    // that label. A treemap draws no y-axis labels and needs none of it. The
    // placer measures the real overhang; this only has to leave room for it.
    const labelFs =
      parseFloat(String(w.config.yaxis?.[0]?.labels?.style?.fontSize)) || 11
    const yLabelOverhang = isTreemap
      ? 0
      : Math.ceil((labelFs * LINE_HEIGHT_RATIO) / 2)
    const needed = BREADCRUMB_HEIGHT_FULL + 1 + yLabelOverhang

    // Only the shortfall. `gridPadFortitleSubtitle` has already left breathing
    // room between the title block and the plot, and the strip lives in it, so
    // reserving a whole band on top of that pushed the plot down twice as far as
    // it had to and left the strip floating in the middle of the gap.
    //
    // That room is real above a cartesian plot, which sits below its axis
    // chrome, and mostly absent above a treemap, which fills its box edge to
    // edge: measured 22.5px against 12.5px on the same title block. So a treemap
    // lends nothing and reserves the strip in full.
    const alreadyFree = isTreemap ? 0 : this.titleBlockPad || 0
    this.gridPad.top += Math.max(0, needed - alreadyFree)
  }

  setDimensionsForAxisCharts() {
    const w = this.w
    const gl = w.globals

    const yaxisLabelCoords = this.dimYAxis.getyAxisLabelsCoords()
    const yTitleCoords = this.dimYAxis.getyAxisTitleCoords()

    if (gl.isSlopeChart) {
      this.datalabelsCoords = this.dimHelpers.getDatalabelsRect()
    }

    w.layout.yLabelsCoords = []
    w.layout.yTitleCoords = []
    /**
     * @param {ApexYAxis} yaxe
     * @param {number} index
     */
    w.config.yaxis.map((yaxe, index) => {
      // store the labels and titles coords in global vars
      w.layout.yLabelsCoords.push({
        width: yaxisLabelCoords[index].width,
        index,
      })
      w.layout.yTitleCoords.push(
        /** @type {any} */ ({
          width: yTitleCoords[index].width,
          index,
        }),
      )
    })

    this.yAxisWidth = this.dimYAxis.getTotalYAxisWidth()

    const xaxisLabelCoords = this.dimXAxis.getxAxisLabelsCoords()
    const xaxisGroupLabelCoords = this.dimXAxis.getxAxisGroupLabelsCoords()
    const xtitleCoords = this.dimXAxis.getxAxisTitleCoords()

    this.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords,
    )

    w.layout.translateXAxisY = w.layout.rotateXLabels
      ? this.xAxisHeight / 8
      : -4
    w.layout.translateXAxisX =
      w.layout.rotateXLabels &&
      w.axisFlags.isXNumeric &&
      w.config.xaxis.labels.rotate <= -45
        ? -this.xAxisWidth / 4
        : 0

    if (w.globals.isBarHorizontal) {
      w.layout.rotateXLabels = false
      w.layout.translateXAxisY =
        -1 * ((parseInt(w.config.xaxis.labels.style.fontSize, 10) || 12) / 1.5)
    }

    w.layout.translateXAxisY =
      w.layout.translateXAxisY + w.config.xaxis.labels.offsetY
    w.layout.translateXAxisX =
      w.layout.translateXAxisX + w.config.xaxis.labels.offsetX

    let yAxisWidth = this.yAxisWidth
    let xAxisHeight = this.xAxisHeight
    w.layout.xAxisLabelsHeight = this.xAxisHeight - xtitleCoords.height
    w.layout.xAxisGroupLabelsHeight =
      w.layout.xAxisLabelsHeight - xaxisLabelCoords.height
    w.layout.xAxisLabelsWidth = this.xAxisWidth
    w.layout.xAxisHeight = this.xAxisHeight
    let translateY = 10

    if (w.config.chart.type === 'radar' || this.isSparkline) {
      yAxisWidth = 0
      xAxisHeight = 0
    }

    if (this.isSparkline) {
      this.lgRect = {
        height: 0,
        width: 0,
      }
    }

    if (this.isSparkline || w.config.chart.type === 'treemap') {
      yAxisWidth = 0
      xAxisHeight = 0
      translateY = 0
    }

    if (!this.isSparkline && w.config.chart.type !== 'treemap') {
      this.dimXAxis.additionalPaddingXLabels(xaxisLabelCoords)
    }

    const legendTopBottom = () => {
      w.layout.translateX = yAxisWidth + this.datalabelsCoords.width
      w.layout.gridHeight =
        gl.svgHeight -
        this.lgRect.height -
        xAxisHeight -
        (!this.isSparkline && w.config.chart.type !== 'treemap'
          ? w.layout.rotateXLabels
            ? 10
            : 15
          : 0)
      w.layout.gridWidth =
        gl.svgWidth - yAxisWidth - this.datalabelsCoords.width * 2
    }

    if (w.config.xaxis.position === 'top')
      translateY = w.layout.xAxisHeight - w.config.xaxis.axisTicks.height - 5

    switch (w.config.legend.position) {
      case 'bottom':
        w.layout.translateY = translateY
        legendTopBottom()
        break
      case 'top':
        w.layout.translateY = this.lgRect.height + translateY
        legendTopBottom()
        break
      case 'left':
        w.layout.translateY = translateY
        w.layout.translateX =
          this.lgRect.width + yAxisWidth + this.datalabelsCoords.width
        w.layout.gridHeight = gl.svgHeight - xAxisHeight - 12
        w.layout.gridWidth =
          gl.svgWidth -
          this.lgRect.width -
          yAxisWidth -
          this.datalabelsCoords.width * 2
        break
      case 'right':
        w.layout.translateY = translateY
        w.layout.translateX = yAxisWidth + this.datalabelsCoords.width
        w.layout.gridHeight = gl.svgHeight - xAxisHeight - 12
        w.layout.gridWidth =
          gl.svgWidth -
          this.lgRect.width -
          yAxisWidth -
          this.datalabelsCoords.width * 2 -
          5
        break
      default:
        throw new Error('Legend position not supported')
    }

    this.dimGrid.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords)

    // after drawing everything, set the Y axis positions
    const objyAxis = new YAxis(this.w, {
      theme: this.theme,
      timeScale: this.timeScale,
    })
    objyAxis.setYAxisXPosition(yaxisLabelCoords, yTitleCoords)
  }

  setDimensionsForNonAxisCharts() {
    const w = this.w
    const gl = w.globals
    const cnf = w.config
    let xPad = 0

    if (w.config.legend.show && !w.config.legend.floating) {
      xPad = 20
    }

    // Unit (dot-cluster) charts fill the whole plot area - a row of clusters or
    // one packed blob - rather than the square a pie/radialBar needs. Reserve
    // legend space on the correct edge and take the rest.
    if (cnf.chart.type === 'unit') {
      const legendVisible = cnf.legend.show && !cnf.legend.floating
      const pos = cnf.legend.position
      let top = 0
      let side = 0
      if (legendVisible) {
        if (pos === 'bottom' || pos === 'top') {
          top = this.lgRect.height
        } else {
          side = this.lgRect.width + xPad
        }
      }
      w.layout.gridWidth = gl.svgWidth - side
      w.layout.gridHeight = gl.svgHeight - top
      w.layout.translateX = pos === 'left' ? side : 0
      w.layout.translateY = pos === 'top' ? top : 0
      return
    }

    // Sunburst uses the same centred-square layout as pie, but reads its own
    // offsets from plotOptions.sunburst.
    const type =
      cnf.chart.type === 'sunburst'
        ? 'sunburst'
        : cnf.chart.type === 'pie' ||
            cnf.chart.type === 'polarArea' ||
            cnf.chart.type === 'donut'
          ? 'pie'
          : 'radialBar'

    const offY = cnf.plotOptions[type].offsetY
    const offX = cnf.plotOptions[type].offsetX

    if (!cnf.legend.show || cnf.legend.floating) {
      w.layout.gridHeight = gl.svgHeight

      const maxWidth = w.dom.elWrap.getBoundingClientRect().width
      w.layout.gridWidth = Math.min(maxWidth, w.layout.gridHeight)

      w.layout.translateY = offY
      w.layout.translateX = offX + (gl.svgWidth - w.layout.gridWidth) / 2
      return
    }

    switch (cnf.legend.position) {
      case 'bottom':
        w.layout.gridHeight = gl.svgHeight - this.lgRect.height
        w.layout.gridWidth = gl.svgWidth
        w.layout.translateY = offY - 10
        w.layout.translateX = offX + (gl.svgWidth - w.layout.gridWidth) / 2
        break
      case 'top':
        w.layout.gridHeight = gl.svgHeight - this.lgRect.height
        w.layout.gridWidth = gl.svgWidth
        w.layout.translateY = this.lgRect.height + offY + 10
        w.layout.translateX = offX + (gl.svgWidth - w.layout.gridWidth) / 2
        break
      case 'left':
        w.layout.gridWidth = gl.svgWidth - this.lgRect.width - xPad
        w.layout.gridHeight =
          cnf.chart.height !== 'auto' ? gl.svgHeight : w.layout.gridWidth
        w.layout.translateY = offY
        w.layout.translateX = offX + this.lgRect.width + xPad
        break
      case 'right':
        w.layout.gridWidth = gl.svgWidth - this.lgRect.width - xPad - 5
        w.layout.gridHeight =
          cnf.chart.height !== 'auto' ? gl.svgHeight : w.layout.gridWidth
        w.layout.translateY = offY
        w.layout.translateX = offX + 10
        break
      default:
        throw new Error('Legend position not supported')
    }
  }

  /**
   * @param {any} xaxisLabelCoords
   * @param {any} xtitleCoords
   * @param {any} xaxisGroupLabelCoords
   */
  conditionalChecksForAxisCoords(
    xaxisLabelCoords,
    xtitleCoords,
    xaxisGroupLabelCoords,
  ) {
    const w = this.w

    const xAxisNum = w.labelData.hasXaxisGroups ? 2 : 1

    const baseXAxisHeight =
      xaxisGroupLabelCoords.height +
      xaxisLabelCoords.height +
      xtitleCoords.height
    const xAxisHeightMultiplicate = w.axisFlags.isMultiLineX
      ? 1.2
      : LINE_HEIGHT_RATIO
    const rotatedXAxisOffset = w.layout.rotateXLabels ? 22 : 10
    const rotatedXAxisLegendOffset =
      w.layout.rotateXLabels && w.config.legend.position === 'bottom'
    const additionalOffset = rotatedXAxisLegendOffset ? 10 : 0

    this.xAxisHeight =
      baseXAxisHeight * xAxisHeightMultiplicate +
      xAxisNum * rotatedXAxisOffset +
      additionalOffset

    this.xAxisWidth = xaxisLabelCoords.width

    if (
      this.xAxisHeight - xtitleCoords.height >
      w.config.xaxis.labels.maxHeight
    ) {
      this.xAxisHeight = w.config.xaxis.labels.maxHeight
    }

    if (
      w.config.xaxis.labels.minHeight &&
      this.xAxisHeight < w.config.xaxis.labels.minHeight
    ) {
      this.xAxisHeight = w.config.xaxis.labels.minHeight
    }

    if (w.config.xaxis.floating) {
      this.xAxisHeight = 0
    }

    let minYAxisWidth = 0
    let maxYAxisWidth = 0
    /**
     * @param {number} y
     */
    w.config.yaxis.forEach((y) => {
      minYAxisWidth += y.labels.minWidth
      maxYAxisWidth += y.labels.maxWidth
    })
    if (this.yAxisWidth < minYAxisWidth) {
      this.yAxisWidth = minYAxisWidth
    }
    if (this.yAxisWidth > maxYAxisWidth) {
      this.yAxisWidth = maxYAxisWidth
    }
  }
}
