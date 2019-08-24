import DataLabels from '../modules/DataLabels'
import Animations from '../modules/Animations'
import Graphics from '../modules/Graphics'
import Utils from '../utils/Utils'
import Filters from '../modules/Filters'

/**
 * ApexCharts HeatMap Class.
 * @module HeatMap
 **/

export default class HeatMap {
  constructor(ctx, xyRatios) {
    this.ctx = ctx
    this.w = ctx.w

    this.xRatio = xyRatios.xRatio
    this.yRatio = xyRatios.yRatio

    this.negRange = false

    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation

    this.rectRadius = this.w.config.plotOptions.heatmap.radius
    this.strokeWidth = this.w.config.stroke.width
  }

  draw(series) {
    let w = this.w
    const graphics = new Graphics(this.ctx)

    let ret = graphics.group({
      class: 'apexcharts-heatmap'
    })

    ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    // width divided into equal parts
    let xDivision = w.globals.gridWidth / w.globals.dataPoints
    let yDivision = w.globals.gridHeight / w.globals.series.length

    let y1 = 0
    let rev = false

    this.checkColorRange()

    let heatSeries = series.slice()
    if (w.config.yaxis[0].reversed) {
      rev = true
      heatSeries.reverse()
    }

    for (
      let i = rev ? 0 : heatSeries.length - 1;
      rev ? i < heatSeries.length : i >= 0;
      rev ? i++ : i--
    ) {
      // el to which series will be drawn
      let elSeries = graphics.group({
        class: `apexcharts-series apexcharts-heatmap-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i
      })

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        const filters = new Filters(this.ctx)
        filters.dropShadow(elSeries, shadow, i)
      }

      let x1 = 0

      for (let j = 0; j < heatSeries[i].length; j++) {
        let colorShadePercent = 1

        const heatColorProps = this.determineHeatColor(i, j)

        if (w.globals.hasNegs || this.negRange) {
          let shadeIntensity = w.config.plotOptions.heatmap.shadeIntensity

          if (w.config.plotOptions.heatmap.reverseNegativeShade) {
            if (heatColorProps.percent < 0) {
              colorShadePercent =
                (heatColorProps.percent / 100) * (shadeIntensity * 1.25)
            } else {
              colorShadePercent =
                (1 - heatColorProps.percent / 100) * (shadeIntensity * 1.25)
            }
          } else {
            if (heatColorProps.percent < 0) {
              colorShadePercent =
                1 - (1 + heatColorProps.percent / 100) * shadeIntensity
            } else {
              colorShadePercent =
                (1 - heatColorProps.percent / 100) * shadeIntensity
            }
          }
        } else {
          colorShadePercent = 1 - heatColorProps.percent / 100
        }

        let color = heatColorProps.color

        if (w.config.plotOptions.heatmap.enableShades) {
          let utils = new Utils()
          color = Utils.hexToRgba(
            utils.shadeColor(colorShadePercent, heatColorProps.color),
            w.config.fill.opacity
          )
        }

        let radius = this.rectRadius

        let rect = graphics.drawRect(x1, y1, xDivision, yDivision, radius)
        rect.attr({
          cx: x1,
          cy: y1
        })

        rect.node.classList.add('apexcharts-heatmap-rect')
        elSeries.add(rect)

        rect.attr({
          fill: color,
          i,
          index: i,
          j,
          val: heatSeries[i][j],
          'stroke-width': this.strokeWidth,
          stroke: w.globals.stroke.colors[0],
          color: color
        })

        rect.node.addEventListener(
          'mouseenter',
          graphics.pathMouseEnter.bind(this, rect)
        )
        rect.node.addEventListener(
          'mouseleave',
          graphics.pathMouseLeave.bind(this, rect)
        )
        rect.node.addEventListener(
          'mousedown',
          graphics.pathMouseDown.bind(this, rect)
        )

        if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed
          }
          this.animateHeatMap(rect, x1, y1, xDivision, yDivision, speed)
        }

        if (w.globals.dataChanged) {
          let speed = 1
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed

            let colorFrom =
              w.globals.previousPaths[i] &&
              w.globals.previousPaths[i][j] &&
              w.globals.previousPaths[i][j].color

            if (!colorFrom) colorFrom = 'rgba(255, 255, 255, 0)'

            this.animateHeatColor(
              rect,
              Utils.isColorHex(colorFrom)
                ? colorFrom
                : Utils.rgb2hex(colorFrom),
              Utils.isColorHex(color) ? color : Utils.rgb2hex(color),
              speed
            )
          }
        }

        let dataLabels = this.calculateHeatmapDataLabels({
          x: x1,
          y: y1,
          i,
          j,
          series: heatSeries,
          rectHeight: yDivision,
          rectWidth: xDivision
        })
        if (dataLabels !== null) {
          elSeries.add(dataLabels)
        }

        x1 = x1 + xDivision
      }

      y1 = y1 + yDivision

      ret.add(elSeries)
    }

    // adjust yaxis labels for heatmap
    let yAxisScale = w.globals.yAxisScale[0].result.slice()
    if (w.config.yaxis[0].reversed) {
      yAxisScale.unshift('')
    } else {
      yAxisScale.push('')
    }
    w.globals.yAxisScale[0].result = yAxisScale
    let divisor = w.globals.gridHeight / w.globals.series.length
    w.config.yaxis[0].labels.offsetY = -(divisor / 2)

    return ret
  }

  checkColorRange() {
    const w = this.w

    let heatmap = w.config.plotOptions.heatmap

    if (heatmap.colorScale.ranges.length > 0) {
      heatmap.colorScale.ranges.map((range, index) => {
        if (range.from < 0) {
          this.negRange = true
        }
      })
    }
  }

  determineHeatColor(i, j) {
    const w = this.w

    let val = w.globals.series[i][j]

    let heatmap = w.config.plotOptions.heatmap

    let seriesNumber = heatmap.colorScale.inverse ? j : i

    let color = w.globals.colors[seriesNumber]
    let min = Math.min(...w.globals.series[i])
    let max = Math.max(...w.globals.series[i])

    if (!heatmap.distributed) {
      min = w.globals.minY
      max = w.globals.maxY
    }

    if (typeof heatmap.colorScale.min !== 'undefined') {
      min =
        heatmap.colorScale.min < w.globals.minY
          ? heatmap.colorScale.min
          : w.globals.minY
      max =
        heatmap.colorScale.max > w.globals.maxY
          ? heatmap.colorScale.max
          : w.globals.maxY
    }

    let total = Math.abs(max) + Math.abs(min)
    let percent = (100 * val) / (total === 0 ? total - 0.000001 : total)

    if (heatmap.colorScale.ranges.length > 0) {
      const colorRange = heatmap.colorScale.ranges
      colorRange.map((range, index) => {
        if (val >= range.from && val <= range.to) {
          color = range.color
          min = range.from
          max = range.to
          let total = Math.abs(max) + Math.abs(min)
          percent = (100 * val) / (total === 0 ? total - 0.000001 : total)
        }
      })
    }

    return {
      color,
      percent
    }
  }

  calculateHeatmapDataLabels({ x, y, i, j, series, rectHeight, rectWidth }) {
    let w = this.w
    // let graphics = new Graphics(this.ctx)
    let dataLabelsConfig = w.config.dataLabels

    const graphics = new Graphics(this.ctx)

    let dataLabels = new DataLabels(this.ctx)
    let formatter = dataLabelsConfig.formatter

    let elDataLabelsWrap = null

    if (dataLabelsConfig.enabled) {
      elDataLabelsWrap = graphics.group({
        class: 'apexcharts-data-labels'
      })

      const offX = dataLabelsConfig.offsetX
      const offY = dataLabelsConfig.offsetY

      let dataLabelsX = x + rectWidth / 2 + offX
      let dataLabelsY =
        y +
        rectHeight / 2 +
        parseInt(dataLabelsConfig.style.fontSize) / 3 +
        offY

      let text = formatter(w.globals.series[i][j], {
        seriesIndex: i,
        dataPointIndex: j,
        w
      })
      dataLabels.plotDataLabelsText({
        x: dataLabelsX,
        y: dataLabelsY,
        text,
        i,
        j,
        parent: elDataLabelsWrap,
        dataLabelsConfig
      })
    }

    return elDataLabelsWrap
  }

  animateHeatMap(el, x, y, width, height, speed) {
    const animations = new Animations(this.ctx)
    animations.animateRect(
      el,
      {
        x: x + width / 2,
        y: y + height / 2,
        width: 0,
        height: 0
      },
      {
        x,
        y,
        width,
        height
      },
      speed,
      () => {
        animations.animationCompleted()
      }
    )
  }

  animateHeatColor(el, colorFrom, colorTo, speed) {
    el.attr({
      fill: colorFrom
    })
      .animate(speed)
      .attr({
        fill: colorTo
      })
  }
}
