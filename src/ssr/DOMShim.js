// @ts-check
/**
 * Minimal DOM shim for Server-Side Rendering
 * Provides just enough SVG element emulation to create chart structure without full DOM
 */

// Approximate sans-serif metrics, in em, used to estimate SVG text bounds when
// no font engine is available to measure the glyphs.
const CHAR_WIDTH_EM = 0.55
const ASCENT_EM = 0.917
const DESCENT_EM = 0.25
const LINE_HEIGHT_EM = 1.1
const DEFAULT_FONT_SIZE = 11

/**
 * Mock SVG element for SSR environment
 */
class SSRElement {
  /**
   * @param {string} nodeName
   * @param {any} namespaceURI
   */
  constructor(nodeName, namespaceURI = null) {
    this.nodeName = nodeName
    this.namespaceURI = namespaceURI
    this.attributes = new Map()
    /** @type {any[]} */
    this.children = []
    this.textContent = ''
    this.style = {}
    this.classList = new SSRClassList()
    this.parentNode = /** @type {SSRElement | null} */ (null)
    /** @type {number|undefined} */ this._ssrWidth = undefined
    /** @type {number|undefined} */ this._ssrHeight = undefined
    /** @type {boolean|undefined} */ this._ssrMode = undefined
  }

  /**
   * @param {string} name
   * @param {any} value
   */
  setAttribute(name, value) {
    this.attributes.set(name, value)
  }

  /**
   * @param {string} name
   */
  getAttribute(name) {
    return this.attributes.get(name)
  }

  /**
   * @param {string} name
   */
  removeAttribute(name) {
    this.attributes.delete(name)
  }

  /**
   * @param {string} name
   */
  hasAttribute(name) {
    return this.attributes.has(name)
  }

  /**
   * @param {any} child
   */
  appendChild(child) {
    if (child && child !== this) {
      // Mirror real DOM: re-parenting removes child from previous parent
      if (child.parentNode && child.parentNode !== this) {
        child.parentNode.removeChild(child)
      } else if (child.parentNode === this) {
        // Already a child — move to end (matches browser DOM behaviour)
        const index = this.children.indexOf(child)
        if (index !== -1) this.children.splice(index, 1)
      }
      child.parentNode = this
      this.children.push(child)
    }
    return child
  }

  /**
   * @param {any} child
   */
  removeChild(child) {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
      child.parentNode = null
    }
    return child
  }

  /**
   * @param {any} newNode
   * @param {any} referenceNode
   */
  insertBefore(newNode, referenceNode) {
    if (!referenceNode) {
      return this.appendChild(newNode)
    }
    // Mirror real DOM: remove from previous parent before inserting
    if (newNode.parentNode && newNode.parentNode !== this) {
      newNode.parentNode.removeChild(newNode)
    } else if (newNode.parentNode === this) {
      const existingIndex = this.children.indexOf(newNode)
      if (existingIndex !== -1) this.children.splice(existingIndex, 1)
    }
    const index = this.children.indexOf(referenceNode)
    if (index !== -1) {
      newNode.parentNode = this
      this.children.splice(index, 0, newNode)
    }
    return newNode
  }

  cloneNode(deep = false) {
    const clone = new SSRElement(this.nodeName, this.namespaceURI)
    clone.textContent = this.textContent

    // Copy attributes
    this.attributes.forEach((value, key) => {
      clone.attributes.set(key, value)
    })

    // Copy styles
    Object.assign(clone.style, this.style)

    // Deep clone children
    if (deep) {
      this.children.forEach((child) => {
        if (child.cloneNode) {
          clone.appendChild(child.cloneNode(true))
        }
      })
    }

    return clone
  }

  getBoundingClientRect() {
    // Return default dimensions for SSR
    return {
      width: this._ssrWidth || 0,
      height: this._ssrHeight || 0,
      top: 0,
      left: 0,
      right: this._ssrWidth || 0,
      bottom: this._ssrHeight || 0,
      x: 0,
      y: 0,
    }
  }

  getBBox() {
    if (this.nodeName !== 'text' && this.nodeName !== 'tspan') {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const lines = this._textLines()
    const longest = lines.reduce((acc, line) => Math.max(acc, line.length), 0)
    if (!longest) {
      return { x: 0, y: 0, width: 0, height: 0 }
    }

    const fontSize =
      parseFloat(this.attributes.get('font-size')) || DEFAULT_FONT_SIZE
    const width = longest * fontSize * CHAR_WIDTH_EM
    const height =
      fontSize * (ASCENT_EM + DESCENT_EM) +
      (lines.length - 1) * fontSize * LINE_HEIGHT_EM

    const anchor = this.attributes.get('text-anchor')
    const x = parseFloat(this.attributes.get('x')) || 0
    const y = parseFloat(this.attributes.get('y')) || 0

    return {
      x: anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x,
      y: y - fontSize * ASCENT_EM,
      width,
      height,
    }
  }

  /**
   * Text of this element, one entry per rendered line
   * @returns {string[]}
   */
  _textLines() {
    const tspans = this.children.filter((child) => child.nodeName === 'tspan')
    if (tspans.length) {
      return tspans.map((tspan) => String(tspan.textContent ?? ''))
    }
    return [String(this.textContent ?? '')]
  }

  getRootNode() {
    /** @type {SSRElement} */
    let root = this
    while (root.parentNode) {
      root = root.parentNode
    }
    return root
  }

  querySelector() {
    return null
  }

  querySelectorAll() {
    return []
  }

  getElementsByClassName() {
    return []
  }

  addEventListener() {}
  removeEventListener() {}

  get childNodes() {
    return this.children
  }

  toString() {
    let attrs = ''
    this.attributes.forEach((value, key) => {
      attrs += ` ${key}="${value}"`
    })

    if (this.children.length === 0 && !this.textContent) {
      return `<${this.nodeName}${attrs}/>`
    }

    const childrenStr = this.children.map((c) => c.toString()).join('')
    return `<${this.nodeName}${attrs}>${this.textContent}${childrenStr}</${this.nodeName}>`
  }

  // Property getters/setters
  get innerHTML() {
    return this.children.map((c) => c.toString()).join('')
  }

  set innerHTML(value) {
    this.children = []
    this.textContent = value
  }

  get outerHTML() {
    return this.toString()
  }

  get isConnected() {
    return true
  }
}

