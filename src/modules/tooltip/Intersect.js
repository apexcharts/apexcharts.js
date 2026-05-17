// @ts-check
import Utils from '../../utils/Utils'

/**
 * ApexCharts Tooltip.Intersect Class.
 * This file deals with functions related to intersecting tooltips
 * (tooltips that appear when user hovers directly over a data-point whether)
 *
 * @module Tooltip.Intersect
 **/

class Intersect {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    const w = this.w
    this.ttCtx = tooltipContext

    this.isVerticalGroupedRangeBar =
      !w.globals.isBarHorizontal &&
      w.config.chart.type === 'rangeBar' &&
      w.config.plotOptions.bar.rangeBarGroupRows
  }

  // a helper function to get an element's attribute value
  /**
   * @param {Event} e
   * @param {string} attr
   */
  getAttr(e, attr) {
    return parseFloat(
      /** @type {Element} */ (e.target).getAttribute(attr) ?? '',
    )
  }

  // handle tooltip for heatmaps and treemaps
  /** @param {{e: any, opt: any, x: any, y: any, type: any}} opts */
  handleHeatTreeTooltip({ e, opt, x, y, type }) {
    const ttCtx = this.ttCtx
    const w = this.w

    if (e.target.classList.contains(`apexcharts-${type}-rect`)) {
      const i = this.getAttr(e, 'i')
      const j = this.getAttr(e, 'j')
      const cx = this.getAttr(e, 'cx')
      const cy = this.getAttr(e, 'cy')
      const width = this.getAttr(e, 'width')
      const height = this.getAttr(e, 'height')

      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j,
        shared: false,
        e,
      })

      w.interact.capturedSeriesIndex = i
      w.interact.capturedDataPointIndex = j

      x = cx + ttCtx.tooltipRect.ttWidth / 2 + width
      y = cy + ttCtx.tooltipRect.ttHeight / 2 - height / 2

      ttCtx.tooltipPosition.moveXCrosshairs(cx + width / 2)

      if (x > w.layout.gridWidth / 2) {
        x = cx - ttCtx.tooltipRect.ttWidth / 2 + width
      }
      if (ttCtx.w.config.tooltip.followCursor) {
        const seriesBound = w.dom.elWrap.getBoundingClientRect()
        x =
          (w.interact.clientX ?? 0) -
          seriesBound.left -
          (x > w.layout.gridWidth / 2 ? ttCtx.tooltipRect.ttWidth : 0)
        y =
          (w.interact.clientY ?? 0) -
          seriesBound.top -
          (y > w.layout.gridHeight / 2 ? ttCtx.tooltipRect.ttHeight : 0)
      }
    }

    return {
      x,
      y,
    }
  }

  /**
   * handle tooltips for line/area/scatter charts where tooltip.intersect is true
   * when user hovers over the marker directly, this function is executed
   */
  /** @param {{e: any, opt: any, x: any, y: any}} opts */
  handleMarkerTooltip({ e, opt, x, y }) {
    const w = this.w
    const ttCtx = this.ttCtx

    let i
    let j
    if (e.target.classList.contains('apexcharts-marker')) {
      const cx = parseInt(opt.paths.getAttribute('cx'), 10)
      const cy = parseInt(opt.paths.getAttribute('cy'), 10)
      const val = parseFloat(opt.paths.getAttribute('val'))

      j = parseInt(opt.paths.getAttribute('rel'), 10)
      i =
        parseInt(
          opt.paths.parentNode.parentNode.parentNode.getAttribute('rel'),
          10,
        ) - 1

      if (ttCtx.intersect) {
        const el = Utils.findAncestor(opt.paths, 'apexcharts-series')
        if (el) {
          i = parseInt(el.getAttribute('data:realIndex'), 10)
        }
      }

      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared,
        e,
      })

      if (e.type === 'mouseup') {
        ttCtx.markerClick(e, i, j)
      }

      w.interact.capturedSeriesIndex = i
      w.interact.capturedDataPointIndex = j

      const arrowEnabled = !!w.config.tooltip.arrow

      x = cx
      if (arrowEnabled) {
        // Arrow mode handles its own centering on (cx, cy) in
        // computeTooltipPosition (cy assumed to be in grid-local coords).
        // Don't apply the legacy "above the bubble" pre-shift, which
        // would otherwise be re-translated downstream → double-translateY
        // bug placing the arrow nowhere near the bubble.
        y = cy
      } else {
        y = cy + w.layout.translateY - ttCtx.tooltipRect.ttHeight * 1.4
        if (val < 0) {
          y = cy
        }
      }

      if (ttCtx.w.config.tooltip.followCursor) {
        const elGrid = ttCtx.getElGrid()
        if (!elGrid) return { x, y }
        const seriesBound = elGrid.getBoundingClientRect()
        y = ttCtx.e.clientY + w.layout.translateY - seriesBound.top
      }

      ttCtx.marker.enlargeCurrentPoint(j, opt.paths, x, y)
    }

    return {
      x,
      y,
    }
  }

  /**
   * handle tooltips for bar/column charts
   */
  /** @param {{e: any, opt: any}} opts */
  handleBarTooltip({ e, opt }) {
    const w = this.w
    const ttCtx = this.ttCtx

    const tooltipEl = ttCtx.getElTooltip()

    let bx = 0
    let x = 0
    let y = 0
    let i = 0
    let strokeWidth
    const barXY = this.getBarTooltipXY({
      e,
      opt,
    })
    if (barXY.j === null && barXY.barHeight === 0 && barXY.barWidth === 0) {
      return // bar was not hovered and didn't receive correct coords
    }

    i = barXY.i
    const j = barXY.j

    w.interact.capturedSeriesIndex = i
    w.interact.capturedDataPointIndex =
      j !== null ? j : w.interact.capturedDataPointIndex

    if (
      (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars()) ||
      !w.config.tooltip.shared
    ) {
      x = barXY.x
      y = barXY.y
      strokeWidth = Array.isArray(w.config.stroke.width)
        ? w.config.stroke.width[i]
        : w.config.stroke.width
      bx = x
    } else {
      if (!w.globals.comboCharts && !w.config.tooltip.shared) {
        // todo: re-check this condition as it's always 0
        bx = bx / 2
      }
    }

    // y is NaN, make it touch the bottom of grid area
    if (isNaN(y)) {
      y = w.globals.svgHeight - ttCtx.tooltipRect.ttHeight
    }

    if (x + ttCtx.tooltipRect.ttWidth > w.layout.gridWidth) {
      x = x - ttCtx.tooltipRect.ttWidth
    } else if (x < 0) {
      x = 0
    }

    if (ttCtx.w.config.tooltip.followCursor) {
      const elGrid = ttCtx.getElGrid()
      if (!elGrid) return
    }

    // if tooltip is still null, querySelector
    if (ttCtx.tooltip === null) {
      ttCtx.tooltip = w.dom.baseEl.querySelector('.apexcharts-tooltip')
    }

    if (!w.config.tooltip.shared) {
      if (w.globals.comboBarCount > 0) {
        ttCtx.tooltipPosition.moveXCrosshairs(bx + strokeWidth / 2)
      } else {
        ttCtx.tooltipPosition.moveXCrosshairs(bx)
      }
    }

    if (
      !ttCtx.fixedTooltip &&
      (!w.config.tooltip.shared ||
        (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars()))
    ) {
      y = y + w.layout.translateY - ttCtx.tooltipRect.ttHeight / 2

      if (tooltipEl) {
        const ttW = ttCtx.tooltipRect.ttWidth || 0
        const ttH = ttCtx.tooltipRect.ttHeight || 0
        const arrowEnabled = !!w.config.tooltip.arrow
        const { barAnchorXInGrid, barAnchorYInGrid, barRectInGrid } = barXY
        const ARROW_TIP_OVERHANG = 7 // matches the CSS arrow width

        // Convert from grid-local (elGrid-relative) coords into elWrap-local
        // coords using the LIVE rect offset between elWrap and elGrid, not
        // `w.layout.translateX`. translateX is the SVG group's internal
        // translate which only matches the elWrap→elGrid offset for charts
        // where the SVG starts flush at elWrap.left; for layouts with a
        // right-side legend or other padding above the SVG, the two values
        // can differ by tens of pixels — enough to misalign the tooltip by a
        // full column.
        const elGridRect = ttCtx.getElGrid()?.getBoundingClientRect()
        const elWrapRect = w.dom.elWrap.getBoundingClientRect()
        const gridOffsetXInElWrap = elGridRect
          ? elGridRect.left - elWrapRect.left
          : w.layout.translateX

        /** @type {'left'|'right'|'top'|'bottom' | undefined} */
        let placement
        /** @type {number | null} */
        let arrowY = null
        /** @type {number | null} */
        let arrowX = null
        let finalX = x + gridOffsetXInElWrap
        let finalY = y

        // For horizontal-orientation bar-likes (horizontal bar, range bar
        // timeline, boxPlot, funnel, pyramid — all flagged via
        // `isBarHorizontal` after Config normalization), place the tooltip
        // ABOVE the bar with a downward arrow. Flip to BELOW when there's
        // no space above the bar.
        if (
          arrowEnabled &&
          w.globals.isBarHorizontal &&
          barRectInGrid != null
        ) {
          const gridTop = w.layout.translateY
          const gridBottom = w.layout.translateY + w.layout.gridHeight
          const gridLeft = gridOffsetXInElWrap
          const gridRight = gridOffsetXInElWrap + w.layout.gridWidth

          const barCenterXInElWrap =
            (barRectInGrid.left + barRectInGrid.right) / 2 +
            gridOffsetXInElWrap
          const barTopInElWrap = barRectInGrid.top + w.layout.translateY
          const barBottomInElWrap = barRectInGrid.bottom + w.layout.translateY

          // Default: tooltip above bar, arrow tip at bar's top edge.
          let proposedTop = barTopInElWrap - ttH - ARROW_TIP_OVERHANG
          placement = 'top'

          // Flip below when no space above.
          if (proposedTop < gridTop) {
            const belowTop = barBottomInElWrap + ARROW_TIP_OVERHANG
            // Only flip if "below" actually fits. Otherwise stay above
            // (best of two bad options — at least the arrow points
            // toward the bar from the top).
            if (belowTop + ttH <= gridBottom) {
              placement = 'bottom'
              proposedTop = belowTop
            }
          }
          finalY = proposedTop

          // Horizontally center on the bar; clamp to grid bounds.
          finalX = barCenterXInElWrap - ttW / 2
          if (finalX < gridLeft) finalX = gridLeft
          if (finalX + ttW > gridRight) finalX = gridRight - ttW

          // Arrow X in tooltip-local coords, clamped away from corners.
          arrowX = Math.max(
            10,
            Math.min(ttW - 10, barCenterXInElWrap - finalX),
          )
        } else if (
          arrowEnabled &&
          barAnchorXInGrid != null &&
          barAnchorYInGrid != null
        ) {
          // Vertical-bar (column) case: tooltip beside the bar, arrow
          // pointing horizontally at the bar's nearest edge. Anchoring on
          // the edge (not the center) keeps the tooltip from overlapping
          // the bar on wide columns (numeric/datetime xaxis tend to draw
          // visually thicker bars).
          const barCenterXInElWrap = barAnchorXInGrid + gridOffsetXInElWrap
          const gridCenterXInElWrap =
            gridOffsetXInElWrap + w.layout.gridWidth / 2
          const barLeftInElWrap =
            (barRectInGrid?.left ?? barAnchorXInGrid) + gridOffsetXInElWrap
          const barRightInElWrap =
            (barRectInGrid?.right ?? barAnchorXInGrid) + gridOffsetXInElWrap
          if (barCenterXInElWrap < gridCenterXInElWrap) {
            placement = 'right'
            finalX = barRightInElWrap + ARROW_TIP_OVERHANG
          } else {
            placement = 'left'
            finalX = barLeftInElWrap - ttW - ARROW_TIP_OVERHANG
          }

          // Center the tooltip vertically on the hovered bar's middle
          // (rect-derived, not the cy attribute which is offset for
          // numeric/datetime xaxis). Makes it unambiguous which segment
          // the tooltip refers to in stacked / grouped column charts.
          // Clamp to grid bounds so a short top/bottom segment doesn't
          // push the tooltip outside the chart.
          if (barRectInGrid) {
            const barCenterYInElWrap =
              (barRectInGrid.top + barRectInGrid.bottom) / 2 +
              w.layout.translateY
            finalY = barCenterYInElWrap - ttH / 2
            const gridTop = w.layout.translateY
            const gridBottom = w.layout.translateY + w.layout.gridHeight
            if (finalY < gridTop) finalY = gridTop
            if (finalY + ttH > gridBottom) finalY = gridBottom - ttH
          }

          // Arrow Y in tooltip-local coords: point at the bar's actual
          // vertical center even when finalY was clamped at the grid edge.
          if (ttH > 0 && barRectInGrid) {
            const barCenterYInElWrap =
              (barRectInGrid.top + barRectInGrid.bottom) / 2 +
              w.layout.translateY
            arrowY = Math.max(
              10,
              Math.min(ttH - 10, barCenterYInElWrap - finalY),
            )
          }
        }

        ttCtx.tooltipPosition.applyTooltipPosition(tooltipEl, {
          x: finalX,
          y: finalY,
          placement,
          arrowY,
          arrowX,
        })
      }
    }
  }

  /** @param {{e: any, opt: any}} opts */
  getBarTooltipXY({ e, opt }) {
    const w = this.w
    let j = null
    const ttCtx = this.ttCtx
    let i = 0
    let x = 0
    let y = 0
    let barWidth = 0
    let barHeight = 0
    /** @type {number | null} */
    let barCx = null
    /** @type {number | null} */
    let barCy = null
    // Arrow anchor point in grid-local coords — derived from the bar's
    // rendered DOM rect so it survives any nested SVG transforms.
    // For column bars: anchor at the bar's TOP (the value/data-point).
    // For horizontal bars: anchor at the bar's vertical center.
    /** @type {number | null} */
    let barAnchorXInGrid = null
    /** @type {number | null} */
    let barAnchorYInGrid = null
    // Full bar rect in grid-local coords (rect-derived; correct under
    // nested SVG transforms). Used by handleBarTooltip for top/bottom
    // placement on horizontal-bar/funnel/pyramid/timeline charts.
    /** @type {{left:number, top:number, right:number, bottom:number} | null} */
    let barRectInGrid = null

    const cl = e.target.classList

    if (
      cl.contains('apexcharts-bar-area') ||
      cl.contains('apexcharts-candlestick-area') ||
      cl.contains('apexcharts-boxPlot-area') ||
      cl.contains('apexcharts-rangebar-area')
    ) {
      const bar = e.target
      const barRect = bar.getBoundingClientRect()

      const seriesBound = opt.elGrid.getBoundingClientRect()

      const bh = barRect.height
      barHeight = barRect.height
      const bw = barRect.width

      const cx = parseInt(bar.getAttribute('cx'), 10)
      const cy = parseInt(bar.getAttribute('cy'), 10)
      barCx = cx
      barCy = cy
      barWidth = parseFloat(bar.getAttribute('barWidth'))

      // Rect-derived bar geometry in grid-local coords (always correct
      // regardless of nested SVG transforms above the bar element).
      const rectLeftInGrid = barRect.left - seriesBound.left
      const rectTopInGrid = barRect.top - seriesBound.top
      const rectCenterXInGrid = rectLeftInGrid + bw / 2
      const rectCenterYInGrid = rectTopInGrid + bh / 2

      // Pick the arrow anchor per orientation:
      //  - column: arrow points at the bar's TOP (the value), which is
      //    also where the tooltip ends up centered (y = cy + translateY
      //    − ttH/2). Aligning anchor with tooltip center keeps arrowY
      //    at the tooltip's vertical mid-line for tall and short bars
      //    alike.
      //  - horizontal: bar is uniform vertically; anchor at vertical center.
      barAnchorXInGrid = rectCenterXInGrid
      barAnchorYInGrid = w.globals.isBarHorizontal
        ? rectCenterYInGrid
        : rectTopInGrid
      barRectInGrid = {
        left: rectLeftInGrid,
        top: rectTopInGrid,
        right: rectLeftInGrid + bw,
        bottom: rectTopInGrid + bh,
      }
      const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX

      j = parseInt(bar.getAttribute('j'), 10)
      i = parseInt(bar.parentNode.getAttribute('rel'), 10) - 1

      const y1 = bar.getAttribute('data-range-y1')
      const y2 = bar.getAttribute('data-range-y2')

      if (w.globals.comboCharts) {
        i = parseInt(bar.parentNode.getAttribute('data:realIndex'), 10)
      }

      /**
       * @param {number} x
       */
      const handleXForColumns = (x) => {
        if (w.axisFlags.isXNumeric) {
          x = cx - bw / 2
        } else {
          if (this.isVerticalGroupedRangeBar) {
            x = cx + bw / 2
          } else {
            x = cx - ttCtx.dataPointsDividedWidth + bw / 2
          }
        }
        return x
      }

      const handleYForBars = () => {
        return (
          cy -
          ttCtx.dataPointsDividedHeight +
          bh / 2 -
          ttCtx.tooltipRect.ttHeight / 2
        )
      }

      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j,
        y1: y1 ? parseInt(y1, 10) : null,
        y2: y2 ? parseInt(y2, 10) : null,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared,
        e,
      })

      if (w.config.tooltip.followCursor) {
        if (w.globals.isBarHorizontal) {
          x = clientX - seriesBound.left + 15
          y = handleYForBars()
        } else {
          x = handleXForColumns(x)
          y = e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2 - 15
        }
      } else {
        if (w.globals.isBarHorizontal) {
          x = cx
          if (ttCtx.xyRatios && x < ttCtx.xyRatios.baseLineInvertedY) {
            x = cx - ttCtx.tooltipRect.ttWidth
          }
          y = handleYForBars()
        } else {
          x = handleXForColumns(x)
          y = cy // - ttCtx.tooltipRect.ttHeight / 2 + 10
        }
      }
    }

    return {
      x,
      y,
      barHeight,
      barWidth,
      i,
      j,
      // SVG attribute values — left for any caller that still wants them.
      barCx,
      barCy,
      // Arrow anchor in grid-local coords (rect-derived; column→top,
      // horizontal→center). Used by handleBarTooltip to place the arrow
      // exactly on the bar's data point.
      barAnchorXInGrid,
      barAnchorYInGrid,
      // Full rendered bar rect (grid-local). Used for top/bottom
      // placement and flip-on-overflow detection.
      barRectInGrid,
    }
  }
}

export default Intersect
