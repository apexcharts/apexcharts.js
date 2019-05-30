import Bar from '../charts/Bar'
import BarStacked from '../charts/BarStacked'
import CandleStick from '../charts/CandleStick'
import CoreUtils from './CoreUtils'
import Crosshairs from './Crosshairs'
import DateTime from './../utils/DateTime'
import HeatMap from '../charts/HeatMap'
import Pie from '../charts/Pie'
import Radar from '../charts/Radar'
import Radial from '../charts/Radial'
import RangeBar from '../charts/RangeBar'
import Line from '../charts/Line'
import Graphics from './Graphics'
import XAxis from './axes/XAxis'
import YAxis from './axes/YAxis'
import Range from './Range'
import Utils from '../utils/Utils'
import Scales from './Scales'
import Series from './Series'
import TimeScale from './TimeScale'

/**
 * ApexCharts Core Class responsible for major calculations and creating elements.
 *
 * @module Core
 **/

export default class Core {
  constructor(el, ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.el = el

    this.coreUtils = new CoreUtils(this.ctx)

    this.twoDSeries = []
    this.threeDSeries = []
    this.twoDSeriesX = []
  }

  // get data and store into appropriate vars

  setupElements() {
    let gl = this.w.globals
    let cnf = this.w.config

    // const graphics = new Graphics(this.ctx)

    let ct = cnf.chart.type
    let axisChartsArrTypes = [
      'line',
      'area',
      'bar',
      'rangeBar',
      // 'rangeArea',
      'candlestick',
      'radar',
      'scatter',
      'bubble',
      'heatmap'
    ]

    let xyChartsArrTypes = [
      'line',
      'area',
      'bar',
      'rangeBar',
      // 'rangeArea',
      'candlestick',
      'scatter',
      'bubble'
    ]

    gl.axisCharts = axisChartsArrTypes.indexOf(ct) > -1

    gl.xyCharts = xyChartsArrTypes.indexOf(ct) > -1

    gl.isBarHorizontal =
      (cnf.chart.type === 'bar' || cnf.chart.type === 'rangeBar') &&
      cnf.plotOptions.bar.horizontal

    gl.chartClass = '.apexcharts' + gl.cuid

    gl.dom.baseEl = this.el

    gl.dom.elWrap = document.createElement('div')
    Graphics.setAttrs(gl.dom.elWrap, {
      id: gl.chartClass.substring(1),
      class: 'apexcharts-canvas ' + gl.chartClass.substring(1)
    })
    this.el.appendChild(gl.dom.elWrap)

    gl.dom.Paper = new window.SVG.Doc(gl.dom.elWrap)
    gl.dom.Paper.attr({
      class: 'apexcharts-svg',
      'xmlns:data': 'ApexChartsNS',
      transform: `translate(${cnf.chart.offsetX}, ${cnf.chart.offsetY})`
    })

    gl.dom.Paper.node.style.background = cnf.chart.background

    this.setSVGDimensions()

    gl.dom.elGraphical = gl.dom.Paper.group().attr({
      class: 'apexcharts-inner apexcharts-graphical'
    })

    gl.dom.elDefs = gl.dom.Paper.defs()

    gl.dom.elLegendWrap = document.createElement('div')
    gl.dom.elLegendWrap.classList.add('apexcharts-legend')
    gl.dom.elWrap.appendChild(gl.dom.elLegendWrap)

    // gl.dom.Paper.add(gl.dom.elLegendWrap)
    gl.dom.Paper.add(gl.dom.elGraphical)
    gl.dom.elGraphical.add(gl.dom.elDefs)
  }

