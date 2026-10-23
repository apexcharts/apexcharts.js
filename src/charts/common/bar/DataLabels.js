// @ts-check
import Graphics from '../../../modules/Graphics'
import DataLabels from '../../../modules/DataLabels'
import { resolveDataLabelOffset } from '../../../modules/helpers/DataLabelOffset'

export default class BarDataLabels {
  /**
   * @param {import('../../../charts/Bar').default} barCtx
   */
  constructor(barCtx) {
    this.w = barCtx.w
    this.barCtx = barCtx

    this.totalFormatter =
      this.w.config.plotOptions.bar.dataLabels.total.formatter

    if (!this.totalFormatter) {
      this.totalFormatter = this.w.config.dataLabels.formatter
    }
  }
  /** handleBarDataLabels is used to calculate the positions for the data-labels
   * It also sets the element's data attr for bars and calls drawCalculatedBarDataLabels()
   * After calculating, it also calls the function to draw data labels
   * @memberof Bar
   * @param {Record<string, any>} opts - bar properties used throughout the bar drawing function
   * @return {object} dataLabels node-element which you can append later
   **/
  handleBarDataLabels(opts) {
    const {
      x,
      y,
      y1,
      y2,
      i,
      j,
      realIndex,
      columnGroupIndex,
      barHeight,
      barWidth,
      barXPosition,
      barYPosition,
      visibleSeries,
      hl,
      noLabel,
    } = opts
    const w = this.w
    const graphics = new Graphics(this.barCtx.w)
    // Highlight filter: the stacked total states the parts, at the part
    // stack's edge; false when no part is left in the stack.
    this.hlt = hl?.total

    // On a waterfall the series value is the LEVEL the bar reached, while the
    // label states the step it made (the delta, or the sum for a subtotal /
    // total bar). Resolved once and used for BOTH the measurement and the drawn
    // text: measuring a string that is never drawn would size the overflow
    // clamps wrongly, and handing a user's own formatter the level would leave
    // no way to reach the number actually on the chart.
    //
    // The highlight filter's part states its own value the same way, from its
    // own end of the bar (see HighlightFilter.bar).
    const steps = w.waterfallData && w.waterfallData.values
    const waterfallStep =
      hl && hl.val != null
        ? hl.val
        : steps && steps[realIndex] && steps[realIndex][j] != null
          ? steps[realIndex][j]
          : null

    const strokeWidth = Array.isArray(this.barCtx.strokeWidth)
      ? this.barCtx.strokeWidth[realIndex]
      : this.barCtx.strokeWidth

    let bcx
    let bcy
    if (w.axisFlags.isXNumeric && !w.globals.isBarHorizontal) {
      bcx = x + barWidth * (visibleSeries + 1)
      bcy = y + barHeight * (visibleSeries + 1) - strokeWidth
    } else {
      bcx = x + barWidth * visibleSeries
      bcy = y + barHeight * visibleSeries
    }

    let dataLabels = null
    let totalDataLabels = null
    let dataLabelsX = x
    let dataLabelsY = y
    let dataLabelsPos = /** @type {any} */ ({})
    const dataLabelsConfig = w.config.dataLabels
    const barDataLabelsConfig = this.barCtx.barOptions.dataLabels
    const barTotalDataLabelsConfig = this.barCtx.barOptions.dataLabels.total

    if (
      typeof barYPosition !== 'undefined' &&
      (this.barCtx.isRangeBar || this.barCtx.isPyramid)
    ) {
      // Both rangeBar and pyramid have per-segment y/height that doesn't
      // follow the equal-step `yDivision` cadence the default bar
      // dataLabelsY formula assumes. Anchor positioning at the actual
      // barYPosition (segment top) instead.
      bcy = barYPosition
      dataLabelsY = barYPosition
    }

    if (
      typeof barXPosition !== 'undefined' &&
      this.barCtx.isVerticalGroupedRangeBar
    ) {
      bcx = barXPosition
      dataLabelsX = barXPosition
    }

    // offsets may be a function evaluated per data point, so labels of a
    // series with few records can be nudged individually to avoid overlapping
    const offX = resolveDataLabelOffset(
      dataLabelsConfig.offsetX,
      w,
      realIndex,
      j,
    )
    const offY = resolveDataLabelOffset(
      dataLabelsConfig.offsetY,
      w,
      realIndex,
      j,
    )

    // A datum the highlight filter leaves without a part keeps no label. It
    // is still drawn, blank, as a null value is: the overlap pass indexes
    // its rects by data point, so a skipped one would misalign the rest.
    // Use realIndex (the full-config series index), not the local loop index
    // `i` which is the compacted bar-subset index in a combo chart.
    const val = hl?.hide
      ? undefined
      : waterfallStep !== null
        ? waterfallStep
        : // only RangeBar passes a range, vertical or horizontal
          y2 !== undefined
          ? [y1, y2]
          : w.config.chart.stackType === '100%'
            ? // Read the percentages globally rather than out of `series`.
              // Under `stackType: '100%'` BarStacked replaces `series` with
              // the percentage rows, and in a combo chart it narrows them to
              // just the series it draws as bars, so `series` is indexed by
              // bar position while `realIndex` counts every series. A line
              // ahead of a column pushed `realIndex` past the end and the
              // label read a value off `undefined` (#2429).
              w.globals.seriesPercent[realIndex][j]
            : w.seriesData.series[realIndex][j]

    let text
    let textRects = {
      width: 0,
      height: 0,
    }
    if (dataLabelsConfig.enabled) {
      // Format once and measure the exact string that is drawn.
      text =
        val === undefined
          ? ''
          : dataLabelsConfig.formatter(val, {
              ...w,
              seriesIndex: realIndex,
              dataPointIndex: j,
              w,
            })
      // Measure in the SAME font the label will be drawn in. Data labels
      // default to fontWeight 600, and the default measurement is taken at
      // 'regular', which under-reports the width by 3-7% on these strings. That
      // shortfall is not cosmetic: every overflow clamp below is driven by
      // `textRects.width`, so an under-measured label is clamped to a position
      // that still runs off the chart.
      textRects = graphics.getTextRects(
        text,
        parseFloat(dataLabelsConfig.style.fontSize).toString(),
        dataLabelsConfig.style.fontFamily,
        undefined,
        true,
        dataLabelsConfig.style.fontWeight,
      )
    }

    // One series caps each stack and draws its total; only that bar formats,
    // measures and places it (the user's total formatter ran for every
    // series at every point).
    const drawTotal =
      w.config.chart.stacked &&
      barTotalDataLabelsConfig.enabled &&
      this.hlt !== false &&
      this.drawsStackedTotal(realIndex)
    const totalText = drawTotal
      ? this.getStackedTotalDataLabel({ realIndex, j })
      : undefined

    const params = {
      drawTotal,
      totalText,
      x: hl?.x ?? x,
      y: hl?.y ?? y,
      neg: hl && hl.val != null ? hl.val < 0 : undefined,
      i,
      j,
      realIndex,
      columnGroupIndex,
      bcx,
      bcy,
      barHeight: hl?.barHeight ?? barHeight,
      barWidth: hl?.barWidth ?? barWidth,
      textRects,
      strokeWidth,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY,
    }

    if (this.barCtx.isHorizontal) {
      dataLabelsPos = this.calculateBarsDataLabelsPosition(params)
    } else {
      dataLabelsPos = this.calculateColumnsDataLabelsPosition(params)
    }

    // A waterfall's float is centred on its OWN span. The horizontal-bar
    // formula anchors the label to the bar's far edge assuming it grew from the
    // baseline, and a step that ran BACKWARDS has both bounds positive, so
    // nothing downstream can tell: the label was placed a full bar-width to the
    // left of the bar it belongs to. The recorded box says where the bar is.
    if (
      waterfallStep !== null &&
      this.barCtx.isHorizontal &&
      barDataLabelsConfig.position === 'center'
    ) {
      const box = w.waterfallData.geometry?.[realIndex]?.[j]
      if (box && box.horizontal) {
        dataLabelsPos.dataLabelsX = (box.levelStart + box.levelEnd) / 2 + offX
      }
    }

    dataLabels = noLabel
      ? null
      : this.drawCalculatedDataLabels({
          x: dataLabelsPos.dataLabelsX,
          y: dataLabelsPos.dataLabelsY,
          neg: params.neg,
          val,
          text,
          i: realIndex,
          j,
          barWidth: params.barWidth,
          barHeight: params.barHeight,
          textRects,
          dataLabelsConfig,
        })

    if (drawTotal) {
      totalDataLabels = this.drawTotalDataLabels({
        x: dataLabelsPos.totalDataLabelsX,
        y: dataLabelsPos.totalDataLabelsY,
        barWidth,
        barHeight,
        realIndex,
        j,
        textAnchor: dataLabelsPos.totalDataLabelsAnchor,
        val: totalText,
        rawVal: this.getStackedTotalValue({ realIndex, j }),
        dataLabelsConfig,
        barTotalDataLabelsConfig,
      })
    }

    return {
      dataLabelsPos,
      dataLabels,
      totalDataLabels,
    }
  }

