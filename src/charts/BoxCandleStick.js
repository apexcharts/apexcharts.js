// @ts-check
import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import { buildJitterGroups, renderJitter } from './common/Jitter'
import {
  datumKey,
  lengthTransitionEnabled,
  renderBarExitGhosts,
} from '../modules/animations/LengthTransition'

/**
 * ApexCharts BoxCandleStick Class responsible for drawing both Stacked Columns and Bars.
 *
 * @module BoxCandleStick
 **/

class BoxCandleStick extends Bar {
  /**
   * The previous shape of one half of a box, or null.
   *
   * A box plot draws each datum as TWO paths, the box either side of the
   * median, and both carry the datum's key. The keyed lookup the bar renderer
   * uses (one path per key) would hand both halves the same previous path,
   * so the upper box would morph out of the lower one. Halves are captured in
   * draw order, so the n-th path under a key is half n. Candlesticks draw one
   * path per datum and take the plain keyed lookup.
   * @param {number} realIndex
   * @param {number} j
   * @param {number} pi which half, in draw order
   * @returns {string | null}
   */
  /**
   * Whether this update keeps too little of the series' identity to morph.
   *
   * Candles morph from their own previous shape, matched by datum key. That
   * is right when most of what was on screen is still there afterwards: a
   * value update, a legend toggle, a zoom over plain data (zooming out keeps
   * every candle that was shown). It is wrong when the candles themselves are
   * replaced: a data reducer re-aggregates on every zoom, and on the
   * large-dataset sample a zoom-in kept 30 of 250 candles, so the morph was
   * ~220 exit ghosts shrinking while ~220 new candles grew, the heavy "goes
   * here and there" motion the fade was introduced to avoid. Below half of
   * the previously drawn candles surviving, the series fades instead.
   * @param {number} realIndex
   * @param {any[]} row this series' parsed values
   * @returns {boolean}
   */
  _identityLost(realIndex, row) {
    if (!lengthTransitionEnabled(this.w)) return false
    const keyed = this._prevKeyedPaths(realIndex)
    if (!keyed || keyed.size === 0 || !row || row.length === 0) return false
    let survivors = 0
    for (let j = 0; j < row.length; j++) {
      if (keyed.has(datumKey(this.w, realIndex, j))) survivors++
    }
    return survivors / keyed.size < 0.5
  }

