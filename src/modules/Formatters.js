import DateTime from '../utils/DateTime'
import Utils from '../utils/Utils'

/**
 * ApexCharts Formatter Class for setting value formatters for axes as well as tooltips.
 *
 * @module Formatters
 **/

class Formatters {
  constructor(w) {
    this.w = w
    this.tooltipKeyFormat = 'dd MMM'
  }

  xLabelFormat(fn, val, timestamp, _opts) {
    const w = this.w

    if (w.config.xaxis.type === 'datetime') {
      if (w.config.xaxis.labels.formatter === undefined) {
        // if user has not specified a custom formatter, use the default tooltip.x.format
        if (w.config.tooltip.x.formatter === undefined) {
          const datetimeObj = new DateTime(this.w)
          return datetimeObj.formatDate(
            datetimeObj.getDate(val),
            w.config.tooltip.x.format
          )
        }
      }
    }

    return fn(val, timestamp, _opts)
  }

  defaultGeneralFormatter(val) {
    if (Array.isArray(val)) {
      return val.map((v) => {
        return v
      })
    } else {
      return val
    }
  }

  defaultYFormatter(v, yaxe) {
    const w = this.w

    if (Utils.isNumber(v)) {
      if (w.globals.yValueDecimal !== 0) {
        v = v.toFixed(
          yaxe.decimalsInFloat !== undefined
            ? yaxe.decimalsInFloat
            : w.globals.yValueDecimal
        )
      } else {
        // We have an integer value but the label is not an integer. We can
        // deduce this is due to the number of ticks exceeding the even lower
        // integer range. Add an additional decimal place only in this case.
        const f = v.toFixed(0)
        // Do not change the == to ===
        v = v == f ? f : v.toFixed(1)
      }
    }
    return v
  }

  setLabelFormatters() {
    const w = this.w
    const fmt = w.formatters

    fmt.xaxisTooltipFormatter = (val) => {
      return this.defaultGeneralFormatter(val)
    }

    fmt.ttKeyFormatter = (val) => {
      return this.defaultGeneralFormatter(val)
    }

    fmt.ttZFormatter = (val) => {
      return val
    }

    fmt.legendFormatter = (val) => {
      return this.defaultGeneralFormatter(val)
    }

    // formatter function will always overwrite format property
    if (w.config.xaxis.labels.formatter !== undefined) {
      fmt.xLabelFormatter = w.config.xaxis.labels.formatter
    } else {
      fmt.xLabelFormatter = (val) => {
        if (Utils.isNumber(val)) {
          if (
            !w.config.xaxis.convertedCatToNumeric &&
            w.config.xaxis.type === 'numeric'
          ) {
            if (Utils.isNumber(w.config.xaxis.decimalsInFloat)) {
              return val.toFixed(w.config.xaxis.decimalsInFloat)
            } else {
              const diff = w.globals.maxX - w.globals.minX
              if (diff > 0 && diff < 100) {
                return val.toFixed(1)
              }
              return val.toFixed(0)
            }
          }

          if (w.globals.isBarHorizontal) {
            const range = w.globals.maxY - w.globals.minYArr
            if (range < 4) {
              return val.toFixed(1)
            }
          }
          return val.toFixed(0)
        }
        return val
      }
    }

    if (typeof w.config.tooltip.x.formatter === 'function') {
      fmt.ttKeyFormatter = w.config.tooltip.x.formatter
    } else {
      fmt.ttKeyFormatter = fmt.xLabelFormatter
    }

    if (typeof w.config.xaxis.tooltip.formatter === 'function') {
      fmt.xaxisTooltipFormatter = w.config.xaxis.tooltip.formatter
    }

    if (Array.isArray(w.config.tooltip.y)) {
      fmt.ttVal = w.config.tooltip.y
    } else {
      if (w.config.tooltip.y.formatter !== undefined) {
        fmt.ttVal = w.config.tooltip.y
      }
    }

    if (w.config.tooltip.z.formatter !== undefined) {
      fmt.ttZFormatter = w.config.tooltip.z.formatter
    }

    // legend formatter - if user wants to append any global values of series to legend text
    if (w.config.legend.formatter !== undefined) {
      fmt.legendFormatter = w.config.legend.formatter
    }

    // formatter function will always overwrite format property
    fmt.yLabelFormatters = []
    w.config.yaxis.forEach((yaxe, i) => {
      if (yaxe.labels.formatter !== undefined) {
        fmt.yLabelFormatters[i] = yaxe.labels.formatter
      } else {
        fmt.yLabelFormatters[i] = (val) => {
          if (!w.globals.xyCharts) return val

          if (Array.isArray(val)) {
            return val.map((v) => {
              return this.defaultYFormatter(v, yaxe, i)
            })
          } else {
            return this.defaultYFormatter(val, yaxe, i)
          }
        }
      }
    })

    return w.globals
  }

  heatmapLabelFormatters() {
    const w = this.w
    if (w.config.chart.type === 'heatmap') {
      w.globals.yAxisScale[0].result = w.globals.seriesNames.slice()

      //  get the longest string from the labels array and also apply label formatter to it
      const longest = w.globals.seriesNames.reduce(
        (a, b) => (a.length > b.length ? a : b),
        0
      )
      w.globals.yAxisScale[0].niceMax = longest
      w.globals.yAxisScale[0].niceMin = longest
    }
  }
}

export default Formatters
