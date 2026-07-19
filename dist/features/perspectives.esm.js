/*!
 * ApexCharts v6.2.0
 * (c) 2018-2026 ApexCharts
 */
import * as ApexCharts from "apexcharts/core";
import ApexCharts__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = ApexCharts.__apex_Utils;
const Environment = ApexCharts.__apex_Environment_Environment;
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
function addMethodName(kind) {
  switch (kind) {
    case "xaxis":
      return "addXaxisAnnotation";
    case "yaxis":
      return "addYaxisAnnotation";
    case "point":
      return "addPointAnnotation";
    default:
      return null;
  }
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
function applyCollapsedSet(ctx, targetCollapsed, targetAncillary) {
  const w = ctx.w;
  const names = w.globals.seriesNames || [];
  const target = /* @__PURE__ */ new Set([
    ...targetCollapsed || [],
    ...targetAncillary || []
  ]);
  const current = /* @__PURE__ */ new Set([
    ...w.globals.collapsedSeriesIndices || [],
    ...w.globals.ancillaryCollapsedSeriesIndices || []
  ]);
  for (let realIndex = 0; realIndex < names.length; realIndex++) {
    const name = names[realIndex];
    if (name == null) continue;
    const shouldCollapse = target.has(realIndex);
    const isCollapsed = current.has(realIndex);
    if (shouldCollapse && !isCollapsed) {
      ctx.hideSeries(name);
    } else if (!shouldCollapse && isCollapsed) {
      ctx.showSeries(name);
    }
  }
}
function restoreSelection(ctx, selectedDataPoints) {
  if (!Array.isArray(selectedDataPoints)) return;
  ctx.w.interact.selectedDataPoints = cloneSelection(selectedDataPoints);
}
function applyViewState(ctx, view, { animate = true, mergeOptions } = {}) {
  var _a, _b;
  if (!ctx || !view) return;
  if (typeof view.v === "number" && view.v > VIEWSTATE_VERSION) {
    console.warn(
      `[apexcharts] ViewState v${view.v} is newer than this build understands (v${VIEWSTATE_VERSION}); applying best-effort.`
    );
  }
  ctx.clearAnnotations();
  const options = mergeOptions ? Utils.clone(mergeOptions) : {};
  const xw = view.window && view.window.xaxis;
  options.xaxis = Object.assign(
    {},
    options.xaxis,
    xw ? { min: (_a = xw.min) != null ? _a : void 0, max: (_b = xw.max) != null ? _b : void 0 } : { min: void 0, max: void 0 }
  );
  const yw = view.window && view.window.yaxis;
  if (Array.isArray(yw)) {
    options.yaxis = yw.map(
      (y) => {
        var _a2, _b2;
        return y ? { min: (_a2 = y.min) != null ? _a2 : void 0, max: (_b2 = y.max) != null ? _b2 : void 0 } : {};
      }
    );
  }
  if (view.theme) {
    const theme = {};
    if (view.theme.mode != null) theme.mode = view.theme.mode;
    if (view.theme.palette != null) theme.palette = view.theme.palette;
    if (Object.keys(theme).length) {
      options.theme = Object.assign({}, options.theme, theme);
    }
  }
  if (view.annotations && view.annotations.static) {
    options.annotations = Utils.clone(view.annotations.static);
  }
  ctx.updateOptions(
    options,
    false,
    animate,
    false,
    false
  );
  applyViewInteraction(ctx, view);
}
function applyViewInteraction(ctx, view) {
  if (!ctx || !view) return;
  const w = ctx.w;
  w.interact.zoomed = !!view.zoomed;
  applyCollapsedSet(ctx, view.collapsed, view.ancillaryCollapsed);
  if (view.annotations && Array.isArray(view.annotations.dynamic)) {
    view.annotations.dynamic.forEach((a) => {
      const method = addMethodName(a.kind);
      if (method && typeof ctx[method] === "function") {
        ctx[method](a.params, true);
      }
    });
  }
  restoreSelection(ctx, view.selectedDataPoints);
  if (view.locale && view.locale !== w.config.chart.defaultLocale) {
    ctx.setLocale(view.locale);
  }
  if (ctx.measure && typeof ctx.measure.setPins === "function") {
    ctx.measure.setPins(view.measure && view.measure.pins || []);
  }
}
const PERSPECTIVE_VERSION = 1;
const HASH_KEY = "apex";
function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
function base64urlEncode(str) {
  return toBase64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return fromBase64(b64);
}
function stripFunctions(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    return void 0;
  }
}
class Perspectives {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._saved = [];
    this._counter = 0;
  }
  /**
   * Capture the current chart view as a Perspective token.
   * @returns {{ v: number, view: object, options?: Record<string, any> }}
   */
  capture() {
    const view = captureViewState(this.w, this.ctx);
    const token = (
      /** @type {any} */
      { v: PERSPECTIVE_VERSION, view }
    );
    const options = this._serializableDelta();
    if (options && Object.keys(options).length) token.options = options;
    return token;
  }
  /**
   * Build the whitelisted, function-free option override recorded in the token.
   * @returns {Record<string, any>}
   * @private
   */
  _serializableDelta() {
    const cfg = this.w.config;
    const whitelist = cfg.chart && cfg.chart.perspectives && cfg.chart.perspectives.serializeOptions || ["theme", "xaxis", "yaxis", "title", "subtitle"];
    const delta = {};
    whitelist.forEach((path) => {
      if (cfg[path] !== void 0) {
        const stripped = stripFunctions(cfg[path]);
        if (stripped !== void 0) delta[path] = stripped;
      }
    });
    return delta;
  }
  /**
   * Encode a token (or the current capture) to a compact base64url string.
   * JSON.stringify drops any functions embedded in annotation params / option
   * overrides by construction: a shared link carries data; the opening page
   * supplies its own functions from config.
   * @param {any} [token]
   * @returns {string}
   */
  encode(token) {
    const t = token || this.capture();
    return base64urlEncode(JSON.stringify(t));
  }
  /**
   * Decode a base64url token string. Never throws: returns null on any error
   * or version mismatch (with a console warning).
   * @param {string} str
   * @returns {any | null}
   */
  decode(str) {
    return Perspectives.decode(str);
  }
  /**
   * Encode the current capture into a `#apex=<token>` URL hash fragment on the
   * current location. Browser-only; returns '' under SSR.
   * @returns {string}
   */
  toURL() {
    if (!Environment.isBrowser()) return "";
    const encoded = this.encode(this.capture());
    const url = new URL(window.location.href);
    url.hash = `${HASH_KEY}=${encoded}`;
    return url.toString();
  }
  /**
   * Restore a perspective. Accepts a token object or an encoded string. When
   * the chart is grouped, applies to every synced chart.
   *
   * The token's option overrides and `opts.mergeOptions` are folded into the
   * view restore's ONE updateOptions call (mergeOptions wins over
   * token.options; the view's own fields win over both). A single render is
   * deliberate: a second immediate updateOptions would kill the first one's
   * animation mid-flight, and a chart.type change applied this way morphs
   * (morph feature) inside the same re-render instead of being re-rendered
   * over. Consumed by Storyboard for per-beat option payloads.
   *
   * @param {any} tokenOrString
   * @param {{ animate?: boolean, mergeOptions?: Record<string, any> }} [opts]
   */
  apply(tokenOrString, opts = {}) {
    const token = typeof tokenOrString === "string" ? Perspectives.decode(tokenOrString) : tokenOrString;
    if (!token || !token.view) return;
    const animate = opts.animate !== void 0 ? opts.animate : true;
    const combined = Utils.extend(
      token.options ? Utils.clone(token.options) : {},
      opts.mergeOptions || {}
    );
    const mergeOptions = Object.keys(combined).length ? combined : void 0;
    const targets = this.w.config.chart.group ? this.ctx.getSyncedCharts() : [this.ctx];
    targets.forEach((chart) => {
      applyViewState(chart, token.view, { animate, mergeOptions });
    });
  }
  /**
   * Save the current view under a name in the in-memory registry.
   * @param {string} name
   * @returns {string} generated id
   */
  save(name) {
    const id = `perspective-${++this._counter}`;
    this._saved.push({ id, name: name || id, token: this.capture() });
    return id;
  }
  /**
   * List saved perspectives.
   * @returns {{ id: string, name: string, token: any }[]}
   */
  list() {
    return this._saved.map((s) => ({ id: s.id, name: s.name, token: s.token }));
  }
  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i = this._saved.findIndex((s) => s.id === id);
    if (i > -1) this._saved.splice(i, 1);
  }
  /** Drop the saved-views registry (called on full destroy). */
  teardown() {
    this._saved = [];
    this._counter = 0;
  }
  // ── static, pure helpers (available once the feature is imported) ─────────
  /**
   * @param {string} str base64url token
   * @returns {any | null}
   */
  static decode(str) {
    if (typeof str !== "string" || !str) return null;
    try {
      const token = JSON.parse(base64urlDecode(str));
      if (!token || typeof token !== "object") return null;
      if (token.v !== PERSPECTIVE_VERSION) {
        console.warn(
          `apexcharts: unsupported perspective version ${token.v} (expected ${PERSPECTIVE_VERSION}).`
        );
        return null;
      }
      return token;
    } catch (e) {
      console.warn("apexcharts: failed to decode perspective token.", e);
      return null;
    }
  }
  /**
   * Parse a `#apex=<token>` fragment out of an href (or the current location in
   * a browser). Pure and Node-safe when given an explicit href.
   * @param {string} [href]
   * @returns {any | null}
   */
  static fromURL(href) {
    try {
      const target = href || (Environment.isBrowser() ? window.location.href : "");
      if (!target) return null;
      const url = new URL(target);
      const hash = url.hash.replace(/^#/, "");
      if (!hash) return null;
      const pair = hash.split("&").map((p) => p.split("=")).find((p) => p[0] === HASH_KEY);
      if (!pair || pair[1] == null) return null;
      return Perspectives.decode(decodeURIComponent(pair[1]));
    } catch (e) {
      return null;
    }
  }
}
ApexCharts__default.registerFeatures({ perspectives: Perspectives });
ApexCharts__default.perspectives = {
  /** @param {string} str */
  decode: (str) => Perspectives.decode(str),
  /** @param {string} [href] */
  fromURL: (href) => Perspectives.fromURL(href)
};
export {
  default2 as default
};
