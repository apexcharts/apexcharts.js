import Labels from './Labels'
import Position from './Position'
import Marker from './Marker'
import Intersect from './Intersect'
import AxesTooltip from './AxesTooltip'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
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
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: getGroupedCharts, getSyncedCharts, fireEvent, XAxis instantiation

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
    this.lastHoverTime = Date.now()
    this.dimensionUpdateScheduled = false
  }

  setupDimensionCache() {
    const w = this.w
    const tooltipEl = this.getElTooltip()

    if (!tooltipEl) return

    // Initial dimension cache
    this.updateDimensionCache()

    // Setup ResizeObserver for automatic dimension updates
    if (typeof ResizeObserver !== 'undefined' && !w.globals.resizeObserver) {
      w.globals.resizeObserver = new ResizeObserver(() => {
        if (!this.dimensionUpdateScheduled) {
          this.dimensionUpdateScheduled = true
          requestAnimationFrame(() => {
            this.updateDimensionCache()
            this.dimensionUpdateScheduled = false
          })
        }
      })
      w.globals.resizeObserver.observe(tooltipEl)
    }
  }

  updateDimensionCache() {
    const w = this.w
    const tooltipEl = this.getElTooltip()

    if (!tooltipEl) return

    const rect = tooltipEl.getBoundingClientRect()
    w.globals.dimensionCache.tooltip = {
      width: rect.width,
      height: rect.height,
      lastUpdate: Date.now(),
    }
  }

  getCachedDimensions() {
    const w = this.w

    // Return cached dimensions if available and fresh (< 1 second old)
    if (w.globals.dimensionCache.tooltip) {
      const cache = w.globals.dimensionCache.tooltip
      const age = Date.now() - cache.lastUpdate

      if (age < 1000) {
        return {
          ttWidth: cache.width,
          ttHeight: cache.height,
        }
      }
    }

    // Fallback to live measurement and update cache
    this.updateDimensionCache()
    const cache = w.globals.dimensionCache.tooltip
    return cache
      ? {
          ttWidth: cache.width,
          ttHeight: cache.height,
        }
      : { ttWidth: 0, ttHeight: 0 }
  }

  getElTooltip(ctx) {
    if (!ctx) ctx = this
    if (!ctx.w.dom.baseEl) return null

    return ctx.w.dom.baseEl.querySelector('.apexcharts-tooltip')
  }

  getElXCrosshairs() {
    return this.w.dom.baseEl.querySelector('.apexcharts-xcrosshairs')
  }

  getElGrid() {
    return this.w.dom.baseEl.querySelector('.apexcharts-grid')
  }

  drawTooltip(xyRatios) {
    const w = this.w
    this.xyRatios = xyRatios
    this.isXAxisTooltipEnabled =
      w.config.xaxis.tooltip.enabled && w.globals.axisCharts
    this.yaxisTooltips = w.config.yaxis.map((y) => {
      return y.show && y.tooltip.enabled && w.globals.axisCharts ? true : false
    })
    this.allTooltipSeriesGroups = []

    if (!w.globals.axisCharts) {
      this.showTooltipTitle = false
    }

    const tooltipEl = BrowserAPIs.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'div',
    )
    tooltipEl.classList.add('apexcharts-tooltip')
    if (w.config.tooltip.cssClass) {
      tooltipEl.classList.add(w.config.tooltip.cssClass)
    }
    tooltipEl.classList.add(`apexcharts-theme-${this.tConfig.theme || 'light'}`)

    // accessibility attributes
    if (
      w.config.chart.accessibility.enabled &&
      w.config.chart.accessibility.announcements.enabled
    ) {
      tooltipEl.setAttribute('role', 'tooltip')
      tooltipEl.setAttribute('aria-live', 'polite')
      tooltipEl.setAttribute('aria-atomic', 'true')
      tooltipEl.setAttribute('aria-hidden', 'true')
    }

    w.dom.elWrap.appendChild(tooltipEl)

    if (w.globals.axisCharts) {
      this.axesTooltip.drawXaxisTooltip()
      this.axesTooltip.drawYaxisTooltip()
      this.axesTooltip.setXCrosshairWidth()
      this.axesTooltip.handleYCrosshair()

      const xAxis = new XAxis(this.w, this.ctx)
      this.xAxisTicksPositions = xAxis.getXAxisTicksPositions()
    }

    // we forcefully set intersect true for these conditions
    if (
      (w.globals.comboCharts ||
        this.tConfig.intersect ||
        w.config.chart.type === 'rangeBar') &&
      !this.tConfig.shared
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
      this.tooltipTitle = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )
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

    this.legendLabels = w.dom.baseEl.querySelectorAll(
      '.apexcharts-legend-text',
    )

    this.ttItems = this.createTTElements(ttItemsCnt)
    this.addSVGEvents()

    this.setupDimensionCache()
  }

  createTTElements(ttItemsCnt) {
    const w = this.w
    const ttItems = []

    const tooltipEl = this.getElTooltip()
    for (let i = 0; i < ttItemsCnt; i++) {
      const gTxt = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )

      gTxt.classList.add(
        'apexcharts-tooltip-series-group',
        `apexcharts-tooltip-series-group-${i}`,
      )
      gTxt.style.order = w.config.tooltip.inverseOrder ? ttItemsCnt - i : i + 1

      const point = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'span',
      )
      point.classList.add('apexcharts-tooltip-marker')

      if (w.config.tooltip.fillSeriesColor) {
        point.style.backgroundColor = w.globals.colors[i]
      } else {
        point.style.color = w.globals.colors[i]
      }

      const mShape = w.config.markers.shape
      let shape = mShape
      if (Array.isArray(mShape)) {
        shape = mShape[i]
      }

      point.setAttribute('shape', shape)
      gTxt.appendChild(point)

      const gYZ = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )
      gYZ.classList.add('apexcharts-tooltip-text')

      gYZ.style.fontFamily =
        this.tConfig.style.fontFamily || w.config.chart.fontFamily
      gYZ.style.fontSize = this.tConfig.style.fontSize
      ;['y', 'goals', 'z'].forEach((g) => {
        const gValText = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'div',
        )
        gValText.classList.add(`apexcharts-tooltip-${g}-group`)

        const txtLabel = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'span',
        )
        txtLabel.classList.add(`apexcharts-tooltip-text-${g}-label`)
        gValText.appendChild(txtLabel)

        const txtValue = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'span',
        )
        txtValue.classList.add(`apexcharts-tooltip-text-${g}-value`)
        gValText.appendChild(txtValue)

        gYZ.appendChild(gValText)
      })

      gTxt.appendChild(gYZ)

      tooltipEl.appendChild(gTxt)

      ttItems.push(gTxt)
    }

    return ttItems
  }

  addSVGEvents() {
    const w = this.w
    const type = w.config.chart.type
    const tooltipEl = this.getElTooltip()

    const commonBar = !!(
      type === 'bar' ||
      type === 'candlestick' ||
      type === 'boxPlot' ||
      type === 'rangeBar'
    )

    const chartWithmarkers =
      type === 'area' ||
      type === 'line' ||
      type === 'scatter' ||
      type === 'bubble' ||
      type === 'radar'

    const hoverArea = w.dom.Paper.node

    const elGrid = this.getElGrid()
    if (elGrid) {
      this.seriesBound = elGrid.getBoundingClientRect()
    }

    const tooltipY = []
    const tooltipX = []

    const seriesHoverParams = {
      hoverArea,
      elGrid,
      tooltipEl,
      tooltipY,
      tooltipX,
      ttItems: this.ttItems,
    }

    let points

    if (w.globals.axisCharts) {
      if (chartWithmarkers) {
        points = w.dom.baseEl.querySelectorAll(
          ".apexcharts-series[data\\:longestSeries='true'] .apexcharts-marker",
        )
      } else if (commonBar) {
        points = w.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-bar-area, .apexcharts-series .apexcharts-candlestick-area, .apexcharts-series .apexcharts-boxPlot-area, .apexcharts-series .apexcharts-rangebar-area',
        )
      } else if (type === 'heatmap' || type === 'treemap') {
        points = w.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-heatmap, .apexcharts-series .apexcharts-treemap',
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
      (commonBar && this.tooltipUtil.hasBars() && this.tConfig.shared)

    if (validSharedChartTypes) {
      this.addPathsEventListeners([hoverArea], seriesHoverParams)
    } else if (
      (commonBar && !w.globals.comboCharts) ||
      (chartWithmarkers && this.showOnIntersect)
    ) {
      this.addDatapointEventsListeners(seriesHoverParams)
    } else if (
      !w.globals.axisCharts ||
      type === 'heatmap' ||
      type === 'treemap'
    ) {
      const seriesAll =
        w.dom.baseEl.querySelectorAll('.apexcharts-series')
      this.addPathsEventListeners(seriesAll, seriesHoverParams)
    }

    if (this.showOnIntersect) {
      const lineAreaPoints = w.dom.baseEl.querySelectorAll(
        '.apexcharts-line-series .apexcharts-marker, .apexcharts-area-series .apexcharts-marker',
      )
      if (lineAreaPoints.length > 0) {
        // if we find any lineSeries, addEventListeners for them
        this.addPathsEventListeners(lineAreaPoints, seriesHoverParams)
      }

      // combo charts may have bars, so add event listeners here too
      if (this.tooltipUtil.hasBars() && !this.tConfig.shared) {
        this.addDatapointEventsListeners(seriesHoverParams)
      }
    }
  }

  drawFixedTooltipRect() {
    const w = this.w

    const tooltipEl = this.getElTooltip()

    const tooltipRect = tooltipEl.getBoundingClientRect()

    const ttWidth = tooltipRect.width + 10
    const ttHeight = tooltipRect.height + 10
    let x = this.tConfig.fixed.offsetX
    let y = this.tConfig.fixed.offsetY

    const fixed = this.tConfig.fixed.position.toLowerCase()

    if (fixed.indexOf('right') > -1) {
      x = x + w.globals.svgWidth - ttWidth + 10
    }
    if (fixed.indexOf('bottom') > -1) {
      y = y + w.globals.svgHeight - ttHeight - 10
    }

    tooltipEl.style.left = x + 'px'
    tooltipEl.style.top = y + 'px'

    return {
      x,
      y,
      ttWidth,
      ttHeight,
    }
  }

  addDatapointEventsListeners(seriesHoverParams) {
    const w = this.w
    const points = w.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers .apexcharts-marker, .apexcharts-bar-area, .apexcharts-candlestick-area, .apexcharts-boxPlot-area, .apexcharts-rangebar-area',
    )
    this.addPathsEventListeners(points, seriesHoverParams)
  }

  addPathsEventListeners(paths, opts) {
    const self = this

    for (let p = 0; p < paths.length; p++) {
      const extendedOpts = {
        paths: paths[p],
        tooltipEl: opts.tooltipEl,
        tooltipY: opts.tooltipY,
        tooltipX: opts.tooltipX,
        elGrid: opts.elGrid,
        hoverArea: opts.hoverArea,
        ttItems: opts.ttItems,
      }

      const events = ['mousemove', 'mouseup', 'touchmove', 'mouseout', 'touchend']

      events.map((ev) => {
        return paths[p].addEventListener(
          ev,
          self.onSeriesHover.bind(self, extendedOpts),
          { capture: false, passive: true },
        )
      })
    }
  }

  /*
   ** Check to see if the tooltips should be updated based on a mouse / touch event
   */
  onSeriesHover(opt, e) {
    // If a user is moving their mouse quickly, don't bother updating the tooltip every single frame

    const targetDelay = 20
    const timeSinceLastUpdate = Date.now() - this.lastHoverTime
    if (timeSinceLastUpdate >= targetDelay) {
      // The tooltip was last updated over 100ms ago - redraw it even if the user is still moving their
      // mouse so they get some feedback that their moves are being registered
      this.seriesHover(opt, e)
    } else {
      // The tooltip was last updated less than 100ms ago
      // Cancel any other delayed draw, so we don't show stale data
      clearTimeout(this.seriesHoverTimeout)

      // Schedule the next draw so that it happens about 100ms after the last update
      this.seriesHoverTimeout = setTimeout(() => {
        this.seriesHover(opt, e)
      }, targetDelay - timeSinceLastUpdate)
    }
  }

  /*
   ** The actual series hover function
   */
  seriesHover(opt, e) {
    this.lastHoverTime = Date.now()
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
          tooltipEl,
          tooltipY: opt.tooltipY,
          tooltipX: opt.tooltipX,
          elGrid: opt.elGrid,
          hoverArea: opt.hoverArea,
          ttItems: ch.w.globals.tooltip.ttItems,
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
            e,
          })
        }
      })
    } else {
      this.seriesHoverByContext({
        chartCtx: this.ctx,
        ttCtx: this.w.globals.tooltip,
        opt,
        e,
      })
    }
  }

  seriesHoverByContext({ chartCtx, ttCtx, opt, e }) {
    const w = chartCtx.w
    const tooltipEl = this.getElTooltip(chartCtx)

    if (!tooltipEl) return

    // use cached dimensions instead of live getBoundingClientRect
    const cachedDims = ttCtx.getCachedDimensions()
    ttCtx.tooltipRect = {
      x: 0,
      y: 0,
      ttWidth: cachedDims.ttWidth,
      ttHeight: cachedDims.ttHeight,
    }
    ttCtx.e = e

    // highlight the current hovered bars
    if (
      ttCtx.tooltipUtil.hasBars() &&
      !w.globals.comboCharts &&
      !ttCtx.isBarShared
    ) {
      if (this.tConfig.onDatasetHover.highlightDataSeries) {
        const series = new Series(chartCtx.w)
        series.toggleSeriesOnHover(e, e.target.parentNode)
      }
    }

    if (w.globals.axisCharts) {
      ttCtx.axisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect,
      })
    } else {
      // non-plot charts i.e pie/donut/circle
      ttCtx.nonAxisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect,
      })
    }

    if (ttCtx.fixedTooltip) {
      ttCtx.drawFixedTooltipRect()
    }
  }

  // tooltip handling for line/area/bar/columns/scatter
  axisChartsTooltips({ e, opt }) {
    const w = this.w
    let x, y

    const seriesBound = opt.elGrid.getBoundingClientRect()

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX
    const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY

    this.clientY = clientY
    this.clientX = clientX

    w.interact.capturedSeriesIndex = -1
    w.interact.capturedDataPointIndex = -1

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
      const index = parseInt(opt.paths.getAttribute('index'), 10)
      if (this.tConfig.enabledOnSeries.indexOf(index) < 0) {
        this.handleMouseOut(opt)
        return
      }
    }

    const tooltipEl = this.getElTooltip()
    const xcrosshairs = this.getElXCrosshairs()

    let syncedCharts = []
    if (w.config.chart.group) {
      // we need to fallback to sticky tooltip in case charts are synced
      syncedCharts = this.ctx.getSyncedCharts()
    }

    const isStickyTooltip =
      w.globals.xyCharts ||
      (w.config.chart.type === 'bar' &&
        !w.globals.isBarHorizontal &&
        this.tooltipUtil.hasBars() &&
        this.tConfig.shared) ||
      (w.globals.comboCharts && this.tooltipUtil.hasBars())

    if (
      e.type === 'mousemove' ||
      e.type === 'touchmove' ||
      e.type === 'mouseup'
    ) {
      // there is no series to hover over
      if (
        w.globals.collapsedSeries.length +
          w.globals.ancillaryCollapsedSeries.length ===
        w.globals.series.length
      ) {
        return
      }

      if (xcrosshairs !== null) {
        xcrosshairs.classList.add('apexcharts-active')
      }

      const hasYAxisTooltip = this.yaxisTooltips.filter((b) => {
        return b === true
      })
      if (this.ycrosshairs !== null && hasYAxisTooltip.length) {
        this.ycrosshairs.classList.add('apexcharts-active')
      }

      if (
        (isStickyTooltip && !this.showOnIntersect) ||
        syncedCharts.length > 1
      ) {
        this.handleStickyTooltip(e, clientX, clientY, opt)
      } else {
        if (
          w.config.chart.type === 'heatmap' ||
          w.config.chart.type === 'treemap'
        ) {
          const markerXY = this.intersect.handleHeatTreeTooltip({
            e,
            opt,
            x,
            y,
            type: w.config.chart.type,
          })
          x = markerXY.x
          y = markerXY.y

          tooltipEl.style.left = x + 'px'
          tooltipEl.style.top = y + 'px'
        } else {
          if (this.tooltipUtil.hasBars()) {
            this.intersect.handleBarTooltip({
              e,
              opt,
            })
          }

          if (this.tooltipUtil.hasMarkers()) {
            // intersect - line/area/scatter/bubble
            this.intersect.handleMarkerTooltip({
              e,
              opt,
              x,
              y,
            })
          }
        }
      }

      if (this.yaxisTooltips.length) {
        for (let yt = 0; yt < w.config.yaxis.length; yt++) {
          this.axesTooltip.drawYaxisTooltipText(yt, clientY, this.xyRatios)
        }
      }

      w.dom.baseEl.classList.add('apexcharts-tooltip-active')
      opt.tooltipEl.classList.add('apexcharts-active')
      if (
        w.config.chart.accessibility.enabled &&
        w.config.chart.accessibility.announcements.enabled
      ) {
        opt.tooltipEl.removeAttribute('aria-hidden')
      }
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      this.handleMouseOut(opt)
    }
  }

  // tooltip handling for pie/donuts
  nonAxisChartsTooltips({ e, opt, tooltipRect }) {
    const w = this.w
    const rel = opt.paths.getAttribute('rel')

    const tooltipEl = this.getElTooltip()

    const seriesBound = w.dom.elWrap.getBoundingClientRect()

    if (e.type === 'mousemove' || e.type === 'touchmove') {
      w.dom.baseEl.classList.add('apexcharts-tooltip-active')
      tooltipEl.classList.add('apexcharts-active')
      if (
        w.config.chart.accessibility.enabled &&
        w.config.chart.accessibility.announcements.enabled
      ) {
        tooltipEl.removeAttribute('aria-hidden')
      }

      this.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i: parseInt(rel, 10) - 1,
        shared: false,
      })

      let x, y

      // opt.paths is the <g class="apexcharts-series"> group element;
      // data:cx / data:cy are set on the child <path> arc element inside it
      const arcPath = opt.paths.querySelector('path[data\\:cx]') || opt.paths

      if (
        w.config.tooltip.intersect &&
        arcPath.hasAttribute('data:cx') &&
        arcPath.hasAttribute('data:cy')
      ) {
        const svgBound = w.dom.Paper.node.getBoundingClientRect()
        x =
          svgBound.left -
          seriesBound.left +
          parseFloat(arcPath.getAttribute('data:cx')) -
          tooltipRect.ttWidth / 2
        y =
          svgBound.top -
          seriesBound.top +
          parseFloat(arcPath.getAttribute('data:cy')) -
          tooltipRect.ttHeight -
          10
      } else {
        x = w.interact.clientX - seriesBound.left - tooltipRect.ttWidth / 2
        y = w.interact.clientY - seriesBound.top - tooltipRect.ttHeight - 10
      }

      tooltipEl.style.left = x + 'px'
      tooltipEl.style.top = y + 'px'

      if (w.config.legend.tooltipHoverFormatter) {
        const legendFormatter = w.config.legend.tooltipHoverFormatter

        const i = rel - 1
        const legendName =
          this.legendLabels[i].getAttribute('data:default-text')

        const text = legendFormatter(legendName, {
          seriesIndex: i,
          dataPointIndex: i,
          w,
        })

        this.legendLabels[i].innerHTML = text
      }
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      tooltipEl.classList.remove('apexcharts-active')
      w.dom.baseEl.classList.remove('apexcharts-tooltip-active')
      if (w.config.legend.tooltipHoverFormatter) {
        this.legendLabels.forEach((l) => {
          const defaultText = l.getAttribute('data:default-text')
          l.innerHTML = decodeURIComponent(defaultText)
        })
      }
    }
  }

  handleStickyTooltip(e, clientX, clientY, opt) {
    const w = this.w
    const capj = this.tooltipUtil.getNearestValues({
      context: this,
      hoverArea: opt.hoverArea,
      elGrid: opt.elGrid,
      clientX,
      clientY,
    })

    const j = capj.j
    let capturedSeries = capj.capturedSeries

    if (w.globals.collapsedSeriesIndices.includes(capturedSeries))
      capturedSeries = null

    const bounds = opt.elGrid.getBoundingClientRect()
    if (capj.hoverX < 0 || capj.hoverX > bounds.width) {
      this.handleMouseOut(opt)
      return
    }

    if (capturedSeries !== null) {
      this.handleStickyCapturedSeries(e, capturedSeries, opt, j)
    } else {
      // couldn't capture any series. check if shared X is same,
      // if yes, draw a grouped tooltip
      if (this.tooltipUtil.isXoverlap(j) || w.globals.isBarHorizontal) {
        const firstVisibleSeries = w.globals.series.findIndex(
          (s, i) => !w.globals.collapsedSeriesIndices.includes(i),
        )
        this.create(e, this, firstVisibleSeries, j, opt.ttItems)
      }
    }
  }

  handleStickyCapturedSeries(e, capturedSeries, opt, j) {
    const w = this.w
    if (!this.tConfig.shared) {
      const ignoreNull = w.globals.series[capturedSeries][j] === null
      if (ignoreNull) {
        this.handleMouseOut(opt)
        return
      }
    }

    if (typeof w.globals.series[capturedSeries][j] !== 'undefined') {
      if (
        this.tConfig.shared &&
        this.tooltipUtil.isXoverlap(j) &&
        this.tooltipUtil.isInitialSeriesSameLen()
      ) {
        this.create(e, this, capturedSeries, j, opt.ttItems)
      } else {
        this.create(e, this, capturedSeries, j, opt.ttItems, false)
      }
    } else {
      if (this.tooltipUtil.isXoverlap(j)) {
        const firstVisibleSeries = w.globals.series.findIndex(
          (s, i) => !w.globals.collapsedSeriesIndices.includes(i),
        )
        this.create(e, this, firstVisibleSeries, j, opt.ttItems)
      }
    }
  }

  deactivateHoverFilter() {
    const w = this.w
    const graphics = new Graphics(this.w, this.ctx)

    const allPaths = w.dom.Paper.find(`.apexcharts-bar-area`)

    for (let b = 0; b < allPaths.length; b++) {
      graphics.pathMouseLeave(allPaths[b])
    }
  }

  handleMouseOut(opt) {
    const w = this.w

    const xcrosshairs = this.getElXCrosshairs()
    w.dom.baseEl.classList.remove('apexcharts-tooltip-active')

    opt.tooltipEl.classList.remove('apexcharts-active')
    if (
      w.config.chart.accessibility.enabled &&
      w.config.chart.accessibility.announcements.enabled
    ) {
      opt.tooltipEl.setAttribute('aria-hidden', 'true')
    }
    this.deactivateHoverFilter()
    if (w.config.chart.type !== 'bubble') {
      this.marker.resetPointsSize()
    }
    if (xcrosshairs !== null) {
      xcrosshairs.classList.remove('apexcharts-active')
    }
    if (this.ycrosshairs !== null) {
      this.ycrosshairs.classList.remove('apexcharts-active')
    }
    if (this.isXAxisTooltipEnabled) {
      this.xaxisTooltip.classList.remove('apexcharts-active')
    }
    if (this.yaxisTooltips.length) {
      if (this.yaxisTTEls === null) {
        this.yaxisTTEls = w.dom.baseEl.querySelectorAll(
          '.apexcharts-yaxistooltip',
        )
      }
      for (let i = 0; i < this.yaxisTTEls.length; i++) {
        this.yaxisTTEls[i].classList.remove('apexcharts-active')
      }
    }

    if (w.config.legend.tooltipHoverFormatter) {
      this.legendLabels.forEach((l) => {
        const defaultText = l.getAttribute('data:default-text')
        l.innerHTML = decodeURIComponent(defaultText)
      })
    }
  }

  markerClick(e, seriesIndex, dataPointIndex) {
    const w = this.w
    if (typeof w.config.chart.events.markerClick === 'function') {
      w.config.chart.events.markerClick(e, this.ctx, {
        seriesIndex,
        dataPointIndex,
        w,
      })
    }
    this.ctx.events.fireEvent('markerClick', [
      e,
      this.ctx,
      { seriesIndex, dataPointIndex, w },
    ])
  }

  create(e, context, capturedSeries, j, ttItems, shared = null) {
    const w = this.w
    const ttCtx = context

    if (e.type === 'mouseup') {
      this.markerClick(e, capturedSeries, j)
    }

    if (shared === null) shared = this.tConfig.shared

    const hasMarkers = this.tooltipUtil.hasMarkers(capturedSeries)

    const bars = this.tooltipUtil.getElBars()

    const handlePoints = () => {
      if (w.globals.markers.largestSize > 0) {
        ttCtx.marker.enlargePoints(j)
      } else {
        ttCtx.tooltipPosition.moveDynamicPointsOnHover(j)
      }
    }

    if (w.config.legend.tooltipHoverFormatter) {
      const legendFormatter = w.config.legend.tooltipHoverFormatter

      const els = Array.from(this.legendLabels)

      // reset all legend values first
      els.forEach((l) => {
        const legendName = l.getAttribute('data:default-text')
        l.innerHTML = decodeURIComponent(legendName)
      })

      // for irregular time series
      for (let i = 0; i < els.length; i++) {
        const l = els[i]
        const lsIndex = parseInt(l.getAttribute('i'), 10)
        const legendName = decodeURIComponent(
          l.getAttribute('data:default-text'),
        )

        const text = legendFormatter(legendName, {
          seriesIndex: shared ? lsIndex : capturedSeries,
          dataPointIndex: j,
          w,
        })

        if (!shared) {
          l.innerHTML = lsIndex === capturedSeries ? text : legendName
          if (capturedSeries === lsIndex) {
            break
          }
        } else {
          l.innerHTML =
            w.globals.collapsedSeriesIndices.indexOf(lsIndex) < 0
              ? text
              : legendName
        }
      }
    }

    const commonSeriesTextsParams = {
      ttItems,
      i: capturedSeries,
      j,
      ...(typeof w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y1 !==
        'undefined' && {
        y1: w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y1,
      }),
      ...(typeof w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y2 !==
        'undefined' && {
        y2: w.globals.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y2,
      }),
    }
    if (shared) {
      ttCtx.tooltipLabels.drawSeriesTexts({
        ...commonSeriesTextsParams,
        shared: this.showOnIntersect ? false : this.tConfig.shared,
      })

      if (hasMarkers) {
        handlePoints()
      } else if (this.tooltipUtil.hasBars()) {
        this.barSeriesHeight = this.tooltipUtil.getBarsHeight(bars)
        if (this.barSeriesHeight > 0) {
          // hover state, activate snap filter
          const graphics = new Graphics(this.w, this.ctx)
          const paths = w.dom.Paper.find(`.apexcharts-bar-area[j='${j}']`)

          // de-activate first
          this.deactivateHoverFilter()
          const points = ttCtx.tooltipUtil.getAllMarkers(true)

          if (points.length && !this.barSeriesHeight) {
            handlePoints()
          }

          ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)

          for (let b = 0; b < paths.length; b++) {
            graphics.pathMouseEnter(paths[b])
          }
        }
      }
    } else {
      ttCtx.tooltipLabels.drawSeriesTexts({
        shared: false,
        ...commonSeriesTextsParams,
      })

      if (this.tooltipUtil.hasBars()) {
        ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)
      }

      if (hasMarkers) {
        ttCtx.tooltipPosition.moveMarkers(capturedSeries, j)
      }
    }
  }
}
