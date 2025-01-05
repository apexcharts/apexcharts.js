import { nodeOrNew, register } from '../utils/adopter.js'
import Container from './Container.js'

export default class Defs extends Container {
  constructor(node, attrs = node) {
    super(nodeOrNew('defs', node), attrs)
  }

  flatten() {
    return this
  }

  ungroup() {
    return this
  }
}

register(Defs, 'Defs')
