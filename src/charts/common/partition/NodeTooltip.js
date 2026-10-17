// @ts-check
/**
 * The hover tooltip for the partition charts.
 *
 * Self-contained on purpose. The core tooltip addresses a chart by
 * `(seriesIndex, dataPointIndex)`, which a partition chart does not have: it
 * draws one mark per NODE of a tree, at any depth, and what a reader wants to
 * see is the node's share of its parent as well as of the whole. So these
 * charts render their own content into the core tooltip element rather than
 * bending the core pipeline around a shape it was not built for.
 *
 * Not registered in `sharedModules` on purpose; see the note in
 * `charts/common/partition/Partition.js`.
 *
 * @module charts/common/partition/NodeTooltip
 */
import { Environment } from '../../../utils/Environment.js'

/**
 * Escape a data string for innerHTML, text or a quoted attribute alike.
 * @param {any} s
 * @returns {string}
 */
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export class NodeTooltip {
  /**
   * @param {any} w
   * @param {any} [ctx] chart instance, handed to tooltip.custom as core does
   */
  constructor(w, ctx) {
    this.w = w
    this.ctx = ctx
    /** Sum of the visible roots, for the "% of total" line. Set per draw. */
    this.total = 1
    /** @type {any} */
    this._el = null
  }

  /** @returns {any} */
  _tip() {
    if (!this._el) {
      this._el = this.w.dom.baseEl.querySelector('.apexcharts-tooltip')
    }
    return this._el
  }

  /**
   * @param {any} el  the DOM node for one mark
   * @param {any} node  the tree node it stands for
   */
  attach(el, node) {
    if (!this.w.config.tooltip.enabled || !Environment.isBrowser()) return
    el.addEventListener('mouseenter', (/** @type {MouseEvent} */ e) =>
      this.show(e, node),
    )
    el.addEventListener('mousemove', (/** @type {MouseEvent} */ e) =>
      this.position(e),
    )
    el.addEventListener('mouseleave', () => this.hide())
  }

  /**
   * @param {MouseEvent} e
   * @param {any} node
   */
  show(e, node) {
    const t = this._tip()
    if (!t) return
    const w = this.w
    const pctTotal = ((node.value / this.total) * 100).toFixed(1)
    const parentVal = node._parent ? node._parent.value : this.total
    const pctParent =
      parentVal > 0 ? ((node.value / parentVal) * 100).toFixed(1) : pctTotal

    // tooltip.custom owns the content when it returns markup or an Element, as
    // in the core tooltip (the array form is one fn per series; a partition
    // chart is series 0). A null/undefined return keeps the built-in row.
    let fn = w.config.tooltip.custom
    if (Array.isArray(fn)) fn = fn[0]
    const out =
      typeof fn === 'function' &&
      fn({
        series: w.seriesData.series,
        seriesIndex: 0,
        dataPointIndex: -1,
        w,
        ctx: this.ctx,
        node,
        percentOfParent: +pctParent,
        percentOfTotal: +pctTotal,
      })
    if (out?.nodeName) {
      t.replaceChildren(out.cloneNode(true))
    } else if (typeof out === 'string' || typeof out === 'number') {
      t.innerHTML = out
    } else {
      // With tooltip.fillSeriesColor the container is transparent by design
      // and the series-group is expected to carry the mark's colour as its
      // inline background (like pie). Without it, the themed container
      // provides the bg. The name is escaped; what a formatter returns stays
      // markup, as in the core tooltip. The colour can come from data too, so
      // it is set through style.backgroundColor below, never written into a
      // style attribute where a ';' would let it add declarations of its own.
      // tooltip.y.formatter when given (a node has no dataPointIndex, so it
      // gets -1 and the node itself), else the value without float noise.
      const ty = w.config.tooltip.y
      const fmt = (Array.isArray(ty) ? ty[0] : ty)?.formatter
      const val = fmt
        ? fmt(node.value, { seriesIndex: 0, dataPointIndex: -1, w, node })
        : +node.value.toPrecision(12)

      t.innerHTML =
        `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex">` +
        `<span class="apexcharts-tooltip-marker"></span>` +
        `<div class="apexcharts-tooltip-text">` +
        `<div class="apexcharts-tooltip-y-group">` +
        `<span class="apexcharts-tooltip-text-y-label">${escapeHtml(node.name)}: </span>` +
        `<span class="apexcharts-tooltip-text-y-value">${val} (${pctParent}% of parent, ${pctTotal}% of total)</span>` +
        `</div></div></div>`
      const group = /** @type {HTMLElement} */ (t.firstChild)
      const marker = /** @type {HTMLElement} */ (group.firstChild)
      marker.style.backgroundColor = node._color
      if (w.config.tooltip.fillSeriesColor) {
        group.style.backgroundColor = node._color
      }
    }
    t.classList.add('apexcharts-active')
    t.style.opacity = '1'
    this.position(e)
  }

  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  position(e) {
    const t = this._tip()
    if (!t) return
    const rect = this.w.dom.elWrap.getBoundingClientRect()
    const tw = t.offsetWidth
    const th = t.offsetHeight
    const pad = 12

    let x = e.clientX - rect.left + pad
    if (x + tw > rect.width) x = e.clientX - rect.left - tw - pad
    x = Math.max(0, Math.min(x, rect.width - tw))

    let y = e.clientY - rect.top + pad
    if (y + th > rect.height) y = e.clientY - rect.top - th - pad
    y = Math.max(0, Math.min(y, rect.height - th))

    t.style.left = x + 'px'
    t.style.top = y + 'px'
  }

  hide() {
    const t = this._tip()
    if (!t) return
    t.classList.remove('apexcharts-active')
    t.style.opacity = '0'
  }
}
