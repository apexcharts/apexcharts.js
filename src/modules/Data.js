// @ts-check
import CoreUtils from './CoreUtils'
import DateTime from './../utils/DateTime'
import Series from './Series'
import Utils from '../utils/Utils'
import Defaults from './settings/Defaults'
import { isCustom, getChartClass } from './ChartFactory'

export default class Data {
  /**
   * @param {import('../types/internal').ChartStateW} w
   */
  constructor(w, { resetGlobals = () => {}, isMultipleY = () => {} } = {}) {
    this.w = w
    this.resetGlobals = resetGlobals
    this.isMultipleY = isMultipleY

    /** @type {any} */
    this.twoDSeries = []
    /** @type {any} */
    this.threeDSeries = []
    /** @type {any} */
    this.twoDSeriesX = []
    /** @type {any} */
    this.seriesGoals = []
    this.coreUtils = new CoreUtils(this.w)
    /** @type {number} */ this.activeSeriesIndex = 0
  }

  // Helper to get the first valid data point from the active series
  getFirstDataPoint() {
    const series = this.w.config.series
    const sr = new Series(this.w)
    this.activeSeriesIndex = sr.getActiveConfigSeriesIndex()
    const activeItem = /** @type {any} */ (series[this.activeSeriesIndex])

    if (
      activeItem &&
      activeItem.data &&
      activeItem.data.length > 0 &&
      activeItem.data[0] !== null &&
      typeof activeItem.data[0] !== 'undefined'
    ) {
      return activeItem.data[0]
    }
    return null
  }

  isMultiFormat() {
    return this.isFormatXY() || this.isFormat2DArray()
  }

  // given format is [{x, y}, {x, y}]
  isFormatXY() {
    const firstDataPoint = this.getFirstDataPoint()
    if (!firstDataPoint || typeof firstDataPoint.x === 'undefined') return false
    const data = /** @type {any} */ (
      this.w.config.series[this.activeSeriesIndex]
    )?.data
    if (data) {
      /**
       * @param {Record<string, any>} pt
       */
      const isXY = (pt) => pt && typeof pt.x !== 'undefined'
      for (let k = 1; k < Math.min(3, data.length); k++) {
        if (isXY(data[k]) !== true) {
          console.warn(
            `ApexCharts: series data has mixed formats starting at index ${k}`,
          )
          break
        }
      }
    }
    return true
  }

  // given format is [[x, y], [x, y]]
  isFormat2DArray() {
    const firstDataPoint = this.getFirstDataPoint()
    return firstDataPoint && Array.isArray(firstDataPoint)
  }

  /**
   * Typed single pass for the dominant [[x, y], ...] shape: scalar numeric or
   * null y, no z, no OHLC tuples. One monomorphic loop fills preallocated
   * x/y arrays and fuses the y-extrema scan that Range.getMinYMaxY would
   * otherwise repeat over every value (the extrema entry is ref+length
   * guarded, so any later reshaping of the series array simply falls back to
   * the scan). Returns false untouched on any non-conforming point so the
   * general loop below handles mixed/exotic data with unchanged output.
   * @param {any[]} data
   * @param {number} i
   * @returns {boolean}
   */
  _fast2DArrayParse(data, i) {
    const n = data.length
    if (n === 0) return false
    const ys = new Array(n)
    const xs = new Array(n)
    let maxY = -Number.MAX_VALUE
    let lowestY = Number.MAX_VALUE
    let negMinY = Infinity
    let hasNulls = false
    let yDec = 0
    // x stats are only usable when every x is a number: string x values
    // coerce in the legacy adjacent-diff loop, so mixed data falls back
    let xNumeric = true
    let minX = Infinity
    let maxX = -Infinity
    let xSorted = true
    let minXDiff = Infinity
    let prevX = NaN
    for (let j = 0; j < n; j++) {
      const point = data[j]
      if (!Array.isArray(point) || point.length > 2) return false
      const x = point[0]
      const y = point[1]
      if (xNumeric) {
        if (typeof x === 'number') {
          if (x === x) {
            if (x < minX) minX = x
            if (x > maxX) maxX = x
          }
          // NaN diffs fall through both branches, matching the legacy
          // detector's behavior on NaN-containing arrays
          const d = x - prevX
          if (d > 0) {
            if (d < minXDiff) minXDiff = d
          } else if (d < 0) {
            xSorted = false
          }
          prevX = x
        } else {
          xNumeric = false
        }
      }
      if (typeof y === 'number') {
        // same observable semantics as Range's plain-numeric lane:
        // NaN/Infinity count as null values, decimals counted in plain
        // notation for 1e-6..1e21, legacy noExponents/isFloat for exotics
        if (y === y && y !== Infinity && y !== -Infinity) {
          if (y > maxY) maxY = y
          if (y < lowestY) lowestY = y
          if (y < 0 && y < negMinY) negMinY = y
          if (!Number.isInteger(y)) {
            const av = y < 0 ? -y : y
            if (av >= 1e-6 && av < 1e21) {
              const str = '' + y
              const dot = str.indexOf('.')
              const dec = dot === -1 ? 0 : str.length - dot - 1
              if (dec > yDec) yDec = dec
            } else {
              const nv = Utils.noExponents(y)
              if (Utils.isFloat(nv)) {
                yDec = Math.max(yDec, nv.toString().split('.')[1].length)
              }
            }
          }
        } else {
          hasNulls = true
        }
      } else if (y === null) {
        hasNulls = true
      } else {
        // string/array/undefined y: needs parseNumber / OHLC handling
        return false
      }
      ys[j] = y
      xs[j] = x
    }
    this.twoDSeries = ys
    this.twoDSeriesX = xs
    this.w.axisFlags.dataFormatXNumeric = true
    const extrema = (this.w.seriesData._parsedExtrema ??= [])
    extrema[i] = {
      ref: ys,
      len: n,
      maxY,
      lowestY,
      negMinY,
      hasNulls,
      yDec,
      xref: xs,
      xNumeric,
      minX,
      maxX,
      xSorted,
      minXDiff,
    }
    return true
  }

  /**
   * @param {any[]} ser
   * @param {number} i
   */
  handleFormat2DArray(ser, i) {
    const cnf = this.w.config
    const data = ser[i].data

    const isBoxPlot =
      cnf.chart.type === 'boxPlot' ||
      /** @type {any} */ (cnf.series[i]).type === 'boxPlot'

    if (
      !isBoxPlot &&
      cnf.xaxis.type !== 'datetime' &&
      this._fast2DArrayParse(data, i)
    ) {
      return
    }

    for (let j = 0; j < data.length; j++) {
      const point = data[j]
      const x = point[0]
      const y = point[1]
      const z = point[2]

      if (typeof y !== 'undefined') {
        if (Array.isArray(y) && y.length === 4 && !isBoxPlot) {
          // candlestick nested ohlc format
          this.twoDSeries.push(Utils.parseNumber(y[3]))
        } else if (point.length >= 5) {
          // candlestick non-nested ohlc format
          this.twoDSeries.push(Utils.parseNumber(point[4]))
        } else {
          this.twoDSeries.push(Utils.parseNumber(y))
        }
        this.w.axisFlags.dataFormatXNumeric = true
      }
      if (cnf.xaxis.type === 'datetime') {
        // if timestamps are provided and xaxis type is datetime,
        const ts = new Date(x).getTime()
        this.twoDSeriesX.push(ts)
      } else {
        this.twoDSeriesX.push(x)
      }

      if (typeof z !== 'undefined') {
        this.threeDSeries.push(z)
        this.w.axisFlags.isDataXYZ = true
      }
    }
  }

  /**
   * @param {any[]} ser
   * @param {number} i
   */
  handleFormatXY(ser, i) {
    const cnf = this.w.config
    const gl = this.w.globals
    const dt = new DateTime(this.w)
    const data = ser[i].data

    let activeI = i
    if (gl.collapsedSeriesIndices.indexOf(i) > -1) {
      // fix #368
      activeI = this.activeSeriesIndex
    }
    const activeData = ser[activeI].data

    // get series, goals, z
    for (let j = 0; j < data.length; j++) {
      const point = data[j]

      if (typeof point.y !== 'undefined') {
        const val = Array.isArray(point.y)
          ? Utils.parseNumber(point.y[point.y.length - 1])
          : Utils.parseNumber(point.y)
        this.twoDSeries.push(val)
      }

      if (typeof this.seriesGoals[i] === 'undefined') {
        this.seriesGoals[i] = []
      }
      if (typeof point.goals !== 'undefined' && Array.isArray(point.goals)) {
        this.seriesGoals[i].push(point.goals)
      } else {
        this.seriesGoals[i].push(null)
      }

      if (typeof point.z !== 'undefined') {
        this.threeDSeries.push(point.z)
        this.w.axisFlags.isDataXYZ = true
      }
    }

    // get seriesX
    for (let j = 0; j < activeData.length; j++) {
      const point = activeData[j]
      const x = point.x

      const isXString = typeof x === 'string'
      const isXArr = Array.isArray(x)
      const isXDate = !isXArr && !!dt.isValidDate(x)

      if (isXString || isXDate) {
        // user supplied '01/01/2017' or a date string (a JS date object is not supported)
        if (isXString || cnf.xaxis.convertedCatToNumeric) {
          const isRangeColumn =
            gl.isBarHorizontal && this.w.axisFlags.isRangeData

          if (cnf.xaxis.type === 'datetime' && !isRangeColumn) {
            this.twoDSeriesX.push(dt.parseDate(x))
          } else {
            // a category and not a numeric x value
            this.fallbackToCategory = true
            this.twoDSeriesX.push(x)

            if (
              !isNaN(x) &&
              this.w.config.xaxis.type !== 'category' &&
              typeof x !== 'string'
            ) {
              this.w.axisFlags.isXNumeric = true
            }
          }
        } else {
          if (cnf.xaxis.type === 'datetime') {
            this.twoDSeriesX.push(dt.parseDate(x.toString()))
          } else {
            this.w.axisFlags.dataFormatXNumeric = true
            this.w.axisFlags.isXNumeric = true
            this.twoDSeriesX.push(parseFloat(x))
          }
        }
      } else if (isXArr) {
        // a multiline label described in array format
        this.fallbackToCategory = true
        this.twoDSeriesX.push(x)
      } else {
        // a numeric value in x property
        this.w.axisFlags.isXNumeric = true
        this.w.axisFlags.dataFormatXNumeric = true
        this.twoDSeriesX.push(x)
      }
    }
  }

