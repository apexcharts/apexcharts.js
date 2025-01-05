import {
  nodeOrNew,
  register,
  wrapWithAttrCheck,
  extend
} from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import Container from './Container.js'
import * as containerGeometry from '../modules/core/containerGeometry.js'

export default class G extends Container {
  constructor(node, attrs = node) {
    super(nodeOrNew('g', node), attrs)
  }
}

extend(G, containerGeometry)

registerMethods({
  Container: {
    // Create a group element
    group: wrapWithAttrCheck(function () {
      return this.put(new G())
    })
  }
})

register(G, 'G')
