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
 * ApexCharts v5.10.5
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
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
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
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
export {
  default2 as default
};
