// @ts-check
import Base from './modules/Base'
import CoreUtils from './modules/CoreUtils'
import DataLabels from './modules/DataLabels'
import PerformanceCache from './utils/PerformanceCache'
import Defaults from './modules/settings/Defaults'
import Grid from './modules/axes/Grid'
import Markers from './modules/Markers'
import Range from './modules/Range'
import Utils from './utils/Utils'
import { getThemePalettes } from './utils/ThemePalettes.js'
import XAxis from './modules/axes/XAxis'
import YAxis from './modules/axes/YAxis'
import InitCtxVariables from './modules/helpers/InitCtxVariables'
import Destroy from './modules/helpers/Destroy'
import { register } from './modules/ChartFactory'
import { addResizeListener, removeResizeListener } from './utils/Resize'
import apexCSS from './assets/apexcharts.css'
import { Environment } from './utils/Environment.js'
import { BrowserAPIs } from './ssr/BrowserAPIs.js'

/**
 *
 * @module ApexCharts
 **/

export default class ApexCharts {
  // Module properties set dynamically by InitCtxVariables.initModules().
  // Declared as typed class fields so @ts-check resolves them throughout the
  // class body without errors. Each field typed as `any` since the modules are
  // plain objects whose specific shapes are not yet typed.
  /** @type {any} */ core
  /** @type {any} */ responsive
  /** @type {any} */ axes
  /** @type {any} */ grid
  /** @type {any} */ graphics
  /** @type {any} */ coreUtils
  /** @type {any} */ crosshairs
  /** @type {any} */ events
  /** @type {any} */ fill
  /** @type {any} */ localization
  /** @type {any} */ options
  /** @type {any} */ series
  /** @type {any} */ theme
  /** @type {any} */ formatters
  /** @type {any} */ titleSubtitle
  /** @type {any} */ dimensions
  /** @type {any} */ updateHelpers
  /** @type {any} */ tooltip
  /** @type {any} */ data
  /** @type {any} */ animations
  /** @type {any} */ exports
  /** @type {any} */ legend
  /** @type {any} */ toolbar
  /** @type {any} */ zoomPanSelection
  /** @type {any} */ keyboardNavigation
  /** @type {any} */ annotations
  /** @type {any} */ timeScale
  /** @type {any} */ _keyboardNavigation
  /** @type {any} */ windowResizeHandler
  /** @type {any} */ parentResizeHandler
  /** @type {string[]} */ publicMethods = []
  /** @type {string[]} */ eventList = []
  /** @type {any} */ config

  /**
   * Creates a new ApexCharts instance.
   *
   * @param {HTMLElement} el - The DOM element to render the chart into.
   * @param {ApexOptions} opts - Chart configuration options.
   */
  constructor(el, opts) {
    this.opts = opts
    this.ctx = this

    // Pass the user supplied options to the Base Class where these options will be extended with defaults. The returned object from Base Class will become the config object in the entire codebase.
    this.w = new Base(opts).init()

    this.el = el

    this.w.globals.cuid = Utils.randomId()
    this.w.globals.chartID = this.w.config.chart.id
      ? Utils.escapeString(this.w.config.chart.id)
      : this.w.globals.cuid

    const initCtx = new InitCtxVariables(this)
    initCtx.initModules()

    this.lastUpdateOptions = null

    this.create = this.create.bind(this)

    // bind event handlers in browser environment
    if (Environment.isBrowser()) {
      this.windowResizeHandler = this._windowResizeHandler.bind(this)
      this.parentResizeHandler = this._parentResizeCallback.bind(this)
    }
  }

  /**
   * Renders the chart. Must be called once after construction.
   *
   * @returns {Promise<ApexCharts>} Resolves with the chart instance after mount.
   */
  render() {
    if (!this.w?.config?.chart) {
      return Promise.reject(
        new Error(
          'ApexCharts: chart configuration is missing or invalid. Ensure the options object includes a `chart` property.',
        ),
      )
    }
    // main method
    return new Promise((resolve, reject) => {
      // only draw chart, if element found
      if (Utils.elementExists(this.el)) {
        if (typeof Apex._chartInstances === 'undefined') {
          Apex._chartInstances = []
        }
        if (this.w.config.chart.id) {
          Apex._chartInstances.push({
            id: this.w.globals.chartID,
            group: this.w.config.chart.group,
            chart: this,
          })
        }

        // set the locale here
        this.setLocale(this.w.config.chart.defaultLocale)
        const beforeMount = this.w.config.chart.events.beforeMount
        if (typeof beforeMount === 'function') {
          beforeMount(this, this.w)
        }

        this.events.fireEvent('beforeMount', [this, this.w])

        // add event listeners in browser environment
        if (Environment.isBrowser()) {
          window.addEventListener('resize', this.windowResizeHandler)
          addResizeListener(
            /** @type {HTMLElement} */ (this.el.parentNode),
            this.parentResizeHandler,
          )

          const rootNode = /** @type {any} */ (
            this.el.getRootNode && this.el.getRootNode()
          )
          const inShadowRoot = Utils.is('ShadowRoot', rootNode)
          const doc = this.el.ownerDocument
          let css = inShadowRoot
            ? rootNode.getElementById('apexcharts-css')
            : doc.getElementById('apexcharts-css')

          if (!css) {
            css = BrowserAPIs.createElementNS(
              'http://www.w3.org/1999/xhtml',
              'style',
            )
            css.id = 'apexcharts-css'
            css.textContent = apexCSS
            const nonce = this.opts.chart?.nonce || this.w.config.chart.nonce
            if (nonce) {
              css.setAttribute('nonce', nonce)
            }

            if (inShadowRoot) {
              // We are in Shadow DOM, add to shadow root
              rootNode.prepend(css)
            } else if (this.w.config.chart.injectStyleSheet !== false) {
              // Add to <head> of element's document
              doc.head.appendChild(css)
            }
          }
        }

        const graphData = this.create(this.w.config.series, {})
        if (!graphData) return resolve(this)
        this.mount(graphData)
          .then(() => {
            if (typeof this.w.config.chart.events.mounted === 'function') {
              this.w.config.chart.events.mounted(this, this.w)
            }

            this.events.fireEvent('mounted', [this, this.w])
            // @ts-ignore — graphData is the internal render result, resolve type is widened
            resolve(graphData)
          })
          .catch((e) => {
            // handle error in case no data or element not found
            const enriched = e instanceof Error ? e : new Error(String(e))
            const err = /** @type {any} */ (enriched)
            err.chartId = this.w?.globals?.chartID
            err.el = this.el
            reject(enriched)
          })
      } else {
        reject(new Error('Element not found'))
      }
    })
  }