  plotChartType(ser, xyRatios) {
    const w = this.w
    const cnf = w.config
    const gl = w.globals

    let lineSeries = {
      series: [],
      i: []
    }
    let areaSeries = {
      series: [],
      i: []
    }
    let scatterSeries = {
      series: [],
      i: []
    }

    let bubbleSeries = {
      series: [],
      i: []
    }

    let columnSeries = {
      series: [],
      i: []
    }

    let candlestickSeries = {
      series: [],
      i: []
    }

    gl.series.map((series, st) => {
      // if user has specified a particular type for particular series
      if (typeof ser[st].type !== 'undefined') {
        if (ser[st].type === 'column' || ser[st].type === 'bar') {
          w.config.plotOptions.bar.horizontal = false // horizontal bars not supported in mixed charts, hence forcefully set to false
          columnSeries.series.push(series)
          columnSeries.i.push(st)
        } else if (ser[st].type === 'area') {
          areaSeries.series.push(series)
          areaSeries.i.push(st)
        } else if (ser[st].type === 'line') {
          lineSeries.series.push(series)
          lineSeries.i.push(st)
        } else if (ser[st].type === 'scatter') {
          scatterSeries.series.push(series)
          scatterSeries.i.push(st)
        } else if (ser[st].type === 'bubble') {
          bubbleSeries.series.push(series)
          bubbleSeries.i.push(st)
        } else if (ser[st].type === 'candlestick') {
          candlestickSeries.series.push(series)
          candlestickSeries.i.push(st)
        } else {
          // user has specified type, but it is not valid (other than line/area/column)
          console.warn(
            'You have specified an unrecognized chart type. Available types for this propery are line/area/column/bar/scatter/bubble'
          )
        }
        gl.comboCharts = true
      } else {
        lineSeries.series.push(series)
        lineSeries.i.push(st)
      }
    })

    let line = new Line(this.ctx, xyRatios)
    let candlestick = new CandleStick(this.ctx, xyRatios)
    let pie = new Pie(this.ctx)
    let radialBar = new Radial(this.ctx)
    let rangeBar = new RangeBar(this.ctx, xyRatios)
    let radar = new Radar(this.ctx)
    let elGraph = []

    if (gl.comboCharts) {
      if (areaSeries.series.length > 0) {
        elGraph.push(line.draw(areaSeries.series, 'area', areaSeries.i))
      }
      if (columnSeries.series.length > 0) {
        if (w.config.chart.stacked) {
          let barStacked = new BarStacked(this.ctx, xyRatios)
          elGraph.push(barStacked.draw(columnSeries.series, columnSeries.i))
        } else {
          let bar = new Bar(this.ctx, xyRatios)
          elGraph.push(bar.draw(columnSeries.series, columnSeries.i))
        }
      }
      if (lineSeries.series.length > 0) {
        elGraph.push(line.draw(lineSeries.series, 'line', lineSeries.i))
      }
      if (candlestickSeries.series.length > 0) {
        elGraph.push(
          candlestick.draw(candlestickSeries.series, candlestickSeries.i)
        )
      }
      if (scatterSeries.series.length > 0) {
        const scatterLine = new Line(this.ctx, xyRatios, true)
        elGraph.push(
          scatterLine.draw(scatterSeries.series, 'scatter', scatterSeries.i)
        )
      }
      // TODO: allow bubble series in a combo chart
      // if (bubbleSeries.series.length > 0) {
      //   const bubbleLine = new Line(this.ctx, xyRatios, true)
      //   elGraph.push(
      //     bubbleLine.draw(bubbleSeries.series, 'bubble', bubbleSeries.i)
      //   )
      // }
    } else {
      switch (cnf.chart.type) {
        case 'line':
          elGraph = line.draw(gl.series, 'line')
          break
        case 'area':
          elGraph = line.draw(gl.series, 'area')
          break
        case 'bar':
          if (cnf.chart.stacked) {
            let barStacked = new BarStacked(this.ctx, xyRatios)
            elGraph = barStacked.draw(gl.series)
          } else {
            let bar = new Bar(this.ctx, xyRatios)
            elGraph = bar.draw(gl.series)
          }
          break
        case 'candlestick':
          let candleStick = new CandleStick(this.ctx, xyRatios)
          elGraph = candleStick.draw(gl.series)
          break
        case 'rangeBar':
          elGraph = rangeBar.draw(gl.series)
          break
        case 'heatmap':
          let heatmap = new HeatMap(this.ctx, xyRatios)
          elGraph = heatmap.draw(gl.series)
          break
        case 'pie':
        case 'donut':
          elGraph = pie.draw(gl.series)
          break
        case 'radialBar':
          elGraph = radialBar.draw(gl.series)
          break
        case 'radar':
          elGraph = radar.draw(gl.series)
          break
        default:
          elGraph = line.draw(gl.series)
      }
    }

    return elGraph
  }