  /**
   * @param {number} realIndex
   * @param {number} j
   * @param {number} pi
   * @returns {string | null}
   */
  _prevBoxHalf(realIndex, j, pi) {
    if (!this.isBoxPlot) return null
    if (!this._prevHalves) {
      /** @type {Record<number, Map<string, string[]> | null>} */
      this._prevHalves = {}
    }
    let map = this._prevHalves[realIndex]
    if (map === undefined) {
      map = null
      const record = this._prevRecord(realIndex)
      if (record && record.paths.every((/** @type {any} */ p) => p.key != null)) {
        map = new Map()
        for (const p of record.paths) {
          const list = map.get(p.key) || []
          list.push(p.d)
          map.set(p.key, list)
        }
      }
      this._prevHalves[realIndex] = map
    }
    const halves = map && map.get(datumKey(this.w, realIndex, j))
    return halves && halves.length === 2 ? halves[pi] : null
  }

  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} seriesIndex
   */
  // @ts-ignore -- BoxCandleStick.draw has an extra ctype param compared to Bar.draw
  draw(series, ctype, seriesIndex) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const type = w.globals.comboCharts ? ctype : w.config.chart.type
    const fill = new Fill(this.w)

    this.candlestickOptions = this.w.config.plotOptions.candlestick
    this.boxOptions = this.w.config.plotOptions.boxPlot
    this.isHorizontal = w.config.plotOptions.bar.horizontal
    this.isOHLC =
      this.candlestickOptions && this.candlestickOptions.type === 'ohlc'

    this.coreUtils = new CoreUtils(this.w)
    series = this.coreUtils.getLogSeries(series)
    this.series = series
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series)

    const ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`,
    })

    for (let i = 0; i < series.length; i++) {
      this.isBoxPlot =
        w.config.chart.type === 'boxPlot' ||
        /** @type {Record<string,any>} */ (w.config.series[i]).type === 'boxPlot'

      /** @type {any} */
      let x
      /** @type {any} */
      let y

      const yArrj = [] // hold y values of current iterating series
      const xArrj = [] // hold x values of current iterating series

      const realIndex = w.globals.comboCharts
        ? /** @type {any} */ (seriesIndex)[i]
        : i
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex)

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
        this.yaxisIndex = /** @type {any} */ (
          w.globals.seriesYAxisReverseMap[realIndex]
        )[0]
        translationsIndex = realIndex
      }

      const initPositions = this.barHelpers.initialPositions(realIndex)
      const {
        y: initY,
        barHeight,
        yDivision, // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroW, // zeroW is the baseline where 0 meets x axis
        x: initX,
        barWidth,
        xDivision, // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        zeroH, // zeroH is the baseline where 0 meets y axis
      } = initPositions

      y = initY
      x = initX

      xArrj.push(x + (barWidth ?? 0) / 2)

      const elDataLabelsWrap = graphics.group({
        class: 'apexcharts-datalabels',
        'data:realIndex': realIndex,
      })

      const elGoalsMarkers = graphics.group({
        class: 'apexcharts-bar-goals-markers',
      })

      // Optional jitter (raw observations supplied via `points`) per box —
      // collected here, then rendered as one delayed-reveal overlay after all
      // boxes. boxPlot only; candlesticks have no raw-observation channel.
      const boxPointsOpts = this.isBoxPlot ? this.boxOptions.points : null
      /** @type {{groups:{fill:string|null,d:string}[], j:number}[]} */
      const pointsByCat = []

      // Viewport culling (vertical candlestick / OHLC / boxPlot): for bars whose
      // pixel-x falls outside the plot area (+ a one-bar buffer) drawVerticalBoxPaths
      // returns before building the (costly) path string + pathFrom, and we skip
      // DOM creation here. Pixel-space testing means this is automatic on zoom/pan
      // (off-screen bars get a barXPosition < 0 or > gridWidth) and a complete no-op
      // when the whole series fits. drawVerticalBoxPaths still computes each bar's
      // x/y positions before the early-out, so the seriesXvalues/seriesYvalues
      // arrays below stay filled for every j and tooltip/crosshair index-mapping
      // stays correct for the culled bars.
      const gridW = w.layout.gridWidth
      // As far as the bar clip reaches past the plot: a group of several
      // series hangs into the numeric-axis pad by up to half the group, and
      // a box there is on screen.
      const cullBuffer = Math.max(
        barWidth ?? 0,
        w.globals.barPadForNumericAxis || 0,
      )

      // A series with no data at all (hidden from the legend) draws nothing.
      // The loop below would otherwise draw one mark per data point from
      // missing values: a candle flat on the baseline, and a box whose median
      // is the raw 0 rather than a pixel y, so it spanned the whole plot. Those
      // marks were invisible at rest, but they were the shape a re-shown
      // series morphed out of (a full-height spike on frame 0). Hidden, the
      // series leaves through the exit ghosts below; shown again, each mark
      // grows from its own line, as it does on mount.
      const dataPoints = series[i].length === 0 ? 0 : w.globals.dataPoints

      // Morph when the update keeps the candles' identity, fade when it does
      // not (see _identityLost).
      const fadeReveal = this._identityLost(realIndex, series[i])

      for (let j = 0; j < dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)

        let paths = /** @type {any} */ (null)
        const pathsParams = {
          indexes: {
            i,
            j,
            realIndex,
            translationsIndex,
          },
          x,
          y,
          strokeWidth,
          elSeries,
        }

        if (this.isHorizontal) {
          paths = this.drawHorizontalBoxPaths({
            ...pathsParams,
            yDivision,
            barHeight,
            zeroW,
          })
        } else {
          paths = this.drawVerticalBoxPaths({
            ...pathsParams,
            xDivision,
            barWidth,
            zeroH,
            cullBounds: { lo: -cullBuffer, hi: gridW + cullBuffer },
          })
        }

        y = paths.y
        x = paths.x

        // push current X / Y for every bar — even culled ones — so downstream
        // tooltip/crosshair index-mapping (seriesXvalues/seriesYvalues) is dense.
        if (j > 0) {
          xArrj.push(x + (barWidth ?? 0) / 2)
        }
        yArrj.push(y)

        // drawVerticalBoxPaths returns culled:true for off-screen bars (it
        // skipped the path-string build). Horizontal bars are never culled.
        if (paths.culled) {
          continue
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

        /**
         * @param {string} pathTo
         * @param {number} pi
         */
        paths.pathTo.forEach(
          (/** @type {any} */ pathTo, /** @type {any} */ pi) => {
            const lineFill =
              !this.isBoxPlot && this.candlestickOptions.wick.useFillColor
                ? paths.color[pi]
                : w.globals.stroke.colors[i]

            const pathFill = fill.fillPath({
              seriesNumber: realIndex,
              dataPointIndex: j,
              color: paths.color[pi],
              value: series[i][j],
            })

            this.renderSeries({
              realIndex,
              pathFill,
              lineFill,
              j,
              i,
              pathFrom: this._prevBoxHalf(realIndex, j, pi) ?? paths.pathFrom,
              fadeReveal,
              pathTo,
              strokeWidth,
              elSeries,
              x,
              y,
              series,
              columnGroupIndex,
              barHeight,
              barWidth,
              elDataLabelsWrap,
              elGoalsMarkers,
              visibleSeries: this.visibleI,
              type: w.config.chart.type,
            })
          },
        )

        // Build jitter sub-paths for this box (scattered within the box width).
        if (boxPointsOpts && boxPointsOpts.show !== false) {
          const pts = w.candleData.seriesBoxPoints[realIndex]?.[j]
          if (pts && pts.length) {
            /** @param {number} v */
            const logVal = (v) =>
              /** @type {any} */ (this.coreUtils).getLogValAtSeriesIndex(
                v,
                realIndex,
              )
            let center, halfExtent, alongFn
            if (this.isHorizontal) {
              const yRatio = this.invertedYRatio
              const bh = barHeight ?? 0
              const z = zeroW ?? 0
              center = paths.barYPosition + bh / 2
              halfExtent = bh / 2
              alongFn = (/** @type {number} */ v) => z + logVal(v) / yRatio
            } else {
              const yRatio = this.yRatio[translationsIndex]
              const bw = barWidth ?? 0
              const z = zeroH ?? 0
              center = paths.barXPosition + bw / 2
              halfExtent = bw / 2
              alongFn = (/** @type {number} */ v) => z - logVal(v) / yRatio
            }
            const groups = buildJitterGroups({
              w,
              points: pts,
              seedA: realIndex,
              seedB: j,
              center,
              halfExtent,
              alongFn,
              isHorizontal: this.isHorizontal,
              options: boxPointsOpts,
            })
            if (groups.length) pointsByCat.push({ groups, j })
          }
        }
      }

      // Jitter overlay (shared module): one packed path per box, revealed
      // gradually after the box paths animate.
      if (boxPointsOpts) {
        renderJitter({
          graphics,
          w,
          elSeries,
          pointsByCat,
          options: boxPointsOpts,
          distributed: w.config.plotOptions.bar.distributed,
          realIndex,
          wrapClass: 'apexcharts-boxPlot-points-wrap',
          pointClass: 'apexcharts-boxPlot-points',
        })
      }

      // push all x val arrays into main xArr
      w.globals.seriesXvalues[realIndex] = xArrj
      w.globals.seriesYvalues[realIndex] = yArrj

      // Exit ghosts, as Bar.draw renders them: candles/boxes whose datum is
      // gone (a series hidden from the legend, rows removed) shrink away under
      // the survivors instead of vanishing. Keyed by every datum the series
      // still has, culled ones included: a candle only scrolled off-screen
      // has not left, it is just not drawn.
      // (Not when the series fades: the fade replaces the whole set at once.)
      if (w.globals.previousPaths.length > 0 && !fadeReveal) {
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

  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, zeroH: any, strokeWidth: any, cullBounds?: {lo: number, hi: number}|null}} opts */
  drawVerticalBoxPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth,
    cullBounds = null,
  }) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const i = indexes.i
    const j = indexes.j

    const { colors: candleColors } = w.config.plotOptions.candlestick
    const { colors: boxColors } = this.boxOptions
    const realIndex = indexes.realIndex

    /**
     * @param {string} color
     */
    const getColor = (color) =>
      Array.isArray(color) ? color[realIndex] : color

    const colorPos = getColor(candleColors.upward)
    const colorNeg = getColor(candleColors.downward)

    const yRatio = this.yRatio[indexes.translationsIndex]

    const ohlc = this.getOHLCValue(realIndex, j)
    let l1 = zeroH
    let l2 = zeroH

    let color = ohlc.o < ohlc.c ? [colorPos] : [colorNeg]

    if (this.isBoxPlot) {
      color = [getColor(boxColors.lower), getColor(boxColors.upper)]
    }

    let y1 = Math.min(ohlc.o, ohlc.c)
    let y2 = Math.max(ohlc.o, ohlc.c)
    let m = ohlc.m

    // On a numeric x axis the GROUP of candles/boxes at an x is centered on
    // it, the same mapping grouped columns use. Offsetting by one bar width
    // instead centered only the first series: with three series the last one
    // ran past the right edge of the plot, half clipped, and its final candle
    // fell outside the cull bounds and was not drawn at all. One series is
    // unchanged (barWidth * seriesLen / 2 is barWidth / 2).
    let barXPosition = x + barWidth * this.visibleI
    if (w.axisFlags.isXNumeric) {
      const pos = this.getBarXForNumericXAxis({ x, barWidth, realIndex, j })
      x = pos.x
      barXPosition = pos.barXPosition
    }

    if (
      typeof /** @type {any} */ (this.series)[i]?.[j] === 'undefined' ||
      /** @type {any} */ (this.series)[i]?.[j] === null
    ) {
      y1 = zeroH
      y2 = zeroH
    } else {
      y1 = zeroH - y1 / yRatio
      y2 = zeroH - y2 / yRatio
      l1 = zeroH - ohlc.h / yRatio
      l2 = zeroH - ohlc.l / yRatio
      m = zeroH - ohlc.m / yRatio
    }

    // Viewport cull: an off-screen bar skips the path-string build below (and
    // pathFrom). Positions (barXPosition / y2 / advanced x) are already computed,
    // so the caller still fills seriesXvalues/seriesYvalues densely — only the
    // string concatenation + DOM work is avoided. x advances exactly as the
    // normal return path would (category axis accumulates xDivision; numeric
    // recomputes from seriesX next iteration so its returned x is moot).
    //
    // Except a candle that was on screen before an animated update: it is
    // drawn so it can morph to its new, off-screen place and slide out under
    // the clip (a zoom-in pushing the outer candles away). Culled outright it
    // vanished on frame 0 while the rest were still moving. The extra marks
    // are bounded by what was visible before, and large datasets skip the
    // morph for the bulk fade anyway.
    if (
      cullBounds &&
      (barXPosition + barWidth < cullBounds.lo ||
        barXPosition > cullBounds.hi) &&
      !this._wasOnScreen(realIndex, j)
    ) {
      return {
        pathTo: null,
        pathFrom: null,
        x: w.axisFlags.isXNumeric ? x : x + xDivision,
        y: y2,
        barXPosition,
        color,
        culled: true,
      }
    }

    let pathTo
    if (this.isOHLC) {
      const centerX = barXPosition + barWidth / 2
      const openY = zeroH - ohlc.o / yRatio
      const closeY = zeroH - ohlc.c / yRatio

      pathTo = [
        graphics.move(centerX, l1) +
          graphics.line(centerX, l2) +
          graphics.move(centerX, openY) +
          graphics.line(barXPosition, openY) +
          graphics.move(centerX, closeY) +
          graphics.line(barXPosition + barWidth, closeY),
      ]
    } else if (this.isBoxPlot) {
      pathTo = [
        graphics.move(barXPosition, y1) +
          graphics.line(barXPosition + barWidth / 2, y1) +
          graphics.line(barXPosition + barWidth / 2, l1) +
          graphics.line(barXPosition + barWidth / 4, l1) +
          graphics.line(barXPosition + barWidth - barWidth / 4, l1) +
          graphics.line(barXPosition + barWidth / 2, l1) +
          graphics.line(barXPosition + barWidth / 2, y1) +
          graphics.line(barXPosition + barWidth, y1) +
          graphics.line(barXPosition + barWidth, m) +
          graphics.line(barXPosition, m) +
          graphics.line(barXPosition, y1 + strokeWidth / 2),
        graphics.move(barXPosition, m) +
          graphics.line(barXPosition + barWidth, m) +
          graphics.line(barXPosition + barWidth, y2) +
          graphics.line(barXPosition + barWidth / 2, y2) +
          graphics.line(barXPosition + barWidth / 2, l2) +
          graphics.line(barXPosition + barWidth - barWidth / 4, l2) +
          graphics.line(barXPosition + barWidth / 4, l2) +
          graphics.line(barXPosition + barWidth / 2, l2) +
          graphics.line(barXPosition + barWidth / 2, y2) +
          graphics.line(barXPosition, y2) +
          graphics.line(barXPosition, m) +
          'z',
      ]
    } else {
      // Regular candlestick
      pathTo = [
        graphics.move(barXPosition, y2) +
          graphics.line(barXPosition + barWidth / 2, y2) +
          graphics.line(barXPosition + barWidth / 2, l1) +
          graphics.line(barXPosition + barWidth / 2, y2) +
          graphics.line(barXPosition + barWidth, y2) +
          graphics.line(barXPosition + barWidth, y1) +
          graphics.line(barXPosition + barWidth / 2, y1) +
          graphics.line(barXPosition + barWidth / 2, l2) +
          graphics.line(barXPosition + barWidth / 2, y1) +
          graphics.line(barXPosition, y1) +
          graphics.line(barXPosition, y2 - strokeWidth / 2),
      ]
    }

    let pathFrom = null
    // Cross-type morph (unit → boxPlot): grow out of the captured dot cloud
    // rather than up from the baseline, so collapsing is the inverse of the
    // explode. No-op when the morph feature isn't registered or no snapshot is
    // active. Same precedence as bar/Helpers.js.
    const morphFrom = this.ctx?.morphTypeChange?.getInitialPathFor(realIndex, j)
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Update: keyed survivor → morph; shape-changed → snap; entering
      // datum → null (falls through to the baseline collapse below).
      pathFrom = this.getPreviousPath(realIndex, j, pathTo[0])
    }
    if (pathFrom == null) {
      // Initial mount or entering datum: baseline collapsed at the bar's center.
      pathFrom =
        graphics.move(barXPosition + barWidth / 2, y1) +
        graphics.move(barXPosition, y1)
    }

    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision
    }

    return {
      pathTo,
      pathFrom,
      x,
      y: y2,
      goalY: this.barHelpers.getGoalValues(
        'y',
        /** @type {any} */ (null),
        zeroH,
        realIndex,
        j,
        indexes.translationsIndex,
      ),
      barXPosition,
      color,
    }
  }

  /** @param {{indexes: any, y: any, yDivision: any, barHeight: any, zeroW: any, strokeWidth: any}} opts */
  drawHorizontalBoxPaths({
    indexes,
    y,
    yDivision,
    barHeight,
    zeroW,
    strokeWidth,
  }) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const i = indexes.i
    const j = indexes.j
    const realIndex = indexes.realIndex

    const { colors: candleColors } = w.config.plotOptions.candlestick
    const { colors: boxColors } = this.boxOptions

    /**
     * @param {string} color
     */
    const getColor = (color) =>
      Array.isArray(color) ? color[realIndex] : color

    const yRatio = this.invertedYRatio
    const ohlc = this.getOHLCValue(realIndex, j)

    let color =
      ohlc.o < ohlc.c
        ? [getColor(candleColors.upward)]
        : [getColor(candleColors.downward)]

    if (this.isBoxPlot) {
      color = [getColor(boxColors.lower), getColor(boxColors.upper)]
    }

    let l1 = zeroW
    let l2 = zeroW

    let x1 = Math.min(ohlc.o, ohlc.c)
    let x2 = Math.max(ohlc.o, ohlc.c)
    let m = ohlc.m

    if (w.axisFlags.isXNumeric) {
      y =
        (w.seriesData.seriesX[realIndex][j] - w.globals.minX) /
          this.invertedXRatio -
        barHeight / 2
    }

    const barYPosition = y + barHeight * this.visibleI

    if (
      typeof /** @type {any} */ (this.series)[i]?.[j] === 'undefined' ||
      /** @type {any} */ (this.series)[i]?.[j] === null
    ) {
      x1 = zeroW
      x2 = zeroW
    } else {
      x1 = zeroW + x1 / yRatio
      x2 = zeroW + x2 / yRatio
      l1 = zeroW + ohlc.h / yRatio
      l2 = zeroW + ohlc.l / yRatio
      m = zeroW + ohlc.m / yRatio
    }

    const pathTo = [
      graphics.move(x1, barYPosition) +
        graphics.line(x1, barYPosition + barHeight / 2) +
        graphics.line(l1, barYPosition + barHeight / 2) +
        graphics.line(l1, barYPosition + barHeight / 2 - barHeight / 4) +
        graphics.line(l1, barYPosition + barHeight / 2 + barHeight / 4) +
        graphics.line(l1, barYPosition + barHeight / 2) +
        graphics.line(x1, barYPosition + barHeight / 2) +
        graphics.line(x1, barYPosition + barHeight) +
        graphics.line(m, barYPosition + barHeight) +
        graphics.line(m, barYPosition) +
        graphics.line(x1 + strokeWidth / 2, barYPosition),
      graphics.move(m, barYPosition) +
        graphics.line(m, barYPosition + barHeight) +
        graphics.line(x2, barYPosition + barHeight) +
        graphics.line(x2, barYPosition + barHeight / 2) +
        graphics.line(l2, barYPosition + barHeight / 2) +
        graphics.line(l2, barYPosition + barHeight - barHeight / 4) +
        graphics.line(l2, barYPosition + barHeight / 4) +
        graphics.line(l2, barYPosition + barHeight / 2) +
        graphics.line(x2, barYPosition + barHeight / 2) +
        graphics.line(x2, barYPosition) +
        graphics.line(m, barYPosition) +
        'z',
    ]

    let pathFrom = null
    // Cross-type morph (unit → boxPlot), horizontal. See the vertical branch.
    const morphFrom = this.ctx?.morphTypeChange?.getInitialPathFor(realIndex, j)
    if (morphFrom) {
      pathFrom = morphFrom
    } else if (w.globals.previousPaths.length > 0) {
      // Update: keyed survivor → morph; shape-changed → snap; entering
      // datum → null (falls through to the baseline collapse below).
      pathFrom = this.getPreviousPath(realIndex, j, pathTo[0])
    }
    if (pathFrom == null) {
      // Initial mount or entering datum: baseline collapsed at the bar's center.
      pathFrom =
        graphics.move(x1, barYPosition + barHeight / 2) +
        graphics.move(x1, barYPosition)
    }

    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision
    }

    return {
      pathTo,
      pathFrom,
      x: x2,
      y,
      goalX: this.barHelpers.getGoalValues(
        'x',
        zeroW,
        /** @type {any} */ (null),
        realIndex,
        j,
        0,
      ),
      barYPosition,
      color,
    }
  }

  /**
   * @param {number} i
   * @param {number} j
   */
  getOHLCValue(i, j) {
    const w = this.w
    const coreUtils = this.coreUtils
    /**
     * @param {any[]} arr
     */
    const getCandleVal = (arr) =>
      arr[i] && arr[i][j] != null
        ? /** @type {any} */ (coreUtils).getLogValAtSeriesIndex(arr[i][j], i)
        : 0

    const h = getCandleVal(w.candleData.seriesCandleH)
    const o = getCandleVal(w.candleData.seriesCandleO)
    const m = getCandleVal(w.candleData.seriesCandleM)
    const c = getCandleVal(w.candleData.seriesCandleC)
    const l = getCandleVal(w.candleData.seriesCandleL)

    // BoxPlot data arrives as [min, q1, median, q3, max] and is stored in
    // H=min, O=q1, M=median, C=q3, L=max — remap to OHLC semantics:
    // o=q1(O), h=min(H), m=median(M), l=q3(C), c=max(L)
    return {
      o: this.isBoxPlot ? h : o,
      h: this.isBoxPlot ? o : h,
      m,
      l: this.isBoxPlot ? c : l,
      c: this.isBoxPlot ? l : c,
    }
  }
}

export default BoxCandleStick
