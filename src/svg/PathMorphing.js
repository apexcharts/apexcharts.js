// @ts-check
import { Point, Matrix } from './math'
import { Environment } from '../utils/Environment.js'

/*!
 * Path morphing for SVG path animations
 * Based on svg.pathmorphing.js by Ulrich-Matthias Schäfer (MIT License)
 * Refactored to be standalone (no SVG.js dependency)
 *
 * Two algorithms are exported:
 *   - morphPaths()    — command-level interpolation; preserves curves but can
 *                       produce "wings/flips" when two shapes have very
 *                       different topology (e.g. bar rect → pie arc).
 *   - morphPolygons() — resamples both shapes into N evenly-spaced perimeter
 *                       points and tweens point-by-point with rotation-search
 *                       alignment; always smooth and non-self-intersecting,
 *                       at the cost of throwing away curve smoothness.
 */

// Parse an SVG path 'd' string into an array of command arrays
// e.g. "M 0 0 L 10 20" → [['M', 0, 0], ['L', 10, 20]]
/**
 * @param {string} d
 */
function parsePath(d) {
  if (!d || typeof d !== 'string') return [['M', 0, 0]]

  const commands = []
  // Match command letter followed by numbers (including negative, decimal)
  const re = /([MmLlHhVvCcSsQqTtAaZz])\s*/g
  const numRe = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi
  let match
  const letters = []
  const positions = []

  // Find all command letters and their positions
  while ((match = re.exec(d)) !== null) {
    letters.push(match[1])
    positions.push(match.index)
  }

  for (let i = 0; i < letters.length; i++) {
    const start = positions[i] + letters[i].length
    const end = i + 1 < positions.length ? positions[i + 1] : d.length
    const paramStr = d.substring(start, end)
    const nums = []
    let numMatch
    numRe.lastIndex = 0
    while ((numMatch = numRe.exec(paramStr)) !== null) {
      nums.push(parseFloat(numMatch[0]))
    }

    const cmd = letters[i].toUpperCase()

    if (cmd === 'Z') {
      commands.push(['Z'])
    } else if (cmd === 'M' || cmd === 'L' || cmd === 'T') {
      // pairs of (x, y)
      for (let j = 0; j < nums.length; j += 2) {
        commands.push([cmd, nums[j], nums[j + 1]])
      }
    } else if (cmd === 'H') {
      for (let j = 0; j < nums.length; j++) {
        commands.push([cmd, nums[j]])
      }
    } else if (cmd === 'V') {
      for (let j = 0; j < nums.length; j++) {
        commands.push([cmd, nums[j]])
      }
    } else if (cmd === 'C') {
      for (let j = 0; j < nums.length; j += 6) {
        commands.push([
          cmd,
          nums[j],
          nums[j + 1],
          nums[j + 2],
          nums[j + 3],
          nums[j + 4],
          nums[j + 5],
        ])
      }
    } else if (cmd === 'S' || cmd === 'Q') {
      for (let j = 0; j < nums.length; j += 4) {
        commands.push([cmd, nums[j], nums[j + 1], nums[j + 2], nums[j + 3]])
      }
    } else if (cmd === 'A') {
      for (let j = 0; j < nums.length; j += 7) {
        commands.push([
          cmd,
          nums[j],
          nums[j + 1],
          nums[j + 2],
          nums[j + 3],
          nums[j + 4],
          nums[j + 5],
          nums[j + 6],
        ])
      }
    }
  }

  if (commands.length === 0) {
    commands.push(['M', 0, 0])
  }

  return commands
}

// Calculate bounding box of a parsed path array
/**
 * @param {any[]} arr
 */
