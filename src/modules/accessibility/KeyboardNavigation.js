import Graphics from '../Graphics'
import Utils from '../../utils/Utils'

/**
 * ApexCharts KeyboardNavigation
 *
 * Enables keyboard users to navigate between data points using arrow keys and
 * trigger tooltips without a mouse. Plugs into the existing tooltip pipeline —
 * no new rendering logic is introduced.
 *
 * Key bindings (active when the chart SVG has focus):
 *   ArrowRight / ArrowLeft  — next / previous data point
 *   ArrowUp    / ArrowDown  — next / previous series (skips collapsed)
 *   Home                    — first data point in current series
 *   End                     — last data point in current series
 *   Enter / Space           — fire markerClick event (same as mouse click)
 *   Escape                  — exit keyboard nav, return focus to SVG
 */
export default class KeyboardNavigation {
  constructor(ctx) {
    this.ctx = ctx
    this.w = ctx.w

    // Current navigation cursor
    this.seriesIndex = 0
    this.dataPointIndex = 0
    this.active = false

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
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * Called after the chart and tooltip have been fully rendered.
   * Attaches event listeners and makes the SVG keyboard-focusable.
   */
  init() {
    const w = this.w
    const svgEl = w.globals.dom.Paper.node

    if (!svgEl) return

    svgEl.setAttribute('tabindex', '0')
    svgEl.addEventListener('focus', this._onFocus)
    svgEl.addEventListener('blur', this._onBlur)
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
    const svgEl = w.globals.dom.Paper && w.globals.dom.Paper.node

    if (!svgEl) return

    svgEl.removeEventListener('focus', this._onFocus)
    svgEl.removeEventListener('blur', this._onBlur)
    svgEl.removeEventListener('keydown', this._onKeyDown)

    this.ctx.events.removeEventListener('legendClick', this._onLegendClick)
  }

  /**
   * Called from Events.js keydown handler. Navigation keys are already handled
   * by the direct SVG listener (which can call preventDefault). This entry
   * point is intentionally a no-op — Events.js still fires the public keyDown
   * callback and fireEvent('keydown') independently.
   */
  handleKey(_e) {
    // No-op: navigation is handled by the non-passive SVG keydown listener
    // added in init(). Keeping this method so Events.js doesn't need changes.
  }

  // ─── Focus / blur ─────────────────────────────────────────────────────────

  _onFocus() {
    if (!this._isNavEnabled()) return
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

  _onKeyDown(e) {
    if (!this._isNavEnabled() || !this.active) return

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
      case 'Escape':
        e.preventDefault()
        this.active = false
        this._hideFocus()
        break
      default:
        break
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────

  _move(dSeries, dPoint) {
    const w = this.w
    const wrapAround =
      w.config.chart.accessibility.keyboard.navigation.wrapAround

    if (dSeries !== 0) {
      // When tooltip.shared = true the same tooltip covers all series at a
      // given x-position, so ↑/↓ series switching would show identical content.
      // Suppress it — only ←/→ data-point navigation makes sense in shared mode.
      const ttCtx = this.w.globals.tooltip
      if (ttCtx && ttCtx.tConfig && ttCtx.tConfig.shared) return

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
    if (!Array.isArray(w.globals.series[si])) return

    while (
      attempts < dpCount &&
      w.globals.series[si][di] === null
    ) {
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
    if (!Array.isArray(w.globals.series[si])) return

    while (
      attempts < dpCount &&
      w.globals.series[si][di] === null
    ) {
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
    w.globals.capturedSeriesIndex = i
    w.globals.capturedDataPointIndex = j

    this._applyFocusClass(i, j)
    this._showTooltip(i, j, ttCtx)
  }

  _hideFocus() {
    const w = this.w
    const ttCtx = w.globals.tooltip

    this._removeFocusClass()
    this._leaveHoveredBar()

    if (!ttCtx) return

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

    w.globals.dom.baseEl.classList.remove('apexcharts-tooltip-active')

    const xcrosshairs = ttCtx.getElXCrosshairs()
    if (xcrosshairs) xcrosshairs.classList.remove('apexcharts-active')
  }

  // ─── Tooltip display per chart type ───────────────────────────────────────

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

    w.globals.dom.baseEl.classList.add('apexcharts-tooltip-active')
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
    } else if (
      type === 'bar' ||
      type === 'candlestick' ||
      type === 'boxPlot' ||
      type === 'rangeBar'
    ) {
      this._showTooltipBar(i, j, ttCtx)
    } else {
      // line, area, scatter, bubble, radar, rangeArea
      this._showTooltipAxisLine(i, j, ttCtx)
    }
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
   */
  _setSyntheticEvent(i, j, ttCtx) {
    const w = this.w
    const type = w.config.chart.type

    let clientX = 0
    let clientY = 0

    // Try to find the element and use its centre as the synthetic position
    const el = this._getFocusableElement(i, j)
    if (el) {
      const rect = el.getBoundingClientRect()
      clientX = rect.left + rect.width / 2
      clientY = rect.top + rect.height / 2
    } else if (w.globals.pointsArray && w.globals.pointsArray[i] && w.globals.pointsArray[i][j]) {
      // Axis-line charts: derive from pointsArray pixel coords
      const pt = w.globals.pointsArray[i][j]
      const elGrid = ttCtx.getElGrid && ttCtx.getElGrid()
      if (elGrid) {
        const gridRect = elGrid.getBoundingClientRect()
        clientX = gridRect.left + (pt[0] || 0)
        clientY = gridRect.top + (pt[1] || 0)
      }
    } else {
      // Fallback: SVG element centre
      const svgEl = w.globals.dom.Paper && w.globals.dom.Paper.node
      if (svgEl) {
        const svgRect = svgEl.getBoundingClientRect()
        clientX = svgRect.left + svgRect.width / 2
        clientY = svgRect.top + svgRect.height / 2
      }
    }

    // For line/area/rangeArea: pointsArray gives the most accurate position
    if (
      type === 'line' || type === 'area' || type === 'rangeArea' ||
      type === 'scatter' || type === 'bubble' || type === 'radar'
    ) {
      if (w.globals.pointsArray && w.globals.pointsArray[i] && w.globals.pointsArray[i][j]) {
        const pt = w.globals.pointsArray[i][j]
        const elGrid = ttCtx.getElGrid && ttCtx.getElGrid()
        if (elGrid) {
          const gridRect = elGrid.getBoundingClientRect()
          clientX = gridRect.left + (pt[0] || 0)
          clientY = gridRect.top + (pt[1] || 0)
        }
      }
    }

    ttCtx.e = { type: 'mousemove', clientX, clientY }
  }

  /** bar / column / candlestick / boxPlot / rangeBar */
  _showTooltipBar(i, j, ttCtx) {
    const w = this.w

    // Draw tooltip text content
    const rangeData = w.globals.seriesRange?.[i]?.[j]?.y?.[0]
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      ...(rangeData?.y1 !== undefined && { y1: rangeData.y1 }),
      ...(rangeData?.y2 !== undefined && { y2: rangeData.y2 }),
      shared: ttCtx.tConfig.shared,
    })

    // Apply the hover visual state on the bar.
    // Use Paper.findOne() to get the SVG.js wrapper (same as toggleDataPointSelection
    // in UpdateHelpers.js) — querySelector returns a plain DOM node which lacks the
    // .node property that pathMouseEnter requires.
    const parent = `.apexcharts-series[data\\:realIndex='${i}']`
    const elPath = w.globals.dom.Paper.findOne(
      `${parent} path[j='${j}'], ${parent} circle[j='${j}'], ${parent} rect[j='${j}']`,
    )
    if (elPath) {
      // Leave the previous bar before entering the new one
      this._leaveHoveredBar()
      const graphics = new Graphics(this.ctx)
      graphics.pathMouseEnter(elPath, null)
      this._hoveredBarEl = elPath
    }

    if (w.globals.isBarHorizontal) {
      // Horizontal rangeBar / timeline: position tooltip using viewport-relative
      // coords to avoid grid-space vs wrapper-space confusion.
      const barDomEl = elPath && elPath.node
      if (barDomEl) {
        const wrapRect = w.globals.dom.elWrap.getBoundingClientRect()
        const barRect = barDomEl.getBoundingClientRect()

        // Bar centre in elWrap-relative coordinates
        const barCx = barRect.left - wrapRect.left      // left edge of bar
        const barCy = barRect.top - wrapRect.top        // top edge of bar
        const bh = barRect.height
        const bw = barRect.width

        const ttWidth = ttCtx.tooltipRect.ttWidth || 0
        const ttHeight = ttCtx.tooltipRect.ttHeight || 0

        // Vertically: centre the tooltip on the bar
        const y = barCy + bh / 2 - ttHeight / 2

        // Horizontally: place tooltip at the bar's right edge (positive values)
        // or left of bar start for negative bars (same logic as Intersect)
        let x = barCx + bw
        const baselineX = ttCtx.xyRatios && ttCtx.xyRatios.baseLineInvertedY != null
          ? ttCtx.xyRatios.baseLineInvertedY
          : wrapRect.width / 2
        if (barCx < baselineX) {
          x = barCx - ttWidth
        }

        const tooltipEl = ttCtx.getElTooltip()
        if (tooltipEl) {
          tooltipEl.style.left = x + 'px'
          tooltipEl.style.top = y + 'px'
        }
      }
    } else {
      // Vertical bar / column / candlestick / boxPlot
      ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, i)
    }
  }

  /** line / area / scatter / bubble / radar / rangeArea */
  _showTooltipAxisLine(i, j, ttCtx) {
    const w = this.w
    const type = w.config.chart.type
    const shared = ttCtx.tConfig.shared

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
    const isScatterLike = type === 'scatter' || type === 'bubble'
    const hasVisibleMarkers = w.globals.markers.largestSize > 0

    if (isScatterLike) {
      this._showScatterBubblePoint(i, j, ttCtx)
    } else if (hasVisibleMarkers) {
      // Line/area with visible permanent markers — enlargePoints is fine here
      // because shared mode shows all series at same x anyway.
      ttCtx.marker.enlargePoints(j)
    } else if (shared) {
      // shared=true, no permanent markers → show dynamic point on all series
      ttCtx.tooltipPosition.moveDynamicPointsOnHover(j)
    } else {
      // shared=false, no permanent markers → show dynamic point on this series only
      ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i)
    }
  }

  /**
   * Scatter / bubble: find the specific marker element for (seriesIndex i,
   * dataPointIndex j), resize only that element, and position the tooltip at
   * its coordinates — mirroring what Position.moveMarkers does for mouse hover.
   *
   * Unlike enlargePoints(j) which queries ALL series for rel===j (causing
   * multiple bubbles to enlarge and tooltip to land on the wrong one), this
   * method queries by both series index AND data-point index for precision.
   */
  _showScatterBubblePoint(i, j, ttCtx) {
    const baseEl = this.w.globals.dom.baseEl

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
    if (!seriesEl) return

    const markerEl = seriesEl.querySelector(`.apexcharts-marker[rel='${j}']`)
    if (!markerEl) return

    // enlargeCurrentPoint already handles bubble (skips resize since bubble
    // radius encodes a data dimension), reads cx/cy from the element, and
    // delegates positioning to moveTooltip — which correctly adds translateX.
    ttCtx.marker.enlargeCurrentPoint(j, markerEl)

    // Remember which element was enlarged so we can reset only it next time.
    this._enlargedScatterMarker = markerEl
  }

  /** pie / donut / polarArea */
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

    // Use data:cx / data:cy — the arc centroid in SVG/grid-space computed by
    // Pie.js (same values that nonAxisChartsTooltips uses for intersect mode).
    // The path element carries j='${j}' (0-indexed). data:cx/cy are set on
    // the path directly (not on the parent group).
    const sliceEl = w.globals.dom.baseEl.querySelector(
      `.apexcharts-pie-area[j='${j}']`,
    )
    if (sliceEl) {
      const cx = parseFloat(sliceEl.getAttribute('data:cx'))
      const cy = parseFloat(sliceEl.getAttribute('data:cy'))

      if (!isNaN(cx) && !isNaN(cy)) {
        // Convert SVG-space to elWrap-relative (same transform as mouse path)
        const svgBound = w.globals.dom.Paper.node.getBoundingClientRect()
        const wrapBound = w.globals.dom.elWrap.getBoundingClientRect()
        const offsetX = svgBound.left - wrapBound.left
        const offsetY = svgBound.top - wrapBound.top

        tooltipEl.style.left = offsetX + cx - ttWidth / 2 + 'px'
        tooltipEl.style.top = offsetY + cy - ttHeight - 10 + 'px'
      }
    }
  }

