import YAxis from '../axes/YAxis'
import Helpers from './Helpers'
import DimXAxis from './XAxis'
import DimYAxis from './YAxis'
import Grid from './Grid'
import { LINE_HEIGHT_RATIO } from '../../utils/Constants'

/**
 * ApexCharts Dimensions Class for calculating rects of all elements that are drawn and will be drawn.
 *
 * @module Dimensions
 **/

export default class Dimensions {
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: new XAxis(w, ctx) for xAxisLabelClick event callback
    this.theme = ctx.theme
    this.timeScale = ctx.timeScale
    this.lgRect = {}
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
    this.gridPad = this.w.config.grid.padding
    this.xPadRight = 0
    this.xPadLeft = 0
  }

  /**
   * @memberof Dimensions
   * @param {object} w - chart context
   **/
  plotCoords() {
    const w = this.w
    const gl = w.globals

    this.lgRect = this.dimHelpers.getLegendsRect()
    this.datalabelsCoords = { width: 0, height: 0 }

    const maxStrokeWidth = Array.isArray(w.config.stroke.width)
      ? Math.max(...w.config.stroke.width)
      : w.config.stroke.width

    if (this.isSparkline) {
      if (w.config.markers.discrete.length > 0 || w.config.markers.size > 0) {
        Object.entries(this.gridPad).forEach(([k, v]) => {
          this.gridPad[k] = Math.max(
            v,
            this.w.globals.markers.largestSize / 1.5
          )
        })
      }

      this.gridPad.top = Math.max(maxStrokeWidth / 2, this.gridPad.top)
      this.gridPad.bottom = Math.max(maxStrokeWidth / 2, this.gridPad.bottom)
    }

    if (gl.axisCharts) {
      // for line / area / scatter / column
      this.setDimensionsForAxisCharts()
    } else {
      // for pie / donuts / circle
      this.setDimensionsForNonAxisCharts()
    }

    this.dimGrid.gridPadFortitleSubtitle()

    // after calculating everything, apply padding set by user
    w.layout.gridHeight = w.layout.gridHeight - this.gridPad.top - this.gridPad.bottom

    w.layout.gridWidth =
      w.layout.gridWidth -
      this.gridPad.left -
      this.gridPad.right -
      this.xPadRight -
      this.xPadLeft

    const barWidth = this.dimGrid.gridPadForColumnsInNumericAxis(w.layout.gridWidth)

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
      },
    }
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
    w.config.yaxis.map((yaxe, index) => {
      // store the labels and titles coords in global vars
      w.layout.yLabelsCoords.push({
        width: yaxisLabelCoords[index].width,
        index,
      })
      w.layout.yTitleCoords.push({
        width: yTitleCoords[index].width,
        index,
      })
    })

    this.yAxisWidth = this.dimYAxis.getTotalYAxisWidth()

    const xaxisLabelCoords = this.dimXAxis.getxAxisLabelsCoords()
    const xaxisGroupLabelCoords = this.dimXAxis.getxAxisGroupLabelsCoords()
    const xtitleCoords = this.dimXAxis.getxAxisTitleCoords()

    this.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords
    )

    w.layout.translateXAxisY = w.layout.rotateXLabels ? this.xAxisHeight / 8 : -4
    w.layout.translateXAxisX =
      w.layout.rotateXLabels &&
      w.axisFlags.isXNumeric &&
      w.config.xaxis.labels.rotate <= -45
        ? -this.xAxisWidth / 4
        : 0

    if (w.globals.isBarHorizontal) {
      w.layout.rotateXLabels = false
      w.layout.translateXAxisY =
        -1 * (parseInt(w.config.xaxis.labels.style.fontSize, 10) / 1.5)
    }

    w.layout.translateXAxisY = w.layout.translateXAxisY + w.config.xaxis.labels.offsetY
    w.layout.translateXAxisX = w.layout.translateXAxisX + w.config.xaxis.labels.offsetX

    let yAxisWidth = this.yAxisWidth
    let xAxisHeight = this.xAxisHeight
    w.layout.xAxisLabelsHeight = this.xAxisHeight - xtitleCoords.height
    w.layout.xAxisGroupLabelsHeight = w.layout.xAxisLabelsHeight - xaxisLabelCoords.height
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
      w.layout.gridWidth = gl.svgWidth - yAxisWidth - this.datalabelsCoords.width * 2
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
    const objyAxis = new YAxis(this.w, { theme: this.theme, timeScale: this.timeScale })
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

    const type =
      cnf.chart.type === 'pie' ||
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

  conditionalChecksForAxisCoords(
    xaxisLabelCoords,
    xtitleCoords,
    xaxisGroupLabelCoords
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
