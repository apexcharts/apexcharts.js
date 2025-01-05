import {
  extend,
  nodeOrNew,
  register,
  wrapWithAttrCheck
} from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import { rx, ry } from '../modules/core/circled.js'
import Shape from './Shape.js'

export default class Rect extends Shape {
  // Initialize node
  constructor(node, attrs = node) {
    super(nodeOrNew('rect', node), attrs)
  }
}

extend(Rect, { rx, ry })

registerMethods({
  Container: {
    // Create a rect element
    rect: wrapWithAttrCheck(function (width, height) {
      return this.put(new Rect()).size(width, height)
    })
  }
})

register(Rect, 'Rect')
