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

    this.initVariables(series, true)

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

      let initPositions = this.initialPositions({makeWidthForVisibleItems: true})

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

        let color

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
        color = paths.color

        // push current X
        if (j > 0) {
          xArrj.push(x + barWidth / 2)
        }

        yArrj.push(y)

        let pathFill = fill.fillPath(elSeries, {
          seriesNumber: realIndex,
          color
        })

        elSeries = this.renderSeries({ realIndex, pathFill, j, i, pathFrom, pathTo, strokeWidth, elSeries, x, y, series, barHeight, barWidth, elDataLabelsWrap, visibleSeries: this.visibleI, type: 'candlestick' })
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
    strokeWidth
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let i = indexes.i
    let j = indexes.j

    let isPositive = true
    let colorPos = w.config.plotOptions.candlestick.colors.upward
    let colorNeg = w.config.plotOptions.candlestick.colors.downward

    const yRatio = this.yRatio[this.yaxisIndex]
    let realIndex = indexes.realIndex

    const ohlc = this.getOHLCValue(realIndex, j)
    let l1 = zeroH; let l2 = zeroH

    if (ohlc.o > ohlc.c) {
      isPositive = false
    }

    let y1 = Math.min(ohlc.o, ohlc.c)
    let y2 = Math.max(ohlc.o, ohlc.c)

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
      y1 = zeroH
    } else {
      y1 = zeroH - y1 / yRatio
      y2 = zeroH - y2 / yRatio
      l1 = zeroH - ohlc.h / yRatio
      l2 = zeroH - ohlc.l / yRatio
    }

    pathTo =
      graphics.move(barXPosition, y2) +
      graphics.line(barXPosition + barWidth / 2, y2) +
      graphics.line(barXPosition + barWidth / 2, l1) +
      graphics.line(barXPosition + barWidth / 2, y2) +
      graphics.line(barXPosition + barWidth, y2) +
      graphics.line(barXPosition + barWidth, y1) +
      graphics.line(barXPosition + barWidth / 2, y1) +
      graphics.line(barXPosition + barWidth / 2, l2) +
      graphics.line(barXPosition + barWidth / 2, y1) +
      graphics.line(barXPosition, y1) +
      graphics.line(barXPosition, y2 - strokeWidth / 2)

    if (!w.globals.dataXY) {
      x = x + xDivision
    }

    return {
      pathTo,
      pathFrom,
      x,
      y: y2,
      barXPosition,
      color: isPositive ? colorPos : colorNeg
    }
  }

  getOHLCValue (i, j) {
    const w = this.w
    return {
      o: w.globals.seriesCandleO[i][j],
      h: w.globals.seriesCandleH[i][j],
      l: w.globals.seriesCandleL[i][j],
      c: w.globals.seriesCandleC[i][j]
    }
  }
}

export default CandleStick
