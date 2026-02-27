import Bar from './Bar'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'
import Utils from '../utils/Utils'

/**
 * ApexCharts RangeBar Class responsible for drawing Range/Timeline Bars.
 *
 * @module RangeBar
 **/

class RangeBar extends Bar {
  draw(series, seriesIndex) {
    const w = this.w
    const graphics = new Graphics(this.w)

    this.rangeBarOptions = this.w.config.plotOptions.rangeBar

    this.series = series
    this.seriesRangeStart = w.rangeData.seriesRangeStart
    this.seriesRangeEnd = w.rangeData.seriesRangeEnd

    this.barHelpers.initVariables(series)

    const ret = graphics.group({
      class: 'apexcharts-rangebar-series apexcharts-plot-series',
    })

    for (let i = 0; i < series.length; i++) {
      let x, y

      const realIndex = w.globals.comboCharts ? seriesIndex[i] : i
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex)

      // el to which series will be drawn
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        rel: i + 1,
        'data:realIndex': realIndex,
      })

      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex)

      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1
      }

      let translationsIndex = 0
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex][0]
        translationsIndex = realIndex
      }

      const initPositions = this.barHelpers.initialPositions(realIndex)
      const {
        y: initY,
        zeroW, // zeroW is the baseline where 0 meets x axis
        x: initX,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH, // zeroH is the baseline where 0 meets y axis
      } = initPositions
      let barWidth = initPositions.barWidth
      let barHeight = initPositions.barHeight

      y = initY
      x = initX

      // eldatalabels
      const elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex,
      })

      const elGoalsMarkers = graphics.group({
        class: 'apexcharts-rangebar-goals-markers',
      })

      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)

        const y1 = this.seriesRangeStart[i][j]
        const y2 = this.seriesRangeEnd[i][j]

        let paths = null
        let barXPosition = null
        let barYPosition = null
        const params = { x, y, strokeWidth, elSeries }

        let seriesLen = this.seriesLen
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          seriesLen = 1
        }

        if (typeof w.config.series[i].data[j] === 'undefined') {
          // no data exists for further indexes, hence we need to get out the innr loop.
          // As we are iterating over total datapoints, there is a possiblity the series might not have data for j index
          break
        }

        if (this.isHorizontal) {
          barYPosition = y + barHeight * this.visibleI

          const srty = (yDivision - barHeight * seriesLen) / 2

          if (w.config.series[i].data[j].x) {
            const positions = this.detectOverlappingBars({
              i,
              j,
              barYPosition,
              srty,
              barHeight,
              yDivision,
              initPositions,
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
            ...params,
          })

          barWidth = paths.barWidth
        } else {
          if (w.axisFlags.isXNumeric) {
            x =
              (w.seriesData.seriesX[i][j] - w.globals.minX) / this.xRatio -
              barWidth / 2
          }

          barXPosition = x + barWidth * this.visibleI

          const srtx = (xDivision - barWidth * seriesLen) / 2

          if (w.config.series[i].data[j].x) {
            const positions = this.detectOverlappingBars({
              i,
              j,
              barXPosition,
              srtx,
              barWidth,
              xDivision,
              initPositions,
            })

            barWidth = positions.barWidth
            barXPosition = positions.barXPosition
          }

          paths = this.drawRangeColumnPaths({
            indexes: { i, j, realIndex, translationsIndex },
            barWidth,
            barXPosition,
            zeroH,
            xDivision,
            ...params,
          })

          barHeight = paths.barHeight
        }

        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth,
        })

        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine)
        }

        y = paths.y
        x = paths.x

        const pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex)

        this.renderSeries({
          realIndex,
          pathFill: pathFill.color,
          lineFill: pathFill.useRangeColor
            ? pathFill.color
            : w.globals.stroke.colors[realIndex],
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
          barWidth,
          barXPosition,
          barYPosition,
          columnGroupIndex,
          elDataLabelsWrap,
          elGoalsMarkers,
          visibleSeries: this.visibleI,
          type: 'rangebar',
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
    barXPosition,
    srty,
    srtx,
    barHeight,
    barWidth,
    yDivision,
    xDivision,
    initPositions,
  }) {
    const w = this.w
    let overlaps = []
    const rangeName = w.config.series[i].data[j].rangeName

    const x = w.config.series[i].data[j].x
    const labelX = Array.isArray(x) ? x.join(' ') : x

    const rowIndex = w.labelData.labels
      .map((_) => (Array.isArray(_) ? _.join(' ') : _))
      .indexOf(labelX)
    const overlappedIndex = w.rangeData.seriesRange[i].findIndex(
      (tx) => tx.x === labelX && tx.overlaps.length > 0
    )

    if (this.isHorizontal) {
      if (w.config.plotOptions.bar.rangeBarGroupRows) {
        barYPosition = srty + yDivision * rowIndex
      } else {
        barYPosition = srty + barHeight * this.visibleI + yDivision * rowIndex
      }

      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = w.rangeData.seriesRange[i][overlappedIndex].overlaps

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
    } else {
      if (rowIndex > -1 && !w.labelData.timescaleLabels.length) {
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          barXPosition = srtx + xDivision * rowIndex
        } else {
          barXPosition = srtx + barWidth * this.visibleI + xDivision * rowIndex
        }
      }

      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = w.rangeData.seriesRange[i][overlappedIndex].overlaps

        if (overlaps.indexOf(rangeName) > -1) {
          barWidth = initPositions.barWidth / overlaps.length

          barXPosition =
            barWidth * this.visibleI +
            (xDivision * (100 - parseInt(this.barOptions.barWidth, 10))) /
              100 /
              2 +
            barWidth * (this.visibleI + overlaps.indexOf(rangeName)) +
            xDivision * rowIndex
        }
      }
    }

    return {
      barYPosition,
      barXPosition,
      barHeight,
      barWidth,
    }
  }

  drawRangeColumnPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    barXPosition,
    zeroH,
  }) {
    const w = this.w

    const { i, j, realIndex, translationsIndex } = indexes

    const yRatio = this.yRatio[translationsIndex]

    const range = this.getRangeValue(realIndex, j)

    let y1 = Math.min(range.start, range.end)
    let y2 = Math.max(range.start, range.end)

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

    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1,
      y2,
      strokeWidth: this.strokeWidth,
      series: this.seriesRangeEnd,
      realIndex: realIndex,
      i: realIndex,
      j,
      w,
    })

    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision
    } else {
      const xForNumericXAxis = this.getBarXForNumericXAxis({
        x,
        j,
        realIndex,
        barWidth,
      })
      x = xForNumericXAxis.x
      barXPosition = xForNumericXAxis.barXPosition
    }

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barHeight,
      x,
      y: range.start < 0 && range.end < 0 ? y1 : y2,
      goalY: this.barHelpers.getGoalValues(
        'y',
        null,
        zeroH,
        i,
        j,
        translationsIndex
      ),
      barXPosition,
    }
  }

  preventBarOverflow(val) {
    const w = this.w

    if (val < 0) {
      val = 0
    }
    if (val > w.layout.gridWidth) {
      val = w.layout.gridWidth
    }

    return val
  }

  drawRangeBarPaths({
    indexes,
    y,
    y1,
    y2,
    yDivision,
    barHeight,
    barYPosition,
    zeroW,
  }) {
    const w = this.w

    const { realIndex, j } = indexes

    const x1 = this.preventBarOverflow(zeroW + y1 / this.invertedYRatio)
    const x2 = this.preventBarOverflow(zeroW + y2 / this.invertedYRatio)

    const range = this.getRangeValue(realIndex, j)

    const barWidth = Math.abs(x2 - x1)

    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1,
      x2,
      strokeWidth: this.strokeWidth,
      series: this.seriesRangeEnd,
      i: realIndex,
      realIndex,
      j,
      w,
    })

    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision
    }

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barWidth,
      x: range.start < 0 && range.end < 0 ? x1 : x2,
      goalX: this.barHelpers.getGoalValues('x', zeroW, null, realIndex, j),
      y,
    }
  }

  getRangeValue(i, j) {
    const w = this.w
    return {
      start: w.rangeData.seriesRangeStart[i][j],
      end: w.rangeData.seriesRangeEnd[i][j],
    }
  }
}

export default RangeBar
