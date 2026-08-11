// @ts-check
/**
 * A `globalThis`-backed registry of named unit-chart layouts, mirroring
 * ChartFactory's type registry and ThemeRegistry so a layout registered once
 * (via `ApexCharts.registerUnitLayout`) survives duplicate CJS+ESM module
 * instances and is resolvable by every chart on the page.
 *
 * A layout is the whole contract: **objects in, positions out**.
 *
 *     (objects, rect) => [{ id, x, y, r? }]
 *
 * `objects` is one entry per mark, carrying its identity and its datum; `rect`
 * is the plot area in the same pixel space the returned coordinates use. A
 * layout knows nothing about animation, keying or rendering: the engine already
 * tweens position, radius and colour, and already keeps a mark's identity
 * across a relayout, so a new arrangement is a pure function rather than a new
 * transition.
 *
 * That is what makes arrangements the engine cannot know about - a country
 * silhouette, a hex grid, a timeline, a projection supplied by ApexMaps -
 * plugins rather than core edits.
 *
 * @module modules/UnitLayoutRegistry
 */

const LAYOUT_KEY = '__apexcharts_unit_layouts__'

if (!/** @type {any} */ (globalThis)[LAYOUT_KEY]) {
  ;/** @type {any} */ (globalThis)[LAYOUT_KEY] = {}
}

/** @returns {Record<string, Function>} */
function getLayouts() {
  return /** @type {any} */ (globalThis)[LAYOUT_KEY]
}

/**
 * Register a named layout, usable as `plotOptions.unit.positions: '<name>'`.
 *
 * @param {string} name
 * @param {(objects: any[], rect: {x:number,y:number,width:number,height:number}) => any[]} fn
 *   Receives every mark and the plot rect; returns `[{id, x, y, r?}]` in plot
 *   pixels. Omitting a mark's id removes that mark (it animates out); ids that
 *   match no mark are ignored.
 */
export function registerUnitLayout(name, fn) {
  if (!name || typeof name !== 'string') {
    console.warn('ApexCharts: registerUnitLayout requires a non-empty name.')
    return
  }
  if (typeof fn !== 'function') {
    console.warn(
      `ApexCharts: registerUnitLayout("${name}") expects a function (objects, rect) => [{id, x, y}].`,
    )
    return
  }
  getLayouts()[name] = fn
}

/**
 * Look up a registered layout (or null).
 * @param {string} name
 * @returns {Function|null}
 */
export function getUnitLayout(name) {
  if (!name) return null
  return getLayouts()[name] || null
}

/**
 * Remove a registered layout. Charts referencing it by name fall back to the
 * grouped layout on their next render.
 * @param {string} name
 */
export function unregisterUnitLayout(name) {
  delete getLayouts()[name]
}
