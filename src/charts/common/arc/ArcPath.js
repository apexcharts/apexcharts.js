// @ts-check
/**
 * Shared donut / pie slice arc-path geometry.
 *
 * Both Pie (`getRoundedSlicePath`) and Sunburst (`_arcPath`) build the same
 * rounded donut segment: outer + inner arcs joined by quadratic-Bezier fillets
 * at the corners. These were two independent copies that could drift; this
 * module is the single source. Each caller keeps its own radius/spacing
 * clamping and passes the already-resolved geometry in, so the emitted path
 * strings are byte-identical to the previous inline copies.
 *
 * Angle convention: degrees, 0deg = 12 o'clock, increasing clockwise.
 * `spanDeg` is passed explicitly (not recomputed from `a1 - a0`) so the
 * large-arc flags match each caller's original float arithmetic exactly.
 *
 * @module charts/common/arc/ArcPath
 */

const D2R = Math.PI / 180
const R2D = 180 / Math.PI

/**
 * Point on a circle of radius `radius` at `deg`, relative to center (cx, cy).
 * @param {number} cx @param {number} cy @param {number} radius @param {number} deg
 * @returns {{x: number, y: number}}
 */
export function arcPoint(cx, cy, radius, deg) {
  return {
    x: cx + radius * Math.cos((deg - 90) * D2R),
    y: cy + radius * Math.sin((deg - 90) * D2R),
  }
}

/** @param {{x: number, y: number}} p */
const xy = (p) => `${p.x} ${p.y}`

/**
 * Rounded donut segment (inner radius rIn > 0): all four corners filleted.
 * @param {{cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number, r: number, spanDeg: number}} o
 * @returns {string}
 */
export function roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r, spanDeg }) {
  /** @param {number} radius @param {number} deg */
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg)

  const degOut = (r / rOut) * R2D
  const degIn = (r / rIn) * R2D

  const oStart = ptAt(rOut, a0 + degOut)
  const oEnd = ptAt(rOut, a1 - degOut)
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0
  const ocEnd = ptAt(rOut, a1)
  const rEndOut = ptAt(rOut - r, a1)
  const ocStart = ptAt(rOut, a0)
  const rStartOut = ptAt(rOut - r, a0)

  const iEnd = ptAt(rIn, a1 - degIn)
  const iStart = ptAt(rIn, a0 + degIn)
  const largeIn = spanDeg - 2 * degIn > 180 ? 1 : 0
  const icEnd = ptAt(rIn, a1)
  const rEndIn = ptAt(rIn + r, a1)
  const icStart = ptAt(rIn, a0)
  const rStartIn = ptAt(rIn + r, a0)

  return [
    'M', xy(oStart),
    'A', rOut, rOut, 0, largeOut, 1, xy(oEnd),
    'Q', xy(ocEnd), xy(rEndOut),
    'L', xy(rEndIn),
    'Q', xy(icEnd), xy(iEnd),
    'A', rIn, rIn, 0, largeIn, 0, xy(iStart),
    'Q', xy(icStart), xy(rStartIn),
    'L', xy(rStartOut),
    'Q', xy(ocStart), xy(oStart),
    'Z',
  ].join(' ')
}

/**
 * Rounded pie / polarArea segment (solid): the two outer corners are filleted,
 * the center apex stays sharp.
 * @param {{cx: number, cy: number, rOut: number, a0: number, a1: number, r: number, spanDeg: number}} o
 * @returns {string}
 */
export function roundedPieSegmentPath({ cx, cy, rOut, a0, a1, r, spanDeg }) {
  /** @param {number} radius @param {number} deg */
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg)

  const degOut = (r / rOut) * R2D
  const oStart = ptAt(rOut, a0 + degOut)
  const oEnd = ptAt(rOut, a1 - degOut)
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0
  const ocEnd = ptAt(rOut, a1)
  const rEndOut = ptAt(rOut - r, a1)
  const ocStart = ptAt(rOut, a0)
  const rStartOut = ptAt(rOut - r, a0)

  return [
    'M', xy(oStart),
    'A', rOut, rOut, 0, largeOut, 1, xy(oEnd),
    'Q', xy(ocEnd), xy(rEndOut),
    'L', `${cx} ${cy}`,
    'L', xy(rStartOut),
    'Q', xy(ocStart), xy(oStart),
    'Z',
  ].join(' ')
}

/**
 * Sharp (unrounded) donut segment. Used when a segment is too thin/narrow to
 * round meaningfully.
 * @param {{cx: number, cy: number, rIn: number, rOut: number, a0: number, a1: number, spanDeg: number}} o
 * @returns {string}
 */
export function sharpDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, spanDeg }) {
  /** @param {number} radius @param {number} deg */
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg)

  const largeArc = spanDeg > 180 ? 1 : 0
  const A = ptAt(rOut, a0)
  const B = ptAt(rOut, a1)
  const C = ptAt(rIn, a1)
  const Din = ptAt(rIn, a0)
  return [
    'M', xy(A),
    'A', rOut, rOut, 0, largeArc, 1, xy(B),
    'L', xy(C),
    'A', rIn, rIn, 0, largeArc, 0, xy(Din),
    'Z',
  ].join(' ')
}
