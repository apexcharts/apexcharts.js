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
 * ApexCharts v7.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
function normalize(data, area) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const multiplier = area / sum;
  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] * multiplier;
  }
  return result;
}
function calculateRatio(rowMin, rowMax, rowSum, length) {
  const lengthSq = length * length;
  const sumSq = rowSum * rowSum;
  return Math.max(
    lengthSq * rowMax / sumSq,
    sumSq / (lengthSq * rowMin)
  );
}
function improvesRatio(rowLen, rowMin, rowMax, rowSum, nextNode, length) {
  if (rowLen === 0) return true;
  const currentRatio = calculateRatio(rowMin, rowMax, rowSum, length);
  const newRatio = calculateRatio(
    Math.min(rowMin, nextNode),
    Math.max(rowMax, nextNode),
    rowSum + nextNode,
    length
  );
  return currentRatio >= newRatio;
}
function emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height) {
  if (width >= height) {
    const areaWidth = rowSum / height;
    let subY = yoffset;
    for (let i = 0; i < rowLen; i++) {
      const h = row[i] / areaWidth;
      coords.push([xoffset, subY, xoffset + areaWidth, subY + h]);
      subY += h;
    }
  } else {
    const areaHeight = rowSum / width;
    let subX = xoffset;
    for (let i = 0; i < rowLen; i++) {
      const w = row[i] / areaHeight;
      coords.push([subX, yoffset, subX + w, yoffset + areaHeight]);
      subX += w;
    }
  }
}
function squarify(data, xoffset, yoffset, width, height) {
  const coords = [];
  const n = data.length;
  if (n === 0) return coords;
  const row = new Array(n);
  let rowLen = 0;
  let rowSum = 0;
  let rowMin = Infinity;
  let rowMax = -Infinity;
  let i = 0;
  while (i < n) {
    const length = Math.min(width, height);
    const val = data[i];
    if (improvesRatio(rowLen, rowMin, rowMax, rowSum, val, length)) {
      row[rowLen] = val;
      rowLen++;
      rowSum += val;
      if (val < rowMin) rowMin = val;
      if (val > rowMax) rowMax = val;
      i++;
    } else {
      emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height);
      if (width >= height) {
        const areaWidth = rowSum / height;
        xoffset += areaWidth;
        width -= areaWidth;
      } else {
        const areaHeight = rowSum / width;
        yoffset += areaHeight;
        height -= areaHeight;
      }
      rowLen = 0;
      rowSum = 0;
      rowMin = Infinity;
      rowMax = -Infinity;
    }
  }
  if (rowLen > 0) {
    emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height);
  }
  return coords;
}
function generate(data, width, height) {
  const n = data.length;
  const sums = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const series = data[i];
    for (let j = 0; j < series.length; j++) {
      s += series[j];
    }
    sums[i] = s;
  }
  const seriesRects = squarify(
    normalize(sums, width * height),
    0,
    0,
    width,
    height
  );
  const results = new Array(n);
  for (let i = 0; i < n; i++) {
    const rect = seriesRects[i];
    const rx = rect[0];
    const ry = rect[1];
    const rw = rect[2] - rx;
    const rh = rect[3] - ry;
    results[i] = squarify(
      normalize(data[i], rw * rh),
      rx,
      ry,
      rw,
      rh
    );
  }
  return results;
}
function computeArea(node) {
  const kids = node.children;
  if (kids && kids.length) {
    let s = 0;
    for (let i = 0; i < kids.length; i++) {
      s += computeArea(kids[i]);
    }
    node._area = s;
    return s;
  }
  const v = Number(node.value);
  const a = isNaN(v) ? 0 : Math.abs(v);
  node._area = a;
  return a;
}
function layoutLevel(nodes, xoffset, yoffset, width, height, depth, padding, header) {
  const n = nodes.length;
  if (n === 0 || width <= 0 || height <= 0) return;
  const areas = new Array(n);
  let total = 0;
  for (let i = 0; i < n; i++) {
    areas[i] = nodes[i]._area;
    total += areas[i];
  }
  if (total <= 0) return;
  const rects = squarify(
    normalize(areas, width * height),
    xoffset,
    yoffset,
    width,
    height
  );
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    const r = rects[i];
    if (!r) continue;
    node.rect = r;
    node.depth = depth;
    const kids = node.children;
    if (!kids || !kids.length) continue;
    const rw = r[2] - r[0];
    const rh = r[3] - r[1];
    let pad = Math.max(0, padding(node, depth, rw, rh) || 0);
    if (pad * 2 >= rw || pad * 2 >= rh) pad = 0;
    let head = Math.max(0, header(node, depth, rw, rh) || 0);
    if (head > 0 && rh - pad * 2 - head < head) head = 0;
    node.headerHeight = head;
    layoutLevel(
      kids,
      r[0] + pad,
      r[1] + head + pad,
      rw - pad * 2,
      rh - head - pad * 2,
      depth + 1,
      padding,
      header
    );
  }
}
function generateNested(nodes, width, height, opts = {}) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes || [];
  const padding = opts.padding || (() => 0);
  const header = opts.header || (() => 0);
  for (let i = 0; i < nodes.length; i++) computeArea(nodes[i]);
  layoutLevel(nodes, 0, 0, width, height, 0, padding, header);
  return nodes;
}
const TreemapSquared = { generate, generateNested };
const Graphics = _core.__apex_Graphics;
const Animations = _core.__apex_Animations;
const Fill = _core.__apex_Fill;
const Utils = _core.__apex_Utils;
const DataLabels = _core.__apex_DataLabels;
const resolveDataLabelOffset = (value, w, seriesIndex, dataPointIndex) => {
  if (typeof value !== "function") return value;
  const resolved = value({
    series: w.seriesData.series,
    seriesIndex,
    dataPointIndex,
    w
  });
  return Number.isFinite(resolved) ? resolved : 0;
};
class TreemapHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   * @param {import('../../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
  }
  checkColorRange() {
    const w = this.w;
    let negRange = false;
    const chartOpts = w.config.plotOptions[w.config.chart.type];
    if (chartOpts.colorScale.ranges.length > 0) {
      chartOpts.colorScale.ranges.map((range) => {
        if (range.from <= 0) {
          negRange = true;
        }
      });
    }
    return negRange;
  }
  /**
   * @param {string} chartType
   * @param {number} i
   * @param {number} j
   * @param {any} negRange
   */
  getShadeColor(chartType, i, j, negRange) {
    const w = this.w;
    let colorShadePercent = 1;
    const shadeIntensity = w.config.plotOptions[chartType].shadeIntensity;
    const colorProps = this.determineColor(chartType, i, j);
    if (
      /** @type {any} */
      w.globals.hasNegs || negRange
    ) {
      if (w.config.plotOptions[chartType].reverseNegativeShade) {
        if (colorProps.percent < 0) {
          colorShadePercent = colorProps.percent / 100 * (shadeIntensity * 1.25);
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * (shadeIntensity * 1.25);
        }
      } else {
        if (colorProps.percent <= 0) {
          colorShadePercent = 1 - (1 + colorProps.percent / 100) * shadeIntensity;
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * shadeIntensity;
        }
      }
    } else {
      colorShadePercent = 1 - colorProps.percent / 100;
      if (chartType === "treemap") {
        colorShadePercent = (1 - colorProps.percent / 100) * (shadeIntensity * 1.25);
      }
    }
    let color = colorProps.color;
    const utils = new Utils();
    if (w.config.plotOptions[chartType].enableShades) {
      if (this.w.config.theme.mode === "dark") {
        const shadeColor = utils.shadeColor(
          colorShadePercent * -1,
          colorProps.color
        );
        color = Utils.hexToRgba(
          Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
          w.config.fill.opacity
        );
      } else {
        const shadeColor = utils.shadeColor(colorShadePercent, colorProps.color);
        color = Utils.hexToRgba(
          Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
          w.config.fill.opacity
        );
      }
    }
    return { color, colorProps };
  }
  /**
   * @param {string} chartType
   * @param {number} i
   * @param {number} j
   */
  determineColor(chartType, i, j) {
    const w = this.w;
    const val = w.seriesData.series[i][j];
    const chartOpts = w.config.plotOptions[chartType];
    let seriesNumber = chartOpts.colorScale.inverse ? j : i;
    if (chartOpts.distributed && w.config.chart.type === "treemap") {
      seriesNumber = j;
    }
    let color = w.globals.colors[seriesNumber];
    let foreColor = null;
    let min;
    let max;
    if (!chartOpts.distributed && chartType === "heatmap") {
      min = w.globals.minY;
      max = w.globals.maxY;
    } else {
      const row = w.seriesData.series[i];
      min = row.length ? row[0] : 0;
      max = min;
      for (let k = 1; k < row.length; k++) {
        if (row[k] < min) min = row[k];
        if (row[k] > max) max = row[k];
      }
    }
    const csMin = chartOpts.colorScale.min;
    const csMax = chartOpts.colorScale.max;
    if (typeof csMin !== "undefined" && typeof csMax !== "undefined" && csMax > csMin) {
      min = csMin;
      max = csMax;
    } else if (typeof csMin !== "undefined") {
      min = csMin < w.globals.minY ? csMin : w.globals.minY;
      max = csMax > w.globals.maxY ? csMax : w.globals.maxY;
    }
    const total = Math.abs(max) + Math.abs(min);
    const clamped = Math.min(Math.max(val, min), max);
    let percent = total === 0 ? 0 : 100 * clamped / total;
    if (chartOpts.colorScale.ranges.length > 0) {
      const colorRange = chartOpts.colorScale.ranges;
      colorRange.map((range) => {
        if (val >= range.from && val <= range.to) {
          color = range.color;
          foreColor = range.foreColor ? range.foreColor : null;
          min = range.from;
          max = range.to;
          const rTotal = Math.abs(max) + Math.abs(min);
          percent = rTotal === 0 ? 0 : 100 * val / rTotal;
        }
      });
    }
    return {
      color,
      foreColor,
      percent
    };
  }
  /** @param {{ text?: any, x?: any, y?: any, i?: any, j?: any, colorProps?: any, fontSize?: any, series?: any }} opts */
  calculateDataLabels({ text, x, y, i, j, colorProps, fontSize }) {
    const w = this.w;
    const dataLabelsConfig = w.config.dataLabels;
    const graphics = new Graphics(this.w);
    const dataLabels = new DataLabels(this.w, this.ctx);
    let elDataLabelsWrap = null;
    if (dataLabelsConfig.enabled) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      const offX = resolveDataLabelOffset(dataLabelsConfig.offsetX, w, i, j);
      const offY = resolveDataLabelOffset(dataLabelsConfig.offsetY, w, i, j);
      const dataLabelsX = x + offX;
      const dataLabelsY = y + parseFloat(dataLabelsConfig.style.fontSize) / 3 + offY;
      dataLabels.plotDataLabelsText({
        x: dataLabelsX,
        y: dataLabelsY,
        text,
        i,
        j,
        color: colorProps.foreColor,
        parent: elDataLabelsWrap,
        fontSize,
        dataLabelsConfig
      });
    }
    return elDataLabelsWrap;
  }
}
const Filters = _core.__apex_Filters;
const Environment = _core.__apex_Environment_Environment;
function drilldownById(w, id) {
  const dd = w.config.drilldown;
  const list = dd && Array.isArray(dd.series) ? dd.series : [];
  return list.find((s) => s && s.id === id);
}
function toNode(w, d, i, paletteFromParent, parentKey, seenIds = null, opts = {}) {
  var _a, _b, _c;
  const isObj = d && typeof d === "object";
  const name = isObj ? (_b = (_a = d.x) != null ? _a : d.name) != null ? _b : "" : "";
  const value = isObj ? Number((_c = d.y) != null ? _c : d.value) : Number(d);
  const node = {
    name: String(name),
    value: isNaN(value) ? null : value,
    color: isObj && d.color ? d.color : void 0,
    // Identity across data updates: the path of names (indexed so same-named
    // siblings stay distinct). Update animations morph matched keys in place.
    _key: `${parentKey}/${i}:${name}`
  };
  if (paletteFromParent && !node.color) {
    node.color = paletteFromParent[i % paletteFromParent.length];
  }
  if (opts.keepDatum) node._datum = d;
  if (isObj && Array.isArray(d.children) && d.children.length) {
    node.children = d.children.map(
      (c, j) => toNode(w, c, j, null, node._key, seenIds, opts)
    );
  } else if (isObj && d.drilldown != null && opts.expandDrilldown !== false) {
    const visited = seenIds || /* @__PURE__ */ new Set();
    if (!visited.has(d.drilldown)) {
      const dd = drilldownById(w, d.drilldown);
      if (dd && Array.isArray(dd.data) && dd.data.length) {
        const nextSeen = new Set(visited);
        nextSeen.add(d.drilldown);
        const palette = Array.isArray(dd.colors) ? dd.colors : null;
        node.children = dd.data.map(
          (c, j) => toNode(w, c, j, palette, node._key, nextSeen, opts)
        );
      }
    }
  }
  return node;
}
function buildSeriesRoots(w, series, opts = {}) {
  const cfgSeries = (
    /** @type {any} */
    series || w.config.series
  );
  if (!Array.isArray(cfgSeries)) return [];
  return cfgSeries.map((s, i) => {
    var _a, _b;
    const data = s && Array.isArray(s.data) ? s.data : [];
    const key = `${i}:${(_a = s == null ? void 0 : s.name) != null ? _a : ""}`;
    const root = {
      name: String((_b = s == null ? void 0 : s.name) != null ? _b : ""),
      value: null,
      color: (s == null ? void 0 : s.color) || void 0,
      _key: key,
      _seriesIndex: i,
      children: data.map(
        (d, j) => toNode(w, d, j, null, key, null, opts)
      )
    };
    return root;
  });
}
function fillValues(node) {
  if (node.children && node.children.length) {
    node.children.forEach((c) => fillValues(c));
    if (node.value == null || isNaN(node.value)) {
      node.value = node.children.reduce(
        (s, c) => s + Math.max(0, c.value || 0),
        0
      );
    }
  }
  if (node.value == null || isNaN(node.value)) node.value = 0;
}
function morphKey(key) {
  if (typeof key !== "string") return "";
  const i = key.indexOf("/");
  return i === -1 ? "" : key.slice(i);
}
function annotate(roots) {
  const leaves = [];
  let maxDepth = 0;
  roots.forEach((root, si) => {
    const seriesLeaves = [];
    const walk = (node, depth, parent) => {
      node._parent = parent;
      node._depth = depth;
      node._si = si;
      node._leaf = !(node.children && node.children.length);
      if (depth > maxDepth) maxDepth = depth;
      if (node._leaf) {
        node._di = seriesLeaves.length;
        seriesLeaves.push(node);
      } else {
        node._di = -1;
        node.children.forEach(
          (c) => walk(c, depth + 1, node)
        );
      }
    };
    walk(root, 0, null);
    leaves.push(seriesLeaves);
  });
  return { leaves, maxDepth };
}
function getTreemapRoots(w) {
  const stashed = w.globals.treemapRoots;
  if (stashed && stashed.length) {
    return {
      roots: stashed,
      maxDepth: w.globals.treemapMaxDepth || 1,
      nested: true
    };
  }
  const roots = buildSeriesRoots(w, w.config.series, {
    keepDatum: true,
    expandDrilldown: false
  });
  roots.forEach(fillValues);
  const { maxDepth } = annotate(roots);
  return { roots, maxDepth, nested: false };
}
const DEFAULT_DIVERGING = ["#cf4d3f", "#8f9499", "#26a75b"];
const lerp = (a, b, t) => a + (b - a) * t;
function toHexPair(n) {
  const v = Math.max(0, Math.min(255, Math.round(n)));
  return v.toString(16).padStart(2, "0");
}
function mixColors(c1, c2, t) {
  const a = Utils.parseHex(normalizeHex(c1));
  const b = Utils.parseHex(normalizeHex(c2));
  if (!a || !b) return c1;
  return "#" + toHexPair(lerp(a[0], b[0], t)) + toHexPair(lerp(a[1], b[1], t)) + toHexPair(lerp(a[2], b[2], t));
}
function normalizeHex(c) {
  if (typeof c !== "string") return "#000000";
  if (Utils.isColorHex(c)) return c;
  const asHex = Utils.rgb2hex(c);
  return asHex || "#000000";
}
function colorValueOf(w, i, j) {
  const series = (
    /** @type {any} */
    w.config.series[i]
  );
  const datum = series && Array.isArray(series.data) ? series.data[j] : null;
  return colorValueOfDatum(w, datum, i, j);
}
function colorValueOfDatum(w, datum, i, j) {
  var _a, _b, _c;
  if (!datum || typeof datum !== "object") return null;
  const accessor = (_c = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.treemap) == null ? void 0 : _b.colorScale) == null ? void 0 : _c.colorValue;
  let raw;
  if (typeof accessor === "function") {
    raw = accessor(datum, { seriesIndex: i, dataPointIndex: j, w });
  } else if (typeof accessor === "string") {
    raw = datum[accessor];
  } else {
    raw = datum.colorValue;
  }
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function resolveStops(cfg, min, max, midpoint) {
  if (Array.isArray(cfg.stops) && cfg.stops.length >= 2) {
    return cfg.stops.filter((s) => s && Number.isFinite(Number(s.value))).map((s) => ({
      value: Number(s.value),
      color: normalizeHex(s.color)
    })).sort(
      (a, b) => a.value - b.value
    );
  }
  const colors = (Array.isArray(cfg.colors) && cfg.colors.length >= 2 ? cfg.colors : DEFAULT_DIVERGING).map(normalizeHex);
  const n = colors.length;
  if (midpoint != null && n >= 3) {
    const mid = Math.floor((n - 1) / 2);
    const out = [];
    for (let k = 0; k <= mid; k++) {
      out.push({ value: lerp(min, midpoint, k / mid), color: colors[k] });
    }
    for (let k = mid + 1; k < n; k++) {
      out.push({
        value: lerp(midpoint, max, (k - mid) / (n - 1 - mid)),
        color: colors[k]
      });
    }
    return out;
  }
  return colors.map((c, k) => ({
    value: lerp(min, max, k / (n - 1)),
    color: c
  }));
}
function buildContinuousScale(w) {
  var _a, _b, _c;
  const cs = (_c = (_b = (_a = w.config) == null ? void 0 : _a.plotOptions) == null ? void 0 : _b.treemap) == null ? void 0 : _c.colorScale;
  const cfg = cs && cs.gradient;
  if (!cfg) return null;
  if (cfg.enabled === false) return null;
  const series = (
    /** @type {any} */
    w.config.series || []
  );
  let dataMin = Infinity;
  let dataMax = -Infinity;
  let found = false;
  for (let i = 0; i < series.length; i++) {
    const data = series[i] && series[i].data;
    if (!Array.isArray(data)) continue;
    for (let j = 0; j < data.length; j++) {
      const v = colorValueOfDatum(w, data[j], i, j);
      if (v == null) continue;
      found = true;
      if (v < dataMin) dataMin = v;
      if (v > dataMax) dataMax = v;
    }
  }
  if (!found && cfg.enabled !== true) return null;
  if (!Number.isFinite(dataMin)) {
    dataMin = 0;
    dataMax = 0;
  }
  let min = Number.isFinite(Number(cfg.min)) ? Number(cfg.min) : dataMin;
  let max = Number.isFinite(Number(cfg.max)) ? Number(cfg.max) : dataMax;
  let midpoint = null;
  if (cfg.midpoint === null) {
    midpoint = null;
  } else if (Number.isFinite(Number(cfg.midpoint))) {
    midpoint = Number(cfg.midpoint);
  } else if (min < 0 && max > 0) {
    midpoint = 0;
  }
  if (midpoint != null && cfg.symmetric !== false && !Number.isFinite(Number(cfg.min)) && !Number.isFinite(Number(cfg.max))) {
    const reach = Math.max(Math.abs(min - midpoint), Math.abs(max - midpoint));
    min = midpoint - reach;
    max = midpoint + reach;
  }
  if (max === min) {
    min -= 0.5;
    max += 0.5;
  }
  const stops = resolveStops(cfg, min, max, midpoint);
  if (stops.length < 2) return null;
  const at = (v) => {
    if (!Number.isFinite(v)) return stops[Math.floor(stops.length / 2)].color;
    if (v <= stops[0].value) return stops[0].color;
    const last = stops[stops.length - 1];
    if (v >= last.value) return last.color;
    for (let k = 1; k < stops.length; k++) {
      const hi = stops[k];
      if (v <= hi.value) {
        const lo = stops[k - 1];
        const span2 = hi.value - lo.value;
        const t = span2 === 0 ? 0 : (v - lo.value) / span2;
        return mixColors(lo.color, hi.color, t);
      }
    }
    return last.color;
  };
  const span = max - min;
  const legendStops = stops.map((s) => ({
    percent: span === 0 ? 0 : (s.value - min) / span,
    color: s.color
  }));
  return { min, max, midpoint, stops, at, legendStops };
}
function readableOn(bg) {
  const hex = normalizeHex(bg);
  return Utils.getContrastRatio(hex, "#ffffff") >= Utils.getContrastRatio(hex, "#000000") ? "#ffffff" : "#000000";
}
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const XHTML = "http://www.w3.org/1999/xhtml";
const BREADCRUMB_HEIGHT = 18;
function breadcrumbConfig(w, localCfg) {
  const shared = w.config.drilldown && w.config.drilldown.breadcrumb || {};
  return __spreadValues(__spreadValues({
    show: true,
    position: "top-left",
    separator: " / ",
    rootLabel: "All",
    offsetX: 0,
    offsetY: 0,
    formatter: void 0
  }, shared), localCfg || {});
}
function avoidChromeOverlap(w, nav) {
  const chrome = (
    /** @type {Element[]} */
    [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s) => w.dom.baseEl.querySelector(s)).filter((el) => el !== null)
  );
  if (!chrome.length) return;
  const wrapTop = w.dom.elWrap.getBoundingClientRect().top;
  for (let pass = 0; pass < chrome.length + 1; pass++) {
    const nr = nav.getBoundingClientRect();
    const hit = chrome.find((el) => {
      const r = el.getBoundingClientRect();
      return nr.left < r.right && nr.right > r.left && nr.top < r.bottom && nr.bottom > r.top;
    });
    if (!hit) break;
    nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`;
  }
}
function clearBreadcrumb(w) {
  const elWrap = w.dom.elWrap;
  if (!elWrap) return;
  const existing = elWrap.querySelector(".apexcharts-breadcrumb");
  if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
}
function renderBreadcrumb(w, opts) {
  if (!Environment.isBrowser()) return null;
  const elWrap = w.dom.elWrap;
  if (!elWrap) return null;
  clearBreadcrumb(w);
  const cfg = opts.config || breadcrumbConfig(w);
  if (cfg.show === false) return null;
  const crumbs = opts.crumbs || [];
  if (crumbs.length < 2) return null;
  const nav = BrowserAPIs.createElementNS(XHTML, "nav");
  nav.setAttribute("class", "apexcharts-breadcrumb");
  nav.setAttribute("aria-label", opts.ariaLabel || "Breadcrumb");
  positionBreadcrumb(nav, cfg);
  if (opts.compact) {
    nav.style.fontSize = "11px";
    nav.style.padding = "0 2px";
  }
  const separator = cfg.separator != null ? cfg.separator : " / ";
  crumbs.forEach((crumb, i) => {
    var _a;
    if (i > 0) {
      const sep = BrowserAPIs.createElementNS(XHTML, "span");
      sep.setAttribute("class", "apexcharts-breadcrumb-separator");
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = separator;
      nav.appendChild(sep);
    }
    let label = i === 0 ? (_a = cfg.rootLabel) != null ? _a : "All" : crumb.label;
    if (typeof cfg.formatter === "function") {
      label = cfg.formatter(label, {
        index: i,
        depth: crumbs.length - 1,
        data: crumb.data
      });
    }
    if (i === crumbs.length - 1) {
      const cur = BrowserAPIs.createElementNS(XHTML, "span");
      cur.setAttribute(
        "class",
        "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
      );
      cur.setAttribute("aria-current", "page");
      cur.textContent = String(label);
      nav.appendChild(cur);
      return;
    }
    const btn = (
      /** @type {HTMLButtonElement} */
      BrowserAPIs.createElementNS(XHTML, "button")
    );
    btn.setAttribute("type", "button");
    btn.setAttribute("class", "apexcharts-breadcrumb-item");
    if (i === 0) {
      const arrow = BrowserAPIs.createElementNS(XHTML, "span");
      arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "←";
      btn.appendChild(arrow);
    }
    const text = BrowserAPIs.createElementNS(XHTML, "span");
    text.setAttribute("class", "apexcharts-breadcrumb-label");
    text.textContent = String(label);
    btn.appendChild(text);
    btn.addEventListener("click", () => opts.onNavigate(i, crumb));
    nav.appendChild(btn);
  });
  elWrap.appendChild(nav);
  return nav;
}
function positionBreadcrumb(nav, cfg) {
  const ox = cfg.offsetX || 0;
  const oy = cfg.offsetY || 0;
  nav.style.position = "absolute";
  nav.style.top = oy + "px";
  if (cfg.position === "top-right") {
    nav.style.right = -ox + 3 + "px";
  } else {
    nav.style.left = ox + "px";
  }
}
const areaOf = (r) => (r[2] - r[0]) * (r[3] - r[1]);
class TreemapChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    this.strokeWidth = this.w.config.stroke.width;
    this.helpers = new TreemapHelpers(w, ctx);
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.labels = [];
    this.roots = [];
    this.drawn = [];
    this.nested = false;
    this.showParents = false;
    this.scale = null;
    this._levelCache = null;
    this._total = null;
    this._avgLabelSize = null;
    this._tooltipEl = null;
    this._tipOwned = false;
    this._morphLeafIndex = 0;
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a;
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const fill = new Fill(this.w);
    const ret = graphics.group({
      class: "apexcharts-treemap"
    });
    if (w.globals.noData) return ret;
    series.forEach((s) => {
      s.map((v) => {
        return Math.abs(v);
      });
    });
    this.negRange = this.helpers.checkColorRange();
    w.config.series.forEach((s, i) => {
      s.data.forEach((l) => {
        if (!Array.isArray(this.labels[i])) this.labels[i] = [];
        this.labels[i].push(l.x);
      });
    });
    const tree = getTreemapRoots(w);
    this.nested = tree.nested;
    this.roots = tree.roots;
    this.scale = buildContinuousScale(w);
    const drawn = tree.roots.length === 1 ? tree.roots[0].children || [] : tree.roots;
    this.drawn = drawn;
    const parentsCfg = w.config.plotOptions.treemap.parents;
    this.showParents = parentsCfg.show === true || parentsCfg.show !== false && this.nested;
    const focus = this._resolveFocus(drawn);
    const layoutRoots = focus ? [focus] : drawn;
    TreemapSquared.generateNested(
      layoutRoots,
      w.layout.gridWidth,
      w.layout.gridHeight,
      {
        padding: (node, depth, rw, rh) => this.showParents ? this._levelPadding(depth, rw, rh) : 0,
        header: (node, depth, rw, rh) => this.showParents ? this._levelHeader(node, depth, rw, rh) : 0
      }
    );
    const morphSrc = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange;
    const morphActive = !!morphSrc && typeof morphSrc.isActive === "function" && morphSrc.isActive() && typeof morphSrc.getInitialPathAt === "function";
    this._morphLeafIndex = 0;
    const leavesBySeries = this._leavesBySeries(layoutRoots, w.config.series.length);
    const parentsBySeries = this.showParents ? this._parentsBySeries(layoutRoots, w.config.series.length) : [];
    leavesBySeries.forEach((node, i) => {
      var _a2;
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      graphics.setupEventDelegation(elSeries, ".apexcharts-treemap-rect");
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        const filters = new Filters(this.w);
        filters.dropShadow(ret, shadow, i);
      }
      const elDataLabelWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      const bounds = {
        xMin: Infinity,
        yMin: Infinity,
        xMax: -Infinity,
        yMax: -Infinity
      };
      if (this.showParents) {
        (parentsBySeries[i] || []).forEach((p) => {
          this._drawParent(elSeries, p, i);
        });
      }
      const animCfg = w.config.chart.animations;
      const gradCfg = animCfg.animateGradually;
      const cascadeEnabled = gradCfg && gradCfg.enabled !== false;
      const cascadeDelays = new Array(node.length).fill(0);
      if (cascadeEnabled) {
        const tileCount = node.length || 1;
        const baseDelay = Math.min(
          gradCfg.delay || 0,
          animCfg.speed * 0.5 / tileCount
        );
        const ranked = node.map(
          /** @param {any} leaf @param {number} k */
          (leaf, k) => ({ j: k, area: leaf.rect ? areaOf(leaf.rect) : 0 })
        ).sort(
          /** @param {{j: number, area: number}} a @param {{j: number, area: number}} b */
          (a, b) => b.area - a.area
        );
        ranked.forEach(
          /** @param {{j: number, area: number}} item @param {number} rank */
          (item, rank) => {
            cascadeDelays[item.j] = rank * baseDelay;
          }
        );
      }
      node.forEach((leaf, k) => {
        const r = leaf.rect;
        if (!r) return;
        const j = leaf._di;
        const x1 = r[0];
        const y1 = r[1];
        const x2 = r[2];
        const y2 = r[3];
        bounds.xMin = Math.min(bounds.xMin, x1);
        bounds.yMin = Math.min(bounds.yMin, y1);
        bounds.xMax = Math.max(bounds.xMax, x2);
        bounds.yMax = Math.max(bounds.yMax, y2);
        const colorProps = this._leafColor(i, j);
        const color = colorProps.color;
        const pathFill = fill.fillPath({
          color,
          seriesNumber: i,
          dataPointIndex: j
        });
        const morphFrom = morphActive ? this._morphSourceForLeaf(leaf) : null;
        const elRect = morphFrom ? graphics.drawPath({
          d: this._tilePath(x1, y1, x2, y2),
          fill: "#fff",
          stroke: w.config.plotOptions.treemap.useFillColorAsStroke ? color : w.globals.stroke.colors[i],
          strokeWidth: this.strokeWidth,
          fillOpacity: 1
        }) : graphics.drawRect(
          x1,
          y1,
          x2 - x1,
          y2 - y1,
          w.config.plotOptions.treemap.borderRadius,
          "#fff",
          1,
          this.strokeWidth,
          w.config.plotOptions.treemap.useFillColorAsStroke ? color : w.globals.stroke.colors[i]
        );
        elRect.attr({
          cx: x1,
          cy: y1,
          index: i,
          i,
          j,
          width: x2 - x1,
          height: y2 - y1,
          fill: pathFill
        });
        elRect.node.classList.add("apexcharts-treemap-rect");
        elRect.node.setAttribute("data:key", morphKey(leaf._key));
        let fromRect = {
          x: x1 + (x2 - x1) / 2,
          y: y1 + (y2 - y1) / 2,
          width: 0,
          height: 0
        };
        const toRect = {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1
        };
        if (morphFrom) {
          this._morphTile(
            elRect,
            morphFrom,
            this._tilePath(x1, y1, x2, y2),
            this.ctx.morphTypeChange.getSpeed(),
            i,
            j
          );
        } else if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1;
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed;
          }
          this.animateTreemap(
            elRect,
            fromRect,
            toRect,
            speed,
            // Ranked by draw order, not by data index — the cascade is about
            // what is on screen.
            cascadeDelays[k] || 0
          );
        }
        if (w.globals.dataChanged) {
          let speed = 1;
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed;
            if (w.globals.previousPaths[i] && /** @type {Record<string,any>} */
            w.globals.previousPaths[i][j] && /** @type {Record<string,any>} */
            w.globals.previousPaths[i][j].rect) {
              fromRect = /** @type {Record<string,any>} */
              w.globals.previousPaths[i][j].rect;
            }
            this.animateTreemap(elRect, fromRect, toRect, speed);
          }
        }
        let fontSize = this.getFontSize(r);
        if (w.config.plotOptions.treemap.dataLabels.format === "truncate") {
          fontSize = parseInt(String(w.config.dataLabels.style.fontSize), 10);
        }
        let dataLabels = null;
        if (w.config.dataLabels.enabled && this._labelCanShow(fontSize, x2 - x1, y2 - y1)) {
          let formattedText = w.config.dataLabels.formatter(this.labels[i][j], {
            value: w.seriesData.series[i][j],
            seriesIndex: i,
            dataPointIndex: j,
            w
          });
          if (w.config.plotOptions.treemap.dataLabels.format === "truncate") {
            formattedText = this.truncateLabels(
              String(formattedText),
              fontSize,
              x1,
              y1,
              x2,
              y2
            );
          }
          if (w.seriesData.series[i][j]) {
            dataLabels = this.helpers.calculateDataLabels({
              text: formattedText,
              x: (x1 + x2) / 2,
              y: (y1 + y2) / 2 + this.strokeWidth / 2 + fontSize / 3,
              i,
              j,
              colorProps,
              fontSize,
              series
            });
          }
          if (w.config.dataLabels.enabled && dataLabels) {
            this.rotateToFitLabel(
              dataLabels,
              fontSize,
              formattedText,
              x1,
              y1,
              x2,
              y2
            );
          }
        }
        elSeries.add(elRect);
        if (dataLabels !== null) {
          elSeries.add(dataLabels);
        }
      });
      const seriesTitle = w.config.plotOptions.treemap.seriesTitle;
      if (!this.showParents && w.config.series.length > 1 && seriesTitle && seriesTitle.show) {
        const sName = (
          /** @type {Record<string,any>} */
          w.config.series[i].name || ""
        );
        if (sName && bounds.xMin < Infinity && bounds.yMin < Infinity) {
          const {
            offsetX,
            offsetY,
            borderColor,
            borderWidth,
            borderRadius,
            style
          } = seriesTitle;
          const textColor = style.color || w.config.chart.foreColor;
          const padding = {
            left: style.padding.left,
            right: style.padding.right,
            top: style.padding.top,
            bottom: style.padding.bottom
          };
          const textSize = graphics.getTextRects(
            sName,
            style.fontSize,
            style.fontFamily
          );
          const labelRectWidth = textSize.width + padding.left + padding.right;
          const labelRectHeight = textSize.height + padding.top + padding.bottom;
          const labelX = bounds.xMin + (offsetX || 0);
          const labelY = bounds.yMin + (offsetY || 0);
          const elLabelRect = graphics.drawRect(
            labelX,
            labelY,
            labelRectWidth,
            labelRectHeight,
            borderRadius,
            style.background,
            1,
            borderWidth,
            borderColor
          );
          const elLabelText = graphics.drawText({
            x: labelX + padding.left,
            y: labelY + padding.top + ((_a2 = textSize == null ? void 0 : textSize.height) != null ? _a2 : 0) * 0.75,
            text: sName,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            foreColor: textColor,
            cssClass: style.cssClass || ""
          });
          elSeries.add(elLabelRect);
          elSeries.add(elLabelText);
        }
      }
      elSeries.add(elDataLabelWrap);
      ret.add(elSeries);
    });
    this._renderBreadcrumb();
    return ret;
  }
  // ----------------------------------------------------------------- levels
  /**
   * Per-level config: `plotOptions.treemap.parents` is the base, and
   * `plotOptions.treemap.levels[depth]` overrides it. Depth 0 is the outermost
   * group actually drawn (the series, unless a single series was unwrapped).
   * @param {number} depth
   * @returns {any}
   */
  _levelCfg(depth) {
    if (!this._levelCache) this._levelCache = [];
    if (this._levelCache[depth]) return this._levelCache[depth];
    const tm = this.w.config.plotOptions.treemap;
    const base = tm.parents || {};
    const lvl = (tm.levels || [])[depth] || {};
    const merged = __spreadProps(__spreadValues(__spreadValues({}, base), lvl), {
      header: __spreadProps(__spreadValues(__spreadValues({}, base.header || {}), lvl.header || {}), {
        style: __spreadValues(__spreadValues({}, (base.header || {}).style || {}), (lvl.header || {}).style || {})
      }),
      hover: __spreadValues(__spreadValues({}, base.hover || {}), lvl.hover || {})
    });
    this._levelCache[depth] = merged;
    return merged;
  }
  /**
   * The inset between a parent's edge and its children, at this depth.
   * @param {number} depth
   * @param {number} _rw
   * @param {number} _rh
   * @returns {number}
   */
  _levelPadding(depth, _rw, _rh) {
    const cfg = this._levelCfg(depth);
    return Number(cfg.padding) || 0;
  }
  /**
   * The header strip height at this depth, or 0 when the tile is too small to
   * carry one. The geometry library clamps against its own box; this is the
   * legibility rule, which needs the font size and so lives here.
   * @param {any} node
   * @param {number} depth
   * @param {number} rw
   * @param {number} rh
   * @returns {number}
   */
  _levelHeader(node, depth, rw, rh) {
    const cfg = this._levelCfg(depth);
    const header = cfg.header || {};
    if (header.show === false) return 0;
    const h = Number(header.height);
    if (!Number.isFinite(h) || h <= 0) return 0;
    const minWidth = Number(header.minWidth) || 40;
    if (rw < minWidth) return 0;
    if (rh < h * 2) return 0;
    return h;
  }
  // ------------------------------------------------------------------ nodes
  /**
   * Leaves of the drawn tree, bucketed by the series they came from and kept in
   * depth-first order.
   * @param {any[]} roots
   * @param {number} seriesCount
   * @returns {any[][]}
   */
  _leavesBySeries(roots, seriesCount) {
    const out = new Array(Math.max(1, seriesCount));
    for (let i = 0; i < out.length; i++) out[i] = [];
    const walk = (node) => {
      if (node.children && node.children.length) {
        node.children.forEach(walk);
      } else {
        const si = node._si || 0;
        if (out[si]) out[si].push(node);
      }
    };
    roots.forEach(walk);
    return out;
  }
  /**
   * Non-leaf nodes of the drawn tree, bucketed by series, shallowest first so a
   * container is painted before anything nested inside it.
   * @param {any[]} roots
   * @param {number} seriesCount
   * @returns {any[][]}
   */
  _parentsBySeries(roots, seriesCount) {
    const out = new Array(Math.max(1, seriesCount));
    for (let i = 0; i < out.length; i++) out[i] = [];
    const walk = (node) => {
      if (!node.children || !node.children.length) return;
      const si = node._si || 0;
      if (out[si]) out[si].push(node);
      node.children.forEach(walk);
    };
    roots.forEach(walk);
    out.forEach(
      (list) => list.sort(
        (a, b) => (a.depth || 0) - (b.depth || 0)
      )
    );
    return out;
  }
  // ---------------------------------------------------------------- colours
  /**
   * A leaf's fill.
   *
   * Continuous colour (a datum carrying a second metric) takes over when it is
   * configured, because shading a tile by its own area value is precisely what
   * that mode replaces. Everything else - `colorScale.ranges`, `enableShades`,
   * `distributed`, negative handling - is the path it always was.
   *
   * The shape of the return value matches `Helpers.getShadeColor` so the
   * caller cannot tell the two apart.
   *
   * @param {number} i
   * @param {number} j
   * @returns {any}
   */
  _leafColor(i, j) {
    const w = this.w;
    if (this.scale) {
      const cv = colorValueOf(w, i, j);
      if (cv != null) {
        const color = this.scale.at(cv);
        return {
          color,
          // The discrete path has never supplied a label colour, so only the
          // continuous path sets one: a diverging ramp runs right through the
          // middle of the luminance range and a fixed light-or-dark label
          // would be unreadable at one end or the other.
          foreColor: readableOn(color),
          colorProps: { color, foreColor: readableOn(color), percent: 0 }
        };
      }
    }
    return this.helpers.getShadeColor(
      w.config.chart.type,
      i,
      j,
      this.negRange
    );
  }
  // ---------------------------------------------------------------- parents
  /**
   * Resolved container/header colours for a level. Parent marks are chrome, not
   * data, so they default to a neutral tint of the background rather than to a
   * series colour: with continuous colour on the leaves, a coloured container
   * would read as another data value.
   * @param {number} depth
   * @returns {any}
   */
  _parentChrome(depth) {
    const w = this.w;
    const cfg = this._levelCfg(depth);
    const dark = w.config.theme.mode === "dark";
    const header = cfg.header || {};
    const hstyle = header.style || {};
    const step = Math.min(depth, 3);
    const base = dark ? 255 : 0;
    const rgb = `${base},${base},${base}`;
    return {
      fill: cfg.fill || `rgba(${rgb},${(dark ? 0.04 : 0.03) + step * 0.02})`,
      fillOpacity: cfg.fillOpacity == null ? 1 : cfg.fillOpacity,
      borderColor: cfg.borderColor || `rgba(${rgb},${dark ? 0.18 : 0.14})`,
      borderWidth: cfg.borderWidth == null ? 1 : cfg.borderWidth,
      borderRadius: cfg.borderRadius == null ? w.config.plotOptions.treemap.borderRadius : cfg.borderRadius,
      headerBg: hstyle.background || `rgba(${rgb},${dark ? 0.1 : 0.07})`,
      headerColor: hstyle.color || (dark ? "#e8e8e8" : w.config.chart.foreColor),
      headerFontSize: hstyle.fontSize || "12px",
      headerFontFamily: hstyle.fontFamily || w.config.chart.fontFamily,
      headerFontWeight: hstyle.fontWeight == null ? 600 : hstyle.fontWeight,
      hoverColor: cfg.hover && cfg.hover.color || (dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.7)"),
      hoverWidth: cfg.hover && cfg.hover.width || 2,
      hoverShow: !(cfg.hover && cfg.hover.show === false)
    };
  }
  /**
   * Draw one parent as a real mark: a container rect, and the header strip the
   * layout already reserved room for.
   *
   * The container is `pointer-events: none` over its interior so the tiles
   * inside it keep receiving hover; only the padding gutter and the header
   * strip belong to the parent.
   *
   * @param {any} elSeries
   * @param {any} node
   * @param {number} i seriesIndex
   */
  _drawParent(elSeries, node, i) {
    var _a;
    const r = node.rect;
    if (!r) return;
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const depth = node.depth || 0;
    const cfg = this._levelCfg(depth);
    const chrome = this._parentChrome(depth);
    const x1 = r[0];
    const y1 = r[1];
    const width = r[2] - r[0];
    const height = r[3] - r[1];
    if (width <= 0 || height <= 0) return;
    const elGroup = graphics.group({
      class: "apexcharts-treemap-parent",
      "data:depth": depth,
      "data:name": Utils.escapeString(node.name)
    });
    const key = morphKey(node._key);
    const morphFrom = this._morphKeyed() ? this.ctx.morphTypeChange.getInitialPathForKey(key) : null;
    const elRect = morphFrom ? graphics.drawPath({
      d: this._tilePath(x1, y1, x1 + width, y1 + height),
      fill: chrome.fill,
      stroke: chrome.borderColor,
      strokeWidth: chrome.borderWidth,
      fillOpacity: chrome.fillOpacity
    }) : graphics.drawRect(
      x1,
      y1,
      width,
      height,
      chrome.borderRadius,
      chrome.fill,
      chrome.fillOpacity,
      chrome.borderWidth,
      chrome.borderColor
    );
    elRect.node.classList.add("apexcharts-treemap-parent-rect");
    elRect.node.setAttribute("data:key", key);
    elRect.node.setAttribute("data:depth", String(depth));
    if (morphFrom) {
      this._morphTile(
        elRect,
        morphFrom,
        this._tilePath(x1, y1, x1 + width, y1 + height),
        this.ctx.morphTypeChange.getSpeed(),
        i,
        depth
      );
    }
    elGroup.add(elRect);
    const headerHeight = node.headerHeight || 0;
    let headerText = "";
    if (headerHeight > 0) {
      const header = cfg.header || {};
      const elHeaderRect = graphics.drawRect(
        x1,
        y1,
        width,
        headerHeight,
        0,
        chrome.headerBg,
        1,
        0,
        "transparent"
      );
      elHeaderRect.node.classList.add("apexcharts-treemap-parent-header");
      elGroup.add(elHeaderRect);
      let text = String((_a = node.name) != null ? _a : "");
      if (typeof header.formatter === "function") {
        text = String(
          header.formatter(node.name, {
            value: node.value,
            depth,
            seriesIndex: i,
            node,
            w
          })
        );
      } else if (header.showValue) {
        text = `${text}  ${this._formatValue(node.value)}`;
      }
      headerText = text;
      const offsetX = Number(header.offsetX) || 0;
      const align = header.align || "left";
      const pad = 6;
      const maxWidth = Math.max(0, width - pad * 2 - Math.abs(offsetX));
      const fontSize = parseFloat(String(chrome.headerFontSize)) || 12;
      const clipped = graphics.getTextBasedOnMaxWidth({
        text,
        maxWidth,
        fontSize
      });
      if (clipped) {
        let tx = x1 + pad + offsetX;
        let anchor = "start";
        if (align === "center") {
          tx = x1 + width / 2 + offsetX;
          anchor = "middle";
        } else if (align === "right") {
          tx = x1 + width - pad + offsetX;
          anchor = "end";
        }
        const elText = graphics.drawText({
          x: tx,
          y: y1 + headerHeight / 2 + fontSize / 3 + (Number(header.offsetY) || 0),
          text: clipped,
          textAnchor: anchor,
          fontSize: chrome.headerFontSize,
          fontFamily: chrome.headerFontFamily,
          fontWeight: chrome.headerFontWeight,
          foreColor: chrome.headerColor,
          cssClass: `apexcharts-treemap-parent-label ${header.style && header.style.cssClass || ""}`
        });
        elText.node.setAttribute("pointer-events", "none");
        elGroup.add(elText);
      }
      this._attachParentEvents(elHeaderRect.node, node, chrome, elRect);
      this._makeParentAccessible(
        elHeaderRect.node,
        node,
        chrome,
        elRect,
        headerText
      );
    }
    this._attachParentEvents(elRect.node, node, chrome, elRect);
    elGroup.node.setAttribute("role", "group");
    elGroup.node.setAttribute("aria-label", this._parentLabel(node, headerText));
    elSeries.add(elGroup);
  }
  /**
   * The spoken description of a branch: what it is, how big, and how much of
   * the chart it accounts for.
   *
   * Starts from the header's own rendered text when there is one (before
   * clipping), so the accessible name contains the visible label rather than a
   * differently-formatted number - a formatter that renders "$3.25T" must not
   * be announced as "3246".
   *
   * @param {any} node
   * @param {string} [visibleText] the header text, formatter applied, unclipped
   * @returns {string}
   */
  _parentLabel(node, visibleText) {
    const total = this._drawnTotal();
    const pct = total > 0 ? (node._area / total * 100).toFixed(1) : "0";
    const n = this._countLeaves(node);
    const lead = visibleText && String(visibleText).trim() ? String(visibleText).replace(/\s+/g, " ").trim() : `${node.name}, ${this._formatValue(node._area)}`;
    return `${lead}, ${n} ${n === 1 ? "item" : "items"}, ${pct}% of total`;
  }
  /**
   * Make a branch reachable and operable from the keyboard.
   *
   * Only the header strip takes focus, and only while click-to-zoom is live: a
   * treemap can hold hundreds of tiles, and making every mark a tab stop would
   * bury the chart's own controls behind a few hundred presses. Tabbing the
   * groups and pressing Enter is the same path the mouse takes, and the
   * breadcrumb is already real buttons, so the way back is reachable too.
   *
   * @param {any} el
   * @param {any} node
   * @param {any} chrome
   * @param {any} elRect
   * @param {string} [visibleText] the header's rendered text, unclipped
   */
  _makeParentAccessible(el, node, chrome, elRect, visibleText) {
    if (!el || !el.setAttribute) return;
    if (!this._zoomEnabled()) return;
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute(
      "aria-label",
      `${this._parentLabel(node, visibleText)}. Zoom in`
    );
    el.setAttribute("aria-expanded", "false");
    if (!Environment.isBrowser() || !el.addEventListener) return;
    el.addEventListener("focus", () => {
      elRect.node.setAttribute("stroke", chrome.hoverColor);
      elRect.node.setAttribute("stroke-width", String(chrome.hoverWidth + 1));
    });
    el.addEventListener("blur", () => {
      elRect.node.setAttribute("stroke", chrome.borderColor);
      elRect.node.setAttribute("stroke-width", String(chrome.borderWidth));
    });
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      e.preventDefault();
      this._zoomTo(node, true);
    });
  }
  /**
   * Hover outline, aggregate tooltip and click-to-zoom for a parent mark.
   * @param {any} el the element receiving the pointer
   * @param {any} node
   * @param {any} chrome
   * @param {any} elRect the container rect to outline
   */
  _attachParentEvents(el, node, chrome, elRect) {
    if (!Environment.isBrowser() || !el || !el.addEventListener) return;
    const w = this.w;
    if (chrome.hoverShow) {
      el.addEventListener("mouseenter", () => {
        elRect.node.setAttribute("stroke", chrome.hoverColor);
        elRect.node.setAttribute("stroke-width", String(chrome.hoverWidth));
      });
      el.addEventListener("mouseleave", () => {
        elRect.node.setAttribute("stroke", chrome.borderColor);
        elRect.node.setAttribute("stroke-width", String(chrome.borderWidth));
      });
    }
    if (w.config.tooltip.enabled) {
      el.addEventListener(
        "mouseenter",
        (e) => this._showParentTooltip(e, node)
      );
      el.addEventListener(
        "mousemove",
        (e) => this._positionTooltip(e)
      );
      el.addEventListener("mouseleave", () => this._hideParentTooltip());
    }
    if (this._zoomEnabled()) {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => this._zoomTo(node));
    }
  }
  // ------------------------------------------------------------------- zoom
  /**
   * Click-to-zoom is live only when nothing else already owns the click.
   *
   * The drilldown feature is the other way into a hierarchy on a treemap, and
   * the two are different models of the same gesture: drilldown replaces the
   * view one level at a time, zoom reframes a tree that stays whole. Running
   * both would fight over the same click and over the one breadcrumb slot in
   * the wrap, so drilldown wins where it is active and this stands down.
   * @returns {boolean}
   */
  _zoomEnabled() {
    const w = this.w;
    const z = w.config.plotOptions.treemap.zoom;
    if (!z || !z.enabled || !this.showParents) return false;
    const dd = w.config.drilldown;
    if (dd && dd.enabled && Array.isArray(dd.series) && dd.series.length) {
      if (!this._warnedZoomConflict) {
        this._warnedZoomConflict = true;
        console.warn(
          "ApexCharts treemap: `plotOptions.treemap.zoom` and the drilldown feature both navigate the hierarchy, so zoom is ignored here. Drop `drilldown.series` to zoom a nested treemap instead."
        );
      }
      return false;
    }
    return true;
  }
  /**
   * The focused branch for this render, looked up by the key stashed on the
   * last click. Keys are rebuilt identically from the same data, so the focus
   * survives a re-render; a key that no longer resolves (the data changed under
   * it) simply falls back to the whole tree.
   * @param {any[]} drawn
   * @returns {any}
   */
  _resolveFocus(drawn) {
    const key = this.w.globals.treemapFocusKey;
    if (!key || !this._zoomEnabled()) return null;
    let found = null;
    const walk = (node) => {
      if (found) return;
      if (node._key === key) {
        found = node;
        return;
      }
      if (node.children) node.children.forEach(walk);
    };
    drawn.forEach(walk);
    return found && found.children && found.children.length ? found : null;
  }
  /**
   * @param {any} node
   * @param {boolean} [restoreFocus] move focus into the new view once it is
   *   drawn. A zoom re-renders the chart, which destroys the element the
   *   keyboard user was standing on; without this they would be returned to the
   *   top of the document.
   */
  _zoomTo(node, restoreFocus = false) {
    const w = this.w;
    if (!node || !node.children || !node.children.length) return;
    const next = w.globals.treemapFocusKey === node._key ? null : node._key;
    w.globals.treemapFocusKey = next;
    this._hideParentTooltip();
    const done = this.ctx.update();
    if (!restoreFocus || !done || typeof done.then !== "function") return;
    done.then(() => {
      if (!Environment.isBrowser()) return;
      const crumb = (
        /** @type {any} */
        w.dom.baseEl.querySelector(
          ".apexcharts-breadcrumb .apexcharts-breadcrumb-item"
        )
      );
      if (crumb && crumb.focus) {
        crumb.focus();
        return;
      }
      const header = (
        /** @type {any} */
        w.dom.baseEl.querySelector(
          ".apexcharts-treemap-parent-header[tabindex]"
        )
      );
      if (header && header.focus) header.focus();
    });
  }
  /**
   * Outermost drawn group -> focus chain, for the breadcrumb.
   *
   * Stops at a drawn root rather than walking all the way to `_parent === null`:
   * when a single series was unwrapped, the series node is still every level-0
   * node's parent, and it is not a level the reader ever sees.
   */
  _focusChain() {
    const chain = [];
    const drawnRoots = new Set(this.drawn || []);
    let n = this._resolveFocus(this.drawn || []);
    while (n) {
      chain.unshift(n);
      if (drawnRoots.has(n)) break;
      n = n._parent;
    }
    return chain;
  }
  /** The breadcrumb config: a treemap-local override on the shared block. */
  _breadcrumbCfg() {
    const z = this.w.config.plotOptions.treemap.zoom;
    return breadcrumbConfig(this.w, z && z.breadcrumb);
  }
  /**
   * Breadcrumb back out of a zoom. Markup, config and accessible semantics are
   * the shared ones, so a zoomed treemap and a drilled-in chart present the
   * same affordance.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    if (!w.dom.elWrap) return;
    clearBreadcrumb(w);
    if (!this._zoomEnabled()) return;
    const chain = this._focusChain();
    if (!chain.length) return;
    const nav = renderBreadcrumb(w, {
      ariaLabel: "Treemap breadcrumb",
      config: this._breadcrumbCfg(),
      compact: true,
      crumbs: [{ label: "All", data: null }].concat(
        chain.map((n) => ({ label: n.name, data: n }))
      ),
      onNavigate: (_i, crumb) => {
        w.globals.treemapFocusKey = crumb.data ? crumb.data._key : null;
        this._hideParentTooltip();
        this.ctx.update();
      }
    });
    if (!nav) return;
    this._placeBreadcrumb(nav);
    avoidChromeOverlap(w, nav);
  }
  /**
   * Sit the breadcrumb in the band the layout reserved for it
   * (Dimensions.gridPadForBreadcrumb), just above the grid.
   *
   * The fallback below should never fire: the reserve is unconditional once
   * zoom is enabled. It stays for the cases the reserve cannot cover - a
   * responsive override that turns zoom on after layout, or a host stylesheet
   * that grows the font - where a readable chip over the tiles beats a
   * breadcrumb clipped by the plot.
   *
   * @param {any} nav
   */
  _placeBreadcrumb(nav) {
    var _a, _b;
    const w = this.w;
    const gridTop = w.layout.translateY || 0;
    const dimHelpers = (_b = (_a = this.ctx) == null ? void 0 : _a.dimensions) == null ? void 0 : _b.dimHelpers;
    const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
    const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT;
    if (gridTop - titleArea >= navH + 1) {
      nav.style.top = `${gridTop - navH - 1}px`;
      return;
    }
    nav.style.top = `${titleArea}px`;
    const dark = w.config.theme.mode === "dark";
    nav.style.background = dark ? "rgba(20,24,30,0.82)" : "rgba(255,255,255,0.86)";
    nav.style.borderRadius = "4px";
  }
  // ---------------------------------------------------------------- tooltip
  /**
   * A parent is not a row in the series matrix, so the shared tooltip - which
   * addresses everything by (seriesIndex, dataPointIndex) - has nothing to look
   * up. It writes into the same tooltip element instead, so the aggregate looks
   * like every other tooltip in the chart.
   * @param {MouseEvent} e
   * @param {any} node
   */
  _showParentTooltip(e, node) {
    const w = this.w;
    const t = this._tip();
    if (!t) return;
    const total = this._drawnTotal();
    const parentVal = node._parent ? node._parent._area : total;
    const pctTotal = total > 0 ? (node._area / total * 100).toFixed(1) : "0.0";
    const pctParent = parentVal > 0 ? (node._area / parentVal * 100).toFixed(1) : pctTotal;
    const cfg = this.w.config.plotOptions.treemap.parents;
    const custom = cfg && cfg.tooltip && cfg.tooltip.formatter;
    const leafCount = this._countLeaves(node);
    let html;
    if (typeof custom === "function") {
      html = custom({
        name: node.name,
        value: node._area,
        depth: node.depth || 0,
        leafCount,
        percentOfParent: Number(pctParent),
        percentOfTotal: Number(pctTotal),
        node,
        w
      });
    } else {
      const marker = this._parentChrome(node.depth || 0).headerBg;
      const groupBg = w.config.tooltip.fillSeriesColor ? `background-color:${marker};` : "";
      html = `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}"><div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${Utils.escapeString(
        node.name
      )}: </span><span class="apexcharts-tooltip-text-y-value">${this._formatValue(
        node._area
      )}</span></div><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${leafCount} items, </span><span class="apexcharts-tooltip-text-y-value">${pctParent}% of parent, ${pctTotal}% of total</span></div></div></div>`;
    }
    t.innerHTML = html;
    t.classList.add("apexcharts-active");
    t.style.opacity = "1";
    this._tipOwned = true;
    this._positionTooltip(e);
  }
  /** @returns {any} */
  _tip() {
    if (!this._tooltipEl) {
      this._tooltipEl = this.w.dom.baseEl.querySelector(".apexcharts-tooltip");
    }
    return this._tooltipEl;
  }
  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  _positionTooltip(e) {
    const t = this._tip();
    if (!t || !this._tipOwned) return;
    const rect = this.w.dom.elWrap.getBoundingClientRect();
    const tw = t.offsetWidth;
    const th = t.offsetHeight;
    const pad = 12;
    let x = e.clientX - rect.left + pad;
    if (x + tw > rect.width) x = e.clientX - rect.left - tw - pad;
    x = Math.max(0, Math.min(x, rect.width - tw));
    let y = e.clientY - rect.top + pad;
    if (y + th > rect.height) y = e.clientY - rect.top - th - pad;
    y = Math.max(0, Math.min(y, rect.height - th));
    t.style.left = x + "px";
    t.style.top = y + "px";
  }
  _hideParentTooltip() {
    const t = this._tip();
    if (!t || !this._tipOwned) return;
    this._tipOwned = false;
    t.classList.remove("apexcharts-active");
    t.style.opacity = "0";
  }
  /**
   * The whole tree's area, zoomed in or not: "% of total" has to mean the same
   * thing at every zoom level, otherwise the branch you just zoomed into
   * reports 100%.
   * @returns {number}
   */
  _drawnTotal() {
    if (this._total == null) {
      this._total = (this.drawn || []).reduce(
        (s, r) => s + this._subtreeArea(r),
        0
      );
    }
    return this._total || 0;
  }
  /**
   * A node's area, computed the same way the layout does it. Zooming lays out
   * only the focused branch, so every other branch reaches here without the
   * `_area` the layout would otherwise have left on it.
   * @param {any} node
   * @returns {number}
   */
  _subtreeArea(node) {
    if (node._area != null) return node._area;
    const kids = node.children;
    if (kids && kids.length) {
      let s = 0;
      for (let i = 0; i < kids.length; i++) s += this._subtreeArea(kids[i]);
      return s;
    }
    const v = Number(node.value);
    return isNaN(v) ? 0 : Math.abs(v);
  }
  /**
   * @param {any} node
   * @returns {number}
   */
  _countLeaves(node) {
    if (!node.children || !node.children.length) return 1;
    return node.children.reduce(
      (s, c) => s + this._countLeaves(c),
      0
    );
  }
  /**
   * Format an aggregate the way the chart formats its own y values, so a
   * parent's total reads like the tiles it contains.
   * @param {number} v
   * @returns {string}
   */
  _formatValue(v) {
    var _a, _b, _c, _d, _e;
    const w = this.w;
    const fmt = ((_b = (_a = w.config.tooltip) == null ? void 0 : _a.y) == null ? void 0 : _b.formatter) || ((_e = (_d = (_c = w.config.yaxis) == null ? void 0 : _c[0]) == null ? void 0 : _d.labels) == null ? void 0 : _e.formatter);
    if (typeof fmt === "function") {
      try {
        return String(fmt(v, { seriesIndex: 0, dataPointIndex: 0, w }));
      } catch (_) {
      }
    }
    return String(v);
  }
  /**
   * Whether a tile could show a label at all, decided from geometry alone so
   * nothing has to be measured to find out.
   *
   * Two rules, both about legibility rather than about saving work:
   *   - a tile that cannot hold one character in EITHER orientation has no
   *     label to draw, rotated or not
   *   - below `dataLabels.minFontSize` the text is decoration, not information
   *
   * Together these keep a dense treemap from spending its whole render
   * measuring text nobody can read.
   *
   * @param {number} fontSize
   * @param {number} tileWidth
   * @param {number} tileHeight
   * @returns {boolean}
   */
  _labelCanShow(fontSize, tileWidth, tileHeight) {
    if (!Number.isFinite(fontSize) || fontSize <= 0) return false;
    const cfg = this.w.config.plotOptions.treemap.dataLabels;
    const min = cfg && cfg.minFontSize != null ? Number(cfg.minFontSize) : 0;
    if (fontSize < min) return false;
    return Math.max(tileWidth, tileHeight) >= fontSize;
  }
  /**
   * Mean label length across the whole chart.
   *
   * It scales every tile's font size, and it is the same number for all of
   * them, so it is computed once per draw. It used to be recomputed inside
   * `getFontSize`, which runs per tile: two full walks of every label, per
   * label, which is quadratic and was the entire cost of a large treemap (a
   * 10k-tile chart spent ~9s here).
   *
   * @returns {number}
   */
  _averageLabelSize() {
    if (this._avgLabelSize != null) return this._avgLabelSize;
    function totalLabelLength(arr) {
      let i, total = 0;
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += totalLabelLength(arr[i]);
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += arr[i].length;
        }
      }
      return total;
    }
    function countLabels(arr) {
      let i, total = 0;
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += countLabels(arr[i]);
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += 1;
        }
      }
      return total;
    }
    this._avgLabelSize = totalLabelLength(this.labels) / countLabels(this.labels);
    return this._avgLabelSize;
  }
  // This calculates a font-size based upon
  // average label length and the size of the box
  /**
   * @param {number[]} coordinates
   */
  getFontSize(coordinates) {
    const w = this.w;
    const averagelabelsize = this._averageLabelSize();
    function fontSize(width, height) {
      const area = width * height;
      const arearoot = Math.pow(area, 0.5);
      return Math.min(
        arearoot / averagelabelsize,
        parseInt(w.config.dataLabels.style.fontSize, 10)
      );
    }
    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1]
    );
  }
  /**
   * @param {any} elText
   * @param {string | number} fontSize
   * @param {string} text
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  rotateToFitLabel(elText, fontSize, text, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w);
    const textRect = graphics.getTextRects(text, String(fontSize));
    if (textRect.width + this.w.config.stroke.width + 5 > x2 - x1 && textRect.width <= y2 - y1) {
      const labelRotatingCenter = graphics.rotateAroundCenter(elText.node);
      elText.node.setAttribute(
        "transform",
        `rotate(-90 ${labelRotatingCenter.x} ${labelRotatingCenter.y}) translate(${textRect.height / 3})`
      );
    }
  }
  // This is an alternative label formatting method that uses a
  // consistent font size, and trims the edge of long labels
  /**
   * @param {string} text
   * @param {number} fontSize
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   */
  truncateLabels(text, fontSize, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w);
    const textRect = graphics.getTextRects(text, String(fontSize));
    const labelMaxWidth = textRect.width + this.w.config.stroke.width + 5 > x2 - x1 && y2 - y1 > x2 - x1 ? y2 - y1 : x2 - x1;
    const truncatedText = graphics.getTextBasedOnMaxWidth({
      text,
      maxWidth: labelMaxWidth,
      fontSize
    });
    if (text.length !== truncatedText.length && labelMaxWidth / fontSize < 5) {
      return "";
    } else {
      return truncatedText;
    }
  }
  /**
   * True when the active cross-type morph can pair marks by branch identity
   * rather than by draw order.
   * @returns {boolean}
   */
  _morphKeyed() {
    var _a;
    const m = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange;
    return !!(m && typeof m.hasKeyedMarks === "function" && m.hasKeyedMarks() && typeof m.getInitialPathForKey === "function");
  }
  /**
   * The captured shape a LEAF tile unrolls from, or null when the outgoing
   * chart had nothing to give it.
   *
   * Branch identity first, so a tile unrolls from the arc that stood for the
   * same row rather than the k-th one. That key can find nothing even when
   * both sides carry keys, and a FLAT treemap taking from a nested sunburst is
   * exactly that case: its tiles are keyed at depth one ('/0:Tops') while the
   * arcs are keyed at the depth they actually sit ('/0:Apparel/0:Tops'), so no
   * key ever matches. Draw order is the fallback, the same one the mirror
   * direction has always had (Sunburst._morphSourceFor), and without it
   * treemap -> sunburst read as a morph while the return trip grew from
   * nothing.
   *
   * Leaves only. A container taking a leaf's path by position would unroll
   * from a different branch entirely, so `_morphParent` stays key-or-nothing.
   *
   * @param {any} leaf
   * @returns {string | null}
   */
  _morphSourceForLeaf(leaf) {
    var _a;
    const morph = (_a = this.ctx) == null ? void 0 : _a.morphTypeChange;
    if (!morph || typeof morph.getInitialPathAt !== "function") return null;
    if (this._morphKeyed()) {
      const keyed = morph.getInitialPathForKey(morphKey(leaf._key));
      if (keyed) return keyed;
    }
    return morph.getInitialPathAt(this._morphLeafIndex++);
  }
  /**
   * A tile as closed path data, for the cross-type morph (a <rect> cannot hold
   * an arc, so a morphing tile is drawn as a <path>).
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @returns {string}
   */
  _tilePath(x1, y1, x2, y2) {
    return `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2} Z`;
  }
  /**
   * Tween a tile's path data from a captured shape (a sunburst arc) into its
   * rectangle.
   *
   * Routed through Animations.morphSVG, the same call every other morphing
   * renderer makes: it already selects the polygon-resample algorithm while a
   * cross-type morph is active, which is what tweens between shapes as
   * different as an arc and a rectangle. Reaching for the interpolator directly
   * would also add a name to a module the split bundles share, which breaks
   * them.
   *
   * @param {any} el
   * @param {string} fromD
   * @param {string} toD
   * @param {number} speed
   * @param {number} i
   * @param {number} j
   */
  _morphTile(el, fromD, toD, speed, i, j) {
    const animations = new Animations(this.w, this.ctx);
    animations.morphSVG(el, i, j, "none", fromD, toD, speed, 0);
  }
  /**
   * @param {any} el
   * @param {Record<string, any>} fromRect
   * @param {Record<string, any>} toRect
   * @param {number} speed
   * @param {number} [delay] - per-tile cascade delay in ms
   */
  animateTreemap(el, fromRect, toRect, speed, delay = 0) {
    const animations = new Animations(this.w);
    animations.animateRect(
      el,
      fromRect,
      toRect,
      speed,
      () => {
        animations.animationCompleted(el);
      },
      delay
    );
  }
}
_core__default.use({
  treemap: TreemapChart
});
export {
  default2 as default
};
