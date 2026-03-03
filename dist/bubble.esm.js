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
 * ApexCharts v5.10.0
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
  constructor(lineCtx) {
    this.w = lineCtx.w;
    this.lineCtx = lineCtx;
  }
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
    const stackSeries = w.config.chart.stacked && !w.globals.comboCharts || w.config.chart.stacked && w.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || ((_a = this.w.config.series[realIndex]) == null ? void 0 : _a.type) === "bar" || ((_b = this.w.config.series[realIndex]) == null ? void 0 : _b.type) === "column");
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
   * @param {Array} points
   * @returns {Array}
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
   * @param {Array} points
   * @param {Number} start
   * @param {Number} end
   * @returns {Array}
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
class Line {
  constructor(w, ctx, xyRatios, isPointsChart) {
    this.ctx = ctx;
    this.w = w;
    this.xyRatios = xyRatios;
    this.pointsChart = !(this.w.config.chart.type !== "bubble" && this.w.config.chart.type !== "scatter") || isPointsChart;
    this.scatter = new Scatter(this.w, this.ctx);
    this.noNegatives = this.w.globals.minX === Number.MAX_VALUE;
    this.lineHelpers = new Helpers(this);
    this.markers = new Markers(this.w, this.ctx);
    this.prevSeriesY = [];
    this.categoryAxisCorrection = 0;
    this.yaxisIndex = 0;
  }
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
      const realIndex = w.globals.comboCharts ? seriesIndex[i] : i;
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
      } else {
        paths.pathFromArea += "z";
      }
      this._handlePaths({ type, realIndex, i, paths });
      this.elSeries.add(this.elPointsMain);
      this.elSeries.add(this.elDataLabelsWrap);
      allSeries.push(this.elSeries);
    }
    if (typeof ((_a = w.config.series[0]) == null ? void 0 : _a.zIndex) !== "undefined") {
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
    this.elSeries = graphics.group({
      class: `apexcharts-series`,
      zIndex: typeof w.config.series[realIndex].zIndex !== "undefined" ? w.config.series[realIndex].zIndex : realIndex,
      seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex])
    });
    this.elPointsMain = graphics.group({
      class: "apexcharts-series-markers-wrap",
      "data:realIndex": realIndex
    });
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
  _handlePaths({ type, realIndex, i, paths }) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    this.prevSeriesY.push(paths.yArrj);
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
    }
    const defaultRenderedPathOptions = {
      i,
      realIndex,
      animationDelay: i,
      initialSpeed: w.config.chart.animations.speed,
      dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
      className: `apexcharts-${type}`
    };
    if (type === "area") {
      const pathFill = fill.fillPath({
        seriesNumber: realIndex
      });
      for (let p = 0; p < paths.areaPaths.length; p++) {
        const renderedPath = graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: paths.pathFromArea,
          pathTo: paths.areaPaths[p],
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
          pathFrom: paths.pathFromLine,
          pathTo: paths.linePaths[p],
          stroke: lineFill,
          strokeWidth: this.strokeWidth,
          strokeLineCap: w.config.stroke.lineCap,
          fill: type === "rangeArea" ? pathFill : "none"
        });
        const renderedPath = graphics.renderPaths(linePathCommonOpts);
        this.elSeries.add(renderedPath);
        renderedPath.attr("fill-rule", `evenodd`);
        if (forecast.count > 0 && type !== "rangeArea") {
          const renderedForecastPath = graphics.renderPaths(linePathCommonOpts);
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
    const stackSeries = w.config.chart.stacked && !w.globals.comboCharts || w.config.chart.stacked && w.globals.comboCharts && (!this.w.config.chart.stackOnlyBar || ((_a = this.w.config.series[realIndex]) == null ? void 0 : _a.type) === "bar" || ((_b = this.w.config.series[realIndex]) == null ? void 0 : _b.type) === "column");
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
      xArrj.push(series[i][j + 1] === null ? null : x);
      if (isNull && (w.config.stroke.curve === "smooth" || w.config.stroke.curve === "monotoneCubic")) {
        yArrj.push(null);
        y2Arrj.push(null);
      } else {
        yArrj.push(y);
        y2Arrj.push(y2);
      }
      const pointsPos = this.lineHelpers.calculatePoints({
        series,
        x,
        y,
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
  _handleMarkersAndLabels({ type, pointsPos, isRangeStart, i, j, realIndex }) {
    const w = this.w;
    const dataLabels = new DataLabels(this.w, this.ctx);
    if (!this.pointsChart) {
      if (w.seriesData.series[i].length > 1) {
        this.elPointsMain.node.classList.add("apexcharts-element-hidden");
      }
      const elPointsWrap = this.markers.plotChartMarkers({
        pointsPos,
        seriesIndex: realIndex,
        j: j + 1
      });
      if (elPointsWrap !== null) {
        this.elPointsMain.add(elPointsWrap);
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
              upperLinePaths.forEach((u) => linePaths.push(u));
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
          let path = [];
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
