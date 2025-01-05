import { nodeOrNew, register, wrapWithAttrCheck } from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import { xlink } from '../modules/core/namespaces.js'
import Shape from './Shape.js'

export default class Use extends Shape {
  constructor(node, attrs = node) {
    super(nodeOrNew('use', node), attrs)
  }

  // Use element as a reference
  use(element, file) {
    // Set lined element
    return this.attr('href', (file || '') + '#' + element, xlink)
  }
}

registerMethods({
  Container: {
    // Create a use element
    use: wrapWithAttrCheck(function (element, file) {
      return this.put(new Use()).use(element, file)
    })
  }
})

register(Use, 'Use')
