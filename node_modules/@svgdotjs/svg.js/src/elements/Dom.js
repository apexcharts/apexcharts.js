import {
  adopt,
  assignNewId,
  eid,
  extend,
  makeInstance,
  create,
  register
} from '../utils/adopter.js'
import { find, findOne } from '../modules/core/selector.js'
import { globals } from '../utils/window.js'
import { map } from '../utils/utils.js'
import { svg, html } from '../modules/core/namespaces.js'
import EventTarget from '../types/EventTarget.js'
import List from '../types/List.js'
import attr from '../modules/core/attr.js'

export default class Dom extends EventTarget {
  constructor(node, attrs) {
    super()
    this.node = node
    this.type = node.nodeName

    if (attrs && node !== attrs) {
      this.attr(attrs)
    }
  }

  // Add given element at a position
  add(element, i) {
    element = makeInstance(element)

    // If non-root svg nodes are added we have to remove their namespaces
    if (
      element.removeNamespace &&
      this.node instanceof globals.window.SVGElement
    ) {
      element.removeNamespace()
    }

    if (i == null) {
      this.node.appendChild(element.node)
    } else if (element.node !== this.node.childNodes[i]) {
      this.node.insertBefore(element.node, this.node.childNodes[i])
    }

    return this
  }

  // Add element to given container and return self
  addTo(parent, i) {
    return makeInstance(parent).put(this, i)
  }

  // Returns all child elements
  children() {
    return new List(
      map(this.node.children, function (node) {
        return adopt(node)
      })
    )
  }

  // Remove all elements in this container
  clear() {
    // remove children
    while (this.node.hasChildNodes()) {
      this.node.removeChild(this.node.lastChild)
    }

    return this
  }

  // Clone element
  clone(deep = true, assignNewIds = true) {
    // write dom data to the dom so the clone can pickup the data
    this.writeDataToDom()

    // clone element
    let nodeClone = this.node.cloneNode(deep)
    if (assignNewIds) {
      // assign new id
      nodeClone = assignNewId(nodeClone)
    }
    return new this.constructor(nodeClone)
  }

  // Iterates over all children and invokes a given block
  each(block, deep) {
    const children = this.children()
    let i, il

    for (i = 0, il = children.length; i < il; i++) {
      block.apply(children[i], [i, children])

      if (deep) {
        children[i].each(block, deep)
      }
    }

    return this
  }

  element(nodeName, attrs) {
    return this.put(new Dom(create(nodeName), attrs))
  }

  // Get first child
  first() {
    return adopt(this.node.firstChild)
  }

  // Get a element at the given index
  get(i) {
    return adopt(this.node.childNodes[i])
  }

  getEventHolder() {
    return this.node
  }

  getEventTarget() {
    return this.node
  }

  // Checks if the given element is a child
  has(element) {
    return this.index(element) >= 0
  }

  html(htmlOrFn, outerHTML) {
    return this.xml(htmlOrFn, outerHTML, html)
  }

  // Get / set id
  id(id) {
    // generate new id if no id set
    if (typeof id === 'undefined' && !this.node.id) {
      this.node.id = eid(this.type)
    }

    // don't set directly with this.node.id to make `null` work correctly
    return this.attr('id', id)
  }

  // Gets index of given element
  index(element) {
    return [].slice.call(this.node.childNodes).indexOf(element.node)
  }

  // Get the last child
  last() {
    return adopt(this.node.lastChild)
  }

  // matches the element vs a css selector
  matches(selector) {
    const el = this.node
    const matcher =
      el.matches ||
      el.matchesSelector ||
      el.msMatchesSelector ||
      el.mozMatchesSelector ||
      el.webkitMatchesSelector ||
      el.oMatchesSelector ||
      null
    return matcher && matcher.call(el, selector)
  }

