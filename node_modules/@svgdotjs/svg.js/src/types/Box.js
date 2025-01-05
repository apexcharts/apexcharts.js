import { delimiter } from '../modules/core/regex.js'
import { globals } from '../utils/window.js'
import { register } from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import Matrix from './Matrix.js'
import Point from './Point.js'
import parser from '../modules/core/parser.js'

export function isNulledBox(box) {
  return !box.width && !box.height && !box.x && !box.y
}

export function domContains(node) {
  return (
    node === globals.document ||
    (
      globals.document.documentElement.contains ||
      function (node) {
        // This is IE - it does not support contains() for top-level SVGs
        while (node.parentNode) {
          node = node.parentNode
        }
        return node === globals.document
      }
    ).call(globals.document.documentElement, node)
  )
}

export default class Box {
  constructor(...args) {
    this.init(...args)
  }

  addOffset() {
    // offset by window scroll position, because getBoundingClientRect changes when window is scrolled
    this.x += globals.window.pageXOffset
    this.y += globals.window.pageYOffset
    return new Box(this)
  }

  init(source) {
    const base = [0, 0, 0, 0]
    source =
      typeof source === 'string'
        ? source.split(delimiter).map(parseFloat)
        : Array.isArray(source)
          ? source
          : typeof source === 'object'
            ? [
                source.left != null ? source.left : source.x,
                source.top != null ? source.top : source.y,
                source.width,
                source.height
              ]
            : arguments.length === 4
              ? [].slice.call(arguments)
              : base

    this.x = source[0] || 0
    this.y = source[1] || 0
    this.width = this.w = source[2] || 0
    this.height = this.h = source[3] || 0

    // Add more bounding box properties
    this.x2 = this.x + this.w
    this.y2 = this.y + this.h
    this.cx = this.x + this.w / 2
    this.cy = this.y + this.h / 2

    return this
  }

  isNulled() {
    return isNulledBox(this)
  }

  // Merge rect box with another, return a new instance
  merge(box) {
    const x = Math.min(this.x, box.x)
    const y = Math.min(this.y, box.y)
    const width = Math.max(this.x + this.width, box.x + box.width) - x
    const height = Math.max(this.y + this.height, box.y + box.height) - y

    return new Box(x, y, width, height)
  }

  toArray() {
    return [this.x, this.y, this.width, this.height]
  }

  toString() {
    return this.x + ' ' + this.y + ' ' + this.width + ' ' + this.height
  }

  transform(m) {
    if (!(m instanceof Matrix)) {
      m = new Matrix(m)
    }

    let xMin = Infinity
    let xMax = -Infinity
    let yMin = Infinity
    let yMax = -Infinity

    const pts = [
      new Point(this.x, this.y),
      new Point(this.x2, this.y),
      new Point(this.x, this.y2),
      new Point(this.x2, this.y2)
    ]

    pts.forEach(function (p) {
      p = p.transform(m)
      xMin = Math.min(xMin, p.x)
      xMax = Math.max(xMax, p.x)
      yMin = Math.min(yMin, p.y)
      yMax = Math.max(yMax, p.y)
    })

    return new Box(xMin, yMin, xMax - xMin, yMax - yMin)
  }
}

function getBox(el, getBBoxFn, retry) {
  let box

  try {
    // Try to get the box with the provided function
    box = getBBoxFn(el.node)

    // If the box is worthless and not even in the dom, retry
    // by throwing an error here...
    if (isNulledBox(box) && !domContains(el.node)) {
      throw new Error('Element not in the dom')
    }
  } catch (e) {
    // ... and calling the retry handler here
    box = retry(el)
  }

  return box
}

export function bbox() {
  // Function to get bbox is getBBox()
  const getBBox = (node) => node.getBBox()

  // Take all measures so that a stupid browser renders the element
  // so we can get the bbox from it when we try again
  const retry = (el) => {
    try {
      const clone = el.clone().addTo(parser().svg).show()
      const box = clone.node.getBBox()
      clone.remove()
      return box
    } catch (e) {
      // We give up...
      throw new Error(
        `Getting bbox of element "${
          el.node.nodeName
        }" is not possible: ${e.toString()}`
      )
    }
  }

  const box = getBox(this, getBBox, retry)
  const bbox = new Box(box)

  return bbox
}

export function rbox(el) {
  const getRBox = (node) => node.getBoundingClientRect()
  const retry = (el) => {
    // There is no point in trying tricks here because if we insert the element into the dom ourselves
    // it obviously will be at the wrong position
    throw new Error(
      `Getting rbox of element "${el.node.nodeName}" is not possible`
    )
  }

  const box = getBox(this, getRBox, retry)
  const rbox = new Box(box)

  // If an element was passed, we want the bbox in the coordinate system of that element
  if (el) {
    return rbox.transform(el.screenCTM().inverseO())
  }

  // Else we want it in absolute screen coordinates
  // Therefore we need to add the scrollOffset
  return rbox.addOffset()
}

// Checks whether the given point is inside the bounding box
export function inside(x, y) {
  const box = this.bbox()

  return (
    x > box.x && y > box.y && x < box.x + box.width && y < box.y + box.height
  )
}

registerMethods({
  viewbox: {
    viewbox(x, y, width, height) {
      // act as getter
      if (x == null) return new Box(this.attr('viewBox'))

      // act as setter
      return this.attr('viewBox', new Box(x, y, width, height))
    },

    zoom(level, point) {
      // Its best to rely on the attributes here and here is why:
      // clientXYZ: Doesn't work on non-root svgs because they dont have a CSSBox (silly!)
      // getBoundingClientRect: Doesn't work because Chrome just ignores width and height of nested svgs completely
      //                        that means, their clientRect is always as big as the content.
      //                        Furthermore this size is incorrect if the element is further transformed by its parents
      // computedStyle: Only returns meaningful values if css was used with px. We dont go this route here!
      // getBBox: returns the bounding box of its content - that doesn't help!
      let { width, height } = this.attr(['width', 'height'])

      // Width and height is a string when a number with a unit is present which we can't use
      // So we try clientXYZ
      if (
        (!width && !height) ||
        typeof width === 'string' ||
        typeof height === 'string'
      ) {
        width = this.node.clientWidth
        height = this.node.clientHeight
      }

      // Giving up...
      if (!width || !height) {
        throw new Error(
          'Impossible to get absolute width and height. Please provide an absolute width and height attribute on the zooming element'
        )
      }

      const v = this.viewbox()

      const zoomX = width / v.width
      const zoomY = height / v.height
      const zoom = Math.min(zoomX, zoomY)

      if (level == null) {
        return zoom
      }

      let zoomAmount = zoom / level

      // Set the zoomAmount to the highest value which is safe to process and recover from
      // The * 100 is a bit of wiggle room for the matrix transformation
      if (zoomAmount === Infinity) zoomAmount = Number.MAX_SAFE_INTEGER / 100

      point =
        point || new Point(width / 2 / zoomX + v.x, height / 2 / zoomY + v.y)

      const box = new Box(v).transform(
        new Matrix({ scale: zoomAmount, origin: point })
      )

      return this.viewbox(box)
    }
  }
})

register(Box, 'Box')
