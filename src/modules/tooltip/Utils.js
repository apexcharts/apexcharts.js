// @ts-check
import AxisMapping from '../AxisMapping'
import Graphics from '../Graphics'

/**
 * ApexCharts Tooltip.Utils Class to support Tooltip functionality.
 *
 * @module Tooltip.Utils
 **/

export default class Utils {
  /**
   * Interactive custom tooltip content must remain reachable, so it takes
   * precedence over cursor-following placement without changing the user's
   * configured `followCursor` value.
   *
   * Kept independent of a Tooltip instance because Position and Intersect are
   * also used with lightweight contexts that only provide `w`.
   *
   * @param {import('../../types/internal').ChartStateW} w
   */
  static isFollowCursor(w) {
    return w.config.tooltip.followCursor && !w.config.tooltip.interactive
  }

  /**
   * The pointer for this event, in client px, as this chart sees it: in a
   * group `seriesHover` hands each member the pointer already mapped into its
   * own space (`opt.clientX/Y`), and the raw event only belongs to the
   * hovered chart. Read it from the event rather than `w.interact`, which a
   * listener on the chart's root fills in only after this event has passed
   * the series it is hovering.
   *
   * @param {any} e
   * @param {{ clientX?: number, clientY?: number }} [opt]
   * @returns {{ x: number, y: number }}
   */
  static eventPointer(e, opt = {}) {
    const touch = e?.type?.startsWith('touch') ? e.touches?.[0] : null
    return {
      x: opt.clientX ?? (touch ? touch.clientX : e?.clientX) ?? 0,
      y: opt.clientY ?? (touch ? touch.clientY : e?.clientY) ?? 0,
    }
  }

  /**
   * The plot area on screen, in client px: {@link AxisMapping.plotRect}.
   * @param {import('../../types/internal').ChartStateW} w
   */
  static plotRect(w) {
    return AxisMapping.plotRect(w)
  }

  /**
   * The plot's corner in elWrap px, the space the tooltip's `style.left/top`
   * are written in: `plotRect` less elWrap's own corner, both measured. A
   * rect measured against `plotRect` goes back into elWrap px through this,
   * never through (translateX, translateY): those leave out whatever moves
   * the whole svg inside elWrap, `chart.offsetX/offsetY` among them (Core
   * translates the root svg by them), and the box landed that far off its
   * mark.
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @returns {{ left: number, top: number }}
   */
  static plotInWrap(w) {
    const plot = Utils.plotRect(w)
    const wrap = w.dom.elWrap.getBoundingClientRect()
    return { left: plot.left - wrap.left, top: plot.top - wrap.top }
  }

  /**
   * Does the chart draw any violin? A violin chart, or a violin series mixed
   * into a chart of another type (violin is an xy type, so combos take it).
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @returns {boolean}
   */
  static hasViolinSeries(w) {
    return (
      w.config.chart.type === 'violin' ||
      (w.config.series || []).some(
        (/** @type {any} */ s) => s && s.type === 'violin',
      )
    )
  }

  /**
   * Is this a chart whose violins are painted to canvas, so hovered through
   * one listener on the whole plot and found by the renderer's hit test
   * (Intersect.getViolinMark)?
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @returns {boolean}
   */
  static isCanvasViolinChart(w) {
    return Utils.isCanvasBarChart(w) && Utils.hasViolinSeries(w)
  }

  /**
   * Is `type` drawn as a bar-like mark: a bar or column, a range bar (a
   * timeline, a dumbbell, a waterfall), a candlestick, a box plot or a
   * violin?
   *
   * @param {any} type  a chart or series type
   * @returns {boolean}
   */
  static isBarLikeType(type) {
    return (
      type === 'bar' ||
      type === 'column' ||
      type === 'rangeBar' ||
      type === 'candlestick' ||
      type === 'boxPlot' ||
      type === 'violin'
    )
  }

