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
 * ApexCharts v7.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const Utils = _core.__apex_Utils;
class AxisMapping {
  /**
   * Pixels per data-unit on the x-axis. Derived from `minX..maxX` so it is the
   * exact inverse used by both {@link dataXToPx} and {@link pxToDataX}.
   * @param {import('../types/internal').ChartStateW} w
   * @returns {number}
   */
  static xRatio(w) {
    const gw = w.layout.gridWidth || 1;
    return (w.globals.maxX - w.globals.minX) / gw;
  }
  /**
   * Data-x -> pixels from the plot origin (usable as an SVG `x` attribute).
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} dataX
   * @returns {number}
   */
  static dataXToPx(w, dataX) {
    return (dataX - w.globals.minX) / AxisMapping.xRatio(w);
  }
  /**
   * Pixels from the plot origin -> data-x. Feed it `screenX - svgLeft - translateX`.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} px
   * @returns {number}
   */
  static pxToDataX(w, px) {
    return w.globals.minX + px * AxisMapping.xRatio(w);
  }
  /**
   * Client (screen) x -> pixels from the plot origin. The origin is the svg
   * element's left edge plus `translateX`, never the `.apexcharts-grid` box
   * (fact 2 above), so the result does not depend on what the grid happens to
   * render. `svgWidth` is the unscaled width the svg was drawn at, so the ratio
   * against the measured one is the CSS zoom of any container the chart sits in.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} screenX
   * @returns {number}
   */
  static screenXToPlotPx(w, screenX) {
    const baseEl = w.dom.baseEl;
    const svg = baseEl && baseEl.querySelector(".apexcharts-svg");
    if (!svg) return screenX - w.layout.translateX;
    const svgRect = svg.getBoundingClientRect();
    const zoom = w.globals.svgWidth ? svgRect.width / w.globals.svgWidth : 1;
    return (screenX - svgRect.left) / (zoom || 1) - w.layout.translateX;
  }
}
const Environment = _core.__apex_Environment_Environment;
const VPAD = 3;
class StreamLabels {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._hovered = -1;
  }
  /** @returns {boolean} */
  isActive() {
    return this.w.config.chart.requestedType === "streamgraph";
  }
  /**
   * Data value -> pixel, the same mapping the line renderer uses
   * (`Line._initSerieVariables`: `zeroY - v / yRatio`, with baseLineY placing
   * the zero line). Written out in terms of the domain rather than read off
   * `xyRatios` so the layer stays independent of the renderer's internals.
   *
   * @param {number} v
   * @returns {number}
   */
  _yPx(v) {
    var _a;
    const w = this.w;
    const gl = w.globals;
    const h = w.layout.gridHeight;
    const span = gl.maxY - gl.minY;
    if (!span || !isFinite(span)) return h / 2;
    const frac = (v - gl.minY) / span;
    return ((_a = w.config.yaxis[0]) == null ? void 0 : _a.reversed) ? frac * h : h - frac * h;
  }
  /**
   * Draw (or redraw) everything this layer owns.
   *
   * Called from both render paths and safe to call on a chart that is not a
   * streamgraph, has labels switched off, or drew no bands.
   */
  draw() {
    if (!this.isActive()) return;
    this.clearDim();
    this.bindHover();
    this.drawLabels();
  }
  /**
   * Draw (or redraw) the band labels.
   *
   * Called from both render paths and safe to call on a chart that is not a
   * streamgraph, has labels switched off, or drew no bands.
   */
  drawLabels() {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    if (!this.isActive()) return;
    const cfg = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.streamgraph) == null ? void 0 : _b.labels;
    if (!cfg || cfg.show === false) return;
    const host = w.dom.elGraphical;
    const data = w.streamgraphData;
    if (!host || !data) return;
    this.removeLabels();
    const graphics = new Graphics(w, this.ctx);
    const group = graphics.group({ class: "apexcharts-streamgraph-labels" });
    const fontSize = ((_c = cfg.style) == null ? void 0 : _c.fontSize) || "auto";
    const fontFamily = ((_d = cfg.style) == null ? void 0 : _d.fontFamily) || w.config.chart.fontFamily;
    const fontWeight = ((_e = cfg.style) == null ? void 0 : _e.fontWeight) || 600;
    const minWidth = cfg.minWidth == null ? 24 : cfg.minWidth;
    const placed = [];
    for (let i = 0; i < data.order.length; i++) {
      const k = data.order[i];
      const label = this._placeLabel(k, {
        fontSize,
        fontFamily,
        fontWeight,
        minWidth,
        graphics
      });
      if (label) placed.push(label);
    }
    let drawn = 0;
    for (const label of this._deconflict(placed)) {
      const k = label.k;
      const el = graphics.drawText({
        x: label.x,
        y: label.y,
        text: label.text,
        textAnchor: "middle",
        dominantBaseline: "middle",
        // The size a band's own name is drawn at is decided per band, not per
        // chart (see `_resolveFontSize`).
        fontSize: label.fontSize,
        fontFamily,
        fontWeight,
        foreColor: ((_g = (_f = cfg.style) == null ? void 0 : _f.colors) == null ? void 0 : _g[k]) || label.color,
        cssClass: "apexcharts-streamgraph-label"
      });
      el.node.setAttribute("data:realIndex", String(k));
      group.add(el);
      drawn++;
    }
    if (!drawn) return;
    const xaxisEl = host.node.querySelector(".apexcharts-xaxis");
    if (xaxisEl) {
      host.node.insertBefore(group.node, xaxisEl);
    } else {
      host.add(group);
    }
    this.holdUntilBandsLand(group);
  }
  /**
   * Where band `k`'s name could go, best spot first, or null if nowhere.
   *
   * Returns several candidates rather than one. Each band picks its spot from
   * its own shape alone, and on a chart where everything peaks in the same
   * burst that puts every name in the same narrow strip — the first version of
   * this returned one placement each and the de-overlap pass then had to throw
   * twenty of twenty-two away. Offering alternatives lets a name that loses its
   * first choice slide along its own band instead of vanishing.
   *
   * A candidate is the middle of a stretch where the band clears the line box,
   * plus, on a stretch with room to spare, two more spread across it.
   *
   * @param {number} k
   * @param {{fontSize: string, fontFamily: string, fontWeight: any, minWidth: number, graphics: any}} opts
   * @returns {{k: number, weight: number, candidates: any[]}|null}
   */
  _placeLabel(k, { fontSize, fontFamily, fontWeight, minWidth, graphics }) {
    const w = this.w;
    const data = w.streamgraphData;
    const lo = data.lows[k];
    const hi = data.highs[k];
    if (!lo || !hi) return null;
    const xPx = w.globals.seriesXvalues[k];
    const m = lo.length;
    if (!Array.isArray(xPx) || xPx.length < m || m === 0) return null;
    const thickness = new Array(m);
    let peakT = 0;
    for (let j = 0; j < m; j++) {
      const t = Math.abs(this._yPx(hi[j]) - this._yPx(lo[j]));
      thickness[j] = t;
      if (t > peakT) peakT = t;
    }
    if (peakT <= 0) return null;
    const size = this._resolveFontSize(fontSize, peakT);
    const name = String(data.names[k]);
    let px = size;
    let rect = graphics.getTextRects(
      name,
      `${px}px`,
      fontFamily,
      "",
      true,
      fontWeight
    );
    if (peakT < rect.height + VPAD * 2) return null;
    const widest = this._widestRun(thickness, xPx, rect.height + VPAD * 2, m);
    if (!widest) return null;
    if (rect.width > widest.width && fontSize === "auto") {
      const shrunk = Math.floor(px * (widest.width / rect.width));
      if (shrunk < this._autoBounds().min) return null;
      px = shrunk;
      rect = graphics.getTextRects(
        name,
        `${px}px`,
        fontFamily,
        "",
        true,
        fontWeight
      );
      if (peakT < rect.height + VPAD * 2) return null;
    }
    const needed = rect.height + VPAD * 2;
    const candidates = [];
    for (const run of this._runs(thickness, needed, m)) {
      const xL = Number(xPx[run.l]);
      const xR = Number(xPx[run.r]);
      if (!isFinite(xL) || !isFinite(xR)) continue;
      let span = xR - xL;
      if (span <= 0 && m > 1) {
        const step = Math.abs(
          Number(xPx[Math.min(run.r + 1, m - 1)]) - Number(xPx[Math.max(run.l - 1, 0)])
        );
        span = isFinite(step) ? step : 0;
      }
      if (span < minWidth || span < rect.width * 0.35) continue;
      const text = rect.width <= span ? name : graphics.getTextBasedOnMaxWidth({
        text: name,
        maxWidth: span,
        fontSize: `${px}px`,
        fontFamily
      });
      if (!text || text === "...") continue;
      const drawnWidth = text === name ? rect.width : rect.width * (text.length / name.length);
      const centres = [xL + span / 2];
      if (span > drawnWidth * 2.2) {
        centres.push(xL + drawnWidth / 2 + 2, xR - drawnWidth / 2 - 2);
      }
      for (const cx of centres) {
        let anchor = run.l;
        let bestDx = Infinity;
        for (let j = run.l; j <= run.r; j++) {
          const dx = Math.abs(Number(xPx[j]) - cx);
          if (dx < bestDx) {
            bestDx = dx;
            anchor = j;
          }
        }
        candidates.push({
          x: cx,
          y: (this._yPx(lo[anchor]) + this._yPx(hi[anchor])) / 2,
          text,
          color: this._contrastOn(k),
          fontSize: `${px}px`,
          width: drawnWidth,
          height: rect.height
        });
      }
      if (candidates.length >= 6) break;
    }
    return candidates.length ? { k, weight: peakT, candidates } : null;
  }
  /**
   * The contiguous stretches where the band clears `needed`, thickest first.
   * @param {number[]} thickness
   * @param {number} needed
   * @param {number} m
   * @returns {Array<{l: number, r: number, maxT: number}>}
   */
  _runs(thickness, needed, m) {
    const runs = [];
    let j = 0;
    while (j < m) {
      if (thickness[j] < needed) {
        j++;
        continue;
      }
      let end = j;
      let maxT = thickness[j];
      while (end + 1 < m && thickness[end + 1] >= needed) {
        end++;
        if (thickness[end] > maxT) maxT = thickness[end];
      }
      runs.push({ l: j, r: end, maxT });
      j = end + 1;
    }
    return runs.sort((a, b) => b.maxT - a.maxT);
  }
  /**
   * The widest qualifying stretch in px, used to decide whether the name has to
   * be stepped down a size before any placement is attempted.
   * @param {number[]} thickness
   * @param {any[]} xPx
   * @param {number} needed
   * @param {number} m
   * @returns {{width: number}|null}
   */
  _widestRun(thickness, xPx, needed, m) {
    let best = -1;
    for (const run of this._runs(thickness, needed, m)) {
      const span = Number(xPx[run.r]) - Number(xPx[run.l]);
      if (isFinite(span) && span > best) best = span;
    }
    return best >= 0 ? { width: best } : null;
  }
  /**
   * Drop the labels that would land on top of one another.
   *
   * Each band picks its own widest stretch with no idea what its neighbours
   * picked, and on a dense chart two of them routinely want the same patch of
   * screen. Two names overlapping is worse than one name missing: the reader
   * can no longer tell which band EITHER belongs to, and the tooltip still
   * names every band on hover.
   *
   * Ranked by the BAND's own thickness, not by the label's area: sorting on
   * area hands priority to whoever has the longest name, so a sliver called
   * "Willow Warbler" outranks a dominant band called "Robin". Thickest band
   * first means the name that survives a collision is the one on the band
   * carrying more, which is also the one the reader is most likely to want.
   *
   * @param {any[]} labels
   * @returns {any[]}
   */
  _deconflict(labels) {
    const byImportance = labels.slice().sort((a, b) => b.weight - a.weight);
    const kept = [];
    const free = (box) => !kept.some(
      (o) => box.left < o.box.right && box.right > o.box.left && box.top < o.box.bottom && box.bottom > o.box.top
    );
    for (const label of byImportance) {
      for (const c of label.candidates) {
        const box = {
          left: c.x - c.width / 2,
          right: c.x + c.width / 2,
          top: c.y - c.height / 2,
          bottom: c.y + c.height / 2
        };
        if (free(box)) {
          kept.push(__spreadProps(__spreadValues({ k: label.k }, c), { box }));
          break;
        }
      }
    }
    return kept;
  }
  /** The bounds `fontSize: 'auto'` scales between. */
  _autoBounds() {
    var _a, _b;
    const cfg = ((_b = (_a = this.w.config.plotOptions) == null ? void 0 : _a.streamgraph) == null ? void 0 : _b.labels) || {};
    return {
      min: cfg.minFontSize == null ? 9 : cfg.minFontSize,
      max: cfg.maxFontSize == null ? 30 : cfg.maxFontSize
    };
  }
  /**
   * The px size band `k`'s name is drawn at, given how thick that band gets.
   *
   * `auto` is the default because it is the convention of the form, and because
   * the alternative actively misleads: a streamgraph's whole claim is that
   * thickness is quantity, and a fixed size prints that claim in the same voice
   * for a band carrying half the total and a band carrying a rounding error.
   *
   * A literal (`'12px'`) opts out and every name is drawn at it.
   *
   * @param {string} fontSize the configured value, or 'auto'
   * @param {number} peakT the band's greatest thickness, in px
   * @returns {number} px
   */
  _resolveFontSize(fontSize, peakT) {
    if (fontSize !== "auto") {
      const parsed = parseFloat(fontSize);
      return isFinite(parsed) && parsed > 0 ? parsed : 12;
    }
    const { min, max } = this._autoBounds();
    return Math.max(min, Math.min(max, Math.round(peakT * 0.36)));
  }
  /**
   * Black or white, whichever reads on band `k`'s own fill.
   *
   * A streamgraph's palette runs from pale yellows to near-black slates in the
   * same chart, so one fixed label colour is unreadable on some band every
   * time.
   *
   * @param {number} k
   * @returns {string}
   */
  _contrastOn(k) {
    var _a;
    const w = this.w;
    const fill = (_a = w.globals.colors) == null ? void 0 : _a[k];
    const rgb = typeof fill === "string" ? Utils.parseHex(fill) : null;
    if (!rgb) return w.config.chart.foreColor;
    return Utils.relativeLuminance(rgb) > 0.45 ? "#000000" : "#ffffff";
  }
  /** Drop the label layer, if one is present. */
  removeLabels() {
    const host = this.w.dom.elGraphical;
    const prev = host && host.node.querySelector(".apexcharts-streamgraph-labels");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
  }
  // ── Hover ────────────────────────────────────────────────────────────────
  /**
   * Watch the plot for the band under the cursor.
   *
   * Bound to the svg rather than to the band paths: with `tooltip.intersect`
   * off the pointer is not required to be over a path at all, and hit-testing
   * from the geometry keeps the outline agreeing with the tooltip (both resolve
   * to the nearest column) whether or not a tooltip is even switched on.
   *
   * The flag lives on the node, so a full render (which builds a new svg) binds
   * again and the fast update path (which keeps the old one) does not stack a
   * second listener per update.
   */
  bindHover() {
    const w = this.w;
    if (!Environment.isBrowser()) return;
    if (this._hoverCfg().show === false) return;
    const svg = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-svg");
    if (!svg || svg.__apexStreamHover) return;
    svg.__apexStreamHover = true;
    svg.addEventListener("mousemove", (e) => {
      if (!this.isActive() || !this.w.streamgraphData) return;
      this._dim(this._bandAt(e));
    });
    svg.addEventListener("mouseleave", () => {
      this._dim(-1);
    });
  }
  /** @returns {Record<string, any>} */
  _hoverCfg() {
    var _a, _b;
    return ((_b = (_a = this.w.config.plotOptions) == null ? void 0 : _a.streamgraph) == null ? void 0 : _b.hover) || {};
  }
  /**
   * Which band is under the pointer, or -1.
   *
   * x goes through `AxisMapping.screenXToPlotPx`, the one screen-to-plot
   * mapping, so a chart inside a CSS-zoomed container hit-tests where it looks.
   * y is measured off the same svg rect with the same zoom factor.
   *
   * @param {MouseEvent} e
   * @returns {number}
   */
  _bandAt(e) {
    const w = this.w;
    const d = w.streamgraphData;
    if (!d || !d.order.length) return -1;
    const svg = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-svg");
    if (!svg) return -1;
    const rect = svg.getBoundingClientRect();
    const zoom = w.globals.svgWidth ? rect.width / w.globals.svgWidth : 1;
    const px = AxisMapping.screenXToPlotPx(w, e.clientX);
    const py = (e.clientY - rect.top) / (zoom || 1) - w.layout.translateY;
    if (px < 0 || px > w.layout.gridWidth) return -1;
    if (py < 0 || py > w.layout.gridHeight) return -1;
    const xs = w.globals.seriesXvalues[d.order[0]];
    if (!Array.isArray(xs) || !xs.length) return -1;
    const captured = w.interact ? w.interact.capturedDataPointIndex : -1;
    let j = -1;
    if (captured >= 0 && captured < xs.length) {
      j = captured;
    } else {
      let best = Infinity;
      for (let i = 0; i < xs.length; i++) {
        const dx = Math.abs(Number(xs[i]) - px);
        if (dx < best) {
          best = dx;
          j = i;
        }
      }
    }
    if (j < 0) return -1;
    let nearest = -1;
    let gap = Infinity;
    for (let i = 0; i < d.order.length; i++) {
      const k = d.order[i];
      const a = this._yPx(d.highs[k][j]);
      const b = this._yPx(d.lows[k][j]);
      const top = Math.min(a, b);
      const bottom = Math.max(a, b);
      if (py >= top && py <= bottom) return k;
      const dist = py < top ? top - py : py - bottom;
      if (dist < gap) {
        gap = dist;
        nearest = k;
      }
    }
    return nearest;
  }
  /**
   * Bring band `k` forward by dropping every other band's opacity, or clear the
   * effect when `k` is -1.
   *
   * The bands touch edge to edge, so there is no gap for a treatment to live
   * in: anything drawn ON the hovered band either spends half its width on the
   * neighbour (a centred stroke) or falls entirely onto both of them (a drop
   * shadow). Taking the OTHERS down instead is the one move that needs no
   * empty space to work in, and it leaves the hovered band's colour exactly as
   * it was, which matters on a chart where colour is the only thing tying a
   * band to its name.
   *
   * A dimmed band's label is RECOLOURED rather than faded with it. Each label
   * takes black or white by the contrast of the band it sits on at full
   * strength, so fading the band alone leaves a white name on a band that has
   * gone pale — the name does not read as de-emphasised, it reads as broken.
   * Dropped to the chart's own foreColor instead, it stays legible on every
   * faded band while clearly no longer being the one in focus.
   *
   * @param {number} k
   */
  _dim(k) {
    const w = this.w;
    if (k === this._hovered) return;
    this._hovered = k;
    const cfg = this._hoverCfg();
    const dimmed = cfg.opacity == null ? 0.35 : cfg.opacity;
    const bands = w.dom.baseEl.querySelectorAll(".apexcharts-series");
    const labels = w.dom.baseEl.querySelectorAll(
      ".apexcharts-streamgraph-label"
    );
    const focused = (el, index) => k < 0 || index === k;
    for (let i = 0; i < bands.length; i++) {
      const el = (
        /** @type {any} */
        bands[i]
      );
      el.style.transition = "opacity .15s ease";
      el.style.opacity = focused(el, Number(el.getAttribute("data:realIndex"))) ? "" : String(dimmed);
    }
    for (let i = 0; i < labels.length; i++) {
      const el = (
        /** @type {any} */
        labels[i]
      );
      el.style.transition = "opacity .15s ease, fill .15s ease";
      if (focused(el, Number(el.getAttribute("data:realIndex")))) {
        this._restoreLabel(el);
      } else {
        if (!el.getAttribute("data:fill")) {
          el.setAttribute("data:fill", el.getAttribute("fill") || "");
        }
        el.setAttribute("fill", w.config.chart.foreColor);
        el.style.opacity = "0.65";
      }
    }
  }
  /**
   * Give one label its own colour back.
   * @param {any} el
   */
  _restoreLabel(el) {
    const orig = el.getAttribute("data:fill");
    if (orig) el.setAttribute("fill", orig);
    el.style.opacity = "";
  }
  /** Put every band and label back the way it was drawn. */
  clearDim() {
    this._hovered = -1;
    const w = this.w;
    if (!w.dom.baseEl) return;
    const bands = w.dom.baseEl.querySelectorAll(".apexcharts-series");
    for (let i = 0; i < bands.length; i++) {
      const el = (
        /** @type {any} */
        bands[i]
      );
      el.style.opacity = "";
    }
    const labels = w.dom.baseEl.querySelectorAll(
      ".apexcharts-streamgraph-label"
    );
    for (let i = 0; i < labels.length; i++) {
      this._restoreLabel(
        /** @type {any} */
        labels[i]
      );
    }
  }
  /**
   * Labels describe where the bands END UP, so drawn at full opacity while the
   * bands are still growing they sit over the wrong shapes. Held hidden and
   * faded in with the rest of the delayed chrome once the bands land.
   *
   * When there is no animation to wait for, `showDelayedElements` has already
   * run for this render, so registering would leave the layer hidden for good.
   *
   * @param {any} group
   */
  holdUntilBandsLand(group) {
    const w = this.w;
    const animate = Environment.isBrowser() && w.globals.shouldAnimate && !w.globals.animationEnded;
    if (!animate) return;
    group.node.classList.add("apexcharts-element-hidden");
    w.globals.delayedElements.push({ el: group.node, holdUntilComplete: true });
  }
}
const OFFSETS = ["wiggle", "silhouette", "zero", "expand"];
const ORDERS = ["inside-out", "inverse", "none"];
function readDatum(d, j, categories) {
  const fallbackX = categories && categories[j] !== void 0 ? categories[j] : j + 1;
  if (d == null) return { x: fallbackX, y: null, rest: {} };
  if (Array.isArray(d)) {
    return { x: d[0] !== void 0 ? d[0] : fallbackX, y: d[1], rest: {} };
  }
  if (typeof d === "object") {
    return { x: d.x !== void 0 ? d.x : fallbackX, y: d.y, rest: d };
  }
  return { x: fallbackX, y: d, rest: {} };
}
function isPairShaped(data) {
  for (let j = 0; j < data.length; j++) {
    const d = data[j];
    const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
    if (Array.isArray(y) && y.length === 2) return true;
  }
  return false;
}
function joinOnX(raw, categories) {
  var _a;
  const xs = [];
  const rows = [];
  const seen = /* @__PURE__ */ new Map();
  const grids = [];
  for (let k = 0; k < raw.length; k++) {
    const data = Array.isArray((_a = raw[k]) == null ? void 0 : _a.data) ? raw[k].data : [];
    const grid = /* @__PURE__ */ new Map();
    for (let j = 0; j < data.length; j++) {
      const { x, y, rest } = readDatum(data[j], j, categories);
      const key = x instanceof Date ? x.getTime() : x;
      if (!seen.has(key)) {
        seen.set(key, xs.length);
        xs.push(x);
        rows.push(__spreadValues({}, rest));
      }
      grid.set(
        /** @type {number} */
        seen.get(key),
        Utils.parseNumber(y)
      );
    }
    grids.push(grid);
  }
  return { xs, rows, grids };
}
function sortColumns(xs) {
  const idx = [];
  for (let j = 0; j < xs.length; j++) {
    const x = xs[j] instanceof Date ? xs[j].getTime() : xs[j];
    if (typeof x !== "number" || !isFinite(x)) return null;
    idx.push(j);
  }
  const keyed = idx.map((j) => ({
    j,
    v: xs[j] instanceof Date ? xs[j].getTime() : xs[j]
  }));
  keyed.sort((a, b) => a.v - b.v);
  const perm = keyed.map((e) => e.j);
  for (let j = 0; j < perm.length; j++) {
    if (perm[j] !== j) return perm;
  }
  return null;
}
function orderBands(mode, visible, values) {
  if (mode === "none") return visible.slice();
  if (mode === "inverse") return visible.slice().reverse();
  const sums = {};
  const peaks = {};
  for (let i = 0; i < visible.length; i++) {
    const k = visible[i];
    const v = values[k];
    let sum = 0;
    let best = -Infinity;
    let bestJ = 0;
    for (let j = 0; j < v.length; j++) {
      sum += v[j];
      if (v[j] > best) {
        best = v[j];
        bestJ = j;
      }
    }
    sums[k] = sum;
    peaks[k] = bestJ;
  }
  const byPeak = visible.slice().sort((a, b) => peaks[a] - peaks[b] || a - b);
  let top = 0;
  let bottom = 0;
  const tops = [];
  const bottoms = [];
  for (let i = 0; i < byPeak.length; i++) {
    const k = byPeak[i];
    if (top < bottom) {
      top += sums[k];
      tops.push(k);
    } else {
      bottom += sums[k];
      bottoms.push(k);
    }
  }
  return bottoms.reverse().concat(tops);
}
function baselineFor(mode, order, stack, m) {
  const base = new Array(m).fill(0);
  if (m === 0 || order.length === 0) return base;
  if (mode === "zero" || mode === "expand") return base;
  if (mode === "silhouette") {
    for (let j = 0; j < m; j++) {
      let total = 0;
      for (let i = 0; i < order.length; i++) total += stack[order[i]][j];
      base[j] = -total / 2;
    }
    return base;
  }
  let y = 0;
  for (let j = 1; j < m; j++) {
    let s1 = 0;
    let s2 = 0;
    for (let i = 0; i < order.length; i++) {
      const vi = stack[order[i]];
      const now = vi[j];
      let moved = (now - vi[j - 1]) / 2;
      for (let k = 0; k < i; k++) {
        const vk = stack[order[k]];
        moved += vk[j] - vk[j - 1];
      }
      s1 += now;
      s2 += moved * now;
    }
    if (s1) y -= s2 / s1;
    base[j] = y;
  }
  return base;
}
function streamgraphTransform(ser, w) {
  var _a, _b;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.streamgraphRawSeries) {
    gl.streamgraphRawSeries = ser.map((s) => __spreadProps(__spreadValues({}, s), {
      data: Array.isArray(s == null ? void 0 : s.data) ? s.data.slice() : s == null ? void 0 : s.data
    }));
  }
  const raw = gl.streamgraphRawSeries;
  if (raw.some(
    (s) => isPairShaped(Array.isArray(s == null ? void 0 : s.data) ? s.data : [])
  )) {
    w.streamgraphData = null;
    return ser;
  }
  const opts = ((_a = cnf.plotOptions) == null ? void 0 : _a.streamgraph) || {};
  const offset = OFFSETS.indexOf(opts.offset) !== -1 ? opts.offset : "wiggle";
  const order = ORDERS.indexOf(opts.order) !== -1 ? opts.order : "inside-out";
  const categories = (_b = cnf.xaxis) == null ? void 0 : _b.categories;
  const collapsed = gl.collapsedSeriesIndices || [];
  const { xs, rows, grids } = joinOnX(raw, categories);
  const perm = sortColumns(xs);
  const columns = perm ? perm.map((j) => xs[j]) : xs;
  const columnRows = perm ? perm.map((j) => rows[j]) : rows;
  const m = columns.length;
  let sawNegative = false;
  const values = [];
  for (let k = 0; k < raw.length; k++) {
    const row = new Array(m);
    for (let j = 0; j < m; j++) {
      const src = grids[k].get(perm ? perm[j] : j);
      let v = src === void 0 || src === null ? 0 : Number(src);
      if (!isFinite(v)) v = 0;
      if (v < 0) {
        sawNegative = true;
        v = 0;
      }
      row[j] = v;
    }
    values.push(row);
  }
  if (sawNegative && !gl.streamgraphWarnedNegative) {
    gl.streamgraphWarnedNegative = true;
    console.warn(
      'ApexCharts: a streamgraph stacks parts of a whole, so negative values have no band to draw and were treated as 0. Use a stacked area (chart.type: "area", chart.stacked: true) for data that goes below zero.'
    );
  }
  const visible = [];
  for (let k = 0; k < raw.length; k++) {
    if (collapsed.indexOf(k) === -1) visible.push(k);
  }
  let stack = values;
  if (offset === "expand") {
    stack = values.map((row) => row.slice());
    for (let j = 0; j < m; j++) {
      let total = 0;
      for (let i = 0; i < visible.length; i++) total += stack[visible[i]][j];
      if (total) {
        for (let i = 0; i < visible.length; i++) stack[visible[i]][j] /= total;
      }
    }
  }
  const bandOrder = orderBands(order, visible, stack);
  const base = baselineFor(offset, bandOrder, stack, m);
  const lows = raw.map(() => null);
  const highs = raw.map(() => null);
  for (let i = 0; i < bandOrder.length; i++) {
    lows[bandOrder[i]] = new Array(m);
    highs[bandOrder[i]] = new Array(m);
  }
  for (let j = 0; j < m; j++) {
    let acc = base[j];
    for (let i = 0; i < bandOrder.length; i++) {
      const k = bandOrder[i];
      const bandLo = (
        /** @type {number[]} */
        lows[k]
      );
      const bandHi = (
        /** @type {number[]} */
        highs[k]
      );
      bandLo[j] = acc;
      acc += stack[k][j];
      bandHi[j] = acc;
    }
  }
  w.streamgraphData = {
    names: raw.map(
      (s, k) => {
        var _a2;
        return (_a2 = s == null ? void 0 : s.name) != null ? _a2 : `Series ${k + 1}`;
      }
    ),
    xs: columns,
    values,
    lows,
    highs,
    order: bandOrder,
    offset,
    hidden: raw.map((_, k) => k).filter((k) => collapsed.indexOf(k) !== -1)
  };
  return raw.map((s, k) => {
    const lo = lows[k];
    const hi = highs[k];
    if (!lo || !hi) return __spreadProps(__spreadValues({}, s), { data: [] });
    const data = new Array(m);
    for (let j = 0; j < m; j++) {
      data[j] = __spreadProps(__spreadValues({}, columnRows[j]), { x: columns[j], y: [lo[j], hi[j]] });
    }
    return __spreadProps(__spreadValues({}, s), { data });
  });
}
const TRANSFORM_KEY = "__apexcharts_series_transforms__";
if (!/** @type {any} */
globalThis[TRANSFORM_KEY]) {
  globalThis[TRANSFORM_KEY] = {};
}
function getTransforms() {
  return (
    /** @type {any} */
    globalThis[TRANSFORM_KEY]
  );
}
function registerSeriesTransform(name, fn) {
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerSeriesTransform("${name}") expects a function (series, w) => series.`
    );
    return;
  }
  getTransforms()[name] = fn;
}
registerSeriesTransform("streamgraph", streamgraphTransform);
_core__default.registerFeatures({ streamgraph: StreamLabels });
export {
  default2 as default,
  streamgraphTransform
};
