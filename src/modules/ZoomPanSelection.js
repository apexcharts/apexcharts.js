// @ts-check
import Graphics from './Graphics'
import Utils from './../utils/Utils'
import Toolbar from './Toolbar'
import AxisMapping from './AxisMapping'
import { Box } from '../svg/index'

// Wheel-zoom feel: scrolling this many deltaY pixels doubles (or halves) the
// visible x-window. 240px is about two discrete wheel notches per 2x zoom
// (~1.4x per notch): steep enough to traverse a large dataset in a few flicks,
// gentle enough that a trackpad's stream of small deltas feels continuous.
const WHEEL_ZOOM_PIXELS_PER_2X = 240

/**
 * ApexCharts Zoom Class for handling zooming and panning on axes based charts.
 *
 * @module ZoomPanSelection
 **/

export default class ZoomPanSelection extends Toolbar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    super(w, ctx)

    this.w = w
    this.ctx = ctx // needed: toolbar ref, fires events with ctx

    this.dragged = false
    this.graphics = new Graphics(this.w)

    this.eventList = [
      'mousedown',
      'mouseleave',
      'mousemove',
      'touchstart',
      'touchmove',
      'mouseup',
      'touchend',
      'wheel',
    ]

    this.clientX = 0
    this.clientY = 0
    this.startX = 0
    this.endX = 0
    this.dragX = 0
    this.startY = 0
    this.endY = 0
    this.dragY = 0
    this.moveDirection = 'none'
  }

  /** @param {{xyRatios: any}} opts */
  init({ xyRatios }) {
    const w = this.w
    const me = this

    // fastUpdate refreshes this field in place when a data-only update changes
    // the domain (the instance survives the fast path; only a full render
    // recreates it). Always read this.xyRatios, never an init-captured copy.
    this.xyRatios = xyRatios

    this.zoomRect = this.graphics.drawRect(0, 0, 0, 0)
    this.selectionRect = this.graphics.drawRect(0, 0, 0, 0)

    this.constraints = new Box(0, 0, w.layout.gridWidth, w.layout.gridHeight)

    this.zoomRect.node.classList.add('apexcharts-zoom-rect')
    this.selectionRect.node.classList.add('apexcharts-selection-rect')
    w.dom.Paper.add(this.zoomRect)
    w.dom.Paper.add(this.selectionRect)

    if (w.config.chart.selection.type === 'x') {
      this.slDraggableRect = this.selectionRect
        .draggable({
          minX: 0,
          minY: 0,
          maxX: w.layout.gridWidth,
          maxY: w.layout.gridHeight,
        })
        .on('dragmove.namespace', this.selectionDragging.bind(this, 'dragging'))
    } else if (w.config.chart.selection.type === 'y') {
      this.slDraggableRect = this.selectionRect
        .draggable({
          minX: 0,
          maxX: w.layout.gridWidth,
        })
        .on('dragmove.namespace', this.selectionDragging.bind(this, 'dragging'))
    } else {
      this.slDraggableRect = this.selectionRect
        .draggable()
        .on('dragmove.namespace', this.selectionDragging.bind(this, 'dragging'))
    }
    this.preselectedSelection()

    this.hoverArea = /** @type {Element} */ (
      w.dom.baseEl.querySelector(`${w.globals.chartClass} .apexcharts-svg`)
    )
    if (!this.hoverArea) return
    this.hoverArea.classList.add('apexcharts-zoomable')

    this.eventList.forEach((event) => {
      this.hoverArea?.addEventListener(
        event,
        me.svgMouseEvents.bind(me, xyRatios),
        {
          capture: false,
          passive: true,
        },
      )
    })

    if (
      w.config.chart.zoom.enabled &&
      w.config.chart.zoom.allowMouseWheelZoom
    ) {
      this.hoverArea.addEventListener('wheel', me.mouseWheelEvent.bind(me), {
        capture: false,
        passive: false,
      })
    }

    // Momentum: passive:false touch listeners (following the wheel-listener
    // template above) so two-finger pinch and horizontal pan can preventDefault
    // the browser's native page zoom/scroll. Every _updateOptions destroys and
    // recreates this instance (see Destroy.clear), and applying a gesture frame
    // triggers exactly that re-render, so ALL gesture state lives on w.interact
    // (which survives re-renders) rather than on the instance. The browser keeps
    // delivering the touch sequence to its original target node, whose listener
    // is bound to the now-detached old instance; that old instance keeps driving
    // the gesture using the persistent w state. init() just (re)binds listeners
    // to the current hover area for the NEXT gesture; old nodes are GC'd.
    if (this._momentumEnabled()) {
      ;['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(
        (event) => {
          this.hoverArea?.addEventListener(event, me.momentumTouch.bind(me), {
            capture: false,
            passive: false,
          })
        },
      )
    }
  }

  // remove the event listeners which were previously added on hover area
  destroy() {
    // Momentum: no teardown here. destroy() runs on every update (isUpdating),
    // not only on a real destroy, so cancelling inertia here would kill a glide
    // on its first frame. The inertia loop self-terminates on
    // w.globals.isDestroyed (set only on a full destroy), and the gesture state
    // on w.interact is discarded with w when the chart is truly destroyed.
    if (this.slDraggableRect) {
      this.slDraggableRect.draggable(false)
      this.slDraggableRect.off()
      this.selectionRect.off()
    }

    this.selectionRect = null
    this.zoomRect = null
  }

  /**
   * @param {import('../types/internal').XYRatios} xyRatios
   * @param {any} e
   */
  svgMouseEvents(xyRatios, e) {
    const w = this.w
    const toolbar = this.ctx.toolbar

    // Momentum owns multi-touch and any in-progress touch gesture: stand down
    // the single-touch pan/selection path so they do not fight. (momentum.busy
    // also covers touchend, where e.touches has already emptied.) Mouse events
    // carry no e.touches and never set momentum.busy, so they are unaffected.
    if (w.interact.momentum && w.interact.momentum.busy) return
    if (this._momentumEnabled() && e.touches && e.touches.length > 1) {
      return
    }

    const zoomtype = w.interact.zoomEnabled
      ? w.config.chart.zoom.type
      : w.config.chart.selection.type

    const autoSelected = w.config.chart.toolbar.autoSelected

    // Shift temporarily flips zoom<->pan, restoring the auto-selected tool on
    // release. 'measure' is not a zoom/pan tool (it captures the plot via its
    // own pane), so it opts out of this shift dance entirely.
    if (autoSelected !== 'measure') {
      if (e.shiftKey) {
        this.shiftWasPressed = true
        toolbar.enableZoomPanFromToolbar(autoSelected === 'pan' ? 'zoom' : 'pan')
      } else {
        if (this.shiftWasPressed) {
          toolbar.enableZoomPanFromToolbar(autoSelected)
          this.shiftWasPressed = false
        }
      }
    }

    if (!e.target) return

    const tc = e.target.classList
    let pc
    if (e.target.parentNode && e.target.parentNode !== null) {
      pc = e.target.parentNode.classList
    }
    const falsePositives =
      tc.contains('apexcharts-legend-marker') ||
      tc.contains('apexcharts-legend-text') ||
      (pc && pc.contains('apexcharts-toolbar'))

    if (falsePositives) return

    this.clientX =
      e.type === 'touchmove' || e.type === 'touchstart'
        ? e.touches[0].clientX
        : e.type === 'touchend'
          ? e.changedTouches[0].clientX
          : e.clientX
    this.clientY =
      e.type === 'touchmove' || e.type === 'touchstart'
        ? e.touches[0].clientY
        : e.type === 'touchend'
          ? e.changedTouches[0].clientY
          : e.clientY

    if ((e.type === 'mousedown' && e.which === 1) || e.type === 'touchstart') {
      const gridRectDim = this._gridRect()
      if (!gridRectDim) return

      this.startX = this._screenXToPlotPx(this.clientX)
      this.startY = this.clientY - gridRectDim.top

      this.dragged = false
      this.w.interact.mousedown = true
    }

    if ((e.type === 'mousemove' && e.which === 1) || e.type === 'touchmove') {
      this.dragged = true

      if (w.interact.panEnabled) {
        w.interact.selection = null
        if (this.w.interact.mousedown) {
          this.panDragging({
            context: this,
            zoomtype,
            xyRatios: this.xyRatios,
          })
        }
      } else {
        if (
          (this.w.interact.mousedown && w.interact.zoomEnabled) ||
          (this.w.interact.mousedown && w.interact.selectionEnabled)
        ) {
          this.selection = this.selectionDrawing({
            context: this,
            zoomtype,
          })
        }
      }
    }

    if (
      e.type === 'mouseup' ||
      e.type === 'touchend' ||
      e.type === 'mouseleave'
    ) {
      this.handleMouseUp({ zoomtype })
    }

    this.makeSelectionRectDraggable()
  }

  /** @param {{ zoomtype?: any, isResized?: any }} opts */
  handleMouseUp({ zoomtype, isResized }) {
    const w = this.w
    // we will be calling getBoundingClientRect on each mousedown/mousemove/mouseup
    const gridRectDim = this._gridRect()

    if (gridRectDim && (this.w.interact.mousedown || isResized)) {
      // user released the drag, now do all the calculations
      this.endX = this._screenXToPlotPx(this.clientX)
      this.endY = this.clientY - gridRectDim.top
      this.dragX = Math.abs(this.endX - this.startX)
      this.dragY = Math.abs(this.endY - this.startY)

      if (w.interact.zoomEnabled || w.interact.selectionEnabled) {
        this.selectionDrawn({
          context: this,
          zoomtype,
        })
      }

      // if (w.interact.panEnabled && w.config.xaxis.convertedCatToNumeric) {
      //   this.delayedPanScrolled()
      // }
    }

    if (w.interact.zoomEnabled) {
      this.hideSelectionRect(this.selectionRect)
    }

    this.dragged = false
    this.w.interact.mousedown = false
  }

  // ---------------------------------------------------------------------------
  // Wheel zoom: continuous, cursor-anchored zoom on mouse wheel / trackpad.
  //
  // Each wheel event multiplies a pending zoom factor scaled to its deltaY (so
  // a trackpad's stream of tiny deltas and a discrete wheel's ±100 notches both
  // feel proportional), and the accumulated factor is applied at most once per
  // animation frame through the same immediate, animation-free fast path the
  // touch pinch uses (_applyXRange). Deliberately instant, trading-chart style:
  // no per-step morph and no easing between steps (an animated variant was
  // tried and rejected). The original implementation instead ran a fixed
  // 0.5x/1.5x animated update at most once per 400ms and dropped every wheel
  // event in between, which read as lag on continuous scrolling.
  //
  // Like Momentum (see the comment above momentumTouch), applying a frame
  // triggers _updateOptions, which destroys and recreates this instance
  // mid-gesture, so all wheel-gesture state lives on w.interact.wheel rather
  // than on the instance.
  // ---------------------------------------------------------------------------

  /** Lazily-created, re-render-surviving wheel-gesture state. */
  _wheel() {
    const it = this.w.interact
    if (!it.wheel) {
      it.wheel = {
        factor: 1,
        clientX: 0,
        /** @type {number|null} */ rafId: null,
        /** @type {any} */ endTimer: null,
      }
    }
    return it.wheel
  }

  /**
   * @param {any} e
   */
  mouseWheelEvent(e) {
    e.preventDefault()

    const st = this._wheel()

    // normalize the delta to pixels (deltaMode 1 = lines, 2 = pages)
    let dy = e.deltaY
    if (e.deltaMode === 1) dy *= 33
    else if (e.deltaMode === 2) dy *= 330

    // scroll up (dy < 0) shrinks the window => zoom in
    st.factor *= Math.pow(2, dy / WHEEL_ZOOM_PIXELS_PER_2X)
    st.clientX = e.clientX

    if (st.rafId == null) {
      st.rafId = requestAnimationFrame(() => this._applyWheelZoom())
    }

    // the zoomed callback fires once per gesture (like pinch), not per event
    if (st.endTimer) clearTimeout(st.endTimer)
    st.endTimer = setTimeout(() => this._endWheelZoom(), 150)
  }

  /**
   * Apply the zoom factor accumulated since the last animation frame, keeping
   * the data value under the cursor pinned (both zooming in and out).
   */
  _applyWheelZoom() {
    const w = this.w
    const st = this._wheel()
    st.rafId = null
    const scale = st.factor
    st.factor = 1
    if (scale === 1 || w.globals.isDestroyed) return

    const gridRectDim = this._gridRect()
    if (!gridRectDim || !gridRectDim.width) return

    const { min, max } = this._currentXWindow()
    const range = max - min
    const mouseX = Math.min(
      Math.max((st.clientX - gridRectDim.left) / gridRectDim.width, 0),
      1,
    )

    let newRange = range * scale

    // Floor the zoom-in window at ~2 data points' worth of x-span (minXDiff is
    // the smallest gap between consecutive x values), not a fixed 1% of the
    // full data span: a span-relative floor stopped wheel-zoom far short of the
    // toolbar's zoom-in button on large series. Cap zoom-out at the full domain
    // so scrolling out past the data doesn't keep re-rendering.
    const bounds = this._clampBounds()
    if (bounds) {
      const minXDiff =
        w.globals.minXDiff > 0 && isFinite(w.globals.minXDiff)
          ? w.globals.minXDiff
          : 0
      const minRange = Math.max(minXDiff * 2, (bounds.max - bounds.min) * 1e-6)
      if (newRange < minRange) newRange = minRange
      if (newRange > bounds.max - bounds.min) newRange = bounds.max - bounds.min
    }

    const anchor = min + mouseX * range
    let newMinX = anchor - mouseX * newRange
    let newMaxX = newMinX + newRange

    // already at the zoom floor or the full domain: nothing to re-render
    const eps = range * 1e-9
    if (Math.abs(newMinX - min) < eps && Math.abs(newMaxX - max) < eps) return

    if (isNaN(newMinX) || isNaN(newMaxX)) return

    const beforeZoomRange = this.getBeforeZoomRange(
      { min: newMinX, max: newMaxX },
      /** @type {any} */ (undefined),
    )
    if (beforeZoomRange && beforeZoomRange.xaxis) {
      newMinX = beforeZoomRange.xaxis.min
      newMaxX = beforeZoomRange.xaxis.max
    }

    this._applyXRange(newMinX, newMaxX, true)
  }

  /** Fire the zoomed callback once the wheel gesture settles (mirrors _endPinch). */
  _endWheelZoom() {
    const w = this.w
    const st = this._wheel()
    st.endTimer = null
    if (w.globals.isDestroyed || !w.interact.zoomed) return

    const { min, max } = this._currentXWindow()
    const yaxis = w.globals.initialConfig
      ? Utils.clone(w.globals.initialConfig.yaxis)
      : []
    const toolbar = this.ctx.toolbar
    if (toolbar) toolbar.zoomCallback({ min, max }, yaxis)
  }

  makeSelectionRectDraggable() {
    const w = this.w

    if (!this.selectionRect) return

    const rectDim = this.selectionRect.node.getBoundingClientRect()
    if (rectDim.width > 0 && rectDim.height > 0) {
      this.selectionRect.select(false).resize(false)
      this.selectionRect
        /**
         * @param {Element} group
         * @param {number} p
         * @param {number} index
         * @param {any[]} pointArr
         * @param {string} handleName
         */
        .select({
          createRot: () => {},
          updateRot: () => {},
          createHandle: (
            /** @type {any} */ group,
            /** @type {any} */ p,
            /** @type {any} */ index,
            /** @type {any} */ pointArr,
            /** @type {any} */ handleName,
          ) => {
            if (handleName === 'l' || handleName === 'r')
              return group
                .circle(8)
                .css({ 'stroke-width': 1, stroke: '#333', fill: '#fff' })
            /**
             * @param {Element} group
             * @param {number} p
             */
            return group.circle(0)
          },
          updateHandle: (/** @type {any} */ group, /** @type {any} */ p) => {
            return group.center(p[0], p[1])
          },
        })
        .resize()
        .on('resize', () => {
          if (w.interact.selectionEnabled) {
            // A handle resize re-reports the selection through the SAME shared
            // mapping (and debounce) as the rect-body drag. The old path
            // (handleMouseUp -> selectionDrawn) is gated by `dragged`, which is
            // false during a pure resize, so the reported range / crossfilter
            // went stale while the rect visibly grew (e.g. you could never
            // resize the brush out to cover the last column). Persist the new
            // rect too so a re-render keeps it.
            w.interact.selection = {
              x: parseFloat(this.selectionRect.node.getAttribute('x')),
              y: parseFloat(this.selectionRect.node.getAttribute('y')),
              width: parseFloat(this.selectionRect.node.getAttribute('width')),
              height: parseFloat(this.selectionRect.node.getAttribute('height')),
            }
            clearTimeout(this.w.globals.selectionResizeTimer ?? undefined)
            this.w.globals.selectionResizeTimer = window.setTimeout(() => {
              this._emitSelectionFromRect()
            }, 30)
          } else {
            const zoomtype = w.interact.zoomEnabled
              ? w.config.chart.zoom.type
              : w.config.chart.selection.type
            this.handleMouseUp({ zoomtype, isResized: true })
          }
        })
    }
  }

  preselectedSelection() {
    const w = this.w
    const xyRatios = this.xyRatios

    if (!w.interact.zoomEnabled) {
      if (
        typeof w.interact.selection !== 'undefined' &&
        w.interact.selection !== null
      ) {
        this.drawSelectionRect({
          ...w.interact.selection,
          translateX: w.layout.translateX,
          translateY: w.layout.translateY,
        })
      } else {
        if (
          w.config.chart.selection.xaxis.min !== undefined &&
          w.config.chart.selection.xaxis.max !== undefined
        ) {
          // Same mapping as bar placement (AxisMapping): x/width in plot-origin
          // px so the preselected rect is pixel-exact against the bars.
          let x = AxisMapping.dataXToPx(w, w.config.chart.selection.xaxis.min)
          let width =
            AxisMapping.dataXToPx(w, w.config.chart.selection.xaxis.max) - x
          if (w.axisFlags.isRangeBar) {
            // rangebars put datetime data in y axis
            x =
              (w.config.chart.selection.xaxis.min -
                w.globals.yAxisScale[0].niceMin) /
              xyRatios.invertedYRatio
            width =
              (w.config.chart.selection.xaxis.max -
                w.config.chart.selection.xaxis.min) /
              xyRatios.invertedYRatio
          }
          const selectionRect = {
            x,
            y: 0,
            width,
            height: w.layout.gridHeight,
            translateX: w.layout.translateX,
            translateY: w.layout.translateY,
            selectionEnabled: true,
          }
          this.drawSelectionRect(selectionRect)
          this.makeSelectionRectDraggable()
          if (typeof w.config.chart.events.selection === 'function') {
            w.config.chart.events.selection(this.ctx, {
              xaxis: {
                min: w.config.chart.selection.xaxis.min,
                max: w.config.chart.selection.xaxis.max,
              },
              yaxis: {},
            })
          }
        }
      }
    }
  }

  /** @param {{x: any, y: any, width: any, height: any, translateX: any, translateY: any}} opts */
  drawSelectionRect({ x, y, width, height, translateX = 0, translateY = 0 }) {
    const w = this.w
    const zoomRect = this.zoomRect
    const selectionRect = this.selectionRect
    if (this.dragged || w.interact.selection !== null) {
      const scalingAttrs = {
        transform: 'translate(' + translateX + ', ' + translateY + ')',
      }

      // change styles based on zoom or selection
      // zoom is Enabled and user has dragged, so draw blue rect
      if (w.interact.zoomEnabled && this.dragged) {
        if (width < 0) width = 1 // fixes apexcharts.js#1168
        zoomRect.attr({
          x,
          y,
          width,
          height,
          fill: w.config.chart.zoom.zoomedArea.fill.color,
          'fill-opacity': w.config.chart.zoom.zoomedArea.fill.opacity,
          stroke: w.config.chart.zoom.zoomedArea.stroke.color,
          'stroke-width': w.config.chart.zoom.zoomedArea.stroke.width,
          'stroke-opacity': w.config.chart.zoom.zoomedArea.stroke.opacity,
        })
        Graphics.setAttrs(zoomRect.node, scalingAttrs)
      }

      // selection is enabled
      if (w.interact.selectionEnabled) {
        selectionRect.attr({
          x,
          y,
          width: width > 0 ? width : 0,
          height: height > 0 ? height : 0,
          fill: w.config.chart.selection.fill.color,
          'fill-opacity': w.config.chart.selection.fill.opacity,
          stroke: w.config.chart.selection.stroke.color,
          'stroke-width': w.config.chart.selection.stroke.width,
          'stroke-dasharray': w.config.chart.selection.stroke.dashArray,
          'stroke-opacity': w.config.chart.selection.stroke.opacity,
        })

        Graphics.setAttrs(selectionRect.node, scalingAttrs)
      }
    }
  }

  /**
   * @param {any} rect
   */
  hideSelectionRect(rect) {
    if (rect) {
      rect.attr({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      })
    }
  }

  selectionDrawing(/** @type {any} */ { context, zoomtype }) {
    const w = this.w
    const me = context

    const gridRectDim = this._gridRect()
    if (!gridRectDim) return

    const startX = me.startX - 1
    const startY = me.startY
    let inversedX = false
    let inversedY = false

    const left = this._screenXToPlotPx(me.clientX)
    const top = me.clientY - gridRectDim.top

    let selectionWidth = left - startX
    let selectionHeight = top - startY

    /** @type {any} */
    let selectionRect = {
      translateX: w.layout.translateX,
      translateY: w.layout.translateY,
    }

    if (Math.abs(selectionWidth + startX) > w.layout.gridWidth) {
      // user dragged the mouse outside drawing area to the right
      selectionWidth = w.layout.gridWidth - startX
    } else if (left < 0) {
      // user dragged the mouse outside drawing area to the left
      selectionWidth = startX
    }

    // inverse selection X
    if (startX > left) {
      inversedX = true
      selectionWidth = Math.abs(selectionWidth)
    }

    // inverse selection Y
    if (startY > top) {
      inversedY = true
      selectionHeight = Math.abs(selectionHeight)
    }

    if (zoomtype === 'x') {
      selectionRect = {
        x: inversedX ? startX - selectionWidth : startX,
        y: 0,
        width: selectionWidth,
        height: w.layout.gridHeight,
      }
    } else if (zoomtype === 'y') {
      selectionRect = {
        x: 0,
        y: inversedY ? startY - selectionHeight : startY,
        width: w.layout.gridWidth,
        height: selectionHeight,
      }
    } else {
      selectionRect = {
        x: inversedX ? startX - selectionWidth : startX,
        y: inversedY ? startY - selectionHeight : startY,
        width: selectionWidth,
        height: selectionHeight,
      }
    }

    selectionRect = {
      ...selectionRect,
      translateX: w.layout.translateX,
      translateY: w.layout.translateY,
    }

    me.drawSelectionRect(selectionRect)
    me.selectionDragging('resizing')
    return selectionRect
  }

  /**
   * @param {string} type
   * @param {CustomEvent} e
   */
  selectionDragging(type, e) {
    const w = this.w
    if (!e) return

    e.preventDefault()

    const { handler, box } = e.detail
    const constraints = /** @type {any} */ (this.constraints)

    let { x, y } = box

    if (x < constraints.x) {
      x = constraints.x
    }

    if (y < constraints.y) {
      y = constraints.y
    }

    if (box.x2 > constraints.x2) {
      x = constraints.x2 - box.w
    }

    if (box.y2 > constraints.y2) {
      y = constraints.y2 - box.h
    }

    handler.move(x, y)

    const selRect = this.selectionRect

    let timerInterval = 0

    if (type === 'resizing') {
      timerInterval = 30
    }

    // update selection when selection rect is dragged
    /**
     * @param {string} attr
     */
    const getSelAttr = (attr) => {
      return parseFloat(selRect.node.getAttribute(attr))
    }
    const draggedProps = {
      x: getSelAttr('x'),
      y: getSelAttr('y'),
      width: getSelAttr('width'),
      height: getSelAttr('height'),
    }

    w.interact.selection = draggedProps
    // update selection ends

    // Run the range recompute when the user has a selection callback OR Linked
    // Views (#4) crossfilter is on, so dragging/resizing the persistent
    // selection rect re-crossfilters even without a user events.selection.
    // Covers both highlight mode (link.enabled) and filter mode (link.dimension).
    const link = w.config.chart.link
    const linkActive = !!(
      link && (link.enabled || typeof link.dimension === 'function')
    )
    if (
      (typeof w.config.chart.events.selection === 'function' || linkActive) &&
      w.interact.selectionEnabled
    ) {
      // a small debouncer is required when resizing to avoid freezing the chart
      clearTimeout(this.w.globals.selectionResizeTimer ?? undefined)
      this.w.globals.selectionResizeTimer = window.setTimeout(() => {
        this._emitSelectionFromRect()
      }, timerInterval)
    }
  }

  /**
   * Recompute the reported x/y range from the CURRENT persistent selection rect
   * (via the shared AxisMapping) and notify listeners: chart.events.selection,
   * brushScrolled, and the crossfilter coordinator. Shared by the rect-body drag
   * (selectionDragging) and the handle resize (makeSelectionRectDraggable) so
   * every gesture re-reports through ONE mapping and the reported range always
   * matches the rect the user sees. No dragged/threshold gate: reaching here
   * already means the user moved or resized the persistent rect.
   */
  _emitSelectionFromRect() {
    const w = this.w
    if (!w.interact.selectionEnabled) return
    const link = w.config.chart.link
    const linkActive = !!(
      link && (link.enabled || typeof link.dimension === 'function')
    )
    if (typeof w.config.chart.events.selection !== 'function' && !linkActive) {
      return
    }

    const gridRectDim = this._gridRect()
    if (!gridRectDim) return
    const selectionRect = this.selectionRect.node.getBoundingClientRect()
    const xyRatios = this.xyRatios

    let minX, maxX, minY, maxY

    // Convert the rect's pixel edges to data via the shared AxisMapping used by
    // bar placement and selectionDrawn: pixels are measured from the plot origin
    // (translateX), the data origin is minX (NOT niceMin), and barPad never
    // enters the mapping.
    const relLeft = this._screenXToPlotPx(selectionRect.left)
    const relRight = this._screenXToPlotPx(selectionRect.right)

    if (!w.axisFlags.isRangeBar) {
      if (!w.globals.xAxisScale) return
      minX = AxisMapping.pxToDataX(w, relLeft)
      maxX = AxisMapping.pxToDataX(w, relRight)

      minY =
        w.globals.yAxisScale[0].niceMin +
        (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0]
      maxY =
        w.globals.yAxisScale[0].niceMax -
        (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0]
    } else {
      // rangeBars use y for datetime
      minX =
        w.globals.yAxisScale[0].niceMin + relLeft * xyRatios.invertedYRatio
      maxX =
        w.globals.yAxisScale[0].niceMin + relRight * xyRatios.invertedYRatio

      minY = 0
      maxY = 1
    }

    const xyAxis = {
      xaxis: { min: minX, max: maxX },
      yaxis: { min: minY, max: maxY },
    }
    if (typeof w.config.chart.events.selection === 'function') {
      w.config.chart.events.selection(this.ctx, xyAxis)
    }

    if (
      w.config.chart.brush.enabled &&
      w.config.chart.events.brushScrolled !== undefined
    ) {
      w.config.chart.events.brushScrolled(this.ctx, xyAxis)
    }

    // Linked Views (#4): re-crossfilter live as the persistent selection rect is
    // dragged or resized.
    this.ctx.linkedViews?.onSourceSelection(xyAxis.xaxis)
  }

  /** @param {{context: any, zoomtype: any}} opts */
  selectionDrawn({ context, zoomtype }) {
    const w = this.w
    const me = context
    const xyRatios = this.xyRatios
    const toolbar = this.ctx.toolbar

    // Use boundingRect for final selection area
    const selRect = w.interact.zoomEnabled
      ? me.zoomRect.node.getBoundingClientRect()
      : me.selectionRect.node.getBoundingClientRect()
    const gridRectDim = me._gridRect()
    if (!gridRectDim) return

    // Local coords: x in the plot-origin space (shared with bar placement via
    // AxisMapping), y still relative to the grid box top (no vertical padding).
    const localStartX = this._screenXToPlotPx(selRect.left)
    const localEndX = this._screenXToPlotPx(selRect.right)
    const localStartY = selRect.top - gridRectDim.top
    const localEndY = selRect.bottom - gridRectDim.top

    // Convert those local coords to actual data values
    let xLowestValue, xHighestValue

    if (!w.axisFlags.isRangeBar) {
      xLowestValue = AxisMapping.pxToDataX(w, localStartX)
      xHighestValue = AxisMapping.pxToDataX(w, localEndX)
    } else {
      xLowestValue =
        w.globals.yAxisScale[0].niceMin + localStartX * xyRatios.invertedYRatio
      xHighestValue =
        w.globals.yAxisScale[0].niceMin + localEndX * xyRatios.invertedYRatio
    }

    // For Y values, pick from the first y-axis, but handle multi-axis
    /** @type {any[]} */
    const yHighestValue = []
    /** @type {any[]} */
    const yLowestValue = []

    /**
     * @param {ApexYAxis} yaxe
     * @param {number} index
     */
    w.config.yaxis.forEach((yaxe, index) => {
      // pick whichever series is mapped to this y-axis
      const seriesIndex = w.globals.seriesYAxisMap[index][0]
      const highestVal =
        w.globals.yAxisScale[index].niceMax -
        xyRatios.yRatio[seriesIndex] * localStartY
      const lowestVal =
        w.globals.yAxisScale[index].niceMax -
        xyRatios.yRatio[seriesIndex] * localEndY

      yHighestValue.push(highestVal)
      yLowestValue.push(lowestVal)
    })

    // Only apply if user actually dragged far enough to consider it a selection
    if (
      me.dragged &&
      (me.dragX > 10 || me.dragY > 10) &&
      xLowestValue !== xHighestValue
    ) {
      if (w.interact.zoomEnabled) {
        if (!w.globals.initialConfig) return
        let yaxis = Utils.clone(w.globals.initialConfig.yaxis)
        let xaxis = Utils.clone(w.globals.initialConfig.xaxis)

        w.interact.zoomed = true

        if (w.config.xaxis.convertedCatToNumeric) {
          xLowestValue = Math.floor(xLowestValue)
          xHighestValue = Math.floor(xHighestValue)

          if (xLowestValue < 1) {
            xLowestValue = 1
            xHighestValue = w.globals.dataPoints
          }

          if (xHighestValue - xLowestValue < 2) {
            xHighestValue = xLowestValue + 1
          }
        }

        if (zoomtype === 'xy' || zoomtype === 'x') {
          xaxis = {
            min: xLowestValue,
            max: xHighestValue,
          }
        }

        if (zoomtype === 'xy' || zoomtype === 'y') {
          /**
           * @param {ApexYAxis} yaxe
           * @param {number} index
           */
          yaxis.forEach((/** @type {any} */ yaxe, /** @type {any} */ index) => {
            yaxis[index].min = yLowestValue[index]
            yaxis[index].max = yHighestValue[index]
          })
        }

        if (toolbar) {
          const beforeZoomRange = toolbar.getBeforeZoomRange(xaxis, yaxis)
          if (beforeZoomRange) {
            xaxis = beforeZoomRange.xaxis ? beforeZoomRange.xaxis : xaxis
            yaxis = beforeZoomRange.yaxis ? beforeZoomRange.yaxis : yaxis
          }
        }

        /** @type {{ xaxis: any; yaxis?: any }} */
        const options = {
          xaxis,
        }

        if (!w.config.chart.group) {
          // if chart in a group, prevent yaxis update here
          // fix issue #650
          options.yaxis = yaxis
        }
        me.ctx.updateHelpers._updateOptions(
          options,
          false,
          me.w.config.chart.animations.dynamicAnimation.enabled,
        )

        if (typeof w.config.chart.events.zoomed === 'function') {
          toolbar.zoomCallback(xaxis, yaxis)
        }
      } else if (w.interact.selectionEnabled) {
        /** @type {any} */
        let yaxis = null
        let xaxis = null
        xaxis = {
          min: xLowestValue,
          max: xHighestValue,
        }
        if (zoomtype === 'xy' || zoomtype === 'y') {
          const yaxisCopy = /** @type {ApexYAxis[]} */ (
            Utils.clone(w.config.yaxis)
          )
          yaxis = yaxisCopy
          yaxisCopy.forEach((yaxe, index) => {
            yaxisCopy[index].min = yLowestValue[index]
            yaxisCopy[index].max = yHighestValue[index]
          })
        }

        w.interact.selection = me.selection
        if (typeof w.config.chart.events.selection === 'function') {
          w.config.chart.events.selection(me.ctx, {
            xaxis,
            yaxis,
          })
        }
        // Linked Views (#4): feed the brushed data-x range to the crossfilter
        // coordinator, which dims out-of-range marks across the group. Null-safe
        // no-op unless the `link` feature is bundled and chart.link.enabled.
        me.ctx.linkedViews?.onSourceSelection(xaxis)
      }
    }
  }

  /** @param {{ context?: any, zoomtype?: any, xyRatios?: any }} opts */
  panDragging({ context }) {
    const w = this.w
    const me = context

    // check to make sure there is data to compare against
    if (typeof w.interact.lastClientPosition.x !== 'undefined') {
      // get the change from last position to this position
      const deltaX = w.interact.lastClientPosition.x - me.clientX
      const deltaY = (w.interact.lastClientPosition.y ?? 0) - me.clientY

      // check which direction had the highest amplitude
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        this.moveDirection = 'left'
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
        this.moveDirection = 'right'
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
        this.moveDirection = 'up'
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
        this.moveDirection = 'down'
      }
    }

    // set the new last position to the current for next time (to get the position of drag)
    w.interact.lastClientPosition = {
      x: me.clientX,
      y: me.clientY,
    }

    const xLowestValue = w.axisFlags.isRangeBar
      ? w.globals.minY
      : w.globals.minX

    const xHighestValue = w.axisFlags.isRangeBar
      ? w.globals.maxY
      : w.globals.maxX

    // removed delayedPanScrolled as it doesn't seem to cause bugs anymore in convertedCatToNumeric
    // if (!w.config.xaxis.convertedCatToNumeric) {
    me.panScrolled(xLowestValue, xHighestValue)
    // }
  }

  // delayedPanScrolled() {
  //   const w = this.w

  //   let newMinX = w.globals.minX
  //   let newMaxX = w.globals.maxX
  //   const centerX = (w.globals.maxX - w.globals.minX) / 2

  //   if (this.moveDirection === 'left') {
  //     newMinX = w.globals.minX + centerX
  //     newMaxX = w.globals.maxX + centerX
  //   } else if (this.moveDirection === 'right') {
  //     newMinX = w.globals.minX - centerX
  //     newMaxX = w.globals.maxX - centerX
  //   }

  //   newMinX = Math.floor(newMinX)
  //   newMaxX = Math.floor(newMaxX)
  //   this.updateScrolledChart(
  //     { xaxis: { min: newMinX, max: newMaxX } },
  //     newMinX,
  //     newMaxX
  //   )
  // }

  /**
   * @param {number} xLowestValue
   * @param {number} xHighestValue
   */
  panScrolled(xLowestValue, xHighestValue) {
    const w = this.w

    const xyRatios = this.xyRatios
    if (!w.globals.initialConfig) return
    const yaxis = Utils.clone(w.globals.initialConfig.yaxis)

    let xRatio = xyRatios.xRatio
    let minX = w.globals.minX
    let maxX = w.globals.maxX
    if (w.axisFlags.isRangeBar) {
      xRatio = xyRatios.invertedYRatio
      minX = w.globals.minY
      maxX = w.globals.maxY
    }

    if (this.moveDirection === 'left') {
      xLowestValue = minX + (w.layout.gridWidth / 15) * xRatio
      xHighestValue = maxX + (w.layout.gridWidth / 15) * xRatio
    } else if (this.moveDirection === 'right') {
      xLowestValue = minX - (w.layout.gridWidth / 15) * xRatio
      xHighestValue = maxX - (w.layout.gridWidth / 15) * xRatio
    }

    if (!w.axisFlags.isRangeBar) {
      const clampMin = w.globals.dataReducerRawMinX ?? w.globals.initialMinX
      const clampMax = w.globals.dataReducerRawMaxX ?? w.globals.initialMaxX
      if (xLowestValue < clampMin || xHighestValue > clampMax) {
        xLowestValue = minX
        xHighestValue = maxX
      }
    }

    const xaxis = {
      min: xLowestValue,
      max: xHighestValue,
    }

    /** @type {{ xaxis: any; yaxis?: any }} */
    const options = {
      xaxis,
    }

    if (!w.config.chart.group) {
      // if chart in a group, prevent yaxis update here
      // fix issue #650
      options.yaxis = yaxis
    }

    this.updateScrolledChart(options, xLowestValue, xHighestValue)
  }

  /**
   * @param {object} options
   * @param {number} xLowestValue
   * @param {number} xHighestValue
   */
  updateScrolledChart(options, xLowestValue, xHighestValue) {
    const w = this.w

    this.ctx.updateHelpers._updateOptions(options, false, false)

    if (typeof w.config.chart.events.scrolled === 'function') {
      const args = {
        xaxis: {
          min: xLowestValue,
          max: xHighestValue,
        },
      }
      w.config.chart.events.scrolled(this.ctx, args)
      this.ctx.events.fireEvent('scrolled', args)
    }
  }

  // ---------------------------------------------------------------------------
  // Momentum: multi-touch pinch-zoom, two-finger pan and kinetic inertia.
  //
  // Every _updateOptions destroys and recreates this instance, and applying a
  // gesture frame IS an _updateOptions, so the gesture must not depend on the
  // instance surviving. All runtime state lives on w.interact.momentum (the
  // interaction slice that persists across re-renders, like the crude pan's
  // lastClientPosition). The instance that received touchstart keeps driving
  // the gesture off the persistent state; inertia is a self-contained rAF loop
  // that stops on w.globals.isDestroyed (a real destroy) rather than being
  // cancelled by the per-update destroy().
  // ---------------------------------------------------------------------------

  _momentumEnabled() {
    return this._pinchEnabled() || this._panInertiaEnabled()
  }

  _pinchEnabled() {
    const c = this.w.config.chart
    return !!(c.zoom && c.zoom.enabled && c.zoom.pinch)
  }

  _panInertiaEnabled() {
    const c = this.w.config.chart
    return !!(c.pan && c.pan.inertia)
  }

  /** Lazily-created, re-render-surviving gesture state on the interaction slice. */
  _m() {
    const it = this.w.interact
    if (!it.momentum) {
      it.momentum = {
        busy: false,
        /** @type {any} */ pinch: null,
        /** @type {any} */ panState: null,
        /** @type {{x:number,t:number}[]} */ samples: [],
        /** @type {number|null} */ inertiaRAF: null,
      }
    }
    return it.momentum
  }

  /** Current x data-window (rangeBars carry the datetime domain on y). */
  _currentXWindow() {
    const w = this.w
    return w.axisFlags.isRangeBar
      ? { min: w.globals.minY, max: w.globals.maxY }
      : { min: w.globals.minX, max: w.globals.maxX }
  }

  /** Live grid rect from the current DOM. Never cache the grid node on the
   * instance: a full render replaces this whole instance, but the fast update
   * path (fastUpdate/_fastAxisChromeRefresh) keeps the instance while swapping
   * the grid node, and a cached node would go stale (detached nodes report an
   * all-zero bounding rect, silently corrupting selection geometry). */
  _gridRect() {
    const baseEl = this.w.dom.baseEl
    const grid = baseEl && baseEl.querySelector('.apexcharts-grid')
    return grid ? grid.getBoundingClientRect() : null
  }

  /**
   * Convert an absolute (client) x pixel to the plot-origin coordinate space
   * that bar placement and the selection rect transform both use:
   * `screenX - svgLeft - translateX`. This is the ONLY correct reference for the
   * numeric/datetime x mapping (see AxisMapping): do NOT measure from the
   * `.apexcharts-grid` box and subtract barPadForNumericAxis, because on a
   * numeric bar chart that box extends barPad to the LEFT of the plot origin, so
   * the two corrections are a fragile pair that only cancels while the grid box
   * happens to extend exactly barPad. Anchoring on translateX (the same origin
   * the bars use) is stable regardless of grid padding.
   * @param {number} screenX
   * @returns {number}
   */
  _screenXToPlotPx(screenX) {
    const baseEl = this.w.dom.baseEl
    const svg = baseEl && baseEl.querySelector('.apexcharts-svg')
    const svgLeft = svg ? svg.getBoundingClientRect().left : 0
    return screenX - svgLeft - this.w.layout.translateX
  }

  /**
   * Raw data bounds to clamp against. When zoom-aware downsampling is active,
   * the raw stash tracks the full domain; fall back to the initial window.
   * Returns null for rangeBars (no raw-x clamp available).
   * @returns {{min:number, max:number}|null}
   */
  _clampBounds() {
    const w = this.w
    if (w.axisFlags.isRangeBar) return null
    return {
      min: w.globals.dataReducerRawMinX ?? w.globals.initialMinX,
      max: w.globals.dataReducerRawMaxX ?? w.globals.initialMaxX,
    }
  }

  /**
   * Apply an x-window immediately (no animation), mirroring panScrolled but
   * pixel-accurate: clamp to the raw bounds (preserving window width so a pan
   * stops flush at the edge rather than shrinking), floor for category axes,
   * then route through the fast _updateOptions path.
   * @param {number} newMinX @param {number} newMaxX @param {boolean} isZoom
   * @returns {{minX:number, maxX:number}|false} applied window, or false if rejected
   */
  _applyXRange(newMinX, newMaxX, isZoom) {
    const w = this.w
    if (!w.globals.initialConfig) return false

    const bounds = this._clampBounds()
    if (bounds) {
      const range = newMaxX - newMinX
      if (newMinX < bounds.min) {
        newMinX = bounds.min
        newMaxX = newMinX + range
      }
      if (newMaxX > bounds.max) {
        newMaxX = bounds.max
        newMinX = newMaxX - range
      }
      // range wider than the full domain: clamp both edges (pinch-out floor)
      if (newMinX < bounds.min) newMinX = bounds.min
    }

    if (w.config.xaxis.convertedCatToNumeric) {
      newMinX = Math.floor(newMinX)
      newMaxX = Math.floor(newMaxX)
      if (newMinX < 1) newMinX = 1
      if (newMaxX - newMinX < 2) return false
    }

    if (!(newMaxX > newMinX)) return false

    /** @type {{ xaxis: any; yaxis?: any }} */
    const options = { xaxis: { min: newMinX, max: newMaxX } }
    if (!w.config.chart.group) {
      options.yaxis = Utils.clone(w.globals.initialConfig.yaxis)
    }
    if (isZoom) w.interact.zoomed = true

    this.ctx.updateHelpers._updateOptions(options, false, false)
    return { minX: newMinX, maxX: newMaxX }
  }

  _cancelInertia() {
    const m = this._m()
    if (m.inertiaRAF != null) {
      cancelAnimationFrame(m.inertiaRAF)
      m.inertiaRAF = null
    }
  }

  _fireScrolled() {
    const w = this.w
    if (typeof w.config.chart.events.scrolled !== 'function') return
    const { min, max } = this._currentXWindow()
    const args = { xaxis: { min, max } }
    w.config.chart.events.scrolled(this.ctx, args)
    this.ctx.events.fireEvent('scrolled', args)
  }

  /** @param {number} x @param {number} t */
  _pushSample(x, t) {
    const s = this._m().samples
    s.push({ x, t })
    // keep a short trailing window for a stable release velocity
    while (s.length > 6) s.shift()
  }

  /**
   * Single passive:false handler for all touch phases. Two fingers => pinch /
   * two-finger pan (zoom). One finger, in pan mode => kinetic pan with inertia.
   * @param {any} e
   */
  momentumTouch(e) {
    const w = this.w
    const m = this._m()
    const type = e.type

    if (type === 'touchstart') {
      this._cancelInertia()
      const gridRectDim = this._gridRect()
      if (!gridRectDim) return

      if (e.touches.length >= 2 && this._pinchEnabled()) {
        e.preventDefault()
        m.busy = true
        m.panState = null
        this._beginPinch(e, gridRectDim)
      } else if (
        e.touches.length === 1 &&
        this._panInertiaEnabled() &&
        w.interact.panEnabled
      ) {
        m.busy = true
        m.pinch = null
        const t = e.touches[0]
        const win = this._currentXWindow()
        const gw = w.layout.gridWidth || 1
        m.panState = {
          startX: t.clientX,
          startY: t.clientY,
          axis: null, // decided on first move (rails)
          minX0: win.min,
          maxX0: win.max,
          ratio0: (win.max - win.min) / gw,
        }
        m.samples = [{ x: t.clientX, t: e.timeStamp }]
      }
      return
    }

    if (type === 'touchmove') {
      if (m.pinch && e.touches.length >= 2) {
        e.preventDefault()
        this._movePinch(e)
      } else if (m.panState && e.touches.length === 1) {
        this._movePan(e)
      }
      return
    }

    // touchend / touchcancel
    if (m.pinch) {
      if (e.touches.length < 2) this._endPinch()
    } else if (m.panState) {
      if (e.touches.length === 0) this._endPan()
    }
    if (e.touches.length === 0) {
      // a passive-path touchstart may have flagged mousedown before momentum
      // took over; clear it (and only release busy if inertia is not running).
      w.interact.mousedown = false
      this.dragged = false
      if (m.inertiaRAF == null && !m.pinch && !m.panState) {
        m.busy = false
      }
    }
  }

  /** @param {any} e @param {DOMRect} gridRectDim */
  _beginPinch(e, gridRectDim) {
    const w = this.w
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    const dist =
      Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1
    const cx =
      (t0.clientX + t1.clientX) / 2 -
      gridRectDim.left -
      w.globals.barPadForNumericAxis
    const { min, max } = this._currentXWindow()
    this._m().pinch = {
      d0: dist,
      cx0: cx,
      minX0: min,
      maxX0: max,
      gridWidth: w.layout.gridWidth || 1,
    }
  }

  /** @param {any} e */
  _movePinch(e) {
    const w = this.w
    const p = this._m().pinch
    if (!p) return
    const gridRectDim = this._gridRect()
    if (!gridRectDim) return

    const t0 = e.touches[0]
    const t1 = e.touches[1]
    const dist =
      Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1
    const cx =
      (t0.clientX + t1.clientX) / 2 -
      gridRectDim.left -
      w.globals.barPadForNumericAxis

    const range0 = p.maxX0 - p.minX0
    // fingers spread => dist > d0 => scale < 1 => window shrinks (zoom in)
    const newRange = range0 * (p.d0 / dist)

    // keep the data value under the pinch centroid pinned to the current
    // centroid, which folds two-finger pan into the same transform
    const anchorData = p.minX0 + (p.cx0 / p.gridWidth) * range0
    let newMinX = anchorData - (cx / p.gridWidth) * newRange
    let newMaxX = newMinX + newRange

    // floor the zoom-in window at ~2 point-spacings (same reasoning as wheel
    // zoom) so it never collapses to a zero-width / NaN range
    const bounds = this._clampBounds()
    if (bounds) {
      const minXDiff =
        w.globals.minXDiff > 0 && isFinite(w.globals.minXDiff)
          ? w.globals.minXDiff
          : 0
      const minRange = Math.max(minXDiff * 2, (bounds.max - bounds.min) * 1e-6)
      if (newMaxX - newMinX < minRange) {
        const mid = (newMinX + newMaxX) / 2
        newMinX = mid - minRange / 2
        newMaxX = mid + minRange / 2
      }
    }

    this._applyXRange(newMinX, newMaxX, true)
  }

  _endPinch() {
    const w = this.w
    const m = this._m()
    m.pinch = null
    const { min, max } = this._currentXWindow()
    const xaxis = { min, max }
    const yaxis = w.globals.initialConfig
      ? Utils.clone(w.globals.initialConfig.yaxis)
      : []
    const toolbar = this.ctx.toolbar
    if (toolbar) toolbar.zoomCallback(xaxis, yaxis)
  }

  /** @param {any} e */
  _movePan(e) {
    const m = this._m()
    const s = m.panState
    const t = e.touches[0]

    // rails: lock to the dominant axis once past a small threshold. Chart x-pan
    // only exists on the x-axis, so a vertical-dominant drag is a page scroll:
    // release the gesture and let the browser scroll.
    if (!s.axis) {
      const dx = Math.abs(t.clientX - s.startX)
      const dy = Math.abs(t.clientY - s.startY)
      if (dx < 6 && dy < 6) {
        this._pushSample(t.clientX, e.timeStamp)
        return
      }
      if (dy > dx) {
        m.busy = false
        m.panState = null
        return
      }
      s.axis = 'x'
    }
    if (s.axis !== 'x') return

    // horizontal pan owns the gesture: stop the page from scrolling sideways
    e.preventDefault()

    const totalDeltaPx = t.clientX - s.startX
    const deltaData = totalDeltaPx * s.ratio0
    // finger drags right (deltaPx > 0) => reveal earlier data => window shifts left
    this._pushSample(t.clientX, e.timeStamp)
    this._applyXRange(s.minX0 - deltaData, s.maxX0 - deltaData, false)
  }

  _endPan() {
    const m = this._m()
    const s = m.panState
    m.panState = null

    // release velocity (px/ms) from the trailing samples
    let vel = 0
    const samples = m.samples
    if (samples.length >= 2) {
      const a = samples[0]
      const b = samples[samples.length - 1]
      const dt = b.t - a.t
      if (dt > 0) vel = (b.x - a.x) / dt
    }
    m.samples = []

    if (
      s &&
      s.axis === 'x' &&
      this._panInertiaEnabled() &&
      Math.abs(vel) > 0.05
    ) {
      this._startInertia(vel)
    } else {
      m.busy = false
      this._fireScrolled()
    }
  }

  /**
   * Kinetic glide after a one-finger pan release: decay the velocity by
   * `friction` each frame and shift the window, stopping at the data edge
   * (clamp, not elastic overshoot). The loop is w-driven, so it keeps running
   * across the re-renders each frame triggers and stops only on a real destroy.
   * @param {number} vel0 px/ms, sign is the finger direction
   */
  _startInertia(vel0) {
    const w = this.w
    const m = this._m()
    const cfgFriction = w.config.chart.pan && w.config.chart.pan.friction
    const friction =
      typeof cfgFriction === 'number'
        ? Math.min(Math.max(cfgFriction, 0.5), 0.999)
        : 0.92

    let vel = vel0
    /** @type {number|null} */ let lastT = null
    m.busy = true

    /** @param {number} ts */
    const step = (ts) => {
      if (w.globals.isDestroyed) {
        m.inertiaRAF = null
        m.busy = false
        return
      }
      if (lastT == null) {
        lastT = ts
        m.inertiaRAF = requestAnimationFrame(step)
        return
      }
      const dt = ts - lastT
      lastT = ts

      // decay normalized to a 60fps frame so the glide feels the same regardless
      // of the actual refresh rate
      vel *= Math.pow(friction, dt / 16.6667)
      if (Math.abs(vel) < 0.02) {
        m.inertiaRAF = null
        m.busy = false
        this._fireScrolled()
        return
      }

      const win = this._currentXWindow()
      const gw = w.layout.gridWidth || 1
      const ratio = (win.max - win.min) / gw
      const deltaData = vel * dt * ratio
      const applied = this._applyXRange(
        win.min - deltaData,
        win.max - deltaData,
        false,
      )

      const bounds = this._clampBounds()
      const hitEdge =
        !applied ||
        (bounds &&
          ((deltaData > 0 &&
            applied.minX <= bounds.min + (bounds.max - bounds.min) * 1e-6) ||
            (deltaData < 0 &&
              applied.maxX >= bounds.max - (bounds.max - bounds.min) * 1e-6)))
      if (hitEdge) {
        m.inertiaRAF = null
        m.busy = false
        this._fireScrolled()
        return
      }

      m.inertiaRAF = requestAnimationFrame(step)
    }
    m.inertiaRAF = requestAnimationFrame(step)
  }
}
