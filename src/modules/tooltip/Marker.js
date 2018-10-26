import Graphics from '../Graphics'
import Position from './Position'
import Markers from '../../modules/Markers'
import Utils from '../../utils/Utils'

/**
 * ApexCharts Tooltip.Marker Class to draw texts on the tooltip.
 *
 * @module Tooltip.Marker
 **/

class Marker {
  constructor (tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
    this.ctx = tooltipContext.ctx
    this.tooltipPosition = new Position(tooltipContext)
  }

  drawDynamicPoints () {
    let w = this.w

    let graphics = new Graphics(this.ctx)
    let marker = new Markers(this.ctx)

    let elsSeries = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series'
    )

    for (let i = 0; i < elsSeries.length; i++) {
      let seriesIndex = parseInt(elsSeries[i].getAttribute('data:realIndex'))

      let pointsMain = w.globals.dom.baseEl.querySelector(
        `.apexcharts-series[data\\:realIndex='${seriesIndex}'] .apexcharts-series-markers-wrap`
      )

      if (pointsMain !== null) {
        // it can be null as we have tooltips in donut/bar charts
        let point

        let PointClasses = `apexcharts-marker w${(Math.random() + 1).toString(36).substring(4)}`
        if (((w.config.chart.type === 'line' || w.config.chart.type === 'area') && !w.globals.comboCharts) && !w.config.tooltip.intersect) {
          PointClasses += ' no-pointer-events'
        }

        let elPointOptions = marker.getMarkerConfig(PointClasses, seriesIndex)

        point = graphics.drawMarker(0, 0, elPointOptions)

        point.node.setAttribute('default-marker-size', 0)

        let elPointsG = document.createElementNS(w.globals.svgNS, 'g')
        elPointsG.classList.add('apexcharts-series-markers')

        elPointsG.appendChild(point.node)
        pointsMain.appendChild(elPointsG)
      }
    }
  }

  enlargeCurrentPoint (rel, point) {
    let w = this.w

    if (w.config.chart.type !== 'bubble') {
      this.newPointSize(rel, point)
    }

    let cx = point.getAttribute('cx')
    let cy = point.getAttribute('cy')

    this.tooltipPosition.moveXCrosshairs(cx)

    if (!this.fixedTooltip) {
      this.tooltipPosition.moveTooltip(
        cx,
        cy,
        w.config.markers.hover.size
      )
    }
  }

  enlargePoints (j) {
    let w = this.w
    let me = this
    const ttCtx = this.ttCtx

    let col = j

    let points = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker'
    )

    let newSize = w.config.markers.hover.size

    for (let p = 0; p < points.length; p++) {
      let rel = points[p].getAttribute('rel')
      let index = points[p].getAttribute('index')

      if (newSize === undefined) {
        newSize = w.globals.markers.size[index] + w.config.markers.hover.sizeOffset
      }

      if (col === parseInt(rel)) {
        me.newPointSize(col, points[p])

        let cx = points[p].getAttribute('cx')
        let cy = points[p].getAttribute('cy')

        me.tooltipPosition.moveXCrosshairs(cx)

        if (!ttCtx.fixedTooltip) {
          me.tooltipPosition.moveTooltip(cx, cy, newSize)
        }
      } else {
        me.oldPointSize(points[p])
      }
    }
  }

  newPointSize (rel, point) {
    let w = this.w
    let newSize = w.config.markers.hover.size

    let elPoint = null

    if (rel === 0) {
      elPoint = point.parentNode.firstChild
    } else {
      elPoint = point.parentNode.lastChild
    }

    const index = parseInt(elPoint.getAttribute('index'))
    if (newSize === undefined) {
      newSize = w.globals.markers.size[index] + w.config.markers.hover.sizeOffset
    }

    elPoint.setAttribute('r', newSize)
  }

  oldPointSize (point) {
    const size = parseInt(point.getAttribute('default-marker-size'))
    point.setAttribute('r', size)
  }

  resetPointsSize () {
    let w = this.w

    let points = w.globals.dom.baseEl.querySelectorAll(
      '.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker'
    )

    for (let p = 0; p < points.length; p++) {
      const size = parseInt(points[p].getAttribute('default-marker-size'))
      if (Utils.isNumber(size)) {
        points[p].setAttribute('r', size)
      } else {
        points[p].setAttribute('r', 0)
      }
    }
  }
}
module.exports = Marker
