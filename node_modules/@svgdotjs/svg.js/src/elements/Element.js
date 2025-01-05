import { bbox, rbox, inside } from '../types/Box.js'
import { ctm, screenCTM } from '../types/Matrix.js'
import {
  extend,
  getClass,
  makeInstance,
  register,
  root
} from '../utils/adopter.js'
import { globals } from '../utils/window.js'
import { point } from '../types/Point.js'
import { proportionalSize, writeDataToDom } from '../utils/utils.js'
import { reference } from '../modules/core/regex.js'
import Dom from './Dom.js'
import List from '../types/List.js'
import SVGNumber from '../types/SVGNumber.js'

export default class Element extends Dom {
  constructor(node, attrs) {
    super(node, attrs)

    // initialize data object
    this.dom = {}

    // create circular reference
    this.node.instance = this

    if (node.hasAttribute('data-svgjs') || node.hasAttribute('svgjs:data')) {
      // pull svgjs data from the dom (getAttributeNS doesn't work in html5)
      this.setData(
        JSON.parse(node.getAttribute('data-svgjs')) ??
          JSON.parse(node.getAttribute('svgjs:data')) ??
          {}
      )
    }
  }

  // Move element by its center
  center(x, y) {
    return this.cx(x).cy(y)
  }

  // Move by center over x-axis
  cx(x) {
    return x == null
      ? this.x() + this.width() / 2
      : this.x(x - this.width() / 2)
  }

  // Move by center over y-axis
  cy(y) {
    return y == null
      ? this.y() + this.height() / 2
      : this.y(y - this.height() / 2)
  }

  // Get defs
  defs() {
    const root = this.root()
    return root && root.defs()
  }

  // Relative move over x and y axes
  dmove(x, y) {
    return this.dx(x).dy(y)
  }

  // Relative move over x axis
  dx(x = 0) {
    return this.x(new SVGNumber(x).plus(this.x()))
  }

  // Relative move over y axis
  dy(y = 0) {
    return this.y(new SVGNumber(y).plus(this.y()))
  }

  getEventHolder() {
    return this
  }

  // Set height of element
  height(height) {
    return this.attr('height', height)
  }

  // Move element to given x and y values
  move(x, y) {
    return this.x(x).y(y)
  }

  // return array of all ancestors of given type up to the root svg
  parents(until = this.root()) {
    const isSelector = typeof until === 'string'
    if (!isSelector) {
      until = makeInstance(until)
    }
    const parents = new List()
    let parent = this

    while (
      (parent = parent.parent()) &&
      parent.node !== globals.document &&
      parent.nodeName !== '#document-fragment'
    ) {
      parents.push(parent)

      if (!isSelector && parent.node === until.node) {
        break
      }
      if (isSelector && parent.matches(until)) {
        break
      }
      if (parent.node === this.root().node) {
        // We worked our way to the root and didn't match `until`
        return null
      }
    }

    return parents
  }

  // Get referenced element form attribute value
  reference(attr) {
    attr = this.attr(attr)
    if (!attr) return null

    const m = (attr + '').match(reference)
    return m ? makeInstance(m[1]) : null
  }

  // Get parent document
  root() {
    const p = this.parent(getClass(root))
    return p && p.root()
  }

  // set given data to the elements data property
  setData(o) {
    this.dom = o
    return this
  }

  // Set element size to given width and height
  size(width, height) {
    const p = proportionalSize(this, width, height)

    return this.width(new SVGNumber(p.width)).height(new SVGNumber(p.height))
  }

  // Set width of element
  width(width) {
    return this.attr('width', width)
  }

  // write svgjs data to the dom
  writeDataToDom() {
    writeDataToDom(this, this.dom)
    return super.writeDataToDom()
  }

  // Move over x-axis
  x(x) {
    return this.attr('x', x)
  }

  // Move over y-axis
  y(y) {
    return this.attr('y', y)
  }
}

extend(Element, {
  bbox,
  rbox,
  inside,
  point,
  ctm,
  screenCTM
})

register(Element, 'Element')
