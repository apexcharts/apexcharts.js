// @ts-check
/**
 * Registering marks by name, so `pictogram: { mark: 'person' }` resolves.
 *
 * Passing the mark itself (`mark: person`) needs none of this and is the form
 * to reach for. Names exist for the cases where an object cannot travel: config
 * authored as JSON, a chart configured on the server, or a page that loaded the
 * library from a script tag.
 *
 * This writes to the same `globalThis` slot `ApexCharts.registerUnitMark`
 * reads, rather than importing the chart - the same arrangement
 * `src/unit-shapes/registry.js` uses, and for the same two reasons. The slot is
 * already the documented cross-instance contract (it is what makes one
 * registration survive duplicate CJS and ESM copies of the library), and
 * depending on it keeps this module free of any import from the chart, so it
 * adds nothing to a bundle that only uses the object form.
 *
 * See `src/modules/UnitMarkRegistry.js`, which owns the slot. A unit test
 * asserts the two agree, so the coupling cannot rot silently.
 *
 * @module pictograms/registry
 */

/** @typedef {import('./engine/mark.js').UnitMark} UnitMark */

const MARK_KEY = '__apexcharts_unit_marks__'

/** @returns {Record<string, any>} */
function marks() {
  const g = /** @type {any} */ (globalThis)
  if (!g[MARK_KEY]) g[MARK_KEY] = {}
  return g[MARK_KEY]
}

/**
 * Register marks under their own names.
 *
 * @param {UnitMark[]|Record<string, UnitMark>} defs an array (each mark knows
 *   its name) or a map, where the key wins, so a mark can be registered under a
 *   name of your own.
 * @returns {string[]} the names now registered
 */
export function registerMarks(defs) {
  const table = marks()
  /** @type {string[]} */
  const names = []
  const entries = Array.isArray(defs)
    ? defs.map((m) => [m ? m.name : '', m])
    : Object.entries(defs)
  entries.forEach(([name, mark]) => {
    const key = String(name)
    if (!key || !mark || typeof (/** @type {any} */ (mark).path) !== 'string') {
      return
    }
    table[key] = mark
    names.push(key)
  })
  return names
}

/**
 * Remove marks by name. Charts still pointing at one fall back to
 * `pictogram.fallback` on their next render.
 * @param {string[]|string} names
 */
export function unregisterMarks(names) {
  const table = marks()
  ;(Array.isArray(names) ? names : [names]).forEach((n) => {
    delete table[n]
  })
}

/**
 * The names currently registered, whatever registered them.
 * @returns {string[]}
 */
export function registeredMarkNames() {
  return Object.keys(marks())
}
