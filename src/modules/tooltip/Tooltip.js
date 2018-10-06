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

class Tooltip {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
    const w = this.w

    this.tooltipUtil = new Utils(this)
    this.tooltipLabels = new Labels(this)
    this.tooltipPosition = new Position(this)
    this.marker = new Marker(this)
    this.intersect = new Intersect(this)
    this.axesTooltip = new AxesTooltip(this)
    this.showOnIntersect = w.config.tooltip.intersect
    this.showTooltipTitle = w.config.tooltip.x.show
    this.fixedTooltip = w.config.tooltip.fixed.enabled
    this.xaxisTooltip = null
    this.yaxisTTEls = null
    this.isBarHorizontal = w.config.plotOptions.bar.horizontal
    this.isBarShared = (!w.config.plotOptions.bar.horizontal && w.config.tooltip.shared)
  }

  getElTooltip (ctx) {
    if (!ctx) ctx = this
    return ctx.w.globals.dom.baseEl.querySelector('.apexcharts-tooltip')
  }

  getElXCrosshairs () {
    return this.w.globals.dom.baseEl.querySelector(
      '.apexcharts-xcrosshairs'
    )
  }

  getElGrid () {
    return this.w.globals.dom.baseEl.querySelector(
      '.apexcharts-grid'
    )
  }

  drawTooltip (xyRatios) {
    let w = this.w
    this.xyRatios = xyRatios
    this.blxaxisTooltip = w.config.xaxis.tooltip.enabled && w.globals.axisCharts
    this.blyaxisTooltip = w.config.yaxis[0].tooltip.enabled && w.globals.axisCharts
    this.allTooltipSeriesGroups = []

    if (!w.globals.axisCharts) {
      this.showTooltipTitle = false
    }

    const tooltipEl = document.createElement('div')
    tooltipEl.classList.add('apexcharts-tooltip')
    tooltipEl.classList.add(w.config.tooltip.theme)
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
      (w.globals.comboCharts && !w.config.tooltip.shared) ||
      (w.config.tooltip.intersect && !w.config.tooltip.shared) ||
      (w.config.chart.type === 'bar' && !w.config.tooltip.shared)
    ) {
      this.showOnIntersect = true
    }

    if (w.config.markers.size === 0) {
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
      tooltipEl.appendChild(this.tooltipTitle)
    }

    let ttItemsCnt = w.globals.series.length // whether shared or not, default is shared
    if (
      ((w.globals.xyCharts) || w.globals.comboCharts) &&
      w.config.tooltip.shared
    ) {
      if (!this.showOnIntersect) {
        ttItemsCnt = w.globals.series.length
      } else {
        ttItemsCnt = 1
      }
    }

    this.ttItems = this.createTTElements(ttItemsCnt)
    this.addSVGEvents()
  }

  createTTElements (ttItemsCnt) {
    const w = this.w
    let ttItems = []

    const tooltipEl = this.getElTooltip()
    for (let i = 0; i < ttItemsCnt; i++) {
      let gTxt = document.createElement('div')
      gTxt.classList.add('apexcharts-tooltip-series-group')

      let point = document.createElement('span')
      point.classList.add('apexcharts-tooltip-marker')
      point.style.backgroundColor = w.globals.colors[i]
      gTxt.appendChild(point)

      const gYZ = document.createElement('div')
      gYZ.classList.add('apexcharts-tooltip-text')

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

  addSVGEvents () {
    const w = this.w
    let type = w.config.chart.type
    const tooltipEl = this.getElTooltip()

    const barOrCandlestick = !!(type === 'bar' || type === 'candlestick')

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
      } else if (barOrCandlestick) {
        points = w.globals.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-bar-area',
          '.apexcharts-series .apexcharts-candlestick-area'
        )
      } else if (type === 'heatmap') {
        points = w.globals.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-heatmap'
        )
      }

      if (points && points.length) {
        for (let p = 0; p < points.length; p++) {
          tooltipY.push(points[p].getAttribute('cy'))
          tooltipX.push(points[p].getAttribute('cx'))
        }
      }
    }

    if (
      (w.globals.xyCharts && !this.showOnIntersect) ||
      (w.globals.comboCharts && !this.showOnIntersect) ||
      ((barOrCandlestick) && (!this.isBarHorizontal && this.hasBars()) && w.config.tooltip.shared)) {
      this.addPathsEventListeners([hoverArea], seriesHoverParams)
    } else if ((barOrCandlestick) && !w.globals.comboCharts) {
      this.addBarsEventListeners(seriesHoverParams)
    } else if ((type === 'bubble' || type === 'scatter') ||
      (this.showOnIntersect && (type === 'area' || type === 'line'))) {
      this.addPointsEventsListeners(seriesHoverParams)
    } else if (!w.globals.axisCharts || type === 'heatmap') {
      let seriesAll = w.globals.dom.baseEl.querySelectorAll('.apexcharts-series')
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
      if (this.hasBars() && !w.config.tooltip.shared) {
        this.addBarsEventListeners(seriesHoverParams)
      }
    }
  }

  drawFixedTooltipRect () {
    let w = this.w

    const tooltipEl = this.getElTooltip()

    let tooltipRect = tooltipEl.getBoundingClientRect()

    let ttWidth = tooltipRect.width + 10
    let ttHeight = tooltipRect.height + 10
    let x = w.config.tooltip.fixed.offsetX
    let y = w.config.tooltip.fixed.offsetY

    if (w.config.tooltip.fixed.position.toLowerCase().indexOf('right') > -1) {
      x = x + w.globals.svgWidth - ttWidth + 10
    }

    if (w.config.tooltip.fixed.position.toLowerCase().indexOf('bottom') > -1) {
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

  addPointsEventsListeners (seriesHoverParams) {
    let w = this.w
    let points = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers .apexcharts-marker'
    )
    this.addPathsEventListeners(points, seriesHoverParams)
  }

  addBarsEventListeners (seriesHoverParams) {
    let w = this.w
    let bars = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-area, .apexcharts-candlestick-area'
    )

    this.addPathsEventListeners(bars, seriesHoverParams)
  }

  addPathsEventListeners (paths, opts) {
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

      let events = ['mousemove', 'touchmove', 'mouseout', 'touchend']

      events.map((ev) => {
        return paths[p].addEventListener(ev, self.seriesHover.bind(self, extendedOpts), false)
      })
    }
  }

  /*
   ** The actual series hover function
   */
  seriesHover (opt, e) {
    let chartGroups = []
    if (this.w.config.chart.group) {
      chartGroups = this.ctx.getGroupedCharts()
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
        if (ch.w.globals.minX === this.w.globals.minX && ch.w.globals.maxX === this.w.globals.maxX) {
          ch.w.globals.tooltip.seriesHoverByContext({ chartCtx: ch, ttCtx: ch.w.globals.tooltip, opt: newOpts, e })
        }
      })
    } else {
      this.seriesHoverByContext({ chartCtx: this.ctx, ttCtx: this.w.globals.tooltip, opt, e })
    }
  }

  seriesHoverByContext ({ chartCtx, ttCtx, opt, e }) {
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
      if (w.config.tooltip.onDatasetHover.highlightDataSeries) {
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
  axisChartsTooltips ({
    e,
    opt
  }) {
    let w = this.w
    let j, x, y

    let self = this
    let capj = null

    const tooltipEl = this.getElTooltip()
    const xcrosshairs = this.getElXCrosshairs()

    const clientX = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX
    const clientY = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY

    this.clientY = clientY
    this.clientX = clientX

    let isStickyTooltip =
      w.globals.xyCharts ||
      (w.config.chart.type === 'bar' && (!this.isBarHorizontal && this.hasBars()) && w.config.tooltip.shared) ||
        (w.globals.comboCharts && this.hasBars)

    if (w.config.chart.type === 'bar' && (this.isBarHorizontal && this.hasBars())) {
      isStickyTooltip = false
    }

    if (e.type === 'mousemove' || e.type === 'touchmove') {
      if (xcrosshairs !== null) {
        xcrosshairs.classList.add('active')
      }

      if (self.ycrosshairs !== null && self.blyaxisTooltip) {
        self.ycrosshairs.classList.add('active')
      }

      if (isStickyTooltip && !self.showOnIntersect) {
        capj = self.tooltipUtil.getNearestValues({
          context: self,
          hoverArea: opt.hoverArea,
          elGrid: opt.elGrid,
          clientX,
          clientY,
          hasBars: self.hasBars
        })

        j = capj.j
        let capturedSeries = capj.capturedSeries

        if (capj.hoverX < 0 || capj.hoverX > w.globals.gridWidth) {
        // capj.hoverY causing issues in grouped charts, so commented out that condition for now
        // if (capj.hoverX < 0 || capj.hoverX > w.globals.gridWidth || capj.hoverY < 0 || capj.hoverY > w.globals.gridHeight) {
          self.handleMouseOut(opt)
          return
        }

        if (capturedSeries !== null) {
          let ignoreNull = w.globals.series[capturedSeries][j] === null
          if (ignoreNull) {
            opt.tooltipEl.classList.remove('active')
            return
          }

          if (typeof w.globals.series[capturedSeries][j] !== 'undefined') {
            if (
              w.config.tooltip.shared &&
              this.tooltipUtil.isXoverlap(j) &&
              this.tooltipUtil.isinitialSeriesSameLen()
            ) {
              this.create(self, capturedSeries, j, opt.ttItems)
            } else {
              this.create(self, capturedSeries, j, opt.ttItems, false)
            }
          } else {
            if (this.tooltipUtil.isXoverlap(j)) {
              self.create(self, 0, j, opt.ttItems)
            }
          }
        } else {
          // couldn't capture any series. check if shared X is same,
          // if yes, draw a grouped tooltip
          if (this.tooltipUtil.isXoverlap(j)) {
            self.create(self, 0, j, opt.ttItems)
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
          self.axesTooltip.drawYaxisTooltipText(yt, clientY, self.seriesBound, self.xyRatios)
        }
      }

      opt.tooltipEl.classList.add('active')
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      this.handleMouseOut(opt)
    }
  }

  // tooltip handling for pie/donuts
  nonAxisChartsTooltips ({
    e,
    opt,
    tooltipRect
  }) {
    let w = this.w
    let rel = opt.paths.getAttribute('rel')

    const tooltipEl = this.getElTooltip()

    let trX = 0
    let trY = 0
    let elPie = null

    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX

    if (w.config.chart.type === 'radialBar') {
      elPie = w.globals.dom.baseEl.querySelector(
        '.apexcharts-radialbar'
      )
    } else {
      elPie = w.globals.dom.baseEl.querySelector(
        '.apexcharts-pie'
      )

      trX = parseInt(elPie.getAttribute('data:innerTranslateX'))
      trY = parseInt(elPie.getAttribute('data:innerTranslateY'))
    }

    let seriesBound = elPie.getBoundingClientRect()

    if (e.type === 'mousemove' || e.type === 'touchmove') {
      tooltipEl.classList.add('active')

      this.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i: parseInt(rel) - 1,
        shared: false
      })

      let x = clientX - seriesBound.left - tooltipRect.ttWidth / 2.2 + trX
      let y =
        e.clientY - seriesBound.top - tooltipRect.ttHeight / 2 - 15 + trY

      if (x < 0) {
        x = 0
      } else if (x + tooltipRect.ttWidth > w.globals.gridWidth) {
        x = clientX - seriesBound.left - tooltipRect.ttWidth + trX
      }
      if (y < 0) y = tooltipRect.ttHeight + 20

      tooltipEl.style.left = x + w.globals.translateX + 'px'
      tooltipEl.style.top = y + 'px'
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      tooltipEl.classList.remove('active')
    }
  }

  deactivateHoverFilter () {
    let w = this.w
    let graphics = new Graphics(this.ctx)

    let allPaths = w.globals.dom.Paper.select(`.apexcharts-bar-area`)

    for (let b = 0; b < allPaths.length; b++) {
      graphics.pathMouseLeave(allPaths[b])
    }
  }

  handleMouseOut (opt) {
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
        this.yaxisTTEls = w.globals.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip')
      }
      for (let i = 0; i < this.yaxisTTEls.length; i++) {
        this.yaxisTTEls[i].classList.remove('active')
      }
    }
  }

  getElMarkers () {
    return this.w.globals.dom.baseEl.querySelectorAll(' .apexcharts-series-markers')
  }

  getAllMarkers () {
    return this.w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers .apexcharts-marker'
    )
  }

  hasMarkers () {
    const markers = this.getElMarkers()
    return markers.length > 0
  }

  getElBars () {
    return this.w.globals.dom.baseEl.querySelectorAll('.apexcharts-bar-series,  .apexcharts-candlestick-series')
  }

  hasBars () {
    const bars = this.getElBars()
    return bars.length > 0
  }

  create (context, capturedSeries, j, ttItems, shared = null) {
    let w = this.w
    let self = context

    if (shared === null) shared = w.config.tooltip.shared

    const hasMarkers = this.hasMarkers()

    const bars = this.getElBars()

    if (shared) {
      self.tooltipLabels.drawSeriesTexts({
        ttItems,
        i: capturedSeries,
        j,
        shared: this.showOnIntersect ? false : w.config.tooltip.shared
      })

      if (hasMarkers) {
        if (w.config.markers.size > 0) {
          self.marker.enlargePoints(j)
        } else {
          self.tooltipPosition.moveDynamicPointsOnHover(j)
        }
      }

      if (this.hasBars()) {
        this.barSeriesHeight = this.tooltipUtil.getBarsHeight(bars)
        if (this.barSeriesHeight > 0) {
          // hover state, activate snap filter
          let graphics = new Graphics(this.ctx)
          let paths = w.globals.dom.Paper.select(`.apexcharts-bar-area[j='${j}']`)

          // de-activate first
          this.deactivateHoverFilter()

          this.tooltipPosition.moveStickyTooltipOverBars(j)

          for (let b = 0; b < paths.length; b++) {
            graphics.pathMouseEnter(paths[b])
          }
        }
      }
    } else {
      self.tooltipLabels.drawSeriesTexts({
        shared: false,
        ttItems,
        i: capturedSeries,
        j
      })

      self.tooltipPosition.moveMarkers(capturedSeries, j)
    }
  }
}

module.exports = Tooltip
