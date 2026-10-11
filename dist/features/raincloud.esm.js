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
 * ApexCharts v8.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
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
const Utils = _core.__apex_Utils;
function A(e, t) {
  const s = e.length;
  if (0 === s) return NaN;
  if (1 === s) return e[0];
  const i = (s - 1) * t, n = Math.floor(i), r = Math.ceil(i);
  return n === r ? e[n] : e[n] + (e[r] - e[n]) * (i - n);
}
function stdDev(values) {
  const n = values.length;
  if (n < 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += values[i];
  const mean = sum / n;
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const d = values[i] - mean;
    acc += d * d;
  }
  return Math.sqrt(acc / n);
}
function fiveNumberSummary(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const q1 = A(sorted, 0.25);
  const median = A(sorted, 0.5);
  const q3 = A(sorted, 0.75);
  const iqr = q3 - q1;
  let lo = sorted[0];
  let hi = sorted[sorted.length - 1];
  let outliers = [];
  if (opts.whiskers === "tukey" && iqr > 0) {
    const loFence = q1 - 1.5 * iqr;
    const hiFence = q3 + 1.5 * iqr;
    let i = 0;
    while (i < sorted.length && sorted[i] < loFence) i++;
    let j = sorted.length - 1;
    while (j >= 0 && sorted[j] > hiFence) j--;
    if (i <= j) {
      lo = sorted[i];
      hi = sorted[j];
      outliers = sorted.slice(0, i).concat(sorted.slice(j + 1));
    }
  }
  return { summary: [lo, q1, median, q3, hi], outliers, iqr };
}
function kernelDensity(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const n = sorted.length;
  let h = opts.bandwidth;
  if (!(typeof h === "number" && h > 0)) {
    const sd = stdDev(sorted);
    const iqr = A(sorted, 0.75) - A(sorted, 0.25);
    const spread = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd;
    h = 0.9 * spread * Math.pow(n, -1 / 5);
  }
  if (!isFinite(h) || h <= 0) {
    const v = sorted[0];
    const eps = Math.abs(v) > 0 ? Math.abs(v) * 1e-3 : 1e-3;
    return {
      density: [
        [v - eps, 0],
        [v, 1],
        [v + eps, 0]
      ],
      bandwidth: eps
    };
  }
  const steps = Math.max(8, Math.floor(opts.resolution || 64));
  const lo = sorted[0] - 2 * h;
  const hi = sorted[n - 1] + 2 * h;
  const step = (hi - lo) / (steps - 1);
  const norm = 1 / (n * h * Math.sqrt(2 * Math.PI));
  const density = [];
  for (let g = 0; g < steps; g++) {
    const x = lo + g * step;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const z = (x - sorted[i]) / h;
      sum += Math.exp(-0.5 * z * z);
    }
    density.push([x, sum * norm]);
  }
  return { density, bandwidth: h };
}
function observationsOf(d, allowFlatY) {
  var _a;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  let raw = null;
  if (Array.isArray(d.points)) raw = d.points;
  else if (Array.isArray((_a = d.y) == null ? void 0 : _a.points)) raw = d.y.points;
  else if (Array.isArray(d.y) && typeof d.y[0] === "number") {
    raw = d.y;
  }
  if (!raw) return null;
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    const v = Utils.parseNumber(raw[i]);
    if (v !== null && isFinite(v)) out.push(v);
  }
  return out.length ? out : null;
}
function derivedStats(w, kind) {
  var _a, _b;
  const all = (_a = w.statsDerived) != null ? _a : w.statsDerived = {};
  return (_b = all[kind]) != null ? _b : all[kind] = /* @__PURE__ */ new Map();
}
function isDerived(derived, key, value) {
  const ours = derived.get(key);
  if (!ours || !Array.isArray(value) || ours.length !== value.length) {
    return false;
  }
  for (let k = 0; k < value.length; k++) {
    const a = ours[k];
    const b = value[k];
    if (a === b) continue;
    if (!Array.isArray(a) || !Array.isArray(b) || a[0] !== b[0] || a[1] !== b[1]) {
      return false;
    }
  }
  return true;
}
function raincloudTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const violinCfg = ((_a = w.config.plotOptions) == null ? void 0 : _a.violin) || {};
  const kde = violinCfg.kde || {};
  const whiskers = ((_b = violinCfg.box) == null ? void 0 : _b.whiskers) || "minmax";
  const ourDensity = derivedStats(w, "raincloudDensity");
  const ourSummary = derivedStats(w, "raincloudSummary");
  return ser.map((s, i) => {
    if (!Array.isArray(s == null ? void 0 : s.data) || s.type && s.type !== "raincloud" && s.type !== "violin") {
      return s;
    }
    let touched = false;
    const data = s.data.map((d, j) => {
      const key = i + ":" + j;
      const y = (d == null ? void 0 : d.y) && typeof d.y === "object" && !Array.isArray(d.y) ? d.y : {};
      const needDensity = !Array.isArray(y.density) || !y.density.length || isDerived(ourDensity, key, y.density);
      const needSummary = !Array.isArray(y.summary) || y.summary.length !== 5 || isDerived(ourSummary, key, y.summary);
      if (!needDensity && !needSummary) return d;
      const values = observationsOf(d);
      if (!values) return d;
      const out = __spreadValues({}, y);
      if (needDensity) {
        const est = kernelDensity(values, {
          bandwidth: kde.bandwidth,
          resolution: kde.resolution
        });
        if (!est) return d;
        out.density = est.density;
        out.points = values;
        ourDensity.set(key, est.density);
      }
      if (needSummary) {
        const est = fiveNumberSummary(values, { whiskers });
        if (est) {
          out.summary = est.summary;
          ourSummary.set(key, est.summary);
        }
      }
      touched = true;
      return __spreadProps(__spreadValues({}, d), { y: out });
    });
    return touched ? __spreadProps(__spreadValues({}, s), { data }) : s;
  });
}
registerSeriesTransform("raincloud", raincloudTransform);
export {
  default2 as default,
  raincloudTransform
};