  /**
   * @param {any[]} ser
   * @param {object} opts
   */
  create(ser, opts) {
    const w = this.w

    // Core modules are preserved across updates (Destroy.clear skips them when
    // isUpdating=true). Only re-init when a full destroy() was called first.
    if (!this.core) {
      const initCtx = new InitCtxVariables(this)
      initCtx.initModules()
    }
    const gl = this.w.globals

    gl.noData = false
    gl.animationEnded = false

    if (!Utils.elementExists(this.el)) {
      gl.animationEnded = true
      return null
    }

    this.responsive.checkResponsiveConfig(opts)

    // @ts-ignore — convertedCatToNumeric is an internal property set by Defaults
    if (w.config.xaxis.convertedCatToNumeric) {
      const defaults = new Defaults(w.config)
      defaults.convertCatToNumericXaxis(w.config, this.ctx)
    }

    this.core.setupElements()

    if (w.config.chart.type === 'treemap') {
      w.config.grid.show = false
      w.config.yaxis[0].show = false
    }

    if (gl.svgWidth === 0) {
      // if the element is hidden, skip drawing
      gl.animationEnded = true
      return null
    }

    let series = ser
    /**
     * @param {Record<string, any>} s
     * @param {number} realIndex
     */
    ser.forEach((s, realIndex) => {
      if (s.hidden) {
        series = this.legend.legendHelpers.getSeriesAfterCollapsing({
          realIndex,
        })
      }
    })

    const combo = CoreUtils.checkComboSeries(series, w.config.chart.type)
    gl.comboCharts = combo.comboCharts
    gl.comboBarCount = combo.comboBarCount

    /**
     * @param {Record<string, any>} s
     */
    const allSeriesAreEmpty = series.every((s) => s.data && s.data.length === 0)

    if (
      series.length === 0 ||
      (allSeriesAreEmpty && gl.collapsedSeries.length < 1)
    ) {
      this.series.handleNoData()
    }

    if (Environment.isBrowser()) {
      this.events.setupEventHandlers()
    }

    // Handle the data inputted by user and set some of the global variables (for eg, if data is datetime / numeric / category). Don't calculate the range / min / max at this time
    // Phase 1: return value is captured; named writers are stubs (mutations already wrote to gl).
    // Phase 2: writers will route each slice to its dedicated w.* namespace.
    const parsedState = this.data.parseData(series)
    this._writeParsedSeriesData(parsedState.seriesData)
    this._writeParsedRangeData(parsedState.rangeData)
    this._writeParsedCandleData(parsedState.candleData)
    this._writeParsedLabelData(parsedState.labelData)
    this._writeParsedAxisFlags(parsedState.axisFlags)

    // this is a good time to set theme colors first
    this.theme.init()

    // as markers accepts array, we need to setup global markers for easier access
    const markers = new Markers(this.w, this)
    markers.setGlobalMarkerSize()

    // labelFormatters should be called before dimensions as in dimensions we need text labels width
    this.formatters.setLabelFormatters()
    this.titleSubtitle.draw()

    // legend is calculated here before coreCalculations because it affects the plottable area
    // if there is some data to show or user collapsed all series, then proceed drawing legend
    if (
      !gl.noData ||
      gl.collapsedSeries.length === w.seriesData.series.length ||
      w.config.legend.showForSingleSeries
    ) {
      this.legend?.init()
    }

    // check whether in multiple series, all series share the same X
    this.series.hasAllSeriesEqualX()

    // coreCalculations will give the min/max range and yaxis/axis values. It should be called here to set series variable from config to globals
    if (gl.axisCharts) {
      this.core.coreCalculations()
      if (w.config.xaxis.type !== 'category') {
        // as we have minX and maxX values, determine the default DateTimeFormat for time series
        this.formatters.setLabelFormatters()
      }
      if (this.ctx.toolbar) {
        this.ctx.toolbar.minX = w.globals.minX
        this.ctx.toolbar.maxX = w.globals.maxX
      }
    }

    // we need to generate yaxis for heatmap separately as we are not showing numerics there, but seriesNames. There are some tweaks which are required for heatmap to align labels correctly which are done in below function
    // Also we need to do this before calculating Dimensions plotCoords() method of Dimensions
    this.formatters.heatmapLabelFormatters()

    // get the largest marker size which will be needed in dimensions calc
    const coreUtils = new CoreUtils(this.w)
    coreUtils.getLargestMarkerSize()

    // We got plottable area here, next task would be to calculate axis areas
    // Phase 1: return value captured; named writer is a stub (no-op).
    // Phase 2: writer will route layout slice to w.layout namespace.
    const layoutState = this.dimensions.plotCoords()
    this._writeLayoutCoords(layoutState.layout)

    const xyRatios = this.core.xySettings()

    this.grid.createGridMask()

    const elGraph = this.core.plotChartType(series, xyRatios)

    const dataLabels = new DataLabels(this.w, this)
    dataLabels.bringForward()
    if (w.config.dataLabels.background.enabled) {
      dataLabels.dataLabelsBackground()
    }

    // after all the drawing calculations, shift the graphical area (actual charts/bars) excluding legends
    this.core.shiftGraphPosition()

    if (w.globals.dataPoints > 50) {
      w.dom.elWrap.classList.add('apexcharts-disable-transitions')
    }

    const dim = {
      plot: {
        left: w.layout.translateX,
        top: w.layout.translateY,
        width: w.layout.gridWidth,
        height: w.layout.gridHeight,
      },
    }

    return {
      elGraph,
      xyRatios,
      dimensions: dim,
    }
  }

