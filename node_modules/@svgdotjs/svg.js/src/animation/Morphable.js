import { Ease } from './Controller.js'
import {
  delimiter,
  numberAndUnit,
  isPathLetter
} from '../modules/core/regex.js'
import { extend } from '../utils/adopter.js'
import Color from '../types/Color.js'
import PathArray from '../types/PathArray.js'
import SVGArray from '../types/SVGArray.js'
import SVGNumber from '../types/SVGNumber.js'

const getClassForType = (value) => {
  const type = typeof value

  if (type === 'number') {
    return SVGNumber
  } else if (type === 'string') {
    if (Color.isColor(value)) {
      return Color
    } else if (delimiter.test(value)) {
      return isPathLetter.test(value) ? PathArray : SVGArray
    } else if (numberAndUnit.test(value)) {
      return SVGNumber
    } else {
      return NonMorphable
    }
  } else if (morphableTypes.indexOf(value.constructor) > -1) {
    return value.constructor
  } else if (Array.isArray(value)) {
    return SVGArray
  } else if (type === 'object') {
    return ObjectBag
  } else {
    return NonMorphable
  }
}

export default class Morphable {
  constructor(stepper) {
    this._stepper = stepper || new Ease('-')

    this._from = null
    this._to = null
    this._type = null
    this._context = null
    this._morphObj = null
  }

  at(pos) {
    return this._morphObj.morph(
      this._from,
      this._to,
      pos,
      this._stepper,
      this._context
    )
  }

  done() {
    const complete = this._context.map(this._stepper.done).reduce(function (
      last,
      curr
    ) {
      return last && curr
    }, true)
    return complete
  }

  from(val) {
    if (val == null) {
      return this._from
    }

    this._from = this._set(val)
    return this
  }

  stepper(stepper) {
    if (stepper == null) return this._stepper
    this._stepper = stepper
    return this
  }

  to(val) {
    if (val == null) {
      return this._to
    }

    this._to = this._set(val)
    return this
  }

  type(type) {
    // getter
    if (type == null) {
      return this._type
    }

    // setter
    this._type = type
    return this
  }

  _set(value) {
    if (!this._type) {
      this.type(getClassForType(value))
    }

    let result = new this._type(value)
    if (this._type === Color) {
      result = this._to
        ? result[this._to[4]]()
        : this._from
          ? result[this._from[4]]()
          : result
    }

    if (this._type === ObjectBag) {
      result = this._to
        ? result.align(this._to)
        : this._from
          ? result.align(this._from)
          : result
    }

    result = result.toConsumable()

    this._morphObj = this._morphObj || new this._type()
    this._context =
      this._context ||
      Array.apply(null, Array(result.length))
        .map(Object)
        .map(function (o) {
          o.done = true
          return o
        })
    return result
  }
}

export class NonMorphable {
  constructor(...args) {
    this.init(...args)
  }

  init(val) {
    val = Array.isArray(val) ? val[0] : val
    this.value = val
    return this
  }

  toArray() {
    return [this.value]
  }

  valueOf() {
    return this.value
  }
}

export class TransformBag {
  constructor(...args) {
    this.init(...args)
  }

  init(obj) {
    if (Array.isArray(obj)) {
      obj = {
        scaleX: obj[0],
        scaleY: obj[1],
        shear: obj[2],
        rotate: obj[3],
        translateX: obj[4],
        translateY: obj[5],
        originX: obj[6],
        originY: obj[7]
      }
    }

    Object.assign(this, TransformBag.defaults, obj)
    return this
  }

  toArray() {
    const v = this

    return [
      v.scaleX,
      v.scaleY,
      v.shear,
      v.rotate,
      v.translateX,
      v.translateY,
      v.originX,
      v.originY
    ]
  }
}

TransformBag.defaults = {
  scaleX: 1,
  scaleY: 1,
  shear: 0,
  rotate: 0,
  translateX: 0,
  translateY: 0,
  originX: 0,
  originY: 0
}

const sortByKey = (a, b) => {
  return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
}

export class ObjectBag {
  constructor(...args) {
    this.init(...args)
  }

  align(other) {
    const values = this.values
    for (let i = 0, il = values.length; i < il; ++i) {
      // If the type is the same we only need to check if the color is in the correct format
      if (values[i + 1] === other[i + 1]) {
        if (values[i + 1] === Color && other[i + 7] !== values[i + 7]) {
          const space = other[i + 7]
          const color = new Color(this.values.splice(i + 3, 5))
            [space]()
            .toArray()
          this.values.splice(i + 3, 0, ...color)
        }

        i += values[i + 2] + 2
        continue
      }

      if (!other[i + 1]) {
        return this
      }

      // The types differ, so we overwrite the new type with the old one
      // And initialize it with the types default (e.g. black for color or 0 for number)
      const defaultObject = new other[i + 1]().toArray()

      // Than we fix the values array
      const toDelete = values[i + 2] + 3

      values.splice(
        i,
        toDelete,
        other[i],
        other[i + 1],
        other[i + 2],
        ...defaultObject
      )

      i += values[i + 2] + 2
    }
    return this
  }

  init(objOrArr) {
    this.values = []

    if (Array.isArray(objOrArr)) {
      this.values = objOrArr.slice()
      return
    }

    objOrArr = objOrArr || {}
    const entries = []

    for (const i in objOrArr) {
      const Type = getClassForType(objOrArr[i])
      const val = new Type(objOrArr[i]).toArray()
      entries.push([i, Type, val.length, ...val])
    }

    entries.sort(sortByKey)

    this.values = entries.reduce((last, curr) => last.concat(curr), [])
    return this
  }

  toArray() {
    return this.values
  }

  valueOf() {
    const obj = {}
    const arr = this.values

    // for (var i = 0, len = arr.length; i < len; i += 2) {
    while (arr.length) {
      const key = arr.shift()
      const Type = arr.shift()
      const num = arr.shift()
      const values = arr.splice(0, num)
      obj[key] = new Type(values) // .valueOf()
    }

    return obj
  }
}

const morphableTypes = [NonMorphable, TransformBag, ObjectBag]

export function registerMorphableType(type = []) {
  morphableTypes.push(...[].concat(type))
}

export function makeMorphable() {
  extend(morphableTypes, {
    to(val) {
      return new Morphable()
        .type(this.constructor)
        .from(this.toArray()) // this.valueOf())
        .to(val)
    },
    fromArray(arr) {
      this.init(arr)
      return this
    },
    toConsumable() {
      return this.toArray()
    },
    morph(from, to, pos, stepper, context) {
      const mapper = function (i, index) {
        return stepper.step(i, to[index], pos, context[index], context)
      }

      return this.fromArray(from.map(mapper))
    }
  })
}
