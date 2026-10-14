// @ts-check
import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import { Environment } from '../utils/Environment'

/**
 * ApexCharts BarStacked Class responsible for drawing both Stacked Columns and Bars.
 *
 * @module BarStacked
 * The whole calculation for stacked bar/column is different from normal bar/column,
 * hence it makes sense to derive a new class for it extending most of the props of Parent Bar
 **/

class BarStacked extends Bar {
  /**
   * @param {any[]} series
   * @param {number} seriesIndex
   */
  draw(series, seriesIndex) {
    const w = this.w
    this.graphics = new Graphics(this.w)

    const coreUtils = new CoreUtils(this.w)
    series = coreUtils.getLogSeries(series)
    this.yRatio = coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series, seriesIndex)

    if (w.config.chart.stackType === '100%') {
      series = w.globals.comboCharts
        ? /** @type {any} */ (seriesIndex).map(
            (/** @type {any} */ _) => w.globals.seriesPercent[_],
          )
        : w.globals.seriesPercent.slice()
    }

    this.series = series
    this.barHelpers.initializeStackedPrevVars(this)

    const ret = this.graphics.group({
      class: 'apexcharts-bar-series apexcharts-plot-series',
    })

    // Highlight filter (opt-in feature): each segment's part, stacked solid
    // over the faded wholes. Null without the feature.
    const hf = this.ctx.highlightFilter

    let x = 0
    let y = 0

    // Only hold a bar's mirror across an animated update, with animations off
    // the new corner state is reached instantly and the mirror should follow it
    // instantly too.
    const anim = w.config.chart.animations
    const holdMirror =
      anim.enabled &&
      anim.dynamicAnimation.enabled &&
      w.globals.previousPaths.length > 0
    let heldMirrors = false

    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      const realIndex = w.globals.comboCharts
        ? /** @type {any} */ (seriesIndex)[i]
        : i
      const { groupIndex, columnGroupIndex } =
        this.barHelpers.getGroupIndex(realIndex)
      this.groupCtx = /** @type {any} */ (this).stacks[groupIndex]

      const xArrValues = []
      const yArrValues = []

      const translationsIndex = this.setSeriesAxis(realIndex)

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
      // The label wrap is a SIBLING of the series group, not a child, so it
      // does not inherit the collapsed/collapsing opacity handling. Give it the
      // same lifecycle or a collapsing series' labels either vanish a tween
      // early or linger after its bars have gone.
      Series.addCollapsedClassToSeries(this.w, elDataLabelsWrap, realIndex)
      if ((w.globals.collapsingSeriesIndices || []).indexOf(realIndex) > -1) {
        elDataLabelsWrap.node.style.setProperty(
          '--apexcharts-dl-exit',
          `${w.config.chart.animations.dynamicAnimation.speed}ms`,
        )
      }

      const elGoalsMarkers = this.graphics.group({
        class: 'apexcharts-bar-goals-markers',
      })

