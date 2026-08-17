// @ts-check
/**
 * The silhouette layout: pack the dots into an SVG outline.
 *
 * @module unit-shapes/engine/silhouette
 */

import { flattenPath, boundsOf } from './path.js'
import { polygonRegion, fitBox } from './region.js'
import {
  rowSlots,
  allocate,
  fitSpacing,
  fitRadius,
  assign,
  placeRow,
} from './pack.js'
import { defineShape } from './shape.js'

/** @typedef {import('./path.js').Point} Point */
/** @typedef {import('./shape.js').ShapeMeta} ShapeMeta */
/** @typedef {import('./shape.js').UnitShape} UnitShape */
/** @typedef {import('./shape.js').UnitLayout} UnitLayout */

/**
 * Flattening is pure, so it is cached by path text: `.with()` variants and two
 * shapes sharing an outline all reuse one polygon set, and no shape pays for it
 * until it is first drawn.
 * @type {Map<string, { polys: Point[][], bounds: {x0:number,y0:number,x1:number,y1:number} }>}
 */
const cache = new Map()

/**
 * @param {string} path
 * @param {number} sampling
 */
function outline(path, sampling) {
  const key = `${sampling}|${path}`
  let hit = cache.get(key)
  if (!hit) {
    const polys = flattenPath(path, sampling)
    hit = { polys, bounds: boundsOf(polys) }
    cache.set(key, hit)
  }
  return hit
}

/**
 * Build a silhouette layout from a shape definition.
 *
 * @param {ShapeMeta} meta
 * @returns {UnitLayout}
 */
function build(meta) {
  const path = meta.path || ''
  const order = meta.order || 'rows'
  const padding = meta.padding == null ? 0.94 : meta.padding
  const rowRatio = meta.rowRatio == null ? 0.88 : meta.rowRatio
  const evenOdd = meta.fillRule === 'evenodd'
  const sampling = meta.sampling == null ? 0.6 : meta.sampling

  return (objects, rect) => {
    if (!objects.length || !path) return []
    const { polys, bounds } = outline(path, sampling)
    if (!polys.length) return []

    const tf = fitBox(bounds, rect, padding)
    const region = polygonRegion(polys, tf, { evenOdd })
    const dx = fitSpacing(region, objects.length, rowRatio)
    const packed = rowSlots(region, dx, dx * rowRatio)
    if (!packed.cells.length) return []

    const counts = allocate(
      packed.cells.map((c) => c.cap),
      objects.length,
    )
    const r = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx)
    /** @type {import('./pack.js').Slot[]} */
    const slots = []
    packed.cells.forEach((cell, i) => {
      placeRow(cell, counts[i], dx, packed.inset, r, slots)
    })
    return assign(objects, slots, order, dx)
  }
}

/**
 * A silhouette shape: dots packed into an outline.
 *
 * @param {ShapeMeta} meta must carry `name` and `path`
 * @returns {UnitShape}
 */
export function silhouette(meta) {
  return defineShape({ ...meta, kind: 'silhouette' }, build)
}

/**
 * Turn your own outline into a unit layout. The curated catalog exists to prove
 * the quality bar and cover common cases; this is how a logo, a product
 * silhouette or a national symbol joins in without waiting for a release.
 *
 * Authoring rules: absolute `M` per subpath, no self-intersecting subpath,
 * overlapping subpaths union, and a subpath wound the other way is a hole.
 *
 * @param {string} path
 * @param {Partial<ShapeMeta>} [opts]
 * @returns {UnitShape}
 */
export function shapeFrom(path, opts = {}) {
  return silhouette({ name: 'custom', ...opts, path })
}
