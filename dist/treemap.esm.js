/*!
 * ApexCharts v5.10.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
function normalize(data, area) {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  const multiplier = area / sum;
  const result = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    result[i] = data[i] * multiplier;
  }
  return result;
}
function calculateRatio(rowMin, rowMax, rowSum, length) {
  const lengthSq = length * length;
  const sumSq = rowSum * rowSum;
  return Math.max(
    lengthSq * rowMax / sumSq,
    sumSq / (lengthSq * rowMin)
  );
}
function improvesRatio(rowLen, rowMin, rowMax, rowSum, nextNode, length) {
  if (rowLen === 0) return true;
  const currentRatio = calculateRatio(rowMin, rowMax, rowSum, length);
  const newRatio = calculateRatio(
    Math.min(rowMin, nextNode),
    Math.max(rowMax, nextNode),
    rowSum + nextNode,
    length
  );
  return currentRatio >= newRatio;
}
function emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height) {
  if (width >= height) {
    const areaWidth = rowSum / height;
    let subY = yoffset;
    for (let i = 0; i < rowLen; i++) {
      const h = row[i] / areaWidth;
      coords.push([xoffset, subY, xoffset + areaWidth, subY + h]);
      subY += h;
    }
  } else {
    const areaHeight = rowSum / width;
    let subX = xoffset;
    for (let i = 0; i < rowLen; i++) {
      const w = row[i] / areaHeight;
      coords.push([subX, yoffset, subX + w, yoffset + areaHeight]);
      subX += w;
    }
  }
}
function squarify(data, xoffset, yoffset, width, height) {
  const coords = [];
  const n = data.length;
  if (n === 0) return coords;
  const row = new Array(n);
  let rowLen = 0;
  let rowSum = 0;
  let rowMin = Infinity;
  let rowMax = -Infinity;
  let i = 0;
  while (i < n) {
    const length = Math.min(width, height);
    const val = data[i];
    if (improvesRatio(rowLen, rowMin, rowMax, rowSum, val, length)) {
      row[rowLen] = val;
      rowLen++;
      rowSum += val;
      if (val < rowMin) rowMin = val;
      if (val > rowMax) rowMax = val;
      i++;
    } else {
      emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height);
      if (width >= height) {
        const areaWidth = rowSum / height;
        xoffset += areaWidth;
        width -= areaWidth;
      } else {
        const areaHeight = rowSum / width;
        yoffset += areaHeight;
        height -= areaHeight;
      }
      rowLen = 0;
      rowSum = 0;
      rowMin = Infinity;
      rowMax = -Infinity;
    }
  }
  if (rowLen > 0) {
    emitCoordinates(coords, row, rowLen, rowSum, xoffset, yoffset, width, height);
  }
  return coords;
}
function generate(data, width, height) {
  const n = data.length;
  const sums = new Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const series = data[i];
    for (let j = 0; j < series.length; j++) {
      s += series[j];
    }
    sums[i] = s;
  }
  const seriesRects = squarify(
    normalize(sums, width * height),
    0,
    0,
    width,
    height
  );
  const results = new Array(n);
  for (let i = 0; i < n; i++) {
    const rect = seriesRects[i];
    const rx = rect[0];
    const ry = rect[1];
    const rw = rect[2] - rx;
    const rh = rect[3] - ry;
    results[i] = squarify(
      normalize(data[i], rw * rh),
      rx,
      ry,
      rw,
      rh
    );
  }
  return results;
}
const TreemapSquared = { generate };
const Graphics = _core.__apex_Graphics;
const Animations = _core.__apex_Animations;
const Fill = _core.__apex_Fill;
const Utils = _core.__apex_Utils;
const DataLabels = _core.__apex_DataLabels;
class TreemapHelpers {
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
  }
  checkColorRange() {
    const w = this.w;
    let negRange = false;
    const chartOpts = w.config.plotOptions[w.config.chart.type];
    if (chartOpts.colorScale.ranges.length > 0) {
      chartOpts.colorScale.ranges.map((range) => {
        if (range.from <= 0) {
          negRange = true;
        }
      });
    }
    return negRange;
  }
  getShadeColor(chartType, i, j, negRange) {
    const w = this.w;
    let colorShadePercent = 1;
    const shadeIntensity = w.config.plotOptions[chartType].shadeIntensity;
    const colorProps = this.determineColor(chartType, i, j);
    if (w.globals.hasNegs || negRange) {
      if (w.config.plotOptions[chartType].reverseNegativeShade) {
        if (colorProps.percent < 0) {
          colorShadePercent = colorProps.percent / 100 * (shadeIntensity * 1.25);
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * (shadeIntensity * 1.25);
        }
      } else {
        if (colorProps.percent <= 0) {
          colorShadePercent = 1 - (1 + colorProps.percent / 100) * shadeIntensity;
        } else {
          colorShadePercent = (1 - colorProps.percent / 100) * shadeIntensity;
        }
      }
    } else {
      colorShadePercent = 1 - colorProps.percent / 100;
      if (chartType === "treemap") {
        colorShadePercent = (1 - colorProps.percent / 100) * (shadeIntensity * 1.25);
      }
    }
    let color = colorProps.color;
    const utils = new Utils();
    if (w.config.plotOptions[chartType].enableShades) {
      if (this.w.config.theme.mode === "dark") {
        const shadeColor = utils.shadeColor(
          colorShadePercent * -1,
          colorProps.color
        );
        color = Utils.hexToRgba(
          Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
          w.config.fill.opacity
        );
      } else {
        const shadeColor = utils.shadeColor(colorShadePercent, colorProps.color);
        color = Utils.hexToRgba(
          Utils.isColorHex(shadeColor) ? shadeColor : Utils.rgb2hex(shadeColor),
          w.config.fill.opacity
        );
      }
    }
    return { color, colorProps };
  }
  determineColor(chartType, i, j) {
    const w = this.w;
    const val = w.seriesData.series[i][j];
    const chartOpts = w.config.plotOptions[chartType];
    let seriesNumber = chartOpts.colorScale.inverse ? j : i;
    if (chartOpts.distributed && w.config.chart.type === "treemap") {
      seriesNumber = j;
    }
    let color = w.globals.colors[seriesNumber];
    let foreColor = null;
    let min = Math.min(...w.seriesData.series[i]);
    let max = Math.max(...w.seriesData.series[i]);
    if (!chartOpts.distributed && chartType === "heatmap") {
      min = w.globals.minY;
      max = w.globals.maxY;
    }
    if (typeof chartOpts.colorScale.min !== "undefined") {
      min = chartOpts.colorScale.min < w.globals.minY ? chartOpts.colorScale.min : w.globals.minY;
      max = chartOpts.colorScale.max > w.globals.maxY ? chartOpts.colorScale.max : w.globals.maxY;
    }
    const total = Math.abs(max) + Math.abs(min);
    let percent = 100 * val / (total === 0 ? total - 1e-6 : total);
    if (chartOpts.colorScale.ranges.length > 0) {
      const colorRange = chartOpts.colorScale.ranges;
      colorRange.map((range) => {
        if (val >= range.from && val <= range.to) {
          color = range.color;
          foreColor = range.foreColor ? range.foreColor : null;
          min = range.from;
          max = range.to;
          const rTotal = Math.abs(max) + Math.abs(min);
          percent = 100 * val / (rTotal === 0 ? rTotal - 1e-6 : rTotal);
        }
      });
    }
    return {
      color,
      foreColor,
      percent
    };
  }
  calculateDataLabels({ text, x, y, i, j, colorProps, fontSize }) {
    const w = this.w;
    const dataLabelsConfig = w.config.dataLabels;
    const graphics = new Graphics(this.w);
    const dataLabels = new DataLabels(this.w, this.ctx);
    let elDataLabelsWrap = null;
    if (dataLabelsConfig.enabled) {
      elDataLabelsWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      const offX = dataLabelsConfig.offsetX;
      const offY = dataLabelsConfig.offsetY;
      const dataLabelsX = x + offX;
      const dataLabelsY = y + parseFloat(dataLabelsConfig.style.fontSize) / 3 + offY;
      dataLabels.plotDataLabelsText({
        x: dataLabelsX,
        y: dataLabelsY,
        text,
        i,
        j,
        color: colorProps.foreColor,
        parent: elDataLabelsWrap,
        fontSize,
        dataLabelsConfig
      });
    }
    return elDataLabelsWrap;
  }
}
const Filters = _core.__apex_Filters;
class TreemapChart {
  constructor(w, ctx) {
    this.ctx = ctx;
    this.w = w;
    this.strokeWidth = this.w.config.stroke.width;
    this.helpers = new TreemapHelpers(w, ctx);
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.labels = [];
  }
  draw(series) {
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const fill = new Fill(this.w);
    const ret = graphics.group({
      class: "apexcharts-treemap"
    });
    if (w.globals.noData) return ret;
    const ser = [];
    series.forEach((s) => {
      const d = s.map((v) => {
        return Math.abs(v);
      });
      ser.push(d);
    });
    this.negRange = this.helpers.checkColorRange();
    w.config.series.forEach((s, i) => {
      s.data.forEach((l) => {
        if (!Array.isArray(this.labels[i])) this.labels[i] = [];
        this.labels[i].push(l.x);
      });
    });
    const nodes = TreemapSquared.generate(
      ser,
      w.layout.gridWidth,
      w.layout.gridHeight
    );
    nodes.forEach((node, i) => {
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-treemap-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      graphics.setupEventDelegation(elSeries, ".apexcharts-treemap-rect");
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        const filters = new Filters(this.w);
        filters.dropShadow(ret, shadow, i);
      }
      const elDataLabelWrap = graphics.group({
        class: "apexcharts-data-labels"
      });
      const bounds = {
        xMin: Infinity,
        yMin: Infinity,
        xMax: -Infinity,
        yMax: -Infinity
      };
      node.forEach((r, j) => {
        const x1 = r[0];
        const y1 = r[1];
        const x2 = r[2];
        const y2 = r[3];
        bounds.xMin = Math.min(bounds.xMin, x1);
        bounds.yMin = Math.min(bounds.yMin, y1);
        bounds.xMax = Math.max(bounds.xMax, x2);
        bounds.yMax = Math.max(bounds.yMax, y2);
        const colorProps = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j,
          this.negRange
        );
        const color = colorProps.color;
        const pathFill = fill.fillPath({
          color,
          seriesNumber: i,
          dataPointIndex: j
        });
        const elRect = graphics.drawRect(
          x1,
          y1,
          x2 - x1,
          y2 - y1,
          w.config.plotOptions.treemap.borderRadius,
          "#fff",
          1,
          this.strokeWidth,
          w.config.plotOptions.treemap.useFillColorAsStroke ? color : w.globals.stroke.colors[i]
        );
        elRect.attr({
          cx: x1,
          cy: y1,
          index: i,
          i,
          j,
          width: x2 - x1,
          height: y2 - y1,
          fill: pathFill
        });
        elRect.node.classList.add("apexcharts-treemap-rect");
        let fromRect = {
          x: x1 + (x2 - x1) / 2,
          y: y1 + (y2 - y1) / 2,
          width: 0,
          height: 0
        };
        const toRect = {
          x: x1,
          y: y1,
          width: x2 - x1,
          height: y2 - y1
        };
        if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
          let speed = 1;
          if (!w.globals.resized) {
            speed = w.config.chart.animations.speed;
          }
          this.animateTreemap(elRect, fromRect, toRect, speed);
        }
        if (w.globals.dataChanged) {
          let speed = 1;
          if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
            speed = this.dynamicAnim.speed;
            if (w.globals.previousPaths[i] && w.globals.previousPaths[i][j] && w.globals.previousPaths[i][j].rect) {
              fromRect = w.globals.previousPaths[i][j].rect;
            }
            this.animateTreemap(elRect, fromRect, toRect, speed);
          }
        }
        let fontSize = this.getFontSize(r);
        let formattedText = w.config.dataLabels.formatter(this.labels[i][j], {
          value: w.seriesData.series[i][j],
          seriesIndex: i,
          dataPointIndex: j,
          w
        });
        if (w.config.plotOptions.treemap.dataLabels.format === "truncate") {
          fontSize = parseInt(w.config.dataLabels.style.fontSize, 10);
          formattedText = this.truncateLabels(
            formattedText,
            fontSize,
            x1,
            y1,
            x2,
            y2
          );
        }
        let dataLabels = null;
        if (w.seriesData.series[i][j]) {
          dataLabels = this.helpers.calculateDataLabels({
            text: formattedText,
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2 + this.strokeWidth / 2 + fontSize / 3,
            i,
            j,
            colorProps,
            fontSize,
            series
          });
        }
        if (w.config.dataLabels.enabled && dataLabels) {
          this.rotateToFitLabel(
            dataLabels,
            fontSize,
            formattedText,
            x1,
            y1,
            x2,
            y2
          );
        }
        elSeries.add(elRect);
        if (dataLabels !== null) {
          elSeries.add(dataLabels);
        }
      });
      const seriesTitle = w.config.plotOptions.treemap.seriesTitle;
      if (w.config.series.length > 1 && seriesTitle && seriesTitle.show) {
        const sName = w.config.series[i].name || "";
        if (sName && bounds.xMin < Infinity && bounds.yMin < Infinity) {
          const {
            offsetX,
            offsetY,
            borderColor,
            borderWidth,
            borderRadius,
            style
          } = seriesTitle;
          const textColor = style.color || w.config.chart.foreColor;
          const padding = {
            left: style.padding.left,
            right: style.padding.right,
            top: style.padding.top,
            bottom: style.padding.bottom
          };
          const textSize = graphics.getTextRects(
            sName,
            style.fontSize,
            style.fontFamily
          );
          const labelRectWidth = textSize.width + padding.left + padding.right;
          const labelRectHeight = textSize.height + padding.top + padding.bottom;
          const labelX = bounds.xMin + (offsetX || 0);
          const labelY = bounds.yMin + (offsetY || 0);
          const elLabelRect = graphics.drawRect(
            labelX,
            labelY,
            labelRectWidth,
            labelRectHeight,
            borderRadius,
            style.background,
            1,
            borderWidth,
            borderColor
          );
          const elLabelText = graphics.drawText({
            x: labelX + padding.left,
            y: labelY + padding.top + textSize.height * 0.75,
            text: sName,
            fontSize: style.fontSize,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            foreColor: textColor,
            cssClass: style.cssClass || ""
          });
          elSeries.add(elLabelRect);
          elSeries.add(elLabelText);
        }
      }
      elSeries.add(elDataLabelWrap);
      ret.add(elSeries);
    });
    return ret;
  }
  // This calculates a font-size based upon
  // average label length and the size of the box
  getFontSize(coordinates) {
    const w = this.w;
    function totalLabelLength(arr) {
      let i, total = 0;
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += totalLabelLength(arr[i]);
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += arr[i].length;
        }
      }
      return total;
    }
    function countLabels(arr) {
      let i, total = 0;
      if (Array.isArray(arr[0])) {
        for (i = 0; i < arr.length; i++) {
          total += countLabels(arr[i]);
        }
      } else {
        for (i = 0; i < arr.length; i++) {
          total += 1;
        }
      }
      return total;
    }
    const averagelabelsize = totalLabelLength(this.labels) / countLabels(this.labels);
    function fontSize(width, height) {
      const area = width * height;
      const arearoot = Math.pow(area, 0.5);
      return Math.min(
        arearoot / averagelabelsize,
        parseInt(w.config.dataLabels.style.fontSize, 10)
      );
    }
    return fontSize(
      coordinates[2] - coordinates[0],
      coordinates[3] - coordinates[1]
    );
  }
  rotateToFitLabel(elText, fontSize, text, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w);
    const textRect = graphics.getTextRects(text, fontSize);
    if (textRect.width + this.w.config.stroke.width + 5 > x2 - x1 && textRect.width <= y2 - y1) {
      const labelRotatingCenter = graphics.rotateAroundCenter(elText.node);
      elText.node.setAttribute(
        "transform",
        `rotate(-90 ${labelRotatingCenter.x} ${labelRotatingCenter.y}) translate(${textRect.height / 3})`
      );
    }
  }
  // This is an alternative label formatting method that uses a
  // consistent font size, and trims the edge of long labels
  truncateLabels(text, fontSize, x1, y1, x2, y2) {
    const graphics = new Graphics(this.w);
    const textRect = graphics.getTextRects(text, fontSize);
    const labelMaxWidth = textRect.width + this.w.config.stroke.width + 5 > x2 - x1 && y2 - y1 > x2 - x1 ? y2 - y1 : x2 - x1;
    const truncatedText = graphics.getTextBasedOnMaxWidth({
      text,
      maxWidth: labelMaxWidth,
      fontSize
    });
    if (text.length !== truncatedText.length && labelMaxWidth / fontSize < 5) {
      return "";
    } else {
      return truncatedText;
    }
  }
  animateTreemap(el, fromRect, toRect, speed) {
    const animations = new Animations(this.w);
    animations.animateRect(el, fromRect, toRect, speed, () => {
      animations.animationCompleted(el);
    });
  }
}
_core__default.use({
  treemap: TreemapChart
});
export {
  default2 as default
};
