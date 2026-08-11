// @ts-check
/**
 * A `globalThis`-backed registry of pre-parse series transforms, mirroring
 * ChartFactory's type registry, ThemeRegistry and UnitLayoutRegistry so a
 * transform registered once survives duplicate CJS+ESM module instances.
 *
 * A transform is the contract for a chart type whose series carries **raw
 * observations** rather than the values it draws:
 *
 *     (series, w) => series
 *
 * It runs at the top of `Data.parseData`, before anything reads the data, and
 * returns the rows the renderer should draw. A histogram bins a sample into
 * counts; a boxPlot could derive its quartiles from the observations; a violin
 * could estimate its own density. All three are the same missing capability,
 * and all three are statistics rather than rendering, which is why they live
 * behind an opt-in import (`apexcharts/features/stats`) instead of in core.
 *
 * Core keeps only this lookup, so a bundle that never asks for a raw-sample
 * type never pays for the statistics.
 *
 * @module modules/SeriesTransformRegistry
 */

const TRANSFORM_KEY = '__apexcharts_series_transforms__'

if (!/** @type {any} */ (globalThis)[TRANSFORM_KEY]) {
  ;/** @type {any} */ (globalThis)[TRANSFORM_KEY] = {}
}

/** @returns {Record<string, Function>} */
function getTransforms() {
  return /** @type {any} */ (globalThis)[TRANSFORM_KEY]
}

/**
 * Register a transform for a chart type name (matched against
 * `chart.requestedType` first, then `chart.type`).
 *
 * @param {string} name
 * @param {(ser: any[], w: any) => any[]} fn
 */
export function registerSeriesTransform(name, fn) {
  if (!name || typeof name !== 'string') {
    console.warn(
      'ApexCharts: registerSeriesTransform requires a non-empty name.',
    )
    return
  }
  if (typeof fn !== 'function') {
    console.warn(
      `ApexCharts: registerSeriesTransform("${name}") expects a function (series, w) => series.`,
    )
    return
  }
  getTransforms()[name] = fn
}

/**
 * Look up a registered transform (or null).
 * @param {string} name
 * @returns {Function|null}
 */
export function getSeriesTransform(name) {
  if (!name) return null
  return getTransforms()[name] || null
}

/**
 * Remove a registered transform.
 * @param {string} name
 */
export function unregisterSeriesTransform(name) {
  delete getTransforms()[name]
}
