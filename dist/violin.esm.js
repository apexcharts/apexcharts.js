/*!
 * ApexCharts v8.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const CoreUtils = _core.__apex_CoreUtils;
const getChartClass = _core.__apex_ChartFactory_getChartClass;
const Fill = _core.__apex_Fill;
const Graphics = _core.__apex_Graphics;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
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
function buildJitterGroups({
  w,
  points,
  seedA,
  seedB,
  center,
  halfExtent,
  alongFn,
  isHorizontal,
  options,
  clampAt,
  sideSign
}) {
  const opts = options;
  if (!opts || opts.show === false) return [];
  if (!points || !points.length) return [];
  const maxPoints = opts.maxPoints || 3e3;
  const stride = points.length > maxPoints ? Math.ceil(points.length / maxPoints) : 1;
  const r = opts.size != null ? opts.size : 2.5;
  const jitterFrac = opts.jitter != null ? opts.jitter : 0.5;
  const jitterPx = halfExtent * jitterFrac;
  const constrain = opts.constrainToViolin !== false && typeof clampAt === "function";
  const isSquare = opts.shape === "square";
  const scale = opts.colorScale;
  const useScale = scale && Array.isArray(scale.colors) && scale.colors.length > 0;
  const steps = useScale ? Math.max(2, scale.steps || 24) : 1;
  const sMin = useScale && scale.min != null ? scale.min : w.globals.minY;
  const sMax = useScale && scale.max != null ? scale.max : w.globals.maxY;
  const span = sMax - sMin || 1;
  const buckets = useScale ? new Array(steps).fill("") : [""];
  for (let k = 0; k < points.length; k += stride) {
    const v = points[k];
    const a = alongFn(v);
    let off = (hash01(seedA * 7919 + seedB * 100003 + k) - 0.5) * 2 * jitterPx;
    if (constrain) {
      const cap = (
        /** @type {(v:number)=>number} */
        clampAt(v)
      );
      if (off > cap) off = cap;
      if (off < -cap) off = -cap;
    }
    if (sideSign) off = Math.abs(off) * sideSign;
    const px = isHorizontal ? a : center + off;
    const py = isHorizontal ? center + off : a;
    const sub = isSquare ? squareSubPath(px, py, r) : circleSubPath(px, py, r);
    if (useScale) {
      let t = (v - sMin) / span;
      if (t < 0) t = 0;
      if (t > 1) t = 1;
      buckets[Math.round(t * (steps - 1))] += sub;
    } else {
      buckets[0] += sub;
    }
  }
  if (!useScale) {
    return buckets[0] ? [{ fill: null, d: buckets[0] }] : [];
  }
  const groups = [];
  for (let b = 0; b < steps; b++) {
    if (!buckets[b]) continue;
    groups.push({
      fill: rampColorAt(scale.colors, b / (steps - 1)),
      d: buckets[b]
    });
  }
  return groups;
}
function renderJitter({
  graphics,
  w,
  elSeries,
  pointsByCat,
  options,
  distributed,
  realIndex,
  wrapClass,
  pointClass
}) {
  if (!options || options.show === false || !pointsByCat.length) return;
  const pOpacity = options.opacity != null ? options.opacity : 0.9;
  const strokeColor = options.strokeColor != null ? options.strokeColor : "#fff";
  const strokeW = options.strokeWidth != null ? options.strokeWidth : 1;
  const willAnimateIn = w.config.chart.animations.enabled && !w.globals.resized && !w.globals.dataChanged;
  const elPointsWrap = graphics.group({
    class: willAnimateIn ? `${wrapClass} apexcharts-element-hidden` : wrapClass
  });
  if (willAnimateIn) {
    w.globals.delayedElements.push({ el: elPointsWrap.node });
  }
  pointsByCat.forEach(({ groups, j }) => {
    const catColor = distributed ? w.globals.colors[j] : w.globals.colors[realIndex];
    const fc = options.fillColor;
    const defaultFill = fc === "series" ? catColor : fc === "series-dark" ? darkenColor(catColor, 0.45) : fc || darkenColor(catColor, 0.45);
    groups.forEach((g) => {
      const elPoints = graphics.drawPath({
        d: g.d,
        fill: g.fill != null ? g.fill : defaultFill,
        stroke: strokeW > 0 ? strokeColor : "none",
        strokeWidth: strokeW,
        fillOpacity: pOpacity,
        classes: pointClass
      });
      elPoints.attr("data:realIndex", realIndex);
      elPoints.attr("j", j);
      elPoints.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      elPoints.node.style.pointerEvents = "none";
      elPointsWrap.add(elPoints);
    });
  });
  elSeries.add(elPointsWrap);
}
function darkenColor(color, amount) {
  const rgb = Utils.parseHex(color);
  if (!rgb) return color;
  const f = Math.max(0, 1 - amount);
  return `rgb(${Math.round(rgb[0] * f)},${Math.round(rgb[1] * f)},${Math.round(rgb[2] * f)})`;
}
function rampColorAt(colors, t) {
  if (!colors.length) return "#000";
  if (colors.length === 1) return colors[0];
  const x = Math.max(0, Math.min(1, t)) * (colors.length - 1);
  const i = Math.floor(x);
  const frac = x - i;
  const c0 = Utils.parseHex(colors[i]) || [0, 0, 0];
  const c1 = Utils.parseHex(colors[Math.min(i + 1, colors.length - 1)]) || c0;
  const mix = (a, b) => Math.round(a + (b - a) * frac);
  return `rgb(${mix(c0[0], c1[0])},${mix(c0[1], c1[1])},${mix(c0[2], c1[2])})`;
}
function hash01(n) {
  let h = (n ^ 2654435769) >>> 0;
  h = Math.imul(h ^ h >>> 16, 73244475);
  h = Math.imul(h ^ h >>> 16, 73244475);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function circleSubPath(px, py, r) {
  return `M ${px - r} ${py} a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 `;
}
function squareSubPath(px, py, r) {
  return `M ${px - r} ${py - r} h ${2 * r} v ${2 * r} h ${-2 * r} z `;
}
const BarBase = (
  /** @type {typeof import('./Bar').default} */
  /** @type {unknown} */
  class {
  }
);
class Violin extends BarBase {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w, ctx, xyRatios) {
    adoptBarRenderer();
    super(w, ctx, xyRatios);
  }
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} [seriesIndex]
   */
  // @ts-ignore -- Violin.draw has extra ctype param compared to Bar.draw
  draw(series, ctype, seriesIndex) {
    var _a, _b, _c;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    this.violinOptions = w.config.plotOptions.violin;
    this.pointsOptions = this.violinOptions.points;
    this.boxOptions = this.violinOptions.box || {};
    this.cloudSign = crossSign(this.violinOptions.side);
    this.rainSign = this.pointsOptions.show === false ? 0 : crossSign(this.pointsOptions.position);
    this.boxShown = this.boxOptions.show === true;
    this.boxFrac = this.boxShown ? laneFrac(this.boxOptions.width, 0.15) : 0;
    this.rainFrac = laneFrac(this.pointsOptions.laneWidth, 0.4);
    this.bandwidthScale = this.violinOptions.bandwidthScale || 1;
    this.normalize = this.violinOptions.normalize || "individual";
    this.distributed = w.config.plotOptions.bar.distributed;
    this.isHorizontal = w.config.plotOptions.bar.horizontal;
    this.coreUtils = new CoreUtils(this.w);
    series = this.coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: "apexcharts-violin-series apexcharts-plot-series"
    });
    for (let i = 0; i < series.length; i++) {
      let x;
      let y;
      const yArrj = [];
      const xArrj = [];
      const realIndex = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: "apexcharts-series",
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        rel: i + 1,
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex);
      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1;
      }
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = /** @type {any} */
        w.globals.seriesYAxisReverseMap[realIndex][0];
        translationsIndex = realIndex;
      }
      const initPositions = this.barHelpers.initialPositions(realIndex);
      const {
        y: initY,
        barHeight,
        yDivision,
        zeroW,
        x: initX,
        barWidth,
        xDivision,
        zeroH
      } = initPositions;
      y = initY;
      x = initX;
      xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      this.seriesMaxWeight = 0;
      if (this.normalize === "group") {
        const dens = w.violinData.seriesViolinDensity[realIndex] || [];
        dens.forEach((d) => {
          if (d && d.maxWeight > this.seriesMaxWeight) {
            this.seriesMaxWeight = d.maxWeight;
          }
        });
      }
      const pointsByViolin = [];
      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        const paths = this.isHorizontal ? this.drawHorizontalViolin({
          indexes: { i, j, realIndex, translationsIndex },
          y,
          yDivision,
          barHeight,
          zeroW
        }) : this.drawVerticalViolin({
          indexes: { i, j, realIndex, translationsIndex },
          x,
          xDivision,
          barWidth,
          zeroH
        });
        x = paths.x;
        y = paths.y;
        if (j > 0) {
          xArrj.push(paths.center);
        }
        yArrj.push(paths.alongRepresentative);
        const pointGroups = this.buildPointsSubPath({
          realIndex,
          j,
          center: paths.center,
          halfExtent: paths.halfExtent,
          alongFn: paths.alongFn,
          density: paths.density,
          maxWeight: paths.maxWeight,
          cloudBase: paths.cloudBase,
          cloudMaxPx: paths.cloudMaxPx,
          rainCenter: paths.rainCenter,
          rainHalfPx: paths.rainHalfPx
        });
        if (pointGroups.length) pointsByViolin.push({ groups: pointGroups, j });
        const pathFill = fill.fillPath({
          // distributed → color per category (data point) instead of per series
          seriesNumber: this.distributed ? j : realIndex,
          dataPointIndex: j,
          color: this.distributed ? w.globals.colors[j] : void 0,
          value: series[i][j]
        });
        this.renderSeries({
          realIndex,
          pathFill,
          lineFill: w.globals.stroke.colors[realIndex],
          j,
          i,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          columnGroupIndex,
          barHeight,
          barWidth,
          elDataLabelsWrap,
          visibleSeries: this.visibleI,
          type: "violin"
        });
        const bodyEl = elSeries.node.querySelector(
          `path.apexcharts-violin-area[j='${j}']`
        );
        if (bodyEl && isFinite(paths.alongRepresentative)) {
          bodyEl.setAttribute(
            this.isHorizontal ? "cx" : "cy",
            `${paths.alongRepresentative}`
          );
        }
        if (bodyEl) bodyEl.setAttribute("data:center", `${paths.center}`);
        if (paths.boxPaths) {
          const boxStrokeWidth = (_a = this.boxOptions.strokeWidth) != null ? _a : 1;
          paths.boxPaths.forEach((bp) => {
            this.renderSeries({
              realIndex,
              pathFill: bp.filled ? this.boxOptions.fillColor || pathFill : "none",
              lineFill: w.globals.stroke.colors[realIndex],
              j,
              i,
              pathFrom: bp.pathFrom,
              pathTo: bp.pathTo,
              strokeWidth: boxStrokeWidth,
              elSeries,
              x,
              y,
              series,
              columnGroupIndex,
              barHeight,
              barWidth,
              elDataLabelsWrap,
              visibleSeries: this.visibleI,
              type: "violin",
              classes: "apexcharts-raincloud-box"
            });
          });
        }
        const canvasCoords = !bodyEl && ((_c = (_b = w.globals.barCanvasCoords) == null ? void 0 : _b[realIndex]) == null ? void 0 : _c[j]);
        if (canvasCoords && isFinite(paths.alongRepresentative)) {
          if (this.isHorizontal) {
            canvasCoords.cx = paths.alongRepresentative;
          } else {
            canvasCoords.bodyCx = canvasCoords.cx;
            canvasCoords.cx = paths.center;
            canvasCoords.cy = paths.alongRepresentative;
          }
        }
      }
      renderJitter({
        graphics,
        w,
        elSeries,
        pointsByCat: pointsByViolin,
        options: this.pointsOptions,
        distributed: this.distributed,
        realIndex,
        wrapClass: "apexcharts-violin-points-wrap",
        pointClass: "apexcharts-violin-points"
      });
      w.globals.seriesXvalues[realIndex] = xArrj;
      w.globals.seriesYvalues[realIndex] = yArrj;
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, zeroH: any}} opts */
  drawVerticalViolin({ indexes, x, xDivision, barWidth, zeroH }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const { realIndex, j, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    if (w.axisFlags.isXNumeric) {
      x = (w.seriesData.seriesX[realIndex][j] - w.globals.minX) / this.xRatio - barWidth / 2;
    }
    const barXPosition = x + barWidth * this.visibleI;
    const center = barXPosition + barWidth / 2;
    const halfExtent = barWidth / 2;
    const density = this.getDensity(realIndex, j);
    const maxWeight = this.effectiveMaxWeight(density);
    const alongFn = (v) => zeroH - this.logVal(v, realIndex) / yRatio;
    const lanes = resolveLanes({
      halfExtent,
      cloudSign: (_a = this.cloudSign) != null ? _a : 0,
      rainSign: (_b = this.rainSign) != null ? _b : 0,
      boxFrac: (_c = this.boxFrac) != null ? _c : 0,
      rainFrac: (_d = this.rainFrac) != null ? _d : 0
    });
    const cloudBase = center + lanes.cloudBaseOff;
    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center: cloudBase,
      halfExtent: lanes.cloudMaxPx,
      maxWeight,
      vertical: true,
      alongFn,
      collapsed: false,
      sideSign: this.cloudSign
    });
    let pathFrom = null;
    const morphFrom = (_f = (_e = this.ctx) == null ? void 0 : _e.morphTypeChange) == null ? void 0 : _f.getInitialPathFor(realIndex, j);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center: cloudBase,
        halfExtent: lanes.cloudMaxPx,
        maxWeight,
        vertical: true,
        alongFn,
        collapsed: true,
        sideSign: this.cloudSign
      });
    }
    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision;
    }
    return {
      pathTo,
      pathFrom,
      x,
      y: zeroH,
      center,
      halfExtent,
      alongFn,
      density,
      maxWeight,
      cloudBase,
      cloudMaxPx: lanes.cloudMaxPx,
      rainCenter: center + lanes.rainCenterOff,
      rainHalfPx: lanes.rainHalfPx,
      boxPaths: this.buildBoxSubPaths({
        realIndex,
        j,
        boxCenter: center + lanes.boxCenterOff,
        boxHalfPx: lanes.boxHalfPx,
        alongFn,
        vertical: true
      }),
      alongRepresentative: alongFn((_g = this.series[indexes.i][j]) != null ? _g : 0)
    };
  }
  /** @param {{indexes: any, y: any, yDivision: any, barHeight: any, zeroW: any}} opts */
  drawHorizontalViolin({ indexes, y, yDivision, barHeight, zeroW }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const { realIndex, j } = indexes;
    const yRatio = this.invertedYRatio;
    if (w.axisFlags.isXNumeric) {
      y = (w.seriesData.seriesX[realIndex][j] - w.globals.minX) / this.invertedXRatio - barHeight / 2;
    }
    const barYPosition = y + barHeight * this.visibleI;
    const center = barYPosition + barHeight / 2;
    const halfExtent = barHeight / 2;
    const density = this.getDensity(realIndex, j);
    const maxWeight = this.effectiveMaxWeight(density);
    const alongFn = (v) => zeroW + this.logVal(v, realIndex) / yRatio;
    const lanes = resolveLanes({
      halfExtent,
      cloudSign: (_a = this.cloudSign) != null ? _a : 0,
      rainSign: (_b = this.rainSign) != null ? _b : 0,
      boxFrac: (_c = this.boxFrac) != null ? _c : 0,
      rainFrac: (_d = this.rainFrac) != null ? _d : 0
    });
    const cloudBase = center + lanes.cloudBaseOff;
    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center: cloudBase,
      halfExtent: lanes.cloudMaxPx,
      maxWeight,
      vertical: false,
      alongFn,
      collapsed: false,
      sideSign: this.cloudSign
    });
    let pathFrom = null;
    const morphFrom = (_f = (_e = this.ctx) == null ? void 0 : _e.morphTypeChange) == null ? void 0 : _f.getInitialPathFor(realIndex, j);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center: cloudBase,
        halfExtent: lanes.cloudMaxPx,
        maxWeight,
        vertical: false,
        alongFn,
        collapsed: true,
        sideSign: this.cloudSign
      });
    }
    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo,
      pathFrom,
      x: zeroW,
      y,
      center,
      halfExtent,
      alongFn,
      maxWeight,
      density,
      cloudBase,
      cloudMaxPx: lanes.cloudMaxPx,
      rainCenter: center + lanes.rainCenterOff,
      rainHalfPx: lanes.rainHalfPx,
      boxPaths: this.buildBoxSubPaths({
        realIndex,
        j,
        boxCenter: center + lanes.boxCenterOff,
        boxHalfPx: lanes.boxHalfPx,
        alongFn,
        vertical: false
      }),
      alongRepresentative: alongFn((_g = this.series[indexes.i][j]) != null ? _g : 0)
    };
  }
  /**
   * Read the parsed density for one violin and return sorted, de-duplicated
   * nodes (strictly increasing value — a hard requirement for the spline).
   * @param {number} realIndex
   * @param {number} j
   */
  getDensity(realIndex, j) {
    var _a;
    const w = this.w;
    const d = (_a = w.violinData.seriesViolinDensity[realIndex]) == null ? void 0 : _a[j];
    if (!d || !d.values.length) {
      return { nodes: [], maxWeight: 0 };
    }
    const order = d.values.map(
      (_, k) => k
    );
    order.sort(
      (a, b) => d.values[a] - d.values[b]
    );
    const nodes = [];
    let prevV = null;
    for (const k of order) {
      const v = d.values[k];
      if (prevV !== null && v === prevV) continue;
      nodes.push({ v, w: d.weights[k] });
      prevV = v;
    }
    return { nodes, maxWeight: d.maxWeight };
  }
  /**
   * The peak weight used to scale a violin's width: its own ('individual') or
   * the densest violin in the series ('group', preserving relative widths).
   * @param {{maxWeight:number}} density
   */
  effectiveMaxWeight(density) {
    return this.normalize === "group" && this.seriesMaxWeight > 0 ? this.seriesMaxWeight : density.maxWeight;
  }
  /**
   * Build the closed, smooth violin outline. The value axis is the monotonic
   * parameter for the spline (vertical → Y, horizontal → X); the spline is fed
   * with that axis first and the control points swapped back to screen space.
   *
   * Symmetric (`sideSign` 0): the curve mirrors around `center`, whose maximum
   * half-width is `halfExtent`. One-sided (`sideSign` ±1, the raincloud
   * "cloud" / half-violin): `center` is the flat BASELINE, the curve bulges up
   * to `halfExtent` px toward the signed side, and the return edge is a
   * straight run along the baseline.
   *
   * @param {{nodes:{v:number,w:number}[], center:number, halfExtent:number, maxWeight:number, vertical:boolean, alongFn:(v:number)=>number, collapsed:boolean, sideSign?:number}} opts
   */
  buildBodyPath({
    nodes,
    center,
    halfExtent,
    maxWeight,
    vertical,
    alongFn,
    collapsed,
    sideSign = 0
  }) {
    const graphics = new Graphics(this.w);
    if (nodes.length === 0) {
      const a = alongFn(0);
      return vertical ? graphics.move(center, a) + graphics.line(center, a) : graphics.move(a, center) + graphics.line(a, center);
    }
    const wpxOf = (weight) => {
      if (collapsed || maxWeight <= 0) return 0;
      const wp = weight / maxWeight * halfExtent * this.bandwidthScale;
      return Math.min(halfExtent, Math.max(0, wp));
    };
    const rightPts = [];
    const leftPts = [];
    for (let k = 0; k < nodes.length; k++) {
      const a = alongFn(nodes[k].v);
      const wp = wpxOf(nodes[k].w);
      const outer = sideSign === 0 ? center + wp : center + sideSign * wp;
      const inner = sideSign === 0 ? center - wp : center;
      if (vertical) {
        rightPts.push([outer, a]);
        leftPts.push([inner, a]);
      } else {
        rightPts.push([a, outer]);
        leftPts.push([a, inner]);
      }
    }
    leftPts.reverse();
    return this.smoothSegment(rightPts, vertical, false) + this.smoothSegment(leftPts, vertical, true) + "z";
  }
  /**
   * Build the five-number box sub-paths for one category — the raincloud
   * "umbrella", or a violin box overlay. Two sub-paths so each can carry its
   * own fill: the whisker stems + caps (stroke only) and the q1-q3 rect with
   * its median tick (filled). Both are rendered through renderSeries (same
   * `j`, multiple sibling paths — the BoxCandleStick pattern), so they
   * animate and morph like any mark. Deliberately no outlier dots: the
   * rain/jitter layer draws every observation already.
   *
   * Returns null when the box is off or the datum has no summary; entering
   * paths collapse cross-wise onto the box lane's centerline so the box grows
   * sideways in sync with the cloud.
   *
   * @param {{realIndex:number, j:number, boxCenter:number, boxHalfPx:number, alongFn:(v:number)=>number, vertical:boolean}} opts
   * @returns {{pathTo:string, pathFrom:string, filled:boolean}[] | null}
   */
  buildBoxSubPaths({ realIndex, j, boxCenter, boxHalfPx, alongFn, vertical }) {
    var _a, _b;
    const w = this.w;
    if (!this.boxShown || boxHalfPx <= 0) return null;
    const summary = (_a = w.violinData.seriesViolinSummary[realIndex]) == null ? void 0 : _a[j];
    if (!summary) return null;
    const capHalf = boxHalfPx * Math.min(1, Math.max(0, (_b = this.boxOptions.capWidth) != null ? _b : 0.5));
    const [lo, q1, med, q3, hi] = summary.map((v) => alongFn(v));
    const build = (half, boxHalf) => {
      const graphics = new Graphics(this.w);
      const pt = (cross, along) => vertical ? [cross, along] : [along, cross];
      const seg = (pts) => pts.map(
        ([px, py], k) => k === 0 ? graphics.move(px, py) : graphics.line(px, py)
      ).join("");
      const c = boxCenter;
      const whiskers = seg([pt(c, lo), pt(c, q1)]) + seg([pt(c, q3), pt(c, hi)]) + seg([pt(c - half, lo), pt(c + half, lo)]) + seg([pt(c - half, hi), pt(c + half, hi)]);
      const box = seg([
        pt(c - boxHalf, q1),
        pt(c + boxHalf, q1),
        pt(c + boxHalf, q3),
        pt(c - boxHalf, q3)
      ]) + "z" + seg([pt(c - boxHalf, med), pt(c + boxHalf, med)]);
      return { whiskers, box };
    };
    const full = build(capHalf, boxHalfPx);
    const collapsed = build(0, 0);
    const fromFor = (pathTo, collapsedFrom) => {
      let pathFrom = null;
      if (w.globals.previousPaths.length > 0) {
        pathFrom = this.getPreviousPath(realIndex, j, pathTo);
      }
      return pathFrom == null ? collapsedFrom : pathFrom;
    };
    return [
      {
        pathTo: full.whiskers,
        pathFrom: fromFor(full.whiskers, collapsed.whiskers),
        filled: false
      },
      {
        pathTo: full.box,
        pathFrom: fromFor(full.box, collapsed.box),
        filled: true
      }
    ];
  }
  /**
   * Emit one edge as a smooth (monotone-cubic) path segment, or a polyline
   * when there are too few nodes for a spline.
   *
   * @param {[number,number][]} screenPts ordered screen points for this edge
   * @param {boolean} monotonicIsY true when the value axis is vertical
   * @param {boolean} continued false → start with M; true → start with L (joins the previous edge)
   */
  smoothSegment(screenPts, monotonicIsY, continued) {
    const graphics = new Graphics(this.w);
    const first = screenPts[0];
    let d = continued ? graphics.line(first[0], first[1]) : graphics.move(first[0], first[1]);
    const usePolyline = screenPts.length < 3 || !this.strictlyMonotonic(screenPts, monotonicIsY);
    if (usePolyline) {
      for (let k = 1; k < screenPts.length; k++) {
        d += graphics.line(screenPts[k][0], screenPts[k][1]);
      }
      return d;
    }
    const input = screenPts.map(
      ([px, py]) => monotonicIsY ? [py, px] : [px, py]
    );
    const bez = spline.points(input);
    const out = monotonicIsY ? bez.map(swapPairs) : bez;
    d += svgPath(out);
    return d;
  }
  /**
   * @param {[number,number][]} screenPts
   * @param {boolean} monotonicIsY
   */
  strictlyMonotonic(screenPts, monotonicIsY) {
    const axis = monotonicIsY ? 1 : 0;
    for (let k = 1; k < screenPts.length; k++) {
      if (screenPts[k][axis] === screenPts[k - 1][axis]) return false;
    }
    return true;
  }
  /**
   * Build the jitter sub-paths for one violin, grouped for rendering. Returns
   * `[]` when points are hidden or absent. Normally one group (single dot
   * colour); with `points.colorScale` the dots are bucketed by value into shade
   * groups, each carrying its ramp colour. Offsets are a deterministic index
   * hash (SSR-safe); points beyond maxPoints are stride-thinned.
   *
   * Placement: `points.position` 'center' scatters around the slot centerline
   * (clamped to the density width; one-sided bodies scatter one-sided from the
   * baseline). Off-center positions put the dots in their own lane (the
   * raincloud "rain"), where the density clamp no longer applies.
   *
   * @param {{realIndex:number, j:number, center:number, halfExtent:number, alongFn:(v:number)=>number, density:{nodes:{v:number,w:number}[], maxWeight:number}, maxWeight:number, cloudBase:number, cloudMaxPx:number, rainCenter:number, rainHalfPx:number}} opts
   * @returns {{fill:string|null, d:string}[]}
   */
  buildPointsSubPath({
    realIndex,
    j,
    center,
    halfExtent,
    alongFn,
    density,
    maxWeight,
    cloudBase,
    cloudMaxPx,
    rainCenter,
    rainHalfPx
  }) {
    var _a;
    const offsetLane = this.rainSign !== 0;
    const scatterCenter = offsetLane ? rainCenter : this.cloudSign !== 0 ? cloudBase : center;
    const scatterHalf = offsetLane ? rainHalfPx : this.cloudSign !== 0 ? cloudMaxPx : halfExtent;
    return buildJitterGroups({
      w: this.w,
      points: (_a = this.w.violinData.seriesViolinPoints[realIndex]) == null ? void 0 : _a[j],
      seedA: realIndex,
      seedB: j,
      center: scatterCenter,
      halfExtent: scatterHalf,
      alongFn,
      isHorizontal: this.isHorizontal,
      options: this.pointsOptions,
      // Centered dots clamp to the density half-width at each value so they
      // stay inside the shape; a dedicated rain lane has no shape to honor.
      clampAt: offsetLane ? null : (v) => this.halfWidthAtValue(v, density, scatterHalf, maxWeight),
      // A one-sided body folds centered dots onto its side of the baseline.
      sideSign: offsetLane ? 0 : this.cloudSign
    });
  }
  /**
   * Density half-width (pixels) at a given value — used to keep jitter inside
   * the violin. Linear interpolation between the two nearest density nodes.
   * @param {number} value
   * @param {{nodes:{v:number,w:number}[], maxWeight:number}} density
   * @param {number} halfExtent
   * @param {number} [maxWeightOverride] use the group max for 'group' normalize
   */
  halfWidthAtValue(value, density, halfExtent, maxWeightOverride) {
    const { nodes } = density;
    const maxWeight = maxWeightOverride != null ? maxWeightOverride : density.maxWeight;
    if (!nodes.length || maxWeight <= 0) return 0;
    const toPx = (weight) => Math.min(
      halfExtent,
      weight / maxWeight * halfExtent * this.bandwidthScale
    );
    if (value <= nodes[0].v) return toPx(nodes[0].w);
    if (value >= nodes[nodes.length - 1].v)
      return toPx(nodes[nodes.length - 1].w);
    for (let k = 1; k < nodes.length; k++) {
      if (value <= nodes[k].v) {
        const a = nodes[k - 1];
        const b = nodes[k];
        const t = b.v === a.v ? 0 : (value - a.v) / (b.v - a.v);
        return toPx(a.w + (b.w - a.w) * t);
      }
    }
    return 0;
  }
  /**
   * Apply the y-axis log transform to a value when that axis is logarithmic,
   * mirroring BoxCandleStick. Linear axes return the value unchanged.
   * @param {number} value
   * @param {number} realIndex
   */
  logVal(value, realIndex) {
    return (
      /** @type {any} */
      this.coreUtils.getLogValAtSeriesIndex(
        value,
        realIndex
      )
    );
  }
}
function adoptBarRenderer() {
  const Bar = getChartClass("bar");
  if (Object.getPrototypeOf(Violin) === Bar) return;
  Object.setPrototypeOf(Violin, Bar);
  Object.setPrototypeOf(Violin.prototype, Bar.prototype);
}
function swapPairs(arr) {
  const out = [];
  for (let k = 0; k < arr.length; k += 2) {
    out.push(arr[k + 1], arr[k]);
  }
  return out;
}
function crossSign(token) {
  if (token === "right" || token === "bottom") return 1;
  if (token === "left" || token === "top") return -1;
  return 0;
}
function laneFrac(val, fallback) {
  let frac = fallback;
  if (typeof val === "string" && val.trim().endsWith("%")) {
    const n = parseFloat(val);
    if (isFinite(n)) frac = n / 100;
  } else if (typeof val === "number" && isFinite(val)) {
    frac = val;
  }
  return Math.min(0.5, Math.max(0, frac));
}
function resolveLanes({
  halfExtent,
  cloudSign,
  rainSign,
  boxFrac,
  rainFrac
}) {
  const boxHalfPx = boxFrac * halfExtent;
  const rainHalfPx = rainSign === 0 ? halfExtent : rainFrac * halfExtent;
  const rainCenterOff = rainSign === 0 ? 0 : rainSign * (halfExtent - rainHalfPx);
  if (cloudSign === 0) {
    return {
      cloudBaseOff: 0,
      cloudMaxPx: halfExtent,
      boxCenterOff: 0,
      boxHalfPx,
      rainCenterOff,
      rainHalfPx
    };
  }
  const usedRainFrac = rainSign === 0 ? 0 : rainFrac;
  const cloudFrac = Math.max(0, 1 - usedRainFrac - boxFrac);
  const cloudMaxPx = 2 * cloudFrac * halfExtent;
  const cloudBaseOff = cloudSign * (halfExtent - cloudMaxPx);
  return {
    cloudBaseOff,
    cloudMaxPx,
    boxCenterOff: cloudBaseOff - cloudSign * boxHalfPx,
    boxHalfPx,
    rainCenterOff,
    rainHalfPx
  };
}
_core__default.use({
  violin: Violin
});
export {
  default2 as default
};
