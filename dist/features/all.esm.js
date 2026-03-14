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
 * ApexCharts v5.10.4
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
const apexchartsLegendCSS = ".apexcharts-flip-y {\n  transform: scaleY(-1) translateY(-100%);\n  transform-origin: top;\n  transform-box: fill-box;\n}\n.apexcharts-flip-x {\n  transform: scaleX(-1);\n  transform-origin: center;\n  transform-box: fill-box;\n}\n.apexcharts-legend {\n  display: flex;\n  overflow: auto;\n  padding: 0 10px;\n}\n.apexcharts-legend.apexcharts-legend-group-horizontal {\n  flex-direction: column;\n}\n.apexcharts-legend-group {\n  display: flex;\n}\n.apexcharts-legend-group-vertical {\n  flex-direction: column-reverse;\n}\n.apexcharts-legend.apx-legend-position-bottom, .apexcharts-legend.apx-legend-position-top {\n  flex-wrap: wrap\n}\n.apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  flex-direction: column;\n  bottom: 0;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-left, .apexcharts-legend.apx-legend-position-top.apexcharts-align-left, .apexcharts-legend.apx-legend-position-right, .apexcharts-legend.apx-legend-position-left {\n  justify-content: flex-start;\n  align-items: flex-start;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-center, .apexcharts-legend.apx-legend-position-top.apexcharts-align-center {\n  justify-content: center;\n  align-items: center;\n}\n.apexcharts-legend.apx-legend-position-bottom.apexcharts-align-right, .apexcharts-legend.apx-legend-position-top.apexcharts-align-right {\n  justify-content: flex-end;\n  align-items: flex-end;\n}\n.apexcharts-legend-series {\n  cursor: pointer;\n  line-height: normal;\n  display: flex;\n  align-items: center;\n}\n.apexcharts-legend-text {\n  position: relative;\n  font-size: 14px;\n}\n.apexcharts-legend-text *, .apexcharts-legend-marker * {\n  pointer-events: none;\n}\n.apexcharts-legend-marker {\n  position: relative;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  cursor: pointer;\n  margin-right: 1px;\n}\n\n.apexcharts-legend-series.apexcharts-no-click {\n  cursor: auto;\n}\n.apexcharts-legend .apexcharts-hidden-zero-series, .apexcharts-legend .apexcharts-hidden-null-series {\n  display: none !important;\n}\n.apexcharts-inactive-legend {\n  opacity: 0.45;\n} ";
const AxesUtils = _core.__apex_axes_AxesUtils;
const Data = _core.__apex_Data;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
const Environment = _core.__apex_Environment_Environment;
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
      var _a;
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
_core__default.registerFeatures({ exports: Exports });
const CoreUtils = _core.__apex_CoreUtils;
const Dimensions = _core.__apex_dimensions_Dimensions;
const Graphics = _core.__apex_Graphics;
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
    var _a, _b;
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
        realIndex = parseInt((_a = seriesEl.getAttribute("data:realIndex")) != null ? _a : "", 10);
      } else {
        seriesEl = w.dom.baseEl.querySelector(
          `.apexcharts-series[rel='${seriesCnt + 1}']`
        );
        if (!seriesEl) return;
        realIndex = parseInt((_b = seriesEl.getAttribute("rel")) != null ? _b : "", 10) - 1;
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
const Markers = _core.__apex_Markers;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
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
    const showLegendAlways = cnf.legend.showForSingleSeries && this.w.seriesData.series.length === 1 || this.isBarsDistributed || this.w.seriesData.series.length > 1;
    this.legendHelpers.appendToForeignObject();
    if ((showLegendAlways || !gl.axisCharts) && cnf.legend.show) {
      const elLegendWrap = (
        /** @type {HTMLElement} */
        w.dom.elLegendWrap
      );
      while (elLegendWrap.firstChild) {
        elLegendWrap.removeChild(elLegendWrap.firstChild);
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
        series.highlightRangeInSeries(e, target);
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
const icoPan = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" height="24" viewBox="0 0 24 24" width="24">\n    <defs>\n        <path d="M0 0h24v24H0z" id="a"/>\n    </defs>\n    <clipPath id="b">\n        <use overflow="visible" xlink:href="#a"/>\n    </clipPath>\n    <path clip-path="url(#b)" d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z"/>\n</svg>';
const icoZoom = '<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" height="24" viewBox="0 0 24 24" width="24">\n    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>\n    <path d="M0 0h24v24H0V0z" fill="none"/>\n    <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/>\n</svg>';
const icoReset = '<svg fill="#000000" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>\n    <path d="M0 0h24v24H0z" fill="none"/>\n</svg>';
const icoZoomIn = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">\n    <path d="M0 0h24v24H0z" fill="none"/>\n    <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>\n</svg>\n';
const icoZoomOut = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">\n    <path d="M0 0h24v24H0z" fill="none"/>\n    <path d="M7 11v2h10v-2H7zm5-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>\n</svg>\n';
const icoSelect = '<svg fill="#6E8192" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">\n    <path d="M0 0h24v24H0z" fill="none"/>\n    <path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2z"/>\n</svg>';
const icoMenu = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>';
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
    this.elZoomReset = null;
    this.elMenuIcon = null;
    this.elMenu = null;
    this.elMenuItems = [];
    this.t = null;
  }
  createToolbar() {
    const w = this.w;
    const createDiv = () => {
      return BrowserAPIs.createElementNS("http://www.w3.org/1999/xhtml", "div");
    };
    const elToolbarWrap = createDiv();
    elToolbarWrap.setAttribute("class", "apexcharts-toolbar");
    elToolbarWrap.style.top = w.config.chart.toolbar.offsetY + "px";
    elToolbarWrap.style.right = -w.config.chart.toolbar.offsetX + 3 + "px";
    w.dom.elWrap.appendChild(elToolbarWrap);
    this.elZoom = createDiv();
    this.elZoomIn = createDiv();
    this.elZoomOut = createDiv();
    this.elPan = createDiv();
    this.elSelection = createDiv();
    this.elZoomReset = createDiv();
    this.elMenuIcon = createDiv();
    this.elMenu = createDiv();
    this.elCustomIcons = [];
    this.t = w.config.chart.toolbar.tools;
    if (Array.isArray(this.t.customIcons)) {
      for (let i = 0; i < this.t.customIcons.length; i++) {
        this.elCustomIcons.push(createDiv());
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
        tabindex: "0",
        role: "button",
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
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
    (_g = this.elMenuIcon) == null ? void 0 : _g.addEventListener("click", this.toggleMenu.bind(this));
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
    (_h = this.elMenuIcon) == null ? void 0 : _h.addEventListener(
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
      ch.ctx.toolbar.toggleOtherControls();
      const el = type === "selection" ? ch.ctx.toolbar.elSelection : ch.ctx.toolbar.elZoom;
      const enabledType = type === "selection" ? "selectionEnabled" : "zoomEnabled";
      ch.w.globals[enabledType] = !ch.w.globals[enabledType];
      if (!el.classList.contains(ch.ctx.toolbar.selectedClass)) {
        el.classList.add(ch.ctx.toolbar.selectedClass);
      } else {
        el.classList.remove(ch.ctx.toolbar.selectedClass);
      }
      el.setAttribute("aria-pressed", String(ch.w.globals[enabledType]));
    });
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
      ch.ctx.toolbar.toggleOtherControls();
      ch.w.interact.panEnabled = !ch.w.interact.panEnabled;
      if (!ch.ctx.toolbar.elPan.classList.contains(ch.ctx.toolbar.selectedClass)) {
        ch.ctx.toolbar.elPan.classList.add(ch.ctx.toolbar.selectedClass);
      } else {
        ch.ctx.toolbar.elPan.classList.remove(ch.ctx.toolbar.selectedClass);
      }
      ch.ctx.toolbar.elPan.setAttribute(
        "aria-pressed",
        String(ch.w.interact.panEnabled)
      );
    });
  }
  toggleOtherControls() {
    const w = this.w;
    w.interact.panEnabled = false;
    w.interact.zoomEnabled = false;
    w.interact.selectionEnabled = false;
    this.getToolbarIconsReference();
    const toggleEls = [this.elPan, this.elSelection, this.elZoom];
    toggleEls.forEach((el) => {
      if (el) {
        el.classList.remove(this.selectedClass);
      }
    });
  }
  handleZoomIn() {
    const w = this.w;
    if (w.axisFlags.isRangeBar) {
      this.minX = w.globals.minY;
      this.maxX = w.globals.maxY;
    }
    const centerX = (this.minX + this.maxX) / 2;
    const newMinX = (this.minX + centerX) / 2;
    const newMaxX = (this.maxX + centerX) / 2;
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!w.interact.disableZoomIn) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
  }
  handleZoomOut() {
    const w = this.w;
    if (w.axisFlags.isRangeBar) {
      this.minX = w.globals.minY;
      this.maxX = w.globals.maxY;
    }
    if (w.config.xaxis.type === "datetime" && new Date(this.minX).getUTCFullYear() < 1e3) {
      return;
    }
    const centerX = (this.minX + this.maxX) / 2;
    const newMinX = this.minX - (centerX - this.minX);
    const newMaxX = this.maxX - (centerX - this.maxX);
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
      w.interact.zoomed = false;
      const series = ch.ctx.series.emptyCollapsedSeries(
        Utils.clone(w.globals.initialSeries)
      );
      ch.updateHelpers._updateSeries(
        series,
        w.config.chart.animations.dynamicAnimation.enabled
      );
    });
  }
  destroy() {
    this.elZoom = null;
    this.elZoomIn = null;
    this.elZoomOut = null;
    this.elPan = null;
    this.elSelection = null;
    this.elZoomReset = null;
    this.elMenuIcon = null;
  }
}
const Box = _core.__apex_index_Box;
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
    this.debounceTimer = null;
    this.debounceDelay = 100;
    this.wheelDelay = 400;
  }
  /** @param {{xyRatios: any}} opts */
  init({ xyRatios }) {
    const w = this.w;
    const me = this;
    this.xyRatios = xyRatios;
    this.zoomRect = this.graphics.drawRect(0, 0, 0, 0);
    this.selectionRect = this.graphics.drawRect(0, 0, 0, 0);
    this.gridRect = w.dom.baseEl.querySelector(".apexcharts-grid");
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
    this.gridRect = null;
  }
  /**
   * @param {import('../types/internal').XYRatios} xyRatios
   * @param {any} e
   */
  svgMouseEvents(xyRatios, e) {
    var _a;
    const w = this.w;
    const toolbar = this.ctx.toolbar;
    const zoomtype = w.interact.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
    const autoSelected = w.config.chart.toolbar.autoSelected;
    if (e.shiftKey) {
      this.shiftWasPressed = true;
      toolbar.enableZoomPanFromToolbar(autoSelected === "pan" ? "zoom" : "pan");
    } else {
      if (this.shiftWasPressed) {
        toolbar.enableZoomPanFromToolbar(autoSelected);
        this.shiftWasPressed = false;
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
      const gridRectDim = (_a = this.gridRect) == null ? void 0 : _a.getBoundingClientRect();
      if (!gridRectDim) return;
      this.startX = this.clientX - gridRectDim.left - w.globals.barPadForNumericAxis;
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
            xyRatios
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
    var _a;
    const w = this.w;
    const gridRectDim = (_a = this.gridRect) == null ? void 0 : _a.getBoundingClientRect();
    if (gridRectDim && (this.w.interact.mousedown || isResized)) {
      this.endX = this.clientX - gridRectDim.left - w.globals.barPadForNumericAxis;
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
  /**
   * @param {Event} e
   */
  mouseWheelEvent(e) {
    const w = this.w;
    e.preventDefault();
    const now = Date.now();
    if (now - w.interact.lastWheelExecution > this.wheelDelay) {
      this.executeMouseWheelZoom(e);
      w.interact.lastWheelExecution = now;
    }
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (now - w.interact.lastWheelExecution > this.wheelDelay) {
        this.executeMouseWheelZoom(e);
        w.interact.lastWheelExecution = now;
      }
    }, this.debounceDelay);
  }
  /**
   * @param {any} e
   */
  executeMouseWheelZoom(e) {
    var _a;
    const w = this.w;
    this.minX = w.axisFlags.isRangeBar ? w.globals.minY : w.globals.minX;
    this.maxX = w.axisFlags.isRangeBar ? w.globals.maxY : w.globals.maxX;
    const gridRectDim = (_a = this.gridRect) == null ? void 0 : _a.getBoundingClientRect();
    if (!gridRectDim) return;
    const mouseX = (e.clientX - gridRectDim.left) / gridRectDim.width;
    const currentMinX = this.minX;
    const currentMaxX = this.maxX;
    const totalX = currentMaxX - currentMinX;
    const zoomFactorIn = 0.5;
    const zoomFactorOut = 1.5;
    let zoomRange;
    let newMinX, newMaxX;
    if (e.deltaY < 0) {
      zoomRange = zoomFactorIn * totalX;
      const midPoint = currentMinX + mouseX * totalX;
      newMinX = midPoint - zoomRange / 2;
      newMaxX = midPoint + zoomRange / 2;
    } else {
      zoomRange = zoomFactorOut * totalX;
      newMinX = currentMinX - zoomRange / 2;
      newMaxX = currentMaxX + zoomRange / 2;
    }
    if (!w.axisFlags.isRangeBar) {
      newMinX = Math.max(newMinX, w.globals.initialMinX);
      newMaxX = Math.min(newMaxX, w.globals.initialMaxX);
      const minRange = (w.globals.initialMaxX - w.globals.initialMinX) * 0.01;
      if (newMaxX - newMinX < minRange) {
        const midPoint = (newMinX + newMaxX) / 2;
        newMinX = midPoint - minRange / 2;
        newMaxX = midPoint + minRange / 2;
      }
    }
    const newMinXMaxX = this._getNewMinXMaxX(newMinX, newMaxX);
    if (!isNaN(newMinXMaxX.minX) && !isNaN(newMinXMaxX.maxX)) {
      this.zoomUpdateOptions(newMinXMaxX.minX, newMinXMaxX.maxX);
    }
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
        const zoomtype = w.interact.zoomEnabled ? w.config.chart.zoom.type : w.config.chart.selection.type;
        this.handleMouseUp({ zoomtype, isResized: true });
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
          let x = (w.config.chart.selection.xaxis.min - w.globals.minX) / xyRatios.xRatio;
          let width = w.layout.gridWidth - (w.globals.maxX - w.config.chart.selection.xaxis.max) / xyRatios.xRatio - x;
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
    var _a;
    const w = this.w;
    const me = context;
    const gridRectDim = (_a = this.gridRect) == null ? void 0 : _a.getBoundingClientRect();
    if (!gridRectDim) return;
    const startX = me.startX - 1;
    const startY = me.startY;
    let inversedX = false;
    let inversedY = false;
    const left = me.clientX - gridRectDim.left - w.globals.barPadForNumericAxis;
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
    const xyRatios = this.xyRatios;
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
    if (typeof w.config.chart.events.selection === "function" && w.interact.selectionEnabled) {
      clearTimeout((_a = this.w.globals.selectionResizeTimer) != null ? _a : void 0);
      this.w.globals.selectionResizeTimer = window.setTimeout(() => {
        var _a2;
        const gridRectDim = (_a2 = this.gridRect) == null ? void 0 : _a2.getBoundingClientRect();
        if (!gridRectDim) return;
        const selectionRect = selRect.node.getBoundingClientRect();
        let minX, maxX, minY, maxY;
        if (!w.axisFlags.isRangeBar) {
          if (!w.globals.xAxisScale) return;
          minX = w.globals.xAxisScale.niceMin + (selectionRect.left - gridRectDim.left) * xyRatios.xRatio;
          maxX = w.globals.xAxisScale.niceMin + (selectionRect.right - gridRectDim.left) * xyRatios.xRatio;
          minY = w.globals.yAxisScale[0].niceMin + (gridRectDim.bottom - selectionRect.bottom) * xyRatios.yRatio[0];
          maxY = w.globals.yAxisScale[0].niceMax - (selectionRect.top - gridRectDim.top) * xyRatios.yRatio[0];
        } else {
          minX = w.globals.yAxisScale[0].niceMin + (selectionRect.left - gridRectDim.left) * xyRatios.invertedYRatio;
          maxX = w.globals.yAxisScale[0].niceMin + (selectionRect.right - gridRectDim.left) * xyRatios.invertedYRatio;
          minY = 0;
          maxY = 1;
        }
        const xyAxis = {
          xaxis: {
            min: minX,
            max: maxX
          },
          yaxis: {
            min: minY,
            max: maxY
          }
        };
        w.config.chart.events.selection(this.ctx, xyAxis);
        if (w.config.chart.brush.enabled && w.config.chart.events.brushScrolled !== void 0) {
          w.config.chart.events.brushScrolled(this.ctx, xyAxis);
        }
      }, timerInterval);
    }
  }
  /** @param {{context: any, zoomtype: any}} opts */
  selectionDrawn({ context, zoomtype }) {
    var _a, _b;
    const w = this.w;
    const me = context;
    const xyRatios = this.xyRatios;
    const toolbar = this.ctx.toolbar;
    const selRect = w.interact.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();
    const gridRectDim = me.gridRect.getBoundingClientRect();
    const localStartX = selRect.left - gridRectDim.left - w.globals.barPadForNumericAxis;
    const localEndX = selRect.right - gridRectDim.left - w.globals.barPadForNumericAxis;
    const localStartY = selRect.top - gridRectDim.top;
    const localEndY = selRect.bottom - gridRectDim.top;
    let xLowestValue, xHighestValue;
    if (!w.axisFlags.isRangeBar) {
      const niceMin = (_b = (_a = w.globals.xAxisScale) == null ? void 0 : _a.niceMin) != null ? _b : 0;
      xLowestValue = niceMin + localStartX * xyRatios.xRatio;
      xHighestValue = niceMin + localEndX * xyRatios.xRatio;
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
      if (xLowestValue < w.globals.initialMinX || xHighestValue > w.globals.initialMaxX) {
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
}
_core__default.registerFeatures({
  toolbar: Toolbar,
  zoomPanSelection: ZoomPanSelection
});
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
      x = w.labelData.categoryLabels.indexOf(String(x)) + 1;
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
const Options = _core.__apex_Options;
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
      for (let i = 0; i < 3; i++) {
        w.dom.elGraphical.add(annoArray[i]);
        if (initialAnim && !w.globals.resized && !w.globals.dataChanged) {
          if (w.config.chart.type !== "scatter" && w.config.chart.type !== "bubble" && w.globals.dataPoints > 1) {
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
_core__default.registerFeatures({ annotations: Annotations });
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
    this._focusedEl = null;
    this._hoveredBarEl = null;
    this._enlargedScatterMarker = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onFocus = this._onFocus.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onLegendClick = this._onLegendClick.bind(this);
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
    this.ctx.events.removeEventListener("legendClick", this._onLegendClick);
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
    this.active = true;
    this._clampCursor();
    this._snapToVisibleRange();
    this._showCurrentPoint();
  }
  _onBlur() {
    this.active = false;
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
    if (!this._isNavEnabled() || !this.active) return;
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
      case "Escape":
        e.preventDefault();
        this.active = false;
        this._hideFocus();
        break;
    }
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
    } else if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "rangeBar") {
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
      this._focusedEl = el;
    }
  }
  _removeFocusClass() {
    if (this._focusedEl) {
      this._focusedEl.classList.remove("apexcharts-keyboard-focused");
      this._focusedEl = null;
    }
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
    if (type === "bar" || type === "candlestick" || type === "boxPlot" || type === "rangeBar") {
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
}
_core__default.registerFeatures({ keyboardNavigation: KeyboardNavigation });
