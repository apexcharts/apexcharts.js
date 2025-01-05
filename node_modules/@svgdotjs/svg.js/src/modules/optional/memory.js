import { registerMethods } from '../../utils/methods.js'

// Remember arbitrary data
export function remember(k, v) {
  // remember every item in an object individually
  if (typeof arguments[0] === 'object') {
    for (const key in k) {
      this.remember(key, k[key])
    }
  } else if (arguments.length === 1) {
    // retrieve memory
    return this.memory()[k]
  } else {
    // store memory
    this.memory()[k] = v
  }

  return this
}

// Erase a given memory
export function forget() {
  if (arguments.length === 0) {
    this._memory = {}
  } else {
    for (let i = arguments.length - 1; i >= 0; i--) {
      delete this.memory()[arguments[i]]
    }
  }
  return this
}

// This triggers creation of a new hidden class which is not performant
// However, this function is not rarely used so it will not happen frequently
// Return local memory object
export function memory() {
  return (this._memory = this._memory || {})
}

registerMethods('Dom', { remember, forget, memory })
