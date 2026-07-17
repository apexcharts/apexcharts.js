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
import { applyAnimationPolicy } from './modules/Animations'
import Destroy from './modules/helpers/Destroy'
import {
  register,
  markCustom,
  isCustom,
  hasChartClass,
  unregister,
} from './modules/ChartFactory'
import { registerTheme, unregisterTheme } from './modules/ThemeRegistry'
import { registerEasing } from './modules/animations/Easing'
import { trimStreamingSeries } from './modules/animations/StreamScroll'
import { applyAxisTransition } from './modules/animations/AxisTransition'
import {
  registerPlugin as registerPluginImpl,
  unregisterPlugin as unregisterPluginImpl,
} from './modules/weave/PluginRegistry'
import RendererController from './modules/RendererController'
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
  /** @type {any} */ morphTypeChange
  /** @type {any} */ timeScale
  /** @type {any} */ _keyboardNavigation
  /** @type {any} */ windowResizeHandler
  /** @type {any} */ parentResizeHandler
  /** @type {string[]} */ publicMethods = []
  /** @type {string[]} */ eventList = []
  /** @type {any} */ config
  /** @type {any} */ perspectives
  /** @type {any} */ storyboard
  /** @type {any} */ history
  /** @type {any} */ linkedViews
  /** @type {any} */ ink
  /** @type {any} */ measure
  /** @type {any} */ contextMenu
  /** @type {any} */ weave
  /** @type {any} */ renderer
  /** @type {any} */ rendererController

  /**
   * Static Perspectives helpers (decode/fromURL), populated by the perspectives
   * feature when imported (`import 'apexcharts/features/perspectives'`); null
   * otherwise. Declared here as a placeholder so core stays free of the
   * Perspectives module while the assignment in the feature file type-checks.
   * @type {any}
   */
  static perspectives = null

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

    applyAnimationPolicy(this.w)

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

    // Cadence (#6) P1: re-resolve chart.animations.easing on every render so an
    // updateOptions that changes the easing (name / cubic-bezier / fn) actually
    // takes effect on the next tween. Runs after responsive merge so it sees the
    // final config; idempotent, so the constructor's earlier call is harmless.
    applyAnimationPolicy(w)

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

    // Strata: choose the active series renderer now that mark count is known.
    this.rendererController?.resolve()

    // Weave: plugins react to freshly parsed data (geometry not computed yet).
    this.weave?.dispatch('afterParse')

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

    // Weave: plugins compute against final geometry (scales are ready).
    this.weave?.dispatch('afterScales', { xyRatios })

    this.grid.createGridMask()

    const elGraph = this.core.plotChartType(series, xyRatios)

    const dataLabels = new DataLabels(this.w, this)
    dataLabels.bringForward()
    if (w.config.dataLabels.background.enabled) {
      dataLabels.dataLabelsBackground()
    }

    // after all the drawing calculations, shift the graphical area (actual charts/bars) excluding legends
    this.core.shiftGraphPosition()

    // The heatmap gradient legend is drawn before plotCoords (so it can be
    // measured), so it can only pin to the chart's outer edge at that point.
    // Now that the plot geometry is final, re-pin it to hug the plot.
    this.legend?.heatmapGradientLegend?.repositionToPlot()

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

      // Weave: main render hook: series/grid/axes are live in elGraphical now.
      me.weave?.dispatch('draw', {
        pass: 'full',
        xyRatios: graphData?.xyRatios,
      })

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
      // cancel any pending resize redraw so a queued update() can't run against
      // a torn-down chart after destroy(). See react-apexcharts#602.
      clearTimeout(this.w.globals.resizeTimer ?? undefined)
    }
    // remove the chart's instance from the global Apex._chartInstances
    const chartID = this.w.config.chart.id
    if (chartID && Array.isArray(Apex._chartInstances)) {
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

    // chart.streaming: bound memory: drop points that scrolled out of the
    // window (xaxis.range + runway) or beyond maxPoints. Without it a
    // long-running stream grows the series array without limit.
    trimStreamingSeries(newSeries, me.w)

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
          // Chrome cross-fade for cross-type morph (no-op when the morph
          // feature isn't registered or no morph was captured this update).
          this.morphTypeChange?.applyChromeFade()

          // Variable-length update: slide surviving tick labels/gridlines to
          // their new positions and fade in the new ones, on the same clock
          // as the series morph (no-op otherwise; consumes prevChromeFrame).
          applyAxisTransition(this.w)

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
   * @param {string} [prevAxisScaleSig] - Signature of the on-screen axis scale
   *   captured by _updateSeries() before parseData recomputed bounds. When the
   *   recomputed scale differs, the fast path can't repaint the ruler in place,
   *   so it delegates to a full render. Omitted -> the check is skipped.
   * @returns {Promise<ApexCharts>} Resolves with the chart instance.
   */
  fastUpdate(animate, prevAxisScaleSig) {
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
        gl2.barCanvasCoords = null
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

        // The fast path repaints only the series layer; the axes and grid are
        // preserved in place (below). That is safe only while the axis domain is
        // unchanged. `prevAxisScaleSig` is the scale currently on screen,
        // captured by _updateSeries before parseData wiped it. If the freshly
        // recomputed scale differs, the rendered ruler would go stale while the
        // series rescale to the new domain, so fall back to a full render (what
        // the non-fast updateSeries path does anyway). Compares the y-axis
        // nice-scale ticks (the y-label source) and the numeric x-domain;
        // xAxisScale is excluded (reset to null here, not rebuilt for category
        // axes before this point, so it would false-positive on every update).
        // The common fixed-axis case (streaming) keeps the fast path.
        const newAxisScaleSig = JSON.stringify({
          y: (gl.yAxisScale || []).map((s) => (s ? s.result : null)),
          xMin: gl.minX,
          xMax: gl.maxX,
        })
        if (
          gl.axisCharts &&
          prevAxisScaleSig != null &&
          newAxisScaleSig !== prevAxisScaleSig
        ) {
          return this.update()
            .then(() => resolve(this))
            .catch(reject)
        }

        // Weave: geometry refreshed on the fast path.
        this.weave?.dispatch('afterScales', { pass: 'fast', xyRatios })

        // Remove only the series and data-label elements from elGraphical.
        // Grid, axes, crosshairs, and masks are preserved in place.
        const innerEl = w.dom.elGraphical.node
        const toRemove = innerEl.querySelectorAll(
          '.apexcharts-canvas-series-wrap, .apexcharts-series, .apexcharts-datalabels, .apexcharts-datalabels-background',
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

        // Weave: main render hook (fast path): rebuild plugin layers.
        this.weave?.dispatch('draw', { pass: 'fast', xyRatios })

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
    const group = /** @type {ApexCharts[]} */ (this.getGroupedCharts())
    group.splice(0, 0, this)
    return group
  }

  /**
   * Returns all charts in the same `chart.group`, excluding this instance.
   * Used internally to apply hover/zoom effects to sibling charts.
   *
   * @returns {ApexCharts[]}
   */
  getGroupedCharts() {
    // Require a truthy group: charts are registered in Apex._chartInstances
    // whenever chart.id is set (regardless of group), so without this guard two
    // ungrouped charts both store group === undefined and `undefined ===
    // undefined` would sync their zoom/pan/hover with each other. Only charts
    // that opt into the SAME explicit group should coordinate.
    return Apex._chartInstances
      .filter(
        (/** @type {any} */ ch) =>
          this !== ch.chart &&
          !!this.w.config.chart.group &&
          this.w.config.chart.group === ch.group,
      )
      .map((/** @type {any} */ ch) => ch.chart)
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
   * Register a Weave plugin definition (a plain { name, setup } object).
   * Lives in core so plugins can always be registered; they only activate when
   * the Weave host is bundled (`import 'apexcharts/features/weave'`, included in
   * the full bundle) and listed in a chart's `plugins` config.
   *
   * @param {{ name: string, apiVersion?: number, setup: Function, destroy?: Function }} def
   * @returns {typeof ApexCharts}
   */
  static registerPlugin(def) {
    registerPluginImpl(def)
    return ApexCharts
  }

  /**
   * Remove a registered Weave plugin definition. Charts already holding an
   * active instance keep it until their plugins config changes or they are
   * destroyed; the name simply stops resolving for new activations. Intended
   * for tests and hot-reload flows.
   * @param {string} name
   * @returns {typeof ApexCharts}
   */
  static unregisterPlugin(name) {
    unregisterPluginImpl(name)
    return ApexCharts
  }

  /**
   * Register a non-SVG series renderer (Strata #2). SVG is built in; the canvas
   * backend registers itself via `import 'apexcharts/features/renderer-canvas'`.
   * When a `kind` is not registered, selection falls back to SVG.
   *
   * @param {string} kind  e.g. 'canvas'
   * @param {(w: any, ctx: any) => any} factory  returns a Renderer instance
   */
  static registerRenderer(kind, factory) {
    RendererController.registerRenderer(kind, factory)
  }

  /**
   * Register a custom series type (Marks #11): a `{ renderItem }` definition
   * that draws primitives (path/line/rect/circle/text) per datum. Requires the
   * Marks feature to be bundled (`import 'apexcharts/features/marks'`, included
   * in the full bundle); without it this warns and no-ops. Once registered, use
   * it via `series[].type` or `chart.type`.
   *
   * @param {string} name  the type name, e.g. 'dumbbell'
   * @param {{ renderItem: Function, dataType?: string, yExtent?: Function, tooltip?: Function }} def
   * @returns {typeof ApexCharts}
   */
  static registerSeriesType(name, def) {
    const factory = /** @type {any} */ (ApexCharts)._customSeriesFactory
    if (!factory) {
      console.warn(
        `[apexcharts] registerSeriesType("${name}") requires the Marks feature: import 'apexcharts/features/marks'.`,
      )
      return ApexCharts
    }
    if (!def || typeof def.renderItem !== 'function') {
      console.warn(
        `[apexcharts] registerSeriesType("${name}") needs a def with a renderItem() function.`,
      )
      return ApexCharts
    }
    // The type registry is global (all charts, all bundle copies), so letting a
    // custom type shadow a built-in would silently break every chart on the
    // page. Re-registering a CUSTOM name replaces it (idempotent, like
    // registerPlugin); a built-in name is rejected.
    if (hasChartClass(name) && !isCustom(name)) {
      console.warn(
        `[apexcharts] registerSeriesType("${name}") would override the built-in "${name}" chart type; pick another name.`,
      )
      return ApexCharts
    }
    register({ [name]: factory(name, def) })
    markCustom(name)
    return ApexCharts
  }

  /**
   * Remove a custom series type registered via registerSeriesType. Built-in
   * chart types cannot be unregistered. Intended for tests and hot-reload.
   * @param {string} name
   * @returns {typeof ApexCharts}
   */
  static unregisterSeriesType(name) {
    if (isCustom(name)) unregister(name)
    return ApexCharts
  }

  /**
   * Facet (#13): register a named theme (palette + design tokens + mode)
   * referenceable via `theme: { name }`. The theme sits below explicit config
   * and CSS `--apx-*` tokens, above the built-in palette/mode defaults.
   *
   * @param {string} name  the theme name, e.g. 'brand'
   * @param {any} def  { mode?, palette?, tokens?, monochrome?, accessibility? }
   * @returns {typeof ApexCharts}
   */
  static registerTheme(name, def) {
    registerTheme(name, def)
    return ApexCharts
  }

  /**
   * Remove a theme registered via registerTheme. Charts referencing it by
   * `theme.name` fall back to the built-in defaults on their next render.
   * Intended for tests and hot-reload flows.
   * @param {string} name
   * @returns {typeof ApexCharts}
   */
  static unregisterTheme(name) {
    unregisterTheme(name)
    return ApexCharts
  }

  /**
   * Cadence (#6): register a named easing function referenceable via
   * `chart.animations.easing: '<name>'`. `fn` maps linear progress t in [0,1]
   * to eased progress (back/elastic curves may overshoot 1).
   *
   * @param {string} name  the easing name, e.g. 'bounce'
   * @param {(t:number)=>number} fn
   * @returns {typeof ApexCharts}
   */
  static registerEasing(name, fn) {
    registerEasing(name, fn)
    return ApexCharts
  }

  /**
   * Linked Views (#4) Phase 2: get-or-create a crossfilter coordinator by id.
   * Register one shared record set, then let each chart declare a dimension +
   * reduction under `chart.link`. Selecting in one chart re-aggregates the
   * others over the filtered subset.
   *
   * Lives in core (always callable) but the engine ships in the `link` feature
   * (`import 'apexcharts/features/link'`, included in the full bundle); without
   * it this warns and returns null so the engine shakes out when unused.
   *
   * @param {{ id: string, records?: any[] }} opts
   * @returns {any} the coordinator handle, or null if the feature is absent
   */
  static crossfilter(opts) {
    const factory = /** @type {any} */ (ApexCharts)._crossfilterFactory
    if (!factory) {
      console.warn(
        `[apexcharts] ApexCharts.crossfilter(...) requires the link feature: import 'apexcharts/features/link'.`,
      )
      return null
    }
    return factory(opts)
  }

  /**
   * Look up an existing crossfilter coordinator by id (null if none / feature
   * absent).
   * @param {string} id
   * @returns {any}
   */
  static getCrossfilter(id) {
    const get = /** @type {any} */ (ApexCharts)._crossfilterGet
    return get ? get(id) : null
  }

  /**
   * Linked Views (#4): clear crossfilter dimming across this chart and every
   * chart in its `chart.group`. No-op unless the `link` feature is bundled.
   */
  clearCrossfilter() {
    this.linkedViews?.clearGroup()
  }

  /**
   * Measure ruler (#18): arm a sticky measure-ruler mode (drag A->B on the
   * plot to read dx/dy/%change/slope). Alternatively hold the measure key
   * (chart.measure.key, default 'm') and drag. No-op unless the `measure`
   * feature is bundled and chart.measure.enabled.
   */
  startMeasure() {
    this.measure?.startMeasure()
  }

  /** Measure ruler (#18): leave measure mode. */
  stopMeasure() {
    this.measure?.stopMeasure()
  }

  /** Measure ruler (#18): remove all pinned measure rulers. */
  clearMeasures() {
    this.measure?.clearMeasures()
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
    // This mutates the rendered DOM out of band, so the memoized "last rendered
    // options" no longer matches what is on screen. Invalidate it, or a
    // subsequent updateOptions() with identical options short-circuits and
    // leaves the annotations cleared-but-not-redrawn (hit by Rewind /
    // Perspectives restore, which clear then re-apply the same config).
    me.lastUpdateOptions = null
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
    // See clearAnnotations: removing an annotation changes the rendered DOM, so
    // invalidate the update memo to keep a following identical updateOptions().
    me.lastUpdateOptions = null
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

  /**
   * Returns the active series renderer for the last render: `'svg'` (default)
   * or `'canvas'` (Strata #2). `'auto'`/`'canvas'` resolve to `'svg'` unless the
   * canvas renderer feature is bundled and no canvas-unsupported feature is in
   * use. See `chart.renderer` / `chart.rendererThreshold`.
   *
   * @returns {'svg' | 'canvas' | 'gpu'}
   */
  getActiveRenderer() {
    return this.rendererController
      ? this.rendererController.getActiveKind()
      : 'svg'
  }

  /**
   * Facet (#13): re-resolve the `--apx-*` design tokens and re-render.
   *
   * Tokens are read from the CSS cascade once per render, so a runtime change
   * that is NOT an OS color-scheme flip (e.g. the host app swaps its own
   * design-system theme by toggling a class or setting style properties) is
   * invisible until the next render, and `updateOptions({})` is memoized away.
   * This busts the memo and re-renders, picking up the current token values.
   * @returns {Promise<any>}
   */
  refreshTokens() {
    this.lastUpdateOptions = null
    return this.update()
  }

  /**
   * Drills into the child level referenced by `id` (a `chart.drilldown.series` entry).
   * Requires the Drilldown feature: `import 'apexcharts/features/drilldown'`.
   *
   * @param {string|number} id - The drilldown series id to navigate into.
   * @returns {Promise<ApexCharts>}
   */
  drillDown(id) {
    if (!this.ctx.drilldown)
      throw new Error(
        'apexcharts: Drilldown feature is not registered. Import apexcharts/features/drilldown.',
      )
    return this.ctx.drilldown.drillDown(id)
  }

  /**
   * Navigates back one drilldown level.
   * Requires the Drilldown feature: `import 'apexcharts/features/drilldown'`.
   *
   * @returns {Promise<ApexCharts>}
   */
  drillUp() {
    if (!this.ctx.drilldown)
      throw new Error(
        'apexcharts: Drilldown feature is not registered. Import apexcharts/features/drilldown.',
      )
    return this.ctx.drilldown.drillUp()
  }

  /**
   * Navigates back to the root drilldown level.
   * Requires the Drilldown feature: `import 'apexcharts/features/drilldown'`.
   *
   * @returns {Promise<ApexCharts>}
   */
  drillToRoot() {
    if (!this.ctx.drilldown)
      throw new Error(
        'apexcharts: Drilldown feature is not registered. Import apexcharts/features/drilldown.',
      )
    return this.ctx.drilldown.drillToRoot()
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
