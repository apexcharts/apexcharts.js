// @ts-check
import SVGElement from './SVGElement'
import { SVGNS } from './math'
import { SVGGradient } from './SVGGradient'
import { SVGPattern } from './SVGPattern'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'

export default class SVGContainer extends SVGElement {
  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  line(x1, y1, x2, y2) {
    const el = this._make('line')
    if (x1 !== undefined) {
      el.attr({ x1, y1, x2, y2 })
    }
    return el
  }

  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} h
   */
  rect(w, h) {
    const el = this._make('rect')
    if (w !== undefined) {
      el.attr({ width: w, height: h })
    }
    return el
  }

  /**
   * @param {number} d
   */
  circle(d) {
    const el = this._make('circle')
    if (d !== undefined) {
      el.attr({ r: d / 2, cx: d / 2, cy: d / 2 })
    }
    return el
  }

  /**
   * @param {string} d
   */
  path(d) {
    const el = this._make('path')
    if (d) el.attr('d', d)
    return el
  }

  /**
   * @param {string} pts
   */
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

  /**
   * @param {string} textContent
   */
  plain(textContent) {
    const node = BrowserAPIs.createElementNS(SVGNS, 'text')
    node.textContent = textContent
    const el = new SVGElement(node)
    this.node.appendChild(node)
    return el
  }

  /**
   * @param {object} builder
   */
  text(builder) {
    const node = BrowserAPIs.createElementNS(SVGNS, 'text')
    const el = new SVGElement(node)
    this.node.appendChild(node)
    if (typeof builder === 'function') {
      builder(new TspanBuilder(node))
    }
    return el
  }

  /**
   * @param {string} url
   * @param {Function} callback
   */
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

  /**
   * @param {string} type
   * @param {object} builder
   */
  gradient(type, builder) {
    return new SVGGradient(this, type, builder)
  }

  /**
   * @param {number} w
   * @param {number} h
   * @param {Function} builder
   */
  pattern(w, h, builder) {
    return new SVGPattern(this, w, h, builder)
  }

  /**
   * @param {string} tag
   */
  _make(tag) {
    const node = BrowserAPIs.createElementNS(SVGNS, tag)
    this.node.appendChild(node)
    return new SVGElement(node)
  }

  /**
   * @param {string} tag
   */
  _makeContainer(tag) {
    const node = BrowserAPIs.createElementNS(SVGNS, tag)
    this.node.appendChild(node)
    return new SVGContainer(node)
  }
}

class TspanBuilder {
  /**
   * @param {any} textNode
   */
  constructor(textNode) {
    this.textNode = textNode
  }

  /**
   * @param {string} text
   */
  tspan(text) {
    const tspan = BrowserAPIs.createElementNS(SVGNS, 'tspan')
    tspan.textContent = text
    this.textNode.appendChild(tspan)
    return new TspanWrapper(tspan, this.textNode)
  }
}

class TspanWrapper {
  /**
   * @param {any} node
   * @param {any} textNode
   */
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
