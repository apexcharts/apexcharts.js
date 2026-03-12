// @ts-check
import BarDataLabels from './common/bar/DataLabels'
import BarHelpers from './common/bar/Helpers'
import CoreUtils from '../modules/CoreUtils'
import Utils from '../utils/Utils'
import Filters from '../modules/Filters'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'

/**
 * ApexCharts Bar Class responsible for drawing both Columns and Bars.
 *
 * @module Bar
 **/

class Bar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w, ctx, xyRatios) {
    this.ctx = ctx
    this.w = w
    this.barOptions = w.config.plotOptions.bar

    this.isHorizontal = this.barOptions.horizontal
    this.strokeWidth = w.config.stroke.width
    this.isNullValue = false

    this.isRangeBar = w.rangeData.seriesRange.length && this.isHorizontal

    this.isVerticalGroupedRangeBar =
      !w.globals.isBarHorizontal &&
      w.rangeData.seriesRange.length &&
      w.config.plotOptions.bar.rangeBarGroupRows

    this.isFunnel = this.barOptions.isFunnel
    this.xyRatios = xyRatios

    /** @type {number} */
    this.xRatio = 0
    /** @type {number[]} */
    this.yRatio = []
    /** @type {number} */
    this.invertedXRatio = 0
    /** @type {number} */
    this.invertedYRatio = 0
    /** @type {number[]} */
    this.baseLineY = []
    /** @type {number} */
    this.baseLineInvertedY = 0

    if (this.xyRatios !== null) {
      this.xRatio = xyRatios.xRatio
      this.yRatio = xyRatios.yRatio
      this.invertedXRatio = xyRatios.invertedXRatio
      this.invertedYRatio = xyRatios.invertedYRatio
      this.baseLineY = xyRatios.baseLineY
      this.baseLineInvertedY = xyRatios.baseLineInvertedY
    }
    this.yaxisIndex = 0
    this.translationsIndex = 0
    this.seriesLen = 0
    /** @type {any} */
    this.pathArr = []

    /** @type {any[]} */
    this.series = []
    /** @type {any} */
    this.elSeries = null
    /** @type {number} */
    this.visibleI = 0
    /** @type {boolean} */
    this.isReversed = false

    const ser = new Series(this.w)
    this.lastActiveBarSerieIndex = ser.getActiveConfigSeriesIndex('desc', [
      'bar',
      'column',
    ])

    this.columnGroupIndices = []
    const barSeriesIndices = ser.getBarSeriesIndices()
    const coreUtils = new CoreUtils(this.w)
    this.stackedSeriesTotals = coreUtils.getStackedSeriesTotals(
      this.w.config.series
        /**
         * @param {any} s
         * @param {number} i
         */
        .map((s, i) => {
          return barSeriesIndices.indexOf(i) === -1 ? i : -1
        })
        /**
         * @param {any} s
         */
        .filter((s) => {
          return s !== -1
        }),
    )

