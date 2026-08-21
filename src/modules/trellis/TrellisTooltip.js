// @ts-check
/**
 * Trellis (#22, P3): `tooltip: 'grid'`, one card that reads the whole grid.
 *
 * One card near the cursor with one row per panel at the hovered x. Rows are
 * computed FROM THE SPLIT, not scraped from sibling tooltip DOM: the group's
 * per-panel value fill is position-based and never fills a panel that sits
 * BESIDE the hovered one (the same stacked-layout assumption as D7, measured:
 * only the hovered COLUMN's tooltips carry values). The split already
 * re-emitted every panel against the union x list (D5), so the hovered
 * panel's data-point index addresses the same x in EVERY panel, mounted or
 * not, which also makes grid rows complete under virtualization.
 *
 * The hovered index comes from the same plot mapping the real tooltip uses
 * (`AxisMapping.screenXToPlotPx` + the divisor rules from
 * tooltip/Utils.getNearestValues); the title is read from the hovered
 * panel's own tooltip (its native fill path works for the hovered chart), so
 * datetime/locale x formatting stays the library's own.
 *
 * Driven by a continuous rAF hover loop (D9: the tooltip pipeline lands
 * asynchronously after events); the loop stops on mouseleave.
 *
 * @module modules/trellis/TrellisTooltip
 */
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import AxisMapping from '../AxisMapping'

/** Card offset from the pointer, px. */
const CURSOR_PAD = 14

/** Types whose hover divisor counts bins, not points (tooltip/Utils). */
const BAR_FAMILY = ['bar', 'column', 'rangeBar', 'candlestick', 'boxPlot']

