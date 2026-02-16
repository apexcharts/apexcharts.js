/**
 * Minimal DOM shim for Server-Side Rendering
 * Provides just enough SVG element emulation to create chart structure without full DOM
 */

/**
 * Mock SVG element for SSR environment
 */
class SSRElement {
  constructor(nodeName, namespaceURI = null) {
    this.nodeName = nodeName
    this.namespaceURI = namespaceURI
    this.attributes = new Map()
    this.children = []
    this.textContent = ''
    this.style = {}
    this.classList = new SSRClassList()
    this.parentNode = null
  }

  setAttribute(name, value) {
    this.attributes.set(name, value)
  }

  getAttribute(name) {
    return this.attributes.get(name)
  }

  removeAttribute(name) {
    this.attributes.delete(name)
  }

  hasAttribute(name) {
    return this.attributes.has(name)
  }

  appendChild(child) {
    if (child && child !== this) {
      child.parentNode = this
      this.children.push(child)
    }
    return child
  }

  removeChild(child) {
    const index = this.children.indexOf(child)
    if (index !== -1) {
      this.children.splice(index, 1)
      child.parentNode = null
    }
    return child
  }

  insertBefore(newNode, referenceNode) {
    if (!referenceNode) {
      return this.appendChild(newNode)
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
      this.children.forEach(child => {
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
      y: 0
    }
  }

  getRootNode() {
    let root = this
    while (root.parentNode) {
      root = root.parentNode
    }
    return root
  }

  toString() {
    let attrs = ''
    this.attributes.forEach((value, key) => {
      attrs += ` ${key}="${value}"`
    })

    if (this.children.length === 0 && !this.textContent) {
      return `<${this.nodeName}${attrs}/>`
    }

    const childrenStr = this.children.map(c => c.toString()).join('')
    return `<${this.nodeName}${attrs}>${this.textContent}${childrenStr}</${this.nodeName}>`
  }

  // Property getters/setters
  get innerHTML() {
    return this.children.map(c => c.toString()).join('')
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

  add(...classNames) {
    classNames.forEach(name => this.classes.add(name))
  }

  remove(...classNames) {
    classNames.forEach(name => this.classes.delete(name))
  }

  contains(className) {
    return this.classes.has(className)
  }

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
    return {
      nodeName: '#text',
      nodeType: 3,
      textContent: data,
      toString() {
        return this.textContent
      }
    }
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
   * @returns {Array}
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
      y: 0
    }
  }

  /**
   * Create mock XMLSerializer for SSR
   * @returns {object} XMLSerializer mock
   */
  createXMLSerializer() {
    return {
      serializeToString(element) {
        return element.toString ? element.toString() : ''
      }
    }
  }

  /**
   * Create mock DOMParser for SSR
   * @returns {object} DOMParser mock
   */
  createDOMParser() {
    return {
      parseFromString(str, _type) {
        // Basic mock - returns a simple element
        const root = new SSRElement('root')
        root.innerHTML = str
        return {
          documentElement: root
        }
      }
    }
  }
}

export { SSRElement, SSRClassList }
