import Annotations from './modules/Annotations'
import Animations from './modules/Animations'
import Base from './modules/Base'
import Config from './modules/settings/Config'
import Core from './modules/Core'
import CoreUtils from './modules/CoreUtils'
import Crosshairs from './modules/Crosshairs'
import Dimensions from './modules/Dimensions'
import Formatters from './modules/Formatters'
import Grid from './modules/axes/Grid'
import Legend from './modules/Legend'
import Markers from './modules/Markers'
import Range from './modules/Range'
import Responsive from './modules/Responsive'
import Series from './modules/Series'
import Theme from './modules/Theme'
import Tooltip from './modules/tooltip/Tooltip'
import Utils from './utils/Utils'
import ZoomPanSelection from './modules/ZoomPanSelection'
import TitleSubtitle from './modules/TitleSubtitle'
import Toolbar from './modules/Toolbar'
import Options from './modules/settings/Options'

require('./svgjs/svg.js')
require('svg.filter.js')
require('svg.pathmorphing.js')
require('svg.draggable.js')
require('svg.select.js')
require('svg.resize.js')

require('./assets/apexcharts.css')
require('./utils/ClassListPolyfill')

const en = require('./locales/en.json')

// global Apex object which user can use to override chart's defaults globally
window.Apex = {}

/**
 *
 * @module ApexCharts
 **/

class ApexCharts {
  constructor (el, opts) {
    this.opts = opts
    this.ctx = this

    // Pass the user supplied options to the Base Class where these options will be extended with defaults. The returned object from Base Class will become the config object in the entire codebase.
    this.w = new Base(opts).init()

    this.el = el

    this.w.globals.cuid = (Math.random() + 1).toString(36).substring(4)
    this.w.globals.chartID = this.w.config.chart.id ? this.w.config.chart.id : this.w.globals.cuid

    this.initModules()

    this.create = Utils.bind(this.create, this)
    this.windowResizeHandler = this.windowResize.bind(this)
  }

  /**
   * The primary method user will call to render the chart.
   */
  render () {
    // main method
    return new Promise((resolve, reject) => {
      // only draw chart, if element found
      if (this.el !== null) {
        if (typeof Apex._chartInstances === 'undefined') {
          Apex._chartInstances = []
        }
        if (this.w.config.chart.id) {
          Apex._chartInstances.push({
            id: this.w.globals.chartID,
            group: this.w.config.chart.group,
            chart: this
          })
        }

        // set the locale here
        this.setLocale(this.w.config.chart.defaultLocale)
        const beforeMount = this.w.config.chart.events.beforeMount
        if (typeof beforeMount === 'function') {
          beforeMount(this, this.w)
        }

        this.fireEvent('beforeMount', [this, this.w])
        window.addEventListener('resize', this.windowResizeHandler)

        let graphData = this.create(this.w.config.series)
        if (!graphData) return resolve(this)
        this.mount(graphData).then(() => {
          resolve(graphData)

          if (typeof this.w.config.chart.events.mounted === 'function') {
            this.w.config.chart.events.mounted(this, this.w)
          }

          this.fireEvent('mounted', [this, this.w])
        }).catch((e) => {
          reject(e)
          // handle error in case no data or element not found
        })
      } else {
        reject(new Error('Element not found'))
      }
    })
  }

  initModules () {
    this.animations = new Animations(this.ctx)
    this.annotations = new Annotations(this.ctx)
    this.core = new Core(this.el, this)
    this.grid = new Grid(this)
    this.coreUtils = new CoreUtils(this)
    this.config = new Config({})
    this.crosshairs = new Crosshairs(this.ctx)
    this.options = new Options()
    this.responsive = new Responsive(this.ctx)
    this.series = new Series(this.ctx)
    this.theme = new Theme(this.ctx)
    this.formatters = new Formatters(this.ctx)
    this.titleSubtitle = new TitleSubtitle(this.ctx)
    this.legend = new Legend(this.ctx)
    this.toolbar = new Toolbar(this.ctx)
    this.dimensions = new Dimensions(this.ctx)
    this.zoomPanSelection = new ZoomPanSelection(this.ctx)
    this.w.globals.tooltip = new Tooltip(this.ctx)
  }

