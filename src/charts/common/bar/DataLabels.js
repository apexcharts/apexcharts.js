import Graphics from '../../../modules/Graphics'
import DataLabels from '../../../modules/DataLabels'

export default class BarDataLabels {
  constructor(barCtx) {
    this.w = barCtx.w
    this.barCtx = barCtx

    this.totalFormatter =
      this.w.config.plotOptions.bar.dataLabels.total.formatter

    if (!this.totalFormatter) {
      this.totalFormatter = this.w.config.dataLabels.formatter
    }
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
    const {
      x,
      y,
      y1,
      y2,
      i,
      j,
      realIndex,
      columnGroupIndex,
      series,
      barHeight,
      barWidth,
      barXPosition,
      barYPosition,
      visibleSeries,
    } = opts
    const w = this.w
    const graphics = new Graphics(this.barCtx.w)

    const strokeWidth = Array.isArray(this.barCtx.strokeWidth)
      ? this.barCtx.strokeWidth[realIndex]
      : this.barCtx.strokeWidth

    let bcx
    let bcy
    if (w.axisFlags.isXNumeric && !w.globals.isBarHorizontal) {
      bcx = x + parseFloat(barWidth * (visibleSeries + 1))
      bcy = y + parseFloat(barHeight * (visibleSeries + 1)) - strokeWidth
    } else {
      bcx = x + parseFloat(barWidth * visibleSeries)
      bcy = y + parseFloat(barHeight * visibleSeries)
    }

    let dataLabels = null
    let totalDataLabels = null
    let dataLabelsX = x
    let dataLabelsY = y
    let dataLabelsPos = {}
    const dataLabelsConfig = w.config.dataLabels
    const barDataLabelsConfig = this.barCtx.barOptions.dataLabels
    const barTotalDataLabelsConfig = this.barCtx.barOptions.dataLabels.total

    if (typeof barYPosition !== 'undefined' && this.barCtx.isRangeBar) {
      bcy = barYPosition
      dataLabelsY = barYPosition
    }

    if (
      typeof barXPosition !== 'undefined' &&
      this.barCtx.isVerticalGroupedRangeBar
    ) {
      bcx = barXPosition
      dataLabelsX = barXPosition
    }

    const offX = dataLabelsConfig.offsetX
    const offY = dataLabelsConfig.offsetY

    let textRects = {
      width: 0,
      height: 0,
    }
    if (w.config.dataLabels.enabled) {
      const yLabel = w.seriesData.series[i][j]

      textRects = graphics.getTextRects(
        w.config.dataLabels.formatter
          ? w.config.dataLabels.formatter(yLabel, {
              ...w,
              seriesIndex: i,
              dataPointIndex: j,
              w,
            })
          : w.formatters.yLabelFormatters[0](yLabel),
        parseFloat(dataLabelsConfig.style.fontSize)
      )
    }

    const params = {
      x,
      y,
      i,
      j,
      realIndex,
      columnGroupIndex,
      bcx,
      bcy,
      barHeight,
      barWidth,
      textRects,
      strokeWidth,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY,
    }

    if (this.barCtx.isHorizontal) {
      dataLabelsPos = this.calculateBarsDataLabelsPosition(params)
    } else {
      dataLabelsPos = this.calculateColumnsDataLabelsPosition(params)
    }

    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: this.barCtx.isRangeBar
        ? [y1, y2]
        : w.config.chart.stackType === '100%'
        ? series[realIndex][j]
        : w.seriesData.series[realIndex][j],
      i: realIndex,
      j,
      barWidth,
      barHeight,
      textRects,
      dataLabelsConfig,
    })

    if (w.config.chart.stacked && barTotalDataLabelsConfig.enabled) {
      totalDataLabels = this.drawTotalDataLabels({
        x: dataLabelsPos.totalDataLabelsX,
        y: dataLabelsPos.totalDataLabelsY,
        barWidth,
        barHeight,
        realIndex,
        textAnchor: dataLabelsPos.totalDataLabelsAnchor,
        val: this.getStackedTotalDataLabel({ realIndex, j }),
        dataLabelsConfig,
        barTotalDataLabelsConfig,
      })
    }

    return {
      dataLabelsPos,
      dataLabels,
      totalDataLabels,
    }
  }

  getStackedTotalDataLabel({ realIndex, j }) {
    const w = this.w

    let val = this.barCtx.stackedSeriesTotals[j]
    if (this.totalFormatter) {
      val = this.totalFormatter(val, {
        ...w,
        seriesIndex: realIndex,
        dataPointIndex: j,
        w,
      })
    }

    return val
  }

  calculateColumnsDataLabelsPosition(opts) {
    const w = this.w
    let {
      i,
      j,
      realIndex,
      y,
      bcx,
      barWidth,
      barHeight,
      textRects,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      strokeWidth,
      offX,
      offY,
    } = opts

    let totalDataLabelsY
    let totalDataLabelsX
    const totalDataLabelsAnchor = 'middle'
    const totalDataLabelsBcx = bcx
    barHeight = Math.abs(barHeight)

    const vertical =
      w.config.plotOptions.bar.dataLabels.orientation === 'vertical'

    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j,
    })

    bcx = bcx - strokeWidth / 2

    const dataPointsDividedWidth = w.layout.gridWidth / w.globals.dataPoints

    if (this.barCtx.isVerticalGroupedRangeBar) {
      dataLabelsX += barWidth / 2
    } else {
      if (w.axisFlags.isXNumeric) {
        dataLabelsX = bcx - barWidth / 2 + offX
      } else {
        dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX
      }
      if (
        !w.config.chart.stacked &&
        zeroEncounters > 0 &&
        w.config.plotOptions.bar.hideZeroBarsWhenGrouped
      ) {
        dataLabelsX -= barWidth * zeroEncounters
      }
    }

    if (vertical) {
      const offsetDLX = 2
      dataLabelsX =
        dataLabelsX + textRects.height / 2 - strokeWidth / 2 - offsetDLX
    }

    const valIsNegative = w.seriesData.series[i][j] < 0

    let newY = y
    if (this.barCtx.isReversed) {
      newY = y + (valIsNegative ? barHeight : -barHeight)
    }

    switch (barDataLabelsConfig.position) {
      case 'center':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + offY
          } else {
            dataLabelsY = newY + barHeight / 2 - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + textRects.height / 2 + offY
          } else {
            dataLabelsY = newY + barHeight / 2 + textRects.height / 2 - offY
          }
        }
        break
      case 'bottom':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight + offY
          } else {
            dataLabelsY = newY + barHeight - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY =
              newY - barHeight + textRects.height + strokeWidth + offY
          } else {
            dataLabelsY =
              newY + barHeight - textRects.height / 2 + strokeWidth - offY
          }
        }
        break
      case 'top':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY + offY
          } else {
            dataLabelsY = newY - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - textRects.height / 2 - offY
          } else {
            dataLabelsY = newY + textRects.height + offY
          }
        }
        break
    }

    let lowestPrevY = newY
    w.labelData.seriesGroups.forEach((sg) => {
      this.barCtx[sg.join(',')]?.prevY.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevY = Math.max(arr[j], lowestPrevY)
        } else {
          lowestPrevY = Math.min(arr[j], lowestPrevY)
        }
      })
    })

    if (
      this.barCtx.lastActiveBarSerieIndex === realIndex &&
      barTotalDataLabelsConfig.enabled
    ) {
      const ADDITIONAL_OFFY = 18

      const graphics = new Graphics(this.barCtx.w)
      const totalLabeltextRects = graphics.getTextRects(
        this.getStackedTotalDataLabel({ realIndex, j }),
        dataLabelsConfig.fontSize
      )

      if (valIsNegative) {
        totalDataLabelsY =
          lowestPrevY -
          totalLabeltextRects.height / 2 -
          offY -
          barTotalDataLabelsConfig.offsetY +
          ADDITIONAL_OFFY
      } else {
        totalDataLabelsY =
          lowestPrevY +
          totalLabeltextRects.height +
          offY +
          barTotalDataLabelsConfig.offsetY -
          ADDITIONAL_OFFY
      }

      // width divided into equal parts
      const xDivision = dataPointsDividedWidth

      totalDataLabelsX =
        totalDataLabelsBcx +
        (w.axisFlags.isXNumeric
          ? (-barWidth * w.globals.barGroups.length) / 2
          : (w.globals.barGroups.length * barWidth) / 2 -
            (w.globals.barGroups.length - 1) * barWidth -
            xDivision) +
        barTotalDataLabelsConfig.offsetX
    }

    if (!w.config.chart.stacked) {
      if (dataLabelsY < 0) {
        dataLabelsY = 0 + strokeWidth
      } else if (dataLabelsY + textRects.height / 3 > w.layout.gridHeight) {
        dataLabelsY = w.layout.gridHeight - strokeWidth
      }
    }

    return {
      bcx,
      bcy: y,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor,
    }
  }

  calculateBarsDataLabelsPosition(opts) {
    const w = this.w
    let {
      x,
      i,
      j,
      realIndex,
      bcy,
      barHeight,
      barWidth,
      textRects,
      dataLabelsX,
      strokeWidth,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY,
    } = opts

    const dataPointsDividedHeight = w.layout.gridHeight / w.globals.dataPoints
    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j,
    })

    barWidth = Math.abs(barWidth)

    let dataLabelsY =
      bcy -
      (this.barCtx.isRangeBar ? 0 : dataPointsDividedHeight) +
      barHeight / 2 +
      textRects.height / 2 +
      offY -
      3

    if (
      !w.config.chart.stacked &&
      zeroEncounters > 0 &&
      w.config.plotOptions.bar.hideZeroBarsWhenGrouped
    ) {
      dataLabelsY -= barHeight * zeroEncounters
    }
    let totalDataLabelsX
    let totalDataLabelsY
    let totalDataLabelsAnchor = 'start'

    const valIsNegative = w.seriesData.series[i][j] < 0

    let newX = x
    if (this.barCtx.isReversed) {
      newX = x + (valIsNegative ? -barWidth : barWidth)
      totalDataLabelsAnchor = valIsNegative ? 'start' : 'end'
    }

    switch (barDataLabelsConfig.position) {
      case 'center':
        if (valIsNegative) {
          dataLabelsX = newX + barWidth / 2 - offX
        } else {
          dataLabelsX =
            Math.max(textRects.width / 2, newX - barWidth / 2) + offX
        }
        break
      case 'bottom':
        if (valIsNegative) {
          dataLabelsX = newX + barWidth - strokeWidth - offX
        } else {
          dataLabelsX = newX - barWidth + strokeWidth + offX
        }
        break
      case 'top':
        if (valIsNegative) {
          dataLabelsX = newX - strokeWidth - offX
        } else {
          dataLabelsX = newX - strokeWidth + offX
        }
        break
    }

    let lowestPrevX = newX
    w.labelData.seriesGroups.forEach((sg) => {
      this.barCtx[sg.join(',')]?.prevX.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevX = Math.min(arr[j], lowestPrevX)
        } else {
          lowestPrevX = Math.max(arr[j], lowestPrevX)
        }
      })
    })

    if (
      this.barCtx.lastActiveBarSerieIndex === realIndex &&
      barTotalDataLabelsConfig.enabled
    ) {
      const graphics = new Graphics(this.barCtx.w)
      const totalLabeltextRects = graphics.getTextRects(
        this.getStackedTotalDataLabel({ realIndex, j }),
        dataLabelsConfig.fontSize
      )
      if (valIsNegative) {
        totalDataLabelsX =
          lowestPrevX - strokeWidth - offX - barTotalDataLabelsConfig.offsetX

        totalDataLabelsAnchor = 'end'
      } else {
        totalDataLabelsX =
          lowestPrevX +
          offX +
          barTotalDataLabelsConfig.offsetX +
          (this.barCtx.isReversed ? -(barWidth + strokeWidth) : strokeWidth)
      }
      totalDataLabelsY =
        dataLabelsY -
        textRects.height / 2 +
        totalLabeltextRects.height / 2 +
        barTotalDataLabelsConfig.offsetY +
        strokeWidth

      if (w.globals.barGroups.length > 1) {
        totalDataLabelsY =
          totalDataLabelsY - (w.globals.barGroups.length / 2) * (barHeight / 2)
      }
    }

    if (!w.config.chart.stacked) {
      if (dataLabelsConfig.textAnchor === 'start') {
        if (dataLabelsX - textRects.width < 0) {
          dataLabelsX = valIsNegative
            ? textRects.width + strokeWidth
            : strokeWidth
        } else if (dataLabelsX + textRects.width > w.layout.gridWidth) {
          dataLabelsX = valIsNegative
            ? w.layout.gridWidth - strokeWidth
            : w.layout.gridWidth - textRects.width - strokeWidth
        }
      } else if (dataLabelsConfig.textAnchor === 'middle') {
        if (dataLabelsX - textRects.width / 2 < 0) {
          dataLabelsX = textRects.width / 2 + strokeWidth
        } else if (dataLabelsX + textRects.width / 2 > w.layout.gridWidth) {
          dataLabelsX = w.layout.gridWidth - textRects.width / 2 - strokeWidth
        }
      } else if (dataLabelsConfig.textAnchor === 'end') {
        if (dataLabelsX < 1) {
          dataLabelsX = textRects.width + strokeWidth
        } else if (dataLabelsX + 1 > w.layout.gridWidth) {
          dataLabelsX = w.layout.gridWidth - textRects.width - strokeWidth
        }
      }
    }

    return {
      bcx: x,
      bcy,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor,
    }
  }

  drawCalculatedDataLabels({
    x,
    y,
    val,
    i, // = realIndex
    j,
    textRects,
    barHeight,
    barWidth,
    dataLabelsConfig,
  }) {
    const w = this.w
    let rotate = 'rotate(0)'
    if (w.config.plotOptions.bar.dataLabels.orientation === 'vertical')
      rotate = `rotate(-90, ${x}, ${y})`

    const dataLabels = new DataLabels(this.barCtx.w, this.barCtx.ctx)
    const graphics = new Graphics(this.barCtx.w)
    const formatter = dataLabelsConfig.formatter

    let elDataLabelsWrap = null

    const isSeriesNotCollapsed =
      w.globals.collapsedSeriesIndices.indexOf(i) > -1

    if (dataLabelsConfig.enabled && !isSeriesNotCollapsed) {
      elDataLabelsWrap = graphics.group({
        class: 'apexcharts-data-labels',
        transform: rotate,
      })

      let text = ''
      if (typeof val !== 'undefined') {
        text = formatter(val, {
          ...w,
          seriesIndex: i,
          dataPointIndex: j,
          w,
        })
      }

      if (!val && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        text = ''
      }

      const valIsNegative = w.seriesData.series[i][j] < 0
      const position = w.config.plotOptions.bar.dataLabels.position
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
        this.barCtx.isRangeBar &&
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
          if (textRects.width / 1.6 > Math.abs(barWidth)) {
            text = ''
          }
        } else {
          if (textRects.height / 1.6 > Math.abs(barHeight)) {
            text = ''
          }
        }
      }

      const modifiedDataLabelsConfig = {
        ...dataLabelsConfig,
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
        offsetCorrection: true,
      })
    }

    return elDataLabelsWrap
  }

  drawTotalDataLabels({
    x,
    y,
    val,
    realIndex,
    textAnchor,
    barTotalDataLabelsConfig,
  }) {
    const graphics = new Graphics(this.barCtx.w)

    let totalDataLabelText

    if (
      barTotalDataLabelsConfig.enabled &&
      typeof x !== 'undefined' &&
      typeof y !== 'undefined' &&
      this.barCtx.lastActiveBarSerieIndex === realIndex
    ) {
      totalDataLabelText = graphics.drawText({
        x: x,
        y: y,
        foreColor: barTotalDataLabelsConfig.style.color,
        text: val,
        textAnchor,
        fontFamily: barTotalDataLabelsConfig.style.fontFamily,
        fontSize: barTotalDataLabelsConfig.style.fontSize,
        fontWeight: barTotalDataLabelsConfig.style.fontWeight,
      })
    }

    return totalDataLabelText
  }
}
