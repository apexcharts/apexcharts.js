// @ts-check
import SVGElement from './SVGElement'
import { SVGNS } from './math'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'

let filterCounter = 0

class SVGFilter extends SVGElement {
  constructor() {
    const node = BrowserAPIs.createElementNS(SVGNS, 'filter')
    super(node)

    this._id = 'SvgjsFilter' + ++filterCounter
    this.attr('id', this._id)
  }

  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} h
   * @param {number} x
   * @param {number} y
   */
  /**
   * @param {number} w
   * @param {number} h
   * @param {number} [x]
   * @param {number} [y]
   */
  size(w, h, x, y) {
    return this.attr({ width: w, height: h, x, y })
  }
}

class FilterBuilder {
  /**
   * @param {any} filter
   */
  constructor(filter) {
    this.filter = filter
  }

  /**
   * @param {object} attrs
   */
  colorMatrix(attrs) {
    return this._primitive('feColorMatrix', attrs)
  }

  /**
   * @param {object} attrs
   */
  offset(attrs) {
    return this._primitive('feOffset', attrs)
  }

  /**
   * @param {object} attrs
   */
  gaussianBlur(attrs) {
    return this._primitive('feGaussianBlur', attrs)
  }

  /**
   * @param {object} attrs
   */
  flood(attrs) {
    return this._primitive('feFlood', attrs)
  }

  /**
   * @param {object} attrs
   */
  composite(attrs) {
    return this._primitive('feComposite', attrs)
  }

  /**
   * @param {string[]} sources
   */
  merge(sources) {
    const m = BrowserAPIs.createElementNS(SVGNS, 'feMerge')
    /**
     * @param {string} src
     */
    sources.forEach((/** @type {any} */ src) => {
      const mn = BrowserAPIs.createElementNS(SVGNS, 'feMergeNode')
      mn.setAttribute('in', src)
      m.appendChild(mn)
    })
    this.filter.node.appendChild(m)
    return new SVGElement(m)
  }

  /**
   * @param {string} tag
   * @param {Record<string, any>} attrs
   */
  _primitive(tag, attrs) {
    const el = BrowserAPIs.createElementNS(SVGNS, tag)
    for (const key in attrs) {
      el.setAttribute(key, attrs[key])
    }
    this.filter.node.appendChild(el)
    return new SVGElement(el)
  }
}

// Install filter methods on SVGElement prototype
/**
 * @param {any} ElementClass
 */
function installFilterMethods(ElementClass) {
  /**
   * @param {Function} fn
   */
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
        defs = BrowserAPIs.createElementNS(SVGNS, 'defs')
        svgRoot.insertBefore(defs, svgRoot.firstChild)
      }
      defs.appendChild(filter.node)
    }

    fn(new FilterBuilder(filter))
    this.attr('filter', 'url(#' + filter._id + ')')
    return this
  }

  /**
   * @param {boolean} all
   */
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
