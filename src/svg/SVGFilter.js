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
   * Elements passing the same `key` share one filter per <svg>, so `key`
   * must stand for everything `fn` writes into it.
   * @param {Function} fn
   * @param {string} [key] none: a filter of its own
   */
  ElementClass.prototype.filterWith = function (fn, key = '') {
    let svgRoot = this.node
    while (svgRoot && svgRoot.nodeName !== 'svg') {
      svgRoot = svgRoot.parentNode
    }
    const shared = (svgRoot && svgRoot.sharedFilters) || {}
    let filter = shared[key]
    // rebuilt once swept from the defs (fastUpdate drops unused filters)
    if (!filter || !filter.node.parentNode) {
      filter = new SVGFilter()
      // Add filter to nearest <defs>
      if (svgRoot) {
        let defs = svgRoot.querySelector('defs')
        if (!defs) {
          defs = BrowserAPIs.createElementNS(SVGNS, 'defs')
          svgRoot.insertBefore(defs, svgRoot.firstChild)
        }
        defs.appendChild(filter.node)
        if (key) (svgRoot.sharedFilters = shared)[key] = filter
      }
      filter.shared = key
      fn(new FilterBuilder(filter))
    }
    this._filter = filter
    this.attr('filter', 'url(#' + filter._id + ')')
    return this
  }

  /**
   * @param {boolean} all also remove the filter, unless it is shared
   */
  ElementClass.prototype.unfilter = function (all) {
    const filter = this._filter
    if (filter) {
      this.node.removeAttribute('filter')
      if (all && !filter.shared && filter.node.parentNode) {
        filter.node.parentNode.removeChild(filter.node)
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
