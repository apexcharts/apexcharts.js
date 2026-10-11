// @ts-check
/**
 * The DOM that renderToString draws into.
 *
 * DOMShim.js ships in every bundle and only has to keep chart code from
 * throwing outside a browser. Rendering a chart server-side asks for more: the
 * namespaced attributes every <image> and textPath is linked with, a rotated
 * label's on-screen box, and the selector lookups the post-draw passes use to
 * find what they drew (x-axis label rotation, annotation label boxes). Those
 * live here, in the SSR bundle only.
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

  /**
   * A text element's box, estimated from getBBox and turned by the element's
   * own rotate(), so a rotated axis label measures like the browser's box.
   * Coordinates are the element's user space: there is no screen to place it
   * on, and callers only compare it with boxes taken the same way.
   */
  getBoundingClientRect() {
    if (this.nodeName !== 'text') return super.getBoundingClientRect()

    const box = this.getBBox()
    const m = /rotate\(\s*([-\d.e]+)[\s,]*([-\d.e]*)[\s,]*([-\d.e]*)/.exec(
      this.attributes.get('transform') || '',
    )
    const angle = m ? (parseFloat(m[1]) * Math.PI) / 180 : 0
    const cx = m ? Number(m[2]) : 0
    const cy = m ? Number(m[3]) : 0
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)

    const xs = []
    const ys = []
    for (const px of [box.x, box.x + box.width]) {
      for (const py of [box.y, box.y + box.height]) {
        xs.push(cx + (px - cx) * cos - (py - cy) * sin)
        ys.push(cy + (px - cx) * sin + (py - cy) * cos)
      }
    }
    const left = Math.min(...xs)
    const top = Math.min(...ys)
    const width = Math.max(...xs) - left
    const height = Math.max(...ys) - top
    return {
      width,
      height,
      top,
      left,
      right: left + width,
      bottom: top + height,
      x: left,
      y: top,
    }
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

/**
 * @param {any} el
 * @returns {string[]}
 */
const classesOf = (el) => [
  ...String(el.attributes.get('class') || '').split(/\s+/),
  ...(el.classList?.classes || []),
]

/**
 * Whether `el` matches one compound selector: a tag, `.class`, `[attr]`,
 * `[attr='value']`, `:not(compound)` and `:nth-child(n)`, in any mix. Anything
 * else matches nothing, which is what the shim answered before.
 * @param {any} el
 * @param {string} compound
 * @returns {boolean}
 */
const matchesCompound = (el, compound) => {
  if (!el || !(el.attributes instanceof Map)) return false
  const part =
    /\.([\w-]+)|\[([\w:-]+)(?:=(['"]?)([^\]]*?)\3)?\]|:not\(([^)]*)\)|:nth-child\((\d+)\)|^([\w-]+)|(.)/g
  let m
  while ((m = part.exec(compound))) {
    const [, cls, attr, , value, not, nth, tag] = m
    let ok
    if (cls !== undefined) ok = classesOf(el).includes(cls)
    else if (attr !== undefined) {
      ok =
        value === undefined
          ? el.attributes.has(attr)
          : el.attributes.has(attr) && String(el.attributes.get(attr)) === value
    } else if (not !== undefined) ok = !matchesCompound(el, not)
    else if (nth !== undefined) {
      const siblings = (el.parentNode?.children || []).filter(
        (/** @type {any} */ c) => c.attributes instanceof Map,
      )
      ok = siblings.indexOf(el) + 1 === Number(nth)
    } else if (tag !== undefined)
      ok = el.nodeName.toLowerCase() === tag.toLowerCase()
    else ok = false
    if (!ok) return false
  }
  return true
}

/**
 * Descendant combinators only: the last compound must match `el`, the rest
 * must match its ancestors in order.
 * @param {any} el
 * @param {string[]} compounds
 */
const matchesChain = (el, compounds) => {
  if (!matchesCompound(el, compounds[compounds.length - 1])) return false
  let i = compounds.length - 2
  let node = el.parentNode
  while (i >= 0 && node) {
    if (matchesCompound(node, compounds[i])) i--
    node = node.parentNode
  }
  return i < 0
}

/**
 * querySelectorAll over the shim's element tree, in document order.
 * @param {any} root
 * @param {string} selector
 * @returns {any[]}
 */
const querySelectorAll = (root, selector) => {
  const groups = selector
    .split(',')
    .map((g) => g.trim().split(/\s+(?![^[(]*[\])])/))
    .filter((g) => g[0])
  /** @type {any[]} */
  const found = []
  /** @param {any} node */
  const walk = (node) => {
    for (const child of node.children || []) {
      if (!(child.attributes instanceof Map)) continue
      if (groups.some((g) => matchesChain(child, g))) found.push(child)
      walk(child)
    }
  }
  walk(root)
  return found
}

export { SSRRenderShim, SSRRenderElement, querySelectorAll }
