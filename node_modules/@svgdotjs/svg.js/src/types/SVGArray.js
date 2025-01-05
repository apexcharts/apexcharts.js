import { delimiter } from '../modules/core/regex.js'

export default class SVGArray extends Array {
  constructor(...args) {
    super(...args)
    this.init(...args)
  }

  clone() {
    return new this.constructor(this)
  }

  init(arr) {
    // This catches the case, that native map tries to create an array with new Array(1)
    if (typeof arr === 'number') return this
    this.length = 0
    this.push(...this.parse(arr))
    return this
  }

  // Parse whitespace separated string
  parse(array = []) {
    // If already is an array, no need to parse it
    if (array instanceof Array) return array

    return array.trim().split(delimiter).map(parseFloat)
  }

  toArray() {
    return Array.prototype.concat.apply([], this)
  }

  toSet() {
    return new Set(this)
  }

  toString() {
    return this.join(' ')
  }

  // Flattens the array if needed
  valueOf() {
    const ret = []
    ret.push(...this)
    return ret
  }
}
