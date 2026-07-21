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
const Dimensions = _core.__apex_dimensions_Dimensions;
const Graphics = _core.__apex_Graphics;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
const apexchartsLegendCSS = ".apexcharts-flip-y {\n  transform: scaleY(-1) translateY(-100%);\n  transform-origin: top;\n  transform-box: fill-box;\n}\n.apexcharts-flip-x {\n  transform: scaleX(-1);\n  transform-origin: center;\n  transform-box: fill-box;\n}\n.apexcharts-legend {\n  display: flex;\n  overflow: auto;\n  padding: 0 10px;\n}\n.apexcharts-legend.apexcharts-legend-group-horizontal {\n  flex-direction: column;\n}\n.apexcharts-legend-group {\n  display: flex;\n}\n.apexcharts-legend-group-vertical {\n  flex-direction: column-reverse;\n}\n.apexcharts-legend.apx-legend-position-bottom, .apexcharts-legend.apx-legend-position-top {\n  flex-wrap: wrap\n}\n.apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  flex-direction: column;\n  bottom: 0;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-left, .apexcharts-legend.apx-legend-position-top.apexcharts-align-left, .apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  justify-content: flex-start;\n  align-items: flex-start;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-center, .apexcharts-legend.apx-legend-position-top.apexcharts-align-center {\n  justify-content: center;\n  align-items: center;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-right, .apexcharts-legend.apx-legend-position-top.apexcharts-align-right {\n  justify-content: flex-end;\n  align-items: flex-end;\n}\n.apexcharts-legend-series {\n  cursor: pointer;\n  line-height: normal;\n  display: flex;\n  align-items: center;\n}\n.apexcharts-legend-text {\n  position: relative;\n  font-size: 14px;\n}\n.apexcharts-legend-text *, .apexcharts-legend-marker * {\n  pointer-events: none;\n}\n.apexcharts-legend-marker {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  margin-right: 1px;\n}\n\n.apexcharts-legend-series.apexcharts-no-click {\n  cursor: auto;\n}\n.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {\n  display: none !important;\n}\n.apexcharts-inactive-legend {\n  opacity: 0.45;\n} ";
const Environment = _core.__apex_Environment_Environment;
class Helpers {
  /**
   * @param {import('./Legend').default} lgCtx
   */
  constructor(lgCtx) {
    this.w = lgCtx.w;
    this.lgCtx = lgCtx;
  }
  getLegendStyles() {
    if (Environment.isSSR()) return null;
    const stylesheet = document.createElement("style");
    stylesheet.setAttribute("type", "text/css");
    const nonce = this.w.config.chart.nonce;
    if (nonce) {
      stylesheet.setAttribute("nonce", nonce);
    }
    const rule = document.createTextNode(apexchartsLegendCSS);
    stylesheet.appendChild(rule);
    return stylesheet;
  }
  getLegendDimensions() {
    const w = this.w;
    const currLegendsWrap = w.dom.baseEl.querySelector(".apexcharts-legend");
    if (!currLegendsWrap) {
      return { clwh: 0, clww: 0 };
    }
    const { width: currLegendsWrapWidth, height: currLegendsWrapHeight } = currLegendsWrap.getBoundingClientRect();
    return {
      clwh: currLegendsWrapHeight,
      clww: currLegendsWrapWidth
    };
  }
  appendToForeignObject() {
    var _a;
    const legendStyles = this.getLegendStyles();
    if (this.w.config.chart.injectStyleSheet !== false && legendStyles) {
      (_a = this.w.dom.elLegendForeign) == null ? void 0 : _a.appendChild(legendStyles);
    }
  }
  /**
   * @param {number} seriesCnt
   * @param {boolean} isHidden
   */
  toggleDataSeries(seriesCnt, isHidden) {
    var _a, _b, _c;
    const w = this.w;
    if (w.globals.axisCharts || w.config.chart.type === "radialBar") {
      w.globals.resized = true;
      let seriesEl = null;
      let realIndex = null;
      w.globals.risingSeries = [];
      if (w.globals.axisCharts) {
        seriesEl = (_a = Array.prototype.find.call(
          w.dom.baseEl.querySelectorAll(".apexcharts-series"),
          (el) => el.getAttribute("data:realIndex") === String(seriesCnt)
        )) != null ? _a : null;
        if (!seriesEl) return;
        realIndex = parseInt((_b = seriesEl.getAttribute("data:realIndex")) != null ? _b : "", 10);
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        );
        if (!seriesEl) return;
        realIndex = parseInt((_c = seriesEl.getAttribute("rel")) != null ? _c : "", 10) - 1;
      }
      if (isHidden) {
        const seriesToMakeVisible = [
          {
            cs: w.globals.collapsedSeries,
            csi: w.globals.collapsedSeriesIndices
          },
          {
            cs: w.globals.ancillaryCollapsedSeries,
            csi: w.globals.ancillaryCollapsedSeriesIndices
          }
        ];
        seriesToMakeVisible.forEach((r) => {
          const cs = (
            /** @type {any} */
            r.cs
          );
          const csi = (
            /** @type {any} */
            r.csi
          );
          this.riseCollapsedSeries(
            cs,
            csi,
            /** @type {number} */
            realIndex
          );
        });
      } else {
        this.hideSeries({ seriesEl, realIndex });
      }
      if (w.config.chart.accessibility.enabled) {
        const legendItem = w.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`
        );
        if (legendItem) {
          const isCollapsed = w.globals.collapsedSeriesIndices.includes(realIndex) || w.globals.ancillaryCollapsedSeriesIndices.includes(realIndex);
          legendItem.setAttribute(
            "aria-pressed",
            isCollapsed ? "true" : "false"
          );
          const legendTextEl = legendItem.querySelector(
            ".apexcharts-legend-text"
          );
          const seriesName = legendTextEl ? legendTextEl.textContent : w.seriesData.seriesNames[seriesCnt];
          const statusText = isCollapsed ? "hidden" : "visible";
          legendItem.setAttribute(
            "aria-label",
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
          );
        }
      }
    } else {
      const seriesEl = w.dom.Paper.findOne(
        ` .apexcharts-series[rel='${seriesCnt + 1}'] path`
      );
      const type = w.config.chart.type;
      if (type === "pie" || type === "polarArea" || type === "donut") {
        const dataLabels = w.config.plotOptions.pie.donut.labels;
        const graphics = new Graphics(this.w);
        graphics.pathMouseDown(seriesEl, null);
        this.lgCtx.printDataLabelsInner(seriesEl.node, dataLabels);
      }
      if (w.config.chart.accessibility.enabled) {
        const legendItem = w.dom.baseEl.querySelector(
          `.apexcharts-legend-series[rel="${seriesCnt + 1}"]`
        );
        if (legendItem) {
          const isCollapsed = w.globals.collapsedSeriesIndices.includes(seriesCnt);
          legendItem.setAttribute(
            "aria-pressed",
            isCollapsed ? "true" : "false"
          );
          const legendTextEl = legendItem.querySelector(
            ".apexcharts-legend-text"
          );
          const seriesName = legendTextEl ? legendTextEl.textContent : w.seriesData.seriesNames[seriesCnt];
          const statusText = isCollapsed ? "hidden" : "visible";
          legendItem.setAttribute(
            "aria-label",
            `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
          );
        }
      }
    }
  }
  /** @param {{realIndex: any}} opts */
  getSeriesAfterCollapsing({ realIndex }) {
    var _a;
    const w = this.w;
    const gl = w.globals;
    const series = Utils.clone(w.config.series);
    if (gl.axisCharts) {
      const yaxis = w.config.yaxis[gl.seriesYAxisReverseMap[realIndex]];
      const collapseData = {
        index: realIndex,
        data: series[realIndex].data.slice(),
        type: series[realIndex].type || w.config.chart.type
      };
      if (yaxis && yaxis.show && yaxis.showAlways) {
        if (gl.ancillaryCollapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.ancillaryCollapsedSeries.push(collapseData);
          gl.ancillaryCollapsedSeriesIndices.push(realIndex);
        }
      } else {
        if (gl.collapsedSeriesIndices.indexOf(realIndex) < 0) {
          gl.collapsedSeries.push(collapseData);
          gl.collapsedSeriesIndices.push(realIndex);
          const removeIndexOfRising = gl.risingSeries.indexOf(realIndex);
          gl.risingSeries.splice(removeIndexOfRising, 1);
        }
      }
    } else {
      gl.collapsedSeries.push({
        index: realIndex,
        data: series[realIndex],
        type: (
          /** @type {any} */
          (_a = w.config.series[realIndex].type) != null ? _a : "line"
        )
      });
      gl.collapsedSeriesIndices.push(realIndex);
    }
    gl.allSeriesCollapsed = gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length === w.config.series.length;
    return this._getSeriesBasedOnCollapsedState(series);
  }
  /** @param {{seriesEl: any, realIndex: any}} opts */
  hideSeries({ seriesEl, realIndex }) {
    const w = this.w;
    const series = this.getSeriesAfterCollapsing({
      realIndex
    });
    const seriesChildren = seriesEl.childNodes;
    for (let sc = 0; sc < seriesChildren.length; sc++) {
      if (seriesChildren[sc].classList.contains("apexcharts-series-markers-wrap")) {
        if (seriesChildren[sc].classList.contains("apexcharts-hide")) {
          seriesChildren[sc].classList.remove("apexcharts-hide");
        } else {
          seriesChildren[sc].classList.add("apexcharts-hide");
        }
      }
    }
    this.lgCtx.updateSeries(
      series,
      w.config.chart.animations.dynamicAnimation.enabled
    );
  }
  /**
   * @param {any[]} collapsedSeries
   * @param {number[]} seriesIndices
   * @param {number} realIndex
   */
  riseCollapsedSeries(collapsedSeries, seriesIndices, realIndex) {
    const w = this.w;
    let series = Utils.clone(w.config.series);
    if (collapsedSeries.length > 0) {
      for (let c = 0; c < collapsedSeries.length; c++) {
        if (collapsedSeries[c].index === realIndex) {
          if (w.globals.axisCharts) {
            series[realIndex].data = collapsedSeries[c].data.slice();
          } else {
            series[realIndex] = collapsedSeries[c].data;
          }
          if (typeof series[realIndex] !== "number") {
            series[realIndex].hidden = false;
          }
          collapsedSeries.splice(c, 1);
          seriesIndices.splice(c, 1);
          w.globals.risingSeries.push(realIndex);
          c--;
        }
      }
      series = this._getSeriesBasedOnCollapsedState(series);
      this.lgCtx.updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
    }
  }
  /**
   * @param {any[]} series
   */
  _getSeriesBasedOnCollapsedState(series) {
    const w = this.w;
    let collapsed = 0;
    if (w.globals.axisCharts) {
      series.forEach((s, sI) => {
        if (!(w.globals.collapsedSeriesIndices.indexOf(sI) < 0 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(sI) < 0)) {
          series[sI].data = [];
          collapsed++;
        }
      });
    } else {
      series.forEach((s, sI) => {
        if (!(w.globals.collapsedSeriesIndices.indexOf(sI) < 0)) {
          series[sI] = 0;
          collapsed++;
        }
      });
    }
    w.globals.allSeriesCollapsed = collapsed === series.length;
    return series;
  }
}
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
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
    this._onCellEnter = this._onCellEnter.bind(this);
    this._onCellLeave = this._onCellLeave.bind(this);
    this._onBandEnter = this._onBandEnter.bind(this);
    this._onBandLeave = this._onBandLeave.bind(this);
  }
  /** Default value formatter for min/max labels and the hover tooltip. */
  _getFormatter() {
    const cfg = this.w.config.plotOptions.heatmap.colorScale.gradientLegend;
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
   * True when the user has opted into the gradient legend variant.
   * @param {any} w
   */
  static isEnabled(w) {
    var _a, _b, _c, _d;
    const cfg = (_d = (_c = (_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.plotOptions) == null ? void 0 : _b.heatmap) == null ? void 0 : _c.colorScale) == null ? void 0 : _d.gradientLegend;
    return !!(cfg && cfg.enabled);
  }
  /**
   * Build the gradient legend DOM into `elLegendWrap`.
   * Caller is responsible for clearing the wrap first.
   */
  draw() {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    if (!elLegendWrap) return;
    const cfg = w.config.plotOptions.heatmap.colorScale.gradientLegend;
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
    svg.setAttribute("class", "apexcharts-heatmap-gradient-legend");
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
    stops.forEach((s) => {
      const stopEl = BrowserAPIs.createElementNS(SVG_NS, "stop");
      stopEl.setAttribute("offset", `${(s.percent * 100).toFixed(2)}%`);
      stopEl.setAttribute("stop-color", s.color);
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
      const makeLabel = (text, x, y, anchor) => {
        const t = BrowserAPIs.createElementNS(SVG_NS, "text");
        t.setAttribute("x", String(x));
        t.setAttribute("y", String(y));
        t.setAttribute("text-anchor", anchor);
        t.setAttribute("dominant-baseline", "middle");
        t.setAttribute("fill", labelColor);
        t.setAttribute("font-size", labelFontSize);
        if (labelFontFamily) t.setAttribute("font-family", labelFontFamily);
        t.textContent = String(text);
        return t;
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
    const arrow = this._buildArrow(arrowSize, arrowColor, position);
    svg.appendChild(arrow);
    this.arrowEl = arrow;
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
    this._applyWrapAlignment(elLegendWrap, position, isVertical, svgWidth, svgHeight);
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
      const n = parseFloat(trimmed);
      return Number.isFinite(n) ? n : 200;
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
    const cfg = w.config.plotOptions.heatmap.colorScale.gradientLegend;
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
      let x;
      if (align === "start") x = edgePad;
      else if (align === "end") x = edgePad + Math.max(0, availableWidth);
      else x = edgePad + Math.max(0, availableWidth) / 2;
      elLegendWrap.style.left = x + userOffsetX + "px";
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
    const w = this.w;
    const g = w.globals;
    const wrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    if (!wrap || !this._geom) return;
    if (!Number.isFinite(g.gridWidth) || !Number.isFinite(g.gridHeight)) return;
    const { isVertical, position, svgWidth, svgHeight, stripX, stripY, stripThickness } = this._geom;
    const align = w.config.plotOptions.heatmap.colorScale.gradientLegend.align || "center";
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
    const grid = w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!wrap || !strip || !grid || !this._geom) return;
    const s = strip.getBoundingClientRect();
    const gr = grid.getBoundingClientRect();
    if (!s.width || !s.height || !gr.width || !gr.height) return;
    const MIN_GAP = 16;
    const { isVertical, position } = this._geom;
    if (isVertical) {
      const gap = position === "left" ? gr.left - s.right : s.left - gr.right;
      if (gap < MIN_GAP) {
        const curLeft = parseFloat(wrap.style.left) || 0;
        const shift = MIN_GAP - gap;
        wrap.style.left = curLeft + (position === "left" ? -shift : shift) + "px";
      }
    } else {
      const gap = position === "top" ? gr.top - s.bottom : s.top - gr.bottom;
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
    for (let i = 0; i < this._bandHitEls.length; i++) {
      const el = this._bandHitEls[i];
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
    } catch (_) {
    }
  }
  /** Wire mousemove/mouseout on each per-band hit-region (ranges mode). */
  _attachBandHoverListeners() {
    if (!Environment.isBrowser()) return;
    for (let i = 0; i < this._bandHitEls.length; i++) {
      const el = this._bandHitEls[i];
      el.addEventListener("mousemove", this._onBandEnter);
      el.addEventListener("mouseout", this._onBandLeave);
    }
  }
  /**
   * Hovering a gradient band highlights its cells and dims the rest. Guarded
   * so the repeated mousemove stream only re-applies on an actual band change.
   * @param {Event} e
   */
  _onBandEnter(e) {
    var _a, _b, _c, _d;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e.currentTarget
    );
    const idx = parseInt((_a = target.getAttribute("data:range-index")) != null ? _a : "-1", 10);
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
    var _a, _b;
    const w = this.w;
    if (!this.arrowEl) return;
    const opts = args[args.length - 1];
    if (!opts || typeof opts !== "object") return;
    const i = opts.seriesIndex;
    const j = opts.dataPointIndex;
    if (typeof i !== "number" || typeof j !== "number") return;
    if (w.config.chart.type !== "heatmap") return;
    const row = (_b = (_a = w.seriesData) == null ? void 0 : _a.series) == null ? void 0 : _b[i];
    const val = row == null ? void 0 : row[j];
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
    const cs = w.config.plotOptions.heatmap.colorScale;
    const cfg = cs.gradientLegend;
    let dataMin = Infinity;
    let dataMax = -Infinity;
    const rows = ((_a = w.seriesData) == null ? void 0 : _a.series) || [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      for (let j = 0; j < row.length; j++) {
        const v = row[j];
        if (v == null || Number.isNaN(v)) continue;
        if (v < dataMin) dataMin = v;
        if (v > dataMax) dataMax = v;
      }
    }
    if (!Number.isFinite(dataMin)) dataMin = 0;
    if (!Number.isFinite(dataMax)) dataMax = 0;
    let min = dataMin;
    let max = dataMax;
    if (typeof cs.min !== "undefined") {
      min = cs.min < dataMin ? cs.min : dataMin;
    }
    if (typeof cs.max !== "undefined") {
      max = cs.max > dataMax ? cs.max : dataMax;
    }
    const stops = [];
    const bands = [];
    if (cs.ranges && cs.ranges.length > 0) {
      const ranges = cs.ranges.map((r, originalIndex) => __spreadProps(__spreadValues({}, r), {
        _originalIndex: originalIndex
      })).sort((a, b) => a.from - b.from);
      const lo = ranges[0].from;
      const hi = ranges[ranges.length - 1].to;
      min = lo;
      max = hi;
      const span = hi - lo || 1;
      ranges.forEach((r) => {
        const p1 = (r.from - lo) / span;
        const p2 = (r.to - lo) / span;
        stops.push({ percent: (p1 + p2) / 2, color: r.color });
        bands.push({ index: r._originalIndex, p1, p2 });
      });
    } else {
      const baseColor = w.globals.colors[0] || "#008FFB";
      const utils = new Utils();
      const shadeIntensity = (_b = w.config.plotOptions.heatmap.shadeIntensity) != null ? _b : 0.5;
      const hasNegs = (
        /** @type {any} */
        w.globals.hasNegs
      );
      const n = Math.max(2, cfg.stops || 16);
      for (let s = 0; s < n; s++) {
        const t = s / (n - 1);
        const v = min + t * (max - min);
        const total = Math.abs(max) + Math.abs(min);
        const percent_v = total === 0 ? 0 : 100 * v / total;
        let colorShadePercent;
        if (hasNegs) {
          if (w.config.plotOptions.heatmap.reverseNegativeShade) {
            colorShadePercent = percent_v < 0 ? percent_v / 100 * (shadeIntensity * 1.25) : (1 - percent_v / 100) * (shadeIntensity * 1.25);
          } else {
            colorShadePercent = percent_v <= 0 ? 1 - (1 + percent_v / 100) * shadeIntensity : (1 - percent_v / 100) * shadeIntensity;
          }
        } else {
          colorShadePercent = 1 - percent_v / 100;
        }
        if (colorShadePercent > 1) colorShadePercent = 1;
        if (colorShadePercent < -1) colorShadePercent = -1;
        const shaded = w.config.plotOptions.heatmap.enableShades ? utils.shadeColor(
          w.config.theme.mode === "dark" ? colorShadePercent * -1 : colorShadePercent,
          baseColor
        ) : baseColor;
        stops.push({ percent: t, color: shaded });
      }
    }
    return { min, max, stops, bands };
  }
}
const Markers = _core.__apex_Markers;
class Legend {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.printDataLabelsInner = (...a) => {
      var _a;
      return (_a = ctx.pie) == null ? void 0 : _a.printDataLabelsInner(...a);
    };
    this.updateSeries = (...a) => ctx.updateHelpers._updateSeries(...a);
    this.onLegendClick = this.onLegendClick.bind(this);
    this.onLegendHovered = this.onLegendHovered.bind(this);
    this.isBarsDistributed = this.w.config.chart.type === "bar" && this.w.config.plotOptions.bar.distributed && this.w.config.series.length === 1;
    this.legendHelpers = new Helpers(this);
  }
  init() {
    const w = this.w;
    const gl = w.globals;
    const cnf = w.config;
    this.isBarsDistributed = cnf.chart.type === "bar" && cnf.plotOptions.bar.distributed && cnf.series.length === 1;
    const showLegendAlways = cnf.legend.showForSingleSeries && this.w.seriesData.series.length === 1 || this.isBarsDistributed || // Heatmap legends are colorScale-driven (discrete ranges or the
    // gradient strip), not series-driven, so they must render even for a
    // single-row heatmap.
    cnf.chart.type === "heatmap" || this.w.seriesData.series.length > 1;
    this.legendHelpers.appendToForeignObject();
    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      const elLegendWrap = (
        /** @type {HTMLElement} */
        w.dom.elLegendWrap
      );
      while (elLegendWrap.firstChild) {
        elLegendWrap.removeChild(elLegendWrap.firstChild);
      }
      if (this.heatmapGradientLegend) {
        this.heatmapGradientLegend.destroy();
        this.heatmapGradientLegend = null;
      }
      if (cnf.chart.type === "heatmap" && HeatmapGradientLegend.isEnabled(w)) {
        this.heatmapGradientLegend = new HeatmapGradientLegend(w, this.ctx);
        this.heatmapGradientLegend.draw();
      } else {
        this.drawLegends();
        if (cnf.legend.position === "bottom" || cnf.legend.position === "top") {
          this.legendAlignHorizontal();
        } else if (cnf.legend.position === "right" || cnf.legend.position === "left") {
          this.legendAlignVertical();
        }
      }
    }
  }
  createLegendMarker({ i, fillcolor }) {
    const w = this.w;
    const elMarker = BrowserAPIs.createElement("span");
    elMarker.classList.add("apexcharts-legend-marker");
    const mShape = w.config.legend.markers.shape || w.config.markers.shape;
    let shape = mShape;
    if (Array.isArray(mShape)) {
      shape = mShape[i];
    }
    const mSize = Array.isArray(w.config.legend.markers.size) ? parseFloat(w.config.legend.markers.size[i]) : parseFloat(w.config.legend.markers.size);
    const mOffsetX = Array.isArray(w.config.legend.markers.offsetX) ? parseFloat(w.config.legend.markers.offsetX[i]) : parseFloat(w.config.legend.markers.offsetX);
    const mOffsetY = Array.isArray(w.config.legend.markers.offsetY) ? parseFloat(w.config.legend.markers.offsetY[i]) : parseFloat(w.config.legend.markers.offsetY);
    const mBorderWidth = Array.isArray(w.config.legend.markers.strokeWidth) ? parseFloat(w.config.legend.markers.strokeWidth[i]) : parseFloat(w.config.legend.markers.strokeWidth);
    const mStyle = elMarker.style;
    mStyle.height = (mSize + mBorderWidth) * 2 + "px";
    mStyle.width = (mSize + mBorderWidth) * 2 + "px";
    mStyle.left = mOffsetX + "px";
    mStyle.top = mOffsetY + "px";
    if (w.config.legend.markers.customHTML) {
      mStyle.background = "transparent";
      mStyle.color = fillcolor[i];
      if (Array.isArray(w.config.legend.markers.customHTML)) {
        if (w.config.legend.markers.customHTML[i]) {
          elMarker.innerHTML = w.config.legend.markers.customHTML[i]();
        }
      } else {
        elMarker.innerHTML = w.config.legend.markers.customHTML();
      }
    } else {
      const markers = new Markers(this.ctx.w, this.ctx);
      const markerConfig = markers.getMarkerConfig({
        cssClass: `apexcharts-legend-marker apexcharts-marker apexcharts-marker-${shape}`,
        seriesIndex: i,
        strokeWidth: mBorderWidth,
        size: mSize
      });
      const SVGLib = Environment.isBrowser() ? (
        /** @type {any} */
        window.SVG
      ) : (
        /** @type {any} */
        global.SVG
      );
      const SVGMarker = SVGLib().addTo(elMarker).size("100%", "100%");
      const marker = new Graphics(this.w).drawMarker(0, 0, __spreadProps(__spreadValues({}, markerConfig), {
        pointFillColor: Array.isArray(fillcolor) ? fillcolor[i] : markerConfig.pointFillColor,
        shape
      }));
      const shapesEls = w.dom.Paper.find(
        ".apexcharts-legend-marker.apexcharts-marker"
      );
      shapesEls.forEach((shapeEl) => {
        if (shapeEl.node.classList.contains("apexcharts-marker-triangle")) {
          shapeEl.node.style.transform = "translate(50%, 45%)";
        } else {
          shapeEl.node.style.transform = "translate(50%, 50%)";
        }
      });
      SVGMarker.add(marker);
    }
    return elMarker;
  }
  drawLegends() {
    var _a;
    const me = this;
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const fontFamily = w.config.legend.fontFamily;
    let legendNames = w.seriesData.seriesNames;
    let fillcolor = w.config.legend.markers.fillColors ? w.config.legend.markers.fillColors.slice() : w.globals.colors.slice();
    if (w.config.chart.type === "heatmap") {
      const ranges = w.config.plotOptions.heatmap.colorScale.ranges;
      legendNames = ranges.map((colorScale) => {
        return colorScale.name ? colorScale.name : colorScale.from + " - " + colorScale.to;
      });
      fillcolor = ranges.map((color) => color.color);
    } else if (this.isBarsDistributed) {
      legendNames = w.labelData.labels.slice();
    }
    if (w.config.legend.customLegendItems.length) {
      legendNames = w.config.legend.customLegendItems;
    }
    const legendFormatter = w.formatters.legendFormatter;
    const isLegendInversed = w.config.legend.inverseOrder;
    const legendGroups = [];
    if (w.labelData.seriesGroups.length > 1 && w.config.legend.clusterGroupedSeries) {
      w.labelData.seriesGroups.forEach((_, gi) => {
        legendGroups[gi] = BrowserAPIs.createElement("div");
        legendGroups[gi].classList.add(
          "apexcharts-legend-group",
          `apexcharts-legend-group-${gi}`
        );
        if (w.config.legend.clusterGroupedSeriesOrientation === "horizontal") {
          elLegendWrap.classList.add("apexcharts-legend-group-horizontal");
        } else {
          legendGroups[gi].classList.add("apexcharts-legend-group-vertical");
        }
      });
    }
    for (let i = isLegendInversed ? legendNames.length - 1 : 0; isLegendInversed ? i >= 0 : i <= legendNames.length - 1; isLegendInversed ? i-- : i++) {
      const text = legendFormatter(legendNames[i], { seriesIndex: i, w });
      let collapsedSeries = false;
      let ancillaryCollapsedSeries = false;
      if (w.globals.collapsedSeries.length > 0) {
        for (let c = 0; c < w.globals.collapsedSeries.length; c++) {
          if (w.globals.collapsedSeries[c].index === i) {
            collapsedSeries = true;
          }
        }
      }
      if (w.globals.ancillaryCollapsedSeriesIndices.length > 0) {
        for (let c = 0; c < w.globals.ancillaryCollapsedSeriesIndices.length; c++) {
          if (w.globals.ancillaryCollapsedSeriesIndices[c] === i) {
            ancillaryCollapsedSeries = true;
          }
        }
      }
      const elMarker = this.createLegendMarker({ i, fillcolor });
      Graphics.setAttrs(elMarker, {
        rel: i + 1,
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elMarker.classList.add("apexcharts-inactive-legend");
      }
      const elLegend = BrowserAPIs.createElement("div");
      if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.keyboard.enabled) {
        elLegend.setAttribute("role", "button");
        elLegend.setAttribute("tabindex", "0");
        const seriesName = Array.isArray(text) ? text.join(" ") : text;
        const isCollapsed = collapsedSeries || ancillaryCollapsedSeries;
        const statusText = isCollapsed ? "hidden" : "visible";
        elLegend.setAttribute(
          "aria-label",
          `${seriesName}, ${statusText}. Press Enter or Space to toggle.`
        );
        elLegend.setAttribute("aria-pressed", isCollapsed ? "true" : "false");
      }
      const elLegendText = BrowserAPIs.createElement("span");
      elLegendText.classList.add("apexcharts-legend-text");
      elLegendText.innerHTML = Array.isArray(text) ? text.join(" ") : text;
      let textColor = w.config.legend.labels.useSeriesColors ? w.globals.colors[i] : Array.isArray(w.config.legend.labels.colors) ? (_a = w.config.legend.labels.colors) == null ? void 0 : _a[i] : w.config.legend.labels.colors;
      if (!textColor) {
        textColor = w.config.chart.foreColor;
      }
      elLegendText.style.color = textColor;
      elLegendText.style.fontSize = w.config.legend.fontSize;
      elLegendText.style.fontWeight = w.config.legend.fontWeight;
      elLegendText.style.fontFamily = fontFamily || w.config.chart.fontFamily;
      Graphics.setAttrs(elLegendText, {
        rel: i + 1,
        i,
        "data:default-text": encodeURIComponent(text),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      elLegend.appendChild(elMarker);
      elLegend.appendChild(elLegendText);
      const coreUtils = new CoreUtils(this.w);
      if (!w.config.legend.showForZeroSeries) {
        const total = coreUtils.getSeriesTotalByIndex(i);
        if (total === 0 && coreUtils.seriesHaveSameValues(i) && !coreUtils.isSeriesNull(i) && w.globals.collapsedSeriesIndices.indexOf(i) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add("apexcharts-hidden-zero-series");
        }
      }
      if (!w.config.legend.showForNullSeries) {
        if (coreUtils.isSeriesNull(i) && w.globals.collapsedSeriesIndices.indexOf(i) === -1 && w.globals.ancillaryCollapsedSeriesIndices.indexOf(i) === -1) {
          elLegend.classList.add("apexcharts-hidden-null-series");
        }
      }
      if (legendGroups.length) {
        w.labelData.seriesGroups.forEach((group, gi) => {
          var _a2, _b;
          if (group.includes(
            /** @type {Record<string,any>} */
            (_b = (_a2 = w.config.series[i]) == null ? void 0 : _a2.name) != null ? _b : ""
          )) {
            elLegendWrap.appendChild(legendGroups[gi]);
            legendGroups[gi].appendChild(elLegend);
          }
        });
      } else {
        elLegendWrap.appendChild(elLegend);
      }
      elLegendWrap.classList.add(
        `apexcharts-align-${w.config.legend.horizontalAlign}`
      );
      elLegendWrap.classList.add(
        "apx-legend-position-" + w.config.legend.position
      );
      elLegend.classList.add("apexcharts-legend-series");
      elLegend.style.margin = `${w.config.legend.itemMargin.vertical}px ${w.config.legend.itemMargin.horizontal}px`;
      elLegendWrap.style.width = w.config.legend.width ? w.config.legend.width + "px" : "";
      elLegendWrap.style.height = w.config.legend.height ? w.config.legend.height + "px" : "";
      Graphics.setAttrs(elLegend, {
        rel: i + 1,
        seriesName: Utils.escapeString(legendNames[i]),
        "data:collapsed": collapsedSeries || ancillaryCollapsedSeries
      });
      if (collapsedSeries || ancillaryCollapsedSeries) {
        elLegend.classList.add("apexcharts-inactive-legend");
      }
      if (!w.config.legend.onItemClick.toggleDataSeries) {
        elLegend.classList.add("apexcharts-no-click");
      }
    }
    w.dom.elWrap.addEventListener("click", me.onLegendClick, true);
    if (w.config.legend.onItemHover.highlightDataSeries && w.config.legend.customLegendItems.length === 0) {
      w.dom.elWrap.addEventListener("mousemove", me.onLegendHovered, true);
      w.dom.elWrap.addEventListener("mouseout", me.onLegendHovered, true);
    }
    if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.keyboard.enabled) {
      w.dom.elWrap.addEventListener(
        "keydown",
        me.onLegendKeyDown.bind(me),
        true
      );
    }
  }
  /**
   * @param {number} offsetX
   * @param {number} offsetY
   */
  setLegendWrapXY(offsetX, offsetY) {
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    const legendHeight = elLegendWrap.clientHeight;
    let x = 0;
    let y = 0;
    if (w.config.legend.position === "bottom") {
      y = w.globals.svgHeight - Math.min(legendHeight, w.globals.svgHeight / 2) - 5;
    } else if (w.config.legend.position === "top") {
      const dim = new Dimensions(this.w, this.ctx);
      const titleH = dim.dimHelpers.getTitleSubtitleCoords("title").height;
      const subtitleH = dim.dimHelpers.getTitleSubtitleCoords("subtitle").height;
      y = (titleH > 0 ? titleH - 10 : 0) + (subtitleH > 0 ? subtitleH - 10 : 0);
    }
    elLegendWrap.style.position = "absolute";
    x = x + offsetX + w.config.legend.offsetX;
    y = y + offsetY + w.config.legend.offsetY;
    elLegendWrap.style.left = x + "px";
    elLegendWrap.style.top = y + "px";
    if (w.config.legend.position === "right") {
      elLegendWrap.style.left = "auto";
      elLegendWrap.style.right = 25 + w.config.legend.offsetX + "px";
    }
    const fixedHeigthWidth = (
      /** @type {const} */
      ["width", "height"]
    );
    fixedHeigthWidth.forEach((hw) => {
      if (elLegendWrap && elLegendWrap.style[hw]) {
        elLegendWrap.style[hw] = parseInt(String(w.config.legend[hw]), 10) + "px";
      }
    });
  }
  legendAlignHorizontal() {
    const w = this.w;
    const elLegendWrap = (
      /** @type {HTMLElement} */
      w.dom.elLegendWrap
    );
    elLegendWrap.style.right = "0";
    const dimensions = new Dimensions(this.w, this.ctx);
    const titleRect = dimensions.dimHelpers.getTitleSubtitleCoords("title");
    const subtitleRect = dimensions.dimHelpers.getTitleSubtitleCoords("subtitle");
    const offsetX = 20;
    let offsetY = 0;
    if (w.config.legend.position === "top") {
      offsetY = titleRect.height + subtitleRect.height + w.config.title.margin + w.config.subtitle.margin - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  legendAlignVertical() {
    const w = this.w;
    const lRect = this.legendHelpers.getLegendDimensions();
    const offsetY = 20;
    let offsetX = 0;
    if (w.config.legend.position === "left") {
      offsetX = 20;
    }
    if (w.config.legend.position === "right") {
      offsetX = w.globals.svgWidth - lRect.clww - 10;
    }
    this.setLegendWrapXY(offsetX, offsetY);
  }
  /**
   * @param {MouseEvent} e
   */
  onLegendHovered(e) {
    var _a;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e.target
    );
    const hoverOverLegend = target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker");
    if (w.config.chart.type !== "heatmap" && !this.isBarsDistributed) {
      if (!target.classList.contains("apexcharts-inactive-legend") && hoverOverLegend) {
        const series = new Series(this.ctx.w);
        series.toggleSeriesOnHover(e, target);
      }
    } else {
      if (hoverOverLegend) {
        const seriesCnt = parseInt((_a = target.getAttribute("rel")) != null ? _a : "0", 10) - 1;
        this.ctx.events.fireEvent("legendHover", [this.ctx, seriesCnt, this.w]);
        const series = new Series(this.ctx.w);
        if (e.type === "mousemove") {
          series.highlightRangeInSeries(seriesCnt, "highlight");
        } else if (e.type === "mouseout") {
          series.highlightRangeInSeries(seriesCnt, "reset");
        }
      }
    }
  }
  /**
   * @param {KeyboardEvent} e
   */
  onLegendKeyDown(e) {
    const me = this;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e.target
    );
    const isLegendItem = target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker");
    if (!isLegendItem) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rel = target.getAttribute("rel");
      me.onLegendClick(e);
      if (rel !== null && w.config.legend.onItemClick.toggleDataSeries) {
        requestAnimationFrame(() => {
          const restored = w.dom.baseEl.querySelector(
            `.apexcharts-legend-series[rel="${rel}"]`
          );
          if (restored) restored.focus();
        });
      }
    }
  }
  /**
   * @param {Event} e
   */
  onLegendClick(e) {
    var _a;
    const w = this.w;
    const target = (
      /** @type {Element} */
      e.target
    );
    if (w.config.legend.customLegendItems.length) return;
    if (target.classList.contains("apexcharts-legend-series") || target.classList.contains("apexcharts-legend-text") || target.classList.contains("apexcharts-legend-marker")) {
      const seriesCnt = parseInt((_a = target.getAttribute("rel")) != null ? _a : "0", 10) - 1;
      const isHidden = target.getAttribute("data:collapsed") === "true";
      const legendClick = this.w.config.chart.events.legendClick;
      if (typeof legendClick === "function") {
        legendClick(this.ctx, seriesCnt, this.w);
      }
      this.ctx.events.fireEvent("legendClick", [this.ctx, seriesCnt, this.w]);
      const markerClick = this.w.config.legend.markers.onClick;
      if (typeof markerClick === "function" && target.classList.contains("apexcharts-legend-marker")) {
        markerClick(this.ctx, seriesCnt, this.w);
        this.ctx.events.fireEvent("legendMarkerClick", [
          this.ctx,
          seriesCnt,
          this.w
        ]);
      }
      const clickAllowed = w.config.chart.type !== "treemap" && w.config.chart.type !== "heatmap" && !this.isBarsDistributed;
      if (clickAllowed && w.config.legend.onItemClick.toggleDataSeries) {
        this.legendHelpers.toggleDataSeries(seriesCnt, isHidden);
      }
    }
  }
}
_core__default.registerFeatures({ legend: Legend });
export {
  default2 as default
};
