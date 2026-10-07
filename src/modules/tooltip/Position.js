// @ts-check
import AxisMapping from '../AxisMapping'
import Graphics from '../Graphics'
import Series from '../Series'
import TooltipUtils from './Utils'
import {
  ARROW_TIP_OVERHANG,
  POINT_TIP_GAP,
  POINTER_CLEARANCE_BELOW,
} from './constants'
import {
  clampIntoRoom,
  getVisibleBounds,
  holdInRoom,
  isShortPlot,
  placeAroundBar,
  placeAroundCell,
  placeAroundMark,
} from './placement'

/**
 * How long the list of the page's clipping ancestors is trusted, in ms. Their
 * rects are re-read on every placement, so scrolling is always followed; the
 * list itself only changes when the page restyles or moves the chart, so a
 * hover that crosses many marks (pie slices, bars) walks the ancestors once
 * rather than once per mark.
 */
const CLIP_CACHE_TTL = 1000

/**
 * ApexCharts Tooltip.Position Class to move the tooltip based on x and y position.
 *
 * @module Tooltip.Position
 **/

export default class Position {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.ttCtx = tooltipContext
    this.w = tooltipContext.w
    /**
     * Did the last placement come from the short-plot rule (the box above or
     * below its mark, possibly outside the plot)? An interactive tooltip there
     * has to stay open while the pointer crosses over to it.
     * @type {boolean}
     */
    this.shortPlotPlacement = false
    /**
     * The page ancestors that clip the tooltip and when they were found (see
     * CLIP_CACHE_TTL); dropped when the tooltip hides.
     * @type {{ clippers?: Array<{ node: Element, x: boolean, y: boolean }> | null, at?: number }}
     */
    this.clipCache = { clippers: null, at: 0 }
  }

  /**
   * The part of the page where the tooltip can be seen, in elWrap-local px:
   * the viewport, cut down by any ancestor that clips overflow. Null outside a
   * browser or before the chart is mounted.
   * @returns {{ top: number, bottom: number, left: number, right: number } | null}
   */
  getVisibleRoom() {
    const elWrap = this.w.dom?.elWrap
    const tooltipEl = this.ttCtx.getElTooltip?.()
    if (!elWrap || !tooltipEl) return null
    const now = Date.now()
    if (now - (this.clipCache.at || 0) > CLIP_CACHE_TTL) {
      this.clipCache.clippers = null
    }
    if (!this.clipCache.clippers) this.clipCache.at = now
    const bounds = getVisibleBounds(tooltipEl, this.clipCache)
    if (!bounds) return null
    const wrap = elWrap.getBoundingClientRect()
    return {
      top: bounds.top - wrap.top,
      bottom: bounds.bottom - wrap.top,
      left: bounds.left - wrap.left,
      right: bounds.right - wrap.left,
    }
  }

  /**
   * Is the plot too short for the current tooltip to sit beside a point? The
   * placement paths measure their mark only when it is.
   * @returns {boolean}
   */
  isShortPlot() {
    return (
      !this.ttCtx.fixedTooltip &&
      isShortPlot(this.ttCtx.tooltipRect?.ttHeight || 0, this.w.layout.gridHeight)
    )
  }

  /** Forget the clipping ancestors; the next hover looks them up again. */
  resetPlacementCache() {
    this.clipCache.clippers = null
  }

  /**
   * On a plot too short to hold the tooltip beside its point (a sparkline, a
   * short strip, a card with many rows), place the box directly above the
   * hovered mark, arrow on it, when the page has room there, and directly
   * below it otherwise. The box may stick out of the plot and the chart; only
   * the part of the plot above (or below) the mark is ever under it. Null when
   * the plot is tall enough or neither side has room, and the caller keeps
   * its own placement.
   *
   * Callers pass the mark they caption: the hovered marker, the column of
   * markers under a shared tooltip, a bar, a cell, or the pointer.
   *
   * @param {number} anchorX  elWrap-local x the arrow points at
   * @param {number} markTop  elWrap-local top of the mark
   * @param {number} markBottom  elWrap-local bottom of the mark
   * @param {object} [opts]
   * @param {number} [opts.gapAbove]  mark-to-box gap above (default: the
   *   arrow's overhang, so the tip touches the mark)
   * @param {number} [opts.gapBelow]  mark-to-box gap below
   * @returns {{ x: number, y: number, placement: 'top'|'bottom', arrowX: number, arrowY: null } | null}
   */
  placeOnShortPlot(anchorX, markTop, markBottom, { gapAbove, gapBelow } = {}) {
    const ttCtx = this.ttCtx
    this.shortPlotPlacement = false
    if (!this.isShortPlot()) return null

    const ttH = ttCtx.tooltipRect?.ttHeight || 0
    const ttW = ttCtx.tooltipRect?.ttWidth || 0

    const room = this.getVisibleRoom()
    if (!room) return null

    const pos = placeAroundMark({
      anchorX,
      markTop,
      markBottom,
      ttWidth: ttW,
      ttHeight: ttH,
      room,
      gapAbove,
      gapBelow,
    })
    if (!pos) return null
    this.shortPlotPlacement = true
    return { ...pos, arrowY: null }
  }

  /**
   * Box position for a tooltip with an arrow at a heatmap cell: around the
   * cell inside the plot, or out of it where the page has room (see
   * `placeAroundCell` in placement.js).
   *
   * @param {{ top: number, bottom: number, left: number, right: number }} cell  elWrap-local
   * @param {{ top: number, bottom: number, left: number, right: number }} plot  elWrap-local
   * @param {object} [opts]
   * @param {Element | null} [opts.el]  the cell's node; none for a canvas cell
   * @param {number} [opts.ttWidth]
   * @param {number} [opts.ttHeight]
   * @returns {import('./placement').CellPlacement}
   */
  placeAroundCell(
    cell,
    plot,
    {
      el = null,
      ttWidth = this.ttCtx.tooltipRect?.ttWidth || 0,
      ttHeight = this.ttCtx.tooltipRect?.ttHeight || 0,
    } = {},
  ) {
    // Aim at the part of the cell the reader sees. The plot clips its cells
    // (an x window can cut an end cell of a datetime heatmap anywhere), but a
    // honeycomb's group clips to its whole lattice, so its hexagons show in
    // full past the plot's edges.
    if (!el?.closest?.('[clip-path*="heatmapHexMask"]')) {
      cell = this._visiblePart(cell, plot)
    }
    return this._placeAround(placeAroundCell, cell, plot, {
      ttWidth,
      ttHeight,
    })
  }

  /**
   * Box position for a tooltip with an arrow at a horizontal bar, or at the
   * row of bars a shared tooltip captions (see `placeAroundBar` in
   * placement.js): above or below it inside the plot, then out of the plot
   * where the page has room, and only then beside it, past its value end.
   *
   * @param {{ top: number, bottom: number, left: number, right: number }} bar  elWrap-local
   * @param {{ top: number, bottom: number, left: number, right: number }} plot  elWrap-local
   * @param {number} j  the data point
   * @param {number | null} [i]  the series; null for a whole row
   * @returns {import('./placement').CellPlacement}
   */
  placeAroundBar(bar, plot, j, i = null) {
    const side = this.barValueSide(j, i)
    return this._placeAround(
      placeAroundBar,
      this._visiblePart(bar, plot),
      plot,
      { side },
    )
  }

  /**
   * Box position for a tooltip with an arrow at a column whose box fits
   * beside it nowhere on screen (a phone-width plot): above the column, or
   * below it with no room above, covering the chart's own plot rather than
   * running under whatever stands beside the chart or off the page.
   *
   * @param {{ top: number, bottom: number, left: number, right: number }} column  elWrap-local
   * @param {{ top: number, bottom: number, left: number, right: number }} plot  elWrap-local
   * @returns {import('./placement').CellPlacement}
   */
  placeOverColumn(column, plot) {
    return this._placeAround(
      placeAroundBar,
      this._visiblePart(column, plot),
      plot,
      { beside: false },
    )
  }

  /**
   * The part of a mark inside the plot, sideways, which is the part drawn:
   * the plot clips its series.
   * @param {import('./placement').Box} mark
   * @param {import('./placement').Box} plot
   * @returns {import('./placement').Box}
   */
  _visiblePart(mark, plot) {
    const left = Math.max(mark.left, plot.left)
    const right = Math.min(mark.right, plot.right)
    return right > left ? { ...mark, left, right } : mark
  }

  /**
   * Runs one of the placement.js deciders, measuring the visible room only
   * when a step needs it. With room nowhere around the mark, the box goes
   * above it, clamped into the plot. Any box that sticks out past the plot
   * along the mark's side is then held inside the visible room.
   *
   * @param {(p: any) => import('./placement').CellPlacement | null} decide
   * @param {import('./placement').Box} mark  elWrap-local
   * @param {import('./placement').Box} plot  elWrap-local
   * @param {{ ttWidth?: number, ttHeight?: number, side?: 'left'|'right'|null, beside?: boolean }} [opts]
   * @returns {import('./placement').CellPlacement}
   */
  _placeAround(
    decide,
    mark,
    plot,
    {
      ttWidth = this.ttCtx.tooltipRect?.ttWidth || 0,
      ttHeight = this.ttCtx.tooltipRect?.ttHeight || 0,
      ...rest
    } = {},
  ) {
    // The room is measured (a walk up the page) only for a box that needs it.
    /** @type {import('./placement').Box | null | undefined} */
    let room
    const getRoom = () => {
      if (room === undefined) room = this.getVisibleRoom()
      return room
    }

    let pos = decide({
      cell: mark,
      plot,
      room: getRoom,
      ttWidth,
      ttHeight,
      ...rest,
    })
    if (!pos) {
      const midX = (mark.left + mark.right) / 2
      const x = Math.min(
        Math.max(midX - ttWidth / 2, plot.left),
        plot.right - ttWidth,
      )
      pos = {
        x,
        y: plot.top,
        placement: 'top',
        // Clamped away from the rounded corners.
        arrowX: Math.max(10, Math.min(ttWidth - 10, midX - x)),
        arrowY: null,
      }
    }

    const vertical = pos.placement === 'top' || pos.placement === 'bottom'
    const sticksOut = vertical
      ? pos.x < plot.left || pos.x + ttWidth > plot.right
      : pos.y < plot.top || pos.y + ttHeight > plot.bottom
    const holdIn = sticksOut ? getRoom() : null
    if (holdIn) pos = holdInRoom(pos, mark, holdIn, ttWidth, ttHeight)
    return pos
  }

  /**
   * The side of a horizontal bar its value is at: the right of a positive
   * bar, the left of a negative one, and the other way round on a reversed
   * axis. A row has one when every visible bar in it points the same way.
   * Null for a bar with a value at each end (a range bar, a box plot) or a
   * row pointing both ways, which then take the side facing the plot's
   * middle. Funnel and pyramid bars are centred on the plot, so neither side
   * has more room; they take the right, the same in every row.
   *
   * @param {number} j
   * @param {number | null} [i]  the series; null for every visible series
   * @returns {'left'|'right' | null}
   */
  barValueSide(j, i = null) {
    const w = this.w
    if (w.config.plotOptions?.bar?.isFunnel) return 'right'
    if (w.config.chart.type !== 'bar' || w.rangeData?.seriesRange?.length) {
      return null
    }
    const series = w.seriesData.series
    const collapsed = w.globals.collapsedSeriesIndices || []
    let positive = false
    let negative = false
    series.forEach((/** @type {any[]} */ data, /** @type {number} */ s) => {
      if (i == null ? collapsed.includes(s) : s !== i) return
      const v = data?.[j]
      if (v > 0) positive = true
      else if (v < 0) negative = true
    })
    if (positive === negative) return null
    return negative !== !!w.config.yaxis?.[0]?.reversed ? 'left' : 'right'
  }

  /**
   * Box position for a tooltip that sits centred above an anchor (pie and
   * donut slices, radial rings): flipped below the anchor when the page has
   * no room above, and held inside the visible part of the page sideways, as
   * a 40px pie sparkline is narrower than its own tooltip. With room on
   * neither side it stays above, as it always has.
   *
   * @param {number} anchorX  elWrap-local
   * @param {number} anchorY  elWrap-local
   * @param {number} ttWidth
   * @param {number} ttHeight
   * @param {number} gapAbove
   * @param {number} [gapBelow]
   * @returns {{ x: number, y: number }}
   */
  placeOverAnchor(
    anchorX,
    anchorY,
    ttWidth,
    ttHeight,
    gapAbove,
    gapBelow = gapAbove,
  ) {
    const room = ttHeight > 0 ? this.getVisibleRoom() : null
    const pos = room
      ? placeAroundMark({
          anchorX,
          markTop: anchorY,
          markBottom: anchorY,
          ttWidth,
          ttHeight,
          room,
          gapAbove,
          gapBelow,
        })
      : null
    if (pos) return { x: pos.x, y: pos.y }
    return {
      x: room ? clampIntoRoom(anchorX, ttWidth, room) : anchorX - ttWidth / 2,
      y: anchorY - gapAbove - ttHeight,
    }
  }

  /**
   * This will move the crosshair (the vertical/horz line that moves along with mouse)
   * Along with this, this function also calls the xaxisMove function
   * @memberof Position
   * @param {number} cx - point's x position, wherever point's x is, you need to move crosshair
   * @param {number | null} [j]
   */
  moveXCrosshairs(cx, j = null) {
    const ttCtx = this.ttCtx
    const w = this.w

    const xcrosshairs = ttCtx.getElXCrosshairs()

    let x = cx - ttCtx.xcrosshairsWidth / 2

    const tickAmount = w.labelData.labels.slice().length
    if (j !== null) {
      x = (w.layout.gridWidth / tickAmount) * j
    }

    if (xcrosshairs !== null && !w.globals.isBarHorizontal) {
      xcrosshairs.setAttribute('x', String(x))
      xcrosshairs.setAttribute('x1', String(x))
      xcrosshairs.setAttribute('x2', String(x))
      xcrosshairs.setAttribute('y2', String(w.layout.gridHeight))
      xcrosshairs.classList.add('apexcharts-active')
    }

    if (x < 0) {
      x = 0
    }

    if (x > w.layout.gridWidth) {
      x = w.layout.gridWidth
    }

    if (ttCtx.isXAxisTooltipEnabled) {
      let tx = x
      if (
        w.config.xaxis.crosshairs.width === 'tickWidth' ||
        w.config.xaxis.crosshairs.width === 'barWidth'
      ) {
        tx = x + ttCtx.xcrosshairsWidth / 2
      }
      this.moveXAxisTooltip(tx)
    }
  }

  /**
   * This will move the crosshair (the vertical/horz line that moves along with mouse)
   * Along with this, this function also calls the xaxisMove function
   * @memberof Position
   * @param {number} cy - point's y position, wherever point's y is, you need to move crosshair
   */
  moveYCrosshairs(cy) {
    const ttCtx = this.ttCtx

    if (ttCtx.ycrosshairs !== null) {
      Graphics.setAttrs(ttCtx.ycrosshairs, {
        y1: cy,
        y2: cy,
      })
    }
    if (ttCtx.ycrosshairsHidden !== null) {
      Graphics.setAttrs(ttCtx.ycrosshairsHidden, {
        y1: cy,
        y2: cy,
      })
    }
  }

  /**
   ** AxisTooltip is the small rectangle which appears on x axis with x value, when user moves
   * @memberof Position
   * @param {number} cx - point's x position, wherever point's x is, you need to move
   */
  moveXAxisTooltip(cx) {
    const w = this.w
    const ttCtx = this.ttCtx

    if (ttCtx.xaxisTooltip !== null && ttCtx.xcrosshairsWidth !== 0) {
      ttCtx.xaxisTooltip.classList.add('apexcharts-active')

      // +5 nudges the tooltip down so its text baseline sits in line with
      // the x-axis labels (the new compact style would otherwise float a few
      // pixels above them).
      const cy =
        ttCtx.xaxisOffY +
        w.config.xaxis.tooltip.offsetY +
        w.layout.translateY +
        5 +
        w.config.xaxis.offsetY

      const xaxisTTText = ttCtx.xaxisTooltip.getBoundingClientRect()
      const xaxisTTTextWidth = xaxisTTText.width

      cx = cx - xaxisTTTextWidth / 2

      if (!isNaN(cx)) {
        cx = cx + w.layout.translateX

        const graphics = new Graphics(this.w)
        const textRect = graphics.getTextRects(
          ttCtx.xaxisTooltipText?.innerHTML ?? '',
          w.config.xaxis.labels.style.fontSize,
        )

        if (ttCtx.xaxisTooltipText) {
          ttCtx.xaxisTooltipText.style.minWidth = textRect.width + 'px'
        }
        ttCtx.xaxisTooltip.style.left = cx + 'px'
        ttCtx.xaxisTooltip.style.top = cy + 'px'
      }
    }
  }

  /**
   * @param {number} index
   */
  moveYAxisTooltip(index) {
    const w = this.w
    const ttCtx = this.ttCtx

    if (ttCtx.yaxisTTEls === null) {
      ttCtx.yaxisTTEls = /** @type {any[]} */ ([
        ...w.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip'),
      ])
    }

    const ycrosshairsHiddenRectY1 = parseInt(
      ttCtx.ycrosshairsHidden?.getAttribute('y1') ?? '0',
      10,
    )
    let cy = w.layout.translateY + ycrosshairsHiddenRectY1

    if (ttCtx.yaxisTTEls) {
      const yAxisTTRect = ttCtx.yaxisTTEls[index].getBoundingClientRect()
      const yAxisTTHeight = yAxisTTRect.height
      // Center the tooltip horizontally on the actual y-axis labels group
      // so it "floats over" the labels instead of sitting on top of the
      // grid. Falls back to `translateYAxisX` when the labels group can't
      // be measured (e.g. yaxis.show=false but tooltip still drawn).
      let cx
      const labelsGroup = /** @type {SVGGElement | null} */ (
        w.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel='${index}'] .apexcharts-yaxis-texts-g`,
        )
      )
      const elWrapRect = w.dom.elWrap.getBoundingClientRect()
      if (labelsGroup) {
        const lr = labelsGroup.getBoundingClientRect()
        if (lr.width > 0) {
          // Convert labels' screen-coord center to elWrap-local x, then
          // subtract half the tooltip width so the tooltip is centered on
          // the labels.
          const labelsCenterInElWrap = lr.left + lr.width / 2 - elWrapRect.left
          cx = labelsCenterInElWrap - yAxisTTRect.width / 2
        }
      }
      if (cx == null) {
        // Fallback: align the tooltip's outer edge just past the axis line
        // on the label side.
        const GAP = 4
        cx = w.config.yaxis[index].opposite
          ? w.globals.translateYAxisX[index] + GAP
          : w.globals.translateYAxisX[index] - yAxisTTRect.width - GAP
      }

      cy = cy - yAxisTTHeight / 2

      if (
        w.globals.ignoreYAxisIndexes.indexOf(index) === -1 &&
        cy > 0 &&
        cy < w.layout.gridHeight
      ) {
        ttCtx.yaxisTTEls[index].classList.add('apexcharts-active')
        ttCtx.yaxisTTEls[index].style.top = cy + 'px'
        ttCtx.yaxisTTEls[index].style.left =
          cx + w.config.yaxis[index].tooltip.offsetX + 'px'
      } else {
        ttCtx.yaxisTTEls[index].classList.remove('apexcharts-active')
      }
    }
  }

  /**
   ** moves the whole tooltip by changing x, y attrs
   * @memberof Position
   * @param {number} cx - point's x position, wherever point's x is, you need to move tooltip
   * @param {number} cy - point's y position, wherever point's y is, you need to move tooltip
   * @param {number | null} [markerSize] - point's size
   * @param {{ top: number, bottom: number } | null} [mark] - grid-local
   *   vertical extent of what the tooltip captions, when it is more than the
   *   point at cy (see computeTooltipPosition)
   */
  moveTooltip(cx, cy, markerSize = null, mark = null) {
    const ttCtx = this.ttCtx
    const tooltipEl = ttCtx.getElTooltip()
    if (!tooltipEl) return

    const pos = this.computeTooltipPosition(cx, cy, markerSize, mark)
    if (pos === null) return

    this.applyTooltipPosition(tooltipEl, pos)
  }

  /**
   * Computes the tooltip box position, edge placement (for arrow), and arrow
   * vertical offset without writing to the DOM. It does read layout: on a
   * short plot it measures the visible room around the chart (see
   * `placeOnShortPlot`). Returns null when inputs are not numeric.
   *
   * `mark` is what a box on a short plot has to sit above or below: the
   * column of markers under a shared tooltip, or the bars at a shared index.
   * Without it, the marker at (cx, cy). It has to be passed separately because
   * `cy` is not always the point's: some callers hand over a box y they have
   * already shifted (the no-arrow intersect lift, the sticky bar clamp).
   *
   * @param {number} cx
   * @param {number} cy
   * @param {number | null} [markerSize]
   * @param {{ top: number, bottom: number } | null} [mark]  grid-local
   * @returns {{ x: number, y: number, placement: 'left'|'right'|'top'|'bottom', arrowY: number|null, arrowX?: number } | null}
   */
  computeTooltipPosition(cx, cy, markerSize = null, mark = null) {
    const w = this.w
    const ttCtx = this.ttCtx
    const tooltipRect = ttCtx.tooltipRect
    const arrowEnabled = !!w.config.tooltip.arrow
    const pointSize = markerSize !== null ? parseFloat(String(markerSize)) : 1
    const ttH = tooltipRect.ttHeight || 0
    const ttW = tooltipRect.ttWidth || 0

    const cxNum = parseFloat(String(cx))
    const cyNum = parseFloat(String(cy))
    // Guard cy too, not just cx: a null/non-numeric cy (e.g. a marker with no
    // cy attribute) otherwise flows through to style.top = 'NaNpx' and a NaN
    // arrow offset, leaving the box stuck at its previous position.
    if (isNaN(cxNum) || isNaN(cyNum)) return null

    // What the tooltip has to clear is the MARKER, not the point's centre, and
    // when the arrow is on it is the arrow tip that leads: the arrow overhangs
    // the box by ARROW_TIP_OVERHANG toward the point. Counting neither term left
    // the tip *inside* the mark, which is the mark a drilldown click has to hit.
    const clearance =
      pointSize + (arrowEnabled ? ARROW_TIP_OVERHANG : 0) + POINT_TIP_GAP

    let x = cxNum + clearance
    // Coord-system note: `style.top` positions the tooltip in elWrap-coords,
    // but `cy` is the data point's y in elGraphical-local SVG coords (the
    // grid group is translated by translateY inside the SVG), so translateY
    // is added here, mirroring how x picks up translateX further down. The
    // box centres on the point with the arrow or without it: turning the
    // arrow off only removes the arrow. (No-arrow mode used to keep the
    // original grid-px formula, top edge at `cy`, which never added
    // translateY: the box rode up by however much title, legend or toolbar
    // sat above the plot, about centred on a bare chart and well clear of
    // the point on a titled one.)
    const pointY = cyNum + w.layout.translateY
    let y = pointY - ttH / 2 + pointSize / 2

    /** @type {'left'|'right'} */
    let placement = 'right'
    // Grid-local x the arrow points at on a short plot: the point, or the
    // pointer when the box follows it.
    let anchorGridX = cxNum
    /** @type {number | null} */
    let pointerGridY = null

    // Measured off the point in both directions. Subtracting from the already
    // offset `x` (the old form) cancelled `pointSize` out of the left placement
    // algebraically, so that side cleared the point's centre by a flat 5px no
    // matter how big the marker was.
    if (x > w.layout.gridWidth / 2) {
      x = cxNum - ttW - clearance
      placement = 'left'
    }

    if (x > w.layout.gridWidth - ttW - 10) {
      // Nudging the box back inside the grid must never move it TOWARD the
      // point: on the last data point that slid the tooltip straight back onto
      // the marker, which is the one place the old code overlapped worst. Only
      // the left placement can be held off, since pulling a right-placed box
      // left is the only way it fits at all.
      x =
        placement === 'left'
          ? Math.min(w.layout.gridWidth - ttW, x)
          : w.layout.gridWidth - ttW
    }

    if (x < -20) {
      x = -20
    }

    if (TooltipUtils.isFollowCursor(w)) {
      const elGrid = ttCtx.getElGrid()
      if (!elGrid) return null
      // From the plot's corner, not the grid group's box: that starts a pixel
      // lower, which left the box a pixel off the pointer, and on a numeric
      // x axis `barPadForNumericAxis` further left, which put the box that far
      // to the right of it.
      const seriesBound = TooltipUtils.plotRect(w)

      // Same pairing rule as the canvas hit test in Intersect: `seriesBound` is
      // this chart's own plot, so measure from this chart's pointer. `ttCtx.e`
      // is the raw event and in a group it belongs to the hovered sibling, so
      // on its own it would place the box a chart-width outside the plot.
      x = (ttCtx.clientX ?? ttCtx.e.clientX) - seriesBound.left
      anchorGridX = x
      if (x > w.layout.gridWidth / 2) {
        x = x - ttW
        placement = 'left'
      } else {
        placement = 'right'
      }
      pointerGridY = (ttCtx.clientY ?? ttCtx.e.clientY) - seriesBound.top
      y = pointerGridY + w.layout.translateY
      if (y > w.layout.gridHeight / 2) {
        y = y - ttH
      }
    } else {
      if (!w.globals.isBarHorizontal) {
        // Clamps run in elWrap-coords (grid box top sits at translateY,
        // bottom at translateY+gridHeight).
        const gridTop = w.layout.translateY
        const gridBottom = w.layout.translateY + w.layout.gridHeight
        if (y + ttH > gridBottom) {
          y = gridBottom - ttH
        }
        if (y < gridTop) {
          y = gridTop
        }
      }
    }

    if (isNaN(x)) return null

    // Too short a plot for the box to sit beside the point: put it directly
    // above (or below) what it captions instead. That never overlaps the
    // focused point either, so the keyboard-focus nudge below has nothing left
    // to do.
    const ty = w.layout.translateY
    const followsPointer = pointerGridY !== null
    const markTop = followsPointer
      ? /** @type {number} */ (pointerGridY) + ty
      : mark
        ? mark.top + ty
        : pointY - pointSize
    const markBottom = followsPointer
      ? markTop
      : mark
        ? mark.bottom + ty
        : pointY + pointSize
    const stacked = this.placeOnShortPlot(
      anchorGridX + w.layout.translateX,
      markTop,
      markBottom,
      {
        gapAbove: ARROW_TIP_OVERHANG + POINT_TIP_GAP,
        gapBelow: followsPointer
          ? POINTER_CLEARANCE_BELOW
          : ARROW_TIP_OVERHANG + POINT_TIP_GAP,
      },
    )
    if (stacked) return stacked

    x = x + w.layout.translateX

    // WCAG 2.4.11 Focus Not Obscured: when keyboard nav drives the tooltip,
    // make sure the tooltip box doesn't sit on top of the focused data
    // point. If the tooltip's vertical extent overlaps the point, push it
    // above the point by enough margin to clear the focus stroke.
    const a11y = w.config?.chart?.accessibility
    if (
      a11y?.enabled &&
      a11y?.keyboard?.navigation?.enabled &&
      w.dom?.baseEl?.querySelector?.('.apexcharts-keyboard-focused')
    ) {
      // Same coord space as `y`: elWrap.
      const refPointY = pointY
      const margin = (pointSize || 1) + 12
      const tooltipTop = y
      const tooltipBottom = y + ttH
      if (
        !isNaN(refPointY) &&
        ttH > 0 &&
        tooltipTop < refPointY + margin &&
        tooltipBottom > refPointY - margin
      ) {
        y = refPointY - ttH - margin
        if (y < 0) {
          y = refPointY + margin
        }
      }
    }

    // Arrow Y in tooltip-local coords = elWrap-coords point Y minus
    // elWrap-coords tooltip top. Clamped away from the rounded corners.
    let arrowY = null
    if (arrowEnabled && ttH > 0) {
      const localY = pointY - y
      const minArrowY = 10
      const maxArrowY = ttH - 10
      arrowY = Math.max(minArrowY, Math.min(maxArrowY, localY))
    }

    return { x, y, placement, arrowY }
  }

  /**
   * Single DOM-writer used by every positioning path on the main tooltip.
   * Replaces the duplicated `style.left/top` writes that previously lived
   * in Position.moveTooltip, Tooltip.drawFixedTooltipRect, and Intersect.
   *
   * @param {HTMLElement} tooltipEl
   * @param {{
   *   x: number,
   *   y: number,
   *   placement?: 'left'|'right'|'top'|'bottom',
   *   arrowY?: number|null,
   *   arrowX?: number|null,
   * }} pos
   */
  applyTooltipPosition(tooltipEl, pos) {
    if (!tooltipEl) return
    // First paint after the tooltip is shown must NOT animate `left`/`top`,
    // otherwise the browser interpolates from the prior (often 0,0 or
    // last-hidden) coordinates and the tooltip visibly slides in from the
    // wrong place. The CSS rule that adds left/top to the transition list
    // keys off `data-positioned="true"` — we set the attribute only AFTER
    // the initial position is committed.
    //
    // The `data-positioned`-only guard isn't enough in practice: some
    // browsers honour the transition rule retroactively when it becomes
    // active in the same frame as the property change. So we also block
    // the transition explicitly with an inline `transition-property`
    // override, force a layout flush, then clear the override on the next
    // frame. This guarantees zero interpolation on first paint regardless
    // of how the active class is sequenced.
    const firstPaint = tooltipEl.dataset.positioned !== 'true'
    if (firstPaint) {
      tooltipEl.style.transitionProperty = 'none'
    }
    tooltipEl.style.left = pos.x + 'px'
    tooltipEl.style.top = pos.y + 'px'
    if (pos.placement) {
      tooltipEl.dataset.placement = pos.placement
    }
    if (pos.arrowY != null) {
      tooltipEl.style.setProperty('--apx-tt-arrow-y', pos.arrowY + 'px')
    }
    if (pos.arrowX != null) {
      tooltipEl.style.setProperty('--apx-tt-arrow-x', pos.arrowX + 'px')
    }
    if (firstPaint) {
      // Force layout so the position above is committed with transitions
      // disabled; then in a microtask (after the active class is added by
      // the caller in the same tick) clear the override so subsequent
      // moves between data points animate smoothly.
      void tooltipEl.offsetWidth
      tooltipEl.dataset.positioned = 'true'
      requestAnimationFrame(() => {
        tooltipEl.style.transitionProperty = ''
      })
    }
  }

  /**
   * @param {number} i
   * @param {number} j
   */
  moveMarkers(i, j) {
    const w = this.w
    const ttCtx = this.ttCtx

    // batched markers are one path per series, so there is no per-point node
    // to find by `rel` and enlarge: fall through to the dynamic point
    if (w.globals.markers.size[i] > 0 && !w.globals.markers.batched) {
      const allPoints = w.dom.baseEl.querySelectorAll(
        ` .apexcharts-series[data\\:realIndex='${i}'] .apexcharts-marker`,
      )
      for (let p = 0; p < allPoints.length; p++) {
        if (parseInt(allPoints[p].getAttribute('rel') ?? '0', 10) === j) {
          // Put back only what we previously grew. resetPointsSize() re-paths
          // EVERY marker in the chart, which on this (non-shared) path ran per
          // hover and made it cost more than the shared tooltip it is usually
          // reached for to avoid. Everything that enlarges a marker goes
          // through Marker.newPointSize, so the tracked set is complete; the
          // zero-size `M0,0` branch resetPointsSize also handles only applies
          // to dynamic points, which exist solely when largestSize is 0 or
          // markers are batched — neither of which reaches this branch.
          ttCtx.marker.resetEnlargedPoints()
          ttCtx.marker.enlargeCurrentPoint(j, allPoints[p])
          break
        }
      }
    } else {
      ttCtx.marker.resetPointsSize()
      this.moveDynamicPointOnHover(j, i)
    }
  }

  // This function is used when you need to show markers/points only on hover -
  // DIFFERENT X VALUES in multiple series
  /**
   * @param {number} j
   * @param {number} capturedSeries
   */
  moveDynamicPointOnHover(j, capturedSeries) {
    const w = this.w
    const ttCtx = this.ttCtx
    let cx = 0
    let cy = 0
    const graphics = new Graphics(this.w)

    const pointsArr = w.globals.pointsArray

    const hoverSize = ttCtx.tooltipUtil.getHoverMarkerSize(capturedSeries)

    const serType = /** @type {any} */ (w.config.series[capturedSeries]).type
    if (
      serType &&
      (serType === 'column' ||
        serType === 'candlestick' ||
        serType === 'boxPlot' ||
        serType === 'violin')
    ) {
      // fix error mentioned in #811
      return
    }

    cx = pointsArr[capturedSeries]?.[j]?.[0]
    // A point on the plot's top edge has y = 0: a position, not a missing
    // value. Only a missing one (null) falls back to 0 and draws no dot; the
    // old `|| 0` and `> 0` hid the dot on the series' highest point.
    const pointY = pointsArr[capturedSeries]?.[j]?.[1]
    const hasPoint = Number.isFinite(pointY)
    cy = hasPoint ? /** @type {number} */ (pointY) : 0

    const point = w.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${capturedSeries}'] .apexcharts-series-markers path`,
    )

    if (point && hasPoint && cy <= w.layout.gridHeight && cy >= 0) {
      const shape = point.getAttribute('shape') ?? 'circle'

      const path = graphics.getMarkerPath(cx, cy, shape, hoverSize * 1.5)
      point.setAttribute('d', path)
    }

    this.moveXCrosshairs(cx)

    if (!ttCtx.fixedTooltip) {
      // The hover dot above is drawn half again as big as hoverSize.
      const r = hoverSize * 1.5
      this.moveTooltip(cx, cy, hoverSize, { top: cy - r, bottom: cy + r })
    }
  }

  // This function is used when you need to show markers/points only on hover -
  // SAME X VALUES in multiple series
  /**
   * @param {number} j
   */
  moveDynamicPointsOnHover(j) {
    const ttCtx = this.ttCtx
    const w = ttCtx.w
    let cx = 0
    let cy = 0
    let activeSeries = 0

    const pointsArr = w.globals.pointsArray

    const series = new Series(this.w)
    const graphics = new Graphics(this.w)

    activeSeries = series.getActiveConfigSeriesIndex('asc', [
      'line',
      'area',
      'scatter',
      'bubble',
    ])

    const hoverSize = ttCtx.tooltipUtil.getHoverMarkerSize(activeSeries)

    // y = 0 is the plot's top edge (the series' highest point on a tight
    // axis), not a missing value: only a missing point falls back below.
    let hasPoint = false
    if (pointsArr[activeSeries]?.[j]) {
      cx = pointsArr[activeSeries][j][0]
      cy = pointsArr[activeSeries][j][1]
      hasPoint = Number.isFinite(cy)
    }
    if (isNaN(cx)) {
      return
    }

    const points = ttCtx.tooltipUtil.getAllMarkers()

    if (points.length) {
      for (let p = 0; p < w.seriesData.series.length; p++) {
        const pointArr = pointsArr[p]

        if (w.globals.comboCharts) {
          // in a combo chart, if column charts are present, markers will not match with the number of series, hence this patch to push a null value in points array
          if (typeof pointArr === 'undefined') {
            // nodelist to array
            points.splice(p, 0, null)
          }
        }
        // points[p] is null when the series has no marker node (canvas mode
        // paints markers to a bitmap): the box still positions off pointsArr
        // below, only the hover-indicator dot update is skipped.
        if (points[p] && pointArr && pointArr.length) {
          let pcy = pointsArr[p][j][1]
          let pcy2
          points[p].setAttribute('cx', cx)

          const shape = points[p].getAttribute('shape') ?? 'circle'

          if (w.config.chart.type === 'rangeArea' && !w.globals.comboCharts) {
            const rangeStartIndex = j + w.seriesData.series[p].length
            pcy2 = pointsArr[p][rangeStartIndex][1]
            const pcyDiff = Math.abs(pcy - pcy2) / 2

            pcy = pcy - pcyDiff
          }
          if (
            pcy !== null &&
            !isNaN(pcy) &&
            pcy < w.layout.gridHeight + hoverSize &&
            pcy + hoverSize > 0
          ) {
            const path = graphics.getMarkerPath(cx, pcy, shape, hoverSize)
            points[p].setAttribute('d', path)
          } else {
            points[p].setAttribute('d', '')
          }
        }
      }
    }

    this.moveXCrosshairs(cx)

    if (!ttCtx.fixedTooltip) {
      this.moveTooltip(
        cx,
        hasPoint ? cy : w.layout.gridHeight,
        hoverSize,
        this.isShortPlot() ? this.columnExtent(j, hoverSize) : null,
      )
    }
  }

  /**
   * Grid-local vertical extent of every visible series' point at index `j`
   * (both ends of a range), padded by the hover marker's size: what a shared
   * tooltip on a short plot sits above, so it covers none of them. Null when
   * no series has a point there inside the plot.
   *
   * @param {number} j
   * @param {number} pad
   * @returns {{ top: number, bottom: number } | null}
   */
  columnExtent(j, pad) {
    const w = this.w
    const gl = w.globals
    const pointsArr = gl.pointsArray || []
    const isRange = w.config.chart.type === 'rangeArea' && !gl.comboCharts
    let top = Infinity
    let bottom = -Infinity
    for (let p = 0; p < pointsArr.length; p++) {
      if (
        gl.collapsedSeriesIndices?.indexOf(p) > -1 ||
        gl.ancillaryCollapsedSeriesIndices?.indexOf(p) > -1
      ) {
        continue
      }
      const ys = [pointsArr[p]?.[j]?.[1]]
      if (isRange) {
        ys.push(pointsArr[p]?.[j + (w.seriesData.series[p]?.length ?? 0)]?.[1])
      }
      for (const y of ys) {
        if (
          Number.isFinite(y) &&
          y >= -pad &&
          y <= w.layout.gridHeight + pad
        ) {
          top = Math.min(top, y)
          bottom = Math.max(bottom, y)
        }
      }
    }
    return Number.isFinite(top) ? { top: top - pad, bottom: bottom + pad } : null
  }

  /**
   * @param {number} j
   * @param {number} capturedSeries
   */
  moveStickyTooltipOverBars(j, capturedSeries) {
    const w = this.w
    const ttCtx = this.ttCtx

    let barLen = w.globals.columnSeries
      ? /** @type {any} */ (w.globals.columnSeries).length
      : w.seriesData.series.length

    if (w.config.chart.stacked) {
      barLen = w.globals.barGroups.length
    }

    let i =
      barLen >= 2 && barLen % 2 === 0
        ? Math.floor(barLen / 2)
        : Math.floor(barLen / 2) + 1

    if (w.globals.isBarHorizontal) {
      const series = new Series(this.w)
      i = series.getActiveConfigSeriesIndex('desc') + 1
    }
    // A violin's mark is its body (`.apexcharts-violin-area`), never the
    // jitter path that shares its `j`: on canvas the jitter is the only path
    // left in the group, and its missing cx/cy pinned the box to the origin.
    let jBar = w.dom.baseEl.querySelector(
      `.apexcharts-bar-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-candlestick-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-boxPlot-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-violin-series .apexcharts-series[rel='${i}'] path.apexcharts-violin-area[j='${j}'], .apexcharts-rangebar-series .apexcharts-series[rel='${i}'] path[j='${j}']`,
    )
    if (!jBar && typeof capturedSeries === 'number') {
      // Try with captured series index
      jBar = w.dom.baseEl.querySelector(
        `.apexcharts-bar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
        .apexcharts-candlestick-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
        .apexcharts-boxPlot-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
        .apexcharts-violin-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path.apexcharts-violin-area[j='${j}'],
        .apexcharts-rangebar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}']`,
      )
    }

    // Strata (#2): canvas has no bar/candle path node, so fall back to the
    // center coords cached at draw time (Bar.renderSeries): otherwise the
    // tooltip would anchor to the origin. Keyed by realIndex: try the captured
    // series first, then any series that has a bar at j.
    let bc = null
    /** @type {number | null} */
    let violinCx = null
    const bcc = /** @type {any} */ (w.globals).barCanvasCoords
    if (!jBar && bcc) {
      bc =
        (typeof capturedSeries === 'number' && bcc[capturedSeries]?.[j]) || null
      if (!bc) {
        for (const key in bcc) {
          if (bcc[key]?.[j]) {
            bc = bcc[key][j]
            break
          }
        }
      }
      // Violins painted to canvas keep their painted extent (Violin.draw), so
      // they are read the way the query above reads the SVG bodies: down from
      // the series it picks (rel = i), not the hovered one, and across from
      // the middle of the category, halfway between the centre lines of the
      // outermost violins at j, where the SVG chart's axis ticks put it. The
      // hovered violin alone sits off that middle in a grouped chart, and a
      // raincloud's extent does too: its half-violin hangs to one side.
      if (bc?.bounds) {
        const relSeries = w.dom.baseEl.querySelector(
          `.apexcharts-violin-series .apexcharts-series[rel='${i}']`,
        )
        const relIndex = parseInt(
          relSeries?.getAttribute('data:realIndex') ?? '',
          10,
        )
        const picked = bcc[relIndex]?.[j]
        if (picked?.bounds) bc = picked
        const across = this._canvasViolinsAt(j)
        if (across && !w.globals.isBarHorizontal) violinCx = across.cx
      }
    }

    const hasBar = !!jBar || !!bc
    let bcx = jBar
      ? parseFloat(jBar.getAttribute('cx') ?? '0')
      : (violinCx ?? (bc ? bc.cx : 0))
    let bcy = jBar ? parseFloat(jBar.getAttribute('cy') ?? '0') : bc ? bc.cy : 0
    const bw = jBar
      ? parseFloat(jBar.getAttribute('barWidth') ?? '0')
      : bc
        ? bc.barWidth
        : 0

    const elGrid = ttCtx.getElGrid()
    if (!elGrid) return
    const seriesBound = TooltipUtils.plotRect(w)

    const isBoxOrCandle =
      jBar &&
      (jBar.classList.contains('apexcharts-candlestick-area') ||
        jBar.classList.contains('apexcharts-boxPlot-area'))
    if (w.axisFlags.isXNumeric) {
      // The `cx` attribute on bars is set in bar/DataLabels.js using
      // `x + barWidth * (visibleSeries + 1)` (numeric path) which does NOT
      // correspond to the bar's rendered center — especially for stacked
      // and grouped column charts on a numeric/datetime axis (cx ends up
      // offset by up to a full barWidth from the actual center). The
      // legacy `bcx - bw/2` adjustment is a partial fix that only worked
      // for odd-count series. Use the bar's rendered DOM rect instead so
      // the data-point center is correct regardless of stack/group layout.
      if (jBar && !isBoxOrCandle) {
        const center = this._datapointCenterXFromBars(j)
        if (center != null) {
          bcx = center
        } else {
          // Fallback to the legacy attribute-based math when no bars are
          // available (e.g. all series at index `j` collapsed).
          bcx = bcx - (barLen % 2 !== 0 ? bw / 2 : 0)
        }
      }

      if (
        jBar && // fixes apexcharts.js#2354
        isBoxOrCandle
      ) {
        bcx = bcx - bw / 2
      }
    } else {
      // Canvas cache (bc) already holds the rendered center; the tick-position
      // math is both unnecessary and unreliable at canvas densities (sparse
      // xAxisTicksPositions -> NaN), so keep bc.cx when present.
      if (!w.globals.isBarHorizontal && !bc) {
        bcx =
          ttCtx.xAxisTicksPositions[j - 1] + ttCtx.dataPointsDividedWidth / 2
        if (isNaN(bcx)) {
          bcx = ttCtx.xAxisTicksPositions[j] - ttCtx.dataPointsDividedWidth / 2
        }
      }
    }

    if (!w.globals.isBarHorizontal) {
      if (TooltipUtils.isFollowCursor(w)) {
        bcy = ttCtx.e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2
      } else {
        if (bcy + ttCtx.tooltipRect.ttHeight + 15 > w.layout.gridHeight) {
          bcy = w.layout.gridHeight
        }
      }
    } else {
      bcy = bcy - ttCtx.tooltipRect.ttHeight
    }

    if (!w.globals.isBarHorizontal) {
      this.moveXCrosshairs(bcx)
    }

    if (!ttCtx.fixedTooltip) {
      // Horizontal bar (incl. multi-series shared, funnel, pyramid, timeline,
      // range-bar horizontal): place tooltip above/below the entire row of
      // bars at index `j` so it doesn't sit on top of the bar (the legacy
      // left/right placement put it at the bar's value-end, which reads as
      // "tooltip goes to the right"), and beside the row only when it fits
      // neither above nor below. Computed from the union rect of every bar
      // with `[j='${j}']` across visible series.
      if (w.globals.isBarHorizontal && !TooltipUtils.isFollowCursor(w)) {
        const placed = this.placeHorizontalSharedTooltip(j)
        if (placed) return
      }
      // On a short plot the box sits above the bars at `j`, all of them: `bcy`
      // has been clamped to the plot's bottom by now and says nothing about
      // where they are. Bars painted to a canvas leave no rects, so the whole
      // plot stands in for them.
      const mark = this.isShortPlot()
        ? (this._barsExtentInGrid(j) ?? { top: 0, bottom: w.layout.gridHeight })
        : null
      // `bcy` is the bar's value end, and a bar reaching the plot's top has
      // it at 0: a position, not a missing bar. Only with no bar at `j` (and
      // no pointer to follow) does the box drop to the plot's bottom.
      const anchorY =
        !Number.isFinite(bcy) ||
        (bcy === 0 && !hasBar && !TooltipUtils.isFollowCursor(w))
          ? w.layout.gridHeight
          : bcy
      this.moveTooltip(bcx, anchorY, null, mark)
    }
  }

  /**
   * Every visible violin at index `j` painted to canvas, from what
   * Violin.draw caches for each (`barCanvasCoords`), in plot px: the extent
   * of them all, and `cx`, halfway between the outermost centre lines (a
   * vertical violin's cached `cx`). Null when none was painted.
   * @param {number} j
   * @returns {{ left: number, top: number, right: number, bottom: number, cx: number } | null}
   */
  _canvasViolinsAt(j) {
    const w = this.w
    const bcc = /** @type {any} */ (w.globals).barCanvasCoords
    if (!bcc) return null
    const collapsed = w.globals.collapsedSeriesIndices || []
    let left = Infinity
    let top = Infinity
    let right = -Infinity
    let bottom = -Infinity
    let first = Infinity
    let last = -Infinity
    for (const key in bcc) {
      const c = bcc[key]?.[j]
      const b = c?.bounds
      if (!b || collapsed.includes(Number(key))) continue
      left = Math.min(left, b.left)
      top = Math.min(top, b.top)
      right = Math.max(right, b.right)
      bottom = Math.max(bottom, b.bottom)
      first = Math.min(first, c.cx)
      last = Math.max(last, c.cx)
    }
    return Number.isFinite(left)
      ? { left, top, right, bottom, cx: (first + last) / 2 }
      : null
  }

  /**
   * Vertical extent of every visible bar-like mark at index `j` (bars,
   * candles, boxes), from their painted rects, in the grid-local space
   * `moveTooltip` reads a mark in: it adds translateY to come back to elWrap
   * px, so the extent is measured from elWrap's top plus translateY. Measured
   * from the plot's corner instead it lands chart.offsetY off, which
   * translateY leaves out. Null when there are none.
   * @param {number} j
   * @returns {{ top: number, bottom: number } | null}
   */
  _barsExtentInGrid(j) {
    const w = this.w
    const marks = w.dom.baseEl.querySelectorAll(
      `.apexcharts-bar-series path[j='${j}'],` +
        `.apexcharts-rangebar-series path[j='${j}'],` +
        `.apexcharts-candlestick-series path[j='${j}'],` +
        `.apexcharts-boxPlot-series path[j='${j}'],` +
        `.apexcharts-violin-series path[j='${j}']`,
    )
    if (!marks.length) return null
    let top = Infinity
    let bottom = -Infinity
    for (let k = 0; k < marks.length; k++) {
      const mark = marks[k]
      const parent = /** @type {Element|null} */ (mark.parentNode)
      if (parent?.classList?.contains?.('apexcharts-series-collapsed')) continue
      const r = mark.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      top = Math.min(top, r.top)
      bottom = Math.max(bottom, r.bottom)
    }
    if (!Number.isFinite(top)) return null
    const origin =
      w.dom.elWrap.getBoundingClientRect().top + w.layout.translateY
    return { top: top - origin, bottom: bottom - origin }
  }

  /**
   * Place tooltip above (or flipped: below) the union rect of all bars at
   * dataPointIndex `j` for horizontal-bar-likes. Returns true when a
   * Compute the true horizontal center of dataPointIndex `j` in grid-local
   * coords from the union of every visible bar's `getBoundingClientRect()`.
   * Used as a replacement for the (buggy on numeric/datetime xaxis) `cx`
   * attribute math in `moveStickyTooltipOverBars`. Returns null when no
   * usable bars are found.
   * @param {number} j
   * @returns {number | null}
   */
  _datapointCenterXFromBars(j) {
    const w = this.w
    const bars = w.dom.baseEl.querySelectorAll(
      `.apexcharts-bar-series path[j='${j}'],` +
        `.apexcharts-rangebar-series path[j='${j}']`,
    )
    if (!bars.length) return null

    let unionLeft = Infinity
    let unionRight = -Infinity
    for (const bar of bars) {
      const parent = /** @type {Element|null} */ (bar.parentNode)
      if (parent?.classList?.contains?.('apexcharts-series-collapsed')) continue
      const r = /** @type {Element} */ (bar).getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      if (r.left < unionLeft) unionLeft = r.left
      if (r.right > unionRight) unionRight = r.right
    }
    if (!isFinite(unionLeft)) return null
    // Convert to data-area-local x from the plot origin, the space `cx` and the
    // crosshair are already in. Measuring from the `.apexcharts-grid` element
    // rect instead only works while the grid draws nothing outside its own box.
    return AxisMapping.screenXToPlotPx(w, (unionLeft + unionRight) / 2)
  }

  /**
   * Place tooltip above (or flipped: below, or beside) the union rect of all
   * bars at dataPointIndex `j` for horizontal-bar-likes. Returns true when a
   * placement was applied; false when no bars found (caller falls back).
   * @param {number} j
   * @returns {boolean}
   */
  placeHorizontalSharedTooltip(j) {
    const w = this.w
    const ttCtx = this.ttCtx
    const tooltipEl = ttCtx.getElTooltip()
    if (!tooltipEl) return false

    const elGrid = ttCtx.getElGrid()
    if (!elGrid) return false

    // Match every bar variant that uses the j-attribute and isBarHorizontal:
    // bar, rangeBar, boxPlot (boxPlot's `horizontal` is enforced false at
    // config-time, but the selector is harmless), and violin, read as its
    // whole glyph: body, box lane and jitter or rain, so the box clears a
    // raincloud's lanes as well as its cloud.
    const bars = w.dom.baseEl.querySelectorAll(
      `.apexcharts-bar-series path[j='${j}'],` +
        `.apexcharts-rangebar-series path[j='${j}'],` +
        `.apexcharts-boxPlot-series path[j='${j}'],` +
        `.apexcharts-violin-series path.apexcharts-violin-area[j='${j}'],` +
        `.apexcharts-violin-series path.apexcharts-violin-points[j='${j}']`,
    )
    // Violin bodies painted to canvas leave no path, only their extent.
    const painted = this._canvasViolinsAt(j)
    if (!bars.length && !painted) return false

    let unionLeft = Infinity
    let unionRight = -Infinity
    let unionTop = Infinity
    let unionBottom = -Infinity
    if (painted) {
      const plot = TooltipUtils.plotRect(w)
      unionLeft = plot.left + painted.left * plot.zoom
      unionRight = plot.left + painted.right * plot.zoom
      unionTop = plot.top + painted.top * plot.zoom
      unionBottom = plot.top + painted.bottom * plot.zoom
    }
    for (const bar of bars) {
      // Skip bars belonging to collapsed series (parent has the
      // `apexcharts-series-collapsed` class).
      const parent = /** @type {Element|null} */ (bar.parentNode)
      if (parent?.classList?.contains?.('apexcharts-series-collapsed')) continue
      const r = /** @type {Element} */ (bar).getBoundingClientRect()
      if (r.width === 0 && r.height === 0) continue
      if (r.left < unionLeft) unionLeft = r.left
      if (r.right > unionRight) unionRight = r.right
      if (r.top < unionTop) unionTop = r.top
      if (r.bottom > unionBottom) unionBottom = r.bottom
    }
    if (!isFinite(unionLeft)) return false

    // Convert union rect (viewport-coords) into elWrap-coords, where the
    // tooltip is positioned via style.left/top. The plot's corner there is
    // measured too (TooltipUtils.plotInWrap), not taken to be
    // (translateX, translateY), which leave out chart.offsetX/offsetY.
    const wrap = w.dom.elWrap.getBoundingClientRect()
    const rowLeftElWrap = unionLeft - wrap.left
    const rowRightElWrap = unionRight - wrap.left
    const rowCenterX = (rowLeftElWrap + rowRightElWrap) / 2
    const rowTopElWrap = unionTop - wrap.top
    const rowBottomElWrap = unionBottom - wrap.top

    const { left: gridLeft, top: gridTop } = TooltipUtils.plotInWrap(w)
    const gridBottom = gridTop + w.layout.gridHeight
    const gridRight = gridLeft + w.layout.gridWidth

    // A plot too short for the box: directly above the row (or below it)
    // wherever the page has room, out of the plot if need be, rather than
    // clamped over the other rows.
    const stacked = this.placeOnShortPlot(
      rowCenterX,
      rowTopElWrap,
      rowBottomElWrap,
    )
    if (stacked) {
      this.applyTooltipPosition(tooltipEl, stacked)
      return true
    }

    // Above or below the row inside the plot, then above or below it out of
    // the plot where the page has room, and only then beside it, past its
    // value end. A box that fit neither above nor below used to stay above
    // the row regardless, past the plot's top and, near the top of the page,
    // off the screen.
    this.applyTooltipPosition(
      tooltipEl,
      this.placeAroundBar(
        {
          top: rowTopElWrap,
          bottom: rowBottomElWrap,
          left: rowLeftElWrap,
          right: rowRightElWrap,
        },
        { top: gridTop, bottom: gridBottom, left: gridLeft, right: gridRight },
        j,
      ),
    )
    return true
  }
}
