// @ts-check
/**
 * Facet (#13): a `globalThis`-backed registry of named themes, mirroring
 * ChartFactory's type registry so a theme registered once (via
 * `ApexCharts.registerTheme`) survives duplicate CJS+ESM module instances and
 * is resolvable by every chart on the page via `theme.name`.
 *
 * A theme def = `{ mode?, palette?: string[], tokens?: {accent,fore,grid,surface,series}, monochrome?, accessibility? }`.
 * It sits at layer 3 of the resolution chain (below explicit config and CSS
 * `--apx-*` tokens, above the built-in palette/mode defaults).
 *
 * @module modules/ThemeRegistry
 */

const THEME_KEY = '__apexcharts_themes__'

if (!/** @type {any} */ (globalThis)[THEME_KEY]) {
  ;/** @type {any} */ (globalThis)[THEME_KEY] = {}
}

/** @returns {Record<string, any>} */
function getThemes() {
  return /** @type {any} */ (globalThis)[THEME_KEY]
}

/**
 * Register a named theme.
 * @param {string} name
 * @param {any} def
 */
export function registerTheme(name, def) {
  if (!name || typeof name !== 'string') {
    console.warn('ApexCharts: registerTheme requires a non-empty name.')
    return
  }
  if (def != null && (typeof def !== 'object' || Array.isArray(def))) {
    console.warn(
      `ApexCharts: registerTheme("${name}") expects an object like { mode, palette, tokens, monochrome, accessibility }.`,
    )
    return
  }
  getThemes()[name] = def || {}
}

/**
 * Look up a registered theme (or null).
 * @param {string} name
 * @returns {any|null}
 */
export function getTheme(name) {
  if (!name) return null
  return getThemes()[name] || null
}

/**
 * Remove a registered theme. Charts referencing it by `theme.name` fall back
 * to the built-in defaults on their next render.
 * @param {string} name
 */
export function unregisterTheme(name) {
  if (!name) return
  delete getThemes()[name]
}
