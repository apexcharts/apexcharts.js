// @ts-check
import Utils from '../../utils/Utils'
import Options from '../settings/Options'

/**
 * Ink Layer (#7): direct-manipulation annotation authoring.
 *
 * Turns declarative annotations into point-and-drag editing. Opt in per
 * annotation with `<annotation>.draggable: true`, or globally with
 * `chart.ink.enabled: true` (every annotation becomes draggable unless it sets
 * `draggable: false`). Tree-shakeable `ink` feature; eager module (`ctx.ink`)
 * that rebinds handlers after each (re)render.
 *
 * Capabilities:
 *  - P1 drag point annotations (marker + label move together).
 *  - P2 double-click a label to edit its text inline.
 *  - P3 click-to-create: `chart.ink.palette` / `ctx.ink.startCreate()` arms
 *    create mode; the next plot click drops an editable, draggable note.
 *  - P4 drag xaxis/yaxis annotations (a line moves along its axis; a range moves
 *    both edges) and resize an xaxis range by dragging its left/right edge.
 *
 * Mechanics: annotation elements are paths/lines/rects appended un-grouped to
 * their `.apexcharts-<type>-annotations` group and share the annotation's `id`
 * CSS class, so Ink uses its own pointer handler (found by `.<id>`) rather than
 * SVGElement.draggable (which moves via x/y attributes). During a drag the
 * elements get a live `transform` (move) or the rect is stretched (resize); on
 * release the pixel delta is inverted to data, written to the annotation's
 * config slot, and the annotation is re-drawn at its new anchor via a targeted
 * redraw (no full re-render, and repeat-safe unlike updateOptions({})).
 *
 * P4 covers numeric/datetime x + linear (non-log) y on a non-inverted axis; a
 * category x keeps its x. Editing works for every annotation type.
 *
 * @module modules/ink/InkLayer
 */