  /**
   * @param {any[]} ser
   * @param {number} i
   */
  handleRangeData(ser, i) {
    /** @type {any} */
    let range = { start: [], end: [], rangeUniques: [] }
    if (this.isFormat2DArray()) {
      range = this.handleRangeDataFormat('array', ser, i)
    } else if (this.isFormatXY()) {
      range = this.handleRangeDataFormat('xy', ser, i)
    }

    // Fix: RangeArea Chart: hide all series results in a crash #3984
    this.w.rangeData.seriesRangeStart[i] =
      range.start === undefined ? [] : range.start
    this.w.rangeData.seriesRangeEnd[i] =
      range.end === undefined ? [] : range.end

    this.w.rangeData.seriesRange[i] = range.rangeUniques

    // check for overlaps to avoid clashes in a timeline chart
    /**
     * @param {Array<Record<string, any>>} sr
     */
    this.w.rangeData.seriesRange.forEach((sr) => {
      if (!sr) return

      /**
       * @param {Record<string, any>} sarr
       */
      sr.forEach((sarr) => {
        const yItems = /** @type {any} */ (sarr).y
        const len = /** @type {any[]} */ (yItems).length

        // Pre-check: if only one item, no overlaps possible
        if (len <= 1) return

        for (let arri = 0; arri < len; arri++) {
          const arr = /** @type {any} */ (yItems[arri])
          const range1y1 = arr.y1
          const range1y2 = arr.y2

          // Only check subsequent items to avoid duplicate comparisons
          for (let sri = arri + 1; sri < len; sri++) {
            const range2 = /** @type {any} */ (yItems[sri])
            const range2y1 = range2.y1
            const range2y2 = range2.y2

            // Check overlap using interval intersection
            if (range1y1 <= range2y2 && range2y1 <= range1y2) {
              const sarrAny = /** @type {any} */ (sarr)
              sarrAny.overlaps.add(arr.rangeName)
              sarrAny.overlaps.add(range2.rangeName)
            }
          }
        }
      })
    })

    return range
  }

  /**
   * Marks (#11) P3: fold a custom series' per-datum y-extent into the
   * range-data slice so both bounds drive the y-axis scale. When `yExtent` is
   * given it supplies the values a datum occupies (scalar or array => min/max
   * across them); otherwise the datum's `y` is used (array => first/last,
   * scalar => itself). The datum still carries a representative scalar `y`
   * (folded by handleFormatXY into seriesData.series) that gates Range.
   * @param {any[]} ser @param {number} i @param {Function|null} yExtent
   */
  handleCustomRangeData(ser, i, yExtent) {
    const data = ser[i].data || []
    /** @type {any[]} */
    const start = []
    /** @type {any[]} */
    const end = []
    for (let j = 0; j < data.length; j++) {
      const datum = data[j]
      let lo
      let hi
      if (typeof yExtent === 'function') {
        let ext = yExtent(datum, j)
        if (!Array.isArray(ext)) ext = [ext]
        const nums = ext
          .map((/** @type {any} */ v) => Utils.parseNumber(v))
          .filter((/** @type {any} */ v) => v !== null && !isNaN(v))
        lo = nums.length ? Math.min(...nums) : null
        hi = nums.length ? Math.max(...nums) : null
      } else {
        const y = datum == null ? null : datum.y
        if (Array.isArray(y)) {
          lo = Utils.parseNumber(y[0])
          hi = Utils.parseNumber(y[y.length - 1])
        } else {
          lo = hi = Utils.parseNumber(y)
        }
      }
      start.push(lo)
      end.push(hi)
    }
    this.w.rangeData.seriesRangeStart[i] = start
    this.w.rangeData.seriesRangeEnd[i] = end
  }

  /**
   * @param {any[]} ser
   * @param {number} i
   */
  handleCandleStickBoxData(ser, i) {
    /** @type {any} */
    let ohlc = { o: [], h: [], m: [], l: [], c: [] }
    if (this.isFormat2DArray()) {
      ohlc = this.handleCandleStickBoxDataFormat('array', ser, i)
    } else if (this.isFormatXY()) {
      ohlc = this.handleCandleStickBoxDataFormat('xy', ser, i)
    }

    this.w.candleData.seriesCandleO[i] = ohlc.o
    this.w.candleData.seriesCandleH[i] = ohlc.h
    this.w.candleData.seriesCandleM[i] = ohlc.m
    this.w.candleData.seriesCandleL[i] = ohlc.l
    this.w.candleData.seriesCandleC[i] = ohlc.c
    this.w.candleData.seriesBoxPoints[i] = ohlc.points || []

    return ohlc
  }

  /**
   * Parse a violin series. Each data point carries a precomputed density
   * profile (the violin shape) and an array of raw observations (the jitter):
   *
   *   { x, y: { density: [[value, weight], ...], points: [v1, v2, ...] } }
   *
   * Array fallback form: [x, densityPairs, pointsArray].
   *
   * Density `weight` need not be normalized — Violin.js scales each violin by
   * its own maxWeight. The representative scalar pushed into the main series
   * (so generic code paths see a non-null y) is the density mode — the value
   * carrying the greatest weight.
   *
   * @param {any[]} ser
   * @param {number} i
   */
  handleViolinData(ser, i) {
    const w = this.w
    const data = ser[i].data

    /** @type {any[]} */ const densityArr = []
    /** @type {any[]} */ const pointsArr = []
    /** @type {number[]} */ const minArr = []
    /** @type {number[]} */ const maxArr = []
    /** @type {number[]} */ const placeholders = []

    for (let j = 0; j < data.length; j++) {
      const d = data[j]
      const dens = d?.y?.density ?? d?.[1] ?? []
      const pts = d?.y?.points ?? d?.[2] ?? []

      /** @type {number[]} */ const values = []
      /** @type {number[]} */ const weights = []
      let maxWeight = 0
      let modeValue = null
      let minVal = Infinity
      let maxVal = -Infinity

      for (let k = 0; k < dens.length; k++) {
        const v = Utils.parseNumber(dens[k][0])
        const wt = Utils.parseNumber(dens[k][1])
        if (v === null || wt === null) continue
        values.push(v)
        weights.push(wt)
        if (wt > maxWeight) {
          maxWeight = wt
          modeValue = v
        }
        if (v < minVal) minVal = v
        if (v > maxVal) maxVal = v
      }

      /** @type {number[]} */ const cleanPts = []
      for (let k = 0; k < pts.length; k++) {
        const p = Utils.parseNumber(pts[k])
        if (p === null) continue
        cleanPts.push(p)
        if (p < minVal) minVal = p
        if (p > maxVal) maxVal = p
      }

      densityArr.push({ values, weights, maxWeight })
      pointsArr.push(cleanPts)
      minArr.push(minVal === Infinity ? 0 : minVal)
      maxArr.push(maxVal === -Infinity ? 0 : maxVal)
      // Representative value: density mode, else median of points, else 0.
      placeholders.push(
        modeValue !== null
          ? modeValue
          : cleanPts.length
            ? cleanPts[Math.floor(cleanPts.length / 2)]
            : 0,
      )
    }

    w.violinData.seriesViolinDensity[i] = densityArr
    w.violinData.seriesViolinPoints[i] = pointsArr
    w.violinData.seriesViolinMin[i] = minArr
    w.violinData.seriesViolinMax[i] = maxArr

    // Overwrite the y-placeholders that handleFormatXY/2DArray pushed (it could
    // not interpret the object/array y) with the representative scalars.
    this.twoDSeries = placeholders
  }

