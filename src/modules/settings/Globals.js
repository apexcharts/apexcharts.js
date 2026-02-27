import Utils from './../../utils/Utils'
import {
  LINE_HEIGHT_RATIO,
  NICE_SCALE_ALLOWED_MAG_MSD,
  NICE_SCALE_DEFAULT_TICKS,
} from '../../utils/Constants'

export default class Globals {
  initGlobalVars(gl) {
    // ── Series data (ephemeral — fully recomputed from config.series each render) ──
    gl.series = [] // the MAIN series array (y values)
    gl.seriesCandleO = []
    gl.seriesCandleH = []
    gl.seriesCandleM = []
    gl.seriesCandleL = []
    gl.seriesCandleC = []
    gl.seriesRangeStart = []
    gl.seriesRangeEnd = []
    gl.seriesRange = []
    gl.seriesPercent = []
    gl.seriesGoals = []
    gl.seriesX = []
    gl.seriesZ = []
    gl.seriesNames = []
    gl.seriesTotals = []
    gl.seriesLog = []
    gl.seriesColors = []
    gl.stackedSeriesTotals = []
    gl.seriesXvalues = [] // x positions used by tooltip when x values are unequal
    gl.seriesYvalues = [] // y positions used to identify which series the user hovered
    gl.dataWasParsed = false
    gl.originalSeries = null
    gl.maxValsInArrayIndex = 0 // index of the series with the most data points
    gl.yValueDecimal = 0 // decimal precision of y values (0 = integers only)
    gl.allSeriesHasEqualX = true // false when series have differing x value sets

    // ── Labels & categories (ephemeral — derived from parsed series/config) ──
    gl.labels = []
    gl.hasXaxisGroups = false
    gl.groups = []
    gl.barGroups = []
    gl.lineGroups = []
    gl.areaGroups = []
    gl.hasSeriesGroups = false
    gl.seriesGroups = []
    gl.categoryLabels = []
    gl.timescaleLabels = []
    gl.noLabelsProvided = false

    // ── Axis bounds & scales (ephemeral — recomputed by Range/Scales each render) ──
    gl.isXNumeric = false
    gl.skipLastTimelinelabel = false
    gl.skipFirstTimelinelabel = false
    gl.isDataXYZ = false
    gl.isMultiLineX = false
    gl.isMultipleYAxis = false
    gl.maxY = -Number.MAX_VALUE
    gl.minY = Number.MIN_VALUE
    gl.minYArr = []
    gl.maxYArr = []
    gl.maxX = -Number.MAX_VALUE
    gl.minX = Number.MAX_VALUE
    gl.initialMaxX = -Number.MAX_VALUE
    gl.initialMinX = Number.MAX_VALUE
    gl.maxDate = 0
    gl.minDate = Number.MAX_VALUE
    gl.minZ = Number.MAX_VALUE
    gl.maxZ = -Number.MAX_VALUE
    gl.minXDiff = Number.MAX_VALUE
    gl.yAxisScale = []
    gl.xAxisScale = null
    gl.xAxisTicksPositions = []
    gl.xRange = 0
    gl.yRange = []
    gl.zRange = 0
    gl.dataPoints = 0
    gl.xTickAmount = 0
    gl.multiAxisTickAmount = 0

    // ── Zoom / timeline range state (ephemeral — recomputed by TimeScale) ──
    gl.disableZoomIn = false
    gl.disableZoomOut = false

    // ── Layout & dimensions (ephemeral — recomputed by Dimensions each render) ──
    gl.yLabelsCoords = []
    gl.yTitleCoords = []
    gl.barPadForNumericAxis = 0
    gl.padHorizontal = 0
    gl.rotateXLabels = false // true when x-axis labels are angled
    gl.overlappingXLabels = false // true when x labels overlap and must be hidden
    gl.radialSize = 0 // computed radius for radial/polar charts
    // Note: formatter properties (xLabelFormatter, yLabelFormatters, etc.) live on
    // w.formatters — not on gl. See Base.js for backward-compat shims.

    // ── Bar chart sizing (ephemeral — set by bar/Helpers.initialPositions) ──
    gl.barHeight = 0
    gl.barWidth = 0

    // ── Animation (ephemeral — reset at the start of each render pass) ──
    gl.animationEnded = false

    // ── Caches (ephemeral — cleared so stale DOM refs/measurements don't persist) ──
    gl.resizeTimer = null
    gl.selectionResizeTimer = null
    gl.lastWheelExecution = 0
    gl.delayedElements = []
    gl.pointsArray = []
    gl.dataLabelsRects = []
    gl.lastDrawnDataLabelsIndexes = [] // tracks which data labels were drawn per series to prevent collisions
    gl.textRectsCache = new Map()
    gl.domCache = new Map()
    gl.dimensionCache = {} // cache for getBoundingClientRect results
    gl.cachedSelectors = {} // cache for querySelectorAll results

    // Attach namespace views the first time only — live proxies into the flat
    // globals above. initGlobalVars is called again on resetGlobals (each
    // updateSeries), so we guard against re-attaching.
    if (!gl.seriesNS) {
      this._attachNamespaces(gl)
    }
  }

