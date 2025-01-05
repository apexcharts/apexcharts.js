import { nodeOrNew, register } from '../utils/adopter.js'
import { registerMethods } from '../utils/methods.js'
import { unCamelCase } from '../utils/utils.js'
import Element from './Element.js'

function cssRule(selector, rule) {
  if (!selector) return ''
  if (!rule) return selector

  let ret = selector + '{'

  for (const i in rule) {
    ret += unCamelCase(i) + ':' + rule[i] + ';'
  }

  ret += '}'

  return ret
}

export default class Style extends Element {
  constructor(node, attrs = node) {
    super(nodeOrNew('style', node), attrs)
  }

  addText(w = '') {
    this.node.textContent += w
    return this
  }

  font(name, src, params = {}) {
    return this.rule('@font-face', {
      fontFamily: name,
      src: src,
      ...params
    })
  }

  rule(selector, obj) {
    return this.addText(cssRule(selector, obj))
  }
}

registerMethods('Dom', {
  style(selector, obj) {
    return this.put(new Style()).rule(selector, obj)
  },
  fontface(name, src, params) {
    return this.put(new Style()).font(name, src, params)
  }
})

register(Style, 'Style')
