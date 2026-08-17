// @ts-check
/**
 * Turning a region into dot positions: the shape-agnostic half of the engine.
 *
 * The whole trick is step 3 below. A shape packed at a hard-coded spacing only
 * works at the dot count, plot size and aspect it was tuned for; bisecting the
 * gap instead means one outline serves 40 dots in a sparkline and 3000 in a
 * poster, because density follows the shape's own area.
 *
 *  1. rows across the region, `dy` apart
 *  2. each row cut into interior spans
 *  3. BISECT the gap: the largest `dx` whose spans still hold every dot
 *  4. split the dots across spans by largest remainder (so the count is exact),
 *     each span spreading its own dots to its own edges (so the outline is crisp)
 *
 * @module unit-shapes/engine/pack
 */

/** @typedef {import('./region.js').Region} Region */
/** @typedef {{ x: number, y: number, r: number, row: number, qx?: number, qd?: number }} Slot */

/**
 * One row's worth of a span, and how many dots it can hold.
 * @typedef {object} Cell
 * @property {number} y
 * @property {number} x0
 * @property {number} x1
 * @property {number} cap
 * @property {number} row
 */

/**
 * Cut the region into dot slots, top row first.
 *
 * A span holds as many dots as fit at `dx` once both ends are inset (so a dot's
 * body stays inside the outline). A span too narrow for that still keeps ONE
 * dot unless it is a sliver: that single rule is what keeps thin limbs, fins,
 * trunks and pointed tips alive instead of quietly dropping them.
 *
 * @param {Region} region
 * @param {number} dx centre-to-centre gap along a row
 * @param {number} dy gap between rows
 * @returns {{ cells: Cell[], capacity: number, inset: number }}
 */
export function rowSlots(region, dx, dy) {
  const inset = dx * 0.42
  const sliver = dx * 0.45
  const height = region.maxY - region.minY
  const rows = Math.max(1, Math.floor(height / dy))
  const top = region.minY + (height - rows * dy) / 2
  /** @type {Cell[]} */
  const cells = []
  let capacity = 0
  for (let r = 0; r < rows; r++) {
    const y = top + (r + 0.5) * dy
    const spans = region.spansAt(y)
    for (let s = 0; s < spans.length; s++) {
      const len = spans[s].x1 - spans[s].x0
      let cap
      if (len >= 2 * inset) cap = Math.floor((len - 2 * inset) / dx) + 1
      else cap = len >= sliver ? 1 : 0
      if (!cap) continue
      cells.push({ y, x0: spans[s].x0, x1: spans[s].x1, cap, row: r })
      capacity += cap
    }
  }
  return { cells, capacity, inset }
}

/**
 * Largest-remainder split of `total` across `weights`.
 *
 * Called with capacities as the weights, no share can exceed its own capacity
 * (since `floor(total * cap / sum) < cap` whenever `total < sum`), so a row
 * never overfills and the total is exact.
 *
 * @param {number[]} weights
 * @param {number} total
 * @returns {number[]}
 */
export function allocate(weights, total) {
  const out = new Array(weights.length).fill(0)
  let sum = 0
  for (let i = 0; i < weights.length; i++) sum += weights[i]
  if (!sum || total <= 0) return out
  let used = 0
  /** @type {{i:number, frac:number}[]} */
  const rest = []
  for (let i = 0; i < weights.length; i++) {
    const q = (total * weights[i]) / sum
    out[i] = Math.floor(q)
    used += out[i]
    rest.push({ i, frac: q - out[i] })
  }
  rest.sort((a, b) => b.frac - a.frac)
  for (let k = 0; used < total; k++, used++) out[rest[k % rest.length].i]++
  return out
}

/**
 * The largest gap whose slots still hold `count` dots.
 *
 * Capacity falls as the gap grows, so a bisection converges on the density the
 * shape's own area implies. 34 halvings take the bracket well below a pixel.
 *
 * @param {Region} region
 * @param {number} count
 * @param {number} rowRatio
 * @returns {number}
 */
export function fitSpacing(region, count, rowRatio) {
  let lo = 1
  let hi = Math.max(region.maxY - region.minY, 8)
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2
    if (rowSlots(region, mid, mid * rowRatio).capacity >= count) lo = mid
    else hi = mid
  }
  return lo
}

