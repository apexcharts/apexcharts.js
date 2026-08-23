// @ts-check
import Filters from './Filters'
import Graphics from './Graphics'
import Utils from '../utils/Utils'
import { applyProgressiveReveal } from './Animations'
import { seriesEmitter } from '../renderers/Renderer'

/**
 * ApexCharts Markers Class for drawing markers on y values in axes charts.
 *
 * @module Markers
 **/

export default class Markers {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // forwarded to public event callbacks by Graphics and seriesEmitter

    this._filters = new Filters(this.w)
    this._graphics = new Graphics(this.w, this.ctx)

    // plotChartMarkers runs once per data point (Line's j loop), so the
    // standard per-series wrap group is cached here after its first creation:
    // ONE group + ONE delegation setup per series instead of per point.
    /** @type {any} */ this._seriesWrap = null
    /** @type {number} */ this._seriesWrapIndex = -1

    // Batched mode (markers.largeDatasetThreshold): subpaths accumulate here
    // across the j loop and flushBatch turns them into a single path element.
    /** @type {{seriesIndex: number, d: string[], opts: any} | null} */
    this._batch = null
  }

  /**
   * Invalidate the cached per-series wrap group. Callers that drive
   * plotChartMarkers point-by-point (Line) must call this when a series'
   * element tree is (re)created, so a later render never appends markers to a
   * detached group from the previous pass.
   */
  resetSeriesWrapCache() {
    this._seriesWrap = null
    this._seriesWrapIndex = -1
    this._batch = null
  }

  /**
   * Are this chart's markers non-interactive? True for a plain line/area with
   * the default sweep tooltip, which is exactly when `no-pointer-events` is
   * added below: markers are painted but never hit-tested, so nothing needs a
   * per-point node to receive events.
   * @param {import('../types/internal').ChartStateW} w
   */
  static markersAreInert(w) {
    const type = w.config.chart.type
    return (
      (type === 'line' || type === 'area') &&
      !w.globals.comboCharts &&
      !w.config.tooltip.intersect
    )
  }

  /**
   * Decide whether this chart draws each series' markers as ONE path element
   * (a subpath per point) instead of one element per point.
   *
   * This is deliberately all-or-nothing for the chart rather than per series.
   * The tooltip's hover indicator is chosen once for the whole chart, and a
   * chart with some batched and some per-point series would enlarge a node
   * belonging to the wrong series (`getAllMarkers` takes the first
   * `.apexcharts-marker` under each wrap), so mixed mode is not worth the
   * surface it would add.
   *
   * Every gate here is a feature that genuinely needs its own element per
   * point. Batching is skipped rather than half-supported for all of them.
   * @returns {boolean}
   */
  _shouldBatch() {
    const w = this.w
    const m = w.config.markers
    const threshold = m.largeDatasetThreshold ?? 0
    if (threshold <= 0) return false

    // canvas already paints markers into a bitmap, with no nodes at all
    if (this.ctx?.renderer?.kind === 'canvas') return false

    if (!Markers.markersAreInert(w)) return false

    // per-point shapes/sizes/colours, and click targets, need per-point nodes
    if (m.discrete && m.discrete.length) return false
    if (m.onClick || m.onDblClick) return false

    // toggleDataPointSelection resolves a point by `path[j=...]`, and
    // setSelectionFilter applies the active filter to that one element
    if (w.config.chart.events?.dataPointSelection) return false

    /** @type {any[]} */
    const series = w.seriesData.series
    if (!Array.isArray(series) || !series.length) return false

    let anyOverThreshold = false
    for (let i = 0; i < series.length; i++) {
      if (!Array.isArray(series[i])) return false
      // a series drawing no markers neither blocks nor triggers batching
      if (!(w.globals.markers.size[i] > 0)) continue
      if (series[i].length > threshold) anyOverThreshold = true

      // per-point fillColor/strokeColor make the series' markers non-uniform,
      // so they could not share one path's style attributes
      const data = /** @type {Record<string, any>} */ (w.config.series[i])?.data
      if (Array.isArray(data)) {
        for (let j = 0; j < data.length; j++) {
          const d = data[j]
          if (d && (d.fillColor || d.strokeColor)) return false
        }
      }
    }

    return anyOverThreshold
  }

  setGlobalMarkerSize() {
    const w = this.w

    w.globals.markers.size = Array.isArray(w.config.markers.size)
      ? w.config.markers.size
      : [w.config.markers.size]

    if (w.globals.markers.size.length > 0) {
      if (w.globals.markers.size.length < w.seriesData.series.length + 1) {
        for (let i = 0; i <= w.seriesData.series.length; i++) {
          if (typeof w.globals.markers.size[i] === 'undefined') {
            w.globals.markers.size.push(w.globals.markers.size[0])
          }
        }
      }
    } else {
      w.globals.markers.size = w.config.series.map(
        () => /** @type {number} */ (w.config.markers.size),
      )
    }

    // Decided once here, after the per-series sizes resolve and before any
    // geometry, so every consumer sees the same answer for the whole render.
    w.globals.markers.batched = this._shouldBatch()
  }

  /** @param {{ pointsPos?: any, seriesIndex?: any, j?: any, pSize?: any, alwaysDrawMarker?: boolean, isVirtualPoint?: boolean }} opts */
  plotChartMarkers({
    pointsPos,
    seriesIndex,
    j,
    pSize,
    alwaysDrawMarker = false,
    isVirtualPoint = false,
  }) {
    const w = this.w

    const i = seriesIndex
    const p = pointsPos
    let elMarkersWrap = null

    const graphics = new Graphics(this.w)
    // Strata (#2): markers are the per-point node killer, so they emit through
    // the active renderer (canvas records them). The wrap group stays SVG.
    const emit = seriesEmitter(this.ctx, graphics)

    const hasDiscreteMarkers =
      w.config.markers.discrete && w.config.markers.discrete.length

    if (Array.isArray(p.x)) {
      for (let q = 0; q < p.x.length; q++) {
        let markerElement

        let dataPointIndex = j
        let invalidMarker = !Utils.isNumber(p.y[q])

        if (
          w.globals.markers.largestSize === 0 &&
          w.globals.hasNullValues &&
          w.seriesData.series[i][j + 1] !== null &&
          !isVirtualPoint
        ) {
          invalidMarker = true
        }

        // a small hack as we have 2 points for the first val to connect it
        if (j === 1 && q === 0) dataPointIndex = 0
        if (j === 1 && q === 1) dataPointIndex = 1

        let markerClasses = 'apexcharts-marker'
        if (Markers.markersAreInert(w)) {
          markerClasses += ' no-pointer-events'
        }

        const shouldMarkerDraw = Array.isArray(w.config.markers.size)
          ? w.globals.markers.size[seriesIndex] > 0
          : w.config.markers.size > 0

        // Batched mode: collect a subpath instead of building an element. The
        // special wraps (the null-value virtual point, discrete markers) still
        // emit their own elements, so they are excluded here as well as by
        // _shouldBatch.
        const batchThisPoint =
          w.globals.markers.batched &&
          shouldMarkerDraw &&
          !alwaysDrawMarker &&
          !hasDiscreteMarkers
        if (batchThisPoint) {
          this._batchPoint(seriesIndex, dataPointIndex, p.x[q], p.y[q], {
            invalid: invalidMarker,
            graphics,
          })
          continue
        }

        if (shouldMarkerDraw || alwaysDrawMarker || hasDiscreteMarkers) {
          // Strata (#2): in canvas mode markers paint to a bitmap and expose no
          // cx/cy nodes, so mirror the markers-off pointsArray cache here to
          // feed the tooltip/crosshair position path.
          if (emit.kind === 'canvas') {
            if (typeof w.globals.pointsArray[seriesIndex] === 'undefined') {
              w.globals.pointsArray[seriesIndex] = []
            }
            w.globals.pointsArray[seriesIndex][dataPointIndex] = [p.x[q], p.y[q]]
          }
          if (!invalidMarker) {
            markerClasses += ` w${Utils.randomId()}`
          }

          const opts = this.getMarkerConfig({
            cssClass: markerClasses,
            seriesIndex,
            dataPointIndex,
          })

          const _si = /** @type {Record<string,any>} */ (w.config.series[i])
          if (_si.data[dataPointIndex]) {
            if (_si.data[dataPointIndex].fillColor) {
              opts.pointFillColor = _si.data[dataPointIndex].fillColor
            }

            if (_si.data[dataPointIndex].strokeColor) {
              opts.pointStrokeColor = _si.data[dataPointIndex].strokeColor
            }
          }

          if (typeof pSize !== 'undefined') {
            opts.pSize = pSize
          }

          if (
            p.x[q] < -w.globals.markers.largestSize ||
            p.x[q] > w.layout.gridWidth + w.globals.markers.largestSize ||
            p.y[q] < -w.globals.markers.largestSize ||
            p.y[q] > w.layout.gridHeight + w.globals.markers.largestSize
          ) {
            opts.pSize = 0
          }

          if (!invalidMarker) {
            const shouldCreateMarkerWrap =
              w.globals.markers.size[seriesIndex] > 0 ||
              alwaysDrawMarker ||
              hasDiscreteMarkers
            if (shouldCreateMarkerWrap && !elMarkersWrap) {
              // The standard series wrap is identical for every point of a
              // series, so reuse the one created on the series' first point
              // (callers detect the reuse by identity and skip re-appending).
              // Special wraps (null-value virtual points, discrete markers)
              // keep their per-call groups.
              const standardWrap = !alwaysDrawMarker && !hasDiscreteMarkers
              if (
                standardWrap &&
                this._seriesWrap &&
                this._seriesWrapIndex === seriesIndex
              ) {
                elMarkersWrap = this._seriesWrap
              } else {
                elMarkersWrap = emit.group({
                  class: standardWrap ? 'apexcharts-series-markers' : '',
                })
                elMarkersWrap.attr(
                  'clip-path',
                  `url(#gridRectMarkerMask${w.globals.cuid})`,
                )
                // Set up event delegation once on the group
                this.setupMarkerDelegation(elMarkersWrap)
                if (standardWrap) {
                  this._seriesWrap = elMarkersWrap
                  this._seriesWrapIndex = seriesIndex
                }
              }
            }
            markerElement = emit.drawMarker(p.x[q], p.y[q], opts)

            markerElement.attr('rel', dataPointIndex)
            markerElement.attr('j', dataPointIndex)
            markerElement.attr('index', seriesIndex)
            markerElement.node.setAttribute('default-marker-size', opts.pSize)

            // Progressive reveal: each marker fades in as the line's draw
            // effect reaches its x position. No-op when draw mode is disabled
            // or chart type isn't line/area/rangeArea.
            applyProgressiveReveal(markerElement, p.x[q], w)

            this._filters.setSelectionFilter(
              markerElement,
              seriesIndex,
              dataPointIndex,
            )

            if (elMarkersWrap) {
              elMarkersWrap.add(markerElement)
            }
          }
        } else {
          // dynamic array creation - multidimensional
          if (typeof w.globals.pointsArray[seriesIndex] === 'undefined')
            w.globals.pointsArray[seriesIndex] = []

          w.globals.pointsArray[seriesIndex].push([p.x[q], p.y[q]])
        }
      }
    }

    return elMarkersWrap
  }

  /**
   * Batched mode: record one point. Nothing touches the DOM here; the whole
   * series becomes a single path in flushBatch.
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   * @param {number} x
   * @param {number} y
   * @param {{invalid: boolean, graphics: Graphics}} o
   */
  _batchPoint(seriesIndex, dataPointIndex, x, y, { invalid, graphics }) {
    const w = this.w

    // With no cx/cy nodes to read, the tooltip and crosshair position off this
    // cache, exactly as they do for canvas mode and for markers.size: 0.
    if (typeof w.globals.pointsArray[seriesIndex] === 'undefined') {
      w.globals.pointsArray[seriesIndex] = []
    }
    w.globals.pointsArray[seriesIndex][dataPointIndex] = [x, y]

    if (invalid) return

    if (!this._batch || this._batch.seriesIndex !== seriesIndex) {
      // Resolved once for the series rather than per point: the gates in
      // _shouldBatch guarantee every point of the series shares this config.
      this._batch = {
        seriesIndex,
        d: [],
        opts: this.getMarkerConfig({ cssClass: '', seriesIndex }),
      }
    }

    const size = this._batch.opts.pSize
    if (!(size > 0)) return

    // Off-grid points contribute no subpath. The per-point path clamps pSize to
    // 0 for these, which draws nothing anyway, so this only skips the work.
    const slack = w.globals.markers.largestSize
    if (
      x < -slack ||
      x > w.layout.gridWidth + slack ||
      y < -slack ||
      y > w.layout.gridHeight + slack
    ) {
      return
    }

    this._batch.d.push(
      graphics.getMarkerPath(x, y, this._batch.opts.shape, size),
    )
  }

  /**
   * Emit the accumulated series as ONE path element and append it to the
   * series' marker wrap. Returns the element, or null when the series had
   * nothing to batch.
   *
   * The element is deliberately NOT classed `apexcharts-marker`. That class is
   * how the tooltip finds a node to enlarge (`getAllMarkers` takes the first
   * match under each wrap, `resetPointsSize` rewrites the `d` of every match),
   * so a batched path wearing it would have its entire subpath list replaced by
   * a single hover dot on the first mouseover.
   * @param {any} elPointsMain
   * @param {number} seriesIndex
   */
  flushBatch(elPointsMain, seriesIndex) {
    const b = this._batch
    this._batch = null
    if (!b || b.seriesIndex !== seriesIndex || !b.d.length) return null

    const w = this.w
    const graphics = new Graphics(this.w)
    const opts = b.opts

    // Match drawMarker's swap for the shapes drawn as strokes rather than
    // fills, so a batched cross/plus/line looks like a per-point one.
    const strokeShape =
      opts.shape === 'line' || opts.shape === 'plus' || opts.shape === 'cross'
    const stroke = strokeShape ? opts.pointFillColor : opts.pointStrokeColor
    const strokeOpacity = strokeShape
      ? opts.pointFillOpacity
      : opts.pointStrokeOpacity

    const el = graphics.drawPath({
      d: b.d.join(' '),
      fill: opts.pointFillColor,
      fillOpacity: opts.pointFillOpacity,
      stroke,
      strokeOpacity,
      strokeWidth: opts.pointStrokeWidth,
      strokeDashArray: opts.pointStrokeDashArray,
    })

    el.attr({
      class: `apexcharts-marker-batch${
        Markers.markersAreInert(w) ? ' no-pointer-events' : ''
      }`,
      'clip-path': `url(#gridRectMarkerMask${w.globals.cuid})`,
      shape: opts.shape,
      index: seriesIndex,
      'default-marker-size': opts.pSize,
    })

    elPointsMain.add(el)
    return el
  }

  /** @param {{cssClass: any, seriesIndex: any, dataPointIndex?: any, radius?: any, size?: any, strokeWidth?: any}} opts */
  getMarkerConfig({
    cssClass,
    seriesIndex,
    dataPointIndex = null,
    radius = null,
    size = null,
    strokeWidth = null,
  }) {
    const w = this.w
    const pStyle = this.getMarkerStyle(seriesIndex)
    let pSize = size === null ? w.globals.markers.size[seriesIndex] : size

    const m = w.config.markers

    // discrete markers is an option where user can specify a particular marker with different shape, size and color

    if (dataPointIndex !== null && m.discrete.length) {
      m.discrete.map((/** @type {any} */ marker) => {
        if (
          marker.seriesIndex === seriesIndex &&
          marker.dataPointIndex === dataPointIndex
        ) {
          // Only the fields an entry actually declares override the series
          // defaults. Assigning unconditionally blanked the rest, so a
          // `{ seriesIndex, dataPointIndex, size }` entry (resize this one
          // point, keep its colours) rendered with no fill at all.
          if (marker.strokeColor !== undefined) {
            pStyle.pointStrokeColor = marker.strokeColor
          }
          if (marker.fillColor !== undefined) {
            pStyle.pointFillColor = marker.fillColor
          }
          if (marker.size !== undefined) pSize = marker.size
          if (marker.shape !== undefined) pStyle.pointShape = marker.shape
        }
      })
    }

    return {
      pSize: radius === null ? pSize : radius,
      pRadius: radius !== null ? radius : m.radius,
      pointStrokeWidth:
        strokeWidth !== null
          ? strokeWidth
          : Array.isArray(m.strokeWidth)
            ? m.strokeWidth[seriesIndex]
            : m.strokeWidth,
      pointStrokeColor: pStyle.pointStrokeColor,
      pointFillColor: pStyle.pointFillColor,
      shape:
        pStyle.pointShape ||
        (Array.isArray(m.shape) ? m.shape[seriesIndex] : m.shape),
      class: cssClass,
      pointStrokeOpacity: Array.isArray(m.strokeOpacity)
        ? m.strokeOpacity[seriesIndex]
        : m.strokeOpacity,
      pointStrokeDashArray: Array.isArray(m.strokeDashArray)
        ? m.strokeDashArray[seriesIndex]
        : m.strokeDashArray,
      pointFillOpacity: Array.isArray(m.fillOpacity)
        ? m.fillOpacity[seriesIndex]
        : m.fillOpacity,
      seriesIndex,
    }
  }

  /**
   * @param {any} parentGroup
   */
  setupMarkerDelegation(parentGroup) {
    const w = this.w
    const selector = '.apexcharts-marker'

    // Core mouse events via delegation
    this._graphics.setupEventDelegation(parentGroup, selector)

    // Marker-specific events: click, dblclick, touchstart
    /**
     * @param {Event} e
     */
    parentGroup.node.addEventListener('click', (/** @type {any} */ e) => {
      if (w.config.markers.onClick) {
        const targetNode = Graphics._findDelegateTarget(
          e.target,
          parentGroup.node,
          selector,
        )
        if (targetNode) w.config.markers.onClick(e)
      }
    })

    /**
     * @param {Event} e
     */
    parentGroup.node.addEventListener('dblclick', (/** @type {any} */ e) => {
      if (w.config.markers.onDblClick) {
        const targetNode = Graphics._findDelegateTarget(
          e.target,
          parentGroup.node,
          selector,
        )
        if (targetNode) w.config.markers.onDblClick(e)
      }
    })

    parentGroup.node.addEventListener(
      'touchstart',
      (/** @type {Event} */ e) => {
        const targetNode = Graphics._findDelegateTarget(
          e.target,
          parentGroup.node,
          selector,
        )
        if (targetNode && targetNode.instance) {
          this._graphics.pathMouseDown(targetNode.instance, e)
        }
      },
      { passive: true },
    )
  }

  /**
   * @returns {any}
   * @param {number} seriesIndex
   */
  getMarkerStyle(seriesIndex) {
    const w = this.w

    const colors = w.globals.markers.colors
    const strokeColors =
      w.config.markers.strokeColor || w.config.markers.strokeColors

    const pointStrokeColor = Array.isArray(strokeColors)
      ? strokeColors[seriesIndex]
      : strokeColors
    const pointFillColor = Array.isArray(colors) ? colors[seriesIndex] : colors

    return {
      pointStrokeColor,
      pointFillColor,
    }
  }
}
