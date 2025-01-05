import {
  extend,
  nodeOrNew,
  register,
  wrapWithAttrCheck
} from '../utils/adopter.js'
import { proportionalSize } from '../utils/utils.js'
import { registerMethods } from '../utils/methods.js'
import PointArray from '../types/PointArray.js'
import Shape from './Shape.js'
import * as pointed from '../modules/core/pointed.js'

export default class Line extends Shape {
  // Initialize node
  constructor(node, attrs = node) {
    super(nodeOrNew('line', node), attrs)
  }

  // Get array
  array() {
    return new PointArray([
      [this.attr('x1'), this.attr('y1')],
      [this.attr('x2'), this.attr('y2')]
    ])
  }

  // Move by left top corner
  move(x, y) {
    return this.attr(this.array().move(x, y).toLine())
  }

  // Overwrite native plot() method
  plot(x1, y1, x2, y2) {
    if (x1 == null) {
      return this.array()
    } else if (typeof y1 !== 'undefined') {
      x1 = { x1, y1, x2, y2 }
    } else {
      x1 = new PointArray(x1).toLine()
    }

    return this.attr(x1)
  }

  // Set element size to given width and height
  size(width, height) {
    const p = proportionalSize(this, width, height)
    return this.attr(this.array().size(p.width, p.height).toLine())
  }
}

extend(Line, pointed)

registerMethods({
  Container: {
    // Create a line element
    line: wrapWithAttrCheck(function (...args) {
      // make sure plot is called as a setter
      // x1 is not necessarily a number, it can also be an array, a string and a PointArray
      return Line.prototype.plot.apply(
        this.put(new Line()),
        args[0] != null ? args : [0, 0, 0, 0]
      )
    })
  }
})

register(Line, 'Line')
