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
 * @property {[number,number,number,number]} viewBox [minX, minY, w, h]. A
 *   caller may pass the SVG string form ('0 0 24 24'); it is stored as numbers.
 * @property {'nonzero'|'evenodd'} [fillRule]
 *
 * @module modules/UnitMarkRegistry
 */

const MARK_KEY = '__apexcharts_unit_marks__'

// Prototype-free, like the unit layout table, so a name such as
// 'constructor' is not already "registered"; the lookup checks own entries
// too, for a slot another copy made as `{}`.
const g = /** @type {any} */ (globalThis)
if (!g[MARK_KEY]) g[MARK_KEY] = Object.create(null)

/** @returns {Record<string, UnitMark>} */
function getMarks() {
  return /** @type {any} */ (globalThis)[MARK_KEY]
}

/**
 * Read a mark's viewBox: the array form `[minX, minY, w, h]`, or the string
 * form an SVG's own `viewBox` attribute uses (`'0 0 24 24'`, or comma
 * separated), so an icon's attribute can be pasted as it is. Absent (or an
 * empty string, as an empty attribute is) means the catalog's 0..100 box.
 *
 * @param {any} vb
 * @returns {[number,number,number,number]|null} null when it is given but is
 *   not 4 finite numbers with a positive width and height
 */
export function parseUnitMarkViewBox(vb) {
  if (vb == null || (typeof vb === 'string' && !vb.trim())) return [0, 0, 100, 100]
  const parts =
    typeof vb === 'string' ? vb.trim().split(/[\s,]+/) : Array.isArray(vb) ? vb : null
  if (!parts || parts.length !== 4) return null
  // An empty or blank entry is not a 0.
  const nums = parts.map((/** @type {any} */ n) =>
    typeof n === 'string' && !n.trim() ? NaN : Number(n),
  )
  if (!nums.every((n) => isFinite(n)) || nums[2] <= 0 || nums[3] <= 0) {
    return null
  }
  return /** @type {[number,number,number,number]} */ (nums)
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
  // A viewBox that cannot be read makes the mark undrawable rather than
  // quietly taking the 0..100 box: that box would draw a 24-unit icon at a
  // quarter of its size in the corner of its slot. The caller warns.
  const vb = parseUnitMarkViewBox(def.viewBox)
  if (!vb) return null
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
 *   `{path, viewBox?, fillRule?}`, where `viewBox` is `[minX, minY, w, h]` or
 *   the SVG string form `'0 0 24 24'`. Fill-only: a uniform `scale()` positions
 *   the glyph, so any stroke width would scale with it.
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
        `{path, viewBox?, fillRule?} with a viewBox of 4 numbers ` +
        `([0, 0, 24, 24] or '0 0 24 24') and a positive width and height.`,
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
  const table = getMarks()
  return Object.prototype.hasOwnProperty.call(table, name) ? table[name] : null
}

/**
 * Remove a registered mark. Charts referencing it by name fall back to
 * `pictogram.fallback` on their next render.
 * @param {string} name
 */
export function unregisterUnitMark(name) {
  delete getMarks()[name]
}
