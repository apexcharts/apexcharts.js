import Fill from '../../../modules/Fill'
import Graphics from '../../../modules/Graphics'
import Series from '../../../modules/Series'

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

    let seriesLen = this.barCtx.seriesLen
    if (w.config.plotOptions.bar.rangeBarGroupRows) {
      seriesLen = 1
    }

    if (this.barCtx.isHorizontal) {
      // height divided into equal parts
      yDivision = w.globals.gridHeight / dataPoints
      barHeight = yDivision / seriesLen

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
        if (
          w.globals.minXDiff &&
          w.globals.minXDiff !== 0.5 &&
          w.globals.minXDiff / xRatio > 0
        ) {
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

  barBackground({ j, i, x1, x2, y1, y2, elSeries }) {
    const w = this.w
    const graphics = new Graphics(this.barCtx.ctx)

    const sr = new Series(this.barCtx.ctx)
    let activeSeriesIndex = sr.getActiveConfigSeriesIndex()

    if (
      this.barCtx.barOptions.colors.backgroundBarColors.length > 0 &&
      activeSeriesIndex === i
    ) {
      if (j >= this.barCtx.barOptions.colors.backgroundBarColors.length) {
        j -= this.barCtx.barOptions.colors.backgroundBarColors.length
      }

      let bcolor = this.barCtx.barOptions.colors.backgroundBarColors[j]
      let rect = graphics.drawRect(
        typeof x1 !== 'undefined' ? x1 : 0,
        typeof y1 !== 'undefined' ? y1 : 0,
        typeof x2 !== 'undefined' ? x2 : w.globals.gridWidth,
        typeof y2 !== 'undefined' ? y2 : w.globals.gridHeight,
        this.barCtx.barOptions.colors.backgroundBarRadius,
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
    realIndex,
    i,
    j,
    w
  }) {
    const graphics = new Graphics(this.barCtx.ctx)
    strokeWidth = Array.isArray(strokeWidth)
      ? strokeWidth[realIndex]
      : strokeWidth
    if (!strokeWidth) strokeWidth = 0

    const x1 = barXPosition
    const x2 = barXPosition + barWidth

    let pathTo = graphics.move(x1, y1)
    let pathFrom = graphics.move(x1, y1)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    pathTo =
      pathTo +
      graphics.line(x1, y2) +
      graphics.line(barXPosition + barWidth - strokeWidth, y2) +
      graphics.line(x2 - strokeWidth, y2) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(barXPosition + barWidth - strokeWidth, y1) +
      'z'

    pathFrom =
      pathFrom +
      graphics.line(x1, y1) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(x2 - strokeWidth, y1) +
      graphics.line(x1, y1)

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
    realIndex,
    i,
    j,
    w
  }) {
    const graphics = new Graphics(this.barCtx.ctx)
    strokeWidth = Array.isArray(strokeWidth)
      ? strokeWidth[realIndex]
      : strokeWidth
    if (!strokeWidth) strokeWidth = 0

    let pathTo = graphics.move(x1, barYPosition)
    let pathFrom = graphics.move(x1, barYPosition)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    const y1 = barYPosition
    const y2 = barYPosition + barHeight

    pathTo =
      pathTo +
      graphics.line(x2, y1) +
      graphics.line(x2, barYPosition + barHeight - strokeWidth) +
      graphics.line(x2, y2 - strokeWidth) +
      graphics.line(x1, y2 - strokeWidth) +
      graphics.line(x1, barYPosition + barHeight - strokeWidth) +
      'z'

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
}
