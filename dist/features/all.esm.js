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
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
/*!
 * ApexCharts v6.5.0
 * (c) 2018-2026 ApexCharts
 */
import * as ApexCharts from "apexcharts/core";
import ApexCharts__default from "apexcharts/core";
const apexchartsLegendCSS = ".apexcharts-flip-y {\n  transform: scaleY(-1) translateY(-100%);\n  transform-origin: top;\n  transform-box: fill-box;\n}\n.apexcharts-flip-x {\n  transform: scaleX(-1);\n  transform-origin: center;\n  transform-box: fill-box;\n}\n.apexcharts-legend {\n  display: flex;\n  overflow: auto;\n  padding: 0 10px;\n}\n.apexcharts-legend.apexcharts-legend-group-horizontal {\n  flex-direction: column;\n}\n.apexcharts-legend-group {\n  display: flex;\n}\n.apexcharts-legend-group-vertical {\n  flex-direction: column-reverse;\n}\n.apexcharts-legend.apx-legend-position-bottom, .apexcharts-legend.apx-legend-position-top {\n  flex-wrap: wrap\n}\n.apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  flex-direction: column;\n  bottom: 0;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-left, .apexcharts-legend.apx-legend-position-top.apexcharts-align-left, .apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  justify-content: flex-start;\n  align-items: flex-start;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-center, .apexcharts-legend.apx-legend-position-top.apexcharts-align-center {\n  justify-content: center;\n  align-items: center;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-right, .apexcharts-legend.apx-legend-position-top.apexcharts-align-right {\n  justify-content: flex-end;\n  align-items: flex-end;\n}\n.apexcharts-legend-series {\n  cursor: pointer;\n  line-height: normal;\n  display: flex;\n  align-items: center;\n}\n.apexcharts-legend-text {\n  position: relative;\n  font-size: 14px;\n}\n.apexcharts-legend-text *, .apexcharts-legend-marker * {\n  pointer-events: none;\n}\n.apexcharts-legend-marker {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  margin-right: 1px;\n}\n\n.apexcharts-legend-series.apexcharts-no-click {\n  cursor: auto;\n}\n.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {\n  display: none !important;\n}\n.apexcharts-inactive-legend {\n  opacity: 0.45;\n} ";
const AxesUtils = ApexCharts.__apex_axes_AxesUtils;
const Data = ApexCharts.__apex_Data;
const Series = ApexCharts.__apex_Series;
const Utils = ApexCharts.__apex_Utils;
const Environment = ApexCharts.__apex_Environment_Environment;
const SVGNS = ApexCharts.__apex_math_SVGNS;
class Exports {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
  }
  /**
   * @param {string} svgString
   */
  svgStringToNode(svgString) {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    return svgDoc.documentElement;
  }
  /**
   * @param {any} svg
   * @param {number} scale
   */
  scaleSvgNode(svg, scale) {
    const svgWidth = parseFloat(svg.getAttributeNS(null, "width"));
    const svgHeight = parseFloat(svg.getAttributeNS(null, "height"));
    svg.setAttributeNS(null, "width", svgWidth * scale);
    svg.setAttributeNS(null, "height", svgHeight * scale);
    svg.setAttributeNS(null, "viewBox", "0 0 " + svgWidth + " " + svgHeight);
  }
  /**
   * Inline any Strata canvas series layer into the clone as an SVG `<image>`.
   * A serialized `<canvas>` loses its bitmap, so a canvas-mode export would drop
   * the series; an `<image>` carrying the canvas `toDataURL()` preserves it in
   * place. Because it replaces the `<foreignObject>` at the same DOM position,
   * the grid-behind / annotations-in-front z-order is retained automatically.
   * No-op in SVG mode (no series canvas present).
   * @param {any} clonedNode the cloned elWrap about to be serialized
   */
  inlineCanvasLayers(clonedNode) {
    const w = this.w;
    const XLINK = "http://www.w3.org/1999/xlink";
    const origCanvases = w.dom.elWrap.querySelectorAll(
      ".apexcharts-series-canvas"
    );
    if (!origCanvases.length) return;
    const clonedFOs = clonedNode.querySelectorAll(".apexcharts-canvas-series");
    for (let i = 0; i < origCanvases.length && i < clonedFOs.length; i++) {
      let dataURL;
      try {
        dataURL = /** @type {HTMLCanvasElement} */
        origCanvases[i].toDataURL();
      } catch (e) {
        continue;
      }
      const fo = clonedFOs[i];
      const img = document.createElementNS(SVGNS, "image");
      img.setAttribute("x", fo.getAttribute("x") || "0");
      img.setAttribute("y", fo.getAttribute("y") || "0");
      img.setAttribute("width", fo.getAttribute("width") || "0");
      img.setAttribute("height", fo.getAttribute("height") || "0");
      img.setAttribute("href", dataURL);
      img.setAttributeNS(XLINK, "xlink:href", dataURL);
      if (fo.parentNode) fo.parentNode.replaceChild(img, fo);
    }
  }
  /**
   * @param {number} [_scale]
   */
  getSvgString(_scale) {
    return new Promise((resolve) => {
      const w = this.w;
      let scale = _scale || w.config.chart.toolbar.export.scale || w.config.chart.toolbar.export.width / w.globals.svgWidth;
      if (!scale) {
        scale = 1;
      }
      const width = w.globals.svgWidth * scale;
      const height = w.globals.svgHeight * scale;
      const clonedNode = (
        /** @type {HTMLElement} */
        w.dom.elWrap.cloneNode(true)
      );
      clonedNode.style.width = width + "px";
      clonedNode.style.height = height + "px";
      this.inlineCanvasLayers(clonedNode);
      const serializedNode = new XMLSerializer().serializeToString(clonedNode);
      const shouldIncludeLegendStyles = w.config.legend.show && w.dom.elLegendWrap && w.dom.elLegendWrap.children.length > 0;
      let exportStyles = `
        .apexcharts-tooltip, .apexcharts-toolbar, .apexcharts-xaxistooltip, .apexcharts-yaxistooltip, .apexcharts-xcrosshairs, .apexcharts-ycrosshairs, .apexcharts-zoom-rect, .apexcharts-selection-rect {
          display: none;
        }
      `;
      if (shouldIncludeLegendStyles) {
        exportStyles += apexchartsLegendCSS;
      }
      let svgString = `
        <svg xmlns="http://www.w3.org/2000/svg"
          version="1.1"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          class="apexcharts-svg"
          xmlns:data="ApexChartsNS"
          transform="translate(0, 0)"
          width="${w.globals.svgWidth}px" height="${w.globals.svgHeight}px">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px; height:${height}px;">
            <style type="text/css">
              ${exportStyles}
            </style>
              ${serializedNode}
            </div>
          </foreignObject>
        </svg>
      `;
      const svgNode = this.svgStringToNode(svgString);
      if (scale !== 1) {
        this.scaleSvgNode(svgNode, scale);
      }
      this.convertImagesToBase64(svgNode).then(() => {
        svgString = new XMLSerializer().serializeToString(svgNode);
        resolve(svgString.replace(/&nbsp;/g, "&#160;"));
      });
    });
  }
  /**
   * @param {any} svgNode
   */
  convertImagesToBase64(svgNode) {
    const images = svgNode.getElementsByTagName("image");
    const promises = Array.from(images).map((img) => {
      const href = img.getAttributeNS("http://www.w3.org/1999/xlink", "href");
      if (href && !href.startsWith("data:")) {
        return this.getBase64FromUrl(href).then((base64) => {
          img.setAttributeNS("http://www.w3.org/1999/xlink", "href", base64);
        }).catch((error) => {
          console.error("Error converting image to base64:", error);
        });
      }
      return Promise.resolve();
    });
    return Promise.all(promises);
  }
  /**
   * @param {string} url
   */
  getBase64FromUrl(url) {
    if (Environment.isSSR()) return Promise.resolve(url);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL());
      };
      img.onerror = reject;
      img.src = url;
    });
  }
  svgUrl() {
    return new Promise((resolve) => {
      this.getSvgString().then((svgData) => {
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8"
        });
        resolve(URL.createObjectURL(svgBlob));
      });
    });
  }
  /**
   * @param {Record<string, any> | undefined} options
   */
  dataURI(options) {
    if (Environment.isSSR()) return Promise.resolve({ imgURI: "" });
    return new Promise((resolve) => {
      const w = this.w;
      const scale = options ? options.scale || options.width / w.globals.svgWidth : 1;
      const canvas = document.createElement("canvas");
      canvas.width = w.globals.svgWidth * scale;
      canvas.height = parseInt(w.dom.elWrap.style.height, 10) * scale;
      const canvasBg = w.config.chart.background === "transparent" || !w.config.chart.background ? "#fff" : w.config.chart.background;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, canvas.width * scale, canvas.height * scale);
      this.getSvgString(scale).then((svgData) => {
        const svgUrl = "data:image/svg+xml," + encodeURIComponent(svgData);
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const edgeCanvas = canvas;
          if (edgeCanvas.msToBlob) {
            const blob = edgeCanvas.msToBlob();
            resolve({ blob });
          } else {
            const imgURI = canvas.toDataURL("image/png");
            resolve({ imgURI });
          }
        };
        img.src = svgUrl;
      });
    });
  }
  exportToSVG() {
    this.svgUrl().then((url) => {
      this.triggerDownload(
        url,
        this.w.config.chart.toolbar.export.svg.filename,
        ".svg"
      );
    });
  }
  exportToPng() {
    const scale = this.w.config.chart.toolbar.export.scale;
    const width = this.w.config.chart.toolbar.export.width;
    const option = scale ? { scale } : width ? { width } : void 0;
    this.dataURI(option).then(({ imgURI, blob }) => {
      if (blob) {
        navigator.msSaveOrOpenBlob(blob, this.w.globals.chartID + ".png");
      } else {
        this.triggerDownload(
          imgURI,
          this.w.config.chart.toolbar.export.png.filename,
          ".png"
        );
      }
    });
  }
  /** @param {{ series?: any, fileName?: any, columnDelimiter?: string, lineDelimiter?: string }} opts */
  exportToCSV({
    series,
    fileName,
    columnDelimiter = ",",
    lineDelimiter = "\n"
  }) {
    const w = this.w;
    if (!series) series = w.config.series;
    let columns = [];
    const rows = [];
    let result = "";
    const universalBOM = "\uFEFF";
    const gSeries = w.seriesData.series.map((s, i) => {
      return w.globals.collapsedSeriesIndices.indexOf(i) === -1 ? s : [];
    });
    const getFormattedCategory = (cat) => {
      if (typeof w.config.chart.toolbar.export.csv.categoryFormatter === "function") {
        return w.config.chart.toolbar.export.csv.categoryFormatter(cat);
      }
      if (w.config.xaxis.type === "datetime" && String(cat).length >= 10) {
        return new Date(cat).toDateString();
      }
      return Utils.isNumber(cat) ? cat : cat.split(columnDelimiter).join("");
    };
    const getFormattedValue = (value) => {
      return typeof w.config.chart.toolbar.export.csv.valueFormatter === "function" ? w.config.chart.toolbar.export.csv.valueFormatter(value) : value;
    };
    const seriesMaxDataLength = Math.max(
      ...series.map((s) => {
        return s.data ? s.data.length : 0;
      })
    );
    const dataFormat = new Data(this.w);
    const axesUtils = new AxesUtils(this.w, {
      theme: this.ctx.theme,
      timeScale: this.ctx.timeScale
    });
    const getCat = (i) => {
      let cat = "";
      if (!w.globals.axisCharts) {
        cat = w.config.labels[i];
      } else {
        if (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) {
          if (w.globals.isBarHorizontal) {
            const lbFormatter = w.formatters.yLabelFormatters[0];
            const sr = new Series(this.ctx.w);
            const activeSeries = sr.getActiveConfigSeriesIndex();
            cat = lbFormatter(w.labelData.labels[i], {
              seriesIndex: activeSeries,
              dataPointIndex: i,
              w
            });
          } else {
            cat = axesUtils.getLabel(
              w.labelData.labels,
              w.labelData.timescaleLabels,
              0,
              i
            ).text;
          }
        }
        if (w.config.xaxis.type === "datetime") {
          if (w.config.xaxis.categories.length) {
            cat = w.config.xaxis.categories[i];
          } else if (w.config.labels.length) {
            cat = w.config.labels[i];
          }
        }
      }
      if (cat === null) return "nullvalue";
      if (Array.isArray(cat)) {
        cat = cat.join(" ");
      }
      return Utils.isNumber(cat) ? cat : cat.split(columnDelimiter).join("");
    };
    const getEmptyDataForCsvColumn = () => {
      return [...Array(seriesMaxDataLength)].map(() => "");
    };
    const handleAxisRowsColumns = (s, sI) => {
      var _a, _b, _c, _d, _e, _f;
      if (columns.length && sI === 0) {
        rows.push(columns.join(columnDelimiter));
      }
      if (s.data) {
        s.data = s.data.length && s.data || getEmptyDataForCsvColumn();
        for (let i = 0; i < s.data.length; i++) {
          columns = [];
          let cat = getCat(i);
          if (cat === "nullvalue") continue;
          if (!cat) {
            if (dataFormat.isFormatXY()) {
              cat = series[sI].data[i].x;
            } else if (dataFormat.isFormat2DArray()) {
              cat = series[sI].data[i] ? series[sI].data[i][0] : "";
            }
          }
          if (sI === 0) {
            columns.push(getFormattedCategory(cat));
            for (let ci = 0; ci < w.seriesData.series.length; ci++) {
              const value = dataFormat.isFormatXY() ? (_a = series[ci].data[i]) == null ? void 0 : _a.y : gSeries[ci][i];
              columns.push(getFormattedValue(value));
            }
          }
          if (w.config.chart.type === "candlestick" || s.type && s.type === "candlestick") {
            columns.pop();
            columns.push(w.candleData.seriesCandleO[sI][i]);
            columns.push(w.candleData.seriesCandleH[sI][i]);
            columns.push(w.candleData.seriesCandleL[sI][i]);
            columns.push(w.candleData.seriesCandleC[sI][i]);
          }
          if (w.config.chart.type === "boxPlot" || s.type && s.type === "boxPlot") {
            columns.pop();
            columns.push(w.candleData.seriesCandleO[sI][i]);
            columns.push(w.candleData.seriesCandleH[sI][i]);
            columns.push(w.candleData.seriesCandleM[sI][i]);
            columns.push(w.candleData.seriesCandleL[sI][i]);
            columns.push(w.candleData.seriesCandleC[sI][i]);
          }
          if (w.config.chart.type === "rangeBar") {
            columns.pop();
            columns.push(w.rangeData.seriesRangeStart[sI][i]);
            columns.push(w.rangeData.seriesRangeEnd[sI][i]);
          }
          if (w.config.chart.type === "violin" || s.type && s.type === "violin") {
            columns.pop();
            columns.push((_b = w.violinData.seriesViolinMin[sI]) == null ? void 0 : _b[i]);
            columns.push((_c = w.violinData.seriesViolinMax[sI]) == null ? void 0 : _c[i]);
            columns.push((_f = (_e = (_d = w.violinData.seriesViolinPoints[sI]) == null ? void 0 : _d[i]) == null ? void 0 : _e.length) != null ? _f : 0);
          }
          if (columns.length) {
            rows.push(columns.join(columnDelimiter));
          }
        }
      }
    };
    const handleUnequalXValues = () => {
      const categories = /* @__PURE__ */ new Set();
      const data = {};
      series.forEach((s, sI) => {
        s == null ? void 0 : s.data.forEach((dataItem) => {
          let cat, value;
          if (dataFormat.isFormatXY()) {
            cat = dataItem.x;
            value = dataItem.y;
          } else if (dataFormat.isFormat2DArray()) {
            cat = dataItem[0];
            value = dataItem[1];
          } else {
            return;
          }
          if (!/** @type {Record<string,any>} */
          data[cat]) {
            data[cat] = Array(
              series.length
            ).fill("");
          }
          data[cat][sI] = getFormattedValue(value);
          categories.add(cat);
        });
      });
      if (columns.length) {
        rows.push(columns.join(columnDelimiter));
      }
      Array.from(categories).sort().forEach((cat) => {
        rows.push([
          getFormattedCategory(cat),
          /** @type {Record<string,any>} */
          data[cat].join(columnDelimiter)
        ]);
      });
    };
    columns.push(w.config.chart.toolbar.export.csv.headerCategory);
    if (w.config.chart.type === "boxPlot") {
      columns.push("minimum");
      columns.push("q1");
      columns.push("median");
      columns.push("q3");
      columns.push("maximum");
    } else if (w.config.chart.type === "candlestick") {
      columns.push("open");
      columns.push("high");
      columns.push("low");
      columns.push("close");
    } else if (w.config.chart.type === "rangeBar") {
      columns.push("minimum");
      columns.push("maximum");
    } else if (w.config.chart.type === "violin") {
      columns.push("minimum");
      columns.push("maximum");
      columns.push("observations");
    } else {
      series.map((s, sI) => {
        const sname = (s.name ? s.name : `series-${sI}`) + "";
        if (w.globals.axisCharts) {
          columns.push(
            sname.split(columnDelimiter).join("") ? sname.split(columnDelimiter).join("") : `series-${sI}`
          );
        }
      });
    }
    if (!w.globals.axisCharts) {
      columns.push(w.config.chart.toolbar.export.csv.headerValue);
      rows.push(columns.join(columnDelimiter));
    }
    if (!w.globals.allSeriesHasEqualX && w.globals.axisCharts && !w.config.xaxis.categories.length && !w.config.labels.length) {
      handleUnequalXValues();
    } else {
      series.map((s, sI) => {
        if (w.globals.axisCharts) {
          handleAxisRowsColumns(s, sI);
        } else {
          columns = [];
          columns.push(getFormattedCategory(w.labelData.labels[sI]));
          columns.push(getFormattedValue(gSeries[sI]));
          rows.push(columns.join(columnDelimiter));
        }
      });
    }
    result += rows.join(lineDelimiter);
    this.triggerDownload(
      "data:text/csv; charset=utf-8," + encodeURIComponent(universalBOM + result),
      fileName ? fileName : w.config.chart.toolbar.export.csv.filename,
      ".csv"
    );
  }
  /**
   * @param {string} href
   * @param {string} filename
   * @param {string} ext
   */
  triggerDownload(href, filename, ext) {
    if (Environment.isSSR()) return;
    const downloadLink = document.createElement("a");
    downloadLink.href = href;
    downloadLink.download = (filename ? filename : this.w.globals.chartID) + ext;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }
}
ApexCharts__default.registerFeatures({ exports: Exports });
const CoreUtils = ApexCharts.__apex_CoreUtils;
const Dimensions = ApexCharts.__apex_dimensions_Dimensions;
const Graphics = ApexCharts.__apex_Graphics;
let Helpers$1 = class Helpers {
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
};
const BrowserAPIs = ApexCharts.__apex_BrowserAPIs_BrowserAPIs;
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
const Markers = ApexCharts.__apex_Markers;
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
    this.legendHelpers = new Helpers$1(this);
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
ApexCharts__default.registerFeatures({ legend: Legend });
const icoPan = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M5 9 2 12l3 3"/>\n    <path d="M9 5l3-3 3 3"/>\n    <path d="M15 19l-3 3-3-3"/>\n    <path d="M19 9l3 3-3 3"/>\n    <path d="M2 12h20"/>\n    <path d="M12 2v20"/>\n</svg>\n';
const icoZoom = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <circle cx="11" cy="11" r="7"/>\n    <path d="m21 21-4.3-4.3M8 11h6M11 8v6"/>\n</svg>\n';
const icoReset = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>\n    <path d="M3 3v5h5"/>\n</svg>\n';
const icoZoomIn = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M12 5v14M5 12h14"/>\n</svg>\n';
const icoZoomOut = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M5 12h14"/>\n</svg>\n';
const icoSelect = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M5 3a2 2 0 0 0-2 2"/>\n    <path d="M19 3a2 2 0 0 1 2 2"/>\n    <path d="M21 19a2 2 0 0 1-2 2"/>\n    <path d="M5 21a2 2 0 0 1-2-2"/>\n    <path d="M9 3h1M14 3h1M9 21h1M14 21h1M3 9v1M3 14v1M21 9v1M21 14v1"/>\n</svg>\n';
const icoMeasure = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/>\n    <path d="m14.5 12.5 2-2"/>\n    <path d="m11.5 9.5 2-2"/>\n    <path d="m8.5 6.5 2-2"/>\n    <path d="m17.5 15.5 2-2"/>\n</svg>\n';
const icoMenu = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n    <path d="M4 6h16M4 12h16M4 18h16"/>\n</svg>\n';
class Toolbar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.ev = this.w.config.chart.events;
    this.selectedClass = "apexcharts-selected";
    this.localeValues = this.w.globals.locale.toolbar;
    this.minX = w.globals.minX;
    this.maxX = w.globals.maxX;
    this.elZoom = null;
    this.elZoomIn = null;
    this.elZoomOut = null;
    this.elPan = null;
    this.elSelection = null;
    this.elMeasure = null;
    this.elZoomReset = null;
    this.elMenuIcon = null;
    this.elMenu = null;
    this.elMenuItems = [];
    this.t = null;
  }
  createToolbar() {
    var _a, _b;
    const w = this.w;
    const createDiv = () => {
      return BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div");
    };
    const createBtn = () => {
      const btn = (
        /** @type {HTMLButtonElement} */
        BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "button")
      );
      btn.setAttribute("type", "button");
      return btn;
    };
    const elToolbarWrap = createDiv();
    elToolbarWrap.setAttribute("class", "apexcharts-toolbar");
    elToolbarWrap.style.top = w.config.chart.toolbar.offsetY + "px";
    elToolbarWrap.style.right = -w.config.chart.toolbar.offsetX + 3 + "px";
    w.dom.elWrap.appendChild(elToolbarWrap);
    this.elZoom = createBtn();
    this.elZoomIn = createBtn();
    this.elZoomOut = createBtn();
    this.elPan = createBtn();
    this.elSelection = createBtn();
    this.elMeasure = createBtn();
    this.elZoomReset = createBtn();
    this.elMenuIcon = createBtn();
    this.elMenu = createDiv();
    this.elCustomIcons = [];
    this.t = w.config.chart.toolbar.tools;
    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(createBtn());
      }
    }
    const toolbarControls = [];
    const appendZoomControl = (type, el, ico) => {
      const tool = type.toLowerCase();
      if (this.t[tool] && w.config.chart.zoom.enabled) {
        toolbarControls.push({
          el,
          icon: typeof this.t[tool] === "string" ? this.t[tool] : ico,
          title: (
            /** @type {any} */
            this.localeValues[type]
          ),
          class: `apexcharts-${tool}-icon`
        });
      }
    };
    appendZoomControl("zoomIn", this.elZoomIn, icoZoomIn);
    appendZoomControl("zoomOut", this.elZoomOut, icoZoomOut);
    const zoomSelectionCtrls = (z) => {
      if (this.t[z] && w.config.chart[z].enabled) {
        toolbarControls.push({
          el: z === "zoom" ? this.elZoom : this.elSelection,
          icon: typeof this.t[z] === "string" ? this.t[z] : z === "zoom" ? icoZoom : icoSelect,
          title: (
            /** @type {any} */
            this.localeValues[z === "zoom" ? "selectionZoom" : "selection"]
          ),
          class: `apexcharts-${z}-icon`
        });
      }
    };
    zoomSelectionCtrls("zoom");
    zoomSelectionCtrls("selection");
    if (this.t.pan && w.config.chart.zoom.enabled) {
      toolbarControls.push({
        el: this.elPan,
        icon: typeof this.t.pan === "string" ? this.t.pan : icoPan,
        title: this.localeValues.pan,
        class: "apexcharts-pan-icon"
      });
    }
    if (this.t.measure && w.config.chart.measure && w.config.chart.measure.enabled) {
      toolbarControls.push({
        el: this.elMeasure,
        icon: typeof this.t.measure === "string" ? this.t.measure : icoMeasure,
        title: (
          /** @type {any} */
          this.localeValues.measure || "Measure"
        ),
        class: "apexcharts-measure-icon"
      });
    }
    appendZoomControl("reset", this.elZoomReset, icoReset);
    if (this.t.download) {
      toolbarControls.push({
        el: this.elMenuIcon,
        icon: typeof this.t.download === "string" ? this.t.download : icoMenu,
        title: this.localeValues.menu,
        class: "apexcharts-menu-icon"
      });
    }
    for (let i = 0; i < this.elCustomIcons.length; i++) {
      toolbarControls.push({
        el: this.elCustomIcons[i],
        icon: this.t.customIcons[i].icon,
        title: this.t.customIcons[i].title,
        index: this.t.customIcons[i].index,
        class: "apexcharts-toolbar-custom-icon " + this.t.customIcons[i].class
      });
    }
    toolbarControls.forEach((t, index) => {
      if (t.index) {
        Utils.moveIndexInArray(toolbarControls, index, t.index);
      }
    });
    for (let i = 0; i < toolbarControls.length; i++) {
      Graphics.setAttrs(toolbarControls[i].el, {
        class: toolbarControls[i].class,
        title: toolbarControls[i].title,
        "aria-label": toolbarControls[i].title
      });
      toolbarControls[i].el.innerHTML = toolbarControls[i].icon;
      elToolbarWrap.appendChild(toolbarControls[i].el);
    }
    if (this.elZoom.parentNode) {
      this.elZoom.setAttribute("aria-pressed", String(!!w.interact.zoomEnabled));
    }
    if (this.elSelection.parentNode) {
      this.elSelection.setAttribute(
        "aria-pressed",
        String(!!w.interact.selectionEnabled)
      );
    }
    if (this.elPan.parentNode) {
      this.elPan.setAttribute("aria-pressed", String(!!w.interact.panEnabled));
    }
    if (this.elMeasure.parentNode) {
      this.elMeasure.setAttribute(
        "aria-pressed",
        String(!!w.interact.measureEnabled)
      );
    }
    if (this.elMenuIcon.parentNode) {
      this.elMenuIcon.setAttribute("aria-haspopup", "true");
      this.elMenuIcon.setAttribute("aria-expanded", "false");
    }
    this._createHamburgerMenu(elToolbarWrap);
    if (w.interact.zoomEnabled) {
      this.elZoom.classList.add(this.selectedClass);
    } else if (w.interact.panEnabled) {
      this.elPan.classList.add(this.selectedClass);
    } else if (w.interact.selectionEnabled) {
      this.elSelection.classList.add(this.selectedClass);
    } else if (w.interact.measureEnabled && this.elMeasure) {
      this.elMeasure.classList.add(this.selectedClass);
      (_b = (_a = this.ctx.measure) == null ? void 0 : _a.startMeasure) == null ? void 0 : _b.call(_a);
    }
    this.addToolbarEventListeners();
  }
  /**
   * @param {Element} parent
   */
  _createHamburgerMenu(parent) {
    this.elMenuItems = [];
    parent.appendChild(
      /** @type {Node} */
      this.elMenu
    );
    Graphics.setAttrs(this.elMenu, {
      class: "apexcharts-menu",
      role: "menu"
    });
    const menuItems = [
      {
        name: "exportSVG",
        title: this.localeValues.exportToSVG
      },
      {
        name: "exportPNG",
        title: this.localeValues.exportToPNG
      },
      {
        name: "exportCSV",
        title: this.localeValues.exportToCSV
      }
    ];
    for (let i = 0; i < menuItems.length; i++) {
      this.elMenuItems.push(
        BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div")
      );
      this.elMenuItems[i].innerHTML = menuItems[i].title;
      Graphics.setAttrs(this.elMenuItems[i], {
        class: `apexcharts-menu-item ${menuItems[i].name}`,
        title: menuItems[i].title,
        role: "menuitem",
        tabindex: "-1"
      });
      this.elMenu.appendChild(this.elMenuItems[i]);
    }
  }
  addToolbarEventListeners() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    (_a = this.elZoomReset) == null ? void 0 : _a.addEventListener("click", this.handleZoomReset.bind(this));
    (_b = this.elSelection) == null ? void 0 : _b.addEventListener(
      "click",
      this.toggleZoomSelection.bind(this, "selection")
    );
    (_c = this.elZoom) == null ? void 0 : _c.addEventListener(
      "click",
      this.toggleZoomSelection.bind(this, "zoom")
    );
    (_d = this.elZoomIn) == null ? void 0 : _d.addEventListener("click", this.handleZoomIn.bind(this));
    (_e = this.elZoomOut) == null ? void 0 : _e.addEventListener("click", this.handleZoomOut.bind(this));
    (_f = this.elPan) == null ? void 0 : _f.addEventListener("click", this.togglePanning.bind(this));
    (_g = this.elMeasure) == null ? void 0 : _g.addEventListener("click", this.toggleMeasure.bind(this));
    (_h = this.elMenuIcon) == null ? void 0 : _h.addEventListener("click", this.toggleMenu.bind(this));
    this.elMenuItems.forEach((m) => {
      if (m.classList.contains("exportSVG")) {
        m.addEventListener("click", this.handleDownload.bind(this, "svg"));
      } else if (m.classList.contains("exportPNG")) {
        m.addEventListener("click", this.handleDownload.bind(this, "png"));
      } else if (m.classList.contains("exportCSV")) {
        m.addEventListener("click", this.handleDownload.bind(this, "csv"));
      }
    });
    for (let i = 0; i < this.t.customIcons.length; i++) {
      this.elCustomIcons[i].addEventListener(
        "click",
        this.t.customIcons[i].click.bind(this, this.ctx, this.ctx.w)
      );
    }
    const toolbarButtons = [
      this.elZoomReset,
      this.elSelection,
      this.elZoom,
      this.elZoomIn,
      this.elZoomOut,
      this.elPan,
      this.elMeasure,
      this.elMenuIcon,
      ...this.elCustomIcons
    ];
    toolbarButtons.forEach((btn) => {
      btn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const btnClass = btn.className;
          btn.click();
          requestAnimationFrame(() => {
            const baseEl = this.w.dom.baseEl;
            if (!baseEl) return;
            const apexClass = btnClass.split(" ").find((c) => c.startsWith("apexcharts-"));
            if (!apexClass) return;
            const restored = baseEl.querySelector(`.${apexClass}`);
            if (restored) restored.focus();
          });
        }
      });
    });
    (_i = this.elMenuIcon) == null ? void 0 : _i.addEventListener(
      "keydown",
      (e) => {
        var _a2;
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!((_a2 = this.elMenu) == null ? void 0 : _a2.classList.contains("apexcharts-menu-open"))) {
            this.toggleMenu();
          }
          window.setTimeout(() => {
            const idx = e.key === "ArrowDown" ? 0 : this.elMenuItems.length - 1;
            if (this.elMenuItems[idx])
              this.elMenuItems[idx].focus();
          }, 20);
        }
      }
    );
    this.elMenuItems.forEach((m, idx) => {
      m.addEventListener("keydown", (e) => {
        var _a2;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          const next = this.elMenuItems[idx + 1] || this.elMenuItems[0];
          next.focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          const prev = this.elMenuItems[idx - 1] || this.elMenuItems[this.elMenuItems.length - 1];
          prev.focus();
        } else if (e.key === "Escape" || e.key === "Tab") {
          this._closeMenu();
          (_a2 = this.elMenuIcon) == null ? void 0 : _a2.focus();
          if (e.key === "Tab") ;
          else {
            e.preventDefault();
          }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          m.click();
        }
      });
    });
  }
  /**
   * @param {string} type
   */
  toggleZoomSelection(type) {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      const tb = ch.ctx.toolbar;
      const enabledType = type === "selection" ? "selectionEnabled" : "zoomEnabled";
      const wasEnabled = !!ch.w.globals[enabledType];
      tb.toggleOtherControls();
      const el = type === "selection" ? tb.elSelection : tb.elZoom;
      if (!wasEnabled) {
        ch.w.globals[enabledType] = true;
        el.classList.add(tb.selectedClass);
      }
      el.setAttribute("aria-pressed", String(!!ch.w.globals[enabledType]));
    });
  }
  /**
   * Toggle the measure ruler tool. Mutually exclusive with zoom/pan/selection
   * (toggleOtherControls deselects those and disarms any active measure), so a
   * fresh enable arms the ruler via the Measure module's sticky mode.
   */
  toggleMeasure() {
    var _a, _b, _c, _d;
    const w = this.w;
    const enabling = !w.interact.measureEnabled;
    this.toggleOtherControls();
    if (enabling) {
      w.interact.measureEnabled = true;
      (_a = this.elMeasure) == null ? void 0 : _a.classList.add(this.selectedClass);
      (_c = (_b = this.ctx.measure) == null ? void 0 : _b.startMeasure) == null ? void 0 : _c.call(_b);
    }
    (_d = this.elMeasure) == null ? void 0 : _d.setAttribute(
      "aria-pressed",
      String(w.interact.measureEnabled)
    );
  }
  getToolbarIconsReference() {
    const w = this.w;
    if (!this.elZoom) {
      this.elZoom = w.dom.baseEl.querySelector(".apexcharts-zoom-icon");
    }
    if (!this.elPan) {
      this.elPan = w.dom.baseEl.querySelector(".apexcharts-pan-icon");
    }
    if (!this.elSelection) {
      this.elSelection = w.dom.baseEl.querySelector(
        ".apexcharts-selection-icon"
      );
    }
    if (!this.elMeasure) {
      this.elMeasure = w.dom.baseEl.querySelector(".apexcharts-measure-icon");
    }
  }
  /**
   * @param {string} type
   */
  enableZoomPanFromToolbar(type) {
    this.toggleOtherControls();
    type === "pan" ? this.w.interact.panEnabled = true : this.w.interact.zoomEnabled = true;
    const el = type === "pan" ? this.elPan : this.elZoom;
    const el2 = type === "pan" ? this.elZoom : this.elPan;
    if (el) {
      el.classList.add(this.selectedClass);
    }
    if (el2) {
      el2.classList.remove(this.selectedClass);
    }
  }
  togglePanning() {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      const tb = ch.ctx.toolbar;
      const wasEnabled = !!ch.w.interact.panEnabled;
      tb.toggleOtherControls();
      if (!wasEnabled) {
        ch.w.interact.panEnabled = true;
        tb.elPan.classList.add(tb.selectedClass);
      }
      tb.elPan.setAttribute("aria-pressed", String(!!ch.w.interact.panEnabled));
    });
  }
  toggleOtherControls() {
    var _a, _b, _c;
    const w = this.w;
    w.interact.panEnabled = false;
    w.interact.zoomEnabled = false;
    w.interact.selectionEnabled = false;
    if (w.interact.measureEnabled) {
      w.interact.measureEnabled = false;
      (_b = (_a = this.ctx.measure) == null ? void 0 : _a.stopMeasure) == null ? void 0 : _b.call(_a);
      (_c = this.elMeasure) == null ? void 0 : _c.setAttribute("aria-pressed", "false");
    }
    this.getToolbarIconsReference();
    const toggleEls = [this.elPan, this.elSelection, this.elZoom, this.elMeasure];
    toggleEls.forEach((el) => {
      if (el) {
        el.classList.remove(this.selectedClass);
      }
    });
  }
  /**
   * Read the current x-range from globals at click time.
   * Toolbar instance is kept alive across updates (Phase 8 lazy
   * instantiation), so cached this.minX/maxX go stale after a zoom.
   * @returns {{minX: number, maxX: number}}
   */
  _currentXRange() {
    const w = this.w;
    if (w.axisFlags.isRangeBar) {
      return { minX: w.globals.minY, maxX: w.globals.maxY };
    }
    return { minX: w.globals.minX, maxX: w.globals.maxX };
  }
  handleZoomIn() {
    const w = this.w;
    const { minX, maxX } = this._currentXRange();
    this.minX = minX;
    this.maxX = maxX;
    const centerX = (minX + maxX) / 2;
    const newMinX = (minX + centerX) / 2;
    const newMaxX = (maxX + centerX) / 2;
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.interact.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  handleZoomOut() {
    const w = this.w;
    const { minX, maxX } = this._currentXRange();
    this.minX = minX;
    this.maxX = maxX;
    if (w.config.xaxis.type === "datetime" && new Date(minX).getUTCFullYear() < 1e3) {
      return;
    }
    const centerX = (minX + maxX) / 2;
    const newMinX = minX - (centerX - minX);
    const newMaxX = maxX - (centerX - maxX);
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.interact.disableZoomOut) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  /**
   * @param {number} newMinX
   * @param {number} newMaxX
   */
  _getNewMinXMaxX(newMinX, newMaxX) {
    const shouldFloor = this.w.config.xaxis.convertedCatToNumeric;
    return {
      minX: shouldFloor ? Math.floor(newMinX) : newMinX,
      maxX: shouldFloor ? Math.floor(newMaxX) : newMaxX
    };
  }
  /**
   * @param {number} newMinX
   * @param {number} newMaxX
   */
  zoomUpdateOptions(newMinX, newMaxX) {
    const w = this.w;
    if (newMinX === void 0 && newMaxX === void 0) {
      this.handleZoomReset();
      return;
    }
    if (w.config.xaxis.convertedCatToNumeric) {
      if (newMinX < 1) {
        newMinX = 1;
        newMaxX = w.globals.dataPoints;
      }
      if (newMaxX - newMinX < 2) {
        return;
      }
    }
    let xaxis = {
      min: newMinX,
      max: newMaxX
    };
    const beforeZoomRange = this.getBeforeZoomRange(
      xaxis,
      /** @type {any} */
      void 0
    );
    if (beforeZoomRange) {
      xaxis = beforeZoomRange.xaxis;
    }
    const options = {
      xaxis
    };
    if (!w.globals.initialConfig) return;
    const yaxis = Utils.clone(w.globals.initialConfig.yaxis);
    if (!w.config.chart.group) {
      options.yaxis = yaxis;
    }
    this.w.interact.zoomed = true;
    this.ctx.updateHelpers._updateOptions(
      options,
      false,
      this.w.config.chart.animations.dynamicAnimation.enabled
    );
    this.zoomCallback(xaxis, yaxis);
  }
  /**
   * @param {Record<string, any>} xaxis
   * @param {Record<string, any>} yaxis
   */
  zoomCallback(xaxis, yaxis) {
    if (typeof this.ev.zoomed === "function") {
      this.ev.zoomed(this.ctx, { xaxis, yaxis });
      this.ctx.events.fireEvent("zoomed", { xaxis, yaxis });
    }
  }
  /**
   * @param {Record<string, any>} xaxis
   * @param {Record<string, any>} yaxis
   */
  getBeforeZoomRange(xaxis, yaxis) {
    let newRange = null;
    if (typeof this.ev.beforeZoom === "function") {
      newRange = this.ev.beforeZoom(this, { xaxis, yaxis });
    }
    return newRange;
  }
  toggleMenu() {
    window.setTimeout(() => {
      var _a, _b, _c;
      if ((_a = this.elMenu) == null ? void 0 : _a.classList.contains("apexcharts-menu-open")) {
        this._closeMenu();
      } else {
        (_b = this.elMenu) == null ? void 0 : _b.classList.add("apexcharts-menu-open");
        (_c = this.elMenuIcon) == null ? void 0 : _c.setAttribute("aria-expanded", "true");
      }
    }, 0);
  }
  _closeMenu() {
    var _a, _b;
    (_a = this.elMenu) == null ? void 0 : _a.classList.remove("apexcharts-menu-open");
    (_b = this.elMenuIcon) == null ? void 0 : _b.setAttribute("aria-expanded", "false");
  }
  /**
   * @param {string} type
   */
  handleDownload(type) {
    const w = this.w;
    const exprt = new Exports(this.w, this.ctx);
    switch (type) {
      case "svg":
        exprt.exportToSVG();
        break;
      case "png":
        exprt.exportToPng();
        break;
      case "csv":
        exprt.exportToCSV({
          series: w.config.series,
          columnDelimiter: w.config.chart.toolbar.export.csv.columnDelimiter
        });
        break;
    }
  }
  handleZoomReset() {
    const charts = this.ctx.getSyncedCharts();
    charts.forEach((ch) => {
      const w = ch.w;
      if (!w.interact.zoomed) return;
      w.globals.lastXAxis.min = w.globals.initialConfig.xaxis.min;
      w.globals.lastXAxis.max = w.globals.initialConfig.xaxis.max;
      ch.updateHelpers.revertDefaultAxisMinMax();
      if (typeof w.config.chart.events.beforeResetZoom === "function") {
        const resetZoomRange = w.config.chart.events.beforeResetZoom(ch, w);
        if (resetZoomRange) {
          ch.updateHelpers.revertDefaultAxisMinMax(resetZoomRange);
        }
      }
      if (typeof w.config.chart.events.zoomed === "function") {
        ch.ctx.toolbar.zoomCallback({
          min: w.config.xaxis.min,
          max: w.config.xaxis.max
        });
      }
      const series = ch.ctx.series.emptyCollapsedSeries(
        Utils.clone(w.globals.initialSeries)
      );
      ch.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
      w.interact.zoomed = false;
    });
  }
  destroy() {
    this.elZoom = null;
    this.elZoomIn = null;
    this.elZoomOut = null;
    this.elPan = null;
    this.elSelection = null;
    this.elMeasure = null;
    this.elZoomReset = null;
    this.elMenuIcon = null;
  }
}
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
}
const Box = ApexCharts.__apex_index_Box;
const WHEEL_ZOOM_PIXELS_PER_2X = 240;
class ZoomPanSelection extends Toolbar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    super(w, ctx);
    this.w = w;
    this.ctx = ctx;
    this.dragged = false;
    this.graphics = new Graphics(this.w);
    this.eventList = [
      "mousedown",
      "mouseleave",
      "mousemove",
      "touchstart",
      "touchmove",
      "mouseup",
      "touchend",
      "wheel"
    ];
    this.clientX = 0;
    this.clientY = 0;
    this.startX = 0;
    this.endX = 0;
    this.dragX = 0;
    this.startY = 0;
    this.endY = 0;
    this.dragY = 0;
    this.moveDirection = "none";
  }
  /** @param {{xyRatios: any}} opts */
  init({ xyRatios }) {
    const w = this.w;
    const me = this;
    this.xyRatios = xyRatios;
    this.zoomRect = this.graphics.drawRect(0, 0, 0, 0);
    this.selectionRect = this.graphics.drawRect(0, 0, 0, 0);
    this.constraints = new Box(0, 0, w.layout.gridWidth, w.layout.gridHeight);
    this.zoomRect.node.classList.add("apexcharts-zoom-rect");
    this.selectionRect.node.classList.add("apexcharts-selection-rect");
    w.dom.Paper.add(this.zoomRect);
    w.dom.Paper.add(this.selectionRect);
    if (w.config.chart.selection.type === "x") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        minY: 0,
        maxX: w.layout.gridWidth,
        maxY: w.layout.gridHeight
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else if (w.config.chart.selection.type === "y") {
      this.slDraggableRect = this.selectionRect.draggable({
        minX: 0,
        maxX: w.layout.gridWidth
      }).on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    } else {
      this.slDraggableRect = this.selectionRect.draggable().on("dragmove.namespace", this.selectionDragging.bind(this, "dragging"));
    }
    this.preselectedSelection();
    this.hoverArea = /** @type {Element} */
    w.dom.baseEl.querySelector(`${w.globals.chartClass} .apexcharts-svg`);
    if (!this.hoverArea) return;
    this.hoverArea.classList.add("apexcharts-zoomable");
    this.eventList.forEach((event) => {
      var _a;
      (_a = this.hoverArea) == null ? void 0 : _a.addEventListener(
        event,
        me.svgMouseEvents.bind(me, xyRatios),
        {
          capture: false,
          passive: true
        }
      );
    });
    if (w.config.chart.zoom.enabled && w.config.chart.zoom.allowMouseWheelZoom) {
      this.hoverArea.addEventListener("wheel", me.mouseWheelEvent.bind(me), {
        capture: false,
        passive: false
      });
    }
    if (this._momentumEnabled()) {
      ["touchstart", "touchmove", "touchend", "touchcancel"].forEach(
        (event) => {
          var _a;
          (_a = this.hoverArea) == null ? void 0 : _a.addEventListener(event, me.momentumTouch.bind(me), {
            capture: false,
            passive: false
          });
        }
      );
    }
  }
  // remove the event listeners which were previously added on hover area
  destroy() {
    if (this.slDraggableRect) {
      this.slDraggableRect.draggable(false);
      this.slDraggableRect.off();
      this.selectionRect.off();
    }
    this.selectionRect = null;
    this.zoomRect = null;
  }
  /**
   * @param {import('../types/internal').XYRatios} xyRatios
   * @param {any} e
   */
  svgMouseEvents(xyRatios, e) {
    const w = this.w;
    const toolbar = this.ctx.toolbar;
    if (w.interact.momentum && w.interact.momentum.busy) return;
    if (this._momentumEnabled() && e.touches && e.touches.length > 1) {
      return;
    }
    const zoomtype = w.interact.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
    const autoSelected = w.config.chart.toolbar.autoSelected;
    if (autoSelected !== "measure") {
      if (e.shiftKey) {
        this.shiftWasPressed = true;
        toolbar.enableZoomPanFromToolbar(autoSelected === "pan" ? "zoom" : "pan");
      } else {
        if (this.shiftWasPressed) {
          toolbar.enableZoomPanFromToolbar(autoSelected);
          this.shiftWasPressed = false;
        }
      }
    }
    if (!e.target) return;
    const tc = e.target.classList;
    let pc;
    if (e.target.parentNode && e.target.parentNode !== null) {
      pc = e.target.parentNode.classList;
    }
    const falsePositives = tc.contains("apexcharts-legend-marker") || tc.contains("apexcharts-legend-text") || pc && pc.contains("apexcharts-toolbar");
    if (falsePositives) return;
    this.clientX = e.type === "touchmove" || e.type === "touchstart" ? e.touches[0].clientX : e.type === "touchend" ? e.changedTouches[0].clientX : e.clientX;
    this.clientY = e.type === "touchmove" || e.type === "touchstart" ? e.touches[0].clientY : e.type === "touchend" ? e.changedTouches[0].clientY : e.clientY;
    if (e.type === "mousedown" && e.which === 1 || e.type === "touchstart") {
      const gridRectDim = this._gridRect();
      if (!gridRectDim) return;
      this.startX = this._screenXToPlotPx(this.clientX);
      this.startY = this.clientY - gridRectDim.top;
      this.dragged = false;
      this.w.interact.mousedown = true;
    }
    if (e.type === "mousemove" && e.which === 1 || e.type === "touchmove") {
      this.dragged = true;
      if (w.interact.panEnabled) {
        w.interact.selection = null;
        if (this.w.interact.mousedown) {
          this.panDragging({
            context: this,
            zoomtype,
            xyRatios: this.xyRatios
          });
        }
      } else {
        if (this.w.interact.mousedown && w.interact.zoomEnabled || this.w.interact.mousedown && w.interact.selectionEnabled) {
          this.selection = this.selectionDrawing({
            context: this,
            zoomtype
          });
        }
      }
    }
    if (e.type === "mouseup" || e.type === "touchend" || e.type === "mouseleave") {
      this.handleMouseUp({ zoomtype });
    }
    this.makeSelectionRectDraggable();
  }
  /** @param {{ zoomtype?: any, isResized?: any }} opts */
  handleMouseUp({ zoomtype, isResized }) {
    const w = this.w;
    const gridRectDim = this._gridRect();
    if (gridRectDim && (this.w.interact.mousedown || isResized)) {
      this.endX = this._screenXToPlotPx(this.clientX);
      this.endY = this.clientY - gridRectDim.top;
      this.dragX = Math.abs(this.endX - this.startX);
      this.dragY = Math.abs(this.endY - this.startY);
      if (w.interact.zoomEnabled || w.interact.selectionEnabled) {
        this.selectionDrawn({
          context: this,
          zoomtype
        });
      }
    }
    if (w.interact.zoomEnabled) {
      this.hideSelectionRect(this.selectionRect);
    }
    this.dragged = false;
    this.w.interact.mousedown = false;
  }
  // ---------------------------------------------------------------------------
  // Wheel zoom: continuous, cursor-anchored zoom on mouse wheel / trackpad.
  //
  // Each wheel event multiplies a pending zoom factor scaled to its deltaY (so
  // a trackpad's stream of tiny deltas and a discrete wheel's ±100 notches both
  // feel proportional), and the accumulated factor is applied at most once per
  // animation frame through the same immediate, animation-free fast path the
  // touch pinch uses (_applyXRange). Deliberately instant, trading-chart style:
  // no per-step morph and no easing between steps (an animated variant was
  // tried and rejected). The original implementation instead ran a fixed
  // 0.5x/1.5x animated update at most once per 400ms and dropped every wheel
  // event in between, which read as lag on continuous scrolling.
  //
  // Like Momentum (see the comment above momentumTouch), applying a frame
  // triggers _updateOptions, which destroys and recreates this instance
  // mid-gesture, so all wheel-gesture state lives on w.interact.wheel rather
  // than on the instance.
  // ---------------------------------------------------------------------------
  /** Lazily-created, re-render-surviving wheel-gesture state. */
  _wheel() {
    const it = this.w.interact;
    if (!it.wheel) {
      it.wheel = {
        factor: 1,
        clientX: 0,
        /** @type {number|null} */
        rafId: null,
        /** @type {any} */
        endTimer: null
      };
    }
    return it.wheel;
  }
  /**
   * @param {any} e
   */
  mouseWheelEvent(e) {
    e.preventDefault();
    const st = this._wheel();
    let dy = e.deltaY;
    if (e.deltaMode === 1) dy *= 33;
    else if (e.deltaMode === 2) dy *= 330;
    st.factor *= Math.pow(2, dy / WHEEL_ZOOM_PIXELS_PER_2X);
    st.clientX = e.clientX;
    if (st.rafId == null) {
      st.rafId = requestAnimationFrame(() => this._applyWheelZoom());
    }
    if (st.endTimer) clearTimeout(st.endTimer);
    st.endTimer = setTimeout(() => this._endWheelZoom(), 150);
  }
  /**
   * Apply the zoom factor accumulated since the last animation frame, keeping
   * the data value under the cursor pinned (both zooming in and out).
   */
  _applyWheelZoom() {
    const w = this.w;
    const st = this._wheel();
    st.rafId = null;
    const scale = st.factor;
    st.factor = 1;
    if (scale === 1 || w.globals.isDestroyed) return;
    const gridRectDim = this._gridRect();
    if (!gridRectDim || !gridRectDim.width) return;
    const { min, max } = this._currentXWindow();
    const range = max - min;
    const mouseX = Math.min(
      Math.max((st.clientX - gridRectDim.left) / gridRectDim.width, 0),
      1
    );
    let newRange = range * scale;
    const bounds = this._clampBounds();
    if (bounds) {
      const minXDiff = w.globals.minXDiff > 0 && isFinite(w.globals.minXDiff) ? w.globals.minXDiff : 0;
      const minRange = Math.max(minXDiff * 2, (bounds.max - bounds.min) * 1e-6);
      if (newRange < minRange) newRange = minRange;
      if (newRange > bounds.max - bounds.min) newRange = bounds.max - bounds.min;
    }
    const anchor = min + mouseX * range;
    let newMinX = anchor - mouseX * newRange;
    let newMaxX = newMinX + newRange;
    const eps = range * 1e-9;
    if (Math.abs(newMinX - min) < eps && Math.abs(newMaxX - max) < eps) return;
    if (isNaN(newMinX) || isNaN(newMaxX)) return;
    const beforeZoomRange = this.getBeforeZoomRange(
      { min: newMinX, max: newMaxX },
      /** @type {any} */
      void 0
    );
    if (beforeZoomRange && beforeZoomRange.xaxis) {
      newMinX = beforeZoomRange.xaxis.min;
      newMaxX = beforeZoomRange.xaxis.max;
    }
    this._applyXRange(newMinX, newMaxX, true);
  }
  /** Fire the zoomed callback once the wheel gesture settles (mirrors _endPinch). */
  _endWheelZoom() {
    const w = this.w;
    const st = this._wheel();
    st.endTimer = null;
    if (w.globals.isDestroyed || !w.interact.zoomed) return;
    const { min, max } = this._currentXWindow();
    const yaxis = w.globals.initialConfig ? Utils.clone(w.globals.initialConfig.yaxis) : [];
    const toolbar = this.ctx.toolbar;
    if (toolbar) toolbar.zoomCallback({ min, max }, yaxis);
  }
  makeSelectionRectDraggable() {
    const w = this.w;
    if (!this.selectionRect) return;
    const rectDim = this.selectionRect.node.getBoundingClientRect();
    if (rectDim.width > 0 && rectDim.height > 0) {
      this.selectionRect.select(false).resize(false);
      this.selectionRect.select({
        createRot: () => {
        },
        updateRot: () => {
        },
        createHandle: (group, p, index, pointArr, handleName) => {
          if (handleName === "l" || handleName === "r")
            return group.circle(8).css({ "stroke-width": 1, stroke: "#333", fill: "#fff" });
          return group.circle(0);
        },
        updateHandle: (group, p) => {
          return group.center(p[0], p[1]);
        }
      }).resize().on("resize", () => {
        var _a;
        if (w.interact.selectionEnabled) {
          w.interact.selection = {
            x: parseFloat(this.selectionRect.node.getAttribute("x")),
            y: parseFloat(this.selectionRect.node.getAttribute("y")),
            width: parseFloat(this.selectionRect.node.getAttribute("width")),
            height: parseFloat(this.selectionRect.node.getAttribute("height"))
          };
          clearTimeout((_a = this.w.globals.selectionResizeTimer) != null ? _a : void 0);
          this.w.globals.selectionResizeTimer = window.setTimeout(() => {
            this._emitSelectionFromRect();
          }, 30);
        } else {
          const zoomtype = w.interact.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
          this.handleMouseUp({ zoomtype, isResized: true });
        }
      });
    }
  }
  preselectedSelection() {
    const w = this.w;
    const xyRatios = this.xyRatios;
    if (!w.interact.zoomEnabled) {
      if (typeof w.interact.selection !== "undefined" && w.interact.selection !== null) {
        this.drawSelectionRect(__spreadProps(__spreadValues({}, w.interact.selection), {
          translateX: w.layout.translateX,
          translateY: w.layout.translateY
        }));
      } else {
        if (w.config.chart.selection.xaxis.min !== void 0 && w.config.chart.selection.xaxis.max !== void 0) {
          let x = AxisMapping.dataXToPx(w, w.config.chart.selection.xaxis.min);
          let width = AxisMapping.dataXToPx(w, w.config.chart.selection.xaxis.max) - x;
          if (w.axisFlags.isRangeBar) {
            x = (w.config.chart.selection.xaxis.min - w.globals.yAxisScale[0].niceMin) / xyRatios.invertedYRatio;
            width = (w.config.chart.selection.xaxis.max - w.config.chart.selection.xaxis.min) / xyRatios.invertedYRatio;
          }
          const selectionRect = {
            x,
            y: 0,
            width,
            height: w.layout.gridHeight,
            translateX: w.layout.translateX,
            translateY: w.layout.translateY,
            selectionEnabled: true
          };
          this.drawSelectionRect(selectionRect);
          this.makeSelectionRectDraggable();
          if (typeof w.config.chart.events.selection === "function") {
            w.config.chart.events.selection(this.ctx, {
              xaxis: {
                min: w.config.chart.selection.xaxis.min,
                max: w.config.chart.selection.xaxis.max
              },
              yaxis: {}
            });
          }
        }
      }
    }
  }
  /** @param {{x: any, y: any, width: any, height: any, translateX: any, translateY: any}} opts */
  drawSelectionRect({ x, y, width, height, translateX = 0, translateY = 0 }) {
    const w = this.w;
    const zoomRect = this.zoomRect;
    const selectionRect = this.selectionRect;
    if (this.dragged || w.interact.selection !== null) {
      const scalingAttrs = {
        transform: "translate(" + translateX + ", " + translateY + ")"
      };
      if (w.interact.zoomEnabled && this.dragged) {
        if (width < 0) width = 1;
        zoomRect.attr({
          x,
          y,
          width,
          height,
          fill: w.config.chart.zoom.zoomedArea.fill.color,
          "fill-opacity": w.config.chart.zoom.zoomedArea.fill.opacity,
          stroke: w.config.chart.zoom.zoomedArea.stroke.color,
          "stroke-width": w.config.chart.zoom.zoomedArea.stroke.width,
          "stroke-opacity": w.config.chart.zoom.zoomedArea.stroke.opacity
        });
        Graphics.setAttrs(zoomRect.node, scalingAttrs);
      }
      if (w.interact.selectionEnabled) {
        selectionRect.attr({
          x,
          y,
          width: width > 0 ? width : 0,
          height: height > 0 ? height : 0,
          fill: w.config.chart.selection.fill.color,
          "fill-opacity": w.config.chart.selection.fill.opacity,
          stroke: w.config.chart.selection.stroke.color,
          "stroke-width": w.config.chart.selection.stroke.width,
          "stroke-dasharray": w.config.chart.selection.stroke.dashArray,
          "stroke-opacity": w.config.chart.selection.stroke.opacity
        });
        Graphics.setAttrs(selectionRect.node, scalingAttrs);
      }
    }
  }
  /**
   * @param {any} rect
   */
  hideSelectionRect(rect) {
    if (rect) {
      rect.attr({
        x: 0,
        y: 0,
        width: 0,
        height: 0
      });
    }
  }
  selectionDrawing({ context, zoomtype }) {
    const w = this.w;
    const me = context;
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const startX = me.startX - 1;
    const startY = me.startY;
    let inversedX = false;
    let inversedY = false;
    const left = this._screenXToPlotPx(me.clientX);
    const top = me.clientY - gridRectDim.top;
    let selectionWidth = left - startX;
    let selectionHeight = top - startY;
    let selectionRect = {
      translateX: w.layout.translateX,
      translateY: w.layout.translateY
    };
    if (Math.abs(selectionWidth + startX) > w.layout.gridWidth) {
      selectionWidth = w.layout.gridWidth - startX;
    } else if (left < 0) {
      selectionWidth = startX;
    }
    if (startX > left) {
      inversedX = true;
      selectionWidth = Math.abs(selectionWidth);
    }
    if (startY > top) {
      inversedY = true;
      selectionHeight = Math.abs(selectionHeight);
    }
    if (zoomtype === "x") {
      selectionRect = {
        x: inversedX ? startX - selectionWidth : startX,
        y: 0,
        width: selectionWidth,
        height: w.layout.gridHeight
      };
    } else if (zoomtype === "y") {
      selectionRect = {
        x: 0,
        y: inversedY ? startY - selectionHeight : startY,
        width: w.layout.gridWidth,
        height: selectionHeight
      };
    } else {
      selectionRect = {
        x: inversedX ? startX - selectionWidth : startX,
        y: inversedY ? startY - selectionHeight : startY,
        width: selectionWidth,
        height: selectionHeight
      };
    }
    selectionRect = __spreadProps(__spreadValues({}, selectionRect), {
      translateX: w.layout.translateX,
      translateY: w.layout.translateY
    });
    me.drawSelectionRect(selectionRect);
    me.selectionDragging("resizing");
    return selectionRect;
  }
  /**
   * @param {string} type
   * @param {CustomEvent} e
   */
  selectionDragging(type, e) {
    var _a;
    const w = this.w;
    if (!e) return;
    e.preventDefault();
    const { handler, box } = e.detail;
    const constraints = (
      /** @type {any} */
      this.constraints
    );
    let { x, y } = box;
    if (x < constraints.x) {
      x = constraints.x;
    }
    if (y < constraints.y) {
      y = constraints.y;
    }
    if (box.x2 > constraints.x2) {
      x = constraints.x2 - box.w;
    }
    if (box.y2 > constraints.y2) {
      y = constraints.y2 - box.h;
    }
    handler.move(x, y);
    const selRect = this.selectionRect;
    let timerInterval = 0;
    if (type === "resizing") {
      timerInterval = 30;
    }
    const getSelAttr = (attr) => {
      return parseFloat(selRect.node.getAttribute(attr));
    };
    const draggedProps = {
      x: getSelAttr("x"),
      y: getSelAttr("y"),
      width: getSelAttr("width"),
      height: getSelAttr("height")
    };
    w.interact.selection = draggedProps;
    const link = w.config.chart.link;
    const linkActive = !!(link && (link.enabled || typeof link.dimension === "function"));
    if ((typeof w.config.chart.events.selection === "function" || linkActive) && w.interact.selectionEnabled) {
      clearTimeout((_a = this.w.globals.selectionResizeTimer) != null ? _a : void 0);
      this.w.globals.selectionResizeTimer = window.setTimeout(() => {
        this._emitSelectionFromRect();
      }, timerInterval);
    }
  }
  /**
   * Recompute the reported x/y range from the CURRENT persistent selection rect
   * (via the shared AxisMapping) and notify listeners: chart.events.selection,
   * brushScrolled, and the crossfilter coordinator. Shared by the rect-body drag
   * (selectionDragging) and the handle resize (makeSelectionRectDraggable) so
   * every gesture re-reports through ONE mapping and the reported range always
   * matches the rect the user sees. No dragged/threshold gate: reaching here
   * already means the user moved or resized the persistent rect.
   */
  _emitSelectionFromRect() {
    var _a;
    const w = this.w;
    if (!w.interact.selectionEnabled) return;
    const link = w.config.chart.link;
    const linkActive = !!(link && (link.enabled || typeof link.dimension === "function"));
    if (typeof w.config.chart.events.selection !== "function" && !linkActive) {
      return;
    }
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const selectionRect = this.selectionRect.node.getBoundingClientRect();
    const xyRatios = this.xyRatios;
    let minX, maxX, minY, maxY;
    const relLeft = this._screenXToPlotPx(selectionRect.left);
    const relRight = this._screenXToPlotPx(selectionRect.right);
    if (!w.axisFlags.isRangeBar) {
      if (!w.globals.xAxisScale) return;
      minX = AxisMapping.pxToDataX(w, relLeft);
      maxX = AxisMapping.pxToDataX(w, relRight);
      minY = w.globals.yAxisScale[0].niceMin + (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0];
      maxY = w.globals.yAxisScale[0].niceMax - (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0];
    } else {
      minX = w.globals.yAxisScale[0].niceMin + relLeft * xyRatios.invertedYRatio;
      maxX = w.globals.yAxisScale[0].niceMin + relRight * xyRatios.invertedYRatio;
      minY = 0;
      maxY = 1;
    }
    const xyAxis = {
      xaxis: { min: minX, max: maxX },
      yaxis: { min: minY, max: maxY }
    };
    if (typeof w.config.chart.events.selection === "function") {
      w.config.chart.events.selection(this.ctx, xyAxis);
    }
    if (w.config.chart.brush.enabled && w.config.chart.events.brushScrolled !== void 0) {
      w.config.chart.events.brushScrolled(this.ctx, xyAxis);
    }
    (_a = this.ctx.linkedViews) == null ? void 0 : _a.onSourceSelection(xyAxis.xaxis);
  }
  /** @param {{context: any, zoomtype: any}} opts */
  selectionDrawn({ context, zoomtype }) {
    var _a;
    const w = this.w;
    const me = context;
    const xyRatios = this.xyRatios;
    const toolbar = this.ctx.toolbar;
    const selRect = w.interact.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();
    const gridRectDim = me._gridRect();
    if (!gridRectDim) return;
    const localStartX = this._screenXToPlotPx(selRect.left);
    const localEndX = this._screenXToPlotPx(selRect.right);
    const localStartY = selRect.top - gridRectDim.top;
    const localEndY = selRect.bottom - gridRectDim.top;
    let xLowestValue, xHighestValue;
    if (!w.axisFlags.isRangeBar) {
      xLowestValue = AxisMapping.pxToDataX(w, localStartX);
      xHighestValue = AxisMapping.pxToDataX(w, localEndX);
    } else {
      xLowestValue = w.globals.yAxisScale[0].niceMin + localStartX * xyRatios.invertedYRatio;
      xHighestValue = w.globals.yAxisScale[0].niceMin + localEndX * xyRatios.invertedYRatio;
    }
    const yHighestValue = [];
    const yLowestValue = [];
    w.config.yaxis.forEach((yaxe, index) => {
      const seriesIndex = w.globals.seriesYAxisMap[index][0];
      const highestVal = w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localStartY;
      const lowestVal = w.globals.yAxisScale[index].niceMax - xyRatios.yRatio[seriesIndex] * localEndY;
      yHighestValue.push(highestVal);
      yLowestValue.push(lowestVal);
    });
    if (me.dragged && (me.dragX > 10 || me.dragY > 10) && xLowestValue !== xHighestValue) {
      if (w.interact.zoomEnabled) {
        if (!w.globals.initialConfig) return;
        let yaxis = Utils.clone(w.globals.initialConfig.yaxis);
        let xaxis = Utils.clone(w.globals.initialConfig.xaxis);
        w.interact.zoomed = true;
        if (w.config.xaxis.convertedCatToNumeric) {
          xLowestValue = Math.floor(xLowestValue);
          xHighestValue = Math.floor(xHighestValue);
          if (xLowestValue < 1) {
            xLowestValue = 1;
            xHighestValue = w.globals.dataPoints;
          }
          if (xHighestValue - xLowestValue < 2) {
            xHighestValue = xLowestValue + 1;
          }
        }
        if (zoomtype === "xy" || zoomtype === "x") {
          xaxis = {
            min: xLowestValue,
            max: xHighestValue
          };
        }
        if (zoomtype === "xy" || zoomtype === "y") {
          yaxis.forEach((yaxe, index) => {
            yaxis[index].min = yLowestValue[index];
            yaxis[index].max = yHighestValue[index];
          });
        }
        if (toolbar) {
          const beforeZoomRange = toolbar.getBeforeZoomRange(xaxis, yaxis);
          if (beforeZoomRange) {
            xaxis = beforeZoomRange.xaxis ? beforeZoomRange.xaxis : xaxis;
            yaxis = beforeZoomRange.yaxis ? beforeZoomRange.yaxis : yaxis;
          }
        }
        const options = {
          xaxis
        };
        if (!w.config.chart.group) {
          options.yaxis = yaxis;
        }
        me.ctx.updateHelpers._updateOptions(
          options,
          false,
          me.w.config.chart.animations.dynamicAnimation.enabled
        );
        if (typeof w.config.chart.events.zoomed === "function") {
          toolbar.zoomCallback(xaxis, yaxis);
        }
      } else if (w.interact.selectionEnabled) {
        let yaxis = null;
        let xaxis = null;
        xaxis = {
          min: xLowestValue,
          max: xHighestValue
        };
        if (zoomtype === "xy" || zoomtype === "y") {
          const yaxisCopy = (
            /** @type {ApexYAxis[]} */
            Utils.clone(w.config.yaxis)
          );
          yaxis = yaxisCopy;
          yaxisCopy.forEach((yaxe, index) => {
            yaxisCopy[index].min = yLowestValue[index];
            yaxisCopy[index].max = yHighestValue[index];
          });
        }
        w.interact.selection = me.selection;
        if (typeof w.config.chart.events.selection === "function") {
          w.config.chart.events.selection(me.ctx, {
            xaxis,
            yaxis
          });
        }
        (_a = me.ctx.linkedViews) == null ? void 0 : _a.onSourceSelection(xaxis);
      }
    }
  }
  /** @param {{ context?: any, zoomtype?: any, xyRatios?: any }} opts */
  panDragging({ context }) {
    var _a;
    const w = this.w;
    const me = context;
    if (typeof w.interact.lastClientPosition.x !== "undefined") {
      const deltaX = w.interact.lastClientPosition.x - me.clientX;
      const deltaY = ((_a = w.interact.lastClientPosition.y) != null ? _a : 0) - me.clientY;
      if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
        this.moveDirection = "left";
      } else if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX < 0) {
        this.moveDirection = "right";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY > 0) {
        this.moveDirection = "up";
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < 0) {
        this.moveDirection = "down";
      }
    }
    w.interact.lastClientPosition = {
      x: me.clientX,
      y: me.clientY
    };
    const xLowestValue = w.axisFlags.isRangeBar ? w.globals.minY : w.globals.minX;
    const xHighestValue = w.axisFlags.isRangeBar ? w.globals.maxY : w.globals.maxX;
    me.panScrolled(xLowestValue, xHighestValue);
  }
  // delayedPanScrolled() {
  //   const w = this.w
  //   let newMinX = w.globals.minX
  //   let newMaxX = w.globals.maxX
  //   const centerX = (w.globals.maxX - w.globals.minX) / 2
  //   if (this.moveDirection === 'left') {
  //     newMinX = w.globals.minX + centerX
  //     newMaxX = w.globals.maxX + centerX
  //   } else if (this.moveDirection === 'right') {
  //     newMinX = w.globals.minX - centerX
  //     newMaxX = w.globals.maxX - centerX
  //   }
  //   newMinX = Math.floor(newMinX)
  //   newMaxX = Math.floor(newMaxX)
  //   this.updateScrolledChart(
  //     { xaxis: { min: newMinX, max: newMaxX } },
  //     newMinX,
  //     newMaxX
  //   )
  // }
  /**
   * @param {number} xLowestValue
   * @param {number} xHighestValue
   */
  panScrolled(xLowestValue, xHighestValue) {
    var _a, _b;
    const w = this.w;
    const xyRatios = this.xyRatios;
    if (!w.globals.initialConfig) return;
    const yaxis = Utils.clone(w.globals.initialConfig.yaxis);
    let xRatio = xyRatios.xRatio;
    let minX = w.globals.minX;
    let maxX = w.globals.maxX;
    if (w.axisFlags.isRangeBar) {
      xRatio = xyRatios.invertedYRatio;
      minX = w.globals.minY;
      maxX = w.globals.maxY;
    }
    if (this.moveDirection === "left") {
      xLowestValue = minX + w.layout.gridWidth / 15 * xRatio;
      xHighestValue = maxX + w.layout.gridWidth / 15 * xRatio;
    } else if (this.moveDirection === "right") {
      xLowestValue = minX - w.layout.gridWidth / 15 * xRatio;
      xHighestValue = maxX - w.layout.gridWidth / 15 * xRatio;
    }
    if (!w.axisFlags.isRangeBar) {
      const clampMin = (_a = w.globals.dataReducerRawMinX) != null ? _a : w.globals.initialMinX;
      const clampMax = (_b = w.globals.dataReducerRawMaxX) != null ? _b : w.globals.initialMaxX;
      if (xLowestValue < clampMin || xHighestValue > clampMax) {
        xLowestValue = minX;
        xHighestValue = maxX;
      }
    }
    const xaxis = {
      min: xLowestValue,
      max: xHighestValue
    };
    const options = {
      xaxis
    };
    if (!w.config.chart.group) {
      options.yaxis = yaxis;
    }
    this.updateScrolledChart(options, xLowestValue, xHighestValue);
  }
  /**
   * @param {object} options
   * @param {number} xLowestValue
   * @param {number} xHighestValue
   */
  updateScrolledChart(options, xLowestValue, xHighestValue) {
    const w = this.w;
    this.ctx.updateHelpers._updateOptions(options, false, false);
    if (typeof w.config.chart.events.scrolled === "function") {
      const args = {
        xaxis: {
          min: xLowestValue,
          max: xHighestValue
        }
      };
      w.config.chart.events.scrolled(this.ctx, args);
      this.ctx.events.fireEvent("scrolled", args);
    }
  }
  // ---------------------------------------------------------------------------
  // Momentum: multi-touch pinch-zoom, two-finger pan and kinetic inertia.
  //
  // Every _updateOptions destroys and recreates this instance, and applying a
  // gesture frame IS an _updateOptions, so the gesture must not depend on the
  // instance surviving. All runtime state lives on w.interact.momentum (the
  // interaction slice that persists across re-renders, like the crude pan's
  // lastClientPosition). The instance that received touchstart keeps driving
  // the gesture off the persistent state; inertia is a self-contained rAF loop
  // that stops on w.globals.isDestroyed (a real destroy) rather than being
  // cancelled by the per-update destroy().
  // ---------------------------------------------------------------------------
  _momentumEnabled() {
    return this._pinchEnabled() || this._panInertiaEnabled();
  }
  _pinchEnabled() {
    const c = this.w.config.chart;
    return !!(c.zoom && c.zoom.enabled && c.zoom.pinch);
  }
  _panInertiaEnabled() {
    const c = this.w.config.chart;
    return !!(c.pan && c.pan.inertia);
  }
  /** Lazily-created, re-render-surviving gesture state on the interaction slice. */
  _m() {
    const it = this.w.interact;
    if (!it.momentum) {
      it.momentum = {
        busy: false,
        /** @type {any} */
        pinch: null,
        /** @type {any} */
        panState: null,
        /** @type {{x:number,t:number}[]} */
        samples: [],
        /** @type {number|null} */
        inertiaRAF: null
      };
    }
    return it.momentum;
  }
  /** Current x data-window (rangeBars carry the datetime domain on y). */
  _currentXWindow() {
    const w = this.w;
    return w.axisFlags.isRangeBar ? { min: w.globals.minY, max: w.globals.maxY } : { min: w.globals.minX, max: w.globals.maxX };
  }
  /** Live grid rect from the current DOM. Never cache the grid node on the
   * instance: a full render replaces this whole instance, but the fast update
   * path (fastUpdate/_fastAxisChromeRefresh) keeps the instance while swapping
   * the grid node, and a cached node would go stale (detached nodes report an
   * all-zero bounding rect, silently corrupting selection geometry). */
  _gridRect() {
    const baseEl = this.w.dom.baseEl;
    const grid = baseEl && baseEl.querySelector(".apexcharts-grid");
    return grid ? grid.getBoundingClientRect() : null;
  }
  /**
   * Convert an absolute (client) x pixel to the plot-origin coordinate space
   * that bar placement and the selection rect transform both use:
   * `screenX - svgLeft - translateX`. This is the ONLY correct reference for the
   * numeric/datetime x mapping (see AxisMapping): do NOT measure from the
   * `.apexcharts-grid` box and subtract barPadForNumericAxis, because on a
   * numeric bar chart that box extends barPad to the LEFT of the plot origin, so
   * the two corrections are a fragile pair that only cancels while the grid box
   * happens to extend exactly barPad. Anchoring on translateX (the same origin
   * the bars use) is stable regardless of grid padding.
   * @param {number} screenX
   * @returns {number}
   */
  _screenXToPlotPx(screenX) {
    const baseEl = this.w.dom.baseEl;
    const svg = baseEl && baseEl.querySelector(".apexcharts-svg");
    const svgLeft = svg ? svg.getBoundingClientRect().left : 0;
    return screenX - svgLeft - this.w.layout.translateX;
  }
  /**
   * Raw data bounds to clamp against. When zoom-aware downsampling is active,
   * the raw stash tracks the full domain; fall back to the initial window.
   * Returns null for rangeBars (no raw-x clamp available).
   * @returns {{min:number, max:number}|null}
   */
  _clampBounds() {
    var _a, _b;
    const w = this.w;
    if (w.axisFlags.isRangeBar) return null;
    return {
      min: (_a = w.globals.dataReducerRawMinX) != null ? _a : w.globals.initialMinX,
      max: (_b = w.globals.dataReducerRawMaxX) != null ? _b : w.globals.initialMaxX
    };
  }
  /**
   * Apply an x-window immediately (no animation), mirroring panScrolled but
   * pixel-accurate: clamp to the raw bounds (preserving window width so a pan
   * stops flush at the edge rather than shrinking), floor for category axes,
   * then route through the fast _updateOptions path.
   * @param {number} newMinX @param {number} newMaxX @param {boolean} isZoom
   * @returns {{minX:number, maxX:number}|false} applied window, or false if rejected
   */
  _applyXRange(newMinX, newMaxX, isZoom) {
    const w = this.w;
    if (!w.globals.initialConfig) return false;
    const bounds = this._clampBounds();
    if (bounds) {
      const range = newMaxX - newMinX;
      if (newMinX < bounds.min) {
        newMinX = bounds.min;
        newMaxX = newMinX + range;
      }
      if (newMaxX > bounds.max) {
        newMaxX = bounds.max;
        newMinX = newMaxX - range;
      }
      if (newMinX < bounds.min) newMinX = bounds.min;
    }
    if (w.config.xaxis.convertedCatToNumeric) {
      newMinX = Math.floor(newMinX);
      newMaxX = Math.floor(newMaxX);
      if (newMinX < 1) newMinX = 1;
      if (newMaxX - newMinX < 2) return false;
    }
    if (!(newMaxX > newMinX)) return false;
    const options = { xaxis: { min: newMinX, max: newMaxX } };
    if (!w.config.chart.group) {
      options.yaxis = Utils.clone(w.globals.initialConfig.yaxis);
    }
    if (isZoom) w.interact.zoomed = true;
    this.ctx.updateHelpers._updateOptions(options, false, false);
    return { minX: newMinX, maxX: newMaxX };
  }
  _cancelInertia() {
    const m = this._m();
    if (m.inertiaRAF != null) {
      cancelAnimationFrame(m.inertiaRAF);
      m.inertiaRAF = null;
    }
  }
  _fireScrolled() {
    const w = this.w;
    if (typeof w.config.chart.events.scrolled !== "function") return;
    const { min, max } = this._currentXWindow();
    const args = { xaxis: { min, max } };
    w.config.chart.events.scrolled(this.ctx, args);
    this.ctx.events.fireEvent("scrolled", args);
  }
  /** @param {number} x @param {number} t */
  _pushSample(x, t) {
    const s = this._m().samples;
    s.push({ x, t });
    while (s.length > 6) s.shift();
  }
  /**
   * Single passive:false handler for all touch phases. Two fingers => pinch /
   * two-finger pan (zoom). One finger, in pan mode => kinetic pan with inertia.
   * @param {any} e
   */
  momentumTouch(e) {
    const w = this.w;
    const m = this._m();
    const type = e.type;
    if (type === "touchstart") {
      this._cancelInertia();
      const gridRectDim = this._gridRect();
      if (!gridRectDim) return;
      if (e.touches.length >= 2 && this._pinchEnabled()) {
        e.preventDefault();
        m.busy = true;
        m.panState = null;
        this._beginPinch(e, gridRectDim);
      } else if (e.touches.length === 1 && this._panInertiaEnabled() && w.interact.panEnabled) {
        m.busy = true;
        m.pinch = null;
        const t = e.touches[0];
        const win = this._currentXWindow();
        const gw = w.layout.gridWidth || 1;
        m.panState = {
          startX: t.clientX,
          startY: t.clientY,
          axis: null,
          // decided on first move (rails)
          minX0: win.min,
          maxX0: win.max,
          ratio0: (win.max - win.min) / gw
        };
        m.samples = [{ x: t.clientX, t: e.timeStamp }];
      }
      return;
    }
    if (type === "touchmove") {
      if (m.pinch && e.touches.length >= 2) {
        e.preventDefault();
        this._movePinch(e);
      } else if (m.panState && e.touches.length === 1) {
        this._movePan(e);
      }
      return;
    }
    if (m.pinch) {
      if (e.touches.length < 2) this._endPinch();
    } else if (m.panState) {
      if (e.touches.length === 0) this._endPan();
    }
    if (e.touches.length === 0) {
      w.interact.mousedown = false;
      this.dragged = false;
      if (m.inertiaRAF == null && !m.pinch && !m.panState) {
        m.busy = false;
      }
    }
  }
  /** @param {any} e @param {DOMRect} gridRectDim */
  _beginPinch(e, gridRectDim) {
    const w = this.w;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
    const cx = (t0.clientX + t1.clientX) / 2 - gridRectDim.left - w.globals.barPadForNumericAxis;
    const { min, max } = this._currentXWindow();
    this._m().pinch = {
      d0: dist,
      cx0: cx,
      minX0: min,
      maxX0: max,
      gridWidth: w.layout.gridWidth || 1
    };
  }
  /** @param {any} e */
  _movePinch(e) {
    const w = this.w;
    const p = this._m().pinch;
    if (!p) return;
    const gridRectDim = this._gridRect();
    if (!gridRectDim) return;
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t0.clientX, t1.clientY - t0.clientY) || 1;
    const cx = (t0.clientX + t1.clientX) / 2 - gridRectDim.left - w.globals.barPadForNumericAxis;
    const range0 = p.maxX0 - p.minX0;
    const newRange = range0 * (p.d0 / dist);
    const anchorData = p.minX0 + p.cx0 / p.gridWidth * range0;
    let newMinX = anchorData - cx / p.gridWidth * newRange;
    let newMaxX = newMinX + newRange;
    const bounds = this._clampBounds();
    if (bounds) {
      const minXDiff = w.globals.minXDiff > 0 && isFinite(w.globals.minXDiff) ? w.globals.minXDiff : 0;
      const minRange = Math.max(minXDiff * 2, (bounds.max - bounds.min) * 1e-6);
      if (newMaxX - newMinX < minRange) {
        const mid = (newMinX + newMaxX) / 2;
        newMinX = mid - minRange / 2;
        newMaxX = mid + minRange / 2;
      }
    }
    this._applyXRange(newMinX, newMaxX, true);
  }
  _endPinch() {
    const w = this.w;
    const m = this._m();
    m.pinch = null;
    const { min, max } = this._currentXWindow();
    const xaxis = { min, max };
    const yaxis = w.globals.initialConfig ? Utils.clone(w.globals.initialConfig.yaxis) : [];
    const toolbar = this.ctx.toolbar;
    if (toolbar) toolbar.zoomCallback(xaxis, yaxis);
  }
  /** @param {any} e */
  _movePan(e) {
    const m = this._m();
    const s = m.panState;
    const t = e.touches[0];
    if (!s.axis) {
      const dx = Math.abs(t.clientX - s.startX);
      const dy = Math.abs(t.clientY - s.startY);
      if (dx < 6 && dy < 6) {
        this._pushSample(t.clientX, e.timeStamp);
        return;
      }
      if (dy > dx) {
        m.busy = false;
        m.panState = null;
        return;
      }
      s.axis = "x";
    }
    if (s.axis !== "x") return;
    e.preventDefault();
    const totalDeltaPx = t.clientX - s.startX;
    const deltaData = totalDeltaPx * s.ratio0;
    this._pushSample(t.clientX, e.timeStamp);
    this._applyXRange(s.minX0 - deltaData, s.maxX0 - deltaData, false);
  }
  _endPan() {
    const m = this._m();
    const s = m.panState;
    m.panState = null;
    let vel = 0;
    const samples = m.samples;
    if (samples.length >= 2) {
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = b.t - a.t;
      if (dt > 0) vel = (b.x - a.x) / dt;
    }
    m.samples = [];
    if (s && s.axis === "x" && this._panInertiaEnabled() && Math.abs(vel) > 0.05) {
      this._startInertia(vel);
    } else {
      m.busy = false;
      this._fireScrolled();
    }
  }
  /**
   * Kinetic glide after a one-finger pan release: decay the velocity by
   * `friction` each frame and shift the window, stopping at the data edge
   * (clamp, not elastic overshoot). The loop is w-driven, so it keeps running
   * across the re-renders each frame triggers and stops only on a real destroy.
   * @param {number} vel0 px/ms, sign is the finger direction
   */
  _startInertia(vel0) {
    const w = this.w;
    const m = this._m();
    const cfgFriction = w.config.chart.pan && w.config.chart.pan.friction;
    const friction = typeof cfgFriction === "number" ? Math.min(Math.max(cfgFriction, 0.5), 0.999) : 0.92;
    let vel = vel0;
    let lastT = null;
    m.busy = true;
    const step = (ts) => {
      if (w.globals.isDestroyed) {
        m.inertiaRAF = null;
        m.busy = false;
        return;
      }
      if (lastT == null) {
        lastT = ts;
        m.inertiaRAF = requestAnimationFrame(step);
        return;
      }
      const dt = ts - lastT;
      lastT = ts;
      vel *= Math.pow(friction, dt / 16.6667);
      if (Math.abs(vel) < 0.02) {
        m.inertiaRAF = null;
        m.busy = false;
        this._fireScrolled();
        return;
      }
      const win = this._currentXWindow();
      const gw = w.layout.gridWidth || 1;
      const ratio = (win.max - win.min) / gw;
      const deltaData = vel * dt * ratio;
      const applied = this._applyXRange(
        win.min - deltaData,
        win.max - deltaData,
        false
      );
      const bounds = this._clampBounds();
      const hitEdge = !applied || bounds && (deltaData > 0 && applied.minX <= bounds.min + (bounds.max - bounds.min) * 1e-6 || deltaData < 0 && applied.maxX >= bounds.max - (bounds.max - bounds.min) * 1e-6);
      if (hitEdge) {
        m.inertiaRAF = null;
        m.busy = false;
        this._fireScrolled();
        return;
      }
      m.inertiaRAF = requestAnimationFrame(step);
    };
    m.inertiaRAF = requestAnimationFrame(step);
  }
}
ApexCharts__default.registerFeatures({
  toolbar: Toolbar,
  zoomPanSelection: ZoomPanSelection
});
const prefersReducedMotion = ApexCharts.__apex_Animations_prefersReducedMotion;
const applyProgressiveReveal = ApexCharts.__apex_Animations_applyProgressiveReveal;
class Helpers2 {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
  }
  /**
   * @param {Record<string, any>} anno
   * @param {number | null} [annoIndex]
   */
  setOrientations(anno, annoIndex = null) {
    var _a, _b;
    const w = this.w;
    if (anno.label.orientation === "vertical") {
      const i = annoIndex !== null ? annoIndex : 0;
      const xAnno = w.dom.baseEl.querySelector(
        `.apexcharts-xaxis-annotations .apexcharts-xaxis-annotation-label[rel='${i}']`
      );
      if (xAnno !== null) {
        const xAnnoCoord = (
          /** @type {SVGGraphicsElement} */
          xAnno.getBBox()
        );
        xAnno.setAttribute(
          "x",
          String(
            parseFloat((_a = xAnno.getAttribute("x")) != null ? _a : "0") - xAnnoCoord.height + 4
          )
        );
        const yOffset = anno.label.position === "top" ? xAnnoCoord.width : -xAnnoCoord.width;
        xAnno.setAttribute(
          "y",
          String(parseFloat((_b = xAnno.getAttribute("y")) != null ? _b : "0") + yOffset)
        );
        const { x, y } = this.annoCtx.graphics.rotateAroundCenter(xAnno);
        xAnno.setAttribute("transform", `rotate(-90 ${x} ${y})`);
      }
    }
  }
  /**
   * @param {any} annoEl
   * @param {Record<string, any>} anno
   */
  addBackgroundToAnno(annoEl, anno) {
    const w = this.w;
    if (!annoEl || !anno.label.text || !String(anno.label.text).trim()) {
      return null;
    }
    const gridEl = w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!gridEl) return null;
    const elGridRect = gridEl.getBoundingClientRect();
    const gridBBox = (
      /** @type {SVGGraphicsElement} */
      gridEl.getBBox()
    );
    const zoom = elGridRect.width / gridBBox.width || 1;
    const coords = annoEl.getBoundingClientRect();
    let {
      left: pleft,
      right: pright,
      top: ptop,
      bottom: pbottom
    } = anno.label.style.padding;
    if (anno.label.orientation === "vertical") {
      [ptop, pbottom, pleft, pright] = [pleft, pright, ptop, pbottom];
    }
    const x1 = (coords.left - elGridRect.left) / zoom - pleft;
    const y1 = (coords.top - elGridRect.top) / zoom - ptop;
    const elRect = this.annoCtx.graphics.drawRect(
      x1 - w.globals.barPadForNumericAxis,
      y1,
      coords.width / zoom + pleft + pright,
      coords.height / zoom + ptop + pbottom,
      anno.label.borderRadius,
      anno.label.style.background,
      1,
      anno.label.borderWidth,
      anno.label.borderColor,
      0
    );
    if (anno.id) {
      elRect.node.classList.add(anno.id);
    }
    return elRect;
  }
  annotationsBackground() {
    const w = this.w;
    const add = (anno, i, type) => {
      const annoLabel = w.dom.baseEl.querySelector(
        `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${i}']`
      );
      if (annoLabel) {
        const parent = annoLabel.parentNode;
        const elRect = this.addBackgroundToAnno(annoLabel, anno);
        if (elRect) {
          parent == null ? void 0 : parent.insertBefore(elRect.node, annoLabel);
          const labelX = annoLabel.getAttribute("x");
          if (labelX !== null) {
            applyProgressiveReveal(elRect, parseFloat(labelX), w);
          }
          if (anno.label.mouseEnter) {
            elRect.node.addEventListener(
              "mouseenter",
              anno.label.mouseEnter.bind(this, anno)
            );
          }
          if (anno.label.mouseLeave) {
            elRect.node.addEventListener(
              "mouseleave",
              anno.label.mouseLeave.bind(this, anno)
            );
          }
          if (anno.label.click) {
            elRect.node.addEventListener(
              "click",
              anno.label.click.bind(this, anno)
            );
          }
        }
      }
    };
    w.config.annotations.xaxis.forEach(
      (anno, i) => add(anno, i, "xaxis")
    );
    w.config.annotations.yaxis.forEach(
      (anno, i) => add(anno, i, "yaxis")
    );
    w.config.annotations.points.forEach(
      (anno, i) => add(anno, i, "point")
    );
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getY1Y2(type, anno) {
    var _a, _b;
    const w = this.w;
    const y = type === "y1" ? anno.y : anno.y2;
    let yP;
    let clipped = false;
    if (this.annoCtx.invertAxis) {
      const labels = w.config.xaxis.convertedCatToNumeric ? w.labelData.categoryLabels : w.labelData.labels;
      const catIndex = labels.indexOf(y);
      const xLabel = w.dom.baseEl.querySelector(
        `.apexcharts-yaxis-texts-g text:nth-child(${catIndex + 1})`
      );
      yP = xLabel ? parseFloat((_a = xLabel.getAttribute("y")) != null ? _a : "0") : (w.layout.gridHeight / labels.length - 1) * (catIndex + 1) - w.globals.barHeight;
      if (anno.seriesIndex !== void 0 && w.globals.barHeight) {
        yP -= w.globals.barHeight / 2 * (w.seriesData.series.length - 1) - w.globals.barHeight * anno.seriesIndex;
      }
    } else {
      const seriesIndex = w.globals.seriesYAxisMap[anno.yAxisIndex][0];
      const yPos = w.config.yaxis[anno.yAxisIndex].logarithmic ? new CoreUtils(this.w).getLogVal(
        w.config.yaxis[anno.yAxisIndex].logBase,
        y,
        seriesIndex
      ) / /** @type {any} */
      w.globals.yLogRatio[seriesIndex] : (y - w.globals.minYArr[seriesIndex]) / (w.globals.yRange[seriesIndex] / w.layout.gridHeight);
      yP = w.layout.gridHeight - Math.min(Math.max(yPos, 0), w.layout.gridHeight);
      clipped = yPos > w.layout.gridHeight || yPos < 0;
      if (anno.marker && (anno.y === void 0 || anno.y === null)) {
        yP = 0;
      }
      if ((_b = w.config.yaxis[anno.yAxisIndex]) == null ? void 0 : _b.reversed) {
        yP = yPos;
      }
    }
    if (typeof y === "string" && y.includes("px")) {
      yP = parseFloat(y);
    }
    return { yP, clipped };
  }
  /**
   * @param {string} type
   * @param {Record<string, any>} anno
   */
  getX1X2(type, anno) {
    const w = this.w;
    const x = type === "x1" ? anno.x : anno.x2;
    const min = this.annoCtx.invertAxis ? w.globals.minY : w.globals.minX;
    const max = this.annoCtx.invertAxis ? w.globals.maxY : w.globals.maxX;
    const range = this.annoCtx.invertAxis ? w.globals.yRange[0] : w.globals.xRange;
    let clipped = false;
    let xP = this.annoCtx.inversedReversedAxis ? (max - x) / (range / w.layout.gridWidth) : (x - min) / (range / w.layout.gridWidth);
    if ((w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !this.annoCtx.invertAxis && !w.axisFlags.dataFormatXNumeric) {
      if (!w.config.chart.sparkline.enabled) {
        xP = this.getStringX(x);
      }
    }
    if (typeof x === "string" && x.includes("px")) {
      xP = parseFloat(x);
    }
    if ((x === void 0 || x === null) && anno.marker) {
      xP = w.layout.gridWidth;
    }
    if (anno.seriesIndex !== void 0 && w.globals.barWidth && !this.annoCtx.invertAxis) {
      xP -= w.globals.barWidth / 2 * (w.seriesData.series.length - 1) - w.globals.barWidth * anno.seriesIndex;
    }
    if (typeof xP !== "number") {
      xP = 0;
      clipped = true;
    }
    if (parseFloat(xP.toFixed(10)) > parseFloat(w.layout.gridWidth.toFixed(10))) {
      xP = w.layout.gridWidth;
      clipped = true;
    } else if (xP < 0) {
      xP = 0;
      clipped = true;
    }
    return { x: xP, clipped };
  }
  /**
   * @param {number} x
   */
  getStringX(x) {
    var _a;
    const w = this.w;
    let rX = x;
    if (w.config.xaxis.convertedCatToNumeric && w.labelData.categoryLabels.length) {
      const strX = String(x);
      x = w.labelData.categoryLabels.findIndex(
        (l) => String(l) === strX
      ) + 1;
    }
    const catIndex = w.labelData.labels.map(
      (item) => Array.isArray(item) ? item.join(" ") : item
    ).indexOf(x);
    const xLabel = w.dom.baseEl.querySelector(
      `.apexcharts-xaxis-texts-g text:nth-child(${catIndex + 1})`
    );
    if (xLabel) {
      rX = parseFloat((_a = xLabel.getAttribute("x")) != null ? _a : "0");
    }
    return rX;
  }
}
class XAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.invertAxis = this.annoCtx.invertAxis;
    this.helpers = new Helpers2(this.annoCtx);
  }
  /**
   * @param {XAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    const w = this.w;
    const result = this.helpers.getX1X2("x1", anno);
    let x1 = result.x;
    const clipX1 = result.clipped;
    let clipX2 = true;
    let x2;
    const text = anno.label.text;
    const strokeDashArray = anno.strokeDashArray;
    if (!Utils.isNumber(x1)) return;
    if (anno.x2 === null || typeof anno.x2 === "undefined") {
      if (!clipX1) {
        const line = this.annoCtx.graphics.drawLine(
          x1 + anno.offsetX,
          // x1
          0 + anno.offsetY,
          // y1
          x1 + anno.offsetX,
          // x2
          w.layout.gridHeight + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          //dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
        applyProgressiveReveal(line, x1 + anno.offsetX, w);
      }
    } else {
      const result2 = this.helpers.getX1X2("x2", anno);
      x2 = result2.x;
      clipX2 = result2.clipped;
      if (x2 < x1) {
        const temp = x1;
        x1 = x2;
        x2 = temp;
      }
      const rect = this.annoCtx.graphics.drawRect(
        x1 + anno.offsetX,
        // x1
        0 + anno.offsetY,
        // y1
        x2 - x1,
        // x2
        w.layout.gridHeight + anno.offsetY,
        // y2
        0,
        // radius
        anno.fillColor,
        // color
        anno.opacity,
        // opacity,
        1,
        // strokeWidth
        anno.borderColor,
        // strokeColor
        strokeDashArray
        // stokeDashArray
      );
      rect.node.classList.add("apexcharts-annotation-rect");
      rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
      parent.appendChild(rect.node);
      if (anno.id) {
        rect.node.classList.add(anno.id);
      }
      applyProgressiveReveal(rect, x1 + anno.offsetX, w);
    }
    if (!(clipX1 && clipX2)) {
      const textRects = this.annoCtx.graphics.getTextRects(
        text,
        anno.label.style.fontSize
      );
      const textY = anno.label.position === "top" ? 4 : anno.label.position === "center" ? w.layout.gridHeight / 2 + (anno.label.orientation === "vertical" ? textRects.width / 2 : 0) : w.layout.gridHeight;
      const elText = this.annoCtx.graphics.drawText({
        x: x1 + anno.label.offsetX,
        y: textY + anno.label.offsetY - (anno.label.orientation === "vertical" ? anno.label.position === "top" ? textRects.width / 2 - 12 : -textRects.width / 2 : 0),
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-xaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      applyProgressiveReveal(elText, x1 + anno.label.offsetX, w);
      this.annoCtx.helpers.setOrientations(anno, index);
    }
  }
  drawXAxisAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-xaxis-annotations"
    });
    w.config.annotations.xaxis.map(
      (anno, index) => {
        this.addXaxisAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
class YAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers2(this.annoCtx);
    this.axesUtils = new AxesUtils(this.annoCtx.w, {
      theme: this.annoCtx.theme,
      timeScale: this.annoCtx.timeScale
    });
  }
  /**
   * @param {YAxisAnnotations} anno
   * @param {Element} parent
   * @param {number} index
   */
  addYaxisAnnotation(anno, parent, index) {
    const w = this.w;
    const strokeDashArray = anno.strokeDashArray;
    let result = this.helpers.getY1Y2("y1", anno);
    let y1 = result.yP;
    const clipY1 = result.clipped;
    let y2;
    let clipY2 = true;
    let drawn = false;
    const text = anno.label.text;
    if (anno.y2 === null || typeof anno.y2 === "undefined") {
      if (!clipY1) {
        drawn = true;
        const line = this.annoCtx.graphics.drawLine(
          0 + anno.offsetX,
          // x1
          y1 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 + anno.offsetY,
          // y2
          anno.borderColor,
          // lineColor
          strokeDashArray,
          // dashArray
          anno.borderWidth
        );
        parent.appendChild(line.node);
        if (anno.id) {
          line.node.classList.add(anno.id);
        }
      }
    } else {
      result = this.helpers.getY1Y2("y2", anno);
      y2 = result.yP;
      clipY2 = result.clipped;
      if (y2 > y1) {
        const temp = y1;
        y1 = y2;
        y2 = temp;
      }
      if (!(clipY1 && clipY2)) {
        drawn = true;
        const rect = this.annoCtx.graphics.drawRect(
          0 + anno.offsetX,
          // x1
          y2 + anno.offsetY,
          // y1
          this._getYAxisAnnotationWidth(anno),
          // x2
          y1 - y2,
          // y2
          0,
          // radius
          anno.fillColor,
          // color
          anno.opacity,
          // opacity,
          1,
          // strokeWidth
          anno.borderColor,
          // strokeColor
          strokeDashArray
          // stokeDashArray
        );
        rect.node.classList.add("apexcharts-annotation-rect");
        rect.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
        parent.appendChild(rect.node);
        if (anno.id) {
          rect.node.classList.add(anno.id);
        }
      }
    }
    if (drawn) {
      const textX = anno.label.position === "right" ? w.layout.gridWidth : anno.label.position === "center" ? w.layout.gridWidth / 2 : 0;
      const elText = this.annoCtx.graphics.drawText({
        x: textX + anno.label.offsetX,
        y: (y2 != null ? y2 : y1) + anno.label.offsetY - 3,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-yaxis-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
    }
  }
  /**
   * @param {YAxisAnnotations} anno
   */
  _getYAxisAnnotationWidth(anno) {
    const w = this.w;
    let width = w.layout.gridWidth;
    if (anno.width.indexOf("%") > -1) {
      width = w.layout.gridWidth * parseInt(anno.width, 10) / 100;
    } else {
      width = parseInt(anno.width, 10);
    }
    return width + anno.offsetX;
  }
  drawYAxisAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-yaxis-annotations"
    });
    w.config.annotations.yaxis.forEach(
      (anno, index) => {
        anno.yAxisIndex = this.axesUtils.translateYAxisIndex(anno.yAxisIndex);
        if (!(this.axesUtils.isYAxisHidden(anno.yAxisIndex) && this.axesUtils.yAxisAllSeriesCollapsed(anno.yAxisIndex))) {
          this.addYaxisAnnotation(anno, elg.node, index);
        }
      }
    );
    return elg;
  }
}
class PointAnnotations {
  /**
   * @param {import('./Annotations').default} annoCtx
   */
  constructor(annoCtx) {
    this.w = annoCtx.w;
    this.annoCtx = annoCtx;
    this.helpers = new Helpers2(this.annoCtx);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    const w = this.w;
    if (w.globals.collapsedSeriesIndices.indexOf(anno.seriesIndex) > -1) {
      return;
    }
    const resultX = this.helpers.getX1X2("x1", anno);
    const x = resultX.x;
    const clipX = resultX.clipped;
    const resultY = this.helpers.getY1Y2("y1", anno);
    const y = resultY.yP;
    const clipY = resultY.clipped;
    if (!Utils.isNumber(x)) return;
    if (!(clipY || clipX)) {
      const optsPoints = {
        pSize: anno.marker.size,
        pointStrokeWidth: anno.marker.strokeWidth,
        pointFillColor: anno.marker.fillColor,
        pointStrokeColor: anno.marker.strokeColor,
        shape: anno.marker.shape,
        pRadius: anno.marker.radius,
        class: `apexcharts-point-annotation-marker ${anno.marker.cssClass} ${anno.id ? anno.id : ""}`
      };
      let point = this.annoCtx.graphics.drawMarker(
        x + anno.marker.offsetX,
        y + anno.marker.offsetY,
        optsPoints
      );
      parent.appendChild(point.node);
      applyProgressiveReveal(point, x, w);
      const text = anno.label.text ? anno.label.text : "";
      const elText = this.annoCtx.graphics.drawText({
        x: x + anno.label.offsetX,
        y: y + anno.label.offsetY - anno.marker.size - parseFloat(anno.label.style.fontSize) / 1.6,
        text,
        textAnchor: anno.label.textAnchor,
        fontSize: anno.label.style.fontSize,
        fontFamily: anno.label.style.fontFamily,
        fontWeight: anno.label.style.fontWeight,
        foreColor: anno.label.style.color,
        cssClass: `apexcharts-point-annotation-label ${anno.label.style.cssClass} ${anno.id ? anno.id : ""}`
      });
      elText.attr({
        rel: index
      });
      parent.appendChild(elText.node);
      applyProgressiveReveal(elText, x, w);
      if (anno.customSVG.SVG) {
        const g = this.annoCtx.graphics.group({
          class: "apexcharts-point-annotations-custom-svg " + anno.customSVG.cssClass
        });
        g.attr({
          transform: `translate(${x + anno.customSVG.offsetX}, ${y + anno.customSVG.offsetY})`
        });
        g.node.innerHTML = anno.customSVG.SVG;
        parent.appendChild(g.node);
      }
      if (anno.image.path) {
        const imgWidth = anno.image.width ? anno.image.width : 20;
        const imgHeight = anno.image.height ? anno.image.height : 20;
        point = this.annoCtx.addImage({
          x: x + anno.image.offsetX - imgWidth / 2,
          y: y + anno.image.offsetY - imgHeight / 2,
          width: imgWidth,
          height: imgHeight,
          path: anno.image.path,
          appendTo: ".apexcharts-point-annotations"
        });
      }
      if (anno.mouseEnter) {
        point.node.addEventListener(
          "mouseenter",
          anno.mouseEnter.bind(this, anno)
        );
      }
      if (anno.mouseLeave) {
        point.node.addEventListener(
          "mouseleave",
          anno.mouseLeave.bind(this, anno)
        );
      }
      if (anno.click) {
        point.node.addEventListener("click", anno.click.bind(this, anno));
      }
    }
  }
  drawPointAnnotations() {
    const w = this.w;
    const elg = this.annoCtx.graphics.group({
      class: "apexcharts-point-annotations"
    });
    w.config.annotations.points.map(
      (anno, index) => {
        this.addPointAnnotation(anno, elg.node, index);
      }
    );
    return elg;
  }
}
const Options = ApexCharts.__apex_Options;
class Annotations {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   */
  constructor(w, { theme = null, timeScale = null } = {}) {
    this.w = w;
    this.theme = theme;
    this.timeScale = timeScale;
    this.invertAxis = void 0;
    this.inversedReversedAxis = void 0;
    this.graphics = new Graphics(this.w);
    if (this.w.globals.isBarHorizontal) {
      this.invertAxis = true;
    }
    this.helpers = new Helpers2(this);
    this.xAxisAnnotations = new XAnnotations(this);
    this.yAxisAnnotations = new YAnnotations(this);
    this.pointsAnnotations = new PointAnnotations(this);
    if (this.w.globals.isBarHorizontal && this.w.config.yaxis[0].reversed) {
      this.inversedReversedAxis = true;
    }
    this.xDivision = this.w.layout.gridWidth / this.w.globals.dataPoints;
  }
  drawAxesAnnotations() {
    const w = this.w;
    if (w.globals.axisCharts && w.globals.dataPoints) {
      const yAnnotations = this.yAxisAnnotations.drawYAxisAnnotations();
      const xAnnotations = this.xAxisAnnotations.drawXAxisAnnotations();
      const pointAnnotations = this.pointsAnnotations.drawPointAnnotations();
      const initialAnim = w.config.chart.animations.enabled;
      const annoArray = [yAnnotations, xAnnotations, pointAnnotations];
      const annoElArray = [
        xAnnotations.node,
        yAnnotations.node,
        pointAnnotations.node
      ];
      const progressiveAnnos = w.config.chart.type === "line" || w.config.chart.type === "area" || w.config.chart.type === "rangeArea";
      const skipGroupHide = [progressiveAnnos, false, progressiveAnnos];
      for (let i = 0; i < 3; i++) {
        w.dom.elGraphical.add(annoArray[i]);
        if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
          if (w.config.chart.type !== "scatter" && w.config.chart.type !== "bubble" && w.globals.dataPoints > 1 && !skipGroupHide[i]) {
            annoElArray[i].classList.add("apexcharts-element-hidden");
          }
        }
        w.globals.delayedElements.push({ el: annoElArray[i], index: 0 });
      }
      this.helpers.annotationsBackground();
    }
  }
  drawImageAnnos() {
    const w = this.w;
    w.config.annotations.images.map((s) => {
      this.addImage(s);
    });
  }
  drawTextAnnos() {
    const w = this.w;
    w.config.annotations.texts.map((t) => {
      this.addText(t);
    });
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addXaxisAnnotation(anno, parent, index) {
    this.xAxisAnnotations.addXaxisAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addYaxisAnnotation(anno, parent, index) {
    this.yAxisAnnotations.addYaxisAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} anno
   * @param {Element} parent
   * @param {number} index
   */
  addPointAnnotation(anno, parent, index) {
    this.pointsAnnotations.addPointAnnotation(anno, parent, index);
  }
  /**
   * @param {Record<string, any>} params
   */
  addText(params) {
    const {
      x,
      y,
      text,
      textAnchor,
      foreColor,
      fontSize,
      fontFamily,
      fontWeight,
      cssClass,
      backgroundColor,
      borderWidth,
      strokeDashArray,
      borderRadius,
      borderColor,
      appendTo = ".apexcharts-svg",
      paddingLeft = 4,
      paddingRight = 4,
      paddingBottom = 2,
      paddingTop = 2
    } = params;
    const w = this.w;
    const elText = this.graphics.drawText({
      x,
      y,
      text,
      textAnchor: textAnchor || "start",
      fontSize: fontSize || "12px",
      fontWeight: fontWeight || "regular",
      fontFamily: fontFamily || w.config.chart.fontFamily,
      foreColor: foreColor || w.config.chart.foreColor,
      cssClass: "apexcharts-text " + cssClass ? cssClass : ""
    });
    const parent = w.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(elText.node);
    }
    const textRect = elText.bbox();
    if (text) {
      const elRect = this.graphics.drawRect(
        textRect.x - paddingLeft,
        textRect.y - paddingTop,
        textRect.width + paddingLeft + paddingRight,
        textRect.height + paddingBottom + paddingTop,
        borderRadius,
        backgroundColor ? backgroundColor : "transparent",
        1,
        borderWidth,
        borderColor,
        strokeDashArray
      );
      parent.insertBefore(elRect.node, elText.node);
    }
  }
  /**
   * @param {Record<string, any>} params
   */
  addImage(params) {
    const w = this.w;
    const {
      path,
      x = 0,
      y = 0,
      width = 20,
      height = 20,
      appendTo = ".apexcharts-svg"
    } = params;
    const img = w.dom.Paper.image(path);
    img.size(width, height).move(x, y);
    const parent = w.dom.baseEl.querySelector(appendTo);
    if (parent) {
      parent.appendChild(img.node);
    }
    return img;
  }
  // The addXaxisAnnotation method requires a parent class, and user calling this method externally on the chart instance may not specify parent, hence a different method
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addXaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "xaxis",
      contextMethod: context.addXaxisAnnotation
    });
    return context;
  }
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addYaxisAnnotationExternal(params, pushToMemory, context) {
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "yaxis",
      contextMethod: context.addYaxisAnnotation
    });
    return context;
  }
  /**
   * @param {Record<string, any>} params
   * @param {boolean} pushToMemory
   * @param {any} context
   */
  addPointAnnotationExternal(params, pushToMemory, context) {
    if (typeof this.invertAxis === "undefined") {
      this.invertAxis = context.w.globals.isBarHorizontal;
    }
    this.addAnnotationExternal({
      params,
      pushToMemory,
      context,
      type: "point",
      contextMethod: context.addPointAnnotation
    });
    return context;
  }
  /** @param {{params: any, pushToMemory: any, context: any, type: any, contextMethod: any}} opts */
  addAnnotationExternal({
    params,
    pushToMemory,
    context,
    type,
    contextMethod
  }) {
    const me = context;
    const w = me.w;
    const parent = w.dom.baseEl.querySelector(`.apexcharts-${type}-annotations`);
    const index = parent.childNodes.length + 1;
    const options = new Options();
    const axesAnno = Object.assign(
      {},
      type === "xaxis" ? options.xAxisAnnotation : type === "yaxis" ? options.yAxisAnnotation : options.pointAnnotation
    );
    const anno = Utils.extend(axesAnno, params);
    switch (type) {
      case "xaxis":
        this.addXaxisAnnotation(anno, parent, index);
        break;
      case "yaxis":
        this.addYaxisAnnotation(anno, parent, index);
        break;
      case "point":
        this.addPointAnnotation(anno, parent, index);
        break;
    }
    const axesAnnoLabel = w.dom.baseEl.querySelector(
      `.apexcharts-${type}-annotations .apexcharts-${type}-annotation-label[rel='${index}']`
    );
    const elRect = this.helpers.addBackgroundToAnno(axesAnnoLabel, anno);
    if (elRect) {
      parent.insertBefore(elRect.node, axesAnnoLabel);
    }
    if (pushToMemory) {
      w.globals.memory.methodsToExec.push({
        context: me,
        id: anno.id ? anno.id : Utils.randomId(),
        method: contextMethod,
        label: "addAnnotation",
        params
      });
    }
    return context;
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   */
  clearAnnotations(ctx) {
    const w = ctx.w;
    const annos = w.dom.baseEl.querySelectorAll(
      ".apexcharts-yaxis-annotations, .apexcharts-xaxis-annotations, .apexcharts-point-annotations"
    );
    for (let i = w.globals.memory.methodsToExec.length - 1; i >= 0; i--) {
      if (w.globals.memory.methodsToExec[i].label === "addText" || w.globals.memory.methodsToExec[i].label === "addAnnotation") {
        w.globals.memory.methodsToExec.splice(i, 1);
      }
    }
    Array.prototype.forEach.call(annos, (a) => {
      while (a.firstChild) {
        a.removeChild(a.firstChild);
      }
    });
  }
  /**
   * @param {import('../../types/internal').ChartContext} ctx
   * @param {string} id
   */
  removeAnnotation(ctx, id) {
    const w = ctx.w;
    const annos = w.dom.baseEl.querySelectorAll(`.${id}`);
    if (annos) {
      w.globals.memory.methodsToExec.map((m, i) => {
        if (m.id === id) {
          w.globals.memory.methodsToExec.splice(i, 1);
        }
      });
      Object.keys(w.config.annotations).forEach((key) => {
        const annotationArray = w.config.annotations[key];
        if (Array.isArray(annotationArray)) {
          w.config.annotations[key] = annotationArray.filter((m) => m.id !== id);
        }
      });
      Array.prototype.forEach.call(annos, (a) => {
        a.parentElement.removeChild(a);
      });
    }
  }
}
ApexCharts__default.registerFeatures({ annotations: Annotations });
class KeyboardNavigation {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.seriesIndex = 0;
    this.dataPointIndex = 0;
    this.active = false;
    this._tooltipDismissed = false;
    this._focusedEl = null;
    this._hoveredBarEl = null;
    this._enlargedScatterMarker = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onLegendClick = this._onLegendClick.bind(this);
    this._onPointerDown = this._onPointerDown.bind(this);
    this._lastPointerDownAt = 0;
  }
  // ─── Public API ───────────────────────────────────────────────────────────
  /**
   * Called after the chart and tooltip have been fully rendered.
   * Attaches event listeners and makes the SVG keyboard-focusable.
   */
  init() {
    const w = this.w;
    const svgEl = w.dom.Paper.node;
    if (!svgEl) return;
    svgEl.setAttribute("tabindex", "0");
    svgEl.addEventListener("focus", this._onFocus);
    svgEl.addEventListener("blur", this._onBlur);
    svgEl.addEventListener("mousedown", this._onPointerDown, { capture: true });
    svgEl.addEventListener("pointerdown", this._onPointerDown, {
      capture: true
    });
    svgEl.addEventListener("touchstart", this._onPointerDown, {
      capture: true,
      passive: true
    });
    svgEl.addEventListener("keydown", this._onKeyDown, { passive: false });
    this.ctx.events.addEventListener("legendClick", this._onLegendClick);
  }
  /**
   * Removes all event listeners. Called from chart.destroy().
   */
  destroy() {
    const w = this.w;
    const svgEl = w.dom.Paper && w.dom.Paper.node;
    if (!svgEl) return;
    svgEl.removeEventListener("focus", this._onFocus);
    svgEl.removeEventListener("blur", this._onBlur);
    svgEl.removeEventListener("keydown", this._onKeyDown);
    svgEl.removeEventListener(
      "mousedown",
      this._onPointerDown,
      /** @type {any} */
      { capture: true }
    );
    svgEl.removeEventListener(
      "pointerdown",
      this._onPointerDown,
      /** @type {any} */
      { capture: true }
    );
    svgEl.removeEventListener(
      "touchstart",
      this._onPointerDown,
      /** @type {any} */
      { capture: true }
    );
    this.ctx.events.removeEventListener("legendClick", this._onLegendClick);
  }
  // Records the timestamp of the most recent pointer-down inside the SVG.
  // `_onFocus` reads this to distinguish keyboard-driven focus (no recent
  // pointer activity) from mouse-driven focus (pointer event within the
  // last 100 ms). Stays a no-op for keyboard users.
  _onPointerDown() {
    this._lastPointerDownAt = Date.now();
  }
  /**
   * Called from Events.js keydown handler. Navigation keys are already handled
   * by the direct SVG listener (which can call preventDefault). This entry
   * point is intentionally a no-op — Events.js still fires the public keyDown
   * callback and fireEvent('keydown') independently.
   * @param {Event} _e
   */
  handleKey(_e) {
  }
  // ─── Focus / blur ─────────────────────────────────────────────────────────
  _onFocus() {
    if (!this._isNavEnabled()) return;
    if (Date.now() - this._lastPointerDownAt < 100) {
      return;
    }
    this.active = true;
    this._clampCursor();
    this._snapToVisibleRange();
    this._showCurrentPoint();
  }
  _onBlur() {
    this.active = false;
    this._tooltipDismissed = false;
    this._hideFocus();
  }
  // Called when the user clicks a legend item (collapse/expand a series).
  // Hide the keyboard-nav tooltip — the chart is about to re-render and the
  // current position may no longer be valid.
  _onLegendClick() {
    if (!this.active) return;
    this.active = false;
    this._hideFocus();
  }
  // ─── Key handler ──────────────────────────────────────────────────────────
  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    var _a, _b, _c;
    if (!this._isNavEnabled() || !this.active) return;
    if (e.shiftKey && (e.key === "ArrowRight" || e.key === "ArrowLeft") && this._canPan()) {
      e.preventDefault();
      this._panBy(e.key === "ArrowRight" ? 1 : -1);
      return;
    }
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        this._move(0, 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        this._move(0, -1);
        break;
      case "ArrowUp":
        e.preventDefault();
        this._move(-1, 0);
        break;
      case "ArrowDown":
        e.preventDefault();
        this._move(1, 0);
        break;
      case "Home":
        e.preventDefault();
        this.dataPointIndex = 0;
        this._skipNullForward();
        this._showCurrentPoint();
        break;
      case "End":
        e.preventDefault();
        this.dataPointIndex = this._getDataPointCount(this.seriesIndex) - 1;
        this._skipNullBackward();
        this._showCurrentPoint();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        this._fireClick();
        break;
      case "+":
      case "=":
        if (this._canZoom()) {
          e.preventDefault();
          (_a = this.ctx.toolbar) == null ? void 0 : _a.handleZoomIn();
          this._announce("Zoomed in");
        }
        break;
      case "-":
      case "_":
        if (this._canZoom()) {
          e.preventDefault();
          (_b = this.ctx.toolbar) == null ? void 0 : _b.handleZoomOut();
          this._announce("Zoomed out");
        }
        break;
      case "0":
        if (this._canZoom() && this.w.interact.zoomed) {
          e.preventDefault();
          (_c = this.ctx.toolbar) == null ? void 0 : _c.handleZoomReset();
          this._announce("Zoom reset");
        }
        break;
      case "Escape":
        e.preventDefault();
        if (!this._tooltipDismissed) {
          this._tooltipDismissed = true;
          this._hideFocus();
        } else {
          this.active = false;
          this._tooltipDismissed = false;
          this._hideFocus();
        }
        break;
    }
  }
  // ─── Zoom / pan (keyboard alternatives for drag gestures) ─────────────────
  _canZoom() {
    const w = this.w;
    return Boolean(
      w.globals.axisCharts && w.config.chart.zoom && w.config.chart.zoom.enabled
    );
  }
  _canPan() {
    return this._canZoom();
  }
  /**
   * Shift the visible x-range by ~10% in the given direction.
   * @param {number} direction +1 = right, -1 = left
   */
  _panBy(direction) {
    const w = this.w;
    const toolbar = this.ctx.toolbar;
    if (!toolbar) return;
    const minX = Number(w.globals.minX);
    const maxX = Number(w.globals.maxX);
    if (!isFinite(minX) || !isFinite(maxX) || minX === maxX) return;
    const span = maxX - minX;
    const step = span * 0.1 * direction;
    toolbar.zoomUpdateOptions(minX + step, maxX + step);
    this._announce(direction > 0 ? "Panned right" : "Panned left");
  }
  // ─── Navigation ───────────────────────────────────────────────────────────
  /**
   * @param {number} dSeries
   * @param {number} dPoint
   */
  _move(dSeries, dPoint) {
    const w = this.w;
    const wrapAround = w.config.chart.accessibility.keyboard.navigation.wrapAround;
    if (dSeries !== 0) {
      const ttCtx = this.w.globals.tooltip;
      if (ttCtx && ttCtx.tConfig && ttCtx.tConfig.shared) {
        const j = this.dataPointIndex;
        const isActuallyShared = ttCtx.tooltipUtil && ttCtx.tooltipUtil.isXoverlap(j) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
        if (isActuallyShared) return;
      }
      const total = this._getSeriesCount();
      let si = this.seriesIndex + dSeries;
      let attempts = 0;
      while (attempts < total) {
        if (si < 0) si = wrapAround ? total - 1 : 0;
        if (si >= total) si = wrapAround ? 0 : total - 1;
        if (!w.globals.collapsedSeriesIndices.includes(si)) break;
        si += dSeries;
        attempts++;
      }
      this.seriesIndex = si;
      const dpCount = this._getDataPointCount(si);
      if (this.dataPointIndex >= dpCount) {
        this.dataPointIndex = dpCount - 1;
      }
    }
    if (dPoint !== 0) {
      const dpCount = this._getDataPointCount(this.seriesIndex);
      let di = this.dataPointIndex + dPoint;
      if (di < 0) di = wrapAround ? dpCount - 1 : 0;
      if (di >= dpCount) di = wrapAround ? 0 : dpCount - 1;
      this.dataPointIndex = di;
      if (dPoint > 0) {
        this._skipNullForward();
      } else {
        this._skipNullBackward();
      }
      if (!this._isDataPointVisible(this.seriesIndex, this.dataPointIndex)) {
        this._snapToVisibleRangeInDirection(dPoint);
      }
    }
    this._showCurrentPoint();
  }
  /** Advance dataPointIndex forward past any nulls */
  _skipNullForward() {
    const w = this.w;
    const si = this.seriesIndex;
    const dpCount = this._getDataPointCount(si);
    let di = this.dataPointIndex;
    let attempts = 0;
    if (!Array.isArray(w.seriesData.series[si])) return;
    while (attempts < dpCount && w.seriesData.series[si][di] === null) {
      di = (di + 1) % dpCount;
      attempts++;
    }
    this.dataPointIndex = di;
  }
  /** Retreat dataPointIndex backward past any nulls */
  _skipNullBackward() {
    const w = this.w;
    const si = this.seriesIndex;
    const dpCount = this._getDataPointCount(si);
    let di = this.dataPointIndex;
    let attempts = 0;
    if (!Array.isArray(w.seriesData.series[si])) return;
    while (attempts < dpCount && w.seriesData.series[si][di] === null) {
      di = (di - 1 + dpCount) % dpCount;
      attempts++;
    }
    this.dataPointIndex = di;
  }
  // ─── Display ──────────────────────────────────────────────────────────────
  _showCurrentPoint() {
    const { seriesIndex: i, dataPointIndex: j } = this;
    const w = this.w;
    const ttCtx = w.globals.tooltip;
    if (!ttCtx || !ttCtx.ttItems) return;
    w.interact.capturedSeriesIndex = i;
    w.interact.capturedDataPointIndex = j;
    this._applyFocusClass(i, j);
    this._showTooltip(
      i,
      j,
      /** @type {any} */
      ttCtx
    );
  }
  _hideFocus() {
    const w = this.w;
    const ttCtx = (
      /** @type {any} */
      w.globals.tooltip
    );
    this._removeFocusClass();
    this._leaveHoveredBar();
    if (!ttCtx) return;
    if (ttCtx.marker) {
      ttCtx.marker.resetPointsSize();
    }
    this._enlargedScatterMarker = null;
    const tooltipEl = ttCtx.getElTooltip();
    if (tooltipEl) {
      tooltipEl.classList.remove("apexcharts-active");
      if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.announcements.enabled) {
        tooltipEl.setAttribute("aria-hidden", "true");
      }
    }
    w.dom.baseEl.classList.remove("apexcharts-tooltip-active");
    const xcrosshairs = ttCtx.getElXCrosshairs();
    if (xcrosshairs) xcrosshairs.classList.remove("apexcharts-active");
  }
  // ─── Tooltip display per chart type ───────────────────────────────────────
  /**
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltip(i, j, ttCtx) {
    const w = this.w;
    const type = w.config.chart.type;
    const tooltipEl = ttCtx.getElTooltip();
    if (!tooltipEl) return;
    const cachedDims = ttCtx.getCachedDimensions();
    ttCtx.tooltipRect = {
      x: 0,
      y: 0,
      ttWidth: cachedDims.ttWidth || 0,
      ttHeight: cachedDims.ttHeight || 0
    };
    this._setSyntheticEvent(i, j, ttCtx);
    w.dom.baseEl.classList.add("apexcharts-tooltip-active");
    tooltipEl.classList.add("apexcharts-active");
    if (w.config.chart.accessibility.enabled && w.config.chart.accessibility.announcements.enabled) {
      tooltipEl.removeAttribute("aria-hidden");
    }
    if (type === "pie" || type === "donut" || type === "polarArea") {
      this._showTooltipNonAxis(i, j, ttCtx, tooltipEl);
    } else if (type === "radialBar") {
      this._showTooltipRadialBar(i, j, ttCtx, tooltipEl);
    } else if (type === "heatmap" || type === "treemap") {
      this._showTooltipHeatTree(i, j, ttCtx, tooltipEl, type);
    } else if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "violin" || type === "rangeBar") {
      this._showTooltipBar(i, j, ttCtx);
    } else {
      this._showTooltipAxisLine(i, j, ttCtx);
    }
  }
  /**
   * Set ttCtx.e to a synthetic mouse-event-like object whose clientX/Y point
   * to the centre of the current data-point element.  This ensures that any
   * positioning helper that reads ttCtx.e (followCursor path in moveTooltip,
   * moveStickyTooltipOverBars, moveDynamicPointsOnHover, etc.) gets valid
   * coordinates rather than crashing on undefined.
   *
   * For chart types that don't have a concrete SVG element per data point
   * (pie, radialBar) we fall back to the SVG centre.
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _setSyntheticEvent(i, j, ttCtx) {
    const w = this.w;
    const type = w.config.chart.type;
    let clientX = 0;
    let clientY = 0;
    const el = this._getFocusableElement(i, j);
    if (el) {
      const rect = el.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    } else if (w.globals.pointsArray && w.globals.pointsArray[i] && w.globals.pointsArray[i][j]) {
      const pt = w.globals.pointsArray[i][j];
      const elGrid = ttCtx.getElGrid && ttCtx.getElGrid();
      if (elGrid) {
        const gridRect = elGrid.getBoundingClientRect();
        clientX = gridRect.left + (pt[0] || 0);
        clientY = gridRect.top + (pt[1] || 0);
      }
    } else {
      const svgEl = w.dom.Paper && w.dom.Paper.node;
      if (svgEl) {
        const svgRect = svgEl.getBoundingClientRect();
        clientX = svgRect.left + svgRect.width / 2;
        clientY = svgRect.top + svgRect.height / 2;
      }
    }
    if (type === "line" || type === "area" || type === "rangeArea" || type === "scatter" || type === "bubble" || type === "radar") {
      if (w.globals.pointsArray && w.globals.pointsArray[i] && w.globals.pointsArray[i][j]) {
        const pt = w.globals.pointsArray[i][j];
        const elGrid = ttCtx.getElGrid && ttCtx.getElGrid();
        if (elGrid) {
          const gridRect = elGrid.getBoundingClientRect();
          clientX = gridRect.left + (pt[0] || 0);
          clientY = gridRect.top + (pt[1] || 0);
        }
      }
    }
    ttCtx.e = { type: "mousemove", clientX, clientY };
  }
  /**
   * bar / column / candlestick / boxPlot / rangeBar
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipBar(i, j, ttCtx) {
    var _a, _b, _c, _d;
    const w = this.w;
    const shared = ttCtx.tConfig.shared && (ttCtx.tooltipUtil.isXoverlap(j) || w.globals.isBarHorizontal) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    const rangeData = (
      /** @type {any} */
      (_d = (_c = (_b = (_a = w.rangeData.seriesRange) == null ? void 0 : _a[i]) == null ? void 0 : _b[j]) == null ? void 0 : _c.y) == null ? void 0 : _d[0]
    );
    ttCtx.tooltipLabels.drawSeriesTexts(__spreadProps(__spreadValues(__spreadValues({
      ttItems: ttCtx.ttItems,
      i,
      j
    }, (rangeData == null ? void 0 : rangeData.y1) !== void 0 && { y1: rangeData.y1 }), (rangeData == null ? void 0 : rangeData.y2) !== void 0 && { y2: rangeData.y2 }), {
      shared
    }));
    const parent = `.apexcharts-series[data\\:realIndex='${i}']`;
    const elPath = w.dom.Paper.findOne(
      `${parent} path[j='${j}'], ${parent} circle[j='${j}'], ${parent} rect[j='${j}']`
    );
    if (elPath) {
      this._leaveHoveredBar();
      const graphics = new Graphics(this.w, this.ctx);
      graphics.pathMouseEnter(elPath, null);
      this._hoveredBarEl = elPath;
    }
    if (w.globals.isBarHorizontal) {
      const barDomEl = elPath && elPath.node;
      if (barDomEl) {
        const wrapRect = w.dom.elWrap.getBoundingClientRect();
        const barRect = barDomEl.getBoundingClientRect();
        const barCx = barRect.left - wrapRect.left;
        const barCy = barRect.top - wrapRect.top;
        const bh = barRect.height;
        const bw = barRect.width;
        const ttWidth = ttCtx.tooltipRect.ttWidth || 0;
        const ttHeight = ttCtx.tooltipRect.ttHeight || 0;
        const y = barCy + bh / 2 - ttHeight / 2;
        let x = barCx + bw;
        const baselineX = ttCtx.xyRatios && ttCtx.xyRatios.baseLineInvertedY != null ? ttCtx.xyRatios.baseLineInvertedY : wrapRect.width / 2;
        if (barCx < baselineX) {
          x = barCx - ttWidth;
        }
        const tooltipEl = ttCtx.getElTooltip();
        if (tooltipEl) {
          tooltipEl.style.left = x + "px";
          tooltipEl.style.top = y + "px";
        }
      }
    } else {
      ttCtx.tooltipPosition.moveStickyTooltipOverBars(j, i);
    }
  }
  /**
   * line / area / scatter / bubble / radar / rangeArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showTooltipAxisLine(i, j, ttCtx) {
    const w = this.w;
    const type = w.config.chart.type;
    const sharedConfigured = ttCtx.tConfig.shared;
    const shared = sharedConfigured && ttCtx.tooltipUtil.isXoverlap(j) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      shared
    });
    const isScatterLike = type === "scatter" || type === "bubble";
    const hasVisibleMarkers = w.globals.markers.largestSize > 0;
    if (isScatterLike) {
      this._showScatterBubblePoint(i, j, ttCtx);
    } else if (hasVisibleMarkers) {
      if (shared) {
        ttCtx.marker.enlargePoints(j);
      } else {
        ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i);
      }
    } else if (shared) {
      ttCtx.tooltipPosition.moveDynamicPointsOnHover(j);
    } else {
      ttCtx.tooltipPosition.moveDynamicPointOnHover(j, i);
    }
  }
  /**
   * Scatter / bubble: find the specific marker element for (seriesIndex i,
   * dataPointIndex j), resize only that element, and position the tooltip at
   * its coordinates — mirroring what Position.moveMarkers does for mouse hover.
   *
   * Unlike enlargePoints(j) which queries ALL series for rel===j (causing
   * multiple bubbles to enlarge and tooltip to land on the wrong one), this
   * method queries by both series index AND data-point index for precision.
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   */
  _showScatterBubblePoint(i, j, ttCtx) {
    const baseEl = this.w.dom.baseEl;
    if (this._enlargedScatterMarker) {
      ttCtx.marker.oldPointSize(this._enlargedScatterMarker);
      this._enlargedScatterMarker = null;
    }
    const seriesEl = baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}']`
    );
    if (!seriesEl) return;
    const markerEl = seriesEl.querySelector(`.apexcharts-marker[rel='${j}']`);
    if (!markerEl) return;
    ttCtx.marker.enlargeCurrentPoint(j, markerEl);
    this._enlargedScatterMarker = markerEl;
  }
  /**
   * pie / donut / polarArea
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   */
  _showTooltipNonAxis(i, j, ttCtx, tooltipEl) {
    var _a, _b;
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: j,
      shared: false
    });
    const tooltipBound = tooltipEl.getBoundingClientRect();
    const ttWidth = tooltipBound.width || ttCtx.tooltipRect.ttWidth || 0;
    const ttHeight = tooltipBound.height || ttCtx.tooltipRect.ttHeight || 0;
    const sliceEl = w.dom.baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`);
    if (sliceEl) {
      const cx = parseFloat((_a = sliceEl.getAttribute("data:cx")) != null ? _a : "");
      const cy = parseFloat((_b = sliceEl.getAttribute("data:cy")) != null ? _b : "");
      if (!isNaN(cx) && !isNaN(cy)) {
        const svgBound = w.dom.Paper.node.getBoundingClientRect();
        const wrapBound = w.dom.elWrap.getBoundingClientRect();
        const offsetX = svgBound.left - wrapBound.left;
        const offsetY = svgBound.top - wrapBound.top;
        tooltipEl.style.left = offsetX + cx - ttWidth / 2 + "px";
        tooltipEl.style.top = offsetY + cy - ttHeight - 10 + "px";
      }
    }
  }
  /**
   * radialBar — one ring per series, single value each
   * @param {number} i
   * @param {any} _j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   */
  _showTooltipRadialBar(i, _j, ttCtx, tooltipEl) {
    var _a;
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      shared: false
    });
    const { ttWidth = 0, ttHeight = 0 } = ttCtx.getCachedDimensions();
    const arcEl = w.dom.baseEl.querySelector(
      `.apexcharts-radialbar-series[data\\:realIndex='${i}'] path`
    );
    if (arcEl) {
      const angle = parseFloat((_a = arcEl.getAttribute("data:angle")) != null ? _a : "") || 0;
      const initialAngle = w.config.plotOptions.radialBar.startAngle || 0;
      const midAngle = initialAngle + angle / 2;
      const centerX = w.layout.gridWidth / 2;
      const centerY = w.layout.gridHeight / 2;
      const radialSize = w.globals.radialSize || Math.min(w.layout.gridWidth, w.layout.gridHeight) / 2;
      const seriesCount = w.seriesData.series.length;
      const trackSize = radialSize / Math.max(seriesCount, 1);
      const outerRadius = radialSize - i * trackSize;
      const innerRadius = outerRadius - trackSize;
      const ringRadius = (outerRadius + innerRadius) / 2;
      const centroid = Utils.polarToCartesian(
        centerX,
        centerY,
        ringRadius,
        midAngle
      );
      const x = centroid.x + (w.layout.translateX || 0);
      const y = centroid.y + (w.layout.translateY || 0);
      tooltipEl.style.left = x - ttWidth / 2 + "px";
      tooltipEl.style.top = y - ttHeight - 10 + "px";
    }
  }
  /**
   * heatmap / treemap — position tooltip using element bounding rect
   * @param {number} i
   * @param {number} j
   * @param {import('../tooltip/Tooltip').default} ttCtx
   * @param {HTMLElement} tooltipEl
   * @param {string} type
   */
  _showTooltipHeatTree(i, j, ttCtx, tooltipEl, type) {
    var _a, _b;
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i,
      j,
      shared: false
    });
    const tooltipRect = tooltipEl.getBoundingClientRect();
    const ttWidth = tooltipRect.width || ttCtx.tooltipRect.ttWidth || 0;
    const ttHeight = tooltipRect.height || ttCtx.tooltipRect.ttHeight || 0;
    const rectClass = type === "heatmap" ? "apexcharts-heatmap-rect" : "apexcharts-treemap-rect";
    const cell = w.dom.baseEl.querySelector(`.${rectClass}[i='${i}'][j='${j}']`);
    if (cell) {
      const wrapRect = w.dom.elWrap.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const cellCx = cellRect.left - wrapRect.left;
      const cellCy = cellRect.top - wrapRect.top;
      const cellWidth = cellRect.width;
      const cellHeight = cellRect.height;
      const cx = parseFloat((_a = cell.getAttribute("cx")) != null ? _a : "");
      const cellWidthAttr = parseFloat((_b = cell.getAttribute("width")) != null ? _b : "");
      ttCtx.tooltipPosition.moveXCrosshairs(cx + cellWidthAttr / 2);
      let x = cellCx + cellWidth + ttWidth / 2;
      const y = cellCy + cellHeight / 2 - ttHeight / 2;
      if (cellCx + cellWidth > w.layout.gridWidth / 2) {
        x = cellCx - ttWidth / 2;
      }
      tooltipEl.style.left = x + "px";
      tooltipEl.style.top = y + "px";
    }
  }
  // ─── Focus class management ───────────────────────────────────────────────
  /**
   * @param {number} i
   * @param {number} j
   */
  _applyFocusClass(i, j) {
    this._removeFocusClass();
    const el = this._getFocusableElement(i, j);
    if (el) {
      el.classList.add("apexcharts-keyboard-focused");
      el.setAttribute("role", "img");
      const label = this._buildPointLabel(i, j);
      if (label) el.setAttribute("aria-label", label);
      this._focusedEl = el;
    }
  }
  _removeFocusClass() {
    if (this._focusedEl) {
      this._focusedEl.classList.remove("apexcharts-keyboard-focused");
      this._focusedEl.removeAttribute("role");
      this._focusedEl.removeAttribute("aria-label");
      this._focusedEl = null;
    }
  }
  /**
   * Build an accessible label for the data point at (i, j) using the same
   * formatters the visible tooltip / axis labels use, so SR output matches
   * the visual presentation.
   * @param {number} i
   * @param {number} j
   * @returns {string}
   */
  _buildPointLabel(i, j) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const w = this.w;
    const type = w.config.chart.type;
    const seriesNames = w.seriesData.seriesNames || [];
    const series = w.seriesData.series || [];
    if (type === "pie" || type === "donut" || type === "polarArea") {
      const sliceLabel = (_b = ((_a = w.labelData) == null ? void 0 : _a.labels) && w.labelData.labels[j]) != null ? _b : "";
      const value = Array.isArray(series) ? series[j] : "";
      return sliceLabel ? `${sliceLabel}: ${value}` : `${value}`;
    }
    if (type === "radialBar") {
      const seriesName2 = seriesNames[i] || `Series ${i + 1}`;
      const value = Array.isArray(series) ? series[i] : "";
      return `${seriesName2}: ${value}`;
    }
    const seriesName = seriesNames[i] || `Series ${i + 1}`;
    const row = Array.isArray(series[i]) ? series[i] : [];
    const rawValue = row[j];
    let formattedValue = rawValue == null ? "" : String(rawValue);
    const yFormatter = (_d = (_c = w.formatters) == null ? void 0 : _c.yLabelFormatters) == null ? void 0 : _d[i];
    if (typeof yFormatter === "function") {
      try {
        formattedValue = yFormatter(rawValue, {
          seriesIndex: i,
          dataPointIndex: j,
          w
        });
      } catch (e) {
      }
    }
    let category = "";
    const categoryLabels = (_e = w.labelData) == null ? void 0 : _e.categoryLabels;
    const seriesX = (_g = (_f = w.seriesData) == null ? void 0 : _f.seriesX) == null ? void 0 : _g[i];
    if (Array.isArray(categoryLabels) && categoryLabels[j] != null) {
      category = String(categoryLabels[j]);
    } else if (Array.isArray(seriesX) && seriesX[j] != null) {
      const xFormatter = (_h = w.formatters) == null ? void 0 : _h.xLabelFormatter;
      if (typeof xFormatter === "function") {
        try {
          category = String(
            xFormatter(seriesX[j], { seriesIndex: i, dataPointIndex: j, w })
          );
        } catch (e) {
          category = String(seriesX[j]);
        }
      } else {
        category = String(seriesX[j]);
      }
    }
    return category ? `${seriesName}: ${formattedValue}, ${category}` : `${seriesName}: ${formattedValue}`;
  }
  _leaveHoveredBar() {
    if (this._hoveredBarEl) {
      const graphics = new Graphics(this.w, this.ctx);
      graphics.pathMouseLeave(this._hoveredBarEl, null);
      this._hoveredBarEl = null;
    }
  }
  /**
   * @param {number} i
   * @param {number} j
   */
  _getFocusableElement(i, j) {
    const w = this.w;
    const type = w.config.chart.type;
    const baseEl = w.dom.baseEl;
    if (type === "pie" || type === "donut" || type === "polarArea") {
      return baseEl.querySelector(`.apexcharts-pie-area[j='${j}']`);
    }
    if (type === "heatmap") {
      return baseEl.querySelector(
        `.apexcharts-heatmap-rect[i='${i}'][j='${j}']`
      );
    }
    if (type === "treemap") {
      return baseEl.querySelector(
        `.apexcharts-treemap-rect[i='${i}'][j='${j}']`
      );
    }
    if (type === "radialBar") {
      return baseEl.querySelector(
        `.apexcharts-radialbar-series[data\\:realIndex='${i}'] path`
      );
    }
    if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "violin" || type === "rangeBar") {
      return baseEl.querySelector(
        `.apexcharts-series[data\\:realIndex='${i}'] path[j='${j}']`
      );
    }
    const marker = baseEl.querySelector(
      `.apexcharts-series[data\\:realIndex='${i}'] .apexcharts-marker[rel='${j}']`
    );
    return marker || null;
  }
  // ─── Click / Enter ────────────────────────────────────────────────────────
  _fireClick() {
    const w = this.w;
    const ttCtx = w.globals.tooltip;
    if (!ttCtx) return;
    const syntheticEvent = {
      type: "mouseup",
      clientX: 0,
      clientY: 0
    };
    ttCtx.markerClick(syntheticEvent, this.seriesIndex, this.dataPointIndex);
  }
  // ─── Helpers ──────────────────────────────────────────────────────────────
  _isNavEnabled() {
    const a11y = this.w.config.chart.accessibility;
    return a11y.enabled && a11y.keyboard.enabled && a11y.keyboard.navigation.enabled;
  }
  _getSeriesCount() {
    const w = this.w;
    const type = w.config.chart.type;
    if (type === "pie" || type === "donut" || type === "polarArea") {
      return 1;
    }
    return w.seriesData.series.length;
  }
  /**
   * @param {number} si
   */
  _getDataPointCount(si) {
    const w = this.w;
    const type = w.config.chart.type;
    if (type === "pie" || type === "donut" || type === "polarArea") {
      return w.seriesData.series.length;
    }
    const series = w.seriesData.series;
    return series[si] && Array.isArray(series[si]) ? series[si].length : 0;
  }
  _clampCursor() {
    const seriesCount = this._getSeriesCount();
    if (this.seriesIndex >= seriesCount) this.seriesIndex = seriesCount - 1;
    if (this.seriesIndex < 0) this.seriesIndex = 0;
    const dpCount = this._getDataPointCount(this.seriesIndex);
    if (this.dataPointIndex >= dpCount) this.dataPointIndex = dpCount - 1;
    if (this.dataPointIndex < 0) this.dataPointIndex = 0;
  }
  /**
   * When the chart is zoomed in, the current dataPointIndex may point to a
   * data point that is outside the visible viewport. Snap the cursor to the
   * first data point whose x-value falls within [minX, maxX].
   *
   * Only adjusts when w.seriesData.seriesX is populated (numeric/datetime axes).
   * Category-only charts (seriesX entries are strings or auto-indices) are
   * unaffected — all points are always visible.
   */
  _snapToVisibleRange() {
    const w = this.w;
    const gl = w.globals;
    const si = this.seriesIndex;
    if (!w.interact.zoomed) return;
    const seriesX = w.seriesData.seriesX && w.seriesData.seriesX[si];
    if (!seriesX || !seriesX.length) return;
    const minX = gl.minX;
    const maxX = gl.maxX;
    if (minX === void 0 || maxX === void 0) return;
    const currentX = seriesX[this.dataPointIndex];
    if (currentX >= minX && currentX <= maxX) return;
    const dpCount = seriesX.length;
    for (let di = 0; di < dpCount; di++) {
      if (seriesX[di] >= minX && seriesX[di] <= maxX) {
        this.dataPointIndex = di;
        return;
      }
    }
  }
  /**
   * Snap to the nearest visible data point in the given navigation direction.
   * direction > 0 → find the first visible point (left boundary of zoomed range)
   * direction < 0 → find the last visible point (right boundary of zoomed range)
   * @param {number} direction
   */
  _snapToVisibleRangeInDirection(direction) {
    const w = this.w;
    const gl = w.globals;
    const si = this.seriesIndex;
    const seriesX = w.seriesData.seriesX && w.seriesData.seriesX[si];
    if (!seriesX || !seriesX.length) return;
    const minX = gl.minX;
    const maxX = gl.maxX;
    if (minX === void 0 || maxX === void 0) return;
    const dpCount = seriesX.length;
    if (direction >= 0) {
      for (let di = 0; di < dpCount; di++) {
        if (seriesX[di] >= minX && seriesX[di] <= maxX) {
          this.dataPointIndex = di;
          return;
        }
      }
    } else {
      for (let di = dpCount - 1; di >= 0; di--) {
        if (seriesX[di] >= minX && seriesX[di] <= maxX) {
          this.dataPointIndex = di;
          return;
        }
      }
    }
  }
  /**
   * Check whether the data point at (si, di) is within the current visible
   * x-axis range. Used to skip out-of-viewport points during keyboard nav.
   * @param {number} si
   * @param {number} di
   */
  _isDataPointVisible(si, di) {
    const w = this.w;
    const gl = w.globals;
    if (!w.interact.zoomed) return true;
    const seriesX = w.seriesData.seriesX && w.seriesData.seriesX[si];
    if (!seriesX) return true;
    const x = seriesX[di];
    if (x === void 0) return true;
    return x >= gl.minX && x <= gl.maxX;
  }
  /**
   * Push a short status message to the visually-hidden aria-live region so
   * screen readers announce zoom / pan / reset events that have no inherent
   * tooltip update. Silently no-op if the region is missing or announcements
   * are disabled.
   * @param {string} message
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
ApexCharts__default.registerFeatures({ keyboardNavigation: KeyboardNavigation });
const parsePath = ApexCharts.__apex_PathMorphing_parsePath;
const BAR_FAMILY = /* @__PURE__ */ new Set(["bar", "funnel", "pyramid"]);
const RADIAL_FAMILY = /* @__PURE__ */ new Set(["pie", "donut", "polarArea", "radialBar", "gauge"]);
function familyOf(type) {
  if (BAR_FAMILY.has(type)) return "bar";
  if (RADIAL_FAMILY.has(type)) return "radial";
  return null;
}
class MorphTypeChange {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this._snapshot = null;
  }
  /**
   * @param {string} fromType
   * @param {string} toType
   * @returns {boolean}
   */
  canMorphTypes(fromType, toType) {
    if (fromType === toType) return false;
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    if (!ff || !tf) return false;
    return true;
  }
  /**
   * @param {string} fromType
   * @param {string} toType
   * @param {any} newSeries
   * @returns {boolean}
   */
  isCompatibleSeriesShape(fromType, toType, newSeries) {
    if (!Array.isArray(newSeries) || newSeries.length === 0) return false;
    const ff = familyOf(fromType);
    const tf = familyOf(toType);
    if (tf === "radial") {
      if (newSeries.every((v) => typeof v === "number")) return true;
      return newSeries.length === 1 && newSeries[0] && typeof newSeries[0] === "object" && Array.isArray(newSeries[0].data);
    }
    if (tf === "bar") {
      return newSeries.every(
        (s) => s && typeof s === "object" && Array.isArray(s.data)
      );
    }
    return ff !== null && tf !== null;
  }
  /**
   * Capture the live DOM of the *current* (outgoing) chart and stash it on
   * this module. Called from `apexcharts._updateOptions` before the config
   * merge that flips `chart.type`.
   *
   * Returns true if a morph is queued — caller doesn't need the value, but
   * tests use it.
   *
   * @param {{ fromType: string, toType: string, newSeries: any }} args
   * @returns {boolean}
   */
  captureBeforeDestroy({ fromType, toType, newSeries }) {
    this._snapshot = null;
    if (!Environment.isBrowser()) return false;
    const animCfg = this.w.config.chart.animations;
    if (!animCfg || animCfg.enabled === false) return false;
    if (animCfg.chartTypeMorph && animCfg.chartTypeMorph.enabled === false)
      return false;
    if (animCfg.respectReducedMotion && prefersReducedMotion()) return false;
    if (!this.canMorphTypes(fromType, toType)) return false;
    if (!this.isCompatibleSeriesShape(fromType, toType, newSeries)) return false;
    const captured = this._captureFromDOM(fromType);
    if (!captured.length) return false;
    const mapping = this._buildMapping(captured, fromType, toType, newSeries);
    if (mapping.size === 0) return false;
    this._snapshot = {
      fromType,
      toType,
      mapping,
      oldLayout: {
        translateX: this.w.layout.translateX || 0,
        translateY: this.w.layout.translateY || 0
      }
    };
    this.w.globals.previousPaths = [];
    return true;
  }
  /**
   * Walk the outgoing chart's DOM and collect path `d` strings keyed by
   * (realIndex, j). The selectors are scoped to the chart family — bar
   * elements have `pathTo` set; pie/radial elements use their final `d`.
   *
   * @param {string} fromType
   * @returns {Array<{ realIndex: number, j: number, d: string, fill: string|null }>}
   */
  _captureFromDOM(fromType) {
    var _a;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return [];
    const captured = [];
    const fam = familyOf(fromType);
    if (fam === "bar") {
      const seriesNodes = baseEl.querySelectorAll(
        ".apexcharts-bar-series .apexcharts-series"
      );
      seriesNodes.forEach((seriesNode) => {
        var _a2;
        const realIndex = parseInt(
          (_a2 = seriesNode.getAttribute("data:realIndex")) != null ? _a2 : "0",
          10
        );
        const paths = seriesNode.querySelectorAll("path[pathTo]");
        paths.forEach((p, j) => {
          const d = p.getAttribute("pathTo") || p.getAttribute("d");
          if (!d) return;
          captured.push({
            realIndex,
            j,
            d,
            fill: p.getAttribute("fill")
          });
        });
      });
    } else if (fam === "radial") {
      if (fromType === "radialBar" || fromType === "gauge") {
        const centerX = this.w.layout.gridWidth / 2;
        const centerY = Math.min(this.w.layout.gridWidth, this.w.layout.gridHeight) / 2;
        const rings = baseEl.querySelectorAll(
          ".apexcharts-radial-series .apexcharts-radialbar-area"
        );
        rings.forEach((p) => {
          var _a2;
          const parent = (
            /** @type {Element|null} */
            p.parentElement
          );
          const realIndex = parseInt(
            (_a2 = parent == null ? void 0 : parent.getAttribute("data:realIndex")) != null ? _a2 : "0",
            10
          );
          const rawD = p.getAttribute("d");
          if (!rawD) return;
          const strokeWidth = parseFloat(p.getAttribute("stroke-width") || "0");
          const d = strokeWidth > 1 ? this._radialArcToFilledSegment(
            rawD,
            strokeWidth,
            centerX,
            centerY
          ) || rawD : rawD;
          captured.push({
            realIndex,
            j: 0,
            d,
            fill: p.getAttribute("stroke")
          });
        });
      } else {
        const slices = baseEl.querySelectorAll(
          ".apexcharts-pie-series .apexcharts-pie-area"
        );
        slices.forEach(
          (p, i) => {
            const d = p.getAttribute("d");
            if (!d) return;
            captured.push({
              realIndex: i,
              j: 0,
              d,
              fill: p.getAttribute("fill")
            });
          }
        );
      }
    }
    return captured;
  }
  /**
   * Convert a radialBar's stroked open-arc `d` ("M x1 y1 A r r 0 large sweep
   * x2 y2") into a closed donut-segment polygon whose FILLED rendering
   * visually matches the original stroked arc — needed because the morph
   * target (pie/donut/polarArea) renders by fill, not stroke. Returns null
   * if the input doesn't match the expected M-then-A shape.
   *
   * @param {string} rawD
   * @param {number} strokeWidth
   * @param {number} centerX
   * @param {number} centerY
   * @returns {string | null}
   */
  _radialArcToFilledSegment(rawD, strokeWidth, centerX, centerY) {
    const m = rawD.match(
      /M\s*(-?[\d.]+)\s+(-?[\d.]+)\s+A\s*(-?[\d.]+)\s+(?:-?[\d.]+)\s+(?:-?[\d.]+)\s+(\d)\s+(\d)\s+(-?[\d.]+)\s+(-?[\d.]+)/
    );
    if (!m) return null;
    const x1 = parseFloat(m[1]);
    const y1 = parseFloat(m[2]);
    const r = parseFloat(m[3]);
    const large = parseInt(m[4], 10);
    const sweep = parseInt(m[5], 10);
    const x2 = parseFloat(m[6]);
    const y2 = parseFloat(m[7]);
    if (!isFinite(r) || r <= 0) return null;
    const half = strokeWidth / 2;
    const rOuter = r + half;
    const rInner = Math.max(0, r - half);
    const proj = (px, py, newR) => {
      const dx = px - centerX;
      const dy = py - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return { x: centerX, y: centerY };
      const k = newR / dist;
      return { x: centerX + dx * k, y: centerY + dy * k };
    };
    const o1 = proj(x1, y1, rOuter);
    const o2 = proj(x2, y2, rOuter);
    const i1 = proj(x1, y1, rInner);
    const i2 = proj(x2, y2, rInner);
    const sweepBack = sweep ? 0 : 1;
    return `M ${o1.x} ${o1.y} A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${o2.x} ${o2.y} L ${i2.x} ${i2.y} A ${rInner} ${rInner} 0 ${large} ${sweepBack} ${i1.x} ${i1.y} Z`;
  }
  /**
   * Build a closed donut-segment path for the given polar arc geometry. Used
   * by Radial.drawArcs when morphing FROM a filled wedge (pie/donut/polarArea)
   * TO a radialBar arc: the final radialBar is rendered as a stroked open arc,
   * but during the morph we tween d toward this closed-segment form (which
   * looks identical to the stroked arc when filled with the same color) so
   * the in-between frames remain visually consistent filled shapes rather
   * than a thick-outlined wedge.
   *
   * @param {number} centerX
   * @param {number} centerY
   * @param {number} ringRadius - centerline radius of the radialBar ring
   * @param {number} strokeWidth - the ring's stroke thickness
   * @param {number} startAngleDeg - in degrees, 0° = top (12 o'clock)
   * @param {number} endAngleDeg
   * @returns {string}
   */
  buildRingSegmentPath(centerX, centerY, ringRadius, strokeWidth, startAngleDeg, endAngleDeg) {
    const halfStroke = strokeWidth / 2;
    const rOuter = ringRadius + halfStroke;
    const rInner = Math.max(0, ringRadius - halfStroke);
    const sRad = (startAngleDeg - 90) * Math.PI / 180;
    const eRad = (endAngleDeg - 90) * Math.PI / 180;
    const oStart = {
      x: centerX + rOuter * Math.cos(sRad),
      y: centerY + rOuter * Math.sin(sRad)
    };
    const oEnd = {
      x: centerX + rOuter * Math.cos(eRad),
      y: centerY + rOuter * Math.sin(eRad)
    };
    const iStart = {
      x: centerX + rInner * Math.cos(sRad),
      y: centerY + rInner * Math.sin(sRad)
    };
    const iEnd = {
      x: centerX + rInner * Math.cos(eRad),
      y: centerY + rInner * Math.sin(eRad)
    };
    const sweep = endAngleDeg > startAngleDeg ? 1 : 0;
    const large = Math.abs(endAngleDeg - startAngleDeg) > 180 ? 1 : 0;
    return `M ${oStart.x} ${oStart.y} A ${rOuter} ${rOuter} 0 ${large} ${sweep} ${oEnd.x} ${oEnd.y} L ${iEnd.x} ${iEnd.y} A ${rInner} ${rInner} 0 ${large} ${1 - sweep} ${iStart.x} ${iStart.y} Z`;
  }
  /**
   * @returns {string | null} the chart-type the active snapshot was captured
   *   from, or null when no morph is in flight.
   */
  getFromType() {
    return this._snapshot ? this._snapshot.fromType : null;
  }
  /**
   * Build a (targetKey → captured) map. The targetKey matches the lookup
   * pattern each chart-type renderer uses when it asks
   * `getInitialPathFor(realIndex, j)`.
   *
   * Strategy: flatten the captured items into a linear sequence (matching the
   * source chart's natural DOM iteration order: series-then-point for bar,
   * ring-by-ring for radial), then walk the target's iteration positions in
   * the same order and pair them up 1:1. This handles every supported shape
   * without per-pair branching:
   *
   *   - bar (1 series, N pts) ↔ radial-family (N items)  → linear[k] ↔ k
   *   - bar (M series, 1 pt)  ↔ radial-family (M items)  → linear[k] ↔ k
   *   - radial-family (N items) ↔ bar (any matching shape) → linear[k] ↔ flat target
   *   - radial-family ↔ radial-family                    → linear[k] ↔ k
   *
   * @param {Array<{ realIndex: number, j: number, d: string, fill: string|null }>} captured
   * @param {string} _fromType
   * @param {string} toType
   * @param {any} newSeries - the series array being passed to the new chart;
   *   used only to derive the bar target's (realIndex, j) iteration positions.
   */
  _buildMapping(captured, _fromType, toType, newSeries) {
    const map = /* @__PURE__ */ new Map();
    const tf = familyOf(toType);
    const flat = captured.slice().sort((a, b) => a.realIndex - b.realIndex || a.j - b.j);
    if (tf === "radial") {
      flat.forEach((c, i) => {
        map.set(`${i}:0`, { d: c.d, fill: c.fill });
      });
      return map;
    }
    if (tf === "bar") {
      const positions = [];
      const series = Array.isArray(newSeries) ? newSeries : [];
      series.forEach((s, seriesIdx) => {
        const data = s && Array.isArray(s.data) ? s.data : [];
        for (let j = 0; j < data.length; j++) {
          positions.push({ realIndex: seriesIdx, j });
        }
      });
      flat.forEach((c, i) => {
        const pos = positions[i];
        if (pos) {
          map.set(`${pos.realIndex}:${pos.j}`, { d: c.d, fill: c.fill });
        }
      });
      return map;
    }
    return map;
  }
  isActive() {
    return this._snapshot !== null;
  }
  /**
   * @param {number} realIndex
   * @param {number} j
   * @returns {string | null}
   */
  getInitialPathFor(realIndex, j) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`);
    if (!entry) return null;
    const dx = this._snapshot.oldLayout.translateX - (this.w.layout.translateX || 0);
    const dy = this._snapshot.oldLayout.translateY - (this.w.layout.translateY || 0);
    return dx === 0 && dy === 0 ? entry.d : this._translatePathD(entry.d, dx, dy);
  }
  /**
   * Offset every absolute coordinate in an SVG path `d` by (dx, dy).
   *
   * Assumes the path uses only uppercase (absolute) commands — every path
   * ApexCharts generates does. Relative-command paths would pass through
   * unchanged at the lowercase, which is also semantically correct (deltas
   * don't shift under a parent translate).
   *
   * @param {string} d
   * @param {number} dx
   * @param {number} dy
   * @returns {string}
   */
  _translatePathD(d, dx, dy) {
    if (dx === 0 && dy === 0) return d;
    const commands = parsePath(d);
    return commands.map(
      /** @param {any[]} c */
      (c) => {
        const cmd = c[0];
        if (cmd === "Z") return "Z";
        if (cmd === "M" || cmd === "L" || cmd === "T") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy}`;
        }
        if (cmd === "H") return `${cmd} ${c[1] + dx}`;
        if (cmd === "V") return `${cmd} ${c[1] + dy}`;
        if (cmd === "C") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy} ${c[5] + dx} ${c[6] + dy}`;
        }
        if (cmd === "S" || cmd === "Q") {
          return `${cmd} ${c[1] + dx} ${c[2] + dy} ${c[3] + dx} ${c[4] + dy}`;
        }
        if (cmd === "A") {
          return `${cmd} ${c[1]} ${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6] + dx} ${c[7] + dy}`;
        }
        return c.join(" ");
      }
    ).join(" ");
  }
  /**
   * @param {number} realIndex
   * @param {number} j
   * @returns {string | null}
   */
  getInitialFillFor(realIndex, j) {
    if (!this._snapshot) return null;
    const entry = this._snapshot.mapping.get(`${realIndex}:${j}`);
    return entry ? entry.fill : null;
  }
  /** @returns {number} */
  getSpeed() {
    const animCfg = this.w.config.chart.animations;
    return animCfg.chartTypeMorph && animCfg.chartTypeMorph.speed || animCfg.speed || 600;
  }
  /**
   * Fade newly-mounted axes / grid / legend / titles from opacity 0 → 1 in
   * parallel with the morph. Without this the chart's chrome would pop in
   * abruptly while the series elements are still mid-tween, which reads as a
   * jarring layout shift.
   */
  applyChromeFade() {
    var _a;
    if (!this._snapshot || !Environment.isBrowser()) return;
    const baseEl = (_a = this.w.globals.dom) == null ? void 0 : _a.baseEl;
    if (!baseEl) return;
    const speed = this.getSpeed();
    const chromeSelectors = [
      ".apexcharts-xaxis",
      ".apexcharts-yaxis",
      ".apexcharts-grid",
      ".apexcharts-gridlines-horizontal",
      ".apexcharts-gridlines-vertical",
      ".apexcharts-legend",
      ".apexcharts-title-text",
      ".apexcharts-subtitle-text"
    ];
    chromeSelectors.forEach((sel) => {
      baseEl.querySelectorAll(sel).forEach((el) => {
        if (!el.style) return;
        el.style.opacity = "0";
        el.style.transition = `opacity ${speed}ms ease-out`;
        BrowserAPIs.requestAnimationFrame(() => {
          el.style.opacity = "1";
        });
        setTimeout(() => {
          el.style.transition = "";
          el.style.opacity = "";
        }, speed + 80);
      });
    });
    setTimeout(() => this.cleanup(), speed + 100);
  }
  cleanup() {
    this._snapshot = null;
  }
}
ApexCharts__default.registerFeatures({ morphTypeChange: MorphTypeChange });
const XHTML = "http://www.w3.org/1999/xhtml";
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
    const nav = BrowserAPIs.createElementNS(XHTML, "nav");
    nav.setAttribute("class", "apexcharts-breadcrumb");
    nav.setAttribute("aria-label", "Drilldown breadcrumb");
    this._position(nav, cfg);
    const separator = cfg.separator != null ? cfg.separator : " / ";
    path.forEach((id, i) => {
      if (i > 0) {
        const sep = BrowserAPIs.createElementNS(XHTML, "span");
        sep.setAttribute("class", "apexcharts-breadcrumb-separator");
        sep.setAttribute("aria-hidden", "true");
        sep.textContent = separator;
        nav.appendChild(sep);
      }
      const label = this._label(id, i);
      const isCurrent = i === path.length - 1;
      if (isCurrent) {
        const cur = BrowserAPIs.createElementNS(XHTML, "span");
        cur.setAttribute(
          "class",
          "apexcharts-breadcrumb-item apexcharts-breadcrumb-current"
        );
        cur.setAttribute("aria-current", "page");
        cur.textContent = label;
        nav.appendChild(cur);
      } else {
        const btn = (
          /** @type {HTMLButtonElement} */
          BrowserAPIs.createElementNS(XHTML, "button")
        );
        btn.setAttribute("type", "button");
        btn.setAttribute("class", "apexcharts-breadcrumb-item");
        if (i === 0) {
          const arrow = BrowserAPIs.createElementNS(XHTML, "span");
          arrow.setAttribute("class", "apexcharts-breadcrumb-arrow");
          arrow.setAttribute("aria-hidden", "true");
          arrow.textContent = "←";
          btn.appendChild(arrow);
        }
        const text = BrowserAPIs.createElementNS(XHTML, "span");
        text.setAttribute("class", "apexcharts-breadcrumb-label");
        text.textContent = label;
        btn.appendChild(text);
        btn.addEventListener("click", () => this.drilldown.drillToLevel(i));
        nav.appendChild(btn);
      }
    });
    elWrap.appendChild(nav);
  }
  /**
   * @param {string|number} id
   * @param {number} index
   * @returns {string}
   */
  _label(id, index) {
    const cfg = this.w.config.drilldown.breadcrumb;
    let label;
    if (index === 0) {
      label = cfg.rootLabel != null ? cfg.rootLabel : "All";
    } else {
      const list = (this.w.config.drilldown.series || []).find(
        (s) => s && s.id === id
      );
      label = list && list.name || String(id);
    }
    if (typeof cfg.formatter === "function") {
      return cfg.formatter(label, { index, depth: this.drilldown.depth });
    }
    return label;
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
const MAX_DEPTH = 32;
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
    this.breadcrumb = new Breadcrumb(w, ctx, this);
    this._onPointSelect = this._onPointSelect.bind(this);
    this._afterRender = this._afterRender.bind(this);
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
    return list.find((s) => s && s.id === id) || null;
  }
  /**
   * @param {any} child
   * @param {any} [triggerPoint]
   * @param {object} [meta]
   * @returns {Promise<any>}
   */
  _drillInto(child, triggerPoint, meta) {
    if (this.stack.length >= MAX_DEPTH) {
      console.warn(`ApexCharts: drilldown max depth (${MAX_DEPTH}) reached.`);
      return Promise.resolve(this.ctx);
    }
    if (!this.rootSnapshot) this.rootSnapshot = this._snapshot();
    const from = this.path[this.path.length - 1];
    this.stack.push({ id: child.id, name: child.name, restore: this._snapshot() });
    return this._apply(this._viewFromChild(child), "down", {
      from,
      to: child.id,
      point: triggerPoint,
      seriesIndex: meta && meta.seriesIndex,
      dataPointIndex: meta && meta.dataPointIndex
    });
  }
  /**
   * Minimal async resolver (loading overlay lands in Phase 3).
   * @param {string|number|null} id
   * @param {any} point
   * @param {object} [meta]
   * @returns {Promise<any>}
   */
  _drillDownAsync(id, point, meta) {
    const fn = this.w.config.drilldown.onDrillDown;
    let result;
    try {
      result = fn({
        point,
        seriesIndex: meta && meta.seriesIndex,
        dataPointIndex: meta && meta.dataPointIndex
      });
    } catch (error) {
      this._fire("drillDownError", { id, error });
      return Promise.resolve(this.ctx);
    }
    return Promise.resolve(result).then(
      (child) => {
        if (!child || !child.data) return this.ctx;
        return this._drillInto(child, point, meta);
      },
      (error) => {
        this._fire("drillDownError", { id, error });
        return this.ctx;
      }
    );
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
    const snap = { series: Utils.clone(c.series) };
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
   * Union of overridable fields across all declared drilldown levels. Ensures a
   * deep drillToRoot restores everything any intermediate level may have changed.
   * @returns {Set<string>}
   */
  _overrideFields() {
    const fields = /* @__PURE__ */ new Set();
    const list = this.w.config.drilldown && this.w.config.drilldown.series || [];
    for (const s of list) {
      if (!s) continue;
      if (s.xaxis) fields.add("xaxis");
      if (s.yaxis) fields.add("yaxis");
      if (s.colors) fields.add("colors");
      if (s.plotOptions) fields.add("plotOptions");
      if (s.fill) fields.add("fill");
      if (s.legend) fields.add("legend");
    }
    return fields;
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
    if (child.xaxis) view.xaxis = child.xaxis;
    if (child.yaxis) view.yaxis = child.yaxis;
    if (child.colors) view.colors = child.colors;
    if (child.plotOptions) view.plotOptions = child.plotOptions;
    if (child.fill) view.fill = child.fill;
    if (child.legend) view.legend = child.legend;
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
    if (snap.xaxis) view.xaxis = snap.xaxis;
    if (snap.yaxis) view.yaxis = snap.yaxis;
    if (snap.colors) view.colors = snap.colors;
    if (snap.plotOptions) view.plotOptions = snap.plotOptions;
    if (snap.fill) view.fill = snap.fill;
    if (snap.legend) view.legend = snap.legend;
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
    const w = this.w;
    w.interact.selectedDataPoints = [];
    w.globals.collapsedSeries = [];
    w.globals.collapsedSeriesIndices = [];
    w.globals.ancillaryCollapsedSeries = [];
    w.globals.ancillaryCollapsedSeriesIndices = [];
    w.globals.allSeriesCollapsed = false;
    w.globals.risingSeries = [];
    const animate = (!w.config.drilldown.animation || w.config.drilldown.animation.enabled !== false) && w.config.chart.animations.enabled !== false;
    if (direction === "down") this._fire("drillDownStart", meta);
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
    const a = this.w.config.drilldown && this.w.config.drilldown.animation;
    return !!(a && a.zoomFromPoint);
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
    const group = this._markGroup();
    if (!svg || !group || typeof group.animate !== "function" || typeof svg.getBoundingClientRect !== "function") {
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
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - svgRect.left,
        y: r.top + r.height / 2 - svgRect.top
      };
    }
    const gRect = group.getBoundingClientRect();
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
        } catch (e) {
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
        } catch (e) {
        }
        clear(inGroup);
        inAnim.cancel();
      }
    });
  }
  /** @returns {number} per-phase zoom duration in ms. */
  _zoomDuration() {
    const a = this.w.config.drilldown && this.w.config.drilldown.animation;
    const speed = a && typeof a.speed === "number" ? a.speed : 260;
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
    const s = series[seriesIndex];
    if (!s || !Array.isArray(s.data)) return null;
    return s.data[dataPointIndex] != null ? s.data[dataPointIndex] : null;
  }
  _afterRender() {
    if (!this.w.config.drilldown || !this.w.config.drilldown.enabled) return;
    this._markDrillableTargets();
    this.breadcrumb.render(this.path);
  }
  /**
   * Add the drilldown-target cursor class to every point that carries a
   * `drilldown` field. Best-effort and cosmetic — a missed selector is harmless.
   */
  _markDrillableTargets() {
    if (!Environment.isBrowser()) return;
    const w = this.w;
    const baseEl = w.dom.baseEl;
    const series = w.config.series;
    if (!baseEl || !Array.isArray(series)) return;
    series.forEach((s, i) => {
      const data = s && Array.isArray(s.data) ? s.data : null;
      if (!data) return;
      data.forEach((point, j) => {
        if (!point || typeof point !== "object" || point.drilldown == null) return;
        const nodes = baseEl.querySelectorAll(`[index="${i}"][j="${j}"]`);
        nodes.forEach(
          (node) => node.classList.add("apexcharts-drilldown-target")
        );
      });
    });
  }
}
ApexCharts__default.registerFeatures({ drilldown: Drilldown });
const VIEWSTATE_VERSION = 1;
function axisWindow(min, max) {
  const hasMin = min !== void 0 && min !== null;
  const hasMax = max !== void 0 && max !== null;
  if (!hasMin && !hasMax) return null;
  return { min: hasMin ? min : null, max: hasMax ? max : null };
}
function cloneSelection(sel) {
  if (!Array.isArray(sel)) return [];
  return sel.map((a) => Array.isArray(a) ? a.slice() : a);
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
  const names = w.globals.seriesNames || [];
  const target = /* @__PURE__ */ new Set([
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
    const shouldCollapse = target.has(realIndex);
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
    view.annotations.dynamic.forEach((a) => {
      const method = addMethodName(a.kind);
      if (method && typeof ctx[method] === "function") {
        ctx[method](a.params, true);
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
function base64Decode(encoded) {
  if (typeof atob === "function") return atob(encoded);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(encoded, "base64").toString("binary");
  }
  throw new Error("no base64 decoder available");
}
function base64Encode(str) {
  if (typeof btoa === "function") return btoa(str);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "binary").toString("base64");
  }
  throw new Error("no base64 encoder available");
}
function currentHostname() {
  return typeof window !== "undefined" && window.location ? window.location.hostname : "";
}
class LicenseManager {
  /**
   * Decode license data from an encoded string (base64 + JSON).
   * @param {string} encodedData
   * @returns {LicenseData | null}
   */
  static decodeLicenseData(encodedData) {
    try {
      const decodedString = base64Decode(encodedData);
      const data = JSON.parse(decodedString);
      if (!data.issueDate || !data.expiryDate || !data.plan) {
        return null;
      }
      return {
        domains: Array.isArray(data.domains) ? data.domains : void 0,
        expiryDate: data.expiryDate,
        issueDate: data.issueDate,
        plan: data.plan,
        valid: true
      };
    } catch (e) {
      return null;
    }
  }
  /**
   * Generate a license key (issuer-side helper; also used by tests). Mirrors
   * the family exactly so keys stay cross-compatible.
   * @param {string} issueDate
   * @param {string} expiryDate
   * @param {string} [plan]
   * @param {string[]} [domains]
   * @returns {string}
   */
  static generateLicenseKey(issueDate, expiryDate, plan = "standard", domains) {
    const licenseData = { expiryDate, issueDate, plan };
    if (domains && domains.length > 0) {
      licenseData.domains = domains;
    }
    return `APEX-${base64Encode(JSON.stringify(licenseData))}`;
  }
  /**
   * Validate an arbitrary key WITHOUT mutating the singleton. Used to resolve
   * per-chart (`chart.license`) and global (`window.Apex.license`) keys, which
   * bypass setLicense. This is a superset of the family (which keeps
   * validateLicense private); the format and rules are identical.
   * @param {string} key
   * @returns {LicenseValidationResult}
   */
  static validateKey(key) {
    try {
      if (typeof key !== "string" || !key.startsWith("APEX-")) {
        return {
          expired: false,
          message: 'Invalid license key format. License key must start with "APEX-".',
          valid: false
        };
      }
      const separatorIndex = key.indexOf("-");
      const encodedData = separatorIndex !== -1 ? key.slice(separatorIndex + 1) : "";
      if (!encodedData) {
        return {
          expired: false,
          message: "Invalid license key format. Expected format: APEX-{encoded-data}.",
          valid: false
        };
      }
      const licenseData = this.decodeLicenseData(encodedData);
      if (!licenseData) {
        return {
          expired: false,
          message: "Invalid license key. Unable to decode license data.",
          valid: false
        };
      }
      const now = /* @__PURE__ */ new Date();
      const expiryDate = new Date(licenseData.expiryDate);
      if (expiryDate < now) {
        return {
          data: licenseData,
          expired: true,
          message: `License expired on ${licenseData.expiryDate}. Please renew your license.`,
          valid: false
        };
      }
      if (licenseData.domains && licenseData.domains.length > 0) {
        const hostname = currentHostname();
        const allowed = licenseData.domains.some(
          (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
        );
        if (!allowed) {
          return {
            data: licenseData,
            expired: false,
            message: `License is not valid for this domain (${hostname}). Allowed domains: ${licenseData.domains.join(", ")}.`,
            valid: false
          };
        }
      }
      return { data: licenseData, expired: false, valid: true };
    } catch (e) {
      return {
        expired: false,
        message: "Invalid license key format or corrupted data.",
        valid: false
      };
    }
  }
  /**
   * Set the global (singleton) license key. console.errors when invalid, to
   * match the rest of the family.
   * @param {string} key
   */
  static setLicense(key) {
    this.licenseKey = key;
    this.validationResult = this.validateKey(key);
    if (!this.validationResult.valid) {
      console.error(`[Apex] ${this.validationResult.message}`);
    }
  }
  /**
   * The key set via setLicense (or null). Lets the enforcer resolve the
   * chart.license -> setLicense -> Apex.license precedence.
   * @returns {null | string}
   */
  static getKey() {
    return this.licenseKey;
  }
  /**
   * Validation result for the singleton key (cached).
   * @returns {LicenseValidationResult}
   */
  static getLicenseStatus() {
    if (!this.licenseKey) {
      return { expired: false, valid: false };
    }
    if (!this.validationResult) {
      this.validationResult = this.validateKey(this.licenseKey);
    }
    return this.validationResult;
  }
  /** @returns {boolean} whether the singleton key is valid */
  static isLicenseValid() {
    if (!this.licenseKey) return false;
    if (!this.validationResult) {
      this.validationResult = this.validateKey(this.licenseKey);
    }
    return this.validationResult.valid;
  }
  /**
   * Whether a specific key is valid (pure; no singleton mutation).
   * @param {string | undefined | null} key
   * @returns {boolean}
   */
  static isKeyValid(key) {
    if (!key) return false;
    return this.validateKey(key).valid;
  }
}
/** @type {null | string} */
__publicField(LicenseManager, "licenseKey", null);
/** @type {LicenseValidationResult | null} */
__publicField(LicenseManager, "validationResult", null);
const WATERMARK_ATTR = "data-apexcharts-watermark";
const WATERMARK_TEXT = "APEXCHARTS";
const CRITICAL_STYLES = {
  position: "absolute",
  top: "0",
  right: "0",
  bottom: "0",
  left: "0",
  pointerEvents: "none",
  userSelect: "none",
  webkitUserSelect: "none",
  msUserSelect: "none",
  zIndex: "10000",
  display: "block",
  visibility: "visible",
  opacity: "1"
};
function createWatermarkPattern() {
  const svg = `
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
      >${WATERMARK_TEXT}</text>
    </svg>
  `;
  return `url("data:image/svg+xml,${encodeURIComponent(svg.trim())}")`;
}
class Watermark {
  /**
   * Apply the overlay's critical styles + background to a node. Split out so a
   * MutationObserver can restore styles after tampering.
   * @param {HTMLElement} el
   */
  static applyStyles(el) {
    Object.assign(el.style, CRITICAL_STYLES, {
      backgroundImage: createWatermarkPattern(),
      backgroundRepeat: "repeat"
    });
  }
  /**
   * Add the watermark to a container, reusing the existing node if present (so
   * a style-tamper observer bound to it stays valid across re-renders). No-op
   * when there is no document (SSR) or no container.
   * @param {HTMLElement | null | undefined} container
   * @returns {HTMLElement | null} the watermark node
   */
  static add(container) {
    if (!container || typeof document === "undefined") return null;
    let watermark = this.node(container);
    if (!watermark) {
      watermark = document.createElement("div");
      watermark.setAttribute(WATERMARK_ATTR, "");
      container.appendChild(watermark);
    }
    this.applyStyles(watermark);
    if (typeof getComputedStyle === "function" && getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }
    return watermark;
  }
  /**
   * @param {HTMLElement | null | undefined} container
   * @returns {HTMLElement | null} the watermark node, if present
   */
  static node(container) {
    if (!container) return null;
    return (
      /** @type {HTMLElement | null} */
      container.querySelector(`[${WATERMARK_ATTR}]`)
    );
  }
  /**
   * @param {HTMLElement | null | undefined} container
   * @returns {boolean}
   */
  static exists(container) {
    return !!this.node(container);
  }
  /**
   * Remove the watermark from a container.
   * @param {HTMLElement | null | undefined} container
   */
  static remove(container) {
    const existing = this.node(container);
    if (existing) existing.remove();
  }
}
__publicField(Watermark, "ATTR", WATERMARK_ATTR);
const PRICING_URL = "https://apexcharts.com/pricing";
let _perspectivesTokenDecoded = false;
function markPerspectivesTokenDecoded() {
  _perspectivesTokenDecoded = true;
  reevaluateLicenseAcrossCharts();
}
function premiumFeaturesInUse(w, ctx) {
  const chart = w && w.config && w.config.chart || {};
  const used = [];
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
  if (ctx.perspectives && (ctx.perspectives._used || _perspectivesTokenDecoded)) {
    used.push("perspectives");
  }
  if (ctx.history && chart.history && chart.history.enabled === true) {
    used.push("history");
  }
  return used;
}
function resolveKey(w) {
  const perChart = w && w.config && w.config.chart && w.config.chart.license;
  if (perChart) return perChart;
  const singleton = LicenseManager.getKey();
  if (singleton) return singleton;
  const apex = Environment.getApex();
  if (apex && apex.license) return apex.license;
  return null;
}
function reinstateWatermark(ctx, elWrap) {
  const node = Watermark.add(elWrap);
  if (!node || typeof MutationObserver === "undefined") return;
  if (ctx._wmNodeObserver && ctx._wmObservedNode === node) return;
  if (ctx._wmNodeObserver) ctx._wmNodeObserver.disconnect();
  const nodeObs = new MutationObserver(() => {
    const n = Watermark.node(elWrap);
    if (!n) return;
    nodeObs.disconnect();
    Watermark.applyStyles(n);
    nodeObs.takeRecords();
    nodeObs.observe(n, { attributes: true, attributeFilter: ["style"] });
  });
  nodeObs.observe(node, { attributes: true, attributeFilter: ["style"] });
  ctx._wmNodeObserver = nodeObs;
  ctx._wmObservedNode = node;
}
function addWatermark(ctx, elWrap) {
  reinstateWatermark(ctx, elWrap);
  if (typeof MutationObserver === "undefined" || ctx._wmWrapObserver) return;
  const wrapObs = new MutationObserver(() => {
    if (!Watermark.node(elWrap)) reinstateWatermark(ctx, elWrap);
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
  if (wrap) Watermark.remove(wrap);
}
function notifyTrial(ctx, key, features) {
  if (ctx._premiumLicenseNotified) return;
  ctx._premiumLicenseNotified = true;
  if (!key) {
    console.warn(
      `[ApexCharts] Premium feature${features.length > 1 ? "s" : ""} in use (${features.join(", ")}) without a license. Running in trial mode with a watermark. Get a license: ${PRICING_URL}`
    );
    return;
  }
  if (key !== LicenseManager.getKey()) {
    console.error(`[Apex] ${LicenseManager.validateKey(key).message}`);
  }
}
function enforceLicense(w, ctx) {
  try {
    if (!Environment.isBrowser()) return;
    const elWrap = w && w.dom && w.dom.elWrap;
    if (!elWrap) return;
    const features = premiumFeaturesInUse(w, ctx);
    if (features.length === 0) {
      teardownWatermark(ctx, elWrap);
      return;
    }
    const key = resolveKey(w);
    if (LicenseManager.isKeyValid(key)) {
      teardownWatermark(ctx, elWrap);
      return;
    }
    addWatermark(ctx, elWrap);
    notifyTrial(ctx, key, features);
  } catch (e) {
  }
}
function reevaluateLicenseAcrossCharts() {
  if (!Environment.isBrowser()) return;
  const apex = Environment.getApex();
  const instances = apex && apex._chartInstances;
  if (!Array.isArray(instances)) return;
  instances.forEach((entry) => {
    const chart = entry && entry.chart;
    if (chart && chart.w && !chart.w.globals.isDestroyed) {
      enforceLicense(chart.w, chart);
    }
  });
}
const PERSPECTIVE_VERSION = 1;
const HASH_KEY = "apex";
function toBase64(str) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str, "utf-8").toString("base64");
  }
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}
function fromBase64(b64) {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64, "base64").toString("utf-8");
  }
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
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
  } catch (e) {
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
    const t = token || this.capture();
    return base64urlEncode(JSON.stringify(t));
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
    return this._saved.map((s) => ({ id: s.id, name: s.name, token: s.token }));
  }
  /**
   * Delete a saved perspective by id.
   * @param {string} id
   */
  delete(id) {
    const i = this._saved.findIndex((s) => s.id === id);
    if (i > -1) this._saved.splice(i, 1);
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
    } catch (e) {
      console.warn("apexcharts: failed to decode perspective token.", e);
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
      const target = href || (Environment.isBrowser() ? window.location.href : "");
      if (!target) return null;
      const url = new URL(target);
      const hash = url.hash.replace(/^#/, "");
      if (!hash) return null;
      const pair = hash.split("&").map((p) => p.split("=")).find((p) => p[0] === HASH_KEY);
      if (!pair || pair[1] == null) return null;
      return Perspectives.decode(decodeURIComponent(pair[1]));
    } catch (e) {
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
      beatsOpt.forEach((b, i) => {
        var _a, _b;
        if (!b) return;
        const el = b.el && typeof b.el === "object" ? b.el : b.selector ? doc.querySelector(b.selector) : null;
        if (!el) {
          console.warn(
            `apexcharts: storyboard beat ${i} has no resolvable element; skipped.`
          );
          return;
        }
        beats.push({
          el,
          key: (_b = (_a = b.key) != null ? _a : el.getAttribute("data-apex-beat")) != null ? _b : String(i),
          view: b.view,
          options: b.options,
          announce: b.announce,
          onEnter: typeof b.onEnter === "function" ? b.onEnter : void 0
        });
      });
      return beats;
    }
    const scope = root || doc;
    scope.querySelectorAll("[data-apex-beat]").forEach((el, i) => {
      beats.push({
        el,
        key: el.getAttribute("data-apex-beat") || String(i),
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
    const info = { index: idx, key: beat.key, el: beat.el, direction };
    if (beat.onEnter) beat.onEnter(this.ctx, info);
    if (beat.announce) this._announce(beat.announce);
    if (typeof this.w.config.chart.events.beatChange === "function") {
      this.w.config.chart.events.beatChange(this.ctx, info);
    }
    (_b = this.ctx.events) == null ? void 0 : _b.fireEvent("beatChange", [this.ctx, info]);
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
ApexCharts__default.registerFeatures({ storyboard: Storyboard });
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
  _onPointerDown(e) {
    const el = (
      /** @type {any} */
      this.ctx.el
    );
    this._engaged = !!(el && e.target && el.contains(e.target));
  }
  /**
   * @param {KeyboardEvent} e
   */
  _onKeyDown(e) {
    if (!(e.metaKey || e.ctrlKey)) return;
    const key = (e.key || "").toLowerCase();
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
    const redo = key === "y" || e.shiftKey;
    e.preventDefault();
    if (redo) this.redo();
    else this.undo();
  }
  // ─── Capture (coalesced) ────────────────────────────────────────────────
  /**
   * @param {string} label
   */
  _schedule(label) {
    if (this.applying || this._batching || !this.enabled) return;
    this._pendingLabel = label;
    if (this.coalesceMs > 0 && Environment.isBrowser()) {
      clearTimeout(this._coalesceTimer);
      this._coalesceTimer = setTimeout(
        () => this._commit(this._pendingLabel),
        this.coalesceMs
      );
    } else {
      this._commit(label);
    }
  }
  /**
   * @param {string} [label]
   * @param {boolean} [force] bypass the applying/batching guard (baseline / transaction)
   */
  _commit(label, force) {
    clearTimeout(this._coalesceTimer);
    this._coalesceTimer = null;
    if (!force && (this.applying || this._batching)) return;
    const cp = this._capture(label);
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
  _capture(label) {
    const view = captureViewState(this.w, this.ctx);
    const { config, seriesSig } = this._cloneConfigCOW();
    return {
      id: `hist-${++this._counter}`,
      view,
      config,
      seriesSig,
      label: label || "change",
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
      this.applying = false;
      throw e;
    }
    Promise.resolve(p).then(() => {
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
  snapshot(label) {
    if (!this.enabled || this.applying) return;
    this._commit(label || "change");
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
const REGISTRY_KEY$1 = "__apexcharts_plugins__";
function getRegistry() {
  const g = (
    /** @type {any} */
    globalThis
  );
  if (!g[REGISTRY_KEY$1]) g[REGISTRY_KEY$1] = {};
  return g[REGISTRY_KEY$1];
}
function getPlugin(name) {
  return getRegistry()[name] || null;
}
const WEAVE_API_VERSION = 1;
const PLUGIN_CHART_METHODS = [
  "updateOptions",
  "updateSeries",
  "appendData",
  "appendSeries",
  "toggleSeries",
  "showSeries",
  "hideSeries",
  "highlightSeries",
  "isSeriesHidden",
  "zoomX",
  "addXaxisAnnotation",
  "addYaxisAnnotation",
  "addPointAnnotation",
  "clearAnnotations",
  "removeAnnotation",
  "dataURI",
  "exportToCSV"
];
function buildBoundPublicMethods(ctx) {
  const out = {};
  PLUGIN_CHART_METHODS.forEach((m) => {
    if (typeof ctx[m] === "function") out[m] = ctx[m].bind(ctx);
  });
  return Object.freeze(out);
}
function makeLayerHandle(g, graphics) {
  const add = (el) => {
    if (el) g.add(el);
    return el;
  };
  const handle = {
    get node() {
      return g.node;
    },
    /** @param {any} opts */
    path(opts = {}) {
      const {
        d = "",
        stroke = "#000",
        width = 1,
        fill = "none",
        opacity = 1,
        dash = 0,
        className = ""
      } = opts;
      return add(
        graphics.drawPath({
          d,
          stroke,
          strokeWidth: width,
          fill,
          fillOpacity: fill === "none" ? 0 : opacity,
          strokeOpacity: opacity,
          strokeDashArray: dash,
          classes: className
        })
      );
    },
    /** @param {any} opts */
    line(opts = {}) {
      const { x1, y1, x2, y2, stroke = "#000", width = 1, dash = 0 } = opts;
      return add(graphics.drawLine(x1, y1, x2, y2, stroke, dash, width));
    },
    /** @param {any} opts */
    rect(opts = {}) {
      const {
        x = 0,
        y = 0,
        w = 0,
        h = 0,
        r = 0,
        fill = "#000",
        stroke = null,
        opacity = 1
      } = opts;
      return add(
        graphics.drawRect(
          x,
          y,
          w,
          h,
          r,
          fill,
          opacity,
          stroke != null ? 1 : null,
          stroke
        )
      );
    },
    /** @param {any} opts */
    circle(opts = {}) {
      const { cx = 0, cy = 0, r = 0, fill = "#000", stroke = null } = opts;
      return add(
        graphics.drawCircle(r, { cx, cy, fill, stroke: stroke || "none" })
      );
    },
    /** @param {any} opts */
    text(opts = {}) {
      const {
        x = 0,
        y = 0,
        text = "",
        color,
        size,
        anchor = "start",
        weight
      } = opts;
      return add(
        graphics.drawText({
          x,
          y,
          text,
          textAnchor: anchor,
          fontSize: size,
          foreColor: color,
          fontWeight: weight
        })
      );
    },
    clear() {
      const node = g.node;
      while (node.firstChild) node.removeChild(node.firstChild);
      return handle;
    }
  };
  return handle;
}
function buildPluginAPI(host, record) {
  const ctx = host.ctx;
  const w = host.w;
  const api = {
    name: record.def.name,
    version: WEAVE_API_VERSION,
    // Live: reconcile refreshes record.options when the chart's plugins config
    // changes, so updateOptions({ plugins: [{ name, options }] }) reconfigures
    // an active plugin in place. The returned object is frozen.
    get options() {
      return record.options;
    },
    // ── lifecycle subscription ──
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    on(hook, fn) {
      const m = record.handlers;
      if (!m.has(hook)) m.set(hook, []);
      m.get(hook).push(fn);
      return api;
    },
    /**
     * @param {string} hook
     * @param {Function} fn
     */
    off(hook, fn) {
      const a = record.handlers.get(hook);
      if (a) {
        const i = a.indexOf(fn);
        if (i > -1) a.splice(i, 1);
      }
      return api;
    },
    // ── per-plugin, per-chart scratch state (survives updates, dropped on
    //    destroy). The api object is frozen, but this object is mutable. ──
    store: {},
    // ── drawing (renderer-agnostic) ──
    // Call this INSIDE each draw handler: the host wipes plugin layers at the
    // start of every draw pass, so a handle cached across draws points at a
    // detached node and its writes vanish silently.
    /** @param {any} [opts] */
    layer(opts) {
      return host._layer(record.def.name, opts || {});
    },
    // ── reads ──
    get scales() {
      return host._currentScales;
    },
    // Served from the per-dispatch snapshot when one exists (invalidated at
    // every dispatch), so reading api.data in a loop does not rebuild the
    // point arrays on each property access.
    get data() {
      return host._lastData || (host._lastData = host._dataSnapshot());
    },
    theme: Object.freeze({
      get mode() {
        return w.config.theme.mode;
      },
      get foreColor() {
        return w.config.chart.foreColor;
      },
      /** @param {number} i */
      seriesColor(i) {
        return w.globals.colors[i];
      },
      /** @param {string} name */
      token(name) {
        return host._token(name);
      }
    }),
    // ── curated actions (bound public methods only; NEVER raw w) ──
    chart: buildBoundPublicMethods(ctx),
    // ── custom events out to the host app ──
    /**
     * Fires as `plugin:<pluginName>:<name>` on the chart's event bus. The
     * namespace is not optional: the bus also carries the internal lifecycle
     * events ('updated', 'mounted', ...), and an un-namespaced emit could
     * trigger every internal subscriber (history capture, re-render hooks).
     * Listen with chart.addEventListener('plugin:myplugin:myevent', fn).
     * @param {string} name
     * @param {any} [detail]
     */
    emit(name, detail) {
      ctx.events.fireEvent(`plugin:${record.def.name}:${name}`, [ctx, detail]);
    },
    // ── host element (read; lazy: baseEl is not set until render) ──
    get el() {
      return w.dom.baseEl;
    }
  };
  return Object.freeze(api);
}
class WeaveHost {
  /**
   * @param {import('../../types/internal').ChartStateW} w
   * @param {import('../../types/internal').ChartContext} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    this.active = [];
    this._layers = /* @__PURE__ */ new Map();
    this._currentScales = null;
    this._lastPluginsRef = null;
    this._lastData = null;
    this._updatedWired = false;
    this._onUpdated = this._onUpdated.bind(this);
    this._init();
  }
  _init() {
    const list = this.w.config.plugins || [];
    list.map((entry, i) => ({
      entry,
      order: entry.order != null ? entry.order : i
    })).sort((a, b) => a.order - b.order).forEach((o) => this._activate(o.entry));
    this._lastPluginsRef = this.w.config.plugins;
    this._wireUpdated();
  }
  _wireUpdated() {
    if (this._updatedWired) return;
    this.ctx.addEventListener("updated", this._onUpdated);
    this._updatedWired = true;
  }
  _onUpdated() {
    this.dispatch("afterUpdate", { pass: "update" });
  }
  /**
   * @param {any} entry { name, options?, order? }
   */
  _activate(entry) {
    const def = getPlugin(entry.name);
    if (!def) {
      console.error(`[apexcharts] plugin "${entry.name}" is not registered.`);
      return;
    }
    const v = def.apiVersion != null ? def.apiVersion : 1;
    if (Math.trunc(v) !== WEAVE_API_VERSION) {
      console.error(
        `[apexcharts] plugin "${def.name}" targets Weave API v${v}, host is v${WEAVE_API_VERSION}; skipped.`
      );
      return;
    }
    const record = {
      def,
      options: Object.freeze(__spreadValues({}, entry.options || {})),
      handlers: /* @__PURE__ */ new Map(),
      disabled: false,
      failures: 0,
      api: null
    };
    record.api = buildPluginAPI(this, record);
    this.active.push(record);
    this._guard(record, "setup", () => def.setup(record.api));
  }
  /**
   * @param {string} hook
   * @param {{ pass?: string, xyRatios?: any }} [extra]
   */
  dispatch(hook, extra) {
    if (hook === "draw") {
      this._reconcile();
      this._resetLayers();
    }
    this._lastData = null;
    if (!this.active.length) return;
    if (hook === "afterParse") {
      this._currentScales = null;
    } else if (extra && "xyRatios" in extra) {
      this._setScales(extra.xyRatios);
    }
    const pass = extra && extra.pass || "full";
    let data = null;
    for (const record of this.active) {
      if (record.disabled) continue;
      const fns = record.handlers.get(hook);
      if (!fns || !fns.length) continue;
      if (data === null) {
        data = this._dataSnapshot();
        this._lastData = data;
      }
      const payload = {
        api: record.api,
        scales: this._currentScales,
        data,
        pass,
        hook
      };
      for (const fn of fns.slice()) {
        this._guard(record, hook, () => fn(payload));
      }
    }
  }
  /**
   * @param {any} record
   * @param {string} where
   * @param {Function} fn
   */
  _guard(record, where, fn) {
    if (record.disabled) return;
    try {
      fn();
    } catch (e) {
      console.error(
        `[apexcharts] plugin "${record.def.name}" threw in "${where}":`,
        e
      );
      record.failures = (record.failures || 0) + 1;
      if (record.failures >= 3) {
        record.disabled = true;
        console.error(
          `[apexcharts] plugin "${record.def.name}" disabled after repeated errors.`
        );
      }
    }
  }
  // ─── Scales facade ──────────────────────────────────────────────────────
  /**
   * Build api.scales from the SAME xyRatios the series were drawn with, so
   * plugin pixels align with series pixels by construction.
   * @param {any} xyRatios
   */
  _setScales(xyRatios) {
    const w = this.w;
    const gl = w.globals;
    const L = w.layout;
    if (!xyRatios || !gl.axisCharts) {
      this._currentScales = null;
      return;
    }
    const xRatio = xyRatios.xRatio;
    const yRatio = xyRatios.yRatio || [];
    const yr = (axis) => yRatio[axis] != null ? yRatio[axis] : yRatio[0];
    const maxY = (axis) => gl.maxYArr[axis] != null ? gl.maxYArr[axis] : gl.maxY;
    const minY = (axis) => gl.minYArr[axis] != null ? gl.minYArr[axis] : gl.minY;
    this._currentScales = {
      /** @param {number} v */
      x: (v) => L.translateX + (v - gl.minX) / xRatio,
      /**
       * @param {number} v
       * @param {number} [axis]
       */
      y: (v, axis = 0) => L.translateY + (maxY(axis) - v) / yr(axis),
      domainX: [gl.minX, gl.maxX],
      /** @param {number} [axis] */
      domainY: (axis = 0) => [minY(axis), maxY(axis)],
      gridWidth: L.gridWidth,
      gridHeight: L.gridHeight,
      ratios: xyRatios
    };
  }
  // ─── Read-only data snapshot ────────────────────────────────────────────
  /**
   * @returns {any[]} defensive per-series snapshot (never the live slice)
   */
  _dataSnapshot() {
    const w = this.w;
    const gl = w.globals;
    const series = w.seriesData.series || [];
    const seriesX = w.seriesData.seriesX || [];
    return series.map((sData, i) => {
      const xs = seriesX[i] || [];
      const points = (sData || []).map((y, j) => ({
        x: xs[j] != null ? xs[j] : j,
        y
      }));
      return {
        name: gl.seriesNames ? gl.seriesNames[i] : void 0,
        hidden: (gl.collapsedSeriesIndices || []).includes(i),
        color: gl.colors ? gl.colors[i] : void 0,
        points
      };
    });
  }
  // ─── Theme tokens ───────────────────────────────────────────────────────
  /**
   * @param {string} name
   * @returns {any}
   */
  _token(name) {
    const w = this.w;
    const gl = w.globals;
    switch (name) {
      case "foreColor":
        return w.config.chart.foreColor;
      case "background":
        return w.config.chart.background;
      case "accent":
      case "primary":
        return gl.colors ? gl.colors[0] : void 0;
      default:
        if (/^series-\d+$/.test(name)) {
          return gl.colors ? gl.colors[Number(name.split("-")[1])] : void 0;
        }
        return void 0;
    }
  }
  // ─── Layers ─────────────────────────────────────────────────────────────
  /**
   * @param {string} name
   * @param {{ z?: 'front'|'behind', className?: string }} opts
   */
  _layer(name, { z = "front", className = "" } = {}) {
    let g = this._layers.get(name);
    if (!g) {
      g = this.ctx.graphics.group({
        class: `apexcharts-plugin-${name} ${className}`.trim()
      });
      const parent = this.w.dom.elGraphical.node;
      if (z === "behind") parent.insertBefore(g.node, parent.firstChild);
      else parent.appendChild(g.node);
      g.node.setAttribute("aria-hidden", "true");
      this._layers.set(name, g);
    }
    return makeLayerHandle(g, this.ctx.graphics);
  }
  /**
   * Remove all plugin layers. Run at the start of every `draw` because
   * fastUpdate only removes series/data-label groups (not arbitrary plugin
   * groups), so without this, fast-path redraws would duplicate plugin output.
   */
  _resetLayers() {
    const el = this.w.dom.elGraphical;
    const parent = el && el.node;
    if (parent) {
      const groups = parent.querySelectorAll('g[class*="apexcharts-plugin-"]');
      Array.prototype.forEach.call(groups, (n) => n.remove());
    }
    this._layers.clear();
  }
  // ─── Config-change reconciliation ───────────────────────────────────────
  /**
   * Diff w.config.plugins by name: teardown removed, activate added; unchanged
   * plugins keep their instance + store, but their `options` are refreshed from
   * the new entry (api.options is a live getter), so
   * updateOptions({ plugins: [{ name, options }] }) reconfigures in place.
   * Skipped when the plugins array reference is unchanged (fast redraws), so it
   * costs nothing on hover.
   */
  _reconcile() {
    const plugins = this.w.config.plugins || [];
    if (plugins === this._lastPluginsRef) return;
    this._lastPluginsRef = plugins;
    const desired = new Map(
      plugins.map((e, i) => [
        e.name,
        { entry: e, order: e.order != null ? e.order : i }
      ])
    );
    for (let i = this.active.length - 1; i >= 0; i--) {
      const r = this.active[i];
      const want = desired.get(r.def.name);
      if (!want) {
        this._guard(r, "destroy", () => r.def.destroy && r.def.destroy(r.api));
        this.active.splice(i, 1);
      } else {
        r.options = Object.freeze(__spreadValues({}, want.entry.options || {}));
      }
    }
    const activeNames = new Set(this.active.map((r) => r.def.name));
    const toAdd = [];
    desired.forEach((v, name) => {
      if (!activeNames.has(name)) toAdd.push(v);
    });
    toAdd.sort((a, b) => a.order - b.order).forEach((v) => this._activate(v.entry));
  }
  /**
   * @param {boolean} [isUpdating]
   */
  teardown(isUpdating) {
    if (!isUpdating) {
      this.dispatch("destroy");
      for (const record of this.active) {
        this._guard(record, "destroy", () => record.def.destroy && record.def.destroy(record.api));
      }
      this.active = [];
      if (this._updatedWired) {
        this.ctx.removeEventListener && this.ctx.removeEventListener("updated", this._onUpdated);
        this._updatedWired = false;
      }
    }
    this._layers.clear();
  }
}
ApexCharts__default.registerFeatures({ weave: WeaveHost });
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
  constructor(g, i) {
    this.__isCanvasMark = true;
    this._g = g;
    this._i = i;
  }
  get node() {
    return SHARED_MARKER_NODE;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a, v) {
    if (typeof a === "string") {
      if (a === "fill" && v !== void 0) this._g._setMarkerFill(this._i, v);
      return v === void 0 ? null : this;
    }
    if (a && a.fill !== void 0) this._g._setMarkerFill(this._i, a.fill);
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
      setAttribute(k, v) {
        self._applyAttr(k, v);
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
  }
  /**
   * @param {string} k
   * @param {any} v
   */
  _applyAttr(k, v) {
    const cmd = this._cmd;
    if (!cmd) return;
    const sk = STYLE_KEYS[k];
    if (sk !== void 0) cmd[sk] = v;
  }
  /**
   * @param {any} a
   * @param {any} [v]
   * @returns {any}
   */
  attr(a, v) {
    if (typeof a === "string") {
      if (v === void 0) return null;
      this._applyAttr(a, v);
      return this;
    }
    for (const k in a) {
      if (a[k] !== void 0) this._applyAttr(k, a[k]);
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
  bbox() {
    return { x: 0, y: 0, width: 0, height: 0 };
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
    for (let i = 0; i < series.length; i++) {
      const d = series[i] && series[i].data;
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
  _internStyle(fill, stroke, sw, dash, fo, so) {
    const key = `${fill}|${stroke}|${sw}|${dash}|${fo}|${so}`;
    const cached = this._styleMap.get(key);
    if (cached !== void 0) return cached;
    const id = this._styles.length;
    this._styles.push({
      fill,
      stroke,
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
  _setMarkerFill(i, fill) {
    const base = this._mstyle[i];
    if (fill === this._lofFill && base === this._lofBase) {
      this._mstyle[i] = this._lofId;
      return;
    }
    const s = this._styles[base];
    if (!s || s.fill === fill) {
      this._lofFill = fill;
      this._lofBase = base;
      this._lofId = base;
      return;
    }
    const id = this._internStyle(
      fill,
      s.stroke,
      s.strokeWidth,
      s.strokeDash,
      s.fillOpacity,
      s.strokeOpacity
    );
    this._mstyle[i] = id;
    this._lofFill = fill;
    this._lofBase = base;
    this._lofId = id;
  }
  /** @param {number} i @returns {any} the style object for a marker index */
  markerStyle(i) {
    return this._styles[this._mstyle[i]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a marker, -1 if none */
  markerSeries(i) {
    return this._msi[i];
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
  drawRectCell(x, y, w, h, opts = {}) {
    const styleId = this._rectStyleId(opts);
    if (this._crn >= this._crcap) this._growRects();
    const i = this._crn++;
    this._crx[i] = x || 0;
    this._cry[i] = y || 0;
    this._crw[i] = w > 0 ? w : 0;
    this._crh[i] = h > 0 ? h : 0;
    this._crstyle[i] = styleId;
    this._crsi[i] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    this._crdi[i] = opts.dataPointIndex == null ? -1 : opts.dataPointIndex;
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
    const stroke = opts.stroke;
    const sw = opts.strokeWidth;
    const fo = opts.fillOpacity;
    const so = opts.strokeOpacity;
    if (fill === this._rlf && stroke === this._rls && sw === this._rlsw && fo === this._rlfo && so === this._rlso) {
      return this._rlid;
    }
    const id = this._internStyle(fill, stroke, sw, 0, fo, so);
    this._rlf = fill;
    this._rls = stroke;
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
  rectStyle(i) {
    return this._styles[this._crstyle[i]];
  }
  /** @param {number} i @returns {number} series (realIndex) of a cell, -1 if none */
  rectSeries(i) {
    return this._crsi[i];
  }
  /**
   * @param {string} tag
   * @param {number} z
   * @returns {any}
   */
  _cmd(tag, z) {
    const cmd = {
      tag,
      z: z || 0,
      fill: void 0,
      stroke: void 0,
      strokeWidth: void 0,
      strokeDash: void 0,
      lineCap: void 0,
      fillOpacity: void 0,
      strokeOpacity: void 0,
      fillRule: void 0
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
  drawMarker(x, y, opts = {}) {
    var _a;
    const styleId = this._markerStyleId(opts);
    if (this._mn >= this._mcap) this._growMarkers();
    const i = this._mn++;
    this._mx[i] = x || 0;
    this._my[i] = typeof y === "number" ? y : NaN;
    this._msize[i] = opts.pSize || 0;
    this._mshape[i] = (_a = SHAPE_ID[opts.shape || "circle"]) != null ? _a : 0;
    this._mstyle[i] = styleId;
    this._msi[i] = opts.seriesIndex == null ? -1 : opts.seriesIndex;
    return new CanvasMarkerRef(this, i);
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
    const stroke = strokeTinted ? opts.pointFillColor : opts.pointStrokeColor;
    const sw = opts.pointStrokeWidth;
    const dash = opts.pointStrokeDashArray;
    const fo = opts.pointFillOpacity;
    const so = strokeTinted ? opts.pointFillOpacity : opts.pointStrokeOpacity;
    if (fill === this._lf && stroke === this._ls && sw === this._lsw && dash === this._ld && fo === this._lfo && so === this._lso) {
      return this._lid;
    }
    const id = this._internStyle(fill, stroke, sw, dash, fo, so);
    this._lf = fill;
    this._ls = stroke;
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
  markerPath(x, y, shapeId, size) {
    return this._g.getMarkerPath(x, y, SHAPE_NAME[shapeId] || "circle", size);
  }
}
const SVGElement = ApexCharts.__apex_SVGElement;
const TWO_PI = Math.PI * 2;
const DPR_CAP = 2;
class CanvasCompositor {
  /** @param {any} w */
  constructor(w) {
    this.w = w;
    this._host = null;
    this._canvas = null;
    this._c2d = null;
    this._margin = 0;
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
  _plotDims() {
    var _a;
    const gw = Math.max(0, Math.ceil(this.w.layout.gridWidth || 0));
    const gh = Math.max(0, Math.ceil(this.w.layout.gridHeight || 0));
    const largest = ((_a = this.w.globals.markers) == null ? void 0 : _a.largestSize) || 0;
    const margin = Math.ceil(largest + 8);
    return { gw, gh, margin };
  }
  /**
   * Create (or recreate) the foreignObject + canvas sized to the plot rect and
   * return the SVGElement host that `plotChartType` inserts into the tree.
   * @returns {any}
   */
  createHost() {
    const win = BrowserAPIs.getWindow();
    this._dpr = Math.min(DPR_CAP, win && win.devicePixelRatio || 1);
    const { gw, gh, margin } = this._plotDims();
    this._margin = margin;
    const w = gw + margin * 2;
    const h = gh + margin * 2;
    const fo = BrowserAPIs.createElementNS(SVGNS, "foreignObject");
    fo.setAttribute("x", String(-margin));
    fo.setAttribute("y", String(-margin));
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
    const m = this._margin;
    ctx.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr);
    if (list.length) {
      const ordered = list.length > 1 ? list.map((c, i) => [c, i]).sort(
        (a, b) => a[0].z === b[0].z ? a[1] - b[1] : a[0].z - b[0].z
      ).map((pair) => pair[0]) : list;
      for (let i = 0; i < ordered.length; i++) {
        const c = ordered[i];
        this._alpha = this._dim ? this._seriesAlpha(c.si) : 1;
        this._paintOne(ctx, c);
      }
    }
    this._paintRects(ctx, shim);
    this._paintMarkers(ctx, shim);
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
    const n = shim.rectCount ? shim.rectCount() : 0;
    if (!n) return;
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
    let i = 0;
    while (i < n) {
      const styleId = rstyle[i];
      const style = shim.rectStyle(i);
      if (!style) {
        i++;
        continue;
      }
      const fill = style.fill;
      const doFill = fill && fill !== "none" && !(typeof fill === "string" && fill.indexOf("url(") === 0);
      const stroke = style.stroke;
      const sw = style.strokeWidth == null ? 0 : Number(style.strokeWidth);
      const doStroke = stroke && stroke !== "none" && sw > 0 && !(typeof stroke === "string" && stroke.indexOf("url(") === 0);
      if (doFill) ctx.fillStyle = fill;
      if (doStroke) {
        ctx.strokeStyle = stroke;
        ctx.lineWidth = sw;
        ctx.setLineDash([]);
      }
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      let j = i;
      while (j < n && rstyle[j] === styleId) {
        const w = rw[j];
        const h = rh[j];
        if (w > 0 && h > 0) {
          const f = dimming ? this._seriesAlpha(shim.rectSeries(j)) : 1;
          if (useRound) {
            ctx.beginPath();
            cx.roundRect(rx[j], ry[j], w, h, radius);
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
              ctx.fillRect(rx[j], ry[j], w, h);
            }
            if (doStroke) {
              ctx.globalAlpha = baseStrokeA * f;
              ctx.strokeRect(rx[j], ry[j], w, h);
            }
          }
        }
        j++;
      }
      i = j;
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
      } catch (e) {
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
    const n = shim.markerCount();
    if (!n) return;
    const mx = shim._mx;
    const my = shim._my;
    const msize = shim._msize;
    const mshape = shim._mshape;
    const mstyle = shim._mstyle;
    const dimming = !!this._dim;
    if (!dimming) this._alpha = 1;
    let i = 0;
    while (i < n) {
      const styleId = mstyle[i];
      const shapeId = mshape[i];
      const style = shim.markerStyle(i);
      if (!style) {
        i++;
        continue;
      }
      const doFill = this._applyFill(ctx, style);
      const doStroke = this._applyStroke(ctx, style);
      this._markerBatches++;
      const baseFillA = style.fillOpacity == null ? 1 : Number(style.fillOpacity);
      const baseStrokeA = style.strokeOpacity == null ? 1 : Number(style.strokeOpacity);
      if (shapeId === 0) {
        let j = i;
        while (j < n && mshape[j] === 0 && mstyle[j] === styleId) {
          const r = msize[j] || 0;
          const y = my[j];
          if (r > 0 && y === y) {
            ctx.beginPath();
            ctx.arc(mx[j], y, r, 0, TWO_PI);
            if (dimming) {
              const f = this._seriesAlpha(shim.markerSeries(j));
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
          j++;
        }
        ctx.globalAlpha = 1;
        i = j;
      } else {
        const dpr = this._dpr;
        const m = this._margin;
        let j = i;
        while (j < n && mshape[j] === shapeId && mstyle[j] === styleId) {
          const y = my[j];
          const size = msize[j];
          if (y === y && size > 0) {
            const p = this._unitPath(shim, shapeId, size);
            if (p) {
              ctx.setTransform(dpr, 0, 0, dpr, (m + mx[j]) * dpr, (m + y) * dpr);
              const f = dimming ? this._seriesAlpha(shim.markerSeries(j)) : 1;
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
          j++;
        }
        ctx.setTransform(dpr, 0, 0, dpr, m * dpr, m * dpr);
        ctx.globalAlpha = 1;
        i = j;
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
    const n = xs.length;
    if (!n) return;
    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let k = 1; k < n; k++) {
      ctx.lineTo(xs[k], ys[k]);
    }
    if (cmd.ncloseY != null) {
      ctx.lineTo(xs[n - 1], cmd.ncloseY);
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
          } catch (e) {
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
    const stroke = style.stroke;
    const sw = style.strokeWidth == null ? 1 : Number(style.strokeWidth);
    if (!stroke || stroke === "none" || !(sw > 0)) return false;
    if (typeof stroke === "string" && stroke.indexOf("url(") === 0) return false;
    ctx.globalAlpha = (style.strokeOpacity == null ? 1 : Number(style.strokeOpacity)) * this._alpha;
    ctx.strokeStyle = stroke;
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
  drawRectCell(x, y, w, h, opts) {
    return this._g.drawRectCell(x, y, w, h, opts);
  }
  /**
   * @param {number} r
   * @param {any} attrs
   */
  drawCircle(r, attrs) {
    return this._g.drawCircle(r, attrs);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {any} opts
   */
  drawMarker(x, y, opts) {
    return this._g.drawMarker(x, y, opts);
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
  // Line/area/bar/scatter tooltips resolve via coordinate lookup (pointsArray),
  // so those need no per-mark query. Heatmap cells, however, are hovered by
  // point (the SVG path hit-tests the <rect> under the cursor); with cells on
  // canvas there is no node, so hitTest resolves the columnar rect store.
  /**
   * Find the cell under a plot-local point (0,0 = plot origin, the same space
   * as the recorded cell geometry). Reverse scan so a later-painted cell wins
   * when cells overlap (continuous-x edges). A linear scan stays well under a
   * frame even at 100k cells (~100k integer compares). Returns the cell's
   * series/dataPoint index plus its geometry for tooltip positioning, or null
   * when the point is off every cell.
   * @param {number} px
   * @param {number} py
   * @returns {({seriesIndex:number,dataPointIndex:number,x:number,y:number,width:number,height:number})|null}
   */
  hitTest(px, py) {
    const g = this._g;
    const n = g.rectCount ? g.rectCount() : 0;
    if (!n) return null;
    const rx = g._crx;
    const ry = g._cry;
    const rw = g._crw;
    const rh = g._crh;
    for (let k = n - 1; k >= 0; k--) {
      const w = rw[k];
      const h = rh[k];
      if (w <= 0 || h <= 0) continue;
      if (px >= rx[k] && px < rx[k] + w && py >= ry[k] && py < ry[k] + h) {
        return {
          seriesIndex: g._crsi[k],
          dataPointIndex: g._crdi[k],
          x: rx[k],
          y: ry[k],
          width: w,
          height: h
        };
      }
    }
    return null;
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
    const margin = this._compositor._margin;
    return {
      dataURL: url,
      x: (gl.translateX || 0) + (cfg.offsetX || 0) - margin,
      y: (gl.translateY || 0) + (cfg.offsetY || 0) - margin,
      w: (this.w.layout.gridWidth || 0) + margin * 2,
      h: (this.w.layout.gridHeight || 0) + margin * 2
    };
  }
  destroy() {
    this._compositor.destroy();
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
function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer;
  return r && r.kind && r.kind !== "svg" ? r : graphics;
}
function makeCustomSeriesClass(name, def) {
  const cls = class CustomSeries {
    /**
     * @param {any} w @param {any} ctx @param {any} xyRatios
     */
    constructor(w, ctx, xyRatios) {
      this.w = w;
      this.ctx = ctx;
      this.xyRatios = xyRatios;
      this._warned = false;
    }
    /**
     * @param {any[]} series parsed y-arrays (one per drawn series)
     * @param {string} [_ctype]
     * @param {number[]} [seriesIndices] realIndex per entry (combo dispatch)
     * @returns {any} the wrap group
     */
    draw(series, _ctype, seriesIndices) {
      var _a, _b;
      const w = this.w;
      const graphics = new Graphics(w, this.ctx);
      const emit = seriesEmitter(this.ctx, graphics);
      const ret = graphics.group({ class: "apexcharts-marks-series" });
      series.forEach((_s, idx) => {
        var _a2;
        const realIndex = Array.isArray(seriesIndices) ? seriesIndices[idx] : idx;
        const elSeries = graphics.group({
          class: "apexcharts-series",
          rel: realIndex + 1,
          seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
          "data:realIndex": realIndex
        });
        const scales = this._scales(
          realIndex,
          (w.seriesData.series[realIndex] || []).length
        );
        const color = w.globals.colors[realIndex];
        const rawData = (
          /** @type {any} */
          ((_a2 = w.config.series[realIndex]) == null ? void 0 : _a2.data) || []
        );
        const xvals = w.seriesData.seriesX[realIndex] || [];
        const yvals = w.seriesData.series[realIndex] || [];
        w.globals.seriesXvalues[realIndex] = [];
        w.globals.seriesYvalues[realIndex] = [];
        if (typeof w.globals.pointsArray[realIndex] === "undefined") {
          w.globals.pointsArray[realIndex] = [];
        }
        for (let j = 0; j < yvals.length; j++) {
          const yVal = yvals[j];
          if (yVal === null || typeof yVal === "undefined") continue;
          const xVal = xvals[j];
          const xPx = scales.xAt(j, xVal);
          const yPx = scales.y(yVal);
          const api = this._api(emit, elSeries, realIndex, j);
          try {
            def.renderItem({
              datum: rawData[j],
              x: xPx,
              y: yPx,
              scales,
              api,
              seriesIndex: realIndex,
              dataPointIndex: j,
              color
            });
          } catch (e) {
            if (!this._warned) {
              console.warn(
                `[apexcharts] renderItem for series type "${name}" threw; skipping datum:`,
                e
              );
              this._warned = true;
            }
          }
          w.globals.seriesXvalues[realIndex][j] = xPx;
          w.globals.seriesYvalues[realIndex][j] = yPx;
          w.globals.pointsArray[realIndex][j] = [xPx, yPx];
        }
        graphics.setupEventDelegation(elSeries, ".apexcharts-marks-mark");
        ret.add(elSeries);
      });
      (_b = (_a = this.ctx.animations) == null ? void 0 : _a.animationCompleted) == null ? void 0 : _b.call(_a, ret);
      return ret;
    }
    /**
     * Series-space (elGraphical-local, translate-free) scales, matching how the
     * built-ins compute pixels, so custom marks align with axes and gridlines
     * and paint correctly on the elGraphical-local canvas.
     * @param {number} realIndex
     * @param {number} [nPts] number of data points (for categorical band sizing)
     */
    _scales(realIndex, nPts) {
      var _a, _b, _c, _d;
      const gl = this.w.globals;
      const cnf = this.w.config;
      const xRatio = this.xyRatios.xRatio;
      const yRatioArr = this.xyRatios.yRatio;
      const axis = (_b = (_a = gl.seriesYAxisReverseMap) == null ? void 0 : _a[realIndex]) != null ? _b : 0;
      const yr = Array.isArray(yRatioArr) ? (_c = yRatioArr[axis]) != null ? _c : yRatioArr[0] : yRatioArr;
      const maxYArr = (
        /** @type {any} */
        gl.maxYArr
      );
      const maxY = Array.isArray(maxYArr) && maxYArr.length ? (_d = maxYArr[axis]) != null ? _d : gl.maxY : gl.maxY;
      const gridWidth = gl.gridWidth;
      const gridHeight = gl.gridHeight;
      const catMode = !gl.isXNumeric;
      const n = nPts || gl.dataPoints || 1;
      const bandW = n > 0 ? gridWidth / n : gridWidth;
      const tickOn = cnf.xaxis.tickPlacement === "on";
      const x = (v) => (v - gl.minX) / xRatio;
      const y = (v) => (maxY - v) / yr;
      const xAt = (index, v) => {
        if (!catMode) return x(v);
        if (tickOn && n > 1) return index / (n - 1) * gridWidth;
        return (index + 0.5) * bandW;
      };
      const step = gl.minXDiff || 1;
      const band = catMode ? bandW : xRatio ? step / xRatio : gridWidth;
      return {
        x,
        xAt,
        y,
        gridWidth,
        gridHeight,
        band
      };
    }
    /**
     * Per-datum primitive API. Each call emits immediately (canvas-aware via
     * `emit`), tags the node with the datum's identity, and adds it to the
     * series group; on canvas the tag/add are inert (marks live on the canvas,
     * events are coordinate-based).
     * @param {any} emit @param {any} elSeries @param {number} realIndex @param {number} j
     */
    _api(emit, elSeries, realIndex, j) {
      const tag = (el) => {
        if (el) {
          try {
            el.node.setAttribute("index", String(realIndex));
            el.node.setAttribute("j", String(j));
            el.node.classList.add("apexcharts-marks-mark");
          } catch (e) {
          }
          elSeries.add(el);
        }
        return el;
      };
      return {
        /** @param {any} o */
        path: (o = {}) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i;
          return tag(
            emit.drawPath({
              d: o.d || "",
              stroke: (_a = o.stroke) != null ? _a : "#000",
              strokeWidth: (_c = (_b = o.width) != null ? _b : o.strokeWidth) != null ? _c : 1,
              fill: (_d = o.fill) != null ? _d : "none",
              fillOpacity: (_f = o.fillOpacity) != null ? _f : o.fill && o.fill !== "none" ? (_e = o.opacity) != null ? _e : 1 : 0,
              strokeOpacity: (_h = (_g = o.strokeOpacity) != null ? _g : o.opacity) != null ? _h : 1,
              strokeDashArray: (_i = o.dash) != null ? _i : 0,
              strokeLinecap: o.lineCap
            })
          );
        },
        /** @param {any} o */
        line: (o = {}) => {
          var _a, _b, _c, _d;
          return tag(
            emit.drawLine(
              o.x1,
              o.y1,
              o.x2,
              o.y2,
              (_a = o.stroke) != null ? _a : "#000",
              (_b = o.dash) != null ? _b : 0,
              (_d = (_c = o.width) != null ? _c : o.strokeWidth) != null ? _d : 1
            )
          );
        },
        /** @param {any} o */
        rect: (o = {}) => {
          var _a, _b, _c, _d, _e, _f, _g, _h;
          return tag(
            emit.drawRect(
              (_a = o.x) != null ? _a : 0,
              (_b = o.y) != null ? _b : 0,
              (_c = o.w) != null ? _c : 0,
              (_d = o.h) != null ? _d : 0,
              (_e = o.r) != null ? _e : 0,
              (_f = o.fill) != null ? _f : "#000",
              (_g = o.opacity) != null ? _g : 1,
              o.stroke != null ? (_h = o.strokeWidth) != null ? _h : 1 : null,
              o.stroke
            )
          );
        },
        /** @param {any} o */
        circle: (o = {}) => {
          var _a, _b, _c, _d, _e;
          return tag(
            emit.drawCircle((_a = o.r) != null ? _a : 0, {
              cx: (_b = o.cx) != null ? _b : 0,
              cy: (_c = o.cy) != null ? _c : 0,
              fill: (_d = o.fill) != null ? _d : "#000",
              stroke: o.stroke || "none",
              "stroke-width": (_e = o.strokeWidth) != null ? _e : o.stroke ? 1 : 0
            })
          );
        },
        /** @param {any} o */
        text: (o = {}) => {
          var _a, _b, _c, _d;
          return tag(
            emit.drawText({
              x: (_a = o.x) != null ? _a : 0,
              y: (_b = o.y) != null ? _b : 0,
              text: (_c = o.text) != null ? _c : "",
              textAnchor: (_d = o.anchor) != null ? _d : "start",
              fontSize: o.size,
              foreColor: o.color,
              fontWeight: o.weight
            })
          );
        }
      };
    }
  };
  cls.dataType = def.dataType || "xy";
  cls.yExtent = typeof def.yExtent === "function" ? def.yExtent : null;
  return cls;
}
ApexCharts__default._customSeriesFactory = makeCustomSeriesClass;
const DARK_QUERY = "(prefers-color-scheme: dark)";
const CONTRAST_QUERY = "(prefers-contrast: more)";
class OSThemeWatcher {
  /**
   * @param {any} w @param {any} ctx
   */
  constructor(w, ctx) {
    this.w = w;
    this.ctx = ctx;
    if (w.config.theme.follow !== "os" || !Environment.isBrowser()) return;
    const media = this._ensureMedia();
    if (!media) return;
    this._applyToConfig(media);
    this._ensureListeners(media);
  }
  /**
   * Create (once per instance) the MediaQueryLists and stash them on `ctx` so
   * they persist across the re-render that `updateOptions` triggers.
   * @returns {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}|null}
   */
  _ensureMedia() {
    if (!this.ctx._osThemeMedia) {
      const dark = BrowserAPIs.matchMedia(DARK_QUERY);
      const contrast = BrowserAPIs.matchMedia(CONTRAST_QUERY);
      if (!dark && !contrast) return null;
      this.ctx._osThemeMedia = { dark, contrast, handler: null };
    }
    return this.ctx._osThemeMedia;
  }
  /**
   * Write the OS-resolved mode / high-contrast onto the live `w.config.theme`.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null}} media
   */
  _applyToConfig(media) {
    const theme = this.w.config.theme;
    if (media.dark) {
      theme.mode = media.dark.matches ? "dark" : "light";
    }
    if (media.contrast && media.contrast.matches) {
      theme.accessibility = theme.accessibility || {};
      theme.accessibility.colorBlindMode = "highContrast";
    }
  }
  /**
   * Attach the `change` listener once. The handler closes over `ctx` + `media`
   * (both stable across re-renders), NOT over `this` (a fresh watcher is built
   * each create), so it never goes stale.
   * @param {{dark: MediaQueryList|null, contrast: MediaQueryList|null, handler: null|(()=>void)}} media
   */
  _ensureListeners(media) {
    if (media.handler) return;
    const ctx = this.ctx;
    const handler = () => {
      const m = ctx._osThemeMedia;
      if (!m) return;
      const themeOpt = { mode: m.dark && m.dark.matches ? "dark" : "light" };
      if (m.contrast && m.contrast.matches) {
        themeOpt.accessibility = { colorBlindMode: "highContrast" };
      } else {
        themeOpt.accessibility = { colorBlindMode: "" };
      }
      ctx.updateOptions({ theme: themeOpt }, false, true, false);
    };
    OSThemeWatcher._add(media.dark, handler);
    OSThemeWatcher._add(media.contrast, handler);
    media.handler = handler;
  }
  /** Remove the listeners and drop the stashed media. Called on full destroy. */
  teardown() {
    const media = this.ctx._osThemeMedia;
    if (!media) return;
    if (media.handler) {
      OSThemeWatcher._remove(media.dark, media.handler);
      OSThemeWatcher._remove(media.contrast, media.handler);
    }
    this.ctx._osThemeMedia = null;
  }
  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _add(mql, handler) {
    if (!mql) return;
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof /** @type {any} */
    mql.addListener === "function") {
      mql.addListener(handler);
    }
  }
  /**
   * @param {MediaQueryList|null} mql @param {()=>void} handler
   */
  static _remove(mql, handler) {
    if (!mql) return;
    if (typeof mql.removeEventListener === "function") {
      mql.removeEventListener("change", handler);
    } else if (typeof /** @type {any} */
    mql.removeListener === "function") {
      mql.removeListener(handler);
    }
  }
}
ApexCharts__default.registerFeatures({ osThemeWatcher: OSThemeWatcher });
const REGISTRY_KEY = "__apexcharts_crossfilters__";
function cleanFloat(x) {
  if (!Number.isFinite(x)) return x;
  const n = Number(x.toPrecision(12));
  return Object.is(n, -0) ? 0 : n;
}
function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}
function makeReducer(reduce) {
  if (typeof reduce === "function") return reduce;
  if (reduce && typeof reduce === "object") {
    if (typeof reduce.sum === "string") {
      const f = reduce.sum;
      return (rows) => rows.reduce((a, r) => a + (Number(r[f]) || 0), 0);
    }
    if (typeof reduce.avg === "string") {
      const f = reduce.avg;
      return (rows) => rows.length ? rows.reduce((a, r) => a + (Number(r[f]) || 0), 0) / rows.length : 0;
    }
    if (typeof reduce.min === "string") {
      const f = reduce.min;
      return (rows) => rows.length ? Math.min(...rows.map((r) => Number(r[f]) || 0)) : 0;
    }
    if (typeof reduce.max === "string") {
      const f = reduce.max;
      return (rows) => rows.length ? Math.max(...rows.map((r) => Number(r[f]) || 0)) : 0;
    }
  }
  return (rows) => rows.length;
}
function applyOrder(keys, order) {
  if (typeof order === "function") return keys.slice().sort(order);
  if (order === "asc") return keys.slice().sort((a, b) => a > b ? 1 : a < b ? -1 : 0);
  if (order === "desc") return keys.slice().sort((a, b) => a < b ? 1 : a > b ? -1 : 0);
  return keys;
}
function categoryDomain(records, accessor, order) {
  const seen = /* @__PURE__ */ new Set();
  const keys = [];
  for (let i = 0; i < records.length; i++) {
    const k = accessor(records[i]);
    if (k == null) continue;
    if (!seen.has(k)) {
      seen.add(k);
      keys.push(k);
    }
  }
  return applyOrder(keys, order);
}
function matrixDomain(records, accessor, order) {
  const xSeen = /* @__PURE__ */ new Set();
  const ySeen = /* @__PURE__ */ new Set();
  const xLabels = [];
  const yLabels = [];
  for (let i = 0; i < records.length; i++) {
    const pair = accessor(records[i]);
    if (!pair) continue;
    const x = pair[0];
    const y = pair[1];
    if (x != null && !xSeen.has(x)) {
      xSeen.add(x);
      xLabels.push(x);
    }
    if (y != null && !ySeen.has(y)) {
      ySeen.add(y);
      yLabels.push(y);
    }
  }
  return { xLabels: applyOrder(xLabels, order), yLabels: applyOrder(yLabels, order) };
}
function rangeEdges(records, accessor, bins) {
  if (bins && Array.isArray(bins.thresholds) && bins.thresholds.length >= 2) {
    const t = Array.from(new Set(bins.thresholds.filter(isNum))).sort(
      (a, b) => a - b
    );
    return t.length >= 2 ? t.map(cleanFloat) : [0, 1];
  }
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < records.length; i++) {
    const v = accessor(records[i]);
    if (!isNum(v)) continue;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === Infinity) return [0, 1];
  if (min === max) {
    const pad = Math.abs(min) > 0 ? Math.abs(min) : 1;
    return [cleanFloat(min), cleanFloat(min + pad)];
  }
  if (bins && isNum(bins.width) && bins.width > 0) {
    const w2 = bins.width;
    const start = Math.floor(min / w2) * w2;
    let end = Math.ceil(max / w2) * w2;
    if (end <= start) end = start + w2;
    const count2 = Math.max(1, Math.round((end - start) / w2));
    const edges2 = new Array(count2 + 1);
    for (let i = 0; i <= count2; i++) edges2[i] = cleanFloat(start + i * w2);
    return edges2;
  }
  const count = bins && isNum(bins.count) && bins.count >= 1 ? Math.floor(bins.count) : 30;
  const w = (max - min) / count;
  const edges = new Array(count + 1);
  for (let i = 0; i <= count; i++) edges[i] = cleanFloat(min + i * w);
  edges[count] = cleanFloat(max);
  return edges;
}
function binIndexOf(v, edges) {
  if (!isNum(v)) return -1;
  const last = edges.length - 1;
  if (v < edges[0] || v > edges[last]) return -1;
  if (v === edges[last]) return last - 1;
  for (let i = 0; i < last; i++) {
    if (v >= edges[i] && v < edges[i + 1]) return i;
  }
  return -1;
}
function binCenters(edges) {
  const centers = [];
  for (let i = 0; i < edges.length - 1; i++) {
    centers.push(cleanFloat((edges[i] + edges[i + 1]) / 2));
  }
  return centers;
}
class Crossfilter {
  /**
   * @param {string} id
   * @param {any[]} [records]
   */
  constructor(id, records) {
    this.id = id;
    this.records = Array.isArray(records) ? records : [];
    this.dims = /* @__PURE__ */ new Map();
    this._listeners = /* @__PURE__ */ new Map();
  }
  // ----- registry ---------------------------------------------------------
  /** @returns {Map<string, Crossfilter>} */
  static _store() {
    const g = (
      /** @type {any} */
      globalThis
    );
    if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = /* @__PURE__ */ new Map();
    return g[REGISTRY_KEY];
  }
  /**
   * Get-or-create a coordinator by id. Passing `records` on an existing
   * coordinator swaps its dataset (re-aggregates).
   * @param {{id:string, records?:any[]}} opts
   * @returns {Crossfilter}
   */
  static getOrCreate(opts) {
    if (!opts || typeof opts.id !== "string") {
      throw new Error("ApexCharts.crossfilter requires an { id } string.");
    }
    const store = Crossfilter._store();
    let cf = store.get(opts.id);
    if (cf) {
      if (opts.records) cf.setRecords(opts.records);
      return cf;
    }
    cf = new Crossfilter(opts.id, opts.records);
    store.set(opts.id, cf);
    return cf;
  }
  /** @param {string} id @returns {Crossfilter|null} */
  static get(id) {
    return Crossfilter._store().get(id) || null;
  }
  // ----- data + dimensions ------------------------------------------------
  /**
   * Swap the shared dataset and recompute every dimension's domain. Existing
   * filters are kept where still valid (categorical keys no longer present are
   * pruned); the change is broadcast.
   * @param {any[]} records
   */
  setRecords(records) {
    this.records = Array.isArray(records) ? records : [];
    this.dims.forEach((dim) => this._recomputeDomain(dim));
    this._emit("records", this.state());
    this._emit("change", this.state());
    return this;
  }
  /**
   * Register (or replace) a chart's dimension + reduction.
   * @param {string} chartId
   * @param {{
   *   dimension:(row:any)=>any, reduce?:any, type?:'category'|'range',
   *   bins?:{width?:number,count?:number,thresholds?:number[]},
   *   order?:'first-seen'|'asc'|'desc'|((a:any,b:any)=>number),
   *   filter?:any }} spec
   */
  registerDimension(chartId, spec) {
    if (!spec || typeof spec.dimension !== "function") {
      throw new Error(
        `crossfilter.registerDimension("${chartId}") needs a dimension function.`
      );
    }
    const type = spec.type || (spec.bins ? "range" : "category");
    const dim = {
      accessor: spec.dimension,
      reducer: makeReducer(spec.reduce),
      type,
      bins: spec.bins,
      order: spec.order,
      /** @type {Set<any>|[number,number]|null} */
      filter: null,
      /** @type {any[]} */
      labels: [],
      /** @type {number[]|null} */
      edges: null
    };
    this.dims.set(chartId, dim);
    this._recomputeDomain(dim);
    if (spec.filter != null) this._setFilterOn(dim, spec.filter);
    return this;
  }
  /** @param {string} chartId @returns {boolean} */
  hasDimension(chartId) {
    return this.dims.has(chartId);
  }
  /** @param {string} chartId */
  removeDimension(chartId) {
    this.dims.delete(chartId);
    return this;
  }
  /** @param {any} dim */
  _recomputeDomain(dim) {
    if (dim.type === "matrix") {
      const dom = matrixDomain(this.records, dim.accessor, dim.order);
      dim.xLabels = dom.xLabels;
      dim.yLabels = dom.yLabels;
      dim.edges = null;
      return;
    }
    if (dim.type === "range") {
      dim.edges = rangeEdges(this.records, dim.accessor, dim.bins);
      dim.labels = binCenters(dim.edges);
    } else {
      dim.labels = categoryDomain(this.records, dim.accessor, dim.order);
      dim.edges = null;
      if (dim.filter instanceof Set) {
        const domain = new Set(dim.labels);
        Array.from(dim.filter).forEach((k) => {
          if (!domain.has(k)) dim.filter.delete(k);
        });
      }
    }
  }
  // ----- filters ----------------------------------------------------------
  /**
   * Set (replace) a chart's filter. Categorical: an array/Set of keys (or null
   * to clear). Range: a `[min,max]` tuple (or null to clear).
   * @param {string} chartId
   * @param {any[]|Set<any>|[number,number]|null} filter
   */
  filter(chartId, filter) {
    const dim = this.dims.get(chartId);
    if (!dim) return this;
    this._setFilterOn(dim, filter);
    this._emit("change", this.state());
    return this;
  }
  /**
   * Toggle one categorical key in a chart's filter Set (multi-select, OR).
   * @param {string} chartId @param {any} key
   */
  toggleKey(chartId, key) {
    const dim = this.dims.get(chartId);
    if (!dim || dim.type !== "category") return this;
    if (!(dim.filter instanceof Set)) dim.filter = /* @__PURE__ */ new Set();
    const set = (
      /** @type {Set<any>} */
      dim.filter
    );
    if (set.has(key)) set.delete(key);
    else set.add(key);
    if (set.size === 0) dim.filter = null;
    this._emit("change", this.state());
    return this;
  }
  /** @param {any} dim @param {any} filter */
  _setFilterOn(dim, filter) {
    if (filter == null) {
      dim.filter = null;
      return;
    }
    if (dim.type === "range") {
      if (Array.isArray(filter) && filter.length === 2 && filter.every(isNum)) {
        dim.filter = [Math.min(filter[0], filter[1]), Math.max(filter[0], filter[1])];
      } else {
        dim.filter = null;
      }
      return;
    }
    const set = filter instanceof Set ? new Set(filter) : new Set(filter);
    dim.filter = set.size ? set : null;
  }
  /**
   * Clear one chart's filter.
   * @param {string} chartId
   */
  clear(chartId) {
    const dim = this.dims.get(chartId);
    if (dim) dim.filter = null;
    this._emit("change", this.state());
    return this;
  }
  /** Clear all filters across every dimension. */
  reset() {
    this.dims.forEach((dim) => {
      dim.filter = null;
    });
    this._emit("change", this.state());
    return this;
  }
  /** @param {any} dim @returns {boolean} does this dimension have an active filter */
  _hasFilter(dim) {
    if (dim.filter == null) return false;
    if (dim.filter instanceof Set) return dim.filter.size > 0;
    return true;
  }
  /** @param {any} dim @param {any} row @returns {boolean} does row pass this dim's filter */
  _passes(dim, row) {
    if (!this._hasFilter(dim)) return true;
    const v = dim.accessor(row);
    if (dim.filter instanceof Set) return dim.filter.has(v);
    if (!isNum(v)) return false;
    return v >= dim.filter[0] && v <= dim.filter[1];
  }
  // ----- aggregation ------------------------------------------------------
  /**
   * Records passing every ACTIVE filter except the one on `exceptChartId`
   * (pass null/undefined to apply all filters).
   * @param {string|null} [exceptChartId]
   * @returns {any[]}
   */
  filteredRecords(exceptChartId) {
    const active = [];
    this.dims.forEach((dim, id) => {
      if (id === exceptChartId) return;
      if (this._hasFilter(dim)) active.push(dim);
    });
    if (active.length === 0) return this.records;
    return this.records.filter((row) => active.every((dim) => this._passes(dim, row)));
  }
  /** Rows passing ALL active filters (the fully filtered set). @returns {any[]} */
  filteredRows() {
    return this.filteredRecords(null);
  }
  /**
   * The crossfilter aggregation for one chart: reduce over records passing all
   * OTHER charts' filters, bucketed by this chart's dimension. Category/range
   * dims return `{type, labels, values, keys, edges?}`; a matrix (2D) dim
   * returns `{type:'matrix', xLabels, yLabels, matrix}`.
   * @param {string} chartId
   * @returns {any}
   */
  aggregateFor(chartId) {
    const dim = this.dims.get(chartId);
    if (!dim) return { type: "category", labels: [], values: [], keys: [] };
    const rows = this.filteredRecords(chartId);
    if (dim.type === "matrix") {
      const xIndex = new Map(dim.xLabels.map((k, i) => [k, i]));
      const yIndex = new Map(dim.yLabels.map((k, i) => [k, i]));
      const buckets = dim.yLabels.map(() => dim.xLabels.map(() => []));
      for (let i = 0; i < rows.length; i++) {
        const pair = dim.accessor(rows[i]);
        if (!pair) continue;
        const xi = xIndex.get(pair[0]);
        const yi = yIndex.get(pair[1]);
        if (xi != null && yi != null) buckets[yi][xi].push(rows[i]);
      }
      return {
        type: "matrix",
        xLabels: dim.xLabels.slice(),
        yLabels: dim.yLabels.slice(),
        matrix: buckets.map((brow) => brow.map((cell) => dim.reducer(cell)))
      };
    }
    if (dim.type === "range") {
      const edges = dim.edges || [0, 1];
      const nBins = edges.length - 1;
      const buckets = Array.from({ length: nBins }, () => []);
      for (let i = 0; i < rows.length; i++) {
        const idx = binIndexOf(dim.accessor(rows[i]), edges);
        if (idx >= 0) buckets[idx].push(rows[i]);
      }
      return {
        type: "range",
        labels: binCenters(edges),
        // plot bars at bin centers, not lower edges
        values: buckets.map((b) => dim.reducer(b)),
        keys: buckets.map((_, i) => [edges[i], edges[i + 1]]),
        edges
      };
    }
    const index = /* @__PURE__ */ new Map();
    dim.labels.forEach((k) => index.set(k, []));
    for (let i = 0; i < rows.length; i++) {
      const k = dim.accessor(rows[i]);
      const bucket = index.get(k);
      if (bucket) bucket.push(rows[i]);
    }
    return {
      type: "category",
      labels: dim.labels.slice(),
      values: dim.labels.map(
        (k) => dim.reducer(index.get(k) || [])
      ),
      keys: dim.labels.slice()
    };
  }
  /**
   * Aggregate every registered chart.
   * @returns {Record<string, ReturnType<Crossfilter['aggregateFor']>>}
   */
  aggregateAll() {
    const out = {};
    this.dims.forEach((_dim, id) => {
      out[id] = this.aggregateFor(id);
    });
    return out;
  }
  // ----- state + events ---------------------------------------------------
  /**
   * A serializable snapshot: active filters, filtered/total record counts.
   * @returns {{filters:Record<string, any[]|[number,number]>, filteredCount:number, total:number}}
   */
  state() {
    const filters = {};
    this.dims.forEach((dim, id) => {
      if (!this._hasFilter(dim)) return;
      filters[id] = dim.filter instanceof Set ? Array.from(dim.filter) : dim.filter.slice();
    });
    return {
      filters,
      filteredCount: this.filteredRows().length,
      total: this.records.length
    };
  }
  /** @param {string} chartId @returns {any} the current filter (Set copy / range copy / null) */
  filterOf(chartId) {
    const dim = this.dims.get(chartId);
    if (!dim || !this._hasFilter(dim)) return null;
    return dim.filter instanceof Set ? new Set(dim.filter) : dim.filter.slice();
  }
  /**
   * Subscribe to an event ('change' | 'records'). Returns an unsubscribe fn.
   * @param {string} event @param {Function} cb
   */
  on(event, cb) {
    let set = this._listeners.get(event);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this._listeners.set(event, set);
    }
    set.add(cb);
    return () => this.off(event, cb);
  }
  /** @param {string} event @param {Function} cb */
  off(event, cb) {
    var _a;
    (_a = this._listeners.get(event)) == null ? void 0 : _a.delete(cb);
    return this;
  }
  /** @param {string} event @param {any} payload */
  _emit(event, payload) {
    var _a;
    (_a = this._listeners.get(event)) == null ? void 0 : _a.forEach((cb) => {
      try {
        cb(payload);
      } catch (e) {
        console.error(e);
      }
    });
  }
  // ----- data table (presentation helper) ---------------------------------
  // Renders the filtered rows into a user-provided element and keeps it in sync
  // on every filter change. Only the passed `el` is touched (no window/document
  // globals), so the engine stays SSR-safe and unit-testable.
  /** @param {string} s @returns {string} HTML-escaped */
  _esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  /**
   * @param {Array<string|{field:string,label?:string,format?:(v:any,row:any)=>any}>|undefined} columns
   * @returns {Array<{field:string,label:string,format?:Function}>}
   */
  _resolveColumns(columns) {
    if (Array.isArray(columns) && columns.length) {
      return columns.map(
        (c) => typeof c === "string" ? { field: c, label: c } : { field: c.field, label: c.label || c.field, format: c.format }
      );
    }
    const first = this.records[0];
    const fields = first ? Object.keys(first) : [];
    return fields.map((f) => ({ field: f, label: f }));
  }
  /**
   * @param {Array<{field:string,label:string,format?:Function}>} columns
   * @param {any[]} rows @param {number} total
   * @returns {string}
   */
  _tableHTML(columns, rows, total) {
    const head = "<thead><tr>" + columns.map((c) => `<th>${this._esc(c.label)}</th>`).join("") + "</tr></thead>";
    const body = "<tbody>" + rows.map(
      (row) => "<tr>" + columns.map((c) => {
        const raw = row[c.field];
        const val = c.format ? c.format(raw, row) : raw;
        return `<td>${this._esc(val)}</td>`;
      }).join("") + "</tr>"
    ).join("") + "</tbody>";
    const caption = `<caption>${rows.length} of ${total} rows</caption>`;
    return `<table class="apexcharts-cf-table">${caption}${head}${body}</table>`;
  }
  /**
   * Bind an HTML table of the filtered rows to `el`; it re-renders on every
   * filter change. Returns a handle with refresh()/destroy().
   * @param {HTMLElement} el
   * @param {{columns?:any[], page?:number, pageSize?:number}} [opts]
   */
  dataTable(el, opts) {
    if (!el) return { refresh() {
    }, destroy() {
    } };
    const o = opts || {};
    const columns = this._resolveColumns(o.columns);
    const pageSize = o.pageSize || 0;
    const page = o.page || 0;
    const render = () => {
      const rows = this.filteredRows();
      const shown = pageSize ? rows.slice(page * pageSize, page * pageSize + pageSize) : rows;
      el.innerHTML = this._tableHTML(columns, shown, rows.length);
    };
    render();
    const off = this.on("change", render);
    return {
      refresh: render,
      destroy: () => {
        off();
        el.innerHTML = "";
      }
    };
  }
  /** Remove this coordinator from the registry and drop all state. */
  destroy() {
    Crossfilter._store().delete(this.id);
    this.dims.clear();
    this._listeners.clear();
    this.records = [];
  }
}
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
    const marks = baseEl.querySelectorAll(MARK_SELECTOR);
    marks.forEach((node) => {
      const jAttr = node.getAttribute("j");
      if (jAttr === null) return;
      const j = parseInt(jAttr, 10);
      const iAttr = node.getAttribute("index");
      const i = iAttr === null ? 0 : parseInt(iAttr, 10);
      const row = seriesX[i] || seriesX[0];
      if (!row) return;
      const x = row[j];
      if (x == null) return;
      node.classList.toggle(DIMMED_CLASS, x < min || x > max);
    });
    this._dimmed = true;
  }
  /** Remove dimming from this chart only. */
  clear() {
    const baseEl = this.w.dom.baseEl;
    if (!baseEl) return;
    baseEl.querySelectorAll("." + DIMMED_CLASS).forEach((n) => n.classList.remove(DIMMED_CLASS));
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
    return id ? Crossfilter.get(id) : null;
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
      return [{ name, data: agg.labels.map((x, i) => [x, agg.values[i]]) }];
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
    const keys = cf.aggregateFor(chartId).keys;
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
AC._crossfilterFactory = (opts) => Crossfilter.getOrCreate(opts);
AC._crossfilterGet = (id) => Crossfilter.get(id);
const DRAG_CLASS = "apexcharts-ink-draggable";
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
    for (let i = 0; i < ticks.length; i++) {
      const d = Math.abs(ticks[i] - v);
      if (d < bd) {
        bd = d;
        best = ticks[i];
      }
    }
    return best;
  }
  /**
   * Snap an x value to the nearest x gridline (numeric axes only).
   * @param {number} x
   */
  _snapX(x) {
    if (!this._snapEnabled() || typeof x !== "number") return x;
    const s = this.w.globals.xAxisScale;
    return s && Array.isArray(s.result) && s.result.length ? this._nearest(x, s.result) : x;
  }
  /**
   * Snap a y value to the nearest y gridline.
   * @param {number} y @param {number} si
   */
  _snapY(y, si) {
    if (!this._snapEnabled() || typeof y !== "number") return y;
    const scales = this.w.globals.yAxisScale;
    const s = scales && scales[si];
    return s && Array.isArray(s.result) && s.result.length ? this._nearest(y, s.result) : y;
  }
  /** @param {string} type @returns {any[]} the config annotations of a type */
  _annoList(type) {
    const a = this.w.config.annotations;
    if (!a) return [];
    const key = type === "point" ? "points" : type;
    return Array.isArray(a[key]) ? a[key] : [];
  }
  /** @param {any} anno */
  _isDraggable(anno) {
    if (!anno) return false;
    if (anno.draggable === true) return true;
    if (anno.draggable === false) return false;
    return this._enabledGlobally();
  }
  _hasDraggable() {
    return TYPES.some((t) => this._annoList(t).some((p) => this._isDraggable(p)));
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
            (e) => this._onDown(e, type, index)
          );
          el.addEventListener(
            "touchstart",
            (e) => this._onDown(e, type, index)
          );
          el.addEventListener("dblclick", (e) => {
            e.preventDefault();
            e.stopPropagation();
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
  _onDown(e, type, index) {
    if (e.button && e.button !== 0) return;
    const w = this.w;
    const doc = w.dom.baseEl && w.dom.baseEl.ownerDocument;
    if (!doc) return;
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    const isTouch = e.type === "touchstart";
    const ev = isTouch ? e.touches[0] : e;
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
        const r = rect.getBoundingClientRect();
        if (Math.abs(ev.clientX - r.left) <= EDGE_PX) mode = "resize-x1";
        else if (Math.abs(ev.clientX - r.right) <= EDGE_PX) mode = "resize-x2";
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
  _onMove(me) {
    const d = this._drag;
    if (!d) return;
    if (me.cancelable) me.preventDefault();
    const mev = me.type === "touchmove" ? me.touches[0] : me;
    d.dxPixel = (mev.clientX - d.startX) / d.scaleX;
    d.dyPixel = (mev.clientY - d.startY) / d.scaleY;
    if (Math.abs(d.dxPixel) > CLICK_SLOP_PX || Math.abs(d.dyPixel) > CLICK_SLOP_PX) {
      d.moved = true;
    }
    if (d.mode === "move") {
      const t = `translate(${d.dxPixel} ${d.dyPixel})`;
      d.els.forEach((el) => el.setAttribute("transform", t));
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
  _checkpoint(label) {
    var _a, _b;
    (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, label);
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
    const group = baseEl.querySelector(".apexcharts-" + type + "-annotations");
    if (!group) return;
    if (type === "point" && annotations.pointsAnnotations) {
      annotations.pointsAnnotations.addPointAnnotation(anno, group, index);
    } else if (type === "xaxis" && annotations.xAxisAnnotations) {
      annotations.xAxisAnnotations.addXaxisAnnotation(anno, group, index);
    } else if (type === "yaxis" && annotations.yAxisAnnotations) {
      annotations.yAxisAnnotations.addYaxisAnnotation(anno, group, index);
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
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDragged(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index, x: anno.x, y: anno.y };
    if (anno.x2 != null) args.x2 = anno.x2;
    if (anno.y2 != null) args.y2 = anno.y2;
    const events = this.w.config.chart.events;
    if (typeof events.annotationDragged === "function") {
      events.annotationDragged(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationDragged", [this.ctx, args]);
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
  _onCreateClick(e) {
    if (!this._creating) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = this._pixelToData(e.clientX, e.clientY);
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
  createAt(x, y, opts = {}) {
    const w = this.w;
    this._wire();
    this._createSeq += 1;
    const id = "apexcharts-ink-new-" + this._createSeq + "-" + w.globals.chartID;
    const anno = Utils.extend(new Options().pointAnnotation, {
      x,
      y,
      id,
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
    const gridEl = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!gridEl) return null;
    const g = gridEl.getBoundingClientRect();
    if (!g.width || !g.height) return null;
    const fx = (clientX - g.left) / g.width;
    const fy = (clientY - g.top) / g.height;
    const minX = w.globals.minX;
    const xRange = w.globals.xRange;
    const minY = w.globals.minYArr && w.globals.minYArr[0] != null ? w.globals.minYArr[0] : w.globals.minY;
    const yRange = w.globals.yRange && w.globals.yRange[0] != null ? w.globals.yRange[0] : w.globals.maxY - w.globals.minY;
    let x = minX + fx * xRange;
    const y = minY + (1 - fy) * yRange;
    const categoryX = (w.config.xaxis.type === "category" || w.config.xaxis.convertedCatToNumeric) && !w.axisFlags.dataFormatXNumeric;
    if (categoryX) x = Math.round(x);
    return { x, y };
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireCreated(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index };
    if (typeof anno.x !== "undefined") args.x = anno.x;
    if (typeof anno.y !== "undefined") args.y = anno.y;
    const events = this.w.config.chart.events;
    if (typeof events.annotationCreated === "function") {
      events.annotationCreated(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationCreated", [this.ctx, args]);
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
    const s = bar.style;
    s.position = "absolute";
    s.top = "6px";
    s.left = "6px";
    s.zIndex = "15";
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
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
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
    const n = parseInt(full, 16);
    if (isNaN(n) || full.length !== 6) return false;
    const r = n >> 16 & 255;
    const g = n >> 8 & 255;
    const b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.72;
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
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", (e) => {
      e.stopPropagation();
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
    sw.addEventListener("mousedown", (e) => e.preventDefault());
    sw.addEventListener("click", (e) => {
      e.stopPropagation();
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
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this._closeEditor(false);
      } else if (e.key === "Enter" && e.target === input) {
        e.preventDefault();
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
  _onDocDownEditor(e) {
    const ed = this._editor;
    if (!ed || ed.card.contains(e.target)) return;
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
    const stroke = String(anno.borderColor || "").toLowerCase();
    ed.card.querySelectorAll(".apexcharts-ink-swatch--line").forEach((sw) => {
      sw.classList.toggle(
        "apexcharts-ink-swatch--active",
        (sw.dataset.color || "").toLowerCase() === stroke
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
  _applyStyle(label, mutate) {
    const ed = this._editor;
    if (!ed) return;
    const anno = this._annoList(ed.type)[ed.index];
    if (!anno) return;
    this._commitTextOf(ed);
    if (!anno.label) anno.label = {};
    if (!anno.label.style) anno.label.style = {};
    mutate(anno);
    this._redrawAnno(ed.type, anno, ed.index);
    this._checkpoint(label);
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
      let i = 0;
      for (let k = 1; k < FONT_STEPS.length; k++) {
        if (Math.abs(FONT_STEPS[k] - cur) < Math.abs(FONT_STEPS[i] - cur)) i = k;
      }
      i = Math.min(FONT_STEPS.length - 1, Math.max(0, i + dir));
      anno.label.style.fontSize = FONT_STEPS[i] + "px";
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
      const i = MARKER_SHAPES.indexOf(anno.marker.shape);
      anno.marker.shape = MARKER_SHAPES[(i + 1) % MARKER_SHAPES.length];
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
    for (let i = ed.index; i < list.length; i++) {
      this._redrawAnno(ed.type, list[i], i);
    }
    this._checkpoint("ink:delete");
    this._fireDeleted(ed.type, anno, ed.index);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireEdited(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index, text: anno.label ? anno.label.text : "" };
    const events = this.w.config.chart.events;
    if (typeof events.annotationEdited === "function") {
      events.annotationEdited(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationEdited", [this.ctx, args]);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireStyled(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index, label: anno.label, marker: anno.marker };
    const events = this.w.config.chart.events;
    if (typeof events.annotationStyled === "function") {
      events.annotationStyled(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationStyled", [this.ctx, args]);
  }
  /** @param {string} type @param {any} anno @param {number} index */
  _fireDeleted(type, anno, index) {
    var _a;
    const args = { type, id: anno.id, index };
    const events = this.w.config.chart.events;
    if (typeof events.annotationDeleted === "function") {
      events.annotationDeleted(this.ctx, args);
    }
    (_a = this.ctx.events) == null ? void 0 : _a.fireEvent("annotationDeleted", [this.ctx, args]);
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
    for (let i = 1; i < pts.length; i++) {
      const d = Math.abs(pts[i].x - dataX);
      if (d < bd) {
        bd = d;
        best = pts[i];
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
  _onKeyDown(e) {
    if (!this._enabled() || this.persistent) return;
    const key = this._cfg().key || "m";
    if (e.key && e.key.toLowerCase() === String(key).toLowerCase()) {
      this._arm();
    } else if (e.key === "Escape") {
      this._cancelDrag();
    }
  }
  /** @param {any} e */
  _onKeyUp(e) {
    if (this.persistent) return;
    const key = this._cfg().key || "m";
    if (e.key && e.key.toLowerCase() === String(key).toLowerCase()) {
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
    const a = this._project(cx, cy);
    this.drag = { a, b: a };
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
  _onSeedDown(e) {
    if (!this._seedActive || !this.drag) return;
    e.preventDefault();
    e.stopPropagation();
    const { cx, cy } = this._clientXY(e);
    this.drag.b = this._project(cx, cy);
    this._endSeed(true);
  }
  /** @param {any} e */
  _onSeedKey(e) {
    if (e.key === "Escape") this._endSeed(false);
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
    const a = this._resolve(d.a);
    const b = this._resolve(d.b);
    if (Math.abs(a.gx - b.gx) < 2 && Math.abs(a.gy - b.gy) < 2) return;
    const mode = this._mode();
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a.x, ya: a.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a, b);
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
    for (let i = 0; i < data.length; i++) {
      const p = data[i];
      let x;
      let y;
      if (Array.isArray(p)) {
        x = +p[0];
        y = +p[1];
      } else if (p && typeof p === "object") {
        x = +p.x;
        y = +p.y;
      } else {
        x = i;
        y = +p;
      }
      if (isFinite(x) && isFinite(y)) out.push({ x, y });
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
  _clientXY(e) {
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { cx: t.clientX, cy: t.clientY };
  }
  _gridRect() {
    const g = this.w.dom.baseEl.querySelector(".apexcharts-grid");
    return g ? g.getBoundingClientRect() : null;
  }
  /** [min,max] for the primary y-axis, preferring the rendered nice scale. */
  _yRange() {
    const g = this.w.globals;
    const s = g.yAxisScale && g.yAxisScale[0];
    if (s && isFinite(s.niceMin) && isFinite(s.niceMax) && s.niceMax !== s.niceMin) {
      return [s.niceMin, s.niceMax];
    }
    return [g.minY, g.maxY];
  }
  /**
   * Client pixel -> { x, y (data), gx, gy (grid-local SVG units) }.
   * @param {number} cx @param {number} cy
   */
  _project(cx, cy) {
    const w = this.w;
    const rect = this._gridRect();
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = rect ? clamp((cx - rect.left) / rect.width) : 0;
    const fy = rect ? clamp((cy - rect.top) / rect.height) : 0;
    const [ymin, ymax] = this._yRange();
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const y = ymax - fy * (ymax - ymin);
    return { x, y, gx: fx * gw, gy: fy * gh };
  }
  /**
   * Data (x,y) -> grid-local SVG coords, for redrawing pinned rulers.
   * @param {number} x @param {number} y
   */
  _dataToGrid(x, y) {
    const w = this.w;
    const gw = w.layout.gridWidth;
    const gh = w.layout.gridHeight;
    const xr = w.globals.maxX - w.globals.minX || 1;
    const [ymin, ymax] = this._yRange();
    const yr = ymax - ymin || 1;
    return {
      gx: (x - w.globals.minX) / xr * gw,
      gy: gh - (y - ymin) / yr * gh
    };
  }
  /** @param {any} e */
  _onDown(e) {
    if (!this.armed) return;
    e.preventDefault();
    e.stopPropagation();
    const { cx, cy } = this._clientXY(e);
    const a = this._project(cx, cy);
    this.drag = { a, b: a };
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
  _onMove(e) {
    if (!this.drag) return;
    if (e.cancelable) e.preventDefault();
    const { cx, cy } = this._clientXY(e);
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
    const a = this._resolve(rawA);
    const b = this._resolve(rawB);
    if (this._cfg().pinOnRelease !== false) {
      this.pins.push({ xa: a.x, ya: a.y, xb: b.x, yb: b.y, mode });
      this._renderPins();
      (_b = (_a = this.ctx.history) == null ? void 0 : _a.snapshot) == null ? void 0 : _b.call(_a, "measure");
    }
    this._fireMeasured(a, b);
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
  _stats(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return {
      dx,
      dy,
      pct: a.y !== 0 ? dy / Math.abs(a.y) * 100 : NaN,
      slope: dx !== 0 ? dy / dx : NaN
    };
  }
  /** @param {number} v */
  _fmt(v) {
    if (!isFinite(v)) return "n/a";
    const a = Math.abs(v);
    if (a !== 0 && (a < 0.01 || a >= 1e6)) return v.toExponential(2);
    return String(Math.round(v * 100) / 100);
  }
  /** getComputedStyle of the graphical layer (browser only), for CSS vars. */
  _computedStyle() {
    if (!Environment.isBrowser()) return null;
    const node = this.w.dom.elGraphical && this.w.dom.elGraphical.node;
    if (!node || typeof getComputedStyle !== "function") return null;
    try {
      return getComputedStyle(node);
    } catch (e) {
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
        const s = f(p);
        if (s != null) return String(s);
      } catch (e) {
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
  _label(a, b, st, mode) {
    const fn = this._cfg().label;
    if (typeof fn === "function") {
      const out = fn({
        from: { x: a.x, y: a.y },
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
      const arrow = st.dy === 0 ? "" : st.dy > 0 ? " ↑" : " ↓";
      const pct = isFinite(st.pct) ? "(" + this._fmtPct(st.pct) + ")" : "";
      return [this._fmtY(st.dy) + "  " + pct + arrow, this._fmtX(a.x) + "  to  " + this._fmtX(b.x)];
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
        const s = cf(v);
        if (s != null) return String(s);
      } catch (e) {
      }
    }
    const f = this.w.globals.yLabelFormatters && this.w.globals.yLabelFormatters[0];
    if (typeof f === "function") {
      try {
        const s = f(v, { seriesIndex: 0, dataPointIndex: -1, w: this.w });
        if (s != null && s !== "") return String(s);
      } catch (e) {
      }
    }
    return this._fmt(v);
  }
  /**
   * Format an x value: a short date for datetime x, else the x-label formatter
   * or a plain number.
   * @param {number} x
   */
  _fmtX(x) {
    const w = this.w;
    const cf = this._cfg().format && this._cfg().format.x;
    if (typeof cf === "function") {
      try {
        const s = cf(x);
        if (s != null) return String(s);
      } catch (e) {
      }
    }
    if (w.config.xaxis.type === "datetime") {
      const d = new Date(x);
      return d.toLocaleDateString(void 0, {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
    const f = w.globals.xLabelFormatter;
    if (typeof f === "function") {
      try {
        const s = f(x, { w });
        if (s != null && s !== "") return String(s);
      } catch (e) {
      }
    }
    return this._fmt(x);
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
      const n = this._live.node;
      if (n.parentNode) n.parentNode.removeChild(n);
    }
    this._live = null;
  }
  _renderLive() {
    if (!this.drag) return;
    const g = this._liveGroup();
    while (g.node.firstChild) g.node.removeChild(g.node.firstChild);
    const a = this._resolve(this.drag.a);
    const b = this._resolve(this.drag.b);
    this._drawRuler(g, a, b, false, this._mode());
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
      const a = __spreadProps(__spreadValues({}, this._dataToGrid(p.xa, p.ya)), { x: p.xa, y: p.ya });
      const b = __spreadProps(__spreadValues({}, this._dataToGrid(p.xb, p.yb)), { x: p.xb, y: p.yb });
      this._drawRuler(g, a, b, true, p.mode || "span");
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
  _drawRuler(g, a, b, pinned, mode) {
    const st = this._stats(a, b);
    const rg = this.graphics.group({
      class: "apexcharts-measure-ruler " + this._dirClass(st.dy) + (pinned ? " apexcharts-measure-pinned" : "")
    });
    if ((mode || this._mode()) === "free") this._drawFree(rg, a, b, st);
    else this._drawSpan(rg, a, b, st);
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
    const label = this.graphics.drawText({
      x: bx + 9,
      y: by + 15,
      text: lines,
      textAnchor: "start",
      fontSize: "11px",
      foreColor: "#1e293b",
      cssClass: "apexcharts-measure-label"
    });
    g.add(label);
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
  _drawSpan(g, a, b, st) {
    const w = this.w;
    const cfg = this._cfg();
    const gh = w.layout.gridHeight;
    const color = this._dirColor(st.dy);
    const lx = Math.min(a.gx, b.gx);
    const rx = Math.max(a.gx, b.gx);
    if (cfg.band !== false) {
      const band = this.graphics.drawRect(lx, 0, Math.max(0, rx - lx), gh, 0);
      band.node.setAttribute("class", "apexcharts-measure-band");
      band.attr({ fill: color, "fill-opacity": 0.09, stroke: "none" });
      g.add(band);
    }
    if (cfg.guides !== false) {
      [a, b].forEach((p) => {
        const vline = this.graphics.drawLine(p.gx, 0, p.gx, gh, this._colors().guide, 4, 1);
        vline.node.setAttribute("class", "apexcharts-measure-vline");
        g.add(vline);
      });
    }
    [a, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a, b, st, "span");
    const longest = lines.reduce((m, s) => Math.max(m, s.length), 0);
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
  _drawFree(g, a, b, st) {
    const color = this._dirColor(st.dy);
    const line = this.graphics.drawLine(a.gx, a.gy, b.gx, b.gy, color, 0, 2);
    line.node.setAttribute("class", "apexcharts-measure-line");
    g.add(line);
    [a, b].forEach((p) => this._dot(g, p, color));
    const lines = this._label(a, b, st, "free");
    const longest = lines.reduce((m, s) => Math.max(m, s.length), 0);
    const boxW = Math.max(72, longest * 6.2);
    const boxH = 16 + lines.length * 15;
    let bx = (a.gx + b.gx) / 2 + 8;
    let by = (a.gy + b.gy) / 2 - boxH / 2;
    bx = Math.max(2, Math.min(bx, this.w.layout.gridWidth - boxW - 2));
    by = Math.max(2, Math.min(by, this.w.layout.gridHeight - boxH - 2));
    this._readout(g, lines, bx, by, boxW, boxH, color);
  }
  /**
   * @param {{x:number,y:number}} a @param {{x:number,y:number}} b
   */
  _fireMeasured(a, b) {
    const st = this._stats(a, b);
    const payload = {
      from: { x: a.x, y: a.y },
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
  _onContext(e) {
    if (!this._enabled()) return;
    e.preventDefault();
    this.open(e.clientX, e.clientY);
  }
  /**
   * Client pixel -> data {x,y} via the grid client-rect fraction (scale
   * independent). Null when the grid is not measurable.
   * @param {number} cx @param {number} cy
   * @returns {{x:number,y:number}|null}
   */
  _clientToData(cx, cy) {
    const w = this.w;
    const grid = w.dom.baseEl && w.dom.baseEl.querySelector(".apexcharts-grid");
    if (!grid) return null;
    const r = grid.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const clamp = (v) => v < 0 ? 0 : v > 1 ? 1 : v;
    const fx = clamp((cx - r.left) / r.width);
    const fy = clamp((cy - r.top) / r.height);
    const x = w.globals.minX + fx * (w.globals.maxX - w.globals.minX);
    const s = w.globals.yAxisScale && w.globals.yAxisScale[0];
    const ymin = s && isFinite(s.niceMin) ? s.niceMin : w.globals.minY;
    const ymax = s && isFinite(s.niceMax) ? s.niceMax : w.globals.maxY;
    const y = ymax - fy * (ymax - ymin);
    return { x, y };
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
    items.forEach((it, i) => {
      const btn = doc.createElement("button");
      btn.type = "button";
      btn.className = "apexcharts-context-menu-item";
      btn.setAttribute("role", "menuitem");
      btn.tabIndex = -1;
      btn.textContent = it.label;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        this._activate(i);
      });
      btn.addEventListener("mouseenter", () => this._focus(i));
      menu.appendChild(btn);
    });
    elWrap.appendChild(menu);
    this.menu = menu;
    const wrapRect = elWrap.getBoundingClientRect();
    let left = clientX - wrapRect.left;
    let top = clientY - wrapRect.top;
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
  _focus(i) {
    if (!this.menu) return;
    const btns = this.menu.querySelectorAll(".apexcharts-context-menu-item");
    if (this._focusIndex >= 0 && btns[this._focusIndex]) {
      btns[this._focusIndex].classList.remove("apexcharts-context-menu-item--active");
    }
    this._focusIndex = i;
    if (btns[i]) {
      btns[i].classList.add("apexcharts-context-menu-item--active");
      if (typeof btns[i].focus === "function") btns[i].focus();
    }
  }
  /** @param {number} i */
  _activate(i) {
    const it = this._items[i];
    this.close();
    if (it) it.run();
  }
  /** @param {any} e */
  _onDocDown(e) {
    if (this.menu && this.menu.contains(e.target)) return;
    this.close();
  }
  /** @param {any} e */
  _onKey(e) {
    if (!this.menu || !this._items.length) return;
    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      this._focus((this._focusIndex + 1) % this._items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this._focus((this._focusIndex - 1 + this._items.length) % this._items.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
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
