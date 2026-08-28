// @ts-check
import Defaults from './Defaults'
import { TYPE_ALIASES } from './TypeAliases'
import Utils from './../../utils/Utils'
import Options from './Options'
import { Environment } from '../../utils/Environment.js'

/**
 * ApexCharts Config Class for extending user options with pre-defined ApexCharts config.
 *
 * @module Config
 **/
export default class Config {
  /**
   * @param {Record<string, any>} opts
   */
  constructor(opts) {
    this.opts = opts
  }

  /** @param {{responsiveOverride: any}} opts */
  init({ responsiveOverride }) {
    let opts = this.opts
    const options = new Options()
    const defaults = new Defaults(opts)

    // First-class chart-type aliases: 'funnel' / 'pyramid' / 'gauge' are
    // promoted names for existing renderers (bar with isFunnel, radialBar).
    // Preserve the requested type for discoverability, then normalize
    // chart.type to the base renderer so all internal chart.type checks
    // continue to work unchanged.
    opts = this.normalizeAliasedChartType(opts)

    this.chartType = opts.chart.type

    opts = this.extendYAxis(opts)
    opts = this.extendAnnotations(opts)

    let config = options.init()
    let newDefaults = {}
    if (opts && typeof opts === 'object') {
      // Which type's defaults apply. Shared with the update path, which has to
      // make the same pick when chart.type changes at runtime; see
      // Defaults.handOverTypeDefaults. The modes below layer on top of it.
      let chartDefaults = Defaults.forType(opts)

      if (opts.chart.brush?.enabled) {
        chartDefaults = defaults.brush(chartDefaults)
      }

      if (opts.plotOptions?.line?.isSlopeChart) {
        chartDefaults = defaults.slope()
      }

      if (opts.chart.stacked && opts.chart.stackType === '100%') {
        opts = defaults.stacked100(opts)
      }

      // `chart.type: 'dumbbell'` picks its own connector thickness through
      // Defaults.dumbbell, so this is only for the bare flag on a range bar.
      // Written into opts, it would otherwise beat the type's own default.
      if (
        opts.plotOptions?.bar?.isDumbbell &&
        opts.chart.requestedType !== 'dumbbell'
      ) {
        opts = defaults.dumbbellSizing(opts)
      }

      // If user has specified a dark theme, make the tooltip dark too
      this.checkForDarkTheme(Environment.getApex()) // check global window Apex options
      this.checkForDarkTheme(opts) // check locally passed options

      opts.xaxis = opts.xaxis || Environment.getApex().xaxis || {}

      // an important boolean needs to be set here
      // otherwise all the charts will have this flag set to true window.Apex.xaxis is set globally
      if (!responsiveOverride) {
        opts.xaxis.convertedCatToNumeric = false
      }

      opts = this.checkForCatToNumericXAxis(this.chartType, chartDefaults, opts)

      if (
        opts.chart.sparkline?.enabled ||
        Environment.getApex().chart?.sparkline?.enabled
      ) {
        chartDefaults = defaults.sparkline(chartDefaults)
      }
      newDefaults = Utils.extend(config, chartDefaults)
    }

    // config should cascade in this fashion
    // default-config < global-apex-variable-config < user-defined-config

    // get GLOBALLY defined options and merge with the default config
    const mergedWithDefaultConfig = Utils.extend(
      newDefaults,
      Environment.getApex(),
    )

    // get the merged config and extend with user defined config
    config = Utils.extend(mergedWithDefaultConfig, opts)

    // some features are not supported. those mismatches should be handled
    config = this.handleUserInputErrors(config)

    return config
  }

