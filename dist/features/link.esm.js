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
 * ApexCharts v7.0.0
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const X = "__apexcharts_crossfilters__";
function Y(e) {
  if (!Number.isFinite(e)) return e;
  const t = Number(e.toPrecision(12));
  return Object.is(t, -0) ? 0 : t;
}
function Z(e) {
  return "number" == typeof e && Number.isFinite(e);
}
function J(e) {
  if ("function" == typeof e) return e;
  if (e && "object" == typeof e) {
    if ("string" == typeof e.sum) {
      const t = e.sum;
      return (e2) => e2.reduce(((e3, s) => e3 + (Number(s[t]) || 0)), 0);
    }
    if ("string" == typeof e.avg) {
      const t = e.avg;
      return (e2) => e2.length ? e2.reduce(((e3, s) => e3 + (Number(s[t]) || 0)), 0) / e2.length : 0;
    }
    if ("string" == typeof e.min) {
      const t = e.min;
      return (e2) => e2.length ? Math.min(...e2.map(((e3) => Number(e3[t]) || 0))) : 0;
    }
    if ("string" == typeof e.max) {
      const t = e.max;
      return (e2) => e2.length ? Math.max(...e2.map(((e3) => Number(e3[t]) || 0))) : 0;
    }
  }
  return (e2) => e2.length;
}
function G(e, t) {
  return "function" == typeof t ? e.slice().sort(t) : "asc" === t ? e.slice().sort(((e2, t2) => e2 > t2 ? 1 : e2 < t2 ? -1 : 0)) : "desc" === t ? e.slice().sort(((e2, t2) => e2 < t2 ? 1 : e2 > t2 ? -1 : 0)) : e;
}
function ee(e, t) {
  if (!Z(e)) return -1;
  const s = t.length - 1;
  if (e < t[0] || e > t[s]) return -1;
  if (e === t[s]) return s - 1;
  for (let i = 0; i < s; i++) if (e >= t[i] && e < t[i + 1]) return i;
  return -1;
}
function te(e) {
  const t = [];
  for (let s = 0; s < e.length - 1; s++) t.push(Y((e[s] + e[s + 1]) / 2));
  return t;
}
class se {
  constructor(e, t) {
    this.dims = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Map(), this.id = e, this.records = Array.isArray(t) ? t : [];
  }
  static store() {
    const e = globalThis;
    return e[X] || (e[X] = /* @__PURE__ */ new Map()), e[X];
  }
  static getOrCreate(e) {
    if (!e || "string" != typeof e.id) throw new Error("Crossfilter.getOrCreate requires an { id } string.");
    const t = se.store(), s = t.get(e.id);
    if (s) return e.records && s.setRecords(e.records), s;
    const i = new se(e.id, e.records);
    return t.set(e.id, i), i;
  }
  static get(e) {
    return se.store().get(e) || null;
  }
  setRecords(e) {
    return this.records = Array.isArray(e) ? e : [], this.dims.forEach(((e2) => this.recomputeDomain(e2))), this.emit("records", this.state()), this.emit("change", this.state()), this;
  }
  registerDimension(e, t) {
    if (!t || "function" != typeof t.dimension) throw new Error(`crossfilter.registerDimension("${e}") needs a dimension function.`);
    const s = t.type || (t.bins ? "range" : "category"), i = { accessor: t.dimension, reducer: J(t.reduce), type: s, bins: t.bins, order: t.order, filter: null, labels: [], edges: null, xLabels: [], yLabels: [] };
    return this.dims.set(e, i), this.recomputeDomain(i), null != t.filter && this.setFilterOn(i, t.filter), this;
  }
  hasDimension(e) {
    return this.dims.has(e);
  }
  removeDimension(e) {
    const t = this.dims.get(e), s = !!t && this.hasFilter(t);
    return this.dims.delete(e), s && this.emit("change", this.state()), this;
  }
  recomputeDomain(e) {
    if ("matrix" === e.type) {
      const t = (function(e2, t2, s) {
        const i = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = [], a = [];
        for (let s2 = 0; s2 < e2.length; s2++) {
          const l = t2(e2[s2]);
          if (!l) continue;
          const o = l[0], c = l[1];
          null == o || i.has(o) || (i.add(o), r.push(o)), null == c || n.has(c) || (n.add(c), a.push(c));
        }
        return { xLabels: G(r, s), yLabels: G(a, s) };
      })(this.records, e.accessor, e.order);
      return e.xLabels = t.xLabels, e.yLabels = t.yLabels, void (e.edges = null);
    }
    if ("range" === e.type) return e.edges = (function(e2, t, s) {
      if (s && Array.isArray(s.thresholds) && s.thresholds.length >= 2) {
        const e3 = Array.from(new Set(s.thresholds.filter(Z))).sort(((e4, t2) => e4 - t2));
        return e3.length >= 2 ? e3.map(Y) : [0, 1];
      }
      let i = 1 / 0, n = -1 / 0;
      for (let s2 = 0; s2 < e2.length; s2++) {
        const r2 = t(e2[s2]);
        Z(r2) && (r2 < i && (i = r2), r2 > n && (n = r2));
      }
      if (i === 1 / 0) return [0, 1];
      if (i === n) {
        const e3 = Math.abs(i) > 0 ? Math.abs(i) : 1;
        return [Y(i), Y(i + e3)];
      }
      if (s && Z(s.width) && s.width > 0) {
        const e3 = s.width, t2 = Math.floor(i / e3) * e3;
        let r2 = Math.ceil(n / e3) * e3;
        r2 <= t2 && (r2 = t2 + e3);
        const a2 = Math.max(1, Math.round((r2 - t2) / e3)), l2 = new Array(a2 + 1);
        for (let s2 = 0; s2 <= a2; s2++) l2[s2] = Y(t2 + s2 * e3);
        return l2;
      }
      const r = s && Z(s.count) && s.count >= 1 ? Math.floor(s.count) : 30, a = (n - i) / r, l = new Array(r + 1);
      for (let e3 = 0; e3 <= r; e3++) l[e3] = Y(i + e3 * a);
      return l[r] = Y(n), l;
    })(this.records, e.accessor, e.bins), void (e.labels = te(e.edges));
    if (e.labels = (function(e2, t, s) {
      const i = /* @__PURE__ */ new Set(), n = [];
      for (let s2 = 0; s2 < e2.length; s2++) {
        const r = t(e2[s2]);
        null != r && (i.has(r) || (i.add(r), n.push(r)));
      }
      return G(n, s);
    })(this.records, e.accessor, e.order), e.edges = null, e.filter instanceof Set) {
      const t = new Set(e.labels);
      Array.from(e.filter).forEach(((s) => {
        t.has(s) || e.filter.delete(s);
      }));
    }
  }
  filter(e, t) {
    const s = this.dims.get(e);
    return s ? (this.setFilterOn(s, t), this.emit("change", this.state()), this) : this;
  }
  toggleKey(e, t) {
    const s = this.dims.get(e);
    if (!s || "category" !== s.type) return this;
    s.filter instanceof Set || (s.filter = /* @__PURE__ */ new Set());
    const i = s.filter;
    return i.has(t) ? i.delete(t) : i.add(t), 0 === i.size && (s.filter = null), this.emit("change", this.state()), this;
  }
  setFilterOn(e, t) {
    if (null == t) return void (e.filter = null);
    if ("range" === e.type) {
      if (Array.isArray(t) && 2 === t.length && t.every(Z)) {
        const [s2, i] = t;
        e.filter = [Math.min(s2, i), Math.max(s2, i)];
      } else e.filter = null;
      return;
    }
    const s = new Set(t);
    e.filter = s.size ? s : null;
  }
  clear(e) {
    const t = this.dims.get(e);
    return t && (t.filter = null), this.emit("change", this.state()), this;
  }
  reset() {
    return this.dims.forEach(((e) => {
      e.filter = null;
    })), this.emit("change", this.state()), this;
  }
  hasFilter(e) {
    return null != e.filter && (!(e.filter instanceof Set) || e.filter.size > 0);
  }
  passes(e, t) {
    if (!this.hasFilter(e)) return true;
    const s = e.accessor(t);
    if (e.filter instanceof Set) return e.filter.has(s);
    if (!Z(s)) return false;
    const [i, n] = e.filter;
    return s >= i && s <= n;
  }
  filteredRecords(e) {
    const t = [];
    return this.dims.forEach(((s, i) => {
      i !== e && this.hasFilter(s) && t.push(s);
    })), 0 === t.length ? this.records : this.records.filter(((e2) => t.every(((t2) => this.passes(t2, e2)))));
  }
  filteredRows() {
    return this.filteredRecords(null);
  }
  aggregateFor(e) {
    const t = this.dims.get(e);
    if (!t) return { type: "category", labels: [], values: [], keys: [] };
    const s = this.filteredRecords(e);
    if ("matrix" === t.type) {
      const e2 = new Map(t.xLabels.map(((e3, t2) => [e3, t2]))), i2 = new Map(t.yLabels.map(((e3, t2) => [e3, t2]))), n = t.yLabels.map((() => t.xLabels.map((() => []))));
      for (let r = 0; r < s.length; r++) {
        const a = t.accessor(s[r]);
        if (!a) continue;
        const l = e2.get(a[0]), o = i2.get(a[1]);
        null != l && null != o && n[o][l].push(s[r]);
      }
      return { type: "matrix", xLabels: t.xLabels.slice(), yLabels: t.yLabels.slice(), matrix: n.map(((e3) => e3.map(((e4) => t.reducer(e4))))) };
    }
    if ("range" === t.type) {
      const e2 = t.edges || [0, 1], i2 = e2.length - 1, n = Array.from({ length: i2 }, (() => []));
      for (let i3 = 0; i3 < s.length; i3++) {
        const r = ee(t.accessor(s[i3]), e2);
        r >= 0 && n[r].push(s[i3]);
      }
      return { type: "range", labels: te(e2), values: n.map(((e3) => t.reducer(e3))), keys: n.map(((t2, s2) => [e2[s2], e2[s2 + 1]])), edges: e2 };
    }
    const i = /* @__PURE__ */ new Map();
    t.labels.forEach(((e2) => i.set(e2, [])));
    for (let e2 = 0; e2 < s.length; e2++) {
      const n = i.get(t.accessor(s[e2]));
      n && n.push(s[e2]);
    }
    return { type: "category", labels: t.labels.slice(), values: t.labels.map(((e2) => t.reducer(i.get(e2) || []))), keys: t.labels.slice() };
  }
  aggregateAll() {
    const e = {};
    return this.dims.forEach(((t, s) => {
      e[s] = this.aggregateFor(s);
    })), e;
  }
  state() {
    const e = {};
    return this.dims.forEach(((t, s) => {
      this.hasFilter(t) && (e[s] = t.filter instanceof Set ? Array.from(t.filter) : t.filter.slice());
    })), { filters: e, filteredCount: this.filteredRows().length, total: this.records.length };
  }
  filterOf(e) {
    const t = this.dims.get(e);
    return t && this.hasFilter(t) ? t.filter instanceof Set ? new Set(t.filter) : t.filter.slice() : null;
  }
  on(e, t) {
    let s = this.listeners.get(e);
    return s || (s = /* @__PURE__ */ new Set(), this.listeners.set(e, s)), s.add(t), () => this.off(e, t);
  }
  off(e, t) {
    var s;
    return null == (s = this.listeners.get(e)) || s.delete(t), this;
  }
  emit(e, t) {
    var s;
    null == (s = this.listeners.get(e)) || s.forEach(((e2) => {
      try {
        e2(t);
      } catch (e3) {
      }
    }));
  }
  static esc(e) {
    return String(null == e ? "" : e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  resolveColumns(e) {
    if (Array.isArray(e) && e.length) return e.map(((e2) => "string" == typeof e2 ? { field: e2, label: e2 } : { field: e2.field, label: e2.label || e2.field, format: e2.format }));
    const t = this.records[0];
    return (t ? Object.keys(t) : []).map(((e2) => ({ field: e2, label: e2 })));
  }
  tableHTML(e, t, s) {
    const i = "<thead><tr>" + e.map(((e2) => `<th>${se.esc(e2.label)}</th>`)).join("") + "</tr></thead>", n = "<tbody>" + t.map(((t2) => "<tr>" + e.map(((e2) => {
      const s2 = t2[e2.field], i2 = e2.format ? e2.format(s2, t2) : s2;
      return `<td>${se.esc(i2)}</td>`;
    })).join("") + "</tr>")).join("") + "</tbody>";
    return `<table class="apexcharts-cf-table">${`<caption>${t.length} of ${s} rows</caption>`}${i}${n}</table>`;
  }
  dataTable(e, t) {
    if (!e) return { refresh() {
    }, destroy() {
    } };
    const s = t || {}, i = this.resolveColumns(s.columns), n = s.pageSize || 0, r = s.page || 0, a = () => {
      const t2 = this.filteredRows(), s2 = n ? t2.slice(r * n, r * n + n) : t2;
      e.innerHTML = this.tableHTML(i, s2, t2.length);
    };
    a();
    const l = this.on("change", a);
    return { refresh: a, destroy: () => {
      l(), e.innerHTML = "";
    } };
  }
  destroy() {
    se.store().delete(this.id), this.dims.clear(), this.listeners.clear(), this.records = [];
  }
}
const MARK_SELECTOR = [
  ".apexcharts-bar-area",
  ".apexcharts-candlestick-area",
  ".apexcharts-boxPlot-area",
  ".apexcharts-rangebar-area",
  ".apexcharts-marker"
].join(", ");
const FILTER_MARK_SELECTOR = [
  ".apexcharts-pie-area",
  ".apexcharts-bar-area"
].join(", ");
const DIMMED_CLASS = "apexcharts-crossfilter-dimmed";
const PIE_TYPES = ["pie", "donut", "polarArea", "radialBar"];
class LinkedViews {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._dimmed = false;
    this._wired = false;
    this._pending = false;
    this._lastValues = null;
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onChange = this._onChange.bind(this);
    if (this._mode() === "filter") this._initEngine();
  }
  /** @returns {'highlight'|'filter'|'off'} */
  _mode() {
    const link = this.w.config.chart.link;
    if (link && typeof link.dimension === "function") return "filter";
    if (link && link.enabled) return "highlight";
    return "off";
  }
  _enabled() {
    const link = this.w.config.chart.link;
    return !!(link && link.enabled);
  }
  /**
   * The source chart's rectangle brush produced a data-x range. In FILTER mode
   * this becomes a `[min,max]` range filter on the chart's dimension (the other
   * charts re-aggregate). In HIGHLIGHT mode (P1) it dims out-of-range marks
   * across the group. Called (null-safe) from ZoomPanSelection selectionDrawn /
   * selectionDragging.
   * @param {{min:number, max:number}} xaxis
   */
  onSourceSelection(xaxis) {
    var _a;
    const mode = this._mode();
    if (mode === "off") return;
    if (!xaxis || xaxis.min == null || xaxis.max == null) return;
    let min = Math.min(xaxis.min, xaxis.max);
    let max = Math.max(xaxis.min, xaxis.max);
    const gMinX = this.w.globals.minX;
    const gMaxX = this.w.globals.maxX;
    if (isFinite(gMinX) && isFinite(gMaxX) && gMaxX > gMinX) {
      const tol = (gMaxX - gMinX) * 1e-6;
      if (min - gMinX <= tol) min = gMinX;
      if (gMaxX - max <= tol) max = gMaxX;
    }
    if (mode === "filter") {
      const cf = this._cf();
      if (!cf) return;
      cf.filter(this._chartId(), [min, max]);
      this._fireFilterChange(cf, [min, max]);
      return;
    }
    this._group().forEach((ch) => {
      var _a2;
      (_a2 = ch == null ? void 0 : ch.linkedViews) == null ? void 0 : _a2.applyDim(min, max);
    });
    const args = { xaxis: { min, max }, sourceChartID: this.w.globals.chartID };
    if (typeof this.w.config.chart.events.crossFilter === "function") {
      this.w.config.chart.events.crossFilter(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("crossFilter", [this.ctx, args]);
  }
  /** self + grouped siblings (dedup-safe; getGroupedCharts excludes self). */
  _group() {
    const siblings = typeof this.ctx.getGroupedCharts === "function" ? this.ctx.getGroupedCharts() : [];
    return [this.ctx, ...siblings];
  }
  /**
   * Dim this chart's marks whose x is outside [min,max]; un-dim those inside.
   * No re-render, so mark identities are preserved.
   * @param {number} min @param {number} max
   */
  applyDim(min, max) {
    if (!this._enabled()) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const dimOpacity = w.config.chart.link.dimOpacity;
    if (w.dom.elWrap && typeof dimOpacity === "number") {
      w.dom.elWrap.style.setProperty("--apx-cf-dim", String(dimOpacity));
    }
    const seriesX = w.globals.seriesX || [];
    const marks = baseEl.querySelectorAll(MARK_SELECTOR);
    marks.forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const j = parseInt(jAttr, 10);
      const iAttr = node.getAttribute("index");
      const i = iAttr === null ? 0 : parseInt(iAttr, 10);
      const row = seriesX[i] || seriesX[0];
      if (!row) return;
      const x = row[j];
      if (x == null) return;
      node.classList.toggle(DIMMED_CLASS, x < min || x > max);
    });
    this._dimmed = true;
  }
  /** Remove dimming from this chart only. */
  clear() {
    const baseEl = this.w.dom.baseEl;
    if (!baseEl) return;
    baseEl.querySelectorAll("." + DIMMED_CLASS).forEach((n) => n.classList.remove(DIMMED_CLASS));
    this._dimmed = false;
  }
  /** Clear dimming across the whole group (backs chart.clearCrossfilter). */
  clearGroup() {
    if (this._mode() === "filter") {
      const cf = this._cf();
      if (cf) cf.reset();
      return;
    }
    this._group().forEach((ch) => {
      var _a;
      return (_a = ch == null ? void 0 : ch.linkedViews) == null ? void 0 : _a.clear();
    });
  }
  // ─── FILTER mode (crossfilter engine glue) ───────────────────────────────
  /**
   * The chart's stable internal id (keys its dimension in the coordinator).
   * Always set by the ApexCharts constructor (falls back to a cuid).
   * @returns {string}
   */
  _chartId() {
    return (
      /** @type {string} */
      this.w.globals.chartID
    );
  }
  /** @returns {import('./Crossfilter').default|null} the coordinator, or null */
  _cf() {
    const link = this.w.config.chart.link;
    const id = link && (link.id || this.w.config.chart.group);
    return id ? se.get(id) : null;
  }
  _isPie() {
    return PIE_TYPES.indexOf(this.w.config.chart.type) !== -1;
  }
  _isHeatmap() {
    return this.w.config.chart.type === "heatmap";
  }
  /**
   * Before the first render: resolve the coordinator, register this chart's
   * dimension, inject the initial aggregated series into w.config (so the first
   * paint is already aggregated, no empty flash), and wire the listeners.
   */
  _initEngine() {
    const cf = this._cf();
    const link = this.w.config.chart.link;
    if (!cf) {
      const id = link && link.id || this.w.config.chart.group;
      console.warn(
        `[apexcharts] chart.link.dimension is set but no crossfilter coordinator "${id}" exists. Call ApexCharts.crossfilter({ id, records }) before creating the chart.`
      );
      return;
    }
    const chartId = this._chartId();
    if (!cf.hasDimension(chartId)) {
      cf.registerDimension(chartId, {
        dimension: link.dimension,
        reduce: link.reduce,
        // heatmap => 2D matrix dimension (accessor returns [xKey, yKey]).
        type: link.type || (this._isHeatmap() ? "matrix" : void 0),
        bins: link.bins,
        order: link.order
      });
    }
    this._injectSeries(cf.aggregateFor(chartId));
    this._wire(cf);
  }
  /**
   * Build the chart's series value from an aggregation, shaped by chart type:
   *   matrix (heatmap) -> [{ name:yKey, data:[{x:xKey, y:value}] }]
   *   pie/donut  -> number[]
   *   axis + category -> [{ name, data:number[] }] (categories set separately)
   *   axis + range    -> [{ name, data:[x,value][] }] on a numeric/time x-axis
   * @param {any} agg
   */
  _seriesFromAgg(agg) {
    if (agg.type === "matrix") {
      return agg.yLabels.map((yl, yi) => ({
        name: String(yl),
        data: agg.xLabels.map((xl, xi) => ({
          x: String(xl),
          y: agg.matrix[yi][xi]
        }))
      }));
    }
    if (this._isPie()) return agg.values.slice();
    const name = this.w.config.chart.link.seriesName || "Count";
    if (agg.type === "range") {
      return [{ name, data: agg.labels.map((x, i) => [x, agg.values[i]]) }];
    }
    return [{ name, data: agg.values.slice() }];
  }
  /**
   * Value signature used to skip a reflow when only dimming changed.
   * @param {any} agg
   */
  _sigOf(agg) {
    return JSON.stringify(agg.matrix || agg.values);
  }
  /**
   * Write the aggregation into w.config as the chart's series/labels. Runs once
   * before the first paint; later updates go through updateSeries.
   * @param {any} agg
   */
  _injectSeries(agg) {
    const w = this.w;
    this._lastValues = this._sigOf(agg);
    w.config.series = this._seriesFromAgg(agg);
    if (agg.type === "matrix") return;
    if (this._isPie()) {
      w.config.labels = agg.labels.map(String);
    } else if (agg.type === "category") {
      if (!w.config.xaxis) w.config.xaxis = {};
      w.config.xaxis.categories = agg.labels.map(String);
    } else if (agg.type === "range") {
      this._pinRangeDomain(agg.edges);
    }
  }
  /**
   * Pin the numeric/datetime x-axis to the outer bin edges of a range-binned
   * dimension (unless the user set xaxis.min/max explicitly). See _injectSeries.
   * @param {number[]|null|undefined} edges
   */
  _pinRangeDomain(edges) {
    if (!Array.isArray(edges) || edges.length < 2) return;
    const w = this.w;
    if (!w.config.xaxis) w.config.xaxis = /** @type {any} */
    {};
    if (w.config.xaxis.min == null) w.config.xaxis.min = edges[0];
    if (w.config.xaxis.max == null) w.config.xaxis.max = edges[edges.length - 1];
  }
  /** @param {import('./Crossfilter').default} cf */
  _wire(cf) {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    cf.on("change", this._onChange);
  }
  /**
   * A pie slice / bar was clicked: toggle its bucket key on the coordinator.
   * @param {any} _e @param {any} _ctx @param {{dataPointIndex?:number}} opts
   */
  _onPointSelect(_e, _ctx, opts) {
    if (this._mode() !== "filter" || !opts || opts.dataPointIndex == null) return;
    const cf = this._cf();
    if (!cf) return;
    const chartId = this._chartId();
    const agg = cf.aggregateFor(chartId);
    if (agg.type === "matrix") return;
    const key = agg.keys[opts.dataPointIndex];
    if (key == null) return;
    cf.toggleKey(chartId, key);
    this._fireFilterChange(cf, key);
  }
  /** Coordinator filter changed: re-aggregate this chart on a microtask so the
   *  triggering click handler unwinds before we destroy/redraw the DOM. */
  _onChange() {
    if (this._mode() !== "filter" || this._pending) return;
    this._pending = true;
    Promise.resolve().then(() => {
      this._pending = false;
      if (this.w.globals.isDestroyed) return;
      this._applyAggregation();
    });
  }
  /**
   * Pull this chart's crossfilter aggregation and push it through updateSeries
   * (animated). When the values are unchanged (e.g. only this chart's own
   * filter moved, which it ignores for itself), skip the reflow and just
   * refresh the self-dim.
   */
  _applyAggregation() {
    if (this._mode() !== "filter") return;
    const cf = this._cf();
    if (!cf) return;
    const agg = cf.aggregateFor(this._chartId());
    const sig = this._sigOf(agg);
    if (sig === this._lastValues) {
      this._applySelfDim();
      return;
    }
    this._lastValues = sig;
    this.ctx.updateSeries(this._seriesFromAgg(agg), true);
  }
  _afterRender() {
    if (this._mode() !== "filter") return;
    const series = this.w.config.series;
    if (!series || series.length === 0) {
      this._reassertSeries();
      return;
    }
    this._applySelfDim();
  }
  /** Restore the aggregated series after an external updateSeries emptied it.
   *  Deferred a microtask so the triggering update fully unwinds first. */
  _reassertSeries() {
    if (this._pending) return;
    this._pending = true;
    Promise.resolve().then(() => {
      this._pending = false;
      if (this.w.globals.isDestroyed) return;
      const cf = this._cf();
      if (!cf) return;
      const agg = cf.aggregateFor(this._chartId());
      const series = this._seriesFromAgg(agg);
      if (!series.length) return;
      this._lastValues = this._sigOf(agg);
      this.ctx.updateSeries(series, true);
    });
  }
  /**
   * Dim this chart's own buckets that are not in its own filter (no filter ->
   * none dimmed). Categorical: dim buckets whose key is not in the selected Set.
   * Range: dim bins lying fully outside the selected `[min,max]`. Keyed by each
   * mark's `j` (dataPointIndex) -> the aggregation key.
   */
  _applySelfDim() {
    const cf = this._cf();
    if (!cf) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const chartId = this._chartId();
    const filter = cf.filterOf(chartId);
    const dimOpacity = w.config.chart.link.dimOpacity;
    if (w.dom.elWrap && typeof dimOpacity === "number") {
      w.dom.elWrap.style.setProperty("--apx-cf-dim", String(dimOpacity));
    }
    const isCategory = filter instanceof Set;
    const isRange = Array.isArray(filter);
    const agg = cf.aggregateFor(chartId);
    if (agg.type === "matrix") return;
    const keys = agg.keys;
    baseEl.querySelectorAll(FILTER_MARK_SELECTOR).forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const key = keys[parseInt(jAttr, 10)];
      let dim = false;
      if (isCategory) {
        dim = !/** @type {Set<any>} */
        filter.has(key);
      } else if (isRange && Array.isArray(key)) {
        dim = key[1] <= filter[0] || key[0] >= filter[1];
      }
      node.classList.toggle(DIMMED_CLASS, dim);
    });
    this._dimmed = !!filter;
  }
  /**
   * Fire the `filterChange` event on this (source) chart.
   * @param {import('./Crossfilter').default} cf @param {any} key
   */
  _fireFilterChange(cf, key) {
    var _a;
    const args = __spreadProps(__spreadValues({}, cf.state()), {
      sourceChartID: this._chartId(),
      key
    });
    const events = this.w.config.chart.events;
    if (typeof events.filterChange === "function") {
      events.filterChange(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("filterChange", [this.ctx, args]);
  }
  teardown() {
    var _a, _b, _c, _d, _e, _f;
    this.clear();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "dataPointSelection", this._onPointSelect);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "mounted", this._afterRender);
      (_f = (_e = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e, "updated", this._afterRender);
      const cf = this._cf();
      if (cf) {
        cf.off("change", this._onChange);
        cf.removeDimension(this._chartId());
      }
      this._wired = false;
    }
  }
}
ApexCharts.registerFeatures({ linkedViews: LinkedViews });
const AC = (
  /** @type {any} */
  ApexCharts
);
AC._crossfilterFactory = (opts) => se.getOrCreate(opts);
AC._crossfilterGet = (id) => se.get(id);
export {
  default2 as default
};
