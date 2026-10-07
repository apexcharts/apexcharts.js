// @ts-check
import Labels from './Labels'
import Position from './Position'
import Marker, { renderMarkerSVG } from './Marker'
import Intersect from './Intersect'
import AxesTooltip from './AxesTooltip'
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import Graphics from '../Graphics'
import Series from '../Series'
import XAxis from './../axes/XAxis'
import Utils from './Utils'
import { isCustom } from '../ChartFactory'
import { POINTER_CLEARANCE_BELOW } from './constants'

const INTERACTIVE_TOOLTIP_HIDE_DELAY = 150

/**
 * On a short plot an interactive box can sit tens of px from the point, past
 * the plot's edge. The close waits for that trip at this speed (px per ms, a
 * slow deliberate move), up to the cap below, on top of the base delay above.
 */
const SLOW_POINTER_SPEED = 0.2
const INTERACTIVE_TRAVEL_ALLOWANCE_MAX = 600

/**
 * Sideways slack, in px, for a pointer leaving the plot toward an interactive
 * box outside it: a diagonal path to one of the box's corners still counts.
 */
const INTERACTIVE_REACH_SLACK = 24

/**
 * ApexCharts Core Tooltip Class to handle the tooltip generation.
 *
 * @module Tooltip
 **/

export default class Tooltip {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx // needed: getGroupedCharts, getSyncedCharts, fireEvent, XAxis instantiation

    this.tooltipUtil = new Utils(this)
    this.tooltipLabels = new Labels(this)
    this.tooltipPosition = new Position(this)
    this.marker = new Marker(this)
    this.intersect = new Intersect(this)
    this.axesTooltip = new AxesTooltip(this)
    this.showOnIntersect = this.tConfig.intersect
    this.showTooltipTitle = this.tConfig.x.show
    this.fixedTooltip = this.tConfig.fixed.enabled
    /**
     * Set by handleMouseOut, read by axisChartsTooltips: did something in this
     * pass decide there is nothing to show? See the comment at its use.
     * @type {boolean}
     */
    this.tooltipHidden = false
    /** @type {HTMLElement | null} */
    this.xaxisTooltip = null
    /** @type {HTMLElement | null} */
    this.xaxisTooltipText = null
    /** @type {HTMLElement | null} */
    this.yaxisTooltip = null
    /** @type {HTMLElement[] | null} */
    this.yaxisTooltipText = null
    /** @type {HTMLElement[] | null} */
    this.yaxisTTEls = null
    /** @type {number} */
    this.xaxisOffY = 0
    /** @type {number} */
    this.yaxisOffX = 0
    /** @type {number} */
    this.xcrosshairsWidth = 0
    /** @type {Element | null} */
    this.ycrosshairs = null
    /** @type {Element | null} */
    this.ycrosshairsHidden = null
    /** @type {Element | null} */
    this.tooltip = null
    /** @type {any} */
    this.e = null
    this.isBarShared = !w.globals.isBarHorizontal && this.tConfig.shared
    this.lastHoverTime = Date.now()
    this.dimensionUpdateScheduled = false

