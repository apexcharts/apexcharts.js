// TypeScript declarations for ApexCharts.
// The ApexCharts class and a namespace of the same name are merged here so
// that consumers can access sub-types either as named imports
// (`import type { ApexOptions } from 'apexcharts'`) or via the class
// namespace (`ApexCharts.ApexOptions`).
//
// For the full set of supported options, see https://apexcharts.com/docs/options

// ---------------------------------------------------------------------------
// Shared formatter/event opts types
// ---------------------------------------------------------------------------

/**
 * The chart state object passed as `w` to formatters, event opts, and
 * snapshots. Common access patterns:
 *   - `w.config.chart.type` — the merged user options
 *   - `w.globals.seriesNames` — runtime state bag
 *
 * `globals` is intentionally `any` because it is a large, internal surface;
 * prefer the typed `ApexCharts.ChartState` returned by `getState()` for
 * stable access. Other internal slices (`dom`, `formatters`, `interact`,
 * `layout`, etc.) exist on `w` but are not part of the documented API and
 * may change between releases — the index signature documents their
 * presence without committing to a stable shape.
 */
type ApexChartContext = {
  config: ApexCharts.ApexOptions
  globals: any
  [key: string]: any
}

/**
 * Opts object passed to most chart event callbacks (click, mouseMove,
 * keyDown, etc.). For some events (mouseMove, click, keyDown, keyUp)
 * `w` is also spread into the opts object as a convenience, so members
 * of `w` (config, globals, etc.) may be accessed directly on opts. The
 * index signature reflects that.
 */
type ApexChartEventOpts = {
  seriesIndex: number
  dataPointIndex: number
  w: ApexChartContext
  [key: string]: any
}

/**
 * Opts object passed to most value formatters (dataLabels, tooltip y,
 * etc.). `series` is included for tooltip formatters; ignore it elsewhere.
 */
type ApexFormatterOpts = {
  seriesIndex: number
  dataPointIndex: number
  series?: any[][]
  w: ApexChartContext
}

/**
 * Opts object passed to legend.formatter and legend.tooltipHoverFormatter.
 */
type ApexLegendFormatterOpts = {
  seriesIndex: number
  w: ApexChartContext
}

/**
 * Opts object passed to `colors[]` when a color is provided as a function.
 */
type ApexColorFormatterOpts = {
  value: number
  seriesIndex: number
  dataPointIndex: number
  w: ApexChartContext
}

/**
 * Opts object passed to `tooltip.custom`. `series` is the parsed series
 * matrix; `y1`/`y2` are populated for range-bar / range-area tooltips.
 */
type ApexTooltipCustomOpts = {
  series: number[][]
  seriesIndex: number
  dataPointIndex: number
  y1?: number
  y2?: number
  w: ApexChartContext
}

declare class ApexCharts {
  constructor(el: HTMLElement, options: ApexCharts.ApexOptions)

  /** Renders the chart. Must be called once after construction. */
  render(): Promise<ApexCharts>

  /**
   * Merges new options into the existing config and re-renders the chart.
   * @param redraw When true, redraws from scratch instead of animating from previous paths.
   * @param animate Whether to animate the update.
   * @param updateSyncedCharts Whether to propagate the update to charts in the same group.
   * @param overwriteInitialConfig When true, replaces the stored initial config used by resetSeries().
   */
  updateOptions(
    options: ApexCharts.ApexOptions,
    redraw?: boolean,
    animate?: boolean,
    updateSyncedCharts?: boolean,
    overwriteInitialConfig?: boolean
  ): Promise<ApexCharts>

  /**
   * Replaces the chart's series data and re-renders.
   * @param overwriteInitialSeries When true, replaces the stored initial series used by resetSeries().
   */
  updateSeries(
    newSeries: ApexAxisChartSeries | ApexNonAxisChartSeries,
    animate?: boolean,
    overwriteInitialSeries?: boolean
  ): Promise<ApexCharts>

  /**
   * Appends a new series to the existing series array and re-renders.
   * @param overwriteInitialSeries When true, replaces the stored initial series used by resetSeries().
   */
  appendSeries(
    newSerie: ApexAxisChartSeries[0] | number,
    animate?: boolean,
    overwriteInitialSeries?: boolean
  ): Promise<ApexCharts>

  /**
   * Appends data points to existing series without replacing them.
   * Each element corresponds to the series at the same index.
   */
  appendData(data: Array<{ data: any[] }>, overwriteInitialSeries?: boolean): Promise<ApexCharts>

  /** Toggles (show/hide) the series by name. Mirrors a click on the legend item. */
  toggleSeries(seriesName: string): object | undefined

  /**
   * Linked Views (#4): clears crossfilter dimming across this chart and every
   * chart in its `chart.group`. No-op unless the `link` feature is bundled.
   */
  clearCrossfilter(): void

  /**
   * Overlay Compare (#18): arm a sticky measure-ruler mode. Drag A->B on the
   * plot to read dx/dy/%change/slope. Requires the `overlayCompare` feature and
   * `chart.measure.enabled`.
   */
  startMeasure(): void

  /** Overlay Compare (#18): leave measure mode. */
  stopMeasure(): void

  /** Overlay Compare (#18): remove all pinned measure rulers. */
  clearMeasures(): void

  /** Highlights or un-highlights a series when a legend marker is hovered. */
  highlightSeriesOnLegendHover(e: MouseEvent, targetElement: HTMLElement): void

  /** Makes a previously hidden series visible and re-renders. */
  showSeries(seriesName: string): void

  /** Hides a visible series and re-renders. */
  hideSeries(seriesName: string): void

  /** Highlights (dims all other series) the series identified by name. */
  highlightSeries(seriesName: string): void

  /** Returns whether the series identified by name is currently hidden. */
  isSeriesHidden(seriesName: string): boolean

  /**
   * Resets the chart to its initial series and optionally its initial zoom level.
   * @param shouldUpdateChart When true, triggers a re-render. Default true.
   * @param shouldResetZoom When true, restores the initial zoom level. Default true.
   */
  resetSeries(shouldUpdateChart?: boolean, shouldResetZoom?: boolean): void

  /** Programmatically zooms the x-axis to [min, max]. Requires zoom to be enabled. */
  zoomX(min: number, max: number): void

  /**
   * Programmatically selects or deselects a data point.
   * @returns Updated selectedDataPoints array, or null.
   */
  toggleDataPointSelection(seriesIndex: number, dataPointIndex?: number): number[][] | null

  /** Destroys the chart instance, removing all DOM elements and event listeners. */
  destroy(): void

  /**
   * Switches the active locale, updating all locale-dependent labels.
   * @param localeName Must match a name defined in chart.locales.
   */
  setLocale(localeName: string): void

  /**
   * Subscribes to a chart event by name.
   * Event names mirror the chart.events option keys (e.g. 'mounted', 'updated', 'dataPointMouseEnter').
   */
  addEventListener(name: string, handler: (...args: any[]) => void): void

  /** Removes a previously registered event listener. */
  removeEventListener(name: string, handler: (...args: any[]) => void): void

  /** Adds an x-axis annotation dynamically after render. */
  addXaxisAnnotation(options: XAxisAnnotations, pushToMemory?: boolean, context?: ApexCharts): void

  /** Adds a y-axis annotation dynamically after render. */
  addYaxisAnnotation(options: YAxisAnnotations, pushToMemory?: boolean, context?: ApexCharts): void

  /** Adds a point annotation dynamically after render. */
  addPointAnnotation(options: PointAnnotations, pushToMemory?: boolean, context?: ApexCharts): void

  /** Removes a specific annotation by its id. */
  removeAnnotation(id: string, context?: ApexCharts): void

  /** Removes all annotations from the chart. */
  clearAnnotations(context?: ApexCharts): void

  /**
   * Exports the chart to a data URI.
   * Requires the Exports feature: import 'apexcharts/features/exports'.
   */
  dataURI(options?: { scale?: number; width?: number }): Promise<{ imgURI: string } | { blob: Blob }>

  /**
   * Returns the chart's SVG markup as a string.
   * Requires the Exports feature: import 'apexcharts/features/exports'.
   */
  getSvgString(scale?: number): Promise<string>

  /**
   * Triggers a CSV download of the chart's data.
   * Requires the Exports feature: import 'apexcharts/features/exports'.
   */
  exportToCSV(options?: { series?: ApexAxisChartSeries | ApexNonAxisChartSeries; fileName?: string; columnDelimiter?: string; lineDelimiter?: string }): void

  /** Returns the SVG.js root element (SVG Paper) for the chart. */
  paper(): any

  /**
   * Returns the active series renderer for the last render (Strata #2):
   * `'svg'` (default) or `'canvas'`. Resolves to `'svg'` unless the canvas
   * renderer feature is bundled and no canvas-unsupported feature is in use.
   */
  getActiveRenderer(): 'svg' | 'canvas' | 'gpu'

  /**
   * Drills into the child level referenced by `id` (a `drilldown.series` entry).
   * Requires the Drilldown feature: import 'apexcharts/features/drilldown'.
   */
  drillDown(id: string | number): Promise<ApexCharts>

  /**
   * Navigates back one drilldown level.
   * Requires the Drilldown feature: import 'apexcharts/features/drilldown'.
   */
  drillUp(): Promise<ApexCharts>

  /**
   * Navigates back to the root drilldown level.
   * Requires the Drilldown feature: import 'apexcharts/features/drilldown'.
   */
  drillToRoot(): Promise<ApexCharts>

  /** Returns the inner SVG group element containing all chart graphics. */
  getChartArea(): Element | null

  /** Returns the sum of all data points whose x value falls within [minX, maxX]. */
  getSeriesTotalXRange(minX: number, maxX: number): number[]

  /** Returns the highest y value in the specified series. */
  getHighestValueInSeries(seriesIndex?: number): number

  /** Returns the lowest y value in the specified series. */
  getLowestValueInSeries(seriesIndex?: number): number

  /** Returns the sum of each series (totals used for percentage calculations). */
  getSeriesTotal(): number[]

  /** Returns all charts in the same chart.group, including this instance. */
  getSyncedCharts(): ApexCharts[]

  /** Returns all charts in the same chart.group, excluding this instance. */
  getGroupedCharts(): ApexCharts[]

  /**
   * Returns a stable snapshot of chart state for use in formatters, events,
   * and external integrations. Prefer this over accessing chart.w directly.
   */
  getState(): ApexCharts.ChartState

  /**
   * Calls a public method on a chart instance identified by chartID.
   * Useful when you don't have a direct reference to the instance.
   */
  static exec(chartID: string, fn: string, ...args: any[]): any

  /** Retrieves a rendered chart instance by its chart.id config value. */
  static getChartByID(chartID: string): ApexCharts | undefined

