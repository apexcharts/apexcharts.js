import { numberAndUnit } from '../modules/core/regex.js'

// Module for unit conversions
export default class SVGNumber {
  // Initialize
  constructor(...args) {
    this.init(...args)
  }

  convert(unit) {
    return new SVGNumber(this.value, unit)
  }

  // Divide number
  divide(number) {
    number = new SVGNumber(number)
    return new SVGNumber(this / number, this.unit || number.unit)
  }

  init(value, unit) {
    unit = Array.isArray(value) ? value[1] : unit
    value = Array.isArray(value) ? value[0] : value

    // initialize defaults
    this.value = 0
    this.unit = unit || ''

    // parse value
    if (typeof value === 'number') {
      // ensure a valid numeric value
      this.value = isNaN(value)
        ? 0
        : !isFinite(value)
          ? value < 0
            ? -3.4e38
            : +3.4e38
          : value
    } else if (typeof value === 'string') {
      unit = value.match(numberAndUnit)

      if (unit) {
        // make value numeric
        this.value = parseFloat(unit[1])

        // normalize
        if (unit[5] === '%') {
          this.value /= 100
        } else if (unit[5] === 's') {
          this.value *= 1000
        }

        // store unit
        this.unit = unit[5]
      }
    } else {
      if (value instanceof SVGNumber) {
        this.value = value.valueOf()
        this.unit = value.unit
      }
    }

    return this
  }

  // Subtract number
  minus(number) {
    number = new SVGNumber(number)
    return new SVGNumber(this - number, this.unit || number.unit)
  }

  // Add number
  plus(number) {
    number = new SVGNumber(number)
    return new SVGNumber(this + number, this.unit || number.unit)
  }

  // Multiply number
  times(number) {
    number = new SVGNumber(number)
    return new SVGNumber(this * number, this.unit || number.unit)
  }

  toArray() {
    return [this.value, this.unit]
  }

  toJSON() {
    return this.toString()
  }

  toString() {
    return (
      (this.unit === '%'
        ? ~~(this.value * 1e8) / 1e6
        : this.unit === 's'
          ? this.value / 1e3
          : this.value) + this.unit
    )
  }

  valueOf() {
    return this.value
  }
}
