// @ts-check
/**
 * Geometry and animation helpers for the morph engine's piece layer.
 *
 * A cross-type morph between one mark and N objects has no path to
 * interpolate, and fading the outgoing chart over the incoming one reads as a
 * double exposure: two pictures, both semi-visible, neither becoming the
 * other. The piece layer conserves the ink instead. The mark is cut into
 * exactly N cells, and each cell flies to one object while its corners round
 * off and its fill blends, so at every frame the total shape content is a
 * valid intermediate. Nothing fades; the old ink travels to where the new ink
 * is needed.
 *
 * Everything here is pure geometry or a self-contained rAF driver, imported
 * only by MorphTypeChange, so a bundle without the morph feature never pays
 * for it.
 *
 * @module modules/MorphPieces
 */
import { BrowserAPIs } from '../ssr/BrowserAPIs'

/**
 * Divide a bounding box into exactly `count` cells, as an aspect-ratio-aware
 * grid: rows run along the LONGER axis, `rows ~ sqrt(ratio * count)`, and any
 * remainder is distributed one extra cell per row from the first row on. The
 * cells tile the box exactly (last cell of a row closes on the box edge), so
 * mid-flight the pieces still read as the mark they came from.
 *
 * @param {{x:number, y:number, width:number, height:number}} bbox
 * @param {number} count
 * @returns {Array<{x:number, y:number, width:number, height:number}>}
 */
export function gridDivideRect(bbox, count) {
  if (!(count > 0)) return []
  if (count === 1) return [{ ...bbox }]

  const horizontal = bbox.width >= bbox.height
  const rowExtent = horizontal ? bbox.width : bbox.height
  const colExtent = horizontal ? bbox.height : bbox.width

  // A degenerate box (an empty histogram bin captures one with zero area)
  // still yields `count` stacked slivers, so the caller never has to special
  // case the pairing.
  const ratio = colExtent > 0 ? rowExtent / colExtent : count
  let rows = Math.max(1, Math.ceil(Math.sqrt(ratio * count)))
  if (rows > count) rows = count
  const baseCols = Math.floor(count / rows)
  let remainder = count - baseCols * rows

  /** @type {Array<{x:number, y:number, width:number, height:number}>} */
  const cells = []
  const rowSize = rowExtent / rows
  let rowStart = 0
  for (let r = 0; r < rows; r++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder--
    const colSize = cols > 0 ? colExtent / cols : 0
    for (let c = 0; c < cols; c++) {
      cells.push(
        horizontal
          ? {
              x: bbox.x + rowStart,
              y: bbox.y + c * colSize,
              width: rowSize,
              height: colSize,
            }
          : {
              x: bbox.x + c * colSize,
              y: bbox.y + rowStart,
              width: colSize,
              height: rowSize,
            },
      )
    }
    rowStart += rowSize
  }
  return cells
}

/**
 * Distance along a Hilbert curve for a point in the given extent.
 *
 * Sorting both the cells and their targets on this before zipping them keeps
 * the assignment spatially coherent: the left-most piece flies to the
 * left-most object instead of across the whole plot, which is the difference
 * between "coming apart" and a crossing storm. A plain row-major or z-order
 * sort still allows long diagonal jumps at row boundaries; the Hilbert curve
 * does not.
 *
 * @param {number} x
 * @param {number} y
 * @param {number} minX
 * @param {number} minY
 * @param {number} maxX
 * @param {number} maxY
 * @returns {number}
 */
export function hilbertIndex(x, y, minX, minY, maxX, maxY) {
  let ix = maxX === minX ? 0 : Math.round(32767 * ((x - minX) / (maxX - minX)))
  let iy = maxY === minY ? 0 : Math.round(32767 * ((y - minY) / (maxY - minY)))

  let d = 0
  // 16-bit curve; integer halving, so the loop ends at s = 1 rather than
  // decaying through subnormal floats.
  for (let s = 32768; s >= 1; s /= 2) {
    const rx = (ix & s) > 0 ? 1 : 0
    const ry = (iy & s) > 0 ? 1 : 0
    d += s * s * ((3 * rx) ^ ry)
    // Rotate the quadrant so the curve stays continuous.
    if (ry === 0) {
      if (rx === 1) {
        ix = s - 1 - ix
        iy = s - 1 - iy
      }
      const t = ix
      ix = iy
      iy = t
    }
  }
  return d
}

/**
 * Sort a copy of `items` by their Hilbert index over the extent implied by
 * the items themselves.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => [number, number]} getXY
 * @returns {T[]}
 */
export function sortByHilbert(items, getXY) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  const pts = items.map((it) => {
    const [x, y] = getXY(it)
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
    return [x, y]
  })
  return items
    .map((item, k) => ({
      item,
      d: hilbertIndex(pts[k][0], pts[k][1], minX, minY, maxX, maxY),
    }))
    .sort((a, b) => a.d - b.d)
    .map((e) => e.item)
}

