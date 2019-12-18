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
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    this.initialAnim = this.w.config.chart.animations.enabled
    this.dynamicAnim =
      this.initialAnim &&
      this.w.config.chart.animations.dynamicAnimation.enabled
  }

  draw(elSeries, j, opts) {
    let w = this.w

    let graphics = new Graphics(this.ctx)

    let realIndex = opts.realIndex
    let pointsPos = opts.pointsPos
    let zRatio = opts.zRatio
    let elPointsMain = opts.elParent

    let elPointsWrap = graphics.group({
      class: `apexcharts-series-markers apexcharts-series-${
        w.config.chart.type
      }`
    })

    elPointsWrap.attr('clip-path', `url(#gridRectMarkerMask${w.globals.cuid})`)

    if (pointsPos.x instanceof Array) {
      for (let q = 0; q < pointsPos.x.length; q++) {
        let dataPointIndex = j + 1
        let shouldDraw = true

        // a small hack as we have 2 points for the first val to connect it
        if (j === 0 && q === 0) dataPointIndex = 0
        if (j === 0 && q === 1) dataPointIndex = 1

        let radius = 0
        let finishRadius = w.globals.markers.size[realIndex]

        if (zRatio !== Infinity) {
          // means we have a bubble
          finishRadius = w.globals.seriesZ[realIndex][dataPointIndex] / zRatio

          const bubble = w.config.plotOptions.bubble
          if (bubble.minBubbleRadius && finishRadius < bubble.minBubbleRadius) {
            finishRadius = bubble.minBubbleRadius
          }

          if (bubble.maxBubbleRadius && finishRadius > bubble.maxBubbleRadius) {
            finishRadius = bubble.maxBubbleRadius
          }
        }

        if (!w.config.chart.animations.enabled) {
          radius = finishRadius
        }

        let x = pointsPos.x[q]
        let y = pointsPos.y[q]

        radius = radius || 0

        if (
          y === null ||
          typeof w.globals.series[realIndex][dataPointIndex] === 'undefined'
        ) {
          shouldDraw = false
        }

        if (shouldDraw) {
          const circle = this.drawPoint(
            x,
            y,
            radius,
            finishRadius,
            realIndex,
            dataPointIndex,
            j
          )
          elPointsWrap.add(circle)
        }

        elPointsMain.add(elPointsWrap)
      }
    }
  }

  drawPoint(x, y, radius, finishRadius, realIndex, dataPointIndex, j) {
    const w = this.w

    let i = realIndex
    let anim = new Animations(this.ctx)
    let filters = new Filters(this.ctx)
    let fill = new Fill(this.ctx)
    let markers = new Markers(this.ctx)
    const graphics = new Graphics(this.ctx)

    const markerConfig = markers.getMarkerConfig('apexcharts-marker', i)

    let pathFillCircle = fill.fillPath({
      seriesNumber: realIndex,
      patternUnits: 'objectBoundingBox',
      value: w.globals.series[realIndex][j]
    })
    let circle = graphics.drawCircle(radius)

    if (w.config.series[i].data[dataPointIndex]) {
      if (w.config.series[i].data[dataPointIndex].fillColor) {
        pathFillCircle = w.config.series[i].data[dataPointIndex].fillColor
      }
    }

    circle.attr({
      cx: x,
      cy: y,
      fill: pathFillCircle,
      stroke: markerConfig.pointStrokeColor,
      'stroke-width': markerConfig.pWidth
    })

    if (w.config.chart.dropShadow.enabled) {
      const dropShadow = w.config.chart.dropShadow
      filters.dropShadow(circle, dropShadow, realIndex)
    }

    if (this.initialAnim && !w.globals.dataChanged) {
      let speed = 1
      if (!w.globals.resized) {
        speed = w.config.chart.animations.speed
      }
      anim.animateCircleRadius(circle, 0, finishRadius, speed, w.globals.easing)
    }

    if (w.globals.dataChanged) {
      if (this.dynamicAnim) {
        let speed = w.config.chart.animations.dynamicAnimation.speed
        let prevX, prevY, prevR

        let prevPathJ = null

        prevPathJ =
          w.globals.previousPaths[realIndex] &&
          w.globals.previousPaths[realIndex][j]

        if (typeof prevPathJ !== 'undefined' && prevPathJ !== null) {
          // series containing less elements will ignore these values and revert to 0
          prevX = prevPathJ.x
          prevY = prevPathJ.y
          prevR =
            typeof prevPathJ.r !== 'undefined' ? prevPathJ.r : finishRadius
        }

        for (let cs = 0; cs < w.globals.collapsedSeries.length; cs++) {
          if (w.globals.collapsedSeries[cs].index === realIndex) {
            speed = 1
            finishRadius = 0
          }
        }

        if (x === 0 && y === 0) finishRadius = 0

        anim.animateCircle(
          circle,
          {
            cx: prevX,
            cy: prevY,
            r: prevR
          },
          {
            cx: x,
            cy: y,
            r: finishRadius
          },
          speed,
          w.globals.easing
        )
      } else {
        circle.attr({
          r: finishRadius
        })
      }
    }

    circle.attr({
      rel: dataPointIndex,
      j: dataPointIndex,
      index: realIndex,
      'default-marker-size': finishRadius
    })

    filters.setSelectionFilter(circle, realIndex, dataPointIndex)
    markers.addEvents(circle)

    circle.node.classList.add('apexcharts-marker')

    return circle
  }

  centerTextInBubble(y) {
    let w = this.w
    y = y + parseInt(w.config.dataLabels.style.fontSize, 10) / 4

    return {
      y
    }
  }
}
