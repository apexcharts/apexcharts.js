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

    this.candlestickOptions = this.w.config.plotOptions.candlestick

    this.initVariables(series)

    let ret = graphics.group({
      class: 'apexcharts-candlestick-series apexcharts-plot-series'
    })

    ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let pathTo, pathFrom
      let x, y,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        zeroH // zeroH is the baseline where 0 meets y axis

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

      x = initPositions.x
      barWidth = initPositions.barWidth
      xDivision = initPositions.xDivision
      zeroH = initPositions.zeroH

      xArrj.push(x + barWidth / 2)

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

        let paths = this.drawCandleStickPaths({
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

        pathTo = paths.pathTo
        pathFrom = paths.pathFrom
        y = paths.y
        x = paths.x

        // push current X
        if (j > 0) {
          xArrj.push(x + barWidth / 2)
        }

        yArrj.push(y)

        let fillColor = null

        let pathFill = fill.fillPath(elSeries, {
          seriesNumber: realIndex,
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
          className: 'apexcharts-candlestick-area',
          id: 'apexcharts-candlestick-area'
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
    let graphics = new Graphics(this.ctx)

    let i = indexes.i
    let j = indexes.j

    let realIndex = indexes.realIndex
    let bc = indexes.bc

    if (w.globals.dataXY) {
      x = (w.globals.seriesX[i][j] - w.globals.minX) / this.xRatio - barWidth / 2
    }

    let barXPosition = x + barWidth * this.visibleI

    pathTo = graphics.move(barXPosition, zeroH)

    pathFrom = graphics.move(barXPosition, zeroH)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPathFrom(realIndex, j, true)
    }

    if (typeof this.series[i][j] === 'undefined' || this.series[i][j] === null) {
      y = zeroH
    } else {
      y = (zeroH - this.series[i][j] / this.yRatio[this.yaxisIndex])
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
      graphics.line(barXPosition, zeroH)
    pathFrom =
      pathFrom +
      graphics.line(barXPosition, zeroH) +
      endingShape.ending_p_from +
      graphics.line(barXPosition + barWidth - strokeWidth, zeroH) +
      graphics.line(barXPosition + barWidth - strokeWidth, zeroH) +
      graphics.line(barXPosition, zeroH)

    if (!w.globals.dataXY) {
      x = x + xDivision
    }

    if (
      this.barOptions.colors.backgroundBarColors.length > 0 &&
      i === 0
    ) {
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
}

export default CandleStick
