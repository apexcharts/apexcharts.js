/*!
 * ApexCharts v5.15.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const prefersReducedMotion = _core.__apex_Animations_prefersReducedMotion;
const parsePath = _core.__apex_PathMorphing_parsePath;
const BAR_FAMILY = /* @__PURE__ */ new Set(["bar", "funnel", "pyramid"]);
const RADIAL_FAMILY = /* @__PURE__ */ new Set(["pie", "donut", "polarArea", "radialBar", "gauge"]);
function familyOf(type) {
  if (BAR_FAMILY.has(type)) return "bar";
  if (RADIAL_FAMILY.has(type)) return "radial";
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
    if (tf === "radial") {
      return newSeries.every((v) => typeof v === "number");
    }
    if (tf === "bar") {
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
    if (!Environment.isBrowser()) return false;
    const animCfg = this.w.config.chart.animations;
    if (!animCfg || animCfg.enabled === false) return false;
    if (animCfg.chartTypeMorph && animCfg.chartTypeMorph.enabled === false)
      return false;
    if (animCfg.respectReducedMotion && prefersReducedMotion()) return false;
    if (!this.canMorphTypes(fromType, toType)) return false;
    if (!this.isCompatibleSeriesShape(fromType, toType, newSeries)) return false;
    const captured = this._captureFromDOM(fromType);
    if (!captured.length) return false;
    const mapping = this._buildMapping(captured, fromType, toType, newSeries);
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
    this.w.globals.previousPaths = [];
    return true;
  }
  /**
   * Walk the outgoing chart's DOM and collect path `d` strings keyed by
   * (realIndex, j). The selectors are scoped to the chart family — bar
   * elements have `pathTo` set; pie/radial elements use their final `d`.
   *
   * @param {string} fromType
   * @returns {Array<{ realIndex: number, j: number, d: string, fill: string|null }>}
   */
  _captureFromDOM(fromType) {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return [];
    const captured = [];
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
    return captured;
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
   * @param {Array<{ realIndex: number, j: number, d: string, fill: string|null }>} captured
   * @param {string} _fromType
   * @param {string} toType
   * @param {any} newSeries - the series array being passed to the new chart;
   *   used only to derive the bar target's (realIndex, j) iteration positions.
   */
  _buildMapping(captured, _fromType, toType, newSeries) {
    const map = /* @__PURE__ */ new Map();
    const tf = familyOf(toType);
    const flat = captured.slice().sort((a, b) => a.realIndex - b.realIndex || a.j - b.j);
    if (tf === "radial") {
      flat.forEach((c, i) => {
        map.set(`${i}:0`, { d: c.d, fill: c.fill });
      });
      return map;
    }
    if (tf === "bar") {
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
   * @param {number} realIndex
   * @param {number} j
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
  }
}
_core__default.registerFeatures({ morphTypeChange: MorphTypeChange });
export {
  default2 as default
};
