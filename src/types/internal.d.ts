/**
 * internal.d.ts — Phase 2 typed interfaces for ApexCharts internal contracts
 *
 * These types describe the *internal* data model only. They are NOT part of the
 * public API. The public API surface lives in types/apexcharts.d.ts.
 *
 * Key design decisions:
 *  - ChartGlobals types the canonical flat `w.globals` object.
 *  - Each slice (SeriesData, LayoutCoords, etc.) types the sub-objects that live
 *    on `w.*` and are shimmed bidirectionally onto `w.globals.*` in Base.js.
 *  - ChartContext types the chart instance (ctx / `this` in ApexCharts) including
 *    all module properties assigned in InitCtxVariables.initModules().
 *  - ChartStateW types the full `w` object (config + globals + slices + dom).
 *
 * Shim contract: w.globals.<prop> and w.<slice>.<prop> are always the same value.
 * When typing internal code, prefer w.<slice>.<prop> for new code.
 * Legacy w.globals.<prop> access is shimmed and still valid.
 */

// ---------------------------------------------------------------------------
// Forward references (avoid circular imports — all in one file)
// ---------------------------------------------------------------------------

import type { ApexOptions } from '../../types/apexcharts'

// ---------------------------------------------------------------------------
// ResolvedApexOptions — config after Config.init() merges Options.js defaults
//
// All top-level properties are required (Options.init() provides defaults).
// Sub-interfaces use Required<> so first-level nested access doesn't need
// null checks. Deeper nesting (user callbacks, formatters) stays optional.
// ---------------------------------------------------------------------------

export type ResolvedApexOptions = {
  annotations: Required<ApexAnnotations>
  chart: Required<ApexChart>
  colors: any[]
  dataLabels: Required<ApexDataLabels>
  fill: Required<ApexFill>
  forecastDataPoints: Required<ApexForecastDataPoints>
  grid: Required<ApexGrid>
  labels: string[]
  legend: Required<ApexLegend>
  markers: Required<ApexMarkers>
  noData: Required<ApexNoData>
  plotOptions: Required<ApexPlotOptions>
  responsive: ApexResponsive[]
  parsing: Required<ApexParsing>
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  states: Required<ApexStates>
  stroke: Required<ApexStroke>
  subtitle: Required<ApexTitleSubtitle>
  theme: Required<ApexTheme>
  title: Required<ApexTitleSubtitle>
  tooltip: Required<ApexTooltip>
  xaxis: Required<ApexXAxis>
  yaxis: Required<ApexYAxis>[]
  [key: string]: any  // internal runtime properties (convertedCatToNumeric, pan, etc.)
}

// ---------------------------------------------------------------------------
// Slice interfaces — canonical homes for each property group
// ---------------------------------------------------------------------------

/** Tool / pointer interaction state — lives on `w.interact` */
export interface InteractState {
  // Tool mode
  zoomEnabled: boolean
  panEnabled: boolean
  selectionEnabled: boolean
  // Zoom / pan state
  zoomed: boolean
  selection: { x: number; y: number; width: number; height: number } | null | undefined
  visibleXRange: number | undefined
  selectedDataPoints: number[][]
  // Mouse / pointer state
  mousedown: boolean
  clientX: number | null
  clientY: number | null
  lastClientPosition: { x?: number; y?: number }
  lastWheelExecution: number
  // Tooltip capture
  capturedSeriesIndex: number
  capturedDataPointIndex: number
  // Timescale zoom bounds
  disableZoomIn: boolean
  disableZoomOut: boolean
  // Device
  isTouchDevice: boolean
}

/** Label formatter functions — lives on `w.formatters` */
export interface FormatterState {
  xLabelFormatter: Function | undefined
  yLabelFormatters: Function[]
  xaxisTooltipFormatter: Function | undefined
  ttKeyFormatter: Function | undefined
  ttVal: any  // ApexTooltipY | ApexTooltipY[] — stores the whole tooltip.y config
  ttZFormatter: Function | undefined
  legendFormatter: Function
}

/** Candlestick / boxplot OHLC arrays — lives on `w.candleData` */
export interface CandleData {
  seriesCandleO: number[][]
  seriesCandleH: number[][]
  seriesCandleM: number[][]
  seriesCandleL: number[][]
  seriesCandleC: number[][]
}

/** Range chart arrays — lives on `w.rangeData` */
export interface RangeData {
  seriesRangeStart: number[][]
  seriesRangeEnd: number[][]
  seriesRange: Array<Array<{ y: number; y2: number }>>
}

