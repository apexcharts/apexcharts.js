import Defaults from './Defaults'
import Utils from './../../utils/Utils'
import Options, { yAxis, xAxisAnnotation, yAxisAnnotation, pointAnnotation } from './Options'

/**
 * ApexCharts Config Class for extending user options with pre-defined ApexCharts config.
 *
 * @module Config
 **/
class Config {
  constructor (opts) {
    this.opts = opts
  }

  init () {
    let opts = this.opts
    let options = new Options()
    let defaults = new Defaults(opts)

    if (typeof opts.yaxis === 'undefined') {
      opts.yaxis = {}
    }

    this.chartType = opts.chart.type

    if (this.chartType === 'histogram') {
      opts.chart.type = 'bar'
      opts = Utils.extend({
        plotOptions: {
          bar: {
            columnWidth: '99.99%'
          }
        }
      }, opts)
    }

    if (typeof opts.annotations === 'undefined') {
      opts.annotations = {}
      opts.annotations.yaxis = []
      opts.annotations.xaxis = []
    }

    const extendArray = (arrToExtend, resultArr) => {
      let extendedArr = []
      arrToExtend.map((item) => {
        extendedArr.push(Utils.extend(resultArr, item))
      })
      arrToExtend = extendedArr
      return arrToExtend
    }

    // as we can't extend nested object's array with extend, we need to do it first
    // user can provide either an array or object in yaxis config
    if (opts.yaxis.constructor !== Array) {
      // convert the yaxis to array if user supplied object
      opts.yaxis = [Utils.extend(yAxis, opts.yaxis)]
    } else {
      opts.yaxis = extendArray(opts.yaxis, yAxis)
    }

    // annotations also accepts array, so we need to extend them manually
    opts.annotations.xaxis = extendArray(typeof opts.annotations.xaxis !== 'undefined' ? opts.annotations.xaxis : [], xAxisAnnotation)
    opts.annotations.yaxis = extendArray(typeof opts.annotations.yaxis !== 'undefined' ? opts.annotations.yaxis : [], yAxisAnnotation)
    opts.annotations.points = extendArray(typeof opts.annotations.points !== 'undefined' ? opts.annotations.points : [], pointAnnotation)

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
        case 'radialBar':
          chartDefaults = defaults.radialBar()
          break
        default:
          chartDefaults = defaults.line()
      }

      if (opts.chart.stacked && opts.chart.stackType === '100%') {
        defaults.stacked100()
      }
      newDefaults = Utils.extend(config, chartDefaults)
    }

    // config should override in this fashion
    // default config < global apex variable config < user defined config

    // get GLOBALLY defined options and merge with the default config
    let mergedWithDefaultConfig = Utils.extend(newDefaults, window.Apex)

    // get the merged config and extend with user defined config
    config = Utils.extend(mergedWithDefaultConfig, opts)

    // some features are not supported. those mismatches should be handled
    config = this.handleUserInputErrors(config)

    return config
  }

  handleUserInputErrors (opts) {
    let config = opts
    // conflicting tooltip option. intersect makes sure to focus on 1 point at a time. Shared cannot be used along with it
    if (config.tooltip.shared && config.tooltip.intersect) {
      throw new Error('tooltip.shared cannot be enabled when tooltip.intersect is true. Turn off any other option by setting it to false')
    }

    if (config.chart.type === 'bar' && config.plotOptions.bar.horizontal) {
      // No time series for horizontal bars
      if (config.xaxis.type === 'datetime') {
        throw new Error('Timelines on bars are not supported yet. Switch to column chart by setting plotOptions.bar.horizontal=false')
      }

      // No multiple yaxis for bars
      if (config.yaxis.length > 1) {
        throw new Error('Multiple Y Axis for bars are not supported. Switch to column chart by setting plotOptions.bar.horizontal=false')
      }

      config.xaxis.tooltip.enabled = false // no xaxis tooltip for horizontal bar
      config.yaxis[0].tooltip.enabled = false // no xaxis tooltip for horizontal bar
      config.chart.zoom.enabled = false // no zooming for bars
    }

    if (config.chart.type === 'bar') {
      if (config.tooltip.shared) {
        if (config.xaxis.crosshairs.width === 'barWidth' && config.series.length > 1) {
          console.warn('barWidth is only supported in single series, not multi-series barchart')
          config.xaxis.crosshairs.width = 'tickWidth'
        }
        if (config.plotOptions.bar.horizontal) {
          config.states.hover.type = 'none'
        }
        if (!config.tooltip.followCursor) {
          console.warn('followCursor option in shared columns cannot be turned off')
          config.tooltip.followCursor = true
        }
      }
    }

    // if user supplied array for stroke width, it will only be applicable to line/area charts, for any other charts, revert back to Number
    if (Array.isArray(config.stroke.width)) {
      if (config.chart.type !== 'line' && config.chart.type !== 'area') {
        console.warn('stroke.width option accepts array only for line and area charts. Reverted back to Number')
        config.stroke.width = config.stroke.width[0]
      }
    }

    return config
  }
}

module.exports = Config
