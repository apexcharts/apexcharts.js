var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __objRest = (source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
};
/*!
 * ApexCharts v6.0.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Utils = _core.__apex_Utils;
const Environment = _core.__apex_Environment_Environment;
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
function isEditableTarget(node) {
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable === true;
}
class History {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.stack = [];
    this.pointer = -1;
    this.applying = false;
    this._batching = false;
    this._counter = 0;
    this._coalesceTimer = null;
    this._settleTimer = null;
    this._pendingLabel = void 0;
    this._keydownTarget = null;
    this._pointerTarget = null;
    this._engaged = false;
    this._wired = false;
    this._readConfig();
    this._onMounted = this._onMounted.bind(this);
    this._onUpdated = this._onUpdated.bind(this);
    this._onSelection = this._onSelection.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this.init();
  }
  /**
   * (Re)read chart.history config. Called at construction and again on every
   * mounted/updated event so `updateOptions({ chart: { history: {...} } })`
   * takes effect at runtime: enabling wires the keyboard + starts capturing,
   * disabling stops capturing (the stack is kept for a later re-enable).
   */
  _readConfig() {
    const w = this.w;
    const cfg = w.config.chart && w.config.chart.history || {};
    this.enabled = !!cfg.enabled;
    this.maxDepth = cfg.maxDepth > 0 ? cfg.maxDepth : 100;
    this.coalesceMs = cfg.coalesceMs != null ? cfg.coalesceMs : 250;
    this.keyboard = cfg.keyboard !== false;
  }
  /** Re-sync config, then wire/unwire the keyboard to match. */
  _syncConfig() {
    this._readConfig();
    if (this.enabled && this.keyboard) this._wireKeyboard();
    else this._unwireKeyboard();
  }
  init() {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("mounted", this._onMounted);
    this.ctx.addEventListener("updated", this._onUpdated);
    this.ctx.addEventListener("scrolled", this._onUpdated);
    this.ctx.addEventListener("dataPointSelection", this._onSelection);
    if (this.enabled && this.keyboard) this._wireKeyboard();
  }
  /**
   * Keyboard: Cmd/Ctrl+Z = undo, Shift+Cmd/Ctrl+Z or Ctrl+Y = redo. Bound on
   * the document (not the chart element) because pointer gestures that create
   * an undo step (annotation drag, zoom, pan) call preventDefault and so never
   * move focus into the chart, leaving an el-scoped listener unreachable. To
   * stay non-intrusive it acts only when this chart is "engaged" (see
   * _onKeyDown): a capture-phase pointerdown marks engagement so the shortcut
   * follows the chart the user last touched, and defers to text editing.
   */
  _wireKeyboard() {
    if (this._keydownTarget) return;
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    const doc = el && el.ownerDocument;
    if (!Environment.isBrowser() || !doc) return;
    doc.addEventListener("keydown", this._onKeyDown);
    doc.addEventListener("pointerdown", this._onPointerDown, true);
    doc.addEventListener("mousedown", this._onPointerDown, true);
    this._keydownTarget = doc;
    this._pointerTarget = doc;
  }
  _unwireKeyboard() {
    if (this._keydownTarget) {
      this._keydownTarget.removeEventListener("keydown", this._onKeyDown);
      this._keydownTarget = null;
    }
    if (this._pointerTarget) {
      this._pointerTarget.removeEventListener("pointerdown", this._onPointerDown, true);
      this._pointerTarget.removeEventListener("mousedown", this._onPointerDown, true);
      this._pointerTarget = null;
    }
    this._engaged = false;
  }
  // ─── Event handlers ─────────────────────────────────────────────────────
  _onMounted() {
    this._syncConfig();
    if (!this.enabled) return;
    if (this.stack.length === 0) this._commit("initial", true);
  }
  _onUpdated() {
    this._syncConfig();
    if (!this.enabled) return;
    if (this.applying) {
      this._refreshSettle();
      return;
    }
    this._schedule("update");
  }
  _onSelection() {
    if (!this.enabled || this.applying) return;
    this._schedule("selection");
  }
  /**
   * Mark whether the chart is engaged: a capture-phase pointerdown inside `el`
   * engages it (runs before feature handlers stopPropagation), one elsewhere
   * releases it. Capture phase so an annotation/zoom gesture that stops
   * propagation still registers.
   * @param {any} e
   */
  _onPointerDown(e) {
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    this._engaged = !!(el && e.target && el.contains(e.target));
  }
  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = (e.key || "").toLowerCase();
    if (key !== "z" && key !== "y") return;
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    if (!el) return;
    const doc = el.ownerDocument;
    const active = doc && doc.activeElement;
    if (isEditableTarget(active)) return;
    if (!(el.contains(active) || this._engaged)) return;
    const redo = key === "y" || e.shiftKey;
    e.preventDefault();
    if (redo) this.redo();
    else this.undo();
  }
  // ─── Capture (coalesced) ────────────────────────────────────────────────
  /**
   * @param {string} label
   */
  _schedule(label) {
    if (this.applying || this._batching || !this.enabled) return;
    this._pendingLabel = label;
    if (this.coalesceMs > 0 && Environment.isBrowser()) {
      clearTimeout(this._coalesceTimer);
      this._coalesceTimer = setTimeout(
        () => this._commit(this._pendingLabel),
        this.coalesceMs
      );
    } else {
      this._commit(label);
    }
  }
  /**
   * @param {string} [label]
   * @param {boolean} [force] bypass the applying/batching guard (baseline / transaction)
   */
  _commit(label, force) {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    if (!force && (this.applying || this._batching)) return;
    const cp = this._capture(label);
    const current = this.stack[this.pointer];
    if (current && current.sig === cp.sig) return;
    if (this.pointer < this.stack.length - 1) {
      this.stack.splice(this.pointer + 1);
    }
    this.stack.push(cp);
    this.pointer = this.stack.length - 1;
    while (this.stack.length > this.maxDepth) {
      this.stack.shift();
      this.pointer--;
    }
    this._emitChange();
  }
  /**
   * @param {string} [label]
   */
  _capture(label) {
    const view = captureViewState(this.w, this.ctx);
    const { config, seriesSig } = this._cloneConfigCOW();
    return {
      id: `hist-${++this._counter}`,
      view,
      config,
      seriesSig,
      label: label || "change",
      at: Environment.isBrowser() ? Date.now() : 0,
      origin: "local",
      // reserved for per-user scoping (Live Rooms)
      sig: this._signature(view, config)
    };
  }
  /**
   * Clone w.config, sharing the previous checkpoint's cloned series when the
   * live series CONTENT is unchanged (copy-on-write). Sharing is decided by a
   * value signature, not reference identity: callers commonly mutate a kept
   * series array in place and pass the same reference back to updateSeries, and
   * an identity check would share a stale clone for exactly that case. The
   * stringify is not extra cost: _signature already serialises the series as
   * part of dedup.
   * @returns {{ config: any, seriesSig: string|null }}
   */
  _cloneConfigCOW() {
    const w = this.w;
    const prev = this.stack[this.pointer];
    let seriesSig = null;
    try {
      seriesSig = JSON.stringify(w.config.series);
    } catch (e) {
      seriesSig = null;
    }
    let cloned;
    if (prev && seriesSig !== null && prev.seriesSig === seriesSig) {
      const _a = w.config, { series: _series } = _a, rest = __objRest(_a, ["series"]);
      cloned = Utils.clone(rest);
      cloned.series = prev.config.series;
    } else {
      cloned = Utils.clone(w.config);
    }
    return { config: cloned, seriesSig };
  }
  /**
   * Data-level signature for dedup. Functions are dropped by JSON (fine: a
   * checkpoint whose only change is a function reference is not a meaningful
   * undo step). Runs once per committed checkpoint, not per raw event.
   * @param {any} view
   * @param {any} config
   * @returns {string}
   */
  _signature(view, config) {
    try {
      return JSON.stringify(view) + "|" + JSON.stringify(config);
    } catch (e) {
      return `nosig-${this._counter}`;
    }
  }
  // ─── Restore ────────────────────────────────────────────────────────────
  /**
   * @param {any} cp
   * @param {boolean} animate
   */
  _restore(cp, animate) {
    if (!cp) return;
    this.applying = true;
    let p;
    try {
      this.ctx.clearAnnotations();
      p = this.ctx.updateOptions(Utils.clone(cp.config), false, animate, false, false);
    } catch (e) {
      this.applying = false;
      throw e;
    }
    Promise.resolve(p).then(() => {
      applyViewInteraction(this.ctx, cp.view);
      this._refreshSettle();
      this._emitChange();
    }).catch(() => {
      this.applying = false;
    });
  }
  /**
   * Hold `applying` true until the restore's burst of async 'updated' events
   * has drained (one macrotask after the last one). Refreshed by _onUpdated.
   */
  _refreshSettle() {
    if (!Environment.isBrowser()) {
      this.applying = false;
      return;
    }
    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => {
      this.applying = false;
    }, 0);
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /**
   * Commit a checkpoint of the current state now (a discrete undo step). Used by
   * callers that mutate `w.config` without going through a full re-render (e.g.
   * Ink Layer's targeted annotation redraws, which fire no 'updated' event).
   * No-op when disabled or while a restore is applying.
   * @param {string} [label]
   */
  snapshot(label) {
    if (!this.enabled || this.applying) return;
    this._commit(label || "change");
  }
  /**
   * @param {boolean} [animate]
   */
  undo(animate = true) {
    if (!this.canUndo()) return;
    this.pointer--;
    this._restore(this.stack[this.pointer], animate);
  }
  /**
   * @param {boolean} [animate]
   */
  redo(animate = true) {
    if (!this.canRedo()) return;
    this.pointer++;
    this._restore(this.stack[this.pointer], animate);
  }
  canUndo() {
    return this.pointer > 0;
  }
  canRedo() {
    return this.pointer > -1 && this.pointer < this.stack.length - 1;
  }
  /**
   * @param {string} id
   * @param {boolean} [animate]
   */
  jump(id, animate = true) {
    const idx = this.stack.findIndex((c) => c.id === id);
    if (idx === -1 || idx === this.pointer) return;
    this.pointer = idx;
    this._restore(this.stack[idx], animate);
  }
  /** Clear the history, keeping the current state as the new baseline. */
  clear() {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    const current = this.stack[this.pointer];
    this.stack = current ? [current] : [];
    this.pointer = this.stack.length - 1;
    this._emitChange();
  }
  /**
   * Group multiple edits into a single undo step. `fn` may be async; await your
   * updateOptions/updateSeries calls inside it so the intermediate 'updated'
   * events are suppressed and only one checkpoint is committed afterwards.
   * @param {() => (void | Promise<any>)} fn
   * @param {{ label?: string }} [opts]
   * @returns {Promise<void>}
   */
  transaction(fn, opts = {}) {
    if (typeof fn !== "function") return Promise.resolve();
    const wasBatching = this._batching;
    this._batching = true;
    return Promise.resolve().then(() => fn()).finally(() => {
      this._batching = wasBatching;
      if (!wasBatching) this._commit(opts.label || "transaction", true);
    });
  }
  /**
   * @returns {{ id: string, label: string, at: number }[]}
   */
  entries() {
    return this.stack.map((c) => ({ id: c.id, label: c.label, at: c.at }));
  }
  /** Lightweight state for the historyChange event / a history-rail UI. */
  state() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      index: this.pointer,
      length: this.stack.length
    };
  }
  _emitChange() {
    this.ctx.events.fireEvent("historyChange", [this.ctx, this.state()]);
  }
  /** Drop the stack + detach listeners (called on full destroy). */
  teardown() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    clearTimeout(this._coalesceTimer);
    clearTimeout(this._settleTimer);
    this._coalesceTimer = null;
    this._settleTimer = null;
    this._unwireKeyboard();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "mounted", this._onMounted);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "updated", this._onUpdated);
      (_f = (_e = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e, "scrolled", this._onUpdated);
      (_h = (_g = this.ctx).removeEventListener) == null ? void 0 : _h.call(_g, "dataPointSelection", this._onSelection);
    }
    this.stack = [];
    this.pointer = -1;
    this._wired = false;
  }
}
_core__default.registerFeatures({ history: History });
export {
  default2 as default
};