/** Label / category data — lives on `w.labelData` */
export interface LabelData {
  labels: string[]
  categoryLabels: string[]
  timescaleLabels: Array<{ value: string; position: number; unit: string }>
  hasXaxisGroups: boolean
  groups: Array<{ title: string; cols: number }>
  seriesGroups: string[][]
}

/** Axis / parsing behaviour flags — lives on `w.axisFlags` */
export interface AxisFlags {
  isXNumeric: boolean
  dataFormatXNumeric: boolean
  isDataXYZ: boolean
  isRangeData: boolean
  isRangeBar: boolean
  isMultiLineX: boolean
  noLabelsProvided: boolean
  dataWasParsed: boolean
}

/** Parsed series data — lives on `w.seriesData` */
export interface SeriesData {
  series: number[][]
  seriesNames: string[]
  seriesX: number[][]
  seriesZ: number[][]
  seriesColors: string[]
  seriesGoals: Array<Array<Array<{ name: string; value: number; strokeColor?: string }>>>
  stackedSeriesTotals: number[]
  stackedSeriesTotalsByGroups: number[][]
}

/** Grid / axis layout — lives on `w.layout` */
export interface LayoutCoords {
  gridHeight: number
  gridWidth: number
  translateX: number
  translateY: number
  translateXAxisX: number
  translateXAxisY: number
  rotateXLabels: boolean
  xAxisHeight: number
  xAxisLabelsHeight: number
  xAxisGroupLabelsHeight: number
  xAxisLabelsWidth: number
  yLabelsCoords: Array<{ width: number; index: number }>
  yTitleCoords: Array<{ width: number; height: number }>
}

/** Return type of CoreUtils.getCalculatedRatios() */
export interface XYRatios {
  yRatio: number[]
  invertedYRatio: number
  zRatio: number
  xRatio: number
  invertedXRatio: number
  baseLineInvertedY: number
  baseLineY: number[]
  baseLineX: number
}

// ---------------------------------------------------------------------------
// ChartGlobals — the full `w.globals` flat object
//
// Properties that live in slices are listed here WITH their types — the shims
// in Base.js make them readable/writable from w.globals too, so internal code
// that still accesses w.globals.series (etc.) gets a type.
//
// Prefer accessing through the slice (w.seriesData.series) in new code.
// ---------------------------------------------------------------------------

