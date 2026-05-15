// Typescript declarations for Apex class and module.
// Note: When you have a class and a module with the same name; the module is merged
// with the class.  This is necessary since apexcharts exports the main ApexCharts class only.
//
// This is a sparse typed declarations of chart interfaces.  See Apex Chart documentation
// for comprehensive API:  https://apexcharts.com/docs/options
//
// There is on-going work to provide a comprehensive typed definition for this component.
// See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/28733

// ---------------------------------------------------------------------------
// Shared formatter/event opts types
// ---------------------------------------------------------------------------

/**
 * Opts object passed to most chart event callbacks (click, mouseMove, etc.).
 */
type ApexChartEventOpts = {
  seriesIndex: number
  dataPointIndex: number
  w: ApexCharts.ApexOptions & { globals: any }
  [key: string]: any
}

/**
 * Opts object passed to most value formatters (dataLabels, legend, tooltip y, etc.).
 */
type ApexFormatterOpts = {
  seriesIndex: number
  dataPointIndex: number
  w: ApexCharts.ApexOptions & { globals: any }
  [key: string]: any
}

/**
 * Opts object passed to legend.formatter and legend.tooltipHoverFormatter.
 */
type ApexLegendFormatterOpts = {
  seriesIndex: number
  w: ApexCharts.ApexOptions & { globals: any }
  [key: string]: any
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
  exportToCSV(options?: { series?: any; fileName?: string; columnDelimiter?: string; lineDelimiter?: string }): void

  /** Returns the SVG.js root element (SVG Paper) for the chart. */
  paper(): any

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

  exports: {
    cleanup(): string
    svgUrl(): string
    dataURI(options?: { scale?: number; width?: number }): Promise<{ imgURI: string } | { blob: Blob }>
    exportToSVG(): void
    exportToPng(): void
    exportToCSV(options?: { series?: any; fileName?: string; columnDelimiter?: string; lineDelimiter?: string }): void
    getSvgString(scale?: number): Promise<string>
    triggerDownload(href: string, filename?: string, ext?: string): void
  }
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

  export interface ApexOptions {
    annotations?: ApexAnnotations
    chart?: ApexChart
    colors?: any[]
    dataLabels?: ApexDataLabels
    fill?: ApexFill
    forecastDataPoints?: ApexForecastDataPoints
    grid?: ApexGrid
    labels?: string[]
    legend?: ApexLegend
    markers?: ApexMarkers
    noData?: ApexNoData
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
  export type { ApexChartEventOpts }
  export type { ApexFormatterOpts }
  export type { ApexLegendFormatterOpts }
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
  color?: string
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
    color?: string | string[]
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
    keyDown?(e: KeyboardEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
    keyUp?(e: KeyboardEvent, chart?: ApexCharts, options?: ApexChartEventOpts): void
  }
  brush?: {
    enabled?: boolean
    autoScaleYaxis?: boolean
    target?: string
    targets?: string[]
  }
  id?: string
  injectStyleSheet?: boolean
  group?: string
  locales?: ApexLocale[]
  defaultLocale?: string
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
        categoryFormatter?(value?: string | number): any
        valueFormatter?(value?: string | number): any
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
     * When true (default), honors the OS-level prefers-reduced-motion media
     * query — all initial-mount animations are skipped and the chart renders
     * instantly. Set to false to override (e.g. for QA / demo screens).
     */
    respectReducedMotion?: boolean
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
      type?: string
    }
  }
  active?: {
    allowMultipleDataPointsSelection?: boolean
    filter?: {
      type?: string
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
   x: any;
   y: any;
   fill?: ApexFill;
   fillColor?: string;
   strokeColor?: string;
   meta?: any;
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
  colors?: any[] | string[]
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
}

type PointAnnotations = {
  id?: number | string
  x?: number | string
  y?: null | number
  yAxisIndex?: number
  seriesIndex?: number
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
          formatter?(w: ApexCharts.ApexOptions & { globals: any }): string
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
      strokeWidth?: string | string[]
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
      baseRadius?: number
      length?: string | number
      baseWidth?: number
      tipWidth?: number
      animation?: {
        enabled?: boolean
        duration?: number
        easing?: string
      }
    }
    pivot?: {
      show?: boolean
      color?: string
      strokeColor?: string
      strokeWidth?: number
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
        formatter?(opts: ApexFormatterOpts): string
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
  colors?: any[]
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
  clusterGroupedSeriesOrientation?: string;
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
    colors?: any[]
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
  options?: any
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
  custom?: ((options: any) => any) | ((options: any) => any)[]
  fillSeriesColor?: boolean
  theme?: string
  cssClass?: string
  hideEmptySeries?: boolean
  style?: {
    fontSize?: string
    fontFamily?: string
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
  categories?: any;
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
    borderType?: string
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

export = ApexCharts;
export as namespace ApexCharts;