  setSVGDimensions() {
    let gl = this.w.globals
    let cnf = this.w.config

    gl.svgWidth = cnf.chart.width
    gl.svgHeight = cnf.chart.height

    let elDim = Utils.getDimensions(this.el)

    let widthUnit = cnf.chart.width
      .toString()
      .split(/[0-9]+/g)
      .pop()

    if (widthUnit === '%') {
      if (Utils.isNumber(elDim[0])) {
        if (elDim[0].width === 0) {
          elDim = Utils.getDimensions(this.el.parentNode)
        }

        gl.svgWidth = (elDim[0] * parseInt(cnf.chart.width)) / 100
      }
    } else if (widthUnit === 'px' || widthUnit === '') {
      gl.svgWidth = parseInt(cnf.chart.width)
    }

    if (gl.svgHeight !== 'auto' && gl.svgHeight !== '') {
      let heightUnit = cnf.chart.height
        .toString()
        .split(/[0-9]+/g)
        .pop()
      if (heightUnit === '%') {
        let elParentDim = Utils.getDimensions(this.el.parentNode)
        gl.svgHeight = (elParentDim[1] * parseInt(cnf.chart.height)) / 100
      } else {
        gl.svgHeight = parseInt(cnf.chart.height)
      }
    } else {
      if (gl.axisCharts) {
        gl.svgHeight = gl.svgWidth / 1.61
      } else {
        gl.svgHeight = gl.svgWidth
      }
    }

    Graphics.setAttrs(gl.dom.Paper.node, {
      width: gl.svgWidth,
      height: gl.svgHeight
    })

    // gl.dom.Paper.node.parentNode.parentNode.style.minWidth = gl.svgWidth + "px";
    let offsetY = cnf.chart.sparkline.enabled
      ? 0
      : gl.axisCharts
      ? cnf.chart.parentHeightOffset
      : 0

    gl.dom.Paper.node.parentNode.parentNode.style.minHeight =
      gl.svgHeight + offsetY + 'px'

    gl.dom.elWrap.style.width = gl.svgWidth + 'px'
    gl.dom.elWrap.style.height = gl.svgHeight + 'px'
  }

  shiftGraphPosition() {
    let gl = this.w.globals

    let tY = gl.translateY
    let tX = gl.translateX

    let scalingAttrs = {
      transform: 'translate(' + tX + ', ' + tY + ')'
    }
    Graphics.setAttrs(gl.dom.elGraphical.node, scalingAttrs)
  }

  /*
   ** All the calculations for setting range in charts will be done here
   */
  coreCalculations() {
    const range = new Range(this.ctx)
    range.init()
  }

  resetGlobals() {
    let gl = this.w.globals
    gl.series = []
    gl.seriesCandleO = []
    gl.seriesCandleH = []
    gl.seriesCandleL = []
    gl.seriesCandleC = []
    gl.seriesRangeStart = []
    gl.seriesRangeEnd = []
    gl.seriesPercent = []
    gl.seriesX = []
    gl.seriesZ = []
    gl.seriesNames = []
    gl.seriesTotals = []
    gl.stackedSeriesTotals = []
    gl.labels = []
    gl.timelineLabels = []
    gl.noLabelsProvided = false
    gl.timescaleTicks = []
    gl.resizeTimer = null
    gl.selectionResizeTimer = null
    gl.seriesXvalues = (() => {
      return this.w.config.series.map((s) => {
        return []
      })
    })()
    gl.seriesYvalues = (() => {
      return this.w.config.series.map((s) => {
        return []
      })
    })()
    gl.delayedElements = []
    gl.pointsArray = []
    gl.dataLabelsRects = []
    gl.isXNumeric = false
    gl.isDataXYZ = false
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE
    gl.minYArr = []
    gl.maxYArr = []
    gl.maxX = -Number.MAX_VALUE
    gl.minX = Number.MAX_VALUE
    gl.initialmaxX = -Number.MAX_VALUE
    gl.initialminX = Number.MAX_VALUE
    gl.maxDate = 0
    gl.minDate = Number.MAX_VALUE
    gl.minZ = Number.MAX_VALUE
    gl.maxZ = -Number.MAX_VALUE
    gl.minXDiff = Number.MAX_VALUE
    gl.yAxisScale = []
    gl.xAxisScale = null
    gl.xAxisTicksPositions = []
    gl.yLabelsCoords = []
    gl.yTitleCoords = []
    gl.xRange = 0
    gl.yRange = []
    gl.zRange = 0
    gl.dataPoints = 0
  }

  isMultipleY() {
    // user has supplied an array in yaxis property. So, turn on multipleYAxis flag
    if (
      this.w.config.yaxis.constructor === Array &&
      this.w.config.yaxis.length > 1
    ) {
      // first, turn off stacking if multiple y axis
      this.w.config.chart.stacked = false
      this.w.globals.isMultipleYAxis = true
      return true
    }
  }

