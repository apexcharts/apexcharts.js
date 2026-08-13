// @ts-check
/**
 * A `globalThis`-backed registry of row sources, mirroring ChartFactory's type
 * registry, ThemeRegistry, UnitLayoutRegistry and SeriesTransformRegistry so a
 * source registered once survives duplicate CJS+ESM module instances.
 *
 * A row source answers one question about a chart: **what rows is each of its
 * marks standing for?**
 *
 *     (w, opts) => [{ name, data: [datum, ...] }, ...] | null
 *
 * The return value is a unit-chart series, one cluster per mark, one datum per
 * row, which is what makes a mark able to come apart into the rows it
 * aggregated (and reassemble from them).
 *
 * Most marks cannot answer. An ordinary bar is an aggregate over rows the
 * library never saw, so it has nothing to name. The types that can are the ones
 * whose series carries raw observations in the first place (histogram, boxPlot,
 * violin), which is why the sources ship with the statistics in
 * `apexcharts/features/stats` rather than in core. Core keeps only this lookup,
 * so a bundle that never explodes a mark never pays for it.
 *
 * ## The ordering contract
 *
 * A source MUST emit one cluster per mark, in the order the marks are drawn:
 * ascending `realIndex`, then ascending `j`. Marks with no rows still get their
 * (empty) cluster.
 *
 * This is not tidiness. The morph engine maps a unit chart's clusters onto the
 * outgoing chart's marks positionally (see `MorphTypeChange._buildMapping`), so
 * cluster `i` bursts out of mark `i`. Dropping an empty bin to make the output
 * neater shifts every cluster after it onto the wrong mark, and the failure is
 * silent: the dots simply leave from somewhere else.
 *
 * @module modules/RowSourceRegistry
 */

const ROW_SOURCE_KEY = '__apexcharts_row_sources__'

if (!/** @type {any} */ (globalThis)[ROW_SOURCE_KEY]) {
  ;/** @type {any} */ (globalThis)[ROW_SOURCE_KEY] = {}
}

/** @returns {Record<string, Function>} */
function getSources() {
  return /** @type {any} */ (globalThis)[ROW_SOURCE_KEY]
}

/**
 * Register a row source for a chart type name (matched against
 * `chart.requestedType` first, then `chart.type` — `histogram` reports the
 * former and renders as `bar`, so the alias is the only name that resolves).
 *
 * @param {string} name
 * @param {(w: any, opts?: any) => any[] | null} fn
 */
export function registerRowSource(name, fn) {
  if (!name || typeof name !== 'string') {
    console.warn('ApexCharts: registerRowSource requires a non-empty name.')
    return
  }
  if (typeof fn !== 'function') {
    console.warn(
      `ApexCharts: registerRowSource("${name}") expects a function (w, opts) => series.`,
    )
    return
  }
  getSources()[name] = fn
}

/**
 * Look up a registered row source (or null).
 * @param {string} name
 * @returns {Function|null}
 */
export function getRowSource(name) {
  if (!name) return null
  return getSources()[name] || null
}

/**
 * Remove a registered row source.
 * @param {string} name
 */
export function unregisterRowSource(name) {
  delete getSources()[name]
}

/**
 * Resolve the row source for a chart's state, checking the user-facing alias
 * before the internal renderer name.
 * @param {any} w
 * @returns {Function|null}
 */
export function rowSourceFor(w) {
  const cnf = w && w.config && w.config.chart
  if (!cnf) return null
  return getRowSource(cnf.requestedType) || getRowSource(cnf.type)
}
