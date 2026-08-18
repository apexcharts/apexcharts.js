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
 * ApexCharts v6.10.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const prefersReducedMotion = _core.__apex_Animations_prefersReducedMotion;
const parsePath = _core.__apex_PathMorphing_parsePath;
function gridDivideRect(bbox, count) {
  if (!(count > 0)) return [];
  if (count === 1) return [__spreadValues({}, bbox)];
  const horizontal = bbox.width >= bbox.height;
  const rowExtent = horizontal ? bbox.width : bbox.height;
  const colExtent = horizontal ? bbox.height : bbox.width;
  const ratio = colExtent > 0 ? rowExtent / colExtent : count;
  let rows = Math.max(1, Math.ceil(Math.sqrt(ratio * count)));
  if (rows > count) rows = count;
  const baseCols = Math.floor(count / rows);
  let remainder = count - baseCols * rows;
  const cells = [];
  const rowSize = rowExtent / rows;
  let rowStart = 0;
  for (let r = 0; r < rows; r++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const colSize = cols > 0 ? colExtent / cols : 0;
    for (let c = 0; c < cols; c++) {
      cells.push(
        horizontal ? {
          x: bbox.x + rowStart,
          y: bbox.y + c * colSize,
          width: rowSize,
          height: colSize
        } : {
          x: bbox.x + c * colSize,
          y: bbox.y + rowStart,
          width: colSize,
          height: rowSize
        }
      );
    }
    rowStart += rowSize;
  }
  return cells;
}
function gridDivideShape(bbox, count, intervalsAt) {
  if (!(count > 0)) return [];
  const horizontal = bbox.width >= bbox.height;
  const rowExtent = horizontal ? bbox.width : bbox.height;
  const colExtent = horizontal ? bbox.height : bbox.width;
  const minorLo = horizontal ? bbox.y : bbox.x;
  const minorHi = minorLo + colExtent;
  const ratio = colExtent > 0 ? rowExtent / colExtent : count;
  let rows = Math.max(
    Math.ceil(Math.sqrt(ratio * count)),
    Math.ceil(rowExtent / 16)
  );
  if (!(rows >= 1)) rows = 1;
  if (rows > count) rows = count;
  const baseCols = Math.floor(count / rows);
  let remainder = count - baseCols * rows;
  const cells = [];
  const rowSize = rowExtent / rows;
  let rowStart = horizontal ? bbox.x : bbox.y;
  for (let r = 0; r < rows; r++) {
    const cols = baseCols + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    const spans = [];
    const raw = intervalsAt(rowStart, rowStart + rowSize, horizontal);
    if (Array.isArray(raw)) {
      for (let s = 0; s < raw.length; s++) {
        const iv = raw[s];
        if (!iv) continue;
        const lo = Math.max(minorLo, Math.min(iv[0], iv[1]));
        const hi = Math.min(minorHi, Math.max(iv[0], iv[1]));
        if (hi > lo) spans.push([lo, hi]);
      }
    }
    if (!spans.length) spans.push([minorLo, minorHi]);
    const totalLen = spans.reduce((a, s) => a + (s[1] - s[0]), 0);
    const exact = spans.map(
      (s) => totalLen > 0 ? (s[1] - s[0]) / totalLen * cols : cols / spans.length
    );
    const share = exact.map((v) => Math.floor(v));
    let used = share.reduce((a, b) => a + b, 0);
    const byFrac = exact.map((v, i) => ({ i, frac: v - Math.floor(v) })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; used < cols; k++, used++) {
      share[byFrac[k % byFrac.length].i]++;
    }
    for (let s = 0; s < spans.length; s++) {
      const n = share[s];
      if (n <= 0) continue;
      const lo = spans[s][0];
      const colSize = (spans[s][1] - lo) / n;
      for (let c = 0; c < n; c++) {
        cells.push(
          horizontal ? { x: rowStart, y: lo + c * colSize, width: rowSize, height: colSize } : { x: lo + c * colSize, y: rowStart, width: colSize, height: rowSize }
        );
      }
    }
    rowStart += rowSize;
  }
  return cells;
}
function hilbertIndex(x, y, minX, minY, maxX, maxY) {
  let ix = maxX === minX ? 0 : Math.round(32767 * ((x - minX) / (maxX - minX)));
  let iy = maxY === minY ? 0 : Math.round(32767 * ((y - minY) / (maxY - minY)));
  let d = 0;
  for (let s = 32768; s >= 1; s /= 2) {
    const rx = (ix & s) > 0 ? 1 : 0;
    const ry = (iy & s) > 0 ? 1 : 0;
    d += s * s * (3 * rx ^ ry);
    if (ry === 0) {
      if (rx === 1) {
        ix = s - 1 - ix;
        iy = s - 1 - iy;
      }
      const t = ix;
      ix = iy;
      iy = t;
    }
  }
  return d;
}
function sortByHilbert(items, getXY) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const pts = items.map((it) => {
    const [x, y] = getXY(it);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    return [x, y];
  });
  return items.map((item, k) => ({
    item,
    d: hilbertIndex(pts[k][0], pts[k][1], minX, minY, maxX, maxY)
  })).sort((a, b) => a.d - b.d).map((e) => e.item);
}
function parseColor(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.trim();
  if (s[0] === "#") {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        1
      ];
    }
    if (hex.length === 6 || hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      ];
    }
    return null;
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p));
    if (parts.length < 3 || parts.some((v) => !isFinite(v))) return null;
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  return null;
}
function makeColorLerp(from, to) {
  const a = parseColor(from);
  const b = parseColor(to);
  if (!a || !b) return null;
  return (t) => {
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    const al = a[3] + (b[3] - a[3]) * t;
    return al >= 1 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${al})`;
  };
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function runPieceTween({ pieces, duration, onPieceDone, onAllDone }) {
  let cancelled = false;
  const start = Date.now();
  const dur = Math.max(1, duration);
  const write = (p, e) => {
    const f = p.from;
    const t = p.to;
    const el = p.el;
    el.setAttribute("x", String(f.x + (t.x - f.x) * e));
    el.setAttribute("y", String(f.y + (t.y - f.y) * e));
    el.setAttribute("width", String(Math.max(0, f.width + (t.width - f.width) * e)));
    el.setAttribute("height", String(Math.max(0, f.height + (t.height - f.height) * e)));
    el.setAttribute("rx", String(Math.max(0, f.rx + (t.rx - f.rx) * e)));
    if (p.fill) el.setAttribute("fill", p.fill(e));
    else if (e >= 1 && p.fillEnd) el.setAttribute("fill", p.fillEnd);
  };
  const frame = () => {
    if (cancelled) return;
    const elapsed = Date.now() - start;
    let live = false;
    for (let k = 0; k < pieces.length; k++) {
      const p = pieces[k];
      if (
        /** @type {any} */
        p._done
      ) continue;
      const raw = (elapsed - p.delay) / dur;
      if (raw < 1) live = true;
      if (raw <= 0) continue;
      const t = Math.min(1, raw);
      write(p, easeInOutCubic(t));
      if (t >= 1) {
        p._done = true;
        if (onPieceDone) onPieceDone(p);
      }
    }
    if (live) BrowserAPIs.requestAnimationFrame(frame);
    else if (onAllDone) onAllDone();
  };
  BrowserAPIs.requestAnimationFrame(frame);
  return () => {
    cancelled = true;
  };
}
const BAR_FAMILY = /* @__PURE__ */ new Set(["bar", "funnel", "pyramid", "histogram"]);
const RADIAL_FAMILY = /* @__PURE__ */ new Set(["pie", "donut", "polarArea", "radialBar", "gauge"]);
const UNIT_FAMILY = /* @__PURE__ */ new Set(["unit", "waffle"]);
const PARTITION_FAMILY = /* @__PURE__ */ new Set(["treemap", "sunburst"]);
const SUMMARY_FAMILY = /* @__PURE__ */ new Set(["boxPlot", "violin"]);
const GHOST_FADE_FRACTION = 0.55;
const PIECE_BUDGET = 1500;
const PIECE_STAGGER_MAX = 300;
function familyOf(type) {
  if (BAR_FAMILY.has(type)) return "bar";
  if (RADIAL_FAMILY.has(type)) return "radial";
  if (UNIT_FAMILY.has(type)) return "unit";
  if (PARTITION_FAMILY.has(type)) return "partition";
  if (SUMMARY_FAMILY.has(type)) return "summary";
  return null;
}
class MorphTypeChange {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._snapshot = null;
    this._ghost = null;
    this._pieceLayer = null;
    this._pieceCancel = null;
  }
  /**
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  canMorphTypes(fromType, toType) {
    if (fromType === toType) return false;
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    if (!ff || !tf) return false;
    if (ff === "partition" !== (tf === "partition")) {
      return ff !== "unit" && tf !== "unit";
    }
    return true;
  }
  /**
   * @param {string} fromType
   * @param {string} toType
   * @param {any} newSeries
   * @returns {boolean}
   */
  isCompatibleSeriesShape(fromType, toType, newSeries) {
    if (!Array.isArray(newSeries) || newSeries.length === 0) return false;
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    if (tf === "unit") {
      if (newSeries.every((v) => typeof v === "number")) return true;
      return newSeries.every(
        (s) => s && typeof s === "object" && Array.isArray(s.data)
      );
    }
    if (tf === "partition") {
      return true;
    }
    if (tf === "radial") {
      if (newSeries.every((v) => typeof v === "number")) return true;
      return newSeries.length === 1 && newSeries[0] && typeof newSeries[0] === "object" && Array.isArray(newSeries[0].data);
    }
    if (tf === "bar" || tf === "summary") {
      return newSeries.every(
        (s) => s && typeof s === "object" && Array.isArray(s.data)
      );
    }
    return ff !== null && tf !== null;
  }
  /**
   * Capture the live DOM of the *current* (outgoing) chart and stash it on
   * this module. Called from `apexcharts._updateOptions` before the config
   * merge that flips `chart.type`.
   *
   * Returns true if a morph is queued — caller doesn't need the value, but
   * tests use it.
   *
   * @param {{ fromType: string, toType: string, newSeries: any }} args
   * @returns {boolean}
   */
  captureBeforeDestroy({ fromType, toType, newSeries }) {
    this._snapshot = null;
    this._removeGhost();
    this._cancelPieces();
    if (!Environment.isBrowser()) return false;
    const animCfg = this.w.config.chart.animations;
    if (!animCfg || animCfg.enabled === false) return false;
    if (animCfg.chartTypeMorph && animCfg.chartTypeMorph.enabled === false)
      return false;
    if (animCfg.respectReducedMotion && prefersReducedMotion()) return false;
    if (!this.canMorphTypes(fromType, toType)) return false;
    if (!this.isCompatibleSeriesShape(fromType, toType, newSeries)) return false;
    const { marks, branches, unitDots } = this._captureFromDOM(fromType);
    if (!marks.length) return false;
    const mapping = this._buildMapping(
      marks,
      fromType,
      toType,
      newSeries,
      branches
    );
    if (mapping.size === 0) return false;
    this._snapshot = {
      fromType,
      toType,
      mapping,
      oldLayout: {
        translateX: this.w.layout.translateX || 0,
        translateY: this.w.layout.translateY || 0
      }
    };
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    const canShape = this._canProbePaths();
    const pieceFamilies = ff === "bar" || ff === "summary" || ff === "radial" && canShape;
    if (tf === "unit" && pieceFamilies) {
      const total = this._countUnitSeries(newSeries);
      this._snapshot.pieceOut = total > 0 && total <= PIECE_BUDGET;
    } else if (ff === "unit" && (tf === "bar" || tf === "summary" || tf === "radial" && canShape)) {
      let total = 0;
      unitDots.forEach((list) => {
        total += list.length;
      });
      if (total > 0 && total <= PIECE_BUDGET) {
        this._snapshot.pieceIn = true;
        this._snapshot.sourceDots = unitDots;
        const keyOrder = [];
        if (tf === "radial") {
          (Array.isArray(newSeries) ? newSeries : []).forEach(
            (_v, i) => {
              keyOrder.push(`${i}:0`);
            }
          );
        } else {
          (Array.isArray(newSeries) ? newSeries : []).forEach(
            (s, seriesIdx) => {
              const data = s && Array.isArray(s.data) ? s.data : [];
              for (let j = 0; j < data.length; j++) {
                keyOrder.push(`${seriesIdx}:${j}`);
              }
            }
          );
        }
        this._snapshot.keyOrder = keyOrder;
      }
    }
    if (this._needsGhost(fromType, toType) && !this._snapshot.pieceOut && !this._snapshot.pieceIn) {
      this._captureGhost();
    }
    this.w.globals.previousPaths = [];
    return true;
  }
  /**
   * Whether the outgoing marks need an exit animation of their own.
   *
   * Most pairs do not. bar → pie hands every wedge the exact `d` of the bar it
   * replaces, and treemap → sunburst does the same for its tiles: the outgoing
   * mark IS the incoming mark's first frame, so it never needs to leave, and
   * drawing a copy of it would only double the image at t=0.
   *
   * The unit pairs are the exception, in both directions, because the
   * correspondence is not 1:1. Going in, one bar becomes N dots, so the bar has
   * no successor to become. Coming out, N dots become one bar: the bar does
   * grow from the cloud's footprint, but no individual dot has anywhere to go.
   * Either way something on screen simply stops existing, which is exactly the
   * hard cut that made these pairs read as "the old chart vanished and the new
   * one animated" rather than as a morph.
   *
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  _needsGhost(fromType, toType) {
    return familyOf(fromType) === "unit" || familyOf(toType) === "unit";
  }
  /**
   * Take a detached copy of the outgoing chart's marks, to be mounted over the
   * incoming chart once it exists (see `_mountGhost`).
   *
   * The whole `<svg>` is cloned and the chrome then removed from the copy,
   * rather than lifting the series groups out on their own: every mark's
   * position depends on the transforms of the groups above it, and cloning
   * from the root is what keeps those intact without re-deriving any geometry.
   *
   * The chrome is dropped because `applyChromeFade` already fades the incoming
   * axes, grid and legend in from zero. Keeping the outgoing set as well would
   * put two sets of axis labels on screen at half opacity each.
   */
  _captureGhost() {
    var _a, _b;
    const paper = (_a = this.w.dom) == null ? void 0 : _a.Paper;
    const node = paper && paper.node;
    if (!node || typeof node.cloneNode !== "function") return;
    const clone = node.cloneNode(true);
    const drop = [
      ".apexcharts-xaxis",
      ".apexcharts-yaxis",
      ".apexcharts-grid",
      ".apexcharts-gridlines-horizontal",
      ".apexcharts-gridlines-vertical",
      ".apexcharts-legend",
      ".apexcharts-title-text",
      ".apexcharts-subtitle-text",
      ".apexcharts-annotations",
      ".apexcharts-zoom-rect",
      ".apexcharts-selection-rect",
      ".apexcharts-xcrosshairs",
      ".apexcharts-ycrosshairs"
    ];
    if (typeof clone.querySelectorAll === "function") {
      drop.forEach((sel) => {
        clone.querySelectorAll(sel).forEach((el) => {
          if (el.parentNode) el.parentNode.removeChild(el);
        });
      });
    }
    if (typeof clone.querySelectorAll === "function") {
      clone.querySelectorAll("[id]").forEach((el) => {
        el.removeAttribute("id");
      });
    }
    (_b = clone.removeAttribute) == null ? void 0 : _b.call(clone, "id");
    this._ghost = clone;
  }
  /**
   * Mount the captured copy over the newly-rendered chart and fade it out.
   *
   * It goes ON TOP of the live svg, which is what makes both directions read
   * as one motion rather than as a swap. Going into a unit chart the bars
   * dissolve and the dots are uncovered already in flight, having left from
   * inside the bar that held them. Coming out of one, the dots are still there
   * to fade while the bar grows underneath them; behind the incoming mark they
   * would be hidden on the first frame, because that mark starts out exactly
   * the size of the cloud it is replacing.
   *
   * The fade runs over a fraction of the morph so the outgoing marks are gone
   * before the incoming ones settle. Holding them for the full duration leaves
   * two charts overlapping right at the moment the eye is reading the final
   * shape, which looks like a rendering fault rather than a transition.
   */
  _mountGhost() {
    var _a, _b, _c;
    const ghost = this._ghost;
    if (!ghost || !Environment.isBrowser()) return;
    const wrap = (_a = this.w.dom) == null ? void 0 : _a.elWrap;
    if (!wrap || typeof wrap.appendChild !== "function") {
      this._ghost = null;
      return;
    }
    const style = ghost.style;
    if (style) {
      style.position = "absolute";
      style.left = "0";
      style.top = "0";
      style.background = "transparent";
      style.pointerEvents = "none";
      style.opacity = "1";
    }
    (_b = ghost.setAttribute) == null ? void 0 : _b.call(ghost, "aria-hidden", "true");
    (_c = ghost.setAttribute) == null ? void 0 : _c.call(ghost, "class", "apexcharts-morph-ghost");
    wrap.appendChild(ghost);
    const speed = this.getSpeed();
    const fade = Math.max(120, Math.round(speed * GHOST_FADE_FRACTION));
    BrowserAPIs.requestAnimationFrame(() => {
      if (!style) return;
      style.transition = `opacity ${fade}ms ease-in`;
      style.opacity = "0";
    });
    setTimeout(() => this._removeGhost(), fade + 60);
  }
  /** Detach the ghost if one is mounted. Safe to call at any time. */
  _removeGhost() {
    const ghost = this._ghost;
    this._ghost = null;
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
  }
  /* ------------------------------------------------------------------ *
   * The piece layer (see MorphPieces for the geometry).
   * ------------------------------------------------------------------ */
  /**
   * Object count of an incoming unit series: one datum per dot in the object
   * form. The numeric form ([3, 5]) scales values by `plotOptions.unit
   * .unitValue`, which is not resolvable pre-merge, so it counts as zero and
   * keeps the burst-and-ghost behaviour.
   *
   * @param {any} newSeries
   * @returns {number}
   */
  _countUnitSeries(newSeries) {
    if (!Array.isArray(newSeries)) return 0;
    let total = 0;
    for (const s of newSeries) {
      if (!s || typeof s !== "object" || !Array.isArray(s.data)) return 0;
      total += s.data.length;
    }
    return total;
  }
  /**
   * Whether the incoming unit chart should hold its dots for the piece layer:
   * render them at their final slots, hidden, and let the pieces do the
   * flying. The reveal happens per dot as its piece lands.
   *
   * Consulted by the unit renderer during its draw, which runs after
   * `captureBeforeDestroy` and before `applyChromeFade`, so the decision was
   * already made from the same series the renderer is now drawing.
   *
   * @returns {boolean}
   */
  usesPieceTakeover() {
    return !!(this._snapshot && this._snapshot.pieceOut);
  }
  /**
   * Whether the piece layer claims the incoming mark at (realIndex, j): a
   * source cluster's dots will fly to it and tile it, so it must render
   * hidden and reveal only when its mosaic is complete. Consulted by the bar
   * renderer (boxPlot and violin render through it).
   *
   * @param {number|string} realIndex
   * @param {number|string} j
   * @returns {boolean}
   */
  claimsTargetMark(realIndex, j) {
    return !!(this._snapshot && this._snapshot.pieceIn && this._snapshot.mapping.has(`${realIndex}:${j}`));
  }
  /**
   * Create the overlay group the pieces are driven in. It lives INSIDE the
   * new chart's elGraphical so every coordinate matches the marks' own local
   * space, and it never takes a pointer event.
   * @returns {any} the <g> node, or null
   */
  _makePieceLayer() {
    var _a, _b;
    const graph = (_a = this.w.dom) == null ? void 0 : _a.elGraphical;
    const host = graph && graph.node;
    if (!host || typeof host.appendChild !== "function") return null;
    const g = BrowserAPIs.createElementNS("http://www.w3.org/2000/svg", "g");
    if (!g) return null;
    g.setAttribute("class", "apexcharts-morph-pieces");
    g.setAttribute("pointer-events", "none");
    const cuid = (_b = this.w.globals) == null ? void 0 : _b.cuid;
    if (cuid) g.setAttribute("clip-path", `url(#gridRectBarMask${cuid})`);
    host.appendChild(g);
    this._pieceLayer = g;
    return g;
  }
  /**
   * Reveal everything a piece takeover hid, whether or not the pieces ran.
   * The attribute is plain (no namespace colon) so it stays selectable
   * everywhere.
   */
  _revealPieceHidden() {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl || typeof baseEl.querySelectorAll !== "function") return;
    baseEl.querySelectorAll("[data-piece-hidden]").forEach(
      (el) => {
        el.removeAttribute("opacity");
        el.removeAttribute("data-piece-hidden");
      }
    );
  }
  /** Stop the piece run, drop the overlay, and reveal anything still hidden. */
  _cancelPieces() {
    if (this._pieceCancel) {
      this._pieceCancel();
      this._pieceCancel = null;
    }
    const layer = this._pieceLayer;
    this._pieceLayer = null;
    if (layer && layer.parentNode) layer.parentNode.removeChild(layer);
    this._revealPieceHidden();
  }
  /**
   * Whether this environment can hit-test path geometry at all. Decided
   * before the ghost clone is taken, because a family whose cells are only
   * honest when probed (radial) must keep the fade rather than fall back to a
   * rectangular grid it cannot justify. jsdom answers no.
   * @returns {boolean}
   */
  _canProbePaths() {
    if (!Environment.isBrowser()) return false;
    const probe = BrowserAPIs.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );
    return !!probe && typeof /** @type {any} */
    probe.isPointInFill === "function";
  }
  /**
   * A per-band ink prober over a mark's path, for gridDivideShape: given a
   * major-axis band it measures where the mark actually has ink across the
   * minor axis, so a violin's cells follow its density outline, a boxPlot's
   * whisker rows collapse to slivers, and a wedge's rows stop at the wedge
   * instead of spanning the bounding box (which stamped a rectangle over the
   * mark at frame one).
   *
   * The probe path is mounted (hidden) inside the piece layer so its user
   * space is exactly the space the cells are laid out in. The stroke test
   * catches zero-area subpaths (a boxPlot's whisker line has no fill to
   * hit), and its width is what a whisker's slivers will measure.
   *
   * Returns null when the environment cannot hit-test path geometry (jsdom);
   * the caller then keeps the plain grid.
   *
   * @param {string} d - path data, in piece-layer coordinates
   * @param {{x:number,y:number,width:number,height:number}} bbox
   * @param {any} layer - the mounted piece layer
   * @returns {{ intervalsAt: (bandLo: number, bandHi: number, horizontal: boolean) => Array<[number, number]> | null, dispose: () => void } | null}
   */
  _makeExtentProber(d, bbox, layer) {
    const doc = layer.ownerDocument;
    const probe = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    probe.setAttribute("d", d);
    probe.setAttribute("fill", "#000");
    probe.setAttribute("stroke", "#000");
    probe.setAttribute("stroke-width", "3");
    probe.setAttribute("visibility", "hidden");
    layer.appendChild(probe);
    const svg = probe.ownerSVGElement;
    if (typeof /** @type {any} */
    probe.isPointInFill !== "function" || !svg || typeof svg.createSVGPoint !== "function") {
      layer.removeChild(probe);
      return null;
    }
    const pt = svg.createSVGPoint();
    const hit = (x, y) => {
      pt.x = x;
      pt.y = y;
      const p = (
        /** @type {any} */
        probe
      );
      return p.isPointInFill(pt) || typeof p.isPointInStroke === "function" && p.isPointInStroke(pt);
    };
    const SCAN = 48;
    const intervalsAt = (bandLo, bandHi, horizontal) => {
      const lo = horizontal ? bbox.y : bbox.x;
      const hi = lo + (horizontal ? bbox.height : bbox.width);
      if (!(hi > lo)) return null;
      const at = (v, major) => horizontal ? hit(major, v) : hit(v, major);
      const majors = [
        bandLo + (bandHi - bandLo) * 0.1,
        (bandLo + bandHi) / 2,
        bandHi - (bandHi - bandLo) * 0.1
      ];
      const edge = (inside, outside, major) => {
        let a = outside;
        let b = inside;
        for (let it = 0; it < 6; it++) {
          const m = (a + b) / 2;
          if (at(m, major)) b = m;
          else a = m;
        }
        return (a + b) / 2;
      };
      const step = (hi - lo) / SCAN;
      const proof = new Array(SCAN + 1).fill(null);
      let any = false;
      for (const major of majors) {
        for (let s = 0; s <= SCAN; s++) {
          if (proof[s] !== null) continue;
          if (at(lo + s * step, major)) {
            proof[s] = major;
            any = true;
          }
        }
      }
      if (!any) return null;
      const out = [];
      let runStart = -1;
      for (let s = 0; s <= SCAN + 1; s++) {
        const inside = s <= SCAN && proof[s] !== null;
        if (inside && runStart < 0) runStart = s;
        if (!inside && runStart >= 0) {
          const last = s - 1;
          const major = (
            /** @type {number} */
            proof[runStart]
          );
          const left = runStart === 0 ? lo : edge(lo + runStart * step, lo + (runStart - 1) * step, major);
          const right = last === SCAN ? hi : edge(
            lo + last * step,
            lo + (last + 1) * step,
            /** @type {number} */
            proof[last]
          );
          if (right > left) out.push([left, right]);
          runStart = -1;
        }
      }
      return out.length ? out : null;
    };
    return {
      intervalsAt,
      dispose: () => {
        if (probe.parentNode) probe.parentNode.removeChild(probe);
      }
    };
  }
  /**
   * mark -> objects. Cut each captured mark into one cell per dot and fly
   * every cell to its dot, corners rounding off and fill blending on the way.
   * The real dots (rendered hidden by the unit chart, see usesPieceTakeover)
   * are revealed one by one as their piece lands, so the handoff is
   * geometrically exact and nothing ever fades.
   */
  _separatePieces() {
    var _a;
    const snap = this._snapshot;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!snap || !baseEl) return this._revealPieceHidden();
    const byCluster = /* @__PURE__ */ new Map();
    let total = 0;
    baseEl.querySelectorAll(".apexcharts-unit-area").forEach((dot) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      const i = parseInt((_a2 = dot.getAttribute("i")) != null ? _a2 : "", 10);
      if (isNaN(i)) return;
      const cxAttr = dot.getAttribute("cx");
      let x;
      let y;
      let r = 3;
      if (cxAttr != null) {
        x = parseFloat(cxAttr);
        y = parseFloat((_b = dot.getAttribute("cy")) != null ? _b : "");
        r = parseFloat((_c = dot.getAttribute("r")) != null ? _c : "3") || 3;
      } else {
        const wAttr = parseFloat((_d = dot.getAttribute("width")) != null ? _d : "0") || 0;
        const hAttr = parseFloat((_e = dot.getAttribute("height")) != null ? _e : "0") || 0;
        x = parseFloat((_f = dot.getAttribute("x")) != null ? _f : "") + wAttr / 2;
        y = parseFloat((_g = dot.getAttribute("y")) != null ? _g : "") + hAttr / 2;
        r = Math.max(wAttr, hAttr) / 2 || 3;
      }
      if (!isFinite(x) || !isFinite(y)) return;
      let list = byCluster.get(i);
      if (!list) {
        list = [];
        byCluster.set(i, list);
      }
      list.push({ el: dot, x, y, r, fill: dot.getAttribute("fill") });
      total++;
    });
    if (total === 0 || total > PIECE_BUDGET) return this._revealPieceHidden();
    const layer = this._makePieceLayer();
    if (!layer) return this._revealPieceHidden();
    const pieces = [];
    const doc = layer.ownerDocument;
    const sourceFam = familyOf(snap.fromType);
    const shapedSource = sourceFam === "summary" || sourceFam === "radial";
    Array.from(byCluster.keys()).sort((a, b) => a - b).forEach((i) => {
      var _a2;
      const dots = (
        /** @type {any[]} */
        byCluster.get(i)
      );
      const box = this.getInitialBBoxFor(i);
      const entry = snap.mapping.get(`${i}:0`);
      if (!box || !entry) {
        dots.forEach((d) => {
          d.el.removeAttribute("opacity");
          d.el.removeAttribute("data-piece-hidden");
        });
        return;
      }
      const markFill = entry.fill && entry.fill.indexOf("url(") !== 0 ? entry.fill : ((_a2 = this.w.globals.colors) == null ? void 0 : _a2[i]) || dots[0].fill;
      let prober = null;
      if (shapedSource) {
        const shifted = this.getInitialPathFor(i, 0);
        if (shifted) prober = this._makeExtentProber(shifted, box, layer);
      }
      const divided = prober ? gridDivideShape(box, dots.length, prober.intervalsAt) : gridDivideRect(box, dots.length);
      if (prober) prober.dispose();
      const cells = sortByHilbert(divided, (c) => [
        c.x + c.width / 2,
        c.y + c.height / 2
      ]);
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y]);
      for (let k = 0; k < ordered.length; k++) {
        const cell = cells[k];
        const dot = ordered[k];
        const el = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
        el.setAttribute("data-i", String(i));
        el.setAttribute("x", String(cell.x));
        el.setAttribute("y", String(cell.y));
        el.setAttribute("width", String(cell.width));
        el.setAttribute("height", String(cell.height));
        el.setAttribute("rx", "0");
        el.setAttribute("fill", String(markFill));
        layer.appendChild(el);
        pieces.push({
          el,
          from: { x: cell.x, y: cell.y, width: cell.width, height: cell.height, rx: 0 },
          to: {
            x: dot.x - dot.r,
            y: dot.y - dot.r,
            width: dot.r * 2,
            height: dot.r * 2,
            rx: dot.r
          },
          fill: makeColorLerp(markFill, dot.fill),
          fillEnd: dot.fill,
          delay: 0,
          meta: { dotEl: dot.el }
        });
      }
    });
    if (!pieces.length) return this._cancelPieces();
    this._runPieces(pieces, (piece) => {
      const dotEl = piece.meta.dotEl;
      dotEl.removeAttribute("opacity");
      dotEl.removeAttribute("data-piece-hidden");
      if (piece.el.parentNode) piece.el.parentNode.removeChild(piece.el);
    });
  }
  /**
   * objects -> mark. Each captured outgoing dot flies to one cell of the
   * incoming mark, squaring off and blending towards the mark's fill; the
   * mark itself (rendered hidden, see claimsTargetMark) is revealed the
   * moment its last piece lands and the mosaic is complete, which is also the
   * moment the seams disappear.
   */
  _combinePieces() {
    var _a, _b;
    const snap = this._snapshot;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!snap || !snap.sourceDots || !snap.keyOrder || !baseEl) {
      return this._revealPieceHidden();
    }
    const targets = this._collectTargetMarks(snap.toType);
    if (!targets.size) return this._revealPieceHidden();
    const dx = snap.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = snap.oldLayout.translateY - (this.w.layout.translateY || 0);
    const clusterIdx = Array.from(snap.sourceDots.keys()).sort((a, b) => a - b);
    const layer = this._makePieceLayer();
    if (!layer) return this._revealPieceHidden();
    const doc = layer.ownerDocument;
    const pieces = [];
    const targetFam = familyOf(snap.toType);
    const shapedTarget = targetFam === "summary" || targetFam === "radial";
    for (let k = 0; k < clusterIdx.length; k++) {
      const dots = (
        /** @type {any[]} */
        snap.sourceDots.get(clusterIdx[k])
      );
      const key = snap.keyOrder[k];
      const target = key ? targets.get(key) : null;
      if (!target || !dots || !dots.length) {
        if (target) {
          target.els.forEach((el) => {
            el.removeAttribute("opacity");
            el.removeAttribute("data-piece-hidden");
          });
        }
        continue;
      }
      const markFill = target.fill && target.fill.indexOf("url(") !== 0 ? target.fill : ((_b = this.w.globals.colors) == null ? void 0 : _b[target.realIndex]) || dots[0].fill;
      let prober = null;
      if (shapedTarget) {
        const d = target.d || target.els.map(
          (p) => p.getAttribute("pathTo") || p.getAttribute("d")
        ).filter(Boolean).join(" ");
        if (d) prober = this._makeExtentProber(d, target.bbox, layer);
      }
      const divided = prober ? gridDivideShape(target.bbox, dots.length, prober.intervalsAt) : gridDivideRect(target.bbox, dots.length);
      if (prober) prober.dispose();
      const cells = sortByHilbert(divided, (c) => [
        c.x + c.width / 2,
        c.y + c.height / 2
      ]);
      const ordered = sortByHilbert(dots, (d) => [d.x, d.y]);
      const markState = { remaining: ordered.length, els: target.els, tiles: (
        /** @type {any[]} */
        []
      ) };
      for (let m = 0; m < ordered.length; m++) {
        const dot = ordered[m];
        const cell = cells[m];
        const el = doc.createElementNS("http://www.w3.org/2000/svg", "rect");
        const fx = dot.x + dx - dot.r;
        const fy = dot.y + dy - dot.r;
        el.setAttribute("data-key", key);
        el.setAttribute("x", String(fx));
        el.setAttribute("y", String(fy));
        el.setAttribute("width", String(dot.r * 2));
        el.setAttribute("height", String(dot.r * 2));
        el.setAttribute("rx", String(dot.r));
        el.setAttribute("fill", String(dot.fill || markFill));
        layer.appendChild(el);
        markState.tiles.push(el);
        pieces.push({
          el,
          from: { x: fx, y: fy, width: dot.r * 2, height: dot.r * 2, rx: dot.r },
          to: { x: cell.x, y: cell.y, width: cell.width, height: cell.height, rx: 0 },
          fill: makeColorLerp(dot.fill, markFill),
          fillEnd: String(markFill),
          delay: 0,
          meta: { markState }
        });
      }
    }
    if (!pieces.length) return this._cancelPieces();
    this._runPieces(pieces, (piece) => {
      const state = piece.meta.markState;
      state.remaining--;
      if (state.remaining === 0) {
        state.els.forEach((el) => {
          el.removeAttribute("opacity");
          el.removeAttribute("data-piece-hidden");
        });
        state.tiles.forEach((t) => {
          if (t.parentNode) t.parentNode.removeChild(t);
        });
      }
    });
  }
  /**
   * Stagger and start a piece run. Delays sweep the (already spatially
   * sorted) list front to back, and the last piece still lands within the
   * configured morph speed.
   *
   * @param {import('./MorphPieces').Piece[]} pieces
   * @param {(piece: import('./MorphPieces').Piece) => void} onPieceDone
   */
  _runPieces(pieces, onPieceDone) {
    const speed = this.getSpeed();
    const stagger = Math.min(PIECE_STAGGER_MAX, speed * 0.35);
    const flight = Math.max(180, speed - stagger);
    for (let k = 0; k < pieces.length; k++) {
      pieces[k].delay = pieces.length > 1 ? k / (pieces.length - 1) * stagger : 0;
    }
    this._pieceCancel = runPieceTween({
      pieces,
      duration: flight,
      onPieceDone,
      onAllDone: () => {
        this._pieceCancel = null;
        this._cancelPieces();
      }
    });
  }
  /**
   * The incoming chart's marks, read live: every `path[pathTo]` grouped into
   * one mark per (realIndex, j), with the union bbox of its final geometry.
   * Bar marks are one path each; summary marks (boxPlot, violin) may be
   * several, walked exactly like the capture branch walks the outgoing ones.
   *
   * @param {string} toType
   * @returns {Map<string, { realIndex: number, j: number, bbox: {x:number,y:number,width:number,height:number}, fill: string|null, els: any[], d?: string }>}
   */
  _collectTargetMarks(toType) {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    const out = /* @__PURE__ */ new Map();
    if (!baseEl) return out;
    const fam = familyOf(toType);
    if (fam === "radial") {
      baseEl.querySelectorAll(".apexcharts-pie-series .apexcharts-pie-area").forEach((p, i) => {
        const d = p.getAttribute("data:pathFinal") || p.getAttribute("d");
        if (!d || !d.trim()) return;
        const box = this._pathBBox(d);
        if (!box) return;
        out.set(`${i}:0`, {
          realIndex: i,
          j: 0,
          d,
          bbox: {
            x: box.minX,
            y: box.minY,
            width: box.maxX - box.minX,
            height: box.maxY - box.minY
          },
          fill: p.getAttribute("fill"),
          els: [p]
        });
      });
      return out;
    }
    const wrapClass = fam === "summary" ? `.apexcharts-${toType}-series` : ".apexcharts-bar-series";
    baseEl.querySelectorAll(`${wrapClass} .apexcharts-series`).forEach((group) => {
      var _a2;
      const realIndex = parseInt((_a2 = group.getAttribute("data:realIndex")) != null ? _a2 : "0", 10) || 0;
      let order = 0;
      group.querySelectorAll("path[pathTo]").forEach((p) => {
        var _a3;
        const d = p.getAttribute("pathTo") || p.getAttribute("d");
        if (!d || !d.trim()) return;
        const jAttr = parseInt((_a3 = p.getAttribute("j")) != null ? _a3 : "", 10);
        const j = isNaN(jAttr) ? order++ : jAttr;
        const box = this._pathBBox(d);
        if (!box) return;
        const key = `${realIndex}:${j}`;
        const prev = out.get(key);
        if (prev) {
          prev.els.push(p);
          prev.bbox = {
            x: Math.min(prev.bbox.x, box.minX),
            y: Math.min(prev.bbox.y, box.minY),
            width: Math.max(prev.bbox.x + prev.bbox.width, box.maxX) - Math.min(prev.bbox.x, box.minX),
            height: Math.max(prev.bbox.y + prev.bbox.height, box.maxY) - Math.min(prev.bbox.y, box.minY)
          };
        } else {
          out.set(key, {
            realIndex,
            j,
            bbox: {
              x: box.minX,
              y: box.minY,
              width: box.maxX - box.minX,
              height: box.maxY - box.minY
            },
            fill: p.getAttribute("fill"),
            els: [p]
          });
        }
      });
    });
    return out;
  }
  /**
   * Walk the outgoing chart's DOM and collect path `d` strings keyed by
   * (realIndex, j). The selectors are scoped to the chart family — bar
   * elements have `pathTo` set; pie/radial elements use their final `d`.
   *
   * @param {string} fromType
   * @returns {{ marks: Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>, branches: Array<{ key: string, d: string, fill: string|null }>, unitDots: Map<number, Array<{x:number,y:number,r:number,fill:string|null}>> }}
   */
  _captureFromDOM(fromType) {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return { marks: [], branches: [], unitDots: /* @__PURE__ */ new Map() };
    const captured = [];
    const branches = [];
    const unitDots = /* @__PURE__ */ new Map();
    const fam = familyOf(fromType);
    if (fam === "bar") {
      const seriesNodes = baseEl.querySelectorAll(
        ".apexcharts-bar-series .apexcharts-series"
      );
      seriesNodes.forEach((seriesNode) => {
        var _a2;
        const realIndex = parseInt(
          (_a2 = seriesNode.getAttribute("data:realIndex")) != null ? _a2 : "0",
          10
        );
        const paths = seriesNode.querySelectorAll("path[pathTo]");
        paths.forEach((p, j) => {
          const d = p.getAttribute("pathTo") || p.getAttribute("d");
          if (!d) return;
          captured.push({
            realIndex,
            j,
            d,
            fill: p.getAttribute("fill")
          });
        });
      });
    } else if (fam === "summary") {
      const byMark = /* @__PURE__ */ new Map();
      baseEl.querySelectorAll(`.apexcharts-${fromType}-area`).forEach((p) => {
        var _a2, _b;
        const j = parseInt((_a2 = p.getAttribute("j")) != null ? _a2 : "", 10);
        if (isNaN(j)) return;
        const d = p.getAttribute("pathTo") || p.getAttribute("d");
        if (!d || !d.trim()) return;
        const group = typeof p.closest === "function" ? p.closest(".apexcharts-series") : null;
        const realIndex = parseInt((_b = group == null ? void 0 : group.getAttribute("data:realIndex")) != null ? _b : "0", 10) || 0;
        const key = `${realIndex}:${j}`;
        const prev = byMark.get(key);
        if (prev) prev.d += ` ${d}`;
        else byMark.set(key, { realIndex, j, d, fill: p.getAttribute("fill") });
      });
      Array.from(byMark.values()).sort((a, b) => a.realIndex - b.realIndex || a.j - b.j).forEach((m) => captured.push(m));
    } else if (fam === "partition") {
      if (fromType === "treemap") {
        const rectPath = (el) => {
          var _a2, _b, _c, _d;
          const x = parseFloat((_a2 = el.getAttribute("x")) != null ? _a2 : "");
          const y = parseFloat((_b = el.getAttribute("y")) != null ? _b : "");
          const width = parseFloat((_c = el.getAttribute("width")) != null ? _c : "");
          const height = parseFloat((_d = el.getAttribute("height")) != null ? _d : "");
          if (![x, y, width, height].every((v) => isFinite(v))) return null;
          return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
        };
        const tiles = baseEl.querySelectorAll(".apexcharts-treemap-rect");
        tiles.forEach((t) => {
          var _a2, _b;
          const d = rectPath(t);
          if (!d) return;
          captured.push({
            realIndex: parseInt((_a2 = t.getAttribute("i")) != null ? _a2 : "0", 10) || 0,
            j: parseInt((_b = t.getAttribute("j")) != null ? _b : "0", 10) || 0,
            d,
            fill: t.getAttribute("fill"),
            key: t.getAttribute("data:key") || null
          });
        });
        const containers = baseEl.querySelectorAll(
          ".apexcharts-treemap-parent-rect"
        );
        containers.forEach((c) => {
          const d = rectPath(c);
          const key = c.getAttribute("data:key");
          if (!d || !key) return;
          branches.push({ key, d, fill: c.getAttribute("fill") });
        });
      } else {
        const arcs = baseEl.querySelectorAll(".apexcharts-sunburst-arc");
        const leaves = [];
        arcs.forEach((a) => {
          if (a.getAttribute("data:leaf") === "true") leaves.push(a);
        });
        const source = leaves.length ? leaves : Array.from(arcs);
        source.forEach((a, i) => {
          const d = a.getAttribute("d");
          if (!d || !d.trim()) return;
          captured.push({
            realIndex: i,
            j: 0,
            d,
            fill: a.getAttribute("fill"),
            key: a.getAttribute("data:key") || null
          });
        });
        arcs.forEach((a) => {
          if (a.getAttribute("data:leaf") === "true") return;
          const d = a.getAttribute("d");
          const key = a.getAttribute("data:key");
          if (!d || !d.trim() || !key) return;
          branches.push({ key, d, fill: a.getAttribute("fill") });
        });
      }
    } else if (fam === "unit") {
      const dots = baseEl.querySelectorAll(".apexcharts-unit-area");
      const boxes = /* @__PURE__ */ new Map();
      dots.forEach((dot) => {
        var _a2, _b, _c, _d, _e, _f, _g;
        const i = parseInt((_a2 = dot.getAttribute("i")) != null ? _a2 : "", 10);
        if (isNaN(i)) return;
        const cxAttr = dot.getAttribute("cx");
        let x;
        let y;
        let r = 3;
        if (cxAttr != null) {
          x = parseFloat(cxAttr);
          y = parseFloat((_b = dot.getAttribute("cy")) != null ? _b : "");
          r = parseFloat((_c = dot.getAttribute("r")) != null ? _c : "3") || 3;
        } else {
          const wAttr = parseFloat((_d = dot.getAttribute("width")) != null ? _d : "0") || 0;
          const hAttr = parseFloat((_e = dot.getAttribute("height")) != null ? _e : "0") || 0;
          x = parseFloat((_f = dot.getAttribute("x")) != null ? _f : "") + wAttr / 2;
          y = parseFloat((_g = dot.getAttribute("y")) != null ? _g : "") + hAttr / 2;
          r = Math.max(wAttr, hAttr) / 2 || 3;
        }
        if (!isFinite(x) || !isFinite(y)) return;
        let list = unitDots.get(i);
        if (!list) {
          list = [];
          unitDots.set(i, list);
        }
        list.push({ x, y, r, fill: dot.getAttribute("fill") });
        const box = boxes.get(i);
        if (!box) {
          boxes.set(i, {
            minX: x,
            minY: y,
            maxX: x,
            maxY: y,
            fill: dot.getAttribute("fill")
          });
          return;
        }
        if (x < box.minX) box.minX = x;
        if (x > box.maxX) box.maxX = x;
        if (y < box.minY) box.minY = y;
        if (y > box.maxY) box.maxY = y;
      });
      Array.from(boxes.keys()).sort((a, b) => a - b).forEach((i) => {
        const b = (
          /** @type {any} */
          boxes.get(i)
        );
        const pad = 2;
        const x1 = b.minX - pad;
        const y1 = b.minY - pad;
        const x2 = b.maxX + pad;
        const y2 = b.maxY + pad;
        captured.push({
          realIndex: i,
          j: 0,
          d: `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`,
          fill: b.fill
        });
      });
    } else if (fam === "radial") {
      if (fromType === "radialBar" || fromType === "gauge") {
        const centerX = this.w.layout.gridWidth / 2;
        const centerY = Math.min(this.w.layout.gridWidth, this.w.layout.gridHeight) / 2;
        const rings = baseEl.querySelectorAll(
          ".apexcharts-radial-series .apexcharts-radialbar-area"
        );
        rings.forEach((p) => {
          var _a2;
          const parent = (
            /** @type {Element|null} */
            p.parentElement
          );
          const realIndex = parseInt(
            (_a2 = parent == null ? void 0 : parent.getAttribute("data:realIndex")) != null ? _a2 : "0",
            10
          );
          const rawD = p.getAttribute("d");
          if (!rawD) return;
          const strokeWidth = parseFloat(p.getAttribute("stroke-width") || "0");
          const d = strokeWidth > 1 ? this._radialArcToFilledSegment(
            rawD,
            strokeWidth,
            centerX,
            centerY
          ) || rawD : rawD;
          captured.push({
            realIndex,
            j: 0,
            d,
            fill: p.getAttribute("stroke")
          });
        });
      } else {
        const slices = baseEl.querySelectorAll(
          ".apexcharts-pie-series .apexcharts-pie-area"
        );
        slices.forEach(
          (p, i) => {
            const d = p.getAttribute("d");
            if (!d) return;
            captured.push({
              realIndex: i,
              j: 0,
              d,
              fill: p.getAttribute("fill")
            });
          }
        );
      }
    }
    return { marks: captured, branches, unitDots };
  }
  /**
   * Convert a radialBar's stroked open-arc `d` ("M x1 y1 A r r 0 large sweep
   * x2 y2") into a closed donut-segment polygon whose FILLED rendering
   * visually matches the original stroked arc — needed because the morph
   * target (pie/donut/polarArea) renders by fill, not stroke. Returns null
   * if the input doesn't match the expected M-then-A shape.
   *
   * @param {string} rawD
   * @param {number} strokeWidth
   * @param {number} centerX
   * @param {number} centerY
   * @returns {string | null}
   */
  _radialArcToFilledSegment(rawD, strokeWidth, centerX, centerY) {
    const m = rawD.match(
      /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+A\s*(-?[\d.]+)\s+(?:-?[\d.]+)\s+(?:-?[\d.]+)\s+(\d)\s+(\d)\s+(-?[\d.]+)\s+(-?[\d.]+)/
    );
    if (!m) return null;
    const x1 = parseFloat(m[1]);
    const y1 = parseFloat(m[2]);
    const r = parseFloat(m[3]);
    const large = parseInt(m[4], 10);
    const sweep = parseInt(m[5], 10);
    const x2 = parseFloat(m[6]);
    const y2 = parseFloat(m[7]);
    if (!isFinite(r) || r <= 0) return null;
    const half = strokeWidth / 2;
    const rOuter = r + half;
    const rInner = Math.max(0, r - half);
    const proj = (px, py, newR) => {
      const dx = px - centerX;
      const dy = py - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return { x: centerX, y: centerY };
      const k = newR / dist;
      return { x: centerX + dx * k, y: centerY + dy * k };
    };
    const o1 = proj(x1, y1, rOuter);
    const o2 = proj(x2, y2, rOuter);
    const i1 = proj(x1, y1, rInner);
    const i2 = proj(x2, y2, rInner);
    const sweepBack = sweep ? 0 : 1;
    return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${rInner} ${rInner} 0 ${large} ${sweepBack} ${i1.x} ${i1.y} Z`;
  }
  /**
   * Build a closed donut-segment path for the given polar arc geometry. Used
   * by Radial.drawArcs when morphing FROM a filled wedge (pie/donut/polarArea)
   * TO a radialBar arc: the final radialBar is rendered as a stroked open arc,
   * but during the morph we tween d toward this closed-segment form (which
   * looks identical to the stroked arc when filled with the same color) so
   * the in-between frames remain visually consistent filled shapes rather
   * than a thick-outlined wedge.
   *
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} ringRadius - centerline radius of the radialBar ring
   * @param {number} strokeWidth - the ring's stroke thickness
   * @param {number} startAngleDeg - in degrees, 0° = top (12 o'clock)
   * @param {number} endAngleDeg
   * @returns {string}
   */
  buildRingSegmentPath(centerX, centerY, ringRadius, strokeWidth, startAngleDeg, endAngleDeg) {
    const halfStroke = strokeWidth / 2;
    const rOuter = ringRadius + halfStroke;
    const rInner = Math.max(0, ringRadius - halfStroke);
    const sRad = (startAngleDeg - 90) * Math.PI / 180;
    const eRad = (endAngleDeg - 90) * Math.PI / 180;
    const oStart = {
      x: centerX + rOuter * Math.cos(sRad),
      y: centerY + rOuter * Math.sin(sRad)
    };
    const oEnd = {
      x: centerX + rOuter * Math.cos(eRad),
      y: centerY + rOuter * Math.sin(eRad)
    };
    const iStart = {
      x: centerX + rInner * Math.cos(sRad),
      y: centerY + rInner * Math.sin(sRad)
    };
    const iEnd = {
      x: centerX + rInner * Math.cos(eRad),
      y: centerY + rInner * Math.sin(eRad)
    };
    const sweep = endAngleDeg > startAngleDeg ? 1 : 0;
    const large = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
    return `M ${oStart.x} ${oStart.y} A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} A ${rInner} ${rInner} 0 ${large} ${1 - sweep} ${iStart.x} ${iStart.y} Z`;
  }
  /**
   * @returns {string | null} the chart-type the active snapshot was captured
   *   from, or null when no morph is in flight.
   */
  getFromType() {
    return this._snapshot ? this._snapshot.fromType : null;
  }
  /**
   * Build a (targetKey → captured) map. The targetKey matches the lookup
   * pattern each chart-type renderer uses when it asks
   * `getInitialPathFor(realIndex, j)`.
   *
   * Strategy: flatten the captured items into a linear sequence (matching the
   * source chart's natural DOM iteration order: series-then-point for bar,
   * ring-by-ring for radial), then walk the target's iteration positions in
   * the same order and pair them up 1:1. This handles every supported shape
   * without per-pair branching:
   *
   *   - bar (1 series, N pts) ↔ radial-family (N items)  → linear[k] ↔ k
   *   - bar (M series, 1 pt)  ↔ radial-family (M items)  → linear[k] ↔ k
   *   - radial-family (N items) ↔ bar (any matching shape) → linear[k] ↔ flat target
   *   - radial-family ↔ radial-family                    → linear[k] ↔ k
   *
   * @param {Array<{ realIndex: number, j: number, d: string, fill: string|null, key?: string|null }>} captured
   * @param {string} _fromType
   * @param {string} toType
   * @param {any} newSeries - the series array being passed to the new chart;
   *   used only to derive the bar target's (realIndex, j) iteration positions.
   * @param {Array<{ key: string, d: string, fill: string|null }>} [branches]
   *   non-leaf marks, for the key-based partition pairing.
   */
  _buildMapping(captured, _fromType, toType, newSeries, branches) {
    const map = /* @__PURE__ */ new Map();
    const tf = familyOf(toType);
    const flat = captured.slice().sort((a, b) => a.realIndex - b.realIndex || a.j - b.j);
    if (tf === "partition" && branches && branches.length) {
      const keyedMarks = flat.filter((c) => c.key);
      if (keyedMarks.length === flat.length) {
        keyedMarks.forEach((c) => {
          map.set(`key:${c.key}`, { d: c.d, fill: c.fill });
        });
        branches.forEach((br) => {
          map.set(`key:${br.key}`, { d: br.d, fill: br.fill });
        });
      }
    }
    if (tf === "radial" || tf === "unit" || tf === "partition") {
      flat.forEach((c, i) => {
        map.set(`${i}:0`, { d: c.d, fill: c.fill });
      });
      return map;
    }
    if (tf === "bar" || tf === "summary") {
      const positions = [];
      const series = Array.isArray(newSeries) ? newSeries : [];
      series.forEach((s, seriesIdx) => {
        const data = s && Array.isArray(s.data) ? s.data : [];
        for (let j = 0; j < data.length; j++) {
          positions.push({ realIndex: seriesIdx, j });
        }
      });
      flat.forEach((c, i) => {
        const pos = positions[i];
        if (pos) {
          map.set(`${pos.realIndex}:${pos.j}`, { d: c.d, fill: c.fill });
        }
      });
      return map;
    }
    return map;
  }
  isActive() {
    return this._snapshot !== null;
  }
  /**
   * @param {number|string} realIndex
   * @param {number|string} j
   * @returns {string | null}
   */
  getInitialPathFor(realIndex, j) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`);
    if (!entry) return null;
    const dx = this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0);
    return dx === 0 && dy === 0 ? entry.d : this._translatePathD(entry.d, dx, dy);
  }
  /**
   * Offset every absolute coordinate in an SVG path `d` by (dx, dy).
   *
   * Assumes the path uses only uppercase (absolute) commands — every path
   * ApexCharts generates does. Relative-command paths would pass through
   * unchanged at the lowercase, which is also semantically correct (deltas
   * don't shift under a parent translate).
   *
   * @param {string} d
   * @param {number} dx
   * @param {number} dy
   * @returns {string}
   */
  _translatePathD(d, dx, dy) {
    if (dx === 0 && dy === 0) return d;
    const commands = parsePath(d);
    return commands.map(
      /** @param {any[]} c */
      (c) => {
        const cmd = c[0];
        if (cmd === "Z") return "Z";
        if (cmd === "M" || cmd === "L" || cmd === "T") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy}`;
        }
        if (cmd === "H") return `${cmd} ${c[1] + dx}`;
        if (cmd === "V") return `${cmd} ${c[1] + dy}`;
        if (cmd === "C") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy} ${c[5] + dx} ${c[6] + dy}`;
        }
        if (cmd === "S" || cmd === "Q") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy}`;
        }
        if (cmd === "A") {
          return `${cmd} ${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6] + dx} ${c[7] + dy}`;
        }
        return c.join(" ");
      }
    ).join(" ");
  }
  /**
   * The centre point (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. Kept for callers that only need a point; the unit renderer
   * uses getInitialBBoxFor so its dots fill the shape rather than stack on a
   * single point.
   * @param {number} i
   * @returns {{ x: number, y: number } | null}
   */
  getInitialCenterFor(i) {
    const box = this.getInitialBBoxFor(i);
    if (!box) return null;
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  /**
   * The `k`-th captured path in draw order, already shifted into the NEW
   * chart's coordinate space.
   *
   * For marks that pair up by position rather than by a (series, point) grid:
   * a treemap's tiles and a sunburst's leaves are each one mark per row, laid
   * out in the same reading order, so the k-th of one becomes the k-th of the
   * other.
   *
   * @param {number} k
   * @returns {string | null}
   */
  getInitialPathAt(k) {
    return this.getInitialPathFor(k, 0);
  }
  /**
   * The captured shape for a branch identity (charts/common/Hierarchy.morphKey),
   * or null when the outgoing chart had no mark for that branch.
   *
   * This is what lets a partition morph pair at every level: a sector, an
   * industry and a company each find the arc or tile that stood for the same
   * branch, instead of leaves pairing by draw order while the containers pop.
   *
   * @param {string} key
   * @returns {string | null}
   */
  getInitialPathForKey(key) {
    if (!this._snapshot || !key) return null;
    return this.getInitialPathFor("key", key);
  }
  /** True when the active snapshot can pair by branch key. */
  hasKeyedMarks() {
    if (!this._snapshot) return false;
    for (const k of this._snapshot.mapping.keys()) {
      if (typeof k === "string" && k.startsWith("key:")) return true;
    }
    return false;
  }
  /**
   * Where the `j`-th of `n` objects in cluster `i` starts, INSIDE the shape it
   * came out of.
   *
   * An aggregate mark stands for a quantity, and its extent is that quantity: a
   * bar of height h representing n units gives its k-th unit the height
   * fraction (k + 0.5)/n. So a bar does not spray its dots from a single point,
   * it comes apart along its own length, bottom-up, and each dot leaves from
   * the part of the bar that was standing for it. The reverse direction reads
   * the same geometry, so explode and collapse are inverses.
   *
   * The distribution follows the captured shape's LONGER axis, which is what
   * makes one function serve both marks: a bar's box is tall and thin, so the
   * dots leave in a column; a wedge's box is squat, so they leave in a row
   * across it.
   *
   * @param {number} i - cluster index
   * @param {number} j - the object's rank within its cluster
   * @param {number} n - objects in the cluster
   * @returns {{ x: number, y: number } | null}
   */
  getInitialSlotFor(i, j, n) {
    const box = this.getInitialBBoxFor(i);
    if (!box) return null;
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    if (!(n > 1) || !(j >= 0)) return { x: cx, y: cy };
    const t = (Math.min(j, n - 1) + 0.5) / n;
    if (box.height >= box.width) {
      return { x: cx, y: box.y + box.height * (1 - t) };
    }
    return { x: box.x + box.width * t, y: cy };
  }
  /**
   * The bounding box (in the NEW chart's screen space) of the captured shape
   * for cluster `i`. `getInitialSlotFor` distributes a cluster's objects across
   * this box as their start positions, so a tall bar visibly breaks apart into
   * a tall column of dots that then swarm into the cluster.
   * @param {number} i
   * @returns {{ x: number, y: number, width: number, height: number } | null}
   */
  getInitialBBoxFor(i) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${i}:0`);
    if (!entry) return null;
    const box = this._pathBBox(entry.d);
    if (!box) return null;
    const dx = this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0);
    return {
      x: box.minX + dx,
      y: box.minY + dy,
      width: box.maxX - box.minX,
      height: box.maxY - box.minY
    };
  }
  /**
   * Bounding box of an absolute-command SVG path `d`. Good enough as the burst
   * footprint (we only need where the shape sat, not exact geometry).
   * @param {string} d
   * @returns {{ minX:number, minY:number, maxX:number, maxY:number } | null}
   */
  _pathBBox(d) {
    const commands = parsePath(d);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let seen = false;
    commands.forEach(
      /** @param {any[]} c */
      (c) => {
        const cmd = c[0];
        if (cmd === "Z") return;
        let pairs = [];
        if (cmd === "H") pairs = [[c[1], (minY + maxY) / 2 || c[1]]];
        else if (cmd === "V") pairs = [[(minX + maxX) / 2 || c[1], c[1]]];
        else if (cmd === "A") pairs = [[c[6], c[7]]];
        else {
          for (let k = 1; k + 1 < c.length; k += 2) pairs.push([c[k], c[k + 1]]);
        }
        pairs.forEach(([x, y]) => {
          if (!isFinite(x) || !isFinite(y)) return;
          seen = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      }
    );
    if (!seen) return null;
    return { minX, minY, maxX, maxY };
  }
  /**
   * @param {number} realIndex
   * @param {number} j
   * @returns {string | null}
   */
  getInitialFillFor(realIndex, j) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`);
    return entry ? entry.fill : null;
  }
  /** @returns {number} */
  getSpeed() {
    const animCfg = this.w.config.chart.animations;
    return animCfg.chartTypeMorph && animCfg.chartTypeMorph.speed || animCfg.speed || 600;
  }
  /**
   * Fade newly-mounted axes / grid / legend / titles from opacity 0 → 1 in
   * parallel with the morph. Without this the chart's chrome would pop in
   * abruptly while the series elements are still mid-tween, which reads as a
   * jarring layout shift.
   */
  applyChromeFade() {
    var _a;
    if (!this._snapshot || !Environment.isBrowser()) return;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return;
    if (this._snapshot.pieceOut) this._separatePieces();
    else if (this._snapshot.pieceIn) this._combinePieces();
    else this._mountGhost();
    const speed = this.getSpeed();
    const chromeSelectors = [
      ".apexcharts-xaxis",
      ".apexcharts-yaxis",
      ".apexcharts-grid",
      ".apexcharts-gridlines-horizontal",
      ".apexcharts-gridlines-vertical",
      ".apexcharts-legend",
      ".apexcharts-title-text",
      ".apexcharts-subtitle-text"
    ];
    chromeSelectors.forEach((sel) => {
      baseEl.querySelectorAll(sel).forEach((el) => {
        if (!el.style) return;
        el.style.opacity = "0";
        el.style.transition = `opacity ${speed}ms ease-out`;
        BrowserAPIs.requestAnimationFrame(() => {
          el.style.opacity = "1";
        });
        setTimeout(() => {
          el.style.transition = "";
          el.style.opacity = "";
        }, speed + 80);
      });
    });
    setTimeout(() => this.cleanup(), speed + 100);
  }
  cleanup() {
    this._snapshot = null;
    this._removeGhost();
    this._cancelPieces();
  }
}
_core__default.registerFeatures({ morphTypeChange: MorphTypeChange });
export {
  default2 as default
};
