// @ts-check
import Graphics from '../Graphics'
import Position from './Position'
import Markers from '../../modules/Markers'
import Utils from '../../utils/Utils'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { SVGNS } from '../../svg/math'

/**
 * ApexCharts Tooltip.Marker Class to draw texts on the tooltip.
 * This file deals with the markers that appear near tooltip in line/area charts.
 * These markers helps the user to associate the data-points and the values
 * that are shown in the tooltip
 *
 * @module Tooltip.Marker
 **/

export default class Marker {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
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

    const elsSeries = /** @type {any[]} */ ([
      ...w.dom.baseEl.querySelectorAll('.apexcharts-series'),
    ])

    if (w.config.chart.stacked) {
      /**
       * @param {any} a
       * @param {any} b
       */
      elsSeries.sort((/** @type {any} */ a, /** @type {any} */ b) => {
        return (
          parseFloat(a.getAttribute('data:realIndex')) -
          parseFloat(b.getAttribute('data:realIndex'))
        )
      })
    }

    for (let i = 0; i < elsSeries.length; i++) {
      const pointsMain = elsSeries[i].querySelector(
        `.apexcharts-series-markers-wrap`,
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

        const elPointsG = BrowserAPIs.createElementNS(SVGNS, 'g')
        elPointsG.classList.add('apexcharts-series-markers')

        elPointsG.appendChild(point.node)
        pointsMain.appendChild(elPointsG)
      }
    }
  }

  /**
   * @param {any} rel
   * @param {any} point
   * @param {number | null} [x]
   * @param {number | null} [y]
   */
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

    // @ts-ignore — fixedTooltip is set by Tooltip.js on this.marker instance
    if (!this.fixedTooltip) {
      if (w.config.chart.type === 'radar') {
        const elGrid = this.ttCtx.getElGrid()
        if (!elGrid) return
        const seriesBound = elGrid.getBoundingClientRect()

        cx = this.ttCtx.e.clientX - seriesBound.left
      }

      this.tooltipPosition.moveTooltip(cx, cy, w.config.markers.hover.size)
    }
  }

  /**
   * @param {number} j
   */
  enlargePoints(j) {
    const w = this.w
    const me = this
    const ttCtx = this.ttCtx

    const col = j

    const points = w.dom.baseEl.querySelectorAll(
      '.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker',
    )

    let newSize = w.config.markers.hover.size

    for (let p = 0; p < points.length; p++) {
      const rel = points[p].getAttribute('rel')
      const index = points[p].getAttribute('index')

      if (newSize === undefined) {
        newSize =
          w.globals.markers.size[/** @type {any} */ (index)] +
          w.config.markers.hover.sizeOffset
      }

      if (col === parseInt(rel ?? '0', 10)) {
        me.newPointSize(col, points[p])

        const cx = points[p].getAttribute('cx') ?? '0'
        const cy = points[p].getAttribute('cy') ?? '0'

        me.tooltipPosition.moveXCrosshairs(parseFloat(cx))

        if (!ttCtx.fixedTooltip) {
          me.tooltipPosition.moveTooltip(
            parseFloat(cx),
            parseFloat(cy),
            newSize,
          )
        }
      } else {
        me.oldPointSize(points[p])
      }
    }
  }

  /**
   * @param {any} rel
   * @param {any} point
   */
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

  /**
   * @param {any} point
   */
  oldPointSize(point) {
    const size = parseFloat(point.getAttribute('default-marker-size'))
    const path = this.ttCtx.tooltipUtil.getPathFromPoint(point, size)
    point.setAttribute('d', path)
  }

  resetPointsSize() {
    const w = this.w

    const points = w.dom.baseEl.querySelectorAll(
      '.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker',
    )

    for (let p = 0; p < points.length; p++) {
      const size = parseFloat(
        points[p].getAttribute('default-marker-size') ?? '0',
      )

      if (Utils.isNumber(size) && size > 0) {
        const path = this.ttCtx.tooltipUtil.getPathFromPoint(points[p], size)
        points[p].setAttribute('d', path)
      } else {
        points[p].setAttribute('d', 'M0,0')
      }
    }
  }
}
