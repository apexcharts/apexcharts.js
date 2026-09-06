var __defProp = Object.defineProperty;
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
/*!
 * ApexCharts v7.2.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const REGISTRY_KEY = "__apexcharts_plugins__";
function getRegistry() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = {};
  return g[REGISTRY_KEY];
}
function getPlugin(name) {
  return getRegistry()[name] || null;
}
const WEAVE_API_VERSION = 2;
const PLUGIN_CHART_METHODS = [
  "updateOptions",
  "updateSeries",
  "appendData",
  "appendSeries",
  "toggleSeries",
  "showSeries",
  "hideSeries",
  "highlightSeries",
  "isSeriesHidden",
  "zoomX",
  "addXaxisAnnotation",
  "addYaxisAnnotation",
  "addPointAnnotation",
  "clearAnnotations",
  "removeAnnotation",
  "dataURI",
  "exportToCSV"
];
function buildBoundPublicMethods(ctx) {
  const out = {};
  PLUGIN_CHART_METHODS.forEach((m) => {
    if (typeof ctx[m] === "function") out[m] = ctx[m].bind(ctx);
  });
  return Object.freeze(out);
}
function makeLayerHandle(g, graphics) {
  const add = (el) => {
    if (el) g.add(el);
    return el;
  };
  const handle = {
    get node() {
      return g.node;
    },
    /** @param {any} opts */
    path(opts = {}) {
      const {
        d = "",
        stroke = "#000",
        width = 1,
        fill = "none",
        opacity = 1,
        dash = 0,
        className = ""
      } = opts;
      return add(
        graphics.drawPath({
          d,
          stroke,
          strokeWidth: width,
          fill,
          fillOpacity: fill === "none" ? 0 : opacity,
          strokeOpacity: opacity,
          strokeDashArray: dash,
          classes: className
        })
      );
    },
    /** @param {any} opts */
    line(opts = {}) {
      const { x1, y1, x2, y2, stroke = "#000", width = 1, dash = 0 } = opts;
      return add(graphics.drawLine(x1, y1, x2, y2, stroke, dash, width));
    },
    /** @param {any} opts */
    rect(opts = {}) {
      const {
        x = 0,
        y = 0,
        w = 0,
        h = 0,
        r = 0,
        fill = "#000",
        stroke = null,
        opacity = 1
      } = opts;
      return add(
        graphics.drawRect(
          x,
          y,
          w,
          h,
          r,
          fill,
          opacity,
          stroke != null ? 1 : null,
          stroke
        )
      );
    },
    /** @param {any} opts */
    circle(opts = {}) {
      const { cx = 0, cy = 0, r = 0, fill = "#000", stroke = null } = opts;
      return add(
        graphics.drawCircle(r, { cx, cy, fill, stroke: stroke || "none" })
      );
    },
    /** @param {any} opts */
    text(opts = {}) {
      const {
        x = 0,
        y = 0,
        text = "",
        color,
        size,
        anchor = "start",
        weight
      } = opts;
      return add(
        graphics.drawText({
          x,
          y,
          text,
          textAnchor: anchor,
          fontSize: size,
          foreColor: color,
          fontWeight: weight
        })
      );
    },
    clear() {
      const node = g.node;
      while (node.firstChild) node.removeChild(node.firstChild);
      return handle;
    }
  };
  return handle;
}
function buildPluginAPI(host, record) {
  const ctx = host.ctx;
  const w = host.w;
  const api = {
    name: record.def.name,
    version: WEAVE_API_VERSION,
    // Live: reconcile refreshes record.options when the chart's plugins config
    // changes, so updateOptions({ plugins: [{ name, options }] }) reconfigures
    // an active plugin in place. The returned object is frozen.
    get options() {
      return record.options;
    },
    // ── lifecycle subscription ──
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    on(hook, fn) {
      const m = record.handlers;
      if (!m.has(hook)) m.set(hook, []);
      m.get(hook).push(fn);
      return api;
    },
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    off(hook, fn) {
      const a = record.handlers.get(hook);
      if (a) {
        const i = a.indexOf(fn);
        if (i > -1) a.splice(i, 1);
      }
      return api;
    },
    // ── per-plugin, per-chart scratch state (survives updates, dropped on
    //    destroy). The api object is frozen, but this object is mutable. ──
    store: {},
    // ── drawing (renderer-agnostic) ──
    // Call this INSIDE each draw handler: the host wipes plugin layers at the
    // start of every draw pass, so a handle cached across draws points at a
    // detached node and its writes vanish silently.
    /** @param {any} [opts] */
    layer(opts) {
      return host._layer(record.def.name, opts || {});
    },
    // ── reads ──
    get scales() {
      return host._currentScales;
    },
    // Served from the per-dispatch snapshot when one exists (invalidated at
    // every dispatch), so reading api.data in a loop does not rebuild the
    // point arrays on each property access.
    get data() {
      return host._lastData || (host._lastData = host._dataSnapshot());
    },
    theme: Object.freeze({
      get mode() {
        return w.config.theme.mode;
      },
      get foreColor() {
        return w.config.chart.foreColor;
      },
      /** @param {number} i */
      seriesColor(i) {
        return w.globals.colors[i];
      },
      /** @param {string} name */
      token(name) {
        return host._token(name);
      }
    }),
    // ── curated actions (bound public methods only; NEVER raw w) ──
    chart: buildBoundPublicMethods(ctx),
    // ── chart shape (v2) ──
    // What kind of chart this is, for a plugin that has to decide whether it
    // applies at all. An analysis or derived-series plugin cannot work on every
    // type, and the alternative to asking is adding a series and letting the
    // core warn at the user.
    get info() {
      return Object.freeze({
        // The type the caller ASKED for: `requestedType` survives the aliasing
        // that rewrites e.g. raincloud to violin.
        type: String(
          w.config.chart && (w.config.chart.requestedType || w.config.chart.type) || "line"
        ),
        // false for pie / donut / radialBar, where `data` is one value per slice.
        axisChart: w.globals.axisCharts === true,
        datetimeX: !!(w.config.xaxis && w.config.xaxis.type === "datetime"),
        // The core refuses to draw a horizontal bar in a combo, so a plugin must
        // not add a derived series to one.
        horizontalBars: !!(w.config.plotOptions && w.config.plotOptions.bar && w.config.plotOptions.bar.horizontal),
        // Whether the chart prints a value on each point, and which series it
        // prints them for. A plugin that ADDS a series needs both: there is no
        // per-series dataLabels flag, so `dataLabels.enabledOnSeries` is the
        // only way to keep labels off a computed series, and narrowing it
        // without knowing the caller's own value would silently discard it.
        dataLabels: Object.freeze({
          enabled: !!(w.config.dataLabels && w.config.dataLabels.enabled),
          enabledOnSeries: Array.isArray(
            w.config.dataLabels && w.config.dataLabels.enabledOnSeries
          ) ? w.config.dataLabels.enabledOnSeries.slice() : null
        })
      });
    },
    // Display labels per x position (v2).
    //
    // Resolved config-first on purpose. `globals.categoryLabels` and
    // `globals.labels` are populated after a mount and EMPTY after an
    // updateSeries(), so a plugin reading either directly would render real
    // labels on first paint and ordinals after any update.
    get categories() {
      return host._categories();
    },
    /**
     * Declare which series on this chart belong to the plugin rather than to
     * the caller (v2).
     *
     * A plugin that adds computed series has to say so, because the core cannot
     * tell them apart and several behaviours depend on the distinction. Today
     * the host uses it to keep them out of the initial-series snapshot, so
     * `resetSeries()` and the toolbar's reset restore the caller's own data
     * instead of the plugin's output.
     *
     * Idempotent; pass an empty array when the plugin's series are gone.
     *
     * @param {string[]} names series names the plugin owns
     */
    markDerived(names) {
      host._markDerived(record.def.name, names);
      return api;
    },
    // ── custom events out to the host app ──
    /**
     * Fires as `plugin:<pluginName>:<name>` on the chart's event bus. The
     * namespace is not optional: the bus also carries the internal lifecycle
     * events ('updated', 'mounted', ...), and an un-namespaced emit could
     * trigger every internal subscriber (history capture, re-render hooks).
     * Listen with chart.addEventListener('plugin:myplugin:myevent', fn).
     * @param {string} name
     * @param {any} [detail]
     */
    emit(name, detail) {
      ctx.events.fireEvent(`plugin:${record.def.name}:${name}`, [ctx, detail]);
    },
    // ── host element (read; lazy: baseEl is not set until render) ──
    get el() {
      return w.dom.baseEl;
    }
  };
  return Object.freeze(api);
}
class WeaveHost {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.active = [];
    this._layers = /* @__PURE__ */ new Map();
    this._currentScales = null;
    this._lastPluginsRef = null;
    this._lastData = null;
    this._updatedWired = false;
    this._derived = null;
    this._onUpdated = this._onUpdated.bind(this);
    this._init();
  }
  _init() {
    const list = this.w.config.plugins || [];
    list.map((entry, i) => ({
      entry,
      order: entry.order != null ? entry.order : i
    })).sort((a, b) => a.order - b.order).forEach((o) => this._activate(o.entry));
    this._lastPluginsRef = this.w.config.plugins;
    this._wireUpdated();
  }
  _wireUpdated() {
    if (this._updatedWired) return;
    this.ctx.addEventListener("updated", this._onUpdated);
    this._updatedWired = true;
  }
  _onUpdated() {
    this._repairInitialSeries();
    this.dispatch("afterUpdate", { pass: "update" });
  }
  /**
   * @param {any} entry { name, options?, order? }
   */
  _activate(entry) {
    const def = getPlugin(entry.name);
    if (!def) {
      console.error(`[apexcharts] plugin "${entry.name}" is not registered.`);
      return;
    }
    const v = def.apiVersion != null ? Math.trunc(def.apiVersion) : 1;
    if (!(v >= 1) || v > WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${def.apiVersion}, host is v${WEAVE_API_VERSION}; skipped.`
      );
      return;
    }
    const record = {
      def,
      options: Object.freeze(__spreadValues({}, entry.options || {})),
      handlers: /* @__PURE__ */ new Map(),
      disabled: false,
      failures: 0,
      api: null
    };
    record.api = buildPluginAPI(this, record);
    this.active.push(record);
    this._guard(record, "setup", () => def.setup(record.api));
  }
  /**
   * @param {string} hook
   * @param {{ pass?: string, xyRatios?: any }} [extra]
   */
  dispatch(hook, extra) {
    if (hook === "draw") {
      this._reconcile();
      this._resetLayers();
    }
    this._lastData = null;
    if (!this.active.length) return;
    if (hook === "afterParse") {
      this._currentScales = null;
    } else if (extra && "xyRatios" in extra) {
      this._setScales(extra.xyRatios);
    }
    const pass = extra && extra.pass || "full";
    let data = null;
    for (const record of this.active) {
      if (record.disabled) continue;
      const fns = record.handlers.get(hook);
      if (!fns || !fns.length) continue;
      if (data === null) {
        data = this._dataSnapshot();
        this._lastData = data;
      }
      const payload = {
        api: record.api,
        scales: this._currentScales,
        data,
        pass,
        hook
      };
      for (const fn of fns.slice()) {
        this._guard(record, hook, () => fn(payload));
      }
    }
  }
  /**
   * @param {any} record
   * @param {string} where
   * @param {Function} fn
   */
  _guard(record, where, fn) {
    if (record.disabled) return;
    try {
      fn();
    } catch (e) {
      console.error(
        `[apexcharts] plugin "${record.def.name}" threw in "${where}":`,
        e
      );
      record.failures = (record.failures || 0) + 1;
      if (record.failures >= 3) {
        record.disabled = true;
        console.error(
          `[apexcharts] plugin "${record.def.name}" disabled after repeated errors.`
        );
      }
    }
  }
  // ─── Scales facade ──────────────────────────────────────────────────────
  /**
   * Build api.scales from the SAME xyRatios the series were drawn with, so
   * plugin pixels align with series pixels by construction.
   * @param {any} xyRatios
   */
  _setScales(xyRatios) {
    const w = this.w;
    const gl = w.globals;
    const L = w.layout;
    if (!xyRatios || !gl.axisCharts) {
      this._currentScales = null;
      return;
    }
    const xRatio = xyRatios.xRatio;
    const yRatio = xyRatios.yRatio || [];
    const yr = (axis) => yRatio[axis] != null ? yRatio[axis] : yRatio[0];
    const maxY = (axis) => gl.maxYArr[axis] != null ? gl.maxYArr[axis] : gl.maxY;
    const minY = (axis) => gl.minYArr[axis] != null ? gl.minYArr[axis] : gl.minY;
    this._currentScales = {
      /** @param {number} v */
      x: (v) => L.translateX + (v - gl.minX) / xRatio,
      /**
       * @param {number} v
       * @param {number} [axis]
       */
      y: (v, axis = 0) => L.translateY + (maxY(axis) - v) / yr(axis),
      domainX: [gl.minX, gl.maxX],
      /** @param {number} [axis] */
      domainY: (axis = 0) => [minY(axis), maxY(axis)],
      gridWidth: L.gridWidth,
      gridHeight: L.gridHeight,
      ratios: xyRatios
    };
  }
  // ─── Read-only data snapshot ────────────────────────────────────────────
  /**
   * @returns {any[]} defensive per-series snapshot (never the live slice)
   */
  _dataSnapshot() {
    const w = this.w;
    const gl = w.globals;
    const series = w.seriesData.series || [];
    const seriesX = w.seriesData.seriesX || [];
    const cfgSeries = Array.isArray(w.config.series) ? w.config.series : [];
    return series.map((sData, i) => {
      const row = Array.isArray(sData) ? sData : [sData];
      const xs = seriesX[i] || [];
      const points = row.map((y, j) => ({
        x: xs[j] != null ? xs[j] : j,
        y
      }));
      const cfg = cfgSeries[i];
      const raw = cfg && typeof cfg === "object" && Array.isArray(cfg.data) ? cfg.data : [];
      return {
        name: gl.seriesNames ? gl.seriesNames[i] : void 0,
        hidden: (gl.collapsedSeriesIndices || []).includes(i),
        color: gl.colors ? gl.colors[i] : void 0,
        points,
        raw
      };
    });
  }
  /**
   * Display labels per x position, resolved so they survive every render path.
   *
   * `config.xaxis.categories` leads because it is the caller's own input;
   * `globals.categoryLabels` covers labels that came from string-x data, and
   * `globals.labels` is the last resort. Both globals are populated after a
   * mount and empty after an updateSeries(), so a consumer reading either alone
   * gets real labels on first paint and ordinals afterwards.
   *
   * @returns {string[]}
   */
  _categories() {
    const w = this.w;
    const gl = w.globals;
    const cfgCats = w.config.xaxis && Array.isArray(w.config.xaxis.categories) ? w.config.xaxis.categories : [];
    const glCats = Array.isArray(gl.categoryLabels) ? gl.categoryLabels : [];
    const glLabels = Array.isArray(gl.labels) ? gl.labels : [];
    const src = cfgCats.length ? cfgCats : glCats.length ? glCats : glLabels;
    const series = w.seriesData.series || [];
    let length = 0;
    for (let i = 0; i < series.length; i++) {
      const row = series[i];
      if (Array.isArray(row) && row.length > length) length = row.length;
    }
    if (!length) length = src.length;
    const out = [];
    for (let i = 0; i < length; i++) {
      const v = src[i];
      out.push(v === void 0 || v === null ? String(i + 1) : String(v));
    }
    return out;
  }
  /**
   * Record the series a plugin owns, and repair the initial-series snapshot.
   *
   * `Data.parseData()` assigns `globals.initialSeries` on every parse
   * unconditionally, so `updateSeries(..., overwriteInitialSeries: false)` does
   * NOT keep a plugin's computed series out of it. That assignment is
   * deliberate (it is what keeps resetSeries() correct for the reducer,
   * histogram, dumbbell, streamgraph, waterfall and treemap raw-series paths),
   * so the fix is to put the caller's own series back afterwards rather than to
   * make the assignment conditional.
   *
   * Without this, a plugin that adds a computed series poisons resetSeries():
   * pressing the toolbar's reset hands the user the plugin's output as if it
   * were their own data, and it survives switching the plugin off.
   *
   * @param {string} pluginName
   * @param {string[]} names
   */
  _markDerived(pluginName, names) {
    if (!this._derived) this._derived = /* @__PURE__ */ new Map();
    const list = Array.isArray(names) ? names.map((n) => String(n)) : [];
    if (list.length) {
      this._derived.set(pluginName, list);
    } else {
      this._derived.delete(pluginName);
    }
    this._repairInitialSeries();
  }
  /** All series names currently claimed by plugins. */
  _derivedNames() {
    const out = /* @__PURE__ */ new Set();
    if (!this._derived) return out;
    for (const list of this._derived.values()) {
      for (const n of list) out.add(n);
    }
    return out;
  }
  _repairInitialSeries() {
    const drop = this._derivedNames();
    if (!drop.size) return;
    const w = this.w;
    const series = (
      /** @type {any[]} */
      Array.isArray(w.config.series) ? w.config.series : []
    );
    const own = series.filter(
      (s) => !drop.has(String(s && s.name))
    );
    if (!own.length) return;
    try {
      w.globals.initialSeries = own;
      if (w.globals.initialConfig && Array.isArray(w.globals.initialConfig.series)) {
        w.globals.initialConfig.series = own;
      }
    } catch (e) {
    }
  }
  // ─── Theme tokens ───────────────────────────────────────────────────────
  /**
   * @param {string} name
   * @returns {any}
   */
  _token(name) {
    const w = this.w;
    const gl = w.globals;
    switch (name) {
      case "foreColor":
        return w.config.chart.foreColor;
      case "background":
        return w.config.chart.background;
      case "accent":
      case "primary":
        return gl.colors ? gl.colors[0] : void 0;
      default:
        if (/^series-\d+$/.test(name)) {
          return gl.colors ? gl.colors[Number(name.split("-")[1])] : void 0;
        }
        return void 0;
    }
  }
  // ─── Layers ─────────────────────────────────────────────────────────────
  /**
   * @param {string} name
   * @param {{ z?: 'front'|'behind', className?: string }} opts
   */
  _layer(name, { z = "front", className = "" } = {}) {
    let g = this._layers.get(name);
    if (!g) {
      g = this.ctx.graphics.group({
        class: `apexcharts-plugin-${name} ${className}`.trim()
      });
      const parent = this.w.dom.elGraphical.node;
      if (z === "behind") parent.insertBefore(g.node, parent.firstChild);
      else parent.appendChild(g.node);
      g.node.setAttribute("aria-hidden", "true");
      this._layers.set(name, g);
    }
    return makeLayerHandle(g, this.ctx.graphics);
  }
  /**
   * Remove all plugin layers. Run at the start of every `draw` because
   * fastUpdate only removes series/data-label groups (not arbitrary plugin
   * groups), so without this, fast-path redraws would duplicate plugin output.
   */
  _resetLayers() {
    const el = this.w.dom.elGraphical;
    const parent = el && el.node;
    if (parent) {
      const groups = parent.querySelectorAll('g[class*="apexcharts-plugin-"]');
      Array.prototype.forEach.call(groups, (n) => n.remove());
    }
    this._layers.clear();
  }
  // ─── Config-change reconciliation ───────────────────────────────────────
  /**
   * Diff w.config.plugins by name: teardown removed, activate added; unchanged
   * plugins keep their instance + store, but their `options` are refreshed from
   * the new entry (api.options is a live getter), so
   * updateOptions({ plugins: [{ name, options }] }) reconfigures in place.
   * Skipped when the plugins array reference is unchanged (fast redraws), so it
   * costs nothing on hover.
   */
  _reconcile() {
    const plugins = this.w.config.plugins || [];
    if (plugins === this._lastPluginsRef) return;
    this._lastPluginsRef = plugins;
    const desired = new Map(
      plugins.map((e, i) => [
        e.name,
        { entry: e, order: e.order != null ? e.order : i }
      ])
    );
    for (let i = this.active.length - 1; i >= 0; i--) {
      const r = this.active[i];
      const want = desired.get(r.def.name);
      if (!want) {
        this._guard(r, "destroy", () => r.def.destroy && r.def.destroy(r.api));
        this.active.splice(i, 1);
      } else {
        r.options = Object.freeze(__spreadValues({}, want.entry.options || {}));
      }
    }
    const activeNames = new Set(this.active.map((r) => r.def.name));
    const toAdd = [];
    desired.forEach((v, name) => {
      if (!activeNames.has(name)) toAdd.push(v);
    });
    toAdd.sort((a, b) => a.order - b.order).forEach((v) => this._activate(v.entry));
  }
  /**
   * @param {boolean} [isUpdating]
   */
  teardown(isUpdating) {
    if (!isUpdating) {
      this.dispatch("destroy");
      for (const record of this.active) {
        this._guard(record, "destroy", () => record.def.destroy && record.def.destroy(record.api));
      }
      this.active = [];
      this._derived = null;
      if (this._updatedWired) {
        this.ctx.removeEventListener && this.ctx.removeEventListener("updated", this._onUpdated);
        this._updatedWired = false;
      }
    }
    this._layers.clear();
  }
}
ApexCharts.registerFeatures({ weave: WeaveHost });
export {
  default2 as default
};
