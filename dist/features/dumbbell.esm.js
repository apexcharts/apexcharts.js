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
 * ApexCharts v7.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = _core.__apex_Utils;
function readDatum(d, j, categories) {
  const fallbackX = categories && categories[j] !== void 0 ? categories[j] : j + 1;
  if (d == null) return { x: fallbackX, y: null, rest: {} };
  if (Array.isArray(d)) {
    return { x: d[0] !== void 0 ? d[0] : fallbackX, y: d[1], rest: {} };
  }
  if (typeof d === "object") {
    return { x: d.x !== void 0 ? d.x : fallbackX, y: d.y, rest: d };
  }
  return { x: fallbackX, y: d, rest: {} };
}
function isPairShaped(data) {
  for (let j = 0; j < data.length; j++) {
    const d = data[j];
    const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
    if (Array.isArray(y) && y.length === 2) return true;
  }
  return false;
}
function joinOnX(raw, categories) {
  var _a;
  const xs = [];
  const rows = [];
  const seen = /* @__PURE__ */ new Map();
  const byX = [];
  for (let i = 0; i < raw.length; i++) {
    const data = Array.isArray((_a = raw[i]) == null ? void 0 : _a.data) ? raw[i].data : [];
    const map = /* @__PURE__ */ new Map();
    for (let j = 0; j < data.length; j++) {
      const { x, y, rest } = readDatum(data[j], j, categories);
      const key = x instanceof Date ? x.getTime() : x;
      if (!seen.has(key)) {
        seen.set(key, xs.length);
        xs.push(x);
        rows.push(__spreadValues({}, rest));
      }
      const rowIndex = (
        /** @type {number} */
        seen.get(key)
      );
      map.set(rowIndex, Utils.parseNumber(y));
    }
    byX.push(map);
  }
  return { xs, rows, byX };
}
function dumbbellTransform(ser, w) {
  var _a;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.dumbbellRawSeries) {
    gl.dumbbellRawSeries = ser.map((s) => __spreadProps(__spreadValues({}, s), {
      data: Array.isArray(s == null ? void 0 : s.data) ? s.data.slice() : s == null ? void 0 : s.data
    }));
  }
  const raw = gl.dumbbellRawSeries;
  const alreadyPaired = raw.some(
    (s) => isPairShaped(Array.isArray(s == null ? void 0 : s.data) ? s.data : [])
  );
  if (alreadyPaired) {
    w.dumbbellData = {
      form: "pairs",
      names: [],
      values: [],
      order: [],
      carrier: 0,
      hidden: []
    };
    return ser;
  }
  const categories = (_a = cnf.xaxis) == null ? void 0 : _a.categories;
  const collapsed = gl.collapsedSeriesIndices || [];
  const { xs, rows, byX } = joinOnX(raw, categories);
  const values = [];
  const order = [];
  const visible = [];
  for (let k = 0; k < raw.length; k++) {
    if (collapsed.indexOf(k) === -1) visible.push(k);
  }
  const data = [];
  for (let j = 0; j < xs.length; j++) {
    const rowValues = [];
    for (let k = 0; k < raw.length; k++) {
      const v = byX[k].has(j) ? byX[k].get(j) : null;
      rowValues.push(
        v === null || v === void 0 || !isFinite(v) ? null : v
      );
    }
    values.push(rowValues);
    let lo = null;
    let hi = null;
    let kLo = -1;
    let kHi = -1;
    for (let vi = 0; vi < visible.length; vi++) {
      const k = visible[vi];
      const v = rowValues[k];
      if (v === null) continue;
      if (lo === null || v < lo) {
        lo = v;
        kLo = k;
      }
      if (hi === null || v > hi) {
        hi = v;
        kHi = k;
      }
    }
    if (lo === null || hi === null) {
      order.push(null);
      data.push(__spreadProps(__spreadValues({}, rows[j]), { x: xs[j], y: null }));
      continue;
    }
    order.push([kLo, kHi]);
    data.push(__spreadProps(__spreadValues({}, rows[j]), { x: xs[j], y: [lo, hi] }));
  }
  w.dumbbellData = {
    form: "series",
    names: raw.map(
      (s, k) => {
        var _a2;
        return (_a2 = s == null ? void 0 : s.name) != null ? _a2 : `Series ${k + 1}`;
      }
    ),
    values,
    order,
    carrier: visible.length ? visible[0] : 0,
    hidden: raw.map((_, k) => k).filter((k) => collapsed.indexOf(k) !== -1)
  };
  const carrier = w.dumbbellData.carrier;
  return raw.map((s, k) => __spreadProps(__spreadValues({}, s), {
    // Every endpoint stays a series so the legend keeps its name, its colour
    // and its click. Only one of them carries the merged rows: drawing the
    // same rows N times would stack N identical connectors.
    data: k === carrier && visible.length ? data : []
  }));
}
const TRANSFORM_KEY = "__apexcharts_series_transforms__";
if (!/** @type {any} */
globalThis[TRANSFORM_KEY]) {
  globalThis[TRANSFORM_KEY] = {};
}
function getTransforms() {
  return (
    /** @type {any} */
    globalThis[TRANSFORM_KEY]
  );
}
function registerSeriesTransform(name, fn) {
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerSeriesTransform("${name}") expects a function (series, w) => series.`
    );
    return;
  }
  getTransforms()[name] = fn;
}
registerSeriesTransform("dumbbell", dumbbellTransform);
export {
  default2 as default,
  dumbbellTransform
};
