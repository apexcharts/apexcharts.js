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
  // Some formatter call sites spread extra state into the opts object (e.g.
  // the bar total-label formatter spreads `w`), so allow arbitrary reads.
  [key: string]: any
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
   * Measure ruler (#18): arm a sticky measure-ruler mode. Drag A->B on the
   * plot to read dx/dy/%change/slope. Requires the `measure` feature and
   * `chart.measure.enabled`.
   */
  startMeasure(): void

  /** Measure ruler (#18): leave measure mode. */
  stopMeasure(): void

  /** Measure ruler (#18): remove all pinned measure rulers. */
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

  /**
   * The rows behind this chart's marks, as a unit-chart series.
   *
   * A histogram bar stands for the observations it counted, a box for the
   * sample it summarises. This returns them as one cluster per mark, so a mark
   * can come apart into its own rows:
   *
   * ```js
   * chart.updateOptions({ chart: { type: 'unit' }, series: chart.rowSeries() })
   * ```
   *
   * With the `morph` feature loaded, each dot then leaves from the part of the
   * mark that was standing for it, and collapsing back is the inverse.
   *
   * Returns null when the chart's type cannot name its rows, or when
   * `apexcharts/features/stats` is not loaded.
   *
   * @param opts `maxRows` caps the dots produced (default 3000, matching the
   *   jitter overlay); past it every cluster is thinned by one shared stride so
   *   their relative sizes survive.
   */
  rowSeries(opts?: { maxRows?: number }): ApexUnitRowSeries[] | null

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
   * Facet (#13): re-resolves the `--apx-*` design tokens from the CSS cascade
   * and re-renders. Use after a runtime token change that is not an OS
   * color-scheme flip (e.g. the host app swaps its design-system theme), since
   * tokens are otherwise only re-read when something else triggers a render.
   */
  refreshTokens(): Promise<any>

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

  /**
   * Drops levels cached from `drilldown.onDrillDown`, so the next drill re-runs
   * the resolver. Call it when the data behind an already-drilled chart
   * changes. Omit `id` to clear every level.
   * Requires the Drilldown feature.
   */
  clearDrilldownCache(id?: string | number): ApexCharts

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
   * Trellis: the panels of a trellis host in grid order (empty for a chart
   * that is not a trellis). Requires `import 'apexcharts/features/trellis'`.
   */
  getPanels(): ApexCharts.ApexTrellisPanel[]

  /**
   * Trellis: one panel's own ApexCharts instance by facet key — the escape
   * hatch to every per-chart API the trellis does not re-expose.
   */
  getPanel(key: string): ApexCharts | null

  /**
   * Trellis: expand one panel to the grid's full width (what clicking its
   * header does). No-op on a chart that is not a trellis host.
   */
  promotePanel(key: string): Promise<void>

  /**
   * Trellis: restore the grid from a panel promotion.
   */
  restorePanels(): Promise<void>

  /**
   * Calls a public method on a chart instance identified by chartID.
   * Useful when you don't have a direct reference to the instance.
   */
  static exec(chartID: string, fn: string, ...args: any[]): any

  /** Retrieves a rendered chart instance by its chart.id config value. */
  static getChartByID(chartID: string): ApexCharts | undefined

  /**
   * Trellis: imperative entry point — creates a trellis host (options must
   * carry `trellis.by`) and starts rendering it. `render()` on the returned
   * instance settles with the same in-flight mount. Returns null when the
   * trellis feature is not bundled.
   */
  static trellis(
    el: HTMLElement,
    options: ApexCharts.ApexOptions
  ): ApexCharts | null

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
   * Sets the license key that unlocks the gated premium features (storyboard,
   * link / crossfilter, ink, measure, contextMenu, perspectives, history).
   * Without a valid key those features keep working but show an "APEXCHARTS"
   * trial watermark; a valid key removes it. Keys are shared across the
   * ApexCharts family (apexgantt, apextree, apexsankey, apex-grid-enterprise,
   * apexstock). Call before render(); the watermark is re-evaluated on every
   * render/update.
   */
  static setLicense(key: string): typeof ApexCharts

  /**
   * Registers a Weave plugin definition. Available in every bundle; the plugin
   * activates only when the Weave host is bundled and listed in a chart's
   * `plugins` config. Re-registering a name replaces the definition.
   */
  static registerPlugin(def: ApexPlugin): typeof ApexCharts

  /**
   * Removes a registered Weave plugin definition. Charts holding an active
   * instance keep it until their plugins config changes or they are destroyed.
   * Intended for tests and hot-reload flows.
   */
  static unregisterPlugin(name: string): typeof ApexCharts

  /**
   * Registers a non-SVG series renderer (Strata #2). The canvas backend
   * registers itself via `import 'apexcharts/features/renderer-canvas'`.
   */
  static registerRenderer(kind: string, factory: (w: any, ctx: any) => any): void

  /**
   * Removes a registered renderer backend; charts fall back to SVG on their
   * next render. Intended for tests and hot-reload flows.
   */
  static unregisterRenderer(kind: string): void

  /**
   * Registers a custom series type (Marks #11): a `{ renderItem }` definition
   * that draws primitives per datum. Requires the Marks feature to be bundled
   * (`import 'apexcharts/features/marks'`, included in the full bundle).
   * Once registered, reference it via `series[].type` or `chart.type`.
   * Re-registering a custom name replaces it; a built-in chart type name is
   * rejected with a console warning (the registry is global, so shadowing a
   * built-in would affect every chart on the page).
   */
  static registerSeriesType(name: string, def: ApexSeriesTypeDef): typeof ApexCharts

  /**
   * Removes a custom series type registered via registerSeriesType. Built-in
   * chart types cannot be unregistered. Intended for tests and hot-reload.
   */
  static unregisterSeriesType(name: string): typeof ApexCharts

  /**
   * Registers a named theme (Facet #13): a palette + design-token + mode bundle
   * referenceable via `theme: { name }`. Sits below explicit config and CSS
   * `--apx-*` tokens, above the built-in palette/mode defaults.
   */
  static registerTheme(name: string, def: ApexThemeDef): typeof ApexCharts

  /**
   * Removes a registered theme. Charts referencing it via `theme.name` fall
   * back to the built-in defaults on their next render. Intended for tests and
   * hot-reload flows.
   */
  static unregisterTheme(name: string): typeof ApexCharts

  /**
   * Registers a named easing (Cadence #6) referenceable via
   * `chart.animations.easing: '<name>'`, alongside the built-in curves listed
   * on `ApexEasing`. `fn` maps linear progress t in [0,1]
   * to eased progress (back/elastic curves may overshoot 1).
   */
  static registerEasing(name: string, fn: (t: number) => number): typeof ApexCharts

  /**
   * Registers a named unit-chart layout, referenceable via
   * `plotOptions.unit.positions: '<name>'` with `plotOptions.unit.layout:
   * 'custom'`.
   *
   * A layout is objects in, positions out, and knows nothing about animation:
   * the engine already tweens position, radius and colour, and already keeps
   * each mark's identity across a relayout. That is what lets an arrangement
   * the built-in layouts cannot express - a country silhouette, a hex grid, a
   * timeline, a projection supplied by ApexMaps - be a plugin rather than a
   * core change.
   */
  static registerUnitLayout(name: string, fn: ApexUnitLayout): typeof ApexCharts

  /**
   * Removes a layout registered via `registerUnitLayout`. Charts referencing it
   * by name fall back to the grouped layout on their next render.
   */
  static unregisterUnitLayout(name: string): typeof ApexCharts

  /**
   * Registers a row source: given a chart's state, what rows is each of its
   * marks standing for?
   *
   * Most marks cannot answer, because an ordinary bar aggregates rows the
   * library never saw. The types that can are the ones whose series carries raw
   * observations (histogram, boxPlot, violin); their sources ship with
   * `apexcharts/features/stats`.
   *
   * The function returns a unit-chart series - one cluster per mark, one datum
   * per row - in the marks' own draw order (ascending series index, then
   * ascending category), including marks with no rows. That order is a
   * contract: the morph engine maps clusters onto the outgoing marks
   * positionally, so a compacted array sends dots out of the wrong mark.
   */
  static registerRowSource(name: string, fn: ApexRowSource): typeof ApexCharts

  /** Removes a row source registered via `registerRowSource`. */
  static unregisterRowSource(name: string): typeof ApexCharts

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

  /**
   * SSR: render a chart to an SVG string on the server. Available from the
   * `apexcharts/ssr` entry (`import ApexCharts from 'apexcharts/ssr'`).
   */
  static renderToString(
    options: ApexCharts.ApexOptions,
    ssrOptions?: { width?: number; height?: number; scale?: number },
  ): Promise<string>

  /**
   * SSR: render a chart to hydration-ready HTML (SVG wrapped in the chart
   * container). Available from the `apexcharts/ssr` entry.
   */
  static renderToHTML(
    options: ApexCharts.ApexOptions,
    ssrOptions?: {
      width?: number
      height?: number
      scale?: number
      className?: string
    },
  ): Promise<string>

  /**
   * SSR: hydrate a server-rendered chart container into a live, interactive
   * chart. Available from the `apexcharts/client` (or `apexcharts/ssr`) entry.
   */
  static hydrate(el: HTMLElement, clientOptions?: ApexCharts.ApexOptions): ApexCharts

  /**
   * SSR: hydrate every server-rendered chart container matching `selector`
   * (defaults to all ApexCharts containers on the page).
   */
  static hydrateAll(
    selector?: string,
    clientOptions?: ApexCharts.ApexOptions,
  ): ApexCharts[]

  /** SSR: whether a container has already been hydrated. */
  static isHydrated(el: HTMLElement): boolean

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
   * Perspectives (#10): serializable, shareable view state.
   * Requires the Perspectives feature: `import 'apexcharts/features/perspectives'`.
   */
  perspectives: {
    capture(): ApexPerspective
    encode(token?: ApexPerspective): string
    decode(str: string): ApexPerspective | null
    toURL(): string
    apply(token: ApexPerspective | string, opts?: { animate?: boolean; mergeOptions?: ApexCharts.ApexOptions }): void
    save(name: string): string
    list(): { id: string; name: string; token: ApexPerspective }[]
    delete(id: string): void
  }

  /**
   * Storyboard: scroll-driven chart choreography (scrollytelling). Beats are
   * prose elements paired with Perspective views; scrolling a beat across the
   * trigger line applies its view, and scrolling back reverses it.
   * Requires the Storyboard feature: `import 'apexcharts/features/storyboard'`
   * (which includes Perspectives).
   */
  storyboard: {
    bind(opts?: ApexStoryboardBindOptions): number
    unbind(): void
    goTo(beat: number | string, opts?: { animate?: boolean }): void
    current(): { index: number; key: string | null } | null
  }

  /**
   * Rewind (#3): undo/redo history.
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

// ── Storyboard: scroll-driven chart choreography ──
interface ApexStoryboardBeatInfo {
  index: number
  key: string | null
  el: Element
  direction: 'up' | 'down'
}

interface ApexStoryboardBeat {
  /** The prose element that triggers the beat (or use `selector`). */
  el?: Element
  selector?: string
  /** Author key for goTo() and events; defaults to data-apex-beat or the index. */
  key?: string
  /**
   * The view to apply: a bare ViewState object (partial is fine; a beat
   * describes the WHOLE target state, e.g. omitting `window` clears the
   * zoom), a full Perspective token, or an encoded token string.
   */
  view?: Partial<ApexViewState> | ApexPerspective | string
  /**
   * updateOptions payload merged into the SAME render as the view, so a beat
   * can restyle or swap chart.type in one animated transition (cross-type
   * morphs play out inside it). updateOptions merges, so each beat should
   * carry every option it depends on, like the view.
   */
  options?: ApexCharts.ApexOptions
  /** Text pushed to the chart's aria-live region when the beat activates. */
  announce?: string
  /** Escape hatch for arbitrary per-beat work. */
  onEnter?(chart: ApexCharts, info: ApexStoryboardBeatInfo): void
}

interface ApexStoryboardBindOptions {
  /**
   * Beats in story order. Omit to auto-discover [data-apex-beat] elements in
   * document order (data-apex-view holds an encoded token, data-apex-announce
   * an announcement).
   */
  beats?: ApexStoryboardBeat[]
  /** Custom scroll container (element or selector); default: the viewport. */
  scroller?: Element | string
  /** 0..1 fraction of the viewport height for the trigger line (default 0.5). */
  offset?: number
  /** Animate beat transitions (default true; prefers-reduced-motion wins). */
  animate?: boolean
}

// ── Weave (#1): public plugin platform ──
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
  /**
   * Live: refreshed when the chart's `plugins` config changes, so
   * `updateOptions({ plugins: [{ name, options }] })` reconfigures an active
   * plugin in place. The returned object is frozen.
   */
  readonly options: Record<string, any>
  on(hook: ApexPluginHook, fn: (payload: ApexPluginPayload) => void): ApexPluginAPI
  off(hook: ApexPluginHook, fn: (payload: ApexPluginPayload) => void): ApexPluginAPI
  store: Record<string, any>
  /**
   * Call INSIDE each draw handler: plugin layers are wiped at the start of
   * every draw pass, so a handle cached across draws points at a detached node
   * and its writes vanish silently.
   */
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
  /**
   * Fires on the chart's event bus as `plugin:<pluginName>:<name>` (namespaced
   * so a plugin can never trigger internal lifecycle subscribers). Listen with
   * `chart.addEventListener('plugin:myplugin:myevent', fn)`.
   */
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
    /** The requested level id, i.e. the clicked point's `drilldown` value. */
    id: string | number | null
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
    /**
     * The dot marking a drillable point on a line/area chart drawn without
     * markers. A bar, slice, tile or cell is already a visible, clickable mark;
     * a line point is not, so without this nothing would show that a point can
     * be opened. Only drillable points get one. Set `show: false` to supply your
     * own affordance. Omitted colours inherit the series marker defaults.
     */
    marker?: {
      /** Default true. */
      show?: boolean
      /** Radius in px. Default 6. */
      size?: number
      /** Defaults to the series marker shape. */
      shape?: 'circle' | 'square' | 'rect'
      /** Defaults to the series colour. */
      fillColor?: string
      /** Default '#fff'. */
      strokeColor?: string
    }
    /**
     * Async resolver called when a drillable point has no inline `series` match.
     *
     * Failure never changes state: a throw, a rejection, or a resolved value
     * without a `data` array leaves the chart where it was and fires
     * `drillDownError`. A second click while one is in flight is ignored rather
     * than starting a second request.
     */
    onDrillDown?(
      ctx: ApexDrilldownContext
    ): ApexDrilldownSeries | Promise<ApexDrilldownSeries>
    /**
     * Overlay shown while an async level resolves. `text` is optional; with
     * none, the spinner shows alone and carries "Loading" as its accessible
     * name, so the default ships no user-visible English.
     */
    loading?:
      | false
      | {
          show?: boolean
          text?: string
        }
    /**
     * Cache levels resolved by `onDrillDown`, keyed by id, so drilling back down
     * a branch does not re-fetch. Default true. Clear it with the drilldown
     * module's `clearCache()` when the underlying data changes.
     */
    cache?: boolean
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
    /**
     * Trellis (small multiples / faceting): split the series into a grid of
     * pixel-aligned panels by a facet key. Requires
     * `import 'apexcharts/features/trellis'` (included in the full bundle).
     */
    trellis?: ApexTrellis
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
  export type { ApexEasing }
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
  export type { ApexStoryboardBeat }
  export type { ApexStoryboardBeatInfo }
  export type { ApexStoryboardBindOptions }
  export type { ApexTrellis }
  export type { ApexTrellisPanel }
}

/**
 * Trellis (small multiples / faceting). Requires
 * `import 'apexcharts/features/trellis'` (included in the full bundle).
 *
 * Setting `by` makes the chart a trellis HOST: the series array is split into
 * one panel per facet-key value, every panel is a real chart of the host's
 * chart.type, and the trellis owns everything shared: the scale domains, the
 * pixel-aligned plot rectangles, the color-by-series-name map, the headers,
 * one legend, one toolbar and the responsive column count. Series WITHOUT the
 * facet key repeat in every panel (reference series).
 */
type ApexTrellis = {
  /**
   * Facet accessor: the name of a key on each series object (the blessed
   * typed field is `facet`, but any key works), or a function returning the
   * key per series.
   */
  by?: string | ((series: any, index: number) => string | number | undefined)
  /**
   * 2-D faceting: the row facet accessor. With `row`/`column` set, the grid
   * is every (row, column) combination in row-major order with a FIXED
   * column count; column labels draw once across the top, row labels once
   * down the left. Mutually exclusive with `by`. A series carrying only the
   * row key repeats across that row (a row-scoped reference series).
   */
  row?: string | ((series: any, index: number) => string | number | undefined)
  /** 2-D faceting: the column facet accessor (see `row`). */
  column?:
    | string
    | ((series: any, index: number) => string | number | undefined)
  /**
   * Missing (row, column) combinations: 'placeholder' (default) mounts a
   * real empty panel at the shared geometry with a quiet "no data" label
   * (`noData.text`); 'skip' keeps the slot with a tinted blank; 'hide'
   * keeps the slot with nothing at all.
   */
  emptyPanels?: 'placeholder' | 'skip' | 'hide'
  /**
   * Tidy-row input, an alternative to `series`: a row table pivoted by the
   * `by` / `x` / `y` / `seriesBy` COLUMN NAMES (all strings in this form).
   * Rows win over `series` when both are given. Duplicate (panel, series, x)
   * rows keep the last and warn; aggregate the rows first for sums or means.
   */
  data?: Record<string, any>[]
  /** x-value column name (tidy form only). */
  x?: string
  /** y-value column name (tidy form only). */
  y?: string
  /** Optional series-name column (tidy form only); absent means one series per panel named after `y`. */
  seriesBy?: string
  /** 'auto' (default) fits `minPanelWidth` columns into the container. */
  columns?: number | 'auto'
  /** Drives 'auto' columns and the responsive collapse. Default 220. */
  minPanelWidth?: number
  /** Gap between cells, px. Default 12. */
  gap?: number
  /** Panel width : height when no explicit height governs. Default 1.6. */
  aspectRatio?: number
  /** Explicit panel height in px; wins over aspectRatio and chart.height. */
  panelHeight?: number
  /** Panel order. Default 'first-seen'. */
  order?:
    | 'first-seen'
    | 'asc'
    | 'desc'
    | string[]
    | ((a: string, b: string) => number)
  /** Render only the first N panels (warns about the rest). */
  limit?: number
  /**
   * 'auto' (default) mounts only the panels intersecting the viewport (plus
   * one row) once the grid exceeds 64 panels; true always virtualizes; false
   * always renders eagerly. Unmounted cells keep their header and a
   * fixed-height skeleton, so page height and scroll position never shift; a
   * panel that scrolls out is destroyed with its view state stashed, and a
   * remount restores its zoom window. getPanel(key) returns null for
   * unmounted panels.
   */
  virtualize?: 'auto' | boolean
  /**
   * Scale resolution per channel. y also takes 'independent-row' /
   * 'independent-column' in a 2-D grid: one shared domain per row or column
   * (comparable along the group, free across groups). Non-shared y still
   * renders pixel-aligned panels (the gutter pass equalizes axis widths);
   * 'independent' and 'independent-column' force their own y labels on
   * every panel, 'independent-row' keeps them on the first column.
   */
  scales?: {
    x?: 'shared' | 'independent'
    y?: 'shared' | 'independent' | 'independent-row' | 'independent-column'
    color?: 'shared'
    size?: 'shared'
  }
  /** Per-cell facet headers. */
  header?: {
    show?: boolean
    formatter?: (
      key: string,
      opts: { dimension?: string; index: number; count: number }
    ) => string
    style?: { fontSize?: string; fontWeight?: string | number; color?: string }
  }
  /**
   * Axis-label policy. 'edges' (default) shows y labels on the first column
   * and x labels on each column's bottom panel; label SPACE is always
   * reserved everywhere so panels stay aligned. 'all' | 'none'.
   */
  axes?: { labels?: 'edges' | 'all' | 'none' }
  /** One legend for the grid (toggles a series name in every panel). */
  legend?: 'shared' | 'none'
  /** One zoom / pan / reset toolbar for the grid. */
  toolbar?: 'shared' | 'none'
  /**
   * 'panel' (default): tooltip card only in the hovered panel while the
   * crosshair sweeps all panels. 'sync': every panel shows its own card.
   * 'grid': ONE card near the cursor with one row per panel at the hovered x
   * (composed from the panels' own tooltips, so every formatter is honored).
   */
  tooltip?: 'panel' | 'sync' | 'grid'
  /** 'sync' (default): a zoom in any panel moves every panel. */
  zoom?: 'sync' | 'none'
  /**
   * Clicking a cell's header expands that panel to the grid's full width,
   * with an "All panels" breadcrumb back (default true). Also available as
   * chart.promotePanel(key) / chart.restorePanels().
   */
  promote?: boolean
  /**
   * Pie/donut/polarArea only: scale each panel's radius so its AREA is
   * proportional to the panel's total (default false). Equal-size pies
   * cannot encode magnitude; this is what makes a pie trellis honest.
   */
  radiusByTotal?: boolean
  /**
   * Tick-interval target for the shared nice y scale (default 3, so at most
   * ~4 labels: a small panel wears few labels well).
   */
  targetTicks?: number
  /** Per-panel option override, applied last. */
  panel?: (
    key: string,
    opts: { index: number; seriesNames: string[] }
  ) => ApexCharts.ApexOptions
}

/** One trellis panel, as returned by chart.getPanels(). */
type ApexTrellisPanel = {
  /** 'North' in 1-D; 'Sales / Q1' in a 2-D grid. */
  key: string
  index: number
  /** The panel's own ApexCharts instance (null before it mounts, and for
   *  virtualized panels currently offscreen). */
  chart: ApexCharts | null
  /** The panel's cell element (header + chart mount). */
  el: HTMLElement | null
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
 * Easing for the generic tween runner (Cadence #6): data-update value
 * transitions, path morphs, marker animate. Accepts a built-in curve name
 * (the union below is the complete built-in registry), any custom name
 * registered via `ApexCharts.registerEasing` (hence the widened string), a
 * CSS-style cubic-bezier control array `[x1, y1, x2, y2]`, or a function
 * mapping linear progress t in [0,1] to eased progress (back-style curves
 * may overshoot [0,1]).
 */
type ApexEasing =
  | 'linear'
  | 'easeInSine'
  | 'easeOutSine'
  | 'easeInOutSine'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeOutBack'
  | 'easeInOutBack'
  | (string & {})
  | [number, number, number, number]
  | ((t: number) => number)

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
  | 'histogram'
  | 'radar'
  | 'polarArea'
  | 'rangeBar'
  | 'rangeArea'
  | 'treemap'
  | 'unit'
  | 'waffle'
  | 'sunburst'
  | 'funnel'
  | 'pyramid'
  | 'gauge'
  /**
   * Internal — populated when `type` is a first-class alias (`'funnel'`,
   * `'pyramid'`, `'gauge'`, `'waffle'`, `'histogram'`). The original requested
   * type is preserved here while `type` is normalized to the underlying
   * renderer (`'bar'`, `'radialBar'` or `'unit'`). Read-only for consumers.
   */
  requestedType?: 'funnel' | 'pyramid' | 'gauge' | 'waffle' | 'histogram'
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
     * Ink Layer (#7): fired after an annotation is created by clicking the
     * plot in create mode or from the context menu (note or dashed line).
     * `options` carries the new annotation type/id/index and its x and/or y.
     */
    annotationCreated?(chart: ApexCharts, options?: { type?: 'point' | 'xaxis' | 'yaxis'; id?: string; index: number; x?: any; y?: any }): void
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
     * Measure ruler (#18): fired when a measure ruler is drawn. Requires the
     * `measure` feature. `options` carries the endpoints and the deltas.
     */
    measured?(chart: ApexCharts, options?: { from: { x: any; y: any }; to: { x: any; y: any }; dx: number; dy: number; percentChange: number; slope: number }): void
    /**
     * Storyboard: fired when scrolling (or goTo) activates a beat. Requires
     * the `storyboard` feature and an active chart.storyboard.bind().
     */
    beatChange?(chart: ApexCharts, options?: ApexStoryboardBeatInfo): void
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
   * the marker, or delete the note. Axis-line annotations get separate Label
   * and Line color rows, so restyling the label chip never touches the stroke.
   * Requires the `ink` feature (`import 'apexcharts/features/ink'`). Fires the
   * `annotationDragged`, `annotationEdited`, `annotationStyled` and
   * `annotationDeleted` events.
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
   * Measure ruler (#18): a measure/delta ruler. Requires the `measure`
   * feature (`import 'apexcharts/features/measure'`). Hold `key` and drag
   * A->B on the plot, or call `chart.startMeasure()`, to read
   * dx/dy/%change/slope in data space; on release the ruler pins as a
   * data-anchored overlay that re-projects on zoom/resize. Fires `measured`.
   */
  measure?: {
    /** @default false */
    enabled?: boolean
    /**
     * 'span': finance-style vertical band between two x-positions with a
     * change/%/range readout, endpoints snapped to the first series. 'free':
     * a diagonal ruler between two arbitrary points. @default 'span'
     */
    mode?: 'span' | 'free'
    /** Key held to arm a drag when not in sticky mode. @default 'm' */
    key?: string
    /** Pin the ruler as a data-anchored overlay on release. @default true */
    pinOnRelease?: boolean
    /**
     * Semantic colors. Every element also has a stable CSS class and a
     * direction class (apexcharts-measure-up|down|flat) for stylesheet theming.
     */
    colors?: { up?: string; down?: string; neutral?: string; guide?: string }
    /** Span mode: draw the shaded band between the two x-positions. @default true */
    band?: boolean
    /** Span mode: draw the vertical dashed reference lines. @default true */
    guides?: boolean
    /** Draw the endpoint dots on the series line. @default true */
    markers?: boolean
    /** Value formatters for the readout. */
    format?: {
      x?: (x: number) => string
      y?: (y: number) => string
      percent?: (pct: number) => string
    }
    /**
     * Full readout override. Receives the measure info and returns a string or
     * an array of lines. Overrides the default readout text.
     */
    label?: (info: {
      from: { x: any; y: any }
      to: { x: any; y: any }
      dx: number
      dy: number
      percentChange: number
      slope: number
      mode: 'span' | 'free'
    }) => string | string[]
  }
  /**
   * Radial Actions (#chrome): right-click / long-press context menu. Requires
   * the `contextMenu` feature (`import 'apexcharts/features/context-menu'`).
   * Each action receives the clicked data coordinates, so verbs act at that
   * point rather than chart-wide. 'measure' is shown only when the measure tool
   * is enabled. When the ink feature is bundled, 'annotate' drops an
   * ink-managed note that opens its floating editor (rename, restyle, delete),
   * and 'xline' / 'yline' drop ink-managed dashed lines the same way ('xline'
   * vertical at the clicked x, 'yline' horizontal at the clicked y).
   */
  contextMenu?: {
    /** @default false */
    enabled?: boolean
    /**
     * Ordered menu items: built-in ids and/or custom entries. @default
     * ['annotate','xline','yline','measure']
     */
    items?: Array<
      | 'annotate'
      | 'xline'
      | 'yline'
      | 'measure'
      | {
          id?: string
          label?: string
          icon?: string
          onClick?: (
            chart: ApexCharts,
            context: {
              x: any
              y: any
              seriesIndex: number | null
              dataPointIndex: number | null
              clientX: number
              clientY: number
            },
          ) => void
        }
    >
    /** Override the built-in item labels. */
    labels?: { annotate?: string; xline?: string; yline?: string; measure?: string }
    /** Text of the annotation dropped by the built-in 'annotate' item. @default 'Note' */
    noteText?: string
    /**
     * Shared styling for the built-in 'xline' ("Annotate here", vertical at
     * the clicked x) and 'yline' ("Mark this level", horizontal at the
     * clicked y) items. Lines only, never a range rectangle. With the ink
     * feature bundled the line opens the floating editor, whose Label and
     * Line color rows restyle the chip and the stroke independently, and is
     * draggable and undoable, like the note.
     */
    line?: {
      /** Label drawn on the line. @default '' (no label) */
      text?: string
      /** @default 4 */
      strokeDashArray?: number
      /** Line color; omit to keep the annotation default. */
      color?: string
    }
  }
  id?: string
  injectStyleSheet?: boolean
  group?: string
  /**
   * Per-chart license key for the gated premium features (storyboard, link /
   * crossfilter, ink, measure, contextMenu, perspectives, history). Overrides
   * ApexCharts.setLicense() and window.Apex.license for this chart. Without a
   * valid key those features still work but show an "APEXCHARTS" trial
   * watermark. Shared across the ApexCharts family.
   */
  license?: string
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
  /**
   * Real-time streaming mode. When enabled, appendData() bounds memory
   * automatically: each series is trimmed to `maxPoints` (when set) or to the
   * visible `xaxis.range` window plus a small off-screen runway. The
   * constant-velocity scroll animation for windowed updates needs no opt-in.
   */
  streaming?: {
    enabled?: boolean
    /** Maximum points kept per series by appendData(). Unset: derived from
     *  `xaxis.range` when that is set; otherwise no trimming occurs. */
    maxPoints?: number
  }
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
      /**
       * Measure ruler toggle. Shown only when `chart.measure.enabled` is true
       * and the `measure` feature is bundled. `false` keeps the ruler
       * key-driven only; a string supplies a custom SVG icon.
       */
      measure?: boolean | string
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
      /**
       * Inline the `@font-face` rules for the fonts the chart actually uses
       * into the exported SVG/PNG as base64 data URIs.
       *
       * An exported SVG is a standalone document and cannot reach the page's
       * `@font-face` rules, so without this a custom font is replaced by a
       * generic fallback in the export. Cross-origin font files that deny CORS
       * are skipped and fall back as before.
       *
       * @default true
       */
      embedFonts?: boolean
    }
    autoSelected?: 'zoom' | 'selection' | 'pan' | 'measure'
  }
  zoom?: {
    enabled?: boolean
    type?: 'x' | 'y' | 'xy'
    autoScaleYaxis?: boolean
    /**
     * Cursor-anchored zoom on mouse wheel / trackpad. `'auto'` enables it only
     * when the toolbar's reset button is present, so an unintended scroll-zoom
     * is always undoable; `true` forces it on even with the toolbar hidden.
     * Requires `enabled: true`.
     * @default 'auto'
     */
    allowMouseWheelZoom?: boolean | 'auto'
    /**
     * Momentum: enable two-finger pinch-zoom on touch devices. Zooms the x-axis
     * around the pinch centroid, frame-by-frame. `'auto'` enables it only when
     * the toolbar's reset button is present; `true` forces it on even with the
     * toolbar hidden. Requires `enabled: true`.
     * @default 'auto'
     */
    pinch?: boolean | 'auto'
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
     * Cadence (#6): easing for the generic tweens. See `ApexEasing` for the
     * complete built-in curve list and the accepted forms; register custom
     * names with `ApexCharts.registerEasing`.
     * @default 'easeInOutSine'
     */
    easing?: ApexEasing
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
      /**
       * Easing for data-change morphs only (same accepted forms as
       * `animations.easing`; see `ApexEasing`). Unset: inherits the
       * chart-wide easing, except detected streaming scrolls (appendData or
       * a shifted fixed-length window under `xaxis.range`) which default to
       * 'linear' so the window slides at constant velocity.
       */
      easing?: ApexEasing
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
      /**
       * Blend strength toward white (lighten) or black (darken), from 0 to 1.
       * Higher means a stronger effect. The shift is proportional to the base
       * color's head-room, so already-light colors are lightened only slightly
       * (and already-dark colors darkened only slightly) and never wash out.
       * @default 0.15
       */
      value?: number
    }
  }
  active?: {
    allowMultipleDataPointsSelection?: boolean
    filter?: {
      type?: 'none' | 'lighten' | 'darken'
      /**
       * Blend strength toward white (lighten) or black (darken), from 0 to 1.
       * Higher means a stronger effect.
       * @default 0.35
       */
      value?: number
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
/**
 * One node of a `children` hierarchy, as read by the partition charts
 * (`treemap`, `sunburst`). A branch may omit its own value and take the sum of
 * its children; a leaf supplies one.
 */
type ApexHierarchyNode = {
  /** The node's label. `name` is accepted as an alias. */
  x?: string | number
  name?: string
  /** The node's value. `value` is accepted as an alias. */
  y?: number | null
  value?: number | null
  color?: string
  fillColor?: string
  /** A second metric driving colour rather than size (`treemap`). */
  colorValue?: number
  meta?: unknown
  children?: ApexHierarchyNode[]
  /**
   * The `id` of a `drilldown.series` entry, read as another level by the
   * sunburst (and by the treemap with
   * `plotOptions.treemap.nested.drilldownAsLevels`).
   */
  drilldown?: string | number
}

type ApexAxisChartSeries = {
 name?: string
 type?: string
 color?: string
 group?: string
 hidden?: boolean
 zIndex?: number
 parsing?: ApexParsing;
 /**
  * Trellis facet key: which panel this series belongs to. The blessed typed
  * field for `trellis.by: 'facet'`; any other key name works from plain JS,
  * and the `trellis.by` function form works from either.
  */
 facet?: string | number
 data:
 | (number | null)[]
 | {
   /**
    * A category label, a timestamp, or a `Date`. On a `datetime` axis all
    * three keep millisecond resolution.
    */
   x: string | number | Date;
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
    * A second metric that drives this point's COLOUR, independent of `y`
    * which drives its size (`treemap`). See
    * `plotOptions.treemap.colorScale.colorValue` to read a different key.
    */
   colorValue?: number;
   /**
    * Nested hierarchy: this point is a branch containing these children,
    * to any depth (`treemap`, `sunburst`). A branch normally omits `y` and
    * takes the sum of its children instead.
    */
   children?: ApexHierarchyNode[];
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
 // A `children` hierarchy for the partition charts, where a branch carries no
 // value of its own. Listed before the catch-all so authors get completion on
 // the node shape instead of falling through to `Record<string, any>`.
 | ApexHierarchyNode[]
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
  /**
   * Trellis (#22): which panels this annotation draws in. Absent or
   * 'trellis' means every panel (projected through each panel's own scale);
   * a panel key or list of keys limits it to those panels. Ignored outside a
   * trellis host.
   */
  scope?: 'trellis' | string | string[]
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
  /**
   * Trellis (#22): which panels this annotation draws in. Absent or
   * 'trellis' means every panel (projected through each panel's own scale);
   * a panel key or list of keys limits it to those panels. Ignored outside a
   * trellis host.
   */
  scope?: 'trellis' | string | string[]
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
  /**
   * Trellis (#22): which panels this annotation draws in. Absent or
   * 'trellis' means every panel (projected through each panel's own scale);
   * a panel key or list of keys limits it to those panels. Ignored outside a
   * trellis host.
   */
  scope?: 'trellis' | string | string[]
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
  /**
   * Show a hover tooltip over the annotation marker, like a regular data
   * point. Useful for surfacing more detail than fits in the label.
   */
  tooltip?: {
    enabled?: boolean
    /**
     * Static tooltip content (HTML allowed; an array is joined with line
     * breaks). Falls back to `label.text` when omitted.
     */
    text?: string | string[]
    /**
     * Returns the tooltip markup (HTML). Takes precedence over `text`.
     */
    formatter?: (opts: {
      annotation: PointAnnotations
      seriesIndex?: number
      id?: number | string
      w: any
    }) => string
    /**
     * Tooltip theme. Falls back to the global `tooltip.theme`.
     */
    theme?: 'light' | 'dark'
    offsetX?: number
    offsetY?: number
  }
  /**
   * Render arbitrary SVG markup at the annotation's position. Deprecated in
   * favor of `image`/`marker`, but still supported.
   */
  customSVG?: {
    SVG?: string
    cssClass?: string
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
  /** CSS selector for the parent element the text is appended to. */
  appendTo?: string
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
      measure?: string
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
/**
 * Continuous colour legend: a gradient strip with end labels and a hover
 * indicator arrow, in place of the categorical legend. Available on the chart
 * types that encode a value as colour through a `colorScale` (heatmap,
 * treemap). The strip is drawn from whichever scale the chart itself uses, so
 * the legend always matches the marks.
 */
type ApexGradientLegend = {
  enabled?: boolean
  /**
   * Strip length for horizontal placements (top/bottom). Accepts a number
   * (pixels) or percentage string (e.g. `'70%'`, resolved against the chart's
   * SVG width). Default `'70%'`.
   */
  width?: number | string
  /**
   * Strip length for vertical placements (left/right). Accepts a number
   * (pixels) or percentage string (e.g. `'70%'`, resolved against the chart's
   * SVG height). Default `'70%'`.
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
   * Number of color stops sampled from the shade function when no explicit
   * `ranges` (or continuous scale) supply their own. Default 16.
   */
  stops?: number
  /** Show min/max labels at the ends of the strip. Default true. */
  showLabels?: boolean
  /** Show a value tooltip next to the arrow on mark hover. Default true. */
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

/**
 * Navigation breadcrumb chrome, shared by every chart that lets the reader move
 * into a hierarchy: the drilldown feature, and the treemap's click-to-zoom.
 * `drilldown.breadcrumb` is the shared block; a chart may override it locally
 * (see `plotOptions.treemap.zoom.breadcrumb`).
 */
type ApexBreadcrumb = {
  show?: boolean
  position?: 'top-left' | 'top-right'
  separator?: string
  /** Label of the leftmost crumb, the "everything" level. Default 'All'. */
  rootLabel?: string
  offsetX?: number
  offsetY?: number
  formatter?(
    label: string,
    opts: { index: number; depth: number; data?: any },
  ): string
}

/**
 * Styling for one level of a nested treemap. `plotOptions.treemap.parents` is
 * the base for every level; `plotOptions.treemap.levels[depth]` overrides it
 * for one depth.
 */
type ApexTreemapLevel = {
  /** Inset between a parent's edge and the children inside it. Default 4. */
  padding?: number
  /** Container fill. Defaults to a neutral tint that deepens with each level. */
  fill?: string
  fillOpacity?: number
  borderColor?: string
  borderWidth?: number
  /** Falls back to `plotOptions.treemap.borderRadius`. */
  borderRadius?: number
  hover?: {
    /** Outline the container on hover. Default true. */
    show?: boolean
    color?: string
    width?: number
  }
  header?: {
    show?: boolean
    /** Height of the strip reserved at the top of the container. Default 22. */
    height?: number
    /**
     * Skip the strip on tiles narrower than this, where no name could be read
     * anyway. Default 40.
     */
    minWidth?: number
    align?: 'left' | 'center' | 'right'
    offsetX?: number
    offsetY?: number
    /** Append the branch's aggregate to its name. Default false. */
    showValue?: boolean
    formatter?(
      name: string,
      opts: {
        value: number
        depth: number
        seriesIndex: number
        node: any
        w: any
      },
    ): string
    style?: {
      fontSize?: string
      fontFamily?: string
      fontWeight?: number | string
      color?: string
      background?: string
      cssClass?: string
    }
  }
}

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
    /**
     * Explicit z window for the size scale. Expands the data's own z extent,
     * never clamps it, so several bubble charts can share one size scale
     * (a trellis pushes the union extent through these).
     */
    minZ?: number
    maxZ?: number
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
     * Where the whiskers reach when the summary is DERIVED from raw
     * observations: a datum supplying `points` instead of a five-number `y`,
     * which requires `import 'apexcharts/features/stats'`. A precomputed
     * summary is drawn exactly as given and ignores this.
     *
     * `'minmax'` (default) reaches the extremes, so nothing is hidden.
     * `'tukey'` stops at the last observation within 1.5 * IQR of each
     * quartile; points beyond the fence then fall outside the whisker, so pair
     * it with `points.show` or they become invisible.
     */
    whiskers?: 'minmax' | 'tukey'
    /**
     * Individual observations ("jitter") overlaid on each box. Inert unless a
     * data point supplies a `points: number[]` array; `show` is false by
     * default so existing boxPlot charts are unchanged.
     *
     * `points` is also the sample the five-number summary is derived from when
     * a datum has no `y` (see `whiskers`), so the observations live in one
     * place whether the library summarises them or you do.
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
     * Kernel density estimation, used only when the density is DERIVED from raw
     * observations: a datum supplying `points`, or a flat number array as `y`,
     * which requires `import 'apexcharts/features/stats'`. A precomputed
     * density profile is drawn exactly as given.
     */
    kde?: {
      /**
       * Kernel width in value units. Unset uses Silverman's rule of thumb.
       * This is the statistical parameter; `bandwidthScale` above only scales
       * the drawn width.
       */
      bandwidth?: number
      /** Density samples per violin (default 64). */
      resolution?: number
    }
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
  /**
   * `chart.type: 'histogram'`. The series carry raw observations (a flat
   * number array, or `{ y }` objects) and are binned into one column per bin;
   * all series share one set of edges so overlaid distributions stay
   * comparable.
   *
   * Requires the optional stats feature. Import from `apexcharts/histogram`,
   * or add `import 'apexcharts/features/stats'` alongside `apexcharts/bar`.
   * The default `apexcharts` bundle already includes it. Without it the chart
   * warns and draws nothing, rather than rendering one bar per observation.
   */
  histogram?: {
    /**
     * How the bin width is chosen: a rule name, or a fixed bin count.
     * `'auto'` takes the narrower of Freedman-Diaconis and Sturges, falling
     * back to Sturges when the IQR is 0.
     */
    bins?: 'auto' | 'fd' | 'sturges' | 'scott' | 'rice' | 'sqrt' | number
    /**
     * Explicit bin width in value units. Wins over `bins`, for when the
     * boundaries carry meaning (decades, 5-minute buckets) rather than being
     * a statistical choice.
     */
    binWidth?: number
    /** `[min, max]` to bin over instead of the data's own extent. */
    range?: number[]
    /**
     * y units: observations per bin, percent of the series total, or
     * `count / (n * binWidth)` so the total area is 1.
     */
    normalize?: 'count' | 'relative' | 'density'
    /** Running total across bins, i.e. a cumulative distribution. */
    cumulative?: boolean
    /**
     * With more than one series, draw every distribution across the full bin
     * so they overlay, instead of dividing the bin between them. Defaults to
     * `true`: all series already share one set of edges, and comparing two
     * shapes is the reason to put them on one axis. Set `false` for
     * side-by-side bars.
     *
     * An overlay also softens the fill and drops the bin separator stroke, so
     * the overlapping region reads. Both remain overridable.
     */
    overlap?: boolean
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
       * When enabled, replaces the default categorical legend with a
       * continuous color gradient strip and a hover indicator arrow that
       * tracks the currently hovered mark's value along the spectrum.
       * Follows `legend.position` (top / right / bottom / left); the arrow
       * orientation flips to point at the strip from the chart-facing side.
       */
      gradientLegend?: ApexGradientLegend
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
    dataLabels?: {
      format?: 'scale' | 'truncate'
      /**
       * Skip a tile's label when it would render below this size in px.
       *
       * With `format: 'scale'` the font size follows the tile's area, so a
       * dense treemap asks for a lot of text only a few pixels tall. Each such
       * label still has to be built and measured against the DOM, which on a
       * large chart dominates the render. Default 4, below the smallest label
       * any bundled sample draws. Set 0 to label every tile regardless.
       */
      minFontSize?: number
    }
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
      /**
       * Colour a tile by a SECOND metric, independent of the value that sizes
       * it: area is how big something is, colour is how it did. Reads
       * `datum.colorValue` by default; pass a key name to read a different
       * property, or an accessor to compute one.
       */
      colorValue?:
        | string
        | ((
            datum: any,
            opts: { seriesIndex: number; dataPointIndex: number; w: any },
          ) => number)
      /**
       * Continuous interpolation between colour stops, for the metric above.
       * Active as soon as any datum carries a colour metric; `enabled: false`
       * opts out and `true` forces it on. `ranges` is unaffected and still
       * applies wherever it is set.
       */
      gradient?: {
        enabled?: boolean
        /** Domain low. Defaults to the extent of the colour metric. */
        min?: number
        /** Domain high. Defaults to the extent of the colour metric. */
        max?: number
        /**
         * The value the middle colour is pinned to. Defaults to 0 when the
         * domain straddles zero (a diverging metric), otherwise none. Pass
         * `null` to force a plain sequential ramp.
         */
        midpoint?: number | null
        /**
         * With a midpoint, balance the domain around it so equal moves in
         * either direction read as equally saturated. Default true.
         */
        symmetric?: boolean
        /** Low -> mid -> high. Two colours make a sequential ramp. */
        colors?: string[]
        /** Explicit stops; overrides `colors` and `midpoint`. */
        stops?: { value: number; color: string }[]
      }
      /**
       * Continuous colour legend for the metric above: a gradient strip with
       * end labels and a hover indicator, in place of the categorical legend.
       */
      gradientLegend?: ApexGradientLegend
    };
    /**
     * Arbitrary-depth treemap. A datum may carry `children` to any depth;
     * every branch is drawn as a real container with a header strip and its
     * children inset below it.
     */
    nested?: {
      /**
       * Parent containers appear on their own as soon as the data is nested.
       * `false` forces the flat two-level layout.
       */
      enabled?: boolean
      /**
       * Read `drilldown: '<id>'` ids as extra levels instead of as a click
       * target for the drilldown feature. Default false, because on a treemap
       * that id has always meant "descend on click".
       */
      drilldownAsLevels?: boolean
    }
    /**
     * How a branch is drawn once the data is nested. Per-level overrides go in
     * `levels`.
     */
    parents?: ApexTreemapLevel & {
      /** `'auto'` (default): on when the data carries `children`. */
      show?: boolean | 'auto'
      tooltip?: {
        formatter?(opts: {
          name: string
          value: number
          depth: number
          leafCount: number
          percentOfParent: number
          percentOfTotal: number
          node: any
          w: any
        }): string
      }
    }
    /**
     * Per-depth overrides of `parents`, indexed from the outermost group
     * actually drawn (0 = the series, or the first authored level when a
     * single series is unwrapped).
     */
    levels?: ApexTreemapLevel[]
    /**
     * Click a group to fill the canvas with it; a breadcrumb goes back.
     *
     * Ignored when the drilldown feature is active on the same chart: both
     * navigate the hierarchy, and drilldown owns the click there.
     */
    zoom?: {
      enabled?: boolean
      /**
       * Overrides `drilldown.breadcrumb` for this chart only, so a zoomed
       * treemap and a drilled-in chart present the same affordance without
       * importing the drilldown feature.
       */
      breadcrumb?: ApexBreadcrumb
    }
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
  unit?: {
    /**
     * 'grouped' (default): each category is its own cluster, laid out in a row.
     * 'packed': one blob; categories are coloured and (with sortByGroup) ordered
     * smallest-first so the minority group nests in the centre.
     * 'columns': each category is a vertical bar built from stacked dots (a unit
     * / waffle column) whose height encodes the count.
     * 'grid': one lattice of cells filled in category order - a waffle /
     * part-to-whole square "pie" (`chart.type: 'waffle'` presets this layout).
     * 'scatter': beeswarm - each unit placed on a real numeric X value axis by
     * its per-unit value, laned by category on Y (draws its own axis + lanes).
     * 'arc': parliament / hemicycle - seats in concentric arced rows, filled in
     * category order so each category is a contiguous wedge (see `arc`).
     * 'custom': positions come from `positions`.
     */
    layout?:
      | 'grouped'
      | 'packed'
      | 'columns'
      | 'grid'
      | 'scatter'
      | 'arc'
      | 'custom'
    /**
     * `layout: 'custom'` only. The layout provider: either a function returning
     * plot-pixel positions, or the name of one registered with
     * `ApexCharts.registerUnitLayout`.
     *
     * A layout is objects in, positions out. It knows nothing about animation,
     * because the engine already tweens position, radius and colour and already
     * keeps each mark's identity across a relayout, so an arrangement the
     * built-in layouts cannot express needs no new transition code.
     *
     * A mark whose id the provider omits animates out; ids matching no mark are
     * ignored.
     */
    positions?: string | ApexUnitLayout
    /**
     * How dots are matched between renders on an update (which previous dot a
     * new dot tweens from).
     * 'group' (default): keyed per category, so a dot stays in its group and
     * category-level enters/exits fade in and out.
     * 'flow': keyed by global draw order, so the anonymous crowd migrates (and
     * recolours) across a regroup - the circles-to-bars transition.
     * 'identity': keyed by each datum's `id`/`name`, so a SPECIFIC unit migrates
     * across any regroup or relayout keeping its colour and size. Requires the
     * per-unit object form with unique ids/names.
     */
    transition?: 'group' | 'flow' | 'identity'
    /** Mark shape for each unit. `'image'` renders an icon (isotype pictogram). */
    shape?: 'circle' | 'square' | 'image'
    /** Icon used when `shape: 'image'`. */
    image?: {
      /** Icon URL or data URI. */
      src?: string
      width?: number
      height?: number
      /**
       * Recolour a monochrome icon to the category colour (or a per-unit
       * `fillColor`) so the pictogram matches the legend. Leave off (default)
       * for multi-colour icons that should keep their own colours.
       */
      tint?: boolean
    }
    /** Dot radius in px, or 'auto' to size dots so the largest cluster fits. */
    size?: number | 'auto'
    /**
     * The 'columns' layout can size its dots independently of `size` (which the
     * circle layouts / storyboard beats often pin to a constant so dots do not
     * resize while migrating).
     */
    columns?: {
      /**
       * 'inherit' (default) uses `size`; 'auto' sizes dots to fill the plot
       * height; a number pins a columns-only size. Circle / square only (image
       * icons keep their intrinsic size).
       */
      size?: 'inherit' | 'auto' | number
    }
    /**
     * The 'grid' (waffle) layout: one lattice of cells filled in category order.
     */
    grid?: {
      /** Cells per row. Defaults to 10. */
      columns?: number
      /**
       * Fixed cell budget (e.g. 100 for a percentage waffle); largest-remainder
       * allocates the cells to categories. Leave undefined for one cell per unit
       * (respects unitValue / maxUnits).
       */
      total?: number
      /** First row of the fill: 'bottom' (default) or 'top'. */
      fillFrom?: 'bottom' | 'top'
      /**
       * Small multiples: render ONE mini-waffle per category in a trellis
       * instead of a single shared lattice. Each tile has `total` cells
       * (default 100) and fills value/`max` of them; the rest show as a faint
       * `trackColor` backdrop, and each tile carries its own label.
       */
      split?: boolean
      /** Small-multiple tiles per row; undefined = auto (near-square). */
      tileColumns?: number
      /**
       * Small-multiple value -> filled-cell denominator; undefined = the largest
       * count (leader fills its tile). Set to 100 for true "of 100" percentage tiles.
       */
      max?: number
      /** Small-multiple empty ("track") cell colour; undefined = neutral grey. */
      trackColor?: string
    }
    /**
     * The 'scatter' layout places units on real value axes (needs the object-form
     * data). `y:'lanes'` (default) is a beeswarm (X value axis, Y category lane);
     * `y:'value'` is a 2D value-value scatter (each datum's `x`/`y` on two numeric
     * axes, category = colour). `sizeRange` turns dots into bubbles.
     */
    scatter?: {
      /** 'lanes' (beeswarm, default) or 'value' (2D value-value scatter). */
      y?: 'lanes' | 'value'
      /** 'swarm' (anti-overlap pack, default) or 'jitter' (random lane spread). */
      spread?: 'swarm' | 'jitter'
      /**
       * Beeswarm orientation (1D `y:'lanes'` mode only). 'horizontal' (default):
       * value on X, category lanes stacked on Y. 'vertical': value on Y,
       * category lanes as columns across X. The value-axis config keys
       * (`xMin`/`xMax`/`xTitle`/`xFormatter`/`tickAmount`) describe the value
       * axis in both orientations.
       */
      orientation?: 'horizontal' | 'vertical'
      /** Approximate number of value-axis ticks. Defaults to 5. */
      tickAmount?: number
      /** Fixed X-axis min / max; undefined = derived (nice-numbered) from data. */
      xMin?: number
      xMax?: number
      /** X-axis title drawn under the tick labels. */
      xTitle?: string
      /** X tick-label formatter, `(value) => string`. */
      xFormatter?: (value: number) => string
      /** Approximate number of Y-axis ticks (2D mode). Defaults to 5. */
      yTickAmount?: number
      /** Fixed Y-axis min / max (2D mode); undefined = nice-numbered from data. */
      yMin?: number
      yMax?: number
      /** Y-axis title (2D mode), drawn rotated at the left. */
      yTitle?: string
      /** Y tick-label formatter, `(value) => string`. */
      yFormatter?: (value: number) => string
      /** Datum key holding the bubble size value. Defaults to 'z'. */
      sizeField?: string
      /** `[minRadius, maxRadius]` in px: turns dots into area-scaled bubbles. */
      sizeRange?: [number, number]
      /** Left-gutter width reserved for lane (category) labels (lanes mode). */
      laneLabelWidth?: number
      /** Draw the faint gridlines. Defaults to true. */
      gridlines?: boolean
    }
    /**
     * Opt-in bubble sizing: scale each dot's radius by its per-unit value
     * (requires the object-form data, `series: [{ data: [{ value }] }]`).
     * Circle shape only; the lattice is spaced for the largest bubble so dots
     * never overlap. Ignored when there are no per-unit values.
     */
    sizeByValue?: {
      enabled?: boolean
      /** Radius (px) for the largest value, or 'auto' to fit it to the plot. */
      maxRadius?: number | 'auto'
      /** Radius (px) for the smallest value; defaults to ~35% of maxRadius. */
      minRadius?: number
      /** 'area' (bubble area proportional to value) or 'linear'. */
      scale?: 'area' | 'linear'
    }
    /** Packing gap factor between spiral shells (1 = dots touch). */
    spacing?: number
    /**
     * How marks move between layouts on an update, and where entering marks
     * come from.
     */
    gather?: {
      /**
       * 'spring' settles each mark on a damped spring, so a gather interrupted
       * by the next update carries the marks' velocity into it instead of
       * restarting them from a standstill. 'tween' runs the fixed-duration
       * `easing` below. 'auto' (the default) is spring, unless `easing` was set
       * to something other than the default.
       */
      motion?: 'auto' | 'spring' | 'tween'
      /**
       * Spring character (`motion: 'spring'` only): 'crisp' (default),
       * 'gentle' (softer, for large reflows) or 'snappy' (faster, a hint of
       * settle). Scaled by `chart.animations.speed`.
       */
      spring?: 'crisp' | 'gentle' | 'snappy'
      /** Tween curve: 'outCubic' (default: decelerate and stop), 'inOutCubic' (weighted start), or 'outBack' (overshoot + settle). Setting this implies `motion: 'tween'`. */
      easing?: 'outCubic' | 'inOutCubic' | 'outBack'
      /** Overshoot strength for `easing: 'outBack'`. Defaults to 1.70158 (~10% overshoot). */
      overshoot?: number
      /**
       * Where an ENTERING mark animates from (fresh mount, or a category
       * appearing): 'burst' (default) flies out from the cluster centre,
       * 'fade' materialises in place, 'rise' fades in while drifting gently
       * up into its slot.
       */
      enter?: 'burst' | 'fade' | 'rise'
    }
    /**
     * Options for `layout: 'arc'` (parliament / hemicycle). Angles use the
     * radialBar convention: 0 = top, clockwise. The default sweep is a top
     * semicircle; a full circle is `startAngle: 0, endAngle: 360`.
     */
    arc?: {
      /** Sweep start angle in degrees (0 = top, clockwise). Default -90. */
      startAngle?: number
      /** Sweep end angle in degrees. Default 90 (a top semicircle). */
      endAngle?: number
      /** Donut hole: inner radius as a fraction of the outer radius. Default 0.4. */
      innerRadiusRatio?: number
      /** Number of concentric seat rows, or 'auto' to size dots as large as fit. */
      rows?: number | 'auto'
    }
    /** Corner radius for shape:'square'. */
    borderRadius?: number
    /** 1 dot represents this many units of value (waffle scaling). */
    unitValue?: number
    /** Safety cap on total dots; counts scale down proportionally above it. */
    maxUnits?: number
    /** Packed layout: order categories smallest-first (minority centred). */
    sortByGroup?: boolean
    clusterLabels?: {
      show?: boolean
      /** Label placement relative to the cluster/bar. Defaults to 'top'. A 'bottom' label is always straight (the curved arc rides the top crown only). */
      position?: 'top' | 'bottom'
      curved?: boolean
      fontSize?: string
      fontFamily?: string
      fontWeight?: number | string
      /** Defaults to the cluster's own colour when undefined. */
      color?: string
      offsetY?: number
      /** Return "\n"-separated text to split an outer label over several lines. */
      formatter?(
        name: string,
        opts: { seriesIndex: number; value: number; percent: number; w: any }
      ): string
      /**
       * Outer (name) labels, as pie/donut draw them: the label sits in the margin
       * beside the shape and a leader line joins it to the colour band it names,
       * so the crowd can be read without a legend.
       *
       * `layout: 'custom'` only, and best on a silhouette whose categories stack
       * vertically (the default row ordering): those alternate down the left and
       * right gutters. A column-ordered shape sends each label to the side its own
       * band sits on. The margin is taken off both sides so the shape stays
       * centred, so turning this on makes the silhouette a little smaller.
       */
      external?: {
        show?: boolean
        connector?: {
          show?: boolean
          width?: number
          /** Defaults to the band's own colour when undefined. */
          color?: string
          /** Air between the band's outermost dot and the leader line's bend. */
          gap?: number
          /** Length of the run out to the label. */
          length?: number
        }
        offsetX?: number
        offsetY?: number
      }
    }
    /** Per-unit (per-dot) tooltip. */
    tooltip?: {
      /**
       * Return the tooltip body for a single hovered dot. The dot's category is
       * `seriesIndex` and its index within that category is `dataPointIndex`, so
       * the formatter can index into per-unit data. Return a string or HTML.
       * Defaults to `"#<dataPointIndex+1> of <count>"`.
       */
      formatter?(opts: {
        seriesName: string
        seriesIndex: number
        dataPointIndex: number
        /** Number of dots drawn for this category (after unitValue + maxUnits). */
        count: number
        /** Raw category value (before unitValue scaling). */
        value: number
        unitValue: number
        /**
         * This dot's own datum when the per-unit object form was supplied
         * (`series: [{ name, data: [...] }]`); otherwise undefined.
         */
        datum: any
        color: string
        w: any
      }): string
    }
  }
  pie?: {
    startAngle?: number
    endAngle?: number
    customScale?: number
    offsetX?: number
    offsetY?: number
    expandOnClick?: boolean
    /**
     * How far a clicked slice slides out of the pie (px), measured along its
     * own mid-angle. The slice is translated, not redrawn at a bigger radius,
     * so its shape is unchanged and a gap opens between it and the rest of the
     * pie. Defaults to 10. Ignored for polarArea, and in a drilldown pie/donut
     * where a slice click navigates instead. Set 0 to keep the slice in place
     * on click.
     */
    expandOffset?: number
    /**
     * Hover outline: a translucent band traced just outside the rim of the
     * hovered slice, so the slice keeps its own colour instead of being
     * lightened. Takes the place of the `states.hover` filter for pie, donut
     * and polarArea, and is skipped when `states.hover.filter.type` is
     * `'none'`.
     */
    hoverOutline?: {
      show?: boolean
      /** Band thickness in px. Defaults to 8. */
      size?: number
      /**
       * Extra clearance between the slice rim and the band, in px, on top of
       * the slice stroke (the band always starts at the outer edge of the
       * stroke, never under it). Defaults to 0, since a stroke is normally
       * present and already reads as the separation.
       */
      gap?: number
      /** Band opacity over the slice colour. Defaults to 0.3. */
      opacity?: number
      /** Band colour. Defaults to the hovered slice's colour. */
      color?: string
    }
    /**
     * Rounds the corners of each slice (in px). Applies to pie, donut and
     * polarArea. Defaults to 0 (sharp corners). The value is clamped per
     * slice so corner fillets never cross on thin or narrow slices.
     */
    borderRadius?: number
    /**
     * Gap between adjacent slices (in px). Applies to pie, donut and
     * polarArea. Defaults to 0 (slices touch). Each slice is inset
     * symmetrically, so its mid-angle (data label and hit region) is kept.
     */
    spacing?: number
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
  /**
   * Sunburst / nested pie-donut (hierarchical radial). Rings go from the centre
   * hole outward, one per hierarchy level; each child arc is nested inside its
   * parent's angular wedge. Accepts a native `children` hierarchy or an existing
   * `drilldown` config (adapter).
   */
  sunburst?: {
    offsetX?: number
    offsetY?: number
    startAngle?: number
    endAngle?: number
    /** Centre hole radius as a % of the max radius (e.g. '15%'). */
    innerSize?: string
    /** Corner rounding of each arc (px), same semantics as pie borderRadius. */
    borderRadius?: number
    /** Gap between adjacent arcs (px), same semantics as pie spacing. */
    spacing?: number
    /** Draw a shallow branch's leaf to the rim ('extend') or stop it ('stop'). */
    leaf?: 'extend' | 'stop'
    /** Angular partition of a parent's wedge among its children. */
    partition?: 'normalize' | 'strict'
    /** Per-depth lightening of the parent colour (0 = same, 1 = white). */
    tint?: number
    /** Click a wedge to zoom into its branch (breadcrumb to go back). Default true. */
    zoomOnClick?: boolean
    dataLabels?: {
      show?: boolean
      /** Hide the label on any arc narrower than this (degrees). */
      minAngleToShow?: number
      style?: {
        fontSize?: string
        fontFamily?: string
        fontWeight?: string | number
        colors?: string[]
      }
    }
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
  /**
   * Opt-in (default 0 = off). Above this many points in a series, that series'
   * markers are drawn as one path element (a subpath per point) instead of one
   * element per point, which roughly quarters the cost of a marker-heavy
   * render. Not pixel-identical: overlapping markers are rasterized as one
   * region and lose their individual outlines, so dense clusters read flatter.
   * Only applies where markers are already non-interactive and uniform, and
   * such a series has no `.apexcharts-marker` nodes.
   */
  largeDatasetThreshold?: number
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
  /**
   * Horizontal offset of the label. Pass a function to vary the offset per
   * data point, e.g. to separate labels that would otherwise overlap.
   * The function must be pure, as it may be called more than once per label.
   */
  offsetX?: number | ((opts: ApexFormatterOpts) => number)
  /**
   * Vertical offset of the label. Pass a function to vary the offset per
   * data point, e.g. to separate labels that would otherwise overlap.
   * The function must be pure, as it may be called more than once per label.
   */
  offsetY?: number | ((opts: ApexFormatterOpts) => number)
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
  /**
   * Ride data labels to their new position on a data-change update instead of
   * snapping. On by default, so labels reflow on the same clock as the bars,
   * markers and axis ticks. Bar/column only; speed and easing follow
   * chart.animations.dynamicAnimation.
   */
  animate?: {
    enabled?: boolean
  }
  /**
   * Count the numeric value up/down from its previous value on update, like
   * countUp.js. Off by default. The formatter runs each frame so number
   * formatting is preserved. Bar/column only.
   */
  countUp?: {
    enabled?: boolean
  }
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
  /**
   * One tight line instead of a card: the x label sits inline before the
   * value, the marker goes, the padding and font shrink. Meant for panels a
   * normal card would cover (small multiples, sparklines, dashboard tiles).
   * A single-series chart also drops the series-name label; with several
   * series the names stay, since they are what tells the rows apart.
   * @default false
   */
  compact?: boolean
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
    width?: string | number
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
  /** '' (the default) inherits / auto-resolves; 'light' | 'dark' force a mode. */
  mode?: 'light' | 'dark' | ''
  palette?: string
  /**
   * Facet (#13): read `--apx-*` CSS design tokens from the cascade
   * (`--apx-accent`, `--apx-fore`, `--apx-grid`, `--apx-surface`,
   * `--apx-series-1..N`). They top the resolution chain, below explicit config.
   * true (default) reads any present (absence is a no-op); false disables.
   * Tokens are re-read on each render; use `chart.refreshTokens()` after a
   * runtime CSS change that does not itself trigger a render.
   */
  tokens?: boolean
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
/** One mark handed to a unit-chart layout provider. */
interface ApexUnitObject {
  /**
   * Stable identity. The datum's own `id`/`name` when the per-unit object form
   * supplies one, so a provider can address a specific unit ("Texas",
   * "employee 41") rather than a positional slot; otherwise
   * `"<seriesIndex>:<dataPointIndex>"`.
   */
  id: string
  /** Global draw order across every category. */
  index: number
  /** Category this mark belongs to. */
  seriesIndex: number
  /** Index within its category. */
  dataPointIndex: number
  /** Category label. */
  label: string
  /** The datum's value, when the per-unit object form supplies one. */
  value?: number
  /** The raw per-unit datum, when supplied. */
  datum?: any
  /** The radius the engine would use, so a size-aware provider need not redo it. */
  r: number
}

/** A position returned by a unit-chart layout provider, in plot pixels. */
interface ApexUnitPosition {
  /** Must match an `ApexUnitObject.id`; unknown ids are ignored. */
  id: string
  x: number
  y: number
  /** Overrides the engine's radius for this mark. */
  r?: number
}

/**
 * A unit-chart layout: objects in, positions out.
 *
 * `rect` is the plot area, in the same pixel space as the returned
 * coordinates. Omitting a mark's id removes it, and it animates out through the
 * normal exit path.
 */
type ApexUnitLayout = (
  objects: ApexUnitObject[],
  rect: { x: number; y: number; width: number; height: number },
) => ApexUnitPosition[]

/** One datum of a `rowSeries()` cluster: a single row a mark stood for. */
interface ApexUnitRowDatum {
  /** Stable across relayouts, so `transition: 'identity'` can follow one row. */
  id: string
  /** The cluster's label, repeated per row. */
  x: string
  /** The observation itself, so bubble sizing and colour scales can read it. */
  y: number
  /** The colour of the mark this row came out of. */
  fillColor?: string
}

/** One cluster of `rowSeries()`: the rows behind exactly one mark. */
interface ApexUnitRowSeries {
  name: string
  data: ApexUnitRowDatum[]
}

/**
 * A row source: given a chart's state, the rows each of its marks stands for.
 *
 * Returns one cluster per mark in draw order (ascending series index, then
 * ascending category), including marks with no rows, or null when the chart
 * cannot answer.
 */
type ApexRowSource = (w: any, opts?: { maxRows?: number }) => ApexUnitRowSeries[] | null

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
