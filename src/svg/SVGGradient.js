import SVGElement from './SVGElement'
import { SVGNS } from './math'

let gradientCounter = 0

class SVGGradient extends SVGElement {
  constructor(container, type, builder) {
    const tag = type === 'radial' ? 'radialGradient' : 'linearGradient'
    const node = document.createElementNS(SVGNS, tag)
    super(node)

    this._id = 'SvgjsGradient' + ++gradientCounter
    this.attr('id', this._id)

    if (typeof builder === 'function') {
      builder(new StopBuilder(this))
    }

    // Add to <defs>
    let defs = container.node.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS(SVGNS, 'defs')
      container.node.appendChild(defs)
    }
    defs.appendChild(this.node)
  }

  stop(offset, color, opacity) {
    const s = document.createElementNS(SVGNS, 'stop')
    s.setAttribute('offset', offset)
    s.setAttribute('stop-color', color)
    if (opacity !== undefined) s.setAttribute('stop-opacity', opacity)
    this.node.appendChild(s)
    return this
  }

  from(x, y) {
    return this.attr({ x1: x, y1: y })
  }

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
  constructor(gradient) {
    this.gradient = gradient
  }

  stop(offset, color, opacity) {
    this.gradient.stop(offset, color, opacity)
    return this
  }
}

export { SVGGradient }
