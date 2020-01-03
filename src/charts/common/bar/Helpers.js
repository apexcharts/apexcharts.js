import Fill from '../../../modules/Fill'
import Graphics from '../../../modules/Graphics'

export default class Helpers {
  constructor(barCtx) {
    this.w = barCtx.w
    this.barCtx = barCtx
  }

  initVariables(series) {
    const w = this.w
    this.barCtx.series = series
    this.barCtx.totalItems = 0
    this.barCtx.seriesLen = 0
    this.barCtx.visibleI = -1
    this.barCtx.visibleItems = 1 // number of visible bars after user zoomed in/out

    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.barCtx.seriesLen = this.barCtx.seriesLen + 1
        this.barCtx.totalItems += series[sl].length
      }
      if (w.globals.isXNumeric) {
        // get max visible items
        for (let j = 0; j < series[sl].length; j++) {
          if (
            w.globals.seriesX[sl][j] > w.globals.minX &&
            w.globals.seriesX[sl][j] < w.globals.maxX
          ) {
            this.barCtx.visibleItems++
          }
        }
      } else {
        this.barCtx.visibleItems = w.globals.dataPoints
      }
    }

    if (this.barCtx.seriesLen === 0) {
      // A small adjustment when combo charts are used
      this.barCtx.seriesLen = 1
    }
  }

  initialPositions() {
    let w = this.w
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW

    let dataPoints = w.globals.dataPoints
    if (this.barCtx.isTimelineBar) {
      // timeline rangebar chart
      dataPoints = w.globals.labels.length
    }

    if (this.barCtx.isHorizontal) {
      // height divided into equal parts
      yDivision = w.globals.gridHeight / dataPoints
      barHeight = yDivision / this.barCtx.seriesLen

      if (w.globals.isXNumeric) {
        yDivision = w.globals.gridHeight / this.barCtx.totalItems
        barHeight = yDivision / this.barCtx.seriesLen
      }

      barHeight =
        (barHeight * parseInt(this.barCtx.barOptions.barHeight, 10)) / 100

      zeroW =
        this.barCtx.baseLineInvertedY +
        w.globals.padHorizontal +
        (this.barCtx.isReversed ? w.globals.gridWidth : 0) -
        (this.barCtx.isReversed ? this.barCtx.baseLineInvertedY * 2 : 0)

      y = (yDivision - barHeight * this.barCtx.seriesLen) / 2
    } else {
      // width divided into equal parts
      xDivision = w.globals.gridWidth / this.barCtx.visibleItems
      barWidth =
        ((xDivision / this.barCtx.seriesLen) *
          parseInt(this.barCtx.barOptions.columnWidth, 10)) /
        100

      if (w.globals.isXNumeric) {
        // max barwidth should be equal to minXDiff to avoid overlap
        if (w.globals.minXDiff && w.globals.minXDiff / this.barCtx.xRatio > 0) {
          xDivision = w.globals.minXDiff / this.barCtx.xRatio
        }
        barWidth =
          ((xDivision / this.barCtx.seriesLen) *
            parseInt(this.barCtx.barOptions.columnWidth, 10)) /
          100

        if (barWidth < 1) {
          barWidth = 1
        }
      }

      zeroH =
        w.globals.gridHeight -
        this.barCtx.baseLineY[this.barCtx.yaxisIndex] -
        (this.barCtx.isReversed ? w.globals.gridHeight : 0) +
        (this.barCtx.isReversed
          ? this.barCtx.baseLineY[this.barCtx.yaxisIndex] * 2
          : 0)

      x =
        w.globals.padHorizontal +
        (xDivision - barWidth * this.barCtx.seriesLen) / 2
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

  getPathFillColor(series, i, j, realIndex) {
    const w = this.w
    let fill = new Fill(this.barCtx.ctx)

    let fillColor = null
    let seriesNumber = this.barCtx.barOptions.distributed ? j : i

    if (this.barCtx.barOptions.colors.ranges.length > 0) {
      const colorRange = this.barCtx.barOptions.colors.ranges
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
      seriesNumber: this.barCtx.barOptions.distributed
        ? seriesNumber
        : realIndex,
      color: fillColor,
      value: series[i][j]
    })

    return pathFill
  }

  getStrokeWidth(i, j, realIndex) {
    let strokeWidth = 0
    const w = this.w

    if (
      typeof this.barCtx.series[i][j] === 'undefined' ||
      this.barCtx.series[i][j] === null
    ) {
      this.barCtx.isNullValue = true
    } else {
      this.barCtx.isNullValue = false
    }
    if (w.config.stroke.show) {
      if (!this.barCtx.isNullValue) {
        strokeWidth = Array.isArray(this.barCtx.strokeWidth)
          ? this.barCtx.strokeWidth[realIndex]
          : this.barCtx.strokeWidth
      }
    }
    return strokeWidth
  }

  /** getBarEndingShape draws the various shapes on top of bars/columns
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
  getBarEndingShape(w, opts, series, i, j) {
    let graphics = new Graphics(this.barCtx.ctx)

    if (this.barCtx.isHorizontal) {
      let endingShape = null
      let endingShapeFrom = ''
      let x = opts.x

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = series[i][j] < 0
        let eX = opts.barHeight / 2 - opts.strokeWidth
        if (inverse) eX = -opts.barHeight / 2 - opts.strokeWidth

        if (!w.config.chart.stacked) {
          if (this.barCtx.barOptions.endingShape === 'rounded') {
            x = opts.x - eX / 2
          }
        }

        switch (this.barCtx.barOptions.endingShape) {
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
          if (this.barCtx.barOptions.endingShape === 'rounded') {
            y = y + eY / 2
          }
        }

        switch (this.barCtx.barOptions.endingShape) {
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
