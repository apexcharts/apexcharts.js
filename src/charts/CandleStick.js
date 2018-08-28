import Bar from './Bar'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'

/**
 * ApexCharts CandleStick Class responsible for drawing both Stacked Columns and Bars.
 *
 * @module CandleStick
 * The whole calculation for stacked bar/column is different from normal bar/column,
 * hence it makes sense to derive a new class for it extending most of the props of Parent Bar
 **/

class CandleStick extends Bar {
  draw (series, seriesIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)
    let fill = new Fill(this.ctx)

    this.series = series
    this.totalItems = 0
    this.seriesLen = 0
    this.visibleI = -1

    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.seriesLen = this.seriesLen + 1
        this.totalItems += series[sl].length
      }
    }

    if (this.seriesLen === 0) {
      // A small adjustment when combo charts are used
      this.seriesLen = 1
    }

    let ret = graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series'
    })

    ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let pathTo, pathFrom
      let x, y,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH, // zeroH is the baseline where 0 meets y axis
        zeroW // zeroW is the baseline where 0 meets x axis

      let yArrj = [] // hold y values of current iterating series
      let xArrj = [] // hold x values of current iterating series

      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i

      // el to which series will be drawn
      let elSeries = graphics.group({
        class: 'apexcharts-series',
        'rel': i + 1,
        'data:realIndex': realIndex
      })

      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1
      }

      let strokeWidth = 0
      let barHeight = 0
      let barWidth = 0

      if (this.yRatio.length > 1) {
        this.yaxisIndex = realIndex
      }

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

      for (let j = 0, tj = w.globals.dataPoints; j < w.globals.dataPoints; j++, tj--) {
        if (typeof this.series[i][j] === 'undefined' || series[i][j] === null) {
          this.isNullValue = true
        } else {
          this.isNullValue = false
        }
        if (w.config.stroke.show) {
          if (this.isNullValue) {
            strokeWidth = 0
          } else {
            strokeWidth = Array.isArray(this.strokeWidth) ? this.strokeWidth[realIndex] : this.strokeWidth
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

        // push current X
        if (j > 0) {
          xArrj.push(x + barWidth / 2)
        }

        yArrj.push(y)

        let seriesNumber = this.barOptions.distributed ? j : i

        let fillColor = null

        if (this.barOptions.colors.ranges.length > 0) {
          const colorRange = this.barOptions.colors.ranges
          colorRange.map((range) => {
            if (series[i][j] >= range.from && series[i][j] <= range.to) {
              fillColor = range.color
            }
          })
        }

        let pathFill = fill.fillPath(elSeries, {
          seriesNumber: this.barOptions.distributed
            ? seriesNumber
            : realIndex,
          color: fillColor
        })

        let lineFill = w.globals.stroke.colors[realIndex]

        if (this.isNullValue) {
          pathFill = 'none'
        }

        let delay =
        (j /
        w.config.chart.animations.animateGradually.delay *
        (w.config.chart.animations.speed /
        w.globals.dataPoints)) / 2.4

        let renderedPath = graphics.renderPaths({
          i,
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
          className: 'apexcharts-bar-area',
          id: 'apexcharts-bar-area'
        })

        this.setSelectedBarFilter(renderedPath, realIndex, j)

        elSeries.add(renderedPath)

        let dataLabels = this.calculateBarDataLabels({ x, y, i, j, series, realIndex, barHeight, barWidth, renderedPath, visibleSeries: this.visibleI })

        if (dataLabels !== null) {
          elDataLabelsWrap.add(dataLabels)
        }

        elSeries.add(elDataLabelsWrap)
      }

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrj
      w.globals.seriesYvalues[realIndex] = yArrj

      ret.add(elSeries)
    }

    return ret
  }

  drawCandleStickPaths ({
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

    if (w.globals.dataXY) {
      let seriesVal = w.globals.seriesX[i][j]
      if (!seriesVal) seriesVal = 0
      x = ((seriesVal - w.globals.minX) / this.xRatio) - barWidth / 2
    }

    let barXPosition = x
    let barYPosition

    let prevBarH = 0
    for (let k = 0; k < this.prevYF.length; k++) {
      prevBarH = prevBarH + this.prevYF[k][j]
    }

    if (i > 0) {
      let bYP = w.globals.gridHeight - zeroH
      let prevYValue = this.prevY[i - 1][j]

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
      // the first series will not have prevY values
      barYPosition = w.globals.gridHeight - zeroH
    }

    if (this.series[i][j] === null) {
      y = barYPosition - this.series[i][j] / this.yRatio[this.yaxisIndex]
    } else {
      y = (barYPosition - this.series[i][j] / this.yRatio[this.yaxisIndex])
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
      if (
        bc >= w.config.plotOptions.bar.colors.backgroundBarColors.length
      ) {
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
      rect.classList.add('apexcharts-backgroundBar')
    }

    x = x + xDivision

    return {
      pathTo,
      pathFrom,
      x,
      y
    }
  }
}

export default CandleStick
