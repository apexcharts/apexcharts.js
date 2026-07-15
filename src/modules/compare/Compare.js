// @ts-check
import Graphics from '../Graphics'

/**
 * Overlay Compare (#18) - P1: the measure / delta ruler.
 *
 * Eager, opt-in module (`ctx.overlayCompare`, requires the `overlayCompare`
 * feature). Enabled via `chart.measure.enabled`. Hold the measure key (default
 * 'm') and drag A->B on the plot, or call chart.startMeasure(), to draw a live
 * ruler that reads dx / dy / %change / slope in data space. On release (when
 * `pinOnRelease`) the ruler is pinned as a data-anchored overlay that
 * re-projects on zoom / pan / resize, and a `measured` event fires.
 *
 * Gesture isolation: while armed, a transparent "glass pane" rect is laid over
 * the plot so ZoomPanSelection's passive svg listeners never see the drag; the
 * pane is removed when disarmed, so zoom/pan/hover are untouched otherwise.
 *
 * Pixel<->data uses the grid client rect fraction (scale-independent) x the
 * axis ranges, so it is axis-type-agnostic and round-trips: a point captured at
 * fraction f re-projects to f*gridWidth. The pinned rulers live on the instance
 * (eager module, not recreated on update) and are redrawn on 'mounted'/
 * 'updated' from their stored data coordinates.
 *
 * (P2 - period-over-period ghosting - lands separately under `chart.compare`.)
 */
export default class Compare {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    this.graphics = new Graphics(w)

    /** @type {Array<{xa:number,ya:number,xb:number,yb:number}>} pinned rulers in data space */
    this.pins = []
    /** live drag state, or null */
    this.drag = null
    this.armed = false
    this.persistent = false
    /** @type {any} the glass-pane capture rect element */
    this.pane = null

    this._onKeyDown = this._onKeyDown.bind(this)
    this._onKeyUp = this._onKeyUp.bind(this)
    this._onDown = this._onDown.bind(this)
    this._onMove = this._onMove.bind(this)
    this._onUp = this._onUp.bind(this)
    this._afterRender = this._afterRender.bind(this)

