/*
 ** Generic functions which are not dependent on ApexCharts.
 */

class Utils {
  static bind (fn, me) {
    return function () {
      return fn.apply(me, arguments)
    }
  }

  static isObject (item) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null)
  }

  // to extend defaults with user options
  // credit: http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7#answer-34749873
  static extend (target, source) {
    if (typeof Object.assign !== 'function') {
      (function () {
        Object.assign = function (target) {
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
      Object.keys(source).forEach(key => {
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

  static addProps(obj, arr, val) {

    if (typeof arr == 'string')
        arr = arr.split(".");

    obj[arr[0]] = obj[arr[0]] || {};

    var tmpObj = obj[arr[0]];

    if (arr.length > 1) {
        arr.shift();
        this.addProps(tmpObj, arr, val);
    }
    else
        obj[arr[0]] = val;

    return obj;

}

  static clone(source) {
    if (Object.prototype.toString.call(source) === '[object Array]') {
        let cloneResult = [];
        for (let i=0; i<source.length; i++) {
          cloneResult[i] = this.clone(source[i]);
        }
        return cloneResult;
    } else if (typeof(source)==="object") {
      let cloneResult = {};
        for (let prop in source) {
            if (source.hasOwnProperty(prop)) {
              cloneResult[prop] = this.clone(source[prop]);
            }
        }
        return cloneResult;
    } else {
        return source;
    }
}

  static getDimensions (el) {
    let computedStyle = getComputedStyle(el)
    let ret = []

    let elementHeight = el.clientHeight
    let elementWidth = el.clientWidth

    elementHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom)
    elementWidth -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight)
    ret.push(elementWidth)
    ret.push(elementHeight)

    return ret
  }

  static getBoundingClientRect (element) {
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
  static hexToRgba (hex = '#999999', opacity = 0.6) {
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

  static rgb2hex (rgb) {
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
     ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
     ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
     ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
   }

  // beautiful color shading blending code
  // http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
  shadeColor (p, from, to = undefined) {
    if(from[0] !== '#' || from[0] !== 'r') {
      from = this.getHexColorFromName(from)
    }
    if (typeof (p) !== 'number' || p < -1 || p > 1 || typeof (from) !== 'string' || (from[0] !== 'r' && from[0] !== '#') || (typeof (to) !== 'string' && typeof (to) !== 'undefined')) return null // ErrorCheck
    var i = parseInt,
      r = Math.round,
      h = from.length > 9,
      h = typeof (to) === 'string' ? to.length > 9 ? true : to === 'c' ? !h : false : h,
      b = p < 0,
      p = b ? p * -1 : p,
      to = to && to !== 'c' ? to : b ? '#000000' : '#FFFFFF',
      f = this.sbcRip(from),
      t = this.sbcRip(to)
    if (!f || !t) return null // ErrorCheck
    if (h) return 'rgb(' + r((t[0] - f[0]) * p + f[0]) + ',' + r((t[1] - f[1]) * p + f[1]) + ',' + r((t[2] - f[2]) * p + f[2]) + (f[3] < 0 && t[3] < 0 ? ')' : ',' + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 10000) / 10000 : t[3] < 0 ? f[3] : t[3]) + ')')
    else return '#' + (0x100000000 + (f[3] > -1 && t[3] > -1 ? r(((t[3] - f[3]) * p + f[3]) * 255) : t[3] > -1 ? r(t[3] * 255) : f[3] > -1 ? r(f[3] * 255) : 255) * 0x1000000 + r((t[0] - f[0]) * p + f[0]) * 0x10000 + r((t[1] - f[1]) * p + f[1]) * 0x100 + r((t[2] - f[2]) * p + f[2])).toString(16).slice(f[3] > -1 || t[3] > -1 ? 1 : 3)
  }

  // helper function of shadeColor
  sbcRip (d) {
    var l = d.length,
      RGB = new Object()
    var i = parseInt,
      r = Math.round
    if (l > 9) {
      d = d.split(',')
      if (d.length < 3 || d.length > 4) return null // ErrorCheck
      RGB[0] = i(d[0].slice(4)), RGB[1] = i(d[1]), RGB[2] = i(d[2]), RGB[3] = d[3] ? parseFloat(d[3]) : -1
    } else {
      if (l === 8 || l === 6 || l < 4) return null // ErrorCheck
      if (l < 6) d = '#' + d[1] + d[1] + d[2] + d[2] + d[3] + d[3] + (l > 4 ? d[4] + '' + d[4] : '') // 3 digit
      d = i(d.slice(1), 16), RGB[0] = d >> 16 & 255, RGB[1] = d >> 8 & 255, RGB[2] = d & 255, RGB[3] = l === 9 || l === 5 ? r(((d >> 24 & 255) / 255) * 10000) / 10000 : -1
    }
    return RGB
  }

  // https://stackoverflow.com/questions/1573053/javascript-function-to-convert-color-names-to-hex-codes
  getHexColorFromName(colorStr) {
    var a = document.createElement('div');
    a.style.color = colorStr;
    var colors = window.getComputedStyle( document.body.appendChild(a) ).color.match(/\d+/g).map(function(a){ return parseInt(a,10); });
    document.body.removeChild(a);
    return (colors.length >= 3) ? '#' + (((1 << 24) + (colors[0] << 16) + (colors[1] << 8) + colors[2]).toString(16).substr(1)) : false;
  }

  static polarToCartesian (centerX, centerY, radius, angleInDegrees) {
    let angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0

    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  static negToZero (val) {
    return val < 0 ? 0 : val
  }

  static randomString (len) {
    let text = ''
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

    for (let i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }

    return text
  }

  static findAncestor (el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls));
    return el
  }

  static setELstyles (el, styles) {
    for (let key in styles) {
      if (styles.hasOwnProperty(key)) {
        el.style.key = styles[key]
      }
    }
  }

  static isInt (value) {
    return !isNaN(value) &&
      parseFloat(Number(value)) === value &&
      !isNaN(parseInt(value, 10))
  }

  static isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  static isIE () {
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