  /**
   * Scans the document for elements with data-apexcharts and data-options
   * attributes and renders a chart in each one automatically.
   */
  static initOnLoad(): void

  /** Deep-merges source into target and returns the result. */
  static merge(target: object, source: object): object

  /**
   * Registers chart type constructors for tree-shaking support.
   * Used by sub-entry points (e.g. apexcharts/charts/bar).
   */
  static use(typeMap: Record<string, new (...args: any[]) => any>): void

  /**
   * Registers optional feature modules (Exports, Legend, Toolbar,
   * ZoomPanSelection, KeyboardNavigation, Annotations).
   * Call before rendering any chart.
   */
  static registerFeatures(featureMap: Record<string, new (...args: any[]) => any>): void

  /**
   * Registers a Weave plugin definition. Available in every bundle; the plugin
   * activates only when the Weave host is bundled and listed in a chart's
   * `plugins` config.
   */
  static registerPlugin(def: ApexPlugin): void

  /**
   * Registers a non-SVG series renderer (Strata #2). The canvas backend
   * registers itself via `import 'apexcharts/features/renderer-canvas'`.
   */
  static registerRenderer(kind: string, factory: (w: any, ctx: any) => any): void

  /**
   * Registers a custom series type (Marks #11): a `{ renderItem }` definition
   * that draws primitives per datum. Requires the Marks feature to be bundled
   * (`import 'apexcharts/features/marks'`, included in the full bundle).
   * Once registered, reference it via `series[].type` or `chart.type`.
   */
  static registerSeriesType(name: string, def: ApexSeriesTypeDef): typeof ApexCharts

  /**
   * Registers a named theme (Facet #13): a palette + design-token + mode bundle
   * referenceable via `theme: { name }`. Sits below explicit config and CSS
   * `--apx-*` tokens, above the built-in palette/mode defaults.
   */
  static registerTheme(name: string, def: ApexThemeDef): typeof ApexCharts

  /**
   * Registers a named easing (Cadence #6) referenceable via
   * `chart.animations.easing: '<name>'`. `fn` maps linear progress t in [0,1]
   * to eased progress (back/elastic curves may overshoot 1).
   */
  static registerEasing(name: string, fn: (t: number) => number): typeof ApexCharts

  /**
   * Linked Views (#4) Phase 2: get-or-create a crossfilter coordinator by id.
   * Register one shared record set; each participating chart declares a
   * dimension + reduction under `chart.link`, and selecting in one chart
   * re-aggregates the others over the filtered subset. Requires the `link`
   * feature (`import 'apexcharts/features/link'`); returns null without it.
   */
  static crossfilter(opts: { id: string; records?: any[] }): ApexCrossfilter | null

  /** Look up an existing crossfilter coordinator by id (null if none). */
  static getCrossfilter(id: string): ApexCrossfilter | null

  /**
   * Static, pure Perspectives helpers. Available once the feature is imported:
   * `import 'apexcharts/features/perspectives'`.
   */
  static perspectives: {
    decode(str: string): ApexPerspective | null
    fromURL(href?: string): ApexPerspective | null
  }

  exports: {
    cleanup(): string
    svgUrl(): string
    dataURI(options?: { scale?: number; width?: number }): Promise<{ imgURI: string } | { blob: Blob }>
    exportToSVG(): void
    exportToPng(): void
    exportToCSV(options?: { series?: ApexAxisChartSeries | ApexNonAxisChartSeries; fileName?: string; columnDelimiter?: string; lineDelimiter?: string }): void
    getSvgString(scale?: number): Promise<string>
    triggerDownload(href: string, filename?: string, ext?: string): void
  }

  /**
   * Perspectives (#10) — serializable, shareable view state.
   * Requires the Perspectives feature: `import 'apexcharts/features/perspectives'`.
   */
  perspectives: {
    capture(): ApexPerspective
    encode(token?: ApexPerspective): string
    decode(str: string): ApexPerspective | null
    toURL(): string
    apply(token: ApexPerspective | string, opts?: { animate?: boolean }): void
    save(name: string): string
    list(): { id: string; name: string; token: ApexPerspective }[]
    delete(id: string): void
  }

  /**
   * Rewind (#3) — undo/redo history.
   * Requires the History feature (`import 'apexcharts/features/history'`) and
   * chart.history.enabled: true.
   */
  history: {
    undo(animate?: boolean): void
    redo(animate?: boolean): void
    canUndo(): boolean
    canRedo(): boolean
    jump(id: string, animate?: boolean): void
    clear(): void
    transaction(fn: () => void | Promise<any>, opts?: { label?: string }): Promise<void>
    entries(): ApexHistoryEntry[]
  }
}

interface ApexHistoryEntry {
  id: string
  label: string
  at: number
}

interface ApexViewState {
  v: number
  window: {
    xaxis: { min: number | null; max: number | null } | null
    yaxis: ({ min: number | null; max: number | null } | null)[] | null
  }
  zoomed: boolean
  collapsed: number[]
  ancillaryCollapsed: number[]
  selectedDataPoints: number[][]
  theme: { mode: string | null; palette: string | null } | null
  locale: string | null
  annotations: {
    static: any
    dynamic: { kind: string; params: any }[]
  }
  drill: { path: (string | number)[] } | null
}

interface ApexPerspective {
  v: number
  view: ApexViewState
  options?: Record<string, any>
}

// ── Weave (#1) — public plugin platform ──
type ApexPluginHook =
  | 'afterParse'
  | 'afterScales'
  | 'draw'
  | 'afterUpdate'
  | 'destroy'

interface ApexPluginScales {
  x(v: number): number
  y(v: number, axis?: number): number
  domainX: [number, number]
  domainY(axis?: number): [number, number]
  gridWidth: number
  gridHeight: number
  ratios: any
}

interface ApexPluginSeries {
  name?: string
  hidden: boolean
  color?: string
  points: { x: any; y: any }[]
}

interface ApexPluginLayer {
  readonly node: SVGGElement
  path(opts: {
    d: string
    stroke?: string
    width?: number
    fill?: string
    opacity?: number
    dash?: number
    className?: string
  }): any
  line(opts: {
    x1: number
    y1: number
    x2: number
    y2: number
    stroke?: string
    width?: number
    dash?: number
  }): any
  rect(opts: {
    x?: number
    y?: number
    w?: number
    h?: number
    r?: number
    fill?: string
    stroke?: string
    opacity?: number
  }): any
  circle(opts: {
    cx?: number
    cy?: number
    r?: number
    fill?: string
    stroke?: string
  }): any
  text(opts: {
    x?: number
    y?: number
    text?: string
    color?: string
    size?: string
    anchor?: string
    weight?: string
  }): any
  clear(): ApexPluginLayer
}

interface ApexPluginPayload {
  api: ApexPluginAPI
  scales: ApexPluginScales | null
  data: ApexPluginSeries[]
  pass: 'full' | 'fast' | 'update'
  hook: ApexPluginHook
}

interface ApexPluginAPI {
  readonly name: string
  readonly version: number
  readonly options: Record<string, any>
  on(hook: ApexPluginHook, fn: (payload: ApexPluginPayload) => void): ApexPluginAPI
  off(hook: ApexPluginHook, fn: (payload: ApexPluginPayload) => void): ApexPluginAPI
  store: Record<string, any>
  layer(opts?: { z?: 'front' | 'behind'; className?: string }): ApexPluginLayer
  readonly scales: ApexPluginScales | null
  readonly data: ApexPluginSeries[]
  theme: {
    readonly mode: string
    readonly foreColor: string
    seriesColor(i: number): string
    token(name: string): any
  }
  chart: Record<string, (...args: any[]) => any>
  emit(name: string, detail?: any): void
  readonly el: Element
}

interface ApexPlugin {
  name: string
  apiVersion?: number
  setup(api: ApexPluginAPI): void
  destroy?(api: ApexPluginAPI): void
}

interface ApexPluginActivation {
  name: string
  options?: Record<string, any>
  order?: number
}

/**
 * Marks (#11): the per-datum primitive API passed to `renderItem`. Each call
 * emits a mark (renderer-agnostic: SVG today, canvas above `rendererThreshold`),
 * tags it with the datum identity so tooltip/selection/keyboard work, and adds
 * it to the series group. Coordinates are pixels in series space.
 */
interface ApexMarksAPI {
  path(opts: { d: string; stroke?: string; width?: number; fill?: string; opacity?: number; fillOpacity?: number; strokeOpacity?: number; dash?: number | number[]; lineCap?: string }): any
  line(opts: { x1: number; y1: number; x2: number; y2: number; stroke?: string; width?: number; dash?: number | number[] }): any
  rect(opts: { x?: number; y?: number; w?: number; h?: number; r?: number; fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }): any
  circle(opts: { cx?: number; cy?: number; r?: number; fill?: string; stroke?: string; strokeWidth?: number }): any
  text(opts: { x?: number; y?: number; text?: string | string[]; anchor?: 'start' | 'middle' | 'end'; size?: number; color?: string; weight?: number | string }): any
}

/** Marks (#11): series-space scales (elGraphical-local pixels). */
interface ApexMarksScales {
  /** data x value -> pixel (numeric axes) */
  x(value: number): number
  /**
   * Resolve a datum's x pixel by index and value: numeric axes map by value,
   * categorical band axes (e.g. xaxis.tickPlacement:'between') map by index to
   * the band center. `ctx.x` is `xAt(dataPointIndex, datum.x)`.
   */
  xAt(index: number, value: any): number
  /** data y value -> pixel (optionally a specific y-axis index) */
  y(value: number, axis?: number): number
  gridWidth: number
  gridHeight: number
  /** pixel width of one x step (numeric) or one band (categorical) */
  band: number
}

/** Marks (#11): context passed to `renderItem` for one datum. */
interface ApexMarksItemContext {
  /** the raw datum from `series[].data` */
  datum: any
  /** resolved x pixel of this datum */
  x: number
  /** resolved y pixel of this datum's primary value */
  y: number
  scales: ApexMarksScales
  api: ApexMarksAPI
  seriesIndex: number
  dataPointIndex: number
  /** the series palette colour */
  color: string
}

