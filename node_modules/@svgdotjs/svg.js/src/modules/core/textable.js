import { globals } from '../../utils/window.js'

// Create plain text node
export function plain(text) {
  // clear if build mode is disabled
  if (this._build === false) {
    this.clear()
  }

  // create text node
  this.node.appendChild(globals.document.createTextNode(text))

  return this
}

// Get length of text element
export function length() {
  return this.node.getComputedTextLength()
}

// Move over x-axis
// Text is moved by its bounding box
// text-anchor does NOT matter
export function x(x, box = this.bbox()) {
  if (x == null) {
    return box.x
  }

  return this.attr('x', this.attr('x') + x - box.x)
}

// Move over y-axis
export function y(y, box = this.bbox()) {
  if (y == null) {
    return box.y
  }

  return this.attr('y', this.attr('y') + y - box.y)
}

export function move(x, y, box = this.bbox()) {
  return this.x(x, box).y(y, box)
}

// Move center over x-axis
export function cx(x, box = this.bbox()) {
  if (x == null) {
    return box.cx
  }

  return this.attr('x', this.attr('x') + x - box.cx)
}

// Move center over y-axis
export function cy(y, box = this.bbox()) {
  if (y == null) {
    return box.cy
  }

  return this.attr('y', this.attr('y') + y - box.cy)
}

export function center(x, y, box = this.bbox()) {
  return this.cx(x, box).cy(y, box)
}

export function ax(x) {
  return this.attr('x', x)
}

export function ay(y) {
  return this.attr('y', y)
}

export function amove(x, y) {
  return this.ax(x).ay(y)
}

// Enable / disable build mode
export function build(build) {
  this._build = !!build
  return this
}