/**
 * Mock ClassList for SSR
 */
class SSRClassList {
  constructor() {
    this.classes = new Set()
  }

  add(/** @type {any[]} */ ...classNames) {
    classNames.forEach((name) => this.classes.add(name))
  }

  remove(/** @type {any[]} */ ...classNames) {
    classNames.forEach((name) => this.classes.delete(name))
  }

  /**
   * @param {string} className
   */
  contains(className) {
    return this.classes.has(className)
  }

  /**
   * @param {string} className
   * @param {any} force
   */
  toggle(className, force) {
    if (force === true) {
      this.classes.add(className)
      return true
    } else if (force === false) {
      this.classes.delete(className)
      return false
    } else {
      if (this.classes.has(className)) {
        this.classes.delete(className)
        return false
      } else {
        this.classes.add(className)
        return true
      }
    }
  }

  toString() {
    return Array.from(this.classes).join(' ')
  }
}

/**
 * Main DOM shim class
 */
export class SSRDOMShim {
  constructor() {
    this.SVGNS = 'http://www.w3.org/2000/svg'
    this.XLINKNS = 'http://www.w3.org/1999/xlink'
  }

  /**
   * Create SVG element with namespace
   * @param {string} namespaceURI - Namespace URI
   * @param {string} qualifiedName - Element tag name
   * @returns {SSRElement} Mock SVG element
   */
  createElementNS(namespaceURI, qualifiedName) {
    return new SSRElement(qualifiedName, namespaceURI)
  }

  /**
   * Create text node
   * @param {string} data - Text content
   * @returns {object} Text node mock
   */
  createTextNode(data) {
    const node = {
      nodeName: '#text',
      nodeType: 3,
      textContent: data,
      toString() {
        return node.textContent
      },
    }
    return node
  }

  /**
   * Query selector (returns null in SSR)
   * @returns {null}
   */
  querySelector() {
    return null
  }

  /**
   * Query selector all (returns empty array in SSR)
   * @returns {any[]}
   */
  querySelectorAll() {
    return []
  }

  /**
   * Get computed style (returns empty object in SSR)
   * @returns {object}
   */
  getComputedStyle() {
    return {}
  }

  /**
   * Get bounding client rect for element
   * @param {SSRElement} element - Element to measure
   * @returns {object} Mock dimensions
   */
  getBoundingClientRect(element) {
    if (element && element.getBoundingClientRect) {
      return element.getBoundingClientRect()
    }
    return {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
    }
  }

  /**
   * Create mock XMLSerializer for SSR
   * @returns {object} XMLSerializer mock
   */
  createXMLSerializer() {
    return {
      /**
       * @param {Element} element
       */
      serializeToString(element) {
        return element.toString ? element.toString() : ''
      },
    }
  }

  /**
   * Create mock DOMParser for SSR
   * @returns {object} DOMParser mock
   */
  createDOMParser() {
    return {
      /**
       * @param {string} str
       * @param {string} _type
       */
      parseFromString(str, _type) {
        // Basic mock - returns a simple element
        const root = new SSRElement('root')
        root.innerHTML = str
        return {
          documentElement: root,
        }
      },
    }
  }
}

export { SSRElement, SSRClassList }
