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

export class NodeTooltip {
  /**
   * @param {any} w
   */
  constructor(w) {
    this.w = w
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

    // With tooltip.fillSeriesColor the container is transparent by design and
    // the series-group is expected to carry the mark's colour as its inline
    // background (like pie). Without it, the themed container provides the bg.
    const groupBg = w.config.tooltip.fillSeriesColor
      ? `background-color:${node._color};`
      : ''

    t.innerHTML =
      `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}">` +
      `<span class="apexcharts-tooltip-marker" style="background-color:${node._color}"></span>` +
      `<div class="apexcharts-tooltip-text">` +
      `<div class="apexcharts-tooltip-y-group">` +
      `<span class="apexcharts-tooltip-text-y-label">${node.name}: </span>` +
      `<span class="apexcharts-tooltip-text-y-value">${node.value} (${pctParent}% of parent, ${pctTotal}% of total)</span>` +
      `</div></div></div>`
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