  /**
   * Promoted chart-type aliases — `funnel`, `pyramid`, `gauge` — render via
   * the existing `bar` (with `isFunnel`) and `radialBar` pathways. To keep
   * the ~20 internal `chart.type === 'bar' | 'radialBar'` checks working
   * unchanged, we normalize `chart.type` to the base renderer name here and
   * preserve the user-facing name on `chart.requestedType` for the public
   * API and for default selection.
   *
   * @param {Record<string, any>} opts
   * @returns {Record<string, any>}
   */
  normalizeAliasedChartType(opts) {
    if (!opts || !opts.chart) return opts
    const requested = opts.chart.type
    // One list, in Defaults, so the names that normalize here are the same ones
    // registerSeriesType refuses to let a custom type take.
    if (!requested || !TYPE_ALIASES[requested]) {
      return opts
    }
    opts.chart.requestedType = requested
    if (requested === 'waffle') {
      // `waffle` is an alias for the unit chart's single-grid layout: a
      // part-to-whole lattice of square cells. It renders through the `unit`
      // pathway, so every `chart.type === 'unit'` check keeps working. Presets
      // are only applied when the user has not set them, so they stay tweakable.
      opts.plotOptions = opts.plotOptions || {}
      opts.plotOptions.unit = opts.plotOptions.unit || {}
      if (opts.plotOptions.unit.layout == null) {
        opts.plotOptions.unit.layout = 'grid'
      }
      if (opts.plotOptions.unit.shape == null) {
        opts.plotOptions.unit.shape = 'square'
      }
      opts.chart.type = 'unit'
    } else if (requested === 'funnel' || requested === 'pyramid') {
      opts.plotOptions = opts.plotOptions || {}
      opts.plotOptions.bar = opts.plotOptions.bar || {}
      opts.plotOptions.bar.isFunnel = true
      opts.plotOptions.bar.horizontal = true
      opts.chart.type = 'bar'
      if (requested === 'pyramid') {
        // Pyramid uses a separate value-proportional renderer (each stage's
        // vertical space + envelope width is derived from cumulative value
        // share, producing a continuous triangle). `isFunnel` stays true so
        // the layout/centering/no-axis-labels defaults still apply.
        opts.plotOptions.bar.isPyramid = true
      } else {
        // Funnel must explicitly clear a stale isPyramid that may linger on
        // w.config from a previous pyramid render — Utils.extend won't drop
        // it on its own.
        opts.plotOptions.bar.isPyramid = false
      }
    } else if (requested === 'gauge') {
      opts.chart.type = 'radialBar'
    } else if (requested === 'waterfall') {
      // A waterfall bar floats between the level it started at and the level it
      // left behind, which is exactly what a range column already draws. So the
      // type routes to `rangeBar` (NOT `bar`: a plain bar always grows from the
      // baseline) and features/waterfall supplies the two things a range column
      // has no opinion about: the running totals, and the connectors.
      //
      // Stacking a waterfall is meaningless (the bars are already a cumulative
      // walk) and would fight the range pathway, so it is forced off.
      opts.chart.stacked = false
      opts.chart.type = 'rangeBar'
    } else if (requested === 'dumbbell') {
      // A dumbbell is an interval with its two ends marked, which is what a
      // range bar with `isDumbbell` already draws. So the type routes to
      // `rangeBar` and features/dumbbell supplies the one thing a range bar has
      // no opinion about: turning the two measures the reader compares into the
      // single interval per row the renderer takes.
      //
      // Horizontal by default because the categories are names, and a name
      // reads along the row it labels rather than turned on its side under a
      // column. Set `plotOptions.bar.horizontal: false` for the column form.
      opts.plotOptions = opts.plotOptions || {}
      opts.plotOptions.bar = opts.plotOptions.bar || {}
      opts.plotOptions.bar.isDumbbell = true
      if (opts.plotOptions.bar.horizontal == null) {
        opts.plotOptions.bar.horizontal = true
      }
      // Stacking is meaningless here (the rows are not parts of a whole) and
      // would fight the range pathway, so it is forced off.
      opts.chart.stacked = false
      opts.chart.type = 'rangeBar'
    } else if (requested === 'streamgraph') {
      // A streamgraph band floats between a baseline that is not zero and that
      // baseline plus its own value, which is exactly what a range area already
      // draws. So the type routes to `rangeArea` (NOT stacked `area`: a stacked
      // area's every fill closes to the plot floor) and features/streamgraph
      // supplies the two things a range area has no opinion about: where the
      // baseline goes, and the names written on the bands.
      //
      // `chart.stacked` would fight the range pathway — the stacking IS the
      // transform's job here — so it is forced off.
      opts.chart.stacked = false
      // The form has no zero line and no axis to read against, so an axis of
      // stacking offsets would be actively misleading. Set only when the user
      // has not chosen otherwise.
      opts.yaxis = opts.yaxis || {}
      if (!Array.isArray(opts.yaxis) && opts.yaxis.show == null) {
        opts.yaxis.show = false
      }
      opts.chart.type = 'rangeArea'
    } else if (requested === 'histogram') {
      // `histogram` renders through the bar pathway: the raw observations are
      // binned in Data.binHistogramData into one column per bin. The x-axis
      // carries bin midpoints, so it must be numeric rather than categorical
      // (a category axis would space unequal bins evenly and lie about the
      // distribution). Set only when the user has not chosen otherwise.
      opts.xaxis = opts.xaxis || {}
      if (opts.xaxis.type == null) {
        opts.xaxis.type = 'numeric'
      }
      opts.chart.type = 'bar'
    } else if (requested === 'raincloud') {
      // A raincloud is a violin taken apart: half the density curve (the
      // cloud), the five-number box beside it, the raw observations jittered
      // on the other side (the rain). Every layer is a violin renderer
      // capability, so the type routes to `violin`; features/raincloud
      // supplies the statistics and Defaults.raincloud() flips the layout
      // presets (kept out of here so each stays user-overridable).
      opts.chart.type = 'violin'
    }
    return opts
  }

