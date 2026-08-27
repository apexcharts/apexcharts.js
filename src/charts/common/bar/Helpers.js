// @ts-check
import Graphics from '../../../modules/Graphics'
import Series from '../../../modules/Series'
import Fill from '../../../modules/Fill'
import Utils from '../../../utils/Utils'

/**
 * Whether this chart is a histogram drawing its distributions on top of one
 * another rather than side by side.
 *
 * A histogram renders through the bar pathway, so `chart.type` is 'bar' by the
 * time it gets here and only `requestedType` still says histogram. With one
 * series there is nothing to overlay and the ordinary grouped geometry is the
 * same thing, so the check is cheap and self-limiting.
 *
 * @param {any} w
 * @returns {boolean}
 */
export function isHistogramOverlay(w) {
  if (w?.config?.chart?.requestedType !== 'histogram') return false
  if (w.config.plotOptions?.histogram?.overlap === false) return false
  return (w.seriesData?.series?.length ?? 0) > 1
}

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
  }

  /**
   * The x-span that one bar slot covers, in DATA units, on a numeric or
   * datetime axis. Returns 0 when it cannot be resolved, which leaves the
   * caller on its category-style fallback.
   *
   * `w.globals.minXDiff` cannot serve here on its own, for two reasons:
   *
   *  - It is the smallest gap WITHIN a series, minimised over series, so it
   *    never sees the gaps BETWEEN two series' x values. Series A on the 1st
   *    and the 4th plus series B on the 2nd gives minXDiff = 3 days while the
   *    axis really has a 1 day gap, and every bar is drawn 3 days wide, so
   *    neighbours overlap (#4885).
   *  - With one data point there are no gaps to measure at all and it is set
   *    to a 0.5 sentinel, so the slot fell back to the whole grid width and a
   *    single bar covered most of the chart. Range._handleSingleDataPoint pads
   *    the axis by ±2 units around a lone point (2 days for datetime, 2 for
   *    numeric), so one unit is a quarter of the resulting span.
   *
   * Cached: the merge below is O(points × series) and every series in a draw
   * pass asks the same question.
   *
   * @returns {number}
   */
  barSlotXSpan() {
    const w = this.w

    if (this._slotXSpan !== undefined) return this._slotXSpan

    let slot = 0
    if (w.globals.dataPoints <= 1) {
      const span = w.globals.maxX - w.globals.minX
      slot = span > 0 ? span / 4 : 0
    } else {
      slot = this._unionMinXGap()
      if (!(slot > 0) || !isFinite(slot)) {
        // nothing usable in the x arrays: keep what the axis worked out
        const min = w.globals.minXDiff
        slot = min > 0 && isFinite(min) && min !== 0.5 ? min : 0
      }
    }

    this._slotXSpan = slot
    return slot
  }

  /**
   * Smallest positive gap between neighbouring x values once every series is
   * merged onto one axis. A k-way merge over the series arrays, which are
   * already sorted in every ordinary case; an unsorted one can only make the
   * answer smaller, i.e. the bars narrower, never overlapping.
   *
   * Collapsed series count too, exactly as they did for `minXDiff`. Skipping
   * them would widen every bar the moment someone hid the tightest-spaced
   * series from the legend, so bar geometry would depend on legend state.
   *
   * @returns {number}
   */
  _unionMinXGap() {
    const w = this.w
    const seriesX = w.seriesData.seriesX || []

    /** @type {any[][]} */
    const arrays = []
    for (let i = 0; i < seriesX.length; i++) {
      const xs = seriesX[i]
      if (Array.isArray(xs) && xs.length > 0) arrays.push(xs)
    }
    if (!arrays.length) return 0

    const cursor = new Array(arrays.length).fill(0)
    let prev = NaN
    let min = Infinity

    for (;;) {
      let next = Infinity
      let from = -1
      for (let k = 0; k < arrays.length; k++) {
        const xs = arrays[k]
        // step over anything that is not a usable number
        while (cursor[k] < xs.length && typeof xs[cursor[k]] !== 'number') {
          cursor[k]++
        }
        if (cursor[k] >= xs.length) continue
        const v = xs[cursor[k]]
        if (v !== v) {
          cursor[k]++
          k--
          continue
        }
        if (v < next) {
          next = v
          from = k
        }
      }
      if (from === -1) break
      cursor[from]++
      if (prev === prev) {
        const d = next - prev
        if (d > 0 && d < min) min = d
      }
      prev = next
    }

    return isFinite(min) ? min : 0
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
    // Both of these put every series in ONE slot rather than dividing the slot
    // between them: rangeBar rows that share a track, and overlaid histogram
    // distributions that share a bin.
    if (w.config.plotOptions.bar.rangeBarGroupRows || isHistogramOverlay(w)) {
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
        // one slot wide at most, so neighbouring bars cannot overlap
        const xRatio = this.barCtx.xRatio
        const slotXSpan = this.barSlotXSpan()

        if (slotXSpan > 0 && slotXSpan / xRatio > 0) {
          xDivision = slotXSpan / xRatio
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
   * Series indices bucketed into the stacks they actually draw in: one bucket
   * per series group, or a single bucket holding every series when the chart is
   * not grouped. Order within a bucket follows series order, which is stacking
   * order.
   *
   * @param {number} numSeries
   * @returns {number[][]}
   */
  getStackedSeriesIndices(numSeries) {
    const groups = this.w.labelData.seriesGroups
    if (!groups || groups.length < 2) {
      return [Array.from({ length: numSeries }, (_, i) => i)]
    }

    /** @type {number[][]} */
    const buckets = Array.from({ length: groups.length }, () => [])
    /** @type {number[]} */
    const ungrouped = []
    for (let i = 0; i < numSeries; i++) {
      const g = this.getSeriesGroupIndex(i)
      if (g > -1) buckets[g].push(i)
      else ungrouped.push(i)
    }
    // A series whose name matches no group still stacks somewhere; keep them
    // together rather than dropping them out of the assignment entirely.
    if (ungrouped.length) buckets.push(ungrouped)
    return buckets.filter((b) => b.length > 0)
  }

  /**
   * Which corners each bar rounds, as a [seriesIndex][dataPointIndex] grid of
   * 'top' | 'bottom' | 'both' | 'none'.
   *
   * A rounded corner belongs to the OUTSIDE of a stack, so this resolves, per
   * data point, the outermost segment on each side of the baseline; everything
   * sandwiched between them stays square.
   *
   * Crucially a "stack" is a series GROUP, not the whole chart. A grouped
   * stacked chart draws one independent stack per group, side by side, and each
   * one needs its own outermost segments. Resolving chart-wide instead put the
   * radius on the bottom of the first group's lowest series and the top of the
   * last group's highest, leaving every stack in between completely square, 
   * which is exactly how it looked: the first column rounded at the bottom, the
   * second at the top, and nothing else touched. Stacked totals already resolve
   * per group (see drawsStackedTotal, #4173); corners never got the same fix.
   *
   * @param {any[]} series
   * @returns {string[][]}
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

    // A lone horizontal bar in a single-category chart keeps 'top' where a
    // column would take the full 'both'. Preserved from the original.
    const isSoloHorizontal =
      this.w.config.chart.type === 'bar' && numColumns === 1
    const soloCorner = isSoloHorizontal ? 'top' : 'both'
    const baseCorner = isSoloHorizontal ? 'top' : 'bottom'

    for (const stack of this.getStackedSeriesIndices(numSeries)) {
      for (let j = 0; j < numColumns; j++) {
        /** @type {number[]} */
        const positiveIndices = []
        /** @type {number[]} */
        const negativeIndices = []

        for (const i of stack) {
          const value = series[i][j]
          if (value > 0) positiveIndices.push(i)
          else if (value < 0) negativeIndices.push(i)
        }

        if (positiveIndices.length > 0 && negativeIndices.length === 0) {
          if (positiveIndices.length === 1) {
            output[positiveIndices[0]][j] = soloCorner
          } else {
            const first = positiveIndices[0]
            const last = positiveIndices[positiveIndices.length - 1]
            for (const i of positiveIndices) {
              output[i][j] =
                i === first ? baseCorner : i === last ? 'top' : 'none'
            }
          }
        } else if (negativeIndices.length > 0 && positiveIndices.length === 0) {
          if (negativeIndices.length === 1) {
            output[negativeIndices[0]][j] = 'both'
          } else {
            const highest = Math.max(...negativeIndices) // closest to the axis
            const lowest = Math.min(...negativeIndices) // farthest from it
            for (const i of negativeIndices) {
              output[i][j] =
                i === highest ? 'bottom' : i === lowest ? 'top' : 'none'
            }
          }
        } else if (positiveIndices.length > 0 && negativeIndices.length > 0) {
          const lastPositive = positiveIndices[positiveIndices.length - 1]
          for (const i of positiveIndices) {
            output[i][j] = i === lastPositive ? 'top' : 'none'
          }
          const highestNegative = Math.max(...negativeIndices)
          for (const i of negativeIndices) {
            output[i][j] = i === highestNegative ? 'bottom' : 'none'
          }
        }
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

    const sl = graphics.line(x2, y1)
    const closing =
      w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z'

    // The square rect this bar is built from, kept because a bar that is
    // GAINING a rounded corner has to travel to its new slot square and only
    // round once it gets there, see Bar.getPreviousPath.
    const squarePathTo =
      graphics.move(x1, y1) +
      graphics.line(x1, y2) +
      graphics.line(x2, y2) +
      sl +
      closing
    let pathTo = squarePathTo
    if (this.arrBorderRadius[realIndex][j] !== 'none') {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      )
    }

    let pathFrom = null
    // Cross-type morph: use the captured outgoing path as the start so the
    // morphPaths engine bridges (pie/radial) → bar. No-op when the morph
    // feature isn't registered or no snapshot is active.
    const morphFrom = this.barCtx.ctx?.morphTypeChange?.getInitialPathFor(
      realIndex,
      j,
    )
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Update: keyed survivor → its old geometry (reflow morph); survivor
      // whose shape changed → pathTo (snap); ENTERING datum → null, which
      // falls through to the baseline rise below.
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo)
    }
    if (pathFrom == null) {
      // Initial mount or entering datum: rise from the baseline of the final
      // slot; pad command count to match pathTo.
      pathFrom =
        graphics.move(x1, y1) +
        graphics.line(x1, y1) +
        sl +
        sl +
        sl +
        sl +
        sl +
        graphics.line(x1, y1) +
        closing
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
      // The box the path was built from, AFTER the stroke centering and the
      // anti-exponential nudge above. Anything that has to line up with a drawn
      // bar (the waterfall connectors) reads this rather than recomputing the
      // edges, which is how it stays exact when a stroke width is set.
      // `y1` is the lower value's edge and `y2` the upper one's.
      drawnBox: { x1, x2, y1, y2 },
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

    let pathFrom = null
    const morphFrom = this.barCtx.ctx?.morphTypeChange?.getInitialPathFor(
      realIndex,
      j,
    )
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Update: keyed survivor → morph; shape-changed survivor → snap;
      // entering datum → null (falls through to the centerline collapse).
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo)
    }
    if (pathFrom == null) {
      // Initial mount or entering datum: collapsed at the centerline so the
      // trapezoid expands outward.
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

  /**
   * Pre-compute the per-segment layout for a value-proportional pyramid.
   *
   * Each segment is a horizontal slice of a triangle whose apex sits at the
   * top of the plot area (width = 0) and whose base spans `gridWidth` at the
   * bottom. The vertical extent of each slice is its share of the total
   * series value, so areas track value contribution and segments share
   * edges (no gaps). The first data point is the apex, the last is the base.
   *
   * @param {any[]} seriesData - 1D array of values for a single series row
   * @returns {{ y: number, height: number, topHalf: number, bottomHalf: number }[]}
   */
  computePyramidLayout(seriesData) {
    const w = this.w
    const gridHeight = w.layout.gridHeight
    const gridWidth = w.layout.gridWidth

    const values = seriesData.map(
      /** @param {any} v */ (v) => Math.abs(Number(v) || 0),
    )
    const total = values.reduce(
      /** @param {number} a @param {number} b */ (a, b) => a + b,
      0,
    )

    if (total === 0 || gridHeight <= 0) {
      return values.map(() => ({ y: 0, height: 0, topHalf: 0, bottomHalf: 0 }))
    }

    const halfWidth = gridWidth / 2
    let cumulative = 0
    const layout = []
    for (let j = 0; j < values.length; j++) {
      const topRatio = cumulative / total
      cumulative += values[j]
      const bottomRatio = cumulative / total
      const topY = topRatio * gridHeight
      const bottomY = bottomRatio * gridHeight
      layout.push({
        y: topY,
        height: bottomY - topY,
        topHalf: topRatio * halfWidth,
        bottomHalf: bottomRatio * halfWidth,
      })
    }
    return layout
  }

  /**
   * Build a single pyramid stage path. Geometry is precomputed by
   * `computePyramidLayout`; this method only renders that geometry into an
   * SVG path string plus a `pathFrom` for entry/morph animations.
   *
   * @param {{ barYPosition: number, barHeight: number, topHalf: number, bottomHalf: number, realIndex: number, j: number, strokeWidth: number, w: any }} opts
   */
  getPyramidPaths({
    barYPosition,
    barHeight,
    topHalf,
    bottomHalf,
    realIndex,
    j,
    strokeWidth,
    w,
  }) {
    const graphics = new Graphics(this.barCtx.w)
    const center = w.layout.gridWidth / 2

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

    let pathFrom = null
    const morphFrom = this.barCtx.ctx?.morphTypeChange?.getInitialPathFor(
      realIndex,
      j,
    )
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Keyed survivor → morph; shape-changed → snap; entering → null.
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo)
    }
    if (pathFrom == null) {
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

    const sl = graphics.line(x1, y2)
    const closing =
      w.config.plotOptions.bar.borderRadiusApplication === 'around' ||
      this.arrBorderRadius[realIndex][j] === 'both'
        ? ' Z'
        : ' z'

    // See the column builder: kept so a bar gaining a rounded corner can
    // travel to its new slot square and only round once it gets there.
    const squarePathTo =
      graphics.move(x1, y1) +
      graphics.line(x2, y1) +
      graphics.line(x2, y2) +
      sl +
      closing
    let pathTo = squarePathTo
    if (this.arrBorderRadius[realIndex][j] !== 'none') {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      )
    }

    let pathFrom = null
    const morphFrom = this.barCtx.ctx?.morphTypeChange?.getInitialPathFor(
      realIndex,
      j,
    )
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Update: keyed survivor → its old geometry (reflow morph); survivor
      // whose shape changed → pathTo (snap); ENTERING datum → null, which
      // falls through to the baseline rise below.
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo)
    }
    if (pathFrom == null) {
      // Initial mount or entering datum: rise from the baseline of the final
      // slot; pad command count to match pathTo.
      const slFrom = isFunnel ? graphics.line(fromX, y2) : sl
      pathFrom =
        graphics.move(fromX, y1) +
        graphics.line(fromX, y1) +
        slFrom +
        slFrom +
        slFrom +
        slFrom +
        slFrom +
        graphics.line(fromX, y1) +
        closing
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
      // See getColumnPaths. Here `x1` is the start value's edge and `x2` the
      // end value's, because a horizontal bar's two ends arrive unsorted.
      drawnBox: { x1, x2, y1, y2 },
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
    // Only bars/candles that actually have a goal line need a group. Skipping
    // the empty group (the common case) avoids one dead <g> per bar: negligible
    // in SVG but the ENTIRE node count in canvas mode (bodies/wicks paint to the
    // bitmap, so these empty groups are all that is left), and wasteful on large
    // datasets either way.
    const hasGoals =
      (Array.isArray(goalX) && goalX.length > 0) ||
      (Array.isArray(goalY) && goalY.length > 0)
    if (!hasGoals) {
      return null
    }

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
   * Index of the series group `seriesIndex` belongs to within
   * `w.labelData.seriesGroups`, or -1 when the chart has no groups.
   *
   * Unlike `getGroupIndex` this is a pure lookup: it never appends to
   * `columnGroupIndices`, so it is safe to call from positioning/label code
   * that must not perturb the draw order bookkeeping.
   * @param {number} seriesIndex
   * @returns {number}
   */
  getSeriesGroupIndex(seriesIndex) {
    const w = this.w
    return w.labelData.seriesGroups.findIndex(
      (/** @type {string[]} */ group) =>
        group.indexOf(w.seriesData.seriesNames[seriesIndex]) > -1,
    )
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
