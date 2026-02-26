import Graphics from '../Graphics'
import Position from './Position'
import Markers from '../../modules/Markers'
import Utils from '../../utils/Utils'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'

/**
 * ApexCharts Tooltip.Marker Class to draw texts on the tooltip.
 * This file deals with the markers that appear near tooltip in line/area charts.
 * These markers helps the user to associate the data-points and the values
 * that are shown in the tooltip
 *
 * @module Tooltip.Marker
 **/

export default class Marker {
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
    this.ctx = tooltipContext.ctx
    this.tooltipPosition = new Position(tooltipContext)
  }

  drawDynamicPoints() {
    const w = this.w

    const graphics = new Graphics(this.w)
    const marker = new Markers(this.w, this.ctx)

    let elsSeries = w.dom.baseEl.querySelectorAll('.apexcharts-series')

    elsSeries = [...elsSeries]

    if (w.config.chart.stacked) {
      elsSeries.sort((a, b) => {
        return (
          parseFloat(a.getAttribute('data:realIndex')) -
          parseFloat(b.getAttribute('data:realIndex'))
        )
      })
    }

    for (let i = 0; i < elsSeries.length; i++) {
      const pointsMain = elsSeries[i].querySelector(
        `.apexcharts-series-markers-wrap`
      )

      if (pointsMain !== null) {
        // it can be null as we have tooltips in donut/bar charts
        let PointClasses = `apexcharts-marker w${(Math.random() + 1)
          .toString(36)
          .substring(4)}`
        if (
          (w.config.chart.type === 'line' || w.config.chart.type === 'area') &&
          !w.globals.comboCharts &&
          !w.config.tooltip.intersect
        ) {
          PointClasses += ' no-pointer-events'
        }

        const elPointOptions = marker.getMarkerConfig({
          cssClass: PointClasses,
          seriesIndex: Number(pointsMain.getAttribute('data:realIndex')), // fixes apexcharts/apexcharts.js #1427
        })

        const point = graphics.drawMarker(0, 0, elPointOptions)

        point.node.setAttribute('default-marker-size', 0)

        const elPointsG = BrowserAPIs.createElementNS(w.globals.SVGNS, 'g')
        elPointsG.classList.add('apexcharts-series-markers')

        elPointsG.appendChild(point.node)
        pointsMain.appendChild(elPointsG)
      }
    }
  }

  enlargeCurrentPoint(rel, point, x = null, y = null) {
    const w = this.w

    if (w.config.chart.type !== 'bubble') {
      this.newPointSize(rel, point)
    }

    let cx = point.getAttribute('cx')
    let cy = point.getAttribute('cy')

    if (x !== null && y !== null) {
      cx = x
      cy = y
    }

    this.tooltipPosition.moveXCrosshairs(cx)

    if (!this.fixedTooltip) {
      if (w.config.chart.type === 'radar') {
        const elGrid = this.ttCtx.getElGrid()
        const seriesBound = elGrid.getBoundingClientRect()

        cx = this.ttCtx.e.clientX - seriesBound.left
      }

      this.tooltipPosition.moveTooltip(cx, cy, w.config.markers.hover.size)
    }
  }

  enlargePoints(j) {
    const w = this.w
    const me = this
    const ttCtx = this.ttCtx

    const col = j

    const points = w.dom.baseEl.querySelectorAll(
      '.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker'
    )

    let newSize = w.config.markers.hover.size

    for (let p = 0; p < points.length; p++) {
      const rel = points[p].getAttribute('rel')
      const index = points[p].getAttribute('index')

      if (newSize === undefined) {
        newSize =
          w.globals.markers.size[index] + w.config.markers.hover.sizeOffset
      }

      if (col === parseInt(rel, 10)) {
        me.newPointSize(col, points[p])

        const cx = points[p].getAttribute('cx')
        const cy = points[p].getAttribute('cy')

        me.tooltipPosition.moveXCrosshairs(cx)

        if (!ttCtx.fixedTooltip) {
          me.tooltipPosition.moveTooltip(cx, cy, newSize)
        }
      } else {
        me.oldPointSize(points[p])
      }
    }
  }

  newPointSize(rel, point) {
    const w = this.w
    let newSize = w.config.markers.hover.size

    const elPoint =
      rel === 0 ? point.parentNode.firstChild : point.parentNode.lastChild

    if (elPoint.getAttribute('default-marker-size') !== '0') {
      const index = parseInt(elPoint.getAttribute('index'), 10)
      if (newSize === undefined) {
        newSize =
          w.globals.markers.size[index] + w.config.markers.hover.sizeOffset
      }

      if (newSize < 0) {
        newSize = 0
      }

      const path = this.ttCtx.tooltipUtil.getPathFromPoint(point, newSize)
      point.setAttribute('d', path)
    }
  }

  oldPointSize(point) {
    const size = parseFloat(point.getAttribute('default-marker-size'))
    const path = this.ttCtx.tooltipUtil.getPathFromPoint(point, size)
    point.setAttribute('d', path)
  }

  resetPointsSize() {
    const w = this.w

    const points = w.dom.baseEl.querySelectorAll(
      '.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker'
    )

    for (let p = 0; p < points.length; p++) {
      const size = parseFloat(points[p].getAttribute('default-marker-size'))

      if (Utils.isNumber(size) && size > 0) {
        const path = this.ttCtx.tooltipUtil.getPathFromPoint(points[p], size)
        points[p].setAttribute('d', path)
      } else {
        points[p].setAttribute('d', 'M0,0')
      }
    }
  }
}
