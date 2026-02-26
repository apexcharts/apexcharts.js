import Config from './settings/Config'
import Globals from './settings/Globals'
import { Environment } from '../utils/Environment'

/**
 * ApexCharts Base Class for extending user options with pre-defined ApexCharts config.
 *
 * @module Base
 **/
export default class Base {
  constructor(opts) {
    this.opts = opts
  }

  init() {
    const config = new Config(this.opts).init({ responsiveOverride: false })
    const globals = new Globals().init(config)

    const w = {
      config,
      globals,
      dom: {}, // DOM node cache — lives here, not inside globals
      interact: {
        // Tool mode (derived from toolbar config at construction, updated by Toolbar)
        zoomEnabled:
          config.chart.toolbar.autoSelected === 'zoom' &&
          config.chart.toolbar.tools.zoom &&
          config.chart.zoom.enabled,
        panEnabled:
          config.chart.toolbar.autoSelected === 'pan' &&
          config.chart.toolbar.tools.pan,
        selectionEnabled:
          config.chart.toolbar.autoSelected === 'selection' &&
          config.chart.toolbar.tools.selection,
        // Zoom / pan state (user-driven, must persist across re-renders)
        zoomed: false,
        selection: undefined,
        visibleXRange: undefined,
        selectedDataPoints: [],
        // Mouse / pointer state
        mousedown: false,
        clientX: null,
        clientY: null,
        lastClientPosition: {},
        lastWheelExecution: 0,
        // Tooltip capture state
        capturedSeriesIndex: -1,
        capturedDataPointIndex: -1,
        // Timescale zoom bounds (reset per render by TimeScale)
        disableZoomIn: false,
        disableZoomOut: false,
        // Device detection (set once at construction)
        isTouchDevice: Environment.isBrowser()
          ? 'ontouchstart' in window || navigator.msMaxTouchPoints > 0
          : false,
      },
      formatters: {
        // Populated by Formatters.setLabelFormatters() each render
        xLabelFormatter: undefined,
        yLabelFormatters: [],
        xaxisTooltipFormatter: undefined,
        ttKeyFormatter: undefined,
        ttVal: undefined,
        ttZFormatter: undefined,
        legendFormatter: undefined,
      },
    }

    // Backward-compat: w.globals.dom proxies to w.dom
    Object.defineProperty(globals, 'dom', {
      get() {
        return w.dom
      },
      set(v) {
        w.dom = v
      },
      enumerable: false,
      configurable: true,
    })

    // Backward-compat: w.globals.<formatter> proxies to w.formatters.<formatter>
    for (const key of [
      'xLabelFormatter',
      'yLabelFormatters',
      'xaxisTooltipFormatter',
      'ttKeyFormatter',
      'ttVal',
      'ttZFormatter',
      'legendFormatter',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.formatters[key]
        },
        set(v) {
          w.formatters[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    // Backward-compat: w.globals.<interact> proxies to w.interact.<interact>
    for (const key of [
      'zoomEnabled',
      'panEnabled',
      'selectionEnabled',
      'zoomed',
      'selection',
      'visibleXRange',
      'selectedDataPoints',
      'mousedown',
      'clientX',
      'clientY',
      'lastClientPosition',
      'lastWheelExecution',
      'capturedSeriesIndex',
      'capturedDataPointIndex',
      'disableZoomIn',
      'disableZoomOut',
      'isTouchDevice',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.interact[key]
        },
        set(v) {
          w.interact[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    return w
  }
}
