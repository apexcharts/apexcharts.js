import CoreUtils from '../modules/CoreUtils'
import Utils from '../utils/Utils'
import Fill from '../modules/Fill'
import Filters from '../modules/Filters'
import Graphics from '../modules/Graphics'
import DataLabels from '../modules/DataLabels'

/**
 * ApexCharts Bar Class responsible for drawing both Columns and Bars.
 *
 * @module Bar
 **/

class Bar {
  constructor(ctx, xyRatios) {
    this.ctx = ctx
    this.w = ctx.w
    const w = this.w
    this.barOptions = w.config.plotOptions.bar

    this.isHorizontal = this.barOptions.horizontal
    this.strokeWidth = w.config.stroke.width
    this.isNullValue = false

    this.xyRatios = xyRatios

    if (this.xyRatios !== null) {
      this.xRatio = xyRatios.xRatio
      this.yRatio = xyRatios.yRatio
      this.invertedXRatio = xyRatios.invertedXRatio
      this.invertedYRatio = xyRatios.invertedYRatio
      this.baseLineY = xyRatios.baseLineY
      this.baseLineInvertedY = xyRatios.baseLineInvertedY
    }
    this.yaxisIndex = 0

    this.seriesLen = 0
  }

  /** primary draw method which is called on bar object
   * @memberof Bar
   * @param {array} series - user supplied series values
   * @param {int} seriesIndex - the index by which series will be drawn on the svg
   * @return {node} element which is supplied to parent chart draw method for appending
   **/
  draw(series, seriesIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    const coreUtils = new CoreUtils(this.ctx, w)
    series = coreUtils.getLogSeries(series)
    this.series = series
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    this.initVariables(series)

    let ret = graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series'
    })

    if (w.config.dataLabels.enabled) {
      if (this.totalItems > w.config.plotOptions.bar.dataLabels.maxItems) {
        console.warn(
          'WARNING: DataLabels are enabled but there are too many to display. This may cause performance issue when rendering.'
        )
      }
    }

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let pathTo, pathFrom
      let x,
        y,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH, // zeroH is the baseline where 0 meets y axis
        zeroW // zeroW is the baseline where 0 meets x axis

      let yArrj = [] // hold y values of current iterating series
      let xArrj = [] // hold x values of current iterating series

      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i

      // el to which series will be drawn
      let elSeries = graphics.group({
        class: `apexcharts-series`,
        rel: i + 1,
        seriesName: Utils.escapeString(w.globals.seriesNames[realIndex]),
        'data:realIndex': realIndex
      })

      this.ctx.series.addCollapsedClassToSeries(elSeries, realIndex)

      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1
      }

      let strokeWidth = 0
      let barHeight = 0
      let barWidth = 0

      if (this.yRatio.length > 1) {
        this.yaxisIndex = realIndex
      }

      this.isReversed =
        w.config.yaxis[this.yaxisIndex] &&
        w.config.yaxis[this.yaxisIndex].reversed

      let initPositions = this.initialPositions()

      y = initPositions.y
      barHeight = initPositions.barHeight
      yDivision = initPositions.yDivision
      zeroW = initPositions.zeroW

      x = initPositions.x
      barWidth = initPositions.barWidth
      xDivision = initPositions.xDivision
      zeroH = initPositions.zeroH

      if (!this.horizontal) {
        xArrj.push(x + barWidth / 2)
      }

      // eldatalabels
      let elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels'
      })

      for (
        let j = 0, tj = w.globals.dataPoints;
        j < w.globals.dataPoints;
        j++, tj--
      ) {
        if (typeof this.series[i][j] === 'undefined' || series[i][j] === null) {
          this.isNullValue = true
        } else {
          this.isNullValue = false
        }
        if (w.config.stroke.show) {
          if (this.isNullValue) {
            strokeWidth = 0
          } else {
            strokeWidth = Array.isArray(this.strokeWidth)
              ? this.strokeWidth[realIndex]
              : this.strokeWidth
          }
        }

        let paths = null
        if (this.isHorizontal) {
          paths = this.drawBarPaths({
            indexes: {
              i,
              j,
              realIndex,
              bc
            },
            barHeight,
            strokeWidth,
            pathTo,
            pathFrom,
            zeroW,
            x,
            y,
            yDivision,
            elSeries
          })
          barWidth = this.series[i][j] / this.invertedYRatio
        } else {
          paths = this.drawColumnPaths({
            indexes: {
              i,
              j,
              realIndex,
              bc
            },
            x,
            y,
            xDivision,
            pathTo,
            pathFrom,
            barWidth,
            zeroH,
            strokeWidth,
            elSeries
          })
          barHeight = this.series[i][j] / this.yRatio[this.yaxisIndex]
        }

        pathTo = paths.pathTo
        pathFrom = paths.pathFrom
        y = paths.y
        x = paths.x

        // push current X
        if (j > 0) {
          xArrj.push(x + barWidth / 2)
        }

        yArrj.push(y)

        let pathFill = this.getPathFillColor(series, i, j, realIndex)

        elSeries = this.renderSeries({
          realIndex,
          pathFill,
          j,
          i,
          pathFrom,
          pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          barHeight,
          barWidth,
          elDataLabelsWrap,
          visibleSeries: this.visibleI,
          type: 'bar'
        })
      }

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrj
      w.globals.seriesYvalues[realIndex] = yArrj

      ret.add(elSeries)
    }

    return ret
  }

  getPathFillColor(series, i, j, realIndex) {
    const w = this.w
    let fill = new Fill(this.ctx)

    let fillColor = null
    let seriesNumber = this.barOptions.distributed ? j : i

    if (this.barOptions.colors.ranges.length > 0) {
      const colorRange = this.barOptions.colors.ranges
      colorRange.map((range) => {
        if (series[i][j] >= range.from && series[i][j] <= range.to) {
          fillColor = range.color
        }
      })
    }

    if (w.config.series[i].data[j] && w.config.series[i].data[j].fillColor) {
      fillColor = w.config.series[i].data[j].fillColor
    }

    let pathFill = fill.fillPath({
      seriesNumber: this.barOptions.distributed ? seriesNumber : realIndex,
      color: fillColor,
      value: series[i][j]
    })

    return pathFill
  }

  renderSeries({
    realIndex,
    pathFill,
    lineFill,
    j,
    i,
    pathFrom,
    pathTo,
    strokeWidth,
    elSeries,
    x,
    y,
    series,
    barHeight,
    barWidth,
    elDataLabelsWrap,
    visibleSeries,
    type
  }) {
    const w = this.w
    const graphics = new Graphics(this.ctx)

    if (!lineFill) {
      /* fix apexcharts#341 */
      lineFill = this.barOptions.distributed
        ? w.globals.stroke.colors[j]
        : w.globals.stroke.colors[realIndex]
    }

    if (w.config.series[i].data[j] && w.config.series[i].data[j].strokeColor) {
      lineFill = w.config.series[i].data[j].strokeColor
    }

    if (this.isNullValue) {
      pathFill = 'none'
    }

    let delay =
      ((j / w.config.chart.animations.animateGradually.delay) *
        (w.config.chart.animations.speed / w.globals.dataPoints)) /
      2.4

    let renderedPath = graphics.renderPaths({
      i,
      j,
      realIndex,
      pathFrom: pathFrom,
      pathTo: pathTo,
      stroke: lineFill,
      strokeWidth,
      strokeLineCap: w.config.stroke.lineCap,
      fill: pathFill,
      animationDelay: delay,
      initialSpeed: w.config.chart.animations.speed,
      dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
      className: `apexcharts-${type}-area`
    })

    renderedPath.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    const filters = new Filters(this.ctx)
    filters.setSelectionFilter(renderedPath, realIndex, j)
    elSeries.add(renderedPath)

    let dataLabels = this.calculateDataLabelsPos({
      x,
      y,
      i,
      j,
      series,
      realIndex,
      barHeight,
      barWidth,
      renderedPath,
      visibleSeries
    })
    if (dataLabels !== null) {
      elDataLabelsWrap.add(dataLabels)
    }

    elSeries.add(elDataLabelsWrap)
    return elSeries
  }

  initVariables(series) {
    const w = this.w
    this.series = series
    this.totalItems = 0
    this.seriesLen = 0
    this.visibleI = -1
    this.visibleItems = 1 // number of visible bars after user zoomed in/out

    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.seriesLen = this.seriesLen + 1
        this.totalItems += series[sl].length
      }
      if (w.globals.isXNumeric) {
        // get max visible items
        for (let j = 0; j < series[sl].length; j++) {
          if (
            w.globals.seriesX[sl][j] > w.globals.minX &&
            w.globals.seriesX[sl][j] < w.globals.maxX
          ) {
            this.visibleItems++
          }
        }
      } else {
        this.visibleItems = w.globals.dataPoints
      }
    }

    if (this.seriesLen === 0) {
      // A small adjustment when combo charts are used
      this.seriesLen = 1
    }
  }

  initialPositions() {
    let w = this.w
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW
    if (this.isHorizontal) {
      // height divided into equal parts
      yDivision = w.globals.gridHeight / w.globals.dataPoints
      barHeight = yDivision / this.seriesLen

      if (w.globals.isXNumeric) {
        yDivision = w.globals.gridHeight / this.totalItems
        barHeight = yDivision / this.seriesLen
      }

      barHeight = (barHeight * parseInt(this.barOptions.barHeight)) / 100

      zeroW =
        this.baseLineInvertedY +
        w.globals.padHorizontal +
        (this.isReversed ? w.globals.gridWidth : 0) -
        (this.isReversed ? this.baseLineInvertedY * 2 : 0)

      y = (yDivision - barHeight * this.seriesLen) / 2
    } else {
      // width divided into equal parts
      xDivision = w.globals.gridWidth / this.visibleItems
      barWidth =
        ((xDivision / this.seriesLen) * parseInt(this.barOptions.columnWidth)) /
        100

      if (w.globals.isXNumeric) {
        // max barwidth should be equal to minXDiff to avoid overlap
        xDivision = w.globals.minXDiff / this.xRatio
        barWidth =
          ((xDivision / this.seriesLen) *
            parseInt(this.barOptions.columnWidth)) /
          100
      }

      zeroH =
        w.globals.gridHeight -
        this.baseLineY[this.yaxisIndex] -
        (this.isReversed ? w.globals.gridHeight : 0) +
        (this.isReversed ? this.baseLineY[this.yaxisIndex] * 2 : 0)

      x = w.globals.padHorizontal + (xDivision - barWidth * this.seriesLen) / 2
    }

    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight,
      barWidth,
      zeroH,
      zeroW
    }
  }

  drawBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    pathTo,
    pathFrom,
    zeroW,
    x,
    y,
    yDivision,
    elSeries
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let i = indexes.i
    let j = indexes.j
    let realIndex = indexes.realIndex
    let bc = indexes.bc

    if (w.globals.isXNumeric) {
      y =
        (w.globals.seriesX[i][j] - w.globals.minX) / this.invertedXRatio -
        barHeight
    }

    let barYPosition = y + barHeight * this.visibleI

    pathTo = graphics.move(zeroW, barYPosition)

    pathFrom = graphics.move(zeroW, barYPosition)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPathFrom(realIndex, j)
    }

    if (
      typeof this.series[i][j] === 'undefined' ||
      this.series[i][j] === null
    ) {
      x = zeroW
    } else {
      x =
        zeroW +
        this.series[i][j] / this.invertedYRatio -
        (this.isReversed ? this.series[i][j] / this.invertedYRatio : 0) * 2
    }

    let endingShapeOpts = {
      barHeight,
      strokeWidth,
      barYPosition,
      x,
      zeroW
    }
    let endingShape = this.barEndingShape(w, endingShapeOpts, this.series, i, j)

    pathTo =
      pathTo +
      graphics.line(endingShape.newX, barYPosition) +
      endingShape.path +
      graphics.line(zeroW, barYPosition + barHeight - strokeWidth) +
      graphics.line(zeroW, barYPosition)

    pathFrom =
      pathFrom +
      graphics.line(zeroW, barYPosition) +
      endingShape.ending_p_from +
      graphics.line(zeroW, barYPosition + barHeight - strokeWidth) +
      graphics.line(zeroW, barYPosition + barHeight - strokeWidth) +
      graphics.line(zeroW, barYPosition)

    if (!w.globals.isXNumeric) {
      y = y + yDivision
    }

    if (this.barOptions.colors.backgroundBarColors.length > 0 && i === 0) {
      if (bc >= this.barOptions.colors.backgroundBarColors.length) {
        bc = 0
      }

      let bcolor = this.barOptions.colors.backgroundBarColors[bc]
      let rect = graphics.drawRect(
        0,
        barYPosition - barHeight * this.visibleI,
        w.globals.gridWidth,
        barHeight * this.seriesLen,
        0,
        bcolor,
        this.barOptions.colors.backgroundBarOpacity
      )
      elSeries.add(rect)
      rect.node.classList.add('apexcharts-backgroundBar')
    }
    return {
      pathTo,
      pathFrom,
      x,
      y,
      barYPosition
    }
  }

  drawColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    pathTo,
    pathFrom,
    barWidth,
    zeroH,
    strokeWidth,
    elSeries
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let i = indexes.i
    let j = indexes.j

    let realIndex = indexes.realIndex
    let bc = indexes.bc

    if (w.globals.isXNumeric) {
      x =
        (w.globals.seriesX[i][j] - w.globals.minX) / this.xRatio - barWidth / 2
    }

    let barXPosition = x + barWidth * this.visibleI

    pathTo = graphics.move(barXPosition, zeroH)

    pathFrom = graphics.move(barXPosition, zeroH)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPathFrom(realIndex, j)
    }

    if (
      typeof this.series[i][j] === 'undefined' ||
      this.series[i][j] === null
    ) {
      y = zeroH
    } else {
      y =
        zeroH -
        this.series[i][j] / this.yRatio[this.yaxisIndex] +
        (this.isReversed
          ? this.series[i][j] / this.yRatio[this.yaxisIndex]
          : 0) *
          2
    }

    let endingShapeOpts = {
      barWidth,
      strokeWidth,
      barXPosition,
      y,
      zeroH
    }
    let endingShape = this.barEndingShape(w, endingShapeOpts, this.series, i, j)

    pathTo =
      pathTo +
      graphics.line(barXPosition, endingShape.newY) +
      endingShape.path +
      graphics.line(barXPosition + barWidth - strokeWidth, zeroH) +
      graphics.line(barXPosition - strokeWidth / 2, zeroH)
    pathFrom =
      pathFrom +
      graphics.line(barXPosition, zeroH) +
      endingShape.ending_p_from +
      graphics.line(barXPosition + barWidth - strokeWidth, zeroH) +
      graphics.line(barXPosition + barWidth - strokeWidth, zeroH) +
      graphics.line(barXPosition - strokeWidth / 2, zeroH)

    if (!w.globals.isXNumeric) {
      x = x + xDivision
    }

    if (this.barOptions.colors.backgroundBarColors.length > 0 && i === 0) {
      if (bc >= this.barOptions.colors.backgroundBarColors.length) {
        bc = 0
      }
      let bcolor = this.barOptions.colors.backgroundBarColors[bc]
      let rect = graphics.drawRect(
        barXPosition - barWidth * this.visibleI,
        0,
        barWidth * this.seriesLen,
        w.globals.gridHeight,
        0,
        bcolor,
        this.barOptions.colors.backgroundBarOpacity
      )
      elSeries.add(rect)
      rect.node.classList.add('apexcharts-backgroundBar')
    }

    return {
      pathTo,
      pathFrom,
      x,
      y,
      barXPosition
    }
  }

  /** getPathFrom is a common function for bars/columns which is used to get previous paths when data changes.
   * @memberof Bar
   * @param {int} realIndex - current iterating i
   * @param {int} j - current iterating series's j index
   * @return {string} pathFrom is the string which will be appended in animations
   **/
  getPathFrom(realIndex, j) {
    let w = this.w
    let pathFrom
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      let gpp = w.globals.previousPaths[pp]

      if (
        gpp.paths.length > 0 &&
        parseInt(gpp.realIndex) === parseInt(realIndex)
      ) {
        if (typeof w.globals.previousPaths[pp].paths[j] !== 'undefined') {
          pathFrom = w.globals.previousPaths[pp].paths[j].d
        }
      }
    }
    return pathFrom
  }

  /** calculateBarDataLabels is used to calculate the positions for the data-labels
   * It also sets the element's data attr for bars and calls drawCalculatedBarDataLabels()
   * @memberof Bar
   * @param {object} {barProps} most of the bar properties used throughout the bar
   * drawing function
   * @return {object} dataLabels node-element which you can append later
   **/
  calculateDataLabelsPos({
    x,
    y,
    i,
    j,
    realIndex,
    series,
    barHeight,
    barWidth,
    visibleSeries,
    renderedPath
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let strokeWidth = Array.isArray(this.strokeWidth)
      ? this.strokeWidth[realIndex]
      : this.strokeWidth

    let bcx = x + parseFloat(barWidth * visibleSeries)
    let bcy = y + parseFloat(barHeight * visibleSeries)

    if (w.globals.isXNumeric && !w.globals.isBarHorizontal) {
      bcx = x + parseFloat(barWidth * (visibleSeries + 1)) - strokeWidth
      bcy = y + parseFloat(barHeight * (visibleSeries + 1)) - strokeWidth
    }

    let dataLabels = null
    let dataLabelsX = x
    let dataLabelsY = y
    let dataLabelsPos = {}
    let dataLabelsConfig = w.config.dataLabels
    let barDataLabelsConfig = this.barOptions.dataLabels

    const offX = dataLabelsConfig.offsetX
    const offY = dataLabelsConfig.offsetY

    let textRects = {
      width: 0,
      height: 0
    }
    if (w.config.dataLabels.enabled) {
      textRects = graphics.getTextRects(
        w.globals.yLabelFormatters[0](w.globals.maxY),
        parseInt(dataLabelsConfig.style.fontSize)
      )
    }

    if (this.isHorizontal) {
      dataLabelsPos = this.calculateBarsDataLabelsPosition({
        x,
        y,
        i,
        j,
        renderedPath,
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
      })
    } else {
      dataLabelsPos = this.calculateColumnsDataLabelsPosition({
        x,
        y,
        i,
        j,
        renderedPath,
        realIndex,
        bcx,
        bcy,
        barHeight,
        barWidth,
        textRects,
        strokeWidth,
        dataLabelsY,
        barDataLabelsConfig,
        offX,
        offY
      })
    }

    renderedPath.attr({
      cy: dataLabelsPos.bcy,
      cx: dataLabelsPos.bcx,
      j: j,
      val: series[i][j],
      barHeight: barHeight,
      barWidth: barWidth
    })

    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: series[i][j],
      i: realIndex,
      j: j,
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

    let dataPointsDividedWidth = w.globals.gridWidth / w.globals.dataPoints
    bcx = bcx - strokeWidth / 2

    if (w.globals.isXNumeric) {
      dataLabelsX = bcx - barWidth / 2 + offX
    } else {
      dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX
    }
    let valIsNegative = this.series[i][j] <= 0

    if (this.isReversed) {
      y = y - barHeight
    }

    switch (barDataLabelsConfig.position) {
      case 'center':
        if (valIsNegative) {
          dataLabelsY = y + barHeight / 2 + textRects.height / 2 + offY
        } else {
          dataLabelsY = y + barHeight / 2 + textRects.height / 2 - offY
        }
        break
      case 'bottom':
        if (valIsNegative) {
          dataLabelsY = y + barHeight + textRects.height + strokeWidth + offY
        } else {
          dataLabelsY =
            y + barHeight - textRects.height / 2 + strokeWidth - offY
        }
        break
      case 'top':
        if (valIsNegative) {
          dataLabelsY = y - textRects.height / 2 - offY
        } else {
          dataLabelsY = y + textRects.height + offY
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
      dataPointsDividedHeight +
      barHeight / 2 +
      textRects.height / 2 +
      offY -
      3

    let valIsNegative = this.series[i][j] <= 0

    if (this.isReversed) {
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

    const dataLabels = new DataLabels(this.ctx)
    const graphics = new Graphics(this.ctx)
    const formatter = dataLabelsConfig.formatter

    let elDataLabelsWrap = null

    const isSeriesNotCollapsed =
      w.globals.collapsedSeriesIndices.indexOf(i) > -1

    if (dataLabelsConfig.enabled && !isSeriesNotCollapsed) {
      elDataLabelsWrap = graphics.group({
        class: 'apexcharts-data-labels'
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

      if (
        w.config.chart.stacked &&
        this.barOptions.dataLabels.hideOverflowingLabels
      ) {
        // if there is not enough space to draw the label in the bar/column rect, check hideOverflowingLabels property to prevent overflowing on wrong rect
        // Note: This issue is only seen in stacked charts
        if (this.isHorizontal) {
          barWidth = this.series[i][j] / this.yRatio[this.yaxisIndex]

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
          barHeight = this.series[i][j] / this.yRatio[this.yaxisIndex]
          if (textRects.height / 1.6 > barHeight) {
            text = ''
          }
        }
      }

      let modifiedDataLabelsConfig = {
        ...dataLabelsConfig
      }
      if (this.isHorizontal) {
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

  /** barEndingShape draws the various shapes on top of bars/columns
   * @memberof Bar
   * @param {object} w - chart context
   * @param {object} opts - consists several properties like barHeight/barWidth
   * @param {array} series - global primary series
   * @param {int} i - current iterating series's index
   * @param {int} j - series's j of i
   * @return {object} path - ending shape whether round/arrow
   *         ending_p_from - similar to pathFrom
   *         newY - which is calculated from existing y and new shape's top
   **/

  barEndingShape(w, opts, series, i, j) {
    let graphics = new Graphics(this.ctx)

    if (this.isHorizontal) {
      let endingShape = null
      let endingShapeFrom = ''
      let x = opts.x

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = series[i][j] < 0
        let eX = opts.barHeight / 2 - opts.strokeWidth
        if (inverse) eX = -opts.barHeight / 2 - opts.strokeWidth

        if (!w.config.chart.stacked) {
          if (this.barOptions.endingShape === 'rounded') {
            x = opts.x - eX / 2
          }
        }

        switch (this.barOptions.endingShape) {
          case 'flat':
            endingShape = graphics.line(
              x,
              opts.barYPosition + opts.barHeight - opts.strokeWidth
            )
            break

          case 'rounded':
            endingShape = graphics.quadraticCurve(
              x + eX,
              opts.barYPosition + (opts.barHeight - opts.strokeWidth) / 2,
              x,
              opts.barYPosition + opts.barHeight - opts.strokeWidth
            )
            break
        }
      }
      return {
        path: endingShape,
        ending_p_from: endingShapeFrom,
        newX: x
      }
    } else {
      let endingShape = null
      let endingShapeFrom = ''
      let y = opts.y

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = series[i][j] < 0

        let eY = opts.barWidth / 2 - opts.strokeWidth

        if (inverse) eY = -opts.barWidth / 2 - opts.strokeWidth

        if (!w.config.chart.stacked) {
          // the shape exceeds the chart height, hence reduce y
          if (this.barOptions.endingShape === 'rounded') {
            y = y + eY / 2
          }
        }

        switch (this.barOptions.endingShape) {
          case 'flat':
            endingShape = graphics.line(
              opts.barXPosition + opts.barWidth - opts.strokeWidth,
              y
            )
            break

          case 'rounded':
            endingShape = graphics.quadraticCurve(
              opts.barXPosition + (opts.barWidth - opts.strokeWidth) / 2,
              y - eY,
              opts.barXPosition + opts.barWidth - opts.strokeWidth,
              y
            )
            break
        }
      }

      return {
        path: endingShape,
        ending_p_from: endingShapeFrom,
        newY: y
      }
    }
  }
}

export default Bar