export interface ChartGlobals
  extends SeriesData,
    LabelData,
    AxisFlags,
    LayoutCoords {
  // ── Identity ─────────────────────────────────────────────────────────────
  chartID: string | null
  cuid: string | null
  chartClass: string

  // ── Event registry ────────────────────────────────────────────────────────
  events: {
    beforeMount: Function[]
    mounted: Function[]
    updated: Function[]
    clicked: Function[]
    selection: Function[]
    dataPointSelection: Function[]
    zoomed: Function[]
    scrolled: Function[]
  }

  // ── Theme colors ──────────────────────────────────────────────────────────
  colors: string[]
  fill: { colors: string[] }
  stroke: { colors: string[] }
  dataLabels: { style: { colors: string[] } }
  radarPolygons: { fill: { colors: string[] } }
  markers: { colors: string[]; size: number[]; largestSize: number }

  // ── Chart-type flags ──────────────────────────────────────────────────────
  axisCharts: boolean
  xyCharts: boolean
  isSlopeChart: boolean
  comboCharts: boolean
  comboBarCount: number
  isBarHorizontal: boolean

  // ── Config snapshots ──────────────────────────────────────────────────────
  initialConfig: ResolvedApexOptions | null
  initialSeries: ApexOptions['series']
  lastXAxis: object[]
  lastYAxis: object[]
  originalSeries: ApexOptions['series'] | null

  // ── Collapse state ────────────────────────────────────────────────────────
  allSeriesCollapsed: boolean
  collapsedSeries: Array<{ index: number; data: number[]; type: string }>
  collapsedSeriesIndices: number[]
  ancillaryCollapsedSeries: Array<{ index: number; data: number[]; type: string }>
  ancillaryCollapsedSeriesIndices: number[]
  risingSeries: number[]
  ignoreYAxisIndexes: number[]

  // ── Lifecycle / update flags ───────────────────────────────────────────────
  isDirty: boolean
  isExecCalled: boolean
  dataChanged: boolean
  resized: boolean

  // ── Axis bounds & scales (ephemeral) ──────────────────────────────────────
  minX: number
  maxX: number
  initialMinX: number
  initialMaxX: number
  minY: number
  maxY: number
  minYArr: number[]
  maxYArr: number[]
  minZ: number
  maxZ: number
  minDate: number
  maxDate: number
  minXDiff: number
  xRange: number
  yRange: number[]
  zRange: number
  dataPoints: number
  xTickAmount: number
  multiAxisTickAmount: number
  yAxisScale: Array<{ niceMin: number; niceMax: number; result: number[]; tickAmount: number }>
  xAxisScale: { result: number[]; niceMin: number; niceMax: number } | null
  xAxisTicksPositions: number[]
  maxValsInArrayIndex: number
  yValueDecimal: number
  allSeriesHasEqualX: boolean
  isMultipleYAxis: boolean
  skipFirstTimelinelabel: boolean
  skipLastTimelinelabel: boolean
  invalidLogScale: boolean
  hasNullValues: boolean

  // ── Series helpers (ephemeral) ────────────────────────────────────────────
  seriesPercent: number[][]
  seriesTotals: number[]
  seriesLog: number[][]
  seriesXvalues: number[][]
  seriesYvalues: number[][]
  seriesYAxisMap: number[][]
  seriesYAxisReverseMap: number[]
  barGroups: string[]
  lineGroups: string[]
  areaGroups: string[]
  hasSeriesGroups: boolean

  // ── Layout extras (ephemeral) ─────────────────────────────────────────────
  svgWidth: number
  svgHeight: number
  yAxisLabelsWidth: number
  yAxisWidths: number[]
  translateYAxisX: number[]
  scaleX: number
  scaleY: number
  barPadForNumericAxis: number
  padHorizontal: number
  radialSize: number
  barHeight: number
  barWidth: number
  defaultLabels: boolean
  overlappingXLabels: boolean

  // ── Animation ─────────────────────────────────────────────────────────────
  animationEnded: boolean
  shouldAnimate: boolean
  previousPaths: any[]

  // ── Data format flags ─────────────────────────────────────────────────────
  columnSeries: object | null
  yaxis: object[] | null
  total: number
  noData: boolean

  // ── Caches ────────────────────────────────────────────────────────────────
  textRectsCache: Map<string, { width: number; height: number }>
  domCache: Map<string, Element>
  dimensionCache: Record<string, { value: any; lastUpdate: number }>
  cachedSelectors: Record<string, NodeList>
  pointsArray: number[][][]
  dataLabelsRects: DOMRect[]
  lastDrawnDataLabelsIndexes: number[][]
  delayedElements: Array<{ el: Element; index?: number }>
  resizeTimer: number | null
  selectionResizeTimer: number | null
  resizeObserver: ResizeObserver | null

  // ── Locale ────────────────────────────────────────────────────────────────
  locale: Record<string, any>
  memory: { methodsToExec: Array<{ context: object; id: string; method: Function; label: string; params: unknown }> }

  // ── Scale constants ───────────────────────────────────────────────────────
  LINE_HEIGHT_RATIO: number
  niceScaleAllowedMagMsd: number[][]
  niceScaleDefaultTicks: number[]

  // ── DOM instance refs ─────────────────────────────────────────────────────
  tooltip: TooltipModule | null
  dom: ChartDom

  // ── Interact / formatters shimmed onto globals ────────────────────────────
  // (bidirectional shims in Base.js — same value as w.interact.* / w.formatters.*)
  zoomEnabled: boolean
  panEnabled: boolean
  selectionEnabled: boolean
  zoomed: boolean
  selection: { x: number; y: number; width: number; height: number } | null | undefined
  visibleXRange: number | undefined
  selectedDataPoints: number[][]
  mousedown: boolean
  clientX: number | null
  clientY: number | null
  lastClientPosition: { x?: number; y?: number }
  capturedSeriesIndex: number
  capturedDataPointIndex: number
  disableZoomIn: boolean
  disableZoomOut: boolean
  isTouchDevice: boolean
  xLabelFormatter: Function | undefined
  yLabelFormatters: Function[]
  xaxisTooltipFormatter: Function | undefined
  ttKeyFormatter: Function | undefined
  ttVal: any  // ApexTooltipY | ApexTooltipY[]
  ttZFormatter: Function | undefined
  legendFormatter: Function | undefined

  // ── Candle / range data shimmed onto globals ───────────────────────────────
  seriesCandleO: number[][]
  seriesCandleH: number[][]
  seriesCandleM: number[][]
  seriesCandleL: number[][]
  seriesCandleC: number[][]
  seriesRangeStart: number[][]
  seriesRangeEnd: number[][]
  seriesRange: Array<Array<{ y: number; y2: number }>>
}

