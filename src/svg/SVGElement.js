export default class SVGElement {
  constructor(node) {
    this.node = node
    if (node) {
      node.instance = this
    }
    this._listeners = []
    this._filter = null
  }

  // ---- Attribute methods ----

  attr(a, v) {
    if (typeof a === 'string' && v === undefined) {
      return this.node.getAttribute(a)
    }
    const attrs = typeof a === 'string' ? { [a]: v } : a
    for (const key in attrs) {
      let val = attrs[key]
      if (val === null) {
        this.node.removeAttribute(key)
      } else if (val !== undefined) {
        // Normalize NaN to 0 to match SVG.js behavior
        if (typeof val === 'number' && isNaN(val)) val = 0
        this.node.setAttribute(key, val)
      }
      // Skip if val is undefined — don't modify the attribute (matches SVG.js)
    }

    // Propagate x to newLine tspans in text elements (matches SVG.js rebuild)
    if (this.node.nodeName === 'text' && attrs.x != null) {
      const tspans = this.node.querySelectorAll('tspan[data-newline]')
      for (let i = 0; i < tspans.length; i++) {
        tspans[i].setAttribute('x', attrs.x)
      }
    }

    return this
  }

  css(styles) {
    for (const k in styles) {
      this.node.style[k] = styles[k]
    }
    return this
  }

  fill(v) {
    if (typeof v === 'object') {
      return this.attr(v)
    }
    return this.attr('fill', v)
  }

  stroke(v) {
    if (typeof v === 'object') {
      if (v.color !== undefined) this.attr('stroke', v.color)
      if (v.width !== undefined) this.attr('stroke-width', v.width)
      if (v.dasharray !== undefined) this.attr('stroke-dasharray', v.dasharray)
      if (v.linecap !== undefined) this.attr('stroke-linecap', v.linecap)
      if (v.opacity !== undefined) this.attr('stroke-opacity', v.opacity)
      return this
    }
    return this.attr('stroke', v)
  }

  size(w, h) {
    return this.attr({ width: w, height: h })
  }

  move(x, y) {
    return this.attr({ x, y })
  }

  center(cx, cy) {
    if (this.node.nodeName === 'g') {
      // Groups don't have cx/cy — use transform to position content center
      const box = this.bbox()
      const dx = cx - (box.x + box.width / 2)
      const dy = cy - (box.y + box.height / 2)
      return this.attr('transform', `translate(${dx}, ${dy})`)
    }
    return this.attr({ cx, cy })
  }

  // ---- Tree operations ----

  add(child) {
    this.node.appendChild(child.node || child)
    return this
  }

  addTo(parent) {
    const p = parent.node || parent
    p.appendChild(this.node)
    return this
  }

  remove() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node)
    }
    return this
  }

  clear() {
    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild)
    }
    return this
  }

  // ---- Query ----

  find(selector) {
    return Array.from(this.node.querySelectorAll(selector)).map(
      (n) => n.instance || new SVGElement(n)
    )
  }

  findOne(selector) {
    const n = this.node.querySelector(selector)
    return n ? n.instance || new SVGElement(n) : null
  }

  // ---- Events ----

  on(event, handler) {
    // Strip namespace suffix (e.g. 'dragmove.namespace' → 'dragmove')
    const eventType = event.split('.')[0]
    this._listeners.push({ event, eventType, handler })
    this.node.addEventListener(eventType, handler)
    return this
  }

  off(event, handler) {
    if (!event && !handler) {
      // Remove all listeners registered via .on()
      this._listeners.forEach((l) => {
        this.node.removeEventListener(l.eventType, l.handler)
      })
      this._listeners = []
    } else if (event && !handler) {
      const eventType = event.split('.')[0]
      this._listeners = this._listeners.filter((l) => {
        if (l.eventType === eventType) {
          this.node.removeEventListener(l.eventType, l.handler)
          return false
        }
        return true
      })
    } else {
      const eventType = event.split('.')[0]
      this._listeners = this._listeners.filter((l) => {
        if (l.eventType === eventType && l.handler === handler) {
          this.node.removeEventListener(l.eventType, l.handler)
          return false
        }
        return true
      })
    }
    return this
  }

  // ---- Iteration ----

  each(fn, deep) {
    const children = Array.from(this.node.children)
    children.forEach((child) => {
      const inst = child.instance || new SVGElement(child)
      fn.call(inst)
      if (deep) inst.each(fn, deep)
    })
    return this
  }

  // ---- CSS classes ----

  removeClass(cls) {
    if (cls === '*') {
      this.node.removeAttribute('class')
    } else {
      this.node.classList.remove(cls)
    }
    return this
  }

  // ---- Children ----

  children() {
    return Array.from(this.node.childNodes)
      .filter((n) => n.nodeType === 1)
      .map((n) => n.instance || new SVGElement(n))
  }

  // ---- Visibility ----

  hide() {
    this.node.style.display = 'none'
    return this
  }

  show() {
    this.node.style.display = ''
    return this
  }

  // ---- Measurement ----

  bbox() {
    if (typeof this.node.getBBox === 'function') {
      try {
        return this.node.getBBox()
      } catch (e) {
        // getBBox throws in jsdom/detached elements
      }
    }
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  // ---- Text-specific ----

  tspan(text) {
    const tspan = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'tspan'
    )
    tspan.textContent = text
    this.node.appendChild(tspan)
    return new SVGElement(tspan)
  }

  // ---- Path-specific ----

  plot(d) {
    if (typeof d === 'string') {
      this.attr('d', d)
    }
    return this
  }

  // ---- Animation (overridden by SVGAnimation mixin) ----

  animate() {
    // This will be set up by the animation module
    throw new Error('Animation module not loaded')
  }

  // ---- Filter methods (set up by SVGFilter module) ----

  filterWith() {
    throw new Error('Filter module not loaded')
  }

  unfilter(all) {
    if (this._filter) {
      this.node.removeAttribute('filter')
      if (all && this._filter.node && this._filter.node.parentNode) {
        this._filter.node.parentNode.removeChild(this._filter.node)
      }
      this._filter = null
    }
    return this
  }

  filterer() {
    return this._filter
  }
}
