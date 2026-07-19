// @ts-check
import Animations, { computeStagger } from '../modules/Animations'
import Fill from '../modules/Fill'
import Filters from '../modules/Filters'
import Graphics from '../modules/Graphics'
import Markers from '../modules/Markers'
import { seriesEmitter } from '../renderers/Renderer'

/**
 * ApexCharts Scatter Class.
 * This Class also handles bubbles chart as currently there is no major difference in drawing them,
 * @module Scatter
 **/
export default class Scatter {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx
    this.w = w

    this.initialAnim = this.w.config.chart.animations.enabled

    this.anim = new Animations(this.w)
    this.filters = new Filters(this.w)
    this.fill = new Fill(this.w)
    this.markers = new Markers(this.w, this.ctx)
    this.graphics = new Graphics(this.w)

    // Series-level markers group + per-series constants for the per-point hot
    // path. draw() is called once per data point, so anything that is uniform
    // across a series must be created/computed on its first point only.
    /** @type {any} */ this._elPointsWrap = null
    /** @type {any} */ this._elPointsWrapParent = null
    /** @type {any} */ this._perSeries = null
  }

  /**
   * @param {Element} elSeries
   * @param {number} j
   * @param {Record<string, any>} opts
   */
  draw(elSeries, j, opts) {
    const w = this.w

    const graphics = this.graphics
    // Strata (#2): in canvas mode points paint to a bitmap, so marker emission
    // goes through the renderer (no per-point DOM node).
    const emit = seriesEmitter(this.ctx, graphics)

    const realIndex = opts.realIndex
    const pointsPos = opts.pointsPos
    const zRatio = opts.zRatio
    const elPointsMain = opts.elParent

    // ONE markers group per SERIES, not per point. draw() runs once per data
    // point, so the group, its clip-path, its delegated listeners and its
    // insertion into the parent must happen on the first point of a series
    // only; every later point just appends its own path. This halves the node
    // count on large scatters and removes the per-point delegation setups,
    // clip-path writes and appends. Per-point interactivity is unaffected:
    // delegation reads rel/j/index off the target path, not off a wrapper.
    let elPointsWrap = this._elPointsWrap
    if (!elPointsWrap || this._elPointsWrapParent !== elPointsMain) {
      elPointsWrap = emit.group({
        class: `apexcharts-series-markers apexcharts-series-${w.config.chart.type}`,
      })
      elPointsWrap.attr(
        'clip-path',
        `url(#gridRectMarkerMask${w.globals.cuid})`,
      )
      // Set up event delegation once on the series group instead of
      // per-point listeners
      this.markers.setupMarkerDelegation(elPointsWrap)
      elPointsMain.add(elPointsWrap)

      this._elPointsWrap = elPointsWrap
      this._elPointsWrapParent = elPointsMain
      this._perSeries = this._buildPerSeriesCache(realIndex, emit)
    }

    if (Array.isArray(pointsPos.x)) {
      for (let q = 0; q < pointsPos.x.length; q++) {
        let dataPointIndex = j + 1
        let shouldDraw = true

        // a small hack as we have 2 points for the first val to connect it
        if (j === 0 && q === 0) dataPointIndex = 0
        if (j === 0 && q === 1) dataPointIndex = 1

        let radius = w.globals.markers.size[realIndex]

        if (zRatio !== Infinity) {
          // means we have a bubble
          const bubble = w.config.plotOptions.bubble
          radius = w.seriesData.seriesZ[realIndex][dataPointIndex]

          if (bubble.zScaling) {
            radius /= zRatio
          }

          if (bubble.minBubbleRadius && radius < bubble.minBubbleRadius) {
            radius = bubble.minBubbleRadius
          }

          if (bubble.maxBubbleRadius && radius > bubble.maxBubbleRadius) {
            radius = bubble.maxBubbleRadius
          }
        }

        const x = pointsPos.x[q]
        const y = pointsPos.y[q]

        radius = radius || 0

        if (
          y === null ||
          typeof w.seriesData.series[realIndex][dataPointIndex] === 'undefined'
        ) {
          shouldDraw = false
        }

        if (shouldDraw) {
          const point = this.drawPoint(
            x,
            y,
            radius,
            realIndex,
            dataPointIndex,
            j,
          )
          elPointsWrap.add(point)

          // Strata (#2): canvas paints points to a bitmap with no per-point
          // node, so the tooltip/crosshair position path can't read cx/cy off
          // the markers. Cache the pixel coords in pointsArray (the same lookup
          // the markers-off SVG path uses) so nearest/shared tooltips position.
          if (emit.kind === 'canvas') {
            if (typeof w.globals.pointsArray[realIndex] === 'undefined') {
              w.globals.pointsArray[realIndex] = []
            }
            w.globals.pointsArray[realIndex][dataPointIndex] = [x, y]
          }
        }
      }
    }
  }

  /**
   * Per-series constants for drawPoint's hot path. Everything here is uniform
   * across the points of one series; computing or allocating it per point is
   * measurable overhead at 20k-50k points.
   * @param {number} realIndex
   * @param {any} emit
   */
  _buildPerSeriesCache(realIndex, emit) {
    const w = this.w
    return {
      realIndex,
      emit,
      isBubble:
        w.config.chart.type === 'bubble' ||
        (w.globals.comboCharts &&
          w.config.series[realIndex] &&
          /** @type {Record<string,any>} */ (w.config.series[realIndex])
            .type === 'bubble'),
      // discrete markers vary per point; they disable both caches below
      canCacheConfig: !w.config.markers.discrete.length,
      /** @type {any} lazily built shared marker config (first point) */
      markerConfig: null,
      /** @type {boolean|undefined} lazily resolved on the first fillPath call */
      fillCacheable: undefined,
      /** @type {any} cached fillPath result (undefined = not cached yet) */
      fillCircle: undefined,
      dropShadowEnabled: w.config.chart.dropShadow.enabled,
      doInitialAnim:
        this.initialAnim && !w.globals.dataChanged && !w.globals.resized,
      jitter: w.config.plotOptions.scatter?.jitter,
      /** @type {any} lazily built pop-animation constants */
      anim: null,
    }
  }

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} radius
   * @param {number} realIndex
   * @param {number} dataPointIndex
   * @param {number} j
   */
  drawPoint(x, y, radius, realIndex, dataPointIndex, j) {
    const w = this.w

    const i = realIndex
    const anim = this.anim
    const filters = this.filters
    const fill = this.fill
    const markers = this.markers

    let ps = this._perSeries
    if (!ps || ps.realIndex !== realIndex) {
      // drawPoint called outside draw()'s series loop: build a fresh cache
      ps = this._perSeries = this._buildPerSeriesCache(
        realIndex,
        seriesEmitter(this.ctx, this.graphics),
      )
    }
    // Strata (#2): scatter/bubble points emit through the active renderer.
    const emit = ps.emit

    let markerConfig
    if (ps.canCacheConfig) {
      // Marker config is uniform across the series (no discrete overrides);
      // build it once and only refresh the per-point bubble radius.
      if (!ps.markerConfig) {
        ps.markerConfig = markers.getMarkerConfig({
          cssClass: 'apexcharts-marker',
          seriesIndex: i,
          dataPointIndex,
          radius: ps.isBubble ? radius : null,
        })
      }
      markerConfig = ps.markerConfig
      if (ps.isBubble) {
        markerConfig.pSize = radius
        markerConfig.pRadius = radius
      }
    } else {
      markerConfig = markers.getMarkerConfig({
        cssClass: 'apexcharts-marker',
        seriesIndex: i,
        dataPointIndex,
        radius: ps.isBubble ? radius : null,
      })
    }

    const _si = /** @type {Record<string,any>} */ (w.config.series[i])
    const dataItem = _si.data[dataPointIndex]

    let pathFillCircle
    if (ps.fillCircle !== undefined) {
      pathFillCircle = ps.fillCircle
    } else {
      pathFillCircle = fill.fillPath({
        seriesNumber: realIndex,
        dataPointIndex,
        color: markerConfig.pointFillColor,
        patternUnits: 'objectBoundingBox',
        value: w.seriesData.series[realIndex][j],
      })
      if (ps.fillCacheable === undefined) {
        // Solid fills with a concrete marker color resolve to the same paint
        // for every point of the series; gradients/patterns/function colors
        // (and discrete-marker series) stay per point.
        ps.fillCacheable =
          ps.canCacheConfig &&
          fill.getFillType(realIndex) === 'solid' &&
          typeof markerConfig.pointFillColor === 'string' &&
          !!markerConfig.pointFillColor
      }
      if (ps.fillCacheable && !dataItem?.fillColor) {
        ps.fillCircle = pathFillCircle
      }
    }

    const el = emit.drawMarker(x, y, markerConfig)

    if (dataItem?.fillColor) {
      pathFillCircle = dataItem.fillColor
    }

    // Distributed jitter: colour each band by its position (x value) instead of
    // by series — lets a single-series strip plot show one colour per band.
    const jt = ps.jitter
    if (jt?.enabled && jt.distributed && w.globals.colors.length) {
      const bandIdx = Math.round(
        w.seriesData.seriesX[realIndex]?.[dataPointIndex],
      )
      if (!isNaN(bandIdx)) {
        pathFillCircle = w.globals.colors[bandIdx % w.globals.colors.length]
      }
    }

    el.attr({
      fill: pathFillCircle,
    })

    if (ps.dropShadowEnabled) {
      const dropShadow = w.config.chart.dropShadow
      filters.dropShadow(el, dropShadow, realIndex)
    }

    if (ps.doInitialAnim) {
      if (!ps.anim) {
        const animCfg = w.config.chart.animations
        // Pop effect: scale + opacity per marker. Per-point left-to-right
        // stagger is driven by `animateGradually`.
        const totalPoints = w.globals.dataPoints || 1
        const gradCfg = animCfg.animateGradually
        const gradEnabled = gradCfg && gradCfg.enabled !== false
        ps.anim = {
          popSpeed: animCfg.speed,
          baseDelay: gradEnabled
            ? Math.min(20, (animCfg.speed * 0.5) / Math.max(1, totalPoints))
            : 0,
        }
      }
      const delay = computeStagger({
        style: ps.anim.baseDelay > 0 ? 'sequential' : 'none',
        index: dataPointIndex,
        baseDelay: ps.anim.baseDelay,
      })
      anim.animatePop(el, {
        speed: ps.anim.popSpeed,
        delay,
        onComplete: () => anim.animationCompleted(el),
      })
    } else {
      w.globals.animationEnded = true
    }

    el.attr({
      rel: dataPointIndex,
      j: dataPointIndex,
      index: realIndex,
      'default-marker-size': markerConfig.pSize,
    })

    filters.setSelectionFilter(el, realIndex, dataPointIndex)

    // NOTE: markerConfig.class already carries 'apexcharts-marker' (set as the
    // class attribute by drawMarkerShape), so no classList.add is needed here.

    return el
  }

  /**
   * @param {number} y
   */
  centerTextInBubble(y) {
    const w = this.w
    y = y + parseInt(w.config.dataLabels.style.fontSize, 10) / 4

    return {
      y,
    }
  }
}
