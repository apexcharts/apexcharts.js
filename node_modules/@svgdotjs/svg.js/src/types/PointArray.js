import { delimiter } from '../modules/core/regex.js'
import SVGArray from './SVGArray.js'
import Box from './Box.js'
import Matrix from './Matrix.js'

export default class PointArray extends SVGArray {
  // Get bounding box of points
  bbox() {
    let maxX = -Infinity
    let maxY = -Infinity
    let minX = Infinity
    let minY = Infinity
    this.forEach(function (el) {
      maxX = Math.max(el[0], maxX)
      maxY = Math.max(el[1], maxY)
      minX = Math.min(el[0], minX)
      minY = Math.min(el[1], minY)
    })
    return new Box(minX, minY, maxX - minX, maxY - minY)
  }

  // Move point string
  move(x, y) {
    const box = this.bbox()

    // get relative offset
    x -= box.x
    y -= box.y

    // move every point
    if (!isNaN(x) && !isNaN(y)) {
      for (let i = this.length - 1; i >= 0; i--) {
        this[i] = [this[i][0] + x, this[i][1] + y]
      }
    }

    return this
  }

  // Parse point string and flat array
  parse(array = [0, 0]) {
    const points = []

    // if it is an array, we flatten it and therefore clone it to 1 depths
    if (array instanceof Array) {
      array = Array.prototype.concat.apply([], array)
    } else {
      // Else, it is considered as a string
      // parse points
      array = array.trim().split(delimiter).map(parseFloat)
    }

    // validate points - https://svgwg.org/svg2-draft/shapes.html#DataTypePoints
    // Odd number of coordinates is an error. In such cases, drop the last odd coordinate.
    if (array.length % 2 !== 0) array.pop()

    // wrap points in two-tuples
    for (let i = 0, len = array.length; i < len; i = i + 2) {
      points.push([array[i], array[i + 1]])
    }

    return points
  }

  // Resize poly string
  size(width, height) {
    let i
    const box = this.bbox()

    // recalculate position of all points according to new size
    for (i = this.length - 1; i >= 0; i--) {
      if (box.width)
        this[i][0] = ((this[i][0] - box.x) * width) / box.width + box.x
      if (box.height)
        this[i][1] = ((this[i][1] - box.y) * height) / box.height + box.y
    }

    return this
  }

  // Convert array to line object
  toLine() {
    return {
      x1: this[0][0],
      y1: this[0][1],
      x2: this[1][0],
      y2: this[1][1]
    }
  }

  // Convert array to string
  toString() {
    const array = []
    // convert to a poly point string
    for (let i = 0, il = this.length; i < il; i++) {
      array.push(this[i].join(','))
    }

    return array.join(' ')
  }

  transform(m) {
    return this.clone().transformO(m)
  }

  // transform points with matrix (similar to Point.transform)
  transformO(m) {
    if (!Matrix.isMatrixLike(m)) {
      m = new Matrix(m)
    }

    for (let i = this.length; i--; ) {
      // Perform the matrix multiplication
      const [x, y] = this[i]
      this[i][0] = m.a * x + m.c * y + m.e
      this[i][1] = m.b * x + m.d * y + m.f
    }

    return this
  }
}
