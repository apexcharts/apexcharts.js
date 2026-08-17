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
 * Interior intervals of a STROKED centreline: the set of points within
 * `halfWidth` of the path.
 *
 * This is the region that lets thin glyphs into the collection at all. A
 * checkmark, an arrow, a wifi arc and a heartbeat trace have no interior to fill,
 * only a line and a thickness, so as outlines they would have to be authored as
 * closed polygons with both sides of every segment and every join drawn by hand.
 *
 * Why a region and not a layout. The tempting design is to walk the centreline
 * placing dots along it like beads, and it fails on capacity: a line of length L
 * holds L/pitch beads and no more, so a high dot count has to spill into parallel
 * lanes, at which point it has become area packing written a second time. Treating
 * the stroke as a region instead means the existing packer bisects the gap as
 * always, and the same glyph is two dots thick at 100 units and ten dots thick at
 * 3000, with no ceiling and no second code path.
 *
 * The geometry is closed-form, which is what keeps this small. A stroked segment
 * is a capsule: a rotated rectangle plus a disc at each end. A horizontal line
 * meets the rectangle in one interval (found from its edge crossings) and each
 * disc in one interval (found from the circle equation), and the union of the
 * intervals is the answer. Round caps and round joins come free from the discs,
 * and a centreline that crosses itself simply unions with itself, so there is no
 * join, cap or self-intersection case to special case.
 *
 * A closed centreline needs no wrap-around here: `flattenPath` appends the start
 * point for `Z`, so the closing segment is already in the point list.
 *
 * @param {Point[][]} polys centrelines in path units, from
 *   `flattenPath(d, tol, true)` so straight two-point glyphs survive
 * @param {{ scale: number, offX: number, offY: number }} tf
 * @param {number} halfWidth in PATH units; scaled with the shape
 * @returns {Region}
 */
export function strokeRegion(polys, tf, halfWidth) {
  const r = Math.max(1e-6, halfWidth * tf.scale)
  /** @type {{ax:number,ay:number,bx:number,by:number,nx:number,ny:number}[]} */
  const caps = []
  let minY = Infinity
  let maxY = -Infinity
  let minX = Infinity
  let maxX = -Infinity

  polys.forEach((pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const ax = tf.offX + pts[i].x * tf.scale
      const ay = tf.offY + pts[i].y * tf.scale
      const bx = tf.offX + pts[i + 1].x * tf.scale
      const by = tf.offY + pts[i + 1].y * tf.scale
      const len = Math.hypot(bx - ax, by - ay)
      // A zero-length segment contributes only its disc, which the endpoints
      // already cover, so the normal can be anything.
      const nx = len > 1e-9 ? (-(by - ay) / len) * r : r
      const ny = len > 1e-9 ? ((bx - ax) / len) * r : 0
      caps.push({ ax, ay, bx, by, nx, ny })
      if (Math.min(ax, bx) - r < minX) minX = Math.min(ax, bx) - r
      if (Math.max(ax, bx) + r > maxX) maxX = Math.max(ax, bx) + r
      if (Math.min(ay, by) - r < minY) minY = Math.min(ay, by) - r
      if (Math.max(ay, by) + r > maxY) maxY = Math.max(ay, by) + r
    }
  })

  if (!caps.length) {
    return { minY: 0, maxY: 0, minX: 0, maxX: 0, spansAt: () => [] }
  }

  // Same banding as the polygon region, and for the same reason: fitting the gap
  // rescans every row ~34 times, so a row query must not touch every capsule.
  const height = Math.max(1e-6, maxY - minY)
  /** @type {typeof caps[]} */
  const bands = []
  for (let k = 0; k < BANDS; k++) bands.push([])
  caps.forEach((c) => {
    const lo = Math.min(c.ay, c.by) - r
    const hi = Math.max(c.ay, c.by) + r
    let i0 = Math.floor(((lo - minY) / height) * BANDS)
    let i1 = Math.floor(((hi - minY) / height) * BANDS)
    i0 = Math.max(0, Math.min(BANDS - 1, i0))
    i1 = Math.max(0, Math.min(BANDS - 1, i1))
    for (let i = i0; i <= i1; i++) bands[i].push(c)
  })

  /**
   * Interval where the row meets a disc, or null.
   * @param {number} cx @param {number} cy @param {number} y
   * @returns {Span | null}
   */
  const disc = (cx, cy, y) => {
    const dy = y - cy
    if (dy <= -r || dy >= r) return null
    const half = Math.sqrt(r * r - dy * dy)
    return { x0: cx - half, x1: cx + half }
  }

  /** @type {(y: number) => Span[]} */
  const spansAt = (y) => {
    const bi = Math.floor(((y - minY) / height) * BANDS)
    if (bi < 0 || bi > BANDS - 1) return []
    const list = bands[bi]
    /** @type {Span[]} */
    const parts = []

    for (let i = 0; i < list.length; i++) {
      const c = list[i]
      // The rotated rectangle: four corners, offset either side of the segment.
      const qx = [c.ax + c.nx, c.bx + c.nx, c.bx - c.nx, c.ax - c.nx]
      const qy = [c.ay + c.ny, c.by + c.ny, c.by - c.ny, c.ay - c.ny]
      let lo = Infinity
      let hi = -Infinity
      for (let k = 0; k < 4; k++) {
        const j = (k + 1) % 4
        const y0 = qy[k]
        const y1 = qy[j]
        // Half-open, so a corner shared by two edges is counted once.
        if (y0 === y1) continue
        const top = Math.min(y0, y1)
        const bot = Math.max(y0, y1)
        if (y < top || y >= bot) continue
        const x = qx[k] + ((y - y0) / (y1 - y0)) * (qx[j] - qx[k])
        if (x < lo) lo = x
        if (x > hi) hi = x
      }
      if (hi > lo) parts.push({ x0: lo, x1: hi })

      const da = disc(c.ax, c.ay, y)
      if (da) parts.push(da)
      const db = disc(c.bx, c.by, y)
      if (db) parts.push(db)
    }

    if (!parts.length) return []
    // Merge: adjacent capsules always overlap at their shared joint, so without
    // this a row would be handed a dozen overlapping intervals and the packer
    // would place a dot in each.
    parts.sort((a, b) => a.x0 - b.x0)
    /** @type {Span[]} */
    const spans = [parts[0]]
    for (let i = 1; i < parts.length; i++) {
      const last = spans[spans.length - 1]
      if (parts[i].x0 <= last.x1) {
        if (parts[i].x1 > last.x1) last.x1 = parts[i].x1
      } else {
        spans.push(parts[i])
      }
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