const DRAG_CLASS = 'apexcharts-ink-draggable'
const TYPES = ['point', 'xaxis', 'yaxis']
const EDGE_PX = 8

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
    this._creating = false
    this._createSeq = 0
    this._attach = this._attach.bind(this)
    this._onMove = this._onMove.bind(this)
    this._onUp = this._onUp.bind(this)
    this._onCreateClick = this._onCreateClick.bind(this)

    if (
      this._enabledGlobally() ||
      this._hasDraggable() ||
      this._paletteEnabled()
    ) {
      this._wire()
    }
  }

  _enabledGlobally() {
    const ink = this.w.config.chart.ink
    return !!(ink && ink.enabled)
  }

  _paletteEnabled() {
    const ink = this.w.config.chart.ink
    return !!(ink && ink.palette)
  }

  /** @param {string} type @returns {any[]} the config annotations of a type */
  _annoList(type) {
    const a = this.w.config.annotations
    if (!a) return []
    const key = type === 'point' ? 'points' : type
    return Array.isArray(a[key]) ? a[key] : []
  }

  /** @param {any} anno */
  _isDraggable(anno) {
    if (!anno) return false
    if (anno.draggable === true) return true
    if (anno.draggable === false) return false
    return this._enabledGlobally()
  }

  _hasDraggable() {
    return TYPES.some((t) => this._annoList(t).some((p) => this._isDraggable(p)))
  }

  _wire() {
    if (this._wired) return
    this._wired = true
    // Listeners survive update(); the DOM is rebound after each (re)render.
    this.ctx.addEventListener('mounted', this._attach)
    this.ctx.addEventListener('updated', this._attach)
  }

  /**
   * After each (re)render, bind drag + edit handlers to every draggable
   * annotation's elements. Idempotent via a per-node flag so a targeted redraw
   * re-runs this without double-binding the untouched annotations.
   */
  _attach() {
    const w = this.w
    const baseEl = w.dom.baseEl
    if (!baseEl) return
    TYPES.forEach((type) => {
      this._annoList(type).forEach((anno, index) => {
        if (!this._isDraggable(anno)) return
        if (!anno.id) {
          anno.id = 'apexcharts-ink-' + type + '-' + index + '-' + w.globals.chartID
        }
        baseEl.querySelectorAll('.' + anno.id).forEach((/** @type {any} */ el) => {
          if (el.__inkBound) return
          el.__inkBound = true
          el.style.cursor = 'move'
          el.classList.add(DRAG_CLASS)
          el.addEventListener('mousedown', (/** @type {any} */ e) =>
            this._onDown(e, type, index),
          )
          el.addEventListener('touchstart', (/** @type {any} */ e) =>
            this._onDown(e, type, index),
          )
          el.addEventListener('dblclick', (/** @type {any} */ e) => {
            e.preventDefault()
            e.stopPropagation()
            this._startEdit(type, index)
          })
        })
      })
    })
    if (this._paletteEnabled()) this._renderPalette()
  }

  // ─── drag / resize ────────────────────────────────────────────────────────

  /**
   * @param {any} e @param {string} type @param {number} index
   */
  _onDown(e, type, index) {
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
    const anno = this._annoList(type)[index]

    // Mode: an xaxis range grabbed near an edge resizes; everything else moves.
    let mode = 'move'
    /** @type {any} */
    let rect = null
    let origX = 0
    let origW = 0
    if (type === 'xaxis' && anno.x2 != null) {
      rect = w.dom.baseEl.querySelector('.apexcharts-annotation-rect.' + anno.id)
      if (rect) {
        const r = rect.getBoundingClientRect()
        if (Math.abs(ev.clientX - r.left) <= EDGE_PX) mode = 'resize-x1'
        else if (Math.abs(ev.clientX - r.right) <= EDGE_PX) mode = 'resize-x2'
        origX = parseFloat(rect.getAttribute('x')) || 0
        origW = parseFloat(rect.getAttribute('width')) || 0
      }
    }

    this._drag = {
      type,
      index,
      anno,
      els: Array.from(w.dom.baseEl.querySelectorAll('.' + anno.id)),
      mode,
      rect,
      origX,
      origW,
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

    if (d.mode === 'move') {
      const t = `translate(${d.dxPixel} ${d.dyPixel})`
      d.els.forEach((/** @type {any} */ el) => el.setAttribute('transform', t))
    } else if (d.rect) {
      if (d.mode === 'resize-x1') {
        d.rect.setAttribute('x', d.origX + d.dxPixel)
        d.rect.setAttribute('width', Math.max(1, d.origW - d.dxPixel))
      } else if (d.mode === 'resize-x2') {
        d.rect.setAttribute('width', Math.max(1, d.origW + d.dxPixel))
      }
    }
  }

  _onUp() {
    const d = this._drag
    this._drag = null
    this._teardownDocListeners()
    if (!d || !d.moved) {
      if (d) d.els.forEach((/** @type {any} */ el) => el.removeAttribute('transform'))
      return
    }
    const anno = this._annoList(d.type)[d.index]
    if (!anno) return

    this._applyDelta(d, anno)
    d.els.forEach((/** @type {any} */ el) => el.removeAttribute('transform'))
    this._redrawAnno(d.type, anno, d.index)
    this._fireDragged(d.type, anno, d.index)
  }

  /**
   * Mutate the annotation's config from the pixel drag delta (type + mode aware).
   * @param {any} d @param {any} anno
   */
  _applyDelta(d, anno) {
    const w = this.w
    const dxData = w.layout.gridWidth
      ? d.dxPixel * (w.globals.xRange / w.layout.gridWidth)
      : 0

    if (d.type === 'point') {
      const { newX, newY } = this._invertPoint(anno, d.dxPixel, d.dyPixel)
      anno.x = newX
      if (newY != null) anno.y = newY
      return
    }

    if (d.type === 'xaxis') {
      if (typeof anno.x !== 'number') return // category/string x: leave as-is
      if (d.mode === 'move') {
        anno.x += dxData
        if (typeof anno.x2 === 'number') anno.x2 += dxData
      } else {
        // resize: the left edge is the smaller value, the right edge the larger
        const xIsLeft = anno.x2 == null || anno.x <= anno.x2
        const grow = d.mode === 'resize-x2' ? !xIsLeft : xIsLeft
        // grow === true -> adjust anno.x, else adjust anno.x2
        if (grow) anno.x += dxData
        else if (typeof anno.x2 === 'number') anno.x2 += dxData
      }
      return
    }

    if (d.type === 'yaxis') {
      const yi = anno.yAxisIndex || 0
      const map = w.globals.seriesYAxisMap
      const si = map && map[yi] ? map[yi][0] : 0
      const yRange = w.globals.yRange ? w.globals.yRange[si] : null
      if (yRange == null || !w.layout.gridHeight) return
      const dyData = -d.dyPixel * (yRange / w.layout.gridHeight)
      if (typeof anno.y === 'number') anno.y += dyData
      if (typeof anno.y2 === 'number') anno.y2 += dyData
    }
  }

  /**
   * Invert a pixel drag delta to a point annotation's data x/y.
   * @param {any} anno @param {number} dxPixel @param {number} dyPixel
   * @returns {{newX:any, newY:any}}
   */
  _invertPoint(anno, dxPixel, dyPixel) {
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

  /**
   * Targeted redraw of one annotation: drop its elements and re-add the shape +
   * label + label background at the current config coordinates (no full chart
   * re-render, and repeat-safe unlike updateOptions({})).
   * @param {string} type @param {any} anno @param {number} index
   */
  _redrawAnno(type, anno, index) {
    const w = this.w
    const baseEl = w.dom.baseEl
    const annotations = this.ctx.annotations
    if (!baseEl || !annotations) return
    baseEl.querySelectorAll('.' + anno.id).forEach((/** @type {any} */ el) => el.remove())
    const group = baseEl.querySelector('.apexcharts-' + type + '-annotations')
    if (!group) return

    if (type === 'point' && annotations.pointsAnnotations) {
      annotations.pointsAnnotations.addPointAnnotation(anno, group, index)
    } else if (type === 'xaxis' && annotations.xAxisAnnotations) {
      annotations.xAxisAnnotations.addXaxisAnnotation(anno, group, index)
    } else if (type === 'yaxis' && annotations.yAxisAnnotations) {
      annotations.yAxisAnnotations.addYaxisAnnotation(anno, group, index)
    }

    // The label background is drawn by annotationsBackground() (after the main
    // draw), not by the per-annotation add, so re-add just this label's bg.
    const labelEl = baseEl.querySelector(
      '.apexcharts-' + type + '-annotation-label.' + anno.id,
    )
    if (labelEl && annotations.helpers && anno.label && anno.label.text) {
      const elRect = annotations.helpers.addBackgroundToAnno(labelEl, anno)
      if (elRect && labelEl.parentNode) {
        labelEl.parentNode.insertBefore(elRect.node, labelEl)
      }
    }
    this._attach() // bind the freshly drawn elements (idempotent for the rest)
  }

  /** @param {string} type @param {any} anno @param {number} index */
  _fireDragged(type, anno, index) {
    /** @type {any} */
    const args = { type, id: anno.id, index, x: anno.x, y: anno.y }
    if (anno.x2 != null) args.x2 = anno.x2
    if (anno.y2 != null) args.y2 = anno.y2
    const events = this.w.config.chart.events
    if (typeof events.annotationDragged === 'function') {
      events.annotationDragged(this.ctx, args)
    }
    this.ctx.events?.fireEvent('annotationDragged', [this.ctx, args])
  }

  // ─── P3: click-to-create ─────────────────────────────────────────────────

  /**
   * Enter create mode: the next click on the plot area drops a new draggable
   * point annotation there and opens its label editor.
   */
  startCreate() {
    if (this._creating) return
    const svg = this.w.dom.Paper && this.w.dom.Paper.node
    if (!svg) return
    this._creating = true
    svg.style.cursor = 'crosshair'
    svg.addEventListener('click', this._onCreateClick, true)
    this._syncPalette()
  }

  /** Leave create mode. */
  stopCreate() {
    if (!this._creating) return
    this._creating = false
    const svg = this.w.dom.Paper && this.w.dom.Paper.node
    if (svg) {
      svg.style.cursor = ''
      svg.removeEventListener('click', this._onCreateClick, true)
    }
    this._syncPalette()
  }

  /** @param {any} e */
  _onCreateClick(e) {
    if (!this._creating) return
    e.preventDefault()
    e.stopPropagation()
    const pos = this._pixelToData(e.clientX, e.clientY)
    this.stopCreate()
    if (!pos) return

    const w = this.w
    this._createSeq += 1
    const id = 'apexcharts-ink-new-' + this._createSeq + '-' + w.globals.chartID
    const anno = Utils.extend(new Options().pointAnnotation, {
      x: pos.x,
      y: pos.y,
      id,
      draggable: true,
      label: { text: 'Note' },
    })

    if (!w.config.annotations) w.config.annotations = {}
    if (!Array.isArray(w.config.annotations.points)) w.config.annotations.points = []
    w.config.annotations.points.push(anno)
    const index = w.config.annotations.points.length - 1

    this._redrawAnno('point', anno, index)
    this._fireCreated(anno, index)
    this._startEdit('point', index)
  }

  /**
   * Convert a client-space point to data coordinates (absolute, for create).
   * @param {number} clientX @param {number} clientY
   * @returns {{x:any, y:any}|null}
   */
  _pixelToData(clientX, clientY) {
    const w = this.w
    const gridEl = w.dom.baseEl && w.dom.baseEl.querySelector('.apexcharts-grid')
    if (!gridEl) return null
    const g = gridEl.getBoundingClientRect()
    if (!g.width || !g.height) return null
    const fx = (clientX - g.left) / g.width
    const fy = (clientY - g.top) / g.height

    const minX = w.globals.minX
    const xRange = w.globals.xRange
    const minY =
      w.globals.minYArr && w.globals.minYArr[0] != null
        ? w.globals.minYArr[0]
        : w.globals.minY
    const yRange =
      w.globals.yRange && w.globals.yRange[0] != null
        ? w.globals.yRange[0]
        : w.globals.maxY - w.globals.minY

    let x = minX + fx * xRange
    const y = minY + (1 - fy) * yRange
    const categoryX =
      (w.config.xaxis.type === 'category' ||
        w.config.xaxis.convertedCatToNumeric) &&
      !w.axisFlags.dataFormatXNumeric
    if (categoryX) x = Math.round(x)
    return { x, y }
  }

  /** @param {any} anno @param {number} index */
  _fireCreated(anno, index) {
    const args = { id: anno.id, index, x: anno.x, y: anno.y }
    const events = this.w.config.chart.events
    if (typeof events.annotationCreated === 'function') {
      events.annotationCreated(this.ctx, args)
    }
    this.ctx.events?.fireEvent('annotationCreated', [this.ctx, args])
  }

  // ─── P3: tool palette ────────────────────────────────────────────────────

  /** Render a minimal "add note" toggle into the chart wrap (once per render). */
  _renderPalette() {
    const w = this.w
    const elWrap = w.dom.elWrap
    if (!elWrap || elWrap.querySelector('.apexcharts-ink-palette')) return
    const doc = elWrap.ownerDocument
    const bar = doc.createElement('div')
    bar.className = 'apexcharts-ink-palette'
    const s = bar.style
    s.position = 'absolute'
    s.top = '6px'
    s.left = '6px'
    s.zIndex = '15'
    const btn = doc.createElement('button')
    btn.type = 'button'
    btn.className = 'apexcharts-ink-add'
    btn.textContent = '+ Note'
    const bs = btn.style
    bs.cursor = 'pointer'
    bs.font = '12px sans-serif'
    bs.padding = '4px 9px'
    bs.borderRadius = '5px'
    bs.border = '1px solid #6366f1'
    bs.color = '#4338ca'
    bs.background = '#fff'
    btn.addEventListener('click', (/** @type {any} */ e) => {
      e.stopPropagation()
      if (this._creating) this.stopCreate()
      else this.startCreate()
    })
    bar.appendChild(btn)
    elWrap.appendChild(bar)
    this._syncPalette()
  }

  /** Reflect create-mode state on the palette button. */
  _syncPalette() {
    const elWrap = this.w.dom.elWrap
    const btn = /** @type {any} */ (
      elWrap && elWrap.querySelector('.apexcharts-ink-add')
    )
    if (!btn) return
    if (this._creating) {
      btn.style.background = '#6366f1'
      btn.style.color = '#fff'
      btn.textContent = 'Click chart...'
    } else {
      btn.style.background = '#fff'
      btn.style.color = '#4338ca'
      btn.textContent = '+ Note'
    }
  }

  // ─── P2: inline label editing ────────────────────────────────────────────

  /**
   * Open an inline text editor over an annotation's label (an absolutely
   * positioned input in the chart wrap). Commit on Enter/blur, cancel on Escape.
   * @param {string} type @param {number} index
   */
  _startEdit(type, index) {
    const w = this.w
    const anno = this._annoList(type)[index]
    const baseEl = w.dom.baseEl
    const elWrap = w.dom.elWrap
    if (!anno || !anno.id || !baseEl || !elWrap) return

    const anchor =
      baseEl.querySelector('.apexcharts-' + type + '-annotation-label.' + anno.id) ||
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

    this._editor = { input, type, index }
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
    if (ed.input.parentNode) ed.input.parentNode.removeChild(ed.input)

    const anno = this._annoList(ed.type)[ed.index]
    if (!anno) return
    if (!anno.label) anno.label = {}
    if (anno.label.text === text) return
    anno.label.text = text
    this._redrawAnno(ed.type, anno, ed.index)
    this._fireEdited(ed.type, anno, ed.index)
  }

  _removeEditor() {
    const ed = this._editor
    if (!ed) return
    this._editor = null
    if (ed.input.parentNode) ed.input.parentNode.removeChild(ed.input)
  }

  /** @param {string} type @param {any} anno @param {number} index */
  _fireEdited(type, anno, index) {
    const args = { type, id: anno.id, index, text: anno.label ? anno.label.text : '' }
    const events = this.w.config.chart.events
    if (typeof events.annotationEdited === 'function') {
      events.annotationEdited(this.ctx, args)
    }
    this.ctx.events?.fireEvent('annotationEdited', [this.ctx, args])
  }

  // ─── lifecycle ────────────────────────────────────────────────────────────

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
    this.stopCreate()
    this._drag = null
    if (this._wired) {
      this.ctx.removeEventListener?.('mounted', this._attach)
      this.ctx.removeEventListener?.('updated', this._attach)
      this._wired = false
    }
  }
}
