// @ts-check
import Graphics from '../Graphics'
import TooltipUtils from '../tooltip/Utils'
import Utils from '../../utils/Utils'

/**
 * ApexCharts KeyboardNavigation
 *
 * Enables keyboard users to navigate between data points using arrow keys and
 * trigger tooltips without a mouse. Plugs into the existing tooltip pipeline —
 * no new rendering logic is introduced.
 *
 * Key bindings (active when the chart SVG has focus):
 *   ArrowRight / ArrowLeft:  next / previous data point
 *   ArrowUp    / ArrowDown:  previous / next series (skips collapsed); on a
 *                            heatmap, the row above / below
 *   Home:                    first data point in current series
 *   End:                     last data point in current series
 *   Enter / Space:           fire markerClick event (same as mouse click)
 *   Escape:                  exit keyboard nav, return focus to SVG
 */
export default class KeyboardNavigation {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: ctx.events.addEventListener/removeEventListener

    // Current navigation cursor
    this.seriesIndex = 0
    this.dataPointIndex = 0
    this.active = false

    // True after the user presses Escape once: tooltip is dismissed but the
    // chart still has focus. A second Escape exits keyboard nav entirely.
    // Matches WCAG 1.4.13 technique G194 (dismissible content on focus).
    this._tooltipDismissed = false

    // Previously focused SVG element (for removing the focus class)
    this._focusedEl = null

    // SVG.js wrapper of the currently hovered bar element, so we can call
    // pathMouseLeave when navigating away or losing focus.
    this._hoveredBarEl = null

    // The scatter/bubble marker element that was enlarged by keyboard nav,
    // so we can reset only that one element on the next navigation step
    // (avoids calling resetPointsSize() on all markers which triggers spurious
    // mouseout events on the whole marker set, causing resize jitter).
    this._enlargedScatterMarker = null

    // Bound handlers (stored so we can removeEventListener later)
    this._onKeyDown = this._onKeyDown.bind(this)
    this._onFocus = this._onFocus.bind(this)
    this._onBlur = this._onBlur.bind(this)
    this._onLegendClick = this._onLegendClick.bind(this)
    this._onPointerDown = this._onPointerDown.bind(this)

    // Timestamp (ms) of the last pointer-down inside the chart. We use this
    // in `_onFocus` to skip keyboard-nav activation when the focus was
    // induced by a mouse click — clicking anywhere on the chart auto-focuses
    // the SVG which would otherwise force the tooltip to flicker to the
    // default cursor (j=0). 100 ms is plenty: focus follows mousedown within
    // microseconds in real browsers; keyboard-driven focus has no recent
    // pointer activity so the check passes.
    this._lastPointerDownAt = 0
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Called after the chart and tooltip have been fully rendered.
   * Attaches event listeners and makes the SVG keyboard-focusable.
   */
  init() {
    const w = this.w
    const svgEl = w.dom.Paper.node

    if (!svgEl) return

    svgEl.setAttribute('tabindex', '0')
    svgEl.addEventListener('focus', this._onFocus)
    svgEl.addEventListener('blur', this._onBlur)
    // Capture-phase pointerdown/mousedown listener so `_onFocus` (which
    // fires AFTER the pointer event when the browser auto-focuses the SVG)
    // can detect that the focus is mouse-induced and bail out.
    svgEl.addEventListener('mousedown', this._onPointerDown, { capture: true })
    svgEl.addEventListener('pointerdown', this._onPointerDown, {
      capture: true,
    })
    svgEl.addEventListener('touchstart', this._onPointerDown, {
      capture: true,
      passive: true,
    })
    // Use a non-passive keydown listener directly on the SVG so that
    // preventDefault() works (required to suppress page scroll on arrow keys).
    // Events.js listens on the ancestor canvas div as passive:true, so it
    // cannot call preventDefault — we handle navigation here instead.
    svgEl.addEventListener('keydown', this._onKeyDown, { passive: false })

    // When the user clicks a legend item (collapse/expand a series), hide the
    // keyboard-nav tooltip so it doesn't remain stuck on screen while the chart
    // re-renders with a different set of visible series.
    this.ctx.events.addEventListener('legendClick', this._onLegendClick)
  }

  /**
   * Removes all event listeners. Called from chart.destroy().
   */
  destroy() {
    const w = this.w
    const svgEl = w.dom.Paper && w.dom.Paper.node

    // Remove the ctx-level listener first, before the svgEl guard: on an update
    // the Paper node is torn down before this runs, so an early return here would
    // skip it and leak the listener on the persistent w.globals.events. The
    // svgEl listeners below die with the removed node, so guarding them is fine.
    this.ctx.events.removeEventListener('legendClick', this._onLegendClick)

    if (!svgEl) return

    svgEl.removeEventListener('focus', this._onFocus)
    svgEl.removeEventListener('blur', this._onBlur)
    svgEl.removeEventListener('keydown', this._onKeyDown)
    svgEl.removeEventListener(
      'mousedown',
      this._onPointerDown,
      /** @type {any} */ ({ capture: true }),
    )
    svgEl.removeEventListener(
      'pointerdown',
      this._onPointerDown,
      /** @type {any} */ ({ capture: true }),
    )
    svgEl.removeEventListener(
      'touchstart',
      this._onPointerDown,
      /** @type {any} */ ({ capture: true }),
    )
  }

  // Records the timestamp of the most recent pointer-down inside the SVG.
  // `_onFocus` reads this to distinguish keyboard-driven focus (no recent
  // pointer activity) from mouse-driven focus (pointer event within the
  // last 100 ms). Stays a no-op for keyboard users.
  _onPointerDown() {
    this._lastPointerDownAt = Date.now()
  }

  /**
   * Note that a pointer gesture is about to move focus into the chart.
   *
   * The 100 ms window above catches the browser's own click-to-focus, which
   * lands immediately. A drag-zoom moves focus deliberately, and only once its
   * re-render is done (ZoomPanSelection#_focusForKeyboard), which is far
   * outside that window. Without this it reads as a viewer asking to navigate
   * by keyboard, which activates nav and flashes a tooltip at the first visible
   * point after every zoom.
   */
  notePointerFocus() {
    this._lastPointerDownAt = Date.now()
  }

  /**
   * Called from Events.js keydown handler. Navigation keys are already handled
   * by the direct SVG listener (which can call preventDefault). This entry
   * point is intentionally a no-op — Events.js still fires the public keyDown
   * callback and fireEvent('keydown') independently.
   * @param {Event} _e
   */
  handleKey(_e) {
    // No-op: navigation is handled by the non-passive SVG keydown listener
    // added in init(). Keeping this method so Events.js doesn't need changes.
  }

  // ─── Focus / blur ─────────────────────────────────────────────────────────

  _onFocus() {
    if (!this._isNavEnabled()) return
    // Don't react to mouse-induced focus. When the user clicks anywhere in
    // the chart, the browser auto-focuses the SVG and fires `focus`, which
    // would otherwise activate keyboard-nav and force the tooltip to jump
    // to the default cursor (seriesIndex=0, dataPointIndex=0) — visible as
    // a one-frame "flicker to j=0" before the mouse-hover tooltip recovers.
    //
    // We track the timestamp of the last pointerdown inside the SVG (see
    // `_onPointerDown`). A focus event firing within 100 ms of a pointer
    // event means the focus was caused by that pointer event — bail. This
    // is more reliable than `:focus-visible` (which jsdom doesn't support)
    // and works identically across real browsers.
    if (Date.now() - this._lastPointerDownAt < 100) {
      return
    }
    this.active = true
    // Clamp cursor to valid range in case series/data changed since last focus
    this._clampCursor()
    // If the chart is zoomed, snap the cursor to the first visible data point
    // so the user doesn't start navigating outside the current viewport.
    this._snapToVisibleRange()
    this._showCurrentPoint()
  }

  _onBlur() {
    this.active = false
    this._tooltipDismissed = false
    this._hideFocus()
  }

  // Called when the user clicks a legend item (collapse/expand a series).
  // Hide the keyboard-nav tooltip — the chart is about to re-render and the
  // current position may no longer be valid.
  _onLegendClick() {
    if (!this.active) return
    this.active = false
    this._hideFocus()
  }

  // ─── Key handler ──────────────────────────────────────────────────────────

  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    if (!this._isNavEnabled() || !this.active) return

