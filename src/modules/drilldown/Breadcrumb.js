// @ts-check
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { Environment } from '../../utils/Environment.js'
import {
  avoidChromeOverlap,
  placeInReservedBand,
  positionBreadcrumb,
} from '../../charts/common/Breadcrumb.js'

const XHTML = 'http://www.w3.org/1999/xhtml'

/**
 * Drilldown breadcrumb: an absolutely-positioned <nav> rendered inside
 * w.dom.elWrap (the same wrapper the toolbar uses), re-rendered after every
 * chart (re)render because elWrap's contents are rebuilt each time.
 *
 * On an axis chart `Dimensions.gridPadForBreadcrumb` reserves a band above the
 * plot and the strip sits in it. Being an overlay is not enough on its own:
 * with nothing reserved it was pushed below the title and came to rest on the
 * top gridline and the first y-axis label. A pie or donut still floats, since
 * its corners are empty.
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

    // Remove any stale breadcrumb first (guards against double-render), but
    // only its own: a zoomed treemap's shares the class.
    const existing = elWrap.querySelector(
      '.apexcharts-breadcrumb[aria-label^=Drill]',
    )
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
    positionBreadcrumb(nav, cfg)

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
    if (this.w.globals.axisCharts) {
      placeInReservedBand(this.w, this.ctx, nav, cfg)
    }
    // Still runs after the band placement: on a pie there is no band, and even
    // on an axis chart a responsive override can turn drilldown on after layout
    // and leave the strip with nowhere reserved.
    avoidChromeOverlap(w, nav)
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
      // An onDrillDown level is not in that list: its name rides on the
      // stack frame (or, drilled from a point with no id, the point's label).
      const frame = this.drilldown.stack[index - 1]
      label = (list && list.name) || (frame && frame.name) || String(id)
    }
    if (typeof cfg.formatter === 'function') {
      return cfg.formatter(label, { index, depth: this.drilldown.depth })
    }
    return label
  }
}