  excludeCollapsedSeriesInYAxis() {
    const w = this.w
    w.globals.ignoreYAxisIndexes = w.globals.collapsedSeries.map(
      (collapsed, i) => {
        if (this.w.globals.isMultipleYAxis) {
          return collapsed.index
        }
      }
    )
  }

  isMultiFormat() {
    return this.isFormatXY() || this.isFormat2DArray()
  }

  // given format is [{x, y}, {x, y}]
  isFormatXY() {
    const series = this.w.config.series.slice()

    const sr = new Series(this.ctx)
    this.activeSeriesIndex = sr.getActiveConfigSeriesIndex()

    if (
      typeof series[this.activeSeriesIndex].data !== 'undefined' &&
      series[this.activeSeriesIndex].data.length > 0 &&
      series[this.activeSeriesIndex].data[0] !== null &&
      typeof series[this.activeSeriesIndex].data[0].x !== 'undefined' &&
      series[this.activeSeriesIndex].data[0] !== null
    ) {
      return true
    }
  }

  // given format is [[x, y], [x, y]]
  isFormat2DArray() {
    const series = this.w.config.series.slice()

    const sr = new Series(this.ctx)
    this.activeSeriesIndex = sr.getActiveConfigSeriesIndex()

    if (
      typeof series[this.activeSeriesIndex].data !== 'undefined' &&
      series[this.activeSeriesIndex].data.length > 0 &&
      typeof series[this.activeSeriesIndex].data[0] !== 'undefined' &&
      series[this.activeSeriesIndex].data[0] !== null &&
      series[this.activeSeriesIndex].data[0].constructor === Array
    ) {
      return true
    }
  }

  handleFormat2DArray(ser, i) {
    const cnf = this.w.config
    const gl = this.w.globals

    for (let j = 0; j < ser[i].data.length; j++) {
      if (typeof ser[i].data[j][1] !== 'undefined') {
        if (
          Array.isArray(ser[i].data[j][1]) &&
          ser[i].data[j][1].length === 4
        ) {
          this.twoDSeries.push(Utils.parseNumber(ser[i].data[j][1][3]))
        } else {
          this.twoDSeries.push(Utils.parseNumber(ser[i].data[j][1]))
        }
        gl.dataFormatXNumeric = true
      }
      if (cnf.xaxis.type === 'datetime') {
        // if timestamps are provided and xaxis type is datettime,

        let ts = new Date(ser[i].data[j][0])
        ts = new Date(ts).getTime()
        this.twoDSeriesX.push(ts)
      } else {
        this.twoDSeriesX.push(ser[i].data[j][0])
      }
    }

    for (let j = 0; j < ser[i].data.length; j++) {
      if (typeof ser[i].data[j][2] !== 'undefined') {
        this.threeDSeries.push(ser[i].data[j][2])
        gl.isDataXYZ = true
      }
    }
  }

