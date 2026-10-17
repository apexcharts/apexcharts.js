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
 * ApexCharts v8.3.1
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
    var _a, _b, _c, _d, _e, _f;
    const {
      x,
      y,
      y1,
      y2,
      i,
      j,
      realIndex,
      columnGroupIndex,
      barHeight,
      barWidth,
      barXPosition,
      barYPosition,
      visibleSeries,
      hl,
      noLabel
    } = opts;
    const w = this.w;
    const graphics = new Graphics(this.barCtx.w);
    this.hlt = hl == null ? void 0 : hl.total;
    const steps = w.waterfallData && w.waterfallData.values;
    const waterfallStep = hl && hl.val != null ? hl.val : steps && steps[realIndex] && steps[realIndex][j] != null ? steps[realIndex][j] : null;
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
    const val = (hl == null ? void 0 : hl.hide) ? void 0 : waterfallStep !== null ? waterfallStep : (
      // only RangeBar passes a range, vertical or horizontal
      y2 !== void 0 ? [y1, y2] : w.config.chart.stackType === "100%" ? (
        // Read the percentages globally rather than out of `series`.
        // Under `stackType: '100%'` BarStacked replaces `series` with
        // the percentage rows, and in a combo chart it narrows them to
        // just the series it draws as bars, so `series` is indexed by
        // bar position while `realIndex` counts every series. A line
        // ahead of a column pushed `realIndex` past the end and the
        // label read a value off `undefined` (#2429).
        w.globals.seriesPercent[realIndex][j]
      ) : w.seriesData.series[realIndex][j]
    );
    let text;
    let textRects = {
      width: 0,
      height: 0
    };
    if (dataLabelsConfig.enabled) {
      text = val === void 0 ? "" : dataLabelsConfig.formatter(val, __spreadProps(__spreadValues({}, w), {
        seriesIndex: realIndex,
        dataPointIndex: j,
        w
      }));
      textRects = graphics.getTextRects(
        text,
        parseFloat(dataLabelsConfig.style.fontSize).toString(),
        dataLabelsConfig.style.fontFamily,
        void 0,
        true,
        dataLabelsConfig.style.fontWeight
      );
    }
    const params = {
      x: (_a = hl == null ? void 0 : hl.x) != null ? _a : x,
      y: (_b = hl == null ? void 0 : hl.y) != null ? _b : y,
      neg: hl && hl.val != null ? hl.val < 0 : void 0,
      i,
      j,
      realIndex,
      columnGroupIndex,
      bcx,
      bcy,
      barHeight: (_c = hl == null ? void 0 : hl.barHeight) != null ? _c : barHeight,
      barWidth: (_d = hl == null ? void 0 : hl.barWidth) != null ? _d : barWidth,
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
      const box = (_f = (_e = w.waterfallData.geometry) == null ? void 0 : _e[realIndex]) == null ? void 0 : _f[j];
      if (box && box.horizontal) {
        dataLabelsPos.dataLabelsX = (box.levelStart + box.levelEnd) / 2 + offX;
      }
    }
    dataLabels = noLabel ? null : this.drawCalculatedDataLabels({
      x: dataLabelsPos.dataLabelsX,
      y: dataLabelsPos.dataLabelsY,
      neg: params.neg,
      val,
      text,
      i: realIndex,
      j,
      barWidth: params.barWidth,
      barHeight: params.barHeight,
      textRects,
      dataLabelsConfig
    });
    if (w.config.chart.stacked && barTotalDataLabelsConfig.enabled && this.hlt !== false) {
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
   * The series group `realIndex` belongs to, or null when totals are
   * chart-wide (the single-group case).
   * @param {number} realIndex
   * @returns {{groupIndex: number} | null}
   */
  getTotalGroupContext(realIndex) {
    if (!this.hasMultipleSeriesGroups()) return null;
    const groupIndex = this.barCtx.barHelpers.getSeriesGroupIndex(realIndex);
    if (groupIndex < 0) return null;
    return { groupIndex };
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
    if (this.hlt) return this.hlt.val;
    const w = this.w;
    const top = this.xStackTop(realIndex, j);
    if (top) return top[3];
    const ctx = this.getTotalGroupContext(realIndex);
    const byGroups = w.seriesData.stackedSeriesTotalsByGroups;
    return ctx && byGroups && byGroups[ctx.groupIndex] ? byGroups[ctx.groupIndex][j] : this.barCtx.stackedSeriesTotals[j];
  }
  /**
   * The running stack at this bar's x (BarStacked `tops`) on a numeric axis,
   * where bars stack by x rather than by index.
   * @param {number} realIndex @param {number} j
   */
  xStackTop(realIndex, j) {
    var _a, _b;
    const w = this.w;
    return w.axisFlags.isXNumeric && /** @type {any} */
    ((_b = (_a = this.barCtx.stacks) == null ? void 0 : _a[w.labelData.seriesGroupIndex[realIndex]]) == null ? void 0 : _b.tops.get(w.seriesData.seriesX[realIndex][j]));
  }
  /**
   * The stacked total's text box, measured in the total's own font.
   * @param {number} realIndex @param {number} j
   */
  totalRects(realIndex, j) {
    const s = this.barCtx.barOptions.dataLabels.total.style;
    return new Graphics(this.w).getTextRects(
      this.getStackedTotalDataLabel({ realIndex, j }),
      s.fontSize,
      s.fontFamily,
      void 0,
      true,
      s.fontWeight
    );
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
    var _a;
    const w = this.w;
    let {
      j,
      realIndex,
      y,
      bcx,
      barWidth,
      barHeight,
      textRects,
      dataLabelsX,
      dataLabelsY,
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
      i: realIndex,
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
    const valIsNegative = (_a = opts.neg) != null ? _a : w.seriesData.series[realIndex][j] < 0;
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
    const top = this.xStackTop(realIndex, j);
    const stacks = top ? [] : (
      /** @type {any} */
      this.barCtx.stacks || []
    );
    if (top) {
      lowestPrevY = valIsNegative ? Math.max(newY, top[5]) : Math.min(newY, top[4]);
    }
    stacks.forEach((g, gi) => {
      if (totalGroupCtx && gi !== totalGroupCtx.groupIndex) return;
      g.prevY.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevY = Math.max(arr[j], lowestPrevY);
        } else {
          lowestPrevY = Math.min(arr[j], lowestPrevY);
        }
      });
    });
    if (this.hlt) lowestPrevY = this.hlt.edge;
    if (this.drawsStackedTotal(realIndex) && barTotalDataLabelsConfig.enabled) {
      const h = this.totalRects(realIndex, j).height;
      if (valIsNegative) {
        totalDataLabelsY = lowestPrevY + h * 0.77 - offY - barTotalDataLabelsConfig.offsetY;
      } else {
        totalDataLabelsY = lowestPrevY - h * 0.3 + offY + barTotalDataLabelsConfig.offsetY;
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
    var _a, _b;
    const w = this.w;
    let {
      x,
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
      i: realIndex,
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
    const valIsNegative = (_b = opts.neg) != null ? _b : w.seriesData.series[realIndex][j] < 0;
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
    const top = this.xStackTop(realIndex, j);
    const stacks = top ? [] : (
      /** @type {any} */
      this.barCtx.stacks || []
    );
    if (top) {
      lowestPrevX = valIsNegative ? Math.min(newX, top[4]) : Math.max(newX, top[5]);
    }
    stacks.forEach((g, gi) => {
      if (totalGroupCtx && gi !== totalGroupCtx.groupIndex) return;
      g.prevX.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevX = Math.min(arr[j], lowestPrevX);
        } else {
          lowestPrevX = Math.max(arr[j], lowestPrevX);
        }
      });
    });
    if (this.hlt) lowestPrevX = this.hlt.edge;
    if (this.drawsStackedTotal(realIndex) && barTotalDataLabelsConfig.enabled) {
      const totalLabeltextRects = this.totalRects(realIndex, j);
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
  /** @param {{x: any, y: any, val: any, text?: any, neg?: boolean, i: any, j: any, textRects: any, barHeight: any, barWidth: any, dataLabelsConfig: any}} opts */
  drawCalculatedDataLabels({
    x,
    y,
    val,
    text,
    neg,
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
    const dlKey = `${i}::${this.barCtx._keys(i)[j]}`;
    if (isSeriesCollapsing) {
      const prev = (_a = w.globals.prevDataLabels) == null ? void 0 : _a.get(dlKey);
      if (prev && isFinite(prev.val)) {
        val = prev.val;
        text = void 0;
      }
    }
    if (dataLabelsConfig.enabled && (!isSeriesCollapsed || isSeriesCollapsing)) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels",
        transform: rotate
      });
      const dlCfg = w.config.dataLabels;
      if (((_b = dlCfg.animate) == null ? void 0 : _b.enabled) || ((_c = dlCfg.countUp) == null ? void 0 : _c.enabled)) {
        elDataLabelsWrap.node.setAttribute("data:dlKey", dlKey);
        elDataLabelsWrap.node.setAttribute("data:dlJ", String(j));
        if (typeof val === "number" && isFinite(val)) {
          elDataLabelsWrap.node.setAttribute("data:dlVal", String(val));
        }
      }
      if (val === void 0) {
        text = "";
      } else if (text === void 0) {
        text = formatter(val, __spreadProps(__spreadValues({}, w), {
          seriesIndex: i,
          dataPointIndex: j,
          w
        }));
      }
      if (!val && w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
        text = "";
      }
      let anchor = dataLabelsConfig.textAnchor;
      if (w.config.plotOptions.bar.dataLabels.orientation === "vertical") {
        anchor = w.config.plotOptions.bar.dataLabels.position === "center" ? "middle" : (neg != null ? neg : w.seriesData.series[i][j] < 0) ? "end" : "start";
      }
      if (this.barCtx.isRangeBar && this.barCtx.barOptions.dataLabels.hideOverflowingLabels && barWidth < textRects.width) {
        text = "";
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
      const modifiedDataLabelsConfig = __spreadProps(__spreadValues({}, dataLabelsConfig), {
        textAnchor: anchor
      });
      if (this.barCtx.isHorizontal && val < 0) {
        if (anchor === "start") {
          modifiedDataLabelsConfig.textAnchor = "end";
        } else if (anchor === "end") {
          modifiedDataLabelsConfig.textAnchor = "start";
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
          `${groupIndex}::${this.barCtx._keys(realIndex)[j]}`
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
const CoreUtils = _core.__apex_CoreUtils;
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
   * @param {any} [seriesIndex] a combo's real indices of `series`
   */
  initVariables(series, seriesIndex) {
    const w = this.w;
    this.seriesIndex = seriesIndex;
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
    const labels = w.labelData.labels;
    this.rows = w.globals.isBarHorizontal && w.axisFlags.isXNumeric && !this.barCtx.isRangeBar && w.seriesData.seriesX.some((s) => s == null ? void 0 : s.some((x, j) => x !== labels[j])) ? new Map(labels.map((x, r) => [x, r])) : null;
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
   * merged onto one axis. A k-way merge over the series arrays, which needs
   * each one ascending: a non-ascending array (newest-first data) is merged
   * from a sorted copy, or every gap would read as one huge slot.
   *
   * Collapsed series count too, exactly as they did for `minXDiff`. Skipping
   * them would widen every bar the moment someone hid the tightest-spaced
   * series from the legend, so bar geometry would depend on legend state.
   * In a combo only this renderer's own series count: a line's x values say
   * nothing about how wide a column may be.
   *
   * @returns {number}
   */
  _unionMinXGap() {
    const w = this.w;
    const seriesX = w.seriesData.seriesX || [];
    const own = this.seriesIndex;
    const arrays = [];
    for (let i = 0; i < seriesX.length; i++) {
      const xs = seriesX[i];
      if (own && own.indexOf(i) < 0) continue;
      if (Array.isArray(xs) && xs.length > 0) {
        arrays.push(
          xs.some((v, n) => v < xs[n - 1]) ? xs.filter((v) => v === +v).sort((a, b) => a - b) : xs
        );
      }
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
   * The band a horizontal bar is drawn in: its x's band when the series do
   * not line up by index (see initVariables), else its index.
   * @param {number} realIndex @param {number} j
   */
  barRow(realIndex, j) {
    var _a, _b, _c;
    return (_c = (_b = this.rows) == null ? void 0 : _b.get((_a = this.w.seriesData.seriesX[realIndex]) == null ? void 0 : _a[j])) != null ? _c : j;
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
    ctx.stacks = ctx.w.labelData.seriesGroups.map(() => ({
      prevY: [],
      prevX: [],
      prevYF: [],
      prevXF: [],
      prevYVal: [],
      prevXVal: [],
      tops: /* @__PURE__ */ new Map()
    }));
  }
  /**
   * @param {Record<string, any>} ctx
   */
  initializeStackedXYVars(ctx) {
    ctx.stacks.forEach((g) => {
      g.xArrj = [];
      g.xArrjF = [];
      g.xArrjVal = [];
      g.yArrj = [];
      g.yArrjF = [];
      g.yArrjVal = [];
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
    const datumFill = connectorFill || ((_a = w.config.series[realIndex].data[j]) == null ? void 0 : _a.fill);
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
   * `w.globals.columnSeries` (when set) is the combo chart's own list of which
   * series it draws as bars; a line or area series never occupies a stack
   * segment, so it is filtered out here rather than left to compete for the
   * outermost slot (#5296).
   *
   * @param {number} numSeries
   * @returns {number[][]}
   */
  getStackedSeriesIndices(numSeries) {
    const w = this.w;
    const groups = w.labelData.seriesGroups;
    const barIndices = w.globals.columnSeries ? new Set(
      /** @type {any} */
      w.globals.columnSeries.i
    ) : null;
    const isBar = (i) => !barIndices || barIndices.has(i);
    if (!groups || groups.length < 2) {
      const bucket = Array.from({ length: numSeries }, (_, i) => i).filter(isBar);
      return bucket.length ? [bucket] : [];
    }
    const buckets = Array.from({ length: groups.length }, () => []);
    const ungrouped = [];
    for (let i = 0; i < numSeries; i++) {
      if (!isBar(i)) continue;
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
   * plotOptions.bar.borderRadiusWhenStacked picks which ends round: 'all'
   * caps both the baseline and the far end, 'last' only the far end (#4845).
   *
   * A single-data-point chart used to hand its baseline segment 'top' (and a
   * solo segment 'top' instead of 'both'), which on a horizontal stack rounded
   * the first segment on its INNER edge and left a pill in the middle of the
   * bar (#4845). One data point is resolved like any other now.
   *
   * @param {any[]} series
   * @returns {string[][]}
   */
  createBorderRadiusArr(series) {
    const w = this.w;
    const alwaysApplyRadius = !this.w.config.chart.stacked || w.config.plotOptions.bar.borderRadius <= 0;
    const numSeries = series.length;
    const numColumns = Math.max(0, ...series.map((s) => (s == null ? void 0 : s.length) | 0));
    const output = Array.from(
      { length: numSeries },
      () => Array(numColumns).fill(alwaysApplyRadius ? "top" : "none")
    );
    if (alwaysApplyRadius) return output;
    const lastOnly = w.config.plotOptions.bar.borderRadiusWhenStacked === "last";
    const soloPositive = lastOnly ? "top" : "both";
    const soloNegative = lastOnly ? "bottom" : "both";
    const positiveBase = lastOnly ? "none" : "bottom";
    const negativeBase = lastOnly ? "none" : "top";
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
            output[positiveIndices[0]][j] = soloPositive;
          } else {
            const first = positiveIndices[0];
            const last = positiveIndices[positiveIndices.length - 1];
            for (const i of positiveIndices) {
              output[i][j] = i === first ? positiveBase : i === last ? "top" : "none";
            }
          }
        } else if (negativeIndices.length > 0 && positiveIndices.length === 0) {
          if (negativeIndices.length === 1) {
            output[negativeIndices[0]][j] = soloNegative;
          } else {
            const nearest = Math.min(...negativeIndices);
            const farthest = Math.max(...negativeIndices);
            for (const i of negativeIndices) {
              output[i][j] = i === nearest ? negativeBase : i === farthest ? "bottom" : "none";
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
  /**
   * The rect a column or bar is drawn as: its slot across the category axis
   * (`a`, `len`) and its two ends on the value axis (`v1` the baseline, `v2`
   * the value), with the stroke centred on the edges and the configured
   * corners rounded. getColumnPaths and getBarpaths build their bars here, and
   * so does the highlight filter's part, which is how a part lines up with its
   * whole to the sub-pixel.
   *
   * `base` is the rect collapsed onto its baseline, padded to the command
   * count of `pathTo` so the rise morphs cleanly.
   *
   * @param {{a: number, len: number, v1: number, v2: number, strokeWidth: any, realIndex: number, j: number, dir: number, horizontal?: boolean}} o
   */
  barRect({ a, len, v1, v2, strokeWidth, realIndex, j, dir, horizontal }) {
    const w = this.w;
    const graphics = new Graphics(w);
    strokeWidth = Array.isArray(strokeWidth) ? strokeWidth[realIndex] : strokeWidth;
    if (!strokeWidth) strokeWidth = 0;
    const datum = (
      /** @type {any} */
      w.config.series[realIndex].data[j]
    );
    const offset = horizontal ? datum == null ? void 0 : datum.barHeightOffset : datum == null ? void 0 : datum.columnWidthOffset;
    if (offset) {
      a -= offset / 2;
      len += offset;
    }
    const strokeCenter = strokeWidth / 2;
    const direction = dir * (this.barCtx.isReversed ? -1 : 1);
    const closing = w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z";
    let x1, x2, y1, y2, sl, squarePathTo;
    if (horizontal) {
      y1 = a + strokeCenter;
      y2 = a + len - strokeCenter;
      x1 = v1 + 1e-3 + strokeCenter * direction;
      x2 = v2 + 1e-3 - strokeCenter * direction;
      sl = graphics.line(x1, y2);
      squarePathTo = graphics.move(x1, y1) + graphics.line(x2, y1) + graphics.line(x2, y2) + sl + closing;
    } else {
      x1 = a + strokeCenter;
      x2 = a + len - strokeCenter;
      y1 = v1 + 1e-3 - strokeCenter * direction;
      y2 = v2 + 1e-3 + strokeCenter * direction;
      sl = graphics.line(x2, y1);
      squarePathTo = graphics.move(x1, y1) + graphics.line(x1, y2) + graphics.line(x2, y2) + sl + closing;
    }
    const pathTo = this.arrBorderRadius[realIndex][j] !== "none" ? graphics.roundPathCorners(
      squarePathTo,
      w.config.plotOptions.bar.borderRadius
    ) : squarePathTo;
    return {
      x1,
      x2,
      y1,
      y2,
      sl,
      closing,
      squarePathTo,
      pathTo,
      base: graphics.move(x1, y1) + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + closing,
      strokeWidth,
      strokeCenter,
      direction
    };
  }
  /** @param {{ barWidth?: any, barXPosition?: any, y1?: any, y2?: any, yRatio?: any, strokeWidth?: any, isReversed?: any, series?: any, realIndex?: any, i?: any, j?: any, w?: any }} opts */
  getColumnPaths({
    barWidth,
    barXPosition,
    y1,
    y2,
    strokeWidth,
    series,
    realIndex,
    i,
    j,
    w
  }) {
    var _a, _b, _c;
    const r = this.barRect({
      a: barXPosition,
      len: barWidth,
      v1: y1,
      v2: y2,
      strokeWidth,
      realIndex,
      j,
      dir: series[i][j] >= 0 ? 1 : -1
    });
    const { pathTo, squarePathTo, strokeCenter, direction } = r;
    y1 = r.y1;
    y2 = r.y2;
    let pathFrom = null;
    const morphFrom = (_b = (_a = this.barCtx.ctx) == null ? void 0 : _a.morphTypeChange) == null ? void 0 : _b.getInitialPathFor(
      realIndex,
      j
    );
    if (morphFrom) {
      pathFrom = morphFrom;
    } else if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, pathTo, squarePathTo);
    }
    if (pathFrom == null) {
      pathFrom = r.base;
    }
    if (w.config.chart.stacked) {
      const _ctx = this.barCtx.groupCtx;
      _ctx.yArrj.push(y2 - strokeCenter * direction);
      _ctx.yArrjF.push(Math.abs(y1 - y2 + r.strokeWidth * direction));
      _ctx.yArrjVal.push((_c = this.barCtx.series[i][j]) != null ? _c : null);
    }
    return {
      pathTo,
      pathFrom,
      // The box the path was built from, AFTER the stroke centering and the
      // anti-exponential nudge above. Anything that has to line up with a drawn
      // bar (the waterfall connectors) reads this rather than recomputing the
      // edges, which is how it stays exact when a stroke width is set.
      // `y1` is the lower value's edge and `y2` the upper one's.
      drawnBox: { x1: r.x1, x2: r.x2, y1, y2 }
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
  /** @param {{ barYPosition?: any, barHeight?: any, x1?: any, x2?: any, strokeWidth?: any, isReversed?: any, series?: any, realIndex?: any, i?: any, j?: any, w?: any }} opts */
  getBarpaths({
    barYPosition,
    barHeight,
    x1,
    x2,
    strokeWidth,
    series,
    realIndex,
    i,
    j,
    w
  }) {
    var _a, _b, _c;
    const graphics = new Graphics(this.barCtx.w);
    const r = this.barRect({
      a: barYPosition,
      len: barHeight,
      v1: x1,
      v2: x2,
      strokeWidth,
      realIndex,
      j,
      dir: series[i][j] >= 0 ? 1 : -1,
      horizontal: true
    });
    const { y1, y2, sl, closing, squarePathTo, pathTo, strokeCenter, direction } = r;
    x1 = r.x1;
    x2 = r.x2;
    const isFunnel = this.barCtx.isFunnel;
    const fromX = isFunnel ? (x1 + x2) / 2 : x1;
    let pathFrom = null;
    const morphFrom = (_b = (_a = this.barCtx.ctx) == null ? void 0 : _a.morphTypeChange) == null ? void 0 : _b.getInitialPathFor(
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
      const _ctx = this.barCtx.groupCtx;
      _ctx.xArrj.push(x2 + strokeCenter * direction);
      _ctx.xArrjF.push(Math.abs(x1 - x2 - r.strokeWidth * direction));
      _ctx.xArrjVal.push((_c = this.barCtx.series[i][j]) != null ? _c : null);
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
      if (!w.globals.invalidLogScale) {
        value = new CoreUtils(w).getLogValAtSeriesIndex(value, i);
      }
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
      const val = w.seriesData.series[_si][j];
      if (val) {
        nonZeroColumns++;
      }
      if (_si < i && !val) {
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
    var _a;
    return (_a = this.w.labelData.seriesGroupIndex[seriesIndex]) != null ? _a : -1;
  }
  /**
   * @param {number} seriesIndex
   */
  getGroupIndex(seriesIndex) {
    const groupIndex = this.getSeriesGroupIndex(seriesIndex);
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
const Animations = _core.__apex_Animations;
const computeStagger = _core.__apex_Animations_computeStagger;
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
function seriesKeys(w, realIndex, n = ((_a) => (_a = w.seriesData.series[realIndex]) == null ? void 0 : _a.length)() | 0) {
  return uniquifyKeys(
    Array.from({ length: n }, (_, j) => datumKey(w, realIndex, j))
  );
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
  const newKeys = seriesKeys(w, realIndex);
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
    node.setAttribute("data:ghostKey", `${record.realIndex}::${p.key}`);
    try {
      const bb = node.getBBox();
      const edge = isHorizontal ? origin.startsWith("left") ? bb.x : bb.x + bb.width : origin.endsWith("bottom") ? bb.y + bb.height : bb.y;
      if (isFinite(edge)) node.setAttribute("data:ghostEdge", String(edge));
    } catch (_) {
    }
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
   * The plot area on screen, in client px: its corner is where the plot's
   * group is translated to (translateX, translateY into the svg), and it is
   * gridWidth by gridHeight. The one screen-to-plot measurement: the tooltip,
   * zoom, selection and every other pointer reader map through it, so x and y
   * cannot disagree under CSS zoom.
   *
   * Never the `.apexcharts-grid` group's box: a group measures to the union
   * of what it happens to draw (fact 2 above). The plot's outline starts a
   * pixel down (`Grid.drawGridArea`), so unless gridlines or row bands reach
   * the top edge the box starts a pixel below the plot, and on a numeric-x bar
   * chart the horizontal gridlines run `barPadForNumericAxis` out past both
   * sides.
   *
   * `zoom` is the CSS zoom of any container the chart sits in (screen px per
   * plot px): the measured svg width over `svgWidth`, the unscaled width it
   * was drawn at. A distance measured on screen from this corner is divided
   * by it to land in plot px, the space the series are laid out and painted in.
   * With nothing mounted to measure, screen px are taken as svg px.
   *
   * @param {import('../types/internal').ChartStateW} w
   * @returns {{ left: number, top: number, width: number, height: number, zoom: number }}
   */
  static plotRect(w) {
    var _a, _b, _c;
    const svg = ((_a = w.dom.Paper) == null ? void 0 : _a.node) || ((_b = w.dom.baseEl) == null ? void 0 : _b.querySelector(".apexcharts-svg"));
    const box = ((_c = svg || w.dom.elWrap) == null ? void 0 : _c.getBoundingClientRect()) || {
      left: 0,
      top: 0,
      width: 0
    };
    const zoom = (svg && w.globals.svgWidth ? box.width / w.globals.svgWidth : 1) || 1;
    return {
      left: box.left + w.layout.translateX * zoom,
      top: box.top + w.layout.translateY * zoom,
      width: w.layout.gridWidth * zoom,
      height: w.layout.gridHeight * zoom,
      zoom
    };
  }
  /**
   * Client (screen) x -> pixels from the plot origin of {@link plotRect}.
   * Pass the rect when the caller has already measured it.
   * @param {import('../types/internal').ChartStateW} w
   * @param {number} screenX
   * @param {{ left: number, zoom: number }} [plot]
   * @returns {number}
   */
  static screenXToPlotPx(w, screenX, plot = AxisMapping.plotRect(w)) {
    return (screenX - plot.left) / plot.zoom;
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
  /**
   * Point the per-series axis state at this series' y axis. Every bar-family
   * renderer calls it before initialPositions, which reads the baseline by
   * this.translationsIndex and flips it for a reversed axis.
   * @param {number} realIndex
   * @return {number} translationsIndex
   */
  setSeriesAxis(realIndex) {
    var _a;
    if (this.yRatio.length > 1) {
      this.yaxisIndex = this.w.globals.seriesYAxisReverseMap[realIndex];
      this.translationsIndex = realIndex;
    }
    this.isReversed = (_a = this.w.config.yaxis[this.yaxisIndex]) == null ? void 0 : _a.reversed;
    return this.translationsIndex;
  }
  /** primary draw method which is called on bar object
   * @memberof Bar
   * @param {any[]} series - user supplied series values
   * @param {number} seriesIndex - the index by which series will be drawn on the svg
   * @return {Element} element which is supplied to parent chart draw method for appending
   **/
  draw(series, seriesIndex) {
    var _a, _b, _c, _d, _e;
    const w = this.w;
    const graphics = new Graphics(this.w);
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.series = series;
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series, seriesIndex);
    const ret = graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    const hf = this.ctx.highlightFilter;
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
      const translationsIndex = this.setSeriesAxis(realIndex);
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
      const dlCfg = w.config.dataLabels;
      const holdUntilComplete = !((_a = dlCfg.animate) == null ? void 0 : _a.enabled) && this.isLengthTransition(realIndex);
      const labelsRide = w.globals.dataChanged && !holdUntilComplete && !!(((_b = dlCfg.animate) == null ? void 0 : _b.enabled) || ((_c = dlCfg.countUp) == null ? void 0 : _c.enabled));
      if (!labelsRide) {
        w.globals.delayedElements.push({
          el: elDataLabelsWrap.node,
          holdUntilComplete
        });
        elDataLabelsWrap.node.classList.add("apexcharts-element-hidden");
      }
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      const elBarShadows = graphics.group({
        class: "apexcharts-bar-shadows"
      });
      const ctx = (
        /** @type {any} */
        this.ctx
      );
      const shadowsWas = ctx._barShadows;
      const shadows = ctx._barShadows = /** @type {any[]} */
      [];
      const morphShadows = w.globals.dataChanged && w.globals.shouldAnimate && w.config.chart.animations.dynamicAnimation.enabled && (shadowsWas == null ? void 0 : shadowsWas.length) === series[i].length - 1;
      if (!morphShadows) {
        w.globals.delayedElements.push({
          el: elBarShadows.node
        });
        elBarShadows.node.classList.add("apexcharts-element-hidden");
      }
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
          paths = this.drawBarPaths(__spreadProps(__spreadValues(__spreadValues({}, pathsParams), this.barHelpers.rows && {
            y: initY + this.barHelpers.barRow(realIndex, j) * yDivision
          }), {
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
        if (this.isFunnel && !this.isPyramid && this.barOptions.isFunnel3d && ((_d = w.config.plotOptions.funnel) == null ? void 0 : _d.shape) !== "trapezoid" && this.pathArr.length && j > 0) {
          const barShadow = this.barHelpers.drawBarShadow({
            color: typeof pathFill.color === "string" && ((_e = pathFill.color) == null ? void 0 : _e.indexOf("url")) === -1 ? pathFill.color : Utils.hexToRgba(w.globals.colors[i]),
            prevPaths: this.pathArr[this.pathArr.length - 1],
            currPaths: paths,
            realIndex,
            j
          });
          elBarShadows.add(barShadow);
          shadows.push(barShadow);
          this._shadow = morphShadows && [
            barShadow,
            shadowsWas[j - 1].attr("d")
          ];
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
          hl: hf == null ? void 0 : hf.bar(this, {
            i,
            j,
            realIndex,
            translationsIndex,
            paths,
            zeroH,
            zeroW
          }),
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
          barXPosition: paths.barXPosition,
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
        renderBarExitGhosts({
          w,
          elSeries,
          record: this._prevRecord(realIndex),
          newKeys: this._keys(realIndex),
          isHorizontal: this.isHorizontal,
          speed: w.config.chart.animations.dynamicAnimation.speed
        });
      }
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{ hl?: any, realIndex?: any, pathFill?: any, lineFill?: any, j?: any, i?: any, columnGroupIndex?: any, pathFrom?: any, pathTo?: any, strokeWidth?: any, elSeries?: any, x?: any, y?: any, y1?: any, y2?: any, series?: any, barHeight?: any, barWidth?: any, barXPosition?: any, barYPosition?: any, elDataLabelsWrap?: any, elGoalsMarkers?: any, elBarShadows?: any, visibleSeries?: any, type?: any, classes?: any, fadeReveal?: boolean, noLabel?: boolean }} opts */
  renderSeries({
    hl,
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
    classes,
    fadeReveal = false,
    noLabel
    // a datum's extra paths (box halves, box lane) label nothing
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
        visibleSeries,
        hl: hl == null ? void 0 : hl.label,
        noLabel
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
    let leaving = false;
    if (!w.globals.isBarHorizontal) {
      const cx = barXPosition === void 0 ? dataLabelsObj.dataLabelsPos.dataLabelsX : barXPosition + barWidth / 2;
      const pad = Math.max(barWidth, w.globals.barPadForNumericAxis);
      if (cx + pad < 0 || cx - pad > w.layout.gridWidth) {
        if (this._wasOnScreen(realIndex, j)) leaving = true;
        else skipDrawing = true;
      }
    }
    const datum = (
      /** @type {any} */
      w.config.series[realIndex].data[j]
    );
    if (datum && datum.strokeColor) lineFill = datum.strokeColor;
    const fill = pathFill;
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
          strokeLinecap: w.config.stroke.lineCap,
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
          bindEventsOnPaths: false,
          fadeReveal
        })
      );
      renderedPath.attr("clip-path", `url(#gridRectBarMask${w.globals.cuid})`);
      if (leaving) renderedPath.node.classList.add("apexcharts-leaving");
      const sh = this._shadow;
      if (sh) {
        this._shadow = null;
        new Animations(w, this.ctx).animatePathsGradually({
          el: sh[0],
          fill: "none",
          pathFrom: sh[1],
          pathTo: sh[0].attr("d"),
          speed: dataChangeSpeed,
          delay
        });
      }
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
        val: w.seriesData.series[realIndex][j],
        barHeight,
        barWidth,
        // Datum identity for the next update's keyed join (see
        // LengthTransition): survivors match by key, not array position.
        "data:pathKey": this._keys(realIndex)[j]
      });
      hl == null ? void 0 : hl.paint(renderedPath, {
        delay,
        delayMs,
        speed: dataChangeSpeed,
        fill,
        elSeries,
        elBarShadows,
        labels: dataLabelsObj.dataLabels,
        pathFrom,
        pathTo
      });
      if (emit.kind === "canvas") {
        if (!w.globals.barCanvasCoords) w.globals.barCanvasCoords = {};
        if (!w.globals.barCanvasCoords[realIndex]) {
          w.globals.barCanvasCoords[realIndex] = {};
        }
        const prev = w.globals.barCanvasCoords[realIndex][j];
        let bounds = (prev == null ? void 0 : prev.bounds) || null;
        const box = renderedPath.bbox();
        if (box.width > 0 || box.height > 0) {
          bounds = {
            left: Math.min(bounds ? bounds.left : Infinity, box.x),
            top: Math.min(bounds ? bounds.top : Infinity, box.y),
            right: Math.max(
              bounds ? bounds.right : -Infinity,
              box.x + box.width
            ),
            bottom: Math.max(
              bounds ? bounds.bottom : -Infinity,
              box.y + box.height
            )
          };
        }
        w.globals.barCanvasCoords[realIndex][j] = __spreadProps(__spreadValues({
          cx: dataLabelsObj.dataLabelsPos.bcx,
          cy: dataLabelsObj.dataLabelsPos.bcy,
          barWidth,
          type
        }, typeof y1 !== "undefined" && typeof y2 !== "undefined" && { rangeY1: y1, rangeY2: y2 }), {
          bounds
        });
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
    if (w.config.plotOptions.bar.hideZeroBarsWhenGrouped) {
      const { nonZeroColumns, zeroEncounters } = this.barHelpers.getZeroValueEncounters({
        i: indexes.realIndex,
        j
      });
      if (nonZeroColumns > 0) {
        barHeight = this.seriesLen * barHeight / nonZeroColumns;
      }
      barYPosition = y + barHeight * this.visibleI;
      barYPosition -= barHeight * zeroEncounters;
    } else {
      barYPosition = y + barHeight * this.visibleI;
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
    if (!usePyramid) {
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
        const { nonZeroColumns, zeroEncounters } = this.barHelpers.getZeroValueEncounters({ i: realIndex, j });
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
    const overlay = isHistogramOverlay(w);
    let sxI = realIndex;
    if (!w.seriesData.seriesX[realIndex].length) {
      sxI = w.globals.maxValsInArrayIndex;
    }
    if (Utils.isNumber(w.seriesData.seriesX[sxI][j])) {
      x = AxisMapping.dataXToPx(w, w.seriesData.seriesX[sxI][j]) - barWidth * (overlay ? 1 : this.seriesLen) / 2;
    }
    return {
      barXPosition: x + (overlay ? 0 : barWidth * this.visibleI),
      x
    };
  }
  /**
   * Whether datum j of this series was drawn in the previous render and this
   * render morphs from it (an animated, keyed data change).
   *
   * Off-screen marks are not drawn, for speed. But a mark that WAS on screen
   * before an animated update has to be drawn this once, so it can morph to
   * its new off-screen place and slide out under the clip: on a zoom-in the
   * bars or candles leaving the view used to vanish on frame 0 while the rest
   * were still moving. The extra marks are bounded by what was visible
   * before, and large datasets skip the morph for the bulk fade anyway.
   * @param {number} realIndex
   * @param {number} j
   * @returns {boolean}
   */
  _wasOnScreen(realIndex, j) {
    if (!lengthTransitionEnabled(this.w)) return false;
    const keyed = this._prevKeyedPaths(realIndex);
    return !!keyed && keyed.has(this._keys(realIndex)[j]);
  }
  /**
   * This render's datum keys for a series (see seriesKeys), as stamped on
   * each bar and looked up in the previous render's.
   * @param {number} realIndex
   * @returns {string[]}
   */
  _keys(realIndex) {
    const c = (
      /** @type {any} */
      this._keyCache || (this._keyCache = {})
    );
    return c[realIndex] || (c[realIndex] = seriesKeys(this.w, realIndex));
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
    var _a, _b, _c, _d, _e, _f;
    if (!this._ltCache) this._ltCache = {};
    if (this._ltCache[realIndex] !== void 0) return this._ltCache[realIndex];
    const w = this.w;
    let result = false;
    if (lengthTransitionEnabled(w) && w.globals.previousPaths.length > 0) {
      const record = this._prevRecord(realIndex);
      const dataLen = (_b = (_a = w.seriesData.series[realIndex]) == null ? void 0 : _a.length) != null ? _b : 0;
      const keyed = record && this._prevKeyedPaths(realIndex);
      if (!record) {
        result = dataLen > 0;
      } else if (keyed) {
        const now = new Set(this._keys(realIndex));
        result = ((_f = (_e = (_d = (_c = w.globals.prevStreamFrame) == null ? void 0 : _c.seriesY) == null ? void 0 : _d[realIndex]) == null ? void 0 : _e.length) != null ? _f : dataLen) !== dataLen || [...keyed.keys()].some((k) => !now.has(k));
      } else {
        result = record.paths.length !== dataLen;
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
      const prev = keyed.get(this._keys(realIndex)[j]);
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
    if (oldD) return this.cornerMorph(oldD, pathTo, squarePathTo);
    if (isNewDatum && lengthTransitionEnabled(w)) {
      return null;
    }
    return pathTo;
  }
  /**
   * Where a bar morphing from `oldD` to `pathTo` starts, when the two may
   * differ in corner state (see the note inside). When the tween has to aim
   * at a padded twin of the target, the twin is left in _pathToInterp, which
   * the caller has cleared; a pair that cannot be reconciled snaps to
   * `pathTo`. The highlight filter's stacked parts hand their corners over by
   * the same rule.
   *
   * @param {string} oldD
   * @param {string} pathTo
   * @param {string} [squarePathTo]
   * @returns {string}
   */
  cornerMorph(oldD, pathTo, squarePathTo) {
    const fromCount = Bar.pathCommandCount(oldD);
    const toCount = Bar.pathCommandCount(pathTo);
    if (fromCount === toCount) {
      return oldD;
    }
    const graphics = new Graphics(this.w);
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
    const record = this._prevRecord(realIndex);
    if (!record) return null;
    const keyed = this._prevKeyedPaths(realIndex);
    const prev = keyed ? keyed.get(this._keys(realIndex)[j]) : record.paths[j];
    return prev ? !!prev.flip : null;
  }
  /**
   * Count SVG path commands (M, L, C, Q, Z, etc.). Used to detect whether
   * two paths can be morphed safely: the morph needs matching command counts.
   *
   * @param {string} d
   * @returns {number}
   */
  static pathCommandCount(d) {
    if (!d) return 0;
    const matches = d.match(/[MmLlHhVvCcSsQqTtAaZz]/g);
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
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series, seriesIndex);
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
    const hf = this.ctx.highlightFilter;
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
      this.stacks[groupIndex];
      const xArrValues = [];
      const yArrValues = [];
      const translationsIndex = this.setSeriesAxis(realIndex);
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
          columnGroupIndex
        };
        let paths = (
          /** @type {any} */
          null
        );
        if (this.isHorizontal) {
          paths = this.drawStackedBarPaths(__spreadProps(__spreadValues(__spreadValues({}, commonPathOpts), this.barHelpers.rows && {
            y: initPositions.y + this.barHelpers.barRow(realIndex, j) * yDivision
          }), {
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
        const wantsFlip = this.cornerFlip(
          this.barHelpers.arrBorderRadius[realIndex][j],
          w.seriesData.series[realIndex][j]
        );
        const heldFlip = holdMirror && !wantsFlip && this.getPreviousFlip(realIndex, j);
        if (wantsFlip || heldFlip) {
          classes = flipClass;
        }
        if (heldFlip) {
          classes += " apexcharts-flip-held";
          heldMirrors = true;
        }
        elSeries = this.renderSeries(__spreadProps(__spreadValues({
          hl: hf == null ? void 0 : hf.bar(this, {
            i,
            j,
            realIndex,
            translationsIndex,
            paths,
            zeroH,
            zeroW
          }),
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
          barXPosition: paths.barXPosition,
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
    if (heldMirrors) this.settleHeldMirrors(ret);
    return ret;
  }
  /**
   * Whether a stacked segment with this corner state and value is drawn
   * mirrored. Stacked segments are built top-rounded only, so a radius that
   * belongs at the other end (a positive segment rounded at the bottom, a
   * negative one at the top) comes from the apexcharts-flip-y/-x class. The
   * highlight filter applies the same rule to its parts.
   * @param {string} state the segment's corner state (createBorderRadiusArr)
   * @param {number} v the segment's value
   */
  cornerFlip(state, v) {
    return state === "bottom" && v > 0 || state === "top" && v < 0;
  }
  /**
   * Drop the mirrors held across an animated update once the geometry they
   * were covering for has arrived. A no-op for every state except
   * 'bottom' → 'top', where the endpoint really is rounded at the other end;
   * everywhere else the mirror is an exact identity on the settled shape, so
   * removing it changes nothing on screen.
   *
   * The marks are collected now, not when the timer fires: a query then also
   * stripped the mirrors a LATER update was still holding mid-tween.
   * @param {any} [ret] this draw's series group (default: the whole chart)
   */
  settleHeldMirrors(ret) {
    const w = this.w;
    if (!Environment.isBrowser()) return;
    const anim = w.config.chart.animations;
    const hold = (anim.dynamicAnimation.speed || 0) + (anim.speed || 0) + 100;
    const held = (ret ? ret.node : w.dom.baseEl).querySelectorAll(
      ".apexcharts-flip-held"
    );
    setTimeout(() => {
      held.forEach((el) => {
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
  /** @param {{indexes: any, barHeight: any, strokeWidth: any, zeroW: any, x: any, y: any, columnGroupIndex: any, yDivision: any, elSeries: any}} opts */
  drawStackedBarPaths({
    indexes,
    barHeight,
    strokeWidth,
    zeroW,
    x,
    y,
    columnGroupIndex,
    yDivision,
    elSeries
  }) {
    var _a, _b;
    const w = this.w;
    const barYPosition = y + columnGroupIndex * barHeight;
    let barXPosition;
    const i = indexes.i;
    const j = indexes.j;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    const v = (
      /** @type {any} */
      (_b = (_a = this.series[i]) == null ? void 0 : _a[j]) != null ? _b : null
    );
    const g = this.groupCtx;
    const key = w.axisFlags.isXNumeric ? w.seriesData.seriesX[realIndex][j] : j;
    const top = g.tops.get(key);
    if (top) {
      const [prevX, prevVal, prevBarW] = top;
      const flip = (this.isReversed ? prevBarW : 0) * 2;
      barXPosition = prevVal < 0 ? v >= 0 ? prevX + prevBarW - flip : prevX : v >= 0 ? prevX : prevX - prevBarW + flip;
    } else {
      barXPosition = zeroW;
    }
    x = barXPosition + v / this.invertedYRatio * (this.isReversed ? -1 : 1);
    const paths = this.barHelpers.getBarpaths({
      barYPosition,
      barHeight,
      x1: barXPosition,
      x2: x,
      strokeWidth,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      i,
      j,
      w
    });
    this._setTop(key, top, g.xArrj[j], g.xArrjVal[j], g.xArrjF[j], realIndex, j);
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
  /** @param {{indexes: any, x: any, y: any, xDivision: any, barWidth: any, zeroH: any, columnGroupIndex: any, elSeries: any}} opts */
  drawStackedColumnPaths({
    indexes,
    x,
    y,
    xDivision,
    barWidth,
    zeroH,
    columnGroupIndex,
    elSeries
  }) {
    var _a, _b, _c;
    const w = this.w;
    const i = indexes.i;
    const j = indexes.j;
    const bc = indexes.bc;
    const realIndex = indexes.realIndex;
    const translationsIndex = indexes.translationsIndex;
    const v = (
      /** @type {any} */
      (_b = (_a = this.series[i]) == null ? void 0 : _a[j]) != null ? _b : null
    );
    if (w.axisFlags.isXNumeric) {
      let seriesVal = w.seriesData.seriesX[realIndex][j];
      if (!seriesVal) seriesVal = 0;
      x = (seriesVal - w.globals.minX) / this.xRatio - barWidth / 2 * w.globals.barGroups.length;
    }
    const barXPosition = x + columnGroupIndex * barWidth;
    let barYPosition;
    const g = this.groupCtx;
    const key = w.axisFlags.isXNumeric ? w.seriesData.seriesX[realIndex][j] : j;
    const top = g.tops.get(key);
    if (top) {
      const [prevYValue, prevVal, prevBarH] = top;
      let bYP;
      if (prevVal < 0) {
        bYP = v >= 0 ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2 : prevYValue;
      } else if (prevVal >= 0) {
        bYP = v >= 0 ? prevYValue : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2;
      }
      if (typeof bYP === "undefined") bYP = w.layout.gridHeight;
      if (((_c = g.prevYF[0]) == null ? void 0 : _c.every((val) => val === 0)) && g.prevYF.slice(1).every(
        (arr) => arr.every((val) => isNaN(val))
      )) {
        barYPosition = zeroH;
      } else {
        barYPosition = bYP;
      }
    } else {
      barYPosition = zeroH;
    }
    y = barYPosition - v / this.yRatio[translationsIndex] * (this.isReversed ? -1 : 1);
    const paths = this.barHelpers.getColumnPaths({
      barXPosition,
      barWidth,
      y1: barYPosition,
      y2: y,
      yRatio: this.yRatio[translationsIndex],
      // the series' width even for an empty segment, so a hidden layer keeps
      // its place, but no inset at all when no stroke is drawn
      strokeWidth: w.config.stroke.show ? this.strokeWidth : 0,
      isReversed: this.isReversed,
      series: this.series,
      realIndex: indexes.realIndex,
      i,
      j,
      w
    });
    this._setTop(key, top, g.yArrj[j], g.yArrjVal[j], g.yArrjF[j], realIndex, j);
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
        translationsIndex
      ),
      barXPosition,
      x: w.axisFlags.isXNumeric ? x : x + xDivision,
      y
    };
  }
  /**
   * Record the segment just drawn as the top of its stack. Per key it holds
   * the top and value of the last segment drawn there, the summed lengths and
   * raw values of every segment so far (the total label's value), and the
   * extreme tops below that segment (the total label's position).
   * @param {any} key @param {any} top @param {number} t @param {any} val
   * @param {number} len @param {number} realIndex @param {number} j
   */
  _setTop(key, top, t, val, len, realIndex, j) {
    if (isNaN(t)) return;
    this.groupCtx.tops.set(key, [
      t,
      val,
      (top ? top[2] : 0) + len,
      (top ? top[3] : 0) + (this.w.seriesData.series[realIndex][j] || 0),
      top ? Math.min(top[0], top[4]) : 1 / 0,
      top ? Math.max(top[0], top[5]) : -1 / 0
    ]);
  }
}
class RangeBar extends Bar {
  /**
   * @param {any[]} series
   * @param {number} seriesIndex
   */
  draw(series, seriesIndex) {
    var _a, _b, _c, _d, _e, _f;
    const w = this.w;
    const graphics = new Graphics(this.w);
    this.rangeBarOptions = this.w.config.plotOptions.rangeBar;
    this.series = series;
    this.seriesRangeStart = w.rangeData.seriesRangeStart;
    this.seriesRangeEnd = w.rangeData.seriesRangeEnd;
    this.barHelpers.initVariables(series, seriesIndex);
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
      const translationsIndex = this.setSeriesAxis(realIndex);
      if (this.isHorizontal && w.labelData.timescaleLabels.length) {
        this.isReversed = false;
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
      const yDivision = (_a = initPositions.yDivision) != null ? _a : 0;
      const xDivision = (_b = initPositions.xDivision) != null ? _b : 0;
      y = initY;
      x = initX;
      const elDataLabelsWrap = graphics.group({
        class: "apexcharts-datalabels",
        "data:realIndex": realIndex
      });
      const elGoalsMarkers = graphics.group({
        class: "apexcharts-rangebar-goals-markers"
      });
      const data = (
        /** @type {any} */
        w.config.series[realIndex].data
      );
      for (let j = 0; j < w.globals.dataPoints; j++) {
        const strokeWidth = this.barHelpers.getStrokeWidth(i, j, realIndex);
        let barWidth = (_c = initPositions.barWidth) != null ? _c : 0;
        let barHeight = (_d = initPositions.barHeight) != null ? _d : 0;
        const y1 = this.seriesRangeStart[realIndex][j];
        const y2 = this.seriesRangeEnd[realIndex][j];
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
        if (typeof (data == null ? void 0 : data[j]) === "undefined") {
          break;
        }
        if (this.isHorizontal) {
          barYPosition = y + barHeight * /** @type {any} */
          this.visibleI;
          const srty = (yDivision - barHeight * seriesLen) / 2;
          if (((_e = data[j]) == null ? void 0 : _e.x) != null) {
            const positions = this.detectOverlappingBars({
              i: realIndex,
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
            x = (w.seriesData.seriesX[realIndex][j] - w.globals.minX) / this.xRatio - barWidth / 2;
          }
          barXPosition = x + barWidth * /** @type {any} */
          this.visibleI;
          const srtx = (xDivision - barWidth * seriesLen) / 2;
          if (((_f = data[j]) == null ? void 0 : _f.x) != null) {
            const positions = this.detectOverlappingBars({
              i: realIndex,
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
          barXPosition = paths.barXPosition;
        }
        const barGoalLine = this.barHelpers.drawGoalLine({
          barXPosition,
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
      if (w.globals.previousPaths.length > 0) {
        renderBarExitGhosts({
          w,
          elSeries,
          record: this._prevRecord(realIndex),
          newKeys: this._keys(realIndex),
          isHorizontal: this.isHorizontal,
          speed: w.config.chart.animations.dynamicAnimation.speed
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
          barYPosition += barHeight * overlaps.indexOf(rangeName);
        }
      }
    } else {
      if (rowIndex > -1 && !w.axisFlags.isXNumeric) {
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
          barXPosition += barWidth * overlaps.indexOf(rangeName);
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
    const yRatio = this.yRatio[translationsIndex] * (this.isReversed ? -1 : 1);
    const range = this.getRangeValue(realIndex, j);
    let y1 = Math.min(range.start, range.end);
    let y2 = Math.max(range.start, range.end);
    const hasValue = !(typeof /** @type {any} */
    ((_a = this.series[i]) == null ? void 0 : _a[j]) === "undefined" || /** @type {any} */
    ((_b = this.series[i]) == null ? void 0 : _b[j]) === null);
    if (!hasValue) {
      y1 = y2 = zeroH;
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
   * Timeline datums key by their own row, not by the j-th label: a row can
   * hold several bars, so labels[j] names some other datum's row.
   * @param {number} realIndex
   * @returns {string[]}
   */
  _keys(realIndex) {
    const c = (
      /** @type {any} */
      this._keyCache || (this._keyCache = {})
    );
    const data = (
      /** @type {any} */
      this.w.config.series[realIndex].data
    );
    return c[realIndex] || (c[realIndex] = uniquifyKeys(
      (data || []).map(
        (d, j) => {
          var _a;
          return "c:" + ((_a = d == null ? void 0 : d.x) != null ? _a : j);
        }
      )
    ));
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
    const ratio = this.invertedYRatio * (this.isReversed ? -1 : 1);
    const x1 = this.preventBarOverflow(zeroW + y1 / ratio);
    const x2 = this.preventBarOverflow(zeroW + y2 / ratio);
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