/**
 * Parse a solid CSS colour into [r, g, b, a], or null for anything that
 * cannot be interpolated (gradients arrive as `url(#...)`, and a piece is
 * better off keeping one endpoint's colour than guessing at a gradient).
 *
 * @param {string|null|undefined} str
 * @returns {[number, number, number, number]|null}
 */
export function parseColor(str) {
  if (!str || typeof str !== 'string') return null
  const s = str.trim()
  if (s[0] === '#') {
    const hex = s.slice(1)
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        1,
      ]
    }
    if (hex.length === 6 || hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1,
      ]
    }
    return null
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/i)
  if (m) {
    const parts = m[1].split(',').map((p) => parseFloat(p))
    if (parts.length < 3 || parts.some((v) => !isFinite(v))) return null
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1]
  }
  return null
}

/**
 * A colour interpolator between two solid fills, or null when either end is
 * not a solid colour. The caller falls back to a hard switch at the far end.
 *
 * @param {string|null|undefined} from
 * @param {string|null|undefined} to
 * @returns {((t: number) => string) | null}
 */
export function makeColorLerp(from, to) {
  const a = parseColor(from)
  const b = parseColor(to)
  if (!a || !b) return null
  return (t) => {
    const r = Math.round(a[0] + (b[0] - a[0]) * t)
    const g = Math.round(a[1] + (b[1] - a[1]) * t)
    const bl = Math.round(a[2] + (b[2] - a[2]) * t)
    const al = a[3] + (b[3] - a[3]) * t
    return al >= 1 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${al})`
  }
}

/** @param {number} t */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * @typedef {Object} PieceRect
 * @property {number} x
 * @property {number} y
 * @property {number} width
 * @property {number} height
 * @property {number} rx
 */

/**
 * @typedef {Object} Piece
 * @property {any} el - the overlay <rect> being driven
 * @property {PieceRect} from
 * @property {PieceRect} to
 * @property {((t: number) => string) | null} fill - colour interpolator
 * @property {string|null} [fillEnd] - fill to snap to at t=1 when no interpolator
 * @property {number} delay - ms offset into the run
 * @property {any} [meta] - caller data, handed back on completion
 */

/**
 * Drive all pieces on ONE rAF loop.
 *
 * Every piece is a <rect>, because a rect whose corner radius reaches half
 * its (equal) sides IS a circle: cell-to-dot needs no path interpolation at
 * all, just x/y/width/height/rx tweens, and mid-flight the piece is a rounded
 * rectangle, which is exactly the "corner rounding off as it flies" look.
 *
 * @param {Object} opts
 * @param {Piece[]} opts.pieces
 * @param {number} opts.duration - per-piece flight time, ms
 * @param {(piece: Piece) => void} [opts.onPieceDone] - fired once per piece at t=1
 * @param {() => void} [opts.onAllDone]
 * @returns {() => void} cancel
 */
export function runPieceTween({ pieces, duration, onPieceDone, onAllDone }) {
  let cancelled = false
  const start = Date.now()
  const dur = Math.max(1, duration)

  /** @param {Piece} p @param {number} e */
  const write = (p, e) => {
    const f = p.from
    const t = p.to
    const el = p.el
    el.setAttribute('x', String(f.x + (t.x - f.x) * e))
    el.setAttribute('y', String(f.y + (t.y - f.y) * e))
    el.setAttribute('width', String(Math.max(0, f.width + (t.width - f.width) * e)))
    el.setAttribute('height', String(Math.max(0, f.height + (t.height - f.height) * e)))
    el.setAttribute('rx', String(Math.max(0, f.rx + (t.rx - f.rx) * e)))
    if (p.fill) el.setAttribute('fill', p.fill(e))
    else if (e >= 1 && p.fillEnd) el.setAttribute('fill', p.fillEnd)
  }

  const frame = () => {
    if (cancelled) return
    const elapsed = Date.now() - start
    let live = false
    for (let k = 0; k < pieces.length; k++) {
      const p = pieces[k]
      if (/** @type {any} */ (p)._done) continue
      const raw = (elapsed - p.delay) / dur
      if (raw < 1) live = true
      if (raw <= 0) continue
      const t = Math.min(1, raw)
      write(p, easeInOutCubic(t))
      if (t >= 1) {
        ;/** @type {any} */ (p)._done = true
        if (onPieceDone) onPieceDone(p)
      }
    }
    if (live) BrowserAPIs.requestAnimationFrame(frame)
    else if (onAllDone) onAllDone()
  }
  BrowserAPIs.requestAnimationFrame(frame)

  return () => {
    cancelled = true
  }
}
