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

    if (!w.globals.comboCharts) {
      this.checkZeroSeries({ series })
    }
  }

  initialPositions() {
    let w = this.w
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW

    let dataPoints = w.globals.dataPoints
    if (this.barCtx.isRangeBar) {
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

  initializeStackedPrevVars(ctx) {
    const w = ctx.w
    if (w.globals.hasSeriesGroups) {
      w.globals.seriesGroups.forEach((group) => {
        if (!ctx[group]) ctx[group] = {}

        ctx[group].prevY = []
        ctx[group].prevX = []
        ctx[group].prevYF = []
        ctx[group].prevXF = []
        ctx[group].prevYVal = []
        ctx[group].prevXVal = []
      })
    } else {
      ctx.prevY = [] // y position on chart (in columns)
      ctx.prevX = [] // x position on chart (in horz bars)
      ctx.prevYF = [] // starting y and ending y (height) in columns
      ctx.prevXF = [] // starting x and ending x (width) in bars
      ctx.prevYVal = [] // y values (series[i][j]) in columns
      ctx.prevXVal = [] // x values (series[i][j]) in bars
    }
  }

  initializeStackedXYVars(ctx) {
    const w = ctx.w

    if (w.globals.hasSeriesGroups) {
      w.globals.seriesGroups.forEach((group) => {
        if (!ctx[group]) ctx[group] = {}

        ctx[group].xArrj = []
        ctx[group].xArrjF = []
        ctx[group].xArrjVal = []
        ctx[group].yArrj = []
        ctx[group].yArrjF = []
        ctx[group].yArrjVal = []
      })
    } else {
      ctx.xArrj = [] // xj indicates x position on graph in bars
      ctx.xArrjF = [] // xjF indicates bar's x position + x2 positions in bars
      ctx.xArrjVal = [] // x val means the actual series's y values in horizontal/bars
      ctx.yArrj = [] // yj indicates y position on graph in columns
      ctx.yArrjF = [] // yjF indicates bar's y position + y2 positions in columns
      ctx.yArrjVal = [] // y val means the actual series's y values in columns
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
      value: series[i][j],
      fillConfig: w.config.series[i].data[j]?.fill,
      fillType: w.config.series[i].data[j]?.fill?.type
        ? w.config.series[i].data[j]?.fill.type
        : w.config.fill.type
    })

    return pathFill
  }

  getStrokeWidth(i, j, realIndex) {
    let strokeWidth = 0
    const w = this.w

    if (!this.barCtx.series[i][j]) {
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

  shouldApplyRadius(realIndex) {
    const w = this.w
    let applyRadius = false

    if (w.config.plotOptions.bar.borderRadius > 0) {
      if (w.config.chart.stacked) {
        if (w.config.plotOptions.bar.borderRadiusWhenStacked === 'last') {
          if (this.barCtx.lastActiveBarSerieIndex === realIndex) {
            applyRadius = true
          }
        } else {
          applyRadius = true
        }
      } else {
        applyRadius = true
      }
    }
    return applyRadius
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
        j %= this.barCtx.barOptions.colors.backgroundBarColors.length
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
    y1,
    y2,
    strokeWidth,
    seriesGroup,
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

    let bW = barWidth
    let bXP = barXPosition

    if (w.config.series[realIndex].data[j]?.columnWidthOffset) {
      bXP =
        barXPosition - w.config.series[realIndex].data[j].columnWidthOffset / 2
      bW = barWidth + w.config.series[realIndex].data[j].columnWidthOffset
    }

    const x1 = bXP
    const x2 = bXP + bW

    // append tiny pixels to avoid exponentials (which cause issues in border-radius)
    y1 += 0.001
    y2 += 0.001

    let pathTo = graphics.move(x1, y1)
    let pathFrom = graphics.move(x1, y1)

    const sl = graphics.line(x2 - strokeWidth, y1)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    pathTo =
      pathTo +
      graphics.line(x1, y2) +
      graphics.line(x2 - strokeWidth, y2) +
      graphics.line(x2 - strokeWidth, y1) +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around'
        ? ' Z'
        : ' z')

    // the lines in pathFrom are repeated to equal it to the points of pathTo
    // this is to avoid weird animation (bug in svg.js)
    pathFrom =
      pathFrom +
      graphics.line(x1, y1) +
      sl +
      sl +
      sl +
      sl +
      sl +
      graphics.line(x1, y1) +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around'
        ? ' Z'
        : ' z')

    if (this.shouldApplyRadius(realIndex)) {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      )
    }

    if (w.config.chart.stacked) {
      let _ctx = this.barCtx
      if (w.globals.hasSeriesGroups && seriesGroup) {
        _ctx = this.barCtx[seriesGroup]
      }
      _ctx.yArrj.push(y2)
      _ctx.yArrjF.push(Math.abs(y1 - y2))
      _ctx.yArrjVal.push(this.barCtx.series[i][j])
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
    seriesGroup,
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

    let bYP = barYPosition
    let bH = barHeight

    if (w.config.series[realIndex].data[j]?.barHeightOffset) {
      bYP =
        barYPosition - w.config.series[realIndex].data[j].barHeightOffset / 2
      bH = barHeight + w.config.series[realIndex].data[j].barHeightOffset
    }

    const y1 = bYP
    const y2 = bYP + bH

    // append tiny pixels to avoid exponentials (which cause issues in border-radius)
    x1 += 0.001
    x2 += 0.001

    let pathTo = graphics.move(x1, y1)
    let pathFrom = graphics.move(x1, y1)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    const sl = graphics.line(x1, y2 - strokeWidth)
    pathTo =
      pathTo +
      graphics.line(x2, y1) +
      graphics.line(x2, y2 - strokeWidth) +
      sl +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around'
        ? ' Z'
        : ' z')

    pathFrom =
      pathFrom +
      graphics.line(x1, y1) +
      sl +
      sl +
      sl +
      sl +
      sl +
      graphics.line(x1, y1) +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around'
        ? ' Z'
        : ' z')

    if (this.shouldApplyRadius(realIndex)) {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      )
    }

    if (w.config.chart.stacked) {
      let _ctx = this.barCtx
      if (w.globals.hasSeriesGroups && seriesGroup) {
        _ctx = this.barCtx[seriesGroup]
      }

      _ctx.xArrj.push(x2)
      _ctx.xArrjF.push(Math.abs(x1 - x2))
      _ctx.xArrjVal.push(this.barCtx.series[i][j])
    }
    return {
      pathTo,
      pathFrom
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
