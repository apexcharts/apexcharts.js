import { isPathLetter } from '../modules/core/regex.js'
import Point from '../types/Point.js'

const segmentParameters = {
  M: 2,
  L: 2,
  H: 1,
  V: 1,
  C: 6,
  S: 4,
  Q: 4,
  T: 2,
  A: 7,
  Z: 0
}

const pathHandlers = {
  M: function (c, p, p0) {
    p.x = p0.x = c[0]
    p.y = p0.y = c[1]

    return ['M', p.x, p.y]
  },
  L: function (c, p) {
    p.x = c[0]
    p.y = c[1]
    return ['L', c[0], c[1]]
  },
  H: function (c, p) {
    p.x = c[0]
    return ['H', c[0]]
  },
  V: function (c, p) {
    p.y = c[0]
    return ['V', c[0]]
  },
  C: function (c, p) {
    p.x = c[4]
    p.y = c[5]
    return ['C', c[0], c[1], c[2], c[3], c[4], c[5]]
  },
  S: function (c, p) {
    p.x = c[2]
    p.y = c[3]
    return ['S', c[0], c[1], c[2], c[3]]
  },
  Q: function (c, p) {
    p.x = c[2]
    p.y = c[3]
    return ['Q', c[0], c[1], c[2], c[3]]
  },
  T: function (c, p) {
    p.x = c[0]
    p.y = c[1]
    return ['T', c[0], c[1]]
  },
  Z: function (c, p, p0) {
    p.x = p0.x
    p.y = p0.y
    return ['Z']
  },
  A: function (c, p) {
    p.x = c[5]
    p.y = c[6]
    return ['A', c[0], c[1], c[2], c[3], c[4], c[5], c[6]]
  }
}

const mlhvqtcsaz = 'mlhvqtcsaz'.split('')

for (let i = 0, il = mlhvqtcsaz.length; i < il; ++i) {
  pathHandlers[mlhvqtcsaz[i]] = (function (i) {
    return function (c, p, p0) {
      if (i === 'H') c[0] = c[0] + p.x
      else if (i === 'V') c[0] = c[0] + p.y
      else if (i === 'A') {
        c[5] = c[5] + p.x
        c[6] = c[6] + p.y
      } else {
        for (let j = 0, jl = c.length; j < jl; ++j) {
          c[j] = c[j] + (j % 2 ? p.y : p.x)
        }
      }

      return pathHandlers[i](c, p, p0)
    }
  })(mlhvqtcsaz[i].toUpperCase())
}

function makeAbsolut(parser) {
  const command = parser.segment[0]
  return pathHandlers[command](parser.segment.slice(1), parser.p, parser.p0)
}

function segmentComplete(parser) {
  return (
    parser.segment.length &&
    parser.segment.length - 1 ===
      segmentParameters[parser.segment[0].toUpperCase()]
  )
}

function startNewSegment(parser, token) {
  parser.inNumber && finalizeNumber(parser, false)
  const pathLetter = isPathLetter.test(token)

  if (pathLetter) {
    parser.segment = [token]
  } else {
    const lastCommand = parser.lastCommand
    const small = lastCommand.toLowerCase()
    const isSmall = lastCommand === small
    parser.segment = [small === 'm' ? (isSmall ? 'l' : 'L') : lastCommand]
  }

  parser.inSegment = true
  parser.lastCommand = parser.segment[0]

  return pathLetter
}

function finalizeNumber(parser, inNumber) {
  if (!parser.inNumber) throw new Error('Parser Error')
  parser.number && parser.segment.push(parseFloat(parser.number))
  parser.inNumber = inNumber
  parser.number = ''
  parser.pointSeen = false
  parser.hasExponent = false

  if (segmentComplete(parser)) {
    finalizeSegment(parser)
  }
}

function finalizeSegment(parser) {
  parser.inSegment = false
  if (parser.absolute) {
    parser.segment = makeAbsolut(parser)
  }
  parser.segments.push(parser.segment)
}

function isArcFlag(parser) {
  if (!parser.segment.length) return false
  const isArc = parser.segment[0].toUpperCase() === 'A'
  const length = parser.segment.length

  return isArc && (length === 4 || length === 5)
}

function isExponential(parser) {
  return parser.lastToken.toUpperCase() === 'E'
}

const pathDelimiters = new Set([' ', ',', '\t', '\n', '\r', '\f'])
export function pathParser(d, toAbsolute = true) {
  let index = 0
  let token = ''
  const parser = {
    segment: [],
    inNumber: false,
    number: '',
    lastToken: '',
    inSegment: false,
    segments: [],
    pointSeen: false,
    hasExponent: false,
    absolute: toAbsolute,
    p0: new Point(),
    p: new Point()
  }

  while (((parser.lastToken = token), (token = d.charAt(index++)))) {
    if (!parser.inSegment) {
      if (startNewSegment(parser, token)) {
        continue
      }
    }

    if (token === '.') {
      if (parser.pointSeen || parser.hasExponent) {
        finalizeNumber(parser, false)
        --index
        continue
      }
      parser.inNumber = true
      parser.pointSeen = true
      parser.number += token
      continue
    }

    if (!isNaN(parseInt(token))) {
      if (parser.number === '0' || isArcFlag(parser)) {
        parser.inNumber = true
        parser.number = token
        finalizeNumber(parser, true)
        continue
      }

      parser.inNumber = true
      parser.number += token
      continue
    }

    if (pathDelimiters.has(token)) {
      if (parser.inNumber) {
        finalizeNumber(parser, false)
      }
      continue
    }

    if (token === '-' || token === '+') {
      if (parser.inNumber && !isExponential(parser)) {
        finalizeNumber(parser, false)
        --index
        continue
      }
      parser.number += token
      parser.inNumber = true
      continue
    }

    if (token.toUpperCase() === 'E') {
      parser.number += token
      parser.hasExponent = true
      continue
    }

    if (isPathLetter.test(token)) {
      if (parser.inNumber) {
        finalizeNumber(parser, false)
      } else if (!segmentComplete(parser)) {
        throw new Error('parser Error')
      } else {
        finalizeSegment(parser)
      }
      --index
    }
  }

  if (parser.inNumber) {
    finalizeNumber(parser, false)
  }

  if (parser.inSegment && segmentComplete(parser)) {
    finalizeSegment(parser)
  }

  return parser.segments
}
