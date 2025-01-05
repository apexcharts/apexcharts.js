import SVGNumber from '../../types/SVGNumber.js'

export function from(x, y) {
  return (this._element || this).type === 'radialGradient'
    ? this.attr({ fx: new SVGNumber(x), fy: new SVGNumber(y) })
    : this.attr({ x1: new SVGNumber(x), y1: new SVGNumber(y) })
}

export function to(x, y) {
  return (this._element || this).type === 'radialGradient'
    ? this.attr({ cx: new SVGNumber(x), cy: new SVGNumber(y) })
    : this.attr({ x2: new SVGNumber(x), y2: new SVGNumber(y) })
}
