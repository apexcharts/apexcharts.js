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
 * ApexCharts v7.3.0
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const e = globalThis.console;
function t(t2, ...s) {
  e.error(t2, ...s);
}
const le = "__apexcharts_crossfilters__";
function oe(e2) {
  if (!Number.isFinite(e2)) return e2;
  const t2 = Number(e2.toPrecision(12));
  return Object.is(t2, -0) ? 0 : t2;
}
function ce(e2) {
  return "number" == typeof e2 && Number.isFinite(e2);
}
function he(e2) {
  if ("function" == typeof e2) return e2;
  if (e2 && "object" == typeof e2) {
    if ("string" == typeof e2.sum) {
      const t2 = e2.sum;
      return (e3) => e3.reduce(((e4, s) => e4 + (Number(s[t2]) || 0)), 0);
    }
    if ("string" == typeof e2.avg) {
      const t2 = e2.avg;
      return (e3) => e3.length ? e3.reduce(((e4, s) => e4 + (Number(s[t2]) || 0)), 0) / e3.length : 0;
    }
    if ("string" == typeof e2.min) {
      const t2 = e2.min;
      return (e3) => e3.length ? Math.min(...e3.map(((e4) => Number(e4[t2]) || 0))) : 0;
    }
    if ("string" == typeof e2.max) {
      const t2 = e2.max;
      return (e3) => e3.length ? Math.max(...e3.map(((e4) => Number(e4[t2]) || 0))) : 0;
    }
  }
  return (e3) => e3.length;
}
function de(e2, t2) {
  return "function" == typeof t2 ? e2.slice().sort(t2) : "asc" === t2 ? e2.slice().sort(((e3, t3) => e3 > t3 ? 1 : e3 < t3 ? -1 : 0)) : "desc" === t2 ? e2.slice().sort(((e3, t3) => e3 < t3 ? 1 : e3 > t3 ? -1 : 0)) : e2;
}
function ue(e2, t2) {
  if (!ce(e2)) return -1;
  const s = t2.length - 1;
  if (e2 < t2[0] || e2 > t2[s]) return -1;
  if (e2 === t2[s]) return s - 1;
  for (let i = 0; i < s; i++) if (e2 >= t2[i] && e2 < t2[i + 1]) return i;
  return -1;
}
function fe(e2) {
  const t2 = [];
  for (let s = 0; s < e2.length - 1; s++) t2.push(oe((e2[s] + e2[s + 1]) / 2));
  return t2;
}
class pe {
  constructor(e2, t2) {
    this.dims = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Map(), this.id = e2, this.records = Array.isArray(t2) ? t2 : [];
  }
  static store() {
    const e2 = globalThis;
    return e2[le] || (e2[le] = /* @__PURE__ */ new Map()), e2[le];
  }
  static getOrCreate(e2) {
    if (!e2 || "string" != typeof e2.id) throw new Error("Crossfilter.getOrCreate requires an { id } string.");
    const t2 = pe.store(), s = t2.get(e2.id);
    if (s) return e2.records && s.setRecords(e2.records), s;
    const i = new pe(e2.id, e2.records);
    return t2.set(e2.id, i), i;
  }
  static get(e2) {
    return pe.store().get(e2) || null;
  }
  setRecords(e2) {
    return this.records = Array.isArray(e2) ? e2 : [], this.dims.forEach(((e3) => this.recomputeDomain(e3))), this.emit("records", this.state()), this.emit("change", this.state()), this;
  }
  registerDimension(e2, t2) {
    if (!t2 || "function" != typeof t2.dimension) throw new Error(`crossfilter.registerDimension("${e2}") needs a dimension function.`);
    const s = t2.type || (t2.bins ? "range" : "category"), i = { accessor: t2.dimension, reducer: he(t2.reduce), type: s, bins: t2.bins, order: t2.order, filter: null, labels: [], edges: null, xLabels: [], yLabels: [] };
    return this.dims.set(e2, i), this.recomputeDomain(i), null != t2.filter && this.setFilterOn(i, t2.filter), this;
  }
  hasDimension(e2) {
    return this.dims.has(e2);
  }
  removeDimension(e2) {
    const t2 = this.dims.get(e2), s = !!t2 && this.hasFilter(t2);
    return this.dims.delete(e2), s && this.emit("change", this.state()), this;
  }
  recomputeDomain(e2) {
    if ("matrix" === e2.type) {
      const t2 = (function(e3, t3, s) {
        const i = /* @__PURE__ */ new Set(), n = /* @__PURE__ */ new Set(), r = [], a = [];
        for (let s2 = 0; s2 < e3.length; s2++) {
          const l = t3(e3[s2]);
          if (!l) continue;
          const o = l[0], c = l[1];
          null == o || i.has(o) || (i.add(o), r.push(o)), null == c || n.has(c) || (n.add(c), a.push(c));
        }
        return { xLabels: de(r, s), yLabels: de(a, s) };
      })(this.records, e2.accessor, e2.order);
      return e2.xLabels = t2.xLabels, e2.yLabels = t2.yLabels, void (e2.edges = null);
    }
    if ("range" === e2.type) return e2.edges = (function(e3, t2, s) {
      if (s && Array.isArray(s.thresholds) && s.thresholds.length >= 2) {
        const e4 = Array.from(new Set(s.thresholds.filter(ce))).sort(((e5, t3) => e5 - t3));
        return e4.length >= 2 ? e4.map(oe) : [0, 1];
      }
      let i = 1 / 0, n = -1 / 0;
      for (let s2 = 0; s2 < e3.length; s2++) {
        const r2 = t2(e3[s2]);
        ce(r2) && (r2 < i && (i = r2), r2 > n && (n = r2));
      }
      if (i === 1 / 0) return [0, 1];
      if (i === n) {
        const e4 = Math.abs(i) > 0 ? Math.abs(i) : 1;
        return [oe(i), oe(i + e4)];
      }
      if (s && ce(s.width) && s.width > 0) {
        const e4 = s.width, t3 = Math.floor(i / e4) * e4;
        let r2 = Math.ceil(n / e4) * e4;
        r2 <= t3 && (r2 = t3 + e4);
        const a2 = Math.max(1, Math.round((r2 - t3) / e4)), l2 = new Array(a2 + 1);
        for (let s2 = 0; s2 <= a2; s2++) l2[s2] = oe(t3 + s2 * e4);
        return l2;
      }
      const r = s && ce(s.count) && s.count >= 1 ? Math.floor(s.count) : 30, a = (n - i) / r, l = new Array(r + 1);
      for (let e4 = 0; e4 <= r; e4++) l[e4] = oe(i + e4 * a);
      return l[r] = oe(n), l;
    })(this.records, e2.accessor, e2.bins), void (e2.labels = fe(e2.edges));
    if (e2.labels = (function(e3, t2, s) {
      const i = /* @__PURE__ */ new Set(), n = [];
      for (let s2 = 0; s2 < e3.length; s2++) {
        const r = t2(e3[s2]);
        null != r && (i.has(r) || (i.add(r), n.push(r)));
      }
      return de(n, s);
    })(this.records, e2.accessor, e2.order), e2.edges = null, e2.filter instanceof Set) {
      const t2 = new Set(e2.labels);
      Array.from(e2.filter).forEach(((s) => {
        t2.has(s) || e2.filter.delete(s);
      }));
    }
  }
  filter(e2, t2) {
    const s = this.dims.get(e2);
    return s ? (this.setFilterOn(s, t2), this.emit("change", this.state()), this) : this;
  }
  toggleKey(e2, t2) {
    const s = this.dims.get(e2);
    if (!s || "category" !== s.type) return this;
    s.filter instanceof Set || (s.filter = /* @__PURE__ */ new Set());
    const i = s.filter;
    return i.has(t2) ? i.delete(t2) : i.add(t2), 0 === i.size && (s.filter = null), this.emit("change", this.state()), this;
  }
  setFilterOn(e2, t2) {
    if (null == t2) return void (e2.filter = null);
    if ("range" === e2.type) {
      if (Array.isArray(t2) && 2 === t2.length && t2.every(ce)) {
        const [s2, i] = t2;
        e2.filter = [Math.min(s2, i), Math.max(s2, i)];
      } else e2.filter = null;
      return;
    }
    const s = new Set(t2);
    e2.filter = s.size ? s : null;
  }
  clear(e2) {
    const t2 = this.dims.get(e2);
    return t2 && (t2.filter = null), this.emit("change", this.state()), this;
  }
  reset() {
    return this.dims.forEach(((e2) => {
      e2.filter = null;
    })), this.emit("change", this.state()), this;
  }
  hasFilter(e2) {
    return null != e2.filter && (!(e2.filter instanceof Set) || e2.filter.size > 0);
  }
  passes(e2, t2) {
    if (!this.hasFilter(e2)) return true;
    const s = e2.accessor(t2);
    if (e2.filter instanceof Set) return e2.filter.has(s);
    if (!ce(s)) return false;
    const [i, n] = e2.filter;
    return s >= i && s <= n;
  }
  filteredRecords(e2) {
    const t2 = [];
    return this.dims.forEach(((s, i) => {
      i !== e2 && this.hasFilter(s) && t2.push(s);
    })), 0 === t2.length ? this.records : this.records.filter(((e3) => t2.every(((t3) => this.passes(t3, e3)))));
  }
  filteredRows() {
    return this.filteredRecords(null);
  }
  aggregateFor(e2) {
    const t2 = this.dims.get(e2);
    if (!t2) return { type: "category", labels: [], values: [], keys: [] };
    const s = this.filteredRecords(e2);
    if ("matrix" === t2.type) {
      const e3 = new Map(t2.xLabels.map(((e4, t3) => [e4, t3]))), i2 = new Map(t2.yLabels.map(((e4, t3) => [e4, t3]))), n = t2.yLabels.map((() => t2.xLabels.map((() => []))));
      for (let r = 0; r < s.length; r++) {
        const a = t2.accessor(s[r]);
        if (!a) continue;
        const l = e3.get(a[0]), o = i2.get(a[1]);
        null != l && null != o && n[o][l].push(s[r]);
      }
      return { type: "matrix", xLabels: t2.xLabels.slice(), yLabels: t2.yLabels.slice(), matrix: n.map(((e4) => e4.map(((e5) => t2.reducer(e5))))) };
    }
    if ("range" === t2.type) {
      const e3 = t2.edges || [0, 1], i2 = e3.length - 1, n = Array.from({ length: i2 }, (() => []));
      for (let i3 = 0; i3 < s.length; i3++) {
        const r = ue(t2.accessor(s[i3]), e3);
        r >= 0 && n[r].push(s[i3]);
      }
      return { type: "range", labels: fe(e3), values: n.map(((e4) => t2.reducer(e4))), keys: n.map(((t3, s2) => [e3[s2], e3[s2 + 1]])), edges: e3 };
    }
    const i = /* @__PURE__ */ new Map();
    t2.labels.forEach(((e3) => i.set(e3, [])));
    for (let e3 = 0; e3 < s.length; e3++) {
      const n = i.get(t2.accessor(s[e3]));
      n && n.push(s[e3]);
    }
    return { type: "category", labels: t2.labels.slice(), values: t2.labels.map(((e3) => t2.reducer(i.get(e3) || []))), keys: t2.labels.slice() };
  }
  aggregateAll() {
    const e2 = {};
    return this.dims.forEach(((t2, s) => {
      e2[s] = this.aggregateFor(s);
    })), e2;
  }
  state() {
    const e2 = {};
    return this.dims.forEach(((t2, s) => {
      this.hasFilter(t2) && (e2[s] = t2.filter instanceof Set ? Array.from(t2.filter) : t2.filter.slice());
    })), { filters: e2, filteredCount: this.filteredRows().length, total: this.records.length };
  }
  filterOf(e2) {
    const t2 = this.dims.get(e2);
    return t2 && this.hasFilter(t2) ? t2.filter instanceof Set ? new Set(t2.filter) : t2.filter.slice() : null;
  }
  on(e2, t2) {
    let s = this.listeners.get(e2);
    return s || (s = /* @__PURE__ */ new Set(), this.listeners.set(e2, s)), s.add(t2), () => this.off(e2, t2);
  }
  off(e2, t2) {
    var s;
    return null == (s = this.listeners.get(e2)) || s.delete(t2), this;
  }
  emit(e2, s) {
    var i;
    null == (i = this.listeners.get(e2)) || i.forEach(((i2) => {
      try {
        i2(s);
      } catch (s2) {
        t(`[Apex] a crossfilter ${e2} listener threw`, s2);
      }
    }));
  }
  static esc(e2) {
    return String(null == e2 ? "" : e2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  resolveColumns(e2) {
    if (Array.isArray(e2) && e2.length) return e2.map(((e3) => "string" == typeof e3 ? { field: e3, label: e3 } : { field: e3.field, label: e3.label || e3.field, format: e3.format }));
    const t2 = this.records[0];
    return (t2 ? Object.keys(t2) : []).map(((e3) => ({ field: e3, label: e3 })));
  }
  tableHTML(e2, t2, s) {
    const i = "<thead><tr>" + e2.map(((e3) => `<th>${pe.esc(e3.label)}</th>`)).join("") + "</tr></thead>", n = "<tbody>" + t2.map(((t3) => "<tr>" + e2.map(((e3) => {
      const s2 = t3[e3.field], i2 = e3.format ? e3.format(s2, t3) : s2;
      return `<td>${pe.esc(i2)}</td>`;
    })).join("") + "</tr>")).join("") + "</tbody>";
    return `<table class="apexcharts-cf-table">${`<caption>${t2.length} of ${s} rows</caption>`}${i}${n}</table>`;
  }
  dataTable(e2, t2) {
    if (!e2) return { refresh() {
    }, destroy() {
    } };
    const s = t2 || {}, i = this.resolveColumns(s.columns), n = s.pageSize || 0, r = s.page || 0, a = () => {
      const t3 = this.filteredRows(), s2 = n ? t3.slice(r * n, r * n + n) : t3;
      e2.innerHTML = this.tableHTML(i, s2, t3.length);
    };
    a();
    const l = this.on("change", a);
    return { refresh: a, destroy: () => {
      l(), e2.innerHTML = "";
    } };
  }
  destroy() {
    pe.store().delete(this.id), this.dims.clear(), this.listeners.clear(), this.records = [];
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
    return id ? pe.get(id) : null;
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
AC._crossfilterFactory = (opts) => pe.getOrCreate(opts);
AC._crossfilterGet = (id) => pe.get(id);
export {
  default2 as default
};
