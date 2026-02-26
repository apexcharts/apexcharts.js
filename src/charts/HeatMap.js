import Animations from '../modules/Animations'
import Graphics from '../modules/Graphics'
import Fill from '../modules/Fill'
import Series from '../modules/Series'
import Utils from '../utils/Utils'
import Helpers from './common/treemap/Helpers'
import Filters from '../modules/Filters'

/**
 * ApexCharts HeatMap Class.
 * @module HeatMap
 **/

export default class HeatMap {
  constructor(w, ctx, xyRatios) {
    this.ctx = ctx
    this.w = w

    this.xRatio = xyRatios.xRatio
    this.yRatio = xyRatios.yRatio

    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation

    this.helpers = new Helpers(w, ctx)
    this.rectRadius = this.w.config.plotOptions.heatmap.radius
    this.strokeWidth = this.w.config.stroke.show
      ? this.w.config.stroke.width
      : 0
  }

  draw(series) {
    const w = this.w
    const graphics = new Graphics(this.w)

    const ret = graphics.group({
      class: 'apexcharts-heatmap',
    })

    ret.attr('clip-path', `url(#gridRectMask${w.globals.cuid})`)

    // width divided into equal parts
    const xDivision = w.globals.gridWidth / w.globals.dataPoints
    const yDivision = w.globals.gridHeight / w.globals.series.length

    let y1 = 0
    let rev = false

    this.negRange = this.helpers.checkColorRange()

    const heatSeries = series.slice()

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
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-heatmap-series`,
        seriesName: Utils.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        'data:realIndex': i,
      })
      Series.addCollapsedClassToSeries(this.w, elSeries, i)

      // Set up event delegation once per series group instead of per-cell listeners
      graphics.setupEventDelegation(elSeries, '.apexcharts-heatmap-rect')

      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow
        const filters = new Filters(this.w)
        filters.dropShadow(elSeries, shadow, i)
      }

      let x1 = 0
      const shadeIntensity = w.config.plotOptions.heatmap.shadeIntensity

      let j = 0
      for (let dIndex = 0; dIndex < w.globals.dataPoints; dIndex++) {
        // Recognize gaps and align values based on x axis

        if (w.globals.seriesX.length && !w.globals.allSeriesHasEqualX) {
          if (
            w.globals.minX + w.globals.minXDiff * dIndex <
            w.globals.seriesX[i][j]
          ) {
            x1 = x1 + xDivision
            continue
          }
        }

        // Stop loop if index is out of array length
        if (j >= heatSeries[i].length) break

        const heatColor = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j,
          this.negRange
        )
        let color = heatColor.color
        const heatColorProps = heatColor.colorProps

        if (w.config.fill.type === 'image') {
          const fill = new Fill(this.w)

          color = fill.fillPath({
            seriesNumber: i,
            dataPointIndex: j,
            opacity: w.globals.hasNegs
              ? heatColorProps.percent < 0
                ? 1 - (1 + heatColorProps.percent / 100)
                : shadeIntensity + heatColorProps.percent / 100
              : heatColorProps.percent / 100,
            patternID: Utils.randomId(),
            width: w.config.fill.image.width
              ? w.config.fill.image.width
              : xDivision,
            height: w.config.fill.image.height
              ? w.config.fill.image.height
              : yDivision,
          })
        }

        const radius = this.rectRadius

        const rect = graphics.drawRect(x1, y1, xDivision, yDivision, radius)
        rect.attr({
          cx: x1,
          cy: y1,
        })
        rect.node.classList.add('apexcharts-heatmap-rect')
        elSeries.add(rect)

        rect.attr({
          fill: color,
          i,
          index: i,
          j,
          val: series[i][j],
          'stroke-width': this.strokeWidth,
          stroke: w.config.plotOptions.heatmap.useFillColorAsStroke
            ? color
            : w.globals.stroke.colors[0],
          color,
        })

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

        const formatter = w.config.dataLabels.formatter
        const formattedText = formatter(w.globals.series[i][j], {
          value: w.globals.series[i][j],
          seriesIndex: i,
          dataPointIndex: j,
          w,
        })

        const dataLabels = this.helpers.calculateDataLabels({
          text: formattedText,
          x: x1 + xDivision / 2,
          y: y1 + yDivision / 2,
          i,
          j,
          colorProps: heatColorProps,
          series: heatSeries,
        })
        if (dataLabels !== null) {
          elSeries.add(dataLabels)
        }

        x1 = x1 + xDivision
        j++
      }

      y1 = y1 + yDivision

      ret.add(elSeries)
    }

    // adjust yaxis labels for heatmap
    const yAxisScale = w.globals.yAxisScale[0].result.slice()
    if (w.config.yaxis[0].reversed) {
      yAxisScale.unshift('')
    } else {
      yAxisScale.push('')
    }
    w.globals.yAxisScale[0].result = yAxisScale

    return ret
  }

  animateHeatMap(el, x, y, width, height, speed) {
    const animations = new Animations(this.w)
    animations.animateRect(
      el,
      {
        x: x + width / 2,
        y: y + height / 2,
        width: 0,
        height: 0,
      },
      {
        x,
        y,
        width,
        height,
      },
      speed,
      () => {
        animations.animationCompleted(el)
      }
    )
  }

  animateHeatColor(el, colorFrom, colorTo, speed) {
    el.attr({
      fill: colorFrom,
    })
      .animate(speed)
      .attr({
        fill: colorTo,
      })
  }
}
