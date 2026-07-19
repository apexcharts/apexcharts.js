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
 * ApexCharts v6.2.0
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
const WEAVE_API_VERSION = 1;
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
    const v = def.apiVersion != null ? def.apiVersion : 1;
    if (Math.trunc(v) !== WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${v}, host is v${WEAVE_API_VERSION}; skipped.`
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
    return series.map((sData, i) => {
      const xs = seriesX[i] || [];
      const points = (sData || []).map((y, j) => ({
        x: xs[j] != null ? xs[j] : j,
        y
      }));
      return {
        name: gl.seriesNames ? gl.seriesNames[i] : void 0,
        hidden: (gl.collapsedSeriesIndices || []).includes(i),
        color: gl.colors ? gl.colors[i] : void 0,
        points
      };
    });
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
