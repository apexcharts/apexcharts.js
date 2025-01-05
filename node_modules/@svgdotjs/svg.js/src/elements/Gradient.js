import {
  extend,
  nodeOrNew,
  register,
  wrapWithAttrCheck
} from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import Box from '../types/Box.js'
import Container from './Container.js'
import baseFind from '../modules/core/selector.js'
import * as gradiented from '../modules/core/gradiented.js'

export default class Gradient extends Container {
  constructor(type, attrs) {
    super(
      nodeOrNew(type + 'Gradient', typeof type === 'string' ? null : type),
      attrs
    )
  }

  // custom attr to handle transform
  attr(a, b, c) {
    if (a === 'transform') a = 'gradientTransform'
    return super.attr(a, b, c)
  }

  bbox() {
    return new Box()
  }

  targets() {
    return baseFind('svg [fill*=' + this.id() + ']')
  }

  // Alias string conversion to fill
  toString() {
    return this.url()
  }

  // Update gradient
  update(block) {
    // remove all stops
    this.clear()

    // invoke passed block
    if (typeof block === 'function') {
      block.call(this, this)
    }

    return this
  }

  // Return the fill id
  url() {
    return 'url(#' + this.id() + ')'
  }
}

extend(Gradient, gradiented)

registerMethods({
  Container: {
    // Create gradient element in defs
    gradient(...args) {
      return this.defs().gradient(...args)
    }
  },
  // define gradient
  Defs: {
    gradient: wrapWithAttrCheck(function (type, block) {
      return this.put(new Gradient(type)).update(block)
    })
  }
})

register(Gradient, 'Gradient')
