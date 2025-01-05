import { extend } from '../utils/adopter.js'
// import { subClassArray } from './ArrayPolyfill.js'

class List extends Array {
  constructor(arr = [], ...args) {
    super(arr, ...args)
    if (typeof arr === 'number') return this
    this.length = 0
    this.push(...arr)
  }
}

/* = subClassArray('List', Array, function (arr = []) {
  // This catches the case, that native map tries to create an array with new Array(1)
  if (typeof arr === 'number') return this
  this.length = 0
  this.push(...arr)
}) */

export default List

extend([List], {
  each(fnOrMethodName, ...args) {
    if (typeof fnOrMethodName === 'function') {
      return this.map((el, i, arr) => {
        return fnOrMethodName.call(el, el, i, arr)
      })
    } else {
      return this.map((el) => {
        return el[fnOrMethodName](...args)
      })
    }
  },

  toArray() {
    return Array.prototype.concat.apply([], this)
  }
})

const reserved = ['toArray', 'constructor', 'each']

List.extend = function (methods) {
  methods = methods.reduce((obj, name) => {
    // Don't overwrite own methods
    if (reserved.includes(name)) return obj

    // Don't add private methods
    if (name[0] === '_') return obj

    // Allow access to original Array methods through a prefix
    if (name in Array.prototype) {
      obj['$' + name] = Array.prototype[name]
    }

    // Relay every call to each()
    obj[name] = function (...attrs) {
      return this.each(name, ...attrs)
    }
    return obj
  }, {})

  extend([List], methods)
}
