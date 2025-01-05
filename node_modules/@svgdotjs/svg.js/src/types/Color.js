import { hex, isHex, isRgb, rgb, whitespace } from '../modules/core/regex.js'

function sixDigitHex(hex) {
  return hex.length === 4
    ? [
        '#',
        hex.substring(1, 2),
        hex.substring(1, 2),
        hex.substring(2, 3),
        hex.substring(2, 3),
        hex.substring(3, 4),
        hex.substring(3, 4)
      ].join('')
    : hex
}

function componentHex(component) {
  const integer = Math.round(component)
  const bounded = Math.max(0, Math.min(255, integer))
  const hex = bounded.toString(16)
  return hex.length === 1 ? '0' + hex : hex
}

function is(object, space) {
  for (let i = space.length; i--; ) {
    if (object[space[i]] == null) {
      return false
    }
  }
  return true
}

function getParameters(a, b) {
  const params = is(a, 'rgb')
    ? { _a: a.r, _b: a.g, _c: a.b, _d: 0, space: 'rgb' }
    : is(a, 'xyz')
      ? { _a: a.x, _b: a.y, _c: a.z, _d: 0, space: 'xyz' }
      : is(a, 'hsl')
        ? { _a: a.h, _b: a.s, _c: a.l, _d: 0, space: 'hsl' }
        : is(a, 'lab')
          ? { _a: a.l, _b: a.a, _c: a.b, _d: 0, space: 'lab' }
          : is(a, 'lch')
            ? { _a: a.l, _b: a.c, _c: a.h, _d: 0, space: 'lch' }
            : is(a, 'cmyk')
              ? { _a: a.c, _b: a.m, _c: a.y, _d: a.k, space: 'cmyk' }
              : { _a: 0, _b: 0, _c: 0, space: 'rgb' }

  params.space = b || params.space
  return params
}

function cieSpace(space) {
  if (space === 'lab' || space === 'xyz' || space === 'lch') {
    return true
  } else {
    return false
  }
}

function hueToRgb(p, q, t) {
  if (t < 0) t += 1
  if (t > 1) t -= 1
  if (t < 1 / 6) return p + (q - p) * 6 * t
  if (t < 1 / 2) return q
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
  return p
}

export default class Color {
  constructor(...inputs) {
    this.init(...inputs)
  }

  // Test if given value is a color
  static isColor(color) {
    return (
      color && (color instanceof Color || this.isRgb(color) || this.test(color))
    )
  }

  // Test if given value is an rgb object
  static isRgb(color) {
    return (
      color &&
      typeof color.r === 'number' &&
      typeof color.g === 'number' &&
      typeof color.b === 'number'
    )
  }

  /*
  Generating random colors
  */
  static random(mode = 'vibrant', t) {
    // Get the math modules
    const { random, round, sin, PI: pi } = Math

    // Run the correct generator
    if (mode === 'vibrant') {
      const l = (81 - 57) * random() + 57
      const c = (83 - 45) * random() + 45
      const h = 360 * random()
      const color = new Color(l, c, h, 'lch')
      return color
    } else if (mode === 'sine') {
      t = t == null ? random() : t
      const r = round(80 * sin((2 * pi * t) / 0.5 + 0.01) + 150)
      const g = round(50 * sin((2 * pi * t) / 0.5 + 4.6) + 200)
      const b = round(100 * sin((2 * pi * t) / 0.5 + 2.3) + 150)
      const color = new Color(r, g, b)
      return color
    } else if (mode === 'pastel') {
      const l = (94 - 86) * random() + 86
      const c = (26 - 9) * random() + 9
      const h = 360 * random()
      const color = new Color(l, c, h, 'lch')
      return color
    } else if (mode === 'dark') {
      const l = 10 + 10 * random()
      const c = (125 - 75) * random() + 86
      const h = 360 * random()
      const color = new Color(l, c, h, 'lch')
      return color
    } else if (mode === 'rgb') {
      const r = 255 * random()
      const g = 255 * random()
      const b = 255 * random()
      const color = new Color(r, g, b)
      return color
    } else if (mode === 'lab') {
      const l = 100 * random()
      const a = 256 * random() - 128
      const b = 256 * random() - 128
      const color = new Color(l, a, b, 'lab')
      return color
    } else if (mode === 'grey') {
      const grey = 255 * random()
      const color = new Color(grey, grey, grey)
      return color
    } else {
      throw new Error('Unsupported random color mode')
    }
  }

  // Test if given value is a color string
  static test(color) {
    return typeof color === 'string' && (isHex.test(color) || isRgb.test(color))
  }

