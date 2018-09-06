import Annotations from './modules/Annotations'
import Animations from './modules/Animations'
import Base from './modules/Base'
import Config from './modules/settings/Config'
import Core from './modules/Core'
import Crosshairs from './modules/Crosshairs'
import Dimensions from './modules/Dimensions'
import Formatters from './modules/Formatters'
import Legend from './modules/Legend'
import Responsive from './modules/Responsive'
import Series from './modules/Series'
import Theme from './modules/Theme'
import Tooltip from './modules/tooltip/Tooltip'
import Utils from './utils/Utils'
import ZoomPanSelection from './modules/ZoomPanSelection'
import Scroller from './modules/Scroller'
import Title from './modules/Title'
import Toolbar from './modules/Toolbar'
import SubTitle from './modules/SubTitle'

require('./assets/apexcharts.css')

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
    this.core = new Core(el, this)

    this.w.globals.cuid = (Math.random() + 1).toString(36).substring(4)
    this.w.globals.chartID = this.w.config.chart.id ? this.w.config.chart.id : this.w.globals.cuid

    this.responsiveConfigOverrided = false

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
          Apex._chartInstances.push({id: this.w.globals.chartID, chart: this})
        }
        const beforeMount = this.w.config.chart.events.beforeMount
        if (typeof beforeMount === 'function') {
          beforeMount(this, this.w)
        }

        this.fireEvent('beforeMount', [this, this.w])

        let graphData = this.create(this.w.config.series)
        this.mount(graphData).then(() => {
          let animations = new Animations(this.ctx)
          animations.showDelayedElements()
          resolve(graphData)

          if (typeof this.w.config.chart.events.mounted === 'function') {
            this.w.config.chart.events.mounted(this, this.w)
          }

          this.fireEvent('mounted', [this, this.w])
        }).catch((e) => {
          reject(e)
          // handle error in case no data or element not found
        })
        window.addEventListener('resize', this.windowResizeHandler)
      } else {
        reject(new Error('Element not found'))
      }
    })
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
    if (!w.globals.events.hasOwnProperty(name)) { return }

    var index = w.globals.events[name].indexOf(handler)
    if (index !== -1) { w.globals.events[name].splice(index, 1) }
  };

  fireEvent (name, args) {
    const w = this.w

    if (!w.globals.events.hasOwnProperty(name)) { return }

    if (!args || !args.length) { args = [] }

    let evs = w.globals.events[name]
    let l = evs.length

    for (var i = 0; i < l; i++) {
      evs[i].apply(null, args)
    }
  }

  create (ser) {
    let w = this.w
    let gl = this.w.globals

    if (ser.length === 0) {
      const series = new Series(this.ctx)
      series.handleNoData()
      return null
    }

    if (!this.responsiveConfigOverrided) {
      const responsive = new Responsive(this.ctx)
      responsive.checkResponsiveConfig()
    }

    if (this.el === null) {
      return null
    }

    this.clear()
    this.core.setupElements()
    this.setupEventHandlers()
    this.core.parseData(ser)
    // this is a good time to set theme colors first
    let theme = new Theme(this.ctx)
    theme.init()
    // labelFormatters should be called before dimensions as in dimensions we need text labels width
    let formatters = new Formatters(this.ctx)
    formatters.setLabelFormatters()
    const title = new Title(this.ctx)
    title.drawTitle()
    const subtitle = new SubTitle(this.ctx)
    subtitle.drawSubtitle()
    // legend is calculated here before coreCalculations because it affects the plottable area
    new Legend(this.ctx).init()

    // coreCalculations will give the min/max range and yaxis/axis values. It should be called here to set series variable from config to globals
    if (gl.axisCharts) {
      this.core.coreCalculations()
      // as we have minX and maxX values, determine the default DateTimeFormat for time series
      formatters.setLabelFormatters()
    }

    // we need to generate yaxis for heatmap separately as we are not showing numerics there, but seriesNames. There are some tweaks which are required for heatmap to align labels correctly which are done in below function
    // Also we need to do this before calcuting Dimentions plotCoords() method of Dimensions
    formatters.heatmapLabelFormatters()

    // We got plottable area here, next task would be to calculate axis areas
    let dimensions = new Dimensions(this.ctx)
    dimensions.plotCoords()

    const xyRatios = this.core.xySettings()

    this.core.createGridMask()

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
    let w = this.w
    let me = this
    let series = new Series(me.ctx)
    const annotations = new Annotations(me.ctx)

    return new Promise(function (resolve, reject) {
      // no data to display
      if (me.el === null) {
        return reject(new Error('Not enough data to display or element not found'))
      } else if (graphData === null) {
        series.handleNoData()
        return null
      }

      me.core.drawAxis(
        w.config.chart.type,
        graphData.xyRatios
      )

      if (w.config.grid.position === 'back') {
        me.core.drawGrid()
      }

      if (w.config.annotations.position === 'back') {
        annotations.drawAnnotations()
      }

      let animations = new Animations(me.ctx)
      animations.showDelayedElements()

      if (graphData.elGraph instanceof Array) {
        for (let g = 0; g < graphData.elGraph.length; g++) {
          w.globals.dom.elGraphical.add(graphData.elGraph[g])
        }
      } else {
        w.globals.dom.elGraphical.add(graphData.elGraph)
      }

      if (w.config.grid.position === 'front') {
        me.core.drawGrid()
      }

      if (w.config.xaxis.crosshairs.position === 'front') {
        const crosshairs = new Crosshairs(me.ctx)
        crosshairs.drawXCrosshairs()
      }

      if (w.config.yaxis[0].crosshairs.position === 'front') {
        const crosshairs = new Crosshairs(me.ctx)
        crosshairs.drawYCrosshairs()
      }

      if (w.config.annotations.position === 'front') {
        annotations.drawAnnotations()
      }

      if (w.globals.allSeriesCollapsed) {
        series.handleNoData()
      } else {
        // draw tooltips at the end
        if (w.config.tooltip.enabled) {
          let tooltip = new Tooltip(me.ctx)
          tooltip.drawTooltip(graphData.xyRatios)
        }

        if (w.globals.axisCharts && w.globals.dataXY) {
          if (w.config.chart.zoom.enabled || w.config.chart.scroller.enabled || w.config.chart.selection.enabled) {
            const zoomPanSelection = new ZoomPanSelection(me.ctx)
            zoomPanSelection.init({
              xyRatios: graphData.xyRatios
            })
          }

          if (w.config.chart.scroller.enabled) {
            const scroller = new Scroller(me.ctx)
            scroller.init(graphData.xyRatios)
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

        if (w.config.chart.toolbar.show && !w.globals.allSeriesCollapsed) {
          const toolbar = new Toolbar(me.ctx)
          toolbar.createToolbar()
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

  /**
   * Allows users to update Options after the chart has rendered.
   *
   * @param {object} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   */
  updateOptions (options, redraw = false, animate = true) {
    return this.updateOptionsInternal(options, redraw, animate, true)
  }

  /**
   * private method to update Options.
   *
   * @param {object} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   * @param {boolean} makeDefaultConfig - should update the default config or not
   */
  updateOptionsInternal (options, redraw = false, animate = true, makeDefaultConfig = false) {
    let w = this.w
    this.w.config.chart.animations.dynamicAnimation.enabled = animate

    if (!redraw) {
      w.globals.resized = true
      let series = new Series(this.ctx)

      this.w.globals.dataChanged = true

      if (animate && this.w.globals.initialConfig.chart.animations.dynamicAnimation.enabled) {
        series.getPreviousPaths()
      }
    }

    if (options && typeof options === 'object') {
      const responsive = new Responsive(this.ctx)
      responsive.checkResponsiveConfig()
      this.responsiveConfigOverrided = true

      const config = new Config(options)

      if (options.yaxis) {
        options = config.extendYAxis(options)
      }
      if (options.annotations) {
        if (options.annotations.yaxis) {
          options = config.extendYAxisAnnotations(options)
        }
        if (options.annotations.xaxis) {
          options = config.extendXAxisAnnotations(options)
        }
        if (options.annotations.points) {
          options = config.extendPointAnnotations(options)
        }
      }

      w.config = Utils.extend(w.config, options)

      if (makeDefaultConfig) {
        w.globals.initialConfig = Utils.extend({}, w.config)
        w.globals.initialSeries = JSON.parse(JSON.stringify(w.globals.initialConfig.series))
      }
    }

    return this.update()
  }

  /**
   * Allows users to update Series after the chart has rendered.
   *
   * @param {array} series - New series which will override the existing
   */
  updateSeries (newSeries = [], animate = true, makeDefaultConfig = false) {
    return this.updateSeriesInternal(newSeries, animate, makeDefaultConfig)
  }

  /**
   * Private method to update Series.
   *
   * @param {array} series - New series which will override the existing
   */
  updateSeriesInternal (newSeries, animate, makeDefaultConfig) {
    const w = this.w
    this.w.config.chart.animations.dynamicAnimation.enabled = animate
    let series = new Series(this.ctx)

    w.globals.dataChanged = true

    // while updateing pie/donut series, user completely changed the series length too
    // if (!w.globals.axisCharts && newSeries.length !== w.globals.series.length) {
    //   w.globals.dataChanged = false
    //   animate = false
    // }

    if (animate) {
      series.getPreviousPaths()
    }

    w.config.series = newSeries.slice()
    if (makeDefaultConfig) {
      w.globals.initialConfig = Utils.extend({}, w.config)
      w.globals.initialSeries = JSON.parse(JSON.stringify(w.globals.initialConfig.series))
    }

    return this.update()
  }

  /**
   * Allows users to append Data to series.
   *
   * @param {array} newData - New data in the same format as series
   */
  appendData (newData) {
    let me = this

    let series = new Series(me.ctx)

    me.w.globals.dataChanged = true

    series.getPreviousPaths()

    let newSeries = me.w.config.series.slice()

    for (let i = 0; i < newSeries.length; i++) {
      if (typeof newData[i] !== 'undefined') {
        for (let j = 0; j < newData[i].data.length; j++) {
          newSeries[i].data.push(newData[i].data[j])
        }
      }
    }
    me.w.config.series = newSeries

    me.w.globals.initialConfig = Utils.extend({}, me.w.config)
    me.w.globals.initialSeries = JSON.parse(JSON.stringify(me.w.globals.initialConfig.series))

    return this.update()
  }

  update () {
    const me = this
    return new Promise((resolve, reject) => {
      const graphData = me.create(me.w.config.series)

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

  clear () {
    if (this.el !== null) {
      // remove all child elements - resetting the whole chart
      while (this.el.firstChild) {
        this.el.removeChild(this.el.firstChild)
      }
    }
    this.w.globals.dom = {} // empty the property which contains all DOM nodes
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
   * @param {object} opts - the same arguments of the fn which are used directly even when calling the methods on class instance
   */
  static exec (chartID, fn, opts) {
    const chart = this.getChartByID(chartID)
    if (!chart) return

    switch (fn) {
      case 'updateOptions': {
        return chart.updateOptions(opts)
      }
      case 'updateSeries': {
        return chart.updateSeries(opts)
      }
      case 'appendData': {
        return chart.appendData(opts)
      }
      case 'addXaxisAnnotation': {
        return chart.addXaxisAnnotation(opts)
      }
      case 'addYaxisAnnotation': {
        return chart.addYaxisAnnotation(opts)
      }
      case 'addPointAnnotation': {
        return chart.addPointAnnotation(opts)
      }
      case 'destroy': {
        return chart.destroy()
      }
    }
  }

  static merge (target, source) {
    return Utils.extend(target, source)
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
        false
      )
    }
  }

  addXaxisAnnotation (opts, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }
    const annotations = new Annotations(me.ctx)
    annotations.addXaxisAnnotationExternal(opts, pushToMemory, me)
  }

  addYaxisAnnotation (opts, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }
    const annotations = new Annotations(me.ctx)
    annotations.addYaxisAnnotationExternal(opts, pushToMemory, me)
  }

  addPointAnnotation (opts, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }
    const annotations = new Annotations(me.ctx)
    annotations.addPointAnnotationExternal(opts, pushToMemory, me)
  }

  // This method is never used internally and will be only called externally on the chart instance.
  // Hence, we need to keep all these elements in memory when the chart gets updated and redraw again
  addText (options, pushToMemory = true, context = undefined) {
    let me = this
    if (context) {
      me = context
    }

    const annotations = new Annotations(me.ctx)
    annotations.addText(options, pushToMemory, me)
  }

  getChartArea () {
    const paper = this.paper()
    const el = paper.select('.apexcharts-inner')

    return el
  }

  getSeriesTotalXRange (minX, maxX) {
    return this.core.getSeriesTotalsXRange(minX, maxX)
  }

  getSeriesTotal () {
    return this.w.globals.seriesTotals
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
      let graphData = this.create(this.w.config.series)
      this.mount(graphData)
    }, 150)
  }
}

module.exports = ApexCharts