  /**
   * Does the chart draw any bar-like mark (isBarLikeType)? As the chart
   * type, or as a series mixed into a combo.
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @returns {boolean}
   */
  static hasBarLikeSeries(w) {
    return (
      Utils.isBarLikeType(w.config.chart.type) ||
      (w.config.series || []).some(
        (/** @type {any} */ s) => s && Utils.isBarLikeType(s.type),
      )
    )
  }

  /**
   * Is this a chart whose bar-likes are painted to canvas, so hovered
   * through one listener on the whole plot and found by the renderer's hit
   * test (Intersect.getPaintedMark) rather than by a node under the pointer?
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @returns {boolean}
   */
  static isCanvasBarChart(w) {
    const renderer = w.globals.activeRenderer
    return (
      renderer?.kind === 'canvas' &&
      typeof renderer.hitTest === 'function' &&
      Utils.hasBarLikeSeries(w)
    )
  }

  /**
   * Is this an xy chart whose markers are painted to canvas, so an intersect
   * tooltip finds the hovered one by the renderer's hit test
   * (Intersect.getPaintedMarker) rather than by a marker node under the
   * pointer? Cell charts (a heatmap) have no markers to find.
   *
   * @param {import('../../types/internal').ChartStateW} w
   * @returns {boolean}
   */
  static isCanvasMarkerChart(w) {
    const renderer = w.globals.activeRenderer
    return (
      renderer?.kind === 'canvas' &&
      typeof renderer.hitTestMarker === 'function' &&
      !!w.globals.xyCharts
    )
  }

  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
  }

  /**
   * The element the pointer was over when a hover event fired, which is not
   * always what `e.target` says later on.
   *
   * Hover events are coalesced through a ~20ms timer (Tooltip.onSeriesHover),
   * so a good half of them are read back after they have finished propagating.
   * At that point a chart living inside a shadow root has had its target
   * retargeted to the host element, every `classList.contains('apexcharts-…')`
   * gate below fails, and the tooltip is left wherever the previous event put
   * it (#3237). `composedPath()` is no help after dispatch either: it returns
   * an empty array.
   *
   * Called while the event is still dispatching (`eventPhase` is then
   * non-zero) this remembers the real target on the event for the deferred
   * readers; called afterwards it hands that back. Outside a shadow root
   * nothing is retargeted and it is `e.target` either way.
   *
   * @param {any} e
   * @returns {any}
   */
  static hoverTarget(e) {
    if (!e) return null
    if (e.eventPhase && e.target) {
      e.apexHoverTarget = e.target
    }
    return e.apexHoverTarget || e.target
  }

  /**
   ** When hovering over series, you need to capture which series is being hovered on.
   ** This function will return both capturedseries index as well as inner index of that series
   * @memberof Utils
   * @param {{ hoverArea: any, clientX: any, clientY: any, context?: any }} opts
   */
  getNearestValues({ hoverArea, clientX, clientY }) {
    const w = this.w

    // Both coordinates in plot px, the space the series are laid out in:
    // under CSS zoom a screen distance is divided by the zoom to get there.
    const seriesBound = Utils.plotRect(w)
    const hoverWidth = w.layout.gridWidth
    const hoverHeight = w.layout.gridHeight
    const dataPoints = w.globals.dataPoints

    let xDivisor = hoverWidth / (dataPoints - 1)
    const yDivisor = hoverHeight / dataPoints

    // A category axis that puts each point in the middle of its own slot
    // (bars, combos, and `tickPlacement: 'between'`) resolves the slot under
    // the pointer, not the nearest of n - 1 gaps.
    const slotted =
      (w.globals.comboCharts ||
        this.hasBars() ||
        w.config.xaxis.tickPlacement === 'between') &&
      !w.config.xaxis.convertedCatToNumeric

    if (slotted) {
      xDivisor = hoverWidth / dataPoints
    }

    const hoverX = (clientX - seriesBound.left) / seriesBound.zoom
    const hoverY = (clientY - seriesBound.top) / seriesBound.zoom

    // Edge bars hang `barPadForNumericAxis / 2` outside the plot box, and the
    // zoom/pan cursor should still show there. Same allowance as the tooltip
    // bound in `Tooltip.handleStickyTooltip`.
    const edgePad = w.globals.barPadForNumericAxis || 0
    const notInRect =
      hoverX < -edgePad ||
      hoverY < 0 ||
      hoverX > hoverWidth + edgePad ||
      hoverY > hoverHeight

    if (notInRect) {
      hoverArea.classList.remove('hovering-zoom')
      hoverArea.classList.remove('hovering-pan')
    } else {
      if (w.interact.zoomEnabled) {
        hoverArea.classList.remove('hovering-pan')
        hoverArea.classList.add('hovering-zoom')
      } else if (w.interact.panEnabled) {
        hoverArea.classList.remove('hovering-zoom')
        hoverArea.classList.add('hovering-pan')
      }
    }

    let j = slotted
      ? Math.ceil(hoverX / xDivisor) - 1
      : Math.round(hoverX / xDivisor)
    let jHorz = Math.floor(hoverY / yDivisor)

    let capturedSeries = null

    // if X axis type is not category and tooltip is not shared, then we need to find the cursor position and get the nearest value
    if (w.axisFlags.isXNumeric) {
      // The unfiltered arrays go in, so the `j` that comes back is a data
      // index shared by every series. closestInMultiArray skips any point
      // whose x or y is not a number; a null used to be filtered out of x
      // and y separately, which paired them off by one wherever only one of
      // the two was null (a straight curve writes a floor y for a null).
      const closest = this.closestInMultiArray(
        hoverX,
        hoverY,
        w.globals.seriesXvalues,
        w.globals.seriesYvalues,
      )
      capturedSeries = closest.index
      j = closest.j ?? 0
    }

    w.interact.capturedSeriesIndex =
      capturedSeries === null ? -1 : capturedSeries

    // The pixel just past the plot's far edge is still in bounds for the
    // caller, and must not resolve a category beyond the last one.
    if (j > dataPoints - 1) j = dataPoints - 1
    if (jHorz > dataPoints - 1) jHorz = dataPoints - 1
    if (!j || j < 1) j = 0

    if (w.globals.isBarHorizontal) {
      w.interact.capturedDataPointIndex = jHorz
    } else {
      w.interact.capturedDataPointIndex = j
    }

    return {
      capturedSeries,
      j: w.globals.isBarHorizontal ? jHorz : j,
      hoverX,
      hoverY,
    }
  }

  /**
   * @param {any[]} Xarrays
   */
  getFirstActiveXArray(Xarrays) {
    const gl = this.w.globals
    const a = Xarrays.findIndex(
      (/** @type {any} */ xarr, /** @type {number} */ i) =>
        xarr.length > 0 &&
        gl.collapsedSeriesIndices.indexOf(i) === -1 &&
        gl.ancillaryCollapsedSeriesIndices.indexOf(i) === -1,
    )
    return a < 0 ? 0 : a
  }

  /**
   * @param {number} hoverX
   * @param {number} hoverY
   * @param {any[]} Xarrays
   * @param {any[]} Yarrays
   */
  closestInMultiArray(hoverX, hoverY, Xarrays, Yarrays) {
    const w = this.w

    // Determine which series are active (not collapsed)
    /**
     * @param {number} seriesIndex
     */
    const isActiveSeries = (seriesIndex) => {
      return (
        w.globals.collapsedSeriesIndices.indexOf(seriesIndex) === -1 &&
        w.globals.ancillaryCollapsedSeriesIndices.indexOf(seriesIndex) === -1
      )
    }

    // For pure line/area charts, measure distance to the line *segments*
    // between consecutive points instead of just to the markers. Without
    // this, hovering halfway between two markers picks whichever series's
    // marker happens to be nearest to that empty space — often the wrong
    // line. Only safe for non-combo line/area; bars/scatter/etc. fall
    // through to the marker-distance path below.
    const chartType = w.config.chart.type
    const isLineArea =
      !w.globals.comboCharts && (chartType === 'line' || chartType === 'area')

    let closestDist = Infinity
    let closestSeriesIndex = null
    let closestPointIndex = null

    // When series share an x-axis we want two independent answers:
    //   • `j` — the x-bucket the cursor is over. Must come from X distance
    //     only, otherwise a marker whose Y is closer at a far-away x wins
    //     and `j` jumps across many indices as the cursor sweeps
    //     horizontally — e.g. cursor at y=60 over a line that crosses
    //     y=60 at two distant points snaps to whichever crossing is
    //     nearest, skipping everything between. Affects shared:false
    //     single-series sweep too; the segment-distance commit made it
    //     more visible but the underlying issue is the same.
    //   • `index` — which series is "under" the cursor (used by
    //     markerClick / dataPointMouseEnter). For line/area we use
    //     perpendicular distance to each series's line segments so a
    //     click on a line between markers reports that line. Otherwise
    //     we use nearest Y at the chosen bucket.
    // Every array is indexed by data point and may hold nulls, and a point
    // counts only when both its x and its y are numbers. Segments join each
    // drawn point to the previous drawn one, bridging the gap.
    const isPoint = (
      /** @type {any[]} */ xArr,
      /** @type {any[]} */ yArr,
      /** @type {number} */ j,
    ) => Number.isFinite(xArr[j]) && Number.isFinite(yArr[j])

    if (w.globals.allSeriesHasEqualX) {
      let bucketDistX = Infinity
      for (let i = 0; i < Xarrays.length; i++) {
        if (!isActiveSeries(i)) continue
        const xArr = Xarrays[i]
        const yArr = Yarrays[i]
        const len = Math.min(xArr.length, yArr.length)
        for (let j = 0; j < len; j++) {
          if (!isPoint(xArr, yArr, j)) continue
          const distX = Math.abs(hoverX - xArr[j])
          if (distX < bucketDistX) {
            bucketDistX = distX
            closestPointIndex = j
          }
        }
      }
      if (closestPointIndex !== null) {
        if (isLineArea) {
          let bestSegDist = Infinity
          for (let i = 0; i < Xarrays.length; i++) {
            if (!isActiveSeries(i)) continue
            const xArr = Xarrays[i]
            const yArr = Yarrays[i]
            const len = Math.min(xArr.length, yArr.length)
            let prev = -1
            let segs = 0
            for (let j = 0; j < len; j++) {
              if (!isPoint(xArr, yArr, j)) continue
              if (prev >= 0) {
                segs++
                const seg = this._distanceToSegment(
                  hoverX,
                  hoverY,
                  xArr[prev],
                  yArr[prev],
                  xArr[j],
                  yArr[j],
                )
                if (seg.dist < bestSegDist) {
                  bestSegDist = seg.dist
                  closestSeriesIndex = i
                }
              }
              prev = j
            }
            if (!segs) {
              const yVal = yArr[closestPointIndex]
              if (typeof yVal !== 'number') continue
              const d = Math.abs(hoverY - yVal)
              if (d < bestSegDist) {
                bestSegDist = d
                closestSeriesIndex = i
              }
            }
          }
        } else {
          let bestY = Infinity
          for (let i = 0; i < Xarrays.length; i++) {
            if (!isActiveSeries(i)) continue
            const yVal = Yarrays[i][closestPointIndex]
            if (typeof yVal !== 'number') continue
            const distY = Math.abs(hoverY - yVal)
            if (distY < bestY) {
              bestY = distY
              closestSeriesIndex = i
            }
          }
        }
      }
      return {
        index: closestSeriesIndex,
        j: closestPointIndex,
      }
    }

    // Non-shared tooltip path. Line/area uses segment distance so clicks
    // landing on a line between markers report the right series; other
    // chart types fall back to marker (Euclidean) distance.
    for (let i = 0; i < Xarrays.length; i++) {
      if (!isActiveSeries(i)) {
        continue
      }

      const xArr = Xarrays[i]
      const yArr = Yarrays[i]

      const len = Math.min(xArr.length, yArr.length)

      if (isLineArea) {
        let prev = -1
        let segs = 0
        for (let j = 0; j < len; j++) {
          if (!isPoint(xArr, yArr, j)) continue
          if (prev >= 0) {
            segs++
            const seg = this._distanceToSegment(
              hoverX,
              hoverY,
              xArr[prev],
              yArr[prev],
              xArr[j],
              yArr[j],
            )
            if (seg.dist < closestDist) {
              closestDist = seg.dist
              closestSeriesIndex = i
              // j is used downstream for tooltip content — pick the endpoint
              // the projection landed closer to so the value shown matches
              // what the user is pointing at.
              closestPointIndex = seg.t < 0.5 ? prev : j
            }
          }
          prev = j
        }
        if (segs) continue
      }

      for (let j = 0; j < len; j++) {
        if (!isPoint(xArr, yArr, j)) continue
        const xVal = xArr[j]
        const distX = hoverX - xVal
        const yVal = yArr[j]
        const distY = hoverY - yVal
        const dist = Math.sqrt(distX * distX + distY * distY)

        if (dist < closestDist) {
          closestDist = dist
          closestSeriesIndex = i
          closestPointIndex = j
        }
      }
    }

    return {
      index: closestSeriesIndex,
      j: closestPointIndex,
    }
  }

  /**
   * Perpendicular distance from point (px, py) to the line segment
   * (ax, ay) → (bx, by). Returns the distance plus the projection
   * parameter t (0 = at A, 1 = at B, clamped) so callers know which
   * endpoint the projection landed nearest.
   * @param {number} px
   * @param {number} py
   * @param {number} ax
   * @param {number} ay
   * @param {number} bx
   * @param {number} by
   * @returns {{ dist: number, t: number }}
   */
  _distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax
    const dy = by - ay
    const lenSq = dx * dx + dy * dy
    let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq
    if (t < 0) t = 0
    else if (t > 1) t = 1
    const cx = ax + t * dx
    const cy = ay + t * dy
    const ex = px - cx
    const ey = py - cy
    return { dist: Math.sqrt(ex * ex + ey * ey), t }
  }

  /**
   * When there are multiple series, it is possible to have different x values for each series.
   * But it may be possible in those multiple series, that there is same x value for 2 or more
   * series.
   * @memberof Utils
   * @param {number} j - the inner index of series (series[i][j])
   * @return {boolean}
   */
  isXoverlap(j) {
    const seriesX = this.w.seriesData.seriesX.filter(
      (/** @type {any} */ s) => s[0] !== undefined,
    )

    for (let i = 0; i < seriesX.length - 1; i++) {
      const a = seriesX[i][j]
      const b = seriesX[i + 1][j]
      if (a !== undefined && b !== undefined && a !== b) return false
    }
    return true
  }

  isInitialSeriesSameLen() {
    let sameLen = true

    // read the non-materializing peek: this runs per update/hover, and only
    // needs data lengths (the initialSeries getter would deep-clone)
    const initialSeries =
      /** @type {any[]} */ (
        this.w.globals._initialSeriesPeek ?? this.w.globals.initialSeries
      )?.filter(
        /**
         * @param {Record<string, any>} s
         * @param {number} i
         */
        (s, i) => !this.w.globals.collapsedSeriesIndices?.includes(i),
      ) || []

    for (let i = 0; i < initialSeries.length - 1; i++) {
      if (!initialSeries[i]?.data || !initialSeries[i + 1]?.data) return true
      if (initialSeries[i].data.length !== initialSeries[i + 1].data.length) {
        sameLen = false
        break
      }
    }
    return sameLen
  }

  /**
   * Facts about the drawn chart that only a render changes (has it bars, has
   * series i markers, its hover dots), so a hover asks the DOM once per
   * render rather than once or more per move. Kept on the Tooltip, which
   * Labels' own Utils shares, and dropped by drawTooltip, which every render
   * and data update with a tooltip runs (without one nothing hovers).
   * @returns {Record<string, any>}
   */
  facts() {
    const t = /** @type {any} */ (this.ttCtx)
    return (t._facts ||= {})
  }

  /**
   * Per marker wrap, in realIndex order: its realIndex, its first marker
   * (null without one) and, when another node, its first marker-group path.
   * These are the nodes the
   * hover dot writers move (Position.moveDynamicPoint(s)OnHover,
   * Marker.enlargePaintedPoint), so all a hide has to put back besides the
   * markers it grew.
   * @returns {any[][]}
   */
  markerWraps() {
    return (this.facts().wraps ??= [
      ...this.w.dom.baseEl.querySelectorAll('.apexcharts-series-markers-wrap'),
    ]
      .map((m) => [
        Number(m.getAttribute('data:realIndex')),
        // usually one node twice
        ...new Set([
          m.querySelector('.apexcharts-marker'),
          m.querySelector('.apexcharts-series-markers path'),
        ]),
      ])
      .sort((a, b) => a[0] - b[0]))
  }

  getAllMarkers(filterCollapsed = false) {
    const collapsed = this.w.globals.collapsedSeriesIndices
    // A fresh array: callers splice into it.
    return this.markerWraps()
      .filter((m) => !filterCollapsed || collapsed.indexOf(m[0]) < 0)
      .map((m) => m[1])
  }

  /**
   * @param {number} i
   */
  hasMarkers(i) {
    // The `> *` includes marker groups for which the .apexcharts-series-markers
    // class is not added due to null values or discrete markers
    return (this.facts()['m' + i] ??= !!this.w.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}'] .apexcharts-series-markers-wrap > *`,
    ))
  }

  /**
   * Whether any visible series has a marker node, its points' or its hover
   * dot's.
   */
  hasVisibleMarkers() {
    return this.getAllMarkers(true).some(Boolean)
  }

  /**
   * @param {any} point
   * @param {number} size
   */
  getPathFromPoint(point, size) {
    const cx = Number(point.getAttribute('cx'))
    const cy = Number(point.getAttribute('cy'))
    const shape = point.getAttribute('shape')
    return new Graphics(this.w).getMarkerPath(cx, cy, shape, size)
  }

  getElBars() {
    return (this.facts().bars ??= this.w.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-series,  .apexcharts-candlestick-series, .apexcharts-boxPlot-series, .apexcharts-violin-series, .apexcharts-rangebar-series',
    ))
  }

  hasBars() {
    return this.getElBars().length > 0
  }

  /**
   * @param {number} index
   */
  getHoverMarkerSize(index) {
    const w = this.w
    let hoverSize = w.config.markers.hover.size

    if (hoverSize === undefined) {
      hoverSize =
        w.globals.markers.size[index] + w.config.markers.hover.sizeOffset
    }
    return hoverSize
  }

  /**
   * @param {string} state
   */
  toggleAllTooltipSeriesGroups(state) {
    const w = this.w
    const ttCtx = this.ttCtx

    if (ttCtx.allTooltipSeriesGroups.length === 0) {
      ttCtx.allTooltipSeriesGroups = w.dom.baseEl.querySelectorAll(
        '.apexcharts-tooltip-series-group',
      )
    }

    const allTooltipSeriesGroups = ttCtx.allTooltipSeriesGroups
    for (let i = 0; i < allTooltipSeriesGroups.length; i++) {
      if (state === 'enable') {
        allTooltipSeriesGroups[i].classList.add('apexcharts-active')
        allTooltipSeriesGroups[i].style.display = w.config.tooltip.items.display
      } else {
        allTooltipSeriesGroups[i].classList.remove('apexcharts-active')
        allTooltipSeriesGroups[i].style.display = 'none'
      }
    }
  }
}