  addEventListener (name, handler) {
    const w = this.w

    if (w.globals.events.hasOwnProperty(name)) {
      w.globals.events[name].push(handler)
    } else {
      w.globals.events[name] = [handler]
    }
  };

  removeEventListener (name, handler) {
    const w = this.w
    if (!w.globals.events.hasOwnProperty(name)) {
      return
    }

    var index = w.globals.events[name].indexOf(handler)
    if (index !== -1) {
      w.globals.events[name].splice(index, 1)
    }
  };

  fireEvent (name, args) {
    const w = this.w

    if (!w.globals.events.hasOwnProperty(name)) {
      return
    }

    if (!args || !args.length) {
      args = []
    }

    let evs = w.globals.events[name]
    let l = evs.length

    for (var i = 0; i < l; i++) {
      evs[i].apply(null, args)
    }
  }

  create (ser, opts = {}) {
    let w = this.w
    this.initModules()
    let gl = this.w.globals

    gl.noData = false

    this.responsive.checkResponsiveConfig(opts)

    if (this.el === null) {
      return null
    }

    this.core.setupElements()

    this.coreUtils.checkComboSeries()

    if (ser.length === 0 || (ser.length === 1 && ser[0].data && ser[0].data.length === 0)) {
      this.series.handleNoData()
    }

    this.setupEventHandlers()
    this.core.parseData(ser)
    // this is a good time to set theme colors first
    this.theme.init()
    // labelFormatters should be called before dimensions as in dimensions we need text labels width

    // as markers accepts array, we need to setup global markers for easier access
    const markers = new Markers(this)
    markers.setGlobalMarkerSize()

    this.formatters.setLabelFormatters()
    this.titleSubtitle.draw()

    // legend is calculated here before coreCalculations because it affects the plottable area
    this.legend.init()

    // coreCalculations will give the min/max range and yaxis/axis values. It should be called here to set series variable from config to globals
    if (gl.axisCharts) {
      this.core.coreCalculations()
      // as we have minX and maxX values, determine the default DateTimeFormat for time series
      this.formatters.setLabelFormatters()
    }

    // we need to generate yaxis for heatmap separately as we are not showing numerics there, but seriesNames. There are some tweaks which are required for heatmap to align labels correctly which are done in below function
    // Also we need to do this before calcuting Dimentions plotCoords() method of Dimensions
    this.formatters.heatmapLabelFormatters()

    // We got plottable area here, next task would be to calculate axis areas
    this.dimensions.plotCoords()

    const xyRatios = this.core.xySettings()

    this.grid.createGridMask()

    const elGraph = this.core.plotChartType(ser, xyRatios)

    // after all the drawing calculations, shift the graphical area (actual charts/bars) excluding legends
    this.core.shiftGraphPosition()

    const dim = {
      plot: {
        left: w.globals.translateX,
        top: w.globals.translateY,
        width: w.globals.gridWidth,
        height: w.globals.gridHeight
      }
    }

    return {
      elGraph,
      xyRatios,
      elInner: w.globals.dom.elGraphical,
      dimensions: dim
    }
  }

