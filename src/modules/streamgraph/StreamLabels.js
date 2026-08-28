// @ts-check
/**
 * Streamgraph chrome: the band labels, and the outline that answers the cursor.
 *
 * Both are things a range area has no element for, so neither can be expressed
 * as configuration on one.
 *
 * A streamgraph has no y-axis and its bands drift, so a reader who has only a
 * legend has to carry six colours in their head and match them back to six
 * moving shapes. Writing the name on the band removes that job. Each label goes
 * where its own band is thickest, not at a fixed x: that is the only place
 * guaranteed to have room for it, and it is the part of the band the reader is
 * most likely to be looking at.
 *
 * The hover outline is the surface's only acknowledgement of the cursor, and it
 * is drawn INSET (the stroke is clipped to the band's own shape) for a reason
 * particular to this form. The bands touch edge to edge, so there is no gap for
 * a treatment to live in: a drop shadow has nowhere to fall except onto the two
 * neighbours, where it reads as dirt rather than lift, and a centred stroke
 * would spend half its width painting over the band above. Clipping the stroke
 * to the band means the only pixels that change belong to the band the cursor
 * is on.
 *
 * Dimming the other bands would isolate harder, but that is the LEGEND's
 * gesture (`legend.onItemHover` already drops the rest to 0.2), and it is a
 * deliberate act rather than something that should fire five times a second as
 * the cursor sweeps across the plot.
 *
 * @module modules/streamgraph/StreamLabels
 */
import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
import AxisMapping from '../AxisMapping'
import { Environment } from '../../utils/Environment.js'

/** Breathing room above and below the text inside the band, in px. */
const VPAD = 3

