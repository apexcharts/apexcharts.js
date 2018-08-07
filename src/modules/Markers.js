import Filters from './Filters'
import Graphics from './Graphics'

/**
 * ApexCharts Markers Class for drawing points on y values in axes charts.
 *
 * @module Markers
 **/

class Markers {
  constructor (ctx, opts) {
    this.ctx = ctx
    this.w = ctx.w
  }

  plotChartMarkers (pointsPos, seriesIndex, j) {
    let w = this.w

    let p = pointsPos
    let elPointsWrap = null

    let graphics = new Graphics(this.ctx)

    let point

    if (w.config.markers.size > 0) {
      elPointsWrap = graphics.group({
        class: 'apexcharts-series-markers'
      })
    }

    if (p.x instanceof Array) {
      for (let q = 0; q < p.x.length; q++) {
        let realIndexP = j

        let PointClasses = 'apexcharts-marker'
        if (((w.config.chart.type === 'line' || w.config.chart.type === 'area') && !w.globals.comboCharts) && !w.config.tooltip.intersect) {
          PointClasses += ' no-pointer-events'
        }

        if (w.config.markers.size > 0) {
          if (p.y[q] !== null) {
            PointClasses += ` w${(Math.random() + 1).toString(36).substring(4)}`
          } else {
            PointClasses = 'apexcharts-nullpoint'
          }

          let opts = this.getMarkerConfig(PointClasses, seriesIndex)
          w.config.markers.discrete.map((marker, mIndex) => {
            if (marker.i === seriesIndex && marker.j === realIndexP) {
              opts.pointStrokeColor = marker.strokeColor
              opts.pointFillColor = marker.fillColor
              opts.size = marker.size
            }
          })

          point = graphics.drawMarker(
            p.x[q],
            p.y[q],
            opts
          )

          // a small hack as we have 2 points for the first val to connect it
          if (j === 1 && q === 0) realIndexP = 0
          if (j === 1 && q === 1) realIndexP = 1

          point.attr('rel', realIndexP)
          point.attr('j', realIndexP)
          point.attr('index', seriesIndex)

          this.setSelectedPointFilter(point, seriesIndex, realIndexP)
          this.addEvents(point)

          elPointsWrap.add(point)
        } else {
          // dynamic array creation - multidimensional
          if (typeof (w.globals.pointsArray[seriesIndex]) === 'undefined') w.globals.pointsArray[seriesIndex] = []

          w.globals.pointsArray[seriesIndex].push([p.x[q], p.y[q]])
        }
      }
    }

    return elPointsWrap
  }

  getMarkerConfig (cssClass, seriesIndex) {
    const w = this.w
    let pStyle = this.getMarkerStyle(seriesIndex)

    const pSize = w.config.markers.size

    return {
      pSize: (pSize instanceof Array ? pSize[seriesIndex] : pSize),
      pRadius: w.config.markers.radius,
      pWidth: w.config.markers.strokeWidth,
      pointStrokeColor: pStyle.pointStrokeColor,
      pointFillColor: pStyle.pointFillColor,
      shape: (w.config.markers.shape instanceof Array ? w.config.markers.shape[seriesIndex] : w.config.markers.shape),
      class: cssClass,
      pointStrokeOpacity: w.config.markers.strokeOpacity,
      pointFillOpacity: w.config.markers.fillOpacity,
      seriesIndex
    }
  }

  addEvents (circle) {
    const graphics = new Graphics(this.ctx)
    circle.node.addEventListener(
      'mouseenter',
      graphics.pathMouseEnter.bind(this.ctx, circle)
    )
    circle.node.addEventListener(
      'mouseleave',
      graphics.pathMouseLeave.bind(this.ctx, circle)
    )

    circle.node.addEventListener(
      'mousedown',
      graphics.pathMouseDown.bind(this.ctx, circle)
    )

    circle.node.addEventListener(
      'touchstart',
      graphics.pathMouseDown.bind(this.ctx, circle)
    )
  }

  setSelectedPointFilter (circle, realIndex, realIndexP) {
    const w = this.w
    if (typeof w.globals.selectedDataPoints[realIndex] !== 'undefined') {
      if (w.globals.selectedDataPoints[realIndex].includes(realIndexP)) {
        circle.node.setAttribute('selected', true)
        let activeFilter = w.config.states.active.filter
        if (activeFilter !== 'none') {
          const filters = new Filters(this.ctx)
          filters.applyFilter(circle, activeFilter.type, activeFilter.value)
        }
      }
    }
  }

  getMarkerStyle (seriesIndex) {
    let w = this.w

    let colors = w.globals.markers.colors

    let pointStrokeColor = w.config.markers.strokeColor
    let pointFillColor = (colors instanceof Array ? colors[seriesIndex] : colors)

    return {
      pointStrokeColor, pointFillColor
    }
  }
}

module.exports = Markers
