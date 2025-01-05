import { nodeOrNew, register, wrapWithAttrCheck } from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import Container from './Container.js'
import baseFind from '../modules/core/selector.js'

export default class ClipPath extends Container {
  constructor(node, attrs = node) {
    super(nodeOrNew('clipPath', node), attrs)
  }

  // Unclip all clipped elements and remove itself
  remove() {
    // unclip all targets
    this.targets().forEach(function (el) {
      el.unclip()
    })

    // remove clipPath from parent
    return super.remove()
  }

  targets() {
    return baseFind('svg [clip-path*=' + this.id() + ']')
  }
}

registerMethods({
  Container: {
    // Create clipping element
    clip: wrapWithAttrCheck(function () {
      return this.defs().put(new ClipPath())
    })
  },
  Element: {
    // Distribute clipPath to svg element
    clipper() {
      return this.reference('clip-path')
    },

    clipWith(element) {
      // use given clip or create a new one
      const clipper =
        element instanceof ClipPath
          ? element
          : this.parent().clip().add(element)

      // apply mask
      return this.attr('clip-path', 'url(#' + clipper.id() + ')')
    },

    // Unclip element
    unclip() {
      return this.attr('clip-path', null)
    }
  }
})

register(ClipPath, 'ClipPath')
