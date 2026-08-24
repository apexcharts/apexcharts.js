// @ts-check
/**
 * A `globalThis`-backed registry of named unit-chart MARKS (pictograms),
 * the twin of UnitLayoutRegistry and registered the same way, so a mark
 * registered once (via `ApexCharts.registerUnitMark`) survives duplicate
 * CJS+ESM module instances and is resolvable by every chart on the page.
 *
 * The two registries divide the unit chart along the line the chart is built
 * on, and keeping them separate is the point:
 *
 *     LAYOUT  = where the marks go       (objects, rect) => positions
 *     MARK    = what one mark looks like  a glyph outline
 *
 * They compose freely. `positions: 'heart'` with `pictogram.mark: 'person'`
 * arranges person glyphs into a heart; the same mark on `positions: 'house'`
 * walks the same crowd into a house. Neither side knows about the other, so a
 * layout added later works with every mark, and vice versa.
 *
 * A mark is DATA, not a callable (a layout is a computation, a glyph is
 * geometry). That is what lets the chart resolve one draw spec per
 * (mark, size) and share it across thousands of units instead of calling into
 * the mark per dot.
 *
 * @typedef {object} UnitMark
 * @property {string} name
 * @property {string} path outline path data, in `viewBox` units
 * @property {[number,number,number,number]} viewBox [minX, minY, w, h]
 * @property {'nonzero'|'evenodd'} [fillRule]
 *
 * @module modules/UnitMarkRegistry
 */

const MARK_KEY = '__apexcharts_unit_marks__'

if (!/** @type {any} */ (globalThis)[MARK_KEY]) {
  ;/** @type {any} */ (globalThis)[MARK_KEY] = {}
}

/** @returns {Record<string, UnitMark>} */
function getMarks() {
  return /** @type {any} */ (globalThis)[MARK_KEY]
}

/**
 * Coerce whatever a caller supplied into a frozen mark, or null.
 *
 * Accepts a bare path string as sugar, because the 0..100 box is the catalog's
 * own convention and a one-off glyph should not need a wrapper object to use
 * it.
 *
 * @param {string|UnitMark|any} def
 * @param {string} [name]
 * @returns {UnitMark|null}
 */
export function normalizeUnitMark(def, name) {
  if (typeof def === 'string') {
    const d = def.trim()
    if (!d) return null
    return Object.freeze({
      name: name || 'anonymous',
      path: d,
      viewBox: /** @type {[number,number,number,number]} */ ([0, 0, 100, 100]),
    })
  }
  if (!def || typeof def !== 'object') return null
  if (typeof def.path !== 'string' || !def.path.trim()) return null
  const vb = Array.isArray(def.viewBox) && def.viewBox.length === 4
    ? def.viewBox.map(Number)
    : [0, 0, 100, 100]
  if (!vb.every((/** @type {number} */ n) => isFinite(n)) || vb[2] <= 0 || vb[3] <= 0) {
    return null
  }
  return Object.freeze({
    ...def,
    name: name || def.name || 'anonymous',
    path: def.path.trim(),
    viewBox: /** @type {[number,number,number,number]} */ (
      /** @type {any} */ (vb)
    ),
    fillRule: def.fillRule === 'evenodd' ? 'evenodd' : undefined,
  })
}

/**
 * Register a named mark, usable as `plotOptions.unit.pictogram.mark: '<name>'`.
 *
 * @param {string} name
 * @param {string|UnitMark} def A path string in a 0..100 box, or
 *   `{path, viewBox?, fillRule?}`. Fill-only: a uniform `scale()` positions the
 *   glyph, so any stroke width would scale with it.
 */
export function registerUnitMark(name, def) {
  if (!name || typeof name !== 'string') {
    console.warn('ApexCharts: registerUnitMark requires a non-empty name.')
    return
  }
  const mark = normalizeUnitMark(def, name)
  if (!mark) {
    console.warn(
      `ApexCharts: registerUnitMark("${name}") expects path data, or ` +
        `{path, viewBox?, fillRule?}.`,
    )
    return
  }
  getMarks()[name] = mark
}

/**
 * Look up a registered mark (or null).
 * @param {string} name
 * @returns {UnitMark|null}
 */
export function getUnitMark(name) {
  if (!name) return null
  return getMarks()[name] || null
}

/**
 * Remove a registered mark. Charts referencing it by name fall back to
 * `pictogram.fallback` on their next render.
 * @param {string} name
 */
export function unregisterUnitMark(name) {
  delete getMarks()[name]
}

/** @returns {string[]} */
export function registeredUnitMarkNames() {
  return Object.keys(getMarks())
}