export default class TrellisTooltip {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis
    /** @type {HTMLElement|null} */
    this.el = null
    /** @type {number} */
    this._raf = 0
    /** @type {any} */
    this._lastEvent = null
  }

  /**
   * Build the card element and start the hover loop.
   * @param {HTMLElement} elGrid
   * @param {HTMLElement} elWrap
   */
  wire(elGrid, elWrap) {
    const card = BrowserAPIs.createElement('div')
    card.className = 'apexcharts-trellis-tooltip apexcharts-theme-light'
    card.setAttribute('role', 'status')
    elWrap.appendChild(card)
    this.el = card

    const loop = () => {
      this._update(elWrap)
      this._raf = this._lastEvent ? requestAnimationFrame(loop) : 0
    }
    const move = (/** @type {any} */ e) => {
      this._lastEvent = e
      if (!this._raf) this._raf = requestAnimationFrame(loop)
    }
    const leave = () => {
      this._lastEvent = null
      if (this._raf) {
        cancelAnimationFrame(this._raf)
        this._raf = 0
      }
      card.classList.remove('apexcharts-trellis-tooltip-active')
    }
    elGrid.addEventListener('mousemove', move, { passive: true })
    elGrid.addEventListener('mouseleave', leave, { passive: true })
  }

  /**
   * The hovered data-point index in the union x space, or -1 when the
   * pointer is outside the hovered panel's plot. Mirrors the divisor rules
   * of tooltip/Utils.getNearestValues (trellis panels are never combos).
   * @param {any} chart the hovered panel's instance
   * @param {number} clientX
   * @param {number} clientY
   */
  _hoverIndex(chart, clientX, clientY) {
    const w = chart.w
    const n = w.globals.dataPoints
    if (!n || n < 1) return -1
    const gridWidth = w.layout.gridWidth
    if (!gridWidth) return -1
    const hoverX = AxisMapping.screenXToPlotPx(w, clientX)
    const edgePad = w.globals.barPadForNumericAxis || 0
    if (hoverX < -edgePad || hoverX > gridWidth + edgePad) return -1
    // Vertical bound: the panel's own grid box.
    const gridEl =
      w.dom && w.dom.elGridRect
        ? w.dom.elGridRect
        : chart.el && chart.el.querySelector
          ? chart.el.querySelector('.apexcharts-grid')
          : null
    if (gridEl && gridEl.getBoundingClientRect) {
      const r = gridEl.getBoundingClientRect()
      if (r.height && (clientY < r.top || clientY > r.bottom)) return -1
    }
    const barish = BAR_FAMILY.indexOf(w.config.chart.type) !== -1
    let j
    if (barish && !w.config.xaxis.convertedCatToNumeric) {
      j = Math.ceil(hoverX / (gridWidth / n)) - 1
    } else {
      j = Math.round(hoverX / (gridWidth / Math.max(1, n - 1)))
    }
    return Math.max(0, Math.min(n - 1, j))
  }

  /**
   * One series' formatted value in one panel at index j, or null when there
   * is nothing to show. Formatter chain: tooltip.y formatter, then the yaxis
   * labels formatter, then the raw value.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @param {string} name
   * @param {number} nameIdx trellis-wide series index (formatter arg)
   * @param {number} j
   */
  _valueAt(slice, name, nameIdx, j) {
    const s = slice.series.find((sr) => sr.name === name)
    if (!s || !Array.isArray(s.data)) return null
    const d = s.data[j]
    if (d === null || d === undefined) return null
    /** @type {any} */
    let y = d
    if (Array.isArray(d)) y = d[1]
    else if (typeof d === 'object') y = d.y
    if (y === null || y === undefined) return null

    const cfg = this.trellis.w.config
    const ttY = Array.isArray(cfg.tooltip?.y)
      ? cfg.tooltip.y[nameIdx]
      : cfg.tooltip?.y
    const yaxis0 = Array.isArray(cfg.yaxis) ? cfg.yaxis[0] : cfg.yaxis
    const formatter =
      (ttY && typeof ttY.formatter === 'function' && ttY.formatter) ||
      (yaxis0 &&
        yaxis0.labels &&
        typeof yaxis0.labels.formatter === 'function' &&
        yaxis0.labels.formatter) ||
      null
    /** @param {any} v */
    const fmt = (v) => {
      if (formatter) {
        try {
          return String(
            formatter(v, { seriesIndex: nameIdx, dataPointIndex: j, w: null }),
          )
        } catch (e) {
          return String(v)
        }
      }
      return String(v)
    }
    return Array.isArray(y) ? y.map(fmt).join(' / ') : fmt(y)
  }

  /**
   * One reconcile pass: resolve the hovered panel and index, then one row
   * per panel from the split.
   * @param {HTMLElement} elWrap
   */
  _update(elWrap) {
    const t = this.trellis
    const card = this.el
    const e = this._lastEvent
    if (!card || !e || !t.split) return

    const cell =
      e.target && e.target.closest
        ? e.target.closest('.apexcharts-trellis-cell')
        : null
    const hovered = cell
      ? t.panels.find((p) => p.cellEl === cell)
      : undefined
    const j =
      hovered && hovered.chart
        ? this._hoverIndex(hovered.chart, e.clientX, e.clientY)
        : -1
    if (!hovered || j === -1) {
      card.classList.remove('apexcharts-trellis-tooltip-active')
      return
    }

    // The hovered panel's own tooltip title carries the library's formatted
    // x for this index (its native fill works for the hovered chart).
    const titleEl = cell
      ? cell.querySelector('.apexcharts-tooltip-title')
      : null
    const title = titleEl && titleEl.textContent ? titleEl.textContent : ''

    const names = t.split.seriesNames
    const scales = t.scales
    /** @type {string[]} */
    const rows = []
    t.split.panels.forEach((slice) => {
      /** @type {string[]} */
      const vals = []
      names.forEach((name, ni) => {
        const v = this._valueAt(slice, name, ni, j)
        if (v === null) return
        const color = scales ? scales.colorOf(name) : '#008FFB'
        vals.push(
          `<span class="apexcharts-trellis-tooltip-val"><span class="apexcharts-trellis-tooltip-marker" style="background:${escapeAttr(
            color,
          )}"></span>${escapeHtml(v)}</span>`,
        )
      })
      const isHovered = slice.key === hovered.key
      rows.push(
        `<div class="apexcharts-trellis-tooltip-row${
          isHovered ? ' apexcharts-trellis-tooltip-row-active' : ''
        }" data-key="${escapeAttr(slice.key)}">` +
          `<span class="apexcharts-trellis-tooltip-key">${escapeHtml(
            slice.key,
          )}</span>` +
          `<span class="apexcharts-trellis-tooltip-vals">${vals.join(
            '',
          )}</span>` +
          `</div>`,
      )
    })

    let html = ''
    if (title) {
      html += `<div class="apexcharts-tooltip-title">${escapeHtml(title)}</div>`
    }
    html += rows.join('')
    card.innerHTML = html
    card.classList.add('apexcharts-trellis-tooltip-active')

    // Position near the cursor, clamped inside the wrap.
    const wrapRect = elWrap.getBoundingClientRect()
    let x = e.clientX - wrapRect.left + CURSOR_PAD
    let y = e.clientY - wrapRect.top + CURSOR_PAD
    const cw = card.offsetWidth
    const ch = card.offsetHeight
    if (x + cw > wrapRect.width - 4) x = Math.max(4, x - cw - CURSOR_PAD * 2)
    if (y + ch > wrapRect.height - 4) y = Math.max(4, y - ch - CURSOR_PAD * 2)
    card.style.left = `${Math.round(x)}px`
    card.style.top = `${Math.round(y)}px`
  }

  destroy() {
    if (this._raf) {
      cancelAnimationFrame(this._raf)
      this._raf = 0
    }
    this._lastEvent = null
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el)
    this.el = null
  }
}

/** @param {string} s */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** @param {string} s */
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;')
}