  mount (graphData = null) {
    let me = this
    let w = me.w

    return new Promise((resolve, reject) => {
      // no data to display
      if (me.el === null) {
        return reject(new Error('Not enough data to display or target element not found'))
      } else if (graphData === null || w.globals.allSeriesCollapsed) {
        me.series.handleNoData()
      }

      me.core.drawAxis(
        w.config.chart.type,
        graphData.xyRatios
      )

      me.grid = new Grid(me)
      if (w.config.grid.position === 'back') {
        me.grid.drawGrid()
      }

      if (w.config.annotations.position === 'back') {
        me.annotations.drawAnnotations()
      }

      if (graphData.elGraph instanceof Array) {
        for (let g = 0; g < graphData.elGraph.length; g++) {
          w.globals.dom.elGraphical.add(graphData.elGraph[g])
        }
      } else {
        w.globals.dom.elGraphical.add(graphData.elGraph)
      }

      if (w.config.grid.position === 'front') {
        me.grid.drawGrid()
      }

      if (w.config.xaxis.crosshairs.position === 'front') {
        me.crosshairs.drawXCrosshairs()
      }

      if (w.config.yaxis[0].crosshairs.position === 'front') {
        me.crosshairs.drawYCrosshairs()
      }

      if (w.config.annotations.position === 'front') {
        me.annotations.drawAnnotations()
      }

      if (!w.globals.noData) {
        // draw tooltips at the end
        if (w.config.tooltip.enabled && !w.globals.noData) {
          me.w.globals.tooltip.drawTooltip(graphData.xyRatios)
        }

        if (w.globals.axisCharts && w.globals.isXNumeric) {
          if (w.config.chart.zoom.enabled || (w.config.chart.selection && w.config.chart.selection.enabled) || (w.config.chart.pan && w.config.chart.pan.enabled)) {
            me.zoomPanSelection.init({
              xyRatios: graphData.xyRatios
            })
          }
        } else {
          const tools = w.config.chart.toolbar.tools
          tools.zoom = false
          tools.zoomin = false
          tools.zoomout = false
          tools.selection = false
          tools.pan = false
          tools.reset = false
        }

        console.log(w.config.chart.toolbar.show)

        if (w.config.chart.toolbar.show && !w.globals.allSeriesCollapsed) {
          me.toolbar.createToolbar()
        }
      }

      if (w.globals.memory.methodsToExec.length > 0) {
        for (let fn of w.globals.memory.methodsToExec) {
          fn.method(fn.params, false, fn.context)
        }
      }
      resolve(me)
    })
  }

  clearPreviousPaths () {
    const w = this.w
    w.globals.previousPaths = []
    w.globals.allSeriesCollapsed = false
    w.globals.collapsedSeries = []
    w.globals.collapsedSeriesIndices = []
  }

  /**
   * Allows users to update Options after the chart has rendered.
   *
   * @param {object} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   */
  updateOptions (options, redraw = false, animate = true, overwriteInitialConfig = true) {
    const w = this.w
    if (options.series) {
      if (options.series[0].data) {
        options.series = options.series.map((s, i) => {
          return {
            ...w.config.series[i],
            name: s.name ? s.name : w.config.series[i].name,
            data: s.data
          }
        })
      }

      // user updated the series via updateOptions() function.
      // Hence, we need to reset axis min/max to avoid zooming issues
      this.revertDefaultAxisMinMax()
    }
    // user has set x-axis min/max externally - hence we need to forcefully set the xaxis min/max
    if (options.xaxis && (options.xaxis.min || options.xaxis.max)) {
      this.forceXAxisUpdate(options)
    }
    if (w.globals.collapsedSeriesIndices.length > 0) {
      this.clearPreviousPaths()
    }
    return this._updateOptions(options, redraw, animate, overwriteInitialConfig)
  }

  /**
   * private method to update Options.
   *
   * @param {object} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   * @param {boolean} overwriteInitialConfig - should update the initial config or not
   */
  _updateOptions (options, redraw = false, animate = true, overwriteInitialConfig = false) {
    const charts = this.getSyncedCharts()

    charts.forEach((ch) => {
      let w = ch.w

      w.globals.shouldAnimate = animate

      if (!redraw) {
        w.globals.resized = true
        w.globals.dataChanged = true

        if (animate) {
          ch.series.getPreviousPaths()
        }
      }

      if (options && typeof options === 'object') {
        ch.config = new Config(options)
        options = CoreUtils.extendArrayProps(ch.config, options)

        w.config = Utils.extend(w.config, options)

        if (overwriteInitialConfig) {
          // we need to forget the lastXAxis and lastYAxis is user forcefully overwriteInitialConfig. If we do not do this, and next time when user zooms the chart after setting yaxis.min/max or xaxis.min/max - the stored lastXAxis will never allow the chart to use the updated min/max by user.
          w.globals.lastXAxis = []
          w.globals.lastYAxis = []

          // After forgetting lastAxes, we need to restore the new config in initialConfig/initialSeries
          w.globals.initialConfig = Utils.extend({}, w.config)
          w.globals.initialSeries = JSON.parse(JSON.stringify(w.config.series))
        }
      }

      return ch.update(options)
    })
  }

