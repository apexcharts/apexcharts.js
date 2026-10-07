// @ts-check
import Utils from '../../utils/Utils'
import TooltipUtils from './Utils'
import { ARROW_TIP_OVERHANG, POINTER_CLEARANCE_BELOW } from './constants'

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
      /** @type {Element} */ (TooltipUtils.hoverTarget(e)).getAttribute(attr) ??
        '',
    )
  }

  // handle tooltip for heatmaps and treemaps
  /** @param {{e: any, opt: any, x: any, y: any, type: any}} opts */
  handleHeatTreeTooltip({ e, opt, x, y, type }) {
    const ttCtx = this.ttCtx
    const w = this.w

    // Strata (#2): when the heatmap paints its cells to canvas there is no
    // per-cell <rect> under the cursor, so resolve the cell by coordinate
    // (renderer.hitTest) instead of reading it off e.target. Everything after
    // the cell is resolved is shared with the SVG path.
    const renderer = w.globals.activeRenderer
    const canvasCells =
      type === 'heatmap' &&
      renderer &&
      renderer.kind === 'canvas' &&
      typeof renderer.hitTest === 'function'

    const hovered = TooltipUtils.hoverTarget(e)

    let i, j, cx, cy, width, height

    if (canvasCells) {
      // From the plot's own corner, where the cells start: the grid group's
      // box sits a pixel lower, which hit-tested the top pixel row of every
      // cell as the row above it.
      const seriesBound = TooltipUtils.plotRect(w)
      // This is THIS chart's plot, so the pointer has to be this chart's too.
      // In a group the event belongs to whichever sibling was hovered, and
      // `seriesHover` hands down the pointer already translated into each
      // member's own space; pairing the raw event with a sibling's plot puts
      // the hit test a whole chart-width off and every sibling resolves to
      // "no cell".
      const pointer = TooltipUtils.eventPointer(e, opt)
      // Screen px back to plot px, the space the cells were painted in: a
      // CSS zoom or scale on the chart stretches the one into the other.
      const hit = renderer.hitTest(
        (pointer.x - seriesBound.left) / seriesBound.zoom,
        (pointer.y - seriesBound.top) / seriesBound.zoom,
      )
      if (!hit) {
        // off every cell: tell the caller to hide rather than pin a stale cell
        return { x, y, noHit: true }
      }
      i = hit.seriesIndex
      j = hit.dataPointIndex
      cx = hit.x
      cy = hit.y
      width = hit.width
      height = hit.height
    } else if (hovered.classList.contains(`apexcharts-${type}-rect`)) {
      i = this.getAttr(e, 'i')
      j = this.getAttr(e, 'j')
      cx = this.getAttr(e, 'cx')
      cy = this.getAttr(e, 'cy')
      width = this.getAttr(e, 'width')
      height = this.getAttr(e, 'height')
    } else {
      return { x, y }
    }

    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: opt.ttItems,
      i,
      j,
      shared: false,
      e,
    })

    w.interact.capturedSeriesIndex = i
    w.interact.capturedDataPointIndex = j

    ttCtx.tooltipPosition.moveXCrosshairs(cx + width / 2)

    // Heatmap (arrow mode, not follow-cursor): place the tooltip centered
    // ABOVE the hovered cell with a downward arrow, flipping BELOW when there
    // is no room above, and BESIDE it when there is room on neither (a middle
    // row of a heatmap not much taller than the box). The cell rect is
    // resolved in grid-local coords for both the SVG (<rect>) and canvas
    // (hitTest) paths, then converted to the elWrap coords the tooltip lives
    // in. Treemap keeps the legacy beside-the-cell placement below.
    const tooltipEl = ttCtx.getElTooltip()
    if (
      type === 'heatmap' &&
      w.config.tooltip.arrow &&
      !TooltipUtils.isFollowCursor(w) &&
      tooltipEl
    ) {
      const plot = TooltipUtils.plotRect(w)
      const elWrapRect = w.dom.elWrap.getBoundingClientRect()
      // The plot's corner in elWrap px, measured on both axes (see
      // TooltipUtils.plotInWrap): translateY leaves out chart.offsetY.
      const gridOffsetXInElWrap = plot.left - elWrapRect.left
      const gridOffsetYInElWrap = plot.top - elWrapRect.top

      // Cell rect in grid-local coords: the canvas hitTest already returns it;
      // for SVG read the rendered <rect> (robust under any group transform).
      let clLeft, clTop, clRight, clBottom
      /** @type {Element | null} */
      let own = null
      if (canvasCells) {
        clLeft = cx
        clTop = cy
        clRight = cx + width
        clBottom = cy + height
      } else {
        // In a group the hovered <rect> belongs to the sibling under the
        // pointer, so a member measures its own cell at the same i/j.
        const node = w.dom.baseEl.contains(hovered)
          ? hovered
          : w.dom.baseEl.querySelector(
              `.apexcharts-heatmap-rect[i='${i}'][j='${j}']`,
            ) || hovered
        own = node
        const r = node.getBoundingClientRect()
        // From the plot's own corner, as the canvas cells are: the grid
        // group's box starts a pixel below it, which left the arrow tip a
        // pixel short of the cell with the box above it and a pixel inside it
        // with the box below.
        clLeft = r.left - plot.left
        clTop = r.top - plot.top
        clRight = r.right - plot.left
        clBottom = r.bottom - plot.top
      }

      const cellCenterXInElWrap = (clLeft + clRight) / 2 + gridOffsetXInElWrap
      const cellTopInElWrap = clTop + gridOffsetYInElWrap
      const cellBottomInElWrap = clBottom + gridOffsetYInElWrap

      const gridTop = gridOffsetYInElWrap
      const gridBottom = gridOffsetYInElWrap + w.layout.gridHeight
      const gridLeft = gridOffsetXInElWrap
      const gridRight = gridOffsetXInElWrap + w.layout.gridWidth

      // A plot too short for the box (a one-row heatmap strip): directly
      // above (or below) the cell wherever the page has room, out of the plot
      // if need be, rather than clamped over the cells.
      const stacked = ttCtx.tooltipPosition.placeOnShortPlot(
        cellCenterXInElWrap,
        cellTopInElWrap,
        cellBottomInElWrap,
      )
      if (stacked) {
        ttCtx.tooltipPosition.applyTooltipPosition(tooltipEl, stacked)
        return { x: stacked.x, y: stacked.y, positioned: true }
      }

      const pos = ttCtx.tooltipPosition.placeAroundCell(
        {
          top: cellTopInElWrap,
          bottom: cellBottomInElWrap,
          left: clLeft + gridOffsetXInElWrap,
          right: clRight + gridOffsetXInElWrap,
        },
        { top: gridTop, bottom: gridBottom, left: gridLeft, right: gridRight },
        { el: own },
      )
      ttCtx.tooltipPosition.applyTooltipPosition(tooltipEl, pos)

      return { x: pos.x, y: pos.y, positioned: true }
    }

    // Legacy placement (treemap, arrow disabled, or follow-cursor): tooltip
    // sits beside the cell, vertically centered on it.
    const ttWidth = ttCtx.tooltipRect.ttWidth || 0
    const ttHeight = ttCtx.tooltipRect.ttHeight || 0

    // `cx`/`cy` are grid-local, but the tooltip is absolutely positioned inside
    // elWrap, so the grid's own offset has to be added back. Without it the box
    // drifts left by the width of the y-axis and up by everything above the
    // plot area.
    const elWrapRect = w.dom.elWrap.getBoundingClientRect()
    const { left: gridLeft, top: gridTop } = TooltipUtils.plotInWrap(w)
    const gridRight = gridLeft + w.layout.gridWidth
    const gridBottom = gridTop + w.layout.gridHeight

    // Centering on the cell is `center - ttHeight / 2`; the two height terms
    // used to be swapped, which on a tall tile (a treemap fills the plot area
    // with them) threw the box half a tile ABOVE the cell and clean off the top
    // of the page when the chart sat near it.
    let cellX = cx + width + ttWidth / 2
    const cellY = cy + height / 2 - ttHeight / 2

    if (cellX > w.layout.gridWidth / 2) {
      cellX = cx + width - ttWidth / 2
    }

    x = gridLeft + cellX
    y = gridTop + cellY

    // This chart's own pointer for this event: `w.interact` lags it by one
    // event (its listener sits on the chart's root and runs after this one),
    // and in a group belongs to the hovered sibling, not this member.
    const followsPointer = TooltipUtils.isFollowCursor(w)
    const pointer = TooltipUtils.eventPointer(e, opt)

    if (followsPointer) {
      x =
        pointer.x -
        elWrapRect.left -
        (cellX > w.layout.gridWidth / 2 ? ttWidth : 0)
      y =
        pointer.y -
        elWrapRect.top -
        (cellY > w.layout.gridHeight / 2 ? ttHeight : 0)
    }

    // Too short a plot for the box beside the cell: directly above (or
    // below) the cell instead, or the pointer when the box follows it.
    let stacked = null
    if (followsPointer) {
      const py = pointer.y - elWrapRect.top
      stacked = ttCtx.tooltipPosition.placeOnShortPlot(
        pointer.x - elWrapRect.left,
        py,
        py,
        { gapBelow: POINTER_CLEARANCE_BELOW },
      )
    } else {
      stacked = ttCtx.tooltipPosition.placeOnShortPlot(
        gridLeft + cx + width / 2,
        gridTop + cy,
        gridTop + cy + height,
      )
    }
    if (stacked) {
      return {
        x: stacked.x,
        y: stacked.y,
        placement: stacked.placement,
        arrowX: stacked.arrowX,
      }
    }

    // A label wider than the space beside the cell pushes the box out of the
    // plot area — on a narrow screen it then hangs off the viewport and the
    // text is unreadable. Clamp it back into the plot area, the same way the
    // arrow-mode path above does.
    if (x + ttWidth > gridRight) x = gridRight - ttWidth
    if (x < gridLeft) x = gridLeft
    if (y + ttHeight > gridBottom) y = gridBottom - ttHeight
    if (y < gridTop) y = gridTop

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
    if (TooltipUtils.hoverTarget(e).classList.contains('apexcharts-marker')) {
      const cx = parseInt(opt.paths.getAttribute('cx'), 10)
      const cy = parseInt(opt.paths.getAttribute('cy'), 10)

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

      // computeTooltipPosition centres the box beside (cx, cy), cy in grid
      // px, with the arrow or without it. The no-arrow mode used to pre-shift
      // y to put the box above the bubble instead (and, for a negative value,
      // left cy without the translateY that shift had added), so turning the
      // arrow off moved the box as well as hiding the arrow.
      x = cx
      y = cy

      if (TooltipUtils.isFollowCursor(w)) {
        const elGrid = ttCtx.getElGrid()
        if (!elGrid) return { x, y }
        const seriesBound = TooltipUtils.plotRect(w)
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
    const barXY = this.getBarTooltipXY({
      e,
      opt,
    })
    if (barXY.noHit) {
      // A canvas bar chart with the pointer on no mark: hide, don't pin one.
      // Its listener is the whole plot, so leaving a mark is one more move,
      // never the mouseout that gives an interactive box the time to be
      // reached (Tooltip.onSeriesHover). It gets the same grace here, started
      // by the first move off the mark and left to run by the ones after;
      // entering the box or another mark calls it off.
      if (
        ttCtx.tConfig.interactive &&
        tooltipEl?.classList.contains('apexcharts-active')
      ) {
        if (ttCtx.offMarkHideTimeout === undefined) {
          const pointer = TooltipUtils.eventPointer(e, opt)
          ttCtx.offMarkHideTimeout = setTimeout(
            () => {
              ttCtx.offMarkHideTimeout = undefined
              if (!w.globals.isDestroyed) ttCtx.handleMouseOut(opt)
            },
            ttCtx.interactiveHideDelay(pointer.x, pointer.y),
          )
        }
        return
      }
      ttCtx.handleMouseOut(opt)
      return
    }
    ttCtx.cancelOffMarkHide?.()
    if (barXY.j === null && barXY.barHeight === 0 && barXY.barWidth === 0) {
      return // bar was not hovered and didn't receive correct coords
    }

    i = barXY.i
    const j = barXY.j

    // A mark the hit test found came through the plot-wide listener, which
    // names no series for axisChartsTooltips to check against
    // `enabledOnSeries`; the hit test does, so it is checked here.
    if (
      barXY.byHitTest &&
      Array.isArray(ttCtx.tConfig.enabledOnSeries) &&
      !w.config.tooltip.shared &&
      ttCtx.tConfig.enabledOnSeries.indexOf(i) < 0
    ) {
      ttCtx.handleMouseOut(opt)
      return
    }

    w.interact.capturedSeriesIndex = i
    w.interact.capturedDataPointIndex =
      j !== null ? j : w.interact.capturedDataPointIndex

    if (
      (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars()) ||
      !w.config.tooltip.shared
    ) {
      x = barXY.x
      y = barXY.y
      // Keep the pre-clamp x: the crosshair/x-axis-tooltip anchor below wants
      // the bar's own coordinate, not the one nudged to keep the tooltip box
      // inside the grid.
      bx = x
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

    if (TooltipUtils.isFollowCursor(w)) {
      const elGrid = ttCtx.getElGrid()
      if (!elGrid) return
    }

    // if tooltip is still null, querySelector
    // (:not() so we don't grab the point-annotation hover tooltip, which
    // shares the .apexcharts-tooltip class for styling)
    if (ttCtx.tooltip === null) {
      ttCtx.tooltip = w.dom.baseEl.querySelector(
        '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
      )
    }

    if (!w.config.tooltip.shared) {
      // The band has to sit centred on the column as it is PAINTED. Deriving
      // that centre from the `cx`/`barWidth` attributes does not survive a
      // stroke: the path is inset by half the stroke on each side, so `cx`
      // moves left by strokeWidth/2 and the rendered width loses a whole
      // strokeWidth — together they drag the band a full stroke width off the
      // bar, and the bar's right edge falls outside it. (The `comboBarCount`
      // branch that used to live here added back half of that, for combo
      // charts only.) `barAnchorXInGrid` is the rect-derived centre, which is
      // stroke independent because a stroke grows the bar symmetrically, so
      // use it and let moveXCrosshairs subtract half the band width.
      // Horizontal bar-likes draw no x crosshair; they only feed the x-axis
      // tooltip, which wants the bar's END, i.e. the already-computed `x`.
      // The centre is measured on screen from the plot's corner
      // (getBarTooltipXY), so it holds where marks straddle the plot's edges
      // too (a box plot, a violin, a candlestick). The band is drawn in plot
      // px, which a CSS zoom or scale on the chart stretches away from screen
      // px, hence the division (AxisMapping.screenXToPlotPx does the same).
      const crosshairX =
        !w.globals.isBarHorizontal && barXY.barAnchorXInGrid !== null
          ? barXY.barAnchorXInGrid / TooltipUtils.plotRect(w).zoom
          : bx
      ttCtx.tooltipPosition.moveXCrosshairs(crosshairX)
    }

    if (
      !ttCtx.fixedTooltip &&
      (!w.config.tooltip.shared ||
        (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars()))
    ) {
      if (tooltipEl) {
        const ttW = ttCtx.tooltipRect.ttWidth || 0
        const ttH = ttCtx.tooltipRect.ttHeight || 0
        const arrowEnabled = !!w.config.tooltip.arrow
        const { barAnchorXInGrid, barAnchorYInGrid, barRectInGrid } = barXY

        // Convert from grid-local (plot-origin) coords into elWrap-local
        // coords using the LIVE offset between elWrap and the plot, measured
        // through the svg on both axes (TooltipUtils.plotInWrap) rather than
        // assumed to be `w.layout.translateX/Y`: those are only right while
        // the svg starts flush at elWrap's corner, and chart.offsetX/offsetY
        // move it.
        const { left: gridOffsetXInElWrap, top: gridOffsetYInElWrap } =
          TooltipUtils.plotInWrap(w)
        const plotInElWrap = {
          top: gridOffsetYInElWrap,
          bottom: gridOffsetYInElWrap + w.layout.gridHeight,
          left: gridOffsetXInElWrap,
          right: gridOffsetXInElWrap + w.layout.gridWidth,
        }

        /** @type {'left'|'right'|'top'|'bottom' | undefined} */
        let placement
        /** @type {number | null} */
        let arrowY = null
        /** @type {number | null} */
        let arrowX = null
        let finalX = x + gridOffsetXInElWrap
        let finalY = y + gridOffsetYInElWrap - ttH / 2

        // The hovered bar's painted rect, in elWrap px.
        const barInElWrap = barRectInGrid && {
          top: barRectInGrid.top + gridOffsetYInElWrap,
          bottom: barRectInGrid.bottom + gridOffsetYInElWrap,
          left: barRectInGrid.left + gridOffsetXInElWrap,
          right: barRectInGrid.right + gridOffsetXInElWrap,
        }

        // For horizontal-orientation bar-likes (horizontal bar, range bar
        // timeline, boxPlot, funnel, pyramid, all flagged via
        // `isBarHorizontal` after Config normalization), place the tooltip
        // ABOVE the bar with a downward arrow, BELOW it when there's no
        // space above, then above or below out of the plot where the page has
        // room, and only then BESIDE it, past its value end. Staying above
        // the bar regardless ran it past the plot's top and, near the top of
        // the page, off the screen.
        if (arrowEnabled && w.globals.isBarHorizontal && barInElWrap) {
          const pos = ttCtx.tooltipPosition.placeAroundBar(
            barInElWrap,
            plotInElWrap,
            j ?? 0,
            i,
          )
          placement = pos.placement
          finalX = pos.x
          finalY = pos.y
          arrowX = pos.arrowX
          arrowY = pos.arrowY
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
          const rightX = barRightInElWrap + ARROW_TIP_OVERHANG
          const leftX = barLeftInElWrap - ttW - ARROW_TIP_OVERHANG
          // Half a pixel of slack: a mark centred on the plot's middle
          // measures a hair either side of it depending on the renderer.
          /** @type {Array<'left'|'right'>} */
          const sides =
            barCenterXInElWrap < gridCenterXInElWrap - 0.5
              ? ['right', 'left']
              : ['left', 'right']
          // The side facing the plot's middle, as long as the box stays on
          // the chart's own part of the page. On a plot narrower than about
          // two boxes (a phone) it may not, on either side: it ran under a
          // chart standing beside this one, or off the screen.
          const fits = this._fitsBesideColumn(ttW)
          const side = sides.find((s) => fits(s === 'right' ? rightX : leftX))

          if (side || !barInElWrap) {
            placement = side ?? sides[0]
            finalX = placement === 'right' ? rightX : leftX

            // Center the tooltip vertically on the hovered bar's middle
            // (rect-derived, not the cy attribute which is offset for
            // numeric/datetime xaxis). Makes it unambiguous which segment
            // the tooltip refers to in stacked / grouped column charts.
            // Clamp to grid bounds so a short top/bottom segment doesn't
            // push the tooltip outside the chart.
            if (barInElWrap) {
              const barCenterYInElWrap =
                (barInElWrap.top + barInElWrap.bottom) / 2
              finalY = barCenterYInElWrap - ttH / 2
              if (finalY < plotInElWrap.top) finalY = plotInElWrap.top
              if (finalY + ttH > plotInElWrap.bottom) {
                finalY = plotInElWrap.bottom - ttH
              }

              // Arrow Y in tooltip-local coords: point at the bar's actual
              // vertical center even when finalY was clamped at the grid
              // edge.
              if (ttH > 0) {
                arrowY = Math.max(
                  10,
                  Math.min(ttH - 10, barCenterYInElWrap - finalY),
                )
              }
            }
          } else {
            // Beside it nowhere: above the column (below it with no room
            // above), over this chart's own plot.
            const pos = ttCtx.tooltipPosition.placeOverColumn(
              barInElWrap,
              plotInElWrap,
            )
            placement = pos.placement
            finalX = pos.x
            finalY = pos.y
            arrowX = pos.arrowX
            arrowY = pos.arrowY
          }
        }

        // A plot too short for the box (a bar sparkline): directly above the
        // bar (or below it), arrow on the bar's centre. Without a painted
        // rect to measure, the whole plot stands in for the bar.
        const anchorXInGrid = barRectInGrid
          ? (barRectInGrid.left + barRectInGrid.right) / 2
          : (barAnchorXInGrid ?? bx)
        const wasStacked = ttCtx.tooltipPosition.shortPlotPlacement
        const stacked = ttCtx.tooltipPosition.placeOnShortPlot(
          anchorXInGrid + gridOffsetXInElWrap,
          barInElWrap ? barInElWrap.top : plotInElWrap.top,
          barInElWrap ? barInElWrap.bottom : plotInElWrap.bottom,
        )

        // The no-arrow branch writes no placement of its own, so the
        // top/bottom a short-plot placement left would otherwise stick to the
        // box (and flip its shadow) once it is back beside the bar.
        if (!stacked && placement === undefined && wasStacked) {
          delete tooltipEl.dataset.placement
        }

        ttCtx.tooltipPosition.applyTooltipPosition(
          tooltipEl,
          stacked || {
            x: finalX,
            y: finalY,
            placement,
            arrowY,
            arrowX,
          },
        )
      }
    }
  }

  /**
   * Does a box `ttWidth` wide starting at elWrap-local `x` stay on the
   * chart's own part of the page: inside elWrap sideways, and inside the
   * visible room? The room is measured on the first call that gets that far.
   * @param {number} ttWidth
   * @returns {(x: number) => boolean}
   */
  _fitsBesideColumn(ttWidth) {
    const wrap = this.w.dom.elWrap.getBoundingClientRect()
    // Not laid out (no browser): nothing to measure against.
    const wrapRight = wrap.width > 0 ? wrap.width : Infinity
    /** @type {import('./placement').Box | null | undefined} */
    let room
    return (x) => {
      if (x < 0 || x + ttWidth > wrapRight) return false
      if (room === undefined) {
        room = this.ttCtx.tooltipPosition.getVisibleRoom?.() ?? null
      }
      return !room || (x >= room.left && x + ttWidth <= room.right)
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

    const hovered = TooltipUtils.hoverTarget(e)
    const cl = hovered.classList

    // On canvas there is no path under the pointer at all: the renderer's
    // hit test finds the mark, and the coords cached for it stand in for the
    // path's attributes. A violin is read off its whole glyph rather than the
    // hovered path either way.
    const mark = TooltipUtils.isCanvasBarChart(w)
      ? this.getPaintedMark(e, opt)
      : this.getViolinMark(e, opt)
    const noHit = !!mark?.noHit

    if (
      (mark && !noHit) ||
      cl.contains('apexcharts-bar-area') ||
      cl.contains('apexcharts-candlestick-area') ||
      cl.contains('apexcharts-boxPlot-area') ||
      cl.contains('apexcharts-rangebar-area')
    ) {
      const bar = hovered
      const barRect = mark ? mark.rect : bar.getBoundingClientRect()

      // Grid-local means from the plot's corner, the space `cx`, the
      // crosshair and the gridWidth/gridHeight clamps are in. The grid
      // group's box starts a pixel below it (the arrow stood that far off the
      // bar) and, on a numeric x axis, `barPadForNumericAxis` left of it (the
      // crosshair landed about a bar's width to the right of the bar).
      const seriesBound = TooltipUtils.plotRect(w)

      const bh = barRect.height
      barHeight = barRect.height
      const bw = barRect.width

      const cx = mark ? mark.cx : parseInt(bar.getAttribute('cx'), 10)
      const cy = mark ? mark.cy : parseInt(bar.getAttribute('cy'), 10)
      barCx = cx
      barCy = cy
      barWidth = mark ? mark.barWidth : parseFloat(bar.getAttribute('barWidth'))

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

      j = mark ? mark.j : parseInt(bar.getAttribute('j'), 10)
      i = mark ? mark.i : parseInt(bar.parentNode.getAttribute('rel'), 10) - 1

      const y1 = mark ? mark.y1 : bar.getAttribute('data-range-y1')
      const y2 = mark ? mark.y2 : bar.getAttribute('data-range-y2')

      if (w.globals.comboCharts && !mark) {
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
        y1: y1 != null ? parseInt(y1, 10) : null,
        y2: y2 != null ? parseInt(y2, 10) : null,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared,
        e,
      })

      if (TooltipUtils.isFollowCursor(w)) {
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
      // A canvas bar chart hovered off every mark.
      noHit,
      // A painted mark, found by the hit test rather than a hovered node.
      // One keyboard focus names (KeyboardNavigation._hoverFocusedMark) is
      // not: focus hands over an SVG mark's node the same way, and neither
      // goes through the pointer's `enabledOnSeries` check.
      byHitTest: !!mark?.byHitTest && !e?.apexPaintedHit,
    }
  }

  /**
   * The bar-like mark a hover is over on a chart that paints them to
   * canvas, found by coordinate (renderer.hitTest), and read the way the SVG
   * path under the pointer would be: its box is the box of the path that was
   * hit (one half of a box plot, as the hovered half is on SVG), and the
   * coords Bar.renderSeries cached for the datum carry what the path's
   * attributes would. A violin is read as its whole glyph (getViolinMark).
   *
   * `{ noHit: true }` when the pointer is on no mark.
   * @param {any} e
   * @param {any} opt
   * @returns {any}
   */
  getPaintedMark(e, opt) {
    const w = this.w
    const found = this._paintedHit(e, opt)
    const hit = found?.hit
    const cached = hit
      ? w.globals.barCanvasCoords?.[hit.seriesIndex]?.[hit.dataPointIndex]
      : null
    if (!found || !hit || !cached) return { noHit: true }
    const i = hit.seriesIndex
    const j = hit.dataPointIndex
    if (cached.type === 'violin') {
      return this._violinMark(i, j, null, cached) || { noHit: true }
    }

    const b = cached.bounds
    const box =
      hit.width != null
        ? hit
        : b && {
            x: b.left,
            y: b.top,
            width: b.right - b.left,
            height: b.bottom - b.top,
          }
    if (!box) return { noHit: true }
    const { plot } = found
    const left = plot.left + box.x * plot.zoom
    const top = plot.top + box.y * plot.zoom
    const width = box.width * plot.zoom
    const height = box.height * plot.zoom
    // Read as the path's attributes would be: written out as strings, and
    // cx/cy read back with parseInt.
    const asAttr = (/** @type {any} */ v) => parseInt(String(v), 10)
    return {
      i,
      j,
      rect: {
        left,
        top,
        right: left + width,
        bottom: top + height,
        width,
        height,
      },
      cx: asAttr(cached.cx),
      cy: asAttr(cached.cy),
      barWidth: cached.barWidth,
      y1: cached.rangeY1 ?? null,
      y2: cached.rangeY2 ?? null,
      byHitTest: true,
    }
  }

  /**
   * Ask the renderer which painted mark is under the pointer. The marks are
   * recorded in plot px from the plot's corner on screen, so the pointer is
   * taken there first, through any CSS zoom or scale on the chart. Not the
   * `.apexcharts-grid` box: a violin's grid lines reach half a slot past the
   * plot on either side, and on a numeric x axis a bar chart's run
   * `barPadForNumericAxis` past it.
   * @param {any} e
   * @param {any} opt
   * @returns {{ hit: any, plot: { left: number, top: number, width: number, height: number, zoom: number } } | null}
   */
  _paintedHit(e, opt) {
    const w = this.w
    const renderer = w.globals.activeRenderer
    if (!renderer || typeof renderer.hitTest !== 'function') return null
    const plot = TooltipUtils.plotRect(w)
    // A hover that already names its mark (keyboard focus on it,
    // KeyboardNavigation._hoverFocusedMark) is taken at its word, as an SVG
    // hover is taken at the node it names (TooltipUtils.hoverTarget).
    if (e?.apexPaintedHit) return { hit: e.apexPaintedHit, plot }
    const pointer = TooltipUtils.eventPointer(e, opt)
    const hit = renderer.hitTest(
      (pointer.x - plot.left) / plot.zoom,
      (pointer.y - plot.top) / plot.zoom,
    )
    return { hit, plot }
  }

  /**
   * The violin a hover is over, read as one glyph: body, box lane and jitter
   * together, so the tooltip beside it never covers a raincloud's box or
   * rain lane. On canvas the bodies and boxes are painted, so the violin is
   * found by coordinate (renderer.hitTest) and their extent comes from the
   * coords cached for them (Bar.renderSeries, re-anchored by Violin.draw);
   * the jitter is SVG either way.
   *
   * Null when this is no violin hover, `{ noHit: true }` when a canvas
   * violin chart is hovered off every mark.
   * @param {any} e
   * @param {any} opt
   * @returns {any}
   */
  getViolinMark(e, opt) {
    const w = this.w

    // Gated on violins being drawn at all, not on chart.type: a violin series
    // can sit in a combo of another type.
    if (TooltipUtils.isCanvasViolinChart(w)) {
      const hit = this._paintedHit(e, opt)?.hit
      const cached = hit
        ? w.globals.barCanvasCoords?.[hit.seriesIndex]?.[hit.dataPointIndex]
        : null
      if (!cached) return { noHit: true }
      if (cached.type !== 'violin') return null
      return this._violinMark(hit.seriesIndex, hit.dataPointIndex, null, cached)
    }

    const hovered = TooltipUtils.hoverTarget(e)
    if (!hovered?.classList?.contains('apexcharts-violin-area')) return null
    const seriesEl = hovered.parentNode
    return this._violinMark(
      parseInt(seriesEl.getAttribute('data:realIndex'), 10),
      parseInt(hovered.getAttribute('j'), 10),
      seriesEl,
      null,
    )
  }

  /**
   * Violin `j` of series `i` read as one glyph (getViolinMark): its rect,
   * and the coords the tooltip anchors to, off the SVG body or, painted to
   * canvas, off the coords cached for it. Null when nothing of it is drawn.
   * @param {number} i  realIndex
   * @param {number} j
   * @param {Element | null} seriesEl  the series group, when the caller has it
   * @param {any} cached  the canvas coords, or null for an SVG violin
   * @returns {any}
   */
  _violinMark(i, j, seriesEl, cached) {
    const rect = this.violinGlyphRect(i, j, seriesEl)
    if (!rect) return null

    // Violin.draw renders the body before its box paths, so the first
    // `.apexcharts-violin-area` at j is the body, which carries the cx/cy the
    // tooltip anchors to (a box path keeps the placeholder bar's).
    const body = cached
      ? null
      : seriesEl?.querySelector(`.apexcharts-violin-area[j='${j}']`)
    const attr = (/** @type {string} */ name) =>
      cached ? cached[name] : parseFloat(body?.getAttribute(name) ?? '')

    return {
      i,
      j,
      rect: {
        ...rect,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
      },
      cx: cached?.bodyCx ?? attr('cx'),
      cy: attr('cy'),
      barWidth: attr('barWidth'),
      y1: null,
      y2: null,
      // Found by the renderer's hit test, not by a hovered node.
      byHitTest: !!cached,
    }
  }

  /**
   * The screen rect of everything violin `j` of series `i` draws: body, box
   * lane and jitter (a raincloud's rain). Painted to canvas, the body and box
   * leave only the extent cached for them (Bar.renderSeries, plot px); the
   * jitter is SVG either way. Null when nothing of it is drawn.
   * @param {number} i  realIndex
   * @param {number} j
   * @param {Element | null} [seriesEl]  the series group, when the caller has it
   * @returns {{ left: number, top: number, right: number, bottom: number } | null}
   */
  violinGlyphRect(i, j, seriesEl = null) {
    const w = this.w
    let left = Infinity
    let top = Infinity
    let right = -Infinity
    let bottom = -Infinity
    /**
     * @param {number} l @param {number} t @param {number} r @param {number} b
     */
    const grow = (l, t, r, b) => {
      left = Math.min(left, l)
      top = Math.min(top, t)
      right = Math.max(right, r)
      bottom = Math.max(bottom, b)
    }

    const b = TooltipUtils.isCanvasViolinChart(w)
      ? /** @type {any} */ (w.globals).barCanvasCoords?.[i]?.[j]?.bounds
      : null
    if (b) {
      const plot = TooltipUtils.plotRect(w)
      grow(
        plot.left + b.left * plot.zoom,
        plot.top + b.top * plot.zoom,
        plot.left + b.right * plot.zoom,
        plot.top + b.bottom * plot.zoom,
      )
    }

    const group =
      seriesEl ||
      w.dom.baseEl.querySelector(
        `.apexcharts-violin-series .apexcharts-series[data\\:realIndex='${i}']`,
      )
    const marks = group
      ? group.querySelectorAll(
          `.apexcharts-violin-area[j='${j}'], .apexcharts-violin-points[j='${j}']`,
        )
      : []
    for (let k = 0; k < marks.length; k++) {
      const r = marks[k].getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      grow(r.left, r.top, r.right, r.bottom)
    }
    return isFinite(left) ? { left, top, right, bottom } : null
  }
}

export default Intersect