  handleFormatXY(ser, i) {
    const cnf = this.w.config
    const gl = this.w.globals

    const dt = new DateTime(this.ctx)

    let activeI = i
    if (gl.collapsedSeriesIndices.indexOf(i) > -1) {
      // fix #368
      activeI = this.activeSeriesIndex
    }

    // get series
    for (let j = 0; j < ser[i].data.length; j++) {
      if (typeof ser[i].data[j].y !== 'undefined') {
        if (Array.isArray(ser[i].data[j].y)) {
          this.twoDSeries.push(
            Utils.parseNumber(ser[i].data[j].y[ser[i].data[j].y.length - 1])
          )
        } else {
          this.twoDSeries.push(Utils.parseNumber(ser[i].data[j].y))
        }
      }
    }

    // get seriesX
    for (let j = 0; j < ser[activeI].data.length; j++) {
      const isXString = typeof ser[activeI].data[j].x === 'string'
      const isXDate = !!dt.isValidDate(ser[activeI].data[j].x.toString())

      if (isXString || isXDate) {
        // user supplied '01/01/2017' or a date string (a JS date object is not supported)
        if (isXString) {
          if (cnf.xaxis.type === 'datetime' && !gl.isRangeData) {
            this.twoDSeriesX.push(dt.parseDate(ser[activeI].data[j].x))
          } else {
            // a category and not a numeric x value
            this.fallbackToCategory = true
            this.twoDSeriesX.push(ser[activeI].data[j].x)
          }
        } else {
          if (cnf.xaxis.type === 'datetime') {
            this.twoDSeriesX.push(
              dt.parseDate(ser[activeI].data[j].x.toString())
            )
          } else {
            gl.dataFormatXNumeric = true
            gl.isXNumeric = true
            this.twoDSeriesX.push(parseFloat(ser[activeI].data[j].x))
          }
        }
      } else {
        // a numeric value in x property
        gl.isXNumeric = true
        gl.dataFormatXNumeric = true
        this.twoDSeriesX.push(ser[activeI].data[j].x)
      }
    }

    if (ser[i].data[0] && typeof ser[i].data[0].z !== 'undefined') {
      for (let t = 0; t < ser[i].data.length; t++) {
        this.threeDSeries.push(ser[i].data[t].z)
      }
      gl.isDataXYZ = true
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

    gl.seriesRangeStart.push(range.start)
    gl.seriesRangeEnd.push(range.end)

    return range
  }

  handleCandleStickData(ser, i) {
    const gl = this.w.globals

    let ohlc = {}
    if (this.isFormat2DArray()) {
      ohlc = this.handleCandleStickDataFormat('array', ser, i)
    } else if (this.isFormatXY()) {
      ohlc = this.handleCandleStickDataFormat('xy', ser, i)
    }

    gl.seriesCandleO.push(ohlc.o)
    gl.seriesCandleH.push(ohlc.h)
    gl.seriesCandleL.push(ohlc.l)
    gl.seriesCandleC.push(ohlc.c)

    return ohlc
  }

  handleRangeDataFormat(format, ser, i) {
    const rangeStart = []
    const rangeEnd = []

    const err =
      'Please provide [Start, End] values in valid format. Read more https://apexcharts.com/docs/series/#rangecharts'

    const serObj = new Series(this.ctx)
    const activeIndex = serObj.getActiveConfigSeriesIndex()
    if (format === 'array') {
      if (ser[activeIndex].data[0][1].length !== 2) {
        throw new Error(err)
      }
      for (let j = 0; j < ser[i].data.length; j++) {
        rangeStart.push(ser[i].data[j][1][0])
        rangeEnd.push(ser[i].data[j][1][1])
      }
    } else if (format === 'xy') {
      if (ser[activeIndex].data[0].y.length !== 2) {
        throw new Error(err)
      }
      for (let j = 0; j < ser[i].data.length; j++) {
        rangeStart.push(ser[i].data[j].y[0])
        rangeEnd.push(ser[i].data[j].y[1])
      }
    }

    return {
      start: rangeStart,
      end: rangeEnd
    }
  }

  handleCandleStickDataFormat(format, ser, i) {
    const serO = []
    const serH = []
    const serL = []
    const serC = []

    const err =
      'Please provide [Open, High, Low and Close] values in valid format. Read more https://apexcharts.com/docs/series/#candlestick'

    if (format === 'array') {
      if (ser[i].data[0][1].length !== 4) {
        throw new Error(err)
      }
      for (let j = 0; j < ser[i].data.length; j++) {
        serO.push(ser[i].data[j][1][0])
        serH.push(ser[i].data[j][1][1])
        serL.push(ser[i].data[j][1][2])
        serC.push(ser[i].data[j][1][3])
      }
    } else if (format === 'xy') {
      if (ser[i].data[0].y.length !== 4) {
        throw new Error(err)
      }
      for (let j = 0; j < ser[i].data.length; j++) {
        serO.push(ser[i].data[j].y[0])
        serH.push(ser[i].data[j].y[1])
        serL.push(ser[i].data[j].y[2])
        serC.push(ser[i].data[j].y[3])
      }
    }

    return {
      o: serO,
      h: serH,
      l: serL,
      c: serC
    }
  }

  parseDataAxisCharts(ser, ctx = this.ctx) {
    const cnf = this.w.config
    const gl = this.w.globals

    const dt = new DateTime(ctx)

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

        if (cnf.chart.type === 'candlestick' || ser[i].type === 'candlestick') {
          this.handleCandleStickData(ser, i)
        }

        gl.series.push(this.twoDSeries)
        gl.labels.push(this.twoDSeriesX)
        gl.seriesX.push(this.twoDSeriesX)

        if (!this.fallbackToCategory) {
          gl.isXNumeric = true
        }
      } else {
        if (cnf.xaxis.type === 'datetime') {
          // user didn't supplied [{x,y}] or [[x,y]], but single array in data.
          // Also labels/categories were supplied differently
          gl.isXNumeric = true
          const dates =
            cnf.labels.length > 0
              ? cnf.labels.slice()
              : cnf.xaxis.categories.slice()

          for (let j = 0; j < dates.length; j++) {
            if (typeof dates[j] === 'string') {
              // user provided date strings
              let isDate = dt.isValidDate(dates[j])
              if (isDate) {
                this.twoDSeriesX.push(dt.parseDate(dates[j]))
              } else {
                throw new Error(
                  'You have provided invalid Date format. Please provide a valid JavaScript Date'
                )
              }
            } else {
              // user provided timestamps
              if (String(dates[j]).length !== 13) {
                throw new Error('Please provide a valid JavaScript timestamp')
              } else {
                this.twoDSeriesX.push(dates[j])
              }
            }
          }

          gl.seriesX.push(this.twoDSeriesX)
        } else if (cnf.xaxis.type === 'numeric') {
          gl.isXNumeric = true
          let x =
            cnf.labels.length > 0
              ? cnf.labels.slice()
              : cnf.xaxis.categories.slice()

          if (x.length > 0) {
            this.twoDSeriesX = x
            gl.seriesX.push(this.twoDSeriesX)
          }
        }
        gl.labels.push(this.twoDSeriesX)
        const singleArray = ser[i].data.map((d) => {
          return Utils.parseNumber(d)
        })
        gl.series.push(singleArray)
      }

      gl.seriesZ.push(this.threeDSeries)

      if (ser[i].name !== undefined) {
        gl.seriesNames.push(ser[i].name)
      } else {
        gl.seriesNames.push('series-' + parseInt(i + 1))
      }
    }

