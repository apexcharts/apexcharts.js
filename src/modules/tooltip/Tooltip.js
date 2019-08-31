import Labels from './Labels'
import Position from './Position'
import Marker from './Marker'
import Intersect from './Intersect'
import AxesTooltip from './AxesTooltip'
import Graphics from '../Graphics'
import Series from '../Series'
import XAxis from './../axes/XAxis'
import Utils from './Utils'

/**
 * ApexCharts Core Tooltip Class to handle the tooltip generation.
 *
 * @module Tooltip
 **/

export default class Tooltip {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
    const w = this.w

    this.tConfig = w.config.tooltip

    this.tooltipUtil = new Utils(this)
    this.tooltipLabels = new Labels(this)
    this.tooltipPosition = new Position(this)
    this.marker = new Marker(this)
    this.intersect = new Intersect(this)
    this.axesTooltip = new AxesTooltip(this)
    this.showOnIntersect = this.tConfig.intersect
    this.showTooltipTitle = this.tConfig.x.show
    this.fixedTooltip = this.tConfig.fixed.enabled
    this.xaxisTooltip = null
    this.yaxisTTEls = null
    this.isBarShared = !w.globals.isBarHorizontal && this.tConfig.shared
  }

  getElTooltip(ctx) {
    if (!ctx) ctx = this
    return ctx.w.globals.dom.baseEl.querySelector('.apexcharts-tooltip')
  }

  getElXCrosshairs() {
    return this.w.globals.dom.baseEl.querySelector('.apexcharts-xcrosshairs')
  }

  getElGrid() {
    return this.w.globals.dom.baseEl.querySelector('.apexcharts-grid')
  }

  drawTooltip(xyRatios) {
    let w = this.w
    this.xyRatios = xyRatios
    this.blxaxisTooltip = w.config.xaxis.tooltip.enabled && w.globals.axisCharts
    this.blyaxisTooltip =
      w.config.yaxis[0].tooltip.enabled && w.globals.axisCharts
    this.allTooltipSeriesGroups = []

    if (!w.globals.axisCharts) {
      this.showTooltipTitle = false
    }

    const tooltipEl = document.createElement('div')
    tooltipEl.classList.add('apexcharts-tooltip')
    tooltipEl.classList.add(this.tConfig.theme)
    w.globals.dom.elWrap.appendChild(tooltipEl)

    if (w.globals.axisCharts) {
      this.axesTooltip.drawXaxisTooltip()
      this.axesTooltip.drawYaxisTooltip()
      this.axesTooltip.setXCrosshairWidth()
      this.axesTooltip.handleYCrosshair()

      let xAxis = new XAxis(this.ctx)
      this.xAxisTicksPositions = xAxis.getXAxisTicksPositions()
    }

    // we forcefully set intersect true for these conditions
    if (
      (w.globals.comboCharts && !this.tConfig.shared) ||
      (this.tConfig.intersect && !this.tConfig.shared) ||
      ((w.config.chart.type === 'bar' || w.config.chart.type === 'rangeBar') &&
        !this.tConfig.shared)
    ) {
      this.showOnIntersect = true
    }

    if (w.config.markers.size === 0 || w.globals.markers.largestSize === 0) {
      // when user don't want to show points all the time, but only on when hovering on series
      this.marker.drawDynamicPoints(this)
    }

    // no visible series, exit
    if (w.globals.collapsedSeries.length === w.globals.series.length) return

    this.dataPointsDividedHeight = w.globals.gridHeight / w.globals.dataPoints
    this.dataPointsDividedWidth = w.globals.gridWidth / w.globals.dataPoints

    if (this.showTooltipTitle) {
      this.tooltipTitle = document.createElement('div')
      this.tooltipTitle.classList.add('apexcharts-tooltip-title')
      this.tooltipTitle.style.fontFamily =
        this.tConfig.style.fontFamily || w.config.chart.fontFamily
      this.tooltipTitle.style.fontSize = this.tConfig.style.fontSize
      tooltipEl.appendChild(this.tooltipTitle)
    }

    let ttItemsCnt = w.globals.series.length // whether shared or not, default is shared
    if ((w.globals.xyCharts || w.globals.comboCharts) && this.tConfig.shared) {
      if (!this.showOnIntersect) {
        ttItemsCnt = w.globals.series.length
      } else {
        ttItemsCnt = 1
      }
    }

    this.legendLabels = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-legend-text'
    )

    this.ttItems = this.createTTElements(ttItemsCnt)
    this.addSVGEvents()
  }

  createTTElements(ttItemsCnt) {
    const w = this.w
    let ttItems = []

    const tooltipEl = this.getElTooltip()
    for (let i = 0; i < ttItemsCnt; i++) {
      let gTxt = document.createElement('div')
      gTxt.classList.add('apexcharts-tooltip-series-group')
      if (
        this.tConfig.shared &&
        this.tConfig.enabledOnSeries &&
        Array.isArray(this.tConfig.enabledOnSeries)
      ) {
        if (this.tConfig.enabledOnSeries.indexOf(i) < 0) {
          gTxt.classList.add('apexcharts-tooltip-series-group-hidden')
        }
      }

      let point = document.createElement('span')
      point.classList.add('apexcharts-tooltip-marker')
      point.style.backgroundColor = w.globals.colors[i]
      gTxt.appendChild(point)

      const gYZ = document.createElement('div')
      gYZ.classList.add('apexcharts-tooltip-text')

      gYZ.style.fontFamily =
        this.tConfig.style.fontFamily || w.config.chart.fontFamily
      gYZ.style.fontSize = this.tConfig.style.fontSize

      // y values group
      const gYValText = document.createElement('div')
      gYValText.classList.add('apexcharts-tooltip-y-group')

      let txtLabel = document.createElement('span')
      txtLabel.classList.add('apexcharts-tooltip-text-label')
      gYValText.appendChild(txtLabel)

      let txtValue = document.createElement('span')
      txtValue.classList.add('apexcharts-tooltip-text-value')
      gYValText.appendChild(txtValue)

      // z values group
      const gZValText = document.createElement('div')
      gZValText.classList.add('apexcharts-tooltip-z-group')

      let txtZLabel = document.createElement('span')
      txtZLabel.classList.add('apexcharts-tooltip-text-z-label')
      gZValText.appendChild(txtZLabel)

      let txtZValue = document.createElement('span')
      txtZValue.classList.add('apexcharts-tooltip-text-z-value')
      gZValText.appendChild(txtZValue)

      gYZ.appendChild(gYValText)
      gYZ.appendChild(gZValText)

      gTxt.appendChild(gYZ)

      tooltipEl.appendChild(gTxt)

      ttItems.push(gTxt)
    }

    return ttItems
  }

  addSVGEvents() {
    const w = this.w
    let type = w.config.chart.type
    const tooltipEl = this.getElTooltip()

    const commonBar = !!(
      type === 'bar' ||
      type === 'candlestick' ||
      type === 'rangeBar'
    )

    let hoverArea = w.globals.dom.Paper.node

    const elGrid = this.getElGrid()
    if (elGrid) {
      this.seriesBound = elGrid.getBoundingClientRect()
    }

    let tooltipY = []
    let tooltipX = []

    let seriesHoverParams = {
      hoverArea,
      elGrid: elGrid,
      tooltipEl: tooltipEl,
      tooltipY,
      tooltipX,
      ttItems: this.ttItems
    }

    let points

    if (w.globals.axisCharts) {
      if (
        type === 'area' ||
        type === 'line' ||
        type === 'scatter' ||
        type === 'bubble'
      ) {
        points = w.globals.dom.baseEl.querySelectorAll(
          ".apexcharts-series[data\\:longestSeries='true'] .apexcharts-marker"
        )
      } else if (commonBar) {
        points = w.globals.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-bar-area, .apexcharts-series .apexcharts-candlestick-area, .apexcharts-series .apexcharts-rangebar-area'
        )
      } else if (type === 'heatmap') {
        points = w.globals.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-heatmap'
        )
      } else if (type === 'radar') {
        points = w.globals.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-marker'
        )
      }

      if (points && points.length) {
        for (let p = 0; p < points.length; p++) {
          tooltipY.push(points[p].getAttribute('cy'))
          tooltipX.push(points[p].getAttribute('cx'))
        }
      }
    }

    const validSharedChartTypes =
      (w.globals.xyCharts && !this.showOnIntersect) ||
      (w.globals.comboCharts && !this.showOnIntersect) ||
      (commonBar && this.hasBars() && this.tConfig.shared)

    if (validSharedChartTypes) {
      this.addPathsEventListeners([hoverArea], seriesHoverParams)
    } else if (commonBar && !w.globals.comboCharts) {
      this.addBarsEventListeners(seriesHoverParams)
    } else if (
      type === 'bubble' ||
      type === 'scatter' ||
      type === 'radar' ||
      (this.showOnIntersect && (type === 'area' || type === 'line'))
    ) {
      this.addPointsEventsListeners(seriesHoverParams)
    } else if (!w.globals.axisCharts || type === 'heatmap') {
      let seriesAll = w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-series'
      )
      this.addPathsEventListeners(seriesAll, seriesHoverParams)
    }

    if (this.showOnIntersect) {
      let linePoints = w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-line-series .apexcharts-marker'
      )
      if (linePoints.length > 0) {
        // if we find any lineSeries, addEventListeners for them
        this.addPathsEventListeners(linePoints, seriesHoverParams)
      }

      let areaPoints = w.globals.dom.baseEl.querySelectorAll(
        '.apexcharts-area-series .apexcharts-marker'
      )
      if (areaPoints.length > 0) {
        // if we find any areaSeries, addEventListeners for them
        this.addPathsEventListeners(areaPoints, seriesHoverParams)
      }

      // combo charts may have bars, so add event listeners here too
      if (this.hasBars() && !this.tConfig.shared) {
        this.addBarsEventListeners(seriesHoverParams)
      }
    }
  }

  drawFixedTooltipRect() {
    let w = this.w

    const tooltipEl = this.getElTooltip()

    let tooltipRect = tooltipEl.getBoundingClientRect()

    let ttWidth = tooltipRect.width + 10
    let ttHeight = tooltipRect.height + 10
    let x = this.tConfig.fixed.offsetX
    let y = this.tConfig.fixed.offsetY

    if (this.tConfig.fixed.position.toLowerCase().indexOf('right') > -1) {
      x = x + w.globals.svgWidth - ttWidth + 10
    }

    if (this.tConfig.fixed.position.toLowerCase().indexOf('bottom') > -1) {
      y = y + w.globals.svgHeight - ttHeight - 10
    }

    tooltipEl.style.left = x + 'px'
    tooltipEl.style.top = y + 'px'

    return {
      x,
      y,
      ttWidth,
      ttHeight
    }
  }

  addPointsEventsListeners(seriesHoverParams) {
    let w = this.w
    let points = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers .apexcharts-marker'
    )
    this.addPathsEventListeners(points, seriesHoverParams)
  }

  addBarsEventListeners(seriesHoverParams) {
    let w = this.w
    let bars = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-area, .apexcharts-candlestick-area, .apexcharts-rangebar-area'
    )

    this.addPathsEventListeners(bars, seriesHoverParams)
  }

  addPathsEventListeners(paths, opts) {
    let self = this

    for (let p = 0; p < paths.length; p++) {
      let extendedOpts = {
        paths: paths[p],
        tooltipEl: opts.tooltipEl,
        tooltipY: opts.tooltipY,
        tooltipX: opts.tooltipX,
        elGrid: opts.elGrid,
        hoverArea: opts.hoverArea,
        ttItems: opts.ttItems
      }

      this.w.globals.tooltipOpts = extendedOpts

      let events = ['mousemove', 'mouseup', 'touchmove', 'mouseout', 'touchend']

      events.map((ev) => {
        return paths[p].addEventListener(
          ev,
          self.seriesHover.bind(self, extendedOpts),
          { capture: false, passive: true }
        )
      })
    }
  }

  /*
   ** The actual series hover function
   */
  seriesHover(opt, e) {
    let chartGroups = []
    const w = this.w

    // if user has more than one charts in group, we need to sync
    if (w.config.chart.group) {
      chartGroups = this.ctx.getGroupedCharts()
    }

    if (
      w.globals.axisCharts &&
      ((w.globals.minX === -Infinity && w.globals.maxX === Infinity) ||
        w.globals.dataPoints === 0)
    ) {
      return
    }

    if (chartGroups.length) {
      chartGroups.forEach((ch) => {
        const tooltipEl = this.getElTooltip(ch)

        const newOpts = {
          paths: opt.paths,
          tooltipEl: tooltipEl,
          tooltipY: opt.tooltipY,
          tooltipX: opt.tooltipX,
          elGrid: opt.elGrid,
          hoverArea: opt.hoverArea,
          ttItems: ch.w.globals.tooltip.ttItems
        }

        // all the charts should have the same minX and maxX (same xaxis) for multiple tooltips to work correctly
        if (
          ch.w.globals.minX === this.w.globals.minX &&
          ch.w.globals.maxX === this.w.globals.maxX
        ) {
          ch.w.globals.tooltip.seriesHoverByContext({
            chartCtx: ch,
            ttCtx: ch.w.globals.tooltip,
            opt: newOpts,
            e
          })
        }
      })
    } else {
      this.seriesHoverByContext({
        chartCtx: this.ctx,
        ttCtx: this.w.globals.tooltip,
        opt,
        e
      })
    }
  }

  seriesHoverByContext({ chartCtx, ttCtx, opt, e }) {
    let w = chartCtx.w
    const tooltipEl = this.getElTooltip()

    // tooltipRect is calculated on every mousemove, because the text is dynamic
    ttCtx.tooltipRect = {
      x: 0,
      y: 0,
      ttWidth: tooltipEl.getBoundingClientRect().width,
      ttHeight: tooltipEl.getBoundingClientRect().height
    }
    ttCtx.e = e

    // highlight the current hovered bars
    if (ttCtx.hasBars() && !w.globals.comboCharts && !ttCtx.isBarShared) {
      if (this.tConfig.onDatasetHover.highlightDataSeries) {
        let series = new Series(chartCtx)
        series.toggleSeriesOnHover(e, e.target.parentNode)
      }
    }

    if (ttCtx.fixedTooltip) {
      ttCtx.drawFixedTooltipRect()
    }

    if (w.globals.axisCharts) {
      ttCtx.axisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect
      })
    } else {
      // non-plot charts i.e pie/donut/circle
      ttCtx.nonAxisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect
      })
    }
  }

  // tooltip handling for line/area/bar/columns/scatter
  axisChartsTooltips({ e, opt }) {
    let w = this.w
    let j, x, y

    let capj = null

    let seriesBound = opt.elGrid.getBoundingClientRect()

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY

    this.clientY = clientY
    this.clientX = clientX

    if (
      clientY < seriesBound.top ||
      clientY > seriesBound.top + seriesBound.height
    ) {
      this.handleMouseOut(opt)
      return
    }

    if (
      Array.isArray(this.tConfig.enabledOnSeries) &&
      !w.config.tooltip.shared
    ) {
      const index = parseInt(opt.paths.getAttribute('index'))
      if (this.tConfig.enabledOnSeries.indexOf(index) < 0) {
        this.handleMouseOut(opt)
        return
      }
    }

    const tooltipEl = this.getElTooltip()
    const xcrosshairs = this.getElXCrosshairs()

    let isStickyTooltip =
      w.globals.xyCharts ||
      (w.config.chart.type === 'bar' &&
        (!w.globals.isBarHorizontal && this.hasBars()) &&
        this.tConfig.shared) ||
      (w.globals.comboCharts && this.hasBars)

    if (w.globals.isBarHorizontal && this.hasBars()) {
      isStickyTooltip = false
    }

    if (
      e.type === 'mousemove' ||
      e.type === 'touchmove' ||
      e.type === 'mouseup'
    ) {
      if (xcrosshairs !== null) {
        xcrosshairs.classList.add('active')
      }

      if (this.ycrosshairs !== null && this.blyaxisTooltip) {
        this.ycrosshairs.classList.add('active')
      }

      if (isStickyTooltip && !this.showOnIntersect) {
        capj = this.tooltipUtil.getNearestValues({
          context: this,
          hoverArea: opt.hoverArea,
          elGrid: opt.elGrid,
          clientX,
          clientY,
          hasBars: this.hasBars
        })

        j = capj.j
        let capturedSeries = capj.capturedSeries

        if (capj.hoverX < 0 || capj.hoverX > w.globals.gridWidth) {
          this.handleMouseOut(opt)
          return
        }

        if (capturedSeries !== null) {
          let ignoreNull = w.globals.series[capturedSeries][j] === null
          if (ignoreNull) {
            this.handleMouseOut(opt)
            return
          }

          if (typeof w.globals.series[capturedSeries][j] !== 'undefined') {
            if (
              this.tConfig.shared &&
              this.tooltipUtil.isXoverlap(j) &&
              this.tooltipUtil.isinitialSeriesSameLen()
            ) {
              this.create(e, this, capturedSeries, j, opt.ttItems)
            } else {
              this.create(e, this, capturedSeries, j, opt.ttItems, false)
            }
          } else {
            if (this.tooltipUtil.isXoverlap(j)) {
              this.create(e, this, 0, j, opt.ttItems)
            }
          }
        } else {
          // couldn't capture any series. check if shared X is same,
          // if yes, draw a grouped tooltip
          if (this.tooltipUtil.isXoverlap(j)) {
            this.create(e, this, 0, j, opt.ttItems)
          }
        }
      } else {
        if (w.config.chart.type === 'heatmap') {
          let markerXY = this.intersect.handleHeatTooltip({
            e,
            opt,
            x,
            y
          })
          x = markerXY.x
          y = markerXY.y

          tooltipEl.style.left = x + 'px'
          tooltipEl.style.top = y + 'px'
        } else {
          if (this.hasBars) {
            this.intersect.handleBarTooltip({
              e,
              opt
            })
          }

          if (this.hasMarkers) {
            // intersect - line/area/scatter/bubble
            this.intersect.handleMarkerTooltip({
              e,
              opt,
              x,
              y
            })
          }
        }
      }

      if (this.blyaxisTooltip) {
        for (let yt = 0; yt < w.config.yaxis.length; yt++) {
          this.axesTooltip.drawYaxisTooltipText(yt, clientY, this.xyRatios)
        }
      }

      opt.tooltipEl.classList.add('active')
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      this.handleMouseOut(opt)
    }
  }

  // tooltip handling for pie/donuts
  nonAxisChartsTooltips({ e, opt, tooltipRect }) {
    let w = this.w
    let rel = opt.paths.getAttribute('rel')

    const tooltipEl = this.getElTooltip()

    let seriesBound = w.globals.dom.elWrap.getBoundingClientRect()

    if (e.type === 'mousemove' || e.type === 'touchmove') {
      tooltipEl.classList.add('active')

      this.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i: parseInt(rel) - 1,
        shared: false
      })

      let x = w.globals.clientX - seriesBound.left - tooltipRect.ttWidth / 2
      let y = w.globals.clientY - seriesBound.top - tooltipRect.ttHeight - 10

      tooltipEl.style.left = x + 'px'
      tooltipEl.style.top = y + 'px'
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      tooltipEl.classList.remove('active')
    }
  }

  deactivateHoverFilter() {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let allPaths = w.globals.dom.Paper.select(`.apexcharts-bar-area`)

    for (let b = 0; b < allPaths.length; b++) {
      graphics.pathMouseLeave(allPaths[b])
    }
  }

  handleMouseOut(opt) {
    const w = this.w

    const xcrosshairs = this.getElXCrosshairs()

    opt.tooltipEl.classList.remove('active')
    this.deactivateHoverFilter()
    if (w.config.chart.type !== 'bubble') {
      this.marker.resetPointsSize()
    }
    if (xcrosshairs !== null) {
      xcrosshairs.classList.remove('active')
    }
    if (this.ycrosshairs !== null) {
      this.ycrosshairs.classList.remove('active')
    }
    if (this.blxaxisTooltip) {
      this.xaxisTooltip.classList.remove('active')
    }
    if (this.blyaxisTooltip) {
      if (this.yaxisTTEls === null) {
        this.yaxisTTEls = w.globals.dom.baseEl.querySelectorAll(
          '.apexcharts-yaxistooltip'
        )
      }
      for (let i = 0; i < this.yaxisTTEls.length; i++) {
        this.yaxisTTEls[i].classList.remove('active')
      }
    }

    if (w.config.legend.tooltipHoverFormatter) {
      this.legendLabels.forEach((l) => {
        const defaultText = l.getAttribute('data:default-text')
        l.innerHTML = defaultText
      })
    }
  }

  getElMarkers() {
    return this.w.globals.dom.baseEl.querySelectorAll(
      ' .apexcharts-series-markers'
    )
  }

  getAllMarkers() {
    return this.w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers .apexcharts-marker'
    )
  }

  hasMarkers() {
    const markers = this.getElMarkers()
    return markers.length > 0
  }

  getElBars() {
    return this.w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-series,  .apexcharts-candlestick-series, .apexcharts-rangebar-series'
    )
  }

  hasBars() {
    const bars = this.getElBars()
    return bars.length > 0
  }

  markerClick(e, seriesIndex, dataPointIndex) {
    const w = this.w
    if (typeof w.config.chart.events.markerClick === 'function') {
      w.config.chart.events.markerClick(e, this.ctx, {
        seriesIndex,
        dataPointIndex,
        w
      })
    }
    this.ctx.fireEvent('markerClick', [
      e,
      this.ctx,
      { seriesIndex, dataPointIndex, w }
    ])
  }

  create(e, context, capturedSeries, j, ttItems, shared = null) {
    let w = this.w
    let ttCtx = context

    if (e.type === 'mouseup') {
      this.markerClick(e, capturedSeries, j)
    }

    if (shared === null) shared = this.tConfig.shared

    const hasMarkers = this.hasMarkers()

    const bars = this.getElBars()

    if (w.config.legend.tooltipHoverFormatter) {
      let legendFormatter = w.config.legend.tooltipHoverFormatter

      let els = Array.from(this.legendLabels)

      // reset all legend values first
      els.forEach((l) => {
        const legendName = l.getAttribute('data:default-text')
        l.innerHTML = legendName
      })

      // for irregular time series
      for (let i = 0; i < els.length; i++) {
        const l = els[i]
        const lsIndex = parseInt(l.getAttribute('i'))
        const legendName = l.getAttribute('data:default-text')

        let text = legendFormatter(legendName, {
          seriesIndex: shared ? lsIndex : capturedSeries,
          dataPointIndex: j,
          w
        })

        if (!shared) {
          l.innerHTML = lsIndex === capturedSeries ? text : legendName
          if (capturedSeries === lsIndex) {
            break
          }
        } else {
          l.innerHTML = text
        }
      }
    }

    if (shared) {
      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems,
        i: capturedSeries,
        j,
        shared: this.showOnIntersect ? false : this.tConfig.shared
      })

      if (hasMarkers) {
        if (w.globals.markers.largestSize > 0) {
          ttCtx.marker.enlargePoints(j)
        } else {
          ttCtx.tooltipPosition.moveDynamicPointsOnHover(j)
        }
      }

      if (this.hasBars()) {
        this.barSeriesHeight = this.tooltipUtil.getBarsHeight(bars)
        if (this.barSeriesHeight > 0) {
          // hover state, activate snap filter
          let graphics = new Graphics(this.ctx)
          let paths = w.globals.dom.Paper.select(
            `.apexcharts-bar-area[j='${j}']`
          )

          // de-activate first
          this.deactivateHoverFilter()

          this.tooltipPosition.moveStickyTooltipOverBars(j)

          for (let b = 0; b < paths.length; b++) {
            graphics.pathMouseEnter(paths[b])
          }
        }
      }
    } else {
      ttCtx.tooltipLabels.drawSeriesTexts({
        shared: false,
        ttItems,
        i: capturedSeries,
        j
      })

      if (this.hasBars()) {
        ttCtx.tooltipPosition.moveStickyTooltipOverBars(j)
      }

      if (hasMarkers) {
        ttCtx.tooltipPosition.moveMarkers(capturedSeries, j)
      }
    }
  }
}