  /**
   * Attach domain-grouped namespace sub-objects onto gl.
   * Each sub-object is a plain object whose properties are defined as
   * getters/setters that read/write the canonical flat properties on gl.
   * This means there is exactly ONE storage location per value — no copies,
   * no sync needed.
   *
   * Namespaces:
   *   gl.series  — parsed series data and chart-type-specific arrays
   *   gl.axes    — axis bounds, scales, ranges, tick state
   *   gl.layout  — SVG/grid dimensions, translations, label sizes
   *   gl.cache   — DOM caches, timers, observers, drawing scratch space
   *
   * Note: interact state lives on w.interact (not gl) — see Base.js.
   */
  _attachNamespaces(gl) {
    // Helper: define a property on `ns` that proxies to `gl[key]`
    const proxy = (ns, key, nsKey = key) => {
      Object.defineProperty(ns, nsKey, {
        get() {
          return gl[key]
        },
        set(v) {
          gl[key] = v
        },
        enumerable: true,
        configurable: true,
      })
    }

    // ── series namespace ─────────────────────────────────────────────────────
    // All parsed/computed series data. Chart-type-specific arrays included so
    // one namespace covers all chart types.
    // Note: `gl.series` (the main y-values array) is exposed here as `seriesNS.data`
    // to avoid a circular proxy. All other series-prefixed fields are proxied by name.
    const seriesNS = {}
    // Alias gl.series → seriesNS.data
    proxy(seriesNS, 'series', 'data')
    for (const key of [
      'seriesNames',
      'seriesX',
      'seriesZ',
      'seriesXvalues',
      'seriesYvalues',
      'seriesGoals',
      'seriesLog',
      'seriesColors',
      'seriesPercent',
      'seriesTotals',
      'stackedSeriesTotals',
      'seriesCandleO',
      'seriesCandleH',
      'seriesCandleM',
      'seriesCandleL',
      'seriesCandleC',
      'seriesRangeStart',
      'seriesRangeEnd',
      'seriesRange',
      'seriesYAxisMap',
      'seriesYAxisReverseMap',
      'seriesGroups',
      'barGroups',
      'lineGroups',
      'areaGroups',
      'originalSeries',
      'collapsedSeries',
      'collapsedSeriesIndices',
      'ancillaryCollapsedSeries',
      'ancillaryCollapsedSeriesIndices',
      'allSeriesCollapsed',
      'risingSeries',
      'previousPaths',
      'ignoreYAxisIndexes',
      'labels',
      'categoryLabels',
      'timescaleLabels',
      'groups',
    ]) {
      proxy(seriesNS, key)
    }
    // Expose the namespace under a non-colliding key.
    // gl.series still refers to the series data array (unchanged).
    // gl.seriesNS groups all series-related fields.
    Object.defineProperty(gl, 'seriesNS', {
      value: seriesNS,
      writable: false,
      enumerable: false,
      configurable: true,
    })

    // ── axes namespace ───────────────────────────────────────────────────────
    // Axis bounds, scale objects, range/tick state updated each render.
    const axesNS = {}
    for (const key of [
      'minX',
      'maxX',
      'initialMinX',
      'initialMaxX',
      'minY',
      'maxY',
      'minYArr',
      'maxYArr',
      'minZ',
      'maxZ',
      'minDate',
      'maxDate',
      'minXDiff',
      'xRange',
      'yRange',
      'zRange',
      'xAxisScale',
      'yAxisScale',
      'xAxisTicksPositions',
      'xTickAmount',
      'multiAxisTickAmount',
      'dataPoints',
      'maxValsInArrayIndex',
      'isXNumeric',
      'isMultipleYAxis',
      'isMultiLineX',
      'isDataXYZ',
      'dataFormatXNumeric',
      'allSeriesHasEqualX',
      'hasNullValues',
      'dataWasParsed',
      'hasXaxisGroups',
      'hasSeriesGroups',
      'skipFirstTimelinelabel',
      'skipLastTimelinelabel',
      'yValueDecimal',
      'invalidLogScale',
      'noLabelsProvided',
    ]) {
      proxy(axesNS, key)
    }
    Object.defineProperty(gl, 'axes', {
      value: axesNS,
      writable: false,
      enumerable: false,
      configurable: true,
    })

    // ── layout namespace ─────────────────────────────────────────────────────
    // SVG and grid dimensions, translations, label/axis sizing.
    const layoutNS = {}
    for (const key of [
      'svgWidth',
      'svgHeight',
      'gridWidth',
      'gridHeight',
      'translateX',
      'translateY',
      'translateXAxisX',
      'translateXAxisY',
      'translateYAxisX',
      'xAxisLabelsHeight',
      'xAxisGroupLabelsHeight',
      'xAxisLabelsWidth',
      'yAxisLabelsWidth',
      'yAxisWidths',
      'yLabelsCoords',
      'yTitleCoords',
      'padHorizontal',
      'barPadForNumericAxis',
      'rotateXLabels',
      'scaleX',
      'scaleY',
      'radialSize',
      'defaultLabels',
      'overlappingXLabels',
    ]) {
      proxy(layoutNS, key)
    }
    Object.defineProperty(gl, 'layout', {
      value: layoutNS,
      writable: false,
      enumerable: false,
      configurable: true,
    })

    // Note: interact namespace (zoom/pan/selection/mouse state) lives on w.interact
    // — see Base.js. Backward-compat shims proxy gl.* → w.interact.*.

    // ── cache namespace ──────────────────────────────────────────────────────
    // Internal caches, timers, observers, drawing scratch arrays.
    // These are never part of the public API surface.
    const cacheNS = {}
    for (const key of [
      'domCache',
      'dimensionCache',
      'cachedSelectors',
      'textRectsCache',
      'pointsArray',
      'dataLabelsRects',
      'lastDrawnDataLabelsIndexes',
      'delayedElements',
      'resizeTimer',
      'selectionResizeTimer',
      'resizeObserver',
    ]) {
      proxy(cacheNS, key)
    }
    Object.defineProperty(gl, 'cache', {
      value: cacheNS,
      writable: false,
      enumerable: false,
      configurable: true,
    })
  }