  /**
   * True when this chart stacks in more than one group, so totals have to be
   * resolved per group rather than across the whole data point. A single-group
   * chart keeps every old code path exactly as it was. See #4173.
   */
  hasMultipleSeriesGroups() {
    return this.w.labelData.seriesGroups.length > 1
  }

  /**
   * The series group `realIndex` belongs to, or null when totals are
   * chart-wide (the single-group case).
   * @param {number} realIndex
   * @returns {{groupIndex: number} | null}
   */
  getTotalGroupContext(realIndex) {
    if (!this.hasMultipleSeriesGroups()) return null
    const groupIndex = this.barCtx.barHelpers.getSeriesGroupIndex(realIndex)
    if (groupIndex < 0) return null
    return { groupIndex }
  }

  /**
   * Whether `realIndex` is the series that should draw the stacked total.
   *
   * That is the series capping the stack. With grouped stacks each group has
   * its own cap, so gating on the chart-wide `lastActiveBarSerieIndex` drew a
   * single total for the last group only. See #4173.
   * @param {number} realIndex
   */
  drawsStackedTotal(realIndex) {
    const byGroup = this.barCtx.lastActiveBarSerieIndexByGroup
    const ctx = this.getTotalGroupContext(realIndex)
    if (ctx && byGroup && byGroup.length > ctx.groupIndex) {
      return byGroup[ctx.groupIndex] === realIndex
    }
    return this.barCtx.lastActiveBarSerieIndex === realIndex
  }

