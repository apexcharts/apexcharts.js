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
 * ApexCharts v8.4.0
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
   * The plot area on screen, in client px: its corner is where the plot's
   * group is translated to (translateX, translateY into the svg), and it is
   * gridWidth by gridHeight. The one screen-to-plot measurement: the tooltip,
   * zoom, selection and every other pointer reader map through it, so x and y
   * cannot disagree under CSS zoom.
   *
   * Never the `.apexcharts-grid` group's box: a group measures to the union
   * of what it happens to draw (fact 2 above). The plot's outline starts a
   * pixel down (`Grid.drawGridArea`), so unless gridlines or row bands reach
   * the top edge the box starts a pixel below the plot, and on a numeric-x bar
   * chart the horizontal gridlines run `barPadForNumericAxis` out past both
   * sides.
   *
   * `zoom` is the CSS zoom of any container the chart sits in (screen px per
   * plot px): the measured svg width over `svgWidth`, the unscaled width it
   * was drawn at. A distance measured on screen from this corner is divided
   * by it to land in plot px, the space the series are laid out and painted in.
   * With nothing mounted to measure, screen px are taken as svg px.
   *
   * @param {import('../types/internal').ChartStateW} w
   * @returns {{ left: number, top: number, width: number, height: number, zoom: number }}
   */
  static plotRect(w) {
    var _a, _b, _c;
    const svg = ((_a = w.dom.Paper) == null ? void 0 : _a.node) || ((_b = w.dom.baseEl) == null ? void 0 : _b.querySelector(".apexcharts-svg"));
    const box = ((_c = svg || w.dom.elWrap) == null ? void 0 : _c.getBoundingClientRect()) || {
      left: 0,
      top: 0,
      width: 0
    };
    const zoom = (svg && w.globals.svgWidth ? box.width / w.globals.svgWidth : 1) || 1;
    return {
      left: box.left + w.layout.translateX * zoom,
      top: box.top + w.layout.translateY * zoom,
      width: w.layout.gridWidth * zoom,
      height: w.layout.gridHeight * zoom,
      zoom
    };
  }
  /**
   * Client (screen) x -> pixels from the plot origin of {@link plotRect}.
   * Pass the rect when the caller has already measured it.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} screenX
   * @param {{ left: number, zoom: number }} [plot]
   * @returns {number}
   */
  static screenXToPlotPx(w, screenX, plot = AxisMapping.plotRect(w)) {
    return (screenX - plot.left) / plot.zoom;
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
        fontFamily,
        fontWeight
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
   * Both axes go through `AxisMapping.plotRect`, measured once per move, so a
   * chart inside a CSS-zoomed container hit-tests where it looks.
   *
   * @param {MouseEvent} e
   * @returns {number}
   */
  _bandAt(e) {
    const w = this.w;
    const d = w.streamgraphData;
    if (!d || !d.order.length) return -1;
    const plot = AxisMapping.plotRect(w);
    const px = AxisMapping.screenXToPlotPx(w, e.clientX, plot);
    const py = (e.clientY - plot.top) / plot.zoom;
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
    return j < 0 ? -1 : this.bandAt(py, j);
  }
  /**
   * The band at client y in column `j`, for the default tooltip, which has
   * the column already and must name the same band the hover dims.
   *
   * @param {number} clientY
   * @param {number} j
   * @returns {number} the band, or -1
   */
  bandAtClientY(clientY, j) {
    const plot = AxisMapping.plotRect(this.w);
    return this.bandAt((clientY - plot.top) / plot.zoom, j);
  }
  /**
   * The band containing plot y `py` in column `j`, else the nearest one, or
   * -1 when there is nothing to hit. The one band hit-test: the hover dim and
   * the default tooltip both resolve through it, so they cannot disagree.
   *
   * A wiggle baseline leaves plot background above and below the surface, and
   * the tooltip (intersect: false) still names the nearest band when the
   * cursor is out there. So does this, or the tooltip would name a band with
   * nothing on the chart pointing at it.
   *
   * @param {number} py
   * @param {number} j
   * @returns {number}
   */
  bandAt(py, j) {
    const gl = this.w.globals;
    const d = this.w.streamgraphData;
    const span = gl.maxY - gl.minY;
    if (!d || !Array.isArray(d.order) || !span || !isFinite(span)) return -1;
    let nearest = -1;
    let gap = Infinity;
    for (let i = 0; i < d.order.length; i++) {
      const k = d.order[i];
      const hi = d.highs[k] && d.highs[k][j];
      const lo = d.lows[k] && d.lows[k][j];
      if (lo == null || hi == null) continue;
      const a = this._yPx(hi);
      const b = this._yPx(lo);
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
function collapsedIndices(gl) {
  return (gl.collapsedSeriesIndices || []).concat(
    gl.ancillaryCollapsedSeriesIndices || []
  );
}
function stashSeries(ser, gl) {
  const records = (gl.collapsedSeries || []).concat(
    gl.ancillaryCollapsedSeries || []
  );
  return ser.map((s, i) => {
    const _a = s || {}, { hidden: _hidden } = _a, rest = __objRest(_a, ["hidden"]);
    let data = rest.data;
    if (Array.isArray(data) && !data.length) {
      const rec = records.find((r) => r.index === i);
      if (rec && Array.isArray(rec.data)) data = rec.data;
    }
    return __spreadProps(__spreadValues({}, rest), { data: Array.isArray(data) ? data.slice() : data });
  });
}
const DateTime = _core.__apex_DateTime;
function xKey(x, datetime) {
  if (x instanceof Date) return x.getTime();
  if (datetime && typeof x === "string") {
    const t = DateTime.prototype.parseDate(x);
    if (!isNaN(t)) return t;
  }
  return x;
}
function withX(data, categories) {
  return data.map(
    (d, j) => d !== null && typeof d === "object" ? d : {
      x: categories && categories[j] !== void 0 ? categories[j] : j + 1,
      y: d
    }
  );
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
function joinOnX(raw, categories, datetime, band) {
  var _a;
  const xs = [];
  const keys = [];
  const rows = [];
  const seen = /* @__PURE__ */ new Map();
  const grids = [];
  for (let k = 0; k < raw.length; k++) {
    const data = band[k] && Array.isArray((_a = raw[k]) == null ? void 0 : _a.data) ? raw[k].data : [];
    const grid = /* @__PURE__ */ new Map();
    for (let j = 0; j < data.length; j++) {
      const { x, y, rest } = readDatum(data[j], j, categories);
      const key = xKey(x, datetime);
      if (!seen.has(key)) {
        seen.set(key, xs.length);
        xs.push(x);
        keys.push(key);
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
  return { xs, keys, rows, grids };
}
function sortColumns(keys) {
  const perm = [];
  for (let j = 0; j < keys.length; j++) {
    if (typeof keys[j] !== "number" || !isFinite(keys[j])) return null;
    perm.push(j);
  }
  perm.sort((a, b) => keys[a] - keys[b]);
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
    let below = 0;
    for (let i = 0; i < order.length; i++) {
      const vi = stack[order[i]];
      const now = vi[j];
      const diff = now - vi[j - 1];
      s1 += now;
      s2 += (diff / 2 + below) * now;
      below += diff;
    }
    if (s1) y -= s2 / s1;
    base[j] = y;
  }
  return base;
}
function streamgraphTransform(ser, w) {
  var _a, _b, _c, _d;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.streamgraphRawSeries) {
    gl.streamgraphRawSeries = stashSeries(ser, gl);
  }
  const raw = gl.streamgraphRawSeries;
  const band = raw.map(
    (s) => !(s == null ? void 0 : s.type) || s.type === "streamgraph" || s.type === "rangeArea"
  );
  if (raw.some(
    (s, k) => band[k] && isPairShaped(Array.isArray(s == null ? void 0 : s.data) ? s.data : [])
  )) {
    w.streamgraphData = null;
    return ser;
  }
  const opts = ((_a = cnf.plotOptions) == null ? void 0 : _a.streamgraph) || {};
  const offset = OFFSETS.indexOf(opts.offset) !== -1 ? opts.offset : "wiggle";
  const order = ORDERS.indexOf(opts.order) !== -1 ? opts.order : "inside-out";
  const categories = (_b = cnf.xaxis) == null ? void 0 : _b.categories;
  const collapsed = collapsedIndices(gl);
  const datetime = ((_c = cnf.xaxis) == null ? void 0 : _c.type) === "datetime";
  const { xs, keys, rows, grids } = joinOnX(raw, categories, datetime, band);
  const perm = sortColumns(keys);
  const columns = perm ? perm.map((j) => xs[j]) : xs;
  const columnRows = perm ? perm.map((j) => rows[j]) : rows;
  const m = columns.length;
  const lines = [];
  let colOf;
  let sawNegative = false;
  const values = [];
  for (let k = 0; k < raw.length; k++) {
    const row = new Array(m);
    if (!band[k]) {
      row.fill(null);
      if (collapsed.indexOf(k) === -1) lines.push(k);
      if (!colOf) {
        colOf = /* @__PURE__ */ new Map();
        for (let j = 0; j < m; j++) colOf.set(keys[perm ? perm[j] : j], j);
      }
      const data = Array.isArray((_d = raw[k]) == null ? void 0 : _d.data) ? raw[k].data : [];
      for (let j = 0; j < data.length; j++) {
        const { x, y } = readDatum(data[j], j, categories);
        const c = colOf.get(xKey(x, datetime));
        if (c !== void 0) row[c] = Utils.parseNumber(y);
      }
      values.push(row);
      continue;
    }
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
    if (band[k] && collapsed.indexOf(k) === -1) visible.push(k);
  }
  let stack = (
    /** @type {number[][]} */
    values
  );
  if (offset === "expand") {
    stack = stack.map((row) => row.slice());
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
    lines,
    offset,
    hidden: raw.map((_, k) => k).filter((k) => collapsed.indexOf(k) !== -1)
  };
  return raw.map((s, k) => {
    if (!band[k]) {
      if (collapsed.indexOf(k) !== -1) return __spreadProps(__spreadValues({}, s), { data: [] });
      return Array.isArray(s == null ? void 0 : s.data) ? __spreadProps(__spreadValues({}, s), { data: withX(s.data, categories) }) : s;
    }
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
const CoreUtils = _core.__apex_CoreUtils;
const Fill = _core.__apex_Fill;
const DataLabels = _core.__apex_DataLabels;
const Markers = _core.__apex_Markers;
const Scatter = _core.__apex_charts_Scatter;
const Series = _core.__apex_Series;
const indexes = /* @__PURE__ */ new WeakMap();
function prevRecords(w, realIndex) {
  const all = w.globals.previousPaths;
  let idx = indexes.get(all);
  if (!idx || idx.n !== all.length) {
    idx = { n: all.length, m: /* @__PURE__ */ new Map() };
    for (const gpp of all) {
      const k = parseInt((gpp || {}).realIndex, 10);
      if (k === k) {
        const list = idx.m.get(k);
        if (list) list.push(gpp);
        else idx.m.set(k, [gpp]);
      }
    }
    indexes.set(all, idx);
  }
  return idx.m.get(parseInt(String(realIndex), 10)) || [];
}
class Helpers {
  /**
   * @param {import('../../../charts/Line').default} lineCtx
   */
  constructor(lineCtx) {
    this.w = lineCtx.w;
    this.lineCtx = lineCtx;
  }
  /**
   * @param {number} i index into `series`, the rows this draw call renders
   * @param {any[]} series
   * @param {number} realIndex index into the config / fill options
   */
  sameValueSeriesFix(i, series, realIndex) {
    const w = this.w;
    const s = series[i];
    if ((w.config.fill.type === "gradient" || w.config.fill.type[realIndex] === "gradient") && s.every((v) => v === s[0])) {
      series[i] = s.slice();
      series[i][s.length - 1] += 1e-6;
    }
    return series;
  }
  /** @param {{series: any, realIndex: any, x: any, y: any, i: any, j: any, prevY: any}} opts */
  calculatePoints({ series, realIndex, x, y, i, j, prevY }) {
    const w = this.w;
    const ptX = [];
    const ptY = [];
    let xPT1st = this.lineCtx.categoryAxisCorrection + w.config.markers.offsetX;
    if (w.axisFlags.isXNumeric) {
      xPT1st = (w.seriesData.seriesX[realIndex][0] - w.globals.minX) / this.lineCtx.xRatio + w.config.markers.offsetX;
    }
    if (j === 0) {
      ptX.push(xPT1st);
      ptY.push(
        Utils.isNumber(series[i][0]) ? prevY + w.config.markers.offsetY : null
      );
    }
    ptX.push(x + w.config.markers.offsetX);
    ptY.push(
      Utils.isNumber(series[i][j + 1]) ? y + w.config.markers.offsetY : null
    );
    return {
      x: ptX,
      y: ptY
    };
  }
  /** @param {{pathFromLine: any, pathFromArea: any, realIndex: any}} opts */
  checkPreviousPaths({ pathFromLine, pathFromArea, realIndex }) {
    const w = this.w;
    for (const gpp of prevRecords(w, realIndex)) {
      if ((gpp.type === "line" || gpp.type === "area") && gpp.paths.length > 0) {
        if (gpp.type === "line") {
          this.lineCtx.appendPathFrom = false;
          pathFromLine = gpp.paths[0].d;
        } else if (gpp.type === "area") {
          this.lineCtx.appendPathFrom = false;
          pathFromArea = gpp.paths[0].d;
          if (w.config.stroke.show && gpp.paths[1]) {
            pathFromLine = gpp.paths[1].d;
          }
        }
      }
    }
    return {
      pathFromLine,
      pathFromArea
    };
  }
  /**
   * The range-area band this series drew last render, or null.
   *
   * checkPreviousPaths only knows line and area, so a range area never found
   * its previous shape: every update, a legend toggle included, started all of
   * its bands from the baseline and re-grew them. A range area draws its band
   * as one closed path from two halves (Line.draw joins the lower and upper
   * pathFrom), so this returns the whole captured band to morph from, in place
   * of that join. Only a single-path band qualifies: a null splits it into one
   * path per segment, and those keep the baseline entry.
   * @param {number} realIndex
   * @returns {string | null}
   */
  previousRangeAreaPath(realIndex) {
    for (const gpp of prevRecords(this.w, realIndex)) {
      if (gpp.type === "rangeArea" && gpp.paths.length === 1 && gpp.paths[0].d) {
        return gpp.paths[0].d;
      }
    }
    return null;
  }
  /** @param {{i: any, realIndex: any, series: any, prevY: any, lineYPosition: any, translationsIndex: any}} opts */
  determineFirstPrevY({
    i,
    realIndex,
    series,
    prevY,
    lineYPosition,
    translationsIndex
  }) {
    var _a, _b, _c;
    const w = this.w;
    const stackSeries = w.config.chart.stacked && !w.globals.comboCharts || w.config.chart.stacked && w.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || /** @type {any} */
    ((_a = this.w.config.series[realIndex]) == null ? void 0 : _a.type) === "bar" || /** @type {any} */
    ((_b = this.w.config.series[realIndex]) == null ? void 0 : _b.type) === "column");
    if (typeof ((_c = series[i]) == null ? void 0 : _c[0]) !== "undefined") {
      if (stackSeries) {
        if (i > 0) {
          const top = this.lineCtx.stackTopAt(realIndex, 0);
          lineYPosition = top === void 0 ? this.lineCtx.zeroY : top;
        } else {
          lineYPosition = this.lineCtx.zeroY;
        }
      } else {
        lineYPosition = this.lineCtx.zeroY;
      }
      prevY = lineYPosition - series[i][0] / this.lineCtx.yRatio[translationsIndex] + (this.lineCtx.isReversed ? series[i][0] / this.lineCtx.yRatio[translationsIndex] : 0) * 2;
    } else {
      if (stackSeries && i > 0 && typeof series[i][0] === "undefined") {
        for (let s = i - 1; s >= 0; s--) {
          if (series[s][0] !== null && typeof series[s][0] !== "undefined") {
            lineYPosition = this.lineCtx.prevSeriesY[s][0];
            prevY = lineYPosition;
            break;
          }
        }
      }
    }
    return {
      prevY,
      lineYPosition
    };
  }
}
function hash01(n) {
  let h = (n ^ 2654435769) >>> 0;
  h = Math.imul(h ^ h >>> 16, 73244475);
  h = Math.imul(h ^ h >>> 16, 73244475);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
const tangents = (points) => {
  const m = finiteDifferences(points);
  const n = points.length - 1;
  const ε = 1e-6;
  const tgts = [];
  let a, b, d, s;
  for (let i = 0; i < n; i++) {
    d = slope(points[i], points[i + 1]);
    if (Math.abs(d) < ε) {
      m[i] = m[i + 1] = 0;
    } else {
      a = m[i] / d;
      b = m[i + 1] / d;
      s = a * a + b * b;
      if (s > 9) {
        s = d * 3 / Math.sqrt(s);
        m[i] = s * a;
        m[i + 1] = s * b;
      }
    }
  }
  for (let i = 0; i <= n; i++) {
    s = (points[Math.min(n, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
    tgts.push([s || 0, m[i] * s || 0]);
  }
  return tgts;
};
const svgPath = (points) => {
  let p = "";
  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const n = point.length;
    if (n > 4) {
      p += `C${point[0]}, ${point[1]}`;
      p += `, ${point[2]}, ${point[3]}`;
      p += `, ${point[4]}, ${point[5]}`;
    } else if (n > 2) {
      p += `S${point[0]}, ${point[1]}`;
      p += `, ${point[2]}, ${point[3]}`;
    }
  }
  return p;
};
const spline = {
  /**
   * Convert 'points' to bezier
   * @param {any[]} points
   * @returns {any[]}
   */
  points(points) {
    const tgts = tangents(points);
    const p = points[1];
    const p0 = points[0];
    const pts = [];
    const t = tgts[1];
    const t0 = tgts[0];
    pts.push(p0, [
      p0[0] + t0[0],
      p0[1] + t0[1],
      p[0] - t[0],
      p[1] - t[1],
      p[0],
      p[1]
    ]);
    for (let i = 2, n = tgts.length; i < n; i++) {
      const p2 = points[i];
      const t2 = tgts[i];
      pts.push([p2[0] - t2[0], p2[1] - t2[1], p2[0], p2[1]]);
    }
    return pts;
  },
  /**
   * Slice out a segment of 'points'
   * @param {any[]} points
   * @param {Number} start
   * @param {Number} end
   * @returns {any[]}
   */
  slice(points, start, end) {
    const pts = points.slice(start, end);
    if (start) {
      if (end - start > 1 && pts[1].length < 6) {
        const n = pts[0].length;
        pts[1] = [
          pts[0][n - 2] * 2 - pts[0][n - 4],
          pts[0][n - 1] * 2 - pts[0][n - 3]
        ].concat(pts[1]);
      }
      pts[0] = pts[0].slice(-2);
    }
    return pts;
  }
};
function slope(p0, p1) {
  return (p1[1] - p0[1]) / (p1[0] - p0[0]);
}
function finiteDifferences(points) {
  const m = [];
  let p0 = points[0];
  let p1 = points[1];
  let d = m[0] = slope(p0, p1);
  let i = 1;
  for (let n = points.length - 1; i < n; i++) {
    p0 = p1;
    p1 = points[i + 1];
    m[i] = (d + (d = slope(p0, p1))) * 0.5;
  }
  m[i] = d;
  return m;
}
function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer;
  return r && r.kind && r.kind !== "svg" ? r : graphics;
}
function detectStreamScroll(w, realIndex, newXPixels, newYPixels) {
  var _a;
  const gl = w.globals;
  const frame = gl.prevStreamFrame;
  if (!frame || !gl.dataChanged || !((_a = w.axisFlags) == null ? void 0 : _a.isXNumeric)) return null;
  const oldX = frame.seriesX[realIndex];
  const oldY = frame.seriesY[realIndex];
  const newX = w.seriesData.seriesX[realIndex];
  const newY = w.seriesData.series[realIndex];
  if (!oldX || !oldY || !newX || !newY) return null;
  if (oldX.length < 3 || newX.length < 3) return null;
  let k = -1;
  for (let i = 0; i < oldX.length; i++) {
    if (oldX[i] === newX[0]) {
      k = i;
      break;
    }
  }
  if (k === -1) return null;
  const overlap = Math.min(oldX.length - k, newX.length);
  if (overlap < 2) return null;
  const appended = newX.length - overlap;
  if (k === 0 && appended === 0) return null;
  for (let i = 0; i < overlap; i++) {
    if (oldX[k + i] !== newX[i]) return null;
    const oy = oldY[k + i];
    const ny = newY[i];
    if (oy !== ny && !(oy == null && ny == null)) return null;
  }
  const oldXP = frame.xPixels[realIndex];
  const oldYP = frame.yPixels[realIndex];
  if (!oldXP || !oldYP) return null;
  let a = -1;
  let b = -1;
  for (let i = 0; i < overlap; i++) {
    if (oldXP[k + i] == null || oldYP[k + i] == null || newXPixels[i] == null || newYPixels[i] == null) {
      continue;
    }
    if (a === -1) a = i;
    b = i;
  }
  if (a === -1 || b <= a) return null;
  const nxA = (
    /** @type {number} */
    newXPixels[a]
  );
  const nxB = (
    /** @type {number} */
    newXPixels[b]
  );
  const oxA = (
    /** @type {number} */
    oldXP[k + a]
  );
  const oxB = (
    /** @type {number} */
    oldXP[k + b]
  );
  if (Math.abs(nxB - nxA) < 1e-6) return null;
  const ax = (oxB - oxA) / (nxB - nxA);
  const bx = oxA - ax * nxA;
  if (!isFinite(ax) || !isFinite(bx)) return null;
  if (Math.abs(ax - 1) > 0.02) return null;
  if (Math.abs(bx) < 0.5) return null;
  let yLo = a;
  let yHi = a;
  for (let i = a; i <= b; i++) {
    const ny = newYPixels[i];
    if (ny == null || oldYP[k + i] == null) continue;
    if (ny < /** @type {number} */
    newYPixels[yLo]) yLo = i;
    if (ny > /** @type {number} */
    newYPixels[yHi]) yHi = i;
  }
  let ay = 1;
  let by = 0;
  const nyLo = (
    /** @type {number} */
    newYPixels[yLo]
  );
  const nyHi = (
    /** @type {number} */
    newYPixels[yHi]
  );
  if (Math.abs(nyHi - nyLo) > 1e-6) {
    ay = /** @type {number} */
    (oldYP[k + yHi] - /** @type {number} */
    oldYP[k + yLo]) / (nyHi - nyLo);
    by = /** @type {number} */
    oldYP[k + yLo] - ay * nyLo;
  } else {
    by = /** @type {number} */
    oldYP[k + yLo] - nyLo;
  }
  if (!isFinite(ay) || !isFinite(by) || ay < 0.2 || ay > 5) return null;
  const m = Math.floor((a + b) / 2);
  if (m !== a && m !== b && newXPixels[m] != null && oldXP[k + m] != null) {
    const predX = ax * /** @type {number} */
    newXPixels[m] + bx;
    if (Math.abs(predX - /** @type {number} */
    oldXP[k + m]) > 1.5) {
      return null;
    }
    if (newYPixels[m] != null && oldYP[k + m] != null) {
      const predY = ay * /** @type {number} */
      newYPixels[m] + by;
      if (Math.abs(predY - /** @type {number} */
      oldYP[k + m]) > 1.5) {
        return null;
      }
    }
  }
  gl.streamScrolled = true;
  return { ax, bx, ay, by };
}
const NUM_RE = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
function projectPathToPrevFrame(d, t) {
  const { ax, bx, ay, by } = t;
  const out = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])([^MmLlHhVvCcSsQqTtAaZz]*)/g;
  let match;
  while ((match = re.exec(d)) !== null) {
    const cmd = match[1].toUpperCase();
    const nums = (match[2].match(NUM_RE) || []).map(parseFloat);
    if (cmd === "Z") {
      out.push("z");
      continue;
    }
    if (cmd === "H") {
      for (const x of nums) out.push(`H ${ax * x + bx}`);
      continue;
    }
    if (cmd === "V") {
      for (const y of nums) out.push(`V ${ay * y + by}`);
      continue;
    }
    if (cmd === "A") {
      for (let i = 0; i + 6 < nums.length; i += 7) {
        out.push(
          `A ${nums[i]} ${nums[i + 1]} ${nums[i + 2]} ${nums[i + 3]} ${nums[i + 4]} ${ax * nums[i + 5] + bx} ${ay * nums[i + 6] + by}`
        );
      }
      continue;
    }
    const coords = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      coords.push(`${ax * nums[i] + bx} ${ay * nums[i + 1] + by}`);
    }
    if (coords.length) out.push(`${cmd} ${coords.join(" ")}`);
  }
  return out.join(" ");
}
const Animations = _core.__apex_Animations;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const resolveEasing = _core.__apex_Easing_resolveEasing;
const parsePath = _core.__apex_PathMorphing_parsePath;
const arrayToPath = _core.__apex_PathMorphing_arrayToPath;
function buildUnionEntries(join, oldN) {
  const exitSet = new Set(join.exits);
  const entries = [];
  let oi = 0;
  for (let nj = 0; nj < join.toOld.length; nj++) {
    const oj = join.toOld[nj];
    if (oj !== -1) {
      while (oi < oj) {
        if (exitSet.has(oi)) entries.push({ oldJ: oi, newJ: -1 });
        oi++;
      }
      entries.push({ oldJ: oj, newJ: nj });
      oi = oj + 1;
    } else {
      entries.push({ oldJ: -1, newJ: nj });
    }
  }
  while (oi < oldN) {
    if (exitSet.has(oi)) entries.push({ oldJ: oi, newJ: -1 });
    oi++;
  }
  return entries;
}
function analyzeSeriesPath(d, expectedAnchors, isArea) {
  if (!d || typeof d !== "string") return null;
  const cmds = parsePath(d);
  if (!cmds.length || cmds[0][0] !== "M") return null;
  for (let i = 1; i < cmds.length; i++) {
    if (cmds[i][0] === "M") return null;
  }
  let body = cmds;
  let closing = null;
  if (isArea) {
    if (cmds.length < 5) return null;
    closing = cmds.slice(-3);
    body = cmds.slice(0, -3);
    if (closing[2][0] !== "Z") return null;
    if (closing[1][0] !== "L") return null;
    if (closing[0][0] !== "L" && closing[0][0] !== "C") return null;
  } else if (cmds[cmds.length - 1][0] === "Z") {
    return null;
  }
  if (body.length !== expectedAnchors || body.length < 2) return null;
  const segType = body[1][0];
  if (segType !== "L" && segType !== "C") return null;
  for (let i = 2; i < body.length; i++) {
    if (body[i][0] !== segType) return null;
  }
  const anchors = body.map(
    (c) => c[0] === "C" ? [Number(c[5]), Number(c[6])] : [Number(c[1]), Number(c[2])]
  );
  for (const a of anchors) {
    if (!isFinite(a[0]) || !isFinite(a[1])) return null;
  }
  return { body, closing, segType, anchors };
}
function lerpPt(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function splitCubic(s, cmd, t) {
  const p0 = s;
  const p1 = [cmd[1], cmd[2]];
  const p2 = [cmd[3], cmd[4]];
  const p3 = [cmd[5], cmd[6]];
  const p01 = lerpPt(p0, p1, t);
  const p12 = lerpPt(p1, p2, t);
  const p23 = lerpPt(p2, p3, t);
  const p012 = lerpPt(p01, p12, t);
  const p123 = lerpPt(p12, p23, t);
  const mid = lerpPt(p012, p123, t);
  return {
    first: ["C", p01[0], p01[1], p012[0], p012[1], mid[0], mid[1]],
    second: ["C", p123[0], p123[1], p23[0], p23[1], p3[0], p3[1]],
    mid
  };
}
function splitLine(s, cmd, t) {
  const e = [cmd[1], cmd[2]];
  const mid = lerpPt(s, e, t);
  return {
    first: ["L", mid[0], mid[1]],
    second: ["L", e[0], e[1]],
    mid
  };
}
function expandPath(analysis, ownIdx) {
  const { body, closing, segType, anchors } = analysis;
  const n = anchors.length;
  const m = ownIdx.length;
  const degen = (p) => segType === "C" ? ["C", p[0], p[1], p[0], p[1], p[0], p[1]] : ["L", p[0], p[1]];
  const out = [["M", anchors[0][0], anchors[0][1]]];
  let firstOwn = 0;
  while (firstOwn < m && ownIdx[firstOwn] !== 0) firstOwn++;
  for (let q = 1; q <= firstOwn; q++) out.push(degen(anchors[0]));
  let entry = firstOwn + 1;
  for (let s = 0; s < n - 1; s++) {
    let interior = 0;
    while (entry + interior < m && ownIdx[entry + interior] === -1) interior++;
    const cmd = body[s + 1];
    if (!interior) {
      out.push(cmd.slice());
    } else {
      const totalParts = interior + 1;
      let start = anchors[s];
      let rest = cmd;
      for (let q = 0; q < interior; q++) {
        const t = 1 / (totalParts - q);
        const sp = segType === "C" ? splitCubic(start, rest, t) : splitLine(start, rest, t);
        out.push(sp.first);
        start = sp.mid;
        rest = sp.second;
      }
      out.push(rest);
    }
    entry += interior + 1;
  }
  while (entry < m) {
    out.push(degen(anchors[n - 1]));
    entry++;
  }
  if (closing) closing.forEach((c) => out.push(c.slice()));
  return out;
}
function reconcilePathPair(fromD, toD, entries, oldN, newN, isArea) {
  const fromAnalysis = analyzeSeriesPath(fromD, oldN, isArea);
  if (!fromAnalysis) return null;
  const toAnalysis = analyzeSeriesPath(toD, newN, isArea);
  if (!toAnalysis) return null;
  if (fromAnalysis.segType !== toAnalysis.segType) return null;
  if ((fromAnalysis.closing || toAnalysis.closing) && (!fromAnalysis.closing || !toAnalysis.closing || fromAnalysis.closing[0][0] !== toAnalysis.closing[0][0])) {
    return null;
  }
  const fromOwn = entries.map((e) => e.oldJ);
  const toOwn = entries.map((e) => e.newJ);
  return {
    from: arrayToPath(expandPath(fromAnalysis, fromOwn)),
    toInterp: arrayToPath(expandPath(toAnalysis, toOwn))
  };
}
function lengthTransitionEnabled(w) {
  var _a;
  const anim = w.config.chart.animations;
  if (!anim || anim.enabled === false) return false;
  if (!anim.dynamicAnimation || anim.dynamicAnimation.enabled === false) {
    return false;
  }
  const largeThreshold = (_a = anim.largeDatasetThreshold) != null ? _a : 0;
  if (largeThreshold > 0 && w.globals.dataPoints > largeThreshold) return false;
  return !!(Environment.isBrowser() && w.globals.dataChanged && w.globals.shouldAnimate);
}
function datumKey(w, realIndex, j) {
  var _a, _b;
  return keyOf(
    (_a = w.axisFlags) == null ? void 0 : _a.isXNumeric,
    (_b = w.seriesData) == null ? void 0 : _b.seriesX,
    w.globals.labels,
    realIndex,
    j
  );
}
function frameDatumKey(frame, realIndex, j) {
  return keyOf(frame.isXNumeric, frame.seriesX, frame.labels, realIndex, j);
}
function keyOf(isXNumeric, seriesX, labels, realIndex, j) {
  if (isXNumeric) {
    const sx = seriesX == null ? void 0 : seriesX[realIndex];
    if (sx && sx.length && sx[j] != null) return "x:" + sx[j];
  }
  const lbl = labels == null ? void 0 : labels[j];
  if (lbl != null && String(lbl) !== "") {
    return "c:" + (Array.isArray(lbl) ? lbl.join(" ") : String(lbl));
  }
  return "j:" + j;
}
function joinKeys(oldKeys, newKeys) {
  const oldIndex = /* @__PURE__ */ new Map();
  oldKeys.forEach((k, i) => {
    if (!oldIndex.has(k)) oldIndex.set(k, i);
  });
  const toOld = new Array(newKeys.length);
  const usedOld = /* @__PURE__ */ new Set();
  let prev = -1;
  let ordered = true;
  let identity = oldKeys.length === newKeys.length;
  newKeys.forEach((k, i) => {
    const oi = oldIndex.has(k) && !usedOld.has(oldIndex.get(k)) ? oldIndex.get(k) : -1;
    toOld[i] = oi;
    if (oi !== -1) {
      usedOld.add(oi);
      if (oi < prev) ordered = false;
      prev = oi;
    }
    if (oi !== i) identity = false;
  });
  const exits = [];
  for (let i = 0; i < oldKeys.length; i++) {
    if (!usedOld.has(i)) exits.push(i);
  }
  return { toOld, exits, ordered, changed: !identity };
}
function uniquifyKeys(keys) {
  const seen = /* @__PURE__ */ new Map();
  return keys.map((k) => {
    const count = seen.get(k) || 0;
    seen.set(k, count + 1);
    return count === 0 ? k : `${k}#${count}`;
  });
}
function seriesKeys(w, realIndex, n = ((_a) => (_a = w.seriesData.series[realIndex]) == null ? void 0 : _a.length)() | 0) {
  return uniquifyKeys(
    Array.from({ length: n }, (_, j) => datumKey(w, realIndex, j))
  );
}
function seriesJoin(w, realIndex, includeIdentity = false, allowReorder = false, sj = buildJoin(w, realIndex)) {
  if (!sj) return null;
  if (!sj.join.ordered && !allowReorder) return null;
  if (!sj.join.changed && !includeIdentity) return null;
  return sj;
}
function buildJoin(w, realIndex) {
  var _a, _b;
  if (!lengthTransitionEnabled(w)) return null;
  const frame = w.globals.prevStreamFrame;
  if (!frame) return null;
  const oldY = (_a = frame.seriesY) == null ? void 0 : _a[realIndex];
  const newY = (_b = w.seriesData.series) == null ? void 0 : _b[realIndex];
  if (!Array.isArray(oldY) || !Array.isArray(newY)) return null;
  if (!oldY.length || !newY.length) return null;
  const oldKeys = uniquifyKeys(
    oldY.map((_, j) => frameDatumKey(frame, realIndex, j))
  );
  const newKeys = seriesKeys(w, realIndex);
  return { join: joinKeys(oldKeys, newKeys), oldKeys, newKeys };
}
function morphEasing(w) {
  var _a, _b;
  const anim = w.config.chart.animations;
  return resolveEasing((_b = (_a = anim.dynamicAnimation) == null ? void 0 : _a.easing) != null ? _b : anim.easing);
}
function rafTween(w, duration, ease, onFrame, onDone, alive, startAt = performance.now()) {
  const step = (now) => {
    if (w.globals.isDestroyed || alive && !alive()) return;
    const raw = Math.max(0, Math.min(1, (now - startAt) / duration));
    onFrame(ease(raw), raw);
    if (raw < 1) {
      BrowserAPIs.requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  };
  BrowserAPIs.requestAnimationFrame(step);
  return () => {
    alive = () => false;
  };
}
const onPage = (w, elPointsMain) => () => w.dom.baseEl.contains(elPointsMain.node);
function tweenSeriesMarkers(w, { elPointsMain, realIndex, speed, join }) {
  var _a, _b, _c, _d;
  if (!(elPointsMain == null ? void 0 : elPointsMain.node) || !w.globals.prevStreamFrame || !lengthTransitionEnabled(w))
    return false;
  const markers = elPointsMain.node.querySelectorAll(".apexcharts-marker");
  if (!markers.length) return false;
  const sj = seriesJoin(w, realIndex, true, false, join == null ? void 0 : join());
  if (!sj) return false;
  const frame = (
    /** @type {any} */
    w.globals.prevStreamFrame
  );
  const oldXP = (_a = frame.xPixels) == null ? void 0 : _a[realIndex];
  const oldYP = (_b = frame.yPixels) == null ? void 0 : _b[realIndex];
  if (!oldXP || !oldYP) return false;
  const newXP = ((_c = w.globals.seriesXvalues) == null ? void 0 : _c[realIndex]) || [];
  const newYP = ((_d = w.globals.seriesYvalues) == null ? void 0 : _d[realIndex]) || [];
  const ease = morphEasing(w);
  const duration = Math.max(1, speed || 1);
  elPointsMain.node.classList.remove("apexcharts-element-hidden");
  const alive = onPage(w, elPointsMain);
  markers.forEach((node) => {
    var _a2, _b2, _c2, _d2, _e, _f, _g, _h, _i;
    const j = parseInt(
      (_b2 = (_a2 = node.getAttribute("j")) != null ? _a2 : node.getAttribute("rel")) != null ? _b2 : "",
      10
    );
    if (!isFinite(j) || j < 0 || j >= sj.join.toOld.length) return;
    const oldJ = sj.join.toOld[j];
    const to = newXP[j] != null && newYP[j] != null ? [newXP[j], newYP[j]] : null;
    if (oldJ === -1 || !to) {
      const style = (
        /** @type {any} */
        node.style
      );
      style.opacity = "0";
      rafTween(
        w,
        duration,
        ease,
        (eased) => {
          style.opacity = String(eased);
        },
        () => {
          style.opacity = "";
        },
        alive
      );
      return;
    }
    const dx = ((_c2 = oldXP[oldJ]) != null ? _c2 : NaN) - to[0];
    const dy = ((_d2 = oldYP[oldJ]) != null ? _d2 : NaN) - to[1];
    if (!isFinite(dx) || !isFinite(dy)) return;
    const rFrom = (_g = (_f = (_e = frame.rPixels) == null ? void 0 : _e[realIndex]) == null ? void 0 : _f[oldJ]) != null ? _g : NaN;
    const rTo = parseFloat(
      (_i = (_h = node.getAttribute("r")) != null ? _h : node.getAttribute("default-marker-size")) != null ? _i : ""
    );
    const scales = isFinite(rFrom) && isFinite(rTo) && rTo > 0 && Math.abs(rFrom - rTo) > 0.25;
    const moves = Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5;
    if (!moves && !scales) return;
    const apply = (eased) => {
      const offX = dx * (1 - eased);
      const offY = dy * (1 - eased);
      if (scales) {
        const s = (rFrom + (rTo - rFrom) * eased) / rTo;
        node.setAttribute(
          "transform",
          `translate(${offX + to[0] * (1 - s)}, ${offY + to[1] * (1 - s)}) scale(${s})`
        );
      } else {
        node.setAttribute("transform", `translate(${offX}, ${offY})`);
      }
    };
    apply(0);
    rafTween(
      w,
      duration,
      ease,
      apply,
      () => node.removeAttribute("transform"),
      alive
    );
  });
  return true;
}
function scaleAbout(node, cx, cy, s) {
  node.setAttribute("transform", `translate(${cx * (1 - s)}, ${cy * (1 - s)}) scale(${s})`);
}
function growRisingMarkers(w, { elPointsMain, realIndex, speed }) {
  if (!(elPointsMain == null ? void 0 : elPointsMain.node) || !lengthTransitionEnabled(w)) return false;
  if ((w.globals.risingSeries || []).indexOf(realIndex) === -1) return false;
  const markers = elPointsMain.node.querySelectorAll(".apexcharts-marker");
  if (!markers.length) return false;
  const ease = morphEasing(w);
  const alive = onPage(w, elPointsMain);
  elPointsMain.node.classList.remove("apexcharts-element-hidden");
  markers.forEach((node) => {
    let cx = parseFloat(node.getAttribute("cx"));
    let cy = parseFloat(node.getAttribute("cy"));
    if (node.getAttribute("shape") === "star" || !isFinite(cx + cy)) {
      const b = node.getBBox();
      cx = b.x + b.width / 2;
      cy = b.y + b.height / 2;
    }
    scaleAbout(node, cx, cy, 0);
    rafTween(
      w,
      Math.max(1, speed || 1),
      ease,
      (eased) => scaleAbout(node, cx, cy, eased),
      () => node.removeAttribute("transform"),
      alive
    );
  });
  return true;
}
function shrinkCollapsingMarkers(w, { elPointsMain, realIndex, speed, drawPoint }) {
  var _a, _b, _c;
  if (!(elPointsMain == null ? void 0 : elPointsMain.node) || !lengthTransitionEnabled(w)) return false;
  if ((w.globals.collapsingSeriesIndices || []).indexOf(realIndex) === -1) return false;
  const frame = w.globals.prevStreamFrame;
  const xs = (_a = frame == null ? void 0 : frame.xPixels) == null ? void 0 : _a[realIndex];
  const ys = (_b = frame == null ? void 0 : frame.yPixels) == null ? void 0 : _b[realIndex];
  if (!Array.isArray(xs) || !Array.isArray(ys)) return false;
  const rs = ((_c = frame == null ? void 0 : frame.rPixels) == null ? void 0 : _c[realIndex]) || [];
  const fallbackR = w.globals.markers.size[realIndex] || 0;
  const ease = morphEasing(w);
  let drawn = false;
  for (let j = 0; j < xs.length; j++) {
    const x = xs[j];
    const y = ys[j];
    if (x == null || y == null || !isFinite(x) || !isFinite(y)) continue;
    const r = isFinite(rs[j]) ? rs[j] : fallbackR;
    if (!(r > 0)) continue;
    const el = drawPoint(x, y, r, j);
    if (!(el == null ? void 0 : el.node)) continue;
    elPointsMain.add(el);
    const node = el.node;
    node.classList.add("apexcharts-marker-exit");
    const landed = Animations.trackSeriesTween(w, realIndex);
    rafTween(
      w,
      Math.max(1, speed || 1),
      ease,
      (eased) => scaleAbout(node, x, y, 1 - eased),
      () => {
        scaleAbout(node, x, y, 0);
        landed();
      }
    );
    drawn = true;
  }
  if (drawn) elPointsMain.node.classList.remove("apexcharts-element-hidden");
  return drawn;
}
function reconcileSeriesPaths(w, { type, realIndex, pathFromLine, pathFromArea, linePaths, areaPaths, join: sjOf }) {
  var _a, _b;
  const sj = seriesJoin(w, realIndex, false, false, sjOf == null ? void 0 : sjOf());
  if (!sj) return null;
  const { join, oldKeys, newKeys } = sj;
  const frame = (
    /** @type {any} */
    w.globals.prevStreamFrame
  );
  const oldY = (_a = frame.seriesY) == null ? void 0 : _a[realIndex];
  const newY = (_b = w.seriesData.series) == null ? void 0 : _b[realIndex];
  if (oldY.length < 2 || newY.length < 2) return null;
  if (oldY.some((v) => v === null) || newY.some((v) => v === null)) return null;
  const entries = buildUnionEntries(join, oldKeys.length);
  const out = {};
  if (Array.isArray(linePaths) && linePaths.length === 1 && pathFromLine) {
    out.line = reconcilePathPair(
      pathFromLine,
      linePaths[0],
      entries,
      oldKeys.length,
      newKeys.length,
      false
    );
  }
  if (type === "area" && Array.isArray(areaPaths) && areaPaths.length === 1 && pathFromArea) {
    out.area = reconcilePathPair(
      pathFromArea,
      areaPaths[0],
      entries,
      oldKeys.length,
      newKeys.length,
      true
    );
  }
  if (!out.line && !out.area) return null;
  return out;
}
class Line {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   * @param {boolean} isPointsChart
   */
  constructor(w, ctx, xyRatios, isPointsChart) {
    this.ctx = ctx;
    this.w = w;
    this.xyRatios = xyRatios;
    this.xRatio = 0;
    this.yRatio = [];
    this.zRatio = 0;
    this.baseLineY = [];
    this.pointsChart = !(this.w.config.chart.type !== "bubble" && this.w.config.chart.type !== "scatter") || isPointsChart;
    this.scatter = new Scatter(this.w, this.ctx);
    this.noNegatives = this.w.globals.minX === Number.MAX_VALUE;
    this.lineHelpers = new Helpers(this);
    this.markers = new Markers(this.w, this.ctx);
    this.prevSeriesY = [];
    this.prevSeriesYByX = /* @__PURE__ */ new Map();
    this.categoryAxisCorrection = 0;
    this.yaxisIndex = 0;
    this.xDivision = 0;
    this.zeroY = 0;
    this.areaBottomY = 0;
    this.strokeWidth = 0;
    this.isReversed = false;
    this.appendPathFrom = false;
    this.elSeries = null;
    this.elPointsMain = null;
    this.elDataLabelsWrap = null;
    this._elLastPointsWrap = null;
    this._shapeOnly = false;
  }
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} seriesIndex
   * @param {any} seriesRangeEnd
   */
  draw(series, ctype, seriesIndex, seriesRangeEnd) {
    var _a;
    const w = this.w;
    const hf = this.ctx.highlightFilter;
    const graphics = new Graphics(this.w);
    const type = w.globals.comboCharts ? ctype : w.config.chart.type;
    const ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`
    });
    const coreUtils = new CoreUtils(this.w);
    this.yRatio = this.xyRatios.yRatio;
    this.zRatio = this.xyRatios.zRatio;
    this.xRatio = this.xyRatios.xRatio;
    this.baseLineY = this.xyRatios.baseLineY;
    series = coreUtils.getLogSeries(
      series,
      /** @type {any} */
      seriesIndex
    );
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.prevSeriesY = [];
    this.prevSeriesYByX = /* @__PURE__ */ new Map();
    this._stackXs = null;
    if (w.config.chart.stacked && w.axisFlags.isXNumeric) {
      const xs = series.map(
        (_, i) => w.globals.comboCharts ? (
          /** @type {any} */
          seriesIndex[i]
        ) : i
      ).filter((ri) => !this._hidden(ri)).map((ri) => w.seriesData.seriesX[ri] || []);
      if (xs.some(
        (a) => a.length !== xs[0].length || a.some((v, k) => v !== xs[0][k])
      )) {
        this._stackXs = [...new Set(xs.flat())].sort((a, b) => a - b);
      }
    }
    const allSeries = [];
    for (let i = 0; i < series.length; i++) {
      const realIndex = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      series = this.lineHelpers.sameValueSeriesFix(i, series, realIndex);
      const translationsIndex = this.yRatio.length > 1 ? realIndex : 0;
      const flat = this._collapsedBaselineRow(series, i, realIndex);
      this._shapeOnly = !!flat;
      if (flat) {
        series = series.slice();
        series[i] = flat;
        if (type === "rangeArea" && seriesRangeEnd) {
          seriesRangeEnd = seriesRangeEnd.slice();
          seriesRangeEnd[i] = flat;
        }
      }
      this._initSerieVariables(series, i, realIndex);
      Series.addCollapsedClassToSeries(this.w, this.elSeries, realIndex);
      const paths = this._buildSeriesPaths(
        type,
        series,
        i,
        realIndex,
        translationsIndex,
        seriesIndex,
        seriesRangeEnd
      );
      this._handlePaths({ type, realIndex, i, paths });
      hf == null ? void 0 : hf.line(this, type, series, i, realIndex, translationsIndex, paths);
      this.markers.flushBatch(this.elPointsMain, realIndex);
      this.elSeries.add(this.elPointsMain);
      this.elSeries.add(this.elDataLabelsWrap);
      allSeries.push(this.elSeries);
    }
    if (typeof /** @type {Record<string,any>} */
    ((_a = w.config.series[0]) == null ? void 0 : _a.zIndex) !== "undefined") {
      allSeries.sort(
        (a, b) => Number(a.node.getAttribute("zIndex")) - Number(b.node.getAttribute("zIndex"))
      );
    }
    if (w.config.chart.stacked) {
      for (let s = allSeries.length - 1; s >= 0; s--) {
        ret.add(allSeries[s]);
      }
    } else {
      for (let s = 0; s < allSeries.length; s++) {
        ret.add(allSeries[s]);
      }
    }
    return ret;
  }
  /**
   * One series' line and area paths from its row of values: the start point,
   * the stacking base, the pathFrom and the per-point walk. The draw loop
   * calls it for each series; the highlight filter calls it again with the
   * part row while markers and labels are off (_shapeOnly).
   * @param {string} type
   * @param {any[]} series
   * @param {number} i
   * @param {number} realIndex
   * @param {number} translationsIndex
   * @param {any} seriesIndex
   * @param {any} seriesRangeEnd
   */
  _buildSeriesPaths(type, series, i, realIndex, translationsIndex, seriesIndex, seriesRangeEnd) {
    const w = this.w;
    const yArrj = [];
    const y2Arrj = [];
    const xArrj = [];
    let x = w.globals.padHorizontal + this.categoryAxisCorrection;
    const y = 1;
    const linePaths = [];
    const areaPaths = [];
    if (w.axisFlags.isXNumeric && w.seriesData.seriesX.length > 0) {
      x = (w.seriesData.seriesX[realIndex][0] - w.globals.minX) / this.xRatio;
    }
    xArrj.push(x);
    const pX = x;
    let pY2;
    let prevY = this.zeroY;
    let prevY2 = this.zeroY;
    const lineYPosition = 0;
    const firstPrevY = this.lineHelpers.determineFirstPrevY({
      i,
      realIndex,
      series,
      prevY,
      lineYPosition,
      translationsIndex
    });
    prevY = firstPrevY.prevY;
    if (w.config.stroke.curve === "monotoneCubic" && series[i][0] === null) {
      yArrj.push(null);
    } else {
      yArrj.push(prevY);
    }
    const pY = prevY;
    let firstPrevY2;
    if (type === "rangeArea") {
      firstPrevY2 = this.lineHelpers.determineFirstPrevY({
        i,
        realIndex,
        series: seriesRangeEnd,
        prevY: prevY2,
        lineYPosition,
        translationsIndex
      });
      prevY2 = firstPrevY2.prevY;
      pY2 = prevY2;
      y2Arrj.push(yArrj[0] !== null ? prevY2 : null);
    }
    const pathsFrom = this._calculatePathsFrom(realIndex, prevY);
    const rYArrj = [yArrj[0]];
    const rY2Arrj = [y2Arrj[0]];
    const iteratingOpts = {
      type,
      series,
      realIndex,
      translationsIndex,
      i,
      x,
      y,
      pX,
      pY,
      pathsFrom,
      linePaths,
      areaPaths,
      seriesIndex,
      lineYPosition,
      xArrj,
      yArrj,
      y2Arrj,
      seriesRangeEnd
    };
    const paths = this._iterateOverDataPoints(__spreadProps(__spreadValues({}, iteratingOpts), {
      iterations: type === "rangeArea" ? series[i].length - 1 : void 0,
      isRangeStart: true
    }));
    if (type === "rangeArea") {
      const pathsFrom2 = this._calculatePathsFrom(realIndex, prevY2);
      const rangePaths = this._iterateOverDataPoints(__spreadProps(__spreadValues({}, iteratingOpts), {
        series: seriesRangeEnd,
        xArrj: [x],
        yArrj: rYArrj,
        y2Arrj: rY2Arrj,
        pY: pY2,
        areaPaths: paths.areaPaths,
        pathsFrom: pathsFrom2,
        iterations: seriesRangeEnd[i].length - 1,
        isRangeStart: false
      }));
      const segments = paths.linePaths.length / 2;
      for (let s = 0; s < segments; s++) {
        paths.linePaths[s] = rangePaths.linePaths[s + segments] + paths.linePaths[s];
      }
      paths.linePaths.splice(segments);
      const prevBand = paths.linePaths.length === 1 ? this.lineHelpers.previousRangeAreaPath(realIndex) : null;
      paths.pathFromLine = prevBand != null ? prevBand : rangePaths.pathFromLine + paths.pathFromLine;
    } else if (!/z\s*$/i.test(paths.pathFromArea)) {
      paths.pathFromArea += "z";
    }
    return paths;
  }
  /**
   * The row to draw for a legend-hidden series on an unstacked chart: every
   * point on the baseline, or null to draw the series as it is.
   *
   * A hidden series arrives with no data. Drawn as nothing, its paths had no
   * target to tween to, so it vanished on the click and reappeared fully
   * formed on the next one. Drawn flat on the baseline, the exit is the
   * series flattening down (the same "value goes to zero" a stacked layer or a
   * bar already shows), and the re-entry rises from where it went. The
   * series-collapsed class keeps it unpainted at rest.
   *
   * The baseline is 0 when 0 is on the axis, else the axis edge nearest to it,
   * so a 900..1000 line flattens onto the bottom of the plot rather than
   * dropping out of view. Only the drawing changes: the data, the y range and
   * the tooltip all still see an empty series.
   * @param {any[]} series
   * @param {number} i
   * @param {number} realIndex
   * @returns {number[] | null}
   */
  _collapsedBaselineRow(series, i, realIndex) {
    const w = this.w;
    const gl = w.globals;
    if (w.config.chart.stacked || this.pointsChart) return null;
    if (!Array.isArray(series[i]) || series[i].length !== 0) return null;
    if (!this._hidden(realIndex)) return null;
    const n = w.axisFlags.isXNumeric ? (w.seriesData.seriesX[realIndex] || []).length : gl.dataPoints;
    if (!n) return null;
    const lo = Utils.isNumber(gl.minYArr[realIndex]) ? gl.minYArr[realIndex] : gl.minY;
    const hi = Utils.isNumber(gl.maxYArr[realIndex]) ? gl.maxYArr[realIndex] : gl.maxY;
    const base = Math.min(Math.max(0, lo), hi);
    return new Array(n).fill(Utils.isNumber(base) ? base : 0);
  }
  /**
   * @param {any[]} series
   * @param {number} i
   * @param {number} realIndex
   */
  _initSerieVariables(series, i, realIndex) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    this.xDivision = w.layout.gridWidth / (w.globals.dataPoints - (w.config.xaxis.tickPlacement === "on" ? 1 : 0));
    this.strokeWidth = Array.isArray(w.config.stroke.width) ? w.config.stroke.width[realIndex] : w.config.stroke.width;
    let translationsIndex = 0;
    if (this.yRatio.length > 1) {
      this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex];
      translationsIndex = realIndex;
    }
    this.isReversed = w.config.yaxis[this.yaxisIndex] && w.config.yaxis[this.yaxisIndex].reversed;
    this.zeroY = w.layout.gridHeight - this.baseLineY[translationsIndex] - (this.isReversed ? w.layout.gridHeight : 0) + (this.isReversed ? this.baseLineY[translationsIndex] * 2 : 0);
    this.areaBottomY = this.zeroY;
    if (this.zeroY > w.layout.gridHeight || w.config.plotOptions.area.fillTo === "end") {
      this.areaBottomY = w.layout.gridHeight;
    }
    this.categoryAxisCorrection = this.xDivision / 2;
    const seriesItem = (
      /** @type {Record<string,any>} */
      w.config.series[realIndex]
    );
    this.elSeries = graphics.group({
      class: `apexcharts-series`,
      zIndex: typeof seriesItem.zIndex !== "undefined" ? seriesItem.zIndex : realIndex,
      seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex])
    });
    this.elPointsMain = graphics.group({
      class: "apexcharts-series-markers-wrap",
      "data:realIndex": realIndex
    });
    this.markers.resetSeriesWrapCache();
    this._elLastPointsWrap = null;
    if (w.globals.hasNullValues) {
      const firstPoint = this.markers.plotChartMarkers({
        pointsPos: {
          x: [0],
          y: [w.layout.gridHeight + w.globals.markers.largestSize]
        },
        seriesIndex: i,
        j: 0,
        pSize: 0.1,
        alwaysDrawMarker: true,
        isVirtualPoint: true
      });
      if (firstPoint !== null) {
        this.elPointsMain.add(firstPoint);
      }
    }
    this.elDataLabelsWrap = graphics.group({
      class: "apexcharts-datalabels",
      "data:realIndex": realIndex
    });
    const longestSeries = series[i].length === w.globals.dataPoints;
    this.elSeries.attr({
      "data:longestSeries": longestSeries,
      rel: i + 1,
      "data:realIndex": realIndex
    });
    this.appendPathFrom = true;
  }
  /**
   * The baseline pathFrom a series grows from on mount, or the previous
   * render's paths when there are any. `prevY` rides along for the first
   * point's marker.
   * @param {number} realIndex
   * @param {number} prevY
   */
  _calculatePathsFrom(realIndex, prevY) {
    const graphics = new Graphics(this.w);
    let pathFromLine = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    let pathFromArea = pathFromLine;
    if (this.w.globals.previousPaths.length > 0) {
      const pathFrom = this.lineHelpers.checkPreviousPaths({
        pathFromLine,
        pathFromArea,
        realIndex
      });
      pathFromLine = pathFrom.pathFromLine;
      pathFromArea = pathFrom.pathFromArea;
    }
    return { prevY, pathFromLine, pathFromArea };
  }
  /**
   * The identity a stacked baseline is looked up by.
   *
   * On a numeric or datetime axis each series carries its own x array, and two
   * series' Nth points are not the same x when one of them is missing an entry.
   * So the key is the x VALUE there. On a category axis every series is indexed
   * against the shared category list, so the ordinal already IS the identity
   * (and the pixel x is a running sum, unsafe to compare as a float).
   *
   * Returns undefined when this ordinal has no x, which happens on every series
   * shorter than the longest one: the loop runs `dataPoints - 1` times for all
   * of them. Those iterations must not write to or read from the map.
   * @param {number} realIndex
   * @param {number} ordinal
   * @returns {any}
   */
  _stackKey(realIndex, ordinal) {
    if (!this.w.axisFlags.isXNumeric) return ordinal;
    const xs = this.w.seriesData.seriesX[realIndex];
    return xs ? xs[ordinal] : void 0;
  }
  /**
   * Pixel y of the top of the stack at one point of the series being drawn, or
   * undefined when nothing has been stacked there yet (so the caller starts
   * from the axis baseline).
   * @param {number} realIndex
   * @param {number} ordinal
   * @returns {number | undefined}
   */
  stackTopAt(realIndex, ordinal) {
    const key = this._stackKey(realIndex, ordinal);
    if (key === void 0 || key === null) return void 0;
    return this.prevSeriesYByX.get(key);
  }
  /** @param {number} ri */
  _hidden(ri) {
    const g = this.w.globals;
    return g.collapsedSeriesIndices.indexOf(ri) > -1 || g.ancillaryCollapsedSeriesIndices.indexOf(ri) > -1;
  }
  /**
   * Fold a drawn series into the running stack top, so the next series can find
   * its baseline by x (#4886).
   *
   * A point the series does not have simply leaves the previous top in place,
   * which is the same thing as contributing 0 there. That is exactly what the
   * workaround posted on the issue does by hand (pad every series onto the union
   * of all x with zeros), and it is the behaviour the reporter expected.
   *
   * Collapsed series are skipped rather than folded in. Today a collapsed series
   * renders a full-length yArrj sitting on the running baseline, so folding it
   * would be a no-op anyway, but skipping states the intent and keeps this
   * correct if that representation ever changes.
   * @param {number} realIndex
   * @param {any[]} yArrj
   * @param {any[]} [row] the drawn row, if not the series' own (a part)
   */
  _recordStackTops(realIndex, yArrj, row = this.w.seriesData.series[realIndex]) {
    const w = this.w;
    if (!w.config.chart.stacked) return;
    if (!Array.isArray(yArrj)) return;
    if (this._hidden(realIndex)) return;
    for (let j = 0; j < yArrj.length; j++) {
      const key = this._stackKey(realIndex, j);
      if (key === void 0 || key === null) continue;
      const y = yArrj[j];
      if (!Utils.isNumber(y) || (row == null ? void 0 : row[j]) == null) continue;
      this.prevSeriesYByX.set(key, y);
    }
  }
  /** @param {{type: any, realIndex: any, i: any, paths: any}} opts */
  _handlePaths({ type, realIndex, i, paths }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const emit = seriesEmitter(this.ctx, graphics);
    const fill = new Fill(this.w);
    this.marks = [];
    this.prevSeriesY.push(paths.yArrj);
    this._recordStackTops(realIndex, paths.yArrj);
    let streamScroll = null;
    if ((type === "line" || type === "area") && w.globals.dataChanged) {
      streamScroll = detectStreamScroll(w, realIndex, paths.xArrj, paths.yArrj);
    }
    let sj;
    const join = () => sj || (sj = seriesJoin(w, realIndex, true, true));
    let reconcile = null;
    if (!streamScroll && (type === "line" || type === "area")) {
      reconcile = reconcileSeriesPaths(w, {
        type,
        realIndex,
        pathFromLine: paths.pathFromLine,
        pathFromArea: paths.pathFromArea,
        linePaths: paths.linePaths,
        areaPaths: paths.areaPaths,
        join
      });
    }
    w.globals.seriesXvalues[realIndex] = paths.xArrj;
    w.globals.seriesYvalues[realIndex] = paths.yArrj;
    const forecast = w.config.forecastDataPoints;
    if (forecast.count > 0 && type !== "rangeArea") {
      const ci = paths.xArrj.length - forecast.count - 1;
      const forecastCutoff = w.axisFlags.isXNumeric ? (w.seriesData.seriesX[realIndex][ci] - w.globals.minX) / this.xRatio : w.globals.padHorizontal + this.categoryAxisCorrection + ci * this.xDivision;
      const elForecastMask = graphics.drawRect(
        forecastCutoff,
        0,
        w.layout.gridWidth,
        w.layout.gridHeight,
        0
      );
      w.dom.elForecastMask.appendChild(elForecastMask.node);
      const elNonForecastMask = graphics.drawRect(
        0,
        0,
        forecastCutoff,
        w.layout.gridHeight,
        0
      );
      w.dom.elNonForecastMask.appendChild(elNonForecastMask.node);
    }
    if (!this.pointsChart) {
      w.globals.delayedElements.push({
        el: this.elPointsMain.node,
        index: realIndex
      });
      const riding = tweenSeriesMarkers(w, {
        elPointsMain: this.elPointsMain,
        realIndex,
        speed: w.config.chart.animations.dynamicAnimation.speed,
        join
      });
      if (!riding && type === "line" && !w.config.stroke.show && (w.globals.dataChanged || w.globals.resized)) {
        this.elPointsMain.node.classList.remove("apexcharts-element-hidden");
      }
      if (((_a = this.elDataLabelsWrap) == null ? void 0 : _a.node) && seriesJoin(w, realIndex, false, false, join())) {
        this.elDataLabelsWrap.node.classList.add("apexcharts-element-hidden");
        w.globals.delayedElements.push({
          el: this.elDataLabelsWrap.node,
          holdUntilComplete: true
        });
      }
    } else {
      tweenSeriesMarkers(w, {
        elPointsMain: this.elPointsMain,
        realIndex,
        speed: w.config.chart.animations.dynamicAnimation.speed
      });
      growRisingMarkers(w, {
        elPointsMain: this.elPointsMain,
        realIndex,
        speed: w.config.chart.animations.dynamicAnimation.speed
      });
      if (!(w.seriesData.series[realIndex] || []).length) {
        shrinkCollapsingMarkers(w, {
          elPointsMain: this.elPointsMain,
          realIndex,
          speed: w.config.chart.animations.dynamicAnimation.speed,
          drawPoint: (x, y, r, j) => this.scatter.drawPoint(x, y, r, realIndex, j, j)
        });
      }
    }
    const defaultRenderedPathOptions = {
      i,
      realIndex,
      animationDelay: i,
      initialSpeed: w.config.chart.animations.speed,
      dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
      className: `apexcharts-${type}`
    };
    const numericXY = paths.numericXY;
    const mergeSegments = type === "line" || type === "area";
    const linePathsToDraw = mergeSegments && paths.linePaths.length > 1 ? [paths.linePaths.join(" ")] : paths.linePaths;
    const areaPathsToDraw = mergeSegments && paths.areaPaths.length > 1 ? [paths.areaPaths.join(" ")] : paths.areaPaths;
    if (type === "area") {
      const pathFill = fill.fillPath({
        seriesNumber: realIndex
      });
      for (let p = 0; p < areaPathsToDraw.length; p++) {
        const renderedPath = emit.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: streamScroll ? projectPathToPrevFrame(areaPathsToDraw[p], streamScroll) : (_c = (_b = reconcile == null ? void 0 : reconcile.area) == null ? void 0 : _b.from) != null ? _c : paths.pathFromArea,
          pathTo: areaPathsToDraw[p],
          pathToNumeric: numericXY ? {
            xs: numericXY.xs,
            ys: numericXY.ys,
            closeY: numericXY.areaCloseY
          } : void 0,
          pathToInterp: (_d = reconcile == null ? void 0 : reconcile.area) == null ? void 0 : _d.toInterp,
          scrollMorph: !!streamScroll,
          stroke: "none",
          strokeWidth: 0,
          strokeLinecap: null,
          fill: pathFill
        }));
        this.elSeries.add(renderedPath);
        this.marks.push(renderedPath);
      }
    }
    if (w.config.stroke.show && !this.pointsChart) {
      let lineFill = null;
      if (type === "line") {
        lineFill = fill.fillPath({
          seriesNumber: realIndex,
          i
        });
      } else {
        if (w.config.stroke.fill.type === "solid") {
          lineFill = w.globals.stroke.colors[realIndex];
        } else {
          const prevFill = w.config.fill;
          w.config.fill = w.config.stroke.fill;
          lineFill = fill.fillPath({
            seriesNumber: realIndex,
            i
          });
          w.config.fill = prevFill;
        }
      }
      for (let p = 0; p < linePathsToDraw.length; p++) {
        let pathFill = lineFill;
        if (type === "rangeArea") {
          pathFill = fill.fillPath({
            seriesNumber: realIndex
          });
        }
        const linePathCommonOpts = __spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: streamScroll ? projectPathToPrevFrame(linePathsToDraw[p], streamScroll) : (_f = (_e = reconcile == null ? void 0 : reconcile.line) == null ? void 0 : _e.from) != null ? _f : paths.pathFromLine,
          pathTo: linePathsToDraw[p],
          pathToNumeric: numericXY ? { xs: numericXY.xs, ys: numericXY.ys } : void 0,
          pathToInterp: (_g = reconcile == null ? void 0 : reconcile.line) == null ? void 0 : _g.toInterp,
          scrollMorph: !!streamScroll,
          stroke: lineFill,
          strokeWidth: this.strokeWidth,
          strokeLinecap: w.config.stroke.lineCap,
          fill: type === "rangeArea" ? pathFill : "none"
        });
        const renderedPath = emit.renderPaths(linePathCommonOpts);
        this.elSeries.add(renderedPath);
        this.marks.push(renderedPath);
        renderedPath.attr("fill-rule", `evenodd`);
        if (forecast.count > 0 && type !== "rangeArea") {
          const renderedForecastPath = emit.renderPaths(linePathCommonOpts);
          renderedForecastPath.node.setAttribute(
            "stroke-dasharray",
            forecast.dashArray
          );
          if (forecast.strokeWidth) {
            renderedForecastPath.node.setAttribute(
              "stroke-width",
              forecast.strokeWidth
            );
          }
          this.elSeries.add(renderedForecastPath);
          renderedForecastPath.attr(
            "clip-path",
            `url(#forecastMask${w.globals.cuid})`
          );
          renderedPath.attr(
            "clip-path",
            `url(#nonForecastMask${w.globals.cuid})`
          );
        }
      }
    }
  }
  _iterateOverDataPoints({
    type,
    series,
    iterations,
    realIndex,
    translationsIndex,
    i,
    x,
    y,
    pX,
    pY,
    pathsFrom,
    linePaths,
    areaPaths,
    seriesIndex,
    lineYPosition,
    xArrj,
    yArrj,
    y2Arrj,
    isRangeStart,
    seriesRangeEnd
  }) {
    var _a, _b, _c;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const yRatio = this.yRatio;
    const prevY = pathsFrom.prevY;
    let { pathFromLine, pathFromArea } = pathsFrom;
    let linePath;
    let areaPath;
    const minY = Utils.isNumber(w.globals.minYArr[realIndex]) ? w.globals.minYArr[realIndex] : w.globals.minY;
    if (!iterations) {
      iterations = w.globals.dataPoints > 1 ? w.globals.dataPoints - 1 : w.globals.dataPoints;
    }
    const getY = (_y, lineYPos) => {
      return lineYPos - _y / yRatio[translationsIndex] + (this.isReversed ? _y / yRatio[translationsIndex] : 0) * 2;
    };
    let y2 = y;
    const stackSeries = w.config.chart.stacked && !w.globals.comboCharts || w.config.chart.stacked && w.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || /** @type {Record<string,any>} */
    ((_a = this.w.config.series[realIndex]) == null ? void 0 : _a.type) === "bar" || /** @type {Record<string,any>} */
    ((_b = this.w.config.series[realIndex]) == null ? void 0 : _b.type) === "column");
    let curve = w.config.stroke.curve;
    if (Array.isArray(curve)) {
      if (Array.isArray(seriesIndex)) {
        curve = curve[seriesIndex[i]];
      } else {
        curve = curve[i];
      }
    }
    let pathState = 0;
    let segmentStartX;
    const jitterPx = this.pointsChart ? this._scatterJitterPx(realIndex) : null;
    if (curve === "straight" && !this.pointsChart) {
      const fast = this._fastStraightPath({
        type,
        series,
        i,
        realIndex,
        translationsIndex,
        iterations,
        x,
        y,
        pX,
        pY,
        pathsFrom,
        linePaths,
        areaPaths,
        xArrj,
        yArrj,
        y2Arrj,
        stackSeries
      });
      if (fast) return fast;
    }
    const ks = stackSeries ? this._stackXs : null;
    let kp = 0;
    const midsAt = [];
    if (!this._shapeOnly && !this.pointsChart && iterations > 0 && series[i].length && w.seriesData.series[i].length > 1 && (w.globals.dataChanged || w.globals.resized || w.globals.markers.batched)) {
      this.elPointsMain.node.classList.add("apexcharts-element-hidden");
    }
    for (let j = 0; j < iterations; j++) {
      if (series[i].length === 0) break;
      const isNull = typeof series[i][j + 1] === "undefined" || series[i][j + 1] === null;
      if (w.axisFlags.isXNumeric) {
        const sxs = w.seriesData.seriesX[realIndex];
        let sX = sxs[j + 1];
        if (typeof sX === "undefined") {
          sX = sxs[iterations - 1];
        }
        x = (sX - w.globals.minX) / this.xRatio;
        if (ks) {
          const m = [];
          while (ks[kp] <= sxs[j]) kp++;
          while (ks[kp] < sX) {
            m.push([
              (ks[kp] - w.globals.minX) / this.xRatio,
              (_c = this.prevSeriesYByX.get(ks[kp++])) != null ? _c : this.zeroY
            ]);
          }
          if (m.length) midsAt[j + 1] = m;
        }
      } else {
        x = x + this.xDivision;
      }
      if (stackSeries) {
        if (i > 0 && w.globals.collapsedSeries.length < w.config.series.length - 1) {
          const prevIndex = (pi) => {
            var _a2;
            for (let pii = pi; pii >= 0; pii--) {
              const ri = (_a2 = seriesIndex == null ? void 0 : seriesIndex[pii]) != null ? _a2 : pii;
              if (!this._hidden(ri)) return pii;
            }
            return -1;
          };
          const pIdx = prevIndex(i - 1);
          if (pIdx < 0) {
            lineYPosition = this.zeroY;
          } else {
            const top = this.stackTopAt(realIndex, j + 1);
            lineYPosition = top === void 0 ? this.zeroY : top;
          }
        } else {
          lineYPosition = this.zeroY;
        }
      } else {
        lineYPosition = this.zeroY;
      }
      if (isNull) {
        y = getY(minY, lineYPosition);
      } else {
        y = getY(series[i][j + 1], lineYPosition);
        if (type === "rangeArea") {
          y2 = getY(seriesRangeEnd[i][j + 1], lineYPosition);
        }
      }
      let xj = x;
      let yj = y;
      if (jitterPx) {
        const seed = realIndex * 100003 + (j + 1);
        if (jitterPx.x) xj = x + (hash01(seed * 7919 + 13) - 0.5) * 2 * jitterPx.x;
        if (jitterPx.y) yj = y + (hash01(seed * 6271 + 97) - 0.5) * 2 * jitterPx.y;
      }
      xArrj.push(series[i][j + 1] === null ? null : xj);
      if (isNull && (w.config.stroke.curve === "smooth" || w.config.stroke.curve === "monotoneCubic")) {
        yArrj.push(null);
        y2Arrj.push(null);
      } else {
        yArrj.push(yj);
        y2Arrj.push(y2);
      }
      const pointsPos = this.lineHelpers.calculatePoints({
        series,
        x: xj,
        y: yj,
        realIndex,
        i,
        j,
        prevY
      });
      const calculatedPaths = this._createPaths({
        type,
        series,
        i,
        j,
        x,
        y,
        midsAt,
        y2,
        xArrj,
        yArrj,
        y2Arrj,
        pX,
        pY,
        pathState,
        segmentStartX,
        linePath,
        areaPath,
        linePaths,
        areaPaths,
        curve,
        isRangeStart
      });
      areaPaths = calculatedPaths.areaPaths;
      linePaths = calculatedPaths.linePaths;
      pX = calculatedPaths.pX;
      pY = calculatedPaths.pY;
      pathState = calculatedPaths.pathState;
      segmentStartX = calculatedPaths.segmentStartX;
      areaPath = calculatedPaths.areaPath;
      linePath = calculatedPaths.linePath;
      if (this.appendPathFrom && !w.globals.hasNullValues && !(curve === "monotoneCubic" && type === "rangeArea")) {
        pathFromLine += graphics.line(x, this.areaBottomY);
        pathFromArea += graphics.line(x, this.areaBottomY);
      }
      if (!this._shapeOnly) {
        this.handleNullDataPoints(series, pointsPos, i, j, realIndex);
        this._handleMarkersAndLabels({
          type,
          pointsPos,
          j,
          realIndex,
          isRangeStart
        });
      }
    }
    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths
    };
  }
  /** @param {{type: any, pointsPos: any, isRangeStart: any, j: any, realIndex: any}} opts */
  _handleMarkersAndLabels({ type, pointsPos, isRangeStart, j, realIndex }) {
    const dataLabels = new DataLabels(this.w, this.ctx);
    if (!this.pointsChart) {
      const elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex,
        j: j + 1
      });
      if (elPointsWrap !== null && elPointsWrap !== this._elLastPointsWrap) {
        this.elPointsMain.add(elPointsWrap);
        this._elLastPointsWrap = elPointsWrap;
      }
    } else {
      this.scatter.draw(this.elSeries, j, {
        realIndex,
        pointsPos,
        zRatio: this.zRatio,
        elParent: this.elPointsMain
      });
    }
    const drawnLabels = dataLabels.drawDataLabel({
      type,
      isRangeStart,
      pos: pointsPos,
      i: realIndex,
      j: j + 1
    });
    if (drawnLabels !== null) {
      this.elDataLabelsWrap.add(drawnLabels);
    }
  }
  /**
   * Max scatter-jitter offsets in pixels for this series, or null when jitter is
   * off. The config offsets are in axis units (x: 1 = one category step / x-data
   * unit, y: 1 = one y-data unit); convert each to pixels using the chart's
   * ratios. The actual per-point offset is a deterministic fraction of these
   * (see Scatter.drawPoint).
   * @param {number} realIndex
   * @returns {{ x: number, y: number } | null}
   */
  _scatterJitterPx(realIndex) {
    var _a;
    const w = this.w;
    const jt = (_a = w.config.plotOptions.scatter) == null ? void 0 : _a.jitter;
    if (!jt || !jt.enabled || !jt.x && !jt.y) return null;
    const xUnitPx = w.axisFlags.isXNumeric && this.xRatio ? 1 / this.xRatio : this.xDivision;
    const ti = this.yRatio.length > 1 ? realIndex : 0;
    const yUnitPx = this.yRatio[ti] ? 1 / this.yRatio[ti] : 0;
    return {
      x: (jt.x || 0) * xUnitPx,
      y: (jt.y || 0) * yUnitPx
    };
  }
  /**
   * Numeric geometry fast path for plain straight line/area series (the
   * render-2026 perf work). Eligibility is strict: everything the per-point
   * slow loop can do beyond plain geometry (null gaps, markers, data labels,
   * discrete markers, stacking, combos, range areas) bails to the state
   * machine. When eligible it produces the SAME outputs as the slow loop
   * (byte-identical d strings via join, the same xArrj/yArrj/y2Arrj
   * pushes, and the same pointsArray tooltip cache) in one tight loop.
   * In canvas mode it additionally emits typed-array coordinates so the
   * renderer can paint via moveTo/lineTo without a Path2D d-string parse.
   *
   * @param {{type: any, series: any, i: number, realIndex: number,
   *   translationsIndex: number, iterations: number, x: number, y: number,
   *   pX: number, pY: number, pathsFrom: any, linePaths: any[],
   *   areaPaths: any[], xArrj: any[], yArrj: any[], y2Arrj: any[],
   *   stackSeries: boolean}} opts
   * @returns {any} the _iterateOverDataPoints result, or null when ineligible
   */
  _fastStraightPath({
    type,
    series,
    i,
    realIndex,
    translationsIndex,
    iterations,
    x,
    y,
    pX,
    pY,
    pathsFrom,
    linePaths,
    areaPaths,
    xArrj,
    yArrj,
    y2Arrj,
    stackSeries
  }) {
    const w = this.w;
    if (type !== "line" && type !== "area") return null;
    if (w.globals.comboCharts || stackSeries) return null;
    if (w.config.dataLabels.enabled) return null;
    if (w.config.markers.discrete.length) return null;
    if (w.globals.markers.size[realIndex] > 0) return null;
    const s = series[i];
    const n = s.length;
    if (!iterations || n < 2 || n - 1 !== iterations) return null;
    for (let k = 0; k <= iterations; k++) {
      const v = s[k];
      if (v === null || typeof v === "undefined") return null;
    }
    const isXNumeric = w.axisFlags.isXNumeric;
    const sx = isXNumeric ? w.seriesData.seriesX[realIndex] : null;
    if (isXNumeric && (!sx || sx.length < n)) return null;
    const yR = this.yRatio[translationsIndex];
    const isReversed = this.isReversed;
    const zeroY = this.zeroY;
    const bottomY = this.areaBottomY;
    const xRatio = this.xRatio;
    const minX = w.globals.minX;
    const xDivision = this.xDivision;
    const offX = w.config.markers.offsetX;
    const offY = w.config.markers.offsetY;
    const appendFrom = this.appendPathFrom && !w.globals.hasNullValues;
    let { pathFromLine, pathFromArea } = pathsFrom;
    const r = this.ctx && this.ctx.renderer;
    const canvasMode = !!(r && r.kind && r.kind !== "svg");
    const buildStrings = !canvasMode || w.globals.dataChanged && !!w.globals.prevStreamFrame;
    const nxs = canvasMode ? new Float64Array(n) : null;
    const nys = canvasMode ? new Float64Array(n) : null;
    if (nxs && nys) {
      nxs[0] = pX;
      nys[0] = pY;
    }
    if (typeof w.globals.pointsArray[realIndex] === "undefined") {
      w.globals.pointsArray[realIndex] = [];
    }
    const pts = w.globals.pointsArray[realIndex];
    const xPT1st = sx ? (sx[0] - minX) / xRatio + offX : this.categoryAxisCorrection + offX;
    pts.push([xPT1st, pathsFrom.prevY + offY]);
    const parts = buildStrings ? new Array(iterations + 1) : [];
    if (buildStrings) parts[0] = "M " + pX + " " + pY;
    const fromParts = buildStrings && appendFrom ? new Array(iterations) : null;
    let xv = x;
    let xj = pX;
    let yj = pY;
    for (let j = 0; j < iterations; j++) {
      if (sx) {
        xj = (sx[j + 1] - minX) / xRatio;
      } else {
        xv = xv + xDivision;
        xj = xv;
      }
      const v = s[j + 1];
      yj = zeroY - v / yR + (isReversed ? v / yR : 0) * 2;
      xArrj.push(xj);
      yArrj.push(yj);
      y2Arrj.push(y);
      pts.push([xj + offX, yj + offY]);
      if (buildStrings) {
        parts[j + 1] = " L " + xj + " " + yj;
        if (fromParts) fromParts[j] = " L " + xj + " " + bottomY;
      }
      if (nxs && nys) {
        nxs[j + 1] = xj;
        nys[j + 1] = yj;
      }
    }
    let linePath = "";
    let areaPath = "";
    if (buildStrings) {
      linePath = parts.join("");
      areaPath = linePath + " L " + xj + " " + bottomY + " L " + pX + " " + bottomY + "z";
    }
    if (fromParts) {
      const fromAppend = fromParts.join("");
      pathFromLine += fromAppend;
      pathFromArea += fromAppend;
    } else if (!buildStrings && appendFrom) {
      pathFromLine += " L " + xj + " " + bottomY;
      pathFromArea += " L " + xj + " " + bottomY;
    }
    linePaths.push(linePath);
    areaPaths.push(areaPath);
    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths,
      numericXY: nxs ? { xs: nxs, ys: nys, areaCloseY: bottomY } : void 0
    };
  }
  /** @param {{type: any, series: any, i: any, j: any, x: any, y: any, midsAt: any[][], xArrj: any, yArrj: any, y2: any, y2Arrj: any, pX: any, pY: any, pathState: any, segmentStartX: any, linePath: any, areaPath: any, linePaths: any, areaPaths: any, curve: any, isRangeStart: any}} opts */
  _createPaths({
    type,
    series,
    i,
    j,
    x,
    y,
    midsAt,
    xArrj,
    yArrj,
    y2,
    y2Arrj,
    pX,
    pY,
    pathState,
    segmentStartX,
    linePath,
    areaPath,
    linePaths,
    areaPaths,
    curve,
    isRangeStart
  }) {
    const graphics = new Graphics(this.w);
    const areaBottomY = this.areaBottomY;
    const rangeArea = type === "rangeArea";
    const isLowerRangeAreaPath = type === "rangeArea" && isRangeStart;
    const mids = midsAt[j + 1];
    const via = (f) => mids ? [...mids, [x, y]].map(([bx, by], k, a) => f(...k ? a[k - 1] : [pX, pY], bx, by)).join("") : f(pX, pY, x, y);
    switch (curve) {
      case "monotoneCubic": {
        const yAj = isRangeStart ? yArrj : y2Arrj;
        const getSmoothInputs = (xArr, yArr) => {
          return xArr.map((_, i2) => {
            return [_, yArr[i2]];
          }).filter((_) => _[1] !== null);
        };
        const getSegmentLengths = (yArr) => {
          const segLens = [];
          let count = 0;
          yArr.forEach((_) => {
            if (_ !== null) {
              count++;
            } else if (count > 0) {
              segLens.push(count);
              count = 0;
            }
          });
          if (count > 0) {
            segLens.push(count);
          }
          return segLens;
        };
        const getSegments = (yArr, points) => {
          const segLens = getSegmentLengths(yArr);
          const segments = [];
          for (let i2 = 0, len = 0; i2 < segLens.length; len += segLens[i2++]) {
            segments[i2] = spline.slice(points, len, len + segLens[i2]);
          }
          return segments;
        };
        switch (pathState) {
          case 0:
            if (yAj[j + 1] === null) {
              break;
            }
            pathState = 1;
          // falls through
          case 1:
            if (!(rangeArea ? xArrj.length === series[i].length : j === series[i].length - 2)) {
              break;
            }
          // falls through
          case 2: {
            let _xAj = isRangeStart ? xArrj : xArrj.slice().reverse();
            let _yAj = isRangeStart ? yAj : yAj.slice().reverse();
            if (midsAt.length && !rangeArea) {
              const P = [];
              _xAj.forEach((v, k) => {
                if (_yAj[k] !== null && _yAj[k - 1] != null && midsAt[k]) {
                  P.push(...midsAt[k]);
                }
                P.push([v, _yAj[k]]);
              });
              _xAj = P.map((p) => p[0]);
              _yAj = P.map((p) => p[1]);
            }
            const smoothInputs = getSmoothInputs(_xAj, _yAj);
            const points = smoothInputs.length > 1 ? spline.points(smoothInputs) : smoothInputs;
            let smoothInputsLower = [];
            if (rangeArea) {
              if (isLowerRangeAreaPath) {
                areaPaths = smoothInputs;
              } else {
                smoothInputsLower = areaPaths.reverse();
              }
            }
            let segmentCount = 0;
            let smoothInputsIndex = 0;
            getSegments(_yAj, points).forEach((_) => {
              segmentCount++;
              const svgPoints = svgPath(_);
              const _start = smoothInputsIndex;
              smoothInputsIndex += _.length;
              const _end = smoothInputsIndex - 1;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints;
              } else if (rangeArea) {
                linePath = graphics.move(
                  smoothInputsLower[_start][0],
                  smoothInputsLower[_start][1]
                ) + graphics.line(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints + graphics.line(
                  smoothInputsLower[_end][0],
                  smoothInputsLower[_end][1]
                );
              } else {
                linePath = graphics.move(
                  smoothInputs[_start][0],
                  smoothInputs[_start][1]
                ) + svgPoints;
                areaPath = linePath + graphics.line(smoothInputs[_end][0], areaBottomY) + graphics.line(smoothInputs[_start][0], areaBottomY) + "z";
                areaPaths.push(areaPath);
              }
              linePaths.push(linePath);
            });
            if (rangeArea && segmentCount > 1 && !isLowerRangeAreaPath) {
              const upperLinePaths = linePaths.slice(segmentCount).reverse();
              linePaths.splice(segmentCount);
              upperLinePaths.forEach(
                (u) => linePaths.push(u)
              );
            }
            pathState = 0;
            break;
          }
        }
        break;
      }
      case "smooth": {
        const toPoint = (ax, ay, bx, by) => {
          const l = (bx - ax) * 0.35;
          return graphics.curve(ax + l, ay, bx - l, by, bx, by);
        };
        if (series[i][j] === null) {
          pathState = 0;
        } else {
          switch (pathState) {
            case 0:
              segmentStartX = pX;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(pX, y2Arrj[j]) + graphics.line(pX, pY);
              } else {
                linePath = graphics.move(pX, pY);
              }
              areaPath = graphics.move(pX, pY);
              if (series[i][j + 1] === null || typeof series[i][j + 1] === "undefined") {
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j < series[i].length - 2) {
                const p = via(toPoint);
                linePath += p;
                areaPath += p;
                break;
              }
            // falls through
            case 1:
              if (series[i][j + 1] === null) {
                if (isLowerRangeAreaPath) {
                  linePath += graphics.line(pX, y2);
                } else {
                  linePath += graphics.move(pX, pY);
                }
                areaPath += graphics.line(pX, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                pathState = -1;
              } else {
                const p = via(toPoint);
                linePath += p;
                areaPath += p;
                if (j >= series[i].length - 2) {
                  if (isLowerRangeAreaPath) {
                    linePath += graphics.curve(x, y, x, y, x, y2) + graphics.move(x, y2);
                  }
                  areaPath += graphics.curve(x, y, x, y, x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                  linePaths.push(linePath);
                  areaPaths.push(areaPath);
                  pathState = -1;
                }
              }
              break;
          }
        }
        pX = x;
        pY = y;
        break;
      }
      default: {
        const pathToPoint = (_ax, _ay, x2, y3) => {
          let path = "";
          switch (curve) {
            case "stepline":
              path = graphics.line(x2, null, "H") + graphics.line(null, y3, "V");
              break;
            case "linestep":
              path = graphics.line(null, y3, "V") + graphics.line(x2, null, "H");
              break;
            case "straight":
              path = graphics.line(x2, y3);
              break;
          }
          return path;
        };
        if (series[i][j] === null) {
          pathState = 0;
        } else {
          switch (pathState) {
            case 0:
              segmentStartX = pX;
              if (isLowerRangeAreaPath) {
                linePath = graphics.move(pX, y2Arrj[j]) + graphics.line(pX, pY);
              } else {
                linePath = graphics.move(pX, pY);
              }
              areaPath = graphics.move(pX, pY);
              if (series[i][j + 1] === null || typeof series[i][j + 1] === "undefined") {
                if (curve === "stepline" && series[i][j + 1] === null && !rangeArea) {
                  const run = graphics.line(x, null, "H");
                  linePath += run;
                  areaPath += run + graphics.line(x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                }
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j < series[i].length - 2) {
                const p = via(pathToPoint);
                linePath += p;
                areaPath += p;
                break;
              }
            // falls through
            case 1:
              if (series[i][j + 1] === null) {
                let endX = pX;
                if (isLowerRangeAreaPath) {
                  linePath += graphics.line(pX, y2);
                } else if (curve === "stepline" && !rangeArea) {
                  const run = graphics.line(x, null, "H");
                  linePath += run;
                  areaPath += run;
                  endX = x;
                } else {
                  linePath += graphics.move(pX, pY);
                }
                areaPath += graphics.line(endX, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                pathState = -1;
              } else {
                const p = via(pathToPoint);
                linePath += p;
                areaPath += p;
                if (j >= series[i].length - 2) {
                  if (isLowerRangeAreaPath) {
                    linePath += graphics.line(x, y2);
                  }
                  areaPath += graphics.line(x, areaBottomY) + graphics.line(segmentStartX, areaBottomY) + "z";
                  linePaths.push(linePath);
                  areaPaths.push(areaPath);
                  pathState = -1;
                }
              }
              break;
          }
        }
        pX = x;
        pY = y;
        break;
      }
    }
    return {
      linePaths,
      areaPaths,
      pX,
      pY,
      pathState,
      segmentStartX,
      linePath,
      areaPath
    };
  }
  /**
   * @param {any[]} series
   * @param {any} pointsPos
   * @param {number} i
   * @param {number} j
   * @param {number} realIndex
   */
  handleNullDataPoints(series, pointsPos, i, j, realIndex) {
    const w = this.w;
    if (series[i][j] === null && w.config.markers.showNullDataPoints || series[i].length === 1) {
      let pSize = this.strokeWidth - w.config.markers.strokeWidth / 2;
      if (!(pSize > 0)) {
        pSize = 0;
      }
      const elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex,
        j: j + 1,
        pSize,
        alwaysDrawMarker: true
      });
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap);
      }
    }
  }
}
_core__default.use({
  line: Line,
  area: Line,
  scatter: Line,
  bubble: Line,
  rangeArea: Line
});
export {
  default2 as default
};
