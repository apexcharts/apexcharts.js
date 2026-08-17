// @ts-check
/**
 * The stroke layout: pack the dots into a thickened centreline.
 *
 * Same packer as the silhouette, different region. See `strokeRegion` for why a
 * stroke is a region rather than a layout of its own.
 *
 * @module unit-shapes/engine/stroke
 */

import { flattenPath, boundsOf } from './path.js'
import { strokeRegion, fitBox } from './region.js'
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
 * Flattening is pure, so it is cached by path text, exactly as the silhouette
 * caches outlines. Keyed separately because a stroke asks for two-point subpaths
 * to be kept and a fill asks for them to be dropped.
 * @type {Map<string, { polys: Point[][], bounds: {x0:number,y0:number,x1:number,y1:number} }>}
 */
const cache = new Map()

/**
 * @param {string} path
 * @param {number} sampling
 */
function centreline(path, sampling) {
  const key = `${sampling}|${path}`
  let hit = cache.get(key)
  if (!hit) {
    // keepLines: a straight glyph is two points, and a fill would rightly drop it.
    const polys = flattenPath(path, sampling, true)
    hit = { polys, bounds: boundsOf(polys) }
    cache.set(key, hit)
  }
  return hit
}

/**
 * @param {ShapeMeta} meta
 * @returns {UnitLayout}
 */
function build(meta) {
  const path = meta.path || ''
  const order = meta.order || 'rows'
  const padding = meta.padding == null ? 0.94 : meta.padding
  const rowRatio = meta.rowRatio == null ? 0.88 : meta.rowRatio
  const sampling = meta.sampling == null ? 0.6 : meta.sampling
  const half = Math.max(0.5, (meta.width == null ? 16 : meta.width) / 2)

  return (objects, rect) => {
    if (!objects.length || !path) return []
    const { polys, bounds } = centreline(path, sampling)
    if (!polys.length) return []

    // The stroke reaches half a width beyond the centreline on every side, so the
    // box being fitted has to include it. Fit the bare centreline instead and the
    // glyph is scaled to the plot and then clipped by exactly that margin.
    const tf = fitBox(
      {
        x0: bounds.x0 - half,
        y0: bounds.y0 - half,
        x1: bounds.x1 + half,
        y1: bounds.y1 + half,
      },
      rect,
      padding,
    )
    const region = strokeRegion(polys, tf, half)
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
 * A stroke shape: dots packed into a line of a given thickness.
 *
 * Use this where the thing has no interior. A checkmark, an arrow, a wifi arc or
 * a heartbeat trace is a line and a width, and authoring one as a filled outline
 * would mean drawing both sides of every segment and mitring every corner by
 * hand. `path` is a CENTRELINE, so it may be open, and `width` is in the same
 * path units as the coordinates so it scales with the shape.
 *
 * Strokes degrade more gracefully than silhouettes: a thin silhouette feature
 * disappears below its `minUnits`, while a stroke becomes a dotted line, and a
 * dotted checkmark still reads as a checkmark.
 *
 * @param {ShapeMeta} meta must carry `name` and `path`; `width` defaults to 16
 * @returns {UnitShape}
 */
export function stroke(meta) {
  return defineShape({ ...meta, kind: 'stroke' }, build)
}

/**
 * Your own centreline, packed like the catalog's strokes. The counterpart to
 * `shapeFrom` for things that are lines rather than areas.
 *
 * @param {string} path
 * @param {Partial<ShapeMeta>} [opts]
 * @returns {UnitShape}
 */
export function strokeFrom(path, opts = {}) {
  return stroke({ name: 'custom-stroke', ...opts, path })
}

/**
 * The hollow version of a filled shape: trace its outline instead of filling it.
 *
 * Every silhouette already carries the one thing this needs, its outline, and a
 * stroked closed path is a ring, so the whole catalog gains a second look for no
 * new artwork. A hollow heart of 300 dots and a solid one of 300 dots are
 * different charts: the hollow one spends all of them on the edge, which is where
 * the shape actually lives.
 *
 * Deliberately a helper rather than 30-odd new catalog entries. The names are
 * frozen at v1, and doubling the namespace to express one transformation would be
 * a poor trade.
 *
 * @param {UnitShape} shape any silhouette (a shape with a `path`)
 * @param {number} [width] stroke thickness in path units (14)
 * @returns {UnitShape}
 */
export function outlined(shape, width = 14) {
  const meta = shape.shape
  if (!meta.path) {
    throw new Error(
      `[ApexCharts] outlined(): "${meta.name}" has no outline to trace. ` +
        `The generated shapes (rings, globe, tiers) compute positions directly, ` +
        `so there is no path to stroke.`,
    )
  }
  return stroke({
    ...meta,
    name: `${meta.name}-outline`,
    width,
    // A traced outline is thinner than the solid it came from, so it needs more
    // dots before it closes into a continuous line.
    minUnits: Math.max(meta.minUnits || 0, 120),
  })
}