// ---------------------------------------------------------------------------
// ChartDom — DOM node cache (lives on w.dom, shimmed to w.globals.dom)
// ---------------------------------------------------------------------------

export interface ChartDom {
  Paper: any               // SVGContainer — the root SVG element wrapper
  elWrap: HTMLElement      // outermost chart wrapper div
  elInner: HTMLElement     // inner div (contains SVG + axis labels)
  baseEl: Element          // the user-provided mount element
  elGraphical: any         // SVGContainer holding the main chart drawing area
  elLegend: HTMLElement | null
  elLegendWrap: HTMLElement | null
  elLegendForeign: HTMLElement | null
  elGraphSeries: Element
  elXAxisAnnotations: Element | null
  elYAxisAnnotations: Element | null
  elPointAnnotations: Element | null
  elDefs: any              // SVG <defs> element wrapper
  elGrid: Element | null
  elGridBorders: Element | null
  // Clip-path rect wrappers (SVG elements)
  elGridRect: any | null
  elGridRectMask: any | null
  elGridRectBar: any | null
  elGridRectBarMask: any | null
  elGridRectMarker: any | null
  elGridRectMarkerMask: any | null
  elForecastMask: any | null
  elNonForecastMask: any | null
  [key: string]: any       // allow runtime-added dom refs without exhaustive typing
}

// ---------------------------------------------------------------------------
// ChartStateW — the full `w` object returned by Base.init()
// ---------------------------------------------------------------------------

export interface ChartStateW {
  config: ResolvedApexOptions
  globals: ChartGlobals
  dom: ChartDom
  interact: InteractState
  formatters: FormatterState
  candleData: CandleData
  rangeData: RangeData
  labelData: LabelData
  axisFlags: AxisFlags
  seriesData: SeriesData
  layout: LayoutCoords
}

// ---------------------------------------------------------------------------
// Internal config extensions — runtime properties added to ApexOptions sub-objects
// ---------------------------------------------------------------------------

// Extend the public ApexXAxis type with the internal runtime property.
// This is set by Defaults.convertCatToNumericXaxis() and Options.js — it is
// intentionally NOT part of the documented public API (users must not set it).
// Note: ApexXAxis.convertedCatToNumeric, ApexChart.pan, and yaxis array
// normalisation cannot be declaration-merged because the public types use
// `declare namespace ApexCharts` (not ES module exports). Internal code that
// accesses these uses /** @type {any} */ casts or @ts-ignore at the call site.

// ---------------------------------------------------------------------------
// Tooltip module interface — public methods callable on ctx.tooltip
// ---------------------------------------------------------------------------

export interface TooltipModule {
  drawTooltip(xyRatios: object): void
  [key: string]: any
}

// ---------------------------------------------------------------------------
// ChartContext — the ApexCharts instance (ctx / `this` in apexcharts.js)
// All module properties assigned in InitCtxVariables.initModules()
// ---------------------------------------------------------------------------

export interface ChartContext {
  // Core identity
  el: Element
  w: ChartStateW
  ctx: ChartContext   // self-reference: this.ctx = this
  opts: any           // original user-supplied options

  // Public method list (populated by initModules)
  publicMethods: string[]
  eventList: string[]

  // Public methods on the ApexCharts instance
  update(options?: any): Promise<any>
  getSyncedCharts(): any[]
  getGroupedCharts(): any[]
  fastUpdate(options?: any): Promise<any>

  // Core modules — always present (typed as `any` until individual module
  // class types are created; matches `/** @type {any} */` in apexcharts.js)
  animations: any
  axes: any
  core: any
  config: any
  data: any
  grid: any
  graphics: any
  coreUtils: any
  crosshairs: any
  events: any
  fill: any
  localization: any
  options: any
  responsive: any
  series: any
  theme: any
  formatters: any
  titleSubtitle: any
  dimensions: any
  updateHelpers: any
  tooltip: any

  // Optional feature modules (null when not registered / after destroy)
  exports: any
  legend: any
  toolbar: any
  zoomPanSelection: any
  keyboardNavigation: any

  // Internal sub-modules instantiated during render
  annotations?: any
  markers?: any
  pie?: any
  theme2?: any
  timeScale?: any

  // Catch-all for dynamic runtime properties (chart type instances,
  // private fields like _zoomPanSelection, _toolbar, etc.)
  [key: string]: any
}
