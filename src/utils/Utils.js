/*
 ** Generic functions which are not dependent on ApexCharts
 */

class Utils {
  static bind(fn, me) {
    return function() {
      return fn.apply(me, arguments)
    }
  }

  static isObject(item) {
    return (
      item && typeof item === 'object' && !Array.isArray(item) && item != null
    )
  }

  // to extend defaults with user options
  // credit: http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7#answer-34749873
  static extend(target, source) {
    if (typeof Object.assign !== 'function') {
      ;(function() {
        Object.assign = function(target) {
          'use strict'
          // We must check against these specific cases.
          if (target === undefined || target === null) {
            throw new TypeError('Cannot convert undefined or null to object')
          }

          let output = Object(target)
          for (let index = 1; index < arguments.length; index++) {
            let source = arguments[index]
            if (source !== undefined && source !== null) {
              for (let nextKey in source) {
                if (source.hasOwnProperty(nextKey)) {
                  output[nextKey] = source[nextKey]
                }
              }
            }
          }
          return output
        }
      })()
    }

    let output = Object.assign({}, target)
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, {
              [key]: source[key]
            })
          } else {
            output[key] = this.extend(target[key], source[key])
          }
        } else {
          Object.assign(output, {
            [key]: source[key]
          })
        }
      })
    }
    return output
  }

  static extendArray(arrToExtend, resultArr) {
    let extendedArr = []
    arrToExtend.map((item) => {
      extendedArr.push(Utils.extend(resultArr, item))
    })
    arrToExtend = extendedArr
    return arrToExtend
  }

  // If month counter exceeds 12, it starts again from 1
  static monthMod(month) {
    return month % 12
  }

  static addProps(obj, arr, val) {
    if (typeof arr === 'string') {
      arr = arr.split('.')
    }

    obj[arr[0]] = obj[arr[0]] || {}

    var tmpObj = obj[arr[0]]

    if (arr.length > 1) {
      arr.shift()
      this.addProps(tmpObj, arr, val)
    } else {
      obj[arr[0]] = val
    }

    return obj
  }

  static clone(source) {
    if (Object.prototype.toString.call(source) === '[object Array]') {
      let cloneResult = []
      for (let i = 0; i < source.length; i++) {
        cloneResult[i] = this.clone(source[i])
      }
      return cloneResult
    } else if (typeof source === 'object') {
      let cloneResult = {}
      for (let prop in source) {
        if (source.hasOwnProperty(prop)) {
          cloneResult[prop] = this.clone(source[prop])
        }
      }
      return cloneResult
    } else {
      return source
    }
  }

  static log10(x) {
    return Math.log(x) / Math.LN10
  }

  static roundToBase10(x) {
    return Math.pow(10, Math.floor(Math.log10(x)))
  }

  static roundToBase(x, base) {
    return Math.pow(base, Math.floor(Math.log(x) / Math.log(base)))
  }

  static parseNumber(val) {
    if (val === null) return val
    return parseFloat(val)
  }

  static getDimensions(el) {
    let computedStyle = getComputedStyle(el)
    let ret = []

    let elementHeight = el.clientHeight
    let elementWidth = el.clientWidth

    elementHeight -=
      parseFloat(computedStyle.paddingTop) +
      parseFloat(computedStyle.paddingBottom)
    elementWidth -=
      parseFloat(computedStyle.paddingLeft) +
      parseFloat(computedStyle.paddingRight)
    ret.push(elementWidth)
    ret.push(elementHeight)

    return ret
  }

  static getBoundingClientRect(element) {
    const rect = element.getBoundingClientRect()
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      x: rect.x,
      y: rect.y
    }
  }

  // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#answer-12342275
  static hexToRgba(hex = '#999999', opacity = 0.6) {
    if (hex.substring(0, 1) !== '#') {
      hex = '#999999'
    }

    let h = hex.replace('#', '')
    h = h.match(new RegExp('(.{' + h.length / 3 + '})', 'g'))

    for (let i = 0; i < h.length; i++) {
      h[i] = parseInt(h[i].length === 1 ? h[i] + h[i] : h[i], 16)
    }

    if (typeof opacity !== 'undefined') h.push(opacity)

    return 'rgba(' + h.join(',') + ')'
  }

  static getOpacityFromRGBA(rgba) {
    rgba = rgba.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    )
    return rgba[3]
  }

  static rgb2hex(rgb) {
    rgb = rgb.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    )
    return rgb && rgb.length === 4
      ? '#' +
          ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
          ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2)
      : ''
  }

  shadeRGBColor(percent, color) {
    var f = color.split(','),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = parseInt(f[0].slice(4)),
      G = parseInt(f[1]),
      B = parseInt(f[2])
    return (
      'rgb(' +
      (Math.round((t - R) * p) + R) +
      ',' +
      (Math.round((t - G) * p) + G) +
      ',' +
      (Math.round((t - B) * p) + B) +
      ')'
    )
  }

  shadeHexColor(percent, color) {
    var f = parseInt(color.slice(1), 16),
      t = percent < 0 ? 0 : 255,
      p = percent < 0 ? percent * -1 : percent,
      R = f >> 16,
      G = (f >> 8) & 0x00ff,
      B = f & 0x0000ff
    return (
      '#' +
      (
        0x1000000 +
        (Math.round((t - R) * p) + R) * 0x10000 +
        (Math.round((t - G) * p) + G) * 0x100 +
        (Math.round((t - B) * p) + B)
      )
        .toString(16)
        .slice(1)
    )
  }

  // beautiful color shading blending code
  // http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
  shadeColor(p, color) {
    if (color.length > 7) return this.shadeRGBColor(p, color)
    else return this.shadeHexColor(p, color)
  }

  // https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
  getHexColorFromName(colorStr) {
    var a = document.createElement('div')
    a.style.color = colorStr
    var colors = window
      .getComputedStyle(document.body.appendChild(a))
      .color.match(/\d+/g)
      .map(function(a) {
        return parseInt(a, 10)
      })
    document.body.removeChild(a)
    return colors.length >= 3
      ? '#' +
          ((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2])
            .toString(16)
            .substr(1)
      : false
  }

  static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    let angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0

    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    }
  }

  static negToZero(val) {
    return val < 0 ? 0 : val
  }

  static randomString(len) {
    let text = ''
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

    for (let i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
  }

  static findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el
  }

  static setELstyles(el, styles) {
    for (let key in styles) {
      if (styles.hasOwnProperty(key)) {
        el.style.key = styles[key]
      }
    }
  }

  static isNumber(value) {
    return (
      !isNaN(value) &&
      parseFloat(Number(value)) === value &&
      !isNaN(parseInt(value, 10))
    )
  }

  static isFloat(n) {
    return Number(n) === n && n % 1 !== 0
  }

  static isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  }

  static isFirefox() {
    return navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  }

  static isIE11() {
    if (
      window.navigator.userAgent.indexOf('MSIE') !== -1 ||
      window.navigator.appVersion.indexOf('Trident/') > -1
    ) {
      return true
    }
  }

  static isIE() {
    let ua = window.navigator.userAgent

    let msie = ua.indexOf('MSIE ')
    if (msie > 0) {
      // IE 10 or older => return version number
      return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10)
    }

    let trident = ua.indexOf('Trident/')
    if (trident > 0) {
      // IE 11 => return version number
      let rv = ua.indexOf('rv:')
      return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10)
    }

    let edge = ua.indexOf('Edge/')
    if (edge > 0) {
      // Edge (IE 12+) => return version number
      return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
    }

    // other browser
    return false
  }
}

export default Utils