  /**
   * Allows users to update Series after the chart has rendered.
   *
   * @param {array} series - New series which will override the existing
   */
  updateSeries (newSeries = [], animate = true, overwriteInitialSeries = true) {
    this.revertDefaultAxisMinMax()
    return this._updateSeries(newSeries, animate, overwriteInitialSeries)
  }

  /**
   * Private method to update Series.
   *
   * @param {array} series - New series which will override the existing
   */
  _updateSeries (newSeries, animate, overwriteInitialSeries = false) {
    const w = this.w

    this.w.globals.shouldAnimate = animate

    w.globals.dataChanged = true

    // if user has collapsed some series with legend, we need to clear those
    if (w.globals.allSeriesCollapsed) {
      w.globals.allSeriesCollapsed = false
    }

    if (animate) {
      this.series.getPreviousPaths()
    }

    let existingSeries

    // axis charts
    if (newSeries[0].data) {
      existingSeries = newSeries.map((s, i) => {
        return {
          ...w.config.series[i],
          name: s.name ? s.name : w.config.series[i].name,
          data: s.data
        }
      })

      w.config.series = existingSeries
    } else {
      // non-axis chart (pie/radialbar)
      w.config.series = newSeries.slice()
    }

    if (overwriteInitialSeries) {
      w.globals.initialConfig.series = JSON.parse(JSON.stringify(w.config.series))
      w.globals.initialSeries = JSON.parse(JSON.stringify(w.config.series))
    }

    return this.update()
  }

  /**
   * Get all charts in the same "group" (including the instance which is called upon) to sync them when user zooms in/out or pan.
   */
  getSyncedCharts () {
    const chartGroups = this.getGroupedCharts()
    let allCharts = [this]
    if (chartGroups.length) {
      allCharts = []
      chartGroups.forEach((ch) => {
        allCharts.push(ch)
      })
    }

    return allCharts
  }

  /**
   * Get charts in the same "group" (excluding the instance which is called upon) to perform operations on the other charts of the same group (eg., tooltip hovering)
   */
  getGroupedCharts () {
    return Apex._chartInstances.filter((ch) => {
      if (ch.group) {
        return true
      }
    }).map((ch) => {
      return this.w.config.chart.group === ch.group ? ch.chart : null
    })
  }

  /**
   * Allows users to append Data to series.
   *
   * @param {array} newData - New data in the same format as series
   */
  appendData (newData, overwriteInitialSeries = true) {
    let me = this

    me.w.globals.dataChanged = true

    me.series.getPreviousPaths()

    let newSeries = me.w.config.series.slice()

    for (let i = 0; i < newSeries.length; i++) {
      if (typeof newData[i] !== 'undefined') {
        for (let j = 0; j < newData[i].data.length; j++) {
          newSeries[i].data.push(newData[i].data[j])
        }
      }
    }
    me.w.config.series = newSeries
    if (overwriteInitialSeries) {
      me.w.globals.initialSeries = JSON.parse(JSON.stringify(me.w.config.series))
    }

    return this.update()
  }

  update (options) {
    const me = this

    return new Promise((resolve, reject) => {
      me.clear()
      const graphData = me.create(me.w.config.series, options)
      if (!graphData) return resolve(me)
      me.mount(graphData).then(() => {
        if (typeof me.w.config.chart.events.updated === 'function') {
          me.w.config.chart.events.updated(me, me.w)
        }
        me.fireEvent('updated', [this, this.w])

        me.w.globals.isDirty = true

        resolve(me)
      }).catch((e) => {
        reject(e)
      })
    })
  }

  forceXAxisUpdate (options) {
    const w = this.w
    if (typeof options.xaxis.min !== 'undefined') {
      w.config.xaxis.min = options.xaxis.min
      w.globals.lastXAxis.min = options.xaxis.min
    }
    if (typeof options.xaxis.max !== 'undefined') {
      w.config.xaxis.max = options.xaxis.max
      w.globals.lastXAxis.max = options.xaxis.max
    }
  }

