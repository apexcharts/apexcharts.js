// @ts-check
/**
 * SVG path data to polygons, with no DOM.
 *
 * The sample this module grew out of borrowed the browser's own
 * `getTotalLength()`/`getPointAtLength()` by parking a `<path>` in the document.
 * That cannot ship: it breaks under `apexcharts/ssr` (where touching `document`
 * is forbidden), it makes flattening precision browser-dependent, so snapshots
 * drift between engines, and it costs a DOM round trip per shape.
 *
 * So paths are parsed and flattened here instead. One code path in every
 * environment, deterministic to the last bit, and it lets the shape catalog
 * stay a set of ~300-byte strings rather than pre-baked polygons (which are
 * roughly five times the bytes for the same outline).
 *
 * @module unit-shapes/engine/path
 */

/** @typedef {{ x: number, y: number }} Point */

const CMD = /[MmLlHhVvCcSsQqTtAaZz]/

/**
 * Flatten a path's subpaths into closed polygons, in path units.
 *
 * Curves are subdivided until their control-polygon length implies steps no
 * longer than `tolerance`, which keeps vertex density even across a shape
 * whatever its curve mix. Subpaths are returned in source order; the caller
 * decides what winding means (see `polygonRegion`).
 *
 * @param {string} d
 * @param {number} [tolerance] max step length in path units (0.6)
 * @returns {Point[][]}
 */