  /**
   * The raw (unformatted) stacked total at this data point. Split out of
   * getStackedTotalDataLabel so the label transition can count the total up
   * from its previous number and re-run the formatter itself each frame.
   * @param {{realIndex: any, j: any}} opts
   */
  getStackedTotalValue({ realIndex, j }) {
    if (this.hlt) return this.hlt.val
    const w = this.w
    const top = this.xStackTop(realIndex, j)
    if (top) return top[3]

    // With grouped stacks the total is the sum of this group's series only;
    // `stackedSeriesTotals` sums every series at this data point, which mixed
    // unrelated groups into one number. See #4173.
    const ctx = this.getTotalGroupContext(realIndex)
    const byGroups = w.seriesData.stackedSeriesTotalsByGroups
    return ctx && byGroups && byGroups[ctx.groupIndex]
      ? byGroups[ctx.groupIndex][j]
      : this.barCtx.stackedSeriesTotals[j]
  }

  /**
   * The running stack at this bar's x (BarStacked `tops`) on a numeric axis,
   * where bars stack by x rather than by index.
   * @param {number} realIndex @param {number} j
   */
  xStackTop(realIndex, j) {
    const w = this.w
    return (
      w.axisFlags.isXNumeric &&
      /** @type {any} */ (this.barCtx).stacks?.[
        w.labelData.seriesGroupIndex[realIndex]
      ]?.tops.get(w.seriesData.seriesX[realIndex][j])
    )
  }

  /**
   * The stacked total's text box, measured in the total's own font.
   * @param {any} text the formatted total
   */
  totalRects(text) {
    const s = this.barCtx.barOptions.dataLabels.total.style
    return new Graphics(this.w).getTextRects(
      text,
      s.fontSize,
      s.fontFamily,
      undefined,
      true,
      s.fontWeight,
    )
  }

  /** @param {{realIndex: any, j: any}} opts */
  getStackedTotalDataLabel({ realIndex, j }) {
    const w = this.w

    let val = this.getStackedTotalValue({ realIndex, j })
    if (this.totalFormatter) {
      val = this.totalFormatter(val, {
        ...w,
        seriesIndex: realIndex,
        dataPointIndex: j,
        w,
      })
    }

    return val
  }

