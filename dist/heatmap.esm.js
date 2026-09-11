/*!
 * ApexCharts v7.2.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Animations = _core.__apex_Animations;
const computeStagger = _core.__apex_Animations_computeStagger;
const Graphics = _core.__apex_Graphics;
const Fill = _core.__apex_Fill;
const Series = _core.__apex_Series;
const Utils = _core.__apex_Utils;
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
class TreemapHelpers {
  /**
   * @param {import('../../../types/internal').ChartStateW} w
   * @param {import('../../../types/internal').ChartContext} ctx
   */
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
  /**
   * @param {string} chartType
   * @param {number} i
   * @param {number} j
   * @param {any} negRange
   */
  getShadeColor(chartType, i, j, negRange) {
    const w = this.w;
    let colorShadePercent = 1;
    const shadeIntensity = w.config.plotOptions[chartType].shadeIntensity;
    const colorProps = this.determineColor(chartType, i, j);
    if (
      /** @type {any} */
      w.globals.hasNegs || negRange
    ) {
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
  /**
   * @param {string} chartType
   * @param {number} i
   * @param {number} j
   */
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
    let min;
    let max;
    if (!chartOpts.distributed && chartType === "heatmap") {
      min = w.globals.minY;
      max = w.globals.maxY;
    } else {
      const row = w.seriesData.series[i];
      min = row.length ? row[0] : 0;
      max = min;
      for (let k = 1; k < row.length; k++) {
        if (row[k] < min) min = row[k];
        if (row[k] > max) max = row[k];
      }
    }
    const csMin = chartOpts.colorScale.min;
    const csMax = chartOpts.colorScale.max;
    if (typeof csMin !== "undefined" && typeof csMax !== "undefined" && csMax > csMin) {
      min = csMin;
      max = csMax;
    } else if (typeof csMin !== "undefined") {
      min = csMin < w.globals.minY ? csMin : w.globals.minY;
      max = csMax > w.globals.maxY ? csMax : w.globals.maxY;
    }
    const total = Math.abs(max) + Math.abs(min);
    const clamped = Math.min(Math.max(val, min), max);
    let percent = total === 0 ? 0 : 100 * clamped / total;
    if (chartOpts.colorScale.ranges.length > 0) {
      const colorRange = chartOpts.colorScale.ranges;
      colorRange.map((range) => {
        if (val >= range.from && val <= range.to) {
          color = range.color;
          foreColor = range.foreColor ? range.foreColor : null;
          min = range.from;
          max = range.to;
          const rTotal = Math.abs(max) + Math.abs(min);
          percent = rTotal === 0 ? 0 : 100 * val / rTotal;
        }
      });
    }
    return {
      color,
      foreColor,
      percent
    };
  }
  /** @param {{ text?: any, x?: any, y?: any, i?: any, j?: any, colorProps?: any, fontSize?: any, series?: any }} opts */
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
      const offX = resolveDataLabelOffset(dataLabelsConfig.offsetX, w, i, j);
      const offY = resolveDataLabelOffset(dataLabelsConfig.offsetY, w, i, j);
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
function seriesEmitter(ctx, graphics) {
  const r = ctx && ctx.renderer;
  return r && r.kind && r.kind !== "svg" ? r : graphics;
}
const BrowserAPIs = _core.__apex_BrowserAPIs_BrowserAPIs;
const SVGNS = _core.__apex_math_SVGNS;
class HeatMap {
  /**
   * @param {import('../types/internal').ChartStateW} w
   * @param {import('../types/internal').ChartContext} ctx
   * @param {import('../types/internal').XYRatios} xyRatios
   */
  constructor(w, ctx, xyRatios) {
    this.ctx = ctx;
    this.w = w;
    this.xRatio = xyRatios.xRatio;
    this.yRatio = xyRatios.yRatio;
    this.dynamicAnim = this.w.config.chart.animations.dynamicAnimation;
    this.helpers = new TreemapHelpers(w, ctx);
    this.rectRadius = this.w.config.plotOptions.heatmap.radius;
    this.shape = this.w.config.plotOptions.heatmap.shape || "rect";
    this.strokeWidth = this.w.config.stroke.show ? this.w.config.stroke.width : 0;
  }
  /**
   * @param {any[]} series
   */
  draw(series) {
    var _a, _b;
    const w = this.w;
    const graphics = new Graphics(this.w, this.ctx);
    const ret = graphics.group({
      class: "apexcharts-heatmap"
    });
    const xDivision = w.layout.gridWidth / w.globals.dataPoints;
    const yDivision = w.layout.gridHeight / w.seriesData.series.length;
    const isContinuousX = (w.config.xaxis.type === "numeric" || w.config.xaxis.type === "datetime") && w.axisFlags.isXNumeric && this.xRatio > 0;
    let binPx = xDivision;
    if (isContinuousX) {
      const diff = w.globals.minXDiff;
      binPx = Number.isFinite(diff) && diff > 0 ? diff / this.xRatio : xDivision;
    }
    let shape = this.shape;
    if (isContinuousX && shape === "hexagon") {
      shape = "rect";
    }
    const emit = seriesEmitter(this.ctx, graphics);
    const useCanvas = shape === "rect" && emit !== graphics && typeof emit.drawRectCell === "function";
    if (shape === "hexagon") {
      this.applyHexagonClipPath(ret, graphics, xDivision, yDivision);
    } else {
      ret.attr("clip-path", `url(#gridRectMask${w.globals.cuid})`);
    }
    const cellFillOpacity = Array.isArray(w.config.fill.opacity) ? (_a = w.config.fill.opacity[0]) != null ? _a : 1 : (_b = w.config.fill.opacity) != null ? _b : 1;
    let y1 = 0;
    let rev = false;
    this.negRange = this.helpers.checkColorRange();
    const heatSeries = series.slice();
    if (w.config.yaxis[0].reversed) {
      rev = true;
      heatSeries.reverse();
    }
    for (let i = rev ? 0 : heatSeries.length - 1; rev ? i < heatSeries.length : i >= 0; rev ? i++ : i--) {
      const elSeries = graphics.group({
        class: `apexcharts-series apexcharts-heatmap-series`,
        seriesName: Utils.escapeString(w.seriesData.seriesNames[i]),
        rel: i + 1,
        "data:realIndex": i
      });
      Series.addCollapsedClassToSeries(this.w, elSeries, i);
      if (!useCanvas) {
        graphics.setupEventDelegation(elSeries, ".apexcharts-heatmap-rect");
      }
      if (w.config.chart.dropShadow.enabled) {
        const shadow = w.config.chart.dropShadow;
        const filters = new Filters(this.w);
        filters.dropShadow(elSeries, shadow, i);
      }
      let x1 = 0;
      const shadeIntensity = w.config.plotOptions.heatmap.shadeIntensity;
      const visualRow = Math.round(y1 / yDivision);
      const rowOffset = shape === "hexagon" ? (visualRow % 2 === 0 ? -1 : 1) * xDivision / 4 : 0;
      let j = 0;
      for (let dIndex = 0; dIndex < w.globals.dataPoints; dIndex++) {
        if (!isContinuousX && w.seriesData.seriesX.length && !w.globals.allSeriesHasEqualX) {
          if (w.globals.minX + w.globals.minXDiff * dIndex < w.seriesData.seriesX[i][j]) {
            x1 = x1 + xDivision;
            continue;
          }
        }
        if (j >= heatSeries[i].length) break;
        const cellW = isContinuousX ? binPx : xDivision;
        if (isContinuousX) {
          const xVal = w.seriesData.seriesX[i] ? w.seriesData.seriesX[i][j] : null;
          if (xVal == null || xVal !== xVal) {
            j++;
            continue;
          }
          x1 = (xVal - w.globals.minX) / this.xRatio - binPx / 2;
        }
        const heatColor = this.helpers.getShadeColor(
          w.config.chart.type,
          i,
          j,
          this.negRange
        );
        let color = heatColor.color;
        const heatColorProps = heatColor.colorProps;
        if (w.config.fill.type === "image") {
          const fill = new Fill(this.w);
          color = fill.fillPath({
            seriesNumber: i,
            dataPointIndex: j,
            opacity: (
              /** @type {any} */
              w.globals.hasNegs ? heatColorProps.percent < 0 ? 1 - (1 + heatColorProps.percent / 100) : shadeIntensity + heatColorProps.percent / 100 : heatColorProps.percent / 100
            ),
            patternID: Utils.randomId(),
            width: w.config.fill.image.width ? w.config.fill.image.width : cellW,
            height: w.config.fill.image.height ? w.config.fill.image.height : yDivision
          });
        }
        const radius = this.rectRadius;
        const stroke = w.config.plotOptions.heatmap.useFillColorAsStroke ? color : w.globals.stroke.colors[0];
        if (useCanvas) {
          emit.drawRectCell(x1, y1, cellW, yDivision, {
            fill: color,
            fillOpacity: cellFillOpacity,
            stroke,
            strokeWidth: this.strokeWidth,
            radius,
            seriesIndex: i,
            dataPointIndex: j
          });
        } else {
          const isRectCell = shape === "rect";
          const cell = isRectCell ? graphics.drawRect(x1, y1, cellW, yDivision, radius) : graphics.drawPath({
            d: this.cellShapePath(
              shape,
              x1 + rowOffset,
              y1,
              cellW,
              yDivision
            ),
            stroke,
            strokeWidth: this.strokeWidth,
            fill: color,
            fillOpacity: 1
          });
          cell.attr({
            cx: x1 + rowOffset,
            cy: y1
          });
          cell.node.classList.add("apexcharts-heatmap-rect");
          elSeries.add(cell);
          cell.attr({
            fill: color,
            i,
            index: i,
            j,
            val: series[i][j],
            "stroke-width": this.strokeWidth,
            stroke,
            color
          });
          if (!isRectCell) {
            cell.attr({
              width: cellW,
              height: yDivision
            });
          }
          if (w.config.chart.animations.enabled && !w.globals.dataChanged) {
            let speed = 1;
            if (!w.globals.resized) {
              speed = w.config.chart.animations.speed;
            }
            if (isRectCell) {
              this.animateHeatMap(cell, x1, y1, cellW, yDivision, speed, i, j);
            } else {
              const animations = new Animations(this.w);
              animations.animatePop(cell, {
                speed,
                delay: this.enterStaggerDelay(speed, i, j),
                onComplete: () => {
                  animations.animationCompleted(cell);
                }
              });
            }
          }
          if (w.globals.dataChanged) {
            let speed = 1;
            if (this.dynamicAnim.enabled && w.globals.shouldAnimate) {
              speed = this.dynamicAnim.speed;
              let colorFrom = w.globals.previousPaths[i] && w.globals.previousPaths[i][j] && w.globals.previousPaths[i][j].color;
              if (!colorFrom) colorFrom = "rgba(255, 255, 255, 0)";
              this.animateHeatColor(
                cell,
                Utils.isColorHex(colorFrom) ? colorFrom : Utils.rgb2hex(colorFrom),
                Utils.isColorHex(color) ? color : Utils.rgb2hex(color),
                speed
              );
            }
          }
        }
        const formatter = w.config.dataLabels.formatter;
        const formattedText = formatter(w.seriesData.series[i][j], {
          value: w.seriesData.series[i][j],
          seriesIndex: i,
          dataPointIndex: j,
          w
        });
        const dataLabels = this.helpers.calculateDataLabels({
          text: formattedText,
          x: x1 + rowOffset + cellW / 2,
          y: y1 + yDivision / 2,
          i,
          j,
          colorProps: heatColorProps,
          series: heatSeries
        });
        if (dataLabels !== null) {
          elSeries.add(dataLabels);
        }
        if (!isContinuousX) x1 = x1 + xDivision;
        j++;
      }
      y1 = y1 + yDivision;
      ret.add(elSeries);
    }
    const yAxisScale = (
      /** @type {any[]} */
      w.globals.yAxisScale[0].result.slice()
    );
    if (w.config.yaxis[0].reversed) {
      yAxisScale.unshift("");
    } else {
      yAxisScale.push("");
    }
    w.globals.yAxisScale[0].result = yAxisScale;
    return ret;
  }
  /**
   * @param {any} el
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @param {number} speed
   * @param {number} [row] - series index (heatmap row)
   * @param {number} [col] - data point index (heatmap column)
   */
  animateHeatMap(el, x, y, width, height, speed, row = 0, col = 0) {
    const animations = new Animations(this.w);
    const delay = this.enterStaggerDelay(speed, row, col);
    animations.animateRect(
      el,
      {
        x: x + width / 2,
        y: y + height / 2,
        width: 0,
        height: 0
      },
      {
        x,
        y,
        width,
        height
      },
      speed,
      () => {
        animations.animationCompleted(el);
      },
      delay
    );
  }
  /**
   * Diagonal-wave stagger for a cell's enter animation: cells animate in
   * order of (row + col), so the reveal travels from top-left to
   * bottom-right. Total stagger is capped at ~half the animation speed
   * regardless of grid size. Shared by the rect geometry tween and the
   * shaped-cell scale-in so every shape reveals with the same wave.
   *
   * @param {number} speed
   * @param {number} row - series index (heatmap row)
   * @param {number} col - data point index (heatmap column)
   */
  enterStaggerDelay(speed, row, col) {
    const w = this.w;
    const gradCfg = w.config.chart.animations.animateGradually;
    if (!gradCfg || gradCfg.enabled === false) {
      return 0;
    }
    const seriesCount = (w.seriesData.series || []).length || 1;
    const pointsCount = w.globals.dataPoints || 1;
    const maxDiag = seriesCount + pointsCount - 2;
    const baseDelay = Math.min(
      gradCfg.delay || 0,
      speed * 0.5 / Math.max(1, maxDiag)
    );
    return computeStagger({
      style: "diagonal",
      index: col,
      row,
      col,
      baseDelay
    });
  }
  /**
   * SVG path for a non-rect cell. x/y/width/height describe the cell's own
   * box (for hexagons, x already includes the row's honeycomb offset).
   *
   * - 'circle': inscribed in the cell box, radius = half the shorter side.
   * - 'diamond': the rhombus joining the box edges' midpoints, so neighbours
   *   touch at those midpoints.
   * - 'hexagon': a pointy-top hexagon stretched to the cell width and 4/3 of
   *   the row pitch tall. With alternate rows offset by half a cell this is
   *   the exact tessellating size: the row pitch stays gridHeight / nRows
   *   (nothing else in the layout pipeline changes) and each hexagon overlaps
   *   the neighbouring rows by a sixth of the pitch. In-row neighbours share
   *   the full vertical edge; diagonal neighbours share a full slanted edge.
   *
   * @param {string} shape
   * @param {number} x
   * @param {number} y
   * @param {number} width
   * @param {number} height
   * @returns {string}
   */
  cellShapePath(shape, x, y, width, height) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (shape === "circle") {
      const r = Math.min(width, height) / 2;
      return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 Z`;
    }
    if (shape === "diamond") {
      return `M ${cx} ${y} L ${x + width} ${cy} L ${cx} ${y + height} L ${x} ${cy} Z`;
    }
    const x2 = x + width;
    return `M ${cx} ${y - height / 6} L ${x2} ${y + height / 6} L ${x2} ${y + height * 5 / 6} L ${cx} ${y + height * 7 / 6} L ${x} ${y + height * 5 / 6} L ${x} ${y + height / 6} Z`;
  }
  /**
   * Hexagon rows overhang the grid box: a quarter cell horizontally (the
   * alternating quarter-cell row offsets) and a sixth of the row pitch
   * vertically (a tessellating hexagon is 4/3 of the pitch tall). The shared
   * gridRectMask would slice that overhang, so the heatmap group gets its own
   * clip rect sized to the lattice's true extent. Scoped to this group only:
   * the grid border, annotations and every other gridRectMask consumer keep
   * the exact grid box.
   *
   * @param {any} elGroup
   * @param {Graphics} graphics
   * @param {number} xDivision
   * @param {number} yDivision
   */
  applyHexagonClipPath(elGroup, graphics, xDivision, yDivision) {
    const w = this.w;
    const pad = this.strokeWidth / 2 + 2;
    const clipId = `heatmapHexMask${w.globals.cuid}`;
    const defs = w.dom.elDefs.node;
    const prev = defs.querySelector(`clipPath[id="${clipId}"]`);
    if (prev && prev.parentNode) {
      prev.parentNode.removeChild(prev);
    }
    const clipPath = BrowserAPIs.createElementNS(SVGNS, "clipPath");
    clipPath.setAttribute("id", clipId);
    clipPath.appendChild(
      graphics.drawRect(
        -xDivision / 4 - pad,
        -yDivision / 6 - pad,
        w.layout.gridWidth + xDivision / 2 + pad * 2,
        w.layout.gridHeight + yDivision / 3 + pad * 2,
        0,
        "#fff"
      ).node
    );
    defs.appendChild(clipPath);
    elGroup.attr("clip-path", `url(#${clipId})`);
  }
  /**
   * @param {any} el
   * @param {string} colorFrom
   * @param {string} colorTo
   * @param {number} speed
   */
  animateHeatColor(el, colorFrom, colorTo, speed) {
    el.attr({
      fill: colorFrom
    }).animate(speed).attr({
      fill: colorTo
    });
  }
}
_core__default.use({
  heatmap: HeatMap
});
export {
  default2 as default
};