  /**
   * @param {any} graphData
   */
  mount(graphData = null) {
    const me = this
    const w = me.w

    return new Promise((resolve, reject) => {
      // no data to display
      if (me.el === null) {
        return reject(
          new Error('Not enough data to display or target element not found'),
        )
      } else if (graphData === null || w.globals.allSeriesCollapsed) {
        me.series.handleNoData()
      }

      me.grid = new Grid(me.w, me)
      const elgrid = me.grid.drawGrid()

      const AnnotationsCtor =
        InitCtxVariables._featureRegistry.get('annotations')
      me.annotations = AnnotationsCtor
        ? new AnnotationsCtor(me.w, {
            theme: me.theme,
            timeScale: me.timeScale,
          })
        : null
      me.annotations?.drawImageAnnos()
      me.annotations?.drawTextAnnos()

      if (w.config.grid.position === 'back') {
        if (elgrid) {
          w.dom.elGraphical.add(elgrid.el)
        }
        if (elgrid?.elGridBorders?.node) {
          w.dom.elGraphical.add(elgrid.elGridBorders)
        }
      }

      if (Array.isArray(graphData.elGraph)) {
        for (let g = 0; g < graphData.elGraph.length; g++) {
          w.dom.elGraphical.add(graphData.elGraph[g])
        }
      } else {
        w.dom.elGraphical.add(graphData.elGraph)
      }

      if (w.config.grid.position === 'front') {
        if (elgrid) {
          w.dom.elGraphical.add(elgrid.el)
        }
        if (elgrid?.elGridBorders?.node) {
          w.dom.elGraphical.add(elgrid.elGridBorders)
        }
      }

      if (w.config.xaxis.crosshairs.position === 'front') {
        me.crosshairs.drawXCrosshairs()
      }

      if (w.config.yaxis[0].crosshairs.position === 'front') {
        me.crosshairs.drawYCrosshairs()
      }

      if (w.config.chart.type !== 'treemap') {
        me.axes.drawAxis(w.config.chart.type, elgrid)
      }

      const xAxis = new XAxis(this.w, this.ctx, elgrid)
      const yaxis = new YAxis(
        this.w,
        { theme: this.theme, timeScale: this.timeScale },
        elgrid,
      )
      if (elgrid !== null) {
        xAxis.xAxisLabelCorrections()
        yaxis.setYAxisTextAlignments()

        // @ts-ignore — yaxis is always normalised to ApexYAxis[] by Config.init()
        w.config.yaxis.map((yaxe, index) => {
          if (w.globals.ignoreYAxisIndexes.indexOf(index) === -1) {
            yaxis.yAxisTitleRotate(index, yaxe.opposite)
          }
        })
      }

      me.annotations?.drawAxesAnnotations()

      if (!w.globals.noData) {
        // draw tooltips at the end (browser only — tooltip is DOM-heavy)
        if (
          Environment.isBrowser() &&
          w.config.tooltip.enabled &&
          !w.globals.noData
        ) {
          me.w.globals.tooltip?.drawTooltip(graphData.xyRatios)
        }

        if (
          w.config.chart.accessibility.enabled &&
          w.config.chart.accessibility.keyboard.enabled &&
          w.config.chart.accessibility.keyboard.navigation.enabled
        ) {
          me.keyboardNavigation?.init()
        }

        if (
          Environment.isBrowser() &&
          w.globals.axisCharts &&
          (w.axisFlags.isXNumeric ||
            /** @type {Record<string,any>} */ (w.config.xaxis)
              .convertedCatToNumeric ||
            w.axisFlags.isRangeBar)
        ) {
          if (
            w.config.chart.zoom.enabled ||
            (w.config.chart.selection && w.config.chart.selection.enabled) ||
            // @ts-ignore — chart.pan is an internal toolbar config property
            (w.config.chart.pan && w.config.chart.pan.enabled)
          ) {
            me.zoomPanSelection?.init({
              xyRatios: graphData.xyRatios,
            })
          }
        } else {
          const tools = w.config.chart.toolbar.tools
          const toolsArr = [
            'zoom',
            'zoomin',
            'zoomout',
            'selection',
            'pan',
            'reset',
          ]
          toolsArr.forEach((t) => {
            tools[t] = false
          })
        }

        if (w.config.chart.toolbar.show && !w.globals.allSeriesCollapsed) {
          me.toolbar?.createToolbar()
        }
      }

      if (w.globals.memory.methodsToExec.length > 0) {
        w.globals.memory.methodsToExec.forEach((fn) => {
          fn.method(fn.params, false, fn.context)
        })
      }

      if (!w.globals.axisCharts && !w.globals.noData) {
        me.core.resizeNonAxisCharts()
      }
      resolve(me)
    })
  }

  /**
   * Destroys the chart instance, removes all DOM elements and event listeners.
   * After calling this, the instance should not be used again.
   */
  destroy() {
    // remove event listeners in browser environment
    if (Environment.isBrowser()) {
      window.removeEventListener('resize', this.windowResizeHandler)
      removeResizeListener(
        /** @type {Element} */ (this.el.parentNode),
        this.parentResizeHandler,
      )
    }
    // remove the chart's instance from the global Apex._chartInstances
    const chartID = this.w.config.chart.id
    if (chartID) {
      /**
       * @param {Record<string, any>} c
       * @param {number} i
       */
      Apex._chartInstances.forEach(
        (/** @type {any} */ c, /** @type {any} */ i) => {
          if (c.id === Utils.escapeString(chartID)) {
            Apex._chartInstances.splice(i, 1)
          }
        },
      )
    }
    if (this._keyboardNavigation) {
      this._keyboardNavigation.destroy()
    }
    new Destroy(this.ctx).clear({ isUpdating: false })
  }

