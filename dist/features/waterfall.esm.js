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
const Environment = _core.__apex_Environment_Environment;
class Waterfall {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
  }
  /** @returns {boolean} */
  isActive() {
    return this.w.config.chart.requestedType === "waterfall";
  }
  /**
   * Draw (or redraw) the connector layer into the graphical group.
   *
   * Called from both render paths and safe to call on a chart that is not a
   * waterfall, has connectors switched off, or drew no columns.
   */
  drawConnectors() {
    var _a, _b;
    const w = this.w;
    if (!this.isActive()) return;
    const cfg = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.waterfall) == null ? void 0 : _b.connectors;
    if (!cfg || cfg.show === false) return;
    const host = w.dom.elGraphical;
    const geo = w.waterfallData && w.waterfallData.geometry;
    if (!host || !geo) return;
    this.removeConnectors();
    const graphics = new Graphics(w, this.ctx);
    const group = graphics.group({ class: "apexcharts-waterfall-connectors" });
    const color = cfg.color || w.config.grid.borderColor;
    const strokeWidth = cfg.strokeWidth == null ? 1 : cfg.strokeWidth;
    const dashArray = cfg.strokeDashArray == null ? 3 : cfg.strokeDashArray;
    let drawn = 0;
    for (let i = 0; i < geo.length; i++) {
      const bars = geo[i];
      if (!Array.isArray(bars)) continue;
      for (let j = 0; j < bars.length - 1; j++) {
        const a = bars[j];
        const b = bars[j + 1];
        if (!a || !b) continue;
        const gap = b.slotStart - a.slotEnd;
        if (!(gap > 0.5)) continue;
        const line = a.horizontal ? graphics.drawLine(
          a.levelEnd,
          a.slotEnd,
          a.levelEnd,
          b.slotStart,
          color,
          dashArray,
          strokeWidth
        ) : graphics.drawLine(
          a.slotEnd,
          a.levelEnd,
          b.slotStart,
          a.levelEnd,
          color,
          dashArray,
          strokeWidth
        );
        line.node.classList.add("apexcharts-waterfall-connector");
        group.add(line);
        drawn++;
      }
    }
    if (!drawn) return;
    group.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
    const xaxisEl = host.node.querySelector(".apexcharts-xaxis");
    if (xaxisEl) {
      host.node.insertBefore(group.node, xaxisEl);
    } else {
      host.add(group);
    }
    this.holdUntilBarsLand(group);
  }
  /** Drop the connector layer, if one is present. */
  removeConnectors() {
    const host = this.w.dom.elGraphical;
    const prev = host && host.node.querySelector(".apexcharts-waterfall-connectors");
    if (prev && prev.parentNode) prev.parentNode.removeChild(prev);
  }
  /**
   * Connectors describe where the bars END UP, so drawn at full opacity while
   * the bars are still growing they hang in mid-air over nothing. Held hidden
   * and faded in with the rest of the delayed chrome once the bars land.
   *
   * When there is no animation to wait for, `showDelayedElements` has already
   * run for this render, so registering would leave the layer hidden for good.
   *
   * @param {any} group
   */
  holdUntilBarsLand(group) {
    const w = this.w;
    const animate = Environment.isBrowser() && w.globals.shouldAnimate && !w.globals.animationEnded;
    if (!animate) return;
    group.node.classList.add("apexcharts-element-hidden");
    w.globals.delayedElements.push({ el: group.node, holdUntilComplete: true });
  }
}
const Utils = _core.__apex_Utils;
function readDatum(d, j, categories) {
  const fallbackX = categories && categories[j] !== void 0 ? categories[j] : j + 1;
  if (d == null) {
    return {
      x: fallbackX,
      y: null,
      isSubtotal: false,
      isTotal: false,
      rest: {}
    };
  }
  if (Array.isArray(d)) {
    return {
      x: d[0] !== void 0 ? d[0] : fallbackX,
      y: d[1],
      isSubtotal: false,
      isTotal: false,
      rest: {}
    };
  }
  if (typeof d === "object") {
    return {
      x: d.x !== void 0 ? d.x : fallbackX,
      y: d.y,
      isSubtotal: d.isSubtotal === true,
      isTotal: d.isTotal === true,
      rest: d
    };
  }
  return { x: fallbackX, y: d, isSubtotal: false, isTotal: false, rest: {} };
}
function isPrecomputed(data) {
  for (let j = 0; j < data.length; j++) {
    const d = data[j];
    const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
    if (Array.isArray(y) && y.length === 2) return true;
  }
  return false;
}
function fillFor(datum, kind, colors) {
  if (datum && datum.fillColor) return datum.fillColor;
  const c = colors[kind];
  return typeof c === "string" && c ? c : void 0;
}
function accumulate(data, categories, colors) {
  const rows = [];
  const values = [];
  const cumulative = [];
  const kinds = [];
  let running = 0;
  let cut = 0;
  for (let j = 0; j < data.length; j++) {
    const { x, y, isSubtotal, isTotal, rest } = readDatum(
      data[j],
      j,
      categories
    );
    let start;
    let end;
    let kind;
    if (isTotal || isSubtotal) {
      start = isTotal ? 0 : cut;
      end = running;
      kind = isTotal ? "total" : "subtotal";
      cut = running;
    } else {
      const delta = Utils.parseNumber(y);
      if (delta === null || !isFinite(delta)) {
        rows.push(__spreadProps(__spreadValues({}, rest), { x, y: null }));
        values.push(null);
        cumulative.push(running);
        kinds.push(null);
        continue;
      }
      start = running;
      end = running + delta;
      running = end;
      kind = delta < 0 ? "negative" : "positive";
    }
    const fill = fillFor(rest, kind, colors);
    rows.push(__spreadValues(__spreadProps(__spreadValues({}, rest), {
      x,
      y: [start, end]
    }), fill ? { fillColor: fill } : {}));
    values.push(end - start);
    cumulative.push(running);
    kinds.push(kind);
  }
  return { data: rows, values, cumulative, kinds };
}
function waterfallTransform(ser, w) {
  var _a, _b, _c;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.waterfallRawSeries) {
    gl.waterfallRawSeries = ser.map((s) => __spreadProps(__spreadValues({}, s), {
      data: Array.isArray(s == null ? void 0 : s.data) ? s.data.slice() : s == null ? void 0 : s.data
    }));
  }
  const raw = gl.waterfallRawSeries;
  const colors = ((_b = (_a = cnf.plotOptions) == null ? void 0 : _a.waterfall) == null ? void 0 : _b.colors) || {};
  const categories = (_c = cnf.xaxis) == null ? void 0 : _c.categories;
  const collapsed = gl.collapsedSeriesIndices || [];
  const values = [];
  const cumulative = [];
  const kinds = [];
  const out = raw.map((s, i) => {
    const data = Array.isArray(s == null ? void 0 : s.data) ? s.data : [];
    if (collapsed.indexOf(i) !== -1) {
      values[i] = [];
      cumulative[i] = [];
      kinds[i] = [];
      return __spreadProps(__spreadValues({}, s), { data: [] });
    }
    if (isPrecomputed(data)) {
      values[i] = data.map((d) => {
        const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
        if (!Array.isArray(y)) return null;
        const lo = Utils.parseNumber(y[0]);
        const hi = Utils.parseNumber(y[1]);
        return lo === null || hi === null ? null : hi - lo;
      });
      cumulative[i] = data.map((d) => {
        const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
        const hi = Array.isArray(y) ? Utils.parseNumber(y[1]) : null;
        return hi === null ? 0 : hi;
      });
      kinds[i] = data.map(() => null);
      return s;
    }
    const acc = accumulate(data, categories, colors);
    values[i] = acc.values;
    cumulative[i] = acc.cumulative;
    kinds[i] = acc.kinds;
    return __spreadProps(__spreadValues({}, s), { data: acc.data });
  });
  w.waterfallData = {
    values,
    cumulative,
    kinds,
    // A non-null sink is what tells RangeBar to record the px box it drew each
    // column in, which the connector layer joins up. Fresh every parse.
    geometry: []
  };
  return out;
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
registerSeriesTransform("waterfall", waterfallTransform);
_core__default.registerFeatures({ waterfall: Waterfall });
export {
  default2 as default,
  waterfallTransform
};
