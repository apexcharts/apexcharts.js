// @ts-check
import Events from '../Events'
import Localization from './Localization'
import Animations from '../Animations'
import Axes from '../axes/Axes'
import Config from '../settings/Config'
import CoreUtils from '../CoreUtils'
import Crosshairs from '../Crosshairs'
import Grid from '../axes/Grid'
import Graphics from '../Graphics'
import Fill from '../Fill.js'
import Options from '../settings/Options'
import Responsive from '../Responsive'
import Series from '../Series'
import Theme from '../Theme'
import Formatters from '../Formatters'
import TitleSubtitle from '../TitleSubtitle'
import Dimensions from '../dimensions/Dimensions'
import Core from '../Core'
import Data from '../Data'
import UpdateHelpers from './UpdateHelpers'
import Tooltip from '../tooltip/Tooltip'

import { SVG } from '../../svg/index'
import { Environment } from '../../utils/Environment.js'

// set window globals in browser environment
if (Environment.isBrowser()) {
  if (typeof window.SVG === 'undefined') {
    window.SVG = SVG
  }

  // global Apex object which user can use to override chart's defaults globally
  if (typeof window.Apex === 'undefined') {
    window.Apex = {}
  }
} else {
  // SSR: use global namespace (Node.js)
  if (typeof global !== 'undefined') {
    if (typeof /** @type {any} */ (global).Apex === 'undefined') {
      ;/** @type {any} */ (global).Apex = {}
    }
    if (typeof /** @type {any} */ (global).SVG === 'undefined') {
      ;/** @type {any} */ (global).SVG = SVG
    }
  }
}

export default class InitCtxVariables {
  /**
   * Registry of optional feature modules.
   *
   * Populated by ApexCharts.registerFeatures() (called from feature entry
   * files such as src/features/legend.js). Keys match the ctx property name
   * the module is stored under (e.g. 'legend', 'exports').
   *
   * Core modules that every chart needs are NOT in this registry — they are
   * always instantiated unconditionally in initModules().
   */
  static _featureRegistry = new Map()

  /**
   * Register one or more optional feature modules.
   *
   * @param {Record<string, new (w: object, ctx: object) => unknown>} featureMap
   *   Plain object mapping ctx property name → constructor.
   *
   * Example (called from src/features/legend.js):
   *   InitCtxVariables.registerFeatures({ legend: Legend })
   */
  static registerFeatures(featureMap) {
    for (const [key, Ctor] of Object.entries(featureMap)) {
      InitCtxVariables._featureRegistry.set(key, Ctor)
    }
  }

