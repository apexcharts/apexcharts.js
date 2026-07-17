/*!
 * ApexCharts v5.16.0
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const Utils = _core.__apex_Utils;
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
_core__default._customSeriesFactory = makeCustomSeriesClass;
export {
  default2 as default
};
