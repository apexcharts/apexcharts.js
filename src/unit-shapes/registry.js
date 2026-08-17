// @ts-check
/**
 * Registering shapes by name, so `positions: 'heart'` resolves.
 *
 * Passing the layout itself (`positions: heart`) needs none of this and is the
 * form to reach for. Names exist for the cases where a function cannot travel:
 * config authored as JSON, a chart configured on the server, or a page that
 * loaded the library from a script tag.
 *
 * This writes to the same `globalThis` slot `ApexCharts.registerUnitLayout`
 * reads, rather than importing the chart, for two reasons. The slot is already
 * the documented cross-instance contract (it is what makes one registration
 * survive duplicate CJS and ESM copies of the library), and depending on it
 * keeps this module free of any import from the chart, so it stays extractable
 * and adds nothing to a bundle that only uses the function form.
 *
 * See `src/modules/UnitLayoutRegistry.js`, which owns the slot. A unit test
 * asserts the two agree, so the coupling cannot rot silently.
 *
 * @module unit-shapes/registry
 */

/** @typedef {import('./engine/shape.js').UnitShape} UnitShape */

const LAYOUT_KEY = '__apexcharts_unit_layouts__'

/** @returns {Record<string, Function>} */
function layouts() {
  const g = /** @type {any} */ (globalThis)
  if (!g[LAYOUT_KEY]) g[LAYOUT_KEY] = {}
  return g[LAYOUT_KEY]
}

/**
 * Register shapes under their own names.
 *
 * @param {UnitShape[]|Record<string, UnitShape>} shapes an array (each shape
 *   knows its name) or a map, where the key wins, so a shape can be registered
 *   under a name of your own.
 * @returns {string[]} the names now registered
 */
export function registerShapes(shapes) {
  const table = layouts()
  /** @type {string[]} */
  const names = []
  const entries = Array.isArray(shapes)
    ? shapes.map((s) => [s.shape ? s.shape.name : '', s])
    : Object.entries(shapes)
  entries.forEach(([name, shape]) => {
    const key = String(name)
    const fn = /** @type {UnitShape} */ (shape)
    if (!key || typeof fn !== 'function') return
    table[key] = fn
    names.push(key)
  })
  return names
}

/**
 * Remove shapes by name. Charts still pointing at one fall back to the grouped
 * layout on their next render.
 * @param {string[]|string} names
 */
export function unregisterShapes(names) {
  const table = layouts()
  ;(Array.isArray(names) ? names : [names]).forEach((n) => {
    delete table[n]
  })
}

/**
 * The names currently registered, whatever registered them.
 * @returns {string[]}
 */
export function registeredShapeNames() {
  return Object.keys(layouts())
}
