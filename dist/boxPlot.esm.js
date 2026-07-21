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
const Graphics = _core.__apex_Graphics;
const DataLabels = _core.__apex_DataLabels;
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const Environment = _core.__apex_Environment_Environment;
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
function datumKey(w, realIndex, j) {
  var _a, _b, _c, _d;
  if ((_a = w.axisFlags) == null ? void 0 : _a.isXNumeric) {
    const sx = (_c = (_b = w.seriesData) == null ? void 0 : _b.seriesX) == null ? void 0 : _c[realIndex];
    if (sx && sx.length && sx[j] != null) return "x:" + sx[j];
  }
  const lbl = (_d = w.globals.labels) == null ? void 0 : _d[j];
  if (lbl != null && String(lbl) !== "") {
    return "c:" + (Array.isArray(lbl) ? lbl.join(" ") : String(lbl));
  }
  return "j:" + j;
}
function frameDatumKey(frame, realIndex, j) {
  var _a, _b;
  if (frame.isXNumeric) {
    const sx = (_a = frame.seriesX) == null ? void 0 : _a[realIndex];
    if (sx && sx.length && sx[j] != null) return "x:" + sx[j];
  }
  const lbl = (_b = frame.labels) == null ? void 0 : _b[j];
  if (lbl != null && String(lbl) !== "") {
    return "c:" + (Array.isArray(lbl) ? lbl.join(" ") : String(lbl));
  }
  return "j:" + j;
}
function joinKeys(oldKeys, newKeys) {
  const oldIndex = /* @__PURE__ */ new Map();
  oldKeys.forEach((k, i) => {
    if (!oldIndex.has(k)) oldIndex.set(k, i);
  });
  const toOld = new Array(newKeys.length);
  const usedOld = /* @__PURE__ */ new Set();
  let prev = -1;
  let ordered = true;
  let identity = oldKeys.length === newKeys.length;
  newKeys.forEach((k, i) => {
    const oi = oldIndex.has(k) && !usedOld.has(oldIndex.get(k)) ? oldIndex.get(k) : -1;
    toOld[i] = oi;
    if (oi !== -1) {
      usedOld.add(oi);
      if (oi < prev) ordered = false;
      prev = oi;
    }
    if (oi !== i) identity = false;
  });
  const exits = [];
  for (let i = 0; i < oldKeys.length; i++) {
    if (!usedOld.has(i)) exits.push(i);
  }
  return { toOld, exits, ordered, changed: !identity };
}
function uniquifyKeys(keys) {
  const seen = /* @__PURE__ */ new Map();
  return keys.map((k) => {
    const count = seen.get(k) || 0;
    seen.set(k, count + 1);
    return count === 0 ? k : `${k}#${count}`;
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
    oldY.map((_, j) => frameDatumKey(frame, realIndex, j))
  );
  const newKeys = uniquifyKeys(newY.map((_, j) => datumKey(w, realIndex, j)));
  const join = joinKeys(oldKeys, newKeys);
  if (!join.ordered && !allowReorder) return null;
  if (!join.changed && !includeIdentity) return null;
  return { join, oldKeys, newKeys };
}
function firstMove(d) {
  const m = /^M\s*([+-]?[\d.eE]+)[\s,]+([+-]?[\d.eE]+)/.exec(d || "");
  if (!m) return null;
  const x = parseFloat(m[1]);
  const y = parseFloat(m[2]);
  return isFinite(x) && isFinite(y) ? { x, y } : null;
}
function renderBarExitGhosts({
  w,
  elSeries,
  record,
  newKeys,
  isHorizontal,
  speed
}) {
  var _a;
  if (!lengthTransitionEnabled(w)) return;
  if (!record || !Array.isArray(record.paths) || !(elSeries == null ? void 0 : elSeries.node)) return;
  const newKeySet = new Set(newKeys);
  const exits = record.paths.filter(
    (p) => p && p.d && p.key != null && !newKeySet.has(p.key)
  );
  if (!exits.length) return;
  const graphics = new Graphics(w);
  const fallbackFill = (_a = w.globals.colors) == null ? void 0 : _a[parseInt(String(record.realIndex), 10)];
  exits.forEach((p) => {
    let fill = p.fill || fallbackFill || "#c8c8c8";
    if (String(fill).indexOf("url(") === 0) fill = fallbackFill || "#c8c8c8";
    const ghost = graphics.drawPath({
      d: p.d,
      stroke: "none",
      strokeWidth: 0,
      fill,
      fillOpacity: 1,
      classes: "apexcharts-bar-ghost"
    });
    const node = ghost.node;
    node.setAttribute("pointer-events", "none");
    ghost.attr(
      "clip-path",
      `url(#gridRectBarMask${w.globals.cuid})`
    );
    elSeries.node.insertBefore(node, elSeries.node.firstChild);
    const start = firstMove(p.d);
    let origin = isHorizontal ? "left center" : "center bottom";
    try {
      const bb = node.getBBox();
      if (start && bb) {
        if (isHorizontal) {
          origin = Math.abs(start.x - bb.x) <= Math.abs(start.x - (bb.x + bb.width)) ? "left center" : "right center";
        } else {
          origin = Math.abs(start.y - (bb.y + bb.height)) <= Math.abs(start.y - bb.y) ? "center bottom" : "center top";
        }
      }
    } catch (_) {
    }
    const style = node.style;
    style.transformBox = "fill-box";
    style.transformOrigin = origin;
    const duration = Math.max(1, speed || 1);
    const startAt = performance.now();
    const step = (now) => {
      if (w.globals.isDestroyed || !node.parentNode) return;
      const t = Math.max(0, Math.min(1, (now - startAt) / duration));
      const eased = 1 - Math.pow(1 - t, 3);
      const scale = 1 - eased;
      style.transform = isHorizontal ? `scaleX(${scale})` : `scaleY(${scale})`;
      style.opacity = String(1 - eased);
      if (t < 1) {
        BrowserAPIs.requestAnimationFrame(step);
      } else {
        node.parentNode.removeChild(node);
      }
    };
    BrowserAPIs.requestAnimationFrame(step);
  });
}
class BarDataLabels {
  /**
   * @param {import('../../../charts/Bar').default} barCtx
   */
  constructor(barCtx) {
    this.w = barCtx.w;
    this.barCtx = barCtx;
    this.totalFormatter = this.w.config.plotOptions.bar.dataLabels.total.formatter;
    if (!this.totalFormatter) {
      this.totalFormatter = this.w.config.dataLabels.formatter;
    }
  }
  /** handleBarDataLabels is used to calculate the positions for the data-labels
   * It also sets the element's data attr for bars and calls drawCalculatedBarDataLabels()
   * After calculating, it also calls the function to draw data labels
   * @memberof Bar
   * @param {Record<string, any>} opts - bar properties used throughout the bar drawing function
   * @return {object} dataLabels node-element which you can append later
   **/
  handleBarDataLabels(opts) {
    const {
      x,
      y,
      y1,
      y2,
      i,
      j,
      realIndex,
      columnGroupIndex,
      series,
      barHeight,
      barWidth,
      barXPosition,
      barYPosition,
      visibleSeries
    } = opts;
    const w = this.w;
    const graphics = new Graphics(this.barCtx.w);
    const strokeWidth = Array.isArray(this.barCtx.strokeWidth) ? this.barCtx.strokeWidth[realIndex] : this.barCtx.strokeWidth;
    let bcx;
    let bcy;
    if (w.axisFlags.isXNumeric && !w.globals.isBarHorizontal) {
      bcx = x + barWidth * (visibleSeries + 1);
      bcy = y + barHeight * (visibleSeries + 1) - strokeWidth;
    } else {
      bcx = x + barWidth * visibleSeries;
      bcy = y + barHeight * visibleSeries;
    }
    let dataLabels = null;
    let totalDataLabels = null;
    let dataLabelsX = x;
    let dataLabelsY = y;
    let dataLabelsPos = (
      /** @type {any} */
      {}
    );
    const dataLabelsConfig = w.config.dataLabels;
    const barDataLabelsConfig = this.barCtx.barOptions.dataLabels;
    const barTotalDataLabelsConfig = this.barCtx.barOptions.dataLabels.total;
    if (typeof barYPosition !== "undefined" && (this.barCtx.isRangeBar || this.barCtx.isPyramid)) {
      bcy = barYPosition;
      dataLabelsY = barYPosition;
    }
    if (typeof barXPosition !== "undefined" && this.barCtx.isVerticalGroupedRangeBar) {
      bcx = barXPosition;
      dataLabelsX = barXPosition;
    }
    const offX = dataLabelsConfig.offsetX;
    const offY = dataLabelsConfig.offsetY;
    let textRects = {
      width: 0,
      height: 0
    };
    if (w.config.dataLabels.enabled) {
      const yLabel = w.seriesData.series[i][j];
      textRects = graphics.getTextRects(
        w.config.dataLabels.formatter ? w.config.dataLabels.formatter(yLabel, __spreadProps(__spreadValues({}, w), {
          seriesIndex: i,
          dataPointIndex: j,
          w
        })) : w.formatters.yLabelFormatters[0](yLabel),
        parseFloat(dataLabelsConfig.style.fontSize).toString()
      );
    }
    const params = {
      x,
      y,
      i,
      j,
      realIndex,
      columnGroupIndex,
      bcx,
      bcy,
      barHeight,
      barWidth,
      textRects,
      strokeWidth,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY
    };
    if (this.barCtx.isHorizontal) {
      dataLabelsPos = this.calculateBarsDataLabelsPosition(params);
    } else {
      dataLabelsPos = this.calculateColumnsDataLabelsPosition(params);
    }
    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: this.barCtx.isRangeBar ? [y1, y2] : w.config.chart.stackType === "100%" ? series[realIndex][j] : w.seriesData.series[realIndex][j],
      i: realIndex,
      j,
      barWidth,
      barHeight,
      textRects,
      dataLabelsConfig
    });
    if (w.config.chart.stacked && barTotalDataLabelsConfig.enabled) {
      totalDataLabels = this.drawTotalDataLabels({
        x: dataLabelsPos.totalDataLabelsX,
        y: dataLabelsPos.totalDataLabelsY,
        barWidth,
        barHeight,
        realIndex,
        textAnchor: dataLabelsPos.totalDataLabelsAnchor,
        val: this.getStackedTotalDataLabel({ realIndex, j }),
        dataLabelsConfig,
        barTotalDataLabelsConfig
      });
    }
    return {
      dataLabelsPos,
      dataLabels,
      totalDataLabels
    };
  }
  /** @param {{realIndex: any, j: any}} opts */
  getStackedTotalDataLabel({ realIndex, j }) {
    const w = this.w;
    let val = this.barCtx.stackedSeriesTotals[j];
    if (this.totalFormatter) {
      val = this.totalFormatter(val, __spreadProps(__spreadValues({}, w), {
        seriesIndex: realIndex,
        dataPointIndex: j,
        w
      }));
    }
    return val;
  }
  /**
   * @param {Record<string, any>} opts
   */
  calculateColumnsDataLabelsPosition(opts) {
    const w = this.w;
    let {
      i,
      j,
      realIndex,
      y,
      bcx,
      barWidth,
      barHeight,
      textRects,
      dataLabelsX,
      dataLabelsY,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      strokeWidth,
      offX,
      offY
    } = opts;
    let totalDataLabelsY;
    let totalDataLabelsX;
    const totalDataLabelsAnchor = "middle";
    const totalDataLabelsBcx = bcx;
    barHeight = Math.abs(barHeight);
    const vertical = w.config.plotOptions.bar.dataLabels.orientation === "vertical";
    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j
    });
    bcx = bcx - strokeWidth / 2;
    const dataPointsDividedWidth = w.layout.gridWidth / w.globals.dataPoints;
    if (this.barCtx.isVerticalGroupedRangeBar) {
      dataLabelsX += barWidth / 2;
    } else {
      if (w.axisFlags.isXNumeric) {
        dataLabelsX = bcx - barWidth / 2 + offX;
      } else {
        dataLabelsX = bcx - dataPointsDividedWidth + barWidth / 2 + offX;
      }
      if (!w.config.chart.stacked && zeroEncounters > 0 && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        dataLabelsX -= barWidth * zeroEncounters;
      }
    }
    if (vertical) {
      const offsetDLX = 2;
      dataLabelsX = dataLabelsX + textRects.height / 2 - strokeWidth / 2 - offsetDLX;
    }
    const valIsNegative = w.seriesData.series[i][j] < 0;
    let newY = y;
    if (this.barCtx.isReversed) {
      newY = y + (valIsNegative ? barHeight : -barHeight);
    }
    switch (barDataLabelsConfig.position) {
      case "center":
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + offY;
          } else {
            dataLabelsY = newY + barHeight / 2 - offY;
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight / 2 + textRects.height / 2 + offY;
          } else {
            dataLabelsY = newY + barHeight / 2 + textRects.height / 2 - offY;
          }
        }
        break;
      case "bottom":
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight + offY;
          } else {
            dataLabelsY = newY + barHeight - offY;
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - barHeight + textRects.height + strokeWidth + offY;
          } else {
            dataLabelsY = newY + barHeight - textRects.height / 2 + strokeWidth - offY;
          }
        }
        break;
      case "top":
        if (vertical) {
          if (valIsNegative) {
            dataLabelsY = newY + offY;
          } else {
            dataLabelsY = newY - offY;
          }
        } else {
          if (valIsNegative) {
            dataLabelsY = newY - textRects.height / 2 - offY;
          } else {
            dataLabelsY = newY + textRects.height + offY;
          }
        }
        break;
    }
    let lowestPrevY = newY;
    w.labelData.seriesGroups.forEach((sg) => {
      var _a;
      (_a = this.barCtx[sg.join(",")]) == null ? void 0 : _a.prevY.forEach(
        (arr) => {
          if (valIsNegative) {
            lowestPrevY = Math.max(arr[j], lowestPrevY);
          } else {
            lowestPrevY = Math.min(arr[j], lowestPrevY);
          }
        }
      );
    });
    if (this.barCtx.lastActiveBarSerieIndex === realIndex && barTotalDataLabelsConfig.enabled) {
      const ADDITIONAL_OFFY = 18;
      const graphics = new Graphics(this.barCtx.w);
      const totalLabeltextRects = graphics.getTextRects(
        this.getStackedTotalDataLabel({ realIndex, j }),
        dataLabelsConfig.fontSize
      );
      if (valIsNegative) {
        totalDataLabelsY = lowestPrevY - totalLabeltextRects.height / 2 - offY - barTotalDataLabelsConfig.offsetY + ADDITIONAL_OFFY;
      } else {
        totalDataLabelsY = lowestPrevY + totalLabeltextRects.height + offY + barTotalDataLabelsConfig.offsetY - ADDITIONAL_OFFY;
      }
      const xDivision = dataPointsDividedWidth;
      totalDataLabelsX = totalDataLabelsBcx + (w.axisFlags.isXNumeric ? -barWidth * w.globals.barGroups.length / 2 : w.globals.barGroups.length * barWidth / 2 - (w.globals.barGroups.length - 1) * barWidth - xDivision) + barTotalDataLabelsConfig.offsetX;
    }
    if (!w.config.chart.stacked) {
      if (dataLabelsY < 0) {
        dataLabelsY = 0 + strokeWidth;
      } else if (dataLabelsY + textRects.height / 3 > w.layout.gridHeight) {
        dataLabelsY = w.layout.gridHeight - strokeWidth;
      }
    }
    return {
      bcx,
      bcy: y,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor
    };
  }
  /**
   * @param {Record<string, any>} opts
   */
  calculateBarsDataLabelsPosition(opts) {
    var _a;
    const w = this.w;
    let {
      x,
      i,
      j,
      realIndex,
      bcy,
      barHeight,
      barWidth,
      textRects,
      dataLabelsX,
      strokeWidth,
      dataLabelsConfig,
      barDataLabelsConfig,
      barTotalDataLabelsConfig,
      offX,
      offY
    } = opts;
    const dataPointsDividedHeight = w.layout.gridHeight / w.globals.dataPoints;
    const { zeroEncounters } = this.barCtx.barHelpers.getZeroValueEncounters({
      i,
      j
    });
    barWidth = Math.abs(barWidth);
    let dataLabelsY;
    if (this.barCtx.isPyramid) {
      const centerOffset = (_a = textRects.centerOffset) != null ? _a : 0;
      dataLabelsY = bcy + barHeight / 2 + offY - centerOffset;
    } else {
      dataLabelsY = bcy - (this.barCtx.isRangeBar ? 0 : dataPointsDividedHeight) + barHeight / 2 + textRects.height / 2 + offY - 3;
    }
    if (!w.config.chart.stacked && zeroEncounters > 0 && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
      dataLabelsY -= barHeight * zeroEncounters;
    }
    let totalDataLabelsX;
    let totalDataLabelsY;
    let totalDataLabelsAnchor = "start";
    const valIsNegative = w.seriesData.series[i][j] < 0;
    let newX = x;
    if (this.barCtx.isReversed) {
      newX = x + (valIsNegative ? -barWidth : barWidth);
      totalDataLabelsAnchor = valIsNegative ? "start" : "end";
    }
    if (this.barCtx.isPyramid) {
      dataLabelsX = w.layout.gridWidth / 2 + offX;
    } else {
      switch (barDataLabelsConfig.position) {
        case "center":
          if (valIsNegative) {
            dataLabelsX = newX + barWidth / 2 - offX;
          } else {
            dataLabelsX = Math.max(textRects.width / 2, newX - barWidth / 2) + offX;
          }
          break;
        case "bottom":
          if (valIsNegative) {
            dataLabelsX = newX + barWidth - strokeWidth - offX;
          } else {
            dataLabelsX = newX - barWidth + strokeWidth + offX;
          }
          break;
        case "top":
          if (valIsNegative) {
            dataLabelsX = newX - strokeWidth - offX;
          } else {
            dataLabelsX = newX - strokeWidth + offX;
          }
          break;
      }
    }
    let lowestPrevX = newX;
    w.labelData.seriesGroups.forEach((sg) => {
      var _a2;
      (_a2 = this.barCtx[sg.join(",")]) == null ? void 0 : _a2.prevX.forEach(
        (arr) => {
          if (valIsNegative) {
            lowestPrevX = Math.min(arr[j], lowestPrevX);
          } else {
            lowestPrevX = Math.max(arr[j], lowestPrevX);
          }
        }
      );
    });
    if (this.barCtx.lastActiveBarSerieIndex === realIndex && barTotalDataLabelsConfig.enabled) {
      const graphics = new Graphics(this.barCtx.w);
      const totalLabeltextRects = graphics.getTextRects(
        this.getStackedTotalDataLabel({ realIndex, j }),
        dataLabelsConfig.fontSize
      );
      if (valIsNegative) {
        totalDataLabelsX = lowestPrevX - strokeWidth - offX - barTotalDataLabelsConfig.offsetX;
        totalDataLabelsAnchor = "end";
      } else {
        totalDataLabelsX = lowestPrevX + offX + barTotalDataLabelsConfig.offsetX + (this.barCtx.isReversed ? -(barWidth + strokeWidth) : strokeWidth);
      }
      totalDataLabelsY = dataLabelsY - textRects.height / 2 + totalLabeltextRects.height / 2 + barTotalDataLabelsConfig.offsetY + strokeWidth;
      if (w.globals.barGroups.length > 1) {
        totalDataLabelsY = totalDataLabelsY - w.globals.barGroups.length / 2 * (barHeight / 2);
      }
    }
    if (!w.config.chart.stacked) {
      if (dataLabelsConfig.textAnchor === "start") {
        if (dataLabelsX - textRects.width < 0) {
          dataLabelsX = valIsNegative ? textRects.width + strokeWidth - offX : strokeWidth + offX;
        } else if (dataLabelsX + textRects.width > w.layout.gridWidth) {
          dataLabelsX = valIsNegative ? w.layout.gridWidth - strokeWidth : w.layout.gridWidth - textRects.width - strokeWidth;
        }
      } else if (dataLabelsConfig.textAnchor === "middle") {
        if (dataLabelsX - textRects.width / 2 < 0) {
          dataLabelsX = textRects.width / 2 + strokeWidth;
        } else if (dataLabelsX + textRects.width / 2 > w.layout.gridWidth) {
          dataLabelsX = w.layout.gridWidth - textRects.width / 2 - strokeWidth;
        }
      } else if (dataLabelsConfig.textAnchor === "end") {
        if (dataLabelsX < 1) {
          dataLabelsX = textRects.width + strokeWidth;
        } else if (dataLabelsX + 1 > w.layout.gridWidth) {
          dataLabelsX = w.layout.gridWidth - textRects.width - strokeWidth;
        }
      }
    }
    return {
      bcx: x,
      bcy,
      dataLabelsX,
      dataLabelsY,
      totalDataLabelsX,
      totalDataLabelsY,
      totalDataLabelsAnchor
    };
  }
  /** @param {{x: any, y: any, val: any, i: any, j: any, textRects: any, barHeight: any, barWidth: any, dataLabelsConfig: any}} opts */
  drawCalculatedDataLabels({
    x,
    y,
    val,
    i,
    // = realIndex
    j,
    textRects,
    barHeight,
    barWidth,
    dataLabelsConfig
  }) {
    var _a, _b;
    const w = this.w;
    let rotate = "rotate(0)";
    if (w.config.plotOptions.bar.dataLabels.orientation === "vertical")
      rotate = `rotate(-90, ${x}, ${y})`;
    const dataLabels = new DataLabels(this.barCtx.w, this.barCtx.ctx);
    const graphics = new Graphics(this.barCtx.w);
    const formatter = dataLabelsConfig.formatter;
    let elDataLabelsWrap = null;
    const isSeriesNotCollapsed = w.globals.collapsedSeriesIndices.indexOf(i) > -1;
    if (dataLabelsConfig.enabled && !isSeriesNotCollapsed) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels",
        transform: rotate
      });
      const dlCfg = w.config.dataLabels;
      if (((_a = dlCfg.animate) == null ? void 0 : _a.enabled) || ((_b = dlCfg.countUp) == null ? void 0 : _b.enabled)) {
        elDataLabelsWrap.node.setAttribute(
          "data:dlKey",
          `${i}::${datumKey(w, i, j)}`
        );
        elDataLabelsWrap.node.setAttribute("data:dlJ", String(j));
        if (typeof val === "number" && isFinite(val)) {
          elDataLabelsWrap.node.setAttribute("data:dlVal", String(val));
        }
      }
      let text = "";
      if (typeof val !== "undefined") {
        text = formatter(val, __spreadProps(__spreadValues({}, w), {
          seriesIndex: i,
          dataPointIndex: j,
          w
        }));
      }
      if (!val && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        text = "";
      }
      const valIsNegative = w.seriesData.series[i][j] < 0;
      const position = w.config.plotOptions.bar.dataLabels.position;
      if (w.config.plotOptions.bar.dataLabels.orientation === "vertical") {
        if (position === "top") {
          if (valIsNegative) dataLabelsConfig.textAnchor = "end";
          else dataLabelsConfig.textAnchor = "start";
        }
        if (position === "center") {
          dataLabelsConfig.textAnchor = "middle";
        }
        if (position === "bottom") {
          if (valIsNegative) dataLabelsConfig.textAnchor = "end";
          else dataLabelsConfig.textAnchor = "start";
        }
      }
      if (this.barCtx.isRangeBar && this.barCtx.barOptions.dataLabels.hideOverflowingLabels) {
        const txRect = graphics.getTextRects(
          text,
          parseFloat(dataLabelsConfig.style.fontSize).toString()
        );
        if (barWidth < txRect.width) {
          text = "";
        }
      }
      if (w.config.chart.stacked && this.barCtx.barOptions.dataLabels.hideOverflowingLabels) {
        if (this.barCtx.isHorizontal) {
          if (textRects.width / 1.6 > Math.abs(barWidth)) {
            text = "";
          }
        } else {
          if (textRects.height / 1.6 > Math.abs(barHeight)) {
            text = "";
          }
        }
      }
      const modifiedDataLabelsConfig = __spreadValues({}, dataLabelsConfig);
      if (this.barCtx.isHorizontal) {
        if (val < 0) {
          if (dataLabelsConfig.textAnchor === "start") {
            modifiedDataLabelsConfig.textAnchor = "end";
          } else if (dataLabelsConfig.textAnchor === "end") {
            modifiedDataLabelsConfig.textAnchor = "start";
          }
        }
      }
      dataLabels.plotDataLabelsText({
        x,
        y,
        text,
        i,
        j,
        parent: elDataLabelsWrap,
        dataLabelsConfig: modifiedDataLabelsConfig,
        alwaysDrawDataLabel: true,
        offsetCorrection: true
      });
    }
    return elDataLabelsWrap;
  }
  /** @param {{ x?: any, y?: any, val?: any, realIndex?: any, textAnchor?: any, barWidth?: any, barHeight?: any, dataLabelsConfig?: any, barTotalDataLabelsConfig?: any }} opts */
  drawTotalDataLabels({
    x,
    y,
    val,
    realIndex,
    textAnchor,
    barTotalDataLabelsConfig
  }) {
    const graphics = new Graphics(this.barCtx.w);
    let totalDataLabelText;
    if (barTotalDataLabelsConfig.enabled && typeof x !== "undefined" && typeof y !== "undefined" && this.barCtx.lastActiveBarSerieIndex === realIndex) {
      totalDataLabelText = graphics.drawText({
        x,
        y,
        foreColor: barTotalDataLabelsConfig.style.color,
        text: val,
        textAnchor,
        fontFamily: barTotalDataLabelsConfig.style.fontFamily,
        fontSize: barTotalDataLabelsConfig.style.fontSize,
        fontWeight: barTotalDataLabelsConfig.style.fontWeight
      });
    }
    return totalDataLabelText;
  }
}
const Series = _core.__apex_Series;
const Fill = _core.__apex_Fill;
const Utils = _core.__apex_Utils;
class Helpers {
  /**
   * @param {Record<string, any>} barCtx
   */
  constructor(barCtx) {
    this.w = barCtx.w;
    this.barCtx = barCtx;
  }
  /**
   * @param {any[]} series
   */
  initVariables(series) {
    const w = this.w;
    this.barCtx.series = series;
    this.barCtx.totalItems = 0;
    this.barCtx.seriesLen = 0;
    this.barCtx.visibleI = -1;
    this.barCtx.visibleItems = 1;
    for (let sl = 0; sl < series.length; sl++) {
      if (series[sl].length > 0) {
        this.barCtx.seriesLen = this.barCtx.seriesLen + 1;
        this.barCtx.totalItems += series[sl].length;
      }
      if (w.axisFlags.isXNumeric) {
        for (let j = 0; j < series[sl].length; j++) {
          if (w.seriesData.seriesX[sl][j] > w.globals.minX && w.seriesData.seriesX[sl][j] < w.globals.maxX) {
            this.barCtx.visibleItems++;
          }
        }
      } else {
        this.barCtx.visibleItems = w.globals.dataPoints;
      }
    }
    this.arrBorderRadius = this.createBorderRadiusArr(w.seriesData.series);
    if (Utils.isSafari()) {
      this.arrBorderRadius = this.arrBorderRadius.map(
        (brArr) => (
          /**
           * @param {any} _
           */
          brArr.map((_) => "none")
        )
      );
    }
    if (this.barCtx.seriesLen === 0) {
      this.barCtx.seriesLen = 1;
    }
    this.barCtx.zeroSerieses = [];
    if (!w.globals.comboCharts) {
      this.checkZeroSeries({ series });
    }
  }
  /**
   * @param {number} realIndex
   */
  initialPositions(realIndex) {
    const w = this.w;
    let x, y, yDivision, xDivision, barHeight, barWidth, zeroH, zeroW;
    let dataPoints = w.globals.dataPoints;
    if (this.barCtx.isRangeBar) {
      dataPoints = w.labelData.labels.length;
    }
    let seriesLen = this.barCtx.seriesLen;
    if (w.config.plotOptions.bar.rangeBarGroupRows) {
      seriesLen = 1;
    }
    if (this.barCtx.isHorizontal) {
      yDivision = w.layout.gridHeight / dataPoints;
      barHeight = yDivision / seriesLen;
      if (w.axisFlags.isXNumeric) {
        yDivision = w.layout.gridHeight / this.barCtx.totalItems;
        barHeight = yDivision / this.barCtx.seriesLen;
      }
      barHeight = barHeight * parseInt(this.barCtx.barOptions.barHeight, 10) / 100;
      if (String(this.barCtx.barOptions.barHeight).indexOf("%") === -1) {
        barHeight = parseInt(this.barCtx.barOptions.barHeight, 10);
      }
      zeroW = this.barCtx.baseLineInvertedY + w.globals.padHorizontal + (this.barCtx.isReversed ? w.layout.gridWidth : 0) - (this.barCtx.isReversed ? this.barCtx.baseLineInvertedY * 2 : 0);
      if (this.barCtx.isFunnel) {
        zeroW = w.layout.gridWidth / 2;
      }
      y = (yDivision - barHeight * this.barCtx.seriesLen) / 2;
    } else {
      xDivision = w.layout.gridWidth / this.barCtx.visibleItems;
      if (w.config.xaxis.convertedCatToNumeric) {
        xDivision = w.layout.gridWidth / w.globals.dataPoints;
      }
      barWidth = xDivision / seriesLen * parseInt(this.barCtx.barOptions.columnWidth, 10) / 100;
      if (w.axisFlags.isXNumeric) {
        const xRatio = this.barCtx.xRatio;
        if (w.globals.minXDiff && w.globals.minXDiff !== 0.5 && w.globals.minXDiff / xRatio > 0) {
          xDivision = w.globals.minXDiff / xRatio;
        }
        barWidth = xDivision / seriesLen * parseInt(this.barCtx.barOptions.columnWidth, 10) / 100;
        if (barWidth < 1) {
          barWidth = 1;
        }
      }
      if (String(this.barCtx.barOptions.columnWidth).indexOf("%") === -1) {
        barWidth = parseInt(this.barCtx.barOptions.columnWidth, 10);
      }
      zeroH = w.layout.gridHeight - this.barCtx.baseLineY[this.barCtx.translationsIndex] - (this.barCtx.isReversed ? w.layout.gridHeight : 0) + (this.barCtx.isReversed ? this.barCtx.baseLineY[this.barCtx.translationsIndex] * 2 : 0);
      if (w.axisFlags.isXNumeric) {
        const xForNumericX = this.barCtx.getBarXForNumericXAxis({
          x,
          j: 0,
          realIndex,
          barWidth
        });
        x = xForNumericX.x;
      } else {
        x = w.globals.padHorizontal + Utils.noExponents(xDivision - barWidth * this.barCtx.seriesLen) / 2;
      }
    }
    w.globals.barHeight = barHeight;
    w.globals.barWidth = barWidth;
    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight,
      barWidth,
      zeroH,
      zeroW
    };
  }
  /**
   * @param {Record<string, any>} ctx
   */
  initializeStackedPrevVars(ctx) {
    const w = ctx.w;
    w.labelData.seriesGroups.forEach((group) => {
      if (!ctx[group]) ctx[group] = {};
      ctx[group].prevY = [];
      ctx[group].prevX = [];
      ctx[group].prevYF = [];
      ctx[group].prevXF = [];
      ctx[group].prevYVal = [];
      ctx[group].prevXVal = [];
    });
  }
  /**
   * @param {Record<string, any>} ctx
   */
  initializeStackedXYVars(ctx) {
    const w = ctx.w;
    w.labelData.seriesGroups.forEach((group) => {
      if (!ctx[group]) ctx[group] = {};
      ctx[group].xArrj = [];
      ctx[group].xArrjF = [];
      ctx[group].xArrjVal = [];
      ctx[group].yArrj = [];
      ctx[group].yArrjF = [];
      ctx[group].yArrjVal = [];
    });
  }
  /**
   * @param {any[]} series
   * @param {number} i
   * @param {number} j
   * @param {number} realIndex
   */
  getPathFillColor(series, i, j, realIndex) {
    var _a, _b, _c, _d;
    const w = this.w;
    const fill = new Fill(this.barCtx.w);
    let fillColor = null;
    const seriesNumber = this.barCtx.barOptions.distributed ? j : i;
    let useRangeColor = false;
    if (this.barCtx.barOptions.colors.ranges.length > 0) {
      const colorRange = this.barCtx.barOptions.colors.ranges;
      colorRange.map((range) => {
        if (series[i][j] >= range.from && series[i][j] <= range.to) {
          fillColor = range.color;
          useRangeColor = true;
        }
      });
    }
    const pathFill = fill.fillPath({
      seriesNumber: this.barCtx.barOptions.distributed ? seriesNumber : realIndex,
      dataPointIndex: j,
      color: fillColor,
      value: series[i][j],
      fillConfig: (_a = w.config.series[i].data[j]) == null ? void 0 : _a.fill,
      fillType: ((_c = (_b = w.config.series[i].data[j]) == null ? void 0 : _b.fill) == null ? void 0 : _c.type) ? (_d = w.config.series[i].data[j]) == null ? void 0 : _d.fill.type : Array.isArray(w.config.fill.type) ? w.config.fill.type[realIndex] : w.config.fill.type
    });
    return {
      color: pathFill,
      useRangeColor
    };
  }
  /**
   * @param {number} i
   * @param {number} j
   * @param {number} realIndex
   */
  getStrokeWidth(i, j, realIndex) {
    let strokeWidth = 0;
    const w = this.w;
    if (typeof this.barCtx.series[i][j] === "undefined" || this.barCtx.series[i][j] === null || w.config.chart.type === "bar" && !this.barCtx.series[i][j]) {
      this.barCtx.isNullValue = true;
    } else {
      this.barCtx.isNullValue = false;
    }
    if (w.config.stroke.show) {
      if (!this.barCtx.isNullValue) {
        strokeWidth = Array.isArray(this.barCtx.strokeWidth) ? this.barCtx.strokeWidth[realIndex] : this.barCtx.strokeWidth;
      }
    }
    return strokeWidth;
  }
  /**
   * @param {any[]} series
   */
  createBorderRadiusArr(series) {
    var _a;
    const w = this.w;
    const alwaysApplyRadius = !this.w.config.chart.stacked || w.config.plotOptions.bar.borderRadius <= 0;
    const numSeries = series.length;
    const numColumns = ((_a = series[0]) == null ? void 0 : _a.length) | 0;
    const output = Array.from(
      { length: numSeries },
      () => Array(numColumns).fill(alwaysApplyRadius ? "top" : "none")
    );
    if (alwaysApplyRadius) return output;
    const chartType = this.w.config.chart.type;
    for (let j = 0; j < numColumns; j++) {
      const positiveIndices = [];
      const negativeIndices = [];
      let nonZeroCount = 0;
      for (let i = 0; i < numSeries; i++) {
        const value = series[i][j];
        if (value > 0) {
          positiveIndices.push(i);
          nonZeroCount++;
        } else if (value < 0) {
          negativeIndices.push(i);
          nonZeroCount++;
        }
      }
      if (positiveIndices.length > 0 && negativeIndices.length === 0) {
        if (positiveIndices.length === 1) {
          output[positiveIndices[0]][j] = chartType === "bar" && numColumns === 1 ? "top" : "both";
        } else {
          const firstPositiveIndex = positiveIndices[0];
          const lastPositiveIndex = positiveIndices[positiveIndices.length - 1];
          for (const i of positiveIndices) {
            if (i === firstPositiveIndex) {
              output[i][j] = chartType === "bar" && numColumns === 1 ? "top" : "bottom";
            } else if (i === lastPositiveIndex) {
              output[i][j] = "top";
            } else {
              output[i][j] = "none";
            }
          }
        }
      } else if (negativeIndices.length > 0 && positiveIndices.length === 0) {
        if (negativeIndices.length === 1) {
          output[negativeIndices[0]][j] = "both";
        } else {
          const highestNegativeIndex = Math.max(...negativeIndices);
          const lowestNegativeIndex = Math.min(...negativeIndices);
          for (const i of negativeIndices) {
            if (i === highestNegativeIndex) {
              output[i][j] = "bottom";
            } else if (i === lowestNegativeIndex) {
              output[i][j] = "top";
            } else {
              output[i][j] = "none";
            }
          }
        }
      } else if (positiveIndices.length > 0 && negativeIndices.length > 0) {
        const lastPositiveIndex = positiveIndices[positiveIndices.length - 1];
        for (const i of positiveIndices) {
          if (i === lastPositiveIndex) {
            output[i][j] = "top";
          } else {
            output[i][j] = "none";
          }
        }
        const highestNegativeIndex = Math.max(...negativeIndices);
        for (const i of negativeIndices) {
          if (i === highestNegativeIndex) {
            output[i][j] = "bottom";
          } else {
            output[i][j] = "none";
          }
        }
      } else if (nonZeroCount === 1) {
        const index = positiveIndices[0] || negativeIndices[0];
        output[index][j] = "both";
      }
    }
    return output;
  }
  /** @param {{ j?: any, i?: any, x1?: any, x2?: any, y1?: any, y2?: any, bc?: any, elSeries?: any }} opts */
  barBackground({ j, i, x1, x2, y1, y2, elSeries }) {
    const w = this.w;
    const graphics = new Graphics(this.barCtx.w);
    const sr = new Series(this.barCtx.w);
    const activeSeriesIndex = sr.getActiveConfigSeriesIndex();
    if (this.barCtx.barOptions.colors.backgroundBarColors.length > 0 && activeSeriesIndex === i) {
      if (j >= this.barCtx.barOptions.colors.backgroundBarColors.length) {
        j %= this.barCtx.barOptions.colors.backgroundBarColors.length;
      }
      const bcolor = this.barCtx.barOptions.colors.backgroundBarColors[j];
      const rect = graphics.drawRect(
        typeof x1 !== "undefined" ? x1 : 0,
        typeof y1 !== "undefined" ? y1 : 0,
        typeof x2 !== "undefined" ? x2 : w.layout.gridWidth,
        typeof y2 !== "undefined" ? y2 : w.layout.gridHeight,
        this.barCtx.barOptions.colors.backgroundBarRadius,
        bcolor,
        this.barCtx.barOptions.colors.backgroundBarOpacity
      );
      elSeries.add(rect);
      rect.node.classList.add("apexcharts-backgroundBar");
    }
  }
  /** @param {{ barWidth?: any, barXPosition?: any, y1?: any, y2?: any, yRatio?: any, strokeWidth?: any, isReversed?: any, series?: any, seriesGroup?: any, realIndex?: any, i?: any, j?: any, w?: any }} opts */
  getColumnPaths({
    barWidth,
    barXPosition,
    y1,
    y2,
    strokeWidth,
    isReversed,
    series,
    seriesGroup,
    realIndex,
    i,
    j,
    w
  }) {
    var _a, _b, _c;
    const graphics = new Graphics(this.barCtx.w);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    let bW = barWidth;
    let bXP = barXPosition;
    if ((_a = w.config.series[realIndex].data[j]) == null ? void 0 : _a.columnWidthOffset) {
      bXP = barXPosition - w.config.series[realIndex].data[j].columnWidthOffset / 2;
      bW = barWidth + w.config.series[realIndex].data[j].columnWidthOffset;
    }
    const strokeCenter = strokeWidth / 2;
    const x1 = bXP + strokeCenter;
    const x2 = bXP + bW - strokeCenter;
    const direction = (series[i][j] >= 0 ? 1 : -1) * (isReversed ? -1 : 1);
    y1 += 1e-3 - strokeCenter * direction;
    y2 += 1e-3 + strokeCenter * direction;
    const sl = graphics.line(x2, y1);
    const closing = w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z";
    let pathTo = graphics.move(x1, y1) + graphics.line(x1, y2) + graphics.line(x2, y2) + sl + closing;
    if (this.arrBorderRadius[realIndex][j] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      );
    }
    let pathFrom = null;
    const morphFrom = (_c = (_b = this.barCtx.ctx) == null ? void 0 : _b.morphTypeChange) == null ? void 0 : _c.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(x1, y1) + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + closing;
    }
    if (w.config.chart.stacked) {
      let _ctx = this.barCtx;
      _ctx = this.barCtx[seriesGroup];
      _ctx.yArrj.push(y2 - strokeCenter * direction);
      _ctx.yArrjF.push(Math.abs(y1 - y2 + strokeWidth * direction));
      _ctx.yArrjVal.push(this.barCtx.series[i][j]);
    }
    return {
      pathTo,
      pathFrom
    };
  }
  /**
   * Build a trapezoidal funnel-stage path. Used when
   * `plotOptions.funnel.shape === 'trapezoid'` is active alongside `isFunnel`.
   *
   * Each stage is a 4-corner polygon whose top width matches the current
   * stage's value and bottom width matches the next stage's value, producing
   * continuous sloped sides between consecutive stages.
   *
   * For the last stage, the bottom width is configurable:
   * - `lastShape: 'flat'`  → bottom width = top width (parallel sides)
   * - `lastShape: 'taper'` → bottom width = 0 (taper to a point)
   *
   * @param {{ barYPosition: number, barHeight: number, series: any[][], i: number, j: number, realIndex: number, strokeWidth: number, w: any }} opts
   */
  getFunnelTrapezoidPaths({
    barYPosition,
    barHeight,
    series,
    i,
    j,
    realIndex,
    strokeWidth,
    w
  }) {
    var _a, _b;
    const graphics = new Graphics(this.barCtx.w);
    const center = w.layout.gridWidth / 2;
    const halfWidthFor = (v) => Math.abs(v / this.barCtx.invertedYRatio) / 2;
    const topHalf = halfWidthFor(series[i][j]);
    const lastIdx = series[i].length - 1;
    const isLast = j === lastIdx;
    const lastShape = w.config.plotOptions.funnel.lastShape === "taper" ? "taper" : "flat";
    let bottomHalf;
    if (isLast) {
      bottomHalf = lastShape === "taper" ? 0 : topHalf;
    } else {
      bottomHalf = halfWidthFor(series[i][j + 1]);
    }
    const strokeCenter = strokeWidth / 2;
    const y1 = barYPosition + strokeCenter;
    const y2 = barYPosition + barHeight - strokeCenter;
    const topLeftX = center - topHalf;
    const topRightX = center + topHalf;
    const bottomLeftX = center - bottomHalf;
    const bottomRightX = center + bottomHalf;
    const pathTo = graphics.move(topLeftX, y1) + graphics.line(topRightX, y1) + graphics.line(bottomRightX, y2) + graphics.line(bottomLeftX, y2) + " Z";
    let pathFrom = null;
    const morphFrom = (_b = (_a = this.barCtx.ctx) == null ? void 0 : _a.morphTypeChange) == null ? void 0 : _b.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(center, y1) + graphics.line(center, y1) + graphics.line(center, y2) + graphics.line(center, y2) + " Z";
    }
    return {
      pathTo,
      pathFrom,
      // x is the right edge of the wider (top) side — used by dataLabel
      // positioning helpers that expect a "right" reference.
      x: topRightX,
      x1: topLeftX,
      barXPosition: center
    };
  }
  /**
   * Pre-compute the per-segment layout for a value-proportional pyramid.
   *
   * Each segment is a horizontal slice of a triangle whose apex sits at the
   * top of the plot area (width = 0) and whose base spans `gridWidth` at the
   * bottom. The vertical extent of each slice is its share of the total
   * series value, so areas track value contribution and segments share
   * edges (no gaps). The first data point is the apex, the last is the base.
   *
   * @param {any[]} seriesData - 1D array of values for a single series row
   * @returns {{ y: number, height: number, topHalf: number, bottomHalf: number }[]}
   */
  computePyramidLayout(seriesData) {
    const w = this.w;
    const gridHeight = w.layout.gridHeight;
    const gridWidth = w.layout.gridWidth;
    const values = seriesData.map(
      /** @param {any} v */
      (v) => Math.abs(Number(v) || 0)
    );
    const total = values.reduce(
      /** @param {number} a @param {number} b */
      (a, b) => a + b,
      0
    );
    if (total === 0 || gridHeight <= 0) {
      return values.map(() => ({ y: 0, height: 0, topHalf: 0, bottomHalf: 0 }));
    }
    const halfWidth = gridWidth / 2;
    let cumulative = 0;
    const layout = [];
    for (let j = 0; j < values.length; j++) {
      const topRatio = cumulative / total;
      cumulative += values[j];
      const bottomRatio = cumulative / total;
      const topY = topRatio * gridHeight;
      const bottomY = bottomRatio * gridHeight;
      layout.push({
        y: topY,
        height: bottomY - topY,
        topHalf: topRatio * halfWidth,
        bottomHalf: bottomRatio * halfWidth
      });
    }
    return layout;
  }
  /**
   * Build a single pyramid stage path. Geometry is precomputed by
   * `computePyramidLayout`; this method only renders that geometry into an
   * SVG path string plus a `pathFrom` for entry/morph animations.
   *
   * @param {{ barYPosition: number, barHeight: number, topHalf: number, bottomHalf: number, realIndex: number, j: number, strokeWidth: number, w: any }} opts
   */
  getPyramidPaths({
    barYPosition,
    barHeight,
    topHalf,
    bottomHalf,
    realIndex,
    j,
    strokeWidth,
    w
  }) {
    var _a, _b;
    const graphics = new Graphics(this.barCtx.w);
    const center = w.layout.gridWidth / 2;
    const strokeCenter = strokeWidth / 2;
    const y1 = barYPosition + strokeCenter;
    const y2 = barYPosition + barHeight - strokeCenter;
    const topLeftX = center - topHalf;
    const topRightX = center + topHalf;
    const bottomLeftX = center - bottomHalf;
    const bottomRightX = center + bottomHalf;
    const pathTo = graphics.move(topLeftX, y1) + graphics.line(topRightX, y1) + graphics.line(bottomRightX, y2) + graphics.line(bottomLeftX, y2) + " Z";
    let pathFrom = null;
    const morphFrom = (_b = (_a = this.barCtx.ctx) == null ? void 0 : _a.morphTypeChange) == null ? void 0 : _b.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(center, y1) + graphics.line(center, y1) + graphics.line(center, y2) + graphics.line(center, y2) + " Z";
    }
    return {
      pathTo,
      pathFrom,
      x: topRightX,
      x1: topLeftX,
      barXPosition: center
    };
  }
  /** @param {{ barYPosition?: any, barHeight?: any, x1?: any, x2?: any, strokeWidth?: any, isReversed?: any, series?: any, seriesGroup?: any, realIndex?: any, i?: any, j?: any, w?: any }} opts */
  getBarpaths({
    barYPosition,
    barHeight,
    x1,
    x2,
    strokeWidth,
    isReversed,
    series,
    seriesGroup,
    realIndex,
    i,
    j,
    w
  }) {
    var _a, _b, _c;
    const graphics = new Graphics(this.barCtx.w);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    let bYP = barYPosition;
    let bH = barHeight;
    if ((_a = w.config.series[realIndex].data[j]) == null ? void 0 : _a.barHeightOffset) {
      bYP = barYPosition - w.config.series[realIndex].data[j].barHeightOffset / 2;
      bH = barHeight + w.config.series[realIndex].data[j].barHeightOffset;
    }
    const strokeCenter = strokeWidth / 2;
    const y1 = bYP + strokeCenter;
    const y2 = bYP + bH - strokeCenter;
    const direction = (series[i][j] >= 0 ? 1 : -1) * (isReversed ? -1 : 1);
    x1 += 1e-3 + strokeCenter * direction;
    x2 += 1e-3 - strokeCenter * direction;
    const isFunnel = this.barCtx.isFunnel;
    const fromX = isFunnel ? (x1 + x2) / 2 : x1;
    const sl = graphics.line(x1, y2);
    const closing = w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z";
    let pathTo = graphics.move(x1, y1) + graphics.line(x2, y1) + graphics.line(x2, y2) + sl + closing;
    if (this.arrBorderRadius[realIndex][j] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      );
    }
    let pathFrom = null;
    const morphFrom = (_c = (_b = this.barCtx.ctx) == null ? void 0 : _b.morphTypeChange) == null ? void 0 : _c.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo);
    }
    if (pathFrom == null) {
      const slFrom = isFunnel ? graphics.line(fromX, y2) : sl;
      pathFrom = graphics.move(fromX, y1) + graphics.line(fromX, y1) + slFrom + slFrom + slFrom + slFrom + slFrom + graphics.line(fromX, y1) + closing;
    }
    if (w.config.chart.stacked) {
      let _ctx = this.barCtx;
      _ctx = this.barCtx[seriesGroup];
      _ctx.xArrj.push(x2 + strokeCenter * direction);
      _ctx.xArrjF.push(Math.abs(x1 - x2 - strokeWidth * direction));
      _ctx.xArrjVal.push(this.barCtx.series[i][j]);
    }
    return {
      pathTo,
      pathFrom
    };
  }
  /** @param {{series: any}} opts */
  checkZeroSeries({ series }) {
    const w = this.w;
    for (let zs = 0; zs < series.length; zs++) {
      let total = 0;
      for (let zsj = 0; zsj < series[w.globals.maxValsInArrayIndex].length; zsj++) {
        total += series[zs][zsj];
      }
      if (total === 0) {
        this.barCtx.zeroSerieses.push(zs);
      }
    }
  }
  /**
   * @param {number} value
   * @param {number} zeroW
   */
  getXForValue(value, zeroW, zeroPositionForNull = true) {
    let xForVal = zeroPositionForNull ? zeroW : null;
    if (typeof value !== "undefined" && value !== null) {
      xForVal = zeroW + value / this.barCtx.invertedYRatio - (this.barCtx.isReversed ? value / this.barCtx.invertedYRatio : 0) * 2;
    }
    return xForVal;
  }
  /**
   * @param {number} value
   * @param {number} zeroH
   * @param {number} translationsIndex
   */
  getYForValue(value, zeroH, translationsIndex, zeroPositionForNull = true) {
    let yForVal = zeroPositionForNull ? zeroH : null;
    if (typeof value !== "undefined" && value !== null) {
      yForVal = zeroH - value / this.barCtx.yRatio[translationsIndex] + (this.barCtx.isReversed ? value / this.barCtx.yRatio[translationsIndex] : 0) * 2;
    }
    return yForVal;
  }
  /**
   * @param {string} type
   * @param {number} zeroW
   * @param {number} zeroH
   * @param {number} i
   * @param {number} j
   * @param {number} translationsIndex
   */
  getGoalValues(type, zeroW, zeroH, i, j, translationsIndex) {
    const w = this.w;
    const goals = [];
    const pushGoal = (value, attrs) => {
      goals.push({
        [type]: type === "x" ? this.getXForValue(value, zeroW, false) : this.getYForValue(value, zeroH, translationsIndex, false),
        attrs
      });
    };
    if (w.seriesData.seriesGoals[i] && w.seriesData.seriesGoals[i][j] && Array.isArray(w.seriesData.seriesGoals[i][j])) {
      w.seriesData.seriesGoals[i][j].forEach((goal) => {
        pushGoal(goal.value, goal);
      });
    }
    if (this.barCtx.barOptions.isDumbbell && w.rangeData.seriesRange.length) {
      const colors = this.barCtx.barOptions.dumbbellColors ? this.barCtx.barOptions.dumbbellColors : w.globals.colors;
      const commonAttrs = {
        strokeHeight: type === "x" ? 0 : w.globals.markers.size[i],
        strokeWidth: type === "x" ? w.globals.markers.size[i] : 0,
        strokeDashArray: 0,
        strokeLineCap: "round",
        strokeColor: Array.isArray(colors[i]) ? colors[i][0] : colors[i]
      };
      pushGoal(w.rangeData.seriesRangeStart[i][j], commonAttrs);
      pushGoal(w.rangeData.seriesRangeEnd[i][j], __spreadProps(__spreadValues({}, commonAttrs), {
        strokeColor: Array.isArray(colors[i]) ? colors[i][1] : colors[i]
      }));
    }
    return goals;
  }
  /** @param {{barXPosition: any, barYPosition: any, goalX: any, goalY: any, barWidth: any, barHeight: any}} opts */
  drawGoalLine({
    barXPosition,
    barYPosition,
    goalX,
    goalY,
    barWidth,
    barHeight
  }) {
    const hasGoals = Array.isArray(goalX) && goalX.length > 0 || Array.isArray(goalY) && goalY.length > 0;
    if (!hasGoals) {
      return null;
    }
    const graphics = new Graphics(this.barCtx.w);
    const lineGroup = graphics.group({
      className: "apexcharts-bar-goals-groups"
    });
    lineGroup.node.classList.add("apexcharts-element-hidden");
    this.barCtx.w.globals.delayedElements.push({
      el: lineGroup.node
    });
    lineGroup.attr(
      "clip-path",
      `url(#gridRectMarkerMask${this.barCtx.w.globals.cuid})`
    );
    let line = null;
    if (this.barCtx.isHorizontal) {
      if (Array.isArray(goalX)) {
        goalX.forEach((goal) => {
          if (goal.x >= -1 && goal.x <= graphics.w.layout.gridWidth + 1) {
            const sHeight = typeof goal.attrs.strokeHeight !== "undefined" ? goal.attrs.strokeHeight : barHeight / 2;
            const y = barYPosition + sHeight + barHeight / 2;
            line = graphics.drawLine(
              goal.x,
              y - sHeight * 2,
              goal.x,
              y,
              goal.attrs.strokeColor ? goal.attrs.strokeColor : void 0,
              goal.attrs.strokeDashArray,
              goal.attrs.strokeWidth ? goal.attrs.strokeWidth : 2,
              goal.attrs.strokeLineCap
            );
            lineGroup.add(line);
          }
        });
      }
    } else {
      if (Array.isArray(goalY)) {
        goalY.forEach((goal) => {
          if (goal.y >= -1 && goal.y <= graphics.w.layout.gridHeight + 1) {
            const sWidth = typeof goal.attrs.strokeWidth !== "undefined" ? goal.attrs.strokeWidth : barWidth / 2;
            const x = barXPosition + sWidth + barWidth / 2;
            line = graphics.drawLine(
              x - sWidth * 2,
              goal.y,
              x,
              goal.y,
              goal.attrs.strokeColor ? goal.attrs.strokeColor : void 0,
              goal.attrs.strokeDashArray,
              goal.attrs.strokeHeight ? goal.attrs.strokeHeight : 2,
              goal.attrs.strokeLineCap
            );
            lineGroup.add(line);
          }
        });
      }
    }
    return lineGroup;
  }
  /** @param {{prevPaths: any, currPaths: any, color: any, realIndex: any, j: any}} opts */
  drawBarShadow({ prevPaths, currPaths, color, realIndex, j }) {
    const w = this.w;
    const { x: prevX2, x1: prevX1, barYPosition: prevY1 } = prevPaths;
    const { x: currX2, x1: currX1, barYPosition: currY1 } = currPaths;
    const prevY2 = prevY1 + currPaths.barHeight;
    const graphics = new Graphics(this.barCtx.w);
    const utils = new Utils();
    const shadowPath = graphics.move(prevX1, prevY2) + graphics.line(prevX2, prevY2) + graphics.line(currX2, currY1) + graphics.line(currX1, currY1) + graphics.line(prevX1, prevY2) + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
    return graphics.drawPath({
      d: shadowPath,
      fill: utils.shadeColor(0.5, Utils.rgb2hex(color)),
      stroke: "none",
      strokeWidth: 0,
      fillOpacity: 1,
      classes: "apexcharts-bar-shadow apexcharts-decoration-element"
    });
  }
  /** @param {{i: any, j: any}} opts */
  getZeroValueEncounters({ i, j }) {
    var _a;
    const w = this.w;
    let nonZeroColumns = 0;
    let zeroEncounters = 0;
    const seriesIndices = w.config.plotOptions.bar.horizontal ? w.seriesData.series.map((_, _i) => _i) : ((_a = w.globals.columnSeries) == null ? void 0 : _a.i.map((_i) => _i)) || [];
    seriesIndices.forEach((_si) => {
      const val = w.globals.seriesPercent[_si][j];
      if (val) {
        nonZeroColumns++;
      }
      if (_si < i && val === 0) {
        zeroEncounters++;
      }
    });
    return {
      nonZeroColumns,
      zeroEncounters
    };
  }
  /**
   * @param {number} seriesIndex
   */
  getGroupIndex(seriesIndex) {
    const w = this.w;
    const groupIndex = w.labelData.seriesGroups.findIndex(
      (group) => (
        // w.config.series[i].name may be undefined, so use
        // w.seriesData.seriesNames[i], which has default names for those
        // series. w.labelData.seriesGroups[] uses the same default naming.
        group.indexOf(w.seriesData.seriesNames[seriesIndex]) > -1
      )
    );
    const cGI = this.barCtx.columnGroupIndices;
    let columnGroupIndex = cGI.indexOf(groupIndex);
    if (columnGroupIndex < 0) {
      cGI.push(groupIndex);
      columnGroupIndex = cGI.length - 1;
    }
    return { groupIndex, columnGroupIndex };
  }
}
const Filters = _core.__apex_Filters;
const computeStagger = _core.__apex_Animations_computeStagger;
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
function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer;
  return r && r.kind && r.kind !== "svg" ? r : graphics;
}
class Bar {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w, ctx, xyRatios) {
    this.ctx = ctx;
    this.w = w;
    this.barOptions = w.config.plotOptions.bar;
    this.isHorizontal = this.barOptions.horizontal;
    this.strokeWidth = w.config.stroke.width;
    this.isNullValue = false;
    this.isRangeBar = w.rangeData.seriesRange.length && this.isHorizontal;
    this.isVerticalGroupedRangeBar = !w.globals.isBarHorizontal && w.rangeData.seriesRange.length && w.config.plotOptions.bar.rangeBarGroupRows;
    this.isFunnel = this.barOptions.isFunnel;
    this.isPyramid = this.barOptions.isPyramid;
    this.pyramidLayout = null;
    this.xyRatios = xyRatios;
    this.xRatio = 0;
    this.yRatio = [];
    this.invertedXRatio = 0;
    this.invertedYRatio = 0;
    this.baseLineY = [];
    this.baseLineInvertedY = 0;
    if (this.xyRatios !== null) {
      this.xRatio = xyRatios.xRatio;
      this.yRatio = xyRatios.yRatio;
      this.invertedXRatio = xyRatios.invertedXRatio;
      this.invertedYRatio = xyRatios.invertedYRatio;
      this.baseLineY = xyRatios.baseLineY;
      this.baseLineInvertedY = xyRatios.baseLineInvertedY;
    }
    this.yaxisIndex = 0;
    this.translationsIndex = 0;
    this.seriesLen = 0;
    this.pathArr = [];
    this._prevKeyed = null;
    this._ltCache = null;
    this._layoutShiftCache = null;
    this.series = [];
    this.elSeries = null;
    this.visibleI = 0;
    this.isReversed = false;
    const ser = new Series(this.w);
    this.lastActiveBarSerieIndex = ser.getActiveConfigSeriesIndex("desc", [
      "bar",
      "column"
    ]);
    this.columnGroupIndices = [];
    const barSeriesIndices = ser.getBarSeriesIndices();
    const coreUtils = new CoreUtils(this.w);
    this.stackedSeriesTotals = coreUtils.getStackedSeriesTotals(
      this.w.config.series.map((s, i) => {
        return barSeriesIndices.indexOf(i) === -1 ? i : -1;
      }).filter((s) => {
        return s !== -1;
      })
    );
    this.barHelpers = new Helpers(this);
  }
  /** primary draw method which is called on bar object
   * @memberof Bar
   * @param {any[]} series - user supplied series values
   * @param {number} seriesIndex - the index by which series will be drawn on the svg
   * @return {Element} element which is supplied to parent chart draw method for appending
   **/
  draw(series, seriesIndex) {
    var _a, _b, _c;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    if (w.config.dataLabels.enabled) {
      if (this.totalItems > this.barOptions.dataLabels.maxItems) {
        console.warn(
          "WARNING: DataLabels are enabled but there are too many to display. This may cause performance issue when rendering - ApexCharts"
        );
      }
    }
    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      let x, y;
      const yArrj = [];
      const xArrj = [];
      const realIndex = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      const elSeries = graphics.group({
        class: `apexcharts-series`,
        rel: i + 1,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex);
      if (series[i].length > 0) {
        this.visibleI = this.visibleI + 1;
      }
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex];
        this.translationsIndex = realIndex;
      }
      const translationsIndex = this.translationsIndex;
      this.isReversed = w.config.yaxis[this.yaxisIndex] && w.config.yaxis[this.yaxisIndex].reversed;
      if (this.isPyramid) {
        this.pyramidLayout = this.barHelpers.computePyramidLayout(series[i]);
      }
      const initPositions = this.barHelpers.initialPositions(realIndex);
      const {
        y: initY,
        yDivision,
        // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroW,
        // zeroW is the baseline where 0 meets x axis
        x: initX,
        xDivision,
        // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        zeroH
        // zeroH is the baseline where 0 meets y axis
      } = initPositions;
      let barHeight = initPositions.barHeight;
      let barWidth = initPositions.barWidth;
      y = initY;
      x = initX;
      if (!this.isHorizontal) {
        xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
      }
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      w.globals.delayedElements.push({
        el: elDataLabelsWrap.node,
        // On a layout-changing update the labels must stay hidden through the
        // reflow morph (the updateOptions flow otherwise reveals them at
        // frame 0, where they float over sliding bars). When dataLabels.animate
        // is on the labels instead RIDE the morph (see DataLabelTransition), so
        // keep them visible: holding would hide the very motion we want to show.
        holdUntilComplete: !((_a = w.config.dataLabels.animate) == null ? void 0 : _a.enabled) && this.isLengthTransition(realIndex)
      });
      elDataLabelsWrap.node.classList.add("apexcharts-element-hidden");
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      const elBarShadows = graphics.group({
        class: "apexcharts-bar-shadows"
      });
      w.globals.delayedElements.push({
        el: elBarShadows.node
      });
      elBarShadows.node.classList.add("apexcharts-element-hidden");
      for (let j = 0; j < series[i].length; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        let paths = (
          /** @type {any} */
          null
        );
        const pathsParams = {
          indexes: {
            i,
            j,
            realIndex,
            translationsIndex,
            bc
          },
          x,
          y,
          strokeWidth,
          elSeries
        };
        if (this.isHorizontal) {
          paths = this.drawBarPaths(__spreadProps(__spreadValues({}, pathsParams), {
            barHeight,
            zeroW,
            yDivision
          }));
          barWidth = this.series[i][j] / this.invertedYRatio;
        } else {
          paths = this.drawColumnPaths(__spreadProps(__spreadValues({}, pathsParams), {
            xDivision,
            barWidth,
            zeroH
          }));
          barHeight = this.series[i][j] / this.yRatio[translationsIndex];
        }
        const pathFill = this.barHelpers.getPathFillColor(
          series,
          i,
          j,
          realIndex
        );
        if (this.isFunnel && !this.isPyramid && this.barOptions.isFunnel3d && ((_b = w.config.plotOptions.funnel) == null ? void 0 : _b.shape) !== "trapezoid" && this.pathArr.length && j > 0) {
          const barShadow = this.barHelpers.drawBarShadow({
            color: typeof pathFill.color === "string" && ((_c = pathFill.color) == null ? void 0 : _c.indexOf("url")) === -1 ? pathFill.color : Utils.hexToRgba(w.globals.colors[i]),
            prevPaths: this.pathArr[this.pathArr.length - 1],
            currPaths: paths,
            realIndex,
            j
          });
          elBarShadows.add(barShadow);
          if (w.config.chart.dropShadow.enabled) {
            const filters = new Filters(this.w);
            filters.dropShadow(barShadow, w.config.chart.dropShadow, realIndex);
          }
        }
        this.pathArr.push(paths);
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        });
        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine);
        }
        y = paths.y;
        x = paths.x;
        if (j > 0) {
          xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
        }
        yArrj.push(y);
        this.renderSeries(__spreadProps(__spreadValues({
          realIndex,
          pathFill: pathFill.color
        }, pathFill.useRangeColor ? { lineFill: pathFill.color } : {}), {
          j,
          i,
          columnGroupIndex,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          x,
          y,
          series,
          barHeight: Math.abs(paths.barHeight ? paths.barHeight : barHeight),
          barWidth: Math.abs(paths.barWidth ? paths.barWidth : barWidth),
          elDataLabelsWrap,
          elGoalsMarkers,
          elBarShadows,
          visibleSeries: this.visibleI,
          type: "bar"
        }));
      }
      w.globals.seriesXvalues[realIndex] = xArrj;
      w.globals.seriesYvalues[realIndex] = yArrj;
      if (w.globals.previousPaths.length > 0) {
        const newKeys = [];
        for (let j = 0; j < series[i].length; j++) {
          newKeys.push(datumKey(w, realIndex, j));
        }
        renderBarExitGhosts({
          w,
          elSeries,
          record: this._prevRecord(realIndex),
          newKeys,
          isHorizontal: this.isHorizontal,
          speed: w.config.chart.animations.dynamicAnimation.speed
        });
      }
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{ realIndex?: any, pathFill?: any, lineFill?: any, j?: any, i?: any, columnGroupIndex?: any, pathFrom?: any, pathTo?: any, strokeWidth?: any, elSeries?: any, x?: any, y?: any, y1?: any, y2?: any, series?: any, barHeight?: any, barWidth?: any, barXPosition?: any, barYPosition?: any, elDataLabelsWrap?: any, elGoalsMarkers?: any, elBarShadows?: any, visibleSeries?: any, type?: any, classes?: any }} opts */
  renderSeries({
    realIndex,
    pathFill,
    lineFill,
    j,
    i,
    columnGroupIndex,
    pathFrom,
    pathTo,
    strokeWidth,
    elSeries,
    x,
    // x pos
    y,
    // y pos
    y1,
    // absolute value
    y2,
    // absolute value
    series,
    barHeight,
    barWidth,
    barXPosition,
    barYPosition,
    elDataLabelsWrap,
    elGoalsMarkers,
    elBarShadows,
    visibleSeries,
    type,
    classes
  }) {
    var _a;
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const emit = seriesEmitter(this.ctx, graphics);
    let skipDrawing = false;
    if (!elSeries._bindingsDelegated) {
      elSeries._bindingsDelegated = true;
      graphics.setupEventDelegation(elSeries, `.apexcharts-${type}-area`);
    }
    if (!lineFill) {
      let fetchColor = function(i2) {
        const exp = w.config.stroke.colors;
        let c;
        if (Array.isArray(exp) && exp.length > 0) {
          c = exp[i2];
          if (!c) c = "";
          if (typeof c === "function") {
            return c({
              value: w.seriesData.series[i2][j],
              dataPointIndex: j,
              w
            });
          }
        }
        return c;
      };
      const checkAvailableColor = typeof w.globals.stroke.colors[realIndex] === "function" ? fetchColor(realIndex) : w.globals.stroke.colors[realIndex];
      lineFill = this.barOptions.distributed ? w.globals.stroke.colors[j] : checkAvailableColor;
    }
    const barDataLabels = new BarDataLabels(this);
    const dataLabelsObj = (
      /** @type {any} */
      barDataLabels.handleBarDataLabels({
        x,
        y,
        y1,
        y2,
        i,
        j,
        series,
        realIndex,
        columnGroupIndex,
        barHeight,
        barWidth,
        barXPosition,
        barYPosition,
        visibleSeries
      })
    );
    if (!w.globals.isBarHorizontal) {
      if (dataLabelsObj.dataLabelsPos.dataLabelsX + Math.max(barWidth, w.globals.barPadForNumericAxis) < 0 || dataLabelsObj.dataLabelsPos.dataLabelsX - Math.max(barWidth, w.globals.barPadForNumericAxis) > w.layout.gridWidth) {
        skipDrawing = true;
      }
    }
    if (
      /** @type {Record<string,any>} */
      w.config.series[i].data[j] && /** @type {Record<string,any>} */
      w.config.series[i].data[j].strokeColor
    ) {
      lineFill = /** @type {Record<string,any>} */
      w.config.series[i].data[j].strokeColor;
    }
    if (this.isNullValue) {
      pathFill = "none";
    }
    const animCfg = w.config.chart.animations;
    const gradCfg = animCfg.animateGradually;
    const staggerEnabled = gradCfg && gradCfg.enabled !== false && !(w.globals.dataChanged && this.isLayoutShift(realIndex));
    let delay = 0;
    if (staggerEnabled) {
      const totalBars = w.globals.dataPoints || 1;
      const configStep = gradCfg.delay || 0;
      const baseDelayMs = Math.min(
        configStep,
        animCfg.speed * 0.5 / Math.max(1, totalBars)
      );
      let delayMs = computeStagger({
        style: "sequential",
        index: j,
        baseDelay: baseDelayMs
      });
      if (w.config.chart.stacked) {
        delayMs += i * baseDelayMs * 0.5;
      }
      const delayFactor = configStep || 1;
      delay = delayMs / delayFactor;
    }
    if (!skipDrawing) {
      const morphActive = ((_a = this.ctx.morphTypeChange) == null ? void 0 : _a.isActive()) === true;
      const dataChangeSpeed = morphActive ? this.ctx.morphTypeChange.getSpeed() : w.config.chart.animations.dynamicAnimation.speed;
      const renderedPath = (
        /** @type {any} */
        emit.renderPaths({
          i,
          j,
          realIndex,
          pathFrom,
          pathTo,
          stroke: lineFill,
          strokeWidth,
          strokeLineCap: w.config.stroke.lineCap,
          fill: pathFill,
          animationDelay: delay,
          initialSpeed: w.config.chart.animations.speed,
          dataChangeSpeed,
          className: `apexcharts-${type}-area ${classes}`,
          chartType: type,
          bindEventsOnPaths: false
        })
      );
      renderedPath.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      const forecast = w.config.forecastDataPoints;
      if (forecast.count > 0) {
        if (j >= w.globals.dataPoints - forecast.count) {
          renderedPath.node.setAttribute("stroke-dasharray", forecast.dashArray);
          renderedPath.node.setAttribute("stroke-width", forecast.strokeWidth);
          renderedPath.node.setAttribute("fill-opacity", forecast.fillOpacity);
        }
      }
      if (typeof y1 !== "undefined" && typeof y2 !== "undefined") {
        renderedPath.attr("data-range-y1", y1);
        renderedPath.attr("data-range-y2", y2);
      }
      const filters = new Filters(this.w);
      filters.setSelectionFilter(renderedPath, realIndex, j);
      elSeries.add(renderedPath);
      renderedPath.attr({
        cy: dataLabelsObj.dataLabelsPos.bcy,
        cx: dataLabelsObj.dataLabelsPos.bcx,
        j,
        val: w.seriesData.series[i][j],
        barHeight,
        barWidth,
        // Datum identity for the next update's keyed join (see
        // LengthTransition): survivors match by key, not array position.
        "data:pathKey": datumKey(w, realIndex, j)
      });
      if (emit.kind === "canvas") {
        if (!w.globals.barCanvasCoords) w.globals.barCanvasCoords = {};
        if (!w.globals.barCanvasCoords[realIndex]) {
          w.globals.barCanvasCoords[realIndex] = {};
        }
        w.globals.barCanvasCoords[realIndex][j] = {
          cx: dataLabelsObj.dataLabelsPos.bcx,
          cy: dataLabelsObj.dataLabelsPos.bcy,
          barWidth
        };
      }
      if (dataLabelsObj.dataLabels !== null) {
        elDataLabelsWrap.add(dataLabelsObj.dataLabels);
      }
      if (dataLabelsObj.totalDataLabels) {
        elDataLabelsWrap.add(dataLabelsObj.totalDataLabels);
      }
      elSeries.add(elDataLabelsWrap);
      if (elGoalsMarkers) {
        elSeries.add(elGoalsMarkers);
      }
      if (elBarShadows) {
        elSeries.add(elBarShadows);
      }
    }
    return elSeries;
  }
  /** @param {{indexes: any, barHeight: any, strokeWidth: any, zeroW: any, x: any, y: any, yDivision: any, elSeries: any}} opts */
  drawBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    yDivision,
    elSeries
  }) {
    const w = this.w;
    const i = indexes.i;
    const j = indexes.j;
    let barYPosition;
    if (w.axisFlags.isXNumeric) {
      y = (w.seriesData.seriesX[i][j] - w.globals.minX) / this.invertedXRatio - barHeight;
      barYPosition = y + barHeight * this.visibleI;
    } else {
      if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        const { nonZeroColumns, zeroEncounters } = this.barHelpers.getZeroValueEncounters({ i, j });
        if (nonZeroColumns > 0) {
          barHeight = this.seriesLen * barHeight / nonZeroColumns;
        }
        barYPosition = y + barHeight * this.visibleI;
        barYPosition -= barHeight * zeroEncounters;
      } else {
        barYPosition = y + barHeight * this.visibleI;
      }
    }
    const useTrapezoid = this.isFunnel && w.config.plotOptions.funnel.shape === "trapezoid";
    const pyramidSeg = this.isPyramid && this.pyramidLayout ? this.pyramidLayout[j] : null;
    const usePyramid = !!pyramidSeg;
    if (pyramidSeg) {
      barYPosition = pyramidSeg.y;
      barHeight = pyramidSeg.height;
    } else if (this.isFunnel && !useTrapezoid) {
      const _zeroW = zeroW != null ? zeroW : 0;
      zeroW = _zeroW - /** @type {number} */
      /** @type {any} */
      (this.barHelpers.getXForValue(
        /** @type {any} */
        this.series[i][j],
        _zeroW
      ) - _zeroW) / 2;
    }
    x = this.barHelpers.getXForValue(
      /** @type {any} */
      this.series[i][j],
      zeroW != null ? zeroW : 0
    );
    let paths;
    if (pyramidSeg) {
      paths = /** @type {any} */
      this.barHelpers.getPyramidPaths({
        barYPosition,
        barHeight,
        topHalf: pyramidSeg.topHalf,
        bottomHalf: pyramidSeg.bottomHalf,
        realIndex: indexes.realIndex,
        j,
        strokeWidth,
        w
      });
    } else if (useTrapezoid) {
      paths = /** @type {any} */
      this.barHelpers.getFunnelTrapezoidPaths({
        barYPosition,
        barHeight,
        series: (
          /** @type {any} */
          this.series
        ),
        i,
        j,
        realIndex: indexes.realIndex,
        strokeWidth,
        w
      });
    } else {
      paths = /** @type {any} */
      this.barHelpers.getBarpaths({
        barYPosition,
        barHeight,
        x1: zeroW,
        x2: x,
        strokeWidth,
        isReversed: this.isReversed,
        series: this.series,
        realIndex: indexes.realIndex,
        i,
        j,
        w
      });
    }
    if (useTrapezoid || usePyramid) {
      zeroW = paths.x1;
      x = paths.x;
    }
    if (!w.axisFlags.isXNumeric && !usePyramid) {
      y = y + yDivision;
    }
    if (usePyramid) {
      y = barYPosition;
    }
    this.barHelpers.barBackground({
      j,
      i,
      y1: barYPosition - barHeight * this.visibleI,
      y2: barHeight * this.seriesLen,
      elSeries
    });
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      x1: zeroW,
      x,
      y,
      goalX: this.barHelpers.getGoalValues(
        "x",
        zeroW,
        /** @type {any} */
        null,
        i,
        j,
        0
      ),
      barYPosition,
      barHeight
    };
  }
  /** @param {{indexes: any, x: any, y: any, xDivision: any, barWidth: any, zeroH: any, strokeWidth: any, elSeries: any}} opts */
  drawColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth,
    elSeries
  }) {
    const w = this.w;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    const i = indexes.i;
    const j = indexes.j;
    const bc = indexes.bc;
    let barXPosition;
    if (w.axisFlags.isXNumeric) {
      const xForNumericX = this.getBarXForNumericXAxis({
        x,
        j,
        realIndex,
        barWidth
      });
      x = xForNumericX.x;
      barXPosition = xForNumericX.barXPosition;
    } else {
      if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        const { nonZeroColumns, zeroEncounters } = this.barHelpers.getZeroValueEncounters({ i, j });
        if (nonZeroColumns > 0) {
          barWidth = this.seriesLen * barWidth / nonZeroColumns;
        }
        barXPosition = x + barWidth * this.visibleI;
        barXPosition -= barWidth * zeroEncounters;
      } else {
        barXPosition = x + barWidth * this.visibleI;
      }
    }
    y = this.barHelpers.getYForValue(
      /** @type {any} */
      this.series[i][j],
      zeroH,
      translationsIndex
    );
    const paths = (
      /** @type {any} */
      this.barHelpers.getColumnPaths({
        barXPosition,
        barWidth,
        y1: zeroH,
        y2: y,
        strokeWidth,
        isReversed: this.isReversed,
        series: this.series,
        realIndex,
        i,
        j,
        w
      })
    );
    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision;
    }
    this.barHelpers.barBackground({
      bc,
      j,
      i,
      x1: barXPosition - strokeWidth / 2 - barWidth * this.visibleI,
      x2: barWidth * this.seriesLen + strokeWidth / 2,
      elSeries
    });
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      x,
      y,
      goalY: this.barHelpers.getGoalValues(
        "y",
        /** @type {any} */
        null,
        zeroH,
        i,
        j,
        translationsIndex
      ),
      barXPosition,
      barWidth
    };
  }
  /** @param {{x: any, barWidth: any, realIndex: any, j: any}} opts */
  getBarXForNumericXAxis({ x, barWidth, realIndex, j }) {
    const w = this.w;
    let sxI = realIndex;
    if (!w.seriesData.seriesX[realIndex].length) {
      sxI = w.globals.maxValsInArrayIndex;
    }
    if (Utils.isNumber(w.seriesData.seriesX[sxI][j])) {
      x = AxisMapping.dataXToPx(w, w.seriesData.seriesX[sxI][j]) - barWidth * this.seriesLen / 2;
    }
    return {
      barXPosition: x + barWidth * this.visibleI,
      x
    };
  }
  /**
   * The captured previous-render record for a series (last match wins, same
   * as the historical scan order).
   *
   * @param {number} realIndex
   * @returns {any | null}
   */
  _prevRecord(realIndex) {
    const w = this.w;
    let record = null;
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp];
      if (gpp.paths && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(String(realIndex), 10)) {
        record = gpp;
      }
    }
    return record;
  }
  /**
   * Previous paths of a series re-keyed by datum key (stamped as
   * `data:pathKey` on each bar path and captured by Series.getPreviousPaths).
   * Returns null when the previous render carries no keys (so the caller
   * falls back to positional matching).
   *
   * @param {number} realIndex
   * @returns {Map<string, {d: string}> | null}
   */
  _prevKeyedPaths(realIndex) {
    if (!this._prevKeyed) this._prevKeyed = {};
    if (this._prevKeyed[realIndex] !== void 0) {
      return this._prevKeyed[realIndex];
    }
    const record = this._prevRecord(realIndex);
    let map = null;
    if (record && record.paths.every((p) => p.key != null)) {
      const keyed = /* @__PURE__ */ new Map();
      record.paths.forEach((p) => {
        keyed.set(p.key, p);
      });
      map = keyed;
    }
    this._prevKeyed[realIndex] = map;
    return map;
  }
  /**
   * Whether this series' update changes its datum layout (points entered,
   * exited, or changed identity). Layout-changing updates run all survivors
   * on one shared clock (no per-bar stagger) so the reflow reads as a single
   * coordinated motion; pure value updates keep the stagger.
   *
   * @param {number} realIndex
   * @returns {boolean}
   */
  isLengthTransition(realIndex) {
    var _a, _b;
    if (!this._ltCache) this._ltCache = {};
    if (this._ltCache[realIndex] !== void 0) return this._ltCache[realIndex];
    const w = this.w;
    let result = false;
    if (lengthTransitionEnabled(w) && w.globals.previousPaths.length > 0) {
      const record = this._prevRecord(realIndex);
      const dataLen = (_b = (_a = w.seriesData.series[realIndex]) == null ? void 0 : _a.length) != null ? _b : 0;
      if (!record) {
        result = dataLen > 0;
      } else if (record.paths.length !== dataLen) {
        result = true;
      } else {
        const keyed = this._prevKeyedPaths(realIndex);
        if (keyed) {
          for (let j = 0; j < dataLen; j++) {
            if (!keyed.has(datumKey(w, realIndex, j))) {
              result = true;
              break;
            }
          }
        }
      }
    }
    this._ltCache[realIndex] = result;
    return result;
  }
  /**
   * Whether this update moves survivors to new slots: a length change
   * (enter/exit, via isLengthTransition) OR a pure reorder (a "bar chart race"
   * swap, same datum set in a new order). Used to drop the per-bar stagger so
   * all bars slide on one shared clock, staying locked to the axis/data labels.
   * Broader than isLengthTransition, which is deliberately enter/exit-only
   * (exit ghosts / baseline enters must not fire on a plain reorder).
   * @param {number} realIndex
   */
  isLayoutShift(realIndex) {
    if (this.isLengthTransition(realIndex)) return true;
    if (!this._layoutShiftCache) this._layoutShiftCache = {};
    if (this._layoutShiftCache[realIndex] !== void 0) {
      return this._layoutShiftCache[realIndex];
    }
    const sj = seriesJoin(this.w, realIndex, true, true);
    const result = !!(sj && sj.join.changed);
    this._layoutShiftCache[realIndex] = result;
    return result;
  }
  /**
   * Resolve `pathFrom` for a bar on data update, joining old and new datums
   * by KEY (category label / x value) so survivors keep their identity across
   * inserts, prepends, and removals. Three outcomes:
   *
   *  - survivor with stable shape → the previous `d` (smooth reflow morph);
   *  - survivor whose command count changed (corner state flipped, e.g. bar
   *    became new top-of-stack) → `pathTo` (pathFrom === pathTo, a snap);
   *  - genuinely new datum (key absent from the previous render, or the whole
   *    series is new) → null, telling the path builder to use its
   *    grow-from-baseline enter path.
   *
   * Falls back to positional (index j) matching when the previous render
   * carries no datum keys.
   *
   * @param {number} realIndex - stable series index from `data:realIndex`
   * @param {number} j - data-point index within the series
   * @param {string} pathTo - the freshly-built path for this bar (post-roundPathCorners)
   * @returns {string | null}
   **/
  getPreviousPath(realIndex, j, pathTo) {
    const w = this.w;
    const record = this._prevRecord(realIndex);
    if (!record) {
      return lengthTransitionEnabled(w) ? null : pathTo;
    }
    let oldD = null;
    let isNewDatum = false;
    const keyed = this._prevKeyedPaths(realIndex);
    if (keyed) {
      const prev = keyed.get(datumKey(w, realIndex, j));
      if (prev) {
        oldD = prev.d;
      } else {
        isNewDatum = true;
      }
    } else if (typeof record.paths[j] !== "undefined") {
      oldD = record.paths[j].d;
    } else {
      isNewDatum = true;
    }
    if (oldD && Bar.pathCommandCount(oldD) === Bar.pathCommandCount(pathTo)) {
      return oldD;
    }
    if (isNewDatum && lengthTransitionEnabled(w)) {
      return null;
    }
    return pathTo;
  }
  /**
   * Count SVG path commands (M, L, C, Q, Z, etc.). Used to detect whether
   * two paths can be morphed safely — SVG.js requires matching command counts.
   *
   * @param {string} d
   * @returns {number}
   */
  static pathCommandCount(d) {
    if (!d) return 0;
    const matches = d.match(/[A-Za-z]/g);
    return matches ? matches.length : 0;
  }
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
  clampAt
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
class BoxCandleStick extends Bar {
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} seriesIndex
   */
  // @ts-ignore -- BoxCandleStick.draw has an extra ctype param compared to Bar.draw
  draw(series, ctype, seriesIndex) {
    var _a;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const type = w.globals.comboCharts ? ctype : w.config.chart.type;
    const fill = new Fill(this.w);
    this.candlestickOptions = this.w.config.plotOptions.candlestick;
    this.boxOptions = this.w.config.plotOptions.boxPlot;
    this.isHorizontal = w.config.plotOptions.bar.horizontal;
    this.isOHLC = this.candlestickOptions && this.candlestickOptions.type === "ohlc";
    this.coreUtils = new CoreUtils(this.w);
    series = this.coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = this.coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: `apexcharts-${type}-series apexcharts-plot-series`
    });
    for (let i = 0; i < series.length; i++) {
      this.isBoxPlot = w.config.chart.type === "boxPlot" || /** @type {Record<string,any>} */
      w.config.series[i].type === "boxPlot";
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
        class: `apexcharts-series`,
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
        // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroW,
        // zeroW is the baseline where 0 meets x axis
        x: initX,
        barWidth,
        xDivision,
        // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        zeroH
        // zeroH is the baseline where 0 meets y axis
      } = initPositions;
      y = initY;
      x = initX;
      xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      const boxPointsOpts = this.isBoxPlot ? this.boxOptions.points : null;
      const pointsByCat = [];
      const gridW = w.layout.gridWidth;
      const cullBuffer = barWidth != null ? barWidth : 0;
      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        let paths = (
          /** @type {any} */
          null
        );
        const pathsParams = {
          indexes: {
            i,
            j,
            realIndex,
            translationsIndex
          },
          x,
          y,
          strokeWidth,
          elSeries
        };
        if (this.isHorizontal) {
          paths = this.drawHorizontalBoxPaths(__spreadProps(__spreadValues({}, pathsParams), {
            yDivision,
            barHeight,
            zeroW
          }));
        } else {
          paths = this.drawVerticalBoxPaths(__spreadProps(__spreadValues({}, pathsParams), {
            xDivision,
            barWidth,
            zeroH,
            cullBounds: { lo: -cullBuffer, hi: gridW + cullBuffer }
          }));
        }
        y = paths.y;
        x = paths.x;
        if (j > 0) {
          xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
        }
        yArrj.push(y);
        if (paths.culled) {
          continue;
        }
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition: paths.barYPosition,
          goalX: paths.goalX,
          goalY: paths.goalY,
          barHeight,
          barWidth
        });
        if (barGoalLine) {
          elGoalsMarkers.add(barGoalLine);
        }
        paths.pathTo.forEach(
          (pathTo, pi) => {
            const lineFill = !this.isBoxPlot && this.candlestickOptions.wick.useFillColor ? paths.color[pi] : w.globals.stroke.colors[i];
            const pathFill = fill.fillPath({
              seriesNumber: realIndex,
              dataPointIndex: j,
              color: paths.color[pi],
              value: series[i][j]
            });
            this.renderSeries({
              realIndex,
              pathFill,
              lineFill,
              j,
              i,
              pathFrom: paths.pathFrom,
              pathTo,
              strokeWidth,
              elSeries,
              x,
              y,
              series,
              columnGroupIndex,
              barHeight,
              barWidth,
              elDataLabelsWrap,
              elGoalsMarkers,
              visibleSeries: this.visibleI,
              type: w.config.chart.type
            });
          }
        );
        if (boxPointsOpts && boxPointsOpts.show !== false) {
          const pts = (_a = w.candleData.seriesBoxPoints[realIndex]) == null ? void 0 : _a[j];
          if (pts && pts.length) {
            const logVal = (v) => (
              /** @type {any} */
              this.coreUtils.getLogValAtSeriesIndex(
                v,
                realIndex
              )
            );
            let center, halfExtent, alongFn;
            if (this.isHorizontal) {
              const yRatio = this.invertedYRatio;
              const bh = barHeight != null ? barHeight : 0;
              const z = zeroW != null ? zeroW : 0;
              center = paths.barYPosition + bh / 2;
              halfExtent = bh / 2;
              alongFn = (v) => z + logVal(v) / yRatio;
            } else {
              const yRatio = this.yRatio[translationsIndex];
              const bw = barWidth != null ? barWidth : 0;
              const z = zeroH != null ? zeroH : 0;
              center = paths.barXPosition + bw / 2;
              halfExtent = bw / 2;
              alongFn = (v) => z - logVal(v) / yRatio;
            }
            const groups = buildJitterGroups({
              w,
              points: pts,
              seedA: realIndex,
              seedB: j,
              center,
              halfExtent,
              alongFn,
              isHorizontal: this.isHorizontal,
              options: boxPointsOpts
            });
            if (groups.length) pointsByCat.push({ groups, j });
          }
        }
      }
      if (boxPointsOpts) {
        renderJitter({
          graphics,
          w,
          elSeries,
          pointsByCat,
          options: boxPointsOpts,
          distributed: w.config.plotOptions.bar.distributed,
          realIndex,
          wrapClass: "apexcharts-boxPlot-points-wrap",
          pointClass: "apexcharts-boxPlot-points"
        });
      }
      w.globals.seriesXvalues[realIndex] = xArrj;
      w.globals.seriesYvalues[realIndex] = yArrj;
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, zeroH: any, strokeWidth: any, cullBounds?: {lo: number, hi: number}|null}} opts */
  drawVerticalBoxPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth,
    cullBounds = null
  }) {
    var _a, _b;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const i = indexes.i;
    const j = indexes.j;
    const { colors: candleColors } = w.config.plotOptions.candlestick;
    const { colors: boxColors } = this.boxOptions;
    const realIndex = indexes.realIndex;
    const getColor = (color2) => Array.isArray(color2) ? color2[realIndex] : color2;
    const colorPos = getColor(candleColors.upward);
    const colorNeg = getColor(candleColors.downward);
    const yRatio = this.yRatio[indexes.translationsIndex];
    const ohlc = this.getOHLCValue(realIndex, j);
    let l1 = zeroH;
    let l2 = zeroH;
    let color = ohlc.o < ohlc.c ? [colorPos] : [colorNeg];
    if (this.isBoxPlot) {
      color = [getColor(boxColors.lower), getColor(boxColors.upper)];
    }
    let y1 = Math.min(ohlc.o, ohlc.c);
    let y2 = Math.max(ohlc.o, ohlc.c);
    let m = ohlc.m;
    if (w.axisFlags.isXNumeric) {
      x = (w.seriesData.seriesX[realIndex][j] - w.globals.minX) / this.xRatio - barWidth / 2;
    }
    const barXPosition = x + barWidth * this.visibleI;
    if (typeof /** @type {any} */
    ((_a = this.series[i]) == null ? void 0 : _a[j]) === "undefined" || /** @type {any} */
    ((_b = this.series[i]) == null ? void 0 : _b[j]) === null) {
      y1 = zeroH;
      y2 = zeroH;
    } else {
      y1 = zeroH - y1 / yRatio;
      y2 = zeroH - y2 / yRatio;
      l1 = zeroH - ohlc.h / yRatio;
      l2 = zeroH - ohlc.l / yRatio;
      m = zeroH - ohlc.m / yRatio;
    }
    if (cullBounds && (barXPosition + barWidth < cullBounds.lo || barXPosition > cullBounds.hi)) {
      return {
        pathTo: null,
        pathFrom: null,
        x: w.axisFlags.isXNumeric ? x : x + xDivision,
        y: y2,
        barXPosition,
        color,
        culled: true
      };
    }
    let pathTo;
    if (this.isOHLC) {
      const centerX = barXPosition + barWidth / 2;
      const openY = zeroH - ohlc.o / yRatio;
      const closeY = zeroH - ohlc.c / yRatio;
      pathTo = [
        graphics.move(centerX, l1) + graphics.line(centerX, l2) + graphics.move(centerX, openY) + graphics.line(barXPosition, openY) + graphics.move(centerX, closeY) + graphics.line(barXPosition + barWidth, closeY)
      ];
    } else if (this.isBoxPlot) {
      pathTo = [
        graphics.move(barXPosition, y1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 4, l1) + graphics.line(barXPosition + barWidth - barWidth / 4, l1) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth, y1) + graphics.line(barXPosition + barWidth, m) + graphics.line(barXPosition, m) + graphics.line(barXPosition, y1 + strokeWidth / 2),
        graphics.move(barXPosition, m) + graphics.line(barXPosition + barWidth, m) + graphics.line(barXPosition + barWidth, y2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth - barWidth / 4, l2) + graphics.line(barXPosition + barWidth / 4, l2) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition, y2) + graphics.line(barXPosition, m) + "z"
      ];
    } else {
      pathTo = [
        graphics.move(barXPosition, y2) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth / 2, l1) + graphics.line(barXPosition + barWidth / 2, y2) + graphics.line(barXPosition + barWidth, y2) + graphics.line(barXPosition + barWidth, y1) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition + barWidth / 2, l2) + graphics.line(barXPosition + barWidth / 2, y1) + graphics.line(barXPosition, y1) + graphics.line(barXPosition, y2 - strokeWidth / 2)
      ];
    }
    let pathFrom = null;
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo[0]);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(barXPosition + barWidth / 2, y1) + graphics.move(barXPosition, y1);
    }
    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision;
    }
    return {
      pathTo,
      pathFrom,
      x,
      y: y2,
      goalY: this.barHelpers.getGoalValues(
        "y",
        /** @type {any} */
        null,
        zeroH,
        i,
        j,
        indexes.translationsIndex
      ),
      barXPosition,
      color
    };
  }
  /** @param {{indexes: any, y: any, yDivision: any, barHeight: any, zeroW: any, strokeWidth: any}} opts */
  drawHorizontalBoxPaths({
    indexes,
    y,
    yDivision,
    barHeight,
    zeroW,
    strokeWidth
  }) {
    var _a, _b;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const i = indexes.i;
    const j = indexes.j;
    const realIndex = indexes.realIndex;
    const { colors: candleColors } = w.config.plotOptions.candlestick;
    const { colors: boxColors } = this.boxOptions;
    const getColor = (color2) => Array.isArray(color2) ? color2[realIndex] : color2;
    const yRatio = this.invertedYRatio;
    const ohlc = this.getOHLCValue(realIndex, j);
    let color = ohlc.o < ohlc.c ? [getColor(candleColors.upward)] : [getColor(candleColors.downward)];
    if (this.isBoxPlot) {
      color = [getColor(boxColors.lower), getColor(boxColors.upper)];
    }
    let l1 = zeroW;
    let l2 = zeroW;
    let x1 = Math.min(ohlc.o, ohlc.c);
    let x2 = Math.max(ohlc.o, ohlc.c);
    let m = ohlc.m;
    if (w.axisFlags.isXNumeric) {
      y = (w.seriesData.seriesX[realIndex][j] - w.globals.minX) / this.invertedXRatio - barHeight / 2;
    }
    const barYPosition = y + barHeight * this.visibleI;
    if (typeof /** @type {any} */
    ((_a = this.series[i]) == null ? void 0 : _a[j]) === "undefined" || /** @type {any} */
    ((_b = this.series[i]) == null ? void 0 : _b[j]) === null) {
      x1 = zeroW;
      x2 = zeroW;
    } else {
      x1 = zeroW + x1 / yRatio;
      x2 = zeroW + x2 / yRatio;
      l1 = zeroW + ohlc.h / yRatio;
      l2 = zeroW + ohlc.l / yRatio;
      m = zeroW + ohlc.m / yRatio;
    }
    const pathTo = [
      graphics.move(x1, barYPosition) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2 - barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2 + barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight) + graphics.line(m, barYPosition + barHeight) + graphics.line(m, barYPosition) + graphics.line(x1 + strokeWidth / 2, barYPosition),
      graphics.move(m, barYPosition) + graphics.line(m, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight - barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition) + graphics.line(m, barYPosition) + "z"
    ];
    let pathFrom = null;
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j, pathTo[0]);
    }
    if (pathFrom == null) {
      pathFrom = graphics.move(x1, barYPosition + barHeight / 2) + graphics.move(x1, barYPosition);
    }
    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo,
      pathFrom,
      x: x2,
      y,
      goalX: this.barHelpers.getGoalValues(
        "x",
        zeroW,
        /** @type {any} */
        null,
        i,
        j,
        0
      ),
      barYPosition,
      color
    };
  }
  /**
   * @param {number} i
   * @param {number} j
   */
  getOHLCValue(i, j) {
    const w = this.w;
    const coreUtils = this.coreUtils;
    const getCandleVal = (arr) => arr[i] && arr[i][j] != null ? (
      /** @type {any} */
      coreUtils.getLogValAtSeriesIndex(arr[i][j], i)
    ) : 0;
    const h = getCandleVal(w.candleData.seriesCandleH);
    const o = getCandleVal(w.candleData.seriesCandleO);
    const m = getCandleVal(w.candleData.seriesCandleM);
    const c = getCandleVal(w.candleData.seriesCandleC);
    const l = getCandleVal(w.candleData.seriesCandleL);
    return {
      o: this.isBoxPlot ? h : o,
      h: this.isBoxPlot ? o : h,
      m,
      l: this.isBoxPlot ? c : l,
      c: this.isBoxPlot ? l : c
    };
  }
}
_core__default.use({
  candlestick: BoxCandleStick,
  boxPlot: BoxCandleStick
});
export {
  default2 as default
};
