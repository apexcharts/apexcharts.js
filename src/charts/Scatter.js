import Animations from '../modules/Animations'
import Fill from '../modules/Fill'
import Filters from '../modules/Filters'
import Graphics from '../modules/Graphics'
import Markers from '../modules/Markers'

/**
 * ApexCharts Scatter Class.
 * This Class also handles bubbles chart as currently there is no major difference in drawing them,
 * @module Scatter
 **/
export default class Scatter {
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    this.initialAnim = this.w.config.chart.animations.enabled

    this.anim = new Animations(this.w)
    this.filters = new Filters(this.w)
    this.fill = new Fill(this.w)
    this.markers = new Markers(this.w, this.ctx)
    this.graphics = new Graphics(this.w)
  }

  draw(elSeries, j, opts) {
    const w = this.w

    const graphics = this.graphics

    const realIndex = opts.realIndex
    const pointsPos = opts.pointsPos
    const zRatio = opts.zRatio
    const elPointsMain = opts.elParent

    const elPointsWrap = graphics.group({
      class: `apexcharts-series-markers apexcharts-series-${w.config.chart.type}`,
    })

    elPointsWrap.attr('clip-path', `url(#gridRectMarkerMask${w.globals.cuid})`)

    // Set up event delegation once on the group instead of per-point listeners
    this.markers.setupMarkerDelegation(elPointsWrap)

    if (Array.isArray(pointsPos.x)) {
      for (let q = 0; q < pointsPos.x.length; q++) {
        let dataPointIndex = j + 1
        let shouldDraw = true

        // a small hack as we have 2 points for the first val to connect it
        if (j === 0 && q === 0) dataPointIndex = 0
        if (j === 0 && q === 1) dataPointIndex = 1

        let radius = w.globals.markers.size[realIndex]

        if (zRatio !== Infinity) {
          // means we have a bubble
          const bubble = w.config.plotOptions.bubble
          radius = w.globals.seriesZ[realIndex][dataPointIndex]

          if (bubble.zScaling) {
            radius /= zRatio
          }

          if (bubble.minBubbleRadius && radius < bubble.minBubbleRadius) {
            radius = bubble.minBubbleRadius
          }

          if (bubble.maxBubbleRadius && radius > bubble.maxBubbleRadius) {
            radius = bubble.maxBubbleRadius
          }
        }

        const x = pointsPos.x[q]
        const y = pointsPos.y[q]

        radius = radius || 0

        if (
          y === null ||
          typeof w.globals.series[realIndex][dataPointIndex] === 'undefined'
        ) {
          shouldDraw = false
        }

        if (shouldDraw) {
          const point = this.drawPoint(
            x,
            y,
            radius,
            realIndex,
            dataPointIndex,
            j
          )
          elPointsWrap.add(point)
        }

        elPointsMain.add(elPointsWrap)
      }
    }
  }

  drawPoint(x, y, radius, realIndex, dataPointIndex, j) {
    const w = this.w

    const i = realIndex
    const anim = this.anim
    const filters = this.filters
    const fill = this.fill
    const markers = this.markers
    const graphics = this.graphics

    const markerConfig = markers.getMarkerConfig({
      cssClass: 'apexcharts-marker',
      seriesIndex: i,
      dataPointIndex,
      radius:
        w.config.chart.type === 'bubble' ||
        (w.globals.comboCharts &&
          w.config.series[realIndex] &&
          w.config.series[realIndex].type === 'bubble')
          ? radius
          : null,
    })

    let pathFillCircle = fill.fillPath({
      seriesNumber: realIndex,
      dataPointIndex,
      color: markerConfig.pointFillColor,
      patternUnits: 'objectBoundingBox',
      value: w.globals.series[realIndex][j],
    })

    const el = graphics.drawMarker(x, y, markerConfig)

    if (w.config.series[i].data[dataPointIndex]) {
      if (w.config.series[i].data[dataPointIndex].fillColor) {
        pathFillCircle = w.config.series[i].data[dataPointIndex].fillColor
      }
    }

    el.attr({
      fill: pathFillCircle,
    })

    if (w.config.chart.dropShadow.enabled) {
      const dropShadow = w.config.chart.dropShadow
      filters.dropShadow(el, dropShadow, realIndex)
    }

    if (this.initialAnim && !w.globals.dataChanged && !w.globals.resized) {
      const speed = w.config.chart.animations.speed

      anim.animateMarker(el, speed, w.globals.easing, () => {
        window.setTimeout(() => {
          anim.animationCompleted(el)
        }, 100)
      })
    } else {
      w.globals.animationEnded = true
    }

    el.attr({
      rel: dataPointIndex,
      j: dataPointIndex,
      index: realIndex,
      'default-marker-size': markerConfig.pSize,
    })

    filters.setSelectionFilter(el, realIndex, dataPointIndex)

    el.node.classList.add('apexcharts-marker')

    return el
  }

  centerTextInBubble(y) {
    const w = this.w
    y = y + parseInt(w.config.dataLabels.style.fontSize, 10) / 4

    return {
      y,
    }
  }
}
