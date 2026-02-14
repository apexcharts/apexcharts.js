import CoreUtils from './CoreUtils'
import DateTime from './../utils/DateTime'
import Series from './Series'
import Utils from '../utils/Utils'
import Defaults from './settings/Defaults'

export default class Data {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.twoDSeries = []
    this.threeDSeries = []
    this.twoDSeriesX = []
    this.seriesGoals = []
    this.coreUtils = new CoreUtils(this.ctx)
  }

  // Helper to get the first valid data point from the active series
  getFirstDataPoint() {
    const series = this.w.config.series
    const sr = new Series(this.ctx)
    this.activeSeriesIndex = sr.getActiveConfigSeriesIndex()

    if (
      series[this.activeSeriesIndex] &&
      series[this.activeSeriesIndex].data &&
      series[this.activeSeriesIndex].data.length > 0 &&
      series[this.activeSeriesIndex].data[0] !== null &&
      typeof series[this.activeSeriesIndex].data[0] !== 'undefined'
    ) {
      return series[this.activeSeriesIndex].data[0]
    }
    return null
  }

  isMultiFormat() {
    return this.isFormatXY() || this.isFormat2DArray()
  }

  // given format is [{x, y}, {x, y}]
  isFormatXY() {
    const firstDataPoint = this.getFirstDataPoint()
    return firstDataPoint && typeof firstDataPoint.x !== 'undefined'
  }

  // given format is [[x, y], [x, y]]
  isFormat2DArray() {
    const firstDataPoint = this.getFirstDataPoint()
    return firstDataPoint && Array.isArray(firstDataPoint)
  }

  handleFormat2DArray(ser, i) {
    const cnf = this.w.config
    const gl = this.w.globals
    const data = ser[i].data

    const isBoxPlot =
      cnf.chart.type === 'boxPlot' || cnf.series[i].type === 'boxPlot'

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
        gl.dataFormatXNumeric = true
      }
      if (cnf.xaxis.type === 'datetime') {
        // if timestamps are provided and xaxis type is datetime,
        let ts = new Date(x)
        ts = ts.getTime()
        this.twoDSeriesX.push(ts)
      } else {
        this.twoDSeriesX.push(x)
      }

      if (typeof z !== 'undefined') {
        this.threeDSeries.push(z)
        gl.isDataXYZ = true
      }
    }
  }

  handleFormatXY(ser, i) {
    const cnf = this.w.config
    const gl = this.w.globals
    const dt = new DateTime(this.ctx)
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
        gl.isDataXYZ = true
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
          const isRangeColumn = gl.isBarHorizontal && gl.isRangeData

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
              gl.isXNumeric = true
            }
          }
        } else {
          if (cnf.xaxis.type === 'datetime') {
            this.twoDSeriesX.push(dt.parseDate(x.toString()))
          } else {
            gl.dataFormatXNumeric = true
            gl.isXNumeric = true
            this.twoDSeriesX.push(parseFloat(x))
          }
        }
      } else if (isXArr) {
        // a multiline label described in array format
        this.fallbackToCategory = true
        this.twoDSeriesX.push(x)
      } else {
        // a numeric value in x property
        gl.isXNumeric = true
        gl.dataFormatXNumeric = true
        this.twoDSeriesX.push(x)
      }
    }
  }

  handleRangeData(ser, i) {
    const gl = this.w.globals

    let range = {}
    if (this.isFormat2DArray()) {
      range = this.handleRangeDataFormat('array', ser, i)
    } else if (this.isFormatXY()) {
      range = this.handleRangeDataFormat('xy', ser, i)
    }

    // Fix: RangeArea Chart: hide all series results in a crash #3984
    gl.seriesRangeStart[i] = range.start === undefined ? [] : range.start
    gl.seriesRangeEnd[i] = range.end === undefined ? [] : range.end

    gl.seriesRange[i] = range.rangeUniques

    // check for overlaps to avoid clashes in a timeline chart
    gl.seriesRange.forEach((sr) => {
      if (!sr) return

      sr.forEach((sarr) => {
        const yItems = sarr.y
        const len = yItems.length

        // Pre-check: if only one item, no overlaps possible
        if (len <= 1) return

        for (let arri = 0; arri < len; arri++) {
          const arr = yItems[arri]
          const range1y1 = arr.y1
          const range1y2 = arr.y2

          // Only check subsequent items to avoid duplicate comparisons
          for (let sri = arri + 1; sri < len; sri++) {
            const range2 = yItems[sri]
            const range2y1 = range2.y1
            const range2y2 = range2.y2

            // Check overlap using interval intersection
            if (range1y1 <= range2y2 && range2y1 <= range1y2) {
              // Use Set-like behavior to avoid duplicates
              if (sarr.overlaps.indexOf(arr.rangeName) < 0) {
                sarr.overlaps.push(arr.rangeName)
              }
              if (sarr.overlaps.indexOf(range2.rangeName) < 0) {
                sarr.overlaps.push(range2.rangeName)
              }
            }
          }
        }
      })
    })

    return range
  }

  handleCandleStickBoxData(ser, i) {
    const gl = this.w.globals

    let ohlc = {}
    if (this.isFormat2DArray()) {
      ohlc = this.handleCandleStickBoxDataFormat('array', ser, i)
    } else if (this.isFormatXY()) {
      ohlc = this.handleCandleStickBoxDataFormat('xy', ser, i)
    }

    gl.seriesCandleO[i] = ohlc.o
    gl.seriesCandleH[i] = ohlc.h
    gl.seriesCandleM[i] = ohlc.m
    gl.seriesCandleL[i] = ohlc.l
    gl.seriesCandleC[i] = ohlc.c

    return ohlc
  }

  handleRangeDataFormat(format, ser, i) {
    const rangeStart = []
    const rangeEnd = []

    const uniqueKeysMap = new Map()
    const uniqueKeys = []

    // unique keys map
    ser[i].data.forEach((item) => {
      if (!uniqueKeysMap.has(item.x)) {
        const keyObj = {
          x: item.x,
          overlaps: [],
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
        let isDataPoint2D = Array.isArray(ser[i].data[j].y)
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

  handleCandleStickBoxDataFormat(format, ser, i) {
    const w = this.w
    const isBoxPlot =
      w.config.chart.type === 'boxPlot' || w.config.series[i].type === 'boxPlot'

    const serO = []
    const serH = []
    const serM = []
    const serL = []
    const serC = []

    const data = ser[i].data
    let getVals

    if (format === 'array') {
      const isFlat =
        (isBoxPlot && data[0].length === 6) ||
        (!isBoxPlot && data[0].length === 5)
      if (isFlat) {
        getVals = (d) => d.slice(1)
      } else {
        getVals = (d) => (Array.isArray(d[1]) ? d[1] : [])
      }
    } else {
      // format === 'xy'
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
    }

    return {
      o: serO,
      h: serH,
      m: serM,
      l: serL,
      c: serC,
    }
  }

  parseDataAxisCharts(ser, ctx = this.ctx) {
    const cnf = this.w.config
    const gl = this.w.globals

    const dt = new DateTime(ctx)

    const xlabels =
      cnf.labels.length > 0 ? cnf.labels.slice() : cnf.xaxis.categories.slice()

    gl.isRangeBar = cnf.chart.type === 'rangeBar' && gl.isBarHorizontal

    gl.hasXaxisGroups =
      cnf.xaxis.type === 'category' && cnf.xaxis.group.groups.length > 0
    if (gl.hasXaxisGroups) {
      gl.groups = cnf.xaxis.group.groups
    }

    ser.forEach((s, i) => {
      if (s.name !== undefined) {
        gl.seriesNames.push(s.name)
      } else {
        gl.seriesNames.push('series-' + parseInt(i + 1, 10))
      }
    })

    this.coreUtils.setSeriesYAxisMappings()
    // At this point, every series that didn't have a user defined group name
    // has been given a name according to the yaxis the series is referenced by.
    // This fits the existing behaviour where all series associated with an axis
    // are defacto presented as a single group. It is now formalised.
    let buckets = []
    let groups = [...new Set(cnf.series.map((s) => s.group))]
    cnf.series.forEach((s, i) => {
      let index = groups.indexOf(s.group)
      if (!buckets[index]) buckets[index] = []

      buckets[index].push(gl.seriesNames[i])
    })
    gl.seriesGroups = buckets

    const handleDates = () => {
      for (let j = 0; j < xlabels.length; j++) {
        if (typeof xlabels[j] === 'string') {
          // user provided date strings
          let isDate = dt.isValidDate(xlabels[j])
          if (isDate) {
            this.twoDSeriesX.push(dt.parseDate(xlabels[j]))
          } else {
            throw new Error(
              'You have provided invalid Date format. Please provide a valid JavaScript Date'
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
          "It is a possibility that you may have not included 'data' property in series."
        )
        return
      }

      if (
        cnf.chart.type === 'rangeBar' ||
        cnf.chart.type === 'rangeArea' ||
        ser[i].type === 'rangeBar' ||
        ser[i].type === 'rangeArea'
      ) {
        gl.isRangeData = true
        this.handleRangeData(ser, i)
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

        gl.series.push(this.twoDSeries)
        gl.labels.push(this.twoDSeriesX)
        gl.seriesX.push(this.twoDSeriesX)
        gl.seriesGoals = this.seriesGoals

        if (i === this.activeSeriesIndex && !this.fallbackToCategory) {
          gl.isXNumeric = true
        }
      } else {
        if (cnf.xaxis.type === 'datetime') {
          // user didn't supplied [{x,y}] or [[x,y]], but single array in data.
          // Also labels/categories were supplied differently
          gl.isXNumeric = true

          handleDates()

          gl.seriesX.push(this.twoDSeriesX)
        } else if (cnf.xaxis.type === 'numeric') {
          gl.isXNumeric = true

          if (xlabels.length > 0) {
            this.twoDSeriesX = xlabels
            gl.seriesX.push(this.twoDSeriesX)
          }
        }
        gl.labels.push(this.twoDSeriesX)
        const singleArray = ser[i].data.map((d) => Utils.parseNumber(d))
        gl.series.push(singleArray)
      }

      gl.seriesZ.push(this.threeDSeries)

      // overrided default color if user inputs color with series data
      if (ser[i].color !== undefined) {
        gl.seriesColors.push(ser[i].color)
      } else {
        gl.seriesColors.push(undefined)
      }
    }

    return this.w
  }

  parseDataNonAxisCharts(ser) {
    const gl = this.w.globals
    const cnf = this.w.config

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
          (s && typeof s === 'object' && s.parsing)
      )

    if (hasOldFormat && hasNewFormat) {
      console.warn(
        'ApexCharts: Both old format (numeric series + labels) and new format (series objects with data/parsing) detected. Using old format for backward compatibility.'
      )
    }

    // If old format exists, use it (backward compatibility priority)
    if (hasOldFormat) {
      gl.series = ser.slice()
      gl.seriesNames = cnf.labels.slice()
      for (let i = 0; i < gl.series.length; i++) {
        if (gl.seriesNames[i] === undefined) {
          gl.seriesNames.push('series-' + (i + 1))
        }
      }
      return this.w
    }

    // Check if it's just a plain numeric array without labels (radialBar common case)
    if (Array.isArray(ser) && ser.every((s) => typeof s === 'number')) {
      gl.series = ser.slice()
      gl.seriesNames = []
      for (let i = 0; i < gl.series.length; i++) {
        gl.seriesNames.push(cnf.labels[i] || `series-${i + 1}`)
      }
      return this.w
    }

    const processedData = this.extractPieDataFromSeries(ser)

    gl.series = processedData.values
    gl.seriesNames = processedData.labels

    // Special handling for radialBar - ensure percentages are valid
    if (cnf.chart.type === 'radialBar') {
      gl.series = gl.series.map((val) => {
        const numVal = Utils.parseNumber(val)
        if (numVal > 100) {
          console.warn(
            `ApexCharts: RadialBar value ${numVal} > 100, consider using percentage values (0-100)`
          )
        }
        return numVal
      })
    }

    // Ensure we have proper fallback names
    for (let i = 0; i < gl.series.length; i++) {
      if (gl.seriesNames[i] === undefined) {
        gl.seriesNames.push('series-' + (i + 1))
      }
    }

    return this.w
  }

  /**
   * Reset parsing flags to allow re-parsing of data during updates
   */
  resetParsingFlags() {
    const w = this.w
    w.globals.dataWasParsed = false
    w.globals.originalSeries = null

    if (w.config.series) {
      w.config.series.forEach((serie) => {
        if (serie.__apexParsed) {
          delete serie.__apexParsed
        }
      })
    }
  }

  extractPieDataFromSeries(ser) {
    const values = []
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
        'ApexCharts: Unsupported series format for pie/donut/radialBar. Expected series objects with data property.'
      )
      return { values: [], labels: [] }
    }

    return { values, labels }
  }

  // Extract data from series objects: [{ data: [...], parsing: {...} }]
  extractPieDataFromSeriesObjects(seriesArray, values, labels) {
    seriesArray.forEach((serie, serieIndex) => {
      if (!serie.data || !Array.isArray(serie.data)) {
        console.warn(`ApexCharts: Series ${serieIndex} has no valid data array`)
        return
      }

      // If series was already parsed by parseRawDataIfNeeded, data should be in {x, y} format
      serie.data.forEach((dataPoint) => {
        if (typeof dataPoint === 'object' && dataPoint !== null) {
          if (dataPoint.x !== undefined && dataPoint.y !== undefined) {
            labels.push(String(dataPoint.x))
            values.push(Utils.parseNumber(dataPoint.y))
          } else {
            console.warn(
              'ApexCharts: Invalid data point format for pie chart. Expected {x, y} format:',
              dataPoint
            )
          }
        } else {
          console.warn(
            'ApexCharts: Expected object data point, got:',
            typeof dataPoint
          )
        }
      })
    })
  }

  /** User possibly set string categories in xaxis.categories or labels prop
   * Or didn't set xaxis labels at all - in which case we manually do it.
   * If user passed series data as [[3, 2], [4, 5]] or [{ x: 3, y: 55 }],
   * this shouldn't be called
   * @param {array} ser - the series which user passed to the config
   */
  handleExternalLabelsData(ser) {
    const cnf = this.w.config
    const gl = this.w.globals

    if (cnf.xaxis.categories.length > 0) {
      // user provided labels in xaxis.category prop
      gl.labels = cnf.xaxis.categories
    } else if (cnf.labels.length > 0) {
      // user provided labels in labels props
      gl.labels = cnf.labels.slice()
    } else if (this.fallbackToCategory) {
      // user provided labels in x prop in [{ x: 3, y: 55 }] data, and those labels are already stored in gl.labels[0], so just re-arrange the gl.labels array
      gl.labels = gl.labels[0]

      if (gl.seriesRange.length) {
        gl.seriesRange.map((srt) => {
          srt.forEach((sr) => {
            if (gl.labels.indexOf(sr.x) < 0 && sr.x) {
              gl.labels.push(sr.x)
            }
          })
        })
        // remove duplicate x-axis labels
        gl.labels = Array.from(
          new Set(gl.labels.map(JSON.stringify)),
          JSON.parse
        )
      }

      if (cnf.xaxis.convertedCatToNumeric) {
        const defaults = new Defaults(cnf)
        defaults.convertCatToNumericXaxis(cnf, this.ctx, gl.seriesX[0])
        this._generateExternalLabels(ser)
      }
    } else {
      this._generateExternalLabels(ser)
    }
  }

  _generateExternalLabels(ser) {
    const gl = this.w.globals
    const cnf = this.w.config
    // user didn't provided any labels, fallback to 1-2-3-4-5
    let labelArr = []

    if (gl.axisCharts) {
      if (gl.series.length > 0) {
        if (this.isFormatXY()) {
          // in case there is a combo chart (boxplot/scatter)
          // and there are duplicated x values, we need to eliminate duplicates
          const seriesDataFiltered = cnf.series.map((serie) => {
            return serie.data.filter(
              (v, i, a) => a.findIndex((t) => t.x === v.x) === i
            )
          })

          const len = seriesDataFiltered.reduce(
            (p, c, i, a) => (a[p].length > c.length ? p : i),
            0
          )

          for (let i = 0; i < seriesDataFiltered[len].length; i++) {
            labelArr.push(i + 1)
          }
        } else {
          for (let i = 0; i < gl.series[gl.maxValsInArrayIndex].length; i++) {
            labelArr.push(i + 1)
          }
        }
      }

      gl.seriesX = []
      // create gl.seriesX as it will be used in calculations of x positions
      for (let i = 0; i < ser.length; i++) {
        gl.seriesX.push(labelArr)
      }

      // turn on the isXNumeric flag to allow minX and maxX to function properly
      if (!this.w.globals.isBarHorizontal) {
        gl.isXNumeric = true
      }
    }

    // no series to pull labels from, put a 0-10 series
    // possibly, user collapsed all series. Hence we can't work with above calc
    if (labelArr.length === 0) {
      labelArr = gl.axisCharts
        ? []
        : gl.series.map((gls, glsi) => {
            return glsi + 1
          })
      for (let i = 0; i < ser.length; i++) {
        gl.seriesX.push(labelArr)
      }
    }

    // Finally, pass the labelArr in gl.labels which will be printed on x-axis
    gl.labels = labelArr

    if (cnf.xaxis.convertedCatToNumeric) {
      gl.categoryLabels = labelArr.map((l) => {
        return cnf.xaxis.labels.formatter(l)
      })
    }

    // Turn on this global flag to indicate no labels were provided by user
    gl.noLabelsProvided = true
  }

  parseRawDataIfNeeded(series) {
    const cnf = this.w.config
    const gl = this.w.globals
    const globalParsing = cnf.parsing

    // If data was already parsed, don't parse again
    if (gl.dataWasParsed) {
      return series
    }

    // If no global parsing config and no series-level parsing, return as-is
    if (!globalParsing && !series.some((s) => s.parsing)) {
      return series
    }

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
          `ApexCharts: Series ${index} has parsing config but missing x or y field specification`
        )
        return serie
      }

      // Transform raw data to {x, y} format
      const transformedData = serie.data.map((item, itemIndex) => {
        if (typeof item !== 'object' || item === null) {
          console.warn(
            `ApexCharts: Series ${index}, data point ${itemIndex} is not an object, skipping parsing`
          )
          return item
        }

        const x = this.getNestedValue(item, effectiveParsing.x)

        let y
        let z = undefined
        if (Array.isArray(effectiveParsing.y)) {
          const yValues = effectiveParsing.y.map((fieldName) =>
            this.getNestedValue(item, fieldName)
          )

          if (this.w.config.chart.type === 'bubble' && yValues.length === 2) {
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
            `ApexCharts: Series ${index}, data point ${itemIndex} missing field '${effectiveParsing.x}'`
          )
        }

        if (y === undefined) {
          console.warn(
            `ApexCharts: Series ${index}, data point ${itemIndex} missing field '${effectiveParsing.y}'`
          )
        }

        const result = { x, y }

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
      })

      return {
        ...serie,
        data: transformedData,
        __apexParsed: true,
      }
    })

    // Mark that data was parsed
    gl.dataWasParsed = true

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
      return obj[path]
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
      current = current[keys[i]]
    }

    return current
  }

  // Segregate user provided data into appropriate vars
  parseData(ser) {
    let w = this.w
    let cnf = w.config
    let gl = w.globals

    ser = this.parseRawDataIfNeeded(ser)

    cnf.series = ser
    gl.initialSeries = Utils.clone(ser)

    this.excludeCollapsedSeriesInYAxis()

    // If we detected string in X prop of series, we fallback to category x-axis
    this.fallbackToCategory = false

    this.ctx.core.resetGlobals()
    this.ctx.core.isMultipleY()

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
      const series = new Series(this.ctx)
      gl.series = series.setNullSeriesToZeroValues(gl.series)
    }

    this.coreUtils.getSeriesTotals()
    if (gl.axisCharts) {
      gl.stackedSeriesTotals = this.coreUtils.getStackedSeriesTotals()
      gl.stackedSeriesTotalsByGroups =
        this.coreUtils.getStackedSeriesTotalsByGroups()
    }

    this.coreUtils.getPercentSeries()

    if (
      !gl.dataFormatXNumeric &&
      (!gl.isXNumeric ||
        (cnf.xaxis.type === 'numeric' &&
          cnf.labels.length === 0 &&
          cnf.xaxis.categories.length === 0))
    ) {
      // x-axis labels couldn't be detected; hence try searching every option in config
      this.handleExternalLabelsData(ser)
    }

    // check for multiline xaxis
    const catLabels = this.coreUtils.getCategoryLabels(gl.labels)
    for (let l = 0; l < catLabels.length; l++) {
      if (Array.isArray(catLabels[l])) {
        gl.isMultiLineX = true
        break
      }
    }
  }

  excludeCollapsedSeriesInYAxis() {
    const w = this.w
    // Post revision 3.46.0 there is no longer a strict one-to-one
    // correspondence between series and Y axes.
    // An axis can be ignored only while all series referenced by it
    // are collapsed.
    let yAxisIndexes = []
    w.globals.seriesYAxisMap.forEach((yAxisArr, yi) => {
      let collapsedCount = 0
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
