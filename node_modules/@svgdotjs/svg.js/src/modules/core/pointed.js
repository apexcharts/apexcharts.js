import PointArray from '../../types/PointArray.js'

export const MorphArray = PointArray

// Move by left top corner over x-axis
export function x(x) {
  return x == null ? this.bbox().x : this.move(x, this.bbox().y)
}

// Move by left top corner over y-axis
export function y(y) {
  return y == null ? this.bbox().y : this.move(this.bbox().x, y)
}

// Set width of element
export function width(width) {
  const b = this.bbox()
  return width == null ? b.width : this.size(width, b.height)
}

// Set height of element
export function height(height) {
  const b = this.bbox()
  return height == null ? b.height : this.size(b.width, height)
}
