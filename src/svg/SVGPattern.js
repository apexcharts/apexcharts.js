import SVGElement from './SVGElement'
import SVGContainer from './SVGContainer'
import { SVGNS } from './math'

let patternCounter = 0

class SVGPattern extends SVGElement {
  constructor(container, w, h, builder) {
    const node = document.createElementNS(SVGNS, 'pattern')
    super(node)

    this._id = 'SvgjsPattern' + ++patternCounter
    this.attr({
      id: this._id,
      width: w,
      height: h,
      patternUnits: 'userSpaceOnUse',
    })

    if (typeof builder === 'function') {
      // The builder callback receives a container that can create child shapes
      const patternContainer = new SVGContainer(this.node)
      builder(patternContainer)
    }

    // Add to <defs>
    let defs = container.node.querySelector('defs')
    if (!defs) {
      defs = document.createElementNS(SVGNS, 'defs')
      container.node.appendChild(defs)
    }
    defs.appendChild(this.node)
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

export { SVGPattern }
