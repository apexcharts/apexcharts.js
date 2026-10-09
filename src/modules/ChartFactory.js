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
 *     types it includes; standard.js registers the default set, sub-entries
 *     a subset, allowing bundlers to tree-shake unused chart classes.
 *
 * @module ChartFactory
 */

import {
  RENDERER_ENTRIES,
  RESERVED_TYPES,
  TYPE_ALIASES,
  TYPE_FEATURES,
} from './settings/TypeAliases'

const REGISTRY_KEY = '__apexcharts_registry__'
// Marks (#11): names registered via registerSeriesType, so dispatch + the
// canvas-promotion heuristic can tell a custom series from a built-in without
// duplicating the built-in list. globalThis-backed like the type registry.
const CUSTOM_KEY = '__apexcharts_custom_types__'

if (!/** @type {any} */ (globalThis)[REGISTRY_KEY]) {
  ;/** @type {any} */ (globalThis)[REGISTRY_KEY] = {}
}
// Types already reported missing, so each is said once per page however many
// charts ask for it. globalThis-backed like the rest.
const MISSING_KEY = '__apexcharts_missing_types__'

if (!/** @type {any} */ (globalThis)[CUSTOM_KEY]) {
  ;/** @type {any} */ (globalThis)[CUSTOM_KEY] = new Set()
}
if (!(/** @type {any} */ (globalThis)[MISSING_KEY])) {
  ;/** @type {any} */ (globalThis)[MISSING_KEY] = new Set()
}

/** @returns {Record<string, new (...args: any[]) => any>} */
function getRegistry() {
  return /** @type {any} */ (globalThis)[REGISTRY_KEY]
}

/** @returns {Set<string>} */
function getCustomTypes() {
  return /** @type {any} */ (globalThis)[CUSTOM_KEY]
}

/**
 * Mark a type name as a custom (Marks) series type.
 * @param {string} name
 */
export function markCustom(name) {
  getCustomTypes().add(name)
}

/**
 * Whether a type name is a registered custom (Marks) series type.
 * @param {string} name
 * @returns {boolean}
 */
export function isCustom(name) {
  return getCustomTypes().has(name)
}

/**
 * Whether a chart type is registered (built-in or custom). Non-throwing lookup
 * so callers can guard without try/catch.
 * @param {string} type
 * @returns {boolean}
 */
export function hasChartClass(type) {
  return !!getRegistry()[type]
}

/**
 * Remove a registered type + its custom flag. Used by
 * ApexCharts.unregisterSeriesType (tests, hot-reload); built-ins re-register on
 * the next entry-point import, custom types are simply gone.
 * @param {string} name
 */
export function unregister(name) {
  delete getRegistry()[name]
  getCustomTypes().delete(name)
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
 * @param {string} type the renderer's type, after alias resolution
 * @param {string} [requested] what the user wrote, when that was an alias
 *   (`chart.requestedType`): `waffle` draws as `unit`, `raincloud` as `violin`
 * @returns {new (...args: any[]) => any}
 */
export function getChartClass(type, requested) {
  const Cls = getRegistry()[type]
  if (!Cls) {
    // Say it in the user's terms. A raincloud on a page without the violin
    // renderer used to report "violin", a type nobody on that page asked for,
    // and point at an import that still leaves the raincloud statistics out.
    // Only an alias that draws through THIS renderer's entry counts: a combo's
    // series can need a renderer the chart's own (aliased) type does not.
    // Compared by entry because Core asks for the family's class: a
    // streamgraph (rangeArea) is drawn by 'line'.
    const family = (/** @type {string} */ t) => RENDERER_ENTRIES[t] || t
    const alias =
      requested &&
      TYPE_ALIASES[requested] &&
      family(TYPE_ALIASES[requested]) === family(type)
        ? requested
        : undefined
    const name = alias || type
    // An alias whose statistics live in a feature (a waterfall, a raincloud)
    // has an entry of its own that brings both; its script-tag route is the
    // renderer's file, then the feature's.
    const feature = alias ? TYPE_FEATURES[alias] : undefined
    const entry = feature ? alias : family(type)
    const files = feature
      ? [`${family(type)}.js`, `features/${feature}.js`]
      : [`${family(type)}.js`]
    const tags = files
      .map((f) => `<script src=".../dist/${f}">`)
      .join(' and ')
    // Two kinds of missing. An OPT-IN type (RESERVED_TYPES) is not in the
    // default bundle at all, so "load apexcharts.min.js instead" would send the
    // reader to download a file that meets them with this same error; the
    // full bundle is the one-file answer. Any other type is in the default
    // bundle and missing only because the page assembled from the lean core,
    // so the default bundle is the smaller fix.
    //
    // The script-tag line names no particular core file: a sub-entry registers
    // onto whichever shared class is already present, default bundle included.
    const optIn = RESERVED_TYPES.includes(type)
    const message =
      `ApexCharts: chart type "${name}" is not registered` +
      (name !== type ? ` (it draws through "${type}")` : '') +
      `. Bundler: import 'apexcharts/${entry}'` +
      (optIn ? ` (or import ApexCharts from 'apexcharts/full')` : '') +
      `. Script tag: add ${tags} after the ApexCharts script` +
      (optIn
        ? `, or load apexcharts.full.min.js instead, which has every type. ` +
          `This type is not in the default apexcharts.min.js.`
        : `, or load the default apexcharts.min.js instead.`)
    // The throw alone reaches nobody on the commonest path. render() keeps its
    // own rejection handled, so a page that calls chart.render() without
    // awaiting it (every sample, every theme) got no console line and no
    // unhandled rejection, just an empty frame. Say it once per type, through
    // globalThis.console: the minified bundle's drop_console strips calls on
    // the bare `console` and leaves this one.
    const missing = /** @type {Set<string>} */ (
      /** @type {any} */ (globalThis)[MISSING_KEY]
    )
    if (!missing.has(name)) {
      missing.add(name)
      globalThis.console.error(message)
    }
    throw new Error(message)
  }
  return Cls
}
