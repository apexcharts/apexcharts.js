import { Point, Matrix } from './math'

/*!
 * Path morphing for SVG path animations
 * Based on svg.pathmorphing.js by Ulrich-Matthias Schäfer (MIT License)
 * Refactored to be standalone (no SVG.js dependency)
 */

// Parse an SVG path 'd' string into an array of command arrays
// e.g. "M 0 0 L 10 20" → [['M', 0, 0], ['L', 10, 20]]
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
function pathBbox(arr) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity

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
function arrayToPath(arr) {
  return arr.map((cmd) => cmd.join(' ')).join(' ')
}

// Convert shorthand types to long form
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
function toBezier(val) {
  var retVal = [val]

  switch (val[0]) {
    case 'M':
      this.pos = this.start = [val[1], val[2]]
      return retVal
    case 'L':
      val[5] = val[3] = val[1]
      val[6] = val[4] = val[2]
      val[1] = this.pos[0]
      val[2] = this.pos[1]
      break
    case 'Q':
      val[6] = val[4]
      val[5] = val[3]
      val[4] = (val[4] * 1) / 3 + (val[2] * 2) / 3
      val[3] = (val[3] * 1) / 3 + (val[1] * 2) / 3
      val[2] = (this.pos[1] * 1) / 3 + (val[2] * 2) / 3
      val[1] = (this.pos[0] * 1) / 3 + (val[1] * 2) / 3
      break
    case 'A':
      retVal = arcToBezier(this.pos, val)
      val = retVal[0]
      break
  }

  val[0] = 'C'
  this.pos = [val[5], val[6]]
  this.reflection = [2 * val[5] - val[3], 2 * val[6] - val[4]]

  return retVal
}

// Find next M command position
function findNextM(arr, offset) {
  if (offset === false) return false
  for (var i = offset, len = arr.length; i < len; ++i) {
    if (arr[i][0] == 'M') return i
  }
  return false
}

// Convert arc segment to cubic bezier curves
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
    new Matrix().rotate(xAxisRotation)
  )
  lambda =
    (primedCoord.x * primedCoord.x) / (rx * rx) +
    (primedCoord.y * primedCoord.y) / (ry * ry)
  if (lambda > 1) {
    lambda = Math.sqrt(lambda)
    rx = lambda * rx
    ry = lambda * ry
  }

  mat = new Matrix()
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

  O = new Point(
    (B.x + A.x) / 2 + t * -k[1],
    (B.y + A.y) / 2 + t * k[0]
  )
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

  mat = new Matrix()
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
function handleBlock(
  startArr,
  startOffsetM,
  startOffsetNextM,
  destArr,
  destOffsetM,
  destOffsetNextM
) {
  var startArrTemp = startArr.slice(
    startOffsetM,
    startOffsetNextM || undefined
  )
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
        [i, 1].concat(toBezier.call(posStart, startArrTemp[i]))
      )
      Array.prototype.splice.apply(
        destArrTemp,
        [i, 1].concat(toBezier.call(posDest, destArrTemp[i]))
      )
    } else {
      startArrTemp[i] = setPosAndReflection.call(posStart, startArrTemp[i])
      destArrTemp[i] = setPosAndReflection.call(posDest, destArrTemp[i])
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
function synchronizePaths(fromD, toD) {
  var startArr = parsePath(fromD)
  var destArr = parsePath(toD)

  var startOffsetM = 0,
    destOffsetM = 0
  var startOffsetNextM = false,
    destOffsetNextM = false
  var result

  while (true) {
    if (startOffsetM === false && destOffsetM === false) break

    startOffsetNextM = findNextM(
      startArr,
      startOffsetM === false ? false : startOffsetM + 1
    )
    destOffsetNextM = findNextM(
      destArr,
      destOffsetM === false ? false : destOffsetM + 1
    )

    if (startOffsetM === false) {
      const bbox = pathBbox(result.start)
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
      const bbox = pathBbox(result.dest)
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
      destOffsetNextM
    )

    startArr = startArr
      .slice(0, startOffsetM)
      .concat(
        result.start,
        startOffsetNextM === false ? [] : startArr.slice(startOffsetNextM)
      )
    destArr = destArr
      .slice(0, destOffsetM)
      .concat(
        result.dest,
        destOffsetNextM === false ? [] : destArr.slice(destOffsetNextM)
      )

    startOffsetM =
      startOffsetNextM === false
        ? false
        : startOffsetM + result.start.length
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

  return function (pos) {
    var result = startArr.map(function (from, idx) {
      return destArr[idx].map(function (to, toIdx) {
        if (toIdx === 0) return to // command letter
        return from[toIdx] + (destArr[idx][toIdx] - from[toIdx]) * pos
      })
    })
    return arrayToPath(result)
  }
}

export { parsePath, morphPaths, pathBbox, arrayToPath }
