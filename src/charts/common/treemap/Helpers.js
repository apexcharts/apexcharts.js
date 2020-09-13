import Utils from '../../../utils/Utils'

export default class TreemapHelpers {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w
  }

  getShadeColor(chartType, i, j, negRange) {
    const w = this.w

    let colorShadePercent = 1
    let shadeIntensity = w.config.plotOptions[chartType].shadeIntensity

    const colorProps = this.determineColor(chartType, i, j)

    if (w.globals.hasNegs || negRange) {
      if (w.config.plotOptions[chartType].reverseNegativeShade) {
        if (colorProps.percent < 0) {
          colorShadePercent =
            (colorProps.percent / 100) * (shadeIntensity * 1.25)
        } else {
          colorShadePercent =
            (1 - colorProps.percent / 100) * (shadeIntensity * 1.25)
        }
      } else {
        if (colorProps.percent <= 0) {
          colorShadePercent =
            1 - (1 + colorProps.percent / 100) * shadeIntensity
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * shadeIntensity
        }
      }
    } else {
      colorShadePercent =
        (1 - colorProps.percent / 100) * (shadeIntensity * 1.25)
    }

    let color = colorProps.color
    let utils = new Utils()

    if (w.config.plotOptions[chartType].enableShades) {
      if (colorShadePercent < 0) colorShadePercent = 0
      if (this.w.config.theme.mode === 'dark') {
        color = Utils.hexToRgba(
          utils.shadeColor(colorShadePercent * -1, colorProps.color),
          w.config.fill.opacity
        )
      } else {
        color = Utils.hexToRgba(
          utils.shadeColor(colorShadePercent, colorProps.color),
          w.config.fill.opacity
        )
      }
    }

    return { color, colorProps }
  }

  determineColor(chartType, i, j) {
    const w = this.w

    let val = w.globals.series[i][j]

    let chartOpts = w.config.plotOptions[chartType]

    let seriesNumber = chartOpts.colorScale.inverse ? j : i

    const isDistributed = w.config.plotOptions[chartType].distributed
    if (isDistributed) {
      seriesNumber = j
    }

    let color = w.globals.colors[seriesNumber]
    let foreColor = null
    let min = Math.min(...w.globals.series[i])
    let max = Math.max(...w.globals.series[i])

    if (!chartOpts.distributed && chartType === 'heatmap') {
      min = w.globals.minY
      max = w.globals.maxY
    }

    if (typeof chartOpts.colorScale.min !== 'undefined') {
      min =
        chartOpts.colorScale.min < w.globals.minY
          ? chartOpts.colorScale.min
          : w.globals.minY
      max =
        chartOpts.colorScale.max > w.globals.maxY
          ? chartOpts.colorScale.max
          : w.globals.maxY
    }

    let total = Math.abs(max) + Math.abs(min)

    let percent = (100 * val) / (total === 0 ? total - 0.000001 : total)

    if (chartOpts.colorScale.ranges.length > 0) {
      const colorRange = chartOpts.colorScale.ranges
      colorRange.map((range, index) => {
        if (val >= range.from && val <= range.to) {
          color = range.color
          foreColor = range.foreColor ? range.foreColor : null
          min = range.from
          max = range.to
          let rTotal = Math.abs(max) + Math.abs(min)
          percent = (100 * val) / (rTotal === 0 ? rTotal - 0.000001 : rTotal)
        }
      })
    }

    return {
      color,
      foreColor,
      percent
    }
  }
}
