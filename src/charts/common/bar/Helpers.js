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
    this.barCtx.zeroSerieses = []
    this.barCtx.radiusOnSeriesNumber = series.length - 1 // which series to draw ending shape on

    if (!w.globals.comboCharts) {
      this.checkZeroSeries({ series })
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
    if (!strokeWidth || series[i][j] === 0) strokeWidth = 0
    if (series[i][j] === 0) barWidth = 0

    let shapeOpts = {
      barWidth,
      strokeWidth,
      yRatio,
      barXPosition,
      y1,
      y2
    }
    let newPath = this.getRoundedBars(w, shapeOpts, series, i, j)
    const x1 = barXPosition
    const x2 = barXPosition + barWidth

    let pathTo = graphics.move(x1, newPath.y1)
    let pathFrom = graphics.move(x1, newPath.y1)

    const sl = graphics.line(x2 - strokeWidth, newPath.y1)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    pathTo =
      pathTo +
      graphics.line(x1, newPath.y2) +
      newPath.startingShape +
      graphics.line(x2 - strokeWidth, newPath.y2) +
      sl +
      newPath.endingShape +
      'z'

    pathFrom =
      pathFrom +
      graphics.line(x1, newPath.y1) +
      sl +
      sl +
      sl +
      sl +
      sl +
      graphics.line(x1, newPath.y1)

    if (w.config.chart.stacked) {
      this.barCtx.yArrj.push(newPath.y2)
      this.barCtx.yArrjF.push(Math.abs(y1 - newPath.y2))
      this.barCtx.yArrjVal.push(this.barCtx.series[i][j])
    }

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
    if (!strokeWidth || series[i][j]) strokeWidth = 0
    if (series[i][j] === 0) barHeight = 0

    let shapeOpts = {
      barHeight,
      strokeWidth,
      barYPosition,
      x2,
      x1
    }

    let newPath = this.getRoundedBars(w, shapeOpts, series, i, j)
    let pathTo = graphics.move(newPath.x1, barYPosition)
    let pathFrom = graphics.move(newPath.x1, barYPosition)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    const y1 = barYPosition
    const y2 = barYPosition + barHeight

    const sl = graphics.line(newPath.x1, y2 - strokeWidth)
    pathTo =
      pathTo +
      graphics.line(newPath.x2, y1) +
      newPath.startingShape +
      graphics.line(newPath.x2, y2 - strokeWidth) +
      sl +
      sl +
      newPath.endingShape +
      'z'

    pathFrom =
      pathFrom +
      graphics.line(newPath.x1, y1) +
      sl +
      sl +
      sl +
      sl +
      sl +
      graphics.line(newPath.x1, y1)

    if (w.config.chart.stacked) {
      this.barCtx.xArrj.push(newPath.x2)
      this.barCtx.xArrjF.push(Math.abs(newPath.x1 - newPath.x2))
      this.barCtx.xArrjVal.push(this.barCtx.series[i][j])
    }
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
   * @return {object} pathWithRadius - ending shape path string
   *         newY/newX - which is calculated from existing x/y based on rounded border
   **/

  getRoundedBars(w, opts, series, i, j) {
    let graphics = new Graphics(this.barCtx.ctx)
    let radius = 0

    const borderRadius = w.config.plotOptions.bar.borderRadius
    const borderRadiusIsArray = Array.isArray(borderRadius)
    if (borderRadiusIsArray) {
      const radiusIndex =
        i > borderRadius.length - 1 ? borderRadius.length - 1 : i
      radius = borderRadius[radiusIndex]
    } else {
      radius = borderRadius
    }

    // if (
    //   w.config.chart.stacked &&
    //   series.length > 1 &&
    //   i !== this.barCtx.radiusOnSeriesNumber &&
    //   !borderRadiusIsArray
    // ) {
    //   radius = 0
    // }

    if (this.barCtx.isHorizontal) {
      let startingShape = ''
      let endingShape = ''
      let startingShapeRadius = radius
      let endingShapeRadius = radius
      let x1 = opts.x1
      let x2 = opts.x2

      if (Math.abs(opts.x1 - opts.x2) < radius) {
        radius = Math.abs(opts.x1 - opts.x2)
      }

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = this.barCtx.isReversed
          ? series[i][j] > 0
          : series[i][j] < 0

        if (inverse) radius = radius * -1

        // Assign radius value to starting & ending radius variables
        startingShapeRadius = endingShapeRadius = radius

        if (this.barCtx.barOptions.startingShape === 'flat') {
          startingShapeRadius = 0
        }
        if (this.barCtx.barOptions.endingShape === 'flat') {
          endingShapeRadius = 0
        }
        if (
          this.barCtx.barOptions.startingShape === 'flat' &&
          this.barCtx.barOptions.endingShape === 'flat'
        ) {
          radius = 0
        }

        if (w.config.chart.stacked && series.length > 1 && i !== 0) {
          if (
            this.barCtx.barOptions.endingShape === 'flat' ||
            this.barCtx.barOptions.startingShape === 'flat'
          ) {
            x1 = x1 + radius
          } else {
            x1 = x1 + endingShapeRadius * 2
          }
        } else {
          x1 = x1 + endingShapeRadius
          x2 = x2 - startingShapeRadius
        }

        startingShape =
          graphics.quadraticCurve(
            x2 + startingShapeRadius,
            opts.barYPosition,
            x2 + startingShapeRadius,
            opts.barYPosition +
              (!inverse ? startingShapeRadius : startingShapeRadius * -1)
          ) +
          graphics.line(
            x2 + startingShapeRadius,
            opts.barYPosition +
              opts.barHeight -
              opts.strokeWidth -
              (!inverse ? startingShapeRadius : startingShapeRadius * -1)
          ) +
          graphics.quadraticCurve(
            x2 + startingShapeRadius,
            opts.barYPosition + opts.barHeight - opts.strokeWidth,
            x2,
            opts.barYPosition + opts.barHeight - opts.strokeWidth
          )

        endingShape =
          graphics.quadraticCurve(
            x1 - endingShapeRadius,
            opts.barYPosition + opts.barHeight - opts.strokeWidth,
            x1 - endingShapeRadius,
            opts.barYPosition +
              opts.barHeight -
              opts.strokeWidth -
              (!inverse ? endingShapeRadius : endingShapeRadius * -1)
          ) +
          graphics.line(
            x1 - endingShapeRadius,
            opts.barYPosition +
              (!inverse ? endingShapeRadius : endingShapeRadius * -1)
          ) +
          graphics.quadraticCurve(
            x1 - endingShapeRadius,
            opts.barYPosition,
            x1,
            opts.barYPosition
          )
      }

      return {
        startingShape,
        endingShape,
        x1,
        x2
      }
    } else {
      let startingShape = ''
      let endingShape = ''
      let startingShapeRadius = radius
      let endingShapeRadius = radius
      let y2 = opts.y2
      let y1 = opts.y1

      if (Math.abs(opts.y1 - opts.y2) < radius) {
        radius = Math.abs(opts.y1 - opts.y2)
      }

      if (typeof series[i][j] !== 'undefined' || series[i][j] !== null) {
        let inverse = series[i][j] < 0

        if (inverse) {
          radius = radius * -1
        }

        // Assign radius value to starting & ending radius variables
        startingShapeRadius = endingShapeRadius = radius

        if (this.barCtx.barOptions.startingShape === 'flat') {
          startingShapeRadius = 0
        }
        if (this.barCtx.barOptions.endingShape === 'flat') {
          endingShapeRadius = 0
        }
        if (
          this.barCtx.barOptions.startingShape === 'flat' &&
          this.barCtx.barOptions.endingShape === 'flat'
        ) {
          radius = 0
        }

        if (w.config.chart.stacked && series.length > 1 && i !== 0) {
          if (
            this.barCtx.barOptions.endingShape === 'flat' ||
            this.barCtx.barOptions.startingShape === 'flat'
          ) {
            y1 = y1 - radius
          } else {
            y1 = y1 - endingShapeRadius * 2
          }
        } else {
          y1 = y1 - endingShapeRadius
          y2 = y2 + startingShapeRadius
        }

        startingShape =
          graphics.quadraticCurve(
            opts.barXPosition,
            y2 - startingShapeRadius,
            opts.barXPosition +
              (!inverse ? startingShapeRadius : startingShapeRadius * -1),
            y2 - startingShapeRadius
          ) +
          graphics.line(
            opts.barXPosition +
              opts.barWidth -
              opts.strokeWidth -
              (!inverse ? startingShapeRadius : startingShapeRadius * -1),
            y2 - startingShapeRadius
          ) +
          graphics.quadraticCurve(
            opts.barXPosition + opts.barWidth - opts.strokeWidth,
            y2 - startingShapeRadius,
            opts.barXPosition + opts.barWidth - opts.strokeWidth,
            y2
          )

        endingShape =
          graphics.quadraticCurve(
            opts.barXPosition + opts.barWidth - opts.strokeWidth,
            y1 + endingShapeRadius,
            opts.barXPosition +
              opts.barWidth -
              opts.strokeWidth -
              (!inverse ? endingShapeRadius : endingShapeRadius * -1),
            y1 + endingShapeRadius
          ) +
          graphics.line(
            opts.barXPosition +
              (!inverse ? endingShapeRadius : endingShapeRadius * -1),
            y1 + endingShapeRadius
          ) +
          graphics.quadraticCurve(
            opts.barXPosition,
            y1 + endingShapeRadius,
            opts.barXPosition,
            y1
          )
      }

      return {
        startingShape,
        endingShape,
        y1,
        y2
      }
    }
  }

  checkZeroSeries({ series }) {
    let w = this.w
    for (let zs = 0; zs < series.length; zs++) {
      let total = 0
      for (
        let zsj = 0;
        zsj < series[w.globals.maxValsInArrayIndex].length;
        zsj++
      ) {
        total += series[zs][zsj]
      }
      if (total === 0) {
        this.barCtx.zeroSerieses.push(zs)
      }
    }

    // After getting all zeroserieses, we need to ensure whether radiusOnSeriesNumber is not in that zeroseries array
    for (let s = series.length - 1; s >= 0; s--) {
      if (
        this.barCtx.zeroSerieses.indexOf(s) > -1 &&
        s === this.radiusOnSeriesNumber
      ) {
        this.barCtx.radiusOnSeriesNumber -= 1
      }
    }

    for (let s = series.length - 1; s >= 0; s--) {
      if (
        w.globals.collapsedSeriesIndices.indexOf(
          this.barCtx.radiusOnSeriesNumber
        ) > -1
      ) {
        this.barCtx.radiusOnSeriesNumber -= 1
      }
    }
  }

  getXForValue(value, zeroW, zeroPositionForNull = true) {
    let xForVal = zeroPositionForNull ? zeroW : null
    if (typeof value !== 'undefined' && value !== null) {
      xForVal =
        zeroW +
        value / this.barCtx.invertedYRatio -
        (this.barCtx.isReversed ? value / this.barCtx.invertedYRatio : 0) * 2
    }
    return xForVal
  }

  getYForValue(value, zeroH, zeroPositionForNull = true) {
    let yForVal = zeroPositionForNull ? zeroH : null
    if (typeof value !== 'undefined' && value !== null) {
      yForVal =
        zeroH -
        value / this.barCtx.yRatio[this.barCtx.yaxisIndex] +
        (this.barCtx.isReversed
          ? value / this.barCtx.yRatio[this.barCtx.yaxisIndex]
          : 0) *
          2
    }
    return yForVal
  }

  getGoalValues(type, zeroW, zeroH, i, j) {
    const w = this.w

    let goals = []
    if (
      w.globals.seriesGoals[i] &&
      w.globals.seriesGoals[i][j] &&
      Array.isArray(w.globals.seriesGoals[i][j])
    ) {
      w.globals.seriesGoals[i][j].forEach((goal) => {
        goals.push({
          [type]:
            type === 'x'
              ? this.getXForValue(goal.value, zeroW, false)
              : this.getYForValue(goal.value, zeroH, false),
          attrs: goal
        })
      })
    }
    return goals
  }

  drawGoalLine({
    barXPosition,
    barYPosition,
    goalX,
    goalY,
    barWidth,
    barHeight
  }) {
    let graphics = new Graphics(this.barCtx.ctx)
    const lineGroup = graphics.group({
      className: 'apexcharts-bar-goals-groups'
    })

    let line = null
    if (this.barCtx.isHorizontal) {
      if (Array.isArray(goalX)) {
        goalX.forEach((goal) => {
          let sHeight =
            typeof goal.attrs.strokeHeight !== 'undefined'
              ? goal.attrs.strokeHeight
              : barHeight / 2
          let y = barYPosition + sHeight + barHeight / 2

          line = graphics.drawLine(
            goal.x,
            y - sHeight * 2,
            goal.x,
            y,
            goal.attrs.strokeColor ? goal.attrs.strokeColor : undefined,
            goal.attrs.strokeDashArray,
            goal.attrs.strokeWidth ? goal.attrs.strokeWidth : 2,
            goal.attrs.strokeLineCap
          )
          lineGroup.add(line)
        })
      }
    } else {
      if (Array.isArray(goalY)) {
        goalY.forEach((goal) => {
          let sWidth =
            typeof goal.attrs.strokeWidth !== 'undefined'
              ? goal.attrs.strokeWidth
              : barWidth / 2
          let x = barXPosition + sWidth + barWidth / 2

          line = graphics.drawLine(
            x - sWidth * 2,
            goal.y,
            x,
            goal.y,
            goal.attrs.strokeColor ? goal.attrs.strokeColor : undefined,
            goal.attrs.strokeDashArray,
            goal.attrs.strokeHeight ? goal.attrs.strokeHeight : 2,
            goal.attrs.strokeLineCap
          )
          lineGroup.add(line)
        })
      }
    }

    return lineGroup
  }
}
