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
 * ApexCharts v8.8.1
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const t = globalThis.console;
function e(e2, ...n) {
  t.error(e2, ...n);
}
const je = "__apexcharts_crossfilters__";
function Re(t2) {
  if (!Number.isFinite(t2)) return t2;
  const e2 = Number(t2.toPrecision(12));
  return Object.is(e2, -0) ? 0 : e2;
}
function De(t2) {
  return "number" == typeof t2 && Number.isFinite(t2);
}
function Fe(t2) {
  if ("function" == typeof t2) return t2;
  if (t2 && "object" == typeof t2) {
    if ("string" == typeof t2.sum) {
      const e2 = t2.sum;
      return (t3) => t3.reduce(((t4, n) => t4 + (Number(n[e2]) || 0)), 0);
    }
    if ("string" == typeof t2.avg) {
      const e2 = t2.avg;
      return (t3) => t3.length ? t3.reduce(((t4, n) => t4 + (Number(n[e2]) || 0)), 0) / t3.length : 0;
    }
    if ("string" == typeof t2.min) {
      const e2 = t2.min;
      return (t3) => t3.length ? Math.min(...t3.map(((t4) => Number(t4[e2]) || 0))) : 0;
    }
    if ("string" == typeof t2.max) {
      const e2 = t2.max;
      return (t3) => t3.length ? Math.max(...t3.map(((t4) => Number(t4[e2]) || 0))) : 0;
    }
  }
  return (t3) => t3.length;
}
function Ke(t2, e2) {
  return "function" == typeof e2 ? t2.slice().sort(e2) : "asc" === e2 ? t2.slice().sort(((t3, e3) => t3 > e3 ? 1 : t3 < e3 ? -1 : 0)) : "desc" === e2 ? t2.slice().sort(((t3, e3) => t3 < e3 ? 1 : t3 > e3 ? -1 : 0)) : t2;
}
function Oe(t2, e2) {
  if (!De(t2)) return -1;
  const n = e2.length - 1;
  if (t2 < e2[0] || t2 > e2[n]) return -1;
  if (t2 === e2[n]) return n - 1;
  for (let s = 0; s < n; s++) if (t2 >= e2[s] && t2 < e2[s + 1]) return s;
  return -1;
}
function qe(t2) {
  const e2 = [];
  for (let n = 0; n < t2.length - 1; n++) e2.push(Re((t2[n] + t2[n + 1]) / 2));
  return e2;
}
class _e {
  constructor(t2, e2) {
    this.dims = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Map(), this.id = t2, this.records = Array.isArray(e2) ? e2 : [];
  }
  static store() {
    const t2 = globalThis;
    return t2[je] || (t2[je] = /* @__PURE__ */ new Map()), t2[je];
  }
  static getOrCreate(t2) {
    if (!t2 || "string" != typeof t2.id) throw new Error("Crossfilter.getOrCreate requires an { id } string.");
    const e2 = _e.store(), n = e2.get(t2.id);
    if (n) return t2.records && n.setRecords(t2.records), n;
    const s = new _e(t2.id, t2.records);
    return e2.set(t2.id, s), s;
  }
  static get(t2) {
    return _e.store().get(t2) || null;
  }
  setRecords(t2) {
    return this.records = Array.isArray(t2) ? t2 : [], this.dims.forEach(((t3) => this.recomputeDomain(t3))), this.emit("records", this.state()), this.emit("change", this.state()), this;
  }
  registerDimension(t2, e2) {
    if (!e2 || "function" != typeof e2.dimension) throw new Error(`crossfilter.registerDimension("${t2}") needs a dimension function.`);
    const n = e2.type || (e2.bins ? "range" : "category"), s = { accessor: e2.dimension, reducer: Fe(e2.reduce), type: n, bins: e2.bins, order: e2.order, filter: null, labels: [], edges: null, xLabels: [], yLabels: [] };
    return this.dims.set(t2, s), this.recomputeDomain(s), null != e2.filter && this.setFilterOn(s, e2.filter), this;
  }
  hasDimension(t2) {
    return this.dims.has(t2);
  }
  removeDimension(t2) {
    const e2 = this.dims.get(t2), n = !!e2 && this.hasFilter(e2);
    return this.dims.delete(t2), n && this.emit("change", this.state()), this;
  }
  recomputeDomain(t2) {
    if ("matrix" === t2.type) {
      const e2 = (function(t3, e3, n) {
        const s = /* @__PURE__ */ new Set(), i = /* @__PURE__ */ new Set(), r = [], o = [];
        for (let n2 = 0; n2 < t3.length; n2++) {
          const l = e3(t3[n2]);
          if (!l) continue;
          const a = l[0], c = l[1];
          null == a || s.has(a) || (s.add(a), r.push(a)), null == c || i.has(c) || (i.add(c), o.push(c));
        }
        return { xLabels: Ke(r, n), yLabels: Ke(o, n) };
      })(this.records, t2.accessor, t2.order);
      return t2.xLabels = e2.xLabels, t2.yLabels = e2.yLabels, void (t2.edges = null);
    }
    if ("range" === t2.type) return t2.edges = (function(t3, e2, n) {
      if (n && Array.isArray(n.thresholds) && n.thresholds.length >= 2) {
        const t4 = Array.from(new Set(n.thresholds.filter(De))).sort(((t5, e3) => t5 - e3));
        return t4.length >= 2 ? t4.map(Re) : [0, 1];
      }
      let s = 1 / 0, i = -1 / 0;
      for (let n2 = 0; n2 < t3.length; n2++) {
        const r2 = e2(t3[n2]);
        De(r2) && (r2 < s && (s = r2), r2 > i && (i = r2));
      }
      if (s === 1 / 0) return [0, 1];
      if (s === i) {
        const t4 = Math.abs(s) > 0 ? Math.abs(s) : 1;
        return [Re(s), Re(s + t4)];
      }
      if (n && De(n.width) && n.width > 0) {
        const t4 = n.width, e3 = Math.floor(s / t4) * t4;
        let r2 = Math.ceil(i / t4) * t4;
        r2 <= e3 && (r2 = e3 + t4);
        const o2 = Math.max(1, Math.round((r2 - e3) / t4)), l2 = new Array(o2 + 1);
        for (let n2 = 0; n2 <= o2; n2++) l2[n2] = Re(e3 + n2 * t4);
        return l2;
      }
      const r = n && De(n.count) && n.count >= 1 ? Math.floor(n.count) : 30, o = (i - s) / r, l = new Array(r + 1);
      for (let t4 = 0; t4 <= r; t4++) l[t4] = Re(s + t4 * o);
      return l[r] = Re(i), l;
    })(this.records, t2.accessor, t2.bins), void (t2.labels = qe(t2.edges));
    if (t2.labels = (function(t3, e2, n) {
      const s = /* @__PURE__ */ new Set(), i = [];
      for (let n2 = 0; n2 < t3.length; n2++) {
        const r = e2(t3[n2]);
        null != r && (s.has(r) || (s.add(r), i.push(r)));
      }
      return Ke(i, n);
    })(this.records, t2.accessor, t2.order), t2.edges = null, t2.filter instanceof Set) {
      const e2 = new Set(t2.labels);
      Array.from(t2.filter).forEach(((n) => {
        e2.has(n) || t2.filter.delete(n);
      }));
    }
  }
  filter(t2, e2) {
    const n = this.dims.get(t2);
    return n ? (this.setFilterOn(n, e2), this.emit("change", this.state()), this) : this;
  }
  toggleKey(t2, e2) {
    const n = this.dims.get(t2);
    if (!n || "category" !== n.type) return this;
    n.filter instanceof Set || (n.filter = /* @__PURE__ */ new Set());
    const s = n.filter;
    return s.has(e2) ? s.delete(e2) : s.add(e2), 0 === s.size && (n.filter = null), this.emit("change", this.state()), this;
  }
  setFilterOn(t2, e2) {
    if (null == e2) return void (t2.filter = null);
    if ("range" === t2.type) {
      if (Array.isArray(e2) && 2 === e2.length && e2.every(De)) {
        const [n2, s] = e2;
        t2.filter = [Math.min(n2, s), Math.max(n2, s)];
      } else t2.filter = null;
      return;
    }
    const n = new Set(e2);
    t2.filter = n.size ? n : null;
  }
  clear(t2) {
    const e2 = this.dims.get(t2);
    return e2 && (e2.filter = null), this.emit("change", this.state()), this;
  }
  reset() {
    return this.dims.forEach(((t2) => {
      t2.filter = null;
    })), this.emit("change", this.state()), this;
  }
  hasFilter(t2) {
    return null != t2.filter && (!(t2.filter instanceof Set) || t2.filter.size > 0);
  }
  passes(t2, e2) {
    if (!this.hasFilter(t2)) return true;
    const n = t2.accessor(e2);
    if (t2.filter instanceof Set) return t2.filter.has(n);
    if (!De(n)) return false;
    const [s, i] = t2.filter;
    return n >= s && n <= i;
  }
  filteredRecords(t2) {
    const e2 = [];
    return this.dims.forEach(((n, s) => {
      s !== t2 && this.hasFilter(n) && e2.push(n);
    })), 0 === e2.length ? this.records : this.records.filter(((t3) => e2.every(((e3) => this.passes(e3, t3)))));
  }
  filteredRows() {
    return this.filteredRecords(null);
  }
  aggregateFor(t2) {
    const e2 = this.dims.get(t2);
    if (!e2) return { type: "category", labels: [], values: [], keys: [] };
    const n = this.filteredRecords(t2);
    if ("matrix" === e2.type) {
      const t3 = new Map(e2.xLabels.map(((t4, e3) => [t4, e3]))), s2 = new Map(e2.yLabels.map(((t4, e3) => [t4, e3]))), i = e2.yLabels.map((() => e2.xLabels.map((() => []))));
      for (let r = 0; r < n.length; r++) {
        const o = e2.accessor(n[r]);
        if (!o) continue;
        const l = t3.get(o[0]), a = s2.get(o[1]);
        null != l && null != a && i[a][l].push(n[r]);
      }
      return { type: "matrix", xLabels: e2.xLabels.slice(), yLabels: e2.yLabels.slice(), matrix: i.map(((t4) => t4.map(((t5) => e2.reducer(t5))))) };
    }
    if ("range" === e2.type) {
      const t3 = e2.edges || [0, 1], s2 = t3.length - 1, i = Array.from({ length: s2 }, (() => []));
      for (let s3 = 0; s3 < n.length; s3++) {
        const r = Oe(e2.accessor(n[s3]), t3);
        r >= 0 && i[r].push(n[s3]);
      }
      return { type: "range", labels: qe(t3), values: i.map(((t4) => e2.reducer(t4))), keys: i.map(((e3, n2) => [t3[n2], t3[n2 + 1]])), edges: t3 };
    }
    const s = /* @__PURE__ */ new Map();
    e2.labels.forEach(((t3) => s.set(t3, [])));
    for (let t3 = 0; t3 < n.length; t3++) {
      const i = s.get(e2.accessor(n[t3]));
      i && i.push(n[t3]);
    }
    return { type: "category", labels: e2.labels.slice(), values: e2.labels.map(((t3) => e2.reducer(s.get(t3) || []))), keys: e2.labels.slice() };
  }
  aggregateAll() {
    const t2 = {};
    return this.dims.forEach(((e2, n) => {
      t2[n] = this.aggregateFor(n);
    })), t2;
  }
  state() {
    const t2 = {};
    return this.dims.forEach(((e2, n) => {
      this.hasFilter(e2) && (t2[n] = e2.filter instanceof Set ? Array.from(e2.filter) : e2.filter.slice());
    })), { filters: t2, filteredCount: this.filteredRows().length, total: this.records.length };
  }
  filterOf(t2) {
    const e2 = this.dims.get(t2);
    return e2 && this.hasFilter(e2) ? e2.filter instanceof Set ? new Set(e2.filter) : e2.filter.slice() : null;
  }
  on(t2, e2) {
    let n = this.listeners.get(t2);
    return n || (n = /* @__PURE__ */ new Set(), this.listeners.set(t2, n)), n.add(e2), () => this.off(t2, e2);
  }
  off(t2, e2) {
    var n;
    return null == (n = this.listeners.get(t2)) || n.delete(e2), this;
  }
  emit(t2, n) {
    var s;
    null == (s = this.listeners.get(t2)) || s.forEach(((s2) => {
      try {
        s2(n);
      } catch (n2) {
        e(`[Apex] a crossfilter ${t2} listener threw`, n2);
      }
    }));
  }
  static esc(t2) {
    return String(null == t2 ? "" : t2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  resolveColumns(t2) {
    if (Array.isArray(t2) && t2.length) return t2.map(((t3) => "string" == typeof t3 ? { field: t3, label: t3 } : { field: t3.field, label: t3.label || t3.field, format: t3.format }));
    const e2 = this.records[0];
    return (e2 ? Object.keys(e2) : []).map(((t3) => ({ field: t3, label: t3 })));
  }
  tableHTML(t2, e2, n) {
    const s = "<thead><tr>" + t2.map(((t3) => `<th>${_e.esc(t3.label)}</th>`)).join("") + "</tr></thead>", i = "<tbody>" + e2.map(((e3) => "<tr>" + t2.map(((t3) => {
      const n2 = e3[t3.field], s2 = t3.format ? t3.format(n2, e3) : n2;
      return `<td>${_e.esc(s2)}</td>`;
    })).join("") + "</tr>")).join("") + "</tbody>";
    return `<table class="apexcharts-cf-table">${`<caption>${e2.length} of ${n} rows</caption>`}${s}${i}</table>`;
  }
  dataTable(t2, e2) {
    if (!t2) return { refresh() {
    }, destroy() {
    } };
    const n = e2 || {}, s = this.resolveColumns(n.columns), i = n.pageSize || 0, r = n.page || 0, o = () => {
      const e3 = this.filteredRows(), n2 = i ? e3.slice(r * i, r * i + i) : e3;
      t2.innerHTML = this.tableHTML(s, n2, e3.length);
    };
    o();
    const l = this.on("change", o);
    return { refresh: o, destroy: () => {
      l(), t2.innerHTML = "";
    } };
  }
  destroy() {
    _e.store().delete(this.id), this.dims.clear(), this.listeners.clear(), this.records = [];
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
    return id ? _e.get(id) : null;
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
  _onPointSelect(_e2, _ctx, opts) {
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
    this.ctx._replaceSeries(this._seriesFromAgg(agg), true, true, {
      keepView: true
    });
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
      this.ctx._replaceSeries(series, true, true, { keepView: true });
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
    var _a, _b, _c, _d, _e2, _f;
    this.clear();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "dataPointSelection", this._onPointSelect);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "mounted", this._afterRender);
      (_f = (_e2 = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e2, "updated", this._afterRender);
      const cf = this._cf();
      if (cf) {
        cf.off("change", this._onChange);
        cf.removeDimension(this._chartId());
      }
      this._wired = false;
    }
  }
}
ApexCharts.registerFeatures({
  linkedViews: LinkedViews,
  crossfilter: (
    /** @type {any} */
    _e
  )
});
export {
  default2 as default
};
