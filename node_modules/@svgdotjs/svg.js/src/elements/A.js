import {
  nodeOrNew,
  register,
  wrapWithAttrCheck,
  extend
} from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import { xlink } from '../modules/core/namespaces.js'
import Container from './Container.js'
import * as containerGeometry from '../modules/core/containerGeometry.js'

export default class A extends Container {
  constructor(node, attrs = node) {
    super(nodeOrNew('a', node), attrs)
  }

  // Link target attribute
  target(target) {
    return this.attr('target', target)
  }

  // Link url
  to(url) {
    return this.attr('href', url, xlink)
  }
}

extend(A, containerGeometry)

registerMethods({
  Container: {
    // Create a hyperlink element
    link: wrapWithAttrCheck(function (url) {
      return this.put(new A()).to(url)
    })
  },
  Element: {
    unlink() {
      const link = this.linker()

      if (!link) return this

      const parent = link.parent()

      if (!parent) {
        return this.remove()
      }

      const index = parent.index(link)
      parent.add(this, index)

      link.remove()
      return this
    },
    linkTo(url) {
      // reuse old link if possible
      let link = this.linker()

      if (!link) {
        link = new A()
        this.wrap(link)
      }

      if (typeof url === 'function') {
        url.call(link, link)
      } else {
        link.to(url)
      }

      return this
    },
    linker() {
      const link = this.parent()
      if (link && link.node.nodeName.toLowerCase() === 'a') {
        return link
      }

      return null
    }
  }
})

register(A, 'A')
