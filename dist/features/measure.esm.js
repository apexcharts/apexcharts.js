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
 * ApexCharts v5.16.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const Environment = _core.__apex_Environment_Environment;
class Measure {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.graphics = new Graphics(w);
    this.pins = [];
    this.drag = null;
    this.armed = false;
    this.persistent = false;
    this.pane = null;
    this._seedActive = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onSeedDown = this._onSeedDown.bind(this);
    this._onSeedKey = this._onSeedKey.bind(this);
    this._afterRender = this._afterRender.bind(this);
    ctx.addEventListener("mounted", this._afterRender);
    ctx.addEventListener("updated", this._afterRender);
    this._bindKeys();
  }
  _cfg() {
    return this.w.config.chart.measure || {};
  }
  _enabled() {
    return this.w.globals.axisCharts && this._cfg().enabled === true;
  }
  _mode() {
    return this._cfg().mode === "free" ? "free" : "span";
  }
  /**
   * Nearest first-series data point to a data x (used to snap span endpoints
   * onto the series line).
   * @param {number} dataX
   * @returns {{x:number,y:number}|null}
   */
  _snapToSeries(dataX) {
    const s0 = (
      /** @type {any} */
      (this.w.config.series || [])[0]
    );
    if (!s0) return null;
    const pts = this._points(s0.data || []);
    if (!pts.length) return null;
    let best = pts[0];
    let bd = Math.abs(pts[0].x - dataX);
    for (let i = 1; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - dataX);
      if (d < bd) {
        bd = d;
        best = pts[i];
      }
    }
    return best;
  }
  /**
   * Resolve a raw projected point to the endpoint that is actually drawn: span
   * mode snaps x to the nearest first-series data point (y follows the line);
   * free mode keeps the raw point.
   * @param {{x:number,y:number,gx:number,gy:number}} raw
   */
  _resolve(raw) {
    if (this._mode() === "free") return raw;
    const snapped = this._snapToSeries(raw.x);
    if (!snapped) return raw;
    const g = this._dataToGrid(snapped.x, snapped.y);
    return { x: snapped.x, y: snapped.y, gx: g.gx, gy: g.gy };
  }
  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
  }
  /** Bind the measure-key listeners once on the owner document. */
  _bindKeys() {
    if (this._keysBound) return;
    const doc = this._doc();
    if (!doc) return;
    doc.addEventListener("keydown", this._onKeyDown);
    doc.addEventListener("keyup", this._onKeyUp);
    this._keysBound = true;
  }
  /** @param {any} e */
  _onKeyDown(e) {
    if (!this._enabled() || this.persistent) return;
    const key = this._cfg().key || "m";
    if (e.key && e.key.toLowerCase() === String(key).toLowerCase()) {
      this._arm();
    } else if (e.key === "Escape") {
      this._cancelDrag();
    }
  }
  /** @param {any} e */
  _onKeyUp(e) {
    if (this.persistent) return;
    const key = this._cfg().key || "m";
    if (e.key && e.key.toLowerCase() === String(key).toLowerCase()) {
      if (!this.drag) this._disarm();
    }
  }
  /** Public: arm a sticky measure mode (survives key release) until stopped. */
  startMeasure() {
    if (!this._enabled()) return;
    this.persistent = true;
    this._arm();
  }
  /** Public: leave measure mode. */
  stopMeasure() {
    this.persistent = false;
    this._cancelDrag();
    this._disarm();
  }
  /**
   * Public: begin a measurement anchored at a client-space point (used by the
   * context menu's "Measure from here"). Endpoint A is fixed at (cx,cy), the
   * ruler follows the cursor, and the next pointer press sets B and pins it.
   * Escape cancels. No-op unless the measure tool is enabled.
   * @param {number} cx @param {number} cy
   */
  seedFromClient(cx, cy) {
    if (!this._enabled()) return;
    this._cancelDrag();
    this._endSeed(false);
    const a = this._project(cx, cy);
    this.drag = { a, b: a };
    this._seedActive = true;
    const doc = this._doc();
    if (doc) {
      doc.addEventListener("mousemove", this._onMove);
      doc.addEventListener("touchmove", this._onMove, { passive: false });
      doc.addEventListener("mousedown", this._onSeedDown, true);
      doc.addEventListener("touchstart", this._onSeedDown, true);
      doc.addEventListener("keydown", this._onSeedKey, true);
    }
    this._renderLive();
  }
  /** @param {any} e */
  _onSeedDown(e) {
    if (!this._seedActive || !this.drag) return;
    e.preventDefault();
    e.stopPropagation();
    const { cx, cy } = this._clientXY(e);
    this.drag.b = this._project(cx, cy);
    this._endSeed(true);
  }
  /** @param {any} e */
  _onSeedKey(e) {
    if (e.key === "Escape") this._endSeed(false);
  }
  /**
   * Finish (commit) or cancel a "measure from here" seed and detach listeners.
   * @param {boolean} commit
   */
  _endSeed(commit) {
    var _a, _b;
    if (!this._seedActive) return;
    this._seedActive = false;
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("mousedown", this._onSeedDown, true);
      doc.removeEventListener("touchstart", this._onSeedDown, true);
      doc.removeEventListener("keydown", this._onSeedKey, true);
    }
    const d = this.drag;
    this.drag = null;
    this._clearLive();
    if (!commit || !d) return;
    const a = this._resolve(d.a);
    const b = this._resolve(d.b);
    if (Math.abs(a.gx - b.gx) < 2 && Math.abs(a.gy - b.gy) < 2) return;
    const mode = this._mode();
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a.x, ya: a.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a, b);
  }
  /** Public: remove all pinned rulers. */
  clearMeasures() {
    var _a, _b;
    this.pins = [];
    this._renderPins();
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "clear measures");
  }
  /**
   * Snapshot of the pinned rulers as JSON-safe plain data. This is the piece of
   * state ViewState / Perspectives (shareable URL) / Rewind (undo) persist:
   * pins already live in data space, so they round-trip and re-project.
   * Returns a deep copy so callers cannot mutate ours.
   * @returns {Array<{xa:number,ya:number,xb:number,yb:number,mode:string}>}
   */
  getPins() {
    return this.pins.map((p) => ({
      xa: p.xa,
      ya: p.ya,
      xb: p.xb,
      yb: p.yb,
      mode: p.mode === "free" ? "free" : "span"
    }));
  }
  /**
   * Replace the pinned rulers with a restored set and redraw. Accepts the shape
   * getPins() returns; a nullish / non-array value (or an old token without
   * measure state) clears all pins. Non-finite entries are dropped. Does NOT
   * record a Rewind step (the restore itself is the caller's undo boundary).
   * @param {any} pins
   */
  setPins(pins) {
    this.pins = Array.isArray(pins) ? pins.filter(
      (p) => p && isFinite(p.xa) && isFinite(p.ya) && isFinite(p.xb) && isFinite(p.yb)
    ).map((p) => ({
      xa: +p.xa,
      ya: +p.ya,
      xb: +p.xb,
      yb: +p.yb,
      mode: p.mode === "free" ? "free" : "span"
    })) : [];
    this._renderPins();
  }
  /**
   * Normalize a series `data` array into {x,y} points (numeric/datetime x or
   * category index). Non-finite / non-scalar (range/candle) points drop out.
   * @param {any[]} data
   * @returns {Array<{x:number,y:number}>}
   */
  _points(data) {
    const out = [];
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      let x;
      let y;
      if (Array.isArray(p)) {
        x = +p[0];
        y = +p[1];
      } else if (p && typeof p === "object") {
        x = +p.x;
        y = +p.y;
      } else {
        x = i;
        y = +p;
      }
      if (isFinite(x) && isFinite(y)) out.push({ x, y });
    }
    return out;
  }
  /** Lay the transparent capture pane over the plot so our pointer handlers own
   *  the drag (ZoomPanSelection never sees it). */
  _arm() {
    if (this.armed || !this._enabled()) return;
    const w = this.w;
    const parent = w.dom.elGraphical;
    if (!parent) return;
    this.armed = true;
    const pane = this.graphics.drawRect(0, 0, w.layout.gridWidth, w.layout.gridHeight);
    pane.node.setAttribute("class", "apexcharts-measure-capture");
    pane.node.setAttribute("fill", "transparent");
    pane.node.style.cursor = "crosshair";
    pane.node.style.pointerEvents = "all";
    pane.node.addEventListener("mousedown", this._onDown);
    pane.node.addEventListener("touchstart", this._onDown, { passive: false });
    parent.add(pane);
    this.pane = pane;
  }
  _disarm() {
    this.armed = false;
    if (this.pane) {
      this.pane.node.removeEventListener("mousedown", this._onDown);
      this.pane.node.removeEventListener("touchstart", this._onDown);
      const p = this.pane.node;
      if (p.parentNode) p.parentNode.removeChild(p);
      this.pane = null;
    }
  }
  /** @param {any} e @returns {{cx:number,cy:number}} */
  _clientXY(e) {
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { cx: t.clientX, cy: t.clientY };
  }
  _gridRect() {
    const g = this.w.dom.baseEl.querySelector(".apexcharts-grid");
    return g ? g.getBoundingClientRect() : null;
  }
  /** [min,max] for the primary y-axis, preferring the rendered nice scale. */
  _yRange() {
    const g = this.w.globals;
    const s = g.yAxisScale && g.yAxisScale[0];
    if (s && isFinite(s.niceMin) && isFinite(s.niceMax) && s.niceMax !== s.niceMin) {
      return [s.niceMin, s.niceMax];
    }
    return [g.minY, g.maxY];
  }
  /**
   * Client pixel -> { x, y (data), gx, gy (grid-local SVG units) }.
   * @param {number} cx @param {number} cy
   */
  _project(cx, cy) {
    const w = this.w;
    const rect = this._gridRect();
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = rect ? clamp((cx - rect.left) / rect.width) : 0;
    const fy = rect ? clamp((cy - rect.top) / rect.height) : 0;
    const [ymin, ymax] = this._yRange();
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const y = ymax - fy * (ymax - ymin);
    return { x, y, gx: fx * gw, gy: fy * gh };
  }
  /**
   * Data (x,y) -> grid-local SVG coords, for redrawing pinned rulers.
   * @param {number} x @param {number} y
   */
  _dataToGrid(x, y) {
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const xr = w.globals.maxX - w.globals.minX || 1;
    const [ymin, ymax] = this._yRange();
    const yr = ymax - ymin || 1;
    return {
      gx: (x - w.globals.minX) / xr * gw,
      gy: gh - (y - ymin) / yr * gh
    };
  }
  /** @param {any} e */
  _onDown(e) {
    if (!this.armed) return;
    e.preventDefault();
    e.stopPropagation();
    const { cx, cy } = this._clientXY(e);
    const a = this._project(cx, cy);
    this.drag = { a, b: a };
    const doc = this._doc();
    if (doc) {
      doc.addEventListener("mousemove", this._onMove);
      doc.addEventListener("mouseup", this._onUp);
      doc.addEventListener("touchmove", this._onMove, { passive: false });
      doc.addEventListener("touchend", this._onUp);
    }
    this._renderLive();
  }
  /** @param {any} e */
  _onMove(e) {
    if (!this.drag) return;
    if (e.cancelable) e.preventDefault();
    const { cx, cy } = this._clientXY(e);
    this.drag.b = this._project(cx, cy);
    this._renderLive();
  }
  /** @param {any} _e */
  _onUp(_e) {
    var _a, _b;
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("mouseup", this._onUp);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("touchend", this._onUp);
    }
    if (!this.drag) return;
    const rawA = this.drag.a;
    const rawB = this.drag.b;
    this.drag = null;
    this._clearLive();
    if (Math.abs(rawA.gx - rawB.gx) < 2 && Math.abs(rawA.gy - rawB.gy) < 2) {
      if (!this.persistent) this._disarm();
      return;
    }
    const mode = this._mode();
    const a = this._resolve(rawA);
    const b = this._resolve(rawB);
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a.x, ya: a.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a, b);
    if (!this.persistent) this._disarm();
  }
  _cancelDrag() {
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("mouseup", this._onUp);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("touchend", this._onUp);
    }
    this.drag = null;
    this._clearLive();
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @returns {{dx:number,dy:number,pct:number,slope:number}}
   */
  _stats(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      dx,
      dy,
      pct: a.y !== 0 ? dy / Math.abs(a.y) * 100 : NaN,
      slope: dx !== 0 ? dy / dx : NaN
    };
  }
  /** @param {number} v */
  _fmt(v) {
    if (!isFinite(v)) return "n/a";
    const a = Math.abs(v);
    if (a !== 0 && (a < 0.01 || a >= 1e6)) return v.toExponential(2);
    return String(Math.round(v * 100) / 100);
  }
  /** getComputedStyle of the graphical layer (browser only), for CSS vars. */
  _computedStyle() {
    if (!Environment.isBrowser()) return null;
    const node = this.w.dom.elGraphical && this.w.dom.elGraphical.node;
    if (!node || typeof getComputedStyle !== "function") return null;
    try {
      return getComputedStyle(node);
    } catch (e) {
      return null;
    }
  }
  /**
   * Resolve a color: explicit config value, else a `--apx-measure-*` CSS custom
   * property, else the built-in default.
   * @param {any} cfgVal @param {string} varName @param {string} fallback
   * @param {CSSStyleDeclaration|null} [cs]
   */
  _resolveColor(cfgVal, varName, fallback, cs) {
    if (cfgVal) return cfgVal;
    const style = cs !== void 0 ? cs : this._computedStyle();
    const v = style ? style.getPropertyValue(varName).trim() : "";
    return v || fallback;
  }
  /** Resolved semantic colors (config -> CSS var -> built-in default). */
  _colors() {
    const c = this._cfg().colors || {};
    const cs = this._computedStyle();
    return {
      up: this._resolveColor(c.up, "--apx-measure-up", "#16a34a", cs),
      down: this._resolveColor(c.down, "--apx-measure-down", "#dc2626", cs),
      neutral: this._resolveColor(c.neutral, "--apx-measure-neutral", "#64748b", cs),
      guide: this._resolveColor(c.guide, "--apx-measure-guide", "#94a3b8", cs)
    };
  }
  /** @param {number} dy */
  _dirColor(dy) {
    const c = this._colors();
    return dy === 0 ? c.neutral : dy > 0 ? c.up : c.down;
  }
  /** @param {number} dy */
  _dirClass(dy) {
    return dy === 0 ? "apexcharts-measure-flat" : dy > 0 ? "apexcharts-measure-up" : "apexcharts-measure-down";
  }
  /**
   * Format a percentage, via `measure.format.percent` when set.
   * @param {number} p
   */
  _fmtPct(p) {
    if (!isFinite(p)) return "n/a";
    const f = this._cfg().format && this._cfg().format.percent;
    if (typeof f === "function") {
      try {
        const s = f(p);
        if (s != null) return String(s);
      } catch (e) {
      }
    }
    return (p >= 0 ? "+" : "") + this._fmt(p) + "%";
  }
  /**
   * The readout lines for a ruler: `measure.label` override, else the default
   * per-mode text.
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st @param {string} mode
   * @returns {string[]}
   */
  _label(a, b, st, mode) {
    const fn = this._cfg().label;
    if (typeof fn === "function") {
      const out = fn({
        from: { x: a.x, y: a.y },
        to: { x: b.x, y: b.y },
        dx: st.dx,
        dy: st.dy,
        percentChange: st.pct,
        slope: st.slope,
        mode
      });
      return Array.isArray(out) ? out.map(String) : [String(out)];
    }
    if (mode === "span") {
      const arrow = st.dy === 0 ? "" : st.dy > 0 ? " ↑" : " ↓";
      const pct = isFinite(st.pct) ? "(" + this._fmtPct(st.pct) + ")" : "";
      return [this._fmtY(st.dy) + "  " + pct + arrow, this._fmtX(a.x) + "  to  " + this._fmtX(b.x)];
    }
    return ["Δx " + this._fmtDx(st.dx), "Δy " + this._fmtY(st.dy), this._fmtPct(st.pct)];
  }
  /**
   * Format an x delta, treating datetime x as a day count.
   * @param {number} dx
   */
  _fmtDx(dx) {
    if (this.w.config.xaxis.type === "datetime") {
      const days = dx / 864e5;
      return Math.round(days * 10) / 10 + "d";
    }
    return this._fmt(dx);
  }
  /**
   * Format a y value (a delta) via the y-axis label formatter when present.
   * @param {number} v
   */
  _fmtY(v) {
    const cf = this._cfg().format && this._cfg().format.y;
    if (typeof cf === "function") {
      try {
        const s = cf(v);
        if (s != null) return String(s);
      } catch (e) {
      }
    }
    const f = this.w.globals.yLabelFormatters && this.w.globals.yLabelFormatters[0];
    if (typeof f === "function") {
      try {
        const s = f(v, { seriesIndex: 0, dataPointIndex: -1, w: this.w });
        if (s != null && s !== "") return String(s);
      } catch (e) {
      }
    }
    return this._fmt(v);
  }
  /**
   * Format an x value: a short date for datetime x, else the x-label formatter
   * or a plain number.
   * @param {number} x
   */
  _fmtX(x) {
    const w = this.w;
    const cf = this._cfg().format && this._cfg().format.x;
    if (typeof cf === "function") {
      try {
        const s = cf(x);
        if (s != null) return String(s);
      } catch (e) {
      }
    }
    if (w.config.xaxis.type === "datetime") {
      const d = new Date(x);
      return d.toLocaleDateString(void 0, {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    const f = w.globals.xLabelFormatter;
    if (typeof f === "function") {
      try {
        const s = f(x, { w });
        if (s != null && s !== "") return String(s);
      } catch (e) {
      }
    }
    return this._fmt(x);
  }
  /** The live overlay group, created lazily inside elGraphical. */
  _liveGroup() {
    const w = this.w;
    if (this._live && this._live.node && this._live.node.parentNode) {
      return this._live;
    }
    const g = this.graphics.group({ class: "apexcharts-measure-live" });
    g.node.style.pointerEvents = "none";
    if (w.dom.elGraphical) w.dom.elGraphical.add(g);
    this._live = g;
    return g;
  }
  _clearLive() {
    if (this._live && this._live.node) {
      const n = this._live.node;
      if (n.parentNode) n.parentNode.removeChild(n);
    }
    this._live = null;
  }
  _renderLive() {
    if (!this.drag) return;
    const g = this._liveGroup();
    while (g.node.firstChild) g.node.removeChild(g.node.firstChild);
    const a = this._resolve(this.drag.a);
    const b = this._resolve(this.drag.b);
    this._drawRuler(g, a, b, false, this._mode());
  }
  /** Redraw all pinned rulers into a fresh group (called after each render). */
  _renderPins() {
    const w = this.w;
    const old = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-measure-pins");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!this.pins.length || !w.dom.elGraphical) return;
    const g = this.graphics.group({ class: "apexcharts-measure-pins" });
    g.node.style.pointerEvents = "none";
    w.dom.elGraphical.add(g);
    this.pins.forEach((p) => {
      const a = __spreadProps(__spreadValues({}, this._dataToGrid(p.xa, p.ya)), { x: p.xa, y: p.ya });
      const b = __spreadProps(__spreadValues({}, this._dataToGrid(p.xb, p.yb)), { x: p.xb, y: p.yb });
      this._drawRuler(g, a, b, true, p.mode || "span");
    });
  }
  /**
   * Draw one ruler into `g`, dispatching on style.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {boolean} [pinned]
   * @param {string} [mode] 'span' (finance-style band, default) | 'free'
   */
  _drawRuler(g, a, b, pinned, mode) {
    const st = this._stats(a, b);
    const rg = this.graphics.group({
      class: "apexcharts-measure-ruler " + this._dirClass(st.dy) + (pinned ? " apexcharts-measure-pinned" : "")
    });
    if ((mode || this._mode()) === "free") this._drawFree(rg, a, b, st);
    else this._drawSpan(rg, a, b, st);
    g.add(rg);
  }
  /** Endpoint dots on the series line (skipped when markers:false).
   * @param {any} g @param {{gx:number,gy:number}} p @param {string} color */
  _dot(g, p, color) {
    if (this._cfg().markers === false) return;
    const dot = this.graphics.drawMarker(p.gx, p.gy, {
      pSize: 4,
      shape: "circle",
      pointFillColor: color,
      pointFillOpacity: 1,
      pointStrokeColor: "#fff",
      pointStrokeWidth: 2,
      pointStrokeOpacity: 1
    });
    g.add(dot);
  }
  /** Draw the readout label box + text into `g` at (bx,by).
   * @param {any} g @param {string[]} lines @param {number} bx @param {number} by
   * @param {number} boxW @param {number} boxH @param {string} color */
  _readout(g, lines, bx, by, boxW, boxH, color) {
    const box = this.graphics.drawRect(bx, by, boxW, boxH, 4);
    box.node.setAttribute("class", "apexcharts-measure-label-bg");
    box.attr({ fill: "#ffffff", "fill-opacity": 0.95, stroke: color, "stroke-width": 1 });
    g.add(box);
    const label = this.graphics.drawText({
      x: bx + 9,
      y: by + 15,
      text: lines,
      textAnchor: "start",
      fontSize: "11px",
      foreColor: "#1e293b",
      cssClass: "apexcharts-measure-label"
    });
    g.add(label);
  }
  /**
   * Finance-style ruler: vertical guides + shaded band + endpoints on the
   * series line + a top readout. Guides/band/markers are individually
   * toggleable via config.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st
   */
  _drawSpan(g, a, b, st) {
    const w = this.w;
    const cfg = this._cfg();
    const gh = w.layout.gridHeight;
    const color = this._dirColor(st.dy);
    const lx = Math.min(a.gx, b.gx);
    const rx = Math.max(a.gx, b.gx);
    if (cfg.band !== false) {
      const band = this.graphics.drawRect(lx, 0, Math.max(0, rx - lx), gh, 0);
      band.node.setAttribute("class", "apexcharts-measure-band");
      band.attr({ fill: color, "fill-opacity": 0.09, stroke: "none" });
      g.add(band);
    }
    if (cfg.guides !== false) {
      [a, b].forEach((p) => {
        const vline = this.graphics.drawLine(p.gx, 0, p.gx, gh, this._colors().guide, 4, 1);
        vline.node.setAttribute("class", "apexcharts-measure-vline");
        g.add(vline);
      });
    }
    [a, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a, b, st, "span");
    const longest = lines.reduce((m, s) => Math.max(m, s.length), 0);
    const boxW = Math.max(148, longest * 6.4);
    const boxH = 20 + lines.length * 15;
    let bx = (lx + rx) / 2 - boxW / 2;
    bx = Math.max(2, Math.min(bx, w.layout.gridWidth - boxW - 2));
    this._readout(g, lines, bx, 4, boxW, boxH, color);
  }
  /**
   * Free 2D ruler: a diagonal line between two arbitrary points + a readout.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st
   */
  _drawFree(g, a, b, st) {
    const color = this._dirColor(st.dy);
    const line = this.graphics.drawLine(a.gx, a.gy, b.gx, b.gy, color, 0, 2);
    line.node.setAttribute("class", "apexcharts-measure-line");
    g.add(line);
    [a, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a, b, st, "free");
    const longest = lines.reduce((m, s) => Math.max(m, s.length), 0);
    const boxW = Math.max(72, longest * 6.2);
    const boxH = 16 + lines.length * 15;
    let bx = (a.gx + b.gx) / 2 + 8;
    let by = (a.gy + b.gy) / 2 - boxH / 2;
    bx = Math.max(2, Math.min(bx, this.w.layout.gridWidth - boxW - 2));
    by = Math.max(2, Math.min(by, this.w.layout.gridHeight - boxH - 2));
    this._readout(g, lines, bx, by, boxW, boxH, color);
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   */
  _fireMeasured(a, b) {
    const st = this._stats(a, b);
    const payload = {
      from: { x: a.x, y: a.y },
      to: { x: b.x, y: b.y },
      dx: st.dx,
      dy: st.dy,
      percentChange: st.pct,
      slope: st.slope
    };
    const fn = this.w.config.chart.events.measured;
    if (typeof fn === "function") fn(this.ctx, payload);
    this.ctx.events.fireEvent("measured", [this.ctx, payload]);
  }
  /** Re-project the measure pins after each render. */
  _afterRender() {
    if (this._enabled()) {
      if (this.pins.length) this._renderPins();
      if (this.persistent && !this.pane) this._arm();
    }
  }
  teardown() {
    this._cancelDrag();
    this._endSeed(false);
    this._disarm();
    const doc = this._doc();
    if (doc && this._keysBound) {
      doc.removeEventListener("keydown", this._onKeyDown);
      doc.removeEventListener("keyup", this._onKeyUp);
    }
    this._keysBound = false;
    this.pins = [];
  }
}
_core__default.registerFeatures({ measure: Measure });
export {
  default2 as default
};
