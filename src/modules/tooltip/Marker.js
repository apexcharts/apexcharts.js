// @ts-check
import Graphics from '../Graphics'
import Position from './Position'
import Markers from '../../modules/Markers'
import Utils from '../../utils/Utils'
import TooltipUtils from './Utils'
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

/**
 * Inline-SVG markup for tooltip series markers. Returns a 12x12 SVG with
 * `currentColor` fill so the series color can be applied via `style.color`
 * on the host span (matching the pre-existing pseudo-element behavior).
 * @param {string} shape - circle | square | rect | line | diamond | triangle | cross | plus | star | sparkle
 * @returns {string}
 */
export function renderMarkerSVG(shape) {
  /** @param {string} body */
  const svg = (body) =>
    `<svg viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`
  switch (shape) {
    case 'square':
    case 'rect':
      return svg('<rect x="1" y="1" width="10" height="10" rx="1" fill="currentColor"/>')
    case 'line':
      return svg('<rect x="0" y="5" width="12" height="2" rx="1" fill="currentColor"/>')
    case 'diamond':
      return svg('<path d="M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z" fill="currentColor"/>')
    case 'triangle':
      return svg('<path d="M6 1 L11.2 10.5 L0.8 10.5 Z" fill="currentColor"/>')
    case 'cross':
      return svg(
        '<path d="M2 2 L10 10 M10 2 L2 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      )
    case 'plus':
      return svg(
        '<path d="M6 1 L6 11 M1 6 L11 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
      )
    case 'star':
      return svg(
        '<path d="M6 0.5 L7.5 4.4 L11.5 4.7 L8.4 7.2 L9.5 11.1 L6 8.9 L2.5 11.1 L3.6 7.2 L0.5 4.7 L4.5 4.4 Z" fill="currentColor"/>',
      )
    case 'sparkle':
      return svg(
        '<path d="M6 0.5 L7 5 L11.5 6 L7 7 L6 11.5 L5 7 L0.5 6 L5 5 Z" fill="currentColor"/>',
      )
    case 'circle':
    default:
      return svg('<circle cx="6" cy="6" r="5" fill="currentColor"/>')
  }
}

export default class Marker {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
    this.ctx = tooltipContext.ctx
    // The tooltip's own instance, not a second one: Position keeps per-hover
    // state (whether the box left the plot, the page's clipping ancestors)
    // that the Tooltip reads back when the pointer moves on.
    this.tooltipPosition =
      tooltipContext.tooltipPosition ?? new Position(tooltipContext)
    // Markers this module has resized up, so a hover only has to put back the
    // ones it actually touched. See enlargePoints().
    /** @type {Set<any>} */
    this.enlargedPoints = new Set()
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
        // Over painted markers the dot is drawn on the one hovered
        // (enlargePaintedPoint), and taking the pointer from the canvas
        // under it ends that hover: the box closed on a resting pointer, and
        // the rim past the painted marker read as a marker node with no data
        // point.
        if (Markers.markersAreInert(w) || TooltipUtils.isCanvasMarkerChart(w)) {
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

    // Keep the size actually applied to the marker: the tooltip has to clear the
    // enlarged dot, and `markers.hover.size` is undefined unless the author sets
    // it, which left the clearance at the nominal 1px and put the tooltip on top
    // of the point. Bubble keeps the old fallback: its radius is per-point and
    // not derivable from `markers.size`.
    let appliedSize = w.config.markers.hover.size
    if (w.config.chart.type !== 'bubble') {
      appliedSize = this.newPointSize(rel, point)
    }

    let cx = point.getAttribute('cx')
    let cy = point.getAttribute('cy')
    // The marker itself, before `cy` is swapped for a caller's box y below:
    // on a short plot the box sits right above it.
    let mark = this.tooltipPosition.isShortPlot()
      ? this.markExtent(point, cy, appliedSize)
      : null

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
        const seriesBound = TooltipUtils.plotRect(w)

        cx = this.ttCtx.e.clientX - seriesBound.left
        if (this.tooltipPosition.isShortPlot()) {
          const py = this.ttCtx.e.clientY - seriesBound.top
          mark = { top: py, bottom: py }
        }
      }

      this.tooltipPosition.moveTooltip(cx, cy, appliedSize, mark)
    }
  }

  /**
   * The hovered marker when it is painted to canvas, which leaves no node to
   * enlarge (enlargeCurrentPoint). The series' hover dot (drawDynamicPoints)
   * is drawn over it at the size an enlarged marker gets, and the crosshair
   * and the box go to (x, y) as they go for an enlarged marker.
   *
   * @param {{ i: number, cx: number, cy: number, size: number }} marker
   *   its series (realIndex), centre in grid px and painted size
   * @param {number} x
   * @param {number} y
   */
  enlargePaintedPoint(marker, x, y) {
    const w = this.w
    this.resetPointsSize()

    // A bubble's radius is its value, so enlargeCurrentPoint leaves an SVG
    // bubble as it is and clears only `markers.hover.size`; a painted one is
    // left as it is too, with no dot drawn over it.
    const isBubble = w.config.chart.type === 'bubble'
    let hoverSize = w.config.markers.hover.size
    if (hoverSize === undefined && !isBubble) {
      hoverSize = marker.size + w.config.markers.hover.sizeOffset
    }
    if (hoverSize !== undefined) hoverSize = Math.max(0, hoverSize)
    // What a short plot's box sits clear of: the dot, or the bubble itself.
    const reach = isBubble ? marker.size : (hoverSize ?? 0)

    const point = isBubble
      ? null
      : w.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${marker.i}'] .apexcharts-series-markers path`,
        )
    if (point) {
      const shape = point.getAttribute('shape') ?? 'circle'
      point.setAttribute(
        'd',
        new Graphics(w).getMarkerPath(marker.cx, marker.cy, shape, hoverSize),
      )
    }

    this.tooltipPosition.moveXCrosshairs(x)

    if (!this.ttCtx.fixedTooltip) {
      this.tooltipPosition.moveTooltip(
        x,
        y,
        hoverSize,
        this.tooltipPosition.isShortPlot()
          ? { top: marker.cy - reach, bottom: marker.cy + reach }
          : null,
      )
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

    // Put back only the markers we previously grew, then ask the DOM for just
    // this column's markers. The old shape of this walked EVERY marker in the
    // chart on every mousemove and recomputed the path of each one that did
    // not match, so hover cost scaled with (series x points) rather than with
    // the column being hovered. `drawDynamicPoints()` (the only source of
    // markers without a `rel`) runs solely when markers are zero-sized or
    // batched, which is exactly when this method is not the one called, so
    // selecting on `rel` cannot miss a node this used to touch.
    this.resetEnlargedPoints()

    const points = w.dom.baseEl.querySelectorAll(
      `.apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker[rel="${col}"]`,
    )

    let newSize = w.config.markers.hover.size

    // Position the crosshair and the tooltip ONCE, after the loop. Doing it
    // per marker was redundant (each call overwrote the last, so only the final
    // marker's coords survived) and far from free: moveXCrosshairs and
    // moveTooltip each resolve their element through a chart-wide
    // `baseEl.querySelector`, one of them with a `:not()`. At 700 markers in a
    // column that was ~1,400 whole-document queries per mousemove, which a CPU
    // profile put at ~37% of all hover time.
    let lastCx = null
    let lastCy = null
    // The column's vertical extent, for a short plot's box to sit above all
    // of it. Taken from the markers themselves: with SVG markers drawn,
    // `pointsArray` (what columnExtent reads) is never filled.
    let colTop = Infinity
    let colBottom = -Infinity

    for (let p = 0; p < points.length; p++) {
      const index = points[p].getAttribute('index')

      if (newSize === undefined) {
        newSize =
          w.globals.markers.size[/** @type {any} */ (index)] +
          w.config.markers.hover.sizeOffset
      }

      me.newPointSize(col, points[p])

      lastCx = points[p].getAttribute('cx') ?? '0'
      lastCy = points[p].getAttribute('cy') ?? '0'
      const y = parseFloat(lastCy)
      if (Number.isFinite(y)) {
        if (y < colTop) colTop = y
        if (y > colBottom) colBottom = y
      }
    }

    if (lastCx === null) return

    me.tooltipPosition.moveXCrosshairs(parseFloat(lastCx))

    if (!ttCtx.fixedTooltip) {
      // On a short plot the box sits above the whole column, not just the
      // last series' marker, and above any bars a combo chart has there.
      me.tooltipPosition.moveTooltip(
        parseFloat(lastCx),
        parseFloat(/** @type {string} */ (lastCy)),
        newSize,
        me.tooltipPosition.isShortPlot()
          ? me.columnMark(col, colTop, colBottom, newSize)
          : null,
      )
    }
  }

  /**
   * Grid-local extent of a shared column on a short plot: the enlarged
   * markers' span padded by their hover size, joined with the bars at the
   * same index when the chart has some.
   *
   * @param {number} j
   * @param {number} top  highest marker centre (smallest y)
   * @param {number} bottom  lowest marker centre
   * @param {number} size  hover size
   * @returns {{ top: number, bottom: number } | null}
   */
  columnMark(j, top, bottom, size) {
    const pad = Number.isFinite(size) ? size : 0
    /** @type {{ top: number, bottom: number } | null} */
    let mark = Number.isFinite(top)
      ? { top: top - pad, bottom: bottom + pad }
      : null
    if (this.w.globals.comboCharts && this.ttCtx.tooltipUtil.hasBars()) {
      const bars = this.tooltipPosition._barsExtentInGrid(j)
      if (bars) {
        mark = mark
          ? {
              top: Math.min(mark.top, bars.top),
              bottom: Math.max(mark.bottom, bars.bottom),
            }
          : bars
      }
    }
    return mark
  }

  /**
   * Grid-local vertical extent of an enlarged marker. A bubble's radius is its
   * own, so it is measured; other markers are `size` around their centre.
   * Radar markers sit in a group of their own, so their centre is not in grid
   * px: the radar branch uses the pointer instead, as it does for x.
   *
   * @param {Element} point
   * @param {string | null} cy
   * @param {number | undefined} size
   * @returns {{ top: number, bottom: number } | null}
   */
  markExtent(point, cy, size) {
    const w = this.w
    if (w.config.chart.type === 'radar') return null
    if (w.config.chart.type === 'bubble') {
      const box = /** @type {SVGGraphicsElement} */ (point).getBBox?.()
      if (box && box.height > 0) {
        return { top: box.y, bottom: box.y + box.height }
      }
    }
    const c = parseFloat(String(cy))
    const r = Number.isFinite(size) ? /** @type {number} */ (size) : 0
    return Number.isFinite(c) ? { top: c - r, bottom: c + r } : null
  }

  /**
   * Restore every marker this module grew back to its default size. Cheap
   * because it only visits the handful of nodes actually enlarged, where the
   * old code re-pathed every marker in the chart.
   */
  resetEnlargedPoints() {
    if (this.enlargedPoints.size === 0) return

    // Snapshot first: oldPointSize() removes each entry as it restores it.
    const points = Array.from(this.enlargedPoints)
    for (let i = 0; i < points.length; i++) {
      this.oldPointSize(points[i])
    }
    this.enlargedPoints.clear()
  }

  /**
   * Resizes the hovered marker to its hover size and returns the size applied,
   * so the caller can position the tooltip clear of the enlarged dot. Undefined
   * when nothing was resized (a zero-size marker has nothing to clear).
   * @param {any} rel
   * @param {any} point
   * @returns {number | undefined}
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
      // Remember it so the next hover can put back just this one. Registering
      // here rather than in enlargePoints() also covers enlargeCurrentPoint()
      // and the keyboard-navigation callers.
      this.enlargedPoints.add(point)
      return newSize
    }

    return undefined
  }

  /**
   * @param {any} point
   */
  oldPointSize(point) {
    const size = parseFloat(point.getAttribute('default-marker-size'))
    const path = this.ttCtx.tooltipUtil.getPathFromPoint(point, size)
    point.setAttribute('d', path)
    this.enlargedPoints.delete(point)
  }

  resetPointsSize() {
    const w = this.w

    // This is the chart-wide sweep, so nothing is left enlarged afterwards.
    this.enlargedPoints.clear()

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
