// @ts-check
import Graphics from '../../../modules/Graphics'
import Series from '../../../modules/Series'
import Fill from '../../../modules/Fill'
import Utils from '../../../utils/Utils'

export default class Helpers {
  /**
   * @param {Record<string, any>} barCtx
   */
  constructor(barCtx) {
    this.w = barCtx.w
    this.barCtx = barCtx
  }

  /**
   * @param {any[]} series
   */
  initVariables(series) {
    const w = this.w
    this.barCtx.series = series
    this.barCtx.totalItems = 0
    this.barCtx.seriesLen = 0
    this.barCtx.visibleI = -1 // visible Series
    this.barCtx.visibleItems = 1 // number of visible bars after user zoomed in/out

    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.barCtx.seriesLen = this.barCtx.seriesLen + 1
        this.barCtx.totalItems += series[sl].length
      }
      if (w.axisFlags.isXNumeric) {
        // get max visible items
        for (let j = 0; j < series[sl].length; j++) {
          if (
            w.seriesData.seriesX[sl][j] > w.globals.minX &&
            w.seriesData.seriesX[sl][j] < w.globals.maxX
          ) {
            this.barCtx.visibleItems++
          }
        }
      } else {
        this.barCtx.visibleItems = w.globals.dataPoints
      }
    }

    this.arrBorderRadius = this.createBorderRadiusArr(w.seriesData.series)

    if (Utils.isSafari()) {
      // https://github.com/apexcharts/apexcharts.js/issues/4996
      // to temporarily fix the above issue, border radius is disabled
      /**
       * @param {any[]} brArr
       */
      this.arrBorderRadius = this.arrBorderRadius.map((/** @type {any} */ brArr) =>
        /**
         * @param {any} _
         */
        brArr.map((/** @type {any} */ _) => 'none')
      )
    }

    if (this.barCtx.seriesLen === 0) {
      // A small adjustment when combo charts are used
      this.barCtx.seriesLen = 1
    }
    this.barCtx.zeroSerieses = []

    if (!w.globals.comboCharts) {
      this.checkZeroSeries({ series })
    }
  }

  /**
   * @param {number} realIndex
   */
  initialPositions(realIndex) {
    const w = this.w
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW

    let dataPoints = w.globals.dataPoints
    if (this.barCtx.isRangeBar) {
      // timeline rangebar chart
      dataPoints = w.labelData.labels.length
    }

    let seriesLen = this.barCtx.seriesLen
    if (w.config.plotOptions.bar.rangeBarGroupRows) {
      seriesLen = 1
    }

    if (this.barCtx.isHorizontal) {
      // height divided into equal parts
      yDivision = w.layout.gridHeight / dataPoints
      barHeight = yDivision / seriesLen

      if (w.axisFlags.isXNumeric) {
        yDivision = w.layout.gridHeight / this.barCtx.totalItems
        barHeight = yDivision / this.barCtx.seriesLen
      }

      barHeight =
        (barHeight * parseInt(this.barCtx.barOptions.barHeight, 10)) / 100

      if (String(this.barCtx.barOptions.barHeight).indexOf('%') === -1) {
        barHeight = parseInt(this.barCtx.barOptions.barHeight, 10)
      }

      zeroW =
        this.barCtx.baseLineInvertedY +
        w.globals.padHorizontal +
        (this.barCtx.isReversed ? w.layout.gridWidth : 0) -
        (this.barCtx.isReversed ? this.barCtx.baseLineInvertedY * 2 : 0)

      if (this.barCtx.isFunnel) {
        zeroW = w.layout.gridWidth / 2
      }
      y = (yDivision - barHeight * this.barCtx.seriesLen) / 2
    } else {
      // width divided into equal parts
      xDivision = w.layout.gridWidth / this.barCtx.visibleItems
      if (w.config.xaxis.convertedCatToNumeric) {
        xDivision = w.layout.gridWidth / w.globals.dataPoints
      }
      barWidth =
        ((xDivision / seriesLen) *
          parseInt(this.barCtx.barOptions.columnWidth, 10)) /
        100

      if (w.axisFlags.isXNumeric) {
        // max barwidth should be equal to minXDiff to avoid overlap
        const xRatio = this.barCtx.xRatio

        if (
          w.globals.minXDiff &&
          w.globals.minXDiff !== 0.5 &&
          w.globals.minXDiff / xRatio > 0
        ) {
          xDivision = w.globals.minXDiff / xRatio
        }

        barWidth =
          ((xDivision / seriesLen) *
            parseInt(this.barCtx.barOptions.columnWidth, 10)) /
          100

        if (barWidth < 1) {
          barWidth = 1
        }
      }
      if (String(this.barCtx.barOptions.columnWidth).indexOf('%') === -1) {
        barWidth = parseInt(this.barCtx.barOptions.columnWidth, 10)
      }

      zeroH =
        w.layout.gridHeight -
        this.barCtx.baseLineY[this.barCtx.translationsIndex] -
        (this.barCtx.isReversed ? w.layout.gridHeight : 0) +
        (this.barCtx.isReversed
          ? this.barCtx.baseLineY[this.barCtx.translationsIndex] * 2
          : 0)

      if (w.axisFlags.isXNumeric) {
        const xForNumericX = this.barCtx.getBarXForNumericXAxis({
          x,
          j: 0,
          realIndex,
          barWidth,
        })
        x = xForNumericX.x
      } else {
        x =
          w.globals.padHorizontal +
          Utils.noExponents(xDivision - barWidth * this.barCtx.seriesLen) / 2
      }
    }

    w.globals.barHeight = barHeight
    w.globals.barWidth = barWidth

    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight,
      barWidth,
      zeroH,
      zeroW,
    }
  }

  /**
   * @param {Record<string, any>} ctx
   */
  initializeStackedPrevVars(ctx) {
    const w = ctx.w
    /**
     * @param {Element} group
     */
    w.labelData.seriesGroups.forEach((/** @type {any} */ group) => {
      if (!ctx[group]) ctx[group] = {}

      ctx[group].prevY = []
      ctx[group].prevX = []
      ctx[group].prevYF = []
      ctx[group].prevXF = []
      ctx[group].prevYVal = []
      ctx[group].prevXVal = []
    })
  }

  /**
   * @param {Record<string, any>} ctx
   */
  initializeStackedXYVars(ctx) {
    const w = ctx.w

    /**
     * @param {Element} group
     */
    w.labelData.seriesGroups.forEach((/** @type {any} */ group) => {
      if (!ctx[group]) ctx[group] = {}

      ctx[group].xArrj = []
      ctx[group].xArrjF = []
      ctx[group].xArrjVal = []
      ctx[group].yArrj = []
      ctx[group].yArrjF = []
      ctx[group].yArrjVal = []
    })
  }

  /**
   * @param {any[]} series
   * @param {number} i
   * @param {number} j
   * @param {number} realIndex
   */
  getPathFillColor(series, i, j, realIndex) {
    const w = this.w
    const fill = new Fill(this.barCtx.w)

    let fillColor = null
    const seriesNumber = this.barCtx.barOptions.distributed ? j : i
    let useRangeColor = false

    if (this.barCtx.barOptions.colors.ranges.length > 0) {
      const colorRange = this.barCtx.barOptions.colors.ranges
      /**
       * @param {number} range
       */
      colorRange.map((/** @type {any} */ range) => {
        if (series[i][j] >= range.from && series[i][j] <= range.to) {
          fillColor = range.color
          useRangeColor = true
        }
      })
    }

    const pathFill = fill.fillPath({
      seriesNumber: this.barCtx.barOptions.distributed
        ? seriesNumber
        : realIndex,
      dataPointIndex: j,
      color: fillColor,
      value: series[i][j],
      fillConfig: w.config.series[i].data[j]?.fill,
      fillType: w.config.series[i].data[j]?.fill?.type
        ? w.config.series[i].data[j]?.fill.type
        : Array.isArray(w.config.fill.type)
        ? w.config.fill.type[realIndex]
        : w.config.fill.type,
    })

    return {
      color: pathFill,
      useRangeColor,
    }
  }

  /**
   * @param {number} i
   * @param {number} j
   * @param {number} realIndex
   */
  getStrokeWidth(i, j, realIndex) {
    let strokeWidth = 0
    const w = this.w

    if (
      typeof this.barCtx.series[i][j] === 'undefined' ||
      this.barCtx.series[i][j] === null ||
      (w.config.chart.type === 'bar' && !this.barCtx.series[i][j])
    ) {
      this.barCtx.isNullValue = true
    } else {
      this.barCtx.isNullValue = false
    }
    if (w.config.stroke.show) {
      if (!this.barCtx.isNullValue) {
        strokeWidth = Array.isArray(this.barCtx.strokeWidth)
          ? this.barCtx.strokeWidth[realIndex]
          : this.barCtx.strokeWidth
      }
    }
    return strokeWidth
  }

  /**
   * @param {any[]} series
   */
  createBorderRadiusArr(series) {
    const w = this.w

    const alwaysApplyRadius =
      !this.w.config.chart.stacked || w.config.plotOptions.bar.borderRadius <= 0

    const numSeries = series.length
    const numColumns = series[0]?.length | 0
    const output = Array.from({ length: numSeries }, () =>
      Array(numColumns).fill(alwaysApplyRadius ? 'top' : 'none')
    )

    if (alwaysApplyRadius) return output
    
    const chartType = this.w.config.chart.type;

    for (let j = 0; j < numColumns; j++) {
      const positiveIndices = []
      const negativeIndices = []
      let nonZeroCount = 0

      // Collect positive and negative indices
      for (let i = 0; i < numSeries; i++) {
        const value = series[i][j]
        if (value > 0) {
          positiveIndices.push(i)
          nonZeroCount++
        } else if (value < 0) {
          negativeIndices.push(i)
          nonZeroCount++
        }
      }

      if (positiveIndices.length > 0 && negativeIndices.length === 0) {
        // Only positive values in this column
        if (positiveIndices.length === 1) {
          // Single positive value
          output[positiveIndices[0]][j] = (chartType === 'bar' && numColumns === 1) ? 'top' : 'both'
        } else {
          // Multiple positive values
          const firstPositiveIndex = positiveIndices[0]
          const lastPositiveIndex = positiveIndices[positiveIndices.length - 1]
          for (const i of positiveIndices) {
            if (i === firstPositiveIndex) {

              output[i][j] = (chartType === 'bar' && numColumns === 1) ? 'top' : 'bottom'
            } else if (i === lastPositiveIndex) {
              output[i][j] = 'top'
            } else {
              output[i][j] = 'none'
            }
          }
        }
      } else if (negativeIndices.length > 0 && positiveIndices.length === 0) {
        // Only negative values in this column
        if (negativeIndices.length === 1) {
          // Single negative value
          output[negativeIndices[0]][j] = 'both'
        } else {
          // Multiple negative values
          const highestNegativeIndex = Math.max(...negativeIndices)
          const lowestNegativeIndex = Math.min(...negativeIndices)
          for (const i of negativeIndices) {
            if (i === highestNegativeIndex) {
              output[i][j] = 'bottom' // Closest to axis
            } else if (i === lowestNegativeIndex) {
              output[i][j] = 'top' // Farthest from axis
            } else {
              output[i][j] = 'none'
            }
          }
        }
      } else if (positiveIndices.length > 0 && negativeIndices.length > 0) {
        // Mixed positive and negative values
        // Assign 'top' to the last positive bar
        const lastPositiveIndex = positiveIndices[positiveIndices.length - 1]
        for (const i of positiveIndices) {
          if (i === lastPositiveIndex) {
            output[i][j] = 'top'
          } else {
            output[i][j] = 'none'
          }
        }
        // Assign 'bottom' to the highest negative index (closest to axis)
        const highestNegativeIndex = Math.max(...negativeIndices)
        for (const i of negativeIndices) {
          if (i === highestNegativeIndex) {
            output[i][j] = 'bottom'
          } else {
            output[i][j] = 'none'
          }
        }
      } else if (nonZeroCount === 1) {
        // Only one non-zero value (either positive or negative)
        const index = positiveIndices[0] || negativeIndices[0]
        output[index][j] = 'both'
      }
    }

    return output
  }

  /** @param {{ j?: any, i?: any, x1?: any, x2?: any, y1?: any, y2?: any, bc?: any, elSeries?: any }} opts */
  barBackground({ j, i, x1, x2, y1, y2, elSeries }) {
    const w = this.w
    const graphics = new Graphics(this.barCtx.w)

    const sr = new Series(this.barCtx.w)
    const activeSeriesIndex = sr.getActiveConfigSeriesIndex()

    if (
      this.barCtx.barOptions.colors.backgroundBarColors.length > 0 &&
      activeSeriesIndex === i
    ) {
      if (j >= this.barCtx.barOptions.colors.backgroundBarColors.length) {
        j %= this.barCtx.barOptions.colors.backgroundBarColors.length
      }

      const bcolor = this.barCtx.barOptions.colors.backgroundBarColors[j]
      const rect = graphics.drawRect(
        typeof x1 !== 'undefined' ? x1 : 0,
        typeof y1 !== 'undefined' ? y1 : 0,
        typeof x2 !== 'undefined' ? x2 : w.layout.gridWidth,
        typeof y2 !== 'undefined' ? y2 : w.layout.gridHeight,
        this.barCtx.barOptions.colors.backgroundBarRadius,
        bcolor,
        this.barCtx.barOptions.colors.backgroundBarOpacity
      )
      elSeries.add(rect)
      rect.node.classList.add('apexcharts-backgroundBar')
    }
  }

  /** @param {{ barWidth?: any, barXPosition?: any, y1?: any, y2?: any, yRatio?: any, strokeWidth?: any, isReversed?: any, series?: any, seriesGroup?: any, realIndex?: any, i?: any, j?: any, w?: any }} opts */
  getColumnPaths({
    barWidth,
    barXPosition,
    y1,
    y2,
    strokeWidth,
    isReversed,
    series,
    seriesGroup,
    realIndex,
    i,
    j,
    w,
  }) {
    const graphics = new Graphics(this.barCtx.w)
    strokeWidth = Array.isArray(strokeWidth)
      ? strokeWidth[realIndex]
      : strokeWidth
    if (!strokeWidth) strokeWidth = 0

    let bW = barWidth
    let bXP = barXPosition

    if (w.config.series[realIndex].data[j]?.columnWidthOffset) {
      bXP =
        barXPosition - w.config.series[realIndex].data[j].columnWidthOffset / 2
      bW = barWidth + w.config.series[realIndex].data[j].columnWidthOffset
    }

    // Center the stroke on the coordinates
    const strokeCenter = strokeWidth / 2

    const x1 = bXP + strokeCenter
    const x2 = bXP + bW - strokeCenter

    const direction = (series[i][j] >= 0 ? 1 : -1) * (isReversed ? -1 : 1)

    // append tiny pixels to avoid exponentials (which cause issues in border-radius)
    y1 += 0.001 - strokeCenter * direction
    y2 += 0.001 + strokeCenter * direction

    let pathTo = graphics.move(x1, y1)
    let pathFrom = graphics.move(x1, y1)

    const sl = graphics.line(x2, y1)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    pathTo =
      pathTo +
      graphics.line(x1, y2) +
      graphics.line(x2, y2) +
      sl +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z')

    // the lines in pathFrom are repeated to equal it to the points of pathTo
    // this is to avoid weird animation (bug in svg.js)
    pathFrom =
      pathFrom +
      graphics.line(x1, y1) +
      sl +
      sl +
      sl +
      sl +
      sl +
      graphics.line(x1, y1) +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z')

    if (this.arrBorderRadius[realIndex][j] !== 'none') {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      )
    }

    if (w.config.chart.stacked) {
      let _ctx = this.barCtx
      _ctx = this.barCtx[seriesGroup]
      _ctx.yArrj.push(y2 - strokeCenter * direction)
      _ctx.yArrjF.push(Math.abs(y1 - y2 + strokeWidth * direction))
      _ctx.yArrjVal.push(this.barCtx.series[i][j])
    }

    return {
      pathTo,
      pathFrom,
    }
  }

  /**
   * Build a trapezoidal funnel-stage path. Used when
   * `plotOptions.funnel.shape === 'trapezoid'` is active alongside `isFunnel`.
   *
   * Each stage is a 4-corner polygon whose top width matches the current
   * stage's value and bottom width matches the next stage's value, producing
   * continuous sloped sides between consecutive stages.
   *
   * For the last stage, the bottom width is configurable:
   * - `lastShape: 'flat'`  → bottom width = top width (parallel sides)
   * - `lastShape: 'taper'` → bottom width = 0 (taper to a point)
   *
   * @param {{ barYPosition: number, barHeight: number, series: any[][], i: number, j: number, realIndex: number, strokeWidth: number, w: any }} opts
   */
  getFunnelTrapezoidPaths({
    barYPosition,
    barHeight,
    series,
    i,
    j,
    realIndex,
    strokeWidth,
    w,
  }) {
    const graphics = new Graphics(this.barCtx.w)
    const center = w.layout.gridWidth / 2

    /** @param {number} v */
    const halfWidthFor = (v) => Math.abs(v / this.barCtx.invertedYRatio) / 2

    const topHalf = halfWidthFor(series[i][j])

    const lastIdx = series[i].length - 1
    const isLast = j === lastIdx
    const lastShape =
      w.config.plotOptions.funnel.lastShape === 'taper' ? 'taper' : 'flat'

    let bottomHalf
    if (isLast) {
      bottomHalf = lastShape === 'taper' ? 0 : topHalf
    } else {
      bottomHalf = halfWidthFor(series[i][j + 1])
    }

    const strokeCenter = strokeWidth / 2
    const y1 = barYPosition + strokeCenter
    const y2 = barYPosition + barHeight - strokeCenter

    const topLeftX = center - topHalf
    const topRightX = center + topHalf
    const bottomLeftX = center - bottomHalf
    const bottomRightX = center + bottomHalf

    const pathTo =
      graphics.move(topLeftX, y1) +
      graphics.line(topRightX, y1) +
      graphics.line(bottomRightX, y2) +
      graphics.line(bottomLeftX, y2) +
      ' Z'

    let pathFrom = graphics.move(center, y1)
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    } else {
      // Start collapsed at the centerline so the trapezoid expands outward.
      pathFrom =
        graphics.move(center, y1) +
        graphics.line(center, y1) +
        graphics.line(center, y2) +
        graphics.line(center, y2) +
        ' Z'
    }

    return {
      pathTo,
      pathFrom,
      // x is the right edge of the wider (top) side — used by dataLabel
      // positioning helpers that expect a "right" reference.
      x: topRightX,
      x1: topLeftX,
      barXPosition: center,
    }
  }

  /** @param {{ barYPosition?: any, barHeight?: any, x1?: any, x2?: any, strokeWidth?: any, isReversed?: any, series?: any, seriesGroup?: any, realIndex?: any, i?: any, j?: any, w?: any }} opts */
  getBarpaths({
    barYPosition,
    barHeight,
    x1,
    x2,
    strokeWidth,
    isReversed,
    series,
    seriesGroup,
    realIndex,
    i,
    j,
    w,
  }) {
    const graphics = new Graphics(this.barCtx.w)
    strokeWidth = Array.isArray(strokeWidth)
      ? strokeWidth[realIndex]
      : strokeWidth
    if (!strokeWidth) strokeWidth = 0

    let bYP = barYPosition
    let bH = barHeight

    if (w.config.series[realIndex].data[j]?.barHeightOffset) {
      bYP =
        barYPosition - w.config.series[realIndex].data[j].barHeightOffset / 2
      bH = barHeight + w.config.series[realIndex].data[j].barHeightOffset
    }

    // Center the stroke on the coordinates
    const strokeCenter = strokeWidth / 2

    const y1 = bYP + strokeCenter
    const y2 = bYP + bH - strokeCenter

    const direction = (series[i][j] >= 0 ? 1 : -1) * (isReversed ? -1 : 1)

    // append tiny pixels to avoid exponentials (which cause issues in border-radius)
    x1 += 0.001 + strokeCenter * direction
    x2 += 0.001 - strokeCenter * direction

    // Funnel / pyramid (non-trapezoid): the segment expands outward from the
    // chart center rather than growing in from the left edge, matching the
    // trapezoid funnel's natural metaphor of "filling a vessel".
    const isFunnel = this.barCtx.isFunnel
    const fromX = isFunnel ? (x1 + x2) / 2 : x1

    let pathTo = graphics.move(x1, y1)
    let pathFrom = graphics.move(fromX, y1)

    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false)
    }

    const sl = graphics.line(x1, y2)
    pathTo =
      pathTo +
      graphics.line(x2, y1) +
      graphics.line(x2, y2) +
      sl +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z')

    const slFrom = isFunnel ? graphics.line(fromX, y2) : sl
    pathFrom =
      pathFrom +
      graphics.line(fromX, y1) +
      slFrom +
      slFrom +
      slFrom +
      slFrom +
      slFrom +
      graphics.line(fromX, y1) +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z')

    if (this.arrBorderRadius[realIndex][j] !== 'none') {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      )
    }

    if (w.config.chart.stacked) {
      let _ctx = this.barCtx
      _ctx = this.barCtx[seriesGroup]
      _ctx.xArrj.push(x2 + strokeCenter * direction)
      _ctx.xArrjF.push(Math.abs(x1 - x2 - strokeWidth * direction))
      _ctx.xArrjVal.push(this.barCtx.series[i][j])
    }
    return {
      pathTo,
      pathFrom,
    }
  }

  /** @param {{series: any}} opts */
  checkZeroSeries({ series }) {
    const w = this.w
    for (let zs = 0; zs < series.length; zs++) {
      let total = 0
      for (
        let zsj = 0;
        zsj < series[w.globals.maxValsInArrayIndex].length;
        zsj++
      ) {
        total += series[zs][zsj]
      }
      if (total === 0) {
        this.barCtx.zeroSerieses.push(zs)
      }
    }
  }

  /**
   * @param {number} value
   * @param {number} zeroW
   */
  getXForValue(value, zeroW, zeroPositionForNull = true) {
    let xForVal = zeroPositionForNull ? zeroW : null
    if (typeof value !== 'undefined' && value !== null) {
      xForVal =
        zeroW +
        value / this.barCtx.invertedYRatio -
        (this.barCtx.isReversed ? value / this.barCtx.invertedYRatio : 0) * 2
    }
    return xForVal
  }

  /**
   * @param {number} value
   * @param {number} zeroH
   * @param {number} translationsIndex
   */
  getYForValue(value, zeroH, translationsIndex, zeroPositionForNull = true) {
    let yForVal = zeroPositionForNull ? zeroH : null
    if (typeof value !== 'undefined' && value !== null) {
      yForVal =
        zeroH -
        value / this.barCtx.yRatio[translationsIndex] +
        (this.barCtx.isReversed
          ? value / this.barCtx.yRatio[translationsIndex]
          : 0) *
          2
    }
    return yForVal
  }

  /**
   * @param {string} type
   * @param {number} zeroW
   * @param {number} zeroH
   * @param {number} i
   * @param {number} j
   * @param {number} translationsIndex
   */
  getGoalValues(type, zeroW, zeroH, i, j, translationsIndex) {
    const w = this.w

    /** @type {any[]} */
    const goals = []

    /**
     * @param {number} value
     * @param {Record<string, any>} attrs
     */
    const pushGoal = (value, attrs) => {
      goals.push({
        [type]:
          type === 'x'
            ? this.getXForValue(value, zeroW, false)
            : this.getYForValue(value, zeroH, translationsIndex, false),
        attrs,
      })
    }
    if (
      w.seriesData.seriesGoals[i] &&
      w.seriesData.seriesGoals[i][j] &&
      Array.isArray(w.seriesData.seriesGoals[i][j])
    ) {
      /**
       * @param {Record<string, any>} goal
       */
      w.seriesData.seriesGoals[i][j].forEach((/** @type {any} */ goal) => {
        pushGoal(goal.value, goal)
      })
    }
    if (this.barCtx.barOptions.isDumbbell && w.rangeData.seriesRange.length) {
      const colors = this.barCtx.barOptions.dumbbellColors
        ? this.barCtx.barOptions.dumbbellColors
        : w.globals.colors
      const commonAttrs = {
        strokeHeight: type === 'x' ? 0 : w.globals.markers.size[i],
        strokeWidth: type === 'x' ? w.globals.markers.size[i] : 0,
        strokeDashArray: 0,
        strokeLineCap: 'round',
        strokeColor: Array.isArray(colors[i]) ? colors[i][0] : colors[i],
      }

      pushGoal(w.rangeData.seriesRangeStart[i][j], commonAttrs)
      pushGoal(w.rangeData.seriesRangeEnd[i][j], {
        ...commonAttrs,
        strokeColor: Array.isArray(colors[i]) ? colors[i][1] : colors[i],
      })
    }
    return goals
  }

  /** @param {{barXPosition: any, barYPosition: any, goalX: any, goalY: any, barWidth: any, barHeight: any}} opts */
  drawGoalLine({
    barXPosition,
    barYPosition,
    goalX,
    goalY,
    barWidth,
    barHeight,
  }) {
    const graphics = new Graphics(this.barCtx.w)
    const lineGroup = graphics.group({
      className: 'apexcharts-bar-goals-groups',
    })

    lineGroup.node.classList.add('apexcharts-element-hidden')
    this.barCtx.w.globals.delayedElements.push({
      el: lineGroup.node,
    })

    lineGroup.attr(
      'clip-path',
      `url(#gridRectMarkerMask${this.barCtx.w.globals.cuid})`
    )

    let line = null
    if (this.barCtx.isHorizontal) {
      if (Array.isArray(goalX)) {
        goalX.forEach((goal) => {
          // Need a tiny margin of 1 each side so goals don't disappear at extremeties
          if (goal.x >= -1 && goal.x <= graphics.w.layout.gridWidth + 1) {
            const sHeight =
              typeof goal.attrs.strokeHeight !== 'undefined'
                ? goal.attrs.strokeHeight
                : barHeight / 2
            const y = barYPosition + sHeight + barHeight / 2

            line = graphics.drawLine(
              goal.x,
              y - sHeight * 2,
              goal.x,
              y,
              goal.attrs.strokeColor ? goal.attrs.strokeColor : undefined,
              goal.attrs.strokeDashArray,
              goal.attrs.strokeWidth ? goal.attrs.strokeWidth : 2,
              goal.attrs.strokeLineCap
            )
            lineGroup.add(line)
          }
        })
      }
    } else {
      if (Array.isArray(goalY)) {
        goalY.forEach((goal) => {
          // Need a tiny margin of 1 each side so goals don't disappear at extremeties
          if (goal.y >= -1 && goal.y <= graphics.w.layout.gridHeight + 1) {
            const sWidth =
              typeof goal.attrs.strokeWidth !== 'undefined'
                ? goal.attrs.strokeWidth
                : barWidth / 2
            const x = barXPosition + sWidth + barWidth / 2

            line = graphics.drawLine(
              x - sWidth * 2,
              goal.y,
              x,
              goal.y,
              goal.attrs.strokeColor ? goal.attrs.strokeColor : undefined,
              goal.attrs.strokeDashArray,
              goal.attrs.strokeHeight ? goal.attrs.strokeHeight : 2,
              goal.attrs.strokeLineCap
            )
            lineGroup.add(line)
          }
        })
      }
    }

    return lineGroup
  }

  /** @param {{prevPaths: any, currPaths: any, color: any, realIndex: any, j: any}} opts */
  drawBarShadow({ prevPaths, currPaths, color, realIndex, j }) {
    const w = this.w
    const { x: prevX2, x1: prevX1, barYPosition: prevY1 } = prevPaths
    const { x: currX2, x1: currX1, barYPosition: currY1 } = currPaths

    const prevY2 = prevY1 + currPaths.barHeight

    const graphics = new Graphics(this.barCtx.w)
    const utils = new Utils()

    const shadowPath =
      graphics.move(prevX1, prevY2) +
      graphics.line(prevX2, prevY2) +
      graphics.line(currX2, currY1) +
      graphics.line(currX1, currY1) +
      graphics.line(prevX1, prevY2) +
      (w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z')

    return graphics.drawPath({
      d: shadowPath,
      fill: utils.shadeColor(0.5, Utils.rgb2hex(color)),
      stroke: 'none',
      strokeWidth: 0,
      fillOpacity: 1,
      classes: 'apexcharts-bar-shadow apexcharts-decoration-element',
    })
  }

  /** @param {{i: any, j: any}} opts */
  getZeroValueEncounters({ i, j }) {
    const w = this.w

    let nonZeroColumns = 0
    let zeroEncounters = 0
    const seriesIndices = w.config.plotOptions.bar.horizontal
      /**
       * @param {any} _
       * @param {number} _i
       */
      ? w.seriesData.series.map((/** @type {any} */ _, /** @type {any} */ _i) => _i)
      /**
       * @param {number} _i
       */
      : w.globals.columnSeries?.i.map((/** @type {any} */ _i) => _i) || []

    /**
     * @param {number} _si
     */
    seriesIndices.forEach((/** @type {any} */ _si) => {
      const val = w.globals.seriesPercent[_si][j]
      if (val) {
        nonZeroColumns++
      }
      if (_si < i && val === 0) {
        zeroEncounters++
      }
    })

    return {
      nonZeroColumns,
      zeroEncounters,
    }
  }

  /**
   * @param {number} seriesIndex
   */
  getGroupIndex(seriesIndex) {
    const w = this.w
    // groupIndex is the index of group buckets (group1, group2, ...)
    /**
     * @param {Element} group
     */
    const groupIndex = w.labelData.seriesGroups.findIndex(
      (/** @type {any} */ group) =>
        // w.config.series[i].name may be undefined, so use
        // w.seriesData.seriesNames[i], which has default names for those
        // series. w.labelData.seriesGroups[] uses the same default naming.
        group.indexOf(w.seriesData.seriesNames[seriesIndex]) > -1
    )
    // We need the column groups to be indexable as 0,1,2,... for their
    // positioning relative to each other.
    const cGI = this.barCtx.columnGroupIndices
    let columnGroupIndex = cGI.indexOf(groupIndex)
    if (columnGroupIndex < 0) {
      cGI.push(groupIndex)
      columnGroupIndex = cGI.length - 1
    }
    return { groupIndex, columnGroupIndex }
  }
}
