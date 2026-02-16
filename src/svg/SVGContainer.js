import SVGElement from './SVGElement'
import { SVGNS } from './math'
import { SVGGradient } from './SVGGradient'
import { SVGPattern } from './SVGPattern'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'

export default class SVGContainer extends SVGElement {
  line(x1, y1, x2, y2) {
    const el = this._make('line')
    if (x1 !== undefined) {
      el.attr({ x1, y1, x2, y2 })
    }
    return el
  }

  rect(w, h) {
    const el = this._make('rect')
    if (w !== undefined) {
      el.attr({ width: w, height: h })
    }
    return el
  }

  circle(d) {
    const el = this._make('circle')
    if (d !== undefined) {
      el.attr({ r: d / 2, cx: d / 2, cy: d / 2 })
    }
    return el
  }

  path(d) {
    const el = this._make('path')
    if (d) el.attr('d', d)
    return el
  }

  polygon(pts) {
    const el = this._make('polygon')
    if (pts) el.attr('points', pts)
    return el
  }

  group() {
    return this._makeContainer('g')
  }

  defs() {
    return this._makeContainer('defs')
  }

  plain(textContent) {
    const node = BrowserAPIs.createElementNS(SVGNS, 'text')
    node.textContent = textContent
    const el = new SVGElement(node)
    this.node.appendChild(node)
    return el
  }

  text(builder) {
    const node = BrowserAPIs.createElementNS(SVGNS, 'text')
    const el = new SVGElement(node)
    this.node.appendChild(node)
    if (typeof builder === 'function') {
      builder(new TspanBuilder(node))
    }
    return el
  }

  image(url, callback) {
    const node = BrowserAPIs.createElementNS(SVGNS, 'image')
    node.setAttributeNS('http://www.w3.org/1999/xlink', 'href', url)
    const el = new SVGElement(node)
    this.node.appendChild(node)

    if (typeof callback === 'function') {
      const img = new Image()
      img.onload = function () {
        el.size(img.width, img.height)
        callback.call(el, { width: img.width, height: img.height })
      }
      img.src = url
    }

    return el
  }

  gradient(type, builder) {
    return new SVGGradient(this, type, builder)
  }

  pattern(w, h, builder) {
    return new SVGPattern(this, w, h, builder)
  }

  _make(tag) {
    const node = BrowserAPIs.createElementNS(SVGNS, tag)
    this.node.appendChild(node)
    return new SVGElement(node)
  }

  _makeContainer(tag) {
    const node = BrowserAPIs.createElementNS(SVGNS, tag)
    this.node.appendChild(node)
    return new SVGContainer(node)
  }
}

class TspanBuilder {
  constructor(textNode) {
    this.textNode = textNode
  }

  tspan(text) {
    const tspan = BrowserAPIs.createElementNS(SVGNS, 'tspan')
    tspan.textContent = text
    this.textNode.appendChild(tspan)
    return new TspanWrapper(tspan, this.textNode)
  }
}

class TspanWrapper {
  constructor(node, textNode) {
    this.node = node
    this.textNode = textNode
  }

  newLine() {
    // Mark as newline tspan — x will be propagated when parent text sets x
    this.node.setAttribute('dy', '1.1em')
    this.node.dataset.newline = '1'
    return this
  }
}
