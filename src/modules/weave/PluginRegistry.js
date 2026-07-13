// @ts-check
/**
 * Weave plugin registry — global store of plugin *definitions* by name.
 *
 * Mirrors the chart-type registry's `globalThis` pattern (ChartFactory.js), NOT
 * the feature registry's static Map: a third-party plugin may be registered
 * against a different bundle copy of ApexCharts than the one that renders the
 * chart, and a `globalThis` key is shared across copies where a per-module
 * static Map is not.
 *
 * @module weave/PluginRegistry
 */

const REGISTRY_KEY = '__apexcharts_plugins__'

/**
 * @returns {Record<string, any>}
 */
function getRegistry() {
  const g = /** @type {any} */ (globalThis)
  if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = {}
  return g[REGISTRY_KEY]
}

/**
 * Register a plugin definition. A plugin is a plain object; it does NOT need to
 * be a feature file. Idempotent by name (re-registering replaces).
 * @param {{ name: string, apiVersion?: number, setup: Function, destroy?: Function }} def
 */
export function registerPlugin(def) {
  if (!def || typeof def.name !== 'string' || typeof def.setup !== 'function') {
    console.error(
      '[apexcharts] registerPlugin: a plugin needs a { name, setup } shape.',
    )
    return
  }
  getRegistry()[def.name] = def
}

/**
 * @param {string} name
 * @returns {any | null}
 */
export function getPlugin(name) {
  return getRegistry()[name] || null
}
