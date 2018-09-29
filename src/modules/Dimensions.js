import Graphics from './Graphics'
import Formatters from '../modules/Formatters'
import Utils from './../utils/Utils'
import YAxis from './axes/YAxis'

/**
 * ApexCharts Dimensions Class for calculating rects of all elements that are drawn and will be drawn.
 *
 * @module Dimensions
 **/

class Dimensions {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.lgRect = {}
    this.yAxisWidth = 0
    this.xAxisHeight = 0

    this.isBarHorizontal = !!((this.w.config.chart.type === 'bar' &&
      this.w.config.plotOptions.bar.horizontal))
  }

  /**
   * @memberof Dimensions
   * @param {object} w - chart context
   **/
  plotCoords () {
    let w = this.w
    let gl = w.globals

    // if user specified a type in series too, turn on comboCharts flag
    if (w.config.series.length && typeof w.config.series[0].type !== 'undefined') {
      w.globals.comboCharts = true
    }

    let lgRect = this.getLegendsRect()

    if (gl.axisCharts) {
      // for line / area / scatter / column
      this.setGridCoordsForAxisCharts(lgRect)
    } else {
      // for pie / donuts / circle
      this.setGridCoordsForNonAxisCharts(lgRect)
    }

    this.titleSubtitleOffset()
  }

  setGridCoordsForAxisCharts (lgRect) {
    let w = this.w
    let gl = w.globals

    let xtitleCoords
    let xaxisLabelCoords
    let ytitleCoords = []
    let yaxisLabelCoords = {
      width: 0,
      height: 0
    }

    yaxisLabelCoords = this.getyAxisLabelsCoords()
    xaxisLabelCoords = this.getxAxisLabelsCoords()

    if (w.globals.timelineLabels.length > 0) {
      xaxisLabelCoords = this.getxAxisTimeScaleLabelsCoords()
    }

    xtitleCoords = this.getxAxisTitleCoords()
    ytitleCoords = this.getyAxisTitleCoords()

    if (
      this.isBarHorizontal
    ) {
      // move x with y for horizontal bars
      // let tempObj = Object.assign({}, yaxisLabelCoords)
      // yaxisLabelCoords = Object.assign({}, xaxisLabelCoords)
      // xaxisLabelCoords = Object.assign({}, tempObj)
    }

    // no x labels, make w=0,h=0
    if (!w.config.xaxis.labels.show) {
      xaxisLabelCoords = {
        height: 0,
        width: 0
      }
    }

    w.globals.yLabelsCoords = []
    w.globals.yTitleCoords = []
    w.config.yaxis.map((yaxe, index) => {
      // store the labels and titles coords in global vars
      w.globals.yLabelsCoords.push({
        width: yaxisLabelCoords[index].width,
        index
      })
      w.globals.yTitleCoords.push({
        width: ytitleCoords[index].width,
        index
      })
    })

    this.xAxisHeight = (xaxisLabelCoords.height + xtitleCoords.height) * w.globals.lineHeightRatio + 15

    this.xAxisWidth = xaxisLabelCoords.width

    if (
      this.xAxisHeight - xtitleCoords.height >
      w.config.xaxis.labels.maxHeight
    ) {
      this.xAxisHeight = w.config.xaxis.labels.maxHeight
    }

    if (w.config.xaxis.floating) {
      this.xAxisHeight = 0
    }

    gl.xAxisLabelsHeight = this.xAxisHeight

    gl.translateXAxisY = w.globals.rotateXLabels ? this.xAxisHeight / 8 : -4
    gl.translateXAxisX = w.globals.rotateXLabels &&
      w.globals.dataXY &&
      w.config.xaxis.labels.rotate <= -45
      ? -this.xAxisWidth / 4
      : 0

    if (
      this.isBarHorizontal
    ) {
      gl.rotateXLabels = false
      gl.translateXAxisY = -1 * (parseInt(w.config.xaxis.labels.style.fontSize) / 1.5)
    }

    gl.translateXAxisY = gl.translateXAxisY + w.config.xaxis.labels.offsetY
    gl.translateXAxisX = gl.translateXAxisX + w.config.xaxis.labels.offsetX

    if (!this.isBarHorizontal) {
      this.yAxisWidth = this.getTotalYAxisWidth()
    } else {
      this.yAxisWidth = w.globals.yLabelsCoords[0].width + w.globals.yTitleCoords[0].width + 15
      if (this.yAxisWidth > w.config.yaxis[0].labels.maxWidth) {
        this.yAxisWidth = w.config.yaxis[0].labels.maxWidth
      }
    }

    let yAxisWidth = this.yAxisWidth
    let xAxisHeight = this.xAxisHeight
    let translateY = 10

    if (!w.config.grid.show) {
      yAxisWidth = 0
      xAxisHeight = 35
    }

    this.isSparkline = w.config.chart.sparkline.enabled

    if (this.isSparkline) {
      lgRect = {
        height: 0,
        width: 0
      }
      xAxisHeight = 0
      yAxisWidth = 0
      translateY = 0
    }

    switch (w.config.legend.position) {
      case 'bottom':
        gl.translateY = translateY
        gl.translateX = yAxisWidth
        gl.gridHeight = gl.svgHeight - lgRect.height - xAxisHeight - (!this.isSparkline ? (w.globals.rotateXLabels ? 10 : 15) : 0)
        gl.gridWidth = gl.svgWidth - yAxisWidth
        break
      case 'top':
        gl.translateY = lgRect.height + translateY
        gl.translateX = yAxisWidth
        gl.gridHeight = gl.svgHeight - lgRect.height - xAxisHeight - (!this.isSparkline ? (w.globals.rotateXLabels ? 10 : 15) : 0)
        gl.gridWidth = gl.svgWidth - yAxisWidth
        break
      case 'left':
        gl.translateY = translateY
        gl.translateX = lgRect.width + yAxisWidth
        gl.gridHeight = gl.svgHeight - xAxisHeight
        gl.gridWidth = gl.svgWidth - lgRect.width - yAxisWidth
        break
      case 'right':
        gl.translateY = translateY
        gl.translateX = yAxisWidth
        gl.gridHeight = gl.svgHeight - xAxisHeight
        gl.gridWidth = gl.svgWidth - lgRect.width - yAxisWidth
        break
      default:
        throw new Error('Legend position not supported')
    }

    gl.gridHeight = gl.gridHeight -
      w.config.grid.padding.top -
      w.config.grid.padding.bottom

    gl.gridWidth = gl.gridWidth - w.config.grid.padding.left - w.config.grid.padding.right

    gl.translateX = gl.translateX + w.config.grid.padding.left
    gl.translateY = gl.translateY + w.config.grid.padding.top

    if (!this.isBarHorizontal) {
      this.setGridXPosForDualYAxis(ytitleCoords, yaxisLabelCoords)
    }

    // after drawing everything, set the Y axis positions
    let objyAxis = new YAxis(this.ctx)
    objyAxis.setYAxisXPosition(yaxisLabelCoords, ytitleCoords)
  }

  setGridCoordsForNonAxisCharts (lgRect) {
    let w = this.w
    let gl = w.globals
    let xPad =
      w.config.legend.markers.size * 4 + w.config.legend.itemMargin.horizontal

    let offY = 10

    if (w.config.chart.type === 'pie' || w.config.chart.type === 'donut') {
      offY = offY + w.config.plotOptions.pie.offsetY
    } else if (w.config.chart.type === 'radialBar') {
      offY = offY + w.config.plotOptions.radialBar.offsetY
    }

    switch (w.config.legend.position) {
      case 'bottom':
        gl.gridHeight = gl.svgHeight - lgRect.height - 35
        gl.gridWidth = gl.gridHeight

        gl.translateY = offY - 20
        gl.translateX = (gl.svgWidth - gl.gridWidth) / 2
        break
      case 'top':
        gl.gridHeight = gl.svgHeight - lgRect.height - 35
        gl.gridWidth = gl.gridHeight

        gl.translateY = lgRect.height + offY
        gl.translateX = (gl.svgWidth - gl.gridWidth) / 2
        break
      case 'left':
        gl.gridWidth = gl.svgWidth - lgRect.width - xPad
        gl.gridHeight = gl.gridWidth
        gl.translateY = offY
        gl.translateX = lgRect.width + xPad

        break
      case 'right':
        gl.gridWidth = gl.svgWidth - lgRect.width - xPad
        gl.gridHeight = gl.gridWidth
        gl.translateY = offY
        gl.translateX = 5

        break
      default:
        throw new Error('Legend position not supported')
    }
  }

  setGridXPosForDualYAxis (ytitleCoords, yaxisLabelCoords) {
    let w = this.w
    w.config.yaxis.map((yaxe, index) => {
      if (!w.globals.ignoreYAxisIndexes.includes(index) && !w.config.yaxis[index].floating) {
        if (yaxe.opposite) {
          w.globals.translateX = w.globals.translateX - (yaxisLabelCoords[index].width + ytitleCoords[index].width) - (parseInt(w.config.yaxis[index].labels.style.fontSize) / 1.2) - 12
        }
      }
    })
  }

  titleSubtitleOffset () {
    const w = this.w
    const gl = w.globals
    let gridShrinkOffset = this.isSparkline ? 0 : 10

    if (w.config.title.text !== undefined) {
      gridShrinkOffset += w.config.title.margin
    } else {
      gridShrinkOffset += this.isSparkline ? 0 : 5
    }

    if (w.config.subtitle.text !== undefined) {
      gridShrinkOffset += w.config.subtitle.margin
    } else {
      gridShrinkOffset += this.isSparkline ? 0 : 5
    }

    if (w.config.legend.show && w.config.legend.position === 'bottom' && !w.config.legend.floating && w.config.series.length > 1) {
      gridShrinkOffset += 10
    }

    let titleCoords = this.getMainTitleCoords()
    let subtitleCoords = this.getSubTitleCoords()

    gl.gridHeight = gl.gridHeight - titleCoords.height - subtitleCoords.height - gridShrinkOffset
    gl.translateY = gl.translateY + titleCoords.height + subtitleCoords.height + gridShrinkOffset
  }

  getTotalYAxisWidth () {
    let w = this.w
    let yAxisWidth = 0
    let padding = 10

    w.globals.yLabelsCoords.map((yLabelCoord, index) => {
      let floating = w.config.yaxis[index].floating
      if (yLabelCoord.width > 0 && !floating) {
        yAxisWidth = yAxisWidth + yLabelCoord.width + padding
        if (w.globals.ignoreYAxisIndexes.includes(index)) {
          yAxisWidth = yAxisWidth - yLabelCoord.width
        }
      } else {
        yAxisWidth = yAxisWidth + (floating ? 0 : 5)
      }
    })

    w.globals.yTitleCoords.map((yTitleCoord, index) => {
      let floating = w.config.yaxis[index].floating
      if (yTitleCoord.width > 0 && !floating) {
        yAxisWidth = yAxisWidth + yTitleCoord.width + (parseInt(w.config.yaxis[index].title.style.fontSize))
        if (w.globals.ignoreYAxisIndexes.includes(index)) {
          yAxisWidth = yAxisWidth - yTitleCoord.width
        }
      } else {
        yAxisWidth = yAxisWidth + (floating ? 0 : 5)
      }
    })

    return yAxisWidth
  }

  getxAxisTimeScaleLabelsCoords () {
    let w = this.w

    let timescaleLabels = w.globals.timelineLabels.slice()

    let labels = timescaleLabels.map(label => {
      return label.value
    })

    //  get the longest string from the labels array and also apply label formatter to it
    let val = labels.reduce(function (a, b) {
      // if undefined, maybe user didn't pass the datetime(x) values
      if (typeof a === 'undefined') {
        console.error('You have possibly supplied invalid Date format. Please supply a valid JavaScript Date')
        return 0
      } else {
        return a.length > b.length ? a : b
      }
    }, 0)

    let graphics = new Graphics(this.ctx)
    let rect = graphics.getTextRects(val, w.config.xaxis.labels.style.fontSize)

    let totalWidthRotated = (rect.width * 1.05) * labels.length

    if (
      totalWidthRotated > w.globals.gridWidth && w.config.xaxis.labels.rotate !== 0
    ) {
      w.globals.overlappingXLabels = true
    }

    return {
      width: rect.width,
      height: rect.height
    }
  }

  /**
   * Get X Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getxAxisLabelsCoords () {
    let w = this.w

    let xaxisLabels = w.globals.labels.slice()

    let lgWidthForSideLegends = w.config.legend.position === 'left' && w.config.legend.position === 'right' && !w.config.legend.floating ? this.lgRect.width : 0

    //  get the longest string from the labels array and also apply label formatter to it
    let val = xaxisLabels.reduce(function (a, b) {
      return a.length > b.length ? a : b
    }, 0)

    let xlbFormatter = w.globals.xLabelFormatter

    let xFormat = new Formatters(this.ctx)
    val = xFormat.xLabelFormat(xlbFormatter, val)

    let graphics = new Graphics(this.ctx)
    let xLabelrect = graphics.getTextRects(val, w.config.xaxis.labels.style.fontSize)

    let rect = {
      width: xLabelrect.width,
      height: xLabelrect.height
    }

    if (
      rect.width * xaxisLabels.length >
      w.globals.svgWidth - lgWidthForSideLegends - this.yAxisWidth &&
      w.config.xaxis.labels.rotate !== 0
    ) {
      if (!this.isBarHorizontal) {
        w.globals.rotateXLabels = true
        xLabelrect = graphics.getTextRects(val, w.config.xaxis.labels.style.fontSize, `rotate(${w.config.xaxis.labels.rotate} 0 0)`, false)
        rect.height = xLabelrect.height / 1.66
      }
    } else {
      w.globals.rotateXLabels = false
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
  getyAxisLabelsCoords () {
    let w = this.w

    let width = 0
    let height = 0
    let ret = []
    let labelPad = 10

    w.config.yaxis.map((yaxe, index) => {
      if (yaxe.labels.show && w.globals.yAxisScale[index].result.length) {
        let lbFormatter = w.globals.yLabelFormatters[index]
        let val = lbFormatter(w.globals.yAxisScale[index].niceMax)

        if (this.isBarHorizontal) {
          labelPad = 0

          let barYaxisLabels = w.globals.labels.slice()

          //  get the longest string from the labels array and also apply label formatter to it
          val = barYaxisLabels.reduce(function (a, b) {
            return a.length > b.length ? a : b
          }, 0)

          val = lbFormatter(val)
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
  getxAxisTitleCoords () {
    let w = this.w
    let width = 0
    let height = 0

    if (w.config.xaxis.title.text !== undefined) {
      let graphics = new Graphics(this.ctx)

      let rect = graphics.getTextRects(w.config.xaxis.title.text, w.config.xaxis.title.style.fontSize)

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
  getyAxisTitleCoords () {
    let w = this.w
    let ret = []

    w.config.yaxis.map((yaxe, index) => {
      if (yaxe.title.text !== undefined) {
        let graphics = new Graphics(this.ctx)
        let rect = graphics.getTextRects(yaxe.title.text, yaxe.title.style.fontSize, 'rotate(-90 0 0)', false)

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
   * Get Chart Title Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getMainTitleCoords () {
    let w = this.w
    let width = 0
    let height = 0

    let elTitle = w.globals.dom.baseEl.querySelector(
      '.apexcharts-title-text'
    )

    if (elTitle !== null && !w.config.title.floating) {
      let titleCoords = elTitle.getBoundingClientRect()
      width = titleCoords.width
      height = w.globals.axisCharts ? titleCoords.height + 5 : titleCoords.height
    }

    return {
      width,
      height
    }
  }

  /**
   * Get Chart Title Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getSubTitleCoords () {
    let w = this.w
    let width = 0
    let height = 0

    let elSubTitle = w.globals.dom.baseEl.querySelector(
      '.apexcharts-subtitle-text'
    )

    if (elSubTitle !== null && !w.config.subtitle.floating) {
      let subtitleCoords = elSubTitle.getBoundingClientRect()
      width = subtitleCoords.width
      height = w.globals.axisCharts ? subtitleCoords.height + 5 : subtitleCoords.height
    }

    return {
      width,
      height
    }
  }

  getLegendsRect () {
    let w = this.w

    let elLegendWrap = w.globals.dom.baseEl.querySelector(
      '.apexcharts-legend'
    )
    let lgRect = Object.assign({}, Utils.getBoundingClientRect(elLegendWrap))

    lgRect.height = lgRect.height + w.config.legend.containerMargin.top + w.config.legend.containerMargin.bottom
    lgRect.width = lgRect.width + w.config.legend.containerMargin.left + w.config.legend.containerMargin.right

    if (elLegendWrap !== null && !w.config.legend.floating) {
      this.lgRect = lgRect
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

module.exports = Dimensions
