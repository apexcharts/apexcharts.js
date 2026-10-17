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
import TooltipUtils from '../tooltip/Utils'
import { BAR_PATHWAY_TYPES } from '../settings/TypeAliases'

/** Card offset from the pointer, px. */
const CURSOR_PAD = 14

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
    // Per-frame cache, see _update: the key, split and scales the card was
    // built for (an in-place updateOptions swaps only the scales); also `_e` (the last event seen), `_zoom` (the hovered plot's CSS
    // zoom) and `_titleEl` (the hovered cell's tooltip title node).
    /** @type {string|null} */
    this._key = null
    /** @type {any} */
    this._split = null
    /** @type {any} */
    this._scales = null
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
      this._key = null
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
   * pointer is outside the hovered panel's plot. Mirrors
   * tooltip/Utils.getNearestValues (trellis panels are never combos):
   * horizontal bars take the row under the pointer, numeric and datetime x
   * the point nearest the data x under it (a zoomed window or irregular
   * spacing does not spread evenly), category x the divisor rules.
   * @param {any} chart the hovered panel's instance
   * @param {number} clientX
   * @param {number} clientY
   */
  _hoverIndex(chart, clientX, clientY) {
    const w = chart.w
    const gl = w.globals
    const n = gl.dataPoints
    if (!n || n < 1) return -1
    const gridWidth = w.layout.gridWidth
    if (!gridWidth) return -1
    const plot = TooltipUtils.plotRect(w)
    this._zoom = plot.zoom
    const hoverX = AxisMapping.screenXToPlotPx(w, clientX, plot)
    const edgePad = gl.barPadForNumericAxis || 0
    if (hoverX < -edgePad || hoverX > gridWidth + edgePad) return -1
    // Vertical bound: the panel's own plot. This used to measure
    // `w.dom.elGridRect`, the library's element wrapper around a clip-path
    // rect, which has no getBoundingClientRect: the bound never ran, and the
    // card answered for a pointer over the panel's axis labels and header
    // too. (The grid group's box would not do either: it starts a pixel below
    // the plot.)
    const baseEl = w.dom && w.dom.baseEl
    if (
      baseEl &&
      baseEl.querySelector('.apexcharts-svg') &&
      plot.height &&
      (clientY < plot.top || clientY > plot.top + plot.height)
    ) {
      return -1
    }
    let j
    if (gl.isBarHorizontal) {
      j = Math.floor(
        (clientY - plot.top) / plot.zoom / (w.layout.gridHeight / n),
      )
    } else if (w.axisFlags && w.axisFlags.isXNumeric) {
      // The point nearest the data x under the pointer, in the first x array
      // with points (a legend-hidden series has none). The split aligned
      // every panel to the union x, so this index addresses all of them.
      const xs = gl.seriesX.find((/** @type {any[]} */ a) => a.length) || []
      const x = AxisMapping.pxToDataX(w, hoverX)
      j = 0
      for (let i = 1; i < xs.length; i++) {
        if (Math.abs(xs[i] - x) < Math.abs(xs[j] - x)) j = i
      }
    } else {
      // Bars and `tickPlacement: 'between'` put each point in the middle of
      // its own slot, so the slot under the pointer wins, not the nearest of
      // n - 1 gaps.
      j =
        (BAR_PATHWAY_TYPES.includes(w.config.chart.type) ||
          w.config.xaxis.tickPlacement === 'between') &&
        !w.config.xaxis.convertedCatToNumeric
          ? Math.ceil(hoverX / (gridWidth / n)) - 1
          : Math.round(hoverX / (gridWidth / Math.max(1, n - 1)))
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
   * per panel from the split. It runs every frame while the pointer is over
   * the grid (D9): the index is resolved every frame (a wheel zoom moves the
   * points under a still pointer), but the card is rebuilt (markup,
   * formatters, a forced layout) only when its panel, index, title or split
   * changed, and only a new pointer event moves it.
   * @param {HTMLElement} elWrap
   */
  _update(elWrap) {
    const t = this.trellis
    const card = this.el
    const e = this._lastEvent
    const split = t.split
    if (!card || !e || !split) return

    const moved = e !== this._e
    this._e = e
    const cell =
      e.target && e.target.closest
        ? e.target.closest('.apexcharts-trellis-cell')
        : null
    const hovered = cell ? t.panels.find((p) => p.cellEl === cell) : undefined
    const j =
      hovered && hovered.chart
        ? this._hoverIndex(hovered.chart, e.clientX, e.clientY)
        : -1
    if (!hovered || j === -1) {
      card.classList.remove('apexcharts-trellis-tooltip-active')
      this._key = null
      return
    }

    // The hovered panel's own tooltip title carries the library's formatted
    // x for this index (its native fill works for the hovered chart, though
    // it can land a frame late). Looked up once per cell, not per frame.
    let titleEl = this._titleEl
    if (!titleEl || !cell.contains(titleEl)) {
      titleEl = this._titleEl = cell.querySelector('.apexcharts-tooltip-title')
    }
    const title = (titleEl && titleEl.textContent) || ''
    const key = hovered.key + '\n' + j + '\n' + title

    if (key !== this._key || split !== this._split || t.scales !== this._scales) {
      this._key = key
      this._split = split
      this._scales = t.scales
      let html = title
        ? `<div class="apexcharts-tooltip-title">${escapeHtml(title)}</div>`
        : ''
      split.panels.forEach((slice) => {
        let vals = ''
        split.seriesNames.forEach((name, ni) => {
          const v = this._valueAt(slice, name, ni, j)
          if (v === null) return
          const color = t.scales ? t.scales.colorOf(name) : '#008FFB'
          vals += `<span class="apexcharts-trellis-tooltip-val"><span class="apexcharts-trellis-tooltip-marker" style="background:${escapeAttr(
            color,
          )}"></span>${escapeHtml(v)}</span>`
        })
        html +=
          `<div class="apexcharts-trellis-tooltip-row${
            slice.key === hovered.key
              ? ' apexcharts-trellis-tooltip-row-active'
              : ''
          }" data-key="${escapeAttr(slice.key)}">` +
          `<span class="apexcharts-trellis-tooltip-key">${escapeHtml(
            slice.key,
          )}</span>` +
          `<span class="apexcharts-trellis-tooltip-vals">${vals}</span></div>`
      })
      card.innerHTML = html
      card.classList.add('apexcharts-trellis-tooltip-active')
    } else if (!moved) return

    // Position near the cursor, clamped inside the wrap. The pointer and the
    // wrap's rect are in screen px and `style.left/top` in the wrap's own px,
    // which differ by the CSS zoom of any container the chart sits in; left
    // as screen px, the card stood that factor further from the pointer.
    const wrapRect = elWrap.getBoundingClientRect()
    const zoom = this._zoom || 1
    let x = (e.clientX - wrapRect.left) / zoom + CURSOR_PAD
    let y = (e.clientY - wrapRect.top) / zoom + CURSOR_PAD
    const cw = card.offsetWidth
    const ch = card.offsetHeight
    const wrapWidth = wrapRect.width / zoom
    const wrapHeight = wrapRect.height / zoom
    if (x + cw > wrapWidth - 4) x = Math.max(4, x - cw - CURSOR_PAD * 2)
    if (y + ch > wrapHeight - 4) y = Math.max(4, y - ch - CURSOR_PAD * 2)
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
