// @ts-check
/**
 * The DOM that renderToString draws into.
 *
 * DOMShim.js ships in every bundle and only has to keep chart code from
 * throwing outside a browser. Rendering a chart server-side asks for more: the
 * namespaced attributes every <image> and textPath is linked with, a rotated
 * label's on-screen box, and the selector lookups the post-draw passes use to
 * find what they drew (x-axis label rotation, annotation label boxes), and
 * the HTML legend, which renderToHTML emits beside the SVG. Those live here,
 * in the SSR bundle only.
 */
import { SSRDOMShim, SSRElement } from './DOMShim.js'

const XLINK = 'http://www.w3.org/1999/xlink'
const SVGNS = 'http://www.w3.org/2000/svg'

// DOMShim.js measures text at this average glyph width. Kept in step by hand:
// a new named export there would break the split bundles.
const CHAR_WIDTH_EM = 0.55

/**
 * @param {any} value a CSS length the chart wrote ('12px')
 * @param {number} [fallback]
 */
const px = (value, fallback = 0) => parseFloat(value) || fallback

/**
 * The shim's style object as a style attribute.
 * @param {Record<string, any>} style
 */
const cssText = (style) =>
  Object.keys(style)
    .filter((k) => style[k] !== '' && style[k] != null)
    .map(
      (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()) + ':' + style[k],
    )
    .join(';')

class SSRRenderElement extends SSRElement {
  /**
   * @param {string} nodeName
   * @param {any} [namespaceURI]
   */
  constructor(nodeName, namespaceURI = null) {
    super(nodeName, namespaceURI)
    // Set when renderToHTML will emit the legend, which then takes room.
    this._legendRoom = false
  }

  /**
   * Classes and inline styles set through classList and style serialize as a
   * browser's would on HTML elements and inside the legend (its marker shapes
   * are centred by a style): renderToHTML emits that markup. The chart's own
   * SVG keeps its attributes only, since a style there can be a start state
   * the browser animates away.
   */
  toString() {
    if (this.namespaceURI === SVGNS) {
      let n = this.parentNode
      while (n && !n.classList?.contains('apexcharts-legend')) n = n.parentNode
      if (!n) return super.toString()
    }
    /** @type {Map<string, any>} */
    const own = this.attributes
    const attrs = new Map(own)
    const cls = [...new Set(classesOf(this).filter(Boolean))].join(' ')
    if (cls) attrs.set('class', cls)
    const css = [own.get('style'), cssText(this.style)]
      .filter(Boolean)
      .join(';')
    if (css) attrs.set('style', css)
    this.attributes = attrs
    try {
      return super.toString()
    } finally {
      this.attributes = own
    }
  }

  /** Only the legend's layout reads these: no other HTML box is measured. */
  get clientWidth() {
    return this._isLegend() ? legendRect(this).width : undefined
  }

  get clientHeight() {
    return this._isLegend() ? legendRect(this).height : undefined
  }

  /**
   * The legend takes room only when renderToHTML will emit it: a bare SVG has
   * no legend, so its plot keeps the whole chart.
   */
  _isLegend() {
    return !!this._legendRoom && this.classList.contains('apexcharts-legend')
  }

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
    if (this._isLegend()) return legendRect(this)
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
  /** @param {{ legend?: boolean }} [opts] whether the HTML legend is emitted */
  constructor({ legend = false } = {}) {
    super()
    this.legend = legend
  }

  /**
   * @param {string} namespaceURI
   * @param {string} qualifiedName
   */
  createElementNS(namespaceURI, qualifiedName) {
    const el = new SSRRenderElement(qualifiedName, namespaceURI)
    el._legendRoom = this.legend
    return el
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

/**
 * The HTML legend's box, flowed the way its stylesheet flows it: wrapping
 * rows for a top or bottom legend, one column for a side legend. Text is
 * measured at the shim's average glyph width, so this is an estimate of the
 * room the browser gives the legend, which the plot then leaves free.
 * @param {any} wrap
 */
const legendRect = (wrap) => {
  const sizes = querySelectorAll(wrap, '.apexcharts-legend-series')
    .filter((item) => !/apexcharts-hidden-/.test(classesOf(item).join(' ')))
    .map((item) => {
      const [marker, text] = item.children
      /** @type {number[]} */
      const margin = String(item.style.margin || '')
        .split(' ')
        .map((v) => px(v))
      const [mv = 0, mh = mv] = margin
      const fontSize = px(text?.style.fontSize, 14)
      const label = String(text?.textContent ?? '').replace(/<[^>]*>/g, '')
      return [
        px(marker?.style.width) +
          1 +
          label.length * fontSize * CHAR_WIDTH_EM +
          2 * mh,
        Math.max(px(marker?.style.height), fontSize * 1.2) + 2 * mv,
      ]
    })

  let width = 0
  let height = 0
  if (sizes.length) {
    if (/apx-legend-position-(left|right)/.test(classesOf(wrap).join(' '))) {
      width = Math.max(...sizes.map((s) => s[0])) + 20
      height = sizes.reduce((sum, s) => sum + s[1], 0)
    } else {
      // A top or bottom legend spans from its left offset to the right edge,
      // inside 10px of padding each side.
      let host = 0
      for (let n = wrap.parentNode; n && !host; n = n.parentNode) {
        host = px(n.style?.width) || n._ssrWidth || 0
      }
      width = host - px(wrap.style.left, 20)
      let rowWidth = 0
      let rowHeight = 0
      for (const [w, h] of sizes) {
        if (rowWidth && rowWidth + w > width - 20) {
          height += rowHeight
          rowWidth = rowHeight = 0
        }
        rowWidth += w
        rowHeight = Math.max(rowHeight, h)
      }
      height = Math.min(height + rowHeight, px(wrap.style.maxHeight, Infinity))
    }
  }
  width = px(wrap.style.width, width)
  height = px(wrap.style.height, height)
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
  }
}

export { SSRRenderShim, SSRRenderElement, querySelectorAll }
