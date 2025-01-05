import { proportionalSize } from '../../utils/utils.js'
import PointArray from '../../types/PointArray.js'

// Get array
export function array() {
  return this._array || (this._array = new PointArray(this.attr('points')))
}

// Clear array cache
export function clear() {
  delete this._array
  return this
}

// Move by left top corner
export function move(x, y) {
  return this.attr('points', this.array().move(x, y))
}

// Plot new path
export function plot(p) {
  return p == null
    ? this.array()
    : this.clear().attr(
        'points',
        typeof p === 'string' ? p : (this._array = new PointArray(p))
      )
}

// Set element size to given width and height
export function size(width, height) {
  const p = proportionalSize(this, width, height)
  return this.attr('points', this.array().size(p.width, p.height))
}