  /**
   * How many zero bars ahead of this one were dropped from its group, which
   * only `hideZeroBarsWhenGrouped` does (and never on a stack): 0 otherwise,
   * without asking for every bar.
   * @param {number} realIndex @param {number} j
   */
  zeroEncounters(realIndex, j) {
    const w = this.w
    return !w.config.chart.stacked &&
      w.config.plotOptions.bar.hideZeroBarsWhenGrouped
      ? this.barCtx.barHelpers.getZeroValueEncounters({ i: realIndex, j })
          .zeroEncounters
      : 0
  }

  /**
   * @param {Record<string, any>} opts
   */
  calculateColumnsDataLabelsPosition(opts) {
    const w = this.w
    let {
      j,
      realIndex,
      y,
      bcx,
      barWidth,
      barHeight,
      textRects,
      dataLabelsX,
      dataLabelsY,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      strokeWidth,
      offX,
      offY,
    } = opts

    let totalDataLabelsY
    let totalDataLabelsX
    const totalDataLabelsAnchor = 'middle'
    const totalDataLabelsBcx = bcx
    barHeight = Math.abs(barHeight)

    const vertical =
      w.config.plotOptions.bar.dataLabels.orientation === 'vertical'

    const zeroEncounters = this.zeroEncounters(realIndex, j)

    bcx = bcx - strokeWidth / 2

    const dataPointsDividedWidth = w.layout.gridWidth / w.globals.dataPoints

    if (this.barCtx.isVerticalGroupedRangeBar) {
      dataLabelsX += barWidth / 2
    } else {
      if (w.axisFlags.isXNumeric) {
        dataLabelsX = bcx - barWidth / 2 + offX
      } else {
        dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX
      }
      if (zeroEncounters > 0) dataLabelsX -= barWidth * zeroEncounters
    }

    if (vertical) {
      const offsetDLX = 2
      dataLabelsX =
        dataLabelsX + textRects.height / 2 - strokeWidth / 2 - offsetDLX
    }

    const valIsNegative = opts.neg ?? w.seriesData.series[realIndex][j] < 0

    let newY = y
    if (this.barCtx.isReversed) {
      newY = y + (valIsNegative ? barHeight : -barHeight)
    }

    switch (barDataLabelsConfig.position) {
      case 'center':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + offY
          } else {
            dataLabelsY = newY + barHeight / 2 - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + textRects.height / 2 + offY
          } else {
            dataLabelsY = newY + barHeight / 2 + textRects.height / 2 - offY
          }
        }
        break
      case 'bottom':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight + offY
          } else {
            dataLabelsY = newY + barHeight - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY =
              newY - barHeight + textRects.height + strokeWidth + offY
          } else {
            dataLabelsY =
              newY + barHeight - textRects.height / 2 + strokeWidth - offY
          }
        }
        break
      case 'top':
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY + offY
          } else {
            dataLabelsY = newY - offY
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - textRects.height / 2 - offY
          } else {
            dataLabelsY = newY + textRects.height + offY
          }
        }
        break
    }

    if (opts.drawTotal) {
      let lowestPrevY = newY
      // Only this series' own group: scanning every group took the extremum
      // across the whole cluster, so a group's total floated above the
      // tallest *other* group's stack instead of its own. See #4173.
      const totalGroupCtx = this.getTotalGroupContext(realIndex)
      const top = this.xStackTop(realIndex, j)
      const stacks = top ? [] : /** @type {any} */ (this.barCtx).stacks || []
      if (top) {
        lowestPrevY = valIsNegative
          ? Math.max(newY, top[5])
          : Math.min(newY, top[4])
      }
      stacks.forEach((/** @type {any} */ g, /** @type {number} */ gi) => {
        if (totalGroupCtx && gi !== totalGroupCtx.groupIndex) return
        g.prevY.forEach((/** @type {any} */ arr) => {
          if (valIsNegative) {
            lowestPrevY = Math.max(arr[j], lowestPrevY)
          } else {
            lowestPrevY = Math.min(arr[j], lowestPrevY)
          }
        })
      })
      if (this.hlt) lowestPrevY = this.hlt.edge

      // The baseline sits clear of the stack end by a share of the text
      // height, so a large total neither sinks into its own stack nor floats
      // off it (a fixed 18px suited 11px text only).
      const h = this.totalRects(opts.totalText).height

      if (valIsNegative) {
        totalDataLabelsY =
          lowestPrevY + h * 0.77 - offY - barTotalDataLabelsConfig.offsetY
      } else {
        totalDataLabelsY =
          lowestPrevY - h * 0.3 + offY + barTotalDataLabelsConfig.offsetY
      }

      // width divided into equal parts
      const xDivision = dataPointsDividedWidth

      // Centre the total over the bar it totals. `totalDataLabelsBcx` is
      // already this series' bar position, so this is the same centring
      // `dataLabelsX` uses, with the total's own offsetX.
      //
      // For a single group this is algebraically identical to the previous
      // barGroups.length-based expression (which collapses to
      // `bcx + barWidth / 2 - xDivision` when the length is 1), so ungrouped
      // charts are unaffected; with several groups it now tracks each group's
      // bar instead of the centre of the whole cluster. See #4173.
      totalDataLabelsX =
        totalDataLabelsBcx +
        (w.axisFlags.isXNumeric
          ? -barWidth / 2
          : barWidth / 2 - xDivision) +
        barTotalDataLabelsConfig.offsetX
    }

    if (!w.config.chart.stacked) {
      if (dataLabelsY < 0) {
        dataLabelsY = 0 + strokeWidth
      } else if (dataLabelsY + textRects.height / 3 > w.layout.gridHeight) {
        dataLabelsY = w.layout.gridHeight - strokeWidth
      }
    }

    return {
      bcx,
      bcy: y,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor,
    }
  }

  /**
   * @param {Record<string, any>} opts
   */
  calculateBarsDataLabelsPosition(opts) {
    const w = this.w
    let {
      x,
      j,
      realIndex,
      bcy,
      barHeight,
      barWidth,
      textRects,
      dataLabelsX,
      strokeWidth,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY,
    } = opts

    const dataPointsDividedHeight = w.layout.gridHeight / w.globals.dataPoints
    const zeroEncounters = this.zeroEncounters(realIndex, j)

    barWidth = Math.abs(barWidth)

    let dataLabelsY
    if (this.barCtx.isPyramid) {
      // For pyramid we want the *visual* center of the rendered text to
      // sit on the segment's vertical center. `textRects.centerOffset`
      // (measured live by Graphics.getTextRects) is the signed distance
      // from the SVG `y` attribute (alphabetic baseline) to the bbox
      // center for THIS exact font/size/family — negative for typical
      // fonts where the ascender dominates the descender. Subtracting it
      // lands the bbox center exactly on segment center, no matter the
      // font.
      const centerOffset = textRects.centerOffset ?? 0
      dataLabelsY = bcy + barHeight / 2 + offY - centerOffset
    } else {
      dataLabelsY =
        bcy -
        (this.barCtx.isRangeBar ? 0 : dataPointsDividedHeight) +
        barHeight / 2 +
        textRects.height / 2 +
        offY -
        3
    }

    if (zeroEncounters > 0) dataLabelsY -= barHeight * zeroEncounters
    let totalDataLabelsX
    let totalDataLabelsY
    let totalDataLabelsAnchor = 'start'

    const valIsNegative = opts.neg ?? w.seriesData.series[realIndex][j] < 0

    let newX = x
    if (this.barCtx.isReversed) {
      newX = x + (valIsNegative ? -barWidth : barWidth)
      totalDataLabelsAnchor = valIsNegative ? 'start' : 'end'
    }

    if (this.barCtx.isPyramid) {
      // Pyramid segments are horizontally centered on the plot area's
      // midline (their geometry is a triangle expanding outward from
      // gridWidth/2). The standard horizontal-bar formulas anchor x to
      // the segment's right edge minus a value-proportional barWidth,
      // which only matches normal left-rooted bars — for pyramid that
      // produces a left-shifted label. Just center on the midline.
      dataLabelsX = w.layout.gridWidth / 2 + offX
    } else {
      switch (barDataLabelsConfig.position) {
        case 'center':
          if (valIsNegative) {
            dataLabelsX = newX + barWidth / 2 - offX
          } else {
            dataLabelsX =
              Math.max(textRects.width / 2, newX - barWidth / 2) + offX
          }
          break
        case 'bottom':
          if (valIsNegative) {
            dataLabelsX = newX + barWidth - strokeWidth - offX
          } else {
            dataLabelsX = newX - barWidth + strokeWidth + offX
          }
          break
        case 'top':
          if (valIsNegative) {
            dataLabelsX = newX - strokeWidth - offX
          } else {
            dataLabelsX = newX - strokeWidth + offX
          }
          break
      }
    }

    if (opts.drawTotal) {
      let lowestPrevX = newX
      // This series' own group only, see the matching note in the column
      // path.
      const totalGroupCtx = this.getTotalGroupContext(realIndex)
      const top = this.xStackTop(realIndex, j)
      const stacks = top ? [] : /** @type {any} */ (this.barCtx).stacks || []
      if (top) {
        lowestPrevX = valIsNegative
          ? Math.min(newX, top[4])
          : Math.max(newX, top[5])
      }
      stacks.forEach((/** @type {any} */ g, /** @type {number} */ gi) => {
        if (totalGroupCtx && gi !== totalGroupCtx.groupIndex) return
        g.prevX.forEach((/** @type {any} */ arr) => {
          if (valIsNegative) {
            lowestPrevX = Math.min(arr[j], lowestPrevX)
          } else {
            lowestPrevX = Math.max(arr[j], lowestPrevX)
          }
        })
      })
      if (this.hlt) lowestPrevX = this.hlt.edge

      const totalLabeltextRects = this.totalRects(opts.totalText)
      if (valIsNegative) {
        totalDataLabelsX =
          lowestPrevX - strokeWidth - offX - barTotalDataLabelsConfig.offsetX

        totalDataLabelsAnchor = 'end'
      } else {
        totalDataLabelsX =
          lowestPrevX +
          offX +
          barTotalDataLabelsConfig.offsetX +
          (this.barCtx.isReversed ? -(barWidth + strokeWidth) : strokeWidth)
      }
      totalDataLabelsY =
        dataLabelsY -
        textRects.height / 2 +
        totalLabeltextRects.height / 2 +
        barTotalDataLabelsConfig.offsetY +
        strokeWidth

      // Recentre across the cluster only when one label stands for every
      // group. With a label per group each already sits on its own bar's
      // `dataLabelsY`, so shifting by the cluster height would drag it off the
      // bar it belongs to. See #4173.
      if (w.globals.barGroups.length > 1 && !totalGroupCtx) {
        totalDataLabelsY =
          totalDataLabelsY - (w.globals.barGroups.length / 2) * (barHeight / 2)
      }
    }

    if (!w.config.chart.stacked) {
      // Keep the label inside the plot area.
      //
      // This has to reason about the anchor the label will RENDER with, not the
      // configured one. `drawCalculatedDataLabels` swaps start<->end for
      // negative values on a horizontal bar, so a `textAnchor:'end'` label on a
      // negative series actually grows to the RIGHT of `dataLabelsX`. The
      // previous version branched on the configured anchor and so guarded the
      // opposite edge to the one the text was about to cross, which let long
      // labels run clean off the chart (a `position:'center'` +
      // `textAnchor:'end'` label on a negative series was clipped by the SVG
      // edge, and its `textAnchor:'start'` mirror escaped to the left).
      const flipped =
        valIsNegative && dataLabelsConfig.textAnchor !== 'middle'
          ? dataLabelsConfig.textAnchor === 'start'
            ? 'end'
            : 'start'
          : dataLabelsConfig.textAnchor

      // How much of the text sits either side of `dataLabelsX`. A vertical
      // label is rotated about that point, so it is the text HEIGHT that spans
      // horizontally, half to each side, whatever the anchor.
      let spanLeft
      if (barDataLabelsConfig.orientation === 'vertical') {
        spanLeft = textRects.height / 2
      } else if (flipped === 'end') {
        spanLeft = textRects.width
      } else if (flipped === 'middle') {
        spanLeft = textRects.width / 2
      } else {
        spanLeft = 0
      }
      const span =
        barDataLabelsConfig.orientation === 'vertical'
          ? textRects.height
          : textRects.width
      const spanRight = span - spanLeft

      // Only shift a label that does not fit; one wider than the plot area
      // cannot be satisfied at both edges, so favour the left.
      if (dataLabelsX + spanRight > w.layout.gridWidth - strokeWidth) {
        dataLabelsX = w.layout.gridWidth - spanRight - strokeWidth
      }
      if (dataLabelsX - spanLeft < strokeWidth) {
        dataLabelsX = spanLeft + strokeWidth
      }
    }

    return {
      bcx: x,
      bcy,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor,
    }
  }

  /** @param {{x: any, y: any, val: any, text?: any, neg?: boolean, i: any, j: any, textRects: any, barHeight: any, barWidth: any, dataLabelsConfig: any}} opts */
  drawCalculatedDataLabels({
    x,
    y,
    val,
    text,
    neg,
    i, // = realIndex
    j,
    textRects,
    barHeight,
    barWidth,
    dataLabelsConfig,
  }) {
    const w = this.w
    let rotate = 'rotate(0)'
    if (w.config.plotOptions.bar.dataLabels.orientation === 'vertical')
      rotate = `rotate(-90, ${x}, ${y})`

    const dataLabels = new DataLabels(this.barCtx.w, this.barCtx.ctx)
    const graphics = new Graphics(this.barCtx.w)
    const formatter = dataLabelsConfig.formatter

    let elDataLabelsWrap = null

    const isSeriesCollapsed = w.globals.collapsedSeriesIndices.indexOf(i) > -1
    // A series collapsing in THIS update keeps painting its bars for the length
    // of the exit tween (see the fill guard in Bar.renderSeries), so its labels
    // have to ride along, otherwise the slice sits there unlabelled the whole
    // way down while every other slice keeps its number.
    const isSeriesCollapsing =
      (w.globals.collapsingSeriesIndices || []).indexOf(i) > -1
    const dlKey = `${i}::${this.barCtx._keys(i)[j]}`

    if (isSeriesCollapsing) {
      // Its series has already been zero-filled, so `val` is 0 (or blank) even
      // though the bar on screen is still at its old height. Label it with what
      // it was until it has finished shrinking away.
      const prev = w.globals.prevDataLabels?.get(dlKey)
      if (prev && isFinite(prev.val)) {
        val = prev.val
        text = undefined
      }
    }

    if (dataLabelsConfig.enabled && (!isSeriesCollapsed || isSeriesCollapsing)) {
      elDataLabelsWrap = graphics.group({
        class: 'apexcharts-data-labels',
        transform: rotate,
      })

      // Stamp datum identity + raw value so the opt-in data-label transition
      // (ride to new position + count-up) can match a label to its previous
      // frame across a data update. Only scalar (non-range) values count up.
      const dlCfg = w.config.dataLabels
      if (dlCfg.animate?.enabled || dlCfg.countUp?.enabled) {
        elDataLabelsWrap.node.setAttribute('data:dlKey', dlKey)
        elDataLabelsWrap.node.setAttribute('data:dlJ', String(j))
        if (typeof val === 'number' && isFinite(val)) {
          elDataLabelsWrap.node.setAttribute('data:dlVal', String(val))
        }
      }

      if (val === undefined) {
        text = ''
      } else if (text === undefined) {
        text = formatter(val, {
          ...w,
          seriesIndex: i,
          dataPointIndex: j,
          w,
        })
      }

      if (!val && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        text = ''
      }

      // A vertical label's anchor is resolved per label. Writing it into the
      // shared config re-anchored every later label, line labels included.
      let anchor = dataLabelsConfig.textAnchor
      if (w.config.plotOptions.bar.dataLabels.orientation === 'vertical') {
        anchor =
          w.config.plotOptions.bar.dataLabels.position === 'center'
            ? 'middle'
            : (neg ?? w.seriesData.series[i][j] < 0)
              ? 'end'
              : 'start'
      }

      // hide the datalabel if it cannot fit into the rect (measured in the
      // drawn font, weight included)
      if (
        this.barCtx.isRangeBar &&
        this.barCtx.barOptions.dataLabels.hideOverflowingLabels &&
        barWidth < textRects.width
      ) {
        text = ''
      }

      if (
        w.config.chart.stacked &&
        this.barCtx.barOptions.dataLabels.hideOverflowingLabels &&
        // A collapsing series is measured against its NEW extent, which is
        // already zero, so this would blank a label whose bar is still at full
        // height on screen. It starts out fitting and fades away with the mark.
        !isSeriesCollapsing
      ) {
        // if there is not enough space to draw the label in the bar/column rect, check hideOverflowingLabels property to prevent overflowing on wrong rect
        // Note: This issue is only seen in stacked charts
        if (this.barCtx.isHorizontal) {
          if (textRects.width / 1.6 > Math.abs(barWidth)) {
            text = ''
          }
        } else {
          if (
            textRects.height / 1.6 > Math.abs(barHeight) ||
            textRects.width > Math.abs(barWidth)
          ) {
            text = ''
          }
        }
      }

      const modifiedDataLabelsConfig = {
        ...dataLabelsConfig,
        textAnchor: anchor,
      }
      if (this.barCtx.isHorizontal && val < 0) {
        if (anchor === 'start') {
          modifiedDataLabelsConfig.textAnchor = 'end'
        } else if (anchor === 'end') {
          modifiedDataLabelsConfig.textAnchor = 'start'
        }
      }

      dataLabels.plotDataLabelsText({
        x,
        y,
        text,
        i,
        j,
        parent: elDataLabelsWrap,
        dataLabelsConfig: modifiedDataLabelsConfig,
        alwaysDrawDataLabel: true,
        offsetCorrection: true,
      })
    }

    return elDataLabelsWrap
  }

  /** @param {{ x?: any, y?: any, val?: any, rawVal?: any, realIndex?: any, j?: any, textAnchor?: any, barWidth?: any, barHeight?: any, dataLabelsConfig?: any, barTotalDataLabelsConfig?: any }} opts */
  drawTotalDataLabels({
    x,
    y,
    val,
    rawVal,
    realIndex,
    j,
    textAnchor,
    barTotalDataLabelsConfig,
  }) {
    const graphics = new Graphics(this.barCtx.w)

    let totalDataLabelText

    if (
      barTotalDataLabelsConfig.enabled &&
      typeof x !== 'undefined' &&
      typeof y !== 'undefined' &&
      this.drawsStackedTotal(realIndex)
    ) {
      totalDataLabelText = graphics.drawText({
        x: x,
        y: y,
        foreColor: barTotalDataLabelsConfig.style.color,
        text: val,
        textAnchor,
        fontFamily: barTotalDataLabelsConfig.style.fontFamily,
        fontSize: barTotalDataLabelsConfig.style.fontSize,
        fontWeight: barTotalDataLabelsConfig.style.fontWeight,
      })

      // The total is a SIBLING of the per-segment label groups (it hangs off
      // the series-wide `.apexcharts-datalabels` wrap), and it tracks the top
      // of the whole stack rather than any one segment, so it carries its own
      // key, anchor and raw value and gets its own tween. See
      // DataLabelTransition.
      totalDataLabelText.attr({
        class: 'apexcharts-datalabel-total',
        cx: x,
        cy: y,
      })
      const dlCfg = this.w.config.dataLabels
      if (dlCfg.animate?.enabled || dlCfg.countUp?.enabled) {
        // Keyed by GROUP, not by the series that draws it. The total is drawn
        // by the topmost ACTIVE series, so hiding the last series changes the
        // drawer (and its realIndex); a realIndex-based key then matches
        // nothing from the previous frame and the ride silently degrades to a
        // snap - but only when the LAST series is toggled, which is exactly how
        // it escaped. Group membership comes from config and survives legend
        // toggles. The drawing series still rides along in its own attribute
        // for the formatter's seriesIndex.
        const { groupIndex } = this.barCtx.barHelpers.getGroupIndex(realIndex)
        totalDataLabelText.node.setAttribute(
          'data:dlTotalKey',
          `${groupIndex}::${this.barCtx._keys(realIndex)[j]}`,
        )
        totalDataLabelText.node.setAttribute(
          'data:dlTotalSeries',
          String(realIndex),
        )
        if (typeof rawVal === 'number' && isFinite(rawVal)) {
          totalDataLabelText.node.setAttribute('data:dlTotalVal', String(rawVal))
        }
      }
    }

    return totalDataLabelText
  }
}
