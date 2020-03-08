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
    this.barCtx.visibleI = -1 // visible Series
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
      if (w.config.xaxis.convertedCatToNumeric) {
        xDivision = w.globals.gridWidth / w.globals.dataPoints
      }
      barWidth =
        ((xDivision / this.barCtx.seriesLen) *
          parseInt(this.barCtx.barOptions.columnWidth, 10)) /
        100

      if (w.globals.isXNumeric) {
        // max barwidth should be equal to minXDiff to avoid overlap
        let xRatio = this.barCtx.xRatio
        if (w.config.xaxis.convertedCatToNumeric) {
          xRatio = this.barCtx.initialXRatio
        }
        if (w.globals.minXDiff && w.globals.minXDiff / xRatio > 0) {
          xDivision = w.globals.minXDiff / xRatio
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
      dataPointIndex: j,
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

  barBackground({ bc, i, y1, y2, elSeries }) {
    const w = this.w
    const graphics = new Graphics(this.barCtx.ctx)

    if (
      this.barCtx.barOptions.colors.backgroundBarColors.length > 0 &&
      i === 0
    ) {
      if (bc >= this.barCtx.barOptions.colors.backgroundBarColors.length) {
        bc = 0
      }

      let bcolor = this.barCtx.barOptions.colors.backgroundBarColors[bc]
      let rect = graphics.drawRect(
        0,
        y1,
        w.globals.gridWidth,
        y2,
        0,
        bcolor,
        this.barCtx.barOptions.colors.backgroundBarOpacity
      )
      elSeries.add(rect)
      rect.node.classList.add('apexcharts-backgroundBar')
    }
  }

  getColumnPaths({
    barWidth,
    barXPosition,
    yRatio,
    y1,
    y2,
    strokeWidth,
    series,
    i,
    j,
    w
  }) {
    const graphics = new Graphics(this.barCtx.ctx)

    let roundedShapeOpts = {
      barWidth,
      strokeWidth,
      yRatio,
      barXPosition,
      y1,
      y2
    }
    let roundedShape = this.getRoundedBars(w, roundedShapeOpts, series, i, j)

    const x1 = barXPosition
    const x2 = barXPosition + barWidth

    let pathTo = graphics.move(x1, roundedShape.y1)
    let pathFrom = graphics.move(x1, roundedShape.y1)

    pathTo =
      pathTo +
      graphics.line(x1, roundedShape.y2) +
      roundedShape.endingPath +
      graphics.line(x2 - strokeWidth, roundedShape.y2) +
      graphics.line(x2 - strokeWidth, roundedShape.y1) +
      roundedShape.startingPath

    pathFrom =
      pathFrom +
      graphics.line(x1, y1) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(x1 - strokeWidth / 2, y1)

    return {
      pathTo,
      pathFrom
    }
  }

  getBarpaths({
    barYPosition,
    barHeight,
    x1,
    x2,
    strokeWidth,
    series,
    i,
    j,
    w
  }) {
    const graphics = new Graphics(this.barCtx.ctx)

    let roundedShapeOpts = {
      barHeight,
      strokeWidth,
      barYPosition,
      x2,
      x1
    }

    let roundedShape = this.getRoundedBars(w, roundedShapeOpts, series, i, j)

    let pathTo = graphics.move(roundedShape.x1, barYPosition)
    let pathFrom = graphics.move(roundedShape.x1, barYPosition)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(i, j, false)
    }

    const y1 = barYPosition
    const y2 = barYPosition + barHeight

    pathTo =
      pathTo +
      graphics.line(roundedShape.x2, y1) +
      roundedShape.endingPath +
      graphics.line(roundedShape.x2, y2 - strokeWidth) +
      graphics.line(roundedShape.x1, y2 - strokeWidth) +
      roundedShape.startingPath

    pathFrom =
      pathFrom +
      graphics.line(x1, y1) +
      graphics.line(x1, y2 - strokeWidth) +
      graphics.line(x1, y2 - strokeWidth) +
      graphics.line(x1, y2 - strokeWidth) +
      graphics.line(x1, y1)

    return {
      pathTo,
      pathFrom
    }
  }

  /** getRoundedBars draws border radius for bars/columns
   * @memberof Bar
   * @param {object} w - chart context
   * @param {object} opts - consists several properties like barHeight/barWidth
   * @param {array} series - global primary series
   * @param {int} i - current iterating series's index
   * @param {int} j - series's j of i
   * @return {object} endingPath - ending shape path string
   *         startingPath - starting shape path string
   *         newY/newX - which is calculated from existing x/y based on rounded border
   **/
  getRoundedBars(w, opts, series, i, j) {
    let graphics = new Graphics(this.barCtx.ctx)

    if (this.barCtx.isHorizontal) {
      let endingShape = null
      let startingShape = ''
      let x2 = opts.x2
      let x1 = opts.x1

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = series[i][j] < 0
        let eX = opts.barHeight / 2 - opts.strokeWidth
        if (inverse) eX = -opts.barHeight / 2 - opts.strokeWidth

        if (eX > Math.abs(x2 - x1)) {
          eX = Math.abs(x2 - x1)
        }

        if (this.barCtx.barOptions.endingShape === 'rounded') {
          x2 = opts.x2 - eX / 2
        }
        if (this.barCtx.barOptions.startingShape === 'rounded') {
          x1 = opts.x1 + eX / 2
        }

        switch (this.barCtx.barOptions.endingShape) {
          case 'flat':
            endingShape = graphics.line(
              x2,
              opts.barYPosition + opts.barHeight - opts.strokeWidth
            )
            break

          case 'rounded':
            endingShape = graphics.quadraticCurve(
              x2 + eX,
              opts.barYPosition + (opts.barHeight - opts.strokeWidth) / 2,
              x2,
              opts.barYPosition + opts.barHeight - opts.strokeWidth
            )
            break
        }
        switch (this.barCtx.barOptions.startingShape) {
          case 'flat':
            startingShape = graphics.line(
              x1,
              opts.barYPosition + opts.barHeight - opts.strokeWidth
            )
            break

          case 'rounded':
            startingShape = graphics.quadraticCurve(
              x1 - eX,
              opts.barYPosition + opts.barHeight / 2,
              x1,
              opts.barYPosition
            )
            break
        }
      }
      return {
        endingPath: endingShape,
        startingPath: startingShape,
        x2,
        x1
      }
    } else {
      let endingShape = null
      let startingShape = ''
      let y2 = opts.y2
      let y1 = opts.y1

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = series[i][j] < 0

        let eY = opts.barWidth / 2 - opts.strokeWidth

        if (inverse) eY = -opts.barWidth / 2 - opts.strokeWidth
        if (eY > Math.abs(y2 - y1)) {
          eY = Math.abs(y2 - y1)
        }

        if (this.barCtx.barOptions.endingShape === 'rounded') {
          // the shape exceeds the chart height, hence reduce y
          y2 = y2 + eY / 2
        }
        if (this.barCtx.barOptions.startingShape === 'rounded') {
          y1 = y1 - eY / 2
        }

        switch (this.barCtx.barOptions.endingShape) {
          case 'flat':
            endingShape = graphics.line(
              opts.barXPosition + opts.barWidth - opts.strokeWidth,
              y2
            )
            break

          case 'rounded':
            endingShape = graphics.quadraticCurve(
              opts.barXPosition + (opts.barWidth - opts.strokeWidth) / 2,
              y2 - eY,
              opts.barXPosition + opts.barWidth - opts.strokeWidth,
              y2
            )
            break
        }

        switch (this.barCtx.barOptions.startingShape) {
          case 'flat':
            startingShape = graphics.line(
              opts.barXPosition + opts.barWidth - opts.strokeWidth,
              y1
            )
            break

          case 'rounded':
            startingShape = graphics.quadraticCurve(
              opts.barXPosition + (opts.barWidth - opts.strokeWidth) / 2,
              y1 + eY,
              opts.barXPosition,
              y1
            )
            break
        }
      }

      return {
        endingPath: endingShape,
        startingPath: startingShape,
        y2,
        y1
      }
    }
  }
}
