// @ts-check
import BarDataLabels from './common/bar/DataLabels'
import BarHelpers from './common/bar/Helpers'
import CoreUtils from '../modules/CoreUtils'
import Utils from '../utils/Utils'
import Filters from '../modules/Filters'
import Graphics from '../modules/Graphics'
import { computeStagger } from '../modules/Animations'
import {
  datumKey,
  lengthTransitionEnabled,
  renderBarExitGhosts,
} from '../modules/animations/LengthTransition'
import Series from '../modules/Series'
import { seriesEmitter } from '../renderers/Renderer'

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
    this.isPyramid = this.barOptions.isPyramid
    /** @type {null | { y: number, height: number, topHalf: number, bottomHalf: number }[]} */
    this.pyramidLayout = null
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
    /** @type {Record<number, Map<string, any> | null> | null} */
    this._prevKeyed = null
    /** @type {Record<number, boolean> | null} */
    this._ltCache = null

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

      if (this.isPyramid) {
        // Recompute the per-segment trapezoid layout once per series, before
        // drawing any of its segments. Each entry yields the segment's top
        // y / height / top-half-width / bottom-half-width, derived from the
        // running cumulative share of the series total.
        this.pyramidLayout = this.barHelpers.computePyramidLayout(series[i])
      }

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
        // On a layout-changing update the labels must stay hidden through the
        // reflow morph (the updateOptions flow otherwise reveals them at
        // frame 0, where they float over sliding bars).
        holdUntilComplete: this.isLengthTransition(realIndex),
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
          !this.isPyramid &&
          this.barOptions.isFunnel3d &&
          w.config.plotOptions.funnel?.shape !== 'trapezoid' &&
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

      // Exit ghosts: previous datums whose keys are gone shrink to their
      // baseline edge and fade under the reflowing survivors.
      if (w.globals.previousPaths.length > 0) {
        const newKeys = []
        for (let j = 0; j < series[i].length; j++) {
          newKeys.push(datumKey(w, realIndex, j))
        }
        renderBarExitGhosts({
          w,
          elSeries,
          record: this._prevRecord(realIndex),
          newKeys,
          isHorizontal: this.isHorizontal,
          speed: w.config.chart.animations.dynamicAnimation.speed,
        })
      }

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
    // Strata (#2): the bar body path emits through the active renderer (canvas
    // records per-bar paths). Goal-line markers / shadows stay SVG.
    const emit = seriesEmitter(this.ctx, graphics)
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

    // Per-bar stagger delay. The base step is auto-scaled so total stagger
    // (across all bars in a row/column) caps at ~half the animation speed —
    // a 5-bar chart and a 50-bar chart finish in similar wall-clock time.
    // For stacked bars: bottom layers (lower `i`) animate first, top layers
    // cascade on a smaller offset so each stack visibly "builds up".
    //
    // Note: animatePathsGradually() multiplies the passed `animationDelay` by
    // `animateGradually.delay` (the "delayFactor"). To express the stagger in
    // real milliseconds we divide by that factor here so the multiplication
    // cancels — otherwise a 40ms intended delay would become 40×150=6000ms.
    const animCfg = w.config.chart.animations
    const gradCfg = animCfg.animateGradually
    // Layout-changing updates (points entered/exited) run every survivor on
    // one shared clock: staggered starts read as incoherent churn when bars
    // are also sliding to new slots. Pure value updates keep the stagger.
    const staggerEnabled =
      gradCfg &&
      gradCfg.enabled !== false &&
      !(w.globals.dataChanged && this.isLengthTransition(realIndex))
    let delay = 0
    if (staggerEnabled) {
      const totalBars = w.globals.dataPoints || 1
      const configStep = gradCfg.delay || 0
      const baseDelayMs = Math.min(
        configStep,
        (animCfg.speed * 0.5) / Math.max(1, totalBars),
      )
      let delayMs = computeStagger({
        style: 'sequential',
        index: j,
        baseDelay: baseDelayMs,
      })
      if (w.config.chart.stacked) {
        delayMs += i * baseDelayMs * 0.5
      }
      // Convert ms → delayFactor units so animatePathsGradually's
      // `delay * delayFactor` reproduces our intended ms delay.
      const delayFactor = configStep || 1
      delay = delayMs / delayFactor
    }

    if (!skipDrawing) {
      // Cross-type morph (e.g. pie → bar) uses its own dedicated speed so the
      // transition reads as a distinct step rather than blending into the
      // default dataChange tempo. No-op when the morph feature isn't loaded.
      const morphActive = this.ctx.morphTypeChange?.isActive() === true
      const dataChangeSpeed = morphActive
        ? this.ctx.morphTypeChange.getSpeed()
        : w.config.chart.animations.dynamicAnimation.speed

      const renderedPath = /** @type {any} */ (
        emit.renderPaths({
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
          dataChangeSpeed,
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
        // Datum identity for the next update's keyed join (see
        // LengthTransition): survivors match by key, not array position.
        'data:pathKey': datumKey(w, realIndex, j),
      })

      // Strata (#2): canvas paints the bar/candle to a bitmap, so there is no
      // path node for the tooltip positioner to read cx/cy/barWidth off. Cache
      // the same values here (keyed by realIndex + j); moveStickyTooltipOverBars
      // falls back to this when the DOM node is absent.
      if (emit.kind === 'canvas') {
        if (!w.globals.barCanvasCoords) w.globals.barCanvasCoords = {}
        if (!w.globals.barCanvasCoords[realIndex]) {
          w.globals.barCanvasCoords[realIndex] = {}
        }
        w.globals.barCanvasCoords[realIndex][j] = {
          cx: dataLabelsObj.dataLabelsPos.bcx,
          cy: dataLabelsObj.dataLabelsPos.bcy,
          barWidth,
        }
      }

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

    const useTrapezoid =
      this.isFunnel && w.config.plotOptions.funnel.shape === 'trapezoid'
    const pyramidSeg =
      this.isPyramid && this.pyramidLayout ? this.pyramidLayout[j] : null
    const usePyramid = !!pyramidSeg

    if (pyramidSeg) {
      // Pyramid stages own their own y / barHeight (cumulative-share based);
      // ignore the equal-height layout that drawBarPaths computed above.
      barYPosition = pyramidSeg.y
      barHeight = pyramidSeg.height
    } else if (this.isFunnel && !useTrapezoid) {
      const _zeroW = zeroW ?? 0
      zeroW =
        _zeroW -
        /** @type {number} */ (
          /** @type {any} */ (
            this.barHelpers.getXForValue(
              /** @type {any} */ (this.series)[i][j],
              _zeroW,
            )
          ) - _zeroW
        ) /
          2
    }

    x = this.barHelpers.getXForValue(
      /** @type {any} */ (this.series)[i][j],
      zeroW ?? 0,
    )

    let paths
    if (pyramidSeg) {
      paths = /** @type {any} */ (
        this.barHelpers.getPyramidPaths({
          barYPosition,
          barHeight,
          topHalf: pyramidSeg.topHalf,
          bottomHalf: pyramidSeg.bottomHalf,
          realIndex: indexes.realIndex,
          j,
          strokeWidth,
          w,
        })
      )
    } else if (useTrapezoid) {
      paths = /** @type {any} */ (
        this.barHelpers.getFunnelTrapezoidPaths({
          barYPosition,
          barHeight,
          series: /** @type {any} */ (this.series),
          i,
          j,
          realIndex: indexes.realIndex,
          strokeWidth,
          w,
        })
      )
    } else {
      paths = /** @type {any} */ (
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
    }

    if (useTrapezoid || usePyramid) {
      // These shapes own their own left/right edges; expose them to downstream
      // code (goal lines, dataLabel positioning) so it uses the actual
      // segment geometry instead of the bar-style x1/x derived above.
      zeroW = paths.x1
      x = paths.x
    }

    if (!w.axisFlags.isXNumeric && !usePyramid) {
      y = y + yDivision
    }

    if (usePyramid) {
      // Pyramid stages have variable heights, so the standard equal-step
      // `y += yDivision` advance doesn't apply. Point `y` at the current
      // segment's top so `w.globals.seriesYvalues` — pushed below as
      // `yArrj.push(y)` and read by tooltip/hover code — reflects each
      // segment's actual position instead of the leftover initialPositions
      // seed.
      y = barYPosition
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

  /**
   * The captured previous-render record for a series (last match wins, same
   * as the historical scan order).
   *
   * @param {number} realIndex
   * @returns {any | null}
   */
  _prevRecord(realIndex) {
    const w = this.w
    let record = null
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp]
      if (
        gpp.paths &&
        gpp.paths.length > 0 &&
        parseInt(gpp.realIndex, 10) === parseInt(String(realIndex), 10)
      ) {
        record = gpp
      }
    }
    return record
  }

  /**
   * Previous paths of a series re-keyed by datum key (stamped as
   * `data:pathKey` on each bar path and captured by Series.getPreviousPaths).
   * Returns null when the previous render carries no keys (so the caller
   * falls back to positional matching).
   *
   * @param {number} realIndex
   * @returns {Map<string, {d: string}> | null}
   */
  _prevKeyedPaths(realIndex) {
    if (!this._prevKeyed) this._prevKeyed = {}
    if (this._prevKeyed[realIndex] !== undefined) {
      return this._prevKeyed[realIndex]
    }
    const record = this._prevRecord(realIndex)
    /** @type {Map<string, any> | null} */
    let map = null
    if (record && record.paths.every((/** @type {any} */ p) => p.key != null)) {
      const keyed = new Map()
      record.paths.forEach((/** @type {any} */ p) => {
        keyed.set(p.key, p)
      })
      map = keyed
    }
    this._prevKeyed[realIndex] = map
    return map
  }

  /**
   * Whether this series' update changes its datum layout (points entered,
   * exited, or changed identity). Layout-changing updates run all survivors
   * on one shared clock (no per-bar stagger) so the reflow reads as a single
   * coordinated motion; pure value updates keep the stagger.
   *
   * @param {number} realIndex
   * @returns {boolean}
   */
  isLengthTransition(realIndex) {
    if (!this._ltCache) this._ltCache = {}
    if (this._ltCache[realIndex] !== undefined) return this._ltCache[realIndex]

    const w = this.w
    let result = false
    if (lengthTransitionEnabled(w) && w.globals.previousPaths.length > 0) {
      const record = this._prevRecord(realIndex)
      const dataLen = w.seriesData.series[realIndex]?.length ?? 0
      if (!record) {
        result = dataLen > 0 // a brand-new series entering
      } else if (record.paths.length !== dataLen) {
        result = true
      } else {
        const keyed = this._prevKeyedPaths(realIndex)
        if (keyed) {
          for (let j = 0; j < dataLen; j++) {
            if (!keyed.has(datumKey(w, realIndex, j))) {
              result = true
              break
            }
          }
        }
      }
    }
    this._ltCache[realIndex] = result
    return result
  }

  /**
   * Resolve `pathFrom` for a bar on data update, joining old and new datums
   * by KEY (category label / x value) so survivors keep their identity across
   * inserts, prepends, and removals. Three outcomes:
   *
   *  - survivor with stable shape → the previous `d` (smooth reflow morph);
   *  - survivor whose command count changed (corner state flipped, e.g. bar
   *    became new top-of-stack) → `pathTo` (pathFrom === pathTo, a snap);
   *  - genuinely new datum (key absent from the previous render, or the whole
   *    series is new) → null, telling the path builder to use its
   *    grow-from-baseline enter path.
   *
   * Falls back to positional (index j) matching when the previous render
   * carries no datum keys.
   *
   * @param {number} realIndex - stable series index from `data:realIndex`
   * @param {number} j - data-point index within the series
   * @param {string} pathTo - the freshly-built path for this bar (post-roundPathCorners)
   * @returns {string | null}
   **/
  getPreviousPath(realIndex, j, pathTo) {
    const w = this.w
    const record = this._prevRecord(realIndex)
    if (!record) {
      // The series itself is new: enter from the baseline when this render is
      // an animated length transition; otherwise keep the historical snap.
      return lengthTransitionEnabled(w) ? null : pathTo
    }

    let oldD = null
    let isNewDatum = false
    const keyed = this._prevKeyedPaths(realIndex)
    if (keyed) {
      const prev = keyed.get(datumKey(w, realIndex, j))
      if (prev) {
        oldD = prev.d
      } else {
        isNewDatum = true
      }
    } else if (typeof record.paths[j] !== 'undefined') {
      oldD = record.paths[j].d
    } else {
      isNewDatum = true
    }

    if (oldD && Bar.pathCommandCount(oldD) === Bar.pathCommandCount(pathTo)) {
      return oldD
    }
    if (isNewDatum && lengthTransitionEnabled(w)) {
      return null
    }
    return pathTo
  }

  /**
   * Count SVG path commands (M, L, C, Q, Z, etc.). Used to detect whether
   * two paths can be morphed safely — SVG.js requires matching command counts.
   *
   * @param {string} d
   * @returns {number}
   */
  static pathCommandCount(d) {
    if (!d) return 0
    const matches = d.match(/[A-Za-z]/g)
    return matches ? matches.length : 0
  }
}

export default Bar
