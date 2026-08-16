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
 * ApexCharts v6.9.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = _core.__apex_Utils;
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
  if (!name || typeof name !== "string") {
    console.warn(
      "ApexCharts: registerSeriesTransform requires a non-empty name."
    );
    return;
  }
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerSeriesTransform("${name}") expects a function (series, w) => series.`
    );
    return;
  }
  getTransforms()[name] = fn;
}
const ROW_SOURCE_KEY = "__apexcharts_row_sources__";
if (!/** @type {any} */
globalThis[ROW_SOURCE_KEY]) {
  globalThis[ROW_SOURCE_KEY] = {};
}
function getSources() {
  return (
    /** @type {any} */
    globalThis[ROW_SOURCE_KEY]
  );
}
function registerRowSource(name, fn) {
  if (!name || typeof name !== "string") {
    console.warn("ApexCharts: registerRowSource requires a non-empty name.");
    return;
  }
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerRowSource("${name}") expects a function (w, opts) => series.`
    );
    return;
  }
  getSources()[name] = fn;
}
const MAX_BINS = 1e3;
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
function widthForRule(sorted, span, rule) {
  const n = sorted.length;
  const byCount = (count) => span / Math.max(1, Math.ceil(count));
  switch (rule) {
    case "sqrt":
      return { width: byCount(Math.sqrt(n)), rule: "sqrt" };
    case "rice":
      return { width: byCount(2 * Math.cbrt(n)), rule: "rice" };
    case "scott": {
      const sd = stdDev(sorted);
      if (sd > 0) return { width: 3.49 * sd * Math.pow(n, -1 / 3), rule: "scott" };
      return { width: byCount(Math.log2(n) + 1), rule: "sturges" };
    }
    case "fd": {
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
      if (iqr > 0) return { width: 2 * iqr * Math.pow(n, -1 / 3), rule: "fd" };
      return { width: byCount(Math.log2(n) + 1), rule: "sturges" };
    }
    case "auto": {
      const sturges = byCount(Math.log2(n) + 1);
      const iqr = quantileSorted(sorted, 0.75) - quantileSorted(sorted, 0.25);
      if (iqr <= 0) return { width: sturges, rule: "sturges" };
      const fd = 2 * iqr * Math.pow(n, -1 / 3);
      return fd < sturges ? { width: fd, rule: "fd" } : { width: sturges, rule: "sturges" };
    }
    case "sturges":
    default:
      return { width: byCount(Math.log2(n) + 1), rule: "sturges" };
  }
}
function computeBinning(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  let lo = sorted[0];
  let hi = sorted[sorted.length - 1];
  const range = opts.range;
  if (Array.isArray(range) && range.length === 2) {
    const rLo = Number(range[0]);
    const rHi = Number(range[1]);
    if (isFinite(rLo) && isFinite(rHi) && rHi > rLo) {
      lo = rLo;
      hi = rHi;
    }
  }
  if (!(hi > lo)) {
    const pad = Math.abs(lo) > 0 ? Math.abs(lo) * 0.05 : 0.5;
    return {
      edges: [lo - pad, lo + pad],
      binWidth: pad * 2,
      rule: "single",
      capped: false
    };
  }
  const span = hi - lo;
  let width;
  let rule;
  if (typeof opts.binWidth === "number" && opts.binWidth > 0) {
    width = opts.binWidth;
    rule = "binWidth";
  } else if (typeof opts.bins === "number" && opts.bins >= 1) {
    width = span / Math.floor(opts.bins);
    rule = "count";
  } else {
    const chosen = widthForRule(
      sorted,
      span,
      typeof opts.bins === "string" ? opts.bins : "auto"
    );
    width = chosen.width;
    rule = chosen.rule;
  }
  if (!isFinite(width) || width <= 0) width = span;
  let count = Math.ceil(span / width);
  if (!isFinite(count) || count < 1) count = 1;
  let capped = false;
  if (count > MAX_BINS) {
    count = MAX_BINS;
    width = span / count;
    capped = true;
  }
  width = span / count;
  const edges = new Array(count + 1);
  for (let k = 0; k <= count; k++) edges[k] = lo + k * width;
  edges[count] = Math.max(edges[count], hi);
  return { edges, binWidth: width, rule, capped };
}
function binIndexOf(v, edges) {
  const last = edges.length - 1;
  if (!(v >= edges[0]) || v > edges[last]) return -1;
  if (v === edges[last]) return last - 1;
  const width = (edges[last] - edges[0]) / last;
  if (width > 0) {
    let k = Math.floor((v - edges[0]) / width);
    if (k < 0) k = 0;
    if (k > last - 1) k = last - 1;
    if (v < edges[k]) k--;
    else if (v >= edges[k + 1]) k++;
    if (k < 0 || k > last - 1) return -1;
    return k;
  }
  let lo = 0;
  let hi = last - 1;
  while (lo <= hi) {
    const mid = lo + hi >> 1;
    if (v < edges[mid]) hi = mid - 1;
    else if (v >= edges[mid + 1]) lo = mid + 1;
    else return mid;
  }
  return -1;
}
function binCounts(values, edges) {
  const counts = new Array(Math.max(0, edges.length - 1)).fill(0);
  for (let i = 0; i < values.length; i++) {
    const k = binIndexOf(values[i], edges);
    if (k >= 0) counts[k]++;
  }
  return counts;
}
function rowsByBin(values, edges) {
  const n = Math.max(0, edges.length - 1);
  const buckets = new Array(n);
  for (let k = 0; k < n; k++) buckets[k] = [];
  for (let i = 0; i < values.length; i++) {
    const k = binIndexOf(values[i], edges);
    if (k >= 0) buckets[k].push(values[i]);
  }
  return buckets;
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
function normalizeCounts(counts, opts = {}) {
  let out = counts.slice();
  if (opts.cumulative) {
    let acc = 0;
    out = out.map((c) => acc += c);
  }
  const total = counts.reduce((a, b) => a + b, 0);
  if (total <= 0) return out;
  if (opts.normalize === "relative") {
    return out.map((c) => c / total * 100);
  }
  if (opts.normalize === "density") {
    const w = opts.binWidth;
    if (typeof w === "number" && w > 0) return out.map((c) => c / (total * w));
  }
  return out;
}
function histogramValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    let raw = d;
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1];
    else if (d && typeof d === "object") raw = d.y !== void 0 ? d.y : d.x;
    const v = Utils.parseNumber(raw);
    if (v !== null && isFinite(v)) out.push(v);
  }
  return out;
}
function histogramTransform(ser, w) {
  var _a;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.histogramRawSeries) {
    gl.histogramRawSeries = ser.map((s) => __spreadProps(__spreadValues({}, s), {
      data: Array.isArray(s == null ? void 0 : s.data) ? s.data.slice() : s == null ? void 0 : s.data
    }));
  }
  const raw = gl.histogramRawSeries;
  const hcfg = ((_a = cnf.plotOptions) == null ? void 0 : _a.histogram) || {};
  const perSeries = raw.map((s) => histogramValues(s == null ? void 0 : s.data));
  let all = [];
  if (perSeries.length === 1) {
    all = perSeries[0];
  } else {
    for (const vals of perSeries) all = all.concat(vals);
  }
  const binning = computeBinning(all, {
    bins: hcfg.bins,
    binWidth: hcfg.binWidth,
    range: hcfg.range
  });
  if (!binning) {
    w.histogramData = {
      edges: [],
      binWidth: 0,
      counts: [],
      rule: "",
      capped: false
    };
    return raw;
  }
  const { edges, binWidth } = binning;
  const counts = perSeries.map(
    (vals) => binCounts(vals, edges)
  );
  w.histogramData = {
    edges,
    binWidth,
    counts,
    rule: binning.rule,
    capped: binning.capped
  };
  const collapsed = gl.collapsedSeriesIndices || [];
  return raw.map((s, i) => {
    if (collapsed.indexOf(i) !== -1) return __spreadProps(__spreadValues({}, s), { data: [] });
    const ys = normalizeCounts(counts[i], {
      normalize: hcfg.normalize,
      cumulative: hcfg.cumulative,
      binWidth
    });
    const data = [];
    for (let k = 0; k < ys.length; k++) {
      data.push({ x: (edges[k] + edges[k + 1]) / 2, y: ys[k] });
    }
    return __spreadProps(__spreadValues({}, s), { data });
  });
}
const derivedData = /* @__PURE__ */ new WeakSet();
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
function boxPlotTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const whiskers = ((_b = (_a = w.config.plotOptions) == null ? void 0 : _a.boxPlot) == null ? void 0 : _b.whiskers) || "minmax";
  return ser.map((s) => {
    if (!Array.isArray(s == null ? void 0 : s.data)) return s;
    let touched = false;
    const data = s.data.map((d) => {
      if (Array.isArray(d == null ? void 0 : d.y) && d.y.length === 5 && !derivedData.has(d)) {
        return d;
      }
      const values = observationsOf(d, false);
      if (!values) return d;
      const summary = fiveNumberSummary(values, { whiskers });
      if (!summary) return d;
      touched = true;
      const next = __spreadProps(__spreadValues({}, d), { y: summary.summary, points: values });
      derivedData.add(next);
      return next;
    });
    return touched ? __spreadProps(__spreadValues({}, s), { data }) : s;
  });
}
function violinTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const kde = ((_b = (_a = w.config.plotOptions) == null ? void 0 : _a.violin) == null ? void 0 : _b.kde) || {};
  return ser.map((s) => {
    if (!Array.isArray(s == null ? void 0 : s.data)) return s;
    let touched = false;
    const data = s.data.map((d) => {
      var _a2;
      if (Array.isArray((_a2 = d == null ? void 0 : d.y) == null ? void 0 : _a2.density) && d.y.density.length && !derivedData.has(d)) {
        return d;
      }
      const values = observationsOf(d, true);
      if (!values) return d;
      const est = kernelDensity(values, {
        bandwidth: kde.bandwidth,
        resolution: kde.resolution
      });
      if (!est) return d;
      touched = true;
      const next = __spreadProps(__spreadValues({}, d), { y: { density: est.density, points: values } });
      derivedData.add(next);
      return next;
    });
    return touched ? __spreadProps(__spreadValues({}, s), { data }) : s;
  });
}
const DEFAULT_MAX_ROWS = 3e3;
function thinClusters(clusters, maxRows) {
  let total = 0;
  let widest = 0;
  for (const c of clusters) {
    total += c.length;
    if (c.length > widest) widest = c.length;
  }
  if (total <= maxRows) return { clusters, stride: 1, total, kept: total };
  const keptAt = (s) => {
    let n = 0;
    for (const c of clusters) n += Math.ceil(c.length / s);
    return n;
  };
  let stride = Math.max(2, Math.ceil(total / maxRows));
  while (stride < widest && keptAt(stride) > maxRows) stride++;
  let kept = 0;
  const out = clusters.map((rows) => {
    const keepList = [];
    for (let i = 0; i < rows.length; i += stride) keepList.push(rows[i]);
    kept += keepList.length;
    return keepList;
  });
  return { clusters: out, stride, total, kept };
}
function toUnitSeries(w, clusters, opts) {
  const maxRows = opts && opts.maxRows != null ? opts.maxRows : DEFAULT_MAX_ROWS;
  const thinned = thinClusters(
    clusters.map((c) => c.rows),
    maxRows
  );
  if (thinned.stride > 1) {
    console.warn(
      `ApexCharts: rowSeries() thinned ${thinned.total} rows to ${thinned.kept} (every ${thinned.stride}${thinned.stride === 2 ? "nd" : thinned.stride === 3 ? "rd" : "th"} row) to stay under maxRows=${maxRows}. Raise maxRows to draw more.`
    );
  }
  const colors = w.globals && w.globals.colors || [];
  return clusters.map((c, i) => {
    const fillColor = colors[c.realIndex] || colors[0];
    return {
      name: c.name,
      data: thinned.clusters[i].map((v, q) => __spreadValues({
        id: `${c.realIndex}:${i}:${q}`,
        x: c.name,
        y: v
      }, fillColor ? { fillColor } : {}))
    };
  });
}
function histogramRows(w, opts) {
  const gl = w.globals;
  const hd = w.histogramData;
  const raw = gl && gl.histogramRawSeries;
  if (!hd || !Array.isArray(hd.edges) || hd.edges.length < 2) return null;
  if (!Array.isArray(raw) || !raw.length) return null;
  const collapsed = gl && gl.collapsedSeriesIndices || [];
  const edges = hd.edges;
  const clusters = [];
  raw.forEach((s, i) => {
    var _a;
    if (collapsed.indexOf(i) !== -1) return;
    const buckets = rowsByBin(histogramValues(s && s.data), edges);
    const seriesName = w.seriesData && ((_a = w.seriesData.seriesNames) == null ? void 0 : _a[i]) || (s == null ? void 0 : s.name);
    buckets.forEach((rows, k) => {
      const range = `${formatEdge(edges[k])}-${formatEdge(edges[k + 1])}`;
      clusters.push({
        // Only qualify by series when there is more than one to tell apart.
        name: raw.length > 1 && seriesName ? `${seriesName} ${range}` : range,
        realIndex: i,
        rows
      });
    });
  });
  return clusters.length ? toUnitSeries(w, clusters, opts) : null;
}
function formatEdge(v) {
  if (!isFinite(v)) return String(v);
  const r = Math.round(v);
  return Math.abs(v - r) < 1e-6 ? String(r) : String(Number(v.toFixed(2)));
}
function pointsRowSource(pick) {
  return (w, opts) => {
    var _a;
    const perSeries = pick(w);
    if (!Array.isArray(perSeries) || !perSeries.length) return null;
    const collapsed = w.globals && w.globals.collapsedSeriesIndices || [];
    const labels = w.globals && (((_a = w.globals.categoryLabels) == null ? void 0 : _a.length) ? w.globals.categoryLabels : w.globals.labels) || [];
    const clusters = [];
    perSeries.forEach((byCat, i) => {
      var _a2;
      if (collapsed.indexOf(i) !== -1) return;
      if (!Array.isArray(byCat)) return;
      const seriesName = w.seriesData && ((_a2 = w.seriesData.seriesNames) == null ? void 0 : _a2[i]);
      byCat.forEach((pts, j) => {
        const label = labels[j] != null ? String(labels[j]) : `#${j + 1}`;
        clusters.push({
          name: perSeries.length > 1 && seriesName ? `${seriesName} ${label}` : label,
          realIndex: i,
          rows: Array.isArray(pts) ? pts.slice() : []
        });
      });
    });
    return clusters.length ? toUnitSeries(w, clusters, opts) : null;
  };
}
const boxPlotRows = pointsRowSource((w) => {
  var _a;
  return (_a = w.candleData) == null ? void 0 : _a.seriesBoxPoints;
});
const violinRows = pointsRowSource((w) => {
  var _a;
  return (_a = w.violinData) == null ? void 0 : _a.seriesViolinPoints;
});
registerSeriesTransform("histogram", histogramTransform);
registerSeriesTransform("boxPlot", boxPlotTransform);
registerSeriesTransform("violin", violinTransform);
registerRowSource("histogram", histogramRows);
registerRowSource("boxPlot", boxPlotRows);
registerRowSource("violin", violinRows);
export {
  boxPlotRows,
  boxPlotTransform,
  default2 as default,
  histogramRows,
  histogramTransform,
  violinRows,
  violinTransform
};
