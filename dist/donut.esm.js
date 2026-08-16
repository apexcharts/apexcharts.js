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
 * ApexCharts v6.9.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Animations = _core.__apex_Animations;
const Fill = _core.__apex_Fill;
const Utils = _core.__apex_Utils;
const Graphics = _core.__apex_Graphics;
const Filters = _core.__apex_Filters;
const Scales = _core.__apex_Scales;
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
  /**
   * Widest rendered width among the given label strings. Used to reserve
   * horizontal room for outer (name) labels so the pie can shrink to fit them.
   * @param {string[]} labels
   * @param {{ fontSize?: string, fontFamily?: string }} style
   * @returns {number}
   */
  getMaxLabelWidth(labels, { fontSize, fontFamily } = {}) {
    const graphics = new Graphics(this.w);
    let maxWidth = 0;
    labels.forEach((text) => {
      if (text === null || typeof text === "undefined" || text === "") return;
      const rect = graphics.getTextRects(
        `${text}`,
        fontSize || "12px",
        fontFamily,
        ""
      );
      maxWidth = Math.max(maxWidth, rect.width);
    });
    return maxWidth;
  }
  /**
   * Draw a single outer (name) label: an optional leader line from the slice
   * edge (anchor -> radial elbow -> label) plus the name text (one or more
   * lines, e.g. name + percent). Geometry is computed by the caller (Pie.js)
   * so it can run a de-overlap pass first. The text block is vertically
   * centered on `labelY`, which is where the connector terminates.
   * @param {{
   *   lines: string[],
   *   lineHeight: number,
   *   anchor: { x: number, y: number },
   *   elbow: { x: number, y: number },
   *   labelX: number,
   *   labelY: number,
   *   side: 'left' | 'right',
   *   connector: { show: boolean, width: number, color: string },
   *   style: { fontSize?: string, fontFamily?: string, fontWeight?: string | number },
   *   foreColor: string,
   * }} opts
   */
  drawExternalLabel({
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
  }) {
    const graphics = new Graphics(this.w);
    const group = graphics.group({
      class: "apexcharts-pie-name-label-group"
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
      line.node.classList.add("apexcharts-pie-label-connector");
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
      cssClass: "apexcharts-pie-name-label"
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
}
const Environment = _core.__apex_Environment_Environment;
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
function arcPoint(cx, cy, radius, deg) {
  return {
    x: cx + radius * Math.cos((deg - 90) * D2R),
    y: cy + radius * Math.sin((deg - 90) * D2R)
  };
}
const xy = (p) => `${p.x} ${p.y}`;
function roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const degOut = r / rOut * R2D;
  const degIn = r / rIn * R2D;
  const oStart = ptAt(rOut, a0 + degOut);
  const oEnd = ptAt(rOut, a1 - degOut);
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0;
  const ocEnd = ptAt(rOut, a1);
  const rEndOut = ptAt(rOut - r, a1);
  const ocStart = ptAt(rOut, a0);
  const rStartOut = ptAt(rOut - r, a0);
  const iEnd = ptAt(rIn, a1 - degIn);
  const iStart = ptAt(rIn, a0 + degIn);
  const largeIn = spanDeg - 2 * degIn > 180 ? 1 : 0;
  const icEnd = ptAt(rIn, a1);
  const rEndIn = ptAt(rIn + r, a1);
  const icStart = ptAt(rIn, a0);
  const rStartIn = ptAt(rIn + r, a0);
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
function roundedPieSegmentPath({ cx, cy, rOut, a0, a1, r, spanDeg }) {
  const ptAt = (radius, deg) => arcPoint(cx, cy, radius, deg);
  const degOut = r / rOut * R2D;
  const oStart = ptAt(rOut, a0 + degOut);
  const oEnd = ptAt(rOut, a1 - degOut);
  const largeOut = spanDeg - 2 * degOut > 180 ? 1 : 0;
  const ocEnd = ptAt(rOut, a1);
  const rEndOut = ptAt(rOut - r, a1);
  const ocStart = ptAt(rOut, a0);
  const rStartOut = ptAt(rOut - r, a0);
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
    `${cx} ${cy}`,
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
  const A = ptAt(rOut, a0);
  const B = ptAt(rOut, a1);
  const C = ptAt(rIn, a1);
  const Din = ptAt(rIn, a0);
  return [
    "M",
    xy(A),
    "A",
    rOut,
    rOut,
    0,
    largeArc,
    1,
    xy(B),
    "L",
    xy(C),
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
const SLICE_OFFSET_TRANSITION = "transform 320ms cubic-bezier(0.25, 0.8, 0.3, 1)";
const HOVER_OUTLINE_TRANSITION = "opacity 180ms ease-out";
class Pie {
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
    this.animBeginArr = [0];
    this.animDur = 0;
    this.donutDataLabels = this.w.config.plotOptions.pie.donut.labels;
    this.lineColorArr = w.globals.stroke.colors !== void 0 ? w.globals.stroke.colors : w.globals.colors;
    this.defaultSize = Math.min(w.layout.gridWidth, w.layout.gridHeight);
    this.centerY = this.defaultSize / 2;
    this.centerX = w.layout.gridWidth / 2;
    if (w.config.chart.type === "radialBar") {
      this.fullAngle = 360;
    } else {
      this.fullAngle = Math.abs(
        w.config.plotOptions.pie.endAngle - w.config.plotOptions.pie.startAngle
      );
    }
    this.initialAngle = w.config.plotOptions.pie.startAngle % this.fullAngle;
    w.globals.radialSize = this.defaultSize / 2.05 - w.config.stroke.width - (!w.config.chart.sparkline.enabled ? w.config.chart.dropShadow.blur : 0);
    this.externalCfg = w.config.plotOptions.pie.dataLabels.external;
    const dlStyle = w.config.dataLabels.style;
    this.externalLabelStyle = {
      fontSize: this.externalCfg.fontSize || dlStyle.fontSize,
      fontFamily: this.externalCfg.fontFamily || dlStyle.fontFamily,
      fontWeight: this.externalCfg.fontWeight || dlStyle.fontWeight
    };
    this.externalLabels = [];
    this.externalLabelMaxLines = 1;
    this.externalLabelLineH = parseFloat(this.externalLabelStyle.fontSize) || 12;
    w.globals.pieExternalLabelMarginY = 0;
    this.showExternalLabels = this.externalCfg.show && this.chartType !== "polarArea";
    if (this.showExternalLabels && !w.globals.noData) {
      this.reserveExternalLabelSpace();
    }
    this.donutSize = w.globals.radialSize * parseInt(w.config.plotOptions.pie.donut.size, 10) / 100;
    const scaleSize = w.config.plotOptions.pie.customScale;
    const halfW = w.layout.gridWidth / 2;
    const halfH = w.layout.gridHeight / 2;
    this.translateX = halfW - halfW * scaleSize;
    this.translateY = halfH - halfH * scaleSize;
    this.dataLabelsGroup = new Graphics(this.w).group({
      class: "apexcharts-datalabels-group",
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${scaleSize})`
    });
    this.maxY = 0;
    this.sliceLabels = [];
    this.sliceSizes = [];
    this.prevSliceSizes = [];
    this.sliceLabelGroups = {};
    this.externalLabelGroups = {};
    this.elHoverOutline = null;
    this.elHoverOutlinePath = null;
    this.hoverOutlineIndex = -1;
    this.prevSectorAngleArr = [];
  }
  /**
   * The text shown in an outer (name) label for slice `i`. Applies the
   * user `name.formatter` if provided, otherwise the raw series name. The
   * formatter may return a string or an array of strings (one per line, e.g.
   * `[name, percent]`); normalize via `getExternalLabelLines`.
   * @param {number} i
   * @returns {string | string[]}
   */
  getExternalLabelText(i) {
    var _a, _b, _c;
    const w = this.w;
    const name = w.seriesData.seriesNames[i];
    const fn = this.externalCfg.formatter;
    if (typeof fn === "function") {
      return fn(name, {
        seriesIndex: i,
        percent: (_b = (_a = w.globals.seriesPercent) == null ? void 0 : _a[i]) == null ? void 0 : _b[0],
        value: (_c = w.globals.seriesTotals) == null ? void 0 : _c[i],
        w
      });
    }
    return name == null ? "" : `${name}`;
  }
  /**
   * Outer label content for slice `i` normalized to an array of line strings.
   * Supports a formatter returning an array, or a string with `\n` separators.
   * @param {number} i
   * @returns {string[]}
   */
  getExternalLabelLines(i) {
    const raw = this.getExternalLabelText(i);
    const arr = Array.isArray(raw) ? raw : `${raw == null ? "" : raw}`.split("\n");
    return arr.map((l) => l == null ? "" : `${l}`);
  }
  /**
   * Shrink the pie radius (and reposition its center) so outer name labels and
   * their connector lines fit inside the chart area without clipping. Stores
   * the reserved vertical band on `w.globals.pieExternalLabelMarginY` so
   * Core.resizeNonAxisCharts can grow the SVG height to match.
   */
  reserveExternalLabelSpace() {
    const w = this.w;
    const helpers = new CircularChartsHelpers(w);
    const lineSets = (w.seriesData.seriesNames || []).map(
      (_, i) => this.getExternalLabelLines(i)
    );
    const maxLabelWidth = helpers.getMaxLabelWidth(lineSets.flat(), {
      fontSize: this.externalLabelStyle.fontSize,
      fontFamily: this.externalLabelStyle.fontFamily
    });
    this.externalLabelMaxLines = lineSets.reduce((m, s) => Math.max(m, s.length), 1);
    this.externalLabelLineH = Math.round(
      (parseFloat(this.externalLabelStyle.fontSize) || 12) * 1.35
    );
    const cn = this.externalCfg.connector;
    const blockHeight = this.externalLabelMaxLines * this.externalLabelLineH;
    const mh = maxLabelWidth + (cn.length || 0) + (cn.gap || 0) + 12;
    const mv = blockHeight / 2 + (cn.gap || 0) + 6;
    const fitted = Math.min(
      w.globals.radialSize,
      w.layout.gridWidth / 2 - mh,
      w.layout.gridHeight / 2 - mv
    );
    w.globals.radialSize = Math.max(fitted, this.defaultSize * 0.15);
    w.globals.pieExternalLabelMarginY = mv;
    const heightStr = w.config.chart.height ? String(w.config.chart.height) : "";
    const userSetFixedHeight = heightStr !== "" && heightStr !== "auto";
    this.centerY = userSetFixedHeight ? w.layout.gridHeight / 2 : w.globals.radialSize + mv;
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a;
    const self = this;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const elPie = graphics.group({
      class: "apexcharts-pie"
    });
    if (w.globals.noData) return elPie;
    let total = 0;
    for (let k = 0; k < series.length; k++) {
      total += Utils.negToZero(series[k]);
    }
    const sectorAngleArr = [];
    const elSeries = graphics.group();
    if (total === 0) {
      total = 1e-5;
    }
    series.forEach((m) => {
      this.maxY = Math.max(this.maxY, m);
    });
    if (w.config.yaxis[0].max) {
      this.maxY = w.config.yaxis[0].max;
    }
    if (w.config.grid.position === "back" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    const collapsedIdx = w.globals.collapsedSeriesIndices || [];
    let polarVisible = 1;
    if (this.chartType === "polarArea") {
      let visible = 0;
      for (let k = 0; k < series.length; k++) {
        if (collapsedIdx.indexOf(k) === -1) visible++;
      }
      polarVisible = Math.max(1, visible);
    }
    for (let i = 0; i < series.length; i++) {
      const angle = this.fullAngle * Utils.negToZero(series[i]) / total;
      sectorAngleArr.push(angle);
      if (this.chartType === "polarArea") {
        sectorAngleArr[i] = collapsedIdx.indexOf(i) > -1 ? 0 : this.fullAngle / polarVisible;
        this.sliceSizes.push(
          w.globals.radialSize * series[i] / (this.maxY || 1)
        );
      } else {
        this.sliceSizes.push(w.globals.radialSize);
      }
    }
    const morphActive = ((_a = this.ctx.morphTypeChange) == null ? void 0 : _a.isActive()) === true;
    if (w.globals.dataChanged && !morphActive) {
      if (this.chartType === "polarArea") {
        const prevValues = w.globals.previousPaths;
        const stash = w.globals.prevPolarAngles;
        if (Array.isArray(stash) && stash.length === prevValues.length) {
          this.prevSectorAngleArr = stash.slice();
        } else {
          for (let i = 0; i < prevValues.length; i++) {
            this.prevSectorAngleArr.push(
              this.fullAngle / Math.max(1, prevValues.length)
            );
          }
        }
        let prevMaxY = 0;
        for (let k = 0; k < prevValues.length; k++) {
          prevMaxY = Math.max(prevMaxY, Utils.negToZero(prevValues[k]));
        }
        if (w.config.yaxis[0].max) {
          prevMaxY = w.config.yaxis[0].max;
        }
        this.prevSliceSizes = prevValues.map(
          (v) => w.globals.radialSize * Utils.negToZero(v) / (prevMaxY || 1)
        );
      } else {
        let prevTotal = 0;
        for (let k = 0; k < w.globals.previousPaths.length; k++) {
          prevTotal += Utils.negToZero(w.globals.previousPaths[k]);
        }
        let previousAngle;
        for (let i = 0; i < w.globals.previousPaths.length; i++) {
          previousAngle = this.fullAngle * Utils.negToZero(w.globals.previousPaths[i]) / prevTotal;
          this.prevSectorAngleArr.push(previousAngle);
        }
      }
    }
    if (this.chartType === "polarArea") {
      w.globals.prevPolarAngles = sectorAngleArr.slice();
    }
    if (this.donutSize < 0) {
      this.donutSize = 0;
    }
    if (this.chartType === "donut") {
      const circle = graphics.drawCircle(this.donutSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: w.config.plotOptions.pie.donut.background ? w.config.plotOptions.pie.donut.background : "transparent"
      });
      elSeries.add(circle);
    }
    const elG = self.drawArcs(sectorAngleArr, series);
    this.sliceLabels.forEach((s) => {
      elG.add(s);
    });
    elSeries.attr({
      transform: `translate(${this.translateX}, ${this.translateY}) scale(${w.config.plotOptions.pie.customScale})`
    });
    elSeries.add(elG);
    elPie.add(elSeries);
    if (this.donutDataLabels.show) {
      const shouldFadeInLabels = this.initialAnim && !w.globals.resized && !w.globals.dataChanged && this.animDur > 0;
      const dataLabels = this.renderInnerDataLabels(
        this.dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: shouldFadeInLabels ? 0 : this.donutDataLabels.show
        }
      );
      if (shouldFadeInLabels) {
        const labelsNode = this.dataLabelsGroup.node;
        labelsNode.style.transition = "opacity 280ms ease-out";
        setTimeout(() => {
          labelsNode.style.opacity = "1";
        }, this.animDur);
      }
      elPie.add(dataLabels);
    }
    if (w.config.grid.position === "front" && this.chartType === "polarArea") {
      this.drawPolarElements(elPie);
    }
    return elPie;
  }
  // core function for drawing pie arcs
  /**
   * @param {any[]} sectorAngleArr
   * @param {any[]} series
   */
  drawArcs(sectorAngleArr, series) {
    var _a, _b, _c, _d, _e;
    const w = this.w;
    const filters = new Filters(this.w);
    const graphics = new Graphics(this.w);
    const fill = new Fill(this.w);
    const g = graphics.group({
      class: "apexcharts-slices"
    });
    this.elHoverOutline = graphics.group({
      class: "apexcharts-pie-hover-outline"
    });
    this.elHoverOutline.node.style.pointerEvents = "none";
    this.elHoverOutline.node.style.opacity = "0";
    if (w.config.chart.animations.enabled) {
      this.elHoverOutline.node.style.transition = HOVER_OUTLINE_TRANSITION;
    }
    g.add(this.elHoverOutline);
    let startAngle = this.initialAngle;
    let prevStartAngle = this.initialAngle;
    let endAngle = this.initialAngle;
    let prevEndAngle = this.initialAngle;
    this.strokeWidth = w.config.stroke.show ? w.config.stroke.width : 0;
    const morphActive = ((_a = this.ctx.morphTypeChange) == null ? void 0 : _a.isActive()) === true;
    for (let i = 0; i < sectorAngleArr.length; i++) {
      const elPieArc = graphics.group({
        class: `apexcharts-series apexcharts-pie-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      g.add(elPieArc);
      startAngle = endAngle;
      prevStartAngle = prevEndAngle;
      endAngle = startAngle + sectorAngleArr[i];
      prevEndAngle = prevStartAngle + this.prevSectorAngleArr[i];
      const angle = endAngle < startAngle ? this.fullAngle + endAngle - startAngle : endAngle - startAngle;
      const pathFill = fill.fillPath({
        seriesNumber: i,
        size: this.sliceSizes[i],
        value: series[i]
      });
      const morphFrom = morphActive ? this.ctx.morphTypeChange.getInitialPathFor(i, 0) : null;
      const prevSize = this.chartType === "polarArea" && w.globals.dataChanged && !morphActive ? this.prevSliceSizes[i] || 0 : void 0;
      const path = morphFrom || this.getChangedPath(prevStartAngle, prevEndAngle, prevSize);
      const elPath = graphics.drawPath({
        d: path,
        // Pie/donut/polarArea data is a single series, so a user-supplied
        // `stroke.colors` shorter than the slice count is NOT padded by the
        // theme engine (unlike fill colors, which cycle). Without this, only
        // slice 0 gets the requested color and the rest fall back to a grey
        // default. Cycle the array — matching fill-color behaviour — so a
        // single `stroke.colors: ['#fff']` borders every slice as expected.
        stroke: Array.isArray(this.lineColorArr) ? (_b = this.lineColorArr[i]) != null ? _b : this.lineColorArr[i % this.lineColorArr.length] : this.lineColorArr,
        strokeWidth: 0,
        fill: pathFill,
        fillOpacity: w.config.fill.opacity,
        classes: `apexcharts-pie-area apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
      });
      elPath.attr({
        index: 0,
        j: i
      });
      filters.setSelectionFilter(elPath, 0, i);
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        filters.dropShadow(elPath, shadow, i);
      }
      this.addListeners(elPath, this.donutDataLabels, i);
      let labelPosition = {
        x: 0,
        y: 0
      };
      const midAngle = (startAngle + angle / 2) % this.fullAngle;
      let arcCenter = { x: this.centerX, y: this.centerY };
      if (this.chartType === "pie" || this.chartType === "polarArea") {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 1.25 + w.config.plotOptions.pie.dataLabels.offset,
          midAngle
        );
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize / 2,
          midAngle
        );
      } else if (this.chartType === "donut") {
        labelPosition = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2 + w.config.plotOptions.pie.dataLabels.offset,
          midAngle
        );
        arcCenter = Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          (w.globals.radialSize + this.donutSize) / 2,
          midAngle
        );
      }
      Graphics.setAttrs(elPath.node, {
        "data:angle": angle,
        "data:startAngle": startAngle,
        "data:strokeWidth": this.strokeWidth,
        "data:value": series[i],
        "data:cx": arcCenter.x,
        "data:cy": arcCenter.y
      });
      elPieArc.add(elPath);
      let pieceClaimed = false;
      if (morphActive) {
        const finalD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: this.sliceSizes[i]
        });
        elPath.node.setAttribute("data:pathFinal", finalD);
        pieceClaimed = ((_d = (_c = this.ctx.morphTypeChange).claimsTargetMark) == null ? void 0 : _d.call(_c, i, 0)) === true;
        if (pieceClaimed) {
          elPath.attr({ d: finalD });
          elPath.node.setAttribute("data:pathOrig", finalD);
          elPath.node.setAttribute("opacity", "0");
          elPath.node.setAttribute("data-piece-hidden", "1");
        }
      }
      let dur = 0;
      if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged) {
        dur = angle / this.fullAngle * w.config.chart.animations.speed;
        if (dur === 0) dur = 1;
        this.animDur = dur + this.animDur;
        this.animBeginArr.push(this.animDur);
      } else {
        this.animBeginArr.push(0);
      }
      if (pieceClaimed) ;
      else if (morphActive && morphFrom) {
        const targetD = this.getPiePath({
          me: this,
          startAngle,
          angle,
          size: this.sliceSizes[i]
        });
        const morphSpeed = this.ctx.morphTypeChange.getSpeed();
        const animations = this.ctx.animations;
        elPath.node.setAttribute("data:pathOrig", targetD);
        const morphRunner = elPath.animate(morphSpeed).plot(targetD, "polygons").attr({ "stroke-width": this.strokeWidth });
        if (morphRunner && typeof morphRunner.after === "function") {
          morphRunner.after(() => animations.animationCompleted(elPath));
        } else {
          animations.animationCompleted(elPath);
        }
      } else if (this.dynamicAnim && w.globals.dataChanged) {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          prevSize,
          endAngle,
          startAngle,
          prevStartAngle,
          prevEndAngle,
          animateStartingPos: true,
          i,
          animBeginArr: this.animBeginArr,
          shouldSetPrevPaths: true,
          dur: w.config.chart.animations.dynamicAnimation.speed
        });
      } else {
        this.animatePaths(elPath, {
          size: this.sliceSizes[i],
          endAngle,
          startAngle,
          i,
          totalItems: sectorAngleArr.length - 1,
          animBeginArr: this.animBeginArr,
          dur
        });
      }
      if (this.getExpandOffset() > 0) {
        elPath.node.addEventListener("mouseup", this.pieClicked.bind(this, i));
      } else if (i === 0 && Filters.drilldownBlocksSliceOffset(w)) {
        (_e = this.ctx.drilldown) == null ? void 0 : _e.warnSliceOffsetDisabled();
      }
      if (typeof w.interact.selectedDataPoints[0] !== "undefined" && w.interact.selectedDataPoints[0].indexOf(i) > -1) {
        if (this.initialAnim && !w.globals.resized && !w.globals.dataChanged && this.animDur > 0) {
          const _this = this;
          const _i = i;
          setTimeout(() => _this.pieClicked(_i, { animate: false }), this.animDur);
        } else {
          this.pieClicked(i, { animate: false });
        }
      }
      if (w.config.dataLabels.enabled) {
        const xPos = labelPosition.x;
        const yPos = labelPosition.y;
        let text = 100 * angle / this.fullAngle + "%";
        if (angle !== 0 && w.config.plotOptions.pie.dataLabels.minAngleToShowLabel < sectorAngleArr[i]) {
          const formatter = w.config.dataLabels.formatter;
          if (formatter !== void 0) {
            text = formatter(w.globals.seriesPercent[i][0], {
              seriesIndex: i,
              w
            });
          }
          const foreColor = w.globals.dataLabels.style.colors[i];
          const elPieLabelWrap = graphics.group({
            class: `apexcharts-datalabels`
          });
          const elPieLabel = graphics.drawText({
            x: xPos,
            y: yPos,
            text,
            textAnchor: "middle",
            fontSize: w.config.dataLabels.style.fontSize,
            fontFamily: w.config.dataLabels.style.fontFamily,
            fontWeight: w.config.dataLabels.style.fontWeight,
            foreColor
          });
          elPieLabelWrap.add(elPieLabel);
          if (w.config.dataLabels.dropShadow.enabled) {
            const textShadow = w.config.dataLabels.dropShadow;
            filters.dropShadow(elPieLabel, textShadow);
          }
          elPieLabel.node.classList.add("apexcharts-pie-label");
          if (w.config.chart.animations.animate && w.globals.resized === false) {
            elPieLabel.node.classList.add("apexcharts-pie-label-delay");
            elPieLabel.node.style.animationDelay = w.config.chart.animations.speed / 940 + "s";
          }
          this.sliceLabels.push(elPieLabelWrap);
          this.sliceLabelGroups[i] = elPieLabelWrap.node;
        }
      }
      if (this.showExternalLabels && angle !== 0) {
        const lines = this.getExternalLabelLines(i);
        if (lines.some((l) => l !== "")) {
          const anchor = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w.globals.radialSize,
            midAngle
          );
          const elbow = Utils.polarToCartesian(
            this.centerX,
            this.centerY,
            w.globals.radialSize + (this.externalCfg.connector.gap || 0),
            midAngle
          );
          const isRight = elbow.x >= this.centerX;
          const baseLabelX = isRight ? elbow.x + (this.externalCfg.connector.length || 0) : elbow.x - (this.externalCfg.connector.length || 0);
          this.externalLabels.push({
            i,
            lines,
            anchor,
            elbow,
            side: isRight ? "right" : "left",
            labelX: baseLabelX + parseFloat(this.externalCfg.offsetX || 0),
            idealY: elbow.y + parseFloat(this.externalCfg.offsetY || 0),
            connectorColor: this.externalCfg.connector.color || w.globals.colors[i],
            foreColor: this.externalCfg.color || w.config.chart.foreColor
          });
        }
      }
    }
    if (this.showExternalLabels && this.externalLabels.length) {
      this.placeExternalLabels();
      const revealOnAnimEnd = Environment.isBrowser() && (morphActive || this.dynamicAnim && w.globals.dataChanged || this.initialAnim && !w.globals.resized && !w.globals.dataChanged);
      this.externalLabels.forEach((lbl) => {
        const group = new CircularChartsHelpers(w).drawExternalLabel({
          lines: lbl.lines,
          lineHeight: this.externalLabelLineH,
          anchor: lbl.anchor,
          elbow: lbl.elbow,
          labelX: lbl.labelX,
          labelY: lbl.labelY,
          side: lbl.side,
          connector: {
            show: this.externalCfg.connector.show,
            width: this.externalCfg.connector.width,
            color: lbl.connectorColor
          },
          style: this.externalLabelStyle,
          foreColor: lbl.foreColor
        });
        if (revealOnAnimEnd) {
          group.node.classList.add("apexcharts-element-hidden");
          w.globals.delayedElements.push({ el: group.node });
        }
        this.externalLabelGroups[lbl.i] = group.node;
        g.add(group);
      });
    }
    return g;
  }
  /**
   * Vertical de-overlap for outer (name) labels: per side, sort by ideal y and
   * push neighbours apart so they keep at least one line-height of spacing.
   * Mutates each entry's `labelY`. Connector lines re-route to the moved y.
   */
  placeExternalLabels() {
    const w = this.w;
    const lineHeight = this.externalLabelMaxLines * this.externalLabelLineH + 2;
    const maxY = this.centerY + w.globals.radialSize + w.globals.pieExternalLabelMarginY;
    ["left", "right"].forEach((side) => {
      const items = this.externalLabels.filter((l) => l.side === side).sort((a, b) => a.idealY - b.idealY);
      items.forEach((l) => {
        l.labelY = l.idealY;
      });
      for (let k = 1; k < items.length; k++) {
        if (items[k].labelY - items[k - 1].labelY < lineHeight) {
          items[k].labelY = items[k - 1].labelY + lineHeight;
        }
      }
      const last = items[items.length - 1];
      const overflow = last ? last.labelY - maxY : 0;
      if (overflow > 0) {
        for (let k = items.length - 1; k >= 0; k--) {
          items[k].labelY -= overflow;
          if (k < items.length - 1 && items[k + 1].labelY - items[k].labelY < lineHeight) {
            items[k].labelY = items[k + 1].labelY - lineHeight;
          }
        }
      }
    });
  }
  /**
   * @param {any} elPath
   * @param {Record<string, any>} dataLabels
   * @param {number} [i] slice index, for the hover outline band
   */
  addListeners(elPath, dataLabels, i) {
    const graphics = new Graphics(this.w, this.ctx);
    elPath.node.addEventListener(
      "mouseenter",
      graphics.pathMouseEnter.bind(graphics, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      graphics.pathMouseLeave.bind(graphics, elPath)
    );
    elPath.node.addEventListener(
      "mouseleave",
      this.revertDataLabelsInner.bind(this)
    );
    if (typeof i === "number") {
      elPath.node.addEventListener(
        "mouseenter",
        this.showHoverOutline.bind(this, i)
      );
      elPath.node.addEventListener(
        "mouseleave",
        this.hideHoverOutline.bind(this)
      );
    }
    elPath.node.addEventListener(
      "mousedown",
      graphics.pathMouseDown.bind(graphics, elPath)
    );
    if (!this.donutDataLabels.total.showAlways) {
      elPath.node.addEventListener(
        "mouseenter",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
      elPath.node.addEventListener(
        "mousedown",
        this.printDataLabelsInner.bind(this, elPath.node, dataLabels)
      );
    }
  }
  // This function can be used for other circle charts too
  /**
   * @param {any} el
   * @param {Record<string, any>} opts
   */
  animatePaths(el, opts) {
    const w = this.w;
    const me = this;
    let angle = opts.endAngle < opts.startAngle ? this.fullAngle + opts.endAngle - opts.startAngle : opts.endAngle - opts.startAngle;
    let prevAngle = angle;
    let fromStartAngle = opts.startAngle;
    const toStartAngle = opts.startAngle;
    if (opts.prevStartAngle !== void 0 && opts.prevEndAngle !== void 0) {
      fromStartAngle = opts.prevEndAngle;
      prevAngle = opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle;
    }
    if (opts.i === w.config.series.length - 1) {
      if (angle + toStartAngle > this.fullAngle) {
        opts.endAngle = opts.endAngle - (angle + toStartAngle);
      } else if (angle + toStartAngle < this.fullAngle) {
        opts.endAngle = opts.endAngle + (this.fullAngle - (angle + toStartAngle));
      }
    }
    if (angle === this.fullAngle) angle = this.fullAngle - 0.01;
    me.animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts);
  }
  /**
   * @param {any} el
   * @param {number} fromStartAngle
   * @param {number} toStartAngle
   * @param {number} angle
   * @param {number} prevAngle
   * @param {Record<string, any>} opts
   */
  animateArc(el, fromStartAngle, toStartAngle, angle, prevAngle, opts) {
    const me = this;
    const w = this.w;
    const animations = new Animations(this.w);
    const size = opts.size;
    let path;
    if (isNaN(fromStartAngle) || isNaN(prevAngle)) {
      fromStartAngle = toStartAngle;
      prevAngle = angle;
      opts.dur = 0;
    }
    let currAngle = angle;
    let startAngle = toStartAngle;
    const fromAngle = fromStartAngle < toStartAngle ? this.fullAngle + fromStartAngle - toStartAngle : fromStartAngle - toStartAngle;
    const hasPrevSize = typeof opts.prevSize === "number";
    if (w.globals.dataChanged && opts.shouldSetPrevPaths) {
      if (opts.prevEndAngle) {
        path = me.getPiePath({
          me,
          startAngle: opts.prevStartAngle,
          angle: opts.prevEndAngle < opts.prevStartAngle ? this.fullAngle + opts.prevEndAngle - opts.prevStartAngle : opts.prevEndAngle - opts.prevStartAngle,
          size: hasPrevSize ? opts.prevSize : size
        });
        el.attr({ d: path });
      }
    }
    if (opts.dur !== 0) {
      el.animate(opts.dur, opts.animBeginArr[opts.i]).after(
        /** @this {any} */
        function() {
          if (me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea") {
            this.animate(
              w.config.chart.animations.dynamicAnimation.speed
            ).attr({
              "stroke-width": me.strokeWidth
            });
          }
          if (opts.i === w.config.series.length - 1) {
            animations.animationCompleted(el);
          }
        }
      ).during((pos) => {
        currAngle = fromAngle + (angle - fromAngle) * pos;
        if (opts.animateStartingPos) {
          currAngle = prevAngle + (angle - prevAngle) * pos;
          startAngle = fromStartAngle - prevAngle + (toStartAngle - (fromStartAngle - prevAngle)) * pos;
        }
        path = me.getPiePath({
          me,
          startAngle,
          angle: currAngle,
          size: hasPrevSize ? opts.prevSize + (size - opts.prevSize) * pos : size
        });
        el.node.setAttribute("data:pathOrig", path);
        el.attr({
          d: path
        });
      });
    } else {
      path = me.getPiePath({
        me,
        startAngle,
        angle,
        size
      });
      if (!opts.isTrack) {
        w.globals.animationEnded = true;
      }
      el.node.setAttribute("data:pathOrig", path);
      el.attr({
        d: path,
        "stroke-width": me.strokeWidth
      });
    }
  }
  /**
   * Toggle slice `i` in or out of the pie. Only one slice sits outside at a
   * time. Bound to `mouseup` on each slice, and also reached from the
   * `toggleDataPointSelection` API and from the pre-selected-slice pass in
   * drawArcs (which passes `animate: false` so the slice is already parked by
   * the time the first frame is painted).
   * @param {number} i
   * @param {{animate?: boolean}} [opts] a MouseEvent when called as a listener,
   *   which carries no `animate`, so real clicks animate
   */
  pieClicked(i, opts) {
    const w = this.w;
    const me = this;
    const animate = !(opts && opts.animate === false);
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${me.chartType.toLowerCase()}-slice-${i}`
    );
    if (!elPath) return;
    if (elPath.attr("data:pieClicked") === "true") {
      elPath.attr({
        "data:pieClicked": "false"
      });
      this.revertDataLabelsInner();
      this.offsetSlice(i, 0, animate);
      return;
    }
    const allEls = w.dom.baseEl.getElementsByClassName("apexcharts-pie-area");
    Array.prototype.forEach.call(allEls, (pieSlice) => {
      const wasOut = pieSlice.getAttribute("data:pieClicked") === "true";
      pieSlice.setAttribute("data:pieClicked", "false");
      if (wasOut) {
        this.offsetSlice(parseInt(pieSlice.getAttribute("j"), 10), 0, animate);
      }
    });
    w.interact.capturedDataPointIndex = i;
    elPath.attr("data:pieClicked", "true");
    this.offsetSlice(i, this.getExpandOffset(), animate);
  }
  /**
   * How far a clicked slice slides out, in px. 0 when the pull-out is off, when
   * drilldown owns the click, and always for polarArea: there the radius
   * encodes the value, so moving a slice outward would read as a bigger number.
   * @returns {number}
   */
  getExpandOffset() {
    const pie = this.w.config.plotOptions.pie;
    if (!pie.expandOnClick || this.chartType === "polarArea") return 0;
    if (Filters.drilldownBlocksSliceOffset(this.w)) return 0;
    const offset = Number(pie.expandOffset);
    return Number.isFinite(offset) && offset > 0 ? offset : 0;
  }
  /**
   * Every node that has to travel with slice `i`: the slice path itself plus
   * its labels, which live in sibling groups so they paint above all slices.
   * @param {number} i
   * @returns {SVGElement[]}
   */
  getSliceMovers(i) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    return [
      elPath ? elPath.node : null,
      this.sliceLabelGroups[i],
      this.externalLabelGroups[i],
      // The hover band, when it is this slice's: clicking a slice you are
      // hovering has to take its outline along, or the band is left behind
      // sitting in the gap the slice just opened.
      this.hoverOutlineIndex === i && this.elHoverOutlinePath ? this.elHoverOutlinePath.node : null
    ].filter(Boolean);
  }
  /**
   * Slide slice `i` `dist` px out of the pie along its own mid-angle, or back
   * to its resting place when `dist` is 0.
   *
   * The slice is *translated*, never re-drawn: the arc keeps the exact radius
   * and span it had, so the pulled-out slice still encodes the same quantity
   * (growing the radius, as this used to, quietly inflates it) and a clean gap
   * opens between it and the rest of the pie.
   * @param {number} i
   * @param {number} dist
   * @param {boolean} [animate] false to park it instantly, with no transition
   */
  offsetSlice(i, dist, animate = true) {
    const w = this.w;
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    if (!elPath) return;
    const { dx, dy } = this.getSliceOffsetVector(i, dist);
    const transform = `translate(${dx} ${dy})`;
    const transition = animate && w.config.chart.animations.enabled ? SLICE_OFFSET_TRANSITION : "";
    this.getSliceMovers(i).forEach((node) => {
      node.style.transition = transition;
      node.setAttribute("transform", transform);
    });
  }
  /**
   * The px vector `dist` along slice `i`'s mid-angle. Zero for a slice that
   * fills the pie: there is no "outside" for it to move to, and sliding it
   * would just shift the whole chart sideways.
   * @param {number} i
   * @param {number} dist
   * @returns {{dx: number, dy: number}}
   */
  getSliceOffsetVector(i, dist) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    const angle = elPath ? parseFloat(elPath.attr("data:angle")) : NaN;
    if (!dist || !Number.isFinite(angle) || angle >= this.fullAngle) {
      return { dx: 0, dy: 0 };
    }
    const startAngle = parseFloat(elPath.attr("data:startAngle"));
    const midRad = Math.PI * (startAngle + angle / 2 - 90) / 180;
    return { dx: dist * Math.cos(midRad), dy: dist * Math.sin(midRad) };
  }
  /**
   * Fade in the hover outline: a translucent band traced just outside the rim
   * of slice `i`, in the slice's own colour. It replaces lightening the slice
   * (see Filters.hoverOutlineOwnsHoverState) so a hovered slice keeps the
   * colour the legend and the data labels claim it has.
   * @param {number} i
   */
  showHoverOutline(i) {
    const w = this.w;
    if (!Filters.hoverOutlineOwnsHoverState(w)) return;
    if (!this.elHoverOutline) return;
    const path = this.getHoverOutlinePath(i);
    if (!path) return;
    const cfg = w.config.plotOptions.pie.hoverOutline;
    const fill = cfg.color || w.globals.colors[i];
    if (!this.elHoverOutlinePath) {
      const graphics = new Graphics(w);
      this.elHoverOutlinePath = graphics.drawPath({
        d: path,
        fill,
        strokeWidth: 0,
        classes: "apexcharts-pie-hover-outline-band"
      });
      this.elHoverOutline.add(this.elHoverOutlinePath);
    }
    this.elHoverOutlinePath.attr({
      d: path,
      fill,
      "fill-opacity": cfg.opacity
    });
    const { dx, dy } = this.getSliceOffsetVector(
      i,
      this.isSliceOut(i) ? this.getExpandOffset() : 0
    );
    this.elHoverOutlinePath.node.style.transition = "";
    this.elHoverOutlinePath.node.setAttribute("transform", `translate(${dx} ${dy})`);
    this.hoverOutlineIndex = i;
    this.elHoverOutline.node.style.opacity = "1";
  }
  /** Fade the hover outline back out, leaving the band node in place. */
  hideHoverOutline() {
    if (this.elHoverOutline) {
      this.elHoverOutline.node.style.opacity = "0";
    }
  }
  /** @param {number} i @returns {boolean} */
  isSliceOut(i) {
    const elPath = this.w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    return !!elPath && elPath.attr("data:pieClicked") === "true";
  }
  /**
   * Band geometry for the hover outline of slice `i`: an annulus from the
   * slice rim (plus the stroke and the configured clearance) outward, over the
   * same angular extent the slice is actually drawn over, so it lines up with
   * both slice edges even with `spacing` insetting them. Rounded into a pill
   * when the band is thick enough for the fillets to fit.
   * @param {number} i
   * @returns {string | null}
   */
  getHoverOutlinePath(i) {
    const w = this.w;
    const cfg = w.config.plotOptions.pie.hoverOutline;
    const elPath = w.dom.Paper.findOne(
      `.apexcharts-${this.chartType.toLowerCase()}-slice-${i}`
    );
    if (!elPath) return null;
    const angle = parseFloat(elPath.attr("data:angle"));
    if (!Number.isFinite(angle) || angle <= 0) return null;
    const size = this.sliceSizes[i];
    const thickness = Number(cfg.size);
    if (!Number.isFinite(size) || !Number.isFinite(thickness) || thickness <= 0) {
      return null;
    }
    const { startDeg, spanDeg } = this.getSliceExtent({
      me: this,
      startAngle: parseFloat(elPath.attr("data:startAngle")),
      angle,
      size
    });
    if (!(spanDeg > 0)) return null;
    const rIn = size + (this.strokeWidth || 0) / 2 + (Number(cfg.gap) || 0);
    const rOut = rIn + thickness;
    const geo = {
      cx: this.centerX,
      cy: this.centerY,
      rIn,
      rOut,
      a0: startDeg,
      a1: startDeg + spanDeg,
      spanDeg
    };
    const r = Math.min(thickness / 2, spanDeg * Math.PI / 180 / 2 * rIn);
    return r > 0.5 ? roundedDonutSegmentPath(__spreadProps(__spreadValues({}, geo), { r })) : sharpDonutSegmentPath(geo);
  }
  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   */
  /**
   * @param {number} prevStartAngle
   * @param {number} prevEndAngle
   * @param {number} [prevSize] - polarArea passes its previous slice radius,
   *   so the pre-animation frame sits at the previous VALUE too, not just the
   *   previous angles.
   */
  getChangedPath(prevStartAngle, prevEndAngle, prevSize) {
    let path = "";
    if (this.dynamicAnim && this.w.globals.dataChanged) {
      path = this.getPiePath({
        me: this,
        startAngle: prevStartAngle,
        angle: prevEndAngle - prevStartAngle,
        // @ts-ignore — size is set dynamically during draw()
        size: typeof prevSize === "number" ? prevSize : this.size
      });
    }
    return path;
  }
  /**
   * The angular extent a slice is actually drawn over: the raw start / span
   * clamped so a full circle never overlaps itself, then inset by
   * `plotOptions.pie.spacing`. Shared by getPiePath and the hover outline, so
   * the band lines up with the slice edges instead of with the un-inset angles
   * cached on the path node.
   * @param {{me: any, startAngle: number, angle: number, size: number}} opts
   * @returns {{startDeg: number, spanDeg: number, endDeg: number}}
   */
  getSliceExtent({ me, startAngle, angle, size }) {
    const w = this.w;
    let startDeg = startAngle;
    let endDeg = angle + startAngle;
    if (Math.ceil(endDeg) >= this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle) {
      endDeg = this.fullAngle + this.w.config.plotOptions.pie.startAngle % this.fullAngle - 0.01;
    }
    let spanDeg = endDeg - startDeg;
    const isSliceType = me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea";
    const spacing = w.config.plotOptions.pie.spacing;
    if (isSliceType && spacing > 0 && spanDeg > 0) {
      const rRef = me.chartType === "donut" ? (size + me.donutSize) / 2 : size;
      const gapDeg = rRef > 0 ? spacing / rRef * (180 / Math.PI) : 0;
      const inset = Math.min(gapDeg / 2, Math.max(0, spanDeg / 2 - 0.5));
      startDeg += inset;
      spanDeg -= 2 * inset;
    }
    endDeg = startDeg + spanDeg;
    if (Math.ceil(endDeg) > this.fullAngle) endDeg -= this.fullAngle;
    return { startDeg, spanDeg, endDeg };
  }
  /** @param {{me: any, startAngle: any, angle: any, size: any}} opts */
  getPiePath({ me, startAngle, angle, size }) {
    let path;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const { startDeg, spanDeg, endDeg } = this.getSliceExtent({
      me,
      startAngle,
      angle,
      size
    });
    const isSliceType = me.chartType === "pie" || me.chartType === "donut" || me.chartType === "polarArea";
    const startRadians = Math.PI * (startDeg - 90) / 180;
    const borderRadius = w.config.plotOptions.pie.borderRadius;
    if (borderRadius > 0 && isSliceType) {
      const roundedPath = this.getRoundedSlicePath({
        me,
        startDeg,
        spanDeg,
        size,
        borderRadius
      });
      if (roundedPath) return roundedPath;
    }
    const endRadians = Math.PI * (endDeg - 90) / 180;
    const x1 = me.centerX + size * Math.cos(startRadians);
    const y1 = me.centerY + size * Math.sin(startRadians);
    const x2 = me.centerX + size * Math.cos(endRadians);
    const y2 = me.centerY + size * Math.sin(endRadians);
    const startInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      endDeg
    );
    const endInner = Utils.polarToCartesian(
      me.centerX,
      me.centerY,
      me.donutSize,
      startDeg
    );
    const largeArc = spanDeg > 180 ? 1 : 0;
    const pathBeginning = ["M", x1, y1, "A", size, size, 0, largeArc, 1, x2, y2];
    if (me.chartType === "donut") {
      path = [
        ...pathBeginning,
        "L",
        startInner.x,
        startInner.y,
        "A",
        me.donutSize,
        me.donutSize,
        0,
        largeArc,
        0,
        endInner.x,
        endInner.y,
        "L",
        x1,
        y1,
        "z"
      ].join(" ");
    } else if (me.chartType === "pie" || me.chartType === "polarArea") {
      path = [...pathBeginning, "L", me.centerX, me.centerY, "L", x1, y1].join(
        " "
      );
    } else {
      path = [...pathBeginning].join(" ");
    }
    return graphics.roundPathCorners(path, this.strokeWidth * 2);
  }
  /**
   * Build a slice path with rounded corners (plotOptions.pie.borderRadius).
   *
   * The generic roundPathCorners() only rounds line->line joins, but a slice
   * corner is an arc<->line join, so we construct the fillets explicitly here:
   * every corner is inset by the (clamped) radius along both the arc and the
   * radial edge, and a quadratic Bezier with its control point at the original
   * sharp corner bridges the two inset points. Donut slices round all four
   * corners; pie / polarArea slices round the two outer corners and keep the
   * center apex sharp.
   *
   * Returns null when the slice is too small to round meaningfully, so the
   * caller can fall back to a sharp-corner path.
   *
   * @param {{me: any, startDeg: number, spanDeg: number, size: number, borderRadius: number}} opts
   * @returns {string | null}
   */
  getRoundedSlicePath({ me, startDeg, spanDeg, size, borderRadius }) {
    if (!(spanDeg > 0)) return null;
    const D2R2 = Math.PI / 180;
    const cx = me.centerX;
    const cy = me.centerY;
    const isDonut = me.chartType === "donut";
    const rOut = size;
    const rIn = isDonut ? me.donutSize : 0;
    const spanRad = spanDeg * D2R2;
    let r = borderRadius;
    r = Math.min(r, spanRad * rOut / 2);
    if (isDonut) {
      r = Math.min(r, spanRad * rIn / 2);
      r = Math.min(r, (rOut - rIn) / 2);
    } else {
      r = Math.min(r, rOut / 2);
    }
    if (!(r > 0.5)) return null;
    const a0 = startDeg;
    const a1 = startDeg + spanDeg;
    if (isDonut) {
      return roundedDonutSegmentPath({ cx, cy, rIn, rOut, a0, a1, r, spanDeg });
    }
    return roundedPieSegmentPath({ cx, cy, rOut, a0, a1, r, spanDeg });
  }
  /**
   * @param {any} parent
   */
  drawPolarElements(parent) {
    const w = this.w;
    const scale = new Scales(this.w);
    const graphics = new Graphics(this.w);
    const helpers = new CircularChartsHelpers(this.w);
    const gCircles = graphics.group();
    const gYAxis = graphics.group();
    const yScale = scale.niceScale(0, Math.ceil(this.maxY), 0);
    const yTexts = yScale.result.reverse();
    const len = yScale.result.length;
    this.maxY = yScale.niceMax;
    let circleSize = w.globals.radialSize;
    const diff = circleSize / (len - 1);
    for (let i = 0; i < len - 1; i++) {
      const circle = graphics.drawCircle(circleSize);
      circle.attr({
        cx: this.centerX,
        cy: this.centerY,
        fill: "none",
        "stroke-width": w.config.plotOptions.polarArea.rings.strokeWidth,
        stroke: w.config.plotOptions.polarArea.rings.strokeColor
      });
      if (w.config.yaxis[0].show) {
        const yLabel = helpers.drawYAxisTexts(
          this.centerX,
          this.centerY - circleSize + parseInt(w.config.yaxis[0].labels.style.fontSize, 10) / 2,
          i,
          yTexts[i]
        );
        gYAxis.add(yLabel);
      }
      gCircles.add(circle);
      circleSize = circleSize - diff;
    }
    this.drawSpokes(parent);
    parent.add(gCircles);
    parent.add(gYAxis);
  }
  /**
   * @param {any} dataLabelsGroup
   * @param {Record<string, any>} dataLabelsConfig
   * @param {Record<string, any>} opts
   */
  renderInnerDataLabels(dataLabelsGroup, dataLabelsConfig, opts) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const showTotal = dataLabelsConfig.total.show;
    dataLabelsGroup.node.innerHTML = "";
    dataLabelsGroup.node.style.opacity = opts.opacity;
    const x = opts.centerX;
    const y = !this.donutDataLabels.total.label ? opts.centerY - opts.centerY / 6 : opts.centerY;
    let labelColor, valueColor;
    if (dataLabelsConfig.name.color === void 0) {
      labelColor = w.globals.colors[0];
    } else {
      labelColor = dataLabelsConfig.name.color;
    }
    let labelFontSize = dataLabelsConfig.name.fontSize;
    let labelFontFamily = dataLabelsConfig.name.fontFamily;
    let labelFontWeight = dataLabelsConfig.name.fontWeight;
    if (dataLabelsConfig.value.color === void 0) {
      valueColor = w.config.chart.foreColor;
    } else {
      valueColor = dataLabelsConfig.value.color;
    }
    const lbFormatter = dataLabelsConfig.value.formatter;
    let val = "";
    let name = "";
    if (showTotal) {
      labelColor = dataLabelsConfig.total.color;
      labelFontSize = dataLabelsConfig.total.fontSize;
      labelFontFamily = dataLabelsConfig.total.fontFamily;
      labelFontWeight = dataLabelsConfig.total.fontWeight;
      name = !this.donutDataLabels.total.label ? "" : dataLabelsConfig.total.label;
      val = dataLabelsConfig.total.formatter(w);
    } else {
      if (w.seriesData.series.length === 1) {
        val = lbFormatter(w.seriesData.series[0], w);
        name = w.seriesData.seriesNames[0];
      }
    }
    if (name) {
      name = dataLabelsConfig.name.formatter(
        name,
        dataLabelsConfig.total.show,
        w
      );
    }
    if (dataLabelsConfig.name.show) {
      const elLabel = graphics.drawText({
        x,
        y: y + parseFloat(dataLabelsConfig.name.offsetY),
        text: name,
        textAnchor: "middle",
        foreColor: labelColor,
        fontSize: labelFontSize,
        fontWeight: labelFontWeight,
        fontFamily: labelFontFamily
      });
      elLabel.node.classList.add("apexcharts-datalabel-label");
      dataLabelsGroup.add(elLabel);
    }
    if (dataLabelsConfig.value.show) {
      const valOffset = dataLabelsConfig.name.show ? parseFloat(dataLabelsConfig.value.offsetY) + 16 : dataLabelsConfig.value.offsetY;
      const elValue = graphics.drawText({
        x,
        y: y + valOffset,
        text: val,
        textAnchor: "middle",
        foreColor: valueColor,
        fontWeight: dataLabelsConfig.value.fontWeight,
        fontSize: dataLabelsConfig.value.fontSize,
        fontFamily: dataLabelsConfig.value.fontFamily
      });
      elValue.node.classList.add("apexcharts-datalabel-value");
      dataLabelsGroup.add(elValue);
    }
    return dataLabelsGroup;
  }
  /**
   *
   * @param {string} name - The name of the series
   * @param {string} val - The value of that series
   * @param {any} el - Optional el (indicates which series was hovered/clicked). If this param is not present, means we need to show total
   * @param {Record<string, any>} labelsConfig
   */
  printInnerLabels(labelsConfig, name, val, el) {
    const w = this.w;
    let labelColor;
    if (el) {
      if (labelsConfig.name.color === void 0) {
        labelColor = w.globals.colors[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
      } else {
        labelColor = labelsConfig.name.color;
      }
    } else {
      if (w.seriesData.series.length > 1 && labelsConfig.total.show) {
        labelColor = labelsConfig.total.color;
      }
    }
    const elLabel = w.dom.baseEl.querySelector(".apexcharts-datalabel-label");
    const elValue = w.dom.baseEl.querySelector(".apexcharts-datalabel-value");
    const lbFormatter = labelsConfig.value.formatter;
    val = lbFormatter(val, w);
    if (!el && typeof labelsConfig.total.formatter === "function") {
      val = labelsConfig.total.formatter(w);
    }
    const isTotal = name === labelsConfig.total.label;
    name = !this.donutDataLabels.total.label ? "" : labelsConfig.name.formatter(name, isTotal, w);
    if (elLabel !== null) {
      elLabel.textContent = name;
    }
    if (elValue !== null) {
      elValue.textContent = val;
    }
    if (elLabel !== null) {
      const elLabelEl = (
        /** @type {HTMLElement} */
        elLabel
      );
      elLabelEl.style.fill = labelColor;
    }
  }
  /**
   * @param {any} el
   * @param {Record<string, any>} dataLabelsConfig
   */
  printDataLabelsInner(el, dataLabelsConfig) {
    const w = this.w;
    const val = el.getAttribute("data:value");
    const name = w.seriesData.seriesNames[parseInt(el.parentNode.getAttribute("rel"), 10) - 1];
    if (w.seriesData.series.length > 1) {
      this.printInnerLabels(dataLabelsConfig, name, val, el);
    }
    const dataLabelsGroup = w.dom.baseEl.querySelector(
      ".apexcharts-datalabels-group"
    );
    if (dataLabelsGroup !== null) {
      const dataLabelsGroupEl = (
        /** @type {HTMLElement} */
        dataLabelsGroup
      );
      dataLabelsGroupEl.style.opacity = "1";
    }
  }
  /**
   * @param {any} parent
   */
  drawSpokes(parent) {
    const w = this.w;
    const graphics = new Graphics(this.w);
    const spokeConfig = w.config.plotOptions.polarArea.spokes;
    if (spokeConfig.strokeWidth === 0) return;
    const spokes = [];
    const angleDivision = 360 / w.seriesData.series.length;
    for (let i = 0; i < w.seriesData.series.length; i++) {
      spokes.push(
        Utils.polarToCartesian(
          this.centerX,
          this.centerY,
          w.globals.radialSize,
          w.config.plotOptions.pie.startAngle + angleDivision * i
        )
      );
    }
    spokes.forEach((p, i) => {
      const line = graphics.drawLine(
        p.x,
        p.y,
        this.centerX,
        this.centerY,
        Array.isArray(spokeConfig.connectorColors) ? spokeConfig.connectorColors[i] : spokeConfig.connectorColors
      );
      parent.add(line);
    });
  }
  revertDataLabelsInner() {
    const w = this.w;
    if (this.donutDataLabels.show) {
      const dataLabelsGroup = w.dom.Paper.findOne(
        `.apexcharts-datalabels-group`
      );
      const dataLabels = this.renderInnerDataLabels(
        dataLabelsGroup,
        this.donutDataLabels,
        {
          hollowSize: this.donutSize,
          centerX: this.centerX,
          centerY: this.centerY,
          opacity: this.donutDataLabels.show
        }
      );
      const elPie = w.dom.Paper.findOne(
        ".apexcharts-radialbar, .apexcharts-pie"
      );
      elPie.add(dataLabels);
    }
  }
}
_core__default.use({
  pie: Pie,
  donut: Pie,
  polarArea: Pie
});
export {
  default2 as default
};
