// @ts-check
/**
 * What a shape IS, as an object.
 *
 * Every entry in the catalog is a callable layout: `positions: heart` works with
 * no registration, no globals and nothing to tree-shake around, because
 * `plotOptions.unit.positions` already accepts a function. Variants come from
 * `heart.with({ order: 'cols' })` rather than from calling the layout itself
 * with options, so the layout signature stays one thing and shapes stay
 * immutable. Metadata rides on `.shape`, which is what the docs gallery and the
 * shape-lint suite read.
 *
 * @module unit-shapes/engine/shape
 */

/**
 * One mark, as the chart hands it over.
 * @typedef {object} UnitObject
 * @property {string} id
 * @property {number} index
 * @property {number} seriesIndex
 * @property {number} dataPointIndex
 * @property {string} label
 * @property {number} [value]
 * @property {any} datum
 * @property {number} r the radius the chart chose
 */

/** @typedef {{ x: number, y: number, width: number, height: number }} Rect */
/** @typedef {{ id: string, x: number, y: number, r?: number }} UnitPosition */
/** @typedef {(objects: UnitObject[], rect: Rect) => UnitPosition[]} UnitLayout */

/**
 * @typedef {object} ShapeMeta
 * @property {string} name registered name, and the export name. Frozen at v1:
 *   renaming one is a breaking change.
 * @property {string} [category] 'nature' | 'objects' | 'people' | 'business' |
 *   'technology' | 'symbols'
 * @property {number} [minUnits] below this the shape stops reading. Enforced by
 *   the shape-lint suite and warned about in development.
 * @property {string} [kind] 'silhouette' | 'rings' | 'globe' | 'tiers'
 * @property {string} [path] outline, for silhouettes
 * @property {string} [order] which slots the first category takes
 * @property {number} [padding]
 * @property {number} [rowRatio]
 * @property {string} [fillRule]
 * @property {number} [sampling]
 * @property {number} [tilt]
 * @property {number} [twist]
 * @property {'original' | 'generated'} [source] provenance. Only these two
 *   values are permitted, and the shape-lint suite enforces it:
 *
 *   - 'original': the outline was authored here. Looking at references while
 *     drawing is normal; reproducing a particular icon set's rendering of an
 *     object, even retraced by eye, is not.
 *   - 'generated': there is no outline at all, positions come from maths.
 *
 *   No third-party path may enter the catalog, including permissively licensed
 *   ones. The paths are redistributed verbatim inside dist/unit-shapes.js
 *   whatever we render them as, so a copied outline is a copy we shipped, and
 *   MIT/Apache/CC-BY notices would then have to travel into every consumer's
 *   bundle forever. Drawing them ourselves is cheaper than that obligation.
 *   Brand marks and logos are excluded outright: trademark has no originality
 *   threshold to fall back on.
 * @property {{ minSeparation?: number }} [lint] per-shape lint thresholds
 */

/** @typedef {UnitLayout & { shape: ShapeMeta, with: (o: Partial<ShapeMeta>) => UnitShape }} UnitShape */

/** @type {Set<string>} */
const warned = new Set()

/**
 * Wrap a built layout as a catalog shape.
 *
 * @param {ShapeMeta} meta
 * @param {(meta: ShapeMeta) => UnitLayout} build
 * @returns {UnitShape}
 */
export function defineShape(meta, build) {
  const inner = build(meta)
  const min = meta.minUnits || 0

  /** @type {any} */
  const layout = (/** @type {UnitObject[]} */ objects, /** @type {Rect} */ rect) => {
    // The count a shape needs to stay recognisable is part of its definition,
    // so it is worth saying out loud rather than rendering mush.
    if (min && objects.length && objects.length < min && !warned.has(meta.name)) {
      warned.add(meta.name)
      console.warn(
        `[ApexCharts] unit shape "${meta.name}" reads best from about ` +
          `${min} units; this chart has ${objects.length}. Use a smaller ` +
          `plotOptions.unit.unitValue, or a simpler shape.`,
      )
    }
    return inner(objects, rect)
  }

  layout.shape = Object.freeze({ ...meta })
  layout.with = (/** @type {Partial<ShapeMeta>} */ overrides) =>
    defineShape({ ...meta, ...overrides }, build)

  return /** @type {UnitShape} */ (layout)
}

/**
 * Reset the "already warned" set. Test-only.
 */
export function _resetWarnings() {
  warned.clear()
}
