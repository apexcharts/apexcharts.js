import Defaults from './Defaults'
import Utils from './../../utils/Utils'
import CoreUtils from '../CoreUtils'
import Options from './Options'

/**
 * ApexCharts Config Class for extending user options with pre-defined ApexCharts config.
 *
 * @module Config
 **/
export default class Config {
  constructor(opts) {
    this.opts = opts
  }

  init() {
    let opts = this.opts
    let options = new Options()
    let defaults = new Defaults(opts)

    this.chartType = opts.chart.type

    if (this.chartType === 'histogram') {
      // technically, a histogram can be drawn by a column chart with no spaces in between
      opts.chart.type = 'bar'
      opts = Utils.extend(
        {
          plotOptions: {
            bar: {
              columnWidth: '99.99%'
            }
          }
        },
        opts
      )
    }

    opts.series = this.checkEmptySeries(opts.series)

    opts = this.extendYAxis(opts)
    opts = this.extendAnnotations(opts)

    let config = options.init()
    let newDefaults = {}
    if (opts && typeof opts === 'object') {
      let chartDefaults = {}
      switch (this.chartType) {
        case 'line':
          chartDefaults = defaults.line()
          break
        case 'area':
          chartDefaults = defaults.area()
          break
        case 'bar':
          chartDefaults = defaults.bar()
          break
        case 'candlestick':
          chartDefaults = defaults.candlestick()
          break
        case 'histogram':
          chartDefaults = defaults.bar()
          break
        case 'bubble':
          chartDefaults = defaults.bubble()
          break
        case 'scatter':
          chartDefaults = defaults.scatter()
          break
        case 'heatmap':
          chartDefaults = defaults.heatmap()
          break
        case 'pie':
          chartDefaults = defaults.pie()
          break
        case 'donut':
          chartDefaults = defaults.donut()
          break
        case 'radar':
          chartDefaults = defaults.radar()
          break
        case 'radialBar':
          chartDefaults = defaults.radialBar()
          break
        default:
          chartDefaults = defaults.line()
      }

      if (opts.chart.brush && opts.chart.brush.enabled) {
        chartDefaults = defaults.brush(chartDefaults)
      }

      if (opts.chart.stacked && opts.chart.stackType === '100%') {
        defaults.stacked100()
      }

      // If user has specified a dark theme, make the tooltip dark too
      this.checkForDarkTheme(window.Apex) // check global window Apex options
      this.checkForDarkTheme(opts) // check locally passed options

      opts.xaxis = opts.xaxis || window.Apex.xaxis || {}

      const combo = CoreUtils.checkComboSeries(opts.series)
      if (
        (opts.chart.type === 'line' ||
          opts.chart.type === 'area' ||
          opts.chart.type === 'scatter') &&
        !combo.comboChartsHasBars &&
        opts.xaxis.type !== 'datetime' &&
        opts.xaxis.tickPlacement !== 'between'
      ) {
        opts = Defaults.convertCatToNumeric(opts)
      }
      if (
        (opts.chart.sparkline && opts.chart.sparkline.enabled) ||
        (window.Apex.chart &&
          window.Apex.chart.sparkline &&
          window.Apex.chart.sparkline.enabled)
      ) {
        chartDefaults = defaults.sparkline(chartDefaults)
      }
      newDefaults = Utils.extend(config, chartDefaults)
    }

    // config should cascade in this fashion
    // default-config < global-apex-variable-config < user-defined-config

    // get GLOBALLY defined options and merge with the default config
    let mergedWithDefaultConfig = Utils.extend(newDefaults, window.Apex)

    // get the merged config and extend with user defined config
    config = Utils.extend(mergedWithDefaultConfig, opts)

    // some features are not supported. those mismatches should be handled
    config = this.handleUserInputErrors(config)

    return config
  }