export default class StreamLabels {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** The band the outline is currently on, or -1. @type {number} */
    this._hovered = -1
  }

  /** @returns {boolean} */
  isActive() {
    return this.w.config.chart.requestedType === 'streamgraph'
  }

  /**
   * Data value -> pixel, the same mapping the line renderer uses
   * (`Line._initSerieVariables`: `zeroY - v / yRatio`, with baseLineY placing
   * the zero line). Written out in terms of the domain rather than read off
   * `xyRatios` so the layer stays independent of the renderer's internals.
   *
   * @param {number} v
   * @returns {number}
   */
  _yPx(v) {
    const w = this.w
    const gl = w.globals
    const h = w.layout.gridHeight
    const span = gl.maxY - gl.minY
    if (!span || !isFinite(span)) return h / 2
    const frac = (v - gl.minY) / span
    return w.config.yaxis[0]?.reversed ? frac * h : h - frac * h
  }

  /**
   * Draw (or redraw) everything this layer owns.
   *
   * Called from both render paths and safe to call on a chart that is not a
   * streamgraph, has labels switched off, or drew no bands.
   */
  draw() {
    if (!this.isActive()) return
    // The bands were just redrawn, so any outline still on screen is tracing a
    // shape that has moved.
    this.removeOutline()
    this._hovered = -1
    this.bindHover()
    this.drawLabels()
  }

  /**
   * Draw (or redraw) the band labels.
   *
   * Called from both render paths and safe to call on a chart that is not a
   * streamgraph, has labels switched off, or drew no bands.
   */
  drawLabels() {
    const w = this.w
    if (!this.isActive()) return

    const cfg = w.config.plotOptions?.streamgraph?.labels
    if (!cfg || cfg.show === false) return

    const host = w.dom.elGraphical
    const data = w.streamgraphData
    if (!host || !data) return

    // The fast update path redraws the series into the existing graphical
    // group, so a stale layer would accumulate one copy per update.
    this.removeLabels()

    const graphics = new Graphics(w, this.ctx)
    const group = graphics.group({ class: 'apexcharts-streamgraph-labels' })

    const fontSize = cfg.style?.fontSize || '12px'
    const fontFamily = cfg.style?.fontFamily || w.config.chart.fontFamily
    const fontWeight = cfg.style?.fontWeight || 600
    const minWidth = cfg.minWidth == null ? 24 : cfg.minWidth

    let drawn = 0
    for (let i = 0; i < data.order.length; i++) {
      const k = data.order[i]
      const label = this._placeLabel(k, {
        fontSize,
        fontFamily,
        fontWeight,
        minWidth,
        graphics,
      })
      if (!label) continue

      const el = graphics.drawText({
        x: label.x,
        y: label.y,
        text: label.text,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fontSize,
        fontFamily,
        fontWeight,
        foreColor: cfg.style?.colors?.[k] || label.color,
        cssClass: 'apexcharts-streamgraph-label',
      })
      el.node.setAttribute('data:realIndex', String(k))
      group.add(el)
      drawn++
    }

    if (!drawn) return

    // Above the bands, below the axis chrome. On a full render the axes do not
    // exist yet and appending is already correct; the fast update path redraws
    // series into a tree that has them, so there the layer has to be slotted in
    // rather than appended on top of the axis line and ticks.
    const xaxisEl = host.node.querySelector('.apexcharts-xaxis')
    if (xaxisEl) {
      host.node.insertBefore(group.node, xaxisEl)
    } else {
      host.add(group)
    }

    this.holdUntilBandsLand(group)
  }

  /**
   * Where band `k`'s name goes, or null if it has nowhere to go.
   *
   * The anchor is the widest stretch of the band, found by taking its thickest
   * column and walking outward for as long as the band still clears the line
   * box. That stretch is what the text is centred in and truncated to, so a
   * name only appears where it actually fits inside the shape it names.
   *
   * @param {number} k
   * @param {{fontSize: string, fontFamily: string, fontWeight: any, minWidth: number, graphics: any}} opts
   * @returns {{x: number, y: number, text: string, color: string}|null}
   */
  _placeLabel(k, { fontSize, fontFamily, fontWeight, minWidth, graphics }) {
    const w = this.w
    const data = w.streamgraphData
    const lo = data.lows[k]
    const hi = data.highs[k]
    if (!lo || !hi) return null

    // x comes from the pixels the renderer committed, so the label sits on the
    // band wherever the axis put it (category slot, numeric, datetime) without
    // this layer having to re-derive any of that.
    const xPx = w.globals.seriesXvalues[k]
    const m = lo.length
    if (!Array.isArray(xPx) || xPx.length < m || m === 0) return null

    /** @type {number[]} */
    const thickness = new Array(m)
    let peak = -1
    let peakT = 0
    for (let j = 0; j < m; j++) {
      const t = Math.abs(this._yPx(hi[j]) - this._yPx(lo[j]))
      thickness[j] = t
      if (t > peakT) {
        peakT = t
        peak = j
      }
    }
    if (peak === -1) return null

    // Measured with the weight it will RENDER at: getTextRects measures at
    // 'regular' unless told otherwise, and bold text measured that way comes up
    // short enough to overflow the band it was fitted to.
    const name = String(data.names[k])
    const rect = graphics.getTextRects(
      name,
      fontSize,
      fontFamily,
      '',
      true,
      fontWeight,
    )
    const needed = rect.height + VPAD * 2
    if (peakT < needed) return null

    let left = peak
    let right = peak
    while (left > 0 && thickness[left - 1] >= needed) left--
    while (right < m - 1 && thickness[right + 1] >= needed) right++

    const xLeft = Number(xPx[left])
    const xRight = Number(xPx[right])
    if (!isFinite(xLeft) || !isFinite(xRight)) return null

    // A single qualifying column has no span of its own, so fall back to the
    // gap to its neighbours rather than reporting a zero-width slot.
    let available = xRight - xLeft
    if (available <= 0 && m > 1) {
      const step = Math.abs(
        Number(xPx[Math.min(peak + 1, m - 1)]) -
          Number(xPx[Math.max(peak - 1, 0)]),
      )
      available = isFinite(step) ? step : 0
    }
    if (available < minWidth || available < rect.width * 0.35) return null

    const text =
      rect.width <= available
        ? name
        : graphics.getTextBasedOnMaxWidth({
            text: name,
            maxWidth: available,
            fontSize,
            fontFamily,
          })
    if (!text || text === '...') return null

    const cx = (xLeft + xRight) / 2
    // Centre the label vertically on the band AT the column it sits over, not
    // at the peak: on a wide stretch those are different rows, and a label
    // centred on the peak drifts off a band that is sloping away from it.
    let anchor = peak
    let bestDx = Infinity
    for (let j = left; j <= right; j++) {
      const dx = Math.abs(Number(xPx[j]) - cx)
      if (dx < bestDx) {
        bestDx = dx
        anchor = j
      }
    }
    const cy = (this._yPx(lo[anchor]) + this._yPx(hi[anchor])) / 2

    return { x: cx, y: cy, text, color: this._contrastOn(k) }
  }

  /**
   * Black or white, whichever reads on band `k`'s own fill.
   *
   * A streamgraph's palette runs from pale yellows to near-black slates in the
   * same chart, so one fixed label colour is unreadable on some band every
   * time.
   *
   * @param {number} k
   * @returns {string}
   */
  _contrastOn(k) {
    const w = this.w
    const fill = w.globals.colors?.[k]
    const rgb = typeof fill === 'string' ? Utils.parseHex(fill) : null
    if (!rgb) return w.config.chart.foreColor
    return Utils.relativeLuminance(rgb) > 0.45 ? '#000000' : '#ffffff'
  }

  /** Drop the label layer, if one is present. */
  removeLabels() {
    const host = this.w.dom.elGraphical
    const prev =
      host && host.node.querySelector('.apexcharts-streamgraph-labels')
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev)
  }

  // ── Hover ────────────────────────────────────────────────────────────────

  /**
   * Watch the plot for the band under the cursor.
   *
   * Bound to the svg rather than to the band paths: with `tooltip.intersect`
   * off the pointer is not required to be over a path at all, and hit-testing
   * from the geometry keeps the outline agreeing with the tooltip (both resolve
   * to the nearest column) whether or not a tooltip is even switched on.
   *
   * The flag lives on the node, so a full render (which builds a new svg) binds
   * again and the fast update path (which keeps the old one) does not stack a
   * second listener per update.
   */
  bindHover() {
    const w = this.w
    if (!Environment.isBrowser()) return
    if (this._hoverCfg().show === false) return

    const svg = w.dom.baseEl && w.dom.baseEl.querySelector('.apexcharts-svg')
    if (!svg || svg.__apexStreamHover) return
    svg.__apexStreamHover = true

    svg.addEventListener('mousemove', (/** @type {MouseEvent} */ e) => {
      if (!this.isActive() || !this.w.streamgraphData) return
      this._outline(this._bandAt(e))
    })
    svg.addEventListener('mouseleave', () => {
      this._outline(-1)
    })
  }

  /** @returns {Record<string, any>} */
  _hoverCfg() {
    return this.w.config.plotOptions?.streamgraph?.hover || {}
  }

  /**
   * Which band is under the pointer, or -1.
   *
   * x goes through `AxisMapping.screenXToPlotPx`, the one screen-to-plot
   * mapping, so a chart inside a CSS-zoomed container hit-tests where it looks.
   * y is measured off the same svg rect with the same zoom factor.
   *
   * @param {MouseEvent} e
   * @returns {number}
   */
  _bandAt(e) {
    const w = this.w
    const d = w.streamgraphData
    if (!d || !d.order.length) return -1

    const svg = w.dom.baseEl && w.dom.baseEl.querySelector('.apexcharts-svg')
    if (!svg) return -1
    const rect = svg.getBoundingClientRect()
    const zoom = w.globals.svgWidth ? rect.width / w.globals.svgWidth : 1

    const px = AxisMapping.screenXToPlotPx(w, e.clientX)
    const py = (e.clientY - rect.top) / (zoom || 1) - w.layout.translateY

    if (px < 0 || px > w.layout.gridWidth) return -1
    if (py < 0 || py > w.layout.gridHeight) return -1

    // The column. Taken from the tooltip's own capture when there is one, so
    // the outline and the tooltip resolve the band at the SAME column and
    // cannot end up naming different bands at a boundary. Falls back to the
    // nearest committed x when the tooltip is switched off.
    const xs = w.globals.seriesXvalues[d.order[0]]
    if (!Array.isArray(xs) || !xs.length) return -1
    const captured = w.interact ? w.interact.capturedDataPointIndex : -1
    let j = -1
    if (captured >= 0 && captured < xs.length) {
      j = captured
    } else {
      let best = Infinity
      for (let i = 0; i < xs.length; i++) {
        const dx = Math.abs(Number(xs[i]) - px)
        if (dx < best) {
          best = dx
          j = i
        }
      }
    }
    if (j < 0) return -1

    // A wiggle baseline leaves plot background above and below the surface, and
    // the tooltip (intersect: false) still names the nearest band when the
    // cursor is out there. So does this, or the tooltip would name a band with
    // nothing on the chart pointing at it.
    let nearest = -1
    let gap = Infinity
    for (let i = 0; i < d.order.length; i++) {
      const k = d.order[i]
      const a = this._yPx(d.highs[k][j])
      const b = this._yPx(d.lows[k][j])
      const top = Math.min(a, b)
      const bottom = Math.max(a, b)
      if (py >= top && py <= bottom) return k
      const dist = py < top ? top - py : py - bottom
      if (dist < gap) {
        gap = dist
        nearest = k
      }
    }
    return nearest
  }

  /**
   * Trace band `k`, or clear the outline when `k` is -1.
   *
   * The stroke is drawn at twice its configured width and clipped to the band's
   * OWN path, so exactly half of it survives and every pixel that changes
   * belongs to the band the cursor is on. A centred stroke would spend its
   * other half painting over the neighbour above.
   *
   * @param {number} k
   */
  _outline(k) {
    const w = this.w
    if (k === this._hovered) return
    this._hovered = k
    this.removeOutline()
    if (k < 0) return

    const host = w.dom.elGraphical
    const band = w.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${k}'] path.apexcharts-rangeArea`,
    )
    if (!host || !band) return
    const d = band.getAttribute('d')
    if (!d) return

    const cfg = this._hoverCfg()
    const width = cfg.strokeWidth == null ? 2 : cfg.strokeWidth
    if (!width) return

    const ns = 'http://www.w3.org/2000/svg'
    const group = document.createElementNS(ns, 'g')
    group.setAttribute('class', 'apexcharts-streamgraph-hover')
    // The band itself is masked to the plot box; the outline has to be too, or
    // a band clipped at the edge would be traced past it.
    const mask = band.getAttribute('clip-path')
    if (mask) group.setAttribute('clip-path', mask)

    const clipId = `apexcharts-stream-hover-${w.globals.cuid}`
    const defs = document.createElementNS(ns, 'defs')
    const clip = document.createElementNS(ns, 'clipPath')
    clip.setAttribute('id', clipId)
    const clipShape = document.createElementNS(ns, 'path')
    clipShape.setAttribute('d', d)
    clip.appendChild(clipShape)
    defs.appendChild(clip)
    group.appendChild(defs)

    const stroke = document.createElementNS(ns, 'path')
    stroke.setAttribute('d', d)
    stroke.setAttribute('fill', 'none')
    stroke.setAttribute('stroke', cfg.color || this._contrastOn(k))
    stroke.setAttribute('stroke-width', String(width * 2))
    stroke.setAttribute(
      'stroke-opacity',
      String(cfg.opacity == null ? 0.9 : cfg.opacity),
    )
    stroke.setAttribute('stroke-linejoin', 'round')
    stroke.setAttribute('clip-path', `url(#${clipId})`)
    stroke.setAttribute('pointer-events', 'none')
    group.appendChild(stroke)

    // Above the bands, below the names: a label sits inside the band the
    // outline traces, and the trace must not cut across its text.
    const labels = host.node.querySelector('.apexcharts-streamgraph-labels')
    if (labels) host.node.insertBefore(group, labels)
    else host.node.appendChild(group)
  }

  /** Drop the hover outline, if one is present. */
  removeOutline() {
    const host = this.w.dom.elGraphical
    const prev =
      host && host.node.querySelector('.apexcharts-streamgraph-hover')
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev)
  }

  /**
   * Labels describe where the bands END UP, so drawn at full opacity while the
   * bands are still growing they sit over the wrong shapes. Held hidden and
   * faded in with the rest of the delayed chrome once the bands land.
   *
   * When there is no animation to wait for, `showDelayedElements` has already
   * run for this render, so registering would leave the layer hidden for good.
   *
   * @param {any} group
   */
  holdUntilBandsLand(group) {
    const w = this.w
    const animate =
      Environment.isBrowser() &&
      w.globals.shouldAnimate &&
      !w.globals.animationEnded
    if (!animate) return

    group.node.classList.add('apexcharts-element-hidden')
    w.globals.delayedElements.push({ el: group.node, holdUntilComplete: true })
  }
}