    this.barHelpers = new BarHelpers(this)
  }

  /** primary draw method which is called on bar object
   * @memberof Bar
   * @param {any[]} series - user supplied series values
   * @param {number} seriesIndex - the index by which series will be drawn on the svg
   * @return {Element} element which is supplied to parent chart draw method for appending
   **/
  draw(series, seriesIndex) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const coreUtils = new CoreUtils(this.w)
    series = coreUtils.getLogSeries(series)
    this.series = series
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series)

    const ret = graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series',
    })

    if (w.config.dataLabels.enabled) {
      // @ts-ignore — totalItems is set dynamically by bar/Helpers.js initializePoints()
      if (this.totalItems > this.barOptions.dataLabels.maxItems) {
        console.warn(
          'WARNING: DataLabels are enabled but there are too many to display. This may cause performance issue when rendering - ApexCharts',
        )
      }
    }

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let x, y

      const yArrj = [] // hold y values of current iterating series
      const xArrj = [] // hold x values of current iterating series

      const realIndex = w.globals.comboCharts
        ? /** @type {any} */ (seriesIndex)[i]
        : i

      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex)

      // el to which series will be drawn
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        rel: i + 1,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        'data:realIndex': realIndex,
      })

      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex)

      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1
      }

      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex]
        this.translationsIndex = realIndex
      }
      const translationsIndex = this.translationsIndex

      this.isReversed =
        w.config.yaxis[this.yaxisIndex] &&
        w.config.yaxis[this.yaxisIndex].reversed

      const initPositions = this.barHelpers.initialPositions(realIndex)
      const {
        y: initY,
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroW, // zeroW is the baseline where 0 meets x axis
        x: initX,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        zeroH, // zeroH is the baseline where 0 meets y axis
      } = initPositions
      let barHeight = initPositions.barHeight
      let barWidth = initPositions.barWidth

      y = initY
      x = initX

      if (!this.isHorizontal) {
        xArrj.push(x + (barWidth ?? 0) / 2)
      }

      // eldatalabels
      const elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex,
      })

      w.globals.delayedElements.push({
        el: elDataLabelsWrap.node,
      })
      elDataLabelsWrap.node.classList.add('apexcharts-element-hidden')

      const elGoalsMarkers = graphics.group({
        class: 'apexcharts-bar-goals-markers',
      })

      const elBarShadows = graphics.group({
        class: 'apexcharts-bar-shadows',
      })

      w.globals.delayedElements.push({
        el: elBarShadows.node,
      })
      elBarShadows.node.classList.add('apexcharts-element-hidden')

      for (let j = 0; j < series[i].length; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)

        let paths = /** @type {any} */ (null)
        const pathsParams = {
          indexes: {
            i,
            j,
            realIndex,
            translationsIndex,
            bc,
          },
          x,
          y,
          strokeWidth,
          elSeries,
        }
        if (this.isHorizontal) {
          paths = this.drawBarPaths({
            ...pathsParams,
            barHeight,
            zeroW,
            yDivision,
          })
          barWidth = this.series[i][j] / this.invertedYRatio
        } else {
          paths = this.drawColumnPaths({
            ...pathsParams,
            xDivision,
            barWidth,
            zeroH,
          })
          barHeight = this.series[i][j] / this.yRatio[translationsIndex]
        }

        const pathFill = this.barHelpers.getPathFillColor(
          series,
          i,
          j,
          realIndex,
        )

        if (
          this.isFunnel &&
          this.barOptions.isFunnel3d &&
          this.pathArr.length &&
          j > 0
        ) {
          const barShadow = this.barHelpers.drawBarShadow({
            color:
              typeof pathFill.color === 'string' &&
              pathFill.color?.indexOf('url') === -1
                ? pathFill.color
                : Utils.hexToRgba(w.globals.colors[i]),
            prevPaths: this.pathArr[this.pathArr.length - 1],
            currPaths: paths,
            realIndex,
            j,
          })

          elBarShadows.add(barShadow)

          if (w.config.chart.dropShadow.enabled) {
            const filters = new Filters(this.w)
            filters.dropShadow(barShadow, w.config.chart.dropShadow, realIndex)
          }
        }
        this.pathArr.push(paths)

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

        // push current X
        if (j > 0) {
          xArrj.push(x + (barWidth ?? 0) / 2)
        }

        yArrj.push(y)

        this.renderSeries({
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
          barHeight: Math.abs(paths.barHeight ? paths.barHeight : barHeight),
          barWidth: Math.abs(paths.barWidth ? paths.barWidth : barWidth),
          elDataLabelsWrap,
          elGoalsMarkers,
          elBarShadows,
          visibleSeries: this.visibleI,
          type: 'bar',
        })
      }

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrj
      w.globals.seriesYvalues[realIndex] = yArrj

      ret.add(elSeries)
    }

    return ret
  }

  /** @param {{ realIndex?: any, pathFill?: any, lineFill?: any, j?: any, i?: any, columnGroupIndex?: any, pathFrom?: any, pathTo?: any, strokeWidth?: any, elSeries?: any, x?: any, y?: any, y1?: any, y2?: any, series?: any, barHeight?: any, barWidth?: any, barXPosition?: any, barYPosition?: any, elDataLabelsWrap?: any, elGoalsMarkers?: any, elBarShadows?: any, visibleSeries?: any, type?: any, classes?: any }} opts */
  renderSeries({
    realIndex,
    pathFill,
    lineFill,
    j,
    i,
    columnGroupIndex,
    pathFrom,
    pathTo,
    strokeWidth,
    elSeries,
    x, // x pos
    y, // y pos
    y1, // absolute value
    y2, // absolute value
    series,
    barHeight,
    barWidth,
    barXPosition,
    barYPosition,
    elDataLabelsWrap,
    elGoalsMarkers,
    elBarShadows,
    visibleSeries,
    type,
    classes,
  }) {
    const w = this.w
    const graphics = new Graphics(this.w, this.ctx)
    let skipDrawing = false

    // Set up event delegation once per series group instead of per-element listeners
    if (!elSeries._bindingsDelegated) {
      elSeries._bindingsDelegated = true
      graphics.setupEventDelegation(elSeries, `.apexcharts-${type}-area`)
    }

    if (!lineFill) {
      // if user provided a function in colors, we need to eval here
      // Note: the position of this function logic (ex. stroke: { colors: ["",function(){}] }) i.e array index 1 depicts the realIndex/seriesIndex.
      /**
       * @param {number} i
       */
      function fetchColor(i) {
        const exp = w.config.stroke.colors
        let c
        if (Array.isArray(exp) && exp.length > 0) {
          c = exp[i]
          if (!c) c = ''
          if (typeof c === 'function') {
            return c({
              value: w.seriesData.series[i][j],
              dataPointIndex: j,
              w,
            })
          }
        }
        return c
      }

      const checkAvailableColor =
        typeof w.globals.stroke.colors[realIndex] === 'function'
          ? fetchColor(realIndex)
          : w.globals.stroke.colors[realIndex]

      /* fix apexcharts#341 */
      lineFill = this.barOptions.distributed
        ? w.globals.stroke.colors[j]
        : checkAvailableColor
    }

    const barDataLabels = new BarDataLabels(this)
    const dataLabelsObj = /** @type {any} */ (
      barDataLabels.handleBarDataLabels({
        x,
        y,
        y1,
        y2,
        i,
        j,
        series,
        realIndex,
        columnGroupIndex,
        barHeight,
        barWidth,
        barXPosition,
        barYPosition,
        visibleSeries,
      })
    )

    if (!w.globals.isBarHorizontal) {
      if (
        dataLabelsObj.dataLabelsPos.dataLabelsX +
          Math.max(barWidth, w.globals.barPadForNumericAxis) <
          0 ||
        dataLabelsObj.dataLabelsPos.dataLabelsX -
          Math.max(barWidth, w.globals.barPadForNumericAxis) >
          w.layout.gridWidth
      ) {
        skipDrawing = true
      }
    }

    if (
      /** @type {Record<string,any>} */ (w.config.series[i]).data[j] &&
      /** @type {Record<string,any>} */ (w.config.series[i]).data[j].strokeColor
    ) {
      lineFill = /** @type {Record<string,any>} */ (w.config.series[i]).data[j]
        .strokeColor
    }

    if (this.isNullValue) {
      pathFill = 'none'
    }

    const delay =
      ((j / w.config.chart.animations.animateGradually.delay) *
        (w.config.chart.animations.speed / w.globals.dataPoints)) /
      2.4

    if (!skipDrawing) {
      const renderedPath = /** @type {any} */ (
        graphics.renderPaths({
          i,
          j,
          realIndex,
          pathFrom,
          pathTo,
          stroke: lineFill,
          strokeWidth,
          strokeLineCap: w.config.stroke.lineCap,
          fill: pathFill,
          animationDelay: delay,
          initialSpeed: w.config.chart.animations.speed,
          dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
          className: `apexcharts-${type}-area ${classes}`,
          chartType: type,
          bindEventsOnPaths: false,
        })
      )

      renderedPath.attr('clip-path', `url(#gridRectBarMask${w.globals.cuid})`)

      const forecast = w.config.forecastDataPoints
      if (forecast.count > 0) {
        if (j >= w.globals.dataPoints - forecast.count) {
          renderedPath.node.setAttribute('stroke-dasharray', forecast.dashArray)
          renderedPath.node.setAttribute('stroke-width', forecast.strokeWidth)
          renderedPath.node.setAttribute('fill-opacity', forecast.fillOpacity)
        }
      }

      if (typeof y1 !== 'undefined' && typeof y2 !== 'undefined') {
        renderedPath.attr('data-range-y1', y1)
        renderedPath.attr('data-range-y2', y2)
      }

      const filters = new Filters(this.w)
      filters.setSelectionFilter(renderedPath, realIndex, j)
      elSeries.add(renderedPath)

      renderedPath.attr({
        cy: dataLabelsObj.dataLabelsPos.bcy,
        cx: dataLabelsObj.dataLabelsPos.bcx,
        j,
        val: w.seriesData.series[i][j],
        barHeight,
        barWidth,
      })

      if (dataLabelsObj.dataLabels !== null) {
        elDataLabelsWrap.add(dataLabelsObj.dataLabels)
      }

      if (dataLabelsObj.totalDataLabels) {
        elDataLabelsWrap.add(dataLabelsObj.totalDataLabels)
      }

      elSeries.add(elDataLabelsWrap)

      if (elGoalsMarkers) {
        elSeries.add(elGoalsMarkers)
      }

      if (elBarShadows) {
        elSeries.add(elBarShadows)
      }
    }

    return elSeries
  }

  /** @param {{indexes: any, barHeight: any, strokeWidth: any, zeroW: any, x: any, y: any, yDivision: any, elSeries: any}} opts */
  drawBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    yDivision,
    elSeries,
  }) {
    const w = this.w

    const i = indexes.i
    const j = indexes.j
    let barYPosition

    if (w.axisFlags.isXNumeric) {
      y =
        (w.seriesData.seriesX[i][j] - w.globals.minX) / this.invertedXRatio -
        barHeight
      barYPosition = y + barHeight * this.visibleI
    } else {
      if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        const { nonZeroColumns, zeroEncounters } =
          this.barHelpers.getZeroValueEncounters({ i, j })

        if (nonZeroColumns > 0) {
          barHeight = (this.seriesLen * barHeight) / nonZeroColumns
        }
        barYPosition = y + barHeight * this.visibleI
        barYPosition -= barHeight * zeroEncounters
      } else {
        barYPosition = y + barHeight * this.visibleI
      }
    }

    if (this.isFunnel) {
      const _zeroW = zeroW ?? 0
      zeroW =
        _zeroW -
        /** @type {number} */ ((
          /** @type {any} */ (
            this.barHelpers.getXForValue(
              /** @type {any} */ (this.series)[i][j],
              _zeroW,
            )
          )
        ) -
          _zeroW) /
          2
    }

    x = this.barHelpers.getXForValue(
      /** @type {any} */ (this.series)[i][j],
      zeroW ?? 0,
    )

    const paths = /** @type {any} */ (
      this.barHelpers.getBarpaths({
        barYPosition,
        barHeight,
        x1: zeroW,
        x2: x,
        strokeWidth,
        isReversed: this.isReversed,
        series: this.series,
        realIndex: indexes.realIndex,
        i,
        j,
        w,
      })
    )

    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision
    }

    this.barHelpers.barBackground({
      j,
      i,
      y1: barYPosition - barHeight * this.visibleI,
      y2: barHeight * this.seriesLen,
      elSeries,
    })

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      x1: zeroW,
      x,
      y,
      goalX: this.barHelpers.getGoalValues(
        'x',
        zeroW,
        /** @type {any} */ (null),
        i,
        j,
        0,
      ),
      barYPosition,
      barHeight,
    }
  }

  /** @param {{indexes: any, x: any, y: any, xDivision: any, barWidth: any, zeroH: any, strokeWidth: any, elSeries: any}} opts */
  drawColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth,
    elSeries,
  }) {
    const w = this.w

    const realIndex = indexes.realIndex
    const translationsIndex = indexes.translationsIndex
    const i = indexes.i
    const j = indexes.j
    const bc = indexes.bc
    let barXPosition

    if (w.axisFlags.isXNumeric) {
      const xForNumericX = this.getBarXForNumericXAxis({
        x,
        j,
        realIndex,
        barWidth,
      })
      x = xForNumericX.x
      barXPosition = xForNumericX.barXPosition
    } else {
      if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        const { nonZeroColumns, zeroEncounters } =
          this.barHelpers.getZeroValueEncounters({ i, j })

        if (nonZeroColumns > 0) {
          barWidth = (this.seriesLen * barWidth) / nonZeroColumns
        }
        barXPosition = x + barWidth * this.visibleI
        barXPosition -= barWidth * zeroEncounters
      } else {
        barXPosition = x + barWidth * this.visibleI
      }
    }

    y = this.barHelpers.getYForValue(
      /** @type {any} */ (this.series)[i][j],
      zeroH,
      translationsIndex,
    )

    const paths = /** @type {any} */ (
      this.barHelpers.getColumnPaths({
        barXPosition,
        barWidth,
        y1: zeroH,
        y2: y,
        strokeWidth,
        isReversed: this.isReversed,
        series: this.series,
        realIndex: realIndex,
        i,
        j,
        w,
      })
    )

    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision
    }

    this.barHelpers.barBackground({
      bc,
      j,
      i,
      x1: barXPosition - strokeWidth / 2 - barWidth * this.visibleI,
      x2: barWidth * this.seriesLen + strokeWidth / 2,
      elSeries,
    })

    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      x,
      y,
      goalY: this.barHelpers.getGoalValues(
        'y',
        /** @type {any} */ (null),
        zeroH,
        i,
        j,
        translationsIndex,
      ),
      barXPosition,
      barWidth,
    }
  }

  /** @param {{x: any, barWidth: any, realIndex: any, j: any}} opts */
  getBarXForNumericXAxis({ x, barWidth, realIndex, j }) {
    const w = this.w
    let sxI = realIndex
    if (!w.seriesData.seriesX[realIndex].length) {
      sxI = w.globals.maxValsInArrayIndex
    }
    if (Utils.isNumber(w.seriesData.seriesX[sxI][j])) {
      x =
        (w.seriesData.seriesX[sxI][j] - w.globals.minX) / this.xRatio -
        (barWidth * this.seriesLen) / 2
    }

    return {
      barXPosition: x + barWidth * this.visibleI,
      x,
    }
  }

  /** getPreviousPath is a common function for bars/columns which is used to get previous paths when data changes.
   * @memberof Bar
   * @param {number} realIndex - current iterating i
   * @param {number} j - current iterating series's j index
   * @return {string} pathFrom is the string which will be appended in animations
   **/
  getPreviousPath(realIndex, j) {
    const w = this.w
    let pathFrom = 'M 0 0'
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp]

      if (
        gpp.paths &&
        gpp.paths.length > 0 &&
        parseInt(gpp.realIndex, 10) === parseInt(String(realIndex), 10)
      ) {
        if (typeof w.globals.previousPaths[pp].paths[j] !== 'undefined') {
          pathFrom = w.globals.previousPaths[pp].paths[j].d
        }
      }
    }
    return pathFrom
  }
}

export default Bar
