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
 * ApexCharts v5.11.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const CoreUtils = _core.__apex_CoreUtils;
const Graphics = _core.__apex_Graphics;
const DataLabels = _core.__apex_DataLabels;
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
    if (typeof barYPosition !== "undefined" && this.barCtx.isRangeBar) {
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
    let dataLabelsY = bcy - (this.barCtx.isRangeBar ? 0 : dataPointsDividedHeight) + barHeight / 2 + textRects.height / 2 + offY - 3;
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
    let lowestPrevX = newX;
    w.labelData.seriesGroups.forEach((sg) => {
      var _a;
      (_a = this.barCtx[sg.join(",")]) == null ? void 0 : _a.prevX.forEach(
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
          dataLabelsX = valIsNegative ? textRects.width + strokeWidth : strokeWidth;
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
    var _a;
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
    let pathTo = graphics.move(x1, y1);
    let pathFrom = graphics.move(x1, y1);
    const sl = graphics.line(x2, y1);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false);
    }
    pathTo = pathTo + graphics.line(x1, y2) + graphics.line(x2, y2) + sl + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
    pathFrom = pathFrom + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
    if (this.arrBorderRadius[realIndex][j] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      );
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
    var _a;
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
    let pathTo = graphics.move(x1, y1);
    let pathFrom = graphics.move(x1, y1);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.barCtx.getPreviousPath(realIndex, j, false);
    }
    const sl = graphics.line(x1, y2);
    pathTo = pathTo + graphics.line(x2, y1) + graphics.line(x2, y2) + sl + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
    pathFrom = pathFrom + graphics.line(x1, y1) + sl + sl + sl + sl + sl + graphics.line(x1, y1) + (w.config.plotOptions.bar.borderRadiusApplication === "around" || this.arrBorderRadius[realIndex][j] === "both" ? " Z" : " z");
    if (this.arrBorderRadius[realIndex][j] !== "none") {
      pathTo = graphics.roundPathCorners(
        pathTo,
        w.config.plotOptions.bar.borderRadius
      );
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
    var _a;
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
        el: elDataLabelsWrap.node
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
        if (this.isFunnel && this.barOptions.isFunnel3d && this.pathArr.length && j > 0) {
          const barShadow = this.barHelpers.drawBarShadow({
            color: typeof pathFill.color === "string" && ((_a = pathFill.color) == null ? void 0 : _a.indexOf("url")) === -1 ? pathFill.color : Utils.hexToRgba(w.globals.colors[i]),
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
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
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
    const delay = j / w.config.chart.animations.animateGradually.delay * (w.config.chart.animations.speed / w.globals.dataPoints) / 2.4;
    if (!skipDrawing) {
      const renderedPath = (
        /** @type {any} */
        graphics.renderPaths({
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
          dataChangeSpeed: w.config.chart.animations.dynamicAnimation.speed,
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
        barWidth
      });
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
    if (this.isFunnel) {
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
    const paths = (
      /** @type {any} */
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
      })
    );
    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision;
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
      x = (w.seriesData.seriesX[sxI][j] - w.globals.minX) / this.xRatio - barWidth * this.seriesLen / 2;
    }
    return {
      barXPosition: x + barWidth * this.visibleI,
      x
    };
  }
  /** getPreviousPath is a common function for bars/columns which is used to get previous paths when data changes.
   * @memberof Bar
   * @param {number} realIndex - current iterating i
   * @param {number} j - current iterating series's j index
   * @return {string} pathFrom is the string which will be appended in animations
   **/
  getPreviousPath(realIndex, j) {
    const w = this.w;
    let pathFrom = "M 0 0";
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp];
      if (gpp.paths && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(String(realIndex), 10)) {
        if (typeof w.globals.previousPaths[pp].paths[j] !== "undefined") {
          pathFrom = w.globals.previousPaths[pp].paths[j].d;
        }
      }
    }
    return pathFrom;
  }
}
class BoxCandleStick extends Bar {
  /**
   * @param {any[]} series
   * @param {string} ctype
   * @param {number} seriesIndex
   */
  // @ts-ignore -- BoxCandleStick.draw has an extra ctype param compared to Bar.draw
  draw(series, ctype, seriesIndex) {
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
            zeroH
          }));
        }
        y = paths.y;
        x = paths.x;
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
        if (j > 0) {
          xArrj.push(x + (barWidth != null ? barWidth : 0) / 2);
        }
        yArrj.push(y);
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
      }
      w.globals.seriesXvalues[realIndex] = xArrj;
      w.globals.seriesYvalues[realIndex] = yArrj;
      ret.add(elSeries);
    }
    return ret;
  }
  /** @param {{indexes: any, x: any, xDivision: any, barWidth: any, zeroH: any, strokeWidth: any}} opts */
  drawVerticalBoxPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    zeroH,
    strokeWidth
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
    let pathTo;
    let pathFrom = graphics.move(barXPosition + barWidth / 2, y1);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j);
    }
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
    pathFrom = pathFrom + graphics.move(barXPosition, y1);
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
    let pathFrom = graphics.move(x1, barYPosition + barHeight / 2);
    if (w.globals.previousPaths.length > 0) {
      pathFrom = this.getPreviousPath(realIndex, j);
    }
    const pathTo = [
      graphics.move(x1, barYPosition) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(l1, barYPosition + barHeight / 2 - barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2 + barHeight / 4) + graphics.line(l1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight / 2) + graphics.line(x1, barYPosition + barHeight) + graphics.line(m, barYPosition + barHeight) + graphics.line(m, barYPosition) + graphics.line(x1 + strokeWidth / 2, barYPosition),
      graphics.move(m, barYPosition) + graphics.line(m, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(l2, barYPosition + barHeight - barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 4) + graphics.line(l2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition + barHeight / 2) + graphics.line(x2, barYPosition) + graphics.line(m, barYPosition) + "z"
    ];
    pathFrom = pathFrom + graphics.move(x1, barYPosition);
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
