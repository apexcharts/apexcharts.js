import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Graphics from '../modules/Graphics'
import Utils from '../utils/Utils'
import BarStacked from './BarStacked'

/**
 * ApexCharts BarStacked Class responsible for drawing both Stacked Columns and Bars.
 *
 * @module BarStacked
 * The whole calculation for stacked bar/column is different from normal bar/column,
 * hence it makes sense to derive a new class for it extending most of the props of Parent Bar
 **/

class BarGroupedStacked extends BarStacked {
  draw(series, seriesIndex) {
    let w = this.w
    this.graphics = new Graphics(this.ctx)
    this.bar = new Bar(this.ctx, this.xyRatios)

    const coreUtils = new CoreUtils(this.ctx, w)
    series = coreUtils.getLogSeries(series)
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series)

    if (w.config.chart.stackType === '100%') {
      series = w.globals.seriesPercent.slice()
    }

    this.series = series
    this.barHelpers.initializeStackedPrevVars(this)

    let ret = this.graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series'
    })

    let x = 0
    let y = 0

    /*
      let groupIndex = -1
      w.globals.seriesGroups.forEach((group, gIndex) => {
        if (group.indexOf(w.config.series[i].name) > -1) {
          groupIndex = gIndex
        }
      })
    */

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let xDivision // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
      let yDivision // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
      let zeroH // zeroH is the baseline where 0 meets y axis
      let zeroW // zeroW is the baseline where 0 meets x axis

      let groupIndex = -1
      this.groupCtx = this

      w.globals.seriesGroups.forEach((group, gIndex) => {
        if (group.indexOf(w.config.series[i].name) > -1) {
          groupIndex = gIndex
        }
      })

      if (groupIndex !== -1) {
        this.groupCtx = this[w.globals.seriesGroups[groupIndex]]
      }

      let xArrValues = []
      let yArrValues = []

      let realIndex = w.globals.comboCharts ? seriesIndex[i] : i

      if (this.yRatio.length > 1) {
        this.yaxisIndex = realIndex
      }

      this.isReversed =
        w.config.yaxis[this.yaxisIndex] &&
        w.config.yaxis[this.yaxisIndex].reversed

      // el to which series will be drawn
      let elSeries = this.graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[realIndex]),
        rel: i + 1,
        'data:realIndex': realIndex
      })
      this.ctx.series.addCollapsedClassToSeries(elSeries, realIndex)

      // eldatalabels
      let elDataLabelsWrap = this.graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex
      })

      let elGoalsMarkers = this.graphics.group({
        class: 'apexcharts-bar-goals-markers',
        style: `pointer-events: none`
      })

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

      this.barHelpers.initializeStackedXYVars(this)

      // where all stack bar disappear after collapsing the first series
      if (
        this.groupCtx.prevY.length === 1 &&
        this.groupCtx.prevY[0].every((val) => isNaN(val))
      ) {
        this.groupCtx.prevY[0] = this.groupCtx.prevY[0].map((val) => zeroH)
        this.groupCtx.prevYF[0] = this.groupCtx.prevYF[0].map((val) => 0)
      }

      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)
        const commonPathOpts = {
          indexes: { i, j, realIndex, bc },
          strokeWidth,
          x,
          y,
          elSeries
        }
        let paths = null
        if (this.isHorizontal) {
          paths = this.drawStackedBarPaths({
            ...commonPathOpts,
            zeroW,
            barHeight,
            yDivision
          })
          barWidth = this.series[i][j] / this.invertedYRatio
        } else {
          paths = this.drawStackedColumnPaths({
            ...commonPathOpts,
            xDivision,
            barWidth,
            zeroH
          })
          barHeight = this.series[i][j] / this.yRatio[this.yaxisIndex]
        }

        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        })

        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine)
        }

        y = paths.y
        x = paths.x

        xArrValues.push(x)
        yArrValues.push(y)

        let pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex)

        elSeries = this.renderSeries({
          realIndex,
          pathFill,
          j,
          i,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          barHeight,
          barWidth,
          elDataLabelsWrap,
          elGoalsMarkers,
          type: 'bar',
          visibleSeries: 0
        })
      }

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrValues
      w.globals.seriesYvalues[realIndex] = yArrValues

      // push all current y values array to main PrevY Array
      this.groupCtx.prevY.push(this.groupCtx.yArrj)
      this.groupCtx.prevYF.push(this.groupCtx.yArrjF)
      this.groupCtx.prevYVal.push(this.groupCtx.yArrjVal)
      this.groupCtx.prevX.push(this.groupCtx.xArrj)
      this.groupCtx.prevXF.push(this.groupCtx.xArrjF)
      this.groupCtx.prevXVal.push(this.groupCtx.xArrjVal)

      ret.add(elSeries)
    }

    return ret
  }

  drawStackedBarPaths({
    indexes,
    barHeight,
    strokeWidth,
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

    let prevBarW = 0
    for (let k = 0; k < this.prevXF.length; k++) {
      prevBarW = prevBarW + this.prevXF[k][j]
    }

    if (i > 0) {
      let bXP = zeroW

      if (this.prevXVal[i - 1][j] < 0) {
        bXP =
          this.series[i][j] >= 0
            ? this.prevX[i - 1][j] +
              prevBarW -
              (this.isReversed ? prevBarW : 0) * 2
            : this.prevX[i - 1][j]
      } else if (this.prevXVal[i - 1][j] >= 0) {
        bXP =
          this.series[i][j] >= 0
            ? this.prevX[i - 1][j]
            : this.prevX[i - 1][j] -
              prevBarW +
              (this.isReversed ? prevBarW : 0) * 2
      }

      barXPosition = bXP
    } else {
      // the first series will not have prevX values
      barXPosition = zeroW
    }

    if (this.series[i][j] === null) {
      x = barXPosition
    } else {
      x =
        barXPosition +
        this.series[i][j] / this.invertedYRatio -
        (this.isReversed ? this.series[i][j] / this.invertedYRatio : 0) * 2
    }

    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1: barXPosition,
      x2: x,
      strokeWidth,
      series: this.series,
      realIndex: indexes.realIndex,
      i,
      j,
      w
    })

    this.barHelpers.barBackground({
      j,
      i,
      y1: barYPosition,
      y2: barHeight,
      elSeries
    })

    y = y + yDivision

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalX: this.barHelpers.getGoalValues('x', zeroW, null, i, j),
      barYPosition,
      x,
      y
    }
  }

  drawStackedColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth,
    elSeries
  }) {
    let w = this.w
    let i = indexes.i
    let j = indexes.j
    let bc = indexes.bc

    if (w.globals.isXNumeric) {
      let seriesVal = w.globals.seriesX[i][j]
      if (!seriesVal) seriesVal = 0
      x = (seriesVal - w.globals.minX) / this.xRatio - barWidth / 2
    }

    let barXPosition = x - (barWidth * w.globals.seriesGroups.length) / 2
    let barYPosition

    let prevBarH = 0
    for (let k = 0; k < this.groupCtx.prevYF.length; k++) {
      // fix issue #1215
      // in case where this.groupCtx.prevYF[k][j] is NaN, use 0 instead
      prevBarH =
        prevBarH +
        (!isNaN(this.groupCtx.prevYF[k][j]) ? this.groupCtx.prevYF[k][j] : 0)
    }

    if (
      (i > 0 && !w.globals.isXNumeric) ||
      (i > 0 &&
        w.globals.isXNumeric &&
        w.globals.seriesX[i - 1][j] === w.globals.seriesX[i][j])
    ) {
      let bYP
      let prevYValue
      const p = Math.min(this.yRatio.length + 1, i + 1)
      if (this.groupCtx.prevY[i - 1] !== undefined) {
        for (let ii = 1; ii < p; ii++) {
          if (!isNaN(this.groupCtx.prevY[i - ii][j])) {
            // find the previous available value to give prevYValue
            prevYValue = this.groupCtx.prevY[i - ii][j]
            // if found it, break the loop
            break
          }
        }
      }

      for (let ii = 1; ii < p; ii++) {
        // find the previous available value(non-NaN) to give bYP
        if (this.groupCtx.prevYVal[i - ii][j] < 0) {
          bYP =
            this.series[i][j] >= 0
              ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2
              : prevYValue
          // found it? break the loop
          break
        } else if (this.groupCtx.prevYVal[i - ii][j] >= 0) {
          bYP =
            this.series[i][j] >= 0
              ? prevYValue
              : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2
          // found it? break the loop
          break
        }
      }

      if (typeof bYP === 'undefined') bYP = w.globals.gridHeight

      // if this.prevYF[0] is all 0 resulted from line #486
      // AND every arr starting from the second only contains NaN
      if (
        this.groupCtx.prevYF[0].every((val) => val === 0) &&
        this.groupCtx.prevYF
          .slice(1, i)
          .every((arr) => arr.every((val) => isNaN(val)))
      ) {
        barYPosition = zeroH
      } else {
        // Nothing special
        barYPosition = bYP
      }
    } else {
      // the first series will not have prevY values, also if the prev index's series X doesn't matches the current index's series X, then start from zero
      barYPosition = zeroH
    }

    if (this.series[i][j]) {
      y =
        barYPosition -
        this.series[i][j] / this.yRatio[this.yaxisIndex] +
        (this.isReversed
          ? this.series[i][j] / this.yRatio[this.yaxisIndex]
          : 0) *
          2
    } else {
      // fixes #3610
      y = barYPosition
    }

    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1: barYPosition,
      y2: y,
      yRatio: this.yRatio[this.yaxisIndex],
      strokeWidth: this.strokeWidth,
      series: this.series,
      realIndex: indexes.realIndex,
      i,
      j,
      w
    })

    this.barHelpers.barBackground({
      bc,
      j,
      i,
      x1: barXPosition,
      x2: barWidth,
      elSeries
    })

    x = x + xDivision

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalY: this.barHelpers.getGoalValues('y', null, zeroH, i, j),
      barXPosition,
      x: w.globals.isXNumeric ? x - xDivision : x,
      y
    }
  }
}

export default BarGroupedStacked
