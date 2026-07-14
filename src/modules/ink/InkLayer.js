// @ts-check
/**
 * Ink Layer (#7) P1: direct-manipulation drag for point annotations.
 *
 * Point annotations are declarative (`chart.annotations.points`). This eager,
 * opt-in feature lets the user drag one directly: the marker + label move under
 * the pointer, and on release the new position is inverted back to data space,
 * written to `w.config.annotations.points[i].x/y`, and the annotation is
 * re-drawn at its new anchor (so it stays glued on later zoom/filter/resize).
 *
 * Opt in per annotation with `annotations.points[].draggable: true`, or globally
 * with `chart.ink.enabled: true` (every point annotation becomes draggable
 * unless it sets `draggable: false`). Fires `annotationDragged`.
 *
 * P1 covers numeric/datetime x + linear (non-log) y on a non-inverted axis; a
 * category x-axis keeps its x and drags y only. Text editing, click-to-create,
 * resize, and Rewind integration are later phases.
 *
 * Drag mechanics: the marker is a path and the elements are not wrapped per
 * annotation, so this uses its own pointer handler (not SVGElement.draggable,
 * which moves via x/y attributes). During the drag the annotation's elements
 * (found by the annotation's `id` class) get a live `transform: translate`; on
 * release the pixel delta is inverted to data and the annotation is re-drawn via
 * the annotation module (a targeted redraw, no full chart re-render).
 *
 * @module modules/ink/InkLayer
 */

const DRAG_CLASS = 'apexcharts-ink-draggable'

export default class InkLayer {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    this._wired = false
    /** @type {any} */
    this._drag = null
    /** @type {any} */
    this._editor = null
    this._attach = this._attach.bind(this)
    this._onMove = this._onMove.bind(this)
    this._onUp = this._onUp.bind(this)

