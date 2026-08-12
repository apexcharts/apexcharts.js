// @ts-check
/**
 * Breadcrumb chrome for the charts that navigate into a hierarchy.
 *
 * Three separate things can put the reader inside a branch: the drilldown
 * feature (replaces the view one level at a time), the sunburst's click-to-zoom
 * and the treemap's. They are different interactions but the same affordance,
 * so they render the same markup, honour the same config and carry the same
 * accessible semantics from here rather than each growing its own copy.
 *
 * Config comes from `drilldown.breadcrumb` - already the documented home for
 * this chrome - and a chart may override it locally (the treemap reads
 * `plotOptions.treemap.zoom.breadcrumb`), so a chart that never imports the
 * drilldown feature still styles its breadcrumb the same way.
 *
 * NOTE: `src/modules/drilldown/Breadcrumb.js` still has its own copy of this
 * markup. It is the drilldown feature's own bundle and is being worked on
 * elsewhere; folding it into this module is a follow-up, and the two are kept
 * behaviourally identical in the meantime.
 *
 * @module charts/common/Breadcrumb
 */
import { BrowserAPIs } from '../../ssr/BrowserAPIs.js'
import { Environment } from '../../utils/Environment.js'

const XHTML = 'http://www.w3.org/1999/xhtml'

/** Height reserved for the strip when a chart asks the layout for room. */
export const BREADCRUMB_HEIGHT = 18

/**
 * Resolve the breadcrumb config: a chart-local override on top of the shared
 * `drilldown.breadcrumb` block, on top of the built-in defaults.
 *
 * @param {any} w
 * @param {any} [localCfg] chart-specific override
 * @returns {any}
 */
export function breadcrumbConfig(w, localCfg) {
  const shared = (w.config.drilldown && w.config.drilldown.breadcrumb) || {}
  return {
    show: true,
    position: 'top-left',
    separator: ' / ',
    rootLabel: 'All',
    offsetX: 0,
    offsetY: 0,
    formatter: undefined,
    ...shared,
    ...(localCfg || {}),
  }
}

/**
 * Push `nav` below the title/subtitle if it would sit on top of them.
 *
 * Runs up to two passes, because clearing the title can land the nav on the
 * subtitle. A no-op when the chart has neither.
 *
 * @param {any} w
 * @param {any} nav the breadcrumb element, already positioned and in the DOM
 */
export function avoidChromeOverlap(w, nav) {
  const chrome = /** @type {Element[]} */ (
    ['.apexcharts-title-text', '.apexcharts-subtitle-text']
      .map((s) => w.dom.baseEl.querySelector(s))
      .filter((el) => el !== null)
  )
  if (!chrome.length) return
  const wrapTop = w.dom.elWrap.getBoundingClientRect().top
  for (let pass = 0; pass < chrome.length + 1; pass++) {
    const nr = nav.getBoundingClientRect()
    const hit = chrome.find((el) => {
      const r = el.getBoundingClientRect()
      return (
        nr.left < r.right &&
        nr.right > r.left &&
        nr.top < r.bottom &&
        nr.bottom > r.top
      )
    })
    if (!hit) break
    nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`
  }
}

/**
 * Remove any breadcrumb currently in the wrap.
 * @param {any} w
 */
export function clearBreadcrumb(w) {
  const elWrap = w.dom.elWrap
  if (!elWrap) return
  const existing = elWrap.querySelector('.apexcharts-breadcrumb')
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing)
}

/**
 * Render a breadcrumb into the chart wrap.
 *
 * The last crumb is the current position and is not actionable; every earlier
 * one is a button that calls `onNavigate` with its index. The leftmost carries
 * a back arrow so the strip reads as "go back" at a glance.
 *
 * @param {any} w
 * @param {{
 *   crumbs: Array<{ label: string, data?: any }>,
 *   onNavigate: (index: number, crumb: any) => void,
 *   ariaLabel?: string,
 *   config?: any,
 *   compact?: boolean,
 * }} opts
 * @returns {any} the nav element, or null if nothing was rendered
 */
export function renderBreadcrumb(w, opts) {
  if (!Environment.isBrowser()) return null
  const elWrap = w.dom.elWrap
  if (!elWrap) return null

  clearBreadcrumb(w)

  const cfg = opts.config || breadcrumbConfig(w)
  if (cfg.show === false) return null
  const crumbs = opts.crumbs || []
  // Nothing to go back to: the strip would say only where you already are.
  if (crumbs.length < 2) return null

  const nav = BrowserAPIs.createElementNS(XHTML, 'nav')
  nav.setAttribute('class', 'apexcharts-breadcrumb')
  nav.setAttribute('aria-label', opts.ariaLabel || 'Breadcrumb')
  positionBreadcrumb(nav, cfg)
  if (opts.compact) {
    // A treemap fills its plot edge to edge, so its strip has to fit the narrow
    // band above the grid rather than float over a tile.
    nav.style.fontSize = '11px'
    nav.style.padding = '0 2px'
  }

  const separator = cfg.separator != null ? cfg.separator : ' / '

  crumbs.forEach((crumb, i) => {
    if (i > 0) {
      const sep = BrowserAPIs.createElementNS(XHTML, 'span')
      sep.setAttribute('class', 'apexcharts-breadcrumb-separator')
      sep.setAttribute('aria-hidden', 'true')
      sep.textContent = separator
      nav.appendChild(sep)
    }

    let label = i === 0 ? (cfg.rootLabel ?? 'All') : crumb.label
    if (typeof cfg.formatter === 'function') {
      label = cfg.formatter(label, {
        index: i,
        depth: crumbs.length - 1,
        data: crumb.data,
      })
    }

    if (i === crumbs.length - 1) {
      const cur = BrowserAPIs.createElementNS(XHTML, 'span')
      cur.setAttribute(
        'class',
        'apexcharts-breadcrumb-item apexcharts-breadcrumb-current',
      )
      cur.setAttribute('aria-current', 'page')
      cur.textContent = String(label)
      nav.appendChild(cur)
      return
    }

    const btn = /** @type {HTMLButtonElement} */ (
      BrowserAPIs.createElementNS(XHTML, 'button')
    )
    btn.setAttribute('type', 'button')
    btn.setAttribute('class', 'apexcharts-breadcrumb-item')
    if (i === 0) {
      const arrow = BrowserAPIs.createElementNS(XHTML, 'span')
      arrow.setAttribute('class', 'apexcharts-breadcrumb-arrow')
      arrow.setAttribute('aria-hidden', 'true')
      arrow.textContent = '←'
      btn.appendChild(arrow)
    }
    const text = BrowserAPIs.createElementNS(XHTML, 'span')
    text.setAttribute('class', 'apexcharts-breadcrumb-label')
    text.textContent = String(label)
    btn.appendChild(text)
    btn.addEventListener('click', () => opts.onNavigate(i, crumb))
    nav.appendChild(btn)
  })

  elWrap.appendChild(nav)
  return nav
}

/**
 * @param {any} nav
 * @param {any} cfg
 */
export function positionBreadcrumb(nav, cfg) {
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
