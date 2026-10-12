// @ts-check
/*
 ** Generic functions which are not dependent on ApexCharts
 */

import { Environment } from './Environment.js'
import { BrowserAPIs } from '../ssr/BrowserAPIs.js'

/**
 * Identity tokens for function-valued options (see `stringifyForCompare`).
 * A WeakMap so a config that is thrown away takes its callbacks with it.
 * @type {WeakMap<Function, number>}
 */
const fnIds = new WeakMap()
let fnSeq = 0

class Utils {
  /**
   * @param {*} item
   */
  static isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  // Type checking that works across different window objects
  /**
   * @param {string} type
   * @param {string} val
   */
  static is(type, val) {
    return Object.prototype.toString.call(val) === '[object ' + type + ']'
  }

  static isSafari() {
    return (
      Environment.isBrowser() &&
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    )
  }

  // to extend defaults with user options
  // credit: http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7#answer-34749873
  /**
   * @param {any} target
   * @param {any} source
   */
  static extend(target, source) {
    if (!this.isObject(target) && this.isObject(source)) {
      // The default (target) is missing/undefined (or otherwise not mergeable)
      // but the user supplied an object. Object.assign({}, undefined) short-
      // circuits and returns {}, which would silently DROP the user's object
      // (e.g. a default of `chart.link.bins: undefined` swallowing
      // `bins: { width: N }`). Clone the source so the user config survives.
      return this.clone(source)
    }
    const output = Object.assign({}, target)
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, {
              [key]: source[key],
            })
          } else {
            output[key] = this.extend(target[key], source[key])
          }
        } else {
          Object.assign(output, {
            [key]: source[key],
          })
        }
      })
    }
    return output
  }

  // A per-series shallow copy: the series OBJECTS are copied, their data arrays
  // are shared. Every internal "mutation" of a series' data is a property
  // REPLACEMENT (`series[i].data = []` on legend collapse, `series[i] = 0` for
  // non-axis charts, appendData's concat), and those cannot reach a copy made
  // this way because the series object was copied at capture time. This is the
  // same cheap shape `globals.initialSeries` captures, so snapshotting a config
  // stays O(n) instead of deep-cloning every point.
  /**
   * @param {any} series
   */
  static copySeriesShallow(series) {
    return Array.isArray(series)
      ? series.map((s) => (this.isObject(s) ? { ...s } : s))
      : series
  }

  /**
   * @param {any[]} arrToExtend
   * @param {any} resultArr
   */
  static extendArray(arrToExtend, resultArr) {
    /** @type {any[]} */
    const extendedArr = []
    /**
     * @param {any} item
     */
    arrToExtend.map((/** @type {any} */ item) => {
      extendedArr.push(Utils.extend(resultArr, item))
    })
    arrToExtend = extendedArr
    return arrToExtend
  }

  /**
   * Deep clone, preserving shared and circular references.
   * @param {*} source - Source object to clone
   * @param {WeakMap<any, any>} visited - Circular reference tracker
   * @returns {*} Cloned object
   */
  static clone(source, visited = new WeakMap()) {
    if (source === null || typeof source !== 'object') {
      return source
    }

    if (visited.has(source)) {
      return visited.get(source)
    }

    /** @type {any} */
    let cloneResult

    if (Array.isArray(source)) {
      cloneResult = []
      visited.set(source, cloneResult)
      for (let i = 0; i < source.length; i++) {
        cloneResult[i] = this.clone(source[i], visited)
      }
    } else if (source instanceof Date) {
      cloneResult = new Date(source.getTime())
    } else {
      cloneResult = {}
      visited.set(source, cloneResult)
      for (const prop in source) {
        if (Object.prototype.hasOwnProperty.call(source, prop)) {
          cloneResult[prop] = this.clone(
            /** @type {Record<string,any>} */ (source)[prop],
            visited,
          )
        }
      }
    }
    return cloneResult
  }

  /**
   * Serialize options for an equality check, with functions included.
   *
   * `JSON.stringify` DROPS function values, so two configs differing only in a
   * callback stringify identically. The update path used that comparison to skip
   * redundant renders, which silently swallowed any update that changed only a
   * function: a new `plotOptions.unit.positions` (a whole layout), a new
   * `dataLabels.formatter`, a new custom tooltip.
   *
   * Functions are compared BY IDENTITY: the same function twice still compares
   * equal (so the skip keeps working), a different one does not. A caller who
   * passes a fresh closure on every update gets a render every time, which is
   * the safe direction to err in - the closure may capture new state.
   *
   * @param {any} options
   * @returns {string}
   */
  static stringifyForCompare(options) {
    return JSON.stringify(options, (_key, value) => {
      if (typeof value !== 'function') return value
      let id = fnIds.get(value)
      if (id === undefined) {
        id = ++fnSeq
        fnIds.set(value, id)
      }
      return `__apx_fn_${id}`
    })
  }

  /**
   * Fast shallow equality check for objects
   * @param {Object} obj1 - First object
   * @param {Object} obj2 - Second object
   * @returns {boolean} True if shallowly equal
   */
  static shallowEqual(obj1, obj2) {
    if (obj1 === obj2) return true

    if (!obj1 || !obj2) return false

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      return obj1 === obj2
    }

    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    if (keys1.length !== keys2.length) return false

    for (const key of keys1) {
      if (
        /** @type {Record<string,any>} */ (obj1)[key] !==
        /** @type {Record<string,any>} */ (obj2)[key]
      )
        return false
    }

    return true
  }

  /**
   * @param {any} val
   */
  static parseNumber(val) {
    if (typeof val === 'number' || val === null) return val
    return parseFloat(val)
  }

  /**
   * @param {number} num
   */
  static stripNumber(num, precision = 2) {
    return Number.isInteger(num) ? num : parseFloat(num.toPrecision(precision))
  }

  static randomId() {
    return (Math.random() + 1).toString(36).substring(4)
  }

  /**
   * @param {number} num
   */
  static noExponents(num) {
    // Check if the number contains 'e' (exponential notation)
    if (num.toString().includes('e')) {
      return Math.round(num) // Round the number
    }
    return num // Return as-is if no exponential notation
  }

  /**
   * Fraction digits of a finite number, exponent notation included: 1.5e-7
   * has 8. Rounding through noExponents would read it as 0.
   * @param {number} num
   */
  static decimalPlaces(num) {
    const [m, e] = String(num).split('e')
    const dot = m.indexOf('.')
    return Math.max(0, (dot < 0 ? 0 : m.length - dot - 1) - (+e || 0))
  }

  /**
   * @param {any} element
   */
  static elementExists(element) {
    if (!element || !element.isConnected) {
      return false
    }
    return true
  }

  /**
   * @param {any} el
   */
  static getDimensions(el) {
    if (!el) return [0, 0]

    // SSR: use provided dimensions or defaults
    if (Environment.isSSR()) {
      return [el._ssrWidth || 400, el._ssrHeight || 300]
    }

    let computedStyle
    try {
      computedStyle = getComputedStyle(el, null)
    } catch (e) {
      return [el.clientWidth || 0, el.clientHeight || 0]
    }

    let elementWidth = el.clientWidth
    let elementHeight = el.clientHeight

    // clientWidth/Height can be 0 when height:'100%' hasn't resolved yet
    // (common inside shadow DOM or detached subtrees) — fall back to BCR
    if (!elementWidth || !elementHeight) {
      const rect = el.getBoundingClientRect()
      elementWidth = elementWidth || rect.width
      elementHeight = elementHeight || rect.height
    }

    elementHeight -=
      parseFloat(computedStyle.paddingTop) +
      parseFloat(computedStyle.paddingBottom)
    elementWidth -=
      parseFloat(computedStyle.paddingLeft) +
      parseFloat(computedStyle.paddingRight)

    return [elementWidth, elementHeight]
  }
  /**
   * @returns {any}
   * @param {any} element
   */
  static getBoundingClientRect(element) {
    if (!element) {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
      }
    }

    // SSR: use abstraction layer
    if (Environment.isSSR()) {
      return BrowserAPIs.getBoundingClientRect(element)
    }

    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: element.clientWidth,
      height: element.clientHeight,
      x: rect.left,
      y: rect.top,
    }
  }

  /**
   * @param {any[]} arr
   */
  static getLargestStringFromArr(arr) {
    // String() so a numeric label is measured too; a multi-line label
    // (an array, possibly empty) competes with its longest line.
    /** @type {(a: any, b: any) => any} */
    const pick = (a, b) => {
      if (Array.isArray(b)) b = b.reduce(pick, '')
      return String(a).length > String(b).length ? a : b
    }
    return arr.length ? arr.reduce(pick, '') : 0
  }

  /**
   * A hex colour as rgba(), with the hex's own alpha (#RGBA, #RRGGBBAA)
   * multiplied into `opacity`. A non-hex input reads as #999999; a hex of a
   * length no colour has comes back unchanged.
   * @param {string} hex
   * @param {number} opacity
   */
  static hexToRgba(hex = '#999999', opacity = 0.6) {
    const c = Utils.parseColor(hex[0] === '#' ? hex : '#999999')
    return c
      ? 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + opacity * c[3] + ')'
      : hex
  }

  /**
   * [r, g, b, a] of a hex (3, 4, 6 or 8 digits) or rgb()/rgba() colour, the
   * channels 0 to 255 and the alpha 0 to 1; null for anything else.
   * @param {string} color
   * @returns {number[] | null}
   */
  static parseColor(color) {
    const m = /^#([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.exec(color)
    if (m) {
      let h = m[1]
      if (h.length < 5) h = h.replace(/./g, '$&$&')
      return [0, 2, 4, 6].map((i) =>
        i < h.length ? parseInt(h.substr(i, 2), 16) / (i > 4 ? 255 : 1) : 1,
      )
    }
    const n = /^rgba?\(/i.test(color) && color.match(/[\d.]+/g)
    return n ? [+n[0], +n[1], +n[2], n[3] ? +n[3] : 1] : null
  }

  /**
   * @param {string} rgba
   */
  static getOpacityFromRGBA(rgba) {
    return parseFloat(rgba.replace(/^.*,(.+)\)/, '$1'))
  }

  /**
   * Parse a #RGB or #RRGGBB hex colour string into [r,g,b] in 0–255.
   * Returns null for invalid input. Used by getContrastRatio.
   * @param {string} hex
   * @returns {[number, number, number] | null}
   */
  static parseHex(hex) {
    if (typeof hex !== 'string') return null
    let h = hex.trim().replace('#', '')
    if (h.length === 3) {
      h = h.split('').map((c) => c + c).join('')
    }
    if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ]
  }

  /**
   * Relative luminance per WCAG 2.x (https://www.w3.org/TR/WCAG22/#dfn-relative-luminance).
   * @param {[number, number, number]} rgb 0–255 sRGB triplet
   * @returns {number} 0.0–1.0
   */
  static relativeLuminance([r, g, b]) {
    const channel = (/** @type {number} */ c) => {
      const v = c / 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    }
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
  }

  /**
   * WCAG contrast ratio between two hex colours. Returns 0 for invalid input.
   * Range: 1 (identical) … 21 (#000 vs #fff).
   * WCAG AA requires ≥ 4.5 for normal text and ≥ 3.0 for large text / UI components.
   * @param {string} hex1
   * @param {string} hex2
   * @returns {number}
   */
  static getContrastRatio(hex1, hex2) {
    const rgb1 = Utils.parseHex(hex1)
    const rgb2 = Utils.parseHex(hex2)
    if (!rgb1 || !rgb2) return 0
    const l1 = Utils.relativeLuminance(rgb1)
    const l2 = Utils.relativeLuminance(rgb2)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  /**
   * @param {any} rgb
   */
  static rgb2hex(rgb) {
    rgb = rgb.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i,
    )
    return rgb && rgb.length === 4
      ? '#' +
          ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : ''
  }

  /**
   * Blend `color` toward white (p > 0) or black (p < 0) by |p|. Hex in, hex
   * out (alpha kept); anything else comes back as rgb()/rgba(). A named,
   * hsl() or var() colour is resolved by the browser first; a colour that
   * cannot be read is returned unchanged.
   * @param {number} p
   * @param {string} color
   */
  shadeColor(p, color) {
    const c =
      Utils.parseColor(color) || Utils.parseColor(Utils.resolveColor(color))
    if (!c) return color
    const t = p < 0 ? 0 : 255
    p = Math.abs(p)
    for (let i = 0; i < 3; i++) c[i] += Math.round((t - c[i]) * p)
    const a = /** @type {number} */ (c.pop())
    return color[0] === '#'
      ? '#' +
          c
            .concat(a < 1 ? Math.round(a * 255) : [])
            .map((v) => (v | 256).toString(16).slice(1))
            .join('')
      : (a < 1 ? 'rgba(' : 'rgb(') + c.concat(a < 1 ? a : []).join(',') + ')'
  }

  /**
   * The computed colour of any CSS colour, read from a probe placed inside
   * `el` (default `document.body`), so a variable scoped to the chart's
   * container or shadow root resolves the way the chart sees it. Returns the
   * input under SSR or when the browser rejects it as a colour.
   * @param {string} color
   * @param {Element} [el]
   */
  static resolveColor(color, el) {
    if (Environment.isSSR()) return color
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;left:-9999px;visibility:hidden'
    probe.style.color = color
    if (!probe.style.color) return color
    ;(el || document.body).appendChild(probe)
    try {
      return window.getComputedStyle(probe).color
    } finally {
      probe.remove()
    }
  }

  /**
   * @param {string} color
   */
  static isColorHex(color) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)|(^#[0-9A-F]{8}$)/i.test(color)
  }

  /**
   * @param {string} color
   */
  static isCSSVariable(color) {
    if (typeof color !== 'string') return false

    const value = color.trim()
    return value.startsWith('var(') && value.endsWith(')')
  }

  /**
   * A CSS variable resolved inside `el` (see resolveColor); any other colour
   * as given.
   * @param {string} color
   * @param {Element} [el]
   */
  static getThemeColor(color, el) {
    return Utils.isCSSVariable(color) ? Utils.resolveColor(color, el) : color
  }

  /**
   * @param {string} color
   * @param {number} opacity
   */
  static applyOpacityToColor(color, opacity) {
    const value = Number(opacity)
    if (!Number.isFinite(value)) return color
    if (value <= 0) return 'transparent'
    if (value >= 1) return color
    const percent = Math.round(value * 100)
    return `color-mix(in srgb, ${color} ${percent}%, transparent)`
  }

  /**
   * @param {number} size
   * @param {number} dataPointsLen
   */
  static getPolygonPos(size, dataPointsLen) {
    const dotsArray = []
    const angle = (Math.PI * 2) / dataPointsLen
    for (let i = 0; i < dataPointsLen; i++) {
      const curPos = {}
      curPos.x = size * Math.sin(i * angle)
      curPos.y = -size * Math.cos(i * angle)
      dotsArray.push(curPos)
    }
    return dotsArray
  }

  /**
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} radius
   * @param {number} angleInDegrees
   */
  static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    }
  }

  /**
   * @param {string} str
   */
  static escapeString(str, escapeWith = 'x') {
    let newStr = str.toString().slice()
    newStr = newStr.replace(/[` ~!@#$%^&*()|+=?;:'",.<>{}[\]\\/]/gi, escapeWith)
    return newStr
  }

  /**
   * @param {number} val
   */
  static negToZero(val) {
    return val < 0 ? 0 : val
  }

  /**
   * @param {any[]} arr
   * @param {number} old_index
   * @param {number} new_index
   */
  static moveIndexInArray(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      let k = new_index - arr.length + 1
      while (k--) {
        arr.push(undefined)
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0])
    return arr
  }

  /**
   * @param {any} el
   * @param {string} cls
   */
  static findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el
  }

  /**
   * @param {any} el
   * @param {Record<string, any>} styles
   */
  static setELstyles(el, styles) {
    for (const key in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, key)) {
        // el.style[key], not el.style.key: the latter set a literal `key`
        // property and applied no CSS at all.
        el.style[key] = styles[key]
      }
    }
  }
  // prevents JS prevision errors when adding
  /**
   * @param {number} a
   * @param {number} b
   */
  static preciseAddition(a, b) {
    const aDecimals = (String(a).split('.')[1] || '').length
    const bDecimals = (String(b).split('.')[1] || '').length

    const factor = Math.pow(10, Math.max(aDecimals, bDecimals))

    return (Math.round(a * factor) + Math.round(b * factor)) / factor
  }

  /**
   * @param {any} value
   */
  static isNumber(value) {
    return (
      !isNaN(value) &&
      parseFloat(String(Number(value))) === value &&
      !isNaN(parseInt(value, 10))
    )
  }

  /**
   * @param {number} n
   */
  static isFloat(n) {
    return Number(n) === n && n % 1 !== 0
  }

  /**
   * Edit distance, capped: how many single-character insertions, deletions or
   * substitutions turn `a` into `b`. Only ever asked "is this within `max`?",
   * so it abandons a row the moment every cell in it has passed the budget,
   * which keeps a near-miss check over a few dozen names free.
   *
   * @param {string} a
   * @param {string} b
   * @param {number} max
   * @returns {number} the distance, or `max + 1` once it is known to exceed it
   */
  static editDistance(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
    for (let i = 1; i <= a.length; i++) {
      const row = [i]
      let best = i
      for (let j = 1; j <= b.length; j++) {
        row[j] = Math.min(
          prev[j] + 1,
          row[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
        )
        if (row[j] < best) best = row[j]
      }
      if (best > max) return max + 1
      prev = row
    }
    return prev[b.length]
  }

  /**
   * The name in `candidates` closest to `name`, or '' when nothing is close
   * enough to be worth putting in front of a reader. Case and surrounding
   * whitespace are ignored, so `Line ` finds `line`.
   *
   * Used to turn "that option does not exist" into "did you mean this one",
   * which is the difference between a message that reports a problem and one
   * that ends it.
   *
   * @param {string} name
   * @param {string[]} candidates
   * @returns {string}
   */
  static nearestName(name, candidates) {
    const needle = String(name).trim().toLowerCase()
    // A short name has no room to carry a typo and still be a different word,
    // so the budget scales with it: 1 for <= 4 characters, 2 above.
    const max = needle.length > 4 ? 2 : 1
    let best = ''
    let bestDist = max + 1
    candidates.forEach((candidate) => {
      const d = Utils.editDistance(needle, candidate.toLowerCase(), max)
      if (d < bestDist) {
        bestDist = d
        best = candidate
      }
    })
    return bestDist <= max ? best : ''
  }

  static isMsEdge() {
    if (Environment.isSSR()) return false

    const ua = window.navigator.userAgent

    const edge = ua.indexOf('Edge/')
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
    }

    // other browser
    return false
  }
  //
  // Find the Greatest Common Divisor of two numbers
  //
  /**
   * @param {number} a
   * @param {number} b
   */
  static getGCD(a, b, p = 7) {
    let factor = Math.pow(10, p - Math.floor(Math.log10(Math.max(a, b))))
    if (factor > 1) {
      a = Math.round(Math.abs(a) * factor)
      b = Math.round(Math.abs(b) * factor)
    } else {
      factor = 1
    }

    while (b) {
      const t = b
      b = a % b
      a = t
    }
    return a / factor
  }

  /**
   * @param {number} n
   */
  static getPrimeFactors(n) {
    const factors = []
    // Callers pass tick counts. A fractional count never divides down to 1,
    // which used to spin this loop forever and freeze the tab.
    n = Math.round(Math.abs(n))
    if (!Number.isFinite(n)) return factors

    for (let divisor = 2; divisor * divisor <= n; divisor++) {
      while (n % divisor === 0) {
        factors.push(divisor)
        n = n / divisor
      }
    }
    if (n >= 2) factors.push(n)
    return factors
  }

  /**
   * @param {number} a
   * @param {number} b
   */
  static mod(a, b, p = 7) {
    const big = Math.pow(10, p - Math.floor(Math.log10(Math.max(a, b))))
    a = Math.round(Math.abs(a) * big)
    b = Math.round(Math.abs(b) * big)

    return (a % b) / big
  }
}

export default Utils