  /**
   * @param {string} format
   * @param {any[]} ser
   * @param {number} i
   */
  handleRangeDataFormat(format, ser, i) {
    const rangeStart = []
    const rangeEnd = []

    const uniqueKeysMap = new Map()
    /** @type {any[]} */
    const uniqueKeys = []

    // unique keys map
    /**
     * @param {Record<string, any>} item
     */
    ser[i].data.forEach((/** @type {any} */ item) => {
      if (!uniqueKeysMap.has(item.x)) {
        const keyObj = {
          x: item.x,
          overlaps: new Set(),
          y: [],
        }
        uniqueKeysMap.set(item.x, keyObj)
        uniqueKeys.push(keyObj)
      }
    })

    if (format === 'array') {
      for (let j = 0; j < ser[i].data.length; j++) {
        if (Array.isArray(ser[i].data[j])) {
          rangeStart.push(ser[i].data[j][1][0])
          rangeEnd.push(ser[i].data[j][1][1])
        } else {
          rangeStart.push(ser[i].data[j])
          rangeEnd.push(ser[i].data[j])
        }
      }
    } else if (format === 'xy') {
      for (let j = 0; j < ser[i].data.length; j++) {
        const isDataPoint2D = Array.isArray(ser[i].data[j].y)
        const id = Utils.randomId()
        const x = ser[i].data[j].x
        const y = {
          y1: isDataPoint2D ? ser[i].data[j].y[0] : ser[i].data[j].y,
          y2: isDataPoint2D ? ser[i].data[j].y[1] : ser[i].data[j].y,
          rangeName: id,
        }

        // CAUTION: mutating config object by adding a new property
        // TODO: As this is specifically for timeline rangebar charts, update the docs mentioning the series only supports xy format
        ser[i].data[j].rangeName = id

        const keyObj = uniqueKeysMap.get(x)
        if (keyObj) {
          keyObj.y.push(y)
        }

        rangeStart.push(y.y1)
        rangeEnd.push(y.y2)
      }
    }

    return {
      start: rangeStart,
      end: rangeEnd,
      rangeUniques: uniqueKeys,
    }
  }

  /**
   * @param {string} format
   * @param {any[]} ser
   * @param {number} i
   */
  handleCandleStickBoxDataFormat(format, ser, i) {
    const w = this.w
    const isBoxPlot =
      w.config.chart.type === 'boxPlot' ||
      /** @type {Record<string,any>} */ (w.config.series[i]).type === 'boxPlot'

    const serO = []
    const serH = []
    const serM = []
    const serL = []
    const serC = []
    // Raw observations for optional boxPlot jitter (object form only — the
    // flat-array form has no slot for them).
    const serPoints = []

    const data = ser[i].data
    let getVals

    if (format === 'array') {
      const isFlat =
        (isBoxPlot && data[0].length === 6) ||
        (!isBoxPlot && data[0].length === 5)
      if (isFlat) {
        /**
         * @param {any[]} d
         */
        getVals = (d) => d.slice(1)
      } else {
        /**
         * @param {any} d
         */
        getVals = (d) => (Array.isArray(d[1]) ? d[1] : [])
      }
    } else {
      // format === 'xy'
      /**
       * @param {Record<string, any>} d
       */
      getVals = (d) => (Array.isArray(d.y) ? d.y : [])
    }

    for (let j = 0; j < data.length; j++) {
      const vals = getVals(data[j])
      if (vals && vals.length >= 2) {
        serO.push(vals[0])
        serH.push(vals[1])
        if (isBoxPlot) {
          serM.push(vals[2])
          serL.push(vals[3])
          serC.push(vals[4])
        } else {
          serL.push(vals[2])
          serC.push(vals[3])
        }
      }
      const pts = data[j] && /** @type {any} */ (data[j]).points
      serPoints.push(Array.isArray(pts) ? pts : [])
    }

    return {
      o: serO,
      h: serH,
      m: serM,
      l: serL,
      c: serC,
      points: serPoints,
    }
  }

  /**
   * @param {any[]} ser
   */
  parseDataAxisCharts(ser) {
    const cnf = this.w.config
    const gl = this.w.globals

    const dt = new DateTime(this.w)

    // per-parse fused-extrema entries filled by _fast2DArrayParse, consumed
    // by Range.getMinYMaxY (ref+length guarded)
    this.w.seriesData._parsedExtrema = []

    const xlabels =
      cnf.labels.length > 0 ? cnf.labels.slice() : cnf.xaxis.categories.slice()

    this.w.axisFlags.isRangeBar =
      cnf.chart.type === 'rangeBar' && gl.isBarHorizontal

    this.w.labelData.hasXaxisGroups =
      cnf.xaxis.type === 'category' && cnf.xaxis.group.groups.length > 0
    if (this.w.labelData.hasXaxisGroups) {
      this.w.labelData.groups = cnf.xaxis.group.groups
    }

    /**
     * @param {Record<string, any>} s
     * @param {number} i
     */
    ser.forEach((s, i) => {
      if (s.name !== undefined) {
        this.w.seriesData.seriesNames.push(s.name)
      } else {
        this.w.seriesData.seriesNames.push(
          'series-' + parseInt(String(i + 1), 10),
        )
      }
    })

    this.coreUtils.setSeriesYAxisMappings()
    // At this point, every series that didn't have a user defined group name
    // has been given a name according to the yaxis the series is referenced by.
    // This fits the existing behaviour where all series associated with an axis
    // are defacto presented as a single group. It is now formalised.
    /** @type {any[]} */
    const buckets = []
    /**
     * @param {Record<string, any>} s
     */
    const groups = [
      ...new Set(cnf.series.map((/** @type {any} */ s) => s.group)),
    ]
    cnf.series.forEach((/** @type {any} */ s, i) => {
      const index = groups.indexOf(s.group)
      if (!buckets[index]) buckets[index] = []

      buckets[index].push(this.w.seriesData.seriesNames[i])
    })
    this.w.labelData.seriesGroups = buckets

    const handleDates = () => {
      for (let j = 0; j < xlabels.length; j++) {
        if (typeof xlabels[j] === 'string') {
          // user provided date strings
          const isDate = dt.isValidDate(xlabels[j])
          if (isDate) {
            this.twoDSeriesX.push(dt.parseDate(xlabels[j]))
          } else {
            throw new Error(
              'You have provided invalid Date format. Please provide a valid JavaScript Date',
            )
          }
        } else {
          // user provided timestamps
          this.twoDSeriesX.push(xlabels[j])
        }
      }
    }

    for (let i = 0; i < ser.length; i++) {
      this.twoDSeries = []
      this.twoDSeriesX = []
      this.threeDSeries = []

      if (typeof ser[i].data === 'undefined') {
        console.error(
          "It is a possibility that you may have not included 'data' property in series.",
        )
        return
      }

      // Zoom-aware LTTB downsampling — runs before any parsing so all
      // downstream paths benefit. Only applies to multiFormat (XY/{x,y}) data
      // where both x and y are available for triangle-area calculation.
      // On zoom, cnf.xaxis.min/max define the visible window; we slice the
      // stashed raw series to that window and downsample the slice so users
      // see progressively higher-resolution detail as they zoom in.
      const dr = cnf.chart.dataReducer
      const rawStash = gl.dataReducerRawSeries?.[i]?.data
      if (
        dr?.enabled &&
        this.isMultiFormat() &&
        Array.isArray(rawStash) &&
        rawStash.length > (dr.threshold ?? 500)
      ) {
        const targetPoints = dr.targetPoints ?? 250
        const xmin = cnf.xaxis.min
        const xmax = cnf.xaxis.max
        const windowed =
          xmin == null && xmax == null
            ? rawStash
            : Data.sliceByXRange(rawStash, xmin, xmax)

        // Pick the reduction strategy by the data's *shape*, not the chart-type
        // config (so combo charts work too). A point whose y is a 4-tuple is
        // candlestick/OHLC: aggregate into OHLC buckets so the high/low extremes
        // survive — LTTB would silently drop them. A 2-tuple is range data
        // (rangeArea/rangeBar): aggregate into [min low, max high] buckets, same
        // extreme-preserving idea. Scalar-y series (line/area) use LTTB, which
        // preserves visual shape. Any other array-y data (e.g. a boxPlot
        // 5-tuple) can't be meaningfully merged, so it's left as the windowed
        // slice rather than corrupted.
        let reduced = windowed
        if (windowed.length > targetPoints) {
          const sampleY = !Array.isArray(windowed[0])
            ? windowed[0]?.y
            : windowed[0]?.[1]
          if (Array.isArray(sampleY)) {
            if (sampleY.length === 4) {
              reduced = Data.ohlcAggregate(windowed, targetPoints)
            } else if (sampleY.length === 2) {
              reduced = Data.rangeAggregate(windowed, targetPoints)
            }
          } else {
            reduced = Data.lttbDownsample(windowed, targetPoints)
          }
        }
        ser[i] = { ...ser[i], data: reduced }
      }

      if (
        cnf.chart.type === 'rangeBar' ||
        cnf.chart.type === 'rangeArea' ||
        ser[i].type === 'rangeBar' ||
        ser[i].type === 'rangeArea'
      ) {
        this.w.axisFlags.isRangeData = true
        this.handleRangeData(ser, i)
      }

      // Marks (#11) P3: a custom series type may declare range/extent semantics
      // (dumbbell y:[lo,hi], bullet, ...) so BOTH y-bounds fold into the axis
      // scale. Reuses the range-data slice: Range.getMinYMaxY folds
      // seriesRangeStart/End, and the tooltip renders "lo - hi".
      const customType = ser[i].type || cnf.chart.type
      if (isCustom(customType)) {
        const cls = /** @type {any} */ (getChartClass(customType))
        const yExtent = cls && cls.yExtent
        if ((cls && cls.dataType === 'rangeXY') || typeof yExtent === 'function') {
          this.w.axisFlags.isRangeData = true
          this.handleCustomRangeData(ser, i, yExtent)
        }
      }

      if (this.isMultiFormat()) {
        if (this.isFormat2DArray()) {
          this.handleFormat2DArray(ser, i)
        } else if (this.isFormatXY()) {
          this.handleFormatXY(ser, i)
        }

        if (
          cnf.chart.type === 'candlestick' ||
          ser[i].type === 'candlestick' ||
          cnf.chart.type === 'boxPlot' ||
          ser[i].type === 'boxPlot'
        ) {
          this.handleCandleStickBoxData(ser, i)
        }

        if (cnf.chart.type === 'violin' || ser[i].type === 'violin') {
          // Must run after handleFormatXY/2DArray — it rebuilds this.twoDSeries
          // with representative scalars before the push below.
          this.handleViolinData(ser, i)
        }

        this.w.seriesData.series.push(this.twoDSeries)
        this.w.labelData.labels.push(this.twoDSeriesX)
        this.w.seriesData.seriesX.push(this.twoDSeriesX)
        this.w.seriesData.seriesGoals = this.seriesGoals

        if (i === this.activeSeriesIndex && !this.fallbackToCategory) {
          this.w.axisFlags.isXNumeric = true
        }
      } else {
        if (cnf.xaxis.type === 'datetime') {
          // user didn't supplied [{x,y}] or [[x,y]], but single array in data.
          // Also labels/categories were supplied differently
          this.w.axisFlags.isXNumeric = true

          handleDates()

          this.w.seriesData.seriesX.push(this.twoDSeriesX)
        } else if (cnf.xaxis.type === 'numeric') {
          this.w.axisFlags.isXNumeric = true

          if (xlabels.length > 0) {
            this.twoDSeriesX = xlabels
            this.w.seriesData.seriesX.push(this.twoDSeriesX)
          }
        }
        this.w.labelData.labels.push(this.twoDSeriesX)
        /**
         * @param {any} d
         */
        const singleArray = ser[i].data.map((/** @type {any} */ d) =>
          Utils.parseNumber(d),
        )
        this.w.seriesData.series.push(singleArray)
      }

      this.w.seriesData.seriesZ.push(this.threeDSeries)

      // overrided default color if user inputs color with series data
      if (ser[i].color !== undefined) {
        this.w.seriesData.seriesColors.push(ser[i].color)
      } else {
        this.w.seriesData.seriesColors.push(/** @type {any} */ (undefined))
      }
    }

    return this.w
  }