export function flattenPath(d, tolerance = 0.6) {
  const tol = tolerance > 0 ? tolerance : 0.6
  const n = d.length
  let i = 0

  /** @type {Point[][]} */
  const polys = []
  /** @type {Point[]} */
  let poly = []
  // Current point, subpath start, and the previous curve's trailing control
  // point (S/T reflect through it).
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let px = 0
  let py = 0
  let prev = ''

  const isWs = (/** @type {string} */ c) =>
    c === ' ' || c === ',' || c === '\t' || c === '\n' || c === '\r'

  function skip() {
    while (i < n && isWs(d[i])) i++
  }

  /**
   * Read one number, or null at the end of this command's arguments.
   * @returns {number|null}
   */
  function num() {
    skip()
    const start = i
    if (d[i] === '+' || d[i] === '-') i++
    while (i < n && d[i] >= '0' && d[i] <= '9') i++
    if (d[i] === '.') {
      i++
      while (i < n && d[i] >= '0' && d[i] <= '9') i++
    }
    if (d[i] === 'e' || d[i] === 'E') {
      i++
      if (d[i] === '+' || d[i] === '-') i++
      while (i < n && d[i] >= '0' && d[i] <= '9') i++
    }
    if (i === start) return null
    const v = parseFloat(d.slice(start, i))
    return isFinite(v) ? v : null
  }

  /**
   * Arc flags are single characters, so a minifier is free to write `0158` for
   * `0 1 58`. Reading them one char at a time is what makes real-world
   * (SVGO-compressed) path data parse.
   * @returns {boolean|null}
   */
  function flag() {
    skip()
    const c = d[i]
    if (c === '0' || c === '1') {
      i++
      return c === '1'
    }
    return null
  }

  function closePoly() {
    // A subpath that closed back onto its first point leaves a zero-length
    // edge, which the scanline ignores, so no de-duplication is needed.
    if (poly.length > 2) polys.push(poly)
    poly = []
  }

  /** @param {number} x @param {number} y */
  function move(x, y) {
    closePoly()
    cx = sx = x
    cy = sy = y
    poly = [{ x, y }]
  }

  /** @param {number} x @param {number} y */
  function line(x, y) {
    poly.push({ x, y })
    cx = x
    cy = y
  }

  /**
   * @param {number} x1 @param {number} y1
   * @param {number} x2 @param {number} y2
   * @param {number} x @param {number} y
   */
  function cubic(x1, y1, x2, y2, x, y) {
    const hull =
      Math.hypot(x1 - cx, y1 - cy) +
      Math.hypot(x2 - x1, y2 - y1) +
      Math.hypot(x - x2, y - y2)
    const steps = Math.max(2, Math.min(160, Math.ceil(hull / tol)))
    const x0 = cx
    const y0 = cy
    for (let k = 1; k <= steps; k++) {
      const t = k / steps
      const u = 1 - t
      const a = u * u * u
      const b = 3 * u * u * t
      const c = 3 * u * t * t
      const e = t * t * t
      poly.push({
        x: a * x0 + b * x1 + c * x2 + e * x,
        y: a * y0 + b * y1 + c * y2 + e * y,
      })
    }
    px = x2
    py = y2
    cx = x
    cy = y
  }

  /**
   * @param {number} x1 @param {number} y1 @param {number} x @param {number} y
   */
  function quad(x1, y1, x, y) {
    const qx = x1
    const qy = y1
    // Raise to a cubic, so there is one flattener to keep honest.
    cubic(
      cx + (2 / 3) * (x1 - cx),
      cy + (2 / 3) * (y1 - cy),
      x + (2 / 3) * (x1 - x),
      y + (2 / 3) * (y1 - y),
      x,
      y,
    )
    px = qx
    py = qy
  }

  /**
   * Endpoint-parameterised arc, per the SVG spec's implementation notes
   * (F.6.5), then sampled by angle.
   *
   * @param {number} rx @param {number} ry @param {number} rot degrees
   * @param {boolean} large @param {boolean} sweep
   * @param {number} x @param {number} y
   */
  function arc(rx, ry, rot, large, sweep, x, y) {
    if (!rx || !ry) {
      line(x, y)
      return
    }
    const x1 = cx
    const y1 = cy
    rx = Math.abs(rx)
    ry = Math.abs(ry)
    const phi = (rot * Math.PI) / 180
    const cosP = Math.cos(phi)
    const sinP = Math.sin(phi)
    const dx2 = (x1 - x) / 2
    const dy2 = (y1 - y) / 2
    const x1p = cosP * dx2 + sinP * dy2
    const y1p = -sinP * dx2 + cosP * dy2
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if (lambda > 1) {
      const s = Math.sqrt(lambda)
      rx *= s
      ry *= s
    }
    const num1 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    const den1 = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    const co =
      (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num1 / (den1 || 1)))
    const cxp = (co * rx * y1p) / ry
    const cyp = (-co * ry * x1p) / rx
    const ccx = cosP * cxp - sinP * cyp + (x1 + x) / 2
    const ccy = sinP * cxp + cosP * cyp + (y1 + y) / 2

    const ux = (x1p - cxp) / rx
    const uy = (y1p - cyp) / ry
    const vx = (-x1p - cxp) / rx
    const vy = (-y1p - cyp) / ry
    const theta = Math.atan2(uy, ux)
    let delta = Math.atan2(vy, vx) - theta
    if (!sweep && delta > 0) delta -= 2 * Math.PI
    if (sweep && delta < 0) delta += 2 * Math.PI

    const steps = Math.max(
      2,
      Math.min(320, Math.ceil((Math.abs(delta) * Math.max(rx, ry)) / tol)),
    )
    for (let k = 1; k <= steps; k++) {
      const t = theta + (delta * k) / steps
      const ct = Math.cos(t)
      const st = Math.sin(t)
      poly.push({
        x: ccx + rx * ct * cosP - ry * st * sinP,
        y: ccy + rx * ct * sinP + ry * st * cosP,
      })
    }
    px = x
    py = y
    cx = x
    cy = y
  }

  while (i < n) {
    skip()
    if (i >= n) break
    let cmd = d[i]
    if (CMD.test(cmd)) {
      i++
    } else if (prev) {
      // Repeated arguments continue the previous command, except that a
      // repeated M is an implicit L.
      cmd = prev === 'M' ? 'L' : prev === 'm' ? 'l' : prev
    } else {
      break
    }
    const rel = cmd >= 'a' && cmd <= 'z'
    const up = cmd.toUpperCase()

    if (up === 'Z') {
      // Back to the subpath start, so the polygon is closed geometrically as
      // well as logically.
      if (poly.length) poly.push({ x: sx, y: sy })
      closePoly()
      cx = sx
      cy = sy
      prev = cmd
      continue
    }

    /** @type {(v: number|null) => number} */
    const need = (v) => (v == null ? NaN : v)
    const a = need(num())
    if (isNaN(a)) break

    switch (up) {
      case 'M': {
        const b = need(num())
        if (isNaN(b)) return polys
        move(rel ? cx + a : a, rel ? cy + b : b)
        break
      }
      case 'L': {
        const b = need(num())
        if (isNaN(b)) return polys
        line(rel ? cx + a : a, rel ? cy + b : b)
        break
      }
      case 'H':
        line(rel ? cx + a : a, cy)
        break
      case 'V':
        line(cx, rel ? cy + a : a)
        break
      case 'C': {
        const args = [a, num(), num(), num(), num(), num()]
        if (args.some((v) => v == null)) return polys
        const v = /** @type {number[]} */ (args)
        cubic(
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3],
          rel ? cx + v[4] : v[4],
          rel ? cy + v[5] : v[5],
        )
        break
      }
      case 'S': {
        const args = [a, num(), num(), num()]
        if (args.some((v) => v == null)) return polys
        const v = /** @type {number[]} */ (args)
        const smooth = prev && 'CcSs'.indexOf(prev) >= 0
        cubic(
          smooth ? 2 * cx - px : cx,
          smooth ? 2 * cy - py : cy,
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3],
        )
        break
      }
      case 'Q': {
        const args = [a, num(), num(), num()]
        if (args.some((v) => v == null)) return polys
        const v = /** @type {number[]} */ (args)
        quad(
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3],
        )
        break
      }
      case 'T': {
        const b = need(num())
        if (isNaN(b)) return polys
        const smooth = prev && 'QqTt'.indexOf(prev) >= 0
        quad(
          smooth ? 2 * cx - px : cx,
          smooth ? 2 * cy - py : cy,
          rel ? cx + a : a,
          rel ? cy + b : b,
        )
        break
      }
      case 'A': {
        const rx = a
        const ry = num()
        const rot = num()
        const large = flag()
        const sweep = flag()
        const ex = num()
        const ey = num()
        if (
          ry == null ||
          rot == null ||
          large == null ||
          sweep == null ||
          ex == null ||
          ey == null
        ) {
          return polys
        }
        arc(rx, ry, rot, large, sweep, rel ? cx + ex : ex, rel ? cy + ey : ey)
        break
      }
      default:
        return polys
    }
    if (up !== 'C' && up !== 'S' && up !== 'Q' && up !== 'T') {
      px = cx
      py = cy
    }
    prev = cmd
  }
  closePoly()
  return polys
}

/**
 * @param {Point[][]} polys
 * @returns {{x0:number, y0:number, x1:number, y1:number}}
 */
export function boundsOf(polys) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  polys.forEach((pts) => {
    pts.forEach((p) => {
      if (p.x < b.x0) b.x0 = p.x
      if (p.y < b.y0) b.y0 = p.y
      if (p.x > b.x1) b.x1 = p.x
      if (p.y > b.y1) b.y1 = p.y
    })
  })
  return b
}

/**
 * Signed area, twice over. Its sign is the winding direction, which is how a
 * hole is authored: a subpath wound against the outline it sits in.
 * @param {Point[]} pts
 * @returns {number}
 */
export function signedArea(pts) {
  let sum = 0
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    sum += a.x * b.y - b.x * a.y
  }
  return sum
}
