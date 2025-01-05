import SVGArray from './SVGArray.js'
import parser from '../modules/core/parser.js'
import Box from './Box.js'
import { pathParser } from '../utils/pathParser.js'

function arrayToString(a) {
  let s = ''
  for (let i = 0, il = a.length; i < il; i++) {
    s += a[i][0]

    if (a[i][1] != null) {
      s += a[i][1]

      if (a[i][2] != null) {
        s += ' '
        s += a[i][2]

        if (a[i][3] != null) {
          s += ' '
          s += a[i][3]
          s += ' '
          s += a[i][4]

          if (a[i][5] != null) {
            s += ' '
            s += a[i][5]
            s += ' '
            s += a[i][6]

            if (a[i][7] != null) {
              s += ' '
              s += a[i][7]
            }
          }
        }
      }
    }
  }

  return s + ' '
}

export default class PathArray extends SVGArray {
  // Get bounding box of path
  bbox() {
    parser().path.setAttribute('d', this.toString())
    return new Box(parser.nodes.path.getBBox())
  }

  // Move path string
  move(x, y) {
    // get bounding box of current situation
    const box = this.bbox()

    // get relative offset
    x -= box.x
    y -= box.y

    if (!isNaN(x) && !isNaN(y)) {
      // move every point
      for (let l, i = this.length - 1; i >= 0; i--) {
        l = this[i][0]

        if (l === 'M' || l === 'L' || l === 'T') {
          this[i][1] += x
          this[i][2] += y
        } else if (l === 'H') {
          this[i][1] += x
        } else if (l === 'V') {
          this[i][1] += y
        } else if (l === 'C' || l === 'S' || l === 'Q') {
          this[i][1] += x
          this[i][2] += y
          this[i][3] += x
          this[i][4] += y

          if (l === 'C') {
            this[i][5] += x
            this[i][6] += y
          }
        } else if (l === 'A') {
          this[i][6] += x
          this[i][7] += y
        }
      }
    }

    return this
  }

  // Absolutize and parse path to array
  parse(d = 'M0 0') {
    if (Array.isArray(d)) {
      d = Array.prototype.concat.apply([], d).toString()
    }

    return pathParser(d)
  }

  // Resize path string
  size(width, height) {
    // get bounding box of current situation
    const box = this.bbox()
    let i, l

    // If the box width or height is 0 then we ignore
    // transformations on the respective axis
    box.width = box.width === 0 ? 1 : box.width
    box.height = box.height === 0 ? 1 : box.height

    // recalculate position of all points according to new size
    for (i = this.length - 1; i >= 0; i--) {
      l = this[i][0]

      if (l === 'M' || l === 'L' || l === 'T') {
        this[i][1] = ((this[i][1] - box.x) * width) / box.width + box.x
        this[i][2] = ((this[i][2] - box.y) * height) / box.height + box.y
      } else if (l === 'H') {
        this[i][1] = ((this[i][1] - box.x) * width) / box.width + box.x
      } else if (l === 'V') {
        this[i][1] = ((this[i][1] - box.y) * height) / box.height + box.y
      } else if (l === 'C' || l === 'S' || l === 'Q') {
        this[i][1] = ((this[i][1] - box.x) * width) / box.width + box.x
        this[i][2] = ((this[i][2] - box.y) * height) / box.height + box.y
        this[i][3] = ((this[i][3] - box.x) * width) / box.width + box.x
        this[i][4] = ((this[i][4] - box.y) * height) / box.height + box.y

        if (l === 'C') {
          this[i][5] = ((this[i][5] - box.x) * width) / box.width + box.x
          this[i][6] = ((this[i][6] - box.y) * height) / box.height + box.y
        }
      } else if (l === 'A') {
        // resize radii
        this[i][1] = (this[i][1] * width) / box.width
        this[i][2] = (this[i][2] * height) / box.height

        // move position values
        this[i][6] = ((this[i][6] - box.x) * width) / box.width + box.x
        this[i][7] = ((this[i][7] - box.y) * height) / box.height + box.y
      }
    }

    return this
  }

  // Convert array to string
  toString() {
    return arrayToString(this)
  }
}