/** Marks (#11): a custom series type definition for `registerSeriesType`. */
interface ApexSeriesTypeDef {
  /** Draw one datum by returning/emitting primitives via `ctx.api`. */
  renderItem(ctx: ApexMarksItemContext): any
  /**
   * Data shape hint. Default 'xy' (scalar y). Set 'rangeXY' when a datum's `y`
   * is a `[lo, hi]` pair (dumbbell/range mark): both bounds fold into the
   * y-axis scale and the tooltip renders "lo - hi".
   */
  dataType?: 'xy' | 'rangeXY' | 'custom'
  /**
   * Per-datum y-extent override for auto-scaling, when the drawn span is not
   * simply `y` (e.g. a bullet whose target/bands extend past the value).
   * Return the value(s) the datum occupies; the min and max fold into the
   * y-axis scale. Takes precedence over `dataType`.
   */
  yExtent?: (datum: any, dataPointIndex: number) => number | number[]
  /** Tooltip value(s) for a datum. */
  tooltip?: (datum: any) => number | number[] | string
}

declare namespace ApexCharts {
  export interface ChartState {
    // Series data — computed/parsed form used for rendering
    series: number[][] | any[]
    seriesNames: string[]
    colors: string[]
    labels: string[]
    seriesTotals: number[]
    seriesPercent: number[][]
    seriesXvalues: number[][]
    seriesYvalues: number[][]

    // Axis bounds — updated after each render
    minX: number
    maxX: number
    minY: number
    maxY: number
    minYArr: number[]
    maxYArr: number[]
    minXDiff: number
    dataPoints: number

    // Axis scale objects — computed tick/scale results
    xAxisScale: { result: number[]; niceMin: number; niceMax: number } | null
    yAxisScale: { result: number[]; niceMin: number; niceMax: number }[]
    xTickAmount: number

    // Axis type flags
    isXNumeric: boolean

    // Multi-axis series mapping
    seriesYAxisMap: number[][]
    seriesYAxisReverseMap: number[]

    // Chart dimensions — updated after each render/resize
    svgWidth: number
    svgHeight: number
    gridWidth: number
    gridHeight: number

    // Interactive state
    selectedDataPoints: number[][]
    collapsedSeriesIndices: number[]
    zoomed: boolean

    // Chart-type-specific series data (empty arrays when not applicable)
    seriesX: any[][]
    seriesZ: number[][]
    seriesCandleO: number[][]
    seriesCandleH: number[][]
    seriesCandleM: number[][]
    seriesCandleL: number[][]
    seriesCandleC: number[][]
    seriesRangeStart: number[][]
    seriesRangeEnd: number[][]
    seriesGoals: any[][]
  }

  /** A single drilldown level, referenced by a data point's `drilldown` id. */
  export interface ApexDrilldownSeries {
    /** Unique id referenced by a data point's `drilldown` field. */
    id: string | number
    /** Display name used by the breadcrumb and as the (single-series) child series name. */
    name?: string
    /** Child data points for a single-series level. Use this OR `series`. */
    data?: any[]
    /** Full multi-series array for a grouped/stacked drilldown level. Use this OR `data`. */
    series?: ApexAxisChartSeries
    /** Optional chart-type override applied when this level is shown. */
    chart?: Pick<ApexChart, 'type' | 'stacked' | 'stackType'>
    plotOptions?: ApexPlotOptions
    xaxis?: ApexXAxis
    yaxis?: ApexYAxis | ApexYAxis[]
    colors?: Array<string | ((opts: ApexColorFormatterOpts) => string)>
    /** Optional fill override (e.g. a pattern fill to visually distinguish drilled levels). */
    fill?: ApexFill
    /** Optional legend override (e.g. show a legend when a level is a pie/donut). */
    legend?: ApexLegend
  }

  /** Payload passed to drill events (`drillDownStart`, `drillDownEnd`, `drillUp`). */
  export interface ApexDrilldownEvent {
    /** The level id navigated away from. */
    from: string | number
    /** The level id navigated to (`'root'` at the top). */
    to: string | number
    /** The clicked data point (drill-down only). */
    point?: any
    seriesIndex?: number
    dataPointIndex?: number
  }

  /** Context passed to the async `onDrillDown` resolver. */
  export interface ApexDrilldownContext {
    point: any
    seriesIndex?: number
    dataPointIndex?: number
  }

  export interface ApexDrilldown {
    /** Master switch. When false the feature stays inert even if imported. */
    enabled?: boolean
    /** Inline child levels referenced by data-point `drilldown` ids. */
    series?: ApexDrilldownSeries[]
    breadcrumb?:
      | false
      | {
          show?: boolean
          position?: 'top-left' | 'top-right'
          separator?: string
          rootLabel?: string
          offsetX?: number
          offsetY?: number
          formatter?(label: string, opts: { index: number; depth: number }): string
        }
    animation?: {
      enabled?: boolean
      /**
       * Anchor the drill transition at the clicked point: the child unfolds
       * outward from it (and settles back on drill-up) instead of the chart
       * simply re-rendering. A gentle scale layered on the SVG. Opt-in.
       * Defaults to false.
       */
      zoomFromPoint?: boolean
      /** Base transition duration in ms when `zoomFromPoint` is true. Default 260. */
      speed?: number
    }
    /** Async resolver called when a drillable point has no inline `series` match. */
    onDrillDown?(
      ctx: ApexDrilldownContext
    ): ApexDrilldownSeries | Promise<ApexDrilldownSeries>
  }

  export interface ApexOptions {
    annotations?: ApexAnnotations
    chart?: ApexChart
    /**
     * Series colors. Each entry is either a CSS color string (hex, rgb, hsl,
     * named) or a function returning one per-datapoint. The list cycles when
     * there are more series than colors.
     */
    colors?: Array<string | ((opts: ApexColorFormatterOpts) => string)>
    dataLabels?: ApexDataLabels
    /** Opt-in drilldown navigation. Requires `import 'apexcharts/features/drilldown'`. */
    drilldown?: ApexDrilldown
    fill?: ApexFill
    forecastDataPoints?: ApexForecastDataPoints
    grid?: ApexGrid
    labels?: string[]
    legend?: ApexLegend
    markers?: ApexMarkers
    noData?: ApexNoData
    /** Weave (#1) plugin activation list. Requires `import 'apexcharts/features/weave'`. */
    plugins?: ApexPluginActivation[]
    plotOptions?: ApexPlotOptions
    responsive?: ApexResponsive[]
    parsing?: ApexParsing;
    series?: ApexAxisChartSeries | ApexNonAxisChartSeries
    states?: ApexStates
    stroke?: ApexStroke
    subtitle?: ApexTitleSubtitle
    theme?: ApexTheme
    title?: ApexTitleSubtitle
    tooltip?: ApexTooltip
    xaxis?: ApexXAxis
    yaxis?: ApexYAxis | ApexYAxis[]
  }

  // Re-exported sub-types — consumers can use these as:
  //   import type ApexCharts from 'apexcharts'
  //   const yaxis: ApexCharts.ApexYAxis = { ... }
  export type { ApexAnnotations }
  export type { ApexChart }
  export type { ApexDataLabels }
  export type { ApexFill }
  export type { ApexForecastDataPoints }
  export type { ApexGrid }
  export type { ApexLegend }
  export type { ApexMarkers }
  export type { ApexNoData }
  export type { ApexPlotOptions }
  export type { ApexResponsive }
  export type { ApexParsing }
  export type { ApexStates }
  export type { ApexStroke }
  export type { ApexTitleSubtitle }
  export type { ApexTheme }
  export type { ApexTooltip }
  export type { ApexXAxis }
  export type { ApexYAxis }
  export type { ApexAxisChartSeries }
  export type { ApexNonAxisChartSeries }
  export type { ApexLocale }
  export type { ApexDropShadow }
  export type { ApexChartContext }
  export type { ApexChartEventOpts }
  export type { ApexFormatterOpts }
  export type { ApexLegendFormatterOpts }
  export type { ApexColorFormatterOpts }
  export type { ApexTooltipCustomOpts }
  export type { XAxisAnnotations }
  export type { YAxisAnnotations }
  export type { PointAnnotations }
  export type { TextAnnotations }
  export type { ImageAnnotations }
}

type ApexDropShadow = {
  enabled?: boolean
  top?: number
  left?: number
  blur?: number
  opacity?: number
  /**
   * Shadow color. A single string applies to all series; an array applies
   * per-series (only respected by `chart.dropShadow`).
   */
  color?: string | string[]
}

/**
 * Main Chart options
 * See https://apexcharts.com/docs/options/chart/
 */
