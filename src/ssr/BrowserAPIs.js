/**
 * Browser API abstraction layer for SSR support
 * Routes to either real browser APIs or SSR shims based on environment
 */

import { Environment } from '../utils/Environment.js'
import { SSRDOMShim } from './DOMShim.js'

let shim = null
let xmlSerializerInstance = null
let domParserInstance = null

/**
 * Browser API abstraction that works in both browser and Node.js
 */
export class BrowserAPIs {
  /**
   * Initialize the SSR shim if in SSR environment
   * Must be called before using other methods
   */
  static init() {
    if (Environment.isSSR() && !shim) {
      shim = new SSRDOMShim()
    }
  }

  /**
   * Create an SVG element with namespace
   * @param {string} namespaceURI - Namespace URI
   * @param {string} qualifiedName - Element tag name
   * @returns {Element|SSRElement} SVG element
   */
  static createElementNS(namespaceURI, qualifiedName) {
    if (Environment.isSSR()) {
      if (!shim) this.init()
      return shim.createElementNS(namespaceURI, qualifiedName)
    }
    return document.createElementNS(namespaceURI, qualifiedName)
  }

  /**
   * Create a text node
   * @param {string} data - Text content
   * @returns {Text|object} Text node
   */
  static createTextNode(data) {
    if (Environment.isSSR()) {
      if (!shim) this.init()
      return shim.createTextNode(data)
    }
    return document.createTextNode(data)
  }

  /**
   * Query selector
   * @param {string} selector - CSS selector
   * @returns {Element|null}
   */
  static querySelector(selector) {
    if (Environment.isSSR()) {
      return null
    }
    return document.querySelector(selector)
  }

  /**
   * Query selector all
   * @param {string} selector - CSS selector
   * @returns {NodeList|Array}
   */
  static querySelectorAll(selector) {
    if (Environment.isSSR()) {
      return []
    }
    return document.querySelectorAll(selector)
  }

  /**
   * Get computed style for an element
   * @param {Element} element - Element to get styles for
   * @returns {CSSStyleDeclaration|object}
   */
  static getComputedStyle(element) {
    if (Environment.isSSR()) {
      return {}
    }
    return window.getComputedStyle(element)
  }

  /**
   * Get bounding client rect for an element
   * @param {Element} element - Element to measure
   * @returns {DOMRect|object}
   */
  static getBoundingClientRect(element) {
    if (Environment.isSSR()) {
      if (!shim) this.init()
      return shim.getBoundingClientRect(element)
    }
    return element
      ? element.getBoundingClientRect()
      : {
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
   * Get XMLSerializer instance
   * @returns {XMLSerializer|object}
   */
  static getXMLSerializer() {
    if (Environment.isSSR()) {
      if (!shim) this.init()
      if (!xmlSerializerInstance) {
        xmlSerializerInstance = shim.createXMLSerializer()
      }
      return xmlSerializerInstance
    }
    if (!xmlSerializerInstance) {
      xmlSerializerInstance = new XMLSerializer()
    }
    return xmlSerializerInstance
  }

  /**
   * Get DOMParser instance
   * @returns {DOMParser|object}
   */
  static getDOMParser() {
    if (Environment.isSSR()) {
      if (!shim) this.init()
      if (!domParserInstance) {
        domParserInstance = shim.createDOMParser()
      }
      return domParserInstance
    }
    if (!domParserInstance) {
      domParserInstance = new DOMParser()
    }
    return domParserInstance
  }

  /**
   * Add event listener to window
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {object} options - Event options
   */
  static addWindowEventListener(event, handler, options) {
    if (Environment.isBrowser()) {
      window.addEventListener(event, handler, options)
    }
    // No-op in SSR
  }

  /**
   * Remove event listener from window
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   * @param {object} options - Event options
   */
  static removeWindowEventListener(event, handler, options) {
    if (Environment.isBrowser()) {
      window.removeEventListener(event, handler, options)
    }
    // No-op in SSR
  }

  /**
   * Request animation frame
   * @param {Function} callback - Callback function
   * @returns {number|null}
   */
  static requestAnimationFrame(callback) {
    if (Environment.isBrowser()) {
      return window.requestAnimationFrame(callback)
    }
    // Execute immediately in SSR
    callback()
    return null
  }

  /**
   * Cancel animation frame
   * @param {number} id - Animation frame ID
   */
  static cancelAnimationFrame(id) {
    if (Environment.isBrowser() && id) {
      window.cancelAnimationFrame(id)
    }
    // No-op in SSR
  }

  /**
   * Check if element exists
   * @param {Element} element - Element to check
   * @returns {boolean}
   */
  static elementExists(element) {
    if (!element) return false

    if (Environment.isSSR()) {
      // In SSR, element is valid if it's our mock element
      return element._ssrMode === true || element.nodeName !== undefined
    }

    // In browser, check if element is in DOM
    return element.getRootNode
      ? element.getRootNode({ composed: true }) === document ||
          element.isConnected
      : false
  }

  /**
   * Get window object (or null in SSR)
   * @returns {Window|null}
   */
  static getWindow() {
    return Environment.isBrowser() ? window : null
  }

  /**
   * Get document object (or null in SSR)
   * @returns {Document|null}
   */
  static getDocument() {
    return Environment.isBrowser() ? document : null
  }

  /**
   * Get the shim instance (for testing purposes)
   * @returns {SSRDOMShim|null}
   */
  static _getShim() {
    return shim
  }

  /**
   * Reset the shim instance (for testing purposes)
   */
  static _resetShim() {
    shim = null
    xmlSerializerInstance = null
    domParserInstance = null
  }
}