  /** radialBar — one ring per series, single value each */
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
    const arcEl = w.globals.dom.baseEl.querySelector(
      `.apexcharts-radialbar-series[data\\:realIndex='${i}'] path`,
    )
    if (arcEl) {
      const angle = parseFloat(arcEl.getAttribute('data:angle')) || 0
      // Radial bars start from the top (initialAngle) and sweep clockwise
      const initialAngle = w.config.plotOptions.radialBar.startAngle || 0
      const midAngle = initialAngle + angle / 2

      const centerX = w.globals.gridWidth / 2
      const centerY = w.globals.gridHeight / 2
      const radialSize = w.globals.radialSize || Math.min(w.globals.gridWidth, w.globals.gridHeight) / 2

      // Use the outer radius for this particular ring (series i)
      const seriesCount = w.globals.series.length
      const trackSize = radialSize / Math.max(seriesCount, 1)
      const outerRadius = radialSize - i * trackSize
      const innerRadius = outerRadius - trackSize
      const ringRadius = (outerRadius + innerRadius) / 2

      const centroid = Utils.polarToCartesian(centerX, centerY, ringRadius, midAngle)
      const x = centroid.x + (w.globals.translateX || 0)
      const y = centroid.y + (w.globals.translateY || 0)

      tooltipEl.style.left = x - ttWidth / 2 + 'px'
      tooltipEl.style.top = y - ttHeight - 10 + 'px'
    }
  }

  /** heatmap / treemap — position tooltip using element bounding rect */
  _showTooltipHeatTree(i, j, ttCtx, tooltipEl, type) {
    const w = this.w

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

    const cell = w.globals.dom.baseEl.querySelector(
      `.${rectClass}[i='${i}'][j='${j}']`,
    )
    if (cell) {
      // Use viewport-relative rects so we don't need to worry about SVG
      // translate offsets (cx/cy on these elements are in grid-space).
      const wrapRect = w.globals.dom.elWrap.getBoundingClientRect()
      const cellRect = cell.getBoundingClientRect()

      const cellCx = cellRect.left - wrapRect.left
      const cellCy = cellRect.top - wrapRect.top
      const cellWidth = cellRect.width
      const cellHeight = cellRect.height

      // Move crosshair to horizontal centre of cell
      const cx = parseFloat(cell.getAttribute('cx'))
      const cellWidthAttr = parseFloat(cell.getAttribute('width'))
      ttCtx.tooltipPosition.moveXCrosshairs(cx + cellWidthAttr / 2)

      // Position tooltip to the right of the cell, vertically centred;
      // flip left if it would overflow the right half of the grid.
      let x = cellCx + cellWidth + ttWidth / 2
      let y = cellCy + cellHeight / 2 - ttHeight / 2

      if (cellCx + cellWidth > w.globals.gridWidth / 2) {
        x = cellCx - ttWidth / 2
      }

      tooltipEl.style.left = x + 'px'
      tooltipEl.style.top = y + 'px'
    }
  }

  // ─── Focus class management ───────────────────────────────────────────────

  _applyFocusClass(i, j) {
    this._removeFocusClass()

    const el = this._getFocusableElement(i, j)
    if (el) {
      el.classList.add('apexcharts-keyboard-focused')
      this._focusedEl = el
    }
  }

  _removeFocusClass() {
    if (this._focusedEl) {
      this._focusedEl.classList.remove('apexcharts-keyboard-focused')
      this._focusedEl = null
    }
  }

  _leaveHoveredBar() {
    if (this._hoveredBarEl) {
      const graphics = new Graphics(this.ctx)
      graphics.pathMouseLeave(this._hoveredBarEl, null)
      this._hoveredBarEl = null
    }
  }

  _getFocusableElement(i, j) {
    const w = this.w
    const type = w.config.chart.type
    const baseEl = w.globals.dom.baseEl

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

    if (
      type === 'bar' ||
      type === 'candlestick' ||
      type === 'boxPlot' ||
      type === 'rangeBar'
    ) {
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
    return w.globals.series.length
  }

  _getDataPointCount(si) {
    const w = this.w
    const type = w.config.chart.type
    // Non-axis charts: globals.series is a flat array of values (one per slice)
    if (type === 'pie' || type === 'donut' || type === 'polarArea') {
      return w.globals.series.length
    }
    const series = w.globals.series
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
   * Only adjusts when w.globals.seriesX is populated (numeric/datetime axes).
   * Category-only charts (seriesX entries are strings or auto-indices) are
   * unaffected — all points are always visible.
   */
  _snapToVisibleRange() {
    const w = this.w
    const gl = w.globals
    const si = this.seriesIndex

    // No zoom applied — nothing to do
    if (!gl.zoomed) return

    const seriesX = gl.seriesX && gl.seriesX[si]
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
   */
  _snapToVisibleRangeInDirection(direction) {
    const w = this.w
    const gl = w.globals
    const si = this.seriesIndex

    const seriesX = gl.seriesX && gl.seriesX[si]
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
   */
  _isDataPointVisible(si, di) {
    const w = this.w
    const gl = w.globals

    if (!gl.zoomed) return true

    const seriesX = gl.seriesX && gl.seriesX[si]
    if (!seriesX) return true

    const x = seriesX[di]
    if (x === undefined) return true

    return x >= gl.minX && x <= gl.maxX
  }
}
