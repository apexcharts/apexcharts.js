import Matrix from '../../types/Matrix.js'
import Point from '../../types/Point.js'
import Box from '../../types/Box.js'
import { proportionalSize } from '../../utils/utils.js'
import { getWindow } from '../../utils/window.js'

export function dmove(dx, dy) {
  this.children().forEach((child) => {
    let bbox

    // We have to wrap this for elements that dont have a bbox
    // e.g. title and other descriptive elements
    try {
      // Get the childs bbox
      // Bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1905039
      // Because bbox for nested svgs returns the contents bbox in the coordinate space of the svg itself (weird!), we cant use bbox for svgs
      // Therefore we have to use getBoundingClientRect. But THAT is broken (as explained in the bug).
      // Funnily enough the broken behavior would work for us but that breaks it in chrome
      // So we have to replicate the broken behavior of FF by just reading the attributes of the svg itself
      bbox =
        child.node instanceof getWindow().SVGSVGElement
          ? new Box(child.attr(['x', 'y', 'width', 'height']))
          : child.bbox()
    } catch (e) {
      return
    }

    // Get childs matrix
    const m = new Matrix(child)
    // Translate childs matrix by amount and
    // transform it back into parents space
    const matrix = m.translate(dx, dy).transform(m.inverse())
    // Calculate new x and y from old box
    const p = new Point(bbox.x, bbox.y).transform(matrix)
    // Move element
    child.move(p.x, p.y)
  })

  return this
}

export function dx(dx) {
  return this.dmove(dx, 0)
}

export function dy(dy) {
  return this.dmove(0, dy)
}

export function height(height, box = this.bbox()) {
  if (height == null) return box.height
  return this.size(box.width, height, box)
}

export function move(x = 0, y = 0, box = this.bbox()) {
  const dx = x - box.x
  const dy = y - box.y

  return this.dmove(dx, dy)
}

export function size(width, height, box = this.bbox()) {
  const p = proportionalSize(this, width, height, box)
  const scaleX = p.width / box.width
  const scaleY = p.height / box.height

  this.children().forEach((child) => {
    const o = new Point(box).transform(new Matrix(child).inverse())
    child.scale(scaleX, scaleY, o.x, o.y)
  })

  return this
}

export function width(width, box = this.bbox()) {
  if (width == null) return box.width
  return this.size(width, box.height, box)
}

export function x(x, box = this.bbox()) {
  if (x == null) return box.x
  return this.move(x, box.y, box)
}

export function y(y, box = this.bbox()) {
  if (y == null) return box.y
  return this.move(box.x, y, box)
}
