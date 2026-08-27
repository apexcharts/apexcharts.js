// @ts-check
/**
 * Streamgraph band labels.
 *
 * A streamgraph has no y-axis and its bands drift, so a legend off to one side
 * makes the reader carry six colours in their head and match them back to six
 * moving shapes. Writing the name on the band removes that job entirely, and it
 * is the one piece of a streamgraph that cannot be expressed as configuration
 * on a range area, because there is no such element to configure.
 *
 * Each label goes where its own band is thickest, not at a fixed x: that is the
 * only place guaranteed to have room for it, and it is also the part of the
 * band the reader is most likely to be looking at.
 *
 * @module modules/streamgraph/StreamLabels
 */
import Graphics from '../Graphics'
import Utils from '../../utils/Utils'
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