  extendYAxis(opts) {
    let options = new Options()
    if (typeof opts.yaxis === 'undefined') {
      opts.yaxis = {}
    }

    // extend global yaxis config (only if object is provided / not an array)
    if (
      opts.yaxis.constructor !== Array &&
      window.Apex.yaxis &&
      window.Apex.yaxis.constructor !== Array
    ) {
      opts.yaxis = Utils.extend(opts.yaxis, window.Apex.yaxis)
    }

    // as we can't extend nested object's array with extend, we need to do it first
    // user can provide either an array or object in yaxis config
    if (opts.yaxis.constructor !== Array) {
      // convert the yaxis to array if user supplied object
      opts.yaxis = [Utils.extend(options.yAxis, opts.yaxis)]
    } else {
      opts.yaxis = Utils.extendArray(opts.yaxis, options.yAxis)
    }
    return opts
  }

  // annotations also accepts array, so we need to extend them manually
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

  extendYAxisAnnotations(opts) {
    let options = new Options()
    opts.annotations.yaxis = Utils.extendArray(
      typeof opts.annotations.yaxis !== 'undefined'
        ? opts.annotations.yaxis
        : [],
      options.yAxisAnnotation
    )
    return opts
  }

  extendXAxisAnnotations(opts) {
    let options = new Options()
    opts.annotations.xaxis = Utils.extendArray(
      typeof opts.annotations.xaxis !== 'undefined'
        ? opts.annotations.xaxis
        : [],
      options.xAxisAnnotation
    )
    return opts
  }
  extendPointAnnotations(opts) {
    let options = new Options()
    opts.annotations.points = Utils.extendArray(
      typeof opts.annotations.points !== 'undefined'
        ? opts.annotations.points
        : [],
      options.pointAnnotation
    )
    return opts
  }

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

  checkEmptySeries(ser) {
    if (ser.length === 0) {
      return [
        {
          data: []
        }
      ]
    }
    return ser
  }

  handleUserInputErrors(opts) {
    let config = opts
    // conflicting tooltip option. intersect makes sure to focus on 1 point at a time. Shared cannot be used along with it
    if (config.tooltip.shared && config.tooltip.intersect) {
      throw new Error(
        'tooltip.shared cannot be enabled when tooltip.intersect is true. Turn off any other option by setting it to false.'
      )
    }

    if (config.chart.scroller) {
      console.warn(
        'Scroller has been deprecated since v2.0.0. Please remove the configuration for chart.scroller'
      )
    }

    if (config.chart.type === 'bar' && config.plotOptions.bar.horizontal) {
      // No time series for horizontal bars
      if (config.xaxis.type === 'datetime') {
        throw new Error(
          'Timelines on bars are not supported yet. Switch to column chart by setting plotOptions.bar.horizontal=false'
        )
      }

      // No multiple yaxis for bars
      if (config.yaxis.length > 1) {
        throw new Error(
          'Multiple Y Axis for bars are not supported. Switch to column chart by setting plotOptions.bar.horizontal=false'
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

    if (config.chart.type === 'bar') {
      if (config.tooltip.shared) {
        if (
          config.xaxis.crosshairs.width === 'barWidth' &&
          config.series.length > 1
        ) {
          console.warn(
            'crosshairs.width = "barWidth" is only supported in single series, not in a multi-series barChart.'
          )
          config.xaxis.crosshairs.width = 'tickWidth'
        }
        if (config.plotOptions.bar.horizontal) {
          config.states.hover.type = 'none'
        }
        if (!config.tooltip.followCursor) {
          console.warn(
            'followCursor option in shared columns cannot be turned off.'
          )
          config.tooltip.followCursor = true
        }
      }
    }

    if (config.chart.type === 'candlestick') {
      if (config.yaxis[0].reversed) {
        console.warn('Reversed y-axis in candlestick chart is not supported.')
        config.yaxis[0].reversed = false
      }
    }

    if (config.chart.group && config.yaxis[0].labels.minWidth === 0) {
      console.warn(
        'It looks like you have multiple charts in synchronization. You must provide yaxis.labels.minWidth which must be EQUAL for all grouped charts to prevent incorrect behaviour.'
      )
    }

    // if user supplied array for stroke width, it will only be applicable to line/area charts, for any other charts, revert back to Number
    if (Array.isArray(config.stroke.width)) {
      if (config.chart.type !== 'line' && config.chart.type !== 'area') {
        console.warn(
          'stroke.width option accepts array only for line and area charts. Reverted back to Number'
        )
        config.stroke.width = config.stroke.width[0]
      }
    }

    return config
  }
}