  /**
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  initModules() {
    this.ctx.publicMethods = [
      'updateOptions',
      'updateSeries',
      'appendData',
      'appendSeries',
      'isSeriesHidden',
      'highlightSeries',
      'toggleSeries',
      'showSeries',
      'hideSeries',
      'setLocale',
      'resetSeries',
      'zoomX',
      'toggleDataPointSelection',
      'dataURI',
      'exportToCSV',
      'addXaxisAnnotation',
      'addYaxisAnnotation',
      'addPointAnnotation',
      'clearAnnotations',
      'removeAnnotation',
      'paper',
      'destroy',
    ]

    this.ctx.eventList = [
      'click',
      'mousedown',
      'mousemove',
      'mouseleave',
      'touchstart',
      'touchmove',
      'touchleave',
      'mouseup',
      'touchend',
      'keydown',
      'keyup',
    ]

    this.ctx.animations = new Animations(this.w, this.ctx)
    this.ctx.axes = new Axes(this.w, this.ctx)
    this.ctx.core = new Core(this.ctx.el, this.w, this.ctx)
    this.ctx.config = new Config({})
    this.ctx.data = new Data(this.w, {
      resetGlobals: () => this.ctx.core.resetGlobals(),
      isMultipleY: () => this.ctx.core.isMultipleY(),
    })
    this.ctx.grid = new Grid(this.w, this.ctx)
    this.ctx.graphics = new Graphics(this.w, this.ctx)
    this.ctx.coreUtils = new CoreUtils(this.w)
    this.ctx.crosshairs = new Crosshairs(this.w)
    this.ctx.events = new Events(this.w, this.ctx)
    this.ctx.fill = new Fill(this.w)
    this.ctx.localization = new Localization(this.w)
    this.ctx.options = new Options()
    this.ctx.responsive = new Responsive(this.w)
    this.ctx.series = new Series(this.w, {
      // legend may not be registered — guard with ?.
      toggleDataSeries: (/** @type {any[]} */ ...a) =>
        this.ctx.legend?.legendHelpers.toggleDataSeries(...a),
      revertDefaultAxisMinMax: () =>
        this.ctx.updateHelpers.revertDefaultAxisMinMax(),
      updateSeries: (/** @type {any[]} */ ...a) =>
        this.ctx.updateHelpers._updateSeries(...a),
    })
    this.ctx.theme = new Theme(this.w)
    this.ctx.formatters = new Formatters(this.w)
    this.ctx.titleSubtitle = new TitleSubtitle(this.w)
    this.ctx.dimensions = new Dimensions(this.w, this.ctx)
    this.ctx.updateHelpers = new UpdateHelpers(this.w, this.ctx)

    // Tooltip is core — always instantiated. w.globals.tooltip is kept as a
    // compat alias so external code and KeyboardNavigation can reach it.
    const tooltipInstance = new Tooltip(this.w, this.ctx)
    this.w.globals.tooltip = tooltipInstance
    Object.defineProperty(this.ctx, 'tooltip', {
      get() {
        return this.w.globals.tooltip
      },
      configurable: true,
    })

    this._initOptionalModules()
  }

  /**
   * Instantiate optional feature modules from the registry.
   *
   * Modules that are not registered are set to null on ctx so that call sites
   * can safely use optional-chaining (ctx.tooltip?.drawTooltip(...)).
   *
   * Lazy-getter features (toolbar, zoomPanSelection, keyboardNavigation) are
   * installed as on-demand getters so they are only constructed if accessed,
   * and only if their constructor was registered.
   */
  _initOptionalModules() {
    const reg = InitCtxVariables._featureRegistry
    const w = this.w
    const ctx = this.ctx

    // — Eager optional modules —

    // Exports: ctx.exports (also used directly in apexcharts.js public methods)
    const ExportsCtor = reg.get('exports')
    ctx.exports = ExportsCtor ? new ExportsCtor(w, ctx) : null

    // Legend: ctx.legend
    const LegendCtor = reg.get('legend')
    ctx.legend = LegendCtor ? new LegendCtor(w, ctx) : null

    // — Lazy-getter optional modules —
    // Each getter instantiates on first access only if the ctor was registered.

    const ToolbarCtor = reg.get('toolbar')
    Object.defineProperty(ctx, 'toolbar', {
      get() {
        if (!this._toolbar && ToolbarCtor)
          this._toolbar = new ToolbarCtor(w, this)
        return this._toolbar ?? null
      },
      configurable: true,
    })

    const ZoomPanCtor = reg.get('zoomPanSelection')
    Object.defineProperty(ctx, 'zoomPanSelection', {
      get() {
        if (!this._zoomPanSelection && ZoomPanCtor)
          this._zoomPanSelection = new ZoomPanCtor(w, this)
        return this._zoomPanSelection ?? null
      },
      configurable: true,
    })

    const KeyboardCtor = reg.get('keyboardNavigation')
    Object.defineProperty(ctx, 'keyboardNavigation', {
      get() {
        if (!this._keyboardNavigation && KeyboardCtor)
          this._keyboardNavigation = new KeyboardCtor(w, this)
        return this._keyboardNavigation ?? null
      },
      configurable: true,
    })
  }
}
