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
 * ApexCharts v7.1.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const DataLabels = _core.__apex_DataLabels;
const resolveDataLabelOffset = (value, w, seriesIndex, dataPointIndex) => {
  if (typeof value !== "function") return value;
  const resolved = value({
    series: w.seriesData.series,
    seriesIndex,
    dataPointIndex,
    w
  });
  return Number.isFinite(resolved) ? resolved : 0;
};
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
    var _a, _b;
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
    const steps = w.waterfallData && w.waterfallData.values;
    const waterfallStep = steps && steps[realIndex] && steps[realIndex][j] != null ? steps[realIndex][j] : null;
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
    const offX = resolveDataLabelOffset(
      dataLabelsConfig.offsetX,
      w,
      realIndex,
      j
    );
    const offY = resolveDataLabelOffset(
      dataLabelsConfig.offsetY,
      w,
      realIndex,
      j
    );
    let textRects = {
      width: 0,
      height: 0
    };
    if (w.config.dataLabels.enabled) {
      const yLabel = waterfallStep !== null ? waterfallStep : w.seriesData.series[realIndex][j];
      textRects = graphics.getTextRects(
        w.config.dataLabels.formatter ? w.config.dataLabels.formatter(yLabel, __spreadProps(__spreadValues({}, w), {
          seriesIndex: realIndex,
          dataPointIndex: j,
          w
        })) : w.formatters.yLabelFormatters[0](yLabel),
        parseFloat(dataLabelsConfig.style.fontSize).toString(),
        dataLabelsConfig.style.fontFamily,
        void 0,
        true,
        dataLabelsConfig.style.fontWeight
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
    if (waterfallStep !== null && this.barCtx.isHorizontal && barDataLabelsConfig.position === "center") {
      const box = (_b = (_a = w.waterfallData.geometry) == null ? void 0 : _a[realIndex]) == null ? void 0 : _b[j];
      if (box && box.horizontal) {
        dataLabelsPos.dataLabelsX = (box.levelStart + box.levelEnd) / 2 + offX;
      }
    }
    dataLabels = this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      val: waterfallStep !== null ? waterfallStep : this.barCtx.isRangeBar ? [y1, y2] : w.config.chart.stackType === "100%" ? series[realIndex][j] : w.seriesData.series[realIndex][j],
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
        j,
        textAnchor: dataLabelsPos.totalDataLabelsAnchor,
        val: this.getStackedTotalDataLabel({ realIndex, j }),
        rawVal: this.getStackedTotalValue({ realIndex, j }),
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
  /**
   * True when this chart stacks in more than one group, so totals have to be
   * resolved per group rather than across the whole data point. A single-group
   * chart keeps every old code path exactly as it was. See #4173.
   */
  hasMultipleSeriesGroups() {
    return this.w.labelData.seriesGroups.length > 1;
  }
  /**
   * The series group `realIndex` belongs to, and that group's own stacking
   * state, or null when totals are chart-wide (the single-group case).
   * @param {number} realIndex
   * @returns {{groupIndex: number, group: string[]} | null}
   */
  getTotalGroupContext(realIndex) {
    if (!this.hasMultipleSeriesGroups()) return null;
    const groupIndex = this.barCtx.barHelpers.getSeriesGroupIndex(realIndex);
    if (groupIndex < 0) return null;
    return { groupIndex, group: this.w.labelData.seriesGroups[groupIndex] };
  }
  /**
   * Whether `realIndex` is the series that should draw the stacked total.
   *
   * That is the series capping the stack. With grouped stacks each group has
   * its own cap, so gating on the chart-wide `lastActiveBarSerieIndex` drew a
   * single total for the last group only. See #4173.
   * @param {number} realIndex
   */
  drawsStackedTotal(realIndex) {
    const byGroup = this.barCtx.lastActiveBarSerieIndexByGroup;
    const ctx = this.getTotalGroupContext(realIndex);
    if (ctx && byGroup && byGroup.length > ctx.groupIndex) {
      return byGroup[ctx.groupIndex] === realIndex;
    }
    return this.barCtx.lastActiveBarSerieIndex === realIndex;
  }
  /**
   * The raw (unformatted) stacked total at this data point. Split out of
   * getStackedTotalDataLabel so the label transition can count the total up
   * from its previous number and re-run the formatter itself each frame.
   * @param {{realIndex: any, j: any}} opts
   */
  getStackedTotalValue({ realIndex, j }) {
    const w = this.w;
    const ctx = this.getTotalGroupContext(realIndex);
    const byGroups = w.seriesData.stackedSeriesTotalsByGroups;
    return ctx && byGroups && byGroups[ctx.groupIndex] ? byGroups[ctx.groupIndex][j] : this.barCtx.stackedSeriesTotals[j];
  }
  /** @param {{realIndex: any, j: any}} opts */
  getStackedTotalDataLabel({ realIndex, j }) {
    const w = this.w;
    let val = this.getStackedTotalValue({ realIndex, j });
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
    const totalGroupCtx = this.getTotalGroupContext(realIndex);
    const prevYGroups = totalGroupCtx ? [totalGroupCtx.group] : w.labelData.seriesGroups;
    prevYGroups.forEach((sg) => {
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
    if (this.drawsStackedTotal(realIndex) && barTotalDataLabelsConfig.enabled) {
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
      totalDataLabelsX = totalDataLabelsBcx + (w.axisFlags.isXNumeric ? -barWidth / 2 : barWidth / 2 - xDivision) + barTotalDataLabelsConfig.offsetX;
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
    const totalGroupCtx = this.getTotalGroupContext(realIndex);
    const prevXGroups = totalGroupCtx ? [totalGroupCtx.group] : w.labelData.seriesGroups;
    prevXGroups.forEach((sg) => {
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
    if (this.drawsStackedTotal(realIndex) && barTotalDataLabelsConfig.enabled) {
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
      if (w.globals.barGroups.length > 1 && !totalGroupCtx) {
        totalDataLabelsY = totalDataLabelsY - w.globals.barGroups.length / 2 * (barHeight / 2);
      }
    }
    if (!w.config.chart.stacked) {
      const flipped = valIsNegative && dataLabelsConfig.textAnchor !== "middle" ? dataLabelsConfig.textAnchor === "start" ? "end" : "start" : dataLabelsConfig.textAnchor;
      let spanLeft;
      if (barDataLabelsConfig.orientation === "vertical") {
        spanLeft = textRects.height / 2;
      } else if (flipped === "end") {
        spanLeft = textRects.width;
      } else if (flipped === "middle") {
        spanLeft = textRects.width / 2;
      } else {
        spanLeft = 0;
      }
      const span = barDataLabelsConfig.orientation === "vertical" ? textRects.height : textRects.width;
      const spanRight = span - spanLeft;
      if (dataLabelsX + spanRight > w.layout.gridWidth - strokeWidth) {
        dataLabelsX = w.layout.gridWidth - spanRight - strokeWidth;
      }
      if (dataLabelsX - spanLeft < strokeWidth) {
        dataLabelsX = spanLeft + strokeWidth;
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
    var _a, _b, _c;
    const w = this.w;
    let rotate = "rotate(0)";
    if (w.config.plotOptions.bar.dataLabels.orientation === "vertical")
      rotate = `rotate(-90, ${x}, ${y})`;
    const dataLabels = new DataLabels(this.barCtx.w, this.barCtx.ctx);
    const graphics = new Graphics(this.barCtx.w);
    const formatter = dataLabelsConfig.formatter;
    let elDataLabelsWrap = null;
    const isSeriesCollapsed = w.globals.collapsedSeriesIndices.indexOf(i) > -1;
    const isSeriesCollapsing = (w.globals.collapsingSeriesIndices || []).indexOf(i) > -1;
    if (isSeriesCollapsing) {
      const prev = (_a = w.globals.prevDataLabels) == null ? void 0 : _a.get(`${i}::${datumKey(w, i, j)}`);
      if (prev && isFinite(prev.val)) val = prev.val;
    }
    if (dataLabelsConfig.enabled && (!isSeriesCollapsed || isSeriesCollapsing)) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels",
        transform: rotate
      });
      const dlCfg = w.config.dataLabels;
      if (((_b = dlCfg.animate) == null ? void 0 : _b.enabled) || ((_c = dlCfg.countUp) == null ? void 0 : _c.enabled)) {
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
      if (w.config.chart.stacked && this.barCtx.barOptions.dataLabels.hideOverflowingLabels && // A collapsing series is measured against its NEW extent, which is
      // already zero, so this would blank a label whose bar is still at full
      // height on screen. It starts out fitting and fades away with the mark.
      !isSeriesCollapsing) {
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
  /** @param {{ x?: any, y?: any, val?: any, rawVal?: any, realIndex?: any, j?: any, textAnchor?: any, barWidth?: any, barHeight?: any, dataLabelsConfig?: any, barTotalDataLabelsConfig?: any }} opts */
  drawTotalDataLabels({
    x,
    y,
    val,
    rawVal,
    realIndex,
    j,
    textAnchor,
    barTotalDataLabelsConfig
  }) {
    var _a, _b;
    const graphics = new Graphics(this.barCtx.w);
    let totalDataLabelText;
    if (barTotalDataLabelsConfig.enabled && typeof x !== "undefined" && typeof y !== "undefined" && this.drawsStackedTotal(realIndex)) {
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
      totalDataLabelText.attr({
        class: "apexcharts-datalabel-total",
        cx: x,
        cy: y
      });
      const dlCfg = this.w.config.dataLabels;
      if (((_a = dlCfg.animate) == null ? void 0 : _a.enabled) || ((_b = dlCfg.countUp) == null ? void 0 : _b.enabled)) {
        const { groupIndex } = this.barCtx.barHelpers.getGroupIndex(realIndex);
        totalDataLabelText.node.setAttribute(
          "data:dlTotalKey",
          `${groupIndex}::${datumKey(this.w, realIndex, j)}`
        );
        totalDataLabelText.node.setAttribute(
          "data:dlTotalSeries",
          String(realIndex)
        );
        if (typeof rawVal === "number" && isFinite(rawVal)) {
          totalDataLabelText.node.setAttribute("data:dlTotalVal", String(rawVal));
        }
      }
    }
    return totalDataLabelText;
  }
}
const Series = _core.__apex_Series;
const Fill = _core.__apex_Fill;
const Utils = _core.__apex_Utils;
function isHistogramOverlay(w) {
  var _a, _b, _c, _d, _e, _f, _g;
  if (((_b = (_a = w == null ? void 0 : w.config) == null ? void 0 : _a.chart) == null ? void 0 : _b.requestedType) !== "histogram") return false;
  if (((_d = (_c = w.config.plotOptions) == null ? void 0 : _c.histogram) == null ? void 0 : _d.overlap) === false) return false;
  return ((_g = (_f = (_e = w.seriesData) == null ? void 0 : _e.series) == null ? void 0 : _f.length) != null ? _g : 0) > 1;
}
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
  }
  /**
   * The x-span that one bar slot covers, in DATA units, on a numeric or
   * datetime axis. Returns 0 when it cannot be resolved, which leaves the
   * caller on its category-style fallback.
   *
   * `w.globals.minXDiff` cannot serve here on its own, for two reasons:
   *
   *  - It is the smallest gap WITHIN a series, minimised over series, so it
   *    never sees the gaps BETWEEN two series' x values. Series A on the 1st
   *    and the 4th plus series B on the 2nd gives minXDiff = 3 days while the
   *    axis really has a 1 day gap, and every bar is drawn 3 days wide, so
   *    neighbours overlap (#4885).
   *  - With one data point there are no gaps to measure at all and it is set
   *    to a 0.5 sentinel, so the slot fell back to the whole grid width and a
   *    single bar covered most of the chart. Range._handleSingleDataPoint pads
   *    the axis by ±2 units around a lone point (2 days for datetime, 2 for
   *    numeric), so one unit is a quarter of the resulting span.
   *
   * Cached: the merge below is O(points × series) and every series in a draw
   * pass asks the same question.
   *
   * @returns {number}
   */
  barSlotXSpan() {
    const w = this.w;
    if (this._slotXSpan !== void 0) return this._slotXSpan;
    let slot = 0;
    if (w.globals.dataPoints <= 1) {
      const span = w.globals.maxX - w.globals.minX;
      slot = span > 0 ? span / 4 : 0;
    } else {
      slot = this._unionMinXGap();
      if (!(slot > 0) || !isFinite(slot)) {
        const min = w.globals.minXDiff;
        slot = min > 0 && isFinite(min) && min !== 0.5 ? min : 0;
      }
    }
    this._slotXSpan = slot;
    return slot;
  }
  /**
   * Smallest positive gap between neighbouring x values once every series is
   * merged onto one axis. A k-way merge over the series arrays, which are
   * already sorted in every ordinary case; an unsorted one can only make the
   * answer smaller, i.e. the bars narrower, never overlapping.
   *
   * Collapsed series count too, exactly as they did for `minXDiff`. Skipping
   * them would widen every bar the moment someone hid the tightest-spaced
   * series from the legend, so bar geometry would depend on legend state.
   *
   * @returns {number}
   */
  _unionMinXGap() {
    const w = this.w;
    const seriesX = w.seriesData.seriesX || [];
    const arrays = [];
    for (let i = 0; i < seriesX.length; i++) {
      const xs = seriesX[i];
      if (Array.isArray(xs) && xs.length > 0) arrays.push(xs);
    }
    if (!arrays.length) return 0;
    const cursor = new Array(arrays.length).fill(0);
    let prev = NaN;
    let min = Infinity;
    for (; ; ) {
      let next = Infinity;
      let from = -1;
      for (let k = 0; k < arrays.length; k++) {
        const xs = arrays[k];
        while (cursor[k] < xs.length && typeof xs[cursor[k]] !== "number") {
          cursor[k]++;
        }
        if (cursor[k] >= xs.length) continue;
        const v = xs[cursor[k]];
        if (v !== v) {
          cursor[k]++;
          k--;
          continue;
        }
        if (v < next) {
          next = v;
          from = k;
        }
      }
      if (from === -1) break;
      cursor[from]++;
      if (prev === prev) {
        const d = next - prev;
        if (d > 0 && d < min) min = d;
      }
      prev = next;
    }
    return isFinite(min) ? min : 0;
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
    if (w.config.plotOptions.bar.rangeBarGroupRows || isHistogramOverlay(w)) {
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
        const slotXSpan = this.barSlotXSpan();
        if (slotXSpan > 0 && slotXSpan / xRatio > 0) {
          xDivision = slotXSpan / xRatio;
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
    var _a;
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
    const connectorFill = this.getDumbbellConnectorFill(i, j);
    const datumFill = connectorFill || ((_a = w.config.series[i].data[j]) == null ? void 0 : _a.fill);
    const connector = this.barCtx.barOptions.isDumbbell ? w.config.plotOptions.bar.dumbbell.connector : null;
    let connectorOpacity;
    if (connector && connector.color) {
      fillColor = connector.color;
      connectorOpacity = connector.opacity;
    }
    const pathFill = fill.fillPath({
      seriesNumber: this.barCtx.barOptions.distributed ? seriesNumber : realIndex,
      dataPointIndex: j,
      color: fillColor,
      opacity: connectorOpacity,
      value: series[i][j],
      fillConfig: datumFill,
      fillType: (datumFill == null ? void 0 : datumFill.type) ? datumFill.type : Array.isArray(w.config.fill.type) ? w.config.fill.type[realIndex] : w.config.fill.type
    });
    return {
      color: pathFill,
      useRangeColor
    };
  }
  /**
   * The connector's fill for one dumbbell row, or null to leave the fill alone.
   *
   * Returns a gradient running from the colour of the measure at the low end to
   * the colour of the measure at the high end, which is the pair of dots the
   * connector is between. `w.dumbbellData.order` is what makes it per-row: the
   * merged interval is emitted low-to-high and no longer knows which measure
   * was which, so a chart-wide gradient would point the wrong way on any row
   * where the two cross.
   *
   * A user-set `connector.color` means a plain connector, and the `[lo, hi]`
   * form names no measures to take colours from; both leave the fill alone.
   *
   * @param {number} i @param {number} j
   * @returns {Record<string, any>|null}
   */
  getDumbbellConnectorFill(i, j) {
    const w = this.w;
    if (!this.barCtx.barOptions.isDumbbell) return null;
    const dumbbell = w.dumbbellData;
    if (!dumbbell || dumbbell.form !== "series") return null;
    const connector = w.config.plotOptions.bar.dumbbell.connector;
    if (connector.color) return null;
    const order = dumbbell.order[j];
    if (!order) return null;
    const from = w.globals.colors[order[0]];
    const to = w.globals.colors[order[1]];
    if (!from || !to) return null;
    return {
      type: "gradient",
      gradient: {
        // Along the connector: the value axis is x when the rows are
        // horizontal, y when they are columns.
        type: this.barCtx.isHorizontal ? "horizontal" : "vertical",
        gradientFrom: from,
        gradientTo: to,
        opacityFrom: connector.opacity,
        opacityTo: connector.opacity,
        stops: [0, 100],
        // A column's y runs down the screen, so its low end is at the BOTTOM
        // and the gradient has to be read the other way round to still start
        // at the low end's colour.
        inverseColors: !this.barCtx.isHorizontal
      }
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
   * Series indices bucketed into the stacks they actually draw in: one bucket
   * per series group, or a single bucket holding every series when the chart is
   * not grouped. Order within a bucket follows series order, which is stacking
   * order.
   *
   * @param {number} numSeries
   * @returns {number[][]}
   */
  getStackedSeriesIndices(numSeries) {
    const groups = this.w.labelData.seriesGroups;
    if (!groups || groups.length < 2) {
      return [Array.from({ length: numSeries }, (_, i) => i)];
    }
    const buckets = Array.from({ length: groups.length }, () => []);
    const ungrouped = [];
    for (let i = 0; i < numSeries; i++) {
      const g = this.getSeriesGroupIndex(i);
      if (g > -1) buckets[g].push(i);
      else ungrouped.push(i);
    }
    if (ungrouped.length) buckets.push(ungrouped);
    return buckets.filter((b) => b.length > 0);
  }
  /**
   * Which corners each bar rounds, as a [seriesIndex][dataPointIndex] grid of
   * 'top' | 'bottom' | 'both' | 'none'.
   *
   * A rounded corner belongs to the OUTSIDE of a stack, so this resolves, per
   * data point, the outermost segment on each side of the baseline; everything
   * sandwiched between them stays square.
   *
   * Crucially a "stack" is a series GROUP, not the whole chart. A grouped
   * stacked chart draws one independent stack per group, side by side, and each
   * one needs its own outermost segments. Resolving chart-wide instead put the
   * radius on the bottom of the first group's lowest series and the top of the
   * last group's highest, leaving every stack in between completely square, 
   * which is exactly how it looked: the first column rounded at the bottom, the
   * second at the top, and nothing else touched. Stacked totals already resolve
   * per group (see drawsStackedTotal, #4173); corners never got the same fix.
   *
   * @param {any[]} series
   * @returns {string[][]}
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
    const isSoloHorizontal = this.w.config.chart.type === "bar" && numColumns === 1;
    const soloCorner = isSoloHorizontal ? "top" : "both";
    const baseCorner = isSoloHorizontal ? "top" : "bottom";
    for (const stack of this.getStackedSeriesIndices(numSeries)) {
      for (let j = 0; j < numColumns; j++) {
        const positiveIndices = [];
        const negativeIndices = [];
        for (const i of stack) {
          const value = series[i][j];
          if (value > 0) positiveIndices.push(i);
          else if (value < 0) negativeIndices.push(i);
        }
        if (positiveIndices.length > 0 && negativeIndices.length === 0) {
          if (positiveIndices.length === 1) {
            output[positiveIndices[0]][j] = soloCorner;
          } else {
            const first = positiveIndices[0];
            const last = positiveIndices[positiveIndices.length - 1];
            for (const i of positiveIndices) {
              output[i][j] = i === first ? baseCorner : i === last ? "top" : "none";
            }
          }
        } else if (negativeIndices.length > 0 && positiveIndices.length === 0) {
          if (negativeIndices.length === 1) {
            output[negativeIndices[0]][j] = "both";
          } else {
            const highest = Math.max(...negativeIndices);
            const lowest = Math.min(...negativeIndices);
            for (const i of negativeIndices) {
              output[i][j] = i === highest ? "bottom" : i === lowest ? "top" : "none";
            }
          }
        } else if (positiveIndices.length > 0 && negativeIndices.length > 0) {
          const lastPositive = positiveIndices[positiveIndices.length - 1];
          for (const i of positiveIndices) {
            output[i][j] = i === lastPositive ? "top" : "none";
          }
          const highestNegative = Math.max(...negativeIndices);
          for (const i of negativeIndices) {
            output[i][j] = i === highestNegative ? "bottom" : "none";
          }
        }
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
    const squarePathTo = graphics.move(x1, y1) + graphics.line(x1, y2) + graphics.line(x2, y2) + sl + closing;
    let pathTo = squarePathTo;
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
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo);
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
      pathFrom,
      // The box the path was built from, AFTER the stroke centering and the
      // anti-exponential nudge above. Anything that has to line up with a drawn
      // bar (the waterfall connectors) reads this rather than recomputing the
      // edges, which is how it stays exact when a stroke width is set.
      // `y1` is the lower value's edge and `y2` the upper one's.
      drawnBox: { x1, x2, y1, y2 }
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
    const squarePathTo = graphics.move(x1, y1) + graphics.line(x2, y1) + graphics.line(x2, y2) + sl + closing;
    let pathTo = squarePathTo;
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
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo);
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
      pathFrom,
      // See getColumnPaths. Here `x1` is the start value's edge and `x2` the
      // end value's, because a horizontal bar's two ends arrive unsorted.
      drawnBox: { x1, x2, y1, y2 }
    };
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
    if (this.barCtx.barOptions.isDumbbell) {
      const ends = this.getDumbbellEnds(i, j);
      if (ends.length) {
        const commonAttrs = {
          strokeHeight: type === "x" ? 0 : w.globals.markers.size[i],
          strokeWidth: type === "x" ? w.globals.markers.size[i] : 0,
          strokeDashArray: 0,
          strokeLineCap: "round"
        };
        let lo = 0;
        let hi = 0;
        for (let e = 1; e < ends.length; e++) {
          if (ends[e].value < ends[lo].value) lo = e;
          if (ends[e].value > ends[hi].value) hi = e;
        }
        const labelsCnf = w.config.plotOptions.bar.dumbbell.dataLabels;
        ends.forEach((end, e) => {
          const attrs = __spreadProps(__spreadValues({}, commonAttrs), { strokeColor: end.color });
          if (labelsCnf.enabled && (e === lo || e === hi)) {
            attrs.label = {
              text: this.getDumbbellLabelText(end.value, i, j, end.index),
              color: labelsCnf.colorFromMarker ? end.color : Array.isArray(labelsCnf.style.colors) ? labelsCnf.style.colors[end.index] || labelsCnf.style.colors[0] : labelsCnf.style.colors,
              // Away from the connector: the low end reads to its left (below,
              // on a column), the high end to its right. A lone endpoint has no
              // connector to be clear of, so it takes the outward side.
              outward: e === lo && lo !== hi ? -1 : 1
            };
          }
          pushGoal(end.value, attrs);
        });
      }
    }
    return goals;
  }
  /**
   * The marked ends of one dumbbell row: a value and the colour that says which
   * measure it belongs to.
   *
   * `chart.type: 'dumbbell'` merged N measures into one interval and left the
   * endpoint identities on `w.dumbbellData`, so an end is coloured after the
   * SERIES it came from. A row where the two measures cross therefore keeps its
   * colours, which the interval alone could not say: it is emitted low-to-high
   * and has forgotten which end was which.
   *
   * The `y: [lo, hi]` form names no measures, so it keeps the positional
   * `dumbbellColors` pathway: colour 0 for the start, colour 1 for the end.
   *
   * @param {number} i @param {number} j
   * @returns {Array<{ value: number, color: string, index: number }>}
   */
  getDumbbellEnds(i, j) {
    const w = this.w;
    const ends = [];
    const dumbbell = w.dumbbellData;
    if (dumbbell && dumbbell.form === "series") {
      const values = dumbbell.values[j] || [];
      for (let k = 0; k < values.length; k++) {
        const v = values[k];
        if (v === null || dumbbell.hidden.indexOf(k) !== -1) continue;
        ends.push({ value: v, color: w.globals.colors[k], index: k });
      }
      return ends;
    }
    if (!w.rangeData.seriesRange.length) return ends;
    const colors = this.barCtx.barOptions.dumbbellColors ? this.barCtx.barOptions.dumbbellColors : w.globals.colors;
    const pick = (n) => Array.isArray(colors[i]) ? colors[i][n] : colors[i];
    return [
      { value: w.rangeData.seriesRangeStart[i][j], color: pick(0), index: 0 },
      { value: w.rangeData.seriesRangeEnd[i][j], color: pick(1), index: 1 }
    ];
  }
  /**
   * The text for one end label.
   *
   * Deliberately NOT `dataLabels.formatter`: on a range bar that one reads out
   * `end - start`, so an endpoint run through it would print the gap twice and
   * the values never. The value-axis formatter is the one that already knows
   * these numbers are percentages, or dollars, or dates.
   *
   * @param {number} value @param {number} i @param {number} j @param {number} k
   * @returns {string}
   */
  getDumbbellLabelText(value, i, j, k) {
    const w = this.w;
    const cnf = w.config.plotOptions.bar.dumbbell.dataLabels;
    if (typeof cnf.formatter === "function") {
      return cnf.formatter(value, {
        seriesIndex: i,
        dataPointIndex: j,
        endpointIndex: k,
        w
      });
    }
    const axisFormatter = this.barCtx.isHorizontal ? w.formatters.xLabelFormatter : w.formatters.yLabelFormatters[0];
    if (typeof axisFormatter === "function") {
      return axisFormatter(value, j, w);
    }
    return String(value);
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
      class: "apexcharts-bar-goals-groups"
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
            if (goal.attrs.label) {
              lineGroup.add(
                this.drawDumbbellLabel(goal.attrs, {
                  x: goal.x,
                  y: y - sHeight,
                  horizontal: true,
                  markerSize: goal.attrs.strokeWidth || 0
                })
              );
            }
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
            if (goal.attrs.label) {
              lineGroup.add(
                this.drawDumbbellLabel(goal.attrs, {
                  x: x - sWidth,
                  y: goal.y,
                  horizontal: false,
                  markerSize: goal.attrs.strokeHeight || 0
                })
              );
            }
          }
        });
      }
    }
    return lineGroup;
  }
  /**
   * One dumbbell end label, placed clear of the marker it belongs to.
   *
   * Offset from the marker's EDGE rather than its centre, so growing
   * `markers.size` never walks a label under its own dot. Vertically it is
   * centred on the marker with `dominant-baseline`, which is exact whatever the
   * font metrics are, where a dy fudge factor drifts with font size.
   *
   * @param {Record<string, any>} attrs the goal's attrs, carrying `label`
   * @param {{x: number, y: number, horizontal: boolean, markerSize: number}} pos
   */
  drawDumbbellLabel(attrs, pos) {
    const w = this.w;
    const graphics = new Graphics(w);
    const cnf = w.config.plotOptions.bar.dumbbell.dataLabels;
    const gap = pos.markerSize / 2 + cnf.offset;
    const away = attrs.label.outward;
    return graphics.drawText({
      x: pos.x + (pos.horizontal ? gap * away : 0),
      y: pos.y - (pos.horizontal ? 0 : gap * away),
      text: attrs.label.text,
      textAnchor: pos.horizontal ? away < 0 ? "end" : "start" : "middle",
      dominantBaseline: pos.horizontal ? "central" : away < 0 ? "hanging" : "auto",
      foreColor: attrs.label.color,
      fontSize: cnf.style.fontSize,
      fontFamily: cnf.style.fontFamily,
      fontWeight: cnf.style.fontWeight,
      cssClass: "apexcharts-dumbbell-label"
    });
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
   * Index of the series group `seriesIndex` belongs to within
   * `w.labelData.seriesGroups`, or -1 when the chart has no groups.
   *
   * Unlike `getGroupIndex` this is a pure lookup: it never appends to
   * `columnGroupIndices`, so it is safe to call from positioning/label code
   * that must not perturb the draw order bookkeeping.
   * @param {number} seriesIndex
   * @returns {number}
   */
  getSeriesGroupIndex(seriesIndex) {
    const w = this.w;
    return w.labelData.seriesGroups.findIndex(
      (group) => group.indexOf(w.seriesData.seriesNames[seriesIndex]) > -1
    );
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
const CoreUtils = _core.__apex_CoreUtils;
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
    this._pathToInterp = null;
    this.series = [];
    this.elSeries = null;
    this.visibleI = 0;
    this.isReversed = false;
    const ser = new Series(this.w);
    this.lastActiveBarSerieIndex = ser.getActiveConfigSeriesIndex("desc", [
      "bar",
      "column"
    ]);
    this.lastActiveBarSerieIndexByGroup = ser.getActiveConfigSeriesIndexByGroup(["bar", "column"]);
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
    var _a, _b, _c, _d, _e, _f, _g;
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const emit = seriesEmitter(this.ctx, graphics);
    let skipDrawing = false;
    const pathToInterp = this._pathToInterp;
    this._pathToInterp = null;
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
    const animCfg = w.config.chart.animations;
    const gradCfg = animCfg.animateGradually;
    const staggerEnabled = gradCfg && gradCfg.enabled !== false && !(w.globals.dataChanged && this.isLayoutShift(realIndex));
    let delay = 0;
    let delayMs = 0;
    if (staggerEnabled) {
      const totalBars = w.globals.dataPoints || 1;
      const configStep = gradCfg.delay || 0;
      const baseDelayMs = Math.min(
        configStep,
        animCfg.speed * 0.5 / Math.max(1, totalBars)
      );
      delayMs = computeStagger({
        style: "sequential",
        index: j,
        baseDelay: baseDelayMs
      });
      if (w.config.chart.stacked && !w.globals.dataChanged) {
        delayMs += i * baseDelayMs * 0.5;
      }
      const delayFactor = configStep || 1;
      delay = delayMs / delayFactor;
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
    if (delayMs > 0) {
      const dlAnimCfg = w.config.dataLabels;
      if (((_a = dlAnimCfg.animate) == null ? void 0 : _a.enabled) || ((_b = dlAnimCfg.countUp) == null ? void 0 : _b.enabled)) {
        const stampDelay = String(Math.round(delayMs));
        (_d = (_c = dataLabelsObj.dataLabels) == null ? void 0 : _c.node) == null ? void 0 : _d.setAttribute("data:dlDelay", stampDelay);
        (_f = (_e = dataLabelsObj.totalDataLabels) == null ? void 0 : _e.node) == null ? void 0 : _f.setAttribute(
          "data:dlDelay",
          stampDelay
        );
      }
    }
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
    if (this.isNullValue && w.globals.collapsingSeriesIndices.indexOf(realIndex) === -1) {
      pathFill = "none";
    }
    if (!skipDrawing) {
      const morphActive = ((_g = this.ctx.morphTypeChange) == null ? void 0 : _g.isActive()) === true;
      const dataChangeSpeed = morphActive ? this.ctx.morphTypeChange.getSpeed() : w.config.chart.animations.dynamicAnimation.speed;
      const pieceClaimed = morphActive && this.ctx.morphTypeChange.claimsTargetMark(realIndex, j);
      if (pieceClaimed) {
        pathFrom = pathTo;
        delay = 0;
      }
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
          pathToInterp,
          animationDelay: delay,
          initialSpeed: w.config.chart.animations.speed,
          dataChangeSpeed,
          // `classes` is optional: boxPlot, violin and candlestick call
          // renderSeries without it, and interpolating it unguarded stamped a
          // literal "undefined" into every one of their marks' class lists.
          className: `apexcharts-${type}-area${classes ? ` ${classes}` : ""}`,
          chartType: type,
          bindEventsOnPaths: false
        })
      );
      renderedPath.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      if (pieceClaimed) {
        renderedPath.node.setAttribute("opacity", "0");
        renderedPath.node.setAttribute("data-piece-hidden", "1");
      }
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
        indexes.realIndex,
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
        realIndex,
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
      barXPosition: x + (isHistogramOverlay(w) ? 0 : barWidth * this.visibleI),
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
   * @param {string} [squarePathTo] - the same bar before roundPathCorners, i.e.
   *   its new slot with square corners. Supplied by the stacked builders so a
   *   bar gaining a corner can travel square and round only on arrival.
   * @returns {string | null}
   **/
  getPreviousPath(realIndex, j, pathTo, squarePathTo) {
    const w = this.w;
    this._pathToInterp = null;
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
    if (oldD) {
      const fromCount = Bar.pathCommandCount(oldD);
      const toCount = Bar.pathCommandCount(pathTo);
      if (fromCount === toCount) {
        return oldD;
      }
      const graphics = new Graphics(w);
      const extentOf = (d) => {
        const box = Bar.pathBox(d);
        return box ? Math.min(box.maxX - box.minX, box.maxY - box.minY) : 0;
      };
      const handingOver = fromCount < toCount ? extentOf(oldD) > 1 : extentOf(pathTo) > 1;
      if (fromCount < toCount) {
        const padded = graphics.roundPathCorners(oldD, 0);
        if (Bar.pathCommandCount(padded) === toCount) {
          if (handingOver && squarePathTo) {
            const squareTarget = graphics.roundPathCorners(squarePathTo, 0);
            if (Bar.pathCommandCount(squareTarget) === toCount) {
              this._pathToInterp = squareTarget;
            }
          }
          return padded;
        }
      } else {
        const padded = graphics.roundPathCorners(pathTo, 0);
        if (Bar.pathCommandCount(padded) === fromCount) {
          this._pathToInterp = padded;
          if (handingOver) {
            const square = Bar.squareLike(oldD);
            const squareStart = square ? graphics.roundPathCorners(square, 0) : null;
            if (squareStart && Bar.pathCommandCount(squareStart) === fromCount) {
              return squareStart;
            }
          }
          return oldD;
        }
      }
    }
    if (isNewDatum && lengthTransitionEnabled(w)) {
      return null;
    }
    return pathTo;
  }
  /**
   * The axis-aligned box a bar path occupies, and the point it starts from.
   *
   * @param {string} d
   * @returns {{minX: number, maxX: number, minY: number, maxY: number, start: [number, number], vertical: boolean} | null}
   */
  static pathBox(d) {
    if (!d) return null;
    const pts = [];
    const re = /([MLC])([^MLCZz]*)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
      const nums = m[2].trim().split(/[\s,]+/).map(Number);
      if (nums.length < 2 || nums.some(isNaN)) continue;
      pts.push([nums[nums.length - 2], nums[nums.length - 1]]);
    }
    if (pts.length < 3) return null;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
      start: pts[0],
      // Column bars run their first leg down a vertical edge, horizontal bars
      // run it along a horizontal one. Rounding moves the start point ALONG
      // that leg, so the axis it does not move on is the one it shares.
      vertical: Math.abs(pts[1][0] - pts[0][0]) < Math.abs(pts[1][1] - pts[0][1])
    };
  }
  /**
   * Rebuild a bar path as the plain rectangle it was rounded from, same box,
   * same corner order, no radius.
   *
   * The corner the path starts at is the one nearest its start point, because
   * rounding only ever slides that point a radius along the first leg. Knowing
   * that corner and the winding is enough to re-emit the rect exactly as the
   * builders in common/bar/Helpers do, so the result pairs command-for-command
   * with anything built from them.
   *
   * @param {string} d
   * @returns {string | null}
   */
  static squareLike(d) {
    const box = Bar.pathBox(d);
    if (!box) return null;
    const { minX, maxX, minY, maxY, start, vertical } = box;
    const near = (v, a, b) => Math.abs(v - a) <= Math.abs(v - b) ? [a, b] : [b, a];
    let x1, x2, y1, y2;
    if (vertical) {
      x1 = Math.abs(start[0] - minX) <= Math.abs(start[0] - maxX) ? minX : maxX;
      x2 = x1 === minX ? maxX : minX;
      [y1, y2] = near(start[1], minY, maxY);
    } else {
      y1 = Math.abs(start[1] - minY) <= Math.abs(start[1] - maxY) ? minY : maxY;
      y2 = y1 === minY ? maxY : minY;
      [x1, x2] = near(start[0], minX, maxX);
    }
    const closing = d.trim().endsWith("Z") ? " Z" : " z";
    return vertical ? `M ${x1} ${y1} L ${x1} ${y2} L ${x2} ${y2} L ${x2} ${y1}${closing}` : `M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2} L ${x1} ${y2}${closing}`;
  }
  /**
   * Was this bar MIRRORED in the previous render? Stacked bars carry only
   * top-rounded geometry; a bottom radius is produced by the apexcharts-flip-y
   * (or -x, horizontal) class, so the mirror is the only record of where the
   * radius visually sat. Matched by datum key like getPreviousPath, falling
   * back to position when the previous render carries no keys.
   *
   * @param {number} realIndex
   * @param {number} j
   * @returns {boolean | null} null when there is no previous record to consult
   */
  getPreviousFlip(realIndex, j) {
    const w = this.w;
    const record = this._prevRecord(realIndex);
    if (!record) return null;
    const keyed = this._prevKeyedPaths(realIndex);
    const prev = keyed ? keyed.get(datumKey(w, realIndex, j)) : record.paths[j];
    return prev ? !!prev.flip : null;
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
class BarStacked extends Bar {
  /**
   * @param {any[]} series
   * @param {number} seriesIndex
   */
  draw(series, seriesIndex) {
    const w = this.w;
    this.graphics = new Graphics(this.w);
    this.bar = new Bar(this.w, this.ctx, this.xyRatios);
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    if (w.config.chart.stackType === "100%") {
      series = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex.map(
          (_) => w.globals.seriesPercent[_]
        )
      ) : w.globals.seriesPercent.slice();
    }
    this.series = series;
    this.barHelpers.initializeStackedPrevVars(this);
    const ret = this.graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    let x = 0;
    let y = 0;
    const anim = w.config.chart.animations;
    const holdMirror = anim.enabled && anim.dynamicAnimation.enabled && w.globals.previousPaths.length > 0;
    let heldMirrors = false;
    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      const realIndex = w.globals.comboCharts ? (
        /** @type {any} */
        seriesIndex[i]
      ) : i;
      const { groupIndex, columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      this.groupCtx = /** @type {any} */
      this[
        /** @type {any} */
        w.labelData.seriesGroups[groupIndex]
      ];
      const xArrValues = [];
      const yArrValues = [];
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = /** @type {any} */
        w.globals.seriesYAxisReverseMap[realIndex][0];
        translationsIndex = realIndex;
      }
      this.isReversed = w.config.yaxis[this.yaxisIndex] && w.config.yaxis[this.yaxisIndex].reversed;
      let elSeries = this.graphics.group({
        class: `apexcharts-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[realIndex]),
        rel: i + 1,
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, realIndex);
      const elDataLabelsWrap = this.graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      Series.addCollapsedClassToSeries(this.w, elDataLabelsWrap, realIndex);
      if ((w.globals.collapsingSeriesIndices || []).indexOf(realIndex) > -1) {
        elDataLabelsWrap.node.style.setProperty(
          "--apexcharts-dl-exit",
          `${w.config.chart.animations.dynamicAnimation.speed}ms`
        );
      }
      const elGoalsMarkers = this.graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      const initPositions = this.initialPositions(
        x,
        y,
        void 0,
        void 0,
        void 0,
        void 0,
        translationsIndex
      );
      const {
        xDivision,
        // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision,
        // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH,
        // zeroH is the baseline where 0 meets y axis
        zeroW
        // zeroW is the baseline where 0 meets x axis
      } = initPositions;
      let barHeight = initPositions.barHeight;
      let barWidth = initPositions.barWidth;
      y = initPositions.y;
      x = initPositions.x;
      w.globals.barHeight = barHeight;
      w.globals.barWidth = barWidth;
      this.barHelpers.initializeStackedXYVars(this);
      if (this.groupCtx.prevY.length === 1 && /**
       * @param {number} val
       */
      this.groupCtx.prevY[0].every((val) => isNaN(val))) {
        this.groupCtx.prevY[0] = this.groupCtx.prevY[0].map(() => zeroH);
        this.groupCtx.prevYF[0] = this.groupCtx.prevYF[0].map(() => 0);
      }
      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        const commonPathOpts = {
          indexes: { i, j, realIndex, translationsIndex, bc },
          strokeWidth,
          x,
          y,
          elSeries,
          columnGroupIndex,
          seriesGroup: w.labelData.seriesGroups[groupIndex]
        };
        let paths = (
          /** @type {any} */
          null
        );
        if (this.isHorizontal) {
          paths = this.drawStackedBarPaths(__spreadProps(__spreadValues({}, commonPathOpts), {
            zeroW,
            barHeight,
            yDivision
          }));
          barWidth = this.series[i][j] / this.invertedYRatio;
        } else {
          paths = this.drawStackedColumnPaths(__spreadProps(__spreadValues({}, commonPathOpts), {
            xDivision,
            barWidth,
            zeroH
          }));
          barHeight = this.series[i][j] / this.yRatio[translationsIndex];
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
        y = paths.y;
        x = paths.x;
        xArrValues.push(x);
        yArrValues.push(y);
        const pathFill = this.barHelpers.getPathFillColor(
          series,
          i,
          j,
          realIndex
        );
        let classes = "";
        const flipClass = w.globals.isBarHorizontal ? "apexcharts-flip-x" : "apexcharts-flip-y";
        const wantsFlip = this.barHelpers.arrBorderRadius[realIndex][j] === "bottom" && w.seriesData.series[realIndex][j] > 0 || this.barHelpers.arrBorderRadius[realIndex][j] === "top" && w.seriesData.series[realIndex][j] < 0;
        const heldFlip = holdMirror && !wantsFlip && this.getPreviousFlip(realIndex, j);
        if (wantsFlip || heldFlip) {
          classes = flipClass;
        }
        if (heldFlip) {
          classes += " apexcharts-flip-held";
          heldMirrors = true;
        }
        elSeries = this.renderSeries(__spreadProps(__spreadValues({
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
          barHeight,
          barWidth,
          elDataLabelsWrap,
          elGoalsMarkers,
          type: "bar",
          visibleSeries: columnGroupIndex,
          classes
        }));
      }
      w.globals.seriesXvalues[realIndex] = xArrValues;
      w.globals.seriesYvalues[realIndex] = yArrValues;
      this.groupCtx.prevY.push(this.groupCtx.yArrj);
      this.groupCtx.prevYF.push(this.groupCtx.yArrjF);
      this.groupCtx.prevYVal.push(this.groupCtx.yArrjVal);
      this.groupCtx.prevX.push(this.groupCtx.xArrj);
      this.groupCtx.prevXF.push(this.groupCtx.xArrjF);
      this.groupCtx.prevXVal.push(this.groupCtx.xArrjVal);
      ret.add(elSeries);
    }
    if (heldMirrors) this.settleHeldMirrors();
    return ret;
  }
  /**
   * Drop the mirrors held across an animated update once the geometry they
   * were covering for has arrived. A no-op for every state except
   * 'bottom' → 'top', where the endpoint really is rounded at the other end;
   * everywhere else the mirror is an exact identity on the settled shape, so
   * removing it changes nothing on screen.
   */
  settleHeldMirrors() {
    const w = this.w;
    if (!Environment.isBrowser()) return;
    const anim = w.config.chart.animations;
    const hold = (anim.dynamicAnimation.speed || 0) + (anim.speed || 0) + 100;
    setTimeout(() => {
      if (w.globals.isDestroyed || !Utils.elementExists(w.dom.baseEl)) return;
      w.dom.baseEl.querySelectorAll(".apexcharts-flip-held").forEach((el) => {
        el.classList.remove(
          "apexcharts-flip-held",
          "apexcharts-flip-y",
          "apexcharts-flip-x"
        );
      });
    }, hold);
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number | undefined} xDivision
   * @param {number | undefined} yDivision
   * @param {number | undefined} zeroH
   * @param {number | undefined} zeroW
   * @param {number} translationsIndex
   */
  initialPositions(x, y, xDivision, yDivision, zeroH, zeroW, translationsIndex) {
    const w = this.w;
    let barHeight, barWidth;
    if (this.isHorizontal) {
      yDivision = w.layout.gridHeight / w.globals.dataPoints;
      const userBarHeight = w.config.plotOptions.bar.barHeight;
      if (String(userBarHeight).indexOf("%") === -1) {
        barHeight = parseInt(userBarHeight, 10);
      } else {
        barHeight = yDivision * parseInt(userBarHeight, 10) / 100;
      }
      zeroW = w.globals.padHorizontal + (this.isReversed ? w.layout.gridWidth - this.baseLineInvertedY : this.baseLineInvertedY);
      y = (yDivision - barHeight) / 2;
    } else {
      xDivision = w.layout.gridWidth / w.globals.dataPoints;
      barWidth = xDivision;
      const userColumnWidth = w.config.plotOptions.bar.columnWidth;
      const slotXSpan = w.axisFlags.isXNumeric ? this.barHelpers.barSlotXSpan() : 0;
      if (slotXSpan > 0) {
        xDivision = slotXSpan / this.xRatio;
        barWidth = xDivision * parseInt(this.barOptions.columnWidth, 10) / 100;
      } else {
        barWidth *= parseInt(userColumnWidth, 10) / 100;
      }
      if (String(userColumnWidth).indexOf("%") === -1) {
        barWidth = parseInt(userColumnWidth, 10);
      }
      if (this.isReversed) {
        zeroH = this.baseLineY[translationsIndex];
      } else {
        zeroH = w.layout.gridHeight - this.baseLineY[translationsIndex];
      }
      x = w.globals.padHorizontal + (xDivision - barWidth) / 2;
    }
    const subDivisions = w.globals.barGroups.length || 1;
    return {
      x,
      y,
      yDivision,
      xDivision,
      barHeight: (barHeight != null ? barHeight : 0) / subDivisions,
      barWidth: (barWidth != null ? barWidth : 0) / subDivisions,
      zeroH,
      zeroW
    };
  }
  /** @param {{indexes: any, barHeight: any, strokeWidth: any, zeroW: any, x: any, y: any, columnGroupIndex: any, seriesGroup: any, yDivision: any, elSeries: any}} opts */
  drawStackedBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    columnGroupIndex,
    seriesGroup,
    yDivision,
    elSeries
  }) {
    var _a, _b, _c, _d, _e;
    const w = this.w;
    const barYPosition = y + columnGroupIndex * barHeight;
    let barXPosition;
    const i = indexes.i;
    const j = indexes.j;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    let prevBarW = 0;
    for (let k = 0; k < this.groupCtx.prevXF.length; k++) {
      prevBarW = prevBarW + this.groupCtx.prevXF[k][j];
    }
    let gsi = i;
    if (
      /** @type {Record<string,any>} */
      w.config.series[realIndex].name
    ) {
      gsi = seriesGroup.indexOf(
        /** @type {Record<string,any>} */
        w.config.series[realIndex].name
      );
    }
    if (gsi > 0) {
      let bXP = zeroW;
      if (this.groupCtx.prevXVal[gsi - 1][j] < 0) {
        bXP = /** @type {any} */
        ((_a = this.series[i]) == null ? void 0 : _a[j]) >= 0 ? this.groupCtx.prevX[gsi - 1][j] + prevBarW - (this.isReversed ? prevBarW : 0) * 2 : this.groupCtx.prevX[gsi - 1][j];
      } else if (this.groupCtx.prevXVal[gsi - 1][j] >= 0) {
        bXP = /** @type {any} */
        ((_b = this.series[i]) == null ? void 0 : _b[j]) >= 0 ? this.groupCtx.prevX[gsi - 1][j] : this.groupCtx.prevX[gsi - 1][j] - prevBarW + (this.isReversed ? prevBarW : 0) * 2;
      }
      barXPosition = bXP;
    } else {
      barXPosition = zeroW;
    }
    if (
      /** @type {any} */
      ((_c = this.series[i]) == null ? void 0 : _c[j]) === null
    ) {
      x = barXPosition;
    } else {
      x = barXPosition + /** @type {any} */
      ((_d = this.series[i]) == null ? void 0 : _d[j]) / this.invertedYRatio - (this.isReversed ? (
        /** @type {any} */
        ((_e = this.series[i]) == null ? void 0 : _e[j]) / this.invertedYRatio
      ) : 0) * 2;
    }
    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1: barXPosition,
      x2: x,
      strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      seriesGroup,
      i,
      j,
      w
    });
    this.barHelpers.barBackground({
      j,
      i,
      y1: barYPosition,
      y2: barHeight,
      elSeries
    });
    y = y + yDivision;
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalX: this.barHelpers.getGoalValues(
        "x",
        zeroW,
        /** @type {any} */
        null,
        realIndex,
        j,
        translationsIndex
      ),
      barXPosition,
      barYPosition,
      x,
      y
    };
  }
  /** @param {{indexes: any, x: any, y: any, xDivision: any, barWidth: any, zeroH: any, columnGroupIndex: any, seriesGroup: any, elSeries: any}} opts */
  drawStackedColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    columnGroupIndex,
    seriesGroup,
    elSeries
  }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const w = this.w;
    const i = indexes.i;
    const j = indexes.j;
    const bc = indexes.bc;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    if (w.axisFlags.isXNumeric) {
      let seriesVal = w.seriesData.seriesX[realIndex][j];
      if (!seriesVal) seriesVal = 0;
      x = (seriesVal - w.globals.minX) / this.xRatio - barWidth / 2 * w.globals.barGroups.length;
    }
    const barXPosition = x + columnGroupIndex * barWidth;
    let barYPosition;
    let prevBarH = 0;
    for (let k = 0; k < this.groupCtx.prevYF.length; k++) {
      prevBarH = prevBarH + (!isNaN(this.groupCtx.prevYF[k][j]) ? this.groupCtx.prevYF[k][j] : 0);
    }
    let gsi = i;
    if (seriesGroup) {
      gsi = seriesGroup.indexOf(w.seriesData.seriesNames[realIndex]);
    }
    if (gsi > 0 && !w.axisFlags.isXNumeric || gsi > 0 && w.axisFlags.isXNumeric && w.seriesData.seriesX[realIndex - 1][j] === w.seriesData.seriesX[realIndex][j]) {
      let bYP;
      let prevYValue;
      const p = Math.min(this.yRatio.length + 1, realIndex + 1);
      if (this.groupCtx.prevY[gsi - 1] !== void 0 && this.groupCtx.prevY[gsi - 1].length) {
        for (let ii = 1; ii < p; ii++) {
          if (!isNaN((_a = this.groupCtx.prevY[gsi - ii]) == null ? void 0 : _a[j])) {
            prevYValue = this.groupCtx.prevY[gsi - ii][j];
            break;
          }
        }
      }
      for (let ii = 1; ii < p; ii++) {
        if (((_b = this.groupCtx.prevYVal[gsi - ii]) == null ? void 0 : _b[j]) < 0) {
          bYP = /** @type {any} */
          ((_c = this.series[i]) == null ? void 0 : _c[j]) >= 0 ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2 : prevYValue;
          break;
        } else if (((_d = this.groupCtx.prevYVal[gsi - ii]) == null ? void 0 : _d[j]) >= 0) {
          bYP = /** @type {any} */
          ((_e = this.series[i]) == null ? void 0 : _e[j]) >= 0 ? prevYValue : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2;
          break;
        }
      }
      if (typeof bYP === "undefined") bYP = w.layout.gridHeight;
      if (
        /**
         * @param {number} val
         */
        ((_f = this.groupCtx.prevYF[0]) == null ? void 0 : _f.every((val) => val === 0)) && this.groupCtx.prevYF.slice(1, gsi).every(
          (arr) => arr.every((val) => isNaN(val))
        )
      ) {
        barYPosition = zeroH;
      } else {
        barYPosition = bYP;
      }
    } else {
      barYPosition = zeroH;
    }
    if (
      /** @type {any} */
      (_g = this.series[i]) == null ? void 0 : _g[j]
    ) {
      y = barYPosition - /** @type {any} */
      ((_h = this.series[i]) == null ? void 0 : _h[j]) / this.yRatio[translationsIndex] + (this.isReversed ? (
        /** @type {any} */
        ((_i = this.series[i]) == null ? void 0 : _i[j]) / this.yRatio[translationsIndex]
      ) : 0) * 2;
    } else {
      y = barYPosition;
    }
    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1: barYPosition,
      y2: y,
      yRatio: this.yRatio[translationsIndex],
      strokeWidth: this.strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      seriesGroup,
      realIndex: indexes.realIndex,
      i,
      j,
      w
    });
    this.barHelpers.barBackground({
      bc,
      j,
      i,
      x1: barXPosition,
      x2: barWidth,
      elSeries
    });
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      goalY: this.barHelpers.getGoalValues(
        "y",
        /** @type {any} */
        null,
        zeroH,
        realIndex,
        j,
        0
      ),
      barXPosition,
      x: w.axisFlags.isXNumeric ? x : x + xDivision,
      y
    };
  }
}
class RangeBar extends Bar {
  /**
   * @param {any[]} series
   * @param {number} seriesIndex
   */
  draw(series, seriesIndex) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i;
    const w = this.w;
    const graphics = new Graphics(this.w);
    this.rangeBarOptions = this.w.config.plotOptions.rangeBar;
    this.series = series;
    this.seriesRangeStart = w.rangeData.seriesRangeStart;
    this.seriesRangeEnd = w.rangeData.seriesRangeEnd;
    this.barHelpers.initVariables(series);
    const ret = graphics.group({
      class: "apexcharts-rangebar-series apexcharts-plot-series"
    });
    for (let i = 0; i < series.length; i++) {
      let x, y;
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
        zeroW,
        // zeroW is the baseline where 0 meets x axis
        x: initX,
        zeroH
        // zeroH is the baseline where 0 meets y axis
      } = initPositions;
      let barWidth = (_a = initPositions.barWidth) != null ? _a : 0;
      let barHeight = (_b = initPositions.barHeight) != null ? _b : 0;
      const yDivision = (_c = initPositions.yDivision) != null ? _c : 0;
      const xDivision = (_d = initPositions.xDivision) != null ? _d : 0;
      y = initY;
      x = initX;
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-rangebar-goals-markers"
      });
      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        const y1 = this.seriesRangeStart[i][j];
        const y2 = this.seriesRangeEnd[i][j];
        let paths = (
          /** @type {any} */
          null
        );
        let barXPosition = null;
        let barYPosition = null;
        const params = { x, y, strokeWidth, elSeries };
        let seriesLen = this.seriesLen;
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          seriesLen = 1;
        }
        if (typeof /** @type {Record<string,any>} */
        ((_e = w.config.series[i].data) == null ? void 0 : _e[j]) === "undefined") {
          break;
        }
        if (this.isHorizontal) {
          barYPosition = y + barHeight * /** @type {any} */
          this.visibleI;
          const srty = (yDivision - barHeight * seriesLen) / 2;
          if (
            /** @type {Record<string,any>} */
            (_g = (_f = w.config.series[i].data) == null ? void 0 : _f[j]) == null ? void 0 : _g.x
          ) {
            const positions = this.detectOverlappingBars({
              i,
              j,
              barYPosition,
              srty,
              barHeight,
              yDivision,
              initPositions
            });
            barHeight = positions.barHeight;
            barYPosition = positions.barYPosition;
          }
          paths = this.drawRangeBarPaths(__spreadValues({
            indexes: { i, j, realIndex },
            barHeight,
            barYPosition,
            zeroW,
            yDivision,
            y1,
            y2
          }, params));
          barWidth = paths.barWidth;
        } else {
          if (w.axisFlags.isXNumeric) {
            x = (w.seriesData.seriesX[i][j] - w.globals.minX) / this.xRatio - barWidth / 2;
          }
          barXPosition = x + barWidth * /** @type {any} */
          this.visibleI;
          const srtx = (xDivision - barWidth * seriesLen) / 2;
          if (
            /** @type {Record<string,any>} */
            (_i = (_h = w.config.series[i].data) == null ? void 0 : _h[j]) == null ? void 0 : _i.x
          ) {
            const positions = this.detectOverlappingBars({
              i,
              j,
              barXPosition,
              srtx,
              barWidth,
              xDivision,
              initPositions
            });
            barWidth = positions.barWidth;
            barXPosition = positions.barXPosition;
          }
          paths = this.drawRangeColumnPaths(__spreadValues({
            indexes: { i, j, realIndex, translationsIndex },
            barWidth,
            barXPosition,
            zeroH,
            xDivision
          }, params));
          barHeight = paths.barHeight;
        }
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition: paths.barXPosition,
          barYPosition,
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
        const pathFill = this.barHelpers.getPathFillColor(
          series,
          i,
          j,
          realIndex
        );
        this.renderSeries({
          realIndex,
          pathFill: pathFill.color,
          lineFill: pathFill.useRangeColor ? pathFill.color : w.globals.stroke.colors[realIndex],
          j,
          i,
          x,
          y,
          y1,
          y2,
          pathFrom: paths.pathFrom,
          pathTo: paths.pathTo,
          strokeWidth,
          elSeries,
          series,
          barHeight,
          barWidth,
          barXPosition,
          barYPosition,
          columnGroupIndex,
          elDataLabelsWrap,
          elGoalsMarkers,
          visibleSeries: this.visibleI,
          type: "rangebar"
        });
      }
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{ i?: any, j?: any, barYPosition?: any, barXPosition?: any, srty?: any, srtx?: any, barHeight?: any, barWidth?: any, yDivision?: any, xDivision?: any, initPositions?: any }} opts */
  detectOverlappingBars({
    i,
    j,
    barYPosition,
    barXPosition,
    srty,
    srtx,
    barHeight,
    barWidth,
    yDivision,
    xDivision,
    initPositions
  }) {
    var _a, _b, _c, _d;
    const w = this.w;
    let overlaps = [];
    const rangeName = (_b = (_a = w.globals.seriesRangeName) == null ? void 0 : _a[i]) == null ? void 0 : _b[j];
    const x = (
      /** @type {Record<string,any>} */
      (_d = (_c = w.config.series[i].data) == null ? void 0 : _c[j]) == null ? void 0 : _d.x
    );
    const labelX = Array.isArray(x) ? x.join(" ") : x;
    const rowIndex = w.labelData.labels.map((_) => Array.isArray(_) ? _.join(" ") : _).indexOf(labelX);
    const overlappedIndex = w.rangeData.seriesRange[i].findIndex(
      (tx) => {
        var _a2;
        return tx.x === labelX && ((_a2 = tx.overlaps) == null ? void 0 : _a2.size) > 0;
      }
    );
    if (this.isHorizontal) {
      if (w.config.plotOptions.bar.rangeBarGroupRows) {
        barYPosition = srty + yDivision * rowIndex;
      } else {
        barYPosition = srty + barHeight * this.visibleI + yDivision * rowIndex;
      }
      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = Array.from(
          /** @type {any} */
          w.rangeData.seriesRange[i][overlappedIndex].overlaps
        );
        if (overlaps.indexOf(rangeName) > -1) {
          barHeight = initPositions.barHeight / overlaps.length;
          barYPosition = barHeight * this.visibleI + yDivision * (100 - parseInt(this.barOptions.barHeight, 10)) / 100 / 2 + barHeight * (this.visibleI + overlaps.indexOf(rangeName)) + yDivision * rowIndex;
        }
      }
    } else {
      if (rowIndex > -1 && !w.labelData.timescaleLabels.length) {
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          barXPosition = srtx + xDivision * rowIndex;
        } else {
          barXPosition = srtx + barWidth * this.visibleI + xDivision * rowIndex;
        }
      }
      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = Array.from(
          /** @type {any} */
          w.rangeData.seriesRange[i][overlappedIndex].overlaps
        );
        if (overlaps.indexOf(rangeName) > -1) {
          barWidth = initPositions.barWidth / overlaps.length;
          barXPosition = barWidth * this.visibleI + xDivision * (100 - parseInt(this.barOptions.barWidth, 10)) / 100 / 2 + barWidth * (this.visibleI + overlaps.indexOf(rangeName)) + xDivision * rowIndex;
        }
      }
    }
    return {
      barYPosition,
      barXPosition,
      barHeight,
      barWidth
    };
  }
  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, barXPosition: any, zeroH: any}} opts */
  drawRangeColumnPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    barXPosition,
    zeroH
  }) {
    var _a, _b;
    const w = this.w;
    const { i, j, realIndex, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    const range = this.getRangeValue(realIndex, j);
    let y1 = Math.min(range.start, range.end);
    let y2 = Math.max(range.start, range.end);
    const hasValue = !(typeof /** @type {any} */
    ((_a = this.series[i]) == null ? void 0 : _a[j]) === "undefined" || /** @type {any} */
    ((_b = this.series[i]) == null ? void 0 : _b[j]) === null);
    if (!hasValue) {
      y1 = zeroH;
    } else {
      y1 = zeroH - y1 / yRatio;
      y2 = zeroH - y2 / yRatio;
    }
    const barHeight = Math.abs(y2 - y1);
    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1,
      y2,
      strokeWidth: this.strokeWidth,
      series: this.seriesRangeEnd,
      realIndex,
      i: realIndex,
      j,
      w
    });
    if (hasValue) {
      const box = paths.drawnBox;
      const endIsUpper = range.end >= range.start;
      this.recordColumnGeometry(realIndex, j, {
        slotStart: box.x1,
        slotEnd: box.x2,
        // `drawnBox.y1` is the lower VALUE's edge, so which of the two is the
        // level this bar left behind depends on which way it stepped.
        levelStart: endIsUpper ? box.y1 : box.y2,
        levelEnd: endIsUpper ? box.y2 : box.y1,
        horizontal: false
      });
    }
    if (!w.axisFlags.isXNumeric) {
      x = x + xDivision;
    } else {
      const xForNumericXAxis = this.getBarXForNumericXAxis({
        x,
        j,
        realIndex,
        barWidth
      });
      x = xForNumericXAxis.x;
      barXPosition = xForNumericXAxis.barXPosition;
    }
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barHeight,
      x,
      y: range.start < 0 && range.end < 0 ? y1 : y2,
      goalY: this.barHelpers.getGoalValues(
        "y",
        /** @type {any} */
        null,
        zeroH,
        realIndex,
        j,
        translationsIndex
      ),
      barXPosition
    };
  }
  /**
   * @param {number} val
   */
  preventBarOverflow(val) {
    const w = this.w;
    if (val < 0) {
      val = 0;
    }
    if (val > w.layout.gridWidth) {
      val = w.layout.gridWidth;
    }
    return val;
  }
  /** @param {{indexes: any, y: any, y1: any, y2: any, yDivision: any, barHeight: any, barYPosition: any, zeroW: any}} opts */
  drawRangeBarPaths({
    indexes,
    y,
    y1,
    y2,
    yDivision,
    barHeight,
    barYPosition,
    zeroW
  }) {
    const w = this.w;
    const { realIndex, j } = indexes;
    const x1 = this.preventBarOverflow(zeroW + y1 / this.invertedYRatio);
    const x2 = this.preventBarOverflow(zeroW + y2 / this.invertedYRatio);
    const range = this.getRangeValue(realIndex, j);
    const barWidth = Math.abs(x2 - x1);
    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1,
      x2,
      strokeWidth: this.strokeWidth,
      series: this.seriesRangeEnd,
      i: realIndex,
      realIndex,
      j,
      w
    });
    if (range.start != null && range.end != null) {
      const box = paths.drawnBox;
      this.recordColumnGeometry(realIndex, j, {
        slotStart: box.y1,
        slotEnd: box.y2,
        levelStart: box.x1,
        levelEnd: box.x2,
        horizontal: true
      });
    }
    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barWidth,
      x: range.start < 0 && range.end < 0 ? x1 : x2,
      goalX: this.barHelpers.getGoalValues(
        "x",
        zeroW,
        /** @type {any} */
        null,
        realIndex,
        j,
        0
      ),
      y
    };
  }
  /**
   * Record the px box this bar was actually drawn in, for a consumer that has
   * to line something up with it.
   *
   * Only the waterfall connector layer asks (the sink is put on the state by
   * the waterfall transform, and is null for every other chart), and it asks
   * because re-deriving slot geometry from the axis is precisely how the
   * brush<->bar mapping kept drifting half a bar sideways: see the three facts
   * in `AxisMapping`. Reading back what the renderer committed to cannot drift.
   *
   * `slotStart`/`slotEnd` bound the bar along the CATEGORY axis and
   * `levelStart`/`levelEnd` are the px of its two value bounds, so one shape
   * describes both orientations.
   *
   * @param {number} realIndex
   * @param {number} j
   * @param {{slotStart: number, slotEnd: number, levelStart: number, levelEnd: number, horizontal: boolean}} rec
   */
  recordColumnGeometry(realIndex, j, rec) {
    const sink = this.w.waterfallData && this.w.waterfallData.geometry;
    if (!sink) return;
    if (!isFinite(rec.slotStart) || !isFinite(rec.levelEnd)) return;
    if (!sink[realIndex]) sink[realIndex] = [];
    sink[realIndex][j] = rec;
  }
  /**
   * @param {number} i
   * @param {number} j
   */
  getRangeValue(i, j) {
    const w = this.w;
    return {
      start: w.rangeData.seriesRangeStart[i][j],
      end: w.rangeData.seriesRangeEnd[i][j]
    };
  }
}
_core__default.use({
  bar: Bar,
  column: Bar,
  barStacked: BarStacked,
  rangeBar: RangeBar
});
export {
  default2 as default
};
