// @ts-check
/**
 * Chart Factory - Runtime registry for chart type classes.
 *
 * The registry is stored on `globalThis` so that multiple copies of this
 * module (e.g. from bundler deduplication failures or dual CJS/ESM instances)
 * all share a single registry. Without this, calling ApexCharts.use() in one
 * module copy and rendering in another silently loses the registration.
 *
 * The registry is populated at module load time by whichever entry point is
 * used:
 *   - Each entry point (src/entries/*.js) calls ApexCharts.use() with the
 *     types it includes; full.js registers all, sub-entries register a subset,
 *     allowing bundlers to tree-shake unused chart classes.
 *
 * @module ChartFactory
 */

const REGISTRY_KEY = '__apexcharts_registry__'

if (!/** @type {any} */ (globalThis)[REGISTRY_KEY]) {
  ;/** @type {any} */ (globalThis)[REGISTRY_KEY] = {}
}

/** @returns {Record<string, new (...args: any[]) => any>} */
function getRegistry() {
  return /** @type {any} */ (globalThis)[REGISTRY_KEY]
}

/**
 * Register one or more chart type constructors.
 *
 * @param {Record<string, new (...args: any[]) => any>} typeMap  e.g. { line: Line, area: Line }
 */
export function register(typeMap) {
  Object.assign(getRegistry(), typeMap)
}

/**
 * Look up the constructor for a chart type.
 * Throws a clear error if the type was not registered.
 *
 * @param {string} type
 * @returns {new (...args: any[]) => any}
 */
export function getChartClass(type) {
  const Cls = getRegistry()[type]
  if (!Cls) {
    throw new Error(
      `ApexCharts: chart type "${type}" is not registered. ` +
        `Import it via ApexCharts.use() or use the full apexcharts bundle.`,
    )
  }
  return Cls
}
