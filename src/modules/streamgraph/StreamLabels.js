// @ts-check
/**
 * Streamgraph chrome: the band labels, and the dim that answers the cursor.
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
 * The hover dim is the surface's only acknowledgement of the cursor, and it
 * works by taking the OTHER bands down rather than by adding anything to the
 * hovered one. That is forced by the form: the bands touch edge to edge, so
 * there is no empty space for a treatment to occupy. A drop shadow has nowhere
 * to fall except onto the two neighbours, where it reads as dirt rather than as
 * lift; a stroke along the band's edge is centred on a boundary it SHARES, so
 * half of it paints over the neighbour. Fading everything else needs no room at
 * all, and it leaves the hovered band's colour untouched, which matters on a
 * chart where colour is the only thing tying a band to its name.
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
    /** The band the cursor is currently on, or -1. @type {number} */
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
    // The bands were just redrawn, so a band left faded by the last hover would
    // stay faded over geometry that has since moved.
    this.clearDim()
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

    const fontSize = cfg.style?.fontSize || 'auto'
    const fontFamily = cfg.style?.fontFamily || w.config.chart.fontFamily
    const fontWeight = cfg.style?.fontWeight || 600
    const minWidth = cfg.minWidth == null ? 24 : cfg.minWidth

    /** @type {any[]} */
    const placed = []
    for (let i = 0; i < data.order.length; i++) {
      const k = data.order[i]
      const label = this._placeLabel(k, {
        fontSize,
        fontFamily,
        fontWeight,
        minWidth,
        graphics,
      })
      if (label) placed.push(label)
    }

    let drawn = 0
    for (const label of this._deconflict(placed)) {
      const k = label.k

      const el = graphics.drawText({
        x: label.x,
        y: label.y,
        text: label.text,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        // The size a band's own name is drawn at is decided per band, not per
        // chart (see `_resolveFontSize`).
        fontSize: label.fontSize,
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
   * Where band `k`'s name could go, best spot first, or null if nowhere.
   *
   * Returns several candidates rather than one. Each band picks its spot from
   * its own shape alone, and on a chart where everything peaks in the same
   * burst that puts every name in the same narrow strip — the first version of
   * this returned one placement each and the de-overlap pass then had to throw
   * twenty of twenty-two away. Offering alternatives lets a name that loses its
   * first choice slide along its own band instead of vanishing.
   *
   * A candidate is the middle of a stretch where the band clears the line box,
   * plus, on a stretch with room to spare, two more spread across it.
   *
   * @param {number} k
   * @param {{fontSize: string, fontFamily: string, fontWeight: any, minWidth: number, graphics: any}} opts
   * @returns {{k: number, weight: number, candidates: any[]}|null}
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
    let peakT = 0
    for (let j = 0; j < m; j++) {
      const t = Math.abs(this._yPx(hi[j]) - this._yPx(lo[j]))
      thickness[j] = t
      if (t > peakT) peakT = t
    }
    if (peakT <= 0) return null

    // Sized from the band's GREATEST thickness, not from whichever stretch the
    // name ends up on, so the size still says how big this band gets even when
    // the name has been pushed to a thinner part of it.
    const size = this._resolveFontSize(fontSize, peakT)

    // Measured with the weight it will RENDER at: getTextRects measures at
    // 'regular' unless told otherwise, and bold text measured that way comes up
    // short enough to overflow the band it was fitted to.
    const name = String(data.names[k])
    let px = size
    let rect = graphics.getTextRects(
      name,
      `${px}px`,
      fontFamily,
      '',
      true,
      fontWeight,
    )
    if (peakT < rect.height + VPAD * 2) return null

    // A band can be thick and short — a tall narrow spike. Sizing on thickness
    // alone would then set a name far too wide for the stretch it has to sit
    // in, and truncating it to fit would print "Do..." where a smaller whole
    // word would have gone. Text width is near enough linear in font size, so
    // one step down by the widest stretch's overflow ratio lands it.
    const widest = this._widestRun(thickness, xPx, rect.height + VPAD * 2, m)
    if (!widest) return null
    if (rect.width > widest.width && fontSize === 'auto') {
      const shrunk = Math.floor(px * (widest.width / rect.width))
      if (shrunk < this._autoBounds().min) return null
      px = shrunk
      rect = graphics.getTextRects(
        name,
        `${px}px`,
        fontFamily,
        '',
        true,
        fontWeight,
      )
      if (peakT < rect.height + VPAD * 2) return null
    }

    const needed = rect.height + VPAD * 2
    /** @type {any[]} */
    const candidates = []
    for (const run of this._runs(thickness, needed, m)) {
      const xL = Number(xPx[run.l])
      const xR = Number(xPx[run.r])
      if (!isFinite(xL) || !isFinite(xR)) continue

      let span = xR - xL
      if (span <= 0 && m > 1) {
        // A single qualifying column has no span of its own, so fall back to
        // the gap to its neighbours rather than reporting a zero-width slot.
        const step = Math.abs(
          Number(xPx[Math.min(run.r + 1, m - 1)]) -
            Number(xPx[Math.max(run.l - 1, 0)]),
        )
        span = isFinite(step) ? step : 0
      }
      if (span < minWidth || span < rect.width * 0.35) continue

      const text =
        rect.width <= span
          ? name
          : graphics.getTextBasedOnMaxWidth({
              text: name,
              maxWidth: span,
              fontSize: `${px}px`,
              fontFamily,
            })
      if (!text || text === '...') continue
      const drawnWidth =
        text === name ? rect.width : rect.width * (text.length / name.length)

      // The middle of the stretch first. A stretch with room for the name twice
      // over also offers a spot either side of centre, which is what lets two
      // bands that both peak in the same burst keep both names.
      const centres = [xL + span / 2]
      if (span > drawnWidth * 2.2) {
        centres.push(xL + drawnWidth / 2 + 2, xR - drawnWidth / 2 - 2)
      }

      for (const cx of centres) {
        // Centre vertically on the band AT the column the name sits over, not
        // at the band's peak: on a wide stretch those are different rows, and a
        // label centred on the peak drifts off a band sloping away from it.
        let anchor = run.l
        let bestDx = Infinity
        for (let j = run.l; j <= run.r; j++) {
          const dx = Math.abs(Number(xPx[j]) - cx)
          if (dx < bestDx) {
            bestDx = dx
            anchor = j
          }
        }
        candidates.push({
          x: cx,
          y: (this._yPx(lo[anchor]) + this._yPx(hi[anchor])) / 2,
          text,
          color: this._contrastOn(k),
          fontSize: `${px}px`,
          width: drawnWidth,
          height: rect.height,
        })
      }
      if (candidates.length >= 6) break
    }

    return candidates.length ? { k, weight: peakT, candidates } : null
  }

  /**
   * The contiguous stretches where the band clears `needed`, thickest first.
   * @param {number[]} thickness
   * @param {number} needed
   * @param {number} m
   * @returns {Array<{l: number, r: number, maxT: number}>}
   */
  _runs(thickness, needed, m) {
    /** @type {Array<{l: number, r: number, maxT: number}>} */
    const runs = []
    let j = 0
    while (j < m) {
      if (thickness[j] < needed) {
        j++
        continue
      }
      let end = j
      let maxT = thickness[j]
      while (end + 1 < m && thickness[end + 1] >= needed) {
        end++
        if (thickness[end] > maxT) maxT = thickness[end]
      }
      runs.push({ l: j, r: end, maxT })
      j = end + 1
    }
    return runs.sort((a, b) => b.maxT - a.maxT)
  }

  /**
   * The widest qualifying stretch in px, used to decide whether the name has to
   * be stepped down a size before any placement is attempted.
   * @param {number[]} thickness
   * @param {any[]} xPx
   * @param {number} needed
   * @param {number} m
   * @returns {{width: number}|null}
   */
  _widestRun(thickness, xPx, needed, m) {
    let best = -1
    for (const run of this._runs(thickness, needed, m)) {
      const span = Number(xPx[run.r]) - Number(xPx[run.l])
      if (isFinite(span) && span > best) best = span
    }
    return best >= 0 ? { width: best } : null
  }

  /**
   * Drop the labels that would land on top of one another.
   *
   * Each band picks its own widest stretch with no idea what its neighbours
   * picked, and on a dense chart two of them routinely want the same patch of
   * screen. Two names overlapping is worse than one name missing: the reader
   * can no longer tell which band EITHER belongs to, and the tooltip still
   * names every band on hover.
   *
   * Ranked by the BAND's own thickness, not by the label's area: sorting on
   * area hands priority to whoever has the longest name, so a sliver called
   * "Willow Warbler" outranks a dominant band called "Robin". Thickest band
   * first means the name that survives a collision is the one on the band
   * carrying more, which is also the one the reader is most likely to want.
   *
   * @param {any[]} labels
   * @returns {any[]}
   */
  _deconflict(labels) {
    const byImportance = labels.slice().sort((a, b) => b.weight - a.weight)

    /** @type {any[]} */
    const kept = []
    /** @param {any} box */
    const free = (box) =>
      !kept.some(
        (o) =>
          box.left < o.box.right &&
          box.right > o.box.left &&
          box.top < o.box.bottom &&
          box.bottom > o.box.top,
      )

    for (const label of byImportance) {
      // Each band's alternatives are tried in its own order of preference, so a
      // name only moves as far as it has to and gives up only when its whole
      // band is spoken for.
      for (const c of label.candidates) {
        const box = {
          left: c.x - c.width / 2,
          right: c.x + c.width / 2,
          top: c.y - c.height / 2,
          bottom: c.y + c.height / 2,
        }
        if (free(box)) {
          kept.push({ k: label.k, ...c, box })
          break
        }
      }
    }
    return kept
  }

  /** The bounds `fontSize: 'auto'` scales between. */
  _autoBounds() {
    const cfg = this.w.config.plotOptions?.streamgraph?.labels || {}
    return {
      min: cfg.minFontSize == null ? 9 : cfg.minFontSize,
      max: cfg.maxFontSize == null ? 30 : cfg.maxFontSize,
    }
  }

  /**
   * The px size band `k`'s name is drawn at, given how thick that band gets.
   *
   * `auto` is the default because it is the convention of the form, and because
   * the alternative actively misleads: a streamgraph's whole claim is that
   * thickness is quantity, and a fixed size prints that claim in the same voice
   * for a band carrying half the total and a band carrying a rounding error.
   *
   * A literal (`'12px'`) opts out and every name is drawn at it.
   *
   * @param {string} fontSize the configured value, or 'auto'
   * @param {number} peakT the band's greatest thickness, in px
   * @returns {number} px
   */
  _resolveFontSize(fontSize, peakT) {
    if (fontSize !== 'auto') {
      const parsed = parseFloat(fontSize)
      return isFinite(parsed) && parsed > 0 ? parsed : 12
    }
    const { min, max } = this._autoBounds()
    // Just over a third of the band. Big enough that a dominant band reads as
    // dominant, small enough to leave the breathing room a name needs on both
    // sides of it rather than filling the band wall to wall.
    return Math.max(min, Math.min(max, Math.round(peakT * 0.36)))
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
      this._dim(this._bandAt(e))
    })
    svg.addEventListener('mouseleave', () => {
      this._dim(-1)
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
   * Bring band `k` forward by dropping every other band's opacity, or clear the
   * effect when `k` is -1.
   *
   * The bands touch edge to edge, so there is no gap for a treatment to live
   * in: anything drawn ON the hovered band either spends half its width on the
   * neighbour (a centred stroke) or falls entirely onto both of them (a drop
   * shadow). Taking the OTHERS down instead is the one move that needs no
   * empty space to work in, and it leaves the hovered band's colour exactly as
   * it was, which matters on a chart where colour is the only thing tying a
   * band to its name.
   *
   * A dimmed band's label is RECOLOURED rather than faded with it. Each label
   * takes black or white by the contrast of the band it sits on at full
   * strength, so fading the band alone leaves a white name on a band that has
   * gone pale — the name does not read as de-emphasised, it reads as broken.
   * Dropped to the chart's own foreColor instead, it stays legible on every
   * faded band while clearly no longer being the one in focus.
   *
   * @param {number} k
   */
  _dim(k) {
    const w = this.w
    if (k === this._hovered) return
    this._hovered = k

    const cfg = this._hoverCfg()
    const dimmed = cfg.opacity == null ? 0.35 : cfg.opacity
    const bands = w.dom.baseEl.querySelectorAll('.apexcharts-series')
    const labels = w.dom.baseEl.querySelectorAll(
      '.apexcharts-streamgraph-label',
    )

    /**
     * @param {any} el
     * @param {number} index
     * @returns {boolean} whether this element is the one in focus
     */
    const focused = (el, index) => k < 0 || index === k

    for (let i = 0; i < bands.length; i++) {
      const el = /** @type {any} */ (bands[i])
      // Set once and left in place, so the fade runs in BOTH directions: a
      // transition applied along with the dim would animate on the way in and
      // snap on the way out, because by then the rule is gone again.
      el.style.transition = 'opacity .15s ease'
      el.style.opacity = focused(el, Number(el.getAttribute('data:realIndex')))
        ? ''
        : String(dimmed)
    }

    for (let i = 0; i < labels.length; i++) {
      const el = /** @type {any} */ (labels[i])
      el.style.transition = 'opacity .15s ease, fill .15s ease'
      if (focused(el, Number(el.getAttribute('data:realIndex')))) {
        this._restoreLabel(el)
      } else {
        // Stashed rather than recomputed: the colour may have come from
        // `labels.style.colors`, which this layer would otherwise have to
        // re-resolve every time the cursor moves.
        if (!el.getAttribute('data:fill')) {
          el.setAttribute('data:fill', el.getAttribute('fill') || '')
        }
        el.setAttribute('fill', w.config.chart.foreColor)
        el.style.opacity = '0.65'
      }
    }
  }

  /**
   * Give one label its own colour back.
   * @param {any} el
   */
  _restoreLabel(el) {
    const orig = el.getAttribute('data:fill')
    if (orig) el.setAttribute('fill', orig)
    el.style.opacity = ''
  }

  /** Put every band and label back the way it was drawn. */
  clearDim() {
    this._hovered = -1
    const w = this.w
    if (!w.dom.baseEl) return
    const bands = w.dom.baseEl.querySelectorAll('.apexcharts-series')
    for (let i = 0; i < bands.length; i++) {
      // Bound to a const rather than cast in place: a line-leading JSDoc cast
      // gets parsed as a CALL of the line above it in a semicolon-less file.
      const el = /** @type {any} */ (bands[i])
      el.style.opacity = ''
    }
    const labels = w.dom.baseEl.querySelectorAll(
      '.apexcharts-streamgraph-label',
    )
    for (let i = 0; i < labels.length; i++) {
      this._restoreLabel(/** @type {any} */ (labels[i]))
    }
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
