var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a2, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a2, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a2, prop, b[prop]);
    }
  return a2;
};
var __spreadProps = (a2, b) => __defProps(a2, __getOwnPropDescs(b));
var __objRest = (source, exclude) => {
  var target2 = {};
  for (var prop in source)
    if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
      target2[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target2[prop] = source[prop];
    }
  return target2;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve2, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e2) {
        reject(e2);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e2) {
        reject(e2);
      }
    };
    var step = (x2) => x2.done ? resolve2(x2.value) : Promise.resolve(x2.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v8.0.0-rc.1
 * (c) 2018-2026 ApexCharts
 */
import ApexCharts$1 from "apexcharts";
import { default as default2 } from "apexcharts";
import * as ApexCharts from "apexcharts/core";
import ApexCharts__default from "apexcharts/core";
const CoreUtils = ApexCharts.__apex_CoreUtils;
const getChartClass = ApexCharts.__apex_ChartFactory_getChartClass;
const Fill = ApexCharts.__apex_Fill;
const Graphics = ApexCharts.__apex_Graphics;
const Series = ApexCharts.__apex_Series;
const Utils = ApexCharts.__apex_Utils;
const tangents = (points) => {
  const m = finiteDifferences(points);
  const n2 = points.length - 1;
  const ε = 1e-6;
  const tgts = [];
  let a2, b, d, s2;
  for (let i2 = 0; i2 < n2; i2++) {
    d = slope(points[i2], points[i2 + 1]);
    if (Math.abs(d) < ε) {
      m[i2] = m[i2 + 1] = 0;
    } else {
      a2 = m[i2] / d;
      b = m[i2 + 1] / d;
      s2 = a2 * a2 + b * b;
      if (s2 > 9) {
        s2 = d * 3 / Math.sqrt(s2);
        m[i2] = s2 * a2;
        m[i2 + 1] = s2 * b;
      }
    }
  }
  for (let i2 = 0; i2 <= n2; i2++) {
    s2 = (points[Math.min(n2, i2 + 1)][0] - points[Math.max(0, i2 - 1)][0]) / (6 * (1 + m[i2] * m[i2]));
    tgts.push([s2 || 0, m[i2] * s2 || 0]);
  }
  return tgts;
};
const svgPath = (points) => {
  let p = "";
  for (let i2 = 0; i2 < points.length; i2++) {
    const point = points[i2];
    const n2 = point.length;
    if (n2 > 4) {
      p += `C${point[0]}, ${point[1]}`;
      p += `, ${point[2]}, ${point[3]}`;
      p += `, ${point[4]}, ${point[5]}`;
    } else if (n2 > 2) {
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
    const t2 = tgts[1];
    const t0 = tgts[0];
    pts.push(p0, [
      p0[0] + t0[0],
      p0[1] + t0[1],
      p[0] - t2[0],
      p[1] - t2[1],
      p[0],
      p[1]
    ]);
    for (let i2 = 2, n2 = tgts.length; i2 < n2; i2++) {
      const p2 = points[i2];
      const t3 = tgts[i2];
      pts.push([p2[0] - t3[0], p2[1] - t3[1], p2[0], p2[1]]);
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
        const n2 = pts[0].length;
        pts[1] = [
          pts[0][n2 - 2] * 2 - pts[0][n2 - 4],
          pts[0][n2 - 1] * 2 - pts[0][n2 - 3]
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
  let i2 = 1;
  for (let n2 = points.length - 1; i2 < n2; i2++) {
    p0 = p1;
    p1 = points[i2 + 1];
    m[i2] = (d + (d = slope(p0, p1))) * 0.5;
  }
  m[i2] = d;
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
  const r2 = opts.size != null ? opts.size : 2.5;
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
  for (let k2 = 0; k2 < points.length; k2 += stride) {
    const v = points[k2];
    const a2 = alongFn(v);
    let off = (hash01(seedA * 7919 + seedB * 100003 + k2) - 0.5) * 2 * jitterPx;
    if (constrain) {
      const cap = (
        /** @type {(v:number)=>number} */
        clampAt(v)
      );
      if (off > cap) off = cap;
      if (off < -cap) off = -cap;
    }
    if (sideSign) off = Math.abs(off) * sideSign;
    const px = isHorizontal ? a2 : center + off;
    const py = isHorizontal ? center + off : a2;
    const sub = isSquare ? squareSubPath(px, py, r2) : circleSubPath(px, py, r2);
    if (useScale) {
      let t2 = (v - sMin) / span;
      if (t2 < 0) t2 = 0;
      if (t2 > 1) t2 = 1;
      buckets[Math.round(t2 * (steps - 1))] += sub;
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
  pointsByCat.forEach(({ groups, j: j2 }) => {
    const catColor = distributed ? w.globals.colors[j2] : w.globals.colors[realIndex];
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
      elPoints.attr("j", j2);
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
function rampColorAt(colors, t2) {
  if (!colors.length) return "#000";
  if (colors.length === 1) return colors[0];
  const x2 = Math.max(0, Math.min(1, t2)) * (colors.length - 1);
  const i2 = Math.floor(x2);
  const frac = x2 - i2;
  const c0 = Utils.parseHex(colors[i2]) || [0, 0, 0];
  const c1 = Utils.parseHex(colors[Math.min(i2 + 1, colors.length - 1)]) || c0;
  const mix2 = (a2, b) => Math.round(a2 + (b - a2) * frac);
  return `rgb(${mix2(c0[0], c1[0])},${mix2(c0[1], c1[1])},${mix2(c0[2], c1[2])})`;
}
function hash01(n2) {
  let h = (n2 ^ 2654435769) >>> 0;
  h = Math.imul(h ^ h >>> 16, 73244475);
  h = Math.imul(h ^ h >>> 16, 73244475);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}
function circleSubPath(px, py, r2) {
  return `M ${px - r2} ${py} a ${r2} ${r2} 0 1 0 ${2 * r2} 0 a ${r2} ${r2} 0 1 0 ${-2 * r2} 0 `;
}
function squareSubPath(px, py, r2) {
  return `M ${px - r2} ${py - r2} h ${2 * r2} v ${2 * r2} h ${-2 * r2} z `;
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
    for (let i2 = 0; i2 < series.length; i2++) {
      let x2;
      let y;
      const yArrj = [];
      const xArrj = [];
      const realIndex = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i2]
      ) : i2;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: "apexcharts-series",
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        rel: i2 + 1,
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex);
      if (series[i2].length > 0) {
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
      x2 = initX;
      xArrj.push(x2 + (barWidth != null ? barWidth : 0) / 2);
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
      for (let j2 = 0; j2 < w.globals.dataPoints; j2++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i2, j2, realIndex);
        const paths = this.isHorizontal ? this.drawHorizontalViolin({
          indexes: { i: i2, j: j2, realIndex, translationsIndex },
          y,
          yDivision,
          barHeight,
          zeroW
        }) : this.drawVerticalViolin({
          indexes: { i: i2, j: j2, realIndex, translationsIndex },
          x: x2,
          xDivision,
          barWidth,
          zeroH
        });
        x2 = paths.x;
        y = paths.y;
        if (j2 > 0) {
          xArrj.push(paths.center);
        }
        yArrj.push(paths.alongRepresentative);
        const pointGroups = this.buildPointsSubPath({
          realIndex,
          j: j2,
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
        if (pointGroups.length) pointsByViolin.push({ groups: pointGroups, j: j2 });
        const pathFill = fill.fillPath({
          // distributed → color per category (data point) instead of per series
          seriesNumber: this.distributed ? j2 : realIndex,
          dataPointIndex: j2,
          color: this.distributed ? w.globals.colors[j2] : void 0,
          value: series[i2][j2]
        });
        this.renderSeries({
          realIndex,
          pathFill,
          lineFill: w.globals.stroke.colors[realIndex],
          j: j2,
          i: i2,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x: x2,
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
          `path.apexcharts-violin-area[j='${j2}']`
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
              j: j2,
              i: i2,
              pathFrom: bp.pathFrom,
              pathTo: bp.pathTo,
              strokeWidth: boxStrokeWidth,
              elSeries,
              x: x2,
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
        const canvasCoords = !bodyEl && ((_c = (_b = w.globals.barCanvasCoords) == null ? void 0 : _b[realIndex]) == null ? void 0 : _c[j2]);
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
  drawVerticalViolin({ indexes, x: x2, xDivision, barWidth, zeroH }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const { realIndex, j: j2, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    if (w.axisFlags.isXNumeric) {
      x2 = (w.seriesData.seriesX[realIndex][j2] - w.globals.minX) / this.xRatio - barWidth / 2;
    }
    const barXPosition = x2 + barWidth * this.visibleI;
    const center = barXPosition + barWidth / 2;
    const halfExtent = barWidth / 2;
    const density = this.getDensity(realIndex, j2);
    const maxWeight = this.effectiveMaxWeight(density);
    const alongFn = (v) => zeroH - this.logVal(v, realIndex) / yRatio;
    const lanes2 = resolveLanes({
      halfExtent,
      cloudSign: (_a = this.cloudSign) != null ? _a : 0,
      rainSign: (_b = this.rainSign) != null ? _b : 0,
      boxFrac: (_c = this.boxFrac) != null ? _c : 0,
      rainFrac: (_d = this.rainFrac) != null ? _d : 0
    });
    const cloudBase = center + lanes2.cloudBaseOff;
    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center: cloudBase,
      halfExtent: lanes2.cloudMaxPx,
      maxWeight,
      vertical: true,
      alongFn,
      collapsed: false,
      sideSign: this.cloudSign
    });
    let pathFrom = null;
    const morphFrom = (_f = (_e = this.ctx) == null ? void 0 : _e.morphTypeChange) == null ? void 0 : _f.getInitialPathFor(realIndex, j2);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j2, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center: cloudBase,
        halfExtent: lanes2.cloudMaxPx,
        maxWeight,
        vertical: true,
        alongFn,
        collapsed: true,
        sideSign: this.cloudSign
      });
    }
    if (!w.axisFlags.isXNumeric) {
      x2 = x2 + xDivision;
    }
    return {
      pathTo,
      pathFrom,
      x: x2,
      y: zeroH,
      center,
      halfExtent,
      alongFn,
      density,
      maxWeight,
      cloudBase,
      cloudMaxPx: lanes2.cloudMaxPx,
      rainCenter: center + lanes2.rainCenterOff,
      rainHalfPx: lanes2.rainHalfPx,
      boxPaths: this.buildBoxSubPaths({
        realIndex,
        j: j2,
        boxCenter: center + lanes2.boxCenterOff,
        boxHalfPx: lanes2.boxHalfPx,
        alongFn,
        vertical: true
      }),
      alongRepresentative: alongFn((_g = this.series[indexes.i][j2]) != null ? _g : 0)
    };
  }
  /** @param {{indexes: any, y: any, yDivision: any, barHeight: any, zeroW: any}} opts */
  drawHorizontalViolin({ indexes, y, yDivision, barHeight, zeroW }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const { realIndex, j: j2 } = indexes;
    const yRatio = this.invertedYRatio;
    if (w.axisFlags.isXNumeric) {
      y = (w.seriesData.seriesX[realIndex][j2] - w.globals.minX) / this.invertedXRatio - barHeight / 2;
    }
    const barYPosition = y + barHeight * this.visibleI;
    const center = barYPosition + barHeight / 2;
    const halfExtent = barHeight / 2;
    const density = this.getDensity(realIndex, j2);
    const maxWeight = this.effectiveMaxWeight(density);
    const alongFn = (v) => zeroW + this.logVal(v, realIndex) / yRatio;
    const lanes2 = resolveLanes({
      halfExtent,
      cloudSign: (_a = this.cloudSign) != null ? _a : 0,
      rainSign: (_b = this.rainSign) != null ? _b : 0,
      boxFrac: (_c = this.boxFrac) != null ? _c : 0,
      rainFrac: (_d = this.rainFrac) != null ? _d : 0
    });
    const cloudBase = center + lanes2.cloudBaseOff;
    const pathTo = this.buildBodyPath({
      nodes: density.nodes,
      center: cloudBase,
      halfExtent: lanes2.cloudMaxPx,
      maxWeight,
      vertical: false,
      alongFn,
      collapsed: false,
      sideSign: this.cloudSign
    });
    let pathFrom = null;
    const morphFrom = (_f = (_e = this.ctx) == null ? void 0 : _e.morphTypeChange) == null ? void 0 : _f.getInitialPathFor(realIndex, j2);
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j2, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = this.buildBodyPath({
        nodes: density.nodes,
        center: cloudBase,
        halfExtent: lanes2.cloudMaxPx,
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
      cloudMaxPx: lanes2.cloudMaxPx,
      rainCenter: center + lanes2.rainCenterOff,
      rainHalfPx: lanes2.rainHalfPx,
      boxPaths: this.buildBoxSubPaths({
        realIndex,
        j: j2,
        boxCenter: center + lanes2.boxCenterOff,
        boxHalfPx: lanes2.boxHalfPx,
        alongFn,
        vertical: false
      }),
      alongRepresentative: alongFn((_g = this.series[indexes.i][j2]) != null ? _g : 0)
    };
  }
  /**
   * Read the parsed density for one violin and return sorted, de-duplicated
   * nodes (strictly increasing value — a hard requirement for the spline).
   * @param {number} realIndex
   * @param {number} j
   */
  getDensity(realIndex, j2) {
    var _a;
    const w = this.w;
    const d = (_a = w.violinData.seriesViolinDensity[realIndex]) == null ? void 0 : _a[j2];
    if (!d || !d.values.length) {
      return { nodes: [], maxWeight: 0 };
    }
    const order = d.values.map(
      (_2, k2) => k2
    );
    order.sort(
      (a2, b) => d.values[a2] - d.values[b]
    );
    const nodes = [];
    let prevV = null;
    for (const k2 of order) {
      const v = d.values[k2];
      if (prevV !== null && v === prevV) continue;
      nodes.push({ v, w: d.weights[k2] });
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
      const a2 = alongFn(0);
      return vertical ? graphics.move(center, a2) + graphics.line(center, a2) : graphics.move(a2, center) + graphics.line(a2, center);
    }
    const wpxOf = (weight) => {
      if (collapsed || maxWeight <= 0) return 0;
      const wp = weight / maxWeight * halfExtent * this.bandwidthScale;
      return Math.min(halfExtent, Math.max(0, wp));
    };
    const rightPts = [];
    const leftPts = [];
    for (let k2 = 0; k2 < nodes.length; k2++) {
      const a2 = alongFn(nodes[k2].v);
      const wp = wpxOf(nodes[k2].w);
      const outer = sideSign === 0 ? center + wp : center + sideSign * wp;
      const inner = sideSign === 0 ? center - wp : center;
      if (vertical) {
        rightPts.push([outer, a2]);
        leftPts.push([inner, a2]);
      } else {
        rightPts.push([a2, outer]);
        leftPts.push([a2, inner]);
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
  buildBoxSubPaths({ realIndex, j: j2, boxCenter, boxHalfPx, alongFn, vertical }) {
    var _a, _b;
    const w = this.w;
    if (!this.boxShown || boxHalfPx <= 0) return null;
    const summary = (_a = w.violinData.seriesViolinSummary[realIndex]) == null ? void 0 : _a[j2];
    if (!summary) return null;
    const capHalf = boxHalfPx * Math.min(1, Math.max(0, (_b = this.boxOptions.capWidth) != null ? _b : 0.5));
    const [lo, q1, med, q3, hi] = summary.map((v) => alongFn(v));
    const build2 = (half, boxHalf) => {
      const graphics = new Graphics(this.w);
      const pt = (cross2, along) => vertical ? [cross2, along] : [along, cross2];
      const seg = (pts) => pts.map(
        ([px, py], k2) => k2 === 0 ? graphics.move(px, py) : graphics.line(px, py)
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
    const full = build2(capHalf, boxHalfPx);
    const collapsed = build2(0, 0);
    const fromFor = (pathTo, collapsedFrom) => {
      let pathFrom = null;
      if (w.globals.previousPaths.length > 0) {
        pathFrom = this.getPreviousPath(realIndex, j2, pathTo);
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
      for (let k2 = 1; k2 < screenPts.length; k2++) {
        d += graphics.line(screenPts[k2][0], screenPts[k2][1]);
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
    for (let k2 = 1; k2 < screenPts.length; k2++) {
      if (screenPts[k2][axis] === screenPts[k2 - 1][axis]) return false;
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
    j: j2,
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
      points: (_a = this.w.violinData.seriesViolinPoints[realIndex]) == null ? void 0 : _a[j2],
      seedA: realIndex,
      seedB: j2,
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
    for (let k2 = 1; k2 < nodes.length; k2++) {
      if (value <= nodes[k2].v) {
        const a2 = nodes[k2 - 1];
        const b = nodes[k2];
        const t2 = b.v === a2.v ? 0 : (value - a2.v) / (b.v - a2.v);
        return toPx(a2.w + (b.w - a2.w) * t2);
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
  for (let k2 = 0; k2 < arr.length; k2 += 2) {
    out.push(arr[k2 + 1], arr[k2]);
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
    const n2 = parseFloat(val);
    if (isFinite(n2)) frac = n2 / 100;
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
ApexCharts__default.use({
  violin: Violin
});
const e = globalThis.console;
function t(t2, ...s2) {
  e.error(t2, ...s2);
}
function s(t2) {
  e.warn(t2);
}
const i = "APEX-", n = /* @__PURE__ */ new Date("2027-07-31T00:00:00Z"), r = "__apex_license_v1__";
function a() {
  const e2 = globalThis;
  let t2 = e2[r];
  return t2 || (t2 = { key: null, listeners: /* @__PURE__ */ new Set(), result: null }, e2[r] = t2), t2;
}
const l = class {
  static get licenseKey() {
    return a().key;
  }
  static set licenseKey(e2) {
    a().key = e2;
  }
  static get listeners() {
    return a().listeners;
  }
  static get validationResult() {
    return a().result;
  }
  static set validationResult(e2) {
    a().result = e2;
  }
  static getKey() {
    return this.licenseKey;
  }
  static getLicenseStatus() {
    return this.licenseKey ? (this.validationResult = this.validateKey(this.licenseKey), this.validationResult) : { expired: false, signatureVerified: false, valid: false };
  }
  static isKeyValid(e2) {
    return !!e2 && this.validateKey(e2).valid;
  }
  static isLicenseValid() {
    return this.getLicenseStatus().valid;
  }
  static onChange(e2) {
    return this.listeners.add(e2), () => {
      this.listeners.delete(e2);
    };
  }
  static setLicense(e2) {
    var _a;
    var i2;
    if (!e2) return this.licenseKey = null, void this.publish({ expired: false, signatureVerified: false, valid: false });
    const n2 = this.validateKey(e2);
    n2.valid || e2 === this.licenseKey || !(null == (i2 = this.validationResult) ? void 0 : i2.valid) ? (this.licenseKey = e2, this.publish(n2), n2.valid || t(`[Apex] ${n2.message}`)) : s(`[Apex] Ignoring license key: ${(_a = n2.message) != null ? _a : "it is not valid"} A valid license is already active on this page.`);
  }
  static validateKey(e2) {
    const t2 = this.parseKey(e2), s2 = this.validateStructure(e2, t2);
    if (!s2.valid || !(null == t2 ? void 0 : t2.signature)) return s2;
    const i2 = this.verdicts.get(e2);
    return false === i2 ? { data: t2.data, expired: false, message: "Invalid license key. The license signature does not verify.", signatureVerified: true, valid: false } : (void 0 === i2 && this.verifySignature(e2, t2, s2), __spreadProps(__spreadValues({}, s2), { signatureVerified: true === i2 }));
  }
  static _resetSignatureState() {
    this.verdicts.clear(), this.verifying.clear(), this.warnedUnverifiable = false, this.epoch++;
  }
  static base64ToBytes(e2) {
    const t2 = e2.replace(/-/g, "+").replace(/_/g, "/"), s2 = t2.padEnd(4 * Math.ceil(t2.length / 4), "="), i2 = globalThis.atob;
    if ("function" != typeof i2) throw new Error("no base64 decoder available");
    const n2 = i2(s2), r2 = new Uint8Array(n2.length);
    for (let e3 = 0; e3 < n2.length; e3++) r2[e3] = n2.charCodeAt(e3);
    return r2;
  }
  static canonicalPayload(e2) {
    const t2 = e2.domains && e2.domains.length > 0 ? e2.domains.join(",") : "";
    return `v1|${e2.issueDate}|${e2.expiryDate}|${e2.plan}|${t2}`;
  }
  static notify(e2) {
    for (const t2 of this.listeners) try {
      t2(e2);
    } catch (e3) {
    }
  }
  static parseKey(e2) {
    if ("string" != typeof e2 || !e2.startsWith(i)) return null;
    const t2 = e2.slice(5);
    if (!t2) return null;
    try {
      const e3 = new TextDecoder().decode(this.base64ToBytes(t2)), s2 = JSON.parse(e3);
      return s2.issueDate && s2.expiryDate && s2.plan ? { data: { domains: Array.isArray(s2.domains) ? s2.domains : void 0, expiryDate: s2.expiryDate, issueDate: s2.issueDate, plan: s2.plan, valid: true }, signature: "string" == typeof s2.sig && s2.sig ? s2.sig : null } : null;
    } catch (e3) {
      return null;
    }
  }
  static publish(e2) {
    this.validationResult = e2, this.notify(e2);
  }
  static validateStructure(e2, t2) {
    const s2 = (e3) => ({ expired: false, message: e3, signatureVerified: false, valid: false });
    if ("string" != typeof e2 || !e2.startsWith(i)) return s2('Invalid license key format. License key must start with "APEX-".');
    if (!t2) return s2("Invalid license key. Unable to decode license data.");
    const { data: r2, signature: a2 } = t2;
    if (!a2 && /* @__PURE__ */ new Date() >= n) return s2("This license key is in the old unsigned format, which is no longer accepted. Please request a replacement key.");
    if (new Date(r2.expiryDate) < /* @__PURE__ */ new Date()) return { data: r2, expired: true, message: `License expired on ${r2.expiryDate}. Please renew your license.`, signatureVerified: false, valid: false };
    if (r2.domains && r2.domains.length > 0) {
      const e3 = "undefined" == typeof location ? "" : location.hostname;
      if (!r2.domains.some(((t3) => e3 === t3 || e3.endsWith(`.${t3}`)))) return { data: r2, expired: false, message: `License is not valid for this domain (${e3}). Allowed domains: ${r2.domains.join(", ")}.`, signatureVerified: false, valid: false };
    }
    return { data: r2, expired: false, signatureVerified: false, valid: true };
  }
  static verifySignature(e2, i2, n2) {
    return __async(this, null, function* () {
      var r2;
      if (this.verifying.has(e2) || this.verdicts.has(e2)) return;
      this.verifying.add(e2);
      const a2 = this.epoch, l2 = null == (r2 = globalThis.crypto) ? void 0 : r2.subtle;
      if (!l2 || 0 === this.publicKeysSpki.length) return this.verifying.delete(e2), void (this.warnedUnverifiable || (this.warnedUnverifiable = true, s(l2 ? "[Apex] No license signing key is configured in this build, so license signatures cannot be verified." : "[Apex] Web Crypto is unavailable (a secure context is required), so the license signature cannot be verified.")));
      const o2 = new TextEncoder().encode(this.canonicalPayload(i2.data));
      let c = false;
      for (const e3 of this.publicKeysSpki) {
        try {
          const t2 = yield l2.importKey("spki", this.base64ToBytes(e3), { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
          c = yield l2.verify({ hash: "SHA-256", name: "ECDSA" }, t2, this.base64ToBytes(i2.signature), o2);
        } catch (e4) {
          c = false;
        }
        if (c) break;
      }
      if (this.verifying.delete(e2), this.epoch !== a2) return;
      if (this.verdicts.set(e2, c), c) {
        const t2 = __spreadProps(__spreadValues({}, n2), { signatureVerified: true });
        return void (this.licenseKey === e2 ? this.publish(t2) : this.notify(t2));
      }
      const u = "Invalid license key. The license signature does not verify.", h = { data: i2.data, expired: false, message: u, signatureVerified: true, valid: false };
      this.licenseKey === e2 ? this.publish(h) : this.notify(h), t(`[Apex] ${u}`);
    });
  }
};
l.publicKeysSpki = ["MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQIaK9UMD6n0oR/FIy8QdL0uSzKMQlf1BB+tOrji4/WuHsyRNxeDhVykoSsNURozMi1xhmqWvBH1L//xIfugTPA=="], l.verdicts = /* @__PURE__ */ new Map(), l.verifying = /* @__PURE__ */ new Set(), l.warnedUnverifiable = false, l.epoch = 0;
let o = l;
const M = 1e3;
function A$1(e2, t2) {
  const s2 = e2.length;
  if (0 === s2) return NaN;
  if (1 === s2) return e2[0];
  const i2 = (s2 - 1) * t2, n2 = Math.floor(i2), r2 = Math.ceil(i2);
  return n2 === r2 ? e2[n2] : e2[n2] + (e2[r2] - e2[n2]) * (i2 - n2);
}
function x(e2, t2, s2) {
  const i2 = e2.length, n2 = (e3) => t2 / Math.max(1, Math.ceil(e3)), r2 = () => n2(Math.log2(i2) + 1);
  switch (s2) {
    case "sqrt":
      return { width: n2(Math.sqrt(i2)), rule: "sqrt" };
    case "rice":
      return { width: n2(2 * Math.cbrt(i2)), rule: "rice" };
    case "scott": {
      const t3 = (function(e3) {
        const t4 = e3.length;
        if (t4 < 2) return 0;
        let s3 = 0;
        for (let i4 = 0; i4 < t4; i4++) s3 += e3[i4];
        const i3 = s3 / t4;
        let n3 = 0;
        for (let s4 = 0; s4 < t4; s4++) {
          const t5 = e3[s4] - i3;
          n3 += t5 * t5;
        }
        return Math.sqrt(n3 / t4);
      })(e2);
      return t3 > 0 ? { width: 3.49 * t3 * Math.pow(i2, -1 / 3), rule: "scott" } : { width: r2(), rule: "sturges" };
    }
    case "fd": {
      const t3 = A$1(e2, 0.75) - A$1(e2, 0.25);
      return t3 > 0 ? { width: 2 * t3 * Math.pow(i2, -1 / 3), rule: "fd" } : { width: r2(), rule: "sturges" };
    }
    case "auto": {
      const t3 = r2(), s3 = A$1(e2, 0.75) - A$1(e2, 0.25);
      if (s3 <= 0) return { width: t3, rule: "sturges" };
      const n3 = 2 * s3 * Math.pow(i2, -1 / 3);
      return n3 < t3 ? { width: n3, rule: "fd" } : { width: t3, rule: "sturges" };
    }
    default:
      return { width: r2(), rule: "sturges" };
  }
}
function S(e2, t2 = {}) {
  if (!Array.isArray(e2) || 0 === e2.length) return null;
  const s2 = e2.slice().sort(((e3, t3) => e3 - t3));
  let i2 = s2[0], n2 = s2[s2.length - 1];
  const r2 = t2.range;
  if (Array.isArray(r2) && 2 === r2.length) {
    const e3 = Number(r2[0]), t3 = Number(r2[1]);
    Number.isFinite(e3) && Number.isFinite(t3) && t3 > e3 && (i2 = e3, n2 = t3);
  }
  if (!(n2 > i2)) {
    const e3 = Math.abs(i2) > 0 ? 0.05 * Math.abs(i2) : 0.5;
    return { edges: [i2 - e3, i2 + e3], binWidth: 2 * e3, rule: "single", capped: false };
  }
  const a2 = n2 - i2;
  let l2, o2;
  if ("number" == typeof t2.binWidth && t2.binWidth > 0) l2 = t2.binWidth, o2 = "binWidth";
  else if ("number" == typeof t2.bins && t2.bins >= 1) l2 = a2 / Math.floor(t2.bins), o2 = "count";
  else {
    const e3 = x(s2, a2, "string" == typeof t2.bins ? t2.bins : "auto");
    l2 = e3.width, o2 = e3.rule;
  }
  (!Number.isFinite(l2) || l2 <= 0) && (l2 = a2);
  let c = Math.ceil(a2 / l2);
  (!Number.isFinite(c) || c < 1) && (c = 1);
  let u = false;
  c > M && (c = M, u = true), l2 = a2 / c;
  const h = new Array(c + 1);
  for (let e3 = 0; e3 <= c; e3++) h[e3] = i2 + e3 * l2;
  return h[c] = Math.max(h[c], n2), { edges: h, binWidth: l2, rule: o2, capped: u };
}
function k(e2, t2) {
  const s2 = t2.length - 1;
  if (!(e2 >= t2[0]) || e2 > t2[s2]) return -1;
  if (e2 === t2[s2]) return s2 - 1;
  const i2 = (t2[s2] - t2[0]) / s2;
  if (i2 > 0) {
    let n3 = Math.floor((e2 - t2[0]) / i2);
    return n3 < 0 && (n3 = 0), n3 > s2 - 1 && (n3 = s2 - 1), e2 < t2[n3] ? n3-- : e2 >= t2[n3 + 1] && n3++, n3 < 0 || n3 > s2 - 1 ? -1 : n3;
  }
  let n2 = 0, r2 = s2 - 1;
  for (; n2 <= r2; ) {
    const s3 = n2 + r2 >> 1;
    if (e2 < t2[s3]) r2 = s3 - 1;
    else {
      if (!(e2 >= t2[s3 + 1])) return s3;
      n2 = s3 + 1;
    }
  }
  return -1;
}
function L(e2, t2) {
  const s2 = new Array(Math.max(0, t2.length - 1)).fill(0);
  for (let i2 = 0; i2 < e2.length; i2++) {
    const n2 = k(e2[i2], t2);
    n2 >= 0 && s2[n2]++;
  }
  return s2;
}
const j = class {
  static applyStyles(e2) {
    Object.assign(e2.style, this.CRITICAL_STYLES, { backgroundImage: this.createWatermarkPattern(), backgroundRepeat: "repeat" });
  }
  static node(e2) {
    return e2 ? e2.querySelector(`[${this.WATERMARK_ATTR}]`) : null;
  }
  static add(e2, t2) {
    return e2 && "undefined" != typeof document ? (this.setManaged(e2, t2), this.paint(e2)) : null;
  }
  static exists(e2) {
    return !!this.node(e2);
  }
  static remove(e2, t2) {
    e2 && (this.setManaged(e2, t2), this.erase(e2));
  }
  static untrack(e2) {
    this.managed.delete(e2);
  }
  static createWatermarkPattern() {
    const e2 = this.WATERMARK_TEXT;
    return `url("data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200">
        <text
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif"
          font-size="18"
          font-weight="600"
          fill="rgba(134, 134, 134, 0.1)"
          transform="rotate(-35, 100, 60)"
        >${e2}</text>
      </svg>
    `.trim())}")`;
  }
  static erase(e2) {
    var t2;
    null == (t2 = this.node(e2)) || t2.remove();
  }
  static paint(e2) {
    let t2 = this.node(e2);
    return t2 || (t2 = document.createElement("div"), t2.setAttribute(this.WATERMARK_ATTR, ""), e2.appendChild(t2)), this.applyStyles(t2), "function" == typeof getComputedStyle && "static" === getComputedStyle(e2).position && (e2.style.position = "relative"), t2;
  }
  static reconcile() {
    const e2 = o.isLicenseValid();
    for (const t2 of this.managed) t2.isConnected ? e2 ? this.erase(t2) : this.paint(t2) : this.managed.delete(t2);
  }
  static setManaged(e2, t2) {
    false !== (null == t2 ? void 0 : t2.manage) ? this.track(e2) : this.managed.delete(e2);
  }
  static track(e2) {
    this.managed.add(e2), this.subscribed || (this.subscribed = true, o.onChange((() => {
      this.reconcile();
    })));
  }
};
j.WATERMARK_ATTR = "data-apexcharts-watermark", j.WATERMARK_TEXT = "APEXCHARTS", j.ATTR = "data-apexcharts-watermark", j.CRITICAL_STYLES = { bottom: "0", display: "block", left: "0", msUserSelect: "none", opacity: "1", pointerEvents: "none", position: "absolute", right: "0", top: "0", userSelect: "none", visibility: "visible", webkitUserSelect: "none", zIndex: "10000" }, j.managed = /* @__PURE__ */ new Set(), j.subscribed = false;
let C = j;
const D = 0.05, K = 0.05, O = 1 / 45;
function $(e2, t2, s2, i2) {
  const n2 = { value: e2, velocity: 0, target: e2, stiffness: t2, damping: s2 };
  return n2;
}
function q(e2, t2) {
  if (t2 <= 0) return W(e2);
  let s2 = t2;
  for (; s2 > 0; ) {
    const t3 = Math.min(s2, O), i2 = -e2.stiffness * (e2.value - e2.target) - e2.damping * e2.velocity;
    e2.velocity += i2 * t3, e2.value += e2.velocity * t3, s2 -= t3;
  }
  return !!W(e2) && (e2.value = e2.target, e2.velocity = 0, true);
}
function _(e2, t2) {
  e2.target = t2;
}
function W(e2) {
  var _a, _b;
  const t2 = (_a = e2.restVelocity) != null ? _a : D, s2 = (_b = e2.restDisplacement) != null ? _b : K;
  return Math.abs(e2.velocity) < t2 && Math.abs(e2.value - e2.target) < s2;
}
const V = { crisp: [210, 26], gentle: [120, 20], snappy: [320, 30] };
function z(e2) {
  var _a;
  return (_a = V[e2 != null ? e2 : "crisp"]) != null ? _a : V.crisp;
}
const pe = "__apexcharts_crossfilters__";
function ge(e2) {
  if (!Number.isFinite(e2)) return e2;
  const t2 = Number(e2.toPrecision(12));
  return Object.is(t2, -0) ? 0 : t2;
}
function me(e2) {
  return "number" == typeof e2 && Number.isFinite(e2);
}
function ye(e2) {
  if ("function" == typeof e2) return e2;
  if (e2 && "object" == typeof e2) {
    if ("string" == typeof e2.sum) {
      const t2 = e2.sum;
      return (e3) => e3.reduce(((e4, s2) => e4 + (Number(s2[t2]) || 0)), 0);
    }
    if ("string" == typeof e2.avg) {
      const t2 = e2.avg;
      return (e3) => e3.length ? e3.reduce(((e4, s2) => e4 + (Number(s2[t2]) || 0)), 0) / e3.length : 0;
    }
    if ("string" == typeof e2.min) {
      const t2 = e2.min;
      return (e3) => e3.length ? Math.min(...e3.map(((e4) => Number(e4[t2]) || 0))) : 0;
    }
    if ("string" == typeof e2.max) {
      const t2 = e2.max;
      return (e3) => e3.length ? Math.max(...e3.map(((e4) => Number(e4[t2]) || 0))) : 0;
    }
  }
  return (e3) => e3.length;
}
function ve(e2, t2) {
  return "function" == typeof t2 ? e2.slice().sort(t2) : "asc" === t2 ? e2.slice().sort(((e3, t3) => e3 > t3 ? 1 : e3 < t3 ? -1 : 0)) : "desc" === t2 ? e2.slice().sort(((e3, t3) => e3 < t3 ? 1 : e3 > t3 ? -1 : 0)) : e2;
}
function be(e2, t2) {
  if (!me(e2)) return -1;
  const s2 = t2.length - 1;
  if (e2 < t2[0] || e2 > t2[s2]) return -1;
  if (e2 === t2[s2]) return s2 - 1;
  for (let i2 = 0; i2 < s2; i2++) if (e2 >= t2[i2] && e2 < t2[i2 + 1]) return i2;
  return -1;
}
function we(e2) {
  const t2 = [];
  for (let s2 = 0; s2 < e2.length - 1; s2++) t2.push(ge((e2[s2] + e2[s2 + 1]) / 2));
  return t2;
}
class Me {
  constructor(e2, t2) {
    this.dims = /* @__PURE__ */ new Map(), this.listeners = /* @__PURE__ */ new Map(), this.id = e2, this.records = Array.isArray(t2) ? t2 : [];
  }
  static store() {
    const e2 = globalThis;
    return e2[pe] || (e2[pe] = /* @__PURE__ */ new Map()), e2[pe];
  }
  static getOrCreate(e2) {
    if (!e2 || "string" != typeof e2.id) throw new Error("Crossfilter.getOrCreate requires an { id } string.");
    const t2 = Me.store(), s2 = t2.get(e2.id);
    if (s2) return e2.records && s2.setRecords(e2.records), s2;
    const i2 = new Me(e2.id, e2.records);
    return t2.set(e2.id, i2), i2;
  }
  static get(e2) {
    return Me.store().get(e2) || null;
  }
  setRecords(e2) {
    return this.records = Array.isArray(e2) ? e2 : [], this.dims.forEach(((e3) => this.recomputeDomain(e3))), this.emit("records", this.state()), this.emit("change", this.state()), this;
  }
  registerDimension(e2, t2) {
    if (!t2 || "function" != typeof t2.dimension) throw new Error(`crossfilter.registerDimension("${e2}") needs a dimension function.`);
    const s2 = t2.type || (t2.bins ? "range" : "category"), i2 = { accessor: t2.dimension, reducer: ye(t2.reduce), type: s2, bins: t2.bins, order: t2.order, filter: null, labels: [], edges: null, xLabels: [], yLabels: [] };
    return this.dims.set(e2, i2), this.recomputeDomain(i2), null != t2.filter && this.setFilterOn(i2, t2.filter), this;
  }
  hasDimension(e2) {
    return this.dims.has(e2);
  }
  removeDimension(e2) {
    const t2 = this.dims.get(e2), s2 = !!t2 && this.hasFilter(t2);
    return this.dims.delete(e2), s2 && this.emit("change", this.state()), this;
  }
  recomputeDomain(e2) {
    if ("matrix" === e2.type) {
      const t2 = (function(e3, t3, s2) {
        const i2 = /* @__PURE__ */ new Set(), n2 = /* @__PURE__ */ new Set(), r2 = [], a2 = [];
        for (let s3 = 0; s3 < e3.length; s3++) {
          const l2 = t3(e3[s3]);
          if (!l2) continue;
          const o2 = l2[0], c = l2[1];
          null == o2 || i2.has(o2) || (i2.add(o2), r2.push(o2)), null == c || n2.has(c) || (n2.add(c), a2.push(c));
        }
        return { xLabels: ve(r2, s2), yLabels: ve(a2, s2) };
      })(this.records, e2.accessor, e2.order);
      return e2.xLabels = t2.xLabels, e2.yLabels = t2.yLabels, void (e2.edges = null);
    }
    if ("range" === e2.type) return e2.edges = (function(e3, t2, s2) {
      if (s2 && Array.isArray(s2.thresholds) && s2.thresholds.length >= 2) {
        const e4 = Array.from(new Set(s2.thresholds.filter(me))).sort(((e5, t3) => e5 - t3));
        return e4.length >= 2 ? e4.map(ge) : [0, 1];
      }
      let i2 = 1 / 0, n2 = -1 / 0;
      for (let s3 = 0; s3 < e3.length; s3++) {
        const r3 = t2(e3[s3]);
        me(r3) && (r3 < i2 && (i2 = r3), r3 > n2 && (n2 = r3));
      }
      if (i2 === 1 / 0) return [0, 1];
      if (i2 === n2) {
        const e4 = Math.abs(i2) > 0 ? Math.abs(i2) : 1;
        return [ge(i2), ge(i2 + e4)];
      }
      if (s2 && me(s2.width) && s2.width > 0) {
        const e4 = s2.width, t3 = Math.floor(i2 / e4) * e4;
        let r3 = Math.ceil(n2 / e4) * e4;
        r3 <= t3 && (r3 = t3 + e4);
        const a3 = Math.max(1, Math.round((r3 - t3) / e4)), l3 = new Array(a3 + 1);
        for (let s3 = 0; s3 <= a3; s3++) l3[s3] = ge(t3 + s3 * e4);
        return l3;
      }
      const r2 = s2 && me(s2.count) && s2.count >= 1 ? Math.floor(s2.count) : 30, a2 = (n2 - i2) / r2, l2 = new Array(r2 + 1);
      for (let e4 = 0; e4 <= r2; e4++) l2[e4] = ge(i2 + e4 * a2);
      return l2[r2] = ge(n2), l2;
    })(this.records, e2.accessor, e2.bins), void (e2.labels = we(e2.edges));
    if (e2.labels = (function(e3, t2, s2) {
      const i2 = /* @__PURE__ */ new Set(), n2 = [];
      for (let s3 = 0; s3 < e3.length; s3++) {
        const r2 = t2(e3[s3]);
        null != r2 && (i2.has(r2) || (i2.add(r2), n2.push(r2)));
      }
      return ve(n2, s2);
    })(this.records, e2.accessor, e2.order), e2.edges = null, e2.filter instanceof Set) {
      const t2 = new Set(e2.labels);
      Array.from(e2.filter).forEach(((s2) => {
        t2.has(s2) || e2.filter.delete(s2);
      }));
    }
  }
  filter(e2, t2) {
    const s2 = this.dims.get(e2);
    return s2 ? (this.setFilterOn(s2, t2), this.emit("change", this.state()), this) : this;
  }
  toggleKey(e2, t2) {
    const s2 = this.dims.get(e2);
    if (!s2 || "category" !== s2.type) return this;
    s2.filter instanceof Set || (s2.filter = /* @__PURE__ */ new Set());
    const i2 = s2.filter;
    return i2.has(t2) ? i2.delete(t2) : i2.add(t2), 0 === i2.size && (s2.filter = null), this.emit("change", this.state()), this;
  }
  setFilterOn(e2, t2) {
    if (null == t2) return void (e2.filter = null);
    if ("range" === e2.type) {
      if (Array.isArray(t2) && 2 === t2.length && t2.every(me)) {
        const [s3, i2] = t2;
        e2.filter = [Math.min(s3, i2), Math.max(s3, i2)];
      } else e2.filter = null;
      return;
    }
    const s2 = new Set(t2);
    e2.filter = s2.size ? s2 : null;
  }
  clear(e2) {
    const t2 = this.dims.get(e2);
    return t2 && (t2.filter = null), this.emit("change", this.state()), this;
  }
  reset() {
    return this.dims.forEach(((e2) => {
      e2.filter = null;
    })), this.emit("change", this.state()), this;
  }
  hasFilter(e2) {
    return null != e2.filter && (!(e2.filter instanceof Set) || e2.filter.size > 0);
  }
  passes(e2, t2) {
    if (!this.hasFilter(e2)) return true;
    const s2 = e2.accessor(t2);
    if (e2.filter instanceof Set) return e2.filter.has(s2);
    if (!me(s2)) return false;
    const [i2, n2] = e2.filter;
    return s2 >= i2 && s2 <= n2;
  }
  filteredRecords(e2) {
    const t2 = [];
    return this.dims.forEach(((s2, i2) => {
      i2 !== e2 && this.hasFilter(s2) && t2.push(s2);
    })), 0 === t2.length ? this.records : this.records.filter(((e3) => t2.every(((t3) => this.passes(t3, e3)))));
  }
  filteredRows() {
    return this.filteredRecords(null);
  }
  aggregateFor(e2) {
    const t2 = this.dims.get(e2);
    if (!t2) return { type: "category", labels: [], values: [], keys: [] };
    const s2 = this.filteredRecords(e2);
    if ("matrix" === t2.type) {
      const e3 = new Map(t2.xLabels.map(((e4, t3) => [e4, t3]))), i3 = new Map(t2.yLabels.map(((e4, t3) => [e4, t3]))), n2 = t2.yLabels.map((() => t2.xLabels.map((() => []))));
      for (let r2 = 0; r2 < s2.length; r2++) {
        const a2 = t2.accessor(s2[r2]);
        if (!a2) continue;
        const l2 = e3.get(a2[0]), o2 = i3.get(a2[1]);
        null != l2 && null != o2 && n2[o2][l2].push(s2[r2]);
      }
      return { type: "matrix", xLabels: t2.xLabels.slice(), yLabels: t2.yLabels.slice(), matrix: n2.map(((e4) => e4.map(((e5) => t2.reducer(e5))))) };
    }
    if ("range" === t2.type) {
      const e3 = t2.edges || [0, 1], i3 = e3.length - 1, n2 = Array.from({ length: i3 }, (() => []));
      for (let i4 = 0; i4 < s2.length; i4++) {
        const r2 = be(t2.accessor(s2[i4]), e3);
        r2 >= 0 && n2[r2].push(s2[i4]);
      }
      return { type: "range", labels: we(e3), values: n2.map(((e4) => t2.reducer(e4))), keys: n2.map(((t3, s3) => [e3[s3], e3[s3 + 1]])), edges: e3 };
    }
    const i2 = /* @__PURE__ */ new Map();
    t2.labels.forEach(((e3) => i2.set(e3, [])));
    for (let e3 = 0; e3 < s2.length; e3++) {
      const n2 = i2.get(t2.accessor(s2[e3]));
      n2 && n2.push(s2[e3]);
    }
    return { type: "category", labels: t2.labels.slice(), values: t2.labels.map(((e3) => t2.reducer(i2.get(e3) || []))), keys: t2.labels.slice() };
  }
  aggregateAll() {
    const e2 = {};
    return this.dims.forEach(((t2, s2) => {
      e2[s2] = this.aggregateFor(s2);
    })), e2;
  }
  state() {
    const e2 = {};
    return this.dims.forEach(((t2, s2) => {
      this.hasFilter(t2) && (e2[s2] = t2.filter instanceof Set ? Array.from(t2.filter) : t2.filter.slice());
    })), { filters: e2, filteredCount: this.filteredRows().length, total: this.records.length };
  }
  filterOf(e2) {
    const t2 = this.dims.get(e2);
    return t2 && this.hasFilter(t2) ? t2.filter instanceof Set ? new Set(t2.filter) : t2.filter.slice() : null;
  }
  on(e2, t2) {
    let s2 = this.listeners.get(e2);
    return s2 || (s2 = /* @__PURE__ */ new Set(), this.listeners.set(e2, s2)), s2.add(t2), () => this.off(e2, t2);
  }
  off(e2, t2) {
    var s2;
    return null == (s2 = this.listeners.get(e2)) || s2.delete(t2), this;
  }
  emit(e2, s2) {
    var i2;
    null == (i2 = this.listeners.get(e2)) || i2.forEach(((i3) => {
      try {
        i3(s2);
      } catch (s3) {
        t(`[Apex] a crossfilter ${e2} listener threw`, s3);
      }
    }));
  }
  static esc(e2) {
    return String(null == e2 ? "" : e2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  resolveColumns(e2) {
    if (Array.isArray(e2) && e2.length) return e2.map(((e3) => "string" == typeof e3 ? { field: e3, label: e3 } : { field: e3.field, label: e3.label || e3.field, format: e3.format }));
    const t2 = this.records[0];
    return (t2 ? Object.keys(t2) : []).map(((e3) => ({ field: e3, label: e3 })));
  }
  tableHTML(e2, t2, s2) {
    const i2 = "<thead><tr>" + e2.map(((e3) => `<th>${Me.esc(e3.label)}</th>`)).join("") + "</tr></thead>", n2 = "<tbody>" + t2.map(((t3) => "<tr>" + e2.map(((e3) => {
      const s3 = t3[e3.field], i3 = e3.format ? e3.format(s3, t3) : s3;
      return `<td>${Me.esc(i3)}</td>`;
    })).join("") + "</tr>")).join("") + "</tbody>";
    return `<table class="apexcharts-cf-table">${`<caption>${t2.length} of ${s2} rows</caption>`}${i2}${n2}</table>`;
  }
  dataTable(e2, t2) {
    if (!e2) return { refresh() {
    }, destroy() {
    } };
    const s2 = t2 || {}, i2 = this.resolveColumns(s2.columns), n2 = s2.pageSize || 0, r2 = s2.page || 0, a2 = () => {
      const t3 = this.filteredRows(), s3 = n2 ? t3.slice(r2 * n2, r2 * n2 + n2) : t3;
      e2.innerHTML = this.tableHTML(i2, s3, t3.length);
    };
    a2();
    const l2 = this.on("change", a2);
    return { refresh: a2, destroy: () => {
      l2(), e2.innerHTML = "";
    } };
  }
  destroy() {
    Me.store().delete(this.id), this.dims.clear(), this.listeners.clear(), this.records = [];
  }
}
const LAYOUT_KEY$1 = "__apexcharts_unit_layouts__";
if (!/** @type {any} */
globalThis[LAYOUT_KEY$1]) {
  globalThis[LAYOUT_KEY$1] = {};
}
function getLayouts() {
  return (
    /** @type {any} */
    globalThis[LAYOUT_KEY$1]
  );
}
function getUnitLayout(name) {
  if (!name) return null;
  return getLayouts()[name] || null;
}
const MARK_KEY$1 = "__apexcharts_unit_marks__";
if (!/** @type {any} */
globalThis[MARK_KEY$1]) {
  globalThis[MARK_KEY$1] = {};
}
function getMarks() {
  return (
    /** @type {any} */
    globalThis[MARK_KEY$1]
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
  if (!vb.every((n2) => isFinite(n2)) || vb[2] <= 0 || vb[3] <= 0) {
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
const Environment = ApexCharts.__apex_Environment_Environment;
const BrowserAPIs = ApexCharts.__apex_BrowserAPIs_BrowserAPIs;
const Animations = ApexCharts.__apex_Animations;
const prefersReducedMotion = ApexCharts.__apex_Animations_prefersReducedMotion;
function drawOuterLabel(w, spec) {
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
  const graphics = new Graphics(w);
  const group2 = graphics.group({
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
    group2.add(line);
  }
  const textX = side === "right" ? labelX + 4 : labelX - 4;
  const n2 = lines.length;
  const startY = labelY - (n2 - 1) * lineHeight / 2;
  const elText = graphics.drawText({
    x: textX,
    y: startY,
    text: n2 === 1 ? lines[0] : lines,
    textAnchor: side === "right" ? "start" : "end",
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    foreColor,
    dominantBaseline: "central",
    cssClass: spec.textClass || "apexcharts-outer-label"
  });
  if (n2 > 1) {
    const tspans = elText.node.getElementsByTagName("tspan");
    for (let li = 0; li < tspans.length; li++) {
      tspans[li].setAttribute("x", `${textX}`);
      tspans[li].setAttribute("dy", li === 0 ? "0" : `${lineHeight}`);
    }
  }
  group2.add(elText);
  return group2;
}
function measureLabelWidth(w, labels, style = {}) {
  const graphics = new Graphics(w);
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
  const col = items.slice().sort((a2, b) => a2.idealY - b.idealY);
  col.forEach((l2) => {
    l2.labelY = l2.idealY;
  });
  for (let k2 = 1; k2 < col.length; k2++) {
    if (col[k2].labelY - col[k2 - 1].labelY < minGap) {
      col[k2].labelY = col[k2 - 1].labelY + minGap;
    }
  }
  const last = col[col.length - 1];
  const overflow = last ? last.labelY - maxY : 0;
  if (overflow > 0) {
    for (let k2 = col.length - 1; k2 >= 0; k2--) {
      col[k2].labelY -= overflow;
      if (k2 < col.length - 1 && col[k2 + 1].labelY - col[k2].labelY < minGap) {
        col[k2].labelY = col[k2 + 1].labelY - minGap;
      }
    }
  }
  if (minY != null && col.length && col[0].labelY < minY) {
    const shift = minY - col[0].labelY;
    for (let k2 = 0; k2 < col.length; k2++) {
      col[k2].labelY += shift;
    }
  }
}
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
function easeOutCubic(t2) {
  return 1 - Math.pow(1 - t2, 3);
}
function easeOutBack(s2) {
  return (t2) => 1 + (s2 + 1) * Math.pow(t2 - 1, 3) + s2 * Math.pow(t2 - 1, 2);
}
function easeInOutCubic(t2) {
  return t2 < 0.5 ? 4 * t2 * t2 * t2 : 1 - Math.pow(-2 * t2 + 2, 3) / 2;
}
const SPRING_REFERENCE_SPEED = 800;
const MAX_FRAME_STEP = 0.25;
const PK_CIRCLE = 0;
const PK_CORNER = 1;
const PK_GLYPH = 2;
function springParams(preset, speed) {
  const [stiffness, damping] = z(
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
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
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
    const w = this.w;
    const graphics = new Graphics(w, this.ctx);
    const ret = graphics.group({ class: "apexcharts-unit" });
    if (w.globals.noData || !Array.isArray(series) || series.length === 0) {
      return ret;
    }
    const opts = w.config.plotOptions.unit;
    const layout = opts.layout === "packed" ? "packed" : opts.layout === "columns" ? "columns" : opts.layout === "grid" ? "grid" : opts.layout === "scatter" ? "scatter" : opts.layout === "arc" ? "arc" : opts.layout === "custom" ? "custom" : "grouped";
    const transition = opts.transition;
    const flow = transition === "flow";
    const identity = transition === "identity";
    const unitValue = opts.unitValue > 0 ? opts.unitValue : 1;
    let counts = series.map((v) => {
      const n2 = Math.abs(Utils.parseNumber(v)) / unitValue;
      return n2 > 0 ? Math.max(1, Math.round(n2)) : 0;
    });
    counts = this._applyMaxUnits(counts, opts.maxUnits);
    const total = counts.reduce((a2, b) => a2 + b, 0);
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
    const unitData = w.seriesData.unitData || [];
    const sizeStats = this._bubbleStats(unitData, opts, dotR);
    let gIndex = 0;
    clusters.forEach((cluster) => {
      const color = w.globals.colors[cluster.i] || w.globals.colors[0] || "#008FFB";
      const elSeries = graphics.group({
        class: "apexcharts-series",
        seriesName: Utils.escapeString(
          w.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`
        ),
        rel: cluster.i + 1,
        "data:realIndex": cluster.i
      });
      const burst = morphActive && !perRowBurst ? morph.getInitialCenterFor(cluster.i) : null;
      const burstCount = cluster.dots.length;
      const catData = unitData[cluster.i];
      cluster.dots.forEach((d, jj) => {
        const j2 = d.j != null ? d.j : jj;
        const datum = catData ? catData[j2] : void 0;
        const dotFill = datum && typeof datum === "object" && datum.fillColor ? datum.fillColor : color;
        const rj = d.r != null ? d.r : sizeStats ? this._radiusForValue(this._unitValueOf(datum), sizeStats) : dotR;
        const spec = this._markSpecFor(opts, datum, cluster.i, rj);
        const el = this._drawDot(graphics, opts, rj, dotFill, cluster.i, j2, spec);
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
          key = `${cluster.i}:${j2}`;
        }
        gIndex++;
        nextPrev.set(key, { x: d.x, y: d.y, fill: dotFill, r: rj, spec });
        if (pieceTakeover) {
          this._place(el.node, spec, d.x, d.y);
          el.node.setAttribute("opacity", "0");
          el.node.setAttribute("data-piece-hidden", "1");
        } else if (animate) {
          const from = prev && prev.get(key);
          const anchor = from || (perRowBurst ? morph.getInitialSlotFor(cluster.i, j2, burstCount) : burst);
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
      w.globals.animationEnded = true;
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
    const total = counts.reduce((a2, b) => a2 + b, 0);
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const total = counts.reduce((a2, b) => a2 + b, 0);
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
    } catch (e2) {
      console.warn(
        "[ApexCharts] unit chart: the layout provider threw; falling back to 'grouped'.",
        e2
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
    placed.forEach((p) => {
      if (!p || !isFinite(p.x) || !isFinite(p.y)) return;
      byId.set(String(p.id), {
        x: p.x,
        y: p.y,
        r: typeof p.r === "number" && p.r > 0 ? p.r : void 0
      });
    });
    const clusters = counts.map((_2, i2) => ({
      i: i2,
      cx: gw / 2,
      cy: gh / 2,
      outerR: dotR,
      dots: []
    }));
    objects.forEach((o2) => {
      const hit = byId.get(o2.id);
      if (!hit) return;
      clusters[o2.seriesIndex].dots.push({
        x: hit.x,
        y: hit.y,
        r: hit.r,
        j: o2.dataPointIndex
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
    const w = this.w;
    const unitData = w.seriesData.unitData || [];
    const names = w.seriesData.seriesNames || [];
    const objects = [];
    let index = 0;
    counts.forEach((n2, i2) => {
      var _a;
      const catData = unitData[i2];
      for (let j2 = 0; j2 < n2; j2++) {
        const datum = catData ? catData[j2] : void 0;
        const id = datum && typeof datum === "object" && (datum.id != null || datum.name != null) ? String(datum.id != null ? datum.id : datum.name) : `${i2}:${j2}`;
        objects.push({
          id,
          index,
          seriesIndex: i2,
          dataPointIndex: j2,
          label: names[i2],
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const labelSpace = opts.clusterLabels && opts.clusterLabels.show ? 30 : 6;
    const visible = counts.map((_2, i2) => i2).filter((i2) => counts[i2] > 0);
    const Kv = Math.max(1, visible.length);
    const slotOf = new Array(counts.length).fill(-1);
    visible.forEach((i2, s2) => slotOf[i2] = s2);
    const cellW = gw / Kv;
    const availH = gh - labelSpace;
    const maxCount = Math.max(1, ...counts);
    const pad = Math.min(cellW, availH) * 0.08;
    const availR = Math.max(4, Math.min(cellW, availH) / 2 - pad);
    const step = this._resolveStep(opts, availR, maxCount);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const dotR = this._lastDotR;
    const cy = labelSpace + availH / 2;
    const outerRs = counts.map((n2) => step * Math.sqrt(Math.max(1, n2)) + dotR);
    const cellCentre = (i2) => slotOf[i2] >= 0 ? cellW * (slotOf[i2] + 0.5) : gw / 2;
    let centers = counts.map((_2, i2) => cellCentre(i2));
    const visOuter = visible.map((i2) => outerRs[i2]);
    let overlap = false;
    for (let s2 = 1; s2 < Kv; s2++) {
      if (centers[visible[s2]] - centers[visible[s2 - 1]] < visOuter[s2] + visOuter[s2 - 1]) {
        overlap = true;
        break;
      }
    }
    if (overlap) {
      const gap = Math.max(2 * dotR, 8);
      const totalW = visOuter.reduce((a2, r2) => a2 + 2 * r2, 0) + gap * (Kv - 1);
      let visCenters;
      if (totalW <= gw) {
        let x2 = (gw - totalW) / 2;
        visCenters = visOuter.map((r2) => {
          const c = x2 + r2;
          x2 += 2 * r2 + gap;
          return c;
        });
      } else if (Kv === 1) {
        visCenters = [gw / 2];
      } else {
        const lo = visOuter[0];
        const hi = gw - visOuter[Kv - 1];
        visCenters = visOuter.map((_2, s2) => lo + (hi - lo) * s2 / (Kv - 1));
      }
      centers = counts.map(
        (_2, i2) => slotOf[i2] >= 0 ? visCenters[slotOf[i2]] : gw / 2
      );
    }
    return counts.map((n2, i2) => ({
      i: i2,
      cx: centers[i2],
      cy,
      outerR: outerRs[i2],
      dots: this._spiral(centers[i2], cy, n2, step, 0)
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const labelSpace = 6;
    const total = Math.max(1, counts.reduce((a2, b) => a2 + b, 0));
    const availR = Math.max(
      4,
      Math.min(gw, gh - labelSpace) / 2 - Math.min(gw, gh) * 0.06
    );
    const step = this._resolveStep(opts, availR, total);
    this._lastDotR = this._dotRadiusFromStep(step, opts);
    const cx = gw / 2;
    const cy = labelSpace + (gh - labelSpace) / 2;
    const order = counts.map((_2, i2) => i2);
    if (opts.sortByGroup !== false) {
      order.sort((a2, b) => counts[a2] - counts[b]);
    }
    const clusters = counts.map((_2, i2) => ({
      i: i2,
      cx,
      cy,
      outerR: step * Math.sqrt(total) + this._lastDotR,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let gi = 0;
    order.forEach((catI) => {
      for (let j2 = 0; j2 < counts[catI]; j2++) {
        const r2 = step * Math.sqrt(gi + 0.5);
        const theta = gi * GOLDEN_ANGLE;
        clusters[catI].dots.push({
          x: cx + r2 * Math.cos(theta),
          y: cy + r2 * Math.sin(theta),
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const total = Math.max(1, counts.reduce((a2, b2) => a2 + b2, 0));
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
    const ux = (a2) => Math.sin(a2);
    const uy = (a2) => -Math.cos(a2);
    const b = this._arcBounds(a0, a1);
    const pad = Math.min(gw, gh) * 0.04;
    const boxW = Math.max(1e-6, b.maxX - b.minX);
    const boxH = Math.max(1e-6, b.maxY - b.minY);
    const r1 = Math.max(4, Math.min((gw - 2 * pad) / boxW, (gh - 2 * pad) / boxH));
    const r0 = r1 * innerRatio;
    const cx = gw / 2 - (b.minX + b.maxX) / 2 * r1;
    const cy = gh / 2 - (b.minY + b.maxY) / 2 * r1;
    const alloc = this._arcAllocate(total, r0, r1, span, opts);
    this._lastDotR = alloc.dotR;
    const seats = [];
    for (let r2 = 0; r2 < alloc.R; r2++) {
      const rho = alloc.radii[r2];
      const n2 = alloc.seatsPerRow[r2];
      for (let k2 = 0; k2 < n2; k2++) {
        const a2 = n2 === 1 ? (a0 + a1) / 2 : a0 + span * (k2 + 0.5) / n2;
        seats.push({ a: a2, x: cx + rho * ux(a2), y: cy + rho * uy(a2) });
      }
    }
    seats.sort((s1, s2) => s1.a - s2.a);
    const clusters = counts.map((_2, i2) => ({
      i: i2,
      cx,
      cy,
      outerR: r1,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let ci = 0;
    let used = 0;
    seats.forEach((s2, slot) => {
      while (ci < counts.length && used >= counts[ci]) {
        ci++;
        used = 0;
      }
      if (ci >= counts.length) return;
      clusters[ci].dots.push({ x: s2.x, y: s2.y, slot });
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
    const ux = (a2) => Math.sin(a2);
    const uy = (a2) => -Math.cos(a2);
    const lo = Math.min(a0, a1);
    const hi = Math.max(a0, a1);
    const xs = [0, ux(a0), ux(a1)];
    const ys = [0, uy(a0), uy(a1)];
    const q2 = Math.PI / 2;
    for (let k2 = Math.ceil(lo / q2); k2 * q2 <= hi; k2++) {
      xs.push(ux(k2 * q2));
      ys.push(uy(k2 * q2));
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
      for (let r2 = 0; r2 < R; r2++) {
        radii.push(R === 1 ? (r0 + r1) / 2 : r0 + (r1 - r0) * (r2 / (R - 1)));
      }
      const weightSum = radii.reduce((a2, x2) => a2 + x2, 0) || 1;
      const raw = radii.map((rho) => total * rho / weightSum);
      const seatsPerRow = raw.map((x2) => Math.floor(x2));
      let left = total - seatsPerRow.reduce((a2, x2) => a2 + x2, 0);
      raw.map((x2, idx) => ({ idx, frac: x2 - Math.floor(x2) })).sort((p, qq) => qq.frac - p.frac).forEach((o2) => {
        if (left > 0) {
          seatsPerRow[o2.idx]++;
          left--;
        }
      });
      while (left > 0) {
        seatsPerRow[R - 1]++;
        left--;
      }
      const radialPitch = R === 1 ? r1 - r0 || r1 : (r1 - r0) / (R - 1);
      let minArcPitch = Infinity;
      for (let r2 = 0; r2 < R; r2++) {
        const n2 = seatsPerRow[r2];
        if (n2 <= 0) continue;
        const arcPitch = radii[r2] * absSpan / n2;
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const labelsOn = !!(opts.clusterLabels && opts.clusterLabels.show);
    const labelsBelow = labelsOn && opts.clusterLabels.position === "bottom";
    const topPad = labelsOn && !labelsBelow ? 30 : 6;
    const visible = counts.map((_2, i2) => i2).filter((i2) => counts[i2] > 0);
    const Kv = Math.max(1, visible.length);
    const slotOf = new Array(counts.length).fill(-1);
    visible.forEach((i2, s2) => slotOf[i2] = s2);
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
    const r2 = this._lastDotR;
    const maxRows = Math.ceil(maxCount / cols);
    const tallestBarH = Math.min(availH, maxRows * pitch);
    const bottom = topPad + (availH + tallestBarH) / 2;
    return counts.map((n2, i2) => {
      const cx = slotOf[i2] >= 0 ? cellW * (slotOf[i2] + 0.5) : gw / 2;
      const rows = Math.ceil(Math.max(1, n2) / cols);
      const barH = rows * pitch;
      const left = cx - cols * pitch / 2 + pitch / 2;
      const dots = [];
      for (let j2 = 0; j2 < n2; j2++) {
        const rowIdx = Math.floor(j2 / cols);
        const colIdx = j2 % cols;
        dots.push({
          x: left + colIdx * pitch,
          y: bottom - r2 - rowIdx * pitch
        });
      }
      return {
        i: i2,
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const gcfg = opts.grid || {};
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10));
    const fillFrom = gcfg.fillFrom === "top" ? "top" : "bottom";
    const cells = gcfg.total > 0 ? this._largestRemainder(counts, Math.round(gcfg.total)) : counts.slice();
    const totalCells = cells.reduce((a2, b) => a2 + b, 0);
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
    const clusters = counts.map((_2, i2) => ({
      i: i2,
      cx: gw / 2,
      cy: labelSpace + availH / 2,
      outerR: Math.max(blockW, blockH) / 2,
      /** @type {{x:number,y:number,slot?:number}[]} */
      dots: []
    }));
    let k2 = 0;
    for (let ci = 0; ci < cells.length; ci++) {
      for (let j2 = 0; j2 < cells[ci]; j2++) {
        const col = k2 % cols;
        const rowIdx = Math.floor(k2 / cols);
        clusters[ci].dots.push({
          x: originX + col * pitch,
          y: rowY(rowIdx),
          slot: k2
        });
        k2++;
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const gcfg = opts.grid || {};
    const cols = Math.max(1, Math.round(gcfg.columns > 0 ? gcfg.columns : 10));
    const fillFrom = gcfg.fillFrom === "top" ? "top" : "bottom";
    const cellsPerTile = Math.max(1, Math.round(gcfg.total > 0 ? gcfg.total : 100));
    const rowsPerTile = Math.max(1, Math.ceil(cellsPerTile / cols));
    const visible = counts.map((_2, i2) => i2).filter((i2) => counts[i2] > 0);
    const K2 = Math.max(1, visible.length);
    const denom = gcfg.max > 0 ? gcfg.max : Math.max(1, ...counts);
    const tileCols = Math.max(
      1,
      Math.round(gcfg.tileColumns > 0 ? gcfg.tileColumns : Math.ceil(Math.sqrt(K2)))
    );
    const tileRows = Math.max(1, Math.ceil(K2 / tileCols));
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
    visible.forEach((ci, t2) => {
      const tc = t2 % tileCols;
      const tr = Math.floor(t2 / tileCols);
      const tileX = tc * tileW;
      const tileYtop = tr * tileH;
      const originX = tileX + (tileW - blockW) / 2 + pitch / 2;
      const topY = tileYtop + topBand + (availTileH - blockH) / 2;
      const cellXY = (k2) => ({
        x: originX + k2 % cols * pitch,
        y: rowY(topY, Math.floor(k2 / cols))
      });
      for (let k2 = 0; k2 < cellsPerTile; k2++) track.push(cellXY(k2));
      const filled = Math.max(
        0,
        Math.min(cellsPerTile, Math.round(counts[ci] / denom * cellsPerTile))
      );
      const dots = [];
      for (let k2 = 0; k2 < filled; k2++) {
        const p = cellXY(k2);
        dots.push({ x: p.x, y: p.y, slot: t2 * cellsPerTile + k2 });
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
    const r2 = this._lastDotR;
    const gcfg = opts.grid || {};
    const trackColor = gcfg.trackColor || "rgba(128,128,128,0.14)";
    const g = graphics.group({ class: "apexcharts-unit-track" });
    track.cells.forEach((c) => {
      let el;
      if (opts.shape === "square") {
        const side = r2 * 2;
        el = graphics.drawRect(0, 0, side, side, opts.borderRadius || 0, trackColor, 1, 0, "none");
        el.node.setAttribute("fill", trackColor);
        el.node.setAttribute("x", String(c.x - r2));
        el.node.setAttribute("y", String(c.y - r2));
      } else {
        el = graphics.drawCircle(r2, { fill: trackColor, "stroke-width": 0, stroke: "none" });
        el.node.setAttribute("fill", trackColor);
        el.node.setAttribute("cx", String(c.x));
        el.node.setAttribute("cy", String(c.y));
      }
      el.node.classList.add("apexcharts-unit-track-cell");
      g.add(el);
    });
    ret.add(g);
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
    const w = this.w;
    const scfg = opts.scatter || {};
    if (scfg.y === "value") return this._layoutScatter2D(opts);
    if (scfg.orientation === "vertical") return this._layoutScatterVertical(opts);
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const unitData = w.seriesData.unitData || [];
    const names = w.seriesData.seriesNames || [];
    const valueOf2 = (d) => this._unitValueOf(d);
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const catVals = unitData.map(
      (cat) => Array.isArray(cat) ? cat.map(valueOf2) : []
    );
    const isNum = (v) => v != null && isFinite(v);
    const visible = catVals.map((_2, i2) => i2).filter((i2) => catVals[i2].some(isNum));
    const Kv = Math.max(1, visible.length);
    let vmin = Infinity;
    let vmax = -Infinity;
    catVals.forEach(
      (vs) => vs.forEach((v) => {
        if (v != null && isFinite(v)) {
          if (v < vmin) vmin = v;
          if (v > vmax) vmax = v;
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
    const plotX = (v) => plotL + (v - xMin) / xSpan * plotW;
    const laneH = plotH / Kv;
    const laneCy = (slot) => plotT + laneH * (slot + 0.5);
    let r2 = 0;
    const fixed = this._fixedRadius(opts);
    if (fixed) {
      r2 = fixed;
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i2) => catVals[i2].filter(isNum).length)
      );
      r2 = Math.max(
        2,
        Math.min(6, laneH * 0.12, plotW / (2.5 * Math.sqrt(maxLane)))
      );
    }
    this._lastDotR = r2;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const step = Math.max(0.5, r2 * spacing);
    const jitter = scfg.spread === "jitter";
    const clusters = [];
    const lanes2 = [];
    const maxR = sizeStats ? sizeStats.rMax : r2;
    visible.forEach((ci, slot) => {
      const cy = laneCy(slot);
      lanes2.push({ i: ci, cy, name: names[ci] || `series-${ci + 1}` });
      const cat = unitData[ci] || [];
      const pts = cat.map((d, j2) => {
        const v = valueOf2(d);
        const p = { j: j2, px: plotX(isNum(v) ? v : xMin), y: cy };
        if (sizeStats) p.r = this._scatterRadius(d, sizeStats, r2);
        return p;
      });
      if (jitter) {
        const halfLane = Math.max(maxR, laneH / 2 - maxR);
        pts.forEach((p, k2) => {
          const t2 = (k2 * 9301 + 49297) % 233280 / 233280;
          p.y = cy + (t2 * 2 - 1) * halfLane;
        });
      } else {
        this._beeswarm(pts, cy, r2, step, maxR);
      }
      clusters.push({
        i: ci,
        cx: (plotL + plotR) / 2,
        cy,
        outerR: laneH / 2,
        dots: pts.map((p) => ({ x: p.px, y: p.y, r: p.r }))
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
      lanes: lanes2,
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
    const w = this.w;
    const scfg = opts.scatter || {};
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const unitData = w.seriesData.unitData || [];
    const names = w.seriesData.seriesNames || [];
    const valueOf2 = (d) => this._unitValueOf(d);
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const catVals = unitData.map(
      (cat) => Array.isArray(cat) ? cat.map(valueOf2) : []
    );
    const isNum = (v) => v != null && isFinite(v);
    const visible = catVals.map((_2, i2) => i2).filter((i2) => catVals[i2].some(isNum));
    const Kv = Math.max(1, visible.length);
    let vmin = Infinity;
    let vmax = -Infinity;
    catVals.forEach(
      (vs) => vs.forEach((v) => {
        if (v != null && isFinite(v)) {
          if (v < vmin) vmin = v;
          if (v > vmax) vmax = v;
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
    const plotY = (v) => plotB - (v - vMin) / vSpan * plotH;
    const laneW = plotW / Kv;
    const laneCx = (slot) => plotL + laneW * (slot + 0.5);
    let r2 = 0;
    const fixed = this._fixedRadius(opts);
    if (fixed) {
      r2 = fixed;
    } else {
      const maxLane = Math.max(
        1,
        ...visible.map((i2) => catVals[i2].filter(isNum).length)
      );
      r2 = Math.max(
        2,
        Math.min(6, laneW * 0.12, plotH / (2.5 * Math.sqrt(maxLane)))
      );
    }
    this._lastDotR = r2;
    const spacing = opts.spacing > 0 ? opts.spacing : 1;
    const step = Math.max(0.5, r2 * spacing);
    const jitter = scfg.spread === "jitter";
    const clusters = [];
    const lanes2 = [];
    const maxR = sizeStats ? sizeStats.rMax : r2;
    visible.forEach((ci, slot) => {
      const cx = laneCx(slot);
      lanes2.push({ i: ci, cx, name: names[ci] || `series-${ci + 1}` });
      const cat = unitData[ci] || [];
      const pts = cat.map((d, j2) => {
        const v = valueOf2(d);
        const p = { j: j2, py: plotY(isNum(v) ? v : vMin), x: cx };
        if (sizeStats) p.r = this._scatterRadius(d, sizeStats, r2);
        return p;
      });
      if (jitter) {
        const halfLane = Math.max(maxR, laneW / 2 - maxR);
        pts.forEach((p, k2) => {
          const t2 = (k2 * 9301 + 49297) % 233280 / 233280;
          p.x = cx + (t2 * 2 - 1) * halfLane;
        });
      } else {
        this._beeswarm(pts, cx, r2, step, maxR, true);
      }
      clusters.push({
        i: ci,
        cx,
        cy: (plotT + plotB) / 2,
        outerR: laneW / 2,
        dots: pts.map((p) => ({ x: p.x, y: p.py, r: p.r }))
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
      lanes: lanes2,
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
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const scfg = opts.scatter || {};
    const unitData = w.seriesData.unitData || [];
    const isNum = (v) => typeof v === "number" && isFinite(v);
    const xOf = (d) => d && typeof d === "object" ? d.x : null;
    const yOf = (d) => d && typeof d === "object" ? d.y != null ? d.y : d.value : null;
    const visible = unitData.map((_2, i2) => i2).filter(
      (i2) => (unitData[i2] || []).some((d) => isNum(xOf(d)) && isNum(yOf(d)))
    );
    let xmn = Infinity;
    let xmx = -Infinity;
    let ymn = Infinity;
    let ymx = -Infinity;
    unitData.forEach(
      (cat) => (cat || []).forEach((d) => {
        const x2 = xOf(d);
        const y = yOf(d);
        if (isNum(x2) && isNum(y)) {
          if (x2 < xmn) xmn = x2;
          if (x2 > xmx) xmx = x2;
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
    const plotX = (v) => plotL + (v - xMin) / xSpan * plotW;
    const plotY = (v) => plotB - (v - yMin) / ySpan * plotH;
    const sizeStats = this._scatterSizeStats(scfg, unitData);
    const baseR = this._fixedRadius(opts) || 5;
    this._lastDotR = baseR;
    const clusters = [];
    visible.forEach((ci) => {
      const cat = unitData[ci] || [];
      const dots = cat.map((d) => {
        const x2 = xOf(d);
        const y = yOf(d);
        return {
          x: plotX(isNum(x2) ? x2 : xMin),
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
    const mkTicks = (lo, hi, span, spacing, pinned, n2) => {
      const out = [];
      if (pinned) {
        for (let k2 = 0; k2 < n2; k2++) out.push(lo + span * k2 / (n2 - 1));
      } else {
        const sp = spacing || span / Math.max(1, n2 - 1);
        for (let v = lo; v <= hi + sp * 0.5; v += sp) {
          out.push(Math.abs(v) < sp * 1e-9 ? 0 : v);
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
        const z2 = d && typeof d === "object" ? d[field] : null;
        if (typeof z2 === "number" && isFinite(z2)) {
          if (z2 < zmin) zmin = z2;
          if (z2 > zmax) zmax = z2;
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
    const z2 = d && typeof d === "object" ? d[st.field] : null;
    if (typeof z2 !== "number" || !isFinite(z2)) return st.rMin;
    const t2 = st.zmax > st.zmin ? (z2 - st.zmin) / (st.zmax - st.zmin) : 1;
    const tc = Math.max(0, Math.min(1, t2));
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
    const order = pts.slice().sort((a2, b) => a2[fk] - b[fk]);
    const placed = [];
    const rCap = maxR != null ? maxR : rFallback;
    order.forEach((p) => {
      const pr = p.r != null ? p.r : rFallback;
      let chosen = 0;
      for (let k2 = 0; k2 < 2e3; k2++) {
        const off = k2 === 0 ? 0 : Math.ceil(k2 / 2) * step * (k2 % 2 ? 1 : -1);
        const s2 = center + off;
        let ok = true;
        for (let m = placed.length - 1; m >= 0; m--) {
          const q2 = placed[m];
          const df = p[fk] - q2.f;
          if (df > pr + rCap) break;
          const need = pr + q2.r;
          const ds = s2 - q2.s;
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
      p[sk] = center + chosen;
      placed.push({ f: p[fk], s: p[sk], r: pr });
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
      for (let v = min; v <= max + spacing2 * 0.5; v += spacing2) {
        ticks.push(Math.abs(v) < spacing2 * 1e-9 ? 0 : v);
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
    const w = this.w;
    if (!Environment.isBrowser()) return;
    const ax = this._scatterAxis;
    if (!ax) return;
    const NS = "http://www.w3.org/2000/svg";
    const g = graphics.group({ class: "apexcharts-unit-axis" });
    const gridColor = w.config.grid && w.config.grid.borderColor || "rgba(128,128,128,0.18)";
    const axisColor = "rgba(128,128,128,0.5)";
    const cfgColors = w.config.xaxis && w.config.xaxis.labels && w.config.xaxis.labels.style && w.config.xaxis.labels.style.colors;
    const configuredLabelColor = Array.isArray(cfgColors) ? cfgColors[0] : cfgColors;
    const labelColor = configuredLabelColor || "rgba(120,130,140,0.9)";
    const line = (x1, y1, x2, y2, stroke2) => {
      const l2 = BrowserAPIs.createElementNS(NS, "line");
      l2.setAttribute("x1", String(x1));
      l2.setAttribute("y1", String(y1));
      l2.setAttribute("x2", String(x2));
      l2.setAttribute("y2", String(y2));
      l2.setAttribute("stroke", stroke2);
      l2.setAttribute("shape-rendering", "crispEdges");
      g.node.appendChild(l2);
    };
    const text = (str, x2, y, anchor, fill, size, weight, cls) => {
      const t2 = BrowserAPIs.createElementNS(NS, "text");
      t2.setAttribute("class", cls);
      t2.setAttribute("x", String(x2));
      t2.setAttribute("y", String(y));
      t2.setAttribute("text-anchor", anchor);
      t2.setAttribute("dominant-baseline", "middle");
      t2.setAttribute("font-size", `${size}px`);
      t2.setAttribute("font-family", w.config.chart.fontFamily || "inherit");
      t2.setAttribute("font-weight", String(weight));
      t2.setAttribute("fill", fill);
      t2.textContent = str;
      g.node.appendChild(t2);
    };
    if (ax.mode === "2d") {
      ax.yTicks.forEach((v) => {
        const y = ax.plotY(v);
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor);
        const label2 = ax.yFormatter ? String(ax.yFormatter(v)) : this._formatTick(v);
        text(label2, ax.plotL - 8, y, "end", labelColor, 11, 400, "apexcharts-unit-tick");
      });
      ax.xTicks.forEach((v) => {
        const x2 = ax.plotX(v);
        if (ax.gridlines) line(x2, ax.plotT, x2, ax.plotB, gridColor);
        const label2 = ax.xFormatter ? String(ax.xFormatter(v)) : this._formatTick(v);
        text(label2, x2, ax.plotB + 14, "middle", labelColor, 11, 400, "apexcharts-unit-tick");
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
        yt.setAttribute("font-family", w.config.chart.fontFamily || "inherit");
        yt.setAttribute("font-weight", "600");
        yt.setAttribute("fill", labelColor);
        yt.setAttribute("transform", `rotate(-90 ${tx} ${ty})`);
        yt.textContent = String(ax.yTitle);
        g.node.appendChild(yt);
      }
      ret.add(g);
      return;
    }
    if (ax.orientation === "vertical") {
      ax.ticks.forEach((v) => {
        const y = ax.plotY(v);
        if (ax.gridlines) line(ax.plotL, y, ax.plotR, y, gridColor);
        const label2 = ax.formatter ? String(ax.formatter(v)) : this._formatTick(v);
        text(label2, ax.plotL - 8, y, "end", labelColor, 11, 400, "apexcharts-unit-tick");
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
        yt.setAttribute("font-family", w.config.chart.fontFamily || "inherit");
        yt.setAttribute("font-weight", "600");
        yt.setAttribute("fill", labelColor);
        yt.setAttribute("transform", `rotate(-90 ${tx} ${ty})`);
        yt.textContent = String(ax.valueTitle);
        g.node.appendChild(yt);
      }
      ax.lanes.forEach((lane) => {
        const color = configuredLabelColor || w.globals.colors[lane.i] || w.globals.colors[0] || "#008FFB";
        text(lane.name, lane.cx, ax.plotB + 16, "middle", color, 12, 600, "apexcharts-unit-lane-label");
      });
      ret.add(g);
      return;
    }
    ax.ticks.forEach((v, idx) => {
      const x2 = ax.plotX(v);
      if (ax.gridlines) line(x2, ax.plotT, x2, ax.plotB, gridColor);
      const label2 = ax.formatter ? String(ax.formatter(v)) : this._formatTick(v);
      const anchor = idx === 0 ? "start" : idx === ax.ticks.length - 1 ? "end" : "middle";
      text(label2, x2, ax.plotB + 14, anchor, labelColor, 11, 400, "apexcharts-unit-tick");
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
        const color = configuredLabelColor || w.globals.colors[lane.i] || w.globals.colors[0] || "#008FFB";
        text(lane.name, ax.plotL - 8, lane.cy, "end", color, 12, 600, "apexcharts-unit-lane-label");
      });
    }
    ret.add(g);
  }
  /**
   * Compact tick-value formatting: integers as-is, otherwise trimmed to a short
   * decimal; large magnitudes get a k/M suffix.
   * @param {number} v @returns {string}
   */
  _formatTick(v) {
    if (!isFinite(v)) return "";
    const a2 = Math.abs(v);
    if (a2 >= 1e6) return `${+(v / 1e6).toFixed(1)}M`;
    if (a2 >= 1e4) return `${+(v / 1e3).toFixed(1)}k`;
    if (Number.isInteger(v)) return String(v);
    return String(+v.toFixed(2));
  }
  /**
   * Distribute `total` whole cells across `counts` in proportion to each value,
   * using the largest-remainder method so the parts sum to exactly `total`
   * (used by the grid/waffle percentage mode).
   * @param {number[]} counts @param {number} total @returns {number[]}
   */
  _largestRemainder(counts, total) {
    const sum2 = counts.reduce((a2, b) => a2 + b, 0);
    if (sum2 <= 0 || total <= 0) return counts.map(() => 0);
    const exact = counts.map((c) => c / sum2 * total);
    const floors = exact.map((v) => Math.floor(v));
    const used = floors.reduce((a2, b) => a2 + b, 0);
    const remaining = Math.max(0, total - used);
    const byFrac = exact.map((v, i2) => ({ i: i2, frac: v - Math.floor(v) })).sort((a2, b) => b.frac - a2.frac);
    const out = floors.slice();
    for (let n2 = 0; n2 < remaining && n2 < byFrac.length; n2++) {
      out[byFrac[n2].i]++;
    }
    return out;
  }
  /**
   * Phyllotaxis (sunflower) placement for `n` points around (cx, cy).
   * @param {number} cx @param {number} cy @param {number} n
   * @param {number} step @param {number} startIndex
   * @returns {{x:number,y:number}[]}
   */
  _spiral(cx, cy, n2, step, startIndex) {
    const pts = [];
    for (let k2 = 0; k2 < n2; k2++) {
      const idx = startIndex + k2;
      const r2 = step * Math.sqrt(idx + 0.5);
      const theta = idx * GOLDEN_ANGLE;
      pts.push({ x: cx + r2 * Math.cos(theta), y: cy + r2 * Math.sin(theta) });
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
      const v = d.value != null ? d.value : d.y;
      return typeof v === "number" ? v : null;
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
  _radiusForValue(v, stats) {
    if (v == null || !isFinite(v)) return stats.minR;
    const t2 = stats.max > stats.min ? (v - stats.min) / (stats.max - stats.min) : 1;
    const tc = Math.max(0, Math.min(1, t2));
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
        const v = this._unitValueOf(d);
        if (v != null && isFinite(v)) {
          if (v < vmin) vmin = v;
          if (v > vmax) vmax = v;
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
  _halfExtent(opts, r2) {
    if (opts.shape === "image" && opts.image) {
      return { hx: (opts.image.width || 20) / 2, hy: (opts.image.height || 20) / 2 };
    }
    const rr = r2 != null ? r2 : this._lastDotR;
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
  _place(node, spec, x2, y) {
    const s2 = (
      /** @type {any} */
      spec
    );
    if (s2.pk === PK_GLYPH) {
      node.setAttribute(
        "transform",
        "translate(" + (x2 - s2.ox) + "," + (y - s2.oy) + s2.tail
      );
    } else if (s2.pk === PK_CORNER) {
      node.setAttribute("x", String(x2 - s2.hx));
      node.setAttribute("y", String(y - s2.hy));
    } else {
      node.setAttribute("cx", String(x2));
      node.setAttribute("cy", String(y));
    }
  }
  /**
   * The spec for the chart-wide shape (no pictogram, no per-mark radius).
   * @param {any} opts @param {number} [r]
   * @returns {UnitMarkSpec}
   */
  _baseSpec(opts, r2) {
    const rr = r2 != null ? r2 : this._lastDotR;
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
    const s2 = ref.trim();
    if (s2[0] === "M" || s2[0] === "m") return normalizeUnitMark(s2);
    const found = getUnitMark(s2);
    if (found) return found;
    if (!this._markWarned) this._markWarned = /* @__PURE__ */ new Set();
    if (!this._markWarned.has(s2)) {
      this._markWarned.add(s2);
      console.warn(
        `[ApexCharts] unit chart: no mark named "${s2}" is registered. Register one with ApexCharts.registerUnitMark("${s2}", pathData), or import a catalog from 'apexcharts/pictograms'.`
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
    const s2 = pcfg.fit === "width" ? box / vb[2] : pcfg.fit === "height" ? box / vb[3] : box / Math.max(vb[2], vb[3]);
    const spec = Object.freeze({
      pk: PK_GLYPH,
      mark,
      d: mark.path,
      fillRule: mark.fillRule,
      s: s2,
      ox: (vb[0] + vb[2] / 2) * s2,
      oy: (vb[1] + vb[3] / 2) * s2,
      tail: ") scale(" + s2 + ")",
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
  _markSpecFor(opts, datum, i2, r2) {
    if (opts.shape !== "pictogram") return this._baseSpec(opts, r2);
    const pcfg = opts.pictogram || {};
    const own = datum && typeof datum === "object" ? datum.mark : void 0;
    const cfg = Array.isArray(pcfg.mark) ? pcfg.mark[i2 % pcfg.mark.length] : pcfg.mark;
    const mark = this._resolveMark(own != null ? own : cfg);
    if (mark) return this._glyphSpec(mark, r2, pcfg);
    return this._baseSpec(
      __spreadProps(__spreadValues({}, opts), { shape: pcfg.fallback === "square" ? "square" : "circle" }),
      r2
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
  _drawDot(graphics, opts, dotR, color, i2, j2, spec) {
    const w = this.w;
    const strokeW = w.config.stroke.show ? w.config.stroke.width : 0;
    const strokeColor = Array.isArray(w.globals.stroke.colors) ? w.globals.stroke.colors[i2] || "none" : "none";
    const fillOpacity = typeof w.config.fill.opacity === "number" ? w.config.fill.opacity : 1;
    let el;
    if (spec && spec.pk === PK_GLYPH) {
      el = w.dom.Paper.path(spec.d);
      el.node.setAttribute("fill", color);
      if (spec.fillRule === "evenodd") {
        el.node.setAttribute("fill-rule", "evenodd");
      }
      if (fillOpacity < 1) el.node.setAttribute("fill-opacity", String(fillOpacity));
      el.node.setAttribute("data:r", String(spec.r));
    } else if (opts.shape === "image" && opts.image && opts.image.src) {
      const iw = opts.image.width || 20;
      const ih = opts.image.height || 20;
      el = w.dom.Paper.image(opts.image.src);
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
    el.node.setAttribute("i", String(i2));
    el.node.setAttribute("j", String(j2));
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
    const w = this.w;
    const NS = "http://www.w3.org/2000/svg";
    const safe = String(color).replace(/[^a-zA-Z0-9]/g, "");
    const id = `apexcharts-unit-tint-${w.globals.chartID}-${safe}`;
    const svg = w.dom.Paper.node;
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
  _placeDot(node, opts, x2, y, spec) {
    this._place(node, spec || this._baseSpec(opts), x2, y);
  }
  /**
   * Parse a `#rgb` / `#rrggbb` / `rgb()` / `rgba()` colour to `[r, g, b]`, or
   * null if it cannot be parsed (the colour tween is then skipped).
   * @param {string} str @returns {number[] | null}
   */
  _rgb(str) {
    if (typeof str !== "string") return null;
    let s2 = str.trim();
    if (s2[0] === "#") {
      if (s2.length === 4) s2 = "#" + s2[1] + s2[1] + s2[2] + s2[2] + s2[3] + s2[3];
      const n2 = parseInt(s2.slice(1, 7), 16);
      if (isNaN(n2)) return null;
      return [n2 >> 16 & 255, n2 >> 8 & 255, n2 & 255];
    }
    const m = s2.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(",").map((x2) => parseFloat(x2));
      if (p.length >= 3 && p.every((v) => !isNaN(v))) return [p[0], p[1], p[2]];
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
    const w = this.w;
    const anim = w.config.chart.animations;
    if (!Environment.isBrowser()) return false;
    if (!anim || anim.enabled === false) return false;
    if (w.globals.shouldAnimate === false) return false;
    if (w.globals.resized && !w.globals.dataChanged) return false;
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
    for (let k2 = 0; k2 < dots.length; k2++) {
      const d = dots[k2];
      const carried = live && !d.isEnter && d.key != null ? live.get(d.key) : null;
      const sx = carried ? carried.x : $(d.cx0, stiffness, damping);
      const sy = carried ? carried.y : $(d.cy0, stiffness, damping);
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
    const w = this.w;
    const opts = w.config.plotOptions.unit;
    const speed = Math.max(1, w.config.chart.animations.speed || 800);
    const maxDelay = Math.min(speed * 0.6, 450);
    const n2 = dots.length;
    for (let k2 = 0; k2 < n2; k2++) {
      dots[k2].delay = n2 > 1 ? k2 / (n2 - 1) * maxDelay : 0;
    }
    const gcfg = opts.gather || {};
    const motion = gcfg.motion || "auto";
    const useSpring = motion === "spring" || motion === "auto" && (!gcfg.easing || gcfg.easing === "outCubic");
    if (useSpring) this._seedSprings(dots, gcfg, speed);
    else if (this.ctx) this.ctx._unitSprings = null;
    for (let k2 = 0; k2 < n2; k2++) {
      const d = dots[k2];
      if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
        d.node.setAttribute("r", String(d.r0));
      }
    }
    for (let k2 = 0; k2 < n2; k2++) {
      const d = dots[k2];
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
      for (let k2 = 0; k2 < n2; k2++) {
        const d = dots[k2];
        const elapsed = now - start - d.delay;
        const t2 = Math.max(0, Math.min(1, elapsed / speed));
        const ec = easeOutCubic(t2);
        let cx, cy;
        if (d.sx && d.sy) {
          if (elapsed >= 0 && !d.released) {
            _(d.sx, d.x);
            _(d.sy, d.y);
            d.released = true;
          }
          const restX = q(d.sx, dt);
          const restY = q(d.sy, dt);
          if (!d.released || !restX || !restY) done = false;
          cx = d.sx.value;
          cy = d.sy.value;
        } else {
          const e2 = easePos(t2);
          cx = d.cx0 + (d.x - d.cx0) * e2;
          cy = d.cy0 + (d.y - d.cy0) * e2;
        }
        this._place(d.node, d.spec, cx, cy);
        if (d.isEnter) d.node.style.opacity = String(Math.min(1, t2 * 2.5));
        if (d._c0 && d._c1) {
          const cr = Math.round(d._c0[0] + (d._c1[0] - d._c0[0]) * ec);
          const cg = Math.round(d._c0[1] + (d._c1[1] - d._c0[1]) * ec);
          const cb = Math.round(d._c0[2] + (d._c1[2] - d._c0[2]) * ec);
          d.node.setAttribute("fill", `rgb(${cr},${cg},${cb})`);
        }
        if (d.spec.pk === PK_CIRCLE && d.r0 != null && d.r1 != null && d.r0 !== d.r1) {
          d.node.setAttribute("r", String(d.r0 + (d.r1 - d.r0) * ec));
        }
        if (t2 < 1) done = false;
      }
      if (done) {
        for (let k2 = 0; k2 < n2; k2++) {
          const d = dots[k2];
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
  _runExits(group2, exits, opts) {
    const w = this.w;
    const graphics = new Graphics(w, this.ctx);
    const dotR = this._lastDotR;
    const cx = w.layout.gridWidth / 2;
    const cy = w.layout.gridHeight / 2;
    const drift = opts.layout === "grid" || opts.layout === "scatter" || opts.layout === "arc" || opts.layout === "custom" ? 0 : 0.35;
    const ghosts = [];
    exits.forEach((slot) => {
      const r2 = slot.r != null ? slot.r : dotR;
      const spec = slot.spec || this._baseSpec(opts, r2);
      const el = this._drawDot(graphics, opts, r2, slot.fill, 0, 0, spec);
      el.node.classList.add("apexcharts-unit-exit");
      this._place(el.node, spec, slot.x, slot.y);
      group2.add(el);
      ghosts.push({ node: el.node, x0: slot.x, y0: slot.y, spec });
    });
    if (!this._shouldAnimate()) {
      ghosts.forEach((g) => g.node.remove());
      return;
    }
    const speed = Math.max(1, w.config.chart.animations.speed || 800);
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
      const t2 = Math.max(0, Math.min(1, (now - start) / speed));
      const e2 = easeOutCubic(t2);
      for (let k2 = 0; k2 < ghosts.length; k2++) {
        const g = ghosts[k2];
        if (drift) {
          const x2 = g.x0 + (cx - g.x0) * e2 * drift;
          const y = g.y0 + (cy - g.y0) * e2 * drift;
          this._place(g.node, g.spec, x2, y);
        }
        g.node.style.opacity = String(1 - e2);
      }
      if (t2 < 1) {
        this.w.globals.unitExitRAF = BrowserAPIs.requestAnimationFrame(stepFn);
      } else {
        this.w.globals.unitExitRAF = null;
        group2.node && group2.node.remove();
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
  _outerLabelLines(i2, value, total, opts) {
    const w = this.w;
    const name = w.seriesData.seriesNames[i2] || `series-${i2 + 1}`;
    const percent2 = total > 0 ? value / total * 100 : 0;
    const cfg = opts.clusterLabels;
    const text = typeof cfg.formatter === "function" ? cfg.formatter(name, { seriesIndex: i2, value, percent: percent2, w }) : `${name}
${percent2.toFixed(1)}%`;
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
    const w = this.w;
    const cfg = opts.clusterLabels;
    const conn = cfg.external.connector || {};
    const total = counts.reduce((a2, b) => a2 + b, 0);
    const lines = [];
    counts.forEach((c, i2) => {
      if (c > 0) lines.push(...this._outerLabelLines(i2, c, total, opts));
    });
    if (!lines.length) return 0;
    const width = measureLabelWidth(w, lines, {
      fontSize: cfg.fontSize,
      fontFamily: cfg.fontFamily || w.config.chart.fontFamily
    });
    const gap = conn.gap != null ? conn.gap : 8;
    const length = conn.length != null ? conn.length : 22;
    const room = width + gap + length + 8 + Math.abs(parseFloat(cfg.external.offsetX) || 0);
    return Math.min(room, w.layout.gridWidth * 0.25);
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
    const w = this.w;
    if (!Environment.isBrowser()) return;
    const cfg = opts.clusterLabels;
    const ext = cfg.external;
    const conn = ext.connector || {};
    const gap = conn.gap != null ? conn.gap : 8;
    const length = conn.length != null ? conn.length : 22;
    const offsetX = parseFloat(ext.offsetX) || 0;
    const offsetY = parseFloat(ext.offsetY) || 0;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
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
    live.slice().sort((a2, b) => a2.cy - b.cy).forEach((c, k2) => {
      const lines = this._outerLabelLines(c.i, counts[c.i], total, opts);
      if (!lines.some((l2) => l2 !== "")) return;
      const side = bandedByX ? c.cx >= gw / 2 ? "right" : "left" : k2 % 2 === 0 ? "right" : "left";
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
    const maxLines = items.reduce((m, it) => Math.max(m, it.lines.length), 1);
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
    const group2 = new Graphics(w, this.ctx).group({
      class: "apexcharts-unit-outer-labels"
    });
    if (gathering) {
      const speed = Math.max(1, w.config.chart.animations.speed || 800);
      group2.node.classList.add("apexcharts-unit-label-delay");
      group2.node.style.animationDelay = `${Math.min(speed * 0.45, 600) / 1e3}s`;
    }
    items.forEach((it) => {
      const color = w.globals.colors[it.i] || w.globals.colors[0] || "#008FFB";
      group2.add(
        drawOuterLabel(w, {
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
            fontFamily: cfg.fontFamily || w.config.chart.fontFamily,
            fontWeight: cfg.fontWeight
          },
          foreColor: cfg.color || w.config.chart.foreColor,
          groupClass: "apexcharts-unit-outer-label-group",
          textClass: "apexcharts-unit-outer-label",
          connectorClass: "apexcharts-unit-label-connector"
        })
      );
    });
    ret.add(group2);
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
    const w = this.w;
    if (!Environment.isBrowser()) return;
    const NS = "http://www.w3.org/2000/svg";
    const name = w.seriesData.seriesNames[cluster.i] || `series-${cluster.i + 1}`;
    const percent2 = total > 0 ? value / total * 100 : 0;
    const cfg = opts.clusterLabels;
    const fontSize = parseFloat(cfg.fontSize) || 13;
    let text;
    if (typeof cfg.formatter === "function") {
      text = cfg.formatter(name, {
        seriesIndex: cluster.i,
        value,
        percent: percent2,
        w
      });
    } else {
      text = `${name} (${percent2.toFixed(1)}%)`;
    }
    const str = typeof text === "string" ? text : String(text);
    const textEl = BrowserAPIs.createElementNS(NS, "text");
    textEl.setAttribute("class", "apexcharts-unit-label");
    textEl.setAttribute("text-anchor", "middle");
    textEl.setAttribute("font-size", `${fontSize}px`);
    textEl.setAttribute("font-family", cfg.fontFamily || w.config.chart.fontFamily || "inherit");
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
      const arcId = `apexcharts-unit-label-${w.globals.chartID}-${cluster.i}`;
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
ApexCharts__default.use({
  unit: Unit
});
const D2R$1 = Math.PI / 180;
const R2D$1 = 180 / Math.PI;
function arcPoint(cx, cy, radius, deg) {
  return {
    x: cx + radius * Math.cos((deg - 90) * D2R$1),
    y: cy + radius * Math.sin((deg - 90) * D2R$1)
  };
}
const xy = (p) => `${p.x} ${p.y}`;
function roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r: r2, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const degOut = r2 / rOut * R2D$1;
  const degIn = r2 / rIn * R2D$1;
  const oStart = ptAt(rOut, a0 + degOut);
  const oEnd = ptAt(rOut, a1 - degOut);
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0;
  const ocEnd = ptAt(rOut, a1);
  const rEndOut = ptAt(rOut - r2, a1);
  const ocStart = ptAt(rOut, a0);
  const rStartOut = ptAt(rOut - r2, a0);
  const iEnd = ptAt(rIn, a1 - degIn);
  const iStart = ptAt(rIn, a0 + degIn);
  const largeIn = spanDeg - 2 * degIn > 180 ? 1 : 0;
  const icEnd = ptAt(rIn, a1);
  const rEndIn = ptAt(rIn + r2, a1);
  const icStart = ptAt(rIn, a0);
  const rStartIn = ptAt(rIn + r2, a0);
  return [
    "M",
    xy(oStart),
    "A",
    rOut,
    rOut,
    0,
    largeOut,
    1,
    xy(oEnd),
    "Q",
    xy(ocEnd),
    xy(rEndOut),
    "L",
    xy(rEndIn),
    "Q",
    xy(icEnd),
    xy(iEnd),
    "A",
    rIn,
    rIn,
    0,
    largeIn,
    0,
    xy(iStart),
    "Q",
    xy(icStart),
    xy(rStartIn),
    "L",
    xy(rStartOut),
    "Q",
    xy(ocStart),
    xy(oStart),
    "Z"
  ].join(" ");
}
function sharpDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const largeArc = spanDeg > 180 ? 1 : 0;
  const A2 = ptAt(rOut, a0);
  const B = ptAt(rOut, a1);
  const C2 = ptAt(rIn, a1);
  const Din = ptAt(rIn, a0);
  return [
    "M",
    xy(A2),
    "A",
    rOut,
    rOut,
    0,
    largeArc,
    1,
    xy(B),
    "L",
    xy(C2),
    "A",
    rIn,
    rIn,
    0,
    largeArc,
    0,
    xy(Din),
    "Z"
  ].join(" ");
}
function drilldownById(w, id) {
  const dd = w.config.drilldown;
  const list = dd && Array.isArray(dd.series) ? dd.series : [];
  return list.find((s2) => s2 && s2.id === id);
}
function toNode(w, d, i2, paletteFromParent, parentKey, seenIds = null, opts = {}) {
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
    _key: `${parentKey}/${i2}:${name}`
  };
  if (paletteFromParent && !node.color) {
    node.color = paletteFromParent[i2 % paletteFromParent.length];
  }
  if (opts.keepDatum) node._datum = d;
  if (isObj && Array.isArray(d.children) && d.children.length) {
    node.children = d.children.map(
      (c, j2) => toNode(w, c, j2, null, node._key, seenIds, opts)
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
          (c, j2) => toNode(w, c, j2, palette, node._key, nextSeen, opts)
        );
      }
    }
  }
  return node;
}
function buildHierarchy(w, opts = {}) {
  const cfgSeries = (
    /** @type {any} */
    w.config.series
  );
  const first = cfgSeries && cfgSeries[0];
  const data = first && Array.isArray(first.data) ? first.data : cfgSeries;
  if (!Array.isArray(data)) return [];
  return data.map(
    (d, i2) => toNode(w, d, i2, null, "", null, opts)
  );
}
function fillValues(node) {
  if (node.children && node.children.length) {
    node.children.forEach((c) => fillValues(c));
    if (node.value == null || isNaN(node.value)) {
      node.value = node.children.reduce(
        (s2, c) => s2 + Math.max(0, c.value || 0),
        0
      );
    }
  }
  if (node.value == null || isNaN(node.value)) node.value = 0;
}
function morphKey(key) {
  if (typeof key !== "string") return "";
  const i2 = key.indexOf("/");
  return i2 === -1 ? "" : key.slice(i2);
}
const XHTML$3 = "http://www.w3.org/1999/xhtml";
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
  }, shared), {});
}
function avoidChromeOverlap(w, nav) {
  const chrome = (
    /** @type {Element[]} */
    [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s2) => w.dom.baseEl.querySelector(s2)).filter((el) => el !== null)
  );
  if (!chrome.length) return;
  const wrapTop = w.dom.elWrap.getBoundingClientRect().top;
  for (let pass = 0; pass < chrome.length + 1; pass++) {
    const nr = nav.getBoundingClientRect();
    const hit = chrome.find((el) => {
      const r2 = el.getBoundingClientRect();
      return nr.left < r2.right && nr.right > r2.left && nr.top < r2.bottom && nr.bottom > r2.top;
    });
    if (!hit) break;
    nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`;
  }
}
function breadcrumbCeiling(w, nav) {
  const gridTop = w.layout.translateY || 0;
  const elWrap = w.dom.elWrap;
  if (!elWrap) return gridTop;
  const labels = w.dom.baseEl.querySelectorAll(".apexcharts-yaxis-label");
  if (!labels.length) return gridTop;
  const wrapTop = elWrap.getBoundingClientRect().top;
  const navRect = nav.getBoundingClientRect();
  let ceiling = gridTop;
  for (let i2 = 0; i2 < labels.length; i2++) {
    const r2 = labels[i2].getBoundingClientRect();
    if (!r2.height) continue;
    if (r2.left >= navRect.right || r2.right <= navRect.left) continue;
    ceiling = Math.min(ceiling, r2.top - wrapTop);
  }
  return ceiling;
}
function placeInReservedBand(w, ctx, nav, cfg) {
  var _a;
  const dimHelpers = (_a = ctx == null ? void 0 : ctx.dimensions) == null ? void 0 : _a.dimHelpers;
  const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
  const navH = nav.getBoundingClientRect().height || BREADCRUMB_HEIGHT;
  const offsetY = cfg && cfg.offsetY || 0;
  const ceiling = breadcrumbCeiling(w, nav);
  if (ceiling - titleArea >= navH + 1) {
    nav.style.top = `${ceiling - navH - 1 + offsetY}px`;
    return true;
  }
  nav.style.top = `${titleArea + offsetY}px`;
  const dark = w.config.theme.mode === "dark";
  nav.style.background = dark ? "rgba(20,24,30,0.82)" : "rgba(255,255,255,0.86)";
  nav.style.borderRadius = "4px";
  return false;
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
  const nav = BrowserAPIs.createElementNS(XHTML$3, "nav");
  nav.setAttribute("class", "apexcharts-breadcrumb");
  nav.setAttribute("aria-label", opts.ariaLabel || "Breadcrumb");
  positionBreadcrumb(nav, cfg);
  if (opts.compact) {
    nav.style.fontSize = "11px";
    nav.style.padding = "0 2px";
  }
  const separator = cfg.separator != null ? cfg.separator : " / ";
  crumbs.forEach((crumb, i2) => {
    var _a;
    if (i2 > 0) {
      const sep = BrowserAPIs.createElementNS(XHTML$3, "span");
      sep.setAttribute("class", "apexcharts-breadcrumb-separator");
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = separator;
      nav.appendChild(sep);
    }
    let label2 = i2 === 0 ? (_a = cfg.rootLabel) != null ? _a : "All" : crumb.label;
    if (typeof cfg.formatter === "function") {
      label2 = cfg.formatter(label2, {
        index: i2,
        depth: crumbs.length - 1,
        data: crumb.data
      });
    }
    if (i2 === crumbs.length - 1) {
      const cur = BrowserAPIs.createElementNS(XHTML$3, "span");
      cur.setAttribute(
        "class",
        "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
      );
      cur.setAttribute("aria-current", "page");
      cur.textContent = String(label2);
      nav.appendChild(cur);
      return;
    }
    const btn = (
      /** @type {HTMLButtonElement} */
      BrowserAPIs.createElementNS(XHTML$3, "button")
    );
    btn.setAttribute("type", "button");
    btn.setAttribute("class", "apexcharts-breadcrumb-item");
    if (i2 === 0) {
      const arrow2 = BrowserAPIs.createElementNS(XHTML$3, "span");
      arrow2.setAttribute("class", "apexcharts-breadcrumb-arrow");
      arrow2.setAttribute("aria-hidden", "true");
      arrow2.textContent = "←";
      btn.appendChild(arrow2);
    }
    const text = BrowserAPIs.createElementNS(XHTML$3, "span");
    text.setAttribute("class", "apexcharts-breadcrumb-label");
    text.textContent = String(label2);
    btn.appendChild(text);
    btn.addEventListener("click", () => opts.onNavigate(i2, crumb));
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
function placeSubtree(node, vDepth, t0, t1, parent, state2) {
  node._show = true;
  node._vDepth = vDepth;
  node._t0 = t0;
  node._t1 = t1;
  node._parent = parent;
  node._leaf = !(node.children && node.children.length);
  node._clipped = !node._leaf && state2.cap != null && vDepth >= state2.cap;
  if (vDepth > state2.maxDepth) state2.maxDepth = vDepth;
  if (node._leaf || node._clipped) return;
  const total = node.children.reduce(
    (s2, c) => s2 + Math.max(0, c.value),
    0
  );
  const denom = total || 1;
  let t2 = t0;
  for (let i2 = 0; i2 < node.children.length; i2++) {
    const c = node.children[i2];
    const span = (t1 - t0) * Math.max(0, c.value) / denom;
    placeSubtree(c, vDepth + 1, t2, t2 + span, node, state2);
    t2 += span;
  }
}
function placeTree({ roots, nodesAll, focus, t0, t1, cap }) {
  for (let i2 = 0; i2 < nodesAll.length; i2++) nodesAll[i2]._show = false;
  const state2 = { maxDepth: 0, cap };
  if (focus) {
    placeSubtree(focus, 0, t0, t1, focus._parent, state2);
    return state2.maxDepth;
  }
  const total = roots.reduce(
    (s2, r2) => s2 + Math.max(0, r2.value),
    0
  );
  const denom = total || 1;
  let t2 = t0;
  for (let i2 = 0; i2 < roots.length; i2++) {
    const span = (t1 - t0) * Math.max(0, roots[i2].value) / denom;
    placeSubtree(roots[i2], 0, t2, t2 + span, null, state2);
    t2 += span;
  }
  return state2.maxDepth;
}
function sortTree(roots, sort) {
  if (sort !== "value" && sort !== "name") return;
  const cmp = sort === "value" ? (a2, b) => (b.value || 0) - (a2.value || 0) : (a2, b) => String(a2.name).localeCompare(String(b.name));
  const walk = (list) => {
    list.sort(cmp);
    for (let i2 = 0; i2 < list.length; i2++) {
      if (list[i2].children && list[i2].children.length) walk(list[i2].children);
    }
  };
  walk(roots);
}
function bandScale({ maxDepth, near, far, gap = 0 }) {
  const count = maxDepth + 1;
  const band = (far - near) / count;
  const g = count > 1 ? gap : 0;
  return {
    near: (vDepth) => near + vDepth * band + (vDepth > 0 ? g / 2 : 0),
    far: (vDepth) => near + (vDepth + 1) * band - g / 2
  };
}
function farEdge(node, scale, maxDepth, leafMode, edge) {
  return node._leaf && leafMode === "extend" && node._vDepth < maxDepth ? edge : scale.far(node._vDepth);
}
function validateStrict(roots, { type, remedy }) {
  let warned2 = false;
  const walk = (node) => {
    if (node.children && node.children.length) {
      const sum2 = node.children.reduce(
        (s2, c) => s2 + Math.max(0, c.value || 0),
        0
      );
      if (!warned2 && node.value != null && Math.abs(sum2 - node.value) > 0.5) {
        console.warn(
          `ApexCharts ${type}: partition 'strict' but "${node.name}" (${node.value}) != sum of its children (${sum2}). ${remedy}`
        );
        warned2 = true;
      }
      node.children.forEach(walk);
    }
  };
  roots.forEach(walk);
}
function focusChain(focus) {
  const chain = [];
  let n2 = focus;
  while (n2) {
    chain.unshift(n2);
    n2 = n2._parent;
  }
  return chain;
}
function resolveFocus(node, current, roots) {
  let next = node === current ? node._parent || null : node;
  if (next && !(next.children && next.children.length)) {
    next = next._parent || null;
  }
  if (roots && roots.length === 1 && next === roots[0]) next = null;
  if (next === current) return { changed: false, focus: current };
  return { changed: true, focus: next };
}
function parseSize(size, max, fallbackRatio = 0) {
  if (typeof size === "number") return size;
  const s2 = String(size).trim();
  if (s2.endsWith("%")) return parseFloat(s2) / 100 * max;
  const n2 = parseFloat(s2);
  return isNaN(n2) ? fallbackRatio * max : n2;
}
function lighten(color, amount) {
  if (typeof color !== "string" || color[0] !== "#") return color;
  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return color;
  const num = parseInt(hex, 16);
  if (isNaN(num)) return color;
  let rC = num >> 16 & 255;
  let gC = num >> 8 & 255;
  let bC = num & 255;
  rC = Math.round(rC + (255 - rC) * amount);
  gC = Math.round(gC + (255 - gC) * amount);
  bC = Math.round(bC + (255 - bC) * amount);
  return "#" + ((1 << 24) + (rC << 16) + (gC << 8) + bC).toString(16).slice(1);
}
function colorPass(node, color, tint, out) {
  node._color = node.color || color;
  out.push(node);
  if (node.children) {
    for (let i2 = 0; i2 < node.children.length; i2++) {
      const c = node.children[i2];
      colorPass(c, c.color || lighten(node._color, tint), tint, out);
    }
  }
}
class NodeTooltip {
  /**
   * @param {any} w
   */
  constructor(w) {
    this.w = w;
    this.total = 1;
    this._el = null;
  }
  /** @returns {any} */
  _tip() {
    if (!this._el) {
      this._el = this.w.dom.baseEl.querySelector(".apexcharts-tooltip");
    }
    return this._el;
  }
  /**
   * @param {any} el  the DOM node for one mark
   * @param {any} node  the tree node it stands for
   */
  attach(el, node) {
    if (!this.w.config.tooltip.enabled || !Environment.isBrowser()) return;
    el.addEventListener(
      "mouseenter",
      (e2) => this.show(e2, node)
    );
    el.addEventListener(
      "mousemove",
      (e2) => this.position(e2)
    );
    el.addEventListener("mouseleave", () => this.hide());
  }
  /**
   * @param {MouseEvent} e
   * @param {any} node
   */
  show(e2, node) {
    const t2 = this._tip();
    if (!t2) return;
    const w = this.w;
    const pctTotal = (node.value / this.total * 100).toFixed(1);
    const parentVal = node._parent ? node._parent.value : this.total;
    const pctParent = parentVal > 0 ? (node.value / parentVal * 100).toFixed(1) : pctTotal;
    const groupBg = w.config.tooltip.fillSeriesColor ? `background-color:${node._color};` : "";
    t2.innerHTML = `<div class="apexcharts-tooltip-series-group apexcharts-active" style="display:flex;${groupBg}"><span class="apexcharts-tooltip-marker" style="background-color:${node._color}"></span><div class="apexcharts-tooltip-text"><div class="apexcharts-tooltip-y-group"><span class="apexcharts-tooltip-text-y-label">${node.name}: </span><span class="apexcharts-tooltip-text-y-value">${node.value} (${pctParent}% of parent, ${pctTotal}% of total)</span></div></div></div>`;
    t2.classList.add("apexcharts-active");
    t2.style.opacity = "1";
    this.position(e2);
  }
  /**
   * Position beside the cursor, flipping to the opposite side when the box
   * would overflow the chart wrap, and clamping inside it either way.
   * @param {MouseEvent} e
   */
  position(e2) {
    const t2 = this._tip();
    if (!t2) return;
    const rect = this.w.dom.elWrap.getBoundingClientRect();
    const tw = t2.offsetWidth;
    const th = t2.offsetHeight;
    const pad = 12;
    let x2 = e2.clientX - rect.left + pad;
    if (x2 + tw > rect.width) x2 = e2.clientX - rect.left - tw - pad;
    x2 = Math.max(0, Math.min(x2, rect.width - tw));
    let y = e2.clientY - rect.top + pad;
    if (y + th > rect.height) y = e2.clientY - rect.top - th - pad;
    y = Math.max(0, Math.min(y, rect.height - th));
    t2.style.left = x2 + "px";
    t2.style.top = y + "px";
  }
  hide() {
    const t2 = this._tip();
    if (!t2) return;
    t2.classList.remove("apexcharts-active");
    t2.style.opacity = "0";
  }
}
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const SVGNS$2 = "http://www.w3.org/2000/svg";
const XHTML$2 = "http://www.w3.org/1999/xhtml";
const lerp$2 = (a2, b, t2) => a2 + (b - a2) * t2;
class SunburstChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    const cnf = w.config;
    this.cfg = cnf.plotOptions.sunburst;
    this.strokeWidth = cnf.stroke.show ? cnf.stroke.width : 0;
    this.strokeColor = Array.isArray(cnf.stroke.colors) ? cnf.stroke.colors[0] : cnf.stroke.colors || "#fff";
    this.startAngle = this.cfg.startAngle;
    this.endAngle = this.cfg.endAngle;
    this.maxDepth = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.maxRadius = 0;
    this.total = 1;
    this._focusMaxDepth = 0;
    this._focus = null;
    this._zoomGen = 0;
    this._roots = [];
    this._nodesAll = [];
    this._innerR = () => 0;
    this._outerR = () => 0;
    this._tooltip = new NodeTooltip(w);
    this._lblSeq = 0;
    this._morphLeafIndex = 0;
    this._graphics = null;
    this._ringsG = null;
    this._labelsG = null;
  }
  /**
   * @param {any[]} series  flattened top-level values (geometry comes from the
   *   config hierarchy; kept for the standard draw(series) signature + noData)
   * @returns {any} SVG group
   */
  draw(series) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    this._graphics = graphics;
    const g = graphics.group({ class: "apexcharts-sunburst" });
    if (w.globals.noData || !series || !series.length) return g;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    this.centerX = gw / 2 + (this.cfg.offsetX || 0);
    this.centerY = gh / 2 + (this.cfg.offsetY || 0);
    this.maxRadius = Math.min(gw, gh) / 2.05 - this.strokeWidth - (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0);
    if (this.maxRadius < 5) return g;
    this._roots = this._buildHierarchy();
    if (!this._roots.length) return g;
    this._roots.forEach((r2) => this._fillValues(r2));
    this._validateStrict();
    this._nodesAll = [];
    const colors = w.globals.colors || [];
    this._roots.forEach((r2, i2) => {
      this._colorPass(r2, r2.color || colors[i2 % colors.length] || "#008FFB");
    });
    this.total = this._roots.reduce((s2, r2) => s2 + Math.max(0, r2.value), 0) || 1;
    this._tooltip.total = this.total;
    this._ringsG = graphics.group({ class: "apexcharts-sunburst-rings" });
    this._labelsG = graphics.group({ class: "apexcharts-sunburst-labels" });
    g.add(this._ringsG);
    g.add(this._labelsG);
    this._focus = null;
    this._relayout(this._focus);
    const anims = w.config.chart.animations;
    let mode = "none";
    if (anims.enabled) {
      if (w.globals.dataChanged) {
        if (anims.dynamicAnimation.enabled) mode = "update";
      } else if (!w.globals.resized) {
        mode = "intro";
      }
    }
    this._applyLayout(mode);
    this._renderBreadcrumb();
    return g;
  }
  // ------------------------------------------------------------------ data
  /**
   * Resolve the config into root nodes `{ name, value, color?, children? }`.
   * Each datum may carry `children` (native) or `drilldown: '<id>'` (adapter).
   * Shared with the treemap - see charts/common/Hierarchy.
   * @returns {any[]}
   */
  _buildHierarchy() {
    return buildHierarchy(this.w);
  }
  /**
   * Fill a parent's value from its children when missing.
   * @param {any} node
   */
  _fillValues(node) {
    fillValues(node);
  }
  /**
   * With `partition: 'strict'`, warn (once) when a parent's value does not
   * match the sum of its children. The angles are still normalized to fill the
   * wedge (strict rendering is a P3 refinement); this just surfaces the data
   * mismatch.
   */
  _validateStrict() {
    if (this.cfg.partition !== "strict") return;
    validateStrict(this._roots, {
      type: "sunburst",
      remedy: "Angles are normalized to fill the wedge."
    });
  }
  /**
   * Assign a colour to every node (explicit `color` wins, else the parent's
   * colour tinted lighter). Done once so zoom preserves colours.
   * Shared with the icicle - see charts/common/partition/Tint.
   * @param {any} node
   * @param {string} color
   */
  _colorPass(node, color) {
    colorPass(node, color, this.cfg.tint, this._nodesAll);
  }
  // ---------------------------------------------------------------- layout
  /**
   * Recompute visibility + angles + radii for a focus node (null = whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    this._focusMaxDepth = placeTree({
      roots: this._roots,
      nodesAll: this._nodesAll,
      focus,
      t0: this.startAngle,
      t1: this.endAngle
    });
    const hole = parseSize(this.cfg.innerSize, this.maxRadius, 0.15);
    const scale = bandScale({
      maxDepth: this._focusMaxDepth,
      near: hole,
      far: this.maxRadius,
      gap: 1
    });
    this._innerR = scale.near;
    this._outerR = scale.far;
    this._nodesAll.forEach((n2) => {
      if (!n2._show) return;
      n2._iR = scale.near(n2._vDepth);
      n2._oR = farEdge(
        n2,
        scale,
        this._focusMaxDepth,
        this.cfg.leaf,
        this.maxRadius
      );
    });
  }
  // --------------------------------------------------------------- render
  /**
   * Create / update / remove arc elements to match the current layout, with an
   * animation appropriate to the transition:
   *   intro  — pie/donut-style angular clock sweep from startAngle to endAngle
   *            (all rings reveal together as the sweep line passes them)
   *   update — morph every arc from its previous on-screen geometry (matched
   *            by node key across the re-render); new arcs unfurl in place
   *   zoom   — tween angles + radii between focus layouts (same instance)
   * @param {'intro'|'zoom'|'update'|'none'} mode
   */
  _applyLayout(mode) {
    var _a;
    const w = this.w;
    const anims = w.config.chart.animations;
    const dur = !anims.enabled ? 0 : mode === "none" ? 0 : mode === "update" ? anims.dynamicAnimation.speed || 350 : anims.speed || 500;
    const gen = ++this._zoomGen;
    const morph = (
      /** @type {any} */
      (_a = this.ctx) == null ? void 0 : _a.morphTypeChange
    );
    const morphActive = !!morph && typeof morph.isActive === "function" && morph.isActive() && typeof morph.getInitialPathAt === "function";
    const morphDur = morphActive ? morph.getSpeed() : 0;
    this._morphLeafIndex = 0;
    const prev = mode === "update" ? (
      /** @type {any} */
      this.ctx._sunburstPrevGeoms
    ) : null;
    this._nodesAll.forEach((node) => {
      if (node._show) {
        const target2 = {
          a0: node._t0,
          a1: node._t1,
          iR: node._iR,
          oR: node._oR
        };
        if (!node._el) node._el = this._createArcEl(node);
        const morphFrom = morphActive ? this._morphSourceFor(node) : null;
        if (morphFrom && morphDur > 0) {
          this._morphArcFrom(node, morphFrom, target2, morphDur, gen);
        } else if ((mode === "intro" || morphActive) && dur > 0) {
          this._sweepArc(node, target2, morphActive ? morphDur : dur, gen);
        } else {
          let from;
          let isNew = false;
          if (node._cur) {
            from = node._cur;
          } else if (prev && prev.get(node._key)) {
            from = prev.get(node._key);
          } else {
            const mid = (target2.a0 + target2.a1) / 2;
            from = { a0: mid, a1: mid, iR: target2.iR, oR: target2.iR };
            isNew = true;
          }
          this._animateArc(node, from, target2, dur, false, isNew, gen);
        }
      } else if (node._el && node._cur) {
        const mid = (node._cur.a0 + node._cur.a1) / 2;
        const target2 = { a0: mid, a1: mid, iR: node._cur.iR, oR: node._cur.iR };
        this._animateArc(node, node._cur, target2, dur, true, false, gen);
      }
    });
    const geoms = /* @__PURE__ */ new Map();
    this._nodesAll.forEach((n2) => {
      if (n2._show) {
        geoms.set(n2._key, { a0: n2._t0, a1: n2._t1, iR: n2._iR, oR: n2._oR });
      }
    });
    this.ctx._sunburstPrevGeoms = geoms;
    this._renderLabels(dur);
  }
  /**
   * The captured mark this leaf should unroll from, or null when the node is
   * the outgoing chart had nothing to give it.
   *
   * When both charts carry branch keys the pairing is by identity, so EVERY
   * ring finds the tile that stood for the same branch and the inner rings
   * unroll instead of appearing from nothing.
   *
   * Without keys (a flat treemap, or an older config) only leaves pair, and
   * they consume the captured paths in draw order - the order the outgoing
   * renderer laid its own marks out in, so tile k pairs with leaf k.
   *
   * @param {any} node
   * @returns {string | null}
   */
  _morphSourceFor(node) {
    const ctx = (
      /** @type {any} */
      this.ctx
    );
    const morph = ctx && ctx.morphTypeChange;
    if (!morph) return null;
    if (typeof morph.hasKeyedMarks === "function" && morph.hasKeyedMarks() && typeof morph.getInitialPathForKey === "function") {
      return morph.getInitialPathForKey(morphKey(node._key));
    }
    if (node.children && node.children.length) return null;
    return morph.getInitialPathAt(this._morphLeafIndex++);
  }
  /**
   * Unroll an arc from an arbitrary captured shape.
   *
   * `_animateArc` interpolates arc PARAMETERS (angles and radii), which cannot
   * express a rectangle, so this one tweens the path data itself through
   * Animations.morphSVG - the same call every other morphing renderer makes,
   * which already selects the polygon-resample algorithm while a cross-type
   * morph is active.
   *
   * @param {any} node
   * @param {string} fromD
   * @param {{a0:number,a1:number,iR:number,oR:number}} target
   * @param {number} dur
   * @param {number} gen
   */
  _morphArcFrom(node, fromD, target2, dur, gen) {
    const el = node._el;
    const toD = this._arcPath(
      target2.iR,
      target2.oR,
      target2.a0,
      target2.a1,
      this.cfg.borderRadius
    );
    el.node.style.display = "";
    el.attr({ d: fromD, opacity: 1 });
    node._cur = target2;
    if (this._zoomGen !== gen) return;
    new Animations(
      this.w,
      /** @type {any} */
      this.ctx
    ).morphSVG(
      el,
      0,
      // Not a (series, point) index: an arc has no j, and passing a number here
      // would make morphSVG treat it as the last point of a series and fire the
      // chart's animation-completed hook.
      /** @type {any} */
      null,
      node._color,
      fromD,
      toD,
      dur,
      0
    );
  }
  /**
   * Pie/donut-style intro: a clock sweep from startAngle to endAngle. Each
   * arc's end angle is clamped to the sweep line, so arcs appear in angular
   * order and grow until complete — the whole hierarchy unwipes together.
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number}} target
   * @param {number} dur
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _sweepArc(node, target2, dur, gen) {
    const el = node._el;
    const br = this.cfg.borderRadius;
    const s0 = this.startAngle;
    const s1 = this.endAngle;
    el.node.style.display = "";
    el.attr({ d: "", opacity: 1 });
    el.animate(dur).during((pos) => {
      if (this._zoomGen !== gen) return;
      const sweep = s0 + (s1 - s0) * pos;
      if (sweep <= target2.a0 + 0.01) {
        el.attr({ d: "" });
        return;
      }
      const a1 = Math.min(target2.a1, sweep);
      el.attr({ d: this._arcPath(target2.iR, target2.oR, target2.a0, a1, br) });
      node._cur = { a0: target2.a0, a1, iR: target2.iR, oR: target2.oR };
    }).after(() => {
      if (this._zoomGen !== gen) return;
      node._cur = target2;
    });
  }
  /**
   * @param {any} node
   * @returns {any} svg.js path element
   */
  _createArcEl(node) {
    const path = this._graphics.drawPath({
      d: "",
      fill: node._color,
      stroke: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fillOpacity: 1,
      classes: "apexcharts-sunburst-arc"
    });
    const el = path.node;
    el.setAttribute("data:name", node.name);
    el.setAttribute("data:value", String(node.value));
    el.setAttribute("data:key", morphKey(node._key));
    el.setAttribute(
      "data:leaf",
      String(!(node.children && node.children.length))
    );
    this._tooltip.attach(el, node);
    if (Environment.isBrowser()) {
      el.addEventListener("click", () => this._zoomTo(node));
      el.style.cursor = "pointer";
    }
    this._ringsG.add(path);
    return path;
  }
  /**
   * @param {any} node
   * @param {{a0:number,a1:number,iR:number,oR:number}} from
   * @param {{a0:number,a1:number,iR:number,oR:number}} to
   * @param {number} dur
   * @param {boolean} hide    shrink + fade out, then hide
   * @param {boolean} fadeIn  fade 0 -> 1 (new arcs only; morphs stay opaque)
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _animateArc(node, from, to, dur, hide, fadeIn, gen) {
    const el = node._el;
    const br = this.cfg.borderRadius;
    el.attr({ fill: node._color });
    if (dur === 0) {
      el.attr({ d: this._arcPath(to.iR, to.oR, to.a0, to.a1, br), opacity: hide ? 0 : 1 });
      el.node.style.display = hide ? "none" : "";
      node._cur = hide ? null : to;
      return;
    }
    el.node.style.display = "";
    const startOp = hide ? Number(el.attr("opacity")) || 1 : fadeIn ? 0 : 1;
    const endOp = hide ? 0 : 1;
    el.attr({ opacity: startOp });
    el.animate(dur).during((pos) => {
      if (this._zoomGen !== gen) return;
      const a0 = lerp$2(from.a0, to.a0, pos);
      const a1 = lerp$2(from.a1, to.a1, pos);
      const iR = lerp$2(from.iR, to.iR, pos);
      const oR = lerp$2(from.oR, to.oR, pos);
      el.attr({
        d: this._arcPath(iR, oR, a0, a1, br),
        opacity: lerp$2(startOp, endOp, pos)
      });
      node._cur = { a0, a1, iR, oR };
    }).after(() => {
      if (this._zoomGen !== gen) return;
      if (hide) {
        el.node.style.display = "none";
        node._cur = null;
      } else {
        node._cur = to;
      }
    });
  }
  // ---------------------------------------------------------------- labels
  /**
   * Labels are overlays on animated paths, so they reveal gradually AFTER the
   * arcs settle (repo convention: overlays never pop in over a moving path).
   * @param {number} dur  arc animation duration (0 = instant labels)
   */
  _renderLabels(dur) {
    const labelsG = this._labelsG;
    while (labelsG.node.firstChild) labelsG.node.removeChild(labelsG.node.firstChild);
    if (!this.cfg.dataLabels.show) return;
    this._nodesAll.forEach((node) => {
      if (!node._show) return;
      if (node._t1 - node._t0 < this.cfg.dataLabels.minAngleToShow) return;
      this._renderCurvedLabel(node);
    });
    if (dur > 0) {
      labelsG.attr({ opacity: 0 });
      labelsG.animate(250, dur).attr({ opacity: 1 });
    } else {
      labelsG.attr({ opacity: 1 });
    }
  }
  /**
   * Curved label along the arc's mid-radius (flipped on the bottom half so it
   * stays upright). Raw SVG <textPath> — svg.js has no first-class textPath.
   * @param {any} node
   */
  _renderCurvedLabel(node) {
    if (!Environment.isBrowser()) return;
    const style = this.cfg.dataLabels.style;
    const w = this.w;
    const r2 = (node._iR + node._oR) / 2;
    const mid = (node._t0 + node._t1) / 2;
    const flip = mid > 90 && mid < 270;
    const padDeg = Math.min(r2 > 0 ? 4 / r2 * R2D : 0, (node._t1 - node._t0) / 2);
    const from = flip ? node._t1 - padDeg : node._t0 + padDeg;
    const to = flip ? node._t0 + padDeg : node._t1 - padDeg;
    const p1 = this._ptAt(r2, from);
    const p2 = this._ptAt(r2, to);
    const largeArc = Math.abs(to - from) > 180 ? 1 : 0;
    const sweep = flip ? 0 : 1;
    const id = `apx-sb-lbl-${w.globals.cuid}-${this._lblSeq++}`;
    const guide = BrowserAPIs.createElementNS(SVGNS$2, "path");
    guide.setAttribute("id", id);
    guide.setAttribute(
      "d",
      `M ${p1.x} ${p1.y} A ${r2} ${r2} 0 ${largeArc} ${sweep} ${p2.x} ${p2.y}`
    );
    guide.setAttribute("fill", "none");
    guide.setAttribute("stroke", "none");
    const colors = style.colors;
    const fill = (Array.isArray(colors) ? colors[0] : colors) || "#fff";
    const text = BrowserAPIs.createElementNS(SVGNS$2, "text");
    text.setAttribute("font-size", style.fontSize || "12px");
    if (style.fontFamily) text.setAttribute("font-family", style.fontFamily);
    text.setAttribute("font-weight", String(style.fontWeight || 400));
    text.setAttribute("fill", fill);
    text.setAttribute("dominant-baseline", "central");
    text.style.pointerEvents = "none";
    const tp = BrowserAPIs.createElementNS(SVGNS$2, "textPath");
    tp.setAttribute("href", "#" + id);
    tp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#" + id);
    tp.setAttribute("startOffset", "50%");
    tp.setAttribute("text-anchor", "middle");
    tp.textContent = this._truncate(node.name, r2, node._t1 - node._t0, style.fontSize);
    text.appendChild(tp);
    this._labelsG.node.appendChild(guide);
    this._labelsG.node.appendChild(text);
  }
  /**
   * Trim a label to the arc length available at its radius.
   * @param {string} name
   * @param {number} r
   * @param {number} spanDeg
   * @param {string} fontSize
   * @returns {string}
   */
  _truncate(name, r2, spanDeg, fontSize) {
    const arcLen = r2 * spanDeg * D2R - 8;
    const charW = (parseFloat(fontSize) || 12) * 0.58;
    const maxChars = Math.floor(arcLen / charW);
    if (maxChars >= name.length) return name;
    if (maxChars <= 1) return "";
    return name.slice(0, Math.max(1, maxChars - 1)) + "…";
  }
  // ----------------------------------------------------------------- zoom
  /**
   * Focus a node (zoom in), or zoom out one level when the current focus (the
   * innermost ring) is clicked.
   * @param {any} node
   */
  _zoomTo(node) {
    if (this.cfg.zoomOnClick === false) return;
    const next = resolveFocus(node, this._focus);
    if (!next.changed) return;
    this._focus = next.focus;
    this._relayout(this._focus);
    this._applyLayout("zoom");
    this._renderBreadcrumb();
  }
  /** Root -> focus chain of nodes. */
  _focusChain() {
    return focusChain(this._focus);
  }
  /**
   * Minimal self-contained breadcrumb (reuses the shared `.apexcharts-breadcrumb`
   * CSS classes, but does NOT depend on the drilldown feature).
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap) return;
    const existing = elWrap.querySelector(".apexcharts-breadcrumb");
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
    if (!this._focus) return;
    const nav = BrowserAPIs.createElementNS(XHTML$2, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Sunburst breadcrumb");
    nav.style.position = "absolute";
    nav.style.top = "0px";
    nav.style.left = "0px";
    const crumbs = [{ name: "All", node: null }].concat(
      this._focusChain().map((n2) => ({ name: n2.name, node: n2 }))
    );
    crumbs.forEach((crumb, i2) => {
      if (i2 > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML$2, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.textContent = " / ";
        nav.appendChild(sep);
      }
      const isCurrent = i2 === crumbs.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML$2, "span");
        cur.setAttribute(
          "class",
          "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
        );
        cur.textContent = crumb.name;
        nav.appendChild(cur);
      } else {
        const btn = BrowserAPIs.createElementNS(XHTML$2, "button");
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i2 === 0) {
          const arrow2 = BrowserAPIs.createElementNS(XHTML$2, "span");
          arrow2.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow2.textContent = "←";
          btn.appendChild(arrow2);
        }
        const text = BrowserAPIs.createElementNS(XHTML$2, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = crumb.name;
        btn.appendChild(text);
        btn.addEventListener("click", () => {
          this._focus = crumb.node;
          this._relayout(this._focus);
          this._applyLayout("zoom");
          this._renderBreadcrumb();
        });
        nav.appendChild(btn);
      }
    });
    elWrap.appendChild(nav);
    this._avoidChromeOverlap(nav);
  }
  /**
   * The breadcrumb is an absolute overlay at top-left, so it can sit on top of
   * a left-aligned title (or subtitle). After mounting, push it below any chart
   * chrome it intersects. (Duplicated from drilldown's Breadcrumb on purpose —
   * sunburst must not import the drilldown feature.)
   * @param {any} nav
   */
  /**
   * Shared with the treemap - see charts/common/Breadcrumb.
   * @param {any} nav
   */
  _avoidChromeOverlap(nav) {
    avoidChromeOverlap(this.w, nav);
  }
  // ------------------------------------------------------------ geometry
  /**
   * @param {number} r
   * @param {number} deg  0 = top, clockwise
   * @returns {{x: number, y: number}}
   */
  _ptAt(r2, deg) {
    return {
      x: this.centerX + r2 * Math.cos((deg - 90) * D2R),
      y: this.centerY + r2 * Math.sin((deg - 90) * D2R)
    };
  }
  /**
   * Rounded donut-segment path (inner radius always > 0). Applies `spacing`
   * (angular gap) and `borderRadius` (corner rounding), both clamped so a thin
   * arc never inverts.
   * @param {number} iR
   * @param {number} oR
   * @param {number} a0
   * @param {number} a1
   * @param {number} borderRadius
   * @returns {string}
   */
  _arcPath(iR, oR, a0, a1, borderRadius) {
    if (oR <= iR + 0.01) return "";
    let spanDeg = a1 - a0;
    const spacing = this.cfg.spacing;
    if (spacing > 0 && spanDeg > 0 && oR > 0) {
      const gapDeg = spacing / oR * R2D;
      const inset = Math.min(gapDeg / 2, Math.max(0, spanDeg / 2 - 0.25));
      a0 += inset;
      a1 -= inset;
      spanDeg = a1 - a0;
    }
    if (spanDeg <= 0) return "";
    const spanRad = spanDeg * D2R;
    const cx = this.centerX;
    const cy = this.centerY;
    let r2 = borderRadius;
    r2 = Math.min(r2, spanRad * iR / 2, spanRad * oR / 2, (oR - iR) / 2);
    if (!(r2 > 0.5)) {
      return sharpDonutSegmentPath({ cx, cy, rIn: iR, rOut: oR, a0, a1, spanDeg });
    }
    return roundedDonutSegmentPath({ cx, cy, rIn: iR, rOut: oR, a0, a1, r: r2, spanDeg });
  }
}
ApexCharts__default.use({
  sunburst: SunburstChart
});
const SVGNS$1 = "http://www.w3.org/2000/svg";
const MIN_LABEL_CHARS = 3;
const lerp$1 = (a2, b, t2) => a2 + (b - a2) * t2;
class IcicleChart {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    const cnf = w.config;
    this.cfg = cnf.plotOptions.icicle;
    this.strokeWidth = cnf.stroke.show ? cnf.stroke.width : 0;
    this.strokeColor = Array.isArray(cnf.stroke.colors) ? cnf.stroke.colors[0] : cnf.stroke.colors || "#fff";
    this.width = 0;
    this.height = 0;
    this._vertical = true;
    this._flip = false;
    this.total = 1;
    this._focusMaxDepth = 0;
    this._focus = null;
    this._zoomGen = 0;
    this._roots = [];
    this._nodesAll = [];
    this._tooltip = new NodeTooltip(w);
    this._graphics = null;
    this._cellsG = null;
    this._labelsG = null;
  }
  /**
   * @param {any[]} series  flattened top-level values (geometry comes from the
   *   config hierarchy; kept for the standard draw(series) signature + noData)
   * @returns {any} SVG group
   */
  draw(series) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    this._graphics = graphics;
    const g = graphics.group({ class: "apexcharts-icicle" });
    if (w.globals.noData || !series || !series.length) return g;
    this.width = w.layout.gridWidth;
    this.height = w.layout.gridHeight;
    if (this.width < 5 || this.height < 5) return g;
    const dir = this.cfg.direction;
    this._vertical = dir !== "right" && dir !== "left";
    this._flip = dir === "up" || dir === "left";
    this._roots = buildHierarchy(this.w);
    if (!this._roots.length) return g;
    this._roots.forEach((r2) => fillValues(r2));
    sortTree(this._roots, this.cfg.sort);
    if (this.cfg.partition === "strict") {
      validateStrict(this._roots, {
        type: "icicle",
        remedy: "Extents are normalized to fill the parent."
      });
    }
    this._nodesAll = [];
    this._colorNodes();
    this.total = this._roots.reduce((s2, r2) => s2 + Math.max(0, r2.value), 0) || 1;
    this._tooltip.total = this.total;
    this._cellsG = graphics.group({ class: "apexcharts-icicle-cells" });
    this._labelsG = graphics.group({ class: "apexcharts-icicle-labels" });
    g.add(this._cellsG);
    g.add(this._labelsG);
    this._focus = null;
    this._relayout(this._focus);
    const anims = w.config.chart.animations;
    let mode = "none";
    if (anims.enabled) {
      if (w.globals.dataChanged) {
        if (anims.dynamicAnimation.enabled) mode = "update";
      } else if (!w.globals.resized) {
        mode = "intro";
      }
    }
    this._applyLayout(mode);
    this._renderBreadcrumb();
    return g;
  }
  // --------------------------------------------------------------- colours
  /**
   * Give every node a colour, and collect the nodes flat in draw order.
   *
   * The palette lands on the shallowest level that actually BRANCHES, not on
   * the roots. A single-root tree is the normal shape for an icicle and the
   * only shape for a flame graph, and colouring by root would paint the whole
   * chart one hue; what a reader needs is one hue per branch under that root.
   * Levels above it are the trunk, so they take a pale tone that reads as a
   * container instead of competing with the branches.
   */
  _colorNodes() {
    const colors = this.w.globals.colors || [];
    const fallback = colors[0] || "#008FFB";
    let level = this._roots;
    const trunk = [];
    while (level.length === 1 && level[0].children && level[0].children.length > 1) {
      trunk.push(level[0]);
      level = level[0].children;
    }
    const trunkColor = lighten(fallback, 0.62);
    trunk.forEach((n2) => {
      n2._color = n2.color || trunkColor;
      this._nodesAll.push(n2);
    });
    level.forEach((n2, i2) => {
      colorPass(
        n2,
        n2.color || colors[i2 % colors.length] || fallback,
        this.cfg.tint,
        this._nodesAll
      );
    });
  }
  // ---------------------------------------------------------------- layout
  /** The extent of the value axis in px. */
  _valueExtent() {
    return this._vertical ? this.width : this.height;
  }
  /** The extent of the depth axis in px. */
  _depthExtent() {
    return this._vertical ? this.height : this.width;
  }
  /**
   * Recompute visibility + extents for a focus node (null = the whole tree).
   * @param {any} focus
   */
  _relayout(focus) {
    const extent = this._valueExtent();
    const maxDepth = this.cfg.maxDepth;
    const capLevels = typeof maxDepth === "number" && maxDepth > 0 ? maxDepth : 0;
    if (focus && this.cfg.zoomType !== "both") {
      const focusDepth = focusChain(focus).length - 1;
      this._focusMaxDepth = placeTree({
        roots: this._roots,
        nodesAll: this._nodesAll,
        focus: null,
        t0: 0,
        t1: extent,
        cap: capLevels ? capLevels - 1 + focusDepth : void 0
      });
      this._stretchTo(focus, extent);
    } else {
      this._focusMaxDepth = placeTree({
        roots: this._roots,
        nodesAll: this._nodesAll,
        focus,
        t0: 0,
        t1: extent,
        cap: capLevels ? capLevels - 1 : void 0
      });
    }
    const depth = this._depthExtent();
    const levels = this._focusMaxDepth + 1;
    const fixed = this.cfg.levelSize === "equal" ? 0 : parseSize(this.cfg.levelSize, depth, 0);
    const used = fixed > 0 ? Math.min(depth, fixed * levels) : depth;
    const scale = bandScale({
      maxDepth: this._focusMaxDepth,
      near: 0,
      far: used,
      gap: 1
    });
    this._nodesAll.forEach((n2) => {
      if (!n2._show) return;
      n2._d0 = scale.near(n2._vDepth);
      n2._d1 = farEdge(n2, scale, this._focusMaxDepth, this.cfg.leaf, used);
    });
  }
  /**
   * Rescale the value axis so the focused branch fills it.
   *
   * This is the whole of a value-axis zoom: one affine map applied to extents
   * that are already laid out, with the depth axis untouched. The branch's
   * ancestors stretch past both edges and are clamped to the plot, which is
   * what makes them read as full-width context bands above the focus.
   *
   * Everything outside the branch lands outside the plot, so it is dropped
   * here rather than drawn off-screen: after the map the focus occupies the
   * entire extent, so a sibling cannot partly survive.
   *
   * @param {any} focus
   * @param {number} extent
   */
  _stretchTo(focus, extent) {
    const span = focus._t1 - focus._t0;
    if (!(span > 0)) return;
    const scale = extent / span;
    const from = focus._t0;
    const eps = 0.01;
    this._nodesAll.forEach((n2) => {
      if (!n2._show) return;
      const t0 = (n2._t0 - from) * scale;
      const t1 = (n2._t1 - from) * scale;
      if (t1 <= eps || t0 >= extent - eps) {
        n2._show = false;
        return;
      }
      n2._t0 = Math.max(0, t0);
      n2._t1 = Math.min(extent, t1);
    });
  }
  /**
   * A node's box in plot coordinates.
   *
   * `_t0`/`_t1` run along the value axis and `_d0`/`_d1` along the depth axis;
   * this is the only place that decides which is x and which is y, so the four
   * directions cost one mapping rather than four layouts.
   *
   * @param {{ _t0: number, _t1: number, _d0: number, _d1: number }} n
   * @returns {{ x: number, y: number, w: number, h: number }}
   */
  _box(n2) {
    const t2 = n2._t0;
    const len = Math.max(0, n2._t1 - n2._t0);
    const d = n2._d0;
    const thick = Math.max(0, n2._d1 - n2._d0);
    if (this._vertical) {
      return {
        x: t2,
        y: this._flip ? this.height - d - thick : d,
        w: len,
        h: thick
      };
    }
    return {
      x: this._flip ? this.width - d - thick : d,
      y: t2,
      w: thick,
      h: len
    };
  }
  // --------------------------------------------------------------- render
  /**
   * Create / update / remove cells to match the current layout, with an
   * animation appropriate to the transition:
   *   intro  — a wipe along the value axis, staggered by depth so the root band
   *            leads and its children follow it out
   *   update — tween every cell from its previous on-screen box (matched by
   *            node key across the re-render); new cells grow in place
   *   zoom   — tween boxes between focus layouts (same instance)
   * @param {'intro'|'zoom'|'update'|'none'} mode
   */
  _applyLayout(mode) {
    const w = this.w;
    const anims = w.config.chart.animations;
    const dur = !anims.enabled ? 0 : mode === "none" ? 0 : mode === "update" || mode === "zoom" ? anims.dynamicAnimation.speed || 350 : anims.speed || 500;
    const gen = ++this._zoomGen;
    const prev = mode === "update" ? (
      /** @type {any} */
      this.ctx._iciclePrevGeoms
    ) : null;
    this._nodesAll.forEach((node) => {
      if (node._show) {
        const to = this._box(node);
        if (!node._el) node._el = this._createCellEl(node);
        node._el.node.setAttribute("data:clipped", String(!!node._clipped));
        this._setCursor(node);
        if (mode === "intro" && dur > 0) {
          this._wipeCell(node, to, dur, gen);
          return;
        }
        let from;
        let isNew = false;
        if (node._cur) {
          from = node._cur;
        } else if (prev && prev.get(node._key)) {
          from = prev.get(node._key);
        } else {
          from = {
            x: to.x + to.w / 2,
            y: to.y + to.h / 2,
            w: 0,
            h: 0
          };
          isNew = true;
        }
        this._animateCell(node, from, to, dur, false, isNew, gen);
      } else if (node._el && node._cur) {
        const c = node._cur;
        const collapsed = {
          x: c.x + c.w / 2,
          y: c.y + c.h / 2,
          w: 0,
          h: 0
        };
        this._animateCell(node, c, collapsed, dur, true, false, gen);
      }
    });
    const geoms = /* @__PURE__ */ new Map();
    this._nodesAll.forEach((n2) => {
      if (n2._show) geoms.set(n2._key, this._box(n2));
    });
    this.ctx._iciclePrevGeoms = geoms;
    this._renderLabels(dur);
  }
  /**
   * @param {any} node
   * @returns {any} svg.js rect element
   */
  _createCellEl(node) {
    const box = this._box(node);
    const rect = this._graphics.drawRect(
      box.x,
      box.y,
      0,
      0,
      this.cfg.borderRadius,
      node._color,
      1,
      this.strokeWidth,
      this.strokeColor
    );
    rect.node.setAttribute("class", "apexcharts-icicle-cell");
    const el = rect.node;
    el.setAttribute("data:name", node.name);
    el.setAttribute("data:value", String(node.value));
    el.setAttribute("data:key", morphKey(node._key));
    el.setAttribute(
      "data:leaf",
      String(!(node.children && node.children.length))
    );
    this._tooltip.attach(el, node);
    if (Environment.isBrowser() && this.cfg.zoomOnClick !== false) {
      el.addEventListener("click", () => this._zoomTo(node));
    }
    this._cellsG.add(rect);
    return rect;
  }
  /**
   * Intro: a wipe along the value axis. Each cell grows from its own leading
   * edge, and a deeper band starts later, so the tree reads as unfolding out of
   * the root rather than every level appearing at once.
   *
   * @param {any} node
   * @param {{x:number,y:number,w:number,h:number}} to
   * @param {number} dur
   * @param {number} gen
   */
  _wipeCell(node, to, dur, gen) {
    const el = node._el;
    const levels = this._focusMaxDepth + 1;
    const delay = levels > 1 ? node._vDepth / levels * dur * 0.6 : 0;
    const grow = dur - delay;
    const from = this._vertical ? { x: to.x, y: to.y, w: 0, h: to.h } : { x: to.x, y: to.y, w: to.w, h: 0 };
    this._setBox(el, from);
    el.attr({ opacity: 1 });
    el.node.style.display = "";
    node._cur = from;
    el.animate(grow, delay).during((pos) => {
      if (this._zoomGen !== gen) return;
      const box = {
        x: to.x,
        y: to.y,
        w: this._vertical ? to.w * pos : to.w,
        h: this._vertical ? to.h : to.h * pos
      };
      this._setBox(el, box);
      node._cur = box;
    }).after(() => {
      if (this._zoomGen !== gen) return;
      this._setBox(el, to);
      node._cur = to;
    });
  }
  /**
   * @param {any} node
   * @param {{x:number,y:number,w:number,h:number}} from
   * @param {{x:number,y:number,w:number,h:number}} to
   * @param {number} dur
   * @param {boolean} hide    collapse, then hide
   * @param {boolean} fadeIn  fade 0 -> 1 (new cells only; tweens stay opaque)
   * @param {number} gen  layout generation; frames stop once superseded
   */
  _animateCell(node, from, to, dur, hide, fadeIn, gen) {
    const el = node._el;
    el.attr({ fill: node._color });
    if (dur === 0) {
      this._setBox(el, to);
      el.attr({ opacity: hide ? 0 : 1 });
      el.node.style.display = hide ? "none" : "";
      node._cur = hide ? null : to;
      return;
    }
    el.node.style.display = "";
    const startOp = hide ? Number(el.attr("opacity")) || 1 : fadeIn ? 0 : 1;
    const endOp = hide ? 0 : 1;
    el.attr({ opacity: startOp });
    el.animate(dur).during((pos) => {
      if (this._zoomGen !== gen) return;
      const box = {
        x: lerp$1(from.x, to.x, pos),
        y: lerp$1(from.y, to.y, pos),
        w: lerp$1(from.w, to.w, pos),
        h: lerp$1(from.h, to.h, pos)
      };
      this._setBox(el, box);
      el.attr({ opacity: lerp$1(startOp, endOp, pos) });
      node._cur = box;
    }).after(() => {
      if (this._zoomGen !== gen) return;
      if (hide) {
        el.node.style.display = "none";
        node._cur = null;
      } else {
        this._setBox(el, to);
        node._cur = to;
      }
    });
  }
  /**
   * Write a box onto a cell, with `spacing` taken out of it.
   *
   * The gap is applied here rather than in the layout so the extents stay the
   * true partition: a tween interpolates real geometry and the gap never
   * accumulates across frames. It is clamped so a thin cell cannot invert.
   *
   * @param {any} el
   * @param {{x:number,y:number,w:number,h:number}} box
   */
  _setBox(el, box) {
    const gap = this.cfg.spacing || 0;
    const insetX = Math.min(gap, Math.max(0, box.w - 0.5)) / 2;
    const insetY = Math.min(gap, Math.max(0, box.h - 0.5)) / 2;
    el.attr({
      x: box.x + insetX,
      y: box.y + insetY,
      width: Math.max(0, box.w - insetX * 2),
      height: Math.max(0, box.h - insetY * 2)
    });
  }
  // ---------------------------------------------------------------- labels
  /**
   * Labels are overlays on animated cells, so they reveal AFTER the cells
   * settle (repo convention: overlays never pop in over a moving shape).
   * @param {number} dur  cell animation duration (0 = instant labels)
   */
  _renderLabels(dur) {
    const labelsG = this._labelsG;
    while (labelsG.node.firstChild) {
      labelsG.node.removeChild(labelsG.node.firstChild);
    }
    if (!this.cfg.dataLabels.show) return;
    this._nodesAll.forEach((node) => {
      if (!node._show) return;
      this._renderLabel(node);
      if (node._clipped) this._renderMoreMark(node);
    });
    if (dur > 0) {
      labelsG.attr({ opacity: 0 });
      labelsG.animate(250, dur).attr({ opacity: 1 });
    } else {
      labelsG.attr({ opacity: 1 });
    }
  }
  /**
   * One cell's label, horizontal wherever there is room for it.
   *
   * A cell taller than it is wide (what a sideways icicle produces) turns its
   * label a quarter turn, because a flat label there is clipped by the band
   * thickness while the value axis has room to spare.
   *
   * @param {any} node
   */
  _renderLabel(node) {
    if (!Environment.isBrowser()) return;
    const dl = this.cfg.dataLabels;
    const style = dl.style;
    const box = this._box(node);
    const rotated = dl.rotate === "always" ? true : dl.rotate === "never" ? false : box.h > box.w;
    const along = rotated ? box.h : box.w;
    const across = rotated ? box.w : box.h;
    const fontPx = parseFloat(style.fontSize) || 12;
    if (along < dl.minSizeToShow) return;
    if (across < fontPx + 2) return;
    const room = along - 8;
    let label2 = node.name;
    if (dl.showValue) {
      const full = `${node.name}: ${node.value}`;
      if (this._fits(full, room, fontPx)) label2 = full;
    }
    const text = this._truncate(label2, room, fontPx);
    if (!text) return;
    const colors = style.colors;
    const fill = (Array.isArray(colors) ? colors[0] : colors) || "#fff";
    const el = BrowserAPIs.createElementNS(SVGNS$1, "text");
    el.setAttribute("font-size", style.fontSize || "12px");
    if (style.fontFamily) el.setAttribute("font-family", style.fontFamily);
    el.setAttribute("font-weight", String(style.fontWeight || 400));
    el.setAttribute("fill", fill);
    el.setAttribute("dominant-baseline", "central");
    el.style.pointerEvents = "none";
    el.textContent = text;
    const pad = 4;
    const anchor = dl.align === "center" ? "middle" : dl.align === "right" ? "end" : "start";
    const atStart = box.x + pad;
    const atEnd = box.x + box.w - pad;
    const mid = box.x + box.w / 2;
    if (rotated) {
      const cx = box.x + box.w / 2;
      const yStart = box.y + box.h - pad;
      const yEnd = box.y + pad;
      const yMid = box.y + box.h / 2;
      const y = anchor === "middle" ? yMid : anchor === "end" ? yEnd : yStart;
      el.setAttribute("text-anchor", anchor);
      el.setAttribute("x", String(cx));
      el.setAttribute("y", String(y));
      el.setAttribute("transform", `rotate(-90 ${cx} ${y})`);
    } else {
      const x2 = anchor === "middle" ? mid : anchor === "end" ? atEnd : atStart;
      el.setAttribute("text-anchor", anchor);
      el.setAttribute("x", String(x2));
      el.setAttribute("y", String(box.y + box.h / 2));
    }
    this._labelsG.node.appendChild(el);
  }
  /**
   * A row of dots on the far edge of a branch whose children `maxDepth` cut.
   *
   * Without it a clipped branch is indistinguishable from a leaf, and the chart
   * would quietly claim the tree ends there. The dots sit on the edge the
   * children would have been drawn against, so they read as "it continues this
   * way", and clicking the cell zooms in and shows them.
   *
   * @param {any} node
   */
  _renderMoreMark(node) {
    if (!Environment.isBrowser()) return;
    const box = this._box(node);
    const along = this._vertical ? box.w : box.h;
    if (along < 18) return;
    const mid = this._vertical ? box.x + box.w / 2 : box.y + box.h / 2;
    const edge = this._vertical ? this._flip ? box.y + 2.5 : box.y + box.h - 2.5 : this._flip ? box.x + 2.5 : box.x + box.w - 2.5;
    const g = BrowserAPIs.createElementNS(SVGNS$1, "g");
    g.setAttribute("class", "apexcharts-icicle-more");
    g.style.pointerEvents = "none";
    for (let i2 = -1; i2 <= 1; i2++) {
      const dot = BrowserAPIs.createElementNS(SVGNS$1, "circle");
      dot.setAttribute("cx", String(this._vertical ? mid + i2 * 5 : edge));
      dot.setAttribute("cy", String(this._vertical ? edge : mid + i2 * 5));
      dot.setAttribute("r", "1.1");
      dot.setAttribute("fill", "#fff");
      dot.setAttribute("fill-opacity", "0.85");
      g.appendChild(dot);
    }
    this._labelsG.node.appendChild(g);
  }
  /**
   * Whether a string fits the room available, at this font size.
   * @param {string} text
   * @param {number} room  px
   * @param {number} fontPx
   * @returns {boolean}
   */
  _fits(text, room, fontPx) {
    return text.length * fontPx * 0.58 <= room;
  }
  /**
   * Trim a label to the room available along its reading direction.
   *
   * Below a few surviving characters it returns nothing at all. A stub like
   * `Opera…` or, worse, `R…` is noise: it neither names the cell nor leaves it
   * clean, and a wall of them is what makes a deep icicle look cluttered. The
   * cell still answers on hover.
   *
   * @param {string} name
   * @param {number} room  px
   * @param {number} fontPx
   * @returns {string}
   */
  _truncate(name, room, fontPx) {
    const charW = fontPx * 0.58;
    const maxChars = Math.floor(room / charW);
    if (maxChars >= name.length) return name;
    if (maxChars < MIN_LABEL_CHARS + 1) return "";
    return name.slice(0, maxChars - 1) + "…";
  }
  // ----------------------------------------------------------------- zoom
  /**
   * A cell offers the pointer only while clicking it would change the view.
   * A leaf under the current focus, or the single root of a one-root tree,
   * resolves to the focus the reader is already on, and a pointer there
   * promises a zoom that cannot happen. Asked on every layout, because a zoom
   * changes the answer for every cell.
   * @param {any} node
   */
  _setCursor(node) {
    if (!Environment.isBrowser() || this.cfg.zoomOnClick === false) return;
    node._el.node.style.cursor = resolveFocus(node, this._focus, this._roots).changed ? "pointer" : "default";
  }
  /**
   * Focus a node (zoom in), or zoom out one level when the current focus is
   * clicked.
   * @param {any} node
   */
  _zoomTo(node) {
    if (this.cfg.zoomOnClick === false) return;
    const next = resolveFocus(node, this._focus, this._roots);
    if (!next.changed) return;
    this._focus = next.focus;
    this._relayout(this._focus);
    this._applyLayout("zoom");
    this._renderBreadcrumb();
  }
  /**
   * The breadcrumb sits in the band the layout reserved for it, rather than
   * floating: an icicle fills its plot edge to edge, so an overlay would have
   * nowhere to go without covering a cell. Same reasoning as the treemap's,
   * and it shares the same renderer.
   */
  _renderBreadcrumb() {
    if (!Environment.isBrowser()) return;
    if (!this._focus) {
      clearBreadcrumb(this.w);
      return;
    }
    const cfg = breadcrumbConfig(this.w);
    const soleRoot = this._roots.length === 1 ? this._roots[0] : null;
    const crumbs = (soleRoot ? [] : [{ label: "All", data: null }]).concat(
      focusChain(this._focus).map((n2) => ({ label: n2.name, data: n2 }))
    );
    const nav = renderBreadcrumb(this.w, {
      crumbs,
      ariaLabel: "Icicle breadcrumb",
      config: cfg,
      compact: true,
      onNavigate: (i2, crumb) => {
        this._focus = crumb.data === soleRoot ? null : crumb.data;
        this._relayout(this._focus);
        this._applyLayout("zoom");
        this._renderBreadcrumb();
      }
    });
    if (nav) placeInReservedBand(this.w, this.ctx, nav, cfg);
  }
}
ApexCharts__default.use({
  icicle: IcicleChart
});
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
  if (!name || typeof name !== "string") {
    console.warn(
      "ApexCharts: registerSeriesTransform requires a non-empty name."
    );
    return;
  }
  if (typeof fn !== "function") {
    console.warn(
      `ApexCharts: registerSeriesTransform("${name}") expects a function (series, w) => series.`
    );
    return;
  }
  getTransforms()[name] = fn;
}
function stdDev(values) {
  const n2 = values.length;
  if (n2 < 2) return 0;
  let sum2 = 0;
  for (let i2 = 0; i2 < n2; i2++) sum2 += values[i2];
  const mean = sum2 / n2;
  let acc = 0;
  for (let i2 = 0; i2 < n2; i2++) {
    const d = values[i2] - mean;
    acc += d * d;
  }
  return Math.sqrt(acc / n2);
}
function fiveNumberSummary(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a2, b) => a2 - b);
  const q1 = A$1(sorted, 0.25);
  const median = A$1(sorted, 0.5);
  const q3 = A$1(sorted, 0.75);
  const iqr = q3 - q1;
  let lo = sorted[0];
  let hi = sorted[sorted.length - 1];
  let outliers = [];
  if (opts.whiskers === "tukey" && iqr > 0) {
    const loFence = q1 - 1.5 * iqr;
    const hiFence = q3 + 1.5 * iqr;
    let i2 = 0;
    while (i2 < sorted.length && sorted[i2] < loFence) i2++;
    let j2 = sorted.length - 1;
    while (j2 >= 0 && sorted[j2] > hiFence) j2--;
    if (i2 <= j2) {
      lo = sorted[i2];
      hi = sorted[j2];
      outliers = sorted.slice(0, i2).concat(sorted.slice(j2 + 1));
    }
  }
  return { summary: [lo, q1, median, q3, hi], outliers, iqr };
}
function kernelDensity(values, opts = {}) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = values.slice().sort((a2, b) => a2 - b);
  const n2 = sorted.length;
  let h = opts.bandwidth;
  if (!(typeof h === "number" && h > 0)) {
    const sd = stdDev(sorted);
    const iqr = A$1(sorted, 0.75) - A$1(sorted, 0.25);
    const spread = iqr > 0 ? Math.min(sd, iqr / 1.349) : sd;
    h = 0.9 * spread * Math.pow(n2, -1 / 5);
  }
  if (!isFinite(h) || h <= 0) {
    const v = sorted[0];
    const eps = Math.abs(v) > 0 ? Math.abs(v) * 1e-3 : 1e-3;
    return {
      density: [
        [v - eps, 0],
        [v, 1],
        [v + eps, 0]
      ],
      bandwidth: eps
    };
  }
  const steps = Math.max(8, Math.floor(opts.resolution || 64));
  const lo = sorted[0] - 2 * h;
  const hi = sorted[n2 - 1] + 2 * h;
  const step = (hi - lo) / (steps - 1);
  const norm = 1 / (n2 * h * Math.sqrt(2 * Math.PI));
  const density = [];
  for (let g = 0; g < steps; g++) {
    const x2 = lo + g * step;
    let sum2 = 0;
    for (let i2 = 0; i2 < n2; i2++) {
      const z2 = (x2 - sorted[i2]) / h;
      sum2 += Math.exp(-0.5 * z2 * z2);
    }
    density.push([x2, sum2 * norm]);
  }
  return { density, bandwidth: h };
}
function normalizeCounts(counts, opts = {}) {
  let out = counts.slice();
  if (opts.cumulative) {
    let acc = 0;
    out = out.map((c) => acc += c);
  }
  const total = counts.reduce((a2, b) => a2 + b, 0);
  if (total <= 0) return out;
  if (opts.normalize === "relative") {
    return out.map((c) => c / total * 100);
  }
  if (opts.normalize === "density") {
    const w = opts.binWidth;
    if (typeof w === "number" && w > 0) return out.map((c) => c / (total * w));
  }
  return out;
}
function observationsOf(d, allowFlatY) {
  var _a;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;
  let raw = null;
  if (Array.isArray(d.points)) raw = d.points;
  else if (Array.isArray((_a = d.y) == null ? void 0 : _a.points)) raw = d.y.points;
  else if (allowFlatY && Array.isArray(d.y) && typeof d.y[0] === "number") {
    raw = d.y;
  }
  if (!raw) return null;
  const out = [];
  for (let i2 = 0; i2 < raw.length; i2++) {
    const v = Utils.parseNumber(raw[i2]);
    if (v !== null && isFinite(v)) out.push(v);
  }
  return out.length ? out : null;
}
const derivedData = /* @__PURE__ */ new WeakSet();
const derivedSummaryOnly = /* @__PURE__ */ new WeakSet();
function raincloudTransform(ser, w) {
  var _a, _b;
  if (!Array.isArray(ser)) return ser;
  const violinCfg = ((_a = w.config.plotOptions) == null ? void 0 : _a.violin) || {};
  const kde = violinCfg.kde || {};
  const whiskers = ((_b = violinCfg.box) == null ? void 0 : _b.whiskers) || "minmax";
  return ser.map((s2) => {
    if (!Array.isArray(s2 == null ? void 0 : s2.data)) return s2;
    let touched = false;
    const data = s2.data.map((d) => {
      var _a2, _b2;
      const hasDensity = Array.isArray((_a2 = d == null ? void 0 : d.y) == null ? void 0 : _a2.density) && d.y.density.length > 0;
      const hasSummary = Array.isArray((_b2 = d == null ? void 0 : d.y) == null ? void 0 : _b2.summary) && d.y.summary.length === 5;
      if (hasDensity && !derivedData.has(d)) {
        if (hasSummary && !derivedSummaryOnly.has(d)) return d;
        const values2 = observationsOf(d, false);
        if (!values2) return d;
        const summary2 = fiveNumberSummary(values2, { whiskers });
        if (!summary2) return d;
        touched = true;
        const next2 = __spreadProps(__spreadValues({}, d), { y: __spreadProps(__spreadValues({}, d.y), { summary: summary2.summary }) });
        derivedSummaryOnly.add(next2);
        return next2;
      }
      const values = observationsOf(d, true);
      if (!values) return d;
      const est = kernelDensity(values, {
        bandwidth: kde.bandwidth,
        resolution: kde.resolution
      });
      if (!est) return d;
      const summary = fiveNumberSummary(values, { whiskers });
      touched = true;
      const next = __spreadProps(__spreadValues({}, d), {
        y: __spreadValues({
          density: est.density,
          points: values
        }, summary ? { summary: summary.summary } : {})
      });
      derivedData.add(next);
      return next;
    });
    return touched ? __spreadProps(__spreadValues({}, s2), { data }) : s2;
  });
}
registerSeriesTransform("raincloud", raincloudTransform);
const XHTML$1 = "http://www.w3.org/1999/xhtml";
class Breadcrumb {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {import('./Drilldown').default} drilldown
   */
  constructor(w, ctx, drilldown) {
    this.w = w;
    this.ctx = ctx;
    this.drilldown = drilldown;
  }
  /**
   * @param {Array<string|number>} path - ['root', id, id, ...]
   */
  render(path) {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap) return;
    const existing = elWrap.querySelector(".apexcharts-breadcrumb");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    const cfg = w.config.drilldown && w.config.drilldown.breadcrumb;
    if (!cfg || cfg.show === false) return;
    if (this.drilldown.depth === 0) return;
    const nav = BrowserAPIs.createElementNS(XHTML$1, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Drilldown breadcrumb");
    this._position(nav, cfg);
    const separator = cfg.separator != null ? cfg.separator : " / ";
    path.forEach((id, i2) => {
      if (i2 > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML$1, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        nav.appendChild(sep);
      }
      const label2 = this._label(id, i2);
      const isCurrent = i2 === path.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML$1, "span");
        cur.setAttribute(
          "class",
          "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
        );
        cur.setAttribute("aria-current", "page");
        cur.textContent = label2;
        nav.appendChild(cur);
      } else {
        const btn = (
          /** @type {HTMLButtonElement} */
          BrowserAPIs.createElementNS(XHTML$1, "button")
        );
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i2 === 0) {
          const arrow2 = BrowserAPIs.createElementNS(XHTML$1, "span");
          arrow2.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow2.setAttribute("aria-hidden", "true");
          arrow2.textContent = "←";
          btn.appendChild(arrow2);
        }
        const text = BrowserAPIs.createElementNS(XHTML$1, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = label2;
        btn.appendChild(text);
        btn.addEventListener("click", () => this.drilldown.drillToLevel(i2));
        nav.appendChild(btn);
      }
    });
    elWrap.appendChild(nav);
    if (this.w.globals.axisCharts) {
      placeInReservedBand(this.w, this.ctx, nav, cfg);
    }
    this._avoidChromeOverlap(nav);
  }
  /**
   * The breadcrumb is an absolute overlay, so at its default top-left it can
   * sit on top of a left-aligned title (or subtitle). After mounting, push it
   * below any chart chrome it intersects. (Sunburst's self-contained
   * breadcrumb applies the same rule.)
   * @param {HTMLElement} nav
   */
  _avoidChromeOverlap(nav) {
    const w = this.w;
    const chrome = (
      /** @type {Element[]} */
      [".apexcharts-title-text", ".apexcharts-subtitle-text"].map((s2) => w.dom.baseEl.querySelector(s2)).filter((el) => el !== null)
    );
    if (!chrome.length) return;
    const wrapTop = w.dom.elWrap.getBoundingClientRect().top;
    for (let pass = 0; pass < chrome.length + 1; pass++) {
      const nr = nav.getBoundingClientRect();
      const hit = chrome.find((el) => {
        const r2 = el.getBoundingClientRect();
        return nr.left < r2.right && nr.right > r2.left && nr.top < r2.bottom && nr.bottom > r2.top;
      });
      if (!hit) break;
      nav.style.top = `${hit.getBoundingClientRect().bottom - wrapTop + 4}px`;
    }
  }
  /**
   * @param {string|number} id
   * @param {number} index
   * @returns {string}
   */
  _label(id, index) {
    const cfg = this.w.config.drilldown.breadcrumb;
    let label2;
    if (index === 0) {
      label2 = cfg.rootLabel != null ? cfg.rootLabel : "All";
    } else {
      const list = (this.w.config.drilldown.series || []).find(
        (s2) => s2 && s2.id === id
      );
      label2 = list && list.name || String(id);
    }
    if (typeof cfg.formatter === "function") {
      return cfg.formatter(label2, { index, depth: this.drilldown.depth });
    }
    return label2;
  }
  /**
   * @param {HTMLElement} nav
   * @param {Record<string, any>} cfg
   */
  _position(nav, cfg) {
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
}
const XHTML = "http://www.w3.org/1999/xhtml";
const CLASS$1 = "apexcharts-drilldown-loading";
class DrilldownLoading {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w;
    this.el = null;
  }
  /** @returns {any} the drilldown.loading config, normalised. */
  _cfg() {
    const d = this.w.config.drilldown;
    const l2 = d && d.loading;
    if (l2 === false) return { show: false };
    return l2 || {};
  }
  /**
   * Mount the overlay. No-op when disabled, outside a browser, or already up.
   */
  show() {
    if (!Environment.isBrowser()) return;
    const cfg = this._cfg();
    if (cfg.show === false) return;
    const elWrap = this.w.dom.elWrap;
    if (!elWrap) return;
    this.hide();
    const box = BrowserAPIs.createElementNS(XHTML, "div");
    box.setAttribute("class", CLASS$1);
    box.setAttribute("role", "status");
    box.setAttribute("aria-live", "polite");
    box.setAttribute("aria-label", cfg.text || "Loading");
    const spinner = BrowserAPIs.createElementNS(XHTML, "div");
    spinner.setAttribute("class", `${CLASS$1}-spinner`);
    spinner.setAttribute("aria-hidden", "true");
    box.appendChild(spinner);
    if (cfg.text) {
      const label2 = BrowserAPIs.createElementNS(XHTML, "span");
      label2.setAttribute("class", `${CLASS$1}-text`);
      label2.textContent = cfg.text;
      box.appendChild(label2);
    }
    elWrap.appendChild(box);
    this.el = box;
  }
  /** Remove the overlay. Safe to call when it is not mounted. */
  hide() {
    const elWrap = this.w.dom.elWrap;
    if (elWrap) {
      const nodes = elWrap.querySelectorAll(`.${CLASS$1}`);
      for (let i2 = 0; i2 < nodes.length; i2++) {
        const n2 = nodes[i2];
        if (n2.parentNode) n2.parentNode.removeChild(n2);
      }
    } else if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}
const MAX_DEPTH = 32;
const DRILL_MARKER = "__apexDrilldownMarker";
class Drilldown {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.stack = [];
    this.rootSnapshot = null;
    this._wired = false;
    this._asyncCache = /* @__PURE__ */ new Map();
    this._pending = null;
    this._warnedUnreachable = false;
    this._warnedNoSliceOffset = false;
    this.breadcrumb = new Breadcrumb(w, ctx, this);
    this.loading = new DrilldownLoading(w);
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onPlotDown = this._onPlotDown.bind(this);
    this._onPlotClick = this._onPlotClick.bind(this);
    this._downAt = null;
    this._plotClickWired = null;
    this.init();
  }
  init() {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return;
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series);
    }
  }
  // ─── Observable state ──────────────────────────────────────────────────────
  /** @returns {Array<string|number>} e.g. ['root', '2024-quarters'] */
  get path() {
    return ["root", ...this.stack.map((f) => f.id)];
  }
  /** @returns {number} 0 at root */
  get depth() {
    return this.stack.length;
  }
  // ─── Navigation API ────────────────────────────────────────────────────────
  /**
   * Drill into the child level with the given id.
   * @param {string|number} id
   * @param {any} [triggerPoint] - the clicked data point (for events / async ctx)
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  drillDown(id, triggerPoint, meta) {
    const child = this._resolveChild(id);
    if (child) return this._drillInto(child, triggerPoint, meta);
    if (typeof this.w.config.drilldown.onDrillDown === "function") {
      return this._drillDownAsync(id, triggerPoint, meta);
    }
    console.warn(
      `ApexCharts: drilldown id "${id}" not found in chart.drilldown.series, and no onDrillDown resolver is set.`
    );
    return Promise.resolve(this.ctx);
  }
  /**
   * Navigate back one level.
   * @returns {Promise<any>}
   */
  drillUp() {
    return this.drillToLevel(this.stack.length - 1);
  }
  /**
   * Navigate back to the root view.
   * @returns {Promise<any>}
   */
  drillToRoot() {
    return this.drillToLevel(0);
  }
  /**
   * Navigate to an arbitrary depth (0 = root). Used by breadcrumb clicks.
   * @param {number} targetDepth
   * @returns {Promise<any>}
   */
  drillToLevel(targetDepth) {
    const cur = this.stack.length;
    if (targetDepth < 0 || targetDepth >= cur) return Promise.resolve(this.ctx);
    const from = this.path[this.path.length - 1];
    const restore = targetDepth === 0 ? this.rootSnapshot : this.stack[targetDepth].restore;
    this.stack = this.stack.slice(0, targetDepth);
    const to = this.path[this.path.length - 1];
    return this._apply(this._viewFromSnapshot(restore), "up", { from, to });
  }
  // ─── Internals ─────────────────────────────────────────────────────────────
  /**
   * @param {string|number} id
   * @returns {any|null}
   */
  _resolveChild(id) {
    const list = this.w.config.drilldown && this.w.config.drilldown.series;
    if (!Array.isArray(list)) return null;
    return list.find((s2) => s2 && s2.id === id) || null;
  }
  /**
   * @param {any} child
   * @param {any} [triggerPoint]
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillInto(child, triggerPoint, meta) {
    if (this.stack.length >= MAX_DEPTH) {
      console.warn(`ApexCharts: drilldown max depth (${MAX_DEPTH}) reached.`);
      return Promise.resolve(this.ctx);
    }
    if (!this.rootSnapshot) this.rootSnapshot = this._snapshot();
    const from = this.path[this.path.length - 1];
    const level = { id: child.id, name: child.name, restore: this._snapshot() };
    this.stack.push(level);
    return this._apply(this._viewFromChild(child), "down", {
      from,
      to: child.id,
      point: triggerPoint,
      seriesIndex: meta && meta.seriesIndex,
      dataPointIndex: meta && meta.dataPointIndex
    }).catch((error) => {
      if (this.stack[this.stack.length - 1] === level) this.stack.pop();
      this._fire("drillDownError", { id: child.id, error });
      throw error;
    });
  }
  /**
   * Resolve a level through `onDrillDown` and drill into it.
   *
   * Failure never changes state: on a throw, a rejection, or a resolver that
   * hands back something undrillable, the chart stays exactly where it was and
   * `drillDownError` fires. That is what makes this usable against a real
   * backend, where a fetch failing is ordinary rather than exceptional.
   *
   * @param {string|number|null} id
   * @param {any} point
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} [meta]
   * @returns {Promise<any>}
   */
  _drillDownAsync(id, point, meta) {
    const cfg = this.w.config.drilldown;
    const fn = cfg.onDrillDown;
    const cached = this._cacheGet(id);
    if (cached) return this._drillInto(cached, point, meta);
    if (this._pending) return this._pending;
    let result;
    this.loading.show();
    try {
      result = fn({
        // `id` was missing here, so a resolver could not tell WHICH level was
        // asked for without re-deriving it from the point. It is the first
        // thing a real implementation needs (`fetch('/levels/' + id)`).
        id,
        point,
        seriesIndex: meta && meta.seriesIndex,
        dataPointIndex: meta && meta.dataPointIndex
      });
    } catch (error) {
      this.loading.hide();
      this._fire("drillDownError", { id, error });
      return Promise.resolve(this.ctx);
    }
    const settle = () => {
      this._pending = null;
      this.loading.hide();
    };
    const p = Promise.resolve(result).then(
      (child) => {
        settle();
        if (this._isDead()) return this.ctx;
        if (!child || !child.data) {
          this._fire("drillDownError", {
            id,
            error: new Error(
              `drilldown: onDrillDown resolved without a drillable level for id "${id}" (expected an object with a \`data\` array).`
            )
          });
          return this.ctx;
        }
        const level = child.id != null ? child : __spreadProps(__spreadValues({}, child), { id });
        this._cacheSet(id, level);
        return this._drillInto(level, point, meta);
      },
      (error) => {
        settle();
        if (this._isDead()) return this.ctx;
        this._fire("drillDownError", { id, error });
        return this.ctx;
      }
    );
    this._pending = p;
    return p;
  }
  /**
   * Whether the chart was torn down while a resolver was in flight.
   *
   * Clicking to drill and then navigating away is ordinary, not exceptional: a
   * component unmounts, `destroy()` runs, and the fetch settles afterwards.
   * Without this the resolved level would be applied to a destroyed chart,
   * which throws out of `updateOptions` and surfaces in the host app as an
   * unhandled rejection from a click the user has already forgotten about.
   *
   * @returns {boolean}
   */
  _isDead() {
    const w = this.w;
    return !w || !w.globals || w.globals.isDestroyed === true;
  }
  /** @returns {boolean} whether resolved async levels are cached. */
  _cacheEnabled() {
    const cfg = this.w.config.drilldown;
    return !!(cfg && cfg.cache !== false);
  }
  /**
   * @param {string|number|null} id
   * @returns {any|null}
   */
  _cacheGet(id) {
    if (!this._cacheEnabled() || id == null) return null;
    return this._asyncCache.get(id) || null;
  }
  /**
   * @param {string|number|null} id
   * @param {any} level
   */
  _cacheSet(id, level) {
    if (!this._cacheEnabled() || id == null) return;
    this._asyncCache.set(id, level);
  }
  /**
   * Drop cached async levels, so the next drill re-runs `onDrillDown`. Call it
   * when the underlying data changes behind a chart that has already drilled.
   * @param {string|number} [id] a single level, or every level when omitted
   * @returns {any} the chart, for chaining
   */
  clearCache(id) {
    if (id == null) this._asyncCache.clear();
    else this._asyncCache.delete(id);
    return this.ctx;
  }
  /**
   * Capture the overridable surface of the current view so it can be restored.
   * Only fields that some drilldown.series entry can change are cloned; series
   * and chart.type/stacked are always captured.
   * @returns {object}
   */
  _snapshot() {
    const c = this.w.config;
    const fields = this._overrideFields();
    const snap = { series: this._uncollapseSeries(Utils.clone(c.series)) };
    if (Array.isArray(c.labels) && c.labels.length) {
      snap.labels = Utils.clone(c.labels);
    }
    snap.chart = { type: c.chart.type, stacked: c.chart.stacked };
    if (fields.has("xaxis")) snap.xaxis = Utils.clone(c.xaxis);
    if (fields.has("yaxis")) snap.yaxis = Utils.clone(c.yaxis);
    if (fields.has("colors")) snap.colors = c.colors ? Utils.clone(c.colors) : void 0;
    if (fields.has("plotOptions")) snap.plotOptions = Utils.clone(c.plotOptions);
    if (fields.has("fill")) snap.fill = Utils.clone(c.fill);
    if (fields.has("legend")) snap.legend = Utils.clone(c.legend);
    return snap;
  }
  /**
   * Restore any legend-collapsed slices/series to their original values in a
   * cloned series array, so a drill snapshot captures the pre-collapse data.
   * Mirrors legend Helpers' collapse addressing: object-form pie/donut packs
   * every slice as a data point inside `series[0].data`; numeric pie stores a
   * slice per top-level element; axis series carry a `data` array. No-op when
   * nothing is collapsed.
   * @param {any[]} series
   * @returns {any[]}
   */
  _uncollapseSeries(series) {
    const w = this.w;
    const gl = w.globals;
    const entries = [
      ...gl.collapsedSeries || [],
      ...gl.ancillaryCollapsedSeries || []
    ];
    if (!entries.length) return series;
    const type = w.config.chart.type;
    const objectFormPie = (type === "pie" || type === "donut" || type === "polarArea") && series.length === 1 && series[0] && typeof series[0] === "object" && Array.isArray(series[0].data);
    const container = objectFormPie ? series[0].data : series;
    for (const entry of entries) {
      const i2 = entry.index;
      if (gl.axisCharts) {
        if (series[i2]) {
          series[i2].data = Array.isArray(entry.data) ? entry.data.slice() : entry.data;
        }
      } else if (container[i2] && typeof container[i2] === "object") {
        container[i2].y = entry.data;
      } else if (container[i2] !== void 0) {
        container[i2] = entry.data;
      }
    }
    return series;
  }
  /**
   * Union of overridable fields across all declared drilldown levels. Ensures a
   * deep drillToRoot restores everything any intermediate level may have changed.
   * @returns {Set<string>}
   */
  _overrideFields() {
    const fields = /* @__PURE__ */ new Set();
    const list = this.w.config.drilldown && this.w.config.drilldown.series || [];
    for (const s2 of list) {
      if (!s2) continue;
      if (s2.xaxis) fields.add("xaxis");
      if (s2.yaxis) fields.add("yaxis");
      if (s2.colors) fields.add("colors");
      if (s2.plotOptions) fields.add("plotOptions");
      if (s2.fill) fields.add("fill");
      if (s2.legend) fields.add("legend");
    }
    return fields;
  }
  /**
   * Copy the optional view fields shared by a drilldown child level and a
   * restore snapshot (`xaxis`, `yaxis`, `colors`, `plotOptions`, `fill`,
   * `legend`) from `src` onto `view`, only when present.
   * @param {Record<string, any>} view @param {Record<string, any>} src
   */
  _copyOptionalViewFields(view, src) {
    if (src.xaxis) view.xaxis = src.xaxis;
    if (src.yaxis) view.yaxis = src.yaxis;
    if (src.colors) view.colors = src.colors;
    if (src.plotOptions) view.plotOptions = src.plotOptions;
    if (src.fill) view.fill = src.fill;
    if (src.legend) view.legend = src.legend;
  }
  /**
   * Build an updateOptions/updateSeries payload for drilling INTO a child level.
   * Works for axis charts and pie/donut alike: both accept series objects with a
   * `data` array of `{ x, y }` points (pie derives slice labels from `x`).
   * @param {any} child
   * @returns {Record<string, any>}
   */
  _viewFromChild(child) {
    const view = {};
    if (Array.isArray(child.series)) {
      view.series = child.series;
    } else {
      view.series = [{ name: child.name || "", data: child.data }];
    }
    const chart = {};
    if (child.chart && child.chart.type) chart.type = child.chart.type;
    if (child.chart && child.chart.stacked != null) chart.stacked = child.chart.stacked;
    if (Object.keys(chart).length) view.chart = chart;
    this._copyOptionalViewFields(view, child);
    return view;
  }
  /**
   * Build an updateOptions payload from a restore-snapshot.
   * @param {Record<string, any>} snap
   * @returns {Record<string, any>}
   */
  _viewFromSnapshot(snap) {
    const view = { series: snap.series, chart: snap.chart };
    if (snap.labels && snap.labels.length) view.labels = snap.labels;
    this._copyOptionalViewFields(view, snap);
    return view;
  }
  /**
   * Apply a view by delegating to the right update path, firing drill events
   * around it.
   * @param {Record<string, any>} view
   * @param {'down'|'up'} direction
   * @param {object} meta
   * @returns {Promise<any>}
   */
  _apply(view, direction, meta) {
    var _a;
    const w = this.w;
    w.interact.selectedDataPoints = [];
    w.globals.collapsedSeries = [];
    w.globals.collapsedSeriesIndices = [];
    w.globals.ancillaryCollapsedSeries = [];
    w.globals.ancillaryCollapsedSeriesIndices = [];
    w.globals.allSeriesCollapsed = false;
    w.globals.risingSeries = [];
    view.markers = __spreadProps(__spreadValues({}, view.markers || {}), {
      discrete: this._drillMarkers(view.series)
    });
    const animate = (!w.config.drilldown.animation || w.config.drilldown.animation.enabled !== false) && w.config.chart.animations.enabled !== false;
    if (direction === "down") this._fire("drillDownStart", meta);
    (_a = this.ctx.highlightFilter) == null ? void 0 : _a.drillView(view);
    const runUpdate = (anim) => this.ctx.updateOptions(view, false, anim, false, false);
    const done = () => {
      this._fire(direction === "down" ? "drillDownEnd" : "drillUp", meta);
      return this.ctx;
    };
    if (animate && this._zoomEnabled()) {
      const origin = this._triggerOrigin(meta);
      if (origin) {
        return this._zoomDrill(origin, direction, () => runUpdate(false)).then(done);
      }
    }
    return runUpdate(animate).then(done);
  }
  /** @returns {boolean} whether trigger-point zoom is configured on. */
  _zoomEnabled() {
    const a2 = this.w.config.drilldown && this.w.config.drilldown.animation;
    return !!(a2 && a2.zoomFromPoint);
  }
  /** @returns {SVGSVGElement|null} the chart's root <svg> node, if present. */
  _svgNode() {
    const paper = this.w.dom && this.w.dom.Paper;
    return paper && paper.node ? paper.node : null;
  }
  /**
   * The group wrapping ONLY the data marks (bars/cells/tiles) — not the axes,
   * grid, or titles. Animating this keeps the chart frame still while the marks
   * move. Covers bar/line/area (`.apexcharts-plot-series`), heatmap, and treemap.
   * @returns {SVGElement|null}
   */
  _markGroup() {
    const svg = this._svgNode();
    if (!svg || typeof svg.querySelector !== "function") return null;
    return svg.querySelector(
      ".apexcharts-plot-series, .apexcharts-heatmap, .apexcharts-treemap"
    );
  }
  /**
   * Centre of the clicked point in the SVG's view-box pixel space, used as the
   * transform-origin for the mark-group scale (which uses `transform-box:
   * view-box`, so the origin is resolved in SVG coordinates and stays stable
   * across the parent and child renders). Falls back to the mark group's centre
   * when there is no trigger point (e.g. drillUp / imperative drill). Returns
   * null when the marks / SVG / WAAPI are unavailable (SSR / old browsers).
   * @param {object} meta
   * @returns {{ x: number, y: number }|null}
   */
  _triggerOrigin(meta) {
    if (!Environment.isBrowser()) return null;
    const svg = this._svgNode();
    const group2 = this._markGroup();
    if (!svg || !group2 || typeof group2.animate !== "function" || typeof svg.getBoundingClientRect !== "function") {
      return null;
    }
    const svgRect = svg.getBoundingClientRect();
    let el = null;
    if (meta && meta.seriesIndex != null && meta.dataPointIndex != null && this.w.dom.baseEl) {
      el = this.w.dom.baseEl.querySelector(
        `[index="${meta.seriesIndex}"][j="${meta.dataPointIndex}"]`
      );
    }
    if (el && typeof el.getBoundingClientRect === "function") {
      const r2 = el.getBoundingClientRect();
      return {
        x: r2.left + r2.width / 2 - svgRect.left,
        y: r2.top + r2.height / 2 - svgRect.top
      };
    }
    const gRect = group2.getBoundingClientRect();
    return {
      x: gRect.left + gRect.width / 2 - svgRect.left,
      y: gRect.top + gRect.height / 2 - svgRect.top
    };
  }
  /**
   * Run the "expand from the clicked point" choreography around an instant
   * (un-animated) update. Only the data-mark group is animated — the axes, grid,
   * and titles stay fixed, so the effect doesn't drag the whole chart frame. The
   * current marks fade out near-in-place (a quick fade, not a balloon), the child
   * renders invisibly underneath, then the child marks unfold outward from the
   * clicked point: a horizontal-biased scale anchored there, so the bars read as
   * emerging from the column you clicked. Drilling up has no trigger column, so
   * it settles gently from the marks' centre.
   *
   * `transform-box: view-box` resolves the origin in SVG coordinates, so the same
   * origin applies cleanly to the parent and the freshly-rendered child group.
   * @param {{ x: number, y: number }} origin
   * @param {'down'|'up'} direction
   * @param {() => Promise<any>} runUpdate
   * @returns {Promise<void>}
   */
  _zoomDrill(origin, direction, runUpdate) {
    return __async(this, null, function* () {
      const dur = this._zoomDuration();
      const down = direction === "down";
      const outDur = Math.round(dur * 0.55);
      const outTo = down ? "scale(1.03)" : "scale(0.97)";
      const inFrom = down ? "scaleX(0.55) scaleY(0.85)" : "scale(1.04)";
      const anchor = (el) => {
        el.style.transformBox = "view-box";
        el.style.transformOrigin = `${origin.x}px ${origin.y}px`;
      };
      const clear = (el) => {
        el.style.transform = "";
        el.style.opacity = "";
        el.style.transformOrigin = "";
        el.style.transformBox = "";
      };
      const outGroup = this._markGroup();
      let outAnim = null;
      if (outGroup) {
        anchor(outGroup);
        outAnim = outGroup.animate(
          [
            { transform: "scale(1)", opacity: 1 },
            { transform: outTo, opacity: 0 }
          ],
          { duration: outDur, easing: "ease-in", fill: "forwards" }
        );
        try {
          yield outAnim.finished;
        } catch (e2) {
        }
      }
      yield runUpdate();
      const inGroup = this._markGroup();
      if (inGroup) {
        anchor(inGroup);
        inGroup.style.opacity = "0";
        inGroup.style.transform = inFrom;
        if (outAnim && outGroup === inGroup) outAnim.cancel();
        const inAnim = inGroup.animate(
          [
            { transform: inFrom, opacity: 0 },
            { transform: "scale(1)", opacity: 1 }
          ],
          // Decelerating ease so the unfold settles softly into place.
          { duration: dur, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
        );
        try {
          yield inAnim.finished;
        } catch (e2) {
        }
        clear(inGroup);
        inAnim.cancel();
      }
    });
  }
  /** @returns {number} per-phase zoom duration in ms. */
  _zoomDuration() {
    const a2 = this.w.config.drilldown && this.w.config.drilldown.animation;
    const speed = a2 && typeof a2.speed === "number" ? a2.speed : 260;
    return Math.max(80, speed);
  }
  /**
   * Fire a drill event through both the config callback and the listener registry.
   * @param {string} name
   * @param {object} payload
   */
  _fire(name, payload) {
    const cb = this.w.config.chart.events && this.w.config.chart.events[name];
    if (typeof cb === "function") cb(payload, this.ctx, this.w);
    this.ctx.events.fireEvent(name, [payload, this.ctx, this.w]);
  }
  // ─── Click + post-render hooks ───────────────────────────────────────────────
  /**
   * @param {Event} _event
   * @param {any} _ctx
   * @param {{ seriesIndex?: number, dataPointIndex?: number }} opts
   */
  _onPointSelect(_event, _ctx, opts) {
    if (!opts) return void 0;
    const point = this._pointAt(opts.seriesIndex, opts.dataPointIndex);
    if (point && typeof point === "object" && point.drilldown != null) {
      return this.drillDown(point.drilldown, point, opts);
    }
    if (typeof this.w.config.drilldown.onDrillDown === "function") {
      return this._drillDownAsync(null, point, opts);
    }
    return void 0;
  }
  /**
   * @param {number|undefined} seriesIndex
   * @param {number|undefined} dataPointIndex
   * @returns {any|null}
   */
  _pointAt(seriesIndex, dataPointIndex) {
    const series = this.w.config.series;
    if (!Array.isArray(series) || seriesIndex == null || dataPointIndex == null) {
      return null;
    }
    const s2 = series[seriesIndex];
    if (!s2 || !Array.isArray(s2.data)) return null;
    return s2.data[dataPointIndex] != null ? s2.data[dataPointIndex] : null;
  }
  _afterRender() {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return;
    this._markDrillableTargets();
    this._wirePlotClick();
    this.breadcrumb.render(this.path);
    if (w.config.markers) {
      w.config.markers.discrete = this._drillMarkers(w.config.series);
    }
  }
  /**
   * Mark every point that carries a `drilldown` field as an openable target.
   *
   * Two things have to be true for a point to be drillable, and on line/area
   * neither holds by default. It needs a mark to click (with `markers.size: 0`
   * there is no element at all), and that mark has to accept the click: core
   * gives line/area markers `no-pointer-events` so the shared tooltip can track
   * the whole plot, which silently swallows it. `_drillMarkers()` supplies the
   * missing dots; this re-enables pointer events on them.
   *
   * The cursor class only goes on marks that can actually take the click, so we
   * never promise an interaction that cannot happen.
   */
  _markDrillableTargets() {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const series = w.config.series;
    if (!baseEl || !Array.isArray(series)) return;
    let unreachable = 0;
    series.forEach((s2, i2) => {
      const data = s2 && Array.isArray(s2.data) ? s2.data : null;
      if (!data) return;
      data.forEach((point, j2) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const nodes = baseEl.querySelectorAll(`[index="${i2}"][j="${j2}"]`);
        if (!nodes.length) unreachable++;
        nodes.forEach((node) => {
          if (this._isClickThroughMark(node)) {
            node.classList.remove("no-pointer-events");
          }
          node.classList.add("apexcharts-drilldown-target");
        });
      });
    });
    if (unreachable && !this._warnedUnreachable) {
      this._warnedUnreachable = true;
      console.warn(
        `ApexCharts: ${unreachable} drillable point(s) have no clickable mark, so clicking them cannot do anything. Leave \`drilldown.marker\` on, or give the series markers of its own (\`markers.size > 0\`).`
      );
    }
  }
  /**
   * Called by Pie when it declines to wire the slice pull-out because this
   * chart drills. Warned once per chart (a drill re-renders, and the same
   * notice on every navigation is just noise), and from here rather than from
   * Pie because this module is the reason it is unavailable.
   */
  warnSliceOffsetDisabled() {
    if (this._warnedNoSliceOffset) return;
    this._warnedNoSliceOffset = true;
    console.warn(
      "ApexCharts: `plotOptions.pie.expandOnClick` is not available in a drilldown pie/donut, so it was ignored. A slice click navigates, and a slice that slid out would be discarded by the drill it just triggered."
    );
  }
  /**
   * Make the whole band a drillable point owns clickable, not just its dot.
   *
   * A dot is ~6px across, so hitting it takes pixel-precise aim, it is far under
   * the ~44px a finger needs, and the tooltip's arrow points AT the point by
   * design, which puts a triangle over the very thing you are aiming at. Rather
   * than move the tooltip, widen the target: a click anywhere in the plot drills
   * whichever point the tooltip is currently reading. The hit area then matches
   * the feedback already on screen, so "the tooltip says 2024, I click, I get
   * 2024" holds, and the dot goes back to being an affordance rather than a
   * target you have to chase.
   *
   * Only for the point-based types, since a bar, slice or tile is already a
   * comfortably large mark and drilling one by clicking the background near it
   * would be surprising.
   */
  _wirePlotClick() {
    if (!Environment.isBrowser()) return;
    const baseEl = this.w.dom.baseEl;
    if (!baseEl || this._plotClickWired === baseEl) return;
    if (this._plotClickWired) {
      this._plotClickWired.removeEventListener("mousedown", this._onPlotDown);
      this._plotClickWired.removeEventListener("click", this._onPlotClick);
    }
    baseEl.addEventListener("mousedown", this._onPlotDown);
    baseEl.addEventListener("click", this._onPlotClick);
    this._plotClickWired = baseEl;
  }
  /** @param {any} e */
  _onPlotDown(e2) {
    this._downAt = { x: e2.clientX, y: e2.clientY };
  }
  /**
   * @param {any} e
   * @returns {any}
   */
  _onPlotClick(e2) {
    const w = this.w;
    if (!w.config.drilldown || !w.config.drilldown.enabled) return void 0;
    const down = this._downAt;
    this._downAt = null;
    if (down && Math.hypot(e2.clientX - down.x, e2.clientY - down.y) > 4) {
      return void 0;
    }
    const target2 = (
      /** @type {Element} */
      e2.target
    );
    if (!target2 || typeof target2.closest !== "function") return void 0;
    if (target2.closest(".apexcharts-drilldown-target")) return void 0;
    if (target2.closest(
      ".apexcharts-legend, .apexcharts-toolbar, .apexcharts-breadcrumb, .apexcharts-menu, .apexcharts-tooltip"
    )) {
      return void 0;
    }
    const i2 = w.interact.capturedSeriesIndex;
    const j2 = w.interact.capturedDataPointIndex;
    if (i2 == null || j2 == null || i2 < 0 || j2 < 0) return void 0;
    if (!this._isPointBasedSeries(w.config.series[i2])) return void 0;
    const point = this._pointAt(i2, j2);
    if (!point || typeof point !== "object" || point.drilldown == null) {
      return void 0;
    }
    return this.drillDown(point.drilldown, point, {
      seriesIndex: i2,
      dataPointIndex: j2
    });
  }
  /**
   * A series mark that is deliberately click-through. Restricted to markers
   * inside the plot: the tooltip draws its own `no-pointer-events` marker, and
   * that one must stay click-through or it would sit under the cursor and eat
   * the hover it exists to follow.
   * @param {Element} node
   * @returns {boolean}
   */
  _isClickThroughMark(node) {
    if (!node.classList || !node.classList.contains("no-pointer-events")) {
      return false;
    }
    if (!node.classList.contains("apexcharts-marker")) return false;
    return !(typeof node.closest === "function" && node.closest(".apexcharts-tooltip"));
  }
  /**
   * Discrete-marker entries that give each drillable point a visible dot.
   *
   * Only series drawn WITHOUT markers get them, so an author who already shows
   * markers keeps their styling untouched, and only drillable points get one, so
   * the dots read as "these are the ones you can open" rather than turning every
   * point into a dot. Core renders discrete markers even when `markers.size` is
   * 0, which is what makes the affordance possible without a core change.
   *
   * Entries are tagged so a resync replaces ours and leaves the author's alone.
   * @param {any[]} series - the series being rendered (a drill applies its
   *   level's series, which are not yet on `w.config` when this runs)
   * @returns {any[]}
   */
  _drillMarkers(series) {
    const w = this.w;
    const cfg = w.config.drilldown;
    const authored = Array.isArray(w.config.markers && w.config.markers.discrete) ? w.config.markers.discrete.filter(
      (d) => !d || !d[DRILL_MARKER]
    ) : [];
    const mk = cfg && cfg.marker || {};
    if (mk.show === false || !Array.isArray(series)) return authored;
    const own = [];
    series.forEach((s2, i2) => {
      if (!this._seriesNeedsDrillMarker(i2, s2)) return;
      const data = s2 && Array.isArray(s2.data) ? s2.data : null;
      if (!data) return;
      data.forEach((point, j2) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const entry = { seriesIndex: i2, dataPointIndex: j2, [DRILL_MARKER]: true };
        if (mk.size !== void 0) entry.size = mk.size;
        if (mk.shape !== void 0) entry.shape = mk.shape;
        if (mk.fillColor !== void 0) entry.fillColor = mk.fillColor;
        if (mk.strokeColor !== void 0) entry.strokeColor = mk.strokeColor;
        own.push(entry);
      });
    });
    return authored.concat(own);
  }
  /**
   * Whether a series needs drill dots supplied for it: a point-based type whose
   * marks are the markers, drawn with markers off. Bar, pie, treemap and heatmap
   * marks are already real clickable elements, and a series that already shows
   * markers already has its affordance.
   * @param {number} i @param {any} s
   * @returns {boolean}
   */
  _seriesNeedsDrillMarker(i2, s2) {
    if (!this._isPointBasedSeries(s2)) return false;
    const size = this.w.config.markers && this.w.config.markers.size;
    const effective = Array.isArray(size) ? size[i2] : size;
    return !(Number(effective) > 0);
  }
  /**
   * A series whose marks are markers (a point), rather than a shape big enough
   * to aim at on its own.
   * @param {any} s
   * @returns {boolean}
   */
  _isPointBasedSeries(s2) {
    const type = s2 && s2.type || this.w.config.chart.type;
    return type === "line" || type === "area";
  }
}
ApexCharts__default.registerFeatures({ drilldown: Drilldown });
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
    const group2 = graphics.group({ class: "apexcharts-waterfall-connectors" });
    const color = cfg.color || w.config.grid.borderColor;
    const strokeWidth = cfg.strokeWidth == null ? 1 : cfg.strokeWidth;
    const dashArray = cfg.strokeDashArray == null ? 3 : cfg.strokeDashArray;
    let drawn = 0;
    for (let i2 = 0; i2 < geo.length; i2++) {
      const bars = geo[i2];
      if (!Array.isArray(bars)) continue;
      for (let j2 = 0; j2 < bars.length - 1; j2++) {
        const a2 = bars[j2];
        const b = bars[j2 + 1];
        if (!a2 || !b) continue;
        const gap = b.slotStart - a2.slotEnd;
        if (!(gap > 0.5)) continue;
        const line = a2.horizontal ? graphics.drawLine(
          a2.levelEnd,
          a2.slotEnd,
          a2.levelEnd,
          b.slotStart,
          color,
          dashArray,
          strokeWidth
        ) : graphics.drawLine(
          a2.slotEnd,
          a2.levelEnd,
          b.slotStart,
          a2.levelEnd,
          color,
          dashArray,
          strokeWidth
        );
        line.node.classList.add("apexcharts-waterfall-connector");
        group2.add(line);
        drawn++;
      }
    }
    if (!drawn) return;
    group2.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
    const xaxisEl = host.node.querySelector(".apexcharts-xaxis");
    if (xaxisEl) {
      host.node.insertBefore(group2.node, xaxisEl);
    } else {
      host.add(group2);
    }
    this.holdUntilBarsLand(group2);
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
  holdUntilBarsLand(group2) {
    const w = this.w;
    const animate = Environment.isBrowser() && w.globals.shouldAnimate && !w.globals.animationEnded;
    if (!animate) return;
    group2.node.classList.add("apexcharts-element-hidden");
    w.globals.delayedElements.push({ el: group2.node, holdUntilComplete: true });
  }
}
function readDatum$2(d, j2, categories) {
  const fallbackX = categories && categories[j2] !== void 0 ? categories[j2] : j2 + 1;
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
  for (let j2 = 0; j2 < data.length; j2++) {
    const d = data[j2];
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
  for (let j2 = 0; j2 < data.length; j2++) {
    const { x: x2, y, isSubtotal, isTotal, rest } = readDatum$2(
      data[j2],
      j2,
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
        rows.push(__spreadProps(__spreadValues({}, rest), { x: x2, y: null }));
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
      x: x2,
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
    gl.waterfallRawSeries = ser.map((s2) => __spreadProps(__spreadValues({}, s2), {
      data: Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data.slice() : s2 == null ? void 0 : s2.data
    }));
  }
  const raw = gl.waterfallRawSeries;
  const colors = ((_b = (_a = cnf.plotOptions) == null ? void 0 : _a.waterfall) == null ? void 0 : _b.colors) || {};
  const categories = (_c = cnf.xaxis) == null ? void 0 : _c.categories;
  const collapsed = gl.collapsedSeriesIndices || [];
  const values = [];
  const cumulative = [];
  const kinds = [];
  const out = raw.map((s2, i2) => {
    const data = Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data : [];
    if (collapsed.indexOf(i2) !== -1) {
      values[i2] = [];
      cumulative[i2] = [];
      kinds[i2] = [];
      return __spreadProps(__spreadValues({}, s2), { data: [] });
    }
    if (isPrecomputed(data)) {
      values[i2] = data.map((d) => {
        const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
        if (!Array.isArray(y)) return null;
        const lo = Utils.parseNumber(y[0]);
        const hi = Utils.parseNumber(y[1]);
        return lo === null || hi === null ? null : hi - lo;
      });
      cumulative[i2] = data.map((d) => {
        const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
        const hi = Array.isArray(y) ? Utils.parseNumber(y[1]) : null;
        return hi === null ? 0 : hi;
      });
      kinds[i2] = data.map(() => null);
      return s2;
    }
    const acc = accumulate(data, categories, colors);
    values[i2] = acc.values;
    cumulative[i2] = acc.cumulative;
    kinds[i2] = acc.kinds;
    return __spreadProps(__spreadValues({}, s2), { data: acc.data });
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
registerSeriesTransform("waterfall", waterfallTransform);
ApexCharts__default.registerFeatures({ waterfall: Waterfall });
function readDatum$1(d, j2, categories) {
  const fallbackX = categories && categories[j2] !== void 0 ? categories[j2] : j2 + 1;
  if (d == null) return { x: fallbackX, y: null, rest: {} };
  if (Array.isArray(d)) {
    return { x: d[0] !== void 0 ? d[0] : fallbackX, y: d[1], rest: {} };
  }
  if (typeof d === "object") {
    return { x: d.x !== void 0 ? d.x : fallbackX, y: d.y, rest: d };
  }
  return { x: fallbackX, y: d, rest: {} };
}
function isPairShaped$1(data) {
  for (let j2 = 0; j2 < data.length; j2++) {
    const d = data[j2];
    const y = Array.isArray(d) ? d[1] : d && typeof d === "object" ? d.y : d;
    if (Array.isArray(y) && y.length === 2) return true;
  }
  return false;
}
function joinOnX$1(raw, categories) {
  var _a;
  const xs = [];
  const rows = [];
  const seen = /* @__PURE__ */ new Map();
  const byX = [];
  for (let i2 = 0; i2 < raw.length; i2++) {
    const data = Array.isArray((_a = raw[i2]) == null ? void 0 : _a.data) ? raw[i2].data : [];
    const map = /* @__PURE__ */ new Map();
    for (let j2 = 0; j2 < data.length; j2++) {
      const { x: x2, y, rest } = readDatum$1(data[j2], j2, categories);
      const key = x2 instanceof Date ? x2.getTime() : x2;
      if (!seen.has(key)) {
        seen.set(key, xs.length);
        xs.push(x2);
        rows.push(__spreadValues({}, rest));
      }
      const rowIndex = (
        /** @type {number} */
        seen.get(key)
      );
      map.set(rowIndex, Utils.parseNumber(y));
    }
    byX.push(map);
  }
  return { xs, rows, byX };
}
function dumbbellTransform(ser, w) {
  var _a;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.dumbbellRawSeries) {
    gl.dumbbellRawSeries = ser.map((s2) => __spreadProps(__spreadValues({}, s2), {
      data: Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data.slice() : s2 == null ? void 0 : s2.data
    }));
  }
  const raw = gl.dumbbellRawSeries;
  const alreadyPaired = raw.some(
    (s2) => isPairShaped$1(Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data : [])
  );
  if (alreadyPaired) {
    w.dumbbellData = {
      form: "pairs",
      names: [],
      values: [],
      order: [],
      carrier: 0,
      hidden: []
    };
    return ser;
  }
  const categories = (_a = cnf.xaxis) == null ? void 0 : _a.categories;
  const collapsed = gl.collapsedSeriesIndices || [];
  const { xs, rows, byX } = joinOnX$1(raw, categories);
  const values = [];
  const order = [];
  const visible = [];
  for (let k2 = 0; k2 < raw.length; k2++) {
    if (collapsed.indexOf(k2) === -1) visible.push(k2);
  }
  const data = [];
  for (let j2 = 0; j2 < xs.length; j2++) {
    const rowValues = [];
    for (let k2 = 0; k2 < raw.length; k2++) {
      const v = byX[k2].has(j2) ? byX[k2].get(j2) : null;
      rowValues.push(
        v === null || v === void 0 || !isFinite(v) ? null : v
      );
    }
    values.push(rowValues);
    let lo = null;
    let hi = null;
    let kLo = -1;
    let kHi = -1;
    for (let vi = 0; vi < visible.length; vi++) {
      const k2 = visible[vi];
      const v = rowValues[k2];
      if (v === null) continue;
      if (lo === null || v < lo) {
        lo = v;
        kLo = k2;
      }
      if (hi === null || v > hi) {
        hi = v;
        kHi = k2;
      }
    }
    if (lo === null || hi === null) {
      order.push(null);
      data.push(__spreadProps(__spreadValues({}, rows[j2]), { x: xs[j2], y: null }));
      continue;
    }
    order.push([kLo, kHi]);
    data.push(__spreadProps(__spreadValues({}, rows[j2]), { x: xs[j2], y: [lo, hi] }));
  }
  w.dumbbellData = {
    form: "series",
    names: raw.map(
      (s2, k2) => {
        var _a2;
        return (_a2 = s2 == null ? void 0 : s2.name) != null ? _a2 : `Series ${k2 + 1}`;
      }
    ),
    values,
    order,
    carrier: visible.length ? visible[0] : 0,
    hidden: raw.map((_2, k2) => k2).filter((k2) => collapsed.indexOf(k2) !== -1)
  };
  const carrier = w.dumbbellData.carrier;
  return raw.map((s2, k2) => __spreadProps(__spreadValues({}, s2), {
    // Every endpoint stays a series so the legend keeps its name, its colour
    // and its click. Only one of them carries the merged rows: drawing the
    // same rows N times would stack N identical connectors.
    data: k2 === carrier && visible.length ? data : []
  }));
}
registerSeriesTransform("dumbbell", dumbbellTransform);
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
    const group2 = graphics.group({ class: "apexcharts-streamgraph-labels" });
    const fontSize = ((_c = cfg.style) == null ? void 0 : _c.fontSize) || "auto";
    const fontFamily = ((_d = cfg.style) == null ? void 0 : _d.fontFamily) || w.config.chart.fontFamily;
    const fontWeight = ((_e = cfg.style) == null ? void 0 : _e.fontWeight) || 600;
    const minWidth = cfg.minWidth == null ? 24 : cfg.minWidth;
    const placed = [];
    for (let i2 = 0; i2 < data.order.length; i2++) {
      const k2 = data.order[i2];
      const label2 = this._placeLabel(k2, {
        fontSize,
        fontFamily,
        fontWeight,
        minWidth,
        graphics
      });
      if (label2) placed.push(label2);
    }
    let drawn = 0;
    for (const label2 of this._deconflict(placed)) {
      const k2 = label2.k;
      const el = graphics.drawText({
        x: label2.x,
        y: label2.y,
        text: label2.text,
        textAnchor: "middle",
        dominantBaseline: "middle",
        // The size a band's own name is drawn at is decided per band, not per
        // chart (see `_resolveFontSize`).
        fontSize: label2.fontSize,
        fontFamily,
        fontWeight,
        foreColor: ((_g = (_f = cfg.style) == null ? void 0 : _f.colors) == null ? void 0 : _g[k2]) || label2.color,
        cssClass: "apexcharts-streamgraph-label"
      });
      el.node.setAttribute("data:realIndex", String(k2));
      group2.add(el);
      drawn++;
    }
    if (!drawn) return;
    const xaxisEl = host.node.querySelector(".apexcharts-xaxis");
    if (xaxisEl) {
      host.node.insertBefore(group2.node, xaxisEl);
    } else {
      host.add(group2);
    }
    this.holdUntilBandsLand(group2);
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
  _placeLabel(k2, { fontSize, fontFamily, fontWeight, minWidth, graphics }) {
    const w = this.w;
    const data = w.streamgraphData;
    const lo = data.lows[k2];
    const hi = data.highs[k2];
    if (!lo || !hi) return null;
    const xPx = w.globals.seriesXvalues[k2];
    const m = lo.length;
    if (!Array.isArray(xPx) || xPx.length < m || m === 0) return null;
    const thickness = new Array(m);
    let peakT = 0;
    for (let j2 = 0; j2 < m; j2++) {
      const t2 = Math.abs(this._yPx(hi[j2]) - this._yPx(lo[j2]));
      thickness[j2] = t2;
      if (t2 > peakT) peakT = t2;
    }
    if (peakT <= 0) return null;
    const size = this._resolveFontSize(fontSize, peakT);
    const name = String(data.names[k2]);
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
        for (let j2 = run.l; j2 <= run.r; j2++) {
          const dx = Math.abs(Number(xPx[j2]) - cx);
          if (dx < bestDx) {
            bestDx = dx;
            anchor = j2;
          }
        }
        candidates.push({
          x: cx,
          y: (this._yPx(lo[anchor]) + this._yPx(hi[anchor])) / 2,
          text,
          color: this._contrastOn(k2),
          fontSize: `${px}px`,
          width: drawnWidth,
          height: rect.height
        });
      }
      if (candidates.length >= 6) break;
    }
    return candidates.length ? { k: k2, weight: peakT, candidates } : null;
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
    let j2 = 0;
    while (j2 < m) {
      if (thickness[j2] < needed) {
        j2++;
        continue;
      }
      let end = j2;
      let maxT = thickness[j2];
      while (end + 1 < m && thickness[end + 1] >= needed) {
        end++;
        if (thickness[end] > maxT) maxT = thickness[end];
      }
      runs.push({ l: j2, r: end, maxT });
      j2 = end + 1;
    }
    return runs.sort((a2, b) => b.maxT - a2.maxT);
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
    const byImportance = labels.slice().sort((a2, b) => b.weight - a2.weight);
    const kept = [];
    const free = (box) => !kept.some(
      (o2) => box.left < o2.box.right && box.right > o2.box.left && box.top < o2.box.bottom && box.bottom > o2.box.top
    );
    for (const label2 of byImportance) {
      for (const c of label2.candidates) {
        const box = {
          left: c.x - c.width / 2,
          right: c.x + c.width / 2,
          top: c.y - c.height / 2,
          bottom: c.y + c.height / 2
        };
        if (free(box)) {
          kept.push(__spreadProps(__spreadValues({ k: label2.k }, c), { box }));
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
  _contrastOn(k2) {
    var _a;
    const w = this.w;
    const fill = (_a = w.globals.colors) == null ? void 0 : _a[k2];
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
    svg.addEventListener("mousemove", (e2) => {
      if (!this.isActive() || !this.w.streamgraphData) return;
      this._dim(this._bandAt(e2));
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
  _bandAt(e2) {
    const w = this.w;
    const d = w.streamgraphData;
    if (!d || !d.order.length) return -1;
    const svg = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-svg");
    if (!svg) return -1;
    const rect = svg.getBoundingClientRect();
    const zoom = w.globals.svgWidth ? rect.width / w.globals.svgWidth : 1;
    const px = AxisMapping.screenXToPlotPx(w, e2.clientX);
    const py = (e2.clientY - rect.top) / (zoom || 1) - w.layout.translateY;
    if (px < 0 || px > w.layout.gridWidth) return -1;
    if (py < 0 || py > w.layout.gridHeight) return -1;
    const xs = w.globals.seriesXvalues[d.order[0]];
    if (!Array.isArray(xs) || !xs.length) return -1;
    const captured = w.interact ? w.interact.capturedDataPointIndex : -1;
    let j2 = -1;
    if (captured >= 0 && captured < xs.length) {
      j2 = captured;
    } else {
      let best = Infinity;
      for (let i2 = 0; i2 < xs.length; i2++) {
        const dx = Math.abs(Number(xs[i2]) - px);
        if (dx < best) {
          best = dx;
          j2 = i2;
        }
      }
    }
    if (j2 < 0) return -1;
    let nearest2 = -1;
    let gap = Infinity;
    for (let i2 = 0; i2 < d.order.length; i2++) {
      const k2 = d.order[i2];
      const a2 = this._yPx(d.highs[k2][j2]);
      const b = this._yPx(d.lows[k2][j2]);
      const top = Math.min(a2, b);
      const bottom = Math.max(a2, b);
      if (py >= top && py <= bottom) return k2;
      const dist = py < top ? top - py : py - bottom;
      if (dist < gap) {
        gap = dist;
        nearest2 = k2;
      }
    }
    return nearest2;
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
  _dim(k2) {
    const w = this.w;
    if (k2 === this._hovered) return;
    this._hovered = k2;
    const cfg = this._hoverCfg();
    const dimmed = cfg.opacity == null ? 0.35 : cfg.opacity;
    const bands = w.dom.baseEl.querySelectorAll(".apexcharts-series");
    const labels = w.dom.baseEl.querySelectorAll(
      ".apexcharts-streamgraph-label"
    );
    const focused = (el, index) => k2 < 0 || index === k2;
    for (let i2 = 0; i2 < bands.length; i2++) {
      const el = (
        /** @type {any} */
        bands[i2]
      );
      el.style.transition = "opacity .15s ease";
      el.style.opacity = focused(el, Number(el.getAttribute("data:realIndex"))) ? "" : String(dimmed);
    }
    for (let i2 = 0; i2 < labels.length; i2++) {
      const el = (
        /** @type {any} */
        labels[i2]
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
    for (let i2 = 0; i2 < bands.length; i2++) {
      const el = (
        /** @type {any} */
        bands[i2]
      );
      el.style.opacity = "";
    }
    const labels = w.dom.baseEl.querySelectorAll(
      ".apexcharts-streamgraph-label"
    );
    for (let i2 = 0; i2 < labels.length; i2++) {
      this._restoreLabel(
        /** @type {any} */
        labels[i2]
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
  holdUntilBandsLand(group2) {
    const w = this.w;
    const animate = Environment.isBrowser() && w.globals.shouldAnimate && !w.globals.animationEnded;
    if (!animate) return;
    group2.node.classList.add("apexcharts-element-hidden");
    w.globals.delayedElements.push({ el: group2.node, holdUntilComplete: true });
  }
}
const OFFSETS = ["wiggle", "silhouette", "zero", "expand"];
const ORDERS$1 = ["inside-out", "inverse", "none"];
function readDatum(d, j2, categories) {
  const fallbackX = categories && categories[j2] !== void 0 ? categories[j2] : j2 + 1;
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
  for (let j2 = 0; j2 < data.length; j2++) {
    const d = data[j2];
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
  for (let k2 = 0; k2 < raw.length; k2++) {
    const data = Array.isArray((_a = raw[k2]) == null ? void 0 : _a.data) ? raw[k2].data : [];
    const grid = /* @__PURE__ */ new Map();
    for (let j2 = 0; j2 < data.length; j2++) {
      const { x: x2, y, rest } = readDatum(data[j2], j2, categories);
      const key = x2 instanceof Date ? x2.getTime() : x2;
      if (!seen.has(key)) {
        seen.set(key, xs.length);
        xs.push(x2);
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
  for (let j2 = 0; j2 < xs.length; j2++) {
    const x2 = xs[j2] instanceof Date ? xs[j2].getTime() : xs[j2];
    if (typeof x2 !== "number" || !isFinite(x2)) return null;
    idx.push(j2);
  }
  const keyed = idx.map((j2) => ({
    j: j2,
    v: xs[j2] instanceof Date ? xs[j2].getTime() : xs[j2]
  }));
  keyed.sort((a2, b) => a2.v - b.v);
  const perm = keyed.map((e2) => e2.j);
  for (let j2 = 0; j2 < perm.length; j2++) {
    if (perm[j2] !== j2) return perm;
  }
  return null;
}
function orderBands(mode, visible, values) {
  if (mode === "none") return visible.slice();
  if (mode === "inverse") return visible.slice().reverse();
  const sums = {};
  const peaks = {};
  for (let i2 = 0; i2 < visible.length; i2++) {
    const k2 = visible[i2];
    const v = values[k2];
    let sum2 = 0;
    let best = -Infinity;
    let bestJ = 0;
    for (let j2 = 0; j2 < v.length; j2++) {
      sum2 += v[j2];
      if (v[j2] > best) {
        best = v[j2];
        bestJ = j2;
      }
    }
    sums[k2] = sum2;
    peaks[k2] = bestJ;
  }
  const byPeak = visible.slice().sort((a2, b) => peaks[a2] - peaks[b] || a2 - b);
  let top = 0;
  let bottom = 0;
  const tops = [];
  const bottoms = [];
  for (let i2 = 0; i2 < byPeak.length; i2++) {
    const k2 = byPeak[i2];
    if (top < bottom) {
      top += sums[k2];
      tops.push(k2);
    } else {
      bottom += sums[k2];
      bottoms.push(k2);
    }
  }
  return bottoms.reverse().concat(tops);
}
function baselineFor(mode, order, stack, m) {
  const base = new Array(m).fill(0);
  if (m === 0 || order.length === 0) return base;
  if (mode === "zero" || mode === "expand") return base;
  if (mode === "silhouette") {
    for (let j2 = 0; j2 < m; j2++) {
      let total = 0;
      for (let i2 = 0; i2 < order.length; i2++) total += stack[order[i2]][j2];
      base[j2] = -total / 2;
    }
    return base;
  }
  let y = 0;
  for (let j2 = 1; j2 < m; j2++) {
    let s1 = 0;
    let s2 = 0;
    for (let i2 = 0; i2 < order.length; i2++) {
      const vi = stack[order[i2]];
      const now = vi[j2];
      let moved = (now - vi[j2 - 1]) / 2;
      for (let k2 = 0; k2 < i2; k2++) {
        const vk = stack[order[k2]];
        moved += vk[j2] - vk[j2 - 1];
      }
      s1 += now;
      s2 += moved * now;
    }
    if (s1) y -= s2 / s1;
    base[j2] = y;
  }
  return base;
}
function streamgraphTransform(ser, w) {
  var _a, _b;
  const cnf = w.config;
  const gl = w.globals;
  if (!Array.isArray(ser)) return ser;
  if (!gl.streamgraphRawSeries) {
    gl.streamgraphRawSeries = ser.map((s2) => __spreadProps(__spreadValues({}, s2), {
      data: Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data.slice() : s2 == null ? void 0 : s2.data
    }));
  }
  const raw = gl.streamgraphRawSeries;
  if (raw.some(
    (s2) => isPairShaped(Array.isArray(s2 == null ? void 0 : s2.data) ? s2.data : [])
  )) {
    w.streamgraphData = null;
    return ser;
  }
  const opts = ((_a = cnf.plotOptions) == null ? void 0 : _a.streamgraph) || {};
  const offset = OFFSETS.indexOf(opts.offset) !== -1 ? opts.offset : "wiggle";
  const order = ORDERS$1.indexOf(opts.order) !== -1 ? opts.order : "inside-out";
  const categories = (_b = cnf.xaxis) == null ? void 0 : _b.categories;
  const collapsed = gl.collapsedSeriesIndices || [];
  const { xs, rows, grids } = joinOnX(raw, categories);
  const perm = sortColumns(xs);
  const columns = perm ? perm.map((j2) => xs[j2]) : xs;
  const columnRows = perm ? perm.map((j2) => rows[j2]) : rows;
  const m = columns.length;
  let sawNegative = false;
  const values = [];
  for (let k2 = 0; k2 < raw.length; k2++) {
    const row = new Array(m);
    for (let j2 = 0; j2 < m; j2++) {
      const src = grids[k2].get(perm ? perm[j2] : j2);
      let v = src === void 0 || src === null ? 0 : Number(src);
      if (!isFinite(v)) v = 0;
      if (v < 0) {
        sawNegative = true;
        v = 0;
      }
      row[j2] = v;
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
  for (let k2 = 0; k2 < raw.length; k2++) {
    if (collapsed.indexOf(k2) === -1) visible.push(k2);
  }
  let stack = values;
  if (offset === "expand") {
    stack = values.map((row) => row.slice());
    for (let j2 = 0; j2 < m; j2++) {
      let total = 0;
      for (let i2 = 0; i2 < visible.length; i2++) total += stack[visible[i2]][j2];
      if (total) {
        for (let i2 = 0; i2 < visible.length; i2++) stack[visible[i2]][j2] /= total;
      }
    }
  }
  const bandOrder = orderBands(order, visible, stack);
  const base = baselineFor(offset, bandOrder, stack, m);
  const lows = raw.map(() => null);
  const highs = raw.map(() => null);
  for (let i2 = 0; i2 < bandOrder.length; i2++) {
    lows[bandOrder[i2]] = new Array(m);
    highs[bandOrder[i2]] = new Array(m);
  }
  for (let j2 = 0; j2 < m; j2++) {
    let acc = base[j2];
    for (let i2 = 0; i2 < bandOrder.length; i2++) {
      const k2 = bandOrder[i2];
      const bandLo = (
        /** @type {number[]} */
        lows[k2]
      );
      const bandHi = (
        /** @type {number[]} */
        highs[k2]
      );
      bandLo[j2] = acc;
      acc += stack[k2][j2];
      bandHi[j2] = acc;
    }
  }
  w.streamgraphData = {
    names: raw.map(
      (s2, k2) => {
        var _a2;
        return (_a2 = s2 == null ? void 0 : s2.name) != null ? _a2 : `Series ${k2 + 1}`;
      }
    ),
    xs: columns,
    values,
    lows,
    highs,
    order: bandOrder,
    offset,
    hidden: raw.map((_2, k2) => k2).filter((k2) => collapsed.indexOf(k2) !== -1)
  };
  return raw.map((s2, k2) => {
    const lo = lows[k2];
    const hi = highs[k2];
    if (!lo || !hi) return __spreadProps(__spreadValues({}, s2), { data: [] });
    const data = new Array(m);
    for (let j2 = 0; j2 < m; j2++) {
      data[j2] = __spreadProps(__spreadValues({}, columnRows[j2]), { x: columns[j2], y: [lo[j2], hi[j2]] });
    }
    return __spreadProps(__spreadValues({}, s2), { data });
  });
}
registerSeriesTransform("streamgraph", streamgraphTransform);
ApexCharts__default.registerFeatures({ streamgraph: StreamLabels });
const addResizeListener = ApexCharts.__apex_Resize_addResizeListener;
const removeResizeListener = ApexCharts.__apex_Resize_removeResizeListener;
function warnMissingFeature(subject, feature, opts = {}) {
  const {
    module = `features/${feature}`,
    entry,
    scripts = [`features/${feature}.js`],
    tail
  } = opts;
  const tags = scripts.map((f) => `<script src='.../dist/${f}'>`).join(" and ");
  globalThis.console.warn(
    `ApexCharts: ${subject} requires the ${feature} feature, which is not in this bundle. Bundler: import 'apexcharts/${module}'` + (entry ? ` (or from 'apexcharts/${entry}')` : "") + `. Script tag: add ${tags} after the ApexCharts script, or load apexcharts.full.min.js instead.` + (tail ? ` ${tail}` : "")
  );
}
class SvgRenderer {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.kind = "svg";
  }
  // ── lifecycle (SVG builds its layer via the existing plotChartType flow) ──
  beginSeries() {
  }
  present() {
    return null;
  }
  clear() {
  }
  // ── emit primitives (delegate to Graphics: the canvas renderer mirrors
  //    this exact surface) ──
  /** @param {any} attrs */
  group(attrs) {
    return this.ctx.graphics.group(attrs);
  }
  /** @param {any} opts */
  drawPath(opts) {
    return this.ctx.graphics.drawPath(opts);
  }
  /** @param {any[]} args */
  drawLine(...args) {
    return this.ctx.graphics.drawLine(...args);
  }
  /** @param {any[]} args */
  drawRect(...args) {
    return this.ctx.graphics.drawRect(...args);
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r2, attrs) {
    return this.ctx.graphics.drawCircle(r2, attrs);
  }
  /** @param {any} opts */
  drawText(opts) {
    return this.ctx.graphics.drawText(opts);
  }
  /**
   * A series mark path (animation-aware). Faithful passthrough to Graphics.
   * Note: the SVG emit path in the per-type draw() methods routes through
   * `seriesEmitter`, which returns the caller's own `Graphics` in SVG mode: so
   * this method is the interface contract surface (mirrored by the canvas
   * renderer), not the hot path.
   * @param {any} opts
   */
  renderPaths(opts) {
    return this.ctx.graphics.renderPaths(opts);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x2, y, opts = {}) {
    return this.ctx.graphics.drawMarker(x2, y, opts);
  }
  // ── capabilities: SVG supports everything the interface enumerates ──
  /** @param {string} _feature */
  supports(_feature) {
    return true;
  }
  // ── interaction: the DOM does this natively in SVG mode ──
  hitTest() {
    return null;
  }
  restyle() {
  }
  // ── export: SVG serializes directly; no bitmap to composite ──
  toBitmap() {
    return null;
  }
  destroy() {
  }
}
const OK_FILTER_TYPES = ["none", "lighten", "darken"];
function seriesEmitter(ctx, graphics) {
  const r2 = ctx && ctx.renderer;
  return r2 && r2.kind && r2.kind !== "svg" ? r2 : graphics;
}
function computeMarkCount(w) {
  const series = w.config.series || [];
  const type = w.config.chart.type;
  const scatterish = type === "scatter" || type === "bubble";
  const markerSize = w.config.markers && w.config.markers.size;
  const markersOn = Array.isArray(markerSize) ? markerSize.some((s2) => s2 > 0) : (markerSize || 0) > 0;
  const labelsOn = !!(w.config.dataLabels && w.config.dataLabels.enabled);
  const isHeatmap = type === "heatmap";
  let total = 0;
  let maxLen = 0;
  series.forEach((s2) => {
    const n2 = Array.isArray(s2.data) ? s2.data.length : 0;
    if (n2 > maxLen) maxLen = n2;
    if (scatterish || markersOn || isHeatmap) total += n2;
    if (labelsOn) total += n2;
  });
  const LARGE_D = 5e4;
  if (maxLen >= LARGE_D) total = Math.max(total, maxLen);
  return total;
}
function hasCanvasUnsupportedFeature(w) {
  var _a, _b, _c, _d;
  const fillType = w.config.fill && w.config.fill.type;
  const isUnsupportedFill = (t2) => t2 === "pattern" || t2 === "image" || t2 === "gradient";
  if (Array.isArray(fillType) ? fillType.some(isUnsupportedFill) : isUnsupportedFill(fillType)) {
    return true;
  }
  const lineColors = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.line) == null ? void 0 : _b.colors;
  if (lineColors && lineColors.colorAboveThreshold && lineColors.colorBelowThreshold) {
    return true;
  }
  if (w.config.chart.type === "heatmap" && (((_d = (_c = w.config.plotOptions) == null ? void 0 : _c.heatmap) == null ? void 0 : _d.shape) || "rect") !== "rect") {
    return true;
  }
  const states = w.config.states || {};
  const hoverFilter = states.hover && states.hover.filter && states.hover.filter.type;
  const activeFilter = states.active && states.active.filter && states.active.filter.type;
  if (hoverFilter && !OK_FILTER_TYPES.includes(hoverFilter)) return true;
  if (activeFilter && !OK_FILTER_TYPES.includes(activeFilter)) return true;
  return false;
}
const RENDERER_REGISTRY_KEY = "__apexcharts_renderers__";
function getRendererRegistry() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[RENDERER_REGISTRY_KEY]) g[RENDERER_REGISTRY_KEY] = /* @__PURE__ */ new Map();
  return g[RENDERER_REGISTRY_KEY];
}
class RendererController {
  /** Same Map as getRendererRegistry(); exposed for tests/tooling. */
  static get _rendererRegistry() {
    return getRendererRegistry();
  }
  /**
   * @param {string} kind
   * @param {(w: any, ctx: any) => any} factory
   */
  static registerRenderer(kind, factory) {
    getRendererRegistry().set(kind, factory);
  }
  /**
   * Remove a registered renderer backend (tests / hot-reload). Charts fall
   * back to SVG on their next resolve().
   * @param {string} kind
   */
  static unregisterRenderer(kind) {
    getRendererRegistry().delete(kind);
  }
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.svg = new SvgRenderer(w, ctx);
    this.active = this.svg;
    this._activeKind = "svg";
    this._instances = {};
    this.w.globals.activeRenderer = this.active;
  }
  /**
   * Make `renderer` the active one everywhere it is read: here, on ctx, and
   * mirrored on globals so w-only modules (tooltip hit tests, Series
   * hover/legend restyle) can reach it without threading ctx. The mirror is
   * persistent state (see Globals.globalVars), so it holds until the next
   * resolve() or teardown(), across any number of data-only updates.
   * @param {import('../renderers/Renderer').RendererKind} kind
   * @param {any} renderer
   */
  _activate(kind, renderer) {
    this.active = renderer;
    this._activeKind = kind;
    this.ctx.renderer = renderer;
    this.w.globals.activeRenderer = renderer;
  }
  /**
   * The kind selection WANTS (before availability/fallback). Pure.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  _desiredKind() {
    const cfg = this.w.config.chart;
    const mode = cfg.renderer || "svg";
    if (!Environment.isBrowser()) return "svg";
    if (mode === "svg") return "svg";
    if (hasCanvasUnsupportedFeature(this.w)) return "svg";
    if (mode === "canvas") return "canvas";
    const marks2 = computeMarkCount(this.w);
    const threshold = cfg.rendererThreshold || 8e3;
    return marks2 >= threshold ? "canvas" : "svg";
  }
  /**
   * Resolve + instantiate the active renderer and set `ctx.renderer`. Falls
   * back to SVG (with a warning only when canvas was explicitly requested) if
   * the desired backend is not registered.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  resolve() {
    const mode = this.w.config.chart.renderer || "svg";
    const desired = this._desiredKind();
    if (desired !== "svg") {
      const factory = getRendererRegistry().get(desired);
      if (factory) {
        if (!this._instances[desired]) {
          this._instances[desired] = factory(this.w, this.ctx);
        }
        this._activate(desired, this._instances[desired]);
        return this._activeKind;
      }
      if (mode === desired) {
        warnMissingFeature(
          `\`chart.renderer: '${desired}'\``,
          `renderer-${desired}`,
          {
            tail: "Falling back to SVG."
          }
        );
      }
    } else if (mode === "canvas" && hasCanvasUnsupportedFeature(this.w)) {
      console.warn(
        `[apexcharts] renderer:"canvas" requested but this chart uses a feature the canvas renderer does not render yet (gradient/pattern/image fill or a state color-matrix filter); falling back to SVG.`
      );
    }
    this._activate("svg", this.svg);
    return this._activeKind;
  }
  /**
   * The kind resolve() would select right now: the desired kind when its
   * backend is registered, SVG otherwise. Pure (no instance, no warning), so
   * the data-only fast update can ask whether a full render would switch
   * backends before it repaints into the one on screen.
   * @returns {import('../renderers/Renderer').RendererKind}
   */
  pendingKind() {
    const desired = this._desiredKind();
    return desired === "svg" || getRendererRegistry().has(desired) ? desired : "svg";
  }
  /** @returns {import('../renderers/Renderer').RendererKind} */
  getActiveKind() {
    return this._activeKind;
  }
  /** Destroy the owned non-SVG renderer instances (full chart destroy). */
  teardown() {
    for (const kind in this._instances) {
      const r2 = this._instances[kind];
      if (r2 && typeof r2.destroy === "function") r2.destroy();
    }
    this._instances = {};
    this.active = this.svg;
    this._activeKind = "svg";
    this.w.globals.activeRenderer = null;
  }
}
const InitCtxVariables = ApexCharts.__apex_helpers_InitCtxVariables;
function detectForm(data) {
  if (!Array.isArray(data) || data.length === 0) return "empty";
  for (let i2 = 0; i2 < data.length; i2++) {
    const d = data[i2];
    if (d === null || d === void 0) continue;
    if (Array.isArray(d)) return "paired";
    if (typeof d === "object") return "object";
    return "plain";
  }
  return "empty";
}
function xKeyOf(d, form) {
  if (d === null || d === void 0) return void 0;
  if (form === "paired") {
    const x2 = d[0];
    return x2 instanceof Date ? x2.getTime() : x2;
  }
  if (form === "object") {
    const x2 = d.x;
    return x2 instanceof Date ? x2.getTime() : x2;
  }
  return void 0;
}
function placeholderFor(x2, form) {
  if (form === "paired") return [x2, null];
  if (form === "object") return { x: x2, y: null };
  return null;
}
function keyOf(s2, i2, by) {
  const raw = typeof by === "function" ? by(s2, i2) : s2 ? s2[by] : void 0;
  if (raw === void 0 || raw === null || raw === "") return null;
  return String(raw);
}
function orderKeys(keys, order) {
  if (!order || order === "first-seen") return keys.slice();
  if (order === "asc" || order === "desc") {
    const sorted = keys.slice().sort((a2, b) => {
      const na = Number(a2);
      const nb = Number(b);
      if (isFinite(na) && isFinite(nb)) return na - nb;
      return a2 < b ? -1 : a2 > b ? 1 : 0;
    });
    return order === "desc" ? sorted.reverse() : sorted;
  }
  if (Array.isArray(order)) {
    const explicit = order.map(String).filter((k2) => keys.indexOf(k2) !== -1);
    const rest = keys.filter((k2) => explicit.indexOf(k2) === -1);
    return explicit.concat(rest);
  }
  if (typeof order === "function") return keys.slice().sort(order);
  return keys.slice();
}
function collectUnion(contributing, warnings) {
  const unionX = [];
  const seen = /* @__PURE__ */ new Set();
  let sawKeyed = false;
  let sawPlain = false;
  let plainMaxLen = 0;
  let xForm = "plain";
  contributing.forEach((s2) => {
    const form = detectForm(s2 && s2.data);
    if (form === "empty") return;
    if (form === "plain") {
      sawPlain = true;
      plainMaxLen = Math.max(plainMaxLen, s2.data.length);
      return;
    }
    sawKeyed = true;
    xForm = form;
    s2.data.forEach((d) => {
      const x2 = xKeyOf(d, form);
      if (x2 === void 0) return;
      const id = typeof x2 + ":" + String(x2);
      if (!seen.has(id)) {
        seen.add(id);
        unionX.push(x2);
      }
    });
  });
  if (sawKeyed && sawPlain) {
    warnings.push(
      "trellis: mixing x-keyed data ([x,y] / {x,y}) with plain value arrays; plain series are padded by position, not by x"
    );
  }
  const xIsNumeric = sawKeyed && unionX.every((x2) => typeof x2 === "number" && isFinite(x2));
  if (xIsNumeric) unionX.sort((a2, b) => Number(a2) - Number(b));
  return { unionX, sawKeyed, plainMaxLen, xForm, xIsNumeric };
}
const POINT_MARK_TYPES = ["scatter", "bubble"];
function alignsToUnionX(chartType) {
  return !POINT_MARK_TYPES.includes(chartType || "");
}
function makeAligner(u, warnings, alignToUnion = true) {
  const seriesNames = [];
  const nameSeen = /* @__PURE__ */ new Set();
  let globalIdx = 0;
  const align = (s2) => {
    const form = detectForm(s2 && s2.data);
    const name = s2 && s2.name != null ? String(s2.name) : `series-${globalIdx + 1}`;
    globalIdx++;
    if (!nameSeen.has(name)) {
      nameSeen.add(name);
      seriesNames.push(name);
    }
    const out = __spreadProps(__spreadValues({}, s2), { name });
    if (!alignToUnion) {
      out.data = Array.isArray(s2.data) ? s2.data.slice() : [];
      return out;
    }
    if (form === "plain" || form === "empty") {
      const targetLen = u.sawKeyed ? u.unionX.length : u.plainMaxLen;
      const data = Array.isArray(s2.data) ? s2.data.slice(0, targetLen) : [];
      while (data.length < targetLen) data.push(null);
      out.data = data;
      if (Array.isArray(s2.highlightData)) {
        const hd2 = s2.highlightData.slice(0, targetLen);
        while (hd2.length < targetLen) hd2.push(null);
        out.highlightData = hd2;
      }
      return out;
    }
    const map = /* @__PURE__ */ new Map();
    const parts = /* @__PURE__ */ new Map();
    const hd = Array.isArray(s2.highlightData) ? s2.highlightData : null;
    s2.data.forEach((d, idx) => {
      const x2 = xKeyOf(d, form);
      if (x2 !== void 0 && !map.has(x2)) {
        map.set(x2, d);
        if (hd) parts.set(x2, hd[idx]);
      } else if (x2 !== void 0 && map.has(x2)) {
        warnings.push(
          `trellis: duplicate x "${String(x2)}" in series "${name}"; keeping the first`
        );
      }
    });
    out.data = u.unionX.map(
      (x2) => map.has(x2) ? map.get(x2) : placeholderFor(x2, form)
    );
    if (hd) {
      out.highlightData = u.unionX.map(
        (x2) => parts.has(x2) ? parts.get(x2) : null
      );
    }
    return out;
  };
  return { align, seriesNames };
}
function placeholderSeries(splitResult, opts = {}) {
  const form = splitResult.xForm;
  const zeroByType = {
    bar: 0,
    column: 0,
    rangeBar: [0, 0],
    candlestick: [0, 0, 0, 0],
    boxPlot: [0, 0, 0, 0, 0]
  };
  const fill = opts.chartType && opts.chartType in zeroByType ? zeroByType[opts.chartType] : null;
  const datum = (x2) => {
    if (fill === null) return placeholderFor(x2, form);
    const y = Array.isArray(fill) ? fill.slice() : fill;
    return form === "object" ? { x: x2, y } : [x2, y];
  };
  const data = form === "plain" ? splitResult.unionX.map(() => fill) : splitResult.unionX.map(datum);
  return { name: opts.name || splitResult.seriesNames[0] || "series-1", data };
}
function split(series, cfg = {}, host = {}) {
  const warnings = [];
  const list = Array.isArray(series) ? series : [];
  const alignToUnion = alignsToUnionX(host.chartType);
  if (cfg.row || cfg.column) {
    if (cfg.by) {
      warnings.push(
        "trellis: `by` is ignored when `row`/`column` are set (they are mutually exclusive)"
      );
    }
    return split2d(list, cfg, warnings, alignToUnion);
  }
  const by = cfg.by || "facet";
  const byKey = /* @__PURE__ */ new Map();
  const repeated = [];
  list.forEach((s2, i2) => {
    const k2 = keyOf(s2, i2, by);
    if (k2 === null) repeated.push(s2);
    else {
      if (!byKey.has(k2)) byKey.set(k2, []);
      const arr = byKey.get(k2);
      if (arr) arr.push(s2);
    }
  });
  if (byKey.size === 0) {
    return emptyResult([
      "trellis: no series carries the facet key; nothing to split"
    ]);
  }
  let keys = orderKeys(Array.from(byKey.keys()), cfg.order);
  let dropped = 0;
  if (typeof cfg.limit === "number" && cfg.limit > 0 && keys.length > cfg.limit) {
    dropped = keys.length - cfg.limit;
    keys = keys.slice(0, cfg.limit);
  }
  const contributing = keys.reduce((acc, k2) => acc.concat(byKey.get(k2) || []), []).concat(repeated);
  const u = collectUnion(contributing, warnings);
  const { align, seriesNames } = makeAligner(u, warnings, alignToUnion);
  const panels = keys.map((key) => {
    const own = (byKey.get(key) || []).map(align);
    const rep = repeated.map(align);
    const slice = own.concat(rep);
    return {
      key,
      rowKey: null,
      colKey: null,
      series: slice,
      seriesNames: slice.map((s2) => s2.name),
      empty: slice.length === 0
    };
  });
  return {
    mode: (
      /** @type {'1d'} */
      "1d"
    ),
    panels,
    rowKeys: null,
    colKeys: null,
    seriesNames,
    xForm: u.sawKeyed ? u.xForm : "plain",
    unionX: u.sawKeyed ? u.unionX : Array.from({ length: u.plainMaxLen }, (_2, i2) => i2),
    xIsNumeric: u.xIsNumeric,
    dropped,
    warnings
  };
}
function emptyResult(warnings) {
  return {
    mode: "1d",
    panels: [],
    rowKeys: null,
    colKeys: null,
    seriesNames: [],
    xForm: "plain",
    unionX: [],
    xIsNumeric: false,
    dropped: 0,
    warnings
  };
}
function split2d(list, cfg, warnings, alignToUnion = true) {
  const rowBy = cfg.row;
  const colBy = cfg.column;
  const cells = /* @__PURE__ */ new Map();
  const rowRepeats = /* @__PURE__ */ new Map();
  const colRepeats = /* @__PURE__ */ new Map();
  const repeated = [];
  const rowSeen = [];
  const colSeen = [];
  const note = (arr, k2) => {
    if (arr.indexOf(k2) === -1) arr.push(k2);
  };
  list.forEach((s2, i2) => {
    var _a, _b;
    const rk = rowBy ? keyOf(s2, i2, rowBy) : "";
    const ck = colBy ? keyOf(s2, i2, colBy) : "";
    if (rk === null && ck === null) {
      repeated.push(s2);
      return;
    }
    if (rk === null) {
      note(
        colSeen,
        /** @type {string} */
        ck
      );
      if (!colRepeats.has(
        /** @type {string} */
        ck
      )) {
        colRepeats.set(
          /** @type {string} */
          ck,
          []
        );
      }
      (_a = colRepeats.get(
        /** @type {string} */
        ck
      )) == null ? void 0 : _a.push(s2);
      return;
    }
    if (ck === null) {
      note(rowSeen, rk);
      if (!rowRepeats.has(rk)) rowRepeats.set(rk, []);
      (_b = rowRepeats.get(rk)) == null ? void 0 : _b.push(s2);
      return;
    }
    note(rowSeen, rk);
    note(colSeen, ck);
    let cols = cells.get(rk);
    if (!cols) {
      cols = /* @__PURE__ */ new Map();
      cells.set(rk, cols);
    }
    let arr = cols.get(ck);
    if (!arr) {
      arr = [];
      cols.set(ck, arr);
    }
    arr.push(s2);
  });
  if (!rowSeen.length && !colSeen.length) {
    return emptyResult([
      "trellis: no series carries the row/column facet keys; nothing to split"
    ]);
  }
  if (typeof cfg.limit === "number" && cfg.limit > 0) {
    warnings.push("trellis: `limit` is not applied to a 2-D grid; ignoring it");
  }
  const rowKeys = orderKeys(rowSeen.length ? rowSeen : [""], cfg.order);
  const colKeys = orderKeys(colSeen.length ? colSeen : [""], cfg.order);
  const u = collectUnion(list, warnings);
  const { align, seriesNames } = makeAligner(u, warnings, alignToUnion);
  const panels = [];
  rowKeys.forEach((rk) => {
    colKeys.forEach((ck) => {
      var _a;
      const own = ((_a = cells.get(rk)) == null ? void 0 : _a.get(ck)) || [];
      const slice = own.concat(rowRepeats.get(rk) || []).concat(colRepeats.get(ck) || []).concat(repeated).map(align);
      panels.push({
        key: [rk, ck].filter((k2) => k2 !== "").join(" / ") || "all",
        rowKey: rk,
        colKey: ck,
        series: slice,
        seriesNames: slice.map((s2) => s2.name),
        empty: slice.length === 0
      });
    });
  });
  return {
    mode: (
      /** @type {'2d'} */
      "2d"
    ),
    panels,
    rowKeys,
    colKeys,
    seriesNames,
    xForm: u.sawKeyed ? u.xForm : "plain",
    unionX: u.sawKeyed ? u.unionX : Array.from({ length: u.plainMaxLen }, (_2, i2) => i2),
    xIsNumeric: u.xIsNumeric,
    dropped: 0,
    warnings
  };
}
const VALUELESS_Y = ["heatmap", "pie", "donut", "polarArea", "radialBar"];
const PIE_FAMILY = ["pie", "donut", "polarArea"];
function observationValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  for (let i2 = 0; i2 < data.length; i2++) {
    const d = data[i2];
    let raw = d;
    if (Array.isArray(d)) raw = d.length === 1 ? d[0] : d[1];
    else if (d && typeof d === "object") raw = d.y !== void 0 ? d.y : d.x;
    const v = Number(raw);
    if (raw !== null && raw !== void 0 && isFinite(v)) out.push(v);
  }
  return out;
}
function rawObservationArrays(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  data.forEach((d) => {
    const y = d && typeof d === "object" ? d.y : null;
    if (!Array.isArray(y)) return;
    y.forEach((v) => {
      const n2 = Number(v);
      if (v !== null && v !== void 0 && isFinite(n2)) out.push(n2);
    });
  });
  return out;
}
function zValues(data) {
  const out = [];
  if (!Array.isArray(data)) return out;
  data.forEach((d) => {
    let raw = null;
    if (Array.isArray(d) && d.length > 2) raw = d[2];
    else if (d && typeof d === "object") raw = d.z;
    const n2 = Number(raw);
    if (raw !== null && raw !== void 0 && isFinite(n2)) out.push(n2);
  });
  return out;
}
function buildTypeFrames(splitResult, cfg, hostConfig, chartType) {
  var _a, _b, _c, _d, _e, _f;
  const frames = {
    plotOptions: null,
    yExtentOverride: null,
    skipYaxisPush: VALUELESS_Y.includes(chartType),
    forceSharedY: false,
    pieScaleOf: null,
    warnings: []
  };
  const panels = splitResult.panels;
  const plot = (hostConfig == null ? void 0 : hostConfig.plotOptions) || {};
  if (chartType === "histogram") {
    const hcfg = plot.histogram || {};
    let union = [];
    const panelSeriesVals = panels.map(
      (p) => p.series.map((s2) => {
        const vals = observationValues(s2.data);
        union = union.concat(vals);
        return vals;
      })
    );
    const binning = S(union, {
      bins: hcfg.bins,
      binWidth: hcfg.binWidth,
      range: hcfg.range
    });
    if (binning && binning.edges.length > 1) {
      const edges = binning.edges;
      frames.plotOptions = {
        histogram: {
          range: [edges[0], edges[edges.length - 1]],
          binWidth: binning.binWidth
        }
      };
      let maxY = 0;
      panelSeriesVals.forEach(
        (seriesVals) => seriesVals.forEach((vals) => {
          if (!vals.length) return;
          const ys = normalizeCounts(L(vals, edges), {
            normalize: hcfg.normalize,
            cumulative: hcfg.cumulative,
            binWidth: binning.binWidth
          });
          ys.forEach((v) => {
            if (isFinite(v) && v > maxY) maxY = v;
          });
        })
      );
      if (maxY > 0) frames.yExtentOverride = { min: 0, max: maxY };
      const yMode = ((_a = cfg.scales) == null ? void 0 : _a.y) || "shared";
      if (yMode === "independent-row" || yMode === "independent-column") {
        frames.forceSharedY = true;
        frames.warnings.push(
          "histogram trellis: group y scales would re-derive counts per group; using scales.y 'shared' (use 'independent' for per-panel count scales)."
        );
      }
    }
  }
  if (chartType === "violin") {
    const kde = ((_b = plot.violin) == null ? void 0 : _b.kde) || {};
    if (!(typeof kde.bandwidth === "number" && kde.bandwidth > 0)) {
      let union = [];
      panels.forEach(
        (p) => p.series.forEach((s2) => {
          union = union.concat(rawObservationArrays(s2.data));
        })
      );
      const est = union.length ? kernelDensity(union, { resolution: 8 }) : null;
      if (est && isFinite(est.bandwidth) && est.bandwidth > 0) {
        frames.plotOptions = {
          violin: { kde: { bandwidth: est.bandwidth } }
        };
      }
    }
  }
  if (chartType === "heatmap") {
    if (((_c = cfg.scales) == null ? void 0 : _c.color) === "independent") {
      frames.warnings.push(
        "a heatmap trellis must share its color scale (the same color meaning different values per panel is a silent lie); ignoring scales.color 'independent'."
      );
    }
    const userRanges = (_e = (_d = plot.heatmap) == null ? void 0 : _d.colorScale) == null ? void 0 : _e.ranges;
    if (!(Array.isArray(userRanges) && userRanges.length > 0)) {
      let min = Infinity;
      let max = -Infinity;
      panels.forEach(
        (p) => p.series.forEach((s2) => {
          observationValues(s2.data).forEach((v) => {
            if (v < min) min = v;
            if (v > max) max = v;
          });
        })
      );
      if (isFinite(min) && isFinite(max)) {
        frames.plotOptions = {
          heatmap: { colorScale: { min, max } }
        };
      }
    }
  }
  if (chartType === "bubble") {
    if (((_f = cfg.scales) == null ? void 0 : _f.size) === "independent") {
      frames.warnings.push(
        "a bubble trellis must share its size scale; ignoring scales.size 'independent'."
      );
    }
    let minZ = Infinity;
    let maxZ = -Infinity;
    panels.forEach(
      (p) => p.series.forEach((s2) => {
        zValues(s2.data).forEach((v) => {
          if (v < minZ) minZ = v;
          if (v > maxZ) maxZ = v;
        });
      })
    );
    if (isFinite(minZ) && isFinite(maxZ)) {
      frames.plotOptions = {
        bubble: { minZ, maxZ }
      };
    }
  }
  if (PIE_FAMILY.includes(chartType) && cfg.radiusByTotal) {
    const totals = /* @__PURE__ */ new Map();
    let maxTotal = 0;
    panels.forEach((p) => {
      let total = 0;
      p.series.forEach((s2) => {
        observationValues(s2.data).forEach((v) => {
          total += Math.abs(v);
        });
      });
      totals.set(p.key, total);
      if (total > maxTotal) maxTotal = total;
    });
    if (maxTotal > 0) {
      frames.pieScaleOf = (key) => {
        const total = totals.get(key);
        if (typeof total !== "number" || total <= 0) return null;
        return Math.sqrt(total / maxTotal);
      };
    }
  }
  return frames;
}
function pivotRows(rows, spec = {}) {
  const warnings = [];
  const by = spec.by;
  if (typeof by !== "string" || !by) {
    return {
      series: [],
      warnings: [
        "trellis: tidy-row input (trellis.data) needs a string `by` column name"
      ]
    };
  }
  const xKey = spec.x;
  const yKey = spec.y;
  if (!xKey || !yKey) {
    return {
      series: [],
      warnings: [
        "trellis: tidy-row input (trellis.data) needs `x` and `y` column names"
      ]
    };
  }
  const list = Array.isArray(rows) ? rows : [];
  if (!list.length) {
    return { series: [], warnings: ["trellis: trellis.data is empty"] };
  }
  const seriesBy = spec.seriesBy;
  let skipped = 0;
  let dupes = 0;
  const acc = /* @__PURE__ */ new Map();
  list.forEach((row) => {
    if (!row || typeof row !== "object") {
      skipped++;
      return;
    }
    const facet = row[by];
    const x2 = row[xKey];
    if (facet === void 0 || facet === null || x2 === void 0 || x2 === null) {
      skipped++;
      return;
    }
    const name = seriesBy && row[seriesBy] !== void 0 && row[seriesBy] !== null ? String(row[seriesBy]) : String(yKey);
    let byName = acc.get(String(facet));
    if (!byName) {
      byName = /* @__PURE__ */ new Map();
      acc.set(String(facet), byName);
    }
    let data = byName.get(name);
    if (!data) {
      data = /* @__PURE__ */ new Map();
      byName.set(name, data);
    }
    const xk = x2 instanceof Date ? x2.getTime() : x2;
    if (data.has(xk)) dupes++;
    const y = row[yKey];
    data.set(xk, y === void 0 ? null : y);
  });
  if (skipped) {
    warnings.push(
      `trellis: ${skipped} row(s) missing "${by}" or "${xKey}" were skipped`
    );
  }
  if (dupes) {
    warnings.push(
      `trellis: ${dupes} duplicate (panel, series, x) row(s); kept the last. Aggregate the rows first if you want sums or means.`
    );
  }
  const series = [];
  acc.forEach((byName, facet) => {
    byName.forEach((data, name) => {
      series.push({
        name,
        [by]: facet,
        data: Array.from(data, ([x2, y]) => ({ x: x2, y }))
      });
    });
  });
  return { series, warnings };
}
const getThemePalettes = ApexCharts.__apex_ThemePalettes_getThemePalettes;
const DEFAULT_TARGET_TICKS = 3;
function niceBounds(min, max, targetTicks = DEFAULT_TARGET_TICKS) {
  if (!isFinite(min) || !isFinite(max)) {
    return { min: 0, max: 1, tickAmount: 1 };
  }
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1;
    min -= pad;
    max += pad;
  }
  const target2 = Math.max(1, targetTicks);
  const rawStep = (max - min) / target2;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norms = mag >= 10 ? [1, 2, 2.5, 5, 10] : [1, 2, 5, 10];
  let best = { dist: Infinity, ticks: 0, min: 0, max: 1 };
  norms.forEach((n2) => {
    const step = n2 * mag;
    const lo = Math.floor(min / step) * step;
    const hi = Math.ceil(max / step) * step;
    const ticks = Math.max(1, Math.round((hi - lo) / step));
    const dist = Math.abs(ticks - target2);
    if (dist < best.dist || dist === best.dist && ticks < best.ticks) {
      best = { dist, ticks, min: lo, max: hi };
    }
  });
  return { min: best.min, max: best.max, tickAmount: best.ticks };
}
function extendByDatum(d, form, ext) {
  if (d === null || d === void 0) return;
  let y = d;
  if (form === "paired") y = d[1];
  else if (form === "object") y = d.y;
  if (y === null || y === void 0) return;
  if (Array.isArray(y)) {
    for (let i2 = 0; i2 < y.length; i2++) {
      const v2 = Number(y[i2]);
      if (isFinite(v2)) {
        if (v2 < ext.min) ext.min = v2;
        if (v2 > ext.max) ext.max = v2;
      }
    }
    return;
  }
  const v = Number(y);
  if (isFinite(v)) {
    if (v < ext.min) ext.min = v;
    if (v > ext.max) ext.max = v;
  }
}
function partOf(s2, d, j2) {
  const p = d && typeof d === "object" && !Array.isArray(d) && "highlight" in d ? d.highlight : Array.isArray(s2.highlightData) ? s2.highlightData[j2] : null;
  return typeof p === "number" && isFinite(p) ? p : null;
}
function decimalCount(v) {
  if (typeof v !== "number" || !isFinite(v) || v % 1 === 0) return 0;
  const s2 = String(v);
  if (s2.indexOf("e") !== -1 || s2.indexOf("E") !== -1) return 4;
  return Math.min(4, (s2.split(".")[1] || "").length);
}
function maxYDecimals(panels) {
  let max = 0;
  const count = (v) => {
    const d = decimalCount(v);
    if (d > max) max = d;
  };
  panels.forEach(
    (p) => p.series.forEach((s2) => {
      if (!Array.isArray(s2.data)) return;
      s2.data.forEach((d) => {
        if (d === null || d === void 0) return;
        let y = d;
        if (Array.isArray(d)) y = d[1];
        else if (typeof d === "object") y = d.y;
        if (Array.isArray(y)) y.forEach(count);
        else count(y);
      });
    })
  );
  return max;
}
function yExtent(panels, xForm, parts = false) {
  const ext = { min: Infinity, max: -Infinity };
  panels.forEach(
    (p) => p.series.forEach((s2) => {
      if (!Array.isArray(s2.data)) return;
      s2.data.forEach((d, j2) => {
        extendByDatum(d, xForm, ext);
        const v = parts ? partOf(s2, d, j2) : null;
        if (v !== null) extendByDatum(v, "plain", ext);
      });
    })
  );
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null;
  return ext;
}
function stacksInto(s2, opts) {
  if (!opts.stackOnlyBar) return true;
  const t2 = s2 && s2.type;
  return t2 === void 0 || t2 === null || t2 === "bar" || t2 === "column";
}
function stackedYExtent(panels, xForm, opts = {}) {
  const ext = { min: Infinity, max: -Infinity };
  const fold = (v) => {
    if (!isFinite(v)) return;
    if (v < ext.min) ext.min = v;
    if (v > ext.max) ext.max = v;
  };
  const scalarY = (d) => {
    if (d === null || d === void 0) return null;
    const y = xForm === "paired" ? d[1] : xForm === "object" ? d.y : d;
    if (y === null || y === void 0 || Array.isArray(y)) return null;
    const v = Number(y);
    return isFinite(v) ? v : null;
  };
  panels.forEach((p) => {
    const groups = /* @__PURE__ */ new Map();
    p.series.forEach((s2) => {
      var _a;
      if (!Array.isArray(s2.data)) return;
      if (!stacksInto(s2, opts)) {
        s2.data.forEach((d) => extendByDatum(d, xForm, ext));
        return;
      }
      const key = String((_a = s2.group) != null ? _a : "");
      const pile = (k2) => {
        const acc2 = groups.get(k2) || { pos: [], neg: [] };
        groups.set(k2, acc2);
        return acc2;
      };
      const acc = pile(key);
      const parts = opts.parts ? pile("~" + key) : null;
      s2.data.forEach((d, j2) => {
        [acc, parts].forEach((a2, k2) => {
          if (!a2) return;
          if (a2.pos[j2] === void 0) {
            a2.pos[j2] = 0;
            a2.neg[j2] = 0;
          }
          const v = k2 ? partOf(s2, d, j2) : scalarY(d);
          if (v === null) return;
          if (v > 0) a2.pos[j2] += v;
          else a2.neg[j2] += v;
        });
      });
    });
    groups.forEach((acc) => {
      acc.pos.forEach(fold);
      acc.neg.forEach(fold);
    });
  });
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null;
  return ext;
}
function yExtentInWindow(panels, xForm, xMin, xMax, parts = false) {
  const ext = { min: Infinity, max: -Infinity };
  panels.forEach(
    (p) => p.series.forEach((s2) => {
      if (!Array.isArray(s2.data)) return;
      s2.data.forEach((d, j2) => {
        if (d === null || d === void 0) return;
        const rawX = xForm === "paired" ? d[0] : xForm === "object" ? d.x : null;
        const x2 = rawX instanceof Date ? rawX.getTime() : Number(rawX);
        if (!isFinite(x2) || x2 < xMin || x2 > xMax) return;
        extendByDatum(d, xForm, ext);
        const v = parts ? partOf(s2, d, j2) : null;
        if (v !== null) extendByDatum(v, "plain", ext);
      });
    })
  );
  if (!isFinite(ext.min) || !isFinite(ext.max)) return null;
  return ext;
}
function resolve(splitResult, cfg = {}, host = {}) {
  const scales = cfg.scales || {};
  const xMode = scales.x || "shared";
  const yMode = scales.y || "shared";
  let x2 = null;
  if (xMode === "shared" && splitResult.xIsNumeric && splitResult.unionX.length) {
    const xs = (
      /** @type {number[]} */
      splitResult.unionX
    );
    x2 = { min: xs[0], max: xs[xs.length - 1] };
  }
  const barFamily = ["bar", "column", "histogram"].includes(host.chartType || "");
  const toBounds = (ext) => {
    if (!ext) return null;
    if (barFamily && ext.min > 0) ext.min = 0;
    return niceBounds(ext.min, ext.max, cfg.targetTicks || DEFAULT_TARGET_TICKS);
  };
  const percent2 = !!host.stacked && host.stackType === "100%";
  const stacked = !!host.stacked && !percent2;
  const extentOf = (group2) => percent2 ? { min: 0, max: 100 } : stacked ? stackedYExtent(group2, splitResult.xForm, {
    stackOnlyBar: host.stackOnlyBar,
    parts: host.parts
  }) : yExtent(group2, splitResult.xForm, host.parts);
  let y = null;
  if (yMode === "shared") {
    y = toBounds(host.yExtentOverride || extentOf(splitResult.panels));
  }
  let rowY = null;
  if (yMode === "independent-row") {
    rowY = /* @__PURE__ */ new Map();
    const groups = /* @__PURE__ */ new Map();
    splitResult.panels.forEach((p) => {
      var _a;
      const k2 = (_a = p.rowKey) != null ? _a : "";
      if (!groups.has(k2)) groups.set(k2, []);
      groups.get(k2).push(p);
    });
    groups.forEach((panels, k2) => {
      const b = toBounds(extentOf(panels));
      if (b) rowY == null ? void 0 : rowY.set(k2, b);
    });
  }
  let colY = null;
  if (yMode === "independent-column") {
    colY = /* @__PURE__ */ new Map();
    const groups = /* @__PURE__ */ new Map();
    splitResult.panels.forEach((p) => {
      var _a;
      const k2 = (_a = p.colKey) != null ? _a : "";
      if (!groups.has(k2)) groups.set(k2, []);
      groups.get(k2).push(p);
    });
    groups.forEach((panels, k2) => {
      const b = toBounds(extentOf(panels));
      if (b) colY == null ? void 0 : colY.set(k2, b);
    });
  }
  const palettes = getThemePalettes();
  const fallback = palettes.palette1;
  const userColors = Array.isArray(host.userColors) ? host.userColors.filter((c) => typeof c === "string") : [];
  const palette = userColors.length ? userColors : fallback;
  const names = splitResult.seriesNames;
  const colorOf = (name) => {
    const idx = names.indexOf(name);
    return palette[(idx === -1 ? 0 : idx) % palette.length];
  };
  return { x: x2, y, rowY, colY, colorOf, palette };
}
const DEFAULT_MIN_PANEL_HEIGHT = 80;
function lastRowFor(c, panelCount, cols, rows) {
  const inLastRow = panelCount - (rows - 1) * cols;
  return c < inLastRow ? rows - 1 : rows - 2;
}
function resolveColumns(containerWidth, panelCount, cfg = {}) {
  var _a, _b;
  const gap = (_a = cfg.gap) != null ? _a : 12;
  if (typeof cfg.columns === "number" && cfg.columns > 0) {
    return Math.max(1, Math.min(Math.floor(cfg.columns), panelCount));
  }
  const minW = (_b = cfg.minPanelWidth) != null ? _b : 220;
  const fit = Math.floor((containerWidth + gap) / (minW + gap));
  return Math.max(1, Math.min(fit, panelCount));
}
function compute({
  panelCount,
  containerWidth,
  cfg,
  hostHeight,
  chromeHeight
}) {
  var _a, _b;
  const gap = (_a = cfg.gap) != null ? _a : 12;
  const cols = resolveColumns(containerWidth, panelCount, cfg);
  const rows = Math.max(1, Math.ceil(panelCount / cols));
  const headerShown = !cfg.header || cfg.header.show !== false;
  const headerH = headerShown ? 22 : 0;
  const chromeH = Math.max(0, chromeHeight || 0);
  const nonPanelH = rows * headerH + gap * (rows - 1) + chromeH;
  const availableH = typeof hostHeight === "number" && hostHeight > 0 ? hostHeight : 0;
  const panelW = Math.max(0, (containerWidth - gap * (cols - 1)) / cols);
  let panelH;
  if (typeof cfg.panelHeight === "number" && cfg.panelHeight > 0) {
    panelH = cfg.panelHeight;
  } else if (availableH > 0) {
    panelH = (availableH - nonPanelH) / rows;
  } else {
    panelH = panelW / ((_b = cfg.aspectRatio) != null ? _b : 1.6);
  }
  const minPanelH = typeof cfg.minPanelHeight === "number" && cfg.minPanelHeight > 0 ? cfg.minPanelHeight : DEFAULT_MIN_PANEL_HEIGHT;
  panelH = Math.max(minPanelH, Math.round(panelH));
  const gridH = rows * (panelH + headerH) + gap * (rows - 1);
  const overflowH = availableH > 0 ? Math.max(0, gridH + chromeH - availableH) : 0;
  const labelsMode = cfg.axes && cfg.axes.labels || "edges";
  const scales = cfg.scales || {};
  const single = cols === 1;
  const cells = Array.from({ length: panelCount }, (_2, i2) => {
    const r2 = Math.floor(i2 / cols);
    const c = i2 % cols;
    let showXLabels;
    let showYLabels;
    if (labelsMode === "none") {
      showXLabels = false;
      showYLabels = false;
    } else if (labelsMode === "all" || single) {
      showXLabels = true;
      showYLabels = true;
    } else {
      showXLabels = scales.x === "independent" || r2 === lastRowFor(c, panelCount, cols, rows);
      showYLabels = scales.y === "independent" || scales.y === "independent-column" || c === 0;
    }
    return { i: i2, r: r2, c, showXLabels, showYLabels };
  });
  return { cols, rows, panelW, panelH, headerH, gap, cells, gridH, overflowH };
}
const DEFAULT_DIVERGING = ["#cf4d3f", "#8f9499", "#26a75b"];
const lerp = (a2, b, t2) => a2 + (b - a2) * t2;
function toHexPair(n2) {
  const v = Math.max(0, Math.min(255, Math.round(n2)));
  return v.toString(16).padStart(2, "0");
}
function mixColors(c1, c2, t2) {
  const a2 = Utils.parseHex(normalizeHex(c1));
  const b = Utils.parseHex(normalizeHex(c2));
  if (!a2 || !b) return c1;
  return "#" + toHexPair(lerp(a2[0], b[0], t2)) + toHexPair(lerp(a2[1], b[1], t2)) + toHexPair(lerp(a2[2], b[2], t2));
}
function normalizeHex(c) {
  if (typeof c !== "string") return "#000000";
  if (Utils.isColorHex(c)) return c;
  const asHex = Utils.rgb2hex(c);
  return asHex || "#000000";
}
function colorValueOf(w, i2, j2) {
  const series = (
    /** @type {any} */
    w.config.series[i2]
  );
  const datum = series && Array.isArray(series.data) ? series.data[j2] : null;
  return colorValueOfDatum(w, datum, i2, j2);
}
function colorValueOfDatum(w, datum, i2, j2) {
  var _a, _b, _c;
  if (!datum || typeof datum !== "object") return null;
  const accessor = (_c = (_b = (_a = w.config.plotOptions) == null ? void 0 : _a.treemap) == null ? void 0 : _b.colorScale) == null ? void 0 : _c.colorValue;
  let raw;
  if (typeof accessor === "function") {
    raw = accessor(datum, { seriesIndex: i2, dataPointIndex: j2, w });
  } else if (typeof accessor === "string") {
    raw = datum[accessor];
  } else {
    raw = datum.colorValue;
  }
  if (raw == null) return null;
  const n2 = Number(raw);
  return Number.isFinite(n2) ? n2 : null;
}
function resolveStops(cfg, min, max, midpoint) {
  if (Array.isArray(cfg.stops) && cfg.stops.length >= 2) {
    return cfg.stops.filter((s2) => s2 && Number.isFinite(Number(s2.value))).map((s2) => ({
      value: Number(s2.value),
      color: normalizeHex(s2.color)
    })).sort(
      (a2, b) => a2.value - b.value
    );
  }
  const colors = (Array.isArray(cfg.colors) && cfg.colors.length >= 2 ? cfg.colors : DEFAULT_DIVERGING).map(normalizeHex);
  const n2 = colors.length;
  if (midpoint != null && n2 >= 3) {
    const mid = Math.floor((n2 - 1) / 2);
    const out = [];
    for (let k2 = 0; k2 <= mid; k2++) {
      out.push({ value: lerp(min, midpoint, k2 / mid), color: colors[k2] });
    }
    for (let k2 = mid + 1; k2 < n2; k2++) {
      out.push({
        value: lerp(midpoint, max, (k2 - mid) / (n2 - 1 - mid)),
        color: colors[k2]
      });
    }
    return out;
  }
  return colors.map((c, k2) => ({
    value: lerp(min, max, k2 / (n2 - 1)),
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
  for (let i2 = 0; i2 < series.length; i2++) {
    const data = series[i2] && series[i2].data;
    if (!Array.isArray(data)) continue;
    for (let j2 = 0; j2 < data.length; j2++) {
      const v = colorValueOfDatum(w, data[j2], i2, j2);
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
    for (let k2 = 1; k2 < stops.length; k2++) {
      const hi = stops[k2];
      if (v <= hi.value) {
        const lo = stops[k2 - 1];
        const span2 = hi.value - lo.value;
        const t2 = span2 === 0 ? 0 : (v - lo.value) / span2;
        return mixColors(lo.color, hi.color, t2);
      }
    }
    return last.color;
  };
  const span = max - min;
  const legendStops = stops.map((s2) => ({
    percent: span === 0 ? 0 : (s2.value - min) / span,
    color: s2.color
  }));
  return { min, max, midpoint, stops, at, legendStops };
}
const TooltipUtils = ApexCharts.__apex_tooltip_Utils;
const SVG_NS = "http://www.w3.org/2000/svg";
class HeatmapGradientLegend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.svgEl = null;
    this.arrowEl = null;
    this.hoverValueEl = null;
    this._min = 0;
    this._max = 0;
    this._geom = null;
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    this._targetEl = null;
    this._onCellEnter = this._onCellEnter.bind(this);
    this._onCellLeave = this._onCellLeave.bind(this);
    this._onBandEnter = this._onBandEnter.bind(this);
    this._onBandLeave = this._onBandLeave.bind(this);
  }
  /** Default value formatter for min/max labels and the hover tooltip. */
  _getFormatter() {
    const cfg = this._cfg();
    if (typeof cfg.formatter === "function") return cfg.formatter;
    return (v) => {
      if (!Number.isFinite(v)) return String(v);
      const abs = Math.abs(v);
      if (abs >= 1e3) return v.toFixed(0);
      if (abs >= 10) return v.toFixed(1);
      return v.toFixed(2);
    };
  }
  /**
   * The colorScale of whichever chart type is being drawn. Every chart type
   * that encodes a value as colour carries the same `colorScale` shape, so one
   * strip serves them all rather than a near-copy per type.
   * @param {any} w
   */
  static colorScaleOf(w) {
    var _a, _b, _c, _d, _e;
    const type = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    if (!type) return null;
    return ((_e = (_d = (_c = w == null ? void 0 : w.config) == null ? void 0 : _c.plotOptions) == null ? void 0 : _d[type]) == null ? void 0 : _e.colorScale) || null;
  }
  /**
   * @param {any} w
   */
  static configFor(w) {
    const cs = HeatmapGradientLegend.colorScaleOf(w);
    return cs && cs.gradientLegend || null;
  }
  /** This instance's gradient-legend config. */
  _cfg() {
    return HeatmapGradientLegend.configFor(this.w) || {};
  }
  /**
   * True when the user has opted into the gradient legend variant.
   * @param {any} w
   */
  static isEnabled(w) {
    if (!HeatmapGradientLegend.supports(w)) return false;
    const cfg = HeatmapGradientLegend.configFor(w);
    return !!(cfg && cfg.enabled);
  }
  /**
   * Chart types this legend can serve: those that encode a value as colour
   * through a `colorScale`. Everything else gets the categorical legend.
   * @param {any} w
   */
  static supports(w) {
    var _a, _b;
    const type = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.type;
    return type === "heatmap" || type === "treemap";
  }
  /**
   * Build the gradient legend DOM into `elLegendWrap`.
   * Caller is responsible for clearing the wrap first.
   * @param {HTMLElement|null} [targetEl] detached mode: draw into this
   *   element instead (a trellis's shared legend slot); the host owns layout,
   *   so all plot-relative positioning is skipped.
   */
  draw(targetEl = null) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    this._targetEl = targetEl;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      targetEl || w.dom.elLegendWrap
    );
    if (!elLegendWrap) return;
    const cfg = this._cfg();
    const position = w.config.legend.position;
    const isVertical = position === "left" || position === "right";
    const arrowSize = (_b = (_a = cfg.arrow) == null ? void 0 : _a.size) != null ? _b : 8;
    const arrowGutter = arrowSize + 4;
    const labelPadAlongStrip = cfg.showLabels ? 28 : 4;
    const labelPadAcrossStrip = cfg.showLabels ? 20 : 4;
    const minLabelWidth = cfg.showLabels ? 44 : 0;
    const stripLength = this._resolveStripLength(isVertical ? cfg.height : cfg.width, isVertical);
    const stripThickness = cfg.thickness;
    const svgWidth = isVertical ? Math.max(stripThickness + arrowGutter + 4, minLabelWidth) : stripLength + labelPadAlongStrip * 2;
    const svgHeight = isVertical ? stripLength + labelPadAcrossStrip * 2 : stripThickness + arrowGutter + 4;
    const verticalGroupWidth = stripThickness + arrowGutter;
    const verticalGroupLeftPad = (svgWidth - verticalGroupWidth) / 2;
    const stripX = isVertical ? position === "left" ? verticalGroupLeftPad : verticalGroupLeftPad + arrowGutter : labelPadAlongStrip;
    const stripY = isVertical ? labelPadAcrossStrip : position === "top" ? arrowGutter : 4;
    const svg = BrowserAPIs.createElementNS(SVG_NS, "svg");
    svg.setAttribute(
      "class",
      "apexcharts-heatmap-gradient-legend apexcharts-gradient-legend"
    );
    svg.setAttribute("width", String(svgWidth));
    svg.setAttribute("height", String(svgHeight));
    svg.setAttribute("overflow", "visible");
    const defs = BrowserAPIs.createElementNS(SVG_NS, "defs");
    const gradId = `apexcharts-heatmap-gradient-${w.globals.cuid}`;
    const linearGrad = BrowserAPIs.createElementNS(SVG_NS, "linearGradient");
    linearGrad.setAttribute("id", gradId);
    if (isVertical) {
      linearGrad.setAttribute("x1", "0");
      linearGrad.setAttribute("y1", "1");
      linearGrad.setAttribute("x2", "0");
      linearGrad.setAttribute("y2", "0");
    } else {
      linearGrad.setAttribute("x1", "0");
      linearGrad.setAttribute("y1", "0");
      linearGrad.setAttribute("x2", "1");
      linearGrad.setAttribute("y2", "0");
    }
    const { min, max, stops, bands } = this._computeStops();
    this._min = min;
    this._max = max;
    stops.forEach((s2) => {
      const stopEl = BrowserAPIs.createElementNS(SVG_NS, "stop");
      stopEl.setAttribute("offset", `${(s2.percent * 100).toFixed(2)}%`);
      stopEl.setAttribute("stop-color", s2.color);
      linearGrad.appendChild(stopEl);
    });
    defs.appendChild(linearGrad);
    svg.appendChild(defs);
    const rect = BrowserAPIs.createElementNS(SVG_NS, "rect");
    rect.setAttribute("x", String(stripX));
    rect.setAttribute("y", String(stripY));
    rect.setAttribute("width", String(isVertical ? stripThickness : stripLength));
    rect.setAttribute("height", String(isVertical ? stripLength : stripThickness));
    rect.setAttribute("rx", "2");
    rect.setAttribute("fill", `url(#${gradId})`);
    svg.appendChild(rect);
    if (cfg.showLabels) {
      const labelColor = ((_c = cfg.labelStyle) == null ? void 0 : _c.colors) || (Array.isArray(w.config.legend.labels.colors) ? w.config.legend.labels.colors[0] : w.config.legend.labels.colors) || w.config.chart.foreColor;
      const labelFontSize = ((_d = cfg.labelStyle) == null ? void 0 : _d.fontSize) || "11px";
      const labelFontFamily = ((_e = cfg.labelStyle) == null ? void 0 : _e.fontFamily) || w.config.chart.fontFamily;
      const fmt = this._getFormatter();
      const makeLabel = (text, x2, y, anchor) => {
        const t2 = BrowserAPIs.createElementNS(SVG_NS, "text");
        t2.setAttribute("x", String(x2));
        t2.setAttribute("y", String(y));
        t2.setAttribute("text-anchor", anchor);
        t2.setAttribute("dominant-baseline", "middle");
        t2.setAttribute("fill", labelColor);
        t2.setAttribute("font-size", labelFontSize);
        if (labelFontFamily) t2.setAttribute("font-family", labelFontFamily);
        t2.textContent = String(text);
        return t2;
      };
      if (isVertical) {
        const midX = stripX + stripThickness / 2;
        svg.appendChild(makeLabel(fmt(min), midX, stripY + stripLength + 10, "middle"));
        svg.appendChild(makeLabel(fmt(max), midX, stripY - 10, "middle"));
      } else {
        const midY = stripY + stripThickness / 2;
        svg.appendChild(makeLabel(fmt(min), stripX - 6, midY, "end"));
        svg.appendChild(makeLabel(fmt(max), stripX + stripLength + 6, midY, "start"));
      }
    }
    const arrowColor = ((_f = cfg.arrow) == null ? void 0 : _f.color) || w.config.chart.foreColor;
    const arrow2 = this._buildArrow(arrowSize, arrowColor, position);
    svg.appendChild(arrow2);
    this.arrowEl = arrow2;
    this._bandHitEls = [];
    if (w.config.legend.onItemHover.highlightDataSeries && bands.length > 0) {
      bands.forEach((b) => {
        const hit = BrowserAPIs.createElementNS(SVG_NS, "rect");
        if (isVertical) {
          const yTop = stripY + stripLength - b.p2 * stripLength;
          const yBot = stripY + stripLength - b.p1 * stripLength;
          hit.setAttribute("x", String(stripX));
          hit.setAttribute("y", String(yTop));
          hit.setAttribute("width", String(stripThickness));
          hit.setAttribute("height", String(Math.max(0, yBot - yTop)));
        } else {
          hit.setAttribute("x", String(stripX + b.p1 * stripLength));
          hit.setAttribute("y", String(stripY));
          hit.setAttribute(
            "width",
            String(Math.max(0, (b.p2 - b.p1) * stripLength))
          );
          hit.setAttribute("height", String(stripThickness));
        }
        hit.setAttribute("fill", "transparent");
        hit.setAttribute("class", "apexcharts-heatmap-gradient-band");
        hit.setAttribute("data:range-index", String(b.index));
        hit.style.cursor = "pointer";
        svg.appendChild(hit);
        this._bandHitEls.push(hit);
      });
    }
    this._geom = {
      isVertical,
      position,
      stripX,
      stripY,
      stripLength,
      stripThickness,
      arrowSize,
      svgWidth,
      svgHeight
    };
    if (cfg.showHoverValue) {
      const tt = BrowserAPIs.createElement("div");
      tt.classList.add("apexcharts-heatmap-gradient-legend-value");
      tt.style.position = "absolute";
      tt.style.fontSize = ((_g = cfg.labelStyle) == null ? void 0 : _g.fontSize) || "11px";
      tt.style.fontFamily = ((_h = cfg.labelStyle) == null ? void 0 : _h.fontFamily) || w.config.chart.fontFamily || "";
      tt.style.color = w.config.chart.foreColor;
      tt.style.background = "rgba(0,0,0,0.65)";
      tt.style.color = "#fff";
      tt.style.padding = "2px 6px";
      tt.style.borderRadius = "3px";
      tt.style.pointerEvents = "none";
      tt.style.whiteSpace = "nowrap";
      tt.style.opacity = "0";
      tt.style.transition = "opacity 120ms ease";
      this.hoverValueEl = tt;
    }
    elLegendWrap.classList.add("apexcharts-heatmap-gradient-legend-wrap");
    elLegendWrap.classList.add(
      "apx-legend-position-" + position
    );
    elLegendWrap.appendChild(svg);
    if (this.hoverValueEl) elLegendWrap.appendChild(this.hoverValueEl);
    this.svgEl = svg;
    if (targetEl) {
      elLegendWrap.style.width = svgWidth + "px";
      elLegendWrap.style.height = svgHeight + "px";
      elLegendWrap.style.position = "relative";
      elLegendWrap.style.overflow = "visible";
    } else {
      this._applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight);
    }
    this._attachHoverListeners();
    this._attachBandHoverListeners();
  }
  /**
   * Resolve a configured length (number = px, string ending in '%' =
   * percentage of the chart's SVG width/height) to a pixel length.
   * @param {number|string} value
   * @param {boolean} isVertical
   * @returns {number}
   */
  _resolveStripLength(value, isVertical) {
    const w = this.w;
    const basis = isVertical ? w.globals.svgHeight || w.config.chart.height || 300 : w.globals.svgWidth || w.config.chart.width || 600;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.endsWith("%")) {
        const pct = parseFloat(trimmed) || 0;
        return Math.max(20, basis * pct / 100);
      }
      const n2 = parseFloat(trimmed);
      return Number.isFinite(n2) ? n2 : 200;
    }
    if (typeof value === "number" && Number.isFinite(value)) return value;
    return 200;
  }
  /**
   * Position the legend wrap and align the gradient strip within it. The
   * wrap spans the chart's long axis (full width for top/bottom; full
   * height for left/right) and uses flexbox to honor the `align` config.
   * Bypasses the standard `setLegendWrapXY` which sizes the wrap to its
   * content.
   * @param {HTMLElement} elLegendWrap
   * @param {'top'|'right'|'bottom'|'left'} position
   * @param {boolean} isVertical
   * @param {number} svgWidth
   * @param {number} svgHeight
   */
  _applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight) {
    const w = this.w;
    const cfg = this._cfg();
    const align = cfg.align || "center";
    const edgePad = 12;
    const chartWidth = w.globals.svgWidth || w.config.chart.width || 600;
    const chartHeight = w.globals.svgHeight || w.config.chart.height || 300;
    const userOffsetX = w.config.legend.offsetX || 0;
    const userOffsetY = w.config.legend.offsetY || 0;
    elLegendWrap.style.position = "absolute";
    elLegendWrap.style.display = "block";
    elLegendWrap.style.overflow = "visible";
    elLegendWrap.style.padding = "0";
    elLegendWrap.style.width = svgWidth + "px";
    elLegendWrap.style.height = svgHeight + "px";
    elLegendWrap.style.right = "auto";
    elLegendWrap.style.bottom = "auto";
    if (isVertical) {
      const availableHeight = chartHeight - svgHeight - edgePad * 2;
      let y;
      if (align === "start") y = edgePad;
      else if (align === "end") y = edgePad + Math.max(0, availableHeight);
      else y = edgePad + Math.max(0, availableHeight) / 2;
      elLegendWrap.style.top = y + userOffsetY + "px";
      if (position === "left") {
        elLegendWrap.style.left = edgePad + userOffsetX + "px";
      } else {
        elLegendWrap.style.left = chartWidth - svgWidth - edgePad + userOffsetX + "px";
      }
    } else {
      const availableWidth = chartWidth - svgWidth - edgePad * 2;
      let x2;
      if (align === "start") x2 = edgePad;
      else if (align === "end") x2 = edgePad + Math.max(0, availableWidth);
      else x2 = edgePad + Math.max(0, availableWidth) / 2;
      elLegendWrap.style.left = x2 + userOffsetX + "px";
      if (position === "top") {
        elLegendWrap.style.top = edgePad + userOffsetY + "px";
      } else {
        elLegendWrap.style.top = chartHeight - svgHeight - edgePad + userOffsetY + "px";
      }
    }
  }
  /**
   * Re-position the strip once the final layout is known.
   *
   * `_applyWrapAlignment` (called during `draw()`, before `plotCoords()`) can
   * only pin to the chart's outer edge. This runs after layout — when
   * `translateX/Y`, `gridWidth/Height` and `xAxisHeight` are populated — and:
   *   - centers the strip within its reserved band on the perpendicular axis
   *     (between the title and the plot for `top`; the x-axis and the chart
   *     bottom for `bottom`; the chart edge and the plot for `left`/`right`),
   *     so the slack is split evenly instead of dumped on one side, and
   *   - aligns it along the plot's own extent (so `align: 'center'` centers
   *     over the heatmap, not the whole canvas).
   * Honors `legend.offsetX/offsetY` for user nudging. Safe to call repeatedly.
   */
  repositionToPlot() {
    var _a, _b;
    if (!Environment.isBrowser()) return;
    if (this._targetEl) return;
    const w = this.w;
    const g = w.globals;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    if (!wrap || !this._geom) return;
    if (!Number.isFinite(g.gridWidth) || !Number.isFinite(g.gridHeight)) return;
    const { isVertical, position, svgWidth, svgHeight, stripX, stripY, stripThickness } = this._geom;
    const align = this._cfg().align || "center";
    const ox = w.config.legend.offsetX || 0;
    const oy = w.config.legend.offsetY || 0;
    const dimHelpers = (_b = (_a = this.ctx) == null ? void 0 : _a.dimensions) == null ? void 0 : _b.dimHelpers;
    const titleArea = dimHelpers ? dimHelpers.getTitleSubtitleCoords("title").height + dimHelpers.getTitleSubtitleCoords("subtitle").height : 0;
    const xAxisArea = w.layout.xAxisHeight || 0;
    const alongOffset = (extent, size) => {
      const avail = Math.max(0, extent - size);
      if (align === "start") return 0;
      if (align === "end") return avail;
      return avail / 2;
    };
    if (isVertical) {
      wrap.style.top = g.translateY + alongOffset(g.gridHeight, svgHeight) + oy + "px";
      const bandStart = position === "left" ? 0 : g.translateX + g.gridWidth;
      const bandEnd = position === "left" ? g.translateX : g.svgWidth;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.left = stripCenter - stripX - stripThickness / 2 + ox + "px";
    } else {
      wrap.style.left = g.translateX + alongOffset(g.gridWidth, svgWidth) + ox + "px";
      const bandStart = position === "top" ? titleArea : g.translateY + g.gridHeight + xAxisArea;
      const bandEnd = position === "top" ? g.translateY : g.svgHeight;
      const stripCenter = (bandStart + bandEnd) / 2;
      wrap.style.top = stripCenter - stripY - stripThickness / 2 + oy + "px";
    }
    BrowserAPIs.requestAnimationFrame(() => this._enforceMinPlotGap());
  }
  /**
   * Guarantee a minimum gap between the strip's chart-facing edge and the plot.
   * Measured in viewport space (immune to the wrap↔SVG coordinate offset) and
   * applied as a *relative* shift to the wrap's current position, so it only
   * nudges a strip that ended up too close — placements with ample room are
   * left exactly where centering put them. Runs post-paint (see caller).
   */
  _enforceMinPlotGap() {
    const w = this.w;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const strip = this.svgEl && this.svgEl.querySelector("rect");
    if (!wrap || !strip || !this._geom) return;
    if (!w.dom.baseEl || !w.dom.baseEl.querySelector(".apexcharts-svg")) return;
    const s2 = strip.getBoundingClientRect();
    const plot = TooltipUtils.plotRect(w);
    if (!s2.width || !s2.height || !plot.width || !plot.height) return;
    const gr = {
      left: plot.left,
      right: plot.left + plot.width,
      top: plot.top,
      bottom: plot.top + plot.height
    };
    const zoom = plot.zoom;
    const MIN_GAP = 16;
    const { isVertical, position } = this._geom;
    if (isVertical) {
      const gap = (position === "left" ? gr.left - s2.right : s2.left - gr.right) / zoom;
      if (gap < MIN_GAP) {
        const curLeft = parseFloat(wrap.style.left) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.left = curLeft + (position === "left" ? -shift : shift) + "px";
      }
    } else {
      const gap = (position === "top" ? gr.top - s2.bottom : s2.top - gr.bottom) / zoom;
      if (gap < MIN_GAP) {
        const curTop = parseFloat(wrap.style.top) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.top = curTop + (position === "top" ? -shift : shift) + "px";
      }
    }
  }
  /**
   * Tear down listeners (called before re-render).
   */
  destroy() {
    var _a, _b, _c, _d, _e, _f, _g;
    for (let i2 = 0; i2 < this._bandHitEls.length; i2++) {
      const el = this._bandHitEls[i2];
      (_a = el.removeEventListener) == null ? void 0 : _a.call(el, "mousemove", this._onBandEnter);
      (_b = el.removeEventListener) == null ? void 0 : _b.call(el, "mouseout", this._onBandLeave);
    }
    this._bandHitEls = [];
    this._activeBandIndex = -1;
    if (!((_c = this.ctx) == null ? void 0 : _c.events)) return;
    try {
      (_e = (_d = this.ctx.events).removeEventListener) == null ? void 0 : _e.call(
        _d,
        "dataPointMouseEnter",
        this._onCellEnter
      );
      (_g = (_f = this.ctx.events).removeEventListener) == null ? void 0 : _g.call(
        _f,
        "dataPointMouseLeave",
        this._onCellLeave
      );
    } catch (_2) {
    }
  }
  /** Wire mousemove/mouseout on each per-band hit-region (ranges mode). */
  _attachBandHoverListeners() {
    if (!Environment.isBrowser()) return;
    for (let i2 = 0; i2 < this._bandHitEls.length; i2++) {
      const el = this._bandHitEls[i2];
      el.addEventListener("mousemove", this._onBandEnter);
      el.addEventListener("mouseout", this._onBandLeave);
    }
  }
  /**
   * Hovering a gradient band highlights its cells and dims the rest. Guarded
   * so the repeated mousemove stream only re-applies on an actual band change.
   * @param {Event} e
   */
  _onBandEnter(e2) {
    var _a, _b, _c, _d;
    const w = this.w;
    const target2 = (
      /** @type {Element} */
      e2.currentTarget
    );
    const idx = parseInt((_a = target2.getAttribute("data:range-index")) != null ? _a : "-1", 10);
    if (idx < 0 || idx === this._activeBandIndex) return;
    this._activeBandIndex = idx;
    (_d = (_c = (_b = this.ctx) == null ? void 0 : _b.events) == null ? void 0 : _c.fireEvent) == null ? void 0 : _d.call(_c, "legendHover", [this.ctx, idx, w]);
    new Series(w).highlightRangeInSeries(idx, "highlight");
  }
  /** Leaving a band clears the highlight. */
  _onBandLeave() {
    if (this._activeBandIndex < 0) return;
    const idx = this._activeBandIndex;
    this._activeBandIndex = -1;
    new Series(this.w).highlightRangeInSeries(idx, "reset");
  }
  _attachHoverListeners() {
    var _a, _b;
    if (!Environment.isBrowser()) return;
    if (!((_b = (_a = this.ctx) == null ? void 0 : _a.events) == null ? void 0 : _b.addEventListener)) return;
    this.ctx.events.addEventListener(
      "dataPointMouseEnter",
      this._onCellEnter
    );
    this.ctx.events.addEventListener(
      "dataPointMouseLeave",
      this._onCellLeave
    );
  }
  /**
   * dataPointMouseEnter fires as `(e, ctx, { seriesIndex, dataPointIndex, w })`.
   * Graphics._fireEvent forwards listener args in the same shape.
   * @param {...any} args
   */
  _onCellEnter(...args) {
    var _a, _b, _c;
    const w = this.w;
    if (!this.arrowEl) return;
    const opts = args[args.length - 1];
    if (!opts || typeof opts !== "object") return;
    const i2 = opts.seriesIndex;
    const j2 = opts.dataPointIndex;
    if (typeof i2 !== "number" || typeof j2 !== "number") return;
    if (!HeatmapGradientLegend.supports(w)) return;
    let val;
    if (this._continuous) {
      val = colorValueOf(w, i2, j2);
    } else {
      val = (_c = (_b = (_a = w.seriesData) == null ? void 0 : _a.series) == null ? void 0 : _b[i2]) == null ? void 0 : _c[j2];
    }
    if (val == null || Number.isNaN(val)) return;
    this._positionArrow(val);
  }
  _onCellLeave() {
    if (!this.arrowEl) return;
    this.arrowEl.setAttribute("opacity", "0");
    if (this.hoverValueEl) {
      this.hoverValueEl.style.opacity = "0";
    }
  }
  /**
   * Move the arrow to the position corresponding to `val` along the strip.
   * @param {number} val
   */
  _positionArrow(val) {
    if (!this.arrowEl || !this._geom) return;
    const { isVertical, position, stripX, stripY, stripLength, stripThickness, arrowSize } = this._geom;
    const min = this._min;
    const max = this._max;
    const span = max - min;
    let pct;
    if (span === 0) {
      pct = 0.5;
    } else {
      pct = (val - min) / span;
    }
    if (pct < 0) pct = 0;
    if (pct > 1) pct = 1;
    if (isVertical) {
      const yCenter = stripY + stripLength - pct * stripLength;
      let tipX, baseX;
      if (position === "left") {
        tipX = stripX + stripThickness;
        baseX = tipX + arrowSize;
      } else {
        tipX = stripX;
        baseX = tipX - arrowSize;
      }
      const points = [
        `${tipX},${yCenter}`,
        `${baseX},${yCenter - arrowSize / 2}`,
        `${baseX},${yCenter + arrowSize / 2}`
      ].join(" ");
      this.arrowEl.setAttribute("points", points);
    } else {
      const xCenter = stripX + pct * stripLength;
      let tipY, baseY;
      if (position === "top") {
        tipY = stripY + stripThickness;
        baseY = tipY + arrowSize;
      } else {
        tipY = stripY;
        baseY = tipY - arrowSize;
      }
      const points = [
        `${xCenter},${tipY}`,
        `${xCenter - arrowSize / 2},${baseY}`,
        `${xCenter + arrowSize / 2},${baseY}`
      ].join(" ");
      this.arrowEl.setAttribute("points", points);
    }
    this.arrowEl.setAttribute("opacity", "1");
    if (this.hoverValueEl) {
      const fmt = this._getFormatter();
      this.hoverValueEl.textContent = fmt(val);
      if (isVertical) {
        const yCenter = stripY + stripLength - pct * stripLength;
        if (position === "left") {
          this.hoverValueEl.style.left = `${stripX + stripThickness + arrowSize + 8}px`;
        } else {
          this.hoverValueEl.style.left = `${stripX - arrowSize - 8}px`;
          this.hoverValueEl.style.transform = "translateX(-100%)";
        }
        this.hoverValueEl.style.top = `${yCenter - 9}px`;
      } else {
        const xCenter = stripX + pct * stripLength;
        this.hoverValueEl.style.left = `${xCenter}px`;
        this.hoverValueEl.style.transform = "translateX(-50%)";
        if (position === "top") {
          this.hoverValueEl.style.top = `${stripY + stripThickness + arrowSize + 8}px`;
        } else {
          this.hoverValueEl.style.top = `${stripY - arrowSize - 18}px`;
        }
      }
      this.hoverValueEl.style.opacity = "1";
    }
  }
  /**
   * @param {number} size
   * @param {string} color
   * @param {'top'|'right'|'bottom'|'left'} _position
   */
  _buildArrow(size, color, _position) {
    const polygon = BrowserAPIs.createElementNS(SVG_NS, "polygon");
    polygon.setAttribute("fill", color);
    polygon.setAttribute("opacity", "0");
    polygon.setAttribute("class", "apexcharts-heatmap-gradient-arrow");
    polygon.setAttribute("points", "0,0 0,0 0,0");
    polygon.setAttribute("pointer-events", "none");
    return polygon;
  }
  /**
   * Build gradient stops + return effective min/max.
   * - If `colorScale.ranges` is set, stops are placed at each range boundary
   *   so the gradient reflects the user's discrete palette.
   * - Otherwise, samples N stops from the same shadeColor function the cells
   *   use, so the strip visually matches the heatmap.
   * @returns {{ min: number, max: number, stops: Array<{percent:number,color:string}>, bands: Array<{index:number,p1:number,p2:number}> }}
   */
  _computeStops() {
    var _a, _b;
    const w = this.w;
    const cs = HeatmapGradientLegend.colorScaleOf(w) || {};
    const cfg = this._cfg();
    const continuous = buildContinuousScale(w);
    if (continuous) {
      this._continuous = true;
      return {
        min: continuous.min,
        max: continuous.max,
        stops: continuous.legendStops,
        bands: []
      };
    }
    this._continuous = false;
    let dataMin = Infinity;
    let dataMax = -Infinity;
    const rows = ((_a = w.seriesData) == null ? void 0 : _a.series) || [];
    for (let i2 = 0; i2 < rows.length; i2++) {
      const row = rows[i2];
      if (!row) continue;
      for (let j2 = 0; j2 < row.length; j2++) {
        const v = row[j2];
        if (v == null || Number.isNaN(v)) continue;
        if (v < dataMin) dataMin = v;
        if (v > dataMax) dataMax = v;
      }
    }
    if (!Number.isFinite(dataMin)) dataMin = 0;
    if (!Number.isFinite(dataMax)) dataMax = 0;
    let min = dataMin;
    let max = dataMax;
    if (typeof cs.min !== "undefined" && typeof cs.max !== "undefined" && cs.max > cs.min) {
      min = cs.min;
      max = cs.max;
    } else {
      if (typeof cs.min !== "undefined") {
        min = cs.min < dataMin ? cs.min : dataMin;
      }
      if (typeof cs.max !== "undefined") {
        max = cs.max > dataMax ? cs.max : dataMax;
      }
    }
    const stops = [];
    const bands = [];
    if (cs.ranges && cs.ranges.length > 0) {
      const ranges = cs.ranges.map((r2, originalIndex) => __spreadProps(__spreadValues({}, r2), {
        _originalIndex: originalIndex
      })).sort((a2, b) => a2.from - b.from);
      const lo = ranges[0].from;
      const hi = ranges[ranges.length - 1].to;
      min = lo;
      max = hi;
      const span = hi - lo || 1;
      ranges.forEach((r2) => {
        const p1 = (r2.from - lo) / span;
        const p2 = (r2.to - lo) / span;
        stops.push({ percent: (p1 + p2) / 2, color: r2.color });
        bands.push({ index: r2._originalIndex, p1, p2 });
      });
    } else {
      const baseColor = w.globals.colors[0] || "#008FFB";
      const utils = new Utils();
      const plot = w.config.plotOptions[w.config.chart.type] || {};
      const shadeIntensity = (_b = plot.shadeIntensity) != null ? _b : 0.5;
      const hasNegs = (
        /** @type {any} */
        w.globals.hasNegs
      );
      const n2 = Math.max(2, cfg.stops || 16);
      for (let s2 = 0; s2 < n2; s2++) {
        const t2 = s2 / (n2 - 1);
        const v = min + t2 * (max - min);
        const total = Math.abs(max) + Math.abs(min);
        const percent_v = total === 0 ? 0 : 100 * v / total;
        let colorShadePercent;
        if (hasNegs) {
          if (plot.reverseNegativeShade) {
            colorShadePercent = percent_v < 0 ? percent_v / 100 * (shadeIntensity * 1.25) : (1 - percent_v / 100) * (shadeIntensity * 1.25);
          } else {
            colorShadePercent = percent_v <= 0 ? 1 - (1 + percent_v / 100) * shadeIntensity : (1 - percent_v / 100) * shadeIntensity;
          }
        } else {
          colorShadePercent = 1 - percent_v / 100;
        }
        if (colorShadePercent > 1) colorShadePercent = 1;
        if (colorShadePercent < -1) colorShadePercent = -1;
        const shaded = plot.enableShades ? utils.shadeColor(
          w.config.theme.mode === "dark" ? colorShadePercent * -1 : colorShadePercent,
          baseColor
        ) : baseColor;
        stops.push({ percent: t2, color: shaded });
      }
    }
    return { min, max, stops, bands };
  }
}
const ICONS = {
  zoom: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/><path d="M8 10.5h5M10.5 8v5"/></svg>',
  pan: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
  reset: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 10a8 8 0 1 1 2 6"/><path d="M4 4v6h6"/></svg>',
  download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4v11"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>'
};
class TrellisChrome {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this.elLegend = null;
    this.elToolbar = null;
    this.elTitle = null;
    this.elBreadcrumb = null;
    this.gradientLegend = null;
    this._gradPending = null;
  }
  /**
   * The per-cell facet header. Built with the cell, before the panel mounts,
   * so a virtualized cell still names itself.
   * @param {HTMLElement} cell
   * @param {string} key
   * @param {{ index: number, count: number }} meta
   */
  buildHeader(cell, key, meta) {
    const t2 = this.trellis;
    const hcfg = t2.cfg.header || {};
    if (hcfg.show === false) return;
    const el = BrowserAPIs.createElement("div");
    el.className = "apexcharts-trellis-header";
    let text = key;
    if (typeof hcfg.formatter === "function") {
      text = hcfg.formatter(key, {
        dimension: typeof t2.cfg.by === "string" ? t2.cfg.by : void 0,
        index: meta.index,
        count: meta.count
      });
    }
    el.textContent = text == null ? "" : String(text);
    const style = hcfg.style || {};
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight);
    if (style.color) el.style.color = style.color;
    if (t2.cfg.promote !== false) {
      el.classList.add("apexcharts-trellis-header-clickable");
      el.setAttribute("role", "button");
      el.setAttribute("tabindex", "0");
      el.setAttribute("title", "Expand this panel");
      const toggle = () => {
        if (t2._promotedKey === key) t2.restorePromotion();
        else t2.promote(key);
      };
      el.addEventListener("click", toggle);
      el.addEventListener("keydown", (e2) => {
        if (e2.key === "Enter" || e2.key === " ") {
          e2.preventDefault();
          toggle();
        }
      });
    }
    cell.appendChild(el);
  }
  /**
   * One 2-D strip label (P4): column labels once across the top, row labels
   * once down the left, instead of a header per cell. The header formatter
   * applies with the dimension named.
   * @param {'row'|'column'} dimension
   * @param {string} key
   * @param {{ index: number, count: number }} meta
   * @returns {HTMLElement}
   */
  stripEl(dimension, key, meta) {
    const t2 = this.trellis;
    const hcfg = t2.cfg.header || {};
    const el = BrowserAPIs.createElement("div");
    el.className = `apexcharts-trellis-strip apexcharts-trellis-strip-${dimension}`;
    let text = key;
    if (typeof hcfg.formatter === "function") {
      text = hcfg.formatter(key, {
        dimension,
        index: meta.index,
        count: meta.count
      });
    }
    el.textContent = text == null ? "" : String(text);
    const style = hcfg.style || {};
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight);
    if (style.color) el.style.color = style.color;
    return el;
  }
  /**
   * The promotion breadcrumb: "All panels / KEY", where "All panels" is the
   * way back. Lives in the chrome-top strip so the grid's own layout is
   * untouched.
   * @param {HTMLElement} host
   * @param {string} key
   * @param {() => void} onBack
   */
  buildBreadcrumb(host, key, onBack) {
    this.removeBreadcrumb();
    const el = BrowserAPIs.createElement("div");
    el.className = "apexcharts-trellis-breadcrumb";
    const back = BrowserAPIs.createElement("button");
    back.setAttribute("type", "button");
    back.className = "apexcharts-trellis-breadcrumb-back";
    back.textContent = "All panels";
    back.addEventListener("click", onBack);
    const sep = BrowserAPIs.createElement("span");
    sep.className = "apexcharts-trellis-breadcrumb-sep";
    sep.textContent = "/";
    const current = BrowserAPIs.createElement("span");
    current.className = "apexcharts-trellis-breadcrumb-current";
    current.textContent = key;
    el.appendChild(back);
    el.appendChild(sep);
    el.appendChild(current);
    host.appendChild(el);
    this.elBreadcrumb = el;
  }
  removeBreadcrumb() {
    if (this.elBreadcrumb && this.elBreadcrumb.parentNode) {
      this.elBreadcrumb.parentNode.removeChild(this.elBreadcrumb);
    }
    this.elBreadcrumb = null;
  }
  /**
   * The trellis-level title, from the host's own `title` config (panels have
   * theirs suppressed).
   * @param {HTMLElement} host
   */
  buildTitle(host) {
    const title = this.trellis.w.config.title;
    if (!title || !title.text) return;
    const el = BrowserAPIs.createElement("div");
    el.className = "apexcharts-trellis-title";
    el.textContent = title.text;
    const style = title.style || {};
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.color) el.style.color = style.color;
    host.appendChild(el);
    this.elTitle = el;
  }
  /**
   * One legend for the grid. Clicking an item toggles that series name in
   * every panel (TrellisSync owns the fan-out and the hidden set).
   * @param {HTMLElement} host
   */
  buildLegend(host) {
    const t2 = this.trellis;
    if ((t2.cfg.legend || "shared") !== "shared") return;
    if (t2.w.config.chart.type === "heatmap") {
      this.buildGradientLegend(host);
      return;
    }
    const names = t2.split ? t2.split.seriesNames : [];
    if (names.length < 2) return;
    const wrap = BrowserAPIs.createElement("div");
    wrap.className = "apexcharts-trellis-legend apexcharts-legend";
    wrap.setAttribute("role", "list");
    names.forEach((name) => {
      const item = BrowserAPIs.createElement("div");
      item.className = "apexcharts-legend-series apexcharts-trellis-legend-item";
      item.setAttribute("role", "listitem");
      item.setAttribute("tabindex", "0");
      item.setAttribute("data:collapsed", "false");
      const marker = BrowserAPIs.createElement("span");
      marker.className = "apexcharts-legend-marker";
      marker.style.background = t2.scales ? t2.scales.colorOf(name) : "#008FFB";
      const text = BrowserAPIs.createElement("span");
      text.className = "apexcharts-legend-text";
      text.textContent = name;
      item.appendChild(marker);
      item.appendChild(text);
      const toggle = () => {
        const hidden = t2.sync.toggleSeries(name);
        item.classList.toggle("apexcharts-inactive-legend", hidden);
        item.setAttribute("data:collapsed", String(hidden));
      };
      item.addEventListener("click", toggle);
      item.addEventListener("keydown", (e2) => {
        if (e2.key === "Enter" || e2.key === " ") {
          e2.preventDefault();
          toggle();
        }
      });
      wrap.appendChild(item);
    });
    host.appendChild(wrap);
    this.elLegend = wrap;
  }
  /**
   * Repaint the shared legend's markers from the current colour map, without
   * rebuilding the legend (which would drop the collapsed state a viewer has
   * toggled). Used by the in-place option update, where `colors` may have
   * moved but nothing structural has.
   */
  refreshLegendColors() {
    const t2 = this.trellis;
    const legend = this.elLegend;
    const scales = t2.scales;
    if (!legend || !scales) return;
    const items = legend.querySelectorAll(".apexcharts-trellis-legend-item");
    items.forEach((item) => {
      var _a;
      const name = (_a = item.querySelector(".apexcharts-legend-text")) == null ? void 0 : _a.textContent;
      const marker = item.querySelector(".apexcharts-legend-marker");
      if (name && marker) marker.style.background = scales.colorOf(name);
    });
  }
  /**
   * One shared gradient strip for a heatmap grid (P5). Every panel carries
   * the same pushed colorScale min/max (TrellisFrames), so any ONE mounted
   * panel's strip is THE grid's scale; it draws detached into a trellis-owned
   * slot under the grid. Hover (the value arrow) is wired through every
   * mounted panel's events, so sweeping any panel moves the one arrow.
   * On a virtualized grid with nothing mounted yet, the build defers to the
   * first panelMounted.
   * @param {HTMLElement} host
   */
  buildGradientLegend(host) {
    const t2 = this.trellis;
    const mounted = t2.panels.find((p) => p.chart);
    if (!mounted) {
      if (this._gradPending) return;
      const once = () => {
        var _a, _b;
        this._gradPending = null;
        (_b = (_a = t2.ctx.events).removeEventListener) == null ? void 0 : _b.call(_a, "panelMounted", once);
        this.buildGradientLegend(host);
      };
      this._gradPending = once;
      t2.ctx.events.addEventListener("panelMounted", once);
      return;
    }
    const slot = BrowserAPIs.createElement("div");
    slot.className = "apexcharts-trellis-legend apexcharts-trellis-gradient-legend";
    host.appendChild(slot);
    this.elLegend = slot;
    const chart = (
      /** @type {any} */
      mounted.chart
    );
    const legend = new HeatmapGradientLegend(chart.w, chart.ctx);
    legend.draw(slot);
    this.gradientLegend = legend;
    t2.panels.forEach((p) => {
      var _a;
      if (!p.chart || p === mounted) return;
      const ev = (
        /** @type {any} */
        (_a = p.chart.ctx) == null ? void 0 : _a.events
      );
      if (!(ev == null ? void 0 : ev.addEventListener)) return;
      ev.addEventListener("dataPointMouseEnter", legend._onCellEnter);
      ev.addEventListener("dataPointMouseLeave", legend._onCellLeave);
    });
  }
  /** Tear down the shared gradient strip (P5). */
  destroyGradientLegend() {
    var _a, _b;
    const t2 = this.trellis;
    if (this._gradPending) {
      (_b = (_a = t2.ctx.events).removeEventListener) == null ? void 0 : _b.call(_a, "panelMounted", this._gradPending);
      this._gradPending = null;
    }
    if (this.gradientLegend) {
      try {
        this.gradientLegend.destroy();
      } catch (e2) {
      }
      this.gradientLegend = null;
    }
  }
  /**
   * One toolbar for the grid: zoom / pan / reset only (P1). Zoom and pan arm
   * the tool by setting every panel's interact flags, which is exactly what
   * the per-chart toolbar does for its group; reset restores the trellis's
   * own domains via TrellisSync.
   * @param {HTMLElement} host
   */
  buildToolbar(host) {
    const t2 = this.trellis;
    if ((t2.cfg.toolbar || "shared") !== "shared") return;
    const bar = BrowserAPIs.createElement("div");
    bar.className = "apexcharts-trellis-toolbar";
    const buttons = {};
    const arm = (tool) => {
      t2.panels.forEach((p) => {
        if (!p.chart) return;
        const it = p.chart.w.interact;
        it.zoomEnabled = tool === "zoom";
        it.panEnabled = tool === "pan";
        it.selectionEnabled = false;
      });
      buttons.zoom.classList.toggle("apexcharts-selected", tool === "zoom");
      buttons.pan.classList.toggle("apexcharts-selected", tool === "pan");
      buttons.zoom.setAttribute("aria-pressed", String(tool === "zoom"));
      buttons.pan.setAttribute("aria-pressed", String(tool === "pan"));
    };
    const makeButton = (kind, label2, onClick) => {
      const b = BrowserAPIs.createElement("button");
      b.className = `apexcharts-trellis-tool apexcharts-trellis-tool-${kind}`;
      b.setAttribute("type", "button");
      b.setAttribute("aria-label", label2);
      b.setAttribute("title", label2);
      b.innerHTML = /** @type {Record<string, string>} */
      ICONS[kind];
      b.addEventListener("click", onClick);
      buttons[kind] = b;
      bar.appendChild(b);
      return b;
    };
    makeButton("zoom", "Selection zoom", () => arm("zoom"));
    makeButton("pan", "Pan", () => arm("pan"));
    makeButton("reset", "Reset zoom", () => {
      t2.sync.resetAll();
    });
    if (t2.ctx.exports) {
      const menu = BrowserAPIs.createElement("div");
      menu.className = "apexcharts-trellis-menu";
      [
        ["png", "Download PNG"],
        ["svg", "Download SVG"],
        ["csv", "Download CSV"]
      ].forEach(([kind, label2]) => {
        const item = BrowserAPIs.createElement("button");
        item.setAttribute("type", "button");
        item.className = "apexcharts-trellis-menu-item";
        item.textContent = label2;
        item.addEventListener("click", () => {
          menu.classList.remove("apexcharts-trellis-menu-open");
          t2.exports.download(kind);
        });
        menu.appendChild(item);
      });
      makeButton("download", "Download", () => {
        menu.classList.toggle("apexcharts-trellis-menu-open");
      });
      bar.appendChild(menu);
    }
    buttons.zoom.classList.add("apexcharts-selected");
    buttons.zoom.setAttribute("aria-pressed", "true");
    buttons.pan.setAttribute("aria-pressed", "false");
    host.appendChild(bar);
    this.elToolbar = bar;
    host.classList.add("apexcharts-trellis-has-toolbar");
  }
}
function yaxisPayload(chart, patch) {
  const current = Utils.clone(chart.w.config.yaxis);
  const arr = Array.isArray(current) ? current : [current];
  return arr.map((entry) => Utils.extend(entry, patch));
}
class TrellisSync {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this._syncing = false;
    this._hidden = /* @__PURE__ */ new Set();
    this.currentWindow = null;
  }
  /**
   * Record the x window a zoom gesture produced. An empty window (zoom-out
   * past the full range) clears the record back to the trellis domains.
   * @param {any} payload the zoomed/scrolled event payload
   * @param {boolean} zoomed
   */
  _noteWindow(payload, zoomed) {
    const xw = payload && payload.xaxis;
    if (xw && xw.min != null && xw.max != null) {
      this.currentWindow = {
        x: { min: xw.min, max: xw.max },
        y: this.currentWindow && this.currentWindow.y || null,
        zoomed: zoomed || !!(this.currentWindow && this.currentWindow.zoomed)
      };
    } else if (zoomed) {
      this.currentWindow = null;
    }
  }
  /**
   * The `zoomed` handler injected into every panel's config (wrapping the
   * user's own handler, which is called first with the panel's ctx). Drag,
   * wheel and toolbar zooms all funnel through this one config event.
   * @param {Function|undefined} userZoomed
   * @returns {(chartCtx: any, payload: any) => void}
   */
  makeZoomedHandler(userZoomed) {
    return (chartCtx, payload) => {
      if (typeof userZoomed === "function") userZoomed(chartCtx, payload);
      this._noteWindow(payload, true);
      this.onZoomed(payload);
    };
  }
  /**
   * The `scrolled` handler injected into every panel's config: panning moves
   * the x window without a zoomed event, and virtualized mounts must still
   * see the panned window when no live sibling exists.
   * @param {Function|undefined} userScrolled
   * @returns {(chartCtx: any, payload: any) => void}
   */
  makeScrolledHandler(userScrolled) {
    return (chartCtx, payload) => {
      if (typeof userScrolled === "function") userScrolled(chartCtx, payload);
      this._noteWindow(payload, false);
    };
  }
  /**
   * Shared-scale autoscale: recompute the union VISIBLE y over all panels in
   * the new x window and push it everywhere. Only meaningful when the y scale
   * is shared, the user asked for autoscale, and x is numeric (a category
   * window has no reliable data-space mapping to filter by).
   * @param {any} payload the zoomed event payload ({ xaxis: { min, max } })
   */
  onZoomed(payload) {
    const t2 = this.trellis;
    if (this._syncing) return;
    const cfg = t2.cfg;
    if (!cfg || (cfg.scales.y || "shared") !== "shared") return;
    if (!t2.autoScaleYaxis) return;
    const xw = payload && payload.xaxis;
    if (!xw || xw.min == null || xw.max == null) return;
    if (!t2.split || !t2.split.xIsNumeric) return;
    const ext = yExtentInWindow(
      t2.split.panels,
      t2.split.xForm,
      xw.min,
      xw.max,
      t2._stackingHost().parts
    );
    if (!ext) return;
    const y = niceBounds(ext.min, ext.max, cfg.targetTicks || DEFAULT_TARGET_TICKS);
    if (this.currentWindow) {
      this.currentWindow.y = {
        min: y.min,
        max: y.max,
        tickAmount: y.tickAmount
      };
    }
    this._syncing = true;
    const pushes = t2.panels.map(
      (p) => p.chart ? p.chart.updateOptions(
        {
          yaxis: yaxisPayload(p.chart, {
            min: y.min,
            max: y.max,
            tickAmount: y.tickAmount
          })
        },
        false,
        false,
        false
      ).catch(() => {
      }) : Promise.resolve()
    );
    Promise.all(pushes).finally(() => {
      this._syncing = false;
    });
  }
  /**
   * One reset for the whole grid: restore the trellis's own domains (which,
   * for a shared y drifted by autoscale, is the stored union) and clear the
   * zoomed flag. Deliberately NOT resetSeries(): that would also undo the
   * legend's collapsed set, which is user state, not zoom state.
   * @returns {Promise<any>}
   */
  resetAll() {
    const t2 = this.trellis;
    this.currentWindow = null;
    const xaxis = t2.scales && t2.scales.x ? { min: t2.scales.x.min, max: t2.scales.x.max } : { min: void 0, max: void 0 };
    this._syncing = true;
    const pushes = t2.panels.map((p) => {
      if (!p.chart) return Promise.resolve();
      p.chart.w.interact.zoomed = false;
      const options = { xaxis };
      const yBounds = t2.split ? t2._yBoundsFor(t2.split.panels[p.index]) : null;
      if (yBounds) {
        options.yaxis = yaxisPayload(p.chart, {
          min: yBounds.min,
          max: yBounds.max,
          tickAmount: yBounds.tickAmount
        });
      }
      return p.chart.updateOptions(options, false, false, false).catch(() => {
      });
    });
    return Promise.all(pushes).finally(() => {
      this._syncing = false;
    });
  }
  /**
   * Toggle one series name across every panel. Panels missing the name are
   * skipped (a panel-local slice may not carry a repeated series).
   * @param {string} name
   * @returns {boolean} the new hidden state
   */
  toggleSeries(name) {
    const hide = !this._hidden.has(name);
    if (hide) this._hidden.add(name);
    else this._hidden.delete(name);
    this.trellis.panels.forEach((p) => {
      const chart = p.chart;
      if (!chart) return;
      const names = chart.w.seriesData.seriesNames || [];
      if (names.indexOf(name) === -1) return;
      try {
        hide ? chart.hideSeries(name) : chart.showSeries(name);
      } catch (e2) {
      }
    });
    return hide;
  }
  /** @param {string} name */
  isHidden(name) {
    return this._hidden.has(name);
  }
  /**
   * Bring one freshly mounted panel in line with the shared legend's hidden
   * set (virtualized remounts miss the toggles that happened while they were
   * unmounted; the trellis-wide `_hidden` set is the truth).
   * @param {any} chart a panel instance
   */
  applyHiddenTo(chart) {
    if (!this._hidden.size || !chart) return;
    const names = chart.w.seriesData && chart.w.seriesData.seriesNames || [];
    this._hidden.forEach((name) => {
      if (names.indexOf(name) === -1) return;
      try {
        chart.hideSeries(name);
      } catch (e2) {
      }
    });
  }
  /**
   * Cross-panel crosshair sweep.
   *
   * The group's own crosshair fan-out assumes vertically STACKED charts: the
   * sibling path maps the pointer's clientX into the sibling's own plot
   * (Utils.getNearestValues -> screenXToPlotPx), which lands out of bounds
   * the moment a sibling sits beside rather than below the hovered chart, so
   * the sibling bails before ever moving its crosshair (measured; the shipped
   * stacked sample works, a side-by-side group does not).
   *
   * The trellis mirrors instead, and the alignment invariant is what makes
   * the naive mirror CORRECT: every panel has the identical translateX and
   * gridWidth and the identical x domain, so the hovered panel's
   * crosshair-x in plot px means the same data x in every panel.
   *
   * The mirror is a CONTINUOUS rAF loop bounded by grid hover, not a one-shot
   * per mousemove: the group's tooltip pipeline clears sibling crosshairs
   * asynchronously AFTER the event (measured: a one-shot mirror wins the
   * frame, then the native clear lands and the sweep collapses back to the
   * hovered column at rest). Re-asserting every frame while the pointer is
   * inside the grid makes the settled state the mirrored one; the loop stops
   * on mouseleave, so an idle page costs nothing.
   *
   * @param {HTMLElement} elGrid the trellis grid element
   */
  wireCrosshairs(elGrid) {
    let raf2 = 0;
    let hoverTarget = null;
    const apply = () => {
      const cell = hoverTarget && hoverTarget.closest ? hoverTarget.closest(".apexcharts-trellis-cell") : null;
      const source = cell ? cell.querySelector(".apexcharts-xcrosshairs") : null;
      const active = source && source.classList.contains("apexcharts-active");
      this.trellis.panels.forEach((p) => {
        if (!p.cellEl || p.cellEl === cell) return;
        const x2 = p.cellEl.querySelector(".apexcharts-xcrosshairs");
        if (!x2) return;
        if (active) {
          x2.setAttribute("x", source.getAttribute("x") || "0");
          x2.setAttribute("x1", source.getAttribute("x1") || "0");
          x2.setAttribute("x2", source.getAttribute("x2") || "0");
          x2.classList.add("apexcharts-active");
        } else {
          x2.classList.remove("apexcharts-active");
        }
      });
    };
    const loop = () => {
      apply();
      raf2 = hoverTarget ? requestAnimationFrame(loop) : 0;
    };
    const move = (e2) => {
      hoverTarget = e2.target;
      if (!raf2) raf2 = requestAnimationFrame(loop);
    };
    const clear = () => {
      hoverTarget = null;
      if (raf2) {
        cancelAnimationFrame(raf2);
        raf2 = 0;
      }
      this.trellis.panels.forEach((p) => {
        const x2 = p.cellEl && p.cellEl.querySelector(".apexcharts-xcrosshairs");
        if (x2) x2.classList.remove("apexcharts-active");
      });
    };
    elGrid.addEventListener("mousemove", move, { passive: true });
    elGrid.addEventListener("mouseleave", clear, { passive: true });
  }
}
const VIEWSTATE_VERSION = 1;
function axisWindow(min, max) {
  const hasMin = min !== void 0 && min !== null;
  const hasMax = max !== void 0 && max !== null;
  if (!hasMin && !hasMax) return null;
  return { min: hasMin ? min : null, max: hasMax ? max : null };
}
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return [];
  return sel.map((a2) => Array.isArray(a2) ? a2.slice() : a2);
}
function annotationKind(method, ctx) {
  if (typeof method !== "function" || !ctx) return null;
  if (method === ctx.addXaxisAnnotation) return "xaxis";
  if (method === ctx.addYaxisAnnotation) return "yaxis";
  if (method === ctx.addPointAnnotation) return "point";
  return null;
}
function addMethodName(kind) {
  switch (kind) {
    case "xaxis":
      return "addXaxisAnnotation";
    case "yaxis":
      return "addYaxisAnnotation";
    case "point":
      return "addPointAnnotation";
    default:
      return null;
  }
}
function captureAnnotations(w, ctx) {
  const staticAnno = w.config.annotations ? Utils.clone(w.config.annotations) : null;
  const dynamic = [];
  const mem = w.globals.memory && w.globals.memory.methodsToExec || [];
  for (const entry of mem) {
    if (!entry || entry.label !== "addAnnotation") continue;
    const kind = annotationKind(entry.method, ctx);
    if (!kind) continue;
    dynamic.push({ kind, params: Utils.clone(entry.params) });
  }
  return { static: staticAnno, dynamic };
}
function captureMeasure(ctx) {
  const m = ctx && ctx.measure;
  if (!m || typeof m.getPins !== "function") return null;
  const pins = m.getPins();
  return Array.isArray(pins) && pins.length ? { pins } : null;
}
function captureViewState(w, ctx) {
  var _a, _b;
  const cfgX = w.config.xaxis || {};
  const cfgYArr = Array.isArray(w.config.yaxis) ? w.config.yaxis : w.config.yaxis ? [w.config.yaxis] : [];
  const yWindows = cfgYArr.map(
    (y) => axisWindow(y && y.min, y && y.max)
  );
  const anyY = yWindows.some((yw) => yw !== null);
  const theme = w.config.theme;
  const drilldown = ctx && ctx.drilldown;
  return {
    v: VIEWSTATE_VERSION,
    window: {
      xaxis: axisWindow(cfgX.min, cfgX.max),
      yaxis: anyY ? yWindows : null
    },
    zoomed: !!w.interact.zoomed,
    collapsed: (w.globals.collapsedSeriesIndices || []).slice(),
    ancillaryCollapsed: (w.globals.ancillaryCollapsedSeriesIndices || []).slice(),
    selectedDataPoints: cloneSelection(w.interact.selectedDataPoints),
    theme: theme ? { mode: (_a = theme.mode) != null ? _a : null, palette: (_b = theme.palette) != null ? _b : null } : null,
    locale: w.config.chart && w.config.chart.defaultLocale || null,
    annotations: captureAnnotations(w, ctx),
    drill: drilldown && drilldown.depth > 0 ? { path: drilldown.path.slice() } : null,
    measure: captureMeasure(ctx)
  };
}
function applyCollapsedSet(ctx, targetCollapsed, targetAncillary) {
  const w = ctx.w;
  if (targetCollapsed == null && targetAncillary == null) return;
  const names = w.globals.seriesNames || [];
  const target2 = /* @__PURE__ */ new Set([
    ...targetCollapsed || [],
    ...targetAncillary || []
  ]);
  const current = /* @__PURE__ */ new Set([
    ...w.globals.collapsedSeriesIndices || [],
    ...w.globals.ancillaryCollapsedSeriesIndices || []
  ]);
  for (let realIndex = 0; realIndex < names.length; realIndex++) {
    const name = names[realIndex];
    if (name == null) continue;
    const shouldCollapse = target2.has(realIndex);
    const isCollapsed = current.has(realIndex);
    if (shouldCollapse && !isCollapsed) {
      ctx.hideSeries(name);
    } else if (!shouldCollapse && isCollapsed) {
      ctx.showSeries(name);
    }
  }
}
function restoreSelection(ctx, selectedDataPoints) {
  if (!Array.isArray(selectedDataPoints)) return;
  ctx.w.interact.selectedDataPoints = cloneSelection(selectedDataPoints);
}
function applyViewState(ctx, view, { animate = true, mergeOptions } = {}) {
  var _a, _b;
  if (!ctx || !view) return;
  if (typeof view.v === "number" && view.v > VIEWSTATE_VERSION) {
    console.warn(
      `[apexcharts] ViewState v${view.v} is newer than this build understands (v${VIEWSTATE_VERSION}); applying best-effort.`
    );
  }
  ctx.clearAnnotations();
  const options = mergeOptions ? Utils.clone(mergeOptions) : {};
  const xw = view.window && view.window.xaxis;
  options.xaxis = Object.assign(
    {},
    options.xaxis,
    xw ? { min: (_a = xw.min) != null ? _a : void 0, max: (_b = xw.max) != null ? _b : void 0 } : { min: void 0, max: void 0 }
  );
  const yw = view.window && view.window.yaxis;
  if (Array.isArray(yw)) {
    options.yaxis = yw.map(
      (y) => {
        var _a2, _b2;
        return y ? { min: (_a2 = y.min) != null ? _a2 : void 0, max: (_b2 = y.max) != null ? _b2 : void 0 } : {};
      }
    );
  }
  if (view.theme) {
    const theme = {};
    if (view.theme.mode != null) theme.mode = view.theme.mode;
    if (view.theme.palette != null) theme.palette = view.theme.palette;
    if (Object.keys(theme).length) {
      options.theme = Object.assign({}, options.theme, theme);
    }
  }
  if (view.annotations && view.annotations.static) {
    options.annotations = Utils.clone(view.annotations.static);
  }
  ctx.updateOptions(
    options,
    false,
    animate,
    false,
    false
  );
  applyViewInteraction(ctx, view);
}
function applyViewInteraction(ctx, view) {
  if (!ctx || !view) return;
  const w = ctx.w;
  w.interact.zoomed = !!view.zoomed;
  applyCollapsedSet(ctx, view.collapsed, view.ancillaryCollapsed);
  if (view.annotations && Array.isArray(view.annotations.dynamic)) {
    view.annotations.dynamic.forEach((a2) => {
      const method = addMethodName(a2.kind);
      if (method && typeof ctx[method] === "function") {
        ctx[method](a2.params, true);
      }
    });
  }
  restoreSelection(ctx, view.selectedDataPoints);
  if (view.locale && view.locale !== w.config.chart.defaultLocale) {
    ctx.setLocale(view.locale);
  }
  if (ctx.measure && typeof ctx.measure.setPins === "function") {
    ctx.measure.setPins(view.measure && view.measure.pins || []);
  }
}
const MOUNTS_PER_FRAME = 2;
const OPS_PER_FRAME = 6;
const GUTTER_EPSILON = 0.5;
function raf(cb) {
  if (typeof requestAnimationFrame === "function") {
    return { kind: "raf", id: requestAnimationFrame(cb) };
  }
  return { kind: "timeout", id: setTimeout(() => cb(0), 16) };
}
function cancelRaf(handle) {
  if (!handle) return;
  if (handle.kind === "raf") cancelAnimationFrame(handle.id);
  else clearTimeout(handle.id);
}
class TrellisVirtual {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this.active = false;
    this._io = null;
    this._byCell = /* @__PURE__ */ new Map();
    this._dirty = /* @__PURE__ */ new Set();
    this._raf = null;
    this._draining = false;
    this._gutterFloor = 0;
  }
  static supported() {
    return typeof IntersectionObserver !== "undefined";
  }
  /** One grid row (panel + header + gap): the observer's look-ahead margin. */
  _rootMargin() {
    const ly = this.trellis.layout;
    const m = ly ? Math.max(0, Math.round(ly.panelH + ly.headerH + ly.gap)) : 300;
    return `${m}px 0px ${m}px 0px`;
  }
  /** Begin observing every cell. Panels start unmounted; the observer's
   *  initial callback mounts the visible ones. */
  start() {
    if (!TrellisVirtual.supported()) return;
    this.active = true;
    this._io = new IntersectionObserver(
      (entries) => this._onEntries(entries),
      { root: null, rootMargin: this._rootMargin(), threshold: 0 }
    );
    this.trellis.panels.forEach((p) => {
      var _a;
      p.wantMounted = false;
      if (p.cellEl) {
        this._byCell.set(p.cellEl, p);
        (_a = this._io) == null ? void 0 : _a.observe(p.cellEl);
      }
    });
  }
  /**
   * Recreate the observer after a relayout: rootMargin is immutable on a live
   * observer and it tracks the (possibly changed) panel height. Re-observing
   * re-fires initial entries, which reconciles to a no-op for unchanged cells.
   */
  refresh() {
    if (!this.active || !this._io) return;
    this._io.disconnect();
    this._io = new IntersectionObserver(
      (entries) => this._onEntries(entries),
      { root: null, rootMargin: this._rootMargin(), threshold: 0 }
    );
    this._byCell.forEach((_p, cell) => {
      var _a;
      return (_a = this._io) == null ? void 0 : _a.observe(cell);
    });
  }
  /** @param {IntersectionObserverEntry[]} entries */
  _onEntries(entries) {
    if (!this.active) return;
    for (const entry of entries) {
      const panel = this._byCell.get(entry.target);
      if (!panel) continue;
      panel.wantMounted = entry.isIntersecting;
      this._dirty.add(panel);
    }
    this._schedule();
  }
  _schedule() {
    if (this._raf || this._draining || !this.active) return;
    this._raf = raf(() => {
      this._raf = null;
      this._drain();
    });
  }
  /** Reconcile wanted-vs-actual for a bounded batch of panels, then yield. */
  _drain() {
    return __async(this, null, function* () {
      if (this._draining || !this.active) return;
      this._draining = true;
      try {
        let mounts = 0;
        let ops = 0;
        while (this.active && this._dirty.size && mounts < MOUNTS_PER_FRAME && ops < OPS_PER_FRAME) {
          const panel = this._dirty.values().next().value;
          this._dirty.delete(panel);
          const want = !!panel.wantMounted;
          if (want === !!panel.chart) continue;
          ops++;
          if (want) {
            mounts++;
            yield this._mount(panel);
          } else {
            this._unmount(panel);
          }
        }
      } finally {
        this._draining = false;
        if (this.active && this._dirty.size) {
          this._schedule();
        } else if (this.active) {
          this.trellis.w.globals.animationEnded = true;
        }
      }
    });
  }
  /**
   * The freshest cross-panel window: any mounted sibling's current config.
   * Group pushes (drag/wheel zoom, pan, shared-y autoscale) reach only
   * mounted panels, so this beats a stash captured before those pushes.
   * @param {any} skip the panel being mounted
   */
  _liveWindow(skip) {
    const sibling = this.trellis.panels.find((p) => p !== skip && p.chart);
    if (!sibling || !sibling.chart) return null;
    const w = sibling.chart.w;
    const x2 = w.config.xaxis || {};
    const y0 = Array.isArray(w.config.yaxis) ? w.config.yaxis[0] : w.config.yaxis;
    return {
      zoomed: !!w.interact.zoomed,
      x: x2.min != null || x2.max != null ? { min: x2.min, max: x2.max } : null,
      y: y0 && (y0.min != null || y0.max != null) ? { min: y0.min, max: y0.max, tickAmount: y0.tickAmount } : null
    };
  }
  /**
   * Merge an axis-window patch into the assembled options' yaxis without
   * losing the user's own entries (D8: yaxis pushes replace wholesale, so the
   * patch is applied onto the already-assembled array in place).
   * @param {Record<string, any>} opts
   * @param {Record<string, any>} patch
   */
  _patchYaxis(opts, patch) {
    const arr = Array.isArray(opts.yaxis) ? opts.yaxis : opts.yaxis ? [opts.yaxis] : [{}];
    arr.forEach((entry) => {
      Object.keys(patch).forEach((k2) => {
        if (k2 === "labels") {
          entry.labels = __spreadValues(__spreadValues({}, entry.labels || {}), patch.labels);
        } else {
          entry[k2] = patch[k2];
        }
      });
    });
    opts.yaxis = arr;
  }
  /** @param {any} panel */
  _mount(panel) {
    return __async(this, null, function* () {
      var _a, _b, _c, _d, _e, _f, _g, _h;
      const t2 = this.trellis;
      if (!panel.el || panel.chart || panel.noMount) return;
      const stash = panel.viewStash;
      const sharedY = t2._yMode() === "shared";
      const independentY = !sharedY;
      const opts = t2._assemblePanelOptions(panel.index, {
        noAnimation: !!stash
      });
      const sw = stash && stash.window;
      if (sw && sw.xaxis) {
        opts.xaxis = __spreadProps(__spreadValues({}, opts.xaxis || {}), {
          min: (_a = sw.xaxis.min) != null ? _a : void 0,
          max: (_b = sw.xaxis.max) != null ? _b : void 0
        });
      }
      if (independentY && sw && Array.isArray(sw.yaxis) && sw.yaxis[0]) {
        this._patchYaxis(opts, {
          min: (_c = sw.yaxis[0].min) != null ? _c : void 0,
          max: (_d = sw.yaxis[0].max) != null ? _d : void 0
        });
      }
      const live = this._liveWindow(panel);
      if (live && live.x) {
        opts.xaxis = __spreadProps(__spreadValues({}, opts.xaxis || {}), { min: live.x.min, max: live.x.max });
      }
      if (live && live.y && sharedY) {
        this._patchYaxis(opts, __spreadValues({
          min: live.y.min,
          max: live.y.max
        }, live.y.tickAmount != null ? { tickAmount: live.y.tickAmount } : {}));
      }
      const cw = t2.sync.currentWindow;
      if (cw && cw.x) {
        opts.xaxis = __spreadProps(__spreadValues({}, opts.xaxis || {}), { min: cw.x.min, max: cw.x.max });
      }
      if (cw && cw.y && sharedY) {
        this._patchYaxis(opts, __spreadValues({
          min: cw.y.min,
          max: cw.y.max
        }, cw.y.tickAmount != null ? { tickAmount: cw.y.tickAmount } : {}));
      }
      if (independentY && this._gutterFloor > 0) {
        this._patchYaxis(opts, { labels: { minWidth: this._gutterFloor } });
      }
      panel.el.classList.remove("apexcharts-trellis-skeleton");
      const chart = new t2._ApexCharts(panel.el, opts);
      panel.chart = chart;
      try {
        yield chart.render();
      } catch (e2) {
        panel.chart = null;
        panel.el.classList.add("apexcharts-trellis-skeleton");
        return;
      }
      if (!this.active) return;
      chart.w.interact.zoomed = cw ? !!cw.zoomed : live ? live.zoomed : !!(stash && stash.zoomed);
      t2.sync.applyHiddenTo(chart);
      if (stash && stash.annotations && Array.isArray(stash.annotations.dynamic)) {
        const methodOf = {
          xaxis: "addXaxisAnnotation",
          yaxis: "addYaxisAnnotation",
          point: "addPointAnnotation"
        };
        const target2 = (
          /** @type {any} */
          chart
        );
        stash.annotations.dynamic.forEach((a2) => {
          const m = (
            /** @type {any} */
            methodOf[a2.kind]
          );
          if (m && typeof target2[m] === "function") target2[m](a2.params, true);
        });
      }
      panel.viewStash = null;
      if (independentY) {
        const wpx = (_h = (_g = (_f = (_e = chart.w) == null ? void 0 : _e.globals) == null ? void 0 : _f.yLabelsCoords) == null ? void 0 : _g[0]) == null ? void 0 : _h.width;
        if (typeof wpx === "number" && isFinite(wpx)) {
          const pad = chart.w.globals.isBarHorizontal ? 0 : t2._yLabelPad();
          const tight = Math.max(0, wpx - pad);
          if (tight > this._gutterFloor + GUTTER_EPSILON) {
            this._gutterFloor = tight;
            yield t2._pushGutterFloor(this._gutterFloor);
          }
        }
      }
      t2._fire("panelMounted", {
        key: panel.key,
        index: panel.index,
        chart,
        remounted: !!stash
      });
    });
  }
  /** @param {any} panel */
  _unmount(panel) {
    if (!panel.chart) return;
    try {
      panel.viewStash = captureViewState(panel.chart.w, panel.chart);
    } catch (e2) {
      panel.viewStash = null;
    }
    try {
      panel.chart.destroy();
    } catch (e2) {
    }
    panel.chart = null;
    if (panel.el) {
      panel.el.classList.add("apexcharts-trellis-skeleton");
      const ly = this.trellis.layout;
      if (ly) panel.el.style.minHeight = `${ly.panelH}px`;
    }
  }
  /** Disconnect and drop all virtualization state (trellis teardown). */
  stop() {
    this.active = false;
    if (this._io) {
      this._io.disconnect();
      this._io = null;
    }
    this._byCell.clear();
    this._dirty.clear();
    cancelRaf(this._raf);
    this._raf = null;
    this._gutterFloor = 0;
  }
}
const CURSOR_PAD = 14;
const BAR_FAMILY = ["bar", "column", "rangeBar", "candlestick", "boxPlot"];
class TrellisTooltip {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
    this.el = null;
    this._raf = 0;
    this._lastEvent = null;
  }
  /**
   * Build the card element and start the hover loop.
   * @param {HTMLElement} elGrid
   * @param {HTMLElement} elWrap
   */
  wire(elGrid, elWrap) {
    const card = BrowserAPIs.createElement("div");
    card.className = "apexcharts-trellis-tooltip apexcharts-theme-light";
    card.setAttribute("role", "status");
    elWrap.appendChild(card);
    this.el = card;
    const loop = () => {
      this._update(elWrap);
      this._raf = this._lastEvent ? requestAnimationFrame(loop) : 0;
    };
    const move = (e2) => {
      this._lastEvent = e2;
      if (!this._raf) this._raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      this._lastEvent = null;
      if (this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
      card.classList.remove("apexcharts-trellis-tooltip-active");
    };
    elGrid.addEventListener("mousemove", move, { passive: true });
    elGrid.addEventListener("mouseleave", leave, { passive: true });
  }
  /**
   * The hovered data-point index in the union x space, or -1 when the
   * pointer is outside the hovered panel's plot. Mirrors the divisor rules
   * of tooltip/Utils.getNearestValues (trellis panels are never combos).
   * @param {any} chart the hovered panel's instance
   * @param {number} clientX
   * @param {number} clientY
   */
  _hoverIndex(chart, clientX, clientY) {
    const w = chart.w;
    const n2 = w.globals.dataPoints;
    if (!n2 || n2 < 1) return -1;
    const gridWidth = w.layout.gridWidth;
    if (!gridWidth) return -1;
    const hoverX = AxisMapping.screenXToPlotPx(w, clientX);
    const edgePad = w.globals.barPadForNumericAxis || 0;
    if (hoverX < -edgePad || hoverX > gridWidth + edgePad) return -1;
    const baseEl = w.dom && w.dom.baseEl;
    if (baseEl && baseEl.querySelector(".apexcharts-svg")) {
      const plot = TooltipUtils.plotRect(w);
      if (plot.height && (clientY < plot.top || clientY > plot.top + plot.height)) {
        return -1;
      }
    }
    const barish = BAR_FAMILY.indexOf(w.config.chart.type) !== -1;
    let j2;
    if (barish && !w.config.xaxis.convertedCatToNumeric) {
      j2 = Math.ceil(hoverX / (gridWidth / n2)) - 1;
    } else {
      j2 = Math.round(hoverX / (gridWidth / Math.max(1, n2 - 1)));
    }
    return Math.max(0, Math.min(n2 - 1, j2));
  }
  /**
   * One series' formatted value in one panel at index j, or null when there
   * is nothing to show. Formatter chain: tooltip.y formatter, then the yaxis
   * labels formatter, then the raw value.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @param {string} name
   * @param {number} nameIdx trellis-wide series index (formatter arg)
   * @param {number} j
   */
  _valueAt(slice, name, nameIdx, j2) {
    var _a, _b;
    const s2 = slice.series.find((sr) => sr.name === name);
    if (!s2 || !Array.isArray(s2.data)) return null;
    const d = s2.data[j2];
    if (d === null || d === void 0) return null;
    let y = d;
    if (Array.isArray(d)) y = d[1];
    else if (typeof d === "object") y = d.y;
    if (y === null || y === void 0) return null;
    const cfg = this.trellis.w.config;
    const ttY = Array.isArray((_a = cfg.tooltip) == null ? void 0 : _a.y) ? cfg.tooltip.y[nameIdx] : (_b = cfg.tooltip) == null ? void 0 : _b.y;
    const yaxis0 = Array.isArray(cfg.yaxis) ? cfg.yaxis[0] : cfg.yaxis;
    const formatter = ttY && typeof ttY.formatter === "function" && ttY.formatter || yaxis0 && yaxis0.labels && typeof yaxis0.labels.formatter === "function" && yaxis0.labels.formatter || null;
    const fmt = (v) => {
      if (formatter) {
        try {
          return String(
            formatter(v, { seriesIndex: nameIdx, dataPointIndex: j2, w: null })
          );
        } catch (e2) {
          return String(v);
        }
      }
      return String(v);
    };
    return Array.isArray(y) ? y.map(fmt).join(" / ") : fmt(y);
  }
  /**
   * One reconcile pass: resolve the hovered panel and index, then one row
   * per panel from the split.
   * @param {HTMLElement} elWrap
   */
  _update(elWrap) {
    const t2 = this.trellis;
    const card = this.el;
    const e2 = this._lastEvent;
    if (!card || !e2 || !t2.split) return;
    const cell = e2.target && e2.target.closest ? e2.target.closest(".apexcharts-trellis-cell") : null;
    const hovered = cell ? t2.panels.find((p) => p.cellEl === cell) : void 0;
    const j2 = hovered && hovered.chart ? this._hoverIndex(hovered.chart, e2.clientX, e2.clientY) : -1;
    if (!hovered || j2 === -1) {
      card.classList.remove("apexcharts-trellis-tooltip-active");
      return;
    }
    const titleEl = cell ? cell.querySelector(".apexcharts-tooltip-title") : null;
    const title = titleEl && titleEl.textContent ? titleEl.textContent : "";
    const names = t2.split.seriesNames;
    const scales = t2.scales;
    const rows = [];
    t2.split.panels.forEach((slice) => {
      const vals = [];
      names.forEach((name, ni) => {
        const v = this._valueAt(slice, name, ni, j2);
        if (v === null) return;
        const color = scales ? scales.colorOf(name) : "#008FFB";
        vals.push(
          `<span class="apexcharts-trellis-tooltip-val"><span class="apexcharts-trellis-tooltip-marker" style="background:${escapeAttr$1(
            color
          )}"></span>${escapeHtml(v)}</span>`
        );
      });
      const isHovered = slice.key === hovered.key;
      rows.push(
        `<div class="apexcharts-trellis-tooltip-row${isHovered ? " apexcharts-trellis-tooltip-row-active" : ""}" data-key="${escapeAttr$1(slice.key)}"><span class="apexcharts-trellis-tooltip-key">${escapeHtml(
          slice.key
        )}</span><span class="apexcharts-trellis-tooltip-vals">${vals.join(
          ""
        )}</span></div>`
      );
    });
    let html = "";
    if (title) {
      html += `<div class="apexcharts-tooltip-title">${escapeHtml(title)}</div>`;
    }
    html += rows.join("");
    card.innerHTML = html;
    card.classList.add("apexcharts-trellis-tooltip-active");
    const wrapRect = elWrap.getBoundingClientRect();
    const zoom = TooltipUtils.plotRect(hovered.chart.w).zoom;
    let x2 = (e2.clientX - wrapRect.left) / zoom + CURSOR_PAD;
    let y = (e2.clientY - wrapRect.top) / zoom + CURSOR_PAD;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const wrapWidth = wrapRect.width / zoom;
    const wrapHeight = wrapRect.height / zoom;
    if (x2 + cw > wrapWidth - 4) x2 = Math.max(4, x2 - cw - CURSOR_PAD * 2);
    if (y + ch > wrapHeight - 4) y = Math.max(4, y - ch - CURSOR_PAD * 2);
    card.style.left = `${Math.round(x2)}px`;
    card.style.top = `${Math.round(y)}px`;
  }
  destroy() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    this._lastEvent = null;
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}
function escapeHtml(s2) {
  return String(s2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function escapeAttr$1(s2) {
  return String(s2).replace(/"/g, "&quot;");
}
class TrellisExports {
  /**
   * @param {import('./Trellis').default} trellis
   */
  constructor(trellis) {
    this.trellis = trellis;
  }
  /** Whether panel-level export machinery is available. */
  supported() {
    return !!this.trellis.ctx.exports;
  }
  /**
   * The wrap-relative rect of an element.
   * @param {Element} el
   */
  _rectIn(el) {
    const wrap = (
      /** @type {HTMLElement} */
      this.trellis.elWrap
    );
    const w = wrap.getBoundingClientRect();
    const r2 = el.getBoundingClientRect();
    return {
      x: r2.left - w.left,
      y: r2.top - w.top,
      w: r2.width,
      h: r2.height
    };
  }
  /** Export surface size = the wrap's own box. */
  _size() {
    const wrap = (
      /** @type {HTMLElement} */
      this.trellis.elWrap
    );
    const r2 = wrap.getBoundingClientRect();
    return { w: Math.ceil(r2.width), h: Math.ceil(r2.height) };
  }
  /** The opaque base color, from any mounted panel's own resolver. */
  _background() {
    const mounted = this.trellis.panels.find((p) => p.chart);
    const ex = mounted && mounted.chart.exports;
    if (ex && typeof ex.resolveExportBackground === "function") {
      const bg = ex.resolveExportBackground();
      if (bg && bg !== "transparent") return bg;
    }
    return "#fff";
  }
  /** Text pieces to compose: title + one header per cell (+ legend items). */
  _chromeTexts() {
    const t2 = this.trellis;
    const texts2 = [];
    const push = (el, align) => {
      if (!el || !el.textContent) return;
      const rect = this._rectIn(el);
      const cs = getComputedStyle(
        /** @type {HTMLElement} */
        el
      );
      texts2.push({
        text: el.textContent,
        x: align === "center" ? rect.x + rect.w / 2 : rect.x,
        y: rect.y + rect.h / 2,
        font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`,
        fontSize: parseFloat(cs.fontSize) || 12,
        color: cs.color || "#373d3f",
        align
      });
    };
    push(t2.chrome.elTitle, "left");
    t2.panels.forEach((p) => {
      if (!p.cellEl) return;
      push(p.cellEl.querySelector(".apexcharts-trellis-header"), "center");
    });
    if (t2.chrome.elLegend) {
      t2.chrome.elLegend.querySelectorAll(".apexcharts-legend-text").forEach((el) => push(el, "left"));
    }
    return texts2;
  }
  /** Legend marker dots (color + rect), for both compose targets. */
  _legendMarkers() {
    const legend = this.trellis.chrome.elLegend;
    if (!legend) return [];
    return Array.from(
      legend.querySelectorAll(".apexcharts-legend-marker"),
      (el) => ({
        rect: this._rectIn(el),
        color: (
          /** @type {HTMLElement} */
          el.style.background || /** @type {HTMLElement} */
          el.style.backgroundColor || "#008FFB"
        )
      })
    );
  }
  /**
   * One PNG of the whole grid.
   * @param {{ scale?: number }} [options]
   * @returns {Promise<{ imgURI: string }>}
   */
  dataURI() {
    return __async(this, arguments, function* (options = {}) {
      const t2 = this.trellis;
      const scale = options.scale || 1;
      const size = this._size();
      const canvas = document.createElement("canvas");
      canvas.width = size.w * scale;
      canvas.height = size.h * scale;
      const ctx2d = canvas.getContext("2d");
      if (!ctx2d) return { imgURI: "" };
      const ctx = (
        /** @type {CanvasRenderingContext2D} */
        ctx2d
      );
      ctx.scale(scale, scale);
      ctx.fillStyle = this._background();
      ctx.fillRect(0, 0, size.w, size.h);
      for (const p of t2.panels) {
        if (!p.el) continue;
        const rect = this._rectIn(p.el);
        if (!p.chart) {
          ctx.fillStyle = "rgba(120, 120, 120, 0.06)";
          ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
          continue;
        }
        const { imgURI } = yield p.chart.dataURI({ scale });
        if (!imgURI) continue;
        const img = yield loadImage(imgURI);
        ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h);
      }
      for (const piece of this._chromeTexts()) {
        ctx.font = piece.font;
        ctx.fillStyle = piece.color;
        ctx.textAlign = piece.align;
        ctx.textBaseline = "middle";
        ctx.fillText(piece.text, piece.x, piece.y);
      }
      for (const m of this._legendMarkers()) {
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(
          m.rect.x + m.rect.w / 2,
          m.rect.y + m.rect.h / 2,
          Math.max(2, m.rect.w / 2),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      return { imgURI: canvas.toDataURL("image/png") };
    });
  }
  /**
   * One SVG of the whole grid: nested per-panel SVGs (fonts already inlined
   * by each panel's own getSvgString) plus text chrome.
   * @returns {Promise<string>}
   */
  svgString() {
    return __async(this, null, function* () {
      const t2 = this.trellis;
      const size = this._size();
      const parts = [];
      parts.push(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size.w}" height="${size.h}" viewBox="0 0 ${size.w} ${size.h}">`
      );
      parts.push(
        `<rect width="${size.w}" height="${size.h}" fill="${this._background()}"/>`
      );
      for (const p of t2.panels) {
        if (!p.el) continue;
        const rect = this._rectIn(p.el);
        if (!p.chart) {
          parts.push(
            `<rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" fill="rgba(120,120,120,0.06)" rx="4"/>`
          );
          continue;
        }
        const svg = yield p.chart.getSvgString();
        parts.push(
          `<g transform="translate(${rect.x}, ${rect.y})">${svg}</g>`
        );
      }
      for (const piece of this._chromeTexts()) {
        const anchor = piece.align === "center" ? "middle" : "start";
        parts.push(
          `<text x="${piece.x}" y="${piece.y}" text-anchor="${anchor}" dominant-baseline="central" style="font:${escapeAttr(
            piece.font
          )};fill:${escapeAttr(piece.color)}">${escapeXml(piece.text)}</text>`
        );
      }
      for (const m of this._legendMarkers()) {
        parts.push(
          `<circle cx="${m.rect.x + m.rect.w / 2}" cy="${m.rect.y + m.rect.h / 2}" r="${Math.max(2, m.rect.w / 2)}" fill="${escapeAttr(m.color)}"/>`
        );
      }
      parts.push("</svg>");
      return parts.join("");
    });
  }
  /**
   * One CSV for the whole grid, wide form: x, facet, then one column per
   * series name. Rows are (panel x union-x), aligned by the split, so ragged
   * panels emit explicit blanks.
   * @returns {string}
   */
  csv() {
    var _a, _b, _c;
    const t2 = this.trellis;
    const split2 = t2.split;
    if (!split2) return "";
    const w = t2.w;
    const delimiter = ((_c = (_b = (_a = w.config.chart.toolbar) == null ? void 0 : _a.export) == null ? void 0 : _b.csv) == null ? void 0 : _c.columnDelimiter) || ",";
    const isDatetime = w.config.xaxis && w.config.xaxis.type === "datetime";
    const cell = (v) => {
      if (v === null || v === void 0) return "";
      const s2 = String(v);
      return /[",\n]/.test(s2) || s2.indexOf(delimiter) !== -1 ? `"${s2.replace(/"/g, '""')}"` : s2;
    };
    const xOut = (x2) => isDatetime && typeof x2 === "number" ? new Date(x2).toISOString() : x2;
    const names = split2.seriesNames;
    const lines = [
      ["x", "facet", ...names].map(cell).join(delimiter)
    ];
    split2.panels.forEach((slice) => {
      split2.unionX.forEach((x2, i2) => {
        const row = [xOut(x2), slice.key];
        names.forEach((name) => {
          const s2 = slice.series.find((sr) => sr.name === name);
          if (!s2 || !Array.isArray(s2.data)) {
            row.push("");
            return;
          }
          const d = s2.data[i2];
          let y = d;
          if (Array.isArray(d)) y = d[1];
          else if (d && typeof d === "object") y = d.y;
          row.push(Array.isArray(y) ? y.join("|") : y);
        });
        lines.push(row.map(cell).join(delimiter));
      });
    });
    return lines.join("\n");
  }
  /** @param {'png'|'svg'|'csv'} kind */
  download(kind) {
    return __async(this, null, function* () {
      var _a;
      const t2 = this.trellis;
      const exportCfg = ((_a = t2.w.config.chart.toolbar) == null ? void 0 : _a.export) || {};
      const fallback = String(t2.w.globals.chartID || "trellis");
      if (kind === "png") {
        const { imgURI } = yield this.dataURI();
        triggerDownload(imgURI, exportCfg.png && exportCfg.png.filename || fallback, ".png");
      } else if (kind === "svg") {
        const svg = yield this.svgString();
        const uri = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
        triggerDownload(uri, exportCfg.svg && exportCfg.svg.filename || fallback, ".svg");
      } else {
        const uri = "data:text/csv;charset=utf-8," + encodeURIComponent("\uFEFF" + this.csv());
        triggerDownload(uri, exportCfg.csv && exportCfg.csv.filename || fallback, ".csv");
      }
    });
  }
}
function loadImage(src) {
  return new Promise((resolve2, reject) => {
    const img = new Image();
    img.onload = () => resolve2(img);
    img.onerror = reject;
    img.src = src;
  });
}
function triggerDownload(href, filename, ext) {
  const a2 = document.createElement("a");
  a2.href = href;
  a2.download = filename + ext;
  document.body.appendChild(a2);
  a2.click();
  document.body.removeChild(a2);
}
function escapeXml(s2) {
  return String(s2).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(s2) {
  return String(s2).replace(/"/g, "&quot;");
}
const EAGER_PANEL_BUDGET = 64;
const HARD_PANEL_WARN = 256;
const ANIMATION_PANEL_BUDGET = 16;
const Y_LABEL_PAD = 10;
const PANEL_PAD_RECLAIM_TOP = 12;
const PANEL_PAD_RECLAIM_BOTTOM = 7;
const PANEL_PAD_RECLAIM_BOTTOM_DATETIME = 2;
const PANEL_ONLY_OPTIONS = [
  "annotations",
  "colors",
  "dataLabels",
  "fill",
  "forecastDataPoints",
  "grid",
  "markers",
  "noData",
  "states",
  "stroke",
  "tooltip"
];
const COMPACT_TOOLTIP_PANEL_H = 120;
const TYPE_VETO = {
  treemap: "trellis does not support treemap: area encoding needs room a panel cannot give. Rendering a single chart.",
  sunburst: "trellis does not support sunburst: its labels are illegible at panel size. Rendering a single chart.",
  unit: "the unit type has its own small-multiples mode (plotOptions.unit.grid.split), which beats a trellis of unit charts. Rendering a single chart."
};
function choosePanelRenderer(split2, hostConfig, userOpts, canvasRegistered) {
  if (userOpts && userOpts.chart && userOpts.chart.renderer) return null;
  if (!canvasRegistered) return null;
  const shim = {
    config: {
      series: split2.panels.reduce(
        (acc, p) => acc.concat(p.series),
        []
      ),
      chart: { type: hostConfig.chart.type },
      markers: hostConfig.markers,
      dataLabels: hostConfig.dataLabels,
      fill: hostConfig.fill,
      plotOptions: hostConfig.plotOptions,
      states: hostConfig.states
    }
  };
  if (hasCanvasUnsupportedFeature(shim)) return null;
  const threshold = hostConfig.chart.rendererThreshold || 8e3;
  return computeMarkCount(shim) >= threshold ? "canvas" : null;
}
function scopeAnnotations(annotations, key) {
  if (!annotations || typeof annotations !== "object") return annotations;
  const out = __spreadValues({}, annotations);
  for (const kind of ["yaxis", "xaxis", "points", "texts", "images"]) {
    const list = out[kind];
    if (!Array.isArray(list)) continue;
    out[kind] = list.filter((item) => {
      if (!item || item.scope === void 0 || item.scope === null) {
        return true;
      }
      if (item.scope === "trellis") return true;
      if (Array.isArray(item.scope)) {
        return item.scope.map(String).indexOf(key) !== -1;
      }
      return String(item.scope) === key;
    }).map((item) => {
      if (!item || item.scope === void 0) return item;
      const copy = __spreadValues({}, item);
      delete copy.scope;
      return copy;
    });
  }
  return out;
}
class Trellis {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.panels = [];
    this._stripEls = [];
    this.split = null;
    this.scales = null;
    this.layout = null;
    this.cfg = {};
    this.sync = new TrellisSync(this);
    this.chrome = new TrellisChrome(this);
    this.virtual = new TrellisVirtual(this);
    this.exports = new TrellisExports(this);
    this.gridTooltip = null;
    this._promotedKey = null;
    this._ApexCharts = ApexCharts__default;
    this._virtualActive = false;
    this._panelRenderer = null;
    this._yLabelDecimals = 0;
    this.elWrap = null;
    this.elGrid = null;
    this._mounted = false;
    this._rendering = false;
    this._renderPromise = null;
    this._raf = 0;
    this._lastWidth = 0;
    this._lastHeight = 0;
    this._chromeH = 0;
    this._overflowWarned = false;
    this._resizeHandler = this._onContainerResize.bind(this);
    this.autoScaleYaxis = false;
    this._elChromeTop = null;
    this._vetoWarned = false;
    this._noKeyWarned = false;
    this._frames = null;
  }
  /** Whether this chart is a trellis host: `by` (1-D) or `row`/`column`
   *  (2-D, P4) is the switch. A vetoed chart type (P5) returns false, which
   *  makes EVERY host seam (render delegation, update branches, exports,
   *  promotion) fall back to the single-chart pipeline at once. */
  isActive() {
    var _a;
    const t2 = this.w.config.trellis;
    if (!(t2 && (t2.by || t2.row || t2.column))) return false;
    const type = (_a = this.w.config.chart) == null ? void 0 : _a.type;
    if (type && TYPE_VETO[type]) {
      if (!this._vetoWarned) {
        this._vetoWarned = true;
        console.warn(`ApexCharts: ${TYPE_VETO[type]}`);
      }
      return false;
    }
    if (t2.by && !t2.row && !t2.column && !Array.isArray(t2.data)) {
      const list = this.w.config.series || [];
      const anyKeyed = list.some(
        (s2, i2) => keyOf(s2, i2, t2.by) !== null
      );
      if (!anyKeyed) {
        if (!this._noKeyWarned) {
          this._noKeyWarned = true;
          const named = typeof t2.by === "function" ? "the `trellis.by` function returned no key for any series" : `no series carries the \`trellis.by\` key '${t2.by}'`;
          console.warn(
            `ApexCharts: ${named}; there is nothing to split. Rendering as a single chart.`
          );
        }
        return false;
      }
    }
    return true;
  }
  /** The layout-facing config: a 2-D grid has a FIXED column count (one per
   *  column key; responsive recolumning would break the row/column
   *  semantics), so panels shrink instead of wrapping. */
  _layoutCfg() {
    if (this.split && this.split.mode === "2d" && this.split.colKeys) {
      return __spreadProps(__spreadValues({}, this.cfg), { columns: this.split.colKeys.length });
    }
    return this.cfg;
  }
  /**
   * The stacking facts the shared-scale resolver needs. A stacked panel is as
   * tall as its tallest PILE, so the shared y domain has to come from the
   * stack totals; without this every panel got a domain sized by the largest
   * single value and the taller stacks drew straight off the top of the plot.
   * `parts` says highlight-filter parts reach the axis as well: the feature
   * is loaded and extends the axis for a type it draws parts on, so a part
   * past its whole is not clipped by the shared bound.
   * @returns {{ stacked: boolean, stackType: string|undefined, stackOnlyBar: boolean, parts: boolean }}
   */
  _stackingHost() {
    var _a, _b;
    const cnf = this.w.config;
    const chart = cnf.chart || {};
    const hf = (
      /** @type {any} */
      cnf.highlightFilter || {}
    );
    return {
      stacked: !!chart.stacked,
      stackType: chart.stackType,
      stackOnlyBar: !!chart.stackOnlyBar,
      parts: !!InitCtxVariables._featureRegistry.get("highlightFilter") && hf.enabled !== false && hf.axis !== "clamp" && ["bar", "line", "area"].includes(chart.type) && !((_b = (_a = cnf.plotOptions) == null ? void 0 : _a.bar) == null ? void 0 : _b.isFunnel)
    };
  }
  /**
   * The EFFECTIVE y scale mode: the user's, unless a type frame (P5) forced
   * 'shared' because group modes are meaningless for the chart type.
   * @returns {string}
   */
  _yMode() {
    var _a;
    if (this._frames && this._frames.forceSharedY) return "shared";
    return ((_a = this.cfg.scales) == null ? void 0 : _a.y) || "shared";
  }
  /**
   * The y bounds one panel should carry, per the scales mode: the shared
   * union, its row's union ('independent-row'), its column's union
   * ('independent-column'), or none ('independent'). Types whose y axis does
   * not carry the data values (heatmap rows, the radial family) never get a
   * yaxis push at all (P5): the frame's own channel is the shared one.
   * @param {import('./TrellisSplit').TrellisSlice} slice
   * @returns {{ min: number, max: number, tickAmount: number } | null}
   */
  _yBoundsFor(slice) {
    var _a, _b;
    const scales = this.scales;
    if (!scales) return null;
    if (this._frames && this._frames.skipYaxisPush) return null;
    const yMode = this._yMode();
    if (yMode === "shared") return scales.y;
    if (yMode === "independent-row" && scales.rowY) {
      return scales.rowY.get((_a = slice.rowKey) != null ? _a : "") || null;
    }
    if (yMode === "independent-column" && scales.colY) {
      return scales.colY.get((_b = slice.colKey) != null ? _b : "") || null;
    }
    return null;
  }
  /**
   * Horizontal bars measure along x, and the library reads that value axis
   * from `xaxis` (Scales.setYScaleForIndex switches on `isBarHorizontal`),
   * so the shared bounds have to be pushed THERE as well: `yaxis` alone
   * seeds the domain but the panel then re-nices it from its own data, which
   * silently discards the trellis's tick target.
   *
   * rangeBar is excluded on purpose: its horizontal value axis carries dates,
   * and a nice-number domain is meaningless on a timeline.
   * @returns {boolean}
   */
  _valueAxisIsX() {
    var _a, _b;
    const cnf = this.w.config;
    return ["bar", "boxPlot", "violin"].includes(cnf.chart.type) && !!((_b = (_a = cnf.plotOptions) == null ? void 0 : _a.bar) == null ? void 0 : _b.horizontal);
  }
  /**
   * The value-axis patch for a horizontal panel. An explicit user
   * `xaxis.tickAmount` wins: the count is theirs to set, and the panels
   * still agree because they all re-nice from the SAME pushed bounds.
   * @param {{ min: number, max: number, tickAmount: number }} bounds
   * @returns {Record<string, any>}
   */
  _valueAxisXPatch(bounds) {
    var _a, _b;
    const patch = { min: bounds.min, max: bounds.max };
    if (typeof ((_b = (_a = this.ctx.opts) == null ? void 0 : _a.xaxis) == null ? void 0 : _b.tickAmount) !== "number") {
      patch.tickAmount = bounds.tickAmount;
    }
    return patch;
  }
  /** @returns {string} namespaced panel group id */
  _groupId() {
    return `${this.w.globals.chartID}-tg`;
  }
  /**
   * Fire a trellis event through BOTH channels, the way every other chart
   * event reaches its caller: the `chart.events.<name>` config callback and
   * the `addEventListener` registry. `Events.fireEvent` only walks the
   * registry, so the four trellis events used to be invisible to anyone who
   * wired them up the ordinary way, in `chart.events`.
   *
   * Argument order matches what the registry has always been handed
   * (`ctx` first, then the payload), so existing listeners are unaffected.
   *
   * @param {string} name
   * @param {Record<string, any>} payload
   */
  _fire(name, payload) {
    var _a, _b;
    const cb = (_b = (_a = this.w.config.chart) == null ? void 0 : _a.events) == null ? void 0 : _b[name];
    if (typeof cb === "function") cb(this.ctx, payload);
    this.ctx.events.fireEvent(name, [this.ctx, payload]);
  }
  /**
   * Render the whole trellis into the host element. Called by the host's
   * render() INSTEAD of the normal create()/mount() pipeline.
   *
   * The returned promise is also kept as `_renderPromise` so the host's
   * update seams can WAIT for an in-flight mount instead of racing it (an
   * update that arrived mid-mount used to fall through to the single-chart
   * pipeline and draw a stray plain chart beside the grid).
   *
   * @returns {Promise<void>}
   */
  render() {
    const p = this._render();
    this._renderPromise = p;
    return p;
  }
  /**
   * Resolves when nothing is mounting. Safe to call at any time: it is the
   * in-flight render's own promise, or an already-resolved one.
   * @returns {Promise<void>}
   */
  whenSettled() {
    return this._rendering && this._renderPromise ? this._renderPromise.catch(() => {
    }) : Promise.resolve();
  }
  /** @returns {Promise<void>} */
  _render() {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const w = this.w;
      if (this._mounted || this._rendering) return;
      if (!Environment.isBrowser()) {
        console.warn(
          "ApexCharts: trellis rendering is browser-only in this version; SSR hosts render nothing."
        );
        return;
      }
      this._rendering = true;
      try {
        this.cfg = w.config.trellis || {};
        this.autoScaleYaxis = !!((_b = (_a = w.config.chart) == null ? void 0 : _a.zoom) == null ? void 0 : _b.autoScaleYaxis);
        let inputSeries = w.config.series || [];
        if (Array.isArray(this.cfg.data)) {
          const pivoted = pivotRows(this.cfg.data, this.cfg);
          pivoted.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`));
          if (pivoted.series.length) {
            if (inputSeries.length) {
              console.warn(
                "ApexCharts: trellis received both `series` and `trellis.data`; using trellis.data."
              );
            }
            inputSeries = pivoted.series;
          }
        }
        const split$1 = split(inputSeries, this.cfg, {
          chartType: w.config.chart.type
        });
        this.split = split$1;
        split$1.warnings.forEach((msg) => console.warn(`ApexCharts: ${msg}`));
        if (!split$1.panels.length) return;
        if (split$1.dropped > 0) {
          console.warn(
            `ApexCharts: trellis rendered ${split$1.panels.length} panels; ${split$1.dropped} more hidden by trellis.limit.`
          );
        }
        const vMode = (_c = this.cfg.virtualize) != null ? _c : "auto";
        let useVirtual = vMode === true || vMode === "auto" && split$1.panels.length > EAGER_PANEL_BUDGET;
        if (useVirtual && !TrellisVirtual.supported()) {
          console.warn(
            "ApexCharts: trellis virtualization needs IntersectionObserver; rendering eagerly."
          );
          useVirtual = false;
        }
        this._virtualActive = useVirtual;
        if (!useVirtual && split$1.panels.length > EAGER_PANEL_BUDGET) {
          console.warn(
            `ApexCharts: trellis with ${split$1.panels.length} panels renders eagerly; set trellis.virtualize (or trellis.limit).`
          );
        }
        if (split$1.panels.length > HARD_PANEL_WARN) {
          console.warn(
            `ApexCharts: ${split$1.panels.length} trellis panels is a lot to read at once; consider trellis.limit.`
          );
        }
        const frameType = w.config.chart.requestedType === "histogram" ? "histogram" : w.config.chart.type;
        this._frames = buildTypeFrames(split$1, this.cfg, w.config, frameType);
        this._frames.warnings.forEach(
          (msg) => console.warn(`ApexCharts: ${msg}`)
        );
        this._yLabelDecimals = this._frames.yExtentOverride ? 0 : maxYDecimals(split$1.panels);
        const scalesCfg = this._yMode() !== (((_d = this.cfg.scales) == null ? void 0 : _d.y) || "shared") ? __spreadProps(__spreadValues({}, this.cfg), { scales: __spreadProps(__spreadValues({}, this.cfg.scales || {}), { y: this._yMode() }) }) : this.cfg;
        this.scales = resolve(split$1, scalesCfg, __spreadValues({
          chartType: w.config.chart.type,
          userColors: this.ctx.opts && this.ctx.opts.colors,
          yExtentOverride: this._frames.yExtentOverride
        }, this._stackingHost()));
        this._panelRenderer = choosePanelRenderer(
          split$1,
          w.config,
          this.ctx.opts,
          RendererController._rendererRegistry.has("canvas")
        );
        this._buildSkeleton();
        const width = this._containerWidth();
        this._lastWidth = width;
        this._lastHeight = this._hostHeight() || 0;
        this._chromeH = 0;
        this.layout = compute({
          panelCount: split$1.panels.length,
          containerWidth: width,
          cfg: this._layoutCfg(),
          hostHeight: this._hostHeight(),
          chromeHeight: this._chromeH
        });
        this._applyGridStyle();
        this._buildCells();
        const independentY = this._yMode() !== "shared";
        const wrap = (
          /** @type {HTMLElement} */
          this.elWrap
        );
        if (useVirtual) {
          this.virtual.start();
        } else {
          if (independentY) wrap.style.visibility = "hidden";
          for (let i2 = 0; i2 < this.panels.length; i2++) {
            const panel = this.panels[i2];
            if (panel.noMount) continue;
            const opts = this._assemblePanelOptions(panel.index);
            const chart = new ApexCharts__default(
              /** @type {HTMLElement} */
              panel.el,
              opts
            );
            panel.chart = chart;
            yield chart.render();
            this._fire("panelMounted", {
              key: panel.key,
              index: panel.index,
              chart
            });
          }
          if (independentY) {
            yield this._alignGutters();
            wrap.style.visibility = "";
          }
        }
        this.chrome.buildTitle(
          /** @type {HTMLElement} */
          this._elChromeTop
        );
        this.chrome.buildToolbar(wrap);
        this.chrome.buildLegend(wrap);
        this.sync.wireCrosshairs(
          /** @type {HTMLElement} */
          this.elGrid
        );
        if ((this.cfg.tooltip || "panel") === "grid") {
          this.gridTooltip = new TrellisTooltip(this);
          this.gridTooltip.wire(
            /** @type {HTMLElement} */
            this.elGrid,
            wrap
          );
        }
        this._mounted = true;
        this._refitForChrome();
        addResizeListener(
          /** @type {HTMLElement} */
          this.ctx.el,
          this._resizeHandler
        );
        if (!useVirtual) w.globals.animationEnded = true;
        this._fire("trellisMounted", { panels: this.getPanels() });
      } finally {
        this._rendering = false;
      }
    });
  }
  /** Container width the grid may use. */
  _containerWidth() {
    const el = (
      /** @type {HTMLElement} */
      this.ctx.el
    );
    const rect = el.getBoundingClientRect();
    return rect.width || el.clientWidth || 800;
  }
  /**
   * The height the trellis has to lay out in, in px, or undefined when the
   * host has not asked for one (then the grid sizes itself by aspect ratio).
   *
   * A PERCENTAGE height is a percentage of the container's parent, the same
   * contract `Core.setSVGDimensions` gives a standalone chart. Running it
   * through a bare `parseFloat` instead read `'100%'` as 100 PIXELS, so a
   * full-height trellis laid itself out for a 100px box and every panel came
   * out at the minimum-height floor.
   *
   * @returns {number|undefined}
   */
  _hostHeight() {
    var _a;
    const h = this.w.config.chart && this.w.config.chart.height;
    if (h === void 0 || h === null || h === "" || h === "auto") {
      return void 0;
    }
    const str = String(h).trim();
    if (str.endsWith("%")) {
      const pct = parseFloat(str);
      if (!isFinite(pct) || pct <= 0) return void 0;
      const parent = (
        /** @type {any} */
        (_a = this.ctx.el) == null ? void 0 : _a.parentNode
      );
      if (!parent || typeof parent.getBoundingClientRect !== "function") {
        return void 0;
      }
      const box = parent.getBoundingClientRect().height || parent.clientHeight;
      const resolved = (box || 0) * pct / 100;
      return resolved > 0 ? resolved : void 0;
    }
    const n2 = parseFloat(str);
    return isFinite(n2) && n2 > 0 ? n2 : void 0;
  }
  /**
   * Height taken by the shared chrome — the title above, the toolbar band, the
   * legend below — i.e. everything inside the wrapper that is not the grid.
   * Measured rather than modelled: the pieces are optional, wrap at narrow
   * widths, and a heatmap's gradient legend is a different height again.
   *
   * Zero before the chrome exists (the first layout runs before it is built);
   * `_refitForChrome` runs one more layout once it does.
   *
   * @returns {number}
   */
  _chromeHeight() {
    const wrap = this.elWrap;
    const grid = this.elGrid;
    if (!wrap || !grid || typeof wrap.getBoundingClientRect !== "function") {
      return 0;
    }
    const h = wrap.getBoundingClientRect().height - grid.getBoundingClientRect().height;
    return isFinite(h) && h > 0 ? h : 0;
  }
  _buildSkeleton() {
    var _a;
    const el = (
      /** @type {HTMLElement} */
      this.ctx.el
    );
    const wrap = BrowserAPIs.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "div"
    );
    wrap.className = "apexcharts-trellis";
    if (this.split && this.split.mode === "2d") {
      wrap.classList.add("apexcharts-trellis-2d");
    }
    wrap.id = `apexcharts-trellis${this.w.globals.chartID}`;
    wrap.setAttribute("data-tooltip-mode", this.cfg.tooltip || "panel");
    const foreColor = (_a = this.w.config.chart) == null ? void 0 : _a.foreColor;
    if (foreColor) wrap.style.setProperty("--apx-trellis-fore", foreColor);
    const chromeTop = BrowserAPIs.createElement("div");
    chromeTop.className = "apexcharts-trellis-chrome";
    wrap.appendChild(chromeTop);
    this._elChromeTop = chromeTop;
    const grid = BrowserAPIs.createElement("div");
    grid.className = "apexcharts-trellis-grid";
    wrap.appendChild(grid);
    el.appendChild(wrap);
    this.elWrap = wrap;
    this.elGrid = grid;
    this.w.dom.baseEl = el;
    this.w.dom.elWrap = wrap;
  }
  _applyGridStyle() {
    var _a;
    const grid = (
      /** @type {HTMLElement} */
      this.elGrid
    );
    const ly = (
      /** @type {import('./TrellisLayout').TrellisLayoutResult} */
      this.layout
    );
    grid.style.display = "grid";
    const is2d = this.split && this.split.mode === "2d";
    const stripped = is2d && ((_a = this.cfg.header) == null ? void 0 : _a.show) !== false;
    grid.style.gridTemplateColumns = stripped ? `auto repeat(${ly.cols}, minmax(0, 1fr))` : `repeat(${ly.cols}, minmax(0, 1fr))`;
    grid.style.gap = `${ly.gap}px`;
  }
  _buildCells() {
    var _a;
    const grid = (
      /** @type {HTMLElement} */
      this.elGrid
    );
    const split2 = (
      /** @type {import('./TrellisSplit').TrellisSplitResult} */
      this.split
    );
    const ly = (
      /** @type {import('./TrellisLayout').TrellisLayoutResult} */
      this.layout
    );
    const is2d = split2.mode === "2d";
    const stripped = is2d && ((_a = this.cfg.header) == null ? void 0 : _a.show) !== false;
    this._stripEls = [];
    const emptyMode = this.cfg.emptyPanels || "placeholder";
    if (stripped) {
      const corner = BrowserAPIs.createElement("div");
      corner.className = "apexcharts-trellis-corner";
      grid.appendChild(corner);
      this._stripEls.push(corner);
      (split2.colKeys || []).forEach((ck, ci) => {
        const el = this.chrome.stripEl("column", ck, {
          index: ci,
          count: (split2.colKeys || []).length
        });
        grid.appendChild(el);
        this._stripEls.push(el);
      });
    }
    this.panels = [];
    split2.panels.forEach((slice, i2) => {
      var _a2;
      if (stripped && i2 % ly.cols === 0) {
        const ri = Math.floor(i2 / ly.cols);
        const el = this.chrome.stripEl(
          "row",
          (_a2 = (split2.rowKeys || [])[ri]) != null ? _a2 : "",
          { index: ri, count: (split2.rowKeys || []).length }
        );
        grid.appendChild(el);
        this._stripEls.push(el);
      }
      const cell = BrowserAPIs.createElement("div");
      cell.className = "apexcharts-trellis-cell";
      cell.setAttribute("data-key", slice.key);
      this._applyCellMutes(cell, ly.cells[i2]);
      if (!is2d) {
        this.chrome.buildHeader(cell, slice.key, {
          index: i2,
          count: split2.panels.length
        });
      }
      const mount = BrowserAPIs.createElement("div");
      mount.className = "apexcharts-trellis-panel";
      if (this._virtualActive) {
        mount.classList.add("apexcharts-trellis-skeleton");
        mount.style.minHeight = `${ly.panelH}px`;
      }
      cell.appendChild(mount);
      const noMount = slice.empty && emptyMode !== "placeholder";
      if (slice.empty) {
        cell.classList.add("apexcharts-trellis-cell-empty");
        if (emptyMode === "hide") {
          cell.classList.add("apexcharts-trellis-cell-hidden");
        } else if (emptyMode === "skip") {
          mount.classList.add("apexcharts-trellis-skeleton");
          mount.style.minHeight = `${ly.panelH}px`;
        } else {
          const label2 = BrowserAPIs.createElement("div");
          label2.className = "apexcharts-trellis-empty-label";
          label2.textContent = this.w.config.noData && this.w.config.noData.text || "no data";
          cell.appendChild(label2);
        }
      }
      grid.appendChild(cell);
      this.panels.push({
        key: slice.key,
        index: i2,
        el: mount,
        cellEl: cell,
        chart: null,
        empty: slice.empty,
        noMount
      });
    });
  }
  /**
   * Edge-label policy as CSS classes: a muted cell hides its labels' INK
   * (opacity), never their SPACE, so every panel keeps the identical plot
   * rectangle and a policy flip on resize re-renders nothing (22a).
   * @param {HTMLElement} cell
   * @param {import('./TrellisLayout').TrellisCell} c
   */
  _applyCellMutes(cell, c) {
    cell.classList.toggle("apexcharts-trellis-mute-x", !c.showXLabels);
    cell.classList.toggle("apexcharts-trellis-mute-y", !c.showYLabels);
  }
  /**
   * Build one panel's full options object: the user's own options (functions
   * preserved by reference), minus what the trellis owns, plus the shared
   * scale/color/geometry overrides. `trellis.panel(key, meta)` is applied
   * last, so a caller can override anything per panel.
   * @param {number} i
   * @param {{ noAnimation?: boolean }} [flags] noAnimation forces animations
   *   off regardless of policy (virtualized REMOUNTS: scrolling back must not
   *   replay the draw animation).
   * @returns {Record<string, any>}
   */
  _assemblePanelOptions(i2, { noAnimation = false } = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n;
    const w = this.w;
    const split2 = (
      /** @type {import('./TrellisSplit').TrellisSplitResult} */
      this.split
    );
    const scales = (
      /** @type {ReturnType<typeof TrellisScales.resolve>} */
      this.scales
    );
    const ly = (
      /** @type {import('./TrellisLayout').TrellisLayoutResult} */
      this.layout
    );
    const slice = split2.panels[i2];
    const base = Utils.clone(this.ctx.opts || {});
    delete base.trellis;
    delete base.series;
    delete base.responsive;
    if (base.annotations) {
      base.annotations = scopeAnnotations(base.annotations, slice.key);
    }
    const userChart = base.chart || {};
    const userEvents = userChart.events || {};
    const hostId = w.globals.chartID;
    const userAnimations = (_c = (_b = (_a = this.ctx.opts) == null ? void 0 : _a.chart) == null ? void 0 : _b.animations) == null ? void 0 : _c.enabled;
    const animationsOff = noAnimation || split2.panels.length > ANIMATION_PANEL_BUDGET && userAnimations === void 0;
    const isPlaceholder = slice.empty && (this.cfg.emptyPanels || "placeholder") === "placeholder";
    let panelSeries = isPlaceholder ? [placeholderSeries(split2, { chartType: w.config.chart.type })] : slice.series;
    const isValueSeries = ["pie", "donut", "polarArea", "radialBar"].includes(
      w.config.chart.type
    );
    if (isValueSeries) {
      panelSeries = panelSeries.flatMap(
        (s2) => Array.isArray(s2.data) ? s2.data : []
      ).map(
        (v) => typeof v === "number" && isFinite(v) ? v : 0
      );
    }
    const overrides = __spreadValues(__spreadValues(__spreadProps(__spreadValues({
      chart: __spreadProps(__spreadValues(__spreadValues({
        id: `${hostId}-tp${i2}`,
        // Group membership is unconditional: it powers tooltip and crosshair
        // sync, not only zoom. zoom:'none' disables the zoom TOOL below.
        group: this._groupId(),
        height: ly.panelH,
        width: "100%",
        // The trellis's single ResizeObserver is the only relayout owner
        // (22a Q4); a panel must never self-rerender on a resize tick. Printing
        // is the same rule: a panel re-laying itself out to a printable width
        // would tear the grid apart, since its position and size are the
        // orchestrator's to decide.
        redrawOnParentResize: false,
        redrawOnWindowResize: false,
        print: { enabled: false },
        // Core pads the chart's container by parentHeightOffset (default 15)
        // via an inline min-height; inside a height-budgeted grid cell that
        // slack de-syncs mounted cells from the skeleton reserve (the grid
        // gap is the breathing room here).
        parentHeightOffset: 0,
        toolbar: { show: false },
        zoom: {
          enabled: this.cfg.zoom !== "none"
        }
      }, animationsOff ? { animations: { enabled: false } } : {}), this._panelRenderer ? { renderer: this._panelRenderer } : {}), {
        events: __spreadProps(__spreadValues({}, userEvents), {
          zoomed: this.sync.makeZoomedHandler(userEvents.zoomed),
          scrolled: this.sync.makeScrolledHandler(userEvents.scrolled)
        })
      }),
      series: panelSeries
    }, isValueSeries ? {} : {
      colors: panelSeries.map(
        (s2) => scales.colorOf(s2.name)
      )
    }), {
      // Headers replace per-panel titles; the shared legend replaces per-panel
      // legends. margin: 0 and floating both matter: an empty-string title
      // still charges its margin to the top gutter in Dimensions, and its
      // empty element still measures height + 5 unless floating.
      title: { text: "", margin: 0, floating: true },
      subtitle: { text: "", margin: 0, floating: true },
      legend: { show: false }
    }), isPlaceholder ? { tooltip: { enabled: false } } : {}), ly.panelH < COMPACT_TOOLTIP_PANEL_H && this.cfg.tooltip !== "grid" && typeof ((_e = (_d = this.ctx.opts) == null ? void 0 : _d.tooltip) == null ? void 0 : _e.compact) !== "boolean" ? { tooltip: { compact: true } } : {});
    const gridlessTypes = ["pie", "donut", "polarArea", "radialBar", "radar", "treemap"];
    if (!((_f = userChart.sparkline) == null ? void 0 : _f.enabled) && !gridlessTypes.includes(w.config.chart.type)) {
      const userPad = base.grid && base.grid.padding || {};
      const reclaimBottom = ((_h = (_g = this.ctx.opts) == null ? void 0 : _g.xaxis) == null ? void 0 : _h.type) === "datetime" ? PANEL_PAD_RECLAIM_BOTTOM_DATETIME : PANEL_PAD_RECLAIM_BOTTOM;
      overrides.grid = {
        padding: {
          top: (typeof userPad.top === "number" ? userPad.top : 0) - PANEL_PAD_RECLAIM_TOP,
          bottom: (typeof userPad.bottom === "number" ? userPad.bottom : 0) - reclaimBottom
        }
      };
    }
    const valueAxisIsX = this._valueAxisIsX();
    if (scales.x && !valueAxisIsX) {
      overrides.xaxis = { min: scales.x.min, max: scales.x.max };
    }
    const yBounds = this._yBoundsFor(slice);
    if (yBounds) {
      const userYaxisRaw = Array.isArray((_i = this.ctx.opts) == null ? void 0 : _i.yaxis) ? this.ctx.opts.yaxis[0] : (_j = this.ctx.opts) == null ? void 0 : _j.yaxis;
      const userYaxis = Array.isArray(base.yaxis) ? base.yaxis[0] : base.yaxis;
      let labelsPatch = {};
      if (typeof ((_k = userYaxisRaw == null ? void 0 : userYaxisRaw.labels) == null ? void 0 : _k.formatter) !== "function") {
        const step = (yBounds.max - yBounds.min) / Math.max(1, yBounds.tickAmount);
        const digits = Math.max(
          this._yLabelDecimals,
          decimalCount(step)
        );
        labelsPatch = {
          labels: {
            formatter: (val) => typeof val === "number" && isFinite(val) ? val.toFixed(digits) : val
          }
        };
      }
      overrides.yaxis = Utils.extend(userYaxis || {}, __spreadValues({
        min: yBounds.min,
        max: yBounds.max,
        tickAmount: yBounds.tickAmount
      }, labelsPatch));
      delete base.yaxis;
      if (valueAxisIsX) {
        overrides.xaxis = Utils.extend(
          overrides.xaxis || {},
          this._valueAxisXPatch(yBounds)
        );
      }
    }
    const frames = this._frames;
    if (frames && frames.plotOptions) {
      overrides.plotOptions = Utils.clone(frames.plotOptions);
    }
    if (frames && frames.pieScaleOf) {
      const ratio = frames.pieScaleOf(slice.key);
      if (ratio !== null) {
        const userScale = (_n = (_m = (_l = this.ctx.opts) == null ? void 0 : _l.plotOptions) == null ? void 0 : _m.pie) == null ? void 0 : _n.customScale;
        overrides.plotOptions = Utils.extend(overrides.plotOptions || {}, {
          pie: {
            customScale: ratio * (typeof userScale === "number" ? userScale : 1)
          }
        });
      }
    }
    let opts = Utils.extend(base, overrides);
    if (typeof this.cfg.panel === "function") {
      const extra = this.cfg.panel(slice.key, { index: i2, seriesNames: slice.seriesNames });
      if (extra && typeof extra === "object") opts = Utils.extend(opts, extra);
    }
    return opts;
  }
  /**
   * Independent-y gutter alignment (22a Q2): measure every panel's label
   * gutter, push the max as a shared `yaxis.labels.minWidth`. `max()` of the
   * measured widths makes the panels' `max(minWidth, measured)` resolve to
   * the same constant everywhere, so one iteration is exact by construction.
   * @returns {Promise<void>}
   */
  _alignGutters() {
    return __async(this, null, function* () {
      var _a, _b, _c, _d;
      const widths = this.panels.map((p) => {
        var _a2, _b2, _c2, _d2, _e;
        return (_e = (_d2 = (_c2 = (_b2 = (_a2 = p.chart) == null ? void 0 : _a2.w) == null ? void 0 : _b2.globals) == null ? void 0 : _c2.yLabelsCoords) == null ? void 0 : _d2[0]) == null ? void 0 : _e.width;
      }).filter((v) => typeof v === "number" && isFinite(v));
      if (!widths.length) return;
      const isHorizontal = !!((_d = (_c = (_b = (_a = this.panels[0]) == null ? void 0 : _a.chart) == null ? void 0 : _b.w) == null ? void 0 : _c.globals) == null ? void 0 : _d.isBarHorizontal);
      const labelPad = isHorizontal ? 0 : Y_LABEL_PAD;
      const minWidth = Math.max(0, Math.max(...widths) - labelPad);
      yield this._pushGutterFloor(minWidth);
    });
  }
  /** The vertical-axis label pad inside the yLabelsCoords width (22a Q2). */
  _yLabelPad() {
    return Y_LABEL_PAD;
  }
  /**
   * Push one shared gutter floor (`yaxis.labels.minWidth`) to every MOUNTED
   * panel. Shared by the eager one-pass alignment and the virtualized
   * monotone floor (TrellisVirtual bumps it when a newly mounted panel
   * measures wider).
   * @param {number} minWidth
   * @returns {Promise<void>}
   */
  _pushGutterFloor(minWidth) {
    return __async(this, null, function* () {
      for (const p of this.panels) {
        if (!p.chart) continue;
        yield p.chart.updateOptions(
          { yaxis: yaxisPayload(p.chart, { labels: { minWidth } }) },
          false,
          false,
          false
        ).catch(() => {
        });
      }
    });
  }
  /**
   * Re-run the layout now that the shared chrome is measurable, so the panels
   * get the host height MINUS the title / toolbar / legend rather than all of
   * it. Only matters when the host gave a height at all — an aspect-ratio grid
   * is sized by its width and grows downward as much as it likes.
   */
  _refitForChrome() {
    const hostH = this._hostHeight();
    if (!hostH) return;
    const chromeH = this._chromeHeight();
    if (chromeH <= 0 || Math.round(chromeH) === Math.round(this._chromeH)) {
      this._warnIfOverflowing();
      return;
    }
    this._chromeH = chromeH;
    this._relayout(this._containerWidth());
  }
  /**
   * Say so, once, when the minimum-panel-height floor has made the grid taller
   * than the box it was given. Silently overflowing is the thing that gets
   * reported as a bug; the floor itself is deliberate (panels below it are
   * unreadable), so the useful answer is which knob to turn.
   */
  _warnIfOverflowing() {
    const ly = this.layout;
    if (!ly || !ly.overflowH || this._overflowWarned) return;
    this._overflowWarned = true;
    console.warn(
      `ApexCharts: trellis needs ${Math.round(ly.gridH + this._chromeH)}px but its container gives ${Math.round(this._hostHeight() || 0)}px; ${ly.rows} rows cannot go below the ${ly.panelH}px panel floor. Raise the container, use fewer panels (trellis.limit) or more columns (trellis.columns), or lower trellis.minPanelHeight.`
    );
  }
  /** rAF-coalesced container resize -> single trellis-owned relayout. */
  _onContainerResize() {
    if (!this._mounted) return;
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      const width = this._containerWidth();
      const height = this._hostHeight() || 0;
      if (Math.round(width) === Math.round(this._lastWidth) && Math.round(height) === Math.round(this._lastHeight)) {
        return;
      }
      this._lastWidth = width;
      this._lastHeight = height;
      if (this._promotedKey) {
        const p = this.panels.find((p2) => p2.key === this._promotedKey);
        if (p && p.chart) p.chart.updateOptions({}, false, false, false).catch(() => {
        });
        return;
      }
      this._relayout(width);
    });
  }
  /**
   * Panel promotion (P3): expand one panel to the grid's full width, park the
   * rest (their cells hide; virtualized ones unmount via the observer), and
   * show a breadcrumb to come back. Zoom/legend state is untouched: parked
   * eager panels stay alive, parked virtual panels stash and restore.
   * @param {string} key
   * @returns {Promise<void>}
   */
  promote(key) {
    return __async(this, null, function* () {
      var _a;
      const panel = this.panels.find((p) => p.key === String(key));
      if (!panel || panel.noMount || !this._mounted) return;
      if (this._promotedKey === panel.key) return;
      if (this._promotedKey) yield this.restorePromotion();
      this._promotedKey = panel.key;
      const ly = this.layout;
      const gridH = this.elGrid ? this.elGrid.getBoundingClientRect().height : 0;
      const promotedH = Math.round(
        Math.max(280, Math.min(560, gridH || (ly ? ly.panelH * 2.4 : 420)))
      );
      (_a = this.elWrap) == null ? void 0 : _a.classList.add("apexcharts-trellis-promoting");
      this.panels.forEach((p) => {
        if (!p.cellEl) return;
        const promoted = p === panel;
        p.cellEl.classList.toggle("apexcharts-trellis-cell-promoted", promoted);
        p.cellEl.classList.toggle("apexcharts-trellis-cell-parked", !promoted);
      });
      this._stripEls.forEach(
        (el) => el.classList.add("apexcharts-trellis-cell-parked")
      );
      this.chrome.buildBreadcrumb(
        /** @type {HTMLElement} */
        this._elChromeTop,
        panel.key,
        () => this.restorePromotion()
      );
      if (!panel.chart && this._virtualActive) {
        panel.wantMounted = true;
        this.virtual._dirty.add(panel);
        this.virtual._schedule();
      }
      if (panel.el) panel.el.style.minHeight = `${promotedH}px`;
      if (panel.chart) {
        yield panel.chart.updateOptions({ chart: { height: promotedH } }, false, false, false).catch(() => {
        });
      }
      this._fire("panelPromoted", { key: panel.key, chart: panel.chart });
    });
  }
  /** Restore the grid from a promotion. @returns {Promise<void>} */
  restorePromotion() {
    return __async(this, null, function* () {
      var _a;
      if (!this._promotedKey) return;
      const panel = this.panels.find((p) => p.key === this._promotedKey);
      this._promotedKey = null;
      (_a = this.elWrap) == null ? void 0 : _a.classList.remove("apexcharts-trellis-promoting");
      this.panels.forEach((p) => {
        if (!p.cellEl) return;
        p.cellEl.classList.remove("apexcharts-trellis-cell-promoted");
        p.cellEl.classList.remove("apexcharts-trellis-cell-parked");
      });
      this._stripEls.forEach(
        (el) => el.classList.remove("apexcharts-trellis-cell-parked")
      );
      this.chrome.removeBreadcrumb();
      const ly = this.layout;
      if (panel && panel.el && ly) panel.el.style.minHeight = `${ly.panelH}px`;
      if (panel && panel.chart && ly) {
        yield panel.chart.updateOptions({ chart: { height: ly.panelH } }, false, false, false).catch(() => {
        });
      }
      this._lastWidth = 0;
      this._relayout(this._containerWidth());
      this._lastWidth = this._containerWidth();
      this._fire("panelRestored", { key: panel ? panel.key : null });
    });
  }
  /**
   * Recompute the grid for a new width. A changed column count re-derives the
   * edge policy (which panels sit on the bottom row changed) by toggling cell
   * classes; panel geometry updates are one non-fanout updateOptions each.
   * @param {number} width
   */
  _relayout(width) {
    const split2 = this.split;
    if (!split2) return;
    const prevH = this.layout ? this.layout.panelH : 0;
    this.layout = compute({
      panelCount: split2.panels.length,
      containerWidth: width,
      cfg: this._layoutCfg(),
      hostHeight: this._hostHeight(),
      chromeHeight: this._chromeH
    });
    this._applyGridStyle();
    this._warnIfOverflowing();
    const ly = this.layout;
    this.panels.forEach((p, i2) => {
      if (p.cellEl) this._applyCellMutes(p.cellEl, ly.cells[i2]);
      if (p.el && this._virtualActive) p.el.style.minHeight = `${ly.panelH}px`;
      if (!p.chart) return;
      const payload = ly.panelH !== prevH ? { chart: { height: ly.panelH } } : {};
      p.chart.updateOptions(payload, false, false, false).catch(() => {
      });
    });
    if (this._virtualActive) this.virtual.refresh();
  }
  /**
   * Can this option change reach the panels without rebuilding the grid?
   *
   * Every top-level key has to be one that only affects how a panel paints
   * (`PANEL_ONLY_OPTIONS`), and the grid has to be in its ordinary state: a
   * promoted panel carries a height the shared layout does not know about, so
   * re-pushing the layout's height would silently un-promote it.
   *
   * @param {Record<string, any>|undefined} options
   * @returns {boolean}
   */
  canApplyInPlace(options) {
    if (!this._mounted || this._promotedKey) return false;
    if (!options || typeof options !== "object") return false;
    const keys = Object.keys(options);
    if (!keys.length) return false;
    return keys.every((k2) => PANEL_ONLY_OPTIONS.includes(k2));
  }
  /**
   * Re-derive each live panel's options from the host's (already merged)
   * config and push them, leaving the grid, the panels and their state alone.
   *
   * Re-assembling rather than forwarding the caller's patch is deliberate: the
   * panel options are composed (scoped annotations, the shared colour map, the
   * compact-tooltip rule, the padding reclaim), and forwarding a raw patch
   * would drop whichever of those the patch happens to overlap.
   *
   * @param {boolean} [animate]
   * @returns {Promise<void>}
   */
  applyPanelOptions(animate = true) {
    return __async(this, null, function* () {
      var _a, _b, _c;
      const split2 = this.split;
      if (!split2) return;
      const scalesCfg = this._yMode() !== (((_a = this.cfg.scales) == null ? void 0 : _a.y) || "shared") ? __spreadProps(__spreadValues({}, this.cfg), { scales: __spreadProps(__spreadValues({}, this.cfg.scales || {}), { y: this._yMode() }) }) : this.cfg;
      this.scales = resolve(split2, scalesCfg, __spreadValues({
        chartType: this.w.config.chart.type,
        userColors: this.ctx.opts && this.ctx.opts.colors,
        yExtentOverride: this._frames ? this._frames.yExtentOverride : null
      }, this._stackingHost()));
      yield Promise.all(
        this.panels.map((p) => {
          if (!p.chart) return Promise.resolve();
          const opts = this._assemblePanelOptions(p.index);
          delete opts.series;
          if (opts.chart) delete opts.chart.height;
          return p.chart.updateOptions(opts, false, animate, false, false).catch(() => {
          });
        })
      );
      (_c = (_b = this.chrome).refreshLegendColors) == null ? void 0 : _c.call(_b);
    });
  }
  /**
   * Host updateSeries: re-split against the SAME panel key set and push each
   * panel its new slice (plus refreshed shared domains) in one update. A
   * changed key set (panels appearing/disappearing) is a structural change:
   * torn down and re-rendered.
   * @param {any[]} newSeries
   * @param {boolean} [animate]
   * @returns {Promise<any>}
   */
  updateSeries(newSeries, animate = true) {
    return __async(this, null, function* () {
      var _a;
      const w = this.w;
      if (Array.isArray(this.cfg.data) && this.cfg.data.length) {
        console.warn(
          "ApexCharts: this trellis renders from trellis.data; update it via updateOptions({ trellis: { data } })."
        );
        return Promise.resolve();
      }
      w.config.series = newSeries;
      if (this.ctx.opts) this.ctx.opts.series = newSeries;
      if (!this._mounted) return this.ctx.render();
      const nextSplit = split(newSeries || [], this.cfg, {
        chartType: w.config.chart.type
      });
      const sameKeys = nextSplit.panels.length === this.panels.length && nextSplit.panels.every((p, i2) => p.key === this.panels[i2].key);
      if (!sameKeys) {
        this.teardown();
        return this.ctx.render();
      }
      this.split = nextSplit;
      this._frames = buildTypeFrames(
        nextSplit,
        this.cfg,
        w.config,
        w.config.chart.requestedType === "histogram" ? "histogram" : w.config.chart.type
      );
      const scalesCfg = this._yMode() !== (((_a = this.cfg.scales) == null ? void 0 : _a.y) || "shared") ? __spreadProps(__spreadValues({}, this.cfg), { scales: __spreadProps(__spreadValues({}, this.cfg.scales || {}), { y: this._yMode() }) }) : this.cfg;
      this.scales = resolve(nextSplit, scalesCfg, __spreadValues({
        chartType: w.config.chart.type,
        userColors: this.ctx.opts && this.ctx.opts.colors,
        yExtentOverride: this._frames.yExtentOverride
      }, this._stackingHost()));
      const scales = this.scales;
      const frames = this._frames;
      const isValueSeries = ["pie", "donut", "polarArea", "radialBar"].includes(
        w.config.chart.type
      );
      const pushes = this.panels.map((p, i2) => {
        var _a2, _b, _c;
        if (!p.chart) return Promise.resolve();
        const payload = {
          // The radial value family takes a BARE values array (see the same
          // unwrap in _assemblePanelOptions).
          series: isValueSeries ? nextSplit.panels[i2].series.flatMap(
            (s2) => Array.isArray(s2.data) ? s2.data : []
          ).map(
            (v) => typeof v === "number" && isFinite(v) ? v : 0
          ) : nextSplit.panels[i2].series
        };
        const valueAxisIsX = this._valueAxisIsX();
        if (scales.x && !valueAxisIsX) {
          payload.xaxis = { min: scales.x.min, max: scales.x.max };
        }
        const yBounds = this._yBoundsFor(nextSplit.panels[i2]);
        if (yBounds) {
          payload.yaxis = yaxisPayload(p.chart, {
            min: yBounds.min,
            max: yBounds.max,
            tickAmount: yBounds.tickAmount
          });
          if (valueAxisIsX) {
            payload.xaxis = Utils.extend(
              payload.xaxis || {},
              this._valueAxisXPatch(yBounds)
            );
          }
        }
        if (frames.plotOptions) {
          payload.plotOptions = Utils.clone(frames.plotOptions);
        }
        if (frames.pieScaleOf) {
          const ratio = frames.pieScaleOf(nextSplit.panels[i2].key);
          if (ratio !== null) {
            const userScale = (_c = (_b = (_a2 = this.ctx.opts) == null ? void 0 : _a2.plotOptions) == null ? void 0 : _b.pie) == null ? void 0 : _c.customScale;
            payload.plotOptions = Utils.extend(payload.plotOptions || {}, {
              pie: {
                customScale: ratio * (typeof userScale === "number" ? userScale : 1)
              }
            });
          }
        }
        return p.chart.updateOptions(payload, false, animate, false).catch(() => {
        });
      });
      return Promise.all(pushes);
    });
  }
  /** @returns {Array<{ key: string, index: number, chart: any|null, el: HTMLElement|null }>} */
  getPanels() {
    return this.panels.map((p) => ({
      key: p.key,
      index: p.index,
      chart: p.chart,
      el: p.cellEl
    }));
  }
  /**
   * @param {string} key
   * @returns {any|null} the panel's ApexCharts instance
   */
  getPanel(key) {
    const p = this.panels.find((p2) => p2.key === String(key));
    return p ? p.chart : null;
  }
  /**
   * Destroy every panel (each unregisters itself from Apex._chartInstances),
   * disconnect the observers, and remove the trellis DOM.
   */
  teardown() {
    this.virtual.stop();
    this._virtualActive = false;
    this._panelRenderer = null;
    this._promotedKey = null;
    this._frames = null;
    this.chrome.destroyGradientLegend();
    if (this.gridTooltip) {
      this.gridTooltip.destroy();
      this.gridTooltip = null;
    }
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
    if (Environment.isBrowser() && this.ctx.el) {
      removeResizeListener(
        /** @type {Element} */
        this.ctx.el,
        this._resizeHandler
      );
    }
    this.panels.forEach((p) => {
      if (p.chart) {
        try {
          p.chart.destroy();
        } catch (e2) {
        }
      }
      p.chart = null;
    });
    this.panels = [];
    this._stripEls = [];
    if (this.elWrap && this.elWrap.parentNode) {
      this.elWrap.parentNode.removeChild(this.elWrap);
    }
    this.elWrap = null;
    this.elGrid = null;
    this._mounted = false;
    this.ctx._renderPromise = null;
  }
}
ApexCharts__default.registerFeatures({ trellis: Trellis });
class Measure {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.graphics = new Graphics(w);
    this.pins = [];
    this.drag = null;
    this.armed = false;
    this.persistent = false;
    this.pane = null;
    this._seedActive = false;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onSeedDown = this._onSeedDown.bind(this);
    this._onSeedKey = this._onSeedKey.bind(this);
    this._afterRender = this._afterRender.bind(this);
    ctx.addEventListener("mounted", this._afterRender);
    ctx.addEventListener("updated", this._afterRender);
    this._bindKeys();
  }
  _cfg() {
    return this.w.config.chart.measure || {};
  }
  _enabled() {
    return this.w.globals.axisCharts && this._cfg().enabled === true;
  }
  _mode() {
    return this._cfg().mode === "free" ? "free" : "span";
  }
  /**
   * Nearest first-series data point to a data x (used to snap span endpoints
   * onto the series line).
   * @param {number} dataX
   * @returns {{x:number,y:number}|null}
   */
  _snapToSeries(dataX) {
    const s0 = (
      /** @type {any} */
      (this.w.config.series || [])[0]
    );
    if (!s0) return null;
    const pts = this._points(s0.data || []);
    if (!pts.length) return null;
    let best = pts[0];
    let bd = Math.abs(pts[0].x - dataX);
    for (let i2 = 1; i2 < pts.length; i2++) {
      const d = Math.abs(pts[i2].x - dataX);
      if (d < bd) {
        bd = d;
        best = pts[i2];
      }
    }
    return best;
  }
  /**
   * Resolve a raw projected point to the endpoint that is actually drawn: span
   * mode snaps x to the nearest first-series data point (y follows the line);
   * free mode keeps the raw point.
   * @param {{x:number,y:number,gx:number,gy:number}} raw
   */
  _resolve(raw) {
    if (this._mode() === "free") return raw;
    const snapped = this._snapToSeries(raw.x);
    if (!snapped) return raw;
    const g = this._dataToGrid(snapped.x, snapped.y);
    return { x: snapped.x, y: snapped.y, gx: g.gx, gy: g.gy };
  }
  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
  }
  /** Bind the measure-key listeners once on the owner document. */
  _bindKeys() {
    if (this._keysBound) return;
    const doc = this._doc();
    if (!doc) return;
    doc.addEventListener("keydown", this._onKeyDown);
    doc.addEventListener("keyup", this._onKeyUp);
    this._keysBound = true;
  }
  /** @param {any} e */
  _onKeyDown(e2) {
    if (!this._enabled() || this.persistent) return;
    const key = this._cfg().key || "m";
    if (e2.key && e2.key.toLowerCase() === String(key).toLowerCase()) {
      this._arm();
    } else if (e2.key === "Escape") {
      this._cancelDrag();
    }
  }
  /** @param {any} e */
  _onKeyUp(e2) {
    if (this.persistent) return;
    const key = this._cfg().key || "m";
    if (e2.key && e2.key.toLowerCase() === String(key).toLowerCase()) {
      if (!this.drag) this._disarm();
    }
  }
  /** Public: arm a sticky measure mode (survives key release) until stopped. */
  startMeasure() {
    if (!this._enabled()) return;
    this.persistent = true;
    this._arm();
  }
  /** Public: leave measure mode. */
  stopMeasure() {
    this.persistent = false;
    this._cancelDrag();
    this._disarm();
  }
  /**
   * Public: begin a measurement anchored at a client-space point (used by the
   * context menu's "Measure from here"). Endpoint A is fixed at (cx,cy), the
   * ruler follows the cursor, and the next pointer press sets B and pins it.
   * Escape cancels. No-op unless the measure tool is enabled.
   * @param {number} cx @param {number} cy
   */
  seedFromClient(cx, cy) {
    if (!this._enabled()) return;
    this._cancelDrag();
    this._endSeed(false);
    const a2 = this._project(cx, cy);
    this.drag = { a: a2, b: a2 };
    this._seedActive = true;
    const doc = this._doc();
    if (doc) {
      doc.addEventListener("mousemove", this._onMove);
      doc.addEventListener("touchmove", this._onMove, { passive: false });
      doc.addEventListener("mousedown", this._onSeedDown, true);
      doc.addEventListener("touchstart", this._onSeedDown, true);
      doc.addEventListener("keydown", this._onSeedKey, true);
    }
    this._renderLive();
  }
  /** @param {any} e */
  _onSeedDown(e2) {
    if (!this._seedActive || !this.drag) return;
    e2.preventDefault();
    e2.stopPropagation();
    const { cx, cy } = this._clientXY(e2);
    this.drag.b = this._project(cx, cy);
    this._endSeed(true);
  }
  /** @param {any} e */
  _onSeedKey(e2) {
    if (e2.key === "Escape") this._endSeed(false);
  }
  /**
   * Finish (commit) or cancel a "measure from here" seed and detach listeners.
   * @param {boolean} commit
   */
  _endSeed(commit) {
    var _a, _b;
    if (!this._seedActive) return;
    this._seedActive = false;
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("mousedown", this._onSeedDown, true);
      doc.removeEventListener("touchstart", this._onSeedDown, true);
      doc.removeEventListener("keydown", this._onSeedKey, true);
    }
    const d = this.drag;
    this.drag = null;
    this._clearLive();
    if (!commit || !d) return;
    const a2 = this._resolve(d.a);
    const b = this._resolve(d.b);
    if (Math.abs(a2.gx - b.gx) < 2 && Math.abs(a2.gy - b.gy) < 2) return;
    const mode = this._mode();
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a2.x, ya: a2.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a2, b);
  }
  /** Public: remove all pinned rulers. */
  clearMeasures() {
    var _a, _b;
    this.pins = [];
    this._renderPins();
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "clear measures");
  }
  /**
   * Snapshot of the pinned rulers as JSON-safe plain data. This is the piece of
   * state ViewState / Perspectives (shareable URL) / Rewind (undo) persist:
   * pins already live in data space, so they round-trip and re-project.
   * Returns a deep copy so callers cannot mutate ours.
   * @returns {Array<{xa:number,ya:number,xb:number,yb:number,mode:string}>}
   */
  getPins() {
    return this.pins.map((p) => ({
      xa: p.xa,
      ya: p.ya,
      xb: p.xb,
      yb: p.yb,
      mode: p.mode === "free" ? "free" : "span"
    }));
  }
  /**
   * Replace the pinned rulers with a restored set and redraw. Accepts the shape
   * getPins() returns; a nullish / non-array value (or an old token without
   * measure state) clears all pins. Non-finite entries are dropped. Does NOT
   * record a Rewind step (the restore itself is the caller's undo boundary).
   * @param {any} pins
   */
  setPins(pins) {
    this.pins = Array.isArray(pins) ? pins.filter(
      (p) => p && isFinite(p.xa) && isFinite(p.ya) && isFinite(p.xb) && isFinite(p.yb)
    ).map((p) => ({
      xa: +p.xa,
      ya: +p.ya,
      xb: +p.xb,
      yb: +p.yb,
      mode: p.mode === "free" ? "free" : "span"
    })) : [];
    this._renderPins();
  }
  /**
   * Normalize a series `data` array into {x,y} points (numeric/datetime x or
   * category index). Non-finite / non-scalar (range/candle) points drop out.
   * @param {any[]} data
   * @returns {Array<{x:number,y:number}>}
   */
  _points(data) {
    const out = [];
    for (let i2 = 0; i2 < data.length; i2++) {
      const p = data[i2];
      let x2;
      let y;
      if (Array.isArray(p)) {
        x2 = +p[0];
        y = +p[1];
      } else if (p && typeof p === "object") {
        x2 = +p.x;
        y = +p.y;
      } else {
        x2 = i2;
        y = +p;
      }
      if (isFinite(x2) && isFinite(y)) out.push({ x: x2, y });
    }
    return out;
  }
  /** Lay the transparent capture pane over the plot so our pointer handlers own
   *  the drag (ZoomPanSelection never sees it). */
  _arm() {
    if (this.armed || !this._enabled()) return;
    const w = this.w;
    const parent = w.dom.elGraphical;
    if (!parent) return;
    this.armed = true;
    const pane = this.graphics.drawRect(0, 0, w.layout.gridWidth, w.layout.gridHeight);
    pane.node.setAttribute("class", "apexcharts-measure-capture");
    pane.node.setAttribute("fill", "transparent");
    pane.node.style.cursor = "crosshair";
    pane.node.style.pointerEvents = "all";
    pane.node.addEventListener("mousedown", this._onDown);
    pane.node.addEventListener("touchstart", this._onDown, { passive: false });
    parent.add(pane);
    this.pane = pane;
  }
  _disarm() {
    this.armed = false;
    if (this.pane) {
      this.pane.node.removeEventListener("mousedown", this._onDown);
      this.pane.node.removeEventListener("touchstart", this._onDown);
      const p = this.pane.node;
      if (p.parentNode) p.parentNode.removeChild(p);
      this.pane = null;
    }
  }
  /** @param {any} e @returns {{cx:number,cy:number}} */
  _clientXY(e2) {
    const t2 = e2.touches && e2.touches[0] ? e2.touches[0] : e2;
    return { cx: t2.clientX, cy: t2.clientY };
  }
  /**
   * The plot's on-screen rect, or null before there is a chart to measure.
   * Not the `.apexcharts-grid` box: that starts a pixel below the plot, and on
   * a numeric-x bar chart its gridlines run barPadForNumericAxis past both
   * sides, so a ruler drawn there landed tens of px off the pointer.
   */
  _plotRect() {
    const w = this.w;
    if (!w.dom.baseEl || !w.dom.baseEl.querySelector(".apexcharts-svg")) {
      return null;
    }
    return TooltipUtils.plotRect(w);
  }
  /** [min,max] for the primary y-axis, preferring the rendered nice scale. */
  _yRange() {
    const g = this.w.globals;
    const s2 = g.yAxisScale && g.yAxisScale[0];
    if (s2 && isFinite(s2.niceMin) && isFinite(s2.niceMax) && s2.niceMax !== s2.niceMin) {
      return [s2.niceMin, s2.niceMax];
    }
    return [g.minY, g.maxY];
  }
  /**
   * Client pixel -> { x, y (data), gx, gy (grid-local SVG units) }.
   * @param {number} cx @param {number} cy
   */
  _project(cx, cy) {
    const w = this.w;
    const rect = this._plotRect();
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = rect && rect.width ? clamp((cx - rect.left) / rect.width) : 0;
    const fy = rect && rect.height ? clamp((cy - rect.top) / rect.height) : 0;
    const [ymin, ymax] = this._yRange();
    const x2 = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const y = ymax - fy * (ymax - ymin);
    return { x: x2, y, gx: fx * gw, gy: fy * gh };
  }
  /**
   * Data (x,y) -> grid-local SVG coords, for redrawing pinned rulers.
   * @param {number} x @param {number} y
   */
  _dataToGrid(x2, y) {
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const xr = w.globals.maxX - w.globals.minX || 1;
    const [ymin, ymax] = this._yRange();
    const yr = ymax - ymin || 1;
    return {
      gx: (x2 - w.globals.minX) / xr * gw,
      gy: gh - (y - ymin) / yr * gh
    };
  }
  /** @param {any} e */
  _onDown(e2) {
    if (!this.armed) return;
    e2.preventDefault();
    e2.stopPropagation();
    const { cx, cy } = this._clientXY(e2);
    const a2 = this._project(cx, cy);
    this.drag = { a: a2, b: a2 };
    const doc = this._doc();
    if (doc) {
      doc.addEventListener("mousemove", this._onMove);
      doc.addEventListener("mouseup", this._onUp);
      doc.addEventListener("touchmove", this._onMove, { passive: false });
      doc.addEventListener("touchend", this._onUp);
    }
    this._renderLive();
  }
  /** @param {any} e */
  _onMove(e2) {
    if (!this.drag) return;
    if (e2.cancelable) e2.preventDefault();
    const { cx, cy } = this._clientXY(e2);
    this.drag.b = this._project(cx, cy);
    this._renderLive();
  }
  /** @param {any} _e */
  _onUp(_e) {
    var _a, _b;
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("mouseup", this._onUp);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("touchend", this._onUp);
    }
    if (!this.drag) return;
    const rawA = this.drag.a;
    const rawB = this.drag.b;
    this.drag = null;
    this._clearLive();
    if (Math.abs(rawA.gx - rawB.gx) < 2 && Math.abs(rawA.gy - rawB.gy) < 2) {
      if (!this.persistent) this._disarm();
      return;
    }
    const mode = this._mode();
    const a2 = this._resolve(rawA);
    const b = this._resolve(rawB);
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a2.x, ya: a2.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a2, b);
    if (!this.persistent) this._disarm();
  }
  _cancelDrag() {
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousemove", this._onMove);
      doc.removeEventListener("mouseup", this._onUp);
      doc.removeEventListener("touchmove", this._onMove);
      doc.removeEventListener("touchend", this._onUp);
    }
    this.drag = null;
    this._clearLive();
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @returns {{dx:number,dy:number,pct:number,slope:number}}
   */
  _stats(a2, b) {
    const dx = b.x - a2.x;
    const dy = b.y - a2.y;
    return {
      dx,
      dy,
      pct: a2.y !== 0 ? dy / Math.abs(a2.y) * 100 : NaN,
      slope: dx !== 0 ? dy / dx : NaN
    };
  }
  /** @param {number} v */
  _fmt(v) {
    if (!isFinite(v)) return "n/a";
    const a2 = Math.abs(v);
    if (a2 !== 0 && (a2 < 0.01 || a2 >= 1e6)) return v.toExponential(2);
    return String(Math.round(v * 100) / 100);
  }
  /** getComputedStyle of the graphical layer (browser only), for CSS vars. */
  _computedStyle() {
    if (!Environment.isBrowser()) return null;
    const node = this.w.dom.elGraphical && this.w.dom.elGraphical.node;
    if (!node || typeof getComputedStyle !== "function") return null;
    try {
      return getComputedStyle(node);
    } catch (e2) {
      return null;
    }
  }
  /**
   * Resolve a color: explicit config value, else a `--apx-measure-*` CSS custom
   * property, else the built-in default.
   * @param {any} cfgVal @param {string} varName @param {string} fallback
   * @param {CSSStyleDeclaration|null} [cs]
   */
  _resolveColor(cfgVal, varName, fallback, cs) {
    if (cfgVal) return cfgVal;
    const style = cs !== void 0 ? cs : this._computedStyle();
    const v = style ? style.getPropertyValue(varName).trim() : "";
    return v || fallback;
  }
  /** Resolved semantic colors (config -> CSS var -> built-in default). */
  _colors() {
    const c = this._cfg().colors || {};
    const cs = this._computedStyle();
    return {
      up: this._resolveColor(c.up, "--apx-measure-up", "#16a34a", cs),
      down: this._resolveColor(c.down, "--apx-measure-down", "#dc2626", cs),
      neutral: this._resolveColor(c.neutral, "--apx-measure-neutral", "#64748b", cs),
      guide: this._resolveColor(c.guide, "--apx-measure-guide", "#94a3b8", cs)
    };
  }
  /** @param {number} dy */
  _dirColor(dy) {
    const c = this._colors();
    return dy === 0 ? c.neutral : dy > 0 ? c.up : c.down;
  }
  /** @param {number} dy */
  _dirClass(dy) {
    return dy === 0 ? "apexcharts-measure-flat" : dy > 0 ? "apexcharts-measure-up" : "apexcharts-measure-down";
  }
  /**
   * Format a percentage, via `measure.format.percent` when set.
   * @param {number} p
   */
  _fmtPct(p) {
    if (!isFinite(p)) return "n/a";
    const f = this._cfg().format && this._cfg().format.percent;
    if (typeof f === "function") {
      try {
        const s2 = f(p);
        if (s2 != null) return String(s2);
      } catch (e2) {
      }
    }
    return (p >= 0 ? "+" : "") + this._fmt(p) + "%";
  }
  /**
   * The readout lines for a ruler: `measure.label` override, else the default
   * per-mode text.
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st @param {string} mode
   * @returns {string[]}
   */
  _label(a2, b, st, mode) {
    const fn = this._cfg().label;
    if (typeof fn === "function") {
      const out = fn({
        from: { x: a2.x, y: a2.y },
        to: { x: b.x, y: b.y },
        dx: st.dx,
        dy: st.dy,
        percentChange: st.pct,
        slope: st.slope,
        mode
      });
      return Array.isArray(out) ? out.map(String) : [String(out)];
    }
    if (mode === "span") {
      const arrow2 = st.dy === 0 ? "" : st.dy > 0 ? " ↑" : " ↓";
      const pct = isFinite(st.pct) ? "(" + this._fmtPct(st.pct) + ")" : "";
      return [this._fmtY(st.dy) + "  " + pct + arrow2, this._fmtX(a2.x) + "  to  " + this._fmtX(b.x)];
    }
    return ["Δx " + this._fmtDx(st.dx), "Δy " + this._fmtY(st.dy), this._fmtPct(st.pct)];
  }
  /**
   * Format an x delta, treating datetime x as a day count.
   * @param {number} dx
   */
  _fmtDx(dx) {
    if (this.w.config.xaxis.type === "datetime") {
      const days = dx / 864e5;
      return Math.round(days * 10) / 10 + "d";
    }
    return this._fmt(dx);
  }
  /**
   * Format a y value (a delta) via the y-axis label formatter when present.
   * @param {number} v
   */
  _fmtY(v) {
    const cf = this._cfg().format && this._cfg().format.y;
    if (typeof cf === "function") {
      try {
        const s2 = cf(v);
        if (s2 != null) return String(s2);
      } catch (e2) {
      }
    }
    const f = this.w.globals.yLabelFormatters && this.w.globals.yLabelFormatters[0];
    if (typeof f === "function") {
      try {
        const s2 = f(v, { seriesIndex: 0, dataPointIndex: -1, w: this.w });
        if (s2 != null && s2 !== "") return String(s2);
      } catch (e2) {
      }
    }
    return this._fmt(v);
  }
  /**
   * Format an x value: a short date for datetime x, else the x-label formatter
   * or a plain number.
   * @param {number} x
   */
  _fmtX(x2) {
    const w = this.w;
    const cf = this._cfg().format && this._cfg().format.x;
    if (typeof cf === "function") {
      try {
        const s2 = cf(x2);
        if (s2 != null) return String(s2);
      } catch (e2) {
      }
    }
    if (w.config.xaxis.type === "datetime") {
      const d = new Date(x2);
      return d.toLocaleDateString(void 0, {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    const f = w.globals.xLabelFormatter;
    if (typeof f === "function") {
      try {
        const s2 = f(x2, { w });
        if (s2 != null && s2 !== "") return String(s2);
      } catch (e2) {
      }
    }
    return this._fmt(x2);
  }
  /** The live overlay group, created lazily inside elGraphical. */
  _liveGroup() {
    const w = this.w;
    if (this._live && this._live.node && this._live.node.parentNode) {
      return this._live;
    }
    const g = this.graphics.group({ class: "apexcharts-measure-live" });
    g.node.style.pointerEvents = "none";
    if (w.dom.elGraphical) w.dom.elGraphical.add(g);
    this._live = g;
    return g;
  }
  _clearLive() {
    if (this._live && this._live.node) {
      const n2 = this._live.node;
      if (n2.parentNode) n2.parentNode.removeChild(n2);
    }
    this._live = null;
  }
  _renderLive() {
    if (!this.drag) return;
    const g = this._liveGroup();
    while (g.node.firstChild) g.node.removeChild(g.node.firstChild);
    const a2 = this._resolve(this.drag.a);
    const b = this._resolve(this.drag.b);
    this._drawRuler(g, a2, b, false, this._mode());
  }
  /** Redraw all pinned rulers into a fresh group (called after each render). */
  _renderPins() {
    const w = this.w;
    const old = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-measure-pins");
    if (old && old.parentNode) old.parentNode.removeChild(old);
    if (!this.pins.length || !w.dom.elGraphical) return;
    const g = this.graphics.group({ class: "apexcharts-measure-pins" });
    g.node.style.pointerEvents = "none";
    w.dom.elGraphical.add(g);
    this.pins.forEach((p) => {
      const a2 = __spreadProps(__spreadValues({}, this._dataToGrid(p.xa, p.ya)), { x: p.xa, y: p.ya });
      const b = __spreadProps(__spreadValues({}, this._dataToGrid(p.xb, p.yb)), { x: p.xb, y: p.yb });
      this._drawRuler(g, a2, b, true, p.mode || "span");
    });
  }
  /**
   * Draw one ruler into `g`, dispatching on style.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {boolean} [pinned]
   * @param {string} [mode] 'span' (finance-style band, default) | 'free'
   */
  _drawRuler(g, a2, b, pinned, mode) {
    const st = this._stats(a2, b);
    const rg = this.graphics.group({
      class: "apexcharts-measure-ruler " + this._dirClass(st.dy) + (pinned ? " apexcharts-measure-pinned" : "")
    });
    if ((mode || this._mode()) === "free") this._drawFree(rg, a2, b, st);
    else this._drawSpan(rg, a2, b, st);
    g.add(rg);
  }
  /** Endpoint dots on the series line (skipped when markers:false).
   * @param {any} g @param {{gx:number,gy:number}} p @param {string} color */
  _dot(g, p, color) {
    if (this._cfg().markers === false) return;
    const dot = this.graphics.drawMarker(p.gx, p.gy, {
      pSize: 4,
      shape: "circle",
      pointFillColor: color,
      pointFillOpacity: 1,
      pointStrokeColor: "#fff",
      pointStrokeWidth: 2,
      pointStrokeOpacity: 1
    });
    g.add(dot);
  }
  /** Draw the readout label box + text into `g` at (bx,by).
   * @param {any} g @param {string[]} lines @param {number} bx @param {number} by
   * @param {number} boxW @param {number} boxH @param {string} color */
  _readout(g, lines, bx, by, boxW, boxH, color) {
    const box = this.graphics.drawRect(bx, by, boxW, boxH, 4);
    box.node.setAttribute("class", "apexcharts-measure-label-bg");
    box.attr({ fill: "#ffffff", "fill-opacity": 0.95, stroke: color, "stroke-width": 1 });
    g.add(box);
    const label2 = this.graphics.drawText({
      x: bx + 9,
      y: by + 15,
      text: lines,
      textAnchor: "start",
      fontSize: "11px",
      foreColor: "#1e293b",
      cssClass: "apexcharts-measure-label"
    });
    g.add(label2);
  }
  /**
   * Finance-style ruler: vertical guides + shaded band + endpoints on the
   * series line + a top readout. Guides/band/markers are individually
   * toggleable via config.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st
   */
  _drawSpan(g, a2, b, st) {
    const w = this.w;
    const cfg = this._cfg();
    const gh = w.layout.gridHeight;
    const color = this._dirColor(st.dy);
    const lx = Math.min(a2.gx, b.gx);
    const rx = Math.max(a2.gx, b.gx);
    if (cfg.band !== false) {
      const band = this.graphics.drawRect(lx, 0, Math.max(0, rx - lx), gh, 0);
      band.node.setAttribute("class", "apexcharts-measure-band");
      band.attr({ fill: color, "fill-opacity": 0.09, stroke: "none" });
      g.add(band);
    }
    if (cfg.guides !== false) {
      [a2, b].forEach((p) => {
        const vline = this.graphics.drawLine(p.gx, 0, p.gx, gh, this._colors().guide, 4, 1);
        vline.node.setAttribute("class", "apexcharts-measure-vline");
        g.add(vline);
      });
    }
    [a2, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a2, b, st, "span");
    const longest = lines.reduce((m, s2) => Math.max(m, s2.length), 0);
    const boxW = Math.max(148, longest * 6.4);
    const boxH = 20 + lines.length * 15;
    let bx = (lx + rx) / 2 - boxW / 2;
    bx = Math.max(2, Math.min(bx, w.layout.gridWidth - boxW - 2));
    this._readout(g, lines, bx, 4, boxW, boxH, color);
  }
  /**
   * Free 2D ruler: a diagonal line between two arbitrary points + a readout.
   * @param {any} g
   * @param {{gx:number,gy:number,x:number,y:number}} a
   * @param {{gx:number,gy:number,x:number,y:number}} b
   * @param {{dx:number,dy:number,pct:number,slope:number}} st
   */
  _drawFree(g, a2, b, st) {
    const color = this._dirColor(st.dy);
    const line = this.graphics.drawLine(a2.gx, a2.gy, b.gx, b.gy, color, 0, 2);
    line.node.setAttribute("class", "apexcharts-measure-line");
    g.add(line);
    [a2, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a2, b, st, "free");
    const longest = lines.reduce((m, s2) => Math.max(m, s2.length), 0);
    const boxW = Math.max(72, longest * 6.2);
    const boxH = 16 + lines.length * 15;
    let bx = (a2.gx + b.gx) / 2 + 8;
    let by = (a2.gy + b.gy) / 2 - boxH / 2;
    bx = Math.max(2, Math.min(bx, this.w.layout.gridWidth - boxW - 2));
    by = Math.max(2, Math.min(by, this.w.layout.gridHeight - boxH - 2));
    this._readout(g, lines, bx, by, boxW, boxH, color);
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   */
  _fireMeasured(a2, b) {
    const st = this._stats(a2, b);
    const payload = {
      from: { x: a2.x, y: a2.y },
      to: { x: b.x, y: b.y },
      dx: st.dx,
      dy: st.dy,
      percentChange: st.pct,
      slope: st.slope
    };
    const fn = this.w.config.chart.events.measured;
    if (typeof fn === "function") fn(this.ctx, payload);
    this.ctx.events.fireEvent("measured", [this.ctx, payload]);
  }
  /** Re-project the measure pins after each render. */
  _afterRender() {
    if (!this._enabled()) return;
    if (this.w.interact.measureEnabled && !this.persistent) {
      this.persistent = true;
    }
    if (this.pins.length) this._renderPins();
    if (this.persistent && !this.drag) {
      this._disarm();
      this._arm();
    }
  }
  teardown() {
    this._cancelDrag();
    this._endSeed(false);
    this._disarm();
    const doc = this._doc();
    if (doc && this._keysBound) {
      doc.removeEventListener("keydown", this._onKeyDown);
      doc.removeEventListener("keyup", this._onKeyUp);
    }
    this._keysBound = false;
    this.pins = [];
  }
}
ApexCharts__default.registerFeatures({ measure: Measure });
const MARK_SELECTOR = [
  ".apexcharts-bar-area",
  ".apexcharts-candlestick-area",
  ".apexcharts-boxPlot-area",
  ".apexcharts-rangebar-area",
  ".apexcharts-marker"
].join(", ");
const FILTER_MARK_SELECTOR = [
  ".apexcharts-pie-area",
  ".apexcharts-bar-area"
].join(", ");
const DIMMED_CLASS = "apexcharts-crossfilter-dimmed";
const PIE_TYPES = ["pie", "donut", "polarArea", "radialBar"];
class LinkedViews {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._dimmed = false;
    this._wired = false;
    this._pending = false;
    this._lastValues = null;
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
    this._onChange = this._onChange.bind(this);
    if (this._mode() === "filter") this._initEngine();
  }
  /** @returns {'highlight'|'filter'|'off'} */
  _mode() {
    const link = this.w.config.chart.link;
    if (link && typeof link.dimension === "function") return "filter";
    if (link && link.enabled) return "highlight";
    return "off";
  }
  _enabled() {
    const link = this.w.config.chart.link;
    return !!(link && link.enabled);
  }
  /**
   * The source chart's rectangle brush produced a data-x range. In FILTER mode
   * this becomes a `[min,max]` range filter on the chart's dimension (the other
   * charts re-aggregate). In HIGHLIGHT mode (P1) it dims out-of-range marks
   * across the group. Called (null-safe) from ZoomPanSelection selectionDrawn /
   * selectionDragging.
   * @param {{min:number, max:number}} xaxis
   */
  onSourceSelection(xaxis) {
    var _a;
    const mode = this._mode();
    if (mode === "off") return;
    if (!xaxis || xaxis.min == null || xaxis.max == null) return;
    let min = Math.min(xaxis.min, xaxis.max);
    let max = Math.max(xaxis.min, xaxis.max);
    const gMinX = this.w.globals.minX;
    const gMaxX = this.w.globals.maxX;
    if (isFinite(gMinX) && isFinite(gMaxX) && gMaxX > gMinX) {
      const tol = (gMaxX - gMinX) * 1e-6;
      if (min - gMinX <= tol) min = gMinX;
      if (gMaxX - max <= tol) max = gMaxX;
    }
    if (mode === "filter") {
      const cf = this._cf();
      if (!cf) return;
      cf.filter(this._chartId(), [min, max]);
      this._fireFilterChange(cf, [min, max]);
      return;
    }
    this._group().forEach((ch) => {
      var _a2;
      (_a2 = ch == null ? void 0 : ch.linkedViews) == null ? void 0 : _a2.applyDim(min, max);
    });
    const args = { xaxis: { min, max }, sourceChartID: this.w.globals.chartID };
    if (typeof this.w.config.chart.events.crossFilter === "function") {
      this.w.config.chart.events.crossFilter(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("crossFilter", [this.ctx, args]);
  }
  /** self + grouped siblings (dedup-safe; getGroupedCharts excludes self). */
  _group() {
    const siblings = typeof this.ctx.getGroupedCharts === "function" ? this.ctx.getGroupedCharts() : [];
    return [this.ctx, ...siblings];
  }
  /**
   * Dim this chart's marks whose x is outside [min,max]; un-dim those inside.
   * No re-render, so mark identities are preserved.
   * @param {number} min @param {number} max
   */
  applyDim(min, max) {
    if (!this._enabled()) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const dimOpacity = w.config.chart.link.dimOpacity;
    if (w.dom.elWrap && typeof dimOpacity === "number") {
      w.dom.elWrap.style.setProperty("--apx-cf-dim", String(dimOpacity));
    }
    const seriesX = w.globals.seriesX || [];
    const marks2 = baseEl.querySelectorAll(MARK_SELECTOR);
    marks2.forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const j2 = parseInt(jAttr, 10);
      const iAttr = node.getAttribute("index");
      const i2 = iAttr === null ? 0 : parseInt(iAttr, 10);
      const row = seriesX[i2] || seriesX[0];
      if (!row) return;
      const x2 = row[j2];
      if (x2 == null) return;
      node.classList.toggle(DIMMED_CLASS, x2 < min || x2 > max);
    });
    this._dimmed = true;
  }
  /** Remove dimming from this chart only. */
  clear() {
    const baseEl = this.w.dom.baseEl;
    if (!baseEl) return;
    baseEl.querySelectorAll("." + DIMMED_CLASS).forEach((n2) => n2.classList.remove(DIMMED_CLASS));
    this._dimmed = false;
  }
  /** Clear dimming across the whole group (backs chart.clearCrossfilter). */
  clearGroup() {
    if (this._mode() === "filter") {
      const cf = this._cf();
      if (cf) cf.reset();
      return;
    }
    this._group().forEach((ch) => {
      var _a;
      return (_a = ch == null ? void 0 : ch.linkedViews) == null ? void 0 : _a.clear();
    });
  }
  // ─── FILTER mode (crossfilter engine glue) ───────────────────────────────
  /**
   * The chart's stable internal id (keys its dimension in the coordinator).
   * Always set by the ApexCharts constructor (falls back to a cuid).
   * @returns {string}
   */
  _chartId() {
    return (
      /** @type {string} */
      this.w.globals.chartID
    );
  }
  /** @returns {import('./Crossfilter').default|null} the coordinator, or null */
  _cf() {
    const link = this.w.config.chart.link;
    const id = link && (link.id || this.w.config.chart.group);
    return id ? Me.get(id) : null;
  }
  _isPie() {
    return PIE_TYPES.indexOf(this.w.config.chart.type) !== -1;
  }
  _isHeatmap() {
    return this.w.config.chart.type === "heatmap";
  }
  /**
   * Before the first render: resolve the coordinator, register this chart's
   * dimension, inject the initial aggregated series into w.config (so the first
   * paint is already aggregated, no empty flash), and wire the listeners.
   */
  _initEngine() {
    const cf = this._cf();
    const link = this.w.config.chart.link;
    if (!cf) {
      const id = link && link.id || this.w.config.chart.group;
      console.warn(
        `[apexcharts] chart.link.dimension is set but no crossfilter coordinator "${id}" exists. Call ApexCharts.crossfilter({ id, records }) before creating the chart.`
      );
      return;
    }
    const chartId = this._chartId();
    if (!cf.hasDimension(chartId)) {
      cf.registerDimension(chartId, {
        dimension: link.dimension,
        reduce: link.reduce,
        // heatmap => 2D matrix dimension (accessor returns [xKey, yKey]).
        type: link.type || (this._isHeatmap() ? "matrix" : void 0),
        bins: link.bins,
        order: link.order
      });
    }
    this._injectSeries(cf.aggregateFor(chartId));
    this._wire(cf);
  }
  /**
   * Build the chart's series value from an aggregation, shaped by chart type:
   *   matrix (heatmap) -> [{ name:yKey, data:[{x:xKey, y:value}] }]
   *   pie/donut  -> number[]
   *   axis + category -> [{ name, data:number[] }] (categories set separately)
   *   axis + range    -> [{ name, data:[x,value][] }] on a numeric/time x-axis
   * @param {any} agg
   */
  _seriesFromAgg(agg) {
    if (agg.type === "matrix") {
      return agg.yLabels.map((yl, yi) => ({
        name: String(yl),
        data: agg.xLabels.map((xl, xi) => ({
          x: String(xl),
          y: agg.matrix[yi][xi]
        }))
      }));
    }
    if (this._isPie()) return agg.values.slice();
    const name = this.w.config.chart.link.seriesName || "Count";
    if (agg.type === "range") {
      return [{ name, data: agg.labels.map((x2, i2) => [x2, agg.values[i2]]) }];
    }
    return [{ name, data: agg.values.slice() }];
  }
  /**
   * Value signature used to skip a reflow when only dimming changed.
   * @param {any} agg
   */
  _sigOf(agg) {
    return JSON.stringify(agg.matrix || agg.values);
  }
  /**
   * Write the aggregation into w.config as the chart's series/labels. Runs once
   * before the first paint; later updates go through updateSeries.
   * @param {any} agg
   */
  _injectSeries(agg) {
    const w = this.w;
    this._lastValues = this._sigOf(agg);
    w.config.series = this._seriesFromAgg(agg);
    if (agg.type === "matrix") return;
    if (this._isPie()) {
      w.config.labels = agg.labels.map(String);
    } else if (agg.type === "category") {
      if (!w.config.xaxis) w.config.xaxis = {};
      w.config.xaxis.categories = agg.labels.map(String);
    } else if (agg.type === "range") {
      this._pinRangeDomain(agg.edges);
    }
  }
  /**
   * Pin the numeric/datetime x-axis to the outer bin edges of a range-binned
   * dimension (unless the user set xaxis.min/max explicitly). See _injectSeries.
   * @param {number[]|null|undefined} edges
   */
  _pinRangeDomain(edges) {
    if (!Array.isArray(edges) || edges.length < 2) return;
    const w = this.w;
    if (!w.config.xaxis) w.config.xaxis = /** @type {any} */
    {};
    if (w.config.xaxis.min == null) w.config.xaxis.min = edges[0];
    if (w.config.xaxis.max == null) w.config.xaxis.max = edges[edges.length - 1];
  }
  /** @param {import('./Crossfilter').default} cf */
  _wire(cf) {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("dataPointSelection", this._onPointSelect);
    this.ctx.addEventListener("mounted", this._afterRender);
    this.ctx.addEventListener("updated", this._afterRender);
    cf.on("change", this._onChange);
  }
  /**
   * A pie slice / bar was clicked: toggle its bucket key on the coordinator.
   * @param {any} _e @param {any} _ctx @param {{dataPointIndex?:number}} opts
   */
  _onPointSelect(_e, _ctx, opts) {
    if (this._mode() !== "filter" || !opts || opts.dataPointIndex == null) return;
    const cf = this._cf();
    if (!cf) return;
    const chartId = this._chartId();
    const agg = cf.aggregateFor(chartId);
    if (agg.type === "matrix") return;
    const key = agg.keys[opts.dataPointIndex];
    if (key == null) return;
    cf.toggleKey(chartId, key);
    this._fireFilterChange(cf, key);
  }
  /** Coordinator filter changed: re-aggregate this chart on a microtask so the
   *  triggering click handler unwinds before we destroy/redraw the DOM. */
  _onChange() {
    if (this._mode() !== "filter" || this._pending) return;
    this._pending = true;
    Promise.resolve().then(() => {
      this._pending = false;
      if (this.w.globals.isDestroyed) return;
      this._applyAggregation();
    });
  }
  /**
   * Pull this chart's crossfilter aggregation and push it through updateSeries
   * (animated). When the values are unchanged (e.g. only this chart's own
   * filter moved, which it ignores for itself), skip the reflow and just
   * refresh the self-dim.
   */
  _applyAggregation() {
    if (this._mode() !== "filter") return;
    const cf = this._cf();
    if (!cf) return;
    const agg = cf.aggregateFor(this._chartId());
    const sig = this._sigOf(agg);
    if (sig === this._lastValues) {
      this._applySelfDim();
      return;
    }
    this._lastValues = sig;
    this.ctx.updateSeries(this._seriesFromAgg(agg), true);
  }
  _afterRender() {
    if (this._mode() !== "filter") return;
    const series = this.w.config.series;
    if (!series || series.length === 0) {
      this._reassertSeries();
      return;
    }
    this._applySelfDim();
  }
  /** Restore the aggregated series after an external updateSeries emptied it.
   *  Deferred a microtask so the triggering update fully unwinds first. */
  _reassertSeries() {
    if (this._pending) return;
    this._pending = true;
    Promise.resolve().then(() => {
      this._pending = false;
      if (this.w.globals.isDestroyed) return;
      const cf = this._cf();
      if (!cf) return;
      const agg = cf.aggregateFor(this._chartId());
      const series = this._seriesFromAgg(agg);
      if (!series.length) return;
      this._lastValues = this._sigOf(agg);
      this.ctx.updateSeries(series, true);
    });
  }
  /**
   * Dim this chart's own buckets that are not in its own filter (no filter ->
   * none dimmed). Categorical: dim buckets whose key is not in the selected Set.
   * Range: dim bins lying fully outside the selected `[min,max]`. Keyed by each
   * mark's `j` (dataPointIndex) -> the aggregation key.
   */
  _applySelfDim() {
    const cf = this._cf();
    if (!cf) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const chartId = this._chartId();
    const filter = cf.filterOf(chartId);
    const dimOpacity = w.config.chart.link.dimOpacity;
    if (w.dom.elWrap && typeof dimOpacity === "number") {
      w.dom.elWrap.style.setProperty("--apx-cf-dim", String(dimOpacity));
    }
    const isCategory = filter instanceof Set;
    const isRange = Array.isArray(filter);
    const agg = cf.aggregateFor(chartId);
    if (agg.type === "matrix") return;
    const keys = agg.keys;
    baseEl.querySelectorAll(FILTER_MARK_SELECTOR).forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const key = keys[parseInt(jAttr, 10)];
      let dim = false;
      if (isCategory) {
        dim = !/** @type {Set<any>} */
        filter.has(key);
      } else if (isRange && Array.isArray(key)) {
        dim = key[1] <= filter[0] || key[0] >= filter[1];
      }
      node.classList.toggle(DIMMED_CLASS, dim);
    });
    this._dimmed = !!filter;
  }
  /**
   * Fire the `filterChange` event on this (source) chart.
   * @param {import('./Crossfilter').default} cf @param {any} key
   */
  _fireFilterChange(cf, key) {
    var _a;
    const args = __spreadProps(__spreadValues({}, cf.state()), {
      sourceChartID: this._chartId(),
      key
    });
    const events = this.w.config.chart.events;
    if (typeof events.filterChange === "function") {
      events.filterChange(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("filterChange", [this.ctx, args]);
  }
  teardown() {
    var _a, _b, _c, _d, _e, _f;
    this.clear();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "dataPointSelection", this._onPointSelect);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "mounted", this._afterRender);
      (_f = (_e = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e, "updated", this._afterRender);
      const cf = this._cf();
      if (cf) {
        cf.off("change", this._onChange);
        cf.removeDimension(this._chartId());
      }
      this._wired = false;
    }
  }
}
ApexCharts__default.registerFeatures({ linkedViews: LinkedViews });
const AC = (
  /** @type {any} */
  ApexCharts__default
);
AC._crossfilterFactory = (opts) => Me.getOrCreate(opts);
AC._crossfilterGet = (id) => Me.get(id);
const Options = ApexCharts.__apex_Options;
const DRAG_CLASS = "apexcharts-ink-draggable";
const OWNER = "ink";
const TYPES = ["point", "xaxis", "yaxis"];
const EDGE_PX = 8;
const CLICK_SLOP_PX = 2;
const FONT_STEPS = [10, 11, 12, 14, 17, 20];
const MARKER_SHAPES = ["circle", "square", "diamond", "triangle"];
const SHAPE_GLYPHS = {
  circle: "●",
  square: "■",
  diamond: "◆",
  triangle: "▲"
};
const NOTE_COLORS = [
  "#ffffff",
  "#334155",
  "#2563eb",
  "#16a34a",
  "#d97706",
  "#dc2626"
];
const TRASH_ICON = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>';
class InkLayer {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._wired = false;
    this._drag = null;
    this._editor = null;
    this._creating = false;
    this._createSeq = 0;
    this._attach = this._attach.bind(this);
    this._onRerender = this._onRerender.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);
    this._onCreateClick = this._onCreateClick.bind(this);
    this._onDocDownEditor = this._onDocDownEditor.bind(this);
    if (this._enabledGlobally() || this._hasDraggable() || this._paletteEnabled()) {
      this._wire();
    }
  }
  _enabledGlobally() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.enabled);
  }
  _paletteEnabled() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.palette);
  }
  _snapEnabled() {
    const ink = this.w.config.chart.ink;
    return !!(ink && ink.snap);
  }
  // ─── P5: snap to gridlines ────────────────────────────────────────────────
  /** @param {number} v @param {number[]} ticks @returns {number} nearest tick */
  _nearest(v, ticks) {
    let best = v;
    let bd = Infinity;
    for (let i2 = 0; i2 < ticks.length; i2++) {
      const d = Math.abs(ticks[i2] - v);
      if (d < bd) {
        bd = d;
        best = ticks[i2];
      }
    }
    return best;
  }
  /**
   * Snap an x value to the nearest x gridline (numeric axes only).
   * @param {number} x
   */
  _snapX(x2) {
    if (!this._snapEnabled() || typeof x2 !== "number") return x2;
    const s2 = this.w.globals.xAxisScale;
    return s2 && Array.isArray(s2.result) && s2.result.length ? this._nearest(x2, s2.result) : x2;
  }
  /**
   * Snap a y value to the nearest y gridline.
   * @param {number} y @param {number} si
   */
  _snapY(y, si) {
    if (!this._snapEnabled() || typeof y !== "number") return y;
    const scales = this.w.globals.yAxisScale;
    const s2 = scales && scales[si];
    return s2 && Array.isArray(s2.result) && s2.result.length ? this._nearest(y, s2.result) : y;
  }
  /** @param {string} type @returns {any[]} the config annotations of a type */
  _annoList(type) {
    const a2 = this.w.config.annotations;
    if (!a2) return [];
    const key = type === "point" ? "points" : type;
    return Array.isArray(a2[key]) ? a2[key] : [];
  }
  /** @param {any} anno */
  _isDraggable(anno) {
    if (!anno) return false;
    if (anno.draggable === true) return true;
    if (anno.draggable === false) return false;
    return this._enabledGlobally();
  }
  _hasDraggable() {
    return TYPES.some((t2) => this._annoList(t2).some((p) => this._isDraggable(p)));
  }
  _wire() {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("mounted", this._onRerender);
    this.ctx.addEventListener("updated", this._onRerender);
  }
  /**
   * A full (re)render rebuilds the SVG and may swap the annotations config
   * (updateOptions, undo restore), so an open editor card points at stale
   * state: drop it (without committing) before rebinding handlers. Targeted
   * redraws call _attach() directly and keep the card open.
   */
  _onRerender() {
    this._closeEditor(false);
    this._attach();
    if (this._creating) {
      const svg = this.w.dom.Paper && this.w.dom.Paper.node;
      if (svg) {
        svg.style.cursor = "crosshair";
        svg.addEventListener("click", this._onCreateClick, true);
      }
    }
  }
  /**
   * After each (re)render, bind drag + edit handlers to every draggable
   * annotation's elements. Idempotent via a per-node flag so a targeted redraw
   * re-runs this without double-binding the untouched annotations.
   */
  _attach() {
    const w = this.w;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    TYPES.forEach((type) => {
      this._annoList(type).forEach((anno, index) => {
        if (!this._isDraggable(anno)) return;
        if (!anno.id) {
          anno.id = "apexcharts-ink-" + type + "-" + index + "-" + w.globals.chartID;
        }
        baseEl.querySelectorAll("." + anno.id).forEach((el) => {
          if (el.__inkBound) return;
          el.__inkBound = true;
          el.style.cursor = "move";
          el.classList.add(DRAG_CLASS);
          el.addEventListener(
            "mousedown",
            (e2) => this._onDown(e2, type, index)
          );
          el.addEventListener(
            "touchstart",
            (e2) => this._onDown(e2, type, index)
          );
          el.addEventListener("dblclick", (e2) => {
            e2.preventDefault();
            e2.stopPropagation();
            this._startEdit(type, index, { select: true });
          });
        });
      });
    });
    if (this._paletteEnabled()) this._renderPalette();
  }
  // ─── drag / resize ────────────────────────────────────────────────────────
  /**
   * @param {any} e @param {string} type @param {number} index
   */
  _onDown(e2, type, index) {
    if (e2.button && e2.button !== 0) return;
    const w = this.w;
    const doc = w.dom.baseEl && w.dom.baseEl.ownerDocument;
    if (!doc) return;
    e2.stopPropagation();
    if (e2.cancelable) e2.preventDefault();
    const isTouch = e2.type === "touchstart";
    const ev = isTouch ? e2.touches[0] : e2;
    const svgRoot = w.dom.Paper && w.dom.Paper.node;
    const ctm = svgRoot && svgRoot.getScreenCTM ? svgRoot.getScreenCTM() : null;
    const anno = this._annoList(type)[index];
    let mode = "move";
    let rect = null;
    let origX = 0;
    let origW = 0;
    if (type === "xaxis" && anno.x2 != null) {
      rect = w.dom.baseEl.querySelector(".apexcharts-annotation-rect." + anno.id);
      if (rect) {
        const r2 = rect.getBoundingClientRect();
        if (Math.abs(ev.clientX - r2.left) <= EDGE_PX) mode = "resize-x1";
        else if (Math.abs(ev.clientX - r2.right) <= EDGE_PX) mode = "resize-x2";
        origX = parseFloat(rect.getAttribute("x")) || 0;
        origW = parseFloat(rect.getAttribute("width")) || 0;
      }
    }
    this._drag = {
      type,
      index,
      anno,
      els: Array.from(w.dom.baseEl.querySelectorAll("." + anno.id)),
      mode,
      rect,
      origX,
      origW,
      startX: ev.clientX,
      startY: ev.clientY,
      scaleX: ctm && ctm.a ? ctm.a : 1,
      scaleY: ctm && ctm.d ? ctm.d : 1,
      dxPixel: 0,
      dyPixel: 0,
      moved: false
    };
    doc.addEventListener("mousemove", this._onMove);
    doc.addEventListener("touchmove", this._onMove, { passive: false });
    doc.addEventListener("mouseup", this._onUp);
    doc.addEventListener("touchend", this._onUp);
  }
  /** @param {any} me */
  _onMove(me2) {
    const d = this._drag;
    if (!d) return;
    if (me2.cancelable) me2.preventDefault();
    const mev = me2.type === "touchmove" ? me2.touches[0] : me2;
    d.dxPixel = (mev.clientX - d.startX) / d.scaleX;
    d.dyPixel = (mev.clientY - d.startY) / d.scaleY;
    if (Math.abs(d.dxPixel) > CLICK_SLOP_PX || Math.abs(d.dyPixel) > CLICK_SLOP_PX) {
      d.moved = true;
    }
    if (d.mode === "move") {
      const t2 = `translate(${d.dxPixel} ${d.dyPixel})`;
      d.els.forEach((el) => el.setAttribute("transform", t2));
    } else if (d.rect) {
      if (d.mode === "resize-x1") {
        d.rect.setAttribute("x", d.origX + d.dxPixel);
        d.rect.setAttribute("width", Math.max(1, d.origW - d.dxPixel));
      } else if (d.mode === "resize-x2") {
        d.rect.setAttribute("width", Math.max(1, d.origW + d.dxPixel));
      }
    }
  }
  _onUp() {
    const d = this._drag;
    this._drag = null;
    this._teardownDocListeners();
    if (!d || !d.moved) {
      if (d) {
        d.els.forEach((el) => el.removeAttribute("transform"));
        this._startEdit(d.type, d.index);
      }
      return;
    }
    const anno = this._annoList(d.type)[d.index];
    if (!anno) return;
    this._applyDelta(d, anno);
    d.els.forEach((el) => el.removeAttribute("transform"));
    this._redrawAnno(d.type, anno, d.index);
    this._checkpoint("ink:drag");
    this._fireDragged(d.type, anno, d.index);
  }
  /**
   * Record a Rewind (undo) checkpoint for an ink edit. Targeted redraws fire no
   * 'updated' event, so History would otherwise miss them. No-op when the
   * history feature is absent or disabled.
   * @param {string} label
   */
  _checkpoint(label2) {
    var _a, _b;
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, label2);
  }
  /**
   * Mutate the annotation's config from the pixel drag delta (type + mode aware).
   * @param {any} d @param {any} anno
   */
  _applyDelta(d, anno) {
    const w = this.w;
    const dxData = w.layout.gridWidth ? d.dxPixel * (w.globals.xRange / w.layout.gridWidth) : 0;
    if (d.type === "point") {
      const { newX, newY } = this._invertPoint(anno, d.dxPixel, d.dyPixel);
      anno.x = this._snapX(newX);
      if (newY != null) {
        const yi = anno.yAxisIndex || 0;
        const map = w.globals.seriesYAxisMap;
        anno.y = this._snapY(newY, map && map[yi] ? map[yi][0] : 0);
      }
      return;
    }
    if (d.type === "xaxis") {
      if (typeof anno.x !== "number") return;
      if (d.mode === "move") {
        if (typeof anno.x2 === "number") {
          anno.x += dxData;
          anno.x2 += dxData;
        } else {
          anno.x = this._snapX(anno.x + dxData);
        }
      } else if (d.mode === "resize-x1" || d.mode === "resize-x2") {
        const xIsLeft = anno.x2 == null || anno.x <= anno.x2;
        const grow = d.mode === "resize-x2" ? !xIsLeft : xIsLeft;
        if (grow) anno.x = this._snapX(anno.x + dxData);
        else if (typeof anno.x2 === "number") anno.x2 = this._snapX(anno.x2 + dxData);
      }
      return;
    }
    if (d.type === "yaxis") {
      const yi = anno.yAxisIndex || 0;
      const map = w.globals.seriesYAxisMap;
      const si = map && map[yi] ? map[yi][0] : 0;
      const yRange = w.globals.yRange ? w.globals.yRange[si] : null;
      if (yRange == null || !w.layout.gridHeight) return;
      const dyData = -d.dyPixel * (yRange / w.layout.gridHeight);
      if (typeof anno.y2 === "number") {
        if (typeof anno.y === "number") anno.y += dyData;
        anno.y2 += dyData;
      } else if (typeof anno.y === "number") {
        anno.y = this._snapY(anno.y + dyData, si);
      }
    }
  }
  /**
   * Invert a pixel drag delta to a point annotation's data x/y.
   * @param {any} anno @param {number} dxPixel @param {number} dyPixel
   * @returns {{newX:any, newY:any}}
   */
  _invertPoint(anno, dxPixel, dyPixel) {
    const w = this.w;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    let newX = anno.x;
    if (!categoryX && typeof anno.x === "number" && w.layout.gridWidth) {
      newX = anno.x + dxPixel * (w.globals.xRange / w.layout.gridWidth);
    }
    let newY = anno.y;
    const yi = anno.yAxisIndex || 0;
    const map = w.globals.seriesYAxisMap;
    const si = map && map[yi] ? map[yi][0] : 0;
    const yRange = w.globals.yRange ? w.globals.yRange[si] : null;
    const logY = w.config.yaxis[yi] && w.config.yaxis[yi].logarithmic;
    if (typeof anno.y === "number" && yRange != null && !logY && w.layout.gridHeight) {
      newY = anno.y - dyPixel * (yRange / w.layout.gridHeight);
    }
    return { newX, newY };
  }
  /**
   * Targeted redraw of one annotation: drop its elements and re-add the shape +
   * label + label background at the current config coordinates (no full chart
   * re-render, and repeat-safe unlike updateOptions({})).
   * @param {string} type @param {any} anno @param {number} index
   */
  _redrawAnno(type, anno, index) {
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const annotations = this.ctx.annotations;
    if (!baseEl || !annotations) return;
    baseEl.querySelectorAll("." + anno.id).forEach((el) => el.remove());
    const group2 = baseEl.querySelector(".apexcharts-" + type + "-annotations");
    if (!group2) return;
    if (type === "point" && annotations.pointsAnnotations) {
      annotations.pointsAnnotations.addPointAnnotation(anno, group2, index);
    } else if (type === "xaxis" && annotations.xAxisAnnotations) {
      annotations.xAxisAnnotations.addXaxisAnnotation(anno, group2, index);
    } else if (type === "yaxis" && annotations.yAxisAnnotations) {
      annotations.yAxisAnnotations.addYaxisAnnotation(anno, group2, index);
    }
    const labelEl = baseEl.querySelector(
      ".apexcharts-" + type + "-annotation-label." + anno.id
    );
    if (labelEl && annotations.helpers && anno.label && anno.label.text) {
      const elRect = annotations.helpers.addBackgroundToAnno(labelEl, anno);
      if (elRect && labelEl.parentNode) {
        labelEl.parentNode.insertBefore(elRect.node, labelEl);
      }
    }
    this._attach();
  }
  /**
   * Dispatch an ink annotation lifecycle event both to the user callback
   * (`chart.events[name]`) and the internal event bus, in that order.
   * @param {string} name @param {any} args
   */
  _fireAnnotationEvent(name, args) {
    var _a;
    const events = this.w.config.chart.events;
    if (typeof events[name] === "function") {
      events[name](this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent(name, [this.ctx, args]);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDragged(type, anno, index) {
    const args = { type, id: anno.id, index, x: anno.x, y: anno.y };
    if (anno.x2 != null) args.x2 = anno.x2;
    if (anno.y2 != null) args.y2 = anno.y2;
    this._fireAnnotationEvent("annotationDragged", args);
  }
  // ─── P3: click-to-create ─────────────────────────────────────────────────
  /**
   * Enter create mode: the next click on the plot area drops a new draggable
   * point annotation there and opens its label editor.
   */
  startCreate() {
    if (this._creating) return;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (!svg) return;
    this._creating = true;
    svg.style.cursor = "crosshair";
    svg.addEventListener("click", this._onCreateClick, true);
    this._syncPalette();
  }
  /** Leave create mode. */
  stopCreate() {
    if (!this._creating) return;
    this._creating = false;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (svg) {
      svg.style.cursor = "";
      svg.removeEventListener("click", this._onCreateClick, true);
    }
    this._syncPalette();
  }
  /** @param {any} e */
  _onCreateClick(e2) {
    if (!this._creating) return;
    e2.preventDefault();
    e2.stopPropagation();
    const pos = this._pixelToData(e2.clientX, e2.clientY);
    this.stopCreate();
    if (!pos) return;
    this.createAt(pos.x, pos.y);
  }
  /**
   * Create a draggable note at data coordinates and open its editor card.
   * Public: the context menu's "Add note here" routes here so its notes are
   * config-backed too, and thus draggable, editable, persistable and undoable.
   * @param {any} x @param {any} y @param {{text?: string}} [opts]
   * @returns {any} the created annotation config
   */
  createAt(x2, y, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const anno = Utils.extend(new Options().pointAnnotation, {
      x: x2,
      y,
      id,
      owner: OWNER,
      draggable: true,
      label: { text: opts.text || "Note" }
    });
    if (!w.config.annotations) w.config.annotations = {};
    if (!Array.isArray(w.config.annotations.points)) w.config.annotations.points = [];
    w.config.annotations.points.push(anno);
    const index = w.config.annotations.points.length - 1;
    this._redrawAnno("point", anno, index);
    this._checkpoint("ink:create");
    this._fireCreated("point", anno, index);
    this._startEdit("point", index, { select: true });
    return anno;
  }
  /**
   * Create a draggable dashed LINE annotation at a data value and open its
   * editor card: axis 'x' drops a vertical line at a data x, axis 'y' a
   * horizontal line at a data y. Public: the context menu's "Annotate here"
   * routes here so its lines are config-backed too, and thus draggable,
   * editable, persistable and undoable. Lines only: x2/y2 are never set, so
   * this can never produce a range rectangle.
   * @param {'x'|'y'} axis @param {any} val
   * @param {{text?: string, strokeDashArray?: number, color?: string, select?: boolean}} [opts]
   * @returns {any} the created annotation config
   */
  createLineAt(axis, val, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const type = axis === "y" ? "yaxis" : "xaxis";
    const defaults = type === "yaxis" ? new Options().yAxisAnnotation : new Options().xAxisAnnotation;
    const over = {
      id,
      owner: OWNER,
      draggable: true,
      strokeDashArray: opts.strokeDashArray != null ? opts.strokeDashArray : 4,
      label: { text: opts.text || "" }
    };
    if (opts.color) {
      over.borderColor = opts.color;
      over.label.borderColor = opts.color;
    }
    if (type === "yaxis") over.y = val;
    else over.x = val;
    const anno = Utils.extend(defaults, over);
    if (!w.config.annotations) w.config.annotations = {};
    if (!Array.isArray(w.config.annotations[type])) w.config.annotations[type] = [];
    w.config.annotations[type].push(anno);
    const index = w.config.annotations[type].length - 1;
    this._redrawAnno(type, anno, index);
    this._checkpoint("ink:create");
    this._fireCreated(type, anno, index);
    if (opts.select !== false) this._startEdit(type, index, { select: true });
    return anno;
  }
  /**
   * Convert a client-space point to data coordinates (absolute, for create).
   * @param {number} clientX @param {number} clientY
   * @returns {{x:any, y:any}|null}
   */
  _pixelToData(clientX, clientY) {
    const w = this.w;
    if (!w.globals.axisCharts || !w.dom.baseEl || !w.dom.baseEl.querySelector(".apexcharts-svg")) {
      return null;
    }
    const g = TooltipUtils.plotRect(w);
    if (!g.width || !g.height) return null;
    const fx = (clientX - g.left) / g.width;
    const fy = (clientY - g.top) / g.height;
    const minX = w.globals.minX;
    const xRange = w.globals.xRange;
    const minY = w.globals.minYArr && w.globals.minYArr[0] != null ? w.globals.minYArr[0] : w.globals.minY;
    const yRange = w.globals.yRange && w.globals.yRange[0] != null ? w.globals.yRange[0] : w.globals.maxY - w.globals.minY;
    let x2 = minX + fx * xRange;
    const y = minY + (1 - fy) * yRange;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    if (categoryX) x2 = Math.round(x2);
    return { x: x2, y };
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireCreated(type, anno, index) {
    const args = { type, id: anno.id, index };
    if (typeof anno.x !== "undefined") args.x = anno.x;
    if (typeof anno.y !== "undefined") args.y = anno.y;
    this._fireAnnotationEvent("annotationCreated", args);
  }
  // ─── P3: tool palette ────────────────────────────────────────────────────
  /** Render a minimal "add note" toggle into the chart wrap (once per render). */
  _renderPalette() {
    const w = this.w;
    const elWrap = w.dom.elWrap;
    if (!elWrap || elWrap.querySelector(".apexcharts-ink-palette")) return;
    const doc = elWrap.ownerDocument;
    const bar = doc.createElement("div");
    bar.className = "apexcharts-ink-palette";
    const s2 = bar.style;
    s2.position = "absolute";
    s2.top = "6px";
    s2.left = "6px";
    s2.zIndex = "15";
    const btn = doc.createElement("button");
    btn.type = "button";
    btn.className = "apexcharts-ink-add";
    btn.textContent = "+ Note";
    const bs = btn.style;
    bs.cursor = "pointer";
    bs.font = "12px sans-serif";
    bs.padding = "4px 9px";
    bs.borderRadius = "5px";
    bs.border = "1px solid #6366f1";
    bs.color = "#4338ca";
    bs.background = "#fff";
    btn.addEventListener("click", (e2) => {
      e2.stopPropagation();
      if (this._creating) this.stopCreate();
      else this.startCreate();
    });
    bar.appendChild(btn);
    elWrap.appendChild(bar);
    this._syncPalette();
  }
  /** Reflect create-mode state on the palette button. */
  _syncPalette() {
    const elWrap = this.w.dom.elWrap;
    const btn = (
      /** @type {any} */
      elWrap && elWrap.querySelector(".apexcharts-ink-add")
    );
    if (!btn) return;
    if (this._creating) {
      btn.style.background = "#6366f1";
      btn.style.color = "#fff";
      btn.textContent = "Click chart...";
    } else {
      btn.style.background = "#fff";
      btn.style.color = "#4338ca";
      btn.textContent = "+ Note";
    }
  }
  // ─── P2 + P6: the floating note editor card ──────────────────────────────
  // Click (or double-click) an ink-managed annotation to open a small card
  // anchored to it: rename inline, recolor via accent swatches, toggle bold,
  // step the font size, size/reshape the marker (points), or delete the note.
  /** @returns {string[]} the accent swatches offered by the editor */
  _noteColors() {
    const ink = this.w.config.chart.ink;
    return ink && Array.isArray(ink.noteColors) && ink.noteColors.length ? ink.noteColors : NOTE_COLORS;
  }
  /**
   * Perceived-luminance check so text/border contrast follows the accent.
   * @param {string} hex
   */
  static _isLight(hex) {
    const h = String(hex || "").replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n2 = parseInt(full, 16);
    if (isNaN(n2) || full.length !== 6) return false;
    const r2 = n2 >> 16 & 255;
    const g = n2 >> 8 & 255;
    const b = n2 & 255;
    return (0.299 * r2 + 0.587 * g + 0.114 * b) / 255 > 0.72;
  }
  /** @param {any} style */
  static _isBold(style) {
    const fw = style && style.fontWeight;
    return fw === "bold" || parseInt(String(fw), 10) >= 600;
  }
  /**
   * Small icon/text button for the editor card. mousedown is prevented so the
   * text input keeps focus while formatting.
   * @param {any} doc @param {string} content @param {string} title
   * @param {Function} onClick @param {string} [extraClass] @param {boolean} [isSvg]
   */
  _cardBtn(doc, content, title, onClick, extraClass, isSvg) {
    const b = doc.createElement("button");
    b.type = "button";
    b.className = "apexcharts-ink-btn" + (extraClass ? " " + extraClass : "");
    b.title = title;
    b.setAttribute("aria-label", title);
    if (isSvg) b.innerHTML = content;
    else b.textContent = content;
    b.addEventListener("mousedown", (e2) => e2.preventDefault());
    b.addEventListener("click", (e2) => {
      e2.stopPropagation();
      onClick();
    });
    return b;
  }
  /**
   * Uppercase row caption ("Label" / "Line" / "Marker") for the editor card.
   * @param {any} doc @param {string} text
   */
  _cardLabel(doc, text) {
    const lab = doc.createElement("span");
    lab.className = "apexcharts-ink-cardlabel";
    lab.textContent = text;
    return lab;
  }
  /**
   * Color swatch button for the editor card. mousedown is prevented so the
   * text input keeps focus while restyling.
   * @param {any} doc @param {string} c
   * @param {(c: string) => void} pick @param {string} [extraClass]
   */
  _mkSwatch(doc, c, pick, extraClass) {
    const sw = doc.createElement("button");
    sw.type = "button";
    sw.className = "apexcharts-ink-swatch" + (extraClass ? " " + extraClass : "");
    sw.title = c;
    sw.setAttribute("aria-label", "Color " + c);
    sw.dataset.color = c;
    sw.style.background = c;
    sw.addEventListener("mousedown", (e2) => e2.preventDefault());
    sw.addEventListener("click", (e2) => {
      e2.stopPropagation();
      pick(c);
    });
    return sw;
  }
  /**
   * Open the floating editor card for an annotation.
   * @param {string} type @param {number} index
   * @param {{select?: boolean}} [opts] select: preselect the text (create / dblclick)
   */
  _startEdit(type, index, opts = {}) {
    const w = this.w;
    const anno = this._annoList(type)[index];
    const baseEl = w.dom.baseEl;
    const elWrap = w.dom.elWrap;
    if (!anno || !anno.id || !baseEl || !elWrap) return;
    this._closeEditor(false);
    const doc = baseEl.ownerDocument;
    const card = doc.createElement("div");
    card.className = "apexcharts-ink-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-label", "Edit note");
    card.style.visibility = "hidden";
    const rowText = doc.createElement("div");
    rowText.className = "apexcharts-ink-card-row";
    const input = doc.createElement("input");
    input.type = "text";
    input.className = "apexcharts-ink-editor";
    input.placeholder = "Note text";
    input.value = anno.label && anno.label.text || "";
    rowText.appendChild(input);
    rowText.appendChild(
      this._cardBtn(
        doc,
        TRASH_ICON,
        "Delete note",
        () => this._deleteAnno(),
        "apexcharts-ink-btn--delete",
        true
      )
    );
    card.appendChild(rowText);
    const rowStyle = doc.createElement("div");
    rowStyle.className = "apexcharts-ink-card-row";
    if (type !== "point") {
      rowStyle.appendChild(this._cardLabel(doc, "Label"));
    }
    this._noteColors().forEach((c) => {
      rowStyle.appendChild(this._mkSwatch(doc, c, (col) => this._applyColor(col)));
    });
    const sep = doc.createElement("span");
    sep.className = "apexcharts-ink-sep";
    rowStyle.appendChild(sep);
    rowStyle.appendChild(
      this._cardBtn(doc, "B", "Bold", () => this._toggleBold(), "apexcharts-ink-btn--bold")
    );
    rowStyle.appendChild(this._cardBtn(doc, "A-", "Smaller text", () => this._stepFont(-1)));
    rowStyle.appendChild(this._cardBtn(doc, "A+", "Larger text", () => this._stepFont(1)));
    card.appendChild(rowStyle);
    if (type !== "point") {
      const rowLine = doc.createElement("div");
      rowLine.className = "apexcharts-ink-card-row";
      rowLine.appendChild(this._cardLabel(doc, "Line"));
      this._noteColors().forEach((c) => {
        rowLine.appendChild(
          this._mkSwatch(
            doc,
            c,
            (col) => this._applyLineColor(col),
            "apexcharts-ink-swatch--line"
          )
        );
      });
      card.appendChild(rowLine);
    }
    if (type === "point") {
      const rowMarker = doc.createElement("div");
      rowMarker.className = "apexcharts-ink-card-row";
      rowMarker.appendChild(this._cardLabel(doc, "Marker"));
      rowMarker.appendChild(
        this._cardBtn(doc, "-", "Smaller marker", () => this._stepMarker(-1))
      );
      const sizeOut = doc.createElement("span");
      sizeOut.className = "apexcharts-ink-marker-size";
      rowMarker.appendChild(sizeOut);
      rowMarker.appendChild(
        this._cardBtn(doc, "+", "Larger marker", () => this._stepMarker(1))
      );
      rowMarker.appendChild(
        this._cardBtn(
          doc,
          SHAPE_GLYPHS.circle,
          "Marker shape",
          () => this._cycleShape(),
          "apexcharts-ink-btn--shape"
        )
      );
      card.appendChild(rowMarker);
    }
    elWrap.appendChild(card);
    this._editor = { card, input, type, index };
    this._positionCard();
    this._syncCard();
    card.style.visibility = "";
    input.focus();
    if (opts.select) input.select();
    card.addEventListener("keydown", (e2) => {
      if (e2.key === "Escape") {
        e2.preventDefault();
        e2.stopPropagation();
        this._closeEditor(false);
      } else if (e2.key === "Enter" && e2.target === input) {
        e2.preventDefault();
        this._closeEditor(true);
      }
    });
    doc.addEventListener("mousedown", this._onDocDownEditor, true);
    doc.addEventListener("touchstart", this._onDocDownEditor, true);
  }
  /**
   * Commit + close on any press outside the card.
   * @param {any} e
   */
  _onDocDownEditor(e2) {
    const ed = this._editor;
    if (!ed || ed.card.contains(e2.target)) return;
    this._closeEditor(true);
  }
  /**
   * Anchor the card to the annotation's label (below it, or above when there
   * is no room), clamped inside the chart wrap. Re-run after each restyle
   * since the label rect changes.
   */
  _positionCard() {
    const ed = this._editor;
    if (!ed) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const elWrap = w.dom.elWrap;
    const anno = this._annoList(ed.type)[ed.index];
    if (!baseEl || !elWrap || !anno) return;
    const anchor = baseEl.querySelector(
      ".apexcharts-" + ed.type + "-annotation-label." + anno.id
    ) || baseEl.querySelector("." + anno.id);
    if (!anchor) return;
    const wrapRect = elWrap.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    const cw = ed.card.offsetWidth;
    const ch = ed.card.offsetHeight;
    let left = Math.round(aRect.left - wrapRect.left);
    let top = Math.round(aRect.bottom - wrapRect.top) + 8;
    if (top + ch > elWrap.clientHeight - 4) {
      top = Math.round(aRect.top - wrapRect.top) - ch - 8;
    }
    if (left + cw > elWrap.clientWidth - 4) left = elWrap.clientWidth - cw - 4;
    ed.card.style.left = Math.max(4, left) + "px";
    ed.card.style.top = Math.max(4, top) + "px";
  }
  /** Reflect the annotation's current style on the card controls. */
  _syncCard() {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    const style = anno.label && anno.label.style || {};
    const bg = String(style.background || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch:not(.apexcharts-ink-swatch--line)").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === bg
      );
    });
    const stroke2 = String(anno.borderColor || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch--line").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === stroke2
      );
    });
    const boldBtn = ed.card.querySelector(".apexcharts-ink-btn--bold");
    if (boldBtn) {
      boldBtn.classList.toggle("apexcharts-ink-btn--active", InkLayer._isBold(style));
    }
    const m = anno.marker || {};
    const sizeOut = ed.card.querySelector(".apexcharts-ink-marker-size");
    if (sizeOut) {
      sizeOut.textContent = String(typeof m.size === "number" ? m.size : 4);
    }
    const shapeBtn = ed.card.querySelector(".apexcharts-ink-btn--shape");
    if (shapeBtn) {
      shapeBtn.textContent = SHAPE_GLYPHS[m.shape] || SHAPE_GLYPHS.circle;
    }
  }
  /**
   * Commit the input's text into the annotation (the card stays open). Also
   * runs before any style apply so typed-but-unconfirmed text survives the
   * redraw.
   * @param {any} ed
   */
  _commitTextOf(ed) {
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    const text = ed.input.value;
    if (!anno.label) anno.label = {};
    if (anno.label.text === text) return;
    anno.label.text = text;
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint("ink:edit");
    this._fireEdited(ed.type, anno, ed.index);
  }
  /**
   * Close the editor card. commit=true also commits the pending text. Style
   * edits apply immediately and are not rolled back by Escape; use undo.
   * @param {boolean} commit
   */
  _closeEditor(commit) {
    const ed = this._editor;
    if (!ed) return;
    this._editor = null;
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
    if (doc) {
      doc.removeEventListener("mousedown", this._onDocDownEditor, true);
      doc.removeEventListener("touchstart", this._onDocDownEditor, true);
    }
    if (ed.card.parentNode) ed.card.parentNode.removeChild(ed.card);
    if (commit) this._commitTextOf(ed);
  }
  /**
   * Apply a config mutation from a card control: commit pending text, mutate,
   * redraw, checkpoint for undo, then refresh + re-anchor the card.
   * @param {string} label @param {(anno: any) => void} mutate
   */
  _applyStyle(label2, mutate) {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    this._commitTextOf(ed);
    if (!anno.label) anno.label = {};
    if (!anno.label.style) anno.label.style = {};
    mutate(anno);
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint(label2);
    this._fireStyled(ed.type, anno, ed.index);
    this._syncCard();
    this._positionCard();
  }
  /**
   * Apply an accent color: label chip + marker (points) or line/range fill
   * (axis annotations), with text/border contrast following the luminance.
   * @param {string} c
   */
  _applyColor(c) {
    const ed = this._editor;
    if (!ed) return;
    const light = InkLayer._isLight(c);
    this._applyStyle("ink:style", (anno) => {
      anno.label.style.background = c;
      anno.label.style.color = light ? "#334155" : "#ffffff";
      anno.label.borderColor = light ? "#cbd5e1" : c;
      if (ed.type === "point") {
        if (!anno.marker) anno.marker = {};
        anno.marker.strokeColor = light ? "#334155" : c;
        anno.marker.fillColor = light ? "#ffffff" : c;
      }
    });
  }
  /**
   * Line-stroke color for axis annotations, separate from the label chip.
   * @param {string} c
   */
  _applyLineColor(c) {
    const ed = this._editor;
    if (!ed || ed.type === "point") return;
    this._applyStyle("ink:style", (anno) => {
      anno.borderColor = c;
      if (anno.x2 != null || anno.y2 != null) anno.fillColor = c;
    });
  }
  /**
   * Step the label font size through the preset scale.
   * @param {number} dir
   */
  _stepFont(dir) {
    this._applyStyle("ink:style", (anno) => {
      const cur = parseFloat(anno.label.style.fontSize) || 11;
      let i2 = 0;
      for (let k2 = 1; k2 < FONT_STEPS.length; k2++) {
        if (Math.abs(FONT_STEPS[k2] - cur) < Math.abs(FONT_STEPS[i2] - cur)) i2 = k2;
      }
      i2 = Math.min(FONT_STEPS.length - 1, Math.max(0, i2 + dir));
      anno.label.style.fontSize = FONT_STEPS[i2] + "px";
    });
  }
  _toggleBold() {
    this._applyStyle("ink:style", (anno) => {
      anno.label.style.fontWeight = InkLayer._isBold(anno.label.style) ? 400 : 700;
    });
  }
  /**
   * Grow/shrink the point marker.
   * @param {number} dir
   */
  _stepMarker(dir) {
    this._applyStyle("ink:style", (anno) => {
      if (!anno.marker) anno.marker = {};
      const cur = typeof anno.marker.size === "number" ? anno.marker.size : 4;
      anno.marker.size = Math.min(14, Math.max(2, cur + dir));
    });
  }
  /** Cycle the point marker shape (circle, square, diamond, triangle). */
  _cycleShape() {
    this._applyStyle("ink:style", (anno) => {
      if (!anno.marker) anno.marker = {};
      const i2 = MARKER_SHAPES.indexOf(anno.marker.shape);
      anno.marker.shape = MARKER_SHAPES[(i2 + 1) % MARKER_SHAPES.length];
    });
  }
  /** Delete the annotation the editor is open on (undoable via Rewind). */
  _deleteAnno() {
    const ed = this._editor;
    if (!ed) return;
    const list = this._annoList(ed.type);
    const anno = list[ed.index];
    this._closeEditor(false);
    if (!anno) return;
    const baseEl = this.w.dom.baseEl;
    if (baseEl && anno.id) {
      baseEl.querySelectorAll("." + anno.id).forEach((el) => el.remove());
    }
    list.splice(ed.index, 1);
    for (let i2 = ed.index; i2 < list.length; i2++) {
      this._redrawAnno(ed.type, list[i2], i2);
    }
    this._checkpoint("ink:delete");
    this._fireDeleted(ed.type, anno, ed.index);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireEdited(type, anno, index) {
    const args = { type, id: anno.id, index, text: anno.label ? anno.label.text : "" };
    this._fireAnnotationEvent("annotationEdited", args);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireStyled(type, anno, index) {
    const args = { type, id: anno.id, index, label: anno.label, marker: anno.marker };
    this._fireAnnotationEvent("annotationStyled", args);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDeleted(type, anno, index) {
    const args = { type, id: anno.id, index };
    this._fireAnnotationEvent("annotationDeleted", args);
  }
  // ─── lifecycle ────────────────────────────────────────────────────────────
  _teardownDocListeners() {
    const doc = this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
    if (!doc) return;
    doc.removeEventListener("mousemove", this._onMove);
    doc.removeEventListener("touchmove", this._onMove);
    doc.removeEventListener("mouseup", this._onUp);
    doc.removeEventListener("touchend", this._onUp);
  }
  teardown() {
    var _a, _b, _c, _d;
    this._teardownDocListeners();
    this._closeEditor(false);
    this.stopCreate();
    this._drag = null;
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "mounted", this._onRerender);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "updated", this._onRerender);
      this._wired = false;
    }
  }
}
ApexCharts__default.registerFeatures({ ink: InkLayer });
const PRICING_URL = "https://apexcharts.com/pricing";
const STATE_KEY = "__apexcharts_license_enforcer_v1__";
if (!/** @type {any} */
globalThis[STATE_KEY]) {
  globalThis[STATE_KEY] = {
    perspectivesTokenDecoded: false,
    enforced: /* @__PURE__ */ new Set()
  };
}
const state = (
  /** @type {any} */
  globalThis[STATE_KEY]
);
const enforced = state.enforced;
function markPerspectivesTokenDecoded() {
  state.perspectivesTokenDecoded = true;
  reevaluateLicenseAcrossCharts();
}
function premiumFeaturesInUse(w, ctx) {
  var _a;
  const chart = w && w.config && w.config.chart || {};
  const used = [];
  if (chart.type === "unit") used.push("unit");
  if (chart.requestedType === "raincloud") used.push("raincloud");
  if (ctx.trellis && typeof ctx.trellis.isActive === "function" && ctx.trellis.isActive()) {
    used.push("trellis");
  }
  if (ctx.storyboard && ctx.storyboard._used) used.push("storyboard");
  const link = chart.link;
  if (ctx.linkedViews && link && (link.enabled === true || typeof link.dimension === "function")) {
    used.push("link");
  }
  if (ctx.ink && chart.ink && chart.ink.enabled === true) used.push("ink");
  if (ctx.measure && chart.measure && chart.measure.enabled === true) {
    used.push("measure");
  }
  if (ctx.contextMenu && chart.contextMenu && chart.contextMenu.enabled === true) {
    used.push("context-menu");
  }
  if (ctx.perspectives && (ctx.perspectives._used || state.perspectivesTokenDecoded)) {
    used.push("perspectives");
  }
  if (ctx.history && chart.history && chart.history.enabled === true) {
    used.push("history");
  }
  if ((_a = ctx._highlightFilter) == null ? void 0 : _a.isActive()) used.push("highlight-filter");
  return used;
}
function resolveKey(w) {
  const perChart = w && w.config && w.config.chart && w.config.chart.license;
  if (perChart) return perChart;
  const singleton = o.getKey();
  if (singleton) return singleton;
  const apex = Environment.getApex();
  if (apex && apex.license) return apex.license;
  return null;
}
const PREMIUM_PLANS = /* @__PURE__ */ new Set(["premium", "enterprise"]);
function licensedForPremium(key) {
  if (!key) return false;
  const result = o.validateKey(key);
  if (!result.valid) return false;
  const plan = result.data && result.data.plan;
  return typeof plan === "string" && PREMIUM_PLANS.has(plan.toLowerCase());
}
function reinstateWatermark(ctx, elWrap) {
  const node = C.add(elWrap, { manage: false });
  if (!node || typeof MutationObserver === "undefined") return;
  if (ctx._wmNodeObserver && ctx._wmObservedNode === node) return;
  if (ctx._wmNodeObserver) ctx._wmNodeObserver.disconnect();
  const nodeObs = new MutationObserver(() => {
    const n2 = C.node(elWrap);
    if (!n2) return;
    nodeObs.disconnect();
    C.applyStyles(n2);
    nodeObs.takeRecords();
    nodeObs.observe(n2, { attributes: true, attributeFilter: ["style"] });
  });
  nodeObs.observe(node, { attributes: true, attributeFilter: ["style"] });
  ctx._wmNodeObserver = nodeObs;
  ctx._wmObservedNode = node;
}
function addWatermark(ctx, elWrap) {
  reinstateWatermark(ctx, elWrap);
  if (typeof MutationObserver === "undefined" || ctx._wmWrapObserver) return;
  const wrapObs = new MutationObserver(() => {
    if (!C.node(elWrap)) reinstateWatermark(ctx, elWrap);
  });
  wrapObs.observe(elWrap, { childList: true });
  ctx._wmWrapObserver = wrapObs;
}
function teardownWatermark(ctx, elWrap) {
  if (ctx._wmWrapObserver) {
    ctx._wmWrapObserver.disconnect();
    ctx._wmWrapObserver = null;
  }
  if (ctx._wmNodeObserver) {
    ctx._wmNodeObserver.disconnect();
    ctx._wmNodeObserver = null;
  }
  ctx._wmObservedNode = null;
  const wrap = elWrap || ctx.w && ctx.w.dom && ctx.w.dom.elWrap;
  if (wrap) C.remove(wrap, { manage: false });
}
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return;
  ctx._premiumLicenseNotified = true;
  const many = features.length > 1;
  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${many ? "s" : ""} in use (${features.join(", ")}) without a license. Running in trial mode with a watermark. Get a license: ${PRICING_URL}`
    );
    return;
  }
  const result = o.validateKey(key);
  if (result.valid) {
    const plan = result.data && result.data.plan || "current";
    console.warn(
      `[ApexCharts] Premium feature${many ? "s" : ""} in use (${features.join(", ")}) require a Premium or Enterprise license; the ${plan} plan does not include ${many ? "them" : "it"}. Running in trial mode with a watermark. Upgrade: ${PRICING_URL}`
    );
    return;
  }
  if (key !== o.getKey()) {
    console.error(`[Apex] ${result.message}`);
  }
}
function enforceLicense(w, ctx) {
  try {
    if (!Environment.isBrowser()) return;
    if (w && w.globals && w.globals.isDestroyed) {
      enforced.delete(ctx);
      return;
    }
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!elWrap) return;
    const features = premiumFeaturesInUse(w, ctx);
    if (features.length === 0) {
      enforced.delete(ctx);
      teardownWatermark(ctx, elWrap);
      return;
    }
    enforced.add(ctx);
    const key = resolveKey(w);
    if (licensedForPremium(key)) {
      teardownWatermark(ctx, elWrap);
      return;
    }
    addWatermark(ctx, elWrap);
    notifyTrial(ctx, key, features);
  } catch (e2) {
  }
}
function reevaluateLicenseAcrossCharts() {
  if (!Environment.isBrowser()) return;
  const visited = /* @__PURE__ */ new Set();
  const apex = Environment.getApex();
  const instances = apex && apex._chartInstances;
  if (Array.isArray(instances)) {
    instances.forEach((entry) => {
      const chart = entry && entry.chart;
      if (chart && chart.w && !chart.w.globals.isDestroyed) {
        visited.add(chart);
        enforceLicense(chart.w, chart);
      }
    });
  }
  Array.from(enforced).forEach((ctx) => {
    const w = ctx && ctx.w;
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!w || w.globals.isDestroyed || !elWrap || elWrap.isConnected === false) {
      enforced.delete(ctx);
      return;
    }
    if (visited.has(ctx)) return;
    enforceLicense(w, ctx);
  });
}
o.onChange(reevaluateLicenseAcrossCharts);
class Storyboard {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._beats = [];
    this._observer = null;
    this._activeIndex = -1;
    this._animate = true;
    this._warnedNoPerspectives = false;
    this._used = false;
  }
  /**
   * Bind beats to scroll position. Rebinding replaces the previous binding.
   * @param {{
   *   beats?: Array<{ el?: Element, selector?: string, key?: string, view?: any, announce?: string, onEnter?: (chart: any, info: StoryboardBeatInfo) => void }>,
   *   scroller?: Element | string,
   *   offset?: number,
   *   animate?: boolean,
   * }} [opts]
   * @returns {number} the number of beats bound
   */
  bind(opts = {}) {
    var _a;
    this.unbind();
    if (!Environment.isBrowser()) return 0;
    const doc = this.ctx.el && this.ctx.el.ownerDocument;
    if (!doc || typeof IntersectionObserver === "undefined") return 0;
    let root = null;
    if (opts.scroller) {
      root = typeof opts.scroller === "string" ? doc.querySelector(opts.scroller) : opts.scroller;
    }
    this._beats = this._resolveBeats(doc, root, opts.beats);
    if (!this._beats.length) return 0;
    this._animate = opts.animate !== false;
    const offset = Math.min(Math.max((_a = opts.offset) != null ? _a : 0.5, 0), 1);
    const top = +(offset * 100).toFixed(3);
    const bottom = +(100 - offset * 100).toFixed(3);
    this._observer = new IntersectionObserver(
      (entries) => this._onIntersect(entries),
      { root, rootMargin: `-${top}% 0px -${bottom}%`, threshold: 0 }
    );
    this._beats.forEach((b) => {
      var _a2;
      return (_a2 = this._observer) == null ? void 0 : _a2.observe(b.el);
    });
    this._used = true;
    enforceLicense(this.w, this.ctx);
    return this._beats.length;
  }
  /**
   * Normalize the beats option, or auto-discover [data-apex-beat] elements in
   * document order when no explicit list is given.
   * @param {Document} doc
   * @param {Element | null} root
   * @param {Array<any>} [beatsOpt]
   * @returns {StoryboardBeat[]}
   * @private
   */
  _resolveBeats(doc, root, beatsOpt) {
    const beats = [];
    if (Array.isArray(beatsOpt)) {
      beatsOpt.forEach((b, i2) => {
        var _a, _b;
        if (!b) return;
        const el = b.el && typeof b.el === "object" ? b.el : b.selector ? doc.querySelector(b.selector) : null;
        if (!el) {
          console.warn(
            `apexcharts: storyboard beat ${i2} has no resolvable element; skipped.`
          );
          return;
        }
        beats.push({
          el,
          key: (_b = (_a = b.key) != null ? _a : el.getAttribute("data-apex-beat")) != null ? _b : String(i2),
          view: b.view,
          options: b.options,
          announce: b.announce,
          onEnter: typeof b.onEnter === "function" ? b.onEnter : void 0
        });
      });
      return beats;
    }
    const scope = root || doc;
    scope.querySelectorAll("[data-apex-beat]").forEach((el, i2) => {
      beats.push({
        el,
        key: el.getAttribute("data-apex-beat") || String(i2),
        view: el.getAttribute("data-apex-view") || void 0,
        options: void 0,
        announce: el.getAttribute("data-apex-announce") || void 0,
        onEnter: void 0
      });
    });
    return beats;
  }
  /**
   * @param {IntersectionObserverEntry[]} entries
   * @private
   */
  _onIntersect(entries) {
    entries.forEach((entry) => {
      const idx = this._beats.findIndex((b) => b.el === entry.target);
      if (idx < 0) return;
      if (entry.isIntersecting) {
        this._activate(idx);
      } else if (idx === this._activeIndex && entry.rootBounds) {
        if (entry.boundingClientRect.top >= entry.rootBounds.bottom && idx > 0) {
          this._activate(idx - 1);
        }
      }
    });
  }
  /**
   * Activate a beat: apply its view token, run its callback, announce it and
   * fire `beatChange`. Idempotent per beat (re-activating the current beat is
   * a no-op), so IO chatter never re-applies a view.
   * @param {number} idx
   * @param {{ animate?: boolean }} [opts]
   * @private
   */
  _activate(idx, opts = {}) {
    var _a, _b;
    if (idx === this._activeIndex) return;
    const beat = this._beats[idx];
    if (!beat) return;
    const direction = idx > this._activeIndex ? "down" : "up";
    this._activeIndex = idx;
    const animate = (opts.animate !== void 0 ? opts.animate : this._animate) && !prefersReducedMotion();
    if (beat.view != null || beat.options) {
      if (this.ctx.perspectives) {
        const v = (_a = beat.view) != null ? _a : {};
        const token = typeof v === "string" || v.view ? v : { view: this._normalizeView(v) };
        this.ctx.perspectives.apply(token, {
          animate,
          mergeOptions: beat.options
        });
      } else if (!this._warnedNoPerspectives) {
        this._warnedNoPerspectives = true;
        console.warn(
          'apexcharts: storyboard beats carry views but the perspectives feature is not bundled. import "apexcharts/features/storyboard" (which includes it) or drive beats via onEnter.'
        );
      }
    }
    const info2 = { index: idx, key: beat.key, el: beat.el, direction };
    if (beat.onEnter) beat.onEnter(this.ctx, info2);
    if (beat.announce) this._announce(beat.announce);
    if (typeof this.w.config.chart.events.beatChange === "function") {
      this.w.config.chart.events.beatChange(this.ctx, info2);
    }
    (_b = this.ctx.events) == null ? void 0 : _b.fireEvent("beatChange", [this.ctx, info2]);
  }
  /**
   * Fill in the parts of a hand-authored (bare) ViewState that would
   * otherwise LEAK between beats. updateOptions merges objects, so a beat
   * listing only xaxis annotations would keep a previous beat's point
   * annotations; padding every annotation kind with an empty array makes
   * each beat fully describe its own state, which is what allows scrubbing
   * in both directions. Full tokens (from capture()/encode()) already carry
   * the complete set and never pass through here.
   * @param {any} view
   * @returns {any}
   * @private
   */
  _normalizeView(view) {
    const provided = view.annotations && view.annotations.static || {};
    return __spreadProps(__spreadValues({}, view), {
      annotations: {
        static: __spreadValues({
          points: [],
          xaxis: [],
          yaxis: [],
          texts: [],
          images: []
        }, provided),
        dynamic: view.annotations && view.annotations.dynamic || []
      }
    });
  }
  /**
   * Programmatically jump to a beat by index or author key (also usable
   * without scrolling, e.g. from next/prev buttons).
   * @param {number | string} indexOrKey
   * @param {{ animate?: boolean }} [opts]
   */
  goTo(indexOrKey, opts = {}) {
    const idx = typeof indexOrKey === "number" ? indexOrKey : this._beats.findIndex((b) => b.key === indexOrKey);
    if (idx >= 0 && idx < this._beats.length) this._activate(idx, opts);
  }
  /**
   * @returns {{ index: number, key: string | null } | null} the active beat
   */
  current() {
    if (this._activeIndex < 0) return null;
    const beat = this._beats[this._activeIndex];
    return { index: this._activeIndex, key: beat ? beat.key : null };
  }
  /** Disconnect the observer and drop the beat list. */
  unbind() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    this._beats = [];
    this._activeIndex = -1;
    this._used = false;
    enforceLicense(this.w, this.ctx);
  }
  /** Full-destroy cleanup (called from Destroy). */
  teardown() {
    this.unbind();
  }
  /**
   * Push a beat's announcement to the chart's visually-hidden aria-live
   * status region so screen-reader users follow the story too. No-op when
   * announcements are disabled or the region is absent.
   * @param {string} message
   * @private
   */
  _announce(message) {
    const w = this.w;
    if (!w.config.chart.accessibility.announcements.enabled) return;
    const baseEl = w.dom.baseEl;
    if (!baseEl) return;
    const region = baseEl.querySelector(".apexcharts-sr-status");
    if (!region) return;
    region.textContent = "";
    setTimeout(() => {
      region.textContent = message;
    }, 0);
  }
}
const PERSPECTIVE_VERSION = 1;
const HASH_KEY = "apex";
function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i2 = 0; i2 < bytes.length; i2++) bin += String.fromCharCode(bytes[i2]);
  return btoa(bin);
}
function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i2 = 0; i2 < bin.length; i2++) bytes[i2] = bin.charCodeAt(i2);
  return new TextDecoder().decode(bytes);
}
function base64urlEncode(str) {
  return toBase64(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64urlDecode(b64url) {
  let b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return fromBase64(b64);
}
function stripFunctions(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e2) {
    return void 0;
  }
}
class Perspectives {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._saved = [];
    this._counter = 0;
    this._used = false;
  }
  /**
   * Capture the current chart view as a Perspective token.
   * @returns {{ v: number, view: object, options?: Record<string, any> }}
   */
  capture() {
    const view = captureViewState(this.w, this.ctx);
    const token = (
      /** @type {any} */
      { v: PERSPECTIVE_VERSION, view }
    );
    const options = this._serializableDelta();
    if (options && Object.keys(options).length) token.options = options;
    return token;
  }
  /**
   * Build the whitelisted, function-free option override recorded in the token.
   * @returns {Record<string, any>}
   * @private
   */
  _serializableDelta() {
    const cfg = this.w.config;
    const whitelist = cfg.chart && cfg.chart.perspectives && cfg.chart.perspectives.serializeOptions || ["theme", "xaxis", "yaxis", "title", "subtitle"];
    const delta = {};
    whitelist.forEach((path) => {
      if (cfg[path] !== void 0) {
        const stripped = stripFunctions(cfg[path]);
        if (stripped !== void 0) delta[path] = stripped;
      }
    });
    return delta;
  }
  /**
   * Encode a token (or the current capture) to a compact base64url string.
   * JSON.stringify drops any functions embedded in annotation params / option
   * overrides by construction: a shared link carries data; the opening page
   * supplies its own functions from config.
   * @param {any} [token]
   * @returns {string}
   */
  encode(token) {
    const t2 = token || this.capture();
    return base64urlEncode(JSON.stringify(t2));
  }
  /**
   * Decode a base64url token string. Never throws: returns null on any error
   * or version mismatch (with a console warning).
   * @param {string} str
   * @returns {any | null}
   */
  decode(str) {
    return Perspectives.decode(str);
  }
  /**
   * Encode the current capture into a `#apex=<token>` URL hash fragment on the
   * current location. Browser-only; returns '' under SSR.
   * @returns {string}
   */
  toURL() {
    if (!Environment.isBrowser()) return "";
    const encoded = this.encode(this.capture());
    const url = new URL(window.location.href);
    url.hash = `${HASH_KEY}=${encoded}`;
    return url.toString();
  }
  /**
   * Restore a perspective. Accepts a token object or an encoded string. When
   * the chart is grouped, applies to every synced chart.
   *
   * The token's option overrides and `opts.mergeOptions` are folded into the
   * view restore's ONE updateOptions call (mergeOptions wins over
   * token.options; the view's own fields win over both). A single render is
   * deliberate: a second immediate updateOptions would kill the first one's
   * animation mid-flight, and a chart.type change applied this way morphs
   * (morph feature) inside the same re-render instead of being re-rendered
   * over. Consumed by Storyboard for per-beat option payloads.
   *
   * @param {any} tokenOrString
   * @param {{ animate?: boolean, mergeOptions?: Record<string, any> }} [opts]
   */
  apply(tokenOrString, opts = {}) {
    const token = typeof tokenOrString === "string" ? Perspectives.decode(tokenOrString) : tokenOrString;
    if (!token || !token.view) return;
    this._used = true;
    enforceLicense(this.w, this.ctx);
    const animate = opts.animate !== void 0 ? opts.animate : true;
    const combined = Utils.extend(
      token.options ? Utils.clone(token.options) : {},
      opts.mergeOptions || {}
    );
    const mergeOptions = Object.keys(combined).length ? combined : void 0;
    const targets = this.w.config.chart.group ? this.ctx.getSyncedCharts() : [this.ctx];
    targets.forEach((chart) => {
      applyViewState(chart, token.view, { animate, mergeOptions });
    });
  }
  /**
   * Save the current view under a name in the in-memory registry.
   * @param {string} name
   * @returns {string} generated id
   */
  save(name) {
    const id = `perspective-${++this._counter}`;
    this._saved.push({ id, name: name || id, token: this.capture() });
    this._used = true;
    enforceLicense(this.w, this.ctx);
    return id;
  }
  /**
   * List saved perspectives.
   * @returns {{ id: string, name: string, token: any }[]}
   */
  list() {
    return this._saved.map((s2) => ({ id: s2.id, name: s2.name, token: s2.token }));
  }
  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i2 = this._saved.findIndex((s2) => s2.id === id);
    if (i2 > -1) this._saved.splice(i2, 1);
  }
  /** Drop the saved-views registry (called on full destroy). */
  teardown() {
    this._saved = [];
    this._counter = 0;
  }
  // ── static, pure helpers (available once the feature is imported) ─────────
  /**
   * @param {string} str base64url token
   * @returns {any | null}
   */
  static decode(str) {
    if (typeof str !== "string" || !str) return null;
    try {
      const token = JSON.parse(base64urlDecode(str));
      if (!token || typeof token !== "object") return null;
      if (token.v !== PERSPECTIVE_VERSION) {
        console.warn(
          `apexcharts: unsupported perspective version ${token.v} (expected ${PERSPECTIVE_VERSION}).`
        );
        return null;
      }
      return token;
    } catch (e2) {
      console.warn("apexcharts: failed to decode perspective token.", e2);
      return null;
    }
  }
  /**
   * Parse a `#apex=<token>` fragment out of an href (or the current location in
   * a browser). Pure and Node-safe when given an explicit href.
   * @param {string} [href]
   * @returns {any | null}
   */
  static fromURL(href) {
    try {
      const target2 = href || (Environment.isBrowser() ? window.location.href : "");
      if (!target2) return null;
      const url = new URL(target2);
      const hash = url.hash.replace(/^#/, "");
      if (!hash) return null;
      const pair = hash.split("&").map((p) => p.split("=")).find((p) => p[0] === HASH_KEY);
      if (!pair || pair[1] == null) return null;
      return Perspectives.decode(decodeURIComponent(pair[1]));
    } catch (e2) {
      return null;
    }
  }
}
ApexCharts__default.registerFeatures({ perspectives: Perspectives });
ApexCharts__default.perspectives = {
  /** @param {string} str */
  decode: (str) => {
    markPerspectivesTokenDecoded();
    return Perspectives.decode(str);
  },
  /** @param {string} [href] */
  fromURL: (href) => {
    markPerspectivesTokenDecoded();
    return Perspectives.fromURL(href);
  }
};
ApexCharts__default.registerFeatures({ storyboard: Storyboard });
const STYLE_KEYS = {
  fill: "fill",
  stroke: "stroke",
  "stroke-width": "strokeWidth",
  "stroke-dasharray": "strokeDash",
  "stroke-linecap": "lineCap",
  "fill-opacity": "fillOpacity",
  "stroke-opacity": "strokeOpacity",
  "fill-rule": "fillRule"
};
const NEVER = Symbol("never");
function plotClip(value) {
  if (value == null || value === "none") return null;
  const m = /^url\(#gridRect(Bar|Marker)?Mask/.exec(String(value));
  if (!m) return void 0;
  return m[1] === "Bar" ? "bar" : m[1] === "Marker" ? "marker" : "grid";
}
const SHAPE_ID = {
  circle: 0,
  square: 1,
  rect: 1,
  triangle: 2,
  diamond: 3,
  star: 4,
  sparkle: 5,
  cross: 6,
  plus: 7,
  line: 8
};
const SHAPE_NAME = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "star",
  "sparkle",
  "cross",
  "plus",
  "line"
];
function pathBox(d) {
  const tokens = typeof d === "string" ? d.match(/[a-df-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) : null;
  if (!tokens) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  let px = 0;
  let py = 0;
  let sx = 0;
  let sy = 0;
  let cmd = "";
  let k2 = 0;
  const num = () => Number(tokens[k2++]);
  const take = (x2, y) => {
    if (!isFinite(x2) || !isFinite(y)) return;
    left = Math.min(left, x2);
    top = Math.min(top, y);
    right = Math.max(right, x2);
    bottom = Math.max(bottom, y);
  };
  const points = (pairs) => {
    const rel = cmd === cmd.toLowerCase();
    let x2 = px;
    let y = py;
    for (let p = 0; p < pairs; p++) {
      x2 = num() + (rel ? px : 0);
      y = num() + (rel ? py : 0);
      take(x2, y);
    }
    px = x2;
    py = y;
  };
  while (k2 < tokens.length) {
    if (/^[a-z]$/i.test(tokens[k2])) {
      cmd = tokens[k2++];
      if (cmd === "Z" || cmd === "z") {
        px = sx;
        py = sy;
      }
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case "M":
        points(1);
        sx = px;
        sy = py;
        cmd = rel ? "l" : "L";
        break;
      case "L":
      case "T":
        points(1);
        break;
      case "H":
        px = num() + (rel ? px : 0);
        take(px, py);
        break;
      case "V":
        py = num() + (rel ? py : 0);
        take(px, py);
        break;
      case "S":
      case "Q":
        points(2);
        break;
      case "C":
        points(3);
        break;
      case "A":
        k2 += 5;
        points(1);
        break;
      default:
        k2++;
    }
  }
  return isFinite(left) ? { x: left, y: top, width: right - left, height: bottom - top } : null;
}
function markBox(cmd) {
  if (cmd.boxOf !== cmd.d) {
    cmd.box = pathBox(cmd.d);
    cmd.boxOf = cmd.d;
  }
  return cmd.box;
}
const NOOP_RUNNER = {
  /** @returns {any} */
  attr() {
    return NOOP_RUNNER;
  },
  plot() {
    return NOOP_RUNNER;
  },
  during() {
    return NOOP_RUNNER;
  },
  after(fn) {
    if (typeof fn === "function") fn();
    return NOOP_RUNNER;
  },
  animate() {
    return NOOP_RUNNER;
  },
  delay() {
    return NOOP_RUNNER;
  },
  loop() {
    return NOOP_RUNNER;
  },
  finish() {
    return NOOP_RUNNER;
  },
  stop() {
    return NOOP_RUNNER;
  }
};
const SHARED_MARKER_NODE = {
  nodeName: "path",
  style: {},
  classList: { add() {
  }, remove() {
  }, toggle() {
  }, contains: () => false },
  setAttribute() {
  },
  getAttribute: () => null,
  removeAttribute() {
  },
  hasAttribute: () => false,
  addEventListener() {
  },
  removeEventListener() {
  },
  appendChild() {
  },
  getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 })
};
const SHARED_GROUP = {
  __isCanvasMark: true,
  node: {
    nodeName: "g",
    instance: null,
    style: {},
    classList: { add() {
    }, remove() {
    }, toggle() {
    }, contains: () => false },
    setAttribute() {
    },
    getAttribute: () => null,
    removeAttribute() {
    },
    addEventListener() {
    },
    removeEventListener() {
    },
    appendChild() {
    },
    getBBox: () => ({ x: 0, y: 0, width: 0, height: 0 })
  },
  /** @returns {any} */
  attr() {
    return SHARED_GROUP;
  },
  add() {
    return SHARED_GROUP;
  },
  addTo() {
    return SHARED_GROUP;
  },
  remove() {
    return SHARED_GROUP;
  },
  clear() {
    return SHARED_GROUP;
  },
  css() {
    return SHARED_GROUP;
  },
  hide() {
    return SHARED_GROUP;
  },
  show() {
    return SHARED_GROUP;
  },
  removeClass() {
    return SHARED_GROUP;
  },
  animate() {
    return NOOP_RUNNER;
  }
};
class CanvasMarkerRef {
  /**
   * @param {CanvasGraphics} g
   * @param {number} i
   */
  constructor(g, i2) {
    this.__isCanvasMark = true;
    this._g = g;
    this._i = i2;
  }
  get node() {
    return SHARED_MARKER_NODE;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a2, v) {
    if (typeof a2 === "string") {
      if (a2 === "fill" && v !== void 0) this._g._setMarkerFill(this._i, v);
      else if (a2 === "rel" && v !== void 0) this._g._mdi[this._i] = v;
      return v === void 0 ? null : this;
    }
    if (a2 && a2.fill !== void 0) this._g._setMarkerFill(this._i, a2.fill);
    if (a2 && a2.rel !== void 0) this._g._mdi[this._i] = a2.rel;
    return this;
  }
  /** @param {any} _c */
  add(_c) {
    return this;
  }
  /** @param {any} _p */
  addTo(_p) {
    return this;
  }
  remove() {
    return this;
  }
  /** @param {any} _s */
  css(_s) {
    return this;
  }
  /** @param {any} _v */
  fill(_v) {
    if (_v !== void 0) this._g._setMarkerFill(this._i, _v);
    return this;
  }
  /** @param {any} _v */
  stroke(_v) {
    return this;
  }
  hide() {
    return this;
  }
  show() {
    return this;
  }
  /** @param {string} _c */
  removeClass(_c) {
    return this;
  }
  animate() {
    return NOOP_RUNNER;
  }
}
const SHARED_RECT_REF = {
  __isCanvasMark: true,
  node: SHARED_MARKER_NODE,
  /** @returns {any} */
  attr() {
    return SHARED_RECT_REF;
  },
  add() {
    return SHARED_RECT_REF;
  },
  addTo() {
    return SHARED_RECT_REF;
  },
  remove() {
    return SHARED_RECT_REF;
  },
  /** @returns {any} */
  css() {
    return SHARED_RECT_REF;
  },
  animate() {
    return NOOP_RUNNER;
  }
};
class CanvasMark {
  /** @param {any} cmd */
  constructor(cmd) {
    this.__isCanvasMark = true;
    this._cmd = cmd;
    const self = this;
    this.node = {
      nodeName: cmd ? cmd.tag : "g",
      instance: this,
      style: {},
      classList: { add() {
      }, remove() {
      }, toggle() {
      }, contains: () => false },
      /** @param {string} k @param {any} v */
      setAttribute(k2, v) {
        self._applyAttr(k2, v);
      },
      getAttribute: () => null,
      removeAttribute() {
      },
      hasAttribute: () => false,
      addEventListener() {
      },
      removeEventListener() {
      },
      appendChild() {
      },
      getBBox: () => self.bbox()
    };
  }
  /**
   * @param {string} k
   * @param {any} v
   */
  _applyAttr(k2, v) {
    const cmd = this._cmd;
    if (!cmd) return;
    if (k2 === "clip-path") {
      const clip = plotClip(v);
      if (clip !== void 0) cmd.clip = clip;
      return;
    }
    const sk = STYLE_KEYS[k2];
    if (sk !== void 0) cmd[sk] = v;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a2, v) {
    if (typeof a2 === "string") {
      if (v === void 0) return null;
      this._applyAttr(a2, v);
      return this;
    }
    for (const k2 in a2) {
      if (a2[k2] !== void 0) this._applyAttr(k2, a2[k2]);
    }
    return this;
  }
  /** @param {any} _c */
  add(_c) {
    return this;
  }
  /** @param {any} _p */
  addTo(_p) {
    return this;
  }
  remove() {
    return this;
  }
  clear() {
    return this;
  }
  /** @param {any} _s */
  css(_s) {
    return this;
  }
  /** @param {any} v */
  fill(v) {
    if (typeof v === "object") return this.attr(v);
    return this.attr("fill", v);
  }
  /** @param {any} v */
  stroke(v) {
    if (typeof v === "object") {
      if (v.color !== void 0) this.attr("stroke", v.color);
      if (v.width !== void 0) this.attr("stroke-width", v.width);
      return this;
    }
    return this.attr("stroke", v);
  }
  /** @param {string} d */
  plot(d) {
    if (typeof d === "string" && this._cmd && this._cmd.tag === "path") {
      this._cmd.d = d;
    }
    return this;
  }
  hide() {
    return this;
  }
  show() {
    return this;
  }
  /** @param {string} _c */
  removeClass(_c) {
    return this;
  }
  /**
   * The box a recorded path spans, as an SVG path's getBBox() measures it;
   * an empty box for anything else.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  bbox() {
    const cmd = this._cmd;
    const box = cmd && cmd.tag === "path" ? markBox(cmd) : null;
    return box ? __spreadValues({}, box) : { x: 0, y: 0, width: 0, height: 0 };
  }
  animate() {
    return NOOP_RUNNER;
  }
}
class CanvasGraphics {
  /** @param {any} w */
  constructor(w) {
    this.w = w;
    this._g = new Graphics(w);
    this._list = [];
    this._mx = new Float64Array(16);
    this._my = new Float64Array(16);
    this._msize = new Float64Array(16);
    this._mshape = new Int16Array(16);
    this._mstyle = new Int32Array(16);
    this._msi = new Int32Array(16);
    this._mdi = new Int32Array(16);
    this._mn = 0;
    this._mcap = 16;
    this._crx = new Float64Array(16);
    this._cry = new Float64Array(16);
    this._crw = new Float64Array(16);
    this._crh = new Float64Array(16);
    this._crstyle = new Int32Array(16);
    this._crsi = new Int32Array(16);
    this._crdi = new Int32Array(16);
    this._crn = 0;
    this._crcap = 16;
    this._cellRadius = 0;
    this._styles = [];
    this._styleMap = /* @__PURE__ */ new Map();
    this._lf = NEVER;
    this._ls = NEVER;
    this._lsw = NEVER;
    this._ld = NEVER;
    this._lfo = NEVER;
    this._lso = NEVER;
    this._lid = -1;
    this._lofFill = NEVER;
    this._lofBase = -1;
    this._lofId = -1;
    this._rlf = NEVER;
    this._rls = NEVER;
    this._rlsw = NEVER;
    this._rlfo = NEVER;
    this._rlso = NEVER;
    this._rlid = -1;
  }
  _resetStyleCache() {
    this._lf = NEVER;
    this._ls = NEVER;
    this._lsw = NEVER;
    this._ld = NEVER;
    this._lfo = NEVER;
    this._lso = NEVER;
    this._lid = -1;
    this._lofFill = NEVER;
    this._lofBase = -1;
    this._lofId = -1;
    this._rlf = NEVER;
    this._rls = NEVER;
    this._rlsw = NEVER;
    this._rlfo = NEVER;
    this._rlso = NEVER;
    this._rlid = -1;
  }
  /** Start a fresh scene (columnar marker store + object-command list). */
  reset() {
    this._list = [];
    this._mn = 0;
    this._styles = [];
    this._styleMap = /* @__PURE__ */ new Map();
    this._resetStyleCache();
    const series = this.w.config.series || [];
    let cap = 16;
    for (let i2 = 0; i2 < series.length; i2++) {
      const d = series[i2] && series[i2].data;
      if (Array.isArray(d)) cap += d.length;
    }
    cap = Math.ceil(cap * 1.15) + 16;
    if (cap > this._mcap) this._allocMarkers(cap);
    this._crn = 0;
    this._cellRadius = 0;
    if (cap > this._crcap) this._allocRects(cap);
  }
  /** @param {number} cap */
  _allocRects(cap) {
    this._crcap = cap;
    this._crx = new Float64Array(cap);
    this._cry = new Float64Array(cap);
    this._crw = new Float64Array(cap);
    this._crh = new Float64Array(cap);
    this._crstyle = new Int32Array(cap);
    this._crsi = new Int32Array(cap);
    this._crdi = new Int32Array(cap);
  }
  /** Grow the rect columns (rare: capacity estimate was low). */
  _growRects() {
    const cap = this._crcap * 2;
    const nx = new Float64Array(cap);
    nx.set(this._crx);
    this._crx = nx;
    const ny = new Float64Array(cap);
    ny.set(this._cry);
    this._cry = ny;
    const nw = new Float64Array(cap);
    nw.set(this._crw);
    this._crw = nw;
    const nh = new Float64Array(cap);
    nh.set(this._crh);
    this._crh = nh;
    const nst = new Int32Array(cap);
    nst.set(this._crstyle);
    this._crstyle = nst;
    const nsi = new Int32Array(cap);
    nsi.set(this._crsi);
    this._crsi = nsi;
    const ndi = new Int32Array(cap);
    ndi.set(this._crdi);
    this._crdi = ndi;
    this._crcap = cap;
  }
  /** @param {number} cap */
  _allocMarkers(cap) {
    this._mcap = cap;
    this._mx = new Float64Array(cap);
    this._my = new Float64Array(cap);
    this._msize = new Float64Array(cap);
    this._mshape = new Int16Array(cap);
    this._mstyle = new Int32Array(cap);
    this._msi = new Int32Array(cap);
    this._mdi = new Int32Array(cap);
  }
  /** Grow the marker columns (rare: capacity estimate was low). */
  _growMarkers() {
    const cap = this._mcap * 2;
    const nx = new Float64Array(cap);
    nx.set(this._mx);
    this._mx = nx;
    const ny = new Float64Array(cap);
    ny.set(this._my);
    this._my = ny;
    const ns = new Float64Array(cap);
    ns.set(this._msize);
    this._msize = ns;
    const nsh = new Int16Array(cap);
    nsh.set(this._mshape);
    this._mshape = nsh;
    const nst = new Int32Array(cap);
    nst.set(this._mstyle);
    this._mstyle = nst;
    const nsi = new Int32Array(cap);
    nsi.set(this._msi);
    this._msi = nsi;
    const ndi = new Int32Array(cap);
    ndi.set(this._mdi);
    this._mdi = ndi;
    this._mcap = cap;
  }
  displayList() {
    return this._list;
  }
  markerCount() {
    return this._mn;
  }
  /**
   * Intern a marker style; returns its palette id. Keeps the per-point columns
   * numeric (no retained per-point object).
   * @param {any} fill @param {any} stroke @param {any} sw @param {any} dash
   * @param {any} fo @param {any} so
   * @returns {number}
   */
  _internStyle(fill, stroke2, sw, dash, fo, so) {
    const key = `${fill}|${stroke2}|${sw}|${dash}|${fo}|${so}`;
    const cached = this._styleMap.get(key);
    if (cached !== void 0) return cached;
    const id = this._styles.length;
    this._styles.push({
      fill,
      stroke: stroke2,
      strokeWidth: sw,
      strokeDash: dash,
      fillOpacity: fo,
      strokeOpacity: so
    });
    this._styleMap.set(key, id);
    return id;
  }
  /**
   * Override a recorded marker's fill (scatter sets a per-point fill via `attr`
   * right after drawMarker). Like the draw path, the string-key intern is cached
   * on (base style, fill) so the Map/string work stays OFF the per-point path
   * (it otherwise mixes with the `_mstyle[i]` typed-array write → the ~80× slow
   * path). For a scatter series the base + fill are uniform, so it interns once.
   * @param {number} i @param {any} fill
   */
  _setMarkerFill(i2, fill) {
    const base = this._mstyle[i2];
    if (fill === this._lofFill && base === this._lofBase) {
      this._mstyle[i2] = this._lofId;
      return;
    }
    const s2 = this._styles[base];
    if (!s2 || s2.fill === fill) {
      this._lofFill = fill;
      this._lofBase = base;
      this._lofId = base;
      return;
    }
    const id = this._internStyle(
      fill,
      s2.stroke,
      s2.strokeWidth,
      s2.strokeDash,
      s2.fillOpacity,
      s2.strokeOpacity
    );
    this._mstyle[i2] = id;
    this._lofFill = fill;
    this._lofBase = base;
    this._lofId = id;
  }
  /** @param {number} i @returns {any} the style object for a marker index */
  markerStyle(i2) {
    return this._styles[this._mstyle[i2]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a marker, -1 if none */
  markerSeries(i2) {
    return this._msi[i2];
  }
  /** @param {number} id @returns {string} */
  shapeName(id) {
    return SHAPE_NAME[id] || "circle";
  }
  // ── columnar rect cell (heatmap): parallel unboxed arrays, no per-cell object ──
  /**
   * Record a heatmap-style cell (a filled, optionally stroked rect). Geometry
   * and style are captured up front into the columns; the returned handle is a
   * shared no-op (the emit site sets nothing back on it in canvas mode).
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {any} opts {fill, fillOpacity, stroke, strokeWidth, radius, seriesIndex, dataPointIndex}
   * @returns {any}
   */
  drawRectCell(x2, y, w, h, opts = {}) {
    const styleId = this._rectStyleId(opts);
    if (this._crn >= this._crcap) this._growRects();
    const i2 = this._crn++;
    this._crx[i2] = x2 || 0;
    this._cry[i2] = y || 0;
    this._crw[i2] = w > 0 ? w : 0;
    this._crh[i2] = h > 0 ? h : 0;
    this._crstyle[i2] = styleId;
    this._crsi[i2] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    this._crdi[i2] = opts.dataPointIndex == null ? -1 : opts.dataPointIndex;
    if (opts.radius) this._cellRadius = opts.radius;
    return SHARED_RECT_REF;
  }
  /**
   * Resolve (and dedupe) a rect-cell style → shared-palette id. A last-style
   * cache keeps the Map/string work off the path for runs of same-style cells.
   * @param {any} opts
   * @returns {number}
   */
  _rectStyleId(opts) {
    const fill = opts.fill;
    const stroke2 = opts.stroke;
    const sw = opts.strokeWidth;
    const fo = opts.fillOpacity;
    const so = opts.strokeOpacity;
    if (fill === this._rlf && stroke2 === this._rls && sw === this._rlsw && fo === this._rlfo && so === this._rlso) {
      return this._rlid;
    }
    const id = this._internStyle(fill, stroke2, sw, 0, fo, so);
    this._rlf = fill;
    this._rls = stroke2;
    this._rlsw = sw;
    this._rlfo = fo;
    this._rlso = so;
    this._rlid = id;
    return id;
  }
  /** @returns {number} number of recorded rect cells */
  rectCount() {
    return this._crn;
  }
  /** @param {number} i @returns {any} the style object for a rect cell */
  rectStyle(i2) {
    return this._styles[this._crstyle[i2]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a cell, -1 if none */
  rectSeries(i2) {
    return this._crsi[i2];
  }
  /**
   * @param {string} tag
   * @param {number} z
   * @returns {any}
   */
  _cmd(tag, z2) {
    const cmd = {
      tag,
      z: z2 || 0,
      fill: void 0,
      stroke: void 0,
      strokeWidth: void 0,
      strokeDash: void 0,
      lineCap: void 0,
      fillOpacity: void 0,
      strokeOpacity: void 0,
      fillRule: void 0,
      // The plot clip it is painted through ('grid' | 'bar' | 'marker'),
      // null for none: whatever `clip-path` the SVG mark would carry.
      clip: null
    };
    this._list.push(cmd);
    return cmd;
  }
  // ── organizational (groups don't paint or record) ──
  // Series draw() creates a wrap group PER POINT (scatter.draw / plotChartMarkers
  // run per point), so allocating a handle per group is ~50k heavy allocations
  // at scale: enough transient churn to tip V8 into a GC blow-up. Groups carry
  // no paint state in canvas mode (attr/add are no-ops), so every group shares
  // one singleton: zero per-point allocation.
  /** @param {any} _attrs */
  group(_attrs) {
    return SHARED_GROUP;
  }
  // ── per-point marker (line/area markers, scatter, bubble): COLUMNAR ──
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x2, y, opts = {}) {
    var _a;
    const styleId = this._markerStyleId(opts);
    if (this._mn >= this._mcap) this._growMarkers();
    const i2 = this._mn++;
    this._mx[i2] = x2 || 0;
    this._my[i2] = typeof y === "number" ? y : NaN;
    this._msize[i2] = opts.pSize || 0;
    this._mshape[i2] = (_a = SHAPE_ID[opts.shape || "circle"]) != null ? _a : 0;
    this._mstyle[i2] = styleId;
    this._msi[i2] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    this._mdi[i2] = -1;
    return new CanvasMarkerRef(this, i2);
  }
  /**
   * Resolve (and dedupe) a marker style → palette id. A last-style cache keeps
   * the Map/string work off the path when consecutive markers share a style
   * (the common case), so intern runs once per style run.
   * @param {any} opts
   * @returns {number}
   */
  _markerStyleId(opts) {
    const shape = opts.shape || "circle";
    const strokeTinted = shape === "line" || shape === "plus" || shape === "cross";
    const fill = strokeTinted ? "none" : opts.pointFillColor;
    const stroke2 = strokeTinted ? opts.pointFillColor : opts.pointStrokeColor;
    const sw = opts.pointStrokeWidth;
    const dash = opts.pointStrokeDashArray;
    const fo = opts.pointFillOpacity;
    const so = strokeTinted ? opts.pointFillOpacity : opts.pointStrokeOpacity;
    if (fill === this._lf && stroke2 === this._ls && sw === this._lsw && dash === this._ld && fo === this._lfo && so === this._lso) {
      return this._lid;
    }
    const id = this._internStyle(fill, stroke2, sw, dash, fo, so);
    this._lf = fill;
    this._ls = stroke2;
    this._lsw = sw;
    this._ld = dash;
    this._lfo = fo;
    this._lso = so;
    this._lid = id;
    return id;
  }
  // ── series body path (line/area/bar): object command ──
  /** @param {any} opts */
  renderPaths(opts) {
    const cmd = this._cmd("path", opts.realIndex);
    cmd.d = opts.pathTo;
    if (opts.pathToNumeric) {
      cmd.nxs = opts.pathToNumeric.xs;
      cmd.nys = opts.pathToNumeric.ys;
      cmd.ncloseY = opts.pathToNumeric.closeY;
    }
    cmd.stroke = opts.stroke;
    cmd.strokeWidth = opts.strokeWidth;
    cmd.fill = opts.fill;
    cmd.lineCap = opts.strokeLinecap;
    cmd.si = opts.realIndex;
    if (typeof opts.j === "number") cmd.dj = opts.j;
    if (opts.shouldClipToGrid !== false) {
      const gl = this.w.globals;
      cmd.clip = opts.chartType === "bar" && !gl.isBarHorizontal || gl.comboCharts ? "bar" : "grid";
    }
    this.w.globals.animationEnded = true;
    return new CanvasMark(cmd);
  }
  /** @param {any} opts */
  drawPath(opts) {
    const cmd = this._cmd("path", 0);
    cmd.d = opts.d;
    cmd.stroke = opts.stroke;
    cmd.strokeWidth = opts.strokeWidth;
    cmd.fill = opts.fill;
    cmd.fillOpacity = opts.fillOpacity;
    cmd.strokeOpacity = opts.strokeOpacity;
    cmd.lineCap = opts.strokeLinecap;
    cmd.strokeDash = opts.strokeDashArray;
    return new CanvasMark(cmd);
  }
  // ── remaining primitives (contract completeness / Marks #11 forward-compat) ──
  /**
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {string} lineColor @param {any} dashArray @param {number} strokeWidth
   */
  drawLine(x1, y1, x2, y2, lineColor = "#a8a8a8", dashArray = 0, strokeWidth = 1) {
    const cmd = this._cmd("line", 0);
    cmd.lx1 = x1;
    cmd.ly1 = y1;
    cmd.lx2 = x2;
    cmd.ly2 = y2;
    cmd.stroke = lineColor;
    cmd.strokeDash = dashArray;
    cmd.strokeWidth = strokeWidth;
    return new CanvasMark(cmd);
  }
  /**
   * Mirrors Graphics.drawRect's full signature (including stroke), so callers
   * that stroke rects (Marks api.rect, chart code) paint the same on canvas.
   * @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2
   * @param {number} radius @param {string} color @param {number} opacity
   * @param {number|null} [strokeWidth] @param {string|null} [strokeColor]
   * @param {any} [strokeDashArray]
   */
  drawRect(x1 = 0, y1 = 0, x2 = 0, y2 = 0, radius = 0, color = "#fefefe", opacity = 1, strokeWidth = null, strokeColor = null, strokeDashArray = 0) {
    const cmd = this._cmd("rect", 0);
    cmd.x1 = x1;
    cmd.y1 = y1;
    cmd.rw = x2 > 0 ? x2 : 0;
    cmd.rh = y2 > 0 ? y2 : 0;
    cmd.radius = radius;
    cmd.fill = color;
    cmd.fillOpacity = opacity;
    if (strokeColor != null) {
      cmd.stroke = strokeColor;
      cmd.strokeWidth = strokeWidth == null ? 1 : strokeWidth;
      cmd.strokeDash = strokeDashArray;
    }
    return new CanvasMark(cmd);
  }
  /**
   * @param {number} radius
   * @param {any} attrs
   */
  drawCircle(radius, attrs = null) {
    const cmd = this._cmd("circle", 0);
    cmd.r = radius < 0 ? 0 : radius;
    if (attrs) {
      cmd.cx = attrs.cx;
      cmd.cy = attrs.cy;
      if (attrs.fill !== void 0) cmd.fill = attrs.fill;
      if (attrs.stroke !== void 0) cmd.stroke = attrs.stroke;
    }
    return new CanvasMark(cmd);
  }
  /** @param {any} opts */
  drawText(opts) {
    const cmd = this._cmd("text", 0);
    cmd.text = Array.isArray(opts.text) ? opts.text.join(" ") : opts.text;
    cmd.tx = opts.x;
    cmd.ty = opts.y;
    cmd.textAnchor = opts.textAnchor || "start";
    cmd.fontSize = opts.fontSize;
    cmd.fontFamily = opts.fontFamily;
    cmd.fill = opts.foreColor;
    return new CanvasMark(cmd);
  }
  /**
   * Resolve a marker's SVG path `d` (non-circle shapes) lazily at paint time.
   * @param {number} x @param {number} y @param {number} shapeId @param {number} size
   * @returns {string}
   */
  markerPath(x2, y, shapeId, size) {
    return this._g.getMarkerPath(x2, y, SHAPE_NAME[shapeId] || "circle", size);
  }
}
const SVGElement = ApexCharts.__apex_SVGElement;
const SVGNS = ApexCharts.__apex_math_SVGNS;
const Grid = ApexCharts.__apex_axes_Grid;
const TWO_PI = Math.PI * 2;
const DPR_CAP = 2;
class CanvasCompositor {
  /** @param {any} w */
  constructor(w) {
    this.w = w;
    this._host = null;
    this._canvas = null;
    this._c2d = null;
    this._pad = { left: 0, top: 0, right: 0, bottom: 0 };
    this._clips = null;
    this._clipRect = null;
    this._dpr = 1;
    this._dim = null;
    this._alpha = 1;
    this._unitPaths = /* @__PURE__ */ new Map();
    this._markerBatches = 0;
  }
  /** Marker style-batches applied during the last paint() (dev/test hook). */
  markerBatchCount() {
    return this._markerBatches;
  }
  /**
   * Opacity multiplier for a series index under the active dim spec: 1 for the
   * highlighted series (or when not dimming, or for unidentified marks), else
   * the inactive opacity.
   * @param {number} si
   * @returns {number}
   */
  _seriesAlpha(si) {
    const d = this._dim;
    if (!d || d.active == null || d.active < 0 || si == null || si < 0) return 1;
    return si === d.active ? 1 : d.opacity == null ? 0.2 : d.opacity;
  }
  /**
   * The plot size, the plot clips (the rects the SVG chart clips its marks
   * to) and how far the canvas has to reach past each side of the plot: the
   * edge-marker margin, or further wherever a clip reaches further.
   */
  _plotDims() {
    var _a;
    const gw = Math.max(0, Math.ceil(this.w.layout.gridWidth || 0));
    const gh = Math.max(0, Math.ceil(this.w.layout.gridHeight || 0));
    const largest = ((_a = this.w.globals.markers) == null ? void 0 : _a.largestSize) || 0;
    const margin = Math.ceil(largest + 8);
    const clips = Grid.maskRects(this.w);
    const pad = { left: margin, top: margin, right: margin, bottom: margin };
    const reach = (v) => Number.isFinite(v) ? Math.ceil(v) : 0;
    Object.values(clips).forEach((r2) => {
      pad.left = Math.max(pad.left, reach(-r2.x));
      pad.top = Math.max(pad.top, reach(-r2.y));
      pad.right = Math.max(pad.right, reach(r2.x + r2.width - gw));
      pad.bottom = Math.max(pad.bottom, reach(r2.y + r2.height - gh));
    });
    return { gw, gh, pad, clips };
  }
  /**
   * Create (or recreate) the foreignObject + canvas sized to the plot rect and
   * return the SVGElement host that `plotChartType` inserts into the tree.
   * @returns {any}
   */
  createHost() {
    const win = BrowserAPIs.getWindow();
    this._dpr = Math.min(DPR_CAP, win && win.devicePixelRatio || 1);
    const { gw, gh, pad, clips } = this._plotDims();
    this._pad = pad;
    this._clips = clips;
    const w = gw + pad.left + pad.right;
    const h = gh + pad.top + pad.bottom;
    const fo = BrowserAPIs.createElementNS(SVGNS, "foreignObject");
    fo.setAttribute("x", String(-pad.left));
    fo.setAttribute("y", String(-pad.top));
    fo.setAttribute("width", String(w));
    fo.setAttribute("height", String(h));
    fo.setAttribute("class", "apexcharts-canvas-series");
    fo.style.overflow = "visible";
    const canvas = (
      /** @type {any} */
      BrowserAPIs.createElement("canvas")
    );
    canvas.setAttribute("class", "apexcharts-series-canvas");
    canvas.width = Math.max(1, Math.round(w * this._dpr));
    canvas.height = Math.max(1, Math.round(h * this._dpr));
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.style.pointerEvents = "none";
    fo.appendChild(canvas);
    this._canvas = canvas;
    this._c2d = canvas.getContext("2d");
    this._host = new SVGElement(fo);
    return this._host;
  }
  getHost() {
    return this._host;
  }
  /**
   * The rect a plot clip covers, in plot px, or null when there is none to
   * apply (no clip named, or no host made yet).
   * @param {string|null|undefined} kind 'grid' | 'bar' | 'marker'
   * @returns {{x:number,y:number,width:number,height:number}|null}
   */
  clipRect(kind) {
    const r2 = kind && this._clips ? this._clips[kind] : null;
    return r2 && Number.isFinite(r2.x) && Number.isFinite(r2.y) && Number.isFinite(r2.width) && Number.isFinite(r2.height) ? r2 : null;
  }
  /**
   * Paint through a plot clip from here on, as the SVG mark would be
   * clipped; null paints unclipped. Consecutive marks under the same clip
   * share one save/clip, so a run of bars costs one clip, not one each.
   * @param {any} ctx
   * @param {string|null|undefined} kind
   */
  _clipTo(ctx, kind) {
    const r2 = this.clipRect(kind);
    if (r2 === this._clipRect) return;
    if (this._clipRect) ctx.restore();
    this._clipRect = r2;
    if (r2) {
      const dpr = this._dpr;
      const { left, top } = this._pad;
      const x0 = Math.floor((left + r2.x) * dpr);
      const y0 = Math.floor((top + r2.y) * dpr);
      const x1 = Math.ceil((left + r2.x + r2.width) * dpr);
      const y1 = Math.ceil((top + r2.y + r2.height) * dpr);
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath();
      ctx.rect(x0, y0, x1 - x0, y1 - y0);
      ctx.clip();
      ctx.setTransform(dpr, 0, 0, dpr, left * dpr, top * dpr);
    }
  }
  clear() {
    if (!this._c2d || !this._canvas) return;
    this._c2d.setTransform(1, 0, 0, 1, 0, 0);
    this._c2d.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }
  /**
   * Re-check devicePixelRatio before painting: a restyle() repaint after the
   * window moved between monitors would otherwise keep the stale backing-store
   * scale (blurry or over-sized) until the next full render rebuilds the host.
   * The canvas CSS size is unchanged; only the backing store is resized.
   */
  _syncDpr() {
    if (!this._canvas) return;
    const win = BrowserAPIs.getWindow();
    const dpr = Math.min(DPR_CAP, win && win.devicePixelRatio || 1);
    if (dpr === this._dpr) return;
    this._dpr = dpr;
    const wCss = parseFloat(this._canvas.style.width) || 0;
    const hCss = parseFloat(this._canvas.style.height) || 0;
    this._canvas.width = Math.max(1, Math.round(wCss * dpr));
    this._canvas.height = Math.max(1, Math.round(hCss * dpr));
  }
  /**
   * Paint the recorded scene: object commands (series bodies / rects / lines /
   * text) first, then the columnar markers on top (matching SVG z-order where
   * markers sit above the series path). `shim` supplies the columnar marker
   * arrays + lazy non-circle marker geometry.
   * @param {any[]} list
   * @param {any} shim
   * @param {{active:number, opacity:number}|null} [dim] per-series dim spec
   *   (hover / legend restyle); null repaints at full opacity.
   */
  paint(list, shim, dim = null) {
    const ctx = this._c2d;
    if (!ctx) return;
    this._dim = dim || null;
    this._syncDpr();
    this.clear();
    const dpr = this._dpr;
    const { left, top } = this._pad;
    ctx.setTransform(dpr, 0, 0, dpr, left * dpr, top * dpr);
    this._clipRect = null;
    if (list.length) {
      const ordered = list.length > 1 ? list.map((c, i2) => [c, i2]).sort(
        (a2, b) => a2[0].z === b[0].z ? a2[1] - b[1] : a2[0].z - b[0].z
      ).map((pair) => pair[0]) : list;
      for (let i2 = 0; i2 < ordered.length; i2++) {
        const c = ordered[i2];
        this._alpha = this._dim ? this._seriesAlpha(c.si) : 1;
        this._clipTo(ctx, c.clip);
        this._paintOne(ctx, c);
      }
      this._clipTo(ctx, null);
    }
    this._paintRects(ctx, shim);
    this._clipTo(ctx, "marker");
    this._paintMarkers(ctx, shim);
    this._clipTo(ctx, null);
    this._alpha = 1;
  }
  /**
   * Paint the columnar rect cells (heatmap) as STYLE BATCHES: one fill/stroke
   * state application per run of consecutive same-style cells, then a fast
   * fillRect (or a roundRect path when the shared corner radius is non-zero)
   * per cell. Clipped to the plot rect so cells never bleed into the canvas
   * margin (mirrors the SVG gridRectMask). Per-cell globalAlpha carries the
   * hover/legend dim multiplier when a dim spec is active.
   * @param {any} ctx
   * @param {any} shim
   */
  _paintRects(ctx, shim) {
    const n2 = shim.rectCount ? shim.rectCount() : 0;
    if (!n2) return;
    const rx = shim._crx;
    const ry = shim._cry;
    const rw = shim._crw;
    const rh = shim._crh;
    const rstyle = shim._crstyle;
    const radius = shim._cellRadius || 0;
    const cx = (
      /** @type {any} */
      ctx
    );
    const useRound = radius > 0 && typeof cx.roundRect === "function";
    const dimming = !!this._dim;
    const gw = Math.max(0, this.w.layout.gridWidth || 0);
    const gh = Math.max(0, this.w.layout.gridHeight || 0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, gw, gh);
    ctx.clip();
    let i2 = 0;
    while (i2 < n2) {
      const styleId = rstyle[i2];
      const style = shim.rectStyle(i2);
      if (!style) {
        i2++;
        continue;
      }
      const fill = style.fill;
      const doFill = fill && fill !== "none" && !(typeof fill === "string" && fill.indexOf("url(") === 0);
      const stroke2 = style.stroke;
      const sw = style.strokeWidth == null ? 0 : Number(style.strokeWidth);
      const doStroke = stroke2 && stroke2 !== "none" && sw > 0 && !(typeof stroke2 === "string" && stroke2.indexOf("url(") === 0);
      if (doFill) ctx.fillStyle = fill;
      if (doStroke) {
        ctx.strokeStyle = stroke2;
        ctx.lineWidth = sw;
        ctx.setLineDash([]);
      }
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      let j2 = i2;
      while (j2 < n2 && rstyle[j2] === styleId) {
        const w = rw[j2];
        const h = rh[j2];
        if (w > 0 && h > 0) {
          const f = dimming ? this._seriesAlpha(shim.rectSeries(j2)) : 1;
          if (useRound) {
            ctx.beginPath();
            cx.roundRect(rx[j2], ry[j2], w, h, radius);
            if (doFill) {
              ctx.globalAlpha = baseFillA * f;
              ctx.fill();
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f;
              ctx.stroke();
            }
          } else {
            if (doFill) {
              ctx.globalAlpha = baseFillA * f;
              ctx.fillRect(rx[j2], ry[j2], w, h);
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f;
              ctx.strokeRect(rx[j2], ry[j2], w, h);
            }
          }
        }
        j2++;
      }
      i2 = j2;
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  /**
   * Reusable unit Path2D for a (shape, size): the shape's geometry built at the
   * origin once, then translated per marker via setTransform. Returns null when
   * the geometry string cannot be parsed.
   * @param {any} shim
   * @param {number} shapeId
   * @param {number} size
   * @returns {any}
   */
  _unitPath(shim, shapeId, size) {
    const key = shapeId + "|" + size;
    let p = this._unitPaths.get(key);
    if (p === void 0) {
      try {
        p = new Path2D(shim.markerPath(0, 0, shapeId, size));
      } catch (e2) {
        p = null;
      }
      this._unitPaths.set(key, p);
    }
    return p;
  }
  /**
   * Markers paint as STYLE BATCHES: one fill/stroke state application per run
   * of consecutive same-style markers (a uniform single-series scatter is
   * exactly one batch), then per-marker geometry inside the run. Per-marker
   * geometry stays painter's-ordered (fill+stroke per marker) so overlapping
   * semi-transparent markers composite exactly as SVG does.
   * @param {any} ctx
   * @param {any} shim
   */
  _paintMarkers(ctx, shim) {
    this._markerBatches = 0;
    const n2 = shim.markerCount();
    if (!n2) return;
    const mx = shim._mx;
    const my = shim._my;
    const msize = shim._msize;
    const mshape = shim._mshape;
    const mstyle = shim._mstyle;
    const dimming = !!this._dim;
    if (!dimming) this._alpha = 1;
    let i2 = 0;
    while (i2 < n2) {
      const styleId = mstyle[i2];
      const shapeId = mshape[i2];
      const style = shim.markerStyle(i2);
      if (!style) {
        i2++;
        continue;
      }
      const doFill = this._applyFill(ctx, style);
      const doStroke = this._applyStroke(ctx, style);
      this._markerBatches++;
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      if (shapeId === 0) {
        let j2 = i2;
        while (j2 < n2 && mshape[j2] === 0 && mstyle[j2] === styleId) {
          const r2 = msize[j2] || 0;
          const y = my[j2];
          if (r2 > 0 && y === y) {
            ctx.beginPath();
            ctx.arc(mx[j2], y, r2, 0, TWO_PI);
            if (dimming) {
              const f = this._seriesAlpha(shim.markerSeries(j2));
              if (doFill) {
                ctx.globalAlpha = baseFillA * f;
                ctx.fill();
              }
              if (doStroke) {
                ctx.globalAlpha = baseStrokeA * f;
                ctx.stroke();
              }
            } else {
              if (doFill) ctx.fill();
              if (doStroke) ctx.stroke();
            }
          }
          j2++;
        }
        ctx.globalAlpha = 1;
        i2 = j2;
      } else {
        const dpr = this._dpr;
        const ox = this._pad.left;
        const oy = this._pad.top;
        let j2 = i2;
        while (j2 < n2 && mshape[j2] === shapeId && mstyle[j2] === styleId) {
          const y = my[j2];
          const size = msize[j2];
          if (y === y && size > 0) {
            const p = this._unitPath(shim, shapeId, size);
            if (p) {
              ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                (ox + mx[j2]) * dpr,
                (oy + y) * dpr
              );
              const f = dimming ? this._seriesAlpha(shim.markerSeries(j2)) : 1;
              if (doFill) {
                ctx.globalAlpha = baseFillA * f;
                ctx.fill(p);
              }
              if (doStroke) {
                ctx.globalAlpha = baseStrokeA * f;
                ctx.stroke(p);
              }
            }
          }
          j2++;
        }
        ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr);
        ctx.globalAlpha = 1;
        i2 = j2;
      }
    }
  }
  /**
   * Paint a series path from its numeric fast-path coords: a direct
   * moveTo/lineTo loop over the typed arrays, no Path2D and no d-string
   * parse. `ncloseY` (areas) closes the polygon down to the baseline exactly
   * like the string form's `L xLast bottom L x0 bottom z` tail.
   * @param {any} ctx
   * @param {any} cmd
   */
  _paintNumericPath(ctx, cmd) {
    const xs = cmd.nxs;
    const ys = cmd.nys;
    const n2 = xs.length;
    if (!n2) return;
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let k2 = 1; k2 < n2; k2++) {
      ctx.lineTo(xs[k2], ys[k2]);
    }
    if (cmd.ncloseY != null) {
      ctx.lineTo(xs[n2 - 1], cmd.ncloseY);
      ctx.lineTo(xs[0], cmd.ncloseY);
      ctx.closePath();
    }
    if (this._applyFill(ctx, cmd)) {
      ctx.fill(cmd.fillRule === "evenodd" ? "evenodd" : "nonzero");
    }
    if (this._applyStroke(ctx, cmd)) {
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  /**
   * @param {any} ctx
   * @param {any} cmd style-bearing flat command
   */
  _paintOne(ctx, cmd) {
    switch (cmd.tag) {
      case "path": {
        if (cmd.nxs) {
          this._paintNumericPath(ctx, cmd);
          break;
        }
        if (!cmd.d) return;
        if (!cmd.path2d) {
          try {
            cmd.path2d = new Path2D(cmd.d);
          } catch (e2) {
            return;
          }
        }
        this._fillStrokePath(ctx, cmd, cmd.path2d);
        break;
      }
      case "rect": {
        const p = new Path2D();
        if (cmd.radius && typeof /** @type {any} */
        p.roundRect === "function") {
          p.roundRect(cmd.x1, cmd.y1, cmd.rw, cmd.rh, cmd.radius);
        } else {
          p.rect(cmd.x1, cmd.y1, cmd.rw, cmd.rh);
        }
        this._fillStrokePath(ctx, cmd, p);
        break;
      }
      case "circle": {
        if (!(cmd.r > 0)) return;
        ctx.beginPath();
        ctx.arc(cmd.cx, cmd.cy, cmd.r, 0, TWO_PI);
        this._fillStroke(ctx, cmd);
        break;
      }
      case "line": {
        ctx.beginPath();
        ctx.moveTo(cmd.lx1, cmd.ly1);
        ctx.lineTo(cmd.lx2, cmd.ly2);
        this._strokeOnly(ctx, cmd);
        break;
      }
      case "text": {
        if (cmd.text == null) return;
        ctx.save();
        ctx.globalAlpha = this._alpha;
        ctx.fillStyle = cmd.fill || "#000";
        const size = cmd.fontSize || "11px";
        ctx.font = `${typeof size === "number" ? size + "px" : size} ${cmd.fontFamily || "Helvetica, Arial, sans-serif"}`;
        ctx.textAlign = cmd.textAnchor === "middle" ? "center" : cmd.textAnchor === "end" ? "right" : "left";
        ctx.fillText(String(cmd.text), cmd.tx, cmd.ty);
        ctx.restore();
        break;
      }
    }
  }
  /**
   * @param {any} ctx
   * @param {any} style
   * @param {any} path2d
   */
  _fillStrokePath(ctx, style, path2d) {
    if (this._applyFill(ctx, style)) {
      ctx.fill(path2d, style.fillRule === "evenodd" ? "evenodd" : "nonzero");
    }
    if (this._applyStroke(ctx, style)) {
      ctx.stroke(path2d);
    }
    ctx.globalAlpha = 1;
  }
  /**
   * @param {any} ctx
   * @param {any} style
   */
  _fillStroke(ctx, style) {
    if (this._applyFill(ctx, style)) ctx.fill();
    if (this._applyStroke(ctx, style)) ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /**
   * @param {any} ctx
   * @param {any} style
   */
  _strokeOnly(ctx, style) {
    if (this._applyStroke(ctx, style)) ctx.stroke();
    ctx.globalAlpha = 1;
  }
  /**
   * Set fill state. Returns false when there's nothing to fill.
   * @param {any} ctx
   * @param {any} style
   */
  _applyFill(ctx, style) {
    const fill = style.fill;
    if (!fill || fill === "none") return false;
    if (typeof fill === "string" && fill.indexOf("url(") === 0) return false;
    ctx.globalAlpha = (style.fillOpacity == null ? 1 : Number(style.fillOpacity)) * this._alpha;
    ctx.fillStyle = fill;
    return true;
  }
  /**
   * Set stroke state. Returns false when there's nothing to stroke.
   * @param {any} ctx
   * @param {any} style
   */
  _applyStroke(ctx, style) {
    const stroke2 = style.stroke;
    const sw = style.strokeWidth == null ? 1 : Number(style.strokeWidth);
    if (!stroke2 || stroke2 === "none" || !(sw > 0)) return false;
    if (typeof stroke2 === "string" && stroke2.indexOf("url(") === 0) return false;
    ctx.globalAlpha = (style.strokeOpacity == null ? 1 : Number(style.strokeOpacity)) * this._alpha;
    ctx.strokeStyle = stroke2;
    ctx.lineWidth = sw;
    ctx.lineCap = style.lineCap || "butt";
    const dash = style.strokeDash;
    if (dash && dash !== 0) {
      ctx.setLineDash(Array.isArray(dash) ? dash : [Number(dash)]);
    } else {
      ctx.setLineDash([]);
    }
    return true;
  }
  /** Series bitmap for the export composite bridge (P4). @returns {string|null} */
  toDataURL() {
    return this._canvas ? this._canvas.toDataURL() : null;
  }
  destroy() {
    this._host = null;
    this._canvas = null;
    this._c2d = null;
    this._clips = null;
    this._clipRect = null;
    this._unitPaths.clear();
  }
}
class CanvasRenderer {
  /**
   * @param {any} w
   * @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.kind = "canvas";
    this._g = new CanvasGraphics(w);
    this._compositor = new CanvasCompositor(w);
    this._hitCtx = void 0;
  }
  // ── lifecycle ──
  /** Start a fresh series display list for this render pass. */
  beginSeries() {
    this._g.reset();
  }
  /**
   * Finalize the pass: paint the recorded display list and return the SVG host
   * (a `<foreignObject><canvas>`) for `plotChartType` to composite into the tree.
   * @returns {any}
   */
  present() {
    const host = this._compositor.createHost();
    this._compositor.paint(this._g.displayList(), this._g);
    return host;
  }
  /** Fast-path wipe of the series layer. */
  clear() {
    this._compositor.clear();
  }
  /**
   * Whether the existing <canvas> host can be repainted in place (it exists
   * and is still mounted). Used by the data-only fast update path to skip
   * recreating the foreignObject + backing store on every tick.
   * @returns {boolean}
   */
  canRepaintInPlace() {
    const host = this._compositor.getHost();
    return !!(host && host.node && host.node.isConnected);
  }
  /** Repaint the freshly recorded display list into the EXISTING canvas. */
  repaintInPlace() {
    this._compositor.paint(this._g.displayList(), this._g);
  }
  // ── emit primitives (delegate to the display-list shim) ──
  /** @param {any} attrs */
  group(attrs) {
    return this._g.group(attrs);
  }
  /** @param {any} opts */
  drawPath(opts) {
    return this._g.drawPath(opts);
  }
  /** @param {any[]} args */
  drawLine(...args) {
    return (
      /** @type {any} */
      this._g.drawLine(...args)
    );
  }
  /** @param {any[]} args */
  drawRect(...args) {
    return (
      /** @type {any} */
      this._g.drawRect(...args)
    );
  }
  /**
   * Columnar heatmap-cell rect (dense same-shape rects): recorded into typed
   * arrays, painted as style batches. Distinct from drawRect (object command)
   * so 100k cells don't allocate 100k retained commands.
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {any} opts
   */
  drawRectCell(x2, y, w, h, opts) {
    return this._g.drawRectCell(x2, y, w, h, opts);
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r2, attrs) {
    return this._g.drawCircle(r2, attrs);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x2, y, opts) {
    return this._g.drawMarker(x2, y, opts);
  }
  /** @param {any} opts */
  renderPaths(opts) {
    return this._g.renderPaths(opts);
  }
  /** @param {any} opts */
  drawText(opts) {
    return this._g.drawText(opts);
  }
  // ── capabilities ──
  /** @param {string} feature */
  supports(feature) {
    return feature === "solidFill" || feature === "dashArray";
  }
  // ── interaction ──
  // Shared tooltips resolve via coordinate lookup (pointsArray), so those
  // need no per-mark query. Heatmap cells, and the bar-likes and markers of
  // an intersect tooltip, however, are hovered by point (the SVG path
  // hit-tests the node under the cursor); with them on canvas there is no
  // node, so hitTest and hitTestMarker resolve the recorded marks.
  /**
   * Find the cell under a plot-local point (0,0 = plot origin, the same space
   * as the recorded cell geometry). Reverse scan so a later-painted cell wins
   * when cells overlap (continuous-x edges). A linear scan stays well under a
   * frame even at 100k cells (~100k integer compares). Returns the cell's
   * series/dataPoint index plus its geometry for tooltip positioning, or null
   * when the point is off every cell.
   *
   * With no cell there, a bar-like mark (a recorded path standing for one
   * data point: a bar, a candle, half a box plot, a violin body) is looked
   * for instead, with the box of the path that was hit.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x?:number,y?:number,width?:number,height?:number})|null}
   */
  hitTest(px, py) {
    const g = this._g;
    const n2 = g.rectCount ? g.rectCount() : 0;
    const rx = g._crx;
    const ry = g._cry;
    const rw = g._crw;
    const rh = g._crh;
    for (let k2 = n2 - 1; k2 >= 0; k2--) {
      const w = rw[k2];
      const h = rh[k2];
      if (w <= 0 || h <= 0) continue;
      if (px >= rx[k2] && px < rx[k2] + w && py >= ry[k2] && py < ry[k2] + h) {
        return {
          seriesIndex: g._crsi[k2],
          dataPointIndex: g._crdi[k2],
          x: rx[k2],
          y: ry[k2],
          width: w,
          height: h
        };
      }
    }
    return this._hitTestMarks(px, py);
  }
  /**
   * The bar-like mark painted over a plot-local point. Tested against the
   * painted shape, the way a hovered SVG path is: its fill, and its stroke
   * wherever one is painted, so the empty corners of a violin's bounding box
   * are not part of it while a candle's wick and a box plot's whiskers, which
   * are stroke alone, are; and none of the part its clip cuts off (a
   * clipped-away part of an SVG path takes no pointer either). Bar-likes
   * record in series order, which is also their paint order, so a reverse
   * scan finds the topmost. The box comes back with it: the one that path
   * spans, as the hovered SVG path measures.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x?:number,y?:number,width?:number,height?:number})|null}
   */
  _hitTestMarks(px, py) {
    const list = this._g.displayList();
    for (let k2 = list.length - 1; k2 >= 0; k2--) {
      const cmd = list[k2];
      if (cmd.tag !== "path" || cmd.dj == null || !cmd.d) continue;
      const filled = !!cmd.fill && cmd.fill !== "none";
      const stroked = !!cmd.stroke && cmd.stroke !== "none" && cmd.strokeWidth > 0;
      if (!filled && !stroked) continue;
      const clip = this._compositor.clipRect(cmd.clip);
      if (clip && (px < clip.x || px > clip.x + clip.width || py < clip.y || py > clip.y + clip.height)) {
        continue;
      }
      const box = markBox(cmd);
      if (!box) continue;
      const reach = stroked ? cmd.strokeWidth * 5 : 0;
      if (px < box.x - reach || px > box.x + box.width + reach || py < box.y - reach || py > box.y + box.height + reach) {
        continue;
      }
      const ctx = this._hitContext();
      if (!ctx) return null;
      if (!cmd.path2d) {
        try {
          cmd.path2d = new Path2D(cmd.d);
        } catch (e2) {
          continue;
        }
      }
      const rule = cmd.fillRule === "evenodd" ? "evenodd" : "nonzero";
      let hit = filled && ctx.isPointInPath(cmd.path2d, px, py, rule);
      if (!hit && stroked) {
        ctx.lineWidth = cmd.strokeWidth;
        ctx.lineCap = cmd.lineCap || "butt";
        hit = ctx.isPointInStroke(cmd.path2d, px, py);
      }
      if (hit) {
        return __spreadValues({ seriesIndex: cmd.si, dataPointIndex: cmd.dj }, box);
      }
    }
    return null;
  }
  /**
   * The marker painted over a plot-local point, for a tooltip that shows on
   * the hovered point (intersect): on SVG the marker node under the pointer
   * names it, and on canvas there is none. Markers paint after every other
   * mark (CanvasCompositor.paint) in record order, so a reverse scan finds
   * the topmost, which is the one an SVG pointer would land on where a
   * scatter overlays bars. Tested against the painted shape, fill and
   * stroke, and only inside the marker clip they are painted through, as a
   * clipped-away SVG marker takes no pointer. Null when no sized marker of
   * a known data point is there.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,size:number})|null}
   */
  hitTestMarker(px, py) {
    const g = this._g;
    const n2 = g.markerCount();
    if (!n2) return null;
    const clip = this._compositor.clipRect("marker");
    if (clip && (px < clip.x || px > clip.x + clip.width || py < clip.y || py > clip.y + clip.height)) {
      return null;
    }
    for (let k2 = n2 - 1; k2 >= 0; k2--) {
      const size = g._msize[k2];
      const x2 = g._mx[k2];
      const y = g._my[k2];
      const j2 = g._mdi[k2];
      if (!(size > 0) || y !== y || j2 < 0) continue;
      const style = g.markerStyle(k2);
      const stroked = !!(style == null ? void 0 : style.stroke) && style.stroke !== "none" && style.strokeWidth > 0;
      const halfStroke = stroked ? style.strokeWidth / 2 : 0;
      const reach = size * 1.2 + halfStroke;
      const dx = px - x2;
      const dy = py - y;
      if (dx < -reach || dx > reach || dy < -reach || dy > reach) continue;
      let hit;
      if (g._mshape[k2] === 0) {
        hit = dx * dx + dy * dy <= (size + halfStroke) * (size + halfStroke);
      } else {
        hit = this._hitsMarkerShape(k2, dx, dy, size, style, stroked);
      }
      if (hit) {
        return { seriesIndex: g._msi[k2], dataPointIndex: j2, x: x2, y, size };
      }
    }
    return null;
  }
  /**
   * Whether a point, relative to a non-circle marker's centre, is on its
   * painted shape: the same unit geometry the compositor paints it with.
   * @param {number} k  marker index
   * @param {number} dx
   * @param {number} dy
   * @param {number} size
   * @param {any} style
   * @param {boolean} stroked
   * @returns {boolean}
   */
  _hitsMarkerShape(k2, dx, dy, size, style, stroked) {
    const ctx = this._hitContext();
    if (!ctx) return false;
    let path;
    try {
      path = new Path2D(this._g.markerPath(0, 0, this._g._mshape[k2], size));
    } catch (e2) {
      return false;
    }
    const filled = !!(style == null ? void 0 : style.fill) && style.fill !== "none";
    if (filled && ctx.isPointInPath(path, dx, dy)) return true;
    if (!stroked) return false;
    ctx.lineWidth = style.strokeWidth;
    ctx.lineCap = "butt";
    return ctx.isPointInStroke(path, dx, dy);
  }
  /**
   * Find a bar-like mark by identity rather than by point: keyboard focus
   * knows the series and data point it is on. The first path recorded for
   * the pair, as the first `path[j]` of the series is on SVG (a box plot's
   * lower half, a violin's body), with the box it spans and its `d`, so a
   * focus outline can trace the painted shape. Null when nothing was painted
   * for that pair.
   * @param {number} seriesIndex  realIndex
   * @param {number} dataPointIndex
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,width:number,height:number,d:string})|null}
   */
  findMark(seriesIndex, dataPointIndex) {
    const list = this._g.displayList();
    for (let k2 = 0; k2 < list.length; k2++) {
      const cmd = list[k2];
      if (cmd.tag !== "path" || !cmd.d) continue;
      if (cmd.si !== seriesIndex || cmd.dj !== dataPointIndex) continue;
      const box = markBox(cmd);
      if (!box) continue;
      return __spreadProps(__spreadValues({ seriesIndex, dataPointIndex }, box), { d: cmd.d });
    }
    return null;
  }
  /**
   * Find a marker by identity rather than by point (hitTestMarker): keyboard
   * focus knows the series and data point it is on. The topmost one painted
   * for the pair, as the hit test reports it, and only one the hit test
   * could report: sized, at a known y. With the shape it was painted in, as
   * a `d`, so a focus outline can trace it. Null when none was painted.
   * @param {number} seriesIndex  realIndex
   * @param {number} dataPointIndex
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,size:number,d:string})|null}
   */
  findMarker(seriesIndex, dataPointIndex) {
    const g = this._g;
    for (let k2 = g.markerCount() - 1; k2 >= 0; k2--) {
      if (g._msi[k2] !== seriesIndex || g._mdi[k2] !== dataPointIndex) continue;
      const size = g._msize[k2];
      const y = g._my[k2];
      if (!(size > 0) || y !== y) continue;
      const x2 = g._mx[k2];
      const d = g.markerPath(x2, y, g._mshape[k2], size);
      return { seriesIndex, dataPointIndex, x: x2, y, size, d };
    }
    return null;
  }
  /**
   * Find a cell by identity rather than by point: keyboard focus knows the
   * series and data point it is on, and needs the box the cell was painted in
   * (plot-local, as hitTest returns it) to place the tooltip and draw a focus
   * outline. `radius` is the cells' shared corner radius. Null when no cell
   * was recorded for that pair.
   * @param {number} seriesIndex
   * @param {number} dataPointIndex
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,width:number,height:number,radius:number})|null}
   */
  findCell(seriesIndex, dataPointIndex) {
    const g = this._g;
    const n2 = g.rectCount ? g.rectCount() : 0;
    const si = g._crsi;
    const di = g._crdi;
    for (let k2 = n2 - 1; k2 >= 0; k2--) {
      if (si[k2] === seriesIndex && di[k2] === dataPointIndex) {
        return {
          seriesIndex,
          dataPointIndex,
          x: g._crx[k2],
          y: g._cry[k2],
          width: g._crw[k2],
          height: g._crh[k2],
          radius: g._cellRadius || 0
        };
      }
    }
    return null;
  }
  /**
   * A detached 2D context kept for isPointInPath. The painting context
   * carries the device-pixel and pad transform, which the point would
   * have to be pushed through first; this one stays at identity, so plot
   * px go in as they are.
   * @returns {any}
   */
  _hitContext() {
    if (this._hitCtx === void 0) {
      const canvas = (
        /** @type {any} */
        BrowserAPIs.createElement("canvas")
      );
      this._hitCtx = (canvas == null ? void 0 : canvas.getContext) && canvas.getContext("2d") || null;
    }
    return this._hitCtx;
  }
  /**
   * Repaint the retained series scene with a per-series dim spec (hover /
   * legend restyle). No geometry recompute: reuses the display list + marker
   * columns recorded at render time. Pass null to repaint at full opacity.
   * @param {{active:number, opacity:number}|null} [dim]
   */
  restyle(dim) {
    this._compositor.paint(this._g.displayList(), this._g, dim || null);
  }
  // ── export ── toBitmap() and the compositor's toDataURL() back
  //    Exports.inlineCanvasLayers, which inlines the series bitmap as an SVG
  //    <image> so PNG/SVG export includes the canvas layer in correct z-order.
  /** @returns {{dataURL:string,x:number,y:number,w:number,h:number}|null} */
  toBitmap() {
    const url = this._compositor.toDataURL();
    if (!url) return null;
    const gl = this.w.globals;
    const cfg = this.w.config.chart;
    const pad = this._compositor._pad;
    return {
      dataURL: url,
      x: (gl.translateX || 0) + (cfg.offsetX || 0) - pad.left,
      y: (gl.translateY || 0) + (cfg.offsetY || 0) - pad.top,
      w: (this.w.layout.gridWidth || 0) + pad.left + pad.right,
      h: (this.w.layout.gridHeight || 0) + pad.top + pad.bottom
    };
  }
  destroy() {
    this._compositor.destroy();
    this._hitCtx = void 0;
  }
}
ApexCharts__default.registerRenderer(
  "canvas",
  /**
   * @param {any} w
   * @param {any} ctx
   */
  (w, ctx) => new CanvasRenderer(w, ctx)
);
class ContextMenu {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.menu = null;
    this._items = [];
    this._focusIndex = -1;
    this._trigger = null;
    this._onContext = this._onContext.bind(this);
    this._onDocDown = this._onDocDown.bind(this);
    this._onKey = this._onKey.bind(this);
    this._afterRender = this._afterRender.bind(this);
    ctx.addEventListener("mounted", this._afterRender);
    ctx.addEventListener("updated", this._afterRender);
  }
  _cfg() {
    return this.w.config.chart.contextMenu || {};
  }
  _enabled() {
    return this._cfg().enabled === true;
  }
  _doc() {
    return this.w.dom.baseEl && this.w.dom.baseEl.ownerDocument;
  }
  /** (Re)attach the contextmenu trigger to the freshly (re)built SVG. */
  _afterRender() {
    this._detachTrigger();
    this.close();
    if (!this._enabled() || !Environment.isBrowser()) return;
    const svg = this.w.dom.Paper && this.w.dom.Paper.node;
    if (!svg) return;
    svg.addEventListener("contextmenu", this._onContext);
    this._trigger = svg;
  }
  _detachTrigger() {
    if (this._trigger) {
      this._trigger.removeEventListener("contextmenu", this._onContext);
      this._trigger = null;
    }
  }
  /** @param {any} e */
  _onContext(e2) {
    if (!this._enabled()) return;
    e2.preventDefault();
    this.open(e2.clientX, e2.clientY);
  }
  /**
   * Client pixel -> data {x,y} via the plot's client-rect fraction (scale
   * independent). Null when the plot is not measurable, and on a chart with
   * no x/y axes (a pie, a donut, a radial bar), where a click has no data
   * point to name and the items that act on one leave it alone. The plot's
   * own rect, not the `.apexcharts-grid` box: that starts a pixel below the
   * plot, and on a numeric-x bar chart its gridlines run
   * barPadForNumericAxis past both sides, so "Add note here" landed that far
   * from the click.
   * @param {number} cx @param {number} cy
   * @returns {{x:number,y:number}|null}
   */
  _clientToData(cx, cy) {
    const w = this.w;
    if (!w.globals.axisCharts || !w.dom.baseEl || !w.dom.baseEl.querySelector(".apexcharts-svg")) {
      return null;
    }
    const r2 = TooltipUtils.plotRect(w);
    if (!r2.width || !r2.height) return null;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = clamp((cx - r2.left) / r2.width);
    const fy = clamp((cy - r2.top) / r2.height);
    const x2 = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const s2 = w.globals.yAxisScale && w.globals.yAxisScale[0];
    const ymin = s2 && isFinite(s2.niceMin) ? s2.niceMin : w.globals.minY;
    const ymax = s2 && isFinite(s2.niceMax) ? s2.niceMax : w.globals.maxY;
    const y = ymax - fy * (ymax - ymin);
    return { x: x2, y };
  }
  /**
   * Resolve the configured items into runnable entries, dropping built-ins
   * whose dependency is absent (e.g. measure not enabled).
   * @param {any} context
   * @returns {Array<{id:string,label:string,run:Function}>}
   */
  _resolveItems(context) {
    const cfg = this._cfg();
    const raw = Array.isArray(cfg.items) && cfg.items.length ? cfg.items : ["annotate", "xline", "yline", "measure"];
    const labels = cfg.labels || {};
    const out = [];
    raw.forEach((it) => {
      if (typeof it === "string") {
        if (it === "annotate") {
          out.push({
            id: "annotate",
            label: labels.annotate || "Add note here",
            run: () => this._annotate(context)
          });
        } else if (it === "xline") {
          out.push({
            id: "xline",
            label: labels.xline || "Annotate here",
            run: () => this._line(context, "x")
          });
        } else if (it === "yline") {
          out.push({
            id: "yline",
            label: labels.yline || "Mark this level",
            run: () => this._line(context, "y")
          });
        } else if (it === "measure") {
          const m = this.ctx.measure;
          const on = m && this.w.config.chart.measure && this.w.config.chart.measure.enabled;
          if (on) {
            out.push({
              id: "measure",
              label: labels.measure || "Measure from here",
              run: () => m.seedFromClient(context.clientX, context.clientY)
            });
          }
        }
      } else if (it && typeof it === "object" && typeof it.onClick === "function") {
        out.push({
          id: it.id || "custom",
          label: it.label || "Action",
          run: () => it.onClick(this.ctx, context)
        });
      }
    });
    return out;
  }
  /** @param {any} context */
  _annotate(context) {
    if (context.x == null || context.y == null) return;
    const cfg = this._cfg();
    const ink = this.ctx.ink;
    if (ink && typeof ink.createAt === "function") {
      ink.createAt(context.x, context.y, { text: cfg.noteText || "Note" });
      return;
    }
    this.ctx.addPointAnnotation(
      {
        x: context.x,
        y: context.y,
        marker: { size: 5 },
        label: {
          text: cfg.noteText || "Note",
          style: { background: "#fff", color: "#334155" }
        }
      },
      true
    );
  }
  /**
   * The 'xline' / 'yline' items: drop a dashed line annotation at the clicked
   * data point ('x' = vertical line at the clicked x, 'y' = horizontal line
   * at the clicked y). Lines only: no x2/y2 is ever set, so this never
   * creates a range rectangle. Both items share chart.contextMenu.line
   * ({ text, strokeDashArray, color }) for styling.
   * @param {any} context @param {'x'|'y'} axis
   */
  _line(context, axis) {
    const lc = this._cfg().line || {};
    const val = axis === "x" ? context.x : context.y;
    if (val == null) return;
    const ink = this.ctx.ink;
    if (ink && typeof ink.createLineAt === "function") {
      ink.createLineAt(axis, val, {
        text: lc.text,
        strokeDashArray: lc.strokeDashArray,
        color: lc.color
      });
      return;
    }
    const anno = {
      strokeDashArray: lc.strokeDashArray != null ? lc.strokeDashArray : 4
    };
    if (lc.text) anno.label = { text: lc.text };
    if (lc.color) {
      anno.borderColor = lc.color;
      anno.label = Utils.extend(anno.label || {}, { borderColor: lc.color });
    }
    if (axis === "x") {
      this.ctx.addXaxisAnnotation(Utils.extend(anno, { x: val }), true);
    } else {
      this.ctx.addYaxisAnnotation(Utils.extend(anno, { y: val }), true);
    }
  }
  /**
   * Open the menu at a client-space point.
   * @param {number} clientX @param {number} clientY
   */
  open(clientX, clientY) {
    this.close();
    const w = this.w;
    const elWrap = w.dom.elWrap;
    const doc = this._doc();
    if (!elWrap || !doc) return;
    const data = this._clientToData(clientX, clientY);
    const g = w.globals;
    const context = {
      x: data ? data.x : null,
      y: data ? data.y : null,
      seriesIndex: g.capturedSeriesIndex >= 0 ? g.capturedSeriesIndex : null,
      dataPointIndex: g.capturedDataPointIndex >= 0 ? g.capturedDataPointIndex : null,
      clientX,
      clientY
    };
    const items = this._resolveItems(context);
    if (!items.length) return;
    this._items = items;
    const menu = doc.createElement("div");
    menu.className = "apexcharts-context-menu";
    menu.setAttribute("role", "menu");
    menu.style.position = "absolute";
    menu.style.visibility = "hidden";
    items.forEach((it, i2) => {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "apexcharts-context-menu-item";
      btn.setAttribute("role", "menuitem");
      btn.tabIndex = -1;
      btn.textContent = it.label;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._activate(i2);
      });
      btn.addEventListener("mouseenter", () => this._focus(i2));
      menu.appendChild(btn);
    });
    elWrap.appendChild(menu);
    this.menu = menu;
    const wrapRect = elWrap.getBoundingClientRect();
    const zoom = TooltipUtils.plotRect(w).zoom;
    let left = (clientX - wrapRect.left) / zoom;
    let top = (clientY - wrapRect.top) / zoom;
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    const maxLeft = Math.max(0, elWrap.clientWidth - mw);
    const maxTop = Math.max(0, elWrap.clientHeight - mh);
    if (left > maxLeft) left = maxLeft;
    if (top > maxTop) top = maxTop;
    menu.style.left = Math.max(0, left) + "px";
    menu.style.top = Math.max(0, top) + "px";
    menu.style.visibility = "visible";
    doc.addEventListener("mousedown", this._onDocDown, true);
    doc.addEventListener("keydown", this._onKey, true);
    this._focus(0);
  }
  /** @param {number} i */
  _focus(i2) {
    if (!this.menu) return;
    const btns = this.menu.querySelectorAll(".apexcharts-context-menu-item");
    if (this._focusIndex >= 0 && btns[this._focusIndex]) {
      btns[this._focusIndex].classList.remove("apexcharts-context-menu-item--active");
    }
    this._focusIndex = i2;
    if (btns[i2]) {
      btns[i2].classList.add("apexcharts-context-menu-item--active");
      if (typeof btns[i2].focus === "function") btns[i2].focus();
    }
  }
  /** @param {number} i */
  _activate(i2) {
    const it = this._items[i2];
    this.close();
    if (it) it.run();
  }
  /** @param {any} e */
  _onDocDown(e2) {
    if (this.menu && this.menu.contains(e2.target)) return;
    this.close();
  }
  /** @param {any} e */
  _onKey(e2) {
    if (!this.menu || !this._items.length) return;
    if (e2.key === "Escape") {
      e2.preventDefault();
      this.close();
    } else if (e2.key === "ArrowDown") {
      e2.preventDefault();
      this._focus((this._focusIndex + 1) % this._items.length);
    } else if (e2.key === "ArrowUp") {
      e2.preventDefault();
      this._focus((this._focusIndex - 1 + this._items.length) % this._items.length);
    } else if (e2.key === "Enter" || e2.key === " ") {
      e2.preventDefault();
      this._activate(this._focusIndex < 0 ? 0 : this._focusIndex);
    }
  }
  close() {
    const doc = this._doc();
    if (doc) {
      doc.removeEventListener("mousedown", this._onDocDown, true);
      doc.removeEventListener("keydown", this._onKey, true);
    }
    if (this.menu && this.menu.parentNode) {
      this.menu.parentNode.removeChild(this.menu);
    }
    this.menu = null;
    this._items = [];
    this._focusIndex = -1;
  }
  teardown() {
    this.close();
    this._detachTrigger();
  }
}
ApexCharts__default.registerFeatures({ contextMenu: ContextMenu });
function isEditableTarget(node) {
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || node.isContentEditable === true;
}
class History {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.stack = [];
    this.pointer = -1;
    this.applying = false;
    this._batching = false;
    this._counter = 0;
    this._coalesceTimer = null;
    this._settleTimer = null;
    this._pendingLabel = void 0;
    this._keydownTarget = null;
    this._pointerTarget = null;
    this._engaged = false;
    this._wired = false;
    this._readConfig();
    this._onMounted = this._onMounted.bind(this);
    this._onUpdated = this._onUpdated.bind(this);
    this._onSelection = this._onSelection.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this.init();
  }
  /**
   * (Re)read chart.history config. Called at construction and again on every
   * mounted/updated event so `updateOptions({ chart: { history: {...} } })`
   * takes effect at runtime: enabling wires the keyboard + starts capturing,
   * disabling stops capturing (the stack is kept for a later re-enable).
   */
  _readConfig() {
    const w = this.w;
    const cfg = w.config.chart && w.config.chart.history || {};
    this.enabled = !!cfg.enabled;
    this.maxDepth = cfg.maxDepth > 0 ? cfg.maxDepth : 100;
    this.coalesceMs = cfg.coalesceMs != null ? cfg.coalesceMs : 250;
    this.keyboard = cfg.keyboard !== false;
  }
  /** Re-sync config, then wire/unwire the keyboard to match. */
  _syncConfig() {
    this._readConfig();
    if (this.enabled && this.keyboard) this._wireKeyboard();
    else this._unwireKeyboard();
  }
  init() {
    if (this._wired) return;
    this._wired = true;
    this.ctx.addEventListener("mounted", this._onMounted);
    this.ctx.addEventListener("updated", this._onUpdated);
    this.ctx.addEventListener("scrolled", this._onUpdated);
    this.ctx.addEventListener("dataPointSelection", this._onSelection);
    if (this.enabled && this.keyboard) this._wireKeyboard();
  }
  /**
   * Keyboard: Cmd/Ctrl+Z = undo, Shift+Cmd/Ctrl+Z or Ctrl+Y = redo. Bound on
   * the document (not the chart element) because pointer gestures that create
   * an undo step (annotation drag, zoom, pan) call preventDefault and so never
   * move focus into the chart, leaving an el-scoped listener unreachable. To
   * stay non-intrusive it acts only when this chart is "engaged" (see
   * _onKeyDown): a capture-phase pointerdown marks engagement so the shortcut
   * follows the chart the user last touched, and defers to text editing.
   */
  _wireKeyboard() {
    if (this._keydownTarget) return;
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    const doc = el && el.ownerDocument;
    if (!Environment.isBrowser() || !doc) return;
    doc.addEventListener("keydown", this._onKeyDown);
    doc.addEventListener("pointerdown", this._onPointerDown, true);
    doc.addEventListener("mousedown", this._onPointerDown, true);
    this._keydownTarget = doc;
    this._pointerTarget = doc;
  }
  _unwireKeyboard() {
    if (this._keydownTarget) {
      this._keydownTarget.removeEventListener("keydown", this._onKeyDown);
      this._keydownTarget = null;
    }
    if (this._pointerTarget) {
      this._pointerTarget.removeEventListener("pointerdown", this._onPointerDown, true);
      this._pointerTarget.removeEventListener("mousedown", this._onPointerDown, true);
      this._pointerTarget = null;
    }
    this._engaged = false;
  }
  // ─── Event handlers ─────────────────────────────────────────────────────
  _onMounted() {
    this._syncConfig();
    if (!this.enabled) return;
    if (this.stack.length === 0) this._commit("initial", true);
  }
  _onUpdated() {
    this._syncConfig();
    if (!this.enabled) return;
    if (this.applying) {
      this._refreshSettle();
      return;
    }
    this._schedule("update");
  }
  _onSelection() {
    if (!this.enabled || this.applying) return;
    this._schedule("selection");
  }
  /**
   * Mark whether the chart is engaged: a capture-phase pointerdown inside `el`
   * engages it (runs before feature handlers stopPropagation), one elsewhere
   * releases it. Capture phase so an annotation/zoom gesture that stops
   * propagation still registers.
   * @param {any} e
   */
  _onPointerDown(e2) {
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    this._engaged = !!(el && e2.target && el.contains(e2.target));
  }
  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e2) {
    if (!(e2.metaKey || e2.ctrlKey)) return;
    const key = (e2.key || "").toLowerCase();
    if (key !== "z" && key !== "y") return;
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    if (!el) return;
    const doc = el.ownerDocument;
    const active = doc && doc.activeElement;
    if (isEditableTarget(active)) return;
    if (!(el.contains(active) || this._engaged)) return;
    const redo = key === "y" || e2.shiftKey;
    e2.preventDefault();
    if (redo) this.redo();
    else this.undo();
  }
  // ─── Capture (coalesced) ────────────────────────────────────────────────
  /**
   * @param {string} label
   */
  _schedule(label2) {
    if (this.applying || this._batching || !this.enabled) return;
    this._pendingLabel = label2;
    if (this.coalesceMs > 0 && Environment.isBrowser()) {
      clearTimeout(this._coalesceTimer);
      this._coalesceTimer = setTimeout(
        () => this._commit(this._pendingLabel),
        this.coalesceMs
      );
    } else {
      this._commit(label2);
    }
  }
  /**
   * @param {string} [label]
   * @param {boolean} [force] bypass the applying/batching guard (baseline / transaction)
   */
  _commit(label2, force) {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    if (!force && (this.applying || this._batching)) return;
    const cp = this._capture(label2);
    const current = this.stack[this.pointer];
    if (current && current.sig === cp.sig) return;
    if (this.pointer < this.stack.length - 1) {
      this.stack.splice(this.pointer + 1);
    }
    this.stack.push(cp);
    this.pointer = this.stack.length - 1;
    while (this.stack.length > this.maxDepth) {
      this.stack.shift();
      this.pointer--;
    }
    this._emitChange();
  }
  /**
   * @param {string} [label]
   */
  _capture(label2) {
    const view = captureViewState(this.w, this.ctx);
    const { config, seriesSig } = this._cloneConfigCOW();
    return {
      id: `hist-${++this._counter}`,
      view,
      config,
      seriesSig,
      label: label2 || "change",
      at: Environment.isBrowser() ? Date.now() : 0,
      origin: "local",
      // reserved for per-user scoping (Live Rooms)
      sig: this._signature(view, config)
    };
  }
  /**
   * Clone w.config, sharing the previous checkpoint's cloned series when the
   * live series CONTENT is unchanged (copy-on-write). Sharing is decided by a
   * value signature, not reference identity: callers commonly mutate a kept
   * series array in place and pass the same reference back to updateSeries, and
   * an identity check would share a stale clone for exactly that case. The
   * stringify is not extra cost: _signature already serialises the series as
   * part of dedup.
   * @returns {{ config: any, seriesSig: string|null }}
   */
  _cloneConfigCOW() {
    const w = this.w;
    const prev = this.stack[this.pointer];
    let seriesSig = null;
    try {
      seriesSig = JSON.stringify(w.config.series);
    } catch (e2) {
      seriesSig = null;
    }
    let cloned;
    if (prev && seriesSig !== null && prev.seriesSig === seriesSig) {
      const _a = w.config, { series: _series } = _a, rest = __objRest(_a, ["series"]);
      cloned = Utils.clone(rest);
      cloned.series = prev.config.series;
    } else {
      cloned = Utils.clone(w.config);
    }
    return { config: cloned, seriesSig };
  }
  /**
   * Data-level signature for dedup. Functions are dropped by JSON (fine: a
   * checkpoint whose only change is a function reference is not a meaningful
   * undo step). Runs once per committed checkpoint, not per raw event.
   * @param {any} view
   * @param {any} config
   * @returns {string}
   */
  _signature(view, config) {
    try {
      return JSON.stringify(view) + "|" + JSON.stringify(config);
    } catch (e2) {
      return `nosig-${this._counter}`;
    }
  }
  // ─── Restore ────────────────────────────────────────────────────────────
  /**
   * @param {any} cp
   * @param {boolean} animate
   */
  _restore(cp, animate) {
    if (!cp) return;
    this.applying = true;
    let p;
    try {
      this.ctx.clearAnnotations();
      p = this.ctx.updateOptions(Utils.clone(cp.config), false, animate, false, false);
    } catch (e2) {
      this.applying = false;
      throw e2;
    }
    Promise.resolve(p).then(() => {
      if (this.w.globals.isDestroyed) {
        this.applying = false;
        return;
      }
      applyViewInteraction(this.ctx, cp.view);
      this._refreshSettle();
      this._emitChange();
    }).catch(() => {
      this.applying = false;
    });
  }
  /**
   * Hold `applying` true until the restore's burst of async 'updated' events
   * has drained (one macrotask after the last one). Refreshed by _onUpdated.
   */
  _refreshSettle() {
    if (!Environment.isBrowser()) {
      this.applying = false;
      return;
    }
    clearTimeout(this._settleTimer);
    this._settleTimer = setTimeout(() => {
      this.applying = false;
    }, 0);
  }
  // ─── Public API ─────────────────────────────────────────────────────────
  /**
   * Commit a checkpoint of the current state now (a discrete undo step). Used by
   * callers that mutate `w.config` without going through a full re-render (e.g.
   * Ink Layer's targeted annotation redraws, which fire no 'updated' event).
   * No-op when disabled or while a restore is applying.
   * @param {string} [label]
   */
  snapshot(label2) {
    if (!this.enabled || this.applying) return;
    this._commit(label2 || "change");
  }
  /**
   * @param {boolean} [animate]
   */
  undo(animate = true) {
    if (!this.canUndo()) return;
    this.pointer--;
    this._restore(this.stack[this.pointer], animate);
  }
  /**
   * @param {boolean} [animate]
   */
  redo(animate = true) {
    if (!this.canRedo()) return;
    this.pointer++;
    this._restore(this.stack[this.pointer], animate);
  }
  canUndo() {
    return this.pointer > 0;
  }
  canRedo() {
    return this.pointer > -1 && this.pointer < this.stack.length - 1;
  }
  /**
   * @param {string} id
   * @param {boolean} [animate]
   */
  jump(id, animate = true) {
    const idx = this.stack.findIndex((c) => c.id === id);
    if (idx === -1 || idx === this.pointer) return;
    this.pointer = idx;
    this._restore(this.stack[idx], animate);
  }
  /** Clear the history, keeping the current state as the new baseline. */
  clear() {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    const current = this.stack[this.pointer];
    this.stack = current ? [current] : [];
    this.pointer = this.stack.length - 1;
    this._emitChange();
  }
  /**
   * Group multiple edits into a single undo step. `fn` may be async; await your
   * updateOptions/updateSeries calls inside it so the intermediate 'updated'
   * events are suppressed and only one checkpoint is committed afterwards.
   * @param {() => (void | Promise<any>)} fn
   * @param {{ label?: string }} [opts]
   * @returns {Promise<void>}
   */
  transaction(fn, opts = {}) {
    if (typeof fn !== "function") return Promise.resolve();
    const wasBatching = this._batching;
    this._batching = true;
    return Promise.resolve().then(() => fn()).finally(() => {
      this._batching = wasBatching;
      if (!wasBatching) this._commit(opts.label || "transaction", true);
    });
  }
  /**
   * @returns {{ id: string, label: string, at: number }[]}
   */
  entries() {
    return this.stack.map((c) => ({ id: c.id, label: c.label, at: c.at }));
  }
  /** Lightweight state for the historyChange event / a history-rail UI. */
  state() {
    return {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      index: this.pointer,
      length: this.stack.length
    };
  }
  _emitChange() {
    this.ctx.events.fireEvent("historyChange", [this.ctx, this.state()]);
  }
  /** Drop the stack + detach listeners (called on full destroy). */
  teardown() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    clearTimeout(this._coalesceTimer);
    clearTimeout(this._settleTimer);
    this._coalesceTimer = null;
    this._settleTimer = null;
    this._unwireKeyboard();
    if (this._wired) {
      (_b = (_a = this.ctx).removeEventListener) == null ? void 0 : _b.call(_a, "mounted", this._onMounted);
      (_d = (_c = this.ctx).removeEventListener) == null ? void 0 : _d.call(_c, "updated", this._onUpdated);
      (_f = (_e = this.ctx).removeEventListener) == null ? void 0 : _f.call(_e, "scrolled", this._onUpdated);
      (_h = (_g = this.ctx).removeEventListener) == null ? void 0 : _h.call(_g, "dataPointSelection", this._onSelection);
    }
    this.stack = [];
    this.pointer = -1;
    this._wired = false;
  }
}
ApexCharts__default.registerFeatures({ history: History });
const DataLabels = ApexCharts.__apex_DataLabels;
const resolveEasing = ApexCharts.__apex_Easing_resolveEasing;
const parsePath = ApexCharts.__apex_PathMorphing_parsePath;
const arrayToPath = ApexCharts.__apex_PathMorphing_arrayToPath;
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
  for (let i2 = 1; i2 < cmds.length; i2++) {
    if (cmds[i2][0] === "M") return null;
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
  for (let i2 = 2; i2 < body.length; i2++) {
    if (body[i2][0] !== segType) return null;
  }
  const anchors = body.map(
    (c) => c[0] === "C" ? [Number(c[5]), Number(c[6])] : [Number(c[1]), Number(c[2])]
  );
  for (const a2 of anchors) {
    if (!isFinite(a2[0]) || !isFinite(a2[1])) return null;
  }
  return { body, closing, segType, anchors };
}
function lerpPt(a2, b, t2) {
  return [a2[0] + (b[0] - a2[0]) * t2, a2[1] + (b[1] - a2[1]) * t2];
}
function splitCubic(s2, cmd, t2) {
  const p0 = s2;
  const p1 = [cmd[1], cmd[2]];
  const p2 = [cmd[3], cmd[4]];
  const p3 = [cmd[5], cmd[6]];
  const p01 = lerpPt(p0, p1, t2);
  const p12 = lerpPt(p1, p2, t2);
  const p23 = lerpPt(p2, p3, t2);
  const p012 = lerpPt(p01, p12, t2);
  const p123 = lerpPt(p12, p23, t2);
  const mid = lerpPt(p012, p123, t2);
  return {
    first: ["C", p01[0], p01[1], p012[0], p012[1], mid[0], mid[1]],
    second: ["C", p123[0], p123[1], p23[0], p23[1], p3[0], p3[1]],
    mid
  };
}
function splitLine(s2, cmd, t2) {
  const e2 = [cmd[1], cmd[2]];
  const mid = lerpPt(s2, e2, t2);
  return {
    first: ["L", mid[0], mid[1]],
    second: ["L", e2[0], e2[1]],
    mid
  };
}
function expandPath(analysis, ownIdx) {
  const { body, closing, segType, anchors } = analysis;
  const n2 = anchors.length;
  const m = ownIdx.length;
  const degen = (p) => segType === "C" ? ["C", p[0], p[1], p[0], p[1], p[0], p[1]] : ["L", p[0], p[1]];
  const out = [["M", anchors[0][0], anchors[0][1]]];
  let firstOwn = 0;
  while (firstOwn < m && ownIdx[firstOwn] !== 0) firstOwn++;
  for (let q2 = 1; q2 <= firstOwn; q2++) out.push(degen(anchors[0]));
  let entry = firstOwn + 1;
  for (let s2 = 0; s2 < n2 - 1; s2++) {
    let interior = 0;
    while (entry + interior < m && ownIdx[entry + interior] === -1) interior++;
    const cmd = body[s2 + 1];
    if (!interior) {
      out.push(cmd.slice());
    } else {
      const totalParts = interior + 1;
      let start = anchors[s2];
      let rest = cmd;
      for (let q2 = 0; q2 < interior; q2++) {
        const t2 = 1 / (totalParts - q2);
        const sp = segType === "C" ? splitCubic(start, rest, t2) : splitLine(start, rest, t2);
        out.push(sp.first);
        start = sp.mid;
        rest = sp.second;
      }
      out.push(rest);
    }
    entry += interior + 1;
  }
  while (entry < m) {
    out.push(degen(anchors[n2 - 1]));
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
  const fromOwn = entries.map((e2) => e2.oldJ);
  const toOwn = entries.map((e2) => e2.newJ);
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
function datumKey(w, realIndex, j2) {
  var _a, _b, _c, _d;
  if ((_a = w.axisFlags) == null ? void 0 : _a.isXNumeric) {
    const sx = (_c = (_b = w.seriesData) == null ? void 0 : _b.seriesX) == null ? void 0 : _c[realIndex];
    if (sx && sx.length && sx[j2] != null) return "x:" + sx[j2];
  }
  const lbl = (_d = w.globals.labels) == null ? void 0 : _d[j2];
  if (lbl != null && String(lbl) !== "") {
    return "c:" + (Array.isArray(lbl) ? lbl.join(" ") : String(lbl));
  }
  return "j:" + j2;
}
function frameDatumKey(frame, realIndex, j2) {
  var _a, _b;
  if (frame.isXNumeric) {
    const sx = (_a = frame.seriesX) == null ? void 0 : _a[realIndex];
    if (sx && sx.length && sx[j2] != null) return "x:" + sx[j2];
  }
  const lbl = (_b = frame.labels) == null ? void 0 : _b[j2];
  if (lbl != null && String(lbl) !== "") {
    return "c:" + (Array.isArray(lbl) ? lbl.join(" ") : String(lbl));
  }
  return "j:" + j2;
}
function joinKeys(oldKeys, newKeys) {
  const oldIndex = /* @__PURE__ */ new Map();
  oldKeys.forEach((k2, i2) => {
    if (!oldIndex.has(k2)) oldIndex.set(k2, i2);
  });
  const toOld = new Array(newKeys.length);
  const usedOld = /* @__PURE__ */ new Set();
  let prev = -1;
  let ordered = true;
  let identity = oldKeys.length === newKeys.length;
  newKeys.forEach((k2, i2) => {
    const oi = oldIndex.has(k2) && !usedOld.has(oldIndex.get(k2)) ? oldIndex.get(k2) : -1;
    toOld[i2] = oi;
    if (oi !== -1) {
      usedOld.add(oi);
      if (oi < prev) ordered = false;
      prev = oi;
    }
    if (oi !== i2) identity = false;
  });
  const exits = [];
  for (let i2 = 0; i2 < oldKeys.length; i2++) {
    if (!usedOld.has(i2)) exits.push(i2);
  }
  return { toOld, exits, ordered, changed: !identity };
}
function uniquifyKeys(keys) {
  const seen = /* @__PURE__ */ new Map();
  return keys.map((k2) => {
    const count = seen.get(k2) || 0;
    seen.set(k2, count + 1);
    return count === 0 ? k2 : `${k2}#${count}`;
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
    oldY.map((_2, j2) => frameDatumKey(frame, realIndex, j2))
  );
  const newKeys = uniquifyKeys(newY.map((_2, j2) => datumKey(w, realIndex, j2)));
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
  let k2 = -1;
  for (let i2 = 0; i2 < oldX.length; i2++) {
    if (oldX[i2] === newX[0]) {
      k2 = i2;
      break;
    }
  }
  if (k2 === -1) return null;
  const overlap = Math.min(oldX.length - k2, newX.length);
  if (overlap < 2) return null;
  const appended = newX.length - overlap;
  if (k2 === 0 && appended === 0) return null;
  for (let i2 = 0; i2 < overlap; i2++) {
    if (oldX[k2 + i2] !== newX[i2]) return null;
    const oy = oldY[k2 + i2];
    const ny = newY[i2];
    if (oy !== ny && !(oy == null && ny == null)) return null;
  }
  const oldXP = frame.xPixels[realIndex];
  const oldYP = frame.yPixels[realIndex];
  if (!oldXP || !oldYP) return null;
  let a2 = -1;
  let b = -1;
  for (let i2 = 0; i2 < overlap; i2++) {
    if (oldXP[k2 + i2] == null || oldYP[k2 + i2] == null || newXPixels[i2] == null || newYPixels[i2] == null) {
      continue;
    }
    if (a2 === -1) a2 = i2;
    b = i2;
  }
  if (a2 === -1 || b <= a2) return null;
  const nxA = (
    /** @type {number} */
    newXPixels[a2]
  );
  const nxB = (
    /** @type {number} */
    newXPixels[b]
  );
  const oxA = (
    /** @type {number} */
    oldXP[k2 + a2]
  );
  const oxB = (
    /** @type {number} */
    oldXP[k2 + b]
  );
  if (Math.abs(nxB - nxA) < 1e-6) return null;
  const ax = (oxB - oxA) / (nxB - nxA);
  const bx = oxA - ax * nxA;
  if (!isFinite(ax) || !isFinite(bx)) return null;
  if (Math.abs(ax - 1) > 0.02) return null;
  if (Math.abs(bx) < 0.5) return null;
  let yLo = a2;
  let yHi = a2;
  for (let i2 = a2; i2 <= b; i2++) {
    const ny = newYPixels[i2];
    if (ny == null || oldYP[k2 + i2] == null) continue;
    if (ny < /** @type {number} */
    newYPixels[yLo]) yLo = i2;
    if (ny > /** @type {number} */
    newYPixels[yHi]) yHi = i2;
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
    (oldYP[k2 + yHi] - /** @type {number} */
    oldYP[k2 + yLo]) / (nyHi - nyLo);
    by = /** @type {number} */
    oldYP[k2 + yLo] - ay * nyLo;
  } else {
    by = /** @type {number} */
    oldYP[k2 + yLo] - nyLo;
  }
  if (!isFinite(ay) || !isFinite(by) || ay < 0.2 || ay > 5) return null;
  const m = Math.floor((a2 + b) / 2);
  if (m !== a2 && m !== b && newXPixels[m] != null && oldXP[k2 + m] != null) {
    const predX = ax * /** @type {number} */
    newXPixels[m] + bx;
    if (Math.abs(predX - /** @type {number} */
    oldXP[k2 + m]) > 1.5) {
      return null;
    }
    if (newYPixels[m] != null && oldYP[k2 + m] != null) {
      const predY = ay * /** @type {number} */
      newYPixels[m] + by;
      if (Math.abs(predY - /** @type {number} */
      oldYP[k2 + m]) > 1.5) {
        return null;
      }
    }
  }
  gl.streamScrolled = true;
  return { ax, bx, ay, by };
}
const NUM_RE = /[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
function projectPathToPrevFrame(d, t2) {
  const { ax, bx, ay, by } = t2;
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
      for (const x2 of nums) out.push(`H ${ax * x2 + bx}`);
      continue;
    }
    if (cmd === "V") {
      for (const y of nums) out.push(`V ${ay * y + by}`);
      continue;
    }
    if (cmd === "A") {
      for (let i2 = 0; i2 + 6 < nums.length; i2 += 7) {
        out.push(
          `A ${nums[i2]} ${nums[i2 + 1]} ${nums[i2 + 2]} ${nums[i2 + 3]} ${nums[i2 + 4]} ${ax * nums[i2 + 5] + bx} ${ay * nums[i2 + 6] + by}`
        );
      }
      continue;
    }
    const coords = [];
    for (let i2 = 0; i2 + 1 < nums.length; i2 += 2) {
      coords.push(`${ax * nums[i2] + bx} ${ay * nums[i2 + 1] + by}`);
    }
    if (coords.length) out.push(`${cmd} ${coords.join(" ")}`);
  }
  return out.join(" ");
}
const PART = "apexcharts-highlight-part";
const PLAIN = { f: 1, o: 0 };
const COVERED = { f: 0, o: 0 };
const look = (f) => ({ f, o: f < 1 ? 1 : 0 });
const finite = (v) => typeof v === "number" && v === v && v !== Infinity && v !== -Infinity;
const mix = (x2, y, t2) => t2 >= 1 ? y : x2 + (y - x2) * t2;
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
  const s2 = typeof paint2 === "string" ? paint2.trim() : "";
  let m;
  let r2 = null;
  if (m = /^rgba\(([^,]+,[^,]+,[^,]+),([^)]+)\)$/i.exec(s2)) {
    r2 = [`rgb(${m[1]})`, parseFloat(m[2])];
  } else if (m = /^color-mix\(in srgb, (.+) ([\d.]+)%, transparent\)$/.exec(s2)) {
    r2 = [m[1], parseFloat(m[2]) / 100];
  } else if (m = /^(#[\da-f]{6})([\da-f]{2})$/i.exec(s2)) {
    r2 = [m[1], parseInt(m[2], 16) / 255];
  }
  return r2 && r2[1] > 0 && r2[1] < 1 ? r2 : [paint2, 1];
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
function drawnAt(t2) {
  let x2 = parseFloat(t2.getAttribute("x"));
  let y = parseFloat(t2.getAttribute("y"));
  String(t2.getAttribute("transform") || "").replace(
    /translate\(\s*([^\s,)]+)[\s,]*([^\s,)]*)\s*\)/g,
    (_m, a2, b) => {
      x2 += parseFloat(a2) || 0;
      y += parseFloat(b) || 0;
      return "";
    }
  );
  return [x2, y];
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
function bindHit(whole, n2) {
  const hits = whole._apxHits || (whole._apxHits = /* @__PURE__ */ new Set());
  if (!whole._apxHitStop) {
    whole._apxHitStop = true;
    const stop = (e2) => {
      if (hits.has(e2.relatedTarget)) e2.stopImmediatePropagation();
    };
    ["mouseout", "mouseleave", "mouseover", "mouseenter"].forEach(
      (t2) => whole.addEventListener(t2, stop, true)
    );
  }
  hits.add(n2);
  HIT_EVENTS.forEach(
    (t2) => n2.addEventListener(
      t2,
      (e2) => {
        e2.stopPropagation();
        const enter = t2 === "mouseover";
        const leave = t2 === "mouseout";
        if ((enter || leave) && e2.relatedTarget === whole) return;
        forward(whole, t2, e2);
        if (enter) forward(whole, "mouseenter", e2);
        if (leave) forward(whole, "mouseleave", e2);
      },
      { passive: true }
    )
  );
}
function mirrorFilter(whole, n2) {
  const sync = () => {
    const f = whole.getAttribute("filter");
    if (f) n2.setAttribute("filter", f);
    else n2.removeAttribute("filter");
  };
  sync();
  Environment.isBrowser() && typeof MutationObserver !== "undefined" && new MutationObserver(sync).observe(whole, {
    attributes: true,
    attributeFilter: ["filter"]
  });
}
function insertAfter(node, n2) {
  const parent = node.parentNode;
  const kids = Array.from(parent.childNodes);
  parent.insertBefore(n2, kids[kids.indexOf(node) + 1] || null);
}
const addClass = (n2, c) => n2.setAttribute("class", `${n2.getAttribute("class") || ""} ${c}`.trim());
function forward(target2, type, e2) {
  try {
    const init = e2.touches ? {
      bubbles: true,
      cancelable: true,
      touches: Array.from(e2.touches),
      targetTouches: Array.from(e2.targetTouches),
      changedTouches: Array.from(e2.changedTouches)
    } : type === "mouseenter" || type === "mouseleave" ? {
      clientX: e2.clientX,
      clientY: e2.clientY,
      screenX: e2.screenX,
      screenY: e2.screenY,
      relatedTarget: e2.relatedTarget,
      buttons: e2.buttons
    } : e2;
    target2.dispatchEvent(new e2.constructor(type, init));
  } catch (_2) {
  }
}
function stripSeries(s2) {
  if (!isPoint(s2)) return s2;
  const _a = s2, { highlightData: _hd, highlight: _h } = _a, rest = __objRest(_a, ["highlightData", "highlight"]);
  ["data", "children"].forEach((k2) => {
    if (Array.isArray(rest[k2])) rest[k2] = rest[k2].map(stripPoint);
  });
  return rest;
}
function slicePoints(series) {
  const pts = [];
  (series || []).forEach(
    (s2) => (isPoint(s2) && Array.isArray(s2.data) ? s2.data : []).forEach(
      (d) => {
        if (isPoint(d) && d.x !== void 0 && (d.y !== void 0 || Array.isArray(d.children))) {
          pts.push(d);
        }
      }
    )
  );
  return pts;
}
const carries = (d) => isPoint(d) && ("highlight" in d || "highlightData" in d || [d.data, d.children].some((a2) => Array.isArray(a2) && a2.some(carries)));
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
    hd.parts.forEach((r2) => {
      if (finite(r2[0])) p.maxY = Math.max(p.maxY, r2[0]);
    });
  }
  const ap = p.animatePaths;
  const da = p.drawArcs;
  const gm = p.getSliceMovers;
  const gh = p.getHoverOutlinePath;
  const s2 = {
    /** Each slice's arc animation as the whole was handed it, and its mark.
     * @type {any[]} */
    arcs: [],
    /** What moves with each slice besides the renderer's own. @type {any[][]} */
    movers: [],
    /** How far a slice reaches where its part goes past it. @type {number[]} */
    reach: [],
    ap
  };
  p.animatePaths = (el, a2) => {
    const c = __spreadValues({}, a2);
    ap.call(p, el, a2);
    c.run = a2.dur;
    s2.arcs[a2.i] = { a: c, el };
  };
  p.drawArcs = (...args) => {
    const g = da.apply(p, args);
    paint(hf, p, g, s2);
    return g;
  };
  p.getSliceMovers = (i2) => gm.call(p, i2).concat(s2.movers[i2] || []);
  p.getHoverOutlinePath = (i2) => {
    const sizes = p.sliceSizes;
    if (!(s2.reach[i2] > sizes[i2])) return gh.call(p, i2);
    p.sliceSizes = sizes.slice();
    p.sliceSizes[i2] = s2.reach[i2];
    try {
      return gh.call(p, i2);
    } finally {
      p.sliceSizes = sizes;
    }
  };
  wrapCentre(hf, p);
}
function wrapCentre(hf, p) {
  const ri = p.renderInnerDataLabels;
  const pi = p.printInnerLabels;
  p.renderInnerDataLabels = (g, c, o2) => centre(hf, () => ri.call(p, g, labelsCfg(hf, c, 0), o2));
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
  gl.seriesTotals = hd.parts.map((r2) => {
    var _a2;
    return (_a2 = r2[0]) != null ? _a2 : 0;
  });
  try {
    return fn();
  } finally {
    gl.seriesTotals = keep;
  }
}
function labelsCfg(hf, c, i2) {
  var _a, _b;
  const w = hf.w;
  const hd = w.highlightData;
  if (!(hd == null ? void 0 : hd.active)) return c;
  const vals = w.seriesData.series;
  const parts = hd.parts.map((r2) => r2[0]);
  const part = i2 > -1 && ((_b = (_a = hf.cfg.dataLabels) == null ? void 0 : _a.value) != null ? _b : "part") === "part" ? parts[i2] : null;
  const sum2 = (a2) => a2.reduce((t2, v) => t2 + (finite(v) ? v : 0), 0);
  const tf = c.total.formatter;
  const vf = c.value.formatter;
  return __spreadProps(__spreadValues({}, c), {
    total: __spreadProps(__spreadValues({}, c.total), {
      formatter: tf && ((x2) => tf(x2, { highlight: info(sum2(parts), sum2(vals)) }))
    }),
    value: __spreadProps(__spreadValues({}, c.value), {
      formatter: (v, x2) => vf(part != null ? part : v, x2, {
        highlight: i2 > -1 ? info(parts[i2], vals[i2]) : void 0
      })
    })
  });
}
const proxy = (p, size, own) => Object.create(p, __spreadValues({
  getSliceExtent: {
    value: (o2) => p.getSliceExtent(__spreadProps(__spreadValues({}, o2), { size }))
  }
}, own));
function paint(hf, p, g, s2) {
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
  const outline2 = p.strokeWidth > 0 && ((_g = (_f = cfg.outline) == null ? void 0 : _f.width) != null ? _g : 1) > 0 ? { opacity: (_i = (_h = cfg.outline) == null ? void 0 : _h.opacity) != null ? _i : 1 } : null;
  const labelsWas = (_j = gl.prevHighlightLabels) == null ? void 0 : _j.get(-1);
  const rides = [];
  const has = (n2, c) => {
    var _a2, _b2;
    return ((_a2 = n2.classList) == null ? void 0 : _a2.contains(c)) || ` ${(_b2 = n2.getAttribute) == null ? void 0 : _b2.call(n2, "class")} `.indexOf(` ${c} `) > -1;
  };
  Array.from(g.node.childNodes).filter((n2) => has(n2, "apexcharts-pie-series")).forEach((sg) => {
    var _a2, _b2, _c2, _d2, _e2, _f2;
    const node = Array.from(sg.childNodes).find(
      (n2) => has(n2, "apexcharts-pie-area")
    );
    if (!node) return;
    const i2 = Number(node.getAttribute("j"));
    const key = PIE + i2;
    const prev = mount ? void 0 : prevMap == null ? void 0 : prevMap.get(key);
    if (!active && !prev) return;
    const arc = s2.arcs[i2];
    const whole = vals[i2];
    const pv = active ? (_a2 = hd.parts[i2]) == null ? void 0 : _a2[0] : null;
    const size = p.sliceSizes[i2];
    const full = polar ? size : R;
    const anim = Environment.isBrowser() && !!arc && arc.a.run > 0 && !morph;
    const delayMs = +(arc == null ? void 0 : arc.a.animBeginArr[i2]) || 0;
    const share = pv != null && whole > 0 ? pv / whole : null;
    let toR = null;
    let over = false;
    if (share != null && share > 0) {
      over = share > 1;
      if (polar) {
        toR = Math.min(R, size * share);
      } else {
        const t3 = Math.min(share, 1);
        toR = area ? Math.sqrt(base * base + t3 * (R * R - base * base)) : base + (R - base) * t3;
      }
    }
    const was = (_b2 = prev == null ? void 0 : prev.lr) != null ? _b2 : prev == null ? void 0 : prev.fr;
    let target2 = toR;
    const exit = toR == null && was != null && anim;
    if (exit) {
      target2 = gl.collapsedSeriesIndices.indexOf(i2) > -1 ? was * R : active ? base : full;
    }
    const lands = exit && !active;
    let fromR = target2;
    let cover = false;
    if (target2 != null && anim && !mount) {
      if (was != null) fromR = was * R;
      else if (prev || cfg.enter === "baseline") fromR = base;
      else {
        cover = true;
        fromR = polar ? (_c2 = arc.a.prevSize) != null ? _c2 : size : R;
      }
      if (!exit && !(Math.abs(arc.a.prevEndAngle - arc.a.prevStartAngle) > 0.01)) {
        fromR = target2;
        cover = false;
      }
    }
    let part = null;
    let edge = null;
    const moves = (n2) => {
      const tf = node.getAttribute("transform");
      if (tf) {
        n2.setAttribute("transform", tf);
        n2.classList.add("apexcharts-slice-mover");
        n2.style.transition = node.style.transition;
      }
      (s2.movers[i2] = s2.movers[i2] || []).push(n2);
    };
    const wedge = (px, el, r2, from) => {
      if (arc && !morph) {
        s2.ap.call(px, el, __spreadProps(__spreadValues({}, arc.a), {
          size: r2,
          prevSize: mount ? void 0 : from,
          isTrack: true
        }));
      } else {
        const a2 = Number(node.getAttribute("data:angle"));
        el.attr({
          d: px.getPiePath({
            me: px,
            startAngle: Number(node.getAttribute("data:startAngle")),
            angle: a2 >= p.fullAngle ? p.fullAngle - 0.01 : a2,
            size: r2
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
    if (target2 != null) {
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
      wedge(px, part, target2, fromR);
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
        s2.reach[i2] = target2;
      }
      if (morph) {
        const els = [pn, edge == null ? void 0 : edge.node].filter(Boolean);
        const show = (t3) => els.forEach((n2) => n2.setAttribute("opacity", t3));
        show(0);
        hf._tween(
          hf.ctx.morphTypeChange.getSpeed(),
          w.config.chart.animations.dynamicAnimation.speed,
          show,
          () => els.forEach((n2) => n2.removeAttribute("opacity"))
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
    const r1 = target2 != null ? target2 : 0;
    hf._fade(
      node,
      mount ? look(fadeTo) : cover ? COVERED : prev ? { f: prev.f, o: (_e2 = prev.o) != null ? _e2 : look(prev.f).o } : PLAIN,
      lands ? COVERED : look(fadeTo),
      { delayMs, speed: arc == null ? void 0 : arc.a.run, el: arc == null ? void 0 : arc.el },
      {
        anim,
        force: !!part && (r0 !== r1 || e0 !== e1 || a0 !== a1),
        outline: outline2 && __spreadProps(__spreadValues({}, outline2), { color: gl.colors[i2] }),
        also: (t3) => {
          if (part) {
            rec.lr = mix(r0, r1, t3) / R;
            rec.la = mix(a0, a1, t3);
            part.node.setAttribute("fill-opacity", String(rec.la));
          }
          edge == null ? void 0 : edge.node.setAttribute("stroke-opacity", String(mix(e0, e1, t3)));
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
    const lg = p.sliceLabelGroups[i2];
    const t2 = lg && Array.from(lg.childNodes).find(
      (n2) => has(n2, "apexcharts-pie-label")
    );
    if (t2 && active) {
      if (pv == null && byPart) {
        p.sliceLabels = p.sliceLabels.filter(
          (x2) => x2.node !== lg
        );
        (_f2 = lg.parentNode) == null ? void 0 : _f2.removeChild(lg);
        delete p.sliceLabelGroups[i2];
        return;
      }
      label(w, p, node, t2, i2, byPart ? pv : null, whole, toR, base);
    }
    if (t2 && anim && !mount && labelsWas) {
      rides.push({ t: t2, src: labelsWas.get(i2), el: arc.el, delayMs, arc });
    }
  });
  if (rides.length) hf._ride = () => ride(hf, rides);
}
function label(w, p, node, t2, i2, pv, whole, r2, base) {
  var _a, _b;
  const fmt = w.config.dataLabels.formatter;
  if (pv != null) {
    const pct = (_b = (_a = w.globals.seriesPercent[i2]) == null ? void 0 : _a[0]) != null ? _b : 0;
    const v = whole ? pct * pv / whole : 0;
    t2.textContent = String(
      fmt ? fmt(v, {
        seriesIndex: i2,
        dataPointIndex: i2,
        series: w.seriesData.series,
        w,
        highlight: info(pv, whole)
      }) : v + "%"
    );
  }
  const fs = parseFloat(t2.getAttribute("font-size")) || 12;
  const a0 = Number(node.getAttribute("data:startAngle"));
  const span = Number(node.getAttribute("data:angle"));
  if (pv != null && r2 != null && r2 - base >= 1.2 * fs) {
    const off = w.config.plotOptions.pie.dataLabels.offset;
    const at = Utils.polarToCartesian(
      p.centerX,
      p.centerY,
      p.chartType === "donut" ? (base + r2) / 2 + off : r2 / 1.25 + off,
      (a0 + span / 2) % p.fullAngle
    );
    t2.setAttribute("x", at.x);
    t2.setAttribute("y", at.y);
  }
  const box = new Graphics(w).getTextRects(
    t2.textContent,
    t2.getAttribute("font-size"),
    t2.getAttribute("font-family"),
    void 0,
    true,
    t2.getAttribute("font-weight")
  );
  const x2 = parseFloat(t2.getAttribute("x"));
  const y = parseFloat(t2.getAttribute("y"));
  const on = r2 != null && [
    [x2 - box.width / 2, y - box.height * 0.75],
    [x2 + box.width / 2, y - box.height * 0.75],
    [x2 - box.width / 2, y + box.height * 0.25],
    [x2 + box.width / 2, y + box.height * 0.25]
  ].every(([cx, cy]) => {
    const dx = cx - p.centerX;
    const dy = cy - p.centerY;
    const d = Math.hypot(dx, dy);
    const ang = ((Math.atan2(dy, dx) * 180 / Math.PI + 90 - a0) % 360 + 360) % 360;
    return d >= base && d <= r2 && ang <= span;
  });
  if (!on) {
    t2.setAttribute("fill", w.config.chart.foreColor);
    t2.removeAttribute("filter");
  }
}
function ride(hf, rides) {
  rides.forEach(({ t: t2, src, el, delayMs, arc }) => {
    if (!t2.isConnected) return;
    const [x2, y] = drawnAt(t2);
    const dx = src ? src.x - x2 : 0;
    const dy = src ? src.y - y : 0;
    if (src && Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    hf._tween(
      delayMs,
      arc.a.run,
      (e2) => {
        const k2 = 1 - e2;
        if (k2 > 0 && src)
          t2.setAttribute("transform", `translate(${dx * k2} ${dy * k2})`);
        else t2.removeAttribute("transform");
        if (!src) {
          if (e2 < 1) t2.setAttribute("opacity", String(e2));
          else t2.removeAttribute("opacity");
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
function radialPass(hf, r2) {
  var _a, _b, _c, _d, _e, _f, _g;
  const w = hf.w;
  const hd = w.highlightData;
  const said = (_b = (_a = hf.ctx.lastUpdateOptions) == null ? void 0 : _a.tooltip) == null ? void 0 : _b.enabled;
  if (said != null) hf._tipUser = said;
  else if (hf._tipOn) w.config.tooltip.enabled = false;
  hf._tipOn = false;
  if (!hd) return;
  if (hf._render !== r2) hf._beginRender(r2, RAD);
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
  wrapCentre(hf, r2);
  centreLanes(hf, r2);
  const dn = r2.drawNeedle;
  r2.drawNeedle = (o2) => {
    const g = dn.call(r2, o2);
    ownNeedle(hf, r2, g);
    return g;
  };
  const ap = r2.animatePaths;
  r2.animatePaths = (el, a2) => {
    const c = __spreadValues({}, a2);
    ap.call(r2, el, a2);
    if (a2.isTrack) return;
    c.run = a2.dur;
    ring(hf, r2, el, c, ap);
  };
  if (((_g = hf.ctx.morphTypeChange) == null ? void 0 : _g.isActive()) === true) {
    Promise.resolve().then(() => {
      var _a2;
      if (hf._render !== r2 || w.globals.isDestroyed) return;
      (_a2 = w.dom.baseEl) == null ? void 0 : _a2.querySelectorAll(
        ".apexcharts-radial-series .apexcharts-radialbar-area"
      ).forEach((n2) => ring(hf, r2, n2.instance, null, ap));
    });
  }
}
function ring(hf, r2, el, c, ap) {
  var _a, _b, _c, _d, _e, _f;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const hd = w.highlightData;
  const active = hd.active;
  const node = el.node;
  const i2 = c ? c.i : Number(node.getAttribute("j"));
  const key = RAD + i2;
  const morph = !c;
  const mount = !gl.dataChanged || !gl.shouldAnimate;
  const prevMap = hf._prev();
  const prev = mount ? void 0 : prevMap == null ? void 0 : prevMap.get(key);
  const rb = w.config.plotOptions.radialBar;
  const ind = hf._ind;
  const st = node.getAttribute("stroke");
  const fl = node.getAttribute("fill");
  const paint2 = st && st !== "transparent" ? st : morph && fl && fl !== "none" ? fl : null;
  const needle = i2 === 0 && (ind === "needle" || !paint2);
  const whole = w.seriesData.series[i2];
  const pv = active && gl.collapsedSeriesIndices.indexOf(i2) < 0 ? (_b = (_a = hd.parts[i2]) == null ? void 0 : _a[0]) != null ? _b : null : null;
  const start = r2.startAngle;
  const wholeEnd = c ? c.endAngle : r2._arcEnd(whole);
  const run = c ? c.run : 0;
  const anim = Environment.isBrowser() && run > 0;
  const delayMs = c ? +c.animBeginArr[i2] || 0 : 0;
  const fadeTo = (_c = cfg.fadeOpacity) != null ? _c : 0.2;
  const faded = active && !needle && !!paint2;
  const REST = { f: fadeTo, o: 0 };
  const size = c ? c.size : Math.hypot(
    node.getAttribute("data:cx") - gl.circleGeometry.cx,
    node.getAttribute("data:cy") - gl.circleGeometry.cy
  );
  if (ind === "lanes" && paint2) {
    lanes(hf, r2, el, {
      i: i2,
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
    if (i2 === 0) needlePart(hf, r2, el, false, pv, mount, morph, c);
    return;
  }
  const toE = faded && pv != null ? r2._arcEnd(pv) : null;
  const has = toE != null && toE - start > 0.01;
  const was = (_d = prev == null ? void 0 : prev.e) != null ? _d : null;
  const exit = !has && was != null && anim;
  const lands = exit && !faded;
  const target2 = has ? toE : exit ? lands ? wholeEnd : start : null;
  let fromE = target2;
  let cover = false;
  if (target2 != null && anim && !mount) {
    if (was != null) fromE = was;
    else if (prev || cfg.enter === "baseline") fromE = start;
    else {
      cover = true;
      fromE = finite(c.prevEndAngle) ? c.prevEndAngle : wholeEnd;
    }
  }
  const arcD = (e2) => {
    const span = e2 - start;
    return r2.getPiePath({
      me: r2,
      startAngle: start,
      angle: span === r2.fullAngle ? r2.fullAngle - 0.01 : span,
      size
    });
  };
  let part = null;
  if (target2 != null && paint2) {
    part = new Graphics(w).drawPath({
      d: "",
      stroke: paint2,
      strokeWidth: morph ? r2.getStrokeWidth({
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
      ap.call(r2, part, __spreadProps(__spreadValues({}, c), {
        endAngle: target2,
        prevStartAngle: start,
        prevEndAngle: fromE,
        isTrack: true
      }));
    } else if (c) {
      ap.call(r2, part, __spreadProps(__spreadValues({}, c), { endAngle: target2, dur: run, isTrack: true }));
    } else {
      pn.setAttribute("d", arcD(target2));
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
    const at = (a2) => {
      const p = Utils.polarToCartesian(cx, cy, size - sw / 2, a2);
      const q2 = Utils.polarToCartesian(cx, cy, size + sw / 2, a2);
      tn.setAttribute("d", `M ${p.x} ${p.y} L ${q2.x} ${q2.y}`);
    };
    const a0 = anim ? finite(c.prevEndAngle) && !mount ? c.prevEndAngle : start : wholeEnd;
    at(a0);
    if (a0 !== wholeEnd) {
      tick.animate(run, delayMs).during((t2) => at(mix(a0, wholeEnd, t2)));
    }
  }
  const shows = [];
  if (part && morph) shows.push(part.node);
  if (tick && morph) shows.push(tick.node);
  const rec = { d: null, e: null, f: faded ? fadeTo : 1, c: !active };
  if (paint2 && (active || prev)) {
    hf._targets.set(key, rec);
    const e0 = fromE != null ? fromE : 0;
    const e1 = target2 != null ? target2 : 0;
    if (part) rec.e = e1;
    if (part && c && anim && !mount && e0 !== e1) {
      rec.e = e0;
      part.animate(run, delayMs).during(
        (t2) => rec.e != null && (rec.e = mix(e0, e1, t2))
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
        also: (t2) => {
          if (tick) {
            rec.tk = mix(k0, k1, t2);
            tick.node.setAttribute("stroke-opacity", String(rec.tk));
          }
          shows.forEach(
            (s2) => t2 < 1 ? s2.setAttribute("opacity", t2) : s2.removeAttribute("opacity")
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
  if (i2 === 0) needlePart(hf, r2, el, needle, pv, mount, morph, c);
}
function lanes(hf, r2, el, o2) {
  var _a, _b, _c, _d, _e, _f, _g;
  const { i: i2, c, prev, mount, pv, whole, wholeEnd, run, anim, delayMs, size } = o2;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const rb = w.config.plotOptions.radialBar;
  const active = w.highlightData.active;
  const node = el.node;
  const morph = !c;
  const start = r2.startAngle;
  const s1 = active && gl.collapsedSeriesIndices.indexOf(i2) < 0 ? 1 : 0;
  const go = morph ? Environment.isBrowser() && !!s1 : anim && !mount;
  const sweep = !morph && anim && mount;
  const s0 = morph ? 0 : go ? (_a = prev == null ? void 0 : prev.s) != null ? _a : 0 : s1;
  const clock = morph ? {
    delayMs: hf.ctx.morphTypeChange.getSpeed(),
    speed: w.config.chart.animations.dynamicAnimation.speed
  } : { delayMs, speed: run };
  if (i2 === 0) lineClock(hf, go ? __spreadProps(__spreadValues({}, clock), { el }) : null);
  if (!s1 && !s0) return;
  const toE = pv != null ? r2._arcEnd(pv) : start;
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
  const sw = morph ? r2.getStrokeWidth({
    size: gl.circleGeometry.r,
    series: w.seriesData.series
  }) : Number(node.getAttribute("stroke-width"));
  const own = node.getAttribute("stroke-opacity");
  const lane = (cls) => {
    var _a2;
    const p = new Graphics(w).drawPath({
      d: "",
      stroke: o2.paint,
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
  const n2 = w.seriesData.series.length;
  const tn = tracksOf(r2)[rb.inverseOrder ? n2 - 1 - i2 : i2];
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
  const one = n2 < 2;
  const gap = one ? Math.max(2, sw * 0.12) : Math.max(1, Math.min(sw * 0.08, r2.margin / 3));
  const inset = one ? 0 : Math.max(0, (3 * gap - r2.margin) / 2);
  const lw = Math.max(0.5, (sw - gap) / 2 - inset);
  const arcAt = (e2, R) => {
    const span = e2 - start;
    return span > 0.01 ? r2.getPiePath({
      me: r2,
      startAngle: start,
      angle: span === r2.fullAngle ? r2.fullAngle - 0.01 : span,
      size: R
    }) : "";
  };
  const trackAt = (R) => {
    const ts = r2.trackStartAngle;
    let te = r2.trackEndAngle;
    if (Math.abs(te) + Math.abs(ts) >= 360) {
      te = 360 - Math.abs(r2.startAngle) - 0.1;
    }
    const span = te < ts ? r2.fullAngle + te - ts : te - ts;
    return r2.getPiePath({
      me: r2,
      startAngle: ts,
      angle: span === r2.fullAngle ? span - 0.01 : span,
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
  hf._targets.set(RAD + i2, rec);
  const draw = (s2, we2, e2) => {
    rec.s = s2;
    rec.we = we2;
    rec.e = e2;
    const wo = R1 - inset * s2;
    const wi = R0 + s2 * (R1 - inset - lw - R0);
    const pi = R0 + inset * s2;
    const po = pi + s2 * lw;
    rec.mid = (wi + po) / 2;
    put(wl.node, arcAt(we2, (wi + wo) / 2), wo - wi);
    put(pl.node, po > pi ? arcAt(e2, (pi + po) / 2) : "", po - pi);
    if (!tn) return;
    if (s2) {
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
    wl.animate(clock.speed, clock.delayMs).during((t2) => {
      if (gone) return;
      if (!shown) show();
      draw(mix(s0, s1, t2), mix(we0, we1, t2), mix(e0, e1, t2));
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
    const at = (e2) => {
      hf._lane = [i2, laneAt(node, e2, rec)];
    };
    ["mouseover", "mousemove", "mousedown", "touchstart", "touchmove"].forEach(
      (t2) => node.addEventListener(t2, at, true)
    );
  }
}
function laneAt(node, e2, rec) {
  var _a, _b;
  const p = ((_a = e2.touches) == null ? void 0 : _a[0]) || e2;
  const m = (_b = node.getScreenCTM) == null ? void 0 : _b.call(node);
  if (!m || !(rec.s > 0)) return "part";
  const x2 = p.clientX - m.e;
  const y = p.clientY - m.f;
  const det = m.a * m.d - m.b * m.c || 1;
  const ux = (m.d * x2 - m.c * y) / det;
  const uy = (m.a * y - m.b * x2) / det;
  return Math.hypot(ux - rec.cx, uy - rec.cy) > rec.mid ? "whole" : "part";
}
function morphOut(hf) {
  const mt = hf.ctx.morphTypeChange;
  if (!mt || mt._hfOut) return;
  mt._hfOut = true;
  const cb = mt.captureBeforeDestroy;
  mt.captureBeforeDestroy = (a2) => {
    const plan = outPlan(hf, a2 == null ? void 0 : a2.fromType);
    if (!plan) return cb.call(mt, a2);
    const cf = mt._captureFromDOM;
    mt._captureFromDOM = (t2) => {
      const got = cf.call(mt, t2);
      got.marks.forEach((m) => {
        var _a;
        m.d = (_a = plan.marks.get(m.realIndex)) != null ? _a : m.d;
      });
      return got;
    };
    let ok;
    try {
      ok = cb.call(mt, a2);
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
  const marks2 = /* @__PURE__ */ new Map();
  const keep = /* @__PURE__ */ new Set();
  const out = /* @__PURE__ */ new Set();
  root.querySelectorAll(".apexcharts-radial-series .apexcharts-radialbar-area").forEach((n2) => {
    var _a2, _b2, _c2, _d2;
    const g = n2.parentNode;
    const i2 = +g.getAttribute("data:realIndex");
    const key = RAD + n2.getAttribute("j");
    const rec = (_b2 = hf._targets.get(key)) != null ? _b2 : (_a2 = hf._prev()) == null ? void 0 : _a2.get(key);
    const part = g.querySelector(".apexcharts-radialbar-highlight-part");
    if (!part && !((rec == null ? void 0 : rec.s) > 0) && !(((_d2 = (_c2 = rec == null ? void 0 : rec.lf) != null ? _c2 : rec == null ? void 0 : rec.f) != null ? _d2 : 1) < 1)) return;
    keep.add(n2);
    const pd = part == null ? void 0 : part.getAttribute("d");
    const sw = +(part == null ? void 0 : part.getAttribute("stroke-width"));
    let d = null;
    if (pd && sw > 0 && part.getAttribute("opacity") !== "0") {
      d = mt._radialArcToFilledSegment(pd, sw, cx, cy) || pd;
      out.add(part);
    } else {
      const m = /M\s*(-?[\d.e]+)\s+(-?[\d.e]+)/.exec(
        n2.getAttribute("d") || ""
      );
      if (m) d = `M ${m[1]} ${m[2]} L ${m[1]} ${m[2]} Z`;
    }
    if (d) marks2.set(i2, d);
  });
  const parts = [...root.getElementsByClassName(PART)];
  if (!marks2.size && !parts.length) return null;
  parts.forEach(
    (m) => out.has(m) || m.closest(".apexcharts-tracks") || keep.add(m)
  );
  return {
    marks: marks2,
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
function tracksOf(r2) {
  var _a, _b;
  if (r2._hfTracks) return r2._hfTracks;
  const is = (m, cls) => {
    var _a2;
    return ` ${(_a2 = m.getAttribute) == null ? void 0 : _a2.call(m, "class")} `.includes(` ${cls} `);
  };
  const kids = [...((_b = (_a = r2.w.dom.Paper) == null ? void 0 : _a.node) == null ? void 0 : _b.childNodes) || []];
  let found = [];
  for (let k2 = kids.length - 1; k2 >= 0 && !found.length; k2--) {
    const t2 = [...kids[k2].childNodes || []].find(
      (m) => is(m, "apexcharts-tracks")
    );
    if (t2) {
      found = [...t2.childNodes].map(
        (g) => [...g.childNodes].find((m) => is(m, "apexcharts-radialbar-area"))
      );
    }
  }
  return r2._hfTracks = found;
}
function centreLanes(hf, r2) {
  const ri = r2.renderInnerDataLabels;
  const pi = r2.printInnerLabels;
  r2.renderInnerDataLabels = (g, c, o2) => {
    const out = ri(g || r2.dataLabelsGroup, c, o2);
    wholeLine(hf, r2, c, -1, out);
    return out;
  };
  r2.printInnerLabels = (c, name, val, el) => {
    pi(c, name, val, el);
    wholeLine(hf, r2, c, el ? +el.parentNode.getAttribute("rel") - 1 : -1);
  };
}
function wholeLine(hf, r2, c, i2, group2) {
  var _a, _b, _c;
  const w = hf.w;
  const gl = w.globals;
  if (hf._ind !== "lanes") return;
  const active = w.highlightData.active;
  let st = r2._hfLine;
  if (!st) {
    const mount = !gl.dataChanged || !gl.shouldAnimate;
    const prev = mount ? void 0 : (_a = hf._prev()) == null ? void 0 : _a.get(LINE$1);
    const now = active ? wholeText(hf, c, -1) : "";
    const o1 = now ? 1 : 0;
    const o0 = mount || !Environment.isBrowser() ? o1 : (_b = prev == null ? void 0 : prev.f) != null ? _b : 0;
    st = r2._hfLine = { node: null, rec: null };
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
  if (group2) {
    st.node = null;
    if (!rec || !rec.lf && rec.done) return;
    const kids = group2.node.childNodes;
    const v = c.value.show ? kids[kids.length - 1] : null;
    if (!v) return;
    if (rec.pv != null && !rec.done) {
      rec.hold = v.textContent;
      v.textContent = rec.pv;
    }
    rec.vt = v.textContent;
    const now = active ? wholeText(hf, c, -1) : "";
    const t2 = drawLine(w, c, v, now || rec.t);
    group2.add(t2);
    st.node = t2.node;
  } else if (active) {
    const t2 = wholeText(hf, c, i2);
    const v = (_c = w.dom.baseEl) == null ? void 0 : _c.querySelector(".apexcharts-datalabel-value");
    if (!st.node && t2 && i2 > -1 && v) {
      st.node = drawLine(w, c, v, t2).node;
      v.parentNode.appendChild(st.node);
    }
    if (st.node) st.node.textContent = t2;
    if (rec && v) rec.vt = v.textContent;
  }
  lineLook(st);
}
function drawLine(w, c, v, text) {
  const fv = parseFloat(c.value.fontSize) || 14;
  const fw = Math.max(11, Math.round(fv / 2));
  const t2 = new Graphics(w).drawText({
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
  t2.node.setAttribute("aria-hidden", "true");
  return t2;
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
    (t2) => {
      rec.lf = mix(o0, rec.f, t2);
      lineLook(st);
    },
    done,
    void 0,
    clock.el
  );
}
function wholeText(hf, c, i2) {
  var _a, _b;
  const w = hf.w;
  const dl = hf.cfg.dataLabels || {};
  const vals = w.seriesData.series;
  const parts = w.highlightData.parts.map((p) => p[0]);
  const k2 = i2 > -1 ? i2 : vals.length < 2 ? 0 : -1;
  const say = (fn, h) => {
    const plain = String(fn(h));
    const own = String(fn(__spreadProps(__spreadValues({}, h), { lane: "whole" })));
    return own !== plain ? own : "/ " + plain;
  };
  if (k2 > -1) {
    if (((_a = dl.value) != null ? _a : "part") !== "part" || !finite(parts[k2])) return "";
    return say((h) => c.value.formatter(vals[k2], w, h), {
      highlight: info(parts[k2], vals[k2])
    });
  }
  if (!c.total.show || ((_b = dl.total) != null ? _b : "part") !== "part" || !c.total.formatter || !parts.some(finite)) {
    return "";
  }
  const sum2 = (a2) => a2.reduce((t2, v) => t2 + (finite(v) ? v : 0), 0);
  return say((h) => c.total.formatter(w, h), {
    highlight: info(sum2(parts), sum2(vals))
  });
}
function needlePart(hf, r2, el, needle, pv, mount, morph, c) {
  var _a, _b, _c;
  const w = hf.w;
  const gl = w.globals;
  const cfg = hf.cfg;
  const active = w.highlightData.active;
  const prev = mount ? void 0 : (_a = hf._prev()) == null ? void 0 : _a.get(NEEDLE);
  const toA = needle && pv != null ? r2._angleAtValue(pv) : null;
  if (toA == null && !prev) return;
  const rb = w.config.plotOptions.radialBar;
  const motion = morph ? null : rb.shape === "needle" ? r2.needleMotion() : c && c.run > 0 && Environment.isBrowser() ? { speed: c.run, delay: +c.animBeginArr[0] || 0 } : null;
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
    a1 = active && needle ? r2.startAngle : r2._angleAtValue(w.seriesData.series[0]);
    o1 = 0;
  } else if (!motion) {
    a0 = a1;
  } else if (mount) {
    a0 = r2.startAngle;
  } else if (prev) {
    a0 = prev.ang;
    o0 = prev.op;
  } else {
    a0 = r2._angleAtValue(
      gl.dataChanged ? gl.previousPaths[0] : w.seriesData.series[0]
    );
    o0 = 0;
  }
  const cg = gl.circleGeometry;
  const own = ((_b = cfg.radialBar) == null ? void 0 : _b.needle) || {};
  const base = rb.needle || {};
  const ncfg = {};
  NEEDLE_KEYS.forEach((k2) => {
    var _a2;
    return ncfg[k2] = (_a2 = own[k2]) != null ? _a2 : base[k2];
  });
  const color = (_c = own.color) != null ? _c : gl.colors[0];
  const { path, cx, cy } = r2.needlePath(
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
    const k2 = [...arcs.childNodes].filter((c2) => c2 !== g.node);
    const h = k2.findIndex(
      (c2) => {
        var _a2;
        return ` ${(_a2 = c2.getAttribute) == null ? void 0 : _a2.call(c2, "class")} `.includes(
          " apexcharts-radialbar-hollow "
        );
      }
    );
    if (h < 0 || g.node.parentNode !== arcs) return false;
    arcs.insertBefore(g.node, k2[h + 1] || null);
    return true;
  };
  if (!place()) Promise.resolve().then(place);
  const rec = { d: null, ang: a0, op: o0, c: !active };
  hf._targets.set(NEEDLE, rec);
  const set = (a2, o2) => {
    rec.ang = a2;
    rec.op = o2;
    g.node.setAttribute("transform", `rotate(${a2})`);
    if (o2 < 1) g.node.setAttribute("opacity", String(o2));
    else g.node.removeAttribute("opacity");
  };
  const frame = (t2) => set(a0 + (a1 - a0) * t2, mix(o0, o1, t2));
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
      (t2) => set(a1, t2),
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
      if (gl.isDestroyed || hf._render !== r2) return;
      const t2 = Math.max(0, Math.min(1, (now - at) / m.speed));
      frame(m.ease(t2));
      if (t2 < 1) BrowserAPIs.requestAnimationFrame(step);
      else land();
    };
    BrowserAPIs.requestAnimationFrame(step);
  } else {
    g.animate(m.speed, m.delay || 0).during((t2) => frame(t2)).after(land);
  }
}
function ownNeedle(hf, r2, g) {
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
  } : r2.needleMotion();
  if (m && f0 !== f1) {
    rec.run = true;
    hf._tween(
      m.delay || 0,
      m.speed,
      (t2) => set(mix(f0, f1, t2)),
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
const URL$1 = /^url\(/i;
function treeParse(hf, type) {
  const gl = hf.w.globals;
  if (type !== "treemap" || !gl.treemapRoots) return false;
  const raw = (
    /** @type {any[]} */
    gl.treemapRawSeries || []
  );
  if (raw.some((s2) => Array.isArray(s2 == null ? void 0 : s2.highlightData))) {
    hf._warn(
      "nested",
      "on a nested treemap put the part on each leaf as { x, y, highlight }; highlightData is ignored."
    );
  }
  const onParent = (d) => isPoint(d) && Array.isArray(d.children) && d.children.length > 0 && ("highlight" in d || d.children.some(onParent));
  if (raw.some((s2) => ((s2 == null ? void 0 : s2.data) || []).some(onParent))) {
    hf._warn(
      "parent",
      "a parent's highlight is ignored: parents add up their leaves' parts."
    );
  }
  return true;
}
function treeSeries(hf, base, parts) {
  const w = hf.w;
  return base.map((s2, i2) => {
    const out = stripSeries(s2);
    const row = Array.isArray(parts == null ? void 0 : parts[i2]) ? parts[i2] : null;
    if (typeof parts !== "function" && !row) return out;
    let k2 = 0;
    const leaf2 = (d) => {
      var _a, _b, _c;
      if (isPoint(d) && Array.isArray(d.children) && d.children.length) {
        return __spreadProps(__spreadValues({}, d), { children: d.children.map(leaf2) });
      }
      const j2 = k2++;
      const pt = isPoint(d) ? __spreadValues({}, d) : { x: "", y: d };
      pt.highlight = typeof parts === "function" ? parts({
        seriesIndex: i2,
        dataPointIndex: j2,
        seriesName: s2.name,
        x: (_a = pt.x) != null ? _a : pt.name,
        value: typeof ((_b = pt.y) != null ? _b : pt.value) === "number" ? (_c = pt.y) != null ? _c : pt.value : null,
        datum: d,
        w
      }) : row == null ? void 0 : row[j2];
      return pt;
    };
    if (Array.isArray(out.data)) out.data = out.data.map(leaf2);
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
  hf._tmDefs.forEach((n2) => {
    var _a2;
    return (_a2 = n2.parentNode) == null ? void 0 : _a2.removeChild(n2);
  });
  hf._tmDefs = [];
  const tiles = hf._tiles = /* @__PURE__ */ new Map();
  const active = hd.active;
  const vals = w.seriesData.series;
  rollUp(tm, active ? hd.parts : null, vals);
  const prevMap = hf._prev();
  if (!active && !(prevMap == null ? void 0 : prevMap.size)) return void 0;
  const byIJ = /* @__PURE__ */ new Map();
  prevMap == null ? void 0 : prevMap.forEach((r2) => byIJ.set(r2.ij, r2));
  (_a = gl.prevTreemapView) == null ? void 0 : _a.querySelectorAll(`.${CLASS}`).forEach((n2) => {
    n2.classList.remove(CLASS, OVER);
    n2.removeAttribute("data:hl-share");
  });
  const cfg = hf.cfg;
  const fadeTo = active ? (_b = cfg.fadeOpacity) != null ? _b : 0.2 : 1;
  const morph = ((_c = hf.ctx.morphTypeChange) == null ? void 0 : _c.isActive()) === true;
  const dyn = tm.dynamicAnim;
  const anim = morph || !!(gl.dataChanged && dyn.enabled && gl.shouldAnimate);
  const speed = morph ? hf.ctx.morphTypeChange.getSpeed() : dyn.speed;
  const fore = w.config.chart.foreColor;
  let warned2 = false;
  if (active) wrapParentTip(hf, tm);
  let bound = null;
  const cl = tm.helpers.calculateDataLabels;
  tm.helpers.calculateDataLabels = (o2) => {
    const g = cl.call(tm.helpers, o2);
    const rec = bound = tiles.get(o2.i + "|" + o2.j);
    if (g && rec) {
      const ts = texts(g.node);
      rec.lb = ts.filter(
        (t3) => /^(#fff|#ffffff|white)$/i.test(t3.getAttribute("fill") || "")
      );
      const t2 = ts[0];
      const [, y1, , y2] = rec.r;
      if (t2 && y2 > y1) {
        const fs = parseFloat(t2.getAttribute("font-size")) || 12;
        rec.need = (y2 - parseFloat(t2.getAttribute("y")) + 0.9 * fs) / (y2 - y1);
      }
      tone(rec, fore);
    }
    return g;
  };
  const rf = tm.rotateToFitLabel;
  tm.rotateToFitLabel = (...a2) => {
    rf.apply(tm, a2);
    const rec = bound;
    bound = null;
    if ((rec == null ? void 0 : rec.lb) && /rotate/.test(a2[0].node.getAttribute("transform") || "")) {
      const run = new Graphics(w).getTextRects(a2[2], String(a2[1])).width;
      rec.need = 0.5 + run / 2 / (a2[6] - a2[4]);
      rec.tone = null;
      tone(rec, fore);
    }
  };
  return (el, i2, j2, pathFill, leaf2) => {
    var _a2, _b2, _c2, _d;
    const key = TILE + leaf2._key;
    const ij = i2 + "|" + j2;
    const whole = (_a2 = vals[i2]) == null ? void 0 : _a2[j2];
    const prev = anim ? (prevMap == null ? void 0 : prevMap.get(key)) || (whole ? void 0 : byIJ.get(ij)) : void 0;
    if (!active && !prev) return void 0;
    if (URL$1.test(pathFill)) {
      if (active && !warned2) {
        warned2 = true;
        hf._warn(
          "fill",
          "treemap tiles with a gradient, pattern or image fill are drawn without their parts."
        );
      }
      return void 0;
    }
    const p = active ? (_b2 = hd.parts[i2]) == null ? void 0 : _b2[j2] : null;
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
        (_c2 = gl.previousPaths[i2]) == null ? void 0 : _c2[j2]
      );
      if (morph || ((_d = was == null ? void 0 : was.rect) == null ? void 0 : _d.width) > 0) {
        from = cfg.enter === "baseline" ? { s: 0, f: 1, c: to.c } : { s: 1, f: 0, c: to.c };
        if (!morph && was.fill && !URL$1.test(was.fill)) from.c = was.fill;
      }
    }
    const moves = from.s !== to.s || from.f !== to.f || from.c !== to.c;
    if (!active && !moves) return void 0;
    const g = w.dom.Paper.gradient("linear", (add) => {
      for (let k2 = 0; k2 < 4; k2++) add.stop(0, pathFill, 1);
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
      r: leaf2.rect,
      lb: null,
      need: 0.5,
      tone: null
    };
    hf._targets.set(key, rec);
    tiles.set(ij, rec);
    const ease = colourEase(from.c, to.c);
    const write = (L2) => {
      rec.ls = L2.s;
      rec.lf = L2.f;
      rec.lc = L2.c;
      stops.forEach((n2, k2) => {
        n2.setAttribute("offset", String(k2 === 0 ? 0 : k2 === 3 ? 1 : L2.s));
        n2.setAttribute("stop-color", L2.c);
        n2.setAttribute("stop-opacity", String(k2 < 2 ? 1 : L2.f));
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
        (t2) => done || write({
          s: mix(from.s, to.s, t2),
          f: f != null ? f : mix(from.f, to.f, t2),
          c: ease(t2)
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
  const walk = (n2) => {
    var _a, _b;
    const kids = n2.children;
    if (!kids || !kids.length) {
      const p = (_a = parts == null ? void 0 : parts[n2._si]) == null ? void 0 : _a[n2._di];
      n2.highlight = parts ? info(finite(p) ? p : null, (_b = vals[n2._si]) == null ? void 0 : _b[n2._di]) : void 0;
      return n2.highlight;
    }
    let v = null;
    kids.forEach((c) => {
      const h = walk(c);
      if (h && h.value != null && !(h.value * (h.total || 0) < 0)) {
        v = (v || 0) + Math.abs(h.value);
      }
    });
    if (!parts) return n2.highlight = void 0;
    const total = tm._subtreeArea(n2);
    const share = v != null && total ? v / total : null;
    n2.highlight = {
      value: v,
      total,
      share,
      overflow: share != null && share > 1
    };
    return n2.highlight;
  };
  (tm.roots || []).forEach(walk);
}
function wrapParentTip(hf, tm) {
  const show = tm._showParentTooltip;
  tm._showParentTooltip = (e2, node) => {
    var _a, _b, _c;
    show.call(tm, e2, node);
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
  rec.lb.forEach((t2) => {
    if (t2._apxFill == null) t2._apxFill = t2.getAttribute("fill");
    t2.setAttribute("fill", on ? t2._apxFill : fore);
  });
}
function texts(n2) {
  const out = [];
  (function walk(x2) {
    if (String(x2.tagName || x2.nodeName).toLowerCase() === "text") out.push(x2);
    Array.from(x2.childNodes || []).forEach(walk);
  })(n2);
  return out;
}
function colourEase(a2, b) {
  const x2 = rgba(a2);
  const y = rgba(b);
  if (a2 === b || !x2 || !y) return (t2) => t2 >= 1 ? b : a2;
  return (t2) => t2 >= 1 ? b : `rgba(${[0, 1, 2].map((k2) => Math.round(mix(x2[k2], y[k2], t2))).join(",")},${+mix(x2[3], y[3], t2).toFixed(3)})`;
}
function rgba(c) {
  var _a;
  const s2 = String(c).trim();
  let m = /^#([\da-f]+)$/i.exec(s2);
  if (m) {
    let h = m[1];
    if (h.length < 5) h = h.replace(/./g, "$&$&");
    if (h.length !== 6 && h.length !== 8) return null;
    return [0, 2, 4, 6].map(
      (k2) => k2 < h.length ? parseInt(h.slice(k2, k2 + 2), 16) / (k2 === 6 ? 255 : 1) : 1
    );
  }
  m = /^rgba?\(([^)]*)\)$/i.exec(s2);
  if (!m) return null;
  const v = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat);
  return v.length >= 3 && v.every(isFinite) ? [v[0], v[1], v[2], (_a = v[3]) != null ? _a : 1] : null;
}
["prevHighlightParts", "prevHighlightLabels"].forEach((k2) => {
  if (Series.HELD.indexOf(k2) === -1) Series.HELD.push(k2);
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
function seriesHasHighlight(s2) {
  if (!s2) return false;
  if (Array.isArray(s2.highlightData)) return true;
  const d = s2.data;
  if (!Array.isArray(d)) return false;
  for (let j2 = 0; j2 < d.length; j2++) {
    const p = d[j2];
    if (isPoint(p)) {
      if ("highlight" in p) return true;
    } else if (p != null) return false;
  }
  return false;
}
function partAt(pt, hd, j2) {
  return isPoint(pt) && "highlight" in pt ? pt.highlight : hd ? hd[j2] : null;
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
    for (let i2 = 0; i2 < series.length; i2++) {
      if (nested ? carries({ data: (_a = series[i2]) == null ? void 0 : _a.data }) : seriesHasHighlight(series[i2])) {
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
      (w.globals.seriesYAxisMap || []).map((s2, k2) => s2 && s2.length ? k2 : -1).filter((k2) => k2 > -1)
    );
    if (present && supported && stacked && (axes.length > 1 || axes.some((k2) => {
      var _a2;
      return (_a2 = cnf.yaxis[k2]) == null ? void 0 : _a2.logarithmic;
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
    for (let i2 = 0; i2 < values.length; i2++) {
      const s2 = series[i2] || {};
      const data = Array.isArray(s2.data) ? s2.data : [];
      const hd = !nested && Array.isArray(s2.highlightData) ? s2.highlightData : null;
      const collapsed = gl.collapsedSeriesIndices.indexOf(i2) > -1 || gl.ancillaryCollapsedSeriesIndices.indexOf(i2) > -1;
      if (hd && !collapsed && hd.length !== data.length) mismatch = true;
      const row = [];
      const n2 = values[i2] ? values[i2].length : 0;
      for (let j2 = 0; j2 < n2; j2++) {
        const v = partAt(data[j2], hd, j2);
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
    const parallel = series.some((s2) => Array.isArray(s2 == null ? void 0 : s2.highlightData));
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
    let keyOf2 = null;
    if (stacked && bars) {
      const names = w.seriesData.seriesNames;
      const group2 = parts.map(
        (_2, i2) => w.labelData.seriesGroups.findIndex(
          (g) => g.indexOf(names[i2]) > -1
        )
      );
      keyOf2 = (i2, j2) => group2[i2] + "|" + j2;
    } else if (stacked) {
      const sx = w.seriesData.seriesX;
      keyOf2 = (i2, j2) => {
        var _a2;
        return String(w.axisFlags.isXNumeric ? (_a2 = sx[i2]) == null ? void 0 : _a2[j2] : j2);
      };
    }
    const ext = extend ? this._runningExt(
      parts,
      keyOf2,
      bars,
      bars ? (i2, j2) => this._restarts(i2, j2) : void 0
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
    const n2 = (w.seriesData.series || []).length;
    const pts = slicePoints(
      /** @type {any[]} */
      cnf.series
    );
    let point = pts.some((d) => "highlight" in d);
    if (point && pts.length !== n2) {
      this._warn(
        "points",
        "per-point highlight values do not line up with the slices; use highlightFilter.data instead."
      );
      point = false;
    }
    let arr = Array.isArray(cfg.data) ? cfg.data : null;
    if (arr && arr.length !== n2) {
      this._warn(
        "length",
        `highlightFilter.data has ${arr.length} values for ${n2} slices; it is ignored until they match.`
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
    for (let i2 = 0; i2 < n2; i2++) {
      const pt = point ? pts[i2] : null;
      const v = pt && "highlight" in pt ? pt.highlight : arr ? arr[i2] : null;
      parts.push([
        finite(v) ? gl.collapsedSeriesIndices.indexOf(i2) > -1 ? 0 : v : null
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
    for (let i2 = 0; i2 < parts.length; i2++) {
      const hidden = gl.collapsedSeriesIndices.indexOf(i2) > -1 || gl.ancillaryCollapsedSeriesIndices.indexOf(i2) > -1;
      rows.push(
        hidden && i2 < prevRows.length ? prevRows[i2] : parts[i2].join(",")
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
    this._targets.forEach((t2, key) => {
      var _a, _b, _c, _d, _e, _f, _g;
      if (t2.c && !t2.run) return;
      const n2 = t2.n;
      const on = !!(n2 == null ? void 0 : n2.isConnected);
      prev.set(key, __spreadProps(__spreadValues({}, t2), {
        d: on && n2.getAttribute("d") || t2.d,
        a: ((_a = t2.m) == null ? void 0 : _a.isConnected) && t2.m.getAttribute("d") || t2.a,
        flip: on ? n2.classList.contains(FLIP_Y) || n2.classList.contains(FLIP_X) : t2.flip,
        f: (_b = t2.lf) != null ? _b : t2.f,
        o: (_c = t2.lo) != null ? _c : t2.o,
        // A treemap tile's share and colour as drawn (see TreemapPart).
        s: (_d = t2.ls) != null ? _d : t2.s,
        col: (_e = t2.lc) != null ? _e : t2.col,
        // A part's alpha and carried stroke as drawn (see _paintBar).
        al: (_f = t2.la) != null ? _f : t2.al,
        k: (_g = t2.lk) != null ? _g : t2.k,
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
    const r2 = this.ctx.renderer;
    return (!r2 || !r2.kind || r2.kind === "svg") && this._animatesUpdate() && !!this.w.globals.shouldAnimate;
  }
  /** Animations are on for updates at all, and this render is an update. */
  _animatesUpdate() {
    const w = this.w;
    const a2 = w.config.chart.animations;
    return !!(Environment.isBrowser() && a2.enabled && a2.dynamicAnimation.enabled && w.globals.dataChanged && !prefersReducedMotion());
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
      el.animate(duration, delayMs).during((t2) => done || onFrame(t2)).after(() => job.finish());
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
      finish: () => Array.from(live).forEach((t2) => t2.finish())
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
  bar(bar, o2) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    const hd = w.highlightData;
    if (!hd) return void 0;
    if (this._render !== bar) this._beginRender(bar, BAR);
    const prevMap = this._prev();
    const active = hd.active;
    if (!active && !(prevMap == null ? void 0 : prevMap.size)) return void 0;
    const { j: j2, realIndex } = o2;
    const key = BAR + `${realIndex}::${datumKey(w, realIndex, j2)}`;
    this._seen.add(key);
    const prev = prevMap == null ? void 0 : prevMap.get(key);
    const p = active ? (_a = hd.parts[realIndex]) == null ? void 0 : _a[j2] : null;
    if (!active && !prev) return void 0;
    const cfg = this.cfg;
    const fadeTo = active ? (_b = cfg.fadeOpacity) != null ? _b : 0.2 : 1;
    const whole = (_c = w.seriesData.series[realIndex]) == null ? void 0 : _c[j2];
    const stacked = !!w.config.chart.stacked;
    const geo = active && stacked ? this._stackGeometry(bar, o2, p, whole, prev) : p == null ? null : this._barGeometry(bar, o2, p, whole);
    const hl = {
      paint: (el, r2) => this._paintBar(o2, el, r2, {
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
    prev.forEach((t2, key) => {
      var _a;
      if (this._seen.has(key) || key.indexOf(BAR) !== 0) return;
      const datum = key.slice(BAR.length);
      const el = this._seriesEls.get(datum.slice(0, datum.indexOf("::")));
      if (!el) return;
      const ghost = Array.from(
        el.querySelectorAll(".apexcharts-bar-ghost")
      ).find(
        (n2) => n2.getAttribute("data:ghostKey") === datum
      );
      if (!ghost) return;
      ghost.setAttribute("fill-opacity", String(t2.f));
      if (!t2.d) return;
      const part = new Graphics(w, this.ctx).drawPath({
        d: t2.d,
        stroke: "none",
        strokeWidth: 0,
        // Solid, at the alpha it had on screen (see _paintBar).
        fill: solid(ghost.getAttribute("fill"))[0],
        fillOpacity: (_a = t2.al) != null ? _a : 1,
        classes: `${PART} apexcharts-highlight-ghost`
      });
      const node = part.node;
      node.setAttribute("pointer-events", "none");
      node.setAttribute("clip-path", ghost.getAttribute("clip-path") || "");
      ghost.after(node);
      const origin = ghost.style.transformOrigin || "";
      const horiz = /^(left|right)/.test(origin);
      const edge = parseFloat(ghost.getAttribute("data:ghostEdge") || "");
      const [lo] = pathSpan(t2.d, horiz ? 0 : 1);
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
  _barGeometry(bar, o2, p, whole) {
    const w = this.w;
    const { j: j2, realIndex, translationsIndex, paths } = o2;
    const h = bar.barHelpers;
    const strokeWidth = h.getStrokeWidth(o2.i, j2, realIndex);
    if (bar.isFunnel) {
      const share = whole ? Math.min(Math.abs(p / whole), 1) : 0;
      const c = w.layout.gridWidth / 2;
      return {
        pathTo: scalePath(paths.pathTo, (x2) => c + (x2 - c) * share),
        base: scalePath(paths.pathTo, () => c),
        overflow: false
        // clamped to the stage, see above
      };
    }
    const ax = w.config.yaxis[w.globals.seriesYAxisReverseMap[realIndex]];
    const pv = (ax == null ? void 0 : ax.logarithmic) && !w.globals.invalidLogScale && this._cu ? Math.max(0, this._cu.getLogValAtSeriesIndex(p, realIndex)) : p;
    if (bar.isHorizontal) {
      const x1 = o2.zeroW;
      const x2 = h.getXForValue(pv, o2.zeroW);
      const r3 = this._rect(h, {
        a: paths.barYPosition,
        len: paths.barHeight,
        v1: x1,
        v2: x2,
        strokeWidth,
        realIndex,
        j: j2,
        dir: pv >= 0 ? 1 : -1,
        horizontal: true
      });
      return {
        pathTo: r3.pathTo,
        base: r3.base,
        overflow: overflows(p, whole),
        label: { x: x2, barWidth: Math.abs(x2 - x1) }
      };
    }
    const y1 = o2.zeroH;
    const y2 = h.getYForValue(pv, o2.zeroH, translationsIndex);
    const r2 = this._rect(h, {
      a: paths.barXPosition,
      len: paths.barWidth,
      v1: y1,
      v2: y2,
      strokeWidth,
      realIndex,
      j: j2,
      dir: pv >= 0 ? 1 : -1,
      horizontal: false
    });
    return {
      pathTo: r2.pathTo,
      base: r2.base,
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
  _rect(h, o2) {
    const sw = Array.isArray(o2.strokeWidth) ? o2.strokeWidth[o2.realIndex] : o2.strokeWidth;
    const c = (sw || 0) / 2;
    const d = o2.v2 - o2.v1;
    if (Math.abs(d) < 2 * c) {
      const m = o2.v1 + d / 2;
      const s2 = c * o2.dir * (h.barCtx.isReversed ? -1 : 1) * (o2.horizontal ? -1 : 1);
      o2 = __spreadProps(__spreadValues({}, o2), { v1: m + s2, v2: m - s2 });
    }
    return h.barRect(o2);
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
  _stackGeometry(bar, o2, p, whole, prev) {
    var _a, _b;
    const w = this.w;
    const { j: j2, realIndex, translationsIndex: ti, paths } = o2;
    const h = bar.barHelpers;
    const horiz = bar.isHorizontal;
    const zero = horiz ? o2.zeroW : o2.zeroH;
    if (!this._br) {
      this._br = h.createBorderRadiusArr(
        (((_a = w.highlightData) == null ? void 0 : _a.parts) || []).map((r3) => r3.map((v3) => v3 != null ? v3 : 0))
      );
      if (Utils.isSafari()) {
        this._br = /** @type {string[][]} */
        this._br.map(
          (r3) => r3.map(() => "none")
        );
      }
    }
    const br = (
      /** @type {string[][]} */
      this._br
    );
    const key = h.getSeriesGroupIndex(realIndex) + "|" + j2;
    let c = this._stk.get(key);
    if (!c || this._restarts(realIndex, j2)) {
      c = { p: zero, n: zero, raw: 0, any: false };
      this._stk.set(key, c);
    }
    const pct = w.config.chart.stackType === "100%";
    const total = w.seriesData.stackedSeriesTotals[j2];
    const val = p == null ? null : pct ? total ? 100 * p / total : 0 : p;
    const v = val != null ? val : 0;
    const neg = val != null ? val < 0 : (prev == null ? void 0 : prev.s) != null ? prev.s < 0 : whole < 0;
    const at = (x2, from) => horiz ? h.getXForValue(x2, from) : h.getYForValue(x2, from, ti);
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
      const a2 = at(100, zero);
      const b = at(-100, zero);
      const lo = Math.min(a2, b);
      const hi = Math.max(a2, b);
      const cap = (x2) => Math.min(hi, Math.max(lo, x2));
      overflow = cap(v2) !== v2;
      v1 = cap(v1);
      v2 = cap(v2);
      edge.p = cap(edge.p);
      edge.n = cap(edge.n);
    }
    const save = h.arrBorderRadius;
    h.arrBorderRadius = br;
    let r2;
    try {
      r2 = this._rect(h, {
        a: horiz ? paths.barYPosition : paths.barXPosition,
        len: horiz ? w.globals.barHeight : w.globals.barWidth,
        v1,
        v2,
        // As the renderer strokes its stacked segments: columns with the
        // configured width, bars with the datum's.
        strokeWidth: horiz ? h.getStrokeWidth(o2.i, j2, realIndex) : bar.strokeWidth,
        realIndex,
        j: j2,
        dir: neg ? -1 : 1,
        horizontal: horiz
      });
    } finally {
      h.arrBorderRadius = save;
    }
    return {
      pathTo: p == null ? null : r2.pathTo,
      square: r2.squarePathTo,
      base: r2.base,
      flip: p != null && bar.cornerFlip((_b = br[realIndex]) == null ? void 0 : _b[j2], v),
      s: neg ? -1 : 1,
      overflow,
      val,
      label: horiz ? { x: v2, barWidth: Math.abs(v2 - v1) } : { y: v2, barHeight: Math.abs(v2 - v1) },
      // The stacked total, on the side of the stack core puts it (by the
      // sign the drawing series' label reads), or false when the stack has
      // no part at all.
      total: (n2) => any ? { val: raw, edge: n2 ? edge.n : edge.p } : false
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
  _restarts(realIndex, j2) {
    var _a, _b;
    const w = this.w;
    const sx = w.seriesData.seriesX;
    return !w.config.plotOptions.bar.horizontal && !!w.axisFlags.isXNumeric && realIndex > 0 && ((_a = sx[realIndex - 1]) == null ? void 0 : _a[j2]) !== ((_b = sx[realIndex]) == null ? void 0 : _b[j2]);
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
  line(ln, type, series, i2, realIndex, ti, paths) {
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
    const paint2 = (m2, k2) => m2 && (m2._cmd ? m2._cmd[k2] : m2.node.getAttribute(k2));
    const marks2 = (
      /** @type {any[]} */
      ln.marks || []
    );
    const fillMark = area ? marks2.find((m2) => paint2(m2, "fill") !== "none") : null;
    const strokeMark = marks2.find((m2) => m2 !== fillMark);
    const [ink, alpha] = fillMark && w.config.chart.stacked ? solid(paint2(fillMark, "fill")) : [fillMark && paint2(fillMark, "fill"), 1];
    const looks = marks2.concat(
      area ? marks2.filter((m2) => m2 !== fillMark && !m2._cmd).map((m2) => m2.node.nextElementSibling).filter(
        (x2) => /#forecastMask/.test((x2 == null ? void 0 : x2.getAttribute("clip-path")) || "")
      ).map((node) => ({ node })) : []
    );
    const pp = active && !flat && (has || w.config.chart.stacked) ? this._lineBuild(
      ln,
      type,
      series,
      i2,
      realIndex,
      ti,
      this._partRow(raw, i2, realIndex)
    ) : null;
    let to = flat ? { d: paths.linePaths.join(" "), a: paths.areaPaths.join(" ") } : has ? {
      d: pp.linePaths.join(" "),
      a: pp.areaPaths.join(" "),
      num: pp.numericXY
    } : null;
    const exit = !to && !!(prev == null ? void 0 : prev.d) && animate;
    const base = active && animate && (exit || to && !(prev == null ? void 0 : prev.d) && (prev || this.cfg.enter === "baseline")) ? this._lineBase(ln, type, series, i2, realIndex, ti, has ? raw : null) : null;
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
            const r2 = reconcileSeriesPaths(w, {
              type,
              realIndex,
              pathFromLine: prev.d,
              pathFromArea: prev.a || "",
              linePaths: b.linePaths,
              areaPaths: b.areaPaths
            });
            if (r2 == null ? void 0 : r2.line) [from.d, interp.d] = [r2.line.from, r2.line.toInterp];
            if (r2 == null ? void 0 : r2.area) [from.a, interp.a] = [r2.area.from, r2.area.toInterp];
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
    let n2 = null;
    let nf = null;
    if (to) {
      const g = this._partGroup(ln.elSeries, "apexcharts-line-highlight");
      const num = to.num;
      const base2 = {
        i: i2,
        // Its own j: the mount reveal names its mask by series and j, and
        // the whole already has the series' masks.
        j: "h",
        realIndex,
        delay: i2,
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
        const stroke2 = __spreadProps(__spreadValues({}, base2), {
          from: from.d,
          to: to.d,
          interp: interp.d,
          paint: "none",
          stroke: paint2(strokeMark, "stroke"),
          width: ln.strokeWidth,
          num: num && { xs: num.xs, ys: num.ys }
        });
        n2 = this._emitPart(g, stroke2);
        n2 == null ? void 0 : n2.attr("fill-rule", "evenodd");
        const clip = !strokeMark._cmd && strokeMark.node.getAttribute("clip-path");
        if (n2 && clip && clip.indexOf("nonForecast") > -1) {
          const fc = w.config.forecastDataPoints;
          n2.attr("clip-path", clip);
          nf = this._emitPart(g, __spreadProps(__spreadValues({}, stroke2), {
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
      const r2 = this.ctx.renderer;
      if ((!r2 || !r2.kind || r2.kind === "svg") && w.config.chart.animations.enabled && !gl.resized && !gl.dataChanged) {
        [n2, area && strokeMark].forEach((el) => {
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
      n: exit ? n2 == null ? void 0 : n2.node : null,
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
        also: m && (a0 < 1 || a1 < 1) ? (t2) => {
          const a2 = mix(a0, a1, t2);
          rec.la = a2;
          m.node.setAttribute("fill-opacity", String(a2));
        } : void 0,
        force: !!m && a0 !== a1,
        land: lands ? L_PLAIN : void 0,
        // A retired part leaves on the frame its whole lands.
        done: exit ? () => {
          n2 == null ? void 0 : n2.remove();
          nf == null ? void 0 : nf.remove();
          m == null ? void 0 : m.remove();
        } : void 0,
        rec,
        // A scroll morph runs at constant speed, and so does its fade.
        ease: scroll ? resolveEasing("linear") : void 0
      }
    );
    if (to && !exit)
      Object.assign(rec, { d: to.d, a: to.a, n: n2 == null ? void 0 : n2.node, m: m == null ? void 0 : m.node });
    this._lineLabels(ln, type, i2, realIndex, raw, pp, paths);
  }
  /**
   * A part row in the units the renderer draws: logs on a log axis, and the
   * renderer's nudge for a flat row under a gradient, whose box would
   * otherwise have no height to paint (#358).
   * @param {any[]} raw @param {number} i @param {number} realIndex
   */
  _partRow(raw, i2, realIndex) {
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
    if ((ft === "gradient" || ft[i2] === "gradient") && row[last] != null && row.every((v) => v === row[0])) {
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
  _lineBuild(ln, type, series, i2, realIndex, ti, row) {
    const w = this.w;
    const pa = w.globals.pointsArray;
    const had = pa[realIndex];
    const len = had ? had.length : 0;
    const keep = [ln._shapeOnly, ln.appendPathFrom];
    const S2 = series.slice();
    S2[i2] = row;
    ln._shapeOnly = true;
    try {
      const pp = this._swap(
        ln,
        () => ln._buildSeriesPaths(type, S2, i2, realIndex, ti)
      );
      pp.S = S2;
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
  _lineBase(ln, type, series, i2, realIndex, ti, pattern) {
    const row = (pattern || series[i2]).map(
      (v) => v == null ? null : 0
    );
    const b = this._lineBuild(ln, type, series, i2, realIndex, ti, row);
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
  _fadeLine(type, marks2, a2, b, opt) {
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
    const items = marks2.map((m) => {
      var _a2;
      const node = m.node;
      const own = names.map((k3) => node.getAttribute(k3));
      const k2 = parseFloat((_a2 = own[0]) != null ? _a2 : "1");
      return {
        node,
        own,
        k: isFinite(k2) ? k2 : 1,
        fill: type === "area" && (m._cmd ? m._cmd.fill : node.getAttribute("fill")) !== "none"
      };
    });
    const set = (f, o2) => {
      rec.lf = f;
      rec.lo = o2;
      items.forEach(({ node, own, k: k2, fill }) => {
        if (f >= 1 && o2 <= 0) {
          names.forEach(
            (x2, q2) => own[q2] == null ? node.removeAttribute(x2) : node.setAttribute(x2, own[q2])
          );
        } else if (fill) {
          node.setAttribute("fill-opacity", String(k2 * f * mix(1, fo, o2)));
        } else if (type === "area") {
          node.setAttribute("stroke-opacity", String(f * mix(1, oo, o2)));
          node.setAttribute("stroke-width", String(mix(opt.width, ow, o2)));
        } else {
          node.setAttribute("stroke-opacity", String(f));
          node.setAttribute(
            "stroke-dasharray",
            o2 < 1 ? `${dash} ${dash * o2}` : String(dash)
          );
        }
      });
    };
    const frame = (t2) => {
      set(mix(a2.f, b.f, t2), mix(a2.o, b.o, t2));
      opt.also && opt.also(t2);
    };
    const land = () => {
      rec.run = false;
      if (opt.land) set(opt.land.f, opt.land.o);
      opt.done && opt.done();
    };
    if (this._animates() && (a2.f !== b.f || a2.o !== b.o || opt.done || opt.force)) {
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
  _lineLabels(ln, type, i2, realIndex, raw, pp, paths) {
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
        for (let j2 = 0; j2 < pp.xArrj.length - 1; j2++) {
          const pos = ln.lineHelpers.calculatePoints({
            series: pp.S,
            x: pp.xArrj[j2 + 1],
            y: pp.yArrj[j2 + 1],
            realIndex,
            i: i2,
            j: j2,
            prevY: pp.yArrj[0]
          });
          pos.x.forEach((x2, q2) => {
            if (raw[j2 ? j2 + 1 : q2] == null) {
              boxes[realIndex].push({ x: NaN, y: NaN, width: 0, height: 0 });
              return;
            }
            const el = dl.drawDataLabel({
              type,
              pos: {
                x: j2 ? [x2] : q2 ? [NaN, x2] : [x2, NaN],
                y: pos.y
              },
              i: realIndex,
              j: j2 ? j2 + 1 : 1,
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
      const r2 = new Map(rise);
      r2.delete(realIndex);
      gl.riseLabels = r2.size ? r2 : null;
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
      root.querySelectorAll(".apexcharts-pie-label").forEach((t2) => {
        const [x2, y] = drawnAt(t2);
        m.set(Number(t2.parentNode.getAttribute("data:slice")), { x: x2, y });
      });
      out.set(-1, m);
      return out;
    }
    root.querySelectorAll(".apexcharts-datalabels[data\\:realIndex]").forEach((wrap) => {
      const ri = Number(wrap.getAttribute("data:realIndex"));
      const xs = w.globals.seriesXvalues[ri] || [];
      const m = /* @__PURE__ */ new Map();
      wrap.querySelectorAll(`text.apexcharts-datalabel, text.${LABEL_EXIT}`).forEach((t2) => {
        var _a;
        const k2 = nearest(xs, parseFloat(t2.getAttribute("cx")));
        if (k2 < 0) return;
        const [x2, y] = drawnAt(t2);
        m.set(k2, {
          x: x2,
          y,
          o: parseFloat((_a = t2.getAttribute("opacity")) != null ? _a : "1"),
          els: withPill(t2)
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
    root.querySelectorAll("text.apexcharts-datalabel").forEach((t2) => {
      const k2 = nearest(xs, parseFloat(t2.getAttribute("cx")));
      if (k2 < 0) return;
      const [x2, y] = drawnAt(t2);
      const s2 = src == null ? void 0 : src.get(k2);
      let dx = 0;
      let dy = 0;
      let o2 = 0;
      if (s2) {
        used.add(k2);
        dx = s2.x - x2;
        dy = s2.y - y;
        o2 = s2.o;
      } else if (!(src == null ? void 0 : src.size) && [fx == null ? void 0 : fx[k2], fy == null ? void 0 : fy[k2], xs[k2], ys[k2]].every(ok)) {
        dx = fx[k2] - xs[k2];
        dy = fy[k2] - ys[k2];
      }
      if (o2 < 1 || Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        items.push({ els: withPill(t2), dx, dy, o: o2, to: 1 });
      }
    });
    src == null ? void 0 : src.forEach((s2, k2) => {
      if (used.has(k2)) return;
      const els = s2.els.map((e2) => {
        const c = e2.cloneNode(true);
        c.setAttribute("class", LABEL_EXIT);
        c.setAttribute("pointer-events", "none");
        c.removeAttribute("transform");
        root.appendChild(c);
        return c;
      });
      const [x2, y] = drawnAt(els[els.length - 1]);
      items.push({ els, dx: s2.x - x2, dy: s2.y - y, o: s2.o, to: 0, out: true });
    });
    if (!items.length) return;
    items.forEach((it) => {
      it.bases = it.els.map((e2) => e2.getAttribute("transform") || "");
      it.ops = it.els.map(
        (e2) => {
          var _a;
          return parseFloat((_a = e2.getAttribute("opacity")) != null ? _a : "1") / (it.out && it.o > 0 ? it.o : 1);
        }
      );
    });
    const place = (e2) => items.forEach(
      ({ els, dx, dy, o: o2, to, out, bases, ops }) => els.forEach((el, q2) => {
        const b = (
          /** @type {string[]} */
          bases[q2]
        );
        const k2 = out ? 1 : 1 - e2;
        if (k2) {
          el.setAttribute(
            "transform",
            `translate(${dx * k2} ${dy * k2}) ${b}`.trim()
          );
        } else if (b) el.setAttribute("transform", b);
        else el.removeAttribute("transform");
        const op = mix(o2, to, e2);
        const own = (
          /** @type {number[]} */
          ops[q2]
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
  _paintBar(o2, el, r2, s2) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    const w = this.w;
    const cfg = this.cfg;
    const animate = this._animates();
    const { key, prev, geo, fadeTo, active, bar } = s2;
    const elSeries = r2.elSeries;
    this._seriesEls.set(String(o2.realIndex), elSeries.node);
    let to = (geo == null ? void 0 : geo.pathTo) || null;
    const exit = !to && !!(prev == null ? void 0 : prev.d) && animate;
    if (exit) to = this._exitTo(prev, active, r2.pathTo, geo == null ? void 0 : geo.base);
    const start = to && !exit ? this._from(prev, geo == null ? void 0 : geo.base, r2.pathFrom, !!bar) : null;
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
    const color = typeof r2.fill === "string" && r2.fill !== "none" && r2.fill.indexOf("url") < 0 ? r2.fill : w.globals.colors[w.config.plotOptions.bar.distributed ? o2.j : o2.realIndex];
    const [paint2, alpha] = solid(r2.fill && r2.fill !== "none" ? r2.fill : color);
    const shadow = o2.j > 0 && r2.elBarShadows ? r2.elBarShadows.node.lastElementChild : null;
    const sf0 = prev ? prev.f : 1;
    const g = this._partGroup(elSeries, "apexcharts-bar-highlight");
    const part = to ? this._emitPart(g, {
      i: o2.i,
      j: o2.j,
      realIndex: o2.realIndex,
      from: from || to,
      to,
      interp,
      paint: paint2,
      delay: r2.delay,
      speed: r2.speed,
      cls,
      chartType: "bar",
      clip: `url(#gridRectBarMask${w.globals.cuid})`
    }) : null;
    const own = ownOpacity(el.node);
    const a0 = (start == null ? void 0 : start.cover) && animate ? alpha : (prev == null ? void 0 : prev.d) ? (_a = prev.al) != null ? _a : 1 : 1;
    const a1 = lands ? alpha : 1;
    const ow = s2.whole || (prev == null ? void 0 : prev.o) ? (_c = (_b = cfg.outline) == null ? void 0 : _b.width) != null ? _c : 1 : 0;
    const wn = el.node;
    const sc = wn.getAttribute("stroke");
    const k0 = (start == null ? void 0 : start.cover) && animate ? 1 : (prev == null ? void 0 : prev.d) ? (_d = prev.k) != null ? _d : 0 : 0;
    const k1 = lands ? 1 : 0;
    const carry = !!part && ow > 0 && (k0 > 0 || k1 > 0) && parseFloat(wn.getAttribute("stroke-width")) > 0 && !!sc && sc !== "none" && sc !== "transparent";
    const so = ownOpacity(wn, "stroke-opacity");
    const SK = ["stroke", "stroke-width", "stroke-opacity", "stroke-dasharray"];
    const bare = {};
    if (carry) {
      SK.forEach((n2) => {
        var _a2;
        bare[n2] = part.node.getAttribute(n2);
        part.node.setAttribute(n2, (_a2 = wn.getAttribute(n2)) != null ? _a2 : "");
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
    const strength = (t2) => {
      const a2 = mix(a0, a1, t2);
      rec.la = a2;
      if (part && (own < 1 || a0 < 1 || a1 < 1)) {
        part.node.setAttribute("fill-opacity", String(own * a2));
      }
      if (!carry) return;
      const k2 = mix(k0, k1, t2);
      rec.lk = k2;
      if (k2 > 0 || t2 < 1) {
        part.node.setAttribute("stroke-opacity", String(so * k2));
        if (!(rec.lo > 0) && k2 > 0) wn.setAttribute("stroke-opacity", "0");
      } else {
        part.attr(bare);
      }
    };
    const end = lands ? COVERED : look(fadeTo);
    this._fade(
      el.node,
      (start == null ? void 0 : start.cover) && animate ? COVERED : prev ? { f: prev.f, o: (_g = prev.o) != null ? _g : look(prev.f).o } : PLAIN,
      s2.whole ? end : { f: end.f, o: 0 },
      r2,
      {
        outline: ow > 0 ? { color, width: ow, opacity: (_i = (_h = cfg.outline) == null ? void 0 : _h.opacity) != null ? _i : 1 } : null,
        also: (t2) => {
          shadow == null ? void 0 : shadow.setAttribute("fill-opacity", String(mix(sf0, fadeTo, t2)));
          strength(t2);
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
        d: r2.pathTo,
        stroke: "#fff",
        strokeWidth: 1,
        fill: "none",
        strokeDashArray: 3,
        classes: `${PART} apexcharts-highlight-edge`
      });
      edge.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      edge.node.setAttribute("pointer-events", "none");
      g.add(edge);
      const show = (t2) => edge.node.setAttribute("stroke-opacity", String(0.75 * t2));
      if (animate && !(prev == null ? void 0 : prev.edge)) this._tween(r2.delayMs, r2.speed, show);
      else show(1);
    }
    const rk = (_j = this.ctx.renderer) == null ? void 0 : _j.kind;
    if ((!rk || rk === "svg") && !w.config.plotOptions.bar.isFunnel) {
      this._hitProxy(g, to, r2.pathTo, el.node, !!w.globals.isBarHorizontal);
    }
    if (r2.labels) this._contrastLabels(r2.labels, to);
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
    const [a2, b] = pathSpan(partD, ax);
    const [c, d] = pathSpan(wholeD, ax);
    const [lo, hi] = pathSpan(partD, ax ? 0 : 1);
    if (!(b - a2 > 0.5) || !(hi - lo > 0.5)) return;
    const pieces = [];
    if (!(d - c > 0.5)) pieces.push([a2, b]);
    else {
      if (a2 < c) pieces.push([a2, Math.min(b, c)]);
      if (b > d) pieces.push([Math.max(a2, d), b]);
    }
    const graphics = new Graphics(this.w, this.ctx);
    for (const [u, v] of pieces) {
      if (v - u < 0.5) continue;
      const n2 = graphics.drawPath({
        d: horizontal ? `M ${u} ${lo} L ${v} ${lo} L ${v} ${hi} L ${u} ${hi} Z` : `M ${lo} ${u} L ${hi} ${u} L ${hi} ${v} L ${lo} ${v} Z`,
        stroke: "none",
        strokeWidth: 0,
        fill: "none",
        classes: "apexcharts-highlight-hit"
      }).node;
      n2.setAttribute("pointer-events", "all");
      n2.setAttribute("clip-path", `url(#gridRectBarMask${this.w.globals.cuid})`);
      bindHit(whole, n2);
      g.add(n2);
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
  _fade(node, a2, b, r2, opt) {
    var _a;
    const attr = opt.attr || "fill-opacity";
    const k2 = ownOpacity(node, attr);
    const ol = opt.outline;
    const rec = opt.rec || {};
    const attrs = ol && ol.width == null ? ["stroke", "stroke-opacity"] : ["stroke", "stroke-width", "stroke-opacity"];
    const own = attrs.map((n2) => node.getAttribute(n2));
    const set = (f, o2) => {
      rec.lf = f;
      rec.lo = ol ? o2 : 0;
      node.setAttribute(attr, String(k2 * f));
      if (!ol) return;
      if (o2 <= 0) {
        attrs.forEach(
          (n2, x2) => own[x2] == null ? node.removeAttribute(n2) : node.setAttribute(n2, own[x2])
        );
      } else {
        node.setAttribute("stroke", ol.color);
        if (ol.width != null) {
          node.setAttribute("stroke-width", String(ol.width));
        }
        node.setAttribute("stroke-opacity", String(ol.opacity * Math.min(1, o2)));
      }
    };
    const frame = (t2) => {
      set(mix(a2.f, b.f, t2), mix(a2.o, b.o, t2));
      opt.also && opt.also(t2);
    };
    const land = () => {
      rec.run = false;
      if (opt.land) set(opt.land.f, opt.land.o);
      opt.done && opt.done();
    };
    if (((_a = opt.anim) != null ? _a : this._animates()) && (a2.f !== b.f || a2.o !== b.o || opt.done || opt.force)) {
      rec.run = true;
      this._tween(r2.delayMs, r2.speed, frame, land, opt.curve, r2.el);
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
  _runningExt(parts, keyOf2, split2, fresh) {
    if (!keyOf2) return parts;
    const sums = /* @__PURE__ */ new Map();
    return parts.map(
      (row, i2) => row.map((p, j2) => {
        const k2 = keyOf2(i2, j2);
        if (fresh && fresh(i2, j2)) {
          sums.delete(k2 + "+");
          sums.delete(k2 + "-");
        }
        if (p == null) return null;
        const key = k2 + (split2 && p < 0 ? "-" : "+");
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
    node.querySelectorAll("text").forEach((t2) => {
      const fill = (t2.getAttribute("fill") || "").toLowerCase();
      if (fill !== "#fff" && fill !== "#ffffff" && fill !== "white") return;
      const rect = graphics.getTextRects(
        t2.textContent,
        t2.getAttribute("font-size"),
        t2.getAttribute("font-family"),
        void 0,
        true,
        t2.getAttribute("font-weight")
      );
      const x2 = parseFloat(t2.getAttribute("x"));
      const y = parseFloat(t2.getAttribute("y"));
      const anchor = t2.getAttribute("text-anchor");
      const left = anchor === "middle" ? x2 - rect.width / 2 : anchor === "end" ? x2 - rect.width : x2;
      const fits = left >= x0 - 1 && left + rect.width <= x1 + 1 && y - rect.height * 0.75 >= y0 - 1 && y + rect.height * 0.25 <= y1 + 1;
      if (!fits) t2.setAttribute("fill", w.config.chart.foreColor);
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
  tooltipRow(refs, s2, j2, f) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
    const w = this.w;
    const cfg = this.cfg;
    const tt = cfg.tooltip || {};
    const ax = w.globals.axisCharts;
    const on = this.isActive() && tt.show !== false && (j2 != null || !ax) && !!refs.yValue;
    const lane = !ax && this._ind === "lanes" && w.config.chart.type === "radialBar" ? ((_a = this._lane) == null ? void 0 : _a[0]) === s2 ? this._lane[1] : "part" : void 0;
    if (refs.marker) {
      swatch(
        refs.marker,
        on && !w.config.tooltip.fillSeriesColor ? ((_c = (_b = this._tiles) == null ? void 0 : _b.get(s2 + "|" + j2)) == null ? void 0 : _c.base) || w.globals.colors[s2] : null,
        lane ? (_f = (_e = (_d = cfg.radialBar) == null ? void 0 : _d.lanes) == null ? void 0 : _e.opacity) != null ? _f : LANE : cfg.fadeOpacity,
        lane
      );
    }
    if (!on) return;
    const p = this.valueAt(s2, j2);
    const series = (
      /** @type {any[]} */
      w.seriesData.series
    );
    const whole = ax ? (_g = series[s2]) == null ? void 0 : _g[j2] : series[s2];
    const opts = ax ? { series, seriesIndex: s2, dataPointIndex: j2, w } : __spreadProps(__spreadValues({}, w), {
      w,
      series,
      seriesIndex: s2,
      dataPointIndex: s2,
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
    const series = base.map((s2, i2) => {
      const data = Array.isArray(s2.data) ? s2.data : [];
      const row = typeof parts === "function" ? data.map(
        (d, j2) => {
          var _a2;
          return parts({
            seriesIndex: i2,
            dataPointIndex: j2,
            seriesName: s2.name,
            x: isPoint(d) ? d.x : Array.isArray(d) ? d[0] : w.labelData.labels[j2],
            // From the datum itself, so it matches x and datum whatever
            // the chart has parsed (new series, a reduced or hidden row).
            value: valueOf(
              d,
              opts.series || perPoint ? null : (_a2 = w.seriesData.series[i2]) == null ? void 0 : _a2[j2]
            ),
            datum: d,
            w
          });
        }
      ) : Array.isArray(parts == null ? void 0 : parts[i2]) ? parts[i2] : null;
      const out = stripSeries(s2);
      if (row) {
        if (perPoint && out.data.every((d) => typeof d !== "number")) {
          out.data = out.data.map(
            (d, j2) => d == null ? d : Array.isArray(d) ? { x: d[0], y: d[1], highlight: row[j2] } : __spreadProps(__spreadValues({}, d), { highlight: row[j2] })
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
      const n2 = pts.length || raw.length;
      const row = [];
      for (let i2 = 0; i2 < n2; i2++) {
        const d = pts.length ? pts[i2] : raw[i2];
        row.push(
          parts({
            seriesIndex: i2,
            dataPointIndex: i2,
            seriesName: pts.length ? String(d.x) : names[i2],
            x: pts.length ? d.x : names[i2],
            value: valueOf(d, vals[i2]),
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
        (s2) => isPoint(s2) ? __spreadValues({}, s2) : s2
      )
    );
  }
  teardown() {
    var _a, _b;
    Array.from(this._live).forEach((t2) => t2.finish());
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
    for (let n2 = axis; n2 < nums.length; n2 += 2) {
      if (nums[n2] < lo) lo = nums[n2];
      if (nums[n2] > hi) hi = nums[n2];
    }
    return "";
  });
  return [lo, hi];
}
function nearest(xs, x2) {
  let k2 = -1;
  let best = Infinity;
  xs.forEach((v, q2) => {
    if (v != null && Math.abs(v - x2) < best) {
      best = Math.abs(v - x2);
      k2 = q2;
    }
  });
  return k2;
}
function withPill(t2) {
  const bg = t2.previousElementSibling;
  return bg && bg.tagName.toLowerCase() === "rect" ? [bg, t2] : [t2];
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
    for (let n2 = 0; n2 + 1 < nums.length; n2 += 2) {
      nums[n2] = fx(nums[n2]);
    }
    return `${cmd} ${nums.join(" ")} `;
  });
}
ApexCharts__default.registerFeatures({ highlightFilter: HighlightFilter });
const CMD = /[MmLlHhVvCcSsQqTtAaZz]/;
function flattenPath(d, tolerance = 0.6, keepLines = false) {
  const tol = tolerance > 0 ? tolerance : 0.6;
  const n2 = d.length;
  let i2 = 0;
  const polys = [];
  let poly = [];
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let px = 0;
  let py = 0;
  let prev = "";
  const isWs = (c) => c === " " || c === "," || c === "	" || c === "\n" || c === "\r";
  function skip() {
    while (i2 < n2 && isWs(d[i2])) i2++;
  }
  function num() {
    skip();
    const start = i2;
    if (d[i2] === "+" || d[i2] === "-") i2++;
    while (i2 < n2 && d[i2] >= "0" && d[i2] <= "9") i2++;
    if (d[i2] === ".") {
      i2++;
      while (i2 < n2 && d[i2] >= "0" && d[i2] <= "9") i2++;
    }
    if (d[i2] === "e" || d[i2] === "E") {
      i2++;
      if (d[i2] === "+" || d[i2] === "-") i2++;
      while (i2 < n2 && d[i2] >= "0" && d[i2] <= "9") i2++;
    }
    if (i2 === start) return null;
    const v = parseFloat(d.slice(start, i2));
    return isFinite(v) ? v : null;
  }
  function flag() {
    skip();
    const c = d[i2];
    if (c === "0" || c === "1") {
      i2++;
      return c === "1";
    }
    return null;
  }
  function closePoly() {
    if (poly.length > (keepLines ? 1 : 2)) polys.push(poly);
    poly = [];
  }
  function move(x2, y) {
    closePoly();
    cx = sx = x2;
    cy = sy = y;
    poly = [{ x: x2, y }];
  }
  function line(x2, y) {
    poly.push({ x: x2, y });
    cx = x2;
    cy = y;
  }
  function cubic(x1, y1, x2, y2, x3, y) {
    const hull = Math.hypot(x1 - cx, y1 - cy) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y - y2);
    const steps = Math.max(2, Math.min(160, Math.ceil(hull / tol)));
    const x0 = cx;
    const y0 = cy;
    for (let k2 = 1; k2 <= steps; k2++) {
      const t2 = k2 / steps;
      const u = 1 - t2;
      const a2 = u * u * u;
      const b = 3 * u * u * t2;
      const c = 3 * u * t2 * t2;
      const e2 = t2 * t2 * t2;
      poly.push({
        x: a2 * x0 + b * x1 + c * x2 + e2 * x3,
        y: a2 * y0 + b * y1 + c * y2 + e2 * y
      });
    }
    px = x2;
    py = y2;
    cx = x3;
    cy = y;
  }
  function quad(x1, y1, x2, y) {
    const qx = x1;
    const qy = y1;
    cubic(
      cx + 2 / 3 * (x1 - cx),
      cy + 2 / 3 * (y1 - cy),
      x2 + 2 / 3 * (x1 - x2),
      y + 2 / 3 * (y1 - y),
      x2,
      y
    );
    px = qx;
    py = qy;
  }
  function arc(rx, ry, rot, large, sweep, x2, y) {
    if (!rx || !ry) {
      line(x2, y);
      return;
    }
    const x1 = cx;
    const y1 = cy;
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    const phi = rot * Math.PI / 180;
    const cosP = Math.cos(phi);
    const sinP = Math.sin(phi);
    const dx2 = (x1 - x2) / 2;
    const dy2 = (y1 - y) / 2;
    const x1p = cosP * dx2 + sinP * dy2;
    const y1p = -sinP * dx2 + cosP * dy2;
    const lambda = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
    if (lambda > 1) {
      const s2 = Math.sqrt(lambda);
      rx *= s2;
      ry *= s2;
    }
    const num1 = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
    const den1 = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
    const co = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num1 / (den1 || 1)));
    const cxp = co * rx * y1p / ry;
    const cyp = -co * ry * x1p / rx;
    const ccx = cosP * cxp - sinP * cyp + (x1 + x2) / 2;
    const ccy = sinP * cxp + cosP * cyp + (y1 + y) / 2;
    const ux = (x1p - cxp) / rx;
    const uy = (y1p - cyp) / ry;
    const vx = (-x1p - cxp) / rx;
    const vy = (-y1p - cyp) / ry;
    const theta = Math.atan2(uy, ux);
    let delta = Math.atan2(vy, vx) - theta;
    if (!sweep && delta > 0) delta -= 2 * Math.PI;
    if (sweep && delta < 0) delta += 2 * Math.PI;
    const steps = Math.max(
      2,
      Math.min(320, Math.ceil(Math.abs(delta) * Math.max(rx, ry) / tol))
    );
    for (let k2 = 1; k2 <= steps; k2++) {
      const t2 = theta + delta * k2 / steps;
      const ct = Math.cos(t2);
      const st = Math.sin(t2);
      poly.push({
        x: ccx + rx * ct * cosP - ry * st * sinP,
        y: ccy + rx * ct * sinP + ry * st * cosP
      });
    }
    px = x2;
    py = y;
    cx = x2;
    cy = y;
  }
  while (i2 < n2) {
    skip();
    if (i2 >= n2) break;
    let cmd = d[i2];
    if (CMD.test(cmd)) {
      i2++;
    } else if (prev) {
      cmd = prev === "M" ? "L" : prev === "m" ? "l" : prev;
    } else {
      break;
    }
    const rel = cmd >= "a" && cmd <= "z";
    const up = cmd.toUpperCase();
    if (up === "Z") {
      if (poly.length) poly.push({ x: sx, y: sy });
      closePoly();
      cx = sx;
      cy = sy;
      prev = cmd;
      continue;
    }
    const need = (v) => v == null ? NaN : v;
    const a2 = need(num());
    if (isNaN(a2)) break;
    switch (up) {
      case "M": {
        const b = need(num());
        if (isNaN(b)) return polys;
        move(rel ? cx + a2 : a2, rel ? cy + b : b);
        break;
      }
      case "L": {
        const b = need(num());
        if (isNaN(b)) return polys;
        line(rel ? cx + a2 : a2, rel ? cy + b : b);
        break;
      }
      case "H":
        line(rel ? cx + a2 : a2, cy);
        break;
      case "V":
        line(cx, rel ? cy + a2 : a2);
        break;
      case "C": {
        const args = [a2, num(), num(), num(), num(), num()];
        if (args.some((v2) => v2 == null)) return polys;
        const v = (
          /** @type {number[]} */
          args
        );
        cubic(
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3],
          rel ? cx + v[4] : v[4],
          rel ? cy + v[5] : v[5]
        );
        break;
      }
      case "S": {
        const args = [a2, num(), num(), num()];
        if (args.some((v2) => v2 == null)) return polys;
        const v = (
          /** @type {number[]} */
          args
        );
        const smooth = prev && "CcSs".indexOf(prev) >= 0;
        cubic(
          smooth ? 2 * cx - px : cx,
          smooth ? 2 * cy - py : cy,
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3]
        );
        break;
      }
      case "Q": {
        const args = [a2, num(), num(), num()];
        if (args.some((v2) => v2 == null)) return polys;
        const v = (
          /** @type {number[]} */
          args
        );
        quad(
          rel ? cx + v[0] : v[0],
          rel ? cy + v[1] : v[1],
          rel ? cx + v[2] : v[2],
          rel ? cy + v[3] : v[3]
        );
        break;
      }
      case "T": {
        const b = need(num());
        if (isNaN(b)) return polys;
        const smooth = prev && "QqTt".indexOf(prev) >= 0;
        quad(
          smooth ? 2 * cx - px : cx,
          smooth ? 2 * cy - py : cy,
          rel ? cx + a2 : a2,
          rel ? cy + b : b
        );
        break;
      }
      case "A": {
        const rx = a2;
        const ry = num();
        const rot = num();
        const large = flag();
        const sweep = flag();
        const ex = num();
        const ey = num();
        if (ry == null || rot == null || large == null || sweep == null || ex == null || ey == null) {
          return polys;
        }
        arc(rx, ry, rot, large, sweep, rel ? cx + ex : ex, rel ? cy + ey : ey);
        break;
      }
      default:
        return polys;
    }
    if (up !== "C" && up !== "S" && up !== "Q" && up !== "T") {
      px = cx;
      py = cy;
    }
    prev = cmd;
  }
  closePoly();
  return polys;
}
function boundsOf(polys) {
  const b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  polys.forEach((pts) => {
    pts.forEach((p) => {
      if (p.x < b.x0) b.x0 = p.x;
      if (p.y < b.y0) b.y0 = p.y;
      if (p.x > b.x1) b.x1 = p.x;
      if (p.y > b.y1) b.y1 = p.y;
    });
  });
  return b;
}
const BANDS = 128;
function polygonRegion(polys, tf, opts = {}) {
  const evenOdd = !!opts.evenOdd;
  const edges = [];
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  polys.forEach((pts) => {
    for (let i2 = 0; i2 < pts.length; i2++) {
      const a2 = pts[i2];
      const b = pts[(i2 + 1) % pts.length];
      const ax = tf.offX + a2.x * tf.scale;
      const ay = tf.offY + a2.y * tf.scale;
      const bx = tf.offX + b.x * tf.scale;
      const by = tf.offY + b.y * tf.scale;
      if (ax < minX) minX = ax;
      if (bx < minX) minX = bx;
      if (ax > maxX) maxX = ax;
      if (bx > maxX) maxX = bx;
      if (ay < minY) minY = ay;
      if (by < minY) minY = by;
      if (ay > maxY) maxY = ay;
      if (by > maxY) maxY = by;
      if (ay === by) continue;
      edges.push({ x0: ax, y0: ay, x1: bx, y1: by });
    }
  });
  if (!edges.length) {
    return { minY: 0, maxY: 0, minX: 0, maxX: 0, spansAt: () => [] };
  }
  const height = Math.max(1e-6, maxY - minY);
  const bands = [];
  for (let k2 = 0; k2 < BANDS; k2++) bands.push([]);
  edges.forEach((e2) => {
    const lo = Math.min(e2.y0, e2.y1);
    const hi = Math.max(e2.y0, e2.y1);
    let i0 = Math.floor((lo - minY) / height * BANDS);
    let i1 = Math.floor((hi - minY) / height * BANDS);
    i0 = Math.max(0, Math.min(BANDS - 1, i0));
    i1 = Math.max(0, Math.min(BANDS - 1, i1));
    for (let i2 = i0; i2 <= i1; i2++) bands[i2].push(e2);
  });
  const spansAt = (y) => {
    const bi = Math.floor((y - minY) / height * BANDS);
    if (bi < 0 || bi > BANDS - 1) return [];
    const list = bands[bi];
    const xs = [];
    for (let i2 = 0; i2 < list.length; i2++) {
      const e2 = list[i2];
      const down = e2.y1 > e2.y0;
      const lo = down ? e2.y0 : e2.y1;
      const hi = down ? e2.y1 : e2.y0;
      if (y < lo || y >= hi) continue;
      xs.push({
        x: e2.x0 + (y - e2.y0) / (e2.y1 - e2.y0) * (e2.x1 - e2.x0),
        dir: down ? 1 : -1
      });
    }
    if (xs.length < 2) return [];
    xs.sort((a2, b) => a2.x - b.x);
    const spans = [];
    if (evenOdd) {
      for (let j2 = 0; j2 + 1 < xs.length; j2 += 2) {
        spans.push({ x0: xs[j2].x, x1: xs[j2 + 1].x });
      }
      return spans;
    }
    let wind = 0;
    let start = 0;
    for (let k2 = 0; k2 < xs.length; k2++) {
      const was = wind;
      wind += xs[k2].dir;
      if (was === 0 && wind !== 0) start = xs[k2].x;
      else if (was !== 0 && wind === 0) spans.push({ x0: start, x1: xs[k2].x });
    }
    return spans;
  };
  return { minY, maxY, minX, maxX, spansAt };
}
function strokeRegion(polys, tf, halfWidth) {
  const r2 = Math.max(1e-6, halfWidth * tf.scale);
  const caps = [];
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;
  polys.forEach((pts) => {
    for (let i2 = 0; i2 + 1 < pts.length; i2++) {
      const ax = tf.offX + pts[i2].x * tf.scale;
      const ay = tf.offY + pts[i2].y * tf.scale;
      const bx = tf.offX + pts[i2 + 1].x * tf.scale;
      const by = tf.offY + pts[i2 + 1].y * tf.scale;
      const len = Math.hypot(bx - ax, by - ay);
      const nx = len > 1e-9 ? -(by - ay) / len * r2 : r2;
      const ny = len > 1e-9 ? (bx - ax) / len * r2 : 0;
      caps.push({ ax, ay, bx, by, nx, ny });
      if (Math.min(ax, bx) - r2 < minX) minX = Math.min(ax, bx) - r2;
      if (Math.max(ax, bx) + r2 > maxX) maxX = Math.max(ax, bx) + r2;
      if (Math.min(ay, by) - r2 < minY) minY = Math.min(ay, by) - r2;
      if (Math.max(ay, by) + r2 > maxY) maxY = Math.max(ay, by) + r2;
    }
  });
  if (!caps.length) {
    return { minY: 0, maxY: 0, minX: 0, maxX: 0, spansAt: () => [] };
  }
  const height = Math.max(1e-6, maxY - minY);
  const bands = [];
  for (let k2 = 0; k2 < BANDS; k2++) bands.push([]);
  caps.forEach((c) => {
    const lo = Math.min(c.ay, c.by) - r2;
    const hi = Math.max(c.ay, c.by) + r2;
    let i0 = Math.floor((lo - minY) / height * BANDS);
    let i1 = Math.floor((hi - minY) / height * BANDS);
    i0 = Math.max(0, Math.min(BANDS - 1, i0));
    i1 = Math.max(0, Math.min(BANDS - 1, i1));
    for (let i2 = i0; i2 <= i1; i2++) bands[i2].push(c);
  });
  const disc = (cx, cy, y) => {
    const dy = y - cy;
    if (dy <= -r2 || dy >= r2) return null;
    const half = Math.sqrt(r2 * r2 - dy * dy);
    return { x0: cx - half, x1: cx + half };
  };
  const spansAt = (y) => {
    const bi = Math.floor((y - minY) / height * BANDS);
    if (bi < 0 || bi > BANDS - 1) return [];
    const list = bands[bi];
    const parts = [];
    for (let i2 = 0; i2 < list.length; i2++) {
      const c = list[i2];
      const qx = [c.ax + c.nx, c.bx + c.nx, c.bx - c.nx, c.ax - c.nx];
      const qy = [c.ay + c.ny, c.by + c.ny, c.by - c.ny, c.ay - c.ny];
      let lo = Infinity;
      let hi = -Infinity;
      for (let k2 = 0; k2 < 4; k2++) {
        const j2 = (k2 + 1) % 4;
        const y0 = qy[k2];
        const y1 = qy[j2];
        if (y0 === y1) continue;
        const top = Math.min(y0, y1);
        const bot = Math.max(y0, y1);
        if (y < top || y >= bot) continue;
        const x2 = qx[k2] + (y - y0) / (y1 - y0) * (qx[j2] - qx[k2]);
        if (x2 < lo) lo = x2;
        if (x2 > hi) hi = x2;
      }
      if (hi > lo) parts.push({ x0: lo, x1: hi });
      const da = disc(c.ax, c.ay, y);
      if (da) parts.push(da);
      const db = disc(c.bx, c.by, y);
      if (db) parts.push(db);
    }
    if (!parts.length) return [];
    parts.sort((a2, b) => a2.x0 - b.x0);
    const spans = [parts[0]];
    for (let i2 = 1; i2 < parts.length; i2++) {
      const last = spans[spans.length - 1];
      if (parts[i2].x0 <= last.x1) {
        if (parts[i2].x1 > last.x1) last.x1 = parts[i2].x1;
      } else {
        spans.push(parts[i2]);
      }
    }
    return spans;
  };
  return { minY, maxY, minX, maxX, spansAt };
}
function fitBox(bounds, rect, padding) {
  const bw = Math.max(1e-6, bounds.x1 - bounds.x0);
  const bh = Math.max(1e-6, bounds.y1 - bounds.y0);
  const scale = Math.min(
    rect.width * padding / bw,
    rect.height * padding / bh
  );
  return {
    scale,
    offX: rect.x + rect.width / 2 - (bounds.x0 + bw / 2) * scale,
    offY: rect.y + rect.height / 2 - (bounds.y0 + bh / 2) * scale
  };
}
function rowSlots(region, dx, dy) {
  const inset = dx * 0.42;
  const sliver = dx * 0.45;
  const height = region.maxY - region.minY;
  const rows = Math.max(1, Math.floor(height / dy));
  const top = region.minY + (height - rows * dy) / 2;
  const cells = [];
  let capacity = 0;
  for (let r2 = 0; r2 < rows; r2++) {
    const y = top + (r2 + 0.5) * dy;
    const spans = region.spansAt(y);
    for (let s2 = 0; s2 < spans.length; s2++) {
      const len = spans[s2].x1 - spans[s2].x0;
      let cap;
      if (len >= 2 * inset) cap = Math.floor((len - 2 * inset) / dx) + 1;
      else cap = len >= sliver ? 1 : 0;
      if (!cap) continue;
      cells.push({ y, x0: spans[s2].x0, x1: spans[s2].x1, cap, row: r2 });
      capacity += cap;
    }
  }
  return { cells, capacity, inset };
}
function allocate(weights, total) {
  const out = new Array(weights.length).fill(0);
  let sum2 = 0;
  for (let i2 = 0; i2 < weights.length; i2++) sum2 += weights[i2];
  if (!sum2 || total <= 0) return out;
  let used = 0;
  const rest = [];
  for (let i2 = 0; i2 < weights.length; i2++) {
    const q2 = total * weights[i2] / sum2;
    out[i2] = Math.floor(q2);
    used += out[i2];
    rest.push({ i: i2, frac: q2 - out[i2] });
  }
  rest.sort((a2, b) => b.frac - a2.frac);
  for (let k2 = 0; used < total; k2++, used++) out[rest[k2 % rest.length].i]++;
  return out;
}
function fitSpacing(region, count, rowRatio) {
  let lo = 1;
  let hi = Math.max(region.maxY - region.minY, 8);
  for (let i2 = 0; i2 < 34; i2++) {
    const mid = (lo + hi) / 2;
    if (rowSlots(region, mid, mid * rowRatio).capacity >= count) lo = mid;
    else hi = mid;
  }
  return lo;
}
function fitRadius(r2, dx) {
  return Math.min(Math.max(r2, dx / 3.2), dx / 2.3);
}
const ORDERS = {
  rows: null,
  rowsUp: (a2, b) => b.y - a2.y || a2.x - b.x,
  cols: (a2, b) => (a2.qx || 0) - (b.qx || 0) || a2.y - b.y,
  colsRev: (a2, b) => (b.qx || 0) - (a2.qx || 0) || a2.y - b.y,
  centerOut: (a2, b) => (a2.qd || 0) - (b.qd || 0) || a2.y - b.y,
  centerIn: (a2, b) => (b.qd || 0) - (a2.qd || 0) || a2.y - b.y
};
function assign(objects, slots, order, pitch) {
  const cmp = ORDERS[order] !== void 0 ? ORDERS[order] : null;
  let ordered = slots;
  if (cmp) {
    let cx = 0;
    let cy = 0;
    slots.forEach((s2) => {
      cx += s2.x;
      cy += s2.y;
    });
    cx /= slots.length || 1;
    cy /= slots.length || 1;
    const step = pitch > 0 ? pitch : 1;
    slots.forEach((s2) => {
      s2.qx = Math.round(s2.x / step);
      s2.qd = Math.round(Math.hypot(s2.x - cx, s2.y - cy) / step);
    });
    ordered = slots.slice().sort(cmp);
  }
  const out = [];
  for (let i2 = 0; i2 < objects.length && i2 < ordered.length; i2++) {
    out.push({
      id: objects[i2].id,
      x: ordered[i2].x,
      y: ordered[i2].y,
      r: ordered[i2].r
    });
  }
  return out;
}
function placeRow(cell, n2, dx, inset, r2, into) {
  if (n2 <= 0) return;
  if (n2 === 1) {
    into.push({ x: (cell.x0 + cell.x1) / 2, y: cell.y, r: r2, row: cell.row });
    return;
  }
  let a2 = cell.x0 + inset;
  const b = cell.x1 - inset;
  let gap = (b - a2) / (n2 - 1);
  if (gap > dx * 1.5) {
    gap = dx;
    a2 = (cell.x0 + cell.x1) / 2 - gap * (n2 - 1) / 2;
  }
  for (let j2 = 0; j2 < n2; j2++) {
    into.push({ x: a2 + j2 * gap, y: cell.y, r: r2, row: cell.row });
  }
}
const warned = /* @__PURE__ */ new Set();
function defineShape(meta, build2) {
  const inner = build2(meta);
  const min = meta.minUnits || 0;
  const layout = (objects, rect) => {
    if (min && objects.length && objects.length < min && !warned.has(meta.name)) {
      warned.add(meta.name);
      const effect = meta.kind === "stroke" ? "A stroke thins to a dotted line below that, which may well be fine." : "Fine detail closes up below that.";
      console.warn(
        `[ApexCharts] unit shape "${meta.name}" reads best from about ${min} units; this chart has ${objects.length}. ${effect} Lower plotOptions.unit.unitValue to draw more dots, or pick a simpler shape.`
      );
    }
    return inner(objects, rect);
  };
  layout.shape = Object.freeze(__spreadValues({}, meta));
  layout.with = (overrides) => defineShape(__spreadValues(__spreadValues({}, meta), overrides), build2);
  return (
    /** @type {UnitShape} */
    layout
  );
}
const cache$1 = /* @__PURE__ */ new Map();
function outline(path, sampling) {
  const key = `${sampling}|${path}`;
  let hit = cache$1.get(key);
  if (!hit) {
    const polys = flattenPath(path, sampling);
    hit = { polys, bounds: boundsOf(polys) };
    cache$1.set(key, hit);
  }
  return hit;
}
function build$1(meta) {
  const path = meta.path || "";
  const order = meta.order || "rows";
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const rowRatio = meta.rowRatio == null ? 0.88 : meta.rowRatio;
  const evenOdd = meta.fillRule === "evenodd";
  const sampling = meta.sampling == null ? 0.6 : meta.sampling;
  return (objects, rect) => {
    if (!objects.length || !path) return [];
    const { polys, bounds } = outline(path, sampling);
    if (!polys.length) return [];
    const tf = fitBox(bounds, rect, padding);
    const region = polygonRegion(polys, tf, { evenOdd });
    const dx = fitSpacing(region, objects.length, rowRatio);
    const packed = rowSlots(region, dx, dx * rowRatio);
    if (!packed.cells.length) return [];
    const counts = allocate(
      packed.cells.map((c) => c.cap),
      objects.length
    );
    const r2 = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx);
    const slots = [];
    packed.cells.forEach((cell, i2) => {
      placeRow(cell, counts[i2], dx, packed.inset, r2, slots);
    });
    return assign(objects, slots, order, dx);
  };
}
function silhouette(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "silhouette" }), build$1);
}
const heart$1 = /* @__PURE__ */ silhouette({
  name: "heart",
  category: "symbols",
  minUnits: 40,
  source: "original",
  path: "M 50 93 C 20 71 5 53 5 34 C 5 17 18 6 32 6 C 41 6 47 11 50 19 C 53 11 59 6 68 6 C 82 6 95 17 95 34 C 95 53 80 71 50 93 Z"
});
const droplet$1 = /* @__PURE__ */ silhouette({
  name: "droplet",
  category: "nature",
  minUnits: 40,
  source: "original",
  path: "M 50 3 C 50 3 13 46 13 66 A 37 37 0 0 0 87 66 C 87 46 50 3 50 3 Z"
});
const human = /* @__PURE__ */ silhouette({
  name: "human",
  category: "people",
  minUnits: 80,
  source: "original",
  path: "M 39 13 A 11 11 0 0 1 61 13 A 11 11 0 0 1 39 13 Z M 38 30 C 33 31 29 34 27 40 L 19 64 L 26 67 L 33 48 L 34 58 L 31 96 L 44 96 L 46 64 L 54 64 L 56 96 L 69 96 L 66 58 L 67 48 L 74 67 L 81 64 L 73 40 C 71 34 67 31 62 30 Z"
});
const tree$1 = /* @__PURE__ */ silhouette({
  name: "tree",
  category: "nature",
  minUnits: 80,
  source: "original",
  path: "M 50 3 C 62 3 70 11 70 19 C 81 16 91 24 91 34 C 97 39 97 51 89 56 C 87 62 77 66 67 63 C 63 68 55 70 50 68 C 45 70 37 68 33 63 C 23 66 13 62 11 56 C 3 51 3 39 9 34 C 9 24 19 16 30 19 C 30 11 38 3 50 3 Z M 41 58 L 59 58 L 60 88 C 61 92 63 94 67 96 L 33 96 C 37 94 39 92 40 88 Z"
});
const house$1 = /* @__PURE__ */ silhouette({
  name: "house",
  category: "objects",
  minUnits: 120,
  order: "rows",
  source: "original",
  path: "M 50 4 L 97 44 L 97 50 L 84 50 L 84 95 L 16 95 L 16 50 L 3 50 L 3 44 Z M 44 95 L 56 95 L 56 70 L 44 70 Z M 25 58 L 25 69 L 37 69 L 37 58 Z M 63 58 L 63 69 L 75 69 L 75 58 Z"
});
const battery = /* @__PURE__ */ silhouette({
  name: "battery",
  category: "objects",
  minUnits: 40,
  order: "cols",
  source: "original",
  path: "M 14 22 L 72 22 C 78 22 82 26 82 32 L 82 38 L 93 38 L 93 62 L 82 62 L 82 68 C 82 74 78 78 72 78 L 14 78 C 8 78 4 74 4 68 L 4 32 C 4 26 8 22 14 22 Z"
});
const shield = /* @__PURE__ */ silhouette({
  name: "shield",
  category: "technology",
  minUnits: 40,
  source: "original",
  path: "M 6 8 L 94 8 L 94 38 C 94 60 82 81 50 97 C 18 81 6 60 6 38 Z"
});
const rocket = /* @__PURE__ */ silhouette({
  name: "rocket",
  category: "objects",
  minUnits: 120,
  source: "original",
  path: "M 50 2 C 59 13 65 28 66 45 L 66 76 L 58 88 L 42 88 L 34 76 L 34 45 C 35 28 41 13 50 2 Z M 65 56 L 85 86 L 85 95 L 65 82 Z M 35 56 L 15 86 L 15 95 L 35 82 Z M 43.5 34 A 6.5 6.5 0 0 0 56.5 34 A 6.5 6.5 0 0 0 43.5 34 Z"
});
const sum = (w) => w.reduce((a2, b) => a2 + b, 0);
function buildRings(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const inward = meta.order === "centerIn";
  const twist = meta.twist == null ? 2.399963 : meta.twist;
  return (objects, rect) => {
    const n2 = objects.length;
    if (!n2) return [];
    const radius = Math.min(rect.width, rect.height) / 2 * padding;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const weightsFor = (k2) => {
      const w = [];
      for (let i2 = 0; i2 < k2; i2++) {
        w.push(Math.max(1, Math.round(2 * Math.PI * (i2 + 0.5))));
      }
      return w;
    };
    let count = 1;
    while (count < 400 && sum(weightsFor(count)) < n2) count++;
    const weights = weightsFor(count);
    const gap = radius / count;
    const per = allocate(weights, n2);
    const r2 = fitRadius(objects[0].r > 0 ? objects[0].r : 3, gap);
    const slots = [];
    for (let k2 = 0; k2 < count; k2++) {
      const ring2 = inward ? count - 1 - k2 : k2;
      const rr = (ring2 + 0.5) * gap;
      const m = per[ring2];
      const phase = twist * ring2;
      for (let i2 = 0; i2 < m; i2++) {
        const t2 = phase + i2 / m * 2 * Math.PI;
        slots.push({
          x: cx + rr * Math.cos(t2),
          y: cy + rr * Math.sin(t2),
          r: r2,
          row: k2
        });
      }
    }
    return assign(objects, slots, "rows", gap);
  };
}
function buildGlobe(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const tilt = (meta.tilt == null ? 15 : meta.tilt) * Math.PI / 180;
  const order = meta.order || "rows";
  return (objects, rect) => {
    const n2 = objects.length;
    if (!n2) return [];
    const radius = Math.min(rect.width, rect.height) / 2 * padding;
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const SAMPLES = 40;
    const project = (sinPhi, cosPhi, lon) => {
      const z2 = cosPhi * Math.cos(lon);
      return {
        x: radius * cosPhi * Math.sin(lon),
        y: radius * (sinPhi * cosT + z2 * sinT),
        depth: z2 * cosT - sinPhi * sinT
      };
    };
    const candidatesAt = (pitch2) => {
      const count = Math.max(3, Math.ceil(Math.PI * radius / pitch2));
      const dLat = Math.PI / count;
      const near = pitch2 * 0.95;
      const cell = near;
      const grid = /* @__PURE__ */ new Map();
      const rows2 = [];
      let total = 0;
      const keep = (p) => {
        const gx = Math.floor(p.x / cell);
        const gy = Math.floor(p.y / cell);
        for (let a2 = -1; a2 <= 1; a2++) {
          for (let b = -1; b <= 1; b++) {
            const bucket = grid.get(`${gx + a2},${gy + b}`);
            if (!bucket) continue;
            for (let i2 = 0; i2 < bucket.length; i2++) {
              if (Math.hypot(bucket[i2].x - p.x, bucket[i2].y - p.y) < near) {
                return false;
              }
            }
          }
        }
        const key = `${gx},${gy}`;
        const own = grid.get(key);
        if (own) own.push(p);
        else grid.set(key, [p]);
        return true;
      };
      for (let b = 0; b < count; b++) {
        const phi = -Math.PI / 2 + (b + 0.5) * dLat;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const cut = sinPhi * sinT / (cosPhi * cosT || 1e-9);
        if (cut >= 1) continue;
        const lonMax = cut <= -1 ? Math.PI : Math.acos(cut);
        const closed = lonMax >= Math.PI - 1e-9;
        const pts = [];
        const cum = [0];
        for (let k2 = 0; k2 <= SAMPLES; k2++) {
          const lon = -lonMax + 2 * lonMax * k2 / SAMPLES;
          const p = project(sinPhi, cosPhi, lon);
          pts.push(p);
          if (k2 > 0) {
            const q2 = pts[k2 - 1];
            cum.push(cum[k2 - 1] + Math.hypot(p.x - q2.x, p.y - q2.y));
          }
        }
        const len = cum[cum.length - 1];
        const inset = closed ? 0 : Math.min(pitch2 * 0.42, len / 2);
        const span = len - 2 * inset;
        let m;
        if (closed) m = Math.max(1, Math.round(len / pitch2));
        else if (span > 0) m = Math.floor(span / pitch2) + 1;
        else m = len >= pitch2 * 0.45 ? 1 : 0;
        if (!m) continue;
        const step = closed ? len / m : m > 1 ? span / (m - 1) : 0;
        const row = [];
        let seg = 0;
        for (let j2 = 0; j2 < m; j2++) {
          const s2 = closed ? j2 * step : m > 1 ? inset + j2 * step : len / 2;
          while (seg < cum.length - 2 && cum[seg + 1] < s2) seg++;
          const c0 = cum[seg];
          const c1 = cum[seg + 1];
          const t2 = c1 > c0 ? (s2 - c0) / (c1 - c0) : 0;
          const p0 = pts[seg];
          const p1 = pts[seg + 1];
          const p = {
            x: cx + p0.x + (p1.x - p0.x) * t2,
            y: cy + p0.y + (p1.y - p0.y) * t2,
            depth: p0.depth + (p1.depth - p0.depth) * t2
          };
          if (keep(p)) row.push(p);
        }
        if (!row.length) continue;
        rows2.push(row);
        total += row.length;
      }
      return { rows: rows2, total };
    };
    let lo = 1;
    let hi = 2 * radius;
    for (let i2 = 0; i2 < 30; i2++) {
      const mid = (lo + hi) / 2;
      if (candidatesAt(mid).total >= n2) lo = mid;
      else hi = mid;
    }
    const pitch = lo;
    const { rows } = candidatesAt(pitch);
    const per = allocate(
      rows.map((r2) => r2.length),
      n2
    );
    const baseR = fitRadius(objects[0].r > 0 ? objects[0].r : 3, pitch);
    const slots = [];
    rows.forEach((row, i2) => {
      const take = per[i2];
      if (!take) return;
      for (let j2 = 0; j2 < take; j2++) {
        const p = row[Math.min(row.length - 1, Math.floor(j2 * row.length / take))];
        slots.push({
          x: p.x,
          y: p.y,
          // Shading, not spacing: the surface turning away reads as smaller
          // dots. Spacing is already even, so this cannot open a gap.
          r: baseR * (0.62 + 0.38 * Math.sqrt(Math.max(0, p.depth))),
          row: i2
        });
      }
    });
    slots.sort((a2, b) => a2.y - b.y || a2.x - b.x);
    return assign(objects, slots, order, pitch);
  };
}
function buildTiers(meta) {
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const rowRatio = meta.rowRatio == null ? 0.9 : meta.rowRatio;
  const order = meta.order || "rowsUp";
  return (objects, rect) => {
    const n2 = objects.length;
    if (!n2) return [];
    const tiers2 = Math.max(1, Math.round((Math.sqrt(8 * n2 + 1) - 1) / 2));
    const weights = [];
    for (let t2 = 0; t2 < tiers2; t2++) weights.push(t2 + 1);
    const per = allocate(weights, n2);
    const widest = Math.max(...per);
    const dx = Math.min(
      rect.width * padding / Math.max(1, widest - 1 + 1.6),
      rect.height * padding / (tiers2 * rowRatio)
    );
    const dy = dx * rowRatio;
    const cx = rect.x + rect.width / 2;
    const top = rect.y + (rect.height - tiers2 * dy) / 2;
    const r2 = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx);
    const slots = [];
    for (let i2 = 0; i2 < tiers2; i2++) {
      for (let j2 = 0; j2 < per[i2]; j2++) {
        slots.push({
          x: cx + (j2 - (per[i2] - 1) / 2) * dx,
          y: top + (i2 + 0.5) * dy,
          r: r2,
          row: i2
        });
      }
    }
    return assign(objects, slots, order, dx);
  };
}
function rings(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "rings" }), buildRings);
}
function sphere(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "globe" }), buildGlobe);
}
function tiers(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "tiers" }), buildTiers);
}
const target = /* @__PURE__ */ rings({
  name: "target",
  category: "business",
  minUnits: 40,
  order: "centerIn",
  source: "generated"
});
const globe = /* @__PURE__ */ sphere({
  name: "globe",
  category: "geography",
  minUnits: 60,
  tilt: 15,
  source: "generated"
});
const pyramid = /* @__PURE__ */ tiers({
  name: "pyramid",
  category: "symbols",
  minUnits: 20,
  order: "rowsUp",
  source: "generated"
});
const leaf = /* @__PURE__ */ silhouette({
  name: "leaf",
  category: "nature",
  minUnits: 60,
  source: "original",
  // Two cubics per side, so both ends close as cusps: one cubic per side pulls
  // wide too early and rounds the tip off. Narrow (roughly 2:1) and tilted 28
  // degrees, both for the same reason. Drawn upright and square it reads as a
  // playing-card spade, since a spade is exactly a wide leaf with a stem.
  path: "M 27.5 7.6 C 22.6 28.3 17.8 49 26.2 64.9 C 35.6 82.6 55.5 90.1 71.6 90.6 C 80.2 77 85.1 56.3 75.7 38.6 C 67.2 22.7 47.3 15.2 27.5 7.6 Z M 67.1 88.5 L 71.9 101.8 L 80.7 97.1 L 72.4 85.7 Z"
});
const sun = /* @__PURE__ */ silhouette({
  name: "sun",
  category: "nature",
  minUnits: 140,
  source: "original",
  path: "M 75.5 41.2 L 98 50 L 75.5 58.8 L 74.3 61.8 L 83.9 83.9 L 61.8 74.3 L 58.8 75.5 L 50 98 L 41.2 75.5 L 38.2 74.3 L 16.1 83.9 L 25.7 61.8 L 24.5 58.8 L 2 50 L 24.5 41.2 L 25.7 38.2 L 16.1 16.1 L 38.2 25.7 L 41.2 24.5 L 50 2 L 58.8 24.5 L 61.8 25.7 L 83.9 16.1 L 74.3 38.2 Z"
});
const flame = /* @__PURE__ */ silhouette({
  name: "flame",
  category: "nature",
  minUnits: 60,
  source: "original",
  path: "M 56 2 C 52 24 34 30 30 50 C 27 64 33 70 34 78 C 24 72 20 60 21 50 C 12 62 10 76 16 86 C 24 95 38 98 52 98 C 72 98 84 84 82 64 C 80 46 68 40 66 26 C 64 38 60 42 58 44 C 62 30 60 14 56 2 Z"
});
const fish = /* @__PURE__ */ silhouette({
  name: "fish",
  category: "nature",
  minUnits: 80,
  source: "original",
  path: "M 20 50 C 34 26 58 20 76 30 C 86 36 92 44 94 50 C 92 56 86 64 76 70 C 58 80 34 74 20 50 Z M 26 50 L 4 74 L 12 50 L 4 26 Z"
});
const star$1 = /* @__PURE__ */ silhouette({
  name: "star",
  category: "symbols",
  minUnits: 80,
  source: "original",
  path: "M 50 2 L 61.8 33.8 L 95.7 35.2 L 69 56.2 L 78.2 88.8 L 50 70 L 21.8 88.8 L 31 56.2 L 4.3 35.2 L 38.2 33.8 Z"
});
const arrow = /* @__PURE__ */ silhouette({
  name: "arrow",
  category: "symbols",
  minUnits: 60,
  source: "original",
  path: "M 50 4 L 92 46 L 70 46 L 70 96 L 30 96 L 30 46 L 8 46 Z"
});
const crown = /* @__PURE__ */ silhouette({
  name: "crown",
  category: "symbols",
  minUnits: 90,
  source: "original",
  path: "M 8 84 L 14 26 L 32 52 L 50 16 L 68 52 L 86 26 L 92 84 Z"
});
const cross = /* @__PURE__ */ silhouette({
  name: "cross",
  category: "symbols",
  minUnits: 40,
  source: "original",
  path: "M 36 6 L 64 6 L 64 36 L 94 36 L 94 64 L 64 64 L 64 94 L 36 94 L 36 64 L 6 64 L 6 36 L 36 36 Z"
});
const bolt = /* @__PURE__ */ silhouette({
  name: "bolt",
  category: "symbols",
  minUnits: 70,
  source: "original",
  path: "M 62 3 L 20 56 L 44 56 L 38 97 L 80 40 L 54 40 Z"
});
const bulb$1 = /* @__PURE__ */ silhouette({
  name: "bulb",
  category: "objects",
  minUnits: 90,
  source: "original",
  path: "M 50 4 C 29 4 14 21 14 39 C 14 54 25 62 30 72 L 70 72 C 75 62 86 54 86 39 C 86 21 71 4 50 4 Z M 34 74 L 36 96 L 64 96 L 66 74 Z"
});
const flask = /* @__PURE__ */ silhouette({
  name: "flask",
  category: "objects",
  minUnits: 60,
  source: "original",
  path: "M 40 4 L 60 4 L 60 36 L 92 92 L 8 92 L 40 36 Z"
});
const car$1 = /* @__PURE__ */ silhouette({
  name: "car",
  category: "objects",
  minUnits: 120,
  source: "original",
  path: "M 4 78 L 4 56 L 20 52 L 32 30 L 68 30 L 82 52 L 96 56 L 96 78 Z M 13 78 A 13 13 0 0 1 39 78 A 13 13 0 0 1 13 78 Z M 61 78 A 13 13 0 0 1 87 78 A 13 13 0 0 1 61 78 Z"
});
const plane$1 = /* @__PURE__ */ silhouette({
  name: "plane",
  category: "objects",
  minUnits: 160,
  source: "original",
  path: "M 50 2 C 54 2 57 9 58 19 L 58 35 L 95 57 L 95 67 L 58 57 L 58 76 L 70 86 L 70 95 L 50 89 L 30 95 L 30 86 L 42 76 L 42 57 L 5 67 L 5 57 L 42 35 L 42 19 C 43 9 46 2 50 2 Z"
});
const group = /* @__PURE__ */ silhouette({
  name: "group",
  category: "people",
  minUnits: 160,
  source: "original",
  path: "M 8 94 L 8 57 C 8 48 14.6 48 14.6 48 L 23.4 48 C 23.4 48 30 48 30 57 L 30 94 Z M 9.5 34 A 9.5 9.5 0 0 1 28.5 34 A 9.5 9.5 0 0 1 9.5 34 Z M 36 94 L 36 47 C 36 38 44.4 38 44.4 38 L 55.6 38 C 55.6 38 64 38 64 47 L 64 94 Z M 38.5 23 A 11.5 11.5 0 0 1 61.5 23 A 11.5 11.5 0 0 1 38.5 23 Z M 70 94 L 70 57 C 70 48 76.6 48 76.6 48 L 85.4 48 C 85.4 48 92 48 92 57 L 92 94 Z M 71.5 34 A 9.5 9.5 0 0 1 90.5 34 A 9.5 9.5 0 0 1 71.5 34 Z"
});
const trophy = /* @__PURE__ */ silhouette({
  name: "trophy",
  category: "business",
  minUnits: 110,
  source: "original",
  path: "M 30 8 L 70 8 L 68 40 C 68 54 58 62 50 62 C 42 62 32 54 32 40 Z M 45 60 L 55 60 L 55 78 L 45 78 Z M 30 78 L 70 78 L 74 92 L 26 92 Z"
});
const moneybag = /* @__PURE__ */ silhouette({
  name: "moneybag",
  category: "business",
  minUnits: 80,
  source: "original",
  path: "M 36 8 L 64 8 L 59 24 C 80 32 90 48 90 65 C 90 83 73 94 50 94 C 27 94 10 83 10 65 C 10 48 20 32 41 24 Z"
});
const funnel = /* @__PURE__ */ silhouette({
  name: "funnel",
  category: "business",
  minUnits: 80,
  source: "original",
  path: "M 6 10 L 94 10 L 58 56 L 58 92 L 42 92 L 42 56 Z"
});
const gear = /* @__PURE__ */ silhouette({
  name: "gear",
  category: "technology",
  minUnits: 260,
  source: "original",
  path: "M 82 50.9 L 96.8 54.3 L 93.2 68.5 L 78.6 64.4 L 73.9 71.2 L 83.1 83.3 L 71.2 92 L 62.6 79.4 L 54.7 81.7 L 53.9 96.8 L 39.3 95.8 L 40.8 80.6 L 33.2 77.3 L 22.9 88.4 L 12.4 78.2 L 23.2 67.5 L 19.6 60.1 L 4.6 62 L 3.1 47.4 L 18.2 46.2 L 20.2 38.2 L 7.5 30 L 15.7 17.8 L 28.1 26.7 L 34.8 21.9 L 30.3 7.3 L 44.4 3.3 L 48.2 18 L 56.4 18.7 L 62.3 4.6 L 75.7 10.7 L 69.2 24.4 L 75.1 30.1 L 88.6 23.2 L 95 36.4 L 81.2 42.7 Z M 37 50 A 13 13 0 0 0 63 50 A 13 13 0 0 0 37 50 Z"
});
const robot = /* @__PURE__ */ silhouette({
  name: "robot",
  category: "technology",
  minUnits: 220,
  source: "original",
  path: "M 18 40 C 18 30 26 26 36 26 L 64 26 C 74 26 82 30 82 40 L 82 72 C 82 82 74 86 64 86 L 36 86 C 26 86 18 82 18 72 Z M 46 14 L 54 14 L 54 28 L 46 28 Z M 44 12 A 6 6 0 0 1 56 12 A 6 6 0 0 1 44 12 Z M 29 50 A 7 7 0 0 0 43 50 A 7 7 0 0 0 29 50 Z M 57 50 A 7 7 0 0 0 71 50 A 7 7 0 0 0 57 50 Z"
});
const pin = /* @__PURE__ */ silhouette({
  name: "pin",
  category: "geography",
  minUnits: 120,
  source: "original",
  path: "M 50 96 C 50 96 16 56 16 38 C 16 20 31 6 50 6 C 69 6 84 20 84 38 C 84 56 50 96 50 96 Z M 39 37 A 11 11 0 0 0 61 37 A 11 11 0 0 0 39 37 Z"
});
const mountain = /* @__PURE__ */ silhouette({
  name: "mountain",
  category: "geography",
  minUnits: 60,
  source: "original",
  path: "M 2 90 L 34 26 L 50 56 L 64 18 L 98 90 Z"
});
const cache = /* @__PURE__ */ new Map();
function centreline(path, sampling) {
  const key = `${sampling}|${path}`;
  let hit = cache.get(key);
  if (!hit) {
    const polys = flattenPath(path, sampling, true);
    hit = { polys, bounds: boundsOf(polys) };
    cache.set(key, hit);
  }
  return hit;
}
function build(meta) {
  const path = meta.path || "";
  const order = meta.order || "rows";
  const padding = meta.padding == null ? 0.94 : meta.padding;
  const rowRatio = meta.rowRatio == null ? 0.88 : meta.rowRatio;
  const sampling = meta.sampling == null ? 0.6 : meta.sampling;
  const half = Math.max(0.5, (meta.width == null ? 16 : meta.width) / 2);
  return (objects, rect) => {
    if (!objects.length || !path) return [];
    const { polys, bounds } = centreline(path, sampling);
    if (!polys.length) return [];
    const tf = fitBox(
      {
        x0: bounds.x0 - half,
        y0: bounds.y0 - half,
        x1: bounds.x1 + half,
        y1: bounds.y1 + half
      },
      rect,
      padding
    );
    const region = strokeRegion(polys, tf, half);
    const dx = fitSpacing(region, objects.length, rowRatio);
    const packed = rowSlots(region, dx, dx * rowRatio);
    if (!packed.cells.length) return [];
    const counts = allocate(
      packed.cells.map((c) => c.cap),
      objects.length
    );
    const r2 = fitRadius(objects[0].r > 0 ? objects[0].r : 3, dx);
    const slots = [];
    packed.cells.forEach((cell, i2) => {
      placeRow(cell, counts[i2], dx, packed.inset, r2, slots);
    });
    return assign(objects, slots, order, dx);
  };
}
function stroke(meta) {
  return defineShape(__spreadProps(__spreadValues({}, meta), { kind: "stroke" }), build);
}
const check = /* @__PURE__ */ stroke({
  name: "check",
  category: "symbols",
  minUnits: 40,
  width: 19,
  source: "original",
  path: "M 13 55 L 37 79 L 87 22"
});
const wifi = /* @__PURE__ */ stroke({
  name: "wifi",
  category: "technology",
  minUnits: 120,
  width: 8,
  source: "original",
  path: "M 11.9 62 A 44 44 0 0 1 88.1 62 M 24 69 A 30 30 0 0 1 76 69 M 36.1 76 A 16 16 0 0 1 63.9 76 M 50 86 L 50 86"
});
const pulse = /* @__PURE__ */ stroke({
  name: "pulse",
  category: "technology",
  minUnits: 60,
  width: 11,
  source: "original",
  path: "M 4 58 L 26 58 L 35 30 L 47 84 L 59 44 L 68 58 L 96 58"
});
const xmark = /* @__PURE__ */ stroke({
  name: "xmark",
  category: "symbols",
  minUnits: 40,
  width: 18,
  source: "original",
  path: "M 18 18 L 82 82 M 82 18 L 18 82"
});
const percent = /* @__PURE__ */ stroke({
  name: "percent",
  category: "symbols",
  minUnits: 150,
  width: 9,
  source: "original",
  path: "M 12 24 A 12 12 0 0 1 36 24 A 12 12 0 0 1 12 24 Z M 64 76 A 12 12 0 0 1 88 76 A 12 12 0 0 1 64 76 Z M 80 14 L 20 86"
});
const question = /* @__PURE__ */ stroke({
  name: "question",
  category: "symbols",
  minUnits: 90,
  width: 14,
  source: "original",
  path: "M 25 32 C 25 8 76 8 76 33 C 76 52 50 54 50 70 M 50 90 L 50 90"
});
const spiral = /* @__PURE__ */ stroke({
  name: "spiral",
  category: "symbols",
  minUnits: 140,
  width: 9,
  source: "generated",
  path: "M 56.0 50.0 L 56.4 51.4 L 56.5 52.9 L 56.2 54.5 L 55.5 56.1 L 54.3 57.5 L 52.9 58.8 L 51.0 59.7 L 48.9 60.3 L 46.6 60.3 L 44.3 59.9 L 42.0 58.9 L 39.9 57.3 L 38.1 55.3 L 36.8 52.8 L 35.9 50.0 L 35.7 47.0 L 36.2 43.8 L 37.3 40.8 L 39.1 37.9 L 41.6 35.5 L 44.7 33.5 L 48.1 32.3 L 51.9 31.7 L 55.8 32.0 L 59.7 33.1 L 63.4 35.1 L 66.6 37.9 L 69.3 41.4 L 71.1 45.5 L 72.2 50.0 L 72.2 54.7 L 71.2 59.4 L 69.2 64.0 L 66.3 68.1 L 62.4 71.5 L 57.8 74.1 L 52.7 75.8 L 47.2 76.3 L 41.7 75.7 L 36.2 73.8 L 31.2 70.9 L 26.8 66.8 L 23.4 61.9 L 21.0 56.2 L 19.8 50.0 L 19.9 43.6 L 21.4 37.3 L 24.2 31.3 L 28.3 25.9 L 33.5 21.5 L 39.7 18.2 L 46.4 16.2 L 53.6 15.7 L 60.8 16.6 L 67.8 19.2 L 74.2 23.1 L 79.7 28.4 L 84.0 34.9 L 86.9 42.1 L 88.3 50.0 L 88.0 58.1 L 86.0 66.0 L 82.3 73.5 L 77.1 80.1 L 70.5 85.5 L 62.8 89.5 L 54.4 91.8 L 45.5 92.4 L 36.7 91.0 L 28.2 87.8 L 20.4 82.9 L 13.8 76.3 L 8.6 68.4 L 5.2 59.5 L 3.6 50.0 L 4.1 40.2 L 6.6 30.7 L 11.2 21.8"
});
const catalog$1 = [
  heart$1,
  droplet$1,
  human,
  tree$1,
  house$1,
  battery,
  shield,
  rocket,
  target,
  globe,
  pyramid,
  leaf,
  sun,
  flame,
  fish,
  star$1,
  arrow,
  crown,
  cross,
  bolt,
  bulb$1,
  flask,
  car$1,
  plane$1,
  group,
  trophy,
  moneybag,
  funnel,
  gear,
  robot,
  pin,
  mountain,
  check,
  wifi,
  pulse,
  xmark,
  percent,
  question,
  spiral
];
const LAYOUT_KEY = "__apexcharts_unit_layouts__";
function layouts() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[LAYOUT_KEY]) g[LAYOUT_KEY] = {};
  return g[LAYOUT_KEY];
}
function registerShapes(shapes) {
  const table = layouts();
  const names = [];
  const entries = Array.isArray(shapes) ? shapes.map((s2) => [s2.shape ? s2.shape.name : "", s2]) : Object.entries(shapes);
  entries.forEach(([name, shape]) => {
    const key = String(name);
    const fn = (
      /** @type {UnitShape} */
      shape
    );
    if (!key || typeof fn !== "function") return;
    table[key] = fn;
    names.push(key);
  });
  return names;
}
function definePictogram(meta) {
  const mark = (
    /** @type {any} */
    __spreadProps(__spreadValues({}, meta), {
      viewBox: meta.viewBox || [0, 0, 100, 100]
    })
  );
  mark.with = (overrides) => definePictogram(__spreadValues(__spreadValues({}, meta), overrides));
  return Object.freeze(mark);
}
const person = /* @__PURE__ */ definePictogram({
  name: "person",
  category: "people",
  source: "original",
  path: (
    // The head is two semicircular arcs, not one arc back to its own start
    // point. A near-degenerate arc (end == start) has no defined centre, and
    // the flattener reads it as NaN - which renders in a browser but breaks
    // every measurement the mark lint makes.
    "M 37 18 A 13 13 0 0 1 63 18 A 13 13 0 0 1 37 18 Z M 50 34 C 61 34 69 40 70 50 L 73 72 L 65 72 L 63 58 L 61 96 L 53 96 L 51 66 L 49 66 L 47 96 L 39 96 L 37 58 L 35 72 L 27 72 L 30 50 C 31 40 39 34 50 34 Z"
  )
});
const house = /* @__PURE__ */ definePictogram({
  name: "house",
  category: "objects",
  source: "original",
  path: "M 50 8 L 94 46 L 82 46 L 82 92 L 58 92 L 58 64 L 42 64 L 42 92 L 18 92 L 18 46 L 6 46 Z"
});
const heart = /* @__PURE__ */ definePictogram({
  name: "heart",
  category: "symbols",
  source: "original",
  path: "M 50 90 C 22 70 6 54 6 36 C 6 21 17 11 30 11 C 39 11 46 16 50 24 C 54 16 61 11 70 11 C 83 11 94 21 94 36 C 94 54 78 70 50 90 Z"
});
const tree = /* @__PURE__ */ definePictogram({
  name: "tree",
  category: "nature",
  source: "original",
  path: "M 50 6 C 66 6 78 18 78 33 C 78 38 77 42 75 46 C 82 50 86 57 86 65 C 86 77 76 86 64 86 L 55 86 L 55 96 L 45 96 L 45 86 L 36 86 C 24 86 14 77 14 65 C 14 57 18 50 25 46 C 23 42 22 38 22 33 C 22 18 34 6 50 6 Z"
});
const droplet = /* @__PURE__ */ definePictogram({
  name: "droplet",
  category: "nature",
  source: "original",
  path: "M 50 4 C 50 4 84 42 84 64 C 84 82 69 96 50 96 C 31 96 16 82 16 64 C 16 42 50 4 50 4 Z"
});
const star = /* @__PURE__ */ definePictogram({
  name: "star",
  category: "symbols",
  source: "original",
  path: "M 50 6 L 61.2 36.6 L 93.8 37.8 L 68.1 57.9 L 77 89.2 L 50 71 L 23 89.2 L 31.9 57.9 L 6.2 37.8 L 38.8 36.6 Z"
});
const car = /* @__PURE__ */ definePictogram({
  name: "car",
  category: "transport",
  source: "original",
  path: "M 6 72 L 9 53 C 10 46 15 41 22 40 L 32 23 C 35 19 39 17 44 17 L 60 17 C 65 17 69 19 71 23 L 81 40 C 88 41 93 46 94 53 L 97 72 L 97 80 L 6 80 Z M 13 88 A 11 11 0 1 1 35 88 A 11 11 0 1 1 13 88 Z M 65 88 A 11 11 0 1 1 87 88 A 11 11 0 1 1 65 88 Z"
});
const bag = /* @__PURE__ */ definePictogram({
  name: "bag",
  category: "objects",
  source: "original",
  path: "M 10 30 L 90 30 L 95 96 L 5 96 Z M 32 30 C 32 14 40 4 50 4 C 60 4 68 14 68 30 L 59 30 C 59 19 55 13 50 13 C 45 13 41 19 41 30 Z"
});
const book = /* @__PURE__ */ definePictogram({
  name: "book",
  category: "objects",
  source: "original",
  path: "M 8 14 C 8 14 26 6 50 16 C 74 6 92 14 92 14 L 92 88 C 92 88 74 80 50 90 C 26 80 8 88 8 88 Z"
});
const cup = /* @__PURE__ */ definePictogram({
  name: "cup",
  category: "objects",
  source: "original",
  path: "M 14 22 L 70 22 L 70 34 L 80 34 C 90 34 96 41 96 51 C 96 63 87 71 75 71 L 69 71 C 65 84 55 92 42 92 C 26 92 14 79 14 61 Z"
});
const bulb = /* @__PURE__ */ definePictogram({
  name: "bulb",
  category: "objects",
  source: "original",
  path: (
    // The collar and contact are wound the SAME way as the envelope (which
    // runs counter-clockwise). They do not overlap it, so a nonzero fill would
    // paint them either way - but a subpath wound against its outline is one
    // edit away from becoming a hole, and it reads as deliberate when it is not.
    "M 50 4 C 32 4 18 18 18 36 C 18 48 25 56 31 63 C 35 68 37 72 37 78 L 63 78 C 63 72 65 68 69 63 C 75 56 82 48 82 36 C 82 18 68 4 50 4 Z M 38 84 L 38 90 L 62 90 L 62 84 Z M 42 94 L 45 99 L 55 99 L 58 94 Z"
  )
});
const plane = /* @__PURE__ */ definePictogram({
  name: "plane",
  category: "transport",
  source: "original",
  path: "M 50 4 C 55 4 58 12 58 24 L 58 38 L 94 62 L 94 72 L 58 60 L 58 82 L 70 90 L 70 97 L 50 92 L 30 97 L 30 90 L 42 82 L 42 60 L 6 72 L 6 62 L 42 38 L 42 24 C 42 12 45 4 50 4 Z"
});
const catalog = [
  person,
  house,
  heart,
  tree,
  droplet,
  star,
  car,
  bag,
  book,
  cup,
  bulb,
  plane
];
const MARK_KEY = "__apexcharts_unit_marks__";
function marks() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[MARK_KEY]) g[MARK_KEY] = {};
  return g[MARK_KEY];
}
function registerMarks(defs) {
  const table = marks();
  const names = [];
  const entries = Array.isArray(defs) ? defs.map((m) => [m ? m.name : "", m]) : Object.entries(defs);
  entries.forEach(([name, mark]) => {
    const key = String(name);
    if (!key || !mark || typeof /** @type {any} */
    mark.path !== "string") {
      return;
    }
    table[key] = mark;
    names.push(key);
  });
  return names;
}
registerShapes(catalog$1);
registerMarks(catalog);
const A = (
  /** @type {any} */
  ApexCharts$1
);
A.unitShapes = catalog$1;
A.pictograms = catalog;
const CoreClass = (
  /** @type {any} */
  ApexCharts__default
);
if (CoreClass !== A) {
  for (const key of Object.getOwnPropertyNames(CoreClass)) {
    if (A[key] == null && CoreClass[key] != null) A[key] = CoreClass[key];
  }
}
export {
  default2 as default
};
