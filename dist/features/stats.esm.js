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
 * ApexCharts v8.0.0
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
const M = 1e3;
function A(e, t) {
  const s = e.length;
  if (0 === s) return NaN;
  if (1 === s) return e[0];
  const i = (s - 1) * t, n = Math.floor(i), r = Math.ceil(i);
  return n === r ? e[n] : e[n] + (e[r] - e[n]) * (i - n);
}
function x(e, t, s) {
  const i = e.length, n = (e2) => t / Math.max(1, Math.ceil(e2)), r = () => n(Math.log2(i) + 1);
  switch (s) {
    case "sqrt":
      return { width: n(Math.sqrt(i)), rule: "sqrt" };
    case "rice":
      return { width: n(2 * Math.cbrt(i)), rule: "rice" };
    case "scott": {
      const t2 = (function(e2) {
        const t3 = e2.length;
        if (t3 < 2) return 0;
        let s2 = 0;
        for (let i3 = 0; i3 < t3; i3++) s2 += e2[i3];
        const i2 = s2 / t3;
        let n2 = 0;
        for (let s3 = 0; s3 < t3; s3++) {
          const t4 = e2[s3] - i2;
          n2 += t4 * t4;
        }
        return Math.sqrt(n2 / t3);
      })(e);
      return t2 > 0 ? { width: 3.49 * t2 * Math.pow(i, -1 / 3), rule: "scott" } : { width: r(), rule: "sturges" };
    }
    case "fd": {
      const t2 = A(e, 0.75) - A(e, 0.25);
      return t2 > 0 ? { width: 2 * t2 * Math.pow(i, -1 / 3), rule: "fd" } : { width: r(), rule: "sturges" };
    }
    case "auto": {
      const t2 = r(), s2 = A(e, 0.75) - A(e, 0.25);
      if (s2 <= 0) return { width: t2, rule: "sturges" };
      const n2 = 2 * s2 * Math.pow(i, -1 / 3);
      return n2 < t2 ? { width: n2, rule: "fd" } : { width: t2, rule: "sturges" };
    }
    default:
      return { width: r(), rule: "sturges" };
  }
}
function S(e, t = {}) {
  if (!Array.isArray(e) || 0 === e.length) return null;
  const s = e.slice().sort(((e2, t2) => e2 - t2));
  let i = s[0], n = s[s.length - 1];
  const r = t.range;
  if (Array.isArray(r) && 2 === r.length) {
    const e2 = Number(r[0]), t2 = Number(r[1]);
    Number.isFinite(e2) && Number.isFinite(t2) && t2 > e2 && (i = e2, n = t2);
  }
  if (!(n > i)) {
    const e2 = Math.abs(i) > 0 ? 0.05 * Math.abs(i) : 0.5;
    return { edges: [i - e2, i + e2], binWidth: 2 * e2, rule: "single", capped: false };
  }
  const a = n - i;
  let l, o;
  if ("number" == typeof t.binWidth && t.binWidth > 0) l = t.binWidth, o = "binWidth";
  else if ("number" == typeof t.bins && t.bins >= 1) l = a / Math.floor(t.bins), o = "count";
  else {
    const e2 = x(s, a, "string" == typeof t.bins ? t.bins : "auto");
    l = e2.width, o = e2.rule;
  }
  (!Number.isFinite(l) || l <= 0) && (l = a);
  let c = Math.ceil(a / l);
  (!Number.isFinite(c) || c < 1) && (c = 1);
  let u = false;
  c > M && (c = M, u = true), l = a / c;
  const h = new Array(c + 1);
  for (let e2 = 0; e2 <= c; e2++) h[e2] = i + e2 * l;
  return h[c] = Math.max(h[c], n), { edges: h, binWidth: l, rule: o, capped: u };
}
function k(e, t) {
  const s = t.length - 1;
  if (!(e >= t[0]) || e > t[s]) return -1;
  if (e === t[s]) return s - 1;
  const i = (t[s] - t[0]) / s;
  if (i > 0) {
    let n2 = Math.floor((e - t[0]) / i);
    return n2 < 0 && (n2 = 0), n2 > s - 1 && (n2 = s - 1), e < t[n2] ? n2-- : e >= t[n2 + 1] && n2++, n2 < 0 || n2 > s - 1 ? -1 : n2;
  }
  let n = 0, r = s - 1;
  for (; n <= r; ) {
    const s2 = n + r >> 1;
    if (e < t[s2]) r = s2 - 1;
    else {
      if (!(e >= t[s2 + 1])) return s2;
      n = s2 + 1;
    }
  }
  return -1;
}
function L(e, t) {
  const s = new Array(Math.max(0, t.length - 1)).fill(0);
  for (let i = 0; i < e.length; i++) {
    const n = k(e[i], t);
    n >= 0 && s[n]++;
  }
  return s;
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
function rowsByBin(values, edges) {
  const n = Math.max(0, edges.length - 1);
  const buckets = new Array(n);
  for (let k2 = 0; k2 < n; k2++) buckets[k2] = [];
  for (let i = 0; i < values.length; i++) {
    const k$1 = k(values[i], edges);
    if (k$1 >= 0) buckets[k$1].push(values[i]);
  }
  return buckets;
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
    const x2 = lo + g * step;
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const z = (x2 - sorted[i]) / h;
      sum += Math.exp(-0.5 * z * z);
    }
    density.push([x2, sum * norm]);
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
  const binning = S(all, {
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
    (vals) => L(vals, edges)
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
    for (let k2 = 0; k2 < ys.length; k2++) {
      data.push({ x: (edges[k2] + edges[k2 + 1]) / 2, y: ys[k2] });
    }
    return __spreadProps(__spreadValues({}, s), { data });
  });
}
const derivedData = /* @__PURE__ */ new WeakSet();
function boxPlotTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const whiskers = ((_b = (_a = w.config.plotOptions) == null ? void 0 : _a.boxPlot) == null ? void 0 : _b.whiskers) || "minmax";
  return ser.map((s) => {
    if (!Array.isArray(s == null ? void 0 : s.data) || s.type && s.type !== "boxPlot") return s;
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
    if (!Array.isArray(s == null ? void 0 : s.data) || s.type && s.type !== "violin") return s;
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
      const rest = d.y && typeof d.y === "object" && !Array.isArray(d.y) ? d.y : {};
      const next = __spreadProps(__spreadValues({}, d), {
        y: __spreadProps(__spreadValues({}, rest), { density: est.density, points: values })
      });
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
    buckets.forEach((rows, k2) => {
      const range = `${formatEdge(edges[k2])}-${formatEdge(edges[k2 + 1])}`;
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
