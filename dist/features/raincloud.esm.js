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
function quantileSorted(sorted, q) {
  const n = sorted.length;
  if (n === 0) return NaN;
  if (n === 1) return sorted[0];
  const pos = (n - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
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
  const q1 = quantileSorted(sorted, 0.25);
  const median = quantileSorted(sorted, 0.5);
  const q3 = quantileSorted(sorted, 0.75);
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
    const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
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
  else if (allowFlatY && Array.isArray(d.y) && typeof d.y[0] === "number") {
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
const derivedData = /* @__PURE__ */ new WeakSet();
const derivedSummaryOnly = /* @__PURE__ */ new WeakSet();
function raincloudTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const violinCfg = ((_a = w.config.plotOptions) == null ? void 0 : _a.violin) || {};
  const kde = violinCfg.kde || {};
  const whiskers = ((_b = violinCfg.box) == null ? void 0 : _b.whiskers) || "minmax";
  return ser.map((s) => {
    if (!Array.isArray(s == null ? void 0 : s.data)) return s;
    let touched = false;
    const data = s.data.map((d) => {
      var _a2, _b2;
      const hasDensity = Array.isArray((_a2 = d == null ? void 0 : d.y) == null ? void 0 : _a2.density) && d.y.density.length > 0;
      const hasSummary = Array.isArray((_b2 = d == null ? void 0 : d.y) == null ? void 0 : _b2.summary) && d.y.summary.length === 5;
      if (hasDensity && !derivedData.has(d)) {
        if (hasSummary && !derivedSummaryOnly.has(d)) return d;
        const values2 = observationsOf(d, false);
        if (!values2) return d;
        const summary2 = fiveNumberSummary(values2, { whiskers });
        if (!summary2) return d;
        touched = true;
        const next2 = __spreadProps(__spreadValues({}, d), { y: __spreadProps(__spreadValues({}, d.y), { summary: summary2.summary }) });
        derivedSummaryOnly.add(next2);
        return next2;
      }
      const values = observationsOf(d, true);
      if (!values) return d;
      const est = kernelDensity(values, {
        bandwidth: kde.bandwidth,
        resolution: kde.resolution
      });
      if (!est) return d;
      const summary = fiveNumberSummary(values, { whiskers });
      touched = true;
      const next = __spreadProps(__spreadValues({}, d), {
        y: __spreadValues({
          density: est.density,
          points: values
        }, summary ? { summary: summary.summary } : {})
      });
      derivedData.add(next);
      return next;
    });
    return touched ? __spreadProps(__spreadValues({}, s), { data }) : s;
  });
}
registerSeriesTransform("raincloud", raincloudTransform);
export {
  default2 as default,
  raincloudTransform
};