  /**
   * This function reverts the yaxis and xaxis min/max values to what it was when the chart was defined.
   * This function fixes an important bug where a user might load a new series after zooming in/out of previous series which resulted in wrong min/max
   * Also, this should never be called internally on zoom/pan - the reset should only happen when user calls the updateSeries() function externally
   */
  revertDefaultAxisMinMax () {
    const w = this.w

    w.config.xaxis.min = w.globals.lastXAxis.min
    w.config.xaxis.max = w.globals.lastXAxis.max

    w.config.yaxis.map((yaxe, index) => {
      if (w.globals.zoomed) {
        // if user has zoomed, and this function is called
        // then we need to get the lastAxis min and max
        if (typeof w.globals.lastYAxis[index] !== 'undefined') {
          yaxe.min = w.globals.lastYAxis[index].min
          yaxe.max = w.globals.lastYAxis[index].max
        }
      }
    })
  }

  clear () {
    this.zoomPanSelection.destroy()
    if (this.toolbar) {
      this.toolbar.destroy()
    }

    this.animations = null
    this.annotations = null
    this.core = null
    this.grid = null
    this.series = null
    this.responsive = null
    this.theme = null
    this.formatters = null
    this.titleSubtitle = null
    this.legend = null
    this.dimensions = null
    this.options = null
    this.crosshairs = null
    this.zoomPanSelection = null
    this.toolbar = null
    this.w.globals.tooltip = null

    this.clearDomElements()
  }

  killSVG (draw) {
    return new Promise((resolve, reject) => {
      draw.each(function (i, children) {
        this.removeClass('*')
        this.off()
        this.stop()
      }, true)
      draw.ungroup()
      draw.clear()
      resolve('done')
    })
  }

  clearDomElements () {
    const domEls = this.w.globals.dom

    if (this.el !== null) {
      // remove all child elements - resetting the whole chart
      while (this.el.firstChild) {
        this.el.removeChild(this.el.firstChild)
      }
    }

    this.killSVG(domEls.Paper)
    domEls.Paper.remove()

    domEls.elWrap = null
    domEls.elGraphical = null
    domEls.elLegendWrap = null
    domEls.baseEl = null
    domEls.elGridRect = null
    domEls.elGridRectMask = null
    domEls.elDefs = null
  }

  /**
   * Destroy the chart instance by removing all elements which also clean up event listeners on those elements.
   */
  destroy () {
    this.clear()
    window.removeEventListener('resize', this.windowResizeHandler)
  }

  /**
   * Allows the user to provide data attrs in the element and the chart will render automatically when this method is called by searching for the elements containing 'data-apexcharts' attribute
   */
  static initOnLoad () {
    const els = document.querySelectorAll('[data-apexcharts]')

    for (let i = 0; i < els.length; i++) {
      const el = els[i]
      const options = JSON.parse(els[i].getAttribute('data-options'))
      const apexChart = new ApexCharts(el, options)
      apexChart.render()
    }
  }

  /**
   * This static method allows users to call chart methods without necessarily from the
   * instance of the chart in case user has assigned chartID to the targetted chart.
   * The chartID is used for mapping the instance stored in Apex._chartInstances global variable
   *
   * This is helpful in cases when you don't have reference of the chart instance
   * easily and need to call the method from anywhere.
   * For eg, in React/Vue applications when you have many parent/child components,
   * and need easy reference to other charts for performing dynamic operations
   *
   * @param {string} chartID - The unique identifier which will be used to call methods
   * on that chart instance
   * @param {function} fn - The method name to call
   * @param {object} opts - The parameters which are accepted in the original method will be passed here in the same order.
   */
  static exec (chartID, fn, ...opts) {
    const chart = this.getChartByID(chartID)

    if (!chart) return

    switch (fn) {
      case 'updateOptions':
      {
        return chart.updateOptions(...opts)
      }
      case 'updateSeries':
      {
        return chart.updateSeries(...opts)
      }
      case 'appendData':
      {
        return chart.appendData(...opts)
      }
      case 'addXaxisAnnotation':
      {
        return chart.addXaxisAnnotation(...opts)
      }
      case 'addYaxisAnnotation':
      {
        return chart.addYaxisAnnotation(...opts)
      }
      case 'addPointAnnotation':
      {
        return chart.addPointAnnotation(...opts)
      }
      case 'destroy':
      {
        return chart.destroy()
      }
    }
  }

  static merge (target, source) {
    return Utils.extend(target, source)
  }