    // Shift+Arrow → pan the visible x-range (when zoom is enabled).
    // Has to come before the plain Arrow cases so the modifier wins.
    if (
      e.shiftKey &&
      (e.key === 'ArrowRight' || e.key === 'ArrowLeft') &&
      this._canPan()
    ) {
      e.preventDefault()
      this._panBy(e.key === 'ArrowRight' ? 1 : -1)
      return
    }

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        this._move(0, 1)
        break
      case 'ArrowLeft':
        e.preventDefault()
        this._move(0, -1)
        break
      case 'ArrowUp':
        e.preventDefault()
        this._move(-1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        this._move(1, 0)
        break
      case 'Home':
        e.preventDefault()
        this.dataPointIndex = 0
        this._skipNullForward()
        this._showCurrentPoint()
        break
      case 'End':
        e.preventDefault()
        this.dataPointIndex = this._getDataPointCount(this.seriesIndex) - 1
        this._skipNullBackward()
        this._showCurrentPoint()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        this._fireClick()
        break
      case '+':
      case '=':
        // '=' for unshifted '+' on most US keyboards
        if (this._canZoom()) {
          e.preventDefault()
          this.ctx.toolbar?.handleZoomIn()
          this._announce('Zoomed in')
        }
        break
      case '-':
      case '_':
        if (this._canZoom()) {
          e.preventDefault()
          this.ctx.toolbar?.handleZoomOut()
          this._announce('Zoomed out')
        }
        break
      case '0':
        if (this._canZoom() && this.w.interact.zoomed) {
          e.preventDefault()
          this.ctx.toolbar?.handleZoomReset()
          this._announce('Zoom reset')
        }
        break
      case 'Escape':
        e.preventDefault()
        // Two-stage: first Escape dismisses the tooltip but keeps focus on
        // the chart so the user can resume nav; second Escape exits nav.
        if (!this._tooltipDismissed) {
          this._tooltipDismissed = true
          this._hideFocus()
        } else {
          this.active = false
          this._tooltipDismissed = false
          this._hideFocus()
        }
        break
      default:
        break
    }
  }

  // ─── Zoom / pan (keyboard alternatives for drag gestures) ─────────────────

  _canZoom() {
    const w = this.w
    return Boolean(
      w.globals.axisCharts && w.config.chart.zoom && w.config.chart.zoom.enabled,
    )
  }

  _canPan() {
    // Pan only meaningful once the chart is zoomed in (otherwise full data is
    // already visible). We still allow it whenever zoom is enabled — the
    // toolbar's zoomUpdateOptions clamps to data bounds.
    return this._canZoom()
  }

  /**
   * Shift the visible x-range by ~10% in the given direction.
   * @param {number} direction +1 = right, -1 = left
   */
  _panBy(direction) {
    const w = this.w
    const toolbar = this.ctx.toolbar
    if (!toolbar) return

    const minX = Number(w.globals.minX)
    const maxX = Number(w.globals.maxX)
    if (!isFinite(minX) || !isFinite(maxX) || minX === maxX) return

    const span = maxX - minX
    const step = span * 0.1 * direction
    toolbar.zoomUpdateOptions(minX + step, maxX + step)
    this._announce(direction > 0 ? 'Panned right' : 'Panned left')
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  /**
   * @param {number} dSeries
   * @param {number} dPoint
   */
  _move(dSeries, dPoint) {
    const w = this.w
    const wrapAround =
      w.config.chart.accessibility.keyboard.navigation.wrapAround

    if (dSeries !== 0) {
      // When tooltip.shared = true AND x values actually align across all
      // series at the current index, the tooltip covers all series identically,
      // so ↑/↓ series switching would show the same content — suppress it.
      // For irregular time series the tooltip falls back to individual mode
      // (isXoverlap returns false), so up/down navigation is meaningful there.
      // A heatmap or treemap tooltip is always one cell's, whatever
      // tooltip.shared says (and it defaults to true), so ↑/↓ is the only
      // way to another row.
      const ttCtx = this.w.globals.tooltip
      const type = w.config.chart.type
      const perCell = type === 'heatmap' || type === 'treemap'
      if (!perCell && ttCtx && ttCtx.tConfig && ttCtx.tConfig.shared) {
        const j = this.dataPointIndex
        const isActuallyShared =
          ttCtx.tooltipUtil &&
          ttCtx.tooltipUtil.isXoverlap(j) &&
          ttCtx.tooltipUtil.isInitialSeriesSameLen()
        if (isActuallyShared) return
      }

      // A heatmap draws series 0 as its bottom row (its top row on a reversed
      // y axis), so ↑/↓ step through the series the way the rows run on
      // screen.
      if (type === 'heatmap' && !w.config.yaxis[0]?.reversed) {
        dSeries = -dSeries
      }

      // Move between series (↑/↓)
      const total = this._getSeriesCount()
      let si = this.seriesIndex + dSeries

      // Skip collapsed series
      let attempts = 0
      while (attempts < total) {
        if (si < 0) si = wrapAround ? total - 1 : 0
        if (si >= total) si = wrapAround ? 0 : total - 1

        if (!w.globals.collapsedSeriesIndices.includes(si)) break
        si += dSeries
        attempts++
      }

      this.seriesIndex = si

      // Keep dataPointIndex within bounds of the new series
      const dpCount = this._getDataPointCount(si)
      if (this.dataPointIndex >= dpCount) {
        this.dataPointIndex = dpCount - 1
      }
    }

    if (dPoint !== 0) {
      // Move between data points (←/→)
      const dpCount = this._getDataPointCount(this.seriesIndex)
      let di = this.dataPointIndex + dPoint

      if (di < 0) di = wrapAround ? dpCount - 1 : 0
      if (di >= dpCount) di = wrapAround ? 0 : dpCount - 1

      this.dataPointIndex = di

      // Skip null values
      if (dPoint > 0) {
        this._skipNullForward()
      } else {
        this._skipNullBackward()
      }

      // If the chart is zoomed, skip data points outside the visible range
      if (!this._isDataPointVisible(this.seriesIndex, this.dataPointIndex)) {
        this._snapToVisibleRangeInDirection(dPoint)
      }
    }

    this._showCurrentPoint()
  }

  /** Advance dataPointIndex forward past any nulls */
  _skipNullForward() {
    const w = this.w
    const si = this.seriesIndex
    const dpCount = this._getDataPointCount(si)
    let di = this.dataPointIndex
    let attempts = 0

    // Non-axis charts (pie, etc.) have flat numeric series — no nulls to skip
    if (!Array.isArray(w.seriesData.series[si])) return

    while (attempts < dpCount && w.seriesData.series[si][di] === null) {
      di = (di + 1) % dpCount
      attempts++
    }
    this.dataPointIndex = di
  }

  /** Retreat dataPointIndex backward past any nulls */
  _skipNullBackward() {
    const w = this.w
    const si = this.seriesIndex
    const dpCount = this._getDataPointCount(si)
    let di = this.dataPointIndex
    let attempts = 0

    // Non-axis charts (pie, etc.) have flat numeric series — no nulls to skip
    if (!Array.isArray(w.seriesData.series[si])) return

    while (attempts < dpCount && w.seriesData.series[si][di] === null) {
      di = (di - 1 + dpCount) % dpCount
      attempts++
    }
    this.dataPointIndex = di
  }

  // ─── Display ──────────────────────────────────────────────────────────────

  _showCurrentPoint() {
    const { seriesIndex: i, dataPointIndex: j } = this
    const w = this.w
    const ttCtx = w.globals.tooltip

    if (!ttCtx || !ttCtx.ttItems) return

    // Keep globals consistent with the rest of the system
    w.interact.capturedSeriesIndex = i
    w.interact.capturedDataPointIndex = j

    this._applyFocusClass(i, j)
    this._showTooltip(i, j, /** @type {any} */ (ttCtx))
  }

  _hideFocus() {
    const w = this.w
    const ttCtx = /** @type {any} */ (w.globals.tooltip)

    this._removeFocusClass()
    this._leaveHoveredBar()

    if (!ttCtx) return
    ttCtx.tooltipPosition?.resetPlacementCache()

    // Reset markers
    if (ttCtx.marker) {
      ttCtx.marker.resetPointsSize()
    }
    this._enlargedScatterMarker = null

    // Hide tooltip and crosshairs using the existing cleanup path
    const tooltipEl = ttCtx.getElTooltip()
    if (tooltipEl) {
      tooltipEl.classList.remove('apexcharts-active')
      if (
        w.config.chart.accessibility.enabled &&
        w.config.chart.accessibility.announcements.enabled
      ) {
        tooltipEl.setAttribute('aria-hidden', 'true')
      }
    }

    w.dom.baseEl.classList.remove('apexcharts-tooltip-active')

    const xcrosshairs = ttCtx.getElXCrosshairs()
    if (xcrosshairs) xcrosshairs.classList.remove('apexcharts-active')
  }

  // ─── Tooltip display per chart type ───────────────────────────────────────

  /**
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltip(i, j, ttCtx) {
    const w = this.w
    const type = w.config.chart.type

    // Make tooltip visible
    const tooltipEl = ttCtx.getElTooltip()
    if (!tooltipEl) return

    // tooltipRect is normally set by seriesHoverByContext on every mouse event.
    // When keyboard nav fires without any prior mouse interaction it is
    // undefined, which makes every positioning helper produce NaN/0 coords.
    // Populate it here from the cached dimensions so the tooltip appears at the
    // correct position even on the very first keyboard interaction.
    const cachedDims = ttCtx.getCachedDimensions()
    ttCtx.tooltipRect = {
      x: 0,
      y: 0,
      ttWidth: cachedDims.ttWidth || 0,
      ttHeight: cachedDims.ttHeight || 0,
    }

    // Several Position methods (moveTooltip, moveDynamicPointsOnHover,
    // moveStickyTooltipOverBars) branch on tooltip.followCursor and read
    // ttCtx.e.clientX/Y when it is true.  In keyboard nav there is no real
    // mouse event, so we synthesise one whose clientX/Y equal the element's
    // viewport centre.  This makes followCursor charts position the tooltip
    // at the data-point element instead of at 0,0 (or crashing on undefined).
    // We restore the original ttCtx.e after positioning so that no downstream
    // code is surprised.
    this._setSyntheticEvent(i, j, ttCtx)

    w.dom.baseEl.classList.add('apexcharts-tooltip-active')
    tooltipEl.classList.add('apexcharts-active')
    if (
      w.config.chart.accessibility.enabled &&
      w.config.chart.accessibility.announcements.enabled
    ) {
      tooltipEl.removeAttribute('aria-hidden')
    }

    if (type === 'pie' || type === 'donut' || type === 'polarArea') {
      this._showTooltipNonAxis(i, j, ttCtx, tooltipEl)
    } else if (type === 'radialBar') {
      this._showTooltipRadialBar(i, j, ttCtx, tooltipEl)
    } else if (type === 'heatmap' || type === 'treemap') {
      this._showTooltipHeatTree(i, j, ttCtx, tooltipEl, type)
    } else if (this._isBarLikeSeries(i)) {
      this._showTooltipBar(i, j, ttCtx)
    } else {
      // line, area, scatter, bubble, radar, rangeArea
      this._showTooltipAxisLine(i, j, ttCtx)
    }

    // A fixed tooltip sits in its configured corner whatever is focused, as
    // it does whatever is hovered (Tooltip.seriesHoverByContext).
    if (ttCtx.fixedTooltip) ttCtx.drawFixedTooltipRect()
  }

  /**
   * Is series `i` drawn as a bar-like mark? Its own type decides in a combo,
   * as it decides what the pointer hovers there: the columns beside a line,
   * or the candles of a 'line' chart, are hovered as bars
   * (Intersect.handleBarTooltip), not as points on a line.
   * @param {number} i
   * @returns {boolean}
   */
  _isBarLikeSeries(i) {
    const w = this.w
    const series = /** @type {any} */ (w.config.series[i])
    const type = w.globals.comboCharts
      ? (series?.type ?? w.config.chart.type)
      : w.config.chart.type
    return TooltipUtils.isBarLikeType(type)
  }

  /**
   * Set ttCtx.e to a synthetic mouse-event-like object whose clientX/Y point
   * to the centre of the current data-point element.  This ensures that any
   * positioning helper that reads ttCtx.e (followCursor path in moveTooltip,
   * moveStickyTooltipOverBars, moveDynamicPointsOnHover, etc.) gets valid
   * coordinates rather than crashing on undefined.
   *
   * For chart types that don't have a concrete SVG element per data point
   * (pie, radialBar) we fall back to the SVG centre.
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _setSyntheticEvent(i, j, ttCtx) {
    const w = this.w
    const type = w.config.chart.type

    let clientX = 0
    let clientY = 0

    // Try to find the element and use its centre as the synthetic position
    const el = this._getFocusableElement(i, j)
    // a heatmap cell or a bar-like painted to canvas has no element, only the
    // box it was painted in
    const painted = el ? null : this._canvasCell(i, j) || this._canvasMark(i, j)
    if (el) {
      const rect = el.getBoundingClientRect()
      clientX = rect.left + rect.width / 2
      clientY = rect.top + rect.height / 2
    } else if (painted) {
      // Plot px to screen px from the plot's corner, as the pointer's hit
      // test maps them back (Intersect.handleHeatTreeTooltip,
      // Intersect.getPaintedMark).
      const plot = TooltipUtils.plotRect(w)
      clientX = plot.left + (painted.x + painted.width / 2) * plot.zoom
      clientY = plot.top + (painted.y + painted.height / 2) * plot.zoom
    } else if (
      w.globals.pointsArray &&
      w.globals.pointsArray[i] &&
      w.globals.pointsArray[i][j]
    ) {
      // Axis-line charts: derive from pointsArray pixel coords. They are
      // measured from the plot's corner, as the tooltip measures the pointer
      // when it reads it back; the grid group's box sits a pixel lower.
      const pt = w.globals.pointsArray[i][j]
      const elGrid = ttCtx.getElGrid && ttCtx.getElGrid()
      if (elGrid) {
        const plot = TooltipUtils.plotRect(w)
        clientX = plot.left + (pt[0] || 0) * plot.zoom
        clientY = plot.top + (pt[1] || 0) * plot.zoom
      }
    } else {
      // Fallback: SVG element centre
      const svgEl = w.dom.Paper && w.dom.Paper.node
      if (svgEl) {
        const svgRect = svgEl.getBoundingClientRect()
        clientX = svgRect.left + svgRect.width / 2
        clientY = svgRect.top + svgRect.height / 2
      }
    }

    // For line/area/rangeArea: pointsArray gives the most accurate position.
    // Not for the bars of a combo, whose own mark is the place to be.
    if (
      !this._isBarLikeSeries(i) &&
      (type === 'line' ||
        type === 'area' ||
        type === 'rangeArea' ||
        type === 'scatter' ||
        type === 'bubble' ||
        type === 'radar')
    ) {
      if (
        w.globals.pointsArray &&
        w.globals.pointsArray[i] &&
        w.globals.pointsArray[i][j]
      ) {
        const pt = w.globals.pointsArray[i][j]
        const elGrid = ttCtx.getElGrid && ttCtx.getElGrid()
        if (elGrid) {
          const plot = TooltipUtils.plotRect(w)
          clientX = plot.left + (pt[0] || 0) * plot.zoom
          clientY = plot.top + (pt[1] || 0) * plot.zoom
        }
      }
    }

    ttCtx.e = { type: 'mousemove', clientX, clientY }
    // The box that follows the pointer reads this chart's own pointer first
    // (Position.computeTooltipPosition) and the event only without one. It
    // starts at 0, 0, which is a pointer, and after a hover it is wherever
    // the mouse last was, so the box went to the chart's corner or back to
    // the mouse instead of to the focused mark.
    ttCtx.clientX = clientX
    ttCtx.clientY = clientY
  }

  /**
   * bar / column / candlestick / boxPlot / rangeBar
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipBar(i, j, ttCtx) {
    const w = this.w

    // Focus coming from a line of a combo leaves its point enlarged; the
    // pointer's mouseout off that point shrinks it (Tooltip.handleMouseOut).
    if (w.globals.comboCharts) {
      ttCtx.marker.resetPointsSize()
      this._enlargedScatterMarker = null
    }

    // Mirror the runtime check in handleStickyCapturedSeries: only use shared
    // mode when x values actually align across all series at this index.
    const shared =
      ttCtx.tConfig.shared &&
      (ttCtx.tooltipUtil.isXoverlap(j) || w.globals.isBarHorizontal) &&
      ttCtx.tooltipUtil.isInitialSeriesSameLen()

    // Draw tooltip text content
    const rangeData = /** @type {any} */ (w.rangeData.seriesRange)?.[i]?.[j]
      ?.y?.[0]
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      ...(rangeData?.y1 !== undefined && { y1: rangeData.y1 }),
      ...(rangeData?.y2 !== undefined && { y2: rangeData.y2 }),
      shared,
    })

    // Apply the hover visual state on the bar.
    // Use Paper.findOne() to get the SVG.js wrapper (same as toggleDataPointSelection
    // in UpdateHelpers.js) — querySelector returns a plain DOM node which lacks the
    // .node property that pathMouseEnter requires.
    // A bar painted to canvas has no node to take it, and whatever node of
    // the series still carries this `j` (a box plot's or a violin's jitter)
    // is not the bar.
    const parent = `.apexcharts-series[data\\:realIndex='${i}']`
    const elPath = this._canvasMark(i, j)
      ? null
      : w.dom.Paper.findOne(
          `${parent} path[j='${j}'], ${parent} circle[j='${j}'], ${parent} rect[j='${j}']`,
        )
    if (elPath) {
      // Leave the previous bar before entering the new one
      this._leaveHoveredBar()
      const graphics = new Graphics(this.w, this.ctx)
      graphics.pathMouseEnter(elPath, null)
      this._hoveredBarEl = elPath
    }

    if (w.globals.isBarHorizontal) {
      // A fixed box stays in its corner under the pointer, and `_showTooltip`
      // puts it there for the keyboard too, so nothing here may move it or
      // give it a placement.
      const fixed = ttCtx.fixedTooltip
      // Where the pointer puts the box: a chart whose tooltip is not
      // intersect-only takes the sticky path, which captions the whole row
      // (Position.moveStickyTooltipOverBars).
      if (
        !fixed &&
        !ttCtx.showOnIntersect &&
        !TooltipUtils.isFollowCursor(w) &&
        ttCtx.tooltipPosition.placeHorizontalSharedTooltip(j)
      ) {
        return
      }
      // The focused bar in elWrap px, measured, so no SVG translate has to be
      // accounted for.
      const bar = this._focusedBarInWrap(i, j, elPath, ttCtx)
      const tooltipEl = ttCtx.getElTooltip()
      if (bar && tooltipEl && !fixed) {
        const ttWidth = ttCtx.tooltipRect.ttWidth || 0
        const ttHeight = ttCtx.tooltipRect.ttHeight || 0
        const origin = TooltipUtils.plotInWrap(w)
        const plot = {
          top: origin.top,
          bottom: origin.top + w.layout.gridHeight,
          left: origin.left,
          right: origin.left + w.layout.gridWidth,
        }

        // On a plot too short for the box, directly above (or below) the
        // bar, as the pointer path does.
        const stacked = ttCtx.tooltipPosition.placeOnShortPlot(
          (bar.left + bar.right) / 2,
          bar.top,
          bar.bottom,
        )
        if (stacked) {
          ttCtx.tooltipPosition.applyTooltipPosition(tooltipEl, stacked)
        } else if (w.config.tooltip.arrow) {
          // With an arrow, around the bar as the pointer puts it
          // (Intersect.handleBarTooltip), so the arrow lands on the focused
          // bar and the box stays on screen.
          ttCtx.tooltipPosition.applyTooltipPosition(
            tooltipEl,
            ttCtx.tooltipPosition.placeAroundBar(bar, plot, j, i),
          )
        } else {
          // Without one, beside the bar's value end, vertically centred on
          // it, as the pointer puts it: past the right end of a bar right of
          // the baseline, past the left end of one left of it.
          const baseline =
            ttCtx.xyRatios && ttCtx.xyRatios.baseLineInvertedY != null
              ? plot.left + ttCtx.xyRatios.baseLineInvertedY
              : (plot.left + plot.right) / 2
          let x =
            (bar.left + bar.right) / 2 < baseline
              ? bar.left - ttWidth
              : bar.right
          if (TooltipUtils.isFollowCursor(w)) {
            // A box that follows the pointer starts 15px right of it, or
            // ends there when that runs past the plot
            // (Intersect.getBarTooltipXY), and the focused bar's pointer
            // rests on its centre.
            const px = (bar.left + bar.right) / 2 - plot.left + 15
            x =
              plot.left +
              (px + ttWidth > w.layout.gridWidth ? px - ttWidth : px)
          }
          const y = (bar.top + bar.bottom) / 2 - ttHeight / 2
          // Held inside the plot: a bar reaching the axis maximum pushed the
          // box out of the chart, over whatever stands beside it on the page.
          // The start wins when the box is bigger than the plot.
          tooltipEl.style.left =
            Math.max(Math.min(x, plot.right - ttWidth), plot.left) + 'px'
          tooltipEl.style.top =
            Math.max(Math.min(y, plot.bottom - ttHeight), plot.top) + 'px'
          // No arrow points anywhere, so no side either: a top/bottom left by
          // an earlier box would flip its shadow.
          delete tooltipEl.dataset.placement
        }
      }
    } else if (this._pointerHoversOneMark(ttCtx)) {
      // Vertical, one mark at a time (an intersect tooltip): where the
      // pointer on the focused mark puts the box, beside it, or over it on a
      // plot too short for that.
      this._hoverFocusedMark(i, j, elPath, ttCtx)
    } else {
      // Vertical bar / column / candlestick / boxPlot, the sticky box
      ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, i)
    }
  }

  /**
   * Does the pointer caption a vertical bar-like one mark at a time, through
   * Intersect.handleBarTooltip, rather than through the sticky path? As
   * Tooltip.axisChartsTooltips decides: an intersect tooltip, unless the
   * chart is synced to a group, whose members all take the sticky path.
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @returns {boolean}
   */
  _pointerHoversOneMark(ttCtx) {
    if (!ttCtx.showOnIntersect) return false
    const w = this.w
    return !(
      w.config.chart.group &&
      typeof this.ctx.getSyncedCharts === 'function' &&
      this.ctx.getSyncedCharts().length > 1
    )
  }

  /**
   * Place the box for the focused vertical bar-like the way a pointer on it
   * does, by handing the pointer's own placement (Intersect.handleBarTooltip)
   * the synthetic pointer on the mark (`_setSyntheticEvent`) with the mark
   * named, as a real hover names the node under it (TooltipUtils.hoverTarget)
   * or, painted to canvas, the mark the renderer's hit test found: nothing
   * else under that point (a neighbouring mark, a jitter dot) is taken for
   * it. With nothing of the mark drawn, the sticky box stands in.
   * @param {number} i
   * @param {number} j
   * @param {any} elPath  the SVG.js wrapper `_showTooltipBar` found
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _hoverFocusedMark(i, j, elPath, ttCtx) {
    const w = this.w
    const painted = this._canvasMark(i, j)
    // the node a pointer hovers the mark through, whose class handleBarTooltip
    // reads it by
    const node =
      !painted &&
      elPath?.node &&
      [
        'apexcharts-bar-area',
        'apexcharts-candlestick-area',
        'apexcharts-boxPlot-area',
        'apexcharts-rangebar-area',
        'apexcharts-violin-area',
      ].some((c) => elPath.node.classList.contains(c))
        ? elPath.node
        : null
    if (!painted && !node) {
      ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, i)
      return
    }
    const svg = w.dom.Paper.node
    ttCtx.intersect.handleBarTooltip({
      e: {
        ...ttCtx.e,
        type: 'mousemove',
        target: node || svg,
        apexHoverTarget: node || svg,
        apexPaintedHit: painted,
      },
      opt: {
        paths: node || svg,
        hoverArea: svg,
        elGrid: ttCtx.getElGrid(),
        tooltipEl: ttCtx.getElTooltip(),
        ttItems: ttCtx.ttItems,
      },
    })
  }

  /**
   * The focused horizontal bar's box in elWrap px, measured. A violin is read
   * as its whole glyph, as the pointer reads it (Intersect.getViolinMark):
   * body, box lane and jitter or rain, so the box clears a raincloud's lanes
   * as well as its cloud. Painted to canvas, a bar leaves no path, only the
   * box it was painted in. Null when nothing of the bar is drawn.
   * @param {number} i
   * @param {number} j
   * @param {any} elPath  the SVG.js wrapper `_showTooltipBar` found
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @returns {{ top: number, bottom: number, left: number, right: number } | null}
   */
  _focusedBarInWrap(i, j, elPath, ttCtx) {
    const w = this.w
    const isViolin =
      w.config.chart.type === 'violin' ||
      /** @type {any} */ (w.config.series[i])?.type === 'violin'
    const r =
      (isViolin && ttCtx.intersect?.violinGlyphRect(i, j)) ||
      elPath?.node?.getBoundingClientRect() ||
      this._canvasMarkRect(i, j)
    if (!r) return null
    const wrapRect = w.dom.elWrap.getBoundingClientRect()
    return {
      top: r.top - wrapRect.top,
      bottom: r.bottom - wrapRect.top,
      left: r.left - wrapRect.left,
      right: r.right - wrapRect.left,
    }
  }

  /**
   * line / area / scatter / bubble / radar / rangeArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipAxisLine(i, j, ttCtx) {
    const w = this.w
    const type = w.config.chart.type

    // Mirror the runtime check in handleStickyCapturedSeries: tooltip.shared
    // only applies when all series have the same x value at index j and the
    // same number of data points.  For irregular time series (different x
    // values across series), fall back to individual (non-shared) tooltip so
    // only the currently focused series is shown — matching mouse behaviour.
    const sharedConfigured = ttCtx.tConfig.shared
    const shared =
      sharedConfigured &&
      ttCtx.tooltipUtil.isXoverlap(j) &&
      ttCtx.tooltipUtil.isInitialSeriesSameLen()

    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      shared,
    })

    // Scatter and bubble charts use intersect mode — each data point is a real
    // SVG marker element with cx/cy attributes set by Scatter.js.
    // pointsArray is only populated for null/invalid data points, so
    // moveDynamicPointOnHover fails for valid scatter/bubble data.
    //
    // enlargePoints(j) searches all series for markers where rel===j, which
    // causes two problems for keyboard nav:
    //   1. Multiple bubbles across series enlarge at once (wrong for single selection)
    //   2. Tooltip ends up positioned over the LAST matching marker, not series i
    //
    // Instead we replicate what Intersect.handleMarkerTooltip does: find the
    // specific marker for (i, j), resize only it, and position the tooltip
    // at its cx/cy using the same formula as mouse hover.
    // A radar is hovered through its markers too
    // (Intersect.handleMarkerTooltip), and keeps no pointsArray for the
    // dynamic-point path to place the box by.
    const isScatterLike =
      type === 'scatter' || type === 'bubble' || type === 'radar'
    // batched markers are one path per series, so there is no per-point node to
    // enlarge: the dynamic-point path below handles them, as it does for
    // markers.size: 0. So do markers painted to canvas, as the pointer's
    // sticky path does (Tooltip.create).
    const hasVisibleMarkers =
      w.globals.markers.largestSize > 0 &&
      !w.globals.markers.batched &&
      this.ctx.renderer?.kind !== 'canvas'
    // A painted marker a pointer would hover one at a time: the pointer's
    // own handler places the box for it (Intersect.handlePaintedMarkerTooltip).
    const painted = this._pointerHoversOneMark(ttCtx)
      ? this._canvasMarker(i, j)
      : null

    if (painted) {
      this._hoverPaintedMarker(painted, ttCtx)
    } else if (isScatterLike || (hasVisibleMarkers && !shared)) {
      // One series' caption: the pointer enlarges that series' marker and
      // places the box by it, whether it hovers the marker
      // (Intersect.handleMarkerTooltip) or the column (Position.moveMarkers).
      // A line with markers keeps no pointsArray for the dynamic point to be
      // placed by, so that is only for a point with no marker node.
      if (!this._showScatterBubblePoint(i, j, ttCtx)) {
        ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i)
      }
    } else if (hasVisibleMarkers) {
      // Line/area with visible permanent markers, shared
      ttCtx.marker.enlargePoints(j)
    } else if (shared) {
      // shared=true, x values match — show dynamic point on all series
      ttCtx.tooltipPosition.moveDynamicPointsOnHover(j)
    } else {
      // shared=false or x values differ — show dynamic point on this series only
      ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i)
    }
  }

  /**
   * The marker the canvas renderer painted for this point
   * (CanvasRenderer.findMarker), centre in plot px, when the markers are
   * painted and have no node. Null otherwise.
   * @param {number} i
   * @param {number} j
   * @returns {{ seriesIndex: number, dataPointIndex: number, x: number, y: number, size: number, d: string } | null}
   */
  _canvasMarker(i, j) {
    // ctx.renderer, as for the cells (_canvasCell).
    const renderer = this.ctx.renderer
    if (
      !renderer ||
      renderer.kind !== 'canvas' ||
      typeof renderer.findMarker !== 'function'
    ) {
      return null
    }
    return renderer.findMarker(i, j)
  }

  /**
   * Place the box for a focused marker painted to canvas the way a pointer
   * on it does: the pointer's handler gets the synthetic pointer on the
   * marker (`_setSyntheticEvent`) and the marker its hit test would have
   * found there.
   * @param {{ seriesIndex: number, dataPointIndex: number, x: number, y: number, size: number }} painted
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _hoverPaintedMarker(painted, ttCtx) {
    ttCtx.intersect.handlePaintedMarkerTooltip({
      e: { ...ttCtx.e, type: 'mousemove' },
      opt: { tooltipEl: ttCtx.getElTooltip(), ttItems: ttCtx.ttItems },
      marker: {
        i: painted.seriesIndex,
        j: painted.dataPointIndex,
        cx: painted.x,
        cy: painted.y,
        size: painted.size,
      },
    })
  }

  /**
   * Scatter / bubble: find the specific marker element for (seriesIndex i,
   * dataPointIndex j), resize only that element, and position the tooltip at
   * its coordinates — mirroring what Position.moveMarkers does for mouse hover.
   *
   * Unlike enlargePoints(j) which queries ALL series for rel===j (causing
   * multiple bubbles to enlarge and tooltip to land on the wrong one), this
   * method queries by both series index AND data-point index for precision.
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @returns {boolean} whether a marker was found and the box placed by it
   */
  _showScatterBubblePoint(i, j, ttCtx) {
    const baseEl = this.w.dom.baseEl

    // Reset only the previously enlarged marker (not all markers via
    // resetPointsSize()). Calling resetPointsSize() modifies the `d`
    // attribute on every marker element in the DOM, which can trigger
    // synthetic mouseout events on those elements — the Tooltip mouse
    // listeners catch those and call handleMouseOut → resetPointsSize()
    // again, creating a resize ping-pong that appears as jitter.
    if (this._enlargedScatterMarker) {
      ttCtx.marker.oldPointSize(this._enlargedScatterMarker)
      this._enlargedScatterMarker = null
    }

    // Find the marker for this exact series (data:realIndex attr) and data
    // point (rel attr). The element hierarchy is:
    //   .apexcharts-series[data:realIndex='i'] > ... > .apexcharts-marker[rel='j']
    const seriesEl = baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}']`,
    )
    if (!seriesEl) return false

    const markerEl = seriesEl.querySelector(`.apexcharts-marker[rel='${j}']`)
    if (!markerEl) return false

    // enlargeCurrentPoint already handles bubble (skips resize since bubble
    // radius encodes a data dimension), reads cx/cy from the element, and
    // delegates positioning to moveTooltip — which correctly adds translateX.
    ttCtx.marker.enlargeCurrentPoint(j, markerEl)

    // Remember which element was enlarged so we can reset only it next time.
    this._enlargedScatterMarker = markerEl
    return true
  }

  /**
   * pie / donut / polarArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   */
  _showTooltipNonAxis(i, j, ttCtx, tooltipEl) {
    const w = this.w

    // For pie-like charts the series index IS the data point / slice index
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: j,
      shared: false,
    })

    // Refresh tooltip dimensions after content is drawn
    const tooltipBound = tooltipEl.getBoundingClientRect()
    const ttWidth = tooltipBound.width || ttCtx.tooltipRect.ttWidth || 0
    const ttHeight = tooltipBound.height || ttCtx.tooltipRect.ttHeight || 0

    // Anchor on the arc centroid, through the same helper the mouse path uses
    // so keyboard and pointer land a slice's tooltip in the same place. The
    // path element carries j='${j}' (0-indexed); data:cx/cy are set on the
    // path directly, not on the parent group.
    const sliceEl = w.dom.baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`)
    const anchor = ttCtx.getSliceAnchor(sliceEl)
    if (anchor) {
      const pos = ttCtx.tooltipPosition.placeOverAnchor(
        anchor.x,
        anchor.y,
        ttWidth,
        ttHeight,
        10,
      )
      tooltipEl.style.left = pos.x + 'px'
      tooltipEl.style.top = pos.y + 'px'
    }
  }
  /**
   * radialBar — one ring per series, single value each
   * @param {number} i
   * @param {any} _j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   */
  _showTooltipRadialBar(i, _j, ttCtx, tooltipEl) {
    const w = this.w

    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      shared: false,
    })

    const { ttWidth = 0, ttHeight = 0 } = ttCtx.getCachedDimensions()

    // Each radial series is a ring; find the path and use its data:angle to
    // compute the centroid at the midpoint of the arc.
    const arcEl = w.dom.baseEl.querySelector(
      `.apexcharts-radialbar-series[data\\:realIndex='${i}'] path`,
    )
    if (arcEl) {
      const angle = parseFloat(arcEl.getAttribute('data:angle') ?? '') || 0
      // Radial bars start from the top (initialAngle) and sweep clockwise
      const initialAngle = w.config.plotOptions.radialBar.startAngle || 0
      const midAngle = initialAngle + angle / 2

      const centerX = w.layout.gridWidth / 2
      const centerY = w.layout.gridHeight / 2
      const radialSize =
        w.globals.radialSize ||
        Math.min(w.layout.gridWidth, w.layout.gridHeight) / 2

      // Use the outer radius for this particular ring (series i)
      const seriesCount = w.seriesData.series.length
      const trackSize = radialSize / Math.max(seriesCount, 1)
      const outerRadius = radialSize - i * trackSize
      const innerRadius = outerRadius - trackSize
      const ringRadius = (outerRadius + innerRadius) / 2

      const centroid = Utils.polarToCartesian(
        centerX,
        centerY,
        ringRadius,
        midAngle,
      )
      const x = centroid.x + (w.layout.translateX || 0)
      const y = centroid.y + (w.layout.translateY || 0)

      const pos = ttCtx.tooltipPosition.placeOverAnchor(
        x,
        y,
        ttWidth,
        ttHeight,
        10,
      )
      tooltipEl.style.left = pos.x + 'px'
      tooltipEl.style.top = pos.y + 'px'
    }
  }
  /**
   * heatmap / treemap — position tooltip using element bounding rect
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   * @param {string} type
   */
  _showTooltipHeatTree(i, j, ttCtx, tooltipEl, type) {
    const w = this.w

    // A box that follows the pointer goes where the pointer resting on the
    // focused cell's centre puts it, by the pointer's own placement, handed
    // the synthetic pointer (`_setSyntheticEvent`) and the cell it names as
    // a real hover names the node under it. Painted to canvas, the cell is
    // found by the renderer's hit test at that point, as it is for a hover.
    if (TooltipUtils.isFollowCursor(w) && this._hoverFocusedCell(i, j, ttCtx)) {
      return
    }

    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      shared: false,
    })

    // Refresh tooltip dimensions after content is drawn
    const tooltipRect = tooltipEl.getBoundingClientRect()
    const ttWidth = tooltipRect.width || ttCtx.tooltipRect.ttWidth || 0
    const ttHeight = tooltipRect.height || ttCtx.tooltipRect.ttHeight || 0

    const rectClass =
      type === 'heatmap' ? 'apexcharts-heatmap-rect' : 'apexcharts-treemap-rect'

    const cell = w.dom.baseEl.querySelector(`.${rectClass}[i='${i}'][j='${j}']`)
    // A heatmap painted to canvas has no node per cell; the renderer kept the
    // box it painted the cell in.
    const painted = cell ? null : this._canvasCell(i, j)
    if (cell || painted) {
      // Use viewport-relative rects so we don't need to worry about SVG
      // translate offsets (cx/cy on these elements are in grid-space).
      const wrapRect = w.dom.elWrap.getBoundingClientRect()

      let cellCx = 0
      let cellCy = 0
      let cellWidth = 0
      let cellHeight = 0
      if (cell) {
        const cellRect = cell.getBoundingClientRect()
        cellCx = cellRect.left - wrapRect.left
        cellCy = cellRect.top - wrapRect.top
        cellWidth = cellRect.width
        cellHeight = cellRect.height

        // Move crosshair to horizontal centre of cell
        const cx = parseFloat(cell.getAttribute('cx') ?? '')
        const cellWidthAttr = parseFloat(cell.getAttribute('width') ?? '')
        ttCtx.tooltipPosition.moveXCrosshairs(cx + cellWidthAttr / 2)
      } else if (painted) {
        // Plot-local, so offset by the plot's corner the way the pointer
        // path does for the same cell.
        const plot = TooltipUtils.plotInWrap(w)
        cellCx = plot.left + painted.x
        cellCy = plot.top + painted.y
        cellWidth = painted.width
        cellHeight = painted.height
        ttCtx.tooltipPosition.moveXCrosshairs(painted.x + painted.width / 2)
      }

      // Position tooltip to the right of the cell, vertically centred;
      // flip left if it would overflow the right half of the grid.
      let x = cellCx + cellWidth + ttWidth / 2
      const y = cellCy + cellHeight / 2 - ttHeight / 2

      if (cellCx + cellWidth > w.layout.gridWidth / 2) {
        x = cellCx - ttWidth / 2
      }

      // On a plot too short for the box, directly above (or below) the
      // cell, as the pointer path does.
      const wasStacked = ttCtx.tooltipPosition.shortPlotPlacement
      const stacked = ttCtx.tooltipPosition.placeOnShortPlot(
        cellCx + cellWidth / 2,
        cellCy,
        cellCy + cellHeight,
      )
      if (stacked) {
        ttCtx.tooltipPosition.applyTooltipPosition(tooltipEl, stacked)
        return
      }

      // A heatmap box with an arrow goes where the pointer puts it, so the
      // arrow lands on the focused cell rather than wherever the last
      // placement left it.
      if (
        type === 'heatmap' &&
        w.config.tooltip.arrow &&
        !TooltipUtils.isFollowCursor(w)
      ) {
        const { left: plotLeft, top: plotTop } = TooltipUtils.plotInWrap(w)
        ttCtx.tooltipPosition.applyTooltipPosition(
          tooltipEl,
          ttCtx.tooltipPosition.placeAroundCell(
            {
              top: cellCy,
              bottom: cellCy + cellHeight,
              left: cellCx,
              right: cellCx + cellWidth,
            },
            {
              top: plotTop,
              bottom: plotTop + w.layout.gridHeight,
              left: plotLeft,
              right: plotLeft + w.layout.gridWidth,
            },
            { el: cell, ttWidth, ttHeight },
          ),
        )
        return
      }

      tooltipEl.style.left = x + 'px'
      tooltipEl.style.top = y + 'px'
      // Back beside the cell: drop the top/bottom the last box left.
      if (wasStacked) delete tooltipEl.dataset.placement
    }
  }

  /**
   * Place the box for the focused heatmap or treemap cell the way a pointer
   * resting on its centre does (Intersect.handleHeatTreeTooltip). False when
   * nothing of the cell is drawn, or the pointer's placement found no cell
   * there, so the caller places it itself.
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @returns {boolean}
   */
  _hoverFocusedCell(i, j, ttCtx) {
    const w = this.w
    const type = w.config.chart.type
    const tooltipEl = ttCtx.getElTooltip()
    const cell = w.dom.baseEl.querySelector(
      `.apexcharts-${type}-rect[i='${i}'][j='${j}']`,
    )
    if (!tooltipEl || (!cell && !this._canvasCell(i, j))) return false
    const target = cell || w.dom.Paper.node
    // The pointer's placement captures the cell it places the box for, so a
    // capture other than the focused cell afterwards means it placed none.
    w.interact.capturedSeriesIndex = -1
    w.interact.capturedDataPointIndex = -1
    const placed = ttCtx.intersect.handleHeatTreeTooltip({
      e: { ...ttCtx.e, type: 'mousemove', target, apexHoverTarget: target },
      opt: { ttItems: ttCtx.ttItems },
      x: 0,
      y: 0,
      type,
    })
    const found =
      !placed.noHit &&
      w.interact.capturedSeriesIndex === i &&
      w.interact.capturedDataPointIndex === j
    w.interact.capturedSeriesIndex = i
    w.interact.capturedDataPointIndex = j
    if (!found) return false
    ttCtx.placeCellTooltip(tooltipEl, placed)
    return true
  }

  /**
   * The box a heatmap cell was painted in when the canvas renderer drew the
   * cells, plot-local. Null for every other chart, and for a heatmap whose
   * cells are SVG nodes (the SVG renderer, or a cell shape canvas leaves to
   * SVG), which are found by their attributes instead.
   * @param {number} i
   * @param {number} j
   * @returns {{ x: number, y: number, width: number, height: number, radius: number } | null}
   */
  _canvasCell(i, j) {
    if (this.w.config.chart.type !== 'heatmap') return null
    // ctx.renderer itself: this module holds ctx, so it has no need of the
    // mirror on globals that the w-only modules read.
    const renderer = this.ctx.renderer
    if (
      !renderer ||
      renderer.kind !== 'canvas' ||
      typeof renderer.findCell !== 'function'
    ) {
      return null
    }
    return renderer.findCell(i, j)
  }

  /**
   * The bar-like mark (a bar, a candle, a box plot, a violin body) the
   * canvas renderer painted for this point, plot-local, with the path it
   * painted (CanvasRenderer.findMark): the first one, as the first `path[j]`
   * is on SVG. Null for every other chart, and when the marks are SVG nodes.
   * @param {number} i
   * @param {number} j
   * @returns {{ x: number, y: number, width: number, height: number, d: string } | null}
   */
  _canvasMark(i, j) {
    if (!this._isBarLikeSeries(i)) return null
    // ctx.renderer, as for the cells (_canvasCell).
    const renderer = this.ctx.renderer
    if (
      !renderer ||
      renderer.kind !== 'canvas' ||
      typeof renderer.findMark !== 'function'
    ) {
      return null
    }
    return renderer.findMark(i, j)
  }

  /**
   * Where `_canvasMark` puts the painted mark on screen, as a hovered SVG
   * path's getBoundingClientRect() would: from the plot's corner, through
   * any CSS zoom on the chart. Null when nothing was painted for the point.
   * @param {number} i
   * @param {number} j
   * @returns {{ left: number, top: number, right: number, bottom: number } | null}
   */
  _canvasMarkRect(i, j) {
    const mark = this._canvasMark(i, j)
    if (!mark) return null
    const plot = TooltipUtils.plotRect(this.w)
    const left = plot.left + mark.x * plot.zoom
    const top = plot.top + mark.y * plot.zoom
    return {
      left,
      top,
      right: left + mark.width * plot.zoom,
      bottom: top + mark.height * plot.zoom,
    }
  }

  // ─── Focus class management ───────────────────────────────────────────────

  /**
   * @param {number} i
   * @param {number} j
   */
  _applyFocusClass(i, j) {
    this._removeFocusClass()

    const el =
      this._getFocusableElement(i, j) ||
      this._getBatchedFocusEl(i) ||
      this._drawCanvasFocusRing(i, j)
    if (el) {
      el.classList.add('apexcharts-keyboard-focused')
      // WCAG 4.1.2 Name, Role, Value: give the focused data point an
      // accessible name so screen readers announce series + value + category
      // when the user navigates via arrow keys. We apply on focus (not on
      // every render) to keep large datasets cheap and avoid noisy SR output.
      el.setAttribute('role', 'img')
      const label = this._buildPointLabel(i, j)
      if (label) el.setAttribute('aria-label', label)
      this._focusedEl = el
    }
  }

  /**
   * A batched series has no `.apexcharts-marker[rel]` node to carry the focus
   * ring and aria-label, so the focus lands on the tooltip's own marker for
   * that series instead: `_showTooltip` moves it onto the focused point in this
   * same task, so it is the element the reader sees highlighted. Only used when
   * batching is on, since with per-point nodes the exact node is better.
   * @param {number} i
   * @returns {Element | null}
   */
  _getBatchedFocusEl(i) {
    if (!this.w.globals.markers.batched) return null
    return this.w.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}'] .apexcharts-series-markers path`,
    )
  }

  /**
   * A heatmap or a bar-like painted to canvas has no node per cell or mark to
   * carry the focus stroke and the accessible name, so an outline of the
   * focused one stands in for it. It goes in the series' own group, over the
   * canvas, where the SVG node would sit: plot-local, clipped to the plot as
   * the painted marks are, and swept away with the group by an update, as an
   * SVG node's focus stroke is. Otherwise it lives as long as the focus does
   * (`_removeFocusClass`). Being there, it is also what the tooltip keeps
   * clear of (Position.computeTooltipPosition), as it does a focused node.
   * @param {number} i
   * @param {number} j
   * @returns {Element | null}
   */
  _drawCanvasFocusRing(i, j) {
    const cell = this._canvasCell(i, j)
    if (!cell) return this._drawCanvasMarkFocusRing(i, j)
    const host = this.w.dom.baseEl.querySelector(
      `.apexcharts-heatmap .apexcharts-series[rel='${i + 1}']`,
    )
    if (!host) return null
    const ring = new Graphics(this.w, this.ctx).drawRect(
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      cell.radius,
      'none',
    )
    ring.node.classList.add('apexcharts-keyboard-focus-ring')
    ring.attr({ i, j })
    // First in the group, so the row's data labels stay readable on top of
    // the outline as they do over an SVG cell's.
    host.insertBefore(ring.node, host.firstChild)
    return ring.node
  }

  /**
   * The outline for a bar-like painted to canvas (`_drawCanvasFocusRing`):
   * the very path that was painted, so it traces the bar, the candle and its
   * wicks, or the box and its whisker the way the focus stroke traces an SVG
   * one, under the same clip. It carries no `j`, so nothing that looks for
   * the series' marks by index takes it for one.
   * @param {number} i
   * @param {number} j
   * @returns {Element | null}
   */
  _drawCanvasMarkFocusRing(i, j) {
    const mark = this._canvasMark(i, j)
    if (!mark) return this._drawCanvasMarkerFocusRing(i, j)
    const w = this.w
    // The series' own group, by realIndex (`rel` counts within a type's
    // groups, which a combo has several of).
    const host = Array.from(
      w.dom.baseEl.querySelectorAll('.apexcharts-series'),
    ).find((g) => g.getAttribute('data:realIndex') === String(i))
    if (!host) return null
    const ring = new Graphics(w, this.ctx).drawPath({
      d: mark.d,
      fill: 'none',
      classes: 'apexcharts-keyboard-focus-ring',
    })
    ring.attr('clip-path', `url(#gridRectBarMask${w.globals.cuid})`)
    host.insertBefore(ring.node, host.firstChild)
    return ring.node
  }

  /**
   * The outline for a marker painted to canvas (`_drawCanvasFocusRing`): its
   * painted shape, in the series' own group under the markers' clip, as the
   * focused SVG marker node would be. Like that node it is what the box
   * keeps clear of, so the box sits where it does on SVG.
   * @param {number} i
   * @param {number} j
   * @returns {Element | null}
   */
  _drawCanvasMarkerFocusRing(i, j) {
    const marker = this._canvasMarker(i, j)
    if (!marker) return null
    const w = this.w
    const host = Array.from(
      w.dom.baseEl.querySelectorAll('.apexcharts-series'),
    ).find((g) => g.getAttribute('data:realIndex') === String(i))
    if (!host) return null
    const ring = new Graphics(w, this.ctx).drawPath({
      d: marker.d,
      fill: 'none',
      classes: 'apexcharts-keyboard-focus-ring',
    })
    ring.attr('clip-path', `url(#gridRectMarkerMask${w.globals.cuid})`)
    host.appendChild(ring.node)
    return ring.node
  }

  _removeFocusClass() {
    if (this._focusedEl) {
      this._focusedEl.classList.remove('apexcharts-keyboard-focused')
      this._focusedEl.removeAttribute('role')
      this._focusedEl.removeAttribute('aria-label')
      // A canvas cell's outline was drawn for this focus alone.
      if (
        this._focusedEl.classList.contains('apexcharts-keyboard-focus-ring')
      ) {
        this._focusedEl.remove()
      }
      this._focusedEl = null
    }
  }

  /**
   * Build an accessible label for the data point at (i, j) using the same
   * formatters the visible tooltip / axis labels use, so SR output matches
   * the visual presentation.
   * @param {number} i
   * @param {number} j
   * @returns {string}
   */
  _buildPointLabel(i, j) {
    const w = this.w
    const type = w.config.chart.type

    const seriesNames = w.seriesData.seriesNames || []
    const series = w.seriesData.series || []

    // Non-axis charts: i is unused by navigation (single-series), j is the slice
    if (type === 'pie' || type === 'donut' || type === 'polarArea') {
      const sliceLabel = (w.labelData?.labels && w.labelData.labels[j]) ?? ''
      const value = Array.isArray(series) ? series[j] : ''
      return sliceLabel ? `${sliceLabel}: ${value}` : `${value}`
    }

    if (type === 'radialBar') {
      const seriesName = seriesNames[i] || `Series ${i + 1}`
      const value = Array.isArray(series) ? series[i] : ''
      return `${seriesName}: ${value}`
    }

    const seriesName = seriesNames[i] || `Series ${i + 1}`

    // Format the y-value via the same formatter used by axis/tooltip labels.
    const row = Array.isArray(series[i]) ? series[i] : []
    const rawValue = row[j]
    let formattedValue = rawValue == null ? '' : String(rawValue)
    const yFormatter = w.formatters?.yLabelFormatters?.[i]
    if (typeof yFormatter === 'function') {
      try {
        formattedValue = yFormatter(rawValue, {
          seriesIndex: i,
          dataPointIndex: j,
          w,
        })
      } catch {
        // fall back to raw
      }
    }

    // Format the x-category. For category charts, w.labelData.categoryLabels
    // holds the visible labels; otherwise fall back to seriesX numeric values.
    let category = ''
    const categoryLabels = w.labelData?.categoryLabels
    const seriesX = w.seriesData?.seriesX?.[i]
    if (Array.isArray(categoryLabels) && categoryLabels[j] != null) {
      category = String(categoryLabels[j])
    } else if (Array.isArray(seriesX) && seriesX[j] != null) {
      const xFormatter = w.formatters?.xLabelFormatter
      if (typeof xFormatter === 'function') {
        try {
          category = String(
            xFormatter(seriesX[j], { seriesIndex: i, dataPointIndex: j, w }),
          )
        } catch {
          category = String(seriesX[j])
        }
      } else {
        category = String(seriesX[j])
      }
    }

    return category
      ? `${seriesName}: ${formattedValue}, ${category}`
      : `${seriesName}: ${formattedValue}`
  }

  _leaveHoveredBar() {
    if (this._hoveredBarEl) {
      const graphics = new Graphics(this.w, this.ctx)
      graphics.pathMouseLeave(this._hoveredBarEl, null)
      this._hoveredBarEl = null
    }
  }

  /**
   * @param {number} i
   * @param {number} j
   */
  _getFocusableElement(i, j) {
    const w = this.w
    const type = w.config.chart.type
    const baseEl = w.dom.baseEl

    if (type === 'pie' || type === 'donut' || type === 'polarArea') {
      // j is 0-indexed; the path carries j='${j}' (rel is on the parent group)
      return baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`)
    }

    if (type === 'heatmap') {
      return baseEl.querySelector(
        `.apexcharts-heatmap-rect[i='${i}'][j='${j}']`,
      )
    }

    if (type === 'treemap') {
      return baseEl.querySelector(
        `.apexcharts-treemap-rect[i='${i}'][j='${j}']`,
      )
    }

    if (type === 'radialBar') {
      return baseEl.querySelector(
        `.apexcharts-radialbar-series[data\\:realIndex='${i}'] path`,
      )
    }

    if (this._isBarLikeSeries(i)) {
      // Painted to canvas, the mark has no node (an outline stands in for
      // it, _drawCanvasFocusRing), and a jitter path that still carries its
      // `j` in the series is no stand-in for it.
      if (this._canvasMark(i, j)) return null
      return baseEl.querySelector(
        `.apexcharts-series[data\\:realIndex='${i}'] path[j='${j}']`,
      )
    }

    // line / area / scatter / bubble / radar — try marker element
    const marker = baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}'] .apexcharts-marker[rel='${j}']`,
    )
    return marker || null
  }

  // ─── Click / Enter ────────────────────────────────────────────────────────

  _fireClick() {
    const w = this.w
    const ttCtx = w.globals.tooltip
    if (!ttCtx) return

    const syntheticEvent = {
      type: 'mouseup',
      clientX: 0,
      clientY: 0,
    }
    ttCtx.markerClick(syntheticEvent, this.seriesIndex, this.dataPointIndex)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _isNavEnabled() {
    const a11y = this.w.config.chart.accessibility
    return (
      a11y.enabled && a11y.keyboard.enabled && a11y.keyboard.navigation.enabled
    )
  }

  _getSeriesCount() {
    const w = this.w
    const type = w.config.chart.type
    // Non-axis charts: pie/donut/polarArea navigate slices, not series
    if (type === 'pie' || type === 'donut' || type === 'polarArea') {
      return 1 // single "series" — all navigation is on dataPointIndex
    }
    return w.seriesData.series.length
  }

  /**
   * @param {number} si
   */
  _getDataPointCount(si) {
    const w = this.w
    const type = w.config.chart.type
    // Non-axis charts: globals.series is a flat array of values (one per slice)
    if (type === 'pie' || type === 'donut' || type === 'polarArea') {
      return w.seriesData.series.length
    }
    const series = w.seriesData.series
    return series[si] && Array.isArray(series[si]) ? series[si].length : 0
  }

  _clampCursor() {
    const seriesCount = this._getSeriesCount()
    if (this.seriesIndex >= seriesCount) this.seriesIndex = seriesCount - 1
    if (this.seriesIndex < 0) this.seriesIndex = 0

    const dpCount = this._getDataPointCount(this.seriesIndex)
    if (this.dataPointIndex >= dpCount) this.dataPointIndex = dpCount - 1
    if (this.dataPointIndex < 0) this.dataPointIndex = 0
  }

  /**
   * When the chart is zoomed in, the current dataPointIndex may point to a
   * data point that is outside the visible viewport. Snap the cursor to the
   * first data point whose x-value falls within [minX, maxX].
   *
   * Only adjusts when w.seriesData.seriesX is populated (numeric/datetime axes).
   * Category-only charts (seriesX entries are strings or auto-indices) are
   * unaffected — all points are always visible.
   */
  _snapToVisibleRange() {
    const w = this.w
    const gl = w.globals
    const si = this.seriesIndex

    // No zoom applied — nothing to do
    if (!w.interact.zoomed) return

    const seriesX = w.seriesData.seriesX && w.seriesData.seriesX[si]
    if (!seriesX || !seriesX.length) return

    const minX = gl.minX
    const maxX = gl.maxX

    if (minX === undefined || maxX === undefined) return

    // Check if the current data point is already visible
    const currentX = seriesX[this.dataPointIndex]
    if (currentX >= minX && currentX <= maxX) return

    // Find the first data point within [minX, maxX]
    const dpCount = seriesX.length
    for (let di = 0; di < dpCount; di++) {
      if (seriesX[di] >= minX && seriesX[di] <= maxX) {
        this.dataPointIndex = di
        return
      }
    }
    // If no data point is in range (shouldn't happen in practice), leave cursor as-is
  }

  /**
   * Snap to the nearest visible data point in the given navigation direction.
   * direction > 0 → find the first visible point (left boundary of zoomed range)
   * direction < 0 → find the last visible point (right boundary of zoomed range)
   * @param {number} direction
   */
  _snapToVisibleRangeInDirection(direction) {
    const w = this.w
    const gl = w.globals
    const si = this.seriesIndex

    const seriesX = w.seriesData.seriesX && w.seriesData.seriesX[si]
    if (!seriesX || !seriesX.length) return

    const minX = gl.minX
    const maxX = gl.maxX
    if (minX === undefined || maxX === undefined) return

    const dpCount = seriesX.length

    if (direction >= 0) {
      // Going right: snap to first visible point
      for (let di = 0; di < dpCount; di++) {
        if (seriesX[di] >= minX && seriesX[di] <= maxX) {
          this.dataPointIndex = di
          return
        }
      }
    } else {
      // Going left: snap to last visible point
      for (let di = dpCount - 1; di >= 0; di--) {
        if (seriesX[di] >= minX && seriesX[di] <= maxX) {
          this.dataPointIndex = di
          return
        }
      }
    }
  }

  /**
   * Check whether the data point at (si, di) is within the current visible
   * x-axis range. Used to skip out-of-viewport points during keyboard nav.
   * @param {number} si
   * @param {number} di
   */
  _isDataPointVisible(si, di) {
    const w = this.w
    const gl = w.globals

    if (!w.interact.zoomed) return true

    const seriesX = w.seriesData.seriesX && w.seriesData.seriesX[si]
    if (!seriesX) return true

    const x = seriesX[di]
    if (x === undefined) return true

    return x >= gl.minX && x <= gl.maxX
  }

  /**
   * Push a short status message to the visually-hidden aria-live region so
   * screen readers announce zoom / pan / reset events that have no inherent
   * tooltip update. Silently no-op if the region is missing or announcements
   * are disabled.
   * @param {string} message
   */
  _announce(message) {
    const w = this.w
    if (!w.config.chart.accessibility.announcements.enabled) return

    const baseEl = w.dom.baseEl
    if (!baseEl) return
    const region = baseEl.querySelector('.apexcharts-sr-status')
    if (!region) return

    // Toggling textContent on a polite live region is enough for SRs to
    // re-announce. Same string twice in a row otherwise gets coalesced.
    region.textContent = ''
    // Microtask delay so the empty/then-text sequence is observed.
    setTimeout(() => {
      region.textContent = message
    }, 0)
  }
}
