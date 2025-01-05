import {
  extend,
  nodeOrNew,
  register,
  wrapWithAttrCheck
} from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import PointArray from '../types/PointArray.js'
import Shape from './Shape.js'
import * as pointed from '../modules/core/pointed.js'
import * as poly from '../modules/core/poly.js'

export default class Polygon extends Shape {
  // Initialize node
  constructor(node, attrs = node) {
    super(nodeOrNew('polygon', node), attrs)
  }
}

registerMethods({
  Container: {
    // Create a wrapped polygon element
    polygon: wrapWithAttrCheck(function (p) {
      // make sure plot is called as a setter
      return this.put(new Polygon()).plot(p || new PointArray())
    })
  }
})

extend(Polygon, pointed)
extend(Polygon, poly)
register(Polygon, 'Polygon')