  toggleSeries (seriesName) {
    const targetElement = this.series.getSeriesByName(seriesName)
    let seriesCnt = parseInt(targetElement.getAttribute('data:realIndex'))
    let isHidden = targetElement.classList.contains('apexcharts-series-collapsed')
    this.legend.toggleDataSeries(seriesCnt, isHidden)
  }

  setupEventHandlers () {
    const w = this.w
    const me = this

    let clickableArea = w.globals.dom.baseEl.querySelector(w.globals.chartClass)

    let eventList = [
      'mousedown',
      'mousemove',
      'touchstart',
      'touchmove',
      'mouseup',
      'touchend'
    ]
    for (let event of eventList) {
      clickableArea.addEventListener(
        event,
        function (e) {
          if ((e.type === 'mousedown' && e.which === 1)) {
            // todo - provide a mousedown event too
          } else if ((e.type === 'mouseup' && e.which === 1) || e.type === 'touchend') {
            if (typeof w.config.chart.events.click === 'function') {
              w.config.chart.events.click(e, me, w)
            }
            me.fireEvent('click', [e, me, w])
          }
        },
        { capture: false, passive: true }
      )
    }

    this.core.setupBrushHandler()
  }

  addXaxisAnnotation (opts, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }
    me.annotations.addXaxisAnnotationExternal(opts, pushToMemory, me)
  }

  addYaxisAnnotation (opts, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }
    me.annotations.addYaxisAnnotationExternal(opts, pushToMemory, me)
  }

  addPointAnnotation (opts, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }
    me.annotations.addPointAnnotationExternal(opts, pushToMemory, me)
  }

  // This method is never used internally and will be only called externally on the chart instance.
  // Hence, we need to keep all these elements in memory when the chart gets updated and redraw again
  addText (options, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }

    me.annotations.addText(options, pushToMemory, me)
  }

  getChartArea () {
    const el = this.w.globals.dom.baseEl.querySelector('.apexcharts-inner')

    return el
  }

  getSeriesTotalXRange (minX, maxX) {
    return this.coreUtils.getSeriesTotalsXRange(minX, maxX)
  }

  getHighestValueInSeries (seriesIndex = 0) {
    const range = new Range(this.ctx)
    const minYmaxY = range.getMinYMaxY(seriesIndex)

    return minYmaxY.highestY
  }

  getLowestValueInSeries (seriesIndex = 0) {
    const range = new Range(this.ctx)
    const minYmaxY = range.getMinYMaxY(seriesIndex)

    return minYmaxY.lowestY
  }

  getSeriesTotal () {
    return this.w.globals.seriesTotals
  }

  setLocale (localeName) {
    this.setCurrentLocaleValues(localeName)
  }

  setCurrentLocaleValues (localeName) {
    let locales = this.w.config.chart.locales

    // check if user has specified locales in global Apex variable
    // if yes - then extend those with local chart's locale
    if (window.Apex.chart && window.Apex.chart.locales && window.Apex.chart.locales.length > 0) {
      locales = this.w.config.chart.locales.concat(window.Apex.chart.locales)
    }

    // find the locale from the array of locales which user has set (either by chart.defaultLocale or by calling setLocale() method.)
    const selectedLocale = locales.find((c) => {
      return c.name === localeName
    })

    if (selectedLocale) {
      // create a complete locale object by extending defaults so you don't get undefined errors.
      let ret = Utils.extend(en, selectedLocale)

      // store these locale options in global var for ease access
      this.w.globals.locale = ret.options
    } else {
      throw new Error('Wrong locale name provided. Please make sure you set the correct locale name in options')
    }
  }

  paper () {
    return this.w.globals.dom.Paper
  }

  static getChartByID (chartID) {
    const c = Apex._chartInstances.find((ch) => {
      return ch.id === chartID
    })
    return c.chart
  }

  /**
   * Handle window resize and re-draw the whole chart.
   */
  windowResize () {
    clearTimeout(this.w.globals.resizeTimer)
    this.w.globals.resizeTimer = window.setTimeout(() => {
      this.w.globals.resized = true
      this.w.globals.dataChanged = false

      // we need to redraw the whole chart on window resize (with a small delay).
      this.update()
    }, 150)
  }
}

module.exports = ApexCharts
