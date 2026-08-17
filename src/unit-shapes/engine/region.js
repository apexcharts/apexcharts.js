// @ts-check
/**
 * A region is the packer's ONLY view of a shape: given a horizontal line, which
 * x-intervals are inside?
 *
 *     spansAt(y) => [{ x0, x1 }, ...]
 *
 * Everything downstream of that answer (fitting the dot gap, splitting dots
 * across rows, ordering, radius) is shape-agnostic, so a new kind of shape is a
 * new region rather than a new layout. That is the seam a stroke region will use
 * to cover thin glyphs (a checkmark, an arrow): the interior of a stroked
 * centreline is a union of capsules, whose row intersections are closed-form, so
 * it plugs in here without any new placement code.
 *
 * @module unit-shapes/engine/region
 */

/** @typedef {import('./path.js').Point} Point */
/** @typedef {{ x0: number, x1: number }} Span */
/**
 * @typedef {object} Region
 * @property {number} minY
 * @property {number} maxY
 * @property {number} minX
 * @property {number} maxX
 * @property {(y: number) => Span[]} spansAt
 */

const BANDS = 128

/**
 * Interior intervals of a polygon set along the line y, in PIXEL space (the
 * transform is baked in when the region is built, so the packer never converts
 * coordinates).
 *
 * Nonzero winding is the default because it is what makes shapes composable:
 * overlapping subpaths union (a tree canopy can simply overlap its trunk) and a
 * subpath wound the other way punches a hole (the door of a house, the porthole
 * of a rocket). Even-odd is available for outlines authored that way.
 *
 * @param {Point[][]} polys in path units
 * @param {{ scale: number, offX: number, offY: number }} tf
 * @param {{ evenOdd?: boolean }} [opts]
 * @returns {Region}
 */
export function polygonRegion(polys, tf, opts = {}) {
  const evenOdd = !!opts.evenOdd
  /** @type {{x0:number,y0:number,x1:number,y1:number}[]} */
  const edges = []
  let minY = Infinity
  let maxY = -Infinity
  let minX = Infinity
  let maxX = -Infinity

  polys.forEach((pts) => {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      const ax = tf.offX + a.x * tf.scale
      const ay = tf.offY + a.y * tf.scale
      const bx = tf.offX + b.x * tf.scale
      const by = tf.offY + b.y * tf.scale
      if (ax < minX) minX = ax
      if (bx < minX) minX = bx
      if (ax > maxX) maxX = ax
      if (bx > maxX) maxX = bx
      if (ay < minY) minY = ay
      if (by < minY) minY = by
      if (ay > maxY) maxY = ay
      if (by > maxY) maxY = by
      // A horizontal edge can neither open nor close a span.
      if (ay === by) continue
      edges.push({ x0: ax, y0: ay, x1: bx, y1: by })
    }
  })

  if (!edges.length) {
    return { minY: 0, maxY: 0, minX: 0, maxX: 0, spansAt: () => [] }
  }

  // Bucket edges by y so a row query touches a handful of them rather than all:
  // fitting the gap re-scans every row ~34 times, which is where the cost is.
  const height = Math.max(1e-6, maxY - minY)
  /** @type {{x0:number,y0:number,x1:number,y1:number}[][]} */
  const bands = []
  for (let k = 0; k < BANDS; k++) bands.push([])
  edges.forEach((e) => {
    const lo = Math.min(e.y0, e.y1)
    const hi = Math.max(e.y0, e.y1)
    let i0 = Math.floor(((lo - minY) / height) * BANDS)
    let i1 = Math.floor(((hi - minY) / height) * BANDS)
    i0 = Math.max(0, Math.min(BANDS - 1, i0))
    i1 = Math.max(0, Math.min(BANDS - 1, i1))
    for (let i = i0; i <= i1; i++) bands[i].push(e)
  })

  /** @type {(y: number) => Span[]} */
  const spansAt = (y) => {
    const bi = Math.floor(((y - minY) / height) * BANDS)
    if (bi < 0 || bi > BANDS - 1) return []
    const list = bands[bi]
    /** @type {{x:number, dir:number}[]} */
    const xs = []
    for (let i = 0; i < list.length; i++) {
      const e = list[i]
      const down = e.y1 > e.y0
      const lo = down ? e.y0 : e.y1
      const hi = down ? e.y1 : e.y0
      // Half-open in y, so a vertex shared by two edges is counted once.
      if (y < lo || y >= hi) continue
      xs.push({
        x: e.x0 + ((y - e.y0) / (e.y1 - e.y0)) * (e.x1 - e.x0),
        dir: down ? 1 : -1,
      })
    }
    if (xs.length < 2) return []
    xs.sort((a, b) => a.x - b.x)

    /** @type {Span[]} */
    const spans = []
    if (evenOdd) {
      for (let j = 0; j + 1 < xs.length; j += 2) {
        spans.push({ x0: xs[j].x, x1: xs[j + 1].x })
      }
      return spans
    }
    let wind = 0
    let start = 0
    for (let k = 0; k < xs.length; k++) {
      const was = wind
      wind += xs[k].dir
      if (was === 0 && wind !== 0) start = xs[k].x
      else if (was !== 0 && wind === 0) spans.push({ x0: start, x1: xs[k].x })
    }
    return spans
  }

  return { minY, maxY, minX, maxX, spansAt }
}

/**
 * Fit a shape's bounds into the plot rect at a UNIFORM scale. A shape stretched
 * to the plot's aspect stops being that shape, so the spare axis becomes margin.
 *
 * @param {{x0:number,y0:number,x1:number,y1:number}} bounds
 * @param {{x:number,y:number,width:number,height:number}} rect
 * @param {number} padding share of the rect to fill
 * @returns {{ scale: number, offX: number, offY: number }}
 */
export function fitBox(bounds, rect, padding) {
  const bw = Math.max(1e-6, bounds.x1 - bounds.x0)
  const bh = Math.max(1e-6, bounds.y1 - bounds.y0)
  const scale = Math.min(
    (rect.width * padding) / bw,
    (rect.height * padding) / bh,
  )
  return {
    scale,
    offX: rect.x + rect.width / 2 - (bounds.x0 + bw / 2) * scale,
    offY: rect.y + rect.height / 2 - (bounds.y0 + bh / 2) * scale,
  }
}