  /**
   * @param {string} chartType
   * @param {Record<string, any>} chartDefaults
   * @param {Record<string, any>} opts
   */
  checkForCatToNumericXAxis(chartType, chartDefaults, opts) {
    const defaults = new Defaults(opts)

    const isBarHorizontal =
      (chartType === 'bar' ||
        chartType === 'boxPlot' ||
        chartType === 'violin') &&
      opts.plotOptions?.bar?.horizontal

    const unsupportedZoom =
      chartType === 'pie' ||
      chartType === 'polarArea' ||
      chartType === 'donut' ||
      chartType === 'radar' ||
      chartType === 'radialBar' ||
      chartType === 'heatmap' ||
      chartType === 'unit' ||
      chartType === 'sunburst'

    const notNumericXAxis =
      opts.xaxis.type !== 'datetime' && opts.xaxis.type !== 'numeric'

    // Scatter jitter (strip plots) owns its own numeric band axis in
    // Data.expandScatterJitterData, so the auto category→numeric conversion
    // (and its default floor-based label formatter) must not run for it.
    const isScatterJitter =
      (chartType === 'scatter' || chartType === 'bubble') &&
      opts.plotOptions?.scatter?.jitter?.enabled

    const tickPlacement = opts.xaxis.tickPlacement
      ? opts.xaxis.tickPlacement
      : chartDefaults.xaxis && chartDefaults.xaxis.tickPlacement
    if (
      !isBarHorizontal &&
      !unsupportedZoom &&
      !isScatterJitter &&
      notNumericXAxis &&
      tickPlacement !== 'between'
    ) {
      opts = defaults.convertCatToNumeric(opts)
    }

    return opts
  }

  /**
   * @param {Record<string, any>} opts
   * @param {import('../../types/internal').ChartStateW} [w]
   */
  extendYAxis(opts, w) {
    const options = new Options()

    if (
      typeof opts.yaxis === 'undefined' ||
      !opts.yaxis ||
      (Array.isArray(opts.yaxis) && opts.yaxis.length === 0)
    ) {
      opts.yaxis = {}
    }

    // extend global yaxis config (only if object is provided / not an array)
    const globalApex = Environment.getApex()
    if (
      opts.yaxis.constructor !== Array &&
      globalApex.yaxis &&
      globalApex.yaxis.constructor !== Array
    ) {
      opts.yaxis = Utils.extend(opts.yaxis, globalApex.yaxis)
    }

    // as we can't extend nested object's array with extend, we need to do it first
    // user can provide either an array or object in yaxis config
    if (opts.yaxis.constructor !== Array) {
      // convert the yaxis to array if user supplied object
      opts.yaxis = [Utils.extend(options.yAxis, opts.yaxis)]
    } else {
      opts.yaxis = Utils.extendArray(opts.yaxis, options.yAxis)
    }

    let isLogY = false
    /**
     * @param {number} y
     */
    opts.yaxis.forEach((/** @type {any} */ y) => {
      if (y.logarithmic) {
        isLogY = true
      }
    })

    let series = opts.series
    if (w && !series) {
      series = w.config.series
    }

    // A logarithmic chart works correctly when each series has a corresponding y-axis
    // If this is not the case, we manually create yaxis for multi-series log chart
    if (isLogY && series.length !== opts.yaxis.length && series.length) {
      /**
       * @param {Record<string, any>} s
       * @param {number} i
       */
      opts.yaxis = series.map((/** @type {any} */ s, /** @type {any} */ i) => {
        if (!s.name) {
          series[i].name = `series-${i + 1}`
        }
        if (opts.yaxis[i]) {
          opts.yaxis[i].seriesName = series[i].name
          return opts.yaxis[i]
        } else {
          const newYaxis = Utils.extend(options.yAxis, opts.yaxis[0])
          newYaxis.show = false
          return newYaxis
        }
      })
    }

    if (isLogY && series.length > 1 && series.length !== opts.yaxis.length) {
      console.warn(
        'A multi-series logarithmic chart should have equal number of series and y-axes',
      )
    }
    return opts
  }

