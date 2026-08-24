// @ts-check
/**
 * The pictogram object model.
 *
 * A mark is deliberately DATA, not a callable - the opposite of a unit SHAPE,
 * which is a layout function. That split is the whole architecture:
 *
 *     shape / layout  = where the units go   (objects, rect) => positions
 *     mark / pictogram = what one unit is     an outline
 *
 * Keeping a mark inert is what lets the chart resolve one draw spec per
 * (mark, size) and share it across thousands of units, rather than calling into
 * the mark once per dot.
 *
 * @module pictograms/engine/mark
 */

/**
 * @typedef {object} MarkMeta
 * @property {string} name registered name, and the export name. Frozen at v1:
 *   renaming one is a breaking change.
 * @property {string} path the outline. Fill-only - the chart positions a glyph
 *   with a uniform `scale()`, so any stroke width would scale with it.
 * @property {[number,number,number,number]} [viewBox] defaults to [0,0,100,100],
 *   which is the catalog's convention.
 * @property {'nonzero'|'evenodd'} [fillRule]
 * @property {string} [category] 'people' | 'nature' | 'objects' | 'transport' |
 *   'symbols'
 * @property {'original'|'generated'} [source] provenance. Only these two values
 *   are permitted, and the mark lint enforces it. Every outline in this catalog
 *   is drawn here. No third-party path may enter it, including permissively
 *   licensed ones: an icon set's licence travels with its geometry, and a
 *   charting library cannot make that anyone else's problem downstream. Brand
 *   marks and logos are excluded outright.
 */

/** @typedef {Readonly<MarkMeta> & { with: (o: Partial<MarkMeta>) => UnitMark }} UnitMark */

/**
 * Define one pictogram.
 *
 * @param {MarkMeta} meta
 * @returns {UnitMark}
 */
export function definePictogram(meta) {
  const mark = /** @type {any} */ ({
    ...meta,
    viewBox: meta.viewBox || [0, 0, 100, 100],
  })
  mark.with = (/** @type {Partial<MarkMeta>} */ overrides) =>
    definePictogram({ ...meta, ...overrides })
  return Object.freeze(mark)
}
