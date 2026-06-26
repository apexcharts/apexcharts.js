// @ts-check
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { Environment } from '../../utils/Environment.js'

const XHTML = 'http://www.w3.org/1999/xhtml'

/**
 * Drilldown breadcrumb: an absolutely-positioned <nav> overlay rendered inside
 * w.dom.elWrap (the same wrapper the toolbar uses), so it does not steal plot
 * space. Re-rendered after every chart (re)render because elWrap's contents are
 * rebuilt each time.
 *
 * @module Breadcrumb
 */
export default class Breadcrumb {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {import('./Drilldown').default} drilldown
   */
  constructor(w, ctx, drilldown) {
    this.w = w
    this.ctx = ctx
    this.drilldown = drilldown
  }

  /**
   * @param {Array<string|number>} path - ['root', id, id, ...]
   */
  render(path) {
    if (!Environment.isBrowser()) return
    const w = this.w
    const elWrap = w.dom.elWrap
    if (!elWrap) return

    // Remove any stale breadcrumb first (guards against double-render).
    const existing = elWrap.querySelector('.apexcharts-breadcrumb')
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing)
    }

    const cfg = w.config.drilldown && w.config.drilldown.breadcrumb
    if (!cfg || cfg.show === false) return
    // Only show once the user has drilled in.
    if (this.drilldown.depth === 0) return

    const nav = BrowserAPIs.createElementNS(XHTML, 'nav')
    nav.setAttribute('class', 'apexcharts-breadcrumb')
    nav.setAttribute('aria-label', 'Drilldown breadcrumb')
    this._position(nav, cfg)

    const separator = cfg.separator != null ? cfg.separator : ' / '

    path.forEach((id, i) => {
      if (i > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML, 'span')
        sep.setAttribute('class', 'apexcharts-breadcrumb-separator')
        sep.setAttribute('aria-hidden', 'true')
        sep.textContent = separator
        nav.appendChild(sep)
      }

      const label = this._label(id, i)
      const isCurrent = i === path.length - 1

      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML, 'span')
        cur.setAttribute(
          'class',
          'apexcharts-breadcrumb-item apexcharts-breadcrumb-current',
        )
        cur.setAttribute('aria-current', 'page')
        cur.textContent = label
        nav.appendChild(cur)
      } else {
        const btn = /** @type {HTMLButtonElement} */ (
          BrowserAPIs.createElementNS(XHTML, 'button')
        )
        btn.setAttribute('type', 'button')
        btn.setAttribute('class', 'apexcharts-breadcrumb-item')
        // Prefix the leftmost crumb with a back-arrow so it reads as the
        // "go back" affordance, e.g. "← All Years / 2021 by Channel".
        if (i === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML, 'span')
          arrow.setAttribute('class', 'apexcharts-breadcrumb-arrow')
          arrow.setAttribute('aria-hidden', 'true')
          arrow.textContent = '←'
          btn.appendChild(arrow)
        }
        const text = BrowserAPIs.createElementNS(XHTML, 'span')
        text.setAttribute('class', 'apexcharts-breadcrumb-label')
        text.textContent = label
        btn.appendChild(text)
        btn.addEventListener('click', () => this.drilldown.drillToLevel(i))
        nav.appendChild(btn)
      }
    })

    elWrap.appendChild(nav)
  }

  /**
   * @param {string|number} id
   * @param {number} index
   * @returns {string}
   */
  _label(id, index) {
    const cfg = this.w.config.drilldown.breadcrumb
    let label
    if (index === 0) {
      label = cfg.rootLabel != null ? cfg.rootLabel : 'All'
    } else {
      const list = (this.w.config.drilldown.series || []).find(
        (s) => s && s.id === id,
      )
      label = (list && list.name) || String(id)
    }
    if (typeof cfg.formatter === 'function') {
      return cfg.formatter(label, { index, depth: this.drilldown.depth })
    }
    return label
  }

  /**
   * @param {HTMLElement} nav
   * @param {Record<string, any>} cfg
   */
  _position(nav, cfg) {
    const ox = cfg.offsetX || 0
    const oy = cfg.offsetY || 0
    nav.style.position = 'absolute'
    nav.style.top = oy + 'px'
    if (cfg.position === 'top-right') {
      nav.style.right = -ox + 3 + 'px'
    } else {
      nav.style.left = ox + 'px'
    }
  }
}
