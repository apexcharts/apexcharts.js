import { attrs as defaults } from './defaults.js'
import { isNumber } from './regex.js'
import Color from '../../types/Color.js'
import SVGArray from '../../types/SVGArray.js'
import SVGNumber from '../../types/SVGNumber.js'

const colorAttributes = new Set([
  'fill',
  'stroke',
  'color',
  'bgcolor',
  'stop-color',
  'flood-color',
  'lighting-color'
])

const hooks = []
export function registerAttrHook(fn) {
  hooks.push(fn)
}

// Set svg element attribute
export default function attr(attr, val, ns) {
  // act as full getter
  if (attr == null) {
    // get an object of attributes
    attr = {}
    val = this.node.attributes

    for (const node of val) {
      attr[node.nodeName] = isNumber.test(node.nodeValue)
        ? parseFloat(node.nodeValue)
        : node.nodeValue
    }

    return attr
  } else if (attr instanceof Array) {
    // loop through array and get all values
    return attr.reduce((last, curr) => {
      last[curr] = this.attr(curr)
      return last
    }, {})
  } else if (typeof attr === 'object' && attr.constructor === Object) {
    // apply every attribute individually if an object is passed
    for (val in attr) this.attr(val, attr[val])
  } else if (val === null) {
    // remove value
    this.node.removeAttribute(attr)
  } else if (val == null) {
    // act as a getter if the first and only argument is not an object
    val = this.node.getAttribute(attr)
    return val == null
      ? defaults[attr]
      : isNumber.test(val)
        ? parseFloat(val)
        : val
  } else {
    // Loop through hooks and execute them to convert value
    val = hooks.reduce((_val, hook) => {
      return hook(attr, _val, this)
    }, val)

    // ensure correct numeric values (also accepts NaN and Infinity)
    if (typeof val === 'number') {
      val = new SVGNumber(val)
    } else if (colorAttributes.has(attr) && Color.isColor(val)) {
      // ensure full hex color
      val = new Color(val)
    } else if (val.constructor === Array) {
      // Check for plain arrays and parse array values
      val = new SVGArray(val)
    }

    // if the passed attribute is leading...
    if (attr === 'leading') {
      // ... call the leading method instead
      if (this.leading) {
        this.leading(val)
      }
    } else {
      // set given attribute on node
      typeof ns === 'string'
        ? this.node.setAttributeNS(ns, attr, val.toString())
        : this.node.setAttribute(attr, val.toString())
    }

    // rebuild if required
    if (this.rebuild && (attr === 'font-size' || attr === 'x')) {
      this.rebuild()
    }
  }

  return this
}