/**
 * Keep the engine's dot radius when it suits the gap this shape packed at, and
 * pull it into range when it does not.
 *
 * The chart sizes dots for the whole plot rect, treating it as a blob of equal
 * area. That is right for a blob and wrong for a shape covering part of the
 * rect: dots come out too small to read as a silhouette, or too large and merge
 * into one. `plotOptions.unit.spacing` still moves the radius inside the band.
 *
 * @param {number} r
 * @param {number} dx
 * @returns {number}
 */
export function fitRadius(r, dx) {
  return Math.min(Math.max(r, dx / 3.2), dx / 2.3)
}

/**
 * Comparators for `order`. Column and radius orders read a QUANTISED key: rows
 * spread to their own spans, so raw x never lines up between rows, and sorting
 * on it frays a category's band into a diagonal instead of a clean edge.
 * @type {Record<string, ((a: Slot, b: Slot) => number) | null>}
 */
const ORDERS = {
  rows: null,
  rowsUp: (a, b) => b.y - a.y || a.x - b.x,
  cols: (a, b) => (a.qx || 0) - (b.qx || 0) || a.y - b.y,
  colsRev: (a, b) => (b.qx || 0) - (a.qx || 0) || a.y - b.y,
  centerOut: (a, b) => (a.qd || 0) - (b.qd || 0) || a.y - b.y,
  centerIn: (a, b) => (b.qd || 0) - (a.qd || 0) || a.y - b.y,
}

/** @returns {string[]} */
export function orderNames() {
  return Object.keys(ORDERS)
}

/**
 * Hand the slots to the marks.
 *
 * Slots leave every layout in one canonical order (rows, top to bottom);
 * `order` re-reads them, and that is the only thing deciding where a category's
 * band lands in the shape, because the first category takes the first slots.
 *
 * @param {{id: string}[]} objects
 * @param {Slot[]} slots
 * @param {string} order
 * @param {number} pitch
 * @returns {{id: string, x: number, y: number, r: number}[]}
 */
export function assign(objects, slots, order, pitch) {
  const cmp = ORDERS[order] !== undefined ? ORDERS[order] : null
  let ordered = slots
  if (cmp) {
    let cx = 0
    let cy = 0
    slots.forEach((s) => {
      cx += s.x
      cy += s.y
    })
    cx /= slots.length || 1
    cy /= slots.length || 1
    const step = pitch > 0 ? pitch : 1
    slots.forEach((s) => {
      s.qx = Math.round(s.x / step)
      s.qd = Math.round(Math.hypot(s.x - cx, s.y - cy) / step)
    })
    ordered = slots.slice().sort(cmp)
  }
  /** @type {{id: string, x: number, y: number, r: number}[]} */
  const out = []
  for (let i = 0; i < objects.length && i < ordered.length; i++) {
    out.push({
      id: objects[i].id,
      x: ordered[i].x,
      y: ordered[i].y,
      r: ordered[i].r,
    })
  }
  return out
}

/**
 * Place a cell's dots along its span.
 *
 * Spreading a row to its own edges is what keeps the outline crisp. A row that
 * came out sparse would spread into visible holes instead, so past a threshold
 * it keeps the nominal gap and centres itself in the span.
 *
 * @param {Cell} cell
 * @param {number} n
 * @param {number} dx
 * @param {number} inset
 * @param {number} r
 * @param {Slot[]} into
 */
export function placeRow(cell, n, dx, inset, r, into) {
  if (n <= 0) return
  if (n === 1) {
    into.push({ x: (cell.x0 + cell.x1) / 2, y: cell.y, r, row: cell.row })
    return
  }
  let a = cell.x0 + inset
  const b = cell.x1 - inset
  let gap = (b - a) / (n - 1)
  if (gap > dx * 1.5) {
    gap = dx
    a = (cell.x0 + cell.x1) / 2 - (gap * (n - 1)) / 2
  }
  for (let j = 0; j < n; j++) {
    into.push({ x: a + j * gap, y: cell.y, r, row: cell.row })
  }
}