  cmyk() {
    // Get the rgb values for the current color
    const { _a, _b, _c } = this.rgb()
    const [r, g, b] = [_a, _b, _c].map((v) => v / 255)

    // Get the cmyk values in an unbounded format
    const k = Math.min(1 - r, 1 - g, 1 - b)

    if (k === 1) {
      // Catch the black case
      return new Color(0, 0, 0, 1, 'cmyk')
    }

    const c = (1 - r - k) / (1 - k)
    const m = (1 - g - k) / (1 - k)
    const y = (1 - b - k) / (1 - k)

    // Construct the new color
    const color = new Color(c, m, y, k, 'cmyk')
    return color
  }

  hsl() {
    // Get the rgb values
    const { _a, _b, _c } = this.rgb()
    const [r, g, b] = [_a, _b, _c].map((v) => v / 255)

    // Find the maximum and minimum values to get the lightness
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2

    // If the r, g, v values are identical then we are grey
    const isGrey = max === min

    // Calculate the hue and saturation
    const delta = max - min
    const s = isGrey
      ? 0
      : l > 0.5
        ? delta / (2 - max - min)
        : delta / (max + min)
    const h = isGrey
      ? 0
      : max === r
        ? ((g - b) / delta + (g < b ? 6 : 0)) / 6
        : max === g
          ? ((b - r) / delta + 2) / 6
          : max === b
            ? ((r - g) / delta + 4) / 6
            : 0

    // Construct and return the new color
    const color = new Color(360 * h, 100 * s, 100 * l, 'hsl')
    return color
  }

  init(a = 0, b = 0, c = 0, d = 0, space = 'rgb') {
    // This catches the case when a falsy value is passed like ''
    a = !a ? 0 : a

    // Reset all values in case the init function is rerun with new color space
    if (this.space) {
      for (const component in this.space) {
        delete this[this.space[component]]
      }
    }

    if (typeof a === 'number') {
      // Allow for the case that we don't need d...
      space = typeof d === 'string' ? d : space
      d = typeof d === 'string' ? 0 : d

      // Assign the values straight to the color
      Object.assign(this, { _a: a, _b: b, _c: c, _d: d, space })
      // If the user gave us an array, make the color from it
    } else if (a instanceof Array) {
      this.space = b || (typeof a[3] === 'string' ? a[3] : a[4]) || 'rgb'
      Object.assign(this, { _a: a[0], _b: a[1], _c: a[2], _d: a[3] || 0 })
    } else if (a instanceof Object) {
      // Set the object up and assign its values directly
      const values = getParameters(a, b)
      Object.assign(this, values)
    } else if (typeof a === 'string') {
      if (isRgb.test(a)) {
        const noWhitespace = a.replace(whitespace, '')
        const [_a, _b, _c] = rgb
          .exec(noWhitespace)
          .slice(1, 4)
          .map((v) => parseInt(v))
        Object.assign(this, { _a, _b, _c, _d: 0, space: 'rgb' })
      } else if (isHex.test(a)) {
        const hexParse = (v) => parseInt(v, 16)
        const [, _a, _b, _c] = hex.exec(sixDigitHex(a)).map(hexParse)
        Object.assign(this, { _a, _b, _c, _d: 0, space: 'rgb' })
      } else throw Error("Unsupported string format, can't construct Color")
    }

    // Now add the components as a convenience
    const { _a, _b, _c, _d } = this
    const components =
      this.space === 'rgb'
        ? { r: _a, g: _b, b: _c }
        : this.space === 'xyz'
          ? { x: _a, y: _b, z: _c }
          : this.space === 'hsl'
            ? { h: _a, s: _b, l: _c }
            : this.space === 'lab'
              ? { l: _a, a: _b, b: _c }
              : this.space === 'lch'
                ? { l: _a, c: _b, h: _c }
                : this.space === 'cmyk'
                  ? { c: _a, m: _b, y: _c, k: _d }
                  : {}
    Object.assign(this, components)
  }

  lab() {
    // Get the xyz color
    const { x, y, z } = this.xyz()

    // Get the lab components
    const l = 116 * y - 16
    const a = 500 * (x - y)
    const b = 200 * (y - z)

    // Construct and return a new color
    const color = new Color(l, a, b, 'lab')
    return color
  }

  lch() {
    // Get the lab color directly
    const { l, a, b } = this.lab()

    // Get the chromaticity and the hue using polar coordinates
    const c = Math.sqrt(a ** 2 + b ** 2)
    let h = (180 * Math.atan2(b, a)) / Math.PI
    if (h < 0) {
      h *= -1
      h = 360 - h
    }

    // Make a new color and return it
    const color = new Color(l, c, h, 'lch')
    return color
  }
  /*
  Conversion Methods
  */

