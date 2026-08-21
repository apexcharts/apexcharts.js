// @ts-check
/**
 * Trellis (#22): the shared chrome. One title, one legend, one toolbar for the
 * whole grid, plus the per-cell facet headers.
 *
 * All of it is plain DOM outside the panels' SVGs: headers must survive a
 * panel unmount (P2 virtualization shows header + skeleton), and the legend
 * repeats identical rows N times if left to the panels. Class names reuse the
 * shipped legend vocabulary (`apexcharts-legend-series/-marker/-text`,
 * `apexcharts-inactive-legend`) so existing CSS and theme tokens apply, with
 * trellis-scoped styles in apexcharts.css as the always-present baseline (the
 * legend feature's own stylesheet may not be bundled).
 *
 * @module modules/trellis/TrellisChrome
 */
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import HeatmapGradientLegend from '../legend/HeatmapGradientLegend.js'

/** Minimal inline icons (original shapes, stroke = currentColor). */
const ICONS = {
  zoom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M8 10.5h5M10.5 8v5"/></svg>',
  pan: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
  reset:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10a8 8 0 1 1 2 6"/><path d="M4 4v6h6"/></svg>',
  download:
    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
}

export default class TrellisChrome {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis
    /** @type {HTMLElement|null} */
    this.elLegend = null
    /** @type {HTMLElement|null} */
    this.elToolbar = null
    /** @type {HTMLElement|null} */
    this.elTitle = null
    /** @type {HTMLElement|null} */
    this.elBreadcrumb = null
    /** @type {HeatmapGradientLegend|null} shared gradient strip (P5, heatmap) */
    this.gradientLegend = null
    /** @type {(() => void)|null} unsubscribe for a deferred gradient build */
    this._gradPending = null
  }

  /**
   * The per-cell facet header. Built with the cell, before the panel mounts,
   * so a virtualized cell still names itself.
   * @param {HTMLElement} cell
   * @param {string} key
   * @param {{ index: number, count: number }} meta
   */
  buildHeader(cell, key, meta) {
    const t = this.trellis
    const hcfg = t.cfg.header || {}
    if (hcfg.show === false) return
    const el = BrowserAPIs.createElement('div')
    el.className = 'apexcharts-trellis-header'
    let text = key
    if (typeof hcfg.formatter === 'function') {
      text = hcfg.formatter(key, {
        dimension: typeof t.cfg.by === 'string' ? t.cfg.by : undefined,
        index: meta.index,
        count: meta.count,
      })
    }
    el.textContent = text == null ? '' : String(text)
    const style = hcfg.style || {}
    if (style.fontSize) el.style.fontSize = style.fontSize
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight)
    if (style.color) el.style.color = style.color

    // Panel promotion (P3): clicking a header expands that panel to the
    // grid's full width; the breadcrumb (or clicking the header again)
    // restores the grid. `trellis.promote: false` opts out.
    if (t.cfg.promote !== false) {
      el.classList.add('apexcharts-trellis-header-clickable')
      el.setAttribute('role', 'button')
      el.setAttribute('tabindex', '0')
      el.setAttribute('title', 'Expand this panel')
      const toggle = () => {
        if (t._promotedKey === key) t.restorePromotion()
        else t.promote(key)
      }
      el.addEventListener('click', toggle)
      el.addEventListener('keydown', (/** @type {any} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      })
    }
    cell.appendChild(el)
  }

  /**
   * One 2-D strip label (P4): column labels once across the top, row labels
   * once down the left, instead of a header per cell. The header formatter
   * applies with the dimension named.
   * @param {'row'|'column'} dimension
   * @param {string} key
   * @param {{ index: number, count: number }} meta
   * @returns {HTMLElement}
   */
  stripEl(dimension, key, meta) {
    const t = this.trellis
    const hcfg = t.cfg.header || {}
    const el = BrowserAPIs.createElement('div')
    el.className = `apexcharts-trellis-strip apexcharts-trellis-strip-${dimension}`
    let text = key
    if (typeof hcfg.formatter === 'function') {
      text = hcfg.formatter(key, {
        dimension,
        index: meta.index,
        count: meta.count,
      })
    }
    el.textContent = text == null ? '' : String(text)
    const style = hcfg.style || {}
    if (style.fontSize) el.style.fontSize = style.fontSize
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight)
    if (style.color) el.style.color = style.color
    return el
  }

  /**
   * The promotion breadcrumb: "All panels / KEY", where "All panels" is the
   * way back. Lives in the chrome-top strip so the grid's own layout is
   * untouched.
   * @param {HTMLElement} host
   * @param {string} key
   * @param {() => void} onBack
   */
  buildBreadcrumb(host, key, onBack) {
    this.removeBreadcrumb()
    const el = BrowserAPIs.createElement('div')
    el.className = 'apexcharts-trellis-breadcrumb'

    const back = BrowserAPIs.createElement('button')
    back.setAttribute('type', 'button')
    back.className = 'apexcharts-trellis-breadcrumb-back'
    back.textContent = 'All panels'
    back.addEventListener('click', onBack)

    const sep = BrowserAPIs.createElement('span')
    sep.className = 'apexcharts-trellis-breadcrumb-sep'
    sep.textContent = '/'

    const current = BrowserAPIs.createElement('span')
    current.className = 'apexcharts-trellis-breadcrumb-current'
    current.textContent = key

    el.appendChild(back)
    el.appendChild(sep)
    el.appendChild(current)
    host.appendChild(el)
    this.elBreadcrumb = el
  }

  removeBreadcrumb() {
    if (this.elBreadcrumb && this.elBreadcrumb.parentNode) {
      this.elBreadcrumb.parentNode.removeChild(this.elBreadcrumb)
    }
    this.elBreadcrumb = null
  }

  /**
   * The trellis-level title, from the host's own `title` config (panels have
   * theirs suppressed).
   * @param {HTMLElement} host
   */
  buildTitle(host) {
    const title = this.trellis.w.config.title
    if (!title || !title.text) return
    const el = BrowserAPIs.createElement('div')
    el.className = 'apexcharts-trellis-title'
    el.textContent = title.text
    const style = title.style || {}
    if (style.fontSize) el.style.fontSize = style.fontSize
    if (style.color) el.style.color = style.color
    host.appendChild(el)
    this.elTitle = el
  }

  /**
   * One legend for the grid. Clicking an item toggles that series name in
   * every panel (TrellisSync owns the fan-out and the hidden set).
   * @param {HTMLElement} host
   */
  buildLegend(host) {
    const t = this.trellis
    if ((t.cfg.legend || 'shared') !== 'shared') return
    // A heatmap's legend IS its color scale (P5): one shared gradient strip
    // for the grid instead of a categorical name list.
    if (t.w.config.chart.type === 'heatmap') {
      this.buildGradientLegend(host)
      return
    }
    const names = t.split ? t.split.seriesNames : []
    // A one-name legend restates the header; skip it, like the per-chart
    // legend skips single-series charts by default.
    if (names.length < 2) return

    const wrap = BrowserAPIs.createElement('div')
    wrap.className = 'apexcharts-trellis-legend apexcharts-legend'
    wrap.setAttribute('role', 'list')

    names.forEach((name) => {
      const item = BrowserAPIs.createElement('div')
      item.className = 'apexcharts-legend-series apexcharts-trellis-legend-item'
      item.setAttribute('role', 'listitem')
      item.setAttribute('tabindex', '0')
      item.setAttribute('data:collapsed', 'false')

      const marker = BrowserAPIs.createElement('span')
      marker.className = 'apexcharts-legend-marker'
      marker.style.background = t.scales ? t.scales.colorOf(name) : '#008FFB'

      const text = BrowserAPIs.createElement('span')
      text.className = 'apexcharts-legend-text'
      text.textContent = name

      item.appendChild(marker)
      item.appendChild(text)

      const toggle = () => {
        const hidden = t.sync.toggleSeries(name)
        item.classList.toggle('apexcharts-inactive-legend', hidden)
        item.setAttribute('data:collapsed', String(hidden))
      }
      item.addEventListener('click', toggle)
      item.addEventListener('keydown', (/** @type {any} */ e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          toggle()
        }
      })
      wrap.appendChild(item)
    })

    host.appendChild(wrap)
    this.elLegend = wrap
  }

  /**
   * One shared gradient strip for a heatmap grid (P5). Every panel carries
   * the same pushed colorScale min/max (TrellisFrames), so any ONE mounted
   * panel's strip is THE grid's scale; it draws detached into a trellis-owned
   * slot under the grid. Hover (the value arrow) is wired through every
   * mounted panel's events, so sweeping any panel moves the one arrow.
   * On a virtualized grid with nothing mounted yet, the build defers to the
   * first panelMounted.
   * @param {HTMLElement} host
   */
  buildGradientLegend(host) {
    const t = this.trellis
    const mounted = t.panels.find((p) => p.chart)
    if (!mounted) {
      if (this._gradPending) return
      /** @type {any} */
      const once = () => {
        this._gradPending = null
        t.ctx.events.removeEventListener?.('panelMounted', once)
        this.buildGradientLegend(host)
      }
      this._gradPending = once
      t.ctx.events.addEventListener('panelMounted', once)
      return
    }

    const slot = BrowserAPIs.createElement('div')
    slot.className = 'apexcharts-trellis-legend apexcharts-trellis-gradient-legend'
    host.appendChild(slot)
    this.elLegend = slot

    const chart = /** @type {any} */ (mounted.chart)
    const legend = new HeatmapGradientLegend(chart.w, chart.ctx)
    legend.draw(slot)
    this.gradientLegend = legend

    // The instance's own hover wiring only hears ITS panel; mirror the same
    // handlers onto every other mounted panel so the arrow follows the
    // cursor anywhere in the grid.
    t.panels.forEach((p) => {
      if (!p.chart || p === mounted) return
      const ev = /** @type {any} */ (p.chart).ctx?.events
      if (!ev?.addEventListener) return
      ev.addEventListener('dataPointMouseEnter', legend._onCellEnter)
      ev.addEventListener('dataPointMouseLeave', legend._onCellLeave)
    })
  }

  /** Tear down the shared gradient strip (P5). */
  destroyGradientLegend() {
    const t = this.trellis
    if (this._gradPending) {
      t.ctx.events.removeEventListener?.('panelMounted', this._gradPending)
      this._gradPending = null
    }
    if (this.gradientLegend) {
      try {
        this.gradientLegend.destroy()
      } catch (e) {
        // The carrier panel may already be destroyed; the strip DOM goes
        // with the trellis wrap either way.
      }
      this.gradientLegend = null
    }
  }

  /**
   * One toolbar for the grid: zoom / pan / reset only (P1). Zoom and pan arm
   * the tool by setting every panel's interact flags, which is exactly what
   * the per-chart toolbar does for its group; reset restores the trellis's
   * own domains via TrellisSync.
   * @param {HTMLElement} host
   */
  buildToolbar(host) {
    const t = this.trellis
    if ((t.cfg.toolbar || 'shared') !== 'shared') return
    const bar = BrowserAPIs.createElement('div')
    bar.className = 'apexcharts-trellis-toolbar'

    /** @type {Record<string, HTMLElement>} */
    const buttons = {}
    /** @param {'zoom'|'pan'} tool */
    const arm = (tool) => {
      t.panels.forEach((p) => {
        if (!p.chart) return
        const it = p.chart.w.interact
        it.zoomEnabled = tool === 'zoom'
        it.panEnabled = tool === 'pan'
        it.selectionEnabled = false
      })
      buttons.zoom.classList.toggle('apexcharts-selected', tool === 'zoom')
      buttons.pan.classList.toggle('apexcharts-selected', tool === 'pan')
      buttons.zoom.setAttribute('aria-pressed', String(tool === 'zoom'))
      buttons.pan.setAttribute('aria-pressed', String(tool === 'pan'))
    }

    /**
     * @param {string} kind
     * @param {string} label
     * @param {() => void} onClick
     */
    const makeButton = (kind, label, onClick) => {
      const b = BrowserAPIs.createElement('button')
      b.className = `apexcharts-trellis-tool apexcharts-trellis-tool-${kind}`
      b.setAttribute('type', 'button')
      b.setAttribute('aria-label', label)
      b.setAttribute('title', label)
      b.innerHTML = /** @type {Record<string, string>} */ (ICONS)[kind]
      b.addEventListener('click', onClick)
      buttons[kind] = b
      bar.appendChild(b)
      return b
    }

    makeButton('zoom', 'Selection zoom', () => arm('zoom'))
    makeButton('pan', 'Pan', () => arm('pan'))
    makeButton('reset', 'Reset zoom', () => {
      t.sync.resetAll()
    })

    // The download tool (P3): one composed artifact for the whole grid.
    // Requires the exports feature on the panels; omitted otherwise.
    if (t.ctx.exports) {
      const menu = BrowserAPIs.createElement('div')
      menu.className = 'apexcharts-trellis-menu'
      ;/** @type {Array<['png'|'svg'|'csv', string]>} */ ([
        ['png', 'Download PNG'],
        ['svg', 'Download SVG'],
        ['csv', 'Download CSV'],
      ]).forEach(([kind, label]) => {
        const item = BrowserAPIs.createElement('button')
        item.setAttribute('type', 'button')
        item.className = 'apexcharts-trellis-menu-item'
        item.textContent = label
        item.addEventListener('click', () => {
          menu.classList.remove('apexcharts-trellis-menu-open')
          t.exports.download(kind)
        })
        menu.appendChild(item)
      })
      makeButton('download', 'Download', () => {
        menu.classList.toggle('apexcharts-trellis-menu-open')
      })
      bar.appendChild(menu)
    }

    // Default tool mirrors the per-chart default (toolbar.autoSelected 'zoom').
    buttons.zoom.classList.add('apexcharts-selected')
    buttons.zoom.setAttribute('aria-pressed', 'true')
    buttons.pan.setAttribute('aria-pressed', 'false')

    host.appendChild(bar)
    this.elToolbar = bar
    // The toolbar floats at the grid's top-right, so the grid has to start
    // BELOW it: at four or more columns the last cell's header runs straight
    // under the buttons otherwise.
    host.classList.add('apexcharts-trellis-has-toolbar')
  }
}
