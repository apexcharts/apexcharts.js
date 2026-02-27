import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'
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
    const w = this.w
    this.graphics = new Graphics(this.w)
    this.bar = new Bar(this.w, this.ctx, this.xyRatios)

    const coreUtils = new CoreUtils(this.w)
    series = coreUtils.getLogSeries(series)
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series)

    if (w.config.chart.stackType === '100%') {
      series = w.globals.comboCharts
        ? seriesIndex.map((_) => w.globals.seriesPercent[_])
        : w.globals.seriesPercent.slice()
    }

    this.series = series
    this.barHelpers.initializeStackedPrevVars(this)

    const ret = this.graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series',
    })

    let x = 0
    let y = 0

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      const realIndex = w.globals.comboCharts ? seriesIndex[i] : i
      const { groupIndex, columnGroupIndex } =
        this.barHelpers.getGroupIndex(realIndex)
      this.groupCtx = this[w.labelData.seriesGroups[groupIndex]]

      const xArrValues = []
      const yArrValues = []

      let translationsIndex = 0
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex][0]
        translationsIndex = realIndex
      }

      this.isReversed =
        w.config.yaxis[this.yaxisIndex] &&
        w.config.yaxis[this.yaxisIndex].reversed

      // el to which series will be drawn
      let elSeries = this.graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        rel: i + 1,
        'data:realIndex': realIndex,
      })
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex)

      // eldatalabels
      const elDataLabelsWrap = this.graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex,
      })

      const elGoalsMarkers = this.graphics.group({
        class: 'apexcharts-bar-goals-markers',
      })

      const initPositions = this.initialPositions(x, y, undefined, undefined, undefined, undefined, translationsIndex)
      const {
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH, // zeroH is the baseline where 0 meets y axis
        zeroW, // zeroW is the baseline where 0 meets x axis
      } = initPositions
      let barHeight = initPositions.barHeight
      let barWidth = initPositions.barWidth

      y = initPositions.y
      x = initPositions.x

      w.globals.barHeight = barHeight
      w.globals.barWidth = barWidth

      this.barHelpers.initializeStackedXYVars(this)

      // where all stack bar disappear after collapsing the first series
      if (
        this.groupCtx.prevY.length === 1 &&
        this.groupCtx.prevY[0].every((val) => isNaN(val))
      ) {
        this.groupCtx.prevY[0] = this.groupCtx.prevY[0].map(() => zeroH)
        this.groupCtx.prevYF[0] = this.groupCtx.prevYF[0].map(() => 0)
      }

      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)
        const commonPathOpts = {
          indexes: { i, j, realIndex, translationsIndex, bc },
          strokeWidth,
          x,
          y,
          elSeries,
          columnGroupIndex,
          seriesGroup: w.labelData.seriesGroups[groupIndex],
        }
        let paths = null
        if (this.isHorizontal) {
          paths = this.drawStackedBarPaths({
            ...commonPathOpts,
            zeroW,
            barHeight,
            yDivision,
          })
          barWidth = this.series[i][j] / this.invertedYRatio
        } else {
          paths = this.drawStackedColumnPaths({
            ...commonPathOpts,
            xDivision,
            barWidth,
            zeroH,
          })
          barHeight = this.series[i][j] / this.yRatio[translationsIndex]
        }

        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
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

        xArrValues.push(x)
        yArrValues.push(y)

        const pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex)

        let classes = ''

        const flipClass = w.globals.isBarHorizontal
          ? 'apexcharts-flip-x'
          : 'apexcharts-flip-y'
        if (
          (this.barHelpers.arrBorderRadius[realIndex][j] === 'bottom' &&
            w.seriesData.series[realIndex][j] > 0) ||
          (this.barHelpers.arrBorderRadius[realIndex][j] === 'top' &&
            w.seriesData.series[realIndex][j] < 0)
        ) {
          classes = flipClass
        }
        elSeries = this.renderSeries({
          realIndex,
          pathFill: pathFill.color,
          ...(pathFill.useRangeColor ? { lineFill: pathFill.color } : {}),
          j,
          i,
          columnGroupIndex,
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
          visibleSeries: columnGroupIndex,
          classes,
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

  initialPositions(
    x,
    y,
    xDivision,
    yDivision,
    zeroH,
    zeroW,
    translationsIndex
  ) {
    const w = this.w

    let barHeight, barWidth
    if (this.isHorizontal) {
      // height divided into equal parts
      yDivision = w.layout.gridHeight / w.globals.dataPoints

      const userBarHeight = w.config.plotOptions.bar.barHeight
      if (String(userBarHeight).indexOf('%') === -1) {
        barHeight = parseInt(userBarHeight, 10)
      } else {
        barHeight = (yDivision * parseInt(userBarHeight, 10)) / 100
      }
      zeroW =
        w.globals.padHorizontal +
        (this.isReversed
          ? w.layout.gridWidth - this.baseLineInvertedY
          : this.baseLineInvertedY)

      // initial y position is half of barHeight * half of number of Bars
      y = (yDivision - barHeight) / 2
    } else {
      // width divided into equal parts
      xDivision = w.layout.gridWidth / w.globals.dataPoints

      barWidth = xDivision

      const userColumnWidth = w.config.plotOptions.bar.columnWidth
      if (w.axisFlags.isXNumeric && w.globals.dataPoints > 1) {
        xDivision = w.globals.minXDiff / this.xRatio
        barWidth = (xDivision * parseInt(this.barOptions.columnWidth, 10)) / 100
      } else if (String(userColumnWidth).indexOf('%') === -1) {
        barWidth = parseInt(userColumnWidth, 10)
      } else {
        barWidth *= parseInt(userColumnWidth, 10) / 100
      }

      if (this.isReversed) {
        zeroH = this.baseLineY[translationsIndex]
      } else {
        zeroH = w.layout.gridHeight - this.baseLineY[translationsIndex]
      }

      // initial x position is the left-most edge of the first bar relative to
      // the left-most side of the grid area.
      x = w.globals.padHorizontal + (xDivision - barWidth) / 2
    }

    // Up to this point, barWidth is the width that will accommodate all bars
    // at each datapoint or category.

    // The crude subdivision here assumes the series within each group are
    // stacked. If there is no stacking then the barWidth/barHeight is
    // further divided later by the number of series in the group. So, eg, two
    // groups of three series would become six bars side-by-side unstacked,
    // or two bars stacked.
    const subDivisions = w.globals.barGroups.length || 1

    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight: barHeight / subDivisions,
      barWidth: barWidth / subDivisions,
      zeroH,
      zeroW,
    }
  }

  drawStackedBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    columnGroupIndex,
    seriesGroup,
    yDivision,
    elSeries,
  }) {
    const w = this.w
    const barYPosition = y + columnGroupIndex * barHeight
    let barXPosition
    const i = indexes.i
    const j = indexes.j
    const realIndex = indexes.realIndex
    const translationsIndex = indexes.translationsIndex

    let prevBarW = 0
    for (let k = 0; k < this.groupCtx.prevXF.length; k++) {
      prevBarW = prevBarW + this.groupCtx.prevXF[k][j]
    }

    let gsi = i // an index to keep track of the series inside a group
    if (w.config.series[realIndex].name) {
      gsi = seriesGroup.indexOf(w.config.series[realIndex].name)
    }

    if (gsi > 0) {
      let bXP = zeroW

      if (this.groupCtx.prevXVal[gsi - 1][j] < 0) {
        bXP =
          this.series[i][j] >= 0
            ? this.groupCtx.prevX[gsi - 1][j] +
              prevBarW -
              (this.isReversed ? prevBarW : 0) * 2
            : this.groupCtx.prevX[gsi - 1][j]
      } else if (this.groupCtx.prevXVal[gsi - 1][j] >= 0) {
        bXP =
          this.series[i][j] >= 0
            ? this.groupCtx.prevX[gsi - 1][j]
            : this.groupCtx.prevX[gsi - 1][j] -
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
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      seriesGroup,
      i,
      j,
      w,
    })

    this.barHelpers.barBackground({
      j,
      i,
      y1: barYPosition,
      y2: barHeight,
      elSeries,
    })

    y = y + yDivision

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalX: this.barHelpers.getGoalValues(
        'x',
        zeroW,
        null,
        i,
        j,
        translationsIndex
      ),
      barXPosition,
      barYPosition,
      x,
      y,
    }
  }

  drawStackedColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    columnGroupIndex,
    seriesGroup,
    elSeries,
  }) {
    const w = this.w
    const i = indexes.i
    const j = indexes.j
    const bc = indexes.bc
    const realIndex = indexes.realIndex
    const translationsIndex = indexes.translationsIndex

    if (w.axisFlags.isXNumeric) {
      let seriesVal = w.seriesData.seriesX[realIndex][j]
      if (!seriesVal) seriesVal = 0
      // TODO: move the barWidth factor to barXPosition
      x =
        (seriesVal - w.globals.minX) / this.xRatio -
        (barWidth / 2) * w.globals.barGroups.length
    }

    const barXPosition = x + columnGroupIndex * barWidth
    let barYPosition

    let prevBarH = 0
    for (let k = 0; k < this.groupCtx.prevYF.length; k++) {
      // fix issue #1215
      // in case where this.groupCtx.prevYF[k][j] is NaN, use 0 instead
      prevBarH =
        prevBarH +
        (!isNaN(this.groupCtx.prevYF[k][j]) ? this.groupCtx.prevYF[k][j] : 0)
    }

    let gsi = i // an index to keep track of the series inside a group
    if (seriesGroup) {
      gsi = seriesGroup.indexOf(w.seriesData.seriesNames[realIndex])
    }
    if (
      (gsi > 0 && !w.axisFlags.isXNumeric) ||
      (gsi > 0 &&
        w.axisFlags.isXNumeric &&
        w.seriesData.seriesX[realIndex - 1][j] === w.seriesData.seriesX[realIndex][j])
    ) {
      let bYP
      let prevYValue
      const p = Math.min(this.yRatio.length + 1, realIndex + 1)
      if (
        this.groupCtx.prevY[gsi - 1] !== undefined &&
        this.groupCtx.prevY[gsi - 1].length
      ) {
        for (let ii = 1; ii < p; ii++) {
          if (!isNaN(this.groupCtx.prevY[gsi - ii]?.[j])) {
            // find the previous available value to give prevYValue
            prevYValue = this.groupCtx.prevY[gsi - ii][j]
            // if found it, break the loop
            break
          }
        }
      }

      for (let ii = 1; ii < p; ii++) {
        // find the previous available value(non-NaN) to give bYP
        if (this.groupCtx.prevYVal[gsi - ii]?.[j] < 0) {
          bYP =
            this.series[i][j] >= 0
              ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2
              : prevYValue
          // found it? break the loop
          break
        } else if (this.groupCtx.prevYVal[gsi - ii]?.[j] >= 0) {
          bYP =
            this.series[i][j] >= 0
              ? prevYValue
              : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2
          // found it? break the loop
          break
        }
      }

      if (typeof bYP === 'undefined') bYP = w.layout.gridHeight

      // if this.prevYF[0] is all 0 resulted from line #486
      // AND every arr starting from the second only contains NaN
      if (
        this.groupCtx.prevYF[0]?.every((val) => val === 0) &&
        this.groupCtx.prevYF
          .slice(1, gsi)
          .every((arr) => arr.every((val) => isNaN(val)))
      ) {
        barYPosition = zeroH
      } else {
        // Nothing special
        barYPosition = bYP
      }
    } else {
      // the first series will not have prevY values, also if the prev index's
      // series X doesn't matches the current index's series X, then start from
      // zero
      barYPosition = zeroH
    }

    if (this.series[i][j]) {
      y =
        barYPosition -
        this.series[i][j] / this.yRatio[translationsIndex] +
        (this.isReversed
          ? this.series[i][j] / this.yRatio[translationsIndex]
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
      yRatio: this.yRatio[translationsIndex],
      strokeWidth: this.strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      seriesGroup,
      realIndex: indexes.realIndex,
      i,
      j,
      w,
    })

    this.barHelpers.barBackground({
      bc,
      j,
      i,
      x1: barXPosition,
      x2: barWidth,
      elSeries,
    })

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalY: this.barHelpers.getGoalValues('y', null, zeroH, i, j),
      barXPosition,
      x: w.axisFlags.isXNumeric ? x : x + xDivision,
      y,
    }
  }
}

export default BarStacked