  /**
   * Merges new options into the existing config and re-renders the chart.
   *
   * @param {ApexOptions} options - Partial config object merged with the existing config.
   * @param {boolean} [redraw=false] - When true, redraws the chart from scratch instead of animating from previous paths.
   * @param {boolean} [animate=true] - Whether to animate the update.
   * @param {boolean} [updateSyncedCharts=true] - Whether to propagate the update to charts in the same group.
   * @param {boolean} [overwriteInitialConfig=true] - When true, replaces the stored initial config used by resetSeries().
   * @returns {Promise<ApexCharts>} Resolves with the chart instance after re-render.
   */
  updateOptions(
    options,
    redraw = false,
    animate = true,
    updateSyncedCharts = true,
    overwriteInitialConfig = true,
  ) {
    const w = this.w

    // when called externally, clear some global variables
    // fixes apexcharts.js#1488
    w.interact.selection = undefined

    // try shallow comparison first before expensive JSON.stringify
    if (this.lastUpdateOptions) {
      // quick shallow check on top-level keys
      if (Utils.shallowEqual(this.lastUpdateOptions, options)) {
        return Promise.resolve(this)
      }

      // If shallow check fails, do deep comparison only for critical paths
      // check series separately
      if (options.series && this.lastUpdateOptions.series) {
        if (
          JSON.stringify(this.lastUpdateOptions.series) ===
          JSON.stringify(options.series)
        ) {
          // series unchanged, check other options
          const optionsWithoutSeries = { ...options }
          const lastWithoutSeries = { ...this.lastUpdateOptions }
          delete optionsWithoutSeries.series
          delete lastWithoutSeries.series

          if (Utils.shallowEqual(optionsWithoutSeries, lastWithoutSeries)) {
            return Promise.resolve(this)
          }
        }
      }
    }

    if (options.series) {
      this.data.resetParsingFlags()

      this.series.resetSeries(false, true, false)
      if (options.series.length && options.series[0].data) {
        /**
         * @param {Record<string, any>} s
         * @param {number} i
         */
        options.series = options.series.map(
          (/** @type {any} */ s, /** @type {any} */ i) => {
            return this.updateHelpers._extendSeries(s, i)
          },
        )
      }

      // user updated the series via updateOptions() function.
      // Hence, we need to reset axis min/max to avoid zooming issues
      this.updateHelpers.revertDefaultAxisMinMax()
    }
    // user has set x-axis min/max externally - hence we need to forcefully set the xaxis min/max
    if (options.xaxis) {
      options = this.updateHelpers.forceXAxisUpdate(options)
    }
    if (options.yaxis) {
      options = this.updateHelpers.forceYAxisUpdate(options)
    }
    if (w.globals.collapsedSeriesIndices.length > 0) {
      this.series.clearPreviousPaths()
    }
    /* update theme mode#459 */
    if (options.theme) {
      options = this.theme.updateThemeOptions(options)
    }
    return this.updateHelpers._updateOptions(
      options,
      redraw,
      animate,
      updateSyncedCharts,
      overwriteInitialConfig,
    )
  }

  /**
   * Replaces the chart's series data and re-renders.
   *
   * @param {ApexAxisChartSeries | ApexNonAxisChartSeries} [newSeries=[]] - The replacement series array.
   * @param {boolean} [animate=true] - Whether to animate the update.
   * @param {boolean} [overwriteInitialSeries=true] - When true, replaces the stored initial series used by resetSeries().
   * @returns {Promise<ApexCharts>} Resolves with the chart instance after re-render.
   */
  updateSeries(newSeries = [], animate = true, overwriteInitialSeries = true) {
    this.data.resetParsingFlags()

    this.series.resetSeries(false)
    this.updateHelpers.revertDefaultAxisMinMax()
    return this.updateHelpers._updateSeries(
      newSeries,
      animate,
      overwriteInitialSeries,
    )
  }

  /**
   * Appends a new series to the existing series array and re-renders.
   *
   * @param {ApexAxisChartSeries[0] | ApexNonAxisChartSeries} newSerie - The series object to append.
   * @param {boolean} [animate=true] - Whether to animate the update.
   * @param {boolean} [overwriteInitialSeries=true] - When true, replaces the stored initial series used by resetSeries().
   * @returns {Promise<ApexCharts>} Resolves with the chart instance after re-render.
   */
  appendSeries(newSerie, animate = true, overwriteInitialSeries = true) {
    this.data.resetParsingFlags()

    const newSeries = this.w.config.series.slice()
    newSeries.push(/** @type {any} */ (newSerie))
    this.series.resetSeries(false)
    this.updateHelpers.revertDefaultAxisMinMax()
    return this.updateHelpers._updateSeries(
      newSeries,
      animate,
      overwriteInitialSeries,
    )
  }

  /**
   * Appends data points to existing series without replacing them.
   * Each element of `newData` corresponds to the series at the same index.
   *
   * @param {Array<{ data: any[] }>} newData - Data to append, in the same shape as series[].data.
   * @param {boolean} [overwriteInitialSeries=true] - When true, updates the stored initial series used by resetSeries().
   * @returns {Promise<ApexCharts>} Resolves with the chart instance after re-render.
   */
  appendData(newData, overwriteInitialSeries = true) {
    const me = this

    me.data.resetParsingFlags()
    me.w.globals.dataChanged = true
    me.series.getPreviousPaths()

    const newSeries = me.w.config.series.slice()

    for (let i = 0; i < newSeries.length; i++) {
      if (newData[i] !== null && typeof newData[i] !== 'undefined') {
        // series entries are always ApexAxisChartSeries objects here
        const srcSerie = /** @type {any} */ (newData[i])
        const dstSerie = /** @type {any} */ (newSeries[i])
        for (let j = 0; j < srcSerie.data.length; j++) {
          dstSerie.data.push(srcSerie.data[j])
        }
      }
    }
    me.w.config.series = newSeries
    if (overwriteInitialSeries) {
      me.w.globals.initialSeries = Utils.clone(me.w.config.series)
    }

    return this.update()
  }

