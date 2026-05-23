// @ts-check
import Graphics from '../Graphics'
import Series from '../Series'

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
   */
  moveTooltip(cx, cy, markerSize = null) {
    const ttCtx = this.ttCtx
    const tooltipEl = ttCtx.getElTooltip()
    if (!tooltipEl) return

    const pos = this.computeTooltipPosition(cx, cy, markerSize)
    if (pos === null) return

    this.applyTooltipPosition(tooltipEl, pos)
  }

  /**
   * Pure-ish (reads from `this.ttCtx` + `this.w` but performs no DOM writes)
   * computation of the tooltip box position, edge placement (for arrow),
   * and arrow vertical offset. Returns null when inputs are not numeric.
   *
   * @param {number} cx
   * @param {number} cy
   * @param {number | null} [markerSize]
   * @returns {{ x: number, y: number, placement: 'left'|'right', arrowY: number|null } | null}
   */
  computeTooltipPosition(cx, cy, markerSize = null) {
    const w = this.w
    const ttCtx = this.ttCtx
    const tooltipRect = ttCtx.tooltipRect
    const arrowEnabled = !!w.config.tooltip.arrow
    const pointSize = markerSize !== null ? parseFloat(String(markerSize)) : 1
    const ttH = tooltipRect.ttHeight || 0
    const ttW = tooltipRect.ttWidth || 0

    const cxNum = parseFloat(String(cx))
    const cyNum = parseFloat(String(cy))
    if (isNaN(cxNum)) return null

    let x = cxNum + pointSize + 5
    // Coord-system note: `style.top` positions the tooltip in elWrap-coords,
    // but `cy` is the data point's y in elGraphical-local SVG coords (the
    // grid group is translated by translateY inside the SVG). For arrow
    // mode the box must sit centered on the *actual* point in elWrap-coords,
    // so we add translateY here — mirroring how x picks up translateX
    // further down. Legacy (no-arrow) mode preserves the pre-existing
    // grid-coord behavior to avoid shifting tooltips for existing users.
    const pointY = cyNum + w.layout.translateY
    let y = arrowEnabled
      ? pointY - ttH / 2 + pointSize / 2
      : cyNum + pointSize / 2

    /** @type {'left'|'right'} */
    let placement = 'right'

    if (x > w.layout.gridWidth / 2) {
      x = x - ttW - pointSize - 10
      placement = 'left'
    }

    if (x > w.layout.gridWidth - ttW - 10) {
      x = w.layout.gridWidth - ttW
    }

    if (x < -20) {
      x = -20
    }

    if (w.config.tooltip.followCursor) {
      const elGrid = ttCtx.getElGrid()
      if (!elGrid) return null
      const seriesBound = elGrid.getBoundingClientRect()

      x = ttCtx.e.clientX - seriesBound.left
      if (x > w.layout.gridWidth / 2) {
        x = x - ttW
        placement = 'left'
      } else {
        placement = 'right'
      }
      y = ttCtx.e.clientY + w.layout.translateY - seriesBound.top
      if (y > w.layout.gridHeight / 2) {
        y = y - ttH
      }
    } else {
      if (!w.globals.isBarHorizontal) {
        if (arrowEnabled) {
          // Arrow mode: clamps run in elWrap-coords (grid box top sits at
          // translateY, bottom at translateY+gridHeight).
          const gridTop = w.layout.translateY
          const gridBottom = w.layout.translateY + w.layout.gridHeight
          if (y + ttH > gridBottom) {
            y = gridBottom - ttH
          }
          if (y < gridTop) {
            y = gridTop
          }
        } else {
          // Legacy mode: grid-coords bottom clamp (unchanged).
          if (ttH / 2 + y > w.layout.gridHeight) {
            y = w.layout.gridHeight - ttH + w.layout.translateY
          }
        }
      }
    }

    if (isNaN(x)) return null

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
      // a11y check works in the same coord space as `y` (elWrap for arrow
      // mode, grid for legacy).
      const refPointY = arrowEnabled ? pointY : cyNum
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

    if (w.globals.markers.size[i] > 0) {
      const allPoints = w.dom.baseEl.querySelectorAll(
        ` .apexcharts-series[data\\:realIndex='${i}'] .apexcharts-marker`,
      )
      for (let p = 0; p < allPoints.length; p++) {
        if (parseInt(allPoints[p].getAttribute('rel') ?? '0', 10) === j) {
          ttCtx.marker.resetPointsSize()
          ttCtx.marker.enlargeCurrentPoint(j, allPoints[p])
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
        serType === 'boxPlot')
    ) {
      // fix error mentioned in #811
      return
    }

    cx = pointsArr[capturedSeries]?.[j]?.[0]
    cy = pointsArr[capturedSeries]?.[j]?.[1] || 0

    const point = w.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${capturedSeries}'] .apexcharts-series-markers path`,
    )

    if (point && cy < w.layout.gridHeight && cy > 0) {
      const shape = point.getAttribute('shape') ?? 'circle'

      const path = graphics.getMarkerPath(cx, cy, shape, hoverSize * 1.5)
      point.setAttribute('d', path)
    }

    this.moveXCrosshairs(cx)

    if (!ttCtx.fixedTooltip) {
      this.moveTooltip(cx, cy, hoverSize)
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

    if (pointsArr[activeSeries]?.[j]) {
      cx = pointsArr[activeSeries][j][0]
      cy = pointsArr[activeSeries][j][1]
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
        if (pointArr && pointArr.length) {
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
      this.moveTooltip(cx, cy || w.layout.gridHeight, hoverSize)
    }
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
    let jBar = w.dom.baseEl.querySelector(
      `.apexcharts-bar-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-candlestick-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-boxPlot-series .apexcharts-series[rel='${i}'] path[j='${j}'], .apexcharts-rangebar-series .apexcharts-series[rel='${i}'] path[j='${j}']`,
    )
    if (!jBar && typeof capturedSeries === 'number') {
      // Try with captured series index
      jBar = w.dom.baseEl.querySelector(
        `.apexcharts-bar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
        .apexcharts-candlestick-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
        .apexcharts-boxPlot-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}'],
        .apexcharts-rangebar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j}']`,
      )
    }

    let bcx = jBar ? parseFloat(jBar.getAttribute('cx') ?? '0') : 0
    let bcy = jBar ? parseFloat(jBar.getAttribute('cy') ?? '0') : 0
    const bw = jBar ? parseFloat(jBar.getAttribute('barWidth') ?? '0') : 0

    const elGrid = ttCtx.getElGrid()
    if (!elGrid) return
    const seriesBound = elGrid.getBoundingClientRect()

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
        const center = this._datapointCenterXFromBars(j, seriesBound)
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
      if (!w.globals.isBarHorizontal) {
        bcx =
          ttCtx.xAxisTicksPositions[j - 1] + ttCtx.dataPointsDividedWidth / 2
        if (isNaN(bcx)) {
          bcx = ttCtx.xAxisTicksPositions[j] - ttCtx.dataPointsDividedWidth / 2
        }
      }
    }

    if (!w.globals.isBarHorizontal) {
      if (w.config.tooltip.followCursor) {
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
      // "tooltip goes to the right"). Computed from the union rect of every
      // bar with `[j='${j}']` across visible series.
      if (w.globals.isBarHorizontal && !w.config.tooltip.followCursor) {
        const placed = this.placeHorizontalSharedTooltip(j)
        if (placed) return
      }
      this.moveTooltip(bcx, bcy || w.layout.gridHeight)
    }
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
   * @param {DOMRect} gridRect
   * @returns {number | null}
   */
  _datapointCenterXFromBars(j, gridRect) {
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
    // Convert to data-area-local x. `gridRect` is the `.apexcharts-grid`
    // element rect, whose `.left` extends `barPadForNumericAxis` pixels LEFT
    // of the data area on numeric/datetime axes (the apexcharts-gridlines-
    // horizontal group is widened by that pad on each side so corner bars
    // don't clip). The hover-test path subtracts the same offset in
    // tooltip/Utils.getNearestValues; do it here too so the crosshair lands
    // on the bar center instead of one xDivision to the right.
    return (
      (unionLeft + unionRight) / 2 -
      gridRect.left -
      (w.globals.barPadForNumericAxis || 0)
    )
  }

  /**
   * Place tooltip above (or flipped: below) the union rect of all bars at
   * dataPointIndex `j` for horizontal-bar-likes. Returns true when a
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
    const gridRect = elGrid.getBoundingClientRect()

    // Match every bar variant that uses the j-attribute and isBarHorizontal:
    // bar, rangeBar, boxPlot (boxPlot's `horizontal` is enforced false at
    // config-time, but the selector is harmless).
    const bars = w.dom.baseEl.querySelectorAll(
      `.apexcharts-bar-series path[j='${j}'],` +
        `.apexcharts-rangebar-series path[j='${j}'],` +
        `.apexcharts-boxPlot-series path[j='${j}']`,
    )
    if (!bars.length) return false

    let unionLeft = Infinity
    let unionRight = -Infinity
    let unionTop = Infinity
    let unionBottom = -Infinity
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

    const ttW = ttCtx.tooltipRect.ttWidth || 0
    const ttH = ttCtx.tooltipRect.ttHeight || 0
    const ARROW_TIP_OVERHANG = 7

    // Convert union rect (viewport-coords) into elWrap-coords. The tooltip
    // is positioned via style.left/top inside elWrap; elGrid is offset from
    // elWrap by (translateX, translateY).
    const rowCenterX =
      (unionLeft + unionRight) / 2 - gridRect.left + w.layout.translateX
    const rowTopElWrap = unionTop - gridRect.top + w.layout.translateY
    const rowBottomElWrap = unionBottom - gridRect.top + w.layout.translateY

    const gridTop = w.layout.translateY
    const gridBottom = w.layout.translateY + w.layout.gridHeight
    const gridLeft = w.layout.translateX
    const gridRight = w.layout.translateX + w.layout.gridWidth

    /** @type {'top'|'bottom'} */
    let placement = 'top'
    let finalY = rowTopElWrap - ttH - ARROW_TIP_OVERHANG
    if (finalY < gridTop) {
      const belowTop = rowBottomElWrap + ARROW_TIP_OVERHANG
      if (belowTop + ttH <= gridBottom) {
        placement = 'bottom'
        finalY = belowTop
      }
    }

    let finalX = rowCenterX - ttW / 2
    if (finalX < gridLeft) finalX = gridLeft
    if (finalX + ttW > gridRight) finalX = gridRight - ttW

    // Arrow rendering itself is gated upstream (skipped for shared+multi),
    // but we still pass arrowX/placement so single-series-shared horizontal
    // (where arrow IS drawn) lines up correctly.
    const arrowX = Math.max(10, Math.min(ttW - 10, rowCenterX - finalX))

    this.applyTooltipPosition(tooltipEl, {
      x: finalX,
      y: finalY,
      placement,
      arrowY: null,
      arrowX,
    })
    return true
  }
}