      const initPositions = this.initialPositions(
        x,
        y,
        undefined,
        undefined,
        undefined,
        undefined,
        translationsIndex,
      )
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
        /**
         * @param {number} val
         */
        this.groupCtx.prevY[0].every((/** @type {any} */ val) => isNaN(val))
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
        }
        let paths = /** @type {any} */ (null)
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

        const pathFill = this.barHelpers.getPathFillColor(
          series,
          i,
          j,
          realIndex,
        )

        let classes = ''

        const flipClass = w.globals.isBarHorizontal
          ? 'apexcharts-flip-x'
          : 'apexcharts-flip-y'
        const wantsFlip = this.cornerFlip(
          this.barHelpers.arrBorderRadius[realIndex][j],
          w.seriesData.series[realIndex][j],
        )

        // The mirror is a DISCRETE flag over CONTINUOUS geometry, so it cannot
        // simply follow the new corner state: it would snap on frame 0 while
        // the path it belongs to spends the whole tween morphing. Collapse the
        // bottom series of a stack and the layer leaving keeps its rounded
        // corners for the length of the tween but loses the mirror instantly,
        // so its radius jumps to the top; the layer inheriting the bottom gains
        // the mirror instantly, so a radius appears on it before the leaver has
        // moved out of the way.
        //
        // Hold the mirror across the tween instead (union of old and new). This
        // is safe because the endpoint that is NOT rounded is a plain rect, and
        // this mirror maps a box exactly onto itself, so on a plain rect, and
        // on the symmetric 'both' state, applying it is a pixel-level no-op.
        // The radius is then free to grow in or shrink out in place, which is
        // what the padded morph in Bar.getPreviousPath already provides.
        const heldFlip = holdMirror && !wantsFlip && this.getPreviousFlip(realIndex, j)
        if (wantsFlip || heldFlip) {
          classes = flipClass
        }
        if (heldFlip) {
          // 'bottom' → 'top' is the one transition where the mirror is still
          // load-bearing at rest (both endpoints are genuinely rounded, at
          // opposite ends), so the held mirror has to be dropped once the
          // geometry has arrived. Marked here, settled after the draw.
          classes += ' apexcharts-flip-held'
          heldMirrors = true
        }
        elSeries = this.renderSeries({
          hl: hf?.bar(this, {
            i,
            j,
            realIndex,
            translationsIndex,
            paths,
            zeroH,
            zeroW,
          }),
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
          barXPosition: paths.barXPosition,
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

    if (heldMirrors) this.settleHeldMirrors(ret)

    return ret
  }

  /**
   * Whether a stacked segment with this corner state and value is drawn
   * mirrored. Stacked segments are built top-rounded only, so a radius that
   * belongs at the other end (a positive segment rounded at the bottom, a
   * negative one at the top) comes from the apexcharts-flip-y/-x class. The
   * highlight filter applies the same rule to its parts.
   * @param {string} state the segment's corner state (createBorderRadiusArr)
   * @param {number} v the segment's value
   */
  cornerFlip(state, v) {
    return (state === 'bottom' && v > 0) || (state === 'top' && v < 0)
  }

  /**
   * Drop the mirrors held across an animated update once the geometry they
   * were covering for has arrived. A no-op for every state except
   * 'bottom' → 'top', where the endpoint really is rounded at the other end;
   * everywhere else the mirror is an exact identity on the settled shape, so
   * removing it changes nothing on screen.
   *
   * The marks are collected now, not when the timer fires: a query then also
   * stripped the mirrors a LATER update was still holding mid-tween.
   * @param {any} [ret] this draw's series group (default: the whole chart)
   */
  settleHeldMirrors(ret) {
    const w = this.w
    if (!Environment.isBrowser()) return

    const anim = w.config.chart.animations
    // Matches the collapsing-series hold: morphSVG applies the stagger delay
    // twice, so the real tail runs past dynamicAnimation.speed on its own.
    const hold = (anim.dynamicAnimation.speed || 0) + (anim.speed || 0) + 100
    const held = (ret ? ret.node : w.dom.baseEl).querySelectorAll(
      '.apexcharts-flip-held',
    )

    setTimeout(() => {
      held.forEach((/** @type {Element} */ el) => {
        el.classList.remove(
          'apexcharts-flip-held',
          'apexcharts-flip-y',
          'apexcharts-flip-x',
        )
      })
    }, hold)
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number | undefined} xDivision
   * @param {number | undefined} yDivision
   * @param {number | undefined} zeroH
   * @param {number | undefined} zeroW
   * @param {number} translationsIndex
   */
  initialPositions(
    x,
    y,
    xDivision,
    yDivision,
    zeroH,
    zeroW,
    translationsIndex,
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
      // barSlotXSpan resolves the slot for a single data point too, where the
      // old `dataPoints > 1` guard fell through to a bar the width of the whole
      // grid (#4885).
      const slotXSpan = w.axisFlags.isXNumeric
        ? this.barHelpers.barSlotXSpan()
        : 0
      if (slotXSpan > 0) {
        xDivision = slotXSpan / this.xRatio
        barWidth = (xDivision * parseInt(this.barOptions.columnWidth, 10)) / 100
      } else {
        barWidth *= parseInt(userColumnWidth, 10) / 100
      }

      if (String(userColumnWidth).indexOf('%') === -1) {
        // An explicit width in PIXELS. The non-numeric path always honoured it
        // and the plain (unstacked) bar path honours it on a numeric axis too,
        // but here it used to fall into the branch above and be read as a
        // percentage, so `columnWidth: '18'` came out 24.8px, 40.6px or 18.4px
        // depending on how many points the series happened to have (#4885).
        barWidth = parseInt(userColumnWidth, 10)
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
      barHeight: (barHeight ?? 0) / subDivisions,
      barWidth: (barWidth ?? 0) / subDivisions,
      zeroH,
      zeroW,
    }
  }

  /** @param {{indexes: any, barHeight: any, strokeWidth: any, zeroW: any, x: any, y: any, columnGroupIndex: any, yDivision: any, elSeries: any}} opts */
  drawStackedBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    columnGroupIndex,
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
    // past the end of a short series reads as null, as a padded one would
    const v = /** @type {any} */ (this.series)[i]?.[j] ?? null

    let prevBarW = 0
    for (let k = 0; k < this.groupCtx.prevXF.length; k++) {
      prevBarW = prevBarW + this.groupCtx.prevXF[k][j]
    }

    // Where this series sits in its group's stack. See the note in
    // drawStackedColumnPaths: the index has to count the series this renderer
    // has already drawn for the group, which is exactly what prevX holds.
    const gsi = this.groupCtx.prevX.length

    if (gsi > 0) {
      let bXP = zeroW

      if (this.groupCtx.prevXVal[gsi - 1][j] < 0) {
        bXP =
          v >= 0
            ? this.groupCtx.prevX[gsi - 1][j] +
              prevBarW -
              (this.isReversed ? prevBarW : 0) * 2
            : this.groupCtx.prevX[gsi - 1][j]
      } else if (this.groupCtx.prevXVal[gsi - 1][j] >= 0) {
        bXP =
          v >= 0
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

    x =
      barXPosition +
      (v / this.invertedYRatio) * (this.isReversed ? -1 : 1)

    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1: barXPosition,
      x2: x,
      strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
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
        /** @type {any} */ (null),
        realIndex,
        j,
        translationsIndex,
      ),
      barXPosition,
      barYPosition,
      x,
      y,
    }
  }

  /** @param {{indexes: any, x: any, y: any, xDivision: any, barWidth: any, zeroH: any, columnGroupIndex: any, elSeries: any}} opts */
  drawStackedColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    columnGroupIndex,
    elSeries,
  }) {
    const w = this.w
    const i = indexes.i
    const j = indexes.j
    const bc = indexes.bc
    const realIndex = indexes.realIndex
    const translationsIndex = indexes.translationsIndex
    const v = /** @type {any} */ (this.series)[i]?.[j] ?? null

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

    // The layer below is found by x identity, as stacked lines do (#4886): on
    // a numeric or datetime axis each series carries its own x values, so one
    // ordinal can be another date in the series below, or a series of another
    // type. `tops` holds, per x, the top and value of the last segment drawn
    // there, the summed heights and raw values of every segment drawn there so
    // far (the total label's value) and the extreme tops below that segment
    // (its position). A series without this x leaves it as it was, as a 0.
    const g = this.groupCtx
    const key = w.axisFlags.isXNumeric ? w.seriesData.seriesX[realIndex][j] : j
    const top = g.tops.get(key)
    if (top) {
      const [prevYValue, prevVal, prevBarH] = top
      let bYP
      if (prevVal < 0) {
        bYP =
          v >= 0
            ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2
            : prevYValue
      } else if (prevVal >= 0) {
        bYP =
          v >= 0
            ? prevYValue
            : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2
      }

      if (typeof bYP === 'undefined') bYP = w.layout.gridHeight

      // if this.prevYF[0] is all 0 resulted from line #486
      // AND every arr starting from the second only contains NaN
      if (
        g.prevYF[0]?.every((/** @type {any} */ val) => val === 0) &&
        g.prevYF
          .slice(1)
          .every((/** @type {any} */ arr) =>
            arr.every((/** @type {any} */ val) => isNaN(val)),
          )
      ) {
        barYPosition = zeroH
      } else {
        // Nothing special
        barYPosition = bYP
      }
    } else {
      // nothing is stacked at this x yet
      barYPosition = zeroH
    }

    // a null stays on its layer below (#3610)
    y =
      barYPosition -
      (v / this.yRatio[translationsIndex]) * (this.isReversed ? -1 : 1)

    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1: barYPosition,
      y2: y,
      yRatio: this.yRatio[translationsIndex],
      // the series' width even for an empty segment, so a hidden layer keeps
      // its place, but no inset at all when no stroke is drawn
      strokeWidth: w.config.stroke.show ? this.strokeWidth : 0,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      i,
      j,
      w,
    })

    const t = g.yArrj[j]
    if (!isNaN(t)) {
      g.tops.set(key, [
        t,
        g.yArrjVal[j],
        (top ? top[2] : 0) + g.yArrjF[j],
        (top ? top[3] : 0) + (w.seriesData.series[realIndex][j] || 0),
        top ? Math.min(top[0], top[4]) : 1 / 0,
        top ? Math.max(top[0], top[5]) : -1 / 0,
      ])
    }

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
      goalY: this.barHelpers.getGoalValues(
        'y',
        /** @type {any} */ (null),
        zeroH,
        realIndex,
        j,
        translationsIndex,
      ),
      barXPosition,
      x: w.axisFlags.isXNumeric ? x : x + xDivision,
      y,
    }
  }
}

export default BarStacked