  /**
   * @param {object} [options]
   */
  update(options) {
    return new Promise((resolve, reject) => {
      if (
        this.lastUpdateOptions &&
        JSON.stringify(this.lastUpdateOptions) === JSON.stringify(options)
      ) {
        // Options are identical, skip the update
        return resolve(this)
      }

      this.lastUpdateOptions = Utils.clone(options)

      new Destroy(this.ctx).clear({ isUpdating: true })

      const graphData = this.create(this.w.config.series, options ?? {})
      if (!graphData) return resolve(this)
      this.mount(graphData)
        .then(() => {
          if (typeof this.w.config.chart.events.updated === 'function') {
            this.w.config.chart.events.updated(this, this.w)
          }
          this.events.fireEvent('updated', [this, this.w])

          this.w.globals.isDirty = true

          resolve(this)
        })
        .catch((e) => {
          reject(e)
        })
    })
  }

  /**
   * Fast update path for data-only series changes.
   *
   * Skips rebuilding grid, axes, dimensions, legend, annotations, tooltip DOM,
   * and toolbar. Only recalculates scales and replots the series paths.
   * Called automatically by _updateSeries() when the fast path is eligible.
   *
   * @param {boolean} animate - Whether to animate the update.
   * @returns {Promise<ApexCharts>} Resolves with the chart instance.
   */
  fastUpdate(animate) {
    return new Promise((resolve, reject) => {
      try {
        const w = this.w
        const gl = w.globals

        gl.shouldAnimate = animate
        gl.dataChanged = true
        gl.animationEnded = false

        // Invalidate per-render selector cache (PerformanceCache uses TTL + render invalidation)
        PerformanceCache.invalidateSelectors(w)

        // Reset only axis bounds and caches — preserve already-parsed series data.
        // (core.resetGlobals() would wipe w.seriesData.series which was parsed in _updateSeries)
        const gl2 = w.globals
        gl2.maxY = -Number.MAX_VALUE
        gl2.minY = Number.MIN_VALUE
        gl2.minYArr = []
        gl2.maxYArr = []
        gl2.maxX = -Number.MAX_VALUE
        gl2.minX = Number.MAX_VALUE
        gl2.initialMaxX = -Number.MAX_VALUE
        gl2.initialMinX = Number.MAX_VALUE
        gl2.yAxisScale = []
        gl2.xAxisScale = null
        gl2.xAxisTicksPositions = []
        gl2.xRange = 0
        gl2.yRange = []
        gl2.zRange = 0
        gl2.xTickAmount = 0
        gl2.multiAxisTickAmount = 0
        gl2.pointsArray = []
        gl2.dataLabelsRects = []
        gl2.lastDrawnDataLabelsIndexes = []
        gl2.textRectsCache = new Map()
        gl2.domCache = new Map()
        gl2.cachedSelectors = {}
        gl2.disableZoomIn = false
        gl2.disableZoomOut = false

        // Recompute axis min/max and scale ranges from new data.
        if (gl.axisCharts) {
          this.core.coreCalculations()
          if (w.config.xaxis.type !== 'category') {
            this.formatters.setLabelFormatters()
          }
        }

        // Compute per-pixel ratios from the existing layout.
        const xyRatios = this.core.xySettings()

        // Remove only the series and data-label elements from elGraphical.
        // Grid, axes, crosshairs, and masks are preserved in place.
        const innerEl = w.dom.elGraphical.node
        const toRemove = innerEl.querySelectorAll(
          '.apexcharts-series, .apexcharts-datalabels, .apexcharts-datalabels-background',
        )
        /**
         * @param {Element} el
         */
        toRemove.forEach((/** @type {any} */ el) =>
          el.parentNode?.removeChild(el),
        )

        // Redraw series paths into the existing graphical container.
        const elGraph = this.core.plotChartType(w.config.series, xyRatios)

        // Insert series elements. When grid is 'front', they go before the grid;
        // otherwise they simply append (grid is already at the back or absent).
        const gridEl = innerEl.querySelector('.apexcharts-grid')
        const graphs = Array.isArray(elGraph) ? elGraph : [elGraph]
        if (gridEl && w.config.grid.position === 'front') {
          // Insert each series group before the grid group
          graphs.forEach((g) => {
            const node = g && g.node ? g.node : g
            if (node) innerEl.insertBefore(node, gridEl)
          })
        } else {
          graphs.forEach((g) => {
            w.dom.elGraphical.add(g)
          })
        }

        // Bring data labels forward and apply backgrounds if configured.
        const dataLabels = new DataLabels(w, this)
        dataLabels.bringForward()
        if (w.config.dataLabels.background.enabled) {
          dataLabels.dataLabelsBackground()
        }

        // Reattach tooltip event listeners to new series elements.
        if (Environment.isBrowser() && w.config.tooltip.enabled && !gl.noData) {
          w.globals.tooltip?.drawTooltip(xyRatios)
        }

        if (typeof w.config.chart.events.updated === 'function') {
          w.config.chart.events.updated(this, w)
        }
        this.events.fireEvent('updated', [this, w])

        gl.isDirty = true
        resolve(this)
      } catch (e) {
        reject(e)
      }
    })
  }

  /**
   * Returns all charts in the same `chart.group` (including this instance),
   * used to synchronise zoom/pan across grouped charts.
   *
   * @returns {ApexCharts[]}
   */
  getSyncedCharts() {
    const chartGroups = this.getGroupedCharts()
    let allCharts = /** @type {ApexCharts[]} */ ([this])
    if (chartGroups.length) {
      allCharts = []
      chartGroups.forEach((ch) => {
        allCharts.push(ch)
      })
    }

    return allCharts
  }