  /**
   * @param {any[]} ser
   */
  parseDataNonAxisCharts(ser) {
    const cnf = this.w.config

    // Reset any per-unit data from a previous parse; only the unit chart's
    // object form (below) repopulates it.
    this.w.seriesData.unitData = []

    // Check if we have both old format (numeric series + labels) and new format
    const hasOldFormat =
      Array.isArray(ser) &&
      ser.every((s) => typeof s === 'number') &&
      cnf.labels.length > 0
    const hasNewFormat =
      Array.isArray(ser) &&
      ser.some(
        (s) =>
          (s && typeof s === 'object' && s.data) ||
          (s && typeof s === 'object' && s.parsing),
      )

    // Unit chart with the per-unit object form: each category is an array of
    // unit data (one datum per dot), not a single aggregate. Handle it before
    // the pie extraction below (which would treat every unit as its own slice).
    if (cnf.chart.type === 'unit' && hasNewFormat && !hasOldFormat) {
      return this.parseUnitSeries(ser)
    }

    if (hasOldFormat && hasNewFormat) {
      console.warn(
        'ApexCharts: Both old format (numeric series + labels) and new format (series objects with data/parsing) detected. Using old format for backward compatibility.',
      )
    }

    // If old format exists, use it (backward compatibility priority)
    if (hasOldFormat) {
      this.w.seriesData.series = /** @type {any} */ (ser.slice())
      this.w.seriesData.seriesNames = cnf.labels.slice()
      for (let i = 0; i < this.w.seriesData.series.length; i++) {
        if (this.w.seriesData.seriesNames[i] === undefined) {
          this.w.seriesData.seriesNames.push('series-' + (i + 1))
        }
      }
      return this.w
    }

    // Check if it's just a plain numeric array without labels (radialBar common case)
    if (Array.isArray(ser) && ser.every((s) => typeof s === 'number')) {
      this.w.seriesData.series = /** @type {any} */ (ser.slice())
      this.w.seriesData.seriesNames = []
      for (let i = 0; i < this.w.seriesData.series.length; i++) {
        this.w.seriesData.seriesNames.push(cnf.labels[i] || `series-${i + 1}`)
      }
      return this.w
    }

    const processedData = this.extractPieDataFromSeries(ser)

    this.w.seriesData.series = processedData.values
    this.w.seriesData.seriesNames = processedData.labels

    // Special handling for radialBar - ensure percentages are valid
    if (cnf.chart.type === 'radialBar') {
      /**
       * @param {any} val
       */
      this.w.seriesData.series = this.w.seriesData.series.map((val) => {
        const numVal = Utils.parseNumber(val)
        if (numVal > 100) {
          console.warn(
            `ApexCharts: RadialBar value ${numVal} > 100, consider using percentage values (0-100)`,
          )
        }
        return numVal
      })
    }

    // Ensure we have proper fallback names
    for (let i = 0; i < this.w.seriesData.series.length; i++) {
      if (this.w.seriesData.seriesNames[i] === undefined) {
        this.w.seriesData.seriesNames.push('series-' + (i + 1))
      }
    }

    return this.w
  }

  /**
   * Parse the unit chart's per-unit object form:
   *   series: [{ name, data: [datum, datum, ...] }, ...]
   * Each category's dot count is `data.length` (one dot per datum), and the
   * per-unit data is kept on `w.seriesData.unitData` so the renderer can colour
   * dots individually and the tooltip can show each unit's own info.
   * @param {any[]} ser
   * @returns {any} w
   */
  parseUnitSeries(ser) {
    const cnf = this.w.config
    /** @type {number[]} */
    const series = []
    /** @type {string[]} */
    const seriesNames = []
    /** @type {any[][]} */
    const unitData = []

    ser.forEach((s, i) => {
      const data = s && Array.isArray(s.data) ? s.data : []
      series.push(data.length)
      const name =
        s && s.name !== undefined && s.name !== null ? s.name : undefined
      seriesNames.push(name ?? cnf.labels[i] ?? `series-${i + 1}`)
      unitData.push(data.slice())
    })

    this.w.seriesData.series = /** @type {any} */ (series)
    this.w.seriesData.seriesNames = seriesNames
    this.w.seriesData.unitData = unitData

    return this.w
  }

  /**
   * Reset parsing flags to allow re-parsing of data during updates
   */
  resetParsingFlags() {
    const w = this.w
    w.axisFlags.dataWasParsed = false
    w.globals.originalSeries = null

    if (w.config.series) {
      /**
       * @param {Object} serie
       */
      w.config.series.forEach((serie) => {
        if (/** @type {any} */ (serie).__apexParsed) {
          delete (/** @type {any} */ (serie).__apexParsed)
        }
      })
    }
  }

  /**
   * @param {any[]} ser
   */
  extractPieDataFromSeries(ser) {
    /** @type {any[]} */
    const values = []
    /** @type {any[]} */
    const labels = []

    if (!Array.isArray(ser)) {
      console.warn('ApexCharts: Expected array for series data')
      return { values: [], labels: [] }
    }

    if (ser.length === 0) {
      console.warn('ApexCharts: Empty series array')
      return { values: [], labels: [] }
    }

    // Handle only series objects with data property
    const firstItem = ser[0]

    if (typeof firstItem === 'object' && firstItem !== null && firstItem.data) {
      // Format: [{ data: [{x: 'A', y: 10}] }] or [{ data: rawData, parsing: {...} }]
      this.extractPieDataFromSeriesObjects(ser, values, labels)
    } else {
      // Unsupported format
      console.warn(
        'ApexCharts: Unsupported series format for pie/donut/radialBar. Expected series objects with data property.',
      )
      return { values: [], labels: [] }
    }

    return { values, labels }
  }

  // Extract data from series objects: [{ data: [...], parsing: {...} }]
  /**
   * @param {any[]} seriesArray
   * @param {any[]} values
   * @param {any[]} labels
   */
  extractPieDataFromSeriesObjects(seriesArray, values, labels) {
    /**
     * @param {Object} serie
     * @param {number} serieIndex
     */
    seriesArray.forEach((serie, serieIndex) => {
      if (!serie.data || !Array.isArray(serie.data)) {
        console.warn(`ApexCharts: Series ${serieIndex} has no valid data array`)
        return
      }

      // If series was already parsed by parseRawDataIfNeeded, data should be in {x, y} format
      /**
       * @param {Record<string, any>} dataPoint
       */
      serie.data.forEach((/** @type {any} */ dataPoint) => {
        if (typeof dataPoint === 'object' && dataPoint !== null) {
          if (dataPoint.x !== undefined && dataPoint.y !== undefined) {
            labels.push(String(dataPoint.x))
            values.push(Utils.parseNumber(dataPoint.y))
          } else {
            console.warn(
              'ApexCharts: Invalid data point format for pie chart. Expected {x, y} format:',
              dataPoint,
            )
          }
        } else {
          console.warn(
            'ApexCharts: Expected object data point, got:',
            typeof dataPoint,
          )
        }
      })
    })
  }

