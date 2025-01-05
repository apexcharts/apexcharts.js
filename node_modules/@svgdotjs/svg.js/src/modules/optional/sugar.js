import { registerMethods } from '../../utils/methods.js'
import Color from '../../types/Color.js'
import Element from '../../elements/Element.js'
import Matrix from '../../types/Matrix.js'
import Point from '../../types/Point.js'
import SVGNumber from '../../types/SVGNumber.js'

// Define list of available attributes for stroke and fill
const sugar = {
  stroke: [
    'color',
    'width',
    'opacity',
    'linecap',
    'linejoin',
    'miterlimit',
    'dasharray',
    'dashoffset'
  ],
  fill: ['color', 'opacity', 'rule'],
  prefix: function (t, a) {
    return a === 'color' ? t : t + '-' + a
  }
}

// Add sugar for fill and stroke
;['fill', 'stroke'].forEach(function (m) {
  const extension = {}
  let i

  extension[m] = function (o) {
    if (typeof o === 'undefined') {
      return this.attr(m)
    }
    if (
      typeof o === 'string' ||
      o instanceof Color ||
      Color.isRgb(o) ||
      o instanceof Element
    ) {
      this.attr(m, o)
    } else {
      // set all attributes from sugar.fill and sugar.stroke list
      for (i = sugar[m].length - 1; i >= 0; i--) {
        if (o[sugar[m][i]] != null) {
          this.attr(sugar.prefix(m, sugar[m][i]), o[sugar[m][i]])
        }
      }
    }

    return this
  }

  registerMethods(['Element', 'Runner'], extension)
})

registerMethods(['Element', 'Runner'], {
  // Let the user set the matrix directly
  matrix: function (mat, b, c, d, e, f) {
    // Act as a getter
    if (mat == null) {
      return new Matrix(this)
    }

    // Act as a setter, the user can pass a matrix or a set of numbers
    return this.attr('transform', new Matrix(mat, b, c, d, e, f))
  },

  // Map rotation to transform
  rotate: function (angle, cx, cy) {
    return this.transform({ rotate: angle, ox: cx, oy: cy }, true)
  },

  // Map skew to transform
  skew: function (x, y, cx, cy) {
    return arguments.length === 1 || arguments.length === 3
      ? this.transform({ skew: x, ox: y, oy: cx }, true)
      : this.transform({ skew: [x, y], ox: cx, oy: cy }, true)
  },

  shear: function (lam, cx, cy) {
    return this.transform({ shear: lam, ox: cx, oy: cy }, true)
  },

  // Map scale to transform
  scale: function (x, y, cx, cy) {
    return arguments.length === 1 || arguments.length === 3
      ? this.transform({ scale: x, ox: y, oy: cx }, true)
      : this.transform({ scale: [x, y], ox: cx, oy: cy }, true)
  },

  // Map translate to transform
  translate: function (x, y) {
    return this.transform({ translate: [x, y] }, true)
  },

  // Map relative translations to transform
  relative: function (x, y) {
    return this.transform({ relative: [x, y] }, true)
  },

  // Map flip to transform
  flip: function (direction = 'both', origin = 'center') {
    if ('xybothtrue'.indexOf(direction) === -1) {
      origin = direction
      direction = 'both'
    }

    return this.transform({ flip: direction, origin: origin }, true)
  },

  // Opacity
  opacity: function (value) {
    return this.attr('opacity', value)
  }
})

registerMethods('radius', {
  // Add x and y radius
  radius: function (x, y = x) {
    const type = (this._element || this).type
    return type === 'radialGradient'
      ? this.attr('r', new SVGNumber(x))
      : this.rx(x).ry(y)
  }
})

registerMethods('Path', {
  // Get path length
  length: function () {
    return this.node.getTotalLength()
  },
  // Get point at length
  pointAt: function (length) {
    return new Point(this.node.getPointAtLength(length))
  }
})

registerMethods(['Element', 'Runner'], {
  // Set font
  font: function (a, v) {
    if (typeof a === 'object') {
      for (v in a) this.font(v, a[v])
      return this
    }

    return a === 'leading'
      ? this.leading(v)
      : a === 'anchor'
        ? this.attr('text-anchor', v)
        : a === 'size' ||
            a === 'family' ||
            a === 'weight' ||
            a === 'stretch' ||
            a === 'variant' ||
            a === 'style'
          ? this.attr('font-' + a, v)
          : this.attr(a, v)
  }
})

// Add events to elements
const methods = [
  'click',
  'dblclick',
  'mousedown',
  'mouseup',
  'mouseover',
  'mouseout',
  'mousemove',
  'mouseenter',
  'mouseleave',
  'touchstart',
  'touchmove',
  'touchleave',
  'touchend',
  'touchcancel',
  'contextmenu',
  'wheel',
  'pointerdown',
  'pointermove',
  'pointerup',
  'pointerleave',
  'pointercancel'
].reduce(function (last, event) {
  // add event to Element
  const fn = function (f) {
    if (f === null) {
      this.off(event)
    } else {
      this.on(event, f)
    }
    return this
  }

  last[event] = fn
  return last
}, {})

registerMethods('Element', methods)
