import { registerMethods } from '../../utils/methods.js'
import { filter, map } from '../../utils/utils.js'

// Store data values on svg nodes
export function data(a, v, r) {
  if (a == null) {
    // get an object of attributes
    return this.data(
      map(
        filter(
          this.node.attributes,
          (el) => el.nodeName.indexOf('data-') === 0
        ),
        (el) => el.nodeName.slice(5)
      )
    )
  } else if (a instanceof Array) {
    const data = {}
    for (const key of a) {
      data[key] = this.data(key)
    }
    return data
  } else if (typeof a === 'object') {
    for (v in a) {
      this.data(v, a[v])
    }
  } else if (arguments.length < 2) {
    try {
      return JSON.parse(this.attr('data-' + a))
    } catch (e) {
      return this.attr('data-' + a)
    }
  } else {
    this.attr(
      'data-' + a,
      v === null
        ? null
        : r === true || typeof v === 'string' || typeof v === 'number'
          ? v
          : JSON.stringify(v)
    )
  }

  return this
}

registerMethods('Dom', { data })
