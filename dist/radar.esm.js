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
 * ApexCharts v5.12.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Fill = _core.__apex_Fill;
const Graphics = _core.__apex_Graphics;
const Markers = _core.__apex_Markers;
const DataLabels = _core.__apex_DataLabels;
const Filters = _core.__apex_Filters;
const Utils = _core.__apex_Utils;
class CircularChartsHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   */
  constructor(w) {
    this.w = w;
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} i
   * @param {string | number} text
   */
  drawYAxisTexts(x, y, i, text) {
    const w = this.w;
    const yaxisConfig = w.config.yaxis[0];
    const formatter = w.formatters.yLabelFormatters[0];
    const graphics = new Graphics(this.w);
    const yaxisLabel = graphics.drawText({
      x: x + yaxisConfig.labels.offsetX,
      y: y + yaxisConfig.labels.offsetY,
      text: formatter(text, i),
      textAnchor: "middle",
      fontSize: yaxisConfig.labels.style.fontSize,
      fontFamily: yaxisConfig.labels.style.fontFamily,
      foreColor: Array.isArray(yaxisConfig.labels.style.colors) ? yaxisConfig.labels.style.colors[i] : yaxisConfig.labels.style.colors
    });
    return yaxisLabel;
  }
}
const CoreUtils = _core.__apex_CoreUtils;
class Radar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    this.chartType = this.w.config.chart.type;
    this.initialAnim = this.w.config.chart.animations.enabled;
    this.dynamicAnim = this.initialAnim && this.w.config.chart.animations.dynamicAnimation.enabled;
    this.animDur = 0;
    this.graphics = new Graphics(this.w);
    this.lineColorArr = w.globals.stroke.colors !== void 0 ? w.globals.stroke.colors : w.globals.colors;
    this.defaultSize = w.globals.svgHeight < w.globals.svgWidth ? w.layout.gridHeight : w.layout.gridWidth;
    this.isLog = w.config.yaxis[0].logarithmic;
    this.logBase = w.config.yaxis[0].logBase;
    this.coreUtils = new CoreUtils(this.w);
    this.maxValue = this.isLog ? this.coreUtils.getLogVal(this.logBase, w.globals.maxY, 0) : w.globals.maxY;
    this.minValue = this.isLog ? this.coreUtils.getLogVal(this.logBase, this.w.globals.minY, 0) : w.globals.minY;
    this.polygons = w.config.plotOptions.radar.polygons;
    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0;
    this.size = this.defaultSize / 2.1 - this.strokeWidth - w.config.chart.dropShadow.blur;
    if (w.config.xaxis.labels.show) {
      this.size = this.size - w.layout.xAxisLabelsWidth / 1.75;
    }
    if (w.config.plotOptions.radar.size !== void 0) {
      this.size = w.config.plotOptions.radar.size;
    }
    this.dataRadiusOfPercent = /** @type {any} */
    [];
    this.dataRadius = /** @type {any} */
    [];
    this.angleArr = /** @type {any} */
    [];
    this.dataPointsLen = 0;
    this.disAngle = 0;
    this.yaxisLabelsTextsPos = [];
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    const w = this.w;
    const fill = new Fill(this.w);
    const allSeries = [];
    const dataLabels = new DataLabels(this.w, this.ctx);
    if (series.length) {
      this.dataPointsLen = series[w.globals.maxValsInArrayIndex].length;
    }
    this.disAngle = Math.PI * 2 / this.dataPointsLen;
    const halfW = w.layout.gridWidth / 2;
    const halfH = w.layout.gridHeight / 2;
    const translateX = halfW + w.config.plotOptions.radar.offsetX;
    const translateY = halfH + w.config.plotOptions.radar.offsetY;
    const ret = this.graphics.group({
      class: "apexcharts-radar-series apexcharts-plot-series",
      transform: `translate(${translateX || 0}, ${translateY || 0})`
    });
    let dataPointsPos = [];
    let elPointsMain = null;
    let elDataPointsMain = null;
    this.yaxisLabels = this.graphics.group({
      class: "apexcharts-yaxis"
    });
    series.forEach((s, i) => {
      const longestSeries = s.length === w.globals.dataPoints;
      const elSeries = this.graphics.group().attr({
        class: `apexcharts-series`,
        "data:longestSeries": longestSeries,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      this.dataRadiusOfPercent[i] = [];
      this.dataRadius[i] = [];
      this.angleArr[i] = [];
      s.forEach((dv, j) => {
        const range = Math.abs(this.maxValue - this.minValue);
        dv = dv - this.minValue;
        if (this.isLog) {
          dv = this.coreUtils.getLogVal(this.logBase, dv, 0);
        }
        this.dataRadiusOfPercent[i][j] = dv / range;
        this.dataRadius[i][j] = this.dataRadiusOfPercent[i][j] * this.size;
        this.angleArr[i][j] = j * this.disAngle;
      });
      dataPointsPos = this.getDataPointsPos(
        this.dataRadius[i],
        this.angleArr[i]
      );
      const paths = this.createPaths(dataPointsPos, {
        x: 0,
        y: 0
      });
      elPointsMain = this.graphics.group({
        class: "apexcharts-series-markers-wrap apexcharts-element-hidden"
      });
      elDataPointsMain = this.graphics.group({
        class: `apexcharts-datalabels`,
        "data:realIndex": i
      });
      w.globals.delayedElements.push({
        el: elPointsMain.node,
        index: i
      });
      const defaultRenderedPathOptions = {
        i,
        realIndex: i,
        animationDelay: i,
        initialSpeed: w.config.chart.animations.speed,
        dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
        className: `apexcharts-radar`,
        shouldClipToGrid: false,
        bindEventsOnPaths: false,
        stroke: w.globals.stroke.colors[i],
        strokeLineCap: w.config.stroke.lineCap
      };
      let pathFrom = null;
      if (w.globals.previousPaths.length > 0) {
        pathFrom = this.getPreviousPath(i);
      }
      for (let p = 0; p < paths.linePathsTo.length; p++) {
        const renderedLinePath = this.graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: pathFrom === null ? paths.linePathsFrom[p] : pathFrom,
          pathTo: paths.linePathsTo[p],
          strokeWidth: Array.isArray(this.strokeWidth) ? this.strokeWidth[i] : this.strokeWidth,
          fill: "none",
          drawShadow: false
        }));
        elSeries.add(renderedLinePath);
        const pathFill = fill.fillPath({
          seriesNumber: i
        });
        const renderedAreaPath = this.graphics.renderPaths(__spreadProps(__spreadValues({}, defaultRenderedPathOptions), {
          pathFrom: pathFrom === null ? paths.areaPathsFrom[p] : pathFrom,
          pathTo: paths.areaPathsTo[p],
          strokeWidth: 0,
          fill: pathFill,
          drawShadow: false,
          // Radial mask: the area fill blooms outward from the radar's center
          // (in this group's local coords) instead of the default L→R rect wipe.
          drawMask: { type: "radial", cx: 0, cy: 0, r: this.size }
        }));
        if (w.config.chart.dropShadow.enabled) {
          const filters = new Filters(this.w);
          const shadow = w.config.chart.dropShadow;
          filters.dropShadow(
            renderedAreaPath,
            Object.assign({}, shadow, { noUserSpaceOnUse: true }),
            i
          );
        }
        elSeries.add(renderedAreaPath);
      }
      s.forEach((sj, j) => {
        const markers = new Markers(this.w, this.ctx);
        const opts = markers.getMarkerConfig({
          cssClass: "apexcharts-marker",
          seriesIndex: i,
          dataPointIndex: j
        });
        const point = this.graphics.drawMarker(
          dataPointsPos[j].x,
          dataPointsPos[j].y,
          opts
        );
        point.attr("rel", j);
        point.attr("j", j);
        point.attr("index", i);
        point.node.setAttribute("default-marker-size", opts.pSize);
        const elPointsWrap = this.graphics.group({
          class: "apexcharts-series-markers"
        });
        if (elPointsWrap) {
          elPointsWrap.add(point);
        }
        elPointsMain.add(elPointsWrap);
        elSeries.add(elPointsMain);
        const dataLabelsConfig = w.config.dataLabels;
        if (dataLabelsConfig.enabled) {
          const text = dataLabelsConfig.formatter(w.seriesData.series[i][j], {
            seriesIndex: i,
            dataPointIndex: j,
            w
          });
          dataLabels.plotDataLabelsText({
            x: dataPointsPos[j].x,
            y: dataPointsPos[j].y,
            text,
            textAnchor: "middle",
            i,
            j: i,
            parent: elDataPointsMain,
            offsetCorrection: false,
            dataLabelsConfig: __spreadValues({}, dataLabelsConfig)
          });
        }
        elSeries.add(elDataPointsMain);
      });
      allSeries.push(elSeries);
    });
    this.drawPolygons({
      parent: ret
    });
    if (w.config.xaxis.labels.show) {
      const xaxisTexts = this.drawXAxisTexts();
      ret.add(xaxisTexts);
    }
    allSeries.forEach((elS) => {
      ret.add(elS);
    });
    ret.add(this.yaxisLabels);
    return ret;
  }
  /**
   * @param {Record<string, any>} opts
   */
  drawPolygons(opts) {
    const w = this.w;
    const { parent } = opts;
    const helpers = new CircularChartsHelpers(this.w);
    const yaxisTexts = w.globals.yAxisScale[0].result.reverse();
    const layers = yaxisTexts.length;
    const radiusSizes = [];
    const layerDis = this.size / (layers - 1);
    for (let i = 0; i < layers; i++) {
      radiusSizes[i] = layerDis * i;
    }
    radiusSizes.reverse();
    const polygonStrings = [];
    const lines = [];
    radiusSizes.forEach((radiusSize, r) => {
      const polygon = Utils.getPolygonPos(radiusSize, this.dataPointsLen);
      let string = "";
      polygon.forEach((p, i) => {
        if (r === 0) {
          const line = this.graphics.drawLine(
            p.x,
            p.y,
            0,
            0,
            Array.isArray(this.polygons.connectorColors) ? this.polygons.connectorColors[i] : this.polygons.connectorColors
          );
          lines.push(line);
        }
        if (i === 0) {
          this.yaxisLabelsTextsPos.push({
            x: p.x,
            y: p.y
          });
        }
        string += p.x + "," + p.y + " ";
      });
      polygonStrings.push(string);
    });
    polygonStrings.forEach((p, i) => {
      const strokeColors = this.polygons.strokeColors;
      const strokeWidth = this.polygons.strokeWidth;
      const polygon = this.graphics.drawPolygon(
        p,
        Array.isArray(strokeColors) ? strokeColors[i] : strokeColors,
        Array.isArray(strokeWidth) ? strokeWidth[i] : strokeWidth,
        w.globals.radarPolygons.fill.colors[i]
      );
      parent.add(polygon);
    });
    lines.forEach((l) => {
      parent.add(l);
    });
    if (w.config.yaxis[0].show) {
      this.yaxisLabelsTextsPos.forEach(
        (p, i) => {
          const yText = helpers.drawYAxisTexts(p.x, p.y, i, yaxisTexts[i]);
          this.yaxisLabels.add(yText);
        }
      );
    }
  }
  drawXAxisTexts() {
    const w = this.w;
    const xaxisLabelsConfig = w.config.xaxis.labels;
    const elXAxisWrap = this.graphics.group({
      class: "apexcharts-xaxis"
    });
    const polygonPos = Utils.getPolygonPos(this.size, this.dataPointsLen);
    w.labelData.labels.forEach((label, i) => {
      const formatter = w.config.xaxis.labels.formatter;
      const dataLabels = new DataLabels(this.w, this.ctx);
      if (polygonPos[i]) {
        const textPos = this.getTextPos(polygonPos[i], this.size);
        const text = formatter(label, {
          seriesIndex: -1,
          dataPointIndex: i,
          w
        });
        const dataLabelText = dataLabels.plotDataLabelsText({
          x: textPos.newX,
          y: textPos.newY,
          text,
          textAnchor: textPos.textAnchor,
          i,
          j: i,
          parent: elXAxisWrap,
          className: "apexcharts-xaxis-label",
          color: Array.isArray(xaxisLabelsConfig.style.colors) && xaxisLabelsConfig.style.colors[i] ? xaxisLabelsConfig.style.colors[i] : "#a8a8a8",
          dataLabelsConfig: __spreadValues({
            textAnchor: textPos.textAnchor,
            dropShadow: { enabled: false }
          }, xaxisLabelsConfig),
          offsetCorrection: false
        });
        dataLabelText.on("click", (e) => {
          if (typeof w.config.chart.events.xAxisLabelClick === "function") {
            const opts = Object.assign({}, w, {
              labelIndex: i
            });
            w.config.chart.events.xAxisLabelClick(e, this.ctx, opts);
          }
        });
      }
    });
    return elXAxisWrap;
  }
  /**
   * @param {Array<Record<string, any>>} pos
   * @param {Record<string, any>} origin
   */
  createPaths(pos, origin) {
    const linePathsTo = [];
    let linePathsFrom = [];
    const areaPathsTo = [];
    let areaPathsFrom = [];
    if (pos.length) {
      linePathsFrom = [this.graphics.move(origin.x, origin.y)];
      areaPathsFrom = [this.graphics.move(origin.x, origin.y)];
      let linePathTo = this.graphics.move(pos[0].x, pos[0].y);
      let areaPathTo = this.graphics.move(pos[0].x, pos[0].y);
      pos.forEach((p, i) => {
        linePathTo += this.graphics.line(p.x, p.y);
        areaPathTo += this.graphics.line(p.x, p.y);
        if (i === pos.length - 1) {
          linePathTo += "Z";
          areaPathTo += "Z";
        }
      });
      linePathsTo.push(linePathTo);
      areaPathsTo.push(areaPathTo);
    }
    return {
      linePathsFrom,
      linePathsTo,
      areaPathsFrom,
      areaPathsTo
    };
  }
  /**
   * @param {Record<string, any>} pos
   * @param {number} polygonSize
   */
  getTextPos(pos, polygonSize) {
    const limit = 10;
    let textAnchor = "middle";
    let newX = pos.x;
    let newY = pos.y;
    if (Math.abs(pos.x) >= limit) {
      if (pos.x > 0) {
        textAnchor = "start";
        newX += 10;
      } else if (pos.x < 0) {
        textAnchor = "end";
        newX -= 10;
      }
    } else {
      textAnchor = "middle";
    }
    if (Math.abs(pos.y) >= polygonSize - limit) {
      if (pos.y < 0) {
        newY -= 10;
      } else if (pos.y > 0) {
        newY += 10;
      }
    }
    return {
      textAnchor,
      newX,
      newY
    };
  }
  /**
   * @param {number} realIndex
   */
  getPreviousPath(realIndex) {
    const w = this.w;
    let pathFrom = null;
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp];
      if (gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(String(realIndex), 10)) {
        if (typeof w.globals.previousPaths[pp].paths[0] !== "undefined") {
          pathFrom = w.globals.previousPaths[pp].paths[0].d;
        }
      }
    }
    return pathFrom;
  }
  /**
   * @param {any[]} dataRadiusArr
   * @param {any[]} angleArr
   */
  getDataPointsPos(dataRadiusArr, angleArr, dataPointsLen = this.dataPointsLen) {
    dataRadiusArr = dataRadiusArr || [];
    angleArr = angleArr || [];
    const dataPointsPosArray = [];
    for (let j = 0; j < dataPointsLen; j++) {
      const curPointPos = {};
      curPointPos.x = dataRadiusArr[j] * Math.sin(angleArr[j]);
      curPointPos.y = -dataRadiusArr[j] * Math.cos(angleArr[j]);
      dataPointsPosArray.push(curPointPos);
    }
    return dataPointsPosArray;
  }
}
_core__default.use({
  radar: Radar
});
export {
  default2 as default
};
