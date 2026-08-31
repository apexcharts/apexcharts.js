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
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve2, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve2(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v7.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = _core.__apex_Utils;
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const addResizeListener = _core.__apex_Resize_addResizeListener;
const removeResizeListener = _core.__apex_Resize_removeResizeListener;
class SvgRenderer {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.kind = "svg";
  }
  // ── lifecycle (SVG builds its layer via the existing plotChartType flow) ──
  beginSeries() {
  }
  present() {
    return null;
  }
  clear() {
  }
  // ── emit primitives (delegate to Graphics: the canvas renderer mirrors
  //    this exact surface) ──
  /** @param {any} attrs */
  group(attrs) {
    return this.ctx.graphics.group(attrs);
  }
  /** @param {any} opts */
  drawPath(opts) {
    return this.ctx.graphics.drawPath(opts);
  }
  /** @param {any[]} args */
  drawLine(...args) {
    return this.ctx.graphics.drawLine(...args);
  }
  /** @param {any[]} args */
  drawRect(...args) {
    return this.ctx.graphics.drawRect(...args);
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r, attrs) {
    return this.ctx.graphics.drawCircle(r, attrs);
  }
  /** @param {any} opts */
  drawText(opts) {
    return this.ctx.graphics.drawText(opts);
  }
  /**
   * A series mark path (animation-aware). Faithful passthrough to Graphics.
   * Note: the SVG emit path in the per-type draw() methods routes through
   * `seriesEmitter`, which returns the caller's own `Graphics` in SVG mode: so
   * this method is the interface contract surface (mirrored by the canvas
   * renderer), not the hot path.
   * @param {any} opts
   */
  renderPaths(opts) {
    return this.ctx.graphics.renderPaths(opts);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts = {}) {
    return this.ctx.graphics.drawMarker(x, y, opts);
  }
  // ── capabilities: SVG supports everything the interface enumerates ──
  /** @param {string} _feature */
  supports(_feature) {
    return true;
  }
  // ── interaction: the DOM does this natively in SVG mode ──
  hitTest() {
    return null;
  }
  restyle() {
  }
  // ── export: SVG serializes directly; no bitmap to composite ──
  toBitmap() {
    return null;
  }
  destroy() {
  }
}
const OK_FILTER_TYPES = ["none", "lighten", "darken"];
function computeMarkCount(w) {
  const series = w.config.series || [];
  const type = w.config.chart.type;
  const scatterish = type === "scatter" || type === "bubble";
  const markerSize = w.config.markers && w.config.markers.size;
  const markersOn = Array.isArray(markerSize) ? markerSize.some((s) => s > 0) : (markerSize || 0) > 0;
  const labelsOn = !!(w.config.dataLabels && w.config.dataLabels.enabled);
  const isHeatmap = type === "heatmap";
  let total = 0;
  let maxLen = 0;
  series.forEach((s) => {
    const n = Array.isArray(s.data) ? s.data.length : 0;
    if (n > maxLen) maxLen = n;
    if (scatterish || markersOn || isHeatmap) total += n;
    if (labelsOn) total += n;
  });
  const LARGE_D = 5e4;
  if (maxLen >= LARGE_D) total = Math.max(total, maxLen);
  return total;
}
function hasCanvasUnsupportedFeature(w) {
  var _a, _b;
  const fillType = w.config.fill && w.config.fill.type;
  const isUnsupportedFill = (t) => t === "pattern" || t === "image" || t === "gradient";
  if (Array.isArray(fillType) ? fillType.some(isUnsupportedFill) : isUnsupportedFill(fillType)) {
    return true;
  }
  const lineColors = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.line) == null ? void 0 : _b.colors;
  if (lineColors && lineColors.colorAboveThreshold && lineColors.colorBelowThreshold) {
    return true;
  }
  const states = w.config.states || {};
  const hoverFilter = states.hover && states.hover.filter && states.hover.filter.type;
  const activeFilter = states.active && states.active.filter && states.active.filter.type;
  if (hoverFilter && !OK_FILTER_TYPES.includes(hoverFilter)) return true;
  if (activeFilter && !OK_FILTER_TYPES.includes(activeFilter)) return true;
  return false;
}
const RENDERER_REGISTRY_KEY = "__apexcharts_renderers__";
function getRendererRegistry() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[RENDERER_REGISTRY_KEY]) g[RENDERER_REGISTRY_KEY] = /* @__PURE__ */ new Map();
  return g[RENDERER_REGISTRY_KEY];
}
class RendererController {
  /** Same Map as getRendererRegistry(); exposed for tests/tooling. */
  static get _rendererRegistry() {
    return getRendererRegistry();
  }
  /**
   * @param {string} kind
   * @param {(w: any, ctx: any) => any} factory
   */
  static registerRenderer(kind, factory) {
    getRendererRegistry().set(kind, factory);
  }
  /**
   * Remove a registered renderer backend (tests / hot-reload). Charts fall
   * back to SVG on their next resolve().
   * @param {string} kind
   */
  static unregisterRenderer(kind) {
    getRendererRegistry().delete(kind);
  }
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.svg = new SvgRenderer(w, ctx);
    this.active = this.svg;
    this._activeKind = "svg";
    this._instances = {};
  }
  /**
   * The kind selection WANTS (before availability/fallback). Pure.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  _desiredKind() {
    const cfg = this.w.config.chart;
    const mode = cfg.renderer || "svg";
    if (!Environment.isBrowser()) return "svg";
    if (mode === "svg") return "svg";
    if (hasCanvasUnsupportedFeature(this.w)) return "svg";
    if (mode === "canvas") return "canvas";
    const marks = computeMarkCount(this.w);
    const threshold = cfg.rendererThreshold || 8e3;
    return marks >= threshold ? "canvas" : "svg";
  }
  /**
   * Resolve + instantiate the active renderer and set `ctx.renderer`. Falls
   * back to SVG (with a warning only when canvas was explicitly requested) if
   * the desired backend is not registered.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  resolve() {
    const mode = this.w.config.chart.renderer || "svg";
    const desired = this._desiredKind();
    if (desired !== "svg") {
      const factory = getRendererRegistry().get(desired);
      if (factory) {
        if (!this._instances[desired]) {
          this._instances[desired] = factory(this.w, this.ctx);
        }
        this.active = this._instances[desired];
        this._activeKind = desired;
        this.ctx.renderer = this.active;
        this.w.globals.activeRenderer = this.active;
        return this._activeKind;
      }
      if (mode === desired) {
        console.warn(
          `[apexcharts] renderer:"${desired}" requested but that renderer is not in the default bundle. Bundler: import 'apexcharts/features/renderer-${desired}'. Script tag: add <script src=".../dist/features/renderer-${desired}.js"> after apexcharts.js. Falling back to SVG.`
        );
      }
    } else if (mode === "canvas" && hasCanvasUnsupportedFeature(this.w)) {
      console.warn(
        `[apexcharts] renderer:"canvas" requested but this chart uses a feature the canvas renderer does not render yet (gradient/pattern/image fill or a state color-matrix filter); falling back to SVG.`
      );
    }
    this.active = this.svg;
    this._activeKind = "svg";
    this.ctx.renderer = this.active;
    this.w.globals.activeRenderer = this.active;
    return this._activeKind;
  }
  /** @returns {import('../renderers/Renderer').RendererKind} */
  getActiveKind() {
    return this._activeKind;
  }
  /** Destroy the owned non-SVG renderer instances (full chart destroy). */
  teardown() {
    for (const kind in this._instances) {
      const r = this._instances[kind];
      if (r && typeof r.destroy === "function") r.destroy();
    }
    this._instances = {};
    this.active = this.svg;
    this._activeKind = "svg";
  }
}
function detectForm(data) {
  if (!Array.isArray(data) || data.length === 0) return "empty";
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    if (d === null || d === void 0) continue;
    if (Array.isArray(d)) return "paired";
    if (typeof d === "object") return "object";
    return "plain";
  }
  return "empty";
}
function xKeyOf(d, form) {
  if (d === null || d === void 0) return void 0;
  if (form === "paired") {
    const x = d[0];
    return x instanceof Date ? x.getTime() : x;
  }
  if (form === "object") {
    const x = d.x;
    return x instanceof Date ? x.getTime() : x;
  }
  return void 0;
}
function placeholderFor(x, form) {
  if (form === "paired") return [x, null];
  if (form === "object") return { x, y: null };
  return null;
}
function keyOf(s, i, by) {
  const raw = typeof by === "function" ? by(s, i) : s ? s[by] : void 0;
  if (raw === void 0 || raw === null || raw === "") return null;
  return String(raw);
}
function orderKeys(keys, order) {
  if (!order || order === "first-seen") return keys.slice();
  if (order === "asc" || order === "desc") {
    const sorted = keys.slice().sort((a, b) => {
      const na = Number(a);
      const nb = Number(b);
      if (isFinite(na) && isFinite(nb)) return na - nb;
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return order === "desc" ? sorted.reverse() : sorted;
  }
  if (Array.isArray(order)) {
    const explicit = order.map(String).filter((k) => keys.indexOf(k) !== -1);
    const rest = keys.filter((k) => explicit.indexOf(k) === -1);
    return explicit.concat(rest);
  }
  if (typeof order === "function") return keys.slice().sort(order);
  return keys.slice();
}
function collectUnion(contributing, warnings) {
  const unionX = [];
  const seen = /* @__PURE__ */ new Set();
  let sawKeyed = false;
  let sawPlain = false;
  let plainMaxLen = 0;
  let xForm = "plain";
  contributing.forEach((s) => {
    const form = detectForm(s && s.data);
    if (form === "empty") return;
    if (form === "plain") {
      sawPlain = true;
      plainMaxLen = Math.max(plainMaxLen, s.data.length);
      return;
    }
    sawKeyed = true;
    xForm = form;
    s.data.forEach((d) => {
      const x = xKeyOf(d, form);
      if (x === void 0) return;
      const id = typeof x + ":" + String(x);
      if (!seen.has(id)) {
        seen.add(id);
        unionX.push(x);
      }
    });
  });
  if (sawKeyed && sawPlain) {
    warnings.push(
      "trellis: mixing x-keyed data ([x,y] / {x,y}) with plain value arrays; plain series are padded by position, not by x"
    );
  }
  const xIsNumeric = sawKeyed && unionX.every((x) => typeof x === "number" && isFinite(x));
  if (xIsNumeric) unionX.sort((a, b) => Number(a) - Number(b));
  return { unionX, sawKeyed, plainMaxLen, xForm, xIsNumeric };
}
function makeAligner(u, warnings) {
  const seriesNames = [];
  const nameSeen = /* @__PURE__ */ new Set();
  let globalIdx = 0;
  const align = (s) => {
    const form = detectForm(s && s.data);
    const name = s && s.name != null ? String(s.name) : `series-${globalIdx + 1}`;
    globalIdx++;
    if (!nameSeen.has(name)) {
      nameSeen.add(name);
      seriesNames.push(name);
    }
    const out = __spreadProps(__spreadValues({}, s), { name });
    if (form === "plain" || form === "empty") {
      const targetLen = u.sawKeyed ? u.unionX.length : u.plainMaxLen;
      const data = Array.isArray(s.data) ? s.data.slice(0, targetLen) : [];
      while (data.length < targetLen) data.push(null);
      out.data = data;
      return out;
    }
    const map = /* @__PURE__ */ new Map();
    s.data.forEach((d) => {
      const x = xKeyOf(d, form);
      if (x !== void 0 && !map.has(x)) map.set(x, d);
      else if (x !== void 0 && map.has(x)) {
        warnings.push(
          `trellis: duplicate x "${String(x)}" in series "${name}"; keeping the first`
        );
      }
    });
    out.data = u.unionX.map(
      (x) => map.has(x) ? map.get(x) : placeholderFor(x, form)
    );
    return out;
  };
  return { align, seriesNames };
}
function placeholderSeries(splitResult, opts = {}) {
  const form = splitResult.xForm;
  const zeroByType = {
    bar: 0,
    column: 0,
    rangeBar: [0, 0],
    candlestick: [0, 0, 0, 0],
    boxPlot: [0, 0, 0, 0, 0]
  };
  const fill = opts.chartType && opts.chartType in zeroByType ? zeroByType[opts.chartType] : null;
  const datum = (x) => {
    if (fill === null) return placeholderFor(x, form);
    const y = Array.isArray(fill) ? fill.slice() : fill;
    return form === "object" ? { x, y } : [x, y];
  };
  const data = form === "plain" ? splitResult.unionX.map(() => fill) : splitResult.unionX.map(datum);
  return { name: opts.name || splitResult.seriesNames[0] || "series-1", data };
}
function split(series, cfg = {}) {
  const warnings = [];
  const list = Array.isArray(series) ? series : [];
  if (cfg.row || cfg.column) {
    if (cfg.by) {
      warnings.push(
        "trellis: `by` is ignored when `row`/`column` are set (they are mutually exclusive)"
      );
    }
    return split2d(list, cfg, warnings);
  }
  const by = cfg.by || "facet";
  const byKey = /* @__PURE__ */ new Map();
  const repeated = [];
  list.forEach((s, i) => {
    const k = keyOf(s, i, by);
    if (k === null) repeated.push(s);
    else {
      if (!byKey.has(k)) byKey.set(k, []);
      const arr = byKey.get(k);
      if (arr) arr.push(s);
    }
  });
  if (byKey.size === 0) {
    return emptyResult([
      "trellis: no series carries the facet key; nothing to split"
    ]);
  }
  let keys = orderKeys(Array.from(byKey.keys()), cfg.order);
  let dropped = 0;
  if (typeof cfg.limit === "number" && cfg.limit > 0 && keys.length > cfg.limit) {
    dropped = keys.length - cfg.limit;
    keys = keys.slice(0, cfg.limit);
  }
  const contributing = keys.reduce((acc, k) => acc.concat(byKey.get(k) || []), []).concat(repeated);
  const u = collectUnion(contributing, warnings);
  const { align, seriesNames } = makeAligner(u, warnings);
  const panels = keys.map((key) => {
    const own = (byKey.get(key) || []).map(align);
    const rep = repeated.map(align);
    const slice = own.concat(rep);
    return {
      key,
      rowKey: null,
      colKey: null,
      series: slice,
      seriesNames: slice.map((s) => s.name),
      empty: slice.length === 0
    };
  });
  return {
    mode: (
      /** @type {'1d'} */
      "1d"
    ),
    panels,
    rowKeys: null,
    colKeys: null,
    seriesNames,
    xForm: u.sawKeyed ? u.xForm : "plain",
    unionX: u.sawKeyed ? u.unionX : Array.from({ length: u.plainMaxLen }, (_, i) => i),
    xIsNumeric: u.xIsNumeric,
    dropped,
    warnings
  };
}
function emptyResult(warnings) {
  return {
    mode: "1d",
    panels: [],
    rowKeys: null,
    colKeys: null,
    seriesNames: [],
    xForm: "plain",
    unionX: [],
    xIsNumeric: false,
    dropped: 0,
    warnings
  };
}
function split2d(list, cfg, warnings) {
  const rowBy = cfg.row;
  const colBy = cfg.column;
  const cells = /* @__PURE__ */ new Map();
  const rowRepeats = /* @__PURE__ */ new Map();
  const colRepeats = /* @__PURE__ */ new Map();
  const repeated = [];
  const rowSeen = [];
  const colSeen = [];
  const note = (arr, k) => {
    if (arr.indexOf(k) === -1) arr.push(k);
  };
  list.forEach((s, i) => {
    var _a, _b;
    const rk = rowBy ? keyOf(s, i, rowBy) : "";
    const ck = colBy ? keyOf(s, i, colBy) : "";
    if (rk === null && ck === null) {
      repeated.push(s);
      return;
    }
    if (rk === null) {
      note(
        colSeen,
        /** @type {string} */
        ck
      );
      if (!colRepeats.has(
        /** @type {string} */
        ck
      )) {
        colRepeats.set(
          /** @type {string} */
          ck,
          []
        );
      }
      (_a = colRepeats.get(
        /** @type {string} */
        ck
      )) == null ? void 0 : _a.push(s);
      return;
    }
    if (ck === null) {
      note(rowSeen, rk);
      if (!rowRepeats.has(rk)) rowRepeats.set(rk, []);
      (_b = rowRepeats.get(rk)) == null ? void 0 : _b.push(s);
      return;
    }
    note(rowSeen, rk);
    note(colSeen, ck);
    let cols = cells.get(rk);
    if (!cols) {
      cols = /* @__PURE__ */ new Map();
      cells.set(rk, cols);
    }
    let arr = cols.get(ck);
    if (!arr) {
      arr = [];
      cols.set(ck, arr);
    }
    arr.push(s);
  });
  if (!rowSeen.length && !colSeen.length) {
    return emptyResult([
      "trellis: no series carries the row/column facet keys; nothing to split"
    ]);
  }
  if (typeof cfg.limit === "number" && cfg.limit > 0) {
    warnings.push("trellis: `limit` is not applied to a 2-D grid; ignoring it");
  }
  const rowKeys = orderKeys(rowSeen.length ? rowSeen : [""], cfg.order);
  const colKeys = orderKeys(colSeen.length ? colSeen : [""], cfg.order);
  const u = collectUnion(list, warnings);
  const { align, seriesNames } = makeAligner(u, warnings);
  const panels = [];
  rowKeys.forEach((rk) => {
    colKeys.forEach((ck) => {
      var _a;
      const own = ((_a = cells.get(rk)) == null ? void 0 : _a.get(ck)) || [];
      const slice = own.concat(rowRepeats.get(rk) || []).concat(colRepeats.get(ck) || []).concat(repeated).map(align);
      panels.push({
        key: [rk, ck].filter((k) => k !== "").join(" / ") || "all",
        rowKey: rk,
        colKey: ck,
        series: slice,
        seriesNames: slice.map((s) => s.name),
        empty: slice.length === 0
      });
    });
  });
  return {
    mode: (
      /** @type {'2d'} */
      "2d"
    ),
    panels,
    rowKeys,
    colKeys,
    seriesNames,
    xForm: u.sawKeyed ? u.xForm : "plain",
    unionX: u.sawKeyed ? u.unionX : Array.from({ length: u.plainMaxLen }, (_, i) => i),
    xIsNumeric: u.xIsNumeric,
    dropped: 0,
    warnings
  };
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
const VALUELESS_Y = ["heatmap", "pie", "donut", "polarArea", "radialBar"];
const PIE_FAMILY = ["pie", "donut", "polarArea"];
function observationValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    let raw = d;
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1];
    else if (d && typeof d === "object") raw = d.y !== void 0 ? d.y : d.x;
    const v = Number(raw);
    if (raw !== null && raw !== void 0 && isFinite(v)) out.push(v);
  }
  return out;
}
function rawObservationArrays(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  data.forEach((d) => {
    const y = d && typeof d === "object" ? d.y : null;
    if (!Array.isArray(y)) return;
    y.forEach((v) => {
      const n = Number(v);
      if (v !== null && v !== void 0 && isFinite(n)) out.push(n);
    });
  });
  return out;
}
function zValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  data.forEach((d) => {
    let raw = null;
    if (Array.isArray(d) && d.length > 2) raw = d[2];
    else if (d && typeof d === "object") raw = d.z;
    const n = Number(raw);
    if (raw !== null && raw !== void 0 && isFinite(n)) out.push(n);
  });
  return out;
}
function buildTypeFrames(splitResult, cfg, hostConfig, chartType) {
  var _a, _b, _c, _d, _e, _f;
  const frames = {
    plotOptions: null,
    yExtentOverride: null,
    skipYaxisPush: VALUELESS_Y.includes(chartType),
    forceSharedY: false,
    pieScaleOf: null,
    warnings: []
  };
  const panels = splitResult.panels;
  const plot = (hostConfig == null ? void 0 : hostConfig.plotOptions) || {};
  if (chartType === "histogram") {
    const hcfg = plot.histogram || {};
    let union = [];
    const panelSeriesVals = panels.map(
      (p) => p.series.map((s) => {
        const vals = observationValues(s.data);
        union = union.concat(vals);
        return vals;
      })
    );
    const binning = computeBinning(union, {
      bins: hcfg.bins,
      binWidth: hcfg.binWidth,
      range: hcfg.range
    });
    if (binning && binning.edges.length > 1) {
      const edges = binning.edges;
      frames.plotOptions = {
        histogram: {
          range: [edges[0], edges[edges.length - 1]],
          binWidth: binning.binWidth
        }
      };
      let maxY = 0;
      panelSeriesVals.forEach(
        (seriesVals) => seriesVals.forEach((vals) => {
          if (!vals.length) return;
          const ys = normalizeCounts(binCounts(vals, edges), {
            normalize: hcfg.normalize,
            cumulative: hcfg.cumulative,
            binWidth: binning.binWidth
          });
          ys.forEach((v) => {
            if (isFinite(v) && v > maxY) maxY = v;
          });
        })
      );
      if (maxY > 0) frames.yExtentOverride = { min: 0, max: maxY };
      const yMode = ((_a = cfg.scales) == null ? void 0 : _a.y) || "shared";
      if (yMode === "independent-row" || yMode === "independent-column") {
        frames.forceSharedY = true;
        frames.warnings.push(
          "histogram trellis: group y scales would re-derive counts per group; using scales.y 'shared' (use 'independent' for per-panel count scales)."
        );
      }
    }
  }
  if (chartType === "violin") {
    const kde = ((_b = plot.violin) == null ? void 0 : _b.kde) || {};
    if (!(typeof kde.bandwidth === "number" && kde.bandwidth > 0)) {
      let union = [];
      panels.forEach(
        (p) => p.series.forEach((s) => {
          union = union.concat(rawObservationArrays(s.data));
        })
      );
      const est = union.length ? kernelDensity(union, { resolution: 8 }) : null;
      if (est && isFinite(est.bandwidth) && est.bandwidth > 0) {
        frames.plotOptions = {
          violin: { kde: { bandwidth: est.bandwidth } }
        };
      }
    }
  }
  if (chartType === "heatmap") {
    if (((_c = cfg.scales) == null ? void 0 : _c.color) === "independent") {
      frames.warnings.push(
        "a heatmap trellis must share its color scale (the same color meaning different values per panel is a silent lie); ignoring scales.color 'independent'."
      );
    }
    const userRanges = (_e = (_d = plot.heatmap) == null ? void 0 : _d.colorScale) == null ? void 0 : _e.ranges;
    if (!(Array.isArray(userRanges) && userRanges.length > 0)) {
      let min = Infinity;
      let max = -Infinity;
      panels.forEach(
        (p) => p.series.forEach((s) => {
          observationValues(s.data).forEach((v) => {
            if (v < min) min = v;
            if (v > max) max = v;
          });
        })
      );
      if (isFinite(min) && isFinite(max)) {
        frames.plotOptions = {
          heatmap: { colorScale: { min, max } }
        };
      }
    }
  }
  if (chartType === "bubble") {
    if (((_f = cfg.scales) == null ? void 0 : _f.size) === "independent") {
      frames.warnings.push(
        "a bubble trellis must share its size scale; ignoring scales.size 'independent'."
      );
    }
    let minZ = Infinity;
    let maxZ = -Infinity;
    panels.forEach(
      (p) => p.series.forEach((s) => {
        zValues(s.data).forEach((v) => {
          if (v < minZ) minZ = v;
          if (v > maxZ) maxZ = v;
        });
      })
    );
    if (isFinite(minZ) && isFinite(maxZ)) {
      frames.plotOptions = {
        bubble: { minZ, maxZ }
      };
    }
  }
  if (PIE_FAMILY.includes(chartType) && cfg.radiusByTotal) {
    const totals = /* @__PURE__ */ new Map();
    let maxTotal = 0;
    panels.forEach((p) => {
      let total = 0;
      p.series.forEach((s) => {
        observationValues(s.data).forEach((v) => {
          total += Math.abs(v);
        });
      });
      totals.set(p.key, total);
      if (total > maxTotal) maxTotal = total;
    });
    if (maxTotal > 0) {
      frames.pieScaleOf = (key) => {
        const total = totals.get(key);
        if (typeof total !== "number" || total <= 0) return null;
        return Math.sqrt(total / maxTotal);
      };
    }
  }
  return frames;
}
function pivotRows(rows, spec = {}) {
  const warnings = [];
  const by = spec.by;
  if (typeof by !== "string" || !by) {
    return {
      series: [],
      warnings: [
        "trellis: tidy-row input (trellis.data) needs a string `by` column name"
      ]
    };
  }
  const xKey = spec.x;
  const yKey = spec.y;
  if (!xKey || !yKey) {
    return {
      series: [],
      warnings: [
        "trellis: tidy-row input (trellis.data) needs `x` and `y` column names"
      ]
    };
  }
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    return { series: [], warnings: ["trellis: trellis.data is empty"] };
  }
  const seriesBy = spec.seriesBy;
  let skipped = 0;
  let dupes = 0;
  const acc = /* @__PURE__ */ new Map();
  list.forEach((row) => {
    if (!row || typeof row !== "object") {
      skipped++;
      return;
    }
    const facet = row[by];
    const x = row[xKey];
    if (facet === void 0 || facet === null || x === void 0 || x === null) {
      skipped++;
      return;
    }
    const name = seriesBy && row[seriesBy] !== void 0 && row[seriesBy] !== null ? String(row[seriesBy]) : String(yKey);
    let byName = acc.get(String(facet));
    if (!byName) {
      byName = /* @__PURE__ */ new Map();
      acc.set(String(facet), byName);
    }
    let data = byName.get(name);
    if (!data) {
      data = /* @__PURE__ */ new Map();
      byName.set(name, data);
    }
    const xk = x instanceof Date ? x.getTime() : x;
    if (data.has(xk)) dupes++;
    const y = row[yKey];
    data.set(xk, y === void 0 ? null : y);
  });
  if (skipped) {
    warnings.push(
      `trellis: ${skipped} row(s) missing "${by}" or "${xKey}" were skipped`
    );
  }
  if (dupes) {
    warnings.push(
      `trellis: ${dupes} duplicate (panel, series, x) row(s); kept the last. Aggregate the rows first if you want sums or means.`
    );
  }
  const series = [];
  acc.forEach((byName, facet) => {
    byName.forEach((data, name) => {
      series.push({
        name,
        [by]: facet,
        data: Array.from(data, ([x, y]) => ({ x, y }))
      });
    });
  });
  return { series, warnings };
}
const getThemePalettes = _core.__apex_ThemePalettes_getThemePalettes;
const DEFAULT_TARGET_TICKS = 3;
function niceBounds(min, max, targetTicks = DEFAULT_TARGET_TICKS) {
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1, tickAmount: 1 };
  }
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
    min -= pad;
    max += pad;
  }
  const target = Math.max(1, targetTicks);
  const rawStep = (max - min) / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norms = mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  let best = { dist: Infinity, ticks: 0, min: 0, max: 1 };
  norms.forEach((n) => {
    const step = n * mag;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks = Math.max(1, Math.round((hi - lo) / step));
    const dist = Math.abs(ticks - target);
    if (dist < best.dist || dist === best.dist && ticks < best.ticks) {
      best = { dist, ticks, min: lo, max: hi };
    }
  });
  return { min: best.min, max: best.max, tickAmount: best.ticks };
}
function extendByDatum(d, form, ext) {
  if (d === null || d === void 0) return;
  let y = d;
  if (form === "paired") y = d[1];
  else if (form === "object") y = d.y;
  if (y === null || y === void 0) return;
  if (Array.isArray(y)) {
    for (let i = 0; i < y.length; i++) {
      const v2 = Number(y[i]);
      if (isFinite(v2)) {
        if (v2 < ext.min) ext.min = v2;
        if (v2 > ext.max) ext.max = v2;
      }
    }
    return;
  }
  const v = Number(y);
  if (isFinite(v)) {
    if (v < ext.min) ext.min = v;
    if (v > ext.max) ext.max = v;
  }
}
function decimalCount(v) {
  if (typeof v !== "number" || !isFinite(v) || v % 1 === 0) return 0;
  const s = String(v);
  if (s.indexOf("e") !== -1 || s.indexOf("E") !== -1) return 4;
  return Math.min(4, (s.split(".")[1] || "").length);
}
function maxYDecimals(panels) {
  let max = 0;
  const count = (v) => {
    const d = decimalCount(v);
    if (d > max) max = d;
  };
  panels.forEach(
    (p) => p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return;
      s.data.forEach((d) => {
        if (d === null || d === void 0) return;
        let y = d;
        if (Array.isArray(d)) y = d[1];
        else if (typeof d === "object") y = d.y;
        if (Array.isArray(y)) y.forEach(count);
        else count(y);
      });
    })
  );
  return max;
}
function yExtent(panels, xForm) {
  const ext = { min: Infinity, max: -Infinity };
  panels.forEach(
    (p) => p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return;
      s.data.forEach((d) => extendByDatum(d, xForm, ext));
    })
  );
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null;
  return ext;
}
function yExtentInWindow(panels, xForm, xMin, xMax) {
  const ext = { min: Infinity, max: -Infinity };
  panels.forEach(
    (p) => p.series.forEach((s) => {
      if (!Array.isArray(s.data)) return;
      s.data.forEach((d) => {
        if (d === null || d === void 0) return;
        const rawX = xForm === "paired" ? d[0] : xForm === "object" ? d.x : null;
        const x = rawX instanceof Date ? rawX.getTime() : Number(rawX);
        if (!isFinite(x) || x < xMin || x > xMax) return;
        extendByDatum(d, xForm, ext);
      });
    })
  );
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null;
  return ext;
}
function resolve(splitResult, cfg = {}, host = {}) {
  const scales = cfg.scales || {};
  const xMode = scales.x || "shared";
  const yMode = scales.y || "shared";
  let x = null;
  if (xMode === "shared" && splitResult.xIsNumeric && splitResult.unionX.length) {
    const xs = (
      /** @type {number[]} */
      splitResult.unionX
    );
    x = { min: xs[0], max: xs[xs.length - 1] };
  }
  const barFamily = ["bar", "column", "histogram"].includes(host.chartType || "");
  const toBounds = (ext) => {
    if (!ext) return null;
    if (barFamily && ext.min > 0) ext.min = 0;
    return niceBounds(ext.min, ext.max, cfg.targetTicks || DEFAULT_TARGET_TICKS);
  };
  let y = null;
  if (yMode === "shared") {
    y = toBounds(host.yExtentOverride || yExtent(splitResult.panels, splitResult.xForm));
  }
  let rowY = null;
  if (yMode === "independent-row") {
    rowY = /* @__PURE__ */ new Map();
    const groups = /* @__PURE__ */ new Map();
    splitResult.panels.forEach((p) => {
      var _a;
      const k = (_a = p.rowKey) != null ? _a : "";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    });
    groups.forEach((panels, k) => {
      const b = toBounds(yExtent(panels, splitResult.xForm));
      if (b) rowY == null ? void 0 : rowY.set(k, b);
    });
  }
  let colY = null;
  if (yMode === "independent-column") {
    colY = /* @__PURE__ */ new Map();
    const groups = /* @__PURE__ */ new Map();
    splitResult.panels.forEach((p) => {
      var _a;
      const k = (_a = p.colKey) != null ? _a : "";
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push(p);
    });
    groups.forEach((panels, k) => {
      const b = toBounds(yExtent(panels, splitResult.xForm));
      if (b) colY == null ? void 0 : colY.set(k, b);
    });
  }
  const palettes = getThemePalettes();
  const fallback = palettes.palette1;
  const userColors = Array.isArray(host.userColors) ? host.userColors.filter((c) => typeof c === "string") : [];
  const palette = userColors.length ? userColors : fallback;
  const names = splitResult.seriesNames;
  const colorOf = (name) => {
    const idx = names.indexOf(name);
    return palette[(idx === -1 ? 0 : idx) % palette.length];
  };
  return { x, y, rowY, colY, colorOf, palette };
}
function lastRowFor(c, panelCount, cols, rows) {
  const inLastRow = panelCount - (rows - 1) * cols;
  return c < inLastRow ? rows - 1 : rows - 2;
}
function resolveColumns(containerWidth, panelCount, cfg = {}) {
  var _a, _b;
  const gap = (_a = cfg.gap) != null ? _a : 12;
  if (typeof cfg.columns === "number" && cfg.columns > 0) {
    return Math.max(1, Math.min(Math.floor(cfg.columns), panelCount));
  }
  const minW = (_b = cfg.minPanelWidth) != null ? _b : 220;
  const fit = Math.floor((containerWidth + gap) / (minW + gap));
  return Math.max(1, Math.min(fit, panelCount));
}
function compute({ panelCount, containerWidth, cfg, hostHeight }) {
  var _a, _b;
  const gap = (_a = cfg.gap) != null ? _a : 12;
  const cols = resolveColumns(containerWidth, panelCount, cfg);
  const rows = Math.max(1, Math.ceil(panelCount / cols));
  const headerShown = !cfg.header || cfg.header.show !== false;
  const headerH = headerShown ? 22 : 0;
  const panelW = Math.max(0, (containerWidth - gap * (cols - 1)) / cols);
  let panelH;
  if (typeof cfg.panelHeight === "number" && cfg.panelHeight > 0) {
    panelH = cfg.panelHeight;
  } else if (typeof hostHeight === "number" && hostHeight > 0) {
    panelH = (hostHeight - rows * headerH - gap * (rows - 1)) / rows;
  } else {
    panelH = panelW / ((_b = cfg.aspectRatio) != null ? _b : 1.6);
  }
  panelH = Math.max(80, Math.round(panelH));
  const labelsMode = cfg.axes && cfg.axes.labels || "edges";
  const scales = cfg.scales || {};
  const single = cols === 1;
  const cells = Array.from({ length: panelCount }, (_, i) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    let showXLabels;
    let showYLabels;
    if (labelsMode === "none") {
      showXLabels = false;
      showYLabels = false;
    } else if (labelsMode === "all" || single) {
      showXLabels = true;
      showYLabels = true;
    } else {
      showXLabels = scales.x === "independent" || r === lastRowFor(c, panelCount, cols, rows);
      showYLabels = scales.y === "independent" || scales.y === "independent-column" || c === 0;
    }
    return { i, r, c, showXLabels, showYLabels };
  });
  return { cols, rows, panelW, panelH, headerH, gap, cells };
}
const Series = _core.__apex_Series;
const DEFAULT_DIVERGING = ["#cf4d3f", "#8f9499", "#26a75b"];
const lerp = (a, b, t) => a + (b - a) * t;
function toHexPair(n) {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, "0");
}
function mixColors(c1, c2, t) {
  const a = Utils.parseHex(normalizeHex(c1));
  const b = Utils.parseHex(normalizeHex(c2));
  if (!a || !b) return c1;
  return "#" + toHexPair(lerp(a[0], b[0], t)) + toHexPair(lerp(a[1], b[1], t)) + toHexPair(lerp(a[2], b[2], t));
}
function normalizeHex(c) {
  if (typeof c !== "string") return "#000000";
  if (Utils.isColorHex(c)) return c;
  const asHex = Utils.rgb2hex(c);
  return asHex || "#000000";
}
function colorValueOf(w, i, j) {
  const series = (
    /** @type {any} */
    w.config.series[i]
  );
  const datum = series && Array.isArray(series.data) ? series.data[j] : null;
  return colorValueOfDatum(w, datum, i, j);
}
function colorValueOfDatum(w, datum, i, j) {
  var _a, _b, _c;
  if (!datum || typeof datum !== "object") return null;
  const accessor = (_c = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.treemap) == null ? void 0 : _b.colorScale) == null ? void 0 : _c.colorValue;
  let raw;
  if (typeof accessor === "function") {
    raw = accessor(datum, { seriesIndex: i, dataPointIndex: j, w });
  } else if (typeof accessor === "string") {
    raw = datum[accessor];
  } else {
    raw = datum.colorValue;
  }
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function resolveStops(cfg, min, max, midpoint) {
  if (Array.isArray(cfg.stops) && cfg.stops.length >= 2) {
    return cfg.stops.filter((s) => s && Number.isFinite(Number(s.value))).map((s) => ({
      value: Number(s.value),
      color: normalizeHex(s.color)
    })).sort(
      (a, b) => a.value - b.value
    );
  }
  const colors = (Array.isArray(cfg.colors) && cfg.colors.length >= 2 ? cfg.colors : DEFAULT_DIVERGING).map(normalizeHex);
  const n = colors.length;
  if (midpoint != null && n >= 3) {
    const mid = Math.floor((n - 1) / 2);
    const out = [];
    for (let k = 0; k <= mid; k++) {
      out.push({ value: lerp(min, midpoint, k / mid), color: colors[k] });
    }
    for (let k = mid + 1; k < n; k++) {
      out.push({
        value: lerp(midpoint, max, (k - mid) / (n - 1 - mid)),
        color: colors[k]
      });
    }
    return out;
  }
  return colors.map((c, k) => ({
    value: lerp(min, max, k / (n - 1)),
    color: c
  }));
}
function buildContinuousScale(w) {
  var _a, _b, _c;
  const cs = (_c = (_b = (_a = w.config) == null ? void 0 : _a.plotOptions) == null ? void 0 : _b.treemap) == null ? void 0 : _c.colorScale;
  const cfg = cs && cs.gradient;
  if (!cfg) return null;
  if (cfg.enabled === false) return null;
  const series = (
    /** @type {any} */
    w.config.series || []
  );
  let dataMin = Infinity;
  let dataMax = -Infinity;
  let found = false;
  for (let i = 0; i < series.length; i++) {
    const data = series[i] && series[i].data;
    if (!Array.isArray(data)) continue;
    for (let j = 0; j < data.length; j++) {
      const v = colorValueOfDatum(w, data[j], i, j);
      if (v == null) continue;
      found = true;
      if (v < dataMin) dataMin = v;
      if (v > dataMax) dataMax = v;
    }
  }
  if (!found && cfg.enabled !== true) return null;
  if (!Number.isFinite(dataMin)) {
    dataMin = 0;
    dataMax = 0;
  }
  let min = Number.isFinite(Number(cfg.min)) ? Number(cfg.min) : dataMin;
  let max = Number.isFinite(Number(cfg.max)) ? Number(cfg.max) : dataMax;
  let midpoint = null;
  if (cfg.midpoint === null) {
    midpoint = null;
  } else if (Number.isFinite(Number(cfg.midpoint))) {
    midpoint = Number(cfg.midpoint);
  } else if (min < 0 && max > 0) {
    midpoint = 0;
  }
  if (midpoint != null && cfg.symmetric !== false && !Number.isFinite(Number(cfg.min)) && !Number.isFinite(Number(cfg.max))) {
    const reach = Math.max(Math.abs(min - midpoint), Math.abs(max - midpoint));
    min = midpoint - reach;
    max = midpoint + reach;
  }
  if (max === min) {
    min -= 0.5;
    max += 0.5;
  }
  const stops = resolveStops(cfg, min, max, midpoint);
  if (stops.length < 2) return null;
  const at = (v) => {
    if (!Number.isFinite(v)) return stops[Math.floor(stops.length / 2)].color;
    if (v <= stops[0].value) return stops[0].color;
    const last = stops[stops.length - 1];
    if (v >= last.value) return last.color;
    for (let k = 1; k < stops.length; k++) {
      const hi = stops[k];
      if (v <= hi.value) {
        const lo = stops[k - 1];
        const span2 = hi.value - lo.value;
        const t = span2 === 0 ? 0 : (v - lo.value) / span2;
        return mixColors(lo.color, hi.color, t);
      }
    }
    return last.color;
  };
  const span = max - min;
  const legendStops = stops.map((s) => ({
    percent: span === 0 ? 0 : (s.value - min) / span,
    color: s.color
  }));
  return { min, max, midpoint, stops, at, legendStops };
}
const SVG_NS = "http://www.w3.org/2000/svg";
class HeatmapGradientLegend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.svgEl = null;
    this.arrowEl = null;
    this.hoverValueEl = null;
    this._min = 0;
    this._max = 0;
    this._geom = null;
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    this._targetEl = null;
    this._onCellEnter = this._onCellEnter.bind(this);
    this._onCellLeave = this._onCellLeave.bind(this);
    this._onBandEnter = this._onBandEnter.bind(this);
    this._onBandLeave = this._onBandLeave.bind(this);
  }
  /** Default value formatter for min/max labels and the hover tooltip. */
  _getFormatter() {
    const cfg = this._cfg();
    if (typeof cfg.formatter === "function") return cfg.formatter;
    return (v) => {
      if (!Number.isFinite(v)) return String(v);
      const abs = Math.abs(v);
      if (abs >= 1e3) return v.toFixed(0);
      if (abs >= 10) return v.toFixed(1);
      return v.toFixed(2);
    };
  }
  /**
   * The colorScale of whichever chart type is being drawn. Every chart type
   * that encodes a value as colour carries the same `colorScale` shape, so one
   * strip serves them all rather than a near-copy per type.
   * @param {any} w
   */
  static colorScaleOf(w) {
    var _a, _b, _c, _d, _e;
    const type = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    if (!type) return null;
    return ((_e = (_d = (_c = w == null ? void 0 : w.config) == null ? void 0 : _c.plotOptions) == null ? void 0 : _d[type]) == null ? void 0 : _e.colorScale) || null;
  }
  /**
   * @param {any} w
   */
  static configFor(w) {
    const cs = HeatmapGradientLegend.colorScaleOf(w);
    return cs && cs.gradientLegend || null;
  }
  /** This instance's gradient-legend config. */
  _cfg() {
    return HeatmapGradientLegend.configFor(this.w) || {};
  }
  /**
   * True when the user has opted into the gradient legend variant.
   * @param {any} w
   */
  static isEnabled(w) {
    if (!HeatmapGradientLegend.supports(w)) return false;
    const cfg = HeatmapGradientLegend.configFor(w);
    return !!(cfg && cfg.enabled);
  }
  /**
   * Chart types this legend can serve: those that encode a value as colour
   * through a `colorScale`. Everything else gets the categorical legend.
   * @param {any} w
   */
  static supports(w) {
    var _a, _b;
    const type = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    return type === "heatmap" || type === "treemap";
  }
  /**
   * Build the gradient legend DOM into `elLegendWrap`.
   * Caller is responsible for clearing the wrap first.
   * @param {HTMLElement|null} [targetEl] detached mode: draw into this
   *   element instead (a trellis's shared legend slot); the host owns layout,
   *   so all plot-relative positioning is skipped.
   */
  draw(targetEl = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    this._targetEl = targetEl;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      targetEl || w.dom.elLegendWrap
    );
    if (!elLegendWrap) return;
    const cfg = this._cfg();
    const position = w.config.legend.position;
    const isVertical = position === "left" || position === "right";
    const arrowSize = (_b = (_a = cfg.arrow) == null ? void 0 : _a.size) != null ? _b : 8;
    const arrowGutter = arrowSize + 4;
    const labelPadAlongStrip = cfg.showLabels ? 28 : 4;
    const labelPadAcrossStrip = cfg.showLabels ? 20 : 4;
    const minLabelWidth = cfg.showLabels ? 44 : 0;
    const stripLength = this._resolveStripLength(isVertical ? cfg.height : cfg.width, isVertical);
    const stripThickness = cfg.thickness;
    const svgWidth = isVertical ? Math.max(stripThickness + arrowGutter + 4, minLabelWidth) : stripLength + labelPadAlongStrip * 2;
    const svgHeight = isVertical ? stripLength + labelPadAcrossStrip * 2 : stripThickness + arrowGutter + 4;
    const verticalGroupWidth = stripThickness + arrowGutter;
    const verticalGroupLeftPad = (svgWidth - verticalGroupWidth) / 2;
    const stripX = isVertical ? position === "left" ? verticalGroupLeftPad : verticalGroupLeftPad + arrowGutter : labelPadAlongStrip;
    const stripY = isVertical ? labelPadAcrossStrip : position === "top" ? arrowGutter : 4;
    const svg = BrowserAPIs.createElementNS(SVG_NS, "svg");
    svg.setAttribute(
      "class",
      "apexcharts-heatmap-gradient-legend apexcharts-gradient-legend"
    );
    svg.setAttribute("width", String(svgWidth));
    svg.setAttribute("height", String(svgHeight));
    svg.setAttribute("overflow", "visible");
    const defs = BrowserAPIs.createElementNS(SVG_NS, "defs");
    const gradId = `apexcharts-heatmap-gradient-${w.globals.cuid}`;
    const linearGrad = BrowserAPIs.createElementNS(SVG_NS, "linearGradient");
    linearGrad.setAttribute("id", gradId);
    if (isVertical) {
      linearGrad.setAttribute("x1", "0");
      linearGrad.setAttribute("y1", "1");
      linearGrad.setAttribute("x2", "0");
      linearGrad.setAttribute("y2", "0");
    } else {
      linearGrad.setAttribute("x1", "0");
      linearGrad.setAttribute("y1", "0");
      linearGrad.setAttribute("x2", "1");
      linearGrad.setAttribute("y2", "0");
    }
    const { min, max, stops, bands } = this._computeStops();
    this._min = min;
    this._max = max;
    stops.forEach((s) => {
      const stopEl = BrowserAPIs.createElementNS(SVG_NS, "stop");
      stopEl.setAttribute("offset", `${(s.percent * 100).toFixed(2)}%`);
      stopEl.setAttribute("stop-color", s.color);
      linearGrad.appendChild(stopEl);
    });
    defs.appendChild(linearGrad);
    svg.appendChild(defs);
    const rect = BrowserAPIs.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(stripX));
    rect.setAttribute("y", String(stripY));
    rect.setAttribute("width", String(isVertical ? stripThickness : stripLength));
    rect.setAttribute("height", String(isVertical ? stripLength : stripThickness));
    rect.setAttribute("rx", "2");
    rect.setAttribute("fill", `url(#${gradId})`);
    svg.appendChild(rect);
    if (cfg.showLabels) {
      const labelColor = ((_c = cfg.labelStyle) == null ? void 0 : _c.colors) || (Array.isArray(w.config.legend.labels.colors) ? w.config.legend.labels.colors[0] : w.config.legend.labels.colors) || w.config.chart.foreColor;
      const labelFontSize = ((_d = cfg.labelStyle) == null ? void 0 : _d.fontSize) || "11px";
      const labelFontFamily = ((_e = cfg.labelStyle) == null ? void 0 : _e.fontFamily) || w.config.chart.fontFamily;
      const fmt = this._getFormatter();
      const makeLabel = (text, x, y, anchor) => {
        const t = BrowserAPIs.createElementNS(SVG_NS, "text");
        t.setAttribute("x", String(x));
        t.setAttribute("y", String(y));
        t.setAttribute("text-anchor", anchor);
        t.setAttribute("dominant-baseline", "middle");
        t.setAttribute("fill", labelColor);
        t.setAttribute("font-size", labelFontSize);
        if (labelFontFamily) t.setAttribute("font-family", labelFontFamily);
        t.textContent = String(text);
        return t;
      };
      if (isVertical) {
        const midX = stripX + stripThickness / 2;
        svg.appendChild(makeLabel(fmt(min), midX, stripY + stripLength + 10, "middle"));
        svg.appendChild(makeLabel(fmt(max), midX, stripY - 10, "middle"));
      } else {
        const midY = stripY + stripThickness / 2;
        svg.appendChild(makeLabel(fmt(min), stripX - 6, midY, "end"));
        svg.appendChild(makeLabel(fmt(max), stripX + stripLength + 6, midY, "start"));
      }
    }
    const arrowColor = ((_f = cfg.arrow) == null ? void 0 : _f.color) || w.config.chart.foreColor;
    const arrow = this._buildArrow(arrowSize, arrowColor, position);
    svg.appendChild(arrow);
    this.arrowEl = arrow;
    this._bandHitEls = [];
    if (w.config.legend.onItemHover.highlightDataSeries && bands.length > 0) {
      bands.forEach((b) => {
        const hit = BrowserAPIs.createElementNS(SVG_NS, "rect");
        if (isVertical) {
          const yTop = stripY + stripLength - b.p2 * stripLength;
          const yBot = stripY + stripLength - b.p1 * stripLength;
          hit.setAttribute("x", String(stripX));
          hit.setAttribute("y", String(yTop));
          hit.setAttribute("width", String(stripThickness));
          hit.setAttribute("height", String(Math.max(0, yBot - yTop)));
        } else {
          hit.setAttribute("x", String(stripX + b.p1 * stripLength));
          hit.setAttribute("y", String(stripY));
          hit.setAttribute(
            "width",
            String(Math.max(0, (b.p2 - b.p1) * stripLength))
          );
          hit.setAttribute("height", String(stripThickness));
        }
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("class", "apexcharts-heatmap-gradient-band");
        hit.setAttribute("data:range-index", String(b.index));
        hit.style.cursor = "pointer";
        svg.appendChild(hit);
        this._bandHitEls.push(hit);
      });
    }
    this._geom = {
      isVertical,
      position,
      stripX,
      stripY,
      stripLength,
      stripThickness,
      arrowSize,
      svgWidth,
      svgHeight
    };
    if (cfg.showHoverValue) {
      const tt = BrowserAPIs.createElement("div");
      tt.classList.add("apexcharts-heatmap-gradient-legend-value");
      tt.style.position = "absolute";
      tt.style.fontSize = ((_g = cfg.labelStyle) == null ? void 0 : _g.fontSize) || "11px";
      tt.style.fontFamily = ((_h = cfg.labelStyle) == null ? void 0 : _h.fontFamily) || w.config.chart.fontFamily || "";
      tt.style.color = w.config.chart.foreColor;
      tt.style.background = "rgba(0,0,0,0.65)";
      tt.style.color = "#fff";
      tt.style.padding = "2px 6px";
      tt.style.borderRadius = "3px";
      tt.style.pointerEvents = "none";
      tt.style.whiteSpace = "nowrap";
      tt.style.opacity = "0";
      tt.style.transition = "opacity 120ms ease";
      this.hoverValueEl = tt;
    }
    elLegendWrap.classList.add("apexcharts-heatmap-gradient-legend-wrap");
    elLegendWrap.classList.add(
      "apx-legend-position-" + position
    );
    elLegendWrap.appendChild(svg);
    if (this.hoverValueEl) elLegendWrap.appendChild(this.hoverValueEl);
    this.svgEl = svg;
    if (targetEl) {
      elLegendWrap.style.width = svgWidth + "px";
      elLegendWrap.style.height = svgHeight + "px";
      elLegendWrap.style.position = "relative";
      elLegendWrap.style.overflow = "visible";
    } else {
      this._applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight);
    }
    this._attachHoverListeners();
    this._attachBandHoverListeners();
  }
  /**
   * Resolve a configured length (number = px, string ending in '%' =
   * percentage of the chart's SVG width/height) to a pixel length.
   * @param {number|string} value
   * @param {boolean} isVertical
   * @returns {number}
   */
  _resolveStripLength(value, isVertical) {
    const w = this.w;
    const basis = isVertical ? w.globals.svgHeight || w.config.chart.height || 300 : w.globals.svgWidth || w.config.chart.width || 600;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.endsWith("%")) {
        const pct = parseFloat(trimmed) || 0;
        return Math.max(20, basis * pct / 100);
      }
      const n = parseFloat(trimmed);
      return Number.isFinite(n) ? n : 200;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return 200;
  }
  /**
   * Position the legend wrap and align the gradient strip within it. The
   * wrap spans the chart's long axis (full width for top/bottom; full
   * height for left/right) and uses flexbox to honor the `align` config.
   * Bypasses the standard `setLegendWrapXY` which sizes the wrap to its
   * content.
   * @param {HTMLElement} elLegendWrap
   * @param {'top'|'right'|'bottom'|'left'} position
   * @param {boolean} isVertical
   * @param {number} svgWidth
   * @param {number} svgHeight
   */
  _applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight) {
    const w = this.w;
    const cfg = this._cfg();
    const align = cfg.align || "center";
    const edgePad = 12;
    const chartWidth = w.globals.svgWidth || w.config.chart.width || 600;
    const chartHeight = w.globals.svgHeight || w.config.chart.height || 300;
    const userOffsetX = w.config.legend.offsetX || 0;
    const userOffsetY = w.config.legend.offsetY || 0;
    elLegendWrap.style.position = "absolute";
    elLegendWrap.style.display = "block";
    elLegendWrap.style.overflow = "visible";
    elLegendWrap.style.padding = "0";
    elLegendWrap.style.width = svgWidth + "px";
    elLegendWrap.style.height = svgHeight + "px";
    elLegendWrap.style.right = "auto";
    elLegendWrap.style.bottom = "auto";
    if (isVertical) {
      const availableHeight = chartHeight - svgHeight - edgePad * 2;
      let y;
      if (align === "start") y = edgePad;
      else if (align === "end") y = edgePad + Math.max(0, availableHeight);
      else y = edgePad + Math.max(0, availableHeight) / 2;
      elLegendWrap.style.top = y + userOffsetY + "px";
      if (position === "left") {
        elLegendWrap.style.left = edgePad + userOffsetX + "px";
      } else {
        elLegendWrap.style.left = chartWidth - svgWidth - edgePad + userOffsetX + "px";
      }
    } else {
      const availableWidth = chartWidth - svgWidth - edgePad * 2;
      let x;
      if (align === "start") x = edgePad;
      else if (align === "end") x = edgePad + Math.max(0, availableWidth);
      else x = edgePad + Math.max(0, availableWidth) / 2;
      elLegendWrap.style.left = x + userOffsetX + "px";
      if (position === "top") {
        elLegendWrap.style.top = edgePad + userOffsetY + "px";
      } else {
        elLegendWrap.style.top = chartHeight - svgHeight - edgePad + userOffsetY + "px";
      }
    }
  }
  /**
   * Re-position the strip once the final layout is known.
   *
   * `_applyWrapAlignment` (called during `draw()`, before `plotCoords()`) can
   * only pin to the chart's outer edge. This runs after layout — when
   * `translateX/Y`, `gridWidth/Height` and `xAxisHeight` are populated — and:
   *   - centers the strip within its reserved band on the perpendicular axis
   *     (between the title and the plot for `top`; the x-axis and the chart
   *     bottom for `bottom`; the chart edge and the plot for `left`/`right`),
   *     so the slack is split evenly instead of dumped on one side, and
   *   - aligns it along the plot's own extent (so `align: 'center'` centers
   *     over the heatmap, not the whole canvas).
   * Honors `legend.offsetX/offsetY` for user nudging. Safe to call repeatedly.
   */
  repositionToPlot() {
    var _a, _b;
    if (!Environment.isBrowser()) return;
    if (this._targetEl) return;
    const w = this.w;
    const g = w.globals;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    if (!wrap || !this._geom) return;
    if (!Number.isFinite(g.gridWidth) || !Number.isFinite(g.gridHeight)) return;
    const { isVertical, position, svgWidth, svgHeight, stripX, stripY, stripThickness } = this._geom;
    const align = this._cfg().align || "center";
    const ox = w.config.legend.offsetX || 0;
    const oy = w.config.legend.offsetY || 0;
    const dimHelpers = (_b = (_a = this.ctx) == null ? void 0 : _a.dimensions) == null ? void 0 : _b.dimHelpers;
    const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
    const xAxisArea = w.layout.xAxisHeight || 0;
    const alongOffset = (extent, size) => {
      const avail = Math.max(0, extent - size);
      if (align === "start") return 0;
      if (align === "end") return avail;
      return avail / 2;
    };
    if (isVertical) {
      wrap.style.top = g.translateY + alongOffset(g.gridHeight, svgHeight) + oy + "px";
      const bandStart = position === "left" ? 0 : g.translateX + g.gridWidth;
      const bandEnd = position === "left" ? g.translateX : g.svgWidth;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.left = stripCenter - stripX - stripThickness / 2 + ox + "px";
    } else {
      wrap.style.left = g.translateX + alongOffset(g.gridWidth, svgWidth) + ox + "px";
      const bandStart = position === "top" ? titleArea : g.translateY + g.gridHeight + xAxisArea;
      const bandEnd = position === "top" ? g.translateY : g.svgHeight;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.top = stripCenter - stripY - stripThickness / 2 + oy + "px";
    }
    BrowserAPIs.requestAnimationFrame(() => this._enforceMinPlotGap());
  }
  /**
   * Guarantee a minimum gap between the strip's chart-facing edge and the plot.
   * Measured in viewport space (immune to the wrap↔SVG coordinate offset) and
   * applied as a *relative* shift to the wrap's current position, so it only
   * nudges a strip that ended up too close — placements with ample room are
   * left exactly where centering put them. Runs post-paint (see caller).
   */
  _enforceMinPlotGap() {
    const w = this.w;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const strip = this.svgEl && this.svgEl.querySelector("rect");
    const grid = w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!wrap || !strip || !grid || !this._geom) return;
    const s = strip.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    if (!s.width || !s.height || !gr.width || !gr.height) return;
    const MIN_GAP = 16;
    const { isVertical, position } = this._geom;
    if (isVertical) {
      const gap = position === "left" ? gr.left - s.right : s.left - gr.right;
      if (gap < MIN_GAP) {
        const curLeft = parseFloat(wrap.style.left) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.left = curLeft + (position === "left" ? -shift : shift) + "px";
      }
    } else {
      const gap = position === "top" ? gr.top - s.bottom : s.top - gr.bottom;
      if (gap < MIN_GAP) {
        const curTop = parseFloat(wrap.style.top) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.top = curTop + (position === "top" ? -shift : shift) + "px";
      }
    }
  }
  /**
   * Tear down listeners (called before re-render).
   */
  destroy() {
    var _a, _b, _c, _d, _e, _f, _g;
    for (let i = 0; i < this._bandHitEls.length; i++) {
      const el = this._bandHitEls[i];
      (_a = el.removeEventListener) == null ? void 0 : _a.call(el, "mousemove", this._onBandEnter);
      (_b = el.removeEventListener) == null ? void 0 : _b.call(el, "mouseout", this._onBandLeave);
    }
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    if (!((_c = this.ctx) == null ? void 0 : _c.events)) return;
    try {
      (_e = (_d = this.ctx.events).removeEventListener) == null ? void 0 : _e.call(
        _d,
        "dataPointMouseEnter",
        this._onCellEnter
      );
      (_g = (_f = this.ctx.events).removeEventListener) == null ? void 0 : _g.call(
        _f,
        "dataPointMouseLeave",
        this._onCellLeave
      );
    } catch (_) {
    }
  }
  /** Wire mousemove/mouseout on each per-band hit-region (ranges mode). */
  _attachBandHoverListeners() {
    if (!Environment.isBrowser()) return;
    for (let i = 0; i < this._bandHitEls.length; i++) {
      const el = this._bandHitEls[i];
      el.addEventListener("mousemove", this._onBandEnter);
      el.addEventListener("mouseout", this._onBandLeave);
    }
  }
  /**
   * Hovering a gradient band highlights its cells and dims the rest. Guarded
   * so the repeated mousemove stream only re-applies on an actual band change.
   * @param {Event} e
   */
  _onBandEnter(e) {
    var _a, _b, _c, _d;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e.currentTarget
    );
    const idx = parseInt((_a = target.getAttribute("data:range-index")) != null ? _a : "-1", 10);
    if (idx < 0 || idx === this._activeBandIndex) return;
    this._activeBandIndex = idx;
    (_d = (_c = (_b = this.ctx) == null ? void 0 : _b.events) == null ? void 0 : _c.fireEvent) == null ? void 0 : _d.call(_c, "legendHover", [this.ctx, idx, w]);
    new Series(w).highlightRangeInSeries(idx, "highlight");
  }
  /** Leaving a band clears the highlight. */
  _onBandLeave() {
    if (this._activeBandIndex < 0) return;
    const idx = this._activeBandIndex;
    this._activeBandIndex = -1;
    new Series(this.w).highlightRangeInSeries(idx, "reset");
  }
  _attachHoverListeners() {
    var _a, _b;
    if (!Environment.isBrowser()) return;
    if (!((_b = (_a = this.ctx) == null ? void 0 : _a.events) == null ? void 0 : _b.addEventListener)) return;
    this.ctx.events.addEventListener(
      "dataPointMouseEnter",
      this._onCellEnter
    );
    this.ctx.events.addEventListener(
      "dataPointMouseLeave",
      this._onCellLeave
    );
  }
  /**
   * dataPointMouseEnter fires as `(e, ctx, { seriesIndex, dataPointIndex, w })`.
   * Graphics._fireEvent forwards listener args in the same shape.
   * @param {...any} args
   */
  _onCellEnter(...args) {
    var _a, _b, _c;
    const w = this.w;
    if (!this.arrowEl) return;
    const opts = args[args.length - 1];
    if (!opts || typeof opts !== "object") return;
    const i = opts.seriesIndex;
    const j = opts.dataPointIndex;
    if (typeof i !== "number" || typeof j !== "number") return;
    if (!HeatmapGradientLegend.supports(w)) return;
    let val;
    if (this._continuous) {
      val = colorValueOf(w, i, j);
    } else {
      val = (_c = (_b = (_a = w.seriesData) == null ? void 0 : _a.series) == null ? void 0 : _b[i]) == null ? void 0 : _c[j];
    }
    if (val == null || Number.isNaN(val)) return;
    this._positionArrow(val);
  }
  _onCellLeave() {
    if (!this.arrowEl) return;
    this.arrowEl.setAttribute("opacity", "0");
    if (this.hoverValueEl) {
      this.hoverValueEl.style.opacity = "0";
    }
  }
  /**
   * Move the arrow to the position corresponding to `val` along the strip.
   * @param {number} val
   */
  _positionArrow(val) {
    if (!this.arrowEl || !this._geom) return;
    const { isVertical, position, stripX, stripY, stripLength, stripThickness, arrowSize } = this._geom;
    const min = this._min;
    const max = this._max;
    const span = max - min;
    let pct;
    if (span === 0) {
      pct = 0.5;
    } else {
      pct = (val - min) / span;
    }
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    if (isVertical) {
      const yCenter = stripY + stripLength - pct * stripLength;
      let tipX, baseX;
      if (position === "left") {
        tipX = stripX + stripThickness;
        baseX = tipX + arrowSize;
      } else {
        tipX = stripX;
        baseX = tipX - arrowSize;
      }
      const points = [
        `${tipX},${yCenter}`,
        `${baseX},${yCenter - arrowSize / 2}`,
        `${baseX},${yCenter + arrowSize / 2}`
      ].join(" ");
      this.arrowEl.setAttribute("points", points);
    } else {
      const xCenter = stripX + pct * stripLength;
      let tipY, baseY;
      if (position === "top") {
        tipY = stripY + stripThickness;
        baseY = tipY + arrowSize;
      } else {
        tipY = stripY;
        baseY = tipY - arrowSize;
      }
      const points = [
        `${xCenter},${tipY}`,
        `${xCenter - arrowSize / 2},${baseY}`,
        `${xCenter + arrowSize / 2},${baseY}`
      ].join(" ");
      this.arrowEl.setAttribute("points", points);
    }
    this.arrowEl.setAttribute("opacity", "1");
    if (this.hoverValueEl) {
      const fmt = this._getFormatter();
      this.hoverValueEl.textContent = fmt(val);
      if (isVertical) {
        const yCenter = stripY + stripLength - pct * stripLength;
        if (position === "left") {
          this.hoverValueEl.style.left = `${stripX + stripThickness + arrowSize + 8}px`;
        } else {
          this.hoverValueEl.style.left = `${stripX - arrowSize - 8}px`;
          this.hoverValueEl.style.transform = "translateX(-100%)";
        }
        this.hoverValueEl.style.top = `${yCenter - 9}px`;
      } else {
        const xCenter = stripX + pct * stripLength;
        this.hoverValueEl.style.left = `${xCenter}px`;
        this.hoverValueEl.style.transform = "translateX(-50%)";
        if (position === "top") {
          this.hoverValueEl.style.top = `${stripY + stripThickness + arrowSize + 8}px`;
        } else {
          this.hoverValueEl.style.top = `${stripY - arrowSize - 18}px`;
        }
      }
      this.hoverValueEl.style.opacity = "1";
    }
  }
  /**
   * @param {number} size
   * @param {string} color
   * @param {'top'|'right'|'bottom'|'left'} _position
   */
  _buildArrow(size, color, _position) {
    const polygon = BrowserAPIs.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("fill", color);
    polygon.setAttribute("opacity", "0");
    polygon.setAttribute("class", "apexcharts-heatmap-gradient-arrow");
    polygon.setAttribute("points", "0,0 0,0 0,0");
    polygon.setAttribute("pointer-events", "none");
    return polygon;
  }
  /**
   * Build gradient stops + return effective min/max.
   * - If `colorScale.ranges` is set, stops are placed at each range boundary
   *   so the gradient reflects the user's discrete palette.
   * - Otherwise, samples N stops from the same shadeColor function the cells
   *   use, so the strip visually matches the heatmap.
   * @returns {{ min: number, max: number, stops: Array<{percent:number,color:string}>, bands: Array<{index:number,p1:number,p2:number}> }}
   */
  _computeStops() {
    var _a, _b;
    const w = this.w;
    const cs = HeatmapGradientLegend.colorScaleOf(w) || {};
    const cfg = this._cfg();
    const continuous = buildContinuousScale(w);
    if (continuous) {
      this._continuous = true;
      return {
        min: continuous.min,
        max: continuous.max,
        stops: continuous.legendStops,
        bands: []
      };
    }
    this._continuous = false;
    let dataMin = Infinity;
    let dataMax = -Infinity;
    const rows = ((_a = w.seriesData) == null ? void 0 : _a.series) || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      for (let j = 0; j < row.length; j++) {
        const v = row[j];
        if (v == null || Number.isNaN(v)) continue;
        if (v < dataMin) dataMin = v;
        if (v > dataMax) dataMax = v;
      }
    }
    if (!Number.isFinite(dataMin)) dataMin = 0;
    if (!Number.isFinite(dataMax)) dataMax = 0;
    let min = dataMin;
    let max = dataMax;
    if (typeof cs.min !== "undefined" && typeof cs.max !== "undefined" && cs.max > cs.min) {
      min = cs.min;
      max = cs.max;
    } else {
      if (typeof cs.min !== "undefined") {
        min = cs.min < dataMin ? cs.min : dataMin;
      }
      if (typeof cs.max !== "undefined") {
        max = cs.max > dataMax ? cs.max : dataMax;
      }
    }
    const stops = [];
    const bands = [];
    if (cs.ranges && cs.ranges.length > 0) {
      const ranges = cs.ranges.map((r, originalIndex) => __spreadProps(__spreadValues({}, r), {
        _originalIndex: originalIndex
      })).sort((a, b) => a.from - b.from);
      const lo = ranges[0].from;
      const hi = ranges[ranges.length - 1].to;
      min = lo;
      max = hi;
      const span = hi - lo || 1;
      ranges.forEach((r) => {
        const p1 = (r.from - lo) / span;
        const p2 = (r.to - lo) / span;
        stops.push({ percent: (p1 + p2) / 2, color: r.color });
        bands.push({ index: r._originalIndex, p1, p2 });
      });
    } else {
      const baseColor = w.globals.colors[0] || "#008FFB";
      const utils = new Utils();
      const plot = w.config.plotOptions[w.config.chart.type] || {};
      const shadeIntensity = (_b = plot.shadeIntensity) != null ? _b : 0.5;
      const hasNegs = (
        /** @type {any} */
        w.globals.hasNegs
      );
      const n = Math.max(2, cfg.stops || 16);
      for (let s = 0; s < n; s++) {
        const t = s / (n - 1);
        const v = min + t * (max - min);
        const total = Math.abs(max) + Math.abs(min);
        const percent_v = total === 0 ? 0 : 100 * v / total;
        let colorShadePercent;
        if (hasNegs) {
          if (plot.reverseNegativeShade) {
            colorShadePercent = percent_v < 0 ? percent_v / 100 * (shadeIntensity * 1.25) : (1 - percent_v / 100) * (shadeIntensity * 1.25);
          } else {
            colorShadePercent = percent_v <= 0 ? 1 - (1 + percent_v / 100) * shadeIntensity : (1 - percent_v / 100) * shadeIntensity;
          }
        } else {
          colorShadePercent = 1 - percent_v / 100;
        }
        if (colorShadePercent > 1) colorShadePercent = 1;
        if (colorShadePercent < -1) colorShadePercent = -1;
        const shaded = plot.enableShades ? utils.shadeColor(
          w.config.theme.mode === "dark" ? colorShadePercent * -1 : colorShadePercent,
          baseColor
        ) : baseColor;
        stops.push({ percent: t, color: shaded });
      }
    }
    return { min, max, stops, bands };
  }
}
const ICONS = {
  zoom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M8 10.5h5M10.5 8v5"/></svg>',
  pan: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
  reset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10a8 8 0 1 1 2 6"/><path d="M4 4v6h6"/></svg>',
  download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>'
};
class TrellisChrome {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this.elLegend = null;
    this.elToolbar = null;
    this.elTitle = null;
    this.elBreadcrumb = null;
    this.gradientLegend = null;
    this._gradPending = null;
  }
  /**
   * The per-cell facet header. Built with the cell, before the panel mounts,
   * so a virtualized cell still names itself.
   * @param {HTMLElement} cell
   * @param {string} key
   * @param {{ index: number, count: number }} meta
   */
  buildHeader(cell, key, meta) {
    const t = this.trellis;
    const hcfg = t.cfg.header || {};
    if (hcfg.show === false) return;
    const el = BrowserAPIs.createElement("div");
    el.className = "apexcharts-trellis-header";
    let text = key;
    if (typeof hcfg.formatter === "function") {
      text = hcfg.formatter(key, {
        dimension: typeof t.cfg.by === "string" ? t.cfg.by : void 0,
        index: meta.index,
        count: meta.count
      });
    }
    el.textContent = text == null ? "" : String(text);
    const style = hcfg.style || {};
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight);
    if (style.color) el.style.color = style.color;
    if (t.cfg.promote !== false) {
      el.classList.add("apexcharts-trellis-header-clickable");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("title", "Expand this panel");
      const toggle = () => {
        if (t._promotedKey === key) t.restorePromotion();
        else t.promote(key);
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    }
    cell.appendChild(el);
  }
  /**
   * One 2-D strip label (P4): column labels once across the top, row labels
   * once down the left, instead of a header per cell. The header formatter
   * applies with the dimension named.
   * @param {'row'|'column'} dimension
   * @param {string} key
   * @param {{ index: number, count: number }} meta
   * @returns {HTMLElement}
   */
  stripEl(dimension, key, meta) {
    const t = this.trellis;
    const hcfg = t.cfg.header || {};
    const el = BrowserAPIs.createElement("div");
    el.className = `apexcharts-trellis-strip apexcharts-trellis-strip-${dimension}`;
    let text = key;
    if (typeof hcfg.formatter === "function") {
      text = hcfg.formatter(key, {
        dimension,
        index: meta.index,
        count: meta.count
      });
    }
    el.textContent = text == null ? "" : String(text);
    const style = hcfg.style || {};
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight);
    if (style.color) el.style.color = style.color;
    return el;
  }
  /**
   * The promotion breadcrumb: "All panels / KEY", where "All panels" is the
   * way back. Lives in the chrome-top strip so the grid's own layout is
   * untouched.
   * @param {HTMLElement} host
   * @param {string} key
   * @param {() => void} onBack
   */
  buildBreadcrumb(host, key, onBack) {
    this.removeBreadcrumb();
    const el = BrowserAPIs.createElement("div");
    el.className = "apexcharts-trellis-breadcrumb";
    const back = BrowserAPIs.createElement("button");
    back.setAttribute("type", "button");
    back.className = "apexcharts-trellis-breadcrumb-back";
    back.textContent = "All panels";
    back.addEventListener("click", onBack);
    const sep = BrowserAPIs.createElement("span");
    sep.className = "apexcharts-trellis-breadcrumb-sep";
    sep.textContent = "/";
    const current = BrowserAPIs.createElement("span");
    current.className = "apexcharts-trellis-breadcrumb-current";
    current.textContent = key;
    el.appendChild(back);
    el.appendChild(sep);
    el.appendChild(current);
    host.appendChild(el);
    this.elBreadcrumb = el;
  }
  removeBreadcrumb() {
    if (this.elBreadcrumb && this.elBreadcrumb.parentNode) {
      this.elBreadcrumb.parentNode.removeChild(this.elBreadcrumb);
    }
    this.elBreadcrumb = null;
  }
  /**
   * The trellis-level title, from the host's own `title` config (panels have
   * theirs suppressed).
   * @param {HTMLElement} host
   */
  buildTitle(host) {
    const title = this.trellis.w.config.title;
    if (!title || !title.text) return;
    const el = BrowserAPIs.createElement("div");
    el.className = "apexcharts-trellis-title";
    el.textContent = title.text;
    const style = title.style || {};
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.color) el.style.color = style.color;
    host.appendChild(el);
    this.elTitle = el;
  }
  /**
   * One legend for the grid. Clicking an item toggles that series name in
   * every panel (TrellisSync owns the fan-out and the hidden set).
   * @param {HTMLElement} host
   */
  buildLegend(host) {
    const t = this.trellis;
    if ((t.cfg.legend || "shared") !== "shared") return;
    if (t.w.config.chart.type === "heatmap") {
      this.buildGradientLegend(host);
      return;
    }
    const names = t.split ? t.split.seriesNames : [];
    if (names.length < 2) return;
    const wrap = BrowserAPIs.createElement("div");
    wrap.className = "apexcharts-trellis-legend apexcharts-legend";
    wrap.setAttribute("role", "list");
    names.forEach((name) => {
      const item = BrowserAPIs.createElement("div");
      item.className = "apexcharts-legend-series apexcharts-trellis-legend-item";
      item.setAttribute("role", "listitem");
      item.setAttribute("tabindex", "0");
      item.setAttribute("data:collapsed", "false");
      const marker = BrowserAPIs.createElement("span");
      marker.className = "apexcharts-legend-marker";
      marker.style.background = t.scales ? t.scales.colorOf(name) : "#008FFB";
      const text = BrowserAPIs.createElement("span");
      text.className = "apexcharts-legend-text";
      text.textContent = name;
      item.appendChild(marker);
      item.appendChild(text);
      const toggle = () => {
        const hidden = t.sync.toggleSeries(name);
        item.classList.toggle("apexcharts-inactive-legend", hidden);
        item.setAttribute("data:collapsed", String(hidden));
      };
      item.addEventListener("click", toggle);
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
      wrap.appendChild(item);
    });
    host.appendChild(wrap);
    this.elLegend = wrap;
  }
  /**
   * One shared gradient strip for a heatmap grid (P5). Every panel carries
   * the same pushed colorScale min/max (TrellisFrames), so any ONE mounted
   * panel's strip is THE grid's scale; it draws detached into a trellis-owned
   * slot under the grid. Hover (the value arrow) is wired through every
   * mounted panel's events, so sweeping any panel moves the one arrow.
   * On a virtualized grid with nothing mounted yet, the build defers to the
   * first panelMounted.
   * @param {HTMLElement} host
   */
  buildGradientLegend(host) {
    const t = this.trellis;
    const mounted = t.panels.find((p) => p.chart);
    if (!mounted) {
      if (this._gradPending) return;
      const once = () => {
        var _a, _b;
        this._gradPending = null;
        (_b = (_a = t.ctx.events).removeEventListener) == null ? void 0 : _b.call(_a, "panelMounted", once);
        this.buildGradientLegend(host);
      };
      this._gradPending = once;
      t.ctx.events.addEventListener("panelMounted", once);
      return;
    }
    const slot = BrowserAPIs.createElement("div");
    slot.className = "apexcharts-trellis-legend apexcharts-trellis-gradient-legend";
    host.appendChild(slot);
    this.elLegend = slot;
    const chart = (
      /** @type {any} */
      mounted.chart
    );
    const legend = new HeatmapGradientLegend(chart.w, chart.ctx);
    legend.draw(slot);
    this.gradientLegend = legend;
    t.panels.forEach((p) => {
      var _a;
      if (!p.chart || p === mounted) return;
      const ev = (
        /** @type {any} */
        (_a = p.chart.ctx) == null ? void 0 : _a.events
      );
      if (!(ev == null ? void 0 : ev.addEventListener)) return;
      ev.addEventListener("dataPointMouseEnter", legend._onCellEnter);
      ev.addEventListener("dataPointMouseLeave", legend._onCellLeave);
    });
  }
  /** Tear down the shared gradient strip (P5). */
  destroyGradientLegend() {
    var _a, _b;
    const t = this.trellis;
    if (this._gradPending) {
      (_b = (_a = t.ctx.events).removeEventListener) == null ? void 0 : _b.call(_a, "panelMounted", this._gradPending);
      this._gradPending = null;
    }
    if (this.gradientLegend) {
      try {
        this.gradientLegend.destroy();
      } catch (e) {
      }
      this.gradientLegend = null;
    }
  }
  /**
   * One toolbar for the grid: zoom / pan / reset only (P1). Zoom and pan arm
   * the tool by setting every panel's interact flags, which is exactly what
   * the per-chart toolbar does for its group; reset restores the trellis's
   * own domains via TrellisSync.
   * @param {HTMLElement} host
   */
  buildToolbar(host) {
    const t = this.trellis;
    if ((t.cfg.toolbar || "shared") !== "shared") return;
    const bar = BrowserAPIs.createElement("div");
    bar.className = "apexcharts-trellis-toolbar";
    const buttons = {};
    const arm = (tool) => {
      t.panels.forEach((p) => {
        if (!p.chart) return;
        const it = p.chart.w.interact;
        it.zoomEnabled = tool === "zoom";
        it.panEnabled = tool === "pan";
        it.selectionEnabled = false;
      });
      buttons.zoom.classList.toggle("apexcharts-selected", tool === "zoom");
      buttons.pan.classList.toggle("apexcharts-selected", tool === "pan");
      buttons.zoom.setAttribute("aria-pressed", String(tool === "zoom"));
      buttons.pan.setAttribute("aria-pressed", String(tool === "pan"));
    };
    const makeButton = (kind, label, onClick) => {
      const b = BrowserAPIs.createElement("button");
      b.className = `apexcharts-trellis-tool apexcharts-trellis-tool-${kind}`;
      b.setAttribute("type", "button");
      b.setAttribute("aria-label", label);
      b.setAttribute("title", label);
      b.innerHTML = /** @type {Record<string, string>} */
      ICONS[kind];
      b.addEventListener("click", onClick);
      buttons[kind] = b;
      bar.appendChild(b);
      return b;
    };
    makeButton("zoom", "Selection zoom", () => arm("zoom"));
    makeButton("pan", "Pan", () => arm("pan"));
    makeButton("reset", "Reset zoom", () => {
      t.sync.resetAll();
    });
    if (t.ctx.exports) {
      const menu = BrowserAPIs.createElement("div");
      menu.className = "apexcharts-trellis-menu";
      [
        ["png", "Download PNG"],
        ["svg", "Download SVG"],
        ["csv", "Download CSV"]
      ].forEach(([kind, label]) => {
        const item = BrowserAPIs.createElement("button");
        item.setAttribute("type", "button");
        item.className = "apexcharts-trellis-menu-item";
        item.textContent = label;
        item.addEventListener("click", () => {
          menu.classList.remove("apexcharts-trellis-menu-open");
          t.exports.download(kind);
        });
        menu.appendChild(item);
      });
      makeButton("download", "Download", () => {
        menu.classList.toggle("apexcharts-trellis-menu-open");
      });
      bar.appendChild(menu);
    }
    buttons.zoom.classList.add("apexcharts-selected");
    buttons.zoom.setAttribute("aria-pressed", "true");
    buttons.pan.setAttribute("aria-pressed", "false");
    host.appendChild(bar);
    this.elToolbar = bar;
    host.classList.add("apexcharts-trellis-has-toolbar");
  }
}
function yaxisPayload(chart, patch) {
  const current = Utils.clone(chart.w.config.yaxis);
  const arr = Array.isArray(current) ? current : [current];
  return arr.map((entry) => Utils.extend(entry, patch));
}
class TrellisSync {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this._syncing = false;
    this._hidden = /* @__PURE__ */ new Set();
    this.currentWindow = null;
  }
  /**
   * Record the x window a zoom gesture produced. An empty window (zoom-out
   * past the full range) clears the record back to the trellis domains.
   * @param {any} payload the zoomed/scrolled event payload
   * @param {boolean} zoomed
   */
  _noteWindow(payload, zoomed) {
    const xw = payload && payload.xaxis;
    if (xw && xw.min != null && xw.max != null) {
      this.currentWindow = {
        x: { min: xw.min, max: xw.max },
        y: this.currentWindow && this.currentWindow.y || null,
        zoomed: zoomed || !!(this.currentWindow && this.currentWindow.zoomed)
      };
    } else if (zoomed) {
      this.currentWindow = null;
    }
  }
  /**
   * The `zoomed` handler injected into every panel's config (wrapping the
   * user's own handler, which is called first with the panel's ctx). Drag,
   * wheel and toolbar zooms all funnel through this one config event.
   * @param {Function|undefined} userZoomed
   * @returns {(chartCtx: any, payload: any) => void}
   */
  makeZoomedHandler(userZoomed) {
    return (chartCtx, payload) => {
      if (typeof userZoomed === "function") userZoomed(chartCtx, payload);
      this._noteWindow(payload, true);
      this.onZoomed(payload);
    };
  }
  /**
   * The `scrolled` handler injected into every panel's config: panning moves
   * the x window without a zoomed event, and virtualized mounts must still
   * see the panned window when no live sibling exists.
   * @param {Function|undefined} userScrolled
   * @returns {(chartCtx: any, payload: any) => void}
   */
  makeScrolledHandler(userScrolled) {
    return (chartCtx, payload) => {
      if (typeof userScrolled === "function") userScrolled(chartCtx, payload);
      this._noteWindow(payload, false);
    };
  }
  /**
   * Shared-scale autoscale: recompute the union VISIBLE y over all panels in
   * the new x window and push it everywhere. Only meaningful when the y scale
   * is shared, the user asked for autoscale, and x is numeric (a category
   * window has no reliable data-space mapping to filter by).
   * @param {any} payload the zoomed event payload ({ xaxis: { min, max } })
   */
  onZoomed(payload) {
    const t = this.trellis;
    if (this._syncing) return;
    const cfg = t.cfg;
    if (!cfg || (cfg.scales.y || "shared") !== "shared") return;
    if (!t.autoScaleYaxis) return;
    const xw = payload && payload.xaxis;
    if (!xw || xw.min == null || xw.max == null) return;
    if (!t.split || !t.split.xIsNumeric) return;
    const ext = yExtentInWindow(t.split.panels, t.split.xForm, xw.min, xw.max);
    if (!ext) return;
    const y = niceBounds(ext.min, ext.max, cfg.targetTicks || DEFAULT_TARGET_TICKS);
    if (this.currentWindow) {
      this.currentWindow.y = {
        min: y.min,
        max: y.max,
        tickAmount: y.tickAmount
      };
    }
    this._syncing = true;
    const pushes = t.panels.map(
      (p) => p.chart ? p.chart.updateOptions(
        {
          yaxis: yaxisPayload(p.chart, {
            min: y.min,
            max: y.max,
            tickAmount: y.tickAmount
          })
        },
        false,
        false,
        false
      ).catch(() => {
      }) : Promise.resolve()
    );
    Promise.all(pushes).finally(() => {
      this._syncing = false;
    });
  }
  /**
   * One reset for the whole grid: restore the trellis's own domains (which,
   * for a shared y drifted by autoscale, is the stored union) and clear the
   * zoomed flag. Deliberately NOT resetSeries(): that would also undo the
   * legend's collapsed set, which is user state, not zoom state.
   * @returns {Promise<any>}
   */
  resetAll() {
    const t = this.trellis;
    this.currentWindow = null;
    const xaxis = t.scales && t.scales.x ? { min: t.scales.x.min, max: t.scales.x.max } : { min: void 0, max: void 0 };
    this._syncing = true;
    const pushes = t.panels.map((p) => {
      if (!p.chart) return Promise.resolve();
      p.chart.w.interact.zoomed = false;
      const options = { xaxis };
      const yBounds = t.split ? t._yBoundsFor(t.split.panels[p.index]) : null;
      if (yBounds) {
        options.yaxis = yaxisPayload(p.chart, {
          min: yBounds.min,
          max: yBounds.max,
          tickAmount: yBounds.tickAmount
        });
      }
      return p.chart.updateOptions(options, false, false, false).catch(() => {
      });
    });
    return Promise.all(pushes).finally(() => {
      this._syncing = false;
    });
  }
  /**
   * Toggle one series name across every panel. Panels missing the name are
   * skipped (a panel-local slice may not carry a repeated series).
   * @param {string} name
   * @returns {boolean} the new hidden state
   */
  toggleSeries(name) {
    const hide = !this._hidden.has(name);
    if (hide) this._hidden.add(name);
    else this._hidden.delete(name);
    this.trellis.panels.forEach((p) => {
      const chart = p.chart;
      if (!chart) return;
      const names = chart.w.seriesData.seriesNames || [];
      if (names.indexOf(name) === -1) return;
      try {
        hide ? chart.hideSeries(name) : chart.showSeries(name);
      } catch (e) {
      }
    });
    return hide;
  }
  /** @param {string} name */
  isHidden(name) {
    return this._hidden.has(name);
  }
  /**
   * Bring one freshly mounted panel in line with the shared legend's hidden
   * set (virtualized remounts miss the toggles that happened while they were
   * unmounted; the trellis-wide `_hidden` set is the truth).
   * @param {any} chart a panel instance
   */
  applyHiddenTo(chart) {
    if (!this._hidden.size || !chart) return;
    const names = chart.w.seriesData && chart.w.seriesData.seriesNames || [];
    this._hidden.forEach((name) => {
      if (names.indexOf(name) === -1) return;
      try {
        chart.hideSeries(name);
      } catch (e) {
      }
    });
  }
  /**
   * Cross-panel crosshair sweep.
   *
   * The group's own crosshair fan-out assumes vertically STACKED charts: the
   * sibling path maps the pointer's clientX into the sibling's own plot
   * (Utils.getNearestValues -> screenXToPlotPx), which lands out of bounds
   * the moment a sibling sits beside rather than below the hovered chart, so
   * the sibling bails before ever moving its crosshair (measured; the shipped
   * stacked sample works, a side-by-side group does not).
   *
   * The trellis mirrors instead, and the alignment invariant is what makes
   * the naive mirror CORRECT: every panel has the identical translateX and
   * gridWidth and the identical x domain, so the hovered panel's
   * crosshair-x in plot px means the same data x in every panel.
   *
   * The mirror is a CONTINUOUS rAF loop bounded by grid hover, not a one-shot
   * per mousemove: the group's tooltip pipeline clears sibling crosshairs
   * asynchronously AFTER the event (measured: a one-shot mirror wins the
   * frame, then the native clear lands and the sweep collapses back to the
   * hovered column at rest). Re-asserting every frame while the pointer is
   * inside the grid makes the settled state the mirrored one; the loop stops
   * on mouseleave, so an idle page costs nothing.
   *
   * @param {HTMLElement} elGrid the trellis grid element
   */
  wireCrosshairs(elGrid) {
    let raf2 = 0;
    let hoverTarget = null;
    const apply = () => {
      const cell = hoverTarget && hoverTarget.closest ? hoverTarget.closest(".apexcharts-trellis-cell") : null;
      const source = cell ? cell.querySelector(".apexcharts-xcrosshairs") : null;
      const active = source && source.classList.contains("apexcharts-active");
      this.trellis.panels.forEach((p) => {
        if (!p.cellEl || p.cellEl === cell) return;
        const x = p.cellEl.querySelector(".apexcharts-xcrosshairs");
        if (!x) return;
        if (active) {
          x.setAttribute("x", source.getAttribute("x") || "0");
          x.setAttribute("x1", source.getAttribute("x1") || "0");
          x.setAttribute("x2", source.getAttribute("x2") || "0");
          x.classList.add("apexcharts-active");
        } else {
          x.classList.remove("apexcharts-active");
        }
      });
    };
    const loop = () => {
      apply();
      raf2 = hoverTarget ? requestAnimationFrame(loop) : 0;
    };
    const move = (e) => {
      hoverTarget = e.target;
      if (!raf2) raf2 = requestAnimationFrame(loop);
    };
    const clear = () => {
      hoverTarget = null;
      if (raf2) {
        cancelAnimationFrame(raf2);
        raf2 = 0;
      }
      this.trellis.panels.forEach((p) => {
        const x = p.cellEl && p.cellEl.querySelector(".apexcharts-xcrosshairs");
        if (x) x.classList.remove("apexcharts-active");
      });
    };
    elGrid.addEventListener("mousemove", move, { passive: true });
    elGrid.addEventListener("mouseleave", clear, { passive: true });
  }
}
const VIEWSTATE_VERSION = 1;
function axisWindow(min, max) {
  const hasMin = min !== void 0 && min !== null;
  const hasMax = max !== void 0 && max !== null;
  if (!hasMin && !hasMax) return null;
  return { min: hasMin ? min : null, max: hasMax ? max : null };
}
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return [];
  return sel.map((a) => Array.isArray(a) ? a.slice() : a);
}
function annotationKind(method, ctx) {
  if (typeof method !== "function" || !ctx) return null;
  if (method === ctx.addXaxisAnnotation) return "xaxis";
  if (method === ctx.addYaxisAnnotation) return "yaxis";
  if (method === ctx.addPointAnnotation) return "point";
  return null;
}
function captureAnnotations(w, ctx) {
  const staticAnno = w.config.annotations ? Utils.clone(w.config.annotations) : null;
  const dynamic = [];
  const mem = w.globals.memory && w.globals.memory.methodsToExec || [];
  for (const entry of mem) {
    if (!entry || entry.label !== "addAnnotation") continue;
    const kind = annotationKind(entry.method, ctx);
    if (!kind) continue;
    dynamic.push({ kind, params: Utils.clone(entry.params) });
  }
  return { static: staticAnno, dynamic };
}
function captureMeasure(ctx) {
  const m = ctx && ctx.measure;
  if (!m || typeof m.getPins !== "function") return null;
  const pins = m.getPins();
  return Array.isArray(pins) && pins.length ? { pins } : null;
}
function captureViewState(w, ctx) {
  var _a, _b;
  const cfgX = w.config.xaxis || {};
  const cfgYArr = Array.isArray(w.config.yaxis) ? w.config.yaxis : w.config.yaxis ? [w.config.yaxis] : [];
  const yWindows = cfgYArr.map(
    (y) => axisWindow(y && y.min, y && y.max)
  );
  const anyY = yWindows.some((yw) => yw !== null);
  const theme = w.config.theme;
  const drilldown = ctx && ctx.drilldown;
  return {
    v: VIEWSTATE_VERSION,
    window: {
      xaxis: axisWindow(cfgX.min, cfgX.max),
      yaxis: anyY ? yWindows : null
    },
    zoomed: !!w.interact.zoomed,
    collapsed: (w.globals.collapsedSeriesIndices || []).slice(),
    ancillaryCollapsed: (w.globals.ancillaryCollapsedSeriesIndices || []).slice(),
    selectedDataPoints: cloneSelection(w.interact.selectedDataPoints),
    theme: theme ? { mode: (_a = theme.mode) != null ? _a : null, palette: (_b = theme.palette) != null ? _b : null } : null,
    locale: w.config.chart && w.config.chart.defaultLocale || null,
    annotations: captureAnnotations(w, ctx),
    drill: drilldown && drilldown.depth > 0 ? { path: drilldown.path.slice() } : null,
    measure: captureMeasure(ctx)
  };
}
const MOUNTS_PER_FRAME = 2;
const OPS_PER_FRAME = 6;
const GUTTER_EPSILON = 0.5;
function raf(cb) {
  if (typeof requestAnimationFrame === "function") {
    return { kind: "raf", id: requestAnimationFrame(cb) };
  }
  return { kind: "timeout", id: setTimeout(() => cb(0), 16) };
}
function cancelRaf(handle) {
  if (!handle) return;
  if (handle.kind === "raf") cancelAnimationFrame(handle.id);
  else clearTimeout(handle.id);
}
class TrellisVirtual {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this.active = false;
    this._io = null;
    this._byCell = /* @__PURE__ */ new Map();
    this._dirty = /* @__PURE__ */ new Set();
    this._raf = null;
    this._draining = false;
    this._gutterFloor = 0;
  }
  static supported() {
    return typeof IntersectionObserver !== "undefined";
  }
  /** One grid row (panel + header + gap): the observer's look-ahead margin. */
  _rootMargin() {
    const ly = this.trellis.layout;
    const m = ly ? Math.max(0, Math.round(ly.panelH + ly.headerH + ly.gap)) : 300;
    return `${m}px 0px ${m}px 0px`;
  }
  /** Begin observing every cell. Panels start unmounted; the observer's
   *  initial callback mounts the visible ones. */
  start() {
    if (!TrellisVirtual.supported()) return;
    this.active = true;
    this._io = new IntersectionObserver(
      (entries) => this._onEntries(entries),
      { root: null, rootMargin: this._rootMargin(), threshold: 0 }
    );
    this.trellis.panels.forEach((p) => {
      var _a;
      p.wantMounted = false;
      if (p.cellEl) {
        this._byCell.set(p.cellEl, p);
        (_a = this._io) == null ? void 0 : _a.observe(p.cellEl);
      }
    });
  }
  /**
   * Recreate the observer after a relayout: rootMargin is immutable on a live
   * observer and it tracks the (possibly changed) panel height. Re-observing
   * re-fires initial entries, which reconciles to a no-op for unchanged cells.
   */
  refresh() {
    if (!this.active || !this._io) return;
    this._io.disconnect();
    this._io = new IntersectionObserver(
      (entries) => this._onEntries(entries),
      { root: null, rootMargin: this._rootMargin(), threshold: 0 }
    );
    this._byCell.forEach((_p, cell) => {
      var _a;
      return (_a = this._io) == null ? void 0 : _a.observe(cell);
    });
  }
  /** @param {IntersectionObserverEntry[]} entries */
  _onEntries(entries) {
    if (!this.active) return;
    for (const entry of entries) {
      const panel = this._byCell.get(entry.target);
      if (!panel) continue;
      panel.wantMounted = entry.isIntersecting;
      this._dirty.add(panel);
    }
    this._schedule();
  }
  _schedule() {
    if (this._raf || this._draining || !this.active) return;
    this._raf = raf(() => {
      this._raf = null;
      this._drain();
    });
  }
  /** Reconcile wanted-vs-actual for a bounded batch of panels, then yield. */
  _drain() {
    return __async(this, null, function* () {
      if (this._draining || !this.active) return;
      this._draining = true;
      try {
        let mounts = 0;
        let ops = 0;
        while (this.active && this._dirty.size && mounts < MOUNTS_PER_FRAME && ops < OPS_PER_FRAME) {
          const panel = this._dirty.values().next().value;
          this._dirty.delete(panel);
          const want = !!panel.wantMounted;
          if (want === !!panel.chart) continue;
          ops++;
          if (want) {
            mounts++;
            yield this._mount(panel);
          } else {
            this._unmount(panel);
          }
        }
      } finally {
        this._draining = false;
        if (this.active && this._dirty.size) {
          this._schedule();
        } else if (this.active) {
          this.trellis.w.globals.animationEnded = true;
        }
      }
    });
  }
  /**
   * The freshest cross-panel window: any mounted sibling's current config.
   * Group pushes (drag/wheel zoom, pan, shared-y autoscale) reach only
   * mounted panels, so this beats a stash captured before those pushes.
   * @param {any} skip the panel being mounted
   */
  _liveWindow(skip) {
    const sibling = this.trellis.panels.find((p) => p !== skip && p.chart);
    if (!sibling || !sibling.chart) return null;
    const w = sibling.chart.w;
    const x = w.config.xaxis || {};
    const y0 = Array.isArray(w.config.yaxis) ? w.config.yaxis[0] : w.config.yaxis;
    return {
      zoomed: !!w.interact.zoomed,
      x: x.min != null || x.max != null ? { min: x.min, max: x.max } : null,
      y: y0 && (y0.min != null || y0.max != null) ? { min: y0.min, max: y0.max, tickAmount: y0.tickAmount } : null
    };
  }
  /**
   * Merge an axis-window patch into the assembled options' yaxis without
   * losing the user's own entries (D8: yaxis pushes replace wholesale, so the
   * patch is applied onto the already-assembled array in place).
   * @param {Record<string, any>} opts
   * @param {Record<string, any>} patch
   */
  _patchYaxis(opts, patch) {
    const arr = Array.isArray(opts.yaxis) ? opts.yaxis : opts.yaxis ? [opts.yaxis] : [{}];
    arr.forEach((entry) => {
      Object.keys(patch).forEach((k) => {
        if (k === "labels") {
          entry.labels = __spreadValues(__spreadValues({}, entry.labels || {}), patch.labels);
        } else {
          entry[k] = patch[k];
        }
      });
    });
    opts.yaxis = arr;
  }
  /** @param {any} panel */
  _mount(panel) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const t = this.trellis;
      if (!panel.el || panel.chart || panel.noMount) return;
      const stash = panel.viewStash;
      const sharedY = t._yMode() === "shared";
      const independentY = !sharedY;
      const opts = t._assemblePanelOptions(panel.index, {
        noAnimation: !!stash
      });
      const sw = stash && stash.window;
      if (sw && sw.xaxis) {
        opts.xaxis = __spreadProps(__spreadValues({}, opts.xaxis || {}), {
          min: (_a = sw.xaxis.min) != null ? _a : void 0,
          max: (_b = sw.xaxis.max) != null ? _b : void 0
        });
      }
      if (independentY && sw && Array.isArray(sw.yaxis) && sw.yaxis[0]) {
        this._patchYaxis(opts, {
          min: (_c = sw.yaxis[0].min) != null ? _c : void 0,
          max: (_d = sw.yaxis[0].max) != null ? _d : void 0
        });
      }
      const live = this._liveWindow(panel);
      if (live && live.x) {
        opts.xaxis = __spreadProps(__spreadValues({}, opts.xaxis || {}), { min: live.x.min, max: live.x.max });
      }
      if (live && live.y && sharedY) {
        this._patchYaxis(opts, __spreadValues({
          min: live.y.min,
          max: live.y.max
        }, live.y.tickAmount != null ? { tickAmount: live.y.tickAmount } : {}));
      }
      const cw = t.sync.currentWindow;
      if (cw && cw.x) {
        opts.xaxis = __spreadProps(__spreadValues({}, opts.xaxis || {}), { min: cw.x.min, max: cw.x.max });
      }
      if (cw && cw.y && sharedY) {
        this._patchYaxis(opts, __spreadValues({
          min: cw.y.min,
          max: cw.y.max
        }, cw.y.tickAmount != null ? { tickAmount: cw.y.tickAmount } : {}));
      }
      if (independentY && this._gutterFloor > 0) {
        this._patchYaxis(opts, { labels: { minWidth: this._gutterFloor } });
      }
      panel.el.classList.remove("apexcharts-trellis-skeleton");
      const chart = new t._ApexCharts(panel.el, opts);
      panel.chart = chart;
      try {
        yield chart.render();
      } catch (e) {
        panel.chart = null;
        panel.el.classList.add("apexcharts-trellis-skeleton");
        return;
      }
      if (!this.active) return;
      chart.w.interact.zoomed = cw ? !!cw.zoomed : live ? live.zoomed : !!(stash && stash.zoomed);
      t.sync.applyHiddenTo(chart);
      if (stash && stash.annotations && Array.isArray(stash.annotations.dynamic)) {
        const methodOf = {
          xaxis: "addXaxisAnnotation",
          yaxis: "addYaxisAnnotation",
          point: "addPointAnnotation"
        };
        const target = (
          /** @type {any} */
          chart
        );
        stash.annotations.dynamic.forEach((a) => {
          const m = (
            /** @type {any} */
            methodOf[a.kind]
          );
          if (m && typeof target[m] === "function") target[m](a.params, true);
        });
      }
      panel.viewStash = null;
      if (independentY) {
        const wpx = (_h = (_g = (_f = (_e = chart.w) == null ? void 0 : _e.globals) == null ? void 0 : _f.yLabelsCoords) == null ? void 0 : _g[0]) == null ? void 0 : _h.width;
        if (typeof wpx === "number" && isFinite(wpx)) {
          const pad = chart.w.globals.isBarHorizontal ? 0 : t._yLabelPad();
          const tight = Math.max(0, wpx - pad);
          if (tight > this._gutterFloor + GUTTER_EPSILON) {
            this._gutterFloor = tight;
            yield t._pushGutterFloor(this._gutterFloor);
          }
        }
      }
      t.ctx.events.fireEvent("panelMounted", [
        t.ctx,
        { key: panel.key, index: panel.index, chart, remounted: !!stash }
      ]);
    });
  }
  /** @param {any} panel */
  _unmount(panel) {
    if (!panel.chart) return;
    try {
      panel.viewStash = captureViewState(panel.chart.w, panel.chart);
    } catch (e) {
      panel.viewStash = null;
    }
    try {
      panel.chart.destroy();
    } catch (e) {
    }
    panel.chart = null;
    if (panel.el) {
      panel.el.classList.add("apexcharts-trellis-skeleton");
      const ly = this.trellis.layout;
      if (ly) panel.el.style.minHeight = `${ly.panelH}px`;
    }
  }
  /** Disconnect and drop all virtualization state (trellis teardown). */
  stop() {
    this.active = false;
    if (this._io) {
      this._io.disconnect();
      this._io = null;
    }
    this._byCell.clear();
    this._dirty.clear();
    cancelRaf(this._raf);
    this._raf = null;
    this._gutterFloor = 0;
  }
}
class AxisMapping {
  /**
   * Pixels per data-unit on the x-axis. Derived from `minX..maxX` so it is the
   * exact inverse used by both {@link dataXToPx} and {@link pxToDataX}.
   * @param {import('../types/internal').ChartStateW} w
   * @returns {number}
   */
  static xRatio(w) {
    const gw = w.layout.gridWidth || 1;
    return (w.globals.maxX - w.globals.minX) / gw;
  }
  /**
   * Data-x -> pixels from the plot origin (usable as an SVG `x` attribute).
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} dataX
   * @returns {number}
   */
  static dataXToPx(w, dataX) {
    return (dataX - w.globals.minX) / AxisMapping.xRatio(w);
  }
  /**
   * Pixels from the plot origin -> data-x. Feed it `screenX - svgLeft - translateX`.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} px
   * @returns {number}
   */
  static pxToDataX(w, px) {
    return w.globals.minX + px * AxisMapping.xRatio(w);
  }
  /**
   * Client (screen) x -> pixels from the plot origin. The origin is the svg
   * element's left edge plus `translateX`, never the `.apexcharts-grid` box
   * (fact 2 above), so the result does not depend on what the grid happens to
   * render. `svgWidth` is the unscaled width the svg was drawn at, so the ratio
   * against the measured one is the CSS zoom of any container the chart sits in.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} screenX
   * @returns {number}
   */
  static screenXToPlotPx(w, screenX) {
    const baseEl = w.dom.baseEl;
    const svg = baseEl && baseEl.querySelector(".apexcharts-svg");
    if (!svg) return screenX - w.layout.translateX;
    const svgRect = svg.getBoundingClientRect();
    const zoom = w.globals.svgWidth ? svgRect.width / w.globals.svgWidth : 1;
    return (screenX - svgRect.left) / (zoom || 1) - w.layout.translateX;
  }
}
const CURSOR_PAD = 14;
const BAR_FAMILY = ["bar", "column", "rangeBar", "candlestick", "boxPlot"];
class TrellisTooltip {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this.el = null;
    this._raf = 0;
    this._lastEvent = null;
  }
  /**
   * Build the card element and start the hover loop.
   * @param {HTMLElement} elGrid
   * @param {HTMLElement} elWrap
   */
  wire(elGrid, elWrap) {
    const card = BrowserAPIs.createElement("div");
    card.className = "apexcharts-trellis-tooltip apexcharts-theme-light";
    card.setAttribute("role", "status");
    elWrap.appendChild(card);
    this.el = card;
    const loop = () => {
      this._update(elWrap);
      this._raf = this._lastEvent ? requestAnimationFrame(loop) : 0;
    };
    const move = (e) => {
      this._lastEvent = e;
      if (!this._raf) this._raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      this._lastEvent = null;
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
      card.classList.remove("apexcharts-trellis-tooltip-active");
    };
    elGrid.addEventListener("mousemove", move, { passive: true });
    elGrid.addEventListener("mouseleave", leave, { passive: true });
  }
  /**
   * The hovered data-point index in the union x space, or -1 when the
   * pointer is outside the hovered panel's plot. Mirrors the divisor rules
   * of tooltip/Utils.getNearestValues (trellis panels are never combos).
   * @param {any} chart the hovered panel's instance
   * @param {number} clientX
   * @param {number} clientY
   */
  _hoverIndex(chart, clientX, clientY) {
    const w = chart.w;
    const n = w.globals.dataPoints;
    if (!n || n < 1) return -1;
    const gridWidth = w.layout.gridWidth;
    if (!gridWidth) return -1;
    const hoverX = AxisMapping.screenXToPlotPx(w, clientX);
    const edgePad = w.globals.barPadForNumericAxis || 0;
    if (hoverX < -edgePad || hoverX > gridWidth + edgePad) return -1;
    const gridEl = w.dom && w.dom.elGridRect ? w.dom.elGridRect : chart.el && chart.el.querySelector ? chart.el.querySelector(".apexcharts-grid") : null;
    if (gridEl && gridEl.getBoundingClientRect) {
      const r = gridEl.getBoundingClientRect();
      if (r.height && (clientY < r.top || clientY > r.bottom)) return -1;
    }
    const barish = BAR_FAMILY.indexOf(w.config.chart.type) !== -1;
    let j;
    if (barish && !w.config.xaxis.convertedCatToNumeric) {
      j = Math.ceil(hoverX / (gridWidth / n)) - 1;
    } else {
      j = Math.round(hoverX / (gridWidth / Math.max(1, n - 1)));
    }
    return Math.max(0, Math.min(n - 1, j));
  }
  /**
   * One series' formatted value in one panel at index j, or null when there
   * is nothing to show. Formatter chain: tooltip.y formatter, then the yaxis
   * labels formatter, then the raw value.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @param {string} name
   * @param {number} nameIdx trellis-wide series index (formatter arg)
   * @param {number} j
   */
  _valueAt(slice, name, nameIdx, j) {
    var _a, _b;
    const s = slice.series.find((sr) => sr.name === name);
    if (!s || !Array.isArray(s.data)) return null;
    const d = s.data[j];
    if (d === null || d === void 0) return null;
    let y = d;
    if (Array.isArray(d)) y = d[1];
    else if (typeof d === "object") y = d.y;
    if (y === null || y === void 0) return null;
    const cfg = this.trellis.w.config;
    const ttY = Array.isArray((_a = cfg.tooltip) == null ? void 0 : _a.y) ? cfg.tooltip.y[nameIdx] : (_b = cfg.tooltip) == null ? void 0 : _b.y;
    const yaxis0 = Array.isArray(cfg.yaxis) ? cfg.yaxis[0] : cfg.yaxis;
    const formatter = ttY && typeof ttY.formatter === "function" && ttY.formatter || yaxis0 && yaxis0.labels && typeof yaxis0.labels.formatter === "function" && yaxis0.labels.formatter || null;
    const fmt = (v) => {
      if (formatter) {
        try {
          return String(
            formatter(v, { seriesIndex: nameIdx, dataPointIndex: j, w: null })
          );
        } catch (e) {
          return String(v);
        }
      }
      return String(v);
    };
    return Array.isArray(y) ? y.map(fmt).join(" / ") : fmt(y);
  }
  /**
   * One reconcile pass: resolve the hovered panel and index, then one row
   * per panel from the split.
   * @param {HTMLElement} elWrap
   */
  _update(elWrap) {
    const t = this.trellis;
    const card = this.el;
    const e = this._lastEvent;
    if (!card || !e || !t.split) return;
    const cell = e.target && e.target.closest ? e.target.closest(".apexcharts-trellis-cell") : null;
    const hovered = cell ? t.panels.find((p) => p.cellEl === cell) : void 0;
    const j = hovered && hovered.chart ? this._hoverIndex(hovered.chart, e.clientX, e.clientY) : -1;
    if (!hovered || j === -1) {
      card.classList.remove("apexcharts-trellis-tooltip-active");
      return;
    }
    const titleEl = cell ? cell.querySelector(".apexcharts-tooltip-title") : null;
    const title = titleEl && titleEl.textContent ? titleEl.textContent : "";
    const names = t.split.seriesNames;
    const scales = t.scales;
    const rows = [];
    t.split.panels.forEach((slice) => {
      const vals = [];
      names.forEach((name, ni) => {
        const v = this._valueAt(slice, name, ni, j);
        if (v === null) return;
        const color = scales ? scales.colorOf(name) : "#008FFB";
        vals.push(
          `<span class="apexcharts-trellis-tooltip-val"><span class="apexcharts-trellis-tooltip-marker" style="background:${escapeAttr$1(
            color
          )}"></span>${escapeHtml(v)}</span>`
        );
      });
      const isHovered = slice.key === hovered.key;
      rows.push(
        `<div class="apexcharts-trellis-tooltip-row${isHovered ? " apexcharts-trellis-tooltip-row-active" : ""}" data-key="${escapeAttr$1(slice.key)}"><span class="apexcharts-trellis-tooltip-key">${escapeHtml(
          slice.key
        )}</span><span class="apexcharts-trellis-tooltip-vals">${vals.join(
          ""
        )}</span></div>`
      );
    });
    let html = "";
    if (title) {
      html += `<div class="apexcharts-tooltip-title">${escapeHtml(title)}</div>`;
    }
    html += rows.join("");
    card.innerHTML = html;
    card.classList.add("apexcharts-trellis-tooltip-active");
    const wrapRect = elWrap.getBoundingClientRect();
    let x = e.clientX - wrapRect.left + CURSOR_PAD;
    let y = e.clientY - wrapRect.top + CURSOR_PAD;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    if (x + cw > wrapRect.width - 4) x = Math.max(4, x - cw - CURSOR_PAD * 2);
    if (y + ch > wrapRect.height - 4) y = Math.max(4, y - ch - CURSOR_PAD * 2);
    card.style.left = `${Math.round(x)}px`;
    card.style.top = `${Math.round(y)}px`;
  }
  destroy() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    this._lastEvent = null;
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr$1(s) {
  return String(s).replace(/"/g, "&quot;");
}
class TrellisExports {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
  }
  /** Whether panel-level export machinery is available. */
  supported() {
    return !!this.trellis.ctx.exports;
  }
  /**
   * The wrap-relative rect of an element.
   * @param {Element} el
   */
  _rectIn(el) {
    const wrap = (
      /** @type {HTMLElement} */
      this.trellis.elWrap
    );
    const w = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      x: r.left - w.left,
      y: r.top - w.top,
      w: r.width,
      h: r.height
    };
  }
  /** Export surface size = the wrap's own box. */
  _size() {
    const wrap = (
      /** @type {HTMLElement} */
      this.trellis.elWrap
    );
    const r = wrap.getBoundingClientRect();
    return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
  }
  /** The opaque base color, from any mounted panel's own resolver. */
  _background() {
    const mounted = this.trellis.panels.find((p) => p.chart);
    const ex = mounted && mounted.chart.exports;
    if (ex && typeof ex.resolveExportBackground === "function") {
      const bg = ex.resolveExportBackground();
      if (bg && bg !== "transparent") return bg;
    }
    return "#fff";
  }
  /** Text pieces to compose: title + one header per cell (+ legend items). */
  _chromeTexts() {
    const t = this.trellis;
    const texts = [];
    const push = (el, align) => {
      if (!el || !el.textContent) return;
      const rect = this._rectIn(el);
      const cs = getComputedStyle(
        /** @type {HTMLElement} */
        el
      );
      texts.push({
        text: el.textContent,
        x: align === "center" ? rect.x + rect.w / 2 : rect.x,
        y: rect.y + rect.h / 2,
        font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
        fontSize: parseFloat(cs.fontSize) || 12,
        color: cs.color || "#373d3f",
        align
      });
    };
    push(t.chrome.elTitle, "left");
    t.panels.forEach((p) => {
      if (!p.cellEl) return;
      push(p.cellEl.querySelector(".apexcharts-trellis-header"), "center");
    });
    if (t.chrome.elLegend) {
      t.chrome.elLegend.querySelectorAll(".apexcharts-legend-text").forEach((el) => push(el, "left"));
    }
    return texts;
  }
  /** Legend marker dots (color + rect), for both compose targets. */
  _legendMarkers() {
    const legend = this.trellis.chrome.elLegend;
    if (!legend) return [];
    return Array.from(
      legend.querySelectorAll(".apexcharts-legend-marker"),
      (el) => ({
        rect: this._rectIn(el),
        color: (
          /** @type {HTMLElement} */
          el.style.background || /** @type {HTMLElement} */
          el.style.backgroundColor || "#008FFB"
        )
      })
    );
  }
  /**
   * One PNG of the whole grid.
   * @param {{ scale?: number }} [options]
   * @returns {Promise<{ imgURI: string }>}
   */
  dataURI() {
    return __async(this, arguments, function* (options = {}) {
      const t = this.trellis;
      const scale = options.scale || 1;
      const size = this._size();
      const canvas = document.createElement("canvas");
      canvas.width = size.w * scale;
      canvas.height = size.h * scale;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return { imgURI: "" };
      const ctx = (
        /** @type {CanvasRenderingContext2D} */
        ctx2d
      );
      ctx.scale(scale, scale);
      ctx.fillStyle = this._background();
      ctx.fillRect(0, 0, size.w, size.h);
      for (const p of t.panels) {
        if (!p.el) continue;
        const rect = this._rectIn(p.el);
        if (!p.chart) {
          ctx.fillStyle = "rgba(120, 120, 120, 0.06)";
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          continue;
        }
        const { imgURI } = yield p.chart.dataURI({ scale });
        if (!imgURI) continue;
        const img = yield loadImage(imgURI);
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      }
      for (const piece of this._chromeTexts()) {
        ctx.font = piece.font;
        ctx.fillStyle = piece.color;
        ctx.textAlign = piece.align;
        ctx.textBaseline = "middle";
        ctx.fillText(piece.text, piece.x, piece.y);
      }
      for (const m of this._legendMarkers()) {
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(
          m.rect.x + m.rect.w / 2,
          m.rect.y + m.rect.h / 2,
          Math.max(2, m.rect.w / 2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      return { imgURI: canvas.toDataURL("image/png") };
    });
  }
  /**
   * One SVG of the whole grid: nested per-panel SVGs (fonts already inlined
   * by each panel's own getSvgString) plus text chrome.
   * @returns {Promise<string>}
   */
  svgString() {
    return __async(this, null, function* () {
      const t = this.trellis;
      const size = this._size();
      const parts = [];
      parts.push(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">`
      );
      parts.push(
        `<rect width="${size.w}" height="${size.h}" fill="${this._background()}"/>`
      );
      for (const p of t.panels) {
        if (!p.el) continue;
        const rect = this._rectIn(p.el);
        if (!p.chart) {
          parts.push(
            `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgba(120,120,120,0.06)" rx="4"/>`
          );
          continue;
        }
        const svg = yield p.chart.getSvgString();
        parts.push(
          `<g transform="translate(${rect.x}, ${rect.y})">${svg}</g>`
        );
      }
      for (const piece of this._chromeTexts()) {
        const anchor = piece.align === "center" ? "middle" : "start";
        parts.push(
          `<text x="${piece.x}" y="${piece.y}" text-anchor="${anchor}" dominant-baseline="central" style="font:${escapeAttr(
            piece.font
          )};fill:${escapeAttr(piece.color)}">${escapeXml(piece.text)}</text>`
        );
      }
      for (const m of this._legendMarkers()) {
        parts.push(
          `<circle cx="${m.rect.x + m.rect.w / 2}" cy="${m.rect.y + m.rect.h / 2}" r="${Math.max(2, m.rect.w / 2)}" fill="${escapeAttr(m.color)}"/>`
        );
      }
      parts.push("</svg>");
      return parts.join("");
    });
  }
  /**
   * One CSV for the whole grid, wide form: x, facet, then one column per
   * series name. Rows are (panel x union-x), aligned by the split, so ragged
   * panels emit explicit blanks.
   * @returns {string}
   */
  csv() {
    var _a, _b, _c;
    const t = this.trellis;
    const split2 = t.split;
    if (!split2) return "";
    const w = t.w;
    const delimiter = ((_c = (_b = (_a = w.config.chart.toolbar) == null ? void 0 : _a.export) == null ? void 0 : _b.csv) == null ? void 0 : _c.columnDelimiter) || ",";
    const isDatetime = w.config.xaxis && w.config.xaxis.type === "datetime";
    const cell = (v) => {
      if (v === null || v === void 0) return "";
      const s = String(v);
      return /[",\n]/.test(s) || s.indexOf(delimiter) !== -1 ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const xOut = (x) => isDatetime && typeof x === "number" ? new Date(x).toISOString() : x;
    const names = split2.seriesNames;
    const lines = [
      ["x", "facet", ...names].map(cell).join(delimiter)
    ];
    split2.panels.forEach((slice) => {
      split2.unionX.forEach((x, i) => {
        const row = [xOut(x), slice.key];
        names.forEach((name) => {
          const s = slice.series.find((sr) => sr.name === name);
          if (!s || !Array.isArray(s.data)) {
            row.push("");
            return;
          }
          const d = s.data[i];
          let y = d;
          if (Array.isArray(d)) y = d[1];
          else if (d && typeof d === "object") y = d.y;
          row.push(Array.isArray(y) ? y.join("|") : y);
        });
        lines.push(row.map(cell).join(delimiter));
      });
    });
    return lines.join("\n");
  }
  /** @param {'png'|'svg'|'csv'} kind */
  download(kind) {
    return __async(this, null, function* () {
      var _a;
      const t = this.trellis;
      const exportCfg = ((_a = t.w.config.chart.toolbar) == null ? void 0 : _a.export) || {};
      const fallback = String(t.w.globals.chartID || "trellis");
      if (kind === "png") {
        const { imgURI } = yield this.dataURI();
        triggerDownload(imgURI, exportCfg.png && exportCfg.png.filename || fallback, ".png");
      } else if (kind === "svg") {
        const svg = yield this.svgString();
        const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        triggerDownload(uri, exportCfg.svg && exportCfg.svg.filename || fallback, ".svg");
      } else {
        const uri = "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + this.csv());
        triggerDownload(uri, exportCfg.csv && exportCfg.csv.filename || fallback, ".csv");
      }
    });
  }
}
function loadImage(src) {
  return new Promise((resolve2, reject) => {
    const img = new Image();
    img.onload = () => resolve2(img);
    img.onerror = reject;
    img.src = src;
  });
}
function triggerDownload(href, filename, ext) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename + ext;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s) {
  return String(s).replace(/"/g, "&quot;");
}
const EAGER_PANEL_BUDGET = 64;
const HARD_PANEL_WARN = 256;
const ANIMATION_PANEL_BUDGET = 16;
const Y_LABEL_PAD = 10;
const PANEL_PAD_RECLAIM_TOP = 12;
const PANEL_PAD_RECLAIM_BOTTOM = 7;
const PANEL_PAD_RECLAIM_BOTTOM_DATETIME = 2;
const COMPACT_TOOLTIP_PANEL_H = 120;
const TYPE_VETO = {
  treemap: "trellis does not support treemap: area encoding needs room a panel cannot give. Rendering a single chart.",
  sunburst: "trellis does not support sunburst: its labels are illegible at panel size. Rendering a single chart.",
  unit: "the unit type has its own small-multiples mode (plotOptions.unit.grid.split), which beats a trellis of unit charts. Rendering a single chart."
};
function choosePanelRenderer(split2, hostConfig, userOpts, canvasRegistered) {
  if (userOpts && userOpts.chart && userOpts.chart.renderer) return null;
  if (!canvasRegistered) return null;
  const shim = {
    config: {
      series: split2.panels.reduce(
        (acc, p) => acc.concat(p.series),
        []
      ),
      chart: { type: hostConfig.chart.type },
      markers: hostConfig.markers,
      dataLabels: hostConfig.dataLabels,
      fill: hostConfig.fill,
      plotOptions: hostConfig.plotOptions,
      states: hostConfig.states
    }
  };
  if (hasCanvasUnsupportedFeature(shim)) return null;
  const threshold = hostConfig.chart.rendererThreshold || 8e3;
  return computeMarkCount(shim) >= threshold ? "canvas" : null;
}
function scopeAnnotations(annotations, key) {
  if (!annotations || typeof annotations !== "object") return annotations;
  const out = __spreadValues({}, annotations);
  for (const kind of ["yaxis", "xaxis", "points", "texts", "images"]) {
    const list = out[kind];
    if (!Array.isArray(list)) continue;
    out[kind] = list.filter((item) => {
      if (!item || item.scope === void 0 || item.scope === null) {
        return true;
      }
      if (item.scope === "trellis") return true;
      if (Array.isArray(item.scope)) {
        return item.scope.map(String).indexOf(key) !== -1;
      }
      return String(item.scope) === key;
    }).map((item) => {
      if (!item || item.scope === void 0) return item;
      const copy = __spreadValues({}, item);
      delete copy.scope;
      return copy;
    });
  }
  return out;
}
class Trellis {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.panels = [];
    this._stripEls = [];
    this.split = null;
    this.scales = null;
    this.layout = null;
    this.cfg = {};
    this.sync = new TrellisSync(this);
    this.chrome = new TrellisChrome(this);
    this.virtual = new TrellisVirtual(this);
    this.exports = new TrellisExports(this);
    this.gridTooltip = null;
    this._promotedKey = null;
    this._ApexCharts = _core__default;
    this._virtualActive = false;
    this._panelRenderer = null;
    this._yLabelDecimals = 0;
    this.elWrap = null;
    this.elGrid = null;
    this._mounted = false;
    this._rendering = false;
    this._raf = 0;
    this._lastWidth = 0;
    this._resizeHandler = this._onContainerResize.bind(this);
    this.autoScaleYaxis = false;
    this._elChromeTop = null;
    this._vetoWarned = false;
    this._noKeyWarned = false;
    this._frames = null;
  }
  /** Whether this chart is a trellis host: `by` (1-D) or `row`/`column`
   *  (2-D, P4) is the switch. A vetoed chart type (P5) returns false, which
   *  makes EVERY host seam (render delegation, update branches, exports,
   *  promotion) fall back to the single-chart pipeline at once. */
  isActive() {
    var _a;
    const t = this.w.config.trellis;
    if (!(t && (t.by || t.row || t.column))) return false;
    const type = (_a = this.w.config.chart) == null ? void 0 : _a.type;
    if (type && TYPE_VETO[type]) {
      if (!this._vetoWarned) {
        this._vetoWarned = true;
        console.warn(`ApexCharts: ${TYPE_VETO[type]}`);
      }
      return false;
    }
    if (t.by && !t.row && !t.column && !Array.isArray(t.data)) {
      const list = this.w.config.series || [];
      const anyKeyed = list.some(
        (s, i) => keyOf(s, i, t.by) !== null
      );
      if (!anyKeyed) {
        if (!this._noKeyWarned) {
          this._noKeyWarned = true;
          const named = typeof t.by === "function" ? "the `trellis.by` function returned no key for any series" : `no series carries the \`trellis.by\` key '${t.by}'`;
          console.warn(
            `ApexCharts: ${named}; there is nothing to split. Rendering as a single chart.`
          );
        }
        return false;
      }
    }
    return true;
  }
  /** The layout-facing config: a 2-D grid has a FIXED column count (one per
   *  column key; responsive recolumning would break the row/column
   *  semantics), so panels shrink instead of wrapping. */
  _layoutCfg() {
    if (this.split && this.split.mode === "2d" && this.split.colKeys) {
      return __spreadProps(__spreadValues({}, this.cfg), { columns: this.split.colKeys.length });
    }
    return this.cfg;
  }
  /**
   * The EFFECTIVE y scale mode: the user's, unless a type frame (P5) forced
   * 'shared' because group modes are meaningless for the chart type.
   * @returns {string}
   */
  _yMode() {
    var _a;
    if (this._frames && this._frames.forceSharedY) return "shared";
    return ((_a = this.cfg.scales) == null ? void 0 : _a.y) || "shared";
  }
  /**
   * The y bounds one panel should carry, per the scales mode: the shared
   * union, its row's union ('independent-row'), its column's union
   * ('independent-column'), or none ('independent'). Types whose y axis does
   * not carry the data values (heatmap rows, the radial family) never get a
   * yaxis push at all (P5): the frame's own channel is the shared one.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @returns {{ min: number, max: number, tickAmount: number } | null}
   */
  _yBoundsFor(slice) {
    var _a, _b;
    const scales = this.scales;
    if (!scales) return null;
    if (this._frames && this._frames.skipYaxisPush) return null;
    const yMode = this._yMode();
    if (yMode === "shared") return scales.y;
    if (yMode === "independent-row" && scales.rowY) {
      return scales.rowY.get((_a = slice.rowKey) != null ? _a : "") || null;
    }
    if (yMode === "independent-column" && scales.colY) {
      return scales.colY.get((_b = slice.colKey) != null ? _b : "") || null;
    }
    return null;
  }
  /**
   * Horizontal bars measure along x, and the library reads that value axis
   * from `xaxis` (Scales.setYScaleForIndex switches on `isBarHorizontal`),
   * so the shared bounds have to be pushed THERE as well: `yaxis` alone
   * seeds the domain but the panel then re-nices it from its own data, which
   * silently discards the trellis's tick target.
   *
   * rangeBar is excluded on purpose: its horizontal value axis carries dates,
   * and a nice-number domain is meaningless on a timeline.
   * @returns {boolean}
   */
  _valueAxisIsX() {
    var _a, _b;
    const cnf = this.w.config;
    return ["bar", "boxPlot", "violin"].includes(cnf.chart.type) && !!((_b = (_a = cnf.plotOptions) == null ? void 0 : _a.bar) == null ? void 0 : _b.horizontal);
  }
  /**
   * The value-axis patch for a horizontal panel. An explicit user
   * `xaxis.tickAmount` wins: the count is theirs to set, and the panels
   * still agree because they all re-nice from the SAME pushed bounds.
   * @param {{ min: number, max: number, tickAmount: number }} bounds
   * @returns {Record<string, any>}
   */
  _valueAxisXPatch(bounds) {
    var _a, _b;
    const patch = { min: bounds.min, max: bounds.max };
    if (typeof ((_b = (_a = this.ctx.opts) == null ? void 0 : _a.xaxis) == null ? void 0 : _b.tickAmount) !== "number") {
      patch.tickAmount = bounds.tickAmount;
    }
    return patch;
  }
  /** @returns {string} namespaced panel group id */
  _groupId() {
    return `${this.w.globals.chartID}-tg`;
  }
  /**
   * Render the whole trellis into the host element. Called by the host's
   * render() INSTEAD of the normal create()/mount() pipeline.
   * @returns {Promise<void>}
   */
  render() {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const w = this.w;
      if (this._mounted || this._rendering) return;
      if (!Environment.isBrowser()) {
        console.warn(
          "ApexCharts: trellis rendering is browser-only in this version; SSR hosts render nothing."
        );
        return;
      }
      this._rendering = true;
      try {
        this.cfg = w.config.trellis || {};
        this.autoScaleYaxis = !!((_b = (_a = w.config.chart) == null ? void 0 : _a.zoom) == null ? void 0 : _b.autoScaleYaxis);
        let inputSeries = w.config.series || [];
        if (Array.isArray(this.cfg.data)) {
          const pivoted = pivotRows(this.cfg.data, this.cfg);
          pivoted.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`));
          if (pivoted.series.length) {
            if (inputSeries.length) {
              console.warn(
                "ApexCharts: trellis received both `series` and `trellis.data`; using trellis.data."
              );
            }
            inputSeries = pivoted.series;
          }
        }
        const split$1 = split(inputSeries, this.cfg);
        this.split = split$1;
        split$1.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`));
        if (!split$1.panels.length) return;
        if (split$1.dropped > 0) {
          console.warn(
            `ApexCharts: trellis rendered ${split$1.panels.length} panels; ${split$1.dropped} more hidden by trellis.limit.`
          );
        }
        const vMode = (_c = this.cfg.virtualize) != null ? _c : "auto";
        let useVirtual = vMode === true || vMode === "auto" && split$1.panels.length > EAGER_PANEL_BUDGET;
        if (useVirtual && !TrellisVirtual.supported()) {
          console.warn(
            "ApexCharts: trellis virtualization needs IntersectionObserver; rendering eagerly."
          );
          useVirtual = false;
        }
        this._virtualActive = useVirtual;
        if (!useVirtual && split$1.panels.length > EAGER_PANEL_BUDGET) {
          console.warn(
            `ApexCharts: trellis with ${split$1.panels.length} panels renders eagerly; set trellis.virtualize (or trellis.limit).`
          );
        }
        if (split$1.panels.length > HARD_PANEL_WARN) {
          console.warn(
            `ApexCharts: ${split$1.panels.length} trellis panels is a lot to read at once; consider trellis.limit.`
          );
        }
        const frameType = w.config.chart.requestedType === "histogram" ? "histogram" : w.config.chart.type;
        this._frames = buildTypeFrames(split$1, this.cfg, w.config, frameType);
        this._frames.warnings.forEach(
          (msg) => console.warn(`ApexCharts: ${msg}`)
        );
        this._yLabelDecimals = this._frames.yExtentOverride ? 0 : maxYDecimals(split$1.panels);
        const scalesCfg = this._yMode() !== (((_d = this.cfg.scales) == null ? void 0 : _d.y) || "shared") ? __spreadProps(__spreadValues({}, this.cfg), { scales: __spreadProps(__spreadValues({}, this.cfg.scales || {}), { y: this._yMode() }) }) : this.cfg;
        this.scales = resolve(split$1, scalesCfg, {
          chartType: w.config.chart.type,
          userColors: this.ctx.opts && this.ctx.opts.colors,
          yExtentOverride: this._frames.yExtentOverride
        });
        this._panelRenderer = choosePanelRenderer(
          split$1,
          w.config,
          this.ctx.opts,
          RendererController._rendererRegistry.has("canvas")
        );
        this._buildSkeleton();
        const width = this._containerWidth();
        this._lastWidth = width;
        this.layout = compute({
          panelCount: split$1.panels.length,
          containerWidth: width,
          cfg: this._layoutCfg(),
          hostHeight: this._hostHeight()
        });
        this._applyGridStyle();
        this._buildCells();
        const independentY = this._yMode() !== "shared";
        const wrap = (
          /** @type {HTMLElement} */
          this.elWrap
        );
        if (useVirtual) {
          this.virtual.start();
        } else {
          if (independentY) wrap.style.visibility = "hidden";
          for (let i = 0; i < this.panels.length; i++) {
            const panel = this.panels[i];
            if (panel.noMount) continue;
            const opts = this._assemblePanelOptions(panel.index);
            const chart = new _core__default(
              /** @type {HTMLElement} */
              panel.el,
              opts
            );
            panel.chart = chart;
            yield chart.render();
            this.ctx.events.fireEvent("panelMounted", [
              this.ctx,
              { key: panel.key, index: panel.index, chart }
            ]);
          }
          if (independentY) {
            yield this._alignGutters();
            wrap.style.visibility = "";
          }
        }
        this.chrome.buildTitle(
          /** @type {HTMLElement} */
          this._elChromeTop
        );
        this.chrome.buildToolbar(wrap);
        this.chrome.buildLegend(wrap);
        this.sync.wireCrosshairs(
          /** @type {HTMLElement} */
          this.elGrid
        );
        if ((this.cfg.tooltip || "panel") === "grid") {
          this.gridTooltip = new TrellisTooltip(this);
          this.gridTooltip.wire(
            /** @type {HTMLElement} */
            this.elGrid,
            wrap
          );
        }
        addResizeListener(
          /** @type {HTMLElement} */
          this.ctx.el,
          this._resizeHandler
        );
        this._mounted = true;
        if (!useVirtual) w.globals.animationEnded = true;
        this.ctx.events.fireEvent("trellisMounted", [
          this.ctx,
          { panels: this.getPanels() }
        ]);
      } finally {
        this._rendering = false;
      }
    });
  }
  /** Container width the grid may use. */
  _containerWidth() {
    const el = (
      /** @type {HTMLElement} */
      this.ctx.el
    );
    const rect = el.getBoundingClientRect();
    return rect.width || el.clientWidth || 800;
  }
  /** Explicit numeric host height, if the user set one. */
  _hostHeight() {
    const h = this.w.config.chart && this.w.config.chart.height;
    const n = typeof h === "string" ? parseFloat(h) : h;
    return typeof n === "number" && isFinite(n) && n > 0 && String(h) !== "auto" ? n : void 0;
  }
  _buildSkeleton() {
    const el = (
      /** @type {HTMLElement} */
      this.ctx.el
    );
    const wrap = BrowserAPIs.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "div"
    );
    wrap.className = "apexcharts-trellis";
    if (this.split && this.split.mode === "2d") {
      wrap.classList.add("apexcharts-trellis-2d");
    }
    wrap.id = `apexcharts-trellis${this.w.globals.chartID}`;
    wrap.setAttribute("data-tooltip-mode", this.cfg.tooltip || "panel");
    const chromeTop = BrowserAPIs.createElement("div");
    chromeTop.className = "apexcharts-trellis-chrome";
    wrap.appendChild(chromeTop);
    this._elChromeTop = chromeTop;
    const grid = BrowserAPIs.createElement("div");
    grid.className = "apexcharts-trellis-grid";
    wrap.appendChild(grid);
    el.appendChild(wrap);
    this.elWrap = wrap;
    this.elGrid = grid;
    this.w.dom.baseEl = el;
    this.w.dom.elWrap = wrap;
  }
  _applyGridStyle() {
    var _a;
    const grid = (
      /** @type {HTMLElement} */
      this.elGrid
    );
    const ly = (
      /** @type {import('./TrellisLayout').TrellisLayoutResult} */
      this.layout
    );
    grid.style.display = "grid";
    const is2d = this.split && this.split.mode === "2d";
    const stripped = is2d && ((_a = this.cfg.header) == null ? void 0 : _a.show) !== false;
    grid.style.gridTemplateColumns = stripped ? `auto repeat(${ly.cols}, minmax(0, 1fr))` : `repeat(${ly.cols}, minmax(0, 1fr))`;
    grid.style.gap = `${ly.gap}px`;
  }
  _buildCells() {
    var _a;
    const grid = (
      /** @type {HTMLElement} */
      this.elGrid
    );
    const split2 = (
      /** @type {import('./TrellisSplit').TrellisSplitResult} */
      this.split
    );
    const ly = (
      /** @type {import('./TrellisLayout').TrellisLayoutResult} */
      this.layout
    );
    const is2d = split2.mode === "2d";
    const stripped = is2d && ((_a = this.cfg.header) == null ? void 0 : _a.show) !== false;
    this._stripEls = [];
    const emptyMode = this.cfg.emptyPanels || "placeholder";
    if (stripped) {
      const corner = BrowserAPIs.createElement("div");
      corner.className = "apexcharts-trellis-corner";
      grid.appendChild(corner);
      this._stripEls.push(corner);
      (split2.colKeys || []).forEach((ck, ci) => {
        const el = this.chrome.stripEl("column", ck, {
          index: ci,
          count: (split2.colKeys || []).length
        });
        grid.appendChild(el);
        this._stripEls.push(el);
      });
    }
    this.panels = [];
    split2.panels.forEach((slice, i) => {
      var _a2;
      if (stripped && i % ly.cols === 0) {
        const ri = Math.floor(i / ly.cols);
        const el = this.chrome.stripEl(
          "row",
          (_a2 = (split2.rowKeys || [])[ri]) != null ? _a2 : "",
          { index: ri, count: (split2.rowKeys || []).length }
        );
        grid.appendChild(el);
        this._stripEls.push(el);
      }
      const cell = BrowserAPIs.createElement("div");
      cell.className = "apexcharts-trellis-cell";
      cell.setAttribute("data-key", slice.key);
      this._applyCellMutes(cell, ly.cells[i]);
      if (!is2d) {
        this.chrome.buildHeader(cell, slice.key, {
          index: i,
          count: split2.panels.length
        });
      }
      const mount = BrowserAPIs.createElement("div");
      mount.className = "apexcharts-trellis-panel";
      if (this._virtualActive) {
        mount.classList.add("apexcharts-trellis-skeleton");
        mount.style.minHeight = `${ly.panelH}px`;
      }
      cell.appendChild(mount);
      const noMount = slice.empty && emptyMode !== "placeholder";
      if (slice.empty) {
        cell.classList.add("apexcharts-trellis-cell-empty");
        if (emptyMode === "hide") {
          cell.classList.add("apexcharts-trellis-cell-hidden");
        } else if (emptyMode === "skip") {
          mount.classList.add("apexcharts-trellis-skeleton");
          mount.style.minHeight = `${ly.panelH}px`;
        } else {
          const label = BrowserAPIs.createElement("div");
          label.className = "apexcharts-trellis-empty-label";
          label.textContent = this.w.config.noData && this.w.config.noData.text || "no data";
          cell.appendChild(label);
        }
      }
      grid.appendChild(cell);
      this.panels.push({
        key: slice.key,
        index: i,
        el: mount,
        cellEl: cell,
        chart: null,
        empty: slice.empty,
        noMount
      });
    });
  }
  /**
   * Edge-label policy as CSS classes: a muted cell hides its labels' INK
   * (opacity), never their SPACE, so every panel keeps the identical plot
   * rectangle and a policy flip on resize re-renders nothing (22a).
   * @param {HTMLElement} cell
   * @param {import('./TrellisLayout').TrellisCell} c
   */
  _applyCellMutes(cell, c) {
    cell.classList.toggle("apexcharts-trellis-mute-x", !c.showXLabels);
    cell.classList.toggle("apexcharts-trellis-mute-y", !c.showYLabels);
  }
  /**
   * Build one panel's full options object: the user's own options (functions
   * preserved by reference), minus what the trellis owns, plus the shared
   * scale/color/geometry overrides. `trellis.panel(key, meta)` is applied
   * last, so a caller can override anything per panel.
   * @param {number} i
   * @param {{ noAnimation?: boolean }} [flags] noAnimation forces animations
   *   off regardless of policy (virtualized REMOUNTS: scrolling back must not
   *   replay the draw animation).
   * @returns {Record<string, any>}
   */
  _assemblePanelOptions(i, { noAnimation = false } = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    const w = this.w;
    const split2 = (
      /** @type {import('./TrellisSplit').TrellisSplitResult} */
      this.split
    );
    const scales = (
      /** @type {ReturnType<typeof TrellisScales.resolve>} */
      this.scales
    );
    const ly = (
      /** @type {import('./TrellisLayout').TrellisLayoutResult} */
      this.layout
    );
    const slice = split2.panels[i];
    const base = Utils.clone(this.ctx.opts || {});
    delete base.trellis;
    delete base.series;
    delete base.responsive;
    if (base.annotations) {
      base.annotations = scopeAnnotations(base.annotations, slice.key);
    }
    const userChart = base.chart || {};
    const userEvents = userChart.events || {};
    const hostId = w.globals.chartID;
    const userAnimations = (_c = (_b = (_a = this.ctx.opts) == null ? void 0 : _a.chart) == null ? void 0 : _b.animations) == null ? void 0 : _c.enabled;
    const animationsOff = noAnimation || split2.panels.length > ANIMATION_PANEL_BUDGET && userAnimations === void 0;
    const isPlaceholder = slice.empty && (this.cfg.emptyPanels || "placeholder") === "placeholder";
    let panelSeries = isPlaceholder ? [placeholderSeries(split2, { chartType: w.config.chart.type })] : slice.series;
    const isValueSeries = ["pie", "donut", "polarArea", "radialBar"].includes(
      w.config.chart.type
    );
    if (isValueSeries) {
      panelSeries = panelSeries.flatMap(
        (s) => Array.isArray(s.data) ? s.data : []
      ).map(
        (v) => typeof v === "number" && isFinite(v) ? v : 0
      );
    }
    const overrides = __spreadValues(__spreadValues(__spreadProps(__spreadValues({
      chart: __spreadProps(__spreadValues(__spreadValues({
        id: `${hostId}-tp${i}`,
        // Group membership is unconditional: it powers tooltip and crosshair
        // sync, not only zoom. zoom:'none' disables the zoom TOOL below.
        group: this._groupId(),
        height: ly.panelH,
        width: "100%",
        // The trellis's single ResizeObserver is the only relayout owner
        // (22a Q4); a panel must never self-rerender on a resize tick. Printing
        // is the same rule: a panel re-laying itself out to a printable width
        // would tear the grid apart, since its position and size are the
        // orchestrator's to decide.
        redrawOnParentResize: false,
        redrawOnWindowResize: false,
        print: { enabled: false },
        // Core pads the chart's container by parentHeightOffset (default 15)
        // via an inline min-height; inside a height-budgeted grid cell that
        // slack de-syncs mounted cells from the skeleton reserve (the grid
        // gap is the breathing room here).
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: {
          enabled: this.cfg.zoom !== "none"
        }
      }, animationsOff ? { animations: { enabled: false } } : {}), this._panelRenderer ? { renderer: this._panelRenderer } : {}), {
        events: __spreadProps(__spreadValues({}, userEvents), {
          zoomed: this.sync.makeZoomedHandler(userEvents.zoomed),
          scrolled: this.sync.makeScrolledHandler(userEvents.scrolled)
        })
      }),
      series: panelSeries
    }, isValueSeries ? {} : {
      colors: panelSeries.map(
        (s) => scales.colorOf(s.name)
      )
    }), {
      // Headers replace per-panel titles; the shared legend replaces per-panel
      // legends. margin: 0 and floating both matter: an empty-string title
      // still charges its margin to the top gutter in Dimensions, and its
      // empty element still measures height + 5 unless floating.
      title: { text: "", margin: 0, floating: true },
      subtitle: { text: "", margin: 0, floating: true },
      legend: { show: false }
    }), isPlaceholder ? { tooltip: { enabled: false } } : {}), ly.panelH < COMPACT_TOOLTIP_PANEL_H && this.cfg.tooltip !== "grid" && typeof ((_e = (_d = this.ctx.opts) == null ? void 0 : _d.tooltip) == null ? void 0 : _e.compact) !== "boolean" ? { tooltip: { compact: true } } : {});
    const gridlessTypes = ["pie", "donut", "polarArea", "radialBar", "radar", "treemap"];
    if (!((_f = userChart.sparkline) == null ? void 0 : _f.enabled) && !gridlessTypes.includes(w.config.chart.type)) {
      const userPad = base.grid && base.grid.padding || {};
      const reclaimBottom = ((_h = (_g = this.ctx.opts) == null ? void 0 : _g.xaxis) == null ? void 0 : _h.type) === "datetime" ? PANEL_PAD_RECLAIM_BOTTOM_DATETIME : PANEL_PAD_RECLAIM_BOTTOM;
      overrides.grid = {
        padding: {
          top: (typeof userPad.top === "number" ? userPad.top : 0) - PANEL_PAD_RECLAIM_TOP,
          bottom: (typeof userPad.bottom === "number" ? userPad.bottom : 0) - reclaimBottom
        }
      };
    }
    const valueAxisIsX = this._valueAxisIsX();
    if (scales.x && !valueAxisIsX) {
      overrides.xaxis = { min: scales.x.min, max: scales.x.max };
    }
    const yBounds = this._yBoundsFor(slice);
    if (yBounds) {
      const userYaxisRaw = Array.isArray((_i = this.ctx.opts) == null ? void 0 : _i.yaxis) ? this.ctx.opts.yaxis[0] : (_j = this.ctx.opts) == null ? void 0 : _j.yaxis;
      const userYaxis = Array.isArray(base.yaxis) ? base.yaxis[0] : base.yaxis;
      let labelsPatch = {};
      if (typeof ((_k = userYaxisRaw == null ? void 0 : userYaxisRaw.labels) == null ? void 0 : _k.formatter) !== "function") {
        const step = (yBounds.max - yBounds.min) / Math.max(1, yBounds.tickAmount);
        const digits = Math.max(
          this._yLabelDecimals,
          decimalCount(step)
        );
        labelsPatch = {
          labels: {
            formatter: (val) => typeof val === "number" && isFinite(val) ? val.toFixed(digits) : val
          }
        };
      }
      overrides.yaxis = Utils.extend(userYaxis || {}, __spreadValues({
        min: yBounds.min,
        max: yBounds.max,
        tickAmount: yBounds.tickAmount
      }, labelsPatch));
      delete base.yaxis;
      if (valueAxisIsX) {
        overrides.xaxis = Utils.extend(
          overrides.xaxis || {},
          this._valueAxisXPatch(yBounds)
        );
      }
    }
    const frames = this._frames;
    if (frames && frames.plotOptions) {
      overrides.plotOptions = Utils.clone(frames.plotOptions);
    }
    if (frames && frames.pieScaleOf) {
      const ratio = frames.pieScaleOf(slice.key);
      if (ratio !== null) {
        const userScale = (_n = (_m = (_l = this.ctx.opts) == null ? void 0 : _l.plotOptions) == null ? void 0 : _m.pie) == null ? void 0 : _n.customScale;
        overrides.plotOptions = Utils.extend(overrides.plotOptions || {}, {
          pie: {
            customScale: ratio * (typeof userScale === "number" ? userScale : 1)
          }
        });
      }
    }
    let opts = Utils.extend(base, overrides);
    if (typeof this.cfg.panel === "function") {
      const extra = this.cfg.panel(slice.key, { index: i, seriesNames: slice.seriesNames });
      if (extra && typeof extra === "object") opts = Utils.extend(opts, extra);
    }
    return opts;
  }
  /**
   * Independent-y gutter alignment (22a Q2): measure every panel's label
   * gutter, push the max as a shared `yaxis.labels.minWidth`. `max()` of the
   * measured widths makes the panels' `max(minWidth, measured)` resolve to
   * the same constant everywhere, so one iteration is exact by construction.
   * @returns {Promise<void>}
   */
  _alignGutters() {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const widths = this.panels.map((p) => {
        var _a2, _b2, _c2, _d2, _e;
        return (_e = (_d2 = (_c2 = (_b2 = (_a2 = p.chart) == null ? void 0 : _a2.w) == null ? void 0 : _b2.globals) == null ? void 0 : _c2.yLabelsCoords) == null ? void 0 : _d2[0]) == null ? void 0 : _e.width;
      }).filter((v) => typeof v === "number" && isFinite(v));
      if (!widths.length) return;
      const isHorizontal = !!((_d = (_c = (_b = (_a = this.panels[0]) == null ? void 0 : _a.chart) == null ? void 0 : _b.w) == null ? void 0 : _c.globals) == null ? void 0 : _d.isBarHorizontal);
      const labelPad = isHorizontal ? 0 : Y_LABEL_PAD;
      const minWidth = Math.max(0, Math.max(...widths) - labelPad);
      yield this._pushGutterFloor(minWidth);
    });
  }
  /** The vertical-axis label pad inside the yLabelsCoords width (22a Q2). */
  _yLabelPad() {
    return Y_LABEL_PAD;
  }
  /**
   * Push one shared gutter floor (`yaxis.labels.minWidth`) to every MOUNTED
   * panel. Shared by the eager one-pass alignment and the virtualized
   * monotone floor (TrellisVirtual bumps it when a newly mounted panel
   * measures wider).
   * @param {number} minWidth
   * @returns {Promise<void>}
   */
  _pushGutterFloor(minWidth) {
    return __async(this, null, function* () {
      for (const p of this.panels) {
        if (!p.chart) continue;
        yield p.chart.updateOptions(
          { yaxis: yaxisPayload(p.chart, { labels: { minWidth } }) },
          false,
          false,
          false
        ).catch(() => {
        });
      }
    });
  }
  /** rAF-coalesced container resize -> single trellis-owned relayout. */
  _onContainerResize() {
    if (!this._mounted) return;
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      const width = this._containerWidth();
      if (Math.round(width) === Math.round(this._lastWidth)) return;
      this._lastWidth = width;
      if (this._promotedKey) {
        const p = this.panels.find((p2) => p2.key === this._promotedKey);
        if (p && p.chart) p.chart.updateOptions({}, false, false, false).catch(() => {
        });
        return;
      }
      this._relayout(width);
    });
  }
  /**
   * Panel promotion (P3): expand one panel to the grid's full width, park the
   * rest (their cells hide; virtualized ones unmount via the observer), and
   * show a breadcrumb to come back. Zoom/legend state is untouched: parked
   * eager panels stay alive, parked virtual panels stash and restore.
   * @param {string} key
   * @returns {Promise<void>}
   */
  promote(key) {
    return __async(this, null, function* () {
      var _a;
      const panel = this.panels.find((p) => p.key === String(key));
      if (!panel || panel.noMount || !this._mounted) return;
      if (this._promotedKey === panel.key) return;
      if (this._promotedKey) yield this.restorePromotion();
      this._promotedKey = panel.key;
      const ly = this.layout;
      const gridH = this.elGrid ? this.elGrid.getBoundingClientRect().height : 0;
      const promotedH = Math.round(
        Math.max(280, Math.min(560, gridH || (ly ? ly.panelH * 2.4 : 420)))
      );
      (_a = this.elWrap) == null ? void 0 : _a.classList.add("apexcharts-trellis-promoting");
      this.panels.forEach((p) => {
        if (!p.cellEl) return;
        const promoted = p === panel;
        p.cellEl.classList.toggle("apexcharts-trellis-cell-promoted", promoted);
        p.cellEl.classList.toggle("apexcharts-trellis-cell-parked", !promoted);
      });
      this._stripEls.forEach(
        (el) => el.classList.add("apexcharts-trellis-cell-parked")
      );
      this.chrome.buildBreadcrumb(
        /** @type {HTMLElement} */
        this._elChromeTop,
        panel.key,
        () => this.restorePromotion()
      );
      if (!panel.chart && this._virtualActive) {
        panel.wantMounted = true;
        this.virtual._dirty.add(panel);
        this.virtual._schedule();
      }
      if (panel.el) panel.el.style.minHeight = `${promotedH}px`;
      if (panel.chart) {
        yield panel.chart.updateOptions({ chart: { height: promotedH } }, false, false, false).catch(() => {
        });
      }
      this.ctx.events.fireEvent("panelPromoted", [
        this.ctx,
        { key: panel.key, chart: panel.chart }
      ]);
    });
  }
  /** Restore the grid from a promotion. @returns {Promise<void>} */
  restorePromotion() {
    return __async(this, null, function* () {
      var _a;
      if (!this._promotedKey) return;
      const panel = this.panels.find((p) => p.key === this._promotedKey);
      this._promotedKey = null;
      (_a = this.elWrap) == null ? void 0 : _a.classList.remove("apexcharts-trellis-promoting");
      this.panels.forEach((p) => {
        if (!p.cellEl) return;
        p.cellEl.classList.remove("apexcharts-trellis-cell-promoted");
        p.cellEl.classList.remove("apexcharts-trellis-cell-parked");
      });
      this._stripEls.forEach(
        (el) => el.classList.remove("apexcharts-trellis-cell-parked")
      );
      this.chrome.removeBreadcrumb();
      const ly = this.layout;
      if (panel && panel.el && ly) panel.el.style.minHeight = `${ly.panelH}px`;
      if (panel && panel.chart && ly) {
        yield panel.chart.updateOptions({ chart: { height: ly.panelH } }, false, false, false).catch(() => {
        });
      }
      this._lastWidth = 0;
      this._relayout(this._containerWidth());
      this._lastWidth = this._containerWidth();
      this.ctx.events.fireEvent("panelRestored", [
        this.ctx,
        { key: panel ? panel.key : null }
      ]);
    });
  }
  /**
   * Recompute the grid for a new width. A changed column count re-derives the
   * edge policy (which panels sit on the bottom row changed) by toggling cell
   * classes; panel geometry updates are one non-fanout updateOptions each.
   * @param {number} width
   */
  _relayout(width) {
    const split2 = this.split;
    if (!split2) return;
    const prevH = this.layout ? this.layout.panelH : 0;
    this.layout = compute({
      panelCount: split2.panels.length,
      containerWidth: width,
      cfg: this._layoutCfg(),
      hostHeight: this._hostHeight()
    });
    this._applyGridStyle();
    const ly = this.layout;
    this.panels.forEach((p, i) => {
      if (p.cellEl) this._applyCellMutes(p.cellEl, ly.cells[i]);
      if (p.el && this._virtualActive) p.el.style.minHeight = `${ly.panelH}px`;
      if (!p.chart) return;
      const payload = ly.panelH !== prevH ? { chart: { height: ly.panelH } } : {};
      p.chart.updateOptions(payload, false, false, false).catch(() => {
      });
    });
    if (this._virtualActive) this.virtual.refresh();
  }
  /**
   * Host updateSeries: re-split against the SAME panel key set and push each
   * panel its new slice (plus refreshed shared domains) in one update. A
   * changed key set (panels appearing/disappearing) is a structural change:
   * torn down and re-rendered.
   * @param {any[]} newSeries
   * @param {boolean} [animate]
   * @returns {Promise<any>}
   */
  updateSeries(newSeries, animate = true) {
    return __async(this, null, function* () {
      var _a;
      const w = this.w;
      if (Array.isArray(this.cfg.data) && this.cfg.data.length) {
        console.warn(
          "ApexCharts: this trellis renders from trellis.data; update it via updateOptions({ trellis: { data } })."
        );
        return Promise.resolve();
      }
      w.config.series = newSeries;
      if (this.ctx.opts) this.ctx.opts.series = newSeries;
      if (!this._mounted) return this.ctx.render();
      const nextSplit = split(newSeries || [], this.cfg);
      const sameKeys = nextSplit.panels.length === this.panels.length && nextSplit.panels.every((p, i) => p.key === this.panels[i].key);
      if (!sameKeys) {
        this.teardown();
        return this.ctx.render();
      }
      this.split = nextSplit;
      this._frames = buildTypeFrames(
        nextSplit,
        this.cfg,
        w.config,
        w.config.chart.requestedType === "histogram" ? "histogram" : w.config.chart.type
      );
      const scalesCfg = this._yMode() !== (((_a = this.cfg.scales) == null ? void 0 : _a.y) || "shared") ? __spreadProps(__spreadValues({}, this.cfg), { scales: __spreadProps(__spreadValues({}, this.cfg.scales || {}), { y: this._yMode() }) }) : this.cfg;
      this.scales = resolve(nextSplit, scalesCfg, {
        chartType: w.config.chart.type,
        userColors: this.ctx.opts && this.ctx.opts.colors,
        yExtentOverride: this._frames.yExtentOverride
      });
      const scales = this.scales;
      const frames = this._frames;
      const isValueSeries = ["pie", "donut", "polarArea", "radialBar"].includes(
        w.config.chart.type
      );
      const pushes = this.panels.map((p, i) => {
        var _a2, _b, _c;
        if (!p.chart) return Promise.resolve();
        const payload = {
          // The radial value family takes a BARE values array (see the same
          // unwrap in _assemblePanelOptions).
          series: isValueSeries ? nextSplit.panels[i].series.flatMap(
            (s) => Array.isArray(s.data) ? s.data : []
          ).map(
            (v) => typeof v === "number" && isFinite(v) ? v : 0
          ) : nextSplit.panels[i].series
        };
        const valueAxisIsX = this._valueAxisIsX();
        if (scales.x && !valueAxisIsX) {
          payload.xaxis = { min: scales.x.min, max: scales.x.max };
        }
        const yBounds = this._yBoundsFor(nextSplit.panels[i]);
        if (yBounds) {
          payload.yaxis = yaxisPayload(p.chart, {
            min: yBounds.min,
            max: yBounds.max,
            tickAmount: yBounds.tickAmount
          });
          if (valueAxisIsX) {
            payload.xaxis = Utils.extend(
              payload.xaxis || {},
              this._valueAxisXPatch(yBounds)
            );
          }
        }
        if (frames.plotOptions) {
          payload.plotOptions = Utils.clone(frames.plotOptions);
        }
        if (frames.pieScaleOf) {
          const ratio = frames.pieScaleOf(nextSplit.panels[i].key);
          if (ratio !== null) {
            const userScale = (_c = (_b = (_a2 = this.ctx.opts) == null ? void 0 : _a2.plotOptions) == null ? void 0 : _b.pie) == null ? void 0 : _c.customScale;
            payload.plotOptions = Utils.extend(payload.plotOptions || {}, {
              pie: {
                customScale: ratio * (typeof userScale === "number" ? userScale : 1)
              }
            });
          }
        }
        return p.chart.updateOptions(payload, false, animate, false).catch(() => {
        });
      });
      return Promise.all(pushes);
    });
  }
  /** @returns {Array<{ key: string, index: number, chart: any|null, el: HTMLElement|null }>} */
  getPanels() {
    return this.panels.map((p) => ({
      key: p.key,
      index: p.index,
      chart: p.chart,
      el: p.cellEl
    }));
  }
  /**
   * @param {string} key
   * @returns {any|null} the panel's ApexCharts instance
   */
  getPanel(key) {
    const p = this.panels.find((p2) => p2.key === String(key));
    return p ? p.chart : null;
  }
  /**
   * Destroy every panel (each unregisters itself from Apex._chartInstances),
   * disconnect the observers, and remove the trellis DOM.
   */
  teardown() {
    this.virtual.stop();
    this._virtualActive = false;
    this._panelRenderer = null;
    this._promotedKey = null;
    this._frames = null;
    this.chrome.destroyGradientLegend();
    if (this.gridTooltip) {
      this.gridTooltip.destroy();
      this.gridTooltip = null;
    }
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    if (Environment.isBrowser() && this.ctx.el) {
      removeResizeListener(
        /** @type {Element} */
        this.ctx.el,
        this._resizeHandler
      );
    }
    this.panels.forEach((p) => {
      if (p.chart) {
        try {
          p.chart.destroy();
        } catch (e) {
        }
      }
      p.chart = null;
    });
    this.panels = [];
    this._stripEls = [];
    if (this.elWrap && this.elWrap.parentNode) {
      this.elWrap.parentNode.removeChild(this.elWrap);
    }
    this.elWrap = null;
    this.elGrid = null;
    this._mounted = false;
    this.ctx._renderPromise = null;
  }
}
_core__default.registerFeatures({ trellis: Trellis });
export {
  default2 as default
};