  // annotations also accepts array, so we need to extend them manually
  /**
   * @param {Record<string, any>} opts
   */
  extendAnnotations(opts) {
    if (typeof opts.annotations === 'undefined') {
      opts.annotations = {}
      opts.annotations.yaxis = []
      opts.annotations.xaxis = []
      opts.annotations.points = []
    }

    opts = this.extendYAxisAnnotations(opts)
    opts = this.extendXAxisAnnotations(opts)
    opts = this.extendPointAnnotations(opts)

    return opts
  }

  /**
   * @param {Record<string, any>} opts
   */
  extendYAxisAnnotations(opts) {
    const options = new Options()

    opts.annotations.yaxis = Utils.extendArray(
      typeof opts.annotations.yaxis !== 'undefined'
        ? opts.annotations.yaxis
        : [],
      options.yAxisAnnotation,
    )
    return opts
  }

  /**
   * @param {Record<string, any>} opts
   */
  extendXAxisAnnotations(opts) {
    const options = new Options()

    opts.annotations.xaxis = Utils.extendArray(
      typeof opts.annotations.xaxis !== 'undefined'
        ? opts.annotations.xaxis
        : [],
      options.xAxisAnnotation,
    )
    return opts
  }
  /**
   * @param {Record<string, any>} opts
   */
  extendPointAnnotations(opts) {
    const options = new Options()

    opts.annotations.points = Utils.extendArray(
      typeof opts.annotations.points !== 'undefined'
        ? opts.annotations.points
        : [],
      options.pointAnnotation,
    )
    return opts
  }

  /**
   * @param {Record<string, any>} opts
   */
  checkForDarkTheme(opts) {
    if (opts.theme && opts.theme.mode === 'dark') {
      if (!opts.tooltip) {
        opts.tooltip = {}
      }
      if (opts.tooltip.theme !== 'light') {
        opts.tooltip.theme = 'dark'
      }

      if (!opts.chart.foreColor) {
        opts.chart.foreColor = '#f6f7f8'
      }

      if (!opts.theme.palette) {
        opts.theme.palette = 'palette4'
      }
    }
  }

  /**
   * @param {any} opts
   */
  handleUserInputErrors(opts) {
    const config = opts
    // conflicting tooltip option. intersect makes sure to focus on 1 point at a time. Shared cannot be used along with it
    if (config.tooltip.shared && config.tooltip.intersect) {
      throw new Error(
        'tooltip.shared cannot be enabled when tooltip.intersect is true. Turn off any other option by setting it to false.',
      )
    }

    if (config.chart.type === 'bar' && config.plotOptions.bar.horizontal) {
      // No multiple yaxis for bars
      if (config.yaxis.length > 1) {
        throw new Error(
          'Multiple Y Axis for bars are not supported. Switch to column chart by setting plotOptions.bar.horizontal=false',
        )
      }

      // if yaxis is reversed in horizontal bar chart, you should draw the y-axis on right side
      if (config.yaxis[0].reversed) {
        config.yaxis[0].opposite = true
      }

      config.xaxis.tooltip.enabled = false // no xaxis tooltip for horizontal bar
      config.yaxis[0].tooltip.enabled = false // no xaxis tooltip for horizontal bar
      config.chart.zoom.enabled = false // no zooming for horz bars
    }

    if (config.chart.type === 'bar' || config.chart.type === 'rangeBar') {
      if (config.tooltip.shared) {
        if (
          config.xaxis.crosshairs.width === 'barWidth' &&
          config.series.length > 1
        ) {
          config.xaxis.crosshairs.width = 'tickWidth'
        }
      }
    }

    if (
      config.chart.type === 'candlestick' ||
      config.chart.type === 'boxPlot'
    ) {
      if (config.yaxis[0].reversed) {
        console.warn(
          `Reversed y-axis in ${config.chart.type} chart is not supported.`,
        )
        config.yaxis[0].reversed = false
      }
    }

    return config
  }
}
