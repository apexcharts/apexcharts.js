/**
 * Chart Factory - Runtime registry for chart type classes.
 *
 * The registry is populated at module load time by whichever entry point is
 * used:
 *   - Each entry point (src/entries/*.js) calls ApexCharts.use() with the
 *     types it includes; full.js registers all, sub-entries register a subset,
 *     allowing bundlers to tree-shake unused chart classes.
 *
 * @module ChartFactory
 */

/** @type {Record<string, Function>} */
const registry = {}

/**
 * Register one or more chart type constructors.
 *
 * @param {Record<string, Function>} typeMap  e.g. { line: Line, area: Line }
 */
export function register(typeMap) {
  Object.assign(registry, typeMap)
}

/**
 * Look up the constructor for a chart type.
 * Throws a clear error if the type was not registered.
 *
 * @param {string} type
 * @returns {Function}
 */
export function getChartClass(type) {
  const Cls = registry[type]
  if (!Cls) {
    throw new Error(
      `ApexCharts: chart type "${type}" is not registered. ` +
        `Import it via ApexCharts.use() or use the full apexcharts bundle.\n` +
        `If you already imported the entry (e.g. 'apexcharts/${type}'), your bundler may have ` +
        `created two separate copies of the ApexCharts module so the registration was lost. ` +
        `Add all apexcharts sub-entries to your bundler's deduplication config — ` +
        `for Vite add them to optimizeDeps.include in vite.config.`,
    )
  }
  return Cls
}
