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
 * ApexCharts v6.5.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const CoreUtils = _core.__apex_CoreUtils;
const Graphics = _core.__apex_Graphics;
const Fill = _core.__apex_Fill;
const DataLabels = _core.__apex_DataLabels;
const Markers = _core.__apex_Markers;
const Scatter = _core.__apex_charts_Scatter;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
class Helpers {
  /**
   * @param {import('../../../charts/Line').default} lineCtx
   */
  constructor(lineCtx) {
    this.w = lineCtx.w;
    this.lineCtx = lineCtx;
  }
  /**
   * @param {number} i
   * @param {any[]} series
   */
  sameValueSeriesFix(i, series) {
    const w = this.w;
    if (w.config.fill.type === "gradient" || w.config.fill.type[i] === "gradient") {
      const coreUtils = new CoreUtils(this.lineCtx.w);
      if (coreUtils.seriesHaveSameValues(i)) {
        const gSeries = series[i].slice();
        gSeries[gSeries.length - 1] = gSeries[gSeries.length - 1] + 1e-6;
        series[i] = gSeries;
      }
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
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp];
      if ((gpp.type === "line" || gpp.type === "area") && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(realIndex, 10)) {
        if (gpp.type === "line") {
          this.lineCtx.appendPathFrom = false;
          pathFromLine = w.globals.previousPaths[pp].paths[0].d;
        } else if (gpp.type === "area") {
          this.lineCtx.appendPathFrom = false;
          pathFromArea = w.globals.previousPaths[pp].paths[0].d;
          if (w.config.stroke.show && w.globals.previousPaths[pp].paths[1]) {
            pathFromLine = w.globals.previousPaths[pp].paths[1].d;
          }
        }
      }
    }
    return {
      pathFromLine,
      pathFromArea
    };
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
          lineYPosition = this.lineCtx.prevSeriesY[i - 1][0];
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
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const Environment = _core.__apex_Environment_Environment;
function easeInOutSine(t) {
  return -Math.cos(t * Math.PI) / 2 + 0.5;
}
function cubicBezier(x1, y1, x2, y2) {
  x1 = Math.min(Math.max(x1, 0), 1);
  x2 = Math.min(Math.max(x2, 0), 1);
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const solveT = (x) => {
    let t = x;
    for (let i = 0; i < 5; i++) {
      const d = slopeX(t);
      if (d === 0) break;
      t -= (sampleX(t) - x) / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    if (t < lo) return lo;
    if (t > hi) return hi;
    while (lo < hi) {
      const xt = sampleX(t);
      if (Math.abs(xt - x) < 1e-4) return t;
      if (x > xt) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  };
  return (t) => t <= 0 ? 0 : t >= 1 ? 1 : sampleY(solveT(t));
}
const REGISTRY = /* @__PURE__ */ new Map();
const linear = (t) => t;
REGISTRY.set("linear", linear);
REGISTRY.set("easeInOutSine", easeInOutSine);
REGISTRY.set("easeInSine", (t) => 1 - Math.cos(t * Math.PI / 2));
REGISTRY.set("easeOutSine", (t) => Math.sin(t * Math.PI / 2));
REGISTRY.set("easeInQuad", (t) => t * t);
REGISTRY.set("easeOutQuad", (t) => 1 - (1 - t) * (1 - t));
REGISTRY.set(
  "easeInOutQuad",
  (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
);
REGISTRY.set("easeInCubic", (t) => t * t * t);
REGISTRY.set("easeOutCubic", (t) => 1 - Math.pow(1 - t, 3));
REGISTRY.set(
  "easeInOutCubic",
  (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
);
REGISTRY.set("easeOutBack", (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
});
REGISTRY.set("easeInOutBack", (t) => {
  const c1 = 1.70158;
  const c2 = c1 * 1.525;
  return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
});
function isBezierArray(v) {
  return Array.isArray(v) && v.length === 4 && v.every((n) => typeof n === "number");
}
function resolveEasing(value) {
  if (typeof value === "function") return value;
  if (isBezierArray(value))
    return cubicBezier(value[0], value[1], value[2], value[3]);
  if (typeof value === "string" && REGISTRY.has(value)) {
    return (
      /** @type {(t:number)=>number} */
      REGISTRY.get(value)
    );
  }
  return easeInOutSine;
}
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
  var _a, _b, _c, _d;
  if ((_a = w.axisFlags) == null ? void 0 : _a.isXNumeric) {
    const sx = (_c = (_b = w.seriesData) == null ? void 0 : _b.seriesX) == null ? void 0 : _c[realIndex];
    if (sx && sx.length && sx[j] != null) return "x:" + sx[j];
  }
  const lbl = (_d = w.globals.labels) == null ? void 0 : _d[j];
  if (lbl != null && String(lbl) !== "") {
    return "c:" + (Array.isArray(lbl) ? lbl.join(" ") : String(lbl));
  }
  return "j:" + j;
}
function frameDatumKey(frame, realIndex, j) {
  var _a, _b;
  if (frame.isXNumeric) {
    const sx = (_a = frame.seriesX) == null ? void 0 : _a[realIndex];
    if (sx && sx.length && sx[j] != null) return "x:" + sx[j];
  }
  const lbl = (_b = frame.labels) == null ? void 0 : _b[j];
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
function seriesJoin(w, realIndex, includeIdentity = false, allowReorder = false) {
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
  const newKeys = uniquifyKeys(newY.map((_, j) => datumKey(w, realIndex, j)));
  const join = joinKeys(oldKeys, newKeys);
  if (!join.ordered && !allowReorder) return null;
  if (!join.changed && !includeIdentity) return null;
  return { join, oldKeys, newKeys };
}
function morphEasing(w) {
  var _a, _b;
  const anim = w.config.chart.animations;
  return resolveEasing((_b = (_a = anim.dynamicAnimation) == null ? void 0 : _a.easing) != null ? _b : anim.easing);
}
function rafTween(w, duration, ease, onFrame, onDone) {
  const startAt = performance.now();
  const step = (now) => {
    if (w.globals.isDestroyed) return;
    const raw = Math.max(0, Math.min(1, (now - startAt) / duration));
    onFrame(ease(raw), raw);
    if (raw < 1) {
      BrowserAPIs.requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  };
  BrowserAPIs.requestAnimationFrame(step);
}
function tweenSeriesMarkers(w, { elPointsMain, realIndex, speed }) {
  var _a, _b, _c, _d;
  if (!(elPointsMain == null ? void 0 : elPointsMain.node)) return false;
  const sj = seriesJoin(w, realIndex, true);
  if (!sj) return false;
  const frame = w.globals.prevStreamFrame;
  if (!frame) return false;
  const oldXP = (_a = frame.xPixels) == null ? void 0 : _a[realIndex];
  const oldYP = (_b = frame.yPixels) == null ? void 0 : _b[realIndex];
  if (!oldXP || !oldYP) return false;
  const markers = elPointsMain.node.querySelectorAll(".apexcharts-marker");
  if (!markers.length) return false;
  const newXP = ((_c = w.globals.seriesXvalues) == null ? void 0 : _c[realIndex]) || [];
  const newYP = ((_d = w.globals.seriesYvalues) == null ? void 0 : _d[realIndex]) || [];
  const ease = morphEasing(w);
  const duration = Math.max(1, speed || 1);
  elPointsMain.node.classList.remove("apexcharts-element-hidden");
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
        }
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
    rafTween(w, duration, ease, apply, () => {
      node.removeAttribute("transform");
    });
  });
  return true;
}
function reconcileSeriesPaths(w, { type, realIndex, pathFromLine, pathFromArea, linePaths, areaPaths }) {
  var _a, _b;
  const sj = seriesJoin(w, realIndex);
  if (!sj) return null;
  const { join, oldKeys, newKeys } = sj;
  const frame = w.globals.prevStreamFrame;
  if (!frame) return null;
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
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.prevSeriesY = [];
    const allSeries = [];
    for (let i = 0; i < series.length; i++) {
      series = this.lineHelpers.sameValueSeriesFix(i, series);
      const realIndex = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const translationsIndex = this.yRatio.length > 1 ? realIndex : 0;
      this._initSerieVariables(series, i, realIndex);
      const yArrj = [];
      const y2Arrj = [];
      const xArrj = [];
      let x = w.globals.padHorizontal + this.categoryAxisCorrection;
      const y = 1;
      const linePaths = [];
      const areaPaths = [];
      Series.addCollapsedClassToSeries(this.w, this.elSeries, realIndex);
      if (w.axisFlags.isXNumeric && w.seriesData.seriesX.length > 0) {
        x = (w.seriesData.seriesX[realIndex][0] - w.globals.minX) / this.xRatio;
      }
      xArrj.push(x);
      const pX = x;
      let pY2;
      const prevX = pX;
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
      const pathsFrom = this._calculatePathsFrom({
        type,
        series,
        i,
        realIndex,
        translationsIndex,
        prevX,
        prevY,
        prevY2
      });
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
        const pathsFrom2 = this._calculatePathsFrom({
          series: seriesRangeEnd,
          i,
          realIndex,
          prevX,
          prevY: prevY2
        });
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
        paths.pathFromLine = rangePaths.pathFromLine + paths.pathFromLine;
      } else if (!/z\s*$/i.test(paths.pathFromArea)) {
        paths.pathFromArea += "z";
      }
      this._handlePaths({ type, realIndex, i, paths });
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
  /** @param {{ type?: any, series?: any, i?: any, realIndex?: any, translationsIndex?: any, prevX?: any, prevY?: any, prevY2?: any }} opts */
  _calculatePathsFrom({
    type,
    series,
    i,
    realIndex,
    translationsIndex,
    prevX,
    prevY,
    prevY2
  }) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    let linePath, areaPath, pathFromLine, pathFromArea;
    if (series[i][0] === null) {
      for (let s = 0; s < series[i].length; s++) {
        if (series[i][s] !== null) {
          prevX = this.xDivision * s;
          prevY = this.zeroY - series[i][s] / this.yRatio[translationsIndex];
          linePath = graphics.move(prevX, prevY);
          areaPath = graphics.move(prevX, this.areaBottomY);
          break;
        }
      }
    } else {
      linePath = graphics.move(prevX, prevY);
      if (type === "rangeArea") {
        linePath = graphics.move(prevX, prevY2) + graphics.line(prevX, prevY);
      }
      areaPath = graphics.move(prevX, this.areaBottomY) + graphics.line(prevX, prevY);
    }
    pathFromLine = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    pathFromArea = graphics.move(0, this.areaBottomY) + graphics.line(0, this.areaBottomY);
    if (w.globals.previousPaths.length > 0) {
      const pathFrom = this.lineHelpers.checkPreviousPaths({
        pathFromLine,
        pathFromArea,
        realIndex
      });
      pathFromLine = pathFrom.pathFromLine;
      pathFromArea = pathFrom.pathFromArea;
    }
    return {
      prevX,
      prevY,
      linePath,
      areaPath,
      pathFromLine,
      pathFromArea
    };
  }
  /** @param {{type: any, realIndex: any, i: any, paths: any}} opts */
  _handlePaths({ type, realIndex, i, paths }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const emit = seriesEmitter(this.ctx, graphics);
    const fill = new Fill(this.w);
    this.prevSeriesY.push(paths.yArrj);
    let streamScroll = null;
    if ((type === "line" || type === "area") && w.globals.dataChanged) {
      streamScroll = detectStreamScroll(w, realIndex, paths.xArrj, paths.yArrj);
    }
    let reconcile = null;
    if (!streamScroll && (type === "line" || type === "area")) {
      reconcile = reconcileSeriesPaths(w, {
        type,
        realIndex,
        pathFromLine: paths.pathFromLine,
        pathFromArea: paths.pathFromArea,
        linePaths: paths.linePaths,
        areaPaths: paths.areaPaths
      });
    }
    w.globals.seriesXvalues[realIndex] = paths.xArrj;
    w.globals.seriesYvalues[realIndex] = paths.yArrj;
    const forecast = w.config.forecastDataPoints;
    if (forecast.count > 0 && type !== "rangeArea") {
      const forecastCutoff = w.globals.seriesXvalues[realIndex][w.globals.seriesXvalues[realIndex].length - forecast.count - 1];
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
      tweenSeriesMarkers(w, {
        elPointsMain: this.elPointsMain,
        realIndex,
        speed: w.config.chart.animations.dynamicAnimation.speed
      });
      if (seriesJoin(w, realIndex) && ((_a = this.elDataLabelsWrap) == null ? void 0 : _a.node)) {
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
    if (type === "area") {
      const pathFill = fill.fillPath({
        seriesNumber: realIndex
      });
      for (let p = 0; p < paths.areaPaths.length; p++) {
        const renderedPath = emit.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: streamScroll ? projectPathToPrevFrame(paths.areaPaths[p], streamScroll) : (_c = (_b = reconcile == null ? void 0 : reconcile.area) == null ? void 0 : _b.from) != null ? _c : paths.pathFromArea,
          pathTo: paths.areaPaths[p],
          pathToNumeric: numericXY ? {
            xs: numericXY.xs,
            ys: numericXY.ys,
            closeY: numericXY.areaCloseY
          } : void 0,
          pathToInterp: (_d = reconcile == null ? void 0 : reconcile.area) == null ? void 0 : _d.toInterp,
          scrollMorph: !!streamScroll,
          stroke: "none",
          strokeWidth: 0,
          strokeLineCap: null,
          fill: pathFill
        }));
        this.elSeries.add(renderedPath);
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
      for (let p = 0; p < paths.linePaths.length; p++) {
        let pathFill = lineFill;
        if (type === "rangeArea") {
          pathFill = fill.fillPath({
            seriesNumber: realIndex
          });
        }
        const linePathCommonOpts = __spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: streamScroll ? projectPathToPrevFrame(paths.linePaths[p], streamScroll) : (_f = (_e = reconcile == null ? void 0 : reconcile.line) == null ? void 0 : _e.from) != null ? _f : paths.pathFromLine,
          pathTo: paths.linePaths[p],
          pathToNumeric: numericXY ? { xs: numericXY.xs, ys: numericXY.ys } : void 0,
          pathToInterp: (_g = reconcile == null ? void 0 : reconcile.line) == null ? void 0 : _g.toInterp,
          scrollMorph: !!streamScroll,
          stroke: lineFill,
          strokeWidth: this.strokeWidth,
          strokeLineCap: w.config.stroke.lineCap,
          fill: type === "rangeArea" ? pathFill : "none"
        });
        const renderedPath = emit.renderPaths(linePathCommonOpts);
        this.elSeries.add(renderedPath);
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
    var _a, _b;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const yRatio = this.yRatio;
    let { prevY, linePath, areaPath, pathFromLine, pathFromArea } = pathsFrom;
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
    for (let j = 0; j < iterations; j++) {
      if (series[i].length === 0) break;
      const isNull = typeof series[i][j + 1] === "undefined" || series[i][j + 1] === null;
      if (w.axisFlags.isXNumeric) {
        let sX = w.seriesData.seriesX[realIndex][j + 1];
        if (typeof w.seriesData.seriesX[realIndex][j + 1] === "undefined") {
          sX = w.seriesData.seriesX[realIndex][iterations - 1];
        }
        x = (sX - w.globals.minX) / this.xRatio;
      } else {
        x = x + this.xDivision;
      }
      if (stackSeries) {
        if (i > 0 && w.globals.collapsedSeries.length < w.config.series.length - 1) {
          const prevIndex = (pi) => {
            for (let pii = pi; pii > 0; pii--) {
              if (w.globals.collapsedSeriesIndices.indexOf(
                (seriesIndex == null ? void 0 : seriesIndex[pii]) || pii
              ) > -1) {
                pii--;
              } else {
                return pii;
              }
            }
            return 0;
          };
          lineYPosition = this.prevSeriesY[prevIndex(i - 1)][j + 1];
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
      this.handleNullDataPoints(series, pointsPos, i, j, realIndex);
      this._handleMarkersAndLabels({
        type,
        pointsPos,
        i,
        j,
        realIndex,
        isRangeStart
      });
    }
    return {
      yArrj,
      xArrj,
      pathFromArea,
      areaPaths,
      pathFromLine,
      linePaths,
      linePath,
      areaPath
    };
  }
  /** @param {{type: any, pointsPos: any, isRangeStart: any, i: any, j: any, realIndex: any}} opts */
  _handleMarkersAndLabels({ type, pointsPos, isRangeStart, i, j, realIndex }) {
    const w = this.w;
    const dataLabels = new DataLabels(this.w, this.ctx);
    if (!this.pointsChart) {
      const useProgressive = !w.globals.dataChanged && !w.globals.resized;
      if (!useProgressive && w.seriesData.series[i].length > 1) {
        this.elPointsMain.node.classList.add("apexcharts-element-hidden");
      }
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
      linePath,
      areaPath,
      numericXY: nxs ? { xs: nxs, ys: nys, areaCloseY: bottomY } : void 0
    };
  }
  /** @param {{type: any, series: any, i: any, j: any, x: any, y: any, xArrj: any, yArrj: any, y2: any, y2Arrj: any, pX: any, pY: any, pathState: any, segmentStartX: any, linePath: any, areaPath: any, linePaths: any, areaPaths: any, curve: any, isRangeStart: any}} opts */
  _createPaths({
    type,
    series,
    i,
    j,
    x,
    y,
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
            const _xAj = isRangeStart ? xArrj : xArrj.slice().reverse();
            const _yAj = isRangeStart ? yAj : yAj.slice().reverse();
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
        const length = (x - pX) * 0.35;
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
                const p = graphics.curve(pX + length, pY, x - length, y, x, y);
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
                const p = graphics.curve(pX + length, pY, x - length, y, x, y);
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
        const pathToPoint = (curve2, x2, y3) => {
          let path = "";
          switch (curve2) {
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
                linePaths.push(linePath);
                areaPaths.push(areaPath);
                break;
              }
              pathState = 1;
              if (j < series[i].length - 2) {
                const p = pathToPoint(curve, x, y);
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
                const p = pathToPoint(curve, x, y);
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
