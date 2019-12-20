import Graphics from '../../../modules/Graphics'
import DataLabels from '../../../modules/DataLabels'

export default class BarDataLabels {
  constructor(barCtx) {
    this.w = barCtx.w
    this.barCtx = barCtx
  }
  /** handleBarDataLabels is used to calculate the positions for the data-labels
   * It also sets the element's data attr for bars and calls drawCalculatedBarDataLabels()
   * After calculating, it also calls the function to draw data labels
   * @memberof Bar
   * @param {object} {barProps} most of the bar properties used throughout the bar
   * drawing function
   * @return {object} dataLabels node-element which you can append later
   **/
  handleBarDataLabels(opts) {
    let {
      x,
      y,
      y1,
      y2,
      i,
      j,
      realIndex,
      series,
      barHeight,
      barWidth,
      barYPosition,
      visibleSeries,
      renderedPath
    } = opts
    let w = this.w
    let graphics = new Graphics(this.barCtx.ctx)

    let strokeWidth = Array.isArray(this.barCtx.strokeWidth)
      ? this.barCtx.strokeWidth[realIndex]
      : this.barCtx.strokeWidth

    let bcx = x + parseFloat(barWidth * visibleSeries)
    let bcy = y + parseFloat(barHeight * visibleSeries)

    if (w.globals.isXNumeric && !w.globals.isBarHorizontal) {
      bcx = x + parseFloat(barWidth * (visibleSeries + 1))
      bcy = y + parseFloat(barHeight * (visibleSeries + 1)) - strokeWidth
    }

    let dataLabels = null
    let dataLabelsX = x
    let dataLabelsY = y
    let dataLabelsPos = {}
    let dataLabelsConfig = w.config.dataLabels
    let barDataLabelsConfig = this.barCtx.barOptions.dataLabels

    if (typeof barYPosition !== 'undefined' && this.barCtx.isTimelineBar) {
      bcy = barYPosition
      dataLabelsY = barYPosition
    }

    const offX = dataLabelsConfig.offsetX
    const offY = dataLabelsConfig.offsetY

    let textRects = {
      width: 0,
      height: 0
    }
    if (w.config.dataLabels.enabled) {
      textRects = graphics.getTextRects(
        w.globals.yLabelFormatters[0](w.globals.maxY),
        parseFloat(dataLabelsConfig.style.fontSize)
      )
    }

    const params = {
      x,
      y,
      i,
      j,
      renderedPath,
      bcx,
      bcy,
      barHeight,
      barWidth,
      textRects,
      strokeWidth,
      dataLabelsX,
      dataLabelsY,
      barDataLabelsConfig,
      offX,
      offY
    }

    if (this.barCtx.isHorizontal) {
      dataLabelsPos = this.calculateBarsDataLabelsPosition(params)
    } else {
      dataLabelsPos = this.calculateColumnsDataLabelsPosition(params)
    }

    renderedPath.attr({
      cy: dataLabelsPos.bcy,
      cx: dataLabelsPos.bcx,
      j,
      val: series[i][j],
      barHeight,
      barWidth
    })

    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: this.barCtx.isTimelineBar ? [y1, y2] : series[i][j],
      i: realIndex,
      j,
      barWidth,
      barHeight,
      textRects,
      dataLabelsConfig
    })

    return dataLabels
  }

  calculateColumnsDataLabelsPosition(opts) {
    const w = this.w
    let {
      i,
      j,
      y,
      bcx,
      barWidth,
      barHeight,
      textRects,
      dataLabelsY,
      barDataLabelsConfig,
      strokeWidth,
      offX,
      offY
    } = opts

    let dataLabelsX

    let vertical =
      w.config.plotOptions.bar.dataLabels.orientation === 'vertical'

    bcx = bcx - strokeWidth / 2

    let dataPointsDividedWidth = w.globals.gridWidth / w.globals.dataPoints
    if (w.globals.isXNumeric) {
      dataLabelsX = bcx - barWidth / 2 + offX
    } else {
      dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX
    }

    if (vertical) {
      const offsetDLX = 2
      dataLabelsX =
        dataLabelsX + textRects.height / 2 - strokeWidth / 2 - offsetDLX
    }

    let valIsNegative = this.barCtx.series[i][j] <= 0

    if (this.barCtx.isReversed) {
      y = y - barHeight
    }

    switch (barDataLabelsConfig.position) {
      case 'center':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = y + barHeight / 2 + offY
          } else {
            dataLabelsY = y + barHeight / 2 - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = y + barHeight / 2 + textRects.height / 2 + offY
          } else {
            dataLabelsY = y + barHeight / 2 + textRects.height / 2 - offY
          }
        }
        break
      case 'bottom':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = y + barHeight + offY
          } else {
            dataLabelsY = y + barHeight - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = y + barHeight + textRects.height + strokeWidth + offY
          } else {
            dataLabelsY =
              y + barHeight - textRects.height / 2 + strokeWidth - offY
          }
        }
        break
      case 'top':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = y + offY
          } else {
            dataLabelsY = y - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = y - textRects.height / 2 - offY
          } else {
            dataLabelsY = y + textRects.height + offY
          }
        }
        break
    }

    if (!w.config.chart.stacked) {
      if (dataLabelsY < 0) {
        dataLabelsY = 0 + strokeWidth
      } else if (dataLabelsY + textRects.height / 3 > w.globals.gridHeight) {
        dataLabelsY = w.globals.gridHeight - strokeWidth
      }
    }

    return {
      bcx,
      bcy: y,
      dataLabelsX,
      dataLabelsY
    }
  }

  calculateBarsDataLabelsPosition(opts) {
    const w = this.w
    let {
      x,
      i,
      j,
      bcy,
      barHeight,
      barWidth,
      textRects,
      dataLabelsX,
      strokeWidth,
      barDataLabelsConfig,
      offX,
      offY
    } = opts

    let dataPointsDividedHeight = w.globals.gridHeight / w.globals.dataPoints

    let dataLabelsY =
      bcy -
      (this.barCtx.isTimelineBar ? 0 : dataPointsDividedHeight) +
      barHeight / 2 +
      textRects.height / 2 +
      offY -
      3

    let valIsNegative = this.barCtx.series[i][j] <= 0

    if (this.barCtx.isReversed) {
      x = x + barWidth
    }

    switch (barDataLabelsConfig.position) {
      case 'center':
        if (valIsNegative) {
          dataLabelsX = x - barWidth / 2 - offX
        } else {
          dataLabelsX = x - barWidth / 2 + offX
        }
        break
      case 'bottom':
        if (valIsNegative) {
          dataLabelsX =
            x - barWidth - strokeWidth - Math.round(textRects.width / 2) - offX
        } else {
          dataLabelsX =
            x - barWidth + strokeWidth + Math.round(textRects.width / 2) + offX
        }
        break
      case 'top':
        if (valIsNegative) {
          dataLabelsX = x - strokeWidth + Math.round(textRects.width / 2) - offX
        } else {
          dataLabelsX = x - strokeWidth - Math.round(textRects.width / 2) + offX
        }
        break
    }

    if (!w.config.chart.stacked) {
      if (dataLabelsX < 0) {
        dataLabelsX = dataLabelsX + textRects.width + strokeWidth
      } else if (dataLabelsX + textRects.width / 2 > w.globals.gridWidth) {
        dataLabelsX = w.globals.gridWidth - textRects.width - strokeWidth
      }
    }

    return {
      bcx: x,
      bcy,
      dataLabelsX,
      dataLabelsY
    }
  }

  drawCalculatedDataLabels({
    x,
    y,
    val,
    i,
    j,
    textRects,
    barHeight,
    barWidth,
    dataLabelsConfig
  }) {
    const w = this.w
    let rotate = 'rotate(0)'
    if (w.config.plotOptions.bar.dataLabels.orientation === 'vertical')
      rotate = `rotate(-90, ${x}, ${y})`

    const dataLabels = new DataLabels(this.barCtx.ctx)
    const graphics = new Graphics(this.barCtx.ctx)
    const formatter = dataLabelsConfig.formatter

    let elDataLabelsWrap = null

    const isSeriesNotCollapsed =
      w.globals.collapsedSeriesIndices.indexOf(i) > -1

    if (dataLabelsConfig.enabled && !isSeriesNotCollapsed) {
      elDataLabelsWrap = graphics.group({
        class: 'apexcharts-data-labels',
        transform: rotate
      })

      let text = ''
      if (typeof val !== 'undefined') {
        text = formatter(val, {
          seriesIndex: i,
          dataPointIndex: j,
          w
        })
      }

      if (val === 0 && w.config.chart.stacked) {
        // in a stacked bar/column chart, 0 value should be neglected as it will overlap on the next element
        text = ''
      }

      let valIsNegative = w.globals.series[i][j] <= 0
      let position = w.config.plotOptions.bar.dataLabels.position
      if (w.config.plotOptions.bar.dataLabels.orientation === 'vertical') {
        if (position === 'top') {
          if (valIsNegative) dataLabelsConfig.textAnchor = 'end'
          else dataLabelsConfig.textAnchor = 'start'
        }
        if (position === 'center') {
          dataLabelsConfig.textAnchor = 'middle'
        }
        if (position === 'bottom') {
          if (valIsNegative) dataLabelsConfig.textAnchor = 'end'
          else dataLabelsConfig.textAnchor = 'start'
        }
      }

      if (
        this.barCtx.isTimelineBar &&
        this.barCtx.barOptions.dataLabels.hideOverflowingLabels
      ) {
        // hide the datalabel if it cannot fit into the rect
        const txRect = graphics.getTextRects(
          text,
          parseFloat(dataLabelsConfig.style.fontSize)
        )
        if (barWidth < txRect.width) {
          text = ''
        }
      }

      if (
        w.config.chart.stacked &&
        this.barCtx.barOptions.dataLabels.hideOverflowingLabels
      ) {
        // if there is not enough space to draw the label in the bar/column rect, check hideOverflowingLabels property to prevent overflowing on wrong rect
        // Note: This issue is only seen in stacked charts
        if (this.barCtx.isHorizontal) {
          barWidth =
            w.globals.series[i][j] / this.barCtx.yRatio[this.barCtx.yaxisIndex]

          // FIXED: Don't always hide the stacked negative side label
          // A negative value will result in a negative bar width
          // Only hide the text when the width is smaller (a higher negative number) than the negative bar width.
          if (
            (barWidth > 0 && textRects.width / 1.6 > barWidth) ||
            (barWidth < 0 && textRects.width / 1.6 < barWidth)
          ) {
            text = ''
          }
        } else {
          barHeight =
            w.globals.series[i][j] / this.barCtx.yRatio[this.barCtx.yaxisIndex]
          if (textRects.height / 1.6 > barHeight) {
            text = ''
          }
        }
      }

      let modifiedDataLabelsConfig = {
        ...dataLabelsConfig
      }
      if (this.barCtx.isHorizontal) {
        if (val < 0) {
          if (dataLabelsConfig.textAnchor === 'start') {
            modifiedDataLabelsConfig.textAnchor = 'end'
          } else if (dataLabelsConfig.textAnchor === 'end') {
            modifiedDataLabelsConfig.textAnchor = 'start'
          }
        }
      }

      dataLabels.plotDataLabelsText({
        x,
        y,
        text,
        i,
        j,
        parent: elDataLabelsWrap,
        dataLabelsConfig: modifiedDataLabelsConfig,
        alwaysDrawDataLabel: true,
        offsetCorrection: true
      })
    }

    return elDataLabelsWrap
  }
}
