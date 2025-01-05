import { isBlank } from '../core/regex.js'
import { registerMethods } from '../../utils/methods.js'

// Dynamic style generator
export function css(style, val) {
  const ret = {}
  if (arguments.length === 0) {
    // get full style as object
    this.node.style.cssText
      .split(/\s*;\s*/)
      .filter(function (el) {
        return !!el.length
      })
      .forEach(function (el) {
        const t = el.split(/\s*:\s*/)
        ret[t[0]] = t[1]
      })
    return ret
  }

  if (arguments.length < 2) {
    // get style properties as array
    if (Array.isArray(style)) {
      for (const name of style) {
        const cased = name
        ret[name] = this.node.style.getPropertyValue(cased)
      }
      return ret
    }

    // get style for property
    if (typeof style === 'string') {
      return this.node.style.getPropertyValue(style)
    }

    // set styles in object
    if (typeof style === 'object') {
      for (const name in style) {
        // set empty string if null/undefined/'' was given
        this.node.style.setProperty(
          name,
          style[name] == null || isBlank.test(style[name]) ? '' : style[name]
        )
      }
    }
  }

  // set style for property
  if (arguments.length === 2) {
    this.node.style.setProperty(
      style,
      val == null || isBlank.test(val) ? '' : val
    )
  }

  return this
}

// Show element
export function show() {
  return this.css('display', '')
}

// Hide element
export function hide() {
  return this.css('display', 'none')
}

// Is element visible?
export function visible() {
  return this.css('display') !== 'none'
}

registerMethods('Dom', {
  css,
  show,
  hide,
  visible
})