  /** User possibly set string categories in xaxis.categories or labels prop
   * Or didn't set xaxis labels at all - in which case we manually do it.
   * If user passed series data as [[3, 2], [4, 5]] or [{ x: 3, y: 55 }],
   * this shouldn't be called
   * @param {any[]} ser - the series which user passed to the config
   */
  handleExternalLabelsData(ser) {
    const cnf = this.w.config

    if (cnf.xaxis.categories.length > 0) {
      // user provided labels in xaxis.category prop
      this.w.labelData.labels = cnf.xaxis.categories
    } else if (cnf.labels.length > 0) {
      // user provided labels in labels props
      this.w.labelData.labels = cnf.labels.slice()
    } else if (this.fallbackToCategory) {
      // user provided labels in x prop in [{ x: 3, y: 55 }] data, and those labels are already stored in this.w.labelData.labels[0], so just re-arrange the this.w.labelData.labels array
      this.w.labelData.labels = /** @type {string[]} */ (
        /** @type {unknown} */ (this.w.labelData.labels[0])
      )

      if (this.w.rangeData.seriesRange.length) {
        /**
         * @param {Array<Record<string, any>>} srt
         */
        this.w.rangeData.seriesRange.map((srt) => {
          srt.forEach((/** @type {any} */ sr) => {
            if (this.w.labelData.labels.indexOf(sr.x) < 0 && sr.x) {
              this.w.labelData.labels.push(sr.x)
            }
          })
        })
        // remove duplicate x-axis labels
        const _labels = this.w.labelData.labels
        if (
          _labels.length > 0 &&
          (typeof _labels[0] === 'number' || typeof _labels[0] === 'string')
        ) {
          this.w.labelData.labels = [...new Set(_labels)]
        } else {
          const _seen = new Map()
          for (const _label of _labels) {
            const _key = JSON.stringify(_label)
            if (!_seen.has(_key)) _seen.set(_key, _label)
          }
          this.w.labelData.labels = Array.from(_seen.values())
        }
      }

      if (cnf.xaxis.convertedCatToNumeric) {
        const defaults = new Defaults(cnf)
        defaults.convertCatToNumericXaxis(cnf, this.w.seriesData.seriesX[0])
        this._generateExternalLabels(ser)
      }
    } else {
      this._generateExternalLabels(ser)
    }
  }

  /**
   * @param {any[]} ser
   */
  _generateExternalLabels(ser) {
    const gl = this.w.globals
    const cnf = this.w.config
    // user didn't provided any labels, fallback to 1-2-3-4-5
    let labelArr = []

    if (gl.axisCharts) {
      if (this.w.seriesData.series.length > 0) {
        if (this.isFormatXY()) {
          // in case there is a combo chart (boxplot/scatter)
          // and there are duplicated x values, we need to eliminate duplicates
          /**
           * @param {Object} serie
           */
          const seriesDataFiltered = cnf.series.map(
            (/** @type {any} */ serie) => {
              const seen = new Map()
              for (const point of serie.data) {
                if (!seen.has(point.x)) seen.set(point.x, point)
              }
              return Array.from(seen.values())
            },
          )

          /**
           * @param {number} p
           * @param {any} c
           * @param {number} i
           * @param {any} a
           */
          const len = seriesDataFiltered.reduce(
            (p, c, i, a) => (a[p].length > c.length ? p : i),
            0,
          )

          for (let i = 0; i < seriesDataFiltered[len].length; i++) {
            labelArr.push(i + 1)
          }
        } else {
          for (
            let i = 0;
            i < this.w.seriesData.series[gl.maxValsInArrayIndex].length;
            i++
          ) {
            labelArr.push(i + 1)
          }
        }
      }

      this.w.seriesData.seriesX = []
      // create this.w.seriesData.seriesX as it will be used in calculations of x positions
      for (let i = 0; i < ser.length; i++) {
        this.w.seriesData.seriesX.push(labelArr)
      }

      // turn on the isXNumeric flag to allow minX and maxX to function properly
      if (!this.w.globals.isBarHorizontal) {
        this.w.axisFlags.isXNumeric = true
      }
    }

    // no series to pull labels from, put a 0-10 series
    // possibly, user collapsed all series. Hence we can't work with above calc
    if (labelArr.length === 0) {
      labelArr = gl.axisCharts
        ? []
        : /**
           * @param {Record<string, any>} gls
           * @param {number} glsi
           */
          this.w.seriesData.series.map((gls, glsi) => {
            return glsi + 1
          })
      for (let i = 0; i < ser.length; i++) {
        this.w.seriesData.seriesX.push(labelArr)
      }
    }

    // Finally, pass the labelArr in this.w.labelData.labels which will be printed on x-axis
    this.w.labelData.labels = /** @type {string[]} */ (
      /** @type {unknown} */ (labelArr)
    )

    if (cnf.xaxis.convertedCatToNumeric) {
      /**
       * @param {number} l
       */
      this.w.labelData.categoryLabels = labelArr.map((l) => {
        return cnf.xaxis.labels.formatter(l)
      })
    }

    // Turn on this global flag to indicate no labels were provided by user
    this.w.axisFlags.noLabelsProvided = true
  }

  /**
   * @param {any[]} series
   */
  parseRawDataIfNeeded(series) {
    const cnf = this.w.config
    const gl = this.w.globals
    const globalParsing = cnf.parsing

    // If data was already parsed, don't parse again
    if (this.w.axisFlags.dataWasParsed) {
      return series
    }

    // If no global parsing config and no series-level parsing, return as-is.
    // The config default is `parsing: { x: undefined, y: undefined }`, a
    // truthy object, so test the FIELDS, not the object: otherwise every
    // chart without parsing still walks the series and deep-clones
    // originalSeries on every single update.
    const hasGlobalParsing = !!(
      globalParsing &&
      (globalParsing.x || globalParsing.y || globalParsing.z)
    )
    /**
     * @param {Record<string, any>} s
     */
    const hasSeriesParsing = series.some(
      (s) => s.parsing && (s.parsing.x || s.parsing.y || s.parsing.z),
    )
    if (!hasGlobalParsing && !hasSeriesParsing) {
      return series
    }

    /**
     * @param {Object} serie
     * @param {number} index
     */
    const processedSeries = series.map((serie, index) => {
      if (
        !serie.data ||
        !Array.isArray(serie.data) ||
        serie.data.length === 0
      ) {
        return serie
      }

      // Resolve effective parsing config for this series
      const effectiveParsing = {
        x: serie.parsing?.x || globalParsing?.x,
        y: serie.parsing?.y || globalParsing?.y,
        z: serie.parsing?.z || globalParsing?.z,
      }

      // If no effective parsing config, return as-is
      if (!effectiveParsing.x && !effectiveParsing.y) {
        return serie
      }

      // Check if data is already in {x, y} format or 2D array format
      const firstDataPoint = serie.data[0]

      if (
        (typeof firstDataPoint === 'object' &&
          firstDataPoint !== null &&
          (Object.prototype.hasOwnProperty.call(firstDataPoint, 'x') ||
            Object.prototype.hasOwnProperty.call(firstDataPoint, 'y'))) ||
        Array.isArray(firstDataPoint)
      ) {
        return serie
      }

      // Validate that we have both x and y parsing config
      if (
        !effectiveParsing.x ||
        !effectiveParsing.y ||
        (Array.isArray(effectiveParsing.y) && effectiveParsing.y.length === 0)
      ) {
        console.warn(
          `ApexCharts: Series ${index} has parsing config but missing x or y field specification`,
        )
        return serie
      }

      // Transform raw data to {x, y} format
      /**
       * @param {Record<string, any>} item
       * @param {number} itemIndex
       */
      const transformedData = serie.data.map(
        (/** @type {any} */ item, /** @type {any} */ itemIndex) => {
          if (typeof item !== 'object' || item === null) {
            console.warn(
              `ApexCharts: Series ${index}, data point ${itemIndex} is not an object, skipping parsing`,
            )
            return item
          }

          const x = this.getNestedValue(item, effectiveParsing.x)

          let y
          let z = undefined
          if (Array.isArray(effectiveParsing.y)) {
            const yValues = effectiveParsing.y.map((fieldName) =>
              this.getNestedValue(item, fieldName),
            )

            if (this.w.config.chart.type === 'bubble') {
              if (yValues.length < 2) {
                console.warn(
                  `ApexCharts: series[${index}] bubble chart requires parseData.y to have at least 2 fields (y and z). Got: ${JSON.stringify(effectiveParsing.y)}`,
                )
              }
              // For bubble: [y-value, z-value] → y = yValues[0], z = yValues[1]
              y = yValues[0]
            } else {
              y = yValues
            }
          } else {
            y = this.getNestedValue(item, effectiveParsing.y)
          }

          // explicit z field for bubble charts
          if (effectiveParsing.z) {
            z = this.getNestedValue(item, effectiveParsing.z)
          }

          // Warn if fields don't exist
          if (x === undefined) {
            console.warn(
              `ApexCharts: Series ${index}, data point ${itemIndex} missing field '${effectiveParsing.x}'`,
            )
          }

          if (y === undefined) {
            console.warn(
              `ApexCharts: Series ${index}, data point ${itemIndex} missing field '${effectiveParsing.y}'`,
            )
          }

          const result = { x, y, z: undefined }

          if (
            this.w.config.chart.type === 'bubble' &&
            Array.isArray(effectiveParsing.y) &&
            effectiveParsing.y.length === 2
          ) {
            const zValue = this.getNestedValue(item, effectiveParsing.y[1])
            if (zValue !== undefined) {
              result.z = zValue
            }
          }

          if (z !== undefined) {
            result.z = z
          }

          return result
        },
      )

      return {
        ...serie,
        data: transformedData,
        __apexParsed: true,
      }
    })

    // Mark that data was parsed
    this.w.axisFlags.dataWasParsed = true

    if (!gl.originalSeries) {
      gl.originalSeries = Utils.clone(series)
    }

    return processedSeries
  }