  /**
   * Returns all charts in the same `chart.group`, excluding this instance.
   * Used internally to apply hover/zoom effects to sibling charts.
   *
   * @returns {ApexCharts[]}
   */
  getGroupedCharts() {
    return (
      Apex._chartInstances
        .filter((/** @type {any} */ ch) => {
          if (ch.group) {
            return true
          }
        })
        /**
         * @param {Record<string, any>} ch
         */
        .map((/** @type {any} */ ch) =>
          this.w.config.chart.group === ch.group ? ch.chart : this,
        )
    )
  }

  /**
   * Retrieves a rendered chart instance by its `chart.id` config value.
   *
   * @param {string} id - The chart ID set via `chart.id` in options.
   * @returns {ApexCharts | undefined}
   */
  static getChartByID(id) {
    const chartId = Utils.escapeString(id)
    if (!Apex._chartInstances) return undefined

    /**
     * @param {Record<string, any>} ch
     */
    const c = Apex._chartInstances.filter(
      (/** @type {any} */ ch) => ch.id === chartId,
    )[0]
    return c && c.chart
  }

  /**
   * Scans the document for elements with a `data-apexcharts` attribute and
   * `data-options` JSON, then renders a chart in each one automatically.
   * Useful for non-framework HTML pages.
   */
  static initOnLoad() {
    const els = document.querySelectorAll('[data-apexcharts]')

    for (let i = 0; i < els.length; i++) {
      const el = /** @type {HTMLElement} */ (els[i])
      const options = JSON.parse(els[i].getAttribute('data-options') ?? '')
      const apexChart = new ApexCharts(el, options)
      apexChart.render()
    }
  }

  /**
   * This static method allows users to call chart methods without necessarily from the
   * instance of the chart in case user has assigned chartID to the targeted chart.
   * The chartID is used for mapping the instance stored in Apex._chartInstances global variable
   *
   * This is helpful in cases when you don't have reference of the chart instance
   * easily and need to call the method from anywhere.
   * For eg, in React/Vue applications when you have many parent/child components,
   * and need easy reference to other charts for performing dynamic operations
   *
   * @param {string} chartID - The unique identifier which will be used to call methods
   * on that chart instance
   * @param {string} fn - The method name to call
   * @param {...any} opts - The parameters which are accepted in the original method will be passed here in the same order.
   */
  static exec(chartID, fn, ...opts) {
    const chart = this.getChartByID(chartID)
    if (!chart) return

    // turn on the global exec flag to indicate this method was called
    chart.w.globals.isExecCalled = true

    let ret = null
    if (chart.publicMethods.indexOf(fn) !== -1) {
      ret = /** @type {any} */ (chart)[fn](...opts)
    }
    return ret
  }

  /**
   * Deep-merges `source` into `target` and returns the result.
   * Thin wrapper around the internal `Utils.extend` utility.
   *
   * @param {object} target
   * @param {object} source
   * @returns {object}
   */
  static merge(target, source) {
    return Utils.extend(target, source)
  }

  static getThemePalettes() {
    return getThemePalettes()
  }

  /**
   * Register additional chart types. Used by sub-entry points so that only
   * the types they include are bundled.
   *
   * @param {Record<string, new (...args: any[]) => any>} typeMap  e.g. { line: Line, area: Line }
   */
  static use(typeMap) {
    register(typeMap)
  }

  /**
   * Register optional feature modules (Exports, Legend, Toolbar,
   * ZoomPanSelection, KeyboardNavigation, Annotations).
   *
   * Call this before rendering any chart. Feature entry files (e.g.
   * `apexcharts/features/legend`) call this automatically when imported.
   * Note: Tooltip is part of core and does not need to be registered.
   *
   * @param {Record<string, new (...args: any[]) => any>} featureMap  e.g. { legend: Legend, exports: Exports }
   */
  static registerFeatures(featureMap) {
    InitCtxVariables.registerFeatures(featureMap)
  }

  /**
   * Toggles (show/hide) the series identified by name.
   * Mirrors a click on the corresponding legend item.
   *
   * @param {string} seriesName
   * @returns {object | undefined} The collapsed series object, if now hidden.
   */
  toggleSeries(seriesName) {
    return this.series.toggleSeries(seriesName)
  }

  /**
   * Highlights or un-highlights a series when the user hovers a legend item.
   * Called internally by the legend; not typically called by consumers.
   *
   * @param {MouseEvent} e
   * @param {HTMLElement} targetElement - The legend marker element being hovered.
   */
  highlightSeriesOnLegendHover(e, targetElement) {
    return this.series.toggleSeriesOnHover(e, targetElement)
  }

  /**
   * Makes a previously hidden series visible and re-renders.
   *
   * @param {string} seriesName
   */
  showSeries(seriesName) {
    this.series.showSeries(seriesName)
  }

  /**
   * Hides a visible series and re-renders.
   *
   * @param {string} seriesName
   */
  hideSeries(seriesName) {
    this.series.hideSeries(seriesName)
  }

  /**
   * Highlights (dims all other series) the series identified by name.
   *
   * @param {string} seriesName
   */
  highlightSeries(seriesName) {
    this.series.highlightSeries(seriesName)
  }

  /**
   * Returns whether the series identified by name is currently hidden.
   *
   * @param {string} seriesName
   * @returns {boolean}
   */
  isSeriesHidden(seriesName) {
    return this.series.isSeriesHidden(seriesName)
  }

  /**
   * Resets the chart to the initial series and optionally the initial zoom level.
   *
   * @param {boolean} [shouldUpdateChart=true] - When true, triggers a re-render.
   * @param {boolean} [shouldResetZoom=true] - When true, restores the initial zoom level.
   */
  resetSeries(shouldUpdateChart = true, shouldResetZoom = true) {
    this.series.resetSeries(shouldUpdateChart, shouldResetZoom)
  }