  /**
   * Persistent chart state — set ONCE at chart construction and intentionally NOT
   * reset by initGlobalVars.  These values must survive updateSeries / re-render.
   *
   * Rule: if a value is recalculated fresh on every render it belongs in
   * initGlobalVars instead, not here.
   */
  globalVars(config) {
    return {
      // ── Identity (set once, never changes) ───────────────────────────────────
      chartID: null, // full chart ID: "apexcharts-<cuid>"
      cuid: null, // random suffix only

      // ── Event registry (accumulates listeners, never reset) ───────────────────
      events: {
        beforeMount: [],
        mounted: [],
        updated: [],
        clicked: [],
        selection: [],
        dataPointSelection: [],
        zoomed: [],
        scrolled: [],
      },

      // ── Theme colors (set by Theme module after config merge) ─────────────────
      colors: [],
      fill: { colors: [] },
      stroke: { colors: [] },
      dataLabels: { style: { colors: [] } },
      radarPolygons: { fill: { colors: [] } },
      markers: {
        colors: [],
        size: config.markers.size,
        largestSize: 0,
      },

      // ── Device / environment detected once at startup ─────────────────────────
      // Note: isTouchDevice lives on w.interact — see Base.js. Shim installed there.
      LINE_HEIGHT_RATIO,

      // ── Chart-type flags (derived from config, set during Core.mount) ─────────
      axisCharts: true, // false for pie/radial/treemap etc.
      isSlopeChart: config.plotOptions.line.isSlopeChart,
      comboCharts: false, // true when mixing line + column series

      // ── Config snapshots (backups for zoom-reset / updateOptions) ────────────
      initialConfig: null, // deep clone of the original user config
      initialSeries: [],
      lastXAxis: [],
      lastYAxis: [],

      // ── User interaction state (must survive re-renders) ──────────────────────
      // Note: zoomEnabled, panEnabled, selectionEnabled, zoomed, selection,
      //       visibleXRange, selectedDataPoints, mousedown, clientX, clientY,
      //       lastClientPosition, lastWheelExecution, capturedSeriesIndex,
      //       capturedDataPointIndex, disableZoomIn, disableZoomOut, isTouchDevice
      //       live on w.interact — see Base.js. Backward-compat shims installed there.

      // Series collapse state (user-driven, must persist across re-renders)
      allSeriesCollapsed: false,
      collapsedSeries: [],
      collapsedSeriesIndices: [],
      ancillaryCollapsedSeries: [],
      ancillaryCollapsedSeriesIndices: [],
      risingSeries: [], // series being re-shown after collapse
      ignoreYAxisIndexes: [], // y-axis indices excluded during series collapse

      // ── Lifecycle / update flags ──────────────────────────────────────────────
      isDirty: false, // true when user called an update method manually
      isExecCalled: false, // true when update came via exec()
      dataChanged: false, // true when series data was changed dynamically
      resized: false, // true after a container resize

      // ── Data format flags (derived from config/series, stable between renders) ─
      // Note: dataFormatXNumeric lives on w.axisFlags — see Base.js. Shim installed there.
      invalidLogScale: false, // true when log scale requested but data is invalid
      hasNullValues: false, // true when any series contains null values

      // Persistent data tracking
      columnSeries: null, // tracks which series are rendered as bars/columns
      yaxis: null, // resolved yaxis config array
      total: 0, // running total (used by pie/radial)

      // ── Animation control ─────────────────────────────────────────────────────
      shouldAnimate: true,
      previousPaths: [], // paths from previous render — source for enter animation

      // ── SVG viewport (set by Dimensions, but persistent as layout anchor) ─────
      svgWidth: 0,
      svgHeight: 0,
      // Note: gridWidth, gridHeight, translateX, translateY, translateXAxisX,
      // translateXAxisY, xAxisLabelsHeight, xAxisGroupLabelsHeight, xAxisLabelsWidth,
      // rotateXLabels, xAxisHeight, yLabelsCoords, yTitleCoords live on w.layout —
      // see Base.js. Backward-compat shims installed there.
      defaultLabels: false,
      // Note: formatter properties (xLabelFormatter, yLabelFormatters, etc.) live on
      // w.formatters — see Base.js. Backward-compat shims installed there.
      yAxisLabelsWidth: 0,
      scaleX: 1,
      scaleY: 1,
      translateYAxisX: [],
      yAxisWidths: [],

      // ── Instances (created once, replaced only on full re-init) ──────────────
      tooltip: null,
      resizeObserver: null,

      // ── Locale (loaded once; changes only via setLocale()) ───────────────────
      locale: {},

      // ── Method queue (deferred calls during async operations) ────────────────
      memory: {
        methodsToExec: [],
      },

      // ── Scale configuration constants — imported from utils/Constants.js ──────
      niceScaleAllowedMagMsd: NICE_SCALE_ALLOWED_MAG_MSD,
      niceScaleDefaultTicks: NICE_SCALE_DEFAULT_TICKS,

      // ── Multi-axis series mapping ─────────────────────────────────────────────
      seriesYAxisMap: [], // yAxis index → series indices[]
      seriesYAxisReverseMap: [], // series index → yAxis index
      noData: false, // true when there is nothing to render
    }
  }

  init(config) {
    const globals = this.globalVars(config)
    this.initGlobalVars(globals)

    globals.initialConfig = Utils.extend({}, config)
    globals.initialSeries = Utils.clone(config.series)

    globals.lastXAxis = Utils.clone(globals.initialConfig.xaxis)
    globals.lastYAxis = Utils.clone(globals.initialConfig.yaxis)
    return globals
  }
}
