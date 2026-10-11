// @ts-check
/**
 * The DOM that renderToString draws into.
 *
 * DOMShim.js ships in every bundle and only has to keep chart code from
 * throwing outside a browser. Rendering a chart server-side asks for more,
 * starting with the namespaced attributes every <image> and textPath is
 * linked with. That lives here, in the SSR bundle only.
 */
import { SSRDOMShim, SSRElement } from './DOMShim.js'

const XLINK = 'http://www.w3.org/1999/xlink'

class SSRRenderElement extends SSRElement {
  /**
   * The browser serializes an xlink attribute with its prefix and declares
   * the namespace where it is first used, so a standalone .svg file keeps
   * its links.
   * @param {string|null} namespaceURI
   * @param {string} name
   * @param {any} value
   */
  setAttributeNS(namespaceURI, name, value) {
    if (namespaceURI === XLINK) {
      this.setAttribute('xmlns:xlink', XLINK)
      if (name.indexOf(':') < 0) name = 'xlink:' + name
    }
    this.setAttribute(name, value)
  }
}

class SSRRenderShim extends SSRDOMShim {
  /**
   * @param {string} namespaceURI
   * @param {string} qualifiedName
   */
  createElementNS(namespaceURI, qualifiedName) {
    return new SSRRenderElement(qualifiedName, namespaceURI)
  }
}

export { SSRRenderShim, SSRRenderElement }