  /**
   * Subscribes to a chart event by name.
   * Supported event names mirror the `chart.events` option keys
   * (e.g. `'mounted'`, `'updated'`, `'dataPointMouseEnter'`).
   *
   * @param {string} name - Event name.
   * @param {Function} handler - Callback invoked when the event fires.
   */
  addEventListener(name, handler) {
    this.events.addEventListener(name, handler)
  }

  /**
   * Removes a previously registered event listener.
   *
   * @param {string} name - Event name.
   * @param {Function} handler - The exact function reference passed to addEventListener.
   */
  removeEventListener(name, handler) {
    this.events.removeEventListener(name, handler)
  }

  /**
   * Adds an x-axis annotation dynamically after render.
   *
   * @param {XAxisAnnotations} opts - Annotation configuration.
   * @param {boolean} [pushToMemory=true] - When true, the annotation persists across re-renders.
   * @param {ApexCharts} [context] - Override the target chart instance (used by exec()).
   */
  addXaxisAnnotation(opts, pushToMemory = true, context = undefined) {
    let me = /** @type {ApexCharts} */ (/** @type {unknown} */ (this))
    if (context) {
      me = context
    }
    me.annotations?.addXaxisAnnotationExternal(opts, pushToMemory, me)
  }

  /**
   * Adds a y-axis annotation dynamically after render.
   *
   * @param {YAxisAnnotations} opts - Annotation configuration.
   * @param {boolean} [pushToMemory=true] - When true, the annotation persists across re-renders.
   * @param {ApexCharts} [context] - Override the target chart instance (used by exec()).
   */
  addYaxisAnnotation(opts, pushToMemory = true, context = undefined) {
    let me = /** @type {ApexCharts} */ (/** @type {unknown} */ (this))
    if (context) {
      me = context
    }
    me.annotations?.addYaxisAnnotationExternal(opts, pushToMemory, me)
  }

  /**
   * Adds a point annotation dynamically after render.
   *
   * @param {PointAnnotations} opts - Annotation configuration.
   * @param {boolean} [pushToMemory=true] - When true, the annotation persists across re-renders.
   * @param {ApexCharts} [context] - Override the target chart instance (used by exec()).
   */
  addPointAnnotation(opts, pushToMemory = true, context = undefined) {
    let me = /** @type {ApexCharts} */ (/** @type {unknown} */ (this))
    if (context) {
      me = context
    }
    me.annotations?.addPointAnnotationExternal(opts, pushToMemory, me)
  }

  /**
   * Removes all annotations from the chart.
   *
   * @param {ApexCharts} [context] - Override the target chart instance (used by exec()).
   */
  clearAnnotations(context = undefined) {
    let me = /** @type {ApexCharts} */ (/** @type {unknown} */ (this))
    if (context) {
      me = context
    }
    me.annotations?.clearAnnotations(me)
  }

  /**
   * Removes a specific annotation by its `id`.
   *
   * @param {string} id - The annotation id as set in the annotation config.
   * @param {ApexCharts} [context] - Override the target chart instance (used by exec()).
   */
  removeAnnotation(id, context = undefined) {
    let me = /** @type {ApexCharts} */ (/** @type {unknown} */ (this))
    if (context) {
      me = context
    }
    me.annotations?.removeAnnotation(me, id)
  }

  /**
   * Returns the inner SVG group element that contains all chart graphics.
   *
   * @returns {Element | null}
   */
  getChartArea() {
    const el = this.w.dom.baseEl.querySelector('.apexcharts-inner')

    return el
  }

  /**
   * Returns the sum of all data points whose x value falls within [minX, maxX].
   *
   * @param {number} minX
   * @param {number} maxX
   * @returns {number[]} One total per series.
   */
  getSeriesTotalXRange(minX, maxX) {
    return this.coreUtils.getSeriesTotalsXRange(minX, maxX)
  }

  /**
   * Returns the highest y value in the specified series.
   *
   * @param {number} [seriesIndex=0]
   * @returns {number}
   */
  getHighestValueInSeries(seriesIndex = 0) {
    const range = new Range(this.w)
    return range.getMinYMaxY(seriesIndex).highestY
  }

  /**
   * Returns the lowest y value in the specified series.
   *
   * @param {number} [seriesIndex=0]
   * @returns {number}
   */
  getLowestValueInSeries(seriesIndex = 0) {
    const range = new Range(this.w)
    return range.getMinYMaxY(seriesIndex).lowestY
  }

  /**
   * Returns the sum of each series (the totals used for percentage calculations).
   *
   * @returns {number[]}
   */
  getSeriesTotal() {
    return this.w.globals.seriesTotals
  }

  /**
   * Returns a curated snapshot of chart state for use in formatters, events,
   * and external integrations. Prefer this over accessing `chart.w` directly.
   *
   * The shape of this object is stable and versioned. `chart.w` is internal
   * and will be restricted in a future major version.
   */
  getState() {
    const w = this.w
    const gl = w.globals

    return {
      // Series data — computed/parsed form used for rendering
      series: w.seriesData.series,
      seriesNames: w.seriesData.seriesNames,
      colors: gl.colors,
      labels: w.labelData.labels,
      seriesTotals: gl.seriesTotals,
      seriesPercent: gl.seriesPercent,
      seriesXvalues: gl.seriesXvalues,
      seriesYvalues: gl.seriesYvalues,

      // Axis bounds — updated after each render
      minX: gl.minX,
      maxX: gl.maxX,
      minY: gl.minY,
      maxY: gl.maxY,
      minYArr: gl.minYArr,
      maxYArr: gl.maxYArr,
      minXDiff: gl.minXDiff,
      dataPoints: gl.dataPoints,

      // Axis scale objects — computed tick/scale results
      xAxisScale: gl.xAxisScale,
      yAxisScale: gl.yAxisScale,
      xTickAmount: gl.xTickAmount,

      // Axis type flags
      isXNumeric: w.axisFlags.isXNumeric,

      // Multi-axis series mapping
      seriesYAxisMap: gl.seriesYAxisMap,
      seriesYAxisReverseMap: gl.seriesYAxisReverseMap,

      // Chart dimensions — updated after each render/resize
      svgWidth: gl.svgWidth,
      svgHeight: gl.svgHeight,
      gridWidth: w.layout.gridWidth,
      gridHeight: w.layout.gridHeight,

      // Interactive state
      selectedDataPoints: w.interact.selectedDataPoints,
      collapsedSeriesIndices: gl.collapsedSeriesIndices,
      zoomed: w.interact.zoomed,

      // Chart-type-specific series data (null when not applicable)
      seriesX: w.seriesData.seriesX,
      seriesZ: w.seriesData.seriesZ,
      seriesCandleO: w.candleData.seriesCandleO,
      seriesCandleH: w.candleData.seriesCandleH,
      seriesCandleM: w.candleData.seriesCandleM,
      seriesCandleL: w.candleData.seriesCandleL,
      seriesCandleC: w.candleData.seriesCandleC,
      seriesRangeStart: w.rangeData.seriesRangeStart,
      seriesRangeEnd: w.rangeData.seriesRangeEnd,
      seriesGoals: w.seriesData.seriesGoals,
    }
  }

