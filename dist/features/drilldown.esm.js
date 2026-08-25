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
  return new Promise((resolve, reject) => {
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
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v7.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = _core.__apex_Utils;
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const BREADCRUMB_HEIGHT = 18;
function breadcrumbCeiling(w, nav) {
  const gridTop = w.layout.translateY || 0;
  const elWrap = w.dom.elWrap;
  if (!elWrap) return gridTop;
  const labels = w.dom.baseEl.querySelectorAll(".apexcharts-yaxis-label");
  if (!labels.length) return gridTop;
  const wrapTop = elWrap.getBoundingClientRect().top;
  const navRect = nav.getBoundingClientRect();
  let ceiling = gridTop;
  for (let i = 0; i < labels.length; i++) {
    const r = labels[i].getBoundingClientRect();
    if (!r.height) continue;
    if (r.left >= navRect.right || r.right <= navRect.left) continue;
    ceiling = Math.min(ceiling, r.top - wrapTop);
  }
  return ceiling;
}
function placeInReservedBand(w, ctx, nav, cfg) {
  var _a;
  const dimHelpers = (_a = ctx == null ? void 0 : ctx.dimensions) == null ? void 0 : _a.dimHelpers;
  const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
  const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT;
  const offsetY = cfg && cfg.offsetY || 0;
  const ceiling = breadcrumbCeiling(w, nav);
  if (ceiling - titleArea >= navH + 1) {
    nav.style.top = `${ceiling - navH - 1 + offsetY}px`;
    return true;
  }
  nav.style.top = `${titleArea + offsetY}px`;
  const dark = w.config.theme.mode === "dark";
  nav.style.background = dark ? "rgba(20,24,30,0.82)" : "rgba(255,255,255,0.86)";
  nav.style.borderRadius = "4px";
  return false;
}
const XHTML$1 = "http://www.w3.org/1999/xhtml";
class Breadcrumb {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {import('./Drilldown').default} drilldown
   */
  constructor(w, ctx, drilldown) {
    this.w = w;
    this.ctx = ctx;
    this.drilldown = drilldown;
  }
  /**
   * @param {Array<string|number>} path - ['root', id, id, ...]
   */
  render(path) {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap) return;
    const existing = elWrap.querySelector(".apexcharts-breadcrumb");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const cfg = w.config.drilldown && w.config.drilldown.breadcrumb;
    if (!cfg || cfg.show === false) return;
    if (this.drilldown.depth === 0) return;
    const nav = BrowserAPIs.createElementNS(XHTML$1, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Drilldown breadcrumb");
    this._position(nav, cfg);
    const separator = cfg.separator != null ? cfg.separator : " / ";
    path.forEach((id, i) => {
      if (i > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML$1, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        nav.appendChild(sep);
      }
      const label = this._label(id, i);
      const isCurrent = i === path.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML$1, "span");
        cur.setAttribute(
          "class",
          "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
        );
        cur.setAttribute("aria-current", "page");
        cur.textContent = label;
        nav.appendChild(cur);
      } else {
        const btn = (
          /** @type {HTMLButtonElement} */
          BrowserAPIs.createElementNS(XHTML$1, "button")
        );
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML$1, "span");
          arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "←";
          btn.appendChild(arrow);
        }
        const text = BrowserAPIs.createElementNS(XHTML$1, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = label;
        btn.appendChild(text);
        btn.addEventListener("click", () => this.drilldown.drillToLevel(i));
        nav.appendChild(btn);
      }
    });
    elWrap.appendChild(nav);
    if (this.w.globals.axisCharts) {
      placeInReservedBand(this.w, this.ctx, nav, cfg);
    }
    this._avoidChromeOverlap(nav);
  }
  /**
   * The breadcrumb is an absolute overlay, so at its default top-left it can
   * sit on top of a left-aligned title (or subtitle). After mounting, push it
   * below any chart chrome it intersects. (Sunburst's self-contained
   * breadcrumb applies the same rule.)
   * @param {HTMLElement} nav
   */
  _avoidChromeOverlap(nav) {
    const w = this.w;
    const chrome = (
      /** @type {Element[]} */
      [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s) => w.dom.baseEl.querySelector(s)).filter((el) => el !== null)
    );
    if (!chrome.length) return;
    const wrapTop = w.dom.elWrap.getBoundingClientRect().top;
    for (let pass = 0; pass < chrome.length + 1; pass++) {
      const nr = nav.getBoundingClientRect();
      const hit = chrome.find((el) => {
        const r = el.getBoundingClientRect();
        return nr.left < r.right && nr.right > r.left && nr.top < r.bottom && nr.bottom > r.top;
      });
      if (!hit) break;
      nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`;
    }
  }
  /**
   * @param {string|number} id
   * @param {number} index
   * @returns {string}
   */
  _label(id, index) {
    const cfg = this.w.config.drilldown.breadcrumb;
    let label;
    if (index === 0) {
      label = cfg.rootLabel != null ? cfg.rootLabel : "All";
    } else {
      const list = (this.w.config.drilldown.series || []).find(
        (s) => s && s.id === id
      );
      label = list && list.name || String(id);
    }
    if (typeof cfg.formatter === "function") {
      return cfg.formatter(label, { index, depth: this.drilldown.depth });
    }
    return label;
  }
  /**
   * @param {HTMLElement} nav
   * @param {Record<string, any>} cfg
   */
  _position(nav, cfg) {
    const ox = cfg.offsetX || 0;
    const oy = cfg.offsetY || 0;
    nav.style.position = "absolute";
    nav.style.top = oy + "px";
    if (cfg.position === "top-right") {
      nav.style.right = -ox + 3 + "px";
    } else {
      nav.style.left = ox + "px";
    }
  }
}
const XHTML = "http://www.w3.org/1999/xhtml";
const CLASS = "apexcharts-drilldown-loading";
class DrilldownLoading {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w;
    this.el = null;
  }
  /** @returns {any} the drilldown.loading config, normalised. */
  _cfg() {
    const d = this.w.config.drilldown;
    const l = d && d.loading;
    if (l === false) return { show: false };
    return l || {};
  }
  /**
   * Mount the overlay. No-op when disabled, outside a browser, or already up.
   */
  show() {
    if (!Environment.isBrowser()) return;
    const cfg = this._cfg();
    if (cfg.show === false) return;
    const elWrap = this.w.dom.elWrap;
    if (!elWrap) return;
    this.hide();
    const box = BrowserAPIs.createElementNS(XHTML, "div");
    box.setAttribute("class", CLASS);
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", cfg.text || "Loading");
    const spinner = BrowserAPIs.createElementNS(XHTML, "div");
    spinner.setAttribute("class", `${CLASS}-spinner`);
    spinner.setAttribute("aria-hidden", "true");
    box.appendChild(spinner);
    if (cfg.text) {
      const label = BrowserAPIs.createElementNS(XHTML, "span");
      label.setAttribute("class", `${CLASS}-text`);
      label.textContent = cfg.text;
      box.appendChild(label);
    }
    elWrap.appendChild(box);
    this.el = box;
  }
  /** Remove the overlay. Safe to call when it is not mounted. */
  hide() {
    const elWrap = this.w.dom.elWrap;
    if (elWrap) {
      const nodes = elWrap.querySelectorAll(`.${CLASS}`);
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.parentNode) n.parentNode.removeChild(n);
      }
    } else if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
const MAX_DEPTH = 32;
const DRILL_MARKER = "__apexDrilldownMarker";
class Drilldown {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.stack = [];
    this.rootSnapshot = null;
    this._wired = false;
    this._asyncCache = /* @__PURE__ */ new Map();
    this._pending = null;
    this._warnedUnreachable = false;
    this._warnedNoSliceOffset = false;
    this.breadcrumb = new Breadcrumb(w, ctx, this);
    this.loading = new DrilldownLoading(w);
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onPlotDown = this._onPlotDown.bind(this);
    this._onPlotClick = this._onPlotClick.bind(this);
    this._downAt = null;
    this._plotClickWired = null;
    this.init();
  }
  init() {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return;
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series);
    }
  }
  // ─── Observable state ──────────────────────────────────────────────────────
  /** @returns {Array<string|number>} e.g. ['root', '2024-quarters'] */
  get path() {
    return ["root", ...this.stack.map((f) => f.id)];
  }
  /** @returns {number} 0 at root */
  get depth() {
    return this.stack.length;
  }
  // ─── Navigation API ────────────────────────────────────────────────────────
  /**
   * Drill into the child level with the given id.
   * @param {string|number} id
   * @param {any} [triggerPoint] - the clicked data point (for events / async ctx)
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  drillDown(id, triggerPoint, meta) {
    const child = this._resolveChild(id);
    if (child) return this._drillInto(child, triggerPoint, meta);
    if (typeof this.w.config.drilldown.onDrillDown === "function") {
      return this._drillDownAsync(id, triggerPoint, meta);
    }
    console.warn(
      `ApexCharts: drilldown id "${id}" not found in chart.drilldown.series, and no onDrillDown resolver is set.`
    );
    return Promise.resolve(this.ctx);
  }
  /**
   * Navigate back one level.
   * @returns {Promise<any>}
   */
  drillUp() {
    return this.drillToLevel(this.stack.length - 1);
  }
  /**
   * Navigate back to the root view.
   * @returns {Promise<any>}
   */
  drillToRoot() {
    return this.drillToLevel(0);
  }
  /**
   * Navigate to an arbitrary depth (0 = root). Used by breadcrumb clicks.
   * @param {number} targetDepth
   * @returns {Promise<any>}
   */
  drillToLevel(targetDepth) {
    const cur = this.stack.length;
    if (targetDepth < 0 || targetDepth >= cur) return Promise.resolve(this.ctx);
    const from = this.path[this.path.length - 1];
    const restore = targetDepth === 0 ? this.rootSnapshot : this.stack[targetDepth].restore;
    this.stack = this.stack.slice(0, targetDepth);
    const to = this.path[this.path.length - 1];
    return this._apply(this._viewFromSnapshot(restore), "up", { from, to });
  }
  // ─── Internals ─────────────────────────────────────────────────────────────
  /**
   * @param {string|number} id
   * @returns {any|null}
   */
  _resolveChild(id) {
    const list = this.w.config.drilldown && this.w.config.drilldown.series;
    if (!Array.isArray(list)) return null;
    return list.find((s) => s && s.id === id) || null;
  }
  /**
   * @param {any} child
   * @param {any} [triggerPoint]
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillInto(child, triggerPoint, meta) {
    if (this.stack.length >= MAX_DEPTH) {
      console.warn(`ApexCharts: drilldown max depth (${MAX_DEPTH}) reached.`);
      return Promise.resolve(this.ctx);
    }
    if (!this.rootSnapshot) this.rootSnapshot = this._snapshot();
    const from = this.path[this.path.length - 1];
    this.stack.push({ id: child.id, name: child.name, restore: this._snapshot() });
    return this._apply(this._viewFromChild(child), "down", {
      from,
      to: child.id,
      point: triggerPoint,
      seriesIndex: meta && meta.seriesIndex,
      dataPointIndex: meta && meta.dataPointIndex
    });
  }
  /**
   * Resolve a level through `onDrillDown` and drill into it.
   *
   * Failure never changes state: on a throw, a rejection, or a resolver that
   * hands back something undrillable, the chart stays exactly where it was and
   * `drillDownError` fires. That is what makes this usable against a real
   * backend, where a fetch failing is ordinary rather than exceptional.
   *
   * @param {string|number|null} id
   * @param {any} point
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillDownAsync(id, point, meta) {
    const cfg = this.w.config.drilldown;
    const fn = cfg.onDrillDown;
    const cached = this._cacheGet(id);
    if (cached) return this._drillInto(cached, point, meta);
    if (this._pending) return this._pending;
    let result;
    this.loading.show();
    try {
      result = fn({
        // `id` was missing here, so a resolver could not tell WHICH level was
        // asked for without re-deriving it from the point. It is the first
        // thing a real implementation needs (`fetch('/levels/' + id)`).
        id,
        point,
        seriesIndex: meta && meta.seriesIndex,
        dataPointIndex: meta && meta.dataPointIndex
      });
    } catch (error) {
      this.loading.hide();
      this._fire("drillDownError", { id, error });
      return Promise.resolve(this.ctx);
    }
    const settle = () => {
      this._pending = null;
      this.loading.hide();
    };
    const p = Promise.resolve(result).then(
      (child) => {
        settle();
        if (this._isDead()) return this.ctx;
        if (!child || !child.data) {
          this._fire("drillDownError", {
            id,
            error: new Error(
              `drilldown: onDrillDown resolved without a drillable level for id "${id}" (expected an object with a \`data\` array).`
            )
          });
          return this.ctx;
        }
        const level = child.id != null ? child : __spreadProps(__spreadValues({}, child), { id });
        this._cacheSet(id, level);
        return this._drillInto(level, point, meta);
      },
      (error) => {
        settle();
        if (this._isDead()) return this.ctx;
        this._fire("drillDownError", { id, error });
        return this.ctx;
      }
    );
    this._pending = p;
    return p;
  }
  /**
   * Whether the chart was torn down while a resolver was in flight.
   *
   * Clicking to drill and then navigating away is ordinary, not exceptional: a
   * component unmounts, `destroy()` runs, and the fetch settles afterwards.
   * Without this the resolved level would be applied to a destroyed chart,
   * which throws out of `updateOptions` and surfaces in the host app as an
   * unhandled rejection from a click the user has already forgotten about.
   *
   * @returns {boolean}
   */
  _isDead() {
    const w = this.w;
    return !w || !w.globals || w.globals.isDestroyed === true;
  }
  /** @returns {boolean} whether resolved async levels are cached. */
  _cacheEnabled() {
    const cfg = this.w.config.drilldown;
    return !!(cfg && cfg.cache !== false);
  }
  /**
   * @param {string|number|null} id
   * @returns {any|null}
   */
  _cacheGet(id) {
    if (!this._cacheEnabled() || id == null) return null;
    return this._asyncCache.get(id) || null;
  }
  /**
   * @param {string|number|null} id
   * @param {any} level
   */
  _cacheSet(id, level) {
    if (!this._cacheEnabled() || id == null) return;
    this._asyncCache.set(id, level);
  }
  /**
   * Drop cached async levels, so the next drill re-runs `onDrillDown`. Call it
   * when the underlying data changes behind a chart that has already drilled.
   * @param {string|number} [id] a single level, or every level when omitted
   * @returns {any} the chart, for chaining
   */
  clearCache(id) {
    if (id == null) this._asyncCache.clear();
    else this._asyncCache.delete(id);
    return this.ctx;
  }
  /**
   * Capture the overridable surface of the current view so it can be restored.
   * Only fields that some drilldown.series entry can change are cloned; series
   * and chart.type/stacked are always captured.
   * @returns {object}
   */
  _snapshot() {
    const c = this.w.config;
    const fields = this._overrideFields();
    const snap = { series: this._uncollapseSeries(Utils.clone(c.series)) };
    if (Array.isArray(c.labels) && c.labels.length) {
      snap.labels = Utils.clone(c.labels);
    }
    snap.chart = { type: c.chart.type, stacked: c.chart.stacked };
    if (fields.has("xaxis")) snap.xaxis = Utils.clone(c.xaxis);
    if (fields.has("yaxis")) snap.yaxis = Utils.clone(c.yaxis);
    if (fields.has("colors")) snap.colors = c.colors ? Utils.clone(c.colors) : void 0;
    if (fields.has("plotOptions")) snap.plotOptions = Utils.clone(c.plotOptions);
    if (fields.has("fill")) snap.fill = Utils.clone(c.fill);
    if (fields.has("legend")) snap.legend = Utils.clone(c.legend);
    return snap;
  }
  /**
   * Restore any legend-collapsed slices/series to their original values in a
   * cloned series array, so a drill snapshot captures the pre-collapse data.
   * Mirrors legend Helpers' collapse addressing: object-form pie/donut packs
   * every slice as a data point inside `series[0].data`; numeric pie stores a
   * slice per top-level element; axis series carry a `data` array. No-op when
   * nothing is collapsed.
   * @param {any[]} series
   * @returns {any[]}
   */
  _uncollapseSeries(series) {
    const w = this.w;
    const gl = w.globals;
    const entries = [
      ...gl.collapsedSeries || [],
      ...gl.ancillaryCollapsedSeries || []
    ];
    if (!entries.length) return series;
    const type = w.config.chart.type;
    const objectFormPie = (type === "pie" || type === "donut" || type === "polarArea") && series.length === 1 && series[0] && typeof series[0] === "object" && Array.isArray(series[0].data);
    const container = objectFormPie ? series[0].data : series;
    for (const entry of entries) {
      const i = entry.index;
      if (gl.axisCharts) {
        if (series[i]) {
          series[i].data = Array.isArray(entry.data) ? entry.data.slice() : entry.data;
        }
      } else if (container[i] && typeof container[i] === "object") {
        container[i].y = entry.data;
      } else if (container[i] !== void 0) {
        container[i] = entry.data;
      }
    }
    return series;
  }
  /**
   * Union of overridable fields across all declared drilldown levels. Ensures a
   * deep drillToRoot restores everything any intermediate level may have changed.
   * @returns {Set<string>}
   */
  _overrideFields() {
    const fields = /* @__PURE__ */ new Set();
    const list = this.w.config.drilldown && this.w.config.drilldown.series || [];
    for (const s of list) {
      if (!s) continue;
      if (s.xaxis) fields.add("xaxis");
      if (s.yaxis) fields.add("yaxis");
      if (s.colors) fields.add("colors");
      if (s.plotOptions) fields.add("plotOptions");
      if (s.fill) fields.add("fill");
      if (s.legend) fields.add("legend");
    }
    return fields;
  }
  /**
   * Copy the optional view fields shared by a drilldown child level and a
   * restore snapshot (`xaxis`, `yaxis`, `colors`, `plotOptions`, `fill`,
   * `legend`) from `src` onto `view`, only when present.
   * @param {Record<string, any>} view @param {Record<string, any>} src
   */
  _copyOptionalViewFields(view, src) {
    if (src.xaxis) view.xaxis = src.xaxis;
    if (src.yaxis) view.yaxis = src.yaxis;
    if (src.colors) view.colors = src.colors;
    if (src.plotOptions) view.plotOptions = src.plotOptions;
    if (src.fill) view.fill = src.fill;
    if (src.legend) view.legend = src.legend;
  }
  /**
   * Build an updateOptions/updateSeries payload for drilling INTO a child level.
   * Works for axis charts and pie/donut alike: both accept series objects with a
   * `data` array of `{ x, y }` points (pie derives slice labels from `x`).
   * @param {any} child
   * @returns {Record<string, any>}
   */
  _viewFromChild(child) {
    const view = {};
    if (Array.isArray(child.series)) {
      view.series = child.series;
    } else {
      view.series = [{ name: child.name || "", data: child.data }];
    }
    const chart = {};
    if (child.chart && child.chart.type) chart.type = child.chart.type;
    if (child.chart && child.chart.stacked != null) chart.stacked = child.chart.stacked;
    if (Object.keys(chart).length) view.chart = chart;
    this._copyOptionalViewFields(view, child);
    return view;
  }
  /**
   * Build an updateOptions payload from a restore-snapshot.
   * @param {Record<string, any>} snap
   * @returns {Record<string, any>}
   */
  _viewFromSnapshot(snap) {
    const view = { series: snap.series, chart: snap.chart };
    if (snap.labels && snap.labels.length) view.labels = snap.labels;
    this._copyOptionalViewFields(view, snap);
    return view;
  }
  /**
   * Apply a view by delegating to the right update path, firing drill events
   * around it.
   * @param {Record<string, any>} view
   * @param {'down'|'up'} direction
   * @param {object} meta
   * @returns {Promise<any>}
   */
  _apply(view, direction, meta) {
    const w = this.w;
    w.interact.selectedDataPoints = [];
    w.globals.collapsedSeries = [];
    w.globals.collapsedSeriesIndices = [];
    w.globals.ancillaryCollapsedSeries = [];
    w.globals.ancillaryCollapsedSeriesIndices = [];
    w.globals.allSeriesCollapsed = false;
    w.globals.risingSeries = [];
    view.markers = __spreadProps(__spreadValues({}, view.markers || {}), {
      discrete: this._drillMarkers(view.series)
    });
    const animate = (!w.config.drilldown.animation || w.config.drilldown.animation.enabled !== false) && w.config.chart.animations.enabled !== false;
    if (direction === "down") this._fire("drillDownStart", meta);
    const runUpdate = (anim) => this.ctx.updateOptions(view, false, anim, false, false);
    const done = () => {
      this._fire(direction === "down" ? "drillDownEnd" : "drillUp", meta);
      return this.ctx;
    };
    if (animate && this._zoomEnabled()) {
      const origin = this._triggerOrigin(meta);
      if (origin) {
        return this._zoomDrill(origin, direction, () => runUpdate(false)).then(done);
      }
    }
    return runUpdate(animate).then(done);
  }
  /** @returns {boolean} whether trigger-point zoom is configured on. */
  _zoomEnabled() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation;
    return !!(a && a.zoomFromPoint);
  }
  /** @returns {SVGSVGElement|null} the chart's root <svg> node, if present. */
  _svgNode() {
    const paper = this.w.dom && this.w.dom.Paper;
    return paper && paper.node ? paper.node : null;
  }
  /**
   * The group wrapping ONLY the data marks (bars/cells/tiles) — not the axes,
   * grid, or titles. Animating this keeps the chart frame still while the marks
   * move. Covers bar/line/area (`.apexcharts-plot-series`), heatmap, and treemap.
   * @returns {SVGElement|null}
   */
  _markGroup() {
    const svg = this._svgNode();
    if (!svg || typeof svg.querySelector !== "function") return null;
    return svg.querySelector(
      ".apexcharts-plot-series, .apexcharts-heatmap, .apexcharts-treemap"
    );
  }
  /**
   * Centre of the clicked point in the SVG's view-box pixel space, used as the
   * transform-origin for the mark-group scale (which uses `transform-box:
   * view-box`, so the origin is resolved in SVG coordinates and stays stable
   * across the parent and child renders). Falls back to the mark group's centre
   * when there is no trigger point (e.g. drillUp / imperative drill). Returns
   * null when the marks / SVG / WAAPI are unavailable (SSR / old browsers).
   * @param {object} meta
   * @returns {{ x: number, y: number }|null}
   */
  _triggerOrigin(meta) {
    if (!Environment.isBrowser()) return null;
    const svg = this._svgNode();
    const group = this._markGroup();
    if (!svg || !group || typeof group.animate !== "function" || typeof svg.getBoundingClientRect !== "function") {
      return null;
    }
    const svgRect = svg.getBoundingClientRect();
    let el = null;
    if (meta && meta.seriesIndex != null && meta.dataPointIndex != null && this.w.dom.baseEl) {
      el = this.w.dom.baseEl.querySelector(
        `[index="${meta.seriesIndex}"][j="${meta.dataPointIndex}"]`
      );
    }
    if (el && typeof el.getBoundingClientRect === "function") {
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - svgRect.left,
        y: r.top + r.height / 2 - svgRect.top
      };
    }
    const gRect = group.getBoundingClientRect();
    return {
      x: gRect.left + gRect.width / 2 - svgRect.left,
      y: gRect.top + gRect.height / 2 - svgRect.top
    };
  }
  /**
   * Run the "expand from the clicked point" choreography around an instant
   * (un-animated) update. Only the data-mark group is animated — the axes, grid,
   * and titles stay fixed, so the effect doesn't drag the whole chart frame. The
   * current marks fade out near-in-place (a quick fade, not a balloon), the child
   * renders invisibly underneath, then the child marks unfold outward from the
   * clicked point: a horizontal-biased scale anchored there, so the bars read as
   * emerging from the column you clicked. Drilling up has no trigger column, so
   * it settles gently from the marks' centre.
   *
   * `transform-box: view-box` resolves the origin in SVG coordinates, so the same
   * origin applies cleanly to the parent and the freshly-rendered child group.
   * @param {{ x: number, y: number }} origin
   * @param {'down'|'up'} direction
   * @param {() => Promise<any>} runUpdate
   * @returns {Promise<void>}
   */
  _zoomDrill(origin, direction, runUpdate) {
    return __async(this, null, function* () {
      const dur = this._zoomDuration();
      const down = direction === "down";
      const outDur = Math.round(dur * 0.55);
      const outTo = down ? "scale(1.03)" : "scale(0.97)";
      const inFrom = down ? "scaleX(0.55) scaleY(0.85)" : "scale(1.04)";
      const anchor = (el) => {
        el.style.transformBox = "view-box";
        el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      };
      const clear = (el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.transformOrigin = "";
        el.style.transformBox = "";
      };
      const outGroup = this._markGroup();
      let outAnim = null;
      if (outGroup) {
        anchor(outGroup);
        outAnim = outGroup.animate(
          [
            { transform: "scale(1)", opacity: 1 },
            { transform: outTo, opacity: 0 }
          ],
          { duration: outDur, easing: "ease-in", fill: "forwards" }
        );
        try {
          yield outAnim.finished;
        } catch (e) {
        }
      }
      yield runUpdate();
      const inGroup = this._markGroup();
      if (inGroup) {
        anchor(inGroup);
        inGroup.style.opacity = "0";
        inGroup.style.transform = inFrom;
        if (outAnim && outGroup === inGroup) outAnim.cancel();
        const inAnim = inGroup.animate(
          [
            { transform: inFrom, opacity: 0 },
            { transform: "scale(1)", opacity: 1 }
          ],
          // Decelerating ease so the unfold settles softly into place.
          { duration: dur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
        );
        try {
          yield inAnim.finished;
        } catch (e) {
        }
        clear(inGroup);
        inAnim.cancel();
      }
    });
  }
  /** @returns {number} per-phase zoom duration in ms. */
  _zoomDuration() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation;
    const speed = a && typeof a.speed === "number" ? a.speed : 260;
    return Math.max(80, speed);
  }
  /**
   * Fire a drill event through both the config callback and the listener registry.
   * @param {string} name
   * @param {object} payload
   */
  _fire(name, payload) {
    const cb = this.w.config.chart.events && this.w.config.chart.events[name];
    if (typeof cb === "function") cb(payload, this.ctx, this.w);
    this.ctx.events.fireEvent(name, [payload, this.ctx, this.w]);
  }
  // ─── Click + post-render hooks ───────────────────────────────────────────────
  /**
   * @param {Event} _event
   * @param {any} _ctx
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} opts
   */
  _onPointSelect(_event, _ctx, opts) {
    if (!opts) return void 0;
    const point = this._pointAt(opts.seriesIndex, opts.dataPointIndex);
    if (point && typeof point === "object" && point.drilldown != null) {
      return this.drillDown(point.drilldown, point, opts);
    }
    if (typeof this.w.config.drilldown.onDrillDown === "function") {
      return this._drillDownAsync(null, point, opts);
    }
    return void 0;
  }
  /**
   * @param {number|undefined} seriesIndex
   * @param {number|undefined} dataPointIndex
   * @returns {any|null}
   */
  _pointAt(seriesIndex, dataPointIndex) {
    const series = this.w.config.series;
    if (!Array.isArray(series) || seriesIndex == null || dataPointIndex == null) {
      return null;
    }
    const s = series[seriesIndex];
    if (!s || !Array.isArray(s.data)) return null;
    return s.data[dataPointIndex] != null ? s.data[dataPointIndex] : null;
  }
  _afterRender() {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return;
    this._markDrillableTargets();
    this._wirePlotClick();
    this.breadcrumb.render(this.path);
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series);
    }
  }
  /**
   * Mark every point that carries a `drilldown` field as an openable target.
   *
   * Two things have to be true for a point to be drillable, and on line/area
   * neither holds by default. It needs a mark to click (with `markers.size: 0`
   * there is no element at all), and that mark has to accept the click: core
   * gives line/area markers `no-pointer-events` so the shared tooltip can track
   * the whole plot, which silently swallows it. `_drillMarkers()` supplies the
   * missing dots; this re-enables pointer events on them.
   *
   * The cursor class only goes on marks that can actually take the click, so we
   * never promise an interaction that cannot happen.
   */
  _markDrillableTargets() {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const series = w.config.series;
    if (!baseEl || !Array.isArray(series)) return;
    let unreachable = 0;
    series.forEach((s, i) => {
      const data = s && Array.isArray(s.data) ? s.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const nodes = baseEl.querySelectorAll(`[index="${i}"][j="${j}"]`);
        if (!nodes.length) unreachable++;
        nodes.forEach((node) => {
          if (this._isClickThroughMark(node)) {
            node.classList.remove("no-pointer-events");
          }
          node.classList.add("apexcharts-drilldown-target");
        });
      });
    });
    if (unreachable && !this._warnedUnreachable) {
      this._warnedUnreachable = true;
      console.warn(
        `ApexCharts: ${unreachable} drillable point(s) have no clickable mark, so clicking them cannot do anything. Leave \`drilldown.marker\` on, or give the series markers of its own (\`markers.size > 0\`).`
      );
    }
  }
  /**
   * Called by Pie when it declines to wire the slice pull-out because this
   * chart drills. Warned once per chart (a drill re-renders, and the same
   * notice on every navigation is just noise), and from here rather than from
   * Pie because this module is the reason it is unavailable.
   */
  warnSliceOffsetDisabled() {
    if (this._warnedNoSliceOffset) return;
    this._warnedNoSliceOffset = true;
    console.warn(
      "ApexCharts: `plotOptions.pie.expandOnClick` is not available in a drilldown pie/donut, so it was ignored. A slice click navigates, and a slice that slid out would be discarded by the drill it just triggered."
    );
  }
  /**
   * Make the whole band a drillable point owns clickable, not just its dot.
   *
   * A dot is ~6px across, so hitting it takes pixel-precise aim, it is far under
   * the ~44px a finger needs, and the tooltip's arrow points AT the point by
   * design, which puts a triangle over the very thing you are aiming at. Rather
   * than move the tooltip, widen the target: a click anywhere in the plot drills
   * whichever point the tooltip is currently reading. The hit area then matches
   * the feedback already on screen, so "the tooltip says 2024, I click, I get
   * 2024" holds, and the dot goes back to being an affordance rather than a
   * target you have to chase.
   *
   * Only for the point-based types, since a bar, slice or tile is already a
   * comfortably large mark and drilling one by clicking the background near it
   * would be surprising.
   */
  _wirePlotClick() {
    if (!Environment.isBrowser()) return;
    const baseEl = this.w.dom.baseEl;
    if (!baseEl || this._plotClickWired === baseEl) return;
    if (this._plotClickWired) {
      this._plotClickWired.removeEventListener("mousedown", this._onPlotDown);
      this._plotClickWired.removeEventListener("click", this._onPlotClick);
    }
    baseEl.addEventListener("mousedown", this._onPlotDown);
    baseEl.addEventListener("click", this._onPlotClick);
    this._plotClickWired = baseEl;
  }
  /** @param {any} e */
  _onPlotDown(e) {
    this._downAt = { x: e.clientX, y: e.clientY };
  }
  /**
   * @param {any} e
   * @returns {any}
   */
  _onPlotClick(e) {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return void 0;
    const down = this._downAt;
    this._downAt = null;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) {
      return void 0;
    }
    const target = (
      /** @type {Element} */
      e.target
    );
    if (!target || typeof target.closest !== "function") return void 0;
    if (target.closest(".apexcharts-drilldown-target")) return void 0;
    if (target.closest(
      ".apexcharts-legend, .apexcharts-toolbar, .apexcharts-breadcrumb, .apexcharts-menu, .apexcharts-tooltip"
    )) {
      return void 0;
    }
    const i = w.interact.capturedSeriesIndex;
    const j = w.interact.capturedDataPointIndex;
    if (i == null || j == null || i < 0 || j < 0) return void 0;
    if (!this._isPointBasedSeries(w.config.series[i])) return void 0;
    const point = this._pointAt(i, j);
    if (!point || typeof point !== "object" || point.drilldown == null) {
      return void 0;
    }
    return this.drillDown(point.drilldown, point, {
      seriesIndex: i,
      dataPointIndex: j
    });
  }
  /**
   * A series mark that is deliberately click-through. Restricted to markers
   * inside the plot: the tooltip draws its own `no-pointer-events` marker, and
   * that one must stay click-through or it would sit under the cursor and eat
   * the hover it exists to follow.
   * @param {Element} node
   * @returns {boolean}
   */
  _isClickThroughMark(node) {
    if (!node.classList || !node.classList.contains("no-pointer-events")) {
      return false;
    }
    if (!node.classList.contains("apexcharts-marker")) return false;
    return !(typeof node.closest === "function" && node.closest(".apexcharts-tooltip"));
  }
  /**
   * Discrete-marker entries that give each drillable point a visible dot.
   *
   * Only series drawn WITHOUT markers get them, so an author who already shows
   * markers keeps their styling untouched, and only drillable points get one, so
   * the dots read as "these are the ones you can open" rather than turning every
   * point into a dot. Core renders discrete markers even when `markers.size` is
   * 0, which is what makes the affordance possible without a core change.
   *
   * Entries are tagged so a resync replaces ours and leaves the author's alone.
   * @param {any[]} series - the series being rendered (a drill applies its
   *   level's series, which are not yet on `w.config` when this runs)
   * @returns {any[]}
   */
  _drillMarkers(series) {
    const w = this.w;
    const cfg = w.config.drilldown;
    const authored = Array.isArray(w.config.markers && w.config.markers.discrete) ? w.config.markers.discrete.filter(
      (d) => !d || !d[DRILL_MARKER]
    ) : [];
    const mk = cfg && cfg.marker || {};
    if (mk.show === false || !Array.isArray(series)) return authored;
    const own = [];
    series.forEach((s, i) => {
      if (!this._seriesNeedsDrillMarker(i, s)) return;
      const data = s && Array.isArray(s.data) ? s.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const entry = { seriesIndex: i, dataPointIndex: j, [DRILL_MARKER]: true };
        if (mk.size !== void 0) entry.size = mk.size;
        if (mk.shape !== void 0) entry.shape = mk.shape;
        if (mk.fillColor !== void 0) entry.fillColor = mk.fillColor;
        if (mk.strokeColor !== void 0) entry.strokeColor = mk.strokeColor;
        own.push(entry);
      });
    });
    return authored.concat(own);
  }
  /**
   * Whether a series needs drill dots supplied for it: a point-based type whose
   * marks are the markers, drawn with markers off. Bar, pie, treemap and heatmap
   * marks are already real clickable elements, and a series that already shows
   * markers already has its affordance.
   * @param {number} i @param {any} s
   * @returns {boolean}
   */
  _seriesNeedsDrillMarker(i, s) {
    if (!this._isPointBasedSeries(s)) return false;
    const size = this.w.config.markers && this.w.config.markers.size;
    const effective = Array.isArray(size) ? size[i] : size;
    return !(Number(effective) > 0);
  }
  /**
   * A series whose marks are markers (a point), rather than a shape big enough
   * to aim at on its own.
   * @param {any} s
   * @returns {boolean}
   */
  _isPointBasedSeries(s) {
    const type = s && s.type || this.w.config.chart.type;
    return type === "line" || type === "area";
  }
}
_core__default.registerFeatures({ drilldown: Drilldown });
export {
  default2 as default
};
