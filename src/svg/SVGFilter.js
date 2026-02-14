import SVGElement from './SVGElement'
import { SVGNS } from './math'

let filterCounter = 0

class SVGFilter extends SVGElement {
  constructor() {
    const node = document.createElementNS(SVGNS, 'filter')
    super(node)

    this._id = 'SvgjsFilter' + ++filterCounter
    this.attr('id', this._id)
  }

  size(w, h, x, y) {
    return this.attr({ width: w, height: h, x, y })
  }
  
}

class FilterBuilder {
  constructor(filter) {
    this.filter = filter
  }

  colorMatrix(attrs) {
    return this._primitive('feColorMatrix', attrs)
  }

  offset(attrs) {
    return this._primitive('feOffset', attrs)
  }

  gaussianBlur(attrs) {
    return this._primitive('feGaussianBlur', attrs)
  }

  flood(attrs) {
    return this._primitive('feFlood', attrs)
  }

  composite(attrs) {
    return this._primitive('feComposite', attrs)
  }

  merge(sources) {
    const m = document.createElementNS(SVGNS, 'feMerge')
    sources.forEach((src) => {
      const mn = document.createElementNS(SVGNS, 'feMergeNode')
      mn.setAttribute('in', src)
      m.appendChild(mn)
    })
    this.filter.node.appendChild(m)
    return new SVGElement(m)
  }

  _primitive(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag)
    for (const key in attrs) {
      el.setAttribute(key, attrs[key])
    }
    this.filter.node.appendChild(el)
    return new SVGElement(el)
  }
}

// Install filter methods on SVGElement prototype
function installFilterMethods(ElementClass) {
  ElementClass.prototype.filterWith = function (fn) {
    const filter = new SVGFilter()
    this._filter = filter

    // Add filter to nearest <defs>
    let svgRoot = this.node
    while (svgRoot && svgRoot.nodeName !== 'svg') {
      svgRoot = svgRoot.parentNode
    }
    if (svgRoot) {
      let defs = svgRoot.querySelector('defs')
      if (!defs) {
        defs = document.createElementNS(SVGNS, 'defs')
        svgRoot.insertBefore(defs, svgRoot.firstChild)
      }
      defs.appendChild(filter.node)
    }

    fn(new FilterBuilder(filter))
    this.attr('filter', 'url(#' + filter._id + ')')
    return this
  }

  ElementClass.prototype.unfilter = function (all) {
    if (this._filter) {
      this.node.removeAttribute('filter')
      if (all && this._filter.node && this._filter.node.parentNode) {
        this._filter.node.parentNode.removeChild(this._filter.node)
      }
      this._filter = null
    }
    return this
  }

  ElementClass.prototype.filterer = function () {
    return this._filter
  }
}

export { SVGFilter, FilterBuilder, installFilterMethods }
