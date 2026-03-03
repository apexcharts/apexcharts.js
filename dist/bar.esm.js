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
 * ApexCharts v5.9.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const DataLabels = _core.__apex_DataLabels;
class BarDataLabels {
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
   * @param {object} {barProps} most of the bar properties used throughout the bar
   * drawing function
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
      bcx = x + parseFloat(barWidth * (visibleSeries + 1));
      bcy = y + parseFloat(barHeight * (visibleSeries + 1)) - strokeWidth;
    } else {
      bcx = x + parseFloat(barWidth * visibleSeries);
      bcy = y + parseFloat(barHeight * visibleSeries);
    }
    let dataLabels = null;
    let totalDataLabels = null;
    let dataLabelsX = x;
    let dataLabelsY = y;
    let dataLabelsPos = {};
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
        parseFloat(dataLabelsConfig.style.fontSize)
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
      (_a = this.barCtx[sg.join(",")]) == null ? void 0 : _a.prevY.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevY = Math.max(arr[j], lowestPrevY);
        } else {
          lowestPrevY = Math.min(arr[j], lowestPrevY);
        }
      });
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
      (_a = this.barCtx[sg.join(",")]) == null ? void 0 : _a.prevX.forEach((arr) => {
        if (valIsNegative) {
          lowestPrevX = Math.min(arr[j], lowestPrevX);
        } else {
          lowestPrevX = Math.max(arr[j], lowestPrevX);
        }
      });
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
          parseFloat(dataLabelsConfig.style.fontSize)
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
  constructor(barCtx) {
    this.w = barCtx.w;
    this.barCtx = barCtx;
  }
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
        (brArr) => brArr.map((_) => "none")
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
  getXForValue(value, zeroW, zeroPositionForNull = true) {
    let xForVal = zeroPositionForNull ? zeroW : null;
    if (typeof value !== "undefined" && value !== null) {
      xForVal = zeroW + value / this.barCtx.invertedYRatio - (this.barCtx.isReversed ? value / this.barCtx.invertedYRatio : 0) * 2;
    }
    return xForVal;
  }
  getYForValue(value, zeroH, translationsIndex, zeroPositionForNull = true) {
    let yForVal = zeroPositionForNull ? zeroH : null;
    if (typeof value !== "undefined" && value !== null) {
      yForVal = zeroH - value / this.barCtx.yRatio[translationsIndex] + (this.barCtx.isReversed ? value / this.barCtx.yRatio[translationsIndex] : 0) * 2;
    }
    return yForVal;
  }
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
class Bar {
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
   * @param {array} series - user supplied series values
   * @param {int} seriesIndex - the index by which series will be drawn on the svg
   * @return {node} element which is supplied to parent chart draw method for appending
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
      const realIndex = w.globals.comboCharts ? seriesIndex[i] : i;
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
        xArrj.push(x + barWidth / 2);
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
        let paths = null;
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
        const pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex);
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
          xArrj.push(x + barWidth / 2);
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
      graphics.setupEventDelegation(
        elSeries,
        `.apexcharts-${type}-area`
      );
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
    const dataLabelsObj = barDataLabels.handleBarDataLabels({
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
    });
    if (!w.globals.isBarHorizontal) {
      if (dataLabelsObj.dataLabelsPos.dataLabelsX + Math.max(barWidth, w.globals.barPadForNumericAxis) < 0 || dataLabelsObj.dataLabelsPos.dataLabelsX - Math.max(barWidth, w.globals.barPadForNumericAxis) > w.layout.gridWidth) {
        skipDrawing = true;
      }
    }
    if (w.config.series[i].data[j] && w.config.series[i].data[j].strokeColor) {
      lineFill = w.config.series[i].data[j].strokeColor;
    }
    if (this.isNullValue) {
      pathFill = "none";
    }
    const delay = j / w.config.chart.animations.animateGradually.delay * (w.config.chart.animations.speed / w.globals.dataPoints) / 2.4;
    if (!skipDrawing) {
      const renderedPath = graphics.renderPaths({
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
      });
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
      zeroW = zeroW - (this.barHelpers.getXForValue(this.series[i][j], zeroW) - zeroW) / 2;
    }
    x = this.barHelpers.getXForValue(this.series[i][j], zeroW);
    const paths = this.barHelpers.getBarpaths({
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
      goalX: this.barHelpers.getGoalValues("x", zeroW, null, i, j),
      barYPosition,
      barHeight
    };
  }
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
      this.series[i][j],
      zeroH,
      translationsIndex
    );
    const paths = this.barHelpers.getColumnPaths({
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
    });
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
   * @param {int} realIndex - current iterating i
   * @param {int} j - current iterating series's j index
   * @return {string} pathFrom is the string which will be appended in animations
   **/
  getPreviousPath(realIndex, j) {
    const w = this.w;
    let pathFrom = "M 0 0";
    for (let pp = 0; pp < w.globals.previousPaths.length; pp++) {
      const gpp = w.globals.previousPaths[pp];
      if (gpp.paths && gpp.paths.length > 0 && parseInt(gpp.realIndex, 10) === parseInt(realIndex, 10)) {
        if (typeof w.globals.previousPaths[pp].paths[j] !== "undefined") {
          pathFrom = w.globals.previousPaths[pp].paths[j].d;
        }
      }
    }
    return pathFrom;
  }
}
class BarStacked extends Bar {
  draw(series, seriesIndex) {
    const w = this.w;
    this.graphics = new Graphics(this.w);
    this.bar = new Bar(this.w, this.ctx, this.xyRatios);
    const coreUtils = new CoreUtils(this.w);
    series = coreUtils.getLogSeries(series);
    this.yRatio = coreUtils.getLogYRatios(this.yRatio);
    this.barHelpers.initVariables(series);
    if (w.config.chart.stackType === "100%") {
      series = w.globals.comboCharts ? seriesIndex.map((_) => w.globals.seriesPercent[_]) : w.globals.seriesPercent.slice();
    }
    this.series = series;
    this.barHelpers.initializeStackedPrevVars(this);
    const ret = this.graphics.group({
      class: "apexcharts-bar-series apexcharts-plot-series"
    });
    let x = 0;
    let y = 0;
    for (let i = 0, bc = 0; i < series.length; i++, bc++) {
      const realIndex = w.globals.comboCharts ? seriesIndex[i] : i;
      const { groupIndex, columnGroupIndex } = this.barHelpers.getGroupIndex(realIndex);
      this.groupCtx = this[w.labelData.seriesGroups[groupIndex]];
      const xArrValues = [];
      const yArrValues = [];
      let translationsIndex = 0;
      if (this.yRatio.length > 1) {
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex][0];
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
      const elGoalsMarkers = this.graphics.group({
        class: "apexcharts-bar-goals-markers"
      });
      const initPositions = this.initialPositions(x, y, void 0, void 0, void 0, void 0, translationsIndex);
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
      if (this.groupCtx.prevY.length === 1 && this.groupCtx.prevY[0].every((val) => isNaN(val))) {
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
        let paths = null;
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
        const pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex);
        let classes = "";
        const flipClass = w.globals.isBarHorizontal ? "apexcharts-flip-x" : "apexcharts-flip-y";
        if (this.barHelpers.arrBorderRadius[realIndex][j] === "bottom" && w.seriesData.series[realIndex][j] > 0 || this.barHelpers.arrBorderRadius[realIndex][j] === "top" && w.seriesData.series[realIndex][j] < 0) {
          classes = flipClass;
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
    return ret;
  }
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
      if (w.axisFlags.isXNumeric && w.globals.dataPoints > 1) {
        xDivision = w.globals.minXDiff / this.xRatio;
        barWidth = xDivision * parseInt(this.barOptions.columnWidth, 10) / 100;
      } else if (String(userColumnWidth).indexOf("%") === -1) {
        barWidth = parseInt(userColumnWidth, 10);
      } else {
        barWidth *= parseInt(userColumnWidth, 10) / 100;
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
      barHeight: barHeight / subDivisions,
      barWidth: barWidth / subDivisions,
      zeroH,
      zeroW
    };
  }
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
    if (w.config.series[realIndex].name) {
      gsi = seriesGroup.indexOf(w.config.series[realIndex].name);
    }
    if (gsi > 0) {
      let bXP = zeroW;
      if (this.groupCtx.prevXVal[gsi - 1][j] < 0) {
        bXP = this.series[i][j] >= 0 ? this.groupCtx.prevX[gsi - 1][j] + prevBarW - (this.isReversed ? prevBarW : 0) * 2 : this.groupCtx.prevX[gsi - 1][j];
      } else if (this.groupCtx.prevXVal[gsi - 1][j] >= 0) {
        bXP = this.series[i][j] >= 0 ? this.groupCtx.prevX[gsi - 1][j] : this.groupCtx.prevX[gsi - 1][j] - prevBarW + (this.isReversed ? prevBarW : 0) * 2;
      }
      barXPosition = bXP;
    } else {
      barXPosition = zeroW;
    }
    if (this.series[i][j] === null) {
      x = barXPosition;
    } else {
      x = barXPosition + this.series[i][j] / this.invertedYRatio - (this.isReversed ? this.series[i][j] / this.invertedYRatio : 0) * 2;
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
        null,
        i,
        j,
        translationsIndex
      ),
      barXPosition,
      barYPosition,
      x,
      y
    };
  }
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
    var _a, _b, _c, _d;
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
          bYP = this.series[i][j] >= 0 ? prevYValue - prevBarH + (this.isReversed ? prevBarH : 0) * 2 : prevYValue;
          break;
        } else if (((_c = this.groupCtx.prevYVal[gsi - ii]) == null ? void 0 : _c[j]) >= 0) {
          bYP = this.series[i][j] >= 0 ? prevYValue : prevYValue + prevBarH - (this.isReversed ? prevBarH : 0) * 2;
          break;
        }
      }
      if (typeof bYP === "undefined") bYP = w.layout.gridHeight;
      if (((_d = this.groupCtx.prevYF[0]) == null ? void 0 : _d.every((val) => val === 0)) && this.groupCtx.prevYF.slice(1, gsi).every((arr) => arr.every((val) => isNaN(val)))) {
        barYPosition = zeroH;
      } else {
        barYPosition = bYP;
      }
    } else {
      barYPosition = zeroH;
    }
    if (this.series[i][j]) {
      y = barYPosition - this.series[i][j] / this.yRatio[translationsIndex] + (this.isReversed ? this.series[i][j] / this.yRatio[translationsIndex] : 0) * 2;
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
      goalY: this.barHelpers.getGoalValues("y", null, zeroH, i, j),
      barXPosition,
      x: w.axisFlags.isXNumeric ? x : x + xDivision,
      y
    };
  }
}
class RangeBar extends Bar {
  draw(series, seriesIndex) {
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
      const realIndex = w.globals.comboCharts ? seriesIndex[i] : i;
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
        this.yaxisIndex = w.globals.seriesYAxisReverseMap[realIndex][0];
        translationsIndex = realIndex;
      }
      const initPositions = this.barHelpers.initialPositions(realIndex);
      const {
        y: initY,
        zeroW,
        // zeroW is the baseline where 0 meets x axis
        x: initX,
        xDivision,
        // xDivision is the GRIDWIDTH divided by number of datapoints (columns)
        yDivision,
        // yDivision is the GRIDHEIGHT divided by number of datapoints (bars)
        zeroH
        // zeroH is the baseline where 0 meets y axis
      } = initPositions;
      let barWidth = initPositions.barWidth;
      let barHeight = initPositions.barHeight;
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
        let paths = null;
        let barXPosition = null;
        let barYPosition = null;
        const params = { x, y, strokeWidth, elSeries };
        let seriesLen = this.seriesLen;
        if (w.config.plotOptions.bar.rangeBarGroupRows) {
          seriesLen = 1;
        }
        if (typeof w.config.series[i].data[j] === "undefined") {
          break;
        }
        if (this.isHorizontal) {
          barYPosition = y + barHeight * this.visibleI;
          const srty = (yDivision - barHeight * seriesLen) / 2;
          if (w.config.series[i].data[j].x) {
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
          barXPosition = x + barWidth * this.visibleI;
          const srtx = (xDivision - barWidth * seriesLen) / 2;
          if (w.config.series[i].data[j].x) {
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
        const pathFill = this.barHelpers.getPathFillColor(series, i, j, realIndex);
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
    const w = this.w;
    let overlaps = [];
    const rangeName = w.config.series[i].data[j].rangeName;
    const x = w.config.series[i].data[j].x;
    const labelX = Array.isArray(x) ? x.join(" ") : x;
    const rowIndex = w.labelData.labels.map((_) => Array.isArray(_) ? _.join(" ") : _).indexOf(labelX);
    const overlappedIndex = w.rangeData.seriesRange[i].findIndex(
      (tx) => tx.x === labelX && tx.overlaps.length > 0
    );
    if (this.isHorizontal) {
      if (w.config.plotOptions.bar.rangeBarGroupRows) {
        barYPosition = srty + yDivision * rowIndex;
      } else {
        barYPosition = srty + barHeight * this.visibleI + yDivision * rowIndex;
      }
      if (overlappedIndex > -1 && !w.config.plotOptions.bar.rangeBarOverlap) {
        overlaps = w.rangeData.seriesRange[i][overlappedIndex].overlaps;
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
        overlaps = w.rangeData.seriesRange[i][overlappedIndex].overlaps;
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
  drawRangeColumnPaths({
    indexes,
    x,
    xDivision,
    barWidth,
    barXPosition,
    zeroH
  }) {
    const w = this.w;
    const { i, j, realIndex, translationsIndex } = indexes;
    const yRatio = this.yRatio[translationsIndex];
    const range = this.getRangeValue(realIndex, j);
    let y1 = Math.min(range.start, range.end);
    let y2 = Math.max(range.start, range.end);
    if (typeof this.series[i][j] === "undefined" || this.series[i][j] === null) {
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
        null,
        zeroH,
        i,
        j,
        translationsIndex
      ),
      barXPosition
    };
  }
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
    if (!w.axisFlags.isXNumeric) {
      y = y + yDivision;
    }
    return {
      pathTo: paths.pathTo,
      pathFrom: paths.pathFrom,
      barWidth,
      x: range.start < 0 && range.end < 0 ? x1 : x2,
      goalX: this.barHelpers.getGoalValues("x", zeroW, null, realIndex, j),
      y
    };
  }
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
