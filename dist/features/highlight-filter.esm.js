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
 * ApexCharts v8.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const CoreUtils = _core.__apex_CoreUtils;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
const prefersReducedMotion = _core.__apex_Animations_prefersReducedMotion;
const DataLabels = _core.__apex_DataLabels;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const Environment = _core.__apex_Environment_Environment;
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
function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer;
  return r && r.kind && r.kind !== "svg" ? r : graphics;
}
const PART = "apexcharts-highlight-part";
const PLAIN = { f: 1, o: 0 };
const COVERED = { f: 0, o: 0 };
const look = (f) => ({ f, o: f < 1 ? 1 : 0 });
const finite = (v) => typeof v === "number" && v === v && v !== Infinity && v !== -Infinity;
const mix = (x, y, t) => t >= 1 ? y : x + (y - x) * t;
const isPoint = (p) => p && typeof p === "object" && !Array.isArray(p);
const ownOpacity = (node, attr = "fill-opacity") => {
  var _a;
  const cmd = (_a = node.instance) == null ? void 0 : _a._cmd;
  const v = parseFloat(
    cmd ? cmd[attr.replace("-o", "O")] : node.getAttribute(attr)
  );
  return isFinite(v) ? v : 1;
};
function solid(paint2) {
  const s = typeof paint2 === "string" ? paint2.trim() : "";
  let m;
  let r = null;
  if (m = /^rgba\(([^,]+,[^,]+,[^,]+),([^)]+)\)$/i.exec(s)) {
    r = [`rgb(${m[1]})`, parseFloat(m[2])];
  } else if (m = /^color-mix\(in srgb, (.+) ([\d.]+)%, transparent\)$/.exec(s)) {
    r = [m[1], parseFloat(m[2]) / 100];
  } else if (m = /^(#[\da-f]{6})([\da-f]{2})$/i.exec(s)) {
    r = [m[1], parseInt(m[2], 16) / 255];
  }
  return r && r[1] > 0 && r[1] < 1 ? r : [paint2, 1];
}
function info(p, whole) {
  const share = p != null && whole ? p / whole : null;
  return {
    value: p != null ? p : null,
    total: whole != null ? whole : null,
    share,
    overflow: share == null ? false : share < 0 ? "sign" : share > 1
  };
}
function drawnAt(t) {
  let x = parseFloat(t.getAttribute("x"));
  let y = parseFloat(t.getAttribute("y"));
  String(t.getAttribute("transform") || "").replace(
    /translate\(\s*([^\s,)]+)[\s,]*([^\s,)]*)\s*\)/g,
    (_m, a, b) => {
      x += parseFloat(a) || 0;
      y += parseFloat(b) || 0;
      return "";
    }
  );
  return [x, y];
}
const HIT_EVENTS = [
  "mousemove",
  "mousedown",
  "mouseup",
  "mouseover",
  "mouseout",
  "click",
  "touchstart",
  "touchmove",
  "touchend"
];
function bindHit(whole, n) {
  const hits = whole._apxHits || (whole._apxHits = /* @__PURE__ */ new Set());
  if (!whole._apxHitStop) {
    whole._apxHitStop = true;
    const stop = (e) => {
      if (hits.has(e.relatedTarget)) e.stopImmediatePropagation();
    };
    ["mouseout", "mouseleave", "mouseover", "mouseenter"].forEach(
      (t) => whole.addEventListener(t, stop, true)
    );
  }
  hits.add(n);
  HIT_EVENTS.forEach(
    (t) => n.addEventListener(
      t,
      (e) => {
        e.stopPropagation();
        const enter = t === "mouseover";
        const leave = t === "mouseout";
        if ((enter || leave) && e.relatedTarget === whole) return;
        forward(whole, t, e);
        if (enter) forward(whole, "mouseenter", e);
        if (leave) forward(whole, "mouseleave", e);
      },
      { passive: true }
    )
  );
}
function mirrorFilter(whole, n) {
  const sync = () => {
    const f = whole.getAttribute("filter");
    if (f) n.setAttribute("filter", f);
    else n.removeAttribute("filter");
  };
  sync();
  Environment.isBrowser() && typeof MutationObserver !== "undefined" && new MutationObserver(sync).observe(whole, {
    attributes: true,
    attributeFilter: ["filter"]
  });
}
function insertAfter(node, n) {
  const parent = node.parentNode;
  const kids = Array.from(parent.childNodes);
  parent.insertBefore(n, kids[kids.indexOf(node) + 1] || null);
}
const addClass = (n, c) => n.setAttribute("class", `${n.getAttribute("class") || ""} ${c}`.trim());
function forward(target, type, e) {
  try {
    const init = e.touches ? {
      bubbles: true,
      cancelable: true,
      touches: Array.from(e.touches),
      targetTouches: Array.from(e.targetTouches),
      changedTouches: Array.from(e.changedTouches)
    } : type === "mouseenter" || type === "mouseleave" ? {
      clientX: e.clientX,
      clientY: e.clientY,
      screenX: e.screenX,
      screenY: e.screenY,
      relatedTarget: e.relatedTarget,
      buttons: e.buttons
    } : e;
    target.dispatchEvent(new e.constructor(type, init));
  } catch (_) {
  }
}
function stripSeries(s) {
  if (!isPoint(s)) return s;
  const _a = s, { highlightData: _hd, highlight: _h } = _a, rest = __objRest(_a, ["highlightData", "highlight"]);
  ["data", "children"].forEach((k) => {
    if (Array.isArray(rest[k])) rest[k] = rest[k].map(stripPoint);
  });
  return rest;
}
function slicePoints(series) {
  const pts = [];
  (series || []).forEach(
    (s) => (isPoint(s) && Array.isArray(s.data) ? s.data : []).forEach(
      (d) => {
        if (isPoint(d) && d.x !== void 0 && (d.y !== void 0 || Array.isArray(d.children))) {
          pts.push(d);
        }
      }
    )
  );
  return pts;
}
const carries = (d) => isPoint(d) && ("highlight" in d || "highlightData" in d || [d.data, d.children].some((a) => Array.isArray(a) && a.some(carries)));
const stripPoint = (d) => isPoint(d) && ("highlight" in d || Array.isArray(d.children)) ? stripSeries(d) : d;
const PIE = "p:";
const CIRCLE = ["pie", "donut", "polarArea"];
function piePass(hf, p) {
  var _a;
  const w = hf.w;
  const hd = w.highlightData;
  if (!hd) return;
  if (hf._render !== p) hf._beginRender(p, PIE);
  if (!hd.active && !((_a = hf._prev()) == null ? void 0 : _a.size)) return;
  if (hd.active && p.chartType === "polarArea" && hf.cfg.axis !== "clamp") {
    hd.parts.forEach((r) => {
      if (finite(r[0])) p.maxY = Math.max(p.maxY, r[0]);
    });
  }
  const ap = p.animatePaths;
  const da = p.drawArcs;
  const gm = p.getSliceMovers;
  const gh = p.getHoverOutlinePath;
  const s = {
    /** Each slice's arc animation as the whole was handed it, and its mark.
     * @type {any[]} */
    arcs: [],
    /** What moves with each slice besides the renderer's own. @type {any[][]} */
    movers: [],
    /** How far a slice reaches where its part goes past it. @type {number[]} */
    reach: [],
    ap
  };
  p.animatePaths = (el, a) => {
    const c = __spreadValues({}, a);
    ap.call(p, el, a);
    c.run = a.dur;
    s.arcs[a.i] = { a: c, el };
  };
  p.drawArcs = (...args) => {
    const g = da.apply(p, args);
    paint(hf, p, g, s);
    return g;
  };
  p.getSliceMovers = (i) => gm.call(p, i).concat(s.movers[i] || []);
  p.getHoverOutlinePath = (i) => {
    const sizes = p.sliceSizes;
    if (!(s.reach[i] > sizes[i])) return gh.call(p, i);
    p.sliceSizes = sizes.slice();
    p.sliceSizes[i] = s.reach[i];
    try {
      return gh.call(p, i);
    } finally {
      p.sliceSizes = sizes;
    }
  };
  wrapCentre(hf, p);
}
function wrapCentre(hf, p) {
  const ri = p.renderInnerDataLabels;
  const pi = p.printInnerLabels;
  p.renderInnerDataLabels = (g, c, o) => centre(hf, () => ri.call(p, g, labelsCfg(hf, c, 0), o));
  p.printInnerLabels = (c, name, val, el) => centre(
    hf,
    () => pi.call(
      p,
      labelsCfg(hf, c, el ? +el.parentNode.getAttribute("rel") - 1 : -1),
      name,
      val,
      el
    )
  );
}
function centre(hf, fn) {
  var _a, _b;
  const gl = hf.w.globals;
  const hd = hf.w.highlightData;
  if (!(hd == null ? void 0 : hd.active) || ((_b = (_a = hf.cfg.dataLabels) == null ? void 0 : _a.total) != null ? _b : "part") !== "part") {
    return fn();
  }
  const keep = gl.seriesTotals;
  gl.seriesTotals = hd.parts.map((r) => {
    var _a2;
    return (_a2 = r[0]) != null ? _a2 : 0;
  });
  try {
    return fn();
  } finally {
    gl.seriesTotals = keep;
  }
}
function labelsCfg(hf, c, i) {
  var _a, _b;
  const w = hf.w;
  const hd = w.highlightData;
  if (!(hd == null ? void 0 : hd.active)) return c;
  const vals = w.seriesData.series;
  const parts = hd.parts.map((r) => r[0]);
  const part = i > -1 && ((_b = (_a = hf.cfg.dataLabels) == null ? void 0 : _a.value) != null ? _b : "part") === "part" ? parts[i] : null;
  const sum = (a) => a.reduce((t, v) => t + (finite(v) ? v : 0), 0);
  const tf = c.total.formatter;
  const vf = c.value.formatter;
  return __spreadProps(__spreadValues({}, c), {
    total: __spreadProps(__spreadValues({}, c.total), {
      formatter: tf && ((x) => tf(x, { highlight: info(sum(parts), sum(vals)) }))
    }),
    value: __spreadProps(__spreadValues({}, c.value), {
      formatter: (v, x) => vf(part != null ? part : v, x, {
        highlight: i > -1 ? info(parts[i], vals[i]) : void 0
      })
    })
  });
}
const proxy = (p, size, own) => Object.create(p, __spreadValues({
  getSliceExtent: {
    value: (o) => p.getSliceExtent(__spreadProps(__spreadValues({}, o), { size }))
  }
}, own));
function paint(hf, p, g, s) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const hd = w.highlightData;
  const active = hd.active;
  const prevMap = hf._prev();
  const type = p.chartType;
  const polar = type === "polarArea";
  const R = gl.radialSize;
  const base = type === "donut" ? p.donutSize : 0;
  const fadeTo = active ? (_a = cfg.fadeOpacity) != null ? _a : 0.2 : 1;
  const morph = ((_b = hf.ctx.morphTypeChange) == null ? void 0 : _b.isActive()) === true;
  const mount = !gl.dataChanged || !gl.shouldAnimate;
  const area = ((_c = cfg.pie) == null ? void 0 : _c.encoding) === "area";
  const vals = w.seriesData.series;
  const byPart = ((_e = (_d = cfg.dataLabels) == null ? void 0 : _d.value) != null ? _e : "part") === "part";
  const outline = p.strokeWidth > 0 && ((_g = (_f = cfg.outline) == null ? void 0 : _f.width) != null ? _g : 1) > 0 ? { opacity: (_i = (_h = cfg.outline) == null ? void 0 : _h.opacity) != null ? _i : 1 } : null;
  const labelsWas = (_j = gl.prevHighlightLabels) == null ? void 0 : _j.get(-1);
  const rides = [];
  const has = (n, c) => {
    var _a2, _b2;
    return ((_a2 = n.classList) == null ? void 0 : _a2.contains(c)) || ` ${(_b2 = n.getAttribute) == null ? void 0 : _b2.call(n, "class")} `.indexOf(` ${c} `) > -1;
  };
  Array.from(g.node.childNodes).filter((n) => has(n, "apexcharts-pie-series")).forEach((sg) => {
    var _a2, _b2, _c2, _d2, _e2, _f2;
    const node = Array.from(sg.childNodes).find(
      (n) => has(n, "apexcharts-pie-area")
    );
    if (!node) return;
    const i = Number(node.getAttribute("j"));
    const key = PIE + i;
    const prev = mount ? void 0 : prevMap == null ? void 0 : prevMap.get(key);
    if (!active && !prev) return;
    const arc = s.arcs[i];
    const whole = vals[i];
    const pv = active ? (_a2 = hd.parts[i]) == null ? void 0 : _a2[0] : null;
    const size = p.sliceSizes[i];
    const full = polar ? size : R;
    const anim = Environment.isBrowser() && !!arc && arc.a.run > 0 && !morph;
    const delayMs = +(arc == null ? void 0 : arc.a.animBeginArr[i]) || 0;
    const share = pv != null && whole > 0 ? pv / whole : null;
    let toR = null;
    let over = false;
    if (share != null && share > 0) {
      over = share > 1;
      if (polar) {
        toR = Math.min(R, size * share);
      } else {
        const t2 = Math.min(share, 1);
        toR = area ? Math.sqrt(base * base + t2 * (R * R - base * base)) : base + (R - base) * t2;
      }
    }
    const was = (_b2 = prev == null ? void 0 : prev.lr) != null ? _b2 : prev == null ? void 0 : prev.fr;
    let target = toR;
    const exit = toR == null && was != null && anim;
    if (exit) {
      target = gl.collapsedSeriesIndices.indexOf(i) > -1 ? was * R : active ? base : full;
    }
    const lands = exit && !active;
    let fromR = target;
    let cover = false;
    if (target != null && anim && !mount) {
      if (was != null) fromR = was * R;
      else if (prev || cfg.enter === "baseline") fromR = base;
      else {
        cover = true;
        fromR = polar ? (_c2 = arc.a.prevSize) != null ? _c2 : size : R;
      }
      if (!exit && !(Math.abs(arc.a.prevEndAngle - arc.a.prevStartAngle) > 0.01)) {
        fromR = target;
        cover = false;
      }
    }
    let part = null;
    let edge = null;
    const moves = (n) => {
      const tf = node.getAttribute("transform");
      if (tf) {
        n.setAttribute("transform", tf);
        n.classList.add("apexcharts-slice-mover");
        n.style.transition = node.style.transition;
      }
      (s.movers[i] = s.movers[i] || []).push(n);
    };
    const wedge = (px, el, r, from) => {
      if (arc && !morph) {
        s.ap.call(px, el, __spreadProps(__spreadValues({}, arc.a), {
          size: r,
          prevSize: mount ? void 0 : from,
          isTrack: true
        }));
      } else {
        const a = Number(node.getAttribute("data:angle"));
        el.attr({
          d: px.getPiePath({
            me: px,
            startAngle: Number(node.getAttribute("data:startAngle")),
            angle: a >= p.fullAngle ? p.fullAngle - 0.01 : a,
            size: r
          }),
          "stroke-width": px.strokeWidth
        });
      }
    };
    const fill = node.getAttribute("fill");
    const [ink, ca] = solid(fill);
    const own = ownOpacity(node);
    const plain = !!fill && fill !== "none" && !/^url\(/i.test(fill);
    const alpha = plain ? ca * own : own;
    const a0 = !plain ? own : cover ? alpha : was != null ? (_d2 = prev.al) != null ? _d2 : 1 : 1;
    const a1 = !plain ? own : lands ? alpha : 1;
    if (target != null) {
      const px = proxy(p, full);
      part = new Graphics(w).drawPath({
        d: "",
        fill: ink,
        stroke: node.getAttribute("stroke"),
        strokeWidth: 0,
        fillOpacity: a0,
        classes: `${PART} apexcharts-pie-highlight-part`
      });
      const pn = part.node;
      pn.setAttribute("pointer-events", "none");
      if (share != null) pn.setAttribute("data:hl-share", String(share));
      sg.appendChild(pn);
      moves(pn);
      if (anim && !mount) {
        pn.setAttribute(
          "d",
          px.getChangedPath(arc.a.prevStartAngle, arc.a.prevEndAngle, fromR)
        );
      }
      wedge(px, part, target, fromR);
      if (over && !exit) pn.classList.add("apexcharts-highlight-overflow");
      mirrorFilter(node, pn);
      if (over && !exit || exit && (prev == null ? void 0 : prev.edge)) {
        edge = new Graphics(w).drawPath({
          d: "",
          fill: "none",
          stroke: "#fff",
          strokeWidth: 1,
          strokeDashArray: 3,
          classes: `${PART} apexcharts-highlight-edge`
        });
        edge.node.setAttribute("pointer-events", "none");
        edge.node.setAttribute("stroke-opacity", "0");
        sg.appendChild(edge.node);
        moves(edge.node);
        const ex = proxy(p, full, { strokeWidth: { value: 1 } });
        wedge(ex, edge, polar ? size : R - 2, polar ? arc == null ? void 0 : arc.a.prevSize : R - 2);
      }
      if (polar && over && !exit) {
        pn.removeAttribute("pointer-events");
        bindHit(node, pn);
        s.reach[i] = target;
      }
      if (morph) {
        const els = [pn, edge == null ? void 0 : edge.node].filter(Boolean);
        const show = (t2) => els.forEach((n) => n.setAttribute("opacity", t2));
        show(0);
        hf._tween(
          hf.ctx.morphTypeChange.getSpeed(),
          w.config.chart.animations.dynamicAnimation.speed,
          show,
          () => els.forEach((n) => n.removeAttribute("opacity"))
        );
      }
    }
    const rec = {
      d: null,
      fr: null,
      f: fadeTo,
      edge: false,
      c: !active,
      al: a1
    };
    hf._targets.set(key, rec);
    const e1 = over && toR != null ? 0.75 : 0;
    const e0 = mount ? e1 : (prev == null ? void 0 : prev.edge) ? 0.75 : 0;
    const r0 = fromR != null ? fromR : 0;
    const r1 = target != null ? target : 0;
    hf._fade(
      node,
      mount ? look(fadeTo) : cover ? COVERED : prev ? { f: prev.f, o: (_e2 = prev.o) != null ? _e2 : look(prev.f).o } : PLAIN,
      lands ? COVERED : look(fadeTo),
      { delayMs, speed: arc == null ? void 0 : arc.a.run, el: arc == null ? void 0 : arc.el },
      {
        anim,
        force: !!part && (r0 !== r1 || e0 !== e1 || a0 !== a1),
        outline: outline && __spreadProps(__spreadValues({}, outline), { color: gl.colors[i] }),
        also: (t2) => {
          if (part) {
            rec.lr = mix(r0, r1, t2) / R;
            rec.la = mix(a0, a1, t2);
            part.node.setAttribute("fill-opacity", String(rec.la));
          }
          edge == null ? void 0 : edge.node.setAttribute("stroke-opacity", String(mix(e0, e1, t2)));
        },
        land: lands ? PLAIN : void 0,
        // A retired part leaves on the frame its whole lands.
        done: exit ? () => {
          part == null ? void 0 : part.remove();
          edge == null ? void 0 : edge.remove();
          rec.lr = null;
        } : void 0,
        rec
      }
    );
    if (toR != null) {
      Object.assign(rec, { fr: toR / R, edge: over, n: part.node });
    }
    const lg = p.sliceLabelGroups[i];
    const t = lg && Array.from(lg.childNodes).find(
      (n) => has(n, "apexcharts-pie-label")
    );
    if (t && active) {
      if (pv == null && byPart) {
        p.sliceLabels = p.sliceLabels.filter(
          (x) => x.node !== lg
        );
        (_f2 = lg.parentNode) == null ? void 0 : _f2.removeChild(lg);
        delete p.sliceLabelGroups[i];
        return;
      }
      label(w, p, node, t, i, byPart ? pv : null, whole, toR, base);
    }
    if (t && anim && !mount && labelsWas) {
      rides.push({ t, src: labelsWas.get(i), el: arc.el, delayMs, arc });
    }
  });
  if (rides.length) hf._ride = () => ride(hf, rides);
}
function label(w, p, node, t, i, pv, whole, r, base) {
  var _a, _b;
  const fmt = w.config.dataLabels.formatter;
  if (pv != null) {
    const pct = (_b = (_a = w.globals.seriesPercent[i]) == null ? void 0 : _a[0]) != null ? _b : 0;
    const v = whole ? pct * pv / whole : 0;
    t.textContent = String(
      fmt ? fmt(v, {
        seriesIndex: i,
        dataPointIndex: i,
        series: w.seriesData.series,
        w,
        highlight: info(pv, whole)
      }) : v + "%"
    );
  }
  const fs = parseFloat(t.getAttribute("font-size")) || 12;
  const a0 = Number(node.getAttribute("data:startAngle"));
  const span = Number(node.getAttribute("data:angle"));
  if (pv != null && r != null && r - base >= 1.2 * fs) {
    const off = w.config.plotOptions.pie.dataLabels.offset;
    const at = Utils.polarToCartesian(
      p.centerX,
      p.centerY,
      p.chartType === "donut" ? (base + r) / 2 + off : r / 1.25 + off,
      (a0 + span / 2) % p.fullAngle
    );
    t.setAttribute("x", at.x);
    t.setAttribute("y", at.y);
  }
  const box = new Graphics(w).getTextRects(
    t.textContent,
    t.getAttribute("font-size"),
    t.getAttribute("font-family"),
    void 0,
    true,
    t.getAttribute("font-weight")
  );
  const x = parseFloat(t.getAttribute("x"));
  const y = parseFloat(t.getAttribute("y"));
  const on = r != null && [
    [x - box.width / 2, y - box.height * 0.75],
    [x + box.width / 2, y - box.height * 0.75],
    [x - box.width / 2, y + box.height * 0.25],
    [x + box.width / 2, y + box.height * 0.25]
  ].every(([cx, cy]) => {
    const dx = cx - p.centerX;
    const dy = cy - p.centerY;
    const d = Math.hypot(dx, dy);
    const ang = ((Math.atan2(dy, dx) * 180 / Math.PI + 90 - a0) % 360 + 360) % 360;
    return d >= base && d <= r && ang <= span;
  });
  if (!on) {
    t.setAttribute("fill", w.config.chart.foreColor);
    t.removeAttribute("filter");
  }
}
function ride(hf, rides) {
  rides.forEach(({ t, src, el, delayMs, arc }) => {
    if (!t.isConnected) return;
    const [x, y] = drawnAt(t);
    const dx = src ? src.x - x : 0;
    const dy = src ? src.y - y : 0;
    if (src && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    hf._tween(
      delayMs,
      arc.a.run,
      (e) => {
        const k = 1 - e;
        if (k > 0 && src)
          t.setAttribute("transform", `translate(${dx * k} ${dy * k})`);
        else t.removeAttribute("transform");
        if (!src) {
          if (e < 1) t.setAttribute("opacity", String(e));
          else t.removeAttribute("opacity");
        }
      },
      void 0,
      void 0,
      el
    );
  });
}
const RAD = "r:";
const NEEDLE = RAD + "n";
const OWN = RAD + "o";
const LINE$1 = RAD + "w";
const NEEDLE_KEYS = ["length", "baseWidth", "tipWidth", "offsetY"];
const LANE = 0.45;
const LANE_CLS = `${PART} apexcharts-radialbar-highlight-lane`;
function radialPass(hf, r) {
  var _a, _b, _c, _d, _e, _f, _g;
  const w = hf.w;
  const hd = w.highlightData;
  const said = (_b = (_a = hf.ctx.lastUpdateOptions) == null ? void 0 : _a.tooltip) == null ? void 0 : _b.enabled;
  if (said != null) hf._tipUser = said;
  else if (hf._tipOn) w.config.tooltip.enabled = false;
  hf._tipOn = false;
  if (!hd) return;
  if (hf._render !== r) hf._beginRender(r, RAD);
  morphOut(hf);
  const rb = w.config.plotOptions.radialBar;
  hf._ind = (_d = (_c = hf.cfg.radialBar) == null ? void 0 : _c.indicator) != null ? _d : rb.shape === "needle" ? "needle" : "arc";
  if (hf._ind === "lanes" && rb.shape === "needle" && !((_e = rb.needle) == null ? void 0 : _e.showValueArc)) {
    hf._ind = "needle";
  }
  if (!hd.active && !((_f = hf._prev()) == null ? void 0 : _f.size)) return;
  const tt = w.config.tooltip;
  if (hd.active && !tt.enabled && hf._tipUser == null && Environment.isBrowser()) {
    tt.enabled = true;
    hf._tipOn = true;
  }
  wrapCentre(hf, r);
  centreLanes(hf, r);
  const dn = r.drawNeedle;
  r.drawNeedle = (o) => {
    const g = dn.call(r, o);
    ownNeedle(hf, r, g);
    return g;
  };
  const ap = r.animatePaths;
  r.animatePaths = (el, a) => {
    const c = __spreadValues({}, a);
    ap.call(r, el, a);
    if (a.isTrack) return;
    c.run = a.dur;
    ring(hf, r, el, c, ap);
  };
  if (((_g = hf.ctx.morphTypeChange) == null ? void 0 : _g.isActive()) === true) {
    Promise.resolve().then(() => {
      var _a2;
      if (hf._render !== r || w.globals.isDestroyed) return;
      (_a2 = w.dom.baseEl) == null ? void 0 : _a2.querySelectorAll(
        ".apexcharts-radial-series .apexcharts-radialbar-area"
      ).forEach((n) => ring(hf, r, n.instance, null, ap));
    });
  }
}
function ring(hf, r, el, c, ap) {
  var _a, _b, _c, _d, _e, _f;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const hd = w.highlightData;
  const active = hd.active;
  const node = el.node;
  const i = c ? c.i : Number(node.getAttribute("j"));
  const key = RAD + i;
  const morph = !c;
  const mount = !gl.dataChanged || !gl.shouldAnimate;
  const prevMap = hf._prev();
  const prev = mount ? void 0 : prevMap == null ? void 0 : prevMap.get(key);
  const rb = w.config.plotOptions.radialBar;
  const ind = hf._ind;
  const st = node.getAttribute("stroke");
  const fl = node.getAttribute("fill");
  const paint2 = st && st !== "transparent" ? st : morph && fl && fl !== "none" ? fl : null;
  const needle = i === 0 && (ind === "needle" || !paint2);
  const whole = w.seriesData.series[i];
  const pv = active && gl.collapsedSeriesIndices.indexOf(i) < 0 ? (_b = (_a = hd.parts[i]) == null ? void 0 : _a[0]) != null ? _b : null : null;
  const start = r.startAngle;
  const wholeEnd = c ? c.endAngle : r._arcEnd(whole);
  const run = c ? c.run : 0;
  const anim = Environment.isBrowser() && run > 0;
  const delayMs = c ? +c.animBeginArr[i] || 0 : 0;
  const fadeTo = (_c = cfg.fadeOpacity) != null ? _c : 0.2;
  const faded = active && !needle && !!paint2;
  const REST = { f: fadeTo, o: 0 };
  const size = c ? c.size : Math.hypot(
    node.getAttribute("data:cx") - gl.circleGeometry.cx,
    node.getAttribute("data:cy") - gl.circleGeometry.cy
  );
  if (ind === "lanes" && paint2) {
    lanes(hf, r, el, {
      i,
      c,
      prev,
      mount,
      pv,
      whole,
      wholeEnd,
      run,
      anim,
      delayMs,
      size,
      paint: paint2
    });
    if (i === 0) needlePart(hf, r, el, false, pv, mount, morph, c);
    return;
  }
  const toE = faded && pv != null ? r._arcEnd(pv) : null;
  const has = toE != null && toE - start > 0.01;
  const was = (_d = prev == null ? void 0 : prev.e) != null ? _d : null;
  const exit = !has && was != null && anim;
  const lands = exit && !faded;
  const target = has ? toE : exit ? lands ? wholeEnd : start : null;
  let fromE = target;
  let cover = false;
  if (target != null && anim && !mount) {
    if (was != null) fromE = was;
    else if (prev || cfg.enter === "baseline") fromE = start;
    else {
      cover = true;
      fromE = finite(c.prevEndAngle) ? c.prevEndAngle : wholeEnd;
    }
  }
  const arcD = (e) => {
    const span = e - start;
    return r.getPiePath({
      me: r,
      startAngle: start,
      angle: span === r.fullAngle ? r.fullAngle - 0.01 : span,
      size
    });
  };
  let part = null;
  if (target != null && paint2) {
    part = new Graphics(w).drawPath({
      d: "",
      stroke: paint2,
      strokeWidth: morph ? r.getStrokeWidth({
        size: gl.circleGeometry.r,
        series: w.seriesData.series
      }) : Number(node.getAttribute("stroke-width")),
      fill: "none",
      // The whole's own strength, taken before the whole is faded.
      strokeOpacity: ownOpacity(node, "stroke-opacity"),
      strokeDashArray: (_e = node.getAttribute("stroke-dasharray")) != null ? _e : 0,
      classes: `${PART} apexcharts-radialbar-highlight-part`
    });
    const pn = part.node;
    pn.setAttribute("aria-hidden", "true");
    insertAfter(node, pn);
    if (has && pv > (typeof rb.max === "number" ? rb.max : 100)) {
      addClass(pn, "apexcharts-highlight-overflow");
    }
    mirrorFilter(node, pn);
    if (has && toE - wholeEnd > 0.01) bindHit(node, pn);
    else pn.setAttribute("pointer-events", "none");
    if (c && anim && !mount) {
      pn.setAttribute("d", arcD(fromE));
      ap.call(r, part, __spreadProps(__spreadValues({}, c), {
        endAngle: target,
        prevStartAngle: start,
        prevEndAngle: fromE,
        isTrack: true
      }));
    } else if (c) {
      ap.call(r, part, __spreadProps(__spreadValues({}, c), { endAngle: target, dur: run, isTrack: true }));
    } else {
      pn.setAttribute("d", arcD(target));
    }
  }
  const k1 = has && toE - wholeEnd > 0.01 ? 0.75 : 0;
  const k0 = mount ? k1 : (_f = prev == null ? void 0 : prev.tk) != null ? _f : 0;
  let tick = null;
  if (part && (k1 || k0 && anim)) {
    const sw = Number(part.node.getAttribute("stroke-width")) || 0;
    const cx = c ? c.centerX : gl.circleGeometry.cx;
    const cy = c ? c.centerY : gl.circleGeometry.cy;
    tick = new Graphics(w).drawPath({
      d: "",
      fill: "none",
      stroke: "#fff",
      strokeWidth: 1,
      strokeDashArray: 3,
      classes: `${PART} apexcharts-highlight-edge apexcharts-radialbar-highlight-edge`
    });
    const tn = tick.node;
    tn.setAttribute("pointer-events", "none");
    tn.setAttribute("aria-hidden", "true");
    tn.setAttribute("stroke-opacity", String(k0));
    insertAfter(part.node, tn);
    const at = (a) => {
      const p = Utils.polarToCartesian(cx, cy, size - sw / 2, a);
      const q = Utils.polarToCartesian(cx, cy, size + sw / 2, a);
      tn.setAttribute("d", `M ${p.x} ${p.y} L ${q.x} ${q.y}`);
    };
    const a0 = anim ? finite(c.prevEndAngle) && !mount ? c.prevEndAngle : start : wholeEnd;
    at(a0);
    if (a0 !== wholeEnd) {
      tick.animate(run, delayMs).during((t) => at(mix(a0, wholeEnd, t)));
    }
  }
  const shows = [];
  if (part && morph) shows.push(part.node);
  if (tick && morph) shows.push(tick.node);
  const rec = { d: null, e: null, f: faded ? fadeTo : 1, c: !active };
  if (paint2 && (active || prev)) {
    hf._targets.set(key, rec);
    const e0 = fromE != null ? fromE : 0;
    const e1 = target != null ? target : 0;
    if (part) rec.e = e1;
    if (part && c && anim && !mount && e0 !== e1) {
      rec.e = e0;
      part.animate(run, delayMs).during(
        (t) => rec.e != null && (rec.e = mix(e0, e1, t))
      );
    }
    const sp = w.config.chart.animations.dynamicAnimation.speed;
    hf._fade(
      node,
      mount && !morph ? faded ? REST : PLAIN : cover ? COVERED : prev ? { f: prev.f, o: 0 } : PLAIN,
      lands ? COVERED : faded ? REST : PLAIN,
      morph ? { delayMs: hf.ctx.morphTypeChange.getSpeed(), speed: sp } : { delayMs, speed: run, el },
      {
        attr: "stroke-opacity",
        anim: morph ? Environment.isBrowser() : anim,
        force: !!part && (morph || e0 !== e1 || k0 !== k1),
        also: (t) => {
          if (tick) {
            rec.tk = mix(k0, k1, t);
            tick.node.setAttribute("stroke-opacity", String(rec.tk));
          }
          shows.forEach(
            (s) => t < 1 ? s.setAttribute("opacity", t) : s.removeAttribute("opacity")
          );
        },
        land: lands ? PLAIN : void 0,
        // A retired part leaves on the frame its whole lands, and a tick
        // once it has faded.
        done: exit || tick && !k1 ? () => {
          if (exit) {
            part == null ? void 0 : part.remove();
            rec.e = null;
          }
          tick == null ? void 0 : tick.remove();
          rec.tk = 0;
        } : void 0,
        rec
      }
    );
    if (part) rec.n = part.node;
  }
  if (i === 0) needlePart(hf, r, el, needle, pv, mount, morph, c);
}
function lanes(hf, r, el, o) {
  var _a, _b, _c, _d, _e, _f, _g;
  const { i, c, prev, mount, pv, whole, wholeEnd, run, anim, delayMs, size } = o;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const rb = w.config.plotOptions.radialBar;
  const active = w.highlightData.active;
  const node = el.node;
  const morph = !c;
  const start = r.startAngle;
  const s1 = active && gl.collapsedSeriesIndices.indexOf(i) < 0 ? 1 : 0;
  const go = morph ? Environment.isBrowser() && !!s1 : anim && !mount;
  const sweep = !morph && anim && mount;
  const s0 = morph ? 0 : go ? (_a = prev == null ? void 0 : prev.s) != null ? _a : 0 : s1;
  const clock = morph ? {
    delayMs: hf.ctx.morphTypeChange.getSpeed(),
    speed: w.config.chart.animations.dynamicAnimation.speed
  } : { delayMs, speed: run };
  if (i === 0) lineClock(hf, go ? __spreadProps(__spreadValues({}, clock), { el }) : null);
  if (!s1 && !s0) return;
  const toE = pv != null ? r._arcEnd(pv) : start;
  const we1 = wholeEnd;
  const e1 = s1 ? toE : we1;
  let we0 = we1;
  let e0 = e1;
  if (morph) e0 = cfg.enter === "baseline" ? start : we1;
  else if (go) {
    we0 = (_b = prev == null ? void 0 : prev.we) != null ? _b : finite(c.prevEndAngle) ? c.prevEndAngle : we1;
    e0 = (_c = prev == null ? void 0 : prev.e) != null ? _c : cfg.enter === "baseline" ? start : we0;
  } else if (sweep) we0 = e0 = start;
  const f1 = s1 ? (_f = (_e = (_d = cfg.radialBar) == null ? void 0 : _d.lanes) == null ? void 0 : _e.opacity) != null ? _f : LANE : 1;
  const f0 = morph ? 1 : go ? prev ? prev.f : 1 : f1;
  const sw = morph ? r.getStrokeWidth({
    size: gl.circleGeometry.r,
    series: w.seriesData.series
  }) : Number(node.getAttribute("stroke-width"));
  const own = node.getAttribute("stroke-opacity");
  const lane = (cls) => {
    var _a2;
    const p = new Graphics(w).drawPath({
      d: "",
      stroke: o.paint,
      strokeWidth: sw,
      fill: "none",
      // The whole's own strength, taken before the whole is hidden.
      strokeOpacity: ownOpacity(node, "stroke-opacity"),
      strokeDashArray: (_a2 = node.getAttribute("stroke-dasharray")) != null ? _a2 : 0,
      classes: `${LANE_CLS} ${cls}`
    });
    p.node.setAttribute("aria-hidden", "true");
    mirrorFilter(node, p.node);
    return p;
  };
  const wl = lane("apexcharts-radialbar-highlight-whole");
  const pl = lane("apexcharts-radialbar-highlight-part");
  insertAfter(node, wl.node);
  insertAfter(wl.node, pl.node);
  wl.node.setAttribute("pointer-events", "none");
  if (s1 && toE - we1 > 0.01) bindHit(node, pl.node);
  else pl.node.setAttribute("pointer-events", "none");
  if (pv != null && (pv > (whole != null ? whole : 0) || pv > (typeof rb.max === "number" ? rb.max : 100))) {
    addClass(pl.node, "apexcharts-highlight-overflow");
  }
  const n = w.seriesData.series.length;
  const tn = tracksOf(r)[rb.inverseOrder ? n - 1 - i : i];
  const t0 = tn && [tn.getAttribute("d"), tn.getAttribute("stroke-width")];
  const pct = t0 ? (parseFloat(t0[1]) || 0) / (sw || 1) : 0;
  let it = null;
  if (tn) {
    it = new Graphics(w).drawPath({
      d: "",
      stroke: tn.getAttribute("stroke"),
      strokeWidth: 0,
      fill: "none",
      strokeOpacity: (_g = tn.getAttribute("stroke-opacity")) != null ? _g : 1,
      classes: `${PART} apexcharts-radialbar-highlight-track`
    });
    const tf = tn.getAttribute("filter");
    if (tf) it.node.setAttribute("filter", tf);
    it.node.setAttribute("pointer-events", "none");
    it.node.setAttribute("aria-hidden", "true");
    insertAfter(tn, it.node);
  }
  const R0 = size - sw / 2;
  const R1 = size + sw / 2;
  const one = n < 2;
  const gap = one ? Math.max(2, sw * 0.12) : Math.max(1, Math.min(sw * 0.08, r.margin / 3));
  const inset = one ? 0 : Math.max(0, (3 * gap - r.margin) / 2);
  const lw = Math.max(0.5, (sw - gap) / 2 - inset);
  const arcAt = (e, R) => {
    const span = e - start;
    return span > 0.01 ? r.getPiePath({
      me: r,
      startAngle: start,
      angle: span === r.fullAngle ? r.fullAngle - 0.01 : span,
      size: R
    }) : "";
  };
  const trackAt = (R) => {
    const ts = r.trackStartAngle;
    let te = r.trackEndAngle;
    if (Math.abs(te) + Math.abs(ts) >= 360) {
      te = 360 - Math.abs(r.startAngle) - 0.1;
    }
    const span = te < ts ? r.fullAngle + te - ts : te - ts;
    return r.getPiePath({
      me: r,
      startAngle: ts,
      angle: span === r.fullAngle ? span - 0.01 : span,
      size: R
    });
  };
  const put = (m, d, width) => {
    m.setAttribute("d", d);
    m.setAttribute("stroke-width", String(width));
  };
  const rec = {
    d: null,
    c: !active,
    f: f1,
    cx: c ? c.centerX : gl.circleGeometry.cx,
    cy: c ? c.centerY : gl.circleGeometry.cy
  };
  hf._targets.set(RAD + i, rec);
  const draw = (s, we, e) => {
    rec.s = s;
    rec.we = we;
    rec.e = e;
    const wo = R1 - inset * s;
    const wi = R0 + s * (R1 - inset - lw - R0);
    const pi = R0 + inset * s;
    const po = pi + s * lw;
    rec.mid = (wi + po) / 2;
    put(wl.node, arcAt(we, (wi + wo) / 2), wo - wi);
    put(pl.node, po > pi ? arcAt(e, (pi + po) / 2) : "", po - pi);
    if (!tn) return;
    if (s) {
      put(tn, trackAt((wi + wo) / 2), (wo - wi) * pct);
      put(it.node, trackAt((pi + po) / 2), (po - pi) * pct);
    } else {
      put(tn, t0[0], t0[1]);
      put(it.node, "", 0);
    }
  };
  const els = [wl.node, pl.node, it == null ? void 0 : it.node].filter(Boolean);
  let shown = !morph;
  const show = () => {
    shown = true;
    node.setAttribute("stroke-opacity", "0");
    els.forEach((m) => m.removeAttribute("opacity"));
  };
  if (shown) show();
  else els.forEach((m) => m.setAttribute("opacity", "0"));
  draw(s0, we0, e0);
  let gone = false;
  if (go || sweep) {
    wl.animate(clock.speed, clock.delayMs).during((t) => {
      if (gone) return;
      if (!shown) show();
      draw(mix(s0, s1, t), mix(we0, we1, t), mix(e0, e1, t));
    });
  }
  hf._fade(
    wl.node,
    { f: f0, o: 0 },
    { f: f1, o: 0 },
    __spreadProps(__spreadValues({}, clock), { el: wl }),
    {
      attr: "stroke-opacity",
      anim: go,
      force: go,
      // Merged back: the ring comes back the frame its lanes leave.
      done: s1 ? void 0 : () => {
        gone = true;
        els.forEach((m) => m.remove());
        if (tn) put(tn, t0[0], t0[1]);
        if (own == null) node.removeAttribute("stroke-opacity");
        else node.setAttribute("stroke-opacity", own);
        rec.s = 0;
      },
      rec
    }
  );
  if (Environment.isBrowser()) {
    const at = (e) => {
      hf._lane = [i, laneAt(node, e, rec)];
    };
    ["mouseover", "mousemove", "mousedown", "touchstart", "touchmove"].forEach(
      (t) => node.addEventListener(t, at, true)
    );
  }
}
function laneAt(node, e, rec) {
  var _a, _b;
  const p = ((_a = e.touches) == null ? void 0 : _a[0]) || e;
  const m = (_b = node.getScreenCTM) == null ? void 0 : _b.call(node);
  if (!m || !(rec.s > 0)) return "part";
  const x = p.clientX - m.e;
  const y = p.clientY - m.f;
  const det = m.a * m.d - m.b * m.c || 1;
  const ux = (m.d * x - m.c * y) / det;
  const uy = (m.a * y - m.b * x) / det;
  return Math.hypot(ux - rec.cx, uy - rec.cy) > rec.mid ? "whole" : "part";
}
function morphOut(hf) {
  const mt = hf.ctx.morphTypeChange;
  if (!mt || mt._hfOut) return;
  mt._hfOut = true;
  const cb = mt.captureBeforeDestroy;
  mt.captureBeforeDestroy = (a) => {
    const plan = outPlan(hf, a == null ? void 0 : a.fromType);
    if (!plan) return cb.call(mt, a);
    const cf = mt._captureFromDOM;
    mt._captureFromDOM = (t) => {
      const got = cf.call(mt, t);
      got.marks.forEach((m) => {
        var _a;
        m.d = (_a = plan.marks.get(m.realIndex)) != null ? _a : m.d;
      });
      return got;
    };
    let ok;
    try {
      ok = cb.call(mt, a);
    } finally {
      mt._captureFromDOM = cf;
    }
    const snap = mt._snapshot;
    if (ok && snap && !mt._ghost && !snap.pieceOut && !snap.pieceIn) {
      mt._ghost = plan.ghost();
    }
    return ok;
  };
}
function outPlan(hf, from) {
  var _a, _b, _c, _d, _e;
  const w = hf.w;
  const gl = w.globals;
  const root = (_a = w.dom.baseEl) == null ? void 0 : _a.querySelector(".apexcharts-radialbar");
  if (from !== "radialBar" && from !== "gauge" || !root) return null;
  const mt = hf.ctx.morphTypeChange;
  const cx = (_c = (_b = gl.circleGeometry) == null ? void 0 : _b.cx) != null ? _c : 0;
  const cy = (_e = (_d = gl.circleGeometry) == null ? void 0 : _d.cy) != null ? _e : 0;
  const marks = /* @__PURE__ */ new Map();
  const keep = /* @__PURE__ */ new Set();
  const out = /* @__PURE__ */ new Set();
  root.querySelectorAll(".apexcharts-radial-series .apexcharts-radialbar-area").forEach((n) => {
    var _a2, _b2, _c2, _d2;
    const g = n.parentNode;
    const i = +g.getAttribute("data:realIndex");
    const key = RAD + n.getAttribute("j");
    const rec = (_b2 = hf._targets.get(key)) != null ? _b2 : (_a2 = hf._prev()) == null ? void 0 : _a2.get(key);
    const part = g.querySelector(".apexcharts-radialbar-highlight-part");
    if (!part && !((rec == null ? void 0 : rec.s) > 0) && !(((_d2 = (_c2 = rec == null ? void 0 : rec.lf) != null ? _c2 : rec == null ? void 0 : rec.f) != null ? _d2 : 1) < 1)) return;
    keep.add(n);
    const pd = part == null ? void 0 : part.getAttribute("d");
    const sw = +(part == null ? void 0 : part.getAttribute("stroke-width"));
    let d = null;
    if (pd && sw > 0 && part.getAttribute("opacity") !== "0") {
      d = mt._radialArcToFilledSegment(pd, sw, cx, cy) || pd;
      out.add(part);
    } else {
      const m = /M\s*(-?[\d.e]+)\s+(-?[\d.e]+)/.exec(
        n.getAttribute("d") || ""
      );
      if (m) d = `M ${m[1]} ${m[2]} L ${m[1]} ${m[2]} Z`;
    }
    if (d) marks.set(i, d);
  });
  const parts = [...root.getElementsByClassName(PART)];
  if (!marks.size && !parts.length) return null;
  parts.forEach(
    (m) => out.has(m) || m.closest(".apexcharts-tracks") || keep.add(m)
  );
  return {
    marks,
    // A copy of the paper with only what leaves, its paint references kept
    // (renamed, so the live chart never resolves against the copy).
    ghost: () => {
      const KEEP = "data-hf-ghost";
      keep.forEach((m) => m.setAttribute(KEEP, ""));
      const clone = w.dom.Paper.node.cloneNode(true);
      keep.forEach((m) => m.removeAttribute(KEEP));
      const kept = new Set(clone.querySelectorAll(`[${KEEP}]`));
      const up = /* @__PURE__ */ new Set();
      kept.forEach((m) => {
        m.removeAttribute(KEEP);
        for (let p = m.parentNode; p && p !== clone; p = p.parentNode) up.add(p);
      });
      const prune = (el) => [...el.children].forEach((m) => {
        if (kept.has(m)) return;
        if (up.has(m)) prune(m);
        else if (m.tagName.toLowerCase() !== "defs") m.remove();
      });
      prune(clone);
      clone.removeAttribute("id");
      [clone, ...clone.querySelectorAll("*")].forEach((m) => {
        if (m.id) m.id += "-hf";
        [...m.attributes].forEach((at) => {
          if (at.value.includes("url(#")) {
            m.setAttribute(
              at.name,
              at.value.replace(/url\(#([^)]+)\)/g, "url(#$1-hf)")
            );
          }
        });
      });
      return clone;
    }
  };
}
function tracksOf(r) {
  var _a, _b;
  if (r._hfTracks) return r._hfTracks;
  const is = (m, cls) => {
    var _a2;
    return ` ${(_a2 = m.getAttribute) == null ? void 0 : _a2.call(m, "class")} `.includes(` ${cls} `);
  };
  const kids = [...((_b = (_a = r.w.dom.Paper) == null ? void 0 : _a.node) == null ? void 0 : _b.childNodes) || []];
  let found = [];
  for (let k = kids.length - 1; k >= 0 && !found.length; k--) {
    const t = [...kids[k].childNodes || []].find(
      (m) => is(m, "apexcharts-tracks")
    );
    if (t) {
      found = [...t.childNodes].map(
        (g) => [...g.childNodes].find((m) => is(m, "apexcharts-radialbar-area"))
      );
    }
  }
  return r._hfTracks = found;
}
function centreLanes(hf, r) {
  const ri = r.renderInnerDataLabels;
  const pi = r.printInnerLabels;
  r.renderInnerDataLabels = (g, c, o) => {
    const out = ri(g || r.dataLabelsGroup, c, o);
    wholeLine(hf, r, c, -1, out);
    return out;
  };
  r.printInnerLabels = (c, name, val, el) => {
    pi(c, name, val, el);
    wholeLine(hf, r, c, el ? +el.parentNode.getAttribute("rel") - 1 : -1);
  };
}
function wholeLine(hf, r, c, i, group) {
  var _a, _b, _c;
  const w = hf.w;
  const gl = w.globals;
  if (hf._ind !== "lanes") return;
  const active = w.highlightData.active;
  let st = r._hfLine;
  if (!st) {
    const mount = !gl.dataChanged || !gl.shouldAnimate;
    const prev = mount ? void 0 : (_a = hf._prev()) == null ? void 0 : _a.get(LINE$1);
    const now = active ? wholeText(hf, c, -1) : "";
    const o1 = now ? 1 : 0;
    const o0 = mount || !Environment.isBrowser() ? o1 : (_b = prev == null ? void 0 : prev.f) != null ? _b : 0;
    st = r._hfLine = { node: null, rec: null };
    if (!o1 && !o0) return;
    st.rec = {
      d: null,
      c: !active,
      t: now || (prev == null ? void 0 : prev.t) || "",
      f: o1,
      lf: o0,
      o0,
      // The value it stood under, to hold while it leaves (see below).
      pv: o1 ? null : prev == null ? void 0 : prev.vt
    };
    hf._targets.set(LINE$1, st.rec);
  }
  const rec = st.rec;
  if (group) {
    st.node = null;
    if (!rec || !rec.lf && rec.done) return;
    const kids = group.node.childNodes;
    const v = c.value.show ? kids[kids.length - 1] : null;
    if (!v) return;
    if (rec.pv != null && !rec.done) {
      rec.hold = v.textContent;
      v.textContent = rec.pv;
    }
    rec.vt = v.textContent;
    const now = active ? wholeText(hf, c, -1) : "";
    const t = drawLine(w, c, v, now || rec.t);
    group.add(t);
    st.node = t.node;
  } else if (active) {
    const t = wholeText(hf, c, i);
    const v = (_c = w.dom.baseEl) == null ? void 0 : _c.querySelector(".apexcharts-datalabel-value");
    if (!st.node && t && i > -1 && v) {
      st.node = drawLine(w, c, v, t).node;
      v.parentNode.appendChild(st.node);
    }
    if (st.node) st.node.textContent = t;
    if (rec && v) rec.vt = v.textContent;
  }
  lineLook(st);
}
function drawLine(w, c, v, text) {
  const fv = parseFloat(c.value.fontSize) || 14;
  const fw = Math.max(11, Math.round(fv / 2));
  const t = new Graphics(w).drawText({
    x: +v.getAttribute("x"),
    // Clear of the value's descenders, at the default sizes too.
    y: +v.getAttribute("y") + fv / 4 + 4 + fw * 0.8,
    text,
    textAnchor: "middle",
    fontSize: fw + "px",
    fontFamily: c.value.fontFamily,
    fontWeight: 400,
    foreColor: v.getAttribute("fill"),
    cssClass: "apexcharts-datalabel-whole"
  });
  t.node.setAttribute("aria-hidden", "true");
  return t;
}
function lineLook(st) {
  var _a, _b, _c;
  (_c = st.node) == null ? void 0 : _c.setAttribute("fill-opacity", String(0.6 * ((_b = (_a = st.rec) == null ? void 0 : _a.lf) != null ? _b : 1)));
}
function lineClock(hf, clock) {
  var _a;
  const st = (_a = hf._render) == null ? void 0 : _a._hfLine;
  const rec = st == null ? void 0 : st.rec;
  if (!rec || rec.run || rec.lf === rec.f) return;
  const o0 = rec.lf;
  const done = () => {
    var _a2, _b;
    rec.run = false;
    if (rec.f) return;
    rec.done = true;
    const v = (_a2 = st.node) == null ? void 0 : _a2.previousSibling;
    if (rec.hold != null && v && v.textContent === rec.pv) {
      v.textContent = rec.vt = rec.hold;
    }
    (_b = st.node) == null ? void 0 : _b.remove();
    st.node = null;
  };
  if (!clock) {
    rec.lf = rec.f;
    lineLook(st);
    done();
    return;
  }
  rec.run = true;
  hf._tween(
    clock.delayMs,
    clock.speed,
    (t) => {
      rec.lf = mix(o0, rec.f, t);
      lineLook(st);
    },
    done,
    void 0,
    clock.el
  );
}
function wholeText(hf, c, i) {
  var _a, _b;
  const w = hf.w;
  const dl = hf.cfg.dataLabels || {};
  const vals = w.seriesData.series;
  const parts = w.highlightData.parts.map((p) => p[0]);
  const k = i > -1 ? i : vals.length < 2 ? 0 : -1;
  const say = (fn, h) => {
    const plain = String(fn(h));
    const own = String(fn(__spreadProps(__spreadValues({}, h), { lane: "whole" })));
    return own !== plain ? own : "/ " + plain;
  };
  if (k > -1) {
    if (((_a = dl.value) != null ? _a : "part") !== "part" || !finite(parts[k])) return "";
    return say((h) => c.value.formatter(vals[k], w, h), {
      highlight: info(parts[k], vals[k])
    });
  }
  if (!c.total.show || ((_b = dl.total) != null ? _b : "part") !== "part" || !c.total.formatter || !parts.some(finite)) {
    return "";
  }
  const sum = (a) => a.reduce((t, v) => t + (finite(v) ? v : 0), 0);
  return say((h) => c.total.formatter(w, h), {
    highlight: info(sum(parts), sum(vals))
  });
}
function needlePart(hf, r, el, needle, pv, mount, morph, c) {
  var _a, _b, _c;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const active = w.highlightData.active;
  const prev = mount ? void 0 : (_a = hf._prev()) == null ? void 0 : _a.get(NEEDLE);
  const toA = needle && pv != null ? r._angleAtValue(pv) : null;
  if (toA == null && !prev) return;
  const rb = w.config.plotOptions.radialBar;
  const motion = morph ? null : rb.shape === "needle" ? r.needleMotion() : c && c.run > 0 && Environment.isBrowser() ? { speed: c.run, delay: +c.animBeginArr[0] || 0 } : null;
  let a0;
  let o0 = 1;
  let a1 = (
    /** @type {number} */
    toA
  );
  let o1 = 1;
  const leave = toA == null;
  if (leave) {
    if (!motion) return;
    a0 = prev.ang;
    o0 = prev.op;
    a1 = active && needle ? r.startAngle : r._angleAtValue(w.seriesData.series[0]);
    o1 = 0;
  } else if (!motion) {
    a0 = a1;
  } else if (mount) {
    a0 = r.startAngle;
  } else if (prev) {
    a0 = prev.ang;
    o0 = prev.op;
  } else {
    a0 = r._angleAtValue(
      gl.dataChanged ? gl.previousPaths[0] : w.seriesData.series[0]
    );
    o0 = 0;
  }
  const cg = gl.circleGeometry;
  const own = ((_b = cfg.radialBar) == null ? void 0 : _b.needle) || {};
  const base = rb.needle || {};
  const ncfg = {};
  NEEDLE_KEYS.forEach((k) => {
    var _a2;
    return ncfg[k] = (_a2 = own[k]) != null ? _a2 : base[k];
  });
  const color = (_c = own.color) != null ? _c : gl.colors[0];
  const { path, cx, cy } = r.needlePath(
    {
      size: cg.r,
      centerX: cg.cx,
      centerY: cg.cy,
      series: w.seriesData.series
    },
    ncfg
  );
  const graphics = new Graphics(w);
  const g = graphics.group({ class: "apexcharts-gauge-needle-highlight" });
  if (leave || !Environment.isBrowser()) {
    g.node.setAttribute("pointer-events", "none");
  } else bindHit(el.node, g.node);
  g.node.setAttribute("aria-hidden", "true");
  g.node.setAttribute("transform-origin", `${cx} ${cy}`);
  g.add(
    graphics.drawPath({
      d: path,
      stroke: color,
      strokeWidth: 0,
      fill: color,
      classes: `${PART} apexcharts-gauge-needle-highlight-shape`
    })
  );
  if (pv != null && pv > (typeof rb.max === "number" ? rb.max : 100)) {
    addClass(g.node, "apexcharts-highlight-overflow");
  }
  const arcs = el.node.parentNode.parentNode;
  arcs.insertBefore(g.node, arcs.childNodes[0] || null);
  const place = () => {
    const k = [...arcs.childNodes].filter((c2) => c2 !== g.node);
    const h = k.findIndex(
      (c2) => {
        var _a2;
        return ` ${(_a2 = c2.getAttribute) == null ? void 0 : _a2.call(c2, "class")} `.includes(
          " apexcharts-radialbar-hollow "
        );
      }
    );
    if (h < 0 || g.node.parentNode !== arcs) return false;
    arcs.insertBefore(g.node, k[h + 1] || null);
    return true;
  };
  if (!place()) Promise.resolve().then(place);
  const rec = { d: null, ang: a0, op: o0, c: !active };
  hf._targets.set(NEEDLE, rec);
  const set = (a, o) => {
    rec.ang = a;
    rec.op = o;
    g.node.setAttribute("transform", `rotate(${a})`);
    if (o < 1) g.node.setAttribute("opacity", String(o));
    else g.node.removeAttribute("opacity");
  };
  const frame = (t) => set(a0 + (a1 - a0) * t, mix(o0, o1, t));
  const land = () => {
    rec.run = false;
    if (leave) g.remove();
    else set(a1, o1);
  };
  if (morph) {
    set(a1, 0);
    hf._tween(
      hf.ctx.morphTypeChange.getSpeed(),
      w.config.chart.animations.dynamicAnimation.speed,
      (t) => set(a1, t),
      land
    );
    return;
  }
  if (!motion || a0 === a1 && o0 === o1) {
    frame(1);
    land();
    return;
  }
  rec.run = true;
  frame(0);
  const m = (
    /** @type {any} */
    motion
  );
  if (m.ease) {
    const at = performance.now();
    const step = (now) => {
      if (gl.isDestroyed || hf._render !== r) return;
      const t = Math.max(0, Math.min(1, (now - at) / m.speed));
      frame(m.ease(t));
      if (t < 1) BrowserAPIs.requestAnimationFrame(step);
      else land();
    };
    BrowserAPIs.requestAnimationFrame(step);
  } else {
    g.animate(m.speed, m.delay || 0).during((t) => frame(t)).after(land);
  }
}
function ownNeedle(hf, r, g) {
  var _a, _b;
  const w = hf.w;
  const gl = w.globals;
  const active = w.highlightData.active;
  const mount = !gl.dataChanged || !gl.shouldAnimate;
  const prev = mount ? void 0 : (_a = hf._prev()) == null ? void 0 : _a.get(OWN);
  if (!active && !prev) return;
  const f1 = active ? (_b = hf.cfg.fadeOpacity) != null ? _b : 0.2 : 1;
  const f0 = mount ? f1 : prev ? prev.f : 1;
  const rec = { d: null, f: f1, c: !active };
  hf._targets.set(OWN, rec);
  const set = (f) => {
    rec.lf = f;
    if (f < 1) g.node.setAttribute("opacity", String(f));
    else g.node.removeAttribute("opacity");
  };
  const mt = hf.ctx.morphTypeChange;
  const m = (mt == null ? void 0 : mt.isActive()) ? {
    delay: mt.getSpeed(),
    speed: w.config.chart.animations.dynamicAnimation.speed
  } : r.needleMotion();
  if (m && f0 !== f1) {
    rec.run = true;
    hf._tween(
      m.delay || 0,
      m.speed,
      (t) => set(mix(f0, f1, t)),
      () => rec.run = false,
      m.ease
    );
  } else set(f1);
  if (active && Environment.isBrowser()) {
    Promise.resolve().then(() => {
      var _a2;
      const el = w.dom.baseEl;
      const whole = el == null ? void 0 : el.querySelector(".apexcharts-radialbar-slice-0");
      if (!whole || !g.node.isConnected) return;
      bindHit(whole, g.node);
      (_a2 = el.querySelector(".apexcharts-radialbar-hollow")) == null ? void 0 : _a2.setAttribute(
        "pointer-events",
        "none"
      );
    });
  }
}
const TILE = "t:";
const CLASS = "apexcharts-highlight-tile";
const OVER = "apexcharts-highlight-overflow";
const URL = /^url\(/i;
function treeParse(hf, type) {
  const gl = hf.w.globals;
  if (type !== "treemap" || !gl.treemapRoots) return false;
  const raw = (
    /** @type {any[]} */
    gl.treemapRawSeries || []
  );
  if (raw.some((s) => Array.isArray(s == null ? void 0 : s.highlightData))) {
    hf._warn(
      "nested",
      "on a nested treemap put the part on each leaf as { x, y, highlight }; highlightData is ignored."
    );
  }
  const onParent = (d) => isPoint(d) && Array.isArray(d.children) && d.children.length > 0 && ("highlight" in d || d.children.some(onParent));
  if (raw.some((s) => ((s == null ? void 0 : s.data) || []).some(onParent))) {
    hf._warn(
      "parent",
      "a parent's highlight is ignored: parents add up their leaves' parts."
    );
  }
  return true;
}
function treeSeries(hf, base, parts) {
  const w = hf.w;
  return base.map((s, i) => {
    const out = stripSeries(s);
    const row = Array.isArray(parts == null ? void 0 : parts[i]) ? parts[i] : null;
    if (typeof parts !== "function" && !row) return out;
    let k = 0;
    const leaf = (d) => {
      var _a, _b, _c;
      if (isPoint(d) && Array.isArray(d.children) && d.children.length) {
        return __spreadProps(__spreadValues({}, d), { children: d.children.map(leaf) });
      }
      const j = k++;
      const pt = isPoint(d) ? __spreadValues({}, d) : { x: "", y: d };
      pt.highlight = typeof parts === "function" ? parts({
        seriesIndex: i,
        dataPointIndex: j,
        seriesName: s.name,
        x: (_a = pt.x) != null ? _a : pt.name,
        value: typeof ((_b = pt.y) != null ? _b : pt.value) === "number" ? (_c = pt.y) != null ? _c : pt.value : null,
        datum: d,
        w
      }) : row == null ? void 0 : row[j];
      return pt;
    };
    if (Array.isArray(out.data)) out.data = out.data.map(leaf);
    return out;
  });
}
function treemapPass(hf, tm) {
  var _a, _b, _c;
  const w = hf.w;
  const gl = w.globals;
  const hd = w.highlightData;
  if (!hd) return void 0;
  hf._beginRender(tm, TILE);
  hf._tmDefs.forEach((n) => {
    var _a2;
    return (_a2 = n.parentNode) == null ? void 0 : _a2.removeChild(n);
  });
  hf._tmDefs = [];
  const tiles = hf._tiles = /* @__PURE__ */ new Map();
  const active = hd.active;
  const vals = w.seriesData.series;
  rollUp(tm, active ? hd.parts : null, vals);
  const prevMap = hf._prev();
  if (!active && !(prevMap == null ? void 0 : prevMap.size)) return void 0;
  const byIJ = /* @__PURE__ */ new Map();
  prevMap == null ? void 0 : prevMap.forEach((r) => byIJ.set(r.ij, r));
  (_a = gl.prevTreemapView) == null ? void 0 : _a.querySelectorAll(`.${CLASS}`).forEach((n) => {
    n.classList.remove(CLASS, OVER);
    n.removeAttribute("data:hl-share");
  });
  const cfg = hf.cfg;
  const fadeTo = active ? (_b = cfg.fadeOpacity) != null ? _b : 0.2 : 1;
  const morph = ((_c = hf.ctx.morphTypeChange) == null ? void 0 : _c.isActive()) === true;
  const dyn = tm.dynamicAnim;
  const anim = morph || !!(gl.dataChanged && dyn.enabled && gl.shouldAnimate);
  const speed = morph ? hf.ctx.morphTypeChange.getSpeed() : dyn.speed;
  const fore = w.config.chart.foreColor;
  let warned = false;
  if (active) wrapParentTip(hf, tm);
  let bound = null;
  const cl = tm.helpers.calculateDataLabels;
  tm.helpers.calculateDataLabels = (o) => {
    const g = cl.call(tm.helpers, o);
    const rec = bound = tiles.get(o.i + "|" + o.j);
    if (g && rec) {
      const ts = texts(g.node);
      rec.lb = ts.filter(
        (t2) => /^(#fff|#ffffff|white)$/i.test(t2.getAttribute("fill") || "")
      );
      const t = ts[0];
      const [, y1, , y2] = rec.r;
      if (t && y2 > y1) {
        const fs = parseFloat(t.getAttribute("font-size")) || 12;
        rec.need = (y2 - parseFloat(t.getAttribute("y")) + 0.9 * fs) / (y2 - y1);
      }
      tone(rec, fore);
    }
    return g;
  };
  const rf = tm.rotateToFitLabel;
  tm.rotateToFitLabel = (...a) => {
    rf.apply(tm, a);
    const rec = bound;
    bound = null;
    if ((rec == null ? void 0 : rec.lb) && /rotate/.test(a[0].node.getAttribute("transform") || "")) {
      const run = new Graphics(w).getTextRects(a[2], String(a[1])).width;
      rec.need = 0.5 + run / 2 / (a[6] - a[4]);
      rec.tone = null;
      tone(rec, fore);
    }
  };
  return (el, i, j, pathFill, leaf) => {
    var _a2, _b2, _c2, _d;
    const key = TILE + leaf._key;
    const ij = i + "|" + j;
    const whole = (_a2 = vals[i]) == null ? void 0 : _a2[j];
    const prev = anim ? (prevMap == null ? void 0 : prevMap.get(key)) || (whole ? void 0 : byIJ.get(ij)) : void 0;
    if (!active && !prev) return void 0;
    if (URL.test(pathFill)) {
      if (active && !warned) {
        warned = true;
        hf._warn(
          "fill",
          "treemap tiles with a gradient, pattern or image fill are drawn without their parts."
        );
      }
      return void 0;
    }
    const p = active ? (_b2 = hd.parts[i]) == null ? void 0 : _b2[j] : null;
    if (!whole && !prev) return void 0;
    const share = finite(p) && whole ? p / whole : null;
    let to = active ? {
      s: share == null || share < 0 ? 0 : Math.min(share, 1),
      f: fadeTo,
      c: pathFill
    } : (
      // A clear grows the part back over its tile, the faded rest at 0
      // under it, and lands on the plain tile.
      { s: 1, f: 0, c: pathFill }
    );
    let from = to;
    if (prev) {
      from = { s: prev.s, f: prev.f, c: prev.col };
      if (!whole && active) to = __spreadValues({}, from);
    } else if (anim) {
      const was = (
        /** @type {any} */
        (_c2 = gl.previousPaths[i]) == null ? void 0 : _c2[j]
      );
      if (morph || ((_d = was == null ? void 0 : was.rect) == null ? void 0 : _d.width) > 0) {
        from = cfg.enter === "baseline" ? { s: 0, f: 1, c: to.c } : { s: 1, f: 0, c: to.c };
        if (!morph && was.fill && !URL.test(was.fill)) from.c = was.fill;
      }
    }
    const moves = from.s !== to.s || from.f !== to.f || from.c !== to.c;
    if (!active && !moves) return void 0;
    const g = w.dom.Paper.gradient("linear", (add) => {
      for (let k = 0; k < 4; k++) add.stop(0, pathFill, 1);
    });
    g.from(0, 1).to(0, 0);
    hf._tmDefs.push(g.node);
    const stops = Array.from(g.node.childNodes);
    const node = el.node;
    if (active) {
      node.setAttribute(
        "class",
        `${node.getAttribute("class") || ""} ${CLASS}${share != null && share > 1 ? " " + OVER : ""}`.trim()
      );
      node.setAttribute("data:hl-share", share == null ? "" : String(share));
    }
    const rec = {
      s: to.s,
      f: to.f,
      col: to.c,
      c: !active,
      ij,
      run: false,
      base: pathFill,
      r: leaf.rect,
      lb: null,
      need: 0.5,
      tone: null
    };
    hf._targets.set(key, rec);
    tiles.set(ij, rec);
    const ease = colourEase(from.c, to.c);
    const write = (L) => {
      rec.ls = L.s;
      rec.lf = L.f;
      rec.lc = L.c;
      stops.forEach((n, k) => {
        n.setAttribute("offset", String(k === 0 ? 0 : k === 3 ? 1 : L.s));
        n.setAttribute("stop-color", L.c);
        n.setAttribute("stop-opacity", String(k < 2 ? 1 : L.f));
      });
      tone(rec, fore);
    };
    const land = () => {
      var _a3;
      rec.run = false;
      write(to);
      if (!active && node.isConnected) {
        node.setAttribute("fill", pathFill);
        (_a3 = g.node.parentNode) == null ? void 0 : _a3.removeChild(g.node);
      }
    };
    if (anim && moves) {
      rec.run = true;
      write(from);
      let f = null;
      let done = false;
      const job = {
        finish() {
          hf._live.delete(job);
          if (active) write({ s: rec.ls, f: f = to.f, c: rec.lc });
          else {
            done = true;
            land();
          }
        }
      };
      hf._hold(job);
      g.animate(speed, 0).during(
        (t) => done || write({
          s: mix(from.s, to.s, t),
          f: f != null ? f : mix(from.f, to.f, t),
          c: ease(t)
        })
      ).after(() => {
        hf._live.delete(job);
        done || land();
      });
    } else write(to);
    return g.url();
  };
}
function rollUp(tm, parts, vals) {
  const walk = (n) => {
    var _a, _b;
    const kids = n.children;
    if (!kids || !kids.length) {
      const p = (_a = parts == null ? void 0 : parts[n._si]) == null ? void 0 : _a[n._di];
      n.highlight = parts ? info(finite(p) ? p : null, (_b = vals[n._si]) == null ? void 0 : _b[n._di]) : void 0;
      return n.highlight;
    }
    let v = null;
    kids.forEach((c) => {
      const h = walk(c);
      if (h && h.value != null && !(h.value * (h.total || 0) < 0)) {
        v = (v || 0) + Math.abs(h.value);
      }
    });
    if (!parts) return n.highlight = void 0;
    const total = tm._subtreeArea(n);
    const share = v != null && total ? v / total : null;
    n.highlight = {
      value: v,
      total,
      share,
      overflow: share != null && share > 1
    };
    return n.highlight;
  };
  (tm.roots || []).forEach(walk);
}
function wrapParentTip(hf, tm) {
  const show = tm._showParentTooltip;
  tm._showParentTooltip = (e, node) => {
    var _a, _b, _c;
    show.call(tm, e, node);
    const h = node.highlight;
    const tt = hf.cfg.tooltip || {};
    if ((h == null ? void 0 : h.value) == null || tt.show === false || typeof ((_b = (_a = hf.w.config.plotOptions.treemap.parents) == null ? void 0 : _a.tooltip) == null ? void 0 : _b.formatter) === "function") {
      return;
    }
    const v = (_c = tm._tip()) == null ? void 0 : _c.querySelector(".apexcharts-tooltip-text-y-value");
    if (!v) return;
    let rest = `/ ${tm._formatValue(h.total)}`;
    if (tt.share && h.total) rest += ` · ${Math.round(h.share * 100)}%`;
    v.innerHTML = `${tm._formatValue(h.value)} <span class="apexcharts-highlight-total" style="font-weight: 400; opacity: 0.6">${rest}</span>`;
  };
}
function tone(rec, fore) {
  var _a;
  const on = ((_a = rec.ls) != null ? _a : rec.s) >= rec.need - 1e-9;
  if (!rec.lb || rec.tone === on) return;
  rec.tone = on;
  rec.lb.forEach((t) => {
    if (t._apxFill == null) t._apxFill = t.getAttribute("fill");
    t.setAttribute("fill", on ? t._apxFill : fore);
  });
}
function texts(n) {
  const out = [];
  (function walk(x) {
    if (String(x.tagName || x.nodeName).toLowerCase() === "text") out.push(x);
    Array.from(x.childNodes || []).forEach(walk);
  })(n);
  return out;
}
function colourEase(a, b) {
  const x = rgba(a);
  const y = rgba(b);
  if (a === b || !x || !y) return (t) => t >= 1 ? b : a;
  return (t) => t >= 1 ? b : `rgba(${[0, 1, 2].map((k) => Math.round(mix(x[k], y[k], t))).join(",")},${+mix(x[3], y[3], t).toFixed(3)})`;
}
function rgba(c) {
  var _a;
  const s = String(c).trim();
  let m = /^#([\da-f]+)$/i.exec(s);
  if (m) {
    let h = m[1];
    if (h.length < 5) h = h.replace(/./g, "$&$&");
    if (h.length !== 6 && h.length !== 8) return null;
    return [0, 2, 4, 6].map(
      (k) => k < h.length ? parseInt(h.slice(k, k + 2), 16) / (k === 6 ? 255 : 1) : 1
    );
  }
  m = /^rgba?\(([^)]*)\)$/i.exec(s);
  if (!m) return null;
  const v = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
  return v.length >= 3 && v.every(isFinite) ? [v[0], v[1], v[2], (_a = v[3]) != null ? _a : 1] : null;
}
["prevHighlightParts", "prevHighlightLabels"].forEach((k) => {
  if (Series.HELD.indexOf(k) === -1) Series.HELD.push(k);
});
const FLIP_X = "apexcharts-flip-x";
const FLIP_Y = "apexcharts-flip-y";
const HELD = "apexcharts-flip-held";
const LABEL_EXIT = "apexcharts-highlight-label-exit";
const BAR = "b:";
const LINE = "l:";
const L_PLAIN = { f: 1, o: 0 };
const L_REST = { f: 1, o: 1 };
const L_COVER = { f: 0, o: 1 };
function seriesHasHighlight(s) {
  if (!s) return false;
  if (Array.isArray(s.highlightData)) return true;
  const d = s.data;
  if (!Array.isArray(d)) return false;
  for (let j = 0; j < d.length; j++) {
    const p = d[j];
    if (isPoint(p)) {
      if ("highlight" in p) return true;
    } else if (p != null) return false;
  }
  return false;
}
function partAt(pt, hd, j) {
  return isPoint(pt) && "highlight" in pt ? pt.highlight : hd ? hd[j] : null;
}
class HighlightFilter {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    var _a, _b, _c, _d;
    this.w = w;
    this.ctx = ctx;
    this._targets = /* @__PURE__ */ new Map();
    this._render = null;
    this._seen = /* @__PURE__ */ new Set();
    this._seriesEls = /* @__PURE__ */ new Map();
    this._cu = null;
    this._stk = /* @__PURE__ */ new Map();
    this._stkPrev = [];
    this._br = null;
    this._held = false;
    this._warned = /* @__PURE__ */ new Set();
    this._rows = [];
    this._level = null;
    this._live = /* @__PURE__ */ new Set();
    this._sig = "";
    this._drawnSig = "";
    this._ride = null;
    this._tiles = null;
    this._tmDefs = [];
    this._tipUser = /** @type {any} */
    (_b = (_a = ctx.opts) == null ? void 0 : _a.tooltip) == null ? void 0 : _b.enabled;
    this._tipOn = false;
    this._ind = void 0;
    this._lane = null;
    this._onRender = () => this.afterRender();
    (_c = ctx.events) == null ? void 0 : _c.addEventListener("mounted", this._onRender);
    (_d = ctx.events) == null ? void 0 : _d.addEventListener("updated", this._onRender);
  }
  /** @returns {any} */
  get cfg() {
    return this.w.config.highlightFilter || {};
  }
  isActive() {
    var _a;
    return !!((_a = this.w.highlightData) == null ? void 0 : _a.active);
  }
  /**
   * The part at a datum, or null.
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   */
  valueAt(seriesIndex, dataPointIndex) {
    var _a, _b, _c;
    const v = (_c = (_b = (_a = this.w.highlightData) == null ? void 0 : _a.parts) == null ? void 0 : _b[seriesIndex]) == null ? void 0 : _c[this.w.globals.axisCharts ? dataPointIndex : 0];
    return v == null ? null : v;
  }
  /** @param {string} key @param {string} msg */
  _warn(key, msg) {
    if (this._warned.has(key)) return;
    this._warned.add(key);
    console.warn("ApexCharts highlightFilter: " + msg);
  }
  /**
   * Called by Data at the end of every parse (create, update, fastUpdate).
   * Builds `w.highlightData` from the parsed series; never writes config.
   */
  parse() {
    var _a, _b, _c;
    const w = this.w;
    const cnf = w.config;
    const cfg = this.cfg;
    const series = (
      /** @type {any[]} */
      cnf.series || []
    );
    const values = w.seriesData.series || [];
    if (!w.globals.axisCharts) return this._parseCircle();
    const stacked = !!cnf.chart.stacked;
    const type = cnf.chart.type;
    const bars = type === "bar";
    const nested = treeParse(this, type);
    let present = false;
    for (let i = 0; i < series.length; i++) {
      if (nested ? carries({ data: (_a = series[i]) == null ? void 0 : _a.data }) : seriesHasHighlight(series[i])) {
        present = true;
        break;
      }
    }
    let supported = w.globals.axisCharts && !w.globals.comboCharts && (bars || type === "line" || type === "area" || type === "treemap") && !w.rangeData.seriesRange.length && // A histogram's rows are bins built from the observations, so a part
    // per observation has no bar of its own to sit on.
    cnf.chart.requestedType !== "histogram";
    if (present && !supported) this._unsupported();
    const axes = (
      /** @type {number[][]} */
      (w.globals.seriesYAxisMap || []).map((s, k) => s && s.length ? k : -1).filter((k) => k > -1)
    );
    if (present && supported && stacked && (axes.length > 1 || axes.some((k) => {
      var _a2;
      return (_a2 = cnf.yaxis[k]) == null ? void 0 : _a2.logarithmic;
    }))) {
      supported = false;
      this._warn(
        "stack",
        "parts are not drawn on a stacked chart with more than one y axis or a logarithmic y axis."
      );
    }
    const active = !!(cfg.enabled !== false && present && supported);
    if (!active) {
      this._inactive(supported);
      return;
    }
    const parts = [];
    let mismatch = false;
    const gl = w.globals;
    for (let i = 0; i < values.length; i++) {
      const s = series[i] || {};
      const data = Array.isArray(s.data) ? s.data : [];
      const hd = !nested && Array.isArray(s.highlightData) ? s.highlightData : null;
      const collapsed = gl.collapsedSeriesIndices.indexOf(i) > -1 || gl.ancillaryCollapsedSeriesIndices.indexOf(i) > -1;
      if (hd && !collapsed && hd.length !== data.length) mismatch = true;
      const row = [];
      const n = values[i] ? values[i].length : 0;
      for (let j = 0; j < n; j++) {
        const v = partAt(data[j], hd, j);
        row.push(finite(v) ? collapsed ? 0 : v : null);
      }
      parts.push(row);
    }
    if (active && mismatch) {
      this._warn(
        "length",
        "highlightData and data differ in length; the extra entries are ignored and the missing ones read as null."
      );
    }
    const parallel = series.some((s) => Array.isArray(s == null ? void 0 : s.highlightData));
    if (parallel && ((_b = cnf.chart.dataReducer) == null ? void 0 : _b.enabled)) {
      this._warn(
        "reducer",
        "highlightData cannot follow chart.dataReducer; put the part on each point as { x, y, highlight } instead."
      );
    }
    if (parallel && ((_c = cnf.chart.streaming) == null ? void 0 : _c.enabled)) {
      this._warn(
        "stream",
        "highlightData cannot follow chart.streaming; put the part on each point as { x, y, highlight } instead."
      );
    }
    const extend = active && cfg.axis !== "clamp" && type !== "treemap" && !cnf.plotOptions.bar.isFunnel && !(stacked && cnf.chart.stackType === "100%");
    let keyOf = null;
    if (stacked && bars) {
      const names = w.seriesData.seriesNames;
      const group = parts.map(
        (_, i) => w.labelData.seriesGroups.findIndex(
          (g) => g.indexOf(names[i]) > -1
        )
      );
      keyOf = (i, j) => group[i] + "|" + j;
    } else if (stacked) {
      const sx = w.seriesData.seriesX;
      keyOf = (i, j) => {
        var _a2;
        return String(w.axisFlags.isXNumeric ? (_a2 = sx[i]) == null ? void 0 : _a2[j] : j);
      };
    }
    const ext = extend ? this._runningExt(
      parts,
      keyOf,
      bars,
      bars ? (i, j) => this._restarts(i, j) : void 0
    ) : null;
    this._publish(parts, ext);
  }
  /** Warn once that this chart type draws no parts. */
  _unsupported() {
    const c = this.w.config.chart;
    this._warn(
      "type",
      `parts are not drawn on this chart (type "${c.requestedType || c.type}"). Supported: column, bar, line and area (stacked too), funnel, pie, donut, polarArea, radialBar, gauge and treemap.`
    );
  }
  /** @param {boolean} supported */
  _inactive(supported) {
    if (!supported) this._targets = /* @__PURE__ */ new Map();
    this.w.highlightData = {
      active: false,
      parts: [],
      ext: null,
      capture: () => this.capture()
    };
    this._sig = "";
    this._rows = [];
  }
  /**
   * Pie, donut, polarArea and radialBar: one part per slice (or ring), from
   * the slice's own point (`{ x, y, highlight }` in the object form) or from
   * `highlightFilter.data`, parallel to the slices (the numeric form has
   * nowhere else to carry it). Stored as one row per slice, so a slice reads
   * like a one-datum series.
   */
  _parseCircle() {
    const w = this.w;
    const cnf = w.config;
    const cfg = this.cfg;
    const gl = w.globals;
    const n = (w.seriesData.series || []).length;
    const pts = slicePoints(
      /** @type {any[]} */
      cnf.series
    );
    let point = pts.some((d) => "highlight" in d);
    if (point && pts.length !== n) {
      this._warn(
        "points",
        "per-point highlight values do not line up with the slices; use highlightFilter.data instead."
      );
      point = false;
    }
    let arr = Array.isArray(cfg.data) ? cfg.data : null;
    if (arr && arr.length !== n) {
      this._warn(
        "length",
        `highlightFilter.data has ${arr.length} values for ${n} slices; it is ignored until they match.`
      );
      arr = null;
    }
    if (arr && arr.some((v) => Array.isArray(v))) {
      if (arr.some((v) => Array.isArray(v) && v.length !== 1)) {
        this._warn(
          "rows",
          "highlightFilter.data takes one value per slice (or ring); a row of several values is ignored."
        );
        arr = null;
      } else {
        arr = arr.map((v) => Array.isArray(v) ? v[0] : v);
      }
    }
    const type = cnf.chart.type;
    const supported = CIRCLE.indexOf(type) > -1 || type === "radialBar";
    const present = point || !!arr;
    if (present && !supported) this._unsupported();
    if (!(cfg.enabled !== false && present && supported)) {
      this._inactive(supported);
      return;
    }
    const parts = [];
    for (let i = 0; i < n; i++) {
      const pt = point ? pts[i] : null;
      const v = pt && "highlight" in pt ? pt.highlight : arr ? arr[i] : null;
      parts.push([
        finite(v) ? gl.collapsedSeriesIndices.indexOf(i) > -1 ? 0 : v : null
      ]);
    }
    this._publish(parts, null);
  }
  /**
   * The parts of this parse, and the signature highlightFilterChanged
   * compares once the render is drawn (one update can parse more than once,
   * so the phase is decided then). A legend-hidden series keeps the row it
   * last had: hiding a series is not a change of pick.
   * @param {(number | null)[][]} parts
   * @param {any} ext
   */
  _publish(parts, ext) {
    const gl = this.w.globals;
    this.w.highlightData = {
      active: true,
      parts,
      ext,
      capture: () => this.capture()
    };
    const prevRows = this._rows;
    const rows = [];
    for (let i = 0; i < parts.length; i++) {
      const hidden = gl.collapsedSeriesIndices.indexOf(i) > -1 || gl.ancillaryCollapsedSeriesIndices.indexOf(i) > -1;
      rows.push(
        hidden && i < prevRows.length ? prevRows[i] : parts[i].join(",")
      );
    }
    this._rows = rows;
    this._sig = "#" + rows.join("|");
  }
  /** Series.capturePreviousPaths: what is on screen becomes "previous". A
   * render records where it was going; an update that lands mid-flight has
   * to start from where things are, so each part's shape and mirror and each
   * whole's look are read as they stand now, and so is every line and area
   * label. The tweens still running write into the old records, never into
   * these. A clear that has landed leaves nothing: that whole is plain and
   * its part gone. */
  capture() {
    const gl = (
      /** @type {any} */
      this.w.globals
    );
    const prev = /* @__PURE__ */ new Map();
    this._targets.forEach((t, key) => {
      var _a, _b, _c, _d, _e, _f, _g;
      if (t.c && !t.run) return;
      const n = t.n;
      const on = !!(n == null ? void 0 : n.isConnected);
      prev.set(key, __spreadProps(__spreadValues({}, t), {
        d: on && n.getAttribute("d") || t.d,
        a: ((_a = t.m) == null ? void 0 : _a.isConnected) && t.m.getAttribute("d") || t.a,
        flip: on ? n.classList.contains(FLIP_Y) || n.classList.contains(FLIP_X) : t.flip,
        f: (_b = t.lf) != null ? _b : t.f,
        o: (_c = t.lo) != null ? _c : t.o,
        // A treemap tile's share and colour as drawn (see TreemapPart).
        s: (_d = t.ls) != null ? _d : t.s,
        col: (_e = t.lc) != null ? _e : t.col,
        // A part's alpha and carried stroke as drawn (see _paintBar).
        al: (_f = t.la) != null ? _f : t.al,
        k: (_g = t.lk) != null ? _g : t.k,
        n: null,
        m: null,
        g: null,
        lb: null
      }));
    });
    gl.prevHighlightParts = prev;
    gl.prevHighlightLabels = this._captureLabels();
    this._targets = /* @__PURE__ */ new Map();
  }
  /** @returns {Map<string, {d: string | null, a?: string | null, f: number, o?: number, base?: string, edge?: boolean, s?: number, flip?: boolean, c?: boolean, al?: number, k?: number}> | undefined} */
  _prev() {
    return (
      /** @type {any} */
      this.w.globals.prevHighlightParts
    );
  }
  /** Whether this render should animate a data change (same rule the bar
   * morph uses, so the fade and the shape move on one clock). Only the SVG
   * renderer: the canvas paints its display list once, inside the render, so
   * a tween's first frame would be the one left on screen. */
  _animates() {
    const r = this.ctx.renderer;
    return (!r || !r.kind || r.kind === "svg") && this._animatesUpdate() && !!this.w.globals.shouldAnimate;
  }
  /** Animations are on for updates at all, and this render is an update. */
  _animatesUpdate() {
    const w = this.w;
    const a = w.config.chart.animations;
    return !!(Environment.isBrowser() && a.enabled && a.dynamicAnimation.enabled && w.globals.dataChanged && !prefersReducedMotion());
  }
  /**
   * One tween on the feature's own rAF clock, with the morph's curve (core's
   * easing registry is shared with add-ons). Given a mark (`el`), it runs on a
   * runner of that mark's own instead, so it starts, steps and eases exactly
   * as the mark's own runners do (each `animate()` is an independent runner).
   * Frame 0 is written at once either way.
   * @param {number} delayMs
   * @param {number} duration
   * @param {(t: number) => void} onFrame eased progress 0..1
   * @param {() => void} [onDone]
   * @param {(t: number) => number} [curve] in place of the morph's
   * @param {any} [el] the mark whose runner clock to run on
   */
  _tween(delayMs, duration, onFrame, onDone, curve, el) {
    const w = this.w;
    const ease = curve || morphEasing(w);
    const live = this._live;
    let done = false;
    const job = {
      finish() {
        if (done) return;
        done = true;
        live.delete(job);
        onFrame(1);
        onDone && onDone();
      }
    };
    this._hold(job);
    const start = performance.now() + delayMs;
    const step = (now) => {
      if (done) return;
      if (w.globals.isDestroyed) {
        done = true;
        live.delete(job);
        return;
      }
      const raw = Math.max(0, Math.min(1, (now - start) / duration));
      onFrame(ease(raw));
      if (raw < 1) BrowserAPIs.requestAnimationFrame(step);
      else job.finish();
    };
    onFrame(0);
    if (el) {
      el.animate(duration, delayMs).during((t) => done || onFrame(t)).after(() => job.finish());
    } else BrowserAPIs.requestAnimationFrame(step);
  }
  /**
   * Something an export lands before it serialises (Exports calls
   * `highlightTween.finish()`): a fade, never a shape, which moves on with
   * its mark. The job takes itself off the set when it is done.
   * @param {{finish: () => void}} job
   */
  _hold(job) {
    const live = this._live;
    const gl = (
      /** @type {any} */
      this.w.globals
    );
    live.add(job);
    gl.highlightTween = {
      finish: () => Array.from(live).forEach((t) => t.finish())
    };
  }
  /**
   * Bar.draw, once per datum before it is rendered. Returns what renderSeries
   * needs: the label override and a paint step to run once the whole's path
   * exists. Undefined when there is nothing to do here.
   *
   * @param {any} bar the Bar renderer
   * @param {{i: number, j: number, realIndex: number, translationsIndex: number, paths: any, zeroH: number, zeroW: number}} o
   */
  bar(bar, o) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    const hd = w.highlightData;
    if (!hd) return void 0;
    if (this._render !== bar) this._beginRender(bar, BAR);
    const prevMap = this._prev();
    const active = hd.active;
    if (!active && !(prevMap == null ? void 0 : prevMap.size)) return void 0;
    const { j, realIndex } = o;
    const key = BAR + `${realIndex}::${datumKey(w, realIndex, j)}`;
    this._seen.add(key);
    const prev = prevMap == null ? void 0 : prevMap.get(key);
    const p = active ? (_a = hd.parts[realIndex]) == null ? void 0 : _a[j] : null;
    if (!active && !prev) return void 0;
    const cfg = this.cfg;
    const fadeTo = active ? (_b = cfg.fadeOpacity) != null ? _b : 0.2 : 1;
    const whole = (_c = w.seriesData.series[realIndex]) == null ? void 0 : _c[j];
    const stacked = !!w.config.chart.stacked;
    const geo = active && stacked ? this._stackGeometry(bar, o, p, whole, prev) : p == null ? null : this._barGeometry(bar, o, p, whole);
    const hl = {
      paint: (el, r) => this._paintBar(o, el, r, {
        key,
        prev,
        geo,
        fadeTo,
        active,
        whole,
        bar: stacked ? bar : null
      })
    };
    if (active) {
      const label2 = {};
      if (((_e = (_d = cfg.dataLabels) == null ? void 0 : _d.value) != null ? _e : "part") === "part") {
        Object.assign(
          label2,
          p == null ? { hide: true } : __spreadValues({ val: (_f = geo == null ? void 0 : geo.val) != null ? _f : p }, geo == null ? void 0 : geo.label)
        );
      }
      if (stacked && ((_h = (_g = cfg.dataLabels) == null ? void 0 : _g.total) != null ? _h : "part") === "part") {
        label2.total = geo.total(label2.val != null ? label2.val < 0 : whole < 0);
      }
      hl.label = label2;
    }
    return hl;
  }
  /**
   * The first datum of a render. What the last render drew was handed over at
   * capture; whatever an uncaptured render left (an update without animation,
   * the second update in one frame) is dropped here, so the map always
   * describes the screen.
   * @param {any} renderer the renderer instance drawing this pass
   * @param {string} family the key prefix of what it draws
   */
  _beginRender(renderer, family) {
    var _a;
    this._render = renderer;
    this._targets = /* @__PURE__ */ new Map();
    this._seen = /* @__PURE__ */ new Set();
    this._seriesEls = /* @__PURE__ */ new Map();
    this._cu = new CoreUtils(this.w);
    this._stk = /* @__PURE__ */ new Map();
    this._stkPrev = [];
    this._br = null;
    this._held = false;
    if (family === BAR && !this.w.config.chart.stacked && ((_a = this._prev()) == null ? void 0 : _a.size)) {
      Promise.resolve().then(() => this._orphans());
    }
  }
  /**
   * A datum that left while a pick was on screen: its whole leaves as the
   * renderer's exit ghost, drawn at full strength. The ghost takes the fade
   * the whole was drawn with, and the part rides out in front of it on the
   * ghost's own transform, so frame 0 is the screen as it was.
   */
  _orphans() {
    const w = this.w;
    const prev = this._prev();
    if (!prev || w.globals.isDestroyed || !this._animates()) return;
    prev.forEach((t, key) => {
      var _a;
      if (this._seen.has(key) || key.indexOf(BAR) !== 0) return;
      const datum = key.slice(BAR.length);
      const el = this._seriesEls.get(datum.slice(0, datum.indexOf("::")));
      if (!el) return;
      const ghost = Array.from(
        el.querySelectorAll(".apexcharts-bar-ghost")
      ).find(
        (n) => n.getAttribute("data:ghostKey") === datum
      );
      if (!ghost) return;
      ghost.setAttribute("fill-opacity", String(t.f));
      if (!t.d) return;
      const part = new Graphics(w, this.ctx).drawPath({
        d: t.d,
        stroke: "none",
        strokeWidth: 0,
        // Solid, at the alpha it had on screen (see _paintBar).
        fill: solid(ghost.getAttribute("fill"))[0],
        fillOpacity: (_a = t.al) != null ? _a : 1,
        classes: `${PART} apexcharts-highlight-ghost`
      });
      const node = part.node;
      node.setAttribute("pointer-events", "none");
      node.setAttribute("clip-path", ghost.getAttribute("clip-path") || "");
      ghost.after(node);
      const origin = ghost.style.transformOrigin || "";
      const horiz = /^(left|right)/.test(origin);
      const edge = parseFloat(ghost.getAttribute("data:ghostEdge") || "");
      const [lo] = pathSpan(t.d, horiz ? 0 : 1);
      const st = node.style;
      st.transformBox = "fill-box";
      st.transformOrigin = isFinite(edge) ? horiz ? `${edge - lo}px 50%` : `50% ${edge - lo}px` : origin;
      const step = () => {
        if (!ghost.parentNode || w.globals.isDestroyed) {
          node.remove();
          return;
        }
        st.transform = ghost.style.transform;
        st.opacity = ghost.style.opacity;
        BrowserAPIs.requestAnimationFrame(step);
      };
      step();
    });
  }
  /**
   * Part geometry from the renderer's own builders, so the part matches the
   * whole's slot, width, stroke centering and corner rounding exactly.
   * @param {any} bar @param {any} o @param {number} p @param {number} whole
   */
  _barGeometry(bar, o, p, whole) {
    const w = this.w;
    const { j, realIndex, translationsIndex, paths } = o;
    const h = bar.barHelpers;
    const strokeWidth = h.getStrokeWidth(o.i, j, realIndex);
    if (bar.isFunnel) {
      const share = whole ? Math.min(Math.abs(p / whole), 1) : 0;
      const c = w.layout.gridWidth / 2;
      return {
        pathTo: scalePath(paths.pathTo, (x) => c + (x - c) * share),
        base: scalePath(paths.pathTo, () => c),
        overflow: false
        // clamped to the stage, see above
      };
    }
    const ax = w.config.yaxis[w.globals.seriesYAxisReverseMap[realIndex]];
    const pv = (ax == null ? void 0 : ax.logarithmic) && !w.globals.invalidLogScale && this._cu ? Math.max(0, this._cu.getLogValAtSeriesIndex(p, realIndex)) : p;
    if (bar.isHorizontal) {
      const x1 = o.zeroW;
      const x2 = h.getXForValue(pv, o.zeroW);
      const r2 = this._rect(h, {
        a: paths.barYPosition,
        len: paths.barHeight,
        v1: x1,
        v2: x2,
        strokeWidth,
        realIndex,
        j,
        dir: pv >= 0 ? 1 : -1,
        horizontal: true
      });
      return {
        pathTo: r2.pathTo,
        base: r2.base,
        overflow: overflows(p, whole),
        label: { x: x2, barWidth: Math.abs(x2 - x1) }
      };
    }
    const y1 = o.zeroH;
    const y2 = h.getYForValue(pv, o.zeroH, translationsIndex);
    const r = this._rect(h, {
      a: paths.barXPosition,
      len: paths.barWidth,
      v1: y1,
      v2: y2,
      strokeWidth,
      realIndex,
      j,
      dir: pv >= 0 ? 1 : -1,
      horizontal: false
    });
    return {
      pathTo: r.pathTo,
      base: r.base,
      overflow: overflows(p, whole),
      label: { y: y2, barHeight: Math.abs(y2 - y1) }
    };
  }
  /**
   * A part's rect, from the renderer's builder. That builder centres the
   * whole's stroke on each end, so a bar thinner than its stroke turns inside
   * out: a stroke-wide sliver past its baseline (a value of 0, a series the
   * legend hides or shows). The whole's own stroke paints over it; a part has
   * none, so the sliver would show as solid colour. A part that thin is drawn
   * as the line it collapses to, at its middle, which is where the rect it
   * grows into starts.
   * @param {any} h the bar helpers
   * @param {{a: number, len: number, v1: number, v2: number, strokeWidth: any, realIndex: number, j: number, dir: number, horizontal: boolean}} o
   */
  _rect(h, o) {
    const sw = Array.isArray(o.strokeWidth) ? o.strokeWidth[o.realIndex] : o.strokeWidth;
    const c = (sw || 0) / 2;
    const d = o.v2 - o.v1;
    if (Math.abs(d) < 2 * c) {
      const m = o.v1 + d / 2;
      const s = c * o.dir * (h.barCtx.isReversed ? -1 : 1) * (o.horizontal ? -1 : 1);
      o = __spreadProps(__spreadValues({}, o), { v1: m + s, v2: m - s });
    }
    return h.barRect(o);
  }
  /**
   * A stacked part's geometry. The parts form their own diverging stack in
   * each series group (positives up from the baseline, negatives down), in
   * series order, so a part sits on the parts below it rather than on its
   * whole. The cursor is in pixels and advances through the renderer's own
   * value-to-pixel helpers with the cursor as their zero line, the way the
   * wholes stack. The rect, its corners and its mirror come from the same
   * builders as the wholes', with the corner states resolved over the parts.
   *
   * Also run for a datum without a part: it moves nothing, but a part that
   * left drains to where it would sit.
   * @param {any} bar the BarStacked renderer
   * @param {any} o @param {number | null} p @param {number} whole
   * @param {any} prev what this datum drew a frame ago
   */
  _stackGeometry(bar, o, p, whole, prev) {
    var _a, _b;
    const w = this.w;
    const { j, realIndex, translationsIndex: ti, paths } = o;
    const h = bar.barHelpers;
    const horiz = bar.isHorizontal;
    const zero = horiz ? o.zeroW : o.zeroH;
    if (!this._br) {
      this._br = h.createBorderRadiusArr(
        (((_a = w.highlightData) == null ? void 0 : _a.parts) || []).map((r2) => r2.map((v3) => v3 != null ? v3 : 0))
      );
      if (Utils.isSafari()) {
        this._br = /** @type {string[][]} */
        this._br.map(
          (r2) => r2.map(() => "none")
        );
      }
    }
    const br = (
      /** @type {string[][]} */
      this._br
    );
    const key = h.getSeriesGroupIndex(realIndex) + "|" + j;
    let c = this._stk.get(key);
    if (!c || this._restarts(realIndex, j)) {
      c = { p: zero, n: zero, raw: 0, any: false };
      this._stk.set(key, c);
    }
    const pct = w.config.chart.stackType === "100%";
    const total = w.seriesData.stackedSeriesTotals[j];
    const val = p == null ? null : pct ? total ? 100 * p / total : 0 : p;
    const v = val != null ? val : 0;
    const neg = val != null ? val < 0 : (prev == null ? void 0 : prev.s) != null ? prev.s < 0 : whole < 0;
    const at = (x, from) => horiz ? h.getXForValue(x, from) : h.getYForValue(x, from, ti);
    let v1 = neg ? c.n : c.p;
    let v2 = at(v, v1);
    if (neg) c.n = v2;
    else c.p = v2;
    if (p != null) {
      c.raw += p;
      c.any = true;
    }
    const raw = c.raw;
    const any = c.any;
    const edge = { p: c.p, n: c.n };
    let overflow = false;
    if (pct) {
      const a = at(100, zero);
      const b = at(-100, zero);
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      const cap = (x) => Math.min(hi, Math.max(lo, x));
      overflow = cap(v2) !== v2;
      v1 = cap(v1);
      v2 = cap(v2);
      edge.p = cap(edge.p);
      edge.n = cap(edge.n);
    }
    const save = h.arrBorderRadius;
    h.arrBorderRadius = br;
    let r;
    try {
      r = this._rect(h, {
        a: horiz ? paths.barYPosition : paths.barXPosition,
        len: horiz ? w.globals.barHeight : w.globals.barWidth,
        v1,
        v2,
        // As the renderer strokes its stacked segments: columns with the
        // configured width, bars with the datum's.
        strokeWidth: horiz ? h.getStrokeWidth(o.i, j, realIndex) : bar.strokeWidth,
        realIndex,
        j,
        dir: neg ? -1 : 1,
        horizontal: horiz
      });
    } finally {
      h.arrBorderRadius = save;
    }
    return {
      pathTo: p == null ? null : r.pathTo,
      square: r.squarePathTo,
      base: r.base,
      flip: p != null && bar.cornerFlip((_b = br[realIndex]) == null ? void 0 : _b[j], v),
      s: neg ? -1 : 1,
      overflow,
      val,
      label: horiz ? { x: v2, barWidth: Math.abs(v2 - v1) } : { y: v2, barHeight: Math.abs(v2 - v1) },
      // The stacked total, on the side of the stack core puts it (by the
      // sign the drawing series' label reads), or false when the stack has
      // no part at all.
      total: (n) => any ? { val: raw, edge: n ? edge.n : edge.p } : false
    };
  }
  /**
   * Whether a stacked column starts a fresh stack at this datum: on a numeric
   * or datetime x axis the renderer stacks a series on the one before it only
   * where both have the same x at that index (BarStacked
   * drawStackedColumnPaths), and starts again from the baseline elsewhere.
   * Horizontal stacks never restart.
   * @param {number} realIndex @param {number} j
   */
  _restarts(realIndex, j) {
    var _a, _b;
    const w = this.w;
    const sx = w.seriesData.seriesX;
    return !w.config.plotOptions.bar.horizontal && !!w.axisFlags.isXNumeric && realIndex > 0 && ((_a = sx[realIndex - 1]) == null ? void 0 : _a[j]) !== ((_b = sx[realIndex]) == null ? void 0 : _b[j]);
  }
  /**
   * Line.draw, once per series right after its whole has been rendered and
   * before its markers and labels are appended (so they stay on top). The
   * part is built by the renderer's own path builder from the part row, so it
   * has the whole's start point, curve, gaps, stacking and area close. The
   * whole is then dashed (a line) or faded with its outline kept (an area);
   * its markers stay as they are, since hover, keyboard focus and the tooltip
   * are all keyed to them.
   * @param {any} ln the Line renderer, still holding this series' state
   * @param {string} type
   * @param {any[]} series the rows the whole was built from
   * @param {number} i @param {number} realIndex @param {number} ti
   * @param {any} paths what the whole was built into
   */
  line(ln, type, series, i, realIndex, ti, paths) {
    var _a, _b;
    const w = this.w;
    const hd = w.highlightData;
    if (!hd || type !== "line" && type !== "area") return;
    if (this._render !== ln) this._beginRender(ln, LINE);
    const prevMap = this._prev();
    const active = hd.active;
    if (!active && !(prevMap == null ? void 0 : prevMap.size)) return;
    const key = LINE + realIndex;
    const prev = prevMap == null ? void 0 : prevMap.get(key);
    if (!active && !prev) return;
    const gl = w.globals;
    const animate = this._animates();
    const area = type === "area";
    const raw = active ? hd.parts[realIndex] || [] : [];
    const has = raw.some((v) => v != null);
    const flat = active && ln._shapeOnly;
    const paint2 = (m2, k) => m2 && (m2._cmd ? m2._cmd[k] : m2.node.getAttribute(k));
    const marks = (
      /** @type {any[]} */
      ln.marks || []
    );
    const fillMark = area ? marks.find((m2) => paint2(m2, "fill") !== "none") : null;
    const strokeMark = marks.find((m2) => m2 !== fillMark);
    const [ink, alpha] = fillMark && w.config.chart.stacked ? solid(paint2(fillMark, "fill")) : [fillMark && paint2(fillMark, "fill"), 1];
    const looks = marks.concat(
      area ? marks.filter((m2) => m2 !== fillMark && !m2._cmd).map((m2) => m2.node.nextElementSibling).filter(
        (x) => /#forecastMask/.test((x == null ? void 0 : x.getAttribute("clip-path")) || "")
      ).map((node) => ({ node })) : []
    );
    const pp = active && !flat && (has || w.config.chart.stacked) ? this._lineBuild(
      ln,
      type,
      series,
      i,
      realIndex,
      ti,
      this._partRow(raw, i, realIndex)
    ) : null;
    let to = flat ? { d: paths.linePaths.join(" "), a: paths.areaPaths.join(" ") } : has ? {
      d: pp.linePaths.join(" "),
      a: pp.areaPaths.join(" "),
      num: pp.numericXY
    } : null;
    const exit = !to && !!(prev == null ? void 0 : prev.d) && animate;
    const base = active && animate && (exit || to && !(prev == null ? void 0 : prev.d) && (prev || this.cfg.enter === "baseline")) ? this._lineBase(ln, type, series, i, realIndex, ti, has ? raw : null) : null;
    if (pp && w.config.chart.stacked) {
      this._swap(ln, () => ln._recordStackTops(realIndex, pp.yArrj));
      this._stkPrev.push(pp.yArrj);
    }
    if (exit) {
      to = active ? base : { d: paths.linePaths.join(" "), a: paths.areaPaths.join(" ") };
    }
    const lands = exit && !active;
    let from = to;
    const interp = {};
    let scroll = null;
    let cover = false;
    if (to && animate) {
      if (prev == null ? void 0 : prev.d) {
        from = { d: prev.d, a: prev.a || to.a };
        if (!exit) {
          scroll = detectStreamScroll(w, realIndex, paths.xArrj, paths.yArrj);
          if (scroll) {
            from = {
              d: projectPathToPrevFrame(to.d, scroll),
              a: projectPathToPrevFrame(to.a, scroll)
            };
          } else {
            const b = pp || paths;
            const r = reconcileSeriesPaths(w, {
              type,
              realIndex,
              pathFromLine: prev.d,
              pathFromArea: prev.a || "",
              linePaths: b.linePaths,
              areaPaths: b.areaPaths
            });
            if (r == null ? void 0 : r.line) [from.d, interp.d] = [r.line.from, r.line.toInterp];
            if (r == null ? void 0 : r.area) [from.a, interp.a] = [r.area.from, r.area.toInterp];
          }
        }
      } else if (base) {
        from = base;
      } else {
        cover = true;
        from = {
          d: (strokeMark == null ? void 0 : strokeMark.node.getAttribute("pathFrom")) || to.d,
          a: (fillMark == null ? void 0 : fillMark.node.getAttribute("pathFrom")) || to.a
        };
      }
    }
    let m = null;
    let n = null;
    let nf = null;
    if (to) {
      const g = this._partGroup(ln.elSeries, "apexcharts-line-highlight");
      const num = to.num;
      const base2 = {
        i,
        // Its own j: the mount reveal names its mask by series and j, and
        // the whole already has the series' masks.
        j: "h",
        realIndex,
        delay: i,
        speed: w.config.chart.animations.dynamicAnimation.speed,
        cls: `apexcharts-${type} apexcharts-line-highlight-part`,
        chartType: type,
        clip: `url(#gridRectMask${gl.cuid})`,
        scroll: !!scroll
      };
      if (fillMark) {
        m = this._emitPart(g, __spreadProps(__spreadValues({}, base2), {
          from: from.a,
          to: to.a,
          interp: interp.a,
          paint: ink,
          num: num && { xs: num.xs, ys: num.ys, closeY: num.areaCloseY }
        }));
      }
      if (strokeMark) {
        const stroke = __spreadProps(__spreadValues({}, base2), {
          from: from.d,
          to: to.d,
          interp: interp.d,
          paint: "none",
          stroke: paint2(strokeMark, "stroke"),
          width: ln.strokeWidth,
          num: num && { xs: num.xs, ys: num.ys }
        });
        n = this._emitPart(g, stroke);
        n == null ? void 0 : n.attr("fill-rule", "evenodd");
        const clip = !strokeMark._cmd && strokeMark.node.getAttribute("clip-path");
        if (n && clip && clip.indexOf("nonForecast") > -1) {
          const fc = w.config.forecastDataPoints;
          n.attr("clip-path", clip);
          nf = this._emitPart(g, __spreadProps(__spreadValues({}, stroke), {
            // (its own mount reveal mask)
            j: "hf",
            clip: `url(#forecastMask${gl.cuid})`
          }));
          nf == null ? void 0 : nf.attr({
            "fill-rule": "evenodd",
            "stroke-dasharray": fc.dashArray,
            "stroke-width": fc.strokeWidth || void 0
          });
        }
      }
      const r = this.ctx.renderer;
      if ((!r || !r.kind || r.kind === "svg") && w.config.chart.animations.enabled && !gl.resized && !gl.dataChanged) {
        [n, area && strokeMark].forEach((el) => {
          const dash = el && el.node.getAttribute("stroke-dasharray");
          if (el && (!dash || dash === "0")) {
            el.node.setAttribute("stroke-dasharray", "none");
          }
        });
      }
    }
    const rec = {
      d: null,
      a: null,
      f: 1,
      o: active ? 1 : 0,
      n: exit ? n == null ? void 0 : n.node : null,
      m: exit ? m == null ? void 0 : m.node : null,
      c: !active
    };
    this._targets.set(key, rec);
    const a0 = cover ? alpha : (prev == null ? void 0 : prev.d) ? (_a = prev.al) != null ? _a : 1 : 1;
    const a1 = lands ? alpha : 1;
    rec.al = a1;
    this._fadeLine(
      type,
      looks,
      cover ? L_COVER : prev ? { f: prev.f, o: (_b = prev.o) != null ? _b : 0 } : L_PLAIN,
      lands ? L_COVER : active ? L_REST : L_PLAIN,
      {
        width: ln.strokeWidth,
        also: m && (a0 < 1 || a1 < 1) ? (t) => {
          const a = mix(a0, a1, t);
          rec.la = a;
          m.node.setAttribute("fill-opacity", String(a));
        } : void 0,
        force: !!m && a0 !== a1,
        land: lands ? L_PLAIN : void 0,
        // A retired part leaves on the frame its whole lands.
        done: exit ? () => {
          n == null ? void 0 : n.remove();
          nf == null ? void 0 : nf.remove();
          m == null ? void 0 : m.remove();
        } : void 0,
        rec,
        // A scroll morph runs at constant speed, and so does its fade.
        ease: scroll ? resolveEasing("linear") : void 0
      }
    );
    if (to && !exit)
      Object.assign(rec, { d: to.d, a: to.a, n: n == null ? void 0 : n.node, m: m == null ? void 0 : m.node });
    this._lineLabels(ln, type, i, realIndex, raw, pp, paths);
  }
  /**
   * A part row in the units the renderer draws: logs on a log axis, and the
   * renderer's nudge for a flat row under a gradient, whose box would
   * otherwise have no height to paint (#358).
   * @param {any[]} raw @param {number} i @param {number} realIndex
   */
  _partRow(raw, i, realIndex) {
    const w = this.w;
    const cu = (
      /** @type {CoreUtils} */
      this._cu
    );
    const ax = w.config.yaxis[w.globals.seriesYAxisReverseMap[realIndex]];
    const row = (ax == null ? void 0 : ax.logarithmic) && !w.globals.invalidLogScale ? raw.map((v) => cu.getLogValAtSeriesIndex(v, realIndex)) : raw.slice();
    const ft = (
      /** @type {any} */
      w.config.fill.type
    );
    const last = row.length - 1;
    if ((ft === "gradient" || ft[i] === "gradient") && row[last] != null && row.every((v) => v === row[0])) {
      row[last] += 1e-6;
    }
    return row;
  }
  /**
   * Build a series' paths from another row, as a dry run of the renderer's
   * own builder: markers and labels off, and every piece of state the build
   * touches handed back afterwards (the tooltip's point cache included). In a
   * stack the build stands on the part stack instead of the whole one.
   * @param {any} ln @param {string} type @param {any[]} series
   * @param {number} i @param {number} realIndex @param {number} ti
   * @param {any[]} row
   */
  _lineBuild(ln, type, series, i, realIndex, ti, row) {
    const w = this.w;
    const pa = w.globals.pointsArray;
    const had = pa[realIndex];
    const len = had ? had.length : 0;
    const keep = [ln._shapeOnly, ln.appendPathFrom];
    const S = series.slice();
    S[i] = row;
    ln._shapeOnly = true;
    try {
      const pp = this._swap(
        ln,
        () => ln._buildSeriesPaths(type, S, i, realIndex, ti)
      );
      pp.S = S;
      return pp;
    } finally {
      [ln._shapeOnly, ln.appendPathFrom] = keep;
      if (had) had.length = len;
      else delete pa[realIndex];
    }
  }
  /**
   * Run `fn` with the renderer's stack (the tops by x, and the rows so far)
   * swapped for the part stack, in a stacked chart; the renderer's own is
   * handed back after. Returns what `fn` returns.
   * @template T
   * @param {any} ln @param {() => T} fn
   * @returns {T}
   */
  _swap(ln, fn) {
    if (!this.w.config.chart.stacked) return fn();
    const keep = [ln.prevSeriesYByX, ln.prevSeriesY];
    ln.prevSeriesYByX = this._stk;
    ln.prevSeriesY = this._stkPrev;
    try {
      return fn();
    } finally {
      [ln.prevSeriesYByX, ln.prevSeriesY] = keep;
    }
  }
  /**
   * The part's zero-height shape: on the baseline, or on the part stack
   * below in a stack. With `pattern` it keeps that row's gaps, so the part
   * rises from it point for point.
   * @param {any} ln @param {string} type @param {any[]} series
   * @param {number} i @param {number} realIndex @param {number} ti
   * @param {any[] | null} [pattern]
   */
  _lineBase(ln, type, series, i, realIndex, ti, pattern) {
    const row = (pattern || series[i]).map(
      (v) => v == null ? null : 0
    );
    const b = this._lineBuild(ln, type, series, i, realIndex, ti, row);
    return {
      d: b.linePaths.join(" "),
      a: b.areaPaths.join(" "),
      num: b.numericXY
    };
  }
  /**
   * Take a line or area whole from one look to another on the morph clock
   * (see _fade, whose control flow this shares). A look is `{f, o}`: `f` is
   * how much of the whole shows (0 while a part on its exact shape covers
   * it, since the part has the whole's own paint), `o` how far it is into
   * its highlighted look: a line dashed, an area faded with its outline.
   * The plain look is the mark's own attributes, as drawn.
   * @param {string} type
   * @param {any[]} marks the whole's rendered marks
   * @param {{f: number, o: number}} a @param {{f: number, o: number}} b
   * `also` runs on every frame with the progress (a part's alpha), and
   * `force` tweens even when the look stays.
   * @param {{width: number, land?: {f: number, o: number}, done?: () => void, rec: any, ease?: (t: number) => number, also?: (t: number) => void, force?: boolean}} opt
   */
  _fadeLine(type, marks, a, b, opt) {
    var _a, _b, _c, _d, _e, _f, _g;
    const cfg = this.cfg;
    const fo = (_a = cfg.fadeOpacity) != null ? _a : 0.2;
    const ow = (_c = (_b = cfg.outline) == null ? void 0 : _b.width) != null ? _c : 1;
    const oo = (_e = (_d = cfg.outline) == null ? void 0 : _d.opacity) != null ? _e : 1;
    const dash = (_g = (_f = cfg.line) == null ? void 0 : _f.dashArray) != null ? _g : 4;
    const rec = opt.rec;
    const names = [
      "fill-opacity",
      "stroke-opacity",
      "stroke-width",
      "stroke-dasharray"
    ];
    const items = marks.map((m) => {
      var _a2;
      const node = m.node;
      const own = names.map((k2) => node.getAttribute(k2));
      const k = parseFloat((_a2 = own[0]) != null ? _a2 : "1");
      return {
        node,
        own,
        k: isFinite(k) ? k : 1,
        fill: type === "area" && (m._cmd ? m._cmd.fill : node.getAttribute("fill")) !== "none"
      };
    });
    const set = (f, o) => {
      rec.lf = f;
      rec.lo = o;
      items.forEach(({ node, own, k, fill }) => {
        if (f >= 1 && o <= 0) {
          names.forEach(
            (x, q) => own[q] == null ? node.removeAttribute(x) : node.setAttribute(x, own[q])
          );
        } else if (fill) {
          node.setAttribute("fill-opacity", String(k * f * mix(1, fo, o)));
        } else if (type === "area") {
          node.setAttribute("stroke-opacity", String(f * mix(1, oo, o)));
          node.setAttribute("stroke-width", String(mix(opt.width, ow, o)));
        } else {
          node.setAttribute("stroke-opacity", String(f));
          node.setAttribute(
            "stroke-dasharray",
            o < 1 ? `${dash} ${dash * o}` : String(dash)
          );
        }
      });
    };
    const frame = (t) => {
      set(mix(a.f, b.f, t), mix(a.o, b.o, t));
      opt.also && opt.also(t);
    };
    const land = () => {
      rec.run = false;
      if (opt.land) set(opt.land.f, opt.land.o);
      opt.done && opt.done();
    };
    if (this._animates() && (a.f !== b.f || a.o !== b.o || opt.done || opt.force)) {
      rec.run = true;
      this._tween(
        0,
        this.w.config.chart.animations.dynamicAnimation.speed,
        frame,
        land,
        opt.ease
      );
    } else {
      frame(1);
      land();
    }
  }
  /**
   * Data labels state the part, at the part's points, drawn by the
   * renderer's own label pass with the part row in place of the values. The
   * whole's labels go (a faded backdrop is not a reading), and so does a
   * label where the part is null. The labels then ride from where the labels
   * on screen were drawn (see _rideLabels); the text changes at once.
   * @param {any} ln @param {string} type @param {number} i
   * @param {number} realIndex @param {any[]} raw @param {any} pp
   * @param {any} paths
   */
  _lineLabels(ln, type, i, realIndex, raw, pp, paths) {
    var _a, _b, _c, _d;
    const w = this.w;
    const gl = (
      /** @type {any} */
      w.globals
    );
    const wrap = ln.elDataLabelsWrap;
    if (!w.config.dataLabels.enabled || !(wrap == null ? void 0 : wrap.node) || ln._shapeOnly) return;
    const part = ((_a = w.highlightData) == null ? void 0 : _a.active) && ((_c = (_b = this.cfg.dataLabels) == null ? void 0 : _b.value) != null ? _c : "part") === "part";
    if (part) {
      const node = wrap.node;
      while (node.firstChild) node.removeChild(node.firstChild);
      const boxes = gl.dataLabelsRects;
      boxes[realIndex] = [];
      gl.lastDrawnDataLabelsIndexes[realIndex] = [];
      if (pp && raw.some((v) => v != null)) {
        const dl = new DataLabels(w, this.ctx);
        for (let j = 0; j < pp.xArrj.length - 1; j++) {
          const pos = ln.lineHelpers.calculatePoints({
            series: pp.S,
            x: pp.xArrj[j + 1],
            y: pp.yArrj[j + 1],
            realIndex,
            i,
            j,
            prevY: pp.yArrj[0]
          });
          pos.x.forEach((x, q) => {
            if (raw[j ? j + 1 : q] == null) {
              boxes[realIndex].push({ x: NaN, y: NaN, width: 0, height: 0 });
              return;
            }
            const el = dl.drawDataLabel({
              type,
              pos: {
                x: j ? [x] : q ? [NaN, x] : [x, NaN],
                y: pos.y
              },
              i: realIndex,
              j: j ? j + 1 : 1,
              row: raw
            });
            if (el) wrap.add(el);
          });
        }
      }
    }
    const xs = part ? pp == null ? void 0 : pp.xArrj : paths.xArrj;
    const ys = part ? pp == null ? void 0 : pp.yArrj : paths.yArrj;
    if (!this._animates() || !xs || seriesJoin(w, realIndex)) return;
    const rise = gl.riseLabels;
    if (rise == null ? void 0 : rise.has(realIndex)) {
      const r = new Map(rise);
      r.delete(realIndex);
      gl.riseLabels = r.size ? r : null;
    }
    const frame = gl.prevStreamFrame;
    const src = (_d = gl.prevHighlightLabels) == null ? void 0 : _d.get(realIndex);
    Promise.resolve().then(
      () => {
        var _a2, _b2;
        return this._rideLabels(wrap.node, xs, ys, src, [
          (_a2 = frame == null ? void 0 : frame.xPixels) == null ? void 0 : _a2[realIndex],
          (_b2 = frame == null ? void 0 : frame.yPixels) == null ? void 0 : _b2[realIndex]
        ]);
      }
    );
  }
  /**
   * The line and area labels on screen, by series and by point: where each is
   * drawn (the overlap pass and a ride in flight move a label off its point),
   * how strongly, and its nodes. Read at capture, for the next render's
   * labels to start from.
   * @returns {Map<number, Map<number, {x: number, y: number, o: number, els: any[]}>> | null}
   */
  _captureLabels() {
    const w = this.w;
    const type = w.config.chart.type;
    const root = w.dom.baseEl;
    const circle = CIRCLE.indexOf(type) > -1;
    if (!w.config.dataLabels.enabled || type !== "line" && type !== "area" && !circle || !root || !Environment.isBrowser()) {
      return null;
    }
    const out = /* @__PURE__ */ new Map();
    if (circle) {
      const m = /* @__PURE__ */ new Map();
      root.querySelectorAll(".apexcharts-pie-label").forEach((t) => {
        const [x, y] = drawnAt(t);
        m.set(Number(t.parentNode.getAttribute("data:slice")), { x, y });
      });
      out.set(-1, m);
      return out;
    }
    root.querySelectorAll(".apexcharts-datalabels[data\\:realIndex]").forEach((wrap) => {
      const ri = Number(wrap.getAttribute("data:realIndex"));
      const xs = w.globals.seriesXvalues[ri] || [];
      const m = /* @__PURE__ */ new Map();
      wrap.querySelectorAll(`text.apexcharts-datalabel, text.${LABEL_EXIT}`).forEach((t) => {
        var _a;
        const k = nearest(xs, parseFloat(t.getAttribute("cx")));
        if (k < 0) return;
        const [x, y] = drawnAt(t);
        m.set(k, {
          x,
          y,
          o: parseFloat((_a = t.getAttribute("opacity")) != null ? _a : "1"),
          els: withPill(t)
        });
      });
      out.set(ri, m);
    });
    return out;
  }
  /**
   * Ride each label (and its background) from where the label of its point
   * was drawn on screen (`src`, by point) to where it is drawn now, on the
   * morph clock. A label with nothing on screen at its point fades in there;
   * one on screen with no label to become (a part that is null now) fades
   * out where it stands. A series with no labels on screen (the legend
   * showing it again) brings each in from its point's old place (`from`, by
   * point), as the renderer brings in a shown series' labels.
   * @param {any} root the series' label wrap
   * @param {any[]} xs @param {any[]} ys the points the labels were drawn at
   * @param {Map<number, any> | undefined} src
   * @param {any[]} from the old points' x and y pixels
   */
  _rideLabels(root, xs, ys, src, from) {
    const w = this.w;
    if (w.globals.isDestroyed || !root.isConnected) return;
    const [fx, fy] = from;
    const items = [];
    const used = /* @__PURE__ */ new Set();
    const ok = (v) => typeof v === "number" && isFinite(v);
    root.querySelectorAll("text.apexcharts-datalabel").forEach((t) => {
      const k = nearest(xs, parseFloat(t.getAttribute("cx")));
      if (k < 0) return;
      const [x, y] = drawnAt(t);
      const s = src == null ? void 0 : src.get(k);
      let dx = 0;
      let dy = 0;
      let o = 0;
      if (s) {
        used.add(k);
        dx = s.x - x;
        dy = s.y - y;
        o = s.o;
      } else if (!(src == null ? void 0 : src.size) && [fx == null ? void 0 : fx[k], fy == null ? void 0 : fy[k], xs[k], ys[k]].every(ok)) {
        dx = fx[k] - xs[k];
        dy = fy[k] - ys[k];
      }
      if (o < 1 || Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        items.push({ els: withPill(t), dx, dy, o, to: 1 });
      }
    });
    src == null ? void 0 : src.forEach((s, k) => {
      if (used.has(k)) return;
      const els = s.els.map((e) => {
        const c = e.cloneNode(true);
        c.setAttribute("class", LABEL_EXIT);
        c.setAttribute("pointer-events", "none");
        c.removeAttribute("transform");
        root.appendChild(c);
        return c;
      });
      const [x, y] = drawnAt(els[els.length - 1]);
      items.push({ els, dx: s.x - x, dy: s.y - y, o: s.o, to: 0, out: true });
    });
    if (!items.length) return;
    items.forEach((it) => {
      it.bases = it.els.map((e) => e.getAttribute("transform") || "");
      it.ops = it.els.map(
        (e) => {
          var _a;
          return parseFloat((_a = e.getAttribute("opacity")) != null ? _a : "1") / (it.out && it.o > 0 ? it.o : 1);
        }
      );
    });
    const place = (e) => items.forEach(
      ({ els, dx, dy, o, to, out, bases, ops }) => els.forEach((el, q) => {
        const b = (
          /** @type {string[]} */
          bases[q]
        );
        const k = out ? 1 : 1 - e;
        if (k) {
          el.setAttribute(
            "transform",
            `translate(${dx * k} ${dy * k}) ${b}`.trim()
          );
        } else if (b) el.setAttribute("transform", b);
        else el.removeAttribute("transform");
        const op = mix(o, to, e);
        const own = (
          /** @type {number[]} */
          ops[q]
        );
        if (op >= 1 && own >= 1) el.removeAttribute("opacity");
        else el.setAttribute("opacity", String(own * op));
      })
    );
    this._tween(
      0,
      w.config.chart.animations.dynamicAnimation.speed,
      place,
      () => items.forEach((it) => it.out && it.els.forEach((el) => el.remove()))
    );
  }
  /**
   * Fade the whole and draw (or retire) the part. Runs inside renderSeries
   * right after the whole's path is placed, so the part group lands above it
   * and below the labels.
   * @param {any} o
   * @param {any} el the whole's rendered path
   * @param {{delay: number, delayMs: number, speed: number, fill: string, elSeries: any, elBarShadows?: any, labels?: any, pathFrom: string, pathTo: string}} r
   * @param {{key: string, prev: any, geo: any, fadeTo: number, active: boolean, whole: any, bar: any}} s
   */
  _paintBar(o, el, r, s) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const w = this.w;
    const cfg = this.cfg;
    const animate = this._animates();
    const { key, prev, geo, fadeTo, active, bar } = s;
    const elSeries = r.elSeries;
    this._seriesEls.set(String(o.realIndex), elSeries.node);
    let to = (geo == null ? void 0 : geo.pathTo) || null;
    const exit = !to && !!(prev == null ? void 0 : prev.d) && animate;
    if (exit) to = this._exitTo(prev, active, r.pathTo, geo == null ? void 0 : geo.base);
    const start = to && !exit ? this._from(prev, geo == null ? void 0 : geo.base, r.pathFrom, !!bar) : null;
    let from = start ? start.d : (prev == null ? void 0 : prev.d) || null;
    const lands = exit && !active;
    let cls = "apexcharts-bar-highlight-part";
    let flip = false;
    let interp = null;
    if (bar && to) {
      if (from && from !== to) {
        const save = bar._pathToInterp;
        bar._pathToInterp = null;
        const m = bar.cornerMorph(from, to, exit ? void 0 : geo.square);
        if (m !== to) {
          from = m;
          interp = bar._pathToInterp;
        }
        bar._pathToInterp = save;
      }
      const flipCls = bar.isHorizontal ? FLIP_X : FLIP_Y;
      const wholeFlip = el.node.classList.contains(flipCls);
      flip = exit ? active ? !!prev.flip : wholeFlip : geo.flip;
      const was = (prev == null ? void 0 : prev.d) ? !!prev.flip : !!(start == null ? void 0 : start.cover) && wholeFlip;
      if (flip || animate && was) cls += " " + flipCls;
      if (!flip && animate && was) {
        cls += " " + HELD;
        this._settleHeld(bar);
      }
    }
    const color = typeof r.fill === "string" && r.fill !== "none" && r.fill.indexOf("url") < 0 ? r.fill : w.globals.colors[w.config.plotOptions.bar.distributed ? o.j : o.realIndex];
    const [paint2, alpha] = solid(r.fill && r.fill !== "none" ? r.fill : color);
    const shadow = o.j > 0 && r.elBarShadows ? r.elBarShadows.node.lastElementChild : null;
    const sf0 = prev ? prev.f : 1;
    const g = this._partGroup(elSeries, "apexcharts-bar-highlight");
    const part = to ? this._emitPart(g, {
      i: o.i,
      j: o.j,
      realIndex: o.realIndex,
      from: from || to,
      to,
      interp,
      paint: paint2,
      delay: r.delay,
      speed: r.speed,
      cls,
      chartType: "bar",
      clip: `url(#gridRectBarMask${w.globals.cuid})`
    }) : null;
    const own = ownOpacity(el.node);
    const a0 = (start == null ? void 0 : start.cover) && animate ? alpha : (prev == null ? void 0 : prev.d) ? (_a = prev.al) != null ? _a : 1 : 1;
    const a1 = lands ? alpha : 1;
    const ow = s.whole || (prev == null ? void 0 : prev.o) ? (_c = (_b = cfg.outline) == null ? void 0 : _b.width) != null ? _c : 1 : 0;
    const wn = el.node;
    const sc = wn.getAttribute("stroke");
    const k0 = (start == null ? void 0 : start.cover) && animate ? 1 : (prev == null ? void 0 : prev.d) ? (_d = prev.k) != null ? _d : 0 : 0;
    const k1 = lands ? 1 : 0;
    const carry = !!part && ow > 0 && (k0 > 0 || k1 > 0) && parseFloat(wn.getAttribute("stroke-width")) > 0 && !!sc && sc !== "none" && sc !== "transparent";
    const so = ownOpacity(wn, "stroke-opacity");
    const SK = ["stroke", "stroke-width", "stroke-opacity", "stroke-dasharray"];
    const bare = {};
    if (carry) {
      SK.forEach((n) => {
        var _a2;
        bare[n] = part.node.getAttribute(n);
        part.node.setAttribute(n, (_a2 = wn.getAttribute(n)) != null ? _a2 : "");
      });
      if (!wn.hasAttribute("stroke-dasharray")) {
        part.node.removeAttribute("stroke-dasharray");
      }
    }
    const rec = {
      d: null,
      f: fadeTo,
      base: (_e = geo == null ? void 0 : geo.base) != null ? _e : prev == null ? void 0 : prev.base,
      edge: false,
      s: (_f = geo == null ? void 0 : geo.s) != null ? _f : prev == null ? void 0 : prev.s,
      n: exit ? part == null ? void 0 : part.node : null,
      c: !active,
      al: a1,
      k: carry ? k1 : 0
    };
    this._targets.set(key, rec);
    const strength = (t) => {
      const a = mix(a0, a1, t);
      rec.la = a;
      if (part && (own < 1 || a0 < 1 || a1 < 1)) {
        part.node.setAttribute("fill-opacity", String(own * a));
      }
      if (!carry) return;
      const k = mix(k0, k1, t);
      rec.lk = k;
      if (k > 0 || t < 1) {
        part.node.setAttribute("stroke-opacity", String(so * k));
        if (!(rec.lo > 0) && k > 0) wn.setAttribute("stroke-opacity", "0");
      } else {
        part.attr(bare);
      }
    };
    const end = lands ? COVERED : look(fadeTo);
    this._fade(
      el.node,
      (start == null ? void 0 : start.cover) && animate ? COVERED : prev ? { f: prev.f, o: (_g = prev.o) != null ? _g : look(prev.f).o } : PLAIN,
      s.whole ? end : { f: end.f, o: 0 },
      r,
      {
        outline: ow > 0 ? { color, width: ow, opacity: (_i = (_h = cfg.outline) == null ? void 0 : _h.opacity) != null ? _i : 1 } : null,
        also: (t) => {
          shadow == null ? void 0 : shadow.setAttribute("fill-opacity", String(mix(sf0, fadeTo, t)));
          strength(t);
        },
        force: !!part && (a0 !== a1 || carry),
        land: lands ? PLAIN : void 0,
        // A retired part leaves on the frame its whole lands.
        done: exit ? () => part == null ? void 0 : part.remove() : void 0,
        rec
      }
    );
    if (!part || !to || exit) return;
    if (geo == null ? void 0 : geo.overflow) {
      part.node.classList.add("apexcharts-highlight-overflow");
    }
    if ((geo == null ? void 0 : geo.overflow) && !bar) {
      const edge = new Graphics(w, this.ctx).drawPath({
        d: r.pathTo,
        stroke: "#fff",
        strokeWidth: 1,
        fill: "none",
        strokeDashArray: 3,
        classes: `${PART} apexcharts-highlight-edge`
      });
      edge.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      edge.node.setAttribute("pointer-events", "none");
      g.add(edge);
      const show = (t) => edge.node.setAttribute("stroke-opacity", String(0.75 * t));
      if (animate && !(prev == null ? void 0 : prev.edge)) this._tween(r.delayMs, r.speed, show);
      else show(1);
    }
    const rk = (_j = this.ctx.renderer) == null ? void 0 : _j.kind;
    if ((!rk || rk === "svg") && !w.config.plotOptions.bar.isFunnel) {
      this._hitProxy(g, to, r.pathTo, el.node, !!w.globals.isBarHorizontal);
    }
    if (r.labels) this._contrastLabels(r.labels, to);
    Object.assign(rec, {
      d: to,
      base: geo == null ? void 0 : geo.base,
      edge: !!(geo == null ? void 0 : geo.overflow) && !bar,
      s: geo == null ? void 0 : geo.s,
      flip,
      n: part.node
    });
  }
  /**
   * The part's pixels outside its own whole (an average past it, a part on
   * the other side of zero, a part on a null whole) have no whole under them
   * to hover. Each such piece gets an invisible stand-in (see bindHit), so the
   * tooltip, the hover state and a click act on that bar wherever the pointer
   * is on it.
   * @param {any} g the part group
   * @param {string} partD the part's target path
   * @param {string} wholeD the whole's target path
   * @param {any} whole the whole's node
   * @param {boolean} horizontal
   */
  _hitProxy(g, partD, wholeD, whole, horizontal) {
    const ax = horizontal ? 0 : 1;
    const [a, b] = pathSpan(partD, ax);
    const [c, d] = pathSpan(wholeD, ax);
    const [lo, hi] = pathSpan(partD, ax ? 0 : 1);
    if (!(b - a > 0.5) || !(hi - lo > 0.5)) return;
    const pieces = [];
    if (!(d - c > 0.5)) pieces.push([a, b]);
    else {
      if (a < c) pieces.push([a, Math.min(b, c)]);
      if (b > d) pieces.push([Math.max(a, d), b]);
    }
    const graphics = new Graphics(this.w, this.ctx);
    for (const [u, v] of pieces) {
      if (v - u < 0.5) continue;
      const n = graphics.drawPath({
        d: horizontal ? `M ${u} ${lo} L ${v} ${lo} L ${v} ${hi} L ${u} ${hi} Z` : `M ${lo} ${u} L ${hi} ${u} L ${hi} ${v} L ${lo} ${v} Z`,
        stroke: "none",
        strokeWidth: 0,
        fill: "none",
        classes: "apexcharts-highlight-hit"
      }).node;
      n.setAttribute("pointer-events", "all");
      n.setAttribute("clip-path", `url(#gridRectBarMask${this.w.globals.cuid})`);
      bindHit(whole, n);
      g.add(n);
    }
  }
  /**
   * A part held a mirror across this render's tween. The renderer drops the
   * held mirrors once its tweens have landed, but only when a whole held
   * one, so ask for that sweep once the render is done if no whole did.
   * @param {any} bar
   */
  _settleHeld(bar) {
    if (this._held) return;
    this._held = true;
    const w = this.w;
    Promise.resolve().then(() => {
      var _a;
      if (!w.globals.isDestroyed && !((_a = w.dom.baseEl) == null ? void 0 : _a.querySelector(`.apexcharts-series > .${HELD}`))) {
        bar.settleHeldMirrors();
      }
    });
  }
  /**
   * Where a new part starts. A part drawn a frame ago moves on from there. A
   * first pick starts it as the whole on screen, so frame 0 is the chart
   * before the pick and the solid drains down (or grows past the whole, for
   * an average): `cover` says the part sits on the whole's exact shape.
   * 'baseline' rises instead, and so does a part arriving at a datum that was
   * already faded. Null when there is no start shape to take (the caller
   * starts the part at its target).
   * In a stack the whole moves from its own place in the whole stack, so
   * only a first pick (the whole on screen, about to be covered) starts there;
   * a mount or a datum entering under a pick rises from the part's own base.
   * @param {any} prev what this datum drew a frame ago
   * @param {string | undefined} base the part's zero-length shape
   * @param {string | undefined} wholeFrom the shape the whole moves from
   * @param {boolean} [stacked]
   * @returns {{d: string, cover: boolean} | null}
   */
  _from(prev, base, wholeFrom, stacked) {
    var _a;
    if (prev == null ? void 0 : prev.d) return { d: prev.d, cover: false };
    if (base && (prev || this.cfg.enter === "baseline" || stacked && !(this.w.globals.dataChanged && !((_a = this._prev()) == null ? void 0 : _a.size)))) {
      return { d: base, cover: false };
    }
    return wholeFrom ? { d: wholeFrom, cover: true } : null;
  }
  /**
   * Where a part with nothing to draw now goes before it leaves. On a clear it
   * grows back into the whole as the whole comes back to full opacity, so the
   * last frame is the plain chart; a datum that lost its part while the pick
   * stays drains to its baseline.
   * @param {any} prev
   * @param {boolean} active
   * @param {string} wholeTo the shape the whole lands on
   * @param {string} [base] the part's zero-length shape now, when it has moved
   */
  _exitTo(prev, active, wholeTo, base) {
    return active ? base || prev.base || prev.d : wholeTo;
  }
  /**
   * The group a series' parts nest in. It is re-appended on every call, so the
   * parts sit above every whole drawn so far, and the labels group (appended
   * after the paint step) stays on top. Nested, never a direct child of the
   * series group, so Series.pushPaths never captures a part as a whole.
   * @param {any} elSeries
   * @param {string} cls
   */
  _partGroup(elSeries, cls) {
    let g = elSeries.node._apxHighlight;
    if (!g || g.node.parentNode !== elSeries.node) {
      g = new Graphics(this.w, this.ctx).group({ class: cls });
      elSeries.node._apxHighlight = g;
    }
    elSeries.add(g);
    return g;
  }
  /**
   * One part path, emitted through the renderer's own renderPaths (so it
   * morphs on the whole's clock and records on canvas), with no hit or
   * capture class, and its datum as the whole carries it.
   * @param {any} g the part group
   * A stroked part (a line) passes its `stroke` and `width`; `num` and
   * `scroll` are the renderer's numeric coordinates and scroll morph.
   * @param {{i: number, j: any, realIndex: number, from: string, to: string, interp?: string | null, paint: any, stroke?: any, width?: number, num?: any, scroll?: boolean, delay: number, speed: number, cls: string, chartType: string, clip: string}} p
   */
  _emitPart(g, p) {
    const w = this.w;
    const emit = seriesEmitter(this.ctx, new Graphics(w, this.ctx));
    const part = (
      /** @type {any} */
      emit.renderPaths({
        i: p.i,
        j: p.j,
        realIndex: p.realIndex,
        pathFrom: p.from,
        pathTo: p.to,
        pathToInterp: p.interp || void 0,
        pathToNumeric: p.num,
        scrollMorph: !!p.scroll,
        stroke: p.stroke || "none",
        strokeWidth: p.width || 0,
        fill: p.paint,
        animationDelay: p.delay,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: p.speed,
        className: `${PART} ${p.cls}`,
        chartType: p.chartType,
        bindEventsOnPaths: false
      })
    );
    if (!part || !part.node) return null;
    part.attr("clip-path", p.clip);
    part.node.setAttribute("pointer-events", "none");
    part.node.setAttribute("index", String(p.realIndex));
    part.node.setAttribute("j", String(p.j));
    g.add(part);
    return part;
  }
  /**
   * Take a whole from one Look to another on its mark's clock: the delay and
   * speed the renderer gave the mark, so the fade and the shape move
   * together. Without an animation it lands at once. `land` is a look to jump
   * to on the landing frame (a clear's whole, back to plain the frame its part
   * leaves); `done` runs on that same frame, and holds a tween open even when
   * the look does not change (a part draining away under a faded whole).
   * @param {any} node the whole's mark
   * @param {Look} a @param {Look} b
   * @param {{delayMs: number, speed: number, el?: any}} r the mark's clock;
   * with `el`, the tween runs on a runner of that mark (see _tween)
   * `rec` is told the look on every frame (`lf`, `lo`) and whether the tween
   * is still running (`run`). `attr` is the strength attribute faded
   * (fill-opacity by default). `anim` decides whether to tween at all, in
   * place of the bar morph's rule, and `force` tweens even when the look
   * stays (something else, through `also`, still moves). An outline without
   * a `width` changes the stroke's colour only: its width is the renderer's.
   * @param {{outline?: {color: string, width?: number, opacity: number} | null, attr?: string, anim?: boolean, force?: boolean, curve?: (t: number) => number, also?: (t: number) => void, land?: Look, done?: () => void, rec?: any}} opt
   */
  _fade(node, a, b, r, opt) {
    var _a;
    const attr = opt.attr || "fill-opacity";
    const k = ownOpacity(node, attr);
    const ol = opt.outline;
    const rec = opt.rec || {};
    const attrs = ol && ol.width == null ? ["stroke", "stroke-opacity"] : ["stroke", "stroke-width", "stroke-opacity"];
    const own = attrs.map((n) => node.getAttribute(n));
    const set = (f, o) => {
      rec.lf = f;
      rec.lo = ol ? o : 0;
      node.setAttribute(attr, String(k * f));
      if (!ol) return;
      if (o <= 0) {
        attrs.forEach(
          (n, x) => own[x] == null ? node.removeAttribute(n) : node.setAttribute(n, own[x])
        );
      } else {
        node.setAttribute("stroke", ol.color);
        if (ol.width != null) {
          node.setAttribute("stroke-width", String(ol.width));
        }
        node.setAttribute("stroke-opacity", String(ol.opacity * Math.min(1, o)));
      }
    };
    const frame = (t) => {
      set(mix(a.f, b.f, t), mix(a.o, b.o, t));
      opt.also && opt.also(t);
    };
    const land = () => {
      rec.run = false;
      if (opt.land) set(opt.land.f, opt.land.o);
      opt.done && opt.done();
    };
    if (((_a = opt.anim) != null ? _a : this._animates()) && (a.f !== b.f || a.o !== b.o || opt.done || opt.force)) {
      rec.run = true;
      this._tween(r.delayMs, r.speed, frame, land, opt.curve, r.el);
    } else {
      frame(1);
      land();
    }
  }
  /**
   * Parse side: what each part reaches on the value axis. Unstacked, that is
   * the part itself. In a stack it is the running sum of the parts below it
   * and its own, per stack key (`keyOf(i, j)`), in series order; `split`
   * keeps positive and negative parts in separate sums, as diverging bar
   * stacks are drawn. A null part adds nothing and reaches nothing new.
   * `fresh(i, j)` says a stack starts over at that datum (both signs).
   * @param {(number | null)[][]} parts
   * @param {((i: number, j: number) => string) | null} keyOf
   * @param {boolean} [split]
   * @param {(i: number, j: number) => boolean} [fresh]
   * @returns {(number | null)[][]}
   */
  _runningExt(parts, keyOf, split, fresh) {
    if (!keyOf) return parts;
    const sums = /* @__PURE__ */ new Map();
    return parts.map(
      (row, i) => row.map((p, j) => {
        const k = keyOf(i, j);
        if (fresh && fresh(i, j)) {
          sums.delete(k + "+");
          sums.delete(k + "-");
        }
        if (p == null) return null;
        const key = k + (split && p < 0 ? "-" : "+");
        const v = (sums.get(key) || 0) + p;
        sums.set(key, v);
        return v;
      })
    );
  }
  /**
   * A label drawn in the default white reads on the solid part but not on the
   * faded tint around it. Where the text does not fit inside the part (a thin
   * funnel stage, a short column), it takes the chart's text colour instead.
   * @param {any} labels the datum's label group
   * @param {string} partPath
   */
  _contrastLabels(labels, partPath) {
    const w = this.w;
    const node = labels.node;
    if (!node || /rotate\((?!0\))/.test(node.getAttribute("transform") || ""))
      return;
    const [x0, x1] = pathSpan(partPath, 0);
    const [y0, y1] = pathSpan(partPath, 1);
    const graphics = new Graphics(w);
    node.querySelectorAll("text").forEach((t) => {
      const fill = (t.getAttribute("fill") || "").toLowerCase();
      if (fill !== "#fff" && fill !== "#ffffff" && fill !== "white") return;
      const rect = graphics.getTextRects(
        t.textContent,
        t.getAttribute("font-size"),
        t.getAttribute("font-family"),
        void 0,
        true,
        t.getAttribute("font-weight")
      );
      const x = parseFloat(t.getAttribute("x"));
      const y = parseFloat(t.getAttribute("y"));
      const anchor = t.getAttribute("text-anchor");
      const left = anchor === "middle" ? x - rect.width / 2 : anchor === "end" ? x - rect.width : x;
      const fits = left >= x0 - 1 && left + rect.width <= x1 + 1 && y - rect.height * 0.75 >= y0 - 1 && y + rect.height * 0.25 <= y1 + 1;
      if (!fits) t.setAttribute("fill", w.config.chart.foreColor);
    });
  }
  /**
   * Tooltip, once a row is written: the value reads "part / whole" and the
   * marker is the mark in small, its part solid against the faded whole. Rows
   * are rewritten on every hover, so the marker is put back here too once
   * nothing is highlighted.
   * @param {any} refs the row's elements
   * @param {number} s the series the row shows
   * @param {any} j
   * @param {any} f the row's formatters
   */
  tooltipRow(refs, s, j, f) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const w = this.w;
    const cfg = this.cfg;
    const tt = cfg.tooltip || {};
    const ax = w.globals.axisCharts;
    const on = this.isActive() && tt.show !== false && (j != null || !ax) && !!refs.yValue;
    const lane = !ax && this._ind === "lanes" && w.config.chart.type === "radialBar" ? ((_a = this._lane) == null ? void 0 : _a[0]) === s ? this._lane[1] : "part" : void 0;
    if (refs.marker) {
      swatch(
        refs.marker,
        on && !w.config.tooltip.fillSeriesColor ? ((_c = (_b = this._tiles) == null ? void 0 : _b.get(s + "|" + j)) == null ? void 0 : _c.base) || w.globals.colors[s] : null,
        lane ? (_f = (_e = (_d = cfg.radialBar) == null ? void 0 : _d.lanes) == null ? void 0 : _e.opacity) != null ? _f : LANE : cfg.fadeOpacity,
        lane
      );
    }
    if (!on) return;
    const p = this.valueAt(s, j);
    const series = (
      /** @type {any[]} */
      w.seriesData.series
    );
    const whole = ax ? (_g = series[s]) == null ? void 0 : _g[j] : series[s];
    const opts = ax ? { series, seriesIndex: s, dataPointIndex: j, w } : __spreadProps(__spreadValues({}, w), {
      w,
      series,
      seriesIndex: s,
      dataPointIndex: s,
      highlight: info(p, whole),
      lane
    });
    if (typeof tt.formatter === "function") {
      refs.yValue.innerHTML = String((_h = tt.formatter(p, whole != null ? whole : null, opts)) != null ? _h : "");
      return;
    }
    const muted = '<span class="apexcharts-highlight-total" style="font-weight: 400; opacity: 0.6">';
    if (lane === "whole") {
      if (p != null) {
        const word = (_k = (_j = (_i = w.globals.locale) == null ? void 0 : _i.highlightFilter) == null ? void 0 : _j.part) != null ? _k : "part";
        refs.yValue.innerHTML += ` ${muted}(${word} ${f.yLbFormatter(p, opts)})</span>`;
      }
      return;
    }
    let rest = refs.yValue.innerHTML;
    if (p != null) {
      rest = `/ ${rest}`;
      if (tt.share && whole) {
        rest += ` · ${Math.round(p / whole * 100)}%`;
      }
    }
    refs.yValue.innerHTML = (p == null ? "" : `${f.yLbFormatter(p, opts)} `) + `${muted}${rest}</span>`;
  }
  /**
   * Drilldown, both directions: the pick belongs to the page, not to a drill
   * level. Drop it from the view and tell the page, which re-sends the pick
   * for the level now on screen.
   * @param {any} view
   */
  drillView(view) {
    if (Array.isArray(view == null ? void 0 : view.series)) {
      view.series = view.series.map(stripSeries);
      this._level = { series: view.series, base: this.w.globals.initialSeries };
    }
    if (view && this.cfg.data != null) {
      view.highlightFilter = __spreadProps(__spreadValues({}, view.highlightFilter), { data: null });
    }
  }
  /** Whether a drill level is on screen and nothing has replaced it since. */
  _drilled() {
    var _a;
    const lv = this._level;
    return !!(lv && (((_a = this.ctx.drilldown) == null ? void 0 : _a.depth) || 0) > 0 && this.w.globals.initialSeries === lv.base);
  }
  /** @param {'enter'|'update'|'clear'} phase */
  _fire(phase) {
    var _a;
    const fn = (_a = this.w.config.chart.events) == null ? void 0 : _a.highlightFilterChanged;
    if (typeof fn === "function") {
      fn(this.ctx, { active: phase !== "clear", phase });
    }
  }
  /**
   * Pie.draw, once, before anything is sized or drawn (see PiePart), and
   * Radial.drawArcs, once, before the centre labels and the rings (see
   * RadialPart).
   * @param {any} pie the Pie or Radial renderer
   */
  pie(pie) {
    if (pie.chartType === "radialBar") radialPass(this, pie);
    else piePass(this, pie);
  }
  /**
   * Treemap.draw, once, after the layout and before any parent or tile is
   * drawn. Returns the pass's tile painter (see TreemapPart), or undefined.
   * @param {any} tm the Treemap renderer
   */
  treemap(tm) {
    return treemapPass(this, tm);
  }
  /** Fired once the render that changed the highlight has been drawn. */
  afterRender() {
    if (this._tipOn) {
      this._tipOn = false;
      this.w.config.tooltip.enabled = false;
    }
    const ride2 = this._ride;
    this._ride = null;
    const ct = (
      /** @type {any} */
      this.w.globals.circleTween
    );
    if (ride2 && !(ct && !ct.done)) ride2();
    const was = this._drawnSig;
    const now = this._sig;
    if (was === now) return;
    this._drawnSig = now;
    this._fire(!was ? "enter" : !now ? "clear" : "update");
  }
  /**
   * Set the parts and redraw. `parts` is one row per series (null where there
   * is no part), or a function of the datum. A pie, donut, polarArea or
   * radialBar takes one value per slice (or ring); a row of one value reads
   * as that value there (_parseCircle).
   * @param {any} parts
   * @param {{animate?: boolean, series?: any[]}} [opts]
   */
  set(parts, opts = {}) {
    var _a;
    const w = this.w;
    const gl = (
      /** @type {any} */
      w.globals
    );
    if (!gl.axisCharts) return this._setCircle(parts, opts);
    const base = opts.series || this._rawSeries();
    if (w.config.chart.type === "treemap" && gl.treemapRoots) {
      return this._apply(treeSeries(this, base, parts), opts);
    }
    const perPoint = !opts.series && !!gl.dataReducerRawSeries && !!((_a = w.config.chart.dataReducer) == null ? void 0 : _a.enabled);
    const series = base.map((s, i) => {
      const data = Array.isArray(s.data) ? s.data : [];
      const row = typeof parts === "function" ? data.map(
        (d, j) => {
          var _a2;
          return parts({
            seriesIndex: i,
            dataPointIndex: j,
            seriesName: s.name,
            x: isPoint(d) ? d.x : Array.isArray(d) ? d[0] : w.labelData.labels[j],
            // From the datum itself, so it matches x and datum whatever
            // the chart has parsed (new series, a reduced or hidden row).
            value: valueOf(
              d,
              opts.series || perPoint ? null : (_a2 = w.seriesData.series[i]) == null ? void 0 : _a2[j]
            ),
            datum: d,
            w
          });
        }
      ) : Array.isArray(parts == null ? void 0 : parts[i]) ? parts[i] : null;
      const out = stripSeries(s);
      if (row) {
        if (perPoint && out.data.every((d) => typeof d !== "number")) {
          out.data = out.data.map(
            (d, j) => d == null ? d : Array.isArray(d) ? { x: d[0], y: d[1], highlight: row[j] } : __spreadProps(__spreadValues({}, d), { highlight: row[j] })
          );
        } else {
          out.highlightData = row;
        }
      }
      return out;
    });
    return this._apply(series, opts);
  }
  /** @param {{animate?: boolean}} [opts] */
  clear(opts = {}) {
    if (!this.w.globals.axisCharts) return this._setCircle(null, opts);
    return this._apply(this._rawSeries().map(stripSeries), opts);
  }
  /**
   * set() and clear() on a pie, donut, polarArea or radialBar: the parts are one value
   * per slice in `highlightFilter.data` (a numeric series has nowhere else
   * to carry them). Parts on the slices' own points would win over it, so
   * they are taken off.
   * @param {any} parts (number|null)[], a function of the slice, or null
   * @param {{animate?: boolean, series?: any[]}} opts
   */
  _setCircle(parts, opts) {
    const w = this.w;
    const raw = opts.series || this._rawSeries();
    const upd = {};
    if (opts.series || raw.some(carries)) {
      upd.series = raw.map(stripSeries);
    }
    if (typeof parts === "function") {
      const pts = slicePoints(raw);
      const vals = opts.series ? [] : w.seriesData.series;
      const names = w.seriesData.seriesNames;
      const n = pts.length || raw.length;
      const row = [];
      for (let i = 0; i < n; i++) {
        const d = pts.length ? pts[i] : raw[i];
        row.push(
          parts({
            seriesIndex: i,
            dataPointIndex: i,
            seriesName: pts.length ? String(d.x) : names[i],
            x: pts.length ? d.x : names[i],
            value: valueOf(d, vals[i]),
            datum: d,
            w
          })
        );
      }
      parts = row;
    }
    upd.highlightFilter = { data: Array.isArray(parts) ? parts : null };
    return this.ctx.updateOptions(
      upd,
      false,
      opts.animate !== false,
      true,
      !this._drilled()
    );
  }
  /**
   * At a drill level the pick redraws that level, and leaves the baseline
   * resetSeries() returns to (the top level) where it is.
   * @param {any[]} series @param {{animate?: boolean}} opts
   */
  _apply(series, opts) {
    const drilled = this._drilled();
    if (drilled && this._level) this._level.series = series.map(stripSeries);
    return this.ctx.updateSeries(series, opts.animate !== false, !drilled);
  }
  /** The series as the chart was handed them: nested treemaps and reduced
   * rows are kept raw elsewhere, and re-feeding derived rows would lose them.
   * A drill level is the level on screen. */
  _rawSeries() {
    var _a, _b;
    const gl = (
      /** @type {any} */
      this.w.globals
    );
    const raw = this._drilled() && ((_a = this._level) == null ? void 0 : _a.series) || gl.treemapRawSeries || (gl.dataReducerRawSeries && ((_b = this.w.config.chart.dataReducer) == null ? void 0 : _b.enabled) ? gl.initialSeries : null) || gl.initialSeries || this.w.config.series;
    return (
      /** @type {any[]} */
      raw.map(
        (s) => isPoint(s) ? __spreadValues({}, s) : s
      )
    );
  }
  teardown() {
    var _a, _b;
    Array.from(this._live).forEach((t) => t.finish());
    this._live.clear();
    this._targets = /* @__PURE__ */ new Map();
    this._render = null;
    this._cu = null;
    this._level = null;
    this._seriesEls = /* @__PURE__ */ new Map();
    this._tiles = null;
    this._tmDefs = [];
    (_a = this.ctx.events) == null ? void 0 : _a.removeEventListener("mounted", this._onRender);
    (_b = this.ctx.events) == null ? void 0 : _b.removeEventListener("updated", this._onRender);
  }
}
function pathSpan(d, axis) {
  let lo = Infinity;
  let hi = -Infinity;
  String(d).replace(/([MLQCT])([^MLQCTZz]*)/g, (_m, _c, args) => {
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    for (let n = axis; n < nums.length; n += 2) {
      if (nums[n] < lo) lo = nums[n];
      if (nums[n] > hi) hi = nums[n];
    }
    return "";
  });
  return [lo, hi];
}
function nearest(xs, x) {
  let k = -1;
  let best = Infinity;
  xs.forEach((v, q) => {
    if (v != null && Math.abs(v - x) < best) {
      best = Math.abs(v - x);
      k = q;
    }
  });
  return k;
}
function withPill(t) {
  const bg = t.previousElementSibling;
  return bg && bg.tagName.toLowerCase() === "rect" ? [bg, t] : [t];
}
function overflows(p, whole) {
  return whole != null && whole !== 0 && p / whole > 1;
}
function swatch(m, c, fade = 0.2, lane) {
  const st = m.style;
  const shape = m.firstElementChild;
  if (!c) {
    if (!m._apxHl) return;
    m._apxHl = false;
    st.background = st.boxShadow = st.borderRadius = "";
    if (shape) shape.style.display = "";
    return;
  }
  m._apxHl = true;
  const tint = c.charAt(0) === "#" ? Utils.hexToRgba(c, fade) : `color-mix(in srgb, ${c} ${fade * 100}%, transparent)`;
  st.background = lane === "part" ? c : lane ? tint : `linear-gradient(90deg, ${c} 50%, ${tint} 50%)`;
  st.boxShadow = `inset 0 0 0 1px ${c}`;
  st.borderRadius = "3px";
  if (shape) shape.style.display = "none";
}
function valueOf(d, parsed) {
  const v = isPoint(d) ? d.y : Array.isArray(d) ? d[1] : d;
  return typeof v === "number" ? v : parsed != null ? parsed : null;
}
function scalePath(d, fx, fy) {
  if (!d) return d;
  return d.replace(/([MLQCT])([^MLQCTZz]*)/g, (_m, cmd, args) => {
    const nums = args.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    for (let n = 0; n + 1 < nums.length; n += 2) {
      nums[n] = fx(nums[n]);
    }
    return `${cmd} ${nums.join(" ")} `;
  });
}
_core__default.registerFeatures({ highlightFilter: HighlightFilter });
export {
  default2 as default
};