    return this.w
  }

  parseDataNonAxisCharts(ser) {
    const gl = this.w.globals
    const cnf = this.w.config

    gl.series = ser.slice()
    gl.seriesNames = cnf.labels.slice()
    for (let i = 0; i < gl.series.length; i++) {
      if (gl.seriesNames[i] === undefined) {
        gl.seriesNames.push('series-' + (i + 1))
      }
    }

    return this.w
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
    } else {
      // user didn't provided any labels, fallback to 1-2-3-4-5
      let labelArr = []

      if (gl.axisCharts) {
        // for axis charts, we get the longest series and create labels from it
        for (let i = 0; i < gl.series[gl.maxValsInArrayIndex].length; i++) {
          labelArr.push(i + 1)
        }

        // create gl.seriesX as it will be used in calculations of x positions
        for (let i = 0; i < ser.length; i++) {
          gl.seriesX.push(labelArr)
        }

        // turn on the isXNumeric flag to allow minX and maxX to function properly
        gl.isXNumeric = true
      }

      // no series to pull labels from, put a 0-10 series
      // possibly, user collapsed all series. Hence we can't work with above calc
      if (labelArr.length === 0) {
        labelArr = [0, 10]
        for (let i = 0; i < ser.length; i++) {
          gl.seriesX.push(labelArr)
        }
      }

      // Finally, pass the labelArr in gl.labels which will be printed on x-axis
      gl.labels = labelArr

      // Turn on this global flag to indicate no labels were provided by user
      gl.noLabelsProvided = true
    }
  }

  // Segregate user provided data into appropriate vars
  parseData(ser) {
    let w = this.w
    let cnf = w.config
    let gl = w.globals
    this.excludeCollapsedSeriesInYAxis()

    // If we detected string in X prop of series, we fallback to category x-axis
    this.fallbackToCategory = false

    this.resetGlobals()
    this.isMultipleY()

    if (gl.axisCharts) {
      // axisCharts includes line / area / column / scatter
      this.parseDataAxisCharts(ser)
    } else {
      // non-axis charts are pie / donut
      this.parseDataNonAxisCharts(ser)
    }

    this.coreUtils.getLargestSeries()

    // set Null values to 0 in all series when user hides/shows some series
    if (cnf.chart.type === 'bar' && cnf.chart.stacked) {
      const series = new Series(this.ctx)
      gl.series = series.setNullSeriesToZeroValues(gl.series)
    }

    this.coreUtils.getSeriesTotals()
    if (gl.axisCharts) {
      this.coreUtils.getStackedSeriesTotals()
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
  }

  xySettings() {
    let xyRatios = null
    const w = this.w

    if (w.globals.axisCharts) {
      if (w.config.xaxis.crosshairs.position === 'back') {
        const crosshairs = new Crosshairs(this.ctx)
        crosshairs.drawXCrosshairs()
      }
      if (w.config.yaxis[0].crosshairs.position === 'back') {
        const crosshairs = new Crosshairs(this.ctx)
        crosshairs.drawYCrosshairs()
      }

      xyRatios = this.coreUtils.getCalculatedRatios()

      if (
        w.config.xaxis.type === 'datetime' &&
        w.config.xaxis.labels.formatter === undefined
      ) {
        let ts = new TimeScale(this.ctx)
        let formattedTimeScale
        if (
          isFinite(w.globals.minX) &&
          isFinite(w.globals.maxX) &&
          !w.globals.isBarHorizontal
        ) {
          formattedTimeScale = ts.calculateTimeScaleTicks(
            w.globals.minX,
            w.globals.maxX
          )
          ts.recalcDimensionsBasedOnFormat(formattedTimeScale, false)
        } else if (w.globals.isBarHorizontal) {
          formattedTimeScale = ts.calculateTimeScaleTicks(
            w.globals.minY,
            w.globals.maxY
          )
          ts.recalcDimensionsBasedOnFormat(formattedTimeScale, true)
        }
      }
    }
    return xyRatios
  }

  drawAxis(type, xyRatios) {
    let gl = this.w.globals
    let cnf = this.w.config

    let xAxis = new XAxis(this.ctx)
    let yAxis = new YAxis(this.ctx)

    if (gl.axisCharts && type !== 'radar') {
      let elXaxis, elYaxis

      if (gl.isBarHorizontal) {
        elYaxis = yAxis.drawYaxisInversed(0)
        elXaxis = xAxis.drawXaxisInversed(0)

        gl.dom.elGraphical.add(elXaxis)
        gl.dom.elGraphical.add(elYaxis)
      } else {
        elXaxis = xAxis.drawXaxis()
        gl.dom.elGraphical.add(elXaxis)

        cnf.yaxis.map((yaxe, index) => {
          if (gl.ignoreYAxisIndexes.indexOf(index) === -1) {
            elYaxis = yAxis.drawYaxis(index)
            gl.dom.Paper.add(elYaxis)
          }
        })
      }
    }

    cnf.yaxis.map((yaxe, index) => {
      if (gl.ignoreYAxisIndexes.indexOf(index) === -1) {
        yAxis.yAxisTitleRotate(index, yaxe.opposite)
      }
    })
  }

  setupBrushHandler() {
    const w = this.w

    // only for brush charts
    if (!w.config.chart.brush.enabled) {
      return
    }

    // if user has not defined a custom function for selection - we handle the brush chart
    // otherwise we leave it to the user to define the functionality for selection
    if (typeof w.config.chart.events.selection !== 'function') {
      let targets = w.config.chart.brush.targets || [
        w.config.chart.brush.target
      ]
      // retro compatibility with single target option
      targets.forEach((target) => {
        let targetChart = ApexCharts.getChartByID(target)
        targetChart.w.globals.brushSource = this.ctx

        let updateSourceChart = () => {
          this.ctx._updateOptions(
            {
              chart: {
                selection: {
                  xaxis: {
                    min: targetChart.w.globals.minX,
                    max: targetChart.w.globals.maxX
                  }
                }
              }
            },
            false,
            false
          )
        }
        if (typeof targetChart.w.config.chart.events.zoomed !== 'function') {
          targetChart.w.config.chart.events.zoomed = () => {
            updateSourceChart()
          }
        }
        if (typeof targetChart.w.config.chart.events.scrolled !== 'function') {
          targetChart.w.config.chart.events.scrolled = () => {
            updateSourceChart()
          }
        }

        w.config.chart.events.selection = (chart, e) => {
          let yaxis = Utils.clone(w.config.yaxis)
          if (w.config.chart.brush.autoScaleYaxis) {
            const scale = new Scales(targetChart)
            yaxis = scale.autoScaleY(targetChart, e)
          }
          targetChart._updateOptions(
            {
              xaxis: {
                min: e.xaxis.min,
                max: e.xaxis.max
              },
              yaxis
            },
            false,
            false,
            false
          )
        }
      })
    }
  }
}
