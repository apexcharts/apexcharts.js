// @ts-check
import Utilities from '../../utils/Utils'
import Graphics from '../Graphics'

/**
 * ApexCharts Tooltip.Utils Class to support Tooltip functionality.
 *
 * @module Tooltip.Utils
 **/

export default class Utils {
  /**
   * @param {import('./Tooltip').default} tooltipContext
   */
  constructor(tooltipContext) {
    this.w = tooltipContext.w
    this.ttCtx = tooltipContext
  }

  /**
   ** When hovering over series, you need to capture which series is being hovered on.
   ** This function will return both capturedseries index as well as inner index of that series
   * @memberof Utils
   * @param {{ hoverArea: any, elGrid: any, clientX: any, clientY: any, context?: any }} opts
   */
  getNearestValues({ hoverArea, elGrid, clientX, clientY }) {
    const w = this.w

    const seriesBound = elGrid.getBoundingClientRect()
    const hoverWidth = seriesBound.width
    const hoverHeight = seriesBound.height

    let xDivisor = hoverWidth / (w.globals.dataPoints - 1)
    const yDivisor = hoverHeight / w.globals.dataPoints

    const hasBars = this.hasBars()

    if (
      (w.globals.comboCharts || hasBars) &&
      !w.config.xaxis.convertedCatToNumeric
    ) {
      xDivisor = hoverWidth / w.globals.dataPoints
    }

    const hoverX = clientX - seriesBound.left - w.globals.barPadForNumericAxis
    const hoverY = clientY - seriesBound.top

    const notInRect =
      hoverX < 0 || hoverY < 0 || hoverX > hoverWidth || hoverY > hoverHeight

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

    let j = Math.round(hoverX / xDivisor)
    const jHorz = Math.floor(hoverY / yDivisor)

    if (hasBars && !w.config.xaxis.convertedCatToNumeric) {
      j = Math.ceil(hoverX / xDivisor)
      j = j - 1
    }

    let capturedSeries = null
    let closest = null

    /**
     * @param {number[]} seriesXVal
     */
    let seriesXValArr = w.globals.seriesXvalues.map(
      (/** @type {any} */ seriesXVal) => {
        /**
         * @param {number} s
         */
        return seriesXVal.filter((/** @type {any} */ s) =>
          Utilities.isNumber(s),
        )
      },
    )
    /**
     * @param {number[]} seriesYVal
     */
    const seriesYValArr = w.globals.seriesYvalues.map(
      (/** @type {any} */ seriesYVal) => {
        /**
         * @param {number} s
         */
        return seriesYVal.filter((/** @type {any} */ s) =>
          Utilities.isNumber(s),
        )
      },
    )

    // if X axis type is not category and tooltip is not shared, then we need to find the cursor position and get the nearest value
    if (w.axisFlags.isXNumeric) {
      // Change origin of cursor position so that we can compute the relative nearest point to the cursor on our chart
      // we only need to scale because all points are relative to the bounds.left and bounds.top => origin is virtually (0, 0)
      const chartGridEl = this.ttCtx.getElGrid()
      if (!chartGridEl) return { hoverX, hoverY }
      const chartGridElBoundingRect = chartGridEl.getBoundingClientRect()
      const transformedHoverX =
        hoverX * (chartGridElBoundingRect.width / hoverWidth)
      const transformedHoverY =
        hoverY * (chartGridElBoundingRect.height / hoverHeight)

      closest = this.closestInMultiArray(
        transformedHoverX,
        transformedHoverY,
        seriesXValArr,
        seriesYValArr,
      )
      capturedSeries = closest.index
      j = closest.j ?? 0

      if (capturedSeries !== null && w.globals.hasNullValues) {
        // initial push, it should be a little smaller than the 1st val
        seriesXValArr = w.globals.seriesXvalues[capturedSeries]

        closest = this.closestInArray(transformedHoverX, seriesXValArr)

        j = closest.j ?? 0
      }
    }

    w.interact.capturedSeriesIndex =
      capturedSeries === null ? -1 : capturedSeries

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
    const w = this.w
    let activeIndex = 0

    /**
     * @param {number[]} xarr
     * @param {number} index
     */
    const firstActiveSeriesIndex = Xarrays.map(
      (/** @type {any} */ xarr, /** @type {any} */ index) => {
        return xarr.length > 0 ? index : -1
      },
    )

    for (let a = 0; a < firstActiveSeriesIndex.length; a++) {
      if (
        firstActiveSeriesIndex[a] !== -1 &&
        w.globals.collapsedSeriesIndices.indexOf(a) === -1 &&
        w.globals.ancillaryCollapsedSeriesIndices.indexOf(a) === -1
      ) {
        activeIndex = firstActiveSeriesIndex[a]
        break
      }
    }
    return activeIndex
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
    if (w.globals.allSeriesHasEqualX) {
      let bucketDistX = Infinity
      for (let i = 0; i < Xarrays.length; i++) {
        if (!isActiveSeries(i)) continue
        const xArr = Xarrays[i]
        const yArr = Yarrays[i]
        const len = Math.min(xArr.length, yArr.length)
        for (let j = 0; j < len; j++) {
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
            if (len < 2) {
              const yVal = yArr[closestPointIndex]
              if (typeof yVal !== 'number') continue
              const d = Math.abs(hoverY - yVal)
              if (d < bestSegDist) {
                bestSegDist = d
                closestSeriesIndex = i
              }
              continue
            }
            for (let j = 0; j < len - 1; j++) {
              const seg = this._distanceToSegment(
                hoverX,
                hoverY,
                xArr[j],
                yArr[j],
                xArr[j + 1],
                yArr[j + 1],
              )
              if (seg.dist < bestSegDist) {
                bestSegDist = seg.dist
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

      if (isLineArea && len >= 2) {
        for (let j = 0; j < len - 1; j++) {
          const seg = this._distanceToSegment(
            hoverX,
            hoverY,
            xArr[j],
            yArr[j],
            xArr[j + 1],
            yArr[j + 1],
          )
          if (seg.dist < closestDist) {
            closestDist = seg.dist
            closestSeriesIndex = i
            // j is used downstream for tooltip content — pick the endpoint
            // the projection landed closer to so the value shown matches
            // what the user is pointing at.
            closestPointIndex = seg.t < 0.5 ? j : j + 1
          }
        }
        continue
      }

      for (let j = 0; j < len; j++) {
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
   * @param {number} val
   * @param {any[]} arr
   */
  closestInArray(val, arr) {
    const curr = arr[0]
    let currIndex = null
    let diff = Math.abs(val - curr)

    for (let i = 0; i < arr.length; i++) {
      const newdiff = Math.abs(val - arr[i])
      if (newdiff < diff) {
        diff = newdiff
        currIndex = i
      }
    }

    return {
      j: currIndex,
    }
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
    const w = this.w
    const xSameForAllSeriesJArr = []

    /**
     * @param {number[]} s
     */
    const seriesX = w.seriesData.seriesX.filter(
      (/** @type {any} */ s) => typeof s[0] !== 'undefined',
    )

    if (seriesX.length > 0) {
      for (let i = 0; i < seriesX.length - 1; i++) {
        if (
          typeof seriesX[i][j] !== 'undefined' &&
          typeof seriesX[i + 1][j] !== 'undefined'
        ) {
          if (seriesX[i][j] !== seriesX[i + 1][j]) {
            xSameForAllSeriesJArr.push('unEqual')
          }
        }
      }
    }

    if (xSameForAllSeriesJArr.length === 0) {
      return true
    }

    return false
  }

  isInitialSeriesSameLen() {
    let sameLen = true

    const initialSeries =
      /** @type {any[]} */ (this.w.globals.initialSeries)?.filter(
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
   * @param {any[]} allbars
   */
  getBarsHeight(allbars) {
    const bars = [...allbars]
    const totalHeight = bars.reduce((acc, bar) => acc + bar.getBBox().height, 0)

    return totalHeight
  }

  /**
   * @param {number} capturedSeries
   */
  getElMarkers(capturedSeries) {
    // The selector .apexcharts-series-markers-wrap > * includes marker groups for which the
    // .apexcharts-series-markers class is not added due to null values or discrete markers
    if (typeof capturedSeries == 'number') {
      return this.w.dom.baseEl.querySelectorAll(
        `.apexcharts-series[data\\:realIndex='${capturedSeries}'] .apexcharts-series-markers-wrap > *`,
      )
    }
    return this.w.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers-wrap > *',
    )
  }

  getAllMarkers(filterCollapsed = false) {
    // first get all marker parents. This parent class contains series-index
    // which helps to sort the markers as they are dynamic
    let markersWraps = /** @type {any[]} */ ([
      ...this.w.dom.baseEl.querySelectorAll('.apexcharts-series-markers-wrap'),
    ])

    if (filterCollapsed) {
      /**
       * @param {any} m
       */
      markersWraps = markersWraps.filter((/** @type {any} */ m) => {
        const realIndex = Number(m.getAttribute('data:realIndex'))
        return this.w.globals.collapsedSeriesIndices.indexOf(realIndex) === -1
      })
    }

    /**
     * @param {any} a
     * @param {any} b
     */
    markersWraps.sort((/** @type {any} */ a, /** @type {any} */ b) => {
      var indexA = Number(a.getAttribute('data:realIndex'))
      var indexB = Number(b.getAttribute('data:realIndex'))
      return indexB < indexA ? 1 : indexB > indexA ? -1 : 0
    })

    /** @type {any[]} */
    const markers = []
    /**
     * @param {any} m
     */
    markersWraps.forEach((/** @type {any} */ m) => {
      markers.push(m.querySelector('.apexcharts-marker'))
    })

    return markers
  }

  /**
   * @param {number} capturedSeries
   */
  hasMarkers(capturedSeries) {
    const markers = this.getElMarkers(capturedSeries)
    return markers.length > 0
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
    return this.w.dom.baseEl.querySelectorAll(
      '.apexcharts-bar-series,  .apexcharts-candlestick-series, .apexcharts-boxPlot-series, .apexcharts-rangebar-series',
    )
  }

  hasBars() {
    const bars = this.getElBars()
    return bars.length > 0
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