  /**
   * Get nested object value using dot notation path
   * @param {Object} obj - The object to search in
   * @param {string} path - Dot notation path (e.g., 'user.profile.name')
   * @returns {*} The value at the path, or undefined if not found
   */
  getNestedValue(obj, path) {
    if (!obj || typeof obj !== 'object' || !path) {
      return undefined
    }

    // Handle simple property access (no dots)
    if (path.indexOf('.') === -1) {
      return /** @type {any} */ (obj)[path]
    }

    // Handle nested property access
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length; i++) {
      if (
        current === null ||
        current === undefined ||
        typeof current !== 'object'
      ) {
        return undefined
      }
      current = /** @type {any} */ (current)[keys[i]]
    }

    return current
  }

  /**
   * Scatter strip-plot support. When `plotOptions.scatter.jitter.enabled` and a
   * series carries compact `{ x: 'Category', y: [v1, v2, ...] }` data, expand
   * each observation into its own `{ x: bandIndex, y }` point (so every dot is a
   * first-class, hoverable marker) and frame the x-axis as evenly-spaced,
   * labelled bands. The reference per-point form (numeric x + `xaxis.categories`)
   * is reframed too, without expansion. Returns `ser` unchanged for non-scatter
   * charts and for plain numeric/datetime data (continuous overplotting jitter
   * is offset at render time instead).
   *
   * @param {any[]} ser
   * @returns {any[]}
   */
  expandScatterJitterData(ser) {
    const cnf = this.w.config
    const isScatter =
      cnf.chart.type === 'scatter' || cnf.chart.type === 'bubble'
    const jt = cnf.plotOptions?.scatter?.jitter
    if (!isScatter || !jt || !jt.enabled || !Array.isArray(ser)) return ser

    const hasArrayY = ser.some(
      (/** @type {any} */ s) =>
        Array.isArray(s?.data) &&
        s.data.some(
          (/** @type {any} */ d) =>
            d && !Array.isArray(d) && Array.isArray(d.y),
        ),
    )

    if (!hasArrayY) {
      // Reference form: plain points at numeric band indices + xaxis.categories.
      // Just frame the axis; the data is already one point per observation.
      if (cnf.xaxis.type !== 'datetime') {
        if (
          Array.isArray(cnf.xaxis.categories) &&
          cnf.xaxis.categories.length
        ) {
          this._applyBandAxis(cnf.xaxis.categories.slice())
        } else if (
          Array.isArray(cnf.xaxis._scatterBandLabels) &&
          cnf.xaxis._scatterBandLabels.length
        ) {
          // Re-render after the compact data was expanded in place (zoom,
          // pan, any updateOptions): the config now carries plain points and
          // no categories, so re-frame from the labels persisted by the
          // first pass. Without this, zoom windows never get band-snapped.
          this._applyBandAxis(cnf.xaxis._scatterBandLabels)
        }
      }
      return ser
    }

    // Compact form: collect bands (in first-seen order) then expand.
    /** @type {any[]} */
    const bandLabels = []
    const bandIndex = new Map()
    ser.forEach((/** @type {any} */ s) => {
      if (!Array.isArray(s?.data)) return
      s.data.forEach((/** @type {any} */ d) => {
        if (d && Array.isArray(d.y)) {
          const key = String(d.x)
          if (!bandIndex.has(key)) {
            bandIndex.set(key, bandLabels.length)
            bandLabels.push(d.x)
          }
        }
      })
    })

    const maxPoints = jt.maxPoints || 5000

    const expanded = ser.map((/** @type {any} */ s) => {
      if (!Array.isArray(s?.data)) return s
      /** @type {any[]} */
      const out = []
      s.data.forEach((/** @type {any} */ d) => {
        if (d && Array.isArray(d.y)) {
          const bi = bandIndex.get(String(d.x))
          const ys = d.y
          const stride =
            ys.length > maxPoints ? Math.ceil(ys.length / maxPoints) : 1
          for (let k = 0; k < ys.length; k += stride) {
            const yv = Utils.parseNumber(ys[k])
            if (yv === null) continue
            out.push({ x: bi, y: yv })
          }
        } else if (d && typeof d === 'object' && !Array.isArray(d)) {
          // a plain { x, y } mixed into compact data — map known labels to bands
          const key = String(d.x)
          out.push({ x: bandIndex.has(key) ? bandIndex.get(key) : d.x, y: d.y })
        } else {
          out.push(d)
        }
      })
      return { ...s, data: out }
    })

    this._applyBandAxis(bandLabels)
    return expanded
  }

  /**
   * Frame the x-axis as N evenly-spaced bands (one per category) on a numeric
   * scale. Bands sit at integer positions 0..N-1; the range is padded by a full
   * band on each side (min -1, max N) so jittered dots never clip. Crucially the
   * range bounds and tick count are integers, so the ticks land exactly on the
   * band centers regardless of how the numeric scale "nices" the step (e.g. the
   * small-range reduction in Scales._adjustTicksForSmallRange triggered by a
   * y-axis formatter). Only fills in options the user hasn't set, so explicit
   * min/max/tickAmount/formatter still win. The exception is an interactive
   * zoom/pan window (w.interact.zoomed): its fractional bounds are snapped to
   * whole bands so tick labels stay on band centers and edge bands are never
   * half-cropped.
   *
   * @param {any[]} bandLabels
   */
  _applyBandAxis(bandLabels) {
    const xa = this.w.config.xaxis
    const n = bandLabels.length
    if (!n) return

    // Track which options we auto-assigned so a re-render with a different band
    // set refreshes them, while values the user set explicitly are left alone.
    const owned =
      /** @type {Record<string, boolean>} */ (
        (xa._scatterBand = xa._scatterBand || {})
      )

    // Persist the labels: once the compact data has been expanded into plain
    // points, re-renders can no longer derive the bands from the series (see
    // expandScatterJitterData's reference-form branch).
    xa._scatterBandLabels = bandLabels.slice()

    xa.type = 'numeric'
    if (
      this.w.interact?.zoomed &&
      typeof xa.min === 'number' &&
      typeof xa.max === 'number' &&
      isFinite(xa.min) &&
      isFinite(xa.max)
    ) {
      // A zoom or pan window arrives with fractional bounds (a rubber-band
      // selection, wheel zoom, pinch). On a band axis a fractional window is
      // doubly broken: ticks no longer land on band centers (every label
      // formats to ''), and a band sitting on the window edge shows half a
      // dot cloud. Snap the window to the touched band centers plus one full
      // band of padding per side, mirroring the initial frame: integer bounds
      // and an integer tick count survive the numeric scale's nicing, so
      // every tick lands exactly on a band center. Neighbouring bands peek in
      // half-cropped at the window edges (zoom context); the selected bands
      // themselves are never edge-cropped. The 0.49 bias keeps a band whose
      // center sits exactly on the window edge (a zoom-out clamped to the
      // data bounds 0..n-1 must keep the outermost bands).
      const clampBand = (/** @type {number} */ b) =>
        Math.max(0, Math.min(n - 1, b))
      let first = clampBand(Math.round(xa.min + 0.49))
      let last = clampBand(Math.round(xa.max - 0.49))
      if (last < first) {
        // window narrower than one band: show the band nearest its center
        first = last = clampBand(Math.round((xa.min + xa.max) / 2))
      }
      xa.min = first - 1
      xa.max = last + 1
      xa.tickAmount = last - first + 2
      owned.min = true
      owned.max = true
      owned.tick = true
    } else {
      if (xa.min == null || owned.min) {
        xa.min = -1
        owned.min = true
      }
      if (xa.max == null || owned.max) {
        xa.max = n
        owned.max = true
      }
      if (
        xa.tickAmount == null ||
        xa.tickAmount === 'dataPoints' ||
        owned.tick
      ) {
        xa.tickAmount = n + 1
        owned.tick = true
      }
    }

    xa.labels = xa.labels || {}
    const existing = /** @type {any} */ (xa.labels.formatter)
    if (typeof existing !== 'function' || existing._scatterBand) {
      const fmt = /** @type {any} */ (
        (/** @type {number} */ val) => {
          const r = Math.round(val)
          return Math.abs(val - r) < 1e-6 && bandLabels[r] !== undefined
            ? bandLabels[r]
            : ''
        }
      )
      fmt._scatterBand = true
      xa.labels.formatter = fmt
    }
  }

  // Segregate user provided data into appropriate vars
  /**
   * @param {any[]} ser
   */
  parseData(ser) {
    const w = this.w
    const cnf = w.config
    const gl = w.globals

    ser = this.parseRawDataIfNeeded(ser)

    // Scatter "jitter": expand compact { x, y:[...] } strip-plot data into one
    // point per observation and frame the x-axis as evenly-spaced bands. A no-op
    // for non-scatter charts and for plain { x, y } data (overplotting jitter is
    // applied at render time instead — see Scatter.drawPoint).
    ser = this.expandScatterJitterData(ser)

    // Stash raw series once per chart lifetime so zoom/pan can re-downsample
    // against full-resolution data. Cleared by _updateSeries when user pushes
    // new data. We hold references — parseDataAxisCharts replaces ser[i] but
    // never mutates the underlying data array.
    if (
      cnf.chart.dataReducer?.enabled &&
      gl.axisCharts &&
      !gl.dataReducerRawSeries
    ) {
      gl.dataReducerRawSeries = ser.map((s) => ({
        data: Array.isArray(s?.data) ? s.data.slice() : s?.data,
      }))
      // Also capture true x-bounds from the raw data so zoom-out/pan clamps
      // don't shrink to the current window's bounds (initialMinX/initialMaxX
      // are recomputed from the downsampled-and-sliced data each parse).
      let rawMinX = Infinity
      let rawMaxX = -Infinity
      for (const s of ser) {
        const d = s?.data
        if (!Array.isArray(d) || d.length === 0) continue
        const isXY = !Array.isArray(d[0])
        const firstX = isXY ? d[0]?.x : d[0]?.[0]
        const lastX = isXY ? d[d.length - 1]?.x : d[d.length - 1]?.[0]
        if (typeof firstX === 'number') rawMinX = Math.min(rawMinX, firstX)
        if (typeof lastX === 'number') rawMaxX = Math.max(rawMaxX, lastX)
      }
      if (rawMinX !== Infinity) {
        gl.dataReducerRawMinX = rawMinX
        gl.dataReducerRawMaxX = rawMaxX
      }
    }

    // When zoom-aware downsampling is active, parseDataAxisCharts replaces
    // ser[i] with the windowed/downsampled view. `ser` shares its array
    // reference with the caller's `options.series` (Utils.extend copies arrays
    // by reference), so writing the reduced view back into it would corrupt the
    // user's original full-resolution data: every later re-render created from
    // that same options object would start already reduced and could never
    // recover the raw points (nor be un-downsampled by disabling the reducer).
    // Detach with a shallow clone so the reduction only touches our copy. The
    // raw stash above was taken before any reduction, so it stays intact.
    if (gl.dataReducerRawSeries && cnf.chart.dataReducer?.enabled) {
      ser = ser.map((s) => ({ ...s }))
    }

    cnf.series = ser
    // parseDataAxisCharts mutates ser[i] to the windowed/downsampled view.
    // Re-cloning from cnf.series each parse would corrupt initialSeries and
    // break resetZoom (it would only restore one zoom step). Instead, snapshot
    // from the raw stash so initialSeries always represents the true input.
    if (gl.dataReducerRawSeries && cnf.chart.dataReducer?.enabled) {
      const stash = gl.dataReducerRawSeries
      gl.initialSeries = ser.map((s, i) => ({
        ...s,
        data: stash[i]?.data?.slice() ?? s.data,
      }))
    } else {
      // lazy snapshot: the globals setter stores a cheap per-series shallow
      // copy; the deep clone materializes only if something reads it
      gl.initialSeries = ser
    }

    this.excludeCollapsedSeriesInYAxis()

    // If we detected string in X prop of series, we fallback to category x-axis
    this.fallbackToCategory = false

    this.resetGlobals()
    this.isMultipleY()

    if (gl.axisCharts) {
      // axisCharts includes line / area / column / scatter
      this.parseDataAxisCharts(ser)
      this.coreUtils.getLargestSeries()
    } else {
      // non-axis charts are pie / donut
      this.parseDataNonAxisCharts(ser)
    }

    // set Null values to 0 in all series when user hides/shows some series
    if (cnf.chart.stacked) {
      const series = new Series(this.w)
      this.w.seriesData.series = series.setNullSeriesToZeroValues(
        this.w.seriesData.series,
      )
    }

    this.coreUtils.getSeriesTotals()
    if (gl.axisCharts) {
      // Lazy: three additional O(n) passes over every series that most axis
      // charts never read (only stacked charts and percent formatters do).
      // The property getters compute on first access after each parse.
      Data._defineLazyResult(this.w.seriesData, 'stackedSeriesTotals', () =>
        this.coreUtils.getStackedSeriesTotals(),
      )
      Data._defineLazyResult(
        this.w.seriesData,
        'stackedSeriesTotalsByGroups',
        () => this.coreUtils.getStackedSeriesTotalsByGroups(),
      )
      Data._defineLazyResult(gl, 'seriesPercent', () => {
        this.coreUtils.getPercentSeries()
        // getPercentSeries assigns through this property's setter
        return gl.seriesPercent
      })
    } else {
      this.coreUtils.getPercentSeries()
    }

    if (
      !this.w.axisFlags.dataFormatXNumeric &&
      (!this.w.axisFlags.isXNumeric ||
        (cnf.xaxis.type === 'numeric' &&
          cnf.labels.length === 0 &&
          cnf.xaxis.categories.length === 0))
    ) {
      // x-axis labels couldn't be detected; hence try searching every option in config
      this.handleExternalLabelsData(ser)
    }

    // check for multiline xaxis
    const catLabels = this.coreUtils.getCategoryLabels(this.w.labelData.labels)
    for (let l = 0; l < catLabels.length; l++) {
      if (Array.isArray(catLabels[l])) {
        this.w.axisFlags.isMultiLineX = true
        break
      }
    }

    // Return a snapshot of all parsed state grouped by future w.* slice destinations.
    // Phase 1: callers use named writer stubs (no-ops — mutations above already wrote to gl).
    // Phase 2: writers will assign to typed slices instead of gl.*.
    return {
      // w.seriesData (future slice)
      // initialSeries/originalSeries and the stacked totals are deliberately
      // ABSENT: they already live as lazy accessors on gl / w.seriesData, so
      // a snapshot field would either force their materialization (a deep
      // clone plus three O(n) passes per parse that most charts never need)
      // or, as a delegating getter, recurse into itself when a writer copies
      // it back onto the object it delegates to.
      seriesData: {
        series: this.w.seriesData.series,
        seriesNames: this.w.seriesData.seriesNames,
        seriesX: this.w.seriesData.seriesX,
        seriesZ: this.w.seriesData.seriesZ,
        seriesColors: this.w.seriesData.seriesColors,
        seriesGoals: this.w.seriesData.seriesGoals,
        unitData: this.w.seriesData.unitData,
        noLabelsProvided: this.w.axisFlags.noLabelsProvided,
      },
      // w.rangeData (future slice)
      rangeData: {
        seriesRangeStart: this.w.rangeData.seriesRangeStart,
        seriesRangeEnd: this.w.rangeData.seriesRangeEnd,
        seriesRange: this.w.rangeData.seriesRange,
      },
      // w.candleData (future slice)
      candleData: {
        seriesCandleO: this.w.candleData.seriesCandleO,
        seriesCandleH: this.w.candleData.seriesCandleH,
        seriesCandleM: this.w.candleData.seriesCandleM,
        seriesCandleL: this.w.candleData.seriesCandleL,
        seriesCandleC: this.w.candleData.seriesCandleC,
        seriesBoxPoints: this.w.candleData.seriesBoxPoints,
      },
      // w.labelData (future slice)
      labelData: {
        labels: this.w.labelData.labels,
        categoryLabels: this.w.labelData.categoryLabels,
      },
      // w.axisFlags (future slice)
      axisFlags: {
        isXNumeric: this.w.axisFlags.isXNumeric,
        dataFormatXNumeric: this.w.axisFlags.dataFormatXNumeric,
        isDataXYZ: this.w.axisFlags.isDataXYZ,
        isRangeData: this.w.axisFlags.isRangeData,
        isRangeBar: this.w.axisFlags.isRangeBar,
        isMultiLineX: this.w.axisFlags.isMultiLineX,
        dataWasParsed: this.w.axisFlags.dataWasParsed,
        hasXaxisGroups: this.w.labelData.hasXaxisGroups,
        groups: this.w.labelData.groups,
        seriesGroups: this.w.labelData.seriesGroups,
      },
    }
  }

  /**
   * Slice a sorted-by-x series to a [xmin, xmax] window using binary search.
   *
   * Pads with one extra point on each side so lines extend cleanly to the
   * chart edges. Either bound may be null/undefined to disable that side.
   *
   * @param {any[]} data - Series data in [{x,y}] or [[x,y]] format, sorted by x.
   * @param {number|null|undefined} xmin
   * @param {number|null|undefined} xmax
   * @returns {any[]} Sliced array (new array, never the input reference).
   */
  /**
   * Define `key` on `obj` as a lazily computed property: `compute` runs on
   * first read after this call and its result is cached; assigning to the
   * property stores the assigned value directly (so code that writes the
   * field, like getPercentSeries, keeps working). Re-calling resets the cache
   * (used once per parse).
   * @param {any} obj
   * @param {string} key
   * @param {() => any} compute
   */
  static _defineLazyResult(obj, key, compute) {
    let has = false
    /** @type {any} */
    let value
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: true,
      get() {
        if (!has) {
          has = true
          value = compute()
        }
        return value
      },
      set(v) {
        has = true
        value = v
      },
    })
  }

  /**
   * @param {any[]} data
   * @param {any} xmin
   * @param {any} xmax
   */
  static sliceByXRange(data, xmin, xmax) {
    const len = data.length
    if (len === 0) return data
    const isXY = !Array.isArray(data[0])
    const getX = isXY
      ? (/** @type {any} */ p) => p.x
      : (/** @type {any} */ p) => p[0]

    let lo = 0
    if (xmin != null) {
      let l = 0
      let r = len - 1
      while (l <= r) {
        const m = (l + r) >> 1
        if (getX(data[m]) < xmin) l = m + 1
        else r = m - 1
      }
      lo = Math.max(0, l - 1)
    }

    let hi = len
    if (xmax != null) {
      let l = 0
      let r = len - 1
      while (l <= r) {
        const m = (l + r) >> 1
        if (getX(data[m]) > xmax) r = m - 1
        else l = m + 1
      }
      hi = Math.min(len, l + 1)
    }

    return lo === 0 && hi === len ? data.slice() : data.slice(lo, hi)
  }

  /**
   * Largest-Triangle-Three-Bucket (LTTB) downsampling.
   *
   * Reduces `data` to `targetPoints` points while preserving the visual shape
   * of the series as perceived by the human eye.
   *
   * @param {any[]} data   - Raw series data in [{x,y}] or [[x,y]] format.
   * @param {number} targetPoints - Desired output length (>= 3).
   * @returns {any[]} Downsampled array in the same format as the input.
   */
  static lttbDownsample(data, targetPoints) {
    const len = data.length
    if (targetPoints >= len || targetPoints < 3) return data

    // Normalise each element to {x, y} for the algorithm, remembering format.
    /**
     * @param {number} p
     */
    const isXY = !Array.isArray(data[0])
    const getX = isXY
      ? (/** @type {any} */ p) => p.x
      : (/** @type {any} */ p) => p[0]
    const getY = isXY
      ? (/** @type {any} */ p) => p.y
      : (/** @type {any} */ p) => p[1]

    const sampled = []
    // Always include the first point.
    sampled.push(data[0])

    const bucketSize = (len - 2) / (targetPoints - 2)
    let a = 0 // index of the last selected point

    for (let i = 0; i < targetPoints - 2; i++) {
      // Calculate point average for next bucket (used as the "future" anchor).
      const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1
      const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, len)

      let avgX = 0
      let avgY = 0
      const avgRangeLen = avgRangeEnd - avgRangeStart
      for (let j = avgRangeStart; j < avgRangeEnd; j++) {
        avgX += getX(data[j])
        avgY += getY(data[j])
      }
      avgX /= avgRangeLen
      avgY /= avgRangeLen

      // Pick the point in the current bucket with the largest triangle area.
      const rangeStart = Math.floor(i * bucketSize) + 1
      const rangeEnd = Math.min(Math.floor((i + 1) * bucketSize) + 1, len)

      const pointAX = getX(data[a])
      const pointAY = getY(data[a])

      let maxArea = -1
      let maxAreaIdx = rangeStart

      for (let j = rangeStart; j < rangeEnd; j++) {
        const area =
          Math.abs(
            (pointAX - avgX) * (getY(data[j]) - pointAY) -
              (pointAX - getX(data[j])) * (avgY - pointAY),
          ) * 0.5
        if (area > maxArea) {
          maxArea = area
          maxAreaIdx = j
        }
      }

      sampled.push(data[maxAreaIdx])
      a = maxAreaIdx
    }

    // Always include the last point.
    sampled.push(data[len - 1])
    return sampled
  }

  /**
   * OHLC-aware bucket aggregation for candlestick / OHLC series.
   *
   * Each point's y is a 4-tuple `[open, high, low, close]`. LTTB is unusable
   * here — it treats y as a scalar, so the triangle-area math degenerates and
   * silently discards the high/low extremes that *define* a candle. Instead we
   * split the series into `targetPoints` contiguous buckets and roll each up
   * into a single candle: open = first bucket open, close = last bucket close,
   * high = max of highs, low = min of lows. The x is the first point's x in the
   * bucket. Output keeps the input's format ([{x,y}] or [[x,y]]).
   *
   * @param {any[]} data         - Raw OHLC series in [{x,y:[o,h,l,c]}] or [[x,[o,h,l,c]]] format.
   * @param {number} targetPoints - Desired output length (>= 1).
   * @returns {any[]} Aggregated array in the same format as the input.
   */
  static ohlcAggregate(data, targetPoints) {
    const len = data.length
    if (targetPoints >= len || targetPoints < 1) return data

    const isXY = !Array.isArray(data[0])
    const getX = isXY
      ? (/** @type {any} */ p) => p.x
      : (/** @type {any} */ p) => p[0]
    const getY = isXY
      ? (/** @type {any} */ p) => p.y
      : (/** @type {any} */ p) => p[1]
    const make = isXY
      ? (/** @type {any} */ x, /** @type {any} */ y) => ({ x, y })
      : (/** @type {any} */ x, /** @type {any} */ y) => [x, y]

    const out = []
    const bucketSize = len / targetPoints

    for (let i = 0; i < targetPoints; i++) {
      const start = Math.floor(i * bucketSize)
      // Last bucket absorbs any remainder so the final close is never dropped.
      const end =
        i === targetPoints - 1 ? len : Math.floor((i + 1) * bucketSize)
      if (end <= start) continue

      const firstY = getY(data[start])
      const open = firstY[0]
      let high = firstY[1]
      let low = firstY[2]
      let close = firstY[3]

      for (let j = start + 1; j < end; j++) {
        const y = getY(data[j])
        if (y[1] > high) high = y[1]
        if (y[2] < low) low = y[2]
        close = y[3]
      }

      out.push(make(getX(data[start]), [open, high, low, close]))
    }

    return out
  }

  /**
   * Bucket-aggregate 2-tuple range data (`y: [low, high]`, rangeArea/rangeBar)
   * into `targetPoints` points, the range analog of {@link ohlcAggregate}. Each
   * bucket emits `[min low, max high]` so the band's vertical extent is never
   * understated by downsampling (LTTB, built for scalar y, would drop these
   * extremes). Order-agnostic: the min/max scan both tuple slots, so it is
   * correct whether a point is stored `[low, high]` or `[high, low]`.
   *
   * Null bounds (e.g. an indicator's warm-up period) are ignored, not treated
   * as 0 — `Math.min(null, x)` would coerce to 0 and pin the band to the
   * baseline. A bucket with no finite bounds emits `[null, null]` so it renders
   * as a gap, matching the un-downsampled series.
   * @param {any[]} data
   * @param {number} targetPoints
   * @returns {any[]}
   */
  static rangeAggregate(data, targetPoints) {
    const len = data.length
    if (targetPoints >= len || targetPoints < 1) return data

    const isXY = !Array.isArray(data[0])
    const getX = isXY
      ? (/** @type {any} */ p) => p.x
      : (/** @type {any} */ p) => p[0]
    const getY = isXY
      ? (/** @type {any} */ p) => p.y
      : (/** @type {any} */ p) => p[1]
    const make = isXY
      ? (/** @type {any} */ x, /** @type {any} */ y) => ({ x, y })
      : (/** @type {any} */ x, /** @type {any} */ y) => [x, y]

    const out = []
    const bucketSize = len / targetPoints

    for (let i = 0; i < targetPoints; i++) {
      const start = Math.floor(i * bucketSize)
      const end =
        i === targetPoints - 1 ? len : Math.floor((i + 1) * bucketSize)
      if (end <= start) continue

      let low = Infinity
      let high = -Infinity
      for (let j = start; j < end; j++) {
        const y = getY(data[j])
        if (y == null) continue
        // Scan both slots independently so a single finite bound still counts
        // and tuple order does not matter.
        for (let k = 0; k < 2; k++) {
          const v = y[k]
          if (v == null || !isFinite(v)) continue
          if (v < low) low = v
          if (v > high) high = v
        }
      }

      out.push(
        make(getX(data[start]), low === Infinity ? [null, null] : [low, high]),
      )
    }

    return out
  }

  excludeCollapsedSeriesInYAxis() {
    const w = this.w
    // Post revision 3.46.0 there is no longer a strict one-to-one
    // correspondence between series and Y axes.
    // An axis can be ignored only while all series referenced by it
    // are collapsed.
    /** @type {any[]} */
    const yAxisIndexes = []
    /**
     * @param {any[]} yAxisArr
     * @param {number} yi
     */
    w.globals.seriesYAxisMap.forEach((yAxisArr, yi) => {
      let collapsedCount = 0
      /**
       * @param {number} seriesIndex
       */
      yAxisArr.forEach((seriesIndex) => {
        if (w.globals.collapsedSeriesIndices.indexOf(seriesIndex) !== -1) {
          collapsedCount++
        }
      })
      // It's possible to have a yaxis that doesn't reference any series yet,
      // eg, because there are no series' yet, so don't list it as ignored
      // prematurely.
      if (collapsedCount > 0 && collapsedCount == yAxisArr.length) {
        yAxisIndexes.push(yi)
      }
    })
    w.globals.ignoreYAxisIndexes = yAxisIndexes.map((x) => x)
  }
}
