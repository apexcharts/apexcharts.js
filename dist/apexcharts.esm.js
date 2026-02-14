var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
/*!
 * ApexCharts v5.4.0
 * (c) 2018-2026 ApexCharts
 */
let Utils$1 = class Utils {
  static bind(fn, me) {
    return function() {
      return fn.apply(me, arguments);
    };
  }
  static isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item) && item != null;
  }
  // Type checking that works across different window objects
  static is(type, val) {
    return Object.prototype.toString.call(val) === "[object " + type + "]";
  }
  static isSafari() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }
  static listToArray(list) {
    let i, array = [];
    for (i = 0; i < list.length; i++) {
      array[i] = list[i];
    }
    return array;
  }
  // to extend defaults with user options
  // credit: http://stackoverflow.com/questions/27936772/deep-object-merging-in-es6-es7#answer-34749873
  static extend(target, source) {
    if (typeof Object.assign !== "function") {
      (function() {
        Object.assign = function(target2) {
          if (target2 === void 0 || target2 === null) {
            throw new TypeError("Cannot convert undefined or null to object");
          }
          let output2 = Object(target2);
          for (let index = 1; index < arguments.length; index++) {
            let source2 = arguments[index];
            if (source2 !== void 0 && source2 !== null) {
              for (let nextKey in source2) {
                if (source2.hasOwnProperty(nextKey)) {
                  output2[nextKey] = source2[nextKey];
                }
              }
            }
          }
          return output2;
        };
      })();
    }
    let output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, {
              [key]: source[key]
            });
          } else {
            output[key] = this.extend(target[key], source[key]);
          }
        } else {
          Object.assign(output, {
            [key]: source[key]
          });
        }
      });
    }
    return output;
  }
  static extendArray(arrToExtend, resultArr) {
    let extendedArr = [];
    arrToExtend.map((item) => {
      extendedArr.push(Utils.extend(resultArr, item));
    });
    arrToExtend = extendedArr;
    return arrToExtend;
  }
  // If month counter exceeds 12, it starts again from 1
  static monthMod(month) {
    return month % 12;
  }
  /**
   * clone object with optional shallow copy for performance
   * @param {*} source - Source object to clone
   * @param {WeakMap} visited - Circular reference tracker
   * @param {boolean} shallow - If true, performs shallow copy (default: false)
   * @returns {*} Cloned object
   */
  static clone(source, visited = /* @__PURE__ */ new WeakMap(), shallow = false) {
    if (source === null || typeof source !== "object") {
      return source;
    }
    if (visited.has(source)) {
      return visited.get(source);
    }
    let cloneResult;
    if (Array.isArray(source)) {
      if (shallow) {
        cloneResult = source.slice();
      } else {
        cloneResult = [];
        visited.set(source, cloneResult);
        for (let i = 0; i < source.length; i++) {
          cloneResult[i] = this.clone(source[i], visited, false);
        }
      }
    } else if (source instanceof Date) {
      cloneResult = new Date(source.getTime());
    } else {
      if (shallow) {
        cloneResult = Object.assign({}, source);
      } else {
        cloneResult = {};
        visited.set(source, cloneResult);
        for (let prop in source) {
          if (source.hasOwnProperty(prop)) {
            cloneResult[prop] = this.clone(source[prop], visited, false);
          }
        }
      }
    }
    return cloneResult;
  }
  /**
   * Shallow clone for performance when deep clone isn't needed
   * @param {*} source - Source to clone
   * @returns {*} Shallow cloned object
   */
  static shallowClone(source) {
    if (source === null || typeof source !== "object") {
      return source;
    }
    if (Array.isArray(source)) {
      return source.slice();
    }
    return Object.assign({}, source);
  }
  /**
   * Fast shallow equality check for objects
   * @param {Object} obj1 - First object
   * @param {Object} obj2 - Second object
   * @returns {boolean} True if shallowly equal
   */
  static shallowEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (!obj1 || !obj2) return false;
    if (typeof obj1 !== "object" || typeof obj2 !== "object") {
      return obj1 === obj2;
    }
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;
    for (let key of keys1) {
      if (obj1[key] !== obj2[key]) return false;
    }
    return true;
  }
  static log10(x) {
    return Math.log(x) / Math.LN10;
  }
  static roundToBase10(x) {
    return Math.pow(10, Math.floor(Math.log10(x)));
  }
  static roundToBase(x, base) {
    return Math.pow(base, Math.floor(Math.log(x) / Math.log(base)));
  }
  static parseNumber(val) {
    if (typeof val === "number" || val === null) return val;
    return parseFloat(val);
  }
  static stripNumber(num, precision = 2) {
    return Number.isInteger(num) ? num : parseFloat(num.toPrecision(precision));
  }
  static randomId() {
    return (Math.random() + 1).toString(36).substring(4);
  }
  static noExponents(num) {
    if (num.toString().includes("e")) {
      return Math.round(num);
    }
    return num;
  }
  static elementExists(element) {
    if (!element || !element.isConnected) {
      return false;
    }
    return true;
  }
  /**
   * detects if an element is inside a Shadow DOM
   */
  static isInShadowDOM(el) {
    if (!el || !el.getRootNode) {
      return false;
    }
    const rootNode = el.getRootNode();
    return rootNode && rootNode !== document && Utils.is("ShadowRoot", rootNode);
  }
  /**
   * gets the shadow root host element
   */
  static getShadowRootHost(el) {
    if (!Utils.isInShadowDOM(el)) {
      return null;
    }
    const rootNode = el.getRootNode();
    return rootNode.host || null;
  }
  static getDimensions(el) {
    if (!el) return [0, 0];
    const rootNode = el.getRootNode && el.getRootNode();
    const inShadowDOM = rootNode && rootNode !== document;
    if (inShadowDOM && rootNode.host) {
      const hostRect = rootNode.host.getBoundingClientRect();
      return [hostRect.width, hostRect.height];
    }
    let computedStyle;
    try {
      computedStyle = getComputedStyle(el, null);
    } catch (e) {
      return [el.clientWidth || 0, el.clientHeight || 0];
    }
    let elementHeight = el.clientHeight;
    let elementWidth = el.clientWidth;
    elementHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    elementWidth -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return [elementWidth, elementHeight];
  }
  static getBoundingClientRect(element) {
    if (!element) {
      return {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0
      };
    }
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: element.clientWidth,
      height: element.clientHeight,
      x: rect.left,
      y: rect.top
    };
  }
  static getLargestStringFromArr(arr) {
    return arr.reduce((a, b) => {
      if (Array.isArray(b)) {
        b = b.reduce((aa, bb) => aa.length > bb.length ? aa : bb);
      }
      return a.length > b.length ? a : b;
    }, 0);
  }
  // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb#answer-12342275
  static hexToRgba(hex = "#999999", opacity = 0.6) {
    if (hex.substring(0, 1) !== "#") {
      hex = "#999999";
    }
    let h = hex.replace("#", "");
    h = h.match(new RegExp("(.{" + h.length / 3 + "})", "g"));
    for (let i = 0; i < h.length; i++) {
      h[i] = parseInt(h[i].length === 1 ? h[i] + h[i] : h[i], 16);
    }
    if (typeof opacity !== "undefined") h.push(opacity);
    return "rgba(" + h.join(",") + ")";
  }
  static getOpacityFromRGBA(rgba) {
    return parseFloat(rgba.replace(/^.*,(.+)\)/, "$1"));
  }
  static rgb2hex(rgb) {
    rgb = rgb.match(
      /^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i
    );
    return rgb && rgb.length === 4 ? "#" + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : "";
  }
  shadeRGBColor(percent, color) {
    let f = color.split(","), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = parseInt(f[0].slice(4), 10), G = parseInt(f[1], 10), B = parseInt(f[2], 10);
    return "rgb(" + (Math.round((t - R) * p) + R) + "," + (Math.round((t - G) * p) + G) + "," + (Math.round((t - B) * p) + B) + ")";
  }
  shadeHexColor(percent, color) {
    let f = parseInt(color.slice(1), 16), t = percent < 0 ? 0 : 255, p = percent < 0 ? percent * -1 : percent, R = f >> 16, G = f >> 8 & 255, B = f & 255;
    return "#" + (16777216 + (Math.round((t - R) * p) + R) * 65536 + (Math.round((t - G) * p) + G) * 256 + (Math.round((t - B) * p) + B)).toString(16).slice(1);
  }
  // beautiful color shading blending code
  // http://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
  shadeColor(p, color) {
    if (Utils.isColorHex(color)) {
      return this.shadeHexColor(p, color);
    } else {
      return this.shadeRGBColor(p, color);
    }
  }
  static isColorHex(color) {
    return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)|(^#[0-9A-F]{8}$)/i.test(color);
  }
  static isCSSVariable(color) {
    if (typeof color !== "string") return false;
    const value = color.trim();
    return value.startsWith("var(") && value.endsWith(")");
  }
  static getThemeColor(color) {
    if (!Utils.isCSSVariable(color)) return color;
    const tempElem = document.createElement("div");
    tempElem.style.cssText = "position:fixed; left: -9999px; visibility:hidden;";
    tempElem.style.color = color;
    document.body.appendChild(tempElem);
    let computedColor;
    try {
      computedColor = window.getComputedStyle(tempElem).color;
    } finally {
      if (tempElem.parentNode) {
        tempElem.parentNode.removeChild(tempElem);
      }
    }
    return computedColor;
  }
  static getPolygonPos(size, dataPointsLen) {
    let dotsArray = [];
    let angle = Math.PI * 2 / dataPointsLen;
    for (let i = 0; i < dataPointsLen; i++) {
      let curPos = {};
      curPos.x = size * Math.sin(i * angle);
      curPos.y = -size * Math.cos(i * angle);
      dotsArray.push(curPos);
    }
    return dotsArray;
  }
  static polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    let angleInRadians = (angleInDegrees - 90) * Math.PI / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }
  static escapeString(str, escapeWith = "x") {
    let newStr = str.toString().slice();
    newStr = newStr.replace(
      /[` ~!@#$%^&*()|+\=?;:'",.<>{}[\]\\/]/gi,
      escapeWith
    );
    return newStr;
  }
  static negToZero(val) {
    return val < 0 ? 0 : val;
  }
  static moveIndexInArray(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      let k = new_index - arr.length + 1;
      while (k--) {
        arr.push(void 0);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  }
  static extractNumber(s) {
    return parseFloat(s.replace(/[^\d.]*/g, ""));
  }
  static findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
  }
  static setELstyles(el, styles) {
    for (let key in styles) {
      if (styles.hasOwnProperty(key)) {
        el.style.key = styles[key];
      }
    }
  }
  // prevents JS prevision errors when adding
  static preciseAddition(a, b) {
    let aDecimals = (String(a).split(".")[1] || "").length;
    let bDecimals = (String(b).split(".")[1] || "").length;
    let factor = Math.pow(10, Math.max(aDecimals, bDecimals));
    return (Math.round(a * factor) + Math.round(b * factor)) / factor;
  }
  static isNumber(value) {
    return !isNaN(value) && parseFloat(Number(value)) === value && !isNaN(parseInt(value, 10));
  }
  static isFloat(n) {
    return Number(n) === n && n % 1 !== 0;
  }
  static isMsEdge() {
    let ua = window.navigator.userAgent;
    let edge = ua.indexOf("Edge/");
    if (edge > 0) {
      return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
    }
    return false;
  }
  //
  // Find the Greatest Common Divisor of two numbers
  //
  static getGCD(a, b, p = 7) {
    let factor = Math.pow(10, p - Math.floor(Math.log10(Math.max(a, b))));
    if (factor > 1) {
      a = Math.round(Math.abs(a) * factor);
      b = Math.round(Math.abs(b) * factor);
    } else {
      factor = 1;
    }
    while (b) {
      let t = b;
      b = a % b;
      a = t;
    }
    return a / factor;
  }
  static getPrimeFactors(n) {
    const factors = [];
    let divisor = 2;
    while (n >= 2) {
      if (n % divisor == 0) {
        factors.push(divisor);
        n = n / divisor;
      } else {
        divisor++;
      }
    }
    return factors;
  }
  static mod(a, b, p = 7) {
    let big = Math.pow(10, p - Math.floor(Math.log10(Math.max(a, b))));
    a = Math.round(Math.abs(a) * big);
    b = Math.round(Math.abs(b) * big);
    return a % b / big;
  }
};
class Animations {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  animateLine(el, from, to, speed) {
    el.attr(from).animate(speed).attr(to);
  }
  /*
   ** Animate radius of a circle element
   */
  animateMarker(el, speed, easing, cb) {
    el.attr({
      opacity: 0
    }).animate(speed).attr({
      opacity: 1
    }).after(() => {
      cb();
    });
  }
  /*
   ** Animate rect properties
   */
  animateRect(el, from, to, speed, fn) {
    el.attr(from).animate(speed).attr(to).after(() => fn());
  }
  animatePathsGradually(params) {
    let { el, realIndex: realIndex2, j: j2, fill, pathFrom, pathTo, speed, delay } = params;
    let me = this;
    let w = this.w;
    let delayFactor = 0;
    if (w.config.chart.animations.animateGradually.enabled) {
      delayFactor = w.config.chart.animations.animateGradually.delay;
    }
    if (w.config.chart.animations.dynamicAnimation.enabled && w.globals.dataChanged && w.config.chart.type !== "bar") {
      delayFactor = 0;
    }
    me.morphSVG(
      el,
      realIndex2,
      j2,
      w.config.chart.type === "line" && !w.globals.comboCharts ? "stroke" : fill,
      pathFrom,
      pathTo,
      speed,
      delay * delayFactor
    );
  }
  showDelayedElements() {
    this.w.globals.delayedElements.forEach((d) => {
      const ele = d.el;
      ele.classList.remove("apexcharts-element-hidden");
      ele.classList.add("apexcharts-hidden-element-shown");
    });
  }
  animationCompleted(el) {
    const w = this.w;
    if (w.globals.animationEnded) return;
    w.globals.animationEnded = true;
    this.showDelayedElements();
    if (typeof w.config.chart.events.animationEnd === "function") {
      w.config.chart.events.animationEnd(this.ctx, { el, w });
    }
  }
  // SVG.js animation for morphing one path to another
  morphSVG(el, realIndex2, j2, fill, pathFrom, pathTo, speed, delay) {
    let w = this.w;
    if (!pathFrom) {
      pathFrom = el.attr("pathFrom");
    }
    if (!pathTo) {
      pathTo = el.attr("pathTo");
    }
    const disableAnimationForCorrupPath = (path) => {
      if (w.config.chart.type === "radar") {
        speed = 1;
      }
      return `M 0 ${w.globals.gridHeight}`;
    };
    if (!pathFrom || pathFrom.indexOf("undefined") > -1 || pathFrom.indexOf("NaN") > -1) {
      pathFrom = disableAnimationForCorrupPath();
    }
    if (!pathTo.trim() || pathTo.indexOf("undefined") > -1 || pathTo.indexOf("NaN") > -1) {
      pathTo = disableAnimationForCorrupPath();
    }
    if (!w.globals.shouldAnimate) {
      speed = 1;
    }
    el.plot(pathFrom).animate(1, delay).plot(pathFrom).animate(speed, delay).plot(pathTo).after(() => {
      if (Utils$1.isNumber(j2)) {
        if (j2 === w.globals.series[w.globals.maxValsInArrayIndex].length - 2 && w.globals.shouldAnimate) {
          this.animationCompleted(el);
        }
      } else if (fill !== "none" && w.globals.shouldAnimate) {
        if (!w.globals.comboCharts && realIndex2 === w.globals.series.length - 1 || w.globals.comboCharts) {
          this.animationCompleted(el);
        }
      }
      this.showDelayedElements();
    });
  }
}
class Filters {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  // create a re-usable filter which can be appended other filter effects and applied to multiple elements
  getDefaultFilter(el, i) {
    const w = this.w;
    if (el.unfilter) {
      el.unfilter(true);
    }
    if (w.config.chart.dropShadow.enabled) {
      this.dropShadow(el, w.config.chart.dropShadow, i);
    }
  }
  applyFilter(el, i, filterType) {
    var _a, _b, _c;
    const w = this.w;
    if (el.unfilter) {
      el.unfilter(true);
    }
    if (filterType === "none") {
      this.getDefaultFilter(el, i);
      return;
    }
    const shadowAttr = w.config.chart.dropShadow;
    const brightnessFactor = filterType === "lighten" ? 2 : 0.3;
    if (el.filterWith) {
      el.filterWith((add) => {
        add.colorMatrix({
          type: "matrix",
          values: `
            ${brightnessFactor} 0 0 0 0
            0 ${brightnessFactor} 0 0 0
            0 0 ${brightnessFactor} 0 0
            0 0 0 1 0
          `,
          in: "SourceGraphic",
          result: "brightness"
        });
        if (shadowAttr.enabled) {
          this.addShadow(add, i, shadowAttr, "brightness");
        }
      });
      if (!shadowAttr.noUserSpaceOnUse) {
        (_b = (_a = el.filterer()) == null ? void 0 : _a.node) == null ? void 0 : _b.setAttribute("filterUnits", "userSpaceOnUse");
      }
      this._scaleFilterSize((_c = el.filterer()) == null ? void 0 : _c.node);
    }
  }
  // appends dropShadow to the filter object which can be chained with other filter effects
  addShadow(add, i, attrs, source) {
    var _a;
    const w = this.w;
    let { blur, top, left, color, opacity } = attrs;
    color = Array.isArray(color) ? color[i] : color;
    if (((_a = w.config.chart.dropShadow.enabledOnSeries) == null ? void 0 : _a.length) > 0) {
      if (w.config.chart.dropShadow.enabledOnSeries.indexOf(i) === -1) {
        return add;
      }
    }
    add.offset({
      in: source,
      dx: left,
      dy: top,
      result: "offset"
    });
    add.gaussianBlur({
      in: "offset",
      stdDeviation: blur,
      result: "blur"
    });
    add.flood({
      "flood-color": color,
      "flood-opacity": opacity,
      result: "flood"
    });
    add.composite({
      in: "flood",
      in2: "blur",
      operator: "in",
      result: "shadow"
    });
    add.merge(["shadow", source]);
  }
  // directly adds dropShadow to the element and returns the same element.
  dropShadow(el, attrs, i = 0) {
    var _a, _b, _c, _d, _e;
    const w = this.w;
    if (el.unfilter) {
      el.unfilter(true);
    }
    if (Utils$1.isMsEdge() && w.config.chart.type === "radialBar") {
      return el;
    }
    if (((_a = w.config.chart.dropShadow.enabledOnSeries) == null ? void 0 : _a.length) > 0) {
      if (((_b = w.config.chart.dropShadow.enabledOnSeries) == null ? void 0 : _b.indexOf(i)) === -1) {
        return el;
      }
    }
    if (el.filterWith) {
      el.filterWith((add) => {
        this.addShadow(add, i, attrs, "SourceGraphic");
      });
      if (!attrs.noUserSpaceOnUse) {
        (_d = (_c = el.filterer()) == null ? void 0 : _c.node) == null ? void 0 : _d.setAttribute("filterUnits", "userSpaceOnUse");
      }
      this._scaleFilterSize((_e = el.filterer()) == null ? void 0 : _e.node);
    }
    return el;
  }
  setSelectionFilter(el, realIndex2, dataPointIndex) {
    const w = this.w;
    if (typeof w.globals.selectedDataPoints[realIndex2] !== "undefined") {
      if (w.globals.selectedDataPoints[realIndex2].indexOf(dataPointIndex) > -1) {
        el.node.setAttribute("selected", true);
        let activeFilter = w.config.states.active.filter;
        if (activeFilter !== "none") {
          this.applyFilter(el, realIndex2, activeFilter.type);
        }
      }
    }
  }
  _scaleFilterSize(el) {
    if (!el) return;
    const setAttributes = (attrs) => {
      for (let key in attrs) {
        if (attrs.hasOwnProperty(key)) {
          el.setAttribute(key, attrs[key]);
        }
      }
    };
    setAttributes({
      width: "200%",
      height: "200%",
      x: "-50%",
      y: "-50%"
    });
  }
}
class Graphics {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  /*****************************************************************************
   *                                                                            *
   *  SVG Path Rounding Function                                                *
   *  Copyright (C) 2014 Yona Appletree                                         *
   *                                                                            *
   *  Licensed under the Apache License, Version 2.0 (the "License");           *
   *  you may not use this file except in compliance with the License.          *
   *  You may obtain a copy of the License at                                   *
   *                                                                            *
   *      http://www.apache.org/licenses/LICENSE-2.0                            *
   *                                                                            *
   *  Unless required by applicable law or agreed to in writing, software       *
   *  distributed under the License is distributed on an "AS IS" BASIS,         *
   *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
   *  See the License for the specific language governing permissions and       *
   *  limitations under the License.                                            *
   *                                                                            *
   *****************************************************************************/
  /**
   * SVG Path rounding function. Takes an input path string and outputs a path
   * string where all line-line corners have been rounded. Only supports absolute
   * commands at the moment.
   *
   * @param pathString The SVG input path
   * @param radius The amount to round the corners, either a value in the SVG
   *               coordinate space, or, if useFractionalRadius is true, a value
   *               from 0 to 1.
   * @returns A new SVG path string with the rounding
   */
  roundPathCorners(pathString, radius) {
    if (pathString.indexOf("NaN") > -1) pathString = "";
    function moveTowardsLength(movingPoint, targetPoint, amount) {
      var width = targetPoint.x - movingPoint.x;
      var height = targetPoint.y - movingPoint.y;
      var distance = Math.sqrt(width * width + height * height);
      return moveTowardsFractional(
        movingPoint,
        targetPoint,
        Math.min(1, amount / distance)
      );
    }
    function moveTowardsFractional(movingPoint, targetPoint, fraction) {
      return {
        x: movingPoint.x + (targetPoint.x - movingPoint.x) * fraction,
        y: movingPoint.y + (targetPoint.y - movingPoint.y) * fraction
      };
    }
    function adjustCommand(cmd, newPoint) {
      if (cmd.length > 2) {
        cmd[cmd.length - 2] = newPoint.x;
        cmd[cmd.length - 1] = newPoint.y;
      }
    }
    function pointForCommand(cmd) {
      return {
        x: parseFloat(cmd[cmd.length - 2]),
        y: parseFloat(cmd[cmd.length - 1])
      };
    }
    var pathParts = pathString.split(/[,\s]/).reduce(function(parts, part) {
      var match = part.match(/^([a-zA-Z])(.+)/);
      if (match) {
        parts.push(match[1]);
        parts.push(match[2]);
      } else {
        parts.push(part);
      }
      return parts;
    }, []);
    var commands = pathParts.reduce(function(commands2, part) {
      if (parseFloat(part) == part && commands2.length) {
        commands2[commands2.length - 1].push(part);
      } else {
        commands2.push([part]);
      }
      return commands2;
    }, []);
    var resultCommands = [];
    if (commands.length > 1) {
      var startPoint = pointForCommand(commands[0]);
      var virtualCloseLine = null;
      if (commands[commands.length - 1][0] == "Z" && commands[0].length > 2) {
        virtualCloseLine = ["L", startPoint.x, startPoint.y];
        commands[commands.length - 1] = virtualCloseLine;
      }
      resultCommands.push(commands[0]);
      for (var cmdIndex = 1; cmdIndex < commands.length; cmdIndex++) {
        var prevCmd = resultCommands[resultCommands.length - 1];
        var curCmd = commands[cmdIndex];
        var nextCmd = curCmd == virtualCloseLine ? commands[1] : commands[cmdIndex + 1];
        if (nextCmd && prevCmd && prevCmd.length > 2 && curCmd[0] == "L" && nextCmd.length > 2 && nextCmd[0] == "L") {
          var prevPoint = pointForCommand(prevCmd);
          var curPoint = pointForCommand(curCmd);
          var nextPoint = pointForCommand(nextCmd);
          var curveStart, curveEnd;
          curveStart = moveTowardsLength(curPoint, prevPoint, radius);
          curveEnd = moveTowardsLength(curPoint, nextPoint, radius);
          adjustCommand(curCmd, curveStart);
          curCmd.origPoint = curPoint;
          resultCommands.push(curCmd);
          var startControl = moveTowardsFractional(curveStart, curPoint, 0.5);
          var endControl = moveTowardsFractional(curPoint, curveEnd, 0.5);
          var curveCmd = [
            "C",
            startControl.x,
            startControl.y,
            endControl.x,
            endControl.y,
            curveEnd.x,
            curveEnd.y
          ];
          curveCmd.origPoint = curPoint;
          resultCommands.push(curveCmd);
        } else {
          resultCommands.push(curCmd);
        }
      }
      if (virtualCloseLine) {
        var newStartPoint = pointForCommand(
          resultCommands[resultCommands.length - 1]
        );
        resultCommands.push(["Z"]);
        adjustCommand(resultCommands[0], newStartPoint);
      }
    } else {
      resultCommands = commands;
    }
    return resultCommands.reduce(function(str, c) {
      return str + c.join(" ") + " ";
    }, "");
  }
  drawLine(x1, y1, x2, y2, lineColor = "#a8a8a8", dashArray = 0, strokeWidth = null, strokeLineCap = "butt") {
    let w = this.w;
    let line = w.globals.dom.Paper.line().attr({
      x1,
      y1,
      x2,
      y2,
      stroke: lineColor,
      "stroke-dasharray": dashArray,
      "stroke-width": strokeWidth,
      "stroke-linecap": strokeLineCap
    });
    return line;
  }
  drawRect(x1 = 0, y1 = 0, x2 = 0, y2 = 0, radius = 0, color = "#fefefe", opacity = 1, strokeWidth = null, strokeColor = null, strokeDashArray = 0) {
    let w = this.w;
    let rect = w.globals.dom.Paper.rect();
    rect.attr({
      x: x1,
      y: y1,
      width: x2 > 0 ? x2 : 0,
      height: y2 > 0 ? y2 : 0,
      rx: radius,
      ry: radius,
      opacity,
      "stroke-width": strokeWidth !== null ? strokeWidth : 0,
      stroke: strokeColor !== null ? strokeColor : "none",
      "stroke-dasharray": strokeDashArray
    });
    rect.node.setAttribute("fill", color);
    return rect;
  }
  drawPolygon(polygonString, stroke = "#e1e1e1", strokeWidth = 1, fill = "none") {
    const w = this.w;
    const polygon = w.globals.dom.Paper.polygon(polygonString).attr({
      fill,
      stroke,
      "stroke-width": strokeWidth
    });
    return polygon;
  }
  drawCircle(radius, attrs = null) {
    const w = this.w;
    if (radius < 0) radius = 0;
    const c = w.globals.dom.Paper.circle(radius * 2);
    if (attrs !== null) {
      c.attr(attrs);
    }
    return c;
  }
  drawPath({
    d = "",
    stroke = "#a8a8a8",
    strokeWidth = 1,
    fill,
    fillOpacity = 1,
    strokeOpacity = 1,
    classes,
    strokeLinecap = null,
    strokeDashArray = 0
  }) {
    let w = this.w;
    if (strokeLinecap === null) {
      strokeLinecap = w.config.stroke.lineCap;
    }
    if (d.indexOf("undefined") > -1 || d.indexOf("NaN") > -1) {
      d = `M 0 ${w.globals.gridHeight}`;
    }
    let p = w.globals.dom.Paper.path(d).attr({
      fill,
      "fill-opacity": fillOpacity,
      stroke,
      "stroke-opacity": strokeOpacity,
      "stroke-linecap": strokeLinecap,
      "stroke-width": strokeWidth,
      "stroke-dasharray": strokeDashArray,
      class: classes
    });
    return p;
  }
  group(attrs = null) {
    const w = this.w;
    const g = w.globals.dom.Paper.group();
    if (attrs !== null) {
      g.attr(attrs);
    }
    return g;
  }
  move(x, y) {
    let move = ["M", x, y].join(" ");
    return move;
  }
  line(x, y, hORv = null) {
    let line = null;
    if (hORv === null) {
      line = [" L", x, y].join(" ");
    } else if (hORv === "H") {
      line = [" H", x].join(" ");
    } else if (hORv === "V") {
      line = [" V", y].join(" ");
    }
    return line;
  }
  curve(x1, y1, x2, y2, x, y) {
    let curve = ["C", x1, y1, x2, y2, x, y].join(" ");
    return curve;
  }
  quadraticCurve(x1, y1, x, y) {
    let curve = ["Q", x1, y1, x, y].join(" ");
    return curve;
  }
  arc(rx, ry, axisRotation, largeArcFlag, sweepFlag, x, y, relative = false) {
    let coord = "A";
    if (relative) coord = "a";
    let arc = [coord, rx, ry, axisRotation, largeArcFlag, sweepFlag, x, y].join(
      " "
    );
    return arc;
  }
  /**
   * @memberof Graphics
   * @param {object}
   *  i = series's index
   *  realIndex = realIndex is series's actual index when it was drawn time. After several redraws, the iterating "i" may change in loops, but realIndex doesn't
   *  pathFrom = existing pathFrom to animateTo
   *  pathTo = new Path to which d attr will be animated from pathFrom to pathTo
   *  stroke = line Color
   *  strokeWidth = width of path Line
   *  fill = it can be gradient, single color, pattern or image
   *  animationDelay = how much to delay when starting animation (in milliseconds)
   *  dataChangeSpeed = for dynamic animations, when data changes
   *  className = class attribute to add
   * @return {object} svg.js path object
   **/
  renderPaths({
    j: j2,
    realIndex: realIndex2,
    pathFrom,
    pathTo,
    stroke,
    strokeWidth,
    strokeLinecap,
    fill,
    animationDelay,
    initialSpeed,
    dataChangeSpeed,
    className,
    chartType,
    shouldClipToGrid = true,
    bindEventsOnPaths = true,
    drawShadow = true
  }) {
    let w = this.w;
    const filters = new Filters(this.ctx);
    const anim = new Animations(this.ctx);
    let initialAnim = this.w.config.chart.animations.enabled;
    let dynamicAnim = initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    if (pathFrom && pathFrom.startsWith("M 0 0") && pathTo) {
      const moveCommand = pathTo.match(/^M\s+[\d.-]+\s+[\d.-]+/);
      if (moveCommand) {
        pathFrom = pathFrom.replace(/^M\s+0\s+0/, moveCommand[0]);
      }
    }
    let d;
    let shouldAnimate = !!(initialAnim && !w.globals.resized || dynamicAnim && w.globals.dataChanged && w.globals.shouldAnimate);
    if (shouldAnimate) {
      d = pathFrom;
    } else {
      d = pathTo;
      w.globals.animationEnded = true;
    }
    let strokeDashArrayOpt = w.config.stroke.dashArray;
    let strokeDashArray = 0;
    if (Array.isArray(strokeDashArrayOpt)) {
      strokeDashArray = strokeDashArrayOpt[realIndex2];
    } else {
      strokeDashArray = w.config.stroke.dashArray;
    }
    let el = this.drawPath({
      d,
      stroke,
      strokeWidth,
      fill,
      fillOpacity: 1,
      classes: className,
      strokeLinecap,
      strokeDashArray
    });
    el.attr("index", realIndex2);
    if (shouldClipToGrid) {
      if (chartType === "bar" && !w.globals.isHorizontal || w.globals.comboCharts) {
        el.attr({
          "clip-path": `url(#gridRectBarMask${w.globals.cuid})`
        });
      } else {
        el.attr({
          "clip-path": `url(#gridRectMask${w.globals.cuid})`
        });
      }
    }
    if (w.config.chart.dropShadow.enabled && drawShadow) {
      filters.dropShadow(el, w.config.chart.dropShadow, realIndex2);
    }
    if (bindEventsOnPaths) {
      el.node.addEventListener("mouseenter", this.pathMouseEnter.bind(this, el));
      el.node.addEventListener("mouseleave", this.pathMouseLeave.bind(this, el));
      el.node.addEventListener("mousedown", this.pathMouseDown.bind(this, el));
    }
    el.attr({
      pathTo,
      pathFrom
    });
    const defaultAnimateOpts = {
      el,
      j: j2,
      realIndex: realIndex2,
      pathFrom,
      pathTo,
      fill,
      strokeWidth,
      delay: animationDelay
    };
    if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
      anim.animatePathsGradually(__spreadProps(__spreadValues({}, defaultAnimateOpts), {
        speed: initialSpeed
      }));
    } else {
      if (w.globals.resized || !w.globals.dataChanged) {
        anim.showDelayedElements();
      }
    }
    if (w.globals.dataChanged && dynamicAnim && shouldAnimate) {
      anim.animatePathsGradually(__spreadProps(__spreadValues({}, defaultAnimateOpts), {
        speed: dataChangeSpeed
      }));
    }
    return el;
  }
  drawPattern(style, width, height, stroke = "#a8a8a8", strokeWidth = 0, opacity = 1) {
    let w = this.w;
    let p = w.globals.dom.Paper.pattern(width, height, (add) => {
      if (style === "horizontalLines") {
        add.line(0, 0, height, 0).stroke({ color: stroke, width: strokeWidth + 1 });
      } else if (style === "verticalLines") {
        add.line(0, 0, 0, width).stroke({ color: stroke, width: strokeWidth + 1 });
      } else if (style === "slantedLines") {
        add.line(0, 0, width, height).stroke({ color: stroke, width: strokeWidth });
      } else if (style === "squares") {
        add.rect(width, height).fill("none").stroke({ color: stroke, width: strokeWidth });
      } else if (style === "circles") {
        add.circle(width).fill("none").stroke({ color: stroke, width: strokeWidth });
      }
    });
    return p;
  }
  drawGradient(style, gfrom, gto, opacityFrom, opacityTo, size = null, stops = null, colorStops = [], i = 0) {
    let w = this.w;
    let g;
    if (gfrom.length < 9 && gfrom.indexOf("#") === 0) {
      gfrom = Utils$1.hexToRgba(gfrom, opacityFrom);
    }
    if (gto.length < 9 && gto.indexOf("#") === 0) {
      gto = Utils$1.hexToRgba(gto, opacityTo);
    }
    let stop1 = 0;
    let stop2 = 1;
    let stop3 = 1;
    let stop4 = null;
    if (stops !== null) {
      stop1 = typeof stops[0] !== "undefined" ? stops[0] / 100 : 0;
      stop2 = typeof stops[1] !== "undefined" ? stops[1] / 100 : 1;
      stop3 = typeof stops[2] !== "undefined" ? stops[2] / 100 : 1;
      stop4 = typeof stops[3] !== "undefined" ? stops[3] / 100 : null;
    }
    let radial = !!(w.config.chart.type === "donut" || w.config.chart.type === "pie" || w.config.chart.type === "polarArea" || w.config.chart.type === "bubble");
    if (!colorStops || colorStops.length === 0) {
      g = w.globals.dom.Paper.gradient(radial ? "radial" : "linear", (add) => {
        add.stop(stop1, gfrom, opacityFrom);
        add.stop(stop2, gto, opacityTo);
        add.stop(stop3, gto, opacityTo);
        if (stop4 !== null) {
          add.stop(stop4, gfrom, opacityFrom);
        }
      });
    } else {
      g = w.globals.dom.Paper.gradient(radial ? "radial" : "linear", (add) => {
        let gradientStops = Array.isArray(colorStops[i]) ? colorStops[i] : colorStops;
        gradientStops.forEach((s) => {
          add.stop(s.offset / 100, s.color, s.opacity);
        });
      });
    }
    if (!radial) {
      if (style === "vertical") {
        g.from(0, 0).to(0, 1);
      } else if (style === "diagonal") {
        g.from(0, 0).to(1, 1);
      } else if (style === "horizontal") {
        g.from(0, 1).to(1, 1);
      } else if (style === "diagonal2") {
        g.from(1, 0).to(0, 1);
      }
    } else {
      let offx = w.globals.gridWidth / 2;
      let offy = w.globals.gridHeight / 2;
      if (w.config.chart.type !== "bubble") {
        g.attr({
          gradientUnits: "userSpaceOnUse",
          cx: offx,
          cy: offy,
          r: size
        });
      } else {
        g.attr({
          cx: 0.5,
          cy: 0.5,
          r: 0.8,
          fx: 0.2,
          fy: 0.2
        });
      }
    }
    return g;
  }
  getTextBasedOnMaxWidth({ text, maxWidth, fontSize, fontFamily }) {
    const tRects = this.getTextRects(text, fontSize, fontFamily);
    const wordWidth = tRects.width / text.length;
    const wordsBasedOnWidth = Math.floor(maxWidth / wordWidth);
    if (maxWidth < tRects.width) {
      return text.slice(0, wordsBasedOnWidth - 3) + "...";
    }
    return text;
  }
  drawText({
    x,
    y,
    text,
    textAnchor,
    fontSize,
    fontFamily,
    fontWeight,
    foreColor,
    opacity,
    maxWidth,
    cssClass = "",
    isPlainText = true,
    dominantBaseline = "auto"
  }) {
    let w = this.w;
    if (typeof text === "undefined") text = "";
    let truncatedText = text;
    if (!textAnchor) {
      textAnchor = "start";
    }
    if (!foreColor || !foreColor.length) {
      foreColor = w.config.chart.foreColor;
    }
    fontFamily = fontFamily || w.config.chart.fontFamily;
    fontSize = fontSize || "11px";
    fontWeight = fontWeight || "regular";
    const commonProps = {
      maxWidth,
      fontSize,
      fontFamily
    };
    let elText;
    if (Array.isArray(text)) {
      elText = w.globals.dom.Paper.text((add) => {
        for (let i = 0; i < text.length; i++) {
          truncatedText = text[i];
          if (maxWidth) {
            truncatedText = this.getTextBasedOnMaxWidth(__spreadValues({
              text: text[i]
            }, commonProps));
          }
          i === 0 ? add.tspan(truncatedText) : add.tspan(truncatedText).newLine();
        }
      });
    } else {
      if (maxWidth) {
        truncatedText = this.getTextBasedOnMaxWidth(__spreadValues({
          text
        }, commonProps));
      }
      elText = isPlainText ? w.globals.dom.Paper.plain(text) : w.globals.dom.Paper.text((add) => add.tspan(truncatedText));
    }
    elText.attr({
      x,
      y,
      "text-anchor": textAnchor,
      "dominant-baseline": dominantBaseline,
      "font-size": fontSize,
      "font-family": fontFamily,
      "font-weight": fontWeight,
      fill: foreColor,
      class: "apexcharts-text " + cssClass
    });
    elText.node.style.fontFamily = fontFamily;
    elText.node.style.opacity = opacity;
    return elText;
  }
  getMarkerPath(x, y, type, size) {
    let d = "";
    switch (type) {
      case "cross":
        size = size / 1.4;
        d = `M ${x - size} ${y - size} L ${x + size} ${y + size}  M ${x - size} ${y + size} L ${x + size} ${y - size}`;
        break;
      case "plus":
        size = size / 1.12;
        d = `M ${x - size} ${y} L ${x + size} ${y}  M ${x} ${y - size} L ${x} ${y + size}`;
        break;
      case "star":
      case "sparkle":
        let points = 5;
        size = size * 1.15;
        if (type === "sparkle") {
          size = size / 1.1;
          points = 4;
        }
        const step = Math.PI / points;
        for (let i = 0; i <= 2 * points; i++) {
          const angle = i * step;
          const radius = i % 2 === 0 ? size : size / 2;
          const xPos = x + radius * Math.sin(angle);
          const yPos = y - radius * Math.cos(angle);
          d += (i === 0 ? "M" : "L") + xPos + "," + yPos;
        }
        d += "Z";
        break;
      case "triangle":
        d = `M ${x} ${y - size} 
             L ${x + size} ${y + size} 
             L ${x - size} ${y + size} 
             Z`;
        break;
      case "square":
      case "rect":
        size = size / 1.125;
        d = `M ${x - size} ${y - size} 
           L ${x + size} ${y - size} 
           L ${x + size} ${y + size} 
           L ${x - size} ${y + size} 
           Z`;
        break;
      case "diamond":
        size = size * 1.05;
        d = `M ${x} ${y - size} 
             L ${x + size} ${y} 
             L ${x} ${y + size} 
             L ${x - size} ${y} 
            Z`;
        break;
      case "line":
        size = size / 1.1;
        d = `M ${x - size} ${y} 
           L ${x + size} ${y}`;
        break;
      case "circle":
      default:
        size = size * 2;
        d = `M ${x}, ${y} 
           m -${size / 2}, 0 
           a ${size / 2},${size / 2} 0 1,0 ${size},0 
           a ${size / 2},${size / 2} 0 1,0 -${size},0`;
        break;
    }
    return d;
  }
  /**
   * @param {number} x - The x-coordinate of the marker
   * @param {number} y - The y-coordinate of the marker.
   * @param {number} size - The size of the marker
   * @param {Object} opts - The options for the marker.
   * @returns {Object} The created marker.
   */
  drawMarkerShape(x, y, type, size, opts) {
    const path = this.drawPath({
      d: this.getMarkerPath(x, y, type, size, opts),
      stroke: opts.pointStrokeColor,
      strokeDashArray: opts.pointStrokeDashArray,
      strokeWidth: opts.pointStrokeWidth,
      fill: opts.pointFillColor,
      fillOpacity: opts.pointFillOpacity,
      strokeOpacity: opts.pointStrokeOpacity
    });
    path.attr({
      cx: x,
      cy: y,
      shape: opts.shape,
      class: opts.class ? opts.class : ""
    });
    return path;
  }
  drawMarker(x, y, opts) {
    x = x || 0;
    let size = opts.pSize || 0;
    if (!Utils$1.isNumber(y)) {
      size = 0;
      y = 0;
    }
    return this.drawMarkerShape(x, y, opts == null ? void 0 : opts.shape, size, __spreadValues(__spreadValues({}, opts), opts.shape === "line" || opts.shape === "plus" || opts.shape === "cross" ? {
      pointStrokeColor: opts.pointFillColor,
      pointStrokeOpacity: opts.pointFillOpacity
    } : {}));
  }
  pathMouseEnter(path, e) {
    let w = this.w;
    const filters = new Filters(this.ctx);
    const i = parseInt(path.node.getAttribute("index"), 10);
    const j2 = parseInt(path.node.getAttribute("j"), 10);
    if (typeof w.config.chart.events.dataPointMouseEnter === "function") {
      w.config.chart.events.dataPointMouseEnter(e, this.ctx, {
        seriesIndex: i,
        dataPointIndex: j2,
        w
      });
    }
    this.ctx.events.fireEvent("dataPointMouseEnter", [
      e,
      this.ctx,
      { seriesIndex: i, dataPointIndex: j2, w }
    ]);
    if (w.config.states.active.filter.type !== "none") {
      if (path.node.getAttribute("selected") === "true") {
        return;
      }
    }
    if (w.config.states.hover.filter.type !== "none") {
      if (!w.globals.isTouchDevice) {
        let hoverFilter = w.config.states.hover.filter;
        filters.applyFilter(path, i, hoverFilter.type);
      }
    }
  }
  pathMouseLeave(path, e) {
    let w = this.w;
    const filters = new Filters(this.ctx);
    const i = parseInt(path.node.getAttribute("index"), 10);
    const j2 = parseInt(path.node.getAttribute("j"), 10);
    if (typeof w.config.chart.events.dataPointMouseLeave === "function") {
      w.config.chart.events.dataPointMouseLeave(e, this.ctx, {
        seriesIndex: i,
        dataPointIndex: j2,
        w
      });
    }
    this.ctx.events.fireEvent("dataPointMouseLeave", [
      e,
      this.ctx,
      { seriesIndex: i, dataPointIndex: j2, w }
    ]);
    if (w.config.states.active.filter.type !== "none") {
      if (path.node.getAttribute("selected") === "true") {
        return;
      }
    }
    if (w.config.states.hover.filter.type !== "none") {
      filters.getDefaultFilter(path, i);
    }
  }
  pathMouseDown(path, e) {
    let w = this.w;
    const filters = new Filters(this.ctx);
    const i = parseInt(path.node.getAttribute("index"), 10);
    const j2 = parseInt(path.node.getAttribute("j"), 10);
    let selected = "false";
    if (path.node.getAttribute("selected") === "true") {
      path.node.setAttribute("selected", "false");
      if (w.globals.selectedDataPoints[i].indexOf(j2) > -1) {
        let index = w.globals.selectedDataPoints[i].indexOf(j2);
        w.globals.selectedDataPoints[i].splice(index, 1);
      }
    } else {
      if (!w.config.states.active.allowMultipleDataPointsSelection && w.globals.selectedDataPoints.length > 0) {
        w.globals.selectedDataPoints = [];
        const elPaths = w.globals.dom.Paper.find(
          ".apexcharts-series path:not(.apexcharts-decoration-element)"
        );
        const elCircles = w.globals.dom.Paper.find(
          ".apexcharts-series circle:not(.apexcharts-decoration-element), .apexcharts-series rect:not(.apexcharts-decoration-element)"
        );
        const deSelect = (els) => {
          Array.prototype.forEach.call(els, (el) => {
            el.node.setAttribute("selected", "false");
            filters.getDefaultFilter(el, i);
          });
        };
        deSelect(elPaths);
        deSelect(elCircles);
      }
      path.node.setAttribute("selected", "true");
      selected = "true";
      if (typeof w.globals.selectedDataPoints[i] === "undefined") {
        w.globals.selectedDataPoints[i] = [];
      }
      w.globals.selectedDataPoints[i].push(j2);
    }
    if (selected === "true") {
      let activeFilter = w.config.states.active.filter;
      if (activeFilter !== "none") {
        filters.applyFilter(path, i, activeFilter.type);
      } else {
        if (w.config.states.hover.filter !== "none") {
          if (!w.globals.isTouchDevice) {
            var hoverFilter = w.config.states.hover.filter;
            filters.applyFilter(path, i, hoverFilter.type);
          }
        }
      }
    } else {
      if (w.config.states.active.filter.type !== "none") {
        if (w.config.states.hover.filter.type !== "none" && !w.globals.isTouchDevice) {
          var hoverFilter = w.config.states.hover.filter;
          filters.applyFilter(path, i, hoverFilter.type);
        } else {
          filters.getDefaultFilter(path, i);
        }
      }
    }
    if (typeof w.config.chart.events.dataPointSelection === "function") {
      w.config.chart.events.dataPointSelection(e, this.ctx, {
        selectedDataPoints: w.globals.selectedDataPoints,
        seriesIndex: i,
        dataPointIndex: j2,
        w
      });
    }
    if (e) {
      this.ctx.events.fireEvent("dataPointSelection", [
        e,
        this.ctx,
        {
          selectedDataPoints: w.globals.selectedDataPoints,
          seriesIndex: i,
          dataPointIndex: j2,
          w
        }
      ]);
    }
  }
  rotateAroundCenter(el) {
    let coord = {};
    if (el && typeof el.getBBox === "function") {
      coord = el.getBBox();
    }
    let x = coord.x + coord.width / 2;
    let y = coord.y + coord.height / 2;
    return {
      x,
      y
    };
  }
  /**
   * Sets up event delegation on a parent group element.
   * Uses mouseover/mouseout (which bubble) to simulate mouseenter/mouseleave
   * on matching child elements, reducing per-element listener overhead.
   */
  setupEventDelegation(parentGroup, targetSelector) {
    let currentHovered = null;
    parentGroup.node.addEventListener("mouseover", (e) => {
      const targetNode = Graphics._findDelegateTarget(
        e.target,
        parentGroup.node,
        targetSelector
      );
      if (!targetNode || targetNode === currentHovered) return;
      if (currentHovered && currentHovered.instance) {
        this.pathMouseLeave(currentHovered.instance, e);
      }
      currentHovered = targetNode;
      if (targetNode.instance) {
        this.pathMouseEnter(targetNode.instance, e);
      }
    });
    parentGroup.node.addEventListener("mouseout", (e) => {
      if (!currentHovered) return;
      const relatedNode = e.relatedTarget ? Graphics._findDelegateTarget(
        e.relatedTarget,
        parentGroup.node,
        targetSelector
      ) : null;
      if (relatedNode !== currentHovered) {
        if (currentHovered && currentHovered.instance) {
          this.pathMouseLeave(currentHovered.instance, e);
        }
        currentHovered = null;
      }
    });
    parentGroup.node.addEventListener("mousedown", (e) => {
      const targetNode = Graphics._findDelegateTarget(
        e.target,
        parentGroup.node,
        targetSelector
      );
      if (targetNode && targetNode.instance) {
        this.pathMouseDown(targetNode.instance, e);
      }
    });
  }
  static _findDelegateTarget(node, boundary, selector) {
    while (node && node !== boundary && node !== document) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }
  static setAttrs(el, attrs) {
    for (let key in attrs) {
      if (attrs.hasOwnProperty(key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
  }
  getTextRects(text, fontSize, fontFamily, transform, useBBox = true) {
    let w = this.w;
    const cacheKey = `${text}|${fontSize}|${fontFamily}|${transform}|${useBBox}`;
    const cache = w.globals.textRectsCache;
    if (cache && cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    let virtualText = this.drawText({
      x: -200,
      y: -200,
      text,
      textAnchor: "start",
      fontSize,
      fontFamily,
      foreColor: "#fff",
      opacity: 0
    });
    if (transform) {
      virtualText.attr("transform", transform);
    }
    w.globals.dom.Paper.add(virtualText);
    let rect = virtualText.bbox();
    if (!useBBox) {
      rect = virtualText.node.getBoundingClientRect();
    }
    virtualText.remove();
    const result = {
      width: rect.width,
      height: rect.height
    };
    if (cache) {
      cache.set(cacheKey, result);
    }
    return result;
  }
  /**
   * append ... to long text
   * http://stackoverflow.com/questions/9241315/trimming-text-to-a-given-pixel-width-in-svg
   * @memberof Graphics
   **/
  placeTextWithEllipsis(textObj, textString, width) {
    if (typeof textObj.getComputedTextLength !== "function") return;
    textObj.textContent = textString;
    if (textString.length > 0) {
      if (textObj.getComputedTextLength() >= width / 1.1) {
        for (let x = textString.length - 3; x > 0; x -= 3) {
          if (textObj.getSubStringLength(0, x) <= width / 1.1) {
            textObj.textContent = textString.substring(0, x) + "...";
            return;
          }
        }
        textObj.textContent = ".";
      }
    }
  }
}
class CoreUtils {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  static checkComboSeries(series, chartType) {
    let comboCharts = false;
    let comboBarCount = 0;
    let comboCount = 0;
    if (chartType === void 0) {
      chartType = "line";
    }
    if (series.length && typeof series[0].type !== "undefined") {
      series.forEach((s) => {
        if (s.type === "bar" || s.type === "column" || s.type === "candlestick" || s.type === "boxPlot") {
          comboBarCount++;
        }
        if (typeof s.type !== "undefined" && s.type !== chartType) {
          comboCount++;
        }
      });
    }
    if (comboCount > 0) {
      comboCharts = true;
    }
    return {
      comboBarCount,
      comboCharts
    };
  }
  /**
   * @memberof CoreUtils
   * returns the sum of all individual values in a multiple stacked series
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1]]
   *  @return [34,36,48,13]
   **/
  getStackedSeriesTotals(excludedSeriesIndices = []) {
    const w = this.w;
    let total = [];
    if (w.globals.series.length === 0) return total;
    for (let i = 0; i < w.globals.series[w.globals.maxValsInArrayIndex].length; i++) {
      let t = 0;
      for (let j2 = 0; j2 < w.globals.series.length; j2++) {
        if (typeof w.globals.series[j2][i] !== "undefined" && excludedSeriesIndices.indexOf(j2) === -1) {
          t += w.globals.series[j2][i];
        }
      }
      total.push(t);
    }
    return total;
  }
  // get total of the all values inside all series
  getSeriesTotalByIndex(index = null) {
    if (index === null) {
      return this.w.config.series.reduce((acc, cur) => acc + cur, 0);
    } else {
      return this.w.globals.series[index].reduce((acc, cur) => acc + cur, 0);
    }
  }
  /**
   * @memberof CoreUtils
   * returns the sum of values in a multiple stacked grouped charts
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1], [43, 23, 34, 22]]
   * series 1 and 2 are in a group, while series 3 is in another group
   *  @return [[34, 36, 48, 12], [43, 23, 34, 22]]
   **/
  getStackedSeriesTotalsByGroups() {
    const w = this.w;
    let total = [];
    w.globals.seriesGroups.forEach((sg) => {
      let includedIndexes = [];
      w.config.series.forEach((s, si) => {
        if (sg.indexOf(w.globals.seriesNames[si]) > -1) {
          includedIndexes.push(si);
        }
      });
      const excludedIndices = w.globals.series.map((_, fi) => includedIndexes.indexOf(fi) === -1 ? fi : -1).filter((f) => f !== -1);
      total.push(this.getStackedSeriesTotals(excludedIndices));
    });
    return total;
  }
  setSeriesYAxisMappings() {
    const gl = this.w.globals;
    const cnf = this.w.config;
    let axisSeriesMap = [];
    let seriesYAxisReverseMap = [];
    let unassignedSeriesIndices = [];
    let seriesNameArrayStyle = gl.series.length > cnf.yaxis.length || cnf.yaxis.some((a) => Array.isArray(a.seriesName));
    cnf.series.forEach((s, i) => {
      unassignedSeriesIndices.push(i);
      seriesYAxisReverseMap.push(null);
    });
    cnf.yaxis.forEach((yaxe, yi) => {
      axisSeriesMap[yi] = [];
    });
    let unassignedYAxisIndices = [];
    cnf.yaxis.forEach((yaxe, yi) => {
      let assigned = false;
      if (yaxe.seriesName) {
        let seriesNames = [];
        if (Array.isArray(yaxe.seriesName)) {
          seriesNames = yaxe.seriesName;
        } else {
          seriesNames.push(yaxe.seriesName);
        }
        seriesNames.forEach((name2) => {
          cnf.series.forEach((s, si) => {
            if (s.name === name2) {
              let remove = si;
              if (yi === si || seriesNameArrayStyle) {
                if (!seriesNameArrayStyle || unassignedSeriesIndices.indexOf(si) > -1) {
                  axisSeriesMap[yi].push([yi, si]);
                } else {
                  console.warn(
                    "Series '" + s.name + "' referenced more than once in what looks like the new style. That is, when using either seriesName: [], or when there are more series than yaxes."
                  );
                }
              } else {
                axisSeriesMap[si].push([si, yi]);
                remove = yi;
              }
              assigned = true;
              remove = unassignedSeriesIndices.indexOf(remove);
              if (remove !== -1) {
                unassignedSeriesIndices.splice(remove, 1);
              }
            }
          });
        });
      }
      if (!assigned) {
        unassignedYAxisIndices.push(yi);
      }
    });
    axisSeriesMap = axisSeriesMap.map((yaxe, yi) => {
      let ra = [];
      yaxe.forEach((sa) => {
        seriesYAxisReverseMap[sa[1]] = sa[0];
        ra.push(sa[1]);
      });
      return ra;
    });
    let lastUnassignedYAxis = cnf.yaxis.length - 1;
    for (let i = 0; i < unassignedYAxisIndices.length; i++) {
      lastUnassignedYAxis = unassignedYAxisIndices[i];
      axisSeriesMap[lastUnassignedYAxis] = [];
      if (unassignedSeriesIndices) {
        let si = unassignedSeriesIndices[0];
        unassignedSeriesIndices.shift();
        axisSeriesMap[lastUnassignedYAxis].push(si);
        seriesYAxisReverseMap[si] = lastUnassignedYAxis;
      } else {
        break;
      }
    }
    unassignedSeriesIndices.forEach((i) => {
      axisSeriesMap[lastUnassignedYAxis].push(i);
      seriesYAxisReverseMap[i] = lastUnassignedYAxis;
    });
    gl.seriesYAxisMap = axisSeriesMap.map((x) => x);
    gl.seriesYAxisReverseMap = seriesYAxisReverseMap.map((x) => x);
    gl.seriesYAxisMap.forEach((axisSeries, ai) => {
      axisSeries.forEach((si) => {
        if (cnf.series[si] && cnf.series[si].group === void 0) {
          cnf.series[si].group = "apexcharts-axis-".concat(ai.toString());
        }
      });
    });
  }
  isSeriesNull(index = null) {
    let r = [];
    if (index === null) {
      r = this.w.config.series.filter((d) => d !== null);
    } else {
      r = this.w.config.series[index].data.filter((d) => d !== null);
    }
    return r.length === 0;
  }
  seriesHaveSameValues(index) {
    return this.w.globals.series[index].every((val, i, arr) => val === arr[0]);
  }
  getCategoryLabels(labels) {
    const w = this.w;
    let catLabels = labels.slice();
    if (w.config.xaxis.convertedCatToNumeric) {
      catLabels = labels.map((i, li) => {
        return w.config.xaxis.labels.formatter(i - w.globals.minX + 1);
      });
    }
    return catLabels;
  }
  // maxValsInArrayIndex is the index of series[] which has the largest number of items
  getLargestSeries() {
    const w = this.w;
    w.globals.maxValsInArrayIndex = w.globals.series.map((a) => a.length).indexOf(
      Math.max.apply(
        Math,
        w.globals.series.map((a) => a.length)
      )
    );
  }
  getLargestMarkerSize() {
    const w = this.w;
    let size = 0;
    w.globals.markers.size.forEach((m) => {
      size = Math.max(size, m);
    });
    if (w.config.markers.discrete && w.config.markers.discrete.length) {
      w.config.markers.discrete.forEach((m) => {
        size = Math.max(size, m.size);
      });
    }
    if (size > 0) {
      if (w.config.markers.hover.size > 0) {
        size = w.config.markers.hover.size;
      } else {
        size += w.config.markers.hover.sizeOffset;
      }
    }
    w.globals.markers.largestSize = size;
    return size;
  }
  /**
   * @memberof Core
   * returns the sum of all values in a series
   * Eg. w.globals.series = [[32,33,43,12], [2,3,5,1]]
   *  @return [120, 11]
   **/
  getSeriesTotals() {
    const w = this.w;
    w.globals.seriesTotals = w.globals.series.map((ser, index) => {
      let total = 0;
      if (Array.isArray(ser)) {
        for (let j2 = 0; j2 < ser.length; j2++) {
          total += ser[j2];
        }
      } else {
        total += ser;
      }
      return total;
    });
  }
  getSeriesTotalsXRange(minX, maxX) {
    const w = this.w;
    const seriesTotalsXRange = w.globals.series.map((ser, index) => {
      let total = 0;
      for (let j2 = 0; j2 < ser.length; j2++) {
        if (w.globals.seriesX[index][j2] > minX && w.globals.seriesX[index][j2] < maxX) {
          total += ser[j2];
        }
      }
      return total;
    });
    return seriesTotalsXRange;
  }
  /**
   * @memberof CoreUtils
   * returns the percentage value of all individual values which can be used in a 100% stacked series
   * Eg. w.globals.series = [[32, 33, 43, 12], [2, 3, 5, 1]]
   *  @return [[94.11, 91.66, 89.58, 92.30], [5.88, 8.33, 10.41, 7.7]]
   **/
  getPercentSeries() {
    const w = this.w;
    w.globals.seriesPercent = w.globals.series.map((ser, index) => {
      let seriesPercent = [];
      if (Array.isArray(ser)) {
        for (let j2 = 0; j2 < ser.length; j2++) {
          let total = w.globals.stackedSeriesTotals[j2];
          let percent = 0;
          if (total) {
            percent = 100 * ser[j2] / total;
          }
          seriesPercent.push(percent);
        }
      } else {
        const total = w.globals.seriesTotals.reduce((acc, val) => acc + val, 0);
        let percent = 100 * ser / total;
        seriesPercent.push(percent);
      }
      return seriesPercent;
    });
  }
  getCalculatedRatios() {
    let w = this.w;
    let gl = w.globals;
    let yRatio = [];
    let invertedYRatio = 0;
    let xRatio = 0;
    let invertedXRatio = 0;
    let zRatio = 0;
    let baseLineY = [];
    let baseLineInvertedY = 0.1;
    let baseLineX = 0;
    gl.yRange = [];
    if (gl.isMultipleYAxis) {
      for (let i = 0; i < gl.minYArr.length; i++) {
        gl.yRange.push(Math.abs(gl.minYArr[i] - gl.maxYArr[i]));
        baseLineY.push(0);
      }
    } else {
      gl.yRange.push(Math.abs(gl.minY - gl.maxY));
    }
    gl.xRange = Math.abs(gl.maxX - gl.minX);
    gl.zRange = Math.abs(gl.maxZ - gl.minZ);
    for (let i = 0; i < gl.yRange.length; i++) {
      yRatio.push(gl.yRange[i] / gl.gridHeight);
    }
    xRatio = gl.xRange / gl.gridWidth;
    invertedYRatio = gl.yRange / gl.gridWidth;
    invertedXRatio = gl.xRange / gl.gridHeight;
    zRatio = gl.zRange / gl.gridHeight * 16;
    if (!zRatio) {
      zRatio = 1;
    }
    if (gl.minY !== Number.MIN_VALUE && Math.abs(gl.minY) !== 0) {
      gl.hasNegs = true;
    }
    if (w.globals.seriesYAxisReverseMap.length > 0) {
      let scaleBaseLineYScale = (y, i) => {
        let yAxis = w.config.yaxis[w.globals.seriesYAxisReverseMap[i]];
        let sign = y < 0 ? -1 : 1;
        y = Math.abs(y);
        if (yAxis.logarithmic) {
          y = this.getBaseLog(yAxis.logBase, y);
        }
        return -sign * y / yRatio[i];
      };
      if (gl.isMultipleYAxis) {
        baseLineY = [];
        for (let i = 0; i < yRatio.length; i++) {
          baseLineY.push(scaleBaseLineYScale(gl.minYArr[i], i));
        }
      } else {
        baseLineY = [];
        baseLineY.push(scaleBaseLineYScale(gl.minY, 0));
        if (gl.minY !== Number.MIN_VALUE && Math.abs(gl.minY) !== 0) {
          baseLineInvertedY = -gl.minY / invertedYRatio;
          baseLineX = gl.minX / xRatio;
        }
      }
    } else {
      baseLineY = [];
      baseLineY.push(0);
      baseLineInvertedY = 0;
      baseLineX = 0;
    }
    return {
      yRatio,
      invertedYRatio,
      zRatio,
      xRatio,
      invertedXRatio,
      baseLineInvertedY,
      baseLineY,
      baseLineX
    };
  }
  getLogSeries(series) {
    const w = this.w;
    w.globals.seriesLog = series.map((s, i) => {
      let yAxisIndex = w.globals.seriesYAxisReverseMap[i];
      if (w.config.yaxis[yAxisIndex] && w.config.yaxis[yAxisIndex].logarithmic) {
        return s.map((d) => {
          if (d === null) return null;
          return this.getLogVal(w.config.yaxis[yAxisIndex].logBase, d, i);
        });
      } else {
        return s;
      }
    });
    return w.globals.invalidLogScale ? series : w.globals.seriesLog;
  }
  getLogValAtSeriesIndex(val, seriesIndex) {
    if (val === null) return null;
    const w = this.w;
    let yAxisIndex = w.globals.seriesYAxisReverseMap[seriesIndex];
    if (w.config.yaxis[yAxisIndex] && w.config.yaxis[yAxisIndex].logarithmic) {
      return this.getLogVal(
        w.config.yaxis[yAxisIndex].logBase,
        val,
        seriesIndex
      );
    }
    return val;
  }
  getBaseLog(base, value) {
    return Math.log(value) / Math.log(base);
  }
  getLogVal(b, d, seriesIndex) {
    if (d <= 0) {
      return 0;
    }
    const w = this.w;
    const min_log_val = w.globals.minYArr[seriesIndex] === 0 ? -1 : this.getBaseLog(b, w.globals.minYArr[seriesIndex]);
    const max_log_val = w.globals.maxYArr[seriesIndex] === 0 ? 0 : this.getBaseLog(b, w.globals.maxYArr[seriesIndex]);
    const number_of_height_levels = max_log_val - min_log_val;
    if (d < 1) return d / number_of_height_levels;
    const log_height_value = this.getBaseLog(b, d) - min_log_val;
    return log_height_value / number_of_height_levels;
  }
  getLogYRatios(yRatio) {
    const w = this.w;
    const gl = this.w.globals;
    gl.yLogRatio = yRatio.slice();
    gl.logYRange = gl.yRange.map((_, i) => {
      let yAxisIndex = w.globals.seriesYAxisReverseMap[i];
      if (w.config.yaxis[yAxisIndex] && this.w.config.yaxis[yAxisIndex].logarithmic) {
        let maxY = -Number.MAX_VALUE;
        let minY = Number.MIN_VALUE;
        let range = 1;
        gl.seriesLog.forEach((s, si) => {
          s.forEach((v) => {
            if (w.config.yaxis[si] && w.config.yaxis[si].logarithmic) {
              maxY = Math.max(v, maxY);
              minY = Math.min(v, minY);
            }
          });
        });
        range = Math.pow(gl.yRange[i], Math.abs(minY - maxY) / gl.yRange[i]);
        gl.yLogRatio[i] = range / gl.gridHeight;
        return range;
      }
    });
    return gl.invalidLogScale ? yRatio.slice() : gl.yLogRatio;
  }
  // Some config objects can be array - and we need to extend them correctly
  static extendArrayProps(configInstance, options2, w) {
    var _a, _b;
    if (options2 == null ? void 0 : options2.yaxis) {
      options2 = configInstance.extendYAxis(options2, w);
    }
    if (options2 == null ? void 0 : options2.annotations) {
      if (options2.annotations.yaxis) {
        options2 = configInstance.extendYAxisAnnotations(options2);
      }
      if ((_a = options2 == null ? void 0 : options2.annotations) == null ? void 0 : _a.xaxis) {
        options2 = configInstance.extendXAxisAnnotations(options2);
      }
      if ((_b = options2 == null ? void 0 : options2.annotations) == null ? void 0 : _b.points) {
        options2 = configInstance.extendPointAnnotations(options2);
      }
    }
    return options2;
  }
  // Series of the same group and type can be stacked together distinct from
  // other series of the same type on the same axis.
  drawSeriesByGroup(typeSeries, typeGroups, type, chartClass) {
    let w = this.w;
    let graph = [];
    if (typeSeries.series.length > 0) {
      typeGroups.forEach((gn) => {
        let gs = [];
        let gi = [];
        typeSeries.i.forEach((i, ii) => {
          if (w.config.series[i].group === gn) {
            gs.push(typeSeries.series[ii]);
            gi.push(i);
          }
        });
        gs.length > 0 && graph.push(chartClass.draw(gs, type, gi));
      });
    }
    return graph;
  }
}
let Helpers$4 = class Helpers {
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
  }
  setOrientations(anno, annoIndex = null) {
    const w = this.w;
    if (anno.label.orientation === "vertical") {
      const i = annoIndex !== null ? annoIndex : 0;
      const xAnno = w.globals.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`
      );
      if (xAnno !== null) {
        const xAnnoCoord = xAnno.getBBox();
        xAnno.setAttribute(
          "x",
          parseFloat(xAnno.getAttribute("x")) - xAnnoCoord.height + 4
        );
        const yOffset = anno.label.position === "top" ? xAnnoCoord.width : -xAnnoCoord.width;
        xAnno.setAttribute("y", parseFloat(xAnno.getAttribute("y")) + yOffset);
        const { x, y } = this.annoCtx.graphics.rotateAroundCenter(xAnno);
        xAnno.setAttribute("transform", `rotate(-90 ${x} ${y})`);
      }
    }
  }
  addBackgroundToAnno(annoEl, anno) {
    const w = this.w;
    if (!annoEl || !anno.label.text || !String(anno.label.text).trim()) {
      return null;
    }
    const gridEl = w.globals.dom.baseEl.querySelector(".apexcharts-grid");
    const elGridRect = gridEl.getBoundingClientRect();
    const gridBBox = gridEl.getBBox();
    const zoom = elGridRect.width / gridBBox.width || 1;
    const coords = annoEl.getBoundingClientRect();
    let {
      left: pleft,
      right: pright,
      top: ptop,
      bottom: pbottom
    } = anno.label.style.padding;
    if (anno.label.orientation === "vertical") {
      [ptop, pbottom, pleft, pright] = [pleft, pright, ptop, pbottom];
    }
    const x1 = (coords.left - elGridRect.left) / zoom - pleft;
    const y1 = (coords.top - elGridRect.top) / zoom - ptop;
    const elRect = this.annoCtx.graphics.drawRect(
      x1 - w.globals.barPadForNumericAxis,
      y1,
      coords.width / zoom + pleft + pright,
      coords.height / zoom + ptop + pbottom,
      anno.label.borderRadius,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0
    );
    if (anno.id) {
      elRect.node.classList.add(anno.id);
    }
    return elRect;
  }
  annotationsBackground() {
    const w = this.w;
    const add = (anno, i, type) => {
      const annoLabel = w.globals.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`
      );
      if (annoLabel) {
        const parent = annoLabel.parentNode;
        const elRect = this.addBackgroundToAnno(annoLabel, anno);
        if (elRect) {
          parent.insertBefore(elRect.node, annoLabel);
          if (anno.label.mouseEnter) {
            elRect.node.addEventListener(
              "mouseenter",
              anno.label.mouseEnter.bind(this, anno)
            );
          }
          if (anno.label.mouseLeave) {
            elRect.node.addEventListener(
              "mouseleave",
              anno.label.mouseLeave.bind(this, anno)
            );
          }
          if (anno.label.click) {
            elRect.node.addEventListener(
              "click",
              anno.label.click.bind(this, anno)
            );
          }
        }
      }
    };
    w.config.annotations.xaxis.forEach((anno, i) => add(anno, i, "xaxis"));
    w.config.annotations.yaxis.forEach((anno, i) => add(anno, i, "yaxis"));
    w.config.annotations.points.forEach((anno, i) => add(anno, i, "point"));
  }
  getY1Y2(type, anno) {
    var _a;
    const w = this.w;
    let y = type === "y1" ? anno.y : anno.y2;
    let yP;
    let clipped = false;
    if (this.annoCtx.invertAxis) {
      const labels = w.config.xaxis.convertedCatToNumeric ? w.globals.categoryLabels : w.globals.labels;
      const catIndex = labels.indexOf(y);
      const xLabel = w.globals.dom.baseEl.querySelector(
        `.apexcharts-yaxis-texts-g text:nth-child(${catIndex + 1})`
      );
      yP = xLabel ? parseFloat(xLabel.getAttribute("y")) : (w.globals.gridHeight / labels.length - 1) * (catIndex + 1) - w.globals.barHeight;
      if (anno.seriesIndex !== void 0 && w.globals.barHeight) {
        yP -= w.globals.barHeight / 2 * (w.globals.series.length - 1) - w.globals.barHeight * anno.seriesIndex;
      }
    } else {
      const seriesIndex = w.globals.seriesYAxisMap[anno.yAxisIndex][0];
      const yPos = w.config.yaxis[anno.yAxisIndex].logarithmic ? new CoreUtils(this.annoCtx.ctx).getLogVal(
        w.config.yaxis[anno.yAxisIndex].logBase,
        y,
        seriesIndex
      ) / w.globals.yLogRatio[seriesIndex] : (y - w.globals.minYArr[seriesIndex]) / (w.globals.yRange[seriesIndex] / w.globals.gridHeight);
      yP = w.globals.gridHeight - Math.min(Math.max(yPos, 0), w.globals.gridHeight);
      clipped = yPos > w.globals.gridHeight || yPos < 0;
      if (anno.marker && (anno.y === void 0 || anno.y === null)) {
        yP = 0;
      }
      if ((_a = w.config.yaxis[anno.yAxisIndex]) == null ? void 0 : _a.reversed) {
        yP = yPos;
      }
    }
    if (typeof y === "string" && y.includes("px")) {
      yP = parseFloat(y);
    }
    return { yP, clipped };
  }
  getX1X2(type, anno) {
    const w = this.w;
    const x = type === "x1" ? anno.x : anno.x2;
    const min = this.annoCtx.invertAxis ? w.globals.minY : w.globals.minX;
    const max = this.annoCtx.invertAxis ? w.globals.maxY : w.globals.maxX;
    const range = this.annoCtx.invertAxis ? w.globals.yRange[0] : w.globals.xRange;
    let clipped = false;
    let xP = this.annoCtx.inversedReversedAxis ? (max - x) / (range / w.globals.gridWidth) : (x - min) / (range / w.globals.gridWidth);
    if ((w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !this.annoCtx.invertAxis && !w.globals.dataFormatXNumeric) {
      if (!w.config.chart.sparkline.enabled) {
        xP = this.getStringX(x);
      }
    }
    if (typeof x === "string" && x.includes("px")) {
      xP = parseFloat(x);
    }
    if ((x === void 0 || x === null) && anno.marker) {
      xP = w.globals.gridWidth;
    }
    if (anno.seriesIndex !== void 0 && w.globals.barWidth && !this.annoCtx.invertAxis) {
      xP -= w.globals.barWidth / 2 * (w.globals.series.length - 1) - w.globals.barWidth * anno.seriesIndex;
    }
    if (typeof xP !== "number") {
      xP = 0;
      clipped = true;
    }
    if (parseFloat(xP.toFixed(10)) > parseFloat(w.globals.gridWidth.toFixed(10))) {
      xP = w.globals.gridWidth;
      clipped = true;
    } else if (xP < 0) {
      xP = 0;
      clipped = true;
    }
    return { x: xP, clipped };
  }
  getStringX(x) {
    const w = this.w;
    let rX = x;
    if (w.config.xaxis.convertedCatToNumeric && w.globals.categoryLabels.length) {
      x = w.globals.categoryLabels.indexOf(x) + 1;
    }
    const catIndex = w.globals.labels.map((item) => Array.isArray(item) ? item.join(" ") : item).indexOf(x);
    const xLabel = w.globals.dom.baseEl.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${catIndex + 1})`
    );
    if (xLabel) {
      rX = parseFloat(xLabel.getAttribute("x"));
    }
    return rX;
  }
};
class XAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.invertAxis = this.annoCtx.invertAxis;
    this.helpers = new Helpers$4(this.annoCtx);
  }
  addXaxisAnnotation(anno, parent, index) {
    let w = this.w;
    let result = this.helpers.getX1X2("x1", anno);
    let x1 = result.x;
    let clipX1 = result.clipped;
    let clipX2 = true;
    let x2;
    const text = anno.label.text;
    let strokeDashArray = anno.strokeDashArray;
    if (!Utils$1.isNumber(x1)) return;
    if (anno.x2 === null || typeof anno.x2 === "undefined") {
      if (!clipX1) {
        let line = this.annoCtx.graphics.drawLine(
          x1 + anno.offsetX,
          // x1
          0 + anno.offsetY,
          // y1
          x1 + anno.offsetX,
          // x2
          w.globals.gridHeight + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          //dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
      }
    } else {
      let result2 = this.helpers.getX1X2("x2", anno);
      x2 = result2.x;
      clipX2 = result2.clipped;
      if (x2 < x1) {
        let temp = x1;
        x1 = x2;
        x2 = temp;
      }
      let rect = this.annoCtx.graphics.drawRect(
        x1 + anno.offsetX,
        // x1
        0 + anno.offsetY,
        // y1
        x2 - x1,
        // x2
        w.globals.gridHeight + anno.offsetY,
        // y2
        0,
        // radius
        anno.fillColor,
        // color
        anno.opacity,
        // opacity,
        1,
        // strokeWidth
        anno.borderColor,
        // strokeColor
        strokeDashArray
        // stokeDashArray
      );
      rect.node.classList.add("apexcharts-annotation-rect");
      rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
      parent.appendChild(rect.node);
      if (anno.id) {
        rect.node.classList.add(anno.id);
      }
    }
    if (!(clipX1 && clipX2)) {
      let textRects = this.annoCtx.graphics.getTextRects(
        text,
        parseFloat(anno.label.style.fontSize)
      );
      let textY = anno.label.position === "top" ? 4 : anno.label.position === "center" ? w.globals.gridHeight / 2 + (anno.label.orientation === "vertical" ? textRects.width / 2 : 0) : w.globals.gridHeight;
      let elText = this.annoCtx.graphics.drawText({
        x: x1 + anno.label.offsetX,
        y: textY + anno.label.offsetY - (anno.label.orientation === "vertical" ? anno.label.position === "top" ? textRects.width / 2 - 12 : -textRects.width / 2 : 0),
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-xaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      this.annoCtx.helpers.setOrientations(anno, index);
    }
  }
  drawXAxisAnnotations() {
    let w = this.w;
    let elg = this.annoCtx.graphics.group({
      class: "apexcharts-xaxis-annotations"
    });
    w.config.annotations.xaxis.map((anno, index) => {
      this.addXaxisAnnotation(anno, elg.node, index);
    });
    return elg;
  }
}
class DateTime {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.months31 = [1, 3, 5, 7, 8, 10, 12];
    this.months30 = [2, 4, 6, 9, 11];
    this.daysCntOfYear = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  }
  isValidDate(date) {
    if (typeof date === "number") {
      return false;
    }
    return !isNaN(this.parseDate(date));
  }
  getTimeStamp(dateStr) {
    if (!Date.parse(dateStr)) {
      return dateStr;
    }
    const utc = this.w.config.xaxis.labels.datetimeUTC;
    return !utc ? new Date(dateStr).getTime() : new Date(new Date(dateStr).toISOString().substr(0, 25)).getTime();
  }
  getDate(timestamp) {
    const utc = this.w.config.xaxis.labels.datetimeUTC;
    return utc ? new Date(new Date(timestamp).toUTCString()) : new Date(timestamp);
  }
  parseDate(dateStr) {
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return this.getTimeStamp(dateStr);
    }
    let output = Date.parse(dateStr.replace(/-/g, "/").replace(/[a-z]+/gi, " "));
    output = this.getTimeStamp(output);
    return output;
  }
  // This fixes the difference of x-axis labels between chrome/safari
  // Fixes #1726, #1544, #1485, #1255
  parseDateWithTimezone(dateStr) {
    return Date.parse(dateStr.replace(/-/g, "/").replace(/[a-z]+/gi, " "));
  }
  // http://stackoverflow.com/questions/14638018/current-time-formatting-with-javascript#answer-14638191
  formatDate(date, format) {
    const locale = this.w.globals.locale;
    const utc = this.w.config.xaxis.labels.datetimeUTC;
    let MMMM = ["\0", ...locale.months];
    let MMM = ["", ...locale.shortMonths];
    let dddd = ["", ...locale.days];
    let ddd = ["", ...locale.shortDays];
    function ii(i, len) {
      let s2 = i + "";
      len = len || 2;
      while (s2.length < len) s2 = "0" + s2;
      return s2;
    }
    let y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);
    let M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);
    let d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);
    let H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);
    let h = H > 12 ? H - 12 : H === 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);
    let m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);
    let s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);
    let f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);
    let T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));
    let t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));
    let tz = -date.getTimezoneOffset();
    let K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
      tz = Math.abs(tz);
      let tzHrs = Math.floor(tz / 60);
      let tzMin = tz % 60;
      K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);
    let day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);
    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);
    format = format.replace(/\\(.)/g, "$1");
    return format;
  }
  getTimeUnitsfromTimestamp(minX, maxX, utc) {
    let w = this.w;
    if (w.config.xaxis.min !== void 0) {
      minX = w.config.xaxis.min;
    }
    if (w.config.xaxis.max !== void 0) {
      maxX = w.config.xaxis.max;
    }
    const tsMin = this.getDate(minX);
    const tsMax = this.getDate(maxX);
    const minD = this.formatDate(tsMin, "yyyy MM dd HH mm ss fff").split(" ");
    const maxD = this.formatDate(tsMax, "yyyy MM dd HH mm ss fff").split(" ");
    return {
      minMillisecond: parseInt(minD[6], 10),
      maxMillisecond: parseInt(maxD[6], 10),
      minSecond: parseInt(minD[5], 10),
      maxSecond: parseInt(maxD[5], 10),
      minMinute: parseInt(minD[4], 10),
      maxMinute: parseInt(maxD[4], 10),
      minHour: parseInt(minD[3], 10),
      maxHour: parseInt(maxD[3], 10),
      minDate: parseInt(minD[2], 10),
      maxDate: parseInt(maxD[2], 10),
      minMonth: parseInt(minD[1], 10) - 1,
      maxMonth: parseInt(maxD[1], 10) - 1,
      minYear: parseInt(minD[0], 10),
      maxYear: parseInt(maxD[0], 10)
    };
  }
  isLeapYear(year) {
    return year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
  }
  calculcateLastDaysOfMonth(month, year, subtract) {
    const days = this.determineDaysOfMonths(month, year);
    return days - subtract;
  }
  determineDaysOfYear(year) {
    let days = 365;
    if (this.isLeapYear(year)) {
      days = 366;
    }
    return days;
  }
  determineRemainingDaysOfYear(year, month, date) {
    let dayOfYear = this.daysCntOfYear[month] + date;
    if (month > 1 && this.isLeapYear()) dayOfYear++;
    return dayOfYear;
  }
  determineDaysOfMonths(month, year) {
    let days = 30;
    month = Utils$1.monthMod(month);
    switch (true) {
      case this.months30.indexOf(month) > -1:
        if (month === 2) {
          if (this.isLeapYear(year)) {
            days = 29;
          } else {
            days = 28;
          }
        }
        break;
      case this.months31.indexOf(month) > -1:
        days = 31;
        break;
      default:
        days = 31;
        break;
    }
    return days;
  }
}
class Formatters {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.tooltipKeyFormat = "dd MMM";
  }
  xLabelFormat(fn, val, timestamp, opts) {
    let w = this.w;
    if (w.config.xaxis.type === "datetime") {
      if (w.config.xaxis.labels.formatter === void 0) {
        if (w.config.tooltip.x.formatter === void 0) {
          let datetimeObj = new DateTime(this.ctx);
          return datetimeObj.formatDate(
            datetimeObj.getDate(val),
            w.config.tooltip.x.format
          );
        }
      }
    }
    return fn(val, timestamp, opts);
  }
  defaultGeneralFormatter(val) {
    if (Array.isArray(val)) {
      return val.map((v) => {
        return v;
      });
    } else {
      return val;
    }
  }
  defaultYFormatter(v, yaxe, i) {
    let w = this.w;
    if (Utils$1.isNumber(v)) {
      if (w.globals.yValueDecimal !== 0) {
        v = v.toFixed(
          yaxe.decimalsInFloat !== void 0 ? yaxe.decimalsInFloat : w.globals.yValueDecimal
        );
      } else {
        const f = v.toFixed(0);
        v = v == f ? f : v.toFixed(1);
      }
    }
    return v;
  }
  setLabelFormatters() {
    let w = this.w;
    w.globals.xaxisTooltipFormatter = (val) => {
      return this.defaultGeneralFormatter(val);
    };
    w.globals.ttKeyFormatter = (val) => {
      return this.defaultGeneralFormatter(val);
    };
    w.globals.ttZFormatter = (val) => {
      return val;
    };
    w.globals.legendFormatter = (val) => {
      return this.defaultGeneralFormatter(val);
    };
    if (w.config.xaxis.labels.formatter !== void 0) {
      w.globals.xLabelFormatter = w.config.xaxis.labels.formatter;
    } else {
      w.globals.xLabelFormatter = (val) => {
        if (Utils$1.isNumber(val)) {
          if (!w.config.xaxis.convertedCatToNumeric && w.config.xaxis.type === "numeric") {
            if (Utils$1.isNumber(w.config.xaxis.decimalsInFloat)) {
              return val.toFixed(w.config.xaxis.decimalsInFloat);
            } else {
              const diff = w.globals.maxX - w.globals.minX;
              if (diff > 0 && diff < 100) {
                return val.toFixed(1);
              }
              return val.toFixed(0);
            }
          }
          if (w.globals.isBarHorizontal) {
            const range = w.globals.maxY - w.globals.minYArr;
            if (range < 4) {
              return val.toFixed(1);
            }
          }
          return val.toFixed(0);
        }
        return val;
      };
    }
    if (typeof w.config.tooltip.x.formatter === "function") {
      w.globals.ttKeyFormatter = w.config.tooltip.x.formatter;
    } else {
      w.globals.ttKeyFormatter = w.globals.xLabelFormatter;
    }
    if (typeof w.config.xaxis.tooltip.formatter === "function") {
      w.globals.xaxisTooltipFormatter = w.config.xaxis.tooltip.formatter;
    }
    if (Array.isArray(w.config.tooltip.y)) {
      w.globals.ttVal = w.config.tooltip.y;
    } else {
      if (w.config.tooltip.y.formatter !== void 0) {
        w.globals.ttVal = w.config.tooltip.y;
      }
    }
    if (w.config.tooltip.z.formatter !== void 0) {
      w.globals.ttZFormatter = w.config.tooltip.z.formatter;
    }
    if (w.config.legend.formatter !== void 0) {
      w.globals.legendFormatter = w.config.legend.formatter;
    }
    w.config.yaxis.forEach((yaxe, i) => {
      if (yaxe.labels.formatter !== void 0) {
        w.globals.yLabelFormatters[i] = yaxe.labels.formatter;
      } else {
        w.globals.yLabelFormatters[i] = (val) => {
          if (!w.globals.xyCharts) return val;
          if (Array.isArray(val)) {
            return val.map((v) => {
              return this.defaultYFormatter(v, yaxe, i);
            });
          } else {
            return this.defaultYFormatter(val, yaxe, i);
          }
        };
      }
    });
    return w.globals;
  }
  heatmapLabelFormatters() {
    const w = this.w;
    if (w.config.chart.type === "heatmap") {
      w.globals.yAxisScale[0].result = w.globals.seriesNames.slice();
      let longest = w.globals.seriesNames.reduce(
        (a, b) => a.length > b.length ? a : b,
        0
      );
      w.globals.yAxisScale[0].niceMax = longest;
      w.globals.yAxisScale[0].niceMin = longest;
    }
  }
}
class AxesUtils {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  // Based on the formatter function, get the label text and position
  getLabel(labels, timescaleLabels, x, i, drawnLabels = [], fontSize = "12px", isLeafGroup = true) {
    const w = this.w;
    let rawLabel = typeof labels[i] === "undefined" ? "" : labels[i];
    let label = rawLabel;
    let xlbFormatter = w.globals.xLabelFormatter;
    let customFormatter = w.config.xaxis.labels.formatter;
    let isBold = false;
    let xFormat = new Formatters(this.ctx);
    let timestamp = rawLabel;
    if (isLeafGroup) {
      label = xFormat.xLabelFormat(xlbFormatter, rawLabel, timestamp, {
        i,
        dateFormatter: new DateTime(this.ctx).formatDate,
        w
      });
      if (customFormatter !== void 0) {
        label = customFormatter(rawLabel, labels[i], {
          i,
          dateFormatter: new DateTime(this.ctx).formatDate,
          w
        });
      }
    }
    const determineHighestUnit = (unit) => {
      let highestUnit = null;
      timescaleLabels.forEach((t) => {
        if (t.unit === "month") {
          highestUnit = "year";
        } else if (t.unit === "day") {
          highestUnit = "month";
        } else if (t.unit === "hour") {
          highestUnit = "day";
        } else if (t.unit === "minute") {
          highestUnit = "hour";
        }
      });
      return highestUnit === unit;
    };
    if (timescaleLabels.length > 0) {
      isBold = determineHighestUnit(timescaleLabels[i].unit);
      x = timescaleLabels[i].position;
      label = timescaleLabels[i].value;
    } else {
      if (w.config.xaxis.type === "datetime" && customFormatter === void 0) {
        label = "";
      }
    }
    if (typeof label === "undefined") label = "";
    label = Array.isArray(label) ? label : label.toString();
    let graphics = new Graphics(this.ctx);
    let textRect = {};
    if (w.globals.rotateXLabels && isLeafGroup) {
      textRect = graphics.getTextRects(
        label,
        parseInt(fontSize, 10),
        null,
        `rotate(${w.config.xaxis.labels.rotate} 0 0)`,
        false
      );
    } else {
      textRect = graphics.getTextRects(label, parseInt(fontSize, 10));
    }
    const allowDuplicatesInTimeScale = !w.config.xaxis.labels.showDuplicates && this.ctx.timeScale;
    if (!Array.isArray(label) && (String(label) === "NaN" || drawnLabels.indexOf(label) >= 0 && allowDuplicatesInTimeScale)) {
      label = "";
    }
    return {
      x,
      text: label,
      textRect,
      isBold
    };
  }
  checkLabelBasedOnTickamount(i, label, labelsLen) {
    const w = this.w;
    let ticks = w.config.xaxis.tickAmount;
    if (ticks === "dataPoints") ticks = Math.round(w.globals.gridWidth / 120);
    if (ticks > labelsLen) return label;
    let tickMultiple = Math.round(labelsLen / (ticks + 1));
    if (i % tickMultiple === 0) {
      return label;
    } else {
      label.text = "";
    }
    return label;
  }
  checkForOverflowingLabels(i, label, labelsLen, drawnLabels, drawnLabelsRects) {
    const w = this.w;
    if (i === 0) {
      if (w.globals.skipFirstTimelinelabel) {
        label.text = "";
      }
    }
    if (i === labelsLen - 1) {
      if (w.globals.skipLastTimelinelabel) {
        label.text = "";
      }
    }
    if (w.config.xaxis.labels.hideOverlappingLabels && drawnLabels.length > 0) {
      const prev = drawnLabelsRects[drawnLabelsRects.length - 1];
      if (w.config.xaxis.labels.trim && w.config.xaxis.type !== "datetime") {
        return label;
      }
      if (label.x < prev.textRect.width / (w.globals.rotateXLabels ? Math.abs(w.config.xaxis.labels.rotate) / 12 : 1.01) + prev.x) {
        label.text = "";
      }
    }
    return label;
  }
  checkForReversedLabels(i, labels) {
    const w = this.w;
    if (w.config.yaxis[i] && w.config.yaxis[i].reversed) {
      labels.reverse();
    }
    return labels;
  }
  yAxisAllSeriesCollapsed(index) {
    const gl = this.w.globals;
    return !gl.seriesYAxisMap[index].some((si) => {
      return gl.collapsedSeriesIndices.indexOf(si) === -1;
    });
  }
  // Method to translate annotation.yAxisIndex values from
  // seriesName-as-a-string values to seriesName-as-an-array values (old style
  // series mapping to new style).
  translateYAxisIndex(index) {
    const w = this.w;
    const gl = w.globals;
    const yaxis = w.config.yaxis;
    let newStyle = gl.series.length > yaxis.length || yaxis.some((a) => Array.isArray(a.seriesName));
    if (newStyle) {
      return index;
    } else {
      return gl.seriesYAxisReverseMap[index];
    }
  }
  isYAxisHidden(index) {
    const w = this.w;
    const yaxis = w.config.yaxis[index];
    if (!yaxis.show || this.yAxisAllSeriesCollapsed(index)) {
      return true;
    }
    if (!yaxis.showForNullSeries) {
      const seriesIndices = w.globals.seriesYAxisMap[index];
      const coreUtils = new CoreUtils(this.ctx);
      return seriesIndices.every((si) => coreUtils.isSeriesNull(si));
    }
    return false;
  }
  // get the label color for y-axis
  // realIndex is the actual series index, while i is the tick Index
  getYAxisForeColor(yColors, realIndex2) {
    const w = this.w;
    if (Array.isArray(yColors) && w.globals.yAxisScale[realIndex2]) {
      this.ctx.theme.pushExtraColors(
        yColors,
        w.globals.yAxisScale[realIndex2].result.length,
        false
      );
    }
    return yColors;
  }
  drawYAxisTicks(x, tickAmount, axisBorder, axisTicks, realIndex2, labelsDivider, elYaxis) {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let tY = w.globals.translateY + w.config.yaxis[realIndex2].labels.offsetY;
    if (w.globals.isBarHorizontal) {
      tY = 0;
    } else if (w.config.chart.type === "heatmap") {
      tY += labelsDivider / 2;
    }
    if (axisTicks.show && tickAmount > 0) {
      if (w.config.yaxis[realIndex2].opposite === true) x = x + axisTicks.width;
      for (let i = tickAmount; i >= 0; i--) {
        let elTick = graphics.drawLine(
          x + axisBorder.offsetX - axisTicks.width + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          x + axisBorder.offsetX + axisTicks.offsetX,
          tY + axisTicks.offsetY,
          axisTicks.color
        );
        elYaxis.add(elTick);
        tY += labelsDivider;
      }
    }
  }
}
class YAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers$4(this.annoCtx);
    this.axesUtils = new AxesUtils(this.annoCtx);
  }
  addYaxisAnnotation(anno, parent, index) {
    let w = this.w;
    let strokeDashArray = anno.strokeDashArray;
    let result = this.helpers.getY1Y2("y1", anno);
    let y1 = result.yP;
    let clipY1 = result.clipped;
    let y2;
    let clipY2 = true;
    let drawn = false;
    const text = anno.label.text;
    if (anno.y2 === null || typeof anno.y2 === "undefined") {
      if (!clipY1) {
        drawn = true;
        let line = this.annoCtx.graphics.drawLine(
          0 + anno.offsetX,
          // x1
          y1 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          // dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
      }
    } else {
      result = this.helpers.getY1Y2("y2", anno);
      y2 = result.yP;
      clipY2 = result.clipped;
      if (y2 > y1) {
        let temp = y1;
        y1 = y2;
        y2 = temp;
      }
      if (!(clipY1 && clipY2)) {
        drawn = true;
        let rect = this.annoCtx.graphics.drawRect(
          0 + anno.offsetX,
          // x1
          y2 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 - y2,
          // y2
          0,
          // radius
          anno.fillColor,
          // color
          anno.opacity,
          // opacity,
          1,
          // strokeWidth
          anno.borderColor,
          // strokeColor
          strokeDashArray
          // stokeDashArray
        );
        rect.node.classList.add("apexcharts-annotation-rect");
        rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
        parent.appendChild(rect.node);
        if (anno.id) {
          rect.node.classList.add(anno.id);
        }
      }
    }
    if (drawn) {
      let textX = anno.label.position === "right" ? w.globals.gridWidth : anno.label.position === "center" ? w.globals.gridWidth / 2 : 0;
      let elText = this.annoCtx.graphics.drawText({
        x: textX + anno.label.offsetX,
        y: (y2 != null ? y2 : y1) + anno.label.offsetY - 3,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-yaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
    }
  }
  _getYAxisAnnotationWidth(anno) {
    const w = this.w;
    let width = w.globals.gridWidth;
    if (anno.width.indexOf("%") > -1) {
      width = w.globals.gridWidth * parseInt(anno.width, 10) / 100;
    } else {
      width = parseInt(anno.width, 10);
    }
    return width + anno.offsetX;
  }
  drawYAxisAnnotations() {
    const w = this.w;
    let elg = this.annoCtx.graphics.group({
      class: "apexcharts-yaxis-annotations"
    });
    w.config.annotations.yaxis.forEach((anno, index) => {
      anno.yAxisIndex = this.axesUtils.translateYAxisIndex(anno.yAxisIndex);
      if (!(this.axesUtils.isYAxisHidden(anno.yAxisIndex) && this.axesUtils.yAxisAllSeriesCollapsed(anno.yAxisIndex))) {
        this.addYaxisAnnotation(anno, elg.node, index);
      }
    });
    return elg;
  }
}
class PointAnnotations {
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers$4(this.annoCtx);
  }
  addPointAnnotation(anno, parent, index) {
    const w = this.w;
    if (w.globals.collapsedSeriesIndices.indexOf(anno.seriesIndex) > -1) {
      return;
    }
    let result = this.helpers.getX1X2("x1", anno);
    let x = result.x;
    let clipX = result.clipped;
    result = this.helpers.getY1Y2("y1", anno);
    let y = result.yP;
    let clipY = result.clipped;
    if (!Utils$1.isNumber(x)) return;
    if (!(clipY || clipX)) {
      let optsPoints = {
        pSize: anno.marker.size,
        pointStrokeWidth: anno.marker.strokeWidth,
        pointFillColor: anno.marker.fillColor,
        pointStrokeColor: anno.marker.strokeColor,
        shape: anno.marker.shape,
        pRadius: anno.marker.radius,
        class: `apexcharts-point-annotation-marker ${anno.marker.cssClass} ${anno.id ? anno.id : ""}`
      };
      let point = this.annoCtx.graphics.drawMarker(
        x + anno.marker.offsetX,
        y + anno.marker.offsetY,
        optsPoints
      );
      parent.appendChild(point.node);
      const text = anno.label.text ? anno.label.text : "";
      let elText = this.annoCtx.graphics.drawText({
        x: x + anno.label.offsetX,
        y: y + anno.label.offsetY - anno.marker.size - parseFloat(anno.label.style.fontSize) / 1.6,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-point-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      if (anno.customSVG.SVG) {
        let g = this.annoCtx.graphics.group({
          class: "apexcharts-point-annotations-custom-svg " + anno.customSVG.cssClass
        });
        g.attr({
          transform: `translate(${x + anno.customSVG.offsetX}, ${y + anno.customSVG.offsetY})`
        });
        g.node.innerHTML = anno.customSVG.SVG;
        parent.appendChild(g.node);
      }
      if (anno.image.path) {
        let imgWidth = anno.image.width ? anno.image.width : 20;
        let imgHeight = anno.image.height ? anno.image.height : 20;
        point = this.annoCtx.addImage({
          x: x + anno.image.offsetX - imgWidth / 2,
          y: y + anno.image.offsetY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          path: anno.image.path,
          appendTo: ".apexcharts-point-annotations"
        });
      }
      if (anno.mouseEnter) {
        point.node.addEventListener(
          "mouseenter",
          anno.mouseEnter.bind(this, anno)
        );
      }
      if (anno.mouseLeave) {
        point.node.addEventListener(
          "mouseleave",
          anno.mouseLeave.bind(this, anno)
        );
      }
      if (anno.click) {
        point.node.addEventListener("click", anno.click.bind(this, anno));
      }
    }
  }
  drawPointAnnotations() {
    let w = this.w;
    let elg = this.annoCtx.graphics.group({
      class: "apexcharts-point-annotations"
    });
    w.config.annotations.points.map((anno, index) => {
      this.addPointAnnotation(anno, elg.node, index);
    });
    return elg;
  }
}
const name = "en";
const options = { "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], "toolbar": { "exportToSVG": "Download SVG", "exportToPNG": "Download PNG", "exportToCSV": "Download CSV", "menu": "Menu", "selection": "Selection", "selectionZoom": "Selection Zoom", "zoomIn": "Zoom In", "zoomOut": "Zoom Out", "pan": "Panning", "reset": "Reset Zoom" } };
const en = {
  name,
  options
};
class Options {
  constructor() {
    this.yAxis = {
      show: true,
      showAlways: false,
      showForNullSeries: true,
      seriesName: void 0,
      opposite: false,
      reversed: false,
      logarithmic: false,
      logBase: 10,
      tickAmount: void 0,
      stepSize: void 0,
      forceNiceScale: false,
      max: void 0,
      min: void 0,
      floating: false,
      decimalsInFloat: void 0,
      labels: {
        show: true,
        showDuplicates: false,
        minWidth: 0,
        maxWidth: 160,
        offsetX: 0,
        offsetY: 0,
        align: void 0,
        rotate: 0,
        padding: 20,
        style: {
          colors: [],
          fontSize: "11px",
          fontWeight: 400,
          fontFamily: void 0,
          cssClass: ""
        },
        formatter: void 0
      },
      axisBorder: {
        show: false,
        color: "#e0e0e0",
        width: 1,
        offsetX: 0,
        offsetY: 0
      },
      axisTicks: {
        show: false,
        color: "#e0e0e0",
        width: 6,
        offsetX: 0,
        offsetY: 0
      },
      title: {
        text: void 0,
        rotate: -90,
        offsetY: 0,
        offsetX: 0,
        style: {
          color: void 0,
          fontSize: "11px",
          fontWeight: 900,
          fontFamily: void 0,
          cssClass: ""
        }
      },
      tooltip: {
        enabled: false,
        offsetX: 0
      },
      crosshairs: {
        show: true,
        position: "front",
        stroke: {
          color: "#b6b6b6",
          width: 1,
          dashArray: 0
        }
      }
    };
    this.pointAnnotation = {
      id: void 0,
      x: 0,
      y: null,
      yAxisIndex: 0,
      seriesIndex: void 0,
      mouseEnter: void 0,
      mouseLeave: void 0,
      click: void 0,
      marker: {
        size: 4,
        fillColor: "#fff",
        strokeWidth: 2,
        strokeColor: "#333",
        shape: "circle",
        offsetX: 0,
        offsetY: 0,
        // radius: 2, // DEPRECATED
        cssClass: ""
      },
      label: {
        borderColor: "#c2c2c2",
        borderWidth: 1,
        borderRadius: 2,
        text: void 0,
        textAnchor: "middle",
        offsetX: 0,
        offsetY: 0,
        mouseEnter: void 0,
        mouseLeave: void 0,
        click: void 0,
        style: {
          background: "#fff",
          color: void 0,
          fontSize: "11px",
          fontFamily: void 0,
          fontWeight: 400,
          cssClass: "",
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2
          }
        }
      },
      customSVG: {
        // this will be deprecated in the next major version as it is going to be replaced with a better alternative below (image)
        SVG: void 0,
        cssClass: void 0,
        offsetX: 0,
        offsetY: 0
      },
      image: {
        path: void 0,
        width: 20,
        height: 20,
        offsetX: 0,
        offsetY: 0
      }
    };
    this.yAxisAnnotation = {
      id: void 0,
      y: 0,
      y2: null,
      strokeDashArray: 1,
      fillColor: "#c2c2c2",
      borderColor: "#c2c2c2",
      borderWidth: 1,
      opacity: 0.3,
      offsetX: 0,
      offsetY: 0,
      width: "100%",
      yAxisIndex: 0,
      label: {
        borderColor: "#c2c2c2",
        borderWidth: 1,
        borderRadius: 2,
        text: void 0,
        textAnchor: "end",
        position: "right",
        offsetX: 0,
        offsetY: -3,
        mouseEnter: void 0,
        mouseLeave: void 0,
        click: void 0,
        style: {
          background: "#fff",
          color: void 0,
          fontSize: "11px",
          fontFamily: void 0,
          fontWeight: 400,
          cssClass: "",
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2
          }
        }
      }
    };
    this.xAxisAnnotation = {
      id: void 0,
      x: 0,
      x2: null,
      strokeDashArray: 1,
      fillColor: "#c2c2c2",
      borderColor: "#c2c2c2",
      borderWidth: 1,
      opacity: 0.3,
      offsetX: 0,
      offsetY: 0,
      label: {
        borderColor: "#c2c2c2",
        borderWidth: 1,
        borderRadius: 2,
        text: void 0,
        textAnchor: "middle",
        orientation: "vertical",
        position: "top",
        offsetX: 0,
        offsetY: 0,
        mouseEnter: void 0,
        mouseLeave: void 0,
        click: void 0,
        style: {
          background: "#fff",
          color: void 0,
          fontSize: "11px",
          fontFamily: void 0,
          fontWeight: 400,
          cssClass: "",
          padding: {
            left: 5,
            right: 5,
            top: 2,
            bottom: 2
          }
        }
      }
    };
    this.text = {
      x: 0,
      y: 0,
      text: "",
      textAnchor: "start",
      foreColor: void 0,
      fontSize: "13px",
      fontFamily: void 0,
      fontWeight: 400,
      appendTo: ".apexcharts-annotations",
      backgroundColor: "transparent",
      borderColor: "#c2c2c2",
      borderRadius: 0,
      borderWidth: 0,
      paddingLeft: 4,
      paddingRight: 4,
      paddingTop: 2,
      paddingBottom: 2
    };
  }
  init() {
    return {
      annotations: {
        yaxis: [this.yAxisAnnotation],
        xaxis: [this.xAxisAnnotation],
        points: [this.pointAnnotation],
        texts: [],
        images: [],
        shapes: []
      },
      chart: {
        animations: {
          enabled: true,
          speed: 800,
          animateGradually: {
            delay: 150,
            enabled: true
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        },
        background: "",
        locales: [en],
        defaultLocale: "en",
        dropShadow: {
          enabled: false,
          enabledOnSeries: void 0,
          top: 2,
          left: 2,
          blur: 4,
          color: "#000",
          opacity: 0.7
        },
        events: {
          animationEnd: void 0,
          beforeMount: void 0,
          mounted: void 0,
          updated: void 0,
          click: void 0,
          mouseMove: void 0,
          mouseLeave: void 0,
          xAxisLabelClick: void 0,
          legendClick: void 0,
          markerClick: void 0,
          selection: void 0,
          dataPointSelection: void 0,
          dataPointMouseEnter: void 0,
          dataPointMouseLeave: void 0,
          beforeZoom: void 0,
          beforeResetZoom: void 0,
          zoomed: void 0,
          scrolled: void 0,
          brushScrolled: void 0
        },
        foreColor: "#373d3f",
        fontFamily: "Helvetica, Arial, sans-serif",
        height: "auto",
        parentHeightOffset: 15,
        redrawOnParentResize: true,
        redrawOnWindowResize: true,
        id: void 0,
        group: void 0,
        nonce: void 0,
        offsetX: 0,
        offsetY: 0,
        injectStyleSheet: true,
        selection: {
          enabled: false,
          type: "x",
          // selectedPoints: undefined, // default datapoints that should be selected automatically
          fill: {
            color: "#24292e",
            opacity: 0.1
          },
          stroke: {
            width: 1,
            color: "#24292e",
            opacity: 0.4,
            dashArray: 3
          },
          xaxis: {
            min: void 0,
            max: void 0
          },
          yaxis: {
            min: void 0,
            max: void 0
          }
        },
        sparkline: {
          enabled: false
        },
        brush: {
          enabled: false,
          autoScaleYaxis: true,
          target: void 0,
          targets: void 0
        },
        stacked: false,
        stackOnlyBar: true,
        // mixed chart with stacked bars and line series - incorrect line draw #907
        stackType: "normal",
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true,
            customIcons: []
          },
          export: {
            csv: {
              filename: void 0,
              columnDelimiter: ",",
              headerCategory: "category",
              headerValue: "value",
              categoryFormatter: void 0,
              valueFormatter: void 0
            },
            png: {
              filename: void 0
            },
            svg: {
              filename: void 0
            },
            scale: void 0,
            width: void 0
          },
          autoSelected: "zoom"
          // accepts -> zoom, pan, selection
        },
        type: "line",
        width: "100%",
        zoom: {
          enabled: true,
          type: "x",
          autoScaleYaxis: false,
          allowMouseWheelZoom: true,
          zoomedArea: {
            fill: {
              color: "#90CAF9",
              opacity: 0.4
            },
            stroke: {
              color: "#0D47A1",
              opacity: 0.4,
              width: 1
            }
          }
        }
      },
      parsing: {
        x: void 0,
        y: void 0
      },
      plotOptions: {
        line: {
          isSlopeChart: false,
          colors: {
            threshold: 0,
            colorAboveThreshold: void 0,
            colorBelowThreshold: void 0
          }
        },
        area: {
          fillTo: "origin"
        },
        bar: {
          horizontal: false,
          columnWidth: "70%",
          // should be in percent 0 - 100
          barHeight: "70%",
          // should be in percent 0 - 100
          distributed: false,
          borderRadius: 0,
          borderRadiusApplication: "around",
          // [around, end]
          borderRadiusWhenStacked: "last",
          // [all, last]
          rangeBarOverlap: true,
          rangeBarGroupRows: false,
          hideZeroBarsWhenGrouped: false,
          isDumbbell: false,
          dumbbellColors: void 0,
          isFunnel: false,
          isFunnel3d: true,
          colors: {
            ranges: [],
            backgroundBarColors: [],
            backgroundBarOpacity: 1,
            backgroundBarRadius: 0
          },
          dataLabels: {
            position: "top",
            // top, center, bottom
            maxItems: 100,
            hideOverflowingLabels: true,
            orientation: "horizontal",
            total: {
              enabled: false,
              formatter: void 0,
              offsetX: 0,
              offsetY: 0,
              style: {
                color: "#373d3f",
                fontSize: "12px",
                fontFamily: void 0,
                fontWeight: 600
              }
            }
          }
        },
        bubble: {
          zScaling: true,
          minBubbleRadius: void 0,
          maxBubbleRadius: void 0
        },
        candlestick: {
          colors: {
            upward: "#00B746",
            downward: "#EF403C"
          },
          wick: {
            useFillColor: true
          }
        },
        boxPlot: {
          colors: {
            upper: "#00E396",
            lower: "#008FFB"
          }
        },
        heatmap: {
          radius: 2,
          enableShades: true,
          shadeIntensity: 0.5,
          reverseNegativeShade: false,
          distributed: false,
          useFillColorAsStroke: false,
          colorScale: {
            inverse: false,
            ranges: [],
            min: void 0,
            max: void 0
          }
        },
        treemap: {
          enableShades: true,
          shadeIntensity: 0.5,
          distributed: false,
          reverseNegativeShade: false,
          useFillColorAsStroke: false,
          borderRadius: 4,
          dataLabels: {
            format: "scale"
            // scale | truncate
          },
          colorScale: {
            inverse: false,
            ranges: [],
            min: void 0,
            max: void 0
          },
          seriesTitle: {
            show: true,
            offsetY: 1,
            offsetX: 1,
            borderColor: "#000",
            borderWidth: 1,
            borderRadius: 2,
            style: {
              background: "rgba(0, 0, 0, 0.6)",
              color: "#fff",
              fontSize: "12px",
              fontFamily: void 0,
              fontWeight: 400,
              cssClass: "",
              padding: {
                left: 6,
                right: 6,
                top: 2,
                bottom: 2
              }
            }
          }
        },
        radialBar: {
          inverseOrder: false,
          startAngle: 0,
          endAngle: 360,
          offsetX: 0,
          offsetY: 0,
          hollow: {
            margin: 5,
            size: "50%",
            background: "transparent",
            image: void 0,
            imageWidth: 150,
            imageHeight: 150,
            imageOffsetX: 0,
            imageOffsetY: 0,
            imageClipped: true,
            position: "front",
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              color: "#000",
              opacity: 0.5
            }
          },
          track: {
            show: true,
            startAngle: void 0,
            endAngle: void 0,
            background: "#f2f2f2",
            strokeWidth: "97%",
            opacity: 1,
            margin: 5,
            // margin is in pixels
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              color: "#000",
              opacity: 0.5
            }
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              fontSize: "16px",
              fontFamily: void 0,
              fontWeight: 600,
              color: void 0,
              offsetY: 0,
              formatter(val) {
                return val;
              }
            },
            value: {
              show: true,
              fontSize: "14px",
              fontFamily: void 0,
              fontWeight: 400,
              color: void 0,
              offsetY: 16,
              formatter(val) {
                return val + "%";
              }
            },
            total: {
              show: false,
              label: "Total",
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: void 0,
              color: void 0,
              formatter(w) {
                return w.globals.seriesTotals.reduce((a, b) => a + b, 0) / w.globals.series.length + "%";
              }
            }
          },
          barLabels: {
            enabled: false,
            offsetX: 0,
            offsetY: 0,
            useSeriesColors: true,
            fontFamily: void 0,
            fontWeight: 600,
            fontSize: "16px",
            formatter(val) {
              return val;
            },
            onClick: void 0
          }
        },
        pie: {
          customScale: 1,
          offsetX: 0,
          offsetY: 0,
          startAngle: 0,
          endAngle: 360,
          expandOnClick: true,
          dataLabels: {
            // These are the percentage values which are displayed on slice
            offset: 0,
            // offset by which labels will move outside
            minAngleToShowLabel: 10
          },
          donut: {
            size: "65%",
            background: "transparent",
            labels: {
              // These are the inner labels appearing inside donut
              show: false,
              name: {
                show: true,
                fontSize: "16px",
                fontFamily: void 0,
                fontWeight: 600,
                color: void 0,
                offsetY: -10,
                formatter(val) {
                  return val;
                }
              },
              value: {
                show: true,
                fontSize: "20px",
                fontFamily: void 0,
                fontWeight: 400,
                color: void 0,
                offsetY: 10,
                formatter(val) {
                  return val;
                }
              },
              total: {
                show: false,
                showAlways: false,
                label: "Total",
                fontSize: "16px",
                fontWeight: 400,
                fontFamily: void 0,
                color: void 0,
                formatter(w) {
                  return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                }
              }
            }
          }
        },
        polarArea: {
          rings: {
            strokeWidth: 1,
            strokeColor: "#e8e8e8"
          },
          spokes: {
            strokeWidth: 1,
            connectorColors: "#e8e8e8"
          }
        },
        radar: {
          size: void 0,
          offsetX: 0,
          offsetY: 0,
          polygons: {
            // strokeColor: '#e8e8e8', // should be deprecated in the minor version i.e 3.2
            strokeWidth: 1,
            strokeColors: "#e8e8e8",
            connectorColors: "#e8e8e8",
            fill: {
              colors: void 0
            }
          }
        }
      },
      colors: void 0,
      dataLabels: {
        enabled: true,
        enabledOnSeries: void 0,
        formatter(val) {
          return val !== null ? val : "";
        },
        textAnchor: "middle",
        distributed: false,
        offsetX: 0,
        offsetY: 0,
        style: {
          fontSize: "12px",
          fontFamily: void 0,
          fontWeight: 600,
          colors: void 0
        },
        background: {
          enabled: true,
          foreColor: "#fff",
          backgroundColor: void 0,
          borderRadius: 2,
          padding: 4,
          opacity: 0.9,
          borderWidth: 1,
          borderColor: "#fff",
          dropShadow: {
            enabled: false,
            top: 1,
            left: 1,
            blur: 1,
            color: "#000",
            opacity: 0.8
          }
        },
        dropShadow: {
          enabled: false,
          top: 1,
          left: 1,
          blur: 1,
          color: "#000",
          opacity: 0.8
        }
      },
      fill: {
        type: "solid",
        colors: void 0,
        // array of colors
        opacity: 0.85,
        gradient: {
          shade: "dark",
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: void 0,
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 50, 100],
          colorStops: []
        },
        image: {
          src: [],
          width: void 0,
          // optional
          height: void 0
          // optional
        },
        pattern: {
          style: "squares",
          // String | Array of Strings
          width: 6,
          height: 6,
          strokeWidth: 2
        }
      },
      forecastDataPoints: {
        count: 0,
        fillOpacity: 0.5,
        strokeWidth: void 0,
        dashArray: 4
      },
      grid: {
        show: true,
        borderColor: "#e0e0e0",
        strokeDashArray: 0,
        position: "back",
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        row: {
          colors: void 0,
          // takes as array which will be repeated on rows
          opacity: 0.5
        },
        column: {
          colors: void 0,
          // takes an array which will be repeated on columns
          opacity: 0.5
        },
        padding: {
          top: 0,
          right: 10,
          bottom: 0,
          left: 12
        }
      },
      labels: [],
      legend: {
        show: true,
        showForSingleSeries: false,
        showForNullSeries: true,
        showForZeroSeries: true,
        floating: false,
        position: "bottom",
        // whether to position legends in 1 of 4
        // direction - top, bottom, left, right
        horizontalAlign: "center",
        // when position top/bottom, you can specify whether to align legends left, right or center
        inverseOrder: false,
        fontSize: "12px",
        fontFamily: void 0,
        fontWeight: 400,
        width: void 0,
        height: void 0,
        formatter: void 0,
        tooltipHoverFormatter: void 0,
        offsetX: -20,
        offsetY: 4,
        customLegendItems: [],
        clusterGroupedSeries: true,
        clusterGroupedSeriesOrientation: "vertical",
        labels: {
          colors: void 0,
          useSeriesColors: false
        },
        markers: {
          size: 7,
          fillColors: void 0,
          strokeWidth: 1,
          shape: void 0,
          offsetX: 0,
          offsetY: 0,
          customHTML: void 0,
          onClick: void 0
        },
        itemMargin: {
          horizontal: 5,
          vertical: 4
        },
        onItemClick: {
          toggleDataSeries: true
        },
        onItemHover: {
          highlightDataSeries: true
        }
      },
      markers: {
        discrete: [],
        size: 0,
        colors: void 0,
        strokeColors: "#fff",
        strokeWidth: 2,
        strokeOpacity: 0.9,
        strokeDashArray: 0,
        fillOpacity: 1,
        shape: "circle",
        offsetX: 0,
        offsetY: 0,
        showNullDataPoints: true,
        onClick: void 0,
        onDblClick: void 0,
        hover: {
          size: void 0,
          sizeOffset: 3
        }
      },
      noData: {
        text: void 0,
        align: "center",
        verticalAlign: "middle",
        offsetX: 0,
        offsetY: 0,
        style: {
          color: void 0,
          fontSize: "14px",
          fontFamily: void 0
        }
      },
      responsive: [],
      // breakpoints should follow ascending order 400, then 700, then 1000
      series: void 0,
      states: {
        hover: {
          filter: {
            type: "lighten"
          }
        },
        active: {
          allowMultipleDataPointsSelection: false,
          filter: {
            type: "darken"
          }
        }
      },
      title: {
        text: void 0,
        align: "left",
        margin: 5,
        offsetX: 0,
        offsetY: 0,
        floating: false,
        style: {
          fontSize: "14px",
          fontWeight: 900,
          fontFamily: void 0,
          color: void 0
        }
      },
      subtitle: {
        text: void 0,
        align: "left",
        margin: 5,
        offsetX: 0,
        offsetY: 30,
        floating: false,
        style: {
          fontSize: "12px",
          fontWeight: 400,
          fontFamily: void 0,
          color: void 0
        }
      },
      stroke: {
        show: true,
        curve: "smooth",
        // "smooth" / "straight" / "monotoneCubic" / "stepline" / "linestep"
        lineCap: "butt",
        // round, butt , square
        width: 2,
        colors: void 0,
        // array of colors
        dashArray: 0,
        // single value or array of values
        fill: {
          type: "solid",
          colors: void 0,
          // array of colors
          opacity: 0.85,
          gradient: {
            shade: "dark",
            type: "horizontal",
            shadeIntensity: 0.5,
            gradientToColors: void 0,
            inverseColors: true,
            opacityFrom: 1,
            opacityTo: 1,
            stops: [0, 50, 100],
            colorStops: []
          }
        }
      },
      tooltip: {
        enabled: true,
        enabledOnSeries: void 0,
        shared: true,
        hideEmptySeries: false,
        followCursor: false,
        // when disabled, the tooltip will show on top of the series instead of mouse position
        intersect: false,
        // when enabled, tooltip will only show when user directly hovers over point
        inverseOrder: false,
        custom: void 0,
        fillSeriesColor: false,
        theme: "light",
        cssClass: "",
        style: {
          fontSize: "12px",
          fontFamily: void 0
        },
        onDatasetHover: {
          highlightDataSeries: false
        },
        x: {
          // x value
          show: true,
          format: "dd MMM",
          // dd/MM, dd MMM yy, dd MMM yyyy
          formatter: void 0
          // a custom user supplied formatter function
        },
        y: {
          formatter: void 0,
          title: {
            formatter(seriesName) {
              return seriesName ? seriesName + ": " : "";
            }
          }
        },
        z: {
          formatter: void 0,
          title: "Size: "
        },
        marker: {
          show: true,
          fillColors: void 0
        },
        items: {
          display: "flex"
        },
        fixed: {
          enabled: false,
          position: "topRight",
          // topRight, topLeft, bottomRight, bottomLeft
          offsetX: 0,
          offsetY: 0
        }
      },
      xaxis: {
        type: "category",
        categories: [],
        convertedCatToNumeric: false,
        // internal property which should not be altered outside
        offsetX: 0,
        offsetY: 0,
        overwriteCategories: void 0,
        labels: {
          show: true,
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: false,
          minHeight: void 0,
          maxHeight: 120,
          showDuplicates: true,
          style: {
            colors: [],
            fontSize: "12px",
            fontWeight: 400,
            fontFamily: void 0,
            cssClass: ""
          },
          offsetX: 0,
          offsetY: 0,
          format: void 0,
          formatter: void 0,
          // custom formatter function which will override format
          datetimeUTC: true,
          datetimeFormatter: {
            year: "yyyy",
            month: "MMM 'yy",
            day: "dd MMM",
            hour: "HH:mm",
            minute: "HH:mm:ss",
            second: "HH:mm:ss"
          }
        },
        group: {
          groups: [],
          style: {
            colors: [],
            fontSize: "12px",
            fontWeight: 400,
            fontFamily: void 0,
            cssClass: ""
          }
        },
        axisBorder: {
          show: true,
          color: "#e0e0e0",
          width: "100%",
          height: 1,
          offsetX: 0,
          offsetY: 0
        },
        axisTicks: {
          show: true,
          color: "#e0e0e0",
          height: 6,
          offsetX: 0,
          offsetY: 0
        },
        stepSize: void 0,
        tickAmount: void 0,
        tickPlacement: "on",
        min: void 0,
        max: void 0,
        range: void 0,
        floating: false,
        decimalsInFloat: void 0,
        position: "bottom",
        title: {
          text: void 0,
          offsetX: 0,
          offsetY: 0,
          style: {
            color: void 0,
            fontSize: "12px",
            fontWeight: 900,
            fontFamily: void 0,
            cssClass: ""
          }
        },
        crosshairs: {
          show: true,
          width: 1,
          // tickWidth/barWidth or an integer
          position: "back",
          opacity: 0.9,
          stroke: {
            color: "#b6b6b6",
            width: 1,
            dashArray: 3
          },
          fill: {
            type: "solid",
            // solid, gradient
            color: "#B1B9C4",
            gradient: {
              colorFrom: "#D8E3F0",
              colorTo: "#BED1E6",
              stops: [0, 100],
              opacityFrom: 0.4,
              opacityTo: 0.5
            }
          },
          dropShadow: {
            enabled: false,
            left: 0,
            top: 0,
            blur: 1,
            opacity: 0.8
          }
        },
        tooltip: {
          enabled: true,
          offsetY: 0,
          formatter: void 0,
          style: {
            fontSize: "12px",
            fontFamily: void 0
          }
        }
      },
      yaxis: this.yAxis,
      theme: {
        mode: "",
        palette: "palette1",
        // If defined, it will overwrite globals.colors variable
        monochrome: {
          // monochrome allows you to select just 1 color and fill out the rest with light/dark shade (intensity can be selected)
          enabled: false,
          color: "#008FFB",
          shadeTo: "light",
          shadeIntensity: 0.65
        }
      }
    };
  }
}
class Annotations {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.graphics = new Graphics(this.ctx);
    if (this.w.globals.isBarHorizontal) {
      this.invertAxis = true;
    }
    this.helpers = new Helpers$4(this);
    this.xAxisAnnotations = new XAnnotations(this);
    this.yAxisAnnotations = new YAnnotations(this);
    this.pointsAnnotations = new PointAnnotations(this);
    if (this.w.globals.isBarHorizontal && this.w.config.yaxis[0].reversed) {
      this.inversedReversedAxis = true;
    }
    this.xDivision = this.w.globals.gridWidth / this.w.globals.dataPoints;
  }
  drawAxesAnnotations() {
    const w = this.w;
    if (w.globals.axisCharts && w.globals.dataPoints) {
      let yAnnotations = this.yAxisAnnotations.drawYAxisAnnotations();
      let xAnnotations = this.xAxisAnnotations.drawXAxisAnnotations();
      let pointAnnotations = this.pointsAnnotations.drawPointAnnotations();
      const initialAnim = w.config.chart.animations.enabled;
      const annoArray = [yAnnotations, xAnnotations, pointAnnotations];
      const annoElArray = [
        xAnnotations.node,
        yAnnotations.node,
        pointAnnotations.node
      ];
      for (let i = 0; i < 3; i++) {
        w.globals.dom.elGraphical.add(annoArray[i]);
        if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
          if (w.config.chart.type !== "scatter" && w.config.chart.type !== "bubble" && w.globals.dataPoints > 1) {
            annoElArray[i].classList.add("apexcharts-element-hidden");
          }
        }
        w.globals.delayedElements.push({ el: annoElArray[i], index: 0 });
      }
      this.helpers.annotationsBackground();
    }
  }
  drawImageAnnos() {
    const w = this.w;
    w.config.annotations.images.map((s, index) => {
      this.addImage(s, index);
    });
  }
  drawTextAnnos() {
    const w = this.w;
    w.config.annotations.texts.map((t, index) => {
      this.addText(t, index);
    });
  }
  addXaxisAnnotation(anno, parent, index) {
    this.xAxisAnnotations.addXaxisAnnotation(anno, parent, index);
  }
  addYaxisAnnotation(anno, parent, index) {
    this.yAxisAnnotations.addYaxisAnnotation(anno, parent, index);
  }
  addPointAnnotation(anno, parent, index) {
    this.pointsAnnotations.addPointAnnotation(anno, parent, index);
  }
  addText(params, index) {
    const {
      x,
      y,
      text,
      textAnchor,
      foreColor,
      fontSize,
      fontFamily,
      fontWeight,
      cssClass,
      backgroundColor,
      borderWidth,
      strokeDashArray,
      borderRadius,
      borderColor,
      appendTo = ".apexcharts-svg",
      paddingLeft = 4,
      paddingRight = 4,
      paddingBottom = 2,
      paddingTop = 2
    } = params;
    const w = this.w;
    let elText = this.graphics.drawText({
      x,
      y,
      text,
      textAnchor: textAnchor || "start",
      fontSize: fontSize || "12px",
      fontWeight: fontWeight || "regular",
      fontFamily: fontFamily || w.config.chart.fontFamily,
      foreColor: foreColor || w.config.chart.foreColor,
      cssClass: "apexcharts-text " + cssClass ? cssClass : ""
    });
    const parent = w.globals.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(elText.node);
    }
    const textRect = elText.bbox();
    if (text) {
      const elRect = this.graphics.drawRect(
        textRect.x - paddingLeft,
        textRect.y - paddingTop,
        textRect.width + paddingLeft + paddingRight,
        textRect.height + paddingBottom + paddingTop,
        borderRadius,
        backgroundColor ? backgroundColor : "transparent",
        1,
        borderWidth,
        borderColor,
        strokeDashArray
      );
      parent.insertBefore(elRect.node, elText.node);
    }
  }
  addImage(params, index) {
    const w = this.w;
    const {
      path,
      x = 0,
      y = 0,
      width = 20,
      height = 20,
      appendTo = ".apexcharts-svg"
    } = params;
    let img = w.globals.dom.Paper.image(path);
    img.size(width, height).move(x, y);
    const parent = w.globals.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(img.node);
    }
    return img;
  }
  // The addXaxisAnnotation method requires a parent class, and user calling this method externally on the chart instance may not specify parent, hence a different method
  addXaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "xaxis",
      contextMethod: context.addXaxisAnnotation
    });
    return context;
  }
  addYaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "yaxis",
      contextMethod: context.addYaxisAnnotation
    });
    return context;
  }
  addPointAnnotationExternal(params, pushToMemory, context) {
    if (typeof this.invertAxis === "undefined") {
      this.invertAxis = context.w.globals.isBarHorizontal;
    }
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "point",
      contextMethod: context.addPointAnnotation
    });
    return context;
  }
  addAnnotationExternal({
    params,
    pushToMemory,
    context,
    type,
    contextMethod
  }) {
    const me = context;
    const w = me.w;
    const parent = w.globals.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations`
    );
    const index = parent.childNodes.length + 1;
    const options2 = new Options();
    const axesAnno = Object.assign(
      {},
      type === "xaxis" ? options2.xAxisAnnotation : type === "yaxis" ? options2.yAxisAnnotation : options2.pointAnnotation
    );
    const anno = Utils$1.extend(axesAnno, params);
    switch (type) {
      case "xaxis":
        this.addXaxisAnnotation(anno, parent, index);
        break;
      case "yaxis":
        this.addYaxisAnnotation(anno, parent, index);
        break;
      case "point":
        this.addPointAnnotation(anno, parent, index);
        break;
    }
    let axesAnnoLabel = w.globals.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`
    );
    const elRect = this.helpers.addBackgroundToAnno(axesAnnoLabel, anno);
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel);
    }
    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        id: anno.id ? anno.id : Utils$1.randomId(),
        method: contextMethod,
        label: "addAnnotation",
        params
      });
    }
    return context;
  }
  clearAnnotations(ctx) {
    const w = ctx.w;
    let annos = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations"
    );
    for (let i = w.globals.memory.methodsToExec.length - 1; i >= 0; i--) {
      if (w.globals.memory.methodsToExec[i].label === "addText" || w.globals.memory.methodsToExec[i].label === "addAnnotation") {
        w.globals.memory.methodsToExec.splice(i, 1);
      }
    }
    annos = Utils$1.listToArray(annos);
    Array.prototype.forEach.call(annos, (a) => {
      while (a.firstChild) {
        a.removeChild(a.firstChild);
      }
    });
  }
  removeAnnotation(ctx, id) {
    const w = ctx.w;
    let annos = w.globals.dom.baseEl.querySelectorAll(`.${id}`);
    if (annos) {
      w.globals.memory.methodsToExec.map((m, i) => {
        if (m.id === id) {
          w.globals.memory.methodsToExec.splice(i, 1);
        }
      });
      Object.keys(w.config.annotations).forEach((key) => {
        const annotationArray = w.config.annotations[key];
        if (Array.isArray(annotationArray)) {
          w.config.annotations[key] = annotationArray.filter((m) => m.id !== id);
        }
      });
      Array.prototype.forEach.call(annos, (a) => {
        a.parentElement.removeChild(a);
      });
    }
  }
}
const getRangeValues = ({
  isTimeline,
  ctx,
  seriesIndex,
  dataPointIndex,
  y1,
  y2,
  w
}) => {
  var _a;
  let start = w.globals.seriesRangeStart[seriesIndex][dataPointIndex];
  let end = w.globals.seriesRangeEnd[seriesIndex][dataPointIndex];
  let ylabel = w.globals.labels[dataPointIndex];
  let seriesName = w.config.series[seriesIndex].name ? w.config.series[seriesIndex].name : "";
  const yLbFormatter = w.globals.ttKeyFormatter;
  const yLbTitleFormatter = w.config.tooltip.y.title.formatter;
  const opts = {
    w,
    seriesIndex,
    dataPointIndex,
    start,
    end
  };
  if (typeof yLbTitleFormatter === "function") {
    seriesName = yLbTitleFormatter(seriesName, opts);
  }
  if ((_a = w.config.series[seriesIndex].data[dataPointIndex]) == null ? void 0 : _a.x) {
    ylabel = w.config.series[seriesIndex].data[dataPointIndex].x;
  }
  if (!isTimeline) {
    if (w.config.xaxis.type === "datetime") {
      let xFormat = new Formatters(ctx);
      ylabel = xFormat.xLabelFormat(w.globals.ttKeyFormatter, ylabel, ylabel, {
        i: void 0,
        dateFormatter: new DateTime(ctx).formatDate,
        w
      });
    }
  }
  if (typeof yLbFormatter === "function") {
    ylabel = yLbFormatter(ylabel, opts);
  }
  if (Number.isFinite(y1) && Number.isFinite(y2)) {
    start = y1;
    end = y2;
  }
  let startVal = "";
  let endVal = "";
  const color = w.globals.colors[seriesIndex];
  if (w.config.tooltip.x.formatter === void 0) {
    if (w.config.xaxis.type === "datetime") {
      let datetimeObj = new DateTime(ctx);
      startVal = datetimeObj.formatDate(
        datetimeObj.getDate(start),
        w.config.tooltip.x.format
      );
      endVal = datetimeObj.formatDate(
        datetimeObj.getDate(end),
        w.config.tooltip.x.format
      );
    } else {
      startVal = start;
      endVal = end;
    }
  } else {
    startVal = w.config.tooltip.x.formatter(start);
    endVal = w.config.tooltip.x.formatter(end);
  }
  return { start, end, startVal, endVal, ylabel, color, seriesName };
};
const buildRangeTooltipHTML = (opts) => {
  let { color, seriesName, ylabel, start, end, seriesIndex, dataPointIndex } = opts;
  const formatter = opts.ctx.tooltip.tooltipLabels.getFormatters(seriesIndex);
  start = formatter.yLbFormatter(start);
  end = formatter.yLbFormatter(end);
  const val = formatter.yLbFormatter(
    opts.w.globals.series[seriesIndex][dataPointIndex]
  );
  let valueHTML = "";
  const rangeValues = `<span class="value start-value">
  ${start}
  </span> <span class="separator">-</span> <span class="value end-value">
  ${end}
  </span>`;
  if (opts.w.globals.comboCharts) {
    if (opts.w.config.series[seriesIndex].type === "rangeArea" || opts.w.config.series[seriesIndex].type === "rangeBar") {
      valueHTML = rangeValues;
    } else {
      valueHTML = `<span>${val}</span>`;
    }
  } else {
    valueHTML = rangeValues;
  }
  return '<div class="apexcharts-tooltip-rangebar"><div> <span class="series-name" style="color: ' + color + '">' + (seriesName ? seriesName : "") + '</span></div><div> <span class="category">' + ylabel + ": </span> " + valueHTML + " </div></div>";
};
class Defaults {
  constructor(opts) {
    this.opts = opts;
  }
  hideYAxis() {
    this.opts.yaxis[0].show = false;
    this.opts.yaxis[0].title.text = "";
    this.opts.yaxis[0].axisBorder.show = false;
    this.opts.yaxis[0].axisTicks.show = false;
    this.opts.yaxis[0].floating = true;
  }
  line() {
    return {
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 5,
        curve: "straight"
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }
    };
  }
  sparkline(defaults) {
    this.hideYAxis();
    const ret = {
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      legend: {
        show: false
      },
      xaxis: {
        labels: {
          show: false
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      chart: {
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      }
    };
    return Utils$1.extend(defaults, ret);
  }
  slope() {
    this.hideYAxis();
    return {
      chart: {
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter(val, opts) {
          const seriesName = opts.w.config.series[opts.seriesIndex].name;
          return val !== null ? seriesName + ": " + val : "";
        },
        background: {
          enabled: false
        },
        offsetX: -5
      },
      grid: {
        xaxis: {
          lines: {
            show: true
          }
        },
        yaxis: {
          lines: {
            show: false
          }
        }
      },
      xaxis: {
        position: "top",
        labels: {
          style: {
            fontSize: 14,
            fontWeight: 900
          }
        },
        tooltip: {
          enabled: false
        },
        crosshairs: {
          show: false
        }
      },
      markers: {
        size: 8,
        hover: {
          sizeOffset: 1
        }
      },
      legend: {
        show: false
      },
      tooltip: {
        shared: false,
        intersect: true,
        followCursor: true
      },
      stroke: {
        width: 5,
        curve: "straight"
      }
    };
  }
  bar() {
    return {
      chart: {
        stacked: false
      },
      plotOptions: {
        bar: {
          dataLabels: {
            position: "center"
          }
        }
      },
      dataLabels: {
        style: {
          colors: ["#fff"]
        },
        background: {
          enabled: false
        }
      },
      stroke: {
        width: 0,
        lineCap: "square"
      },
      fill: {
        opacity: 0.85
      },
      legend: {
        markers: {
          shape: "square"
        }
      },
      tooltip: {
        shared: false,
        intersect: true
      },
      xaxis: {
        tooltip: {
          enabled: false
        },
        tickPlacement: "between",
        crosshairs: {
          width: "barWidth",
          position: "back",
          fill: {
            type: "gradient"
          },
          dropShadow: {
            enabled: false
          },
          stroke: {
            width: 0
          }
        }
      }
    };
  }
  funnel() {
    this.hideYAxis();
    return __spreadProps(__spreadValues({}, this.bar()), {
      chart: {
        animations: {
          speed: 800,
          animateGradually: {
            enabled: false
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadiusApplication: "around",
          borderRadius: 0,
          dataLabels: {
            position: "center"
          }
        }
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0
        }
      },
      xaxis: {
        labels: {
          show: false
        },
        tooltip: {
          enabled: false
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      }
    });
  }
  candlestick() {
    return {
      stroke: {
        width: 1
      },
      fill: {
        opacity: 1
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: true,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          return this._getBoxTooltip(
            w,
            seriesIndex,
            dataPointIndex,
            ["Open", "High", "", "Low", "Close"],
            "candlestick"
          );
        }
      },
      states: {
        active: {
          filter: {
            type: "none"
          }
        }
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }
    };
  }
  boxPlot() {
    return {
      chart: {
        animations: {
          dynamicAnimation: {
            enabled: false
          }
        }
      },
      stroke: {
        width: 1,
        colors: ["#24292e"]
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: true,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          return this._getBoxTooltip(
            w,
            seriesIndex,
            dataPointIndex,
            ["Minimum", "Q1", "Median", "Q3", "Maximum"],
            "boxPlot"
          );
        }
      },
      markers: {
        size: 7,
        strokeWidth: 1,
        strokeColors: "#111"
      },
      xaxis: {
        crosshairs: {
          width: 1
        }
      }
    };
  }
  rangeBar() {
    const handleTimelineTooltip = (opts) => {
      const { color, seriesName, ylabel, startVal, endVal } = getRangeValues(__spreadProps(__spreadValues({}, opts), {
        isTimeline: true
      }));
      return buildRangeTooltipHTML(__spreadProps(__spreadValues({}, opts), {
        color,
        seriesName,
        ylabel,
        start: startVal,
        end: endVal
      }));
    };
    const handleRangeColumnTooltip = (opts) => {
      const { color, seriesName, ylabel, start, end } = getRangeValues(opts);
      return buildRangeTooltipHTML(__spreadProps(__spreadValues({}, opts), {
        color,
        seriesName,
        ylabel,
        start,
        end
      }));
    };
    return {
      chart: {
        animations: {
          animateGradually: false
        }
      },
      stroke: {
        width: 0,
        lineCap: "square"
      },
      plotOptions: {
        bar: {
          borderRadius: 0,
          dataLabels: {
            position: "center"
          }
        }
      },
      dataLabels: {
        enabled: false,
        formatter(val, { ctx, seriesIndex, dataPointIndex, w }) {
          const getVal = () => {
            const start = w.globals.seriesRangeStart[seriesIndex][dataPointIndex];
            const end = w.globals.seriesRangeEnd[seriesIndex][dataPointIndex];
            return end - start;
          };
          if (w.globals.comboCharts) {
            if (w.config.series[seriesIndex].type === "rangeBar" || w.config.series[seriesIndex].type === "rangeArea") {
              return getVal();
            } else {
              return val;
            }
          } else {
            return getVal();
          }
        },
        background: {
          enabled: false
        },
        style: {
          colors: ["#fff"]
        }
      },
      markers: {
        size: 10
      },
      tooltip: {
        shared: false,
        followCursor: true,
        custom(opts) {
          if (opts.w.config.plotOptions && opts.w.config.plotOptions.bar && opts.w.config.plotOptions.bar.horizontal) {
            return handleTimelineTooltip(opts);
          } else {
            return handleRangeColumnTooltip(opts);
          }
        }
      },
      xaxis: {
        tickPlacement: "between",
        tooltip: {
          enabled: false
        },
        crosshairs: {
          stroke: {
            width: 0
          }
        }
      }
    };
  }
  dumbbell(opts) {
    var _a, _b;
    if (!((_a = opts.plotOptions.bar) == null ? void 0 : _a.barHeight)) {
      opts.plotOptions.bar.barHeight = 2;
    }
    if (!((_b = opts.plotOptions.bar) == null ? void 0 : _b.columnWidth)) {
      opts.plotOptions.bar.columnWidth = 2;
    }
    return opts;
  }
  area() {
    return {
      stroke: {
        width: 4,
        fill: {
          type: "solid",
          gradient: {
            inverseColors: false,
            shade: "light",
            type: "vertical",
            opacityFrom: 0.65,
            opacityTo: 0.5,
            stops: [0, 100, 100]
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          inverseColors: false,
          shade: "light",
          type: "vertical",
          opacityFrom: 0.65,
          opacityTo: 0.5,
          stops: [0, 100, 100]
        }
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      tooltip: {
        followCursor: false
      }
    };
  }
  rangeArea() {
    const handleRangeAreaTooltip = (opts) => {
      const { color, seriesName, ylabel, start, end } = getRangeValues(opts);
      return buildRangeTooltipHTML(__spreadProps(__spreadValues({}, opts), {
        color,
        seriesName,
        ylabel,
        start,
        end
      }));
    };
    return {
      stroke: {
        curve: "straight",
        width: 0
      },
      fill: {
        type: "solid",
        opacity: 0.6
      },
      markers: {
        size: 0
      },
      states: {
        hover: {
          filter: {
            type: "none"
          }
        },
        active: {
          filter: {
            type: "none"
          }
        }
      },
      tooltip: {
        intersect: false,
        shared: true,
        followCursor: true,
        custom(opts) {
          return handleRangeAreaTooltip(opts);
        }
      }
    };
  }
  brush(defaults) {
    const ret = {
      chart: {
        toolbar: {
          autoSelected: "selection",
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        width: 1
      },
      tooltip: {
        enabled: false
      },
      xaxis: {
        tooltip: {
          enabled: false
        }
      }
    };
    return Utils$1.extend(defaults, ret);
  }
  stacked100(opts) {
    opts.dataLabels = opts.dataLabels || {};
    opts.dataLabels.formatter = opts.dataLabels.formatter || void 0;
    const existingDataLabelFormatter = opts.dataLabels.formatter;
    opts.yaxis.forEach((yaxe, index) => {
      opts.yaxis[index].min = 0;
      opts.yaxis[index].max = 100;
    });
    const isBar = opts.chart.type === "bar";
    if (isBar) {
      opts.dataLabels.formatter = existingDataLabelFormatter || function(val) {
        if (typeof val === "number") {
          return val ? val.toFixed(0) + "%" : val;
        }
        return val;
      };
    }
    return opts;
  }
  stackedBars() {
    const barDefaults = this.bar();
    return __spreadProps(__spreadValues({}, barDefaults), {
      plotOptions: __spreadProps(__spreadValues({}, barDefaults.plotOptions), {
        bar: __spreadProps(__spreadValues({}, barDefaults.plotOptions.bar), {
          borderRadiusApplication: "end",
          borderRadiusWhenStacked: "last"
        })
      })
    });
  }
  // This function removes the left and right spacing in chart for line/area/scatter if xaxis type = category for those charts by converting xaxis = numeric. Numeric/Datetime xaxis prevents the unnecessary spacing in the left/right of the chart area
  convertCatToNumeric(opts) {
    opts.xaxis.convertedCatToNumeric = true;
    return opts;
  }
  convertCatToNumericXaxis(opts, ctx, cats) {
    opts.xaxis.type = "numeric";
    opts.xaxis.labels = opts.xaxis.labels || {};
    opts.xaxis.labels.formatter = opts.xaxis.labels.formatter || function(val) {
      return Utils$1.isNumber(val) ? Math.floor(val) : val;
    };
    const defaultFormatter = opts.xaxis.labels.formatter;
    let labels = opts.xaxis.categories && opts.xaxis.categories.length ? opts.xaxis.categories : opts.labels;
    if (cats && cats.length) {
      labels = cats.map((c) => {
        return Array.isArray(c) ? c : String(c);
      });
    }
    if (labels && labels.length) {
      opts.xaxis.labels.formatter = function(val) {
        return Utils$1.isNumber(val) ? defaultFormatter(labels[Math.floor(val) - 1]) : defaultFormatter(val);
      };
    }
    opts.xaxis.categories = [];
    opts.labels = [];
    opts.xaxis.tickAmount = opts.xaxis.tickAmount || "dataPoints";
    return opts;
  }
  bubble() {
    return {
      dataLabels: {
        style: {
          colors: ["#fff"]
        }
      },
      tooltip: {
        shared: false,
        intersect: true
      },
      xaxis: {
        crosshairs: {
          width: 0
        }
      },
      fill: {
        type: "solid",
        gradient: {
          shade: "light",
          inverse: true,
          shadeIntensity: 0.55,
          opacityFrom: 0.4,
          opacityTo: 0.8
        }
      }
    };
  }
  scatter() {
    return {
      dataLabels: {
        enabled: false
      },
      tooltip: {
        shared: false,
        intersect: true
      },
      markers: {
        size: 6,
        strokeWidth: 1,
        hover: {
          sizeOffset: 2
        }
      }
    };
  }
  heatmap() {
    return {
      chart: {
        stacked: false
      },
      fill: {
        opacity: 1
      },
      dataLabels: {
        style: {
          colors: ["#fff"]
        }
      },
      stroke: {
        colors: ["#fff"]
      },
      tooltip: {
        followCursor: true,
        marker: {
          show: false
        },
        x: {
          show: false
        }
      },
      legend: {
        position: "top",
        markers: {
          shape: "square"
        }
      },
      grid: {
        padding: {
          right: 20
        }
      }
    };
  }
  treemap() {
    return {
      chart: {
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        style: {
          fontSize: 14,
          fontWeight: 600,
          colors: ["#fff"]
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["#fff"]
      },
      legend: {
        show: false
      },
      fill: {
        opacity: 1,
        gradient: {
          stops: [0, 100]
        }
      },
      tooltip: {
        followCursor: true,
        x: {
          show: false
        }
      },
      grid: {
        padding: {
          left: 0,
          right: 0
        }
      },
      xaxis: {
        crosshairs: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      }
    };
  }
  pie() {
    return {
      chart: {
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: false
            }
          }
        }
      },
      dataLabels: {
        formatter(val) {
          return val.toFixed(1) + "%";
        },
        style: {
          colors: ["#fff"]
        },
        background: {
          enabled: false
        },
        dropShadow: {
          enabled: true
        }
      },
      stroke: {
        colors: ["#fff"]
      },
      fill: {
        opacity: 1,
        gradient: {
          shade: "light",
          stops: [0, 100]
        }
      },
      tooltip: {
        theme: "dark",
        fillSeriesColor: true
      },
      legend: {
        position: "right"
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      }
    };
  }
  donut() {
    return {
      chart: {
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        formatter(val) {
          return val.toFixed(1) + "%";
        },
        style: {
          colors: ["#fff"]
        },
        background: {
          enabled: false
        },
        dropShadow: {
          enabled: true
        }
      },
      stroke: {
        colors: ["#fff"]
      },
      fill: {
        opacity: 1,
        gradient: {
          shade: "light",
          shadeIntensity: 0.35,
          stops: [80, 100],
          opacityFrom: 1,
          opacityTo: 1
        }
      },
      tooltip: {
        theme: "dark",
        fillSeriesColor: true
      },
      legend: {
        position: "right"
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      }
    };
  }
  polarArea() {
    return {
      chart: {
        toolbar: {
          show: false
        }
      },
      dataLabels: {
        formatter(val) {
          return val.toFixed(1) + "%";
        },
        enabled: false
      },
      stroke: {
        show: true,
        width: 2
      },
      fill: {
        opacity: 0.7
      },
      tooltip: {
        theme: "dark",
        fillSeriesColor: true
      },
      legend: {
        position: "right"
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      }
    };
  }
  radar() {
    this.opts.yaxis[0].labels.offsetY = this.opts.yaxis[0].labels.offsetY ? this.opts.yaxis[0].labels.offsetY : 6;
    return {
      dataLabels: {
        enabled: false,
        style: {
          fontSize: "11px"
        }
      },
      stroke: {
        width: 2
      },
      markers: {
        size: 5,
        strokeWidth: 1,
        strokeOpacity: 1
      },
      fill: {
        opacity: 0.2
      },
      tooltip: {
        shared: false,
        intersect: true,
        followCursor: true
      },
      grid: {
        show: false,
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      },
      xaxis: {
        labels: {
          formatter: (val) => val,
          style: {
            colors: ["#a8a8a8"],
            fontSize: "11px"
          }
        },
        tooltip: {
          enabled: false
        },
        crosshairs: {
          show: false
        }
      }
    };
  }
  radialBar() {
    return {
      chart: {
        animations: {
          dynamicAnimation: {
            enabled: true,
            speed: 800
          }
        },
        toolbar: {
          show: false
        }
      },
      fill: {
        gradient: {
          shade: "dark",
          shadeIntensity: 0.4,
          inverseColors: false,
          type: "diagonal2",
          opacityFrom: 1,
          opacityTo: 1,
          stops: [70, 98, 100]
        }
      },
      legend: {
        show: false,
        position: "right"
      },
      tooltip: {
        enabled: false,
        fillSeriesColor: true
      },
      grid: {
        padding: {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
      }
    };
  }
  _getBoxTooltip(w, seriesIndex, dataPointIndex, labels, chartType) {
    const o = w.globals.seriesCandleO[seriesIndex][dataPointIndex];
    const h = w.globals.seriesCandleH[seriesIndex][dataPointIndex];
    const m = w.globals.seriesCandleM[seriesIndex][dataPointIndex];
    const l = w.globals.seriesCandleL[seriesIndex][dataPointIndex];
    const c = w.globals.seriesCandleC[seriesIndex][dataPointIndex];
    if (w.config.series[seriesIndex].type && w.config.series[seriesIndex].type !== chartType) {
      return `<div class="apexcharts-custom-tooltip">
          ${w.config.series[seriesIndex].name ? w.config.series[seriesIndex].name : "series-" + (seriesIndex + 1)}: <strong>${w.globals.series[seriesIndex][dataPointIndex]}</strong>
        </div>`;
    } else {
      return `<div class="apexcharts-tooltip-box apexcharts-tooltip-${w.config.chart.type}"><div>${labels[0]}: <span class="value">` + o + `</span></div><div>${labels[1]}: <span class="value">` + h + "</span></div>" + (m ? `<div>${labels[2]}: <span class="value">` + m + "</span></div>" : "") + `<div>${labels[3]}: <span class="value">` + l + `</span></div><div>${labels[4]}: <span class="value">` + c + "</span></div></div>";
    }
  }
}
class Config {
  constructor(opts) {
    this.opts = opts;
  }
  init({ responsiveOverride }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    let opts = this.opts;
    let options2 = new Options();
    let defaults = new Defaults(opts);
    this.chartType = opts.chart.type;
    opts = this.extendYAxis(opts);
    opts = this.extendAnnotations(opts);
    let config = options2.init();
    let newDefaults = {};
    if (opts && typeof opts === "object") {
      let chartDefaults = {};
      const chartTypes = [
        "line",
        "area",
        "bar",
        "candlestick",
        "boxPlot",
        "rangeBar",
        "rangeArea",
        "bubble",
        "scatter",
        "heatmap",
        "treemap",
        "pie",
        "polarArea",
        "donut",
        "radar",
        "radialBar"
      ];
      if (chartTypes.indexOf(opts.chart.type) !== -1) {
        chartDefaults = defaults[opts.chart.type]();
      } else {
        chartDefaults = defaults.line();
      }
      if ((_b = (_a = opts.plotOptions) == null ? void 0 : _a.bar) == null ? void 0 : _b.isFunnel) {
        chartDefaults = defaults.funnel();
      }
      if (opts.chart.stacked && opts.chart.type === "bar") {
        chartDefaults = defaults.stackedBars();
      }
      if ((_c = opts.chart.brush) == null ? void 0 : _c.enabled) {
        chartDefaults = defaults.brush(chartDefaults);
      }
      if ((_e = (_d = opts.plotOptions) == null ? void 0 : _d.line) == null ? void 0 : _e.isSlopeChart) {
        chartDefaults = defaults.slope();
      }
      if (opts.chart.stacked && opts.chart.stackType === "100%") {
        opts = defaults.stacked100(opts);
      }
      if ((_g = (_f = opts.plotOptions) == null ? void 0 : _f.bar) == null ? void 0 : _g.isDumbbell) {
        opts = defaults.dumbbell(opts);
      }
      this.checkForDarkTheme(window.Apex);
      this.checkForDarkTheme(opts);
      opts.xaxis = opts.xaxis || window.Apex.xaxis || {};
      if (!responsiveOverride) {
        opts.xaxis.convertedCatToNumeric = false;
      }
      opts = this.checkForCatToNumericXAxis(this.chartType, chartDefaults, opts);
      if (((_h = opts.chart.sparkline) == null ? void 0 : _h.enabled) || ((_j = (_i = window.Apex.chart) == null ? void 0 : _i.sparkline) == null ? void 0 : _j.enabled)) {
        chartDefaults = defaults.sparkline(chartDefaults);
      }
      newDefaults = Utils$1.extend(config, chartDefaults);
    }
    let mergedWithDefaultConfig = Utils$1.extend(newDefaults, window.Apex);
    config = Utils$1.extend(mergedWithDefaultConfig, opts);
    config = this.handleUserInputErrors(config);
    return config;
  }
  checkForCatToNumericXAxis(chartType, chartDefaults, opts) {
    var _a, _b;
    let defaults = new Defaults(opts);
    const isBarHorizontal = (chartType === "bar" || chartType === "boxPlot") && ((_b = (_a = opts.plotOptions) == null ? void 0 : _a.bar) == null ? void 0 : _b.horizontal);
    const unsupportedZoom = chartType === "pie" || chartType === "polarArea" || chartType === "donut" || chartType === "radar" || chartType === "radialBar" || chartType === "heatmap";
    const notNumericXAxis = opts.xaxis.type !== "datetime" && opts.xaxis.type !== "numeric";
    let tickPlacement = opts.xaxis.tickPlacement ? opts.xaxis.tickPlacement : chartDefaults.xaxis && chartDefaults.xaxis.tickPlacement;
    if (!isBarHorizontal && !unsupportedZoom && notNumericXAxis && tickPlacement !== "between") {
      opts = defaults.convertCatToNumeric(opts);
    }
    return opts;
  }
  extendYAxis(opts, w) {
    let options2 = new Options();
    if (typeof opts.yaxis === "undefined" || !opts.yaxis || Array.isArray(opts.yaxis) && opts.yaxis.length === 0) {
      opts.yaxis = {};
    }
    if (opts.yaxis.constructor !== Array && window.Apex.yaxis && window.Apex.yaxis.constructor !== Array) {
      opts.yaxis = Utils$1.extend(opts.yaxis, window.Apex.yaxis);
    }
    if (opts.yaxis.constructor !== Array) {
      opts.yaxis = [Utils$1.extend(options2.yAxis, opts.yaxis)];
    } else {
      opts.yaxis = Utils$1.extendArray(opts.yaxis, options2.yAxis);
    }
    let isLogY = false;
    opts.yaxis.forEach((y) => {
      if (y.logarithmic) {
        isLogY = true;
      }
    });
    let series = opts.series;
    if (w && !series) {
      series = w.config.series;
    }
    if (isLogY && series.length !== opts.yaxis.length && series.length) {
      opts.yaxis = series.map((s, i) => {
        if (!s.name) {
          series[i].name = `series-${i + 1}`;
        }
        if (opts.yaxis[i]) {
          opts.yaxis[i].seriesName = series[i].name;
          return opts.yaxis[i];
        } else {
          const newYaxis = Utils$1.extend(options2.yAxis, opts.yaxis[0]);
          newYaxis.show = false;
          return newYaxis;
        }
      });
    }
    if (isLogY && series.length > 1 && series.length !== opts.yaxis.length) {
      console.warn(
        "A multi-series logarithmic chart should have equal number of series and y-axes"
      );
    }
    return opts;
  }
  // annotations also accepts array, so we need to extend them manually
  extendAnnotations(opts) {
    if (typeof opts.annotations === "undefined") {
      opts.annotations = {};
      opts.annotations.yaxis = [];
      opts.annotations.xaxis = [];
      opts.annotations.points = [];
    }
    opts = this.extendYAxisAnnotations(opts);
    opts = this.extendXAxisAnnotations(opts);
    opts = this.extendPointAnnotations(opts);
    return opts;
  }
  extendYAxisAnnotations(opts) {
    let options2 = new Options();
    opts.annotations.yaxis = Utils$1.extendArray(
      typeof opts.annotations.yaxis !== "undefined" ? opts.annotations.yaxis : [],
      options2.yAxisAnnotation
    );
    return opts;
  }
  extendXAxisAnnotations(opts) {
    let options2 = new Options();
    opts.annotations.xaxis = Utils$1.extendArray(
      typeof opts.annotations.xaxis !== "undefined" ? opts.annotations.xaxis : [],
      options2.xAxisAnnotation
    );
    return opts;
  }
  extendPointAnnotations(opts) {
    let options2 = new Options();
    opts.annotations.points = Utils$1.extendArray(
      typeof opts.annotations.points !== "undefined" ? opts.annotations.points : [],
      options2.pointAnnotation
    );
    return opts;
  }
  checkForDarkTheme(opts) {
    if (opts.theme && opts.theme.mode === "dark") {
      if (!opts.tooltip) {
        opts.tooltip = {};
      }
      if (opts.tooltip.theme !== "light") {
        opts.tooltip.theme = "dark";
      }
      if (!opts.chart.foreColor) {
        opts.chart.foreColor = "#f6f7f8";
      }
      if (!opts.theme.palette) {
        opts.theme.palette = "palette4";
      }
    }
  }
  handleUserInputErrors(opts) {
    let config = opts;
    if (config.tooltip.shared && config.tooltip.intersect) {
      throw new Error(
        "tooltip.shared cannot be enabled when tooltip.intersect is true. Turn off any other option by setting it to false."
      );
    }
    if (config.chart.type === "bar" && config.plotOptions.bar.horizontal) {
      if (config.yaxis.length > 1) {
        throw new Error(
          "Multiple Y Axis for bars are not supported. Switch to column chart by setting plotOptions.bar.horizontal=false"
        );
      }
      if (config.yaxis[0].reversed) {
        config.yaxis[0].opposite = true;
      }
      config.xaxis.tooltip.enabled = false;
      config.yaxis[0].tooltip.enabled = false;
      config.chart.zoom.enabled = false;
    }
    if (config.chart.type === "bar" || config.chart.type === "rangeBar") {
      if (config.tooltip.shared) {
        if (config.xaxis.crosshairs.width === "barWidth" && config.series.length > 1) {
          config.xaxis.crosshairs.width = "tickWidth";
        }
      }
    }
    if (config.chart.type === "candlestick" || config.chart.type === "boxPlot") {
      if (config.yaxis[0].reversed) {
        console.warn(
          `Reversed y-axis in ${config.chart.type} chart is not supported.`
        );
        config.yaxis[0].reversed = false;
      }
    }
    return config;
  }
}
class Globals {
  initGlobalVars(gl) {
    gl.series = [];
    gl.seriesCandleO = [];
    gl.seriesCandleH = [];
    gl.seriesCandleM = [];
    gl.seriesCandleL = [];
    gl.seriesCandleC = [];
    gl.seriesRangeStart = [];
    gl.seriesRangeEnd = [];
    gl.seriesRange = [];
    gl.seriesPercent = [];
    gl.seriesGoals = [];
    gl.seriesX = [];
    gl.seriesZ = [];
    gl.seriesNames = [];
    gl.seriesTotals = [];
    gl.seriesLog = [];
    gl.seriesColors = [];
    gl.stackedSeriesTotals = [];
    gl.seriesXvalues = [];
    gl.seriesYvalues = [];
    gl.dataWasParsed = false;
    gl.originalSeries = null;
    gl.labels = [];
    gl.hasXaxisGroups = false;
    gl.groups = [];
    gl.barGroups = [];
    gl.lineGroups = [];
    gl.areaGroups = [];
    gl.hasSeriesGroups = false;
    gl.seriesGroups = [];
    gl.categoryLabels = [];
    gl.timescaleLabels = [];
    gl.noLabelsProvided = false;
    gl.resizeTimer = null;
    gl.selectionResizeTimer = null;
    gl.lastWheelExecution = 0;
    gl.delayedElements = [];
    gl.pointsArray = [];
    gl.dataLabelsRects = [];
    gl.textRectsCache = /* @__PURE__ */ new Map();
    gl.domCache = /* @__PURE__ */ new Map();
    gl.dimensionCache = {};
    gl.cachedSelectors = {};
    gl.isXNumeric = false;
    gl.skipLastTimelinelabel = false;
    gl.skipFirstTimelinelabel = false;
    gl.isDataXYZ = false;
    gl.isMultiLineX = false;
    gl.isMultipleYAxis = false;
    gl.maxY = -Number.MAX_VALUE;
    gl.minY = Number.MIN_VALUE;
    gl.minYArr = [];
    gl.maxYArr = [];
    gl.maxX = -Number.MAX_VALUE;
    gl.minX = Number.MAX_VALUE;
    gl.initialMaxX = -Number.MAX_VALUE;
    gl.initialMinX = Number.MAX_VALUE;
    gl.maxDate = 0;
    gl.minDate = Number.MAX_VALUE;
    gl.minZ = Number.MAX_VALUE;
    gl.maxZ = -Number.MAX_VALUE;
    gl.minXDiff = Number.MAX_VALUE;
    gl.yAxisScale = [];
    gl.xAxisScale = null;
    gl.xAxisTicksPositions = [];
    gl.yLabelsCoords = [];
    gl.yTitleCoords = [];
    gl.barPadForNumericAxis = 0;
    gl.padHorizontal = 0;
    gl.xRange = 0;
    gl.yRange = [];
    gl.zRange = 0;
    gl.dataPoints = 0;
    gl.xTickAmount = 0;
    gl.multiAxisTickAmount = 0;
  }
  globalVars(config) {
    return {
      chartID: null,
      // chart ID - apexcharts-cuid
      cuid: null,
      // chart ID - random numbers excluding "apexcharts" part
      events: {
        beforeMount: [],
        mounted: [],
        updated: [],
        clicked: [],
        selection: [],
        dataPointSelection: [],
        zoomed: [],
        scrolled: []
      },
      colors: [],
      clientX: null,
      clientY: null,
      fill: {
        colors: []
      },
      stroke: {
        colors: []
      },
      dataLabels: {
        style: {
          colors: []
        }
      },
      radarPolygons: {
        fill: {
          colors: []
        }
      },
      markers: {
        colors: [],
        size: config.markers.size,
        largestSize: 0
      },
      animationEnded: false,
      isTouchDevice: "ontouchstart" in window || navigator.msMaxTouchPoints,
      isDirty: false,
      // chart has been updated after the initial render. This is different than dataChanged property. isDirty means user manually called some method to update
      isExecCalled: false,
      // whether user updated the chart through the exec method
      initialConfig: null,
      // we will store the first config user has set to go back when user finishes interactions like zooming and come out of it
      initialSeries: [],
      lastXAxis: [],
      lastYAxis: [],
      columnSeries: null,
      labels: [],
      // store the text to draw on x axis
      // Don't mutate the labels, many things including tooltips depends on it!
      timescaleLabels: [],
      // store the timescaleLabels Labels in another variable
      noLabelsProvided: false,
      // if user didn't provide any categories/labels or x values, fallback to 1,2,3,4...
      allSeriesCollapsed: false,
      collapsedSeries: [],
      // when user collapses a series, it goes into this array
      collapsedSeriesIndices: [],
      // this stores the index of the collapsedSeries instead of whole object for quick access
      ancillaryCollapsedSeries: [],
      // when user collapses an "alwaysVisible" series, it goes into this array
      ancillaryCollapsedSeriesIndices: [],
      // this stores the index of the ancillaryCollapsedSeries whose y-axis is always visible
      risingSeries: [],
      // when user re-opens a collapsed series, it goes here
      dataFormatXNumeric: false,
      // boolean value to indicate user has passed numeric x values
      capturedSeriesIndex: -1,
      capturedDataPointIndex: -1,
      selectedDataPoints: [],
      invalidLogScale: false,
      // if a user enabled log scale but the data provided is not valid to generate a log scale, turn on this flag
      ignoreYAxisIndexes: [],
      // when series are being collapsed in multiple y axes, ignore certain index
      maxValsInArrayIndex: 0,
      radialSize: 0,
      selection: void 0,
      zoomEnabled: config.chart.toolbar.autoSelected === "zoom" && config.chart.toolbar.tools.zoom && config.chart.zoom.enabled,
      panEnabled: config.chart.toolbar.autoSelected === "pan" && config.chart.toolbar.tools.pan,
      selectionEnabled: config.chart.toolbar.autoSelected === "selection" && config.chart.toolbar.tools.selection,
      yaxis: null,
      mousedown: false,
      lastClientPosition: {},
      // don't reset this variable this the chart is destroyed. It is used to detect right or left mousemove in panning
      visibleXRange: void 0,
      yValueDecimal: 0,
      // are there floating numbers in the series. If yes, this represent the len of the decimals
      total: 0,
      SVGNS: "http://www.w3.org/2000/svg",
      // svg namespace
      svgWidth: 0,
      // the whole svg width
      svgHeight: 0,
      // the whole svg height
      noData: false,
      // whether there is any data to display or not
      locale: {},
      // the current locale values will be preserved here for global access
      dom: {},
      // for storing all dom nodes in this particular property
      memory: {
        methodsToExec: []
      },
      domCache: /* @__PURE__ */ new Map(),
      dimensionCache: {},
      cachedSelectors: {},
      resizeObserver: null,
      shouldAnimate: true,
      skipLastTimelinelabel: false,
      // when last label is cropped, skip drawing it
      skipFirstTimelinelabel: false,
      // when first label is cropped, skip drawing it
      delayedElements: [],
      // element which appear after animation has finished
      axisCharts: true,
      // chart type = line or area or bar
      // (refer them also as plot charts in the code)
      isDataXYZ: false,
      // bool: data was provided in a {[x,y,z]} pattern
      isSlopeChart: config.plotOptions.line.isSlopeChart,
      resized: false,
      // bool: user has resized
      resizeTimer: null,
      // timeout function to make a small delay before
      // drawing when user resized
      comboCharts: false,
      // bool: whether it's a combination of line/column
      dataChanged: false,
      // bool: has data changed dynamically
      previousPaths: [],
      // array: when data is changed, it will animate from
      // previous paths
      allSeriesHasEqualX: true,
      pointsArray: [],
      // store the points positions here to draw later on hover
      // format is - [[x,y],[x,y]... [x,y]]
      dataLabelsRects: [],
      // store the positions of datalabels to prevent collision
      lastDrawnDataLabelsIndexes: [],
      hasNullValues: false,
      // bool: whether series contains null values
      zoomed: false,
      // whether user has zoomed or not
      gridWidth: 0,
      // drawable width of actual graphs (series paths)
      gridHeight: 0,
      // drawable height of actual graphs (series paths)
      rotateXLabels: false,
      defaultLabels: false,
      xLabelFormatter: void 0,
      // formatter for x axis labels
      yLabelFormatters: [],
      xaxisTooltipFormatter: void 0,
      // formatter for x axis tooltip
      ttKeyFormatter: void 0,
      ttVal: void 0,
      ttZFormatter: void 0,
      LINE_HEIGHT_RATIO: 1.618,
      xAxisLabelsHeight: 0,
      xAxisGroupLabelsHeight: 0,
      xAxisLabelsWidth: 0,
      yAxisLabelsWidth: 0,
      scaleX: 1,
      scaleY: 1,
      translateX: 0,
      translateY: 0,
      translateYAxisX: [],
      yAxisWidths: [],
      translateXAxisY: 0,
      translateXAxisX: 0,
      tooltip: null,
      // Rules for niceScaleAllowedMagMsd:
      // 1) An array of two arrays only ([[],[]]):
      //    * array[0][]: influences labelling of data series that contain only integers
      //       - must contain only integers (or expect ugly ticks)
      //    * array[1][]: influences labelling of data series that contain at least one float
      //       - may contain floats
      //    * both arrays:
      //       - each array[][i] ideally satisfy: 10 mod array[][i] == 0 (or expect ugly ticks)
      //       - to avoid clipping data point keep each array[][i] >= i
      // 2) each array[i][] contains 11 values, for all possible index values 0..10.
      //    array[][0] should not be needed (not proven) but ensures non-zero is returned.
      //
      // Users can effectively force their preferred "magMsd" through stepSize and
      // forceNiceScale. With forceNiceScale: true, stepSize becomes normalizable to the
      // axis's min..max range, which allows users to set stepSize to an integer 1..10, for
      // example, stepSize: 3. This value will be preferred to the value determined through
      // this array. The range-normalized value is checked for consistency with other
      // user defined options and will be ignored if inconsistent.
      niceScaleAllowedMagMsd: [
        [1, 1, 2, 5, 5, 5, 10, 10, 10, 10, 10],
        [1, 1, 2, 5, 5, 5, 10, 10, 10, 10, 10]
      ],
      // Default ticks based on SVG size. These values have high numbers
      // of divisors. The array is indexed using a calculated maxTicks value
      // divided by 2 simply to halve the array size. See Scales.niceScale().
      niceScaleDefaultTicks: [
        1,
        2,
        4,
        4,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        6,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        12,
        24
      ],
      seriesYAxisMap: [],
      // Given yAxis index, return all series indices belonging to it. Multiple series can be referenced to each yAxis.
      seriesYAxisReverseMap: []
      // Given a Series index, return its yAxis index.
    };
  }
  init(config) {
    let globals = this.globalVars(config);
    this.initGlobalVars(globals);
    globals.initialConfig = Utils$1.extend({}, config);
    globals.initialSeries = Utils$1.clone(config.series);
    globals.lastXAxis = Utils$1.clone(globals.initialConfig.xaxis);
    globals.lastYAxis = Utils$1.clone(globals.initialConfig.yaxis);
    return globals;
  }
}
class Base {
  constructor(opts) {
    this.opts = opts;
  }
  init() {
    const config = new Config(this.opts).init({ responsiveOverride: false });
    const globals = new Globals().init(config);
    const w = {
      config,
      globals
    };
    return w;
  }
}
class Fill {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.opts = null;
    this.seriesIndex = 0;
    this.patternIDs = [];
  }
  clippedImgArea(params) {
    let w = this.w;
    let cnf = w.config;
    let svgW = parseInt(w.globals.gridWidth, 10);
    let svgH = parseInt(w.globals.gridHeight, 10);
    let size = svgW > svgH ? svgW : svgH;
    let fillImg = params.image;
    let imgWidth = 0;
    let imgHeight = 0;
    if (typeof params.width === "undefined" && typeof params.height === "undefined") {
      if (cnf.fill.image.width !== void 0 && cnf.fill.image.height !== void 0) {
        imgWidth = cnf.fill.image.width + 1;
        imgHeight = cnf.fill.image.height;
      } else {
        imgWidth = size + 1;
        imgHeight = size;
      }
    } else {
      imgWidth = params.width;
      imgHeight = params.height;
    }
    let elPattern = document.createElementNS(w.globals.SVGNS, "pattern");
    Graphics.setAttrs(elPattern, {
      id: params.patternID,
      patternUnits: params.patternUnits ? params.patternUnits : "userSpaceOnUse",
      width: imgWidth + "px",
      height: imgHeight + "px"
    });
    let elImage = document.createElementNS(w.globals.SVGNS, "image");
    elPattern.appendChild(elImage);
    elImage.setAttributeNS(window.SVG.xlink, "href", fillImg);
    Graphics.setAttrs(elImage, {
      x: 0,
      y: 0,
      preserveAspectRatio: "none",
      width: imgWidth + "px",
      height: imgHeight + "px"
    });
    elImage.style.opacity = params.opacity;
    w.globals.dom.elDefs.node.appendChild(elPattern);
  }
  getSeriesIndex(opts) {
    const w = this.w;
    const cType = w.config.chart.type;
    if ((cType === "bar" || cType === "rangeBar") && w.config.plotOptions.bar.distributed || cType === "heatmap" || cType === "treemap") {
      this.seriesIndex = opts.seriesNumber;
    } else {
      this.seriesIndex = opts.seriesNumber % w.globals.series.length;
    }
    return this.seriesIndex;
  }
  computeColorStops(data, multiColorConfig) {
    const w = this.w;
    let maxPositive = null;
    let minNegative = null;
    for (let value of data) {
      if (value >= multiColorConfig.threshold) {
        if (maxPositive === null || value > maxPositive) {
          maxPositive = value;
        }
      } else {
        if (minNegative === null || value < minNegative) {
          minNegative = value;
        }
      }
    }
    if (maxPositive === null) {
      maxPositive = multiColorConfig.threshold;
    }
    if (minNegative === null) {
      minNegative = multiColorConfig.threshold;
    }
    let totalRange = maxPositive - multiColorConfig.threshold + (multiColorConfig.threshold - minNegative);
    if (totalRange === 0) {
      totalRange = 1;
    }
    let negativePercentage = (multiColorConfig.threshold - minNegative) / totalRange * 100;
    let offset = 100 - negativePercentage;
    offset = Math.max(0, Math.min(offset, 100));
    return [
      {
        offset,
        color: multiColorConfig.colorAboveThreshold,
        opacity: w.config.fill.opacity
      },
      {
        offset: 0,
        color: multiColorConfig.colorBelowThreshold,
        opacity: w.config.fill.opacity
      }
    ];
  }
  fillPath(opts) {
    var _a, _b, _c, _d, _e, _f;
    let w = this.w;
    this.opts = opts;
    let cnf = this.w.config;
    let pathFill;
    let patternFill, gradientFill;
    this.seriesIndex = this.getSeriesIndex(opts);
    const drawMultiColorLine = cnf.plotOptions.line.colors.colorAboveThreshold && cnf.plotOptions.line.colors.colorBelowThreshold;
    let fillColors = this.getFillColors();
    let fillColor = fillColors[this.seriesIndex];
    if (w.globals.seriesColors[this.seriesIndex] !== void 0) {
      fillColor = w.globals.seriesColors[this.seriesIndex];
    }
    if (typeof fillColor === "function") {
      fillColor = fillColor({
        seriesIndex: this.seriesIndex,
        dataPointIndex: opts.dataPointIndex,
        value: opts.value,
        w
      });
    }
    let fillType = opts.fillType ? opts.fillType : this.getFillType(this.seriesIndex);
    let fillOpacity = Array.isArray(cnf.fill.opacity) ? cnf.fill.opacity[this.seriesIndex] : cnf.fill.opacity;
    const useGradient = fillType === "gradient" || drawMultiColorLine;
    if (opts.color) {
      fillColor = opts.color;
    }
    if ((_c = (_b = (_a = w.config.series[this.seriesIndex]) == null ? void 0 : _a.data) == null ? void 0 : _b[opts.dataPointIndex]) == null ? void 0 : _c.fillColor) {
      fillColor = (_f = (_e = (_d = w.config.series[this.seriesIndex]) == null ? void 0 : _d.data) == null ? void 0 : _e[opts.dataPointIndex]) == null ? void 0 : _f.fillColor;
    }
    if (!fillColor) {
      fillColor = "#fff";
      console.warn("undefined color - ApexCharts");
    }
    if (Utils$1.isCSSVariable(fillColor)) {
      fillColor = Utils$1.getThemeColor(fillColor);
    }
    let defaultColor = fillColor;
    if (fillColor.indexOf("rgb") === -1) {
      if (fillColor.indexOf("#") === -1) {
        defaultColor = fillColor;
      } else if (fillColor.length < 9) {
        defaultColor = Utils$1.hexToRgba(fillColor, fillOpacity);
      }
    } else {
      if (fillColor.indexOf("rgba") > -1) {
        fillOpacity = Utils$1.getOpacityFromRGBA(fillColor);
      } else {
        defaultColor = Utils$1.hexToRgba(Utils$1.rgb2hex(fillColor), fillOpacity);
      }
    }
    if (opts.opacity) fillOpacity = opts.opacity;
    if (fillType === "pattern") {
      patternFill = this.handlePatternFill({
        fillConfig: opts.fillConfig,
        patternFill,
        fillColor,
        fillOpacity,
        defaultColor
      });
    }
    if (useGradient) {
      let colorStops = [...cnf.fill.gradient.colorStops];
      let type = cnf.fill.gradient.type;
      if (drawMultiColorLine) {
        colorStops[this.seriesIndex] = this.computeColorStops(
          w.globals.series[this.seriesIndex],
          cnf.plotOptions.line.colors
        );
        type = "vertical";
      }
      gradientFill = this.handleGradientFill({
        type,
        fillConfig: opts.fillConfig,
        fillColor,
        fillOpacity,
        colorStops,
        i: this.seriesIndex
      });
    }
    if (fillType === "image") {
      let imgSrc = cnf.fill.image.src;
      let patternID = opts.patternID ? opts.patternID : "";
      const patternKey = `pattern${w.globals.cuid}${opts.seriesNumber + 1}${patternID}`;
      if (this.patternIDs.indexOf(patternKey) === -1) {
        this.clippedImgArea({
          opacity: fillOpacity,
          image: Array.isArray(imgSrc) ? opts.seriesNumber < imgSrc.length ? imgSrc[opts.seriesNumber] : imgSrc[0] : imgSrc,
          width: opts.width ? opts.width : void 0,
          height: opts.height ? opts.height : void 0,
          patternUnits: opts.patternUnits,
          patternID: patternKey
        });
        this.patternIDs.push(patternKey);
      }
      pathFill = `url(#${patternKey})`;
    } else if (useGradient) {
      pathFill = gradientFill;
    } else if (fillType === "pattern") {
      pathFill = patternFill;
    } else {
      pathFill = defaultColor;
    }
    if (opts.solid) {
      pathFill = defaultColor;
    }
    return pathFill;
  }
  getFillType(seriesIndex) {
    const w = this.w;
    if (Array.isArray(w.config.fill.type)) {
      return w.config.fill.type[seriesIndex];
    } else {
      return w.config.fill.type;
    }
  }
  getFillColors() {
    const w = this.w;
    const cnf = w.config;
    const opts = this.opts;
    let fillColors = [];
    if (w.globals.comboCharts) {
      if (w.config.series[this.seriesIndex].type === "line") {
        if (Array.isArray(w.globals.stroke.colors)) {
          fillColors = w.globals.stroke.colors;
        } else {
          fillColors.push(w.globals.stroke.colors);
        }
      } else {
        if (Array.isArray(w.globals.fill.colors)) {
          fillColors = w.globals.fill.colors;
        } else {
          fillColors.push(w.globals.fill.colors);
        }
      }
    } else {
      if (cnf.chart.type === "line") {
        if (Array.isArray(w.globals.stroke.colors)) {
          fillColors = w.globals.stroke.colors;
        } else {
          fillColors.push(w.globals.stroke.colors);
        }
      } else {
        if (Array.isArray(w.globals.fill.colors)) {
          fillColors = w.globals.fill.colors;
        } else {
          fillColors.push(w.globals.fill.colors);
        }
      }
    }
    if (typeof opts.fillColors !== "undefined") {
      fillColors = [];
      if (Array.isArray(opts.fillColors)) {
        fillColors = opts.fillColors.slice();
      } else {
        fillColors.push(opts.fillColors);
      }
    }
    return fillColors;
  }
  handlePatternFill({
    fillConfig,
    patternFill,
    fillColor,
    fillOpacity,
    defaultColor
  }) {
    let fillCnf = this.w.config.fill;
    if (fillConfig) {
      fillCnf = fillConfig;
    }
    const opts = this.opts;
    let graphics = new Graphics(this.ctx);
    let patternStrokeWidth = Array.isArray(fillCnf.pattern.strokeWidth) ? fillCnf.pattern.strokeWidth[this.seriesIndex] : fillCnf.pattern.strokeWidth;
    let patternLineColor = fillColor;
    if (Array.isArray(fillCnf.pattern.style)) {
      if (typeof fillCnf.pattern.style[opts.seriesNumber] !== "undefined") {
        let pf = graphics.drawPattern(
          fillCnf.pattern.style[opts.seriesNumber],
          fillCnf.pattern.width,
          fillCnf.pattern.height,
          patternLineColor,
          patternStrokeWidth,
          fillOpacity
        );
        patternFill = pf;
      } else {
        patternFill = defaultColor;
      }
    } else {
      patternFill = graphics.drawPattern(
        fillCnf.pattern.style,
        fillCnf.pattern.width,
        fillCnf.pattern.height,
        patternLineColor,
        patternStrokeWidth,
        fillOpacity
      );
    }
    return patternFill;
  }
  handleGradientFill({
    type,
    fillColor,
    fillOpacity,
    fillConfig,
    colorStops,
    i
  }) {
    let fillCnf = this.w.config.fill;
    if (fillConfig) {
      fillCnf = __spreadValues(__spreadValues({}, fillCnf), fillConfig);
    }
    const opts = this.opts;
    let graphics = new Graphics(this.ctx);
    let utils = new Utils$1();
    type = type || fillCnf.gradient.type;
    let gradientFrom = fillColor;
    let gradientTo;
    let opacityFrom = fillCnf.gradient.opacityFrom === void 0 ? fillOpacity : Array.isArray(fillCnf.gradient.opacityFrom) ? fillCnf.gradient.opacityFrom[i] : fillCnf.gradient.opacityFrom;
    if (gradientFrom.indexOf("rgba") > -1) {
      opacityFrom = Utils$1.getOpacityFromRGBA(gradientFrom);
    }
    let opacityTo = fillCnf.gradient.opacityTo === void 0 ? fillOpacity : Array.isArray(fillCnf.gradient.opacityTo) ? fillCnf.gradient.opacityTo[i] : fillCnf.gradient.opacityTo;
    if (fillCnf.gradient.gradientToColors === void 0 || fillCnf.gradient.gradientToColors.length === 0) {
      if (fillCnf.gradient.shade === "dark") {
        gradientTo = utils.shadeColor(
          parseFloat(fillCnf.gradient.shadeIntensity) * -1,
          fillColor.indexOf("rgb") > -1 ? Utils$1.rgb2hex(fillColor) : fillColor
        );
      } else {
        gradientTo = utils.shadeColor(
          parseFloat(fillCnf.gradient.shadeIntensity),
          fillColor.indexOf("rgb") > -1 ? Utils$1.rgb2hex(fillColor) : fillColor
        );
      }
    } else {
      if (fillCnf.gradient.gradientToColors[opts.seriesNumber]) {
        const gToColor = fillCnf.gradient.gradientToColors[opts.seriesNumber];
        gradientTo = gToColor;
        if (gToColor.indexOf("rgba") > -1) {
          opacityTo = Utils$1.getOpacityFromRGBA(gToColor);
        }
      } else {
        gradientTo = fillColor;
      }
    }
    if (fillCnf.gradient.gradientFrom) {
      gradientFrom = fillCnf.gradient.gradientFrom;
    }
    if (fillCnf.gradient.gradientTo) {
      gradientTo = fillCnf.gradient.gradientTo;
    }
    if (fillCnf.gradient.inverseColors) {
      let t = gradientFrom;
      gradientFrom = gradientTo;
      gradientTo = t;
    }
    if (gradientFrom.indexOf("rgb") > -1) {
      gradientFrom = Utils$1.rgb2hex(gradientFrom);
    }
    if (gradientTo.indexOf("rgb") > -1) {
      gradientTo = Utils$1.rgb2hex(gradientTo);
    }
    return graphics.drawGradient(
      type,
      gradientFrom,
      gradientTo,
      opacityFrom,
      opacityTo,
      opts.size,
      fillCnf.gradient.stops,
      colorStops,
      i
    );
  }
}
class Markers {
  constructor(ctx, opts) {
    this.ctx = ctx;
    this.w = ctx.w;
    this._filters = new Filters(this.ctx);
    this._graphics = new Graphics(this.ctx);
  }
  setGlobalMarkerSize() {
    const w = this.w;
    w.globals.markers.size = Array.isArray(w.config.markers.size) ? w.config.markers.size : [w.config.markers.size];
    if (w.globals.markers.size.length > 0) {
      if (w.globals.markers.size.length < w.globals.series.length + 1) {
        for (let i = 0; i <= w.globals.series.length; i++) {
          if (typeof w.globals.markers.size[i] === "undefined") {
            w.globals.markers.size.push(w.globals.markers.size[0]);
          }
        }
      }
    } else {
      w.globals.markers.size = w.config.series.map((s) => w.config.markers.size);
    }
  }
  plotChartMarkers({
    pointsPos,
    seriesIndex,
    j: j2,
    pSize,
    alwaysDrawMarker = false,
    isVirtualPoint = false
  }) {
    let w = this.w;
    let i = seriesIndex;
    let p = pointsPos;
    let elMarkersWrap = null;
    let graphics = new Graphics(this.ctx);
    const hasDiscreteMarkers = w.config.markers.discrete && w.config.markers.discrete.length;
    if (Array.isArray(p.x)) {
      for (let q = 0; q < p.x.length; q++) {
        let markerElement;
        let dataPointIndex = j2;
        let invalidMarker = !Utils$1.isNumber(p.y[q]);
        if (w.globals.markers.largestSize === 0 && w.globals.hasNullValues && w.globals.series[i][j2 + 1] !== null && !isVirtualPoint) {
          invalidMarker = true;
        }
        if (j2 === 1 && q === 0) dataPointIndex = 0;
        if (j2 === 1 && q === 1) dataPointIndex = 1;
        let markerClasses = "apexcharts-marker";
        if ((w.config.chart.type === "line" || w.config.chart.type === "area") && !w.globals.comboCharts && !w.config.tooltip.intersect) {
          markerClasses += " no-pointer-events";
        }
        const shouldMarkerDraw = Array.isArray(w.config.markers.size) ? w.globals.markers.size[seriesIndex] > 0 : w.config.markers.size > 0;
        if (shouldMarkerDraw || alwaysDrawMarker || hasDiscreteMarkers) {
          if (!invalidMarker) {
            markerClasses += ` w${Utils$1.randomId()}`;
          }
          let opts = this.getMarkerConfig({
            cssClass: markerClasses,
            seriesIndex,
            dataPointIndex
          });
          if (w.config.series[i].data[dataPointIndex]) {
            if (w.config.series[i].data[dataPointIndex].fillColor) {
              opts.pointFillColor = w.config.series[i].data[dataPointIndex].fillColor;
            }
            if (w.config.series[i].data[dataPointIndex].strokeColor) {
              opts.pointStrokeColor = w.config.series[i].data[dataPointIndex].strokeColor;
            }
          }
          if (typeof pSize !== "undefined") {
            opts.pSize = pSize;
          }
          if (p.x[q] < -w.globals.markers.largestSize || p.x[q] > w.globals.gridWidth + w.globals.markers.largestSize || p.y[q] < -w.globals.markers.largestSize || p.y[q] > w.globals.gridHeight + w.globals.markers.largestSize) {
            opts.pSize = 0;
          }
          if (!invalidMarker) {
            const shouldCreateMarkerWrap = w.globals.markers.size[seriesIndex] > 0 || alwaysDrawMarker || hasDiscreteMarkers;
            if (shouldCreateMarkerWrap && !elMarkersWrap) {
              elMarkersWrap = graphics.group({
                class: alwaysDrawMarker || hasDiscreteMarkers ? "" : "apexcharts-series-markers"
              });
              elMarkersWrap.attr(
                "clip-path",
                `url(#gridRectMarkerMask${w.globals.cuid})`
              );
              this.setupMarkerDelegation(elMarkersWrap);
            }
            markerElement = graphics.drawMarker(p.x[q], p.y[q], opts);
            markerElement.attr("rel", dataPointIndex);
            markerElement.attr("j", dataPointIndex);
            markerElement.attr("index", seriesIndex);
            markerElement.node.setAttribute("default-marker-size", opts.pSize);
            this._filters.setSelectionFilter(
              markerElement,
              seriesIndex,
              dataPointIndex
            );
            if (elMarkersWrap) {
              elMarkersWrap.add(markerElement);
            }
          }
        } else {
          if (typeof w.globals.pointsArray[seriesIndex] === "undefined")
            w.globals.pointsArray[seriesIndex] = [];
          w.globals.pointsArray[seriesIndex].push([p.x[q], p.y[q]]);
        }
      }
    }
    return elMarkersWrap;
  }
  getMarkerConfig({
    cssClass,
    seriesIndex,
    dataPointIndex = null,
    radius = null,
    size = null,
    strokeWidth = null
  }) {
    const w = this.w;
    let pStyle = this.getMarkerStyle(seriesIndex);
    let pSize = size === null ? w.globals.markers.size[seriesIndex] : size;
    const m = w.config.markers;
    if (dataPointIndex !== null && m.discrete.length) {
      m.discrete.map((marker) => {
        if (marker.seriesIndex === seriesIndex && marker.dataPointIndex === dataPointIndex) {
          pStyle.pointStrokeColor = marker.strokeColor;
          pStyle.pointFillColor = marker.fillColor;
          pSize = marker.size;
          pStyle.pointShape = marker.shape;
        }
      });
    }
    return {
      pSize: radius === null ? pSize : radius,
      pRadius: radius !== null ? radius : m.radius,
      pointStrokeWidth: strokeWidth !== null ? strokeWidth : Array.isArray(m.strokeWidth) ? m.strokeWidth[seriesIndex] : m.strokeWidth,
      pointStrokeColor: pStyle.pointStrokeColor,
      pointFillColor: pStyle.pointFillColor,
      shape: pStyle.pointShape || (Array.isArray(m.shape) ? m.shape[seriesIndex] : m.shape),
      class: cssClass,
      pointStrokeOpacity: Array.isArray(m.strokeOpacity) ? m.strokeOpacity[seriesIndex] : m.strokeOpacity,
      pointStrokeDashArray: Array.isArray(m.strokeDashArray) ? m.strokeDashArray[seriesIndex] : m.strokeDashArray,
      pointFillOpacity: Array.isArray(m.fillOpacity) ? m.fillOpacity[seriesIndex] : m.fillOpacity,
      seriesIndex
    };
  }
  setupMarkerDelegation(parentGroup) {
    const w = this.w;
    const selector = ".apexcharts-marker";
    this._graphics.setupEventDelegation(parentGroup, selector);
    parentGroup.node.addEventListener("click", (e) => {
      if (w.config.markers.onClick) {
        const targetNode = Graphics._findDelegateTarget(
          e.target,
          parentGroup.node,
          selector
        );
        if (targetNode) w.config.markers.onClick(e);
      }
    });
    parentGroup.node.addEventListener("dblclick", (e) => {
      if (w.config.markers.onDblClick) {
        const targetNode = Graphics._findDelegateTarget(
          e.target,
          parentGroup.node,
          selector
        );
        if (targetNode) w.config.markers.onDblClick(e);
      }
    });
    parentGroup.node.addEventListener(
      "touchstart",
      (e) => {
        const targetNode = Graphics._findDelegateTarget(
          e.target,
          parentGroup.node,
          selector
        );
        if (targetNode && targetNode.instance) {
          this._graphics.pathMouseDown(targetNode.instance, e);
        }
      },
      { passive: true }
    );
  }
  addEvents(marker) {
    const w = this.w;
    marker.node.addEventListener(
      "mouseenter",
      this._graphics.pathMouseEnter.bind(this.ctx, marker)
    );
    marker.node.addEventListener(
      "mouseleave",
      this._graphics.pathMouseLeave.bind(this.ctx, marker)
    );
    marker.node.addEventListener(
      "mousedown",
      this._graphics.pathMouseDown.bind(this.ctx, marker)
    );
    marker.node.addEventListener("click", w.config.markers.onClick);
    marker.node.addEventListener("dblclick", w.config.markers.onDblClick);
    marker.node.addEventListener(
      "touchstart",
      this._graphics.pathMouseDown.bind(this.ctx, marker),
      { passive: true }
    );
  }
  getMarkerStyle(seriesIndex) {
    let w = this.w;
    let colors = w.globals.markers.colors;
    let strokeColors = w.config.markers.strokeColor || w.config.markers.strokeColors;
    let pointStrokeColor = Array.isArray(strokeColors) ? strokeColors[seriesIndex] : strokeColors;
    let pointFillColor = Array.isArray(colors) ? colors[seriesIndex] : colors;
    return {
      pointStrokeColor,
      pointFillColor
    };
  }
}
class Scatter {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.anim = new Animations(this.ctx);
    this.filters = new Filters(this.ctx);
    this.fill = new Fill(this.ctx);
    this.markers = new Markers(this.ctx);
    this.graphics = new Graphics(this.ctx);
  }
  draw(elSeries, j2, opts) {
    let w = this.w;
    let graphics = this.graphics;
    let realIndex2 = opts.realIndex;
    let pointsPos = opts.pointsPos;
    let zRatio = opts.zRatio;
    let elPointsMain = opts.elParent;
    let elPointsWrap = graphics.group({
      class: `apexcharts-series-markers apexcharts-series-${w.config.chart.type}`
    });
    elPointsWrap.attr("clip-path", `url(#gridRectMarkerMask${w.globals.cuid})`);
    this.markers.setupMarkerDelegation(elPointsWrap);
    if (Array.isArray(pointsPos.x)) {
      for (let q = 0; q < pointsPos.x.length; q++) {
        let dataPointIndex = j2 + 1;
        let shouldDraw = true;
        if (j2 === 0 && q === 0) dataPointIndex = 0;
        if (j2 === 0 && q === 1) dataPointIndex = 1;
        let radius = w.globals.markers.size[realIndex2];
        if (zRatio !== Infinity) {
          const bubble = w.config.plotOptions.bubble;
          radius = w.globals.seriesZ[realIndex2][dataPointIndex];
          if (bubble.zScaling) {
            radius /= zRatio;
          }
          if (bubble.minBubbleRadius && radius < bubble.minBubbleRadius) {
            radius = bubble.minBubbleRadius;
          }
          if (bubble.maxBubbleRadius && radius > bubble.maxBubbleRadius) {
            radius = bubble.maxBubbleRadius;
          }
        }
        let x = pointsPos.x[q];
        let y = pointsPos.y[q];
        radius = radius || 0;
        if (y === null || typeof w.globals.series[realIndex2][dataPointIndex] === "undefined") {
          shouldDraw = false;
        }
        if (shouldDraw) {
          const point = this.drawPoint(
            x,
            y,
            radius,
            realIndex2,
            dataPointIndex,
            j2
          );
          elPointsWrap.add(point);
        }
        elPointsMain.add(elPointsWrap);
      }
    }
  }
  drawPoint(x, y, radius, realIndex2, dataPointIndex, j2) {
    const w = this.w;
    let i = realIndex2;
    const anim = this.anim;
    const filters = this.filters;
    const fill = this.fill;
    const markers = this.markers;
    const graphics = this.graphics;
    const markerConfig = markers.getMarkerConfig({
      cssClass: "apexcharts-marker",
      seriesIndex: i,
      dataPointIndex,
      radius: w.config.chart.type === "bubble" || w.globals.comboCharts && w.config.series[realIndex2] && w.config.series[realIndex2].type === "bubble" ? radius : null
    });
    let pathFillCircle = fill.fillPath({
      seriesNumber: realIndex2,
      dataPointIndex,
      color: markerConfig.pointFillColor,
      patternUnits: "objectBoundingBox",
      value: w.globals.series[realIndex2][j2]
    });
    let el = graphics.drawMarker(x, y, markerConfig);
    if (w.config.series[i].data[dataPointIndex]) {
      if (w.config.series[i].data[dataPointIndex].fillColor) {
        pathFillCircle = w.config.series[i].data[dataPointIndex].fillColor;
      }
    }
    el.attr({
      fill: pathFillCircle
    });
    if (w.config.chart.dropShadow.enabled) {
      const dropShadow = w.config.chart.dropShadow;
      filters.dropShadow(el, dropShadow, realIndex2);
    }
    if (this.initialAnim && !w.globals.dataChanged && !w.globals.resized) {
      let speed = w.config.chart.animations.speed;
      anim.animateMarker(el, speed, w.globals.easing, () => {
        window.setTimeout(() => {
          anim.animationCompleted(el);
        }, 100);
      });
    } else {
      w.globals.animationEnded = true;
    }
    el.attr({
      rel: dataPointIndex,
      j: dataPointIndex,
      index: realIndex2,
      "default-marker-size": markerConfig.pSize
    });
    filters.setSelectionFilter(el, realIndex2, dataPointIndex);
    el.node.classList.add("apexcharts-marker");
    return el;
  }
  centerTextInBubble(y) {
    let w = this.w;
    y = y + parseInt(w.config.dataLabels.style.fontSize, 10) / 4;
    return {
      y
    };
  }
}
class DataLabels {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  // When there are many datalabels to be printed, and some of them overlaps each other in the same series, this method will take care of that
  // Also, when datalabels exceeds the drawable area and get clipped off, we need to adjust and move some pixels to make them visible again
  dataLabelsCorrection(x, y, val, i, dataPointIndex, alwaysDrawDataLabel, fontSize) {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let drawnextLabel = false;
    let textRects = graphics.getTextRects(val, fontSize);
    let width = textRects.width;
    let height = textRects.height;
    if (y < 0) y = 0;
    if (y > w.globals.gridHeight + height) y = w.globals.gridHeight + height / 2;
    if (typeof w.globals.dataLabelsRects[i] === "undefined")
      w.globals.dataLabelsRects[i] = [];
    w.globals.dataLabelsRects[i].push({ x, y, width, height });
    let len = w.globals.dataLabelsRects[i].length - 2;
    let lastDrawnIndex = typeof w.globals.lastDrawnDataLabelsIndexes[i] !== "undefined" ? w.globals.lastDrawnDataLabelsIndexes[i][w.globals.lastDrawnDataLabelsIndexes[i].length - 1] : 0;
    if (typeof w.globals.dataLabelsRects[i][len] !== "undefined") {
      let lastDataLabelRect = w.globals.dataLabelsRects[i][lastDrawnIndex];
      if (
        // next label forward and x not intersecting
        x > lastDataLabelRect.x + lastDataLabelRect.width || y > lastDataLabelRect.y + lastDataLabelRect.height || y + height < lastDataLabelRect.y || x + width < lastDataLabelRect.x
      ) {
        drawnextLabel = true;
      }
    }
    if (dataPointIndex === 0 || alwaysDrawDataLabel) {
      drawnextLabel = true;
    }
    return {
      x,
      y,
      textRects,
      drawnextLabel
    };
  }
  drawDataLabel({ type, pos, i, j: j2, isRangeStart, strokeWidth = 2 }) {
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    let dataLabelsConfig = w.config.dataLabels;
    let x = 0;
    let y = 0;
    let dataPointIndex = j2;
    let elDataLabelsWrap = null;
    const seriesCollapsed = w.globals.collapsedSeriesIndices.indexOf(i) !== -1;
    if (seriesCollapsed || !dataLabelsConfig.enabled || !Array.isArray(pos.x)) {
      return elDataLabelsWrap;
    }
    elDataLabelsWrap = graphics.group({
      class: "apexcharts-data-labels"
    });
    for (let q = 0; q < pos.x.length; q++) {
      x = pos.x[q] + dataLabelsConfig.offsetX;
      y = pos.y[q] + dataLabelsConfig.offsetY + strokeWidth;
      if (!isNaN(x)) {
        if (j2 === 1 && q === 0) dataPointIndex = 0;
        if (j2 === 1 && q === 1) dataPointIndex = 1;
        let val = w.globals.series[i][dataPointIndex];
        if (type === "rangeArea") {
          if (isRangeStart) {
            val = w.globals.seriesRangeStart[i][dataPointIndex];
          } else {
            val = w.globals.seriesRangeEnd[i][dataPointIndex];
          }
        }
        let text = "";
        const getText = (v) => {
          return w.config.dataLabels.formatter(v, {
            ctx: this.ctx,
            seriesIndex: i,
            dataPointIndex,
            w
          });
        };
        if (w.config.chart.type === "bubble") {
          val = w.globals.seriesZ[i][dataPointIndex];
          text = getText(val);
          y = pos.y[q];
          const scatter = new Scatter(this.ctx);
          let centerTextInBubbleCoords = scatter.centerTextInBubble(
            y,
            i,
            dataPointIndex
          );
          y = centerTextInBubbleCoords.y;
        } else {
          if (typeof val !== "undefined") {
            text = getText(val);
          }
        }
        let textAnchor = w.config.dataLabels.textAnchor;
        if (w.globals.isSlopeChart) {
          if (dataPointIndex === 0) {
            textAnchor = "end";
          } else if (dataPointIndex === w.config.series[i].data.length - 1) {
            textAnchor = "start";
          } else {
            textAnchor = "middle";
          }
        }
        this.plotDataLabelsText({
          x,
          y,
          text,
          i,
          j: dataPointIndex,
          parent: elDataLabelsWrap,
          offsetCorrection: true,
          dataLabelsConfig: w.config.dataLabels,
          textAnchor
        });
      }
    }
    return elDataLabelsWrap;
  }
  plotDataLabelsText(opts) {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let {
      x,
      y,
      i,
      j: j2,
      text,
      textAnchor,
      fontSize,
      parent,
      dataLabelsConfig,
      color,
      alwaysDrawDataLabel,
      offsetCorrection,
      className
    } = opts;
    let dataLabelText = null;
    if (Array.isArray(w.config.dataLabels.enabledOnSeries)) {
      if (w.config.dataLabels.enabledOnSeries.indexOf(i) < 0) {
        return dataLabelText;
      }
    }
    let correctedLabels = {
      x,
      y,
      drawnextLabel: true,
      textRects: null
    };
    if (offsetCorrection) {
      correctedLabels = this.dataLabelsCorrection(
        x,
        y,
        text,
        i,
        j2,
        alwaysDrawDataLabel,
        parseInt(dataLabelsConfig.style.fontSize, 10)
      );
    }
    if (!w.globals.zoomed) {
      x = correctedLabels.x;
      y = correctedLabels.y;
    }
    if (correctedLabels.textRects) {
      if (x < -20 - correctedLabels.textRects.width || x > w.globals.gridWidth + correctedLabels.textRects.width + 30) {
        text = "";
      }
    }
    let dataLabelColor = w.globals.dataLabels.style.colors[i];
    if ((w.config.chart.type === "bar" || w.config.chart.type === "rangeBar") && w.config.plotOptions.bar.distributed || w.config.dataLabels.distributed) {
      dataLabelColor = w.globals.dataLabels.style.colors[j2];
    }
    if (typeof dataLabelColor === "function") {
      dataLabelColor = dataLabelColor({
        series: w.globals.series,
        seriesIndex: i,
        dataPointIndex: j2,
        w
      });
    }
    if (color) {
      dataLabelColor = color;
    }
    let offX = dataLabelsConfig.offsetX;
    let offY = dataLabelsConfig.offsetY;
    if (w.config.chart.type === "bar" || w.config.chart.type === "rangeBar") {
      offX = 0;
      offY = 0;
    }
    if (w.globals.isSlopeChart) {
      if (j2 !== 0) {
        offX = dataLabelsConfig.offsetX * -2 + 5;
      }
      if (j2 !== 0 && j2 !== w.config.series[i].data.length - 1) {
        offX = 0;
      }
    }
    if (correctedLabels.drawnextLabel) {
      if (textAnchor === "middle") {
        if (x === w.globals.gridWidth) {
          textAnchor = "end";
        }
      }
      dataLabelText = graphics.drawText({
        width: 100,
        height: parseInt(dataLabelsConfig.style.fontSize, 10),
        x: x + offX,
        y: y + offY,
        foreColor: dataLabelColor,
        textAnchor: textAnchor || dataLabelsConfig.textAnchor,
        text,
        fontSize: fontSize || dataLabelsConfig.style.fontSize,
        fontFamily: dataLabelsConfig.style.fontFamily,
        fontWeight: dataLabelsConfig.style.fontWeight || "normal"
      });
      dataLabelText.attr({
        class: className || "apexcharts-datalabel",
        cx: x,
        cy: y
      });
      if (dataLabelsConfig.dropShadow.enabled) {
        const textShadow = dataLabelsConfig.dropShadow;
        const filters = new Filters(this.ctx);
        filters.dropShadow(dataLabelText, textShadow);
      }
      parent.add(dataLabelText);
      if (typeof w.globals.lastDrawnDataLabelsIndexes[i] === "undefined") {
        w.globals.lastDrawnDataLabelsIndexes[i] = [];
      }
      w.globals.lastDrawnDataLabelsIndexes[i].push(j2);
    }
    return dataLabelText;
  }
  addBackgroundToDataLabel(el, coords) {
    const w = this.w;
    const bCnf = w.config.dataLabels.background;
    const paddingH = bCnf.padding;
    const paddingV = bCnf.padding / 2;
    const width = coords.width;
    const height = coords.height;
    const graphics = new Graphics(this.ctx);
    const elRect = graphics.drawRect(
      coords.x - paddingH,
      coords.y - paddingV / 2,
      width + paddingH * 2,
      height + paddingV,
      bCnf.borderRadius,
      w.config.chart.background === "transparent" || !w.config.chart.background ? "#fff" : w.config.chart.background,
      bCnf.opacity,
      bCnf.borderWidth,
      bCnf.borderColor
    );
    if (bCnf.dropShadow.enabled) {
      const filters = new Filters(this.ctx);
      filters.dropShadow(elRect, bCnf.dropShadow);
    }
    return elRect;
  }
  dataLabelsBackground() {
    const w = this.w;
    if (w.config.chart.type === "bubble") return;
    const elDataLabels = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-datalabels text"
    );
    for (let i = 0; i < elDataLabels.length; i++) {
      const el = elDataLabels[i];
      const coords = el.getBBox();
      let elRect = null;
      if (coords.width && coords.height) {
        elRect = this.addBackgroundToDataLabel(el, coords);
      }
      if (elRect) {
        el.parentNode.insertBefore(elRect.node, el);
        const background = w.config.dataLabels.background.backgroundColor || el.getAttribute("fill");
        const shouldAnim = w.config.chart.animations.enabled && !w.globals.resized && !w.globals.dataChanged;
        if (shouldAnim) {
          elRect.animate().attr({ fill: background });
        } else {
          elRect.attr({ fill: background });
        }
        el.setAttribute("fill", w.config.dataLabels.background.foreColor);
      }
    }
  }
  bringForward() {
    const w = this.w;
    const elDataLabelsNodes = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-datalabels"
    );
    const elSeries = w.globals.dom.baseEl.querySelector(
      ".apexcharts-plot-series:last-child"
    );
    for (let i = 0; i < elDataLabelsNodes.length; i++) {
      if (elSeries) {
        elSeries.insertBefore(elDataLabelsNodes[i], elSeries.nextSibling);
      }
    }
  }
}
const apexchartsLegendCSS = ".apexcharts-flip-y {\n  transform: scaleY(-1) translateY(-100%);\n  transform-origin: top;\n  transform-box: fill-box;\n}\n.apexcharts-flip-x {\n  transform: scaleX(-1);\n  transform-origin: center;\n  transform-box: fill-box;\n}\n.apexcharts-legend {\n  display: flex;\n  overflow: auto;\n  padding: 0 10px;\n}\n.apexcharts-legend.apexcharts-legend-group-horizontal {\n  flex-direction: column;\n}\n.apexcharts-legend-group {\n  display: flex;\n}\n.apexcharts-legend-group-vertical {\n  flex-direction: column-reverse;\n}\n.apexcharts-legend.apx-legend-position-bottom, .apexcharts-legend.apx-legend-position-top {\n  flex-wrap: wrap\n}\n.apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  flex-direction: column;\n  bottom: 0;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-left, .apexcharts-legend.apx-legend-position-top.apexcharts-align-left, .apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  justify-content: flex-start;\n  align-items: flex-start;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-center, .apexcharts-legend.apx-legend-position-top.apexcharts-align-center {\n  justify-content: center;\n  align-items: center;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-right, .apexcharts-legend.apx-legend-position-top.apexcharts-align-right {\n  justify-content: flex-end;\n  align-items: flex-end;\n}\n.apexcharts-legend-series {\n  cursor: pointer;\n  line-height: normal;\n  display: flex;\n  align-items: center;\n}\n.apexcharts-legend-text {\n  position: relative;\n  font-size: 14px;\n}\n.apexcharts-legend-text *, .apexcharts-legend-marker * {\n  pointer-events: none;\n}\n.apexcharts-legend-marker {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  margin-right: 1px;\n}\n\n.apexcharts-legend-series.apexcharts-no-click {\n  cursor: auto;\n}\n.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {\n  display: none !important;\n}\n.apexcharts-inactive-legend {\n  opacity: 0.45;\n} ";
class Series {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.legendInactiveClass = "legend-mouseover-inactive";
  }
  clearSeriesCache() {
    const w = this.w;
    if (w.globals.cachedSelectors) {
      delete w.globals.cachedSelectors.allSeriesEls;
      delete w.globals.cachedSelectors.highlightSeriesEls;
    }
  }
  getAllSeriesEls() {
    const w = this.w;
    const cacheKey = "allSeriesEls";
    if (!w.globals.cachedSelectors[cacheKey]) {
      w.globals.cachedSelectors[cacheKey] = w.globals.dom.baseEl.getElementsByClassName(`apexcharts-series`);
    }
    return w.globals.cachedSelectors[cacheKey];
  }
  getSeriesByName(seriesName) {
    return this.w.globals.dom.baseEl.querySelector(
      `.apexcharts-inner .apexcharts-series[seriesName='${Utils$1.escapeString(
        seriesName
      )}']`
    );
  }
  isSeriesHidden(seriesName) {
    const targetElement = this.getSeriesByName(seriesName);
    let realIndex2 = parseInt(targetElement.getAttribute("data:realIndex"), 10);
    let isHidden = targetElement.classList.contains(
      "apexcharts-series-collapsed"
    );
    return { isHidden, realIndex: realIndex2 };
  }
  addCollapsedClassToSeries(elSeries, index) {
    const w = this.w;
    function iterateOnAllCollapsedSeries(series) {
      for (let cs = 0; cs < series.length; cs++) {
        if (series[cs].index === index) {
          elSeries.node.classList.add("apexcharts-series-collapsed");
        }
      }
    }
    iterateOnAllCollapsedSeries(w.globals.collapsedSeries);
    iterateOnAllCollapsedSeries(w.globals.ancillaryCollapsedSeries);
  }
  toggleSeries(seriesName) {
    let isSeriesHidden = this.isSeriesHidden(seriesName);
    this.ctx.legend.legendHelpers.toggleDataSeries(
      isSeriesHidden.realIndex,
      isSeriesHidden.isHidden
    );
    return isSeriesHidden.isHidden;
  }
  showSeries(seriesName) {
    let isSeriesHidden = this.isSeriesHidden(seriesName);
    if (isSeriesHidden.isHidden) {
      this.ctx.legend.legendHelpers.toggleDataSeries(
        isSeriesHidden.realIndex,
        true
      );
    }
  }
  hideSeries(seriesName) {
    let isSeriesHidden = this.isSeriesHidden(seriesName);
    if (!isSeriesHidden.isHidden) {
      this.ctx.legend.legendHelpers.toggleDataSeries(
        isSeriesHidden.realIndex,
        false
      );
    }
  }
  resetSeries(shouldUpdateChart = true, shouldResetZoom = true, shouldResetCollapsed = true) {
    const w = this.w;
    this.clearSeriesCache();
    let series = Utils$1.clone(w.globals.initialSeries);
    w.globals.previousPaths = [];
    if (shouldResetCollapsed) {
      w.globals.collapsedSeries = [];
      w.globals.ancillaryCollapsedSeries = [];
      w.globals.collapsedSeriesIndices = [];
      w.globals.ancillaryCollapsedSeriesIndices = [];
    } else {
      series = this.emptyCollapsedSeries(series);
    }
    w.config.series = series;
    if (shouldUpdateChart) {
      if (shouldResetZoom) {
        w.globals.zoomed = false;
        this.ctx.updateHelpers.revertDefaultAxisMinMax();
      }
      this.ctx.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
    }
  }
  emptyCollapsedSeries(series) {
    const w = this.w;
    for (let i = 0; i < series.length; i++) {
      if (w.globals.collapsedSeriesIndices.indexOf(i) > -1) {
        series[i].data = [];
      }
    }
    return series;
  }
  highlightSeries(seriesName) {
    const w = this.w;
    const targetElement = this.getSeriesByName(seriesName);
    let realIndex2 = parseInt(targetElement == null ? void 0 : targetElement.getAttribute("data:realIndex"), 10);
    const cacheKey = "highlightSeriesEls";
    let allSeriesEls = w.globals.cachedSelectors[cacheKey];
    if (!allSeriesEls) {
      allSeriesEls = w.globals.dom.baseEl.querySelectorAll(
        `.apexcharts-series, .apexcharts-datalabels, .apexcharts-yaxis`
      );
      w.globals.cachedSelectors[cacheKey] = allSeriesEls;
    }
    let seriesEl = null;
    let dataLabelEl = null;
    let yaxisEl = null;
    if (w.globals.axisCharts || w.config.chart.type === "radialBar") {
      if (w.globals.axisCharts) {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${realIndex2}']`
        );
        dataLabelEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-datalabels[data\\:realIndex='${realIndex2}']`
        );
        let yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex2];
        yaxisEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel='${yaxisIndex}']`
        );
      } else {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${realIndex2 + 1}']`
        );
      }
    } else {
      seriesEl = w.globals.dom.baseEl.querySelector(
        `.apexcharts-series[rel='${realIndex2 + 1}'] path`
      );
    }
    for (let se = 0; se < allSeriesEls.length; se++) {
      allSeriesEls[se].classList.add(this.legendInactiveClass);
    }
    if (seriesEl) {
      if (!w.globals.axisCharts) {
        seriesEl.parentNode.classList.remove(this.legendInactiveClass);
      }
      seriesEl.classList.remove(this.legendInactiveClass);
      if (dataLabelEl !== null) {
        dataLabelEl.classList.remove(this.legendInactiveClass);
      }
      if (yaxisEl !== null) {
        yaxisEl.classList.remove(this.legendInactiveClass);
      }
    } else {
      for (let se = 0; se < allSeriesEls.length; se++) {
        allSeriesEls[se].classList.remove(this.legendInactiveClass);
      }
    }
  }
  toggleSeriesOnHover(e, targetElement) {
    const w = this.w;
    if (!targetElement) targetElement = e.target;
    let allSeriesEls = w.globals.dom.baseEl.querySelectorAll(
      `.apexcharts-series, .apexcharts-datalabels, .apexcharts-yaxis`
    );
    if (e.type === "mousemove") {
      let realIndex2 = parseInt(targetElement.getAttribute("rel"), 10) - 1;
      this.highlightSeries(w.globals.seriesNames[realIndex2]);
    } else if (e.type === "mouseout") {
      for (let se = 0; se < allSeriesEls.length; se++) {
        allSeriesEls[se].classList.remove(this.legendInactiveClass);
      }
    }
  }
  highlightRangeInSeries(e, targetElement) {
    const w = this.w;
    const allHeatMapElements = w.globals.dom.baseEl.getElementsByClassName(
      "apexcharts-heatmap-rect"
    );
    const activeInactive = (action) => {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        allHeatMapElements[i].classList[action](this.legendInactiveClass);
      }
    };
    const removeInactiveClassFromHoveredRange = (range, rangeMax) => {
      for (let i = 0; i < allHeatMapElements.length; i++) {
        const val = Number(allHeatMapElements[i].getAttribute("val"));
        if (val >= range.from && (val < range.to || range.to === rangeMax && val === rangeMax)) {
          allHeatMapElements[i].classList.remove(this.legendInactiveClass);
        }
      }
    };
    if (e.type === "mousemove") {
      let seriesCnt = parseInt(targetElement.getAttribute("rel"), 10) - 1;
      activeInactive("add");
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges;
      const range = ranges[seriesCnt];
      const rangeMax = ranges.reduce((acc, cur) => Math.max(acc, cur.to), 0);
      removeInactiveClassFromHoveredRange(range, rangeMax);
    } else if (e.type === "mouseout") {
      activeInactive("remove");
    }
  }
  getActiveConfigSeriesIndex(order = "asc", chartTypes = []) {
    const w = this.w;
    let activeIndex = 0;
    if (w.config.series.length > 1) {
      let activeSeriesIndex = w.config.series.map((s, index) => {
        const checkChartType = () => {
          if (w.globals.comboCharts) {
            return chartTypes.length === 0 || chartTypes.length && chartTypes.indexOf(w.config.series[index].type) > -1;
          }
          return true;
        };
        const hasData = s.data && s.data.length > 0 && w.globals.collapsedSeriesIndices.indexOf(index) === -1;
        return hasData && checkChartType() ? index : -1;
      });
      for (let a = order === "asc" ? 0 : activeSeriesIndex.length - 1; order === "asc" ? a < activeSeriesIndex.length : a >= 0; order === "asc" ? a++ : a--) {
        if (activeSeriesIndex[a] !== -1) {
          activeIndex = activeSeriesIndex[a];
          break;
        }
      }
    }
    return activeIndex;
  }
  getBarSeriesIndices() {
    const w = this.w;
    if (w.globals.comboCharts) {
      return this.w.config.series.map((s, i) => {
        return s.type === "bar" || s.type === "column" ? i : -1;
      }).filter((i) => {
        return i !== -1;
      });
    }
    return this.w.config.series.map((s, i) => {
      return i;
    });
  }
  getPreviousPaths() {
    let w = this.w;
    w.globals.previousPaths = [];
    function pushPaths(seriesEls, i, type) {
      let paths = seriesEls[i].childNodes;
      let dArr = {
        type,
        paths: [],
        realIndex: seriesEls[i].getAttribute("data:realIndex")
      };
      for (let j2 = 0; j2 < paths.length; j2++) {
        if (paths[j2].hasAttribute("pathTo")) {
          let d = paths[j2].getAttribute("pathTo");
          dArr.paths.push({
            d
          });
        }
      }
      w.globals.previousPaths.push(dArr);
    }
    const getPaths = (chartType) => {
      return w.globals.dom.baseEl.querySelectorAll(
        `.apexcharts-${chartType}-series .apexcharts-series`
      );
    };
    const chartTypes = [
      "line",
      "area",
      "bar",
      "rangebar",
      "rangeArea",
      "candlestick",
      "radar"
    ];
    chartTypes.forEach((type) => {
      const paths = getPaths(type);
      for (let p = 0; p < paths.length; p++) {
        pushPaths(paths, p, type);
      }
    });
    let heatTreeSeries = w.globals.dom.baseEl.querySelectorAll(
      `.apexcharts-${w.config.chart.type} .apexcharts-series`
    );
    if (heatTreeSeries.length > 0) {
      for (let h = 0; h < heatTreeSeries.length; h++) {
        let seriesEls = w.globals.dom.baseEl.querySelectorAll(
          `.apexcharts-${w.config.chart.type} .apexcharts-series[data\\:realIndex='${h}'] rect`
        );
        let dArr = [];
        for (let i = 0; i < seriesEls.length; i++) {
          const getAttr = (x) => {
            return seriesEls[i].getAttribute(x);
          };
          const rect = {
            x: parseFloat(getAttr("x")),
            y: parseFloat(getAttr("y")),
            width: parseFloat(getAttr("width")),
            height: parseFloat(getAttr("height"))
          };
          dArr.push({
            rect,
            color: seriesEls[i].getAttribute("color")
          });
        }
        w.globals.previousPaths.push(dArr);
      }
    }
    if (!w.globals.axisCharts) {
      w.globals.previousPaths = w.globals.series;
    }
  }
  clearPreviousPaths() {
    const w = this.w;
    w.globals.previousPaths = [];
    w.globals.allSeriesCollapsed = false;
  }
  handleNoData() {
    const w = this.w;
    const me = this;
    const noDataOpts = w.config.noData;
    const graphics = new Graphics(me.ctx);
    let x = w.globals.svgWidth / 2;
    let y = w.globals.svgHeight / 2;
    let textAnchor = "middle";
    w.globals.noData = true;
    w.globals.animationEnded = true;
    if (noDataOpts.align === "left") {
      x = 10;
      textAnchor = "start";
    } else if (noDataOpts.align === "right") {
      x = w.globals.svgWidth - 10;
      textAnchor = "end";
    }
    if (noDataOpts.verticalAlign === "top") {
      y = 50;
    } else if (noDataOpts.verticalAlign === "bottom") {
      y = w.globals.svgHeight - 50;
    }
    x = x + noDataOpts.offsetX;
    y = y + parseInt(noDataOpts.style.fontSize, 10) + 2 + noDataOpts.offsetY;
    if (noDataOpts.text !== void 0 && noDataOpts.text !== "") {
      let titleText = graphics.drawText({
        x,
        y,
        text: noDataOpts.text,
        textAnchor,
        fontSize: noDataOpts.style.fontSize,
        fontFamily: noDataOpts.style.fontFamily,
        foreColor: noDataOpts.style.color,
        opacity: 1,
        class: "apexcharts-text-nodata"
      });
      w.globals.dom.Paper.add(titleText);
    }
  }
  // When user clicks on legends, the collapsed series is filled with [0,0,0,...,0]
  // This is because we don't want to alter the series' length as it is used at many places
  setNullSeriesToZeroValues(series) {
    let w = this.w;
    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length === 0) {
        for (let j2 = 0; j2 < series[w.globals.maxValsInArrayIndex].length; j2++) {
          series[sl].push(0);
        }
      }
    }
    return series;
  }
  hasAllSeriesEqualX() {
    let equalLen = true;
    const w = this.w;
    const filteredSerX = this.filteredSeriesX();
    for (let i = 0; i < filteredSerX.length - 1; i++) {
      if (filteredSerX[i][0] !== filteredSerX[i + 1][0]) {
        equalLen = false;
        break;
      }
    }
    w.globals.allSeriesHasEqualX = equalLen;
    return equalLen;
  }
  filteredSeriesX() {
    const w = this.w;
    const filteredSeriesX = w.globals.seriesX.map(
      (ser) => ser.length > 0 ? ser : []
    );
    return filteredSeriesX;
  }
}
class Data {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.twoDSeries = [];
    this.threeDSeries = [];
    this.twoDSeriesX = [];
    this.seriesGoals = [];
    this.coreUtils = new CoreUtils(this.ctx);
  }
  // Helper to get the first valid data point from the active series
  getFirstDataPoint() {
    const series = this.w.config.series;
    const sr = new Series(this.ctx);
    this.activeSeriesIndex = sr.getActiveConfigSeriesIndex();
    if (series[this.activeSeriesIndex] && series[this.activeSeriesIndex].data && series[this.activeSeriesIndex].data.length > 0 && series[this.activeSeriesIndex].data[0] !== null && typeof series[this.activeSeriesIndex].data[0] !== "undefined") {
      return series[this.activeSeriesIndex].data[0];
    }
    return null;
  }
  isMultiFormat() {
    return this.isFormatXY() || this.isFormat2DArray();
  }
  // given format is [{x, y}, {x, y}]
  isFormatXY() {
    const firstDataPoint = this.getFirstDataPoint();
    return firstDataPoint && typeof firstDataPoint.x !== "undefined";
  }
  // given format is [[x, y], [x, y]]
  isFormat2DArray() {
    const firstDataPoint = this.getFirstDataPoint();
    return firstDataPoint && Array.isArray(firstDataPoint);
  }
  handleFormat2DArray(ser, i) {
    const cnf = this.w.config;
    const gl = this.w.globals;
    const data = ser[i].data;
    const isBoxPlot = cnf.chart.type === "boxPlot" || cnf.series[i].type === "boxPlot";
    for (let j2 = 0; j2 < data.length; j2++) {
      const point = data[j2];
      const x = point[0];
      const y = point[1];
      const z = point[2];
      if (typeof y !== "undefined") {
        if (Array.isArray(y) && y.length === 4 && !isBoxPlot) {
          this.twoDSeries.push(Utils$1.parseNumber(y[3]));
        } else if (point.length >= 5) {
          this.twoDSeries.push(Utils$1.parseNumber(point[4]));
        } else {
          this.twoDSeries.push(Utils$1.parseNumber(y));
        }
        gl.dataFormatXNumeric = true;
      }
      if (cnf.xaxis.type === "datetime") {
        let ts = new Date(x);
        ts = ts.getTime();
        this.twoDSeriesX.push(ts);
      } else {
        this.twoDSeriesX.push(x);
      }
      if (typeof z !== "undefined") {
        this.threeDSeries.push(z);
        gl.isDataXYZ = true;
      }
    }
  }
  handleFormatXY(ser, i) {
    const cnf = this.w.config;
    const gl = this.w.globals;
    const dt = new DateTime(this.ctx);
    const data = ser[i].data;
    let activeI = i;
    if (gl.collapsedSeriesIndices.indexOf(i) > -1) {
      activeI = this.activeSeriesIndex;
    }
    const activeData = ser[activeI].data;
    for (let j2 = 0; j2 < data.length; j2++) {
      const point = data[j2];
      if (typeof point.y !== "undefined") {
        const val = Array.isArray(point.y) ? Utils$1.parseNumber(point.y[point.y.length - 1]) : Utils$1.parseNumber(point.y);
        this.twoDSeries.push(val);
      }
      if (typeof this.seriesGoals[i] === "undefined") {
        this.seriesGoals[i] = [];
      }
      if (typeof point.goals !== "undefined" && Array.isArray(point.goals)) {
        this.seriesGoals[i].push(point.goals);
      } else {
        this.seriesGoals[i].push(null);
      }
      if (typeof point.z !== "undefined") {
        this.threeDSeries.push(point.z);
        gl.isDataXYZ = true;
      }
    }
    for (let j2 = 0; j2 < activeData.length; j2++) {
      const point = activeData[j2];
      const x = point.x;
      const isXString = typeof x === "string";
      const isXArr = Array.isArray(x);
      const isXDate = !isXArr && !!dt.isValidDate(x);
      if (isXString || isXDate) {
        if (isXString || cnf.xaxis.convertedCatToNumeric) {
          const isRangeColumn = gl.isBarHorizontal && gl.isRangeData;
          if (cnf.xaxis.type === "datetime" && !isRangeColumn) {
            this.twoDSeriesX.push(dt.parseDate(x));
          } else {
            this.fallbackToCategory = true;
            this.twoDSeriesX.push(x);
            if (!isNaN(x) && this.w.config.xaxis.type !== "category" && typeof x !== "string") {
              gl.isXNumeric = true;
            }
          }
        } else {
          if (cnf.xaxis.type === "datetime") {
            this.twoDSeriesX.push(dt.parseDate(x.toString()));
          } else {
            gl.dataFormatXNumeric = true;
            gl.isXNumeric = true;
            this.twoDSeriesX.push(parseFloat(x));
          }
        }
      } else if (isXArr) {
        this.fallbackToCategory = true;
        this.twoDSeriesX.push(x);
      } else {
        gl.isXNumeric = true;
        gl.dataFormatXNumeric = true;
        this.twoDSeriesX.push(x);
      }
    }
  }
  handleRangeData(ser, i) {
    const gl = this.w.globals;
    let range = {};
    if (this.isFormat2DArray()) {
      range = this.handleRangeDataFormat("array", ser, i);
    } else if (this.isFormatXY()) {
      range = this.handleRangeDataFormat("xy", ser, i);
    }
    gl.seriesRangeStart[i] = range.start === void 0 ? [] : range.start;
    gl.seriesRangeEnd[i] = range.end === void 0 ? [] : range.end;
    gl.seriesRange[i] = range.rangeUniques;
    gl.seriesRange.forEach((sr, si) => {
      if (!sr) return;
      sr.forEach((sarr, sarri) => {
        const yItems = sarr.y;
        const len = yItems.length;
        if (len <= 1) return;
        for (let arri = 0; arri < len; arri++) {
          const arr = yItems[arri];
          const range1y1 = arr.y1;
          const range1y2 = arr.y2;
          for (let sri = arri + 1; sri < len; sri++) {
            const range2 = yItems[sri];
            const range2y1 = range2.y1;
            const range2y2 = range2.y2;
            if (range1y1 <= range2y2 && range2y1 <= range1y2) {
              if (sarr.overlaps.indexOf(arr.rangeName) < 0) {
                sarr.overlaps.push(arr.rangeName);
              }
              if (sarr.overlaps.indexOf(range2.rangeName) < 0) {
                sarr.overlaps.push(range2.rangeName);
              }
            }
          }
        }
      });
    });
    return range;
  }
  handleCandleStickBoxData(ser, i) {
    const gl = this.w.globals;
    let ohlc = {};
    if (this.isFormat2DArray()) {
      ohlc = this.handleCandleStickBoxDataFormat("array", ser, i);
    } else if (this.isFormatXY()) {
      ohlc = this.handleCandleStickBoxDataFormat("xy", ser, i);
    }
    gl.seriesCandleO[i] = ohlc.o;
    gl.seriesCandleH[i] = ohlc.h;
    gl.seriesCandleM[i] = ohlc.m;
    gl.seriesCandleL[i] = ohlc.l;
    gl.seriesCandleC[i] = ohlc.c;
    return ohlc;
  }
  handleRangeDataFormat(format, ser, i) {
    const rangeStart = [];
    const rangeEnd = [];
    const uniqueKeysMap = /* @__PURE__ */ new Map();
    const uniqueKeys = [];
    ser[i].data.forEach((item) => {
      if (!uniqueKeysMap.has(item.x)) {
        const keyObj = {
          x: item.x,
          overlaps: [],
          y: []
        };
        uniqueKeysMap.set(item.x, keyObj);
        uniqueKeys.push(keyObj);
      }
    });
    if (format === "array") {
      for (let j2 = 0; j2 < ser[i].data.length; j2++) {
        if (Array.isArray(ser[i].data[j2])) {
          rangeStart.push(ser[i].data[j2][1][0]);
          rangeEnd.push(ser[i].data[j2][1][1]);
        } else {
          rangeStart.push(ser[i].data[j2]);
          rangeEnd.push(ser[i].data[j2]);
        }
      }
    } else if (format === "xy") {
      for (let j2 = 0; j2 < ser[i].data.length; j2++) {
        let isDataPoint2D = Array.isArray(ser[i].data[j2].y);
        const id = Utils$1.randomId();
        const x = ser[i].data[j2].x;
        const y = {
          y1: isDataPoint2D ? ser[i].data[j2].y[0] : ser[i].data[j2].y,
          y2: isDataPoint2D ? ser[i].data[j2].y[1] : ser[i].data[j2].y,
          rangeName: id
        };
        ser[i].data[j2].rangeName = id;
        const keyObj = uniqueKeysMap.get(x);
        if (keyObj) {
          keyObj.y.push(y);
        }
        rangeStart.push(y.y1);
        rangeEnd.push(y.y2);
      }
    }
    return {
      start: rangeStart,
      end: rangeEnd,
      rangeUniques: uniqueKeys
    };
  }
  handleCandleStickBoxDataFormat(format, ser, i) {
    const w = this.w;
    const isBoxPlot = w.config.chart.type === "boxPlot" || w.config.series[i].type === "boxPlot";
    const serO = [];
    const serH = [];
    const serM = [];
    const serL = [];
    const serC = [];
    const data = ser[i].data;
    let getVals;
    if (format === "array") {
      const isFlat = isBoxPlot && data[0].length === 6 || !isBoxPlot && data[0].length === 5;
      if (isFlat) {
        getVals = (d) => d.slice(1);
      } else {
        getVals = (d) => Array.isArray(d[1]) ? d[1] : [];
      }
    } else {
      getVals = (d) => Array.isArray(d.y) ? d.y : [];
    }
    for (let j2 = 0; j2 < data.length; j2++) {
      const vals = getVals(data[j2]);
      if (vals && vals.length >= 2) {
        serO.push(vals[0]);
        serH.push(vals[1]);
        if (isBoxPlot) {
          serM.push(vals[2]);
          serL.push(vals[3]);
          serC.push(vals[4]);
        } else {
          serL.push(vals[2]);
          serC.push(vals[3]);
        }
      }
    }
    return {
      o: serO,
      h: serH,
      m: serM,
      l: serL,
      c: serC
    };
  }
  parseDataAxisCharts(ser, ctx = this.ctx) {
    const cnf = this.w.config;
    const gl = this.w.globals;
    const dt = new DateTime(ctx);
    const xlabels = cnf.labels.length > 0 ? cnf.labels.slice() : cnf.xaxis.categories.slice();
    gl.isRangeBar = cnf.chart.type === "rangeBar" && gl.isBarHorizontal;
    gl.hasXaxisGroups = cnf.xaxis.type === "category" && cnf.xaxis.group.groups.length > 0;
    if (gl.hasXaxisGroups) {
      gl.groups = cnf.xaxis.group.groups;
    }
    ser.forEach((s, i) => {
      if (s.name !== void 0) {
        gl.seriesNames.push(s.name);
      } else {
        gl.seriesNames.push("series-" + parseInt(i + 1, 10));
      }
    });
    this.coreUtils.setSeriesYAxisMappings();
    let buckets = [];
    let groups = [...new Set(cnf.series.map((s) => s.group))];
    cnf.series.forEach((s, i) => {
      let index = groups.indexOf(s.group);
      if (!buckets[index]) buckets[index] = [];
      buckets[index].push(gl.seriesNames[i]);
    });
    gl.seriesGroups = buckets;
    const handleDates = () => {
      for (let j2 = 0; j2 < xlabels.length; j2++) {
        if (typeof xlabels[j2] === "string") {
          let isDate = dt.isValidDate(xlabels[j2]);
          if (isDate) {
            this.twoDSeriesX.push(dt.parseDate(xlabels[j2]));
          } else {
            throw new Error(
              "You have provided invalid Date format. Please provide a valid JavaScript Date"
            );
          }
        } else {
          this.twoDSeriesX.push(xlabels[j2]);
        }
      }
    };
    for (let i = 0; i < ser.length; i++) {
      this.twoDSeries = [];
      this.twoDSeriesX = [];
      this.threeDSeries = [];
      if (typeof ser[i].data === "undefined") {
        console.error(
          "It is a possibility that you may have not included 'data' property in series."
        );
        return;
      }
      if (cnf.chart.type === "rangeBar" || cnf.chart.type === "rangeArea" || ser[i].type === "rangeBar" || ser[i].type === "rangeArea") {
        gl.isRangeData = true;
        this.handleRangeData(ser, i);
      }
      if (this.isMultiFormat()) {
        if (this.isFormat2DArray()) {
          this.handleFormat2DArray(ser, i);
        } else if (this.isFormatXY()) {
          this.handleFormatXY(ser, i);
        }
        if (cnf.chart.type === "candlestick" || ser[i].type === "candlestick" || cnf.chart.type === "boxPlot" || ser[i].type === "boxPlot") {
          this.handleCandleStickBoxData(ser, i);
        }
        gl.series.push(this.twoDSeries);
        gl.labels.push(this.twoDSeriesX);
        gl.seriesX.push(this.twoDSeriesX);
        gl.seriesGoals = this.seriesGoals;
        if (i === this.activeSeriesIndex && !this.fallbackToCategory) {
          gl.isXNumeric = true;
        }
      } else {
        if (cnf.xaxis.type === "datetime") {
          gl.isXNumeric = true;
          handleDates();
          gl.seriesX.push(this.twoDSeriesX);
        } else if (cnf.xaxis.type === "numeric") {
          gl.isXNumeric = true;
          if (xlabels.length > 0) {
            this.twoDSeriesX = xlabels;
            gl.seriesX.push(this.twoDSeriesX);
          }
        }
        gl.labels.push(this.twoDSeriesX);
        const singleArray = ser[i].data.map((d) => Utils$1.parseNumber(d));
        gl.series.push(singleArray);
      }
      gl.seriesZ.push(this.threeDSeries);
      if (ser[i].color !== void 0) {
        gl.seriesColors.push(ser[i].color);
      } else {
        gl.seriesColors.push(void 0);
      }
    }
    return this.w;
  }
  parseDataNonAxisCharts(ser) {
    const gl = this.w.globals;
    const cnf = this.w.config;
    const hasOldFormat = Array.isArray(ser) && ser.every((s) => typeof s === "number") && cnf.labels.length > 0;
    const hasNewFormat = Array.isArray(ser) && ser.some(
      (s) => s && typeof s === "object" && s.data || s && typeof s === "object" && s.parsing
    );
    if (hasOldFormat && hasNewFormat) {
      console.warn(
        "ApexCharts: Both old format (numeric series + labels) and new format (series objects with data/parsing) detected. Using old format for backward compatibility."
      );
    }
    if (hasOldFormat) {
      gl.series = ser.slice();
      gl.seriesNames = cnf.labels.slice();
      for (let i = 0; i < gl.series.length; i++) {
        if (gl.seriesNames[i] === void 0) {
          gl.seriesNames.push("series-" + (i + 1));
        }
      }
      return this.w;
    }
    if (Array.isArray(ser) && ser.every((s) => typeof s === "number")) {
      gl.series = ser.slice();
      gl.seriesNames = [];
      for (let i = 0; i < gl.series.length; i++) {
        gl.seriesNames.push(cnf.labels[i] || `series-${i + 1}`);
      }
      return this.w;
    }
    const processedData = this.extractPieDataFromSeries(ser);
    gl.series = processedData.values;
    gl.seriesNames = processedData.labels;
    if (cnf.chart.type === "radialBar") {
      gl.series = gl.series.map((val) => {
        const numVal = Utils$1.parseNumber(val);
        if (numVal > 100) {
          console.warn(
            `ApexCharts: RadialBar value ${numVal} > 100, consider using percentage values (0-100)`
          );
        }
        return numVal;
      });
    }
    for (let i = 0; i < gl.series.length; i++) {
      if (gl.seriesNames[i] === void 0) {
        gl.seriesNames.push("series-" + (i + 1));
      }
    }
    return this.w;
  }
  /**
   * Reset parsing flags to allow re-parsing of data during updates
   */
  resetParsingFlags() {
    const w = this.w;
    w.globals.dataWasParsed = false;
    w.globals.originalSeries = null;
    if (w.config.series) {
      w.config.series.forEach((serie) => {
        if (serie.__apexParsed) {
          delete serie.__apexParsed;
        }
      });
    }
  }
  extractPieDataFromSeries(ser) {
    const values = [];
    const labels = [];
    if (!Array.isArray(ser)) {
      console.warn("ApexCharts: Expected array for series data");
      return { values: [], labels: [] };
    }
    if (ser.length === 0) {
      console.warn("ApexCharts: Empty series array");
      return { values: [], labels: [] };
    }
    const firstItem = ser[0];
    if (typeof firstItem === "object" && firstItem !== null && firstItem.data) {
      this.extractPieDataFromSeriesObjects(ser, values, labels);
    } else {
      console.warn(
        "ApexCharts: Unsupported series format for pie/donut/radialBar. Expected series objects with data property."
      );
      return { values: [], labels: [] };
    }
    return { values, labels };
  }
  // Extract data from series objects: [{ data: [...], parsing: {...} }]
  extractPieDataFromSeriesObjects(seriesArray, values, labels) {
    seriesArray.forEach((serie, serieIndex) => {
      if (!serie.data || !Array.isArray(serie.data)) {
        console.warn(`ApexCharts: Series ${serieIndex} has no valid data array`);
        return;
      }
      serie.data.forEach((dataPoint) => {
        if (typeof dataPoint === "object" && dataPoint !== null) {
          if (dataPoint.x !== void 0 && dataPoint.y !== void 0) {
            labels.push(String(dataPoint.x));
            values.push(Utils$1.parseNumber(dataPoint.y));
          } else {
            console.warn(
              "ApexCharts: Invalid data point format for pie chart. Expected {x, y} format:",
              dataPoint
            );
          }
        } else {
          console.warn(
            "ApexCharts: Expected object data point, got:",
            typeof dataPoint
          );
        }
      });
    });
  }
  /** User possibly set string categories in xaxis.categories or labels prop
   * Or didn't set xaxis labels at all - in which case we manually do it.
   * If user passed series data as [[3, 2], [4, 5]] or [{ x: 3, y: 55 }],
   * this shouldn't be called
   * @param {array} ser - the series which user passed to the config
   */
  handleExternalLabelsData(ser) {
    const cnf = this.w.config;
    const gl = this.w.globals;
    if (cnf.xaxis.categories.length > 0) {
      gl.labels = cnf.xaxis.categories;
    } else if (cnf.labels.length > 0) {
      gl.labels = cnf.labels.slice();
    } else if (this.fallbackToCategory) {
      gl.labels = gl.labels[0];
      if (gl.seriesRange.length) {
        gl.seriesRange.map((srt) => {
          srt.forEach((sr) => {
            if (gl.labels.indexOf(sr.x) < 0 && sr.x) {
              gl.labels.push(sr.x);
            }
          });
        });
        gl.labels = Array.from(
          new Set(gl.labels.map(JSON.stringify)),
          JSON.parse
        );
      }
      if (cnf.xaxis.convertedCatToNumeric) {
        const defaults = new Defaults(cnf);
        defaults.convertCatToNumericXaxis(cnf, this.ctx, gl.seriesX[0]);
        this._generateExternalLabels(ser);
      }
    } else {
      this._generateExternalLabels(ser);
    }
  }
  _generateExternalLabels(ser) {
    const gl = this.w.globals;
    const cnf = this.w.config;
    let labelArr = [];
    if (gl.axisCharts) {
      if (gl.series.length > 0) {
        if (this.isFormatXY()) {
          const seriesDataFiltered = cnf.series.map((serie, s) => {
            return serie.data.filter(
              (v, i, a) => a.findIndex((t) => t.x === v.x) === i
            );
          });
          const len = seriesDataFiltered.reduce(
            (p, c, i, a) => a[p].length > c.length ? p : i,
            0
          );
          for (let i = 0; i < seriesDataFiltered[len].length; i++) {
            labelArr.push(i + 1);
          }
        } else {
          for (let i = 0; i < gl.series[gl.maxValsInArrayIndex].length; i++) {
            labelArr.push(i + 1);
          }
        }
      }
      gl.seriesX = [];
      for (let i = 0; i < ser.length; i++) {
        gl.seriesX.push(labelArr);
      }
      if (!this.w.globals.isBarHorizontal) {
        gl.isXNumeric = true;
      }
    }
    if (labelArr.length === 0) {
      labelArr = gl.axisCharts ? [] : gl.series.map((gls, glsi) => {
        return glsi + 1;
      });
      for (let i = 0; i < ser.length; i++) {
        gl.seriesX.push(labelArr);
      }
    }
    gl.labels = labelArr;
    if (cnf.xaxis.convertedCatToNumeric) {
      gl.categoryLabels = labelArr.map((l) => {
        return cnf.xaxis.labels.formatter(l);
      });
    }
    gl.noLabelsProvided = true;
  }
  parseRawDataIfNeeded(series) {
    const cnf = this.w.config;
    const gl = this.w.globals;
    const globalParsing = cnf.parsing;
    if (gl.dataWasParsed) {
      return series;
    }
    if (!globalParsing && !series.some((s) => s.parsing)) {
      return series;
    }
    const processedSeries = series.map((serie, index) => {
      var _a, _b, _c;
      if (!serie.data || !Array.isArray(serie.data) || serie.data.length === 0) {
        return serie;
      }
      const effectiveParsing = {
        x: ((_a = serie.parsing) == null ? void 0 : _a.x) || (globalParsing == null ? void 0 : globalParsing.x),
        y: ((_b = serie.parsing) == null ? void 0 : _b.y) || (globalParsing == null ? void 0 : globalParsing.y),
        z: ((_c = serie.parsing) == null ? void 0 : _c.z) || (globalParsing == null ? void 0 : globalParsing.z)
      };
      if (!effectiveParsing.x && !effectiveParsing.y) {
        return serie;
      }
      const firstDataPoint = serie.data[0];
      if (typeof firstDataPoint === "object" && firstDataPoint !== null && (firstDataPoint.hasOwnProperty("x") || firstDataPoint.hasOwnProperty("y")) || Array.isArray(firstDataPoint)) {
        return serie;
      }
      if (!effectiveParsing.x || !effectiveParsing.y || Array.isArray(effectiveParsing.y) && effectiveParsing.y.length === 0) {
        console.warn(
          `ApexCharts: Series ${index} has parsing config but missing x or y field specification`
        );
        return serie;
      }
      const transformedData = serie.data.map((item, itemIndex) => {
        if (typeof item !== "object" || item === null) {
          console.warn(
            `ApexCharts: Series ${index}, data point ${itemIndex} is not an object, skipping parsing`
          );
          return item;
        }
        const x = this.getNestedValue(item, effectiveParsing.x);
        let y;
        let z = void 0;
        if (Array.isArray(effectiveParsing.y)) {
          const yValues = effectiveParsing.y.map(
            (fieldName) => this.getNestedValue(item, fieldName)
          );
          if (this.w.config.chart.type === "bubble" && yValues.length === 2) {
            y = yValues[0];
          } else {
            y = yValues;
          }
        } else {
          y = this.getNestedValue(item, effectiveParsing.y);
        }
        if (effectiveParsing.z) {
          z = this.getNestedValue(item, effectiveParsing.z);
        }
        if (x === void 0) {
          console.warn(
            `ApexCharts: Series ${index}, data point ${itemIndex} missing field '${effectiveParsing.x}'`
          );
        }
        if (y === void 0) {
          console.warn(
            `ApexCharts: Series ${index}, data point ${itemIndex} missing field '${effectiveParsing.y}'`
          );
        }
        const result = { x, y };
        if (this.w.config.chart.type === "bubble" && Array.isArray(effectiveParsing.y) && effectiveParsing.y.length === 2) {
          const zValue = this.getNestedValue(item, effectiveParsing.y[1]);
          if (zValue !== void 0) {
            result.z = zValue;
          }
        }
        if (z !== void 0) {
          result.z = z;
        }
        return result;
      });
      return __spreadProps(__spreadValues({}, serie), {
        data: transformedData,
        __apexParsed: true
      });
    });
    gl.dataWasParsed = true;
    if (!gl.originalSeries) {
      gl.originalSeries = Utils$1.clone(series);
    }
    return processedSeries;
  }
  /**
   * Get nested object value using dot notation path
   * @param {Object} obj - The object to search in
   * @param {string} path - Dot notation path (e.g., 'user.profile.name')
   * @returns {*} The value at the path, or undefined if not found
   */
  getNestedValue(obj, path) {
    if (!obj || typeof obj !== "object" || !path) {
      return void 0;
    }
    if (path.indexOf(".") === -1) {
      return obj[path];
    }
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length; i++) {
      if (current === null || current === void 0 || typeof current !== "object") {
        return void 0;
      }
      current = current[keys[i]];
    }
    return current;
  }
  // Segregate user provided data into appropriate vars
  parseData(ser) {
    let w = this.w;
    let cnf = w.config;
    let gl = w.globals;
    ser = this.parseRawDataIfNeeded(ser);
    cnf.series = ser;
    gl.initialSeries = Utils$1.clone(ser);
    this.excludeCollapsedSeriesInYAxis();
    this.fallbackToCategory = false;
    this.ctx.core.resetGlobals();
    this.ctx.core.isMultipleY();
    if (gl.axisCharts) {
      this.parseDataAxisCharts(ser);
      this.coreUtils.getLargestSeries();
    } else {
      this.parseDataNonAxisCharts(ser);
    }
    if (cnf.chart.stacked) {
      const series = new Series(this.ctx);
      gl.series = series.setNullSeriesToZeroValues(gl.series);
    }
    this.coreUtils.getSeriesTotals();
    if (gl.axisCharts) {
      gl.stackedSeriesTotals = this.coreUtils.getStackedSeriesTotals();
      gl.stackedSeriesTotalsByGroups = this.coreUtils.getStackedSeriesTotalsByGroups();
    }
    this.coreUtils.getPercentSeries();
    if (!gl.dataFormatXNumeric && (!gl.isXNumeric || cnf.xaxis.type === "numeric" && cnf.labels.length === 0 && cnf.xaxis.categories.length === 0)) {
      this.handleExternalLabelsData(ser);
    }
    const catLabels = this.coreUtils.getCategoryLabels(gl.labels);
    for (let l = 0; l < catLabels.length; l++) {
      if (Array.isArray(catLabels[l])) {
        gl.isMultiLineX = true;
        break;
      }
    }
  }
  excludeCollapsedSeriesInYAxis() {
    const w = this.w;
    let yAxisIndexes = [];
    w.globals.seriesYAxisMap.forEach((yAxisArr, yi) => {
      let collapsedCount = 0;
      yAxisArr.forEach((seriesIndex) => {
        if (w.globals.collapsedSeriesIndices.indexOf(seriesIndex) !== -1) {
          collapsedCount++;
        }
      });
      if (collapsedCount > 0 && collapsedCount == yAxisArr.length) {
        yAxisIndexes.push(yi);
      }
    });
    w.globals.ignoreYAxisIndexes = yAxisIndexes.map((x) => x);
  }
}
class Exports {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  svgStringToNode(svgString) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    return svgDoc.documentElement;
  }
  scaleSvgNode(svg, scale) {
    let svgWidth = parseFloat(svg.getAttributeNS(null, "width"));
    let svgHeight = parseFloat(svg.getAttributeNS(null, "height"));
    svg.setAttributeNS(null, "width", svgWidth * scale);
    svg.setAttributeNS(null, "height", svgHeight * scale);
    svg.setAttributeNS(null, "viewBox", "0 0 " + svgWidth + " " + svgHeight);
  }
  getSvgString(_scale) {
    return new Promise((resolve) => {
      const w = this.w;
      let scale = _scale || w.config.chart.toolbar.export.scale || w.config.chart.toolbar.export.width / w.globals.svgWidth;
      if (!scale) {
        scale = 1;
      }
      const width = w.globals.svgWidth * scale;
      const height = w.globals.svgHeight * scale;
      const clonedNode = w.globals.dom.elWrap.cloneNode(true);
      clonedNode.style.width = width + "px";
      clonedNode.style.height = height + "px";
      const serializedNode = new XMLSerializer().serializeToString(clonedNode);
      const shouldIncludeLegendStyles = w.config.legend.show && w.globals.dom.elLegendWrap && w.globals.dom.elLegendWrap.children.length > 0;
      let exportStyles = `
        .apexcharts-tooltip, .apexcharts-toolbar, .apexcharts-xaxistooltip, .apexcharts-yaxistooltip, .apexcharts-xcrosshairs, .apexcharts-ycrosshairs, .apexcharts-zoom-rect, .apexcharts-selection-rect {
          display: none;
        }
      `;
      if (shouldIncludeLegendStyles) {
        exportStyles += apexchartsLegendCSS;
      }
      let svgString = `
        <svg xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          class="apexcharts-svg"
          xmlns:data="ApexChartsNS"
          transform="translate(0, 0)"
          width="${w.globals.svgWidth}px" height="${w.globals.svgHeight}px">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px; height:${height}px;">
            <style type="text/css">
              ${exportStyles}
            </style>
              ${serializedNode}
            </div>
          </foreignObject>
        </svg>
      `;
      const svgNode = this.svgStringToNode(svgString);
      if (scale !== 1) {
        this.scaleSvgNode(svgNode, scale);
      }
      this.convertImagesToBase64(svgNode).then(() => {
        svgString = new XMLSerializer().serializeToString(svgNode);
        resolve(svgString.replace(/&nbsp;/g, "&#160;"));
      });
    });
  }
  convertImagesToBase64(svgNode) {
    const images = svgNode.getElementsByTagName("image");
    const promises = Array.from(images).map((img) => {
      const href = img.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (href && !href.startsWith("data:")) {
        return this.getBase64FromUrl(href).then((base64) => {
          img.setAttributeNS("http://www.w3.org/1999/xlink", "href", base64);
        }).catch((error) => {
          console.error("Error converting image to base64:", error);
        });
      }
      return Promise.resolve();
    });
    return Promise.all(promises);
  }
  getBase64FromUrl(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  svgUrl() {
    return new Promise((resolve) => {
      this.getSvgString().then((svgData) => {
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8"
        });
        resolve(URL.createObjectURL(svgBlob));
      });
    });
  }
  dataURI(options2) {
    return new Promise((resolve) => {
      const w = this.w;
      const scale = options2 ? options2.scale || options2.width / w.globals.svgWidth : 1;
      const canvas = document.createElement("canvas");
      canvas.width = w.globals.svgWidth * scale;
      canvas.height = parseInt(w.globals.dom.elWrap.style.height, 10) * scale;
      const canvasBg = w.config.chart.background === "transparent" || !w.config.chart.background ? "#fff" : w.config.chart.background;
      let ctx = canvas.getContext("2d");
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvas.width * scale, canvas.height * scale);
      this.getSvgString(scale).then((svgData) => {
        const svgUrl = "data:image/svg+xml," + encodeURIComponent(svgData);
        let img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          if (canvas.msToBlob) {
            let blob = canvas.msToBlob();
            resolve({ blob });
          } else {
            let imgURI = canvas.toDataURL("image/png");
            resolve({ imgURI });
          }
        };
        img.src = svgUrl;
      });
    });
  }
  exportToSVG() {
    this.svgUrl().then((url) => {
      this.triggerDownload(
        url,
        this.w.config.chart.toolbar.export.svg.filename,
        ".svg"
      );
    });
  }
  exportToPng() {
    const scale = this.w.config.chart.toolbar.export.scale;
    const width = this.w.config.chart.toolbar.export.width;
    const option = scale ? { scale } : width ? { width } : void 0;
    this.dataURI(option).then(({ imgURI, blob }) => {
      if (blob) {
        navigator.msSaveOrOpenBlob(blob, this.w.globals.chartID + ".png");
      } else {
        this.triggerDownload(
          imgURI,
          this.w.config.chart.toolbar.export.png.filename,
          ".png"
        );
      }
    });
  }
  exportToCSV({
    series,
    fileName,
    columnDelimiter = ",",
    lineDelimiter = "\n"
  }) {
    const w = this.w;
    if (!series) series = w.config.series;
    let columns = [];
    let rows = [];
    let result = "";
    let universalBOM = "\uFEFF";
    let gSeries = w.globals.series.map((s, i) => {
      return w.globals.collapsedSeriesIndices.indexOf(i) === -1 ? s : [];
    });
    const getFormattedCategory = (cat) => {
      if (typeof w.config.chart.toolbar.export.csv.categoryFormatter === "function") {
        return w.config.chart.toolbar.export.csv.categoryFormatter(cat);
      }
      if (w.config.xaxis.type === "datetime" && String(cat).length >= 10) {
        return new Date(cat).toDateString();
      }
      return Utils$1.isNumber(cat) ? cat : cat.split(columnDelimiter).join("");
    };
    const getFormattedValue = (value) => {
      return typeof w.config.chart.toolbar.export.csv.valueFormatter === "function" ? w.config.chart.toolbar.export.csv.valueFormatter(value) : value;
    };
    const seriesMaxDataLength = Math.max(
      ...series.map((s) => {
        return s.data ? s.data.length : 0;
      })
    );
    const dataFormat = new Data(this.ctx);
    const axesUtils = new AxesUtils(this.ctx);
    const getCat = (i) => {
      let cat = "";
      if (!w.globals.axisCharts) {
        cat = w.config.labels[i];
      } else {
        if (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) {
          if (w.globals.isBarHorizontal) {
            let lbFormatter = w.globals.yLabelFormatters[0];
            let sr = new Series(this.ctx);
            let activeSeries = sr.getActiveConfigSeriesIndex();
            cat = lbFormatter(w.globals.labels[i], {
              seriesIndex: activeSeries,
              dataPointIndex: i,
              w
            });
          } else {
            cat = axesUtils.getLabel(
              w.globals.labels,
              w.globals.timescaleLabels,
              0,
              i
            ).text;
          }
        }
        if (w.config.xaxis.type === "datetime") {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i];
          } else if (w.config.labels.length) {
            cat = w.config.labels[i];
          }
        }
      }
      if (cat === null) return "nullvalue";
      if (Array.isArray(cat)) {
        cat = cat.join(" ");
      }
      return Utils$1.isNumber(cat) ? cat : cat.split(columnDelimiter).join("");
    };
    const getEmptyDataForCsvColumn = () => {
      return [...Array(seriesMaxDataLength)].map(() => "");
    };
    const handleAxisRowsColumns = (s, sI) => {
      var _a;
      if (columns.length && sI === 0) {
        rows.push(columns.join(columnDelimiter));
      }
      if (s.data) {
        s.data = s.data.length && s.data || getEmptyDataForCsvColumn();
        for (let i = 0; i < s.data.length; i++) {
          columns = [];
          let cat = getCat(i);
          if (cat === "nullvalue") continue;
          if (!cat) {
            if (dataFormat.isFormatXY()) {
              cat = series[sI].data[i].x;
            } else if (dataFormat.isFormat2DArray()) {
              cat = series[sI].data[i] ? series[sI].data[i][0] : "";
            }
          }
          if (sI === 0) {
            columns.push(getFormattedCategory(cat));
            for (let ci = 0; ci < w.globals.series.length; ci++) {
              const value = dataFormat.isFormatXY() ? (_a = series[ci].data[i]) == null ? void 0 : _a.y : gSeries[ci][i];
              columns.push(getFormattedValue(value));
            }
          }
          if (w.config.chart.type === "candlestick" || s.type && s.type === "candlestick") {
            columns.pop();
            columns.push(w.globals.seriesCandleO[sI][i]);
            columns.push(w.globals.seriesCandleH[sI][i]);
            columns.push(w.globals.seriesCandleL[sI][i]);
            columns.push(w.globals.seriesCandleC[sI][i]);
          }
          if (w.config.chart.type === "boxPlot" || s.type && s.type === "boxPlot") {
            columns.pop();
            columns.push(w.globals.seriesCandleO[sI][i]);
            columns.push(w.globals.seriesCandleH[sI][i]);
            columns.push(w.globals.seriesCandleM[sI][i]);
            columns.push(w.globals.seriesCandleL[sI][i]);
            columns.push(w.globals.seriesCandleC[sI][i]);
          }
          if (w.config.chart.type === "rangeBar") {
            columns.pop();
            columns.push(w.globals.seriesRangeStart[sI][i]);
            columns.push(w.globals.seriesRangeEnd[sI][i]);
          }
          if (columns.length) {
            rows.push(columns.join(columnDelimiter));
          }
        }
      }
    };
    const handleUnequalXValues = () => {
      const categories = /* @__PURE__ */ new Set();
      const data = {};
      series.forEach((s, sI) => {
        s == null ? void 0 : s.data.forEach((dataItem) => {
          let cat, value;
          if (dataFormat.isFormatXY()) {
            cat = dataItem.x;
            value = dataItem.y;
          } else if (dataFormat.isFormat2DArray()) {
            cat = dataItem[0];
            value = dataItem[1];
          } else {
            return;
          }
          if (!data[cat]) {
            data[cat] = Array(series.length).fill("");
          }
          data[cat][sI] = getFormattedValue(value);
          categories.add(cat);
        });
      });
      if (columns.length) {
        rows.push(columns.join(columnDelimiter));
      }
      Array.from(categories).sort().forEach((cat) => {
        rows.push([
          getFormattedCategory(cat),
          data[cat].join(columnDelimiter)
        ]);
      });
    };
    columns.push(w.config.chart.toolbar.export.csv.headerCategory);
    if (w.config.chart.type === "boxPlot") {
      columns.push("minimum");
      columns.push("q1");
      columns.push("median");
      columns.push("q3");
      columns.push("maximum");
    } else if (w.config.chart.type === "candlestick") {
      columns.push("open");
      columns.push("high");
      columns.push("low");
      columns.push("close");
    } else if (w.config.chart.type === "rangeBar") {
      columns.push("minimum");
      columns.push("maximum");
    } else {
      series.map((s, sI) => {
        const sname = (s.name ? s.name : `series-${sI}`) + "";
        if (w.globals.axisCharts) {
          columns.push(
            sname.split(columnDelimiter).join("") ? sname.split(columnDelimiter).join("") : `series-${sI}`
          );
        }
      });
    }
    if (!w.globals.axisCharts) {
      columns.push(w.config.chart.toolbar.export.csv.headerValue);
      rows.push(columns.join(columnDelimiter));
    }
    if (!w.globals.allSeriesHasEqualX && w.globals.axisCharts && !w.config.xaxis.categories.length && !w.config.labels.length) {
      handleUnequalXValues();
    } else {
      series.map((s, sI) => {
        if (w.globals.axisCharts) {
          handleAxisRowsColumns(s, sI);
        } else {
          columns = [];
          columns.push(getFormattedCategory(w.globals.labels[sI]));
          columns.push(getFormattedValue(gSeries[sI]));
          rows.push(columns.join(columnDelimiter));
        }
      });
    }
    result += rows.join(lineDelimiter);
    this.triggerDownload(
      "data:text/csv; charset=utf-8," + encodeURIComponent(universalBOM + result),
      fileName ? fileName : w.config.chart.toolbar.export.csv.filename,
      ".csv"
    );
  }
  triggerDownload(href, filename, ext) {
    const downloadLink = document.createElement("a");
    downloadLink.href = href;
    downloadLink.download = (filename ? filename : this.w.globals.chartID) + ext;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
class XAxis {
  constructor(ctx, elgrid) {
    this.ctx = ctx;
    this.elgrid = elgrid;
    this.w = ctx.w;
    const w = this.w;
    this.axesUtils = new AxesUtils(ctx);
    this.xaxisLabels = w.globals.labels.slice();
    if (w.globals.timescaleLabels.length > 0 && !w.globals.isBarHorizontal) {
      this.xaxisLabels = w.globals.timescaleLabels.slice();
    }
    if (w.config.xaxis.overwriteCategories) {
      this.xaxisLabels = w.config.xaxis.overwriteCategories;
    }
    this.drawnLabels = [];
    this.drawnLabelsRects = [];
    if (w.config.xaxis.position === "top") {
      this.offY = 0;
    } else {
      this.offY = w.globals.gridHeight;
    }
    this.offY = this.offY + w.config.xaxis.axisBorder.offsetY;
    this.isCategoryBarHorizontal = w.config.chart.type === "bar" && w.config.plotOptions.bar.horizontal;
    this.xaxisFontSize = w.config.xaxis.labels.style.fontSize;
    this.xaxisFontFamily = w.config.xaxis.labels.style.fontFamily;
    this.xaxisForeColors = w.config.xaxis.labels.style.colors;
    this.xaxisBorderWidth = w.config.xaxis.axisBorder.width;
    if (this.isCategoryBarHorizontal) {
      this.xaxisBorderWidth = w.config.yaxis[0].axisBorder.width.toString();
    }
    if (String(this.xaxisBorderWidth).indexOf("%") > -1) {
      this.xaxisBorderWidth = w.globals.gridWidth * parseInt(this.xaxisBorderWidth, 10) / 100;
    } else {
      this.xaxisBorderWidth = parseInt(this.xaxisBorderWidth, 10);
    }
    this.xaxisBorderHeight = w.config.xaxis.axisBorder.height;
    this.yaxis = w.config.yaxis[0];
  }
  drawXaxis() {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let elXaxis = graphics.group({
      class: "apexcharts-xaxis",
      transform: `translate(${w.config.xaxis.offsetX}, ${w.config.xaxis.offsetY})`
    });
    let elXaxisTexts = graphics.group({
      class: "apexcharts-xaxis-texts-g",
      transform: `translate(${w.globals.translateXAxisX}, ${w.globals.translateXAxisY})`
    });
    elXaxis.add(elXaxisTexts);
    let labels = [];
    for (let i = 0; i < this.xaxisLabels.length; i++) {
      labels.push(this.xaxisLabels[i]);
    }
    this.drawXAxisLabelAndGroup(
      true,
      graphics,
      elXaxisTexts,
      labels,
      w.globals.isXNumeric,
      (i, colWidth) => colWidth
    );
    if (w.globals.hasXaxisGroups) {
      let labelsGroup = w.globals.groups;
      labels = [];
      for (let i = 0; i < labelsGroup.length; i++) {
        labels.push(labelsGroup[i].title);
      }
      let overwriteStyles = {};
      if (w.config.xaxis.group.style) {
        overwriteStyles.xaxisFontSize = w.config.xaxis.group.style.fontSize;
        overwriteStyles.xaxisFontFamily = w.config.xaxis.group.style.fontFamily;
        overwriteStyles.xaxisForeColors = w.config.xaxis.group.style.colors;
        overwriteStyles.fontWeight = w.config.xaxis.group.style.fontWeight;
        overwriteStyles.cssClass = w.config.xaxis.group.style.cssClass;
      }
      this.drawXAxisLabelAndGroup(
        false,
        graphics,
        elXaxisTexts,
        labels,
        false,
        (i, colWidth) => labelsGroup[i].cols * colWidth,
        overwriteStyles
      );
    }
    if (w.config.xaxis.title.text !== void 0) {
      let elXaxisTitle = graphics.group({
        class: "apexcharts-xaxis-title"
      });
      let elXAxisTitleText = graphics.drawText({
        x: w.globals.gridWidth / 2 + w.config.xaxis.title.offsetX,
        y: this.offY + parseFloat(this.xaxisFontSize) + (w.config.xaxis.position === "bottom" ? w.globals.xAxisLabelsHeight : -w.globals.xAxisLabelsHeight - 10) + w.config.xaxis.title.offsetY,
        text: w.config.xaxis.title.text,
        textAnchor: "middle",
        fontSize: w.config.xaxis.title.style.fontSize,
        fontFamily: w.config.xaxis.title.style.fontFamily,
        fontWeight: w.config.xaxis.title.style.fontWeight,
        foreColor: w.config.xaxis.title.style.color,
        cssClass: "apexcharts-xaxis-title-text " + w.config.xaxis.title.style.cssClass
      });
      elXaxisTitle.add(elXAxisTitleText);
      elXaxis.add(elXaxisTitle);
    }
    if (w.config.xaxis.axisBorder.show) {
      const offX = w.globals.barPadForNumericAxis;
      let elHorzLine = graphics.drawLine(
        w.globals.padHorizontal + w.config.xaxis.axisBorder.offsetX - offX,
        this.offY,
        this.xaxisBorderWidth + offX,
        this.offY,
        w.config.xaxis.axisBorder.color,
        0,
        this.xaxisBorderHeight
      );
      if (this.elgrid && this.elgrid.elGridBorders && w.config.grid.show) {
        this.elgrid.elGridBorders.add(elHorzLine);
      } else {
        elXaxis.add(elHorzLine);
      }
    }
    return elXaxis;
  }
  drawXAxisLabelAndGroup(isLeafGroup, graphics, elXaxisTexts, labels, isXNumeric, colWidthCb, overwriteStyles = {}) {
    let drawnLabels = [];
    let drawnLabelsRects = [];
    let w = this.w;
    const xaxisFontSize = overwriteStyles.xaxisFontSize || this.xaxisFontSize;
    const xaxisFontFamily = overwriteStyles.xaxisFontFamily || this.xaxisFontFamily;
    const xaxisForeColors = overwriteStyles.xaxisForeColors || this.xaxisForeColors;
    const fontWeight = overwriteStyles.fontWeight || w.config.xaxis.labels.style.fontWeight;
    const cssClass = overwriteStyles.cssClass || w.config.xaxis.labels.style.cssClass;
    let colWidth;
    let xPos = w.globals.padHorizontal;
    let labelsLen = labels.length;
    let dataPoints = w.config.xaxis.type === "category" ? w.globals.dataPoints : labelsLen;
    if (dataPoints === 0 && labelsLen > dataPoints) dataPoints = labelsLen;
    if (isXNumeric) {
      let len = Math.max(
        Number(w.config.xaxis.tickAmount) || 1,
        dataPoints > 1 ? dataPoints - 1 : dataPoints
      );
      colWidth = w.globals.gridWidth / Math.min(len, labelsLen - 1);
      xPos = xPos + colWidthCb(0, colWidth) / 2 + w.config.xaxis.labels.offsetX;
    } else {
      colWidth = w.globals.gridWidth / dataPoints;
      xPos = xPos + colWidthCb(0, colWidth) + w.config.xaxis.labels.offsetX;
    }
    for (let i = 0; i <= labelsLen - 1; i++) {
      let x = xPos - colWidthCb(i, colWidth) / 2 + w.config.xaxis.labels.offsetX;
      if (i === 0 && labelsLen === 1 && colWidth / 2 === xPos && dataPoints === 1) {
        x = w.globals.gridWidth / 2;
      }
      let label = this.axesUtils.getLabel(
        labels,
        w.globals.timescaleLabels,
        x,
        i,
        drawnLabels,
        xaxisFontSize,
        isLeafGroup
      );
      let offsetYCorrection = 28;
      if (w.globals.rotateXLabels && isLeafGroup) {
        offsetYCorrection = 22;
      }
      if (w.config.xaxis.title.text && w.config.xaxis.position === "top") {
        offsetYCorrection += parseFloat(w.config.xaxis.title.style.fontSize) + 2;
      }
      if (!isLeafGroup) {
        offsetYCorrection = offsetYCorrection + parseFloat(xaxisFontSize) + (w.globals.xAxisLabelsHeight - w.globals.xAxisGroupLabelsHeight) + (w.globals.rotateXLabels ? 10 : 0);
      }
      const isCategoryTickAmounts = typeof w.config.xaxis.tickAmount !== "undefined" && w.config.xaxis.tickAmount !== "dataPoints" && w.config.xaxis.type !== "datetime";
      if (isCategoryTickAmounts) {
        label = this.axesUtils.checkLabelBasedOnTickamount(i, label, labelsLen);
      } else {
        label = this.axesUtils.checkForOverflowingLabels(
          i,
          label,
          labelsLen,
          drawnLabels,
          drawnLabelsRects
        );
      }
      const getCatForeColor = () => {
        return isLeafGroup && w.config.xaxis.convertedCatToNumeric ? xaxisForeColors[w.globals.minX + i - 1] : xaxisForeColors[i];
      };
      if (w.config.xaxis.labels.show) {
        let elText = graphics.drawText({
          x: label.x,
          y: this.offY + w.config.xaxis.labels.offsetY + offsetYCorrection - (w.config.xaxis.position === "top" ? w.globals.xAxisHeight + w.config.xaxis.axisTicks.height - 2 : 0),
          text: label.text,
          textAnchor: "middle",
          fontWeight: label.isBold ? 600 : fontWeight,
          fontSize: xaxisFontSize,
          fontFamily: xaxisFontFamily,
          foreColor: Array.isArray(xaxisForeColors) ? getCatForeColor() : xaxisForeColors,
          isPlainText: false,
          cssClass: (isLeafGroup ? "apexcharts-xaxis-label " : "apexcharts-xaxis-group-label ") + cssClass
        });
        elXaxisTexts.add(elText);
        elText.on("click", (e) => {
          if (typeof w.config.chart.events.xAxisLabelClick === "function") {
            const opts = Object.assign({}, w, {
              labelIndex: i
            });
            w.config.chart.events.xAxisLabelClick(e, this.ctx, opts);
          }
        });
        if (isLeafGroup) {
          let elTooltipTitle = document.createElementNS(
            w.globals.SVGNS,
            "title"
          );
          elTooltipTitle.textContent = Array.isArray(label.text) ? label.text.join(" ") : label.text;
          elText.node.appendChild(elTooltipTitle);
          if (label.text !== "") {
            drawnLabels.push(label.text);
            drawnLabelsRects.push(label);
          }
        }
      }
      if (i < labelsLen - 1) {
        xPos = xPos + colWidthCb(i + 1, colWidth);
      }
    }
  }
  // this actually becomes the vertical axis (for bar charts)
  drawXaxisInversed(realIndex2) {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let translateYAxisX = w.config.yaxis[0].opposite ? w.globals.translateYAxisX[realIndex2] : 0;
    let elYaxis = graphics.group({
      class: "apexcharts-yaxis apexcharts-xaxis-inversed",
      rel: realIndex2
    });
    let elYaxisTexts = graphics.group({
      class: "apexcharts-yaxis-texts-g apexcharts-xaxis-inversed-texts-g",
      transform: "translate(" + translateYAxisX + ", 0)"
    });
    elYaxis.add(elYaxisTexts);
    let colHeight;
    let yPos;
    let labels = [];
    if (w.config.yaxis[realIndex2].show) {
      for (let i = 0; i < this.xaxisLabels.length; i++) {
        labels.push(this.xaxisLabels[i]);
      }
    }
    colHeight = w.globals.gridHeight / labels.length;
    yPos = -(colHeight / 2.2);
    let lbFormatter = w.globals.yLabelFormatters[0];
    const ylabels = w.config.yaxis[0].labels;
    if (ylabels.show) {
      for (let i = 0; i <= labels.length - 1; i++) {
        let label = typeof labels[i] === "undefined" ? "" : labels[i];
        label = lbFormatter(label, {
          seriesIndex: realIndex2,
          dataPointIndex: i,
          w
        });
        const yColors = this.axesUtils.getYAxisForeColor(
          ylabels.style.colors,
          realIndex2
        );
        const getForeColor = () => {
          return Array.isArray(yColors) ? yColors[i] : yColors;
        };
        let multiY = 0;
        if (Array.isArray(label)) {
          multiY = label.length / 2 * parseInt(ylabels.style.fontSize, 10);
        }
        let offsetX = ylabels.offsetX - 15;
        let textAnchor = "end";
        if (this.yaxis.opposite) {
          textAnchor = "start";
        }
        if (w.config.yaxis[0].labels.align === "left") {
          offsetX = ylabels.offsetX;
          textAnchor = "start";
        } else if (w.config.yaxis[0].labels.align === "center") {
          offsetX = ylabels.offsetX;
          textAnchor = "middle";
        } else if (w.config.yaxis[0].labels.align === "right") {
          textAnchor = "end";
        }
        let elLabel = graphics.drawText({
          x: offsetX,
          y: yPos + colHeight + ylabels.offsetY - multiY,
          text: label,
          textAnchor,
          foreColor: getForeColor(),
          fontSize: ylabels.style.fontSize,
          fontFamily: ylabels.style.fontFamily,
          fontWeight: ylabels.style.fontWeight,
          isPlainText: false,
          cssClass: "apexcharts-yaxis-label " + ylabels.style.cssClass,
          maxWidth: ylabels.maxWidth
        });
        elYaxisTexts.add(elLabel);
        elLabel.on("click", (e) => {
          if (typeof w.config.chart.events.xAxisLabelClick === "function") {
            const opts = Object.assign({}, w, {
              labelIndex: i
            });
            w.config.chart.events.xAxisLabelClick(e, this.ctx, opts);
          }
        });
        let elTooltipTitle = document.createElementNS(w.globals.SVGNS, "title");
        elTooltipTitle.textContent = Array.isArray(label) ? label.join(" ") : label;
        elLabel.node.appendChild(elTooltipTitle);
        if (w.config.yaxis[realIndex2].labels.rotate !== 0) {
          let labelRotatingCenter = graphics.rotateAroundCenter(elLabel.node);
          elLabel.node.setAttribute(
            "transform",
            `rotate(${w.config.yaxis[realIndex2].labels.rotate} 0 ${labelRotatingCenter.y})`
          );
        }
        yPos = yPos + colHeight;
      }
    }
    if (w.config.yaxis[0].title.text !== void 0) {
      let elXaxisTitle = graphics.group({
        class: "apexcharts-yaxis-title apexcharts-xaxis-title-inversed",
        transform: "translate(" + translateYAxisX + ", 0)"
      });
      let elXAxisTitleText = graphics.drawText({
        x: w.config.yaxis[0].title.offsetX,
        y: w.globals.gridHeight / 2 + w.config.yaxis[0].title.offsetY,
        text: w.config.yaxis[0].title.text,
        textAnchor: "middle",
        foreColor: w.config.yaxis[0].title.style.color,
        fontSize: w.config.yaxis[0].title.style.fontSize,
        fontWeight: w.config.yaxis[0].title.style.fontWeight,
        fontFamily: w.config.yaxis[0].title.style.fontFamily,
        cssClass: "apexcharts-yaxis-title-text " + w.config.yaxis[0].title.style.cssClass
      });
      elXaxisTitle.add(elXAxisTitleText);
      elYaxis.add(elXaxisTitle);
    }
    let offX = 0;
    if (this.isCategoryBarHorizontal && w.config.yaxis[0].opposite) {
      offX = w.globals.gridWidth;
    }
    const axisBorder = w.config.xaxis.axisBorder;
    if (axisBorder.show) {
      let elVerticalLine = graphics.drawLine(
        w.globals.padHorizontal + axisBorder.offsetX + offX,
        1 + axisBorder.offsetY,
        w.globals.padHorizontal + axisBorder.offsetX + offX,
        w.globals.gridHeight + axisBorder.offsetY,
        axisBorder.color,
        0
      );
      if (this.elgrid && this.elgrid.elGridBorders && w.config.grid.show) {
        this.elgrid.elGridBorders.add(elVerticalLine);
      } else {
        elYaxis.add(elVerticalLine);
      }
    }
    if (w.config.yaxis[0].axisTicks.show) {
      this.axesUtils.drawYAxisTicks(
        offX,
        labels.length,
        w.config.yaxis[0].axisBorder,
        w.config.yaxis[0].axisTicks,
        0,
        colHeight,
        elYaxis
      );
    }
    return elYaxis;
  }
  drawXaxisTicks(x1, y2, appendToElement) {
    let w = this.w;
    let x2 = x1;
    if (x1 < 0 || x1 - 2 > w.globals.gridWidth) return;
    let y1 = this.offY + w.config.xaxis.axisTicks.offsetY;
    y2 = y2 + y1 + w.config.xaxis.axisTicks.height;
    if (w.config.xaxis.position === "top") {
      y2 = y1 - w.config.xaxis.axisTicks.height;
    }
    if (w.config.xaxis.axisTicks.show) {
      let graphics = new Graphics(this.ctx);
      let line = graphics.drawLine(
        x1 + w.config.xaxis.axisTicks.offsetX,
        y1 + w.config.xaxis.offsetY,
        x2 + w.config.xaxis.axisTicks.offsetX,
        y2 + w.config.xaxis.offsetY,
        w.config.xaxis.axisTicks.color
      );
      appendToElement.add(line);
      line.node.classList.add("apexcharts-xaxis-tick");
    }
  }
  getXAxisTicksPositions() {
    const w = this.w;
    let xAxisTicksPositions = [];
    const xCount = this.xaxisLabels.length;
    let x1 = w.globals.padHorizontal;
    if (w.globals.timescaleLabels.length > 0) {
      for (let i = 0; i < xCount; i++) {
        x1 = this.xaxisLabels[i].position;
        xAxisTicksPositions.push(x1);
      }
    } else {
      let xCountForCategoryCharts = xCount;
      for (let i = 0; i < xCountForCategoryCharts; i++) {
        let x1Count = xCountForCategoryCharts;
        if (w.globals.isXNumeric && w.config.chart.type !== "bar") {
          x1Count -= 1;
        }
        x1 = x1 + w.globals.gridWidth / x1Count;
        xAxisTicksPositions.push(x1);
      }
    }
    return xAxisTicksPositions;
  }
  // to rotate x-axis labels or to put ... for longer text in xaxis
  xAxisLabelCorrections() {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let xAxis = w.globals.dom.baseEl.querySelector(".apexcharts-xaxis-texts-g");
    let xAxisTexts = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-xaxis-texts-g text:not(.apexcharts-xaxis-group-label)"
    );
    let yAxisTextsInversed = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-yaxis-inversed text"
    );
    let xAxisTextsInversed = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-xaxis-inversed-texts-g text tspan"
    );
    if (w.globals.rotateXLabels || w.config.xaxis.labels.rotateAlways) {
      for (let xat = 0; xat < xAxisTexts.length; xat++) {
        let textRotatingCenter = graphics.rotateAroundCenter(xAxisTexts[xat]);
        textRotatingCenter.y = textRotatingCenter.y - 1;
        textRotatingCenter.x = textRotatingCenter.x + 1;
        xAxisTexts[xat].setAttribute(
          "transform",
          `rotate(${w.config.xaxis.labels.rotate} ${textRotatingCenter.x} ${textRotatingCenter.y})`
        );
        xAxisTexts[xat].setAttribute("text-anchor", `end`);
        xAxis.setAttribute("transform", `translate(0, ${-10})`);
        let tSpan = xAxisTexts[xat].childNodes;
        if (w.config.xaxis.labels.trim) {
          Array.prototype.forEach.call(tSpan, (ts) => {
            graphics.placeTextWithEllipsis(
              ts,
              ts.textContent,
              w.globals.xAxisLabelsHeight - (w.config.legend.position === "bottom" ? 20 : 10)
            );
          });
        }
      }
    } else {
      let width = w.globals.gridWidth / (w.globals.labels.length + 1);
      for (let xat = 0; xat < xAxisTexts.length; xat++) {
        let tSpan = xAxisTexts[xat].childNodes;
        if (w.config.xaxis.labels.trim && w.config.xaxis.type !== "datetime") {
          Array.prototype.forEach.call(tSpan, (ts) => {
            graphics.placeTextWithEllipsis(ts, ts.textContent, width);
          });
        }
      }
    }
    if (yAxisTextsInversed.length > 0) {
      let firstLabelPosX = yAxisTextsInversed[yAxisTextsInversed.length - 1].getBBox();
      let lastLabelPosX = yAxisTextsInversed[0].getBBox();
      if (firstLabelPosX.x < -20) {
        yAxisTextsInversed[yAxisTextsInversed.length - 1].parentNode.removeChild(
          yAxisTextsInversed[yAxisTextsInversed.length - 1]
        );
      }
      if (lastLabelPosX.x + lastLabelPosX.width > w.globals.gridWidth && !w.globals.isBarHorizontal) {
        yAxisTextsInversed[0].parentNode.removeChild(yAxisTextsInversed[0]);
      }
      for (let xat = 0; xat < xAxisTextsInversed.length; xat++) {
        graphics.placeTextWithEllipsis(
          xAxisTextsInversed[xat],
          xAxisTextsInversed[xat].textContent,
          w.config.yaxis[0].labels.maxWidth - (w.config.yaxis[0].title.text ? parseFloat(w.config.yaxis[0].title.style.fontSize) * 2 : 0) - 15
        );
      }
    }
  }
  // renderXAxisBands() {
  //   let w = this.w;
  //   let plotBand = document.createElementNS(w.globals.SVGNS, 'rect')
  //   w.globals.dom.elGraphical.add(plotBand)
  // }
}
class Grid {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    const w = this.w;
    this.xaxisLabels = w.globals.labels.slice();
    this.axesUtils = new AxesUtils(ctx);
    this.isRangeBar = w.globals.seriesRange.length && w.globals.isBarHorizontal;
    if (w.globals.timescaleLabels.length > 0) {
      this.xaxisLabels = w.globals.timescaleLabels.slice();
    }
  }
  drawGridArea(elGrid = null) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    if (!elGrid) {
      elGrid = graphics.group({ class: "apexcharts-grid" });
    }
    const elVerticalLine = graphics.drawLine(
      w.globals.padHorizontal,
      1,
      w.globals.padHorizontal,
      w.globals.gridHeight,
      "transparent"
    );
    const elHorzLine = graphics.drawLine(
      w.globals.padHorizontal,
      w.globals.gridHeight,
      w.globals.gridWidth,
      w.globals.gridHeight,
      "transparent"
    );
    elGrid.add(elHorzLine);
    elGrid.add(elVerticalLine);
    return elGrid;
  }
  drawGrid() {
    const gl = this.w.globals;
    if (gl.axisCharts) {
      const elgrid = this.renderGrid();
      this.drawGridArea(elgrid.el);
      return elgrid;
    }
    return null;
  }
  createGridMask() {
    const w = this.w;
    const gl = w.globals;
    const graphics = new Graphics(this.ctx);
    const strokeSize = Array.isArray(w.config.stroke.width) ? Math.max(...w.config.stroke.width) : w.config.stroke.width;
    const createClipPath = (id) => {
      const clipPath = document.createElementNS(gl.SVGNS, "clipPath");
      clipPath.setAttribute("id", id);
      return clipPath;
    };
    gl.dom.elGridRectMask = createClipPath(`gridRectMask${gl.cuid}`);
    gl.dom.elGridRectBarMask = createClipPath(`gridRectBarMask${gl.cuid}`);
    gl.dom.elGridRectMarkerMask = createClipPath(`gridRectMarkerMask${gl.cuid}`);
    gl.dom.elForecastMask = createClipPath(`forecastMask${gl.cuid}`);
    gl.dom.elNonForecastMask = createClipPath(`nonForecastMask${gl.cuid}`);
    const hasBar = ["bar", "rangeBar", "candlestick", "boxPlot"].includes(
      w.config.chart.type
    ) || w.globals.comboBarCount > 0;
    let barWidthLeft = 0;
    let barWidthRight = 0;
    if (hasBar && w.globals.isXNumeric && !w.globals.isBarHorizontal) {
      barWidthLeft = Math.max(
        w.config.grid.padding.left,
        gl.barPadForNumericAxis
      );
      barWidthRight = Math.max(
        w.config.grid.padding.right,
        gl.barPadForNumericAxis
      );
    }
    gl.dom.elGridRect = graphics.drawRect(
      -strokeSize / 2 - 2,
      -strokeSize / 2 - 2,
      gl.gridWidth + strokeSize + 4,
      gl.gridHeight + strokeSize + 4,
      0,
      "#fff"
    );
    gl.dom.elGridRectBar = graphics.drawRect(
      -strokeSize / 2 - barWidthLeft - 2,
      -strokeSize / 2 - 2,
      gl.gridWidth + strokeSize + barWidthRight + barWidthLeft + 4,
      gl.gridHeight + strokeSize + 4,
      0,
      "#fff"
    );
    const markerSize = w.globals.markers.largestSize;
    gl.dom.elGridRectMarker = graphics.drawRect(
      Math.min(-strokeSize / 2 - barWidthLeft - 2, -markerSize),
      -markerSize,
      gl.gridWidth + Math.max(strokeSize + barWidthRight + barWidthLeft + 4, markerSize * 2),
      gl.gridHeight + markerSize * 2,
      0,
      "#fff"
    );
    gl.dom.elGridRectMask.appendChild(gl.dom.elGridRect.node);
    gl.dom.elGridRectBarMask.appendChild(gl.dom.elGridRectBar.node);
    gl.dom.elGridRectMarkerMask.appendChild(gl.dom.elGridRectMarker.node);
    const defs = gl.dom.baseEl.querySelector("defs");
    defs.appendChild(gl.dom.elGridRectMask);
    defs.appendChild(gl.dom.elGridRectBarMask);
    defs.appendChild(gl.dom.elGridRectMarkerMask);
    defs.appendChild(gl.dom.elForecastMask);
    defs.appendChild(gl.dom.elNonForecastMask);
  }
  _drawGridLines({ i, x1, y1, x2, y2, xCount, parent }) {
    const w = this.w;
    const shouldDraw = () => {
      if (i === 0 && w.globals.skipFirstTimelinelabel) return false;
      if (i === xCount - 1 && w.globals.skipLastTimelinelabel && !w.config.xaxis.labels.formatter)
        return false;
      if (w.config.chart.type === "radar") return false;
      return true;
    };
    if (shouldDraw()) {
      if (w.config.grid.xaxis.lines.show) {
        this._drawGridLine({ i, x1, y1, x2, y2, xCount, parent });
      }
      let y_2 = 0;
      if (w.globals.hasXaxisGroups && w.config.xaxis.tickPlacement === "between") {
        const groups = w.globals.groups;
        if (groups) {
          let gacc = 0;
          for (let gi = 0; gacc < i && gi < groups.length; gi++) {
            gacc += groups[gi].cols;
          }
          if (gacc === i) {
            y_2 = w.globals.xAxisLabelsHeight * 0.6;
          }
        }
      }
      const xAxis = new XAxis(this.ctx);
      xAxis.drawXaxisTicks(x1, y_2, w.globals.dom.elGraphical);
    }
  }
  _drawGridLine({ i, x1, y1, x2, y2, xCount, parent }) {
    const w = this.w;
    const isHorzLine = parent.node.classList.contains(
      "apexcharts-gridlines-horizontal"
    );
    const offX = w.globals.barPadForNumericAxis;
    const excludeBorders = y1 === 0 && y2 === 0 || x1 === 0 && x2 === 0 || y1 === w.globals.gridHeight && y2 === w.globals.gridHeight || w.globals.isBarHorizontal && (i === 0 || i === xCount - 1);
    const graphics = new Graphics(this);
    const line = graphics.drawLine(
      x1 - (isHorzLine ? offX : 0),
      y1,
      x2 + (isHorzLine ? offX : 0),
      y2,
      w.config.grid.borderColor,
      w.config.grid.strokeDashArray
    );
    line.node.classList.add("apexcharts-gridline");
    if (excludeBorders && w.config.grid.show) {
      this.elGridBorders.add(line);
    } else {
      parent.add(line);
    }
  }
  _drawGridBandRect({ c, x1, y1, x2, y2, type }) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const offX = w.globals.barPadForNumericAxis;
    const color = w.config.grid[type].colors[c];
    const rect = graphics.drawRect(
      x1 - (type === "row" ? offX : 0),
      y1,
      x2 + (type === "row" ? offX * 2 : 0),
      y2,
      0,
      color,
      w.config.grid[type].opacity
    );
    this.elg.add(rect);
    rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
    rect.node.classList.add(`apexcharts-grid-${type}`);
  }
  _drawXYLines({ xCount, tickAmount }) {
    const w = this.w;
    const datetimeLines = ({ xC, x1, y1, x2, y2 }) => {
      for (let i = 0; i < xC; i++) {
        x1 = this.xaxisLabels[i].position;
        x2 = this.xaxisLabels[i].position;
        this._drawGridLines({
          i,
          x1,
          y1,
          x2,
          y2,
          xCount,
          parent: this.elgridLinesV
        });
      }
    };
    const categoryLines = ({ xC, x1, y1, x2, y2 }) => {
      for (let i = 0; i < xC + (w.globals.isXNumeric ? 0 : 1); i++) {
        if (i === 0 && xC === 1 && w.globals.dataPoints === 1) {
          x1 = w.globals.gridWidth / 2;
          x2 = x1;
        }
        this._drawGridLines({
          i,
          x1,
          y1,
          x2,
          y2,
          xCount,
          parent: this.elgridLinesV
        });
        x1 += w.globals.gridWidth / (w.globals.isXNumeric ? xC - 1 : xC);
        x2 = x1;
      }
    };
    if (w.config.grid.xaxis.lines.show || w.config.xaxis.axisTicks.show) {
      let x1 = w.globals.padHorizontal;
      let y1 = 0;
      let x2;
      let y2 = w.globals.gridHeight;
      if (w.globals.timescaleLabels.length) {
        datetimeLines({ xC: xCount, x1, y1, x2, y2 });
      } else {
        if (w.globals.isXNumeric) {
          xCount = w.globals.xAxisScale.result.length;
        }
        categoryLines({ xC: xCount, x1, y1, x2, y2 });
      }
    }
    if (w.config.grid.yaxis.lines.show) {
      let x1 = 0;
      let y1 = 0;
      let y2 = 0;
      let x2 = w.globals.gridWidth;
      let tA = tickAmount + 1;
      if (this.isRangeBar) {
        tA = w.globals.labels.length;
      }
      for (let i = 0; i < tA + (this.isRangeBar ? 1 : 0); i++) {
        this._drawGridLine({
          i,
          xCount: tA + (this.isRangeBar ? 1 : 0),
          x1,
          y1,
          x2,
          y2,
          parent: this.elgridLinesH
        });
        y1 += w.globals.gridHeight / (this.isRangeBar ? tA : tickAmount);
        y2 = y1;
      }
    }
  }
  _drawInvertedXYLines({ xCount }) {
    const w = this.w;
    if (w.config.grid.xaxis.lines.show || w.config.xaxis.axisTicks.show) {
      let x1 = w.globals.padHorizontal;
      let y1 = 0;
      let x2;
      let y2 = w.globals.gridHeight;
      for (let i = 0; i < xCount + 1; i++) {
        if (w.config.grid.xaxis.lines.show) {
          this._drawGridLine({
            i,
            xCount: xCount + 1,
            x1,
            y1,
            x2,
            y2,
            parent: this.elgridLinesV
          });
        }
        const xAxis = new XAxis(this.ctx);
        xAxis.drawXaxisTicks(x1, 0, w.globals.dom.elGraphical);
        x1 += w.globals.gridWidth / xCount;
        x2 = x1;
      }
    }
    if (w.config.grid.yaxis.lines.show) {
      let x1 = 0;
      let y1 = 0;
      let y2 = 0;
      let x2 = w.globals.gridWidth;
      for (let i = 0; i < w.globals.dataPoints + 1; i++) {
        this._drawGridLine({
          i,
          xCount: w.globals.dataPoints + 1,
          x1,
          y1,
          x2,
          y2,
          parent: this.elgridLinesH
        });
        y1 += w.globals.gridHeight / w.globals.dataPoints;
        y2 = y1;
      }
    }
  }
  renderGrid() {
    var _a, _b, _c;
    const w = this.w;
    const gl = w.globals;
    const graphics = new Graphics(this.ctx);
    this.elg = graphics.group({ class: "apexcharts-grid" });
    this.elgridLinesH = graphics.group({
      class: "apexcharts-gridlines-horizontal"
    });
    this.elgridLinesV = graphics.group({
      class: "apexcharts-gridlines-vertical"
    });
    this.elGridBorders = graphics.group({ class: "apexcharts-grid-borders" });
    this.elg.add(this.elgridLinesH);
    this.elg.add(this.elgridLinesV);
    if (!w.config.grid.show) {
      this.elgridLinesV.hide();
      this.elgridLinesH.hide();
      this.elGridBorders.hide();
    }
    let gridAxisIndex = 0;
    while (gridAxisIndex < gl.seriesYAxisMap.length && gl.ignoreYAxisIndexes.includes(gridAxisIndex)) {
      gridAxisIndex++;
    }
    if (gridAxisIndex === gl.seriesYAxisMap.length) {
      gridAxisIndex = 0;
    }
    let yTickAmount = gl.yAxisScale[gridAxisIndex].result.length - 1;
    let xCount;
    if (!gl.isBarHorizontal || this.isRangeBar) {
      xCount = this.xaxisLabels.length;
      if (this.isRangeBar) {
        yTickAmount = gl.labels.length;
        if (w.config.xaxis.tickAmount && w.config.xaxis.labels.formatter) {
          xCount = w.config.xaxis.tickAmount;
        }
        if (((_c = (_b = (_a = gl.yAxisScale) == null ? void 0 : _a[gridAxisIndex]) == null ? void 0 : _b.result) == null ? void 0 : _c.length) > 0 && w.config.xaxis.type !== "datetime") {
          xCount = gl.yAxisScale[gridAxisIndex].result.length - 1;
        }
      }
      this._drawXYLines({ xCount, tickAmount: yTickAmount });
    } else {
      xCount = yTickAmount;
      yTickAmount = gl.xTickAmount;
      this._drawInvertedXYLines({ xCount, tickAmount: yTickAmount });
    }
    this.drawGridBands(xCount, yTickAmount);
    return {
      el: this.elg,
      elGridBorders: this.elGridBorders,
      xAxisTickWidth: gl.gridWidth / xCount
    };
  }
  drawGridBands(xCount, tickAmount) {
    var _a, _b, _c;
    const w = this.w;
    const drawBands = (type, count, x1, y1, x2, y2) => {
      for (let i = 0, c = 0; i < count; i++, c++) {
        if (c >= w.config.grid[type].colors.length) {
          c = 0;
        }
        this._drawGridBandRect({ c, x1, y1, x2, y2, type });
        y1 += w.globals.gridHeight / tickAmount;
      }
    };
    if (((_a = w.config.grid.row.colors) == null ? void 0 : _a.length) > 0) {
      drawBands(
        "row",
        tickAmount,
        0,
        0,
        w.globals.gridWidth,
        w.globals.gridHeight / tickAmount
      );
    }
    if (((_b = w.config.grid.column.colors) == null ? void 0 : _b.length) > 0) {
      let xc = !w.globals.isBarHorizontal && w.config.xaxis.tickPlacement === "on" && (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) ? xCount - 1 : xCount;
      if (w.globals.isXNumeric) {
        xc = w.globals.xAxisScale.result.length - 1;
      }
      let x1 = w.globals.padHorizontal;
      let y1 = 0;
      let x2 = w.globals.padHorizontal + w.globals.gridWidth / xc;
      let y2 = w.globals.gridHeight;
      for (let i = 0, c = 0; i < xCount; i++, c++) {
        if (c >= w.config.grid.column.colors.length) {
          c = 0;
        }
        if (w.config.xaxis.type === "datetime") {
          x1 = this.xaxisLabels[i].position;
          x2 = (((_c = this.xaxisLabels[i + 1]) == null ? void 0 : _c.position) || w.globals.gridWidth) - this.xaxisLabels[i].position;
        }
        this._drawGridBandRect({ c, x1, y1, x2, y2, type: "column" });
        x1 += w.globals.gridWidth / xc;
      }
    }
  }
}
class Scales {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.coreUtils = new CoreUtils(this.ctx);
  }
  // http://stackoverflow.com/questions/326679/choosing-an-attractive-linear-scale-for-a-graphs-y-axis
  // This routine creates the Y axis values for a graph.
  niceScale(yMin, yMax, index = 0) {
    const jsPrecision = 1e-11;
    const w = this.w;
    const gl = w.globals;
    let axisCnf;
    let maxTicks;
    let gotMin;
    let gotMax;
    if (gl.isBarHorizontal) {
      axisCnf = w.config.xaxis;
      maxTicks = Math.max((gl.svgWidth - 100) / 25, 2);
    } else {
      axisCnf = w.config.yaxis[index];
      maxTicks = Math.max((gl.svgHeight - 100) / 15, 2);
    }
    if (!Utils$1.isNumber(maxTicks)) {
      maxTicks = 10;
    }
    gotMin = axisCnf.min !== void 0 && axisCnf.min !== null;
    gotMax = axisCnf.max !== void 0 && axisCnf.min !== null;
    let gotStepSize = axisCnf.stepSize !== void 0 && axisCnf.stepSize !== null;
    let gotTickAmount = axisCnf.tickAmount !== void 0 && axisCnf.tickAmount !== null;
    let ticks = gotTickAmount ? axisCnf.tickAmount : gl.niceScaleDefaultTicks[Math.min(
      Math.round(maxTicks / 2),
      gl.niceScaleDefaultTicks.length - 1
    )];
    if (gl.isMultipleYAxis && !gotTickAmount && gl.multiAxisTickAmount > 0) {
      ticks = gl.multiAxisTickAmount;
      gotTickAmount = true;
    }
    if (ticks === "dataPoints") {
      ticks = gl.dataPoints - 1;
    } else {
      ticks = Math.abs(Math.round(ticks));
    }
    if (yMin === Number.MIN_VALUE && yMax === 0 || !Utils$1.isNumber(yMin) && !Utils$1.isNumber(yMax) || yMin === Number.MIN_VALUE && yMax === -Number.MAX_VALUE) {
      yMin = Utils$1.isNumber(axisCnf.min) ? axisCnf.min : 0;
      yMax = Utils$1.isNumber(axisCnf.max) ? axisCnf.max : yMin + ticks;
      gl.allSeriesCollapsed = false;
    }
    if (yMin > yMax) {
      console.warn(
        "axis.min cannot be greater than axis.max: swapping min and max"
      );
      let temp = yMax;
      yMax = yMin;
      yMin = temp;
    } else if (yMin === yMax) {
      yMin = yMin === 0 ? 0 : yMin - 1;
      yMax = yMax === 0 ? 2 : yMax + 1;
    }
    let result = [];
    if (ticks < 1) {
      ticks = 1;
    }
    let tiks = ticks;
    let range = Math.abs(yMax - yMin);
    let proximityRatio = 0.15;
    if (!gotMin && yMin > 0 && yMin / range < proximityRatio) {
      yMin = 0;
      gotMin = true;
    }
    if (!gotMax && yMax < 0 && -yMax / range < proximityRatio) {
      yMax = 0;
      gotMax = true;
    }
    range = Math.abs(yMax - yMin);
    let stepSize = range / tiks;
    let niceStep = stepSize;
    let mag = Math.floor(Math.log10(niceStep));
    let magPow = Math.pow(10, mag);
    let magMsd = Math.ceil(niceStep / magPow);
    magMsd = gl.niceScaleAllowedMagMsd[gl.yValueDecimal === 0 ? 0 : 1][magMsd];
    niceStep = magMsd * magPow;
    stepSize = niceStep;
    if (gl.isBarHorizontal && axisCnf.stepSize && axisCnf.type !== "datetime") {
      stepSize = axisCnf.stepSize;
      gotStepSize = true;
    } else if (gotStepSize) {
      stepSize = axisCnf.stepSize;
    }
    if (gotStepSize) {
      if (axisCnf.forceNiceScale) {
        let stepMag = Math.floor(Math.log10(stepSize));
        stepSize *= Math.pow(10, mag - stepMag);
      }
    }
    if (gotMin && gotMax) {
      let crudeStep = range / tiks;
      if (gotTickAmount) {
        if (gotStepSize) {
          if (Utils$1.mod(range, stepSize) != 0) {
            let gcdStep = Utils$1.getGCD(stepSize, crudeStep);
            if (crudeStep / gcdStep < 10) {
              stepSize = gcdStep;
            } else {
              stepSize = crudeStep;
            }
          } else {
            if (Utils$1.mod(stepSize, crudeStep) == 0) {
              stepSize = crudeStep;
            } else {
              crudeStep = stepSize;
              gotTickAmount = false;
            }
          }
        } else {
          stepSize = crudeStep;
        }
      } else {
        if (gotStepSize) {
          if (Utils$1.mod(range, stepSize) == 0) {
            crudeStep = stepSize;
          } else {
            stepSize = crudeStep;
          }
        } else {
          if (Utils$1.mod(range, stepSize) == 0) {
            crudeStep = stepSize;
          } else {
            tiks = Math.ceil(range / stepSize);
            crudeStep = range / tiks;
            let gcdStep = Utils$1.getGCD(range, stepSize);
            if (range / gcdStep < maxTicks) {
              crudeStep = gcdStep;
            }
            stepSize = crudeStep;
          }
        }
      }
      tiks = Math.round(range / stepSize);
    } else {
      if (!gotMin && !gotMax) {
        if (gl.isMultipleYAxis && gotTickAmount) {
          let tMin = stepSize * Math.floor(yMin / stepSize);
          let tMax = tMin + stepSize * tiks;
          if (tMax < yMax) {
            stepSize *= 2;
          }
          yMin = tMin;
          tMax = yMax;
          yMax = yMin + stepSize * tiks;
          range = Math.abs(yMax - yMin);
          if (yMin > 0 && yMin < Math.abs(tMax - yMax)) {
            yMin = 0;
            yMax = stepSize * tiks;
          }
          if (yMax < 0 && -yMax < Math.abs(tMin - yMin)) {
            yMax = 0;
            yMin = -stepSize * tiks;
          }
        } else {
          yMin = stepSize * Math.floor(yMin / stepSize);
          yMax = stepSize * Math.ceil(yMax / stepSize);
        }
      } else if (gotMax) {
        if (gotTickAmount) {
          yMin = yMax - stepSize * tiks;
        } else {
          let yMinPrev = yMin;
          yMin = stepSize * Math.floor(yMin / stepSize);
          if (Math.abs(yMax - yMin) / Utils$1.getGCD(range, stepSize) > maxTicks) {
            yMin = yMax - stepSize * ticks;
            yMin += stepSize * Math.floor((yMinPrev - yMin) / stepSize);
          }
        }
      } else if (gotMin) {
        if (gotTickAmount) {
          yMax = yMin + stepSize * tiks;
        } else {
          let yMaxPrev = yMax;
          yMax = stepSize * Math.ceil(yMax / stepSize);
          if (Math.abs(yMax - yMin) / Utils$1.getGCD(range, stepSize) > maxTicks) {
            yMax = yMin + stepSize * ticks;
            yMax += stepSize * Math.ceil((yMaxPrev - yMax) / stepSize);
          }
        }
      }
      range = Math.abs(yMax - yMin);
      stepSize = Utils$1.getGCD(range, stepSize);
      tiks = Math.round(range / stepSize);
    }
    if (!gotTickAmount && !(gotMin || gotMax)) {
      tiks = Math.ceil((range - jsPrecision) / (stepSize + jsPrecision));
      if (tiks > 16 && Utils$1.getPrimeFactors(tiks).length < 2) {
        tiks++;
      }
    }
    if (!gotTickAmount && axisCnf.forceNiceScale && gl.yValueDecimal === 0 && tiks > range) {
      tiks = range;
      stepSize = Math.round(range / tiks);
    }
    if (tiks > maxTicks && (!(gotTickAmount || gotStepSize) || axisCnf.forceNiceScale)) {
      let pf = Utils$1.getPrimeFactors(tiks);
      let last = pf.length - 1;
      let tt = tiks;
      reduceLoop: for (var xFactors = 0; xFactors < last; xFactors++) {
        for (var lowest = 0; lowest <= last - xFactors; lowest++) {
          let stop = Math.min(lowest + xFactors, last);
          let t = tt;
          let div = 1;
          for (var next = lowest; next <= stop; next++) {
            div *= pf[next];
          }
          t /= div;
          if (t < maxTicks) {
            tt = t;
            break reduceLoop;
          }
        }
      }
      if (tt === tiks) {
        stepSize = range;
      } else {
        stepSize = range / tt;
      }
      tiks = Math.round(range / stepSize);
    }
    if (gl.isMultipleYAxis && gl.multiAxisTickAmount == 0 && gl.ignoreYAxisIndexes.indexOf(index) < 0) {
      gl.multiAxisTickAmount = tiks;
    }
    let val = yMin - stepSize;
    let err = stepSize * jsPrecision;
    do {
      val += stepSize;
      result.push(Utils$1.stripNumber(val, 7));
    } while (yMax - val > err);
    return {
      result,
      niceMin: result[0],
      niceMax: result[result.length - 1]
    };
  }
  linearScale(yMin, yMax, ticks = 10, index = 0, step = void 0) {
    let range = Math.abs(yMax - yMin);
    let result = [];
    if (yMin === yMax) {
      result = [yMin];
      return {
        result,
        niceMin: result[0],
        niceMax: result[result.length - 1]
      };
    }
    ticks = this._adjustTicksForSmallRange(ticks, index, range);
    if (ticks === "dataPoints") {
      ticks = this.w.globals.dataPoints - 1;
    }
    if (!step) {
      step = range / ticks;
    }
    const MIN_PRECISION = 2;
    if (step !== 0 && isFinite(step)) {
      const magnitude = Math.floor(Math.log10(Math.abs(step)));
      const precision = Math.max(MIN_PRECISION, -magnitude + MIN_PRECISION);
      const multiplier = Math.pow(10, precision);
      step = Math.round((step + Number.EPSILON) * multiplier) / multiplier;
    }
    if (ticks === Number.MAX_VALUE) {
      ticks = 5;
      step = 1;
    }
    let v = yMin;
    while (ticks >= 0) {
      result.push(v);
      v = Utils$1.preciseAddition(v, step);
      ticks -= 1;
    }
    return {
      result,
      niceMin: result[0],
      niceMax: result[result.length - 1]
    };
  }
  logarithmicScaleNice(yMin, yMax, base) {
    if (yMax <= 0) yMax = Math.max(yMin, base);
    if (yMin <= 0) yMin = Math.min(yMax, base);
    const logs = [];
    const logMax = Math.ceil(Math.log(yMax) / Math.log(base) + 1);
    const logMin = Math.floor(Math.log(yMin) / Math.log(base));
    for (let i = logMin; i < logMax; i++) {
      logs.push(Math.pow(base, i));
    }
    return {
      result: logs,
      niceMin: logs[0],
      niceMax: logs[logs.length - 1]
    };
  }
  logarithmicScale(yMin, yMax, base) {
    if (yMax <= 0) yMax = Math.max(yMin, base);
    if (yMin <= 0) yMin = Math.min(yMax, base);
    const logs = [];
    const logMax = Math.log(yMax) / Math.log(base);
    const logMin = Math.log(yMin) / Math.log(base);
    const logRange = logMax - logMin;
    const ticks = Math.round(logRange);
    const logTickSpacing = logRange / ticks;
    for (let i = 0, logTick = logMin; i < ticks; i++, logTick += logTickSpacing) {
      logs.push(Math.pow(base, logTick));
    }
    logs.push(Math.pow(base, logMax));
    return {
      result: logs,
      niceMin: yMin,
      niceMax: yMax
    };
  }
  _adjustTicksForSmallRange(ticks, index, range) {
    let newTicks = ticks;
    if (typeof index !== "undefined" && this.w.config.yaxis[index].labels.formatter && this.w.config.yaxis[index].tickAmount === void 0) {
      const formattedVal = Number(
        this.w.config.yaxis[index].labels.formatter(1)
      );
      if (Utils$1.isNumber(formattedVal) && this.w.globals.yValueDecimal === 0) {
        newTicks = Math.ceil(range);
      }
    }
    return newTicks < ticks ? newTicks : ticks;
  }
  setYScaleForIndex(index, minY, maxY) {
    const gl = this.w.globals;
    const cnf = this.w.config;
    let y = gl.isBarHorizontal ? cnf.xaxis : cnf.yaxis[index];
    if (typeof gl.yAxisScale[index] === "undefined") {
      gl.yAxisScale[index] = [];
    }
    let range = Math.abs(maxY - minY);
    if (y.logarithmic && range <= 5) {
      gl.invalidLogScale = true;
    }
    if (y.logarithmic && range > 5) {
      gl.allSeriesCollapsed = false;
      gl.yAxisScale[index] = y.forceNiceScale ? this.logarithmicScaleNice(minY, maxY, y.logBase) : this.logarithmicScale(minY, maxY, y.logBase);
    } else {
      if (maxY === -Number.MAX_VALUE || !Utils$1.isNumber(maxY) || minY === Number.MAX_VALUE || !Utils$1.isNumber(minY)) {
        gl.yAxisScale[index] = this.niceScale(Number.MIN_VALUE, 0, index);
      } else {
        gl.allSeriesCollapsed = false;
        gl.yAxisScale[index] = this.niceScale(minY, maxY, index);
      }
    }
  }
  setXScale(minX, maxX) {
    const w = this.w;
    const gl = w.globals;
    if (maxX === -Number.MAX_VALUE || !Utils$1.isNumber(maxX)) {
      gl.xAxisScale = this.linearScale(0, 10, 10);
    } else {
      let ticks = gl.xTickAmount;
      gl.xAxisScale = this.linearScale(
        minX,
        maxX,
        ticks,
        0,
        w.config.xaxis.max === void 0 ? w.config.xaxis.stepSize : void 0
      );
    }
    return gl.xAxisScale;
  }
  scaleMultipleYAxes() {
    const cnf = this.w.config;
    const gl = this.w.globals;
    this.coreUtils.setSeriesYAxisMappings();
    let axisSeriesMap = gl.seriesYAxisMap;
    let minYArr = gl.minYArr;
    let maxYArr = gl.maxYArr;
    gl.allSeriesCollapsed = true;
    gl.barGroups = [];
    axisSeriesMap.forEach((axisSeries, ai) => {
      let groupNames = [];
      axisSeries.forEach((as) => {
        var _a;
        let group = (_a = cnf.series[as]) == null ? void 0 : _a.group;
        if (groupNames.indexOf(group) < 0) {
          groupNames.push(group);
        }
      });
      if (axisSeries.length > 0) {
        let minY = Number.MAX_VALUE;
        let maxY = -Number.MAX_VALUE;
        let lowestY = minY;
        let highestY = maxY;
        let seriesType;
        let seriesGroupName;
        if (cnf.chart.stacked) {
          let mapSeries = new Array(gl.dataPoints).fill(0);
          let sumSeries = [];
          let posSeries = [];
          let negSeries = [];
          groupNames.forEach(() => {
            sumSeries.push(mapSeries.map(() => Number.MIN_VALUE));
            posSeries.push(mapSeries.map(() => Number.MIN_VALUE));
            negSeries.push(mapSeries.map(() => Number.MIN_VALUE));
          });
          for (let i = 0; i < axisSeries.length; i++) {
            if (!seriesType && cnf.series[axisSeries[i]].type) {
              seriesType = cnf.series[axisSeries[i]].type;
            }
            let si = axisSeries[i];
            if (cnf.series[si].group) {
              seriesGroupName = cnf.series[si].group;
            } else {
              seriesGroupName = "axis-".concat(ai);
            }
            let collapsed = !(gl.collapsedSeriesIndices.indexOf(si) < 0 && gl.ancillaryCollapsedSeriesIndices.indexOf(si) < 0);
            if (!collapsed) {
              gl.allSeriesCollapsed = false;
              groupNames.forEach((gn, gni) => {
                if (cnf.series[si].group === gn) {
                  for (let j2 = 0; j2 < gl.series[si].length; j2++) {
                    let val = gl.series[si][j2];
                    if (val >= 0) {
                      posSeries[gni][j2] += val;
                    } else {
                      negSeries[gni][j2] += val;
                    }
                    sumSeries[gni][j2] += val;
                    lowestY = Math.min(lowestY, val);
                    highestY = Math.max(highestY, val);
                  }
                }
              });
            }
            if (seriesType === "bar" || seriesType === "column") {
              gl.barGroups.push(seriesGroupName);
            }
          }
          if (!seriesType) {
            seriesType = cnf.chart.type;
          }
          if (seriesType === "bar" || seriesType === "column") {
            groupNames.forEach((gn, gni) => {
              minY = Math.min(minY, Math.min.apply(null, negSeries[gni]));
              maxY = Math.max(maxY, Math.max.apply(null, posSeries[gni]));
            });
          } else {
            groupNames.forEach((gn, gni) => {
              lowestY = Math.min(lowestY, Math.min.apply(null, sumSeries[gni]));
              highestY = Math.max(
                highestY,
                Math.max.apply(null, sumSeries[gni])
              );
            });
            minY = lowestY;
            maxY = highestY;
          }
          if (minY === Number.MIN_VALUE && maxY === Number.MIN_VALUE) {
            maxY = -Number.MAX_VALUE;
          }
        } else {
          for (let i = 0; i < axisSeries.length; i++) {
            let si = axisSeries[i];
            minY = Math.min(minY, minYArr[si]);
            maxY = Math.max(maxY, maxYArr[si]);
            let collapsed = !(gl.collapsedSeriesIndices.indexOf(si) < 0 && gl.ancillaryCollapsedSeriesIndices.indexOf(si) < 0);
            if (!collapsed) {
              gl.allSeriesCollapsed = false;
            }
          }
        }
        if (cnf.yaxis[ai].min !== void 0) {
          if (typeof cnf.yaxis[ai].min === "function") {
            minY = cnf.yaxis[ai].min(minY);
          } else {
            minY = cnf.yaxis[ai].min;
          }
        }
        if (cnf.yaxis[ai].max !== void 0) {
          if (typeof cnf.yaxis[ai].max === "function") {
            maxY = cnf.yaxis[ai].max(maxY);
          } else {
            maxY = cnf.yaxis[ai].max;
          }
        }
        gl.barGroups = gl.barGroups.filter((v, i, a) => a.indexOf(v) === i);
        this.setYScaleForIndex(ai, minY, maxY);
        axisSeries.forEach((si) => {
          minYArr[si] = gl.yAxisScale[ai].niceMin;
          maxYArr[si] = gl.yAxisScale[ai].niceMax;
        });
      } else {
        this.setYScaleForIndex(ai, 0, -Number.MAX_VALUE);
      }
    });
  }
}
class Range {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.scales = new Scales(ctx);
  }
  init() {
    this.setYRange();
    this.setXRange();
    this.setZRange();
  }
  getMinYMaxY(startingSeriesIndex, lowestY = Number.MAX_VALUE, highestY = -Number.MAX_VALUE, endingSeriesIndex = null) {
    var _a, _b, _c, _d, _e;
    const cnf = this.w.config;
    const gl = this.w.globals;
    let maxY = -Number.MAX_VALUE;
    let minY = Number.MIN_VALUE;
    if (endingSeriesIndex === null) {
      endingSeriesIndex = startingSeriesIndex + 1;
    }
    let series = gl.series;
    let seriesMin = series;
    let seriesMax = series;
    if (cnf.chart.type === "candlestick") {
      seriesMin = gl.seriesCandleL;
      seriesMax = gl.seriesCandleH;
    } else if (cnf.chart.type === "boxPlot") {
      seriesMin = gl.seriesCandleO;
      seriesMax = gl.seriesCandleC;
    } else if (gl.isRangeData) {
      seriesMin = gl.seriesRangeStart;
      seriesMax = gl.seriesRangeEnd;
    }
    let autoScaleYaxis = false;
    if (gl.seriesX.length >= endingSeriesIndex) {
      let brush = (_a = gl.brushSource) == null ? void 0 : _a.w.config.chart.brush;
      if (cnf.chart.zoom.enabled && cnf.chart.zoom.autoScaleYaxis || (brush == null ? void 0 : brush.enabled) && (brush == null ? void 0 : brush.autoScaleYaxis)) {
        autoScaleYaxis = true;
      }
    }
    for (let i = startingSeriesIndex; i < endingSeriesIndex; i++) {
      gl.dataPoints = Math.max(gl.dataPoints, series[i].length);
      const seriesType = cnf.series[i].type;
      if (gl.categoryLabels.length) {
        gl.dataPoints = gl.categoryLabels.filter(
          (label) => typeof label !== "undefined"
        ).length;
      }
      if (gl.labels.length && cnf.xaxis.type !== "datetime" && gl.series.reduce((a, c) => a + c.length, 0) !== 0) {
        gl.dataPoints = Math.max(gl.dataPoints, gl.labels.length);
      }
      let firstXIndex = 0;
      let lastXIndex = series[i].length - 1;
      if (autoScaleYaxis) {
        if (cnf.xaxis.min) {
          for (; firstXIndex < lastXIndex && gl.seriesX[i][firstXIndex] < cnf.xaxis.min; firstXIndex++) {
          }
        }
        if (cnf.xaxis.max) {
          for (; lastXIndex > firstXIndex && gl.seriesX[i][lastXIndex] > cnf.xaxis.max; lastXIndex--) {
          }
        }
      }
      for (let j2 = firstXIndex; j2 <= lastXIndex && j2 < gl.series[i].length; j2++) {
        let val = series[i][j2];
        if (val !== null && Utils$1.isNumber(val)) {
          if (typeof ((_b = seriesMax[i]) == null ? void 0 : _b[j2]) !== "undefined") {
            maxY = Math.max(maxY, seriesMax[i][j2]);
            lowestY = Math.min(lowestY, seriesMax[i][j2]);
          }
          if (typeof ((_c = seriesMin[i]) == null ? void 0 : _c[j2]) !== "undefined") {
            lowestY = Math.min(lowestY, seriesMin[i][j2]);
            highestY = Math.max(highestY, seriesMin[i][j2]);
          }
          switch (seriesType) {
            case "candlestick":
              {
                if (typeof gl.seriesCandleC[i][j2] !== "undefined") {
                  maxY = Math.max(maxY, gl.seriesCandleH[i][j2]);
                  lowestY = Math.min(lowestY, gl.seriesCandleL[i][j2]);
                }
              }
              break;
            case "boxPlot":
              {
                if (typeof gl.seriesCandleC[i][j2] !== "undefined") {
                  maxY = Math.max(maxY, gl.seriesCandleC[i][j2]);
                  lowestY = Math.min(lowestY, gl.seriesCandleO[i][j2]);
                }
              }
              break;
          }
          if (seriesType && seriesType !== "candlestick" && seriesType !== "boxPlot" && seriesType !== "rangeArea" && seriesType !== "rangeBar") {
            maxY = Math.max(maxY, gl.series[i][j2]);
            lowestY = Math.min(lowestY, gl.series[i][j2]);
          }
          if (gl.seriesGoals[i] && gl.seriesGoals[i][j2] && Array.isArray(gl.seriesGoals[i][j2])) {
            gl.seriesGoals[i][j2].forEach((g) => {
              maxY = Math.max(maxY, g.value);
              lowestY = Math.min(lowestY, g.value);
            });
          }
          highestY = maxY;
          val = Utils$1.noExponents(val);
          if (Utils$1.isFloat(val)) {
            gl.yValueDecimal = Math.max(
              gl.yValueDecimal,
              val.toString().split(".")[1].length
            );
          }
          if (minY > ((_d = seriesMin[i]) == null ? void 0 : _d[j2]) && ((_e = seriesMin[i]) == null ? void 0 : _e[j2]) < 0) {
            minY = seriesMin[i][j2];
          }
        } else {
          gl.hasNullValues = true;
        }
      }
      if (seriesType === "bar" || seriesType === "column") {
        if (minY < 0 && maxY < 0) {
          maxY = 0;
          highestY = Math.max(highestY, 0);
        }
        if (minY === Number.MIN_VALUE) {
          minY = 0;
          lowestY = Math.min(lowestY, 0);
        }
      }
    }
    if (cnf.chart.type === "rangeBar" && gl.seriesRangeStart.length && gl.isBarHorizontal) {
      minY = lowestY;
    }
    if (cnf.chart.type === "bar") {
      if (minY < 0 && maxY < 0) {
        maxY = 0;
      }
      if (minY === Number.MIN_VALUE) {
        minY = 0;
      }
    }
    return {
      minY,
      maxY,
      lowestY,
      highestY
    };
  }
  setYRange() {
    let gl = this.w.globals;
    let cnf = this.w.config;
    gl.maxY = -Number.MAX_VALUE;
    gl.minY = Number.MIN_VALUE;
    let lowestYInAllSeries = Number.MAX_VALUE;
    let minYMaxY;
    if (gl.isMultipleYAxis) {
      lowestYInAllSeries = Number.MAX_VALUE;
      for (let i = 0; i < gl.series.length; i++) {
        minYMaxY = this.getMinYMaxY(i);
        gl.minYArr[i] = minYMaxY.lowestY;
        gl.maxYArr[i] = minYMaxY.highestY;
        lowestYInAllSeries = Math.min(lowestYInAllSeries, minYMaxY.lowestY);
      }
    }
    minYMaxY = this.getMinYMaxY(0, lowestYInAllSeries, null, gl.series.length);
    if (cnf.chart.type === "bar") {
      gl.minY = minYMaxY.minY;
      gl.maxY = minYMaxY.maxY;
    } else {
      gl.minY = minYMaxY.lowestY;
      gl.maxY = minYMaxY.highestY;
    }
    lowestYInAllSeries = minYMaxY.lowestY;
    if (cnf.chart.stacked) {
      this._setStackedMinMax();
    }
    if (cnf.chart.type === "line" || cnf.chart.type === "area" || cnf.chart.type === "scatter" || cnf.chart.type === "candlestick" || cnf.chart.type === "boxPlot" || cnf.chart.type === "rangeBar" && !gl.isBarHorizontal) {
      if (gl.minY === Number.MIN_VALUE && lowestYInAllSeries !== -Number.MAX_VALUE && lowestYInAllSeries !== gl.maxY) {
        gl.minY = lowestYInAllSeries;
      }
    } else {
      gl.minY = gl.minY !== Number.MIN_VALUE ? Math.min(minYMaxY.minY, gl.minY) : minYMaxY.minY;
    }
    cnf.yaxis.forEach((yaxe, index) => {
      if (yaxe.max !== void 0) {
        if (typeof yaxe.max === "number") {
          gl.maxYArr[index] = yaxe.max;
        } else if (typeof yaxe.max === "function") {
          gl.maxYArr[index] = yaxe.max(
            gl.isMultipleYAxis ? gl.maxYArr[index] : gl.maxY
          );
        }
        gl.maxY = gl.maxYArr[index];
      }
      if (yaxe.min !== void 0) {
        if (typeof yaxe.min === "number") {
          gl.minYArr[index] = yaxe.min;
        } else if (typeof yaxe.min === "function") {
          gl.minYArr[index] = yaxe.min(
            gl.isMultipleYAxis ? gl.minYArr[index] === Number.MIN_VALUE ? 0 : gl.minYArr[index] : gl.minY
          );
        }
        gl.minY = gl.minYArr[index];
      }
    });
    if (gl.isBarHorizontal) {
      const minmax = ["min", "max"];
      minmax.forEach((m) => {
        if (cnf.xaxis[m] !== void 0 && typeof cnf.xaxis[m] === "number") {
          m === "min" ? gl.minY = cnf.xaxis[m] : gl.maxY = cnf.xaxis[m];
        }
      });
    }
    if (gl.isMultipleYAxis) {
      this.scales.scaleMultipleYAxes();
      gl.minY = lowestYInAllSeries;
    } else {
      this.scales.setYScaleForIndex(0, gl.minY, gl.maxY);
      gl.minY = gl.yAxisScale[0].niceMin;
      gl.maxY = gl.yAxisScale[0].niceMax;
      gl.minYArr[0] = gl.minY;
      gl.maxYArr[0] = gl.maxY;
    }
    gl.barGroups = [];
    gl.lineGroups = [];
    gl.areaGroups = [];
    cnf.series.forEach((s) => {
      let type = s.type || cnf.chart.type;
      switch (type) {
        case "bar":
        case "column":
          gl.barGroups.push(s.group);
          break;
        case "line":
          gl.lineGroups.push(s.group);
          break;
        case "area":
          gl.areaGroups.push(s.group);
          break;
      }
    });
    gl.barGroups = gl.barGroups.filter((v, i, a) => a.indexOf(v) === i);
    gl.lineGroups = gl.lineGroups.filter((v, i, a) => a.indexOf(v) === i);
    gl.areaGroups = gl.areaGroups.filter((v, i, a) => a.indexOf(v) === i);
    return {
      minY: gl.minY,
      maxY: gl.maxY,
      minYArr: gl.minYArr,
      maxYArr: gl.maxYArr,
      yAxisScale: gl.yAxisScale
    };
  }
  setXRange() {
    let gl = this.w.globals;
    let cnf = this.w.config;
    const isXNumeric = cnf.xaxis.type === "numeric" || cnf.xaxis.type === "datetime" || cnf.xaxis.type === "category" && !gl.noLabelsProvided || gl.noLabelsProvided || gl.isXNumeric;
    const getInitialMinXMaxX = () => {
      for (let i = 0; i < gl.series.length; i++) {
        if (gl.labels[i]) {
          for (let j2 = 0; j2 < gl.labels[i].length; j2++) {
            if (gl.labels[i][j2] !== null && Utils$1.isNumber(gl.labels[i][j2])) {
              gl.maxX = Math.max(gl.maxX, gl.labels[i][j2]);
              gl.initialMaxX = Math.max(gl.maxX, gl.labels[i][j2]);
              gl.minX = Math.min(gl.minX, gl.labels[i][j2]);
              gl.initialMinX = Math.min(gl.minX, gl.labels[i][j2]);
            }
          }
        }
      }
    };
    if (gl.isXNumeric) {
      getInitialMinXMaxX();
    }
    if (gl.noLabelsProvided) {
      if (cnf.xaxis.categories.length === 0) {
        gl.maxX = gl.labels[gl.labels.length - 1];
        gl.initialMaxX = gl.labels[gl.labels.length - 1];
        gl.minX = 1;
        gl.initialMinX = 1;
      }
    }
    if (gl.isXNumeric || gl.noLabelsProvided || gl.dataFormatXNumeric) {
      let ticks = 10;
      if (cnf.xaxis.tickAmount === void 0) {
        ticks = Math.round(gl.svgWidth / 150);
        if (cnf.xaxis.type === "numeric" && gl.dataPoints < 30) {
          ticks = gl.dataPoints - 1;
        }
        if (ticks > gl.dataPoints && gl.dataPoints !== 0) {
          ticks = gl.dataPoints - 1;
        }
      } else if (cnf.xaxis.tickAmount === "dataPoints") {
        if (gl.series.length > 1) {
          ticks = gl.series[gl.maxValsInArrayIndex].length - 1;
        }
        if (gl.isXNumeric) {
          const diff = Math.round(gl.maxX - gl.minX);
          if (diff < 30) {
            ticks = diff;
          }
        }
      } else {
        ticks = cnf.xaxis.tickAmount;
      }
      gl.xTickAmount = ticks;
      if (cnf.xaxis.max !== void 0 && typeof cnf.xaxis.max === "number") {
        gl.maxX = cnf.xaxis.max;
      }
      if (cnf.xaxis.min !== void 0 && typeof cnf.xaxis.min === "number") {
        gl.minX = cnf.xaxis.min;
      }
      if (cnf.xaxis.range !== void 0) {
        gl.minX = gl.maxX - cnf.xaxis.range;
      }
      if (gl.minX !== Number.MAX_VALUE && gl.maxX !== -Number.MAX_VALUE) {
        if (cnf.xaxis.convertedCatToNumeric && !gl.dataFormatXNumeric) {
          let catScale = [];
          for (let i = gl.minX - 1; i < gl.maxX; i++) {
            catScale.push(i + 1);
          }
          gl.xAxisScale = {
            result: catScale,
            niceMin: catScale[0],
            niceMax: catScale[catScale.length - 1]
          };
        } else {
          gl.xAxisScale = this.scales.setXScale(gl.minX, gl.maxX);
        }
      } else {
        gl.xAxisScale = this.scales.linearScale(
          0,
          ticks,
          ticks,
          0,
          cnf.xaxis.stepSize
        );
        if (gl.noLabelsProvided && gl.labels.length > 0) {
          gl.xAxisScale = this.scales.linearScale(
            1,
            gl.labels.length,
            ticks - 1,
            0,
            cnf.xaxis.stepSize
          );
          gl.seriesX = gl.labels.slice();
        }
      }
      if (isXNumeric) {
        gl.labels = gl.xAxisScale.result.slice();
      }
    }
    if (gl.isBarHorizontal && gl.labels.length) {
      gl.xTickAmount = gl.labels.length;
    }
    this._handleSingleDataPoint();
    this._getMinXDiff();
    return {
      minX: gl.minX,
      maxX: gl.maxX
    };
  }
  setZRange() {
    let gl = this.w.globals;
    if (!gl.isDataXYZ) return;
    for (let i = 0; i < gl.series.length; i++) {
      if (typeof gl.seriesZ[i] !== "undefined") {
        for (let j2 = 0; j2 < gl.seriesZ[i].length; j2++) {
          if (gl.seriesZ[i][j2] !== null && Utils$1.isNumber(gl.seriesZ[i][j2])) {
            gl.maxZ = Math.max(gl.maxZ, gl.seriesZ[i][j2]);
            gl.minZ = Math.min(gl.minZ, gl.seriesZ[i][j2]);
          }
        }
      }
    }
  }
  _handleSingleDataPoint() {
    const gl = this.w.globals;
    const cnf = this.w.config;
    if (gl.minX === gl.maxX) {
      let datetimeObj = new DateTime(this.ctx);
      if (cnf.xaxis.type === "datetime") {
        const newMinX = datetimeObj.getDate(gl.minX);
        if (cnf.xaxis.labels.datetimeUTC) {
          newMinX.setUTCDate(newMinX.getUTCDate() - 2);
        } else {
          newMinX.setDate(newMinX.getDate() - 2);
        }
        gl.minX = new Date(newMinX).getTime();
        const newMaxX = datetimeObj.getDate(gl.maxX);
        if (cnf.xaxis.labels.datetimeUTC) {
          newMaxX.setUTCDate(newMaxX.getUTCDate() + 2);
        } else {
          newMaxX.setDate(newMaxX.getDate() + 2);
        }
        gl.maxX = new Date(newMaxX).getTime();
      } else if (cnf.xaxis.type === "numeric" || cnf.xaxis.type === "category" && !gl.noLabelsProvided) {
        gl.minX = gl.minX - 2;
        gl.initialMinX = gl.minX;
        gl.maxX = gl.maxX + 2;
        gl.initialMaxX = gl.maxX;
      }
    }
  }
  _getMinXDiff() {
    const gl = this.w.globals;
    if (gl.isXNumeric) {
      gl.seriesX.forEach((sX, i) => {
        if (sX.length) {
          if (sX.length === 1) {
            sX.push(
              gl.seriesX[gl.maxValsInArrayIndex][gl.seriesX[gl.maxValsInArrayIndex].length - 1]
            );
          }
          const seriesX = sX.slice();
          seriesX.sort((a, b) => a - b);
          seriesX.forEach((s, j2) => {
            if (j2 > 0) {
              let xDiff = s - seriesX[j2 - 1];
              if (xDiff > 0) {
                gl.minXDiff = Math.min(xDiff, gl.minXDiff);
              }
            }
          });
          if (gl.dataPoints === 1 || gl.minXDiff === Number.MAX_VALUE) {
            gl.minXDiff = 0.5;
          }
        }
      });
    }
  }
  _setStackedMinMax() {
    const gl = this.w.globals;
    if (!gl.series.length) return;
    let seriesGroups = gl.seriesGroups;
    if (!seriesGroups.length) {
      seriesGroups = [this.w.globals.seriesNames.map((name2) => name2)];
    }
    let stackedPoss = {};
    let stackedNegs = {};
    seriesGroups.forEach((group) => {
      stackedPoss[group] = [];
      stackedNegs[group] = [];
      const indicesOfSeriesInGroup = this.w.config.series.map(
        (serie, si) => group.indexOf(gl.seriesNames[si]) > -1 ? si : null
      ).filter((f) => f !== null);
      indicesOfSeriesInGroup.forEach((i) => {
        var _a, _b, _c, _d;
        for (let j2 = 0; j2 < gl.series[gl.maxValsInArrayIndex].length; j2++) {
          if (typeof stackedPoss[group][j2] === "undefined") {
            stackedPoss[group][j2] = 0;
            stackedNegs[group][j2] = 0;
          }
          let stackSeries = this.w.config.chart.stacked && !gl.comboCharts || this.w.config.chart.stacked && gl.comboCharts && (!this.w.config.chart.stackOnlyBar || ((_b = (_a = this.w.config.series) == null ? void 0 : _a[i]) == null ? void 0 : _b.type) === "bar" || ((_d = (_c = this.w.config.series) == null ? void 0 : _c[i]) == null ? void 0 : _d.type) === "column");
          if (stackSeries) {
            if (gl.series[i][j2] !== null && Utils$1.isNumber(gl.series[i][j2])) {
              gl.series[i][j2] > 0 ? stackedPoss[group][j2] += parseFloat(gl.series[i][j2]) + 1e-4 : stackedNegs[group][j2] += parseFloat(gl.series[i][j2]);
            }
          }
        }
      });
    });
    Object.entries(stackedPoss).forEach(([key]) => {
      stackedPoss[key].forEach((_, stgi) => {
        gl.maxY = Math.max(gl.maxY, stackedPoss[key][stgi]);
        gl.minY = Math.min(gl.minY, stackedNegs[key][stgi]);
      });
    });
  }
}
class YAxis {
  constructor(ctx, elgrid) {
    this.ctx = ctx;
    this.elgrid = elgrid;
    this.w = ctx.w;
    const w = this.w;
    this.xaxisFontSize = w.config.xaxis.labels.style.fontSize;
    this.axisFontFamily = w.config.xaxis.labels.style.fontFamily;
    this.xaxisForeColors = w.config.xaxis.labels.style.colors;
    this.isCategoryBarHorizontal = w.config.chart.type === "bar" && w.config.plotOptions.bar.horizontal;
    this.xAxisoffX = w.config.xaxis.position === "bottom" ? w.globals.gridHeight : 0;
    this.drawnLabels = [];
    this.axesUtils = new AxesUtils(ctx);
  }
  drawYaxis(realIndex2) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const yaxisStyle = w.config.yaxis[realIndex2].labels.style;
    const {
      fontSize: yaxisFontSize,
      fontFamily: yaxisFontFamily,
      fontWeight: yaxisFontWeight
    } = yaxisStyle;
    const elYaxis = graphics.group({
      class: "apexcharts-yaxis",
      rel: realIndex2,
      transform: `translate(${w.globals.translateYAxisX[realIndex2]}, 0)`
    });
    if (this.axesUtils.isYAxisHidden(realIndex2)) return elYaxis;
    const elYaxisTexts = graphics.group({ class: "apexcharts-yaxis-texts-g" });
    elYaxis.add(elYaxisTexts);
    const tickAmount = w.globals.yAxisScale[realIndex2].result.length - 1;
    const labelsDivider = w.globals.gridHeight / tickAmount;
    const lbFormatter = w.globals.yLabelFormatters[realIndex2];
    let labels = this.axesUtils.checkForReversedLabels(
      realIndex2,
      w.globals.yAxisScale[realIndex2].result.slice()
    );
    if (w.config.yaxis[realIndex2].labels.show) {
      let lY = w.globals.translateY + w.config.yaxis[realIndex2].labels.offsetY;
      if (w.globals.isBarHorizontal) lY = 0;
      else if (w.config.chart.type === "heatmap") lY -= labelsDivider / 2;
      lY += parseInt(yaxisFontSize, 10) / 3;
      for (let i = tickAmount; i >= 0; i--) {
        let val = lbFormatter(labels[i], i, w);
        let xPad = w.config.yaxis[realIndex2].labels.padding;
        if (w.config.yaxis[realIndex2].opposite && w.config.yaxis.length !== 0)
          xPad *= -1;
        const textAnchor = this.getTextAnchor(
          w.config.yaxis[realIndex2].labels.align,
          w.config.yaxis[realIndex2].opposite
        );
        const yColors = this.axesUtils.getYAxisForeColor(
          yaxisStyle.colors,
          realIndex2
        );
        const foreColor = Array.isArray(yColors) ? yColors[i] : yColors;
        const existingYLabels = Utils$1.listToArray(
          w.globals.dom.baseEl.querySelectorAll(
            `.apexcharts-yaxis[rel='${realIndex2}'] .apexcharts-yaxis-label tspan`
          )
        ).map((label2) => label2.textContent);
        const label = graphics.drawText({
          x: xPad,
          y: lY,
          text: existingYLabels.includes(val) && !w.config.yaxis[realIndex2].labels.showDuplicates ? "" : val,
          textAnchor,
          fontSize: yaxisFontSize,
          fontFamily: yaxisFontFamily,
          fontWeight: yaxisFontWeight,
          maxWidth: w.config.yaxis[realIndex2].labels.maxWidth,
          foreColor,
          isPlainText: false,
          cssClass: `apexcharts-yaxis-label ${yaxisStyle.cssClass}`
        });
        elYaxisTexts.add(label);
        this.addTooltip(label, val);
        if (w.config.yaxis[realIndex2].labels.rotate !== 0) {
          this.rotateLabel(
            graphics,
            label,
            firstLabel,
            w.config.yaxis[realIndex2].labels.rotate
          );
        }
        lY += labelsDivider;
      }
    }
    this.addYAxisTitle(graphics, elYaxis, realIndex2);
    this.addAxisBorder(graphics, elYaxis, realIndex2, tickAmount, labelsDivider);
    return elYaxis;
  }
  getTextAnchor(align, opposite) {
    if (align === "left") return "start";
    if (align === "center") return "middle";
    if (align === "right") return "end";
    return opposite ? "start" : "end";
  }
  addTooltip(label, val) {
    const elTooltipTitle = document.createElementNS(
      this.w.globals.SVGNS,
      "title"
    );
    elTooltipTitle.textContent = Array.isArray(val) ? val.join(" ") : val;
    label.node.appendChild(elTooltipTitle);
  }
  rotateLabel(graphics, label, firstLabel2, rotate) {
    const firstLabelCenter = graphics.rotateAroundCenter(firstLabel2.node);
    const labelCenter = graphics.rotateAroundCenter(label.node);
    label.node.setAttribute(
      "transform",
      `rotate(${rotate} ${firstLabelCenter.x} ${labelCenter.y})`
    );
  }
  addYAxisTitle(graphics, elYaxis, realIndex2) {
    const w = this.w;
    if (w.config.yaxis[realIndex2].title.text !== void 0) {
      const elYaxisTitle = graphics.group({ class: "apexcharts-yaxis-title" });
      const x = w.config.yaxis[realIndex2].opposite ? w.globals.translateYAxisX[realIndex2] : 0;
      const elYAxisTitleText = graphics.drawText({
        x,
        y: w.globals.gridHeight / 2 + w.globals.translateY + w.config.yaxis[realIndex2].title.offsetY,
        text: w.config.yaxis[realIndex2].title.text,
        textAnchor: "end",
        foreColor: w.config.yaxis[realIndex2].title.style.color,
        fontSize: w.config.yaxis[realIndex2].title.style.fontSize,
        fontWeight: w.config.yaxis[realIndex2].title.style.fontWeight,
        fontFamily: w.config.yaxis[realIndex2].title.style.fontFamily,
        cssClass: `apexcharts-yaxis-title-text ${w.config.yaxis[realIndex2].title.style.cssClass}`
      });
      elYaxisTitle.add(elYAxisTitleText);
      elYaxis.add(elYaxisTitle);
    }
  }
  addAxisBorder(graphics, elYaxis, realIndex2, tickAmount, labelsDivider) {
    const w = this.w;
    const axisBorder = w.config.yaxis[realIndex2].axisBorder;
    let x = 31 + axisBorder.offsetX;
    if (w.config.yaxis[realIndex2].opposite) x = -31 - axisBorder.offsetX;
    if (axisBorder.show) {
      const elVerticalLine = graphics.drawLine(
        x,
        w.globals.translateY + axisBorder.offsetY - 2,
        x,
        w.globals.gridHeight + w.globals.translateY + axisBorder.offsetY + 2,
        axisBorder.color,
        0,
        axisBorder.width
      );
      elYaxis.add(elVerticalLine);
    }
    if (w.config.yaxis[realIndex2].axisTicks.show) {
      this.axesUtils.drawYAxisTicks(
        x,
        tickAmount,
        axisBorder,
        w.config.yaxis[realIndex2].axisTicks,
        realIndex2,
        labelsDivider,
        elYaxis
      );
    }
  }
  drawYaxisInversed(realIndex2) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const elXaxis = graphics.group({
      class: "apexcharts-xaxis apexcharts-yaxis-inversed"
    });
    const elXaxisTexts = graphics.group({
      class: "apexcharts-xaxis-texts-g",
      transform: `translate(${w.globals.translateXAxisX}, ${w.globals.translateXAxisY})`
    });
    elXaxis.add(elXaxisTexts);
    let tickAmount = w.globals.yAxisScale[realIndex2].result.length - 1;
    const labelsDivider = w.globals.gridWidth / tickAmount + 0.1;
    let l = labelsDivider + w.config.xaxis.labels.offsetX;
    const lbFormatter = w.globals.xLabelFormatter;
    let labels = this.axesUtils.checkForReversedLabels(
      realIndex2,
      w.globals.yAxisScale[realIndex2].result.slice()
    );
    const timescaleLabels = w.globals.timescaleLabels;
    if (timescaleLabels.length > 0) {
      this.xaxisLabels = timescaleLabels.slice();
      labels = timescaleLabels.slice();
      tickAmount = labels.length;
    }
    if (w.config.xaxis.labels.show) {
      for (let i = timescaleLabels.length ? 0 : tickAmount; timescaleLabels.length ? i < timescaleLabels.length : i >= 0; timescaleLabels.length ? i++ : i--) {
        let val = lbFormatter(labels[i], i, w);
        let x = w.globals.gridWidth + w.globals.padHorizontal - (l - labelsDivider + w.config.xaxis.labels.offsetX);
        if (timescaleLabels.length) {
          const label = this.axesUtils.getLabel(
            labels,
            timescaleLabels,
            x,
            i,
            this.drawnLabels,
            this.xaxisFontSize
          );
          x = label.x;
          val = label.text;
          this.drawnLabels.push(label.text);
          if (i === 0 && w.globals.skipFirstTimelinelabel) val = "";
          if (i === labels.length - 1 && w.globals.skipLastTimelinelabel)
            val = "";
        }
        const elTick = graphics.drawText({
          x,
          y: this.xAxisoffX + w.config.xaxis.labels.offsetY + 30 - (w.config.xaxis.position === "top" ? w.globals.xAxisHeight + w.config.xaxis.axisTicks.height - 2 : 0),
          text: val,
          textAnchor: "middle",
          foreColor: Array.isArray(this.xaxisForeColors) ? this.xaxisForeColors[realIndex2] : this.xaxisForeColors,
          fontSize: this.xaxisFontSize,
          fontFamily: this.xaxisFontFamily,
          fontWeight: w.config.xaxis.labels.style.fontWeight,
          isPlainText: false,
          cssClass: `apexcharts-xaxis-label ${w.config.xaxis.labels.style.cssClass}`
        });
        elXaxisTexts.add(elTick);
        elTick.tspan(val);
        this.addTooltip(elTick, val);
        l += labelsDivider;
      }
    }
    this.inversedYAxisTitleText(elXaxis);
    this.inversedYAxisBorder(elXaxis);
    return elXaxis;
  }
  inversedYAxisBorder(parent) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const axisBorder = w.config.xaxis.axisBorder;
    if (axisBorder.show) {
      let lineCorrection = 0;
      if (w.config.chart.type === "bar" && w.globals.isXNumeric)
        lineCorrection -= 15;
      const elHorzLine = graphics.drawLine(
        w.globals.padHorizontal + lineCorrection + axisBorder.offsetX,
        this.xAxisoffX,
        w.globals.gridWidth,
        this.xAxisoffX,
        axisBorder.color,
        0,
        axisBorder.height
      );
      if (this.elgrid && this.elgrid.elGridBorders && w.config.grid.show) {
        this.elgrid.elGridBorders.add(elHorzLine);
      } else {
        parent.add(elHorzLine);
      }
    }
  }
  inversedYAxisTitleText(parent) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    if (w.config.xaxis.title.text !== void 0) {
      const elYaxisTitle = graphics.group({
        class: "apexcharts-xaxis-title apexcharts-yaxis-title-inversed"
      });
      const elYAxisTitleText = graphics.drawText({
        x: w.globals.gridWidth / 2 + w.config.xaxis.title.offsetX,
        y: this.xAxisoffX + parseFloat(this.xaxisFontSize) + parseFloat(w.config.xaxis.title.style.fontSize) + w.config.xaxis.title.offsetY + 20,
        text: w.config.xaxis.title.text,
        textAnchor: "middle",
        fontSize: w.config.xaxis.title.style.fontSize,
        fontFamily: w.config.xaxis.title.style.fontFamily,
        fontWeight: w.config.xaxis.title.style.fontWeight,
        foreColor: w.config.xaxis.title.style.color,
        cssClass: `apexcharts-xaxis-title-text ${w.config.xaxis.title.style.cssClass}`
      });
      elYaxisTitle.add(elYAxisTitleText);
      parent.add(elYaxisTitle);
    }
  }
  yAxisTitleRotate(realIndex2, yAxisOpposite) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const elYAxisLabelsWrap = w.globals.dom.baseEl.querySelector(
      `.apexcharts-yaxis[rel='${realIndex2}'] .apexcharts-yaxis-texts-g`
    );
    const yAxisLabelsCoord = elYAxisLabelsWrap ? elYAxisLabelsWrap.getBoundingClientRect() : { width: 0, height: 0 };
    const yAxisTitle = w.globals.dom.baseEl.querySelector(
      `.apexcharts-yaxis[rel='${realIndex2}'] .apexcharts-yaxis-title text`
    );
    const yAxisTitleCoord = yAxisTitle ? yAxisTitle.getBoundingClientRect() : { width: 0, height: 0 };
    if (yAxisTitle) {
      const x = this.xPaddingForYAxisTitle(
        realIndex2,
        yAxisLabelsCoord,
        yAxisTitleCoord,
        yAxisOpposite
      );
      yAxisTitle.setAttribute("x", x.xPos - (yAxisOpposite ? 10 : 0));
      const titleRotatingCenter = graphics.rotateAroundCenter(yAxisTitle);
      yAxisTitle.setAttribute(
        "transform",
        `rotate(${yAxisOpposite ? w.config.yaxis[realIndex2].title.rotate * -1 : w.config.yaxis[realIndex2].title.rotate} ${titleRotatingCenter.x} ${titleRotatingCenter.y})`
      );
    }
  }
  xPaddingForYAxisTitle(realIndex2, yAxisLabelsCoord, yAxisTitleCoord, yAxisOpposite) {
    const w = this.w;
    let x = 0;
    let padd = 10;
    if (w.config.yaxis[realIndex2].title.text === void 0 || realIndex2 < 0) {
      return { xPos: x, padd: 0 };
    }
    if (yAxisOpposite) {
      x = yAxisLabelsCoord.width + w.config.yaxis[realIndex2].title.offsetX + yAxisTitleCoord.width / 2 + padd / 2;
    } else {
      x = yAxisLabelsCoord.width * -1 + w.config.yaxis[realIndex2].title.offsetX + padd / 2 + yAxisTitleCoord.width / 2;
      if (w.globals.isBarHorizontal) {
        padd = 25;
        x = yAxisLabelsCoord.width * -1 - w.config.yaxis[realIndex2].title.offsetX - padd;
      }
    }
    return { xPos: x, padd };
  }
  setYAxisXPosition(yaxisLabelCoords, yTitleCoords) {
    const w = this.w;
    let xLeft = 0;
    let xRight = 0;
    let leftOffsetX = 18;
    let rightOffsetX = 1;
    if (w.config.yaxis.length > 1) this.multipleYs = true;
    w.config.yaxis.forEach((yaxe, index) => {
      const shouldNotDrawAxis = w.globals.ignoreYAxisIndexes.includes(index) || !yaxe.show || yaxe.floating || yaxisLabelCoords[index].width === 0;
      const axisWidth = yaxisLabelCoords[index].width + yTitleCoords[index].width;
      if (!yaxe.opposite) {
        xLeft = w.globals.translateX - leftOffsetX;
        if (!shouldNotDrawAxis) leftOffsetX += axisWidth + 20;
        w.globals.translateYAxisX[index] = xLeft + yaxe.labels.offsetX;
      } else {
        if (w.globals.isBarHorizontal) {
          xRight = w.globals.gridWidth + w.globals.translateX - 1;
          w.globals.translateYAxisX[index] = xRight - yaxe.labels.offsetX;
        } else {
          xRight = w.globals.gridWidth + w.globals.translateX + rightOffsetX;
          if (!shouldNotDrawAxis) rightOffsetX += axisWidth + 20;
          w.globals.translateYAxisX[index] = xRight - yaxe.labels.offsetX + 20;
        }
      }
    });
  }
  setYAxisTextAlignments() {
    const w = this.w;
    const yaxis = Utils$1.listToArray(
      w.globals.dom.baseEl.getElementsByClassName("apexcharts-yaxis")
    );
    yaxis.forEach((y, index) => {
      const yaxe = w.config.yaxis[index];
      if (yaxe && !yaxe.floating && yaxe.labels.align !== void 0) {
        const yAxisInner = w.globals.dom.baseEl.querySelector(
          `.apexcharts-yaxis[rel='${index}'] .apexcharts-yaxis-texts-g`
        );
        const yAxisTexts = Utils$1.listToArray(
          w.globals.dom.baseEl.querySelectorAll(
            `.apexcharts-yaxis[rel='${index}'] .apexcharts-yaxis-label`
          )
        );
        const rect = yAxisInner.getBoundingClientRect();
        yAxisTexts.forEach((label) => {
          label.setAttribute("text-anchor", yaxe.labels.align);
        });
        if (yaxe.labels.align === "left" && !yaxe.opposite) {
          yAxisInner.setAttribute("transform", `translate(-${rect.width}, 0)`);
        } else if (yaxe.labels.align === "center") {
          yAxisInner.setAttribute(
            "transform",
            `translate(${rect.width / 2 * (!yaxe.opposite ? -1 : 1)}, 0)`
          );
        } else if (yaxe.labels.align === "right" && yaxe.opposite) {
          yAxisInner.setAttribute("transform", `translate(${rect.width}, 0)`);
        }
      }
    });
  }
}
class Events {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.documentEvent = Utils$1.bind(this.documentEvent, this);
  }
  addEventListener(name2, handler) {
    const w = this.w;
    if (w.globals.events.hasOwnProperty(name2)) {
      w.globals.events[name2].push(handler);
    } else {
      w.globals.events[name2] = [handler];
    }
  }
  removeEventListener(name2, handler) {
    const w = this.w;
    if (!w.globals.events.hasOwnProperty(name2)) {
      return;
    }
    let index = w.globals.events[name2].indexOf(handler);
    if (index !== -1) {
      w.globals.events[name2].splice(index, 1);
    }
  }
  fireEvent(name2, args) {
    const w = this.w;
    if (!w.globals.events.hasOwnProperty(name2)) {
      return;
    }
    if (!args || !args.length) {
      args = [];
    }
    let evs = w.globals.events[name2];
    let l = evs.length;
    for (let i = 0; i < l; i++) {
      evs[i].apply(null, args);
    }
  }
  setupEventHandlers() {
    const w = this.w;
    const me = this.ctx;
    let clickableArea = w.globals.dom.baseEl.querySelector(w.globals.chartClass);
    this.ctx.eventList.forEach((event) => {
      clickableArea.addEventListener(
        event,
        (e) => {
          let capturedSeriesIndex = e.target.getAttribute("i") === null && w.globals.capturedSeriesIndex !== -1 ? w.globals.capturedSeriesIndex : e.target.getAttribute("i");
          let capturedDataPointIndex = e.target.getAttribute("j") === null && w.globals.capturedDataPointIndex !== -1 ? w.globals.capturedDataPointIndex : e.target.getAttribute("j");
          const opts = Object.assign({}, w, {
            seriesIndex: w.globals.axisCharts ? capturedSeriesIndex : 0,
            dataPointIndex: capturedDataPointIndex
          });
          if (e.type === "mousemove" || e.type === "touchmove") {
            if (typeof w.config.chart.events.mouseMove === "function") {
              w.config.chart.events.mouseMove(e, me, opts);
            }
          } else if (e.type === "mouseleave" || e.type === "touchleave") {
            if (typeof w.config.chart.events.mouseLeave === "function") {
              w.config.chart.events.mouseLeave(e, me, opts);
            }
          } else if (e.type === "mouseup" && e.which === 1 || e.type === "touchend") {
            if (typeof w.config.chart.events.click === "function") {
              w.config.chart.events.click(e, me, opts);
            }
            me.ctx.events.fireEvent("click", [e, me, opts]);
          }
        },
        { capture: false, passive: true }
      );
    });
    this.ctx.eventList.forEach((event) => {
      w.globals.dom.baseEl.addEventListener(event, this.documentEvent, {
        passive: true
      });
    });
    this.ctx.core.setupBrushHandler();
  }
  documentEvent(e) {
    const w = this.w;
    const target = e.target.className;
    if (e.type === "click") {
      let elMenu = w.globals.dom.baseEl.querySelector(".apexcharts-menu");
      if (elMenu && elMenu.classList.contains("apexcharts-menu-open") && target !== "apexcharts-menu-icon") {
        elMenu.classList.remove("apexcharts-menu-open");
      }
    }
    w.globals.clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    w.globals.clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
  }
}
class Localization {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  setCurrentLocaleValues(localeName) {
    let locales = this.w.config.chart.locales;
    if (window.Apex.chart && window.Apex.chart.locales && window.Apex.chart.locales.length > 0) {
      locales = this.w.config.chart.locales.concat(window.Apex.chart.locales);
    }
    const selectedLocale = locales.filter((c) => c.name === localeName)[0];
    if (selectedLocale) {
      let ret = Utils$1.extend(en, selectedLocale);
      this.w.globals.locale = ret.options;
    } else {
      throw new Error(
        "Wrong locale name provided. Please make sure you set the correct locale name in options"
      );
    }
  }
}
class Axes {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  drawAxis(type, elgrid) {
    let gl = this.w.globals;
    let cnf = this.w.config;
    let xAxis = new XAxis(this.ctx, elgrid);
    let yAxis = new YAxis(this.ctx, elgrid);
    if (gl.axisCharts && type !== "radar") {
      let elXaxis, elYaxis;
      if (gl.isBarHorizontal) {
        elYaxis = yAxis.drawYaxisInversed(0);
        elXaxis = xAxis.drawXaxisInversed(0);
        gl.dom.elGraphical.add(elXaxis);
        gl.dom.elGraphical.add(elYaxis);
      } else {
        elXaxis = xAxis.drawXaxis();
        gl.dom.elGraphical.add(elXaxis);
        cnf.yaxis.map((yaxe, index) => {
          if (gl.ignoreYAxisIndexes.indexOf(index) === -1) {
            elYaxis = yAxis.drawYaxis(index);
            gl.dom.Paper.add(elYaxis);
            if (this.w.config.grid.position === "back") {
              const inner = gl.dom.Paper.children()[1];
              inner.remove();
              gl.dom.Paper.add(inner);
            }
          }
        });
      }
    }
  }
}
class Crosshairs {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  drawXCrosshairs() {
    const w = this.w;
    let graphics = new Graphics(this.ctx);
    let filters = new Filters(this.ctx);
    let crosshairGradient = w.config.xaxis.crosshairs.fill.gradient;
    let crosshairShadow = w.config.xaxis.crosshairs.dropShadow;
    let fillType = w.config.xaxis.crosshairs.fill.type;
    let gradientFrom = crosshairGradient.colorFrom;
    let gradientTo = crosshairGradient.colorTo;
    let opacityFrom = crosshairGradient.opacityFrom;
    let opacityTo = crosshairGradient.opacityTo;
    let stops = crosshairGradient.stops;
    let shadow = "none";
    let dropShadow = crosshairShadow.enabled;
    let shadowLeft = crosshairShadow.left;
    let shadowTop = crosshairShadow.top;
    let shadowBlur = crosshairShadow.blur;
    let shadowColor = crosshairShadow.color;
    let shadowOpacity = crosshairShadow.opacity;
    let xcrosshairsFill = w.config.xaxis.crosshairs.fill.color;
    if (w.config.xaxis.crosshairs.show) {
      if (fillType === "gradient") {
        xcrosshairsFill = graphics.drawGradient(
          "vertical",
          gradientFrom,
          gradientTo,
          opacityFrom,
          opacityTo,
          null,
          stops,
          null
        );
      }
      let xcrosshairs = graphics.drawRect();
      if (w.config.xaxis.crosshairs.width === 1) {
        xcrosshairs = graphics.drawLine();
      }
      let gridHeight = w.globals.gridHeight;
      if (!Utils$1.isNumber(gridHeight) || gridHeight < 0) {
        gridHeight = 0;
      }
      let crosshairsWidth = w.config.xaxis.crosshairs.width;
      if (!Utils$1.isNumber(crosshairsWidth) || crosshairsWidth < 0) {
        crosshairsWidth = 0;
      }
      xcrosshairs.attr({
        class: "apexcharts-xcrosshairs",
        x: 0,
        y: 0,
        y2: gridHeight,
        width: crosshairsWidth,
        height: gridHeight,
        fill: xcrosshairsFill,
        filter: shadow,
        "fill-opacity": w.config.xaxis.crosshairs.opacity,
        stroke: w.config.xaxis.crosshairs.stroke.color,
        "stroke-width": w.config.xaxis.crosshairs.stroke.width,
        "stroke-dasharray": w.config.xaxis.crosshairs.stroke.dashArray
      });
      if (dropShadow) {
        xcrosshairs = filters.dropShadow(xcrosshairs, {
          left: shadowLeft,
          top: shadowTop,
          blur: shadowBlur,
          color: shadowColor,
          opacity: shadowOpacity
        });
      }
      w.globals.dom.elGraphical.add(xcrosshairs);
    }
  }
  drawYCrosshairs() {
    const w = this.w;
    let graphics = new Graphics(this.ctx);
    let crosshair = w.config.yaxis[0].crosshairs;
    const offX = w.globals.barPadForNumericAxis;
    if (w.config.yaxis[0].crosshairs.show) {
      let ycrosshairs = graphics.drawLine(
        -offX,
        0,
        w.globals.gridWidth + offX,
        0,
        crosshair.stroke.color,
        crosshair.stroke.dashArray,
        crosshair.stroke.width
      );
      ycrosshairs.attr({
        class: "apexcharts-ycrosshairs"
      });
      w.globals.dom.elGraphical.add(ycrosshairs);
    }
    let ycrosshairsHidden = graphics.drawLine(
      -offX,
      0,
      w.globals.gridWidth + offX,
      0,
      crosshair.stroke.color,
      0,
      0
    );
    ycrosshairsHidden.attr({
      class: "apexcharts-ycrosshairs-hidden"
    });
    w.globals.dom.elGraphical.add(ycrosshairsHidden);
  }
}
class Responsive {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  // the opts parameter if not null has to be set overriding everything
  // as the opts is set by user externally
  checkResponsiveConfig(opts) {
    const w = this.w;
    const cnf = w.config;
    if (cnf.responsive.length === 0) return;
    let res = cnf.responsive.slice();
    res.sort(
      (a, b) => a.breakpoint > b.breakpoint ? 1 : b.breakpoint > a.breakpoint ? -1 : 0
    ).reverse();
    let config = new Config({});
    const iterateResponsiveOptions = (newOptions = {}) => {
      let largestBreakpoint = res[0].breakpoint;
      const width = window.innerWidth > 0 ? window.innerWidth : screen.width;
      if (width > largestBreakpoint) {
        let initialConfig = Utils$1.clone(w.globals.initialConfig);
        initialConfig.series = Utils$1.clone(w.config.series);
        let options2 = CoreUtils.extendArrayProps(
          config,
          initialConfig,
          w
        );
        newOptions = Utils$1.extend(options2, newOptions);
        newOptions = Utils$1.extend(w.config, newOptions);
        this.overrideResponsiveOptions(newOptions);
      } else {
        for (let i = 0; i < res.length; i++) {
          if (width < res[i].breakpoint) {
            newOptions = CoreUtils.extendArrayProps(config, res[i].options, w);
            newOptions = Utils$1.extend(w.config, newOptions);
            this.overrideResponsiveOptions(newOptions);
          }
        }
      }
    };
    if (opts) {
      let options2 = CoreUtils.extendArrayProps(config, opts, w);
      options2 = Utils$1.extend(w.config, options2);
      options2 = Utils$1.extend(options2, opts);
      iterateResponsiveOptions(options2);
    } else {
      iterateResponsiveOptions({});
    }
  }
  overrideResponsiveOptions(newOptions) {
    let newConfig = new Config(newOptions).init({ responsiveOverride: true });
    this.w.config = newConfig;
  }
}
class Theme {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.colors = [];
    this.isColorFn = false;
    this.isHeatmapDistributed = this.checkHeatmapDistributed();
    this.isBarDistributed = this.checkBarDistributed();
  }
  checkHeatmapDistributed() {
    const { chart, plotOptions } = this.w.config;
    return chart.type === "treemap" && plotOptions.treemap && plotOptions.treemap.distributed || chart.type === "heatmap" && plotOptions.heatmap && plotOptions.heatmap.distributed;
  }
  checkBarDistributed() {
    const { chart, plotOptions } = this.w.config;
    return plotOptions.bar && plotOptions.bar.distributed && (chart.type === "bar" || chart.type === "rangeBar");
  }
  init() {
    this.setDefaultColors();
  }
  setDefaultColors() {
    const w = this.w;
    const utils = new Utils$1();
    w.globals.dom.elWrap.classList.add(
      `apexcharts-theme-${w.config.theme.mode || "light"}`
    );
    const configColors = [...w.config.colors || w.config.fill.colors || []];
    w.globals.colors = this.getColors(configColors);
    this.applySeriesColors(w.globals.seriesColors, w.globals.colors);
    if (w.config.theme.monochrome.enabled) {
      w.globals.colors = this.getMonochromeColors(
        w.config.theme.monochrome,
        w.globals.series,
        utils
      );
    }
    const defaultColors = w.globals.colors.slice();
    this.pushExtraColors(w.globals.colors);
    this.applyColorTypes(["fill", "stroke"], defaultColors);
    this.applyDataLabelsColors(defaultColors);
    this.applyRadarPolygonsColors();
    this.applyMarkersColors(defaultColors);
  }
  getColors(configColors) {
    const w = this.w;
    if (!configColors || configColors.length === 0) {
      return this.predefined();
    }
    if (Array.isArray(configColors) && configColors.length > 0 && typeof configColors[0] === "function") {
      this.isColorFn = true;
      return w.config.series.map((s, i) => {
        let c = configColors[i] || configColors[0];
        return typeof c === "function" ? c({
          value: w.globals.axisCharts ? w.globals.series[i][0] || 0 : w.globals.series[i],
          seriesIndex: i,
          dataPointIndex: i,
          w: this.w
        }) : c;
      });
    }
    return configColors;
  }
  applySeriesColors(seriesColors, globalsColors) {
    seriesColors.forEach((c, i) => {
      if (c) {
        globalsColors[i] = c;
      }
    });
  }
  getMonochromeColors(monochrome, series, utils) {
    const { color, shadeIntensity, shadeTo } = monochrome;
    const glsCnt = this.isBarDistributed || this.isHeatmapDistributed ? series[0].length * series.length : series.length;
    const part = 1 / (glsCnt / shadeIntensity);
    let percent = 0;
    return Array.from({ length: glsCnt }, () => {
      const newColor = shadeTo === "dark" ? utils.shadeColor(percent * -1, color) : utils.shadeColor(percent, color);
      percent += part;
      return newColor;
    });
  }
  applyColorTypes(colorTypes, defaultColors) {
    const w = this.w;
    colorTypes.forEach((c) => {
      w.globals[c].colors = w.config[c].colors === void 0 ? this.isColorFn ? w.config.colors : defaultColors : w.config[c].colors.slice();
      this.pushExtraColors(w.globals[c].colors);
    });
  }
  applyDataLabelsColors(defaultColors) {
    const w = this.w;
    w.globals.dataLabels.style.colors = w.config.dataLabels.style.colors === void 0 ? defaultColors : w.config.dataLabels.style.colors.slice();
    this.pushExtraColors(w.globals.dataLabels.style.colors, 50);
  }
  applyRadarPolygonsColors() {
    const w = this.w;
    w.globals.radarPolygons.fill.colors = w.config.plotOptions.radar.polygons.fill.colors === void 0 ? [w.config.theme.mode === "dark" ? "#343A3F" : "none"] : w.config.plotOptions.radar.polygons.fill.colors.slice();
    this.pushExtraColors(w.globals.radarPolygons.fill.colors, 20);
  }
  applyMarkersColors(defaultColors) {
    const w = this.w;
    w.globals.markers.colors = w.config.markers.colors === void 0 ? defaultColors : w.config.markers.colors.slice();
    this.pushExtraColors(w.globals.markers.colors);
  }
  pushExtraColors(colorSeries, length, distributed = null) {
    const w = this.w;
    let len = length || w.globals.series.length;
    if (distributed === null) {
      distributed = this.isBarDistributed || this.isHeatmapDistributed || w.config.chart.type === "heatmap" && w.config.plotOptions.heatmap && w.config.plotOptions.heatmap.colorScale.inverse;
    }
    if (distributed && w.globals.series.length) {
      len = w.globals.series[w.globals.maxValsInArrayIndex].length * w.globals.series.length;
    }
    if (colorSeries.length < len) {
      let diff = len - colorSeries.length;
      for (let i = 0; i < diff; i++) {
        colorSeries.push(colorSeries[i]);
      }
    }
  }
  updateThemeOptions(options2) {
    options2.chart = options2.chart || {};
    options2.tooltip = options2.tooltip || {};
    const mode = options2.theme.mode;
    const palette = mode === "dark" ? "palette4" : mode === "light" ? "palette1" : options2.theme.palette || "palette1";
    const foreColor = mode === "dark" ? "#f6f7f8" : mode === "light" ? "#373d3f" : options2.chart.foreColor || "#373d3f";
    options2.tooltip.theme = mode || "light";
    options2.chart.foreColor = foreColor;
    options2.theme.palette = palette;
    return options2;
  }
  predefined() {
    const palette = this.w.config.theme.palette;
    const palettes = this.ctx.constructor.getThemePalettes();
    return palettes[palette] || palettes.palette1;
  }
}
class TitleSubtitle {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  draw() {
    this.drawTitleSubtitle("title");
    this.drawTitleSubtitle("subtitle");
  }
  drawTitleSubtitle(type) {
    let w = this.w;
    const tsConfig = type === "title" ? w.config.title : w.config.subtitle;
    let x = w.globals.svgWidth / 2;
    let y = tsConfig.offsetY;
    let textAnchor = "middle";
    if (tsConfig.align === "left") {
      x = 10;
      textAnchor = "start";
    } else if (tsConfig.align === "right") {
      x = w.globals.svgWidth - 10;
      textAnchor = "end";
    }
    x = x + tsConfig.offsetX;
    y = y + parseInt(tsConfig.style.fontSize, 10) + tsConfig.margin / 2;
    if (tsConfig.text !== void 0) {
      let graphics = new Graphics(this.ctx);
      let titleText = graphics.drawText({
        x,
        y,
        text: tsConfig.text,
        textAnchor,
        fontSize: tsConfig.style.fontSize,
        fontFamily: tsConfig.style.fontFamily,
        fontWeight: tsConfig.style.fontWeight,
        foreColor: tsConfig.style.color,
        opacity: 1
      });
      titleText.node.setAttribute("class", `apexcharts-${type}-text`);
      w.globals.dom.Paper.add(titleText);
    }
  }
}
let Helpers$3 = class Helpers2 {
  constructor(dCtx) {
    this.w = dCtx.w;
    this.dCtx = dCtx;
  }
  /**
   * Get Chart Title/Subtitle Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getTitleSubtitleCoords(type) {
    let w = this.w;
    let width = 0;
    let height = 0;
    const floating = type === "title" ? w.config.title.floating : w.config.subtitle.floating;
    let el = w.globals.dom.baseEl.querySelector(`.apexcharts-${type}-text`);
    if (el !== null && !floating) {
      let coord = el.getBoundingClientRect();
      width = coord.width;
      height = w.globals.axisCharts ? coord.height + 5 : coord.height;
    }
    return {
      width,
      height
    };
  }
  getLegendsRect() {
    let w = this.w;
    let elLegendWrap = w.globals.dom.elLegendWrap;
    if (!w.config.legend.height && (w.config.legend.position === "top" || w.config.legend.position === "bottom")) {
      elLegendWrap.style.maxHeight = w.globals.svgHeight / 2 + "px";
    }
    let lgRect = Object.assign({}, Utils$1.getBoundingClientRect(elLegendWrap));
    if (elLegendWrap !== null && !w.config.legend.floating && w.config.legend.show) {
      this.dCtx.lgRect = {
        x: lgRect.x,
        y: lgRect.y,
        height: lgRect.height,
        width: lgRect.height === 0 ? 0 : lgRect.width
      };
    } else {
      this.dCtx.lgRect = {
        x: 0,
        y: 0,
        height: 0,
        width: 0
      };
    }
    if (w.config.legend.position === "left" || w.config.legend.position === "right") {
      if (this.dCtx.lgRect.width * 1.5 > w.globals.svgWidth) {
        this.dCtx.lgRect.width = w.globals.svgWidth / 1.5;
      }
    }
    return this.dCtx.lgRect;
  }
  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getDatalabelsRect() {
    let w = this.w;
    let allLabels = [];
    w.config.series.forEach((serie, seriesIndex) => {
      serie.data.forEach((datum, dataPointIndex) => {
        const getText = (v) => {
          return w.config.dataLabels.formatter(v, {
            ctx: this.dCtx.ctx,
            seriesIndex,
            dataPointIndex,
            w
          });
        };
        const labelText = getText(w.globals.series[seriesIndex][dataPointIndex]);
        allLabels.push(labelText);
      });
    });
    let val = Utils$1.getLargestStringFromArr(allLabels);
    let graphics = new Graphics(this.dCtx.ctx);
    const dataLabelsStyle = w.config.dataLabels.style;
    let labelrect = graphics.getTextRects(
      val,
      parseInt(dataLabelsStyle.fontSize),
      dataLabelsStyle.fontFamily
    );
    return {
      width: labelrect.width * 1.05,
      height: labelrect.height
    };
  }
  getLargestStringFromMultiArr(val, arr) {
    const w = this.w;
    let valArr = val;
    if (w.globals.isMultiLineX) {
      let maxArrs = arr.map((xl, idx) => {
        return Array.isArray(xl) ? xl.length : 1;
      });
      let maxArrLen = Math.max(...maxArrs);
      let maxArrIndex = maxArrs.indexOf(maxArrLen);
      valArr = arr[maxArrIndex];
    }
    return valArr;
  }
};
class DimXAxis {
  constructor(dCtx) {
    this.w = dCtx.w;
    this.dCtx = dCtx;
  }
  /**
   * Get X Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getxAxisLabelsCoords() {
    let w = this.w;
    let xaxisLabels = w.globals.labels.slice();
    if (w.config.xaxis.convertedCatToNumeric && xaxisLabels.length === 0) {
      xaxisLabels = w.globals.categoryLabels;
    }
    let rect;
    if (w.globals.timescaleLabels.length > 0) {
      const coords = this.getxAxisTimeScaleLabelsCoords();
      rect = {
        width: coords.width,
        height: coords.height
      };
      w.globals.rotateXLabels = false;
    } else {
      this.dCtx.lgWidthForSideLegends = (w.config.legend.position === "left" || w.config.legend.position === "right") && !w.config.legend.floating ? this.dCtx.lgRect.width : 0;
      let xlbFormatter = w.globals.xLabelFormatter;
      let val = Utils$1.getLargestStringFromArr(xaxisLabels);
      let valArr = this.dCtx.dimHelpers.getLargestStringFromMultiArr(
        val,
        xaxisLabels
      );
      if (w.globals.isBarHorizontal) {
        val = w.globals.yAxisScale[0].result.reduce(
          (a, b) => a.length > b.length ? a : b,
          0
        );
        valArr = val;
      }
      let xFormat = new Formatters(this.dCtx.ctx);
      let timestamp = val;
      val = xFormat.xLabelFormat(xlbFormatter, val, timestamp, {
        i: void 0,
        dateFormatter: new DateTime(this.dCtx.ctx).formatDate,
        w
      });
      valArr = xFormat.xLabelFormat(xlbFormatter, valArr, timestamp, {
        i: void 0,
        dateFormatter: new DateTime(this.dCtx.ctx).formatDate,
        w
      });
      if (w.config.xaxis.convertedCatToNumeric && typeof val === "undefined" || String(val).trim() === "") {
        val = "1";
        valArr = val;
      }
      let graphics = new Graphics(this.dCtx.ctx);
      let xLabelrect = graphics.getTextRects(
        val,
        w.config.xaxis.labels.style.fontSize
      );
      let xArrLabelrect = xLabelrect;
      if (val !== valArr) {
        xArrLabelrect = graphics.getTextRects(
          valArr,
          w.config.xaxis.labels.style.fontSize
        );
      }
      rect = {
        width: xLabelrect.width >= xArrLabelrect.width ? xLabelrect.width : xArrLabelrect.width,
        height: xLabelrect.height >= xArrLabelrect.height ? xLabelrect.height : xArrLabelrect.height
      };
      if (rect.width * xaxisLabels.length > w.globals.svgWidth - this.dCtx.lgWidthForSideLegends - this.dCtx.yAxisWidth - this.dCtx.gridPad.left - this.dCtx.gridPad.right && w.config.xaxis.labels.rotate !== 0 || w.config.xaxis.labels.rotateAlways) {
        if (!w.globals.isBarHorizontal) {
          w.globals.rotateXLabels = true;
          const getRotatedTextRects = (text) => {
            return graphics.getTextRects(
              text,
              w.config.xaxis.labels.style.fontSize,
              w.config.xaxis.labels.style.fontFamily,
              `rotate(${w.config.xaxis.labels.rotate} 0 0)`,
              false
            );
          };
          xLabelrect = getRotatedTextRects(val);
          if (val !== valArr) {
            xArrLabelrect = getRotatedTextRects(valArr);
          }
          rect.height = (xLabelrect.height > xArrLabelrect.height ? xLabelrect.height : xArrLabelrect.height) / 1.5;
          rect.width = xLabelrect.width > xArrLabelrect.width ? xLabelrect.width : xArrLabelrect.width;
        }
      } else {
        w.globals.rotateXLabels = false;
      }
    }
    if (!w.config.xaxis.labels.show) {
      rect = {
        width: 0,
        height: 0
      };
    }
    return {
      width: rect.width,
      height: rect.height
    };
  }
  /**
   * Get X Axis Label Group height
   * @memberof Dimensions
   * @return {{width, height}}
   */
  getxAxisGroupLabelsCoords() {
    var _a;
    let w = this.w;
    if (!w.globals.hasXaxisGroups) {
      return { width: 0, height: 0 };
    }
    const fontSize = ((_a = w.config.xaxis.group.style) == null ? void 0 : _a.fontSize) || w.config.xaxis.labels.style.fontSize;
    let xaxisLabels = w.globals.groups.map((g) => g.title);
    let rect;
    let val = Utils$1.getLargestStringFromArr(xaxisLabels);
    let valArr = this.dCtx.dimHelpers.getLargestStringFromMultiArr(
      val,
      xaxisLabels
    );
    let graphics = new Graphics(this.dCtx.ctx);
    let xLabelrect = graphics.getTextRects(val, fontSize);
    let xArrLabelrect = xLabelrect;
    if (val !== valArr) {
      xArrLabelrect = graphics.getTextRects(valArr, fontSize);
    }
    rect = {
      width: xLabelrect.width >= xArrLabelrect.width ? xLabelrect.width : xArrLabelrect.width,
      height: xLabelrect.height >= xArrLabelrect.height ? xLabelrect.height : xArrLabelrect.height
    };
    if (!w.config.xaxis.labels.show) {
      rect = {
        width: 0,
        height: 0
      };
    }
    return {
      width: rect.width,
      height: rect.height
    };
  }
  /**
   * Get X Axis Title Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getxAxisTitleCoords() {
    let w = this.w;
    let width = 0;
    let height = 0;
    if (w.config.xaxis.title.text !== void 0) {
      let graphics = new Graphics(this.dCtx.ctx);
      let rect = graphics.getTextRects(
        w.config.xaxis.title.text,
        w.config.xaxis.title.style.fontSize
      );
      width = rect.width;
      height = rect.height;
    }
    return {
      width,
      height
    };
  }
  getxAxisTimeScaleLabelsCoords() {
    let w = this.w;
    let rect;
    this.dCtx.timescaleLabels = w.globals.timescaleLabels.slice();
    let labels = this.dCtx.timescaleLabels.map((label) => label.value);
    let val = labels.reduce((a, b) => {
      if (typeof a === "undefined") {
        console.error(
          "You have possibly supplied invalid Date format. Please supply a valid JavaScript Date"
        );
        return 0;
      } else {
        return a.length > b.length ? a : b;
      }
    }, 0);
    let graphics = new Graphics(this.dCtx.ctx);
    rect = graphics.getTextRects(val, w.config.xaxis.labels.style.fontSize);
    let totalWidthRotated = rect.width * 1.05 * labels.length;
    if (totalWidthRotated > w.globals.gridWidth && w.config.xaxis.labels.rotate !== 0) {
      w.globals.overlappingXLabels = true;
    }
    return rect;
  }
  // In certain cases, the last labels gets cropped in xaxis.
  // Hence, we add some additional padding based on the label length to avoid the last label being cropped or we don't draw it at all
  additionalPaddingXLabels(xaxisLabelCoords) {
    const w = this.w;
    const gl = w.globals;
    const cnf = w.config;
    const xtype = cnf.xaxis.type;
    let lbWidth = xaxisLabelCoords.width;
    gl.skipLastTimelinelabel = false;
    gl.skipFirstTimelinelabel = false;
    const isBarOpposite = w.config.yaxis[0].opposite && w.globals.isBarHorizontal;
    const isCollapsed = (i) => gl.collapsedSeriesIndices.indexOf(i) !== -1;
    const rightPad = (yaxe) => {
      if (this.dCtx.timescaleLabels && this.dCtx.timescaleLabels.length) {
        const firstimescaleLabel = this.dCtx.timescaleLabels[0];
        const lastTimescaleLabel = this.dCtx.timescaleLabels[this.dCtx.timescaleLabels.length - 1];
        const lastLabelPosition = lastTimescaleLabel.position + lbWidth / 1.75 - this.dCtx.yAxisWidthRight;
        const firstLabelPosition = firstimescaleLabel.position - lbWidth / 1.75 + this.dCtx.yAxisWidthLeft;
        let lgRightRectWidth = w.config.legend.position === "right" && this.dCtx.lgRect.width > 0 ? this.dCtx.lgRect.width : 0;
        if (lastLabelPosition > gl.svgWidth - gl.translateX - lgRightRectWidth) {
          gl.skipLastTimelinelabel = true;
        }
        if (firstLabelPosition < -((!yaxe.show || yaxe.floating) && (cnf.chart.type === "bar" || cnf.chart.type === "candlestick" || cnf.chart.type === "rangeBar" || cnf.chart.type === "boxPlot") ? lbWidth / 1.75 : 10)) {
          gl.skipFirstTimelinelabel = true;
        }
      } else if (xtype === "datetime") {
        if (this.dCtx.gridPad.right < lbWidth && !gl.rotateXLabels) {
          gl.skipLastTimelinelabel = true;
        }
      } else if (xtype !== "datetime") {
        if (this.dCtx.gridPad.right < lbWidth / 2 - this.dCtx.yAxisWidthRight && !gl.rotateXLabels && !w.config.xaxis.labels.trim) {
          this.dCtx.xPadRight = lbWidth / 2 + 1;
        }
      }
    };
    const padYAxe = (yaxe, i) => {
      if (cnf.yaxis.length > 1 && isCollapsed(i)) return;
      rightPad(yaxe);
    };
    cnf.yaxis.forEach((yaxe, i) => {
      if (isBarOpposite) {
        if (this.dCtx.gridPad.left < lbWidth) {
          this.dCtx.xPadLeft = lbWidth / 2 + 1;
        }
        this.dCtx.xPadRight = lbWidth / 2 + 1;
      } else {
        padYAxe(yaxe, i);
      }
    });
  }
}
class DimYAxis {
  constructor(dCtx) {
    this.w = dCtx.w;
    this.dCtx = dCtx;
  }
  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getyAxisLabelsCoords() {
    let w = this.w;
    let width = 0;
    let height = 0;
    let ret = [];
    let labelPad = 10;
    const axesUtils = new AxesUtils(this.dCtx.ctx);
    w.config.yaxis.map((yaxe, index) => {
      const formatterArgs = {
        seriesIndex: index,
        dataPointIndex: -1,
        w
      };
      const yS = w.globals.yAxisScale[index];
      let yAxisMinWidth = 0;
      if (!axesUtils.isYAxisHidden(index) && yaxe.labels.show && yaxe.labels.minWidth !== void 0)
        yAxisMinWidth = yaxe.labels.minWidth;
      if (!axesUtils.isYAxisHidden(index) && yaxe.labels.show && yS.result.length) {
        let lbFormatter = w.globals.yLabelFormatters[index];
        let minV = yS.niceMin === Number.MIN_VALUE ? 0 : yS.niceMin;
        let val = yS.result.reduce((acc, curr) => {
          var _a, _b;
          return ((_a = String(lbFormatter(acc, formatterArgs))) == null ? void 0 : _a.length) > ((_b = String(lbFormatter(curr, formatterArgs))) == null ? void 0 : _b.length) ? acc : curr;
        }, minV);
        val = lbFormatter(val, formatterArgs);
        let valArr = val;
        if (typeof val === "undefined" || val.length === 0) {
          val = yS.niceMax;
        }
        if (String(val).length === 1) {
          val = val + ".0";
          valArr = val;
        }
        if (w.globals.isBarHorizontal) {
          labelPad = 0;
          let barYaxisLabels = w.globals.labels.slice();
          val = Utils$1.getLargestStringFromArr(barYaxisLabels);
          val = lbFormatter(val, { seriesIndex: index, dataPointIndex: -1, w });
          valArr = this.dCtx.dimHelpers.getLargestStringFromMultiArr(
            val,
            barYaxisLabels
          );
        }
        let graphics = new Graphics(this.dCtx.ctx);
        let rotateStr = "rotate(".concat(yaxe.labels.rotate, " 0 0)");
        let rect = graphics.getTextRects(
          val,
          yaxe.labels.style.fontSize,
          yaxe.labels.style.fontFamily,
          rotateStr,
          false
        );
        let arrLabelrect = rect;
        if (val !== valArr) {
          arrLabelrect = graphics.getTextRects(
            valArr,
            yaxe.labels.style.fontSize,
            yaxe.labels.style.fontFamily,
            rotateStr,
            false
          );
        }
        ret.push({
          width: (yAxisMinWidth > arrLabelrect.width || yAxisMinWidth > rect.width ? yAxisMinWidth : arrLabelrect.width > rect.width ? arrLabelrect.width : rect.width) + labelPad,
          height: arrLabelrect.height > rect.height ? arrLabelrect.height : rect.height
        });
      } else {
        ret.push({
          width,
          height
        });
      }
    });
    return ret;
  }
  /**
   * Get Y Axis Dimensions
   * @memberof Dimensions
   * @return {{width, height}}
   **/
  getyAxisTitleCoords() {
    let w = this.w;
    let ret = [];
    w.config.yaxis.map((yaxe, index) => {
      if (yaxe.show && yaxe.title.text !== void 0) {
        let graphics = new Graphics(this.dCtx.ctx);
        let rotateStr = "rotate(".concat(yaxe.title.rotate, " 0 0)");
        let rect = graphics.getTextRects(
          yaxe.title.text,
          yaxe.title.style.fontSize,
          yaxe.title.style.fontFamily,
          rotateStr,
          false
        );
        ret.push({
          width: rect.width,
          height: rect.height
        });
      } else {
        ret.push({
          width: 0,
          height: 0
        });
      }
    });
    return ret;
  }
  getTotalYAxisWidth() {
    let w = this.w;
    let yAxisWidth = 0;
    let yAxisWidthLeft = 0;
    let yAxisWidthRight = 0;
    let padding = w.globals.yAxisScale.length > 1 ? 10 : 0;
    const axesUtils = new AxesUtils(this.dCtx.ctx);
    const isHiddenYAxis = function(index) {
      return w.globals.ignoreYAxisIndexes.indexOf(index) > -1;
    };
    const padForLabelTitle = (coord, index) => {
      let floating = w.config.yaxis[index].floating;
      let width = 0;
      if (coord.width > 0 && !floating) {
        width = coord.width + padding;
        if (isHiddenYAxis(index)) {
          width = width - coord.width - padding;
        }
      } else {
        width = floating || axesUtils.isYAxisHidden(index) ? 0 : 5;
      }
      w.config.yaxis[index].opposite ? yAxisWidthRight = yAxisWidthRight + width : yAxisWidthLeft = yAxisWidthLeft + width;
      yAxisWidth = yAxisWidth + width;
    };
    w.globals.yLabelsCoords.map((yLabelCoord, index) => {
      padForLabelTitle(yLabelCoord, index);
    });
    w.globals.yTitleCoords.map((yTitleCoord, index) => {
      padForLabelTitle(yTitleCoord, index);
    });
    if (w.globals.isBarHorizontal && !w.config.yaxis[0].floating) {
      yAxisWidth = w.globals.yLabelsCoords[0].width + w.globals.yTitleCoords[0].width + 15;
    }
    this.dCtx.yAxisWidthLeft = yAxisWidthLeft;
    this.dCtx.yAxisWidthRight = yAxisWidthRight;
    return yAxisWidth;
  }
}
class DimGrid {
  constructor(dCtx) {
    this.w = dCtx.w;
    this.dCtx = dCtx;
  }
  gridPadForColumnsInNumericAxis(gridWidth) {
    const { w } = this;
    const { config: cnf, globals: gl } = w;
    if (gl.noData || gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length === cnf.series.length) {
      return 0;
    }
    const hasBar = (type2) => ["bar", "rangeBar", "candlestick", "boxPlot"].includes(type2);
    const type = cnf.chart.type;
    let barWidth = 0;
    let seriesLen = hasBar(type) ? cnf.series.length : 1;
    if (gl.comboBarCount > 0) {
      seriesLen = gl.comboBarCount;
    }
    gl.collapsedSeries.forEach((c) => {
      if (hasBar(c.type)) {
        seriesLen -= 1;
      }
    });
    if (cnf.chart.stacked) {
      seriesLen = 1;
    }
    const barsPresent = hasBar(type) || gl.comboBarCount > 0;
    let xRange = Math.abs(gl.initialMaxX - gl.initialMinX);
    if (barsPresent && gl.isXNumeric && !gl.isBarHorizontal && seriesLen > 0 && xRange !== 0) {
      if (xRange <= 3) {
        xRange = gl.dataPoints;
      }
      const xRatio = xRange / gridWidth;
      let xDivision = gl.minXDiff && gl.minXDiff / xRatio > 0 ? gl.minXDiff / xRatio : 0;
      if (xDivision > gridWidth / 2) {
        xDivision /= 2;
      }
      barWidth = xDivision * parseInt(cnf.plotOptions.bar.columnWidth, 10) / 100;
      if (barWidth < 1) {
        barWidth = 1;
      }
      gl.barPadForNumericAxis = barWidth;
    }
    return barWidth;
  }
  gridPadFortitleSubtitle() {
    const { w } = this;
    const { globals: gl } = w;
    let gridShrinkOffset = this.dCtx.isSparkline || !gl.axisCharts ? 0 : 10;
    const titleSubtitle = ["title", "subtitle"];
    titleSubtitle.forEach((t) => {
      if (w.config[t].text !== void 0) {
        gridShrinkOffset += w.config[t].margin;
      } else {
        gridShrinkOffset += this.dCtx.isSparkline || !gl.axisCharts ? 0 : 5;
      }
    });
    if (w.config.legend.show && w.config.legend.position === "bottom" && !w.config.legend.floating && !gl.axisCharts) {
      gridShrinkOffset += 10;
    }
    const titleCoords = this.dCtx.dimHelpers.getTitleSubtitleCoords("title");
    const subtitleCoords = this.dCtx.dimHelpers.getTitleSubtitleCoords("subtitle");
    gl.gridHeight -= titleCoords.height + subtitleCoords.height + gridShrinkOffset;
    gl.translateY += titleCoords.height + subtitleCoords.height + gridShrinkOffset;
  }
  setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords) {
    const { w } = this;
    const axesUtils = new AxesUtils(this.dCtx.ctx);
    w.config.yaxis.forEach((yaxe, index) => {
      if (w.globals.ignoreYAxisIndexes.indexOf(index) === -1 && !yaxe.floating && !axesUtils.isYAxisHidden(index)) {
        if (yaxe.opposite) {
          w.globals.translateX -= yaxisLabelCoords[index].width + yTitleCoords[index].width + parseInt(yaxe.labels.style.fontSize, 10) / 1.2 + 12;
        }
        if (w.globals.translateX < 2) {
          w.globals.translateX = 2;
        }
      }
    });
  }
}
class Dimensions {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.lgRect = {};
    this.yAxisWidth = 0;
    this.yAxisWidthLeft = 0;
    this.yAxisWidthRight = 0;
    this.xAxisHeight = 0;
    this.isSparkline = this.w.config.chart.sparkline.enabled;
    this.dimHelpers = new Helpers$3(this);
    this.dimYAxis = new DimYAxis(this);
    this.dimXAxis = new DimXAxis(this);
    this.dimGrid = new DimGrid(this);
    this.lgWidthForSideLegends = 0;
    this.gridPad = this.w.config.grid.padding;
    this.xPadRight = 0;
    this.xPadLeft = 0;
  }
  /**
   * @memberof Dimensions
   * @param {object} w - chart context
   **/
  plotCoords() {
    let w = this.w;
    let gl = w.globals;
    this.lgRect = this.dimHelpers.getLegendsRect();
    this.datalabelsCoords = { width: 0, height: 0 };
    const maxStrokeWidth = Array.isArray(w.config.stroke.width) ? Math.max(...w.config.stroke.width) : w.config.stroke.width;
    if (this.isSparkline) {
      if (w.config.markers.discrete.length > 0 || w.config.markers.size > 0) {
        Object.entries(this.gridPad).forEach(([k, v]) => {
          this.gridPad[k] = Math.max(
            v,
            this.w.globals.markers.largestSize / 1.5
          );
        });
      }
      this.gridPad.top = Math.max(maxStrokeWidth / 2, this.gridPad.top);
      this.gridPad.bottom = Math.max(maxStrokeWidth / 2, this.gridPad.bottom);
    }
    if (gl.axisCharts) {
      this.setDimensionsForAxisCharts();
    } else {
      this.setDimensionsForNonAxisCharts();
    }
    this.dimGrid.gridPadFortitleSubtitle();
    gl.gridHeight = gl.gridHeight - this.gridPad.top - this.gridPad.bottom;
    gl.gridWidth = gl.gridWidth - this.gridPad.left - this.gridPad.right - this.xPadRight - this.xPadLeft;
    let barWidth = this.dimGrid.gridPadForColumnsInNumericAxis(gl.gridWidth);
    gl.gridWidth = gl.gridWidth - barWidth * 2;
    gl.translateX = gl.translateX + this.gridPad.left + this.xPadLeft + (barWidth > 0 ? barWidth : 0);
    gl.translateY = gl.translateY + this.gridPad.top;
  }
  setDimensionsForAxisCharts() {
    let w = this.w;
    let gl = w.globals;
    let yaxisLabelCoords = this.dimYAxis.getyAxisLabelsCoords();
    let yTitleCoords = this.dimYAxis.getyAxisTitleCoords();
    if (gl.isSlopeChart) {
      this.datalabelsCoords = this.dimHelpers.getDatalabelsRect();
    }
    w.globals.yLabelsCoords = [];
    w.globals.yTitleCoords = [];
    w.config.yaxis.map((yaxe, index) => {
      w.globals.yLabelsCoords.push({
        width: yaxisLabelCoords[index].width,
        index
      });
      w.globals.yTitleCoords.push({
        width: yTitleCoords[index].width,
        index
      });
    });
    this.yAxisWidth = this.dimYAxis.getTotalYAxisWidth();
    let xaxisLabelCoords = this.dimXAxis.getxAxisLabelsCoords();
    let xaxisGroupLabelCoords = this.dimXAxis.getxAxisGroupLabelsCoords();
    let xtitleCoords = this.dimXAxis.getxAxisTitleCoords();
    this.conditionalChecksForAxisCoords(
      xaxisLabelCoords,
      xtitleCoords,
      xaxisGroupLabelCoords
    );
    gl.translateXAxisY = w.globals.rotateXLabels ? this.xAxisHeight / 8 : -4;
    gl.translateXAxisX = w.globals.rotateXLabels && w.globals.isXNumeric && w.config.xaxis.labels.rotate <= -45 ? -this.xAxisWidth / 4 : 0;
    if (w.globals.isBarHorizontal) {
      gl.rotateXLabels = false;
      gl.translateXAxisY = -1 * (parseInt(w.config.xaxis.labels.style.fontSize, 10) / 1.5);
    }
    gl.translateXAxisY = gl.translateXAxisY + w.config.xaxis.labels.offsetY;
    gl.translateXAxisX = gl.translateXAxisX + w.config.xaxis.labels.offsetX;
    let yAxisWidth = this.yAxisWidth;
    let xAxisHeight = this.xAxisHeight;
    gl.xAxisLabelsHeight = this.xAxisHeight - xtitleCoords.height;
    gl.xAxisGroupLabelsHeight = gl.xAxisLabelsHeight - xaxisLabelCoords.height;
    gl.xAxisLabelsWidth = this.xAxisWidth;
    gl.xAxisHeight = this.xAxisHeight;
    let translateY = 10;
    if (w.config.chart.type === "radar" || this.isSparkline) {
      yAxisWidth = 0;
      xAxisHeight = 0;
    }
    if (this.isSparkline) {
      this.lgRect = {
        height: 0,
        width: 0
      };
    }
    if (this.isSparkline || w.config.chart.type === "treemap") {
      yAxisWidth = 0;
      xAxisHeight = 0;
      translateY = 0;
    }
    if (!this.isSparkline && w.config.chart.type !== "treemap") {
      this.dimXAxis.additionalPaddingXLabels(xaxisLabelCoords);
    }
    const legendTopBottom = () => {
      gl.translateX = yAxisWidth + this.datalabelsCoords.width;
      gl.gridHeight = gl.svgHeight - this.lgRect.height - xAxisHeight - (!this.isSparkline && w.config.chart.type !== "treemap" ? w.globals.rotateXLabels ? 10 : 15 : 0);
      gl.gridWidth = gl.svgWidth - yAxisWidth - this.datalabelsCoords.width * 2;
    };
    if (w.config.xaxis.position === "top")
      translateY = gl.xAxisHeight - w.config.xaxis.axisTicks.height - 5;
    switch (w.config.legend.position) {
      case "bottom":
        gl.translateY = translateY;
        legendTopBottom();
        break;
      case "top":
        gl.translateY = this.lgRect.height + translateY;
        legendTopBottom();
        break;
      case "left":
        gl.translateY = translateY;
        gl.translateX = this.lgRect.width + yAxisWidth + this.datalabelsCoords.width;
        gl.gridHeight = gl.svgHeight - xAxisHeight - 12;
        gl.gridWidth = gl.svgWidth - this.lgRect.width - yAxisWidth - this.datalabelsCoords.width * 2;
        break;
      case "right":
        gl.translateY = translateY;
        gl.translateX = yAxisWidth + this.datalabelsCoords.width;
        gl.gridHeight = gl.svgHeight - xAxisHeight - 12;
        gl.gridWidth = gl.svgWidth - this.lgRect.width - yAxisWidth - this.datalabelsCoords.width * 2 - 5;
        break;
      default:
        throw new Error("Legend position not supported");
    }
    this.dimGrid.setGridXPosForDualYAxis(yTitleCoords, yaxisLabelCoords);
    let objyAxis = new YAxis(this.ctx);
    objyAxis.setYAxisXPosition(yaxisLabelCoords, yTitleCoords);
  }
  setDimensionsForNonAxisCharts() {
    let w = this.w;
    let gl = w.globals;
    let cnf = w.config;
    let xPad = 0;
    if (w.config.legend.show && !w.config.legend.floating) {
      xPad = 20;
    }
    const type = cnf.chart.type === "pie" || cnf.chart.type === "polarArea" || cnf.chart.type === "donut" ? "pie" : "radialBar";
    let offY = cnf.plotOptions[type].offsetY;
    let offX = cnf.plotOptions[type].offsetX;
    if (!cnf.legend.show || cnf.legend.floating) {
      gl.gridHeight = gl.svgHeight;
      const maxWidth = gl.dom.elWrap.getBoundingClientRect().width;
      gl.gridWidth = Math.min(maxWidth, gl.gridHeight);
      gl.translateY = offY;
      gl.translateX = offX + (gl.svgWidth - gl.gridWidth) / 2;
      return;
    }
    switch (cnf.legend.position) {
      case "bottom":
        gl.gridHeight = gl.svgHeight - this.lgRect.height;
        gl.gridWidth = gl.svgWidth;
        gl.translateY = offY - 10;
        gl.translateX = offX + (gl.svgWidth - gl.gridWidth) / 2;
        break;
      case "top":
        gl.gridHeight = gl.svgHeight - this.lgRect.height;
        gl.gridWidth = gl.svgWidth;
        gl.translateY = this.lgRect.height + offY + 10;
        gl.translateX = offX + (gl.svgWidth - gl.gridWidth) / 2;
        break;
      case "left":
        gl.gridWidth = gl.svgWidth - this.lgRect.width - xPad;
        gl.gridHeight = cnf.chart.height !== "auto" ? gl.svgHeight : gl.gridWidth;
        gl.translateY = offY;
        gl.translateX = offX + this.lgRect.width + xPad;
        break;
      case "right":
        gl.gridWidth = gl.svgWidth - this.lgRect.width - xPad - 5;
        gl.gridHeight = cnf.chart.height !== "auto" ? gl.svgHeight : gl.gridWidth;
        gl.translateY = offY;
        gl.translateX = offX + 10;
        break;
      default:
        throw new Error("Legend position not supported");
    }
  }
  conditionalChecksForAxisCoords(xaxisLabelCoords, xtitleCoords, xaxisGroupLabelCoords) {
    const w = this.w;
    const xAxisNum = w.globals.hasXaxisGroups ? 2 : 1;
    const baseXAxisHeight = xaxisGroupLabelCoords.height + xaxisLabelCoords.height + xtitleCoords.height;
    const xAxisHeightMultiplicate = w.globals.isMultiLineX ? 1.2 : w.globals.LINE_HEIGHT_RATIO;
    const rotatedXAxisOffset = w.globals.rotateXLabels ? 22 : 10;
    const rotatedXAxisLegendOffset = w.globals.rotateXLabels && w.config.legend.position === "bottom";
    const additionalOffset = rotatedXAxisLegendOffset ? 10 : 0;
    this.xAxisHeight = baseXAxisHeight * xAxisHeightMultiplicate + xAxisNum * rotatedXAxisOffset + additionalOffset;
    this.xAxisWidth = xaxisLabelCoords.width;
    if (this.xAxisHeight - xtitleCoords.height > w.config.xaxis.labels.maxHeight) {
      this.xAxisHeight = w.config.xaxis.labels.maxHeight;
    }
    if (w.config.xaxis.labels.minHeight && this.xAxisHeight < w.config.xaxis.labels.minHeight) {
      this.xAxisHeight = w.config.xaxis.labels.minHeight;
    }
    if (w.config.xaxis.floating) {
      this.xAxisHeight = 0;
    }
    let minYAxisWidth = 0;
    let maxYAxisWidth = 0;
    w.config.yaxis.forEach((y) => {
      minYAxisWidth += y.labels.minWidth;
      maxYAxisWidth += y.labels.maxWidth;
    });
    if (this.yAxisWidth < minYAxisWidth) {
      this.yAxisWidth = minYAxisWidth;
    }
    if (this.yAxisWidth > maxYAxisWidth) {
      this.yAxisWidth = maxYAxisWidth;
    }
  }
}
let Helpers$2 = class Helpers3 {
  constructor(lgCtx) {
    this.w = lgCtx.w;
    this.lgCtx = lgCtx;
  }
  getLegendStyles() {
    var _a, _b, _c;
    let stylesheet = document.createElement("style");
    stylesheet.setAttribute("type", "text/css");
    const nonce = ((_c = (_b = (_a = this.lgCtx.ctx) == null ? void 0 : _a.opts) == null ? void 0 : _b.chart) == null ? void 0 : _c.nonce) || this.w.config.chart.nonce;
    if (nonce) {
      stylesheet.setAttribute("nonce", nonce);
    }
    const rule = document.createTextNode(apexchartsLegendCSS);
    stylesheet.appendChild(rule);
    return stylesheet;
  }
  getLegendDimensions() {
    const w = this.w;
    let currLegendsWrap = w.globals.dom.baseEl.querySelector(".apexcharts-legend");
    let { width: currLegendsWrapWidth, height: currLegendsWrapHeight } = currLegendsWrap.getBoundingClientRect();
    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth
    };
  }
  appendToForeignObject() {
    const gl = this.w.globals;
    if (this.w.config.chart.injectStyleSheet !== false) {
      gl.dom.elLegendForeign.appendChild(this.getLegendStyles());
    }
  }
  toggleDataSeries(seriesCnt, isHidden) {
    const w = this.w;
    if (w.globals.axisCharts || w.config.chart.type === "radialBar") {
      w.globals.resized = true;
      let seriesEl = null;
      let realIndex2 = null;
      w.globals.risingSeries = [];
      if (w.globals.axisCharts) {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${seriesCnt}']`
        );
        if (!seriesEl) return;
        realIndex2 = parseInt(seriesEl.getAttribute("data:realIndex"), 10);
      } else {
        seriesEl = w.globals.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        );
        if (!seriesEl) return;
        realIndex2 = parseInt(seriesEl.getAttribute("rel"), 10) - 1;
      }
      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w.globals.collapsedSeries,
            csi: w.globals.collapsedSeriesIndices
          },
          {
            cs: w.globals.ancillaryCollapsedSeries,
            csi: w.globals.ancillaryCollapsedSeriesIndices
          }
        ];
        seriesToMakeVisible.forEach((r) => {
          this.riseCollapsedSeries(r.cs, r.csi, realIndex2);
        });
      } else {
        this.hideSeries({ seriesEl, realIndex: realIndex2 });
      }
    } else {
      let seriesEl = w.globals.dom.Paper.findOne(
        ` .apexcharts-series[rel='${seriesCnt + 1}'] path`
      );
      const type = w.config.chart.type;
      if (type === "pie" || type === "polarArea" || type === "donut") {
        let dataLabels = w.config.plotOptions.pie.donut.labels;
        const graphics = new Graphics(this.lgCtx.ctx);
        graphics.pathMouseDown(seriesEl, null);
        this.lgCtx.ctx.pie.printDataLabelsInner(seriesEl.node, dataLabels);
      }
      seriesEl.fire("click");
    }
  }
  getSeriesAfterCollapsing({ realIndex: realIndex2 }) {
    const w = this.w;
    const gl = w.globals;
    let series = Utils$1.clone(w.config.series);
    if (gl.axisCharts) {
      let yaxis = w.config.yaxis[gl.seriesYAxisReverseMap[realIndex2]];
      const collapseData = {
        index: realIndex2,
        data: series[realIndex2].data.slice(),
        type: series[realIndex2].type || w.config.chart.type
      };
      if (yaxis && yaxis.show && yaxis.showAlways) {
        if (gl.ancillaryCollapsedSeriesIndices.indexOf(realIndex2) < 0) {
          gl.ancillaryCollapsedSeries.push(collapseData);
          gl.ancillaryCollapsedSeriesIndices.push(realIndex2);
        }
      } else {
        if (gl.collapsedSeriesIndices.indexOf(realIndex2) < 0) {
          gl.collapsedSeries.push(collapseData);
          gl.collapsedSeriesIndices.push(realIndex2);
          let removeIndexOfRising = gl.risingSeries.indexOf(realIndex2);
          gl.risingSeries.splice(removeIndexOfRising, 1);
        }
      }
    } else {
      gl.collapsedSeries.push({
        index: realIndex2,
        data: series[realIndex2]
      });
      gl.collapsedSeriesIndices.push(realIndex2);
    }
    gl.allSeriesCollapsed = gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length === w.config.series.length;
    return this._getSeriesBasedOnCollapsedState(series);
  }
  hideSeries({ seriesEl, realIndex: realIndex2 }) {
    const w = this.w;
    let series = this.getSeriesAfterCollapsing({
      realIndex: realIndex2
    });
    let seriesChildren = seriesEl.childNodes;
    for (let sc = 0; sc < seriesChildren.length; sc++) {
      if (seriesChildren[sc].classList.contains("apexcharts-series-markers-wrap")) {
        if (seriesChildren[sc].classList.contains("apexcharts-hide")) {
          seriesChildren[sc].classList.remove("apexcharts-hide");
        } else {
          seriesChildren[sc].classList.add("apexcharts-hide");
        }
      }
    }
    this.lgCtx.ctx.updateHelpers._updateSeries(
      series,
      w.config.chart.animations.dynamicAnimation.enabled
    );
  }
  riseCollapsedSeries(collapsedSeries, seriesIndices, realIndex2) {
    const w = this.w;
    let series = Utils$1.clone(w.config.series);
    if (collapsedSeries.length > 0) {
      for (let c = 0; c < collapsedSeries.length; c++) {
        if (collapsedSeries[c].index === realIndex2) {
          if (w.globals.axisCharts) {
            series[realIndex2].data = collapsedSeries[c].data.slice();
          } else {
            series[realIndex2] = collapsedSeries[c].data;
          }
          if (typeof series[realIndex2] !== "number") {
            series[realIndex2].hidden = false;
          }
          collapsedSeries.splice(c, 1);
          seriesIndices.splice(c, 1);
          w.globals.risingSeries.push(realIndex2);
        }
      }
      series = this._getSeriesBasedOnCollapsedState(series);
      this.lgCtx.ctx.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
    }
  }
  _getSeriesBasedOnCollapsedState(series) {
    const w = this.w;
    let collapsed = 0;
    if (w.globals.axisCharts) {
      series.forEach((s, sI) => {
        if (!(w.globals.collapsedSeriesIndices.indexOf(sI) < 0 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(sI) < 0)) {
          series[sI].data = [];
          collapsed++;
        }
      });
    } else {
      series.forEach((s, sI) => {
        if (!w.globals.collapsedSeriesIndices.indexOf(sI) < 0) {
          series[sI] = 0;
          collapsed++;
        }
      });
    }
    w.globals.allSeriesCollapsed = collapsed === series.length;
    return series;
  }
};
class Legend {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.onLegendClick = this.onLegendClick.bind(this);
    this.onLegendHovered = this.onLegendHovered.bind(this);
    this.isBarsDistributed = this.w.config.chart.type === "bar" && this.w.config.plotOptions.bar.distributed && this.w.config.series.length === 1;
    this.legendHelpers = new Helpers$2(this);
  }
  init() {
    const w = this.w;
    const gl = w.globals;
    const cnf = w.config;
    const showLegendAlways = cnf.legend.showForSingleSeries && gl.series.length === 1 || this.isBarsDistributed || gl.series.length > 1;
    this.legendHelpers.appendToForeignObject();
    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      while (gl.dom.elLegendWrap.firstChild) {
        gl.dom.elLegendWrap.removeChild(gl.dom.elLegendWrap.firstChild);
      }
      this.drawLegends();
      if (cnf.legend.position === "bottom" || cnf.legend.position === "top") {
        this.legendAlignHorizontal();
      } else if (cnf.legend.position === "right" || cnf.legend.position === "left") {
        this.legendAlignVertical();
      }
    }
  }
  createLegendMarker({ i, fillcolor }) {
    const w = this.w;
    const elMarker = document.createElement("span");
    elMarker.classList.add("apexcharts-legend-marker");
    let mShape = w.config.legend.markers.shape || w.config.markers.shape;
    let shape = mShape;
    if (Array.isArray(mShape)) {
      shape = mShape[i];
    }
    let mSize = Array.isArray(w.config.legend.markers.size) ? parseFloat(w.config.legend.markers.size[i]) : parseFloat(w.config.legend.markers.size);
    let mOffsetX = Array.isArray(w.config.legend.markers.offsetX) ? parseFloat(w.config.legend.markers.offsetX[i]) : parseFloat(w.config.legend.markers.offsetX);
    let mOffsetY = Array.isArray(w.config.legend.markers.offsetY) ? parseFloat(w.config.legend.markers.offsetY[i]) : parseFloat(w.config.legend.markers.offsetY);
    let mBorderWidth = Array.isArray(w.config.legend.markers.strokeWidth) ? parseFloat(w.config.legend.markers.strokeWidth[i]) : parseFloat(w.config.legend.markers.strokeWidth);
    let mStyle = elMarker.style;
    mStyle.height = (mSize + mBorderWidth) * 2 + "px";
    mStyle.width = (mSize + mBorderWidth) * 2 + "px";
    mStyle.left = mOffsetX + "px";
    mStyle.top = mOffsetY + "px";
    if (w.config.legend.markers.customHTML) {
      mStyle.background = "transparent";
      mStyle.color = fillcolor[i];
      if (Array.isArray(w.config.legend.markers.customHTML)) {
        if (w.config.legend.markers.customHTML[i]) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i]();
        }
      } else {
        elMarker.innerHTML = w.config.legend.markers.customHTML();
      }
    } else {
      let markers = new Markers(this.ctx);
      const markerConfig = markers.getMarkerConfig({
        cssClass: `apexcharts-legend-marker apexcharts-marker apexcharts-marker-${shape}`,
        seriesIndex: i,
        strokeWidth: mBorderWidth,
        size: mSize
      });
      const SVGMarker = window.SVG().addTo(elMarker).size("100%", "100%");
      const marker = new Graphics(this.ctx).drawMarker(0, 0, __spreadProps(__spreadValues({}, markerConfig), {
        pointFillColor: Array.isArray(fillcolor) ? fillcolor[i] : markerConfig.pointFillColor,
        shape
      }));
      const shapesEls = w.globals.dom.Paper.find(
        ".apexcharts-legend-marker.apexcharts-marker"
      );
      shapesEls.forEach((shapeEl) => {
        if (shapeEl.node.classList.contains("apexcharts-marker-triangle")) {
          shapeEl.node.style.transform = "translate(50%, 45%)";
        } else {
          shapeEl.node.style.transform = "translate(50%, 50%)";
        }
      });
      SVGMarker.add(marker);
    }
    return elMarker;
  }
  drawLegends() {
    var _a;
    let me = this;
    let w = this.w;
    let fontFamily = w.config.legend.fontFamily;
    let legendNames = w.globals.seriesNames;
    let fillcolor = w.config.legend.markers.fillColors ? w.config.legend.markers.fillColors.slice() : w.globals.colors.slice();
    if (w.config.chart.type === "heatmap") {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges;
      legendNames = ranges.map((colorScale) => {
        return colorScale.name ? colorScale.name : colorScale.from + " - " + colorScale.to;
      });
      fillcolor = ranges.map((color) => color.color);
    } else if (this.isBarsDistributed) {
      legendNames = w.globals.labels.slice();
    }
    if (w.config.legend.customLegendItems.length) {
      legendNames = w.config.legend.customLegendItems;
    }
    let legendFormatter = w.globals.legendFormatter;
    let isLegendInversed = w.config.legend.inverseOrder;
    let legendGroups = [];
    if (w.globals.seriesGroups.length > 1 && w.config.legend.clusterGroupedSeries) {
      w.globals.seriesGroups.forEach((_, gi) => {
        legendGroups[gi] = document.createElement("div");
        legendGroups[gi].classList.add(
          "apexcharts-legend-group",
          `apexcharts-legend-group-${gi}`
        );
        if (w.config.legend.clusterGroupedSeriesOrientation === "horizontal") {
          w.globals.dom.elLegendWrap.classList.add(
            "apexcharts-legend-group-horizontal"
          );
        } else {
          legendGroups[gi].classList.add("apexcharts-legend-group-vertical");
        }
      });
    }
    for (let i = isLegendInversed ? legendNames.length - 1 : 0; isLegendInversed ? i >= 0 : i <= legendNames.length - 1; isLegendInversed ? i-- : i++) {
      let text = legendFormatter(legendNames[i], { seriesIndex: i, w });
      let collapsedSeries = false;
      let ancillaryCollapsedSeries = false;
      if (w.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
          if (w.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true;
          }
        }
      }
      if (w.globals.ancillaryCollapsedSeriesIndices.length > 0) {
        for (let c = 0; c < w.globals.ancillaryCollapsedSeriesIndices.length; c++) {
          if (w.globals.ancillaryCollapsedSeriesIndices[c] === i) {
            ancillaryCollapsedSeries = true;
          }
        }
      }
      let elMarker = this.createLegendMarker({ i, fillcolor });
      Graphics.setAttrs(elMarker, {
        rel: i + 1,
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elMarker.classList.add("apexcharts-inactive-legend");
      }
      let elLegend = document.createElement("div");
      let elLegendText = document.createElement("span");
      elLegendText.classList.add("apexcharts-legend-text");
      elLegendText.innerHTML = Array.isArray(text) ? text.join(" ") : text;
      let textColor = w.config.legend.labels.useSeriesColors ? w.globals.colors[i] : Array.isArray(w.config.legend.labels.colors) ? (_a = w.config.legend.labels.colors) == null ? void 0 : _a[i] : w.config.legend.labels.colors;
      if (!textColor) {
        textColor = w.config.chart.foreColor;
      }
      elLegendText.style.color = textColor;
      elLegendText.style.fontSize = w.config.legend.fontSize;
      elLegendText.style.fontWeight = w.config.legend.fontWeight;
      elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily;
      Graphics.setAttrs(elLegendText, {
        rel: i + 1,
        i,
        "data:default-text": encodeURIComponent(text),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      elLegend.appendChild(elMarker);
      elLegend.appendChild(elLegendText);
      const coreUtils = new CoreUtils(this.ctx);
      if (!w.config.legend.showForZeroSeries) {
        const total = coreUtils.getSeriesTotalByIndex(i);
        if (total === 0 && coreUtils.seriesHaveSameValues(i) && !coreUtils.isSeriesNull(i) && w.globals.collapsedSeriesIndices.indexOf(i) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add("apexcharts-hidden-zero-series");
        }
      }
      if (!w.config.legend.showForNullSeries) {
        if (coreUtils.isSeriesNull(i) && w.globals.collapsedSeriesIndices.indexOf(i) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add("apexcharts-hidden-null-series");
        }
      }
      if (legendGroups.length) {
        w.globals.seriesGroups.forEach((group, gi) => {
          var _a2;
          if (group.includes((_a2 = w.config.series[i]) == null ? void 0 : _a2.name)) {
            w.globals.dom.elLegendWrap.appendChild(legendGroups[gi]);
            legendGroups[gi].appendChild(elLegend);
          }
        });
      } else {
        w.globals.dom.elLegendWrap.appendChild(elLegend);
      }
      w.globals.dom.elLegendWrap.classList.add(
        `apexcharts-align-${w.config.legend.horizontalAlign}`
      );
      w.globals.dom.elLegendWrap.classList.add(
        "apx-legend-position-" + w.config.legend.position
      );
      elLegend.classList.add("apexcharts-legend-series");
      elLegend.style.margin = `${w.config.legend.itemMargin.vertical}px ${w.config.legend.itemMargin.horizontal}px`;
      w.globals.dom.elLegendWrap.style.width = w.config.legend.width ? w.config.legend.width + "px" : "";
      w.globals.dom.elLegendWrap.style.height = w.config.legend.height ? w.config.legend.height + "px" : "";
      Graphics.setAttrs(elLegend, {
        rel: i + 1,
        seriesName: Utils$1.escapeString(legendNames[i]),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elLegend.classList.add("apexcharts-inactive-legend");
      }
      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add("apexcharts-no-click");
      }
    }
    w.globals.dom.elWrap.addEventListener("click", me.onLegendClick, true);
    if (w.config.legend.onItemHover.highlightDataSeries && w.config.legend.customLegendItems.length === 0) {
      w.globals.dom.elWrap.addEventListener(
        "mousemove",
        me.onLegendHovered,
        true
      );
      w.globals.dom.elWrap.addEventListener(
        "mouseout",
        me.onLegendHovered,
        true
      );
    }
  }
  setLegendWrapXY(offsetX, offsetY) {
    let w = this.w;
    let elLegendWrap = w.globals.dom.elLegendWrap;
    const legendHeight = elLegendWrap.clientHeight;
    let x = 0;
    let y = 0;
    if (w.config.legend.position === "bottom") {
      y = w.globals.svgHeight - Math.min(legendHeight, w.globals.svgHeight / 2) - 5;
    } else if (w.config.legend.position === "top") {
      const dim = new Dimensions(this.ctx);
      const titleH = dim.dimHelpers.getTitleSubtitleCoords("title").height;
      const subtitleH = dim.dimHelpers.getTitleSubtitleCoords("subtitle").height;
      y = (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0);
    }
    elLegendWrap.style.position = "absolute";
    x = x + offsetX + w.config.legend.offsetX;
    y = y + offsetY + w.config.legend.offsetY;
    elLegendWrap.style.left = x + "px";
    elLegendWrap.style.top = y + "px";
    if (w.config.legend.position === "right") {
      elLegendWrap.style.left = "auto";
      elLegendWrap.style.right = 25 + w.config.legend.offsetX + "px";
    }
    const fixedHeigthWidth = ["width", "height"];
    fixedHeigthWidth.forEach((hw) => {
      if (elLegendWrap.style[hw]) {
        elLegendWrap.style[hw] = parseInt(w.config.legend[hw], 10) + "px";
      }
    });
  }
  legendAlignHorizontal() {
    let w = this.w;
    let elLegendWrap = w.globals.dom.elLegendWrap;
    elLegendWrap.style.right = 0;
    let dimensions = new Dimensions(this.ctx);
    let titleRect = dimensions.dimHelpers.getTitleSubtitleCoords("title");
    let subtitleRect = dimensions.dimHelpers.getTitleSubtitleCoords("subtitle");
    let offsetX = 20;
    let offsetY = 0;
    if (w.config.legend.position === "top") {
      offsetY = titleRect.height + subtitleRect.height + w.config.title.margin + w.config.subtitle.margin - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  legendAlignVertical() {
    let w = this.w;
    let lRect = this.legendHelpers.getLegendDimensions();
    let offsetY = 20;
    let offsetX = 0;
    if (w.config.legend.position === "left") {
      offsetX = 20;
    }
    if (w.config.legend.position === "right") {
      offsetX = w.globals.svgWidth - lRect.clww - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  onLegendHovered(e) {
    const w = this.w;
    const hoverOverLegend = e.target.classList.contains("apexcharts-legend-series") || e.target.classList.contains("apexcharts-legend-text") || e.target.classList.contains("apexcharts-legend-marker");
    if (w.config.chart.type !== "heatmap" && !this.isBarsDistributed) {
      if (!e.target.classList.contains("apexcharts-inactive-legend") && hoverOverLegend) {
        let series = new Series(this.ctx);
        series.toggleSeriesOnHover(e, e.target);
      }
    } else {
      if (hoverOverLegend) {
        let seriesCnt = parseInt(e.target.getAttribute("rel"), 10) - 1;
        this.ctx.events.fireEvent("legendHover", [this.ctx, seriesCnt, this.w]);
        let series = new Series(this.ctx);
        series.highlightRangeInSeries(e, e.target);
      }
    }
  }
  onLegendClick(e) {
    const w = this.w;
    if (w.config.legend.customLegendItems.length) return;
    if (e.target.classList.contains("apexcharts-legend-series") || e.target.classList.contains("apexcharts-legend-text") || e.target.classList.contains("apexcharts-legend-marker")) {
      let seriesCnt = parseInt(e.target.getAttribute("rel"), 10) - 1;
      let isHidden = e.target.getAttribute("data:collapsed") === "true";
      const legendClick = this.w.config.chart.events.legendClick;
      if (typeof legendClick === "function") {
        legendClick(this.ctx, seriesCnt, this.w);
      }
      this.ctx.events.fireEvent("legendClick", [this.ctx, seriesCnt, this.w]);
      const markerClick = this.w.config.legend.markers.onClick;
      if (typeof markerClick === "function" && e.target.classList.contains("apexcharts-legend-marker")) {
        markerClick(this.ctx, seriesCnt, this.w);
        this.ctx.events.fireEvent("legendMarkerClick", [
          this.ctx,
          seriesCnt,
          this.w
        ]);
      }
      const clickAllowed = w.config.chart.type !== "treemap" && w.config.chart.type !== "heatmap" && !this.isBarsDistributed;
      if (clickAllowed && w.config.legend.onItemClick.toggleDataSeries) {
        this.legendHelpers.toggleDataSeries(seriesCnt, isHidden);
      }
    }
  }
}
const icoPan = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="24" viewBox="0 0 24 24" width="24">\n    <defs>\n        <path d="M0 0h24v24H0z" id="a"/>\n    </defs>\n    <clipPath id="b">\n        <use overflow="visible" xlink:href="#a"/>\n    </clipPath>\n    <path clip-path="url(#b)" d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"/>\n</svg>';
const icoZoom = '<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" height="24" viewBox="0 0 24 24" width="24">\n    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>\n    <path d="M0 0h24v24H0V0z" fill="none"/>\n    <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>\n</svg>';
const icoReset = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>\n    <path d="M0 0h24v24H0z" fill="none"/>\n</svg>';
const icoZoomIn = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">\n    <path d="M0 0h24v24H0z" fill="none"/>\n    <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>\n</svg>\n';
const icoZoomOut = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">\n    <path d="M0 0h24v24H0z" fill="none"/>\n    <path d="M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>\n</svg>\n';
const icoSelect = '<svg fill="#6E8192" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n    <path d="M0 0h24v24H0z" fill="none"/>\n    <path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z"/>\n</svg>';
const icoMenu = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
class Toolbar {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    const w = this.w;
    this.ev = this.w.config.chart.events;
    this.selectedClass = "apexcharts-selected";
    this.localeValues = this.w.globals.locale.toolbar;
    this.minX = w.globals.minX;
    this.maxX = w.globals.maxX;
  }
  createToolbar() {
    let w = this.w;
    const createDiv = () => {
      return document.createElement("div");
    };
    const elToolbarWrap = createDiv();
    elToolbarWrap.setAttribute("class", "apexcharts-toolbar");
    elToolbarWrap.style.top = w.config.chart.toolbar.offsetY + "px";
    elToolbarWrap.style.right = -w.config.chart.toolbar.offsetX + 3 + "px";
    w.globals.dom.elWrap.appendChild(elToolbarWrap);
    this.elZoom = createDiv();
    this.elZoomIn = createDiv();
    this.elZoomOut = createDiv();
    this.elPan = createDiv();
    this.elSelection = createDiv();
    this.elZoomReset = createDiv();
    this.elMenuIcon = createDiv();
    this.elMenu = createDiv();
    this.elCustomIcons = [];
    this.t = w.config.chart.toolbar.tools;
    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(createDiv());
      }
    }
    let toolbarControls = [];
    const appendZoomControl = (type, el, ico) => {
      const tool = type.toLowerCase();
      if (this.t[tool] && w.config.chart.zoom.enabled) {
        toolbarControls.push({
          el,
          icon: typeof this.t[tool] === "string" ? this.t[tool] : ico,
          title: this.localeValues[type],
          class: `apexcharts-${tool}-icon`
        });
      }
    };
    appendZoomControl("zoomIn", this.elZoomIn, icoZoomIn);
    appendZoomControl("zoomOut", this.elZoomOut, icoZoomOut);
    const zoomSelectionCtrls = (z) => {
      if (this.t[z] && w.config.chart[z].enabled) {
        toolbarControls.push({
          el: z === "zoom" ? this.elZoom : this.elSelection,
          icon: typeof this.t[z] === "string" ? this.t[z] : z === "zoom" ? icoZoom : icoSelect,
          title: this.localeValues[z === "zoom" ? "selectionZoom" : "selection"],
          class: `apexcharts-${z}-icon`
        });
      }
    };
    zoomSelectionCtrls("zoom");
    zoomSelectionCtrls("selection");
    if (this.t.pan && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: typeof this.t.pan === "string" ? this.t.pan : icoPan,
        title: this.localeValues.pan,
        class: "apexcharts-pan-icon"
      });
    }
    appendZoomControl("reset", this.elZoomReset, icoReset);
    if (this.t.download) {
      toolbarControls.push({
        el: this.elMenuIcon,
        icon: typeof this.t.download === "string" ? this.t.download : icoMenu,
        title: this.localeValues.menu,
        class: "apexcharts-menu-icon"
      });
    }
    for (let i = 0; i < this.elCustomIcons.length; i++) {
      toolbarControls.push({
        el: this.elCustomIcons[i],
        icon: this.t.customIcons[i].icon,
        title: this.t.customIcons[i].title,
        index: this.t.customIcons[i].index,
        class: "apexcharts-toolbar-custom-icon " + this.t.customIcons[i].class
      });
    }
    toolbarControls.forEach((t, index) => {
      if (t.index) {
        Utils$1.moveIndexInArray(toolbarControls, index, t.index);
      }
    });
    for (let i = 0; i < toolbarControls.length; i++) {
      Graphics.setAttrs(toolbarControls[i].el, {
        class: toolbarControls[i].class,
        title: toolbarControls[i].title
      });
      toolbarControls[i].el.innerHTML = toolbarControls[i].icon;
      elToolbarWrap.appendChild(toolbarControls[i].el);
    }
    this._createHamburgerMenu(elToolbarWrap);
    if (w.globals.zoomEnabled) {
      this.elZoom.classList.add(this.selectedClass);
    } else if (w.globals.panEnabled) {
      this.elPan.classList.add(this.selectedClass);
    } else if (w.globals.selectionEnabled) {
      this.elSelection.classList.add(this.selectedClass);
    }
    this.addToolbarEventListeners();
  }
  _createHamburgerMenu(parent) {
    this.elMenuItems = [];
    parent.appendChild(this.elMenu);
    Graphics.setAttrs(this.elMenu, {
      class: "apexcharts-menu"
    });
    const menuItems = [
      {
        name: "exportSVG",
        title: this.localeValues.exportToSVG
      },
      {
        name: "exportPNG",
        title: this.localeValues.exportToPNG
      },
      {
        name: "exportCSV",
        title: this.localeValues.exportToCSV
      }
    ];
    for (let i = 0; i < menuItems.length; i++) {
      this.elMenuItems.push(document.createElement("div"));
      this.elMenuItems[i].innerHTML = menuItems[i].title;
      Graphics.setAttrs(this.elMenuItems[i], {
        class: `apexcharts-menu-item ${menuItems[i].name}`,
        title: menuItems[i].title
      });
      this.elMenu.appendChild(this.elMenuItems[i]);
    }
  }
  addToolbarEventListeners() {
    this.elZoomReset.addEventListener("click", this.handleZoomReset.bind(this));
    this.elSelection.addEventListener(
      "click",
      this.toggleZoomSelection.bind(this, "selection")
    );
    this.elZoom.addEventListener(
      "click",
      this.toggleZoomSelection.bind(this, "zoom")
    );
    this.elZoomIn.addEventListener("click", this.handleZoomIn.bind(this));
    this.elZoomOut.addEventListener("click", this.handleZoomOut.bind(this));
    this.elPan.addEventListener("click", this.togglePanning.bind(this));
    this.elMenuIcon.addEventListener("click", this.toggleMenu.bind(this));
    this.elMenuItems.forEach((m) => {
      if (m.classList.contains("exportSVG")) {
        m.addEventListener("click", this.handleDownload.bind(this, "svg"));
      } else if (m.classList.contains("exportPNG")) {
        m.addEventListener("click", this.handleDownload.bind(this, "png"));
      } else if (m.classList.contains("exportCSV")) {
        m.addEventListener("click", this.handleDownload.bind(this, "csv"));
      }
    });
    for (let i = 0; i < this.t.customIcons.length; i++) {
      this.elCustomIcons[i].addEventListener(
        "click",
        this.t.customIcons[i].click.bind(this, this.ctx, this.ctx.w)
      );
    }
  }
  toggleZoomSelection(type) {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      ch.ctx.toolbar.toggleOtherControls();
      let el = type === "selection" ? ch.ctx.toolbar.elSelection : ch.ctx.toolbar.elZoom;
      let enabledType = type === "selection" ? "selectionEnabled" : "zoomEnabled";
      ch.w.globals[enabledType] = !ch.w.globals[enabledType];
      if (!el.classList.contains(ch.ctx.toolbar.selectedClass)) {
        el.classList.add(ch.ctx.toolbar.selectedClass);
      } else {
        el.classList.remove(ch.ctx.toolbar.selectedClass);
      }
    });
  }
  getToolbarIconsReference() {
    const w = this.w;
    if (!this.elZoom) {
      this.elZoom = w.globals.dom.baseEl.querySelector(".apexcharts-zoom-icon");
    }
    if (!this.elPan) {
      this.elPan = w.globals.dom.baseEl.querySelector(".apexcharts-pan-icon");
    }
    if (!this.elSelection) {
      this.elSelection = w.globals.dom.baseEl.querySelector(
        ".apexcharts-selection-icon"
      );
    }
  }
  enableZoomPanFromToolbar(type) {
    this.toggleOtherControls();
    type === "pan" ? this.w.globals.panEnabled = true : this.w.globals.zoomEnabled = true;
    const el = type === "pan" ? this.elPan : this.elZoom;
    const el2 = type === "pan" ? this.elZoom : this.elPan;
    if (el) {
      el.classList.add(this.selectedClass);
    }
    if (el2) {
      el2.classList.remove(this.selectedClass);
    }
  }
  togglePanning() {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      ch.ctx.toolbar.toggleOtherControls();
      ch.w.globals.panEnabled = !ch.w.globals.panEnabled;
      if (!ch.ctx.toolbar.elPan.classList.contains(ch.ctx.toolbar.selectedClass)) {
        ch.ctx.toolbar.elPan.classList.add(ch.ctx.toolbar.selectedClass);
      } else {
        ch.ctx.toolbar.elPan.classList.remove(ch.ctx.toolbar.selectedClass);
      }
    });
  }
  toggleOtherControls() {
    const w = this.w;
    w.globals.panEnabled = false;
    w.globals.zoomEnabled = false;
    w.globals.selectionEnabled = false;
    this.getToolbarIconsReference();
    const toggleEls = [this.elPan, this.elSelection, this.elZoom];
    toggleEls.forEach((el) => {
      if (el) {
        el.classList.remove(this.selectedClass);
      }
    });
  }
  handleZoomIn() {
    const w = this.w;
    if (w.globals.isRangeBar) {
      this.minX = w.globals.minY;
      this.maxX = w.globals.maxY;
    }
    const centerX = (this.minX + this.maxX) / 2;
    let newMinX = (this.minX + centerX) / 2;
    let newMaxX = (this.maxX + centerX) / 2;
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.globals.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  handleZoomOut() {
    const w = this.w;
    if (w.globals.isRangeBar) {
      this.minX = w.globals.minY;
      this.maxX = w.globals.maxY;
    }
    if (w.config.xaxis.type === "datetime" && new Date(this.minX).getUTCFullYear() < 1e3) {
      return;
    }
    const centerX = (this.minX + this.maxX) / 2;
    let newMinX = this.minX - (centerX - this.minX);
    let newMaxX = this.maxX - (centerX - this.maxX);
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.globals.disableZoomOut) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  _getNewMinXMaxX(newMinX, newMaxX) {
    const shouldFloor = this.w.config.xaxis.convertedCatToNumeric;
    return {
      minX: shouldFloor ? Math.floor(newMinX) : newMinX,
      maxX: shouldFloor ? Math.floor(newMaxX) : newMaxX
    };
  }
  zoomUpdateOptions(newMinX, newMaxX) {
    const w = this.w;
    if (newMinX === void 0 && newMaxX === void 0) {
      this.handleZoomReset();
      return;
    }
    if (w.config.xaxis.convertedCatToNumeric) {
      if (newMinX < 1) {
        newMinX = 1;
        newMaxX = w.globals.dataPoints;
      }
      if (newMaxX - newMinX < 2) {
        return;
      }
    }
    let xaxis = {
      min: newMinX,
      max: newMaxX
    };
    const beforeZoomRange = this.getBeforeZoomRange(xaxis);
    if (beforeZoomRange) {
      xaxis = beforeZoomRange.xaxis;
    }
    let options2 = {
      xaxis
    };
    let yaxis = Utils$1.clone(w.globals.initialConfig.yaxis);
    if (!w.config.chart.group) {
      options2.yaxis = yaxis;
    }
    this.w.globals.zoomed = true;
    this.ctx.updateHelpers._updateOptions(
      options2,
      false,
      this.w.config.chart.animations.dynamicAnimation.enabled
    );
    this.zoomCallback(xaxis, yaxis);
  }
  zoomCallback(xaxis, yaxis) {
    if (typeof this.ev.zoomed === "function") {
      this.ev.zoomed(this.ctx, { xaxis, yaxis });
      this.ctx.events.fireEvent("zoomed", { xaxis, yaxis });
    }
  }
  getBeforeZoomRange(xaxis, yaxis) {
    let newRange = null;
    if (typeof this.ev.beforeZoom === "function") {
      newRange = this.ev.beforeZoom(this, { xaxis, yaxis });
    }
    return newRange;
  }
  toggleMenu() {
    window.setTimeout(() => {
      if (this.elMenu.classList.contains("apexcharts-menu-open")) {
        this.elMenu.classList.remove("apexcharts-menu-open");
      } else {
        this.elMenu.classList.add("apexcharts-menu-open");
      }
    }, 0);
  }
  handleDownload(type) {
    const w = this.w;
    const exprt = new Exports(this.ctx);
    switch (type) {
      case "svg":
        exprt.exportToSVG(this.ctx);
        break;
      case "png":
        exprt.exportToPng(this.ctx);
        break;
      case "csv":
        exprt.exportToCSV({
          series: w.config.series,
          columnDelimiter: w.config.chart.toolbar.export.csv.columnDelimiter
        });
        break;
    }
  }
  handleZoomReset(e) {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      let w = ch.w;
      w.globals.lastXAxis.min = w.globals.initialConfig.xaxis.min;
      w.globals.lastXAxis.max = w.globals.initialConfig.xaxis.max;
      ch.updateHelpers.revertDefaultAxisMinMax();
      if (typeof w.config.chart.events.beforeResetZoom === "function") {
        const resetZoomRange = w.config.chart.events.beforeResetZoom(ch, w);
        if (resetZoomRange) {
          ch.updateHelpers.revertDefaultAxisMinMax(resetZoomRange);
        }
      }
      if (typeof w.config.chart.events.zoomed === "function") {
        ch.ctx.toolbar.zoomCallback({
          min: w.config.xaxis.min,
          max: w.config.xaxis.max
        });
      }
      w.globals.zoomed = false;
      let series = ch.ctx.series.emptyCollapsedSeries(
        Utils$1.clone(w.globals.initialSeries)
      );
      ch.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
    });
  }
  destroy() {
    this.elZoom = null;
    this.elZoomIn = null;
    this.elZoomOut = null;
    this.elPan = null;
    this.elSelection = null;
    this.elZoomReset = null;
    this.elMenuIcon = null;
  }
}
const SVGNS = "http://www.w3.org/2000/svg";
class Point {
  constructor(x, y) {
    if (typeof x === "object") {
      this.x = x.x;
      this.y = x.y;
    } else {
      this.x = x || 0;
      this.y = y || 0;
    }
  }
  transform(matrix) {
    return matrix.apply(this);
  }
  clone() {
    return new Point(this.x, this.y);
  }
}
class Matrix {
  constructor(a, b, c, d, e, f) {
    this.a = a != null ? a : 1;
    this.b = b != null ? b : 0;
    this.c = c != null ? c : 0;
    this.d = d != null ? d : 1;
    this.e = e != null ? e : 0;
    this.f = f != null ? f : 0;
  }
  rotate(deg) {
    const rad = deg * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return this.multiply(new Matrix(cos, sin, -sin, cos, 0, 0));
  }
  scale(sx, sy) {
    return this.multiply(new Matrix(sx, 0, 0, sy != null ? sy : sx, 0, 0));
  }
  multiply(m) {
    return new Matrix(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f
    );
  }
  apply(point) {
    return new Point(
      this.a * point.x + this.c * point.y + this.e,
      this.b * point.x + this.d * point.y + this.f
    );
  }
}
class Box {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.width = w;
    this.height = h;
    this.x2 = x + w;
    this.y2 = y + h;
  }
}
class SVGElement {
  constructor(node) {
    this.node = node;
    if (node) {
      node.instance = this;
    }
    this._listeners = [];
    this._filter = null;
  }
  // ---- Attribute methods ----
  attr(a, v) {
    if (typeof a === "string" && v === void 0) {
      return this.node.getAttribute(a);
    }
    const attrs = typeof a === "string" ? { [a]: v } : a;
    for (const key in attrs) {
      let val = attrs[key];
      if (val === null) {
        this.node.removeAttribute(key);
      } else if (val !== void 0) {
        if (typeof val === "number" && isNaN(val)) val = 0;
        this.node.setAttribute(key, val);
      }
    }
    if (this.node.nodeName === "text" && attrs.x != null) {
      const tspans = this.node.querySelectorAll("tspan[data-newline]");
      for (let i = 0; i < tspans.length; i++) {
        tspans[i].setAttribute("x", attrs.x);
      }
    }
    return this;
  }
  css(styles) {
    for (const k in styles) {
      this.node.style[k] = styles[k];
    }
    return this;
  }
  fill(v) {
    if (typeof v === "object") {
      return this.attr(v);
    }
    return this.attr("fill", v);
  }
  stroke(v) {
    if (typeof v === "object") {
      if (v.color !== void 0) this.attr("stroke", v.color);
      if (v.width !== void 0) this.attr("stroke-width", v.width);
      if (v.dasharray !== void 0) this.attr("stroke-dasharray", v.dasharray);
      if (v.linecap !== void 0) this.attr("stroke-linecap", v.linecap);
      if (v.opacity !== void 0) this.attr("stroke-opacity", v.opacity);
      return this;
    }
    return this.attr("stroke", v);
  }
  size(w, h) {
    return this.attr({ width: w, height: h });
  }
  move(x, y) {
    return this.attr({ x, y });
  }
  center(cx, cy) {
    if (this.node.nodeName === "g") {
      const box = this.bbox();
      const dx = cx - (box.x + box.width / 2);
      const dy = cy - (box.y + box.height / 2);
      return this.attr("transform", `translate(${dx}, ${dy})`);
    }
    return this.attr({ cx, cy });
  }
  // ---- Tree operations ----
  add(child) {
    this.node.appendChild(child.node || child);
    return this;
  }
  addTo(parent) {
    const p = parent.node || parent;
    p.appendChild(this.node);
    return this;
  }
  remove() {
    if (this.node.parentNode) {
      this.node.parentNode.removeChild(this.node);
    }
    return this;
  }
  clear() {
    while (this.node.firstChild) {
      this.node.removeChild(this.node.firstChild);
    }
    return this;
  }
  // ---- Query ----
  find(selector) {
    return Array.from(this.node.querySelectorAll(selector)).map(
      (n) => n.instance || new SVGElement(n)
    );
  }
  findOne(selector) {
    const n = this.node.querySelector(selector);
    return n ? n.instance || new SVGElement(n) : null;
  }
  // ---- Events ----
  on(event, handler) {
    const eventType = event.split(".")[0];
    this._listeners.push({ event, eventType, handler });
    this.node.addEventListener(eventType, handler);
    return this;
  }
  off(event, handler) {
    if (!event && !handler) {
      this._listeners.forEach((l) => {
        this.node.removeEventListener(l.eventType, l.handler);
      });
      this._listeners = [];
    } else if (event && !handler) {
      const eventType = event.split(".")[0];
      this._listeners = this._listeners.filter((l) => {
        if (l.eventType === eventType) {
          this.node.removeEventListener(l.eventType, l.handler);
          return false;
        }
        return true;
      });
    } else {
      const eventType = event.split(".")[0];
      this._listeners = this._listeners.filter((l) => {
        if (l.eventType === eventType && l.handler === handler) {
          this.node.removeEventListener(l.eventType, l.handler);
          return false;
        }
        return true;
      });
    }
    return this;
  }
  // ---- Iteration ----
  each(fn, deep) {
    const children = Array.from(this.node.children);
    children.forEach((child) => {
      const inst = child.instance || new SVGElement(child);
      fn.call(inst);
      if (deep) inst.each(fn, deep);
    });
    return this;
  }
  // ---- CSS classes ----
  removeClass(cls) {
    if (cls === "*") {
      this.node.removeAttribute("class");
    } else {
      this.node.classList.remove(cls);
    }
    return this;
  }
  // ---- Children ----
  children() {
    return Array.from(this.node.childNodes).filter((n) => n.nodeType === 1).map((n) => n.instance || new SVGElement(n));
  }
  // ---- Visibility ----
  hide() {
    this.node.style.display = "none";
    return this;
  }
  show() {
    this.node.style.display = "";
    return this;
  }
  // ---- Measurement ----
  bbox() {
    if (typeof this.node.getBBox === "function") {
      try {
        return this.node.getBBox();
      } catch (e) {
      }
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  // ---- Text-specific ----
  tspan(text) {
    const tspan = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "tspan"
    );
    tspan.textContent = text;
    this.node.appendChild(tspan);
    return new SVGElement(tspan);
  }
  // ---- Path-specific ----
  plot(d) {
    if (typeof d === "string") {
      this.attr("d", d);
    }
    return this;
  }
  // ---- Animation (overridden by SVGAnimation mixin) ----
  animate(duration, delay) {
    throw new Error("Animation module not loaded");
  }
  // ---- Filter methods (set up by SVGFilter module) ----
  filterWith(fn) {
    throw new Error("Filter module not loaded");
  }
  unfilter(all) {
    if (this._filter) {
      this.node.removeAttribute("filter");
      if (all && this._filter.node && this._filter.node.parentNode) {
        this._filter.node.parentNode.removeChild(this._filter.node);
      }
      this._filter = null;
    }
    return this;
  }
  filterer() {
    return this._filter;
  }
}
let gradientCounter = 0;
class SVGGradient extends SVGElement {
  constructor(container, type, builder) {
    const tag = type === "radial" ? "radialGradient" : "linearGradient";
    const node = document.createElementNS(SVGNS, tag);
    super(node);
    this._id = "SvgjsGradient" + ++gradientCounter;
    this.attr("id", this._id);
    if (typeof builder === "function") {
      builder(new StopBuilder(this));
    }
    let defs = container.node.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVGNS, "defs");
      container.node.appendChild(defs);
    }
    defs.appendChild(this.node);
  }
  stop(offset, color, opacity) {
    const s = document.createElementNS(SVGNS, "stop");
    s.setAttribute("offset", offset);
    s.setAttribute("stop-color", color);
    if (opacity !== void 0) s.setAttribute("stop-opacity", opacity);
    this.node.appendChild(s);
    return this;
  }
  from(x, y) {
    return this.attr({ x1: x, y1: y });
  }
  to(x, y) {
    return this.attr({ x2: x, y2: y });
  }
  url() {
    return "url(#" + this._id + ")";
  }
  toString() {
    return this.url();
  }
  valueOf() {
    return this.url();
  }
  fill() {
    return this.url();
  }
}
class StopBuilder {
  constructor(gradient) {
    this.gradient = gradient;
  }
  stop(offset, color, opacity) {
    this.gradient.stop(offset, color, opacity);
    return this;
  }
}
let patternCounter = 0;
class SVGPattern extends SVGElement {
  constructor(container, w, h, builder) {
    const node = document.createElementNS(SVGNS, "pattern");
    super(node);
    this._id = "SvgjsPattern" + ++patternCounter;
    this.attr({
      id: this._id,
      width: w,
      height: h,
      patternUnits: "userSpaceOnUse"
    });
    if (typeof builder === "function") {
      const patternContainer = new SVGContainer(this.node);
      builder(patternContainer);
    }
    let defs = container.node.querySelector("defs");
    if (!defs) {
      defs = document.createElementNS(SVGNS, "defs");
      container.node.appendChild(defs);
    }
    defs.appendChild(this.node);
  }
  url() {
    return "url(#" + this._id + ")";
  }
  toString() {
    return this.url();
  }
  valueOf() {
    return this.url();
  }
  fill() {
    return this.url();
  }
}
class SVGContainer extends SVGElement {
  line(x1, y1, x2, y2) {
    const el = this._make("line");
    if (x1 !== void 0) {
      el.attr({ x1, y1, x2, y2 });
    }
    return el;
  }
  rect(w, h) {
    const el = this._make("rect");
    if (w !== void 0) {
      el.attr({ width: w, height: h });
    }
    return el;
  }
  circle(d) {
    const el = this._make("circle");
    if (d !== void 0) {
      el.attr({ r: d / 2, cx: d / 2, cy: d / 2 });
    }
    return el;
  }
  path(d) {
    const el = this._make("path");
    if (d) el.attr("d", d);
    return el;
  }
  polygon(pts) {
    const el = this._make("polygon");
    if (pts) el.attr("points", pts);
    return el;
  }
  group() {
    return this._makeContainer("g");
  }
  defs() {
    return this._makeContainer("defs");
  }
  plain(textContent) {
    const node = document.createElementNS(SVGNS, "text");
    node.textContent = textContent;
    const el = new SVGElement(node);
    this.node.appendChild(node);
    return el;
  }
  text(builder) {
    const node = document.createElementNS(SVGNS, "text");
    const el = new SVGElement(node);
    this.node.appendChild(node);
    if (typeof builder === "function") {
      builder(new TspanBuilder(node));
    }
    return el;
  }
  image(url, callback) {
    const node = document.createElementNS(SVGNS, "image");
    node.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
    const el = new SVGElement(node);
    this.node.appendChild(node);
    if (typeof callback === "function") {
      const img = new Image();
      img.onload = function() {
        el.size(img.width, img.height);
        callback.call(el, { width: img.width, height: img.height });
      };
      img.src = url;
    }
    return el;
  }
  gradient(type, builder) {
    return new SVGGradient(this, type, builder);
  }
  pattern(w, h, builder) {
    return new SVGPattern(this, w, h, builder);
  }
  _make(tag) {
    const node = document.createElementNS(SVGNS, tag);
    this.node.appendChild(node);
    return new SVGElement(node);
  }
  _makeContainer(tag) {
    const node = document.createElementNS(SVGNS, tag);
    this.node.appendChild(node);
    return new SVGContainer(node);
  }
}
class TspanBuilder {
  constructor(textNode) {
    this.textNode = textNode;
  }
  tspan(text) {
    const tspan = document.createElementNS(SVGNS, "tspan");
    tspan.textContent = text;
    this.textNode.appendChild(tspan);
    return new TspanWrapper(tspan, this.textNode);
  }
}
class TspanWrapper {
  constructor(node, textNode) {
    this.node = node;
    this.textNode = textNode;
  }
  newLine() {
    this.node.setAttribute("dy", "1.1em");
    this.node.dataset.newline = "1";
    return this;
  }
}
let filterCounter = 0;
class SVGFilter extends SVGElement {
  constructor() {
    const node = document.createElementNS(SVGNS, "filter");
    super(node);
    this._id = "SvgjsFilter" + ++filterCounter;
    this.attr("id", this._id);
  }
  size(w, h, x, y) {
    return this.attr({ width: w, height: h, x, y });
  }
}
class FilterBuilder {
  constructor(filter) {
    this.filter = filter;
  }
  colorMatrix(attrs) {
    return this._primitive("feColorMatrix", attrs);
  }
  offset(attrs) {
    return this._primitive("feOffset", attrs);
  }
  gaussianBlur(attrs) {
    return this._primitive("feGaussianBlur", attrs);
  }
  flood(attrs) {
    return this._primitive("feFlood", attrs);
  }
  composite(attrs) {
    return this._primitive("feComposite", attrs);
  }
  merge(sources) {
    const m = document.createElementNS(SVGNS, "feMerge");
    sources.forEach((src) => {
      const mn = document.createElementNS(SVGNS, "feMergeNode");
      mn.setAttribute("in", src);
      m.appendChild(mn);
    });
    this.filter.node.appendChild(m);
    return new SVGElement(m);
  }
  _primitive(tag, attrs) {
    const el = document.createElementNS(SVGNS, tag);
    for (const key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
    this.filter.node.appendChild(el);
    return new SVGElement(el);
  }
}
function installFilterMethods(ElementClass) {
  ElementClass.prototype.filterWith = function(fn) {
    const filter = new SVGFilter();
    this._filter = filter;
    let svgRoot = this.node;
    while (svgRoot && svgRoot.nodeName !== "svg") {
      svgRoot = svgRoot.parentNode;
    }
    if (svgRoot) {
      let defs = svgRoot.querySelector("defs");
      if (!defs) {
        defs = document.createElementNS(SVGNS, "defs");
        svgRoot.insertBefore(defs, svgRoot.firstChild);
      }
      defs.appendChild(filter.node);
    }
    fn(new FilterBuilder(filter));
    this.attr("filter", "url(#" + filter._id + ")");
    return this;
  };
  ElementClass.prototype.unfilter = function(all) {
    if (this._filter) {
      this.node.removeAttribute("filter");
      if (all && this._filter.node && this._filter.node.parentNode) {
        this._filter.node.parentNode.removeChild(this._filter.node);
      }
      this._filter = null;
    }
    return this;
  };
  ElementClass.prototype.filterer = function() {
    return this._filter;
  };
}
/*!
 * Path morphing for SVG path animations
 * Based on svg.pathmorphing.js by Ulrich-Matthias Schäfer (MIT License)
 * Refactored to be standalone (no SVG.js dependency)
 */
function parsePath(d) {
  if (!d || typeof d !== "string") return [["M", 0, 0]];
  const commands = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])\s*/g;
  const numRe = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
  let match;
  const letters = [];
  const positions = [];
  while ((match = re.exec(d)) !== null) {
    letters.push(match[1]);
    positions.push(match.index);
  }
  for (let i = 0; i < letters.length; i++) {
    const start = positions[i] + letters[i].length;
    const end = i + 1 < positions.length ? positions[i + 1] : d.length;
    const paramStr = d.substring(start, end);
    const nums = [];
    let numMatch;
    numRe.lastIndex = 0;
    while ((numMatch = numRe.exec(paramStr)) !== null) {
      nums.push(parseFloat(numMatch[0]));
    }
    const cmd = letters[i].toUpperCase();
    if (cmd === "Z") {
      commands.push(["Z"]);
    } else if (cmd === "M" || cmd === "L" || cmd === "T") {
      for (let j2 = 0; j2 < nums.length; j2 += 2) {
        commands.push([cmd, nums[j2], nums[j2 + 1]]);
      }
    } else if (cmd === "H") {
      for (let j2 = 0; j2 < nums.length; j2++) {
        commands.push([cmd, nums[j2]]);
      }
    } else if (cmd === "V") {
      for (let j2 = 0; j2 < nums.length; j2++) {
        commands.push([cmd, nums[j2]]);
      }
    } else if (cmd === "C") {
      for (let j2 = 0; j2 < nums.length; j2 += 6) {
        commands.push([
          cmd,
          nums[j2],
          nums[j2 + 1],
          nums[j2 + 2],
          nums[j2 + 3],
          nums[j2 + 4],
          nums[j2 + 5]
        ]);
      }
    } else if (cmd === "S" || cmd === "Q") {
      for (let j2 = 0; j2 < nums.length; j2 += 4) {
        commands.push([cmd, nums[j2], nums[j2 + 1], nums[j2 + 2], nums[j2 + 3]]);
      }
    } else if (cmd === "A") {
      for (let j2 = 0; j2 < nums.length; j2 += 7) {
        commands.push([
          cmd,
          nums[j2],
          nums[j2 + 1],
          nums[j2 + 2],
          nums[j2 + 3],
          nums[j2 + 4],
          nums[j2 + 5],
          nums[j2 + 6]
        ]);
      }
    }
  }
  if (commands.length === 0) {
    commands.push(["M", 0, 0]);
  }
  return commands;
}
function pathBbox(arr) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  arr.forEach((cmd) => {
    for (let i = 1; i < cmd.length; i += 2) {
      if (i + 1 <= cmd.length) {
        const x = cmd[i];
        const y = cmd[i + 1];
        if (typeof x === "number" && typeof y === "number") {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  });
  if (minX === Infinity) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function arrayToPath(arr) {
  return arr.map((cmd) => cmd.join(" ")).join(" ");
}
function simplify(val) {
  switch (val[0]) {
    case "z":
    case "Z":
      val[0] = "L";
      val[1] = this.start[0];
      val[2] = this.start[1];
      break;
    case "H":
      val[0] = "L";
      val[2] = this.pos[1];
      break;
    case "V":
      val[0] = "L";
      val[2] = val[1];
      val[1] = this.pos[0];
      break;
    case "T":
      val[0] = "Q";
      val[3] = val[1];
      val[4] = val[2];
      val[1] = this.reflection[1];
      val[2] = this.reflection[0];
      break;
    case "S":
      val[0] = "C";
      val[6] = val[4];
      val[5] = val[3];
      val[4] = val[2];
      val[3] = val[1];
      val[2] = this.reflection[1];
      val[1] = this.reflection[0];
      break;
  }
  return val;
}
function setPosAndReflection(val) {
  var len = val.length;
  this.pos = [val[len - 2], val[len - 1]];
  if ("SCQT".indexOf(val[0]) != -1) {
    this.reflection = [
      2 * this.pos[0] - val[len - 4],
      2 * this.pos[1] - val[len - 3]
    ];
  }
  return val;
}
function toBezier(val) {
  var retVal = [val];
  switch (val[0]) {
    case "M":
      this.pos = this.start = [val[1], val[2]];
      return retVal;
    case "L":
      val[5] = val[3] = val[1];
      val[6] = val[4] = val[2];
      val[1] = this.pos[0];
      val[2] = this.pos[1];
      break;
    case "Q":
      val[6] = val[4];
      val[5] = val[3];
      val[4] = val[4] * 1 / 3 + val[2] * 2 / 3;
      val[3] = val[3] * 1 / 3 + val[1] * 2 / 3;
      val[2] = this.pos[1] * 1 / 3 + val[2] * 2 / 3;
      val[1] = this.pos[0] * 1 / 3 + val[1] * 2 / 3;
      break;
    case "A":
      retVal = arcToBezier(this.pos, val);
      val = retVal[0];
      break;
  }
  val[0] = "C";
  this.pos = [val[5], val[6]];
  this.reflection = [2 * val[5] - val[3], 2 * val[6] - val[4]];
  return retVal;
}
function findNextM(arr, offset) {
  if (offset === false) return false;
  for (var i = offset, len = arr.length; i < len; ++i) {
    if (arr[i][0] == "M") return i;
  }
  return false;
}
function arcToBezier(pos, val) {
  var rx = Math.abs(val[1]), ry = Math.abs(val[2]), xAxisRotation = val[3] % 360, largeArcFlag = val[4], sweepFlag = val[5], x = val[6], y = val[7], A = new Point(pos[0], pos[1]), B = new Point(x, y), primedCoord, lambda, mat, k, c, cSquare, t, O, OA, OB, tetaStart, tetaEnd, deltaTeta, nbSectors, f, arcSegPoints, angle, sinAngle, cosAngle, pt, i, il, retVal = [], x1, y1, x2, y2;
  if (rx === 0 || ry === 0 || A.x === B.x && A.y === B.y) {
    return [["C", A.x, A.y, B.x, B.y, B.x, B.y]];
  }
  primedCoord = new Point((A.x - B.x) / 2, (A.y - B.y) / 2).transform(
    new Matrix().rotate(xAxisRotation)
  );
  lambda = primedCoord.x * primedCoord.x / (rx * rx) + primedCoord.y * primedCoord.y / (ry * ry);
  if (lambda > 1) {
    lambda = Math.sqrt(lambda);
    rx = lambda * rx;
    ry = lambda * ry;
  }
  mat = new Matrix().rotate(xAxisRotation).scale(1 / rx, 1 / ry).rotate(-xAxisRotation);
  A = A.transform(mat);
  B = B.transform(mat);
  k = [B.x - A.x, B.y - A.y];
  cSquare = k[0] * k[0] + k[1] * k[1];
  c = Math.sqrt(cSquare);
  k[0] /= c;
  k[1] /= c;
  t = cSquare < 4 ? Math.sqrt(1 - cSquare / 4) : 0;
  if (largeArcFlag === sweepFlag) {
    t *= -1;
  }
  O = new Point(
    (B.x + A.x) / 2 + t * -k[1],
    (B.y + A.y) / 2 + t * k[0]
  );
  OA = new Point(A.x - O.x, A.y - O.y);
  OB = new Point(B.x - O.x, B.y - O.y);
  tetaStart = Math.acos(OA.x / Math.sqrt(OA.x * OA.x + OA.y * OA.y));
  if (OA.y < 0) tetaStart *= -1;
  tetaEnd = Math.acos(OB.x / Math.sqrt(OB.x * OB.x + OB.y * OB.y));
  if (OB.y < 0) tetaEnd *= -1;
  if (sweepFlag && tetaStart > tetaEnd) {
    tetaEnd += 2 * Math.PI;
  }
  if (!sweepFlag && tetaStart < tetaEnd) {
    tetaEnd -= 2 * Math.PI;
  }
  nbSectors = Math.ceil(Math.abs(tetaStart - tetaEnd) * 2 / Math.PI);
  arcSegPoints = [];
  angle = tetaStart;
  deltaTeta = (tetaEnd - tetaStart) / nbSectors;
  f = 4 * Math.tan(deltaTeta / 4) / 3;
  for (i = 0; i <= nbSectors; i++) {
    cosAngle = Math.cos(angle);
    sinAngle = Math.sin(angle);
    pt = new Point(O.x + cosAngle, O.y + sinAngle);
    arcSegPoints[i] = [
      new Point(pt.x + f * sinAngle, pt.y - f * cosAngle),
      pt,
      new Point(pt.x - f * sinAngle, pt.y + f * cosAngle)
    ];
    angle += deltaTeta;
  }
  arcSegPoints[0][0] = arcSegPoints[0][1].clone();
  arcSegPoints[arcSegPoints.length - 1][2] = arcSegPoints[arcSegPoints.length - 1][1].clone();
  mat = new Matrix().rotate(xAxisRotation).scale(rx, ry).rotate(-xAxisRotation);
  for (i = 0, il = arcSegPoints.length; i < il; i++) {
    arcSegPoints[i][0] = arcSegPoints[i][0].transform(mat);
    arcSegPoints[i][1] = arcSegPoints[i][1].transform(mat);
    arcSegPoints[i][2] = arcSegPoints[i][2].transform(mat);
  }
  for (i = 1, il = arcSegPoints.length; i < il; i++) {
    pt = arcSegPoints[i - 1][2];
    x1 = pt.x;
    y1 = pt.y;
    pt = arcSegPoints[i][0];
    x2 = pt.x;
    y2 = pt.y;
    pt = arcSegPoints[i][1];
    x = pt.x;
    y = pt.y;
    retVal.push(["C", x1, y1, x2, y2, x, y]);
  }
  return retVal;
}
function handleBlock(startArr, startOffsetM, startOffsetNextM, destArr, destOffsetM, destOffsetNextM) {
  var startArrTemp = startArr.slice(
    startOffsetM,
    startOffsetNextM || void 0
  );
  var destArrTemp = destArr.slice(destOffsetM, destOffsetNextM || void 0);
  var i = 0, posStart = { pos: [0, 0], start: [0, 0] }, posDest = { pos: [0, 0], start: [0, 0] };
  do {
    startArrTemp[i] = simplify.call(posStart, startArrTemp[i]);
    destArrTemp[i] = simplify.call(posDest, destArrTemp[i]);
    if (startArrTemp[i][0] != destArrTemp[i][0] || startArrTemp[i][0] == "M" || startArrTemp[i][0] == "A" && (startArrTemp[i][4] != destArrTemp[i][4] || startArrTemp[i][5] != destArrTemp[i][5])) {
      Array.prototype.splice.apply(
        startArrTemp,
        [i, 1].concat(toBezier.call(posStart, startArrTemp[i]))
      );
      Array.prototype.splice.apply(
        destArrTemp,
        [i, 1].concat(toBezier.call(posDest, destArrTemp[i]))
      );
    } else {
      startArrTemp[i] = setPosAndReflection.call(posStart, startArrTemp[i]);
      destArrTemp[i] = setPosAndReflection.call(posDest, destArrTemp[i]);
    }
    if (++i == startArrTemp.length && i == destArrTemp.length) break;
    if (i == startArrTemp.length) {
      startArrTemp.push([
        "C",
        posStart.pos[0],
        posStart.pos[1],
        posStart.pos[0],
        posStart.pos[1],
        posStart.pos[0],
        posStart.pos[1]
      ]);
    }
    if (i == destArrTemp.length) {
      destArrTemp.push([
        "C",
        posDest.pos[0],
        posDest.pos[1],
        posDest.pos[0],
        posDest.pos[1],
        posDest.pos[0],
        posDest.pos[1]
      ]);
    }
  } while (true);
  return { start: startArrTemp, dest: destArrTemp };
}
function synchronizePaths(fromD, toD) {
  var startArr = parsePath(fromD);
  var destArr = parsePath(toD);
  var startOffsetM = 0, destOffsetM = 0;
  var startOffsetNextM = false, destOffsetNextM = false;
  var result;
  while (true) {
    if (startOffsetM === false && destOffsetM === false) break;
    startOffsetNextM = findNextM(
      startArr,
      startOffsetM === false ? false : startOffsetM + 1
    );
    destOffsetNextM = findNextM(
      destArr,
      destOffsetM === false ? false : destOffsetM + 1
    );
    if (startOffsetM === false) {
      var bbox = pathBbox(result.start);
      if (bbox.height == 0 || bbox.width == 0) {
        startOffsetM = startArr.push(startArr[0]) - 1;
      } else {
        startOffsetM = startArr.push([
          "M",
          bbox.x + bbox.width / 2,
          bbox.y + bbox.height / 2
        ]) - 1;
      }
    }
    if (destOffsetM === false) {
      var bbox = pathBbox(result.dest);
      if (bbox.height == 0 || bbox.width == 0) {
        destOffsetM = destArr.push(destArr[0]) - 1;
      } else {
        destOffsetM = destArr.push([
          "M",
          bbox.x + bbox.width / 2,
          bbox.y + bbox.height / 2
        ]) - 1;
      }
    }
    result = handleBlock(
      startArr,
      startOffsetM,
      startOffsetNextM,
      destArr,
      destOffsetM,
      destOffsetNextM
    );
    startArr = startArr.slice(0, startOffsetM).concat(
      result.start,
      startOffsetNextM === false ? [] : startArr.slice(startOffsetNextM)
    );
    destArr = destArr.slice(0, destOffsetM).concat(
      result.dest,
      destOffsetNextM === false ? [] : destArr.slice(destOffsetNextM)
    );
    startOffsetM = startOffsetNextM === false ? false : startOffsetM + result.start.length;
    destOffsetM = destOffsetNextM === false ? false : destOffsetM + result.dest.length;
  }
  return { start: startArr, dest: destArr };
}
function morphPaths(fromD, toD) {
  var synced = synchronizePaths(fromD, toD);
  var startArr = synced.start;
  var destArr = synced.dest;
  return function(pos) {
    var result = startArr.map(function(from, idx) {
      return destArr[idx].map(function(to, toIdx) {
        if (toIdx === 0) return to;
        return from[toIdx] + (destArr[idx][toIdx] - from[toIdx]) * pos;
      });
    });
    return arrayToPath(result);
  };
}
function easeInOut(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5;
}
function parseColor(str) {
  if (!str || typeof str !== "string") return null;
  if (str[0] === "#") {
    let hex = str.slice(1);
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const n = parseInt(hex, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255, 1];
  }
  const m = str.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
  );
  if (m) return [+m[1], +m[2], +m[3], m[4] !== void 0 ? +m[4] : 1];
  return null;
}
function interpolateColor(from, to, pos) {
  return `rgba(${Math.round(from[0] + (to[0] - from[0]) * pos)},${Math.round(from[1] + (to[1] - from[1]) * pos)},${Math.round(from[2] + (to[2] - from[2]) * pos)},${from[3] + (to[3] - from[3]) * pos})`;
}
class SVGAnimationRunner {
  constructor(element, duration, delay) {
    this.el = element;
    this.duration = duration != null ? duration : 300;
    this.delay = delay || 0;
    this._attrTarget = null;
    this._plotTarget = null;
    this._afterCb = null;
    this._duringCb = null;
    this._next = null;
    this._root = null;
    this._scheduled = false;
  }
  attr(to) {
    this._attrTarget = to;
    this._schedule();
    return this;
  }
  plot(d) {
    this._plotTarget = d;
    this._schedule();
    return this;
  }
  after(fn) {
    this._afterCb = fn;
    this._schedule();
    return this;
  }
  during(fn) {
    this._duringCb = fn;
    this._schedule();
    return this;
  }
  animate(duration, delay) {
    const next = new SVGAnimationRunner(this.el, duration, delay);
    this._next = next;
    next._root = this._root || this;
    return next;
  }
  _schedule() {
    const root = this._root || this;
    if (!root._scheduled) {
      root._scheduled = true;
      queueMicrotask(() => root._executeChain());
    }
  }
  _executeChain() {
    const chain = [];
    let r = this;
    while (r) {
      chain.push(r);
      r = r._next;
    }
    let cumulativeDelay = 0;
    chain.forEach((runner) => {
      cumulativeDelay += runner.delay;
      runner._execute(cumulativeDelay);
      cumulativeDelay += runner.duration;
    });
  }
  _execute(startDelay) {
    const el = this.el;
    const duration = this.duration;
    if (duration <= 1) {
      const apply = () => {
        if (this._attrTarget) el.attr(this._attrTarget);
        if (this._plotTarget) el.plot(this._plotTarget);
        if (this._afterCb) this._afterCb.call(el);
      };
      if (startDelay > 0) {
        setTimeout(apply, startDelay);
      } else {
        apply();
      }
      return;
    }
    const run = () => {
      const fromAttrs = {};
      const fromColors = {};
      const toColors = {};
      if (this._attrTarget) {
        for (const key of Object.keys(this._attrTarget)) {
          const fromVal = el.attr(key);
          fromAttrs[key] = fromVal;
          const fc = parseColor(fromVal);
          const tc = parseColor(String(this._attrTarget[key]));
          if (fc && tc) {
            fromColors[key] = fc;
            toColors[key] = tc;
          }
        }
      }
      let morphFn = null;
      if (this._plotTarget) {
        const fromPath = el.attr("d") || "";
        try {
          morphFn = morphPaths(fromPath, this._plotTarget);
        } catch (e) {
          morphFn = null;
        }
      }
      const start = performance.now();
      const tick = (now) => {
        const elapsed = now - start;
        const rawPos = Math.min(elapsed / duration, 1);
        const pos = easeInOut(rawPos);
        if (this._attrTarget) {
          if (rawPos >= 1) {
            el.attr(this._attrTarget);
          } else {
            const current = {};
            for (const key of Object.keys(this._attrTarget)) {
              if (fromColors[key] && toColors[key]) {
                current[key] = interpolateColor(
                  fromColors[key],
                  toColors[key],
                  pos
                );
              } else {
                const from = parseFloat(fromAttrs[key]);
                const to = parseFloat(this._attrTarget[key]);
                if (!isNaN(from) && !isNaN(to)) {
                  current[key] = from + (to - from) * pos;
                }
              }
            }
            el.attr(current);
          }
        }
        if (morphFn && rawPos < 1) {
          el.attr("d", morphFn(pos));
        }
        if (this._duringCb) this._duringCb(pos);
        if (rawPos < 1) {
          requestAnimationFrame(tick);
        } else {
          if (this._plotTarget) {
            el.attr("d", this._plotTarget);
          }
          if (this._afterCb) this._afterCb.call(el);
        }
      };
      requestAnimationFrame(tick);
    };
    if (startDelay > 0) {
      setTimeout(run, startDelay);
    } else {
      run();
    }
  }
}
function installAnimationMethods(ElementClass) {
  ElementClass.prototype.animate = function(duration, delay) {
    return new SVGAnimationRunner(this, duration, delay);
  };
}
function installDraggable(ElementClass) {
  ElementClass.prototype.draggable = function(opts) {
    if (opts === false) {
      if (this._dragCleanup) {
        this._dragCleanup();
        this._dragCleanup = null;
      }
      return this;
    }
    const el = this;
    const constraints = opts || {};
    const onPointerDown = (e) => {
      if (e.button && e.button !== 0) return;
      e.stopPropagation();
      const isTouch = e.type === "touchstart";
      const ev = isTouch ? e.touches[0] : e;
      const svgEl = el.node;
      const startAttrX = parseFloat(svgEl.getAttribute("x")) || 0;
      const startAttrY = parseFloat(svgEl.getAttribute("y")) || 0;
      const startClientX = ev.clientX;
      const startClientY = ev.clientY;
      const svgRoot = svgEl.ownerSVGElement;
      let ctm = null;
      if (svgRoot) {
        ctm = svgRoot.getScreenCTM();
      }
      const onMove = (me) => {
        const mev = me.type === "touchmove" ? me.touches[0] : me;
        let dx = mev.clientX - startClientX;
        let dy = mev.clientY - startClientY;
        if (ctm) {
          dx = dx / ctm.a;
          dy = dy / ctm.d;
        }
        let newX = startAttrX + dx;
        let newY = startAttrY + dy;
        const w = parseFloat(svgEl.getAttribute("width")) || 0;
        const h = parseFloat(svgEl.getAttribute("height")) || 0;
        if (constraints.minX !== void 0 && newX < constraints.minX)
          newX = constraints.minX;
        if (constraints.minY !== void 0 && newY < constraints.minY)
          newY = constraints.minY;
        if (constraints.maxX !== void 0 && newX + w > constraints.maxX)
          newX = constraints.maxX - w;
        if (constraints.maxY !== void 0 && newY + h > constraints.maxY)
          newY = constraints.maxY - h;
        const box = {
          x: newX,
          y: newY,
          w,
          h,
          x2: newX + w,
          y2: newY + h
        };
        const event = new CustomEvent("dragmove", {
          detail: {
            handler: {
              move: function(x, y) {
                svgEl.setAttribute("x", x);
                svgEl.setAttribute("y", y);
              }
            },
            box
          }
        });
        svgEl.dispatchEvent(event);
      };
      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("mouseup", onUp);
        document.removeEventListener("touchend", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("touchmove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchend", onUp);
    };
    el.node.addEventListener("mousedown", onPointerDown);
    el.node.addEventListener("touchstart", onPointerDown);
    el._dragCleanup = () => {
      el.node.removeEventListener("mousedown", onPointerDown);
      el.node.removeEventListener("touchstart", onPointerDown);
    };
    return el;
  };
}
function installSelectable(ElementClass) {
  ElementClass.prototype.select = function(opts) {
    if (opts === false) {
      if (this._selectCleanup) {
        this._selectCleanup();
        this._selectCleanup = null;
      }
      return this;
    }
    const el = this;
    const { createHandle, updateHandle } = opts;
    const handleGroup = document.createElementNS(SVGNS, "g");
    handleGroup.setAttribute("class", "svg_select_points");
    const parent = el.node.parentNode;
    if (parent) {
      parent.appendChild(handleGroup);
    }
    new SVGContainer(handleGroup);
    const handles = {};
    const handleNames = ["t", "b", "l", "r", "lt", "rt", "lb", "rb"];
    handleNames.forEach((name2, index) => {
      const subGroup = new SVGContainer(
        document.createElementNS(SVGNS, "g")
      );
      handleGroup.appendChild(subGroup.node);
      const handle = createHandle(subGroup, [0, 0], index, [], name2);
      handles[name2] = { group: subGroup, handle };
    });
    const updatePositions = () => {
      const x = parseFloat(el.attr("x")) || 0;
      const y = parseFloat(el.attr("y")) || 0;
      const w = parseFloat(el.attr("width")) || 0;
      const h = parseFloat(el.attr("height")) || 0;
      const elTransform = el.node.getAttribute("transform");
      if (elTransform) {
        handleGroup.setAttribute("transform", elTransform);
      } else {
        handleGroup.removeAttribute("transform");
      }
      const positions = {
        t: [x + w / 2, y],
        b: [x + w / 2, y + h],
        l: [x, y + h / 2],
        r: [x + w, y + h / 2],
        lt: [x, y],
        rt: [x + w, y],
        lb: [x, y + h],
        rb: [x + w, y + h]
      };
      handleNames.forEach((name2) => {
        if (handles[name2] && positions[name2]) {
          updateHandle(handles[name2].group, positions[name2]);
        }
      });
    };
    updatePositions();
    el._selectHandles = handleGroup;
    el._selectHandlesMap = handles;
    el._updateSelectPositions = updatePositions;
    el._selectCleanup = () => {
      if (handleGroup.parentNode) {
        handleGroup.parentNode.removeChild(handleGroup);
      }
      el._selectHandles = null;
      el._selectHandlesMap = null;
      el._updateSelectPositions = null;
    };
    return el;
  };
  ElementClass.prototype.resize = function(enable) {
    if (enable === false) {
      if (this._resizeCleanup) {
        this._resizeCleanup();
        this._resizeCleanup = null;
      }
      return this;
    }
    const el = this;
    const handles = el._selectHandlesMap;
    if (!handles) return el;
    const cleanupFns = [];
    const makeHandleDraggable = (name2) => {
      const handleInfo = handles[name2];
      if (!handleInfo || !handleInfo.group || !handleInfo.group.node)
        return;
      const handleNode = handleInfo.group.node;
      const onPointerDown = (e) => {
        if (e.button && e.button !== 0) return;
        e.stopPropagation();
        const isTouch = e.type === "touchstart";
        const ev = isTouch ? e.touches[0] : e;
        const startClientX = ev.clientX;
        const svgRoot = el.node.ownerSVGElement;
        let ctm = null;
        if (svgRoot) {
          ctm = svgRoot.getScreenCTM();
        }
        const startX = parseFloat(el.attr("x")) || 0;
        const startW = parseFloat(el.attr("width")) || 0;
        const onMove = (me) => {
          const mev = me.type === "touchmove" ? me.touches[0] : me;
          let dx = mev.clientX - startClientX;
          if (ctm) dx = dx / ctm.a;
          let newX = startX;
          let newW = startW;
          if (name2 === "l") {
            newX = startX + dx;
            newW = startW - dx;
          } else if (name2 === "r") {
            newW = startW + dx;
          }
          if (newW < 0) {
            newW = 0;
          }
          el.attr({ x: newX, width: newW });
          if (el._updateSelectPositions) {
            el._updateSelectPositions();
          }
          const event = new CustomEvent("resize", {
            detail: { el }
          });
          el.node.dispatchEvent(event);
        };
        const onUp = () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("mouseup", onUp);
          document.removeEventListener("touchend", onUp);
          const event = new CustomEvent("resize", {
            detail: { el }
          });
          el.node.dispatchEvent(event);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("touchmove", onMove);
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchend", onUp);
      };
      handleNode.addEventListener("mousedown", onPointerDown);
      handleNode.addEventListener("touchstart", onPointerDown);
      cleanupFns.push(() => {
        handleNode.removeEventListener("mousedown", onPointerDown);
        handleNode.removeEventListener("touchstart", onPointerDown);
      });
    };
    makeHandleDraggable("l");
    makeHandleDraggable("r");
    el._resizeCleanup = () => {
      cleanupFns.forEach((fn) => fn());
    };
    return el;
  };
}
installFilterMethods(SVGElement);
installAnimationMethods(SVGElement);
installDraggable(SVGElement);
installSelectable(SVGElement);
function SVG() {
  const svg = new SVGContainer(document.createElementNS(SVGNS, "svg"));
  svg.attr({ xmlns: SVGNS });
  return svg;
}
SVG.xlink = "http://www.w3.org/1999/xlink";
class ZoomPanSelection extends Toolbar {
  constructor(ctx) {
    super(ctx);
    this.ctx = ctx;
    this.w = ctx.w;
    this.dragged = false;
    this.graphics = new Graphics(this.ctx);
    this.eventList = [
      "mousedown",
      "mouseleave",
      "mousemove",
      "touchstart",
      "touchmove",
      "mouseup",
      "touchend",
      "wheel"
    ];
    this.clientX = 0;
    this.clientY = 0;
    this.startX = 0;
    this.endX = 0;
    this.dragX = 0;
    this.startY = 0;
    this.endY = 0;
    this.dragY = 0;
    this.moveDirection = "none";
    this.debounceTimer = null;
    this.debounceDelay = 100;
    this.wheelDelay = 400;
  }
  init({ xyRatios }) {
    let w = this.w;
    let me = this;
    this.xyRatios = xyRatios;
    this.zoomRect = this.graphics.drawRect(0, 0, 0, 0);
    this.selectionRect = this.graphics.drawRect(0, 0, 0, 0);
    this.gridRect = w.globals.dom.baseEl.querySelector(".apexcharts-grid");
    this.constraints = new Box(0, 0, w.globals.gridWidth, w.globals.gridHeight);
    this.zoomRect.node.classList.add("apexcharts-zoom-rect");
    this.selectionRect.node.classList.add("apexcharts-selection-rect");
    w.globals.dom.Paper.add(this.zoomRect);
    w.globals.dom.Paper.add(this.selectionRect);
    if (w.config.chart.selection.type === "x") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        minY: 0,
        maxX: w.globals.gridWidth,
        maxY: w.globals.gridHeight
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else if (w.config.chart.selection.type === "y") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        maxX: w.globals.gridWidth
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else {
      this.slDraggableRect = this.selectionRect.draggable().on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    }
    this.preselectedSelection();
    this.hoverArea = w.globals.dom.baseEl.querySelector(
      `${w.globals.chartClass} .apexcharts-svg`
    );
    this.hoverArea.classList.add("apexcharts-zoomable");
    this.eventList.forEach((event) => {
      this.hoverArea.addEventListener(
        event,
        me.svgMouseEvents.bind(me, xyRatios),
        {
          capture: false,
          passive: true
        }
      );
    });
    if (w.config.chart.zoom.enabled && w.config.chart.zoom.allowMouseWheelZoom) {
      this.hoverArea.addEventListener("wheel", me.mouseWheelEvent.bind(me), {
        capture: false,
        passive: false
      });
    }
  }
  // remove the event listeners which were previously added on hover area
  destroy() {
    if (this.slDraggableRect) {
      this.slDraggableRect.draggable(false);
      this.slDraggableRect.off();
      this.selectionRect.off();
    }
    this.selectionRect = null;
    this.zoomRect = null;
    this.gridRect = null;
  }
  svgMouseEvents(xyRatios, e) {
    let w = this.w;
    const toolbar = this.ctx.toolbar;
    let zoomtype = w.globals.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
    const autoSelected = w.config.chart.toolbar.autoSelected;
    if (e.shiftKey) {
      this.shiftWasPressed = true;
      toolbar.enableZoomPanFromToolbar(autoSelected === "pan" ? "zoom" : "pan");
    } else {
      if (this.shiftWasPressed) {
        toolbar.enableZoomPanFromToolbar(autoSelected);
        this.shiftWasPressed = false;
      }
    }
    if (!e.target) return;
    const tc = e.target.classList;
    let pc;
    if (e.target.parentNode && e.target.parentNode !== null) {
      pc = e.target.parentNode.classList;
    }
    const falsePositives = tc.contains("apexcharts-legend-marker") || tc.contains("apexcharts-legend-text") || pc && pc.contains("apexcharts-toolbar");
    if (falsePositives) return;
    this.clientX = e.type === "touchmove" || e.type === "touchstart" ? e.touches[0].clientX : e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
    this.clientY = e.type === "touchmove" || e.type === "touchstart" ? e.touches[0].clientY : e.type === "touchend" ? e.changedTouches[0].clientY : e.clientY;
    if (e.type === "mousedown" && e.which === 1 || e.type === "touchstart") {
      let gridRectDim = this.gridRect.getBoundingClientRect();
      this.startX = this.clientX - gridRectDim.left - w.globals.barPadForNumericAxis;
      this.startY = this.clientY - gridRectDim.top;
      this.dragged = false;
      this.w.globals.mousedown = true;
    }
    if (e.type === "mousemove" && e.which === 1 || e.type === "touchmove") {
      this.dragged = true;
      if (w.globals.panEnabled) {
        w.globals.selection = null;
        if (this.w.globals.mousedown) {
          this.panDragging({
            context: this,
            zoomtype,
            xyRatios
          });
        }
      } else {
        if (this.w.globals.mousedown && w.globals.zoomEnabled || this.w.globals.mousedown && w.globals.selectionEnabled) {
          this.selection = this.selectionDrawing({
            context: this,
            zoomtype
          });
        }
      }
    }
    if (e.type === "mouseup" || e.type === "touchend" || e.type === "mouseleave") {
      this.handleMouseUp({ zoomtype });
    }
    this.makeSelectionRectDraggable();
  }
  handleMouseUp({ zoomtype, isResized }) {
    var _a;
    const w = this.w;
    let gridRectDim = (_a = this.gridRect) == null ? void 0 : _a.getBoundingClientRect();
    if (gridRectDim && (this.w.globals.mousedown || isResized)) {
      this.endX = this.clientX - gridRectDim.left - w.globals.barPadForNumericAxis;
      this.endY = this.clientY - gridRectDim.top;
      this.dragX = Math.abs(this.endX - this.startX);
      this.dragY = Math.abs(this.endY - this.startY);
      if (w.globals.zoomEnabled || w.globals.selectionEnabled) {
        this.selectionDrawn({
          context: this,
          zoomtype
        });
      }
    }
    if (w.globals.zoomEnabled) {
      this.hideSelectionRect(this.selectionRect);
    }
    this.dragged = false;
    this.w.globals.mousedown = false;
  }
  mouseWheelEvent(e) {
    const w = this.w;
    e.preventDefault();
    const now = Date.now();
    if (now - w.globals.lastWheelExecution > this.wheelDelay) {
      this.executeMouseWheelZoom(e);
      w.globals.lastWheelExecution = now;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (now - w.globals.lastWheelExecution > this.wheelDelay) {
        this.executeMouseWheelZoom(e);
        w.globals.lastWheelExecution = now;
      }
    }, this.debounceDelay);
  }
  executeMouseWheelZoom(e) {
    var _a;
    const w = this.w;
    this.minX = w.globals.isRangeBar ? w.globals.minY : w.globals.minX;
    this.maxX = w.globals.isRangeBar ? w.globals.maxY : w.globals.maxX;
    const gridRectDim = (_a = this.gridRect) == null ? void 0 : _a.getBoundingClientRect();
    if (!gridRectDim) return;
    const mouseX = (e.clientX - gridRectDim.left) / gridRectDim.width;
    const currentMinX = this.minX;
    const currentMaxX = this.maxX;
    const totalX = currentMaxX - currentMinX;
    const zoomFactorIn = 0.5;
    const zoomFactorOut = 1.5;
    let zoomRange;
    let newMinX, newMaxX;
    if (e.deltaY < 0) {
      zoomRange = zoomFactorIn * totalX;
      const midPoint = currentMinX + mouseX * totalX;
      newMinX = midPoint - zoomRange / 2;
      newMaxX = midPoint + zoomRange / 2;
    } else {
      zoomRange = zoomFactorOut * totalX;
      newMinX = currentMinX - zoomRange / 2;
      newMaxX = currentMaxX + zoomRange / 2;
    }
    if (!w.globals.isRangeBar) {
      newMinX = Math.max(newMinX, w.globals.initialMinX);
      newMaxX = Math.min(newMaxX, w.globals.initialMaxX);
      const minRange = (w.globals.initialMaxX - w.globals.initialMinX) * 0.01;
      if (newMaxX - newMinX < minRange) {
        const midPoint = (newMinX + newMaxX) / 2;
        newMinX = midPoint - minRange / 2;
        newMaxX = midPoint + minRange / 2;
      }
    }
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!isNaN(newMinXMaxX.minX) && !isNaN(newMinXMaxX.maxX)) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  makeSelectionRectDraggable() {
    const w = this.w;
    if (!this.selectionRect) return;
    const rectDim = this.selectionRect.node.getBoundingClientRect();
    if (rectDim.width > 0 && rectDim.height > 0) {
      this.selectionRect.select(false).resize(false);
      this.selectionRect.select({
        createRot: () => {
        },
        updateRot: () => {
        },
        createHandle: (group, p, index, pointArr, handleName) => {
          if (handleName === "l" || handleName === "r")
            return group.circle(8).css({ "stroke-width": 1, stroke: "#333", fill: "#fff" });
          return group.circle(0);
        },
        updateHandle: (group, p) => {
          return group.center(p[0], p[1]);
        }
      }).resize().on("resize", () => {
        let zoomtype = w.globals.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
        this.handleMouseUp({ zoomtype, isResized: true });
      });
    }
  }
  preselectedSelection() {
    const w = this.w;
    const xyRatios = this.xyRatios;
    if (!w.globals.zoomEnabled) {
      if (typeof w.globals.selection !== "undefined" && w.globals.selection !== null) {
        this.drawSelectionRect(__spreadProps(__spreadValues({}, w.globals.selection), {
          translateX: w.globals.translateX,
          translateY: w.globals.translateY
        }));
      } else {
        if (w.config.chart.selection.xaxis.min !== void 0 && w.config.chart.selection.xaxis.max !== void 0) {
          let x = (w.config.chart.selection.xaxis.min - w.globals.minX) / xyRatios.xRatio;
          let width = w.globals.gridWidth - (w.globals.maxX - w.config.chart.selection.xaxis.max) / xyRatios.xRatio - x;
          if (w.globals.isRangeBar) {
            x = (w.config.chart.selection.xaxis.min - w.globals.yAxisScale[0].niceMin) / xyRatios.invertedYRatio;
            width = (w.config.chart.selection.xaxis.max - w.config.chart.selection.xaxis.min) / xyRatios.invertedYRatio;
          }
          let selectionRect = {
            x,
            y: 0,
            width,
            height: w.globals.gridHeight,
            translateX: w.globals.translateX,
            translateY: w.globals.translateY,
            selectionEnabled: true
          };
          this.drawSelectionRect(selectionRect);
          this.makeSelectionRectDraggable();
          if (typeof w.config.chart.events.selection === "function") {
            w.config.chart.events.selection(this.ctx, {
              xaxis: {
                min: w.config.chart.selection.xaxis.min,
                max: w.config.chart.selection.xaxis.max
              },
              yaxis: {}
            });
          }
        }
      }
    }
  }
  drawSelectionRect({ x, y, width, height, translateX = 0, translateY = 0 }) {
    const w = this.w;
    const zoomRect = this.zoomRect;
    const selectionRect = this.selectionRect;
    if (this.dragged || w.globals.selection !== null) {
      let scalingAttrs = {
        transform: "translate(" + translateX + ", " + translateY + ")"
      };
      if (w.globals.zoomEnabled && this.dragged) {
        if (width < 0) width = 1;
        zoomRect.attr({
          x,
          y,
          width,
          height,
          fill: w.config.chart.zoom.zoomedArea.fill.color,
          "fill-opacity": w.config.chart.zoom.zoomedArea.fill.opacity,
          stroke: w.config.chart.zoom.zoomedArea.stroke.color,
          "stroke-width": w.config.chart.zoom.zoomedArea.stroke.width,
          "stroke-opacity": w.config.chart.zoom.zoomedArea.stroke.opacity
        });
        Graphics.setAttrs(zoomRect.node, scalingAttrs);
      }
      if (w.globals.selectionEnabled) {
        selectionRect.attr({
          x,
          y,
          width: width > 0 ? width : 0,
          height: height > 0 ? height : 0,
          fill: w.config.chart.selection.fill.color,
          "fill-opacity": w.config.chart.selection.fill.opacity,
          stroke: w.config.chart.selection.stroke.color,
          "stroke-width": w.config.chart.selection.stroke.width,
          "stroke-dasharray": w.config.chart.selection.stroke.dashArray,
          "stroke-opacity": w.config.chart.selection.stroke.opacity
        });
        Graphics.setAttrs(selectionRect.node, scalingAttrs);
      }
    }
  }
  hideSelectionRect(rect) {
    if (rect) {
      rect.attr({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    }
  }
  selectionDrawing({ context, zoomtype }) {
    const w = this.w;
    let me = context;
    let gridRectDim = this.gridRect.getBoundingClientRect();
    let startX = me.startX - 1;
    let startY = me.startY;
    let inversedX = false;
    let inversedY = false;
    const left = me.clientX - gridRectDim.left - w.globals.barPadForNumericAxis;
    const top = me.clientY - gridRectDim.top;
    let selectionWidth = left - startX;
    let selectionHeight = top - startY;
    let selectionRect = {
      translateX: w.globals.translateX,
      translateY: w.globals.translateY
    };
    if (Math.abs(selectionWidth + startX) > w.globals.gridWidth) {
      selectionWidth = w.globals.gridWidth - startX;
    } else if (left < 0) {
      selectionWidth = startX;
    }
    if (startX > left) {
      inversedX = true;
      selectionWidth = Math.abs(selectionWidth);
    }
    if (startY > top) {
      inversedY = true;
      selectionHeight = Math.abs(selectionHeight);
    }
    if (zoomtype === "x") {
      selectionRect = {
        x: inversedX ? startX - selectionWidth : startX,
        y: 0,
        width: selectionWidth,
        height: w.globals.gridHeight
      };
    } else if (zoomtype === "y") {
      selectionRect = {
        x: 0,
        y: inversedY ? startY - selectionHeight : startY,
        width: w.globals.gridWidth,
        height: selectionHeight
      };
    } else {
      selectionRect = {
        x: inversedX ? startX - selectionWidth : startX,
        y: inversedY ? startY - selectionHeight : startY,
        width: selectionWidth,
        height: selectionHeight
      };
    }
    selectionRect = __spreadProps(__spreadValues({}, selectionRect), {
      translateX: w.globals.translateX,
      translateY: w.globals.translateY
    });
    me.drawSelectionRect(selectionRect);
    me.selectionDragging("resizing");
    return selectionRect;
  }
  selectionDragging(type, e) {
    const w = this.w;
    if (!e) return;
    e.preventDefault();
    const { handler, box } = e.detail;
    let { x, y } = box;
    if (x < this.constraints.x) {
      x = this.constraints.x;
    }
    if (y < this.constraints.y) {
      y = this.constraints.y;
    }
    if (box.x2 > this.constraints.x2) {
      x = this.constraints.x2 - box.w;
    }
    if (box.y2 > this.constraints.y2) {
      y = this.constraints.y2 - box.h;
    }
    handler.move(x, y);
    const xyRatios = this.xyRatios;
    const selRect = this.selectionRect;
    let timerInterval = 0;
    if (type === "resizing") {
      timerInterval = 30;
    }
    const getSelAttr = (attr) => {
      return parseFloat(selRect.node.getAttribute(attr));
    };
    const draggedProps = {
      x: getSelAttr("x"),
      y: getSelAttr("y"),
      width: getSelAttr("width"),
      height: getSelAttr("height")
    };
    w.globals.selection = draggedProps;
    if (typeof w.config.chart.events.selection === "function" && w.globals.selectionEnabled) {
      clearTimeout(this.w.globals.selectionResizeTimer);
      this.w.globals.selectionResizeTimer = window.setTimeout(() => {
        const gridRectDim = this.gridRect.getBoundingClientRect();
        const selectionRect = selRect.node.getBoundingClientRect();
        let minX, maxX, minY, maxY;
        if (!w.globals.isRangeBar) {
          minX = w.globals.xAxisScale.niceMin + (selectionRect.left - gridRectDim.left) * xyRatios.xRatio;
          maxX = w.globals.xAxisScale.niceMin + (selectionRect.right - gridRectDim.left) * xyRatios.xRatio;
          minY = w.globals.yAxisScale[0].niceMin + (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0];
          maxY = w.globals.yAxisScale[0].niceMax - (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0];
        } else {
          minX = w.globals.yAxisScale[0].niceMin + (selectionRect.left - gridRectDim.left) * xyRatios.invertedYRatio;
          maxX = w.globals.yAxisScale[0].niceMin + (selectionRect.right - gridRectDim.left) * xyRatios.invertedYRatio;
          minY = 0;
          maxY = 1;
        }
        const xyAxis = {
          xaxis: {
            min: minX,
            max: maxX
          },
          yaxis: {
            min: minY,
            max: maxY
          }
        };
        w.config.chart.events.selection(this.ctx, xyAxis);
        if (w.config.chart.brush.enabled && w.config.chart.events.brushScrolled !== void 0) {
          w.config.chart.events.brushScrolled(this.ctx, xyAxis);
        }
      }, timerInterval);
    }
  }
  selectionDrawn({ context, zoomtype }) {
    const w = this.w;
    const me = context;
    const xyRatios = this.xyRatios;
    const toolbar = this.ctx.toolbar;
    const selRect = w.globals.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();
    const gridRectDim = me.gridRect.getBoundingClientRect();
    const localStartX = selRect.left - gridRectDim.left - w.globals.barPadForNumericAxis;
    const localEndX = selRect.right - gridRectDim.left - w.globals.barPadForNumericAxis;
    const localStartY = selRect.top - gridRectDim.top;
    const localEndY = selRect.bottom - gridRectDim.top;
    let xLowestValue, xHighestValue;
    if (!w.globals.isRangeBar) {
      xLowestValue = w.globals.xAxisScale.niceMin + localStartX * xyRatios.xRatio;
      xHighestValue = w.globals.xAxisScale.niceMin + localEndX * xyRatios.xRatio;
    } else {
      xLowestValue = w.globals.yAxisScale[0].niceMin + localStartX * xyRatios.invertedYRatio;
      xHighestValue = w.globals.yAxisScale[0].niceMin + localEndX * xyRatios.invertedYRatio;
    }
    let yHighestValue = [];
    let yLowestValue = [];
    w.config.yaxis.forEach((yaxe, index) => {
      let seriesIndex = w.globals.seriesYAxisMap[index][0];
      let highestVal = w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localStartY;
      let lowestVal = w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localEndY;
      yHighestValue.push(highestVal);
      yLowestValue.push(lowestVal);
    });
    if (me.dragged && (me.dragX > 10 || me.dragY > 10) && xLowestValue !== xHighestValue) {
      if (w.globals.zoomEnabled) {
        let yaxis = Utils$1.clone(w.globals.initialConfig.yaxis);
        let xaxis = Utils$1.clone(w.globals.initialConfig.xaxis);
        w.globals.zoomed = true;
        if (w.config.xaxis.convertedCatToNumeric) {
          xLowestValue = Math.floor(xLowestValue);
          xHighestValue = Math.floor(xHighestValue);
          if (xLowestValue < 1) {
            xLowestValue = 1;
            xHighestValue = w.globals.dataPoints;
          }
          if (xHighestValue - xLowestValue < 2) {
            xHighestValue = xLowestValue + 1;
          }
        }
        if (zoomtype === "xy" || zoomtype === "x") {
          xaxis = {
            min: xLowestValue,
            max: xHighestValue
          };
        }
        if (zoomtype === "xy" || zoomtype === "y") {
          yaxis.forEach((yaxe, index) => {
            yaxis[index].min = yLowestValue[index];
            yaxis[index].max = yHighestValue[index];
          });
        }
        if (toolbar) {
          let beforeZoomRange = toolbar.getBeforeZoomRange(xaxis, yaxis);
          if (beforeZoomRange) {
            xaxis = beforeZoomRange.xaxis ? beforeZoomRange.xaxis : xaxis;
            yaxis = beforeZoomRange.yaxis ? beforeZoomRange.yaxis : yaxis;
          }
        }
        let options2 = {
          xaxis
        };
        if (!w.config.chart.group) {
          options2.yaxis = yaxis;
        }
        me.ctx.updateHelpers._updateOptions(
          options2,
          false,
          me.w.config.chart.animations.dynamicAnimation.enabled
        );
        if (typeof w.config.chart.events.zoomed === "function") {
          toolbar.zoomCallback(xaxis, yaxis);
        }
      } else if (w.globals.selectionEnabled) {
        let yaxis = null;
        let xaxis = null;
        xaxis = {
          min: xLowestValue,
          max: xHighestValue
        };
        if (zoomtype === "xy" || zoomtype === "y") {
          yaxis = Utils$1.clone(w.config.yaxis);
          yaxis.forEach((yaxe, index) => {
            yaxis[index].min = yLowestValue[index];
            yaxis[index].max = yHighestValue[index];
          });
        }
        w.globals.selection = me.selection;
        if (typeof w.config.chart.events.selection === "function") {
          w.config.chart.events.selection(me.ctx, {
            xaxis,
            yaxis
          });
        }
      }
    }
  }
  panDragging({ context }) {
    const w = this.w;
    let me = context;
    if (typeof w.globals.lastClientPosition.x !== "undefined") {
      const deltaX = w.globals.lastClientPosition.x - me.clientX;
      const deltaY = w.globals.lastClientPosition.y - me.clientY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        this.moveDirection = "left";
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
        this.moveDirection = "right";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
        this.moveDirection = "up";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
        this.moveDirection = "down";
      }
    }
    w.globals.lastClientPosition = {
      x: me.clientX,
      y: me.clientY
    };
    let xLowestValue = w.globals.isRangeBar ? w.globals.minY : w.globals.minX;
    let xHighestValue = w.globals.isRangeBar ? w.globals.maxY : w.globals.maxX;
    me.panScrolled(xLowestValue, xHighestValue);
  }
  // delayedPanScrolled() {
  //   const w = this.w
  //   let newMinX = w.globals.minX
  //   let newMaxX = w.globals.maxX
  //   const centerX = (w.globals.maxX - w.globals.minX) / 2
  //   if (this.moveDirection === 'left') {
  //     newMinX = w.globals.minX + centerX
  //     newMaxX = w.globals.maxX + centerX
  //   } else if (this.moveDirection === 'right') {
  //     newMinX = w.globals.minX - centerX
  //     newMaxX = w.globals.maxX - centerX
  //   }
  //   newMinX = Math.floor(newMinX)
  //   newMaxX = Math.floor(newMaxX)
  //   this.updateScrolledChart(
  //     { xaxis: { min: newMinX, max: newMaxX } },
  //     newMinX,
  //     newMaxX
  //   )
  // }
  panScrolled(xLowestValue, xHighestValue) {
    const w = this.w;
    const xyRatios = this.xyRatios;
    let yaxis = Utils$1.clone(w.globals.initialConfig.yaxis);
    let xRatio = xyRatios.xRatio;
    let minX = w.globals.minX;
    let maxX = w.globals.maxX;
    if (w.globals.isRangeBar) {
      xRatio = xyRatios.invertedYRatio;
      minX = w.globals.minY;
      maxX = w.globals.maxY;
    }
    if (this.moveDirection === "left") {
      xLowestValue = minX + w.globals.gridWidth / 15 * xRatio;
      xHighestValue = maxX + w.globals.gridWidth / 15 * xRatio;
    } else if (this.moveDirection === "right") {
      xLowestValue = minX - w.globals.gridWidth / 15 * xRatio;
      xHighestValue = maxX - w.globals.gridWidth / 15 * xRatio;
    }
    if (!w.globals.isRangeBar) {
      if (xLowestValue < w.globals.initialMinX || xHighestValue > w.globals.initialMaxX) {
        xLowestValue = minX;
        xHighestValue = maxX;
      }
    }
    let xaxis = {
      min: xLowestValue,
      max: xHighestValue
    };
    let options2 = {
      xaxis
    };
    if (!w.config.chart.group) {
      options2.yaxis = yaxis;
    }
    this.updateScrolledChart(options2, xLowestValue, xHighestValue);
  }
  updateScrolledChart(options2, xLowestValue, xHighestValue) {
    const w = this.w;
    this.ctx.updateHelpers._updateOptions(options2, false, false);
    if (typeof w.config.chart.events.scrolled === "function") {
      const args = {
        xaxis: {
          min: xLowestValue,
          max: xHighestValue
        }
      };
      w.config.chart.events.scrolled(this.ctx, args);
      this.ctx.events.fireEvent("scrolled", args);
    }
  }
}
class Utils2 {
  constructor(tooltipContext) {
    this.w = tooltipContext.w;
    this.ttCtx = tooltipContext;
    this.ctx = tooltipContext.ctx;
  }
  /**
   ** When hovering over series, you need to capture which series is being hovered on.
   ** This function will return both capturedseries index as well as inner index of that series
   * @memberof Utils
   * @param {object}
   * - hoverArea = the rect on which user hovers
   * - elGrid = dimensions of the hover rect (it can be different than hoverarea)
   */
  getNearestValues({ hoverArea, elGrid, clientX, clientY }) {
    let w = this.w;
    const seriesBound = elGrid.getBoundingClientRect();
    const hoverWidth = seriesBound.width;
    const hoverHeight = seriesBound.height;
    let xDivisor = hoverWidth / (w.globals.dataPoints - 1);
    let yDivisor = hoverHeight / w.globals.dataPoints;
    const hasBars = this.hasBars();
    if ((w.globals.comboCharts || hasBars) && !w.config.xaxis.convertedCatToNumeric) {
      xDivisor = hoverWidth / w.globals.dataPoints;
    }
    let hoverX = clientX - seriesBound.left - w.globals.barPadForNumericAxis;
    let hoverY = clientY - seriesBound.top;
    const notInRect = hoverX < 0 || hoverY < 0 || hoverX > hoverWidth || hoverY > hoverHeight;
    if (notInRect) {
      hoverArea.classList.remove("hovering-zoom");
      hoverArea.classList.remove("hovering-pan");
    } else {
      if (w.globals.zoomEnabled) {
        hoverArea.classList.remove("hovering-pan");
        hoverArea.classList.add("hovering-zoom");
      } else if (w.globals.panEnabled) {
        hoverArea.classList.remove("hovering-zoom");
        hoverArea.classList.add("hovering-pan");
      }
    }
    let j2 = Math.round(hoverX / xDivisor);
    let jHorz = Math.floor(hoverY / yDivisor);
    if (hasBars && !w.config.xaxis.convertedCatToNumeric) {
      j2 = Math.ceil(hoverX / xDivisor);
      j2 = j2 - 1;
    }
    let capturedSeries = null;
    let closest = null;
    let seriesXValArr = w.globals.seriesXvalues.map((seriesXVal) => {
      return seriesXVal.filter((s) => Utils$1.isNumber(s));
    });
    let seriesYValArr = w.globals.seriesYvalues.map((seriesYVal) => {
      return seriesYVal.filter((s) => Utils$1.isNumber(s));
    });
    if (w.globals.isXNumeric) {
      const chartGridEl = this.ttCtx.getElGrid();
      const chartGridElBoundingRect = chartGridEl.getBoundingClientRect();
      const transformedHoverX = hoverX * (chartGridElBoundingRect.width / hoverWidth);
      const transformedHoverY = hoverY * (chartGridElBoundingRect.height / hoverHeight);
      closest = this.closestInMultiArray(
        transformedHoverX,
        transformedHoverY,
        seriesXValArr,
        seriesYValArr
      );
      capturedSeries = closest.index;
      j2 = closest.j;
      if (capturedSeries !== null && w.globals.hasNullValues) {
        seriesXValArr = w.globals.seriesXvalues[capturedSeries];
        closest = this.closestInArray(transformedHoverX, seriesXValArr);
        j2 = closest.j;
      }
    }
    w.globals.capturedSeriesIndex = capturedSeries === null ? -1 : capturedSeries;
    if (!j2 || j2 < 1) j2 = 0;
    if (w.globals.isBarHorizontal) {
      w.globals.capturedDataPointIndex = jHorz;
    } else {
      w.globals.capturedDataPointIndex = j2;
    }
    return {
      capturedSeries,
      j: w.globals.isBarHorizontal ? jHorz : j2,
      hoverX,
      hoverY
    };
  }
  getFirstActiveXArray(Xarrays) {
    const w = this.w;
    let activeIndex = 0;
    let firstActiveSeriesIndex = Xarrays.map((xarr, index) => {
      return xarr.length > 0 ? index : -1;
    });
    for (let a = 0; a < firstActiveSeriesIndex.length; a++) {
      if (firstActiveSeriesIndex[a] !== -1 && w.globals.collapsedSeriesIndices.indexOf(a) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(a) === -1) {
        activeIndex = firstActiveSeriesIndex[a];
        break;
      }
    }
    return activeIndex;
  }
  closestInMultiArray(hoverX, hoverY, Xarrays, Yarrays) {
    const w = this.w;
    const isActiveSeries = (seriesIndex) => {
      return w.globals.collapsedSeriesIndices.indexOf(seriesIndex) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(seriesIndex) === -1;
    };
    let closestDist = Infinity;
    let closestSeriesIndex = null;
    let closestPointIndex = null;
    for (let i = 0; i < Xarrays.length; i++) {
      if (!isActiveSeries(i)) {
        continue;
      }
      const xArr = Xarrays[i];
      const yArr = Yarrays[i];
      const len = Math.min(xArr.length, yArr.length);
      for (let j2 = 0; j2 < len; j2++) {
        const xVal = xArr[j2];
        const distX = hoverX - xVal;
        let dist = Math.sqrt(distX * distX);
        if (!w.globals.allSeriesHasEqualX) {
          const yVal = yArr[j2];
          const distY = hoverY - yVal;
          dist = Math.sqrt(distX * distX + distY * distY);
        }
        if (dist < closestDist) {
          closestDist = dist;
          closestSeriesIndex = i;
          closestPointIndex = j2;
        }
      }
    }
    return {
      index: closestSeriesIndex,
      j: closestPointIndex
    };
  }
  closestInArray(val, arr) {
    let curr = arr[0];
    let currIndex = null;
    let diff = Math.abs(val - curr);
    for (let i = 0; i < arr.length; i++) {
      let newdiff = Math.abs(val - arr[i]);
      if (newdiff < diff) {
        diff = newdiff;
        currIndex = i;
      }
    }
    return {
      j: currIndex
    };
  }
  /**
   * When there are multiple series, it is possible to have different x values for each series.
   * But it may be possible in those multiple series, that there is same x value for 2 or more
   * series.
   * @memberof Utils
   * @param {int}
   * - j = is the inner index of series -> (series[i][j])
   * @return {bool}
   */
  isXoverlap(j2) {
    let w = this.w;
    let xSameForAllSeriesJArr = [];
    const seriesX = w.globals.seriesX.filter((s) => typeof s[0] !== "undefined");
    if (seriesX.length > 0) {
      for (let i = 0; i < seriesX.length - 1; i++) {
        if (typeof seriesX[i][j2] !== "undefined" && typeof seriesX[i + 1][j2] !== "undefined") {
          if (seriesX[i][j2] !== seriesX[i + 1][j2]) {
            xSameForAllSeriesJArr.push("unEqual");
          }
        }
      }
    }
    if (xSameForAllSeriesJArr.length === 0) {
      return true;
    }
    return false;
  }
  isInitialSeriesSameLen() {
    var _a;
    let sameLen = true;
    const initialSeries = ((_a = this.w.globals.initialSeries) == null ? void 0 : _a.filter(
      (s, i) => {
        var _a2;
        return !((_a2 = this.w.globals.collapsedSeriesIndices) == null ? void 0 : _a2.includes(i));
      }
    )) || [];
    for (let i = 0; i < initialSeries.length - 1; i++) {
      if (initialSeries[i].data.length !== initialSeries[i + 1].data.length) {
        sameLen = false;
        break;
      }
    }
    return sameLen;
  }
  getBarsHeight(allbars) {
    let bars = [...allbars];
    const totalHeight = bars.reduce((acc, bar) => acc + bar.getBBox().height, 0);
    return totalHeight;
  }
  getElMarkers(capturedSeries) {
    if (typeof capturedSeries == "number") {
      return this.w.globals.dom.baseEl.querySelectorAll(
        `.apexcharts-series[data\\:realIndex='${capturedSeries}'] .apexcharts-series-markers-wrap > *`
      );
    }
    return this.w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-series-markers-wrap > *"
    );
  }
  getAllMarkers(filterCollapsed = false) {
    let markersWraps = this.w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-series-markers-wrap"
    );
    markersWraps = [...markersWraps];
    if (filterCollapsed) {
      markersWraps = markersWraps.filter((m) => {
        const realIndex2 = Number(m.getAttribute("data:realIndex"));
        return this.w.globals.collapsedSeriesIndices.indexOf(realIndex2) === -1;
      });
    }
    markersWraps.sort((a, b) => {
      var indexA = Number(a.getAttribute("data:realIndex"));
      var indexB = Number(b.getAttribute("data:realIndex"));
      return indexB < indexA ? 1 : indexB > indexA ? -1 : 0;
    });
    let markers = [];
    markersWraps.forEach((m) => {
      markers.push(m.querySelector(".apexcharts-marker"));
    });
    return markers;
  }
  hasMarkers(capturedSeries) {
    const markers = this.getElMarkers(capturedSeries);
    return markers.length > 0;
  }
  getPathFromPoint(point, size) {
    let cx = Number(point.getAttribute("cx"));
    let cy = Number(point.getAttribute("cy"));
    let shape = point.getAttribute("shape");
    return new Graphics(this.ctx).getMarkerPath(cx, cy, shape, size);
  }
  getElBars() {
    return this.w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-bar-series,  .apexcharts-candlestick-series, .apexcharts-boxPlot-series, .apexcharts-rangebar-series"
    );
  }
  hasBars() {
    const bars = this.getElBars();
    return bars.length > 0;
  }
  getHoverMarkerSize(index) {
    const w = this.w;
    let hoverSize = w.config.markers.hover.size;
    if (hoverSize === void 0) {
      hoverSize = w.globals.markers.size[index] + w.config.markers.hover.sizeOffset;
    }
    return hoverSize;
  }
  toggleAllTooltipSeriesGroups(state) {
    let w = this.w;
    const ttCtx = this.ttCtx;
    if (ttCtx.allTooltipSeriesGroups.length === 0) {
      ttCtx.allTooltipSeriesGroups = w.globals.dom.baseEl.querySelectorAll(
        ".apexcharts-tooltip-series-group"
      );
    }
    let allTooltipSeriesGroups = ttCtx.allTooltipSeriesGroups;
    for (let i = 0; i < allTooltipSeriesGroups.length; i++) {
      if (state === "enable") {
        allTooltipSeriesGroups[i].classList.add("apexcharts-active");
        allTooltipSeriesGroups[i].style.display = w.config.tooltip.items.display;
      } else {
        allTooltipSeriesGroups[i].classList.remove("apexcharts-active");
        allTooltipSeriesGroups[i].style.display = "none";
      }
    }
  }
}
class Labels {
  constructor(tooltipContext) {
    this.w = tooltipContext.w;
    this.ctx = tooltipContext.ctx;
    this.ttCtx = tooltipContext;
    this.tooltipUtil = new Utils2(tooltipContext);
  }
  drawSeriesTexts({ shared = true, ttItems, i = 0, j: j2 = null, y1, y2, e }) {
    let w = this.w;
    if (w.config.tooltip.custom !== void 0) {
      this.handleCustomTooltip({ i, j: j2, y1, y2, w });
    } else {
      this.toggleActiveInactiveSeries(shared, i);
    }
    let values = this.getValuesToPrint({
      i,
      j: j2
    });
    this.printLabels({
      i,
      j: j2,
      values,
      ttItems,
      shared,
      e
    });
    const tooltipEl = this.ttCtx.getElTooltip();
    this.ttCtx.tooltipRect.ttWidth = tooltipEl.getBoundingClientRect().width;
    this.ttCtx.tooltipRect.ttHeight = tooltipEl.getBoundingClientRect().height;
  }
  printLabels({ i, j: j2, values, ttItems, shared, e }) {
    var _a;
    const w = this.w;
    let val;
    let goalVals = [];
    const hasGoalValues = (gi) => {
      return w.globals.seriesGoals[gi] && w.globals.seriesGoals[gi][j2] && Array.isArray(w.globals.seriesGoals[gi][j2]);
    };
    const { xVal, zVal, xAxisTTVal } = values;
    let seriesName = "";
    let pColor = w.globals.colors[i];
    if (j2 !== null && w.config.plotOptions.bar.distributed) {
      pColor = w.globals.colors[j2];
    }
    for (let t = 0, inverset = w.globals.series.length - 1; t < w.globals.series.length; t++, inverset--) {
      let f = this.getFormatters(i);
      seriesName = this.getSeriesName({
        fn: f.yLbTitleFormatter,
        index: i,
        seriesIndex: i,
        j: j2
      });
      if (w.config.chart.type === "treemap") {
        seriesName = f.yLbTitleFormatter(String(w.config.series[i].data[j2].x), {
          series: w.globals.series,
          seriesIndex: i,
          dataPointIndex: j2,
          w
        });
      }
      const tIndex = w.config.tooltip.inverseOrder ? inverset : t;
      if (w.globals.axisCharts) {
        const getValBySeriesIndex = (index) => {
          var _a2, _b, _c, _d;
          if (w.globals.isRangeData) {
            return f.yLbFormatter((_b = (_a2 = w.globals.seriesRangeStart) == null ? void 0 : _a2[index]) == null ? void 0 : _b[j2], {
              series: w.globals.seriesRangeStart,
              seriesIndex: index,
              dataPointIndex: j2,
              w
            }) + " - " + f.yLbFormatter((_d = (_c = w.globals.seriesRangeEnd) == null ? void 0 : _c[index]) == null ? void 0 : _d[j2], {
              series: w.globals.seriesRangeEnd,
              seriesIndex: index,
              dataPointIndex: j2,
              w
            });
          }
          return f.yLbFormatter(w.globals.series[index][j2], {
            series: w.globals.series,
            seriesIndex: index,
            dataPointIndex: j2,
            w
          });
        };
        if (shared) {
          f = this.getFormatters(tIndex);
          seriesName = this.getSeriesName({
            fn: f.yLbTitleFormatter,
            index: tIndex,
            seriesIndex: i,
            j: j2
          });
          pColor = w.globals.colors[tIndex];
          val = getValBySeriesIndex(tIndex);
          if (hasGoalValues(tIndex)) {
            goalVals = w.globals.seriesGoals[tIndex][j2].map((goal) => {
              return {
                attrs: goal,
                val: f.yLbFormatter(goal.value, {
                  seriesIndex: tIndex,
                  dataPointIndex: j2,
                  w
                })
              };
            });
          }
        } else {
          const targetFill = (_a = e == null ? void 0 : e.target) == null ? void 0 : _a.getAttribute("fill");
          if (targetFill) {
            if (targetFill.indexOf("url") !== -1) {
              if (targetFill.indexOf("Pattern") !== -1) {
                pColor = w.globals.dom.baseEl.querySelector(targetFill.substr(4).slice(0, -1)).childNodes[0].getAttribute("stroke");
              }
            } else {
              pColor = targetFill;
            }
          }
          val = getValBySeriesIndex(i);
          if (hasGoalValues(i) && Array.isArray(w.globals.seriesGoals[i][j2])) {
            goalVals = w.globals.seriesGoals[i][j2].map((goal) => {
              return {
                attrs: goal,
                val: f.yLbFormatter(goal.value, {
                  seriesIndex: i,
                  dataPointIndex: j2,
                  w
                })
              };
            });
          }
        }
      }
      if (j2 === null) {
        val = f.yLbFormatter(w.globals.series[i], __spreadProps(__spreadValues({}, w), {
          seriesIndex: i,
          dataPointIndex: i
        }));
      }
      this.DOMHandling({
        i,
        t: tIndex,
        j: j2,
        ttItems,
        values: {
          val,
          goalVals,
          xVal,
          xAxisTTVal,
          zVal
        },
        seriesName,
        shared,
        pColor
      });
    }
  }
  getFormatters(i) {
    const w = this.w;
    let yLbFormatter = w.globals.yLabelFormatters[i];
    let yLbTitleFormatter;
    if (w.globals.ttVal !== void 0) {
      if (Array.isArray(w.globals.ttVal)) {
        yLbFormatter = w.globals.ttVal[i] && w.globals.ttVal[i].formatter;
        yLbTitleFormatter = w.globals.ttVal[i] && w.globals.ttVal[i].title && w.globals.ttVal[i].title.formatter;
      } else {
        yLbFormatter = w.globals.ttVal.formatter;
        if (typeof w.globals.ttVal.title.formatter === "function") {
          yLbTitleFormatter = w.globals.ttVal.title.formatter;
        }
      }
    } else {
      yLbTitleFormatter = w.config.tooltip.y.title.formatter;
    }
    if (typeof yLbFormatter !== "function") {
      if (w.globals.yLabelFormatters[0]) {
        yLbFormatter = w.globals.yLabelFormatters[0];
      } else {
        yLbFormatter = function(label) {
          return label;
        };
      }
    }
    if (typeof yLbTitleFormatter !== "function") {
      yLbTitleFormatter = function(label) {
        return label ? label + ": " : "";
      };
    }
    return {
      yLbFormatter,
      yLbTitleFormatter
    };
  }
  getSeriesName({ fn, index, seriesIndex, j: j2 }) {
    const w = this.w;
    return fn(String(w.globals.seriesNames[index]), {
      series: w.globals.series,
      seriesIndex,
      dataPointIndex: j2,
      w
    });
  }
  DOMHandling({ i, t, j: j2, ttItems, values, seriesName, shared, pColor }) {
    const w = this.w;
    const ttCtx = this.ttCtx;
    const { val, goalVals, xVal, xAxisTTVal, zVal } = values;
    let ttItemsChildren = null;
    ttItemsChildren = ttItems[t].children;
    if (w.config.tooltip.fillSeriesColor) {
      ttItems[t].style.backgroundColor = pColor;
      ttItemsChildren[0].style.display = "none";
    }
    if (ttCtx.showTooltipTitle) {
      if (ttCtx.tooltipTitle === null) {
        ttCtx.tooltipTitle = w.globals.dom.baseEl.querySelector(
          ".apexcharts-tooltip-title"
        );
      }
      ttCtx.tooltipTitle.innerHTML = xVal;
    }
    if (ttCtx.isXAxisTooltipEnabled) {
      ttCtx.xaxisTooltipText.innerHTML = xAxisTTVal !== "" ? xAxisTTVal : xVal;
    }
    const ttYLabel = ttItems[t].querySelector(
      ".apexcharts-tooltip-text-y-label"
    );
    if (ttYLabel) {
      ttYLabel.innerHTML = seriesName ? seriesName : "";
    }
    const ttYVal = ttItems[t].querySelector(".apexcharts-tooltip-text-y-value");
    if (ttYVal) {
      ttYVal.innerHTML = typeof val !== "undefined" ? val : "";
    }
    if (ttItemsChildren[0] && ttItemsChildren[0].classList.contains("apexcharts-tooltip-marker")) {
      if (w.config.tooltip.marker.fillColors && Array.isArray(w.config.tooltip.marker.fillColors)) {
        pColor = w.config.tooltip.marker.fillColors[t];
      }
      if (w.config.tooltip.fillSeriesColor) {
        ttItemsChildren[0].style.backgroundColor = pColor;
      } else {
        ttItemsChildren[0].style.color = pColor;
      }
    }
    if (!w.config.tooltip.marker.show) {
      ttItemsChildren[0].style.display = "none";
    }
    const ttGLabel = ttItems[t].querySelector(
      ".apexcharts-tooltip-text-goals-label"
    );
    const ttGVal = ttItems[t].querySelector(
      ".apexcharts-tooltip-text-goals-value"
    );
    if (goalVals.length && w.globals.seriesGoals[t]) {
      const createGoalsHtml = () => {
        let gLabels = "<div>";
        let gVals = "<div>";
        goalVals.forEach((goal, gi) => {
          gLabels += ` <div style="display: flex"><span class="apexcharts-tooltip-marker" style="background-color: ${goal.attrs.strokeColor}; height: 3px; border-radius: 0; top: 5px;"></span> ${goal.attrs.name}</div>`;
          gVals += `<div>${goal.val}</div>`;
        });
        ttGLabel.innerHTML = gLabels + `</div>`;
        ttGVal.innerHTML = gVals + `</div>`;
      };
      if (shared) {
        if (w.globals.seriesGoals[t][j2] && Array.isArray(w.globals.seriesGoals[t][j2])) {
          createGoalsHtml();
        } else {
          ttGLabel.innerHTML = "";
          ttGVal.innerHTML = "";
        }
      } else {
        createGoalsHtml();
      }
    } else {
      ttGLabel.innerHTML = "";
      ttGVal.innerHTML = "";
    }
    if (zVal !== null) {
      const ttZLabel = ttItems[t].querySelector(
        ".apexcharts-tooltip-text-z-label"
      );
      ttZLabel.innerHTML = w.config.tooltip.z.title;
      const ttZVal = ttItems[t].querySelector(
        ".apexcharts-tooltip-text-z-value"
      );
      ttZVal.innerHTML = typeof zVal !== "undefined" ? zVal : "";
    }
    if (shared && ttItemsChildren[0]) {
      if (w.config.tooltip.hideEmptySeries) {
        let ttItemMarker = ttItems[t].querySelector(
          ".apexcharts-tooltip-marker"
        );
        let ttItemText = ttItems[t].querySelector(".apexcharts-tooltip-text");
        if (parseFloat(val) == 0) {
          ttItemMarker.style.display = "none";
          ttItemText.style.display = "none";
        } else {
          ttItemMarker.style.display = "block";
          ttItemText.style.display = "block";
        }
      }
      if (typeof val === "undefined" || val === null || w.globals.ancillaryCollapsedSeriesIndices.indexOf(t) > -1 || w.globals.collapsedSeriesIndices.indexOf(t) > -1 || Array.isArray(ttCtx.tConfig.enabledOnSeries) && ttCtx.tConfig.enabledOnSeries.indexOf(t) === -1) {
        ttItemsChildren[0].parentNode.style.display = "none";
      } else {
        ttItemsChildren[0].parentNode.style.display = w.config.tooltip.items.display;
      }
    } else {
      if (Array.isArray(ttCtx.tConfig.enabledOnSeries) && ttCtx.tConfig.enabledOnSeries.indexOf(t) === -1) {
        ttItemsChildren[0].parentNode.style.display = "none";
      }
    }
  }
  toggleActiveInactiveSeries(shared, i) {
    const w = this.w;
    if (shared) {
      this.tooltipUtil.toggleAllTooltipSeriesGroups("enable");
    } else {
      this.tooltipUtil.toggleAllTooltipSeriesGroups("disable");
      let firstTooltipSeriesGroup = w.globals.dom.baseEl.querySelector(
        `.apexcharts-tooltip-series-group-${i}`
      );
      if (firstTooltipSeriesGroup) {
        firstTooltipSeriesGroup.classList.add("apexcharts-active");
        firstTooltipSeriesGroup.style.display = w.config.tooltip.items.display;
      }
    }
  }
  getValuesToPrint({ i, j: j2 }) {
    const w = this.w;
    const filteredSeriesX = this.ctx.series.filteredSeriesX();
    let xVal = "";
    let xAxisTTVal = "";
    let zVal = null;
    let val = null;
    const customFormatterOpts = {
      series: w.globals.series,
      seriesIndex: i,
      dataPointIndex: j2,
      w
    };
    let zFormatter = w.globals.ttZFormatter;
    if (j2 === null) {
      val = w.globals.series[i];
    } else {
      if (w.globals.isXNumeric && w.config.chart.type !== "treemap") {
        xVal = filteredSeriesX[i][j2];
        if (filteredSeriesX[i].length === 0) {
          const firstActiveSeriesIndex = this.tooltipUtil.getFirstActiveXArray(filteredSeriesX);
          xVal = filteredSeriesX[firstActiveSeriesIndex][j2];
        }
      } else {
        const dataFormat = new Data(this.ctx);
        if (dataFormat.isFormatXY()) {
          xVal = typeof w.config.series[i].data[j2] !== "undefined" ? w.config.series[i].data[j2].x : "";
        } else {
          xVal = typeof w.globals.labels[j2] !== "undefined" ? w.globals.labels[j2] : "";
        }
      }
    }
    let bufferXVal = xVal;
    if (w.globals.isXNumeric && w.config.xaxis.type === "datetime") {
      let xFormat = new Formatters(this.ctx);
      xVal = xFormat.xLabelFormat(
        w.globals.ttKeyFormatter,
        bufferXVal,
        bufferXVal,
        {
          i: void 0,
          dateFormatter: new DateTime(this.ctx).formatDate,
          w: this.w
        }
      );
    } else {
      if (w.globals.isBarHorizontal) {
        xVal = w.globals.yLabelFormatters[0](bufferXVal, customFormatterOpts);
      } else {
        xVal = w.globals.xLabelFormatter(bufferXVal, customFormatterOpts);
      }
    }
    if (w.config.tooltip.x.formatter !== void 0) {
      xVal = w.globals.ttKeyFormatter(bufferXVal, customFormatterOpts);
    }
    if (w.globals.seriesZ.length > 0 && w.globals.seriesZ[i].length > 0) {
      zVal = zFormatter(w.globals.seriesZ[i][j2], w);
    }
    if (typeof w.config.xaxis.tooltip.formatter === "function") {
      xAxisTTVal = w.globals.xaxisTooltipFormatter(
        bufferXVal,
        customFormatterOpts
      );
    } else {
      xAxisTTVal = xVal;
    }
    return {
      val: Array.isArray(val) ? val.join(" ") : val,
      xVal: Array.isArray(xVal) ? xVal.join(" ") : xVal,
      xAxisTTVal: Array.isArray(xAxisTTVal) ? xAxisTTVal.join(" ") : xAxisTTVal,
      zVal
    };
  }
  handleCustomTooltip({ i, j: j2, y1, y2, w }) {
    const tooltipEl = this.ttCtx.getElTooltip();
    let fn = w.config.tooltip.custom;
    if (Array.isArray(fn) && fn[i]) {
      fn = fn[i];
    }
    const customTooltip = fn({
      ctx: this.ctx,
      series: w.globals.series,
      seriesIndex: i,
      dataPointIndex: j2,
      y1,
      y2,
      w
    });
    if (typeof customTooltip === "string" || typeof customTooltip === "number") {
      tooltipEl.innerHTML = customTooltip;
    } else if (customTooltip instanceof Element || typeof customTooltip.nodeName === "string") {
      tooltipEl.innerHTML = "";
      tooltipEl.appendChild(customTooltip.cloneNode(true));
    }
  }
}
class Position {
  constructor(tooltipContext) {
    this.ttCtx = tooltipContext;
    this.ctx = tooltipContext.ctx;
    this.w = tooltipContext.w;
  }
  /**
   * This will move the crosshair (the vertical/horz line that moves along with mouse)
   * Along with this, this function also calls the xaxisMove function
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move crosshair
   */
  moveXCrosshairs(cx, j2 = null) {
    const ttCtx = this.ttCtx;
    let w = this.w;
    const xcrosshairs = ttCtx.getElXCrosshairs();
    let x = cx - ttCtx.xcrosshairsWidth / 2;
    let tickAmount = w.globals.labels.slice().length;
    if (j2 !== null) {
      x = w.globals.gridWidth / tickAmount * j2;
    }
    if (xcrosshairs !== null && !w.globals.isBarHorizontal) {
      xcrosshairs.setAttribute("x", x);
      xcrosshairs.setAttribute("x1", x);
      xcrosshairs.setAttribute("x2", x);
      xcrosshairs.setAttribute("y2", w.globals.gridHeight);
      xcrosshairs.classList.add("apexcharts-active");
    }
    if (x < 0) {
      x = 0;
    }
    if (x > w.globals.gridWidth) {
      x = w.globals.gridWidth;
    }
    if (ttCtx.isXAxisTooltipEnabled) {
      let tx = x;
      if (w.config.xaxis.crosshairs.width === "tickWidth" || w.config.xaxis.crosshairs.width === "barWidth") {
        tx = x + ttCtx.xcrosshairsWidth / 2;
      }
      this.moveXAxisTooltip(tx);
    }
  }
  /**
   * This will move the crosshair (the vertical/horz line that moves along with mouse)
   * Along with this, this function also calls the xaxisMove function
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move crosshair
   */
  moveYCrosshairs(cy) {
    const ttCtx = this.ttCtx;
    if (ttCtx.ycrosshairs !== null) {
      Graphics.setAttrs(ttCtx.ycrosshairs, {
        y1: cy,
        y2: cy
      });
    }
    if (ttCtx.ycrosshairsHidden !== null) {
      Graphics.setAttrs(ttCtx.ycrosshairsHidden, {
        y1: cy,
        y2: cy
      });
    }
  }
  /**
   ** AxisTooltip is the small rectangle which appears on x axis with x value, when user moves
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move
   */
  moveXAxisTooltip(cx) {
    let w = this.w;
    const ttCtx = this.ttCtx;
    if (ttCtx.xaxisTooltip !== null && ttCtx.xcrosshairsWidth !== 0) {
      ttCtx.xaxisTooltip.classList.add("apexcharts-active");
      let cy = ttCtx.xaxisOffY + w.config.xaxis.tooltip.offsetY + w.globals.translateY + 1 + w.config.xaxis.offsetY;
      let xaxisTTText = ttCtx.xaxisTooltip.getBoundingClientRect();
      let xaxisTTTextWidth = xaxisTTText.width;
      cx = cx - xaxisTTTextWidth / 2;
      if (!isNaN(cx)) {
        cx = cx + w.globals.translateX;
        let textRect = 0;
        const graphics = new Graphics(this.ctx);
        textRect = graphics.getTextRects(ttCtx.xaxisTooltipText.innerHTML);
        ttCtx.xaxisTooltipText.style.minWidth = textRect.width + "px";
        ttCtx.xaxisTooltip.style.left = cx + "px";
        ttCtx.xaxisTooltip.style.top = cy + "px";
      }
    }
  }
  moveYAxisTooltip(index) {
    const w = this.w;
    const ttCtx = this.ttCtx;
    if (ttCtx.yaxisTTEls === null) {
      ttCtx.yaxisTTEls = w.globals.dom.baseEl.querySelectorAll(
        ".apexcharts-yaxistooltip"
      );
    }
    const ycrosshairsHiddenRectY1 = parseInt(
      ttCtx.ycrosshairsHidden.getAttribute("y1"),
      10
    );
    let cy = w.globals.translateY + ycrosshairsHiddenRectY1;
    const yAxisTTRect = ttCtx.yaxisTTEls[index].getBoundingClientRect();
    const yAxisTTHeight = yAxisTTRect.height;
    let cx = w.globals.translateYAxisX[index] - 2;
    if (w.config.yaxis[index].opposite) {
      cx = cx - yAxisTTRect.width;
    }
    cy = cy - yAxisTTHeight / 2;
    if (w.globals.ignoreYAxisIndexes.indexOf(index) === -1 && cy > 0 && cy < w.globals.gridHeight) {
      ttCtx.yaxisTTEls[index].classList.add("apexcharts-active");
      ttCtx.yaxisTTEls[index].style.top = cy + "px";
      ttCtx.yaxisTTEls[index].style.left = cx + w.config.yaxis[index].tooltip.offsetX + "px";
    } else {
      ttCtx.yaxisTTEls[index].classList.remove("apexcharts-active");
    }
  }
  /**
   ** moves the whole tooltip by changing x, y attrs
   * @memberof Position
   * @param {int} - cx = point's x position, wherever point's x is, you need to move tooltip
   * @param {int} - cy = point's y position, wherever point's y is, you need to move tooltip
   * @param {int} - markerSize = point's size
   */
  moveTooltip(cx, cy, markerSize = null) {
    let w = this.w;
    let ttCtx = this.ttCtx;
    const tooltipEl = ttCtx.getElTooltip();
    let tooltipRect = ttCtx.tooltipRect;
    let pointSize = markerSize !== null ? parseFloat(markerSize) : 1;
    let x = parseFloat(cx) + pointSize + 5;
    let y = parseFloat(cy) + pointSize / 2;
    if (x > w.globals.gridWidth / 2) {
      x = x - tooltipRect.ttWidth - pointSize - 10;
    }
    if (x > w.globals.gridWidth - tooltipRect.ttWidth - 10) {
      x = w.globals.gridWidth - tooltipRect.ttWidth;
    }
    if (x < -20) {
      x = -20;
    }
    if (w.config.tooltip.followCursor) {
      const elGrid = ttCtx.getElGrid();
      const seriesBound = elGrid.getBoundingClientRect();
      x = ttCtx.e.clientX - seriesBound.left;
      if (x > w.globals.gridWidth / 2) {
        x = x - ttCtx.tooltipRect.ttWidth;
      }
      y = ttCtx.e.clientY + w.globals.translateY - seriesBound.top;
      if (y > w.globals.gridHeight / 2) {
        y = y - ttCtx.tooltipRect.ttHeight;
      }
    } else {
      if (!w.globals.isBarHorizontal) {
        if (tooltipRect.ttHeight / 2 + y > w.globals.gridHeight) {
          y = w.globals.gridHeight - tooltipRect.ttHeight + w.globals.translateY;
        }
      }
    }
    if (!isNaN(x)) {
      x = x + w.globals.translateX;
      tooltipEl.style.left = x + "px";
      tooltipEl.style.top = y + "px";
    }
  }
  moveMarkers(i, j2) {
    let w = this.w;
    let ttCtx = this.ttCtx;
    if (w.globals.markers.size[i] > 0) {
      let allPoints = w.globals.dom.baseEl.querySelectorAll(
        ` .apexcharts-series[data\\:realIndex='${i}'] .apexcharts-marker`
      );
      for (let p = 0; p < allPoints.length; p++) {
        if (parseInt(allPoints[p].getAttribute("rel"), 10) === j2) {
          ttCtx.marker.resetPointsSize();
          ttCtx.marker.enlargeCurrentPoint(j2, allPoints[p]);
        }
      }
    } else {
      ttCtx.marker.resetPointsSize();
      this.moveDynamicPointOnHover(j2, i);
    }
  }
  // This function is used when you need to show markers/points only on hover -
  // DIFFERENT X VALUES in multiple series
  moveDynamicPointOnHover(j2, capturedSeries) {
    var _a, _b;
    let w = this.w;
    let ttCtx = this.ttCtx;
    let cx = 0;
    let cy = 0;
    const graphics = new Graphics(this.ctx);
    let pointsArr = w.globals.pointsArray;
    let hoverSize = ttCtx.tooltipUtil.getHoverMarkerSize(capturedSeries);
    const serType = w.config.series[capturedSeries].type;
    if (serType && (serType === "column" || serType === "candlestick" || serType === "boxPlot")) {
      return;
    }
    cx = (_a = pointsArr[capturedSeries][j2]) == null ? void 0 : _a[0];
    cy = ((_b = pointsArr[capturedSeries][j2]) == null ? void 0 : _b[1]) || 0;
    let point = w.globals.dom.baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${capturedSeries}'] .apexcharts-series-markers path`
    );
    if (point && cy < w.globals.gridHeight && cy > 0) {
      const shape = point.getAttribute("shape");
      const path = graphics.getMarkerPath(cx, cy, shape, hoverSize * 1.5);
      point.setAttribute("d", path);
    }
    this.moveXCrosshairs(cx);
    if (!ttCtx.fixedTooltip) {
      this.moveTooltip(cx, cy, hoverSize);
    }
  }
  // This function is used when you need to show markers/points only on hover -
  // SAME X VALUES in multiple series
  moveDynamicPointsOnHover(j2) {
    const ttCtx = this.ttCtx;
    let w = ttCtx.w;
    let cx = 0;
    let cy = 0;
    let activeSeries = 0;
    let pointsArr = w.globals.pointsArray;
    let series = new Series(this.ctx);
    const graphics = new Graphics(this.ctx);
    activeSeries = series.getActiveConfigSeriesIndex("asc", [
      "line",
      "area",
      "scatter",
      "bubble"
    ]);
    let hoverSize = ttCtx.tooltipUtil.getHoverMarkerSize(activeSeries);
    if (pointsArr[activeSeries]) {
      cx = pointsArr[activeSeries][j2][0];
      cy = pointsArr[activeSeries][j2][1];
    }
    if (isNaN(cx)) {
      return;
    }
    let points = ttCtx.tooltipUtil.getAllMarkers();
    if (points.length) {
      for (let p = 0; p < w.globals.series.length; p++) {
        let pointArr = pointsArr[p];
        if (w.globals.comboCharts) {
          if (typeof pointArr === "undefined") {
            points.splice(p, 0, null);
          }
        }
        if (pointArr && pointArr.length) {
          let pcy = pointsArr[p][j2][1];
          let pcy2;
          points[p].setAttribute("cx", cx);
          const shape = points[p].getAttribute("shape");
          if (w.config.chart.type === "rangeArea" && !w.globals.comboCharts) {
            const rangeStartIndex = j2 + w.globals.series[p].length;
            pcy2 = pointsArr[p][rangeStartIndex][1];
            const pcyDiff = Math.abs(pcy - pcy2) / 2;
            pcy = pcy - pcyDiff;
          }
          if (pcy !== null && !isNaN(pcy) && pcy < w.globals.gridHeight + hoverSize && pcy + hoverSize > 0) {
            const path = graphics.getMarkerPath(cx, pcy, shape, hoverSize);
            points[p].setAttribute("d", path);
          } else {
            points[p].setAttribute("d", "");
          }
        }
      }
    }
    this.moveXCrosshairs(cx);
    if (!ttCtx.fixedTooltip) {
      this.moveTooltip(cx, cy || w.globals.gridHeight, hoverSize);
    }
  }
  moveStickyTooltipOverBars(j2, capturedSeries) {
    const w = this.w;
    const ttCtx = this.ttCtx;
    let barLen = w.globals.columnSeries ? w.globals.columnSeries.length : w.globals.series.length;
    if (w.config.chart.stacked) {
      barLen = w.globals.barGroups.length;
    }
    let i = barLen >= 2 && barLen % 2 === 0 ? Math.floor(barLen / 2) : Math.floor(barLen / 2) + 1;
    if (w.globals.isBarHorizontal) {
      let series = new Series(this.ctx);
      i = series.getActiveConfigSeriesIndex("desc") + 1;
    }
    let jBar = w.globals.dom.baseEl.querySelector(
      `.apexcharts-bar-series .apexcharts-series[rel='${i}'] path[j='${j2}'], .apexcharts-candlestick-series .apexcharts-series[rel='${i}'] path[j='${j2}'], .apexcharts-boxPlot-series .apexcharts-series[rel='${i}'] path[j='${j2}'], .apexcharts-rangebar-series .apexcharts-series[rel='${i}'] path[j='${j2}']`
    );
    if (!jBar && typeof capturedSeries === "number") {
      jBar = w.globals.dom.baseEl.querySelector(
        `.apexcharts-bar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j2}'],
        .apexcharts-candlestick-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j2}'],
        .apexcharts-boxPlot-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j2}'],
        .apexcharts-rangebar-series .apexcharts-series[data\\:realIndex='${capturedSeries}'] path[j='${j2}']`
      );
    }
    let bcx = jBar ? parseFloat(jBar.getAttribute("cx")) : 0;
    let bcy = jBar ? parseFloat(jBar.getAttribute("cy")) : 0;
    let bw = jBar ? parseFloat(jBar.getAttribute("barWidth")) : 0;
    const elGrid = ttCtx.getElGrid();
    let seriesBound = elGrid.getBoundingClientRect();
    const isBoxOrCandle = jBar && (jBar.classList.contains("apexcharts-candlestick-area") || jBar.classList.contains("apexcharts-boxPlot-area"));
    if (w.globals.isXNumeric) {
      if (jBar && !isBoxOrCandle) {
        bcx = bcx - (barLen % 2 !== 0 ? bw / 2 : 0);
      }
      if (jBar && // fixes apexcharts.js#2354
      isBoxOrCandle) {
        bcx = bcx - bw / 2;
      }
    } else {
      if (!w.globals.isBarHorizontal) {
        bcx = ttCtx.xAxisTicksPositions[j2 - 1] + ttCtx.dataPointsDividedWidth / 2;
        if (isNaN(bcx)) {
          bcx = ttCtx.xAxisTicksPositions[j2] - ttCtx.dataPointsDividedWidth / 2;
        }
      }
    }
    if (!w.globals.isBarHorizontal) {
      if (w.config.tooltip.followCursor) {
        bcy = ttCtx.e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2;
      } else {
        if (bcy + ttCtx.tooltipRect.ttHeight + 15 > w.globals.gridHeight) {
          bcy = w.globals.gridHeight;
        }
      }
    } else {
      bcy = bcy - ttCtx.tooltipRect.ttHeight;
    }
    if (!w.globals.isBarHorizontal) {
      this.moveXCrosshairs(bcx);
    }
    if (!ttCtx.fixedTooltip) {
      this.moveTooltip(bcx, bcy || w.globals.gridHeight);
    }
  }
}
class Marker {
  constructor(tooltipContext) {
    this.w = tooltipContext.w;
    this.ttCtx = tooltipContext;
    this.ctx = tooltipContext.ctx;
    this.tooltipPosition = new Position(tooltipContext);
  }
  drawDynamicPoints() {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let marker = new Markers(this.ctx);
    let elsSeries = w.globals.dom.baseEl.querySelectorAll(".apexcharts-series");
    elsSeries = [...elsSeries];
    if (w.config.chart.stacked) {
      elsSeries.sort((a, b) => {
        return parseFloat(a.getAttribute("data:realIndex")) - parseFloat(b.getAttribute("data:realIndex"));
      });
    }
    for (let i = 0; i < elsSeries.length; i++) {
      let pointsMain = elsSeries[i].querySelector(
        `.apexcharts-series-markers-wrap`
      );
      if (pointsMain !== null) {
        let point;
        let PointClasses = `apexcharts-marker w${(Math.random() + 1).toString(36).substring(4)}`;
        if ((w.config.chart.type === "line" || w.config.chart.type === "area") && !w.globals.comboCharts && !w.config.tooltip.intersect) {
          PointClasses += " no-pointer-events";
        }
        let elPointOptions = marker.getMarkerConfig({
          cssClass: PointClasses,
          seriesIndex: Number(pointsMain.getAttribute("data:realIndex"))
          // fixes apexcharts/apexcharts.js #1427
        });
        point = graphics.drawMarker(0, 0, elPointOptions);
        point.node.setAttribute("default-marker-size", 0);
        let elPointsG = document.createElementNS(w.globals.SVGNS, "g");
        elPointsG.classList.add("apexcharts-series-markers");
        elPointsG.appendChild(point.node);
        pointsMain.appendChild(elPointsG);
      }
    }
  }
  enlargeCurrentPoint(rel, point, x = null, y = null) {
    let w = this.w;
    if (w.config.chart.type !== "bubble") {
      this.newPointSize(rel, point);
    }
    let cx = point.getAttribute("cx");
    let cy = point.getAttribute("cy");
    if (x !== null && y !== null) {
      cx = x;
      cy = y;
    }
    this.tooltipPosition.moveXCrosshairs(cx);
    if (!this.fixedTooltip) {
      if (w.config.chart.type === "radar") {
        const elGrid = this.ttCtx.getElGrid();
        const seriesBound = elGrid.getBoundingClientRect();
        cx = this.ttCtx.e.clientX - seriesBound.left;
      }
      this.tooltipPosition.moveTooltip(cx, cy, w.config.markers.hover.size);
    }
  }
  enlargePoints(j2) {
    let w = this.w;
    let me = this;
    const ttCtx = this.ttCtx;
    let col = j2;
    let points = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker"
    );
    let newSize = w.config.markers.hover.size;
    for (let p = 0; p < points.length; p++) {
      let rel = points[p].getAttribute("rel");
      let index = points[p].getAttribute("index");
      if (newSize === void 0) {
        newSize = w.globals.markers.size[index] + w.config.markers.hover.sizeOffset;
      }
      if (col === parseInt(rel, 10)) {
        me.newPointSize(col, points[p]);
        let cx = points[p].getAttribute("cx");
        let cy = points[p].getAttribute("cy");
        me.tooltipPosition.moveXCrosshairs(cx);
        if (!ttCtx.fixedTooltip) {
          me.tooltipPosition.moveTooltip(cx, cy, newSize);
        }
      } else {
        me.oldPointSize(points[p]);
      }
    }
  }
  newPointSize(rel, point) {
    let w = this.w;
    let newSize = w.config.markers.hover.size;
    let elPoint = rel === 0 ? point.parentNode.firstChild : point.parentNode.lastChild;
    if (elPoint.getAttribute("default-marker-size") !== "0") {
      const index = parseInt(elPoint.getAttribute("index"), 10);
      if (newSize === void 0) {
        newSize = w.globals.markers.size[index] + w.config.markers.hover.sizeOffset;
      }
      if (newSize < 0) {
        newSize = 0;
      }
      const path = this.ttCtx.tooltipUtil.getPathFromPoint(point, newSize);
      point.setAttribute("d", path);
    }
  }
  oldPointSize(point) {
    const size = parseFloat(point.getAttribute("default-marker-size"));
    const path = this.ttCtx.tooltipUtil.getPathFromPoint(point, size);
    point.setAttribute("d", path);
  }
  resetPointsSize() {
    let w = this.w;
    let points = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-series:not(.apexcharts-series-collapsed) .apexcharts-marker"
    );
    for (let p = 0; p < points.length; p++) {
      const size = parseFloat(points[p].getAttribute("default-marker-size"));
      if (Utils$1.isNumber(size) && size > 0) {
        const path = this.ttCtx.tooltipUtil.getPathFromPoint(points[p], size);
        points[p].setAttribute("d", path);
      } else {
        points[p].setAttribute("d", "M0,0");
      }
    }
  }
}
class Intersect {
  constructor(tooltipContext) {
    this.w = tooltipContext.w;
    const w = this.w;
    this.ttCtx = tooltipContext;
    this.isVerticalGroupedRangeBar = !w.globals.isBarHorizontal && w.config.chart.type === "rangeBar" && w.config.plotOptions.bar.rangeBarGroupRows;
  }
  // a helper function to get an element's attribute value
  getAttr(e, attr) {
    return parseFloat(e.target.getAttribute(attr));
  }
  // handle tooltip for heatmaps and treemaps
  handleHeatTreeTooltip({ e, opt, x, y, type }) {
    const ttCtx = this.ttCtx;
    const w = this.w;
    if (e.target.classList.contains(`apexcharts-${type}-rect`)) {
      let i = this.getAttr(e, "i");
      let j2 = this.getAttr(e, "j");
      let cx = this.getAttr(e, "cx");
      let cy = this.getAttr(e, "cy");
      let width = this.getAttr(e, "width");
      let height = this.getAttr(e, "height");
      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j: j2,
        shared: false,
        e
      });
      w.globals.capturedSeriesIndex = i;
      w.globals.capturedDataPointIndex = j2;
      x = cx + ttCtx.tooltipRect.ttWidth / 2 + width;
      y = cy + ttCtx.tooltipRect.ttHeight / 2 - height / 2;
      ttCtx.tooltipPosition.moveXCrosshairs(cx + width / 2);
      if (x > w.globals.gridWidth / 2) {
        x = cx - ttCtx.tooltipRect.ttWidth / 2 + width;
      }
      if (ttCtx.w.config.tooltip.followCursor) {
        let seriesBound = w.globals.dom.elWrap.getBoundingClientRect();
        x = w.globals.clientX - seriesBound.left - (x > w.globals.gridWidth / 2 ? ttCtx.tooltipRect.ttWidth : 0);
        y = w.globals.clientY - seriesBound.top - (y > w.globals.gridHeight / 2 ? ttCtx.tooltipRect.ttHeight : 0);
      }
    }
    return {
      x,
      y
    };
  }
  /**
   * handle tooltips for line/area/scatter charts where tooltip.intersect is true
   * when user hovers over the marker directly, this function is executed
   */
  handleMarkerTooltip({ e, opt, x, y }) {
    let w = this.w;
    const ttCtx = this.ttCtx;
    let i;
    let j2;
    if (e.target.classList.contains("apexcharts-marker")) {
      let cx = parseInt(opt.paths.getAttribute("cx"), 10);
      let cy = parseInt(opt.paths.getAttribute("cy"), 10);
      let val = parseFloat(opt.paths.getAttribute("val"));
      j2 = parseInt(opt.paths.getAttribute("rel"), 10);
      i = parseInt(
        opt.paths.parentNode.parentNode.parentNode.getAttribute("rel"),
        10
      ) - 1;
      if (ttCtx.intersect) {
        const el = Utils$1.findAncestor(opt.paths, "apexcharts-series");
        if (el) {
          i = parseInt(el.getAttribute("data:realIndex"), 10);
        }
      }
      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j: j2,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared,
        e
      });
      if (e.type === "mouseup") {
        ttCtx.markerClick(e, i, j2);
      }
      w.globals.capturedSeriesIndex = i;
      w.globals.capturedDataPointIndex = j2;
      x = cx;
      y = cy + w.globals.translateY - ttCtx.tooltipRect.ttHeight * 1.4;
      if (ttCtx.w.config.tooltip.followCursor) {
        const elGrid = ttCtx.getElGrid();
        const seriesBound = elGrid.getBoundingClientRect();
        y = ttCtx.e.clientY + w.globals.translateY - seriesBound.top;
      }
      if (val < 0) {
        y = cy;
      }
      ttCtx.marker.enlargeCurrentPoint(j2, opt.paths, x, y);
    }
    return {
      x,
      y
    };
  }
  /**
   * handle tooltips for bar/column charts
   */
  handleBarTooltip({ e, opt }) {
    const w = this.w;
    const ttCtx = this.ttCtx;
    const tooltipEl = ttCtx.getElTooltip();
    let bx = 0;
    let x = 0;
    let y = 0;
    let i = 0;
    let strokeWidth;
    let barXY = this.getBarTooltipXY({
      e,
      opt
    });
    if (barXY.j === null && barXY.barHeight === 0 && barXY.barWidth === 0) {
      return;
    }
    i = barXY.i;
    let j2 = barXY.j;
    w.globals.capturedSeriesIndex = i;
    w.globals.capturedDataPointIndex = j2;
    if (w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars() || !w.config.tooltip.shared) {
      x = barXY.x;
      y = barXY.y;
      strokeWidth = Array.isArray(w.config.stroke.width) ? w.config.stroke.width[i] : w.config.stroke.width;
      bx = x;
    } else {
      if (!w.globals.comboCharts && !w.config.tooltip.shared) {
        bx = bx / 2;
      }
    }
    if (isNaN(y)) {
      y = w.globals.svgHeight - ttCtx.tooltipRect.ttHeight;
    }
    parseInt(
      opt.paths.parentNode.getAttribute("data:realIndex"),
      10
    );
    if (x + ttCtx.tooltipRect.ttWidth > w.globals.gridWidth) {
      x = x - ttCtx.tooltipRect.ttWidth;
    } else if (x < 0) {
      x = 0;
    }
    if (ttCtx.w.config.tooltip.followCursor) {
      const elGrid = ttCtx.getElGrid();
      const seriesBound = elGrid.getBoundingClientRect();
      y = ttCtx.e.clientY - seriesBound.top;
    }
    if (ttCtx.tooltip === null) {
      ttCtx.tooltip = w.globals.dom.baseEl.querySelector(".apexcharts-tooltip");
    }
    if (!w.config.tooltip.shared) {
      if (w.globals.comboBarCount > 0) {
        ttCtx.tooltipPosition.moveXCrosshairs(bx + strokeWidth / 2);
      } else {
        ttCtx.tooltipPosition.moveXCrosshairs(bx);
      }
    }
    if (!ttCtx.fixedTooltip && (!w.config.tooltip.shared || w.globals.isBarHorizontal && ttCtx.tooltipUtil.hasBars())) {
      y = y + w.globals.translateY - ttCtx.tooltipRect.ttHeight / 2;
      tooltipEl.style.left = x + w.globals.translateX + "px";
      tooltipEl.style.top = y + "px";
    }
  }
  getBarTooltipXY({ e, opt }) {
    let w = this.w;
    let j2 = null;
    const ttCtx = this.ttCtx;
    let i = 0;
    let x = 0;
    let y = 0;
    let barWidth = 0;
    let barHeight = 0;
    const cl = e.target.classList;
    if (cl.contains("apexcharts-bar-area") || cl.contains("apexcharts-candlestick-area") || cl.contains("apexcharts-boxPlot-area") || cl.contains("apexcharts-rangebar-area")) {
      let bar = e.target;
      let barRect = bar.getBoundingClientRect();
      let seriesBound = opt.elGrid.getBoundingClientRect();
      let bh = barRect.height;
      barHeight = barRect.height;
      let bw = barRect.width;
      let cx = parseInt(bar.getAttribute("cx"), 10);
      let cy = parseInt(bar.getAttribute("cy"), 10);
      barWidth = parseFloat(bar.getAttribute("barWidth"));
      const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
      j2 = parseInt(bar.getAttribute("j"), 10);
      i = parseInt(bar.parentNode.getAttribute("rel"), 10) - 1;
      let y1 = bar.getAttribute("data-range-y1");
      let y2 = bar.getAttribute("data-range-y2");
      if (w.globals.comboCharts) {
        i = parseInt(bar.parentNode.getAttribute("data:realIndex"), 10);
      }
      const handleXForColumns = (x2) => {
        if (w.globals.isXNumeric) {
          x2 = cx - bw / 2;
        } else {
          if (this.isVerticalGroupedRangeBar) {
            x2 = cx + bw / 2;
          } else {
            x2 = cx - ttCtx.dataPointsDividedWidth + bw / 2;
          }
        }
        return x2;
      };
      const handleYForBars = () => {
        return cy - ttCtx.dataPointsDividedHeight + bh / 2 - ttCtx.tooltipRect.ttHeight / 2;
      };
      ttCtx.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i,
        j: j2,
        y1: y1 ? parseInt(y1, 10) : null,
        y2: y2 ? parseInt(y2, 10) : null,
        shared: ttCtx.showOnIntersect ? false : w.config.tooltip.shared,
        e
      });
      if (w.config.tooltip.followCursor) {
        if (w.globals.isBarHorizontal) {
          x = clientX - seriesBound.left + 15;
          y = handleYForBars();
        } else {
          x = handleXForColumns(x);
          y = e.clientY - seriesBound.top - ttCtx.tooltipRect.ttHeight / 2 - 15;
        }
      } else {
        if (w.globals.isBarHorizontal) {
          x = cx;
          if (x < ttCtx.xyRatios.baseLineInvertedY) {
            x = cx - ttCtx.tooltipRect.ttWidth;
          }
          y = handleYForBars();
        } else {
          x = handleXForColumns(x);
          y = cy;
        }
      }
    }
    return {
      x,
      y,
      barHeight,
      barWidth,
      i,
      j: j2
    };
  }
}
class AxesTooltip {
  constructor(tooltipContext) {
    this.w = tooltipContext.w;
    this.ttCtx = tooltipContext;
  }
  /**
   * This method adds the secondary tooltip which appears below x axis
   * @memberof Tooltip
   **/
  drawXaxisTooltip() {
    let w = this.w;
    const ttCtx = this.ttCtx;
    const isBottom = w.config.xaxis.position === "bottom";
    ttCtx.xaxisOffY = isBottom ? w.globals.gridHeight + 1 : -w.globals.xAxisHeight - w.config.xaxis.axisTicks.height + 3;
    const tooltipCssClass = isBottom ? "apexcharts-xaxistooltip apexcharts-xaxistooltip-bottom" : "apexcharts-xaxistooltip apexcharts-xaxistooltip-top";
    let renderTo = w.globals.dom.elWrap;
    if (ttCtx.isXAxisTooltipEnabled) {
      let xaxisTooltip = w.globals.dom.baseEl.querySelector(
        ".apexcharts-xaxistooltip"
      );
      if (xaxisTooltip === null) {
        ttCtx.xaxisTooltip = document.createElement("div");
        ttCtx.xaxisTooltip.setAttribute(
          "class",
          tooltipCssClass + " apexcharts-theme-" + w.config.tooltip.theme
        );
        renderTo.appendChild(ttCtx.xaxisTooltip);
        ttCtx.xaxisTooltipText = document.createElement("div");
        ttCtx.xaxisTooltipText.classList.add("apexcharts-xaxistooltip-text");
        ttCtx.xaxisTooltipText.style.fontFamily = w.config.xaxis.tooltip.style.fontFamily || w.config.chart.fontFamily;
        ttCtx.xaxisTooltipText.style.fontSize = w.config.xaxis.tooltip.style.fontSize;
        ttCtx.xaxisTooltip.appendChild(ttCtx.xaxisTooltipText);
      }
    }
  }
  /**
   * This method adds the secondary tooltip which appears below x axis
   * @memberof Tooltip
   **/
  drawYaxisTooltip() {
    let w = this.w;
    const ttCtx = this.ttCtx;
    for (let i = 0; i < w.config.yaxis.length; i++) {
      const isRight = w.config.yaxis[i].opposite || w.config.yaxis[i].crosshairs.opposite;
      ttCtx.yaxisOffX = isRight ? w.globals.gridWidth + 1 : 1;
      let tooltipCssClass = isRight ? `apexcharts-yaxistooltip apexcharts-yaxistooltip-${i} apexcharts-yaxistooltip-right` : `apexcharts-yaxistooltip apexcharts-yaxistooltip-${i} apexcharts-yaxistooltip-left`;
      let renderTo = w.globals.dom.elWrap;
      let yaxisTooltip = w.globals.dom.baseEl.querySelector(
        `.apexcharts-yaxistooltip apexcharts-yaxistooltip-${i}`
      );
      if (yaxisTooltip === null) {
        ttCtx.yaxisTooltip = document.createElement("div");
        ttCtx.yaxisTooltip.setAttribute(
          "class",
          tooltipCssClass + " apexcharts-theme-" + w.config.tooltip.theme
        );
        renderTo.appendChild(ttCtx.yaxisTooltip);
        if (i === 0) ttCtx.yaxisTooltipText = [];
        ttCtx.yaxisTooltipText[i] = document.createElement("div");
        ttCtx.yaxisTooltipText[i].classList.add("apexcharts-yaxistooltip-text");
        ttCtx.yaxisTooltip.appendChild(ttCtx.yaxisTooltipText[i]);
      }
    }
  }
  /**
   * @memberof Tooltip
   **/
  setXCrosshairWidth() {
    let w = this.w;
    const ttCtx = this.ttCtx;
    const xcrosshairs = ttCtx.getElXCrosshairs();
    ttCtx.xcrosshairsWidth = parseInt(w.config.xaxis.crosshairs.width, 10);
    if (!w.globals.comboCharts) {
      if (w.config.xaxis.crosshairs.width === "tickWidth") {
        let count = w.globals.labels.length;
        ttCtx.xcrosshairsWidth = w.globals.gridWidth / count;
      } else if (w.config.xaxis.crosshairs.width === "barWidth") {
        let bar = w.globals.dom.baseEl.querySelector(".apexcharts-bar-area");
        if (bar !== null) {
          let barWidth = parseFloat(bar.getAttribute("barWidth"));
          ttCtx.xcrosshairsWidth = barWidth;
        } else {
          ttCtx.xcrosshairsWidth = 1;
        }
      }
    } else {
      let bar = w.globals.dom.baseEl.querySelector(".apexcharts-bar-area");
      if (bar !== null && w.config.xaxis.crosshairs.width === "barWidth") {
        let barWidth = parseFloat(bar.getAttribute("barWidth"));
        ttCtx.xcrosshairsWidth = barWidth;
      } else {
        if (w.config.xaxis.crosshairs.width === "tickWidth") {
          let count = w.globals.labels.length;
          ttCtx.xcrosshairsWidth = w.globals.gridWidth / count;
        }
      }
    }
    if (w.globals.isBarHorizontal) {
      ttCtx.xcrosshairsWidth = 0;
    }
    if (xcrosshairs !== null && ttCtx.xcrosshairsWidth > 0) {
      xcrosshairs.setAttribute("width", ttCtx.xcrosshairsWidth);
    }
  }
  handleYCrosshair() {
    let w = this.w;
    const ttCtx = this.ttCtx;
    ttCtx.ycrosshairs = w.globals.dom.baseEl.querySelector(
      ".apexcharts-ycrosshairs"
    );
    ttCtx.ycrosshairsHidden = w.globals.dom.baseEl.querySelector(
      ".apexcharts-ycrosshairs-hidden"
    );
  }
  drawYaxisTooltipText(index, clientY, xyRatios) {
    const ttCtx = this.ttCtx;
    const w = this.w;
    const gl = w.globals;
    const yAxisSeriesArr = gl.seriesYAxisMap[index];
    if (ttCtx.yaxisTooltips[index] && yAxisSeriesArr.length > 0) {
      const lbFormatter = gl.yLabelFormatters[index];
      const elGrid = ttCtx.getElGrid();
      const seriesBound = elGrid.getBoundingClientRect();
      const seriesIndex = yAxisSeriesArr[0];
      let translationsIndex = 0;
      if (xyRatios.yRatio.length > 1) {
        translationsIndex = seriesIndex;
      }
      const hoverY = (clientY - seriesBound.top) * xyRatios.yRatio[translationsIndex];
      const height = gl.maxYArr[seriesIndex] - gl.minYArr[seriesIndex];
      let val = gl.minYArr[seriesIndex] + (height - hoverY);
      if (w.config.yaxis[index].reversed) {
        val = gl.maxYArr[seriesIndex] - (height - hoverY);
      }
      ttCtx.tooltipPosition.moveYCrosshairs(clientY - seriesBound.top);
      ttCtx.yaxisTooltipText[index].innerHTML = lbFormatter(val);
      ttCtx.tooltipPosition.moveYAxisTooltip(index);
    }
  }
}
class Tooltip {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    const w = this.w;
    this.tConfig = w.config.tooltip;
    this.tooltipUtil = new Utils2(this);
    this.tooltipLabels = new Labels(this);
    this.tooltipPosition = new Position(this);
    this.marker = new Marker(this);
    this.intersect = new Intersect(this);
    this.axesTooltip = new AxesTooltip(this);
    this.showOnIntersect = this.tConfig.intersect;
    this.showTooltipTitle = this.tConfig.x.show;
    this.fixedTooltip = this.tConfig.fixed.enabled;
    this.xaxisTooltip = null;
    this.yaxisTTEls = null;
    this.isBarShared = !w.globals.isBarHorizontal && this.tConfig.shared;
    this.lastHoverTime = Date.now();
    this.dimensionUpdateScheduled = false;
  }
  setupDimensionCache() {
    const w = this.w;
    const tooltipEl = this.getElTooltip();
    if (!tooltipEl) return;
    this.updateDimensionCache();
    if (typeof ResizeObserver !== "undefined" && !w.globals.resizeObserver) {
      w.globals.resizeObserver = new ResizeObserver(() => {
        if (!this.dimensionUpdateScheduled) {
          this.dimensionUpdateScheduled = true;
          requestAnimationFrame(() => {
            this.updateDimensionCache();
            this.dimensionUpdateScheduled = false;
          });
        }
      });
      w.globals.resizeObserver.observe(tooltipEl);
    }
  }
  updateDimensionCache() {
    const w = this.w;
    const tooltipEl = this.getElTooltip();
    if (!tooltipEl) return;
    const rect = tooltipEl.getBoundingClientRect();
    w.globals.dimensionCache.tooltip = {
      width: rect.width,
      height: rect.height,
      lastUpdate: Date.now()
    };
  }
  getCachedDimensions() {
    const w = this.w;
    if (w.globals.dimensionCache.tooltip) {
      const cache2 = w.globals.dimensionCache.tooltip;
      const age = Date.now() - cache2.lastUpdate;
      if (age < 1e3) {
        return {
          ttWidth: cache2.width,
          ttHeight: cache2.height
        };
      }
    }
    this.updateDimensionCache();
    const cache = w.globals.dimensionCache.tooltip;
    return cache ? {
      ttWidth: cache.width,
      ttHeight: cache.height
    } : { ttWidth: 0, ttHeight: 0 };
  }
  getElTooltip(ctx) {
    if (!ctx) ctx = this;
    if (!ctx.w.globals.dom.baseEl) return null;
    return ctx.w.globals.dom.baseEl.querySelector(".apexcharts-tooltip");
  }
  getElXCrosshairs() {
    return this.w.globals.dom.baseEl.querySelector(".apexcharts-xcrosshairs");
  }
  getElGrid() {
    return this.w.globals.dom.baseEl.querySelector(".apexcharts-grid");
  }
  drawTooltip(xyRatios) {
    let w = this.w;
    this.xyRatios = xyRatios;
    this.isXAxisTooltipEnabled = w.config.xaxis.tooltip.enabled && w.globals.axisCharts;
    this.yaxisTooltips = w.config.yaxis.map((y, i) => {
      return y.show && y.tooltip.enabled && w.globals.axisCharts ? true : false;
    });
    this.allTooltipSeriesGroups = [];
    if (!w.globals.axisCharts) {
      this.showTooltipTitle = false;
    }
    const tooltipEl = document.createElement("div");
    tooltipEl.classList.add("apexcharts-tooltip");
    if (w.config.tooltip.cssClass) {
      tooltipEl.classList.add(w.config.tooltip.cssClass);
    }
    tooltipEl.classList.add(`apexcharts-theme-${this.tConfig.theme || "light"}`);
    w.globals.dom.elWrap.appendChild(tooltipEl);
    if (w.globals.axisCharts) {
      this.axesTooltip.drawXaxisTooltip();
      this.axesTooltip.drawYaxisTooltip();
      this.axesTooltip.setXCrosshairWidth();
      this.axesTooltip.handleYCrosshair();
      let xAxis = new XAxis(this.ctx);
      this.xAxisTicksPositions = xAxis.getXAxisTicksPositions();
    }
    if ((w.globals.comboCharts || this.tConfig.intersect || w.config.chart.type === "rangeBar") && !this.tConfig.shared) {
      this.showOnIntersect = true;
    }
    if (w.config.markers.size === 0 || w.globals.markers.largestSize === 0) {
      this.marker.drawDynamicPoints(this);
    }
    if (w.globals.collapsedSeries.length === w.globals.series.length) return;
    this.dataPointsDividedHeight = w.globals.gridHeight / w.globals.dataPoints;
    this.dataPointsDividedWidth = w.globals.gridWidth / w.globals.dataPoints;
    if (this.showTooltipTitle) {
      this.tooltipTitle = document.createElement("div");
      this.tooltipTitle.classList.add("apexcharts-tooltip-title");
      this.tooltipTitle.style.fontFamily = this.tConfig.style.fontFamily || w.config.chart.fontFamily;
      this.tooltipTitle.style.fontSize = this.tConfig.style.fontSize;
      tooltipEl.appendChild(this.tooltipTitle);
    }
    let ttItemsCnt = w.globals.series.length;
    if ((w.globals.xyCharts || w.globals.comboCharts) && this.tConfig.shared) {
      if (!this.showOnIntersect) {
        ttItemsCnt = w.globals.series.length;
      } else {
        ttItemsCnt = 1;
      }
    }
    this.legendLabels = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-legend-text"
    );
    this.ttItems = this.createTTElements(ttItemsCnt);
    this.addSVGEvents();
    this.setupDimensionCache();
  }
  createTTElements(ttItemsCnt) {
    const w = this.w;
    let ttItems = [];
    const tooltipEl = this.getElTooltip();
    for (let i = 0; i < ttItemsCnt; i++) {
      let gTxt = document.createElement("div");
      gTxt.classList.add(
        "apexcharts-tooltip-series-group",
        `apexcharts-tooltip-series-group-${i}`
      );
      gTxt.style.order = w.config.tooltip.inverseOrder ? ttItemsCnt - i : i + 1;
      let point = document.createElement("span");
      point.classList.add("apexcharts-tooltip-marker");
      if (w.config.tooltip.fillSeriesColor) {
        point.style.backgroundColor = w.globals.colors[i];
      } else {
        point.style.color = w.globals.colors[i];
      }
      let mShape = w.config.markers.shape;
      let shape = mShape;
      if (Array.isArray(mShape)) {
        shape = mShape[i];
      }
      point.setAttribute("shape", shape);
      gTxt.appendChild(point);
      const gYZ = document.createElement("div");
      gYZ.classList.add("apexcharts-tooltip-text");
      gYZ.style.fontFamily = this.tConfig.style.fontFamily || w.config.chart.fontFamily;
      gYZ.style.fontSize = this.tConfig.style.fontSize;
      ["y", "goals", "z"].forEach((g) => {
        const gValText = document.createElement("div");
        gValText.classList.add(`apexcharts-tooltip-${g}-group`);
        let txtLabel = document.createElement("span");
        txtLabel.classList.add(`apexcharts-tooltip-text-${g}-label`);
        gValText.appendChild(txtLabel);
        let txtValue = document.createElement("span");
        txtValue.classList.add(`apexcharts-tooltip-text-${g}-value`);
        gValText.appendChild(txtValue);
        gYZ.appendChild(gValText);
      });
      gTxt.appendChild(gYZ);
      tooltipEl.appendChild(gTxt);
      ttItems.push(gTxt);
    }
    return ttItems;
  }
  addSVGEvents() {
    const w = this.w;
    let type = w.config.chart.type;
    const tooltipEl = this.getElTooltip();
    const commonBar = !!(type === "bar" || type === "candlestick" || type === "boxPlot" || type === "rangeBar");
    const chartWithmarkers = type === "area" || type === "line" || type === "scatter" || type === "bubble" || type === "radar";
    let hoverArea = w.globals.dom.Paper.node;
    const elGrid = this.getElGrid();
    if (elGrid) {
      this.seriesBound = elGrid.getBoundingClientRect();
    }
    let tooltipY = [];
    let tooltipX = [];
    let seriesHoverParams = {
      hoverArea,
      elGrid,
      tooltipEl,
      tooltipY,
      tooltipX,
      ttItems: this.ttItems
    };
    let points;
    if (w.globals.axisCharts) {
      if (chartWithmarkers) {
        points = w.globals.dom.baseEl.querySelectorAll(
          ".apexcharts-series[data\\:longestSeries='true'] .apexcharts-marker"
        );
      } else if (commonBar) {
        points = w.globals.dom.baseEl.querySelectorAll(
          ".apexcharts-series .apexcharts-bar-area, .apexcharts-series .apexcharts-candlestick-area, .apexcharts-series .apexcharts-boxPlot-area, .apexcharts-series .apexcharts-rangebar-area"
        );
      } else if (type === "heatmap" || type === "treemap") {
        points = w.globals.dom.baseEl.querySelectorAll(
          ".apexcharts-series .apexcharts-heatmap, .apexcharts-series .apexcharts-treemap"
        );
      }
      if (points && points.length) {
        for (let p = 0; p < points.length; p++) {
          tooltipY.push(points[p].getAttribute("cy"));
          tooltipX.push(points[p].getAttribute("cx"));
        }
      }
    }
    const validSharedChartTypes = w.globals.xyCharts && !this.showOnIntersect || w.globals.comboCharts && !this.showOnIntersect || commonBar && this.tooltipUtil.hasBars() && this.tConfig.shared;
    if (validSharedChartTypes) {
      this.addPathsEventListeners([hoverArea], seriesHoverParams);
    } else if (commonBar && !w.globals.comboCharts || chartWithmarkers && this.showOnIntersect) {
      this.addDatapointEventsListeners(seriesHoverParams);
    } else if (!w.globals.axisCharts || type === "heatmap" || type === "treemap") {
      let seriesAll = w.globals.dom.baseEl.querySelectorAll(".apexcharts-series");
      this.addPathsEventListeners(seriesAll, seriesHoverParams);
    }
    if (this.showOnIntersect) {
      let lineAreaPoints = w.globals.dom.baseEl.querySelectorAll(
        ".apexcharts-line-series .apexcharts-marker, .apexcharts-area-series .apexcharts-marker"
      );
      if (lineAreaPoints.length > 0) {
        this.addPathsEventListeners(lineAreaPoints, seriesHoverParams);
      }
      if (this.tooltipUtil.hasBars() && !this.tConfig.shared) {
        this.addDatapointEventsListeners(seriesHoverParams);
      }
    }
  }
  drawFixedTooltipRect() {
    let w = this.w;
    const tooltipEl = this.getElTooltip();
    let tooltipRect = tooltipEl.getBoundingClientRect();
    let ttWidth = tooltipRect.width + 10;
    let ttHeight = tooltipRect.height + 10;
    let x = this.tConfig.fixed.offsetX;
    let y = this.tConfig.fixed.offsetY;
    const fixed = this.tConfig.fixed.position.toLowerCase();
    if (fixed.indexOf("right") > -1) {
      x = x + w.globals.svgWidth - ttWidth + 10;
    }
    if (fixed.indexOf("bottom") > -1) {
      y = y + w.globals.svgHeight - ttHeight - 10;
    }
    tooltipEl.style.left = x + "px";
    tooltipEl.style.top = y + "px";
    return {
      x,
      y,
      ttWidth,
      ttHeight
    };
  }
  addDatapointEventsListeners(seriesHoverParams) {
    let w = this.w;
    let points = w.globals.dom.baseEl.querySelectorAll(
      ".apexcharts-series-markers .apexcharts-marker, .apexcharts-bar-area, .apexcharts-candlestick-area, .apexcharts-boxPlot-area, .apexcharts-rangebar-area"
    );
    this.addPathsEventListeners(points, seriesHoverParams);
  }
  addPathsEventListeners(paths, opts) {
    let self = this;
    for (let p = 0; p < paths.length; p++) {
      let extendedOpts = {
        paths: paths[p],
        tooltipEl: opts.tooltipEl,
        tooltipY: opts.tooltipY,
        tooltipX: opts.tooltipX,
        elGrid: opts.elGrid,
        hoverArea: opts.hoverArea,
        ttItems: opts.ttItems
      };
      let events = ["mousemove", "mouseup", "touchmove", "mouseout", "touchend"];
      events.map((ev) => {
        return paths[p].addEventListener(
          ev,
          self.onSeriesHover.bind(self, extendedOpts),
          { capture: false, passive: true }
        );
      });
    }
  }
  /*
   ** Check to see if the tooltips should be updated based on a mouse / touch event
   */
  onSeriesHover(opt, e) {
    const targetDelay = 20;
    const timeSinceLastUpdate = Date.now() - this.lastHoverTime;
    if (timeSinceLastUpdate >= targetDelay) {
      this.seriesHover(opt, e);
    } else {
      clearTimeout(this.seriesHoverTimeout);
      this.seriesHoverTimeout = setTimeout(() => {
        this.seriesHover(opt, e);
      }, targetDelay - timeSinceLastUpdate);
    }
  }
  /*
   ** The actual series hover function
   */
  seriesHover(opt, e) {
    this.lastHoverTime = Date.now();
    let chartGroups = [];
    const w = this.w;
    if (w.config.chart.group) {
      chartGroups = this.ctx.getGroupedCharts();
    }
    if (w.globals.axisCharts && (w.globals.minX === -Infinity && w.globals.maxX === Infinity || w.globals.dataPoints === 0)) {
      return;
    }
    if (chartGroups.length) {
      chartGroups.forEach((ch) => {
        const tooltipEl = this.getElTooltip(ch);
        const newOpts = {
          paths: opt.paths,
          tooltipEl,
          tooltipY: opt.tooltipY,
          tooltipX: opt.tooltipX,
          elGrid: opt.elGrid,
          hoverArea: opt.hoverArea,
          ttItems: ch.w.globals.tooltip.ttItems
        };
        if (ch.w.globals.minX === this.w.globals.minX && ch.w.globals.maxX === this.w.globals.maxX) {
          ch.w.globals.tooltip.seriesHoverByContext({
            chartCtx: ch,
            ttCtx: ch.w.globals.tooltip,
            opt: newOpts,
            e
          });
        }
      });
    } else {
      this.seriesHoverByContext({
        chartCtx: this.ctx,
        ttCtx: this.w.globals.tooltip,
        opt,
        e
      });
    }
  }
  seriesHoverByContext({ chartCtx, ttCtx, opt, e }) {
    let w = chartCtx.w;
    const tooltipEl = this.getElTooltip(chartCtx);
    if (!tooltipEl) return;
    const cachedDims = ttCtx.getCachedDimensions();
    ttCtx.tooltipRect = {
      x: 0,
      y: 0,
      ttWidth: cachedDims.ttWidth,
      ttHeight: cachedDims.ttHeight
    };
    ttCtx.e = e;
    if (ttCtx.tooltipUtil.hasBars() && !w.globals.comboCharts && !ttCtx.isBarShared) {
      if (this.tConfig.onDatasetHover.highlightDataSeries) {
        let series = new Series(chartCtx);
        series.toggleSeriesOnHover(e, e.target.parentNode);
      }
    }
    if (w.globals.axisCharts) {
      ttCtx.axisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect
      });
    } else {
      ttCtx.nonAxisChartsTooltips({
        e,
        opt,
        tooltipRect: ttCtx.tooltipRect
      });
    }
    if (ttCtx.fixedTooltip) {
      ttCtx.drawFixedTooltipRect();
    }
  }
  // tooltip handling for line/area/bar/columns/scatter
  axisChartsTooltips({ e, opt }) {
    let w = this.w;
    let x, y;
    let seriesBound = opt.elGrid.getBoundingClientRect();
    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;
    this.clientY = clientY;
    this.clientX = clientX;
    w.globals.capturedSeriesIndex = -1;
    w.globals.capturedDataPointIndex = -1;
    if (clientY < seriesBound.top || clientY > seriesBound.top + seriesBound.height) {
      this.handleMouseOut(opt);
      return;
    }
    if (Array.isArray(this.tConfig.enabledOnSeries) && !w.config.tooltip.shared) {
      const index = parseInt(opt.paths.getAttribute("index"), 10);
      if (this.tConfig.enabledOnSeries.indexOf(index) < 0) {
        this.handleMouseOut(opt);
        return;
      }
    }
    const tooltipEl = this.getElTooltip();
    const xcrosshairs = this.getElXCrosshairs();
    let syncedCharts = [];
    if (w.config.chart.group) {
      syncedCharts = this.ctx.getSyncedCharts();
    }
    let isStickyTooltip = w.globals.xyCharts || w.config.chart.type === "bar" && !w.globals.isBarHorizontal && this.tooltipUtil.hasBars() && this.tConfig.shared || w.globals.comboCharts && this.tooltipUtil.hasBars();
    if (e.type === "mousemove" || e.type === "touchmove" || e.type === "mouseup") {
      if (w.globals.collapsedSeries.length + w.globals.ancillaryCollapsedSeries.length === w.globals.series.length) {
        return;
      }
      if (xcrosshairs !== null) {
        xcrosshairs.classList.add("apexcharts-active");
      }
      const hasYAxisTooltip = this.yaxisTooltips.filter((b) => {
        return b === true;
      });
      if (this.ycrosshairs !== null && hasYAxisTooltip.length) {
        this.ycrosshairs.classList.add("apexcharts-active");
      }
      if (isStickyTooltip && !this.showOnIntersect || syncedCharts.length > 1) {
        this.handleStickyTooltip(e, clientX, clientY, opt);
      } else {
        if (w.config.chart.type === "heatmap" || w.config.chart.type === "treemap") {
          let markerXY = this.intersect.handleHeatTreeTooltip({
            e,
            opt,
            x,
            y,
            type: w.config.chart.type
          });
          x = markerXY.x;
          y = markerXY.y;
          tooltipEl.style.left = x + "px";
          tooltipEl.style.top = y + "px";
        } else {
          if (this.tooltipUtil.hasBars()) {
            this.intersect.handleBarTooltip({
              e,
              opt
            });
          }
          if (this.tooltipUtil.hasMarkers()) {
            this.intersect.handleMarkerTooltip({
              e,
              opt,
              x,
              y
            });
          }
        }
      }
      if (this.yaxisTooltips.length) {
        for (let yt = 0; yt < w.config.yaxis.length; yt++) {
          this.axesTooltip.drawYaxisTooltipText(yt, clientY, this.xyRatios);
        }
      }
      w.globals.dom.baseEl.classList.add("apexcharts-tooltip-active");
      opt.tooltipEl.classList.add("apexcharts-active");
    } else if (e.type === "mouseout" || e.type === "touchend") {
      this.handleMouseOut(opt);
    }
  }
  // tooltip handling for pie/donuts
  nonAxisChartsTooltips({ e, opt, tooltipRect }) {
    let w = this.w;
    let rel = opt.paths.getAttribute("rel");
    const tooltipEl = this.getElTooltip();
    let seriesBound = w.globals.dom.elWrap.getBoundingClientRect();
    if (e.type === "mousemove" || e.type === "touchmove") {
      w.globals.dom.baseEl.classList.add("apexcharts-tooltip-active");
      tooltipEl.classList.add("apexcharts-active");
      this.tooltipLabels.drawSeriesTexts({
        ttItems: opt.ttItems,
        i: parseInt(rel, 10) - 1,
        shared: false
      });
      let x = w.globals.clientX - seriesBound.left - tooltipRect.ttWidth / 2;
      let y = w.globals.clientY - seriesBound.top - tooltipRect.ttHeight - 10;
      tooltipEl.style.left = x + "px";
      tooltipEl.style.top = y + "px";
      if (w.config.legend.tooltipHoverFormatter) {
        let legendFormatter = w.config.legend.tooltipHoverFormatter;
        const i = rel - 1;
        const legendName = this.legendLabels[i].getAttribute("data:default-text");
        let text = legendFormatter(legendName, {
          seriesIndex: i,
          dataPointIndex: i,
          w
        });
        this.legendLabels[i].innerHTML = text;
      }
    } else if (e.type === "mouseout" || e.type === "touchend") {
      tooltipEl.classList.remove("apexcharts-active");
      w.globals.dom.baseEl.classList.remove("apexcharts-tooltip-active");
      if (w.config.legend.tooltipHoverFormatter) {
        this.legendLabels.forEach((l) => {
          const defaultText = l.getAttribute("data:default-text");
          l.innerHTML = decodeURIComponent(defaultText);
        });
      }
    }
  }
  handleStickyTooltip(e, clientX, clientY, opt) {
    const w = this.w;
    let capj = this.tooltipUtil.getNearestValues({
      context: this,
      hoverArea: opt.hoverArea,
      elGrid: opt.elGrid,
      clientX,
      clientY
    });
    let j2 = capj.j;
    let capturedSeries = capj.capturedSeries;
    if (w.globals.collapsedSeriesIndices.includes(capturedSeries))
      capturedSeries = null;
    const bounds = opt.elGrid.getBoundingClientRect();
    if (capj.hoverX < 0 || capj.hoverX > bounds.width) {
      this.handleMouseOut(opt);
      return;
    }
    if (capturedSeries !== null) {
      this.handleStickyCapturedSeries(e, capturedSeries, opt, j2);
    } else {
      if (this.tooltipUtil.isXoverlap(j2) || w.globals.isBarHorizontal) {
        const firstVisibleSeries = w.globals.series.findIndex(
          (s, i) => !w.globals.collapsedSeriesIndices.includes(i)
        );
        this.create(e, this, firstVisibleSeries, j2, opt.ttItems);
      }
    }
  }
  handleStickyCapturedSeries(e, capturedSeries, opt, j2) {
    const w = this.w;
    if (!this.tConfig.shared) {
      let ignoreNull = w.globals.series[capturedSeries][j2] === null;
      if (ignoreNull) {
        this.handleMouseOut(opt);
        return;
      }
    }
    if (typeof w.globals.series[capturedSeries][j2] !== "undefined") {
      if (this.tConfig.shared && this.tooltipUtil.isXoverlap(j2) && this.tooltipUtil.isInitialSeriesSameLen()) {
        this.create(e, this, capturedSeries, j2, opt.ttItems);
      } else {
        this.create(e, this, capturedSeries, j2, opt.ttItems, false);
      }
    } else {
      if (this.tooltipUtil.isXoverlap(j2)) {
        const firstVisibleSeries = w.globals.series.findIndex(
          (s, i) => !w.globals.collapsedSeriesIndices.includes(i)
        );
        this.create(e, this, firstVisibleSeries, j2, opt.ttItems);
      }
    }
  }
  deactivateHoverFilter() {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let allPaths = w.globals.dom.Paper.find(`.apexcharts-bar-area`);
    for (let b = 0; b < allPaths.length; b++) {
      graphics.pathMouseLeave(allPaths[b]);
    }
  }
  handleMouseOut(opt) {
    const w = this.w;
    const xcrosshairs = this.getElXCrosshairs();
    w.globals.dom.baseEl.classList.remove("apexcharts-tooltip-active");
    opt.tooltipEl.classList.remove("apexcharts-active");
    this.deactivateHoverFilter();
    if (w.config.chart.type !== "bubble") {
      this.marker.resetPointsSize();
    }
    if (xcrosshairs !== null) {
      xcrosshairs.classList.remove("apexcharts-active");
    }
    if (this.ycrosshairs !== null) {
      this.ycrosshairs.classList.remove("apexcharts-active");
    }
    if (this.isXAxisTooltipEnabled) {
      this.xaxisTooltip.classList.remove("apexcharts-active");
    }
    if (this.yaxisTooltips.length) {
      if (this.yaxisTTEls === null) {
        this.yaxisTTEls = w.globals.dom.baseEl.querySelectorAll(
          ".apexcharts-yaxistooltip"
        );
      }
      for (let i = 0; i < this.yaxisTTEls.length; i++) {
        this.yaxisTTEls[i].classList.remove("apexcharts-active");
      }
    }
    if (w.config.legend.tooltipHoverFormatter) {
      this.legendLabels.forEach((l) => {
        const defaultText = l.getAttribute("data:default-text");
        l.innerHTML = decodeURIComponent(defaultText);
      });
    }
  }
  markerClick(e, seriesIndex, dataPointIndex) {
    const w = this.w;
    if (typeof w.config.chart.events.markerClick === "function") {
      w.config.chart.events.markerClick(e, this.ctx, {
        seriesIndex,
        dataPointIndex,
        w
      });
    }
    this.ctx.events.fireEvent("markerClick", [
      e,
      this.ctx,
      { seriesIndex, dataPointIndex, w }
    ]);
  }
  create(e, context, capturedSeries, j2, ttItems, shared = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p;
    let w = this.w;
    let ttCtx = context;
    if (e.type === "mouseup") {
      this.markerClick(e, capturedSeries, j2);
    }
    if (shared === null) shared = this.tConfig.shared;
    const hasMarkers = this.tooltipUtil.hasMarkers(capturedSeries);
    const bars = this.tooltipUtil.getElBars();
    const handlePoints = () => {
      if (w.globals.markers.largestSize > 0) {
        ttCtx.marker.enlargePoints(j2);
      } else {
        ttCtx.tooltipPosition.moveDynamicPointsOnHover(j2);
      }
    };
    if (w.config.legend.tooltipHoverFormatter) {
      let legendFormatter = w.config.legend.tooltipHoverFormatter;
      let els = Array.from(this.legendLabels);
      els.forEach((l) => {
        const legendName = l.getAttribute("data:default-text");
        l.innerHTML = decodeURIComponent(legendName);
      });
      for (let i = 0; i < els.length; i++) {
        const l = els[i];
        const lsIndex = parseInt(l.getAttribute("i"), 10);
        const legendName = decodeURIComponent(
          l.getAttribute("data:default-text")
        );
        let text = legendFormatter(legendName, {
          seriesIndex: shared ? lsIndex : capturedSeries,
          dataPointIndex: j2,
          w
        });
        if (!shared) {
          l.innerHTML = lsIndex === capturedSeries ? text : legendName;
          if (capturedSeries === lsIndex) {
            break;
          }
        } else {
          l.innerHTML = w.globals.collapsedSeriesIndices.indexOf(lsIndex) < 0 ? text : legendName;
        }
      }
    }
    const commonSeriesTextsParams = __spreadValues(__spreadValues({
      ttItems,
      i: capturedSeries,
      j: j2
    }, typeof ((_d = (_c = (_b = (_a = w.globals.seriesRange) == null ? void 0 : _a[capturedSeries]) == null ? void 0 : _b[j2]) == null ? void 0 : _c.y[0]) == null ? void 0 : _d.y1) !== "undefined" && {
      y1: (_h = (_g = (_f = (_e = w.globals.seriesRange) == null ? void 0 : _e[capturedSeries]) == null ? void 0 : _f[j2]) == null ? void 0 : _g.y[0]) == null ? void 0 : _h.y1
    }), typeof ((_l = (_k = (_j = (_i = w.globals.seriesRange) == null ? void 0 : _i[capturedSeries]) == null ? void 0 : _j[j2]) == null ? void 0 : _k.y[0]) == null ? void 0 : _l.y2) !== "undefined" && {
      y2: (_p = (_o = (_n = (_m = w.globals.seriesRange) == null ? void 0 : _m[capturedSeries]) == null ? void 0 : _n[j2]) == null ? void 0 : _o.y[0]) == null ? void 0 : _p.y2
    });
    if (shared) {
      ttCtx.tooltipLabels.drawSeriesTexts(__spreadProps(__spreadValues({}, commonSeriesTextsParams), {
        shared: this.showOnIntersect ? false : this.tConfig.shared
      }));
      if (hasMarkers) {
        handlePoints();
      } else if (this.tooltipUtil.hasBars()) {
        this.barSeriesHeight = this.tooltipUtil.getBarsHeight(bars);
        if (this.barSeriesHeight > 0) {
          let graphics = new Graphics(this.ctx);
          let paths = w.globals.dom.Paper.find(`.apexcharts-bar-area[j='${j2}']`);
          this.deactivateHoverFilter();
          let points = ttCtx.tooltipUtil.getAllMarkers(true);
          if (points.length && !this.barSeriesHeight) {
            handlePoints();
          }
          ttCtx.tooltipPosition.moveStickyTooltipOverBars(j2, capturedSeries);
          for (let b = 0; b < paths.length; b++) {
            graphics.pathMouseEnter(paths[b]);
          }
        }
      }
    } else {
      ttCtx.tooltipLabels.drawSeriesTexts(__spreadValues({
        shared: false
      }, commonSeriesTextsParams));
      if (this.tooltipUtil.hasBars()) {
        ttCtx.tooltipPosition.moveStickyTooltipOverBars(j2, capturedSeries);
      }
      if (hasMarkers) {
        ttCtx.tooltipPosition.moveMarkers(capturedSeries, j2);
      }
    }
  }
}
const MINUTES_IN_DAY = 24 * 60;
const SECONDS_IN_DAY = MINUTES_IN_DAY * 60;
const MIN_ZOOM_DAYS = 10 / SECONDS_IN_DAY;
class TimeScale {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.timeScaleArray = [];
    this.utc = this.w.config.xaxis.labels.datetimeUTC;
  }
  calculateTimeScaleTicks(minX, maxX) {
    let w = this.w;
    if (w.globals.allSeriesCollapsed) {
      w.globals.labels = [];
      w.globals.timescaleLabels = [];
      return [];
    }
    let dt = new DateTime(this.ctx);
    const daysDiff = (maxX - minX) / (1e3 * SECONDS_IN_DAY);
    this.determineInterval(daysDiff);
    w.globals.disableZoomIn = false;
    w.globals.disableZoomOut = false;
    if (daysDiff < MIN_ZOOM_DAYS) {
      w.globals.disableZoomIn = true;
    } else if (daysDiff > 5e4) {
      w.globals.disableZoomOut = true;
    }
    const timeIntervals = dt.getTimeUnitsfromTimestamp(minX, maxX, this.utc);
    const daysWidthOnXAxis = w.globals.gridWidth / daysDiff;
    const hoursWidthOnXAxis = daysWidthOnXAxis / 24;
    const minutesWidthOnXAxis = hoursWidthOnXAxis / 60;
    const secondsWidthOnXAxis = minutesWidthOnXAxis / 60;
    let numberOfHours = Math.floor(daysDiff * 24);
    let numberOfMinutes = Math.floor(daysDiff * MINUTES_IN_DAY);
    let numberOfSeconds = Math.floor(daysDiff * SECONDS_IN_DAY);
    let numberOfDays = Math.floor(daysDiff);
    let numberOfMonths = Math.floor(daysDiff / 30);
    let numberOfYears = Math.floor(daysDiff / 365);
    const firstVal = {
      minMillisecond: timeIntervals.minMillisecond,
      minSecond: timeIntervals.minSecond,
      minMinute: timeIntervals.minMinute,
      minHour: timeIntervals.minHour,
      minDate: timeIntervals.minDate,
      minMonth: timeIntervals.minMonth,
      minYear: timeIntervals.minYear
    };
    let currentMillisecond = firstVal.minMillisecond;
    let currentSecond = firstVal.minSecond;
    let currentMinute = firstVal.minMinute;
    let currentHour = firstVal.minHour;
    let currentMonthDate = firstVal.minDate;
    let currentDate = firstVal.minDate;
    let currentMonth = firstVal.minMonth;
    let currentYear = firstVal.minYear;
    const params = {
      firstVal,
      currentMillisecond,
      currentSecond,
      currentMinute,
      currentHour,
      currentMonthDate,
      currentDate,
      currentMonth,
      currentYear,
      daysWidthOnXAxis,
      hoursWidthOnXAxis,
      minutesWidthOnXAxis,
      secondsWidthOnXAxis,
      numberOfSeconds,
      numberOfMinutes,
      numberOfHours,
      numberOfDays,
      numberOfMonths,
      numberOfYears
    };
    switch (this.tickInterval) {
      case "years": {
        this.generateYearScale(params);
        break;
      }
      case "months":
      case "half_year": {
        this.generateMonthScale(params);
        break;
      }
      case "months_days":
      case "months_fortnight":
      case "days":
      case "week_days": {
        this.generateDayScale(params);
        break;
      }
      case "hours": {
        this.generateHourScale(params);
        break;
      }
      case "minutes_fives":
      case "minutes":
        this.generateMinuteScale(params);
        break;
      case "seconds_tens":
      case "seconds_fives":
      case "seconds":
        this.generateSecondScale(params);
        break;
    }
    const adjustedMonthInTimeScaleArray = this.timeScaleArray.map((ts) => {
      let defaultReturn = {
        position: ts.position,
        unit: ts.unit,
        year: ts.year,
        day: ts.day ? ts.day : 1,
        hour: ts.hour ? ts.hour : 0,
        month: ts.month + 1
      };
      if (ts.unit === "month") {
        return __spreadProps(__spreadValues({}, defaultReturn), {
          day: 1,
          value: ts.value + 1
        });
      } else if (ts.unit === "day" || ts.unit === "hour") {
        return __spreadProps(__spreadValues({}, defaultReturn), {
          value: ts.value
        });
      } else if (ts.unit === "minute") {
        return __spreadProps(__spreadValues({}, defaultReturn), {
          value: ts.value,
          minute: ts.value
        });
      } else if (ts.unit === "second") {
        return __spreadProps(__spreadValues({}, defaultReturn), {
          value: ts.value,
          minute: ts.minute,
          second: ts.second
        });
      }
      return ts;
    });
    const filteredTimeScale = adjustedMonthInTimeScaleArray.filter((ts) => {
      let modulo = 1;
      let ticks = Math.ceil(w.globals.gridWidth / 120);
      let value = ts.value;
      if (w.config.xaxis.tickAmount !== void 0) {
        ticks = w.config.xaxis.tickAmount;
      }
      if (adjustedMonthInTimeScaleArray.length > ticks) {
        modulo = Math.floor(adjustedMonthInTimeScaleArray.length / ticks);
      }
      let shouldNotSkipUnit = false;
      let shouldNotPrint = false;
      switch (this.tickInterval) {
        case "years":
          if (ts.unit === "year") {
            shouldNotSkipUnit = true;
          }
          break;
        case "half_year":
          modulo = 7;
          if (ts.unit === "year") {
            shouldNotSkipUnit = true;
          }
          break;
        case "months":
          modulo = 1;
          if (ts.unit === "year") {
            shouldNotSkipUnit = true;
          }
          break;
        case "months_fortnight":
          modulo = 15;
          if (ts.unit === "year" || ts.unit === "month") {
            shouldNotSkipUnit = true;
          }
          if (value === 30) {
            shouldNotPrint = true;
          }
          break;
        case "months_days":
          modulo = 10;
          if (ts.unit === "month") {
            shouldNotSkipUnit = true;
          }
          if (value === 30) {
            shouldNotPrint = true;
          }
          break;
        case "week_days":
          modulo = 8;
          if (ts.unit === "month") {
            shouldNotSkipUnit = true;
          }
          break;
        case "days":
          modulo = 1;
          if (ts.unit === "month") {
            shouldNotSkipUnit = true;
          }
          break;
        case "hours":
          if (ts.unit === "day") {
            shouldNotSkipUnit = true;
          }
          break;
        case "minutes_fives":
          if (value % 5 !== 0) {
            shouldNotPrint = true;
          }
          break;
        case "seconds_tens":
          if (value % 10 !== 0) {
            shouldNotPrint = true;
          }
          break;
        case "seconds_fives":
          if (value % 5 !== 0) {
            shouldNotPrint = true;
          }
          break;
      }
      if (this.tickInterval === "hours" || this.tickInterval === "minutes_fives" || this.tickInterval === "seconds_tens" || this.tickInterval === "seconds_fives") {
        if (!shouldNotPrint) {
          return true;
        }
      } else {
        if ((value % modulo === 0 || shouldNotSkipUnit) && !shouldNotPrint) {
          return true;
        }
      }
    });
    return filteredTimeScale;
  }
  recalcDimensionsBasedOnFormat(filteredTimeScale, inverted) {
    const w = this.w;
    const reformattedTimescaleArray = this.formatDates(filteredTimeScale);
    const removedOverlappingTS = this.removeOverlappingTS(
      reformattedTimescaleArray
    );
    w.globals.timescaleLabels = removedOverlappingTS.slice();
    let dimensions = new Dimensions(this.ctx);
    dimensions.plotCoords();
  }
  determineInterval(daysDiff) {
    const yearsDiff = daysDiff / 365;
    const hoursDiff = daysDiff * 24;
    const minutesDiff = hoursDiff * 60;
    const secondsDiff = minutesDiff * 60;
    switch (true) {
      case yearsDiff > 5:
        this.tickInterval = "years";
        break;
      case daysDiff > 800:
        this.tickInterval = "half_year";
        break;
      case daysDiff > 180:
        this.tickInterval = "months";
        break;
      case daysDiff > 90:
        this.tickInterval = "months_fortnight";
        break;
      case daysDiff > 60:
        this.tickInterval = "months_days";
        break;
      case daysDiff > 30:
        this.tickInterval = "week_days";
        break;
      case daysDiff > 2:
        this.tickInterval = "days";
        break;
      case hoursDiff > 2.4:
        this.tickInterval = "hours";
        break;
      case minutesDiff > 15:
        this.tickInterval = "minutes_fives";
        break;
      case minutesDiff > 5:
        this.tickInterval = "minutes";
        break;
      case minutesDiff > 1:
        this.tickInterval = "seconds_tens";
        break;
      case secondsDiff > 20:
        this.tickInterval = "seconds_fives";
        break;
      default:
        this.tickInterval = "seconds";
        break;
    }
  }
  generateYearScale({
    firstVal,
    currentMonth,
    currentYear,
    daysWidthOnXAxis,
    numberOfYears
  }) {
    let firstTickValue = firstVal.minYear;
    let firstTickPosition = 0;
    const dt = new DateTime(this.ctx);
    let unit = "year";
    if (firstVal.minDate > 1 || firstVal.minMonth > 0) {
      let remainingDays = dt.determineRemainingDaysOfYear(
        firstVal.minYear,
        firstVal.minMonth,
        firstVal.minDate
      );
      let remainingDaysOfFirstYear = dt.determineDaysOfYear(firstVal.minYear) - remainingDays + 1;
      firstTickPosition = remainingDaysOfFirstYear * daysWidthOnXAxis;
      firstTickValue = firstVal.minYear + 1;
      this.timeScaleArray.push({
        position: firstTickPosition,
        value: firstTickValue,
        unit,
        year: firstTickValue,
        month: Utils$1.monthMod(currentMonth + 1)
      });
    } else if (firstVal.minDate === 1 && firstVal.minMonth === 0) {
      this.timeScaleArray.push({
        position: firstTickPosition,
        value: firstTickValue,
        unit,
        year: currentYear,
        month: Utils$1.monthMod(currentMonth + 1)
      });
    }
    let year = firstTickValue;
    let pos = firstTickPosition;
    for (let i = 0; i < numberOfYears; i++) {
      year++;
      pos = dt.determineDaysOfYear(year - 1) * daysWidthOnXAxis + pos;
      this.timeScaleArray.push({
        position: pos,
        value: year,
        unit,
        year,
        month: 1
      });
    }
  }
  generateMonthScale({
    firstVal,
    currentMonthDate,
    currentMonth,
    currentYear,
    daysWidthOnXAxis,
    numberOfMonths
  }) {
    let firstTickValue = currentMonth;
    let firstTickPosition = 0;
    const dt = new DateTime(this.ctx);
    let unit = "month";
    let yrCounter = 0;
    if (firstVal.minDate > 1) {
      let remainingDaysOfFirstMonth = dt.determineDaysOfMonths(currentMonth + 1, firstVal.minYear) - currentMonthDate + 1;
      firstTickPosition = remainingDaysOfFirstMonth * daysWidthOnXAxis;
      firstTickValue = Utils$1.monthMod(currentMonth + 1);
      let year = currentYear + yrCounter;
      let month2 = Utils$1.monthMod(firstTickValue);
      let value = firstTickValue;
      if (firstTickValue === 0) {
        unit = "year";
        value = year;
        month2 = 1;
        yrCounter += 1;
        year = year + yrCounter;
      }
      this.timeScaleArray.push({
        position: firstTickPosition,
        value,
        unit,
        year,
        month: month2
      });
    } else {
      this.timeScaleArray.push({
        position: firstTickPosition,
        value: firstTickValue,
        unit,
        year: currentYear,
        month: Utils$1.monthMod(currentMonth)
      });
    }
    let month = firstTickValue + 1;
    let pos = firstTickPosition;
    for (let i = 0, j2 = 1; i < numberOfMonths; i++, j2++) {
      month = Utils$1.monthMod(month);
      if (month === 0) {
        unit = "year";
        yrCounter += 1;
      } else {
        unit = "month";
      }
      let year = this._getYear(currentYear, month, yrCounter);
      pos = dt.determineDaysOfMonths(month, year) * daysWidthOnXAxis + pos;
      let monthVal = month === 0 ? year : month;
      this.timeScaleArray.push({
        position: pos,
        value: monthVal,
        unit,
        year,
        month: month === 0 ? 1 : month
      });
      month++;
    }
  }
  generateDayScale({
    firstVal,
    currentMonth,
    currentYear,
    hoursWidthOnXAxis,
    numberOfDays
  }) {
    const dt = new DateTime(this.ctx);
    let unit = "day";
    let firstTickValue = firstVal.minDate + 1;
    let date = firstTickValue;
    const changeMonth = (dateVal, month2, year) => {
      let monthdays = dt.determineDaysOfMonths(month2 + 1, year);
      if (dateVal > monthdays) {
        month2 = month2 + 1;
        date = 1;
        unit = "month";
        val = month2;
        return month2;
      }
      return month2;
    };
    let remainingHours = 24 - firstVal.minHour;
    let yrCounter = 0;
    let firstTickPosition = remainingHours * hoursWidthOnXAxis;
    let val = firstTickValue;
    let month = changeMonth(date, currentMonth, currentYear);
    if (firstVal.minHour === 0 && firstVal.minDate === 1) {
      firstTickPosition = 0;
      val = Utils$1.monthMod(firstVal.minMonth);
      unit = "month";
      date = firstVal.minDate;
    } else if (firstVal.minDate !== 1 && firstVal.minHour === 0 && firstVal.minMinute === 0) {
      firstTickPosition = 0;
      firstTickValue = firstVal.minDate;
      date = firstTickValue;
      val = firstTickValue;
      month = changeMonth(date, currentMonth, currentYear);
      if (val !== 1) {
        unit = "day";
      }
    }
    this.timeScaleArray.push({
      position: firstTickPosition,
      value: val,
      unit,
      year: this._getYear(currentYear, month, yrCounter),
      month: Utils$1.monthMod(month),
      day: date
    });
    let pos = firstTickPosition;
    for (let i = 0; i < numberOfDays; i++) {
      date += 1;
      unit = "day";
      month = changeMonth(
        date,
        month,
        this._getYear(currentYear, month, yrCounter)
      );
      let year = this._getYear(currentYear, month, yrCounter);
      pos = 24 * hoursWidthOnXAxis + pos;
      let value = date === 1 ? Utils$1.monthMod(month) : date;
      this.timeScaleArray.push({
        position: pos,
        value,
        unit,
        year,
        month: Utils$1.monthMod(month),
        day: value
      });
    }
  }
  generateHourScale({
    firstVal,
    currentDate,
    currentMonth,
    currentYear,
    minutesWidthOnXAxis,
    numberOfHours
  }) {
    const dt = new DateTime(this.ctx);
    let yrCounter = 0;
    let unit = "hour";
    const changeDate = (dateVal, month2) => {
      let monthdays = dt.determineDaysOfMonths(month2 + 1, currentYear);
      if (dateVal > monthdays) {
        date = 1;
        month2 = month2 + 1;
      }
      return { month: month2, date };
    };
    const changeMonth = (dateVal, month2) => {
      let monthdays = dt.determineDaysOfMonths(month2 + 1, currentYear);
      if (dateVal > monthdays) {
        month2 = month2 + 1;
        return month2;
      }
      return month2;
    };
    let remainingMins = 60 - (firstVal.minMinute + firstVal.minSecond / 60);
    let firstTickPosition = remainingMins * minutesWidthOnXAxis;
    let firstTickValue = firstVal.minHour + 1;
    let hour = firstTickValue;
    if (remainingMins === 60) {
      firstTickPosition = 0;
      firstTickValue = firstVal.minHour;
      hour = firstTickValue;
    }
    let date = currentDate;
    if (hour >= 24) {
      hour = 0;
      date += 1;
      unit = "day";
      firstTickValue = date;
    }
    const checkNextMonth = changeDate(date, currentMonth);
    let month = checkNextMonth.month;
    month = changeMonth(date, month);
    if (firstTickValue > 31) {
      date = 1;
      firstTickValue = date;
    }
    this.timeScaleArray.push({
      position: firstTickPosition,
      value: firstTickValue,
      unit,
      day: date,
      hour,
      year: currentYear,
      month: Utils$1.monthMod(month)
    });
    hour++;
    let pos = firstTickPosition;
    for (let i = 0; i < numberOfHours; i++) {
      unit = "hour";
      if (hour >= 24) {
        hour = 0;
        date += 1;
        unit = "day";
        const checkNextMonth2 = changeDate(date, month);
        month = checkNextMonth2.month;
        month = changeMonth(date, month);
      }
      let year = this._getYear(currentYear, month, yrCounter);
      pos = 60 * minutesWidthOnXAxis + pos;
      let val = hour === 0 ? date : hour;
      this.timeScaleArray.push({
        position: pos,
        value: val,
        unit,
        hour,
        day: date,
        year,
        month: Utils$1.monthMod(month)
      });
      hour++;
    }
  }
  generateMinuteScale({
    currentMillisecond,
    currentSecond,
    currentMinute,
    currentHour,
    currentDate,
    currentMonth,
    currentYear,
    minutesWidthOnXAxis,
    secondsWidthOnXAxis,
    numberOfMinutes
  }) {
    let yrCounter = 0;
    let unit = "minute";
    let remainingSecs = 60 - currentSecond;
    let firstTickPosition = (remainingSecs - currentMillisecond / 1e3) * secondsWidthOnXAxis;
    let minute = currentMinute + 1;
    let date = currentDate;
    let month = currentMonth;
    let year = currentYear;
    let hour = currentHour;
    let pos = firstTickPosition;
    for (let i = 0; i < numberOfMinutes; i++) {
      if (minute >= 60) {
        minute = 0;
        hour += 1;
        if (hour === 24) {
          hour = 0;
        }
      }
      this.timeScaleArray.push({
        position: pos,
        value: minute,
        unit,
        hour,
        minute,
        day: date,
        year: this._getYear(year, month, yrCounter),
        month: Utils$1.monthMod(month)
      });
      pos += minutesWidthOnXAxis;
      minute++;
    }
  }
  generateSecondScale({
    currentMillisecond,
    currentSecond,
    currentMinute,
    currentHour,
    currentDate,
    currentMonth,
    currentYear,
    secondsWidthOnXAxis,
    numberOfSeconds
  }) {
    let yrCounter = 0;
    let unit = "second";
    const remainingMillisecs = 1e3 - currentMillisecond;
    let firstTickPosition = remainingMillisecs / 1e3 * secondsWidthOnXAxis;
    let second = currentSecond + 1;
    let minute = currentMinute;
    let date = currentDate;
    let month = currentMonth;
    let year = currentYear;
    let hour = currentHour;
    let pos = firstTickPosition;
    for (let i = 0; i < numberOfSeconds; i++) {
      if (second >= 60) {
        minute++;
        second = 0;
        if (minute >= 60) {
          hour++;
          minute = 0;
          if (hour === 24) {
            hour = 0;
          }
        }
      }
      this.timeScaleArray.push({
        position: pos,
        value: second,
        unit,
        hour,
        minute,
        second,
        day: date,
        year: this._getYear(year, month, yrCounter),
        month: Utils$1.monthMod(month)
      });
      pos += secondsWidthOnXAxis;
      second++;
    }
  }
  createRawDateString(ts, value) {
    let raw = ts.year;
    if (ts.month === 0) {
      ts.month = 1;
    }
    raw += "-" + ("0" + ts.month.toString()).slice(-2);
    if (ts.unit === "day") {
      raw += ts.unit === "day" ? "-" + ("0" + value).slice(-2) : "-01";
    } else {
      raw += "-" + ("0" + (ts.day ? ts.day : "1")).slice(-2);
    }
    if (ts.unit === "hour") {
      raw += ts.unit === "hour" ? "T" + ("0" + value).slice(-2) : "T00";
    } else {
      raw += "T" + ("0" + (ts.hour ? ts.hour : "0")).slice(-2);
    }
    if (ts.unit === "minute") {
      raw += ":" + ("0" + value).slice(-2);
    } else {
      raw += ":" + (ts.minute ? ("0" + ts.minute).slice(-2) : "00");
    }
    if (ts.unit === "second") {
      raw += ":" + ("0" + value).slice(-2);
    } else {
      raw += ":00";
    }
    if (this.utc) {
      raw += ".000Z";
    }
    return raw;
  }
  formatDates(filteredTimeScale) {
    const w = this.w;
    const reformattedTimescaleArray = filteredTimeScale.map((ts) => {
      let value = ts.value.toString();
      let dt = new DateTime(this.ctx);
      const raw = this.createRawDateString(ts, value);
      let dateToFormat = dt.getDate(dt.parseDate(raw));
      if (!this.utc) {
        dateToFormat = dt.getDate(dt.parseDateWithTimezone(raw));
      }
      if (w.config.xaxis.labels.format === void 0) {
        let customFormat = "dd MMM";
        const dtFormatter = w.config.xaxis.labels.datetimeFormatter;
        if (ts.unit === "year") customFormat = dtFormatter.year;
        if (ts.unit === "month") customFormat = dtFormatter.month;
        if (ts.unit === "day") customFormat = dtFormatter.day;
        if (ts.unit === "hour") customFormat = dtFormatter.hour;
        if (ts.unit === "minute") customFormat = dtFormatter.minute;
        if (ts.unit === "second") customFormat = dtFormatter.second;
        value = dt.formatDate(dateToFormat, customFormat);
      } else {
        value = dt.formatDate(dateToFormat, w.config.xaxis.labels.format);
      }
      return {
        dateString: raw,
        position: ts.position,
        value,
        unit: ts.unit,
        year: ts.year,
        month: ts.month
      };
    });
    return reformattedTimescaleArray;
  }
  removeOverlappingTS(arr) {
    const graphics = new Graphics(this.ctx);
    let equalLabelLengthFlag = false;
    let constantLabelWidth;
    if (arr.length > 0 && // check arr length
    arr[0].value && // check arr[0] contains value
    arr.every((lb) => lb.value.length === arr[0].value.length)) {
      equalLabelLengthFlag = true;
      constantLabelWidth = graphics.getTextRects(arr[0].value).width;
    }
    let lastDrawnIndex = 0;
    let filteredArray = arr.map((item, index) => {
      if (index > 0 && this.w.config.xaxis.labels.hideOverlappingLabels) {
        const prevLabelWidth = !equalLabelLengthFlag ? graphics.getTextRects(arr[lastDrawnIndex].value).width : constantLabelWidth;
        const prevPos = arr[lastDrawnIndex].position;
        const pos = item.position;
        if (pos > prevPos + prevLabelWidth + 10) {
          lastDrawnIndex = index;
          return item;
        } else {
          return null;
        }
      } else {
        return item;
      }
    });
    filteredArray = filteredArray.filter((f) => f !== null);
    return filteredArray;
  }
  _getYear(currentYear, month, yrCounter) {
    return currentYear + Math.floor(month / 12) + yrCounter;
  }
}
class BarDataLabels {
  constructor(barCtx) {
    this.w = barCtx.w;
    this.barCtx = barCtx;
    this.totalFormatter = this.w.config.plotOptions.bar.dataLabels.total.formatter;
    if (!this.totalFormatter) {
      this.totalFormatter = this.w.config.dataLabels.formatter;
    }
  }
  /** handleBarDataLabels is used to calculate the positions for the data-labels
   * It also sets the element's data attr for bars and calls drawCalculatedBarDataLabels()
   * After calculating, it also calls the function to draw data labels
   * @memberof Bar
   * @param {object} {barProps} most of the bar properties used throughout the bar
   * drawing function
   * @return {object} dataLabels node-element which you can append later
   **/
  handleBarDataLabels(opts) {
    let {
      x,
      y,
      y1,
      y2,
      i,
      j: j2,
      realIndex: realIndex2,
      columnGroupIndex,
      series,
      barHeight,
      barWidth,
      barXPosition,
      barYPosition,
      visibleSeries
    } = opts;
    let w = this.w;
    let graphics = new Graphics(this.barCtx.ctx);
    let strokeWidth = Array.isArray(this.barCtx.strokeWidth) ? this.barCtx.strokeWidth[realIndex2] : this.barCtx.strokeWidth;
    let bcx;
    let bcy;
    if (w.globals.isXNumeric && !w.globals.isBarHorizontal) {
      bcx = x + parseFloat(barWidth * (visibleSeries + 1));
      bcy = y + parseFloat(barHeight * (visibleSeries + 1)) - strokeWidth;
    } else {
      bcx = x + parseFloat(barWidth * visibleSeries);
      bcy = y + parseFloat(barHeight * visibleSeries);
    }
    let dataLabels = null;
    let totalDataLabels = null;
    let dataLabelsX = x;
    let dataLabelsY = y;
    let dataLabelsPos = {};
    let dataLabelsConfig = w.config.dataLabels;
    let barDataLabelsConfig = this.barCtx.barOptions.dataLabels;
    let barTotalDataLabelsConfig = this.barCtx.barOptions.dataLabels.total;
    if (typeof barYPosition !== "undefined" && this.barCtx.isRangeBar) {
      bcy = barYPosition;
      dataLabelsY = barYPosition;
    }
    if (typeof barXPosition !== "undefined" && this.barCtx.isVerticalGroupedRangeBar) {
      bcx = barXPosition;
      dataLabelsX = barXPosition;
    }
    const offX = dataLabelsConfig.offsetX;
    const offY = dataLabelsConfig.offsetY;
    let textRects = {
      width: 0,
      height: 0
    };
    if (w.config.dataLabels.enabled) {
      const yLabel = w.globals.series[i][j2];
      textRects = graphics.getTextRects(
        w.config.dataLabels.formatter ? w.config.dataLabels.formatter(yLabel, __spreadProps(__spreadValues({}, w), {
          seriesIndex: i,
          dataPointIndex: j2,
          w
        })) : w.globals.yLabelFormatters[0](yLabel),
        parseFloat(dataLabelsConfig.style.fontSize)
      );
    }
    const params = {
      x,
      y,
      i,
      j: j2,
      realIndex: realIndex2,
      columnGroupIndex,
      bcx,
      bcy,
      barHeight,
      barWidth,
      textRects,
      strokeWidth,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY
    };
    if (this.barCtx.isHorizontal) {
      dataLabelsPos = this.calculateBarsDataLabelsPosition(params);
    } else {
      dataLabelsPos = this.calculateColumnsDataLabelsPosition(params);
    }
    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: this.barCtx.isRangeBar ? [y1, y2] : w.config.chart.stackType === "100%" ? series[realIndex2][j2] : w.globals.series[realIndex2][j2],
      i: realIndex2,
      j: j2,
      barWidth,
      barHeight,
      textRects,
      dataLabelsConfig
    });
    if (w.config.chart.stacked && barTotalDataLabelsConfig.enabled) {
      totalDataLabels = this.drawTotalDataLabels({
        x: dataLabelsPos.totalDataLabelsX,
        y: dataLabelsPos.totalDataLabelsY,
        barWidth,
        barHeight,
        realIndex: realIndex2,
        textAnchor: dataLabelsPos.totalDataLabelsAnchor,
        val: this.getStackedTotalDataLabel({ realIndex: realIndex2, j: j2 }),
        dataLabelsConfig,
        barTotalDataLabelsConfig
      });
    }
    return {
      dataLabelsPos,
      dataLabels,
      totalDataLabels
    };
  }
  getStackedTotalDataLabel({ realIndex: realIndex2, j: j2 }) {
    const w = this.w;
    let val = this.barCtx.stackedSeriesTotals[j2];
    if (this.totalFormatter) {
      val = this.totalFormatter(val, __spreadProps(__spreadValues({}, w), {
        seriesIndex: realIndex2,
        dataPointIndex: j2,
        w
      }));
    }
    return val;
  }
  calculateColumnsDataLabelsPosition(opts) {
    const w = this.w;
    let {
      i,
      j: j2,
      realIndex: realIndex2,
      columnGroupIndex,
      y,
      bcx,
      barWidth,
      barHeight,
      textRects,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      strokeWidth,
      offX,
      offY
    } = opts;
    let totalDataLabelsY;
    let totalDataLabelsX;
    let totalDataLabelsAnchor = "middle";
    let totalDataLabelsBcx = bcx;
    barHeight = Math.abs(barHeight);
    let vertical = w.config.plotOptions.bar.dataLabels.orientation === "vertical";
    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j: j2
    });
    bcx = bcx - strokeWidth / 2;
    let dataPointsDividedWidth = w.globals.gridWidth / w.globals.dataPoints;
    if (this.barCtx.isVerticalGroupedRangeBar) {
      dataLabelsX += barWidth / 2;
    } else {
      if (w.globals.isXNumeric) {
        dataLabelsX = bcx - barWidth / 2 + offX;
      } else {
        dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX;
      }
      if (!w.config.chart.stacked && zeroEncounters > 0 && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        dataLabelsX -= barWidth * zeroEncounters;
      }
    }
    if (vertical) {
      const offsetDLX = 2;
      dataLabelsX = dataLabelsX + textRects.height / 2 - strokeWidth / 2 - offsetDLX;
    }
    let valIsNegative = w.globals.series[i][j2] < 0;
    let newY = y;
    if (this.barCtx.isReversed) {
      newY = y + (valIsNegative ? barHeight : -barHeight);
    }
    switch (barDataLabelsConfig.position) {
      case "center":
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + offY;
          } else {
            dataLabelsY = newY + barHeight / 2 - offY;
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + textRects.height / 2 + offY;
          } else {
            dataLabelsY = newY + barHeight / 2 + textRects.height / 2 - offY;
          }
        }
        break;
      case "bottom":
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight + offY;
          } else {
            dataLabelsY = newY + barHeight - offY;
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight + textRects.height + strokeWidth + offY;
          } else {
            dataLabelsY = newY + barHeight - textRects.height / 2 + strokeWidth - offY;
          }
        }
        break;
      case "top":
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY + offY;
          } else {
            dataLabelsY = newY - offY;
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - textRects.height / 2 - offY;
          } else {
            dataLabelsY = newY + textRects.height + offY;
          }
        }
        break;
    }
    let lowestPrevY = newY;
    w.globals.seriesGroups.forEach((sg) => {
      var _a;
      (_a = this.barCtx[sg.join(",")]) == null ? void 0 : _a.prevY.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevY = Math.max(arr[j2], lowestPrevY);
        } else {
          lowestPrevY = Math.min(arr[j2], lowestPrevY);
        }
      });
    });
    if (this.barCtx.lastActiveBarSerieIndex === realIndex2 && barTotalDataLabelsConfig.enabled) {
      const ADDITIONAL_OFFY = 18;
      const graphics = new Graphics(this.barCtx.ctx);
      const totalLabeltextRects = graphics.getTextRects(
        this.getStackedTotalDataLabel({ realIndex: realIndex2, j: j2 }),
        dataLabelsConfig.fontSize
      );
      if (valIsNegative) {
        totalDataLabelsY = lowestPrevY - totalLabeltextRects.height / 2 - offY - barTotalDataLabelsConfig.offsetY + ADDITIONAL_OFFY;
      } else {
        totalDataLabelsY = lowestPrevY + totalLabeltextRects.height + offY + barTotalDataLabelsConfig.offsetY - ADDITIONAL_OFFY;
      }
      let xDivision = dataPointsDividedWidth;
      totalDataLabelsX = totalDataLabelsBcx + (w.globals.isXNumeric ? -barWidth * w.globals.barGroups.length / 2 : w.globals.barGroups.length * barWidth / 2 - (w.globals.barGroups.length - 1) * barWidth - xDivision) + barTotalDataLabelsConfig.offsetX;
    }
    if (!w.config.chart.stacked) {
      if (dataLabelsY < 0) {
        dataLabelsY = 0 + strokeWidth;
      } else if (dataLabelsY + textRects.height / 3 > w.globals.gridHeight) {
        dataLabelsY = w.globals.gridHeight - strokeWidth;
      }
    }
    return {
      bcx,
      bcy: y,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor
    };
  }
  calculateBarsDataLabelsPosition(opts) {
    const w = this.w;
    let {
      x,
      i,
      j: j2,
      realIndex: realIndex2,
      bcy,
      barHeight,
      barWidth,
      textRects,
      dataLabelsX,
      strokeWidth,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY
    } = opts;
    let dataPointsDividedHeight = w.globals.gridHeight / w.globals.dataPoints;
    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j: j2
    });
    barWidth = Math.abs(barWidth);
    let dataLabelsY = bcy - (this.barCtx.isRangeBar ? 0 : dataPointsDividedHeight) + barHeight / 2 + textRects.height / 2 + offY - 3;
    if (!w.config.chart.stacked && zeroEncounters > 0 && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
      dataLabelsY -= barHeight * zeroEncounters;
    }
    let totalDataLabelsX;
    let totalDataLabelsY;
    let totalDataLabelsAnchor = "start";
    let valIsNegative = w.globals.series[i][j2] < 0;
    let newX = x;
    if (this.barCtx.isReversed) {
      newX = x + (valIsNegative ? -barWidth : barWidth);
      totalDataLabelsAnchor = valIsNegative ? "start" : "end";
    }
    switch (barDataLabelsConfig.position) {
      case "center":
        if (valIsNegative) {
          dataLabelsX = newX + barWidth / 2 - offX;
        } else {
          dataLabelsX = Math.max(textRects.width / 2, newX - barWidth / 2) + offX;
        }
        break;
      case "bottom":
        if (valIsNegative) {
          dataLabelsX = newX + barWidth - strokeWidth - offX;
        } else {
          dataLabelsX = newX - barWidth + strokeWidth + offX;
        }
        break;
      case "top":
        if (valIsNegative) {
          dataLabelsX = newX - strokeWidth - offX;
        } else {
          dataLabelsX = newX - strokeWidth + offX;
        }
        break;
    }
    let lowestPrevX = newX;
    w.globals.seriesGroups.forEach((sg) => {
      var _a;
      (_a = this.barCtx[sg.join(",")]) == null ? void 0 : _a.prevX.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevX = Math.min(arr[j2], lowestPrevX);
        } else {
          lowestPrevX = Math.max(arr[j2], lowestPrevX);
        }
      });
    });
    if (this.barCtx.lastActiveBarSerieIndex === realIndex2 && barTotalDataLabelsConfig.enabled) {
      const graphics = new Graphics(this.barCtx.ctx);
      const totalLabeltextRects = graphics.getTextRects(
        this.getStackedTotalDataLabel({ realIndex: realIndex2, j: j2 }),
        dataLabelsConfig.fontSize
      );
      if (valIsNegative) {
        totalDataLabelsX = lowestPrevX - strokeWidth - offX - barTotalDataLabelsConfig.offsetX;
        totalDataLabelsAnchor = "end";
      } else {
        totalDataLabelsX = lowestPrevX + offX + barTotalDataLabelsConfig.offsetX + (this.barCtx.isReversed ? -(barWidth + strokeWidth) : strokeWidth);
      }
      totalDataLabelsY = dataLabelsY - textRects.height / 2 + totalLabeltextRects.height / 2 + barTotalDataLabelsConfig.offsetY + strokeWidth;
      if (w.globals.barGroups.length > 1) {
        totalDataLabelsY = totalDataLabelsY - w.globals.barGroups.length / 2 * (barHeight / 2);
      }
    }
    if (!w.config.chart.stacked) {
      if (dataLabelsConfig.textAnchor === "start") {
        if (dataLabelsX - textRects.width < 0) {
          dataLabelsX = valIsNegative ? textRects.width + strokeWidth : strokeWidth;
        } else if (dataLabelsX + textRects.width > w.globals.gridWidth) {
          dataLabelsX = valIsNegative ? w.globals.gridWidth - strokeWidth : w.globals.gridWidth - textRects.width - strokeWidth;
        }
      } else if (dataLabelsConfig.textAnchor === "middle") {
        if (dataLabelsX - textRects.width / 2 < 0) {
          dataLabelsX = textRects.width / 2 + strokeWidth;
        } else if (dataLabelsX + textRects.width / 2 > w.globals.gridWidth) {
          dataLabelsX = w.globals.gridWidth - textRects.width / 2 - strokeWidth;
        }
      } else if (dataLabelsConfig.textAnchor === "end") {
        if (dataLabelsX < 1) {
          dataLabelsX = textRects.width + strokeWidth;
        } else if (dataLabelsX + 1 > w.globals.gridWidth) {
          dataLabelsX = w.globals.gridWidth - textRects.width - strokeWidth;
        }
      }
    }
    return {
      bcx: x,
      bcy,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor
    };
  }
  drawCalculatedDataLabels({
    x,
    y,
    val,
    i,
    // = realIndex
    j: j2,
    textRects,
    barHeight,
    barWidth,
    dataLabelsConfig
  }) {
    const w = this.w;
    let rotate = "rotate(0)";
    if (w.config.plotOptions.bar.dataLabels.orientation === "vertical")
      rotate = `rotate(-90, ${x}, ${y})`;
    const dataLabels = new DataLabels(this.barCtx.ctx);
    const graphics = new Graphics(this.barCtx.ctx);
    const formatter = dataLabelsConfig.formatter;
    let elDataLabelsWrap = null;
    const isSeriesNotCollapsed = w.globals.collapsedSeriesIndices.indexOf(i) > -1;
    if (dataLabelsConfig.enabled && !isSeriesNotCollapsed) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels",
        transform: rotate
      });
      let text = "";
      if (typeof val !== "undefined") {
        text = formatter(val, __spreadProps(__spreadValues({}, w), {
          seriesIndex: i,
          dataPointIndex: j2,
          w
        }));
      }
      if (!val && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        text = "";
      }
      let valIsNegative = w.globals.series[i][j2] < 0;
      let position = w.config.plotOptions.bar.dataLabels.position;
      if (w.config.plotOptions.bar.dataLabels.orientation === "vertical") {
        if (position === "top") {
          if (valIsNegative) dataLabelsConfig.textAnchor = "end";
          else dataLabelsConfig.textAnchor = "start";
        }
        if (position === "center") {
          dataLabelsConfig.textAnchor = "middle";
        }
        if (position === "bottom") {
          if (valIsNegative) dataLabelsConfig.textAnchor = "end";
          else dataLabelsConfig.textAnchor = "start";
        }
      }
      if (this.barCtx.isRangeBar && this.barCtx.barOptions.dataLabels.hideOverflowingLabels) {
        const txRect = graphics.getTextRects(
          text,
          parseFloat(dataLabelsConfig.style.fontSize)
        );
        if (barWidth < txRect.width) {
          text = "";
        }
      }
      if (w.config.chart.stacked && this.barCtx.barOptions.dataLabels.hideOverflowingLabels) {
        if (this.barCtx.isHorizontal) {
          if (textRects.width / 1.6 > Math.abs(barWidth)) {
            text = "";
          }
        } else {
          if (textRects.height / 1.6 > Math.abs(barHeight)) {
            text = "";
          }
        }
      }
      let modifiedDataLabelsConfig = __spreadValues({}, dataLabelsConfig);
      if (this.barCtx.isHorizontal) {
        if (val < 0) {
          if (dataLabelsConfig.textAnchor === "start") {
            modifiedDataLabelsConfig.textAnchor = "end";
          } else if (dataLabelsConfig.textAnchor === "end") {
            modifiedDataLabelsConfig.textAnchor = "start";
          }
        }
      }
      dataLabels.plotDataLabelsText({
        x,
        y,
        text,
        i,
        j: j2,
        parent: elDataLabelsWrap,
        dataLabelsConfig: modifiedDataLabelsConfig,
        alwaysDrawDataLabel: true,
        offsetCorrection: true
      });
    }
    return elDataLabelsWrap;
  }
  drawTotalDataLabels({
    x,
    y,
    val,
    realIndex: realIndex2,
    textAnchor,
    barTotalDataLabelsConfig
  }) {
    this.w;
    const graphics = new Graphics(this.barCtx.ctx);
    let totalDataLabelText;
    if (barTotalDataLabelsConfig.enabled && typeof x !== "undefined" && typeof y !== "undefined" && this.barCtx.lastActiveBarSerieIndex === realIndex2) {
      totalDataLabelText = graphics.drawText({
        x,
        y,
        foreColor: barTotalDataLabelsConfig.style.color,
        text: val,
        textAnchor,
        fontFamily: barTotalDataLabelsConfig.style.fontFamily,
        fontSize: barTotalDataLabelsConfig.style.fontSize,
        fontWeight: barTotalDataLabelsConfig.style.fontWeight
      });
    }
    return totalDataLabelText;
  }
}
let Helpers$1 = class Helpers4 {
  constructor(barCtx) {
    this.w = barCtx.w;
    this.barCtx = barCtx;
  }
  initVariables(series) {
    const w = this.w;
    this.barCtx.series = series;
    this.barCtx.totalItems = 0;
    this.barCtx.seriesLen = 0;
    this.barCtx.visibleI = -1;
    this.barCtx.visibleItems = 1;
    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.barCtx.seriesLen = this.barCtx.seriesLen + 1;
        this.barCtx.totalItems += series[sl].length;
      }
      if (w.globals.isXNumeric) {
        for (let j2 = 0; j2 < series[sl].length; j2++) {
          if (w.globals.seriesX[sl][j2] > w.globals.minX && w.globals.seriesX[sl][j2] < w.globals.maxX) {
            this.barCtx.visibleItems++;
          }
        }
      } else {
        this.barCtx.visibleItems = w.globals.dataPoints;
      }
    }
    this.arrBorderRadius = this.createBorderRadiusArr(w.globals.series);
    if (Utils$1.isSafari()) {
      this.arrBorderRadius = this.arrBorderRadius.map(
        (brArr) => brArr.map((_) => "none")
      );
    }
    if (this.barCtx.seriesLen === 0) {
      this.barCtx.seriesLen = 1;
    }
    this.barCtx.zeroSerieses = [];
    if (!w.globals.comboCharts) {
      this.checkZeroSeries({ series });
    }
  }
  initialPositions(realIndex2) {
    let w = this.w;
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW;
    let dataPoints = w.globals.dataPoints;
    if (this.barCtx.isRangeBar) {
      dataPoints = w.globals.labels.length;
    }
    let seriesLen = this.barCtx.seriesLen;
    if (w.config.plotOptions.bar.rangeBarGroupRows) {
      seriesLen = 1;
    }
    if (this.barCtx.isHorizontal) {
      yDivision = w.globals.gridHeight / dataPoints;
      barHeight = yDivision / seriesLen;
      if (w.globals.isXNumeric) {
        yDivision = w.globals.gridHeight / this.barCtx.totalItems;
        barHeight = yDivision / this.barCtx.seriesLen;
      }
      barHeight = barHeight * parseInt(this.barCtx.barOptions.barHeight, 10) / 100;
      if (String(this.barCtx.barOptions.barHeight).indexOf("%") === -1) {
        barHeight = parseInt(this.barCtx.barOptions.barHeight, 10);
      }
      zeroW = this.barCtx.baseLineInvertedY + w.globals.padHorizontal + (this.barCtx.isReversed ? w.globals.gridWidth : 0) - (this.barCtx.isReversed ? this.barCtx.baseLineInvertedY * 2 : 0);
      if (this.barCtx.isFunnel) {
        zeroW = w.globals.gridWidth / 2;
      }
      y = (yDivision - barHeight * this.barCtx.seriesLen) / 2;
    } else {
      xDivision = w.globals.gridWidth / this.barCtx.visibleItems;
      if (w.config.xaxis.convertedCatToNumeric) {
        xDivision = w.globals.gridWidth / w.globals.dataPoints;
      }
      barWidth = xDivision / seriesLen * parseInt(this.barCtx.barOptions.columnWidth, 10) / 100;
      if (w.globals.isXNumeric) {
        let xRatio = this.barCtx.xRatio;
        if (w.globals.minXDiff && w.globals.minXDiff !== 0.5 && w.globals.minXDiff / xRatio > 0) {
          xDivision = w.globals.minXDiff / xRatio;
        }
        barWidth = xDivision / seriesLen * parseInt(this.barCtx.barOptions.columnWidth, 10) / 100;
        if (barWidth < 1) {
          barWidth = 1;
        }
      }
      if (String(this.barCtx.barOptions.columnWidth).indexOf("%") === -1) {
        barWidth = parseInt(this.barCtx.barOptions.columnWidth, 10);
      }
      zeroH = w.globals.gridHeight - this.barCtx.baseLineY[this.barCtx.translationsIndex] - (this.barCtx.isReversed ? w.globals.gridHeight : 0) + (this.barCtx.isReversed ? this.barCtx.baseLineY[this.barCtx.translationsIndex] * 2 : 0);
      if (w.globals.isXNumeric) {
        const xForNumericX = this.barCtx.getBarXForNumericXAxis({
          x,
          j: 0,
          realIndex: realIndex2,
          barWidth
        });
        x = xForNumericX.x;
      } else {
        x = w.globals.padHorizontal + Utils$1.noExponents(xDivision - barWidth * this.barCtx.seriesLen) / 2;
      }
    }
    w.globals.barHeight = barHeight;
    w.globals.barWidth = barWidth;
    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight,
      barWidth,
      zeroH,
      zeroW
    };
  }
  initializeStackedPrevVars(ctx) {
    const w = ctx.w;
    w.globals.seriesGroups.forEach((group) => {
      if (!ctx[group]) ctx[group] = {};
      ctx[group].prevY = [];
      ctx[group].prevX = [];
      ctx[group].prevYF = [];
      ctx[group].prevXF = [];
      ctx[group].prevYVal = [];
      ctx[group].prevXVal = [];
    });
  }
  initializeStackedXYVars(ctx) {
    const w = ctx.w;
    w.globals.seriesGroups.forEach((group) => {
      if (!ctx[group]) ctx[group] = {};
      ctx[group].xArrj = [];
      ctx[group].xArrjF = [];
      ctx[group].xArrjVal = [];
      ctx[group].yArrj = [];
      ctx[group].yArrjF = [];
      ctx[group].yArrjVal = [];
    });
  }
  getPathFillColor(series, i, j2, realIndex2) {
    var _a, _b, _c, _d;
    const w = this.w;
    let fill = this.barCtx.ctx.fill;
    let fillColor = null;
    let seriesNumber = this.barCtx.barOptions.distributed ? j2 : i;
    let useRangeColor = false;
    if (this.barCtx.barOptions.colors.ranges.length > 0) {
      const colorRange = this.barCtx.barOptions.colors.ranges;
      colorRange.map((range) => {
        if (series[i][j2] >= range.from && series[i][j2] <= range.to) {
          fillColor = range.color;
          useRangeColor = true;
        }
      });
    }
    let pathFill = fill.fillPath({
      seriesNumber: this.barCtx.barOptions.distributed ? seriesNumber : realIndex2,
      dataPointIndex: j2,
      color: fillColor,
      value: series[i][j2],
      fillConfig: (_a = w.config.series[i].data[j2]) == null ? void 0 : _a.fill,
      fillType: ((_c = (_b = w.config.series[i].data[j2]) == null ? void 0 : _b.fill) == null ? void 0 : _c.type) ? (_d = w.config.series[i].data[j2]) == null ? void 0 : _d.fill.type : Array.isArray(w.config.fill.type) ? w.config.fill.type[realIndex2] : w.config.fill.type
    });
    return {
      color: pathFill,
      useRangeColor
    };
  }
  getStrokeWidth(i, j2, realIndex2) {
    let strokeWidth = 0;
    const w = this.w;
    if (typeof this.barCtx.series[i][j2] === "undefined" || this.barCtx.series[i][j2] === null || w.config.chart.type === "bar" && !this.barCtx.series[i][j2]) {
      this.barCtx.isNullValue = true;
    } else {
      this.barCtx.isNullValue = false;
    }
    if (w.config.stroke.show) {
      if (!this.barCtx.isNullValue) {
        strokeWidth = Array.isArray(this.barCtx.strokeWidth) ? this.barCtx.strokeWidth[realIndex2] : this.barCtx.strokeWidth;
      }
    }
    return strokeWidth;
  }
  createBorderRadiusArr(series) {
    var _a;
    const w = this.w;
    const alwaysApplyRadius = !this.w.config.chart.stacked || w.config.plotOptions.bar.borderRadius <= 0;
    const numSeries = series.length;
    const numColumns = ((_a = series[0]) == null ? void 0 : _a.length) | 0;
    const output = Array.from(
      { length: numSeries },
      () => Array(numColumns).fill(alwaysApplyRadius ? "top" : "none")
    );
    if (alwaysApplyRadius) return output;
    const chartType = this.w.config.chart.type;
    for (let j2 = 0; j2 < numColumns; j2++) {
      let positiveIndices = [];
      let negativeIndices = [];
      let nonZeroCount = 0;
      for (let i = 0; i < numSeries; i++) {
        const value = series[i][j2];
        if (value > 0) {
          positiveIndices.push(i);
          nonZeroCount++;
        } else if (value < 0) {
          negativeIndices.push(i);
          nonZeroCount++;
        }
      }
      if (positiveIndices.length > 0 && negativeIndices.length === 0) {
        if (positiveIndices.length === 1) {
          output[positiveIndices[0]][j2] = chartType === "bar" && numColumns === 1 ? "top" : "both";
        } else {
          const firstPositiveIndex = positiveIndices[0];
          const lastPositiveIndex = positiveIndices[positiveIndices.length - 1];
          for (let i of positiveIndices) {
            if (i === firstPositiveIndex) {
              output[i][j2] = chartType === "bar" && numColumns === 1 ? "top" : "bottom";
            } else if (i === lastPositiveIndex) {
              output[i][j2] = "top";
            } else {
              output[i][j2] = "none";
            }
          }
        }
      } else if (negativeIndices.length > 0 && positiveIndices.length === 0) {
        if (negativeIndices.length === 1) {
          output[negativeIndices[0]][j2] = "both";
        } else {
          const highestNegativeIndex = Math.max(...negativeIndices);
          const lowestNegativeIndex = Math.min(...negativeIndices);
          for (let i of negativeIndices) {
            if (i === highestNegativeIndex) {
              output[i][j2] = "bottom";
            } else if (i === lowestNegativeIndex) {
              output[i][j2] = "top";
            } else {
              output[i][j2] = "none";
            }
          }
        }
      } else if (positiveIndices.length > 0 && negativeIndices.length > 0) {
        const lastPositiveIndex = positiveIndices[positiveIndices.length - 1];
        for (let i of positiveIndices) {
          if (i === lastPositiveIndex) {
            output[i][j2] = "top";
          } else {
            output[i][j2] = "none";
          }
        }
        const highestNegativeIndex = Math.max(...negativeIndices);
        for (let i of negativeIndices) {
          if (i === highestNegativeIndex) {
            output[i][j2] = "bottom";
          } else {
            output[i][j2] = "none";
          }
        }
      } else if (nonZeroCount === 1) {
        const index = positiveIndices[0] || negativeIndices[0];
        output[index][j2] = "both";
      }
    }
    return output;
  }
  barBackground({ j: j2, i, x1, x2, y1, y2, elSeries }) {
    const w = this.w;
    const graphics = new Graphics(this.barCtx.ctx);
    const sr = new Series(this.barCtx.ctx);
    let activeSeriesIndex = sr.getActiveConfigSeriesIndex();
    if (this.barCtx.barOptions.colors.backgroundBarColors.length > 0 && activeSeriesIndex === i) {
      if (j2 >= this.barCtx.barOptions.colors.backgroundBarColors.length) {
        j2 %= this.barCtx.barOptions.colors.backgroundBarColors.length;
      }
      let bcolor = this.barCtx.barOptions.colors.backgroundBarColors[j2];
      let rect = graphics.drawRect(
        typeof x1 !== "undefined" ? x1 : 0,
        typeof y1 !== "undefined" ? y1 : 0,
        typeof x2 !== "undefined" ? x2 : w.globals.gridWidth,
        typeof y2 !== "undefined" ? y2 : w.globals.gridHeight,
        this.barCtx.barOptions.colors.backgroundBarRadius,
        bcolor,
        this.barCtx.barOptions.colors.backgroundBarOpacity
      );
      elSeries.add(rect);
      rect.node.classList.add("apexcharts-backgroundBar");
    }
  }
  getColumnPaths({
    barWidth,
    barXPosition,
    y1,
    y2,
    strokeWidth,
    isReversed,
    series,
    seriesGroup,
    realIndex: realIndex2,
    i,
    j: j2,
    w
  }) {
    var _a;
    const graphics = new Graphics(this.barCtx.ctx);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex2] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    let bW = barWidth;
    let bXP = barXPosition;
    if ((_a = w.config.series[realIndex2].data[j2]) == null ? void 0 : _a.columnWidthOffset) {
      bXP = barXPosition - w.config.series[realIndex2].data[j2].columnWidthOffset / 2;
      bW = barWidth + w.config.series[realIndex2].data[j2].columnWidthOffset;
    }
    let strokeCenter = strokeWidth / 2;
    const x1 = bXP + strokeCenter;
    const x2 = bXP + bW - strokeCenter;
    let direction = (series[i][j2] >= 0 ? 1 : -1) * (isReversed ? -1 : 1);
    y1 += 1e-3 - strokeCenter * direction;
    y2 += 1e-3 + strokeCenter * direction;
    let pathTo = graphics.move(x1, y1);
    let pathFrom = graphics.move(x1, y1);
    const sl = graphics.line(x2, y1);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex2, j2, false);
    }
    pathTo = pathTo + graphics.line(x1, y2) + graphics.line(x2, y2) + sl + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex2][j2] === "both" ? " Z" : " z");
    pathFrom = pathFrom + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex2][j2] === "both" ? " Z" : " z");
    if (this.arrBorderRadius[realIndex2][j2] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      );
    }
    if (w.config.chart.stacked) {
      let _ctx = this.barCtx;
      _ctx = this.barCtx[seriesGroup];
      _ctx.yArrj.push(y2 - strokeCenter * direction);
      _ctx.yArrjF.push(Math.abs(y1 - y2 + strokeWidth * direction));
      _ctx.yArrjVal.push(this.barCtx.series[i][j2]);
    }
    return {
      pathTo,
      pathFrom
    };
  }
  getBarpaths({
    barYPosition,
    barHeight,
    x1,
    x2,
    strokeWidth,
    isReversed,
    series,
    seriesGroup,
    realIndex: realIndex2,
    i,
    j: j2,
    w
  }) {
    var _a;
    const graphics = new Graphics(this.barCtx.ctx);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex2] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    let bYP = barYPosition;
    let bH = barHeight;
    if ((_a = w.config.series[realIndex2].data[j2]) == null ? void 0 : _a.barHeightOffset) {
      bYP = barYPosition - w.config.series[realIndex2].data[j2].barHeightOffset / 2;
      bH = barHeight + w.config.series[realIndex2].data[j2].barHeightOffset;
    }
    let strokeCenter = strokeWidth / 2;
    const y1 = bYP + strokeCenter;
    const y2 = bYP + bH - strokeCenter;
    let direction = (series[i][j2] >= 0 ? 1 : -1) * (isReversed ? -1 : 1);
    x1 += 1e-3 + strokeCenter * direction;
    x2 += 1e-3 - strokeCenter * direction;
    let pathTo = graphics.move(x1, y1);
    let pathFrom = graphics.move(x1, y1);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex2, j2, false);
    }
    const sl = graphics.line(x1, y2);
    pathTo = pathTo + graphics.line(x2, y1) + graphics.line(x2, y2) + sl + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex2][j2] === "both" ? " Z" : " z");
    pathFrom = pathFrom + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex2][j2] === "both" ? " Z" : " z");
    if (this.arrBorderRadius[realIndex2][j2] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      );
    }
    if (w.config.chart.stacked) {
      let _ctx = this.barCtx;
      _ctx = this.barCtx[seriesGroup];
      _ctx.xArrj.push(x2 + strokeCenter * direction);
      _ctx.xArrjF.push(Math.abs(x1 - x2 - strokeWidth * direction));
      _ctx.xArrjVal.push(this.barCtx.series[i][j2]);
    }
    return {
      pathTo,
      pathFrom
    };
  }
  checkZeroSeries({ series }) {
    let w = this.w;
    for (let zs = 0; zs < series.length; zs++) {
      let total = 0;
      for (let zsj = 0; zsj < series[w.globals.maxValsInArrayIndex].length; zsj++) {
        total += series[zs][zsj];
      }
      if (total === 0) {
        this.barCtx.zeroSerieses.push(zs);
      }
    }
  }
  getXForValue(value, zeroW, zeroPositionForNull = true) {
    let xForVal = zeroPositionForNull ? zeroW : null;
    if (typeof value !== "undefined" && value !== null) {
      xForVal = zeroW + value / this.barCtx.invertedYRatio - (this.barCtx.isReversed ? value / this.barCtx.invertedYRatio : 0) * 2;
    }
    return xForVal;
  }
  getYForValue(value, zeroH, translationsIndex, zeroPositionForNull = true) {
    let yForVal = zeroPositionForNull ? zeroH : null;
    if (typeof value !== "undefined" && value !== null) {
      yForVal = zeroH - value / this.barCtx.yRatio[translationsIndex] + (this.barCtx.isReversed ? value / this.barCtx.yRatio[translationsIndex] : 0) * 2;
    }
    return yForVal;
  }
  getGoalValues(type, zeroW, zeroH, i, j2, translationsIndex) {
    const w = this.w;
    let goals = [];
    const pushGoal = (value, attrs) => {
      goals.push({
        [type]: type === "x" ? this.getXForValue(value, zeroW, false) : this.getYForValue(value, zeroH, translationsIndex, false),
        attrs
      });
    };
    if (w.globals.seriesGoals[i] && w.globals.seriesGoals[i][j2] && Array.isArray(w.globals.seriesGoals[i][j2])) {
      w.globals.seriesGoals[i][j2].forEach((goal) => {
        pushGoal(goal.value, goal);
      });
    }
    if (this.barCtx.barOptions.isDumbbell && w.globals.seriesRange.length) {
      let colors = this.barCtx.barOptions.dumbbellColors ? this.barCtx.barOptions.dumbbellColors : w.globals.colors;
      const commonAttrs = {
        strokeHeight: type === "x" ? 0 : w.globals.markers.size[i],
        strokeWidth: type === "x" ? w.globals.markers.size[i] : 0,
        strokeDashArray: 0,
        strokeLineCap: "round",
        strokeColor: Array.isArray(colors[i]) ? colors[i][0] : colors[i]
      };
      pushGoal(w.globals.seriesRangeStart[i][j2], commonAttrs);
      pushGoal(w.globals.seriesRangeEnd[i][j2], __spreadProps(__spreadValues({}, commonAttrs), {
        strokeColor: Array.isArray(colors[i]) ? colors[i][1] : colors[i]
      }));
    }
    return goals;
  }
  drawGoalLine({
    barXPosition,
    barYPosition,
    goalX,
    goalY,
    barWidth,
    barHeight
  }) {
    let graphics = new Graphics(this.barCtx.ctx);
    const lineGroup = graphics.group({
      className: "apexcharts-bar-goals-groups"
    });
    lineGroup.node.classList.add("apexcharts-element-hidden");
    this.barCtx.w.globals.delayedElements.push({
      el: lineGroup.node
    });
    lineGroup.attr(
      "clip-path",
      `url(#gridRectMarkerMask${this.barCtx.w.globals.cuid})`
    );
    let line = null;
    if (this.barCtx.isHorizontal) {
      if (Array.isArray(goalX)) {
        goalX.forEach((goal) => {
          if (goal.x >= -1 && goal.x <= graphics.w.globals.gridWidth + 1) {
            let sHeight = typeof goal.attrs.strokeHeight !== "undefined" ? goal.attrs.strokeHeight : barHeight / 2;
            let y = barYPosition + sHeight + barHeight / 2;
            line = graphics.drawLine(
              goal.x,
              y - sHeight * 2,
              goal.x,
              y,
              goal.attrs.strokeColor ? goal.attrs.strokeColor : void 0,
              goal.attrs.strokeDashArray,
              goal.attrs.strokeWidth ? goal.attrs.strokeWidth : 2,
              goal.attrs.strokeLineCap
            );
            lineGroup.add(line);
          }
        });
      }
    } else {
      if (Array.isArray(goalY)) {
        goalY.forEach((goal) => {
          if (goal.y >= -1 && goal.y <= graphics.w.globals.gridHeight + 1) {
            let sWidth = typeof goal.attrs.strokeWidth !== "undefined" ? goal.attrs.strokeWidth : barWidth / 2;
            let x = barXPosition + sWidth + barWidth / 2;
            line = graphics.drawLine(
              x - sWidth * 2,
              goal.y,
              x,
              goal.y,
              goal.attrs.strokeColor ? goal.attrs.strokeColor : void 0,
              goal.attrs.strokeDashArray,
              goal.attrs.strokeHeight ? goal.attrs.strokeHeight : 2,
              goal.attrs.strokeLineCap
            );
            lineGroup.add(line);
          }
        });
      }
    }
    return lineGroup;
  }
  drawBarShadow({ prevPaths, currPaths, color }) {
    const w = this.w;
    const { x: prevX2, x1: prevX1, barYPosition: prevY1 } = prevPaths;
    const { x: currX2, x1: currX1, barYPosition: currY1 } = currPaths;
    const prevY2 = prevY1 + currPaths.barHeight;
    const graphics = new Graphics(this.barCtx.ctx);
    const utils = new Utils$1();
    const shadowPath = graphics.move(prevX1, prevY2) + graphics.line(prevX2, prevY2) + graphics.line(currX2, currY1) + graphics.line(currX1, currY1) + graphics.line(prevX1, prevY2) + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
    return graphics.drawPath({
      d: shadowPath,
      fill: utils.shadeColor(0.5, Utils$1.rgb2hex(color)),
      stroke: "none",
      strokeWidth: 0,
      fillOpacity: 1,
      classes: "apexcharts-bar-shadow apexcharts-decoration-element"
    });
  }
  getZeroValueEncounters({ i, j: j2 }) {
    var _a;
    const w = this.w;
    let nonZeroColumns = 0;
    let zeroEncounters = 0;
    let seriesIndices = w.config.plotOptions.bar.horizontal ? w.globals.series.map((_, _i) => _i) : ((_a = w.globals.columnSeries) == null ? void 0 : _a.i.map((_i) => _i)) || [];
    seriesIndices.forEach((_si) => {
      let val = w.globals.seriesPercent[_si][j2];
      if (val) {
        nonZeroColumns++;
      }
      if (_si < i && val === 0) {
        zeroEncounters++;
      }
    });
    return {
      nonZeroColumns,
      zeroEncounters
    };
  }
  getGroupIndex(seriesIndex) {
    const w = this.w;
    let groupIndex = w.globals.seriesGroups.findIndex(
      (group) => (
        // w.config.series[i].name may be undefined, so use
        // w.globals.seriesNames[i], which has default names for those
        // series. w.globals.seriesGroups[] uses the same default naming.
        group.indexOf(w.globals.seriesNames[seriesIndex]) > -1
      )
    );
    let cGI = this.barCtx.columnGroupIndices;
    let columnGroupIndex = cGI.indexOf(groupIndex);
    if (columnGroupIndex < 0) {
      cGI.push(groupIndex);
      columnGroupIndex = cGI.length - 1;
    }
    return { groupIndex, columnGroupIndex };
  }
};
class Bar {
  constructor(ctx, xyRatios) {
    this.ctx = ctx;
    this.w = ctx.w;
    const w = this.w;
    this.barOptions = w.config.plotOptions.bar;
    this.isHorizontal = this.barOptions.horizontal;
    this.strokeWidth = w.config.stroke.width;
    this.isNullValue = false;
    this.isRangeBar = w.globals.seriesRange.length && this.isHorizontal;
    this.isVerticalGroupedRangeBar = !w.globals.isBarHorizontal && w.globals.seriesRange.length && w.config.plotOptions.bar.rangeBarGroupRows;
    this.isFunnel = this.barOptions.isFunnel;
    this.xyRatios = xyRatios;
    if (this.xyRatios !== null) {
      this.xRatio = xyRatios.xRatio;
      this.yRatio = xyRatios.yRatio;
      this.invertedXRatio = xyRatios.invertedXRatio;
      this.invertedYRatio = xyRatios.invertedYRatio;
      this.baseLineY = xyRatios.baseLineY;
      this.baseLineInvertedY = xyRatios.baseLineInvertedY;
    }
    this.yaxisIndex = 0;
    this.translationsIndex = 0;
    this.seriesLen = 0;
    this.pathArr = [];
    const ser = new Series(this.ctx);
    this.lastActiveBarSerieIndex = ser.getActiveConfigSeriesIndex("desc", [
      "bar",
      "column"
    ]);
    this.columnGroupIndices = [];
    const barSeriesIndices = ser.getBarSeriesIndices();
    const coreUtils = new CoreUtils(this.ctx);
    this.stackedSeriesTotals = coreUtils.getStackedSeriesTotals(
      this.w.config.series.map((s, i) => {
        return barSeriesIndices.indexOf(i) === -1 ? i : -1;
      }).filter((s) => {
        return s !== -1;
      })
    );
    this.barHelpers = new Helpers$1(this);
  }
  /** primary draw method which is called on bar object
   * @memberof Bar
   * @param {array} series - user supplied series values
   * @param {int} seriesIndex - the index by which series will be drawn on the svg
   * @return {node} element which is supplied to parent chart draw method for appending
   **/
  draw(series, seriesIndex) {
    var _a;
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    const coreUtils = new CoreUtils(this.ctx);
    series = coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    let ret = graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    if (w.config.dataLabels.enabled) {
      if (this.totalItems > this.barOptions.dataLabels.maxItems) {
        console.warn(
          "WARNING: DataLabels are enabled but there are too many to display. This may cause performance issue when rendering - ApexCharts"
        );
      }
    }
    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let x, y, xDivision, yDivision, zeroH, zeroW;
      let yArrj = [];
      let xArrj = [];
      let realIndex2 = w.globals.comboCharts ? seriesIndex[i] : i;
      let { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex2);
      let elSeries = graphics.group({
        class: `apexcharts-series`,
        rel: i + 1,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[realIndex2]),
        "data:realIndex": realIndex2
      });
      this.ctx.series.addCollapsedClassToSeries(elSeries, realIndex2);
      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1;
      }
      let barHeight = 0;
      let barWidth = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex2];
        this.translationsIndex = realIndex2;
      }
      let translationsIndex = this.translationsIndex;
      this.isReversed = w.config.yaxis[this.yaxisIndex] && w.config.yaxis[this.yaxisIndex].reversed;
      let initPositions = this.barHelpers.initialPositions(realIndex2);
      y = initPositions.y;
      barHeight = initPositions.barHeight;
      yDivision = initPositions.yDivision;
      zeroW = initPositions.zeroW;
      x = initPositions.x;
      barWidth = initPositions.barWidth;
      xDivision = initPositions.xDivision;
      zeroH = initPositions.zeroH;
      if (!this.isHorizontal) {
        xArrj.push(x + barWidth / 2);
      }
      let elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex2
      });
      w.globals.delayedElements.push({
        el: elDataLabelsWrap.node
      });
      elDataLabelsWrap.node.classList.add("apexcharts-element-hidden");
      let elGoalsMarkers = graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      let elBarShadows = graphics.group({
        class: "apexcharts-bar-shadows"
      });
      w.globals.delayedElements.push({
        el: elBarShadows.node
      });
      elBarShadows.node.classList.add("apexcharts-element-hidden");
      for (let j2 = 0; j2 < series[i].length; j2++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j2, realIndex2);
        let paths = null;
        const pathsParams = {
          indexes: {
            i,
            j: j2,
            realIndex: realIndex2,
            translationsIndex,
            bc
          },
          x,
          y,
          strokeWidth,
          elSeries
        };
        if (this.isHorizontal) {
          paths = this.drawBarPaths(__spreadProps(__spreadValues({}, pathsParams), {
            barHeight,
            zeroW,
            yDivision
          }));
          barWidth = this.series[i][j2] / this.invertedYRatio;
        } else {
          paths = this.drawColumnPaths(__spreadProps(__spreadValues({}, pathsParams), {
            xDivision,
            barWidth,
            zeroH
          }));
          barHeight = this.series[i][j2] / this.yRatio[translationsIndex];
        }
        let pathFill = this.barHelpers.getPathFillColor(series, i, j2, realIndex2);
        if (this.isFunnel && this.barOptions.isFunnel3d && this.pathArr.length && j2 > 0) {
          const barShadow = this.barHelpers.drawBarShadow({
            color: typeof pathFill.color === "string" && ((_a = pathFill.color) == null ? void 0 : _a.indexOf("url")) === -1 ? pathFill.color : Utils$1.hexToRgba(w.globals.colors[i]),
            prevPaths: this.pathArr[this.pathArr.length - 1],
            currPaths: paths
          });
          elBarShadows.add(barShadow);
          if (w.config.chart.dropShadow.enabled) {
            const filters = new Filters(this.ctx);
            filters.dropShadow(barShadow, w.config.chart.dropShadow, realIndex2);
          }
        }
        this.pathArr.push(paths);
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        });
        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine);
        }
        y = paths.y;
        x = paths.x;
        if (j2 > 0) {
          xArrj.push(x + barWidth / 2);
        }
        yArrj.push(y);
        this.renderSeries(__spreadProps(__spreadValues({
          realIndex: realIndex2,
          pathFill: pathFill.color
        }, pathFill.useRangeColor ? { lineFill: pathFill.color } : {}), {
          j: j2,
          i,
          columnGroupIndex,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          barHeight: Math.abs(paths.barHeight ? paths.barHeight : barHeight),
          barWidth: Math.abs(paths.barWidth ? paths.barWidth : barWidth),
          elDataLabelsWrap,
          elGoalsMarkers,
          elBarShadows,
          visibleSeries: this.visibleI,
          type: "bar"
        }));
      }
      w.globals.seriesXvalues[realIndex2] = xArrj;
      w.globals.seriesYvalues[realIndex2] = yArrj;
      ret.add(elSeries);
    }
    return ret;
  }
  renderSeries({
    realIndex: realIndex2,
    pathFill,
    lineFill,
    j: j2,
    i,
    columnGroupIndex,
    pathFrom,
    pathTo,
    strokeWidth,
    elSeries,
    x,
    // x pos
    y,
    // y pos
    y1,
    // absolute value
    y2,
    // absolute value
    series,
    barHeight,
    barWidth,
    barXPosition,
    barYPosition,
    elDataLabelsWrap,
    elGoalsMarkers,
    elBarShadows,
    visibleSeries,
    type,
    classes
  }) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    let skipDrawing = false;
    if (!elSeries._bindingsDelegated) {
      elSeries._bindingsDelegated = true;
      graphics.setupEventDelegation(
        elSeries,
        `.apexcharts-${type}-area`
      );
    }
    if (!lineFill) {
      let fetchColor = function(i2) {
        const exp = w.config.stroke.colors;
        let c;
        if (Array.isArray(exp) && exp.length > 0) {
          c = exp[i2];
          if (!c) c = "";
          if (typeof c === "function") {
            return c({
              value: w.globals.series[i2][j2],
              dataPointIndex: j2,
              w
            });
          }
        }
        return c;
      };
      const checkAvailableColor = typeof w.globals.stroke.colors[realIndex2] === "function" ? fetchColor(realIndex2) : w.globals.stroke.colors[realIndex2];
      lineFill = this.barOptions.distributed ? w.globals.stroke.colors[j2] : checkAvailableColor;
    }
    let barDataLabels = new BarDataLabels(this);
    let dataLabelsObj = barDataLabels.handleBarDataLabels({
      x,
      y,
      y1,
      y2,
      i,
      j: j2,
      series,
      realIndex: realIndex2,
      columnGroupIndex,
      barHeight,
      barWidth,
      barXPosition,
      barYPosition,
      visibleSeries
    });
    if (!w.globals.isBarHorizontal) {
      if (dataLabelsObj.dataLabelsPos.dataLabelsX + Math.max(barWidth, w.globals.barPadForNumericAxis) < 0 || dataLabelsObj.dataLabelsPos.dataLabelsX - Math.max(barWidth, w.globals.barPadForNumericAxis) > w.globals.gridWidth) {
        skipDrawing = true;
      }
    }
    if (w.config.series[i].data[j2] && w.config.series[i].data[j2].strokeColor) {
      lineFill = w.config.series[i].data[j2].strokeColor;
    }
    if (this.isNullValue) {
      pathFill = "none";
    }
    let delay = j2 / w.config.chart.animations.animateGradually.delay * (w.config.chart.animations.speed / w.globals.dataPoints) / 2.4;
    if (!skipDrawing) {
      let renderedPath = graphics.renderPaths({
        i,
        j: j2,
        realIndex: realIndex2,
        pathFrom,
        pathTo,
        stroke: lineFill,
        strokeWidth,
        strokeLineCap: w.config.stroke.lineCap,
        fill: pathFill,
        animationDelay: delay,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
        className: `apexcharts-${type}-area ${classes}`,
        chartType: type,
        bindEventsOnPaths: false
      });
      renderedPath.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      const forecast = w.config.forecastDataPoints;
      if (forecast.count > 0) {
        if (j2 >= w.globals.dataPoints - forecast.count) {
          renderedPath.node.setAttribute("stroke-dasharray", forecast.dashArray);
          renderedPath.node.setAttribute("stroke-width", forecast.strokeWidth);
          renderedPath.node.setAttribute("fill-opacity", forecast.fillOpacity);
        }
      }
      if (typeof y1 !== "undefined" && typeof y2 !== "undefined") {
        renderedPath.attr("data-range-y1", y1);
        renderedPath.attr("data-range-y2", y2);
      }
      const filters = new Filters(this.ctx);
      filters.setSelectionFilter(renderedPath, realIndex2, j2);
      elSeries.add(renderedPath);
      renderedPath.attr({
        cy: dataLabelsObj.dataLabelsPos.bcy,
        cx: dataLabelsObj.dataLabelsPos.bcx,
        j: j2,
        val: w.globals.series[i][j2],
        barHeight,
        barWidth
      });
      if (dataLabelsObj.dataLabels !== null) {
        elDataLabelsWrap.add(dataLabelsObj.dataLabels);
      }
      if (dataLabelsObj.totalDataLabels) {
        elDataLabelsWrap.add(dataLabelsObj.totalDataLabels);
      }
      elSeries.add(elDataLabelsWrap);
      if (elGoalsMarkers) {
        elSeries.add(elGoalsMarkers);
      }
      if (elBarShadows) {
        elSeries.add(elBarShadows);
      }
    }
    return elSeries;
  }
  drawBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    yDivision,
    elSeries
  }) {
    let w = this.w;
    let i = indexes.i;
    let j2 = indexes.j;
    let barYPosition;
    if (w.globals.isXNumeric) {
      y = (w.globals.seriesX[i][j2] - w.globals.minX) / this.invertedXRatio - barHeight;
      barYPosition = y + barHeight * this.visibleI;
    } else {
      if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        const { nonZeroColumns, zeroEncounters } = this.barHelpers.getZeroValueEncounters({ i, j: j2 });
        if (nonZeroColumns > 0) {
          barHeight = this.seriesLen * barHeight / nonZeroColumns;
        }
        barYPosition = y + barHeight * this.visibleI;
        barYPosition -= barHeight * zeroEncounters;
      } else {
        barYPosition = y + barHeight * this.visibleI;
      }
    }
    if (this.isFunnel) {
      zeroW = zeroW - (this.barHelpers.getXForValue(this.series[i][j2], zeroW) - zeroW) / 2;
    }
    x = this.barHelpers.getXForValue(this.series[i][j2], zeroW);
    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1: zeroW,
      x2: x,
      strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      i,
      j: j2,
      w
    });
    if (!w.globals.isXNumeric) {
      y = y + yDivision;
    }
    this.barHelpers.barBackground({
      j: j2,
      i,
      y1: barYPosition - barHeight * this.visibleI,
      y2: barHeight * this.seriesLen,
      elSeries
    });
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      x1: zeroW,
      x,
      y,
      goalX: this.barHelpers.getGoalValues("x", zeroW, null, i, j2),
      barYPosition,
      barHeight
    };
  }
  drawColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth,
    elSeries
  }) {
    let w = this.w;
    let realIndex2 = indexes.realIndex;
    let translationsIndex = indexes.translationsIndex;
    let i = indexes.i;
    let j2 = indexes.j;
    let bc = indexes.bc;
    let barXPosition;
    if (w.globals.isXNumeric) {
      const xForNumericX = this.getBarXForNumericXAxis({
        x,
        j: j2,
        realIndex: realIndex2,
        barWidth
      });
      x = xForNumericX.x;
      barXPosition = xForNumericX.barXPosition;
    } else {
      if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        const { nonZeroColumns, zeroEncounters } = this.barHelpers.getZeroValueEncounters({ i, j: j2 });
        if (nonZeroColumns > 0) {
          barWidth = this.seriesLen * barWidth / nonZeroColumns;
        }
        barXPosition = x + barWidth * this.visibleI;
        barXPosition -= barWidth * zeroEncounters;
      } else {
        barXPosition = x + barWidth * this.visibleI;
      }
    }
    y = this.barHelpers.getYForValue(
      this.series[i][j2],
      zeroH,
      translationsIndex
    );
    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1: zeroH,
      y2: y,
      strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: realIndex2,
      i,
      j: j2,
      w
    });
    if (!w.globals.isXNumeric) {
      x = x + xDivision;
    }
    this.barHelpers.barBackground({
      bc,
      j: j2,
      i,
      x1: barXPosition - strokeWidth / 2 - barWidth * this.visibleI,
      x2: barWidth * this.seriesLen + strokeWidth / 2,
      elSeries
    });
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      x,
      y,
      goalY: this.barHelpers.getGoalValues(
        "y",
        null,
        zeroH,
        i,
        j2,
        translationsIndex
      ),
      barXPosition,
      barWidth
    };
  }
  getBarXForNumericXAxis({ x, barWidth, realIndex: realIndex2, j: j2 }) {
    const w = this.w;
    let sxI = realIndex2;
    if (!w.globals.seriesX[realIndex2].length) {
      sxI = w.globals.maxValsInArrayIndex;
    }
    if (Utils$1.isNumber(w.globals.seriesX[sxI][j2])) {
      x = (w.globals.seriesX[sxI][j2] - w.globals.minX) / this.xRatio - barWidth * this.seriesLen / 2;
    }
    return {
      barXPosition: x + barWidth * this.visibleI,
      x
    };
  }
  /** getPreviousPath is a common function for bars/columns which is used to get previous paths when data changes.
   * @memberof Bar
   * @param {int} realIndex - current iterating i
   * @param {int} j - current iterating series's j index
   * @return {string} pathFrom is the string which will be appended in animations
   **/
  getPreviousPath(realIndex2, j2) {
    let w = this.w;
    let pathFrom = "M 0 0";
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      let gpp = w.globals.previousPaths[pp];
      if (gpp.paths && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(realIndex2, 10)) {
        if (typeof w.globals.previousPaths[pp].paths[j2] !== "undefined") {
          pathFrom = w.globals.previousPaths[pp].paths[j2].d;
        }
      }
    }
    return pathFrom;
  }
}
class BarStacked extends Bar {
  draw(series, seriesIndex) {
    let w = this.w;
    this.graphics = new Graphics(this.ctx);
    this.bar = new Bar(this.ctx, this.xyRatios);
    const coreUtils = new CoreUtils(this.ctx);
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    if (w.config.chart.stackType === "100%") {
      series = w.globals.comboCharts ? seriesIndex.map((_) => w.globals.seriesPercent[_]) : w.globals.seriesPercent.slice();
    }
    this.series = series;
    this.barHelpers.initializeStackedPrevVars(this);
    let ret = this.graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    let x = 0;
    let y = 0;
    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let xDivision;
      let yDivision;
      let zeroH;
      let zeroW;
      let realIndex2 = w.globals.comboCharts ? seriesIndex[i] : i;
      let { groupIndex, columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex2);
      this.groupCtx = this[w.globals.seriesGroups[groupIndex]];
      let xArrValues = [];
      let yArrValues = [];
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex2][0];
        translationsIndex = realIndex2;
      }
      this.isReversed = w.config.yaxis[this.yaxisIndex] && w.config.yaxis[this.yaxisIndex].reversed;
      let elSeries = this.graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[realIndex2]),
        rel: i + 1,
        "data:realIndex": realIndex2
      });
      this.ctx.series.addCollapsedClassToSeries(elSeries, realIndex2);
      let elDataLabelsWrap = this.graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex2
      });
      let elGoalsMarkers = this.graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      let barHeight = 0;
      let barWidth = 0;
      let initPositions = this.initialPositions(
        x,
        y,
        xDivision,
        yDivision,
        zeroH,
        zeroW,
        translationsIndex
      );
      y = initPositions.y;
      barHeight = initPositions.barHeight;
      yDivision = initPositions.yDivision;
      zeroW = initPositions.zeroW;
      x = initPositions.x;
      barWidth = initPositions.barWidth;
      xDivision = initPositions.xDivision;
      zeroH = initPositions.zeroH;
      w.globals.barHeight = barHeight;
      w.globals.barWidth = barWidth;
      this.barHelpers.initializeStackedXYVars(this);
      if (this.groupCtx.prevY.length === 1 && this.groupCtx.prevY[0].every((val) => isNaN(val))) {
        this.groupCtx.prevY[0] = this.groupCtx.prevY[0].map(() => zeroH);
        this.groupCtx.prevYF[0] = this.groupCtx.prevYF[0].map(() => 0);
      }
      for (let j2 = 0; j2 < w.globals.dataPoints; j2++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j2, realIndex2);
        const commonPathOpts = {
          indexes: { i, j: j2, realIndex: realIndex2, translationsIndex, bc },
          strokeWidth,
          x,
          y,
          elSeries,
          columnGroupIndex,
          seriesGroup: w.globals.seriesGroups[groupIndex]
        };
        let paths = null;
        if (this.isHorizontal) {
          paths = this.drawStackedBarPaths(__spreadProps(__spreadValues({}, commonPathOpts), {
            zeroW,
            barHeight,
            yDivision
          }));
          barWidth = this.series[i][j2] / this.invertedYRatio;
        } else {
          paths = this.drawStackedColumnPaths(__spreadProps(__spreadValues({}, commonPathOpts), {
            xDivision,
            barWidth,
            zeroH
          }));
          barHeight = this.series[i][j2] / this.yRatio[translationsIndex];
        }
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        });
        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine);
        }
        y = paths.y;
        x = paths.x;
        xArrValues.push(x);
        yArrValues.push(y);
        let pathFill = this.barHelpers.getPathFillColor(series, i, j2, realIndex2);
        let classes = "";
        const flipClass = w.globals.isBarHorizontal ? "apexcharts-flip-x" : "apexcharts-flip-y";
        if (this.barHelpers.arrBorderRadius[realIndex2][j2] === "bottom" && w.globals.series[realIndex2][j2] > 0 || this.barHelpers.arrBorderRadius[realIndex2][j2] === "top" && w.globals.series[realIndex2][j2] < 0) {
          classes = flipClass;
        }
        elSeries = this.renderSeries(__spreadProps(__spreadValues({
          realIndex: realIndex2,
          pathFill: pathFill.color
        }, pathFill.useRangeColor ? { lineFill: pathFill.color } : {}), {
          j: j2,
          i,
          columnGroupIndex,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          barHeight,
          barWidth,
          elDataLabelsWrap,
          elGoalsMarkers,
          type: "bar",
          visibleSeries: columnGroupIndex,
          classes
        }));
      }
      w.globals.seriesXvalues[realIndex2] = xArrValues;
      w.globals.seriesYvalues[realIndex2] = yArrValues;
      this.groupCtx.prevY.push(this.groupCtx.yArrj);
      this.groupCtx.prevYF.push(this.groupCtx.yArrjF);
      this.groupCtx.prevYVal.push(this.groupCtx.yArrjVal);
      this.groupCtx.prevX.push(this.groupCtx.xArrj);
      this.groupCtx.prevXF.push(this.groupCtx.xArrjF);
      this.groupCtx.prevXVal.push(this.groupCtx.xArrjVal);
      ret.add(elSeries);
    }
    return ret;
  }
  initialPositions(x, y, xDivision, yDivision, zeroH, zeroW, translationsIndex) {
    let w = this.w;
    let barHeight, barWidth;
    if (this.isHorizontal) {
      yDivision = w.globals.gridHeight / w.globals.dataPoints;
      let userBarHeight = w.config.plotOptions.bar.barHeight;
      if (String(userBarHeight).indexOf("%") === -1) {
        barHeight = parseInt(userBarHeight, 10);
      } else {
        barHeight = yDivision * parseInt(userBarHeight, 10) / 100;
      }
      zeroW = w.globals.padHorizontal + (this.isReversed ? w.globals.gridWidth - this.baseLineInvertedY : this.baseLineInvertedY);
      y = (yDivision - barHeight) / 2;
    } else {
      xDivision = w.globals.gridWidth / w.globals.dataPoints;
      barWidth = xDivision;
      let userColumnWidth = w.config.plotOptions.bar.columnWidth;
      if (w.globals.isXNumeric && w.globals.dataPoints > 1) {
        xDivision = w.globals.minXDiff / this.xRatio;
        barWidth = xDivision * parseInt(this.barOptions.columnWidth, 10) / 100;
      } else if (String(userColumnWidth).indexOf("%") === -1) {
        barWidth = parseInt(userColumnWidth, 10);
      } else {
        barWidth *= parseInt(userColumnWidth, 10) / 100;
      }
      if (this.isReversed) {
        zeroH = this.baseLineY[translationsIndex];
      } else {
        zeroH = w.globals.gridHeight - this.baseLineY[translationsIndex];
      }
      x = w.globals.padHorizontal + (xDivision - barWidth) / 2;
    }
    let subDivisions = w.globals.barGroups.length || 1;
    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight: barHeight / subDivisions,
      barWidth: barWidth / subDivisions,
      zeroH,
      zeroW
    };
  }
  drawStackedBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    columnGroupIndex,
    seriesGroup,
    yDivision,
    elSeries
  }) {
    let w = this.w;
    let barYPosition = y + columnGroupIndex * barHeight;
    let barXPosition;
    let i = indexes.i;
    let j2 = indexes.j;
    let realIndex2 = indexes.realIndex;
    let translationsIndex = indexes.translationsIndex;
    let prevBarW = 0;
    for (let k = 0; k < this.groupCtx.prevXF.length; k++) {
      prevBarW = prevBarW + this.groupCtx.prevXF[k][j2];
    }
    let gsi = i;
    if (w.config.series[realIndex2].name) {
      gsi = seriesGroup.indexOf(w.config.series[realIndex2].name);
    }
    if (gsi > 0) {
      let bXP = zeroW;
      if (this.groupCtx.prevXVal[gsi - 1][j2] < 0) {
        bXP = this.series[i][j2] >= 0 ? this.groupCtx.prevX[gsi - 1][j2] + prevBarW - (this.isReversed ? prevBarW : 0) * 2 : this.groupCtx.prevX[gsi - 1][j2];
      } else if (this.groupCtx.prevXVal[gsi - 1][j2] >= 0) {
        bXP = this.series[i][j2] >= 0 ? this.groupCtx.prevX[gsi - 1][j2] : this.groupCtx.prevX[gsi - 1][j2] - prevBarW + (this.isReversed ? prevBarW : 0) * 2;
      }
      barXPosition = bXP;
    } else {
      barXPosition = zeroW;
    }
    if (this.series[i][j2] === null) {
      x = barXPosition;
    } else {
      x = barXPosition + this.series[i][j2] / this.invertedYRatio - (this.isReversed ? this.series[i][j2] / this.invertedYRatio : 0) * 2;
    }
    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1: barXPosition,
      x2: x,
      strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      seriesGroup,
      i,
      j: j2,
      w
    });
    this.barHelpers.barBackground({
      j: j2,
      i,
      y1: barYPosition,
      y2: barHeight,
      elSeries
    });
    y = y + yDivision;
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalX: this.barHelpers.getGoalValues(
        "x",
        zeroW,
        null,
        i,
        j2,
        translationsIndex
      ),
      barXPosition,
      barYPosition,
      x,
      y
    };
  }
  drawStackedColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    columnGroupIndex,
    seriesGroup,
    elSeries
  }) {
    var _a, _b, _c, _d;
    let w = this.w;
    let i = indexes.i;
    let j2 = indexes.j;
    let bc = indexes.bc;
    let realIndex2 = indexes.realIndex;
    let translationsIndex = indexes.translationsIndex;
    if (w.globals.isXNumeric) {
      let seriesVal = w.globals.seriesX[realIndex2][j2];
      if (!seriesVal) seriesVal = 0;
      x = (seriesVal - w.globals.minX) / this.xRatio - barWidth / 2 * w.globals.barGroups.length;
    }
    let barXPosition = x + columnGroupIndex * barWidth;
    let barYPosition;
    let prevBarH = 0;
    for (let k = 0; k < this.groupCtx.prevYF.length; k++) {
      prevBarH = prevBarH + (!isNaN(this.groupCtx.prevYF[k][j2]) ? this.groupCtx.prevYF[k][j2] : 0);
    }
    let gsi = i;
    if (seriesGroup) {
      gsi = seriesGroup.indexOf(w.globals.seriesNames[realIndex2]);
    }
    if (gsi > 0 && !w.globals.isXNumeric || gsi > 0 && w.globals.isXNumeric && w.globals.seriesX[realIndex2 - 1][j2] === w.globals.seriesX[realIndex2][j2]) {
      let bYP;
      let prevYValue;
      const p = Math.min(this.yRatio.length + 1, realIndex2 + 1);
      if (this.groupCtx.prevY[gsi - 1] !== void 0 && this.groupCtx.prevY[gsi - 1].length) {
        for (let ii = 1; ii < p; ii++) {
          if (!isNaN((_a = this.groupCtx.prevY[gsi - ii]) == null ? void 0 : _a[j2])) {
            prevYValue = this.groupCtx.prevY[gsi - ii][j2];
            break;
          }
        }
      }
      for (let ii = 1; ii < p; ii++) {
        if (((_b = this.groupCtx.prevYVal[gsi - ii]) == null ? void 0 : _b[j2]) < 0) {
          bYP = this.series[i][j2] >= 0 ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2 : prevYValue;
          break;
        } else if (((_c = this.groupCtx.prevYVal[gsi - ii]) == null ? void 0 : _c[j2]) >= 0) {
          bYP = this.series[i][j2] >= 0 ? prevYValue : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2;
          break;
        }
      }
      if (typeof bYP === "undefined") bYP = w.globals.gridHeight;
      if (((_d = this.groupCtx.prevYF[0]) == null ? void 0 : _d.every((val) => val === 0)) && this.groupCtx.prevYF.slice(1, gsi).every((arr) => arr.every((val) => isNaN(val)))) {
        barYPosition = zeroH;
      } else {
        barYPosition = bYP;
      }
    } else {
      barYPosition = zeroH;
    }
    if (this.series[i][j2]) {
      y = barYPosition - this.series[i][j2] / this.yRatio[translationsIndex] + (this.isReversed ? this.series[i][j2] / this.yRatio[translationsIndex] : 0) * 2;
    } else {
      y = barYPosition;
    }
    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1: barYPosition,
      y2: y,
      yRatio: this.yRatio[translationsIndex],
      strokeWidth: this.strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      seriesGroup,
      realIndex: indexes.realIndex,
      i,
      j: j2,
      w
    });
    this.barHelpers.barBackground({
      bc,
      j: j2,
      i,
      x1: barXPosition,
      x2: barWidth,
      elSeries
    });
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalY: this.barHelpers.getGoalValues("y", null, zeroH, i, j2),
      barXPosition,
      x: w.globals.isXNumeric ? x : x + xDivision,
      y
    };
  }
}
class BoxCandleStick extends Bar {
  draw(series, ctype, seriesIndex) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const type = w.globals.comboCharts ? ctype : w.config.chart.type;
    const fill = new Fill(this.ctx);
    this.candlestickOptions = this.w.config.plotOptions.candlestick;
    this.boxOptions = this.w.config.plotOptions.boxPlot;
    this.isHorizontal = w.config.plotOptions.bar.horizontal;
    this.isOHLC = this.candlestickOptions && this.candlestickOptions.type === "ohlc";
    this.coreUtils = new CoreUtils(this.ctx);
    series = this.coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`
    });
    for (let i = 0; i < series.length; i++) {
      this.isBoxPlot = w.config.chart.type === "boxPlot" || w.config.series[i].type === "boxPlot";
      let x, y, xDivision, yDivision, zeroH, zeroW;
      const yArrj = [];
      const xArrj = [];
      const realIndex2 = w.globals.comboCharts ? seriesIndex[i] : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex2);
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[realIndex2]),
        rel: i + 1,
        "data:realIndex": realIndex2
      });
      this.ctx.series.addCollapsedClassToSeries(elSeries, realIndex2);
      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1;
      }
      let barHeight = 0;
      let barWidth = 0;
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex2][0];
        translationsIndex = realIndex2;
      }
      const initPositions = this.barHelpers.initialPositions(realIndex2);
      y = initPositions.y;
      barHeight = initPositions.barHeight;
      yDivision = initPositions.yDivision;
      zeroW = initPositions.zeroW;
      x = initPositions.x;
      barWidth = initPositions.barWidth;
      xDivision = initPositions.xDivision;
      zeroH = initPositions.zeroH;
      xArrj.push(x + barWidth / 2);
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex2
      });
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      for (let j2 = 0; j2 < w.globals.dataPoints; j2++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j2, realIndex2);
        let paths = null;
        const pathsParams = {
          indexes: {
            i,
            j: j2,
            realIndex: realIndex2,
            translationsIndex
          },
          x,
          y,
          strokeWidth,
          elSeries
        };
        if (this.isHorizontal) {
          paths = this.drawHorizontalBoxPaths(__spreadProps(__spreadValues({}, pathsParams), {
            yDivision,
            barHeight,
            zeroW
          }));
        } else {
          paths = this.drawVerticalBoxPaths(__spreadProps(__spreadValues({}, pathsParams), {
            xDivision,
            barWidth,
            zeroH
          }));
        }
        y = paths.y;
        x = paths.x;
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        });
        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine);
        }
        if (j2 > 0) {
          xArrj.push(x + barWidth / 2);
        }
        yArrj.push(y);
        paths.pathTo.forEach((pathTo, pi) => {
          const lineFill = !this.isBoxPlot && this.candlestickOptions.wick.useFillColor ? paths.color[pi] : w.globals.stroke.colors[i];
          const pathFill = fill.fillPath({
            seriesNumber: realIndex2,
            dataPointIndex: j2,
            color: paths.color[pi],
            value: series[i][j2]
          });
          this.renderSeries({
            realIndex: realIndex2,
            pathFill,
            lineFill,
            j: j2,
            i,
            pathFrom: paths.pathFrom,
            pathTo,
            strokeWidth,
            elSeries,
            x,
            y,
            series,
            columnGroupIndex,
            barHeight,
            barWidth,
            elDataLabelsWrap,
            elGoalsMarkers,
            visibleSeries: this.visibleI,
            type: w.config.chart.type
          });
        });
      }
      w.globals.seriesXvalues[realIndex2] = xArrj;
      w.globals.seriesYvalues[realIndex2] = yArrj;
      ret.add(elSeries);
    }
    return ret;
  }
  drawVerticalBoxPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth
  }) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const i = indexes.i;
    const j2 = indexes.j;
    const { colors: candleColors } = w.config.plotOptions.candlestick;
    const { colors: boxColors } = this.boxOptions;
    const realIndex2 = indexes.realIndex;
    const getColor = (color2) => Array.isArray(color2) ? color2[realIndex2] : color2;
    const colorPos = getColor(candleColors.upward);
    const colorNeg = getColor(candleColors.downward);
    const yRatio = this.yRatio[indexes.translationsIndex];
    const ohlc = this.getOHLCValue(realIndex2, j2);
    let l1 = zeroH;
    let l2 = zeroH;
    let color = ohlc.o < ohlc.c ? [colorPos] : [colorNeg];
    if (this.isBoxPlot) {
      color = [getColor(boxColors.lower), getColor(boxColors.upper)];
    }
    let y1 = Math.min(ohlc.o, ohlc.c);
    let y2 = Math.max(ohlc.o, ohlc.c);
    let m = ohlc.m;
    if (w.globals.isXNumeric) {
      x = (w.globals.seriesX[realIndex2][j2] - w.globals.minX) / this.xRatio - barWidth / 2;
    }
    const barXPosition = x + barWidth * this.visibleI;
    if (typeof this.series[i][j2] === "undefined" || this.series[i][j2] === null) {
      y1 = zeroH;
      y2 = zeroH;
    } else {
      y1 = zeroH - y1 / yRatio;
      y2 = zeroH - y2 / yRatio;
      l1 = zeroH - ohlc.h / yRatio;
      l2 = zeroH - ohlc.l / yRatio;
      m = zeroH - ohlc.m / yRatio;
    }
    let pathTo;
    let pathFrom = graphics.move(barXPosition + barWidth / 2, y1);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex2, j2, true);
    }
    if (this.isOHLC) {
      const centerX = barXPosition + barWidth / 2;
      const openY = zeroH - ohlc.o / yRatio;
      const closeY = zeroH - ohlc.c / yRatio;
      pathTo = [
        graphics.move(centerX, l1) + graphics.line(centerX, l2) + graphics.move(centerX, openY) + graphics.line(barXPosition, openY) + graphics.move(centerX, closeY) + graphics.line(barXPosition + barWidth, closeY)
      ];
    } else if (this.isBoxPlot) {
      pathTo = [
        graphics.move(barXPosition, y1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 4, l1) + graphics.line(barXPosition + barWidth - barWidth / 4, l1) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth, y1) + graphics.line(barXPosition + barWidth, m) + graphics.line(barXPosition, m) + graphics.line(barXPosition, y1 + strokeWidth / 2),
        graphics.move(barXPosition, m) + graphics.line(barXPosition + barWidth, m) + graphics.line(barXPosition + barWidth, y2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth - barWidth / 4, l2) + graphics.line(barXPosition + barWidth / 4, l2) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition, y2) + graphics.line(barXPosition, m) + "z"
      ];
    } else {
      pathTo = [
        graphics.move(barXPosition, y2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth, y2) + graphics.line(barXPosition + barWidth, y1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition, y1) + graphics.line(barXPosition, y2 - strokeWidth / 2)
      ];
    }
    pathFrom = pathFrom + graphics.move(barXPosition, y1);
    if (!w.globals.isXNumeric) {
      x = x + xDivision;
    }
    return {
      pathTo,
      pathFrom,
      x,
      y: y2,
      goalY: this.barHelpers.getGoalValues(
        "y",
        null,
        zeroH,
        i,
        j2,
        indexes.translationsIndex
      ),
      barXPosition,
      color
    };
  }
  drawHorizontalBoxPaths({
    indexes,
    x,
    y,
    yDivision,
    barHeight,
    zeroW,
    strokeWidth
  }) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const i = indexes.i;
    const j2 = indexes.j;
    const realIndex2 = indexes.realIndex;
    const { colors: candleColors } = w.config.plotOptions.candlestick;
    const { colors: boxColors } = this.boxOptions;
    const getColor = (color2) => Array.isArray(color2) ? color2[realIndex2] : color2;
    const yRatio = this.invertedYRatio;
    const ohlc = this.getOHLCValue(realIndex2, j2);
    let color = ohlc.o < ohlc.c ? [getColor(candleColors.upward)] : [getColor(candleColors.downward)];
    if (this.isBoxPlot) {
      color = [getColor(boxColors.lower), getColor(boxColors.upper)];
    }
    let l1 = zeroW;
    let l2 = zeroW;
    let x1 = Math.min(ohlc.o, ohlc.c);
    let x2 = Math.max(ohlc.o, ohlc.c);
    let m = ohlc.m;
    if (w.globals.isXNumeric) {
      y = (w.globals.seriesX[realIndex2][j2] - w.globals.minX) / this.invertedXRatio - barHeight / 2;
    }
    const barYPosition = y + barHeight * this.visibleI;
    if (typeof this.series[i][j2] === "undefined" || this.series[i][j2] === null) {
      x1 = zeroW;
      x2 = zeroW;
    } else {
      x1 = zeroW + x1 / yRatio;
      x2 = zeroW + x2 / yRatio;
      l1 = zeroW + ohlc.h / yRatio;
      l2 = zeroW + ohlc.l / yRatio;
      m = zeroW + ohlc.m / yRatio;
    }
    let pathTo;
    let pathFrom = graphics.move(x1, barYPosition + barHeight / 2);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex2, j2, true);
    }
    pathTo = [
      graphics.move(x1, barYPosition) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2 - barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2 + barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight) + graphics.line(m, barYPosition + barHeight) + graphics.line(m, barYPosition) + graphics.line(x1 + strokeWidth / 2, barYPosition),
      graphics.move(m, barYPosition) + graphics.line(m, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight - barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition) + graphics.line(m, barYPosition) + "z"
    ];
    pathFrom = pathFrom + graphics.move(x1, barYPosition);
    if (!w.globals.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo,
      pathFrom,
      x: x2,
      y,
      goalX: this.barHelpers.getGoalValues("x", zeroW, null, i, j2),
      barYPosition,
      color
    };
  }
  getOHLCValue(i, j2) {
    const w = this.w;
    const coreUtils = this.coreUtils;
    const getCandleVal = (arr) => arr[i] && arr[i][j2] != null ? coreUtils.getLogValAtSeriesIndex(arr[i][j2], i) : 0;
    const h = getCandleVal(w.globals.seriesCandleH);
    const o = getCandleVal(w.globals.seriesCandleO);
    const m = getCandleVal(w.globals.seriesCandleM);
    const c = getCandleVal(w.globals.seriesCandleC);
    const l = getCandleVal(w.globals.seriesCandleL);
    return {
      o: this.isBoxPlot ? h : o,
      h: this.isBoxPlot ? o : h,
      m,
      l: this.isBoxPlot ? c : l,
      c: this.isBoxPlot ? l : c
    };
  }
}
class TreemapHelpers {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  checkColorRange() {
    const w = this.w;
    let negRange = false;
    let chartOpts = w.config.plotOptions[w.config.chart.type];
    if (chartOpts.colorScale.ranges.length > 0) {
      chartOpts.colorScale.ranges.map((range, index) => {
        if (range.from <= 0) {
          negRange = true;
        }
      });
    }
    return negRange;
  }
  getShadeColor(chartType, i, j2, negRange) {
    const w = this.w;
    let colorShadePercent = 1;
    let shadeIntensity = w.config.plotOptions[chartType].shadeIntensity;
    const colorProps = this.determineColor(chartType, i, j2);
    if (w.globals.hasNegs || negRange) {
      if (w.config.plotOptions[chartType].reverseNegativeShade) {
        if (colorProps.percent < 0) {
          colorShadePercent = colorProps.percent / 100 * (shadeIntensity * 1.25);
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * (shadeIntensity * 1.25);
        }
      } else {
        if (colorProps.percent <= 0) {
          colorShadePercent = 1 - (1 + colorProps.percent / 100) * shadeIntensity;
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * shadeIntensity;
        }
      }
    } else {
      colorShadePercent = 1 - colorProps.percent / 100;
      if (chartType === "treemap") {
        colorShadePercent = (1 - colorProps.percent / 100) * (shadeIntensity * 1.25);
      }
    }
    let color = colorProps.color;
    let utils = new Utils$1();
    if (w.config.plotOptions[chartType].enableShades) {
      if (this.w.config.theme.mode === "dark") {
        const shadeColor = utils.shadeColor(
          colorShadePercent * -1,
          colorProps.color
        );
        color = Utils$1.hexToRgba(
          Utils$1.isColorHex(shadeColor) ? shadeColor : Utils$1.rgb2hex(shadeColor),
          w.config.fill.opacity
        );
      } else {
        const shadeColor = utils.shadeColor(colorShadePercent, colorProps.color);
        color = Utils$1.hexToRgba(
          Utils$1.isColorHex(shadeColor) ? shadeColor : Utils$1.rgb2hex(shadeColor),
          w.config.fill.opacity
        );
      }
    }
    return { color, colorProps };
  }
  determineColor(chartType, i, j2) {
    const w = this.w;
    let val = w.globals.series[i][j2];
    let chartOpts = w.config.plotOptions[chartType];
    let seriesNumber = chartOpts.colorScale.inverse ? j2 : i;
    if (chartOpts.distributed && w.config.chart.type === "treemap") {
      seriesNumber = j2;
    }
    let color = w.globals.colors[seriesNumber];
    let foreColor = null;
    let min = Math.min(...w.globals.series[i]);
    let max = Math.max(...w.globals.series[i]);
    if (!chartOpts.distributed && chartType === "heatmap") {
      min = w.globals.minY;
      max = w.globals.maxY;
    }
    if (typeof chartOpts.colorScale.min !== "undefined") {
      min = chartOpts.colorScale.min < w.globals.minY ? chartOpts.colorScale.min : w.globals.minY;
      max = chartOpts.colorScale.max > w.globals.maxY ? chartOpts.colorScale.max : w.globals.maxY;
    }
    let total = Math.abs(max) + Math.abs(min);
    let percent = 100 * val / (total === 0 ? total - 1e-6 : total);
    if (chartOpts.colorScale.ranges.length > 0) {
      const colorRange = chartOpts.colorScale.ranges;
      colorRange.map((range, index) => {
        if (val >= range.from && val <= range.to) {
          color = range.color;
          foreColor = range.foreColor ? range.foreColor : null;
          min = range.from;
          max = range.to;
          let rTotal = Math.abs(max) + Math.abs(min);
          percent = 100 * val / (rTotal === 0 ? rTotal - 1e-6 : rTotal);
        }
      });
    }
    return {
      color,
      foreColor,
      percent
    };
  }
  calculateDataLabels({ text, x, y, i, j: j2, colorProps, fontSize }) {
    let w = this.w;
    let dataLabelsConfig = w.config.dataLabels;
    const graphics = new Graphics(this.ctx);
    let dataLabels = new DataLabels(this.ctx);
    let elDataLabelsWrap = null;
    if (dataLabelsConfig.enabled) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      const offX = dataLabelsConfig.offsetX;
      const offY = dataLabelsConfig.offsetY;
      let dataLabelsX = x + offX;
      let dataLabelsY = y + parseFloat(dataLabelsConfig.style.fontSize) / 3 + offY;
      dataLabels.plotDataLabelsText({
        x: dataLabelsX,
        y: dataLabelsY,
        text,
        i,
        j: j2,
        color: colorProps.foreColor,
        parent: elDataLabelsWrap,
        fontSize,
        dataLabelsConfig
      });
    }
    return elDataLabelsWrap;
  }
}
class HeatMap {
  constructor(ctx, xyRatios) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.xRatio = xyRatios.xRatio;
    this.yRatio = xyRatios.yRatio;
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.helpers = new TreemapHelpers(ctx);
    this.rectRadius = this.w.config.plotOptions.heatmap.radius;
    this.strokeWidth = this.w.config.stroke.show ? this.w.config.stroke.width : 0;
  }
  draw(series) {
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    let ret = graphics.group({
      class: "apexcharts-heatmap"
    });
    ret.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
    let xDivision = w.globals.gridWidth / w.globals.dataPoints;
    let yDivision = w.globals.gridHeight / w.globals.series.length;
    let y1 = 0;
    let rev = false;
    this.negRange = this.helpers.checkColorRange();
    let heatSeries = series.slice();
    if (w.config.yaxis[0].reversed) {
      rev = true;
      heatSeries.reverse();
    }
    for (let i = rev ? 0 : heatSeries.length - 1; rev ? i < heatSeries.length : i >= 0; rev ? i++ : i--) {
      let elSeries = graphics.group({
        class: `apexcharts-series apexcharts-heatmap-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      this.ctx.series.addCollapsedClassToSeries(elSeries, i);
      graphics.setupEventDelegation(elSeries, ".apexcharts-heatmap-rect");
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        const filters = new Filters(this.ctx);
        filters.dropShadow(elSeries, shadow, i);
      }
      let x1 = 0;
      let shadeIntensity = w.config.plotOptions.heatmap.shadeIntensity;
      let j2 = 0;
      for (let dIndex = 0; dIndex < w.globals.dataPoints; dIndex++) {
        if (w.globals.seriesX.length && !w.globals.allSeriesHasEqualX) {
          if (w.globals.minX + w.globals.minXDiff * dIndex < w.globals.seriesX[i][j2]) {
            x1 = x1 + xDivision;
            continue;
          }
        }
        if (j2 >= heatSeries[i].length) break;
        let heatColor = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j2,
          this.negRange
        );
        let color = heatColor.color;
        let heatColorProps = heatColor.colorProps;
        if (w.config.fill.type === "image") {
          const fill = new Fill(this.ctx);
          color = fill.fillPath({
            seriesNumber: i,
            dataPointIndex: j2,
            opacity: w.globals.hasNegs ? heatColorProps.percent < 0 ? 1 - (1 + heatColorProps.percent / 100) : shadeIntensity + heatColorProps.percent / 100 : heatColorProps.percent / 100,
            patternID: Utils$1.randomId(),
            width: w.config.fill.image.width ? w.config.fill.image.width : xDivision,
            height: w.config.fill.image.height ? w.config.fill.image.height : yDivision
          });
        }
        let radius = this.rectRadius;
        let rect = graphics.drawRect(x1, y1, xDivision, yDivision, radius);
        rect.attr({
          cx: x1,
          cy: y1
        });
        rect.node.classList.add("apexcharts-heatmap-rect");
        elSeries.add(rect);
        rect.attr({
          fill: color,
          i,
          index: i,
          j: j2,
          val: series[i][j2],
          "stroke-width": this.strokeWidth,
          stroke: w.config.plotOptions.heatmap.useFillColorAsStroke ? color : w.globals.stroke.colors[0],
          color
        });
        if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1;
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed;
          }
          this.animateHeatMap(rect, x1, y1, xDivision, yDivision, speed);
        }
        if (w.globals.dataChanged) {
          let speed = 1;
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed;
            let colorFrom = w.globals.previousPaths[i] && w.globals.previousPaths[i][j2] && w.globals.previousPaths[i][j2].color;
            if (!colorFrom) colorFrom = "rgba(255, 255, 255, 0)";
            this.animateHeatColor(
              rect,
              Utils$1.isColorHex(colorFrom) ? colorFrom : Utils$1.rgb2hex(colorFrom),
              Utils$1.isColorHex(color) ? color : Utils$1.rgb2hex(color),
              speed
            );
          }
        }
        let formatter = w.config.dataLabels.formatter;
        let formattedText = formatter(w.globals.series[i][j2], {
          value: w.globals.series[i][j2],
          seriesIndex: i,
          dataPointIndex: j2,
          w
        });
        let dataLabels = this.helpers.calculateDataLabels({
          text: formattedText,
          x: x1 + xDivision / 2,
          y: y1 + yDivision / 2,
          i,
          j: j2,
          colorProps: heatColorProps,
          series: heatSeries
        });
        if (dataLabels !== null) {
          elSeries.add(dataLabels);
        }
        x1 = x1 + xDivision;
        j2++;
      }
      y1 = y1 + yDivision;
      ret.add(elSeries);
    }
    let yAxisScale = w.globals.yAxisScale[0].result.slice();
    if (w.config.yaxis[0].reversed) {
      yAxisScale.unshift("");
    } else {
      yAxisScale.push("");
    }
    w.globals.yAxisScale[0].result = yAxisScale;
    return ret;
  }
  animateHeatMap(el, x, y, width, height, speed) {
    const animations = new Animations(this.ctx);
    animations.animateRect(
      el,
      {
        x: x + width / 2,
        y: y + height / 2,
        width: 0,
        height: 0
      },
      {
        x,
        y,
        width,
        height
      },
      speed,
      () => {
        animations.animationCompleted(el);
      }
    );
  }
  animateHeatColor(el, colorFrom, colorTo, speed) {
    el.attr({
      fill: colorFrom
    }).animate(speed).attr({
      fill: colorTo
    });
  }
}
class Helpers5 {
  constructor(lineCtx) {
    this.w = lineCtx.w;
    this.lineCtx = lineCtx;
  }
  sameValueSeriesFix(i, series) {
    const w = this.w;
    if (w.config.fill.type === "gradient" || w.config.fill.type[i] === "gradient") {
      const coreUtils = new CoreUtils(this.lineCtx.ctx);
      if (coreUtils.seriesHaveSameValues(i)) {
        let gSeries = series[i].slice();
        gSeries[gSeries.length - 1] = gSeries[gSeries.length - 1] + 1e-6;
        series[i] = gSeries;
      }
    }
    return series;
  }
  calculatePoints({ series, realIndex: realIndex2, x, y, i, j: j2, prevY }) {
    let w = this.w;
    let ptX = [];
    let ptY = [];
    let xPT1st = this.lineCtx.categoryAxisCorrection + w.config.markers.offsetX;
    if (w.globals.isXNumeric) {
      xPT1st = (w.globals.seriesX[realIndex2][0] - w.globals.minX) / this.lineCtx.xRatio + w.config.markers.offsetX;
    }
    if (j2 === 0) {
      ptX.push(xPT1st);
      ptY.push(
        Utils$1.isNumber(series[i][0]) ? prevY + w.config.markers.offsetY : null
      );
    }
    ptX.push(x + w.config.markers.offsetX);
    ptY.push(
      Utils$1.isNumber(series[i][j2 + 1]) ? y + w.config.markers.offsetY : null
    );
    return {
      x: ptX,
      y: ptY
    };
  }
  checkPreviousPaths({ pathFromLine, pathFromArea, realIndex: realIndex2 }) {
    let w = this.w;
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      let gpp = w.globals.previousPaths[pp];
      if ((gpp.type === "line" || gpp.type === "area") && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(realIndex2, 10)) {
        if (gpp.type === "line") {
          this.lineCtx.appendPathFrom = false;
          pathFromLine = w.globals.previousPaths[pp].paths[0].d;
        } else if (gpp.type === "area") {
          this.lineCtx.appendPathFrom = false;
          pathFromArea = w.globals.previousPaths[pp].paths[0].d;
          if (w.config.stroke.show && w.globals.previousPaths[pp].paths[1]) {
            pathFromLine = w.globals.previousPaths[pp].paths[1].d;
          }
        }
      }
    }
    return {
      pathFromLine,
      pathFromArea
    };
  }
  determineFirstPrevY({
    i,
    realIndex: realIndex2,
    series,
    prevY,
    lineYPosition,
    translationsIndex
  }) {
    var _a, _b, _c;
    let w = this.w;
    let stackSeries = w.config.chart.stacked && !w.globals.comboCharts || w.config.chart.stacked && w.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || ((_a = this.w.config.series[realIndex2]) == null ? void 0 : _a.type) === "bar" || ((_b = this.w.config.series[realIndex2]) == null ? void 0 : _b.type) === "column");
    if (typeof ((_c = series[i]) == null ? void 0 : _c[0]) !== "undefined") {
      if (stackSeries) {
        if (i > 0) {
          lineYPosition = this.lineCtx.prevSeriesY[i - 1][0];
        } else {
          lineYPosition = this.lineCtx.zeroY;
        }
      } else {
        lineYPosition = this.lineCtx.zeroY;
      }
      prevY = lineYPosition - series[i][0] / this.lineCtx.yRatio[translationsIndex] + (this.lineCtx.isReversed ? series[i][0] / this.lineCtx.yRatio[translationsIndex] : 0) * 2;
    } else {
      if (stackSeries && i > 0 && typeof series[i][0] === "undefined") {
        for (let s = i - 1; s >= 0; s--) {
          if (series[s][0] !== null && typeof series[s][0] !== "undefined") {
            lineYPosition = this.lineCtx.prevSeriesY[s][0];
            prevY = lineYPosition;
            break;
          }
        }
      }
    }
    return {
      prevY,
      lineYPosition
    };
  }
}
const tangents = (points) => {
  const m = finiteDifferences(points);
  const n = points.length - 1;
  const ε = 1e-6;
  const tgts = [];
  let a, b, d, s;
  for (let i = 0; i < n; i++) {
    d = slope(points[i], points[i + 1]);
    if (Math.abs(d) < ε) {
      m[i] = m[i + 1] = 0;
    } else {
      a = m[i] / d;
      b = m[i + 1] / d;
      s = a * a + b * b;
      if (s > 9) {
        s = d * 3 / Math.sqrt(s);
        m[i] = s * a;
        m[i + 1] = s * b;
      }
    }
  }
  for (let i = 0; i <= n; i++) {
    s = (points[Math.min(n, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
    tgts.push([s || 0, m[i] * s || 0]);
  }
  return tgts;
};
const svgPath = (points) => {
  let p = "";
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const n = point.length;
    if (n > 4) {
      p += `C${point[0]}, ${point[1]}`;
      p += `, ${point[2]}, ${point[3]}`;
      p += `, ${point[4]}, ${point[5]}`;
    } else if (n > 2) {
      p += `S${point[0]}, ${point[1]}`;
      p += `, ${point[2]}, ${point[3]}`;
    }
  }
  return p;
};
const spline = {
  /**
   * Convert 'points' to bezier
   * @param {Array} points
   * @returns {Array}
   */
  points(points) {
    const tgts = tangents(points);
    const p = points[1];
    const p0 = points[0];
    const pts = [];
    const t = tgts[1];
    const t0 = tgts[0];
    pts.push(p0, [
      p0[0] + t0[0],
      p0[1] + t0[1],
      p[0] - t[0],
      p[1] - t[1],
      p[0],
      p[1]
    ]);
    for (let i = 2, n = tgts.length; i < n; i++) {
      const p2 = points[i];
      const t2 = tgts[i];
      pts.push([p2[0] - t2[0], p2[1] - t2[1], p2[0], p2[1]]);
    }
    return pts;
  },
  /**
   * Slice out a segment of 'points'
   * @param {Array} points
   * @param {Number} start
   * @param {Number} end
   * @returns {Array}
   */
  slice(points, start, end) {
    const pts = points.slice(start, end);
    if (start) {
      if (end - start > 1 && pts[1].length < 6) {
        const n = pts[0].length;
        pts[1] = [
          pts[0][n - 2] * 2 - pts[0][n - 4],
          pts[0][n - 1] * 2 - pts[0][n - 3]
        ].concat(pts[1]);
      }
      pts[0] = pts[0].slice(-2);
    }
    return pts;
  }
};
function slope(p0, p1) {
  return (p1[1] - p0[1]) / (p1[0] - p0[0]);
}
function finiteDifferences(points) {
  const m = [];
  let p0 = points[0];
  let p1 = points[1];
  let d = m[0] = slope(p0, p1);
  let i = 1;
  for (let n = points.length - 1; i < n; i++) {
    p0 = p1;
    p1 = points[i + 1];
    m[i] = (d + (d = slope(p0, p1))) * 0.5;
  }
  m[i] = d;
  return m;
}
class Line {
  constructor(ctx, xyRatios, isPointsChart) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.xyRatios = xyRatios;
    this.pointsChart = !(this.w.config.chart.type !== "bubble" && this.w.config.chart.type !== "scatter") || isPointsChart;
    this.scatter = new Scatter(this.ctx);
    this.noNegatives = this.w.globals.minX === Number.MAX_VALUE;
    this.lineHelpers = new Helpers5(this);
    this.markers = new Markers(this.ctx);
    this.prevSeriesY = [];
    this.categoryAxisCorrection = 0;
    this.yaxisIndex = 0;
  }
  draw(series, ctype, seriesIndex, seriesRangeEnd) {
    var _a;
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let type = w.globals.comboCharts ? ctype : w.config.chart.type;
    let ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`
    });
    const coreUtils = new CoreUtils(this.ctx);
    this.yRatio = this.xyRatios.yRatio;
    this.zRatio = this.xyRatios.zRatio;
    this.xRatio = this.xyRatios.xRatio;
    this.baseLineY = this.xyRatios.baseLineY;
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.prevSeriesY = [];
    let allSeries = [];
    for (let i = 0; i < series.length; i++) {
      series = this.lineHelpers.sameValueSeriesFix(i, series);
      let realIndex2 = w.globals.comboCharts ? seriesIndex[i] : i;
      let translationsIndex = this.yRatio.length > 1 ? realIndex2 : 0;
      this._initSerieVariables(series, i, realIndex2);
      let yArrj = [];
      let y2Arrj = [];
      let xArrj = [];
      let x = w.globals.padHorizontal + this.categoryAxisCorrection;
      let y = 1;
      let linePaths = [];
      let areaPaths = [];
      this.ctx.series.addCollapsedClassToSeries(this.elSeries, realIndex2);
      if (w.globals.isXNumeric && w.globals.seriesX.length > 0) {
        x = (w.globals.seriesX[realIndex2][0] - w.globals.minX) / this.xRatio;
      }
      xArrj.push(x);
      let pX = x;
      let pY;
      let pY2;
      let prevX = pX;
      let prevY = this.zeroY;
      let prevY2 = this.zeroY;
      let lineYPosition = 0;
      let firstPrevY = this.lineHelpers.determineFirstPrevY({
        i,
        realIndex: realIndex2,
        series,
        prevY,
        lineYPosition,
        translationsIndex
      });
      prevY = firstPrevY.prevY;
      if (w.config.stroke.curve === "monotoneCubic" && series[i][0] === null) {
        yArrj.push(null);
      } else {
        yArrj.push(prevY);
      }
      pY = prevY;
      let firstPrevY2;
      if (type === "rangeArea") {
        firstPrevY2 = this.lineHelpers.determineFirstPrevY({
          i,
          realIndex: realIndex2,
          series: seriesRangeEnd,
          prevY: prevY2,
          lineYPosition,
          translationsIndex
        });
        prevY2 = firstPrevY2.prevY;
        pY2 = prevY2;
        y2Arrj.push(yArrj[0] !== null ? prevY2 : null);
      }
      let pathsFrom = this._calculatePathsFrom({
        type,
        series,
        i,
        realIndex: realIndex2,
        translationsIndex,
        prevX,
        prevY,
        prevY2
      });
      let rYArrj = [yArrj[0]];
      let rY2Arrj = [y2Arrj[0]];
      const iteratingOpts = {
        type,
        series,
        realIndex: realIndex2,
        translationsIndex,
        i,
        x,
        y,
        pX,
        pY,
        pathsFrom,
        linePaths,
        areaPaths,
        seriesIndex,
        lineYPosition,
        xArrj,
        yArrj,
        y2Arrj,
        seriesRangeEnd
      };
      let paths = this._iterateOverDataPoints(__spreadProps(__spreadValues({}, iteratingOpts), {
        iterations: type === "rangeArea" ? series[i].length - 1 : void 0,
        isRangeStart: true
      }));
      if (type === "rangeArea") {
        let pathsFrom2 = this._calculatePathsFrom({
          series: seriesRangeEnd,
          i,
          realIndex: realIndex2,
          prevX,
          prevY: prevY2
        });
        let rangePaths = this._iterateOverDataPoints(__spreadProps(__spreadValues({}, iteratingOpts), {
          series: seriesRangeEnd,
          xArrj: [x],
          yArrj: rYArrj,
          y2Arrj: rY2Arrj,
          pY: pY2,
          areaPaths: paths.areaPaths,
          pathsFrom: pathsFrom2,
          iterations: seriesRangeEnd[i].length - 1,
          isRangeStart: false
        }));
        let segments = paths.linePaths.length / 2;
        for (let s = 0; s < segments; s++) {
          paths.linePaths[s] = rangePaths.linePaths[s + segments] + paths.linePaths[s];
        }
        paths.linePaths.splice(segments);
        paths.pathFromLine = rangePaths.pathFromLine + paths.pathFromLine;
      } else {
        paths.pathFromArea += "z";
      }
      this._handlePaths({ type, realIndex: realIndex2, i, paths });
      this.elSeries.add(this.elPointsMain);
      this.elSeries.add(this.elDataLabelsWrap);
      allSeries.push(this.elSeries);
    }
    if (typeof ((_a = w.config.series[0]) == null ? void 0 : _a.zIndex) !== "undefined") {
      allSeries.sort(
        (a, b) => Number(a.node.getAttribute("zIndex")) - Number(b.node.getAttribute("zIndex"))
      );
    }
    if (w.config.chart.stacked) {
      for (let s = allSeries.length - 1; s >= 0; s--) {
        ret.add(allSeries[s]);
      }
    } else {
      for (let s = 0; s < allSeries.length; s++) {
        ret.add(allSeries[s]);
      }
    }
    return ret;
  }
  _initSerieVariables(series, i, realIndex2) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    this.xDivision = w.globals.gridWidth / (w.globals.dataPoints - (w.config.xaxis.tickPlacement === "on" ? 1 : 0));
    this.strokeWidth = Array.isArray(w.config.stroke.width) ? w.config.stroke.width[realIndex2] : w.config.stroke.width;
    let translationsIndex = 0;
    if (this.yRatio.length > 1) {
      this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex2];
      translationsIndex = realIndex2;
    }
    this.isReversed = w.config.yaxis[this.yaxisIndex] && w.config.yaxis[this.yaxisIndex].reversed;
    this.zeroY = w.globals.gridHeight - this.baseLineY[translationsIndex] - (this.isReversed ? w.globals.gridHeight : 0) + (this.isReversed ? this.baseLineY[translationsIndex] * 2 : 0);
    this.areaBottomY = this.zeroY;
    if (this.zeroY > w.globals.gridHeight || w.config.plotOptions.area.fillTo === "end") {
      this.areaBottomY = w.globals.gridHeight;
    }
    this.categoryAxisCorrection = this.xDivision / 2;
    this.elSeries = graphics.group({
      class: `apexcharts-series`,
      zIndex: typeof w.config.series[realIndex2].zIndex !== "undefined" ? w.config.series[realIndex2].zIndex : realIndex2,
      seriesName: Utils$1.escapeString(w.globals.seriesNames[realIndex2])
    });
    this.elPointsMain = graphics.group({
      class: "apexcharts-series-markers-wrap",
      "data:realIndex": realIndex2
    });
    if (w.globals.hasNullValues) {
      const firstPoint = this.markers.plotChartMarkers({
        pointsPos: {
          x: [0],
          y: [w.globals.gridHeight + w.globals.markers.largestSize]
        },
        seriesIndex: i,
        j: 0,
        pSize: 0.1,
        alwaysDrawMarker: true,
        isVirtualPoint: true
      });
      if (firstPoint !== null) {
        this.elPointsMain.add(firstPoint);
      }
    }
    this.elDataLabelsWrap = graphics.group({
      class: "apexcharts-datalabels",
      "data:realIndex": realIndex2
    });
    let longestSeries = series[i].length === w.globals.dataPoints;
    this.elSeries.attr({
      "data:longestSeries": longestSeries,
      rel: i + 1,
      "data:realIndex": realIndex2
    });
    this.appendPathFrom = true;
  }
  _calculatePathsFrom({
    type,
    series,
    i,
    realIndex: realIndex2,
    translationsIndex,
    prevX,
    prevY,
    prevY2
  }) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    let linePath, areaPath, pathFromLine, pathFromArea;
    if (series[i][0] === null) {
      for (let s = 0; s < series[i].length; s++) {
        if (series[i][s] !== null) {
          prevX = this.xDivision * s;
          prevY = this.zeroY - series[i][s] / this.yRatio[translationsIndex];
          linePath = graphics.move(prevX, prevY);
          areaPath = graphics.move(prevX, this.areaBottomY);
          break;
        }
      }
    } else {
      linePath = graphics.move(prevX, prevY);
      if (type === "rangeArea") {
        linePath = graphics.move(prevX, prevY2) + graphics.line(prevX, prevY);
      }
      areaPath = graphics.move(prevX, this.areaBottomY) + graphics.line(prevX, prevY);
    }
    pathFromLine = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    pathFromArea = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    if (w.globals.previousPaths.length > 0) {
      const pathFrom = this.lineHelpers.checkPreviousPaths({
        pathFromLine,
        pathFromArea,
        realIndex: realIndex2
      });
      pathFromLine = pathFrom.pathFromLine;
      pathFromArea = pathFrom.pathFromArea;
    }
    return {
      prevX,
      prevY,
      linePath,
      areaPath,
      pathFromLine,
      pathFromArea
    };
  }
  _handlePaths({ type, realIndex: realIndex2, i, paths }) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const fill = new Fill(this.ctx);
    this.prevSeriesY.push(paths.yArrj);
    w.globals.seriesXvalues[realIndex2] = paths.xArrj;
    w.globals.seriesYvalues[realIndex2] = paths.yArrj;
    const forecast = w.config.forecastDataPoints;
    if (forecast.count > 0 && type !== "rangeArea") {
      const forecastCutoff = w.globals.seriesXvalues[realIndex2][w.globals.seriesXvalues[realIndex2].length - forecast.count - 1];
      const elForecastMask = graphics.drawRect(
        forecastCutoff,
        0,
        w.globals.gridWidth,
        w.globals.gridHeight,
        0
      );
      w.globals.dom.elForecastMask.appendChild(elForecastMask.node);
      const elNonForecastMask = graphics.drawRect(
        0,
        0,
        forecastCutoff,
        w.globals.gridHeight,
        0
      );
      w.globals.dom.elNonForecastMask.appendChild(elNonForecastMask.node);
    }
    if (!this.pointsChart) {
      w.globals.delayedElements.push({
        el: this.elPointsMain.node,
        index: realIndex2
      });
    }
    const defaultRenderedPathOptions = {
      i,
      realIndex: realIndex2,
      animationDelay: i,
      initialSpeed: w.config.chart.animations.speed,
      dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
      className: `apexcharts-${type}`
    };
    if (type === "area") {
      let pathFill = fill.fillPath({
        seriesNumber: realIndex2
      });
      for (let p = 0; p < paths.areaPaths.length; p++) {
        let renderedPath = graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: paths.pathFromArea,
          pathTo: paths.areaPaths[p],
          stroke: "none",
          strokeWidth: 0,
          strokeLineCap: null,
          fill: pathFill
        }));
        this.elSeries.add(renderedPath);
      }
    }
    if (w.config.stroke.show && !this.pointsChart) {
      let lineFill = null;
      if (type === "line") {
        lineFill = fill.fillPath({
          seriesNumber: realIndex2,
          i
        });
      } else {
        if (w.config.stroke.fill.type === "solid") {
          lineFill = w.globals.stroke.colors[realIndex2];
        } else {
          const prevFill = w.config.fill;
          w.config.fill = w.config.stroke.fill;
          lineFill = fill.fillPath({
            seriesNumber: realIndex2,
            i
          });
          w.config.fill = prevFill;
        }
      }
      for (let p = 0; p < paths.linePaths.length; p++) {
        let pathFill = lineFill;
        if (type === "rangeArea") {
          pathFill = fill.fillPath({
            seriesNumber: realIndex2
          });
        }
        const linePathCommonOpts = __spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: paths.pathFromLine,
          pathTo: paths.linePaths[p],
          stroke: lineFill,
          strokeWidth: this.strokeWidth,
          strokeLineCap: w.config.stroke.lineCap,
          fill: type === "rangeArea" ? pathFill : "none"
        });
        let renderedPath = graphics.renderPaths(linePathCommonOpts);
        this.elSeries.add(renderedPath);
        renderedPath.attr("fill-rule", `evenodd`);
        if (forecast.count > 0 && type !== "rangeArea") {
          let renderedForecastPath = graphics.renderPaths(linePathCommonOpts);
          renderedForecastPath.node.setAttribute(
            "stroke-dasharray",
            forecast.dashArray
          );
          if (forecast.strokeWidth) {
            renderedForecastPath.node.setAttribute(
              "stroke-width",
              forecast.strokeWidth
            );
          }
          this.elSeries.add(renderedForecastPath);
          renderedForecastPath.attr(
            "clip-path",
            `url(#forecastMask${w.globals.cuid})`
          );
          renderedPath.attr(
            "clip-path",
            `url(#nonForecastMask${w.globals.cuid})`
          );
        }
      }
    }
  }
  _iterateOverDataPoints({
    type,
    series,
    iterations,
    realIndex: realIndex2,
    translationsIndex,
    i,
    x,
    y,
    pX,
    pY,
    pathsFrom,
    linePaths,
    areaPaths,
    seriesIndex,
    lineYPosition,
    xArrj,
    yArrj,
    y2Arrj,
    isRangeStart,
    seriesRangeEnd
  }) {
    var _a, _b;
    const w = this.w;
    let graphics = new Graphics(this.ctx);
    let yRatio = this.yRatio;
    let { prevY, linePath, areaPath, pathFromLine, pathFromArea } = pathsFrom;
    const minY = Utils$1.isNumber(w.globals.minYArr[realIndex2]) ? w.globals.minYArr[realIndex2] : w.globals.minY;
    if (!iterations) {
      iterations = w.globals.dataPoints > 1 ? w.globals.dataPoints - 1 : w.globals.dataPoints;
    }
    const getY = (_y, lineYPos) => {
      return lineYPos - _y / yRatio[translationsIndex] + (this.isReversed ? _y / yRatio[translationsIndex] : 0) * 2;
    };
    let y2 = y;
    let stackSeries = w.config.chart.stacked && !w.globals.comboCharts || w.config.chart.stacked && w.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || ((_a = this.w.config.series[realIndex2]) == null ? void 0 : _a.type) === "bar" || ((_b = this.w.config.series[realIndex2]) == null ? void 0 : _b.type) === "column");
    let curve = w.config.stroke.curve;
    if (Array.isArray(curve)) {
      if (Array.isArray(seriesIndex)) {
        curve = curve[seriesIndex[i]];
      } else {
        curve = curve[i];
      }
    }
    let pathState = 0;
    let segmentStartX;
    for (let j2 = 0; j2 < iterations; j2++) {
      if (series[i].length === 0) break;
      const isNull = typeof series[i][j2 + 1] === "undefined" || series[i][j2 + 1] === null;
      if (w.globals.isXNumeric) {
        let sX = w.globals.seriesX[realIndex2][j2 + 1];
        if (typeof w.globals.seriesX[realIndex2][j2 + 1] === "undefined") {
          sX = w.globals.seriesX[realIndex2][iterations - 1];
        }
        x = (sX - w.globals.minX) / this.xRatio;
      } else {
        x = x + this.xDivision;
      }
      if (stackSeries) {
        if (i > 0 && w.globals.collapsedSeries.length < w.config.series.length - 1) {
          const prevIndex = (pi) => {
            for (let pii = pi; pii > 0; pii--) {
              if (w.globals.collapsedSeriesIndices.indexOf(
                (seriesIndex == null ? void 0 : seriesIndex[pii]) || pii
              ) > -1) {
                pii--;
              } else {
                return pii;
              }
            }
            return 0;
          };
          lineYPosition = this.prevSeriesY[prevIndex(i - 1)][j2 + 1];
        } else {
          lineYPosition = this.zeroY;
        }
      } else {
        lineYPosition = this.zeroY;
      }
      if (isNull) {
        y = getY(minY, lineYPosition);
      } else {
        y = getY(series[i][j2 + 1], lineYPosition);
        if (type === "rangeArea") {
          y2 = getY(seriesRangeEnd[i][j2 + 1], lineYPosition);
        }
      }
      xArrj.push(series[i][j2 + 1] === null ? null : x);
      if (isNull && (w.config.stroke.curve === "smooth" || w.config.stroke.curve === "monotoneCubic")) {
        yArrj.push(null);
        y2Arrj.push(null);
      } else {
        yArrj.push(y);
        y2Arrj.push(y2);
      }
      let pointsPos = this.lineHelpers.calculatePoints({
        series,
        x,
        y,
        realIndex: realIndex2,
        i,
        j: j2,
        prevY
      });
      let calculatedPaths = this._createPaths({
        type,
        series,
        i,
        realIndex: realIndex2,
        j: j2,
        x,
        y,
        y2,
        xArrj,
        yArrj,
        y2Arrj,
        pX,
        pY,
        pathState,
        segmentStartX,
        linePath,
        areaPath,
        linePaths,
        areaPaths,
        curve,
        isRangeStart
      });
      areaPaths = calculatedPaths.areaPaths;
      linePaths = calculatedPaths.linePaths;
      pX = calculatedPaths.pX;
      pY = calculatedPaths.pY;
      pathState = calculatedPaths.pathState;
      segmentStartX = calculatedPaths.segmentStartX;
      areaPath = calculatedPaths.areaPath;
      linePath = calculatedPaths.linePath;
      if (this.appendPathFrom && !w.globals.hasNullValues && !(curve === "monotoneCubic" && type === "rangeArea")) {
        pathFromLine += graphics.line(x, this.areaBottomY);
        pathFromArea += graphics.line(x, this.areaBottomY);
      }
      this.handleNullDataPoints(series, pointsPos, i, j2, realIndex2);
      this._handleMarkersAndLabels({
        type,
        pointsPos,
        i,
        j: j2,
        realIndex: realIndex2,
        isRangeStart
      });
    }
    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths,
      linePath,
      areaPath
    };
  }
  _handleMarkersAndLabels({ type, pointsPos, isRangeStart, i, j: j2, realIndex: realIndex2 }) {
    const w = this.w;
    let dataLabels = new DataLabels(this.ctx);
    if (!this.pointsChart) {
      if (w.globals.series[i].length > 1) {
        this.elPointsMain.node.classList.add("apexcharts-element-hidden");
      }
      let elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex2,
        j: j2 + 1
      });
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap);
      }
    } else {
      this.scatter.draw(this.elSeries, j2, {
        realIndex: realIndex2,
        pointsPos,
        zRatio: this.zRatio,
        elParent: this.elPointsMain
      });
    }
    let drawnLabels = dataLabels.drawDataLabel({
      type,
      isRangeStart,
      pos: pointsPos,
      i: realIndex2,
      j: j2 + 1
    });
    if (drawnLabels !== null) {
      this.elDataLabelsWrap.add(drawnLabels);
    }
  }
  _createPaths({
    type,
    series,
    i,
    realIndex: realIndex2,
    j: j2,
    x,
    y,
    xArrj,
    yArrj,
    y2,
    y2Arrj,
    pX,
    pY,
    pathState,
    segmentStartX,
    linePath,
    areaPath,
    linePaths,
    areaPaths,
    curve,
    isRangeStart
  }) {
    let graphics = new Graphics(this.ctx);
    const areaBottomY = this.areaBottomY;
    let rangeArea = type === "rangeArea";
    let isLowerRangeAreaPath = type === "rangeArea" && isRangeStart;
    switch (curve) {
      case "monotoneCubic":
        let yAj = isRangeStart ? yArrj : y2Arrj;
        let getSmoothInputs = (xArr, yArr) => {
          return xArr.map((_, i2) => {
            return [_, yArr[i2]];
          }).filter((_) => _[1] !== null);
        };
        let getSegmentLengths = (yArr) => {
          let segLens = [];
          let count = 0;
          yArr.forEach((_) => {
            if (_ !== null) {
              count++;
            } else if (count > 0) {
              segLens.push(count);
              count = 0;
            }
          });
          if (count > 0) {
            segLens.push(count);
          }
          return segLens;
        };
        let getSegments = (yArr, points) => {
          let segLens = getSegmentLengths(yArr);
          let segments = [];
          for (let i2 = 0, len = 0; i2 < segLens.length; len += segLens[i2++]) {
            segments[i2] = spline.slice(points, len, len + segLens[i2]);
          }
          return segments;
        };
        switch (pathState) {
          case 0:
            if (yAj[j2 + 1] === null) {
              break;
            }
            pathState = 1;
          // continue through to pathState 1
          case 1:
            if (!(rangeArea ? xArrj.length === series[i].length : j2 === series[i].length - 2)) {
              break;
            }
          // continue through to pathState 2
          case 2:
            const _xAj = isRangeStart ? xArrj : xArrj.slice().reverse();
            const _yAj = isRangeStart ? yAj : yAj.slice().reverse();
            const smoothInputs = getSmoothInputs(_xAj, _yAj);
            const points = smoothInputs.length > 1 ? spline.points(smoothInputs) : smoothInputs;
            let smoothInputsLower = [];
            if (rangeArea) {
              if (isLowerRangeAreaPath) {
                areaPaths = smoothInputs;
              } else {
                smoothInputsLower = areaPaths.reverse();
              }
            }
            let segmentCount = 0;
            let smoothInputsIndex = 0;
            getSegments(_yAj, points).forEach((_) => {
              segmentCount++;
              let svgPoints = svgPath(_);
              let _start = smoothInputsIndex;
              smoothInputsIndex += _.length;
              let _end = smoothInputsIndex - 1;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints;
              } else if (rangeArea) {
                linePath = graphics.move(
                  smoothInputsLower[_start][0],
                  smoothInputsLower[_start][1]
                ) + graphics.line(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints + graphics.line(
                  smoothInputsLower[_end][0],
                  smoothInputsLower[_end][1]
                );
              } else {
                linePath = graphics.move(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints;
                areaPath = linePath + graphics.line(smoothInputs[_end][0], areaBottomY) + graphics.line(smoothInputs[_start][0], areaBottomY) + "z";
                areaPaths.push(areaPath);
              }
              linePaths.push(linePath);
            });
            if (rangeArea && segmentCount > 1 && !isLowerRangeAreaPath) {
              let upperLinePaths = linePaths.slice(segmentCount).reverse();
              linePaths.splice(segmentCount);
              upperLinePaths.forEach((u) => linePaths.push(u));
            }
            pathState = 0;
            break;
        }
        break;
      case "smooth":
        let length = (x - pX) * 0.35;
        if (series[i][j2] === null) {
          pathState = 0;
        } else {
          switch (pathState) {
            case 0:
              segmentStartX = pX;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(pX, y2Arrj[j2]) + graphics.line(pX, pY);
              } else {
                linePath = graphics.move(pX, pY);
              }
              areaPath = graphics.move(pX, pY);
              if (series[i][j2 + 1] === null || typeof series[i][j2 + 1] === "undefined") {
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j2 < series[i].length - 2) {
                let p = graphics.curve(pX + length, pY, x - length, y, x, y);
                linePath += p;
                areaPath += p;
                break;
              }
            // Continue on with pathState 1 to finish the path and exit
            case 1:
              if (series[i][j2 + 1] === null) {
                if (isLowerRangeAreaPath) {
                  linePath += graphics.line(pX, y2);
                } else {
                  linePath += graphics.move(pX, pY);
                }
                areaPath += graphics.line(pX, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                pathState = -1;
              } else {
                let p = graphics.curve(pX + length, pY, x - length, y, x, y);
                linePath += p;
                areaPath += p;
                if (j2 >= series[i].length - 2) {
                  if (isLowerRangeAreaPath) {
                    linePath += graphics.curve(x, y, x, y, x, y2) + graphics.move(x, y2);
                  }
                  areaPath += graphics.curve(x, y, x, y, x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                  linePaths.push(linePath);
                  areaPaths.push(areaPath);
                  pathState = -1;
                }
              }
              break;
          }
        }
        pX = x;
        pY = y;
        break;
      default:
        let pathToPoint = (curve2, x2, y3) => {
          let path = [];
          switch (curve2) {
            case "stepline":
              path = graphics.line(x2, null, "H") + graphics.line(null, y3, "V");
              break;
            case "linestep":
              path = graphics.line(null, y3, "V") + graphics.line(x2, null, "H");
              break;
            case "straight":
              path = graphics.line(x2, y3);
              break;
          }
          return path;
        };
        if (series[i][j2] === null) {
          pathState = 0;
        } else {
          switch (pathState) {
            case 0:
              segmentStartX = pX;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(pX, y2Arrj[j2]) + graphics.line(pX, pY);
              } else {
                linePath = graphics.move(pX, pY);
              }
              areaPath = graphics.move(pX, pY);
              if (series[i][j2 + 1] === null || typeof series[i][j2 + 1] === "undefined") {
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j2 < series[i].length - 2) {
                let p = pathToPoint(curve, x, y);
                linePath += p;
                areaPath += p;
                break;
              }
            // Continue on with pathState 1 to finish the path and exit
            case 1:
              if (series[i][j2 + 1] === null) {
                if (isLowerRangeAreaPath) {
                  linePath += graphics.line(pX, y2);
                } else {
                  linePath += graphics.move(pX, pY);
                }
                areaPath += graphics.line(pX, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                pathState = -1;
              } else {
                let p = pathToPoint(curve, x, y);
                linePath += p;
                areaPath += p;
                if (j2 >= series[i].length - 2) {
                  if (isLowerRangeAreaPath) {
                    linePath += graphics.line(x, y2);
                  }
                  areaPath += graphics.line(x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                  linePaths.push(linePath);
                  areaPaths.push(areaPath);
                  pathState = -1;
                }
              }
              break;
          }
        }
        pX = x;
        pY = y;
        break;
    }
    return {
      linePaths,
      areaPaths,
      pX,
      pY,
      pathState,
      segmentStartX,
      linePath,
      areaPath
    };
  }
  handleNullDataPoints(series, pointsPos, i, j2, realIndex2) {
    const w = this.w;
    if (series[i][j2] === null && w.config.markers.showNullDataPoints || series[i].length === 1) {
      let pSize = this.strokeWidth - w.config.markers.strokeWidth / 2;
      if (!(pSize > 0)) {
        pSize = 0;
      }
      let elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex2,
        j: j2 + 1,
        pSize,
        alwaysDrawMarker: true
      });
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap);
      }
    }
  }
}
class CircularChartsHelpers {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  drawYAxisTexts(x, y, i, text) {
    const w = this.w;
    const yaxisConfig = w.config.yaxis[0];
    const formatter = w.globals.yLabelFormatters[0];
    const graphics = new Graphics(this.ctx);
    const yaxisLabel = graphics.drawText({
      x: x + yaxisConfig.labels.offsetX,
      y: y + yaxisConfig.labels.offsetY,
      text: formatter(text, i),
      textAnchor: "middle",
      fontSize: yaxisConfig.labels.style.fontSize,
      fontFamily: yaxisConfig.labels.style.fontFamily,
      foreColor: Array.isArray(yaxisConfig.labels.style.colors) ? yaxisConfig.labels.style.colors[i] : yaxisConfig.labels.style.colors
    });
    return yaxisLabel;
  }
}
class Pie {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    const w = this.w;
    this.chartType = this.w.config.chart.type;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    this.animBeginArr = [0];
    this.animDur = 0;
    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels;
    this.lineColorArr = w.globals.stroke.colors !== void 0 ? w.globals.stroke.colors : w.globals.colors;
    this.defaultSize = Math.min(w.globals.gridWidth, w.globals.gridHeight);
    this.centerY = this.defaultSize / 2;
    this.centerX = w.globals.gridWidth / 2;
    if (w.config.chart.type === "radialBar") {
      this.fullAngle = 360;
    } else {
      this.fullAngle = Math.abs(
        w.config.plotOptions.pie.endAngle - w.config.plotOptions.pie.startAngle
      );
    }
    this.initialAngle = w.config.plotOptions.pie.startAngle % this.fullAngle;
    w.globals.radialSize = this.defaultSize / 2.05 - w.config.stroke.width - (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0);
    this.donutSize = w.globals.radialSize * parseInt(w.config.plotOptions.pie.donut.size, 10) / 100;
    let scaleSize = w.config.plotOptions.pie.customScale;
    let halfW = w.globals.gridWidth / 2;
    let halfH = w.globals.gridHeight / 2;
    this.translateX = halfW - halfW * scaleSize;
    this.translateY = halfH - halfH * scaleSize;
    this.dataLabelsGroup = new Graphics(this.ctx).group({
      class: "apexcharts-datalabels-group",
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${scaleSize})`
    });
    this.maxY = 0;
    this.sliceLabels = [];
    this.sliceSizes = [];
    this.prevSectorAngleArr = [];
  }
  draw(series) {
    let self = this;
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    let elPie = graphics.group({
      class: "apexcharts-pie"
    });
    if (w.globals.noData) return elPie;
    let total = 0;
    for (let k = 0; k < series.length; k++) {
      total += Utils$1.negToZero(series[k]);
    }
    let sectorAngleArr = [];
    let elSeries = graphics.group();
    if (total === 0) {
      total = 1e-5;
    }
    series.forEach((m) => {
      this.maxY = Math.max(this.maxY, m);
    });
    if (w.config.yaxis[0].max) {
      this.maxY = w.config.yaxis[0].max;
    }
    if (w.config.grid.position === "back" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    for (let i = 0; i < series.length; i++) {
      let angle = this.fullAngle * Utils$1.negToZero(series[i]) / total;
      sectorAngleArr.push(angle);
      if (this.chartType === "polarArea") {
        sectorAngleArr[i] = this.fullAngle / series.length;
        this.sliceSizes.push(w.globals.radialSize * series[i] / this.maxY);
      } else {
        this.sliceSizes.push(w.globals.radialSize);
      }
    }
    if (w.globals.dataChanged) {
      let prevTotal = 0;
      for (let k = 0; k < w.globals.previousPaths.length; k++) {
        prevTotal += Utils$1.negToZero(w.globals.previousPaths[k]);
      }
      let previousAngle;
      for (let i = 0; i < w.globals.previousPaths.length; i++) {
        previousAngle = this.fullAngle * Utils$1.negToZero(w.globals.previousPaths[i]) / prevTotal;
        this.prevSectorAngleArr.push(previousAngle);
      }
    }
    if (this.donutSize < 0) {
      this.donutSize = 0;
    }
    if (this.chartType === "donut") {
      const circle = graphics.drawCircle(this.donutSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w.config.plotOptions.pie.donut.background ? w.config.plotOptions.pie.donut.background : "transparent"
      });
      elSeries.add(circle);
    }
    let elG = self.drawArcs(sectorAngleArr, series);
    this.sliceLabels.forEach((s) => {
      elG.add(s);
    });
    elSeries.attr({
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${w.config.plotOptions.pie.customScale})`
    });
    elSeries.add(elG);
    elPie.add(elSeries);
    if (this.donutDataLabels.show) {
      let dataLabels = this.renderInnerDataLabels(
        this.dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show
        }
      );
      elPie.add(dataLabels);
    }
    if (w.config.grid.position === "front" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    return elPie;
  }
  // core function for drawing pie arcs
  drawArcs(sectorAngleArr, series) {
    let w = this.w;
    const filters = new Filters(this.ctx);
    let graphics = new Graphics(this.ctx);
    let fill = new Fill(this.ctx);
    let g = graphics.group({
      class: "apexcharts-slices"
    });
    let startAngle = this.initialAngle;
    let prevStartAngle = this.initialAngle;
    let endAngle = this.initialAngle;
    let prevEndAngle = this.initialAngle;
    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0;
    for (let i = 0; i < sectorAngleArr.length; i++) {
      let elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      g.add(elPieArc);
      startAngle = endAngle;
      prevStartAngle = prevEndAngle;
      endAngle = startAngle + sectorAngleArr[i];
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i];
      const angle = endAngle < startAngle ? this.fullAngle + endAngle - startAngle : endAngle - startAngle;
      let pathFill = fill.fillPath({
        seriesNumber: i,
        size: this.sliceSizes[i],
        value: series[i]
      });
      let path = this.getChangedPath(prevStartAngle, prevEndAngle);
      let elPath = graphics.drawPath({
        d: path,
        stroke: Array.isArray(this.lineColorArr) ? this.lineColorArr[i] : this.lineColorArr,
        strokeWidth: 0,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
      });
      elPath.attr({
        index: 0,
        j: i
      });
      filters.setSelectionFilter(elPath, 0, i);
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      this.addListeners(elPath, this.donutDataLabels);
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:startAngle": startAngle,
        "data:strokeWidth": this.strokeWidth,
        "data:value": series[i]
      });
      let labelPosition = {
        x: 0,
        y: 0
      };
      if (this.chartType === "pie" || this.chartType === "polarArea") {
        labelPosition = Utils$1.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 1.25 + w.config.plotOptions.pie.dataLabels.offset,
          (startAngle + angle / 2) % this.fullAngle
        );
      } else if (this.chartType === "donut") {
        labelPosition = Utils$1.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2 + w.config.plotOptions.pie.dataLabels.offset,
          (startAngle + angle / 2) % this.fullAngle
        );
      }
      elPieArc.add(elPath);
      let dur = 0;
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = angle / this.fullAngle * w.config.chart.animations.speed;
        if (dur === 0) dur = 1;
        this.animDur = dur + this.animDur;
        this.animBeginArr.push(this.animDur);
      } else {
        this.animBeginArr.push(0);
      }
      if (this.dynamicAnim && w.globals.dataChanged) {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          shouldSetPrevPaths: true,
          dur: w.config.chart.animations.dynamicAnimation.speed
        });
      } else {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur
        });
      }
      if (w.config.plotOptions.pie.expandOnClick && this.chartType !== "polarArea") {
        elPath.node.addEventListener("mouseup", this.pieClicked.bind(this, i));
      }
      if (typeof w.globals.selectedDataPoints[0] !== "undefined" && w.globals.selectedDataPoints[0].indexOf(i) > -1) {
        this.pieClicked(i);
      }
      if (w.config.dataLabels.enabled) {
        let xPos = labelPosition.x;
        let yPos = labelPosition.y;
        let text = 100 * angle / this.fullAngle + "%";
        if (angle !== 0 && w.config.plotOptions.pie.dataLabels.minAngleToShowLabel < sectorAngleArr[i]) {
          let formatter = w.config.dataLabels.formatter;
          if (formatter !== void 0) {
            text = formatter(w.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w
            });
          }
          let foreColor = w.globals.dataLabels.style.colors[i];
          const elPieLabelWrap = graphics.group({
            class: `apexcharts-datalabels`
          });
          let elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text,
            textAnchor: "middle",
            fontSize: w.config.dataLabels.style.fontSize,
            fontFamily: w.config.dataLabels.style.fontFamily,
            fontWeight: w.config.dataLabels.style.fontWeight,
            foreColor
          });
          elPieLabelWrap.add(elPieLabel);
          if (w.config.dataLabels.dropShadow.enabled) {
            const textShadow = w.config.dataLabels.dropShadow;
            filters.dropShadow(elPieLabel, textShadow);
          }
          elPieLabel.node.classList.add("apexcharts-pie-label");
          if (w.config.chart.animations.animate && w.globals.resized === false) {
            elPieLabel.node.classList.add("apexcharts-pie-label-delay");
            elPieLabel.node.style.animationDelay = w.config.chart.animations.speed / 940 + "s";
          }
          this.sliceLabels.push(elPieLabelWrap);
        }
      }
    }
    return g;
  }
  addListeners(elPath, dataLabels) {
    const graphics = new Graphics(this.ctx);
    elPath.node.addEventListener(
      "mouseenter",
      graphics.pathMouseEnter.bind(this, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      graphics.pathMouseLeave.bind(this, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      this.revertDataLabelsInner.bind(this, elPath.node, dataLabels)
    );
    elPath.node.addEventListener(
      "mousedown",
      graphics.pathMouseDown.bind(this, elPath)
    );
    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        "mouseenter",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
      elPath.node.addEventListener(
        "mousedown",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
    }
  }
  // This function can be used for other circle charts too
  animatePaths(el, opts) {
    let w = this.w;
    let me = this;
    let angle = opts.endAngle < opts.startAngle ? this.fullAngle + opts.endAngle - opts.startAngle : opts.endAngle - opts.startAngle;
    let prevAngle = angle;
    let fromStartAngle = opts.startAngle;
    let toStartAngle = opts.startAngle;
    if (opts.prevStartAngle !== void 0 && opts.prevEndAngle !== void 0) {
      fromStartAngle = opts.prevEndAngle;
      prevAngle = opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle;
    }
    if (opts.i === w.config.series.length - 1) {
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle);
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle = opts.endAngle + (this.fullAngle - (angle + toStartAngle));
      }
    }
    if (angle === this.fullAngle) angle = this.fullAngle - 0.01;
    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts);
  }
  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    let me = this;
    const w = this.w;
    const animations = new Animations(this.ctx);
    let size = opts.size;
    let path;
    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle;
      prevAngle = angle;
      opts.dur = 0;
    }
    let currAngle = angle;
    let startAngle = toStartAngle;
    let fromAngle = fromStartAngle < toStartAngle ? this.fullAngle + fromStartAngle - toStartAngle : fromStartAngle - toStartAngle;
    if (w.globals.dataChanged && opts.shouldSetPrevPaths) {
      if (opts.prevEndAngle) {
        path = me.getPiePath({
          me,
          startAngle: opts.prevStartAngle,
          angle: opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle,
          size
        });
        el.attr({ d: path });
      }
    }
    if (opts.dur !== 0) {
      el.animate(opts.dur, opts.animBeginArr[opts.i]).after(function() {
        if (me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea") {
          this.animate(w.config.chart.animations.dynamicAnimation.speed).attr(
            {
              "stroke-width": me.strokeWidth
            }
          );
        }
        if (opts.i === w.config.series.length - 1) {
          animations.animationCompleted(el);
        }
      }).during((pos) => {
        currAngle = fromAngle + (angle - fromAngle) * pos;
        if (opts.animateStartingPos) {
          currAngle = prevAngle + (angle - prevAngle) * pos;
          startAngle = fromStartAngle - prevAngle + (toStartAngle - (fromStartAngle - prevAngle)) * pos;
        }
        path = me.getPiePath({
          me,
          startAngle,
          angle: currAngle,
          size
        });
        el.node.setAttribute("data:pathOrig", path);
        el.attr({
          d: path
        });
      });
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size
      });
      if (!opts.isTrack) {
        w.globals.animationEnded = true;
      }
      el.node.setAttribute("data:pathOrig", path);
      el.attr({
        d: path,
        "stroke-width": me.strokeWidth
      });
    }
  }
  pieClicked(i) {
    let w = this.w;
    let me = this;
    let path;
    let size = me.sliceSizes[i] + (w.config.plotOptions.pie.expandOnClick ? 4 : 0);
    let elPath = w.globals.dom.Paper.findOne(
      `.apexcharts-${me.chartType.toLowerCase()}-slice-${i}`
    );
    if (elPath.attr("data:pieClicked") === "true") {
      elPath.attr({
        "data:pieClicked": "false"
      });
      this.revertDataLabelsInner(elPath.node, this.donutDataLabels);
      let origPath = elPath.attr("data:pathOrig");
      elPath.attr({
        d: origPath
      });
      return;
    } else {
      let allEls = w.globals.dom.baseEl.getElementsByClassName(
        "apexcharts-pie-area"
      );
      Array.prototype.forEach.call(allEls, (pieSlice) => {
        pieSlice.setAttribute("data:pieClicked", "false");
        let origPath = pieSlice.getAttribute("data:pathOrig");
        if (origPath) {
          pieSlice.setAttribute("d", origPath);
        }
      });
      w.globals.capturedDataPointIndex = i;
      elPath.attr("data:pieClicked", "true");
    }
    let startAngle = parseInt(elPath.attr("data:startAngle"), 10);
    let angle = parseInt(elPath.attr("data:angle"), 10);
    path = me.getPiePath({
      me,
      startAngle,
      angle,
      size
    });
    if (angle === 360) return;
    elPath.plot(path);
  }
  getChangedPath(prevStartAngle, prevEndAngle) {
    let path = "";
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        size: this.size
      });
    }
    return path;
  }
  getPiePath({ me, startAngle, angle, size }) {
    let path;
    const graphics = new Graphics(this.ctx);
    let startDeg = startAngle;
    let startRadians = Math.PI * (startDeg - 90) / 180;
    let endDeg = angle + startAngle;
    if (Math.ceil(endDeg) >= this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle) {
      endDeg = this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle - 0.01;
    }
    if (Math.ceil(endDeg) > this.fullAngle) endDeg -= this.fullAngle;
    let endRadians = Math.PI * (endDeg - 90) / 180;
    let x1 = me.centerX + size * Math.cos(startRadians);
    let y1 = me.centerY + size * Math.sin(startRadians);
    let x2 = me.centerX + size * Math.cos(endRadians);
    let y2 = me.centerY + size * Math.sin(endRadians);
    let startInner = Utils$1.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg
    );
    let endInner = Utils$1.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg
    );
    let largeArc = angle > 180 ? 1 : 0;
    const pathBeginning = ["M", x1, y1, "A", size, size, 0, largeArc, 1, x2, y2];
    if (me.chartType === "donut") {
      path = [
        ...pathBeginning,
        "L",
        startInner.x,
        startInner.y,
        "A",
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        "L",
        x1,
        y1,
        "z"
      ].join(" ");
    } else if (me.chartType === "pie" || me.chartType === "polarArea") {
      path = [...pathBeginning, "L", me.centerX, me.centerY, "L", x1, y1].join(
        " "
      );
    } else {
      path = [...pathBeginning].join(" ");
    }
    return graphics.roundPathCorners(path, this.strokeWidth * 2);
  }
  drawPolarElements(parent) {
    const w = this.w;
    const scale = new Scales(this.ctx);
    const graphics = new Graphics(this.ctx);
    const helpers = new CircularChartsHelpers(this.ctx);
    const gCircles = graphics.group();
    const gYAxis = graphics.group();
    const yScale = scale.niceScale(0, Math.ceil(this.maxY), 0);
    const yTexts = yScale.result.reverse();
    let len = yScale.result.length;
    this.maxY = yScale.niceMax;
    let circleSize = w.globals.radialSize;
    let diff = circleSize / (len - 1);
    for (let i = 0; i < len - 1; i++) {
      const circle = graphics.drawCircle(circleSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: "none",
        "stroke-width": w.config.plotOptions.polarArea.rings.strokeWidth,
        stroke: w.config.plotOptions.polarArea.rings.strokeColor
      });
      if (w.config.yaxis[0].show) {
        const yLabel = helpers.drawYAxisTexts(
          this.centerX,
          this.centerY - circleSize + parseInt(w.config.yaxis[0].labels.style.fontSize, 10) / 2,
          i,
          yTexts[i]
        );
        gYAxis.add(yLabel);
      }
      gCircles.add(circle);
      circleSize = circleSize - diff;
    }
    this.drawSpokes(parent);
    parent.add(gCircles);
    parent.add(gYAxis);
  }
  renderInnerDataLabels(dataLabelsGroup, dataLabelsConfig, opts) {
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    const showTotal = dataLabelsConfig.total.show;
    dataLabelsGroup.node.innerHTML = "";
    dataLabelsGroup.node.style.opacity = opts.opacity;
    let x = opts.centerX;
    let y = !this.donutDataLabels.total.label ? opts.centerY - opts.centerY / 6 : opts.centerY;
    let labelColor, valueColor;
    if (dataLabelsConfig.name.color === void 0) {
      labelColor = w.globals.colors[0];
    } else {
      labelColor = dataLabelsConfig.name.color;
    }
    let labelFontSize = dataLabelsConfig.name.fontSize;
    let labelFontFamily = dataLabelsConfig.name.fontFamily;
    let labelFontWeight = dataLabelsConfig.name.fontWeight;
    if (dataLabelsConfig.value.color === void 0) {
      valueColor = w.config.chart.foreColor;
    } else {
      valueColor = dataLabelsConfig.value.color;
    }
    let lbFormatter = dataLabelsConfig.value.formatter;
    let val = "";
    let name2 = "";
    if (showTotal) {
      labelColor = dataLabelsConfig.total.color;
      labelFontSize = dataLabelsConfig.total.fontSize;
      labelFontFamily = dataLabelsConfig.total.fontFamily;
      labelFontWeight = dataLabelsConfig.total.fontWeight;
      name2 = !this.donutDataLabels.total.label ? "" : dataLabelsConfig.total.label;
      val = dataLabelsConfig.total.formatter(w);
    } else {
      if (w.globals.series.length === 1) {
        val = lbFormatter(w.globals.series[0], w);
        name2 = w.globals.seriesNames[0];
      }
    }
    if (name2) {
      name2 = dataLabelsConfig.name.formatter(
        name2,
        dataLabelsConfig.total.show,
        w
      );
    }
    if (dataLabelsConfig.name.show) {
      let elLabel = graphics.drawText({
        x,
        y: y + parseFloat(dataLabelsConfig.name.offsetY),
        text: name2,
        textAnchor: "middle",
        foreColor: labelColor,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily
      });
      elLabel.node.classList.add("apexcharts-datalabel-label");
      dataLabelsGroup.add(elLabel);
    }
    if (dataLabelsConfig.value.show) {
      let valOffset = dataLabelsConfig.name.show ? parseFloat(dataLabelsConfig.value.offsetY) + 16 : dataLabelsConfig.value.offsetY;
      let elValue = graphics.drawText({
        x,
        y: y + valOffset,
        text: val,
        textAnchor: "middle",
        foreColor: valueColor,
        fontWeight: dataLabelsConfig.value.fontWeight,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily
      });
      elValue.node.classList.add("apexcharts-datalabel-value");
      dataLabelsGroup.add(elValue);
    }
    return dataLabelsGroup;
  }
  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {object} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   */
  printInnerLabels(labelsConfig, name2, val, el) {
    const w = this.w;
    let labelColor;
    if (el) {
      if (labelsConfig.name.color === void 0) {
        labelColor = w.globals.colors[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
      } else {
        labelColor = labelsConfig.name.color;
      }
    } else {
      if (w.globals.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color;
      }
    }
    let elLabel = w.globals.dom.baseEl.querySelector(
      ".apexcharts-datalabel-label"
    );
    let elValue = w.globals.dom.baseEl.querySelector(
      ".apexcharts-datalabel-value"
    );
    let lbFormatter = labelsConfig.value.formatter;
    val = lbFormatter(val, w);
    if (!el && typeof labelsConfig.total.formatter === "function") {
      val = labelsConfig.total.formatter(w);
    }
    const isTotal = name2 === labelsConfig.total.label;
    name2 = !this.donutDataLabels.total.label ? "" : labelsConfig.name.formatter(name2, isTotal, w);
    if (elLabel !== null) {
      elLabel.textContent = name2;
    }
    if (elValue !== null) {
      elValue.textContent = val;
    }
    if (elLabel !== null) {
      elLabel.style.fill = labelColor;
    }
  }
  printDataLabelsInner(el, dataLabelsConfig) {
    let w = this.w;
    let val = el.getAttribute("data:value");
    let name2 = w.globals.seriesNames[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
    if (w.globals.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name2, val, el);
    }
    let dataLabelsGroup = w.globals.dom.baseEl.querySelector(
      ".apexcharts-datalabels-group"
    );
    if (dataLabelsGroup !== null) {
      dataLabelsGroup.style.opacity = 1;
    }
  }
  drawSpokes(parent) {
    const w = this.w;
    const graphics = new Graphics(this.ctx);
    const spokeConfig = w.config.plotOptions.polarArea.spokes;
    if (spokeConfig.strokeWidth === 0) return;
    let spokes = [];
    let angleDivision = 360 / w.globals.series.length;
    for (let i = 0; i < w.globals.series.length; i++) {
      spokes.push(
        Utils$1.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize,
          w.config.plotOptions.pie.startAngle + angleDivision * i
        )
      );
    }
    spokes.forEach((p, i) => {
      const line = graphics.drawLine(
        p.x,
        p.y,
        this.centerX,
        this.centerY,
        Array.isArray(spokeConfig.connectorColors) ? spokeConfig.connectorColors[i] : spokeConfig.connectorColors
      );
      parent.add(line);
    });
  }
  revertDataLabelsInner() {
    const w = this.w;
    if (this.donutDataLabels.show) {
      let dataLabelsGroup = w.globals.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      let dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show
        }
      );
      let elPie = w.globals.dom.Paper.findOne(
        ".apexcharts-radialbar, .apexcharts-pie"
      );
      elPie.add(dataLabels);
    }
  }
}
class Radar {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.chartType = this.w.config.chart.type;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    this.animDur = 0;
    const w = this.w;
    this.graphics = new Graphics(this.ctx);
    this.lineColorArr = w.globals.stroke.colors !== void 0 ? w.globals.stroke.colors : w.globals.colors;
    this.defaultSize = w.globals.svgHeight < w.globals.svgWidth ? w.globals.gridHeight : w.globals.gridWidth;
    this.isLog = w.config.yaxis[0].logarithmic;
    this.logBase = w.config.yaxis[0].logBase;
    this.coreUtils = new CoreUtils(this.ctx);
    this.maxValue = this.isLog ? this.coreUtils.getLogVal(this.logBase, w.globals.maxY, 0) : w.globals.maxY;
    this.minValue = this.isLog ? this.coreUtils.getLogVal(this.logBase, this.w.globals.minY, 0) : w.globals.minY;
    this.polygons = w.config.plotOptions.radar.polygons;
    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0;
    this.size = this.defaultSize / 2.1 - this.strokeWidth - w.config.chart.dropShadow.blur;
    if (w.config.xaxis.labels.show) {
      this.size = this.size - w.globals.xAxisLabelsWidth / 1.75;
    }
    if (w.config.plotOptions.radar.size !== void 0) {
      this.size = w.config.plotOptions.radar.size;
    }
    this.dataRadiusOfPercent = [];
    this.dataRadius = [];
    this.angleArr = [];
    this.yaxisLabelsTextsPos = [];
  }
  draw(series) {
    let w = this.w;
    const fill = new Fill(this.ctx);
    const allSeries = [];
    const dataLabels = new DataLabels(this.ctx);
    if (series.length) {
      this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length;
    }
    this.disAngle = Math.PI * 2 / this.dataPointsLen;
    let halfW = w.globals.gridWidth / 2;
    let halfH = w.globals.gridHeight / 2;
    let translateX = halfW + w.config.plotOptions.radar.offsetX;
    let translateY = halfH + w.config.plotOptions.radar.offsetY;
    let ret = this.graphics.group({
      class: "apexcharts-radar-series apexcharts-plot-series",
      transform: `translate(${translateX || 0}, ${translateY || 0})`
    });
    let dataPointsPos = [];
    let elPointsMain = null;
    let elDataPointsMain = null;
    this.yaxisLabels = this.graphics.group({
      class: "apexcharts-yaxis"
    });
    series.forEach((s, i) => {
      let longestSeries = s.length === w.globals.dataPoints;
      let elSeries = this.graphics.group().attr({
        class: `apexcharts-series`,
        "data:longestSeries": longestSeries,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      this.dataRadiusOfPercent[i] = [];
      this.dataRadius[i] = [];
      this.angleArr[i] = [];
      s.forEach((dv, j2) => {
        const range = Math.abs(this.maxValue - this.minValue);
        dv = dv - this.minValue;
        if (this.isLog) {
          dv = this.coreUtils.getLogVal(this.logBase, dv, 0);
        }
        this.dataRadiusOfPercent[i][j2] = dv / range;
        this.dataRadius[i][j2] = this.dataRadiusOfPercent[i][j2] * this.size;
        this.angleArr[i][j2] = j2 * this.disAngle;
      });
      dataPointsPos = this.getDataPointsPos(
        this.dataRadius[i],
        this.angleArr[i]
      );
      const paths = this.createPaths(dataPointsPos, {
        x: 0,
        y: 0
      });
      elPointsMain = this.graphics.group({
        class: "apexcharts-series-markers-wrap apexcharts-element-hidden"
      });
      elDataPointsMain = this.graphics.group({
        class: `apexcharts-datalabels`,
        "data:realIndex": i
      });
      w.globals.delayedElements.push({
        el: elPointsMain.node,
        index: i
      });
      const defaultRenderedPathOptions = {
        i,
        realIndex: i,
        animationDelay: i,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
        className: `apexcharts-radar`,
        shouldClipToGrid: false,
        bindEventsOnPaths: false,
        stroke: w.globals.stroke.colors[i],
        strokeLineCap: w.config.stroke.lineCap
      };
      let pathFrom = null;
      if (w.globals.previousPaths.length > 0) {
        pathFrom = this.getPreviousPath(i);
      }
      for (let p = 0; p < paths.linePathsTo.length; p++) {
        let renderedLinePath = this.graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: pathFrom === null ? paths.linePathsFrom[p] : pathFrom,
          pathTo: paths.linePathsTo[p],
          strokeWidth: Array.isArray(this.strokeWidth) ? this.strokeWidth[i] : this.strokeWidth,
          fill: "none",
          drawShadow: false
        }));
        elSeries.add(renderedLinePath);
        let pathFill = fill.fillPath({
          seriesNumber: i
        });
        let renderedAreaPath = this.graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: pathFrom === null ? paths.areaPathsFrom[p] : pathFrom,
          pathTo: paths.areaPathsTo[p],
          strokeWidth: 0,
          fill: pathFill,
          drawShadow: false
        }));
        if (w.config.chart.dropShadow.enabled) {
          const filters = new Filters(this.ctx);
          const shadow = w.config.chart.dropShadow;
          filters.dropShadow(
            renderedAreaPath,
            Object.assign({}, shadow, { noUserSpaceOnUse: true }),
            i
          );
        }
        elSeries.add(renderedAreaPath);
      }
      s.forEach((sj, j2) => {
        let markers = new Markers(this.ctx);
        let opts = markers.getMarkerConfig({
          cssClass: "apexcharts-marker",
          seriesIndex: i,
          dataPointIndex: j2
        });
        let point = this.graphics.drawMarker(
          dataPointsPos[j2].x,
          dataPointsPos[j2].y,
          opts
        );
        point.attr("rel", j2);
        point.attr("j", j2);
        point.attr("index", i);
        point.node.setAttribute("default-marker-size", opts.pSize);
        let elPointsWrap = this.graphics.group({
          class: "apexcharts-series-markers"
        });
        if (elPointsWrap) {
          elPointsWrap.add(point);
        }
        elPointsMain.add(elPointsWrap);
        elSeries.add(elPointsMain);
        const dataLabelsConfig = w.config.dataLabels;
        if (dataLabelsConfig.enabled) {
          let text = dataLabelsConfig.formatter(w.globals.series[i][j2], {
            seriesIndex: i,
            dataPointIndex: j2,
            w
          });
          dataLabels.plotDataLabelsText({
            x: dataPointsPos[j2].x,
            y: dataPointsPos[j2].y,
            text,
            textAnchor: "middle",
            i,
            j: i,
            parent: elDataPointsMain,
            offsetCorrection: false,
            dataLabelsConfig: __spreadValues({}, dataLabelsConfig)
          });
        }
        elSeries.add(elDataPointsMain);
      });
      allSeries.push(elSeries);
    });
    this.drawPolygons({
      parent: ret
    });
    if (w.config.xaxis.labels.show) {
      const xaxisTexts = this.drawXAxisTexts();
      ret.add(xaxisTexts);
    }
    allSeries.forEach((elS) => {
      ret.add(elS);
    });
    ret.add(this.yaxisLabels);
    return ret;
  }
  drawPolygons(opts) {
    const w = this.w;
    const { parent } = opts;
    const helpers = new CircularChartsHelpers(this.ctx);
    const yaxisTexts = w.globals.yAxisScale[0].result.reverse();
    const layers = yaxisTexts.length;
    let radiusSizes = [];
    let layerDis = this.size / (layers - 1);
    for (let i = 0; i < layers; i++) {
      radiusSizes[i] = layerDis * i;
    }
    radiusSizes.reverse();
    let polygonStrings = [];
    let lines = [];
    radiusSizes.forEach((radiusSize, r) => {
      const polygon = Utils$1.getPolygonPos(radiusSize, this.dataPointsLen);
      let string = "";
      polygon.forEach((p, i) => {
        if (r === 0) {
          const line = this.graphics.drawLine(
            p.x,
            p.y,
            0,
            0,
            Array.isArray(this.polygons.connectorColors) ? this.polygons.connectorColors[i] : this.polygons.connectorColors
          );
          lines.push(line);
        }
        if (i === 0) {
          this.yaxisLabelsTextsPos.push({
            x: p.x,
            y: p.y
          });
        }
        string += p.x + "," + p.y + " ";
      });
      polygonStrings.push(string);
    });
    polygonStrings.forEach((p, i) => {
      const strokeColors = this.polygons.strokeColors;
      const strokeWidth = this.polygons.strokeWidth;
      const polygon = this.graphics.drawPolygon(
        p,
        Array.isArray(strokeColors) ? strokeColors[i] : strokeColors,
        Array.isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
        w.globals.radarPolygons.fill.colors[i]
      );
      parent.add(polygon);
    });
    lines.forEach((l) => {
      parent.add(l);
    });
    if (w.config.yaxis[0].show) {
      this.yaxisLabelsTextsPos.forEach((p, i) => {
        const yText = helpers.drawYAxisTexts(p.x, p.y, i, yaxisTexts[i]);
        this.yaxisLabels.add(yText);
      });
    }
  }
  drawXAxisTexts() {
    const w = this.w;
    const xaxisLabelsConfig = w.config.xaxis.labels;
    let elXAxisWrap = this.graphics.group({
      class: "apexcharts-xaxis"
    });
    let polygonPos = Utils$1.getPolygonPos(this.size, this.dataPointsLen);
    w.globals.labels.forEach((label, i) => {
      let formatter = w.config.xaxis.labels.formatter;
      let dataLabels = new DataLabels(this.ctx);
      if (polygonPos[i]) {
        let textPos = this.getTextPos(polygonPos[i], this.size);
        let text = formatter(label, {
          seriesIndex: -1,
          dataPointIndex: i,
          w
        });
        const dataLabelText = dataLabels.plotDataLabelsText({
          x: textPos.newX,
          y: textPos.newY,
          text,
          textAnchor: textPos.textAnchor,
          i,
          j: i,
          parent: elXAxisWrap,
          className: "apexcharts-xaxis-label",
          color: Array.isArray(xaxisLabelsConfig.style.colors) && xaxisLabelsConfig.style.colors[i] ? xaxisLabelsConfig.style.colors[i] : "#a8a8a8",
          dataLabelsConfig: __spreadValues({
            textAnchor: textPos.textAnchor,
            dropShadow: { enabled: false }
          }, xaxisLabelsConfig),
          offsetCorrection: false
        });
        dataLabelText.on("click", (e) => {
          if (typeof w.config.chart.events.xAxisLabelClick === "function") {
            const opts = Object.assign({}, w, {
              labelIndex: i
            });
            w.config.chart.events.xAxisLabelClick(e, this.ctx, opts);
          }
        });
      }
    });
    return elXAxisWrap;
  }
  createPaths(pos, origin) {
    let linePathsTo = [];
    let linePathsFrom = [];
    let areaPathsTo = [];
    let areaPathsFrom = [];
    if (pos.length) {
      linePathsFrom = [this.graphics.move(origin.x, origin.y)];
      areaPathsFrom = [this.graphics.move(origin.x, origin.y)];
      let linePathTo = this.graphics.move(pos[0].x, pos[0].y);
      let areaPathTo = this.graphics.move(pos[0].x, pos[0].y);
      pos.forEach((p, i) => {
        linePathTo += this.graphics.line(p.x, p.y);
        areaPathTo += this.graphics.line(p.x, p.y);
        if (i === pos.length - 1) {
          linePathTo += "Z";
          areaPathTo += "Z";
        }
      });
      linePathsTo.push(linePathTo);
      areaPathsTo.push(areaPathTo);
    }
    return {
      linePathsFrom,
      linePathsTo,
      areaPathsFrom,
      areaPathsTo
    };
  }
  getTextPos(pos, polygonSize) {
    let limit = 10;
    let textAnchor = "middle";
    let newX = pos.x;
    let newY = pos.y;
    if (Math.abs(pos.x) >= limit) {
      if (pos.x > 0) {
        textAnchor = "start";
        newX += 10;
      } else if (pos.x < 0) {
        textAnchor = "end";
        newX -= 10;
      }
    } else {
      textAnchor = "middle";
    }
    if (Math.abs(pos.y) >= polygonSize - limit) {
      if (pos.y < 0) {
        newY -= 10;
      } else if (pos.y > 0) {
        newY += 10;
      }
    }
    return {
      textAnchor,
      newX,
      newY
    };
  }
  getPreviousPath(realIndex2) {
    let w = this.w;
    let pathFrom = null;
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      let gpp = w.globals.previousPaths[pp];
      if (gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(realIndex2, 10)) {
        if (typeof w.globals.previousPaths[pp].paths[0] !== "undefined") {
          pathFrom = w.globals.previousPaths[pp].paths[0].d;
        }
      }
    }
    return pathFrom;
  }
  getDataPointsPos(dataRadiusArr, angleArr, dataPointsLen = this.dataPointsLen) {
    dataRadiusArr = dataRadiusArr || [];
    angleArr = angleArr || [];
    let dataPointsPosArray = [];
    for (let j2 = 0; j2 < dataPointsLen; j2++) {
      let curPointPos = {};
      curPointPos.x = dataRadiusArr[j2] * Math.sin(angleArr[j2]);
      curPointPos.y = -dataRadiusArr[j2] * Math.cos(angleArr[j2]);
      dataPointsPosArray.push(curPointPos);
    }
    return dataPointsPosArray;
  }
}
class Radial extends Pie {
  constructor(ctx) {
    super(ctx);
    this.ctx = ctx;
    this.w = ctx.w;
    this.animBeginArr = [0];
    this.animDur = 0;
    const w = this.w;
    this.startAngle = w.config.plotOptions.radialBar.startAngle;
    this.endAngle = w.config.plotOptions.radialBar.endAngle;
    this.totalAngle = Math.abs(
      w.config.plotOptions.radialBar.endAngle - w.config.plotOptions.radialBar.startAngle
    );
    this.trackStartAngle = w.config.plotOptions.radialBar.track.startAngle;
    this.trackEndAngle = w.config.plotOptions.radialBar.track.endAngle;
    this.barLabels = this.w.config.plotOptions.radialBar.barLabels;
    this.donutDataLabels = this.w.config.plotOptions.radialBar.dataLabels;
    this.radialDataLabels = this.donutDataLabels;
    if (!this.trackStartAngle) this.trackStartAngle = this.startAngle;
    if (!this.trackEndAngle) this.trackEndAngle = this.endAngle;
    if (this.endAngle === 360) this.endAngle = 359.99;
    this.margin = parseInt(w.config.plotOptions.radialBar.track.margin, 10);
    this.onBarLabelClick = this.onBarLabelClick.bind(this);
  }
  draw(series) {
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    let ret = graphics.group({
      class: "apexcharts-radialbar"
    });
    if (w.globals.noData) return ret;
    let elSeries = graphics.group();
    let centerY = this.defaultSize / 2;
    let centerX = w.globals.gridWidth / 2;
    let size = this.defaultSize / 2.05;
    if (!w.config.chart.sparkline.enabled) {
      size = size - w.config.stroke.width - w.config.chart.dropShadow.blur;
    }
    let colorArr = w.globals.fill.colors;
    if (w.config.plotOptions.radialBar.track.show) {
      let elTracks = this.drawTracks({
        size,
        centerX,
        centerY,
        colorArr,
        series
      });
      elSeries.add(elTracks);
    }
    let elG = this.drawArcs({
      size,
      centerX,
      centerY,
      colorArr,
      series
    });
    let totalAngle = 360;
    if (w.config.plotOptions.radialBar.startAngle < 0) {
      totalAngle = this.totalAngle;
    }
    let angleRatio = (360 - totalAngle) / 360;
    w.globals.radialSize = size - size * angleRatio;
    if (this.radialDataLabels.value.show) {
      let offset = Math.max(
        this.radialDataLabels.value.offsetY,
        this.radialDataLabels.name.offsetY
      );
      w.globals.radialSize += offset * angleRatio;
    }
    elSeries.add(elG.g);
    if (w.config.plotOptions.radialBar.hollow.position === "front") {
      elG.g.add(elG.elHollow);
      if (elG.dataLabels) {
        elG.g.add(elG.dataLabels);
      }
    }
    ret.add(elSeries);
    return ret;
  }
  drawTracks(opts) {
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    let g = graphics.group({
      class: "apexcharts-tracks"
    });
    let filters = new Filters(this.ctx);
    let fill = new Fill(this.ctx);
    let strokeWidth = this.getStrokeWidth(opts);
    opts.size = opts.size - strokeWidth / 2;
    for (let i = 0; i < opts.series.length; i++) {
      let elRadialBarTrack = graphics.group({
        class: "apexcharts-radialbar-track apexcharts-track"
      });
      g.add(elRadialBarTrack);
      elRadialBarTrack.attr({
        rel: i + 1
      });
      opts.size = opts.size - strokeWidth - this.margin;
      const trackConfig = w.config.plotOptions.radialBar.track;
      let pathFill = fill.fillPath({
        seriesNumber: 0,
        size: opts.size,
        fillColors: Array.isArray(trackConfig.background) ? trackConfig.background[i] : trackConfig.background,
        solid: true
      });
      let startAngle = this.trackStartAngle;
      let endAngle = this.trackEndAngle;
      if (Math.abs(endAngle) + Math.abs(startAngle) >= 360)
        endAngle = 360 - Math.abs(this.startAngle) - 0.1;
      let elPath = graphics.drawPath({
        d: "",
        stroke: pathFill,
        strokeWidth: strokeWidth * parseInt(trackConfig.strokeWidth, 10) / 100,
        fill: "none",
        strokeOpacity: trackConfig.opacity,
        classes: "apexcharts-radialbar-area"
      });
      if (trackConfig.dropShadow.enabled) {
        const shadow = trackConfig.dropShadow;
        filters.dropShadow(elPath, shadow);
      }
      elRadialBarTrack.add(elPath);
      elPath.attr("id", "apexcharts-radialbarTrack-" + i);
      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: 0,
        dur: 0,
        isTrack: true
      });
    }
    return g;
  }
  drawArcs(opts) {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    let fill = new Fill(this.ctx);
    let filters = new Filters(this.ctx);
    let g = graphics.group();
    let strokeWidth = this.getStrokeWidth(opts);
    opts.size = opts.size - strokeWidth / 2;
    let hollowFillID = w.config.plotOptions.radialBar.hollow.background;
    let hollowSize = opts.size - strokeWidth * opts.series.length - this.margin * opts.series.length - strokeWidth * parseInt(w.config.plotOptions.radialBar.track.strokeWidth, 10) / 100 / 2;
    let hollowRadius = hollowSize - w.config.plotOptions.radialBar.hollow.margin;
    if (w.config.plotOptions.radialBar.hollow.image !== void 0) {
      hollowFillID = this.drawHollowImage(opts, g, hollowSize, hollowFillID);
    }
    let elHollow = this.drawHollow({
      size: hollowRadius,
      centerX: opts.centerX,
      centerY: opts.centerY,
      fill: hollowFillID ? hollowFillID : "transparent"
    });
    if (w.config.plotOptions.radialBar.hollow.dropShadow.enabled) {
      const shadow = w.config.plotOptions.radialBar.hollow.dropShadow;
      filters.dropShadow(elHollow, shadow);
    }
    let shown = 1;
    if (!this.radialDataLabels.total.show && w.globals.series.length > 1) {
      shown = 0;
    }
    let dataLabels = null;
    if (this.radialDataLabels.show) {
      let dataLabelsGroup = w.globals.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.radialDataLabels,
        {
          hollowSize,
          centerX: opts.centerX,
          centerY: opts.centerY,
          opacity: shown
        }
      );
    }
    if (w.config.plotOptions.radialBar.hollow.position === "back") {
      g.add(elHollow);
      if (dataLabels) {
        g.add(dataLabels);
      }
    }
    let reverseLoop = false;
    if (w.config.plotOptions.radialBar.inverseOrder) {
      reverseLoop = true;
    }
    for (let i = reverseLoop ? opts.series.length - 1 : 0; reverseLoop ? i >= 0 : i < opts.series.length; reverseLoop ? i-- : i++) {
      let elRadialBarArc = graphics.group({
        class: `apexcharts-series apexcharts-radial-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[i])
      });
      g.add(elRadialBarArc);
      elRadialBarArc.attr({
        rel: i + 1,
        "data:realIndex": i
      });
      this.ctx.series.addCollapsedClassToSeries(elRadialBarArc, i);
      opts.size = opts.size - strokeWidth - this.margin;
      let pathFill = fill.fillPath({
        seriesNumber: i,
        size: opts.size,
        value: opts.series[i]
      });
      let startAngle = this.startAngle;
      let prevStartAngle;
      const dataValue = Utils$1.negToZero(opts.series[i] > 100 ? 100 : opts.series[i]) / 100;
      let endAngle = Math.round(this.totalAngle * dataValue) + this.startAngle;
      let prevEndAngle;
      if (w.globals.dataChanged) {
        prevStartAngle = this.startAngle;
        prevEndAngle = Math.round(
          this.totalAngle * Utils$1.negToZero(w.globals.previousPaths[i]) / 100
        ) + prevStartAngle;
      }
      const currFullAngle = Math.abs(endAngle) + Math.abs(startAngle);
      if (currFullAngle > 360) {
        endAngle = endAngle - 0.01;
      }
      const prevFullAngle = Math.abs(prevEndAngle) + Math.abs(prevStartAngle);
      if (prevFullAngle > 360) {
        prevEndAngle = prevEndAngle - 0.01;
      }
      let angle = endAngle - startAngle;
      const dashArray = Array.isArray(w.config.stroke.dashArray) ? w.config.stroke.dashArray[i] : w.config.stroke.dashArray;
      let elPath = graphics.drawPath({
        d: "",
        stroke: pathFill,
        strokeWidth,
        fill: "none",
        fillOpacity: w.config.fill.opacity,
        classes: "apexcharts-radialbar-area apexcharts-radialbar-slice-" + i,
        strokeDashArray: dashArray
      });
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:value": opts.series[i]
      });
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      filters.setSelectionFilter(elPath, 0, i);
      this.addListeners(elPath, this.radialDataLabels);
      elRadialBarArc.add(elPath);
      elPath.attr({
        index: 0,
        j: i
      });
      if (this.barLabels.enabled) {
        let barStartCords = Utils$1.polarToCartesian(
          opts.centerX,
          opts.centerY,
          opts.size,
          startAngle
        );
        let text = this.barLabels.formatter(w.globals.seriesNames[i], {
          seriesIndex: i,
          w
        });
        let classes = ["apexcharts-radialbar-label"];
        if (!this.barLabels.onClick) {
          classes.push("apexcharts-no-click");
        }
        let textColor = this.barLabels.useSeriesColors ? w.globals.colors[i] : w.config.chart.foreColor;
        if (!textColor) {
          textColor = w.config.chart.foreColor;
        }
        const x = barStartCords.x + this.barLabels.offsetX;
        const y = barStartCords.y + this.barLabels.offsetY;
        let elText = graphics.drawText({
          x,
          y,
          text,
          textAnchor: "end",
          dominantBaseline: "middle",
          fontFamily: this.barLabels.fontFamily,
          fontWeight: this.barLabels.fontWeight,
          fontSize: this.barLabels.fontSize,
          foreColor: textColor,
          cssClass: classes.join(" ")
        });
        elText.on("click", this.onBarLabelClick);
        elText.attr({
          rel: i + 1
        });
        if (startAngle !== 0) {
          elText.attr({
            "transform-origin": `${x} ${y}`,
            transform: `rotate(${startAngle} 0 0)`
          });
        }
        elRadialBarArc.add(elText);
      }
      let dur = 0;
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = w.config.chart.animations.speed;
      }
      if (w.globals.dataChanged) {
        dur = w.config.chart.animations.dynamicAnimation.speed;
      }
      this.animDur = dur / (opts.series.length * 1.2) + this.animDur;
      this.animBeginArr.push(this.animDur);
      this.animatePaths(elPath, {
        centerX: opts.centerX,
        centerY: opts.centerY,
        endAngle,
        startAngle,
        prevEndAngle,
        prevStartAngle,
        size: opts.size,
        i,
        totalItems: 2,
        animBeginArr: this.animBeginArr,
        dur,
        shouldSetPrevPaths: true
      });
    }
    return {
      g,
      elHollow,
      dataLabels
    };
  }
  drawHollow(opts) {
    const graphics = new Graphics(this.ctx);
    let circle = graphics.drawCircle(opts.size * 2);
    circle.attr({
      class: "apexcharts-radialbar-hollow",
      cx: opts.centerX,
      cy: opts.centerY,
      r: opts.size,
      fill: opts.fill
    });
    return circle;
  }
  drawHollowImage(opts, g, hollowSize, hollowFillID) {
    const w = this.w;
    let fill = new Fill(this.ctx);
    let randID = Utils$1.randomId();
    let hollowFillImg = w.config.plotOptions.radialBar.hollow.image;
    if (w.config.plotOptions.radialBar.hollow.imageClipped) {
      fill.clippedImgArea({
        width: hollowSize,
        height: hollowSize,
        image: hollowFillImg,
        patternID: `pattern${w.globals.cuid}${randID}`
      });
      hollowFillID = `url(#pattern${w.globals.cuid}${randID})`;
    } else {
      const imgWidth = w.config.plotOptions.radialBar.hollow.imageWidth;
      const imgHeight = w.config.plotOptions.radialBar.hollow.imageHeight;
      if (imgWidth === void 0 && imgHeight === void 0) {
        let image = w.globals.dom.Paper.image(hollowFillImg, function(loader) {
          this.move(
            opts.centerX - loader.width / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetX,
            opts.centerY - loader.height / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetY
          );
        });
        g.add(image);
      } else {
        let image = w.globals.dom.Paper.image(hollowFillImg, function(loader) {
          this.move(
            opts.centerX - imgWidth / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetX,
            opts.centerY - imgHeight / 2 + w.config.plotOptions.radialBar.hollow.imageOffsetY
          );
          this.size(imgWidth, imgHeight);
        });
        g.add(image);
      }
    }
    return hollowFillID;
  }
  getStrokeWidth(opts) {
    const w = this.w;
    return opts.size * (100 - parseInt(w.config.plotOptions.radialBar.hollow.size, 10)) / 100 / (opts.series.length + 1) - this.margin;
  }
  onBarLabelClick(e) {
    let seriesIndex = parseInt(e.target.getAttribute("rel"), 10) - 1;
    const legendClick = this.barLabels.onClick;
    const w = this.w;
    if (legendClick) {
      legendClick(w.globals.seriesNames[seriesIndex], { w, seriesIndex });
    }
  }
}
class RangeBar extends Bar {
  draw(series, seriesIndex) {
    let w = this.w;
    let graphics = new Graphics(this.ctx);
    this.rangeBarOptions = this.w.config.plotOptions.rangeBar;
    this.series = series;
    this.seriesRangeStart = w.globals.seriesRangeStart;
    this.seriesRangeEnd = w.globals.seriesRangeEnd;
    this.barHelpers.initVariables(series);
    let ret = graphics.group({
      class: "apexcharts-rangebar-series apexcharts-plot-series"
    });
    for (let i = 0; i < series.length; i++) {
      let x, y, xDivision, yDivision, zeroH, zeroW;
      let realIndex2 = w.globals.comboCharts ? seriesIndex[i] : i;
      let { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex2);
      let elSeries = graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[realIndex2]),
        rel: i + 1,
        "data:realIndex": realIndex2
      });
      this.ctx.series.addCollapsedClassToSeries(elSeries, realIndex2);
      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1;
      }
      let barHeight = 0;
      let barWidth = 0;
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex2][0];
        translationsIndex = realIndex2;
      }
      let initPositions = this.barHelpers.initialPositions(realIndex2);
      y = initPositions.y;
      zeroW = initPositions.zeroW;
      x = initPositions.x;
      barWidth = initPositions.barWidth;
      barHeight = initPositions.barHeight;
      xDivision = initPositions.xDivision;
      yDivision = initPositions.yDivision;
      zeroH = initPositions.zeroH;
      let elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex2
      });
      let elGoalsMarkers = graphics.group({
        class: "apexcharts-rangebar-goals-markers"
      });
      for (let j2 = 0; j2 < w.globals.dataPoints; j2++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j2, realIndex2);
        const y1 = this.seriesRangeStart[i][j2];
        const y2 = this.seriesRangeEnd[i][j2];
        let paths = null;
        let barXPosition = null;
        let barYPosition = null;
        const params = { x, y, strokeWidth, elSeries };
        let seriesLen = this.seriesLen;
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          seriesLen = 1;
        }
        if (typeof w.config.series[i].data[j2] === "undefined") {
          break;
        }
        if (this.isHorizontal) {
          barYPosition = y + barHeight * this.visibleI;
          let srty = (yDivision - barHeight * seriesLen) / 2;
          if (w.config.series[i].data[j2].x) {
            let positions = this.detectOverlappingBars({
              i,
              j: j2,
              barYPosition,
              srty,
              barHeight,
              yDivision,
              initPositions
            });
            barHeight = positions.barHeight;
            barYPosition = positions.barYPosition;
          }
          paths = this.drawRangeBarPaths(__spreadValues({
            indexes: { i, j: j2, realIndex: realIndex2 },
            barHeight,
            barYPosition,
            zeroW,
            yDivision,
            y1,
            y2
          }, params));
          barWidth = paths.barWidth;
        } else {
          if (w.globals.isXNumeric) {
            x = (w.globals.seriesX[i][j2] - w.globals.minX) / this.xRatio - barWidth / 2;
          }
          barXPosition = x + barWidth * this.visibleI;
          let srtx = (xDivision - barWidth * seriesLen) / 2;
          if (w.config.series[i].data[j2].x) {
            let positions = this.detectOverlappingBars({
              i,
              j: j2,
              barXPosition,
              srtx,
              barWidth,
              xDivision,
              initPositions
            });
            barWidth = positions.barWidth;
            barXPosition = positions.barXPosition;
          }
          paths = this.drawRangeColumnPaths(__spreadValues({
            indexes: { i, j: j2, realIndex: realIndex2, translationsIndex },
            barWidth,
            barXPosition,
            zeroH,
            xDivision
          }, params));
          barHeight = paths.barHeight;
        }
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        });
        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine);
        }
        y = paths.y;
        x = paths.x;
        let pathFill = this.barHelpers.getPathFillColor(series, i, j2, realIndex2);
        this.renderSeries({
          realIndex: realIndex2,
          pathFill: pathFill.color,
          lineFill: pathFill.useRangeColor ? pathFill.color : w.globals.stroke.colors[realIndex2],
          j: j2,
          i,
          x,
          y,
          y1,
          y2,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          series,
          barHeight,
          barWidth,
          barXPosition,
          barYPosition,
          columnGroupIndex,
          elDataLabelsWrap,
          elGoalsMarkers,
          visibleSeries: this.visibleI,
          type: "rangebar"
        });
      }
      ret.add(elSeries);
    }
    return ret;
  }
  detectOverlappingBars({
    i,
    j: j2,
    barYPosition,
    barXPosition,
    srty,
    srtx,
    barHeight,
    barWidth,
    yDivision,
    xDivision,
    initPositions
  }) {
    const w = this.w;
    let overlaps = [];
    let rangeName = w.config.series[i].data[j2].rangeName;
    const x = w.config.series[i].data[j2].x;
    const labelX = Array.isArray(x) ? x.join(" ") : x;
    const rowIndex = w.globals.labels.map((_) => Array.isArray(_) ? _.join(" ") : _).indexOf(labelX);
    const overlappedIndex = w.globals.seriesRange[i].findIndex(
      (tx) => tx.x === labelX && tx.overlaps.length > 0
    );
    if (this.isHorizontal) {
      if (w.config.plotOptions.bar.rangeBarGroupRows) {
        barYPosition = srty + yDivision * rowIndex;
      } else {
        barYPosition = srty + barHeight * this.visibleI + yDivision * rowIndex;
      }
      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = w.globals.seriesRange[i][overlappedIndex].overlaps;
        if (overlaps.indexOf(rangeName) > -1) {
          barHeight = initPositions.barHeight / overlaps.length;
          barYPosition = barHeight * this.visibleI + yDivision * (100 - parseInt(this.barOptions.barHeight, 10)) / 100 / 2 + barHeight * (this.visibleI + overlaps.indexOf(rangeName)) + yDivision * rowIndex;
        }
      }
    } else {
      if (rowIndex > -1 && !w.globals.timescaleLabels.length) {
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          barXPosition = srtx + xDivision * rowIndex;
        } else {
          barXPosition = srtx + barWidth * this.visibleI + xDivision * rowIndex;
        }
      }
      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = w.globals.seriesRange[i][overlappedIndex].overlaps;
        if (overlaps.indexOf(rangeName) > -1) {
          barWidth = initPositions.barWidth / overlaps.length;
          barXPosition = barWidth * this.visibleI + xDivision * (100 - parseInt(this.barOptions.barWidth, 10)) / 100 / 2 + barWidth * (this.visibleI + overlaps.indexOf(rangeName)) + xDivision * rowIndex;
        }
      }
    }
    return {
      barYPosition,
      barXPosition,
      barHeight,
      barWidth
    };
  }
  drawRangeColumnPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    barXPosition,
    zeroH
  }) {
    let w = this.w;
    const { i, j: j2, realIndex: realIndex2, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    const range = this.getRangeValue(realIndex2, j2);
    let y1 = Math.min(range.start, range.end);
    let y2 = Math.max(range.start, range.end);
    if (typeof this.series[i][j2] === "undefined" || this.series[i][j2] === null) {
      y1 = zeroH;
    } else {
      y1 = zeroH - y1 / yRatio;
      y2 = zeroH - y2 / yRatio;
    }
    const barHeight = Math.abs(y2 - y1);
    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1,
      y2,
      strokeWidth: this.strokeWidth,
      series: this.seriesRangeEnd,
      realIndex: realIndex2,
      i: realIndex2,
      j: j2,
      w
    });
    if (!w.globals.isXNumeric) {
      x = x + xDivision;
    } else {
      const xForNumericXAxis = this.getBarXForNumericXAxis({
        x,
        j: j2,
        realIndex: realIndex2,
        barWidth
      });
      x = xForNumericXAxis.x;
      barXPosition = xForNumericXAxis.barXPosition;
    }
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barHeight,
      x,
      y: range.start < 0 && range.end < 0 ? y1 : y2,
      goalY: this.barHelpers.getGoalValues(
        "y",
        null,
        zeroH,
        i,
        j2,
        translationsIndex
      ),
      barXPosition
    };
  }
  preventBarOverflow(val) {
    const w = this.w;
    if (val < 0) {
      val = 0;
    }
    if (val > w.globals.gridWidth) {
      val = w.globals.gridWidth;
    }
    return val;
  }
  drawRangeBarPaths({
    indexes,
    y,
    y1,
    y2,
    yDivision,
    barHeight,
    barYPosition,
    zeroW
  }) {
    let w = this.w;
    const { realIndex: realIndex2, j: j2 } = indexes;
    let x1 = this.preventBarOverflow(zeroW + y1 / this.invertedYRatio);
    let x2 = this.preventBarOverflow(zeroW + y2 / this.invertedYRatio);
    const range = this.getRangeValue(realIndex2, j2);
    const barWidth = Math.abs(x2 - x1);
    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1,
      x2,
      strokeWidth: this.strokeWidth,
      series: this.seriesRangeEnd,
      i: realIndex2,
      realIndex: realIndex2,
      j: j2,
      w
    });
    if (!w.globals.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barWidth,
      x: range.start < 0 && range.end < 0 ? x1 : x2,
      goalX: this.barHelpers.getGoalValues("x", zeroW, null, realIndex2, j2),
      y
    };
  }
  getRangeValue(i, j2) {
    const w = this.w;
    return {
      start: w.globals.seriesRangeStart[i][j2],
      end: w.globals.seriesRangeEnd[i][j2]
    };
  }
}
function normalize(data, area) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const multiplier = area / sum;
  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] * multiplier;
  }
  return result;
}
function calculateRatio(rowMin, rowMax, rowSum, length) {
  const lengthSq = length * length;
  const sumSq = rowSum * rowSum;
  return Math.max(
    lengthSq * rowMax / sumSq,
    sumSq / (lengthSq * rowMin)
  );
}
function improvesRatio(rowLen, rowMin, rowMax, rowSum, nextNode, length) {
  if (rowLen === 0) return true;
  const currentRatio = calculateRatio(rowMin, rowMax, rowSum, length);
  const newRatio = calculateRatio(
    Math.min(rowMin, nextNode),
    Math.max(rowMax, nextNode),
    rowSum + nextNode,
    length
  );
  return currentRatio >= newRatio;
}
function emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height) {
  if (width >= height) {
    const areaWidth = rowSum / height;
    let subY = yoffset;
    for (let i = 0; i < rowLen; i++) {
      const h = row[i] / areaWidth;
      coords.push([xoffset, subY, xoffset + areaWidth, subY + h]);
      subY += h;
    }
  } else {
    const areaHeight = rowSum / width;
    let subX = xoffset;
    for (let i = 0; i < rowLen; i++) {
      const w = row[i] / areaHeight;
      coords.push([subX, yoffset, subX + w, yoffset + areaHeight]);
      subX += w;
    }
  }
}
function squarify(data, xoffset, yoffset, width, height) {
  const coords = [];
  const n = data.length;
  if (n === 0) return coords;
  const row = new Array(n);
  let rowLen = 0;
  let rowSum = 0;
  let rowMin = Infinity;
  let rowMax = -Infinity;
  let i = 0;
  while (i < n) {
    const length = Math.min(width, height);
    const val = data[i];
    if (improvesRatio(rowLen, rowMin, rowMax, rowSum, val, length)) {
      row[rowLen] = val;
      rowLen++;
      rowSum += val;
      if (val < rowMin) rowMin = val;
      if (val > rowMax) rowMax = val;
      i++;
    } else {
      emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height);
      if (width >= height) {
        const areaWidth = rowSum / height;
        xoffset += areaWidth;
        width -= areaWidth;
      } else {
        const areaHeight = rowSum / width;
        yoffset += areaHeight;
        height -= areaHeight;
      }
      rowLen = 0;
      rowSum = 0;
      rowMin = Infinity;
      rowMax = -Infinity;
    }
  }
  if (rowLen > 0) {
    emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height);
  }
  return coords;
}
function generate(data, width, height) {
  const n = data.length;
  const sums = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const series = data[i];
    for (let j2 = 0; j2 < series.length; j2++) {
      s += series[j2];
    }
    sums[i] = s;
  }
  const seriesRects = squarify(
    normalize(sums, width * height),
    0,
    0,
    width,
    height
  );
  const results = new Array(n);
  for (let i = 0; i < n; i++) {
    const rect = seriesRects[i];
    const rx = rect[0];
    const ry = rect[1];
    const rw = rect[2] - rx;
    const rh = rect[3] - ry;
    results[i] = squarify(
      normalize(data[i], rw * rh),
      rx,
      ry,
      rw,
      rh
    );
  }
  return results;
}
const TreemapSquared = { generate };
class TreemapChart {
  constructor(ctx, xyRatios) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.strokeWidth = this.w.config.stroke.width;
    this.helpers = new TreemapHelpers(ctx);
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.labels = [];
  }
  draw(series) {
    let w = this.w;
    const graphics = new Graphics(this.ctx);
    const fill = new Fill(this.ctx);
    let ret = graphics.group({
      class: "apexcharts-treemap"
    });
    if (w.globals.noData) return ret;
    let ser = [];
    series.forEach((s) => {
      let d = s.map((v) => {
        return Math.abs(v);
      });
      ser.push(d);
    });
    this.negRange = this.helpers.checkColorRange();
    w.config.series.forEach((s, i) => {
      s.data.forEach((l) => {
        if (!Array.isArray(this.labels[i])) this.labels[i] = [];
        this.labels[i].push(l.x);
      });
    });
    const nodes = TreemapSquared.generate(
      ser,
      w.globals.gridWidth,
      w.globals.gridHeight
    );
    nodes.forEach((node, i) => {
      let elSeries = graphics.group({
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils$1.escapeString(w.globals.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      graphics.setupEventDelegation(elSeries, ".apexcharts-treemap-rect");
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        const filters = new Filters(this.ctx);
        filters.dropShadow(ret, shadow, i);
      }
      let elDataLabelWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      let bounds = {
        xMin: Infinity,
        yMin: Infinity,
        xMax: -Infinity,
        yMax: -Infinity
      };
      node.forEach((r, j2) => {
        const x1 = r[0];
        const y1 = r[1];
        const x2 = r[2];
        const y2 = r[3];
        bounds.xMin = Math.min(bounds.xMin, x1);
        bounds.yMin = Math.min(bounds.yMin, y1);
        bounds.xMax = Math.max(bounds.xMax, x2);
        bounds.yMax = Math.max(bounds.yMax, y2);
        let colorProps = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j2,
          this.negRange
        );
        let color = colorProps.color;
        let pathFill = fill.fillPath({
          color,
          seriesNumber: i,
          dataPointIndex: j2
        });
        let elRect = graphics.drawRect(
          x1,
          y1,
          x2 - x1,
          y2 - y1,
          w.config.plotOptions.treemap.borderRadius,
          "#fff",
          1,
          this.strokeWidth,
          w.config.plotOptions.treemap.useFillColorAsStroke ? color : w.globals.stroke.colors[i]
        );
        elRect.attr({
          cx: x1,
          cy: y1,
          index: i,
          i,
          j: j2,
          width: x2 - x1,
          height: y2 - y1,
          fill: pathFill
        });
        elRect.node.classList.add("apexcharts-treemap-rect");
        let fromRect = {
          x: x1 + (x2 - x1) / 2,
          y: y1 + (y2 - y1) / 2,
          width: 0,
          height: 0
        };
        let toRect = {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1
        };
        if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1;
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed;
          }
          this.animateTreemap(elRect, fromRect, toRect, speed);
        }
        if (w.globals.dataChanged) {
          let speed = 1;
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed;
            if (w.globals.previousPaths[i] && w.globals.previousPaths[i][j2] && w.globals.previousPaths[i][j2].rect) {
              fromRect = w.globals.previousPaths[i][j2].rect;
            }
            this.animateTreemap(elRect, fromRect, toRect, speed);
          }
        }
        let fontSize = this.getFontSize(r);
        let formattedText = w.config.dataLabels.formatter(this.labels[i][j2], {
          value: w.globals.series[i][j2],
          seriesIndex: i,
          dataPointIndex: j2,
          w
        });
        if (w.config.plotOptions.treemap.dataLabels.format === "truncate") {
          fontSize = parseInt(w.config.dataLabels.style.fontSize, 10);
          formattedText = this.truncateLabels(
            formattedText,
            fontSize,
            x1,
            y1,
            x2,
            y2
          );
        }
        let dataLabels = null;
        if (w.globals.series[i][j2]) {
          dataLabels = this.helpers.calculateDataLabels({
            text: formattedText,
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2 + this.strokeWidth / 2 + fontSize / 3,
            i,
            j: j2,
            colorProps,
            fontSize,
            series
          });
        }
        if (w.config.dataLabels.enabled && dataLabels) {
          this.rotateToFitLabel(
            dataLabels,
            fontSize,
            formattedText,
            x1,
            y1,
            x2,
            y2
          );
        }
        elSeries.add(elRect);
        if (dataLabels !== null) {
          elSeries.add(dataLabels);
        }
      });
      const seriesTitle = w.config.plotOptions.treemap.seriesTitle;
      if (w.config.series.length > 1 && seriesTitle && seriesTitle.show) {
        const sName = w.config.series[i].name || "";
        if (sName && bounds.xMin < Infinity && bounds.yMin < Infinity) {
          const {
            offsetX,
            offsetY,
            borderColor,
            borderWidth,
            borderRadius,
            style
          } = seriesTitle;
          const textColor = style.color || w.config.chart.foreColor;
          const padding = {
            left: style.padding.left,
            right: style.padding.right,
            top: style.padding.top,
            bottom: style.padding.bottom
          };
          const textSize = graphics.getTextRects(
            sName,
            style.fontSize,
            style.fontFamily
          );
          const labelRectWidth = textSize.width + padding.left + padding.right;
          const labelRectHeight = textSize.height + padding.top + padding.bottom;
          const labelX = bounds.xMin + (offsetX || 0);
          const labelY = bounds.yMin + (offsetY || 0);
          const elLabelRect = graphics.drawRect(
            labelX,
            labelY,
            labelRectWidth,
            labelRectHeight,
            borderRadius,
            style.background,
            1,
            borderWidth,
            borderColor
          );
          const elLabelText = graphics.drawText({
            x: labelX + padding.left,
            y: labelY + padding.top + textSize.height * 0.75,
            text: sName,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            foreColor: textColor,
            cssClass: style.cssClass || ""
          });
          elSeries.add(elLabelRect);
          elSeries.add(elLabelText);
        }
      }
      elSeries.add(elDataLabelWrap);
      ret.add(elSeries);
    });
    return ret;
  }
  // This calculates a font-size based upon
  // average label length and the size of the box
  getFontSize(coordinates) {
    const w = this.w;
    function totalLabelLength(arr) {
      let i, total = 0;
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += totalLabelLength(arr[i]);
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += arr[i].length;
        }
      }
      return total;
    }
    function countLabels(arr) {
      let i, total = 0;
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += countLabels(arr[i]);
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += 1;
        }
      }
      return total;
    }
    let averagelabelsize = totalLabelLength(this.labels) / countLabels(this.labels);
    function fontSize(width, height) {
      let area = width * height;
      let arearoot = Math.pow(area, 0.5);
      return Math.min(
        arearoot / averagelabelsize,
        parseInt(w.config.dataLabels.style.fontSize, 10)
      );
    }
    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1]
    );
  }
  rotateToFitLabel(elText, fontSize, text, x1, y1, x2, y2) {
    const graphics = new Graphics(this.ctx);
    const textRect = graphics.getTextRects(text, fontSize);
    if (textRect.width + this.w.config.stroke.width + 5 > x2 - x1 && textRect.width <= y2 - y1) {
      let labelRotatingCenter = graphics.rotateAroundCenter(elText.node);
      elText.node.setAttribute(
        "transform",
        `rotate(-90 ${labelRotatingCenter.x} ${labelRotatingCenter.y}) translate(${textRect.height / 3})`
      );
    }
  }
  // This is an alternative label formatting method that uses a
  // consistent font size, and trims the edge of long labels
  truncateLabels(text, fontSize, x1, y1, x2, y2) {
    const graphics = new Graphics(this.ctx);
    const textRect = graphics.getTextRects(text, fontSize);
    const labelMaxWidth = textRect.width + this.w.config.stroke.width + 5 > x2 - x1 && y2 - y1 > x2 - x1 ? y2 - y1 : x2 - x1;
    const truncatedText = graphics.getTextBasedOnMaxWidth({
      text,
      maxWidth: labelMaxWidth,
      fontSize
    });
    if (text.length !== truncatedText.length && labelMaxWidth / fontSize < 5) {
      return "";
    } else {
      return truncatedText;
    }
  }
  animateTreemap(el, fromRect, toRect, speed) {
    const animations = new Animations(this.ctx);
    animations.animateRect(el, fromRect, toRect, speed, () => {
      animations.animationCompleted(el);
    });
  }
}
class Core {
  constructor(el, ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
    this.el = el;
  }
  setupElements() {
    const { globals: gl, config: cnf } = this.w;
    const ct = cnf.chart.type;
    const axisChartsArrTypes = [
      "line",
      "area",
      "bar",
      "rangeBar",
      "rangeArea",
      "candlestick",
      "boxPlot",
      "scatter",
      "bubble",
      "radar",
      "heatmap",
      "treemap"
    ];
    const xyChartsArrTypes = [
      "line",
      "area",
      "bar",
      "rangeBar",
      "rangeArea",
      "candlestick",
      "boxPlot",
      "scatter",
      "bubble"
    ];
    gl.axisCharts = axisChartsArrTypes.includes(ct);
    gl.xyCharts = xyChartsArrTypes.includes(ct);
    gl.isBarHorizontal = ["bar", "rangeBar", "boxPlot"].includes(ct) && cnf.plotOptions.bar.horizontal;
    gl.chartClass = `.apexcharts${gl.chartID}`;
    gl.dom.baseEl = this.el;
    gl.dom.elWrap = document.createElement("div");
    Graphics.setAttrs(gl.dom.elWrap, {
      id: gl.chartClass.substring(1),
      class: `apexcharts-canvas ${gl.chartClass.substring(1)}`
    });
    this.el.appendChild(gl.dom.elWrap);
    gl.dom.Paper = window.SVG().addTo(gl.dom.elWrap);
    gl.dom.Paper.attr({
      class: "apexcharts-svg",
      "xmlns:data": "ApexChartsNS",
      transform: `translate(${cnf.chart.offsetX}, ${cnf.chart.offsetY})`
    });
    gl.dom.Paper.node.style.background = cnf.theme.mode === "dark" && !cnf.chart.background ? "#343A3F" : cnf.theme.mode === "light" && !cnf.chart.background ? "#fff" : cnf.chart.background;
    this.setSVGDimensions();
    gl.dom.elLegendForeign = document.createElementNS(gl.SVGNS, "foreignObject");
    Graphics.setAttrs(gl.dom.elLegendForeign, {
      x: 0,
      y: 0,
      width: gl.svgWidth,
      height: gl.svgHeight
    });
    gl.dom.elLegendWrap = document.createElement("div");
    gl.dom.elLegendWrap.classList.add("apexcharts-legend");
    gl.dom.elWrap.appendChild(gl.dom.elLegendWrap);
    gl.dom.Paper.node.appendChild(gl.dom.elLegendForeign);
    gl.dom.elGraphical = gl.dom.Paper.group().attr({
      class: "apexcharts-inner apexcharts-graphical"
    });
    gl.dom.elDefs = gl.dom.Paper.defs();
    gl.dom.Paper.add(gl.dom.elGraphical);
    gl.dom.elGraphical.add(gl.dom.elDefs);
  }
  plotChartType(ser, xyRatios) {
    const { w, ctx } = this;
    const { config: cnf, globals: gl } = w;
    const seriesTypes = {
      line: { series: [], i: [] },
      area: { series: [], i: [] },
      scatter: { series: [], i: [] },
      bubble: { series: [], i: [] },
      bar: { series: [], i: [] },
      candlestick: { series: [], i: [] },
      boxPlot: { series: [], i: [] },
      rangeBar: { series: [], i: [] },
      rangeArea: { series: [], seriesRangeEnd: [], i: [] }
    };
    const chartType = cnf.chart.type || "line";
    let nonComboType = null;
    let comboCount = 0;
    gl.series.forEach((serie, st) => {
      var _a, _b;
      const seriesType = ((_a = ser[st]) == null ? void 0 : _a.type) === "column" ? "bar" : ((_b = ser[st]) == null ? void 0 : _b.type) || (chartType === "column" ? "bar" : chartType);
      if (seriesTypes[seriesType]) {
        if (seriesType === "rangeArea") {
          seriesTypes[seriesType].series.push(gl.seriesRangeStart[st]);
          seriesTypes[seriesType].seriesRangeEnd.push(gl.seriesRangeEnd[st]);
        } else {
          seriesTypes[seriesType].series.push(serie);
        }
        seriesTypes[seriesType].i.push(st);
        if (seriesType === "bar") w.globals.columnSeries = seriesTypes.bar;
      } else if ([
        "heatmap",
        "treemap",
        "pie",
        "donut",
        "polarArea",
        "radialBar",
        "radar"
      ].includes(seriesType)) {
        nonComboType = seriesType;
      } else {
        console.warn(
          `You have specified an unrecognized series type (${seriesType}).`
        );
      }
      if (chartType !== seriesType && seriesType !== "scatter") comboCount++;
    });
    if (comboCount > 0) {
      if (nonComboType) {
        console.warn(
          `Chart or series type ${nonComboType} cannot appear with other chart or series types.`
        );
      }
      if (seriesTypes.bar.series.length > 0 && cnf.plotOptions.bar.horizontal) {
        comboCount -= seriesTypes.bar.series.length;
        seriesTypes.bar = { series: [], i: [] };
        w.globals.columnSeries = { series: [], i: [] };
        console.warn(
          "Horizontal bars are not supported in a mixed/combo chart. Please turn off `plotOptions.bar.horizontal`"
        );
      }
    }
    gl.comboCharts || (gl.comboCharts = comboCount > 0);
    const line = new Line(ctx, xyRatios);
    const boxCandlestick = new BoxCandleStick(ctx, xyRatios);
    ctx.pie = new Pie(ctx);
    const radialBar = new Radial(ctx);
    ctx.rangeBar = new RangeBar(ctx, xyRatios);
    const radar = new Radar(ctx);
    let elGraph = [];
    if (gl.comboCharts) {
      const coreUtils = new CoreUtils(ctx);
      if (seriesTypes.area.series.length > 0) {
        elGraph.push(
          ...coreUtils.drawSeriesByGroup(
            seriesTypes.area,
            gl.areaGroups,
            "area",
            line
          )
        );
      }
      if (seriesTypes.bar.series.length > 0) {
        if (cnf.chart.stacked) {
          const barStacked = new BarStacked(ctx, xyRatios);
          elGraph.push(
            barStacked.draw(seriesTypes.bar.series, seriesTypes.bar.i)
          );
        } else {
          ctx.bar = new Bar(ctx, xyRatios);
          elGraph.push(ctx.bar.draw(seriesTypes.bar.series, seriesTypes.bar.i));
        }
      }
      if (seriesTypes.rangeArea.series.length > 0) {
        elGraph.push(
          line.draw(
            seriesTypes.rangeArea.series,
            "rangeArea",
            seriesTypes.rangeArea.i,
            seriesTypes.rangeArea.seriesRangeEnd
          )
        );
      }
      if (seriesTypes.line.series.length > 0) {
        elGraph.push(
          ...coreUtils.drawSeriesByGroup(
            seriesTypes.line,
            gl.lineGroups,
            "line",
            line
          )
        );
      }
      if (seriesTypes.candlestick.series.length > 0) {
        elGraph.push(
          boxCandlestick.draw(
            seriesTypes.candlestick.series,
            "candlestick",
            seriesTypes.candlestick.i
          )
        );
      }
      if (seriesTypes.boxPlot.series.length > 0) {
        elGraph.push(
          boxCandlestick.draw(
            seriesTypes.boxPlot.series,
            "boxPlot",
            seriesTypes.boxPlot.i
          )
        );
      }
      if (seriesTypes.rangeBar.series.length > 0) {
        elGraph.push(
          ctx.rangeBar.draw(seriesTypes.rangeBar.series, seriesTypes.rangeBar.i)
        );
      }
      if (seriesTypes.scatter.series.length > 0) {
        const scatterLine = new Line(ctx, xyRatios, true);
        elGraph.push(
          scatterLine.draw(
            seriesTypes.scatter.series,
            "scatter",
            seriesTypes.scatter.i
          )
        );
      }
      if (seriesTypes.bubble.series.length > 0) {
        const bubbleLine = new Line(ctx, xyRatios, true);
        elGraph.push(
          bubbleLine.draw(
            seriesTypes.bubble.series,
            "bubble",
            seriesTypes.bubble.i
          )
        );
      }
    } else {
      switch (cnf.chart.type) {
        case "line":
          elGraph = line.draw(gl.series, "line");
          break;
        case "area":
          elGraph = line.draw(gl.series, "area");
          break;
        case "bar":
          if (cnf.chart.stacked) {
            const barStacked = new BarStacked(ctx, xyRatios);
            elGraph = barStacked.draw(gl.series);
          } else {
            ctx.bar = new Bar(ctx, xyRatios);
            elGraph = ctx.bar.draw(gl.series);
          }
          break;
        case "candlestick":
          const candleStick = new BoxCandleStick(ctx, xyRatios);
          elGraph = candleStick.draw(gl.series, "candlestick");
          break;
        case "boxPlot":
          const boxPlot = new BoxCandleStick(ctx, xyRatios);
          elGraph = boxPlot.draw(gl.series, cnf.chart.type);
          break;
        case "rangeBar":
          elGraph = ctx.rangeBar.draw(gl.series);
          break;
        case "rangeArea":
          elGraph = line.draw(
            gl.seriesRangeStart,
            "rangeArea",
            void 0,
            gl.seriesRangeEnd
          );
          break;
        case "heatmap":
          const heatmap = new HeatMap(ctx, xyRatios);
          elGraph = heatmap.draw(gl.series);
          break;
        case "treemap":
          const treemap = new TreemapChart(ctx, xyRatios);
          elGraph = treemap.draw(gl.series);
          break;
        case "pie":
        case "donut":
        case "polarArea":
          elGraph = ctx.pie.draw(gl.series);
          break;
        case "radialBar":
          elGraph = radialBar.draw(gl.series);
          break;
        case "radar":
          elGraph = radar.draw(gl.series);
          break;
        default:
          elGraph = line.draw(gl.series);
      }
    }
    return elGraph;
  }
  setSVGDimensions() {
    const { globals: gl, config: cnf } = this.w;
    cnf.chart.width = cnf.chart.width || "100%";
    cnf.chart.height = cnf.chart.height || "auto";
    gl.svgWidth = cnf.chart.width;
    gl.svgHeight = cnf.chart.height;
    let elDim = Utils$1.getDimensions(this.el);
    const widthUnit = cnf.chart.width.toString().split(/[0-9]+/g).pop();
    if (widthUnit === "%") {
      if (Utils$1.isNumber(elDim[0])) {
        if (elDim[0].width === 0) {
          elDim = Utils$1.getDimensions(this.el.parentNode);
        }
        gl.svgWidth = elDim[0] * parseInt(cnf.chart.width, 10) / 100;
      }
    } else if (widthUnit === "px" || widthUnit === "") {
      gl.svgWidth = parseInt(cnf.chart.width, 10);
    }
    const heightUnit = String(cnf.chart.height).toString().split(/[0-9]+/g).pop();
    if (gl.svgHeight !== "auto" && gl.svgHeight !== "") {
      if (heightUnit === "%") {
        const elParentDim = Utils$1.getDimensions(this.el.parentNode);
        gl.svgHeight = elParentDim[1] * parseInt(cnf.chart.height, 10) / 100;
      } else {
        gl.svgHeight = parseInt(cnf.chart.height, 10);
      }
    } else {
      gl.svgHeight = gl.axisCharts ? gl.svgWidth / 1.61 : gl.svgWidth / 1.2;
    }
    gl.svgWidth = Math.max(gl.svgWidth, 0);
    gl.svgHeight = Math.max(gl.svgHeight, 0);
    Graphics.setAttrs(gl.dom.Paper.node, {
      width: gl.svgWidth,
      height: gl.svgHeight
    });
    if (heightUnit !== "%") {
      const offsetY = cnf.chart.sparkline.enabled ? 0 : gl.axisCharts ? cnf.chart.parentHeightOffset : 0;
      gl.dom.Paper.node.parentNode.parentNode.style.minHeight = `${gl.svgHeight + offsetY}px`;
    }
    gl.dom.elWrap.style.width = `${gl.svgWidth}px`;
    gl.dom.elWrap.style.height = `${gl.svgHeight}px`;
  }
  shiftGraphPosition() {
    const { globals: gl } = this.w;
    const { translateY: tY, translateX: tX } = gl;
    Graphics.setAttrs(gl.dom.elGraphical.node, {
      transform: `translate(${tX}, ${tY})`
    });
  }
  resizeNonAxisCharts() {
    const { w } = this;
    const { globals: gl } = w;
    let legendHeight = 0;
    let offY = w.config.chart.sparkline.enabled ? 1 : 15;
    offY += w.config.grid.padding.bottom;
    if (["top", "bottom"].includes(w.config.legend.position) && w.config.legend.show && !w.config.legend.floating) {
      legendHeight = new Legend(this.ctx).legendHelpers.getLegendDimensions().clwh + 7;
    }
    const el = w.globals.dom.baseEl.querySelector(
      ".apexcharts-radialbar, .apexcharts-pie"
    );
    let chartInnerDimensions = w.globals.radialSize * 2.05;
    if (el && !w.config.chart.sparkline.enabled && w.config.plotOptions.radialBar.startAngle !== 0) {
      const elRadialRect = Utils$1.getBoundingClientRect(el);
      chartInnerDimensions = elRadialRect.bottom;
      const maxHeight = elRadialRect.bottom - elRadialRect.top;
      chartInnerDimensions = Math.max(w.globals.radialSize * 2.05, maxHeight);
    }
    const newHeight = Math.ceil(
      chartInnerDimensions + gl.translateY + legendHeight + offY
    );
    if (gl.dom.elLegendForeign) {
      gl.dom.elLegendForeign.setAttribute("height", newHeight);
    }
    if (w.config.chart.height && String(w.config.chart.height).includes("%"))
      return;
    gl.dom.elWrap.style.height = `${newHeight}px`;
    Graphics.setAttrs(gl.dom.Paper.node, { height: newHeight });
    gl.dom.Paper.node.parentNode.parentNode.style.minHeight = `${newHeight}px`;
  }
  coreCalculations() {
    new Range(this.ctx).init();
  }
  resetGlobals() {
    const resetxyValues = () => this.w.config.series.map(() => []);
    const globalObj = new Globals();
    const { globals: gl } = this.w;
    const parsingFlags = {
      dataWasParsed: gl.dataWasParsed,
      originalSeries: gl.originalSeries
    };
    globalObj.initGlobalVars(gl);
    gl.seriesXvalues = resetxyValues();
    gl.seriesYvalues = resetxyValues();
    if (parsingFlags.dataWasParsed) {
      gl.dataWasParsed = parsingFlags.dataWasParsed;
      gl.originalSeries = parsingFlags.originalSeries;
    }
  }
  isMultipleY() {
    if (Array.isArray(this.w.config.yaxis) && this.w.config.yaxis.length > 1) {
      this.w.globals.isMultipleYAxis = true;
      return true;
    }
    return false;
  }
  xySettings() {
    const { w } = this;
    let xyRatios = null;
    if (w.globals.axisCharts) {
      if (w.config.xaxis.crosshairs.position === "back") {
        new Crosshairs(this.ctx).drawXCrosshairs();
      }
      if (w.config.yaxis[0].crosshairs.position === "back") {
        new Crosshairs(this.ctx).drawYCrosshairs();
      }
      if (w.config.xaxis.type === "datetime" && w.config.xaxis.labels.formatter === void 0) {
        this.ctx.timeScale = new TimeScale(this.ctx);
        let formattedTimeScale = [];
        if (isFinite(w.globals.minX) && isFinite(w.globals.maxX) && !w.globals.isBarHorizontal) {
          formattedTimeScale = this.ctx.timeScale.calculateTimeScaleTicks(
            w.globals.minX,
            w.globals.maxX
          );
        } else if (w.globals.isBarHorizontal) {
          formattedTimeScale = this.ctx.timeScale.calculateTimeScaleTicks(
            w.globals.minY,
            w.globals.maxY
          );
        }
        this.ctx.timeScale.recalcDimensionsBasedOnFormat(formattedTimeScale);
      }
      const coreUtils = new CoreUtils(this.ctx);
      xyRatios = coreUtils.getCalculatedRatios();
    }
    return xyRatios;
  }
  updateSourceChart(targetChart) {
    this.ctx.w.globals.selection = void 0;
    this.ctx.updateHelpers._updateOptions(
      {
        chart: {
          selection: {
            xaxis: {
              min: targetChart.w.globals.minX,
              max: targetChart.w.globals.maxX
            }
          }
        }
      },
      false,
      false
    );
  }
  setupBrushHandler() {
    const { ctx, w } = this;
    if (!w.config.chart.brush.enabled) return;
    if (typeof w.config.chart.events.selection !== "function") {
      const targets = Array.isArray(w.config.chart.brush.targets) ? w.config.chart.brush.targets : [w.config.chart.brush.target];
      targets.forEach((target) => {
        const targetChart = ctx.constructor.getChartByID(target);
        targetChart.w.globals.brushSource = this.ctx;
        if (typeof targetChart.w.config.chart.events.zoomed !== "function") {
          targetChart.w.config.chart.events.zoomed = () => this.updateSourceChart(targetChart);
        }
        if (typeof targetChart.w.config.chart.events.scrolled !== "function") {
          targetChart.w.config.chart.events.scrolled = () => this.updateSourceChart(targetChart);
        }
      });
      w.config.chart.events.selection = (chart, e) => {
        targets.forEach((target) => {
          const targetChart = ctx.constructor.getChartByID(target);
          targetChart.ctx.updateHelpers._updateOptions(
            {
              xaxis: {
                min: e.xaxis.min,
                max: e.xaxis.max
              }
            },
            false,
            false,
            false,
            false
          );
        });
      };
    }
  }
}
class PerformanceCache {
  /**
   * Invalidate all caches
   * @param {Object} w - ApexCharts globals object
   */
  static invalidateAll(w) {
    if (!w || !w.globals) return;
    if (w.globals.cachedSelectors) {
      w.globals.cachedSelectors = {};
    }
    if (w.globals.domCache) {
      w.globals.domCache.clear();
    }
    w.globals.dimensionCache = {};
  }
  /**
   * Invalidate dimension cache only
   * @param {Object} w - ApexCharts globals object
   */
  static invalidateDimensions(w) {
    if (!w || !w.globals) return;
    w.globals.dimensionCache = {};
  }
  /**
   * Invalidate selector cache only
   * @param {Object} w - ApexCharts globals object
   */
  static invalidateSelectors(w) {
    if (!w || !w.globals) return;
    if (w.globals.cachedSelectors) {
      w.globals.cachedSelectors = {};
    }
  }
  /**
   * Get cached selector result or compute and cache it
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @param {Function} queryFn - Function to execute if not cached
   * @returns {*} Cached or newly computed result
   */
  static getCachedSelector(w, key, queryFn) {
    if (!w || !w.globals) return queryFn();
    if (!w.globals.cachedSelectors) {
      w.globals.cachedSelectors = {};
    }
    if (!w.globals.cachedSelectors[key]) {
      w.globals.cachedSelectors[key] = queryFn();
    }
    return w.globals.cachedSelectors[key];
  }
  /**
   * Get cached dimension or compute and cache it
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @param {Function} computeFn - Function to compute dimensions
   * @param {number} maxAge - Maximum cache age in milliseconds (default: 1000ms)
   * @returns {*} Cached or newly computed dimensions
   */
  static getCachedDimension(w, key, computeFn, maxAge = 1e3) {
    if (!w || !w.globals) return computeFn();
    if (!w.globals.dimensionCache) {
      w.globals.dimensionCache = {};
    }
    const cache = w.globals.dimensionCache[key];
    const now = Date.now();
    if (cache && cache.lastUpdate && now - cache.lastUpdate < maxAge) {
      return cache.value;
    }
    const value = computeFn();
    w.globals.dimensionCache[key] = {
      value,
      lastUpdate: now
    };
    return value;
  }
  /**
   * Cache a DOM element reference
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @param {Element} element - DOM element to cache
   */
  static cacheDOMElement(w, key, element) {
    if (!w || !w.globals) return;
    if (!w.globals.domCache) {
      w.globals.domCache = /* @__PURE__ */ new Map();
    }
    w.globals.domCache.set(key, element);
  }
  /**
   * Get cached DOM element
   * @param {Object} w - ApexCharts globals object
   * @param {string} key - Cache key
   * @returns {Element|null} Cached element or null
   */
  static getCachedDOMElement(w, key) {
    if (!w || !w.globals || !w.globals.domCache) return null;
    return w.globals.domCache.get(key) || null;
  }
}
class UpdateHelpers {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  /**
   * private method to update Options.
   *
   * @param {object} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   * @param {boolean} overwriteInitialConfig - should update the initial config or not
   */
  _updateOptions(options2, redraw = false, animate = true, updateSyncedCharts = true, overwriteInitialConfig = false) {
    return new Promise((resolve) => {
      let charts = [this.ctx];
      if (updateSyncedCharts) {
        charts = this.ctx.getSyncedCharts();
      }
      if (this.ctx.w.globals.isExecCalled) {
        charts = [this.ctx];
        this.ctx.w.globals.isExecCalled = false;
      }
      charts.forEach((ch, chartIndex) => {
        let w = ch.w;
        w.globals.shouldAnimate = animate;
        if (!redraw) {
          w.globals.resized = true;
          w.globals.dataChanged = true;
          if (animate) {
            ch.series.getPreviousPaths();
          }
        }
        if (options2 && typeof options2 === "object") {
          ch.config = new Config(options2);
          options2 = CoreUtils.extendArrayProps(ch.config, options2, w);
          if (ch.w.globals.chartID !== this.ctx.w.globals.chartID) {
            delete options2.series;
          }
          w.config = Utils$1.extend(w.config, options2);
          if (overwriteInitialConfig) {
            w.globals.lastXAxis = options2.xaxis ? Utils$1.clone(options2.xaxis) : [];
            w.globals.lastYAxis = options2.yaxis ? Utils$1.clone(options2.yaxis) : [];
            w.globals.initialConfig = Utils$1.extend({}, w.config);
            w.globals.initialSeries = Utils$1.clone(w.config.series);
            if (options2.series) {
              for (let i = 0; i < w.globals.collapsedSeriesIndices.length; i++) {
                let series = w.config.series[w.globals.collapsedSeriesIndices[i]];
                w.globals.collapsedSeries[i].data = w.globals.axisCharts ? series.data.slice() : series;
              }
              for (let i = 0; i < w.globals.ancillaryCollapsedSeriesIndices.length; i++) {
                let series = w.config.series[w.globals.ancillaryCollapsedSeriesIndices[i]];
                w.globals.ancillaryCollapsedSeries[i].data = w.globals.axisCharts ? series.data.slice() : series;
              }
              ch.series.emptyCollapsedSeries(w.config.series);
            }
          }
        }
        return ch.update(options2).then(() => {
          if (chartIndex === charts.length - 1) {
            resolve(ch);
          }
        });
      });
    });
  }
  /**
   * Private method to update Series.
   *
   * @param {array} series - New series which will override the existing
   */
  _updateSeries(newSeries, animate, overwriteInitialSeries = false) {
    return new Promise((resolve) => {
      const w = this.w;
      w.globals.shouldAnimate = animate;
      w.globals.dataChanged = true;
      PerformanceCache.invalidateSelectors(w);
      if (animate) {
        this.ctx.series.getPreviousPaths();
      }
      this.ctx.data.resetParsingFlags();
      this.ctx.data.parseData(newSeries);
      if (overwriteInitialSeries) {
        w.globals.initialConfig.series = Utils$1.clone(w.config.series);
        w.globals.initialSeries = Utils$1.clone(w.config.series);
      }
      return this.ctx.update().then(() => {
        resolve(this.ctx);
      });
    });
  }
  _extendSeries(s, i) {
    const w = this.w;
    const ser = w.config.series[i];
    return __spreadProps(__spreadValues({}, w.config.series[i]), {
      name: s.name ? s.name : ser == null ? void 0 : ser.name,
      color: s.color ? s.color : ser == null ? void 0 : ser.color,
      type: s.type ? s.type : ser == null ? void 0 : ser.type,
      group: s.group ? s.group : ser == null ? void 0 : ser.group,
      hidden: typeof s.hidden !== "undefined" ? s.hidden : ser == null ? void 0 : ser.hidden,
      data: s.data ? s.data : ser == null ? void 0 : ser.data,
      zIndex: typeof s.zIndex !== "undefined" ? s.zIndex : i
    });
  }
  toggleDataPointSelection(seriesIndex, dataPointIndex) {
    const w = this.w;
    let elPath = null;
    const parent = `.apexcharts-series[data\\:realIndex='${seriesIndex}']`;
    if (w.globals.axisCharts) {
      elPath = w.globals.dom.Paper.findOne(
        `${parent} path[j='${dataPointIndex}'], ${parent} circle[j='${dataPointIndex}'], ${parent} rect[j='${dataPointIndex}']`
      );
    } else {
      if (typeof dataPointIndex === "undefined") {
        elPath = w.globals.dom.Paper.findOne(
          `${parent} path[j='${seriesIndex}']`
        );
        if (w.config.chart.type === "pie" || w.config.chart.type === "polarArea" || w.config.chart.type === "donut") {
          this.ctx.pie.pieClicked(seriesIndex);
        }
      }
    }
    if (elPath) {
      const graphics = new Graphics(this.ctx);
      graphics.pathMouseDown(elPath, null);
    } else {
      console.warn("toggleDataPointSelection: Element not found");
      return null;
    }
    return elPath.node ? elPath.node : null;
  }
  forceXAxisUpdate(options2) {
    const w = this.w;
    const minmax = ["min", "max"];
    minmax.forEach((a) => {
      if (typeof options2.xaxis[a] !== "undefined") {
        w.config.xaxis[a] = options2.xaxis[a];
        w.globals.lastXAxis[a] = options2.xaxis[a];
      }
    });
    if (options2.xaxis.categories && options2.xaxis.categories.length) {
      w.config.xaxis.categories = options2.xaxis.categories;
    }
    if (w.config.xaxis.convertedCatToNumeric) {
      const defaults = new Defaults(options2);
      options2 = defaults.convertCatToNumericXaxis(options2, this.ctx);
    }
    return options2;
  }
  forceYAxisUpdate(options2) {
    if (options2.chart && options2.chart.stacked && options2.chart.stackType === "100%") {
      if (Array.isArray(options2.yaxis)) {
        options2.yaxis.forEach((yaxe, index) => {
          options2.yaxis[index].min = 0;
          options2.yaxis[index].max = 100;
        });
      } else {
        options2.yaxis.min = 0;
        options2.yaxis.max = 100;
      }
    }
    return options2;
  }
  /**
   * This function reverts the yaxis and xaxis min/max values to what it was when the chart was defined.
   * This function fixes an important bug where a user might load a new series after zooming in/out of previous series which resulted in wrong min/max
   * Also, this should never be called internally on zoom/pan - the reset should only happen when user calls the updateSeries() function externally
   * The function also accepts an object {xaxis, yaxis} which when present is set as the new xaxis/yaxis
   */
  revertDefaultAxisMinMax(opts) {
    const w = this.w;
    let xaxis = w.globals.lastXAxis;
    let yaxis = w.globals.lastYAxis;
    if (opts && opts.xaxis) {
      xaxis = opts.xaxis;
    }
    if (opts && opts.yaxis) {
      yaxis = opts.yaxis;
    }
    w.config.xaxis.min = xaxis.min;
    w.config.xaxis.max = xaxis.max;
    const getLastYAxis = (index) => {
      if (typeof yaxis[index] !== "undefined") {
        w.config.yaxis[index].min = yaxis[index].min;
        w.config.yaxis[index].max = yaxis[index].max;
      }
    };
    w.config.yaxis.map((yaxe, index) => {
      if (w.globals.zoomed) {
        getLastYAxis(index);
      } else {
        if (typeof yaxis[index] !== "undefined") {
          getLastYAxis(index);
        } else {
          if (typeof this.ctx.opts.yaxis[index] !== "undefined") {
            yaxe.min = this.ctx.opts.yaxis[index].min;
            yaxe.max = this.ctx.opts.yaxis[index].max;
          }
        }
      }
    });
  }
}
if (typeof window.SVG === "undefined") {
  window.SVG = SVG;
}
if (typeof window.Apex === "undefined") {
  window.Apex = {};
}
class InitCtxVariables {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  initModules() {
    this.ctx.publicMethods = [
      "updateOptions",
      "updateSeries",
      "appendData",
      "appendSeries",
      "isSeriesHidden",
      "highlightSeries",
      "toggleSeries",
      "showSeries",
      "hideSeries",
      "setLocale",
      "resetSeries",
      "zoomX",
      "toggleDataPointSelection",
      "dataURI",
      "exportToCSV",
      "addXaxisAnnotation",
      "addYaxisAnnotation",
      "addPointAnnotation",
      "clearAnnotations",
      "removeAnnotation",
      "paper",
      "destroy"
    ];
    this.ctx.eventList = [
      "click",
      "mousedown",
      "mousemove",
      "mouseleave",
      "touchstart",
      "touchmove",
      "touchleave",
      "mouseup",
      "touchend"
    ];
    this.ctx.animations = new Animations(this.ctx);
    this.ctx.axes = new Axes(this.ctx);
    this.ctx.core = new Core(this.ctx.el, this.ctx);
    this.ctx.config = new Config({});
    this.ctx.data = new Data(this.ctx);
    this.ctx.grid = new Grid(this.ctx);
    this.ctx.graphics = new Graphics(this.ctx);
    this.ctx.coreUtils = new CoreUtils(this.ctx);
    this.ctx.crosshairs = new Crosshairs(this.ctx);
    this.ctx.events = new Events(this.ctx);
    this.ctx.exports = new Exports(this.ctx);
    this.ctx.fill = new Fill(this.ctx);
    this.ctx.localization = new Localization(this.ctx);
    this.ctx.options = new Options();
    this.ctx.responsive = new Responsive(this.ctx);
    this.ctx.series = new Series(this.ctx);
    this.ctx.theme = new Theme(this.ctx);
    this.ctx.formatters = new Formatters(this.ctx);
    this.ctx.titleSubtitle = new TitleSubtitle(this.ctx);
    this.ctx.legend = new Legend(this.ctx);
    this.ctx.toolbar = new Toolbar(this.ctx);
    this.ctx.tooltip = new Tooltip(this.ctx);
    this.ctx.dimensions = new Dimensions(this.ctx);
    this.ctx.updateHelpers = new UpdateHelpers(this.ctx);
    this.ctx.zoomPanSelection = new ZoomPanSelection(this.ctx);
    this.ctx.w.globals.tooltip = new Tooltip(this.ctx);
  }
}
class Destroy {
  constructor(ctx) {
    this.ctx = ctx;
    this.w = ctx.w;
  }
  clear({ isUpdating }) {
    if (this.ctx.zoomPanSelection) {
      this.ctx.zoomPanSelection.destroy();
    }
    if (this.ctx.toolbar) {
      this.ctx.toolbar.destroy();
    }
    if (this.w.globals.resizeObserver && typeof this.w.globals.resizeObserver.disconnect === "function") {
      this.w.globals.resizeObserver.disconnect();
      this.w.globals.resizeObserver = null;
    }
    PerformanceCache.invalidateAll(this.w);
    this.ctx.animations = null;
    this.ctx.axes = null;
    this.ctx.annotations = null;
    this.ctx.core = null;
    this.ctx.data = null;
    this.ctx.grid = null;
    this.ctx.series = null;
    this.ctx.responsive = null;
    this.ctx.theme = null;
    this.ctx.formatters = null;
    this.ctx.titleSubtitle = null;
    this.ctx.legend = null;
    this.ctx.dimensions = null;
    this.ctx.options = null;
    this.ctx.crosshairs = null;
    this.ctx.zoomPanSelection = null;
    this.ctx.updateHelpers = null;
    this.ctx.toolbar = null;
    this.ctx.localization = null;
    this.ctx.w.globals.tooltip = null;
    this.clearDomElements({ isUpdating });
  }
  killSVG(draw) {
    draw.each(function() {
      this.removeClass("*");
      this.off();
    }, true);
    draw.clear();
  }
  clearDomElements({ isUpdating }) {
    const elSVG = this.w.globals.dom.Paper.node;
    if (elSVG.parentNode && elSVG.parentNode.parentNode && !isUpdating) {
      elSVG.parentNode.parentNode.style.minHeight = "unset";
    }
    const baseEl = this.w.globals.dom.baseEl;
    if (baseEl) {
      this.ctx.eventList.forEach((event) => {
        baseEl.removeEventListener(event, this.ctx.events.documentEvent);
      });
    }
    const domEls = this.w.globals.dom;
    if (this.ctx.el !== null) {
      while (this.ctx.el.firstChild) {
        this.ctx.el.removeChild(this.ctx.el.firstChild);
      }
    }
    this.killSVG(domEls.Paper);
    domEls.Paper.remove();
    domEls.elWrap = null;
    domEls.elGraphical = null;
    domEls.elLegendWrap = null;
    domEls.elLegendForeign = null;
    domEls.baseEl = null;
    domEls.elGridRect = null;
    domEls.elGridRectMask = null;
    domEls.elGridRectBarMask = null;
    domEls.elGridRectMarkerMask = null;
    domEls.elForecastMask = null;
    domEls.elNonForecastMask = null;
    domEls.elDefs = null;
  }
}
let ros = /* @__PURE__ */ new WeakMap();
function addResizeListener(el, fn) {
  let called = false;
  if (el.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    const elRect = el.getBoundingClientRect();
    if (el.style.display === "none" || elRect.width === 0) {
      called = true;
    }
  }
  let ro = new ResizeObserver((r) => {
    if (called) {
      fn.call(el, r);
    }
    called = true;
  });
  if (el.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    Array.from(el.children).forEach((c) => ro.observe(c));
  } else {
    ro.observe(el);
  }
  ros.set(fn, ro);
}
function removeResizeListener(el, fn) {
  let ro = ros.get(fn);
  if (ro) {
    ro.disconnect();
    ros.delete(fn);
  }
}
const apexCSS = '@keyframes opaque {\n  0% {\n    opacity: 0\n  }\n\n  to {\n    opacity: 1\n  }\n}\n\n@keyframes resizeanim {\n\n  0%,\n  to {\n    opacity: 0\n  }\n}\n\n.apexcharts-canvas {\n  position: relative;\n  direction: ltr !important;\n  user-select: none\n}\n\n.apexcharts-canvas ::-webkit-scrollbar {\n  -webkit-appearance: none;\n  width: 6px\n}\n\n.apexcharts-canvas ::-webkit-scrollbar-thumb {\n  border-radius: 4px;\n  background-color: rgba(0, 0, 0, .5);\n  box-shadow: 0 0 1px rgba(255, 255, 255, .5);\n  -webkit-box-shadow: 0 0 1px rgba(255, 255, 255, .5)\n}\n\n.apexcharts-inner {\n  position: relative\n}\n\n.apexcharts-text tspan {\n  font-family: inherit\n}\n\nrect.legend-mouseover-inactive,\n.legend-mouseover-inactive rect,\n.legend-mouseover-inactive path,\n.legend-mouseover-inactive circle,\n.legend-mouseover-inactive line,\n.legend-mouseover-inactive text.apexcharts-yaxis-title-text,\n.legend-mouseover-inactive text.apexcharts-yaxis-label {\n  transition: .15s ease all;\n  opacity: .2\n}\n\n.apexcharts-legend-text {\n  padding-left: 15px;\n  margin-left: -15px;\n}\n\n.apexcharts-series-collapsed {\n  opacity: 0\n}\n\n.apexcharts-tooltip {\n  border-radius: 5px;\n  box-shadow: 2px 2px 6px -4px #999;\n  cursor: default;\n  font-size: 14px;\n  left: 62px;\n  opacity: 0;\n  pointer-events: none;\n  position: absolute;\n  top: 20px;\n  display: flex;\n  flex-direction: column;\n  overflow: hidden;\n  white-space: nowrap;\n  z-index: 12;\n  transition: .15s ease all\n}\n\n.apexcharts-tooltip.apexcharts-active {\n  opacity: 1;\n  transition: .15s ease all\n}\n\n.apexcharts-tooltip.apexcharts-theme-light {\n  border: 1px solid #e3e3e3;\n  background: rgba(255, 255, 255, .96)\n}\n\n.apexcharts-tooltip.apexcharts-theme-dark {\n  color: #fff;\n  background: rgba(30, 30, 30, .8)\n}\n\n.apexcharts-tooltip * {\n  font-family: inherit\n}\n\n.apexcharts-tooltip-title {\n  padding: 6px;\n  font-size: 15px;\n  margin-bottom: 4px\n}\n\n.apexcharts-tooltip.apexcharts-theme-light .apexcharts-tooltip-title {\n  background: #eceff1;\n  border-bottom: 1px solid #ddd\n}\n\n.apexcharts-tooltip.apexcharts-theme-dark .apexcharts-tooltip-title {\n  background: rgba(0, 0, 0, .7);\n  border-bottom: 1px solid #333\n}\n\n.apexcharts-tooltip-text-goals-value,\n.apexcharts-tooltip-text-y-value,\n.apexcharts-tooltip-text-z-value {\n  display: inline-block;\n  margin-left: 5px;\n  font-weight: 600\n}\n\n.apexcharts-tooltip-text-goals-label:empty,\n.apexcharts-tooltip-text-goals-value:empty,\n.apexcharts-tooltip-text-y-label:empty,\n.apexcharts-tooltip-text-y-value:empty,\n.apexcharts-tooltip-text-z-value:empty,\n.apexcharts-tooltip-title:empty {\n  display: none\n}\n\n.apexcharts-tooltip-text-goals-label,\n.apexcharts-tooltip-text-goals-value {\n  padding: 6px 0 5px\n}\n\n.apexcharts-tooltip-goals-group,\n.apexcharts-tooltip-text-goals-label,\n.apexcharts-tooltip-text-goals-value {\n  display: flex\n}\n\n.apexcharts-tooltip-text-goals-label:not(:empty),\n.apexcharts-tooltip-text-goals-value:not(:empty) {\n  margin-top: -6px\n}\n\n.apexcharts-tooltip-marker {\n  display: inline-block;\n  position: relative;\n  width: 16px;\n  height: 16px;\n  font-size: 16px;\n  line-height: 16px;\n  margin-right: 4px;\n  text-align: center;\n  vertical-align: middle;\n  color: inherit;\n}\n\n.apexcharts-tooltip-marker::before {\n  content: "";\n  display: inline-block;\n  width: 100%;\n  text-align: center;\n  color: currentcolor;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  font-size: 26px;\n  font-family: Arial, Helvetica, sans-serif;\n  line-height: 14px;\n  font-weight: 900;\n}\n\n.apexcharts-tooltip-marker[shape="circle"]::before {\n  content: "\\25CF";\n}\n\n.apexcharts-tooltip-marker[shape="square"]::before,\n.apexcharts-tooltip-marker[shape="rect"]::before {\n  content: "\\25A0";\n  transform: translate(-1px, -2px);\n}\n\n.apexcharts-tooltip-marker[shape="line"]::before {\n  content: "\\2500";\n}\n\n.apexcharts-tooltip-marker[shape="diamond"]::before {\n  content: "\\25C6";\n  font-size: 28px;\n}\n\n.apexcharts-tooltip-marker[shape="triangle"]::before {\n  content: "\\25B2";\n  font-size: 22px;\n}\n\n.apexcharts-tooltip-marker[shape="cross"]::before {\n  content: "\\2715";\n  font-size: 18px;\n}\n\n.apexcharts-tooltip-marker[shape="plus"]::before {\n  content: "\\2715";\n  transform: rotate(45deg) translate(-1px, -1px);\n  font-size: 18px;\n}\n\n.apexcharts-tooltip-marker[shape="star"]::before {\n  content: "\\2605";\n  font-size: 18px;\n}\n\n.apexcharts-tooltip-marker[shape="sparkle"]::before {\n  content: "\\2726";\n  font-size: 20px;\n}\n\n.apexcharts-tooltip-series-group {\n  padding: 0 10px;\n  display: none;\n  text-align: left;\n  justify-content: left;\n  align-items: center\n}\n\n.apexcharts-tooltip-series-group.apexcharts-active .apexcharts-tooltip-marker {\n  opacity: 1\n}\n\n.apexcharts-tooltip-series-group.apexcharts-active,\n.apexcharts-tooltip-series-group:last-child {\n  padding-bottom: 4px\n}\n\n.apexcharts-tooltip-y-group {\n  padding: 6px 0 5px\n}\n\n.apexcharts-custom-tooltip,\n.apexcharts-tooltip-box {\n  padding: 4px 8px\n}\n\n.apexcharts-tooltip-boxPlot {\n  display: flex;\n  flex-direction: column-reverse\n}\n\n.apexcharts-tooltip-box>div {\n  margin: 4px 0\n}\n\n.apexcharts-tooltip-box span.value {\n  font-weight: 700\n}\n\n.apexcharts-tooltip-rangebar {\n  padding: 5px 8px\n}\n\n.apexcharts-tooltip-rangebar .category {\n  font-weight: 600;\n  color: #777\n}\n\n.apexcharts-tooltip-rangebar .series-name {\n  font-weight: 700;\n  display: block;\n  margin-bottom: 5px\n}\n\n.apexcharts-xaxistooltip,\n.apexcharts-yaxistooltip {\n  opacity: 0;\n  pointer-events: none;\n  color: #373d3f;\n  font-size: 13px;\n  text-align: center;\n  border-radius: 2px;\n  position: absolute;\n  z-index: 10;\n  background: #eceff1;\n  border: 1px solid #90a4ae\n}\n\n.apexcharts-xaxistooltip {\n  padding: 9px 10px;\n  transition: .15s ease all\n}\n\n.apexcharts-xaxistooltip.apexcharts-theme-dark {\n  background: rgba(0, 0, 0, .7);\n  border: 1px solid rgba(0, 0, 0, .5);\n  color: #fff\n}\n\n.apexcharts-xaxistooltip:after,\n.apexcharts-xaxistooltip:before {\n  left: 50%;\n  border: solid transparent;\n  content: " ";\n  height: 0;\n  width: 0;\n  position: absolute;\n  pointer-events: none\n}\n\n.apexcharts-xaxistooltip:after {\n  border-color: transparent;\n  border-width: 6px;\n  margin-left: -6px\n}\n\n.apexcharts-xaxistooltip:before {\n  border-color: transparent;\n  border-width: 7px;\n  margin-left: -7px\n}\n\n.apexcharts-xaxistooltip-bottom:after,\n.apexcharts-xaxistooltip-bottom:before {\n  bottom: 100%\n}\n\n.apexcharts-xaxistooltip-top:after,\n.apexcharts-xaxistooltip-top:before {\n  top: 100%\n}\n\n.apexcharts-xaxistooltip-bottom:after {\n  border-bottom-color: #eceff1\n}\n\n.apexcharts-xaxistooltip-bottom:before {\n  border-bottom-color: #90a4ae\n}\n\n.apexcharts-xaxistooltip-bottom.apexcharts-theme-dark:after,\n.apexcharts-xaxistooltip-bottom.apexcharts-theme-dark:before {\n  border-bottom-color: rgba(0, 0, 0, .5)\n}\n\n.apexcharts-xaxistooltip-top:after {\n  border-top-color: #eceff1\n}\n\n.apexcharts-xaxistooltip-top:before {\n  border-top-color: #90a4ae\n}\n\n.apexcharts-xaxistooltip-top.apexcharts-theme-dark:after,\n.apexcharts-xaxistooltip-top.apexcharts-theme-dark:before {\n  border-top-color: rgba(0, 0, 0, .5)\n}\n\n.apexcharts-xaxistooltip.apexcharts-active {\n  opacity: 1;\n  transition: .15s ease all\n}\n\n.apexcharts-yaxistooltip {\n  padding: 4px 10px\n}\n\n.apexcharts-yaxistooltip.apexcharts-theme-dark {\n  background: rgba(0, 0, 0, .7);\n  border: 1px solid rgba(0, 0, 0, .5);\n  color: #fff\n}\n\n.apexcharts-yaxistooltip:after,\n.apexcharts-yaxistooltip:before {\n  top: 50%;\n  border: solid transparent;\n  content: " ";\n  height: 0;\n  width: 0;\n  position: absolute;\n  pointer-events: none\n}\n\n.apexcharts-yaxistooltip:after {\n  border-color: transparent;\n  border-width: 6px;\n  margin-top: -6px\n}\n\n.apexcharts-yaxistooltip:before {\n  border-color: transparent;\n  border-width: 7px;\n  margin-top: -7px\n}\n\n.apexcharts-yaxistooltip-left:after,\n.apexcharts-yaxistooltip-left:before {\n  left: 100%\n}\n\n.apexcharts-yaxistooltip-right:after,\n.apexcharts-yaxistooltip-right:before {\n  right: 100%\n}\n\n.apexcharts-yaxistooltip-left:after {\n  border-left-color: #eceff1\n}\n\n.apexcharts-yaxistooltip-left:before {\n  border-left-color: #90a4ae\n}\n\n.apexcharts-yaxistooltip-left.apexcharts-theme-dark:after,\n.apexcharts-yaxistooltip-left.apexcharts-theme-dark:before {\n  border-left-color: rgba(0, 0, 0, .5)\n}\n\n.apexcharts-yaxistooltip-right:after {\n  border-right-color: #eceff1\n}\n\n.apexcharts-yaxistooltip-right:before {\n  border-right-color: #90a4ae\n}\n\n.apexcharts-yaxistooltip-right.apexcharts-theme-dark:after,\n.apexcharts-yaxistooltip-right.apexcharts-theme-dark:before {\n  border-right-color: rgba(0, 0, 0, .5)\n}\n\n.apexcharts-yaxistooltip.apexcharts-active {\n  opacity: 1\n}\n\n.apexcharts-yaxistooltip-hidden {\n  display: none\n}\n\n.apexcharts-xcrosshairs,\n.apexcharts-ycrosshairs {\n  pointer-events: none;\n  opacity: 0;\n  transition: .15s ease all\n}\n\n.apexcharts-xcrosshairs.apexcharts-active,\n.apexcharts-ycrosshairs.apexcharts-active {\n  opacity: 1;\n  transition: .15s ease all\n}\n\n.apexcharts-ycrosshairs-hidden {\n  opacity: 0\n}\n\n.apexcharts-selection-rect {\n  cursor: move\n}\n\n.svg_select_shape {\n  stroke-width: 1;\n  stroke-dasharray: 10 10;\n  stroke: black;\n  stroke-opacity: 0.1;\n  pointer-events: none;\n  fill: none;\n}\n\n.svg_select_handle {\n  stroke-width: 3;\n  stroke: black;\n  fill: none;\n}\n\n.svg_select_handle_r {\n  cursor: e-resize;\n}\n\n.svg_select_handle_l {\n  cursor: w-resize;\n}\n\n.apexcharts-svg.apexcharts-zoomable.hovering-zoom {\n  cursor: crosshair\n}\n\n.apexcharts-svg.apexcharts-zoomable.hovering-pan {\n  cursor: move\n}\n\n.apexcharts-menu-icon,\n.apexcharts-pan-icon,\n.apexcharts-reset-icon,\n.apexcharts-selection-icon,\n.apexcharts-toolbar-custom-icon,\n.apexcharts-zoom-icon,\n.apexcharts-zoomin-icon,\n.apexcharts-zoomout-icon {\n  cursor: pointer;\n  width: 20px;\n  height: 20px;\n  line-height: 24px;\n  color: #6e8192;\n  text-align: center\n}\n\n.apexcharts-menu-icon svg,\n.apexcharts-reset-icon svg,\n.apexcharts-zoom-icon svg,\n.apexcharts-zoomin-icon svg,\n.apexcharts-zoomout-icon svg {\n  fill: #6e8192\n}\n\n.apexcharts-selection-icon svg {\n  fill: #444;\n  transform: scale(.76)\n}\n\n.apexcharts-theme-dark .apexcharts-menu-icon svg,\n.apexcharts-theme-dark .apexcharts-pan-icon svg,\n.apexcharts-theme-dark .apexcharts-reset-icon svg,\n.apexcharts-theme-dark .apexcharts-selection-icon svg,\n.apexcharts-theme-dark .apexcharts-toolbar-custom-icon svg,\n.apexcharts-theme-dark .apexcharts-zoom-icon svg,\n.apexcharts-theme-dark .apexcharts-zoomin-icon svg,\n.apexcharts-theme-dark .apexcharts-zoomout-icon svg {\n  fill: #f3f4f5\n}\n\n.apexcharts-canvas .apexcharts-reset-zoom-icon.apexcharts-selected svg,\n.apexcharts-canvas .apexcharts-selection-icon.apexcharts-selected svg,\n.apexcharts-canvas .apexcharts-zoom-icon.apexcharts-selected svg {\n  fill: #008ffb\n}\n\n.apexcharts-theme-light .apexcharts-menu-icon:hover svg,\n.apexcharts-theme-light .apexcharts-reset-icon:hover svg,\n.apexcharts-theme-light .apexcharts-selection-icon:not(.apexcharts-selected):hover svg,\n.apexcharts-theme-light .apexcharts-zoom-icon:not(.apexcharts-selected):hover svg,\n.apexcharts-theme-light .apexcharts-zoomin-icon:hover svg,\n.apexcharts-theme-light .apexcharts-zoomout-icon:hover svg {\n  fill: #333\n}\n\n.apexcharts-menu-icon,\n.apexcharts-selection-icon {\n  position: relative\n}\n\n.apexcharts-reset-icon {\n  margin-left: 5px\n}\n\n.apexcharts-menu-icon,\n.apexcharts-reset-icon,\n.apexcharts-zoom-icon {\n  transform: scale(.85)\n}\n\n.apexcharts-zoomin-icon,\n.apexcharts-zoomout-icon {\n  transform: scale(.7)\n}\n\n.apexcharts-zoomout-icon {\n  margin-right: 3px\n}\n\n.apexcharts-pan-icon {\n  transform: scale(.62);\n  position: relative;\n  left: 1px;\n  top: 0\n}\n\n.apexcharts-pan-icon svg {\n  fill: #fff;\n  stroke: #6e8192;\n  stroke-width: 2\n}\n\n.apexcharts-pan-icon.apexcharts-selected svg {\n  stroke: #008ffb\n}\n\n.apexcharts-pan-icon:not(.apexcharts-selected):hover svg {\n  stroke: #333\n}\n\n.apexcharts-toolbar {\n  position: absolute;\n  z-index: 11;\n  max-width: 176px;\n  text-align: right;\n  border-radius: 3px;\n  padding: 0 6px 2px;\n  display: flex;\n  justify-content: space-between;\n  align-items: center\n}\n\n.apexcharts-menu {\n  background: #fff;\n  position: absolute;\n  top: 100%;\n  border: 1px solid #ddd;\n  border-radius: 3px;\n  padding: 3px;\n  right: 10px;\n  opacity: 0;\n  min-width: 110px;\n  transition: .15s ease all;\n  pointer-events: none\n}\n\n.apexcharts-menu.apexcharts-menu-open {\n  opacity: 1;\n  pointer-events: all;\n  transition: .15s ease all\n}\n\n.apexcharts-menu-item {\n  padding: 6px 7px;\n  font-size: 12px;\n  cursor: pointer\n}\n\n.apexcharts-theme-light .apexcharts-menu-item:hover {\n  background: #eee\n}\n\n.apexcharts-theme-dark .apexcharts-menu {\n  background: rgba(0, 0, 0, .7);\n  color: #fff\n}\n\n@media screen and (min-width:768px) {\n  .apexcharts-canvas:hover .apexcharts-toolbar {\n    opacity: 1\n  }\n}\n\n.apexcharts-canvas .apexcharts-element-hidden,\n.apexcharts-datalabel.apexcharts-element-hidden,\n.apexcharts-hide .apexcharts-series-points {\n  opacity: 0;\n}\n\n.apexcharts-hidden-element-shown {\n  opacity: 1;\n  transition: 0.25s ease all;\n}\n\n.apexcharts-datalabel,\n.apexcharts-datalabel-label,\n.apexcharts-datalabel-value,\n.apexcharts-datalabels,\n.apexcharts-pie-label {\n  cursor: default;\n  pointer-events: none\n}\n\n.apexcharts-pie-label-delay {\n  opacity: 0;\n  animation-name: opaque;\n  animation-duration: .3s;\n  animation-fill-mode: forwards;\n  animation-timing-function: ease\n}\n\n.apexcharts-radialbar-label {\n  cursor: pointer;\n}\n\n.apexcharts-annotation-rect,\n.apexcharts-area-series .apexcharts-area,\n.apexcharts-gridline,\n.apexcharts-line,\n.apexcharts-point-annotation-label,\n.apexcharts-radar-series path:not(.apexcharts-marker),\n.apexcharts-radar-series polygon,\n.apexcharts-toolbar svg,\n.apexcharts-tooltip .apexcharts-marker,\n.apexcharts-xaxis-annotation-label,\n.apexcharts-yaxis-annotation-label,\n.apexcharts-zoom-rect,\n.no-pointer-events {\n  pointer-events: none\n}\n\n.apexcharts-tooltip-active .apexcharts-marker {\n  transition: .15s ease all\n}\n\n.apexcharts-radar-series .apexcharts-yaxis {\n  pointer-events: none;\n}\n\n.resize-triggers {\n  animation: 1ms resizeanim;\n  visibility: hidden;\n  opacity: 0;\n  height: 100%;\n  width: 100%;\n  overflow: hidden\n}\n\n.contract-trigger:before,\n.resize-triggers,\n.resize-triggers>div {\n  content: " ";\n  display: block;\n  position: absolute;\n  top: 0;\n  left: 0\n}\n\n.resize-triggers>div {\n  height: 100%;\n  width: 100%;\n  background: #eee;\n  overflow: auto\n}\n\n.contract-trigger:before {\n  overflow: hidden;\n  width: 200%;\n  height: 200%\n}\n\n.apexcharts-bar-goals-markers {\n  pointer-events: none\n}\n\n.apexcharts-bar-shadows {\n  pointer-events: none\n}\n\n.apexcharts-rangebar-goals-markers {\n  pointer-events: none\n}\n\n.apexcharts-disable-transitions * {\n  transition: none !important;\n}';
class ApexCharts {
  constructor(el, opts) {
    this.opts = opts;
    this.ctx = this;
    this.w = new Base(opts).init();
    this.el = el;
    this.w.globals.cuid = Utils$1.randomId();
    this.w.globals.chartID = this.w.config.chart.id ? Utils$1.escapeString(this.w.config.chart.id) : this.w.globals.cuid;
    const initCtx = new InitCtxVariables(this);
    initCtx.initModules();
    this.lastUpdateOptions = null;
    this.create = Utils$1.bind(this.create, this);
    this.windowResizeHandler = this._windowResizeHandler.bind(this);
    this.parentResizeHandler = this._parentResizeCallback.bind(this);
  }
  /**
   * The primary method user will call to render the chart.
   */
  render() {
    return new Promise((resolve, reject) => {
      var _a;
      if (Utils$1.elementExists(this.el)) {
        if (typeof Apex._chartInstances === "undefined") {
          Apex._chartInstances = [];
        }
        if (this.w.config.chart.id) {
          Apex._chartInstances.push({
            id: this.w.globals.chartID,
            group: this.w.config.chart.group,
            chart: this
          });
        }
        this.setLocale(this.w.config.chart.defaultLocale);
        const beforeMount = this.w.config.chart.events.beforeMount;
        if (typeof beforeMount === "function") {
          beforeMount(this, this.w);
        }
        this.events.fireEvent("beforeMount", [this, this.w]);
        window.addEventListener("resize", this.windowResizeHandler);
        addResizeListener(this.el.parentNode, this.parentResizeHandler);
        let rootNode = this.el.getRootNode && this.el.getRootNode();
        let inShadowRoot = Utils$1.is("ShadowRoot", rootNode);
        let doc = this.el.ownerDocument;
        let css = inShadowRoot ? rootNode.getElementById("apexcharts-css") : doc.getElementById("apexcharts-css");
        if (!css) {
          css = document.createElement("style");
          css.id = "apexcharts-css";
          css.textContent = apexCSS;
          const nonce = ((_a = this.opts.chart) == null ? void 0 : _a.nonce) || this.w.config.chart.nonce;
          if (nonce) {
            css.setAttribute("nonce", nonce);
          }
          if (inShadowRoot) {
            rootNode.prepend(css);
          } else if (this.w.config.chart.injectStyleSheet !== false) {
            doc.head.appendChild(css);
          }
        }
        let graphData = this.create(this.w.config.series, {});
        if (!graphData) return resolve(this);
        this.mount(graphData).then(() => {
          if (typeof this.w.config.chart.events.mounted === "function") {
            this.w.config.chart.events.mounted(this, this.w);
          }
          this.events.fireEvent("mounted", [this, this.w]);
          resolve(graphData);
        }).catch((e) => {
          reject(e);
        });
      } else {
        reject(new Error("Element not found"));
      }
    });
  }
  create(ser, opts) {
    let w = this.w;
    const initCtx = new InitCtxVariables(this);
    initCtx.initModules();
    let gl = this.w.globals;
    gl.noData = false;
    gl.animationEnded = false;
    if (!Utils$1.elementExists(this.el)) {
      gl.animationEnded = true;
      return null;
    }
    this.responsive.checkResponsiveConfig(opts);
    if (w.config.xaxis.convertedCatToNumeric) {
      const defaults = new Defaults(w.config);
      defaults.convertCatToNumericXaxis(w.config, this.ctx);
    }
    this.core.setupElements();
    if (w.config.chart.type === "treemap") {
      w.config.grid.show = false;
      w.config.yaxis[0].show = false;
    }
    if (gl.svgWidth === 0) {
      gl.animationEnded = true;
      return null;
    }
    let series = ser;
    ser.forEach((s, realIndex2) => {
      if (s.hidden) {
        series = this.legend.legendHelpers.getSeriesAfterCollapsing({
          realIndex: realIndex2
        });
      }
    });
    const combo = CoreUtils.checkComboSeries(series, w.config.chart.type);
    gl.comboCharts = combo.comboCharts;
    gl.comboBarCount = combo.comboBarCount;
    const allSeriesAreEmpty = series.every((s) => s.data && s.data.length === 0);
    if (series.length === 0 || allSeriesAreEmpty && gl.collapsedSeries.length < 1) {
      this.series.handleNoData();
    }
    this.events.setupEventHandlers();
    this.data.parseData(series);
    this.theme.init();
    const markers = new Markers(this);
    markers.setGlobalMarkerSize();
    this.formatters.setLabelFormatters();
    this.titleSubtitle.draw();
    if (!gl.noData || gl.collapsedSeries.length === gl.series.length || w.config.legend.showForSingleSeries) {
      this.legend.init();
    }
    this.series.hasAllSeriesEqualX();
    if (gl.axisCharts) {
      this.core.coreCalculations();
      if (w.config.xaxis.type !== "category") {
        this.formatters.setLabelFormatters();
      }
      this.ctx.toolbar.minX = w.globals.minX;
      this.ctx.toolbar.maxX = w.globals.maxX;
    }
    this.formatters.heatmapLabelFormatters();
    const coreUtils = new CoreUtils(this);
    coreUtils.getLargestMarkerSize();
    this.dimensions.plotCoords();
    const xyRatios = this.core.xySettings();
    this.grid.createGridMask();
    const elGraph = this.core.plotChartType(series, xyRatios);
    const dataLabels = new DataLabels(this);
    dataLabels.bringForward();
    if (w.config.dataLabels.background.enabled) {
      dataLabels.dataLabelsBackground();
    }
    this.core.shiftGraphPosition();
    if (w.globals.dataPoints > 50) {
      w.globals.dom.elWrap.classList.add("apexcharts-disable-transitions");
    }
    const dim = {
      plot: {
        left: w.globals.translateX,
        top: w.globals.translateY,
        width: w.globals.gridWidth,
        height: w.globals.gridHeight
      }
    };
    return {
      elGraph,
      xyRatios,
      dimensions: dim
    };
  }
  mount(graphData = null) {
    let me = this;
    let w = me.w;
    return new Promise((resolve, reject) => {
      var _a, _b;
      if (me.el === null) {
        return reject(
          new Error("Not enough data to display or target element not found")
        );
      } else if (graphData === null || w.globals.allSeriesCollapsed) {
        me.series.handleNoData();
      }
      me.grid = new Grid(me);
      let elgrid = me.grid.drawGrid();
      me.annotations = new Annotations(me);
      me.annotations.drawImageAnnos();
      me.annotations.drawTextAnnos();
      if (w.config.grid.position === "back") {
        if (elgrid) {
          w.globals.dom.elGraphical.add(elgrid.el);
        }
        if ((_a = elgrid == null ? void 0 : elgrid.elGridBorders) == null ? void 0 : _a.node) {
          w.globals.dom.elGraphical.add(elgrid.elGridBorders);
        }
      }
      if (Array.isArray(graphData.elGraph)) {
        for (let g = 0; g < graphData.elGraph.length; g++) {
          w.globals.dom.elGraphical.add(graphData.elGraph[g]);
        }
      } else {
        w.globals.dom.elGraphical.add(graphData.elGraph);
      }
      if (w.config.grid.position === "front") {
        if (elgrid) {
          w.globals.dom.elGraphical.add(elgrid.el);
        }
        if ((_b = elgrid == null ? void 0 : elgrid.elGridBorders) == null ? void 0 : _b.node) {
          w.globals.dom.elGraphical.add(elgrid.elGridBorders);
        }
      }
      if (w.config.xaxis.crosshairs.position === "front") {
        me.crosshairs.drawXCrosshairs();
      }
      if (w.config.yaxis[0].crosshairs.position === "front") {
        me.crosshairs.drawYCrosshairs();
      }
      if (w.config.chart.type !== "treemap") {
        me.axes.drawAxis(w.config.chart.type, elgrid);
      }
      let xAxis = new XAxis(this.ctx, elgrid);
      let yaxis = new YAxis(this.ctx, elgrid);
      if (elgrid !== null) {
        xAxis.xAxisLabelCorrections(elgrid.xAxisTickWidth);
        yaxis.setYAxisTextAlignments();
        w.config.yaxis.map((yaxe, index) => {
          if (w.globals.ignoreYAxisIndexes.indexOf(index) === -1) {
            yaxis.yAxisTitleRotate(index, yaxe.opposite);
          }
        });
      }
      me.annotations.drawAxesAnnotations();
      if (!w.globals.noData) {
        if (w.config.tooltip.enabled && !w.globals.noData) {
          me.w.globals.tooltip.drawTooltip(graphData.xyRatios);
        }
        if (w.globals.axisCharts && (w.globals.isXNumeric || w.config.xaxis.convertedCatToNumeric || w.globals.isRangeBar)) {
          if (w.config.chart.zoom.enabled || w.config.chart.selection && w.config.chart.selection.enabled || w.config.chart.pan && w.config.chart.pan.enabled) {
            me.zoomPanSelection.init({
              xyRatios: graphData.xyRatios
            });
          }
        } else {
          const tools = w.config.chart.toolbar.tools;
          let toolsArr = [
            "zoom",
            "zoomin",
            "zoomout",
            "selection",
            "pan",
            "reset"
          ];
          toolsArr.forEach((t) => {
            tools[t] = false;
          });
        }
        if (w.config.chart.toolbar.show && !w.globals.allSeriesCollapsed) {
          me.toolbar.createToolbar();
        }
      }
      if (w.globals.memory.methodsToExec.length > 0) {
        w.globals.memory.methodsToExec.forEach((fn) => {
          fn.method(fn.params, false, fn.context);
        });
      }
      if (!w.globals.axisCharts && !w.globals.noData) {
        me.core.resizeNonAxisCharts();
      }
      resolve(me);
    });
  }
  /**
   * Destroy the chart instance by removing all elements which also clean up event listeners on those elements.
   */
  destroy() {
    window.removeEventListener("resize", this.windowResizeHandler);
    removeResizeListener(this.el.parentNode, this.parentResizeHandler);
    const chartID = this.w.config.chart.id;
    if (chartID) {
      Apex._chartInstances.forEach((c, i) => {
        if (c.id === Utils$1.escapeString(chartID)) {
          Apex._chartInstances.splice(i, 1);
        }
      });
    }
    new Destroy(this.ctx).clear({ isUpdating: false });
  }
  /**
   * Allows users to update Options after the chart has rendered.
   *
   * @param {object} options - A new config object can be passed which will be merged with the existing config object
   * @param {boolean} redraw - should redraw from beginning or should use existing paths and redraw from there
   * @param {boolean} animate - should animate or not on updating Options
   */
  updateOptions(options2, redraw = false, animate = true, updateSyncedCharts = true, overwriteInitialConfig = true) {
    const w = this.w;
    w.globals.selection = void 0;
    if (this.lastUpdateOptions) {
      if (Utils$1.shallowEqual(this.lastUpdateOptions, options2)) {
        return this;
      }
      if (options2.series && this.lastUpdateOptions.series) {
        if (JSON.stringify(this.lastUpdateOptions.series) === JSON.stringify(options2.series)) {
          const optionsWithoutSeries = __spreadValues({}, options2);
          const lastWithoutSeries = __spreadValues({}, this.lastUpdateOptions);
          delete optionsWithoutSeries.series;
          delete lastWithoutSeries.series;
          if (Utils$1.shallowEqual(optionsWithoutSeries, lastWithoutSeries)) {
            return this;
          }
        }
      }
    }
    if (options2.series) {
      this.data.resetParsingFlags();
      this.series.resetSeries(false, true, false);
      if (options2.series.length && options2.series[0].data) {
        options2.series = options2.series.map((s, i) => {
          return this.updateHelpers._extendSeries(s, i);
        });
      }
      this.updateHelpers.revertDefaultAxisMinMax();
    }
    if (options2.xaxis) {
      options2 = this.updateHelpers.forceXAxisUpdate(options2);
    }
    if (options2.yaxis) {
      options2 = this.updateHelpers.forceYAxisUpdate(options2);
    }
    if (w.globals.collapsedSeriesIndices.length > 0) {
      this.series.clearPreviousPaths();
    }
    if (options2.theme) {
      options2 = this.theme.updateThemeOptions(options2);
    }
    return this.updateHelpers._updateOptions(
      options2,
      redraw,
      animate,
      updateSyncedCharts,
      overwriteInitialConfig
    );
  }
  /**
   * Allows users to update Series after the chart has rendered.
   *
   * @param {array} series - New series which will override the existing
   */
  updateSeries(newSeries = [], animate = true, overwriteInitialSeries = true) {
    this.data.resetParsingFlags();
    this.series.resetSeries(false);
    this.updateHelpers.revertDefaultAxisMinMax();
    return this.updateHelpers._updateSeries(
      newSeries,
      animate,
      overwriteInitialSeries
    );
  }
  /**
   * Allows users to append a new series after the chart has rendered.
   *
   * @param {array} newSerie - New serie which will be appended to the existing series
   */
  appendSeries(newSerie, animate = true, overwriteInitialSeries = true) {
    this.data.resetParsingFlags();
    const newSeries = this.w.config.series.slice();
    newSeries.push(newSerie);
    this.series.resetSeries(false);
    this.updateHelpers.revertDefaultAxisMinMax();
    return this.updateHelpers._updateSeries(
      newSeries,
      animate,
      overwriteInitialSeries
    );
  }
  /**
   * Allows users to append Data to series.
   *
   * @param {array} newData - New data in the same format as series
   */
  appendData(newData, overwriteInitialSeries = true) {
    let me = this;
    me.data.resetParsingFlags();
    me.w.globals.dataChanged = true;
    me.series.getPreviousPaths();
    let newSeries = me.w.config.series.slice();
    for (let i = 0; i < newSeries.length; i++) {
      if (newData[i] !== null && typeof newData[i] !== "undefined") {
        for (let j2 = 0; j2 < newData[i].data.length; j2++) {
          newSeries[i].data.push(newData[i].data[j2]);
        }
      }
    }
    me.w.config.series = newSeries;
    if (overwriteInitialSeries) {
      me.w.globals.initialSeries = Utils$1.clone(me.w.config.series);
    }
    return this.update();
  }
  update(options2) {
    return new Promise((resolve, reject) => {
      if (this.lastUpdateOptions && JSON.stringify(this.lastUpdateOptions) === JSON.stringify(options2)) {
        return resolve(this);
      }
      this.lastUpdateOptions = Utils$1.clone(options2);
      new Destroy(this.ctx).clear({ isUpdating: true });
      const graphData = this.create(this.w.config.series, options2);
      if (!graphData) return resolve(this);
      this.mount(graphData).then(() => {
        if (typeof this.w.config.chart.events.updated === "function") {
          this.w.config.chart.events.updated(this, this.w);
        }
        this.events.fireEvent("updated", [this, this.w]);
        this.w.globals.isDirty = true;
        resolve(this);
      }).catch((e) => {
        reject(e);
      });
    });
  }
  /**
   * Get all charts in the same "group" (including the instance which is called upon) to sync them when user zooms in/out or pan.
   */
  getSyncedCharts() {
    const chartGroups = this.getGroupedCharts();
    let allCharts = [this];
    if (chartGroups.length) {
      allCharts = [];
      chartGroups.forEach((ch) => {
        allCharts.push(ch);
      });
    }
    return allCharts;
  }
  /**
   * Get charts in the same "group" (excluding the instance which is called upon) to perform operations on the other charts of the same group (eg., tooltip hovering)
   */
  getGroupedCharts() {
    return Apex._chartInstances.filter((ch) => {
      if (ch.group) {
        return true;
      }
    }).map((ch) => this.w.config.chart.group === ch.group ? ch.chart : this);
  }
  static getChartByID(id) {
    const chartId = Utils$1.escapeString(id);
    if (!Apex._chartInstances) return void 0;
    const c = Apex._chartInstances.filter((ch) => ch.id === chartId)[0];
    return c && c.chart;
  }
  /**
   * Allows the user to provide data attrs in the element and the chart will render automatically when this method is called by searching for the elements containing 'data-apexcharts' attribute
   */
  static initOnLoad() {
    const els = document.querySelectorAll("[data-apexcharts]");
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      const options2 = JSON.parse(els[i].getAttribute("data-options"));
      const apexChart = new ApexCharts(el, options2);
      apexChart.render();
    }
  }
  /**
   * This static method allows users to call chart methods without necessarily from the
   * instance of the chart in case user has assigned chartID to the targeted chart.
   * The chartID is used for mapping the instance stored in Apex._chartInstances global variable
   *
   * This is helpful in cases when you don't have reference of the chart instance
   * easily and need to call the method from anywhere.
   * For eg, in React/Vue applications when you have many parent/child components,
   * and need easy reference to other charts for performing dynamic operations
   *
   * @param {string} chartID - The unique identifier which will be used to call methods
   * on that chart instance
   * @param {function} fn - The method name to call
   * @param {object} opts - The parameters which are accepted in the original method will be passed here in the same order.
   */
  static exec(chartID, fn, ...opts) {
    const chart = this.getChartByID(chartID);
    if (!chart) return;
    chart.w.globals.isExecCalled = true;
    let ret = null;
    if (chart.publicMethods.indexOf(fn) !== -1) {
      ret = chart[fn](...opts);
    }
    return ret;
  }
  static merge(target, source) {
    return Utils$1.extend(target, source);
  }
  static getThemePalettes() {
    return {
      palette1: ["#008FFB", "#00E396", "#FEB019", "#FF4560", "#775DD0"],
      palette2: ["#3F51B5", "#03A9F4", "#4CAF50", "#F9CE1D", "#FF9800"],
      palette3: ["#33B2DF", "#546E7A", "#D4526E", "#13D8AA", "#A5978B"],
      palette4: ["#4ECDC4", "#C7F464", "#81D4FA", "#FD6A6A", "#546E7A"],
      palette5: ["#2B908F", "#F9A3A4", "#90EE7E", "#FA4443", "#69D2E7"],
      palette6: ["#449DD1", "#F86624", "#EA3546", "#662E9B", "#C5D86D"],
      palette7: ["#D7263D", "#1B998B", "#2E294E", "#F46036", "#E2C044"],
      palette8: ["#662E9B", "#F86624", "#F9C80E", "#EA3546", "#43BCCD"],
      palette9: ["#5C4742", "#A5978B", "#8D5B4C", "#5A2A27", "#C4BBAF"],
      palette10: ["#A300D6", "#7D02EB", "#5653FE", "#2983FF", "#00B1F2"]
    };
  }
  toggleSeries(seriesName) {
    return this.series.toggleSeries(seriesName);
  }
  highlightSeriesOnLegendHover(e, targetElement) {
    return this.series.toggleSeriesOnHover(e, targetElement);
  }
  showSeries(seriesName) {
    this.series.showSeries(seriesName);
  }
  hideSeries(seriesName) {
    this.series.hideSeries(seriesName);
  }
  highlightSeries(seriesName) {
    this.series.highlightSeries(seriesName);
  }
  isSeriesHidden(seriesName) {
    this.series.isSeriesHidden(seriesName);
  }
  resetSeries(shouldUpdateChart = true, shouldResetZoom = true) {
    this.series.resetSeries(shouldUpdateChart, shouldResetZoom);
  }
  // Public method to add event listener on chart context
  addEventListener(name2, handler) {
    this.events.addEventListener(name2, handler);
  }
  // Public method to remove event listener on chart context
  removeEventListener(name2, handler) {
    this.events.removeEventListener(name2, handler);
  }
  addXaxisAnnotation(opts, pushToMemory = true, context = void 0) {
    let me = this;
    if (context) {
      me = context;
    }
    me.annotations.addXaxisAnnotationExternal(opts, pushToMemory, me);
  }
  addYaxisAnnotation(opts, pushToMemory = true, context = void 0) {
    let me = this;
    if (context) {
      me = context;
    }
    me.annotations.addYaxisAnnotationExternal(opts, pushToMemory, me);
  }
  addPointAnnotation(opts, pushToMemory = true, context = void 0) {
    let me = this;
    if (context) {
      me = context;
    }
    me.annotations.addPointAnnotationExternal(opts, pushToMemory, me);
  }
  clearAnnotations(context = void 0) {
    let me = this;
    if (context) {
      me = context;
    }
    me.annotations.clearAnnotations(me);
  }
  removeAnnotation(id, context = void 0) {
    let me = this;
    if (context) {
      me = context;
    }
    me.annotations.removeAnnotation(me, id);
  }
  getChartArea() {
    const el = this.w.globals.dom.baseEl.querySelector(".apexcharts-inner");
    return el;
  }
  getSeriesTotalXRange(minX, maxX) {
    return this.coreUtils.getSeriesTotalsXRange(minX, maxX);
  }
  getHighestValueInSeries(seriesIndex = 0) {
    const range = new Range(this.ctx);
    return range.getMinYMaxY(seriesIndex).highestY;
  }
  getLowestValueInSeries(seriesIndex = 0) {
    const range = new Range(this.ctx);
    return range.getMinYMaxY(seriesIndex).lowestY;
  }
  getSeriesTotal() {
    return this.w.globals.seriesTotals;
  }
  toggleDataPointSelection(seriesIndex, dataPointIndex) {
    return this.updateHelpers.toggleDataPointSelection(
      seriesIndex,
      dataPointIndex
    );
  }
  zoomX(min, max) {
    this.ctx.toolbar.zoomUpdateOptions(min, max);
  }
  setLocale(localeName) {
    this.localization.setCurrentLocaleValues(localeName);
  }
  dataURI(options2) {
    const exp = new Exports(this.ctx);
    return exp.dataURI(options2);
  }
  getSvgString(scale) {
    return new Exports(this.ctx).getSvgString(scale);
  }
  exportToCSV(options2 = {}) {
    const exp = new Exports(this.ctx);
    return exp.exportToCSV(options2);
  }
  paper() {
    return this.w.globals.dom.Paper;
  }
  _parentResizeCallback() {
    if (this.w.globals.animationEnded && this.w.config.chart.redrawOnParentResize) {
      this._windowResize();
    }
  }
  /**
   * Handle window resize and re-draw the whole chart.
   */
  _windowResize() {
    clearTimeout(this.w.globals.resizeTimer);
    this.w.globals.resizeTimer = window.setTimeout(() => {
      this.w.globals.resized = true;
      this.w.globals.dataChanged = false;
      this.ctx.update();
    }, 150);
  }
  _windowResizeHandler() {
    let { redrawOnWindowResize: redraw } = this.w.config.chart;
    if (typeof redraw === "function") {
      redraw = redraw();
    }
    redraw && this._windowResize();
  }
}
export {
  ApexCharts as default
};
