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
 * ApexCharts v5.10.3
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
    const legendStyles = this.getLegendStyles();
    if (this.w.config.chart.injectStyleSheet !== false && legendStyles) {
      this.w.dom.elLegendForeign.appendChild(legendStyles);
    }
  }
  toggleDataSeries(seriesCnt, isHidden) {
    const w = this.w;
    if (w.globals.axisCharts || w.config.chart.type === "radialBar") {
      w.globals.resized = true;
      let seriesEl = null;
      let realIndex = null;
      w.globals.risingSeries = [];
      if (w.globals.axisCharts) {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[data\\:realIndex='${seriesCnt}']`
        );
        if (!seriesEl) return;
        realIndex = parseInt(seriesEl.getAttribute("data:realIndex"), 10);
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        );
        if (!seriesEl) return;
        realIndex = parseInt(seriesEl.getAttribute("rel"), 10) - 1;
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
          this.riseCollapsedSeries(r.cs, r.csi, realIndex);
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
  getSeriesAfterCollapsing({ realIndex }) {
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
        data: series[realIndex]
      });
      gl.collapsedSeriesIndices.push(realIndex);
    }
    gl.allSeriesCollapsed = gl.collapsedSeries.length + gl.ancillaryCollapsedSeries.length === w.config.series.length;
    return this._getSeriesBasedOnCollapsedState(series);
  }
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
const Markers = _core.__apex_Markers;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
class Legend {
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
    const showLegendAlways = cnf.legend.showForSingleSeries && this.w.seriesData.series.length === 1 || this.isBarsDistributed || this.w.seriesData.series.length > 1;
    this.legendHelpers.appendToForeignObject();
    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      while (w.dom.elLegendWrap.firstChild) {
        w.dom.elLegendWrap.removeChild(w.dom.elLegendWrap.firstChild);
      }
      this.drawLegends();
      if (cnf.legend.position === "bottom" || cnf.legend.position === "top") {
        this.legendAlignHorizontal();
      } else if (cnf.legend.position === "right" || cnf.legend.position === "left") {
        this.legendAlignVertical();
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
      const SVGLib = Environment.isBrowser() ? window.SVG : global.SVG;
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
          w.dom.elLegendWrap.classList.add(
            "apexcharts-legend-group-horizontal"
          );
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
          var _a2;
          if (group.includes((_a2 = w.config.series[i]) == null ? void 0 : _a2.name)) {
            w.dom.elLegendWrap.appendChild(legendGroups[gi]);
            legendGroups[gi].appendChild(elLegend);
          }
        });
      } else {
        w.dom.elLegendWrap.appendChild(elLegend);
      }
      w.dom.elLegendWrap.classList.add(
        `apexcharts-align-${w.config.legend.horizontalAlign}`
      );
      w.dom.elLegendWrap.classList.add(
        "apx-legend-position-" + w.config.legend.position
      );
      elLegend.classList.add("apexcharts-legend-series");
      elLegend.style.margin = `${w.config.legend.itemMargin.vertical}px ${w.config.legend.itemMargin.horizontal}px`;
      w.dom.elLegendWrap.style.width = w.config.legend.width ? w.config.legend.width + "px" : "";
      w.dom.elLegendWrap.style.height = w.config.legend.height ? w.config.legend.height + "px" : "";
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
      w.dom.elWrap.addEventListener(
        "mousemove",
        me.onLegendHovered,
        true
      );
      w.dom.elWrap.addEventListener(
        "mouseout",
        me.onLegendHovered,
        true
      );
    }
    if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.keyboard.enabled) {
      w.dom.elWrap.addEventListener("keydown", me.onLegendKeyDown.bind(me), true);
    }
  }
  setLegendWrapXY(offsetX, offsetY) {
    const w = this.w;
    const elLegendWrap = w.dom.elLegendWrap;
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
    const fixedHeigthWidth = ["width", "height"];
    fixedHeigthWidth.forEach((hw) => {
      if (elLegendWrap.style[hw]) {
        elLegendWrap.style[hw] = parseInt(w.config.legend[hw], 10) + "px";
      }
    });
  }
  legendAlignHorizontal() {
    const w = this.w;
    const elLegendWrap = w.dom.elLegendWrap;
    elLegendWrap.style.right = 0;
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
  onLegendHovered(e) {
    const w = this.w;
    const hoverOverLegend = e.target.classList.contains("apexcharts-legend-series") || e.target.classList.contains("apexcharts-legend-text") || e.target.classList.contains("apexcharts-legend-marker");
    if (w.config.chart.type !== "heatmap" && !this.isBarsDistributed) {
      if (!e.target.classList.contains("apexcharts-inactive-legend") && hoverOverLegend) {
        const series = new Series(this.ctx.w);
        series.toggleSeriesOnHover(e, e.target);
      }
    } else {
      if (hoverOverLegend) {
        const seriesCnt = parseInt(e.target.getAttribute("rel"), 10) - 1;
        this.ctx.events.fireEvent("legendHover", [this.ctx, seriesCnt, this.w]);
        const series = new Series(this.ctx.w);
        series.highlightRangeInSeries(e, e.target);
      }
    }
  }
  onLegendKeyDown(e) {
    const me = this;
    const w = this.w;
    const isLegendItem = e.target.classList.contains("apexcharts-legend-series") || e.target.classList.contains("apexcharts-legend-text") || e.target.classList.contains("apexcharts-legend-marker");
    if (!isLegendItem) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const rel = e.target.getAttribute("rel");
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
  onLegendClick(e) {
    const w = this.w;
    if (w.config.legend.customLegendItems.length) return;
    if (e.target.classList.contains("apexcharts-legend-series") || e.target.classList.contains("apexcharts-legend-text") || e.target.classList.contains("apexcharts-legend-marker")) {
      const seriesCnt = parseInt(e.target.getAttribute("rel"), 10) - 1;
      const isHidden = e.target.getAttribute("data:collapsed") === "true";
      const legendClick = this.w.config.chart.events.legendClick;
      if (typeof legendClick === "function") {
        legendClick(this.ctx, seriesCnt, this.w);
      }
      this.ctx.events.fireEvent("legendClick", [this.ctx, seriesCnt, this.w]);
      const markerClick = this.w.config.legend.markers.onClick;
      if (typeof markerClick === "function" && e.target.classList.contains("apexcharts-legend-marker")) {
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