    if (this._enabledGlobally() || this._hasDraggable()) this._wire()
  }

  _enabledGlobally() {
    const ink = this.w.config.chart.ink
    return !!(ink && ink.enabled)
  }

  /** @returns {any[]} the configured point annotations */
  _points() {
    const a = this.w.config.annotations
    return a && Array.isArray(a.points) ? a.points : []
  }

  /** @param {any} anno */
  _isDraggable(anno) {
    if (!anno) return false
    if (anno.draggable === true) return true
    if (anno.draggable === false) return false
    return this._enabledGlobally()
  }

  _hasDraggable() {
    return this._points().some((p) => this._isDraggable(p))
  }

  _wire() {
    if (this._wired) return
    this._wired = true
    // Listeners survive update(); the DOM is rebound after each (re)render.
    this.ctx.addEventListener('mounted', this._attach)
    this.ctx.addEventListener('updated', this._attach)
  }

  /**
   * After each (re)render, bind a drag handler to every draggable point
   * annotation's elements. Idempotent: a per-node flag prevents double-binding
   * when a targeted redraw re-runs this without a full re-render.
   */
  _attach() {
    const w = this.w
    const baseEl = w.dom.baseEl
    if (!baseEl) return
    this._points().forEach((anno, index) => {
      if (!this._isDraggable(anno)) return
      if (!anno.id) {
        anno.id = 'apexcharts-ink-' + index + '-' + w.globals.chartID
      }
      baseEl.querySelectorAll('.' + anno.id).forEach((/** @type {any} */ el) => {
        if (el.__inkBound) return
        el.__inkBound = true
        el.style.cursor = 'move'
        el.classList.add(DRAG_CLASS)
        el.addEventListener('mousedown', (/** @type {any} */ e) =>
          this._onDown(e, index),
        )
        el.addEventListener('touchstart', (/** @type {any} */ e) =>
          this._onDown(e, index),
        )
        // P2: double-click to edit the label text inline.
        el.addEventListener('dblclick', (/** @type {any} */ e) => {
          e.preventDefault()
          e.stopPropagation()
          this._startEdit(index)
        })
      })
    })
  }

  /**
   * @param {any} e @param {number} index
   */
  _onDown(e, index) {
    if (e.button && e.button !== 0) return
    const w = this.w
    const doc = w.dom.baseEl && w.dom.baseEl.ownerDocument
    if (!doc) return
    // Stop ZoomPanSelection from treating this as a new rubber-band selection.
    e.stopPropagation()
    if (e.cancelable) e.preventDefault()

    const isTouch = e.type === 'touchstart'
    const ev = isTouch ? e.touches[0] : e
    const svgRoot = w.dom.Paper && w.dom.Paper.node
    const ctm = svgRoot && svgRoot.getScreenCTM ? svgRoot.getScreenCTM() : null

    this._drag = {
      index,
      anno: this._points()[index],
      els: Array.from(w.dom.baseEl.querySelectorAll('.' + this._points()[index].id)),
      startX: ev.clientX,
      startY: ev.clientY,
      scaleX: ctm && ctm.a ? ctm.a : 1,
      scaleY: ctm && ctm.d ? ctm.d : 1,
      dxPixel: 0,
      dyPixel: 0,
      moved: false,
    }

    doc.addEventListener('mousemove', this._onMove)
    doc.addEventListener('touchmove', this._onMove, { passive: false })
    doc.addEventListener('mouseup', this._onUp)
    doc.addEventListener('touchend', this._onUp)
  }

  /** @param {any} me */
  _onMove(me) {
    const d = this._drag
    if (!d) return
    if (me.cancelable) me.preventDefault()
    const mev = me.type === 'touchmove' ? me.touches[0] : me
    d.dxPixel = (mev.clientX - d.startX) / d.scaleX
    d.dyPixel = (mev.clientY - d.startY) / d.scaleY
    if (d.dxPixel || d.dyPixel) d.moved = true
    const t = `translate(${d.dxPixel} ${d.dyPixel})`
    d.els.forEach((/** @type {any} */ el) => el.setAttribute('transform', t))
  }

  _onUp() {
    const d = this._drag
    this._drag = null
    this._teardownDocListeners()
    if (!d || !d.moved) {
      // A plain click (no movement): clear any residual transform.
      if (d) d.els.forEach((/** @type {any} */ el) => el.removeAttribute('transform'))
      return
    }

    const w = this.w
    const anno = w.config.annotations.points[d.index]
    if (!anno) return

    const { newX, newY } = this._invert(anno, d.dxPixel, d.dyPixel)
    anno.x = newX
    if (newY != null) anno.y = newY

    this._redrawAnno(anno, d.index)
    this._fireDragged(anno, d.index)
  }

  /**
   * Targeted redraw of one point annotation: drop its elements and re-add the
   * marker + label + label background at the current config x/y (no full chart
   * re-render, and repeat-safe unlike updateOptions({}), which early-returns on
   * a repeat empty call).
   * @param {any} anno @param {number} index
   */
  _redrawAnno(anno, index) {
    const w = this.w
    const baseEl = w.dom.baseEl
    if (!baseEl) return
    baseEl.querySelectorAll('.' + anno.id).forEach((/** @type {any} */ el) => el.remove())
    const group = baseEl.querySelector('.apexcharts-point-annotations')
    const annotations = this.ctx.annotations
    if (group && annotations && annotations.pointsAnnotations) {
      annotations.pointsAnnotations.addPointAnnotation(anno, group, index)
      // The label background is drawn by annotationsBackground() (after the main
      // draw), not by addPointAnnotation, so re-add just this label's bg rect.
      const labelEl = baseEl.querySelector(
        '.apexcharts-point-annotation-label.' + anno.id,
      )
      if (labelEl && annotations.helpers && anno.label && anno.label.text) {
        const elRect = annotations.helpers.addBackgroundToAnno(labelEl, anno)
        if (elRect && labelEl.parentNode) {
          labelEl.parentNode.insertBefore(elRect.node, labelEl)
        }
      }
    }
    this._attach() // bind the freshly drawn elements (idempotent for the rest)
  }

  /**
   * Invert a pixel drag delta to a data-space position for this annotation.
   * Numeric/datetime x + linear y (non-inverted). Category x keeps its x.
   * @param {any} anno @param {number} dxPixel @param {number} dyPixel
   * @returns {{newX:any, newY:any}}
   */
  _invert(anno, dxPixel, dyPixel) {
    const w = this.w
    const categoryX =
      (w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric) &&
      !w.axisFlags.dataFormatXNumeric

    let newX = anno.x
    if (!categoryX && typeof anno.x === 'number' && w.layout.gridWidth) {
      newX = anno.x + dxPixel * (w.globals.xRange / w.layout.gridWidth)
    }

    let newY = anno.y
    const yi = anno.yAxisIndex || 0
    const map = w.globals.seriesYAxisMap
    const si = map && map[yi] ? map[yi][0] : 0
    const yRange = w.globals.yRange ? w.globals.yRange[si] : null
    const logY = w.config.yaxis[yi] && w.config.yaxis[yi].logarithmic
    if (typeof anno.y === 'number' && yRange != null && !logY && w.layout.gridHeight) {
      newY = anno.y - dyPixel * (yRange / w.layout.gridHeight)
    }

    return { newX, newY }
  }

  // ─── P2: inline label editing ────────────────────────────────────────────

  /**
   * Open an inline text editor over a point annotation's label (an absolutely
   * positioned input in the chart wrap). Commit on Enter/blur, cancel on Escape.
   * @param {number} index
   */
  _startEdit(index) {
    const w = this.w
    const anno = this._points()[index]
    const baseEl = w.dom.baseEl
    const elWrap = w.dom.elWrap
    if (!anno || !anno.id || !baseEl || !elWrap) return

    const anchor =
      baseEl.querySelector('.apexcharts-point-annotation-label.' + anno.id) ||
      baseEl.querySelector('.' + anno.id)
    if (!anchor) return

    this._removeEditor()

    const doc = baseEl.ownerDocument
    const wrapRect = elWrap.getBoundingClientRect()
    const aRect = anchor.getBoundingClientRect()
    const input = doc.createElement('input')
    input.type = 'text'
    input.value = (anno.label && anno.label.text) || ''
    input.className = 'apexcharts-ink-editor'
    const s = input.style
    s.position = 'absolute'
    s.left = Math.round(aRect.left - wrapRect.left) + 'px'
    s.top = Math.round(aRect.top - wrapRect.top) + 'px'
    s.zIndex = '20'
    s.font = (anno.label?.style?.fontSize || '12px') + ' sans-serif'
    s.padding = '2px 4px'
    s.border = '1px solid #6366f1'
    s.borderRadius = '3px'
    s.minWidth = '60px'
    elWrap.appendChild(input)
    input.focus()
    input.select()

    this._editor = { input, index }
    input.addEventListener('keydown', (/** @type {any} */ e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this._commitEdit()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        this._removeEditor()
      }
    })
    input.addEventListener('blur', () => this._commitEdit())
  }

  _commitEdit() {
    const ed = this._editor
    if (!ed) return
    this._editor = null // guard the re-entrant blur that removing the input fires
    const text = ed.input.value
    const index = ed.index
    if (ed.input.parentNode) ed.input.parentNode.removeChild(ed.input)

    const anno = this.w.config.annotations.points[index]
    if (!anno) return
    if (!anno.label) anno.label = {}
    if (anno.label.text === text) return
    anno.label.text = text
    this._redrawAnno(anno, index)
    this._fireEdited(anno, index)
  }

  _removeEditor() {
    const ed = this._editor
    if (!ed) return
    this._editor = null
    if (ed.input.parentNode) ed.input.parentNode.removeChild(ed.input)
  }

  /** @param {any} anno @param {number} index */
  _fireEdited(anno, index) {
    const args = { id: anno.id, index, text: anno.label ? anno.label.text : '' }
    const events = this.w.config.chart.events
    if (typeof events.annotationEdited === 'function') {
      events.annotationEdited(this.ctx, args)
    }
    this.ctx.events?.fireEvent('annotationEdited', [this.ctx, args])
  }

  /** @param {any} anno @param {number} index */
  _fireDragged(anno, index) {
    const args = { id: anno.id, index, x: anno.x, y: anno.y }
    const events = this.w.config.chart.events
    if (typeof events.annotationDragged === 'function') {
      events.annotationDragged(this.ctx, args)
    }
    this.ctx.events?.fireEvent('annotationDragged', [this.ctx, args])
  }

  _teardownDocListeners() {
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument
    if (!doc) return
    doc.removeEventListener('mousemove', this._onMove)
    doc.removeEventListener('touchmove', this._onMove)
    doc.removeEventListener('mouseup', this._onUp)
    doc.removeEventListener('touchend', this._onUp)
  }

  teardown() {
    this._teardownDocListeners()
    this._removeEditor()
    this._drag = null
    if (this._wired) {
      this.ctx.removeEventListener?.('mounted', this._attach)
      this.ctx.removeEventListener?.('updated', this._attach)
      this._wired = false
    }
  }
}
