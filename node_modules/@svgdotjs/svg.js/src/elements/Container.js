import { register } from '../utils/adopter.js'
import Element from './Element.js'

export default class Container extends Element {
  flatten() {
    this.each(function () {
      if (this instanceof Container) {
        return this.flatten().ungroup()
      }
    })

    return this
  }

  ungroup(parent = this.parent(), index = parent.index(this)) {
    // when parent != this, we want append all elements to the end
    index = index === -1 ? parent.children().length : index

    this.each(function (i, children) {
      // reverse each
      return children[children.length - i - 1].toParent(parent, index)
    })

    return this.remove()
  }
}

register(Container, 'Container')
