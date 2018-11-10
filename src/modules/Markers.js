import Filters from './Filters'
import Graphics from './Graphics'
import Utils from '../utils/Utils'

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

  setGlobalMarkerSize () {
    const w = this.w

    w.globals.markers.size = Array.isArray(w.config.markers.size) ? w.config.markers.size : [w.config.markers.size]

    if (w.globals.markers.size.length > 0) {
      if (w.globals.markers.size.length < w.globals.series.length + 1) {
        for (let i = 0; i <= w.globals.series.length; i++) {
          if (typeof w.globals.markers.size[i] === 'undefined') {
            w.globals.markers.size.push(w.globals.markers.size[0])
          }
        }
      }
    } else {
      w.globals.markers.size = w.config.series.map((s) => {
        return w.config.markers.size
      })
    }
  }

  plotChartMarkers (pointsPos, seriesIndex, j) {
    let w = this.w

    let p = pointsPos
    let elPointsWrap = null

    let graphics = new Graphics(this.ctx)

    let point

    if (w.globals.markers.size[seriesIndex] > 0) {
      elPointsWrap = graphics.group({
        class: 'apexcharts-series-markers'
      })

      elPointsWrap.attr('clip-path', `url(#gridRectMarkerMask${w.globals.cuid})`)
    }

    if (p.x instanceof Array) {
      for (let q = 0; q < p.x.length; q++) {
        let dataPointIndex = j

        let PointClasses = 'apexcharts-marker'
        if (((w.config.chart.type === 'line' || w.config.chart.type === 'area') && !w.globals.comboCharts) && !w.config.tooltip.intersect) {
          PointClasses += ' no-pointer-events'
        }

        if (w.globals.markers.size[seriesIndex] > 0) {
          if (Utils.isNumber(p.y[q])) {
            PointClasses += ` w${(Math.random() + 1).toString(36).substring(4)}`
          } else {
            PointClasses = 'apexcharts-nullpoint'
          }

          let opts = this.getMarkerConfig(PointClasses, seriesIndex)

          // discrete markers is an option where user can specify a particular marker with different size and color
          w.config.markers.discrete.map((marker) => {
            if (marker.seriesIndex === seriesIndex && marker.dataPointIndex === dataPointIndex) {
              opts.pointStrokeColor = marker.strokeColor
              opts.pointFillColor = marker.fillColor
              opts.pSize = marker.size
            }
          })

          point = graphics.drawMarker(
            p.x[q],
            p.y[q],
            opts
          )

          // a small hack as we have 2 points for the first val to connect it
          if (j === 1 && q === 0) dataPointIndex = 0
          if (j === 1 && q === 1) dataPointIndex = 1

          point.attr('rel', dataPointIndex)
          point.attr('j', dataPointIndex)
          point.attr('index', seriesIndex)
          point.node.setAttribute('default-marker-size', opts.pSize)

          this.setSelectedPointFilter(point, seriesIndex, dataPointIndex)
          this.addEvents(point)

          if (elPointsWrap) {
            elPointsWrap.add(point)
          }
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

    const pSize = w.globals.markers.size[seriesIndex]

    return {
      pSize,
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
      graphics.pathMouseDown.bind(this.ctx, circle), {passive: true}
    )
  }

  setSelectedPointFilter (circle, realIndex, dataPointIndex) {
    const w = this.w
    if (typeof w.globals.selectedDataPoints[realIndex] !== 'undefined') {
      if (w.globals.selectedDataPoints[realIndex].indexOf(dataPointIndex) > -1) {
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