type ApexChart = {
  width?: string | number
  height?: string | number
  type?:
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'candlestick'
  | 'boxPlot'
  | 'violin'
  | 'radar'
  | 'polarArea'
  | 'rangeBar'
  | 'rangeArea'
  | 'treemap'
  | 'funnel'
  | 'pyramid'
  | 'gauge'
  /**
   * Internal — populated when `type` is a first-class alias (`'funnel'`,
   * `'pyramid'`, `'gauge'`). The original requested type is preserved here
   * while `type` is normalized to the underlying renderer (`'bar'` or
   * `'radialBar'`). Read-only for consumers.
   */
  requestedType?: 'funnel' | 'pyramid' | 'gauge'
  foreColor?: string
  fontFamily?: string
  background?: string
  offsetX?: number
  offsetY?: number
  dropShadow?: ApexDropShadow & {
    enabledOnSeries?: undefined | number[]
  }
  nonce?: string
  events?: {
    animationEnd?(chart: ApexCharts, options?: ApexChartEventOpts): void
    beforeMount?(chart: ApexCharts, options?: ApexChartEventOpts): void
    mounted?(chart: ApexCharts, options?: ApexChartEventOpts): void
    updated?(chart: ApexCharts, options?: ApexChartEventOpts): void
    mouseMove?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    mouseLeave?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    click?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    xAxisLabelClick?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    legendClick?(chart: ApexCharts, seriesIndex?: number, options?: ApexChartEventOpts): void
    markerClick?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    selection?(chart: ApexCharts, options?: { xaxis?: { min: number; max: number }; yaxis?: { min: number; max: number } }): void
    dataPointSelection?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    dataPointMouseEnter?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    dataPointMouseLeave?(e: MouseEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    beforeZoom?(chart: ApexCharts, options?: { xaxis: { min: number; max: number } }): boolean | void
    beforeResetZoom?(chart: ApexCharts, options?: ApexChartEventOpts): boolean | void
    zoomed?(chart: ApexCharts, options?: { xaxis: { min: number; max: number }; yaxis?: { min: number; max: number }[] }): void
    scrolled?(chart: ApexCharts, options?: { xaxis: { min: number; max: number } }): void
    brushScrolled?(chart: ApexCharts, options?: { xaxis: { min: number; max: number }; yaxis?: { min: number; max: number }[] }): void
    /**
     * Linked Views (#4): fired on the source chart when a brush range drives a
     * crossfilter across the group.
     */
    crossFilter?(chart: ApexCharts, options?: { xaxis: { min: number; max: number }; sourceChartID?: string }): void
    /**
     * Linked Views (#4) FILTER mode: fired on the source chart when a click
     * toggles a crossfilter bucket. `options` carries the coordinator state
     * (active filters, filtered/total counts), the source chartID, and the key.
     */
    filterChange?(chart: ApexCharts, options?: { filters: Record<string, any>; filteredCount: number; total: number; sourceChartID?: string; key?: any }): void
    /**
     * Ink Layer (#7): fired after an annotation is dragged or resized. `options`
     * carries the annotation type ('point' | 'xaxis' | 'yaxis'), id/index, and
     * the new data coordinates (x/y, plus x2/y2 for range annotations).
     */
    annotationDragged?(chart: ApexCharts, options?: { type?: 'point' | 'xaxis' | 'yaxis'; id?: string; index: number; x: any; y: any; x2?: any; y2?: any }): void
    /**
     * Ink Layer (#7): fired after a point annotation's label is edited inline.
     * `options` carries the annotation id/index and the new label text.
     */
    annotationEdited?(chart: ApexCharts, options?: { type?: 'point' | 'xaxis' | 'yaxis'; id?: string; index: number; text: string }): void
    /**
     * Ink Layer (#7): fired after a point annotation is created by clicking the
     * plot in create mode. `options` carries the new annotation id/index + x/y.
     */
    annotationCreated?(chart: ApexCharts, options?: { id?: string; index: number; x: any; y: any }): void
    /**
     * Ink Layer (#7): fired after an annotation is restyled from the floating
     * note editor (accent color, bold, font size, marker size/shape). `options`
     * carries the annotation type/id/index and its current label + marker config.
     */
    annotationStyled?(chart: ApexCharts, options?: { type?: 'point' | 'xaxis' | 'yaxis'; id?: string; index: number; label?: any; marker?: any }): void
    /**
     * Ink Layer (#7): fired after an annotation is deleted from the floating
     * note editor. `options` carries the annotation type/id and the index it
     * occupied before removal.
     */
    annotationDeleted?(chart: ApexCharts, options?: { type?: 'point' | 'xaxis' | 'yaxis'; id?: string; index: number }): void
    /**
     * Overlay Compare (#18): fired when a measure ruler is drawn. Requires the
     * `overlayCompare` feature. `options` carries the endpoints and the deltas.
     */
    measured?(chart: ApexCharts, options?: { from: { x: any; y: any }; to: { x: any; y: any }; dx: number; dy: number; percentChange: number; slope: number }): void
    /** Overlay Compare (#18): fired when the period-compare reference changes. */
    compareChanged?(chart: ApexCharts, options?: { from: any; to: any }): void
    keyDown?(e: KeyboardEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    keyUp?(e: KeyboardEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    /** Fired before a drill-down transition begins. Requires the Drilldown feature. */
    drillDownStart?(info: ApexCharts.ApexDrilldownEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    /** Fired after a drill-down transition completes. Requires the Drilldown feature. */
    drillDownEnd?(info: ApexCharts.ApexDrilldownEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    /** Fired after navigating back up a drilldown level. Requires the Drilldown feature. */
    drillUp?(info: ApexCharts.ApexDrilldownEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    /** Fired when an async onDrillDown resolver throws or rejects. Requires the Drilldown feature. */
    drillDownError?(info: { id: string | number | null; error: any }, chart?: ApexCharts, options?: ApexChartEventOpts): void
  }
  brush?: {
    enabled?: boolean
    autoScaleYaxis?: boolean
    target?: string
    targets?: string[]
  }
  /**
   * Linked Views (#4): crossfilter / linked highlighting. Requires the `link`
   * feature (`import 'apexcharts/features/link'`). Two modes:
   *
   * HIGHLIGHT (P1): `enabled` with no `dimension`. Charts sharing a
   * `chart.group` form a set; brushing a range (needs `chart.selection.enabled`)
   * on any member dims every member's marks whose x is outside the range, in
   * place (no re-render).
   *
   * FILTER (P2): set `dimension` (its presence selects this path). Each chart
   * declares a dimension + reduction over a shared record set registered with
   * `ApexCharts.crossfilter({ id, records })`; clicking a bucket re-aggregates
   * every other participating chart over the filtered subset.
   */
  link?: {
    /** @default false */
    enabled?: boolean
    /** Highlight mode (P1) label; filter mode is selected by `dimension`. @default 'highlight' */
    mode?: 'highlight' | 'filter'
    /** Opacity applied to dimmed (unselected / out-of-range) marks. @default 0.2 */
    dimOpacity?: number
    /** FILTER mode: crossfilter coordinator id (defaults to `chart.group`). */
    id?: string
    /**
     * FILTER mode: `(row) => key`. Its presence selects filter mode. For a
     * heatmap (matrix) dimension it returns `[xKey, yKey]`.
     */
    dimension?: (row: any) => any
    /** FILTER mode: reduction over a bucket's rows. @default 'count' */
    reduce?: 'count' | { sum?: string; avg?: string; min?: string; max?: string } | ((rows: any[]) => number)
    /**
     * FILTER mode: bucket kind. Else inferred: `bins` present => 'range', a
     * heatmap chart => 'matrix' (2D), otherwise 'category'.
     */
    type?: 'category' | 'range' | 'matrix'
    /** FILTER mode (range dims): binning spec. */
    bins?: { width?: number; count?: number; thresholds?: number[] }
    /** FILTER mode (category dims): key ordering. @default 'first-seen' */
    order?: 'first-seen' | 'asc' | 'desc' | ((a: any, b: any) => number)
    /** FILTER mode (axis charts): the derived series name. @default 'Count' */
    seriesName?: string
  }
  /**
   * Ink Layer (#7): direct-manipulation annotations. When enabled, every point
   * annotation is draggable (unless it sets `draggable:false`); or opt in per
   * annotation with `annotations.points[].draggable`. Clicking an ink-managed
   * annotation opens a floating editor card anchored to it: rename inline,
   * recolor via accent swatches, toggle bold, step the font size, size/reshape
   * the marker, or delete the note. Requires the `ink` feature
   * (`import 'apexcharts/features/ink'`). Fires the `annotationDragged`,
   * `annotationEdited`, `annotationStyled` and `annotationDeleted` events.
   */
  ink?: {
    /** @default false */
    enabled?: boolean
    /**
     * Show a minimal "add note" tool palette; clicking it arms create mode (the
     * next plot click drops an editable, draggable annotation). @default false
     */
    palette?: boolean
    /**
     * Snap a dragged point / axis-line annotation to the nearest gridline
     * (numeric x + linear y). @default false
     */
    snap?: boolean
    /**
     * Accent swatches offered by the floating note editor. Defaults to a
     * built-in 6-color palette when omitted.
     */
    noteColors?: string[]
  }
  /**
   * Overlay Compare (#18): a measure/delta ruler. Requires the `overlayCompare`
   * feature (`import 'apexcharts/features/overlay-compare'`). Hold `key` and
   * drag A->B on the plot, or call `chart.startMeasure()`, to read
   * dx/dy/%change/slope in data space; on release the ruler pins as a
   * data-anchored overlay that re-projects on zoom/resize. Fires `measured`.
   */
  measure?: {
    /** @default false */
    enabled?: boolean
    /** Key held to arm a drag when not in sticky mode. @default 'm' */
    key?: string
    /** Pin the ruler as a data-anchored overlay on release. @default true */
    pinOnRelease?: boolean
  }
  /**
   * Overlay Compare (#18): period-over-period ghosting (P2). Requires the
   * `overlayCompare` feature. `chart.compareRange({ from, to })` overlays a
   * translucent copy of the reference window on the current window. Fires
   * `compareChanged`.
   */
  compare?: {
    /** @default false */
    enabled?: boolean
    /** @default 'ghost' */
    mode?: 'ghost' | 'delta'
    /** Align the reference to the current window. @default 'start' */
    align?: 'start' | 'end'
    /** @default 0.35 */
    opacity?: number
  }
  id?: string
  injectStyleSheet?: boolean
  group?: string
  locales?: ApexLocale[]
  defaultLocale?: string
  perspectives?: {
    serializeOptions?: string[]
  }
  history?: {
    enabled?: boolean
    maxDepth?: number
    coalesceMs?: number
    keyboard?: boolean
  }
  /** Strata (#2) series renderer. Requires `import 'apexcharts/features/renderer-canvas'` for non-SVG. */
  renderer?: 'svg' | 'canvas' | 'auto'
  rendererThreshold?: number
  layers?: {
    series?: 'svg' | 'canvas' | 'auto'
    grid?: 'svg'
    annotations?: 'svg'
    dataLabels?: 'svg'
  }
  parentHeightOffset?: number
  redrawOnParentResize?: boolean
  redrawOnWindowResize?: boolean | ((...args: any[]) => boolean)
  sparkline?: {
    enabled?: boolean
  }
  stacked?: boolean
  stackType?: 'normal' | '100%'
  stackOnlyBar?: boolean;
  toolbar?: {
    show?: boolean
    offsetX?: number
    offsetY?: number
    tools?: {
      download?: boolean | string
      selection?: boolean | string
      zoom?: boolean | string
      zoomin?: boolean | string
      zoomout?: boolean | string
      pan?: boolean | string
      reset?: boolean | string
      customIcons?: {
        icon?: string
        title?: string
        index?: number
        class?: string
        click?(chart: ApexCharts, options?: ApexChartEventOpts, e?: MouseEvent): void
      }[]
    }
    export?: {
      csv?: {
        filename?: undefined | string
        columnDelimiter?: string
        headerCategory?: string
        headerValue?: string
        categoryFormatter?(value?: string | number): string
        valueFormatter?(value?: string | number): string
      },
      svg?: {
        filename?: undefined | string
      }
      png?: {
        filename?: undefined | string
      }
      width?: number
      scale?: number
    }
    autoSelected?: 'zoom' | 'selection' | 'pan'
  }
  zoom?: {
    enabled?: boolean
    type?: 'x' | 'y' | 'xy'
    autoScaleYaxis?: boolean
    allowMouseWheelZoom?: boolean
    /**
     * Momentum: enable two-finger pinch-zoom on touch devices. Zooms the x-axis
     * around the pinch centroid, frame-by-frame. Requires `enabled: true`.
     * @default true
     */
    pinch?: boolean
    zoomedArea?: {
      fill?: {
        color?: string
        opacity?: number
      }
      stroke?: {
        color?: string
        opacity?: number
        width?: number
      }
    }
  }
  /**
   * Momentum: kinetic panning on touch. A one-finger pan released with velocity
   * keeps gliding and decelerates, clamping at the data edges.
   */
  pan?: {
    /** @default true */
    inertia?: boolean
    /** Velocity decay applied each animation frame (0-1). @default 0.92 */
    friction?: number
  }
  selection?: {
    enabled?: boolean
    type?: string
    fill?: {
      color?: string
      opacity?: number
    }
    stroke?: {
      width?: number
      color?: string
      opacity?: number
      dashArray?: number
    }
    xaxis?: {
      min?: number
      max?: number
    }
    yaxis?: {
      min?: number
      max?: number
    }
  }
  animations?: {
    /**
     * Master switch. Each chart type gets a tailored initial-mount animation
     * by default (line/area pen-stroke draw, bar grow, scatter pop, heatmap
     * diagonal wave, treemap largest-first cascade, pie/donut/gauge sweep).
     * Set false to render charts without any animation.
     */
    enabled?: boolean
    /** Animation duration in ms (default 800). */
    speed?: number
    /**
     * Cadence (#6): easing for the generic tweens (data-update value
     * transitions, path morphs, marker animate). A registered name
     * (e.g. 'linear', 'easeOutCubic', 'easeOutBack'), a cubic-bezier
     * `[x1, y1, x2, y2]` array, or a function mapping t in [0,1] to eased
     * progress. Register custom names with `ApexCharts.registerEasing`.
     * @default 'easeInOutSine'
     */
    easing?:
      | string
      | [number, number, number, number]
      | ((t: number) => number)
    /**
     * Drives per-element stagger across all chart types. When enabled, bars,
     * heatmap cells, scatter points, and treemap tiles reveal in sequence;
     * line/area markers fade in progressively as the line draws.
     */
    animateGradually?: {
      enabled?: boolean
      /** Requested stagger step in ms; auto-capped per chart so total
       *  stagger ≤ ~half the animation speed. */
      delay?: number
    }
    /** Data-change (updateSeries) animation. Independent from initial mount. */
    dynamicAnimation?: {
      enabled?: boolean
      speed?: number
    }
    /**
     * Cross-type morph (updateOptions changing chart.type). Requires the
     * optional `apexcharts/features/morph` feature to be registered; without
     * that import these settings have no effect. Supported pairs include
     * bar ↔ pie/donut/radialBar/polarArea (and the trivial pie↔donut↔polarArea
     * cases). Falls back to instant snap when types or data shape are
     * incompatible.
     */
    chartTypeMorph?: {
      enabled?: boolean
      speed?: number
    }
    /**
     * When true (default), honors the OS-level prefers-reduced-motion media
     * query — all initial-mount animations are skipped and the chart renders
     * instantly. Set to false to override (e.g. for QA / demo screens).
     */
    respectReducedMotion?: boolean
    /**
     * Above this many data points (default 1000), the per-element morph +
     * stagger — which spins up one JS-driven animation timeline per path — is
     * replaced by a single GPU-composited opacity fade of the whole series.
     * Keeps initial render and zoom transitions smooth on large datasets
     * (e.g. thousands of candlesticks/bars). Set to 0 to always animate
     * per-element regardless of dataset size.
     */
    largeDatasetThreshold?: number
  }
  accessibility?: {
    enabled?: boolean
    description?: string
    announcements?: {
      enabled?: boolean
    }
    keyboard?: {
      enabled?: boolean
      navigation?: {
        enabled?: boolean
        wrapAround?: boolean
      }
    }
  }
  dataReducer?: {
    enabled?: boolean
    algorithm?: 'lttb'
    targetPoints?: number
    threshold?: number
  }
}

type ApexStates = {
  hover?: {
    filter?: {
      type?: 'none' | 'lighten' | 'darken'
    }
  }
  active?: {
    allowMultipleDataPointsSelection?: boolean
    filter?: {
      type?: 'none' | 'lighten' | 'darken'
    }
  }
}

/**
 * Chart Title options
 * See https://apexcharts.com/docs/options/title/
 */
type ApexTitleSubtitle = {
  text?: string
  align?: 'left' | 'center' | 'right'
  margin?: number
  offsetX?: number
  offsetY?: number
  floating?: boolean
  style?: {
    fontSize?: string
    fontFamily?: string
    fontWeight?: string | number
    color?: string
  }
}

/**
 * Chart Series options.
 * See https://apexcharts.com/docs/options/series/
 */
type ApexAxisChartSeries = {
 name?: string
 type?: string
 color?: string
 group?: string
 hidden?: boolean
 zIndex?: number
 parsing?: ApexParsing;
 data:
 | (number | null)[]
 | {
   x: string | number;
   /**
    * A plain value for most charts. For `candlestick`/`boxPlot`, the
    * summary array (`[O,H,L,C]` / `[min,Q1,median,Q3,max]`). For `violin`, an
    * object carrying the precomputed density profile (`[value, weight]` pairs)
    * plus the raw observations rendered as jitter. For a `scatter` strip plot
    * (`plotOptions.scatter.jitter`), the array of observations in this category.
    */
   y:
     | number
     | null
     | number[]
     | { density: [number, number][]; points?: number[] };
   /**
    * Optional raw observations for a `boxPlot` data point, rendered as jitter
    * dots when `plotOptions.boxPlot.points.show` is enabled.
    */
   points?: number[];
   fill?: ApexFill;
   fillColor?: string;
   strokeColor?: string;
   meta?: unknown;
   /**
    * Drilldown target: the `id` of a `drilldown.series` entry. Clicking this
    * point drills into that level. Requires the Drilldown feature.
    */
   drilldown?: string | number;
   goals?: {
     name?: string,
     value: number,
     strokeHeight?: number;
     strokeWidth?: number;
     strokeColor?: string;
     strokeDashArray?: number;
     strokeLineCap?: 'butt' | 'square' | 'round'
   }[];
   barHeightOffset?: number;
   columnWidthOffset?: number;
 }[]
 | [number, number | null][]
 | [number, (number | null)[]][]
 | number[][]
 | Record<string, any>[];
}[]

type ApexNonAxisChartSeries =
  | number[]
  | ApexAxisChartSeries

/**
 * Options for the line drawn on line and area charts.
 * See https://apexcharts.com/docs/options/stroke/
 */
type ApexStroke = {
  show?: boolean
  curve?: 'smooth' | 'straight' | 'stepline' | 'linestep' | 'monotoneCubic' | ('smooth' | 'straight' | 'stepline' | 'linestep' | 'monotoneCubic')[]
  lineCap?: 'butt' | 'square' | 'round'
  colors?: string[]
  width?: number | number[]
  dashArray?: number | number[]
  fill?: ApexFill
}

type ApexAnnotations = {
  yaxis?: YAxisAnnotations[]
  xaxis?: XAxisAnnotations[]
  points?: PointAnnotations[]
  texts?: TextAnnotations[]
  images?: ImageAnnotations[]
}

type AnnotationLabel = {
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  text?: string | string[]
  textAnchor?: string
  offsetX?: number
  offsetY?: number
  style?: AnnotationStyle
  position?: string
  orientation?: string
  mouseEnter?: (annotation: AnnotationLabel, e: MouseEvent) => void
  mouseLeave?: (annotation: AnnotationLabel, e: MouseEvent) => void
  click?: (annotation: AnnotationLabel, e: MouseEvent) => void
}

type AnnotationStyle = {
  background?: string
  color?: string
  fontFamily?: string
  fontWeight?: string | number
  fontSize?: string
  cssClass?: string
  padding?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
}

type XAxisAnnotations = {
  id?: number | string
  x?: null | number | string
  x2?: null | number | string
  strokeDashArray?: number
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  opacity?: number
  offsetX?: number
  offsetY?: number
  label?: AnnotationLabel
  /**
   * Ink Layer (#7): make this annotation draggable (a line moves along x; a
   * range moves as a whole or resizes from an edge). Requires the `ink` feature.
   */
  draggable?: boolean
}

type YAxisAnnotations = {
  id?: number | string
  y?: null | number | string
  y2?: null | number | string
  strokeDashArray?: number
  fillColor?: string
  borderColor?: string
  borderWidth?: number
  opacity?: number
  offsetX?: number
  offsetY?: number
  width?: number | string
  yAxisIndex?: number
  label?: AnnotationLabel
  /**
   * Ink Layer (#7): make this annotation draggable (a line moves along y; a
   * range moves as a whole). Requires the `ink` feature.
   */
  draggable?: boolean
}

type PointAnnotations = {
  id?: number | string
  x?: number | string
  y?: null | number
  yAxisIndex?: number
  seriesIndex?: number
  /**
   * Ink Layer (#7): make this point annotation draggable. Overrides
   * `chart.ink.enabled`. Requires the `ink` feature.
   */
  draggable?: boolean
  mouseEnter?: (annotation: PointAnnotations, e: MouseEvent) => void
  mouseLeave?: (annotation: PointAnnotations, e: MouseEvent) => void
  click?: (annotation: PointAnnotations, e: MouseEvent) => void
  marker?: {
    size?: number
    fillColor?: string
    strokeColor?: string
    strokeWidth?: number
    shape?: string
    offsetX?: number
    offsetY?: number
    cssClass?: string
  }
  label?: AnnotationLabel
  image?: {
    path?: string
    width?: number
    height?: number
    offsetX?: number
    offsetY?: number
  }
}


type TextAnnotations = {
  x?: number
  y?: number
  text?: string
  textAnchor?: string
  foreColor?: string
  fontSize?: string | number
  fontFamily?: undefined | string
  fontWeight?: string | number
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
  borderWidth?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
}

type ImageAnnotations = {
  path?: string
  x?: number,
  y?: number,
  width?: number,
  height?: number,
}

/**
 * Options for localization.
 * See https://apexcharts.com/docs/options/chart/locales
 */
type ApexLocale = {
  name?: string
  options?: {
    months?: string[]
    shortMonths?: string[]
    days?: string[]
    shortDays?: string[]
    toolbar?: {
      download?: string
      selection?: string
      selectionZoom?: string
      zoomIn?: string
      zoomOut?: string
      pan?: string
      reset?: string
      menu?: string
      exportToSVG?: string
      exportToPNG?: string
      exportToCSV?: string
    }
  }
}

/**
 * PlotOptions for specifying chart-type-specific configuration.
 * See https://apexcharts.com/docs/options/plotoptions/bar/
 */
type ApexPlotOptions = {
  line?: {
    isSlopeChart?: boolean
    colors?: {
      threshold?: number,
      colorAboveThreshold?: string,
      colorBelowThreshold?: string,
    },
  }
  area?: {
    fillTo?: 'origin' | 'end'
  }
  bar?: {
    horizontal?: boolean
    columnWidth?: string | number;
    barHeight?: string | number;
    distributed?: boolean
    borderRadius?: number;
    borderRadiusApplication?: 'around' | 'end';
    borderRadiusWhenStacked?: 'all' | 'last';
    hideZeroBarsWhenGrouped?: boolean
    rangeBarOverlap?: boolean
    rangeBarGroupRows?: boolean
    isDumbbell?: boolean;
    dumbbellColors?: string[][];
    isFunnel?: boolean;
    isFunnel3d?: boolean;
    colors?: {
      ranges?: {
        from?: number
        to?: number
        color?: string
      }[]
      backgroundBarColors?: string[]
      backgroundBarOpacity?: number
      backgroundBarRadius?: number
    }
    dataLabels?: {
      maxItems?: number
      hideOverflowingLabels?: boolean
      position?: string
      orientation?: 'horizontal' | 'vertical',
      total?: {
        enabled?: boolean,
        formatter?(val?: string, opts?: ApexFormatterOpts): string,
        offsetX?: number,
        offsetY?: number,
        style?: {
          color?: string,
          fontSize?: string,
          fontFamily?: string,
          fontWeight?: number | string
        }
      }
    }
  }
  bubble?: {
    zScaling?: boolean
    minBubbleRadius?: number
    maxBubbleRadius?: number
  }
  scatter?: {
    /**
     * Spread overlapping points apart ("jitter"). Two uses, one engine:
     *  - Strip plot: supply data as `{ x: 'Category', y: [v1, v2, ...] }`. Each
     *    category becomes a band and the values scatter horizontally within it.
     *  - Overplotting: ordinary `{ x, y }` points get a small random offset so
     *    dense clusters fan out. The underlying data (and tooltip values) stay
     *    exact; only the drawn position moves.
     * Offsets are in axis units and deterministic (stable across re-renders).
     */
    jitter?: {
      enabled?: boolean
      /** Max ± horizontal offset, in x-axis units (1 = one category step). */
      x?: number
      /** Max ± vertical offset, in y-axis units. */
      y?: number
      /** Single series: colour each band differently (by its position). */
      distributed?: boolean
      /** Per-band cap; values beyond this are stride-thinned. */
      maxPoints?: number
    }
  }
  candlestick?: {
    type?: string,
    colors?: {
      upward?: string | string[]
      downward?: string | string[]
    }
    wick?: {
      useFillColor?: boolean
    }
  }
  boxPlot?: {
    colors?: {
      upper?: string | string[]
      lower?: string | string[]
    }
    /**
     * Individual observations ("jitter") overlaid on each box. Inert unless a
     * data point supplies a `points: number[]` array; `show` is false by
     * default so existing boxPlot charts are unchanged.
     */
    points?: {
      show?: boolean
      shape?: 'circle' | 'square'
      /** Marker radius in pixels. */
      size?: number
      /** 0..1 fraction of the box half-width to scatter within. */
      jitter?: number
      /** Cap per box; observations beyond this are stride-thinned. */
      maxPoints?: number
      opacity?: number
      /**
       * Dot fill colour. Defaults to 'series-dark' (a darker shade of the
       * series colour). Use 'series' for the series colour, or any literal
       * colour string.
       */
      fillColor?: string
      /** Colour of the outline around each dot. Defaults to '#fff'. */
      strokeColor?: string
      /** Width of the dot's outline in pixels. Defaults to 1; 0 disables it. */
      strokeWidth?: number
      /**
       * Colour each dot by its value along a colour ramp (overrides fillColor).
       * Points are bucketed into `steps` shades to keep rendering performant.
       */
      colorScale?: {
        colors: string[]
        min?: number
        max?: number
        steps?: number
      }
    }
  }
  violin?: {
    /**
     * Multiplies the density-derived half-width. 1 maps the density's own
     * maxWeight to half the category slot.
     */
    bandwidthScale?: number
    /**
     * 'individual' (default): each violin is scaled to its own peak density, so
     * all violins reach the full slot width. 'group': all violins share the
     * densest violin's scale, keeping widths proportional to density across
     * categories.
     */
    normalize?: 'individual' | 'group'
    /** Individual observations ("jitter") overlaid on the violin shape. */
    points?: {
      show?: boolean
      shape?: 'circle' | 'square'
      /** Marker radius in pixels. */
      size?: number
      /** 0..1 fraction of the half-width to scatter within. */
      jitter?: number
      /** Clamp jitter to the density width at each value so points stay inside. */
      constrainToViolin?: boolean
      /** Cap per violin; observations beyond this are stride-thinned. */
      maxPoints?: number
      opacity?: number
      /**
       * Dot fill colour. Defaults to 'series-dark' (a darker shade of each
       * violin's own colour). Use 'series' for the violin's colour as-is, or
       * any literal colour string (e.g. '#fff').
       */
      fillColor?: string
      /** Colour of the ring/outline around each dot. Defaults to '#fff'. */
      strokeColor?: string
      /** Width of the dot's outline in pixels. Defaults to 1; 0 disables it. */
      strokeWidth?: number
      /**
       * Colour each dot by its value along a colour ramp (overrides fillColor).
       * Points are bucketed into `steps` shades to keep rendering performant.
       */
      colorScale?: {
        /** Hex colour stops, low → high (a sequential colour ramp). */
        colors: string[]
        /** Value mapped to the first stop. Defaults to the data minimum. */
        min?: number
        /** Value mapped to the last stop. Defaults to the data maximum. */
        max?: number
        /** Number of shade buckets. Defaults to 24. */
        steps?: number
      }
    }
  }
  heatmap?: {
    radius?: number
    enableShades?: boolean
    shadeIntensity?: number
    reverseNegativeShade?: boolean
    distributed?: boolean
    useFillColorAsStroke?: boolean
    colorScale?: {
      ranges?: {
        from?: number
        to?: number
        color?: string
        foreColor?: string
        name?: string
      }[]
      inverse?: boolean
      min?: number
      max?: number
      /**
       * When enabled, replaces the default categorical heatmap legend with a
       * continuous color gradient strip and a hover indicator arrow that
       * tracks the currently hovered cell's value along the spectrum.
       * Follows `legend.position` (top / right / bottom / left); the arrow
       * orientation flips to point at the strip from the chart-facing side.
       */
      gradientLegend?: {
        enabled?: boolean
        /**
         * Strip length for horizontal placements (top/bottom). Accepts a
         * number (pixels) or percentage string (e.g. `'70%'`, resolved against
         * the chart's SVG width). Default `'70%'`.
         */
        width?: number | string
        /**
         * Strip length for vertical placements (left/right). Accepts a number
         * (pixels) or percentage string (e.g. `'70%'`, resolved against the
         * chart's SVG height). Default `'70%'`.
         */
        height?: number | string
        /** Strip thickness (short axis) in pixels. Default 12. */
        thickness?: number
        /**
         * Strip alignment within the legend area.
         * - top/bottom: 'start' = left, 'center', 'end' = right
         * - left/right: 'start' = top,  'center', 'end' = bottom
         * Default `'center'`.
         */
        align?: 'start' | 'center' | 'end'
        /**
         * Number of color stops sampled from the shade function when no
         * explicit `ranges` are provided. Default 16.
         */
        stops?: number
        /** Show min/max labels at the ends of the strip. Default true. */
        showLabels?: boolean
        /** Show a value tooltip next to the arrow on cell hover. Default true. */
        showHoverValue?: boolean
        labelStyle?: {
          fontSize?: string
          fontFamily?: string
          colors?: string
        }
        arrow?: {
          size?: number
          color?: string
        }
        /** Formatter for min/max labels and the hover value tooltip. */
        formatter?(value: number): string
      }
    }
  }
  funnel?: {
    /**
     * 'rectangle' (default) preserves the existing centered-rectangle funnel
     * geometry. 'trapezoid' produces continuous sloped sides between
     * consecutive stages (each stage's bottom width matches the next stage's
     * top width).
     */
    shape?: 'rectangle' | 'trapezoid'
    /**
     * For `shape: 'trapezoid'` only — last stage's bottom edge:
     * 'flat' (default, parallel sides) or 'taper' (taper to a point).
     */
    lastShape?: 'flat' | 'taper'
  }
  treemap?: {
    enableShades?: boolean
    shadeIntensity?: number
    distributed?: boolean
    reverseNegativeShade?: boolean
    useFillColorAsStroke?: boolean
    dataLabels?: { format?: 'scale' | 'truncate' }
    borderRadius?: number
    colorScale?: {
      inverse?: boolean
      ranges?: {
        from?: number
        to?: number
        color?: string
        foreColor?: string
        name?: string
      }[];
      min?: number
      max?: number
    };
    seriesTitle?: {
      show?: boolean,
      offsetY?: number,
      offsetX?: number,
      borderColor?: string,
      borderWidth?: number,
      borderRadius?: number,
      style?: {
        background?: string,
        color?: string,
        fontSize?: string,
        fontFamily?: string,
        fontWeight?: number | string,
        cssClass?: string,
        padding?: {
          left?: number,
          right?: number,
          top?: number,
          bottom?: number,
        },
      },
    }
  }
  pie?: {
    startAngle?: number
    endAngle?: number
    customScale?: number
    offsetX?: number
    offsetY?: number
    expandOnClick?: boolean
    dataLabels?: {
      offset?: number
      minAngleToShowLabel?: number
      /**
       * External (outer) labels: render the category/series name outside the
       * slice, joined by a leader (connector) line, so the chart is readable
       * without the legend. The percentage keeps rendering inside the slice.
       * Applies to pie and donut only (ignored for polarArea, where the radial
       * length already encodes the value).
       */
      external?: {
        show?: boolean
        offsetX?: number
        offsetY?: number
        fontSize?: string
        fontFamily?: string
        fontWeight?: string | number
        color?: string
        /**
         * Return a string for a single-line label, or an array of strings to
         * stack multiple lines (e.g. `[name, percent + '%']`).
         */
        formatter?(
          name: string,
          opts: {
            seriesIndex: number
            percent: number
            value: number
            w: ApexChartContext
          }
        ): string | string[]
        /** Leader line from the slice edge to the label. */
        connector?: {
          show?: boolean
          width?: number
          color?: string
          length?: number
          gap?: number
        }
      }
    }
    donut?: {
      size?: string
      background?: string
      labels?: {
        show?: boolean
        name?: {
          show?: boolean
          fontSize?: string
          fontFamily?: string
          fontWeight?: string | number
          color?: string
          offsetY?: number,
          formatter?(val: string): string
        }
        value?: {
          show?: boolean
          fontSize?: string
          fontFamily?: string
          fontWeight?: string | number
          color?: string
          offsetY?: number
          formatter?(val: number | string): string
        }
        total?: {
          show?: boolean
          showAlways?: boolean
          fontFamily?: string
          fontWeight?: string | number
          fontSize?: string
          label?: string
          color?: string
          formatter?(w: ApexChartContext): string
        }
      }
    }
  }
  polarArea?: {
    rings?: {
      strokeWidth?: number
      strokeColor?: string
    }
    spokes?: {
      strokeWidth?: number;
      connectorColors?: string | string[];
    };
  }
  radar?: {
    size?: number
    offsetX?: number
    offsetY?: number
    polygons?: {
      strokeColors?: string | string[]
      strokeWidth?: number | number[] | string | string[]
      connectorColors?: string | string[]
      fill?: {
        colors?: string[]
      }
    }
  }
  radialBar?: {
    inverseOrder?: boolean
    startAngle?: number
    endAngle?: number
    offsetX?: number
    offsetY?: number
    /**
     * Gauge sub-shape. 'arc' (default) renders the existing filled value-arc
     * gauge; 'needle' replaces the value-arc with a rotating pointer/needle.
     * Bands and ticks are independent and work for both shapes.
     */
    shape?: 'arc' | 'needle'
    /**
     * Value-to-angle mapping (gauge). Defaults: min: 0, max: 100. Override
     * for gauges with a custom domain (e.g. min: 0, max: 240 speedometer).
     */
    min?: number
    max?: number
    /**
     * Threshold bands rendered as colored arc segments along the gauge arc.
     * Each band spans [`from`, `to`] in the gauge's `min..max` domain and is
     * filled with `color`.
     */
    bands?: Array<{
      from: number
      to: number
      color: string
      label?: string
    }>
    bandsStyle?: {
      strokeWidth?: string
      gap?: number
      hideTrackWhenPresent?: boolean
      linecap?: 'butt' | 'round' | 'square'
    }
    ticks?: {
      show?: boolean
      major?: {
        count?: number
        length?: number
        width?: number
        color?: string
        placement?: 'inside' | 'outside'
      }
      minor?: {
        count?: number
        length?: number
        width?: number
        color?: string
        placement?: 'inside' | 'outside'
      }
      labels?: {
        show?: boolean
        offset?: number
        fontSize?: string
        fontFamily?: string
        fontWeight?: string | number
        color?: string
        formatter?: (value: number) => string
      }
    }
    needle?: {
      color?: string
      length?: string | number
      baseWidth?: number
      tipWidth?: number
      /**
       * When true, also render the filled value-arc alongside the needle.
       * Default false preserves needle-only behavior.
       */
      showValueArc?: boolean
      /**
       * px offset from the geometric arc center on Y. Positive values push
       * the needle base down (toward the chord midpoint of a ∩-shape
       * gauge); negative pushes up. The needle rotates around this shifted
       * point.
       */
      offsetY?: number
      animation?: {
        enabled?: boolean
        duration?: number
        easing?: string
      }
    }
    hollow?: {
      margin?: number
      size?: string
      background?: string
      image?: string
      imageWidth?: number
      imageHeight?: number
      imageOffsetX?: number
      imageOffsetY?: number
      imageClipped?: boolean
      position?: 'front' | 'back'
      /**
       * Optional stroke color around the hollow ring. Combined with
       * `strokeDasharray` this produces a dashed indicator circle around
       * the value text.
       */
      stroke?: string
      strokeWidth?: number
      strokeDasharray?: string | number
      dropShadow?: ApexDropShadow
    }
    track?: {
      show?: boolean
      startAngle?: number
      endAngle?: number
      background?: string | string[]
      strokeWidth?: string
      opacity?: number
      margin?: number
      dropShadow?: ApexDropShadow
    }
    dataLabels?: {
      show?: boolean
      name?: {
        show?: boolean
        fontFamily?: string
        fontWeight?: string | number
        fontSize?: string
        color?: string
        offsetY?: number
        formatter?(seriesName: string): string
      }
      value?: {
        show?: boolean
        fontFamily?: string
        fontSize?: string
        fontWeight?: string | number
        color?: string
        offsetY?: number
        formatter?(val: number): string
      }
      total?: {
        show?: boolean
        label?: string
        color?: string
        fontFamily?: string
        fontWeight?: string | number
        fontSize?: string
        formatter?(w: ApexChartContext): string
      }
    }
    barLabels?: {
      enabled?: boolean
      offsetX?: number
      offsetY?: number
      useSeriesColors?: boolean
      fontFamily?: string
      fontWeight?: string | number
      fontSize?: string
      formatter?: (barName: string, opts?: ApexFormatterOpts) => string
      onClick?: (barName: string, opts?: ApexFormatterOpts) => void
    }
  }
}

type ApexColorStop = {
  offset: number
  color: string
  opacity: number
}

type ApexFill = {
  colors?: string[]
  opacity?: number | number[]
  type?: string | string[]
  gradient?: {
    shade?: string
    type?: string
    shadeIntensity?: number
    gradientToColors?: string[]
    inverseColors?: boolean
    opacityFrom?: number | number[]
    opacityTo?: number | number[]
    stops?: number[],
    colorStops?: ApexColorStop[][] | ApexColorStop[]
  }
  image?: {
    src?: string | string[]
    width?: number
    height?: number
  }
  pattern?: {
    style?: string | string[]
    width?: number
    height?: number
    strokeWidth?: number
  }
}

/**
 * Chart Legend configuration options.
 * See https://apexcharts.com/docs/options/legend/
 */
type ApexLegend = {
  show?: boolean
  showForSingleSeries?: boolean
  showForNullSeries?: boolean
  showForZeroSeries?: boolean
  floating?: boolean
  inverseOrder?: boolean
  position?: 'top' | 'right' | 'bottom' | 'left'
  horizontalAlign?: 'left' | 'center' | 'right'
  fontSize?: string
  fontFamily?: string
  fontWeight?: string | number
  width?: number
  height?: number
  offsetX?: number
  offsetY?: number
  formatter?(legendName: string, opts?: ApexLegendFormatterOpts): string
  tooltipHoverFormatter?(legendName: string, opts?: ApexLegendFormatterOpts): string
  customLegendItems?: string[]
  clusterGroupedSeries?: boolean;
  clusterGroupedSeriesOrientation?: 'vertical' | 'horizontal';
  labels?: {
    colors?: string | string[]
    useSeriesColors?: boolean
  }
  markers?: {
    size?: number
    strokeWidth?: number
    fillColors?: string[]
    shape?: ApexMarkerShape
    offsetX?: number
    offsetY?: number
    customHTML?(): string
    onClick?(e: MouseEvent): void
  }
  itemMargin?: {
    horizontal?: number
    vertical?: number
  }
  onItemClick?: {
    toggleDataSeries?: boolean
  }
  onItemHover?: {
    highlightDataSeries?: boolean
  }
}

type MarkerShapeOptions = "circle" | "square" | "rect" | "line" | 'cross' | 'plus' | 'star' | 'sparkle' | 'diamond' | 'triangle'

type ApexMarkerShape = MarkerShapeOptions | MarkerShapeOptions[]

type ApexDiscretePoint = {
  seriesIndex?: number
  dataPointIndex?: number
  fillColor?: string
  strokeColor?: string
  size?: number
  shape?: ApexMarkerShape
}

type ApexMarkers = {
  size?: number | number[]
  colors?: string | string[]
  strokeColors?: string | string[]
  strokeWidth?: number | number[]
  strokeOpacity?: number | number[]
  strokeDashArray?: number | number[]
  fillOpacity?: number | number[]
  discrete?: ApexDiscretePoint[]
  shape?: ApexMarkerShape
  offsetX?: number
  offsetY?: number
  showNullDataPoints?: boolean
  onClick?(e?: MouseEvent): void
  onDblClick?(e?: MouseEvent): void
  hover?: {
    size?: number
    sizeOffset?: number
  }
}

type ApexNoData = {
  text?: string
  align?: 'left' | 'right' | 'center'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  offsetX?: number
  offsetY?: number
  style?: {
    color?: string
    fontSize?: string
    fontFamily?: string
  }
}

type ApexParsing = {
  x?: string;
  y?: string | string[];
  z?: string;
}

/**
 * Chart Datalabels options
 * See https://apexcharts.com/docs/options/datalabels/
 */
type ApexDataLabels = {
  enabled?: boolean
  enabledOnSeries?: undefined | number[]
  textAnchor?: 'start' | 'middle' | 'end'
  distributed?: boolean
  offsetX?: number
  offsetY?: number
  style?: {
    fontSize?: string
    fontFamily?: string
    fontWeight?: string | number
    colors?: string[]
  }
  background?: {
    enabled?: boolean
    foreColor?: string
    backgroundColor?: string
    borderRadius?: number
    padding?: number
    opacity?: number
    borderWidth?: number
    borderColor?: string
    dropShadow?: ApexDropShadow
  }
  dropShadow?: ApexDropShadow
  formatter?(val: string | number | number[], opts?: ApexFormatterOpts): string | number | (string | number)[]
}

type ApexResponsive = {
  breakpoint?: number
  options?: ApexCharts.ApexOptions
}

type ApexTooltipY = {
  title?: {
    formatter?(seriesName: string, opts?: ApexFormatterOpts): string
  }
  formatter?(val: number, opts?: ApexFormatterOpts): string
}

/**
 * Chart Tooltip options
 * See https://apexcharts.com/docs/options/tooltip/
 */
type ApexTooltip = {
  enabled?: boolean
  enabledOnSeries?: undefined | number[]
  shared?: boolean
  followCursor?: boolean
  intersect?: boolean
  inverseOrder?: boolean
  arrow?: boolean
  custom?:
    | ((opts: ApexTooltipCustomOpts) => string | number | Element | { nodeName: string })
    | Array<(opts: ApexTooltipCustomOpts) => string | number | Element | { nodeName: string }>
  fillSeriesColor?: boolean
  theme?: 'light' | 'dark'
  cssClass?: string
  hideEmptySeries?: boolean
  style?: {
    fontSize?: string
    fontFamily?: string
    background?: string
  }
  onDatasetHover?: {
    highlightDataSeries?: boolean
  }
  x?: {
    show?: boolean
    format?: string
    formatter?(val: string | number, opts?: ApexFormatterOpts): string
  }
  y?: ApexTooltipY | ApexTooltipY[]
  z?: {
    title?: string
    formatter?(val: number): string
  }
  marker?: {
    show?: boolean
    fillColors?: string[]
  }
  items?: {
    display?: string
  }
  fixed?: {
    enabled?: boolean
    position?: string // topRight; topLeft; bottomRight; bottomLeft
    offsetX?: number
    offsetY?: number
  }
}

/**
 * X Axis options
 * See https://apexcharts.com/docs/options/xaxis/
 */
type ApexXAxis = {
  type?: 'category' | 'datetime' | 'numeric'
  /**
   * X-axis category labels. Pass a flat array for a single row of labels,
   * or a 2-D array (`[group, label][]`) to render grouped category axes.
   */
  categories?: Array<string | number> | Array<Array<string | number>>;
  overwriteCategories?: number[] | string[] | undefined;
  offsetX?: number;
  offsetY?: number;
  sorted?: boolean;
  labels?: {
    show?: boolean
    rotate?: number
    rotateAlways?: boolean
    hideOverlappingLabels?: boolean
    showDuplicates?: boolean
    trim?: boolean
    minHeight?: number
    maxHeight?: number
    style?: {
      colors?: string | string[]
      fontSize?: string
      fontFamily?: string
      fontWeight?: string | number
      cssClass?: string
    }
    offsetX?: number
    offsetY?: number
    format?: string
    formatter?(value: string | number, timestamp?: number, opts?: ApexFormatterOpts): string | string[]
    datetimeUTC?: boolean
    datetimeFormatter?: {
      year?: string
      month?: string
      day?: string
      hour?: string
      minute?: string
      second?: string
    }
  }
  group?: {
    groups?: { title: string, cols: number }[],
    style?: {
      colors?: string | string[]
      fontSize?: string
      fontFamily?: string
      fontWeight?: string | number
      cssClass?: string
    }
  }
  axisBorder?: {
    show?: boolean
    color?: string
    height?: number
    offsetX?: number
    offsetY?: number
  }
  axisTicks?: {
    show?: boolean
    borderType?: 'solid' | 'dotted' | 'dashed'
    color?: string
    height?: number
    offsetX?: number
    offsetY?: number
  }
  tickPlacement?: string
  tickAmount?: number | 'dataPoints'
  stepSize?: number
  min?: number
  max?: number
  range?: number
  floating?: boolean
  decimalsInFloat?: number
  position?: string
  title?: {
    text?: string
    offsetX?: number
    offsetY?: number
    style?: {
      color?: string
      fontFamily?: string
      fontWeight?: string | number
      fontSize?: string
      cssClass?: string
    }
  }
  crosshairs?: {
    show?: boolean
    width?: number | string
    position?: string
    opacity?: number
    stroke?: {
      color?: string
      width?: number
      dashArray?: number
    }
    fill?: {
      type?: string
      color?: string
      gradient?: {
        colorFrom?: string
        colorTo?: string
        stops?: number[]
        opacityFrom?: number
        opacityTo?: number
      }
    }
    dropShadow?: ApexDropShadow
  }
  tooltip?: {
    enabled?: boolean
    offsetY?: number
    formatter?(value: string | number, opts?: ApexFormatterOpts): string
    style?: {
      fontSize?: string
      fontFamily?: string
    }
  }
}

/**
 * Y Axis options
 * See https://apexcharts.com/docs/options/yaxis/
 */

type ApexYAxis = {
  show?: boolean
  showAlways?: boolean
  showForNullSeries?: boolean
  seriesName?: string | string[]
  opposite?: boolean
  reversed?: boolean
  logarithmic?: boolean,
  logBase?: number,
  tickAmount?: number
  stepSize?: number
  forceNiceScale?: boolean
  alignZero?: boolean
  min?: number | ((min: number) => number)
  max?: number | ((max: number) => number)
  floating?: boolean
  decimalsInFloat?: number
  labels?: {
    show?: boolean
    showDuplicates?: boolean
    minWidth?: number
    maxWidth?: number
    offsetX?: number
    offsetY?: number
    rotate?: number
    align?: 'left' | 'center' | 'right'
    padding?: number
    style?: {
      colors?: string | string[]
      fontSize?: string
      fontWeight?: string | number
      fontFamily?: string
      cssClass?: string
    }
    formatter?(val: number, opts?: ApexFormatterOpts): string | string[]
  }
  axisBorder?: {
    show?: boolean
    color?: string
    width?: number
    offsetX?: number
    offsetY?: number
  }
  axisTicks?: {
    show?: boolean
    color?: string
    width?: number
    offsetX?: number
    offsetY?: number
  }
  title?: {
    text?: string
    rotate?: number
    offsetX?: number
    offsetY?: number
    style?: {
      color?: string
      fontSize?: string
      fontWeight?: string | number
      fontFamily?: string
      cssClass?: string
    }
  }
  crosshairs?: {
    show?: boolean
    position?: string
    stroke?: {
      color?: string
      width?: number
      dashArray?: number
    }
  }
  tooltip?: {
    enabled?: boolean
    offsetX?: number
  }
}

type ApexForecastDataPoints = {
  count?: number
  fillOpacity?: number
  strokeWidth?: undefined | number
  dashArray?: number
}

/**
 * Plot X and Y grid options
 * See https://apexcharts.com/docs/options/grid/
 */
type ApexGrid = {
  show?: boolean
  borderColor?: string
  strokeDashArray?: number
  position?: 'front' | 'back'
  xaxis?: {
    lines?: {
      show?: boolean
      offsetX?: number
      offsetY?: number
    }
  }
  yaxis?: {
    lines?: {
      show?: boolean
      offsetX?: number
      offsetY?: number
    }
  }
  row?: {
    colors?: string[]
    opacity?: number
  }
  column?: {
    colors?: string[]
    opacity?: number
  }
  padding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
}

type ApexTheme = {
  mode?: 'light' | 'dark'
  palette?: string
  /**
   * Facet (#13): read `--apx-*` CSS design tokens from the cascade
   * (`--apx-accent`, `--apx-fore`, `--apx-grid`, `--apx-surface`,
   * `--apx-series-1..N`). They top the resolution chain, below explicit config.
   * 'auto' (default) and true read any present; false disables.
   */
  tokens?: 'auto' | boolean
  /**
   * Facet (#13): 'os' follows the operating system's `prefers-color-scheme`
   * (light/dark) and `prefers-contrast` reactively, with no JS. SSR-safe.
   */
  follow?: 'os' | false
  /** Facet (#13): a theme registered via `ApexCharts.registerTheme(name, def)`. */
  name?: string
  monochrome?: {
    enabled?: boolean
    color?: string
    shadeTo?: 'light' | 'dark'
    shadeIntensity?: number
  }
  accessibility?: {
    colorBlindMode?: 'deuteranopia' | 'protanopia' | 'tritanopia' | 'highContrast' | ''
  }
}

/** Facet (#13): a named theme definition for `ApexCharts.registerTheme`. */
interface ApexThemeDef {
  mode?: 'light' | 'dark'
  /** Series palette (overrides the built-in palette). */
  palette?: string[]
  /** Design-token values applied as chrome + palette seed. */
  tokens?: { accent?: string; fore?: string; grid?: string; surface?: string; series?: string[] }
  monochrome?: ApexTheme['monochrome']
  accessibility?: ApexTheme['accessibility']
}

/** A `reduce` spec: 'count' (default), a field aggregation, or a custom fn. */
type ApexCrossfilterReduce =
  | 'count'
  | { sum?: string; avg?: string; min?: string; max?: string }
  | ((rows: any[]) => number)

/** One chart's aggregation returned by `aggregateFor`. */
interface ApexCrossfilterAggregation {
  type: 'category' | 'range' | 'matrix'
  /** Category/range: bucket labels in stable order (category keys, or bin-start numbers). */
  labels?: any[]
  /** Category/range: reduced value per bucket. */
  values?: number[]
  /** Category/range: category key, or `[lo, hi]` bin range, per bucket. */
  keys?: any[]
  /** Range dimensions only: bin edges (length labels.length + 1). */
  edges?: number[]
  /** Matrix (2D) only: x-axis keys (columns). */
  xLabels?: any[]
  /** Matrix (2D) only: y-axis keys (rows / series). */
  yLabels?: any[]
  /** Matrix (2D) only: reduced value per cell, `matrix[yIndex][xIndex]`. */
  matrix?: number[][]
}

/**
 * Linked Views (#4) Phase 2: the crossfilter coordinator returned by
 * `ApexCharts.crossfilter(...)`. Holds one shared record set and per-chart
 * dimensions; selecting in one chart re-aggregates the others over the
 * filtered subset (a chart never filters itself).
 */
interface ApexCrossfilter {
  id: string
  records: any[]
  /** Swap the dataset and recompute every dimension's domain. */
  setRecords(records: any[]): this
  /** Register (or replace) a chart's dimension + reduction. */
  registerDimension(
    chartId: string,
    spec: {
      dimension: (row: any) => any
      reduce?: ApexCrossfilterReduce
      type?: 'category' | 'range'
      bins?: { width?: number; count?: number; thresholds?: number[] }
      order?: 'first-seen' | 'asc' | 'desc' | ((a: any, b: any) => number)
      filter?: any
    },
  ): this
  removeDimension(chartId: string): this
  /** Whether a chart's dimension is registered. */
  hasDimension(chartId: string): boolean
  /** Replace a chart's filter (keys for category, `[min,max]` for range, null clears). */
  filter(chartId: string, filter: any[] | Set<any> | [number, number] | null): this
  /** Toggle one categorical key (multi-select, OR). */
  toggleKey(chartId: string, key: any): this
  /** Clear one chart's filter. */
  clear(chartId: string): this
  /** Clear all filters. */
  reset(): this
  /** The current filter for a chart (Set/range copy, or null). */
  filterOf(chartId: string): any
  /** Rows passing all OTHER charts' filters (all filters when null/omitted). */
  filteredRecords(exceptChartId?: string | null): any[]
  /** Rows passing every active filter. */
  filteredRows(): any[]
  /** The crossfilter aggregation for one chart. */
  aggregateFor(chartId: string): ApexCrossfilterAggregation
  /** Aggregate every registered chart, keyed by chartId. */
  aggregateAll(): Record<string, ApexCrossfilterAggregation>
  /** Active filters + filtered/total record counts. */
  state(): { filters: Record<string, any[] | [number, number]>; filteredCount: number; total: number }
  /**
   * Bind an HTML table of the filtered rows to `el`; re-renders on every filter
   * change. `columns` may be field-name strings or `{field, label, format}`;
   * omit to derive from the record keys. Returns a refresh()/destroy() handle.
   */
  dataTable(
    el: HTMLElement,
    opts?: {
      columns?: Array<string | { field: string; label?: string; format?: (v: any, row: any) => any }>
      page?: number
      pageSize?: number
    },
  ): { refresh(): void; destroy(): void }
  /** Subscribe to 'change' | 'records'; returns an unsubscribe fn. */
  on(
    event: 'change' | 'records',
    cb: (state: { filters: Record<string, any>; filteredCount: number; total: number }) => void,
  ): () => void
  off(event: string, cb: Function): this
  /** Remove this coordinator from the registry and drop all state. */
  destroy(): void
}

export = ApexCharts;
export as namespace ApexCharts;
