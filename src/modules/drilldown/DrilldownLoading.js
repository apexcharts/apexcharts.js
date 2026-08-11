// @ts-check
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { Environment } from '../../utils/Environment.js'

const XHTML = 'http://www.w3.org/1999/xhtml'
const CLASS = 'apexcharts-drilldown-loading'

/**
 * The overlay shown while an async drill level resolves.
 *
 * Rendered into `w.dom.elWrap` alongside the breadcrumb and toolbar, so it
 * covers the chart without stealing plot space. Purely CSS-driven (see
 * apexcharts.css): no inline animation, so a host stylesheet can restyle it and
 * `prefers-reduced-motion` can flatten it.
 *
 * Deliberately shown and hidden AROUND the resolver, never across the drill's
 * own render: `elWrap` is rebuilt on every render, which would strand the node.
 *
 * @module DrilldownLoading
 */
export default class DrilldownLoading {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w
    /** @type {any} */
    this.el = null
  }

  /** @returns {any} the drilldown.loading config, normalised. */
  _cfg() {
    const d = this.w.config.drilldown
    const l = d && d.loading
    // `loading: false` is the shorthand for off; without this it would fall
    // through to {} and read as "show" by default.
    if (l === false) return { show: false }
    return l || {}
  }

  /**
   * Mount the overlay. No-op when disabled, outside a browser, or already up.
   */
  show() {
    if (!Environment.isBrowser()) return
    const cfg = this._cfg()
    if (cfg.show === false) return

    const elWrap = this.w.dom.elWrap
    if (!elWrap) return

    // Guard against a second show (a click while a fetch is already in flight)
    // leaving two overlays stacked.
    this.hide()

    const box = BrowserAPIs.createElementNS(XHTML, 'div')
    box.setAttribute('class', CLASS)
    // Announced rather than focus-stealing: a drill is a user-initiated wait,
    // so 'polite' is right and moving focus would be hostile to keyboard users.
    box.setAttribute('role', 'status')
    box.setAttribute('aria-live', 'polite')
    box.setAttribute('aria-label', cfg.text || 'Loading')

    const spinner = BrowserAPIs.createElementNS(XHTML, 'div')
    spinner.setAttribute('class', `${CLASS}-spinner`)
    // The spinner is decoration; the accessible name lives on the container.
    spinner.setAttribute('aria-hidden', 'true')
    box.appendChild(spinner)

    if (cfg.text) {
      const label = BrowserAPIs.createElementNS(XHTML, 'span')
      label.setAttribute('class', `${CLASS}-text`)
      label.textContent = cfg.text
      box.appendChild(label)
    }

    elWrap.appendChild(box)
    this.el = box
  }

  /** Remove the overlay. Safe to call when it is not mounted. */
  hide() {
    const elWrap = this.w.dom.elWrap
    // Query rather than trusting this.el: a render between show and hide
    // rebuilds elWrap, so the node we created may already be detached while a
    // newer one is live.
    if (elWrap) {
      const nodes = elWrap.querySelectorAll(`.${CLASS}`)
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        if (n.parentNode) n.parentNode.removeChild(n)
      }
    } else if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el)
    }
    this.el = null
  }
}