  /**
   * Programmatically selects or deselects a data point.
   * Equivalent to a user click on the data point.
   *
   * @param {number} seriesIndex - Zero-based series index.
   * @param {number} [dataPointIndex] - Zero-based data point index within the series.
   * @returns {number[][] | null} Updated selectedDataPoints array, or null.
   */
  toggleDataPointSelection(seriesIndex, dataPointIndex) {
    return this.updateHelpers.toggleDataPointSelection(
      seriesIndex,
      dataPointIndex,
    )
  }

  /**
   * Programmatically zooms the x-axis to the given range.
   * Requires zoom to be enabled (`chart.zoom.enabled: true`).
   *
   * @param {number} min - The minimum x value (timestamp or numeric).
   * @param {number} max - The maximum x value (timestamp or numeric).
   */
  zoomX(min, max) {
    this.ctx.toolbar?.zoomUpdateOptions(min, max)
  }

  /**
   * Switches the active locale, updating all locale-dependent labels (toolbar tooltips, month names, etc.).
   *
   * @param {string} localeName - Must match a locale name defined in `chart.locales`.
   */
  setLocale(localeName) {
    this.localization.setCurrentLocaleValues(localeName)
  }

  /**
   * Exports the chart to a PNG or SVG data URI.
   * Requires the Exports feature: `import 'apexcharts/features/exports'`.
   *
   * @param {{ scale?: number, width?: number }} [options]
   * @returns {Promise<{ imgURI: string } | { blob: Blob }>}
   */
  dataURI(options) {
    if (!this.ctx.exports)
      throw new Error(
        'apexcharts: Exports feature is not registered. Import apexcharts/features/exports.',
      )
    return this.ctx.exports.dataURI(options)
  }

  /**
   * Returns the chart's SVG markup as a string, optionally scaled.
   * Requires the Exports feature: `import 'apexcharts/features/exports'`.
   *
   * @param {number} [scale=1]
   * @returns {Promise<string>}
   */
  getSvgString(scale) {
    if (!this.ctx.exports)
      throw new Error(
        'apexcharts: Exports feature is not registered. Import apexcharts/features/exports.',
      )
    return this.ctx.exports.getSvgString(scale)
  }

  /**
   * Triggers a CSV download of the chart's data.
   * Requires the Exports feature: `import 'apexcharts/features/exports'`.
   *
   * @param {{ series?: any, fileName?: string, columnDelimiter?: string, lineDelimiter?: string }} [options]
   */
  exportToCSV(options = {}) {
    if (!this.ctx.exports)
      throw new Error(
        'apexcharts: Exports feature is not registered. Import apexcharts/features/exports.',
      )
    return this.ctx.exports.exportToCSV(options)
  }

  paper() {
    return this.w.dom.Paper
  }

  // ─── Slice write-back stubs ─────────────────────────────────────────────────
  /**
   * @param {Partial<import('./types/internal').SeriesData>} slice
   */
  _writeParsedSeriesData(slice) {
    Object.assign(this.w.seriesData, slice)
  }
  /**
   * @param {Partial<import('./types/internal').RangeData>} slice
   */
  _writeParsedRangeData(slice) {
    Object.assign(this.w.rangeData, slice)
  }
  /**
   * @param {Partial<import('./types/internal').CandleData>} slice
   */
  _writeParsedCandleData(slice) {
    Object.assign(this.w.candleData, slice)
  }
  /**
   * @param {Partial<import('./types/internal').LabelData>} slice
   */
  _writeParsedLabelData(slice) {
    Object.assign(this.w.labelData, slice)
  }
  /**
   * @param {Partial<import('./types/internal').AxisFlags>} slice
   */
  _writeParsedAxisFlags(slice) {
    Object.assign(this.w.axisFlags, slice)
  }
  /**
   * @param {Partial<import('./types/internal').LayoutCoords>} slice
   */
  _writeLayoutCoords(slice) {
    Object.assign(this.w.layout, slice)
  }

  _parentResizeCallback() {
    if (
      this.w.globals.animationEnded &&
      this.w.config.chart.redrawOnParentResize
    ) {
      this._windowResize()
    }
  }

  /**
   * Handle window resize and re-draw the whole chart.
   */
  _windowResize() {
    this.w.globals.resizeTimer = window.setTimeout(() => {
      this.w.globals.resized = true
      this.w.globals.dataChanged = false

      // we need to redraw the whole chart on window resize (with a small delay).
      this.ctx.update()
    }, 150)
  }

  _windowResizeHandler() {
    // Always clear any pending timer so a false→true→false toggle never fires a stale render
    clearTimeout(this.w.globals.resizeTimer ?? undefined)

    let { redrawOnWindowResize: redraw } = this.w.config.chart

    if (typeof redraw === 'function') {
      redraw = /** @type {any} */ (redraw)()
    }

    redraw && this._windowResize()
  }
}