    // Properties set in drawTooltip() / create() / event handlers
    /** @type {import('../../types/internal').XYRatios | null} */
    this.xyRatios = null
    /** @type {boolean} */
    this.isXAxisTooltipEnabled = false
    /** @type {boolean[]} */
    this.yaxisTooltips = []
    /** @type {any} */
    this.allTooltipSeriesGroups = []
    /** @type {any} */
    this.xAxisTicksPositions = null
    /** @type {number} */
    this.dataPointsDividedHeight = 0
    /** @type {number} */
    this.dataPointsDividedWidth = 0
    /** @type {HTMLElement | null} */
    this.tooltipTitle = null
    // Resolved lazily and revalidated with baseEl.contains(); see _resolveEl.
    /** @type {any} */
    this._elTooltipCache = null
    /** @type {any} */
    this._elXCrosshairsCache = null
    /** @type {any} */
    this._elGridCache = null
    /** @type {NodeListOf<Element> | null} */
    this.legendLabels = null
    /** @type {any} */
    this.ttItems = null
    /**
     * The hover listeners addSVGEvents put on the svg itself (`hoverArea`),
     * kept so the next call can take them off: see detachHoverAreaListeners.
     * @type {Array<{ el: Element, ev: string, handler: (e: any) => void }>}
     */
    this.hoverAreaListeners = []
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this.seriesHoverTimeout = undefined
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    this.interactiveHideTimeout = undefined
    /**
     * The close of an interactive box that the pointer left by roaming the
     * plot off every mark (a canvas violin chart: Intersect.handleBarTooltip).
     * Unlike `interactiveHideTimeout`, which every move clears, the moves
     * after the first leave it running.
     * @type {ReturnType<typeof setTimeout> | undefined}
     */
    this.offMarkHideTimeout = undefined
    /** @type {number} */
    this.clientX = 0
    /** @type {number} */
    this.clientY = 0
    /** @type {number} */
    this.barSeriesHeight = 0
    /** @type {{ x: number, y: number, ttWidth: number, ttHeight: number }} */
    this.tooltipRect = { x: 0, y: 0, ttWidth: 0, ttHeight: 0 }
  }

  /**
   * The live tooltip config.
   *
   * Deliberately not captured at construction. This module is built once per
   * chart and outlives every update, while `updateOptions` REPLACES
   * `w.config.tooltip` with a merged object, so a held reference freezes the
   * tooltip on the options the chart was born with. That is how a runtime
   * theme toggle left a dark chart carrying a white tooltip (the axes read
   * the live config, the tooltip did not), and how a later `shared`,
   * `intersect` or `x.show` was accepted and silently dropped.
   *
   * The sub-modules read it back through `ttCtx.tConfig`, so they follow.
   */
  get tConfig() {
    return this.w.config.tooltip
  }

  setupDimensionCache() {
    const w = this.w
    const tooltipEl = this.getElTooltip()

    if (!tooltipEl) return

    // No initial measurement on purpose. Reading the rect here forced a
    // synchronous layout of the chart that was just (re)built, on every render
    // AND every update, to measure a tooltip that is still empty and hidden --
    // a size superseded the moment any content is written into it. It is not
    // needed either: `getCachedDimensions()` measures live when the cache is
    // missing or older than a second, and every consumer of it runs at
    // interaction time, by which point the ResizeObserver below has normally
    // filled the cache anyway.

    // Setup ResizeObserver for automatic dimension updates
    if (typeof ResizeObserver !== 'undefined' && !w.globals.resizeObserver) {
      w.globals.resizeObserver = new ResizeObserver(() => {
        if (!this.dimensionUpdateScheduled) {
          this.dimensionUpdateScheduled = true
          requestAnimationFrame(() => {
            this.updateDimensionCache()
            this.dimensionUpdateScheduled = false
          })
        }
      })
      w.globals.resizeObserver.observe(tooltipEl)
    }
  }

  updateDimensionCache() {
    const w = this.w
    const tooltipEl = this.getElTooltip()

    if (!tooltipEl) return

    const rect = tooltipEl.getBoundingClientRect()
    w.globals.dimensionCache.tooltip = /** @type {any} */ ({
      width: rect.width,
      height: rect.height,
      lastUpdate: Date.now(),
    })
  }

  getCachedDimensions() {
    const w = this.w

    // Return cached dimensions if available and fresh (< 1 second old)
    if (w.globals.dimensionCache.tooltip) {
      const cache = /** @type {Record<string,any>} */ (
        w.globals.dimensionCache.tooltip
      )
      const age = Date.now() - cache.lastUpdate

      if (age < 1000) {
        return {
          ttWidth: cache.width,
          ttHeight: cache.height,
        }
      }
    }

    // Fallback to live measurement and update cache
    this.updateDimensionCache()
    const cache = /** @type {Record<string,any>} */ (
      w.globals.dimensionCache.tooltip
    )
    return cache
      ? {
          ttWidth: cache.width,
          ttHeight: cache.height,
        }
      : { ttWidth: 0, ttHeight: 0 }
  }

  /**
   * @param {{ w: import('../../types/internal').ChartStateW }} [ctx]
   * @returns {HTMLElement | null}
   */
  /**
   * Resolve a chart-level element, keeping the node between calls.
   *
   * Hover paths ask for these several times per frame and every lookup is a
   * `querySelector` across the entire chart DOM, which a CPU profile of a
   * 700-series chart showed dominating hover time. Validity is checked with
   * `baseEl.contains()` — a short walk up the ancestors, not a tree scan.
   *
   * That check is what respects `fastUpdate`: `drawTooltip` DETACHES the
   * existing tooltip before building a replacement (see its comment on the
   * fastUpdate path), so a rebuilt element leaves the cached node outside
   * `baseEl`, the check fails, and the selector runs again. A full re-render
   * replaces `baseEl`'s subtree with the same consequence.
   *
   * @param {any} ctx      owner of the cache slot (a Tooltip, or another chart)
   * @param {string} key   cache property on that owner
   * @param {string} selector
   * @returns {any}
   */
  _resolveEl(ctx, key, selector) {
    const baseEl = ctx.w?.dom?.baseEl
    if (!baseEl) return null

    const cached = ctx[key]
    if (cached && baseEl.contains(cached)) return cached

    const el = baseEl.querySelector(selector)
    ctx[key] = el
    return el
  }

  /**
   * @param {any} [ctx] another chart's context, for grouped tooltips
   * @returns {HTMLElement | null}
   */
  getElTooltip(ctx) {
    if (!ctx) ctx = this

    // :not() is required: the point-annotation hover tooltip shares the
    // .apexcharts-tooltip class for styling and, once created, can precede
    // the series tooltip in DOM order (drawTooltip re-appends the series
    // tooltip on fastUpdate). Without the guard this would return the
    // annotation tooltip and hijack the series-tooltip machinery.
    return /** @type {HTMLElement | null} */ (
      this._resolveEl(
        ctx,
        '_elTooltipCache',
        '.apexcharts-tooltip:not(.apexcharts-annotation-tooltip)',
      )
    )
  }

  getElXCrosshairs() {
    return this._resolveEl(
      this,
      '_elXCrosshairsCache',
      '.apexcharts-xcrosshairs',
    )
  }

  getElGrid() {
    return this._resolveEl(this, '_elGridCache', '.apexcharts-grid')
  }

  /**
   * @param {import('../../types/internal').XYRatios} xyRatios
   */
  drawTooltip(xyRatios) {
    const w = this.w
    this.xyRatios = xyRatios
    // Re-derive what the constructor seeded. These are read off the config
    // once and then carried, and every update hands us a new config, so a
    // render is the moment to take them again. `showOnIntersect` in
    // particular is forced true further down for some chart shapes, which
    // only makes sense starting from what the user currently asks for.
    this.showOnIntersect = this.tConfig.intersect
    this.showTooltipTitle = this.tConfig.x.show
    this.fixedTooltip = this.tConfig.fixed.enabled
    this.isXAxisTooltipEnabled =
      w.config.xaxis.tooltip.enabled && w.globals.axisCharts
    /**
     * @param {number} y
     */
    this.yaxisTooltips = w.config.yaxis.map((y) => {
      return y.show && y.tooltip.enabled && w.globals.axisCharts ? true : false
    })
    /** @type {any} */
    this.allTooltipSeriesGroups = []

    if (!w.globals.axisCharts) {
      this.showTooltipTitle = false
    }

    // Remove any existing tooltip element to avoid duplicates on re-draws
    // (e.g. fastUpdate path calls drawTooltip without full DOM teardown)
    const existingTooltip = this.getElTooltip()
    if (existingTooltip?.parentNode) {
      existingTooltip.parentNode.removeChild(existingTooltip)
    }
    this.tooltipTitle = null

    const tooltipEl = BrowserAPIs.createElementNS(
      'http://www.w3.org/1999/xhtml',
      'div',
    )
    tooltipEl.classList.add('apexcharts-tooltip')
    if (this.tConfig.interactive) {
      tooltipEl.classList.add('apexcharts-tooltip-interactive')
      tooltipEl.addEventListener(
        'mouseenter',
        () => {
          clearTimeout(this.interactiveHideTimeout)
          this.cancelOffMarkHide()
        },
        { passive: true },
      )
      tooltipEl.addEventListener(
        'mouseleave',
        () => {
          clearTimeout(this.interactiveHideTimeout)
          this.handleMouseOut({ tooltipEl })
          if (w.config.chart.group) {
            this.ctx.getGroupedCharts().forEach((ch) => {
              const el = this.getElTooltip(ch)
              if (el) ch.w.globals.tooltip.handleMouseOut({ tooltipEl: el })
            })
          }
        },
        { passive: true },
      )
    }
    if (w.config.tooltip.cssClass) {
      tooltipEl.classList.add(w.config.tooltip.cssClass)
    }
    tooltipEl.classList.add(`apexcharts-theme-${this.tConfig.theme || 'light'}`)

    // `fillSeriesColor` paints each series-group with its series colour.
    // Tag the tooltip so the CSS can drop the glass body (transparent bg,
    // no border, no backdrop-filter) and clip the coloured series-group(s)
    // to the body's rounded corners — otherwise the colour block sits
    // inside a glass shell with visible padding/border around it.
    if (this.tConfig.fillSeriesColor) {
      tooltipEl.classList.add('apexcharts-tooltip-fill-series')
    }

    // `compact`: one tight line instead of a card. The x label loses its own
    // title bar and sits inline before the value, the marker goes, and the
    // padding and font shrink. Meant for panels a normal card would cover
    // (small multiples, sparklines, dashboard tiles). With a SINGLE series the
    // series-name label goes too, because in a one-series panel it repeats
    // what the panel header already says; with several series the names are
    // the only thing distinguishing the rows, so they stay.
    if (this.tConfig.compact) {
      tooltipEl.classList.add('apexcharts-tooltip-compact')
      if (w.config.series.length === 1) {
        tooltipEl.classList.add('apexcharts-tooltip-value-only')
      }
    }

    // Optional user-supplied solid background — set on the CSS variable so
    // the rest of the glass theme (border, shadow) still applies cleanly.
    // An opaque value also visually disables the backdrop blur.
    if (this.tConfig.style && this.tConfig.style.background) {
      tooltipEl.style.setProperty(
        '--apx-tt-bg',
        this.tConfig.style.background,
      )
    }

    // Arrow connector (default on via `tooltip.arrow`). Positioned by
    // Position.applyTooltipPosition() via the `--apx-tt-arrow-y` CSS var.
    // Skip the arrow in these cases:
    //  - `followCursor`: the cursor IS the anchor; arrow would be redundant.
    //  - `fixed.enabled`: tooltip is pinned to a chart corner, not a point,
    //    so an arrow would point nowhere.
    //  - shared tooltip on a multi-series chart: there's no single point to
    //    anchor to, so an arrow would mislead. Exceptions: horizontal-bar
    //    charts (a single row of bars per category — tooltip goes above/below
    //    the row union) and heatmaps (the hover resolves a single cell —
    //    tooltip goes above/below that cell). Both keep a meaningful arrow
    //    target, so they're allowed an arrow despite `shared` being on.
    //  - non-axis charts (pie/donut/radialBar/polarArea): slices radiate
    //    from a centre, so there's no single "anchor edge" for the arrow.
    //  - `fillSeriesColor`: the glass arrow would not match the solid
    //    series-colour body. Better to drop it than render a colour clash.
    const isSharedMulti =
      this.tConfig.shared &&
      w.config.series.length > 1 &&
      !w.globals.isBarHorizontal &&
      w.config.chart.type !== 'heatmap'
    const shouldDrawArrow =
      this.tConfig.arrow &&
      !Utils.isFollowCursor(this.w) &&
      !this.tConfig.fixed.enabled &&
      !isSharedMulti &&
      !this.tConfig.fillSeriesColor &&
      w.globals.axisCharts
    if (shouldDrawArrow) {
      const arrowEl = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )
      arrowEl.classList.add('apexcharts-tooltip-arrow')
      tooltipEl.appendChild(arrowEl)
    }

    // accessibility attributes
    if (
      w.config.chart.accessibility.enabled &&
      w.config.chart.accessibility.announcements.enabled
    ) {
      tooltipEl.setAttribute('role', 'tooltip')
      tooltipEl.setAttribute('aria-live', 'polite')
      tooltipEl.setAttribute('aria-atomic', 'true')
      tooltipEl.setAttribute('aria-hidden', 'true')
    }

    w.dom.elWrap.appendChild(tooltipEl)


    if (w.globals.axisCharts) {
      this.axesTooltip.drawXaxisTooltip()
      this.axesTooltip.drawYaxisTooltip()
      this.axesTooltip.setXCrosshairWidth()
      this.axesTooltip.handleYCrosshair()

      const xAxis = new XAxis(this.w, this.ctx, undefined)
      this.xAxisTicksPositions = xAxis.getXAxisTicksPositions()
    }

    // we forcefully set intersect true for these conditions
    if (
      (w.globals.comboCharts ||
        this.tConfig.intersect ||
        w.config.chart.type === 'rangeBar') &&
      !this.tConfig.shared
    ) {
      this.showOnIntersect = true
    }

    if (
      w.config.markers.size === 0 ||
      w.globals.markers.largestSize === 0 ||
      // batched markers have no per-point node to enlarge, so the hover dot is
      // served by the same single marker a markers.size: 0 chart uses
      w.globals.markers.batched
    ) {
      // when user don't want to show points all the time, but only on when hovering on series
      this.marker.drawDynamicPoints()
    }

    // no visible series, exit
    if (w.globals.collapsedSeries.length === w.seriesData.series.length) return

    this.dataPointsDividedHeight = w.layout.gridHeight / w.globals.dataPoints
    this.dataPointsDividedWidth = w.layout.gridWidth / w.globals.dataPoints

    if (this.showTooltipTitle) {
      this.tooltipTitle = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )
      this.tooltipTitle.classList.add('apexcharts-tooltip-title')
      this.tooltipTitle.style.fontFamily =
        this.tConfig.style.fontFamily || w.config.chart.fontFamily
      this.tooltipTitle.style.fontSize = this.tConfig.style.fontSize
      tooltipEl.appendChild(this.tooltipTitle)
    }

    // A row per series is only ever DISPLAYED by a shared tooltip: every
    // non-shared path activates exactly one group (see
    // Labels.toggleActiveInactiveSeries) and writes the hovered series' values
    // into it. Allocating per-series rows for those built ~9.8k DOM nodes on a
    // 700-series chart for a tooltip that shows one line, and left
    // printLabels() rewriting all of them on every hover.
    //
    // Non-cartesian types still index their row by series index, so they keep
    // the old allocation; Labels reads the count back rather than re-deriving
    // the condition.
    let ttItemsCnt = w.seriesData.series.length
    if (w.globals.xyCharts || w.globals.comboCharts) {
      ttItemsCnt =
        this.tConfig.shared && !this.showOnIntersect
          ? w.seriesData.series.length
          : 1
    }

    this.legendLabels = w.dom.baseEl.querySelectorAll('.apexcharts-legend-text')

    this.ttItems = this.createTTElements(ttItemsCnt)
    this.addSVGEvents()

    this.setupDimensionCache()
  }

  /**
   * @param {number} ttItemsCnt
   */
  createTTElements(ttItemsCnt) {
    const w = this.w
    /** @type {any[]} */
    const ttItems = []

    const tooltipEl = this.getElTooltip()
    if (!tooltipEl) return ttItems
    for (let i = 0; i < ttItemsCnt; i++) {
      const gTxt = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )

      gTxt.classList.add(
        'apexcharts-tooltip-series-group',
        `apexcharts-tooltip-series-group-${i}`,
      )
      gTxt.style.order = String(
        w.config.tooltip.inverseOrder ? ttItemsCnt - i : i + 1,
      )

      const point = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'span',
      )
      point.classList.add('apexcharts-tooltip-marker')

      if (w.config.tooltip.fillSeriesColor) {
        point.style.backgroundColor = w.globals.colors[i]
      } else {
        point.style.color = w.globals.colors[i]
      }

      const mShape = w.config.markers.shape
      let shape = mShape
      if (Array.isArray(mShape)) {
        shape = mShape[i]
      }

      point.setAttribute('shape', shape)
      // Inline SVG renders crisper than the previous unicode-glyph
      // `::before` pseudo-elements (which rendered at different sizes on
      // Windows vs macOS).
      point.innerHTML = renderMarkerSVG(shape)
      gTxt.appendChild(point)

      const gYZ = BrowserAPIs.createElementNS(
        'http://www.w3.org/1999/xhtml',
        'div',
      )
      gYZ.classList.add('apexcharts-tooltip-text')

      gYZ.style.fontFamily =
        this.tConfig.style.fontFamily || w.config.chart.fontFamily
      gYZ.style.fontSize = this.tConfig.style.fontSize

      // Keep the nodes a hover has to write into. Labels.DOMHandling used to
      // re-`querySelector` all of them on every mousemove, which on a shared
      // tooltip is 4-6 scoped lookups per series per frame: a CPU profile of a
      // 700-series chart spent 38% of hover time inside querySelector alone.
      /** @type {Record<string, any>} */
      const refs = { marker: point, text: gYZ }
      ;['y', 'goals', 'z'].forEach((g) => {
        const gValText = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'div',
        )
        gValText.classList.add(`apexcharts-tooltip-${g}-group`)

        const txtLabel = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'span',
        )
        txtLabel.classList.add(`apexcharts-tooltip-text-${g}-label`)
        gValText.appendChild(txtLabel)

        const txtValue = BrowserAPIs.createElementNS(
          'http://www.w3.org/1999/xhtml',
          'span',
        )
        txtValue.classList.add(`apexcharts-tooltip-text-${g}-value`)
        gValText.appendChild(txtValue)

        refs[`${g}Label`] = txtLabel
        refs[`${g}Value`] = txtValue

        gYZ.appendChild(gValText)
      })

      gTxt.appendChild(gYZ)
      ;/** @type {any} */ (gTxt).ttRefs = refs

      tooltipEl.appendChild(gTxt)

      ttItems.push(gTxt)
    }

    return ttItems
  }

  addSVGEvents() {
    const w = this.w
    const type = w.config.chart.type
    this.detachHoverAreaListeners()
    const tooltipEl = this.getElTooltip()
    if (!tooltipEl) return

    const commonBar = !!(
      type === 'bar' ||
      type === 'candlestick' ||
      type === 'boxPlot' ||
      type === 'violin' ||
      type === 'rangeBar'
    )

    const chartWithmarkers =
      type === 'area' ||
      type === 'line' ||
      type === 'scatter' ||
      type === 'bubble' ||
      type === 'radar'

    // Radar is the only chart that is hit-tested through its markers while not
    // being an xyChart (`Core` puts it in axisCharts but not xyChartsArrTypes),
    // so it matches neither the shared `hoverArea` branch below, which is
    // xyCharts/comboCharts only, nor the `!axisCharts` branch. That left a hole:
    // whenever `showOnIntersect` was false, radar was wired to nothing at all
    // and no tooltip could ever appear.
    //
    // `tooltip.shared: true` lands exactly in that hole, because Config rejects
    // shared together with intersect, so asking for a shared tooltip forces
    // intersect off and takes the hover listeners away with it. Radar therefore
    // needs the per-marker listeners in both modes. See #1575.
    const isPolarMarkerChart = chartWithmarkers && !w.globals.xyCharts

    const hoverArea = w.dom.Paper.node

    const elGrid = this.getElGrid()

    // No plot rect is measured here on purpose. Every consumer takes its own
    // `Utils.plotRect(w)` at the point of use, because the value is
    // viewport-relative and goes stale on scroll, so a rect cached at render
    // time could not be trusted anyway. Measuring it here only forced a
    // synchronous layout of the chart that was just rebuilt: a profile of 30
    // updateSeries calls put 20% of all update time in this one dead read.

    /** @type {any[]} */
    const tooltipY = []
    /** @type {any[]} */
    const tooltipX = []

    const seriesHoverParams = {
      hoverArea,
      elGrid,
      tooltipEl,
      tooltipY,
      tooltipX,
      ttItems: this.ttItems,
    }

    let points

    if (w.globals.axisCharts) {
      if (chartWithmarkers) {
        points = w.dom.baseEl.querySelectorAll(
          ".apexcharts-series[data\\:longestSeries='true'] .apexcharts-marker",
        )
      } else if (commonBar) {
        points = w.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-bar-area, .apexcharts-series .apexcharts-candlestick-area, .apexcharts-series .apexcharts-boxPlot-area, .apexcharts-series .apexcharts-violin-area, .apexcharts-series .apexcharts-rangebar-area',
        )
      } else if (type === 'heatmap' || type === 'treemap') {
        points = w.dom.baseEl.querySelectorAll(
          '.apexcharts-series .apexcharts-heatmap, .apexcharts-series .apexcharts-treemap',
        )
      }

      if (points && points.length) {
        for (let p = 0; p < points.length; p++) {
          tooltipY.push(points[p].getAttribute('cy'))
          tooltipX.push(points[p].getAttribute('cx'))
        }
      }
    }

    const validSharedChartTypes =
      (w.globals.xyCharts && !this.showOnIntersect) ||
      (w.globals.comboCharts && !this.showOnIntersect) ||
      (commonBar && this.tooltipUtil.hasBars() && this.tConfig.shared)

    if (validSharedChartTypes) {
      this.addPathsEventListeners([hoverArea], seriesHoverParams)
    } else if (Utils.isCanvasBarChart(w)) {
      // Canvas bar-likes, one at a time: bars, candles, boxes and violins are
      // painted, so there is no path to hover. Hover the whole plot and
      // resolve the mark by coordinate (Intersect.getPaintedMark ->
      // renderer.hitTest), as a canvas heatmap does its cells. A bar-like
      // series in a combo of another type needs it as much as a bar chart.
      this.addPathsEventListeners([hoverArea], seriesHoverParams)
    } else if (
      (commonBar && !w.globals.comboCharts) ||
      (chartWithmarkers && this.showOnIntersect) ||
      isPolarMarkerChart
    ) {
      this.addDatapointEventsListeners(seriesHoverParams)
    } else if (
      type === 'heatmap' &&
      w.globals.activeRenderer &&
      w.globals.activeRenderer.kind === 'canvas'
    ) {
      // Canvas heatmap: cells are painted (no per-cell <rect> to hover) and the
      // series groups are empty, so hover the whole plot and resolve the cell by
      // coordinate (Intersect.handleHeatTreeTooltip -> renderer.hitTest).
      this.addPathsEventListeners([hoverArea], seriesHoverParams)
    } else if (
      !w.globals.axisCharts ||
      type === 'heatmap' ||
      type === 'treemap'
    ) {
      const seriesAll = w.dom.baseEl.querySelectorAll('.apexcharts-series')
      this.addPathsEventListeners(seriesAll, seriesHoverParams)
    }

    if (this.showOnIntersect) {
      const lineAreaPoints = w.dom.baseEl.querySelectorAll(
        '.apexcharts-line-series .apexcharts-marker, .apexcharts-area-series .apexcharts-marker',
      )
      if (lineAreaPoints.length > 0) {
        // if we find any lineSeries, addEventListeners for them
        this.addPathsEventListeners(lineAreaPoints, seriesHoverParams)
      }

      // combo charts may have bars, so add event listeners here too
      if (this.tooltipUtil.hasBars() && !this.tConfig.shared) {
        this.addDatapointEventsListeners(seriesHoverParams)
      }
    }
  }

  /**
   * Has the pointer left the plot toward an interactive box that a short plot
   * put above or below its mark (so past the plot's edge on that side):
   * leaving upward to a box on top, or downward to one below, within reach of
   * the box sideways?
   *
   * @param {HTMLElement | null | undefined} tooltipEl
   * @param {number} clientX
   * @param {boolean} exitedAbove
   * @returns {boolean}
   */
  isHeadingForOutsideBox(tooltipEl, clientX, exitedAbove) {
    if (!tooltipEl || !this.tooltipPosition?.shortPlotPlacement) return false
    if (!tooltipEl.classList.contains('apexcharts-active')) return false
    const side = tooltipEl.dataset.placement
    if (side !== (exitedAbove ? 'top' : 'bottom')) return false
    const r = tooltipEl.getBoundingClientRect()
    return (
      clientX >= r.left - INTERACTIVE_REACH_SLACK &&
      clientX <= r.right + INTERACTIVE_REACH_SLACK
    )
  }

  /**
   * How long an interactive tooltip waits to close once the pointer has left
   * what it captions. Beside a point the box is a few px away and the base
   * delay covers it; on a short plot a box above or below the mark can be a
   * whole margin away, so the wait grows with the distance still to travel.
   *
   * @param {number | undefined} clientX
   * @param {number | undefined} clientY
   * @returns {number}
   */
  interactiveHideDelay(clientX, clientY) {
    const tooltipEl = this.tooltipPosition?.shortPlotPlacement
      ? this.getElTooltip()
      : null
    if (!tooltipEl || clientX == null || clientY == null) {
      return INTERACTIVE_TOOLTIP_HIDE_DELAY
    }
    const r = tooltipEl.getBoundingClientRect()
    const dx = Math.max(r.left - clientX, 0, clientX - r.right)
    const dy = Math.max(r.top - clientY, 0, clientY - r.bottom)
    const travel = Math.hypot(dx, dy) / SLOW_POINTER_SPEED
    return (
      INTERACTIVE_TOOLTIP_HIDE_DELAY +
      Math.min(travel, INTERACTIVE_TRAVEL_ALLOWANCE_MAX)
    )
  }

  /** Call off a close `offMarkHideTimeout` has pending. */
  cancelOffMarkHide() {
    if (this.offMarkHideTimeout === undefined) return
    clearTimeout(this.offMarkHideTimeout)
    this.offMarkHideTimeout = undefined
  }

  drawFixedTooltipRect() {
    const w = this.w

    const tooltipEl = this.getElTooltip()
    if (!tooltipEl) return { x: 0, y: 0, ttWidth: 0, ttHeight: 0 }

    const tooltipRect = tooltipEl.getBoundingClientRect()

    const ttWidth = tooltipRect.width + 10
    const ttHeight = tooltipRect.height + 10
    let x = this.tConfig.fixed.offsetX
    let y = this.tConfig.fixed.offsetY

    const fixed = this.tConfig.fixed.position.toLowerCase()

    if (fixed.indexOf('right') > -1) {
      x = x + w.globals.svgWidth - ttWidth + 10
    }
    if (fixed.indexOf('bottom') > -1) {
      y = y + w.globals.svgHeight - ttHeight - 10
    }

    // Route through the single tooltip-position writer so the fixed-mode
    // path uses the same code as moveTooltip/Intersect.
    // No arrow placement here — fixed-mode tooltips don't track a point.
    this.tooltipPosition.applyTooltipPosition(tooltipEl, { x, y })

    return {
      x,
      y,
      ttWidth,
      ttHeight,
    }
  }

  /**
   * @param {Record<string, any>} seriesHoverParams
   */
  addDatapointEventsListeners(seriesHoverParams) {
    const w = this.w
    const points = w.dom.baseEl.querySelectorAll(
      '.apexcharts-series-markers .apexcharts-marker, .apexcharts-bar-area, .apexcharts-candlestick-area, .apexcharts-boxPlot-area, .apexcharts-violin-area, .apexcharts-rangebar-area',
    )
    this.addPathsEventListeners(points, seriesHoverParams)
  }

  /**
   * @param {any} paths
   * @param {Record<string, any>} opts
   */
  addPathsEventListeners(paths, opts) {
    const self = this

    for (let p = 0; p < paths.length; p++) {
      const extendedOpts = {
        paths: paths[p],
        tooltipEl: opts.tooltipEl,
        tooltipY: opts.tooltipY,
        tooltipX: opts.tooltipX,
        elGrid: opts.elGrid,
        hoverArea: opts.hoverArea,
        ttItems: opts.ttItems,
      }

      const events = [
        'mousemove',
        'mouseup',
        'touchmove',
        'mouseout',
        'touchend',
      ]

      events.map((ev) => {
        const handler = self.onSeriesHover.bind(self, extendedOpts)
        if (paths[p] === opts.hoverArea) {
          self.hoverAreaListeners.push({ el: paths[p], ev, handler })
        }
        return paths[p].addEventListener(ev, handler, {
          capture: false,
          passive: true,
        })
      })
    }
  }

  /**
   * Take off the hover listeners the last addSVGEvents put on the svg. Every
   * other target is a mark or series group that a render draws anew, so its
   * listeners go with it; the svg survives the data-only fast update, which
   * calls addSVGEvents again. Left on, each update stacked another set there,
   * each holding the tooltip element that update replaced: every pointer
   * move ran them all, the oldest drawing into its detached box first while
   * the live box waited out the hover throttle.
   */
  detachHoverAreaListeners() {
    for (const { el, ev, handler } of this.hoverAreaListeners) {
      el.removeEventListener(ev, handler)
    }
    this.hoverAreaListeners = []
  }

  /*
   ** Check to see if the tooltips should be updated based on a mouse / touch event
   * @param {Record<string, any>} opt
   * @param {Event} e
   */
  /** @param {Record<string, any>} opt @param {any} e */
  onSeriesHover(opt, e) {
    if (this.tConfig.interactive) {
      clearTimeout(this.interactiveHideTimeout)
      if (e.type === 'mouseout') {
        // Give the pointer time to cross the gap between the data point and
        // tooltip. Entering the tooltip cancels this deferred close.
        clearTimeout(this.seriesHoverTimeout)
        this.interactiveHideTimeout = setTimeout(
          () => {
            if (!this.w.globals.isDestroyed) this.seriesHover(opt, e)
          },
          this.interactiveHideDelay(e.clientX, e.clientY),
        )
        return
      }
    }

    // Note down the element under the pointer NOW, while the event is still
    // propagating. The draw below can be deferred past the end of dispatch, and
    // by then a chart inside a shadow root reports the host element as the
    // target instead of the bar/marker/cell we need (#3237).
    Utils.hoverTarget(e)

    // If a user is moving their mouse quickly, don't bother updating the tooltip every single frame

    const targetDelay = 20
    const timeSinceLastUpdate = Date.now() - this.lastHoverTime
    if (timeSinceLastUpdate >= targetDelay) {
      // The tooltip was last updated over 100ms ago - redraw it even if the user is still moving their
      // mouse so they get some feedback that their moves are being registered
      this.seriesHover(opt, e)
    } else {
      // The tooltip was last updated less than 100ms ago
      // Cancel any other delayed draw, so we don't show stale data
      clearTimeout(this.seriesHoverTimeout)

      // Schedule the next draw so that it happens about 100ms after the last update
      this.seriesHoverTimeout = setTimeout(() => {
        this.seriesHover(opt, e)
      }, targetDelay - timeSinceLastUpdate)
    }
  }

  /*
   ** The actual series hover function
   * @param {Record<string, any>} opt
   * @param {Event} e
   */
  /** @param {Record<string, any>} opt @param {any} e */
  seriesHover(opt, e) {
    // seriesHover can be scheduled via a ~20ms setTimeout (seriesHoverTimeout);
    // if the chart is destroyed inside that window the timer still fires. Bail so
    // it does not run against a torn-down chart (nulled baseEl / tooltip).
    if (this.w.globals.isDestroyed) return
    this.lastHoverTime = Date.now()
    let chartGroups = []
    const w = this.w

    // Crossfilter filter-mode member (Linked Views #4): its categories are one
    // dimension of a shared record set, unrelated to a sibling's dimension, so
    // the group's index-matched tooltip sync is meaningless there (hovering
    // "Loss" would caption the sibling's same-index bucket, e.g. "Q1"). Such
    // charts neither source nor receive the sync; the coordinator owns their
    // cross-chart behavior.
    const isCfMember = (/** @type {any} */ chart) => {
      const link = chart?.w?.config?.chart?.link
      return !!(link && typeof link.dimension === 'function')
    }

    // if user has more than one charts in group, we need to sync.
    // Use getSyncedCharts() (self + siblings), not getGroupedCharts()
    // (siblings only): the hovered chart must draw its OWN tooltip too,
    // otherwise the one chart under the cursor is the only one left blank.
    if (w.config.chart.group && !isCfMember(this.ctx)) {
      chartGroups = this.ctx
        .getSyncedCharts()
        .filter((/** @type {any} */ ch) => !isCfMember(ch))
    }

    if (
      w.globals.axisCharts &&
      ((w.globals.minX === -Infinity && w.globals.maxX === Infinity) ||
        w.globals.dataPoints === 0)
    ) {
      return
    }

    if (chartGroups.length) {
      // A canvas bar chart with an intersect tooltip hovers its painted marks
      // through one listener on the whole plot, so a move off every mark is
      // a move like any other. Alone, the hit test in handleBarTooltip hides
      // the box there; in a group every member takes the sticky path, which
      // never asks, so the hovered chart asks here. Off every mark the group
      // closes, as when an SVG mark is left (its mouseout), and on one the
      // members are told its series, which no node under the pointer names.
      const painted = this.groupPaintedMark(opt, e)
      if (painted?.noHit && this.showOnIntersect) {
        const at = Utils.eventPointer(e, opt)
        const out = {
          type: 'mouseout',
          target: e.target,
          clientX: at.x,
          clientY: at.y,
        }
        if (
          this.tConfig.interactive &&
          opt.tooltipEl?.classList.contains('apexcharts-active')
        ) {
          // The grace a mouseout gets to reach an interactive box
          // (onSeriesHover), started by the first move off the mark and left
          // to run by the ones after; the box or another mark calls it off.
          if (this.offMarkHideTimeout === undefined) {
            this.offMarkHideTimeout = setTimeout(
              () => {
                this.offMarkHideTimeout = undefined
                if (!this.w.globals.isDestroyed) this.seriesHover(opt, out)
              },
              this.interactiveHideDelay(at.x, at.y),
            )
          }
          return
        }
        e = out
      }

      // Plot to plot: every member measures the pointer from its own plot's
      // corner (`Utils.plotRect`), so that is what the pointer is mapped
      // between, not the grid groups' boxes, whose offsets from their plots
      // depend on what each grid draws.
      const sourceRect = opt.elGrid ? Utils.plotRect(w) : null
      const pointer = e.type === 'touchmove' ? e.touches[0] : e
      /**
       * @param {Record<string, any>} ch
       */
      chartGroups.forEach((ch) => {
        const tooltipEl = this.getElTooltip(ch)
        const elGrid = ch.w.globals.tooltip.getElGrid()
        const targetRect = elGrid ? Utils.plotRect(ch.w) : null
        const clientX =
          sourceRect && targetRect
            ? targetRect.left +
              ((pointer.clientX - sourceRect.left) / sourceRect.width) *
                targetRect.width
            : pointer.clientX
        const clientY =
          sourceRect && targetRect
            ? targetRect.top +
              ((pointer.clientY - sourceRect.top) / sourceRect.height) *
                targetRect.height
            : pointer.clientY

        const newOpts = {
          paths: opt.paths,
          tooltipEl,
          tooltipY: opt.tooltipY,
          tooltipX: opt.tooltipX,
          elGrid: elGrid || opt.elGrid,
          hoverArea: opt.hoverArea,
          ttItems: ch.w.globals.tooltip.ttItems,
          clientX,
          clientY,
          // the realIndex of the painted mark hovered, null off every one
          paintedSeries: painted
            ? painted.noHit
              ? null
              : painted.i
            : undefined,
        }

        // all the charts should have the same minX and maxX (same xaxis) for multiple tooltips to work correctly
        if (
          ch.w.globals.minX === this.w.globals.minX &&
          ch.w.globals.maxX === this.w.globals.maxX
        ) {
          ch.w.globals.tooltip.seriesHoverByContext({
            chartCtx: ch,
            ttCtx: ch.w.globals.tooltip,
            opt: newOpts,
            e,
          })
        }
      })
    } else {
      this.seriesHoverByContext({
        chartCtx: this.ctx,
        ttCtx: this.w.globals.tooltip,
        opt,
        e,
      })
    }
  }

  /**
   * The painted mark a pointer move over a canvas bar chart's plot is on,
   * when its tooltip is synced to a group (seriesHover), in any tooltip mode:
   * the members need its series to highlight, which no node under the
   * pointer names. Only an intersect tooltip closes off every mark. Null for
   * any other hover. Being on one calls off a close `offMarkHideTimeout` has
   * pending, as handleBarTooltip does.
   * @param {Record<string, any>} opt
   * @param {any} e
   * @returns {any}
   */
  groupPaintedMark(opt, e) {
    if (
      e.type !== 'mousemove' &&
      e.type !== 'touchmove' &&
      e.type !== 'mouseup'
    ) {
      return null
    }
    if (opt.paths !== opt.hoverArea || !Utils.isCanvasBarChart(this.w)) {
      return null
    }
    const mark = this.intersect.getPaintedMark(e, opt)
    if (!mark.noHit) this.cancelOffMarkHide()
    return mark
  }

  /** @param {{chartCtx: any, ttCtx: any, opt: any, e: any}} opts */
  seriesHoverByContext({ chartCtx, ttCtx, opt, e }) {
    const w = chartCtx.w
    const tooltipEl = this.getElTooltip(chartCtx)

    if (!tooltipEl) return

    // use cached dimensions instead of live getBoundingClientRect
    const cachedDims = ttCtx.getCachedDimensions()
    ttCtx.tooltipRect = {
      x: 0,
      y: 0,
      ttWidth: cachedDims.ttWidth,
      ttHeight: cachedDims.ttHeight,
    }
    ttCtx.e = e

    // highlight the current hovered bars
    if (
      ttCtx.tooltipUtil.hasBars() &&
      !w.globals.comboCharts &&
      !ttCtx.isBarShared
    ) {
      if (this.tConfig.onDatasetHover.highlightDataSeries) {
        const series = new Series(chartCtx.w)
        const parent = Utils.hoverTarget(e)?.parentNode
        if (
          (opt.paths === opt.hoverArea && Utils.isCanvasBarChart(w)) ||
          (opt.paintedSeries !== undefined && !parent?.getAttribute?.('rel'))
        ) {
          // Painted marks have no node, so what is under the pointer says
          // nothing of the series (its parent has no `rel`, and an unnamed
          // series threw); the hit test says which one it is, the hovered
          // chart's own when a synced group passes it on (seriesHover), as
          // an SVG mark passes on its series group. Off every mark, the
          // highlight goes, as it does when an SVG bar is left.
          let i = opt.paintedSeries
          if (i === undefined) {
            const mark = ttCtx.intersect.getPaintedMark(e, opt)
            i = mark.noHit ? null : mark.i
          }
          const group =
            i == null
              ? null
              : Array.from(
                  w.dom.baseEl.querySelectorAll('.apexcharts-series'),
                ).find((g) => g.getAttribute('data:realIndex') === String(i))
          series.toggleSeriesOnHover(group ? e : { type: 'mouseout' }, group)
        } else if (parent?.getAttribute?.('rel')) {
          series.toggleSeriesOnHover(e, parent)
        } else {
          // Nothing under the pointer names a series (an unnamed one threw),
          // so the highlight goes, as when a bar is left.
          series.toggleSeriesOnHover({ type: 'mouseout' }, parent)
        }
      }
    }

    if (w.globals.axisCharts) {
      ttCtx.axisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect,
      })
    } else {
      // non-plot charts i.e pie/donut/circle
      ttCtx.nonAxisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect,
      })
    }

    if (ttCtx.fixedTooltip) {
      ttCtx.drawFixedTooltipRect()
    }
  }

  // tooltip handling for line/area/bar/columns/scatter
  /** @param {{e: any, opt: any}} opts */
  axisChartsTooltips({ e, opt }) {
    const w = this.w
    let x, y

    // Every hit-test below is measured against the grid, so without one there
    // is nothing to hover. `drawSeriesTooltip` already treats a missing grid as
    // normal, and a pointer event can still arrive with the grid gone: a
    // cross-type morph tears down the axis chrome while the listeners bound to
    // the old plot are still live.
    if (!opt.elGrid) return

    // The plot itself, not the grid group's box, which starts a pixel below
    // it and so counted the plot's top row of pixels as off the plot.
    const seriesBound = Utils.plotRect(w)

    const clientX =
      opt.clientX ??
      (e.type === 'touchmove' ? e.touches[0].clientX : e.clientX)
    const clientY =
      opt.clientY ??
      (e.type === 'touchmove' ? e.touches[0].clientY : e.clientY)

    this.clientY = clientY
    this.clientX = clientX

    const offPlotVertically =
      clientY < seriesBound.top ||
      clientY > seriesBound.top + seriesBound.height

    // An interactive box that a short plot pushed past the plot's edge is
    // reached by moving out of the plot toward it, across the chart's own
    // margin. Leaving that way only starts the close, the same grace a
    // mouseout gets, and entering the box cancels it. The box still captions
    // its point meanwhile, so the captured indices stay until it closes (a
    // click in it reports them). Leaving any other way closes at once, and so
    // does the deferred mouseout pass itself: that pass IS the grace, and
    // deferring again would double it.
    if (
      offPlotVertically &&
      e?.type !== 'mouseout' &&
      this.tConfig?.interactive &&
      this.isHeadingForOutsideBox(
        opt.tooltipEl,
        clientX,
        clientY < seriesBound.top,
      )
    ) {
      clearTimeout(this.interactiveHideTimeout)
      this.interactiveHideTimeout = setTimeout(
        () => {
          if (this.w.globals.isDestroyed) return
          w.interact.capturedSeriesIndex = -1
          w.interact.capturedDataPointIndex = -1
          this.handleMouseOut(opt)
        },
        this.interactiveHideDelay(clientX, clientY),
      )
      return
    }

    w.interact.capturedSeriesIndex = -1
    w.interact.capturedDataPointIndex = -1

    if (offPlotVertically) {
      this.handleMouseOut(opt)
      return
    }

    // Back over the plot: a close this chart deferred on the way out is void.
    // (In a group only the hovered chart's own events clear its timer; a
    // sibling's is cleared here, by its own pass.)
    if (this.tConfig?.interactive) clearTimeout(this.interactiveHideTimeout)

    // Point-annotation hover tooltip (apexcharts/apexcharts.js#2424): while
    // one is showing (pointer over an annotation marker), keep the series
    // tooltip hidden, as both boxes would anchor to the same spot and read
    // as a glitch. The annotation's mouseleave deactivates it, so the very
    // next mousemove restores the series tooltip.
    if (
      w.dom.elWrap.querySelector(
        '.apexcharts-annotation-tooltip.apexcharts-active',
      )
    ) {
      this.handleMouseOut(opt)
      return
    }

    if (
      Array.isArray(this.tConfig.enabledOnSeries) &&
      !w.config.tooltip.shared &&
      // The plot-wide listener a canvas bar chart hovers its marks through
      // (one at a time) names no series; the hit test does, and
      // Intersect.handleBarTooltip checks that one.
      !(
        opt.paths === opt.hoverArea &&
        this.showOnIntersect &&
        Utils.isCanvasBarChart(w)
      )
    ) {
      const index = parseInt(opt.paths.getAttribute('index'), 10)
      if (this.tConfig.enabledOnSeries.indexOf(index) < 0) {
        this.handleMouseOut(opt)
        return
      }
    }

    const tooltipEl = this.getElTooltip()
    if (!tooltipEl) return
    const xcrosshairs = this.getElXCrosshairs()

    // A 2-D cell chart is hit-tested per CELL, not per x index, so it has its
    // own handler and must never fall into the sticky/synced path below: that
    // path resolves one x index, prints every series row for it, and anchors
    // the card to the axis rather than the cell. In a group (a trellis panel
    // is always grouped) that turned a one-line cell tooltip into an
    // all-rows card pinned to the first column.
    const isCellChart = ['heatmap', 'treemap'].includes(w.config.chart.type)

    let syncedCharts = []
    if (w.config.chart.group && !isCellChart) {
      // we need to fallback to sticky tooltip in case charts are synced
      syncedCharts = this.ctx.getSyncedCharts()
    }

    const isStickyTooltip =
      w.globals.xyCharts ||
      (w.config.chart.type === 'bar' &&
        !w.globals.isBarHorizontal &&
        this.tooltipUtil.hasBars() &&
        this.tConfig.shared) ||
      (w.globals.comboCharts && this.tooltipUtil.hasBars())

    if (
      e.type === 'mousemove' ||
      e.type === 'touchmove' ||
      e.type === 'mouseup'
    ) {
      // there is no series to hover over
      if (
        w.globals.collapsedSeries.length +
          w.globals.ancillaryCollapsedSeries.length ===
        w.seriesData.series.length
      ) {
        return
      }

      if (xcrosshairs !== null) {
        xcrosshairs.classList.add('apexcharts-active')
      }

      const hasYAxisTooltip = this.yaxisTooltips?.filter(
        (/** @type {any} */ b) => {
          return b === true
        },
      )
      // ycrosshairs is set dynamically during drawTooltip()
      const _yc = /** @type {any} */ (this).ycrosshairs
      if (_yc !== null && hasYAxisTooltip?.length) {
        _yc.classList.add('apexcharts-active')
      }

      // The handlers below can decide there is nothing under the pointer and
      // hide the tooltip: off the plot horizontally, or on a null datum. That
      // decision used to be undone a few lines later, where this branch ends by
      // activating the tooltip unconditionally, and an activated tooltip that
      // was never positioned keeps whatever geometry it last had. So it came
      // back in the margin still captioning the previous column, or, if nothing
      // had been shown yet, as an empty 2px box pinned at the chart's top-left.
      // The vertical guard at the top of this method returns for exactly this
      // reason; these paths could not, because they hide from inside a helper.
      this.tooltipHidden = false

      if (
        !isCellChart &&
        ((isStickyTooltip && !this.showOnIntersect) || syncedCharts.length > 1)
      ) {
        this.handleStickyTooltip(e, clientX, clientY, opt)
      } else {
        if (
          w.config.chart.type === 'heatmap' ||
          w.config.chart.type === 'treemap'
        ) {
          const markerXY = this.intersect.handleHeatTreeTooltip({
            e,
            opt,
            x,
            y,
            type: w.config.chart.type,
          })
          if (markerXY.noHit) {
            // canvas heatmap: pointer is off every cell -> hide, don't pin one
            this.handleMouseOut(opt)
            return
          }
          x = markerXY.x
          y = markerXY.y

          if (!markerXY.positioned) {
            // Legacy beside-the-cell placement writes style directly. Arrow-mode
            // heatmaps have already positioned via applyTooltipPosition (which
            // also sets the arrow and data-placement), so don't overwrite it.
            tooltipEl.style.left = x + 'px'
            tooltipEl.style.top = y + 'px'
            // Only set when the box left a short plot (top/bottom); beside the
            // cell this path has never written one, and must not leave one
            // behind. (A treemap without followCursor draws an arrow here.)
            if (markerXY.placement) {
              tooltipEl.dataset.placement = markerXY.placement
              tooltipEl.style.setProperty(
                '--apx-tt-arrow-x',
                markerXY.arrowX + 'px',
              )
            } else if (tooltipEl.dataset.placement) {
              delete tooltipEl.dataset.placement
            }
          }
        } else {
          if (this.tooltipUtil.hasBars()) {
            this.intersect.handleBarTooltip({
              e,
              opt,
            })
          }

          if (this.tooltipUtil.hasMarkers(0)) {
            // intersect - line/area/scatter/bubble
            this.intersect.handleMarkerTooltip({
              e,
              opt,
              x,
              y,
            })
          }
        }
      }

      // Hidden above: leave it hidden. The axis tooltips go with it, which
      // handleMouseOut has already seen to.
      if (this.tooltipHidden) return

      if (this.yaxisTooltips && this.yaxisTooltips.length) {
        for (let yt = 0; yt < w.config.yaxis.length; yt++) {
          this.axesTooltip.drawYaxisTooltipText(
            yt,
            clientY,
            /** @type {import('../../types/internal').XYRatios} */ (
              this.xyRatios
            ),
          )
        }
      }

      w.dom.baseEl.classList.add('apexcharts-tooltip-active')
      opt.tooltipEl.classList.add('apexcharts-active')
      if (
        w.config.chart.accessibility.enabled &&
        w.config.chart.accessibility.announcements.enabled
      ) {
        opt.tooltipEl.removeAttribute('aria-hidden')
      }
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      this.handleMouseOut(opt)
    }
  }

  /**
   * Where a pie / donut / polarArea slice wants its tooltip anchored, in
   * elWrap-relative pixels.
   *
   * Pie.js stamps the arc centroid on the path as `data:cx` / `data:cy`, in
   * the slice's OWN user space: below the inner group's translate, and below
   * the pie group's customScale. Reading those as if they were SVG-root
   * coordinates silently drops both, and the inner translate is exactly the
   * offset that centres a pie in a chart wider than it is tall, so on such a
   * chart the tooltip landed a couple of hundred pixels to the left of the
   * slice it described. The element's screen matrix accounts for every
   * ancestor transform at once, including the translate a slice picks up while
   * it is slid out on click.
   *
   * @param {any} el a slice path carrying data:cx / data:cy
   * @returns {{x: number, y: number} | null} null when it carries neither
   */
  getSliceAnchor(el) {
    const w = this.w
    const cx = parseFloat(el?.getAttribute('data:cx') ?? '')
    const cy = parseFloat(el?.getAttribute('data:cy') ?? '')
    if (isNaN(cx) || isNaN(cy)) return null

    const wrapBound = w.dom.elWrap.getBoundingClientRect()
    const ctm = typeof el.getScreenCTM === 'function' ? el.getScreenCTM() : null

    if (!ctm) {
      // No matrix support (jsdom): fall back to the SVG root's own offset,
      // which is right whenever nothing above the slice is transformed.
      const svgBound = w.dom.Paper.node.getBoundingClientRect()
      return {
        x: svgBound.left - wrapBound.left + cx,
        y: svgBound.top - wrapBound.top + cy,
      }
    }

    return {
      x: ctm.a * cx + ctm.c * cy + ctm.e - wrapBound.left,
      y: ctm.b * cx + ctm.d * cy + ctm.f - wrapBound.top,
    }
  }

  // tooltip handling for pie/donuts
  /** @param {{e: any, opt: any, tooltipRect: any}} opts */
  nonAxisChartsTooltips({ e, opt, tooltipRect }) {
    const w = this.w
    const rel = opt.paths.getAttribute('rel')

    const tooltipEl = this.getElTooltip()
    if (!tooltipEl) return

    const seriesBound = w.dom.elWrap.getBoundingClientRect()

    if (e.type === 'mousemove' || e.type === 'touchmove') {
      w.dom.baseEl.classList.add('apexcharts-tooltip-active')
      tooltipEl.classList.add('apexcharts-active')
      if (
        w.config.chart.accessibility.enabled &&
        w.config.chart.accessibility.announcements.enabled
      ) {
        tooltipEl.removeAttribute('aria-hidden')
      }

      // Unit chart: the listener sits on the cluster GROUP, but the hovered
      // element is the individual dot. Resolve it so each dot tooltips its
      // own identity (category + index within the category) instead of every
      // dot repeating the cluster aggregate.
      if (w.config.chart.type === 'unit') {
        const hovered = Utils.hoverTarget(e)
        const unitDot =
          hovered && typeof hovered.closest === 'function'
            ? hovered.closest('.apexcharts-unit-area')
            : null
        // Over a label / gap (no dot): leave the last tooltip untouched.
        if (!unitDot) return
        this.renderUnitTooltip(unitDot)
      } else {
        this.tooltipLabels.drawSeriesTexts({
          ttItems: opt.ttItems,
          i: parseInt(rel, 10) - 1,
          shared: false,
        })
      }

      // opt.paths is the <g class="apexcharts-series"> group element;
      // data:cx / data:cy are set on the child <path> arc element inside it
      const arcPath = opt.paths.querySelector('path[data\\:cx]') || opt.paths
      const anchor = w.config.tooltip.intersect
        ? this.getSliceAnchor(arcPath)
        : null

      // Above the slice or the pointer, and below it only when the page has no
      // room above (a small pie near the top of the viewport or of a clipping
      // card). Sideways it stays on the visible page: a pie sparkline is
      // narrower than its tooltip.
      // This event's own pointer. `w.interact` is filled in by a listener on
      // the chart's root, which this event reaches only after the slice's
      // listener has run, so on the first move into a slice it still held
      // the previous position and the box opened there.
      const pointer = Utils.eventPointer(e, opt)
      const pos = anchor
        ? this.tooltipPosition.placeOverAnchor(
            anchor.x,
            anchor.y,
            tooltipRect.ttWidth,
            tooltipRect.ttHeight,
            10,
          )
        : this.tooltipPosition.placeOverAnchor(
            pointer.x - seriesBound.left,
            pointer.y - seriesBound.top,
            tooltipRect.ttWidth,
            tooltipRect.ttHeight,
            10,
            POINTER_CLEARANCE_BELOW,
          )
      tooltipEl.style.left = pos.x + 'px'
      tooltipEl.style.top = pos.y + 'px'

      if (w.config.legend.tooltipHoverFormatter) {
        const legendFormatter = w.config.legend.tooltipHoverFormatter

        const i = rel - 1
        const legendEl = /** @type {HTMLElement | undefined} */ (
          this.legendLabels?.[i]
        )
        if (!legendEl) return
        const legendName = legendEl.getAttribute('data:default-text')

        const text = legendFormatter(legendName, {
          seriesIndex: i,
          dataPointIndex: i,
          w,
        })

        legendEl.innerHTML = text
      }
    } else if (e.type === 'mouseout' || e.type === 'touchend') {
      tooltipEl.classList.remove('apexcharts-active')
      w.dom.baseEl.classList.remove('apexcharts-tooltip-active')
      if (w.config.legend.tooltipHoverFormatter) {
        this.legendLabels?.forEach((l) => {
          const defaultText = l.getAttribute('data:default-text')
          /** @type {HTMLElement} */ l.innerHTML = decodeURIComponent(
            defaultText ?? '',
          )
        })
      }
    }
  }

  /**
   * Fill the tooltip for one hovered unit-chart dot. Each dot carries `i` (its
   * category / series index) and `j` (its index within that category). The
   * default body reads "#<j+1> of <count>"; `plotOptions.unit.tooltip.formatter`
   * overrides just the body text (it is handed i/j so it can look up per-unit
   * data), and the global `tooltip.custom` still overrides the whole markup.
   * @param {Element} dotEl the hovered `.apexcharts-unit-area` node
   */
  renderUnitTooltip(dotEl) {
    const w = this.w
    const tooltipEl = this.getElTooltip()
    if (!tooltipEl) return

    const i = parseInt(dotEl.getAttribute('i') || '0', 10)
    const j = parseInt(dotEl.getAttribute('j') || '0', 10)

    // A user-supplied global custom tooltip owns the whole markup; hand it the
    // resolved per-unit i/j (dataPointIndex) so it can render per-unit content.
    if (typeof w.config.tooltip.custom === 'function') {
      this.tooltipLabels.handleCustomTooltip({ i, j, y1: null, y2: null, w })
      return
    }

    const seriesName = w.seriesData.seriesNames[i] || `series-${i + 1}`
    // Raw category value (e.g. 1000 people) vs. the number of DOTS actually
    // drawn for it (e.g. 10 when unitValue is 100, or fewer after a maxUnits
    // clip). "#j of count" indexes dots, so count must be the dot count; read it
    // from the hovered dot's own cluster group so it always matches the render.
    const value = Math.round(Number(w.seriesData.series[i]) || 0)
    const group = dotEl.parentNode
    const count =
      group && group.querySelectorAll
        ? group.querySelectorAll('.apexcharts-unit-area').length
        : value
    const unitOpts = w.config.plotOptions.unit || {}
    const unitValue = unitOpts.unitValue > 0 ? unitOpts.unitValue : 1

    // Per-unit datum (object-form input): this dot's own data object/primitive.
    const catData = w.seriesData.unitData && w.seriesData.unitData[i]
    const datum = catData ? catData[j] : undefined
    const datumObj = datum && typeof datum === 'object' ? datum : null
    // A per-unit fillColor tints the tooltip marker to match the dot.
    const color =
      (datumObj && datumObj.fillColor) ||
      (w.globals.colors && w.globals.colors[i]) ||
      '#008FFB'

    let body
    const fmt = unitOpts.tooltip && unitOpts.tooltip.formatter
    if (typeof fmt === 'function') {
      body = fmt({
        seriesName,
        seriesIndex: i,
        dataPointIndex: j,
        count,
        value,
        unitValue,
        datum,
        color,
        w,
      })
    } else if (datum !== undefined && datum !== null) {
      // Per-unit datum: show its own name/label and value when present, else the
      // primitive value itself.
      const label = datumObj
        ? (datumObj.name ?? datumObj.label ?? datumObj.x ?? null)
        : null
      const dVal = datumObj ? (datumObj.value ?? datumObj.y ?? null) : datum
      body =
        label != null && dVal != null
          ? `${label}: ${dVal}`
          : label != null
            ? String(label)
            : dVal != null
              ? String(dVal)
              : `#${(j + 1).toLocaleString()} of ${count.toLocaleString()}`
    } else {
      // Flat-count input: the dot has no data of its own, so give its position.
      body = `#${(j + 1).toLocaleString()} of ${count.toLocaleString()}`
      // When one dot stands for many units, spell that out.
      if (unitValue !== 1) {
        body += ` &middot; ${unitValue.toLocaleString()} per dot`
      }
    }

    const fontFamily = w.config.chart.fontFamily || 'inherit'
    const fontSize =
      (w.config.tooltip.style && w.config.tooltip.style.fontSize) || '12px'

    // The arrow is a sibling of the content; detach so innerHTML keeps it.
    const arrowEl = tooltipEl.querySelector('.apexcharts-tooltip-arrow')
    tooltipEl.innerHTML =
      `<div class="apexcharts-tooltip-title" style="font-family: ${fontFamily}; font-size: ${fontSize};">${seriesName}</div>` +
      `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display: flex;">` +
      `<span class="apexcharts-tooltip-marker" style="background-color: ${color};"></span>` +
      `<div class="apexcharts-tooltip-text" style="font-family: ${fontFamily}; font-size: ${fontSize};">` +
      `<div class="apexcharts-tooltip-y-group">` +
      `<span class="apexcharts-tooltip-text-y-value">${body}</span>` +
      `</div></div></div>`
    if (arrowEl) tooltipEl.appendChild(arrowEl)

    // Content changed the box size; refresh the cached rect so the positioning
    // that follows centres on the true width/height.
    const rect = tooltipEl.getBoundingClientRect()
    this.tooltipRect.ttWidth = rect.width
    this.tooltipRect.ttHeight = rect.height
  }

  /**
   * @param {Event} e
   * @param {number} clientX
   * @param {number} clientY
   * @param {Record<string, any>} opt
   */
  handleStickyTooltip(e, clientX, clientY, opt) {
    const w = this.w
    const capj = this.tooltipUtil.getNearestValues({
      context: this,
      hoverArea: opt.hoverArea,
      clientX,
      clientY,
    })

    const j = capj.j
    let capturedSeries = capj.capturedSeries

    if (
      capturedSeries !== null &&
      w.globals.collapsedSeriesIndices.includes(capturedSeries ?? -1)
    )
      capturedSeries = null

    // Bars at the first/last data point straddle the plot edge: their centers
    // sit at 0 and `gridWidth`, so half of `barPadForNumericAxis` hangs outside
    // the plot on each side. Hovering that half still has to resolve a tooltip,
    // so widen the bound by the pad rather than clipping at the plot box.
    //
    // A WHOLE pixel beyond that is out; a fraction of one is still on the
    // edge. A grid rarely lands on a whole pixel (1194.29 wide, origin at
    // .36), so its leftmost column of pixels measures a hair NEGATIVE, and
    // that is exactly where a line chart's first marker sits: a bare `< 0`
    // hid the tooltip on the point being pointed at.
    const edgePad = w.globals.barPadForNumericAxis || 0
    if (
      capj.hoverX <= -edgePad - 1 ||
      capj.hoverX >= w.layout.gridWidth + edgePad + 1
    ) {
      this.handleMouseOut(opt)
      return
    }

    if (capturedSeries !== null) {
      this.handleStickyCapturedSeries(e, capturedSeries ?? -1, opt, j ?? 0)
    } else {
      // couldn't capture any series. check if shared X is same,
      // if yes, draw a grouped tooltip
      if (this.tooltipUtil.isXoverlap(j ?? 0) || w.globals.isBarHorizontal) {
        const firstVisibleSeries = w.seriesData.series.findIndex(
          /**
           * @param {any} s
           * @param {number} i
           */
          (s, i) => !w.globals.collapsedSeriesIndices.includes(i),
        )
        this.create(e, this, firstVisibleSeries, j ?? 0, opt.ttItems)
      }
    }
  }

  /**
   * @param {Event} e
   * @param {number} capturedSeries
   * @param {Record<string, any>} opt
   * @param {number} j
   */
  handleStickyCapturedSeries(e, capturedSeries, opt, j) {
    const w = this.w
    if (!this.tConfig.shared) {
      const ignoreNull = w.seriesData.series[capturedSeries][j] === null
      if (ignoreNull) {
        this.handleMouseOut(opt)
        return
      }
    }

    if (typeof w.seriesData.series[capturedSeries][j] !== 'undefined') {
      if (
        this.tConfig.shared &&
        this.tooltipUtil.isXoverlap(j) &&
        this.tooltipUtil.isInitialSeriesSameLen()
      ) {
        this.create(e, this, capturedSeries, j, opt.ttItems)
      } else {
        this.create(e, this, capturedSeries, j, opt.ttItems, false)
      }
    } else {
      if (this.tooltipUtil.isXoverlap(j)) {
        const firstVisibleSeries = w.seriesData.series.findIndex(
          /**
           * @param {any} s
           * @param {number} i
           */
          (s, i) => !w.globals.collapsedSeriesIndices.includes(i),
        )
        this.create(e, this, firstVisibleSeries, j, opt.ttItems)
      }
    }
  }

  deactivateHoverFilter() {
    const w = this.w
    const graphics = new Graphics(this.w, this.ctx)

    const allPaths = w.dom.Paper.find(`.apexcharts-bar-area`)

    for (let b = 0; b < allPaths.length; b++) {
      graphics.pathMouseLeave(
        /** @type {any} */ (allPaths[b]),
        /** @type {any} */ (undefined),
      )
    }
  }

  /**
   * @param {Record<string, any>} opt
   */
  handleMouseOut(opt) {
    const w = this.w

    this.tooltipHidden = true
    // The next show looks the page's clipping ancestors up again, in case the
    // chart moved in between.
    this.tooltipPosition.resetPlacementCache()

    const xcrosshairs = this.getElXCrosshairs()
    w.dom.baseEl.classList.remove('apexcharts-tooltip-active')

    opt.tooltipEl.classList.remove('apexcharts-active')
    // Clear the first-paint marker so the next show repositions without
    // animating from the now-stale prior coords. Paired with the
    // `data-positioned` write in Position.applyTooltipPosition.
    delete opt.tooltipEl.dataset.positioned
    if (
      w.config.chart.accessibility.enabled &&
      w.config.chart.accessibility.announcements.enabled
    ) {
      opt.tooltipEl.setAttribute('aria-hidden', 'true')
    }
    this.deactivateHoverFilter()
    if (w.config.chart.type !== 'bubble') {
      this.marker.resetPointsSize()
    }
    if (xcrosshairs !== null) {
      xcrosshairs.classList.remove('apexcharts-active')
    }
    // ycrosshairs is set dynamically during drawTooltip()
    const _yc2 = /** @type {any} */ (this).ycrosshairs
    if (_yc2 !== null) {
      _yc2.classList.remove('apexcharts-active')
    }
    if (this.isXAxisTooltipEnabled) {
      this.xaxisTooltip?.classList.remove('apexcharts-active')
    }
    if (this.yaxisTooltips && this.yaxisTooltips.length) {
      if (this.yaxisTTEls === null) {
        this.yaxisTTEls = /** @type {HTMLElement[]} */ ([
          ...w.dom.baseEl.querySelectorAll('.apexcharts-yaxistooltip'),
        ])
      }
      for (let i = 0; i < this.yaxisTTEls.length; i++) {
        this.yaxisTTEls[i].classList.remove('apexcharts-active')
      }
    }

    if (w.config.legend.tooltipHoverFormatter) {
      this.legendLabels?.forEach((l) => {
        const defaultText = l.getAttribute('data:default-text')
        /** @type {HTMLElement} */ l.innerHTML = decodeURIComponent(
          defaultText ?? '',
        )
      })
    }
  }

  /**
   * @param {Event} e
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   */
  markerClick(e, seriesIndex, dataPointIndex) {
    const w = this.w
    if (typeof w.config.chart.events.markerClick === 'function') {
      w.config.chart.events.markerClick(e, this.ctx, {
        seriesIndex,
        dataPointIndex,
        w,
      })
    }
    this.ctx.events.fireEvent('markerClick', [
      e,
      this.ctx,
      { seriesIndex, dataPointIndex, w },
    ])
  }

  /**
   * Marks (#11): whether the chart's type (or any series' type) is a registered
   * custom series, whose marks live outside the built-in marker DOM.
   * @returns {boolean}
   */
  _hasCustomSeries() {
    const w = this.w
    if (isCustom(w.config.chart.type)) return true
    const series = w.config.series || []
    return series.some(
      (/** @type {any} */ s) => s && s.type && isCustom(s.type),
    )
  }

  /**
   * @param {Event} e
   * @param {any} context
   * @param {number} capturedSeries
   * @param {number} j
   * @param {any} ttItems
   * @param {boolean | null} shared
   */
  create(e, context, capturedSeries, j, ttItems, shared = null) {
    const w = this.w
    const ttCtx = context

    if (e.type === 'mouseup') {
      this.markerClick(e, capturedSeries, j)
    }

    if (shared === null) shared = this.tConfig.shared

    const hasMarkers = this.tooltipUtil.hasMarkers(capturedSeries)
    // Strata (#2): in canvas mode there are no per-point marker nodes, so the
    // DOM-driven position path (hasMarkers) is skipped and the tooltip would
    // stay pinned at the origin. The pixel coords live in w.globals.pointsArray
    // (populated by the canvas emit sites), so route positioning through the
    // pointsArray-based dynamic positioners instead.
    const canvasMode = this.ctx?.renderer?.kind === 'canvas'
    // Bars/candles keep the hasBars() -> moveStickyTooltipOverBars path (which
    // reads the canvas coord cache); only non-bar canvas series (line/area/
    // scatter markers) route through the pointsArray positioners here.
    const canvasNonBar = canvasMode && !this.tooltipUtil.hasBars()
    // A line, area or scatter series beside the bars of a combo is painted
    // too, so when it is the one captured there is no marker node for
    // hasMarkers to find, where on SVG its marker is enlarged and the box
    // goes to its point. It takes the pointsArray positioners as well; only
    // a captured bar-like stays with the bars.
    const canvasPointSeries =
      canvasMode &&
      !canvasNonBar &&
      !Utils.isBarLikeType(
        /** @type {any} */ (w.config.series[capturedSeries])?.type ??
          w.config.chart.type,
      )
    // Marks (#11): custom series paint their own marks (no .apexcharts-marker
    // nodes to enlarge/position), but they populate w.globals.pointsArray just
    // like canvas does. So when a custom-series chart has no markers and no
    // bars, route positioning through the same pointsArray positioners; without
    // this the tooltip activates but never moves off the origin.
    const marksMode =
      !canvasMode &&
      !hasMarkers &&
      !this.tooltipUtil.hasBars() &&
      this._hasCustomSeries()
    const dynamicPoints = canvasNonBar || canvasPointSeries || marksMode

    const bars = this.tooltipUtil.getElBars()

    const handlePoints = () => {
      if (
        w.globals.markers.largestSize > 0 &&
        !canvasMode &&
        !w.globals.markers.batched
      ) {
        ttCtx.marker.enlargePoints(j)
      } else {
        // canvas: markers paint to a bitmap with no node to enlarge, so the
        // box is positioned off the cached pointsArray coords instead. Batched
        // markers are one path per series, with the same consequence.
        ttCtx.tooltipPosition.moveDynamicPointsOnHover(j)
      }
    }

    if (w.config.legend.tooltipHoverFormatter) {
      const legendFormatter = w.config.legend.tooltipHoverFormatter

      const els = /** @type {HTMLElement[]} */ (
        Array.from(this.legendLabels ?? [])
      )

      // reset all legend values first
      els.forEach((l) => {
        const legendName = l.getAttribute('data:default-text')
        l.innerHTML = decodeURIComponent(legendName ?? '')
      })

      // for irregular time series
      for (let i = 0; i < els.length; i++) {
        const l = els[i]
        const lsIndex = parseInt(l.getAttribute('i') ?? '', 10)
        const legendName = decodeURIComponent(
          l.getAttribute('data:default-text') ?? '',
        )

        const text = legendFormatter(legendName, {
          seriesIndex: shared ? lsIndex : capturedSeries,
          dataPointIndex: j,
          w,
        })

        if (!shared) {
          l.innerHTML = lsIndex === capturedSeries ? text : legendName
          if (capturedSeries === lsIndex) {
            break
          }
        } else {
          l.innerHTML =
            w.globals.collapsedSeriesIndices.indexOf(lsIndex) < 0
              ? text
              : legendName
        }
      }
    }

    const _rangeData = /** @type {any} */ (w.rangeData)
    const commonSeriesTextsParams = {
      ttItems,
      i: capturedSeries,
      j,
      ...(_rangeData.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y1 !==
        undefined && {
        y1: _rangeData.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y1,
      }),
      ...(_rangeData.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y2 !==
        undefined && {
        y2: _rangeData.seriesRange?.[capturedSeries]?.[j]?.y[0]?.y2,
      }),
    }
    if (shared) {
      ttCtx.tooltipLabels.drawSeriesTexts({
        ...commonSeriesTextsParams,
        shared: this.showOnIntersect ? false : this.tConfig.shared,
      })

      if (hasMarkers || dynamicPoints) {
        handlePoints()
      } else if (this.tooltipUtil.hasBars()) {
        if (canvasMode) {
          // canvas: bars/candles paint to the bitmap, so the barSeriesHeight /
          // paths / hover-filter machinery below is DOM-only and no-ops here.
          // Position straight off the cached bar coords (barSeriesHeight then
          // resolves to 0, so the SVG block is skipped).
          ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)
        }
        this.barSeriesHeight = this.tooltipUtil.getBarsHeight(
          /** @type {any[]} */ ([...bars]),
        )
        if (this.barSeriesHeight > 0) {
          // hover state, activate snap filter
          const graphics = new Graphics(this.w, this.ctx)
          const paths = w.dom.Paper.find(`.apexcharts-bar-area[j='${j}']`)

          // de-activate first
          this.deactivateHoverFilter()
          const points = ttCtx.tooltipUtil.getAllMarkers(true)

          if (points.length && !this.barSeriesHeight) {
            handlePoints()
          }

          ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)

          for (let b = 0; b < paths.length; b++) {
            graphics.pathMouseEnter(
              /** @type {any} */ (paths[b]),
              /** @type {any} */ (undefined),
            )
          }
        }
      }
    } else {
      ttCtx.tooltipLabels.drawSeriesTexts({
        shared: false,
        ...commonSeriesTextsParams,
      })

      if (this.tooltipUtil.hasBars()) {
        ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, capturedSeries)
      }

      if (hasMarkers) {
        ttCtx.tooltipPosition.moveMarkers(capturedSeries, j)
      } else if (dynamicPoints) {
        // canvas / custom marks: no marker node to enlarge; position off the
        // cached pointsArray coords. (bars already positioned above.)
        ttCtx.tooltipPosition.moveDynamicPointOnHover(j, capturedSeries)
      }
    }
  }
}
