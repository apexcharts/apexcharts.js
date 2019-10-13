import Bar from './Bar'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Utils from '../utils/Utils'

/**
 * ApexCharts RangeBar Class responsible for drawing Range/Timeline Bars.
 *
 * @module RangeBar
 **/

class RangeBar extends Bar {
  draw(series, seriesIndex) {
    let w = this.w
    let graphics = new Graphics(this.ctx)
    let fill = new Fill(this.ctx)

    this.rangeBarOptions = this.w.config.plotOptions.rangeBar

    this.series = series
    this.seriesRangeStart = w.globals.seriesRangeStart
    this.seriesRangeEnd = w.globals.seriesRangeEnd

    this.initVariables(series)

    let ret = graphics.group({
      class: 'apexcharts-rangebar-series apexcharts-plot-series'
    })

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let pathTo, pathFrom
      let x,
        y,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH, // zeroH is the baseline where 0 meets y axis
        zeroW // zeroW is the baseline where 0 meets x axis

      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i

      // el to which series will be drawn
      let elSeries = graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[realIndex]),
        rel: i + 1,
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
      yDivision = initPositions.yDivision
      barHeight = initPositions.barHeight
      zeroW = initPositions.zeroW

      x = initPositions.x
      barWidth = initPositions.barWidth
      xDivision = initPositions.xDivision
      zeroH = initPositions.zeroH

      // eldatalabels
      let elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels'
      })

      for (
        let j = 0, tj = w.globals.dataPoints;
        j < w.globals.dataPoints;
        j++, tj--
      ) {
        this.isNullValue = false
        if (typeof this.series[i][j] === 'undefined' || series[i][j] === null) {
          this.isNullValue = true
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
          paths = this.drawRangeBarPaths({
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

          barWidth = paths.barWidth
        } else {
          paths = this.drawRangeColumnPaths({
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

          barHeight = paths.barHeight
        }

        pathTo = paths.pathTo
        pathFrom = paths.pathFrom
        y = paths.y
        x = paths.x

        // push current X

        let pathFill = fill.fillPath({
          seriesNumber: realIndex
        })

        let lineFill = w.globals.stroke.colors[realIndex]

        elSeries = this.renderSeries({
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
          visibleSeries: this.visibleI,
          type: 'rangebar'
        })
      }

      ret.add(elSeries)
    }

    return ret
  }

  drawRangeColumnPaths({
    indexes,
    x,
    y,
    strokeWidth,
    xDivision,
    pathTo,
    pathFrom,
    barWidth,
    zeroH
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let i = indexes.i
    let j = indexes.j

    const yRatio = this.yRatio[this.yaxisIndex]
    let realIndex = indexes.realIndex

    const range = this.getRangeValue(realIndex, j)

    let y1 = Math.min(range.start, range.end)
    let y2 = Math.max(range.start, range.end)

    if (w.globals.isXNumeric) {
      x =
        (w.globals.seriesX[i][j] - w.globals.minX) / this.xRatio - barWidth / 2
    }

    let barXPosition = x + barWidth * this.visibleI

    if (
      typeof this.series[i][j] === 'undefined' ||
      this.series[i][j] === null
    ) {
      y1 = zeroH
    } else {
      y1 = zeroH - y1 / yRatio
      y2 = zeroH - y2 / yRatio
    }
    const barHeight = Math.abs(y2 - y1)

    pathTo = graphics.move(barXPosition, zeroH)
    pathFrom = graphics.move(barXPosition, y1)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPathFrom(realIndex, j, true)
    }

    pathTo =
      graphics.move(barXPosition, y2) +
      graphics.line(barXPosition + barWidth, y2) +
      graphics.line(barXPosition + barWidth, y1) +
      graphics.line(barXPosition, y1) +
      graphics.line(barXPosition, y2 - strokeWidth / 2)

    pathFrom =
      pathFrom +
      graphics.move(barXPosition, y1) +
      graphics.line(barXPosition + barWidth, y1) +
      graphics.line(barXPosition + barWidth, y1) +
      graphics.line(barXPosition, y1)

    if (!w.globals.isXNumeric) {
      x = x + xDivision
    }

    return {
      pathTo,
      pathFrom,
      barHeight,
      x,
      y: y2,
      barXPosition
    }
  }

  drawRangeBarPaths({
    indexes,
    x,
    y,
    yDivision,
    pathTo,
    pathFrom,
    barHeight,
    zeroW
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let i = indexes.i
    let j = indexes.j

    let realIndex = indexes.realIndex

    let x1 = zeroW
    let x2 = zeroW

    if (w.globals.isXNumeric) {
      y =
        (w.globals.seriesX[i][j] - w.globals.minX) / this.invertedXRatio -
        barHeight
    }

    let barYPosition = y + barHeight * this.visibleI

    if (
      typeof this.series[i][j] !== 'undefined' &&
      this.series[i][j] !== null
    ) {
      x1 = zeroW + this.seriesRangeStart[i][j] / this.invertedYRatio
      x2 = zeroW + this.seriesRangeEnd[i][j] / this.invertedYRatio
    }

    pathTo = graphics.move(zeroW, barYPosition)
    pathFrom = graphics.move(zeroW, barYPosition)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPathFrom(realIndex, j)
    }

    const barWidth = Math.abs(x2 - x1)

    pathTo =
      graphics.move(x1, barYPosition) +
      graphics.line(x2, barYPosition) +
      graphics.line(x2, barYPosition + barHeight) +
      graphics.line(x1, barYPosition + barHeight) +
      graphics.line(x1, barYPosition)

    pathFrom =
      pathFrom +
      graphics.line(x1, barYPosition) +
      graphics.line(x1, barYPosition + barHeight) +
      graphics.line(x1, barYPosition + barHeight) +
      graphics.line(x1, barYPosition)

    if (!w.globals.isXNumeric) {
      y = y + yDivision
    }

    return {
      pathTo,
      pathFrom,
      barWidth,
      x: x2,
      y,
      barYPosition
    }
  }

  getRangeValue(i, j) {
    const w = this.w
    return {
      start: w.globals.seriesRangeStart[i][j],
      end: w.globals.seriesRangeEnd[i][j]
    }
  }
}

export default RangeBar
