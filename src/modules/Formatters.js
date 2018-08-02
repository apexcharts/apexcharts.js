import DateTime from '../utils/DateTime'
import Utils from '../utils/Utils'

/**
 * ApexCharts Formatter Class for setting value formatters for axes as well as tooltips.
 *
 * @module Formatters
 **/

class Formatters {
  constructor (ctx) {
    this.ctx = ctx
    this.w = ctx.w
    this.tooltipKeyFormat = 'dd MMM'
  }

  // xLabelFormat is the formatter function which is used
  xLabelFormat (fn, val) {
    let w = this.w

    // if datetime series
    if (w.config.xaxis.type === 'datetime') {
      // if user has not specified a custom formatter, use the
      if (w.config.tooltip.x.formatter === undefined) {
        let datetimeObj = new DateTime(this.ctx)
        return datetimeObj.formatDate(new Date(val), w.config.tooltip.x.format)
      }
    }

    return fn(val)
  }

  setLabelFormatters () {
    let w = this.w

    w.globals.xLabelFormatter = function (val, opts) {
      return val
    }

    // this is commented for now, can be give as a customization to user later
    // w.globals.xaxisTooltipLabelFormatter = function (val) {
    //   return val
    // }

    w.globals.ttKeyFormatter = function (val, opts) {
      return val
    }

    w.globals.ttZFormatter = function (val, opts) {
      return val
    }

    w.globals.legendFormatter = function (val, opts) {
      return val
    }

    if (w.config.tooltip.x.formatter !== undefined) {
      w.globals.ttKeyFormatter = w.config.tooltip.x.formatter
    }

    if (w.config.tooltip.y.formatter !== undefined) {
      w.globals.ttValFormatter = w.config.tooltip.y.formatter
    }

    if (w.config.tooltip.z.formatter !== undefined) {
      w.globals.ttZFormatter = w.config.tooltip.z.formatter
    }

    // legend formatter - if user wants to append any global values of series to legend text
    if (w.config.legend.formatter !== undefined) {
      w.globals.legendFormatter = w.config.legend.formatter
    }

    // formatter function will always overwrite format property
    if (w.config.xaxis.labels.formatter !== undefined) {
      w.globals.xLabelFormatter = w.config.xaxis.labels.formatter
    } else {
      w.globals.xLabelFormatter = function (val) {
        if (Utils.isNumber(val)) {
          return val.toFixed(0)
        }
        return val
      }
    }

    // formatter function will always overwrite format property
    w.config.yaxis.map((yaxe, i) => {
      if (yaxe.labels.formatter !== undefined) {
        w.globals.yLabelFormatters[i] = yaxe.labels.formatter
      } else {
        w.globals.yLabelFormatters[i] = function (val) {
          if (Utils.isNumber(val)) {
            return val.toFixed(w.globals.yValueDecimal)
          }
          return val
        }
      }
    })
  }
}

export default Formatters
