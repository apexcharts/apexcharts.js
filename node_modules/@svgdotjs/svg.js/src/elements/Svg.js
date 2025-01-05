import {
  adopt,
  nodeOrNew,
  register,
  wrapWithAttrCheck
} from '../utils/adopter.js'
import { svg, xlink, xmlns } from '../modules/core/namespaces.js'
import { registerMethods } from '../utils/methods.js'
import Container from './Container.js'
import Defs from './Defs.js'
import { globals } from '../utils/window.js'

export default class Svg extends Container {
  constructor(node, attrs = node) {
    super(nodeOrNew('svg', node), attrs)
    this.namespace()
  }

  // Creates and returns defs element
  defs() {
    if (!this.isRoot()) return this.root().defs()

    return adopt(this.node.querySelector('defs')) || this.put(new Defs())
  }

  isRoot() {
    return (
      !this.node.parentNode ||
      (!(this.node.parentNode instanceof globals.window.SVGElement) &&
        this.node.parentNode.nodeName !== '#document-fragment')
    )
  }

  // Add namespaces
  namespace() {
    if (!this.isRoot()) return this.root().namespace()
    return this.attr({ xmlns: svg, version: '1.1' }).attr(
      'xmlns:xlink',
      xlink,
      xmlns
    )
  }

  removeNamespace() {
    return this.attr({ xmlns: null, version: null })
      .attr('xmlns:xlink', null, xmlns)
      .attr('xmlns:svgjs', null, xmlns)
  }

  // Check if this is a root svg
  // If not, call root() from this element
  root() {
    if (this.isRoot()) return this
    return super.root()
  }
}

registerMethods({
  Container: {
    // Create nested svg document
    nested: wrapWithAttrCheck(function () {
      return this.put(new Svg())
    })
  }
})

register(Svg, 'Svg', true)
