var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b2) => {
  for (var prop in b2 || (b2 = {}))
    if (__hasOwnProp.call(b2, prop))
      __defNormalProp(a, prop, b2[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b2)) {
      if (__propIsEnum.call(b2, prop))
        __defNormalProp(a, prop, b2[prop]);
    }
  return a;
};
var __spreadProps = (a, b2) => __defProps(a, __getOwnPropDescs(b2));
/*!
 * ApexCharts v7.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const p = 0.05, m = 0.05, g = 1 / 45;
function v(e, t, s, i) {
  const n = { value: e, velocity: 0, target: e, stiffness: t, damping: s };
  return n;
}
function b(e, t) {
  if (t <= 0) return M(e);
  let s = t;
  for (; s > 0; ) {
    const t2 = Math.min(s, g), i = -e.stiffness * (e.value - e.target) - e.damping * e.velocity;
    e.velocity += i * t2, e.value += e.velocity * t2, s -= t2;
  }
  return !!M(e) && (e.value = e.target, e.velocity = 0, true);
}
function w(e, t) {
  e.target = t;
}
function M(e) {
  var _a, _b;
  const t = (_a = e.restVelocity) != null ? _a : p, s = (_b = e.restDisplacement) != null ? _b : m;
  return Math.abs(e.velocity) < t && Math.abs(e.value - e.target) < s;
}
const S = { crisp: [210, 26], gentle: [120, 20], snappy: [320, 30] };
function L(e) {
  var _a;
  return (_a = S[e != null ? e : "crisp"]) != null ? _a : S.crisp;
}
const Graphics = _core.__apex_Graphics;
const LAYOUT_KEY = "__apexcharts_unit_layouts__";
if (!/** @type {any} */
globalThis[LAYOUT_KEY]) {
  globalThis[LAYOUT_KEY] = {};
}
function getLayouts() {
  return (
    /** @type {any} */
    globalThis[LAYOUT_KEY]
  );
}
function getUnitLayout(name) {
  if (!name) return null;
  return getLayouts()[name] || null;
}
const MARK_KEY = "__apexcharts_unit_marks__";
if (!/** @type {any} */
globalThis[MARK_KEY]) {
  globalThis[MARK_KEY] = {};
}
function getMarks() {
  return (
    /** @type {any} */
    globalThis[MARK_KEY]
  );
}
function normalizeUnitMark(def, name) {
  if (typeof def === "string") {
    const d = def.trim();
    if (!d) return null;
    return Object.freeze({
      name: "anonymous",
      path: d,
      viewBox: (
        /** @type {[number,number,number,number]} */
        [0, 0, 100, 100]
      )
    });
  }
  if (!def || typeof def !== "object") return null;
  if (typeof def.path !== "string" || !def.path.trim()) return null;
  const vb = Array.isArray(def.viewBox) && def.viewBox.length === 4 ? def.viewBox.map(Number) : [0, 0, 100, 100];
  if (!vb.every((n) => isFinite(n)) || vb[2] <= 0 || vb[3] <= 0) {
    return null;
  }
  return Object.freeze(__spreadProps(__spreadValues({}, def), {
    name: def.name || "anonymous",
    path: def.path.trim(),
    viewBox: (
      /** @type {[number,number,number,number]} */
      /** @type {any} */
      vb
    ),
    fillRule: def.fillRule === "evenodd" ? "evenodd" : void 0
  }));
}
function getUnitMark(name) {
  if (!name) return null;
  return getMarks()[name] || null;
}
const Utils = _core.__apex_Utils;
const Environment = _core.__apex_Environment_Environment;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const prefersReducedMotion = _core.__apex_Animations_prefersReducedMotion;
function drawOuterLabel(w2, spec) {
  const {
    lines,
    lineHeight,
    anchor,
    elbow,
    labelX,
    labelY,
    side,
    connector,
    style,
    foreColor
  } = spec;
  const graphics = new Graphics(w2);
  const group = graphics.group({
    class: spec.groupClass || "apexcharts-outer-label-group"
  });
  if (connector.show) {
    const d = `M ${anchor.x} ${anchor.y} L ${elbow.x} ${elbow.y} L ${labelX} ${labelY}`;
    const line = graphics.drawPath({
      d,
      stroke: connector.color,
      strokeWidth: connector.width,
      fill: "none",
      strokeLinecap: "round"
    });
    line.node.classList.add(spec.connectorClass || "apexcharts-outer-label-connector");
    group.add(line);
  }
  const textX = side === "right" ? labelX + 4 : labelX - 4;
  const n = lines.length;
  const startY = labelY - (n - 1) * lineHeight / 2;
  const elText = graphics.drawText({
    x: textX,
    y: startY,
    text: n === 1 ? lines[0] : lines,
    textAnchor: side === "right" ? "start" : "end",
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    foreColor,
    dominantBaseline: "central",
    cssClass: spec.textClass || "apexcharts-outer-label"
  });
  if (n > 1) {
    const tspans = elText.node.getElementsByTagName("tspan");
    for (let li = 0; li < tspans.length; li++) {
      tspans[li].setAttribute("x", `${textX}`);
      tspans[li].setAttribute("dy", li === 0 ? "0" : `${lineHeight}`);
    }
  }
  group.add(elText);
  return group;
}
function measureLabelWidth(w2, labels, style = {}) {
  const graphics = new Graphics(w2);
  const fontSize = style.fontSize || "12px";
  const px = parseFloat(fontSize) || 12;
  let max = 0;
  labels.forEach((text) => {
    if (text == null || text === "") return;
    const str = `${text}`;
    const measured = graphics.getTextRects(str, fontSize, style.fontFamily, "").width;
    max = Math.max(max, measured > 0 ? measured : str.length * px * 0.58);
  });
  return max;
}
function spaceOutLabels(items, minGap, maxY, minY) {
  const col = items.slice().sort((a, b2) => a.idealY - b2.idealY);
  col.forEach((l) => {
    l.labelY = l.idealY;
  });
  for (let k = 1; k < col.length; k++) {
    if (col[k].labelY - col[k - 1].labelY < minGap) {
      col[k].labelY = col[k - 1].labelY + minGap;
    }
  }
  const last = col[col.length - 1];
  const overflow = last ? last.labelY - maxY : 0;
  if (overflow > 0) {
    for (let k = col.length - 1; k >= 0; k--) {
      col[k].labelY -= overflow;
      if (k < col.length - 1 && col[k + 1].labelY - col[k].labelY < minGap) {
        col[k].labelY = col[k + 1].labelY - minGap;
      }
    }
  }
  if (minY != null && col.length && col[0].labelY < minY) {
    const shift = minY - col[0].labelY;
    for (let k = 0; k < col.length; k++) {
      col[k].labelY += shift;
    }
  }
}
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutBack(s) {
  return (t) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
}
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
const SPRING_REFERENCE_SPEED = 800;
const MAX_FRAME_STEP = 0.25;
const PK_CIRCLE = 0;
const PK_CORNER = 1;
const PK_GLYPH = 2;
function springParams(preset, speed) {
  const [stiffness, damping] = L(
    /** @type {import('apex-commons').SpringPreset|undefined} */
    preset
  );
  const scale = SPRING_REFERENCE_SPEED / Math.max(1, speed);
  return [stiffness * scale * scale, damping * scale];
}
class Unit {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w2, ctx) {
    this.ctx = ctx;
    this.w = w2;
    this._lastDotR = 1;
    this._gridTrack = null;
    this._gridDenom = 1;
    this._scatterAxis = null;
    this._specCache = /* @__PURE__ */ new Map();
    this._markWarned = null;
  }
  /**
   * @param {any[]} series - flat count array (non-axis / pie-shaped data)
   * @returns {any} the chart's root group element
   */
  draw(series) {
    const w2 = this.w;
    const graphics = new Graphics(w2, this.ctx);
    const ret = graphics.group({ class: "apexcharts-unit" });
    if (w2.globals.noData || !Array.isArray(series) || series.length === 0) {
      return ret;
    }
    const opts = w2.config.plotOptions.unit;
    const layout = opts.layout === "packed" ? "packed" : opts.layout === "columns" ? "columns" : opts.layout === "grid" ? "grid" : opts.layout === "scatter" ? "scatter" : opts.layout === "arc" ? "arc" : opts.layout === "custom" ? "custom" : "grouped";
    const transition = opts.transition;
    const flow = transition === "flow";
    const identity = transition === "identity";
    const unitValue = opts.unitValue > 0 ? opts.unitValue : 1;
    let counts = series.map((v2) => {
      const n = Math.abs(Utils.parseNumber(v2)) / unitValue;
      return n > 0 ? Math.max(1, Math.round(n)) : 0;
    });
    counts = this._applyMaxUnits(counts, opts.maxUnits);
    const total = counts.reduce((a, b2) => a + b2, 0);
    const clusters = layout === "packed" ? this._layoutPacked(counts, opts) : layout === "columns" ? this._layoutColumns(counts, opts) : layout === "grid" ? this._layoutGrid(counts, opts) : layout === "scatter" ? this._layoutScatter(opts) : layout === "arc" ? this._layoutArc(counts, opts) : layout === "custom" ? this._layoutCustom(counts, opts) : this._layoutGrouped(counts, opts);
    const gridSplit = layout === "grid" && !!(opts.grid && opts.grid.split);
    if (gridSplit) this._drawGridTrack(ret, graphics, opts);
    if (layout === "scatter") this._drawScatterAxes(ret, graphics);
    const dotR = this._lastDotR;
    const animate = this._shouldAnimate();
    const morph = this.ctx && this.ctx.morphTypeChange;
    const morphActive = animate && !!morph && typeof morph.isActive === "function" && morph.isActive() && typeof morph.getInitialCenterFor === "function";
    const perRowBurst = morphActive && typeof morph.getInitialSlotFor === "function";
    const pieceTakeover = morphActive && typeof morph.usesPieceTakeover === "function" && morph.usesPieceTakeover();
    const prev = animate && !morphActive && this.ctx ? this.ctx._unitPrevDots : null;
    const nextPrev = /* @__PURE__ */ new Map();
    const animDots = [];
    const unitData = w2.seriesData.unitData || [];
    const sizeStats = this._bubbleStats(unitData, opts, dotR);
    let gIndex = 0;
    clusters.forEach((cluster) => {
      const color = w2.globals.colors[cluster.i] || w2.globals.colors[0] || "#008FFB";
      const elSeries = graphics.group({
        class: "apexcharts-series",
        seriesName: Utils.escapeString(
          w2.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`
        ),
        rel: cluster.i + 1,
        "data:realIndex": cluster.i
      });
      const burst = morphActive && !perRowBurst ? morph.getInitialCenterFor(cluster.i) : null;
      const burstCount = cluster.dots.length;
      const catData = unitData[cluster.i];
      cluster.dots.forEach((d, jj) => {
        const j = d.j != null ? d.j : jj;
        const datum = catData ? catData[j] : void 0;
        const dotFill = datum && typeof datum === "object" && datum.fillColor ? datum.fillColor : color;
        const rj = d.r != null ? d.r : sizeStats ? this._radiusForValue(this._unitValueOf(datum), sizeStats) : dotR;
        const spec = this._markSpecFor(opts, datum, cluster.i, rj);
        const el = this._drawDot(graphics, opts, rj, dotFill, cluster.i, j, spec);
        elSeries.add(el);
        let key;
        if (identity) {
          const id = datum && typeof datum === "object" ? datum.id != null ? datum.id : datum.name : void 0;
          key = id != null ? `id:${id}` : `g:${gIndex}`;
        } else if (flow) {
          key = String(gIndex);
        } else if (d.slot != null) {
          key = `slot:${d.slot}`;
        } else {
          key = `${cluster.i}:${j}`;
        }
        gIndex++;
        nextPrev.set(key, { x: d.x, y: d.y, fill: dotFill, r: rj, spec });
        if (pieceTakeover) {
          this._place(el.node, spec, d.x, d.y);
          el.node.setAttribute("opacity", "0");
          el.node.setAttribute("data-piece-hidden", "1");
        } else if (animate) {
          const from = prev && prev.get(key);
          const anchor = from || (perRowBurst ? morph.getInitialSlotFor(cluster.i, j, burstCount) : burst);
          const enter = opts.gather && opts.gather.enter || "burst";
          const inPlace = gridSplit || enter === "fade" || enter === "rise";
          const cx0 = anchor ? anchor.x : inPlace ? d.x : cluster.cx;
          const cy0 = anchor ? anchor.y : enter === "rise" && !gridSplit ? d.y + 14 : inPlace ? d.y : cluster.cy;
          el.node.style.opacity = anchor ? "1" : "0";
          this._place(el.node, spec, cx0, cy0);
          animDots.push({
            node: el.node,
            spec,
            x: d.x,
            y: d.y,
            cx0,
            cy0,
            // Carries live spring state (position AND velocity) forward when
            // this render interrupted one still in flight.
            key,
            // Radius tween: an identity-kept dot grows/shrinks from its previous
            // size to its new one (e.g. bubble sizing turning on) instead of
            // snapping. Enters/uniform updates keep r0 === r1 (no-op).
            r0: from && from.r != null ? from.r : rj,
            r1: rj,
            // Colour tween: a dot that flows into a differently coloured group
            // recolours as it travels rather than snapping at the first frame.
            fill0: from ? from.fill : dotFill,
            fill1: dotFill,
            delay: 0,
            // assigned below (staggered by global order)
            isEnter: !anchor
          });
        } else {
          this._place(el.node, spec, d.x, d.y);
        }
      });
      if ((layout === "grouped" || layout === "columns" || gridSplit) && opts.clusterLabels && opts.clusterLabels.show && counts[cluster.i] > 0) {
        const labelTotal = gridSplit ? this._gridDenom : total;
        this._drawClusterLabel(elSeries, cluster, counts[cluster.i], labelTotal, opts, color);
      }
      ret.add(elSeries);
    });
    if (this._outerLabelsOn(opts)) {
      this._drawOuterLabels(ret, clusters, counts, total, opts, animate && !prev);
    }
    if (prev) {
      const exits = this._collectExits(prev, nextPrev, opts);
      if (exits.length) {
        const exitGroup = graphics.group({ class: "apexcharts-unit-exits" });
        ret.add(exitGroup);
        this._runExits(exitGroup, exits, opts);
      }
    }
    if (this.ctx) this.ctx._unitPrevDots = nextPrev;
    if (this.ctx && (!animate || morphActive)) this.ctx._unitSprings = null;
    if (animate && animDots.length) {
      this._runGather(animDots);
    } else {
      w2.globals.animationEnded = true;
    }
    return ret;
  }
  /**
   * Cap total dots to `maxUnits`, scaling every category down proportionally
   * (a non-zero category keeps at least one dot). Warns once when it clips.
   * @param {number[]} counts
   * @param {number} maxUnits
   * @returns {number[]}
   */
  _applyMaxUnits(counts, maxUnits) {
    const total = counts.reduce((a, b2) => a + b2, 0);
    if (!maxUnits || maxUnits <= 0 || total <= maxUnits) return counts;
    const scale = maxUnits / total;
    console.warn(
      `[ApexCharts] unit chart: ${total} dots exceeds maxUnits (${maxUnits}); counts were scaled down proportionally. Raise plotOptions.unit.maxUnits or use plotOptions.unit.unitValue to represent more units per dot.`
    );
    return counts.map((c) => c > 0 ? Math.max(1, Math.round(c * scale)) : 0);
  }
  /**
   * `layout: 'custom'`. Positions come from a caller-supplied provider rather
   * than from a generator in this file.
   *
   * The provider is the whole extension point: `(objects, rect) => [{id, x, y,
   * r?}]`. Everything downstream is unchanged, which is the point - the engine
   * already tweens position, radius and colour, and already keeps a mark's
   * identity across a relayout, so an arbitrary new arrangement needs no new
   * transition code. A silhouette, a hex grid, a timeline, or a projection
   * handed over by ApexMaps are all just this function.
   *
   * Marks the provider omits are dropped, so they animate out through the
   * existing exit path. Ids matching no mark are ignored.
   *
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutCustom(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const total = counts.reduce((a, b2) => a + b2, 0);
    const provider = this._resolveLayoutProvider(opts);
    if (!provider) {
      console.warn(
        `[ApexCharts] unit chart: layout 'custom' needs plotOptions.unit.positions (a function, or the name of a layout registered with ApexCharts.registerUnitLayout). Falling back to 'grouped'.`
      );
      return this._layoutGrouped(counts, opts);
    }
    const gutter = this._outerLabelsOn(opts) ? this._outerLabelGutter(counts, opts) : 0;
    this._lastOuterGutter = gutter;
    const rect = {
      x: gutter,
      y: 0,
      width: Math.max(1, gw - gutter * 2),
      height: gh
    };
    const availR = Math.sqrt(rect.width * rect.height / Math.PI);
    const step = this._resolveStep(opts, availR, total);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const dotR = this._lastDotR;
    const objects = this._layoutObjects(counts, dotR);
    let placed;
    try {
      placed = provider(objects, rect);
    } catch (e) {
      console.warn(
        "[ApexCharts] unit chart: the layout provider threw; falling back to 'grouped'.",
        e
      );
      return this._layoutGrouped(counts, opts);
    }
    if (!Array.isArray(placed)) {
      console.warn(
        "[ApexCharts] unit chart: the layout provider must return an array of {id, x, y}; falling back to 'grouped'."
      );
      return this._layoutGrouped(counts, opts);
    }
    const byId = /* @__PURE__ */ new Map();
    placed.forEach((p2) => {
      if (!p2 || !isFinite(p2.x) || !isFinite(p2.y)) return;
      byId.set(String(p2.id), {
        x: p2.x,
        y: p2.y,
        r: typeof p2.r === "number" && p2.r > 0 ? p2.r : void 0
      });
    });
    const clusters = counts.map((_, i) => ({
      i,
      cx: gw / 2,
      cy: gh / 2,
      outerR: dotR,
      dots: []
    }));
    objects.forEach((o) => {
      const hit = byId.get(o.id);
      if (!hit) return;
      clusters[o.seriesIndex].dots.push({
        x: hit.x,
        y: hit.y,
        r: hit.r,
        j: o.dataPointIndex
      });
    });
    clusters.forEach((c) => {
      if (!c.dots.length) return;
      let sx = 0;
      let sy = 0;
      c.dots.forEach((d) => {
        sx += d.x;
        sy += d.y;
      });
      c.cx = sx / c.dots.length;
      c.cy = sy / c.dots.length;
      let far = 0;
      c.dots.forEach((d) => {
        far = Math.max(far, Math.hypot(d.x - c.cx, d.y - c.cy));
      });
      c.outerR = far + dotR;
    });
    return clusters;
  }
  /**
   * One entry per mark, in global draw order, for a layout provider.
   *
   * `id` is the datum's own id/name where the per-unit object form supplies
   * one, so a provider can address a specific unit ("Texas", "employee 41")
   * rather than a positional slot. It falls back to `"<category>:<index>"`.
   *
   * @param {number[]} counts
   * @param {number} dotR the radius the engine would use, so a provider that
   *   packs by size does not have to rediscover it
   * @returns {{id:string,index:number,seriesIndex:number,dataPointIndex:number,label:string,value:number|undefined,datum:any,r:number}[]}
   */
  _layoutObjects(counts, dotR) {
    const w2 = this.w;
    const unitData = w2.seriesData.unitData || [];
    const names = w2.seriesData.seriesNames || [];
    const objects = [];
    let index = 0;
    counts.forEach((n, i) => {
      var _a;
      const catData = unitData[i];
      for (let j = 0; j < n; j++) {
        const datum = catData ? catData[j] : void 0;
        const id = datum && typeof datum === "object" && (datum.id != null || datum.name != null) ? String(datum.id != null ? datum.id : datum.name) : `${i}:${j}`;
        objects.push({
          id,
          index,
          seriesIndex: i,
          dataPointIndex: j,
          label: names[i],
          // Normalised at the boundary: internally "no value" is null, but the
          // public object shape uses an absent property.
          value: (_a = this._unitValueOf(datum)) != null ? _a : void 0,
          datum,
          r: dotR
        });
        index++;
      }
    });
    return objects;
  }
  /**
   * Resolve `plotOptions.unit.positions` to a provider function: either the
   * function itself, or the name of one registered through
   * `ApexCharts.registerUnitLayout`.
   * @param {any} opts
   * @returns {Function|null}
   */
  _resolveLayoutProvider(opts) {
    const positions = opts.positions;
    if (typeof positions === "function") return positions;
    if (typeof positions === "string" && positions) {
      const found = getUnitLayout(positions);
      if (found) return found;
      console.warn(
        `[ApexCharts] unit chart: no layout named "${positions}" is registered. Register one with ApexCharts.registerUnitLayout("${positions}", fn).`
      );
    }
    return null;
  }
  /**
   * Lay out each category as its own cluster in a horizontal row. All clusters
   * share one dot radius (so dot size is comparable across clusters); the blob
   * radius encodes the count.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutGrouped(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const labelSpace = opts.clusterLabels && opts.clusterLabels.show ? 30 : 6;
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0);
    const Kv = Math.max(1, visible.length);
    const slotOf = new Array(counts.length).fill(-1);
    visible.forEach((i, s) => slotOf[i] = s);
    const cellW = gw / Kv;
    const availH = gh - labelSpace;
    const maxCount = Math.max(1, ...counts);
    const pad = Math.min(cellW, availH) * 0.08;
    const availR = Math.max(4, Math.min(cellW, availH) / 2 - pad);
    const step = this._resolveStep(opts, availR, maxCount);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const dotR = this._lastDotR;
    const cy = labelSpace + availH / 2;
    const outerRs = counts.map((n) => step * Math.sqrt(Math.max(1, n)) + dotR);
    const cellCentre = (i) => slotOf[i] >= 0 ? cellW * (slotOf[i] + 0.5) : gw / 2;
    let centers = counts.map((_, i) => cellCentre(i));
    const visOuter = visible.map((i) => outerRs[i]);
    let overlap = false;
    for (let s = 1; s < Kv; s++) {
      if (centers[visible[s]] - centers[visible[s - 1]] < visOuter[s] + visOuter[s - 1]) {
        overlap = true;
        break;
      }
    }
    if (overlap) {
      const gap = Math.max(2 * dotR, 8);
      const totalW = visOuter.reduce((a, r) => a + 2 * r, 0) + gap * (Kv - 1);
      let visCenters;
      if (totalW <= gw) {
        let x = (gw - totalW) / 2;
        visCenters = visOuter.map((r) => {
          const c = x + r;
          x += 2 * r + gap;
          return c;
        });
      } else if (Kv === 1) {
        visCenters = [gw / 2];
      } else {
        const lo = visOuter[0];
        const hi = gw - visOuter[Kv - 1];
        visCenters = visOuter.map((_, s) => lo + (hi - lo) * s / (Kv - 1));
      }
      centers = counts.map(
        (_, i) => slotOf[i] >= 0 ? visCenters[slotOf[i]] : gw / 2
      );
    }
    return counts.map((n, i) => ({
      i,
      cx: centers[i],
      cy,
      outerR: outerRs[i],
      dots: this._spiral(centers[i], cy, n, step, 0)
    }));
  }
  /**
   * Lay out all categories into ONE packed blob. Dots are assigned spiral
   * indices in category order (smallest-first when sortByGroup), so the
   * minority group nests in the centre.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutPacked(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const labelSpace = 6;
    const total = Math.max(1, counts.reduce((a, b2) => a + b2, 0));
    const availR = Math.max(
      4,
      Math.min(gw, gh - labelSpace) / 2 - Math.min(gw, gh) * 0.06
    );
    const step = this._resolveStep(opts, availR, total);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const cx = gw / 2;
    const cy = labelSpace + (gh - labelSpace) / 2;
    const order = counts.map((_, i) => i);
    if (opts.sortByGroup !== false) {
      order.sort((a, b2) => counts[a] - counts[b2]);
    }
    const clusters = counts.map((_, i) => ({
      i,
      cx,
      cy,
      outerR: step * Math.sqrt(total) + this._lastDotR,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let gi = 0;
    order.forEach((catI) => {
      for (let j = 0; j < counts[catI]; j++) {
        const r = step * Math.sqrt(gi + 0.5);
        const theta = gi * GOLDEN_ANGLE;
        clusters[catI].dots.push({
          x: cx + r * Math.cos(theta),
          y: cy + r * Math.sin(theta),
          slot: gi
        });
        gi++;
      }
    });
    return clusters;
  }
  /**
   * Lay out all marks as a PARLIAMENT / hemicycle: seats in concentric arced
   * rows across an annulus, filled in category (party) order so each category
   * forms a contiguous angular wedge (the classic seating chart). `arc` controls
   * the sweep (`startAngle`/`endAngle`, radialBar convention: 0 = top, clockwise;
   * default a top semicircle), the donut hole (`innerRadiusRatio`) and the row
   * count (`rows`, or 'auto'). Like `packed` this is ONE shared shape coloured by
   * category, so seats key by physical slot: a seat-count change recolours the
   * party boundary in place and only the rim adds / removes seats.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutArc(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const total = Math.max(1, counts.reduce((a, b3) => a + b3, 0));
    const acfg = opts.arc || {};
    const startDeg = typeof acfg.startAngle === "number" ? acfg.startAngle : -90;
    const endDeg = typeof acfg.endAngle === "number" ? acfg.endAngle : 90;
    const a0 = startDeg * Math.PI / 180;
    const a1 = endDeg * Math.PI / 180;
    const span = a1 - a0 || Math.PI;
    const innerRatio = Math.max(
      0,
      Math.min(0.95, typeof acfg.innerRadiusRatio === "number" ? acfg.innerRadiusRatio : 0.4)
    );
    const ux = (a) => Math.sin(a);
    const uy = (a) => -Math.cos(a);
    const b2 = this._arcBounds(a0, a1);
    const pad = Math.min(gw, gh) * 0.04;
    const boxW = Math.max(1e-6, b2.maxX - b2.minX);
    const boxH = Math.max(1e-6, b2.maxY - b2.minY);
    const r1 = Math.max(4, Math.min((gw - 2 * pad) / boxW, (gh - 2 * pad) / boxH));
    const r0 = r1 * innerRatio;
    const cx = gw / 2 - (b2.minX + b2.maxX) / 2 * r1;
    const cy = gh / 2 - (b2.minY + b2.maxY) / 2 * r1;
    const alloc = this._arcAllocate(total, r0, r1, span, opts);
    this._lastDotR = alloc.dotR;
    const seats = [];
    for (let r = 0; r < alloc.R; r++) {
      const rho = alloc.radii[r];
      const n = alloc.seatsPerRow[r];
      for (let k = 0; k < n; k++) {
        const a = n === 1 ? (a0 + a1) / 2 : a0 + span * (k + 0.5) / n;
        seats.push({ a, x: cx + rho * ux(a), y: cy + rho * uy(a) });
      }
    }
    seats.sort((s1, s2) => s1.a - s2.a);
    const clusters = counts.map((_, i) => ({
      i,
      cx,
      cy,
      outerR: r1,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let ci = 0;
    let used = 0;
    seats.forEach((s, slot) => {
      while (ci < counts.length && used >= counts[ci]) {
        ci++;
        used = 0;
      }
      if (ci >= counts.length) return;
      clusters[ci].dots.push({ x: s.x, y: s.y, slot });
      used++;
    });
    return clusters;
  }
  /**
   * Bounding box of the outer arc (radius 1) over [a0, a1], including the centre
   * and every cardinal angle (multiple of 90deg) inside the range, so a
   * semicircle / full circle / arbitrary sweep is all bounded correctly.
   * @param {number} a0 @param {number} a1
   * @returns {{minX:number,maxX:number,minY:number,maxY:number}}
   */
  _arcBounds(a0, a1) {
    const ux = (a) => Math.sin(a);
    const uy = (a) => -Math.cos(a);
    const lo = Math.min(a0, a1);
    const hi = Math.max(a0, a1);
    const xs = [0, ux(a0), ux(a1)];
    const ys = [0, uy(a0), uy(a1)];
    const q = Math.PI / 2;
    for (let k = Math.ceil(lo / q); k * q <= hi; k++) {
      xs.push(ux(k * q));
      ys.push(uy(k * q));
    }
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys)
    };
  }
  /**
   * Allocate `total` seats across concentric rows of the annulus [r0, r1] sweeping
   * `span` radians: seats per row are proportional to the row radius (a longer arc
   * holds more), summed EXACTLY to total by largest remainder. Row count is
   * `arc.rows` if given, else derived from a fixed dot size, else auto-searched to
   * maximise the dot radius (the largest dots that still pack without overlap,
   * mirroring `size:'auto'` elsewhere).
   * @param {number} total @param {number} r0 @param {number} r1 @param {number} span @param {any} opts
   * @returns {{R:number, radii:number[], seatsPerRow:number[], dotR:number}}
   */
  _arcAllocate(total, r0, r1, span, opts) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1.05;
    const absSpan = Math.abs(span) || Math.PI;
    const fixed = this._fixedRadius(opts);
    const evalR = (R) => {
      R = Math.max(1, Math.round(R));
      const radii = [];
      for (let r = 0; r < R; r++) {
        radii.push(R === 1 ? (r0 + r1) / 2 : r0 + (r1 - r0) * (r / (R - 1)));
      }
      const weightSum = radii.reduce((a, x) => a + x, 0) || 1;
      const raw = radii.map((rho) => total * rho / weightSum);
      const seatsPerRow = raw.map((x) => Math.floor(x));
      let left = total - seatsPerRow.reduce((a, x) => a + x, 0);
      raw.map((x, idx) => ({ idx, frac: x - Math.floor(x) })).sort((p2, qq) => qq.frac - p2.frac).forEach((o) => {
        if (left > 0) {
          seatsPerRow[o.idx]++;
          left--;
        }
      });
      while (left > 0) {
        seatsPerRow[R - 1]++;
        left--;
      }
      const radialPitch = R === 1 ? r1 - r0 || r1 : (r1 - r0) / (R - 1);
      let minArcPitch = Infinity;
      for (let r = 0; r < R; r++) {
        const n = seatsPerRow[r];
        if (n <= 0) continue;
        const arcPitch = radii[r] * absSpan / n;
        if (arcPitch < minArcPitch) minArcPitch = arcPitch;
      }
      const pitch = Math.min(radialPitch, minArcPitch);
      return { R, radii, seatsPerRow, dotR: Math.max(1, pitch / (2 * spacing)) };
    };
    const arcRows = opts.arc && opts.arc.rows;
    let res;
    if (typeof arcRows === "number" && arcRows >= 1) {
      res = evalR(arcRows);
    } else if (fixed) {
      const pitch = 2 * fixed * spacing;
      res = evalR((r1 - r0) / pitch + 1);
    } else {
      const maxR = Math.max(1, Math.min(40, Math.ceil(Math.sqrt(total)) + 6));
      res = evalR(1);
      for (let R = 2; R <= maxR; R++) {
        const cand = evalR(R);
        if (cand.dotR > res.dotR) res = cand;
      }
    }
    if (fixed) res.dotR = fixed;
    return res;
  }
  /**
   * Lay out each category as a vertical BAR built from stacked dots (a unit /
   * waffle column). Every bar shares one dot size and one width (the same
   * number of dot columns); the bar's HEIGHT encodes its count. Dots fill each
   * bar bottom-up, row by row. This is the "dot bar" state the circle layouts
   * morph into: with `transition:'flow'` the dots glide straight from their
   * circle slots into these bar slots (see the storyboard sample).
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutColumns(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const labelsOn = !!(opts.clusterLabels && opts.clusterLabels.show);
    const labelsBelow = labelsOn && opts.clusterLabels.position === "bottom";
    const topPad = labelsOn && !labelsBelow ? 30 : 6;
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0);
    const Kv = Math.max(1, visible.length);
    const slotOf = new Array(counts.length).fill(-1);
    visible.forEach((i, s) => slotOf[i] = s);
    const cellW = gw / Kv;
    const barW = cellW * 0.62;
    const bottomPad = Math.max(8, gh * 0.04) + (labelsBelow ? 30 : 0);
    const availH = Math.max(4, gh - topPad - bottomPad);
    const maxCount = Math.max(1, ...counts);
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const colSize = opts.columns ? opts.columns.size : void 0;
    let fixed;
    if (opts.shape !== "image" && colSize === "auto") {
      fixed = null;
    } else if (opts.shape !== "image" && typeof colSize === "number" && colSize > 0) {
      fixed = colSize;
    } else {
      fixed = this._fixedRadius(opts);
    }
    let cols = 1;
    let pitch = 0;
    if (fixed) {
      pitch = 2 * fixed * spacing;
      this._lastDotR = fixed;
      const rowsCap = Math.max(1, Math.floor(availH / pitch));
      const maxColsByWidth = Math.max(1, Math.floor(barW / pitch));
      cols = Math.max(1, Math.min(maxColsByWidth, Math.ceil(maxCount / rowsCap)));
    } else {
      let best = 0;
      const maxCols = Math.max(1, Math.min(40, Math.round(barW / 4)));
      for (let c = 1; c <= maxCols; c++) {
        const rows = Math.ceil(maxCount / c);
        const d = Math.min(barW / c, availH / rows);
        if (d > best) {
          best = d;
          cols = c;
        }
      }
      pitch = best;
      this._lastDotR = Math.max(1, pitch / (2 * spacing));
    }
    const r = this._lastDotR;
    const maxRows = Math.ceil(maxCount / cols);
    const tallestBarH = Math.min(availH, maxRows * pitch);
    const bottom = topPad + (availH + tallestBarH) / 2;
    return counts.map((n, i) => {
      const cx = slotOf[i] >= 0 ? cellW * (slotOf[i] + 0.5) : gw / 2;
      const rows = Math.ceil(Math.max(1, n) / cols);
      const barH = rows * pitch;
      const left = cx - cols * pitch / 2 + pitch / 2;
      const dots = [];
      for (let j = 0; j < n; j++) {
        const rowIdx = Math.floor(j / cols);
        const colIdx = j % cols;
        dots.push({
          x: left + colIdx * pitch,
          y: bottom - r - rowIdx * pitch
        });
      }
      return {
        i,
        cx,
        cy: bottom - barH / 2,
        outerR: barH / 2,
        // Flag read by _drawClusterLabel: a bar takes a straight label (above
        // or below per clusterLabels.position), never a curved arc.
        flat: true,
        dots
      };
    });
  }
  /**
   * Lay out ALL categories into ONE regular lattice - a waffle / grid. Dots take
   * sequential slots in DECLARED category order and fill row-major, `columns`
   * wide, so each category owns a contiguous band of cells: a part-to-whole
   * square "pie". `grid.total` (optional) re-allocates the cells to a fixed
   * budget (e.g. 100) by largest remainder, so the grid reads as exact
   * percentages regardless of the raw totals; without it there is one cell per
   * unit (respecting unitValue / maxUnits). `grid.fillFrom` picks the first row.
   * The category bands follow the legend order (no smallest-first sort), and
   * each physical slot is keyed so a proportion change recolours boundary cells
   * in place rather than reshuffling the whole grid.
   * @param {number[]} counts
   * @param {any} opts
   */
  _layoutGrid(counts, opts) {
    if (opts.grid && opts.grid.split) return this._layoutGridSplit(counts, opts);
    this._gridTrack = null;
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const gcfg = opts.grid || {};
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10));
    const fillFrom = gcfg.fillFrom === "top" ? "top" : "bottom";
    const cells = gcfg.total > 0 ? this._largestRemainder(counts, Math.round(gcfg.total)) : counts.slice();
    const totalCells = cells.reduce((a, b2) => a + b2, 0);
    const rows = Math.max(1, Math.ceil(Math.max(1, totalCells) / cols));
    const labelSpace = 6;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const availW = Math.max(4, gw);
    const availH = Math.max(4, gh - labelSpace);
    const fixed = this._fixedRadius(opts);
    let pitch = 0;
    if (fixed) {
      pitch = 2 * fixed * spacing;
      this._lastDotR = fixed;
    } else {
      pitch = Math.min(availW / cols, availH / rows);
      this._lastDotR = Math.max(1, pitch / (2 * spacing));
    }
    const blockW = cols * pitch;
    const blockH = rows * pitch;
    const originX = (gw - blockW) / 2 + pitch / 2;
    const topY = labelSpace + (availH - blockH) / 2;
    const rowY = (rowIdx) => fillFrom === "bottom" ? topY + blockH - pitch / 2 - rowIdx * pitch : topY + pitch / 2 + rowIdx * pitch;
    const clusters = counts.map((_, i) => ({
      i,
      cx: gw / 2,
      cy: labelSpace + availH / 2,
      outerR: Math.max(blockW, blockH) / 2,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let k = 0;
    for (let ci = 0; ci < cells.length; ci++) {
      for (let j = 0; j < cells[ci]; j++) {
        const col = k % cols;
        const rowIdx = Math.floor(k / cols);
        clusters[ci].dots.push({
          x: originX + col * pitch,
          y: rowY(rowIdx),
          slot: k
        });
        k++;
      }
    }
    return clusters;
  }
  /**
   * Small-multiple ("trellis") waffles: ONE mini-waffle per category, laid out
   * in a near-square grid of tiles. Each tile has `grid.total` cells (default
   * 100 -> a 10x10 tile) and fills a fraction of them equal to the category's
   * value over a denominator (`grid.max`, else the largest count so the leader
   * fills its tile and every other tile stays proportionally full - no empty
   * tiles for arbitrary data). The unfilled cells are drawn as a faint TRACK
   * backdrop (see _drawGridTrack) so each tile reads as a part-to-whole "of N".
   * Only VISIBLE (non-zero) categories claim a tile, so a legend hide drops the
   * tile and the rest re-flow. Each filled cell is keyed by a physical
   * `tile*cells + localCell` slot, so a value change grows/shrinks a tile's fill
   * in place instead of reshuffling.
   * @param {number[]} counts @param {any} opts
   */
  _layoutGridSplit(counts, opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const gcfg = opts.grid || {};
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10));
    const fillFrom = gcfg.fillFrom === "top" ? "top" : "bottom";
    const cellsPerTile = Math.max(1, Math.round(gcfg.total > 0 ? gcfg.total : 100));
    const rowsPerTile = Math.max(1, Math.ceil(cellsPerTile / cols));
    const visible = counts.map((_, i) => i).filter((i) => counts[i] > 0);
    const K = Math.max(1, visible.length);
    const denom = gcfg.max > 0 ? gcfg.max : Math.max(1, ...counts);
    const tileCols = Math.max(
      1,
      Math.round(gcfg.tileColumns > 0 ? gcfg.tileColumns : Math.ceil(Math.sqrt(K)))
    );
    const tileRows = Math.max(1, Math.ceil(K / tileCols));
    const labelsOn = !(opts.clusterLabels && opts.clusterLabels.show === false);
    const labelsBelow = labelsOn && opts.clusterLabels && opts.clusterLabels.position === "bottom";
    const topBand = labelsOn && !labelsBelow ? 22 : 4;
    const botBand = labelsOn && labelsBelow ? 22 : 4;
    const tileW = gw / tileCols;
    const tileH = gh / tileRows;
    const availTileW = Math.max(4, tileW * 0.86);
    const availTileH = Math.max(4, tileH - topBand - botBand);
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const fixed = this._fixedRadius(opts);
    let pitch = 0;
    if (fixed) {
      pitch = 2 * fixed * spacing;
      this._lastDotR = fixed;
    } else {
      pitch = Math.min(availTileW / cols, availTileH / rowsPerTile);
      this._lastDotR = Math.max(1, pitch / (2 * spacing));
    }
    const blockW = cols * pitch;
    const blockH = rowsPerTile * pitch;
    const rowY = (topY, rowIdx) => fillFrom === "bottom" ? topY + blockH - pitch / 2 - rowIdx * pitch : topY + pitch / 2 + rowIdx * pitch;
    const track = [];
    const clusters = [];
    visible.forEach((ci, t) => {
      const tc = t % tileCols;
      const tr = Math.floor(t / tileCols);
      const tileX = tc * tileW;
      const tileYtop = tr * tileH;
      const originX = tileX + (tileW - blockW) / 2 + pitch / 2;
      const topY = tileYtop + topBand + (availTileH - blockH) / 2;
      const cellXY = (k) => ({
        x: originX + k % cols * pitch,
        y: rowY(topY, Math.floor(k / cols))
      });
      for (let k = 0; k < cellsPerTile; k++) track.push(cellXY(k));
      const filled = Math.max(
        0,
        Math.min(cellsPerTile, Math.round(counts[ci] / denom * cellsPerTile))
      );
      const dots = [];
      for (let k = 0; k < filled; k++) {
        const p2 = cellXY(k);
        dots.push({ x: p2.x, y: p2.y, slot: t * cellsPerTile + k });
      }
      clusters.push({
        i: ci,
        cx: tileX + tileW / 2,
        cy: topY + blockH / 2,
        outerR: blockH / 2,
        // Straight per-tile label (never a curved arc), placed by position.
        flat: true,
        split: true,
        dots
      });
    });
    this._gridDenom = denom;
    this._gridTrack = { cells: track };
    return clusters;
  }
  /**
   * Draw the faint "track" backdrop for the small-multiple grid: every cell of
   * every tile's full lattice, so the filled (coloured) cells drawn on top read
   * as a fraction of the whole. Static (redrawn each render, never animated);
   * painted BEHIND the series groups. `grid.trackColor` overrides the default
   * theme-neutral grey.
   * @param {any} ret @param {Graphics} graphics @param {any} opts
   */
  _drawGridTrack(ret, graphics, opts) {
    const track = this._gridTrack;
    if (!track || !track.cells || !track.cells.length) return;
    const r = this._lastDotR;
    const gcfg = opts.grid || {};
    const trackColor = gcfg.trackColor || "rgba(128,128,128,0.14)";
    const g2 = graphics.group({ class: "apexcharts-unit-track" });
    track.cells.forEach((c) => {
      let el;
      if (opts.shape === "square") {
        const side = r * 2;
        el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, trackColor, 1, 0, "none");
        el.node.setAttribute("fill", trackColor);
        el.node.setAttribute("x", String(c.x - r));
        el.node.setAttribute("y", String(c.y - r));
      } else {
        el = graphics.drawCircle(r, { fill: trackColor, "stroke-width": 0, stroke: "none" });
        el.node.setAttribute("fill", trackColor);
        el.node.setAttribute("cx", String(c.x));
        el.node.setAttribute("cy", String(c.y));
      }
      el.node.classList.add("apexcharts-unit-track-cell");
      g2.add(el);
    });
    ret.add(g2);
  }
  /**
   * Scatter / beeswarm layout: position every unit on a real numeric X value
   * axis by its own value (`_unitValueOf`), laned by category on Y. Within a
   * lane an anti-overlap "swarm" pack (or a random jitter) spreads the dots off
   * the centre line so equal / close values do not stack on top of each other.
   * This is the unit chart's answer to "put these on axes": one dot per datum,
   * placed by data, with a drawn value axis + category lanes (see
   * _drawScatterAxes). Needs the per-unit object form (each datum a numeric
   * `value`/`y`); flat counts have no per-unit value, so their lanes stay empty.
   * @param {any} opts
   */
  _layoutScatter(opts) {
    const w2 = this.w;
    const scfg = opts.scatter || {};
    if (scfg.y === "value") return this._layoutScatter2D(opts);
    if (scfg.orientation === "vertical") return this._layoutScatterVertical(opts);
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const unitData = w2.seriesData.unitData || [];
    const names = w2.seriesData.seriesNames || [];
    const valueOf = (d) => this._unitValueOf(d);
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const catVals = unitData.map(
      (cat) => Array.isArray(cat) ? cat.map(valueOf) : []
    );
    const isNum = (v2) => v2 != null && isFinite(v2);
    const visible = catVals.map((_, i) => i).filter((i) => catVals[i].some(isNum));
    const Kv = Math.max(1, visible.length);
    let vmin = Infinity;
    let vmax = -Infinity;
    catVals.forEach(
      (vs) => vs.forEach((v2) => {
        if (v2 != null && isFinite(v2)) {
          if (v2 < vmin) vmin = v2;
          if (v2 > vmax) vmax = v2;
        }
      })
    );
    if (vmin === Infinity) {
      vmin = 0;
      vmax = 1;
    }
    const tickAmount = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5));
    const domain = this._scatterValueDomain(scfg, vmin, vmax, tickAmount);
    const xMin = domain.min;
    const xMax = domain.max;
    const xSpan = xMax - xMin || 1;
    const laneW = scfg.laneLabelWidth != null ? Math.max(0, scfg.laneLabelWidth) : Kv > 1 ? 92 : 8;
    const bottomGutter = 30 + (scfg.xTitle ? 20 : 0);
    const plotL = laneW;
    const plotR = gw - 8;
    const plotT = 10;
    const plotB = gh - bottomGutter;
    const plotW = Math.max(4, plotR - plotL);
    const plotH = Math.max(4, plotB - plotT);
    const plotX = (v2) => plotL + (v2 - xMin) / xSpan * plotW;
    const laneH = plotH / Kv;
    const laneCy = (slot) => plotT + laneH * (slot + 0.5);
    let r = 0;
    const fixed = this._fixedRadius(opts);
    if (fixed) {
      r = fixed;
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i) => catVals[i].filter(isNum).length)
      );
      r = Math.max(
        2,
        Math.min(6, laneH * 0.12, plotW / (2.5 * Math.sqrt(maxLane)))
      );
    }
    this._lastDotR = r;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const step = Math.max(0.5, r * spacing);
    const jitter = scfg.spread === "jitter";
    const clusters = [];
    const lanes = [];
    const maxR = sizeStats ? sizeStats.rMax : r;
    visible.forEach((ci, slot) => {
      const cy = laneCy(slot);
      lanes.push({ i: ci, cy, name: names[ci] || `series-${ci + 1}` });
      const cat = unitData[ci] || [];
      const pts = cat.map((d, j) => {
        const v2 = valueOf(d);
        const p2 = { j, px: plotX(isNum(v2) ? v2 : xMin), y: cy };
        if (sizeStats) p2.r = this._scatterRadius(d, sizeStats, r);
        return p2;
      });
      if (jitter) {
        const halfLane = Math.max(maxR, laneH / 2 - maxR);
        pts.forEach((p2, k) => {
          const t = (k * 9301 + 49297) % 233280 / 233280;
          p2.y = cy + (t * 2 - 1) * halfLane;
        });
      } else {
        this._beeswarm(pts, cy, r, step, maxR);
      }
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy,
        outerR: laneH / 2,
        dots: pts.map((p2) => ({ x: p2.px, y: p2.y, r: p2.r }))
      });
    });
    const ticks = domain.ticks;
    this._scatterAxis = {
      mode: "1d",
      plotL,
      plotR,
      plotT,
      plotB,
      xMin,
      xMax,
      plotX,
      ticks,
      lanes,
      xTitle: scfg.xTitle,
      formatter: typeof scfg.xFormatter === "function" ? scfg.xFormatter : null,
      gridlines: scfg.gridlines !== false
    };
    return clusters;
  }
  /**
   * Vertical beeswarm: the transpose of _layoutScatter. The value runs UP the Y
   * axis and each category is a column (lane) across X; the swarm pack spreads
   * dots horizontally off each column's centre line. The value-axis config keys
   * (`xMin`/`xMax`/`xTitle`/`xFormatter`/`tickAmount`) still describe the value
   * axis (now Y), so flipping `orientation` keeps the same value settings.
   * @param {any} opts
   */
  _layoutScatterVertical(opts) {
    const w2 = this.w;
    const scfg = opts.scatter || {};
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const unitData = w2.seriesData.unitData || [];
    const names = w2.seriesData.seriesNames || [];
    const valueOf = (d) => this._unitValueOf(d);
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const catVals = unitData.map(
      (cat) => Array.isArray(cat) ? cat.map(valueOf) : []
    );
    const isNum = (v2) => v2 != null && isFinite(v2);
    const visible = catVals.map((_, i) => i).filter((i) => catVals[i].some(isNum));
    const Kv = Math.max(1, visible.length);
    let vmin = Infinity;
    let vmax = -Infinity;
    catVals.forEach(
      (vs) => vs.forEach((v2) => {
        if (v2 != null && isFinite(v2)) {
          if (v2 < vmin) vmin = v2;
          if (v2 > vmax) vmax = v2;
        }
      })
    );
    if (vmin === Infinity) {
      vmin = 0;
      vmax = 1;
    }
    const tickAmount = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5));
    const domain = this._scatterValueDomain(scfg, vmin, vmax, tickAmount);
    const vMin = domain.min;
    const vMax = domain.max;
    const vSpan = vMax - vMin || 1;
    const leftGutter = 46 + (scfg.xTitle ? 18 : 0);
    const bottomGutter = Kv > 1 ? 26 : 10;
    const plotL = leftGutter;
    const plotR = gw - 10;
    const plotT = 10;
    const plotB = gh - bottomGutter;
    const plotW = Math.max(4, plotR - plotL);
    const plotH = Math.max(4, plotB - plotT);
    const plotY = (v2) => plotB - (v2 - vMin) / vSpan * plotH;
    const laneW = plotW / Kv;
    const laneCx = (slot) => plotL + laneW * (slot + 0.5);
    let r = 0;
    const fixed = this._fixedRadius(opts);
    if (fixed) {
      r = fixed;
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i) => catVals[i].filter(isNum).length)
      );
      r = Math.max(
        2,
        Math.min(6, laneW * 0.12, plotH / (2.5 * Math.sqrt(maxLane)))
      );
    }
    this._lastDotR = r;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const step = Math.max(0.5, r * spacing);
    const jitter = scfg.spread === "jitter";
    const clusters = [];
    const lanes = [];
    const maxR = sizeStats ? sizeStats.rMax : r;
    visible.forEach((ci, slot) => {
      const cx = laneCx(slot);
      lanes.push({ i: ci, cx, name: names[ci] || `series-${ci + 1}` });
      const cat = unitData[ci] || [];
      const pts = cat.map((d, j) => {
        const v2 = valueOf(d);
        const p2 = { j, py: plotY(isNum(v2) ? v2 : vMin), x: cx };
        if (sizeStats) p2.r = this._scatterRadius(d, sizeStats, r);
        return p2;
      });
      if (jitter) {
        const halfLane = Math.max(maxR, laneW / 2 - maxR);
        pts.forEach((p2, k) => {
          const t = (k * 9301 + 49297) % 233280 / 233280;
          p2.x = cx + (t * 2 - 1) * halfLane;
        });
      } else {
        this._beeswarm(pts, cx, r, step, maxR, true);
      }
      clusters.push({
        i: ci,
        cx,
        cy: (plotT + plotB) / 2,
        outerR: laneW / 2,
        dots: pts.map((p2) => ({ x: p2.x, y: p2.py, r: p2.r }))
      });
    });
    const ticks = domain.ticks;
    this._scatterAxis = {
      mode: "1d",
      orientation: "vertical",
      plotL,
      plotR,
      plotT,
      plotB,
      vMin,
      vMax,
      plotY,
      ticks,
      lanes,
      valueTitle: scfg.xTitle,
      formatter: typeof scfg.xFormatter === "function" ? scfg.xFormatter : null,
      gridlines: scfg.gridlines !== false
    };
    return clusters;
  }
  /**
   * 2D value-value scatter: each datum is a point at (`x`, `y`) on two numeric
   * axes (a scatter / bubble plot in the unit family - premium, keyed
   * transitions, per-unit colour/tooltip). Category = colour (one series group
   * per category). With `scatter.sizeRange` set, each dot is a BUBBLE scaled (by
   * area) from its `sizeField` (default 'z'). Needs the object form with numeric
   * `x` + `y`.
   * @param {any} opts
   */
  _layoutScatter2D(opts) {
    const w2 = this.w;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const scfg = opts.scatter || {};
    const unitData = w2.seriesData.unitData || [];
    const isNum = (v2) => typeof v2 === "number" && isFinite(v2);
    const xOf = (d) => d && typeof d === "object" ? d.x : null;
    const yOf = (d) => d && typeof d === "object" ? d.y != null ? d.y : d.value : null;
    const visible = unitData.map((_, i) => i).filter(
      (i) => (unitData[i] || []).some((d) => isNum(xOf(d)) && isNum(yOf(d)))
    );
    let xmn = Infinity;
    let xmx = -Infinity;
    let ymn = Infinity;
    let ymx = -Infinity;
    unitData.forEach(
      (cat) => (cat || []).forEach((d) => {
        const x = xOf(d);
        const y = yOf(d);
        if (isNum(x) && isNum(y)) {
          if (x < xmn) xmn = x;
          if (x > xmx) xmx = x;
          if (y < ymn) ymn = y;
          if (y > ymx) ymx = y;
        }
      })
    );
    if (xmn === Infinity) {
      xmn = 0;
      xmx = 1;
      ymn = 0;
      ymx = 1;
    }
    const xTicksN = Math.max(2, Math.round(scfg.tickAmount > 0 ? scfg.tickAmount : 5));
    const yTicksN = Math.max(2, Math.round(scfg.yTickAmount > 0 ? scfg.yTickAmount : 5));
    const nx = this._niceScale(
      scfg.xMin != null ? scfg.xMin : xmn,
      scfg.xMax != null ? scfg.xMax : xmx,
      xTicksN
    );
    const ny = this._niceScale(
      scfg.yMin != null ? scfg.yMin : ymn,
      scfg.yMax != null ? scfg.yMax : ymx,
      yTicksN
    );
    const xMin = scfg.xMin != null ? scfg.xMin : nx.min;
    const xMax = scfg.xMax != null ? scfg.xMax : nx.max;
    const yMin = scfg.yMin != null ? scfg.yMin : ny.min;
    const yMax = scfg.yMax != null ? scfg.yMax : ny.max;
    const xSpan = xMax - xMin || 1;
    const ySpan = yMax - yMin || 1;
    const leftGutter = 46 + (scfg.yTitle ? 18 : 0);
    const bottomGutter = 30 + (scfg.xTitle ? 20 : 0);
    const plotL = leftGutter;
    const plotR = gw - 12;
    const plotT = 10;
    const plotB = gh - bottomGutter;
    const plotW = Math.max(4, plotR - plotL);
    const plotH = Math.max(4, plotB - plotT);
    const plotX = (v2) => plotL + (v2 - xMin) / xSpan * plotW;
    const plotY = (v2) => plotB - (v2 - yMin) / ySpan * plotH;
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const baseR = this._fixedRadius(opts) || 5;
    this._lastDotR = baseR;
    const clusters = [];
    visible.forEach((ci) => {
      const cat = unitData[ci] || [];
      const dots = cat.map((d) => {
        const x = xOf(d);
        const y = yOf(d);
        return {
          x: plotX(isNum(x) ? x : xMin),
          y: plotY(isNum(y) ? y : yMin),
          r: sizeStats ? this._scatterRadius(d, sizeStats, baseR) : void 0
        };
      });
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy: (plotT + plotB) / 2,
        outerR: plotH / 2,
        dots
      });
    });
    const mkTicks = (lo, hi, span, spacing, pinned, n) => {
      const out = [];
      if (pinned) {
        for (let k = 0; k < n; k++) out.push(lo + span * k / (n - 1));
      } else {
        const sp = spacing || span / Math.max(1, n - 1);
        for (let v2 = lo; v2 <= hi + sp * 0.5; v2 += sp) {
          out.push(Math.abs(v2) < sp * 1e-9 ? 0 : v2);
        }
      }
      return out;
    };
    this._scatterAxis = {
      mode: "2d",
      plotL,
      plotR,
      plotT,
      plotB,
      plotX,
      plotY,
      xTicks: mkTicks(
        xMin,
        xMax,
        xSpan,
        nx.spacing,
        scfg.xMin != null || scfg.xMax != null,
        xTicksN
      ),
      yTicks: mkTicks(
        yMin,
        yMax,
        ySpan,
        ny.spacing,
        scfg.yMin != null || scfg.yMax != null,
        yTicksN
      ),
      xTitle: scfg.xTitle,
      yTitle: scfg.yTitle,
      xFormatter: typeof scfg.xFormatter === "function" ? scfg.xFormatter : null,
      yFormatter: typeof scfg.yFormatter === "function" ? scfg.yFormatter : null,
      gridlines: scfg.gridlines !== false
    };
    return clusters;
  }
  /**
   * Bubble size stats for the scatter layout, or null when `scatter.sizeRange`
   * is not a `[minR, maxR]` pair. Reads the global range of each datum's
   * `sizeField` (default 'z') so a value maps to a radius (area scale) in
   * _scatterRadius.
   * @param {any} scfg @param {any[][]} unitData
   * @returns {{zmin:number,zmax:number,rMin:number,rMax:number,field:string}|null}
   */
  _scatterSizeStats(scfg, unitData) {
    const range = scfg && scfg.sizeRange;
    if (!Array.isArray(range) || range.length < 2) return null;
    const rMin = Math.max(0.5, +range[0]);
    const rMax = Math.max(rMin, +range[1]);
    const field = scfg.sizeField || "z";
    let zmin = Infinity;
    let zmax = -Infinity;
    unitData.forEach(
      (cat) => (cat || []).forEach((d) => {
        const z = d && typeof d === "object" ? d[field] : null;
        if (typeof z === "number" && isFinite(z)) {
          if (z < zmin) zmin = z;
          if (z > zmax) zmax = z;
        }
      })
    );
    if (zmin === Infinity) return null;
    return { zmin, zmax, rMin, rMax, field };
  }
  /**
   * Radius for one datum under the bubble size stats: area proportional to the
   * `sizeField` value (so radius grows with sqrt), between rMin and rMax. A
   * missing value collapses to rMin.
   * @param {any} d
   * @param {{zmin:number,zmax:number,rMin:number,rMax:number,field:string}} st
   * @param {number} fallback @returns {number}
   */
  _scatterRadius(d, st, fallback) {
    if (!st) return fallback;
    const z = d && typeof d === "object" ? d[st.field] : null;
    if (typeof z !== "number" || !isFinite(z)) return st.rMin;
    const t = st.zmax > st.zmin ? (z - st.zmin) / (st.zmax - st.zmin) : 1;
    const tc = Math.max(0, Math.min(1, t));
    const aMin = st.rMin * st.rMin;
    const aMax = st.rMax * st.rMax;
    return Math.sqrt(aMin + tc * (aMax - aMin));
  }
  /**
   * One-dimensional anti-overlap "beeswarm" pack: given points with a fixed x
   * (`px`) and a lane centre `cy`, assign each a y so no two dots overlap (centre
   * distance >= r_i + r_j). Greedy in ascending-x order, trying offsets 0, +step,
   * -step, +2step ... and taking the SMALLEST that clears every already-placed
   * neighbour still within reach in x. No-overlap always wins: a very dense lane
   * grows a taller swarm rather than stacking dots (offsets are not hard-clamped
   * to the lane). Each point may carry its own radius `r` (bubble beeswarm),
   * else `rFallback` applies; `maxR` bounds the value-window break. Deterministic
   * (no physics, no randomness).
   *
   * Orientation-agnostic: the "fixed" axis is the value axis and the "spread"
   * axis is the lane thickness. Horizontal (default): fixed = `px`, spread = `y`
   * (mutates `.y`). Vertical: fixed = `py`, spread = `x` (mutates `.x`).
   * @param {any[]} pts @param {number} center lane centre on the spread axis
   * @param {number} rFallback @param {number} step @param {number} [maxR]
   * @param {boolean} [vertical]
   */
  _beeswarm(pts, center, rFallback, step, maxR, vertical = false) {
    const fk = vertical ? "py" : "px";
    const sk = vertical ? "x" : "y";
    const order = pts.slice().sort((a, b2) => a[fk] - b2[fk]);
    const placed = [];
    const rCap = maxR != null ? maxR : rFallback;
    order.forEach((p2) => {
      const pr = p2.r != null ? p2.r : rFallback;
      let chosen = 0;
      for (let k = 0; k < 2e3; k++) {
        const off = k === 0 ? 0 : Math.ceil(k / 2) * step * (k % 2 ? 1 : -1);
        const s = center + off;
        let ok = true;
        for (let m2 = placed.length - 1; m2 >= 0; m2--) {
          const q = placed[m2];
          const df = p2[fk] - q.f;
          if (df > pr + rCap) break;
          const need = pr + q.r;
          const ds = s - q.s;
          if (df * df + ds * ds < need * need) {
            ok = false;
            break;
          }
        }
        if (ok) {
          chosen = off;
          break;
        }
      }
      p2[sk] = center + chosen;
      placed.push({ f: p2[fk], s: p2[sk], r: pr });
    });
  }
  /**
   * Value-axis domain + ticks for a 1D beeswarm. The domain ALWAYS contains
   * every datum: a swarm that clips a dot outside the plot box is a bug, so an
   * explicit `xMin`/`xMax` only FRAMES the axis and is extended by whole
   * tick-steps whenever the data would otherwise overflow. Orientation-agnostic:
   * the same value axis is X for a horizontal swarm and Y for a vertical one.
   * @param {any} scfg scatter config
   * @param {number} vmin data minimum @param {number} vmax data maximum
   * @param {number} tickAmount desired tick count
   * @returns {{ min:number, max:number, ticks:number[] }}
   */
  _scatterValueDomain(scfg, vmin, vmax, tickAmount) {
    const buildTicks = (min, max, spacing2) => {
      const ticks = [];
      for (let v2 = min; v2 <= max + spacing2 * 0.5; v2 += spacing2) {
        ticks.push(Math.abs(v2) < spacing2 * 1e-9 ? 0 : v2);
      }
      return ticks;
    };
    if (scfg.xMin != null || scfg.xMax != null) {
      let min = scfg.xMin != null ? scfg.xMin : vmin;
      let max = scfg.xMax != null ? scfg.xMax : vmax;
      if (!(max > min)) max = min + 1;
      const spacing2 = (max - min) / Math.max(1, tickAmount - 1);
      if (vmin < min) min -= Math.ceil((min - vmin) / spacing2) * spacing2;
      if (vmax > max) max += Math.ceil((vmax - max) / spacing2) * spacing2;
      return { min, max, ticks: buildTicks(min, max, spacing2) };
    }
    const nice = this._niceScale(vmin, vmax, tickAmount);
    const spacing = nice.spacing || (nice.max - nice.min) / Math.max(1, tickAmount - 1);
    return { min: nice.min, max: nice.max, ticks: buildTicks(nice.min, nice.max, spacing) };
  }
  /**
   * A "nice" numeric scale [min, max] + tick spacing covering [dataMin, dataMax]
   * with about `ticks` ticks, using rounded 1/2/5 x 10^n steps. Homegrown (no
   * dependency) - lean-core.
   * @param {number} dataMin @param {number} dataMax @param {number} ticks
   * @returns {{min:number,max:number,spacing:number}}
   */
  _niceScale(dataMin, dataMax, ticks) {
    const lo = dataMin;
    let hi = dataMax;
    if (!(hi > lo)) hi = lo + 1;
    const range = this._niceNum(hi - lo, false);
    const spacing = this._niceNum(range / Math.max(1, ticks - 1), true);
    return {
      min: Math.floor(lo / spacing) * spacing,
      max: Math.ceil(hi / spacing) * spacing,
      spacing
    };
  }
  /**
   * Round a range to a "nice" 1/2/5 x 10^n number (Heckbert's loose/round label
   * algorithm).
   * @param {number} range @param {boolean} round @returns {number}
   */
  _niceNum(range, round) {
    const rng = range > 0 ? range : 1;
    const exp = Math.floor(Math.log(rng) / Math.LN10);
    const frac = rng / Math.pow(10, exp);
    let nf;
    if (round) {
      nf = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10;
    } else {
      nf = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10;
    }
    return nf * Math.pow(10, exp);
  }
  /**
   * Draw the scatter chrome behind the dots, from the geometry the layout
   * stashed on `this._scatterAxis`. 1D (beeswarm): vertical X gridlines +
   * baseline + tick labels (+ x title) + a per-lane category label in the
   * category colour. 2D: both X + Y gridlines, both axes' tick labels, and
   * rotated/placed axis titles (no lane labels - category is colour). Browser-
   * only (SSR renders the dots without the chrome, as with cluster labels).
   * @param {any} ret @param {Graphics} graphics
   */
  _drawScatterAxes(ret, graphics) {
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const ax = this._scatterAxis;
    if (!ax) return;
    const NS = "http://www.w3.org/2000/svg";
    const g2 = graphics.group({ class: "apexcharts-unit-axis" });
    const gridColor = w2.config.grid && w2.config.grid.borderColor || "rgba(128,128,128,0.18)";
    const axisColor = "rgba(128,128,128,0.5)";
    const cfgColors = w2.config.xaxis && w2.config.xaxis.labels && w2.config.xaxis.labels.style && w2.config.xaxis.labels.style.colors;
    const configuredLabelColor = Array.isArray(cfgColors) ? cfgColors[0] : cfgColors;
    const labelColor = configuredLabelColor || "rgba(120,130,140,0.9)";
    const line = (x1, y1, x2, y2, stroke) => {
      const l = BrowserAPIs.createElementNS(NS, "line");
      l.setAttribute("x1", String(x1));
      l.setAttribute("y1", String(y1));
      l.setAttribute("x2", String(x2));
      l.setAttribute("y2", String(y2));
      l.setAttribute("stroke", stroke);
      l.setAttribute("shape-rendering", "crispEdges");
      g2.node.appendChild(l);
    };
    const text = (str, x, y, anchor, fill, size, weight, cls) => {
      const t = BrowserAPIs.createElementNS(NS, "text");
      t.setAttribute("class", cls);
      t.setAttribute("x", String(x));
      t.setAttribute("y", String(y));
      t.setAttribute("text-anchor", anchor);
      t.setAttribute("dominant-baseline", "middle");
      t.setAttribute("font-size", `${size}px`);
      t.setAttribute("font-family", w2.config.chart.fontFamily || "inherit");
      t.setAttribute("font-weight", String(weight));
      t.setAttribute("fill", fill);
      t.textContent = str;
      g2.node.appendChild(t);
    };
    if (ax.mode === "2d") {
      ax.yTicks.forEach((v2) => {
        const y = ax.plotY(v2);
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor);
        const label = ax.yFormatter ? String(ax.yFormatter(v2)) : this._formatTick(v2);
        text(label, ax.plotL - 8, y, "end", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      ax.xTicks.forEach((v2) => {
        const x = ax.plotX(v2);
        if (ax.gridlines) line(x, ax.plotT, x, ax.plotB, gridColor);
        const label = ax.xFormatter ? String(ax.xFormatter(v2)) : this._formatTick(v2);
        text(label, x, ax.plotB + 14, "middle", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      line(ax.plotL, ax.plotB, ax.plotR, ax.plotB, axisColor);
      line(ax.plotL, ax.plotT, ax.plotL, ax.plotB, axisColor);
      if (ax.xTitle) {
        text(
          String(ax.xTitle),
          (ax.plotL + ax.plotR) / 2,
          ax.plotB + 32,
          "middle",
          labelColor,
          12,
          600,
          "apexcharts-unit-axis-title"
        );
      }
      if (ax.yTitle) {
        const yt = BrowserAPIs.createElementNS(NS, "text");
        yt.setAttribute("class", "apexcharts-unit-axis-title");
        const tx = 14;
        const ty = (ax.plotT + ax.plotB) / 2;
        yt.setAttribute("x", String(tx));
        yt.setAttribute("y", String(ty));
        yt.setAttribute("text-anchor", "middle");
        yt.setAttribute("font-size", "12px");
        yt.setAttribute("font-family", w2.config.chart.fontFamily || "inherit");
        yt.setAttribute("font-weight", "600");
        yt.setAttribute("fill", labelColor);
        yt.setAttribute("transform", `rotate(-90 ${tx} ${ty})`);
        yt.textContent = String(ax.yTitle);
        g2.node.appendChild(yt);
      }
      ret.add(g2);
      return;
    }
    if (ax.orientation === "vertical") {
      ax.ticks.forEach((v2) => {
        const y = ax.plotY(v2);
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor);
        const label = ax.formatter ? String(ax.formatter(v2)) : this._formatTick(v2);
        text(label, ax.plotL - 8, y, "end", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      line(ax.plotL, ax.plotT, ax.plotL, ax.plotB, axisColor);
      if (ax.valueTitle) {
        const yt = BrowserAPIs.createElementNS(NS, "text");
        yt.setAttribute("class", "apexcharts-unit-axis-title");
        const tx = 14;
        const ty = (ax.plotT + ax.plotB) / 2;
        yt.setAttribute("x", String(tx));
        yt.setAttribute("y", String(ty));
        yt.setAttribute("text-anchor", "middle");
        yt.setAttribute("font-size", "12px");
        yt.setAttribute("font-family", w2.config.chart.fontFamily || "inherit");
        yt.setAttribute("font-weight", "600");
        yt.setAttribute("fill", labelColor);
        yt.setAttribute("transform", `rotate(-90 ${tx} ${ty})`);
        yt.textContent = String(ax.valueTitle);
        g2.node.appendChild(yt);
      }
      ax.lanes.forEach((lane) => {
        const color = configuredLabelColor || w2.globals.colors[lane.i] || w2.globals.colors[0] || "#008FFB";
        text(lane.name, lane.cx, ax.plotB + 16, "middle", color, 12, 600, "apexcharts-unit-lane-label");
      });
      ret.add(g2);
      return;
    }
    ax.ticks.forEach((v2, idx) => {
      const x = ax.plotX(v2);
      if (ax.gridlines) line(x, ax.plotT, x, ax.plotB, gridColor);
      const label = ax.formatter ? String(ax.formatter(v2)) : this._formatTick(v2);
      const anchor = idx === 0 ? "start" : idx === ax.ticks.length - 1 ? "end" : "middle";
      text(label, x, ax.plotB + 14, anchor, labelColor, 11, 400, "apexcharts-unit-tick");
    });
    line(ax.plotL, ax.plotB, ax.plotR, ax.plotB, axisColor);
    if (ax.xTitle) {
      text(
        String(ax.xTitle),
        (ax.plotL + ax.plotR) / 2,
        ax.plotB + 32,
        "middle",
        labelColor,
        12,
        600,
        "apexcharts-unit-axis-title"
      );
    }
    if (ax.plotL > 12) {
      ax.lanes.forEach((lane) => {
        const color = configuredLabelColor || w2.globals.colors[lane.i] || w2.globals.colors[0] || "#008FFB";
        text(lane.name, ax.plotL - 8, lane.cy, "end", color, 12, 600, "apexcharts-unit-lane-label");
      });
    }
    ret.add(g2);
  }
  /**
   * Compact tick-value formatting: integers as-is, otherwise trimmed to a short
   * decimal; large magnitudes get a k/M suffix.
   * @param {number} v @returns {string}
   */
  _formatTick(v2) {
    if (!isFinite(v2)) return "";
    const a = Math.abs(v2);
    if (a >= 1e6) return `${+(v2 / 1e6).toFixed(1)}M`;
    if (a >= 1e4) return `${+(v2 / 1e3).toFixed(1)}k`;
    if (Number.isInteger(v2)) return String(v2);
    return String(+v2.toFixed(2));
  }
  /**
   * Distribute `total` whole cells across `counts` in proportion to each value,
   * using the largest-remainder method so the parts sum to exactly `total`
   * (used by the grid/waffle percentage mode).
   * @param {number[]} counts @param {number} total @returns {number[]}
   */
  _largestRemainder(counts, total) {
    const sum = counts.reduce((a, b2) => a + b2, 0);
    if (sum <= 0 || total <= 0) return counts.map(() => 0);
    const exact = counts.map((c) => c / sum * total);
    const floors = exact.map((v2) => Math.floor(v2));
    const used = floors.reduce((a, b2) => a + b2, 0);
    const remaining = Math.max(0, total - used);
    const byFrac = exact.map((v2, i) => ({ i, frac: v2 - Math.floor(v2) })).sort((a, b2) => b2.frac - a.frac);
    const out = floors.slice();
    for (let n = 0; n < remaining && n < byFrac.length; n++) {
      out[byFrac[n].i]++;
    }
    return out;
  }
  /**
   * Phyllotaxis (sunflower) placement for `n` points around (cx, cy).
   * @param {number} cx @param {number} cy @param {number} n
   * @param {number} step @param {number} startIndex
   * @returns {{x:number,y:number}[]}
   */
  _spiral(cx, cy, n, step, startIndex) {
    const pts = [];
    for (let k = 0; k < n; k++) {
      const idx = startIndex + k;
      const r = step * Math.sqrt(idx + 0.5);
      const theta = idx * GOLDEN_ANGLE;
      pts.push({ x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) });
    }
    return pts;
  }
  /**
   * A fixed dot radius, if the shape/size implies one: an explicit numeric
   * `size`, or an `image` shape (sized by its own width/height). Returns null
   * when dots should auto-size to fit the plot.
   * @param {any} opts @returns {number | null}
   */
  _fixedRadius(opts) {
    if (opts.shape === "image" && opts.image) {
      return Math.max(opts.image.width || 20, opts.image.height || 20) / 2;
    }
    if (this._bubbleActive(opts) && typeof opts.sizeByValue.maxRadius === "number") {
      return opts.sizeByValue.maxRadius > 0 ? opts.sizeByValue.maxRadius : null;
    }
    if (typeof opts.size === "number" && opts.size > 0) return opts.size;
    return null;
  }
  /**
   * Whether opt-in bubble sizing applies: enabled, and the shape sizes per
   * mark. Squares and images keep a uniform size; a pictogram does not, because
   * its scale is derived per mark from the same radius a circle would use.
   * @param {any} opts @returns {boolean}
   */
  _bubbleActive(opts) {
    const sbv = opts.sizeByValue;
    return !!(sbv && sbv.enabled && opts.shape !== "image" && opts.shape !== "square");
  }
  /**
   * This datum's numeric value for sizing / tooltip: the number itself, or an
   * object's `value` / `y`. Null when there is no usable number.
   * @param {any} d @returns {number | null}
   */
  _unitValueOf(d) {
    if (typeof d === "number") return d;
    if (d && typeof d === "object") {
      const v2 = d.value != null ? d.value : d.y;
      return typeof v2 === "number" ? v2 : null;
    }
    return null;
  }
  /**
   * Radius for one bubble given the value stats. Default 'area' scaling makes
   * a bubble's AREA proportional to its value (radius grows with sqrt); 'linear'
   * scales the radius directly. Missing values collapse to the min radius.
   * @param {number|null} v
   * @param {{min:number,max:number,minR:number,maxR:number,scale:string}} stats
   * @returns {number}
   */
  _radiusForValue(v2, stats) {
    if (v2 == null || !isFinite(v2)) return stats.minR;
    const t = stats.max > stats.min ? (v2 - stats.min) / (stats.max - stats.min) : 1;
    const tc = Math.max(0, Math.min(1, t));
    if (stats.scale === "linear") {
      return stats.minR + tc * (stats.maxR - stats.minR);
    }
    const aMin = stats.minR * stats.minR;
    const aMax = stats.maxR * stats.maxR;
    return Math.sqrt(aMin + tc * (aMax - aMin));
  }
  /**
   * Value stats + radius bounds for bubble sizing, or null when it does not
   * apply (disabled, non-circle shape, or no per-unit values). `maxR` is the
   * reference radius the layout already spaced the lattice for; `minR` defaults
   * to ~35% of it.
   * @param {any[][]} unitData @param {any} opts @param {number} refR
   * @returns {{min:number,max:number,minR:number,maxR:number,scale:string}|null}
   */
  _bubbleStats(unitData, opts, refR) {
    if (!this._bubbleActive(opts)) return null;
    let vmin = Infinity;
    let vmax = -Infinity;
    unitData.forEach((cat) => {
      if (!cat) return;
      cat.forEach((d) => {
        const v2 = this._unitValueOf(d);
        if (v2 != null && isFinite(v2)) {
          if (v2 < vmin) vmin = v2;
          if (v2 > vmax) vmax = v2;
        }
      });
    });
    if (vmin === Infinity || vmax < vmin) return null;
    const sbv = opts.sizeByValue;
    const maxR = refR;
    const minR = Math.max(
      1,
      Math.min(
        maxR,
        typeof sbv.minRadius === "number" ? sbv.minRadius : maxR * 0.35
      )
    );
    return {
      min: vmin,
      max: vmax,
      minR,
      maxR,
      scale: sbv.scale === "linear" ? "linear" : "area"
    };
  }
  /**
   * Radial step between successive spiral shells. A fixed radius derives the
   * step directly; 'auto' derives it so a cluster of `count` dots fits `availR`.
   * @param {any} opts @param {number} availR @param {number} count
   * @returns {number}
   */
  _resolveStep(opts, availR, count) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const fixed = this._fixedRadius(opts);
    if (fixed) return 2 * fixed * spacing;
    return availR / (Math.sqrt(Math.max(1, count)) + 0.5);
  }
  /**
   * @param {number} step @param {any} opts
   * @returns {number}
   */
  _dotRadiusFromStep(step, opts) {
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const fixed = this._fixedRadius(opts);
    if (fixed) return fixed;
    return Math.max(1, step / (2 * spacing));
  }
  /**
   * Corner-anchored shapes (square, image) position by their top-left x/y;
   * circles position by their centre cx/cy.
   * @param {any} opts @returns {boolean}
   */
  _isCorner(opts) {
    return opts.shape === "square" || opts.shape === "image";
  }
  /**
   * Half-width/height used to convert a centre point to a corner shape's x/y.
   * @param {any} opts @param {number} [r] this mark's own radius; defaults to
   *   the chart-wide one (an image is sized by its own width/height either way)
   * @returns {{hx:number, hy:number}}
   */
  _halfExtent(opts, r) {
    if (opts.shape === "image" && opts.image) {
      return { hx: (opts.image.width || 20) / 2, hy: (opts.image.height || 20) / 2 };
    }
    const rr = r != null ? r : this._lastDotR;
    return { hx: rr, hy: rr };
  }
  /**
   * The draw + placement rule for ONE mark.
   *
   * Positioning used to be a chart-GLOBAL decision - `_isCorner(opts)` and a
   * single `_halfExtent(opts)`, hoisted out of the gather loop - which held only
   * while every mark in a render was the same element. Two things broke that:
   * a pictogram render where dot 3 is a <circle> and dot 4 a <path>, and the
   * plainer bug that a `square` sized from a per-position radius (`_drawDot`
   * uses the dot's own `rj`) was still being CENTRED with the chart-wide
   * `_lastDotR`, so a layout returning per-mark radii drew every square off its
   * own slot by `_lastDotR - r`.
   *
   * So the rule travels with the mark. A spec is one frozen object per distinct
   * (kind, size) - shared by every dot that uses it, resolved once per render -
   * carrying an int the frame loop switches on. `_place` is the only writer.
   *
   * @typedef {object} UnitMarkSpec
   * @property {number} pk PK_CIRCLE | PK_CORNER | PK_GLYPH
   * @property {number} [hx] corner: half-width
   * @property {number} [hy] corner: half-height
   * @property {any} [mark] glyph: the resolved mark definition
   * @property {string} [d] glyph: path data, in the mark's own viewBox units
   * @property {string} [fillRule] glyph: 'evenodd' when the mark declares it
   * @property {number} [s] glyph: uniform scale from viewBox units to px
   * @property {number} [ox] glyph: pre-scaled x of the viewBox centre
   * @property {number} [oy] glyph: pre-scaled y of the viewBox centre
   * @property {string} [tail] glyph: the pre-built `) scale(s)` transform tail
   * @property {number} [r] the radius this spec was fitted to
   */
  /**
   * Position one mark at (x, y), whatever element it is.
   *
   * Circles and corner shapes write byte-identically to what they wrote before
   * this seam existed, so the morph capture and every existing test read the
   * same DOM. A glyph writes ONE attribute where they write two.
   *
   * @param {SVGElement} node @param {UnitMarkSpec} spec
   * @param {number} x @param {number} y
   */
  _place(node, spec, x, y) {
    const s = (
      /** @type {any} */
      spec
    );
    if (s.pk === PK_GLYPH) {
      node.setAttribute(
        "transform",
        "translate(" + (x - s.ox) + "," + (y - s.oy) + s.tail
      );
    } else if (s.pk === PK_CORNER) {
      node.setAttribute("x", String(x - s.hx));
      node.setAttribute("y", String(y - s.hy));
    } else {
      node.setAttribute("cx", String(x));
      node.setAttribute("cy", String(y));
    }
  }
  /**
   * The spec for the chart-wide shape (no pictogram, no per-mark radius).
   * @param {any} opts @param {number} [r]
   * @returns {UnitMarkSpec}
   */
  _baseSpec(opts, r) {
    const rr = r != null ? r : this._lastDotR;
    if (!this._isCorner(opts)) return { pk: PK_CIRCLE, r: rr };
    const { hx, hy } = this._halfExtent(opts, rr);
    return { pk: PK_CORNER, hx, hy, r: rr };
  }
  /**
   * Resolve whatever `pictogram.mark` / `datum.mark` held into a mark
   * definition, or null. A name goes through the registry; an object or a bare
   * path string is taken as-is.
   *
   * An unresolvable mark warns ONCE per name and falls back rather than
   * dropping the unit: a typo should cost you the glyph, not the data point.
   *
   * @param {any} ref @returns {any|null}
   */
  _resolveMark(ref) {
    if (ref == null) return null;
    if (typeof ref === "object") return normalizeUnitMark(ref);
    if (typeof ref !== "string" || !ref) return null;
    const s = ref.trim();
    if (s[0] === "M" || s[0] === "m") return normalizeUnitMark(s);
    const found = getUnitMark(s);
    if (found) return found;
    if (!this._markWarned) this._markWarned = /* @__PURE__ */ new Set();
    if (!this._markWarned.has(s)) {
      this._markWarned.add(s);
      console.warn(
        `[ApexCharts] unit chart: no mark named "${s}" is registered. Register one with ApexCharts.registerUnitMark("${s}", pathData), or import a catalog from 'apexcharts/pictograms'.`
      );
    }
    return null;
  }
  /**
   * The draw spec for one glyph at the current lattice pitch, cached per
   * (mark, radius) for the render so thousands of units of one glyph resolve
   * once and then share both the spec and the `d` STRING.
   *
   * The scale lives in the transform rather than being baked into `d`, for two
   * reasons: baking needs a full path parser at runtime (the unit-shapes one
   * lives in a separate optional module, and arcs cannot be scaled by naive
   * number substitution), and a constant `scale(s)` costs the same single
   * attribute write per frame that a bare translate would.
   *
   * Sizing is derived from `dotR` - the radius the LAYOUT chose - so a glyph
   * occupies the box the dot itself would have. Swapping `circle` for a
   * pictogram therefore never re-flows the chart: same pitch, same slots.
   *
   * @param {any} mark @param {number} dotR @param {any} pcfg
   * @returns {UnitMarkSpec}
   */
  _glyphSpec(mark, dotR, pcfg) {
    const qr = Math.round(dotR * 10) / 10;
    const key = mark.name + "|" + mark.path.length + "|" + qr;
    const hit = this._specCache.get(key);
    if (hit) return hit;
    const vb = mark.viewBox || [0, 0, 100, 100];
    const pad = Math.max(0, Math.min(0.9, pcfg.padding || 0));
    const grow = typeof pcfg.scale === "number" && pcfg.scale > 0 ? pcfg.scale : 1;
    const box = 2 * qr * (1 - pad) * grow;
    const s = pcfg.fit === "width" ? box / vb[2] : pcfg.fit === "height" ? box / vb[3] : box / Math.max(vb[2], vb[3]);
    const spec = Object.freeze({
      pk: PK_GLYPH,
      mark,
      d: mark.path,
      fillRule: mark.fillRule,
      s,
      ox: (vb[0] + vb[2] / 2) * s,
      oy: (vb[1] + vb[3] / 2) * s,
      tail: ") scale(" + s + ")",
      r: qr
    });
    this._specCache.set(key, spec);
    return spec;
  }
  /**
   * Which mark THIS unit draws.
   *
   * Precedence mirrors how `datum.fillColor` already overrides the category
   * colour: the datum's own `mark` first (a per-unit override, so one crowd can
   * mix glyphs), then the per-series entry of a `mark` array, then the one
   * chart-wide mark.
   *
   * @param {any} opts @param {any} datum @param {number} i @param {number} r
   * @returns {UnitMarkSpec}
   */
  _markSpecFor(opts, datum, i, r) {
    if (opts.shape !== "pictogram") return this._baseSpec(opts, r);
    const pcfg = opts.pictogram || {};
    const own = datum && typeof datum === "object" ? datum.mark : void 0;
    const cfg = Array.isArray(pcfg.mark) ? pcfg.mark[i % pcfg.mark.length] : pcfg.mark;
    const mark = this._resolveMark(own != null ? own : cfg);
    if (mark) return this._glyphSpec(mark, r, pcfg);
    return this._baseSpec(
      __spreadProps(__spreadValues({}, opts), { shape: pcfg.fallback === "square" ? "square" : "circle" }),
      r
    );
  }
  /**
   * Draw one dot (circle, square, or image icon) with the category fill +
   * stroke, tagged so the shared non-axis tooltip and hover reuse work.
   * @param {Graphics} graphics @param {any} opts @param {number} dotR
   * @param {string} color @param {number} i @param {number} j
   * @param {UnitMarkSpec} [spec] this mark's resolved spec; defaults to the
   *   chart-wide shape
   * @returns {any}
   */
  _drawDot(graphics, opts, dotR, color, i, j, spec) {
    const w2 = this.w;
    const strokeW = w2.config.stroke.show ? w2.config.stroke.width : 0;
    const strokeColor = Array.isArray(w2.globals.stroke.colors) ? w2.globals.stroke.colors[i] || "none" : "none";
    const fillOpacity = typeof w2.config.fill.opacity === "number" ? w2.config.fill.opacity : 1;
    let el;
    if (spec && spec.pk === PK_GLYPH) {
      el = w2.dom.Paper.path(spec.d);
      el.node.setAttribute("fill", color);
      if (spec.fillRule === "evenodd") {
        el.node.setAttribute("fill-rule", "evenodd");
      }
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
      el.node.setAttribute("data:r", String(spec.r));
    } else if (opts.shape === "image" && opts.image && opts.image.src) {
      const iw = opts.image.width || 20;
      const ih = opts.image.height || 20;
      el = w2.dom.Paper.image(opts.image.src);
      el.node.setAttribute("width", String(iw));
      el.node.setAttribute("height", String(ih));
      el.node.setAttribute("preserveAspectRatio", "xMidYMid meet");
      if (opts.image.tint) {
        el.node.setAttribute("filter", `url(#${this._tintFilter(color)})`);
      }
    } else if (opts.shape === "square") {
      const side = dotR * 2;
      el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, color, 1, strokeW, strokeColor);
      el.node.setAttribute("fill", color);
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
    } else {
      el = graphics.drawCircle(dotR, {
        fill: color,
        "stroke-width": strokeW,
        stroke: strokeColor
      });
      el.node.setAttribute("fill", color);
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
    }
    el.node.classList.add("apexcharts-unit-area");
    el.node.setAttribute("i", String(i));
    el.node.setAttribute("j", String(j));
    return el;
  }
  /**
   * Ensure (once per colour) an SVG recolour filter exists in the chart's defs
   * and return its id. The filter floods `color` and clips it to the source
   * graphic's alpha (feComposite operator="in"), so an `<image>` referencing a
   * monochrome icon is repainted in `color` while keeping its silhouette. Reused
   * across every dot of the same colour.
   * @param {string} color @returns {string}
   */
  _tintFilter(color) {
    const w2 = this.w;
    const NS = "http://www.w3.org/2000/svg";
    const safe = String(color).replace(/[^a-zA-Z0-9]/g, "");
    const id = `apexcharts-unit-tint-${w2.globals.chartID}-${safe}`;
    const svg = w2.dom.Paper.node;
    if (svg.querySelector(`#${id}`)) return id;
    let defs = svg.querySelector("defs");
    if (!defs) {
      defs = BrowserAPIs.createElementNS(NS, "defs");
      svg.insertBefore(defs, svg.firstChild);
    }
    const filter = BrowserAPIs.createElementNS(NS, "filter");
    filter.setAttribute("id", id);
    filter.setAttribute("x", "0%");
    filter.setAttribute("y", "0%");
    filter.setAttribute("width", "100%");
    filter.setAttribute("height", "100%");
    const flood = BrowserAPIs.createElementNS(NS, "feFlood");
    flood.setAttribute("flood-color", color);
    flood.setAttribute("result", "flood");
    const comp = BrowserAPIs.createElementNS(NS, "feComposite");
    comp.setAttribute("in", "flood");
    comp.setAttribute("in2", "SourceAlpha");
    comp.setAttribute("operator", "in");
    filter.appendChild(flood);
    filter.appendChild(comp);
    defs.appendChild(filter);
    return id;
  }
  /**
   * Position a non-animated dot at (x, y). Circles use cx/cy at the centre;
   * corner shapes (square, image) use x/y at the top-left; a pictogram rides a
   * transform. Callers that already hold the mark's spec pass it; the rest get
   * the chart-wide one.
   * @param {SVGElement} node @param {any} opts @param {number} x @param {number} y
   * @param {UnitMarkSpec} [spec]
   */
  _placeDot(node, opts, x, y, spec) {
    this._place(node, spec || this._baseSpec(opts), x, y);
  }
  /**
   * Parse a `#rgb` / `#rrggbb` / `rgb()` / `rgba()` colour to `[r, g, b]`, or
   * null if it cannot be parsed (the colour tween is then skipped).
   * @param {string} str @returns {number[] | null}
   */
  _rgb(str) {
    if (typeof str !== "string") return null;
    let s = str.trim();
    if (s[0] === "#") {
      if (s.length === 4) s = "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
      const n = parseInt(s.slice(1, 7), 16);
      if (isNaN(n)) return null;
      return [n >> 16 & 255, n >> 8 & 255, n & 255];
    }
    const m2 = s.match(/rgba?\(([^)]+)\)/);
    if (m2) {
      const p2 = m2[1].split(",").map((x) => parseFloat(x));
      if (p2.length >= 3 && p2.every((v2) => !isNaN(v2))) return [p2[0], p2[1], p2[2]];
    }
    return null;
  }
  /**
   * Whether to run the gather / transition animation. Runs on the initial mount
   * and on data-driven updates (keyed old->new tween or cross-type burst).
   * Skipped: in SSR, when animations are off, when the caller passed
   * `animate:false` (shouldAnimate === false), on a PURE window resize (resized
   * with no data change - re-gathering on every resize would be jarring), and
   * when the user prefers reduced motion.
   *
   * Note: `w.globals.resized` is set true on every update (not just window
   * resize), so it must be paired with `!dataChanged` to isolate a real resize.
   * @returns {boolean}
   */
  _shouldAnimate() {
    const w2 = this.w;
    const anim = w2.config.chart.animations;
    if (!Environment.isBrowser()) return false;
    if (!anim || anim.enabled === false) return false;
    if (w2.globals.shouldAnimate === false) return false;
    if (w2.globals.resized && !w2.globals.dataChanged) return false;
    if (anim.respectReducedMotion && prefersReducedMotion()) return false;
    return true;
  }
  /**
   * Give every dot an x/y spring, reusing the live springs of a gather this
   * render just cancelled.
   *
   * The reuse is the whole point of the spring path. A carried spring holds a
   * dot's real on-screen position AND its velocity, so an interrupted gather
   * resumes from there. Without it the dot restarts from `cx0`, which on an
   * update is the slot it was still travelling towards - so every interruption
   * teleports it forward and then re-animates from a standstill. A dragged
   * slider or a scrubbed storyboard interrupts on almost every frame, which is
   * where that reads worst.
   *
   * Springs left over from a completed gather are at rest on their targets, so
   * carrying them is identical to making fresh ones. Only an interrupted flight
   * carries anything.
   *
   * @param {UnitAnimDot[]} dots
   * @param {any} gcfg plotOptions.unit.gather
   * @param {number} speed chart.animations.speed, in ms
   */
  _seedSprings(dots, gcfg, speed) {
    const [stiffness, damping] = springParams(gcfg.spring, speed);
    const live = this.ctx ? this.ctx._unitSprings : null;
    const springs = /* @__PURE__ */ new Map();
    for (let k = 0; k < dots.length; k++) {
      const d = dots[k];
      const carried = live && !d.isEnter && d.key != null ? live.get(d.key) : null;
      const sx = carried ? carried.x : v(d.cx0, stiffness, damping);
      const sy = carried ? carried.y : v(d.cy0, stiffness, damping);
      if (carried) {
        sx.stiffness = stiffness;
        sy.stiffness = stiffness;
        sx.damping = damping;
        sy.damping = damping;
        d.cx0 = sx.value;
        d.cy0 = sy.value;
        this._place(d.node, d.spec, d.cx0, d.cy0);
        if (sx.velocity !== 0 || sy.velocity !== 0) d.delay = 0;
      }
      d.sx = sx;
      d.sy = sy;
      if (d.key != null) springs.set(d.key, { x: sx, y: sy });
    }
    if (this.ctx) this.ctx._unitSprings = springs;
  }
  /**
   * One rAF loop that tweens every dot from its start (cx0/cy0 - either the
   * cluster centre on first mount / for entering dots, or its previous slot on
   * an update) to its target slot, staggered by index. Entering dots fade in;
   * moving dots stay opaque. Dots whose group colour changed (a 'flow' regroup)
   * cross-fade their fill from the old colour to the new one over the same ease;
   * dots whose radius changed (bubble sizing) grow/shrink over it too (circles).
   *
   * Position travels on a spring by default (`gather.motion`), so a gather
   * interrupted by the next render resumes from where the dots actually are,
   * carrying their velocity, rather than restarting from a standstill. Colour,
   * radius and opacity stay on a fixed-duration ease either way: those are 0..1
   * quantities, and the shared solver's rest thresholds are absolute (0.05 in
   * caller units), which is negligible for pixels but 5% of a unit interval.
   * @param {UnitAnimDot[]} dots
   */
  _runGather(dots) {
    const w$1 = this.w;
    const opts = w$1.config.plotOptions.unit;
    const speed = Math.max(1, w$1.config.chart.animations.speed || 800);
    const maxDelay = Math.min(speed * 0.6, 450);
    const n = dots.length;
    for (let k = 0; k < n; k++) {
      dots[k].delay = n > 1 ? k / (n - 1) * maxDelay : 0;
    }
    const gcfg = opts.gather || {};
    const motion = gcfg.motion || "auto";
    const useSpring = motion === "spring" || motion === "auto" && (!gcfg.easing || gcfg.easing === "outCubic");
    if (useSpring) this._seedSprings(dots, gcfg, speed);
    else if (this.ctx) this.ctx._unitSprings = null;
    for (let k = 0; k < n; k++) {
      const d = dots[k];
      if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
        d.node.setAttribute("r", String(d.r0));
      }
    }
    for (let k = 0; k < n; k++) {
      const d = dots[k];
      if (d.fill0 && d.fill1 && d.fill0 !== d.fill1) {
        d._c0 = this._rgb(d.fill0);
        d._c1 = this._rgb(d.fill1);
      }
    }
    const easePos = gcfg.easing === "outBack" ? easeOutBack(typeof gcfg.overshoot === "number" ? gcfg.overshoot : 1.70158) : gcfg.easing === "inOutCubic" ? easeInOutCubic : easeOutCubic;
    if (this.w.globals.unitGatherRAF != null) {
      BrowserAPIs.cancelAnimationFrame(this.w.globals.unitGatherRAF);
      this.w.globals.unitGatherRAF = null;
    }
    const start = performance.now();
    let last = start;
    const stepFn = (now) => {
      if (this.w.globals.isDestroyed) {
        this.w.globals.unitGatherRAF = null;
        this.w.globals.animationEnded = true;
        return;
      }
      const dt = Math.min(MAX_FRAME_STEP, Math.max(0, (now - last) / 1e3));
      last = now;
      let done = true;
      for (let k = 0; k < n; k++) {
        const d = dots[k];
        const elapsed = now - start - d.delay;
        const t = Math.max(0, Math.min(1, elapsed / speed));
        const ec = easeOutCubic(t);
        let cx, cy;
        if (d.sx && d.sy) {
          if (elapsed >= 0 && !d.released) {
            w(d.sx, d.x);
            w(d.sy, d.y);
            d.released = true;
          }
          const restX = b(d.sx, dt);
          const restY = b(d.sy, dt);
          if (!d.released || !restX || !restY) done = false;
          cx = d.sx.value;
          cy = d.sy.value;
        } else {
          const e = easePos(t);
          cx = d.cx0 + (d.x - d.cx0) * e;
          cy = d.cy0 + (d.y - d.cy0) * e;
        }
        this._place(d.node, d.spec, cx, cy);
        if (d.isEnter) d.node.style.opacity = String(Math.min(1, t * 2.5));
        if (d._c0 && d._c1) {
          const cr = Math.round(d._c0[0] + (d._c1[0] - d._c0[0]) * ec);
          const cg = Math.round(d._c0[1] + (d._c1[1] - d._c0[1]) * ec);
          const cb = Math.round(d._c0[2] + (d._c1[2] - d._c0[2]) * ec);
          d.node.setAttribute("fill", `rgb(${cr},${cg},${cb})`);
        }
        if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
          d.node.setAttribute("r", String(d.r0 + (d.r1 - d.r0) * ec));
        }
        if (t < 1) done = false;
      }
      if (done) {
        for (let k = 0; k < n; k++) {
          const d = dots[k];
          d.node.style.opacity = "";
          if (d._c1 && d.fill1) d.node.setAttribute("fill", d.fill1);
          if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
            d.node.setAttribute("r", String(d.r1));
          }
        }
        this.w.globals.unitGatherRAF = null;
        this.w.globals.animationEnded = true;
      } else {
        this.w.globals.unitGatherRAF = BrowserAPIs.requestAnimationFrame(stepFn);
      }
    };
    this.w.globals.unitGatherRAF = BrowserAPIs.requestAnimationFrame(stepFn);
  }
  /**
   * Keys present in the previous render but not the current one, resolved back
   * to their old slot {x, y, fill}. These are the dots that must animate out.
   * @param {Map<string, {x:number,y:number,fill:string,r?:number,spec?:any}>} prev
   * @param {Map<string, {x:number,y:number,fill:string,r?:number,spec?:any}>} nextPrev
   * @param {any} opts
   * @returns {{x:number,y:number,fill:string,r?:number,spec?:any}[]}
   */
  _collectExits(prev, nextPrev, opts) {
    const cap = Math.max(0, opts.maxUnits || 5e3);
    const exits = [];
    for (const [key, slot] of prev) {
      if (!nextPrev.has(key)) {
        exits.push(slot);
        if (exits.length >= cap) break;
      }
    }
    return exits;
  }
  /**
   * Animate the exit ghosts out, then remove them. Layouts whose positions carry
   * data (a waffle / grid lattice, or a scatter / beeswarm on real axes) fade
   * their ghosts OUT IN PLACE - drifting them toward the plot centre would drag
   * cells across tiles or bubbles across the plane, which reads as wrong. The
   * blob / bar layouts keep the gentle inward collapse so a removal reads as
   * motion rather than a pop.
   * @param {any} group @param {{x:number,y:number,fill:string,r?:number,spec?:any}[]} exits @param {any} opts
   */
  _runExits(group, exits, opts) {
    const w2 = this.w;
    const graphics = new Graphics(w2, this.ctx);
    const dotR = this._lastDotR;
    const cx = w2.layout.gridWidth / 2;
    const cy = w2.layout.gridHeight / 2;
    const drift = opts.layout === "grid" || opts.layout === "scatter" || opts.layout === "arc" || opts.layout === "custom" ? 0 : 0.35;
    const ghosts = [];
    exits.forEach((slot) => {
      const r = slot.r != null ? slot.r : dotR;
      const spec = slot.spec || this._baseSpec(opts, r);
      const el = this._drawDot(graphics, opts, r, slot.fill, 0, 0, spec);
      el.node.classList.add("apexcharts-unit-exit");
      this._place(el.node, spec, slot.x, slot.y);
      group.add(el);
      ghosts.push({ node: el.node, x0: slot.x, y0: slot.y, spec });
    });
    if (!this._shouldAnimate()) {
      ghosts.forEach((g2) => g2.node.remove());
      return;
    }
    const speed = Math.max(1, w2.config.chart.animations.speed || 800);
    if (this.w.globals.unitExitRAF != null) {
      BrowserAPIs.cancelAnimationFrame(this.w.globals.unitExitRAF);
      this.w.globals.unitExitRAF = null;
    }
    const start = performance.now();
    const stepFn = (now) => {
      if (this.w.globals.isDestroyed) {
        this.w.globals.unitExitRAF = null;
        return;
      }
      const t = Math.max(0, Math.min(1, (now - start) / speed));
      const e = easeOutCubic(t);
      for (let k = 0; k < ghosts.length; k++) {
        const g2 = ghosts[k];
        if (drift) {
          const x = g2.x0 + (cx - g2.x0) * e * drift;
          const y = g2.y0 + (cy - g2.y0) * e * drift;
          this._place(g2.node, g2.spec, x, y);
        }
        g2.node.style.opacity = String(1 - e);
      }
      if (t < 1) {
        this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn);
      } else {
        this.w.globals.unitExitRAF = null;
        group.node && group.node.remove();
      }
    };
    this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn);
  }
  /**
   * Are outer (name) labels on? Only for `layout: 'custom'`: they name a colour
   * BAND, so they need categories that occupy their own part of the shape. The
   * generated layouts (`packed`, `grid`) interleave categories, and the blob /
   * bar / arc layouts already carry a label of their own.
   * @param {any} opts
   */
  _outerLabelsOn(opts) {
    const cfg = opts.clusterLabels;
    return !!(opts.layout === "custom" && cfg && cfg.show !== false && cfg.external && cfg.external.show);
  }
  /**
   * One outer label's text, as lines. Two lines by default (name, then share),
   * which is what makes the label readable at a distance from the band it names.
   * A `clusterLabels.formatter` may return "\n"-separated text to control the
   * split, or a single line.
   * @param {number} i @param {number} value @param {number} total @param {any} opts
   * @returns {string[]}
   */
  _outerLabelLines(i, value, total, opts) {
    const w2 = this.w;
    const name = w2.seriesData.seriesNames[i] || `series-${i + 1}`;
    const percent = total > 0 ? value / total * 100 : 0;
    const cfg = opts.clusterLabels;
    const text = typeof cfg.formatter === "function" ? cfg.formatter(name, { seriesIndex: i, value, percent, w: w2 }) : `${name}
${percent.toFixed(1)}%`;
    return String(text).split("\n");
  }
  /**
   * Room one side has to give up: the widest label, plus the leader line, plus a
   * little air. Capped at a quarter of the plot so one long category name shrinks
   * its own label into the gutter instead of starving the shape.
   * @param {number[]} counts @param {any} opts
   * @returns {number}
   */
  _outerLabelGutter(counts, opts) {
    const w2 = this.w;
    const cfg = opts.clusterLabels;
    const conn = cfg.external.connector || {};
    const total = counts.reduce((a, b2) => a + b2, 0);
    const lines = [];
    counts.forEach((c, i) => {
      if (c > 0) lines.push(...this._outerLabelLines(i, c, total, opts));
    });
    if (!lines.length) return 0;
    const width = measureLabelWidth(w2, lines, {
      fontSize: cfg.fontSize,
      fontFamily: cfg.fontFamily || w2.config.chart.fontFamily
    });
    const gap = conn.gap != null ? conn.gap : 8;
    const length = conn.length != null ? conn.length : 22;
    const room = width + gap + length + 8 + Math.abs(parseFloat(cfg.external.offsetX) || 0);
    return Math.min(room, w2.layout.gridWidth * 0.25);
  }
  /**
   * Plan and draw the outer labels. A band's anchor is one of its own dots - the
   * outermost on the label's side, preferring dots near the band's middle - so
   * the leader line lands on the crowd rather than on a bounding box the viewer
   * cannot see.
   *
   * Sides: a silhouette ordered by rows stacks its categories vertically, so
   * their centroids share an x and the labels have to alternate left/right down
   * the shape. One ordered by columns spreads them horizontally, so each label
   * goes to the side its band is already on.
   *
   * @param {any} ret @param {{ i:number, cx:number, cy:number, dots:{x:number,y:number,r?:number}[] }[]} clusters
   * @param {number[]} counts @param {number} total @param {any} opts
   * @param {boolean} gathering true only when the dots are flying in from the
   *   centre (first render / cross-type morph). On an update the crowd is already
   *   on screen, so the labels must not wait for anything.
   */
  _drawOuterLabels(ret, clusters, counts, total, opts, gathering) {
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const cfg = opts.clusterLabels;
    const ext = cfg.external;
    const conn = ext.connector || {};
    const gap = conn.gap != null ? conn.gap : 8;
    const length = conn.length != null ? conn.length : 22;
    const offsetX = parseFloat(ext.offsetX) || 0;
    const offsetY = parseFloat(ext.offsetY) || 0;
    const gw = w2.layout.gridWidth;
    const gh = w2.layout.gridHeight;
    const dotR = this._lastDotR;
    const live = clusters.filter((c) => c.dots.length > 0);
    if (!live.length) return;
    let spreadX = 0;
    let spreadY = 0;
    if (live.length > 1) {
      const xs = live.map((c) => c.cx);
      const ys = live.map((c) => c.cy);
      spreadX = Math.max(...xs) - Math.min(...xs);
      spreadY = Math.max(...ys) - Math.min(...ys);
    }
    const bandedByX = spreadX > spreadY;
    const fontSize = parseFloat(cfg.fontSize) || 13;
    const lineHeight = Math.round(fontSize * 1.35);
    const items = [];
    live.slice().sort((a, b2) => a.cy - b2.cy).forEach((c, k) => {
      const lines = this._outerLabelLines(c.i, counts[c.i], total, opts);
      if (!lines.some((l) => l !== "")) return;
      const side = bandedByX ? c.cx >= gw / 2 ? "right" : "left" : k % 2 === 0 ? "right" : "left";
      const dir = side === "right" ? 1 : -1;
      let best = c.dots[0];
      let bestScore = -Infinity;
      c.dots.forEach((d) => {
        const score = dir * d.x - 0.75 * Math.abs(d.y - c.cy);
        if (score > bestScore) {
          bestScore = score;
          best = d;
        }
      });
      const anchor = { x: best.x + dir * (best.r || dotR), y: best.y };
      const elbow = { x: anchor.x + dir * gap, y: anchor.y };
      items.push({
        i: c.i,
        lines,
        anchor,
        elbow,
        labelX: elbow.x + dir * length + offsetX,
        idealY: anchor.y + offsetY,
        labelY: anchor.y + offsetY,
        side
      });
    });
    if (!items.length) return;
    const maxLines = items.reduce((m2, it) => Math.max(m2, it.lines.length), 1);
    const block = maxLines * lineHeight;
    const half = block / 2;
    ["left", "right"].forEach((side) => {
      spaceOutLabels(
        items.filter((it) => it.side === side),
        block + 2,
        gh - half,
        half
      );
    });
    const group = new Graphics(w2, this.ctx).group({
      class: "apexcharts-unit-outer-labels"
    });
    if (gathering) {
      const speed = Math.max(1, w2.config.chart.animations.speed || 800);
      group.node.classList.add("apexcharts-unit-label-delay");
      group.node.style.animationDelay = `${Math.min(speed * 0.45, 600) / 1e3}s`;
    }
    items.forEach((it) => {
      const color = w2.globals.colors[it.i] || w2.globals.colors[0] || "#008FFB";
      group.add(
        drawOuterLabel(w2, {
          lines: it.lines,
          lineHeight,
          anchor: it.anchor,
          elbow: it.elbow,
          labelX: it.labelX,
          labelY: it.labelY,
          side: it.side,
          connector: {
            show: conn.show !== false,
            width: conn.width != null ? conn.width : 1.5,
            color: conn.color || color
          },
          style: {
            fontSize: cfg.fontSize,
            fontFamily: cfg.fontFamily || w2.config.chart.fontFamily,
            fontWeight: cfg.fontWeight
          },
          foreColor: cfg.color || w2.config.chart.foreColor,
          groupClass: "apexcharts-unit-outer-label-group",
          textClass: "apexcharts-unit-outer-label",
          connectorClass: "apexcharts-unit-label-connector"
        })
      );
    });
    ret.add(group);
  }
  /**
   * A cluster label placed above (default) or below the cluster/bar. A TOP label
   * over a wide grouped/packed blob rides a curved arc (invisible arc path +
   * <textPath>, centred at 50% offset); a bottom label, a 'columns' bar, or a
   * cluster too small for the arc gets a straight centred label instead.
   * `clusterLabels.position` = 'top' | 'bottom'; `offsetY` pushes it further from
   * the blob in either direction.
   * @param {any} elSeries @param {{ i:number, cx:number, cy:number, outerR:number, flat?:boolean }} cluster
   * @param {number} value @param {number} total @param {any} opts @param {string} color
   */
  _drawClusterLabel(elSeries, cluster, value, total, opts, color) {
    const w2 = this.w;
    if (!Environment.isBrowser()) return;
    const NS = "http://www.w3.org/2000/svg";
    const name = w2.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`;
    const percent = total > 0 ? value / total * 100 : 0;
    const cfg = opts.clusterLabels;
    const fontSize = parseFloat(cfg.fontSize) || 13;
    let text;
    if (typeof cfg.formatter === "function") {
      text = cfg.formatter(name, {
        seriesIndex: cluster.i,
        value,
        percent,
        w: w2
      });
    } else {
      text = `${name} (${percent.toFixed(1)}%)`;
    }
    const str = typeof text === "string" ? text : String(text);
    const textEl = BrowserAPIs.createElementNS(NS, "text");
    textEl.setAttribute("class", "apexcharts-unit-label");
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("font-size", `${fontSize}px`);
    textEl.setAttribute("font-family", cfg.fontFamily || w2.config.chart.fontFamily || "inherit");
    textEl.setAttribute("font-weight", String(cfg.fontWeight || 600));
    textEl.setAttribute("fill", cfg.color || color);
    const bottom = cfg.position === "bottom";
    const R = cluster.outerR + fontSize * 0.6 + 3 + (cfg.offsetY || 0);
    const estWidth = str.length * fontSize * 0.55;
    const curved = !bottom && !cluster.flat && cfg.curved !== false && estWidth <= Math.PI * R * 0.95;
    if (curved) {
      const yMid = cluster.cy;
      const x1 = cluster.cx - R;
      const x2 = cluster.cx + R;
      const d = `M ${x1} ${yMid} A ${R} ${R} 0 0 1 ${x2} ${yMid}`;
      const arcId = `apexcharts-unit-label-${w2.globals.chartID}-${cluster.i}`;
      const pathEl = BrowserAPIs.createElementNS(NS, "path");
      pathEl.setAttribute("id", arcId);
      pathEl.setAttribute("d", d);
      pathEl.setAttribute("fill", "none");
      pathEl.setAttribute("stroke", "none");
      const tp = BrowserAPIs.createElementNS(NS, "textPath");
      tp.setAttribute("href", `#${arcId}`);
      tp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${arcId}`);
      tp.setAttribute("startOffset", "50%");
      tp.textContent = str;
      textEl.appendChild(tp);
      elSeries.node.appendChild(pathEl);
    } else {
      textEl.setAttribute("x", String(cluster.cx));
      const y = bottom ? cluster.cy + cluster.outerR + fontSize + 6 + (cfg.offsetY || 0) : cluster.cy - cluster.outerR - 6 - (cfg.offsetY || 0);
      textEl.setAttribute("y", String(y));
      textEl.textContent = str;
    }
    elSeries.node.appendChild(textEl);
  }
}
_core__default.use({
  unit: Unit
});
export {
  default2 as default
};
