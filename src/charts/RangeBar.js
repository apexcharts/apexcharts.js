import Bar from './Bar'
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

    this.rangeBarOptions = this.w.config.plotOptions.rangeBar

    this.series = series
    this.seriesRangeStart = w.globals.seriesRangeStart
    this.seriesRangeEnd = w.globals.seriesRangeEnd

    this.barHelpers.initVariables(series)

    let ret = graphics.group({
      class: 'apexcharts-rangebar-series apexcharts-plot-series'
    })

    for (let i = 0; i < series.length; i++) {
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

      let barHeight = 0
      let barWidth = 0

      if (this.yRatio.length > 1) {
        this.yaxisIndex = realIndex
      }

      let initPositions = this.barHelpers.initialPositions()

      y = initPositions.y
      zeroW = initPositions.zeroW

      x = initPositions.x
      barWidth = initPositions.barWidth
      xDivision = initPositions.xDivision
      zeroH = initPositions.zeroH

      // eldatalabels
      let elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex
      })

      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)

        const y1 = this.seriesRangeStart[i][j]
        const y2 = this.seriesRangeEnd[i][j]

        let paths = null
        let barYPosition = null
        const params = { x, y, strokeWidth, elSeries }

        yDivision = initPositions.yDivision
        barHeight = initPositions.barHeight

        if (this.isHorizontal) {
          barYPosition = y + barHeight * this.visibleI

          let srty = (yDivision - barHeight * this.seriesLen) / 2

          if (typeof w.config.series[i].data[j] === 'undefined') {
            // no data exists for further indexes, hence we need to get out the innr loop.
            // As we are iterating over total datapoints, there is a possiblity the series might not have data for j index
            break
          }

          if (this.isTimelineBar && w.config.series[i].data[j].x) {
            let positions = this.detectOverlappingBars({
              i,
              j,
              barYPosition,
              srty,
              barHeight,
              yDivision,
              initPositions
            })

            barHeight = positions.barHeight
            barYPosition = positions.barYPosition
          }

          paths = this.drawRangeBarPaths({
            indexes: { i, j, realIndex },
            barHeight,
            barYPosition,
            zeroW,
            yDivision,
            y1,
            y2,
            ...params
          })

          barWidth = paths.barWidth
        } else {
          paths = this.drawRangeColumnPaths({
            indexes: { i, j, realIndex },
            zeroH,
            barWidth,
            xDivision,
            ...params
          })

          barHeight = paths.barHeight
        }

        y = paths.y
        x = paths.x

        let pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex)

        let lineFill = w.globals.stroke.colors[realIndex]

        this.renderSeries({
          realIndex,
          pathFill,
          lineFill,
          j,
          i,
          x,
          y,
          y1,
          y2,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          series,
          barHeight,
          barYPosition,
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

  detectOverlappingBars({
    i,
    j,
    barYPosition,
    srty,
    barHeight,
    yDivision,
    initPositions
  }) {
    const w = this.w
    let overlaps = []
    let rangeName = w.config.series[i].data[j].rangeName

    const labelX = w.config.series[i].data[j].x
    const rowIndex = w.globals.labels.indexOf(labelX)
    const overlappedIndex = w.globals.seriesRangeBarTimeline[i].findIndex(
      (tx) => tx.x === labelX && tx.overlaps.length > 0
    )

    barYPosition = srty + barHeight * this.visibleI + yDivision * rowIndex

    if (overlappedIndex > -1) {
      overlaps = w.globals.seriesRangeBarTimeline[i][overlappedIndex].overlaps

      if (overlaps.indexOf(rangeName) > -1) {
        barHeight = initPositions.barHeight / overlaps.length

        barYPosition =
          barHeight * this.visibleI +
          (yDivision * (100 - parseInt(this.barOptions.barHeight, 10))) /
            100 /
            2 +
          barHeight * (this.visibleI + overlaps.indexOf(rangeName)) +
          yDivision * rowIndex
      }
    }

    return {
      barYPosition,
      barHeight
    }
  }

  drawRangeColumnPaths({
    indexes,
    x,
    strokeWidth,
    xDivision,
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

    let pathTo = graphics.move(barXPosition, zeroH)
    let pathFrom = graphics.move(barXPosition, y1)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, true)
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
    y,
    y1,
    y2,
    yDivision,
    barHeight,
    barYPosition,
    zeroW
  }) {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    const x1 = zeroW + y1 / this.invertedYRatio
    const x2 = zeroW + y2 / this.invertedYRatio

    let pathTo = graphics.move(zeroW, barYPosition)
    let pathFrom = graphics.move(x1, barYPosition)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(indexes.realIndex, indexes.j)
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
      y
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