  // Returns the parent element instance
  parent(type) {
    let parent = this

    // check for parent
    if (!parent.node.parentNode) return null

    // get parent element
    parent = adopt(parent.node.parentNode)

    if (!type) return parent

    // loop through ancestors if type is given
    do {
      if (
        typeof type === 'string' ? parent.matches(type) : parent instanceof type
      )
        return parent
    } while ((parent = adopt(parent.node.parentNode)))

    return parent
  }

  // Basically does the same as `add()` but returns the added element instead
  put(element, i) {
    element = makeInstance(element)
    this.add(element, i)
    return element
  }

  // Add element to given container and return container
  putIn(parent, i) {
    return makeInstance(parent).add(this, i)
  }

  // Remove element
  remove() {
    if (this.parent()) {
      this.parent().removeElement(this)
    }

    return this
  }

  // Remove a given child
  removeElement(element) {
    this.node.removeChild(element.node)

    return this
  }

  // Replace this with element
  replace(element) {
    element = makeInstance(element)

    if (this.node.parentNode) {
      this.node.parentNode.replaceChild(element.node, this.node)
    }

    return element
  }

  round(precision = 2, map = null) {
    const factor = 10 ** precision
    const attrs = this.attr(map)

    for (const i in attrs) {
      if (typeof attrs[i] === 'number') {
        attrs[i] = Math.round(attrs[i] * factor) / factor
      }
    }

    this.attr(attrs)
    return this
  }

  // Import / Export raw svg
  svg(svgOrFn, outerSVG) {
    return this.xml(svgOrFn, outerSVG, svg)
  }

  // Return id on string conversion
  toString() {
    return this.id()
  }

  words(text) {
    // This is faster than removing all children and adding a new one
    this.node.textContent = text
    return this
  }

  wrap(node) {
    const parent = this.parent()

    if (!parent) {
      return this.addTo(node)
    }

    const position = parent.index(this)
    return parent.put(node, position).put(this)
  }

  // write svgjs data to the dom
  writeDataToDom() {
    // dump variables recursively
    this.each(function () {
      this.writeDataToDom()
    })

    return this
  }

  // Import / Export raw svg
  xml(xmlOrFn, outerXML, ns) {
    if (typeof xmlOrFn === 'boolean') {
      ns = outerXML
      outerXML = xmlOrFn
      xmlOrFn = null
    }

    // act as getter if no svg string is given
    if (xmlOrFn == null || typeof xmlOrFn === 'function') {
      // The default for exports is, that the outerNode is included
      outerXML = outerXML == null ? true : outerXML

      // write svgjs data to the dom
      this.writeDataToDom()
      let current = this

      // An export modifier was passed
      if (xmlOrFn != null) {
        current = adopt(current.node.cloneNode(true))

        // If the user wants outerHTML we need to process this node, too
        if (outerXML) {
          const result = xmlOrFn(current)
          current = result || current

          // The user does not want this node? Well, then he gets nothing
          if (result === false) return ''
        }

        // Deep loop through all children and apply modifier
        current.each(function () {
          const result = xmlOrFn(this)
          const _this = result || this

          // If modifier returns false, discard node
          if (result === false) {
            this.remove()

            // If modifier returns new node, use it
          } else if (result && this !== _this) {
            this.replace(_this)
          }
        }, true)
      }

      // Return outer or inner content
      return outerXML ? current.node.outerHTML : current.node.innerHTML
    }

    // Act as setter if we got a string

    // The default for import is, that the current node is not replaced
    outerXML = outerXML == null ? false : outerXML

    // Create temporary holder
    const well = create('wrapper', ns)
    const fragment = globals.document.createDocumentFragment()

    // Dump raw svg
    well.innerHTML = xmlOrFn

    // Transplant nodes into the fragment
    for (let len = well.children.length; len--; ) {
      fragment.appendChild(well.firstElementChild)
    }

    const parent = this.parent()

    // Add the whole fragment at once
    return outerXML ? this.replace(fragment) && parent : this.add(fragment)
  }
}

extend(Dom, { attr, find, findOne })
register(Dom, 'Dom')
