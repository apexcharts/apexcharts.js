import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Utils from '../utils/Utils'

/**
 * ApexCharts BarStacked Class responsible for drawing both Stacked Columns and Bars.
 *
 * @module BarStacked
 * The whole calculation for stacked bar/column is different from normal bar/column,
 * hence it makes sense to derive a new class for it extending most of the props of Parent Bar
 **/

class BarStacked extends Bar {
  draw(series, seriesIndex) {
    let w = this.w
    this.graphics = new Graphics(this.ctx)
    this.fill = new Fill(this.ctx)
    this.bar = new Bar(this.ctx, this.xyRatios)

    const coreUtils = new CoreUtils(this.ctx, w)
    this.series = coreUtils.getLogSeries(series)
    series = this.series
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    this.series = series

    this.initVariables(series)

    if (w.config.chart.stackType === '100%') {
      this.series = w.globals.seriesPercent.slice()
      series = this.series
    }

    this.totalItems = 0

    this.prevY = [] // y position on chart
    this.prevX = [] // x position on chart
    this.prevYF = [] // y position including shapes on chart
    this.prevXF = [] // x position including shapes on chart
    this.prevYVal = [] // y values (series[i][j]) in columns
    this.prevXVal = [] // x values (series[i][j]) in bars

    this.xArrj = [] // xj indicates x position on graph in bars
    this.xArrjF = [] // xjF indicates bar's x position + endingshape's positions in bars
    this.xArrjVal = [] // x val means the actual series's y values in horizontal/bars
    this.yArrj = [] // yj indicates y position on graph in columns
    this.yArrjF = [] // yjF indicates bar's y position + endingshape's positions in columns
    this.yArrjVal = [] // y val means the actual series's y values in columns

    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.totalItems += series[sl].length
      }
    }

    this.zeroSerieses = []
    this.endingShapeOnSeriesNumber = series.length - 1 // which series to draw ending shape on

    this.checkZeroSeries({ series })

    let ret = this.graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series'
    })

    ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    let x = 0
    let y = 0

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let pathTo, pathFrom
      let xDivision // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
      let yDivision // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
      let zeroH // zeroH is the baseline where 0 meets y axis
      let zeroW // zeroW is the baseline where 0 meets x axis

      let xArrValues = []
      let yArrValues = []

      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i

      if (this.yRatio.length > 1) {
        this.yaxisIndex = realIndex
      }

      // el to which series will be drawn
      let elSeries = this.graphics.group({
        class: `apexcharts-series ${Utils.escapeString(w.globals.seriesNames[realIndex])}`,
        rel: i + 1,
        'data:realIndex': realIndex
      })

      // eldatalabels
      let elDataLabelsWrap = this.graphics.group({
        class: 'apexcharts-datalabels'
      })

      let strokeWidth = 0
      let barHeight = 0
      let barWidth = 0

      let initPositions = this.initialPositions(
        x,
        y,
        xDivision,
        yDivision,
        zeroH,
        zeroW
      )
      y = initPositions.y
      barHeight = initPositions.barHeight
      yDivision = initPositions.yDivision
      zeroW = initPositions.zeroW

      x = initPositions.x
      barWidth = initPositions.barWidth
      xDivision = initPositions.xDivision
      zeroH = initPositions.zeroH

      this.yArrj = []
      this.yArrjF = []
      this.yArrjVal = []
      this.xArrj = []
      this.xArrjF = []
      this.xArrjVal = []

      // if (!this.horizontal) {
      // this.xArrj.push(x + barWidth / 2)
      // }

      for (let j = 0; j < w.globals.dataPoints; j++) {
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
            indexes: { i, j, realIndex, bc },
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
        } else {
          paths = this.drawColumnPaths({
            indexes: { i, j, realIndex, bc },
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
        }

        pathTo = paths.pathTo
        pathFrom = paths.pathFrom
        y = paths.y
        x = paths.x

        xArrValues.push(x)
        yArrValues.push(y)

        let seriesNumber = w.config.plotOptions.bar.distributed ? j : i

        let fillColor = null

        if (this.barOptions.colors.ranges.length > 0) {
          const colorRange = this.barOptions.colors.ranges
          colorRange.map((range, index) => {
            if (series[i][j] >= range.from && series[i][j] <= range.to) {
              fillColor = range.color
            }
          })
        }

        let pathFill = this.fill.fillPath({
          seriesNumber: this.barOptions.distributed ? seriesNumber : realIndex,
          color: fillColor
        })

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
          type: 'bar',
          visibleSeries: 0
        })
      }

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrValues
      w.globals.seriesYvalues[realIndex] = yArrValues

      // push all current y values array to main PrevY Array
      this.prevY.push(this.yArrj)
      this.prevYF.push(this.yArrjF)
      this.prevYVal.push(this.yArrjVal)
      this.prevX.push(this.xArrj)
      this.prevXF.push(this.xArrjF)
      this.prevXVal.push(this.xArrjVal)

      ret.add(elSeries)
    }

    return ret
  }

  initialPositions(x, y, xDivision, yDivision, zeroH, zeroW) {
    let w = this.w

    let barHeight, barWidth
    if (this.isHorizontal) {
      // height divided into equal parts
      yDivision = w.globals.gridHeight / w.globals.dataPoints
      barHeight = yDivision

      barHeight =
        (barHeight * parseInt(w.config.plotOptions.bar.barHeight)) / 100

      zeroW = this.baseLineInvertedY + w.globals.padHorizontal

      // initial y position is half of barHeight * half of number of Bars
      y = (yDivision - barHeight) / 2
    } else {
      // width divided into equal parts
      xDivision = w.globals.gridWidth / w.globals.dataPoints

      barWidth = xDivision

      if (w.globals.isXNumeric) {
        // max barwidth should be equal to minXDiff to avoid overlap
        xDivision = this.minXDiff / this.xRatio
        barWidth =
          ((xDivision / this.seriesLen) *
            parseInt(this.barOptions.columnWidth)) /
          100
      } else {
        barWidth =
          (barWidth * parseInt(w.config.plotOptions.bar.columnWidth)) / 100
      }

      zeroH = this.baseLineY[this.yaxisIndex] + 1

      // initial x position is one third of barWidth
      x = w.globals.padHorizontal + (xDivision - barWidth) / 2
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
    let barYPosition = y
    let barXPosition
    let i = indexes.i
    let j = indexes.j
    let realIndex = indexes.realIndex
    let bc = indexes.bc

    let prevBarW = 0
    for (let k = 0; k < this.prevXF.length; k++) {
      prevBarW = prevBarW + this.prevXF[k][j]
    }

    if (i > 0) {
      let bXP = zeroW

      if (this.prevXVal[i - 1][j] < 0) {
        if (this.series[i][j] >= 0) {
          bXP = this.prevX[i - 1][j] + prevBarW
        } else {
          bXP = this.prevX[i - 1][j]
        }
      } else if (this.prevXVal[i - 1][j] >= 0) {
        if (this.series[i][j] >= 0) {
          bXP = this.prevX[i - 1][j]
        } else {
          bXP = this.prevX[i - 1][j] - prevBarW
        }
      }

      barXPosition = bXP
    } else {
      // the first series will not have prevX values
      barXPosition = zeroW
    }

    if (this.series[i][j] === null) {
      x = barXPosition
    } else {
      x = barXPosition + this.series[i][j] / this.invertedYRatio
    }

    let endingShapeOpts = {
      barHeight,
      strokeWidth,
      invertedYRatio: this.invertedYRatio,
      barYPosition,
      x
    }
    let endingShape = this.bar.barEndingShape(
      w,
      endingShapeOpts,
      this.series,
      i,
      j
    )

    if (this.series.length > 1 && i !== this.endingShapeOnSeriesNumber) {
      // revert back to flat shape if not last series
      endingShape.path = this.graphics.line(
        endingShape.newX,
        barYPosition + barHeight - strokeWidth
      )
    }

    this.xArrj.push(endingShape.newX)
    this.xArrjF.push(Math.abs(barXPosition - endingShape.newX))
    this.xArrjVal.push(this.series[i][j])

    pathTo = this.graphics.move(barXPosition, barYPosition)
    pathFrom = this.graphics.move(barXPosition, barYPosition)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.bar.getPathFrom(realIndex, j, false)
    }

    pathTo =
      pathTo +
      this.graphics.line(endingShape.newX, barYPosition) +
      endingShape.path +
      this.graphics.line(barXPosition, barYPosition + barHeight - strokeWidth) +
      this.graphics.line(barXPosition, barYPosition)
    pathFrom =
      pathFrom +
      this.graphics.line(barXPosition, barYPosition) +
      this.graphics.line(barXPosition, barYPosition + barHeight - strokeWidth) +
      this.graphics.line(barXPosition, barYPosition + barHeight - strokeWidth) +
      this.graphics.line(barXPosition, barYPosition + barHeight - strokeWidth) +
      this.graphics.line(barXPosition, barYPosition)

    if (
      w.config.plotOptions.bar.colors.backgroundBarColors.length > 0 &&
      i === 0
    ) {
      if (bc >= w.config.plotOptions.bar.colors.backgroundBarColors.length) {
        bc = 0
      }

      let bcolor = w.config.plotOptions.bar.colors.backgroundBarColors[bc]
      let rect = this.graphics.drawRect(
        0,
        barYPosition,
        w.globals.gridWidth,
        barHeight,
        0,
        bcolor,
        w.config.plotOptions.bar.colors.backgroundBarOpacity
      )
      elSeries.add(rect)
      rect.node.classList.add('apexcharts-backgroundBar')
    }

    y = y + yDivision

    return {
      pathTo,
      pathFrom,
      x,
      y
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
    let i = indexes.i
    let j = indexes.j
    let realIndex = indexes.realIndex
    let bc = indexes.bc

    if (w.globals.isXNumeric) {
      let seriesVal = w.globals.seriesX[i][j]
      if (!seriesVal) seriesVal = 0
      x = (seriesVal - w.globals.minX) / this.xRatio - barWidth / 2
    }

    let barXPosition = x
    let barYPosition

    let prevBarH = 0
    for (let k = 0; k < this.prevYF.length; k++) {
      prevBarH = prevBarH + this.prevYF[k][j]
    }

    let prevYValue
    // get previous Y of any series for current X if there is one,
    // otherwise we'll fallback to zero later on
    if (i > 0 && w.globals.isXNumeric) {
      w.globals.seriesX.forEach((x, k) => {
        if (k === i || this.prevY[k] == null) return

        x.forEach((y, m) => {
          if (y === w.globals.seriesX[i][j]) {
            prevYValue = this.prevY[k][m]
          }
        })
      })
    }

    if (i > 0 && (!w.globals.isXNumeric || prevYValue != null)) {
      let bYP
      if (prevYValue == null) {
        prevYValue = this.prevY[i - 1][j]
      }

      if (this.prevYVal[i - 1][j] < 0) {
        if (this.series[i][j] >= 0) {
          bYP = prevYValue - prevBarH
        } else {
          bYP = prevYValue
        }
      } else {
        if (this.series[i][j] >= 0) {
          bYP = prevYValue
        } else {
          bYP = prevYValue + prevBarH
        }
      }

      barYPosition = bYP
    } else {
      // the first series will not have prevY values, also if the prev index's series X doesn't matches the current index's series X, then start from zero
      barYPosition = w.globals.gridHeight - zeroH
    }

    if (this.series[i][j] === null) {
      y = barYPosition - this.series[i][j] / this.yRatio[this.yaxisIndex]
    } else {
      y = barYPosition - this.series[i][j] / this.yRatio[this.yaxisIndex]
    }

    let endingShapeOpts = {
      barWidth,
      strokeWidth,
      yRatio: this.yRatio[this.yaxisIndex],
      barXPosition,
      y
    }
    let endingShape = this.bar.barEndingShape(
      w,
      endingShapeOpts,
      this.series,
      i,
      j
    )

    if (this.series.length > 1 && i !== this.endingShapeOnSeriesNumber) {
      /* if(this.zeroSerieses) {} */
      // revert back to flat shape if not last series
      endingShape.path = this.graphics.line(
        barXPosition + barWidth - strokeWidth,
        endingShape.newY
      )
    }

    this.yArrj.push(endingShape.newY)
    this.yArrjF.push(Math.abs(barYPosition - endingShape.newY))
    this.yArrjVal.push(this.series[i][j])

    pathTo = this.graphics.move(barXPosition, barYPosition)
    pathFrom = this.graphics.move(barXPosition, barYPosition)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.bar.getPathFrom(realIndex, j, false)
    }

    pathTo =
      pathTo +
      this.graphics.line(barXPosition, endingShape.newY) +
      endingShape.path +
      this.graphics.line(barXPosition + barWidth - strokeWidth, barYPosition) +
      this.graphics.line(barXPosition, barYPosition)
    pathFrom =
      pathFrom +
      this.graphics.line(barXPosition, barYPosition) +
      this.graphics.line(barXPosition + barWidth - strokeWidth, barYPosition) +
      this.graphics.line(barXPosition + barWidth - strokeWidth, barYPosition) +
      this.graphics.line(barXPosition + barWidth - strokeWidth, barYPosition) +
      this.graphics.line(barXPosition, barYPosition)

    if (
      w.config.plotOptions.bar.colors.backgroundBarColors.length > 0 &&
      i === 0
    ) {
      if (bc >= w.config.plotOptions.bar.colors.backgroundBarColors.length) {
        bc = 0
      }
      let bcolor = w.config.plotOptions.bar.colors.backgroundBarColors[bc]
      let rect = this.graphics.drawRect(
        barXPosition,
        0,
        barWidth,
        w.globals.gridHeight,
        0,
        bcolor,
        w.config.plotOptions.bar.colors.backgroundBarOpacity
      )
      elSeries.add(rect)
      rect.node.classList.add('apexcharts-backgroundBar')
    }

    x = x + xDivision

    return {
      pathTo,
      pathFrom,
      x: w.globals.isXNumeric ? x - xDivision : x,
      y
    }
  }

  /*
   * When user clicks on legends, the collapsed series will be filled with [0,0,0,...,0]
   * We need to make sure, that the last series is not [0,0,0,...,0]
   * as we need to draw shapes on the last series (for stacked bars/columns only)
   * Hence, we are collecting all inner arrays in series which has [0,0,0...,0]
   **/
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
        this.zeroSerieses.push(zs)
      }
    }

    // After getting all zeroserieses, we need to ensure whether endingshapeonSeries is not in that zeroseries array
    for (let s = series.length - 1; s >= 0; s--) {
      if (
        this.zeroSerieses.indexOf(s) > -1 &&
        s === this.endingShapeOnSeriesNumber
      ) {
        this.endingShapeOnSeriesNumber -= 1
      }
    }
  }
}

export default BarStacked
