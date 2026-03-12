// @ts-check
import SVGElement from './SVGElement'
import { SVGNS } from './math'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'

let gradientCounter = 0

class SVGGradient extends SVGElement {
  /**
   * @param {any} container
   * @param {string} type
   * @param {object} builder
   */
  constructor(container, type, builder) {
    const tag = type === 'radial' ? 'radialGradient' : 'linearGradient'
    const node = BrowserAPIs.createElementNS(SVGNS, tag)
    super(node)

    this._id = 'SvgjsGradient' + ++gradientCounter
    this.attr('id', this._id)

    if (typeof builder === 'function') {
      builder(new StopBuilder(this))
    }

    // Add to <defs>
    let defs = container.node.querySelector('defs')
    if (!defs) {
      defs = BrowserAPIs.createElementNS(SVGNS, 'defs')
      container.node.appendChild(defs)
    }
    defs.appendChild(this.node)
  }

  /**
   * @param {any} offset
   * @param {string} color
   * @param {number} opacity
   */
  stop(offset, color, opacity) {
    const s = BrowserAPIs.createElementNS(SVGNS, 'stop')
    s.setAttribute('offset', offset)
    s.setAttribute('stop-color', color)
    if (opacity !== undefined) s.setAttribute('stop-opacity', String(opacity))
    this.node.appendChild(s)
    return this
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  from(x, y) {
    return this.attr({ x1: x, y1: y })
  }

  /**
   * @param {number} x
   * @param {number} y
   */
  to(x, y) {
    return this.attr({ x2: x, y2: y })
  }

  url() {
    return 'url(#' + this._id + ')'
  }

  toString() {
    return this.url()
  }

  valueOf() {
    return this.url()
  }

  fill() {
    return this.url()
  }
}

class StopBuilder {
  /**
   * @param {any} gradient
   */
  constructor(gradient) {
    this.gradient = gradient
  }

  /**
   * @param {any} offset
   * @param {string} color
   * @param {number} opacity
   */
  stop(offset, color, opacity) {
    this.gradient.stop(offset, color, opacity)
    return this
  }
}

export { SVGGradient }