  rgb() {
    if (this.space === 'rgb') {
      return this
    } else if (cieSpace(this.space)) {
      // Convert to the xyz color space
      let { x, y, z } = this
      if (this.space === 'lab' || this.space === 'lch') {
        // Get the values in the lab space
        let { l, a, b } = this
        if (this.space === 'lch') {
          const { c, h } = this
          const dToR = Math.PI / 180
          a = c * Math.cos(dToR * h)
          b = c * Math.sin(dToR * h)
        }

        // Undo the nonlinear function
        const yL = (l + 16) / 116
        const xL = a / 500 + yL
        const zL = yL - b / 200

        // Get the xyz values
        const ct = 16 / 116
        const mx = 0.008856
        const nm = 7.787
        x = 0.95047 * (xL ** 3 > mx ? xL ** 3 : (xL - ct) / nm)
        y = 1.0 * (yL ** 3 > mx ? yL ** 3 : (yL - ct) / nm)
        z = 1.08883 * (zL ** 3 > mx ? zL ** 3 : (zL - ct) / nm)
      }

      // Convert xyz to unbounded rgb values
      const rU = x * 3.2406 + y * -1.5372 + z * -0.4986
      const gU = x * -0.9689 + y * 1.8758 + z * 0.0415
      const bU = x * 0.0557 + y * -0.204 + z * 1.057

      // Convert the values to true rgb values
      const pow = Math.pow
      const bd = 0.0031308
      const r = rU > bd ? 1.055 * pow(rU, 1 / 2.4) - 0.055 : 12.92 * rU
      const g = gU > bd ? 1.055 * pow(gU, 1 / 2.4) - 0.055 : 12.92 * gU
      const b = bU > bd ? 1.055 * pow(bU, 1 / 2.4) - 0.055 : 12.92 * bU

      // Make and return the color
      const color = new Color(255 * r, 255 * g, 255 * b)
      return color
    } else if (this.space === 'hsl') {
      // https://bgrins.github.io/TinyColor/docs/tinycolor.html
      // Get the current hsl values
      let { h, s, l } = this
      h /= 360
      s /= 100
      l /= 100

      // If we are grey, then just make the color directly
      if (s === 0) {
        l *= 255
        const color = new Color(l, l, l)
        return color
      }

      // TODO I have no idea what this does :D If you figure it out, tell me!
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q

      // Get the rgb values
      const r = 255 * hueToRgb(p, q, h + 1 / 3)
      const g = 255 * hueToRgb(p, q, h)
      const b = 255 * hueToRgb(p, q, h - 1 / 3)

      // Make a new color
      const color = new Color(r, g, b)
      return color
    } else if (this.space === 'cmyk') {
      // https://gist.github.com/felipesabino/5066336
      // Get the normalised cmyk values
      const { c, m, y, k } = this

      // Get the rgb values
      const r = 255 * (1 - Math.min(1, c * (1 - k) + k))
      const g = 255 * (1 - Math.min(1, m * (1 - k) + k))
      const b = 255 * (1 - Math.min(1, y * (1 - k) + k))

      // Form the color and return it
      const color = new Color(r, g, b)
      return color
    } else {
      return this
    }
  }

  toArray() {
    const { _a, _b, _c, _d, space } = this
    return [_a, _b, _c, _d, space]
  }

  toHex() {
    const [r, g, b] = this._clamped().map(componentHex)
    return `#${r}${g}${b}`
  }

  toRgb() {
    const [rV, gV, bV] = this._clamped()
    const string = `rgb(${rV},${gV},${bV})`
    return string
  }

  toString() {
    return this.toHex()
  }

  xyz() {
    // Normalise the red, green and blue values
    const { _a: r255, _b: g255, _c: b255 } = this.rgb()
    const [r, g, b] = [r255, g255, b255].map((v) => v / 255)

    // Convert to the lab rgb space
    const rL = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
    const gL = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
    const bL = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92

    // Convert to the xyz color space without bounding the values
    const xU = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047
    const yU = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.0
    const zU = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883

    // Get the proper xyz values by applying the bounding
    const x = xU > 0.008856 ? Math.pow(xU, 1 / 3) : 7.787 * xU + 16 / 116
    const y = yU > 0.008856 ? Math.pow(yU, 1 / 3) : 7.787 * yU + 16 / 116
    const z = zU > 0.008856 ? Math.pow(zU, 1 / 3) : 7.787 * zU + 16 / 116

    // Make and return the color
    const color = new Color(x, y, z, 'xyz')
    return color
  }

  /*
  Input and Output methods
  */

  _clamped() {
    const { _a, _b, _c } = this.rgb()
    const { max, min, round } = Math
    const format = (v) => max(0, min(round(v), 255))
    return [_a, _b, _c].map(format)
  }

  /*
  Constructing colors
  */
}
