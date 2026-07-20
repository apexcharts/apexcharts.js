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
 * ApexCharts v6.4.0
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const REGISTRY_KEY = "__apexcharts_crossfilters__";
function cleanFloat(x) {
  if (!Number.isFinite(x)) return x;
  const n = Number(x.toPrecision(12));
  return Object.is(n, -0) ? 0 : n;
}
function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function makeReducer(reduce) {
  if (typeof reduce === "function") return reduce;
  if (reduce && typeof reduce === "object") {
    if (typeof reduce.sum === "string") {
      const f = reduce.sum;
      return (rows) => rows.reduce((a, r) => a + (Number(r[f]) || 0), 0);
    }
    if (typeof reduce.avg === "string") {
      const f = reduce.avg;
      return (rows) => rows.length ? rows.reduce((a, r) => a + (Number(r[f]) || 0), 0) / rows.length : 0;
    }
    if (typeof reduce.min === "string") {
      const f = reduce.min;
      return (rows) => rows.length ? Math.min(...rows.map((r) => Number(r[f]) || 0)) : 0;
    }
    if (typeof reduce.max === "string") {
      const f = reduce.max;
      return (rows) => rows.length ? Math.max(...rows.map((r) => Number(r[f]) || 0)) : 0;
    }
  }
  return (rows) => rows.length;
}
function applyOrder(keys, order) {
  if (typeof order === "function") return keys.slice().sort(order);
  if (order === "asc") return keys.slice().sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
  if (order === "desc") return keys.slice().sort((a, b) => a < b ? 1 : a > b ? -1 : 0);
  return keys;
}
function categoryDomain(records, accessor, order) {
  const seen = /* @__PURE__ */ new Set();
  const keys = [];
  for (let i = 0; i < records.length; i++) {
    const k = accessor(records[i]);
    if (k == null) continue;
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  }
  return applyOrder(keys, order);
}
function matrixDomain(records, accessor, order) {
  const xSeen = /* @__PURE__ */ new Set();
  const ySeen = /* @__PURE__ */ new Set();
  const xLabels = [];
  const yLabels = [];
  for (let i = 0; i < records.length; i++) {
    const pair = accessor(records[i]);
    if (!pair) continue;
    const x = pair[0];
    const y = pair[1];
    if (x != null && !xSeen.has(x)) {
      xSeen.add(x);
      xLabels.push(x);
    }
    if (y != null && !ySeen.has(y)) {
      ySeen.add(y);
      yLabels.push(y);
    }
  }
  return { xLabels: applyOrder(xLabels, order), yLabels: applyOrder(yLabels, order) };
}
function rangeEdges(records, accessor, bins) {
  if (bins && Array.isArray(bins.thresholds) && bins.thresholds.length >= 2) {
    const t = Array.from(new Set(bins.thresholds.filter(isNum))).sort(
      (a, b) => a - b
    );
    return t.length >= 2 ? t.map(cleanFloat) : [0, 1];
  }
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < records.length; i++) {
    const v = accessor(records[i]);
    if (!isNum(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) return [0, 1];
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) : 1;
    return [cleanFloat(min), cleanFloat(min + pad)];
  }
  if (bins && isNum(bins.width) && bins.width > 0) {
    const w2 = bins.width;
    const start = Math.floor(min / w2) * w2;
    let end = Math.ceil(max / w2) * w2;
    if (end <= start) end = start + w2;
    const count2 = Math.max(1, Math.round((end - start) / w2));
    const edges2 = new Array(count2 + 1);
    for (let i = 0; i <= count2; i++) edges2[i] = cleanFloat(start + i * w2);
    return edges2;
  }
  const count = bins && isNum(bins.count) && bins.count >= 1 ? Math.floor(bins.count) : 30;
  const w = (max - min) / count;
  const edges = new Array(count + 1);
  for (let i = 0; i <= count; i++) edges[i] = cleanFloat(min + i * w);
  edges[count] = cleanFloat(max);
  return edges;
}
function binIndexOf(v, edges) {
  if (!isNum(v)) return -1;
  const last = edges.length - 1;
  if (v < edges[0] || v > edges[last]) return -1;
  if (v === edges[last]) return last - 1;
  for (let i = 0; i < last; i++) {
    if (v >= edges[i] && v < edges[i + 1]) return i;
  }
  return -1;
}
function binCenters(edges) {
  const centers = [];
  for (let i = 0; i < edges.length - 1; i++) {
    centers.push(cleanFloat((edges[i] + edges[i + 1]) / 2));
  }
  return centers;
}
class Crossfilter {
  /**
   * @param {string} id
   * @param {any[]} [records]
   */
  constructor(id, records) {
    this.id = id;
    this.records = Array.isArray(records) ? records : [];
    this.dims = /* @__PURE__ */ new Map();
    this._listeners = /* @__PURE__ */ new Map();
  }
  // ----- registry ---------------------------------------------------------
  /** @returns {Map<string, Crossfilter>} */
  static _store() {
    const g = (
      /** @type {any} */
      globalThis
    );
    if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = /* @__PURE__ */ new Map();
    return g[REGISTRY_KEY];
  }
  /**
   * Get-or-create a coordinator by id. Passing `records` on an existing
   * coordinator swaps its dataset (re-aggregates).
   * @param {{id:string, records?:any[]}} opts
   * @returns {Crossfilter}
   */
  static getOrCreate(opts) {
    if (!opts || typeof opts.id !== "string") {
      throw new Error("ApexCharts.crossfilter requires an { id } string.");
    }
    const store = Crossfilter._store();
    let cf = store.get(opts.id);
    if (cf) {
      if (opts.records) cf.setRecords(opts.records);
      return cf;
    }
    cf = new Crossfilter(opts.id, opts.records);
    store.set(opts.id, cf);
    return cf;
  }
  /** @param {string} id @returns {Crossfilter|null} */
  static get(id) {
    return Crossfilter._store().get(id) || null;
  }
  // ----- data + dimensions ------------------------------------------------
  /**
   * Swap the shared dataset and recompute every dimension's domain. Existing
   * filters are kept where still valid (categorical keys no longer present are
   * pruned); the change is broadcast.
   * @param {any[]} records
   */
  setRecords(records) {
    this.records = Array.isArray(records) ? records : [];
    this.dims.forEach((dim) => this._recomputeDomain(dim));
    this._emit("records", this.state());
    this._emit("change", this.state());
    return this;
  }
  /**
   * Register (or replace) a chart's dimension + reduction.
   * @param {string} chartId
   * @param {{
   *   dimension:(row:any)=>any, reduce?:any, type?:'category'|'range',
   *   bins?:{width?:number,count?:number,thresholds?:number[]},
   *   order?:'first-seen'|'asc'|'desc'|((a:any,b:any)=>number),
   *   filter?:any }} spec
   */
  registerDimension(chartId, spec) {
    if (!spec || typeof spec.dimension !== "function") {
      throw new Error(
        `crossfilter.registerDimension("${chartId}") needs a dimension function.`
      );
    }
    const type = spec.type || (spec.bins ? "range" : "category");
    const dim = {
      accessor: spec.dimension,
      reducer: makeReducer(spec.reduce),
      type,
      bins: spec.bins,
      order: spec.order,
      /** @type {Set<any>|[number,number]|null} */
      filter: null,
      /** @type {any[]} */
      labels: [],
      /** @type {number[]|null} */
      edges: null
    };
    this.dims.set(chartId, dim);
    this._recomputeDomain(dim);
    if (spec.filter != null) this._setFilterOn(dim, spec.filter);
    return this;
  }
  /** @param {string} chartId @returns {boolean} */
  hasDimension(chartId) {
    return this.dims.has(chartId);
  }
  /** @param {string} chartId */
  removeDimension(chartId) {
    this.dims.delete(chartId);
    return this;
  }
  /** @param {any} dim */
  _recomputeDomain(dim) {
    if (dim.type === "matrix") {
      const dom = matrixDomain(this.records, dim.accessor, dim.order);
      dim.xLabels = dom.xLabels;
      dim.yLabels = dom.yLabels;
      dim.edges = null;
      return;
    }
    if (dim.type === "range") {
      dim.edges = rangeEdges(this.records, dim.accessor, dim.bins);
      dim.labels = binCenters(dim.edges);
    } else {
      dim.labels = categoryDomain(this.records, dim.accessor, dim.order);
      dim.edges = null;
      if (dim.filter instanceof Set) {
        const domain = new Set(dim.labels);
        Array.from(dim.filter).forEach((k) => {
          if (!domain.has(k)) dim.filter.delete(k);
        });
      }
    }
  }
  // ----- filters ----------------------------------------------------------
  /**
   * Set (replace) a chart's filter. Categorical: an array/Set of keys (or null
   * to clear). Range: a `[min,max]` tuple (or null to clear).
   * @param {string} chartId
   * @param {any[]|Set<any>|[number,number]|null} filter
   */
  filter(chartId, filter) {
    const dim = this.dims.get(chartId);
    if (!dim) return this;
    this._setFilterOn(dim, filter);
    this._emit("change", this.state());
    return this;
  }
  /**
   * Toggle one categorical key in a chart's filter Set (multi-select, OR).
   * @param {string} chartId @param {any} key
   */
  toggleKey(chartId, key) {
    const dim = this.dims.get(chartId);
    if (!dim || dim.type !== "category") return this;
    if (!(dim.filter instanceof Set)) dim.filter = /* @__PURE__ */ new Set();
    const set = (
      /** @type {Set<any>} */
      dim.filter
    );
    if (set.has(key)) set.delete(key);
    else set.add(key);
    if (set.size === 0) dim.filter = null;
    this._emit("change", this.state());
    return this;
  }
  /** @param {any} dim @param {any} filter */
  _setFilterOn(dim, filter) {
    if (filter == null) {
      dim.filter = null;
      return;
    }
    if (dim.type === "range") {
      if (Array.isArray(filter) && filter.length === 2 && filter.every(isNum)) {
        dim.filter = [Math.min(filter[0], filter[1]), Math.max(filter[0], filter[1])];
      } else {
        dim.filter = null;
      }
      return;
    }
    const set = filter instanceof Set ? new Set(filter) : new Set(filter);
    dim.filter = set.size ? set : null;
  }
  /**
   * Clear one chart's filter.
   * @param {string} chartId
   */
  clear(chartId) {
    const dim = this.dims.get(chartId);
    if (dim) dim.filter = null;
    this._emit("change", this.state());
    return this;
  }
  /** Clear all filters across every dimension. */
  reset() {
    this.dims.forEach((dim) => {
      dim.filter = null;
    });
    this._emit("change", this.state());
    return this;
  }
  /** @param {any} dim @returns {boolean} does this dimension have an active filter */
  _hasFilter(dim) {
    if (dim.filter == null) return false;
    if (dim.filter instanceof Set) return dim.filter.size > 0;
    return true;
  }
  /** @param {any} dim @param {any} row @returns {boolean} does row pass this dim's filter */
  _passes(dim, row) {
    if (!this._hasFilter(dim)) return true;
    const v = dim.accessor(row);
    if (dim.filter instanceof Set) return dim.filter.has(v);
    if (!isNum(v)) return false;
    return v >= dim.filter[0] && v <= dim.filter[1];
  }
  // ----- aggregation ------------------------------------------------------
  /**
   * Records passing every ACTIVE filter except the one on `exceptChartId`
   * (pass null/undefined to apply all filters).
   * @param {string|null} [exceptChartId]
   * @returns {any[]}
   */
  filteredRecords(exceptChartId) {
    const active = [];
    this.dims.forEach((dim, id) => {
      if (id === exceptChartId) return;
      if (this._hasFilter(dim)) active.push(dim);
    });
    if (active.length === 0) return this.records;
    return this.records.filter((row) => active.every((dim) => this._passes(dim, row)));
  }
  /** Rows passing ALL active filters (the fully filtered set). @returns {any[]} */
  filteredRows() {
    return this.filteredRecords(null);
  }
  /**
   * The crossfilter aggregation for one chart: reduce over records passing all
   * OTHER charts' filters, bucketed by this chart's dimension. Category/range
   * dims return `{type, labels, values, keys, edges?}`; a matrix (2D) dim
   * returns `{type:'matrix', xLabels, yLabels, matrix}`.
   * @param {string} chartId
   * @returns {any}
   */
  aggregateFor(chartId) {
    const dim = this.dims.get(chartId);
    if (!dim) return { type: "category", labels: [], values: [], keys: [] };
    const rows = this.filteredRecords(chartId);
    if (dim.type === "matrix") {
      const xIndex = new Map(dim.xLabels.map((k, i) => [k, i]));
      const yIndex = new Map(dim.yLabels.map((k, i) => [k, i]));
      const buckets = dim.yLabels.map(() => dim.xLabels.map(() => []));
      for (let i = 0; i < rows.length; i++) {
        const pair = dim.accessor(rows[i]);
        if (!pair) continue;
        const xi = xIndex.get(pair[0]);
        const yi = yIndex.get(pair[1]);
        if (xi != null && yi != null) buckets[yi][xi].push(rows[i]);
      }
      return {
        type: "matrix",
        xLabels: dim.xLabels.slice(),
        yLabels: dim.yLabels.slice(),
        matrix: buckets.map((brow) => brow.map((cell) => dim.reducer(cell)))
      };
    }
    if (dim.type === "range") {
      const edges = dim.edges || [0, 1];
      const nBins = edges.length - 1;
      const buckets = Array.from({ length: nBins }, () => []);
      for (let i = 0; i < rows.length; i++) {
        const idx = binIndexOf(dim.accessor(rows[i]), edges);
        if (idx >= 0) buckets[idx].push(rows[i]);
      }
      return {
        type: "range",
        labels: binCenters(edges),
        // plot bars at bin centers, not lower edges
        values: buckets.map((b) => dim.reducer(b)),
        keys: buckets.map((_, i) => [edges[i], edges[i + 1]]),
        edges
      };
    }
    const index = /* @__PURE__ */ new Map();
    dim.labels.forEach((k) => index.set(k, []));
    for (let i = 0; i < rows.length; i++) {
      const k = dim.accessor(rows[i]);
      const bucket = index.get(k);
      if (bucket) bucket.push(rows[i]);
    }
    return {
      type: "category",
      labels: dim.labels.slice(),
      values: dim.labels.map(
        (k) => dim.reducer(index.get(k) || [])
      ),
      keys: dim.labels.slice()
    };
  }
  /**
   * Aggregate every registered chart.
   * @returns {Record<string, ReturnType<Crossfilter['aggregateFor']>>}
   */
  aggregateAll() {
    const out = {};
    this.dims.forEach((_dim, id) => {
      out[id] = this.aggregateFor(id);
    });
    return out;
  }
  // ----- state + events ---------------------------------------------------
  /**
   * A serializable snapshot: active filters, filtered/total record counts.
   * @returns {{filters:Record<string, any[]|[number,number]>, filteredCount:number, total:number}}
   */
  state() {
    const filters = {};
    this.dims.forEach((dim, id) => {
      if (!this._hasFilter(dim)) return;
      filters[id] = dim.filter instanceof Set ? Array.from(dim.filter) : dim.filter.slice();
    });
    return {
      filters,
      filteredCount: this.filteredRows().length,
      total: this.records.length
    };
  }
  /** @param {string} chartId @returns {any} the current filter (Set copy / range copy / null) */
  filterOf(chartId) {
    const dim = this.dims.get(chartId);
    if (!dim || !this._hasFilter(dim)) return null;
    return dim.filter instanceof Set ? new Set(dim.filter) : dim.filter.slice();
  }
  /**
   * Subscribe to an event ('change' | 'records'). Returns an unsubscribe fn.
   * @param {string} event @param {Function} cb
   */
  on(event, cb) {
    let set = this._listeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this._listeners.set(event, set);
    }
    set.add(cb);
    return () => this.off(event, cb);
  }
  /** @param {string} event @param {Function} cb */
  off(event, cb) {
    var _a;
    (_a = this._listeners.get(event)) == null ? void 0 : _a.delete(cb);
    return this;
  }
  /** @param {string} event @param {any} payload */
  _emit(event, payload) {
    var _a;
    (_a = this._listeners.get(event)) == null ? void 0 : _a.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(e);
      }
    });
  }
  // ----- data table (presentation helper) ---------------------------------
  // Renders the filtered rows into a user-provided element and keeps it in sync
  // on every filter change. Only the passed `el` is touched (no window/document
  // globals), so the engine stays SSR-safe and unit-testable.
  /** @param {string} s @returns {string} HTML-escaped */
  _esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /**
   * @param {Array<string|{field:string,label?:string,format?:(v:any,row:any)=>any}>|undefined} columns
   * @returns {Array<{field:string,label:string,format?:Function}>}
   */
  _resolveColumns(columns) {
    if (Array.isArray(columns) && columns.length) {
      return columns.map(
        (c) => typeof c === "string" ? { field: c, label: c } : { field: c.field, label: c.label || c.field, format: c.format }
      );
    }
    const first = this.records[0];
    const fields = first ? Object.keys(first) : [];
    return fields.map((f) => ({ field: f, label: f }));
  }
  /**
   * @param {Array<{field:string,label:string,format?:Function}>} columns
   * @param {any[]} rows @param {number} total
   * @returns {string}
   */
  _tableHTML(columns, rows, total) {
    const head = "<thead><tr>" + columns.map((c) => `<th>${this._esc(c.label)}</th>`).join("") + "</tr></thead>";
    const body = "<tbody>" + rows.map(
      (row) => "<tr>" + columns.map((c) => {
        const raw = row[c.field];
        const val = c.format ? c.format(raw, row) : raw;
        return `<td>${this._esc(val)}</td>`;
      }).join("") + "</tr>"
    ).join("") + "</tbody>";
    const caption = `<caption>${rows.length} of ${total} rows</caption>`;
    return `<table class="apexcharts-cf-table">${caption}${head}${body}</table>`;
  }
  /**
   * Bind an HTML table of the filtered rows to `el`; it re-renders on every
   * filter change. Returns a handle with refresh()/destroy().
   * @param {HTMLElement} el
   * @param {{columns?:any[], page?:number, pageSize?:number}} [opts]
   */
  dataTable(el, opts) {
    if (!el) return { refresh() {
    }, destroy() {
    } };
    const o = opts || {};
    const columns = this._resolveColumns(o.columns);
    const pageSize = o.pageSize || 0;
    const page = o.page || 0;
    const render = () => {
      const rows = this.filteredRows();
      const shown = pageSize ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows;
      el.innerHTML = this._tableHTML(columns, shown, rows.length);
    };
    render();
    const off = this.on("change", render);
    return {
      refresh: render,
      destroy: () => {
        off();
        el.innerHTML = "";
      }
    };
  }
  /** Remove this coordinator from the registry and drop all state. */
  destroy() {
    Crossfilter._store().delete(this.id);
    this.dims.clear();
    this._listeners.clear();
    this.records = [];
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
    return id ? Crossfilter.get(id) : null;
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
    }
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
    this._applySelfDim();
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
    const keys = cf.aggregateFor(chartId).keys;
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
AC._crossfilterFactory = (opts) => Crossfilter.getOrCreate(opts);
AC._crossfilterGet = (id) => Crossfilter.get(id);
export {
  default2 as default
};
