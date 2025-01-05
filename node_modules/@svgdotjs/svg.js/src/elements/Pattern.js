import { nodeOrNew, register, wrapWithAttrCheck } from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import Box from '../types/Box.js'
import Container from './Container.js'
import baseFind from '../modules/core/selector.js'

export default class Pattern extends Container {
  // Initialize node
  constructor(node, attrs = node) {
    super(nodeOrNew('pattern', node), attrs)
  }

  // custom attr to handle transform
  attr(a, b, c) {
    if (a === 'transform') a = 'patternTransform'
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

  // Update pattern by rebuilding
  update(block) {
    // remove content
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

registerMethods({
  Container: {
    // Create pattern element in defs
    pattern(...args) {
      return this.defs().pattern(...args)
    }
  },
  Defs: {
    pattern: wrapWithAttrCheck(function (width, height, block) {
      return this.put(new Pattern()).update(block).attr({
        x: 0,
        y: 0,
        width: width,
        height: height,
        patternUnits: 'userSpaceOnUse'
      })
    })
  }
})

register(Pattern, 'Pattern')