function pathBbox(arr) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

  /**
   * @param {any[]} cmd
   */
  arr.forEach((cmd) => {
    for (let i = 1; i < cmd.length; i += 2) {
      if (i + 1 <= cmd.length) {
        const x = cmd[i]
        const y = cmd[i + 1]
        if (typeof x === 'number' && typeof y === 'number') {
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }
  })

  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}

// Serialize command array back to path string
/**
 * @param {any[]} arr
 */
function arrayToPath(arr) {
  /**
   * @param {any[]} cmd
   */
  return arr.map((cmd) => cmd.join(' ')).join(' ')
}

// Convert shorthand types to long form
/**
 * @this {any}
 * @param {any[]} val
 */
function simplify(val) {
  switch (val[0]) {
    case 'z':
    case 'Z':
      val[0] = 'L'
      val[1] = this.start[0]
      val[2] = this.start[1]
      break
    case 'H':
      val[0] = 'L'
      val[2] = this.pos[1]
      break
    case 'V':
      val[0] = 'L'
      val[2] = val[1]
      val[1] = this.pos[0]
      break
    case 'T':
      val[0] = 'Q'
      val[3] = val[1]
      val[4] = val[2]
      val[1] = this.reflection[1]
      val[2] = this.reflection[0]
      break
    case 'S':
      val[0] = 'C'
      val[6] = val[4]
      val[5] = val[3]
      val[4] = val[2]
      val[3] = val[1]
      val[2] = this.reflection[1]
      val[1] = this.reflection[0]
      break
  }
  return val
}

// Update reflection point and current position
/**
 * @this {any}
 * @param {any[]} val
 */
function setPosAndReflection(val) {
  var len = val.length
  this.pos = [val[len - 2], val[len - 1]]
  if ('SCQT'.indexOf(val[0]) != -1) {
    this.reflection = [
      2 * this.pos[0] - val[len - 4],
      2 * this.pos[1] - val[len - 3],
    ]
  }
  return val
}

// Convert all types to cubic bezier
/**
 * @this {any}
 * @param {any[]} val
 */
function toBezier(val) {
  var retVal = [val]

  switch (val[0]) {
    case 'M':
      this.pos = this.start = [val[1], val[2]]
      return retVal
    case 'L':
      val[5] = val[3] = val[1]
      val[6] = val[4] = val[2]
      // @ts-ignore — this.pos is always set before L/Q cases are reached
      val[1] = this.pos[0]
      // @ts-ignore
      val[2] = this.pos[1]
      break
    case 'Q':
      val[6] = val[4]
      val[5] = val[3]
      val[4] = (val[4] * 1) / 3 + (val[2] * 2) / 3
      val[3] = (val[3] * 1) / 3 + (val[1] * 2) / 3
      // @ts-ignore — this.pos is always set before L/Q cases are reached
      val[2] = (this.pos[1] * 1) / 3 + (val[2] * 2) / 3
      // @ts-ignore
      val[1] = (this.pos[0] * 1) / 3 + (val[1] * 2) / 3
      break
    case 'A':
      retVal = arcToBezier(this.pos ?? [], val)
      val = retVal[0]
      break
  }

  val[0] = 'C'
  this.pos = [val[5], val[6]]
  this.reflection = [2 * val[5] - val[3], 2 * val[6] - val[4]]

  return retVal
}

// Find next M command position
/** @param {any[]} arr @param {number | false} offset @returns {number | false} */
function findNextM(arr, offset) {
  if (offset === false) return false
  for (var i = offset, len = arr.length; i < len; ++i) {
    if (arr[i][0] == 'M') return i
  }
  return false
}

// Convert arc segment to cubic bezier curves
/**
 * @param {number[]} pos
 * @param {any[]} val
 */
function arcToBezier(pos, val) {
  var rx = Math.abs(val[1]),
    ry = Math.abs(val[2]),
    xAxisRotation = val[3] % 360,
    largeArcFlag = val[4],
    sweepFlag = val[5],
    x = val[6],
    y = val[7],
    A = new Point(pos[0], pos[1]),
    B = new Point(x, y),
    primedCoord,
    lambda,
    mat,
    k,
    c,
    cSquare,
    t,
    O,
    OA,
    OB,
    tetaStart,
    tetaEnd,
    deltaTeta,
    nbSectors,
    f,
    arcSegPoints,
    angle,
    sinAngle,
    cosAngle,
    pt,
    i,
    il,
    retVal = [],
    x1,
    y1,
    x2,
    y2

  if (rx === 0 || ry === 0 || (A.x === B.x && A.y === B.y)) {
    return [['C', A.x, A.y, B.x, B.y, B.x, B.y]]
  }

  primedCoord = new Point((A.x - B.x) / 2, (A.y - B.y) / 2).transform(
    // Start with the identity matrix (no args → Matrix defaults a=d=1, others 0).
    // Passing all-zero args here would produce a degenerate zero matrix, since
    // `0 ?? 1` is `0`, not `1` — every subsequent transform then yields (0,0)
    // and the arc-to-bezier conversion crashes on a NaN cascade.
    /** @type {any} */ (new Matrix()).rotate(xAxisRotation),
  )
  lambda =
    (primedCoord.x * primedCoord.x) / (rx * rx) +
    (primedCoord.y * primedCoord.y) / (ry * ry)
  if (lambda > 1) {
    lambda = Math.sqrt(lambda)
    rx = lambda * rx
    ry = lambda * ry
  }

  mat = /** @type {any} */ (new Matrix())
    .rotate(xAxisRotation)
    .scale(1 / rx, 1 / ry)
    .rotate(-xAxisRotation)
  A = A.transform(mat)
  B = B.transform(mat)

  k = [B.x - A.x, B.y - A.y]
  cSquare = k[0] * k[0] + k[1] * k[1]
  c = Math.sqrt(cSquare)
  k[0] /= c
  k[1] /= c

  t = cSquare < 4 ? Math.sqrt(1 - cSquare / 4) : 0

  if (largeArcFlag === sweepFlag) {
    t *= -1
  }

  O = new Point((B.x + A.x) / 2 + t * -k[1], (B.y + A.y) / 2 + t * k[0])
  OA = new Point(A.x - O.x, A.y - O.y)
  OB = new Point(B.x - O.x, B.y - O.y)

  tetaStart = Math.acos(OA.x / Math.sqrt(OA.x * OA.x + OA.y * OA.y))
  if (OA.y < 0) tetaStart *= -1

  tetaEnd = Math.acos(OB.x / Math.sqrt(OB.x * OB.x + OB.y * OB.y))
  if (OB.y < 0) tetaEnd *= -1

  if (sweepFlag && tetaStart > tetaEnd) {
    tetaEnd += 2 * Math.PI
  }
  if (!sweepFlag && tetaStart < tetaEnd) {
    tetaEnd -= 2 * Math.PI
  }

  nbSectors = Math.ceil((Math.abs(tetaStart - tetaEnd) * 2) / Math.PI)
  arcSegPoints = []
  angle = tetaStart
  deltaTeta = (tetaEnd - tetaStart) / nbSectors
  f = (4 * Math.tan(deltaTeta / 4)) / 3

  for (i = 0; i <= nbSectors; i++) {
    cosAngle = Math.cos(angle)
    sinAngle = Math.sin(angle)
    pt = new Point(O.x + cosAngle, O.y + sinAngle)
    arcSegPoints[i] = [
      new Point(pt.x + f * sinAngle, pt.y - f * cosAngle),
      pt,
      new Point(pt.x - f * sinAngle, pt.y + f * cosAngle),
    ]
    angle += deltaTeta
  }

  arcSegPoints[0][0] = arcSegPoints[0][1].clone()
  arcSegPoints[arcSegPoints.length - 1][2] =
    arcSegPoints[arcSegPoints.length - 1][1].clone()

  mat = /** @type {any} */ (new Matrix())
    .rotate(xAxisRotation)
    .scale(rx, ry)
    .rotate(-xAxisRotation)
  for (i = 0, il = arcSegPoints.length; i < il; i++) {
    arcSegPoints[i][0] = arcSegPoints[i][0].transform(mat)
    arcSegPoints[i][1] = arcSegPoints[i][1].transform(mat)
    arcSegPoints[i][2] = arcSegPoints[i][2].transform(mat)
  }

  for (i = 1, il = arcSegPoints.length; i < il; i++) {
    pt = arcSegPoints[i - 1][2]
    x1 = pt.x
    y1 = pt.y
    pt = arcSegPoints[i][0]
    x2 = pt.x
    y2 = pt.y
    pt = arcSegPoints[i][1]
    x = pt.x
    y = pt.y
    retVal.push(['C', x1, y1, x2, y2, x, y])
  }

  return retVal
}

// Synchronize one block (from M to next M) so types and lengths match
/**
 * @param {any[]} startArr
 * @param {number} startOffsetM
 * @param {any} startOffsetNextM
 * @param {any[]} destArr
 * @param {number} destOffsetM
 * @param {any} destOffsetNextM
 */
function handleBlock(
  startArr,
  startOffsetM,
  startOffsetNextM,
  destArr,
  destOffsetM,
  destOffsetNextM,
) {
  var startArrTemp = startArr.slice(startOffsetM, startOffsetNextM || undefined)
  var destArrTemp = destArr.slice(destOffsetM, destOffsetNextM || undefined)

  var i = 0,
    posStart = { pos: [0, 0], start: [0, 0] },
    posDest = { pos: [0, 0], start: [0, 0] }

  while (true) {
    startArrTemp[i] = simplify.call(posStart, startArrTemp[i])
    destArrTemp[i] = simplify.call(posDest, destArrTemp[i])

    if (
      startArrTemp[i][0] != destArrTemp[i][0] ||
      startArrTemp[i][0] == 'M' ||
      (startArrTemp[i][0] == 'A' &&
        (startArrTemp[i][4] != destArrTemp[i][4] ||
          startArrTemp[i][5] != destArrTemp[i][5]))
    ) {
      Array.prototype.splice.apply(
        startArrTemp,
        /** @type {[number, number, ...any[]]} */ (
          [i, 1].concat(
            /** @type {any} */ (toBezier).call(posStart, startArrTemp[i]),
          )
        ),
      )
      Array.prototype.splice.apply(
        destArrTemp,
        /** @type {[number, number, ...any[]]} */ (
          [i, 1].concat(
            /** @type {any} */ (toBezier).call(posDest, destArrTemp[i]),
          )
        ),
      )
    } else {
      startArrTemp[i] = /** @type {any} */ (setPosAndReflection).call(
        posStart,
        startArrTemp[i],
      )
      destArrTemp[i] = /** @type {any} */ (setPosAndReflection).call(
        posDest,
        destArrTemp[i],
      )
    }

    if (++i == startArrTemp.length && i == destArrTemp.length) break

    if (i == startArrTemp.length) {
      startArrTemp.push([
        'C',
        posStart.pos[0],
        posStart.pos[1],
        posStart.pos[0],
        posStart.pos[1],
        posStart.pos[0],
        posStart.pos[1],
      ])
    }

    if (i == destArrTemp.length) {
      destArrTemp.push([
        'C',
        posDest.pos[0],
        posDest.pos[1],
        posDest.pos[0],
        posDest.pos[1],
        posDest.pos[0],
        posDest.pos[1],
      ])
    }
  }

  return { start: startArrTemp, dest: destArrTemp }
}

// Synchronize two path arrays so they can be interpolated
/**
 * @param {string} fromD
 * @param {string} toD
 */
function synchronizePaths(fromD, toD) {
  var startArr = parsePath(fromD)
  var destArr = parsePath(toD)

  /** @type {number | false} */ var startOffsetM = 0
  /** @type {number | false} */ var destOffsetM = 0
  /** @type {number | false} */ var startOffsetNextM = false
  /** @type {number | false} */ var destOffsetNextM = false
  var result

  while (true) {
    if (startOffsetM === false && destOffsetM === false) break

    startOffsetNextM = findNextM(
      startArr,
      startOffsetM === false ? false : startOffsetM + 1,
    )
    destOffsetNextM = findNextM(
      destArr,
      destOffsetM === false ? false : destOffsetM + 1,
    )

    if (startOffsetM === false) {
      const bbox = pathBbox(/** @type {any} */ (result).start)
      if (bbox.height == 0 || bbox.width == 0) {
        startOffsetM = startArr.push(startArr[0]) - 1
      } else {
        startOffsetM =
          startArr.push([
            'M',
            bbox.x + bbox.width / 2,
            bbox.y + bbox.height / 2,
          ]) - 1
      }
    }

    if (destOffsetM === false) {
      const bbox = pathBbox(/** @type {any} */ (result).dest)
      if (bbox.height == 0 || bbox.width == 0) {
        destOffsetM = destArr.push(destArr[0]) - 1
      } else {
        destOffsetM =
          destArr.push([
            'M',
            bbox.x + bbox.width / 2,
            bbox.y + bbox.height / 2,
          ]) - 1
      }
    }

    result = handleBlock(
      startArr,
      startOffsetM,
      startOffsetNextM,
      destArr,
      destOffsetM,
      destOffsetNextM,
    )

    startArr = startArr
      .slice(0, startOffsetM)
      .concat(
        result.start,
        startOffsetNextM === false ? [] : startArr.slice(startOffsetNextM),
      )
    destArr = destArr
      .slice(0, destOffsetM)
      .concat(
        result.dest,
        destOffsetNextM === false ? [] : destArr.slice(destOffsetNextM),
      )

    startOffsetM =
      startOffsetNextM === false ? false : startOffsetM + result.start.length
    destOffsetM =
      destOffsetNextM === false ? false : destOffsetM + result.dest.length
  }

  return { start: startArr, dest: destArr }
}

/**
 * Create a path interpolation function.
 * @param {string} fromD - Source SVG path 'd' string
 * @param {string} toD - Target SVG path 'd' string
 * @returns {function} Interpolator: (pos: 0..1) => pathString
 */
function morphPaths(fromD, toD) {
  var synced = synchronizePaths(fromD, toD)
  var startArr = synced.start
  var destArr = synced.dest

  /**
   * @param {number} pos
   */
  return function (pos) {
    var result = startArr.map(function (from, idx) {
      return destArr[idx].map(function (to, toIdx) {
        if (toIdx === 0) return to // command letter
        // @ts-ignore — toIdx > 0 entries are always numbers; index 0 (command letter) is returned above
        return from[toIdx] + (destArr[idx][toIdx] - from[toIdx]) * pos
      })
    })
    return arrayToPath(result)
  }
}

// --- Polygon-resample morph (algorithm: 'polygons') -----------------------
//
// Command-level morphing (morphPaths) pads shorter paths with phantom cubic
// commands stuck at the cursor's last position. When two shapes have very
// different anchor-point counts (e.g. a 4-corner bar rect vs a pie wedge
// whose arc explodes to ~16 cubic-bezier segments), those phantom points
// have to fan out across half the arc mid-transition, producing visible
// "wings" and self-intersecting flips.
//
// The polygon algorithm sidesteps this by sampling both paths into the
// SAME number of evenly-spaced perimeter points (via the live SVG
// getTotalLength / getPointAtLength APIs), rotation-searches for the
// starting-index alignment with smallest sum-of-squared distances, then
// linearly tweens N point pairs. Every intermediate frame is a closed
// N-segment polyline — at N≥64 visually indistinguishable from curves.

/** @type {SVGSVGElement | null} */
let _measureSvg = null
/** @type {SVGPathElement | null} */
let _measurePath = null

/**
 * Sample N evenly-spaced perimeter points from a path's `d` string.
 * Uses an off-DOM hidden SVG for getTotalLength / getPointAtLength so the
 * caller doesn't need to attach anything.
 *
 * @param {string} d
 * @param {number} n
 * @returns {{x:number, y:number}[]}
 */
function samplePathPoints(d, n) {
  const pts = new Array(n)

  if (!Environment.isBrowser()) {
    // SSR: fall back to the M-anchor + simple resample of the parsed array.
    // This is approximate, but morph animations are skipped in SSR anyway —
    // this branch exists only so the function is callable in unit tests.
    const arr = parsePath(d)
    const bbox = pathBbox(arr)
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2
    for (let i = 0; i < n; i++) pts[i] = { x: cx, y: cy }
    return pts
  }

  if (!_measureSvg) {
    _measureSvg = /** @type {SVGSVGElement} */ (
      document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    )
    _measureSvg.setAttribute('width', '0')
    _measureSvg.setAttribute('height', '0')
    _measureSvg.setAttribute(
      'style',
      'position:absolute;width:0;height:0;visibility:hidden;pointer-events:none;',
    )
    _measurePath = /** @type {SVGPathElement} */ (
      document.createElementNS('http://www.w3.org/2000/svg', 'path')
    )
    _measureSvg.appendChild(_measurePath)
    document.body.appendChild(_measureSvg)
  }

  // @ts-ignore — _measurePath is non-null after the init block above
  _measurePath.setAttribute('d', d || 'M0 0')
  /** @type {number} */
  let len = 0
  try {
    // @ts-ignore — _measurePath is non-null after the init block above
    len = _measurePath.getTotalLength()
  } catch (e) {
    len = 0
  }

  if (!len || !isFinite(len)) {
    // Degenerate path → collapse to bbox center so the morph still has
    // a well-defined start/end and just appears to "grow" from the center.
    const arr = parsePath(d)
    const bbox = pathBbox(arr)
    const cx = bbox.x + bbox.width / 2
    const cy = bbox.y + bbox.height / 2
    for (let i = 0; i < n; i++) pts[i] = { x: cx, y: cy }
    return pts
  }

  for (let i = 0; i < n; i++) {
    try {
      // @ts-ignore — _measurePath is non-null after the init block above
      const p = _measurePath.getPointAtLength((i / n) * len)
      pts[i] = { x: p.x, y: p.y }
    } catch (e) {
      pts[i] = { x: 0, y: 0 }
    }
  }
  return pts
}

/**
 * Create a polygon-resample interpolation function.
 *
 * Both inputs are sampled into N points, the source polygon is rotated to
 * the starting-index that minimizes sum-of-squared distance to the dest,
 * then per-frame the interpolator emits a closed `M L L ... Z` polyline
 * tweening between the N aligned point pairs.
 *
 * @param {string} fromD
 * @param {string} toD
 * @param {number} [n=96] - sample count; higher = smoother + slower align.
 *                          O(N²) rotation search means N=96 ≈ 9k distance
 *                          checks per morph start, which is negligible.
 * @returns {(pos: number) => string}
 */
function morphPolygons(fromD, toD, n = 96) {
  const fromPts = samplePathPoints(fromD, n)
  const toPts = samplePathPoints(toD, n)

  // Rotation-search: try all N shifts of fromPts and pick the one whose
  // i-th point is closest to toPts[i] in aggregate. This is what stops the
  // polygon from "untwisting" mid-morph when the two paths happen to start
  // at very different perimeter positions.
  let bestOffset = 0
  let bestDist = Infinity
  for (let off = 0; off < n; off++) {
    let dist = 0
    for (let i = 0; i < n; i++) {
      const a = fromPts[(i + off) % n]
      const b = toPts[i]
      const dx = a.x - b.x
      const dy = a.y - b.y
      dist += dx * dx + dy * dy
      // Early termination — once we're worse than the best, give up.
      if (dist >= bestDist) break
    }
    if (dist < bestDist) {
      bestDist = dist
      bestOffset = off
    }
  }

  const aligned = new Array(n)
  for (let i = 0; i < n; i++) {
    aligned[i] = fromPts[(i + bestOffset) % n]
  }

  return function (pos) {
    let out = ''
    for (let i = 0; i < n; i++) {
      const a = aligned[i]
      const b = toPts[i]
      const x = a.x + (b.x - a.x) * pos
      const y = a.y + (b.y - a.y) * pos
      out += (i === 0 ? 'M' : 'L') + x.toFixed(3) + ' ' + y.toFixed(3) + ' '
    }
    return out + 'Z'
  }
}

export {
  parsePath,
  morphPaths,
  morphPolygons,
  samplePathPoints,
  pathBbox,
  arrayToPath,
}
