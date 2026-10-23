// @ts-check
import CoreUtils from '../modules/CoreUtils'
import Bar from './Bar'
import Fill from '../modules/Fill'
import Graphics from '../modules/Graphics'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import { buildJitterGroups, jitterExtent, renderJitter } from './common/Jitter'
import {
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
      if (keyed.has(this._keys(realIndex)[j])) survivors++
    }
    return survivors / keyed.size < 0.5
  }

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
  _prevBoxHalf(realIndex, j, pi) {
    if (!this.isBoxPlot || !this._pathFromUsed()) return null
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
    const halves = map && map.get(this._keys(realIndex)[j])
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

    this.coreUtils = new CoreUtils(this.w)
    series = this.coreUtils.getLogSeries(series)
    this.series = series
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio)

    this.barHelpers.initVariables(series, seriesIndex)

    const ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`,
    })

    // Every series drawn here has this type: a combo hands each type its own
    // series. In a combo the chart's type can be another series' (the line's,
    // beside candles), and `i` counts only this type's series, not the
    // config's: reading either drew a candle as a box, or a box as a candle.
    this.isBoxPlot = type === 'boxPlot'
    this.isOHLC = !this.isBoxPlot && this.candlestickOptions?.type === 'ohlc'
    const jx = jitterExtent(w.candleData.seriesBoxPoints, w)

    for (let i = 0; i < series.length; i++) {
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

      const translationsIndex = this.setSeriesAxis(realIndex)

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
      // pixel-x falls outside the plot area (+ a one-bar buffer) drawBoxPaths
      // returns before building the (costly) path string + pathFrom, and we skip
      // DOM creation here. Pixel-space testing means this is automatic on zoom/pan
      // (off-screen bars get a barXPosition < 0 or > gridWidth) and a complete no-op
      // when the whole series fits. drawBoxPaths still computes each bar's
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
      // A fading series draws no pathFrom (see Bar._pathFromUsed).
      this._fadeReveal = fadeReveal

      for (let j = 0; j < dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex)

        const paths = /** @type {any} */ (
          this.drawBoxPaths({
            indexes: {
              i,
              j,
              realIndex,
              translationsIndex,
            },
            x,
            y,
            strokeWidth,
            division: this.isHorizontal ? yDivision : xDivision,
            band: this.isHorizontal ? barHeight : barWidth,
            zero: this.isHorizontal ? zeroW : zeroH,
            cullBounds: this.isHorizontal
              ? null
              : { lo: -cullBuffer, hi: gridW + cullBuffer },
          })
        )

        y = paths.y
        x = paths.x

        // push current X / Y for every bar — even culled ones — so downstream
        // tooltip/crosshair index-mapping (seriesXvalues/seriesYvalues) is dense.
        if (j > 0) {
          xArrj.push(x + (barWidth ?? 0) / 2)
        }
        yArrj.push(y)

        // drawBoxPaths returns culled:true for off-screen columns (it skipped
        // the path-string build), and for a null datum.
        if (paths.culled) {
          continue
        }

        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.slot,
          barYPosition: paths.slot,
          goalX: paths.goals,
          goalY: paths.goals,
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
            // The series' own stroke colour: `i` counts this type's series
            // only, so beside a line it named the line's.
            const lineFill =
              !this.isBoxPlot && this.candlestickOptions.wick.useFillColor
                ? paths.color[pi]
                : w.globals.stroke.colors[realIndex]

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
              noLabel: pi > 0,
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
              // The marks' class (`apexcharts-${type}-area`), which the
              // tooltip, the keyboard and the focus style know them by. The
              // chart's type classed the candles of a candle + line combo as
              // a line's area, which no intersect tooltip looked for.
              type,
            })
          },
        )

        // Build jitter sub-paths for this box (scattered within the box width).
        if (boxPointsOpts && boxPointsOpts.show !== false) {
          const pts = w.candleData.seriesBoxPoints[realIndex]?.[j]
          if (pts && pts.length) {
            const band = (this.isHorizontal ? barHeight : barWidth) ?? 0
            const groups = buildJitterGroups({
              points: pts,
              extent: jx,
              seedA: realIndex,
              seedB: j,
              center: paths.slot + band / 2,
              halfExtent: band / 2,
              // the box's own value mapping, from an observation's log value
              alongFn: (/** @type {number} */ v) =>
                paths.along(
                  /** @type {any} */ (this.coreUtils).getLogValAtSeriesIndex(
                    v,
                    realIndex,
                  ),
                ),
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
      // has not left, it is just not drawn. One turned null has left.
      // (Not when the series fades: the fade replaces the whole set at once.)
      if (
        w.globals.previousPaths.length > 0 &&
        !fadeReveal &&
        lengthTransitionEnabled(w)
      ) {
        renderBarExitGhosts({
          w,
          elSeries,
          record: this._prevRecord(realIndex),
          newKeys: this._keys(realIndex).filter(
            (_, j) => series[i][j] != null,
          ),
          isHorizontal: this.isHorizontal,
          speed: w.config.chart.animations.dynamicAnimation.speed,
        })
      }

      ret.add(elSeries)
    }

    return ret
  }

  /**
   * One candle, OHLC tick or box in either orientation. Every shape is built
   * in (along, across) coordinates: `along` is the value axis, `across` the
   * category slot from `slot` to `slot + band`. A column maps them to (y, x)
   * and a row to (x, y), so both orientations draw the same shape. Only the
   * box plot has a horizontal form (Defaults turns a horizontal candlestick
   * off).
   * @param {{indexes: any, x: any, y: any, division: any, band: any, zero: any, strokeWidth: any, cullBounds?: {lo: number, hi: number}|null}} opts
   */
  drawBoxPaths({
    indexes,
    x,
    y,
    division,
    band,
    zero,
    strokeWidth,
    cullBounds = null,
  }) {
    const w = this.w
    const graphics = new Graphics(this.w)
    const vertical = !this.isHorizontal
    const { i, j, realIndex, translationsIndex } = indexes

    const { colors: candleColors } = w.config.plotOptions.candlestick
    const { colors: boxColors } = this.boxOptions

    /**
     * @param {string} color
     */
    const getColor = (color) =>
      Array.isArray(color) ? color[realIndex] : color

    const ohlc = this.getOHLCValue(realIndex, j)
    const color = this.isBoxPlot
      ? [getColor(boxColors.lower), getColor(boxColors.upper)]
      : [
          getColor(
            ohlc.o < ohlc.c ? candleColors.upward : candleColors.downward,
          ),
        ]

    // A value's pixel along the value axis: up a column, right along a row.
    const ratio =
      (vertical ? -this.yRatio[translationsIndex] : this.invertedYRatio) *
      (this.isReversed ? -1 : 1)
    /** @param {number} v */
    const along = (v) => zero + v / ratio

    // On a numeric x axis the GROUP of candles/boxes at an x is centered on
    // it, the same mapping grouped columns use. Offsetting by one bar width
    // instead centered only the first series: with three series the last one
    // ran past the right edge of the plot, half clipped, and its final candle
    // fell outside the cull bounds and was not drawn at all. One series is
    // unchanged (barWidth * seriesLen / 2 is barWidth / 2). A row is one band
    // per category on its side, a date or number x included: see
    // Bar.drawBarPaths.
    let slot = (vertical ? x : y) + band * this.visibleI
    if (vertical && w.axisFlags.isXNumeric) {
      ;({ x, barXPosition: slot } = this.getBarXForNumericXAxis({
        x,
        barWidth: band,
        realIndex,
        j,
      }))
    }
    // where the next category's slot starts
    const next = !vertical
      ? y + division
      : w.axisFlags.isXNumeric
        ? x
        : x + division

    // a null or missing datum draws nothing, culled like an off-screen one
    const hole = /** @type {any} */ (this.series)[i]?.[j] == null
    const a1 = hole ? zero : along(Math.min(ohlc.o, ohlc.c))
    const a2 = hole ? zero : along(Math.max(ohlc.o, ohlc.c))
    const pos = vertical ? { x: next, y: a2 } : { x: a2, y: next }

    // Viewport cull (columns only; a row chart does not zoom): an off-screen
    // bar skips the path-string build below (and pathFrom). Positions are
    // already computed, so the caller still fills seriesXvalues/seriesYvalues
    // densely; only the string concatenation + DOM work is avoided.
    //
    // Except a candle that was on screen before an animated update: it is
    // drawn so it can morph to its new, off-screen place and slide out under
    // the clip (a zoom-in pushing the outer candles away). Culled outright it
    // vanished on frame 0 while the rest were still moving. The extra marks
    // are bounded by what was visible before, and large datasets skip the
    // morph for the bulk fade anyway.
    if (
      hole ||
      (cullBounds &&
        (slot + band < cullBounds.lo || slot > cullBounds.hi) &&
        !this._wasOnScreen(realIndex, j))
    ) {
      return { ...pos, culled: true }
    }

    const l1 = along(ohlc.h)
    const l2 = along(ohlc.l)
    const m = along(ohlc.m)
    const mid = slot + band / 2
    const far = slot + band
    const q1 = slot + band / 4
    const q3 = slot + band - band / 4
    // An open outline ends half a stroke past the corner it started at, so
    // the corner is filled under a butt cap: toward the lower values from
    // a1, toward the higher ones from a2.
    const half = (vertical ? strokeWidth : -strokeWidth) / 2

    /**
     * @param {number} a along
     * @param {number} c across
     */
    const M = (a, c) => (vertical ? graphics.move(c, a) : graphics.move(a, c))
    /**
     * @param {number} a along
     * @param {number} c across
     */
    const L = (a, c) => (vertical ? graphics.line(c, a) : graphics.line(a, c))

    let pathTo
    if (this.isOHLC) {
      const openA = along(ohlc.o)
      const closeA = along(ohlc.c)
      pathTo = [
        M(l1, mid) +
          L(l2, mid) +
          M(openA, mid) +
          L(openA, slot) +
          M(closeA, mid) +
          L(closeA, far),
      ]
    } else if (this.isBoxPlot) {
      pathTo = [
        M(a1, slot) +
          L(a1, mid) +
          L(l1, mid) +
          L(l1, q1) +
          L(l1, q3) +
          L(l1, mid) +
          L(a1, mid) +
          L(a1, far) +
          L(m, far) +
          L(m, slot) +
          L(a1 + half, slot),
        M(m, slot) +
          L(m, far) +
          L(a2, far) +
          L(a2, mid) +
          L(l2, mid) +
          L(l2, q3) +
          L(l2, q1) +
          L(l2, mid) +
          L(a2, mid) +
          L(a2, slot) +
          L(m, slot) +
          'z',
      ]
    } else {
      // Regular candlestick
      pathTo = [
        M(a2, slot) +
          L(a2, mid) +
          L(l1, mid) +
          L(a2, mid) +
          L(a2, far) +
          L(a1, far) +
          L(a1, mid) +
          L(l2, mid) +
          L(a1, mid) +
          L(a1, slot) +
          L(a2 - half, slot),
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
      pathFrom = M(a1, mid) + M(a1, slot)
    }

    return {
      ...pos,
      pathTo,
      pathFrom,
      // the goal drawer reads goalY on a column, goalX on a row
      goals: this.barHelpers.getGoalValues(
        vertical ? 'y' : 'x',
        zero,
        zero,
        realIndex,
        j,
        translationsIndex,
      ),
      slot,
      along,
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

    // BoxPlot data arrives as [min, q1, median, q3, max] and Data stores it
    // in order as O=min, H=q1, M=median, L=q3, C=max. Remap so the drawing
    // reads a box like a candle: the body runs o..c, the whiskers end at h
    // and l. So o=q1(H), c=q3(L), h=min(O), l=max(C), m=median(M).
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
