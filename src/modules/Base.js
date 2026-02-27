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
      // Candlestick / boxplot OHLC arrays — written by Data.handleCandleStickBoxData()
      // each render; empty for all other chart types.
      candleData: {
        seriesCandleO: [],
        seriesCandleH: [],
        seriesCandleM: [],
        seriesCandleL: [],
        seriesCandleC: [],
      },
      // Range chart arrays — written by Data.handleRangeData() each render;
      // empty for all other chart types.
      rangeData: {
        seriesRangeStart: [],
        seriesRangeEnd: [],
        seriesRange: [],
      },
      // Label / category data — written by Data.parseData() and TimeScale each render.
      labelData: {
        labels: [],
        categoryLabels: [],
        timescaleLabels: [], // written by TimeScale.calculateTimeScaleMinMax()
        hasXaxisGroups: false,
        groups: [],
        seriesGroups: [],
      },
      // Axis / parsing behaviour flags — written by Data.parseData() each render.
      axisFlags: {
        isXNumeric: false,
        dataFormatXNumeric: false,
        isDataXYZ: false,
        isRangeData: false,
        isRangeBar: false,
        isMultiLineX: false,
        noLabelsProvided: false,
        dataWasParsed: false,
      },
      // Parsed series data — written by Data.parseData() each render.
      // Note: initialSeries and originalSeries are intentionally excluded —
      // they are persistent (survive re-renders) and remain on w.globals.
      seriesData: {
        series: [], // main y-values array
        seriesNames: [],
        seriesX: [],
        seriesZ: [],
        seriesColors: [],
        seriesGoals: [],
        stackedSeriesTotals: [],
        stackedSeriesTotalsByGroups: [],
      },
      // Grid / axis layout computed by Dimensions.plotCoords() each render.
      // gridWidth/gridHeight/translateX/translateY are also used as starting
      // points by Dimensions on the next render (accumulated values), so the
      // shim must be bidirectional — reads and writes both route correctly.
      layout: {
        gridHeight: 0,
        gridWidth: 0,
        translateX: 0,
        translateY: 0,
        translateXAxisX: 0,
        translateXAxisY: 0,
        rotateXLabels: false,
        xAxisHeight: 0,
        xAxisLabelsHeight: 0,
        xAxisGroupLabelsHeight: 0,
        xAxisLabelsWidth: 0,
        yLabelsCoords: [],
        yTitleCoords: [],
      },
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API shims — PERMANENT.
    //
    // `w.globals` is part of ApexCharts' documented public API: user code in
    // formatter callbacks, custom tooltips, event handlers, etc. routinely
    // reads `ctx.w.globals.series`, `opt.w.globals.labels`, and similar.
    // These Object.defineProperty accessors keep every sliced-out property
    // visible on `w.globals` so external code never breaks, regardless of
    // where the canonical data now lives internally.
    //
    // Do NOT remove these shims. They are not scaffolding — they are the
    // stable, versioned surface between internal typed slices and the outside
    // world.
    // ─────────────────────────────────────────────────────────────────────────

    // w.globals.dom → w.dom
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

    // w.globals.<formatter> → w.formatters.<formatter>
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

    // w.globals.<interact> → w.interact.<interact>
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

    // w.globals.<layout> → w.layout.<layout>
    // These override the own-properties set in Globals.globalVars() (gridWidth, gridHeight,
    // translateX, translateY, etc.) — Object.defineProperty replaces them with accessors.
    for (const key of [
      'gridHeight',
      'gridWidth',
      'translateX',
      'translateY',
      'translateXAxisX',
      'translateXAxisY',
      'rotateXLabels',
      'xAxisHeight',
      'xAxisLabelsHeight',
      'xAxisGroupLabelsHeight',
      'xAxisLabelsWidth',
      'yLabelsCoords',
      'yTitleCoords',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.layout[key]
        },
        set(v) {
          w.layout[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    // w.globals.<seriesData> → w.seriesData.<seriesData>
    // Note: gl.series (main y-values) shim coexists with the seriesNS.data proxy in
    // Globals._attachNamespaces() — seriesNS.data reads/writes gl.series which routes
    // through this shim to w.seriesData.series (proxy-of-a-proxy, both bidirectional).
    for (const key of [
      'series',
      'seriesNames',
      'seriesX',
      'seriesZ',
      'seriesColors',
      'seriesGoals',
      'stackedSeriesTotals',
      'stackedSeriesTotalsByGroups',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.seriesData[key]
        },
        set(v) {
          w.seriesData[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    // w.globals.<axisFlags> → w.axisFlags.<axisFlags>
    for (const key of [
      'isXNumeric',
      'dataFormatXNumeric',
      'isDataXYZ',
      'isRangeData',
      'isRangeBar',
      'isMultiLineX',
      'noLabelsProvided',
      'dataWasParsed',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.axisFlags[key]
        },
        set(v) {
          w.axisFlags[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    // w.globals.<labelData> → w.labelData.<labelData>
    for (const key of [
      'labels',
      'categoryLabels',
      'timescaleLabels',
      'hasXaxisGroups',
      'groups',
      'seriesGroups',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.labelData[key]
        },
        set(v) {
          w.labelData[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    // w.globals.<rangeData> → w.rangeData.<rangeData>
    for (const key of ['seriesRangeStart', 'seriesRangeEnd', 'seriesRange']) {
      Object.defineProperty(globals, key, {
        get() {
          return w.rangeData[key]
        },
        set(v) {
          w.rangeData[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    // w.globals.<candleData> → w.candleData.<candleData>
    for (const key of [
      'seriesCandleO',
      'seriesCandleH',
      'seriesCandleM',
      'seriesCandleL',
      'seriesCandleC',
    ]) {
      Object.defineProperty(globals, key, {
        get() {
          return w.candleData[key]
        },
        set(v) {
          w.candleData[key] = v
        },
        enumerable: false,
        configurable: true,
      })
    }

    return w
  }
}
