import Graphics from './Graphics'
import Formatters from '../modules/Formatters'
import Utils from './../utils/Utils'
import YAxis from './axes/YAxis'

/**
 * ApexCharts Dimensions Class for calculating rects of all elements that are drawn and will be drawn.
 *
 * @module Dimensions
 **/

export default class Dimensions {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.lgRect = {}
    this.yAxisWidth = 0
    this.xAxisHeight = 0
    this.isSparkline = this.w.config.chart.sparkline.enabled

    this.xPadRight = 0
    this.xPadLeft = 0
  }

  /**
   * @memberof Dimensions
   * @param {object} w - chart context
   **/
  plotCoords() {
    let w = this.w
    let gl = w.globals

    let lgRect = this.getLegendsRect()

    if (gl.axisCharts) {
      // for line / area / scatter / column
      this.setGridCoordsForAxisCharts(lgRect)
    } else {
      // for pie / donuts / circle
      this.setGridCoordsForNonAxisCharts(lgRect)
    }

    this.titleSubtitleOffset()

    // after calculating everything, apply padding set by user
    gl.gridHeight =
      gl.gridHeight - w.config.grid.padding.top - w.config.grid.padding.bottom

    gl.gridWidth =
      gl.gridWidth -
      w.config.grid.padding.left -
      w.config.grid.padding.right -
      this.xPadRight -
      this.xPadLeft

    gl.translateX = gl.translateX + w.config.grid.padding.left + this.xPadLeft
    gl.translateY = gl.translateY + w.config.grid.padding.top
  }

  conditionalChecksForAxisCoords(xaxisLabelCoords, xtitleCoords) {
    const w = this.w
    this.xAxisHeight =
      (xaxisLabelCoords.height + xtitleCoords.height) *
        w.globals.LINE_HEIGHT_RATIO +
      15

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

    if (!w.globals.isBarHorizontal) {
      this.yAxisWidth = this.getTotalYAxisWidth()
    } else {
      this.yAxisWidth =
        w.globals.yLabelsCoords[0].width + w.globals.yTitleCoords[0].width + 15
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

  setGridCoordsForAxisCharts(lgRect) {
    let w = this.w
    let gl = w.globals

    let yaxisLabelCoords = this.getyAxisLabelsCoords()
    let xaxisLabelCoords = this.getxAxisLabelsCoords()

    let yTitleCoords = this.getyAxisTitleCoords()
    let xtitleCoords = this.getxAxisTitleCoords()

    w.globals.yLabelsCoords = []
    w.globals.yTitleCoords = []
    w.config.yaxis.map((yaxe, index) => {
      // store the labels and titles coords in global vars
      w.globals.yLabelsCoords.push({
        width: yaxisLabelCoords[index].width,
        index
      })
      w.globals.yTitleCoords.push({
        width: yTitleCoords[index].width,
        index
      })
    })

    this.conditionalChecksForAxisCoords(xaxisLabelCoords, xtitleCoords)

    gl.translateXAxisY = w.globals.rotateXLabels ? this.xAxisHeight / 8 : -4
    gl.translateXAxisX =
      w.globals.rotateXLabels &&
      w.globals.isXNumeric &&
      w.config.xaxis.labels.rotate <= -45
        ? -this.xAxisWidth / 4
        : 0

    if (w.globals.isBarHorizontal) {
      gl.rotateXLabels = false
      gl.translateXAxisY =
        -1 * (parseInt(w.config.xaxis.labels.style.fontSize) / 1.5)
    }

    gl.translateXAxisY = gl.translateXAxisY + w.config.xaxis.labels.offsetY
    gl.translateXAxisX = gl.translateXAxisX + w.config.xaxis.labels.offsetX

    let yAxisWidth = this.yAxisWidth
    let xAxisHeight = this.xAxisHeight
    gl.xAxisLabelsHeight = this.xAxisHeight
    gl.xAxisHeight = this.xAxisHeight
    let translateY = 10

    if (!w.config.grid.show || w.config.chart.type === 'radar') {
      yAxisWidth = 0
      xAxisHeight = 35
    }

    if (this.isSparkline) {
      lgRect = {
        height: 0,
        width: 0
      }
      xAxisHeight = 0
      yAxisWidth = 0
      translateY = 0
    }

    this.additionalPaddingXLabels(xaxisLabelCoords)

    switch (w.config.legend.position) {
      case 'bottom':
        gl.translateY = translateY
        gl.translateX = yAxisWidth
        gl.gridHeight =
          gl.svgHeight -
          lgRect.height -
          xAxisHeight -
          (!this.isSparkline ? (w.globals.rotateXLabels ? 10 : 15) : 0)
        gl.gridWidth = gl.svgWidth - yAxisWidth
        break
      case 'top':
        gl.translateY = lgRect.height + translateY
        gl.translateX = yAxisWidth
        gl.gridHeight =
          gl.svgHeight -
          lgRect.height -
          xAxisHeight -
          (!this.isSparkline ? (w.globals.rotateXLabels ? 10 : 15) : 0)
        gl.gridWidth = gl.svgWidth - yAxisWidth
        break
      case 'left':
        gl.translateY = translateY
        gl.translateX = lgRect.width + yAxisWidth
        gl.gridHeight = gl.svgHeight - xAxisHeight - 12
        gl.gridWidth = gl.svgWidth - lgRect.width - yAxisWidth
        break
      case 'right':
        gl.translateY = translateY
        gl.translateX = yAxisWidth
        gl.gridHeight = gl.svgHeight - xAxisHeight - 12
        gl.gridWidth = gl.svgWidth - lgRect.width - yAxisWidth - 5
        break
      default:
        throw new Error('Legend position not supported')
    }

    this.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords)

    // after drawing everything, set the Y axis positions
    let objyAxis = new YAxis(this.ctx)
    objyAxis.setYAxisXPosition(yaxisLabelCoords, yTitleCoords)
  }

  setGridCoordsForNonAxisCharts(lgRect) {
    let w = this.w
    let gl = w.globals
    let xPad = 0

    if (w.config.legend.show && !w.config.legend.floating) {
      xPad = 20
    }

    let offY = 10
    let offX = 0

    if (w.config.chart.type === 'pie' || w.config.chart.type === 'donut') {
      offY = offY + w.config.plotOptions.pie.offsetY
      offX = offX + w.config.plotOptions.pie.offsetX
    } else if (w.config.chart.type === 'radialBar') {
      offY = offY + w.config.plotOptions.radialBar.offsetY
      offX = offX + w.config.plotOptions.radialBar.offsetX
    }

    if (!w.config.legend.show) {
      gl.gridHeight = gl.svgHeight - 35
      gl.gridWidth = gl.gridHeight

      gl.translateY = offY - 10
      gl.translateX = offX + (gl.svgWidth - gl.gridWidth) / 2

      return
    }

    switch (w.config.legend.position) {
      case 'bottom':
        gl.gridHeight = gl.svgHeight - lgRect.height - 35
        gl.gridWidth = gl.gridHeight

        gl.translateY = offY - 20
        gl.translateX = offX + (gl.svgWidth - gl.gridWidth) / 2
        break
      case 'top':
        gl.gridHeight = gl.svgHeight - lgRect.height - 35
        gl.gridWidth = gl.gridHeight

        gl.translateY = lgRect.height + offY + 10
        gl.translateX = offX + (gl.svgWidth - gl.gridWidth) / 2
        break
      case 'left':
        gl.gridWidth = gl.svgWidth - lgRect.width - xPad
        gl.gridHeight = gl.gridWidth
        gl.translateY = offY
        gl.translateX = offX + lgRect.width + xPad

        break
      case 'right':
        gl.gridWidth = gl.svgWidth - lgRect.width - xPad - 5
        gl.gridHeight = gl.gridWidth
        gl.translateY = offY
        gl.translateX = offX + 10

        break
      default:
        throw new Error('Legend position not supported')
    }
  }

  setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords) {
    let w = this.w
    w.config.yaxis.map((yaxe, index) => {
      if (
        w.globals.ignoreYAxisIndexes.indexOf(index) === -1 &&
        !w.config.yaxis[index].floating &&
        w.config.yaxis[index].show
      ) {
        if (yaxe.opposite) {
          w.globals.translateX =
            w.globals.translateX -
            (yaxisLabelCoords[index].width + yTitleCoords[index].width) -
            parseInt(w.config.yaxis[index].labels.style.fontSize) / 1.2 -
            12
        }
      }
    })
  }

  // Sometimes, the last labels gets cropped in category/numeric xaxis.
  // Hence, we add some additional padding based on the label length to avoid the last label being cropped.
  // NOTE: datetime x-axis won't have any effect with this as we don't know the label length there due to many constraints.
  additionalPaddingXLabels(xaxisLabelCoords) {
    const w = this.w
    const xtype = w.config.xaxis.type
    const isXNumeric = w.globals.isXNumeric

    const isCollapsed = (i) => {
      return w.globals.collapsedSeriesIndices.indexOf(i) !== -1
    }

    const rightPad = (labels) => {
      if (this.timescaleLabels) {
        // for timeline labels, we take the last label and check if it exceeds gridWidth
        const lastTimescaleLabel = this.timescaleLabels[
          this.timescaleLabels.length - 1
        ]
        const labelPosition = lastTimescaleLabel.position + labels.width
        if (labelPosition > w.globals.gridWidth) {
          w.globals.skipLastTimelinelabel = true
        } else {
          // we have to make it false again in case of zooming/panning
          w.globals.skipLastTimelinelabel = false
        }
      } else if (xtype === 'datetime') {
        if (w.config.grid.padding.right < labels.width) {
          w.globals.skipLastTimelinelabel = true
        }
      } else if (xtype !== 'datetime') {
        if (w.config.grid.padding.right < labels.width) {
          this.xPadRight = labels.width / 2 + 1
        }
      }
    }

    const leftPad = (labels) => {
      if (w.config.grid.padding.left < labels.width) {
        this.xPadLeft = labels.width / 2 + 1
      }
    }

    const padYAxe = (yaxe, shouldPad, i) => {
      if (!shouldPad || !isXNumeric) return
      if (
        (isXNumeric && w.globals.isMultipleYAxis && wisCollapsed(i)) ||
        (w.globals.isBarHorizontal && yaxe.opposite)
      ) {
        leftPad(xaxisLabelCoords)
      }

      if (
        (!w.globals.isBarHorizontal && yaxe.opposite && isCollapsed(i)) ||
        (isXNumeric && !w.globals.isMultipleYAxis)
      ) {
        rightPad(xaxisLabelCoords)
      }
    }

    const paddingAllowed = xtype !== 'category' || w.globals.isBarHorizontal

    if (paddingAllowed) {
      w.config.yaxis.forEach((yaxe, i) => {
        const isYInvisible = !yaxe.show || yaxe.floating

        const isBarOpposite = yaxe.opposite && w.globals.isBarHorizontal

        let shouldPad = isYInvisible || isCollapsed(i) || isBarOpposite

        padYAxe(yaxe, shouldPad, i)
      })
    }

    if (w.globals.isBarHorizontal) {
      this.xPadRight = xaxisLabelCoords.width / 2 + 1
    }
  }

  titleSubtitleOffset() {
    const w = this.w
    const gl = w.globals
    let gridShrinkOffset = this.isSparkline || !w.globals.axisCharts ? 0 : 10

    if (w.config.title.text !== undefined) {
      gridShrinkOffset += w.config.title.margin
    } else {
      gridShrinkOffset += this.isSparkline || !w.globals.axisCharts ? 0 : 5
    }

    if (w.config.subtitle.text !== undefined) {
      gridShrinkOffset += w.config.subtitle.margin
    } else {
      gridShrinkOffset += this.isSparkline || !w.globals.axisCharts ? 0 : 5
    }

    const nonAxisOrMultiSeriesCharts =
      w.config.series.length > 1 ||
      !w.globals.axisCharts ||
      w.config.legend.showForSingleSeries

    if (
      w.config.legend.show &&
      w.config.legend.position === 'bottom' &&
      !w.config.legend.floating &&
      nonAxisOrMultiSeriesCharts
    ) {
      gridShrinkOffset += 10
    }

    let titleCoords = this.getTitleSubtitleCoords('title')
    let subtitleCoords = this.getTitleSubtitleCoords('subtitle')

    gl.gridHeight =
      gl.gridHeight -
      titleCoords.height -
      subtitleCoords.height -
      gridShrinkOffset

    gl.translateY =
      gl.translateY +
      titleCoords.height +
      subtitleCoords.height +
      gridShrinkOffset
  }

  getTotalYAxisWidth() {
    let w = this.w
    let yAxisWidth = 0
    let padding = 10

    const isHiddenYAxis = function(index) {
      return w.globals.ignoreYAxisIndexes.indexOf(index) > -1
    }

    const padForLabelTitle = (el, index) => {
      let floating = w.config.yaxis[index].floating

      if (el.width > 0 && !floating) {
        yAxisWidth = yAxisWidth + el.width + padding
        if (isHiddenYAxis(index)) {
          yAxisWidth = yAxisWidth - el.width - padding
        }
      } else {
        yAxisWidth =
          yAxisWidth + (floating || !w.config.yaxis[index].show ? 0 : 5)
      }
    }

    w.globals.yLabelsCoords.map((yLabelCoord, index) => {
      padForLabelTitle(yLabelCoord, index)
    })

    w.globals.yTitleCoords.map((yTitleCoord, index) => {
      padForLabelTitle(yTitleCoord, index)
    })

    return yAxisWidth
  }

  getxAxisTimeScaleLabelsCoords() {
    let w = this.w
    let rect

    this.timescaleLabels = w.globals.timelineLabels.slice()
    if (w.globals.invertedTimelineLabels.length) {
      this.timescaleLabels = w.globals.invertedTimelineLabels.slice()
    }

    let labels = this.timescaleLabels.map((label) => {
      return label.value
    })

    //  get the longest string from the labels array and also apply label formatter to it
    let val = labels.reduce(function(a, b) {
      // if undefined, maybe user didn't pass the datetime(x) values
      if (typeof a === 'undefined') {
        console.error(
          'You have possibly supplied invalid Date format. Please supply a valid JavaScript Date'
        )
        return 0
      } else {
        return a.length > b.length ? a : b
      }
    }, 0)

    let graphics = new Graphics(this.ctx)
    rect = graphics.getTextRects(val, w.config.xaxis.labels.style.fontSize)

    let totalWidthRotated = rect.width * 1.05 * labels.length

    if (
      totalWidthRotated > w.globals.gridWidth &&
      w.config.xaxis.labels.rotate !== 0
    ) {
      w.globals.overlappingXLabels = true
    }

    return rect
  }

  /**
   * Get X Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getxAxisLabelsCoords() {
    let w = this.w

    let xaxisLabels = w.globals.labels.slice()
    let rect

    if (w.globals.timelineLabels.length > 0) {
      const coords = this.getxAxisTimeScaleLabelsCoords()
      rect = {
        width: coords.width,
        height: coords.height
      }
    } else {
      let lgWidthForSideLegends =
        w.config.legend.position === 'left' &&
        w.config.legend.position === 'right' &&
        !w.config.legend.floating
          ? this.lgRect.width
          : 0

      // get the longest string from the labels array and also apply label formatter
      let xlbFormatter = w.globals.xLabelFormatter

      // prevent changing xaxisLabels to avoid issues in multi-yaxies - fix #522
      let val = xaxisLabels.reduce(function(a, b) {
        return a.length > b.length ? a : b
      }, 0)

      // the labels gets changed for bar charts
      if (w.globals.isBarHorizontal) {
        val = w.globals.yAxisScale[0].result.reduce(function(a, b) {
          return a.length > b.length ? a : b
        }, 0)
      }

      let xFormat = new Formatters(this.ctx)
      let timestamp = val
      val = xFormat.xLabelFormat(xlbFormatter, val, timestamp)

      let graphics = new Graphics(this.ctx)

      let xLabelrect = graphics.getTextRects(
        val,
        w.config.xaxis.labels.style.fontSize
      )

      rect = {
        width: xLabelrect.width,
        height: xLabelrect.height
      }

      if (
        rect.width * xaxisLabels.length >
          w.globals.svgWidth - lgWidthForSideLegends - this.yAxisWidth &&
        w.config.xaxis.labels.rotate !== 0
      ) {
        if (!w.globals.isBarHorizontal) {
          w.globals.rotateXLabels = true
          xLabelrect = graphics.getTextRects(
            val,
            w.config.xaxis.labels.style.fontSize,
            w.config.xaxis.labels.style.fontFamily,
            `rotate(${w.config.xaxis.labels.rotate} 0 0)`,
            false
          )

          rect.height = xLabelrect.height / 1.66
        }
      } else {
        w.globals.rotateXLabels = false
      }
    }

    if (!w.config.xaxis.labels.show) {
      rect = {
        width: 0,
        height: 0
      }
    }

    return {
      width: rect.width,
      height: rect.height
    }
  }

  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getyAxisLabelsCoords() {
    let w = this.w

    let width = 0
    let height = 0
    let ret = []
    let labelPad = 10

    w.config.yaxis.map((yaxe, index) => {
      if (
        yaxe.show &&
        yaxe.labels.show &&
        w.globals.yAxisScale[index].result.length
      ) {
        let lbFormatter = w.globals.yLabelFormatters[index]

        // the second parameter -1 is the index of tick which user can use in the formatter
        let val = lbFormatter(w.globals.yAxisScale[index].niceMax, {
          seriesIndex: index,
          dataPointIndex: -1,
          w
        })

        // if user has specified a custom formatter, and the result is null or empty, we need to discard the formatter and take the value as it is.
        if (typeof val === 'undefined' || val.length === 0) {
          val = w.globals.yAxisScale[index].niceMax
        }

        if (w.globals.isBarHorizontal) {
          labelPad = 0

          let barYaxisLabels = w.globals.labels.slice()

          //  get the longest string from the labels array and also apply label formatter to it
          val = barYaxisLabels.reduce(function(a, b) {
            return a.length > b.length ? a : b
          }, 0)

          val = lbFormatter(val, { seriesIndex: index, dataPointIndex: -1, w })
        }

        let graphics = new Graphics(this.ctx)
        let rect = graphics.getTextRects(val, yaxe.labels.style.fontSize)

        ret.push({
          width: rect.width + labelPad,
          height: rect.height
        })
      } else {
        ret.push({
          width,
          height
        })
      }
    })

    return ret
  }

  /**
   * Get X Axis Title Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getxAxisTitleCoords() {
    let w = this.w
    let width = 0
    let height = 0

    if (w.config.xaxis.title.text !== undefined) {
      let graphics = new Graphics(this.ctx)

      let rect = graphics.getTextRects(
        w.config.xaxis.title.text,
        w.config.xaxis.title.style.fontSize
      )

      width = rect.width
      height = rect.height
    }

    return {
      width: width,
      height: height
    }
  }

  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getyAxisTitleCoords() {
    let w = this.w
    let ret = []

    w.config.yaxis.map((yaxe, index) => {
      if (yaxe.show && yaxe.title.text !== undefined) {
        let graphics = new Graphics(this.ctx)
        let rect = graphics.getTextRects(
          yaxe.title.text,
          yaxe.title.style.fontSize,
          yaxe.title.style.fontFamily,
          'rotate(-90 0 0)',
          false
        )

        ret.push({
          width: rect.width,
          height: rect.height
        })
      } else {
        ret.push({
          width: 0,
          height: 0
        })
      }
    })

    return ret
  }

  /**
   * Get Chart Title/Subtitle Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getTitleSubtitleCoords(type) {
    let w = this.w
    let width = 0
    let height = 0

    const floating =
      type === 'title' ? w.config.title.floating : w.config.subtitle.floating

    let el = w.globals.dom.baseEl.querySelector(`.apexcharts-${type}-text`)

    if (el !== null && !floating) {
      let coord = el.getBoundingClientRect()
      width = coord.width
      height = w.globals.axisCharts ? coord.height + 5 : coord.height
    }

    return {
      width,
      height
    }
  }

  getLegendsRect() {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector('.apexcharts-legend')
    let lgRect = Object.assign({}, Utils.getBoundingClientRect(elLegendWrap))

    if (
      elLegendWrap !== null &&
      !w.config.legend.floating &&
      w.config.legend.show
    ) {
      this.lgRect = {
        x: lgRect.x,
        y: lgRect.y,
        height: lgRect.height,
        width: lgRect.height === 0 ? 0 : lgRect.width
      }
    } else {
      this.lgRect = {
        x: 0,
        y: 0,
        height: 0,
        width: 0
      }
    }

    return this.lgRect
  }
}