    ctx.addEventListener('mounted', this._afterRender)
    ctx.addEventListener('updated', this._afterRender)
    this._bindKeys()
  }

  _cfg() {
    return this.w.config.chart.measure || {}
  }

  _enabled() {
    return this.w.globals.axisCharts && this._cfg().enabled === true
  }

  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument
  }

  /** Bind the measure-key listeners once on the owner document. */
  _bindKeys() {
    if (this._keysBound) return
    const doc = this._doc()
    if (!doc) return
    doc.addEventListener('keydown', this._onKeyDown)
    doc.addEventListener('keyup', this._onKeyUp)
    this._keysBound = true
  }

  /** @param {any} e */
  _onKeyDown(e) {
    if (!this._enabled() || this.persistent) return
    const key = this._cfg().key || 'm'
    if (e.key && e.key.toLowerCase() === String(key).toLowerCase()) {
      this._arm()
    } else if (e.key === 'Escape') {
      this._cancelDrag()
    }
  }

  /** @param {any} e */
  _onKeyUp(e) {
    if (this.persistent) return
    const key = this._cfg().key || 'm'
    if (e.key && e.key.toLowerCase() === String(key).toLowerCase()) {
      if (!this.drag) this._disarm()
    }
  }

  /** Public: arm a sticky measure mode (survives key release) until stopped. */
  startMeasure() {
    if (!this._enabled()) return
    this.persistent = true
    this._arm()
  }

  /** Public: leave measure mode. */
  stopMeasure() {
    this.persistent = false
    this._cancelDrag()
    this._disarm()
  }

  /** Public: remove all pinned rulers. */
  clearMeasures() {
    this.pins = []
    this._renderPins()
  }

  /** Lay the transparent capture pane over the plot so our pointer handlers own
   *  the drag (ZoomPanSelection never sees it). */
  _arm() {
    if (this.armed || !this._enabled()) return
    const w = this.w
    const parent = w.dom.elGraphical
    if (!parent) return
    this.armed = true
    const pane = this.graphics.drawRect(0, 0, w.layout.gridWidth, w.layout.gridHeight)
    pane.node.setAttribute('class', 'apexcharts-measure-capture')
    pane.node.setAttribute('fill', 'transparent')
    pane.node.style.cursor = 'crosshair'
    pane.node.style.pointerEvents = 'all'
    pane.node.addEventListener('mousedown', this._onDown)
    pane.node.addEventListener('touchstart', this._onDown, { passive: false })
    parent.add(pane)
    this.pane = pane
  }

  _disarm() {
    this.armed = false
    if (this.pane) {
      this.pane.node.removeEventListener('mousedown', this._onDown)
      this.pane.node.removeEventListener('touchstart', this._onDown)
      const p = this.pane.node
      if (p.parentNode) p.parentNode.removeChild(p)
      this.pane = null
    }
  }

  /** @param {any} e @returns {{cx:number,cy:number}} */
  _clientXY(e) {
    const t = e.touches && e.touches[0] ? e.touches[0] : e
    return { cx: t.clientX, cy: t.clientY }
  }

  _gridRect() {
    const g = this.w.dom.baseEl.querySelector('.apexcharts-grid')
    return g ? g.getBoundingClientRect() : null
  }

  /** [min,max] for the primary y-axis, preferring the rendered nice scale. */
  _yRange() {
    const g = this.w.globals
    const s = g.yAxisScale && g.yAxisScale[0]
    if (
      s &&
      isFinite(s.niceMin) &&
      isFinite(s.niceMax) &&
      s.niceMax !== s.niceMin
    ) {
      return [s.niceMin, s.niceMax]
    }
    return [g.minY, g.maxY]
  }

  /**
   * Client pixel -> { x, y (data), gx, gy (grid-local SVG units) }.
   * @param {number} cx @param {number} cy
   */
  _project(cx, cy) {
    const w = this.w
    const rect = this._gridRect()
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const clamp = (/** @type {number} */ v) => (v < 0 ? 0 : v > 1 ? 1 : v)
    const fx = rect ? clamp((cx - rect.left) / rect.width) : 0
    const fy = rect ? clamp((cy - rect.top) / rect.height) : 0
    const [ymin, ymax] = this._yRange()
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX)
    const y = ymax - fy * (ymax - ymin)
    return { x, y, gx: fx * gw, gy: fy * gh }
  }

  /**
   * Data (x,y) -> grid-local SVG coords, for redrawing pinned rulers.
   * @param {number} x @param {number} y
   */
  _dataToGrid(x, y) {
    const w = this.w
    const gw = w.layout.gridWidth
    const gh = w.layout.gridHeight
    const xr = w.globals.maxX - w.globals.minX || 1
    const [ymin, ymax] = this._yRange()
    const yr = ymax - ymin || 1
    return {
      gx: ((x - w.globals.minX) / xr) * gw,
      gy: gh - ((y - ymin) / yr) * gh,
    }
  }

  /** @param {any} e */
  _onDown(e) {
    if (!this.armed) return
    e.preventDefault()
    e.stopPropagation()
    const { cx, cy } = this._clientXY(e)
    const a = this._project(cx, cy)
    this.drag = { a, b: a }
    const doc = this._doc()
    if (doc) {
      doc.addEventListener('mousemove', this._onMove)
      doc.addEventListener('mouseup', this._onUp)
      doc.addEventListener('touchmove', this._onMove, { passive: false })
      doc.addEventListener('touchend', this._onUp)
    }
    this._renderLive()
  }

  /** @param {any} e */
  _onMove(e) {
    if (!this.drag) return
    if (e.cancelable) e.preventDefault()
    const { cx, cy } = this._clientXY(e)
    this.drag.b = this._project(cx, cy)
    this._renderLive()
  }

  /** @param {any} _e */
  _onUp(_e) {
    const doc = this._doc()
    if (doc) {
      doc.removeEventListener('mousemove', this._onMove)
      doc.removeEventListener('mouseup', this._onUp)
      doc.removeEventListener('touchmove', this._onMove)
      doc.removeEventListener('touchend', this._onUp)
    }
    if (!this.drag) return
    const { a, b } = this.drag
    this.drag = null
    this._clearLive()
    // ignore a zero-length click
    if (Math.abs(a.gx - b.gx) < 2 && Math.abs(a.gy - b.gy) < 2) {
      if (!this.persistent) this._disarm()
      return
    }
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a.x, ya: a.y, xb: b.x, yb: b.y })
      this._renderPins()
    }
    this._fireMeasured(a, b)
    if (!this.persistent) this._disarm()
  }

  _cancelDrag() {
    const doc = this._doc()
    if (doc) {
      doc.removeEventListener('mousemove', this._onMove)
      doc.removeEventListener('mouseup', this._onUp)
      doc.removeEventListener('touchmove', this._onMove)
      doc.removeEventListener('touchend', this._onUp)
    }
    this.drag = null
    this._clearLive()
  }

  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @returns {{dx:number,dy:number,pct:number,slope:number}}
   */
  _stats(a, b) {
    const dx = b.x - a.x
    const dy = b.y - a.y
    return {
      dx,
      dy,
      pct: a.y !== 0 ? (dy / Math.abs(a.y)) * 100 : NaN,
      slope: dx !== 0 ? dy / dx : NaN,
    }
  }

  /** @param {number} v */
  _fmt(v) {
    if (!isFinite(v)) return 'n/a'
    const a = Math.abs(v)
    if (a !== 0 && (a < 0.01 || a >= 1e6)) return v.toExponential(2)
    return String(Math.round(v * 100) / 100)
  }

  /**
   * Format an x delta, treating datetime x as a day count.
   * @param {number} dx
   */
  _fmtDx(dx) {
    if (this.w.config.xaxis.type === 'datetime') {
      const days = dx / 86400000
      return (Math.round(days * 10) / 10) + 'd'
    }
    return this._fmt(dx)
  }

  /** The live overlay group, created lazily inside elGraphical. */
  _liveGroup() {
    const w = this.w
    if (this._live && this._live.node && this._live.node.parentNode) {
      return this._live
    }
    const g = this.graphics.group({ class: 'apexcharts-measure-live' })
    g.node.style.pointerEvents = 'none'
    if (w.dom.elGraphical) w.dom.elGraphical.add(g)
    this._live = g
    return g
  }

  _clearLive() {
    if (this._live && this._live.node) {
      const n = this._live.node
      if (n.parentNode) n.parentNode.removeChild(n)
    }
    this._live = null
  }

  _renderLive() {
    if (!this.drag) return
    const g = this._liveGroup()
    // wipe children
    while (g.node.firstChild) g.node.removeChild(g.node.firstChild)
    this._drawRuler(g, this.drag.a, this.drag.b)
  }

  /** Redraw all pinned rulers into a fresh group (called after each render). */
  _renderPins() {
    const w = this.w
    // remove any existing pinned group
    const old = w.dom.baseEl && w.dom.baseEl.querySelector('.apexcharts-measure-pins')
    if (old && old.parentNode) old.parentNode.removeChild(old)
    if (!this.pins.length || !w.dom.elGraphical) return
    const g = this.graphics.group({ class: 'apexcharts-measure-pins' })
    g.node.style.pointerEvents = 'none'
    w.dom.elGraphical.add(g)
    this.pins.forEach((p) => {
      const a = { ...this._dataToGrid(p.xa, p.ya), x: p.xa, y: p.ya }
      const b = { ...this._dataToGrid(p.xb, p.yb), x: p.xb, y: p.yb }
      this._drawRuler(g, a, b, true)
    })
  }

  /**
   * Draw one ruler (line + endpoints + label) into `g`.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {boolean} [pinned]
   */
  _drawRuler(g, a, b, pinned) {
    const st = this._stats(a, b)
    const up = st.dy > 0
    const flat = st.dy === 0
    const color = flat ? '#64748b' : up ? '#16a34a' : '#dc2626'

    const line = this.graphics.drawLine(a.gx, a.gy, b.gx, b.gy, color, 0, 2)
    line.node.setAttribute('class', 'apexcharts-measure-line')
    g.add(line)

    ;[a, b].forEach((p) => {
      const dot = this.graphics.drawMarker(p.gx, p.gy, {
        pSize: 4,
        shape: 'circle',
        pointFillColor: color,
        pointFillOpacity: 1,
        pointStrokeColor: '#fff',
        pointStrokeWidth: 2,
        pointStrokeOpacity: 1,
      })
      g.add(dot)
    })

    const pctText = isFinite(st.pct)
      ? (st.pct >= 0 ? '+' : '') + this._fmt(st.pct) + '%'
      : 'n/a'
    const lines = [
      'Δx ' + this._fmtDx(st.dx),
      'Δy ' + this._fmt(st.dy),
      pctText,
    ]
    const mx = (a.gx + b.gx) / 2
    const my = (a.gy + b.gy) / 2
    const boxW = 78
    const boxH = 46
    let bx = mx + 8
    let by = my - boxH / 2
    // keep the label inside the grid
    bx = Math.max(2, Math.min(bx, this.w.layout.gridWidth - boxW - 2))
    by = Math.max(2, Math.min(by, this.w.layout.gridHeight - boxH - 2))

    const box = this.graphics.drawRect(bx, by, boxW, boxH, 3)
    box.node.setAttribute('class', 'apexcharts-measure-label-bg')
    box.attr({
      fill: '#ffffff',
      'fill-opacity': 0.95,
      stroke: color,
      'stroke-width': 1,
    })
    g.add(box)

    const label = this.graphics.drawText({
      x: bx + 8,
      y: by + 16,
      text: lines,
      textAnchor: 'start',
      fontSize: '11px',
      foreColor: '#1e293b',
      cssClass: 'apexcharts-measure-label',
    })
    g.add(label)

    if (pinned) g.node.classList.add('apexcharts-measure-pinned')
  }

  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   */
  _fireMeasured(a, b) {
    const st = this._stats(a, b)
    const payload = {
      from: { x: a.x, y: a.y },
      to: { x: b.x, y: b.y },
      dx: st.dx,
      dy: st.dy,
      percentChange: st.pct,
      slope: st.slope,
    }
    const fn = this.w.config.chart.events.measured
    if (typeof fn === 'function') fn(this.ctx, payload)
    this.ctx.events.fireEvent('measured', [this.ctx, payload])
  }

  /** Re-project pinned rulers into the freshly-rendered DOM. */
  _afterRender() {
    if (!this._enabled()) return
    // the armed pane and live overlay are per-gesture; only pins persist.
    if (this.pins.length) this._renderPins()
    // re-arm the pane if we were in sticky mode across a re-render
    if (this.persistent && !this.pane) this._arm()
  }

  teardown() {
    this._cancelDrag()
    this._disarm()
    const doc = this._doc()
    if (doc && this._keysBound) {
      doc.removeEventListener('keydown', this._onKeyDown)
      doc.removeEventListener('keyup', this._onKeyUp)
    }
    this._keysBound = false
    this.pins = []
  }
}
