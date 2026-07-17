// @ts-check
import { Environment } from '../../utils/Environment'
import { BrowserAPIs } from '../../ssr/BrowserAPIs'

/**
 * Facet (#13): read `--apx-*` CSS design tokens from the cascade.
 *
 * Custom properties inherit, so reading them off `w.dom.elWrap` (appended to
 * the user's container during `Core.setupElements`, before `Theme.init`) or the
 * host element resolves tokens declared anywhere up the tree, including
 * `:root`. This is a one-shot read: the resolved values feed `w.globals.colors`
 * and the chrome defaults once per render (SVG fills stay JS hex). A live OS
 * theme change re-runs the render via the `theme.follow` watcher, which
 * re-reads tokens, so a `@media (prefers-color-scheme: dark)` block that
 * redefines the tokens is picked up.
 *
 * SSR-safe: returns `{}` when there is no browser (tokens are a no-op server
 * side; the built-in defaults render).
 *
 * @module modules/theme/Tokens
 */

const TOKEN_MAP = {
  accent: '--apx-accent',
  fore: '--apx-fore',
  grid: '--apx-grid',
  surface: '--apx-surface',
}

// Cap the explicit-palette scan; a design system with more than this many
// distinct series colours is well past the point of readable categorical hues.
const MAX_SERIES_TOKENS = 24

/**
 * @param {any} w
 * @returns {{accent?:string, fore?:string, grid?:string, surface?:string, series?:string[]}}
 */
export function readTokens(w) {
  if (!Environment.isBrowser()) return {}
  const el = (w.dom && (w.dom.elWrap || w.dom.baseEl)) || null
  if (!el) return {}

  const cs = BrowserAPIs.getComputedStyle(el)
  if (!cs || typeof (/** @type {any} */ (cs).getPropertyValue) !== 'function') {
    return {}
  }

  /** @param {string} name */
  const read = (name) => {
    const v = /** @type {any} */ (cs).getPropertyValue(name)
    return v ? String(v).trim() : ''
  }

  /** @type {Record<string, any>} */
  const out = {}
  for (const key in TOKEN_MAP) {
    const v = read(/** @type {any} */ (TOKEN_MAP)[key])
    if (v) out[key] = v
  }

  // Explicit palette: --apx-series-1, --apx-series-2, ... (stop at the first gap
  // so a partial list does not silently produce holes).
  /** @type {string[]} */
  const series = []
  for (let i = 1; i <= MAX_SERIES_TOKENS; i++) {
    const v = read(`--apx-series-${i}`)
    if (!v) break
    series.push(v)
  }
  if (series.length) out.series = series

  return out
}
