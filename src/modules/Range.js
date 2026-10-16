// @ts-check
import Utils from '../utils/Utils'
import DateTime from '../utils/DateTime'
import Scales from './Scales'
import { getChartClass } from './ChartFactory'

/**
 * Range is used to generates values between min and max.
 *
 * @module Range
 **/

class Range {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
    this.scales = new Scales(this.w)
  }

  init() {
    this.setYRange()
    this.setXRange()
    this.setZRange()
  }

  /**
   * One rendered x-pixel expressed in data units, used to widen the
   * autoScaleYaxis window so a boundary point that is still drawn inside the
   * plot survives a sub-pixel rounding error in `xaxis.min`/`xaxis.max`.
   *
   * The window is taken from the configured bounds (that is what maps onto the
   * grid) and falls back to the series' own x-extent for whichever bound is
   * unset. Returns 0 when there is nothing to scale against: `gridWidth` is
   * still 0 before the first `plotCoords()` run, and a first render has no
   * pixel round-trip to compensate for anyway.
   *
   * @param {number[] | undefined} seriesX
   * @returns {number}
   */
  _xPixelTolerance(seriesX) {
    const gridWidth = this.w.layout.gridWidth
    if (!gridWidth || !seriesX || !seriesX.length) return 0

    const cnfX = this.w.config.xaxis
    const lo = typeof cnfX.min === 'number' ? cnfX.min : seriesX[0]
    const hi =
      typeof cnfX.max === 'number' ? cnfX.max : seriesX[seriesX.length - 1]
    // an unsorted or single-valued x set gives no usable scale
    if (!(hi > lo)) return 0

    return (hi - lo) / gridWidth
  }

  /**
   * Whether the y scale should follow the zoomed x window: chart.zoom.
   * autoScaleYaxis, or a brush source that asks for it.
   *
   * @returns {boolean}
   */
  _autoScaleYEnabled() {
    const cnf = this.w.config
    const brush = /** @type {any} */ (this.w.globals).brushSource?.w.config.chart
      .brush
    return !!(
      (cnf.chart.zoom.enabled && cnf.chart.zoom.autoScaleYaxis) ||
      (brush?.enabled && brush?.autoScaleYaxis)
    )
  }

  /**
   * The x window one series should be measured inside, widened by a rendered
   * pixel, or null when the axis carries no zoom bounds at all.
   *
   * Bounds are read with the same truthiness test the trim loops have always
   * used, so a legitimate `xaxis.min` of 0 keeps counting as "unset" here
   * rather than quietly changing which points are in scope.
   *
   * @param {number} i
   * @returns {{lo: number, hi: number} | null}
   */
  _autoScaleXBounds(i) {
    const cnfX = this.w.config.xaxis
    if (!cnfX.min && !cnfX.max) return null
    const tolerance = this._xPixelTolerance(this.w.seriesData.seriesX[i])
    return {
      lo: cnfX.min ? cnfX.min - tolerance : -Infinity,
      hi: cnfX.max ? cnfX.max + tolerance : Infinity,
    }
  }

  /**
   * @param {number} startingSeriesIndex
   * @param {number} [lowestY]
   * @param {number} [highestY]
   * @param {number | null} [endingSeriesIndex]
   * @returns {{minY: number, maxY: number, lowestY: number, highestY: number}}
   */
  getMinYMaxY(
    startingSeriesIndex,
    lowestY = Number.MAX_VALUE,
    highestY = -Number.MAX_VALUE,
    endingSeriesIndex = null,
  ) {
    const cnf = this.w.config
    const gl = this.w.globals
    let maxY = -Number.MAX_VALUE
    let minY = Number.MIN_VALUE

    if (endingSeriesIndex === null) {
      endingSeriesIndex = startingSeriesIndex + 1
    }
    const series = this.w.seriesData.series
    let seriesMin = series
    let seriesMax = series

    if (cnf.chart.type === 'candlestick') {
      seriesMin = this.w.candleData.seriesCandleL
      seriesMax = this.w.candleData.seriesCandleH
    } else if (cnf.chart.type === 'boxPlot') {
      seriesMin = this.w.candleData.seriesCandleO
      seriesMax = this.w.candleData.seriesCandleC
    } else if (cnf.chart.type === 'violin') {
      seriesMin = this.w.violinData.seriesViolinMin
      seriesMax = this.w.violinData.seriesViolinMax
    } else if (this.w.axisFlags.isRangeData) {
      seriesMin = this.w.rangeData.seriesRangeStart
      seriesMax = this.w.rangeData.seriesRangeEnd
    }
    let autoScaleYaxis = false
    // set when a series was dropped for having nothing inside the window, so
    // the retry below can tell "no visible data" from "no data at all"
    let droppedForWindow = false
    if (this.w.seriesData.seriesX.length >= endingSeriesIndex) {
      // Eventually brushSource will be set if the current chart is a target.
      // That is, after the appropriate event causes us to update.
      if (this._autoScaleYEnabled() && !this._ignoreAutoScaleWindow) {
        autoScaleYaxis = true
      }
    }

    for (let i = startingSeriesIndex; i < endingSeriesIndex; i++) {
      gl.dataPoints = Math.max(gl.dataPoints, series[i].length)

      const seriesType = /** @type {Record<string,any>} */ (cnf.series[i]).type
      let firstXIndex = 0
      let lastXIndex = series[i].length - 1
      if (autoScaleYaxis) {
        // Scale the Y axis to the min..max within the possibly zoomed X axis
        // domain, widened by one rendered pixel. A brush/zoom boundary is
        // reconstructed from the selection rect's DOM bounds, so xaxis.min/max
        // can land a sub-pixel fraction inside a boundary data point. Trimming
        // on a strict compare then drops a point whose marker and line segment
        // are still painted inside the plot, and the Y scale clips it (#5251).
        const xs = this.w.seriesData.seriesX[i]
        const bounds = this._autoScaleXBounds(i)
        if (bounds && cnf.xaxis.min) {
          for (
            ;
            firstXIndex < lastXIndex && xs[firstXIndex] < bounds.lo;
            firstXIndex++
          ) {
            // Intentionally empty - just incrementing firstXIndex
          }
        }
        if (bounds && cnf.xaxis.max) {
          for (
            ;
            lastXIndex > firstXIndex && xs[lastXIndex] > bounds.hi;
            lastXIndex--
          ) {
            // Intentionally empty - just decrementing lastXIndex
          }
        }

        // Both loops stop as soon as the indices meet, so a series with NOTHING
        // inside the window is left pointing at one surviving point, whose y
        // then stretched the axis even though the series draws no ink in view
        // (#1260: zoom into a range a second series does not cover and the
        // scale stayed on the full-data domain).
        //
        // The exception is a series that STRADDLES the window with points on
        // both sides: the segment joining them is drawn straight through, so
        // those two ends do bound what is visible and have to be kept.
        if (bounds && xs && xs.length) {
          const inWindow =
            xs[firstXIndex] >= bounds.lo && xs[firstXIndex] <= bounds.hi
          if (!inWindow) {
            const straddles =
              xs[0] < bounds.lo && xs[xs.length - 1] > bounds.hi
            if (straddles && firstXIndex > 0) {
              lastXIndex = firstXIndex
              firstXIndex = lastXIndex - 1
            } else {
              // an empty range: both scan lanes below then contribute nothing
              firstXIndex = 0
              lastXIndex = -1
              droppedForWindow = true
            }
          }
        }
      }
      // Highlight filter: a part can reach past its whole (an average does) or
      // sit on the other side of zero, so it stretches the axis too, over the
      // same window the values are scanned in and on a null whole as well.
      const hp = this.w.highlightData?.ext?.[i]
      if (hp) {
        for (let j = firstXIndex; j <= lastXIndex && j < hp.length; j++) {
          const v = hp[j]
          if (v != null) {
            if (v > maxY) maxY = v
            if (v < lowestY) lowestY = v
            if (v < 0 && v < minY) minY = v
          }
        }
      }
      // Fast lane for plain numeric series (line/area/scatter/column with
      // scalar y values): the general loop below pays several function calls
      // and a string conversion PER VALUE (isNumber/noExponents/isFloat/
      // toString), measured as the largest post-parse CPU bucket at 50k+
      // points. This lane replicates its exact observable effects (min/max,
      // hasNullValues, yValueDecimal, negative minY) with inline checks.
      const plainNumeric =
        seriesMin === series &&
        seriesMax === series &&
        cnf.chart.type !== 'boxPlot' &&
        seriesType !== 'candlestick' &&
        seriesType !== 'boxPlot' &&
        seriesType !== 'violin' &&
        seriesType !== 'rangeArea' &&
        seriesType !== 'rangeBar' &&
        // Data allocates a series' goals only once one of its points has some
        !this.w.seriesData.seriesGoals[i]
      if (plainNumeric) {
        const arr = series[i]
        const jEnd = Math.min(lastXIndex, arr.length - 1)
        const pe = this.w.seriesData._parsedExtrema?.[i]
        if (
          pe &&
          pe.ref === arr &&
          pe.len === arr.length &&
          firstXIndex === 0 &&
          jEnd === arr.length - 1
        ) {
          // extrema already fused into the parse pass for this exact array
          // and the scan window is the full series: merge, skip the loop
          if (pe.maxY > maxY) maxY = pe.maxY
          if (pe.lowestY < lowestY) lowestY = pe.lowestY
          if (pe.negMinY < 0 && pe.negMinY < minY) minY = pe.negMinY
          if (pe.yDec > gl.yValueDecimal) gl.yValueDecimal = pe.yDec
          if (pe.hasNulls) gl.hasNullValues = true
        } else {
          let yDec = gl.yValueDecimal
          let hasNulls = false
          for (let j = firstXIndex; j <= jEnd; j++) {
            const val = arr[j]
            // inline isNumber: number, not NaN/Infinity, not null
            if (
              val !== null &&
              typeof val === 'number' &&
              val === val &&
              val !== Infinity &&
              val !== -Infinity
            ) {
              if (val > maxY) maxY = val
              if (val < lowestY) lowestY = val
              if (minY > val && val < 0) minY = val
              if (!Number.isInteger(val)) {
                const av = val < 0 ? -val : val
                if (av >= 1e-6 && av < 1e21) {
                  // plain decimal notation: count fraction digits directly
                  const str = '' + val
                  const dot = str.indexOf('.')
                  const dec = dot === -1 ? 0 : str.length - dot - 1
                  if (dec > yDec) yDec = dec
                } else {
                  // exponent notation: 1.5e-7 still has 8 decimals
                  yDec = Math.max(yDec, Utils.decimalPlaces(val))
                }
              }
            } else {
              hasNulls = true
            }
          }
          gl.yValueDecimal = yDec
          if (hasNulls) gl.hasNullValues = true
        }
        highestY = maxY
        // bar/column post-loop adjustments (same as the general loop's tail)
        if (seriesType === 'bar' || seriesType === 'column') {
          if (minY < 0 && maxY < 0) {
            maxY = 0
            highestY = Math.max(highestY, 0)
          }
          if (minY === Number.MIN_VALUE) {
            minY = 0
            lowestY = Math.min(lowestY, 0)
          }
        }
        continue
      }
      for (
        let j = firstXIndex;
        j <= lastXIndex && j < this.w.seriesData.series[i].length;
        j++
      ) {
        const val = series[i][j]
        if (val !== null && Utils.isNumber(val)) {
          if (typeof seriesMax[i]?.[j] !== 'undefined') {
            maxY = Math.max(maxY, seriesMax[i][j])
            lowestY = Math.min(lowestY, seriesMax[i][j])
          }
          if (typeof seriesMin[i]?.[j] !== 'undefined') {
            lowestY = Math.min(lowestY, seriesMin[i][j])
            highestY = Math.max(highestY, seriesMin[i][j])
          }

          // These series arrays are dual purpose:
          // Array      : CandleO, CandleH, CandleM, CandleL, CandleC
          // Candlestick: O        H                 L        C
          // Boxplot    : Min      Q1       Median   Q3       Max
          switch (seriesType) {
            case 'candlestick':
              {
                if (
                  typeof this.w.candleData.seriesCandleC[i][j] !== 'undefined'
                ) {
                  maxY = Math.max(maxY, this.w.candleData.seriesCandleH[i][j])
                  lowestY = Math.min(
                    lowestY,
                    this.w.candleData.seriesCandleL[i][j],
                  )
                }
              }
              break
            case 'boxPlot':
              {
                if (
                  typeof this.w.candleData.seriesCandleC[i][j] !== 'undefined'
                ) {
                  maxY = Math.max(maxY, this.w.candleData.seriesCandleC[i][j])
                  lowestY = Math.min(
                    lowestY,
                    this.w.candleData.seriesCandleO[i][j],
                  )
                }
              }
              break
            case 'violin':
              {
                if (
                  typeof this.w.violinData.seriesViolinMax[i]?.[j] !==
                  'undefined'
                ) {
                  maxY = Math.max(maxY, this.w.violinData.seriesViolinMax[i][j])
                  lowestY = Math.min(
                    lowestY,
                    this.w.violinData.seriesViolinMin[i][j],
                  )
                }
              }
              break
          }

          // there is a combo chart and the specified series in not either
          // candlestick, boxplot, or rangeArea/rangeBar; find the max there.
          if (
            seriesType &&
            seriesType !== 'candlestick' &&
            seriesType !== 'boxPlot' &&
            seriesType !== 'violin' &&
            seriesType !== 'rangeArea' &&
            seriesType !== 'rangeBar'
          ) {
            maxY = Math.max(maxY, this.w.seriesData.series[i][j])
            lowestY = Math.min(lowestY, this.w.seriesData.series[i][j])
          }

          if (
            this.w.seriesData.seriesGoals[i] &&
            this.w.seriesData.seriesGoals[i][j] &&
            Array.isArray(this.w.seriesData.seriesGoals[i][j])
          ) {
            this.w.seriesData.seriesGoals[i][j].forEach(
              (/** @type {any} */ g) => {
                maxY = Math.max(maxY, g.value)
                lowestY = Math.min(lowestY, g.value)
              },
            )
          }

          // boxPlot raw observations (optional jitter) — included regardless of
          // how seriesType resolves, so outliers beyond the box min/max stay in
          // the axis extent.
          if (this.w.config.chart.type === 'boxPlot' || seriesType === 'boxPlot') {
            const boxPts = this.w.candleData.seriesBoxPoints?.[i]?.[j]
            if (boxPts) {
              for (let p = 0; p < boxPts.length; p++) {
                const pv = boxPts[p]
                if (typeof pv === 'number') {
                  maxY = Math.max(maxY, pv)
                  lowestY = Math.min(lowestY, pv)
                }
              }
            }
          }
          highestY = maxY

          if (Utils.isFloat(val)) {
            gl.yValueDecimal = Math.max(
              gl.yValueDecimal,
              Utils.decimalPlaces(val),
            )
          }
          if (minY > seriesMin[i]?.[j] && seriesMin[i]?.[j] < 0) {
            minY = seriesMin[i][j]
          }
        } else {
          gl.hasNullValues = true
        }
      }
      if (seriesType === 'bar' || seriesType === 'column') {
        if (minY < 0 && maxY < 0) {
          // all negative values in a bar series, hence make the max to 0
          maxY = 0
          highestY = Math.max(highestY, 0)
        }
        if (minY === Number.MIN_VALUE) {
          minY = 0
          lowestY = Math.min(lowestY, 0)
        }
      }
    }

    // Both overrides read nothing the loop changes and nothing in the loop
    // reads gl.dataPoints, so they run once per call, as the last iteration
    // left them, instead of once per series.
    if (endingSeriesIndex > startingSeriesIndex) {
      if (this.w.labelData.categoryLabels.length) {
        gl.dataPoints = this.w.labelData.categoryLabels.filter(
          (label) => typeof label !== 'undefined',
        ).length
      }

      if (
        this.w.labelData.labels.length &&
        cnf.xaxis.type !== 'datetime' &&
        series.some((s) => s.length)
      ) {
        // the condition cnf.xaxis.type !== 'datetime' fixes #3897 and #3905
        gl.dataPoints = Math.max(gl.dataPoints, this.w.labelData.labels.length)
      }
    }

    if (
      cnf.chart.type === 'rangeBar' &&
      this.w.rangeData.seriesRangeStart.length &&
      gl.isBarHorizontal
    ) {
      minY = lowestY
    }

    if (cnf.chart.type === 'bar') {
      if (minY < 0 && maxY < 0) {
        // all negative values in a bar chart, hence make the max to 0
        maxY = 0
      }
      if (minY === Number.MIN_VALUE) {
        minY = 0
      }
    }

    if (droppedForWindow && maxY === -Number.MAX_VALUE) {
      // Every series was dropped, i.e. the window holds no data at all: someone
      // panned or zoomed past the end of the series. Scaling to nothing would
      // leave the axis on its sentinels and print a domain unrelated to the
      // data, so fall back to measuring the full extent, which is what the
      // axis showed before any zoom.
      this._ignoreAutoScaleWindow = true
      try {
        return this.getMinYMaxY(
          startingSeriesIndex,
          Number.MAX_VALUE,
          -Number.MAX_VALUE,
          endingSeriesIndex,
        )
      } finally {
        this._ignoreAutoScaleWindow = false
      }
    }

    return {
      minY,
      maxY,
      lowestY,
      highestY,
    }
  }

  setYRange() {
    const gl = this.w.globals
    const cnf = this.w.config
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE

    let lowestYInAllSeries = Number.MAX_VALUE
    let minYMaxY

    if (gl.isMultipleYAxis) {
      // we need to get minY and maxY for multiple y axis
      lowestYInAllSeries = Number.MAX_VALUE
      for (let i = 0; i < this.w.seriesData.series.length; i++) {
        minYMaxY = this.getMinYMaxY(i)
        gl.minYArr[i] = minYMaxY.lowestY
        gl.maxYArr[i] = minYMaxY.highestY
        lowestYInAllSeries = Math.min(lowestYInAllSeries, minYMaxY.lowestY)
      }
    }

    // and then, get the minY and maxY from all series
    minYMaxY = this.getMinYMaxY(
      0,
      lowestYInAllSeries,
      undefined,
      this.w.seriesData.series.length,
    )
    if (cnf.chart.type === 'bar') {
      gl.minY = minYMaxY.minY
      gl.maxY = minYMaxY.maxY
    } else {
      gl.minY = minYMaxY.lowestY
      gl.maxY = minYMaxY.highestY
    }
    lowestYInAllSeries = minYMaxY.lowestY

    if (cnf.chart.stacked) {
      this._setStackedMinMax()
    }

    // if the numbers are too big, reduce the range
    // for eg, if number is between 100000-110000, putting 0 as the lowest
    // value is not so good idea. So change the gl.minY for
    // line/area/rangeArea/scatter/candlesticks/boxPlot/vertical rangebar
    if (
      cnf.chart.type === 'line' ||
      cnf.chart.type === 'area' ||
      cnf.chart.type === 'rangeArea' ||
      cnf.chart.type === 'scatter' ||
      cnf.chart.type === 'candlestick' ||
      cnf.chart.type === 'boxPlot' ||
      cnf.chart.type === 'violin' ||
      (cnf.chart.type === 'rangeBar' && !gl.isBarHorizontal)
    ) {
      if (
        gl.minY === Number.MIN_VALUE &&
        lowestYInAllSeries !== -Number.MAX_VALUE &&
        lowestYInAllSeries !== gl.maxY // single value possibility
      ) {
        gl.minY = lowestYInAllSeries
      }
    } else {
      gl.minY =
        gl.minY !== Number.MIN_VALUE
          ? Math.min(minYMaxY.minY, gl.minY)
          : minYMaxY.minY
    }

    /**
     * One configured bound as a number, or undefined when there is nothing
     * usable to override the computed extent with.
     *
     * A bound may be a number or a function of the computed extent (#2098).
     * Anything else was already dropped by Config.normalizeAxisBounds, and a
     * function is free to return nothing at all.
     *
     * @param {any} bound the configured `min` or `max`
     * @param {number} computed what the data alone says this extent is
     * @returns {number|undefined}
     */
    const resolveBound = (bound, computed) => {
      if (typeof bound === 'number') return bound
      if (typeof bound !== 'function') return undefined
      const resolved = bound(computed)
      return Utils.isNumber(resolved) ? resolved : undefined
    }

    // Multiple axes take their bounds per axis in scaleMultipleYAxes: minYArr
    // is indexed by series, so writing yaxis[k]'s bound there clobbered
    // whichever series sits at k, possibly on another axis.
    const yaxe = cnf.yaxis[0]
    if (!gl.isMultipleYAxis && yaxe) {
      // Override the computed extent with the user's bound, but ONLY when
      // resolveBound found one.
      //
      // Publishing to `gl.maxY`/`gl.minY` used to sit outside the type test,
      // so a bound that was neither a number nor a function (a numeric string,
      // say) reached it having set nothing: `gl.minYArr[0]` is still
      // undefined at this point, and copying that into `gl.minY` collapsed
      // the axis to the `0 … tickAmount` scale a chart with no data gets,
      // drawing the series off the plot (#5328).
      const max = resolveBound(yaxe.max, gl.maxY)
      if (max !== undefined) gl.maxYArr[0] = gl.maxY = max

      const min = resolveBound(yaxe.min, gl.minY)
      if (min !== undefined) gl.minYArr[0] = gl.minY = min
    }

    // for horizontal bar charts, we need to check xaxis min/max as user may have specified there
    if (gl.isBarHorizontal) {
      const minmax = ['min', 'max']
      minmax.forEach((m) => {
        if (cnf.xaxis[m] !== undefined && typeof cnf.xaxis[m] === 'number') {
          m === 'min' ? (gl.minY = cnf.xaxis[m]) : (gl.maxY = cnf.xaxis[m])
        }
      })
    }

    if (gl.isMultipleYAxis) {
      this.scales.scaleMultipleYAxes()
      gl.minY = lowestYInAllSeries
    } else {
      this.scales.setYScaleForIndex(0, gl.minY, gl.maxY)
      gl.minY = gl.yAxisScale[0].niceMin
      gl.maxY = gl.yAxisScale[0].niceMax
      gl.minYArr[0] = gl.minY
      gl.maxYArr[0] = gl.maxY
    }

    gl.barGroups = []
    gl.lineGroups = []
    gl.areaGroups = []
    cnf.series.forEach((s, i) => {
      const g = this.w.labelData.seriesGroupIndex[i]
      switch (/** @type {any} */ (s).type || cnf.chart.type) {
        case 'bar':
        case 'column':
          gl.barGroups.push(g)
          break
        case 'line':
          gl.lineGroups.push(g)
          break
        case 'area':
          gl.areaGroups.push(g)
          break
      }
    })
    // Uniquify the group names in each stackable chart type.
    /**
     * @param {number} v
     * @param {number} i
     * @param {number[]} a
     */
    gl.barGroups = gl.barGroups.filter((v, i, a) => a.indexOf(v) === i)
    /**
     * @param {number} v
     * @param {number} i
     * @param {number[]} a
     */
    gl.lineGroups = gl.lineGroups.filter((v, i, a) => a.indexOf(v) === i)
    /**
     * @param {number} v
     * @param {number} i
     * @param {number[]} a
     */
    gl.areaGroups = gl.areaGroups.filter((v, i, a) => a.indexOf(v) === i)

    return {
      minY: gl.minY,
      maxY: gl.maxY,
      minYArr: gl.minYArr,
      maxYArr: gl.maxYArr,
      yAxisScale: gl.yAxisScale,
    }
  }

  setXRange() {
    const gl = this.w.globals
    const cnf = this.w.config

    const isXNumeric =
      cnf.xaxis.type === 'numeric' ||
      cnf.xaxis.type === 'datetime' ||
      (cnf.xaxis.type === 'category' && !this.w.axisFlags.noLabelsProvided) ||
      this.w.axisFlags.noLabelsProvided ||
      this.w.axisFlags.isXNumeric

    const getInitialMinXMaxX = () => {
      // hot loop at 50k+ points: track locals with inline number checks and
      // write the globals once (initialMin/MaxX always mirror min/maxX here)
      let minX = gl.minX
      let maxX = gl.maxX
      for (let i = 0; i < this.w.seriesData.series.length; i++) {
        const lbls = /** @type {any} */ (this.w.labelData.labels[i])
        if (!lbls) continue
        const pe = this.w.seriesData._parsedExtrema?.[i]
        if (
          pe &&
          pe.xNumeric &&
          pe.xref === lbls &&
          pe.len === lbls.length
        ) {
          // x extrema already fused into the parse pass for this exact array
          if (pe.maxX > maxX) maxX = pe.maxX
          if (pe.minX < minX) minX = pe.minX
          continue
        }
        for (let j = 0; j < lbls.length; j++) {
          const v = lbls[j]
          if (v !== null && typeof v === 'number' && v === v) {
            if (v > maxX) maxX = v
            if (v < minX) minX = v
          }
        }
      }
      gl.maxX = maxX
      gl.initialMaxX = maxX
      gl.minX = minX
      gl.initialMinX = minX
    }
    // minX maxX starts here
    if (this.w.axisFlags.isXNumeric) {
      getInitialMinXMaxX()
    }

    if (this.w.axisFlags.noLabelsProvided) {
      if (cnf.xaxis.categories.length === 0) {
        gl.maxX = /** @type {any} */ (
          this.w.labelData.labels[this.w.labelData.labels.length - 1]
        )
        gl.initialMaxX = /** @type {any} */ (
          this.w.labelData.labels[this.w.labelData.labels.length - 1]
        )
        gl.minX = 1
        gl.initialMinX = 1
      }
    }

    if (
      this.w.axisFlags.isXNumeric ||
      this.w.axisFlags.noLabelsProvided ||
      this.w.axisFlags.dataFormatXNumeric
    ) {
      let ticks = 10

      if (cnf.xaxis.tickAmount === undefined) {
        ticks = Math.round(gl.svgWidth / 150)

        // no labels provided and total number of dataPoints is less than 30
        const inferredNumericX =
          this.w.axisFlags.isXNumeric &&
          this.w.axisFlags.dataFormatXNumeric &&
          cnf.xaxis.type !== 'datetime' &&
          !cnf.xaxis.convertedCatToNumeric &&
          !gl.isBarHorizontal
        // Range runs before axis text is laid out, so use the conventional
        // 0.6em average glyph width to reject one-tick-per-point when the
        // labels cannot plausibly fit in the chart's available width.
        // Called only under 30 points: it stringifies every x value, which
        // is 2ms of a 100k-point render whose answer is never used.
        const allPointLabelsFit = () => {
          const fontSize = parseFloat(cnf.xaxis.labels.style.fontSize) || 12
          const widestLabelLength = this.w.labelData.labels.reduce(
            (widest, seriesLabels) =>
              Array.isArray(seriesLabels)
                ? seriesLabels.reduce(
                    (seriesWidest, label) =>
                      Math.max(seriesWidest, String(label).length),
                    widest,
                  )
                : widest,
            0,
          )
          return (
            gl.dataPoints * widestLabelLength * fontSize * 0.6 <= gl.svgWidth
          )
        }
        if (
          gl.dataPoints < 30 &&
          (cnf.xaxis.type === 'numeric' ||
            (inferredNumericX && allPointLabelsFit()))
        ) {
          ticks = gl.dataPoints - 1
        }

        // this check is for when ticks exceeds total datapoints and that would result in duplicate labels
        if (ticks > gl.dataPoints && gl.dataPoints !== 0) {
          ticks = gl.dataPoints - 1
        }
      } else if (cnf.xaxis.tickAmount === 'dataPoints') {
        ticks = Math.max(
          1,
          (this.w.seriesData.series[gl.maxValsInArrayIndex] || []).length - 1,
        )
        if (this.w.axisFlags.isXNumeric) {
          const diff = Math.round(gl.maxX - gl.minX)
          if (diff < 30) {
            // When numeric range is small, show a tick for every integer
            ticks = diff
          }
        }
      } else {
        ticks = cnf.xaxis.tickAmount
      }
      gl.xTickAmount = ticks

      // override all min/max values by user defined values (x axis)
      if (cnf.xaxis.max !== undefined && typeof cnf.xaxis.max === 'number') {
        gl.maxX = cnf.xaxis.max
      }
      if (cnf.xaxis.min !== undefined && typeof cnf.xaxis.min === 'number') {
        gl.minX = cnf.xaxis.min
      }

      // if range is provided, adjust the new minX
      if (cnf.xaxis.range !== undefined) {
        gl.minX = gl.maxX - cnf.xaxis.range
      }

      // a numeric or datetime heatmap reaches half a cell past its data
      if (cnf.chart.type === 'heatmap') {
        getChartClass('heatmap').prototype.padXRange?.(this)
      }

      if (gl.minX !== Number.MAX_VALUE && gl.maxX !== -Number.MAX_VALUE) {
        if (
          cnf.xaxis.convertedCatToNumeric &&
          !this.w.axisFlags.dataFormatXNumeric
        ) {
          const catScale = []
          for (let i = gl.minX - 1; i < gl.maxX; i++) {
            catScale.push(i + 1)
          }
          gl.xAxisScale = {
            result: catScale,
            niceMin: catScale[0],
            niceMax: catScale[catScale.length - 1],
          }
        } else {
          gl.xAxisScale = this.scales.setXScale(gl.minX, gl.maxX)
        }
      } else {
        gl.xAxisScale = this.scales.linearScale(
          0,
          ticks,
          ticks,
          0,
          cnf.xaxis.stepSize,
        )
        if (
          this.w.axisFlags.noLabelsProvided &&
          this.w.labelData.labels.length > 0
        ) {
          gl.xAxisScale = this.scales.linearScale(
            1,
            this.w.labelData.labels.length,
            ticks - 1,
            0,
            cnf.xaxis.stepSize,
          )

          // this is the only place seriesX is again mutated
          this.w.seriesData.seriesX = /** @type {any} */ (
            this.w.labelData.labels.slice()
          )
        }
      }
      // we will still store these labels as the count for this will be different (to draw grid and labels placement)
      if (isXNumeric && gl.isBarHorizontal) {
        // On its side the chart draws one band per row and one label per
        // band, so each band is labelled with its own row's x. The evenly
        // spaced ticks put "Jan 03" against the row that holds Jan 04.
        // Series that do not share their x values get a band for every x any
        // of them has, in the longest series' direction, and each bar sits in
        // its own x's band (bar/Helpers barRow).
        const rows = (
          this.w.seriesData.seriesX[gl.maxValsInArrayIndex] || []
        ).slice()
        const seen = new Set(rows)
        const n = rows.length
        if (cnf.chart.type === 'bar') {
          this.w.seriesData.seriesX.forEach((s) =>
            s?.forEach((x) => {
              if (x != null && !seen.has(x)) {
                seen.add(x)
                rows.push(x)
              }
            }),
          )
        }
        if (rows.length > n) {
          const dir = rows[0] > rows[n - 1] ? -1 : 1
          rows.sort((a, b) => (a - b) * dir)
          gl.dataPoints = rows.length
        }
        this.w.labelData.labels = /** @type {any} */ (rows)
      } else if (isXNumeric) {
        this.w.labelData.labels = /** @type {any} */ (
          gl.xAxisScale.result.slice()
        )
      }
    }

    if (gl.isBarHorizontal && this.w.labelData.labels.length) {
      gl.xTickAmount = this.w.labelData.labels.length
    }

    // single dataPoint
    this._handleSingleDataPoint()

    // minimum x difference to calculate bar width in numeric bars
    this._getMinXDiff()

    return {
      minX: gl.minX,
      maxX: gl.maxX,
    }
  }

  setZRange() {
    // minZ, maxZ starts here
    const gl = this.w.globals

    if (!this.w.axisFlags.isDataXYZ) return
    for (let i = 0; i < this.w.seriesData.series.length; i++) {
      if (typeof this.w.seriesData.seriesZ[i] !== 'undefined') {
        for (let j = 0; j < this.w.seriesData.seriesZ[i].length; j++) {
          if (
            this.w.seriesData.seriesZ[i][j] !== null &&
            Utils.isNumber(this.w.seriesData.seriesZ[i][j])
          ) {
            gl.maxZ = Math.max(gl.maxZ, this.w.seriesData.seriesZ[i][j])
            gl.minZ = Math.min(gl.minZ, this.w.seriesData.seriesZ[i][j])
          }
        }
      }
    }

    // An explicit z window (plotOptions.bubble.minZ/maxZ) EXPANDS the data's
    // own extent, never clamps it (the heatmap colorScale.min/max semantics):
    // several bubble charts can share one size scale, so the same z draws the
    // same radius in every one of them.
    const bubbleCfg = this.w.config.plotOptions?.bubble || {}
    if (Utils.isNumber(bubbleCfg.minZ) && bubbleCfg.minZ < gl.minZ) {
      gl.minZ = bubbleCfg.minZ
    }
    if (Utils.isNumber(bubbleCfg.maxZ) && bubbleCfg.maxZ > gl.maxZ) {
      gl.maxZ = bubbleCfg.maxZ
    }
  }

  _handleSingleDataPoint() {
    const gl = this.w.globals
    const cnf = this.w.config

    if (gl.minX === gl.maxX) {
      const datetimeObj = new DateTime(this.w)

      if (cnf.xaxis.type === 'datetime') {
        const newMinX = datetimeObj.getDate(gl.minX)
        if (cnf.xaxis.labels.datetimeUTC) {
          newMinX.setUTCDate(newMinX.getUTCDate() - 2)
        } else {
          newMinX.setDate(newMinX.getDate() - 2)
        }

        gl.minX = new Date(newMinX).getTime()

        const newMaxX = datetimeObj.getDate(gl.maxX)
        if (cnf.xaxis.labels.datetimeUTC) {
          newMaxX.setUTCDate(newMaxX.getUTCDate() + 2)
        } else {
          newMaxX.setDate(newMaxX.getDate() + 2)
        }
        gl.maxX = new Date(newMaxX).getTime()
      } else if (
        cnf.xaxis.type === 'numeric' ||
        (cnf.xaxis.type === 'category' && !this.w.axisFlags.noLabelsProvided)
      ) {
        gl.minX = gl.minX - 2
        gl.initialMinX = gl.minX
        gl.maxX = gl.maxX + 2
        gl.initialMaxX = gl.maxX
      }
    }
  }

  _getMinXDiff() {
    const gl = this.w.globals

    if (this.w.axisFlags.isXNumeric) {
      // get the least x diff if numeric x axis is present
      /**
       * @param {number} sX
       * @param {number} si
       */
      this.w.seriesData.seriesX.forEach((sX, si) => {
        if (sX.length) {
          if (sX.length === 1) {
            // a small hack to prevent overlapping multiple bars when there is just 1 datapoint in bar series.
            // fix #811
            sX.push(
              this.w.seriesData.seriesX[gl.maxValsInArrayIndex][
                this.w.seriesData.seriesX[gl.maxValsInArrayIndex].length - 1
              ],
            )
          }

          // sortedness + min positive diff already fused into the parse pass
          // for this exact array: merge and skip the scan
          const pe = this.w.seriesData._parsedExtrema?.[si]
          if (
            pe &&
            pe.xNumeric &&
            pe.xSorted &&
            pe.xref === sX &&
            pe.len === sX.length
          ) {
            if (pe.minXDiff < gl.minXDiff) gl.minXDiff = pe.minXDiff
            if (gl.dataPoints === 1 || gl.minXDiff === Number.MAX_VALUE) {
              // fixes apexcharts.js #1221
              gl.minXDiff = 0.5
            }
            return
          }

          // Fast lane: x values are almost always already sorted (time
          // series, numeric streams). One pass detects sortedness and takes
          // the min positive diff without the O(n log n) clone + sort.
          let presorted = true
          let minDiff = gl.minXDiff
          for (let j = 1; j < sX.length; j++) {
            const d = sX[j] - sX[j - 1]
            if (d > 0) {
              if (d < minDiff) minDiff = d
            } else if (d < 0) {
              presorted = false
              break
            }
          }
          if (presorted) {
            gl.minXDiff = minDiff
            if (gl.dataPoints === 1 || gl.minXDiff === Number.MAX_VALUE) {
              // fixes apexcharts.js #1221
              gl.minXDiff = 0.5
            }
            return
          }

          // fix #983 (clone the array to avoid side effects)
          const seriesX = sX.slice()
          /**
           * @param {number} a
           * @param {number} b
           */
          seriesX.sort((a, b) => a - b)

          /**
           * @param {Record<string, any>} s
           * @param {number} j
           */
          seriesX.forEach((s, j) => {
            if (j > 0) {
              const xDiff = s - seriesX[j - 1]
              if (xDiff > 0) {
                gl.minXDiff = Math.min(xDiff, gl.minXDiff)
              }
            }
          })

          if (gl.dataPoints === 1 || gl.minXDiff === Number.MAX_VALUE) {
            // fixes apexcharts.js #1221
            gl.minXDiff = 0.5
          }
        }
      })
    }
  }

  _setStackedMinMax() {
    const gl = this.w.globals
    const windowed = this._autoScaleYEnabled()
    // for stacked charts, we calculate each series's parallel values.
    // i.e, series[0][j] + series[1][j] .... [series[i.length][j]]
    // and get the max out of it

    if (!this.w.seriesData.series.length) return
    const gIdx = this.w.labelData.seriesGroupIndex
    // [positive, negative] sums per stack: the series group (by index, groups
    // may reuse names), then the x value on a numeric axis as stacked bars and
    // lines draw (#4886), else the ordinal.
    const byX = this.w.axisFlags.isXNumeric
    /** @type {Map<string, number[]>} */
    const stacks = new Map()

    this.w.config.series.forEach(
      (/** @type {any} */ serie, /** @type {number} */ i) => {
        // autoScaleYaxis: only points inside the zoomed window may raise the
        // stacked total. Summing the whole series here left gl.maxY on the
        // full-data maximum, so zooming a stacked chart moved the x axis and
        // nothing else (#1260).
        const bounds = windowed ? this._autoScaleXBounds(i) : null
        const xs = this.w.seriesData.seriesX[i]
        const hasX = !!(bounds && xs && xs.length)
        const stackSeries =
          this.w.config.chart.stacked &&
          (!gl.comboCharts ||
            !this.w.config.chart.stackOnlyBar ||
            serie?.type === 'bar' ||
            serie?.type === 'column')

        const len = this.w.seriesData.series[gl.maxValsInArrayIndex].length
        const row = this.w.seriesData.series[i]
        for (let j = 0; j < len; j++) {
          if (hasX && (xs[j] < bounds.lo || xs[j] > bounds.hi)) continue
          const key = (gIdx[i] || 0) + '|' + (byX && xs ? xs[j] : j)
          let st = stacks.get(key)
          if (!st) stacks.set(key, (st = [0, 0]))

          const v = row[j]
          // what Utils.isNumber answers for a parsed value, without its
          // three string round trips per point
          if (stackSeries && Number.isFinite(v)) {
            v > 0 ? (st[0] += v * 1.000001) : (st[1] += +v)
          }
        }
      },
    )

    stacks.forEach((st) => {
      gl.maxY = Math.max(gl.maxY, st[0])
      gl.minY = Math.min(gl.minY, st[1])
    })
  }
}

export default Range
