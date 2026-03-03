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
 * ApexCharts v5.8.2-beta.1
 * (c) 2018-2026 ApexCharts
 */
import * as _core from "apexcharts/core";
import _core__default from "apexcharts/core";
import { default as default2 } from "apexcharts/core";
const Graphics = _core.__apex_Graphics;
const Utils = _core.__apex_Utils;
class KeyboardNavigation {
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
    this._showTooltip(i, j, ttCtx);
  }
  _hideFocus() {
    const w = this.w;
    const ttCtx = w.globals.tooltip;
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
  /** bar / column / candlestick / boxPlot / rangeBar */
  _showTooltipBar(i, j, ttCtx) {
    var _a, _b, _c, _d;
    const w = this.w;
    const shared = ttCtx.tConfig.shared && (ttCtx.tooltipUtil.isXoverlap(j) || w.globals.isBarHorizontal) && ttCtx.tooltipUtil.isInitialSeriesSameLen();
    const rangeData = (_d = (_c = (_b = (_a = w.rangeData.seriesRange) == null ? void 0 : _a[i]) == null ? void 0 : _b[j]) == null ? void 0 : _c.y) == null ? void 0 : _d[0];
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
  /** line / area / scatter / bubble / radar / rangeArea */
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
  /** pie / donut / polarArea */
  _showTooltipNonAxis(i, j, ttCtx, tooltipEl) {
    const w = this.w;
    ttCtx.tooltipLabels.drawSeriesTexts({
      ttItems: ttCtx.ttItems,
      i: j,
      shared: false
    });
    const tooltipBound = tooltipEl.getBoundingClientRect();
    const ttWidth = tooltipBound.width || ttCtx.tooltipRect.ttWidth || 0;
    const ttHeight = tooltipBound.height || ttCtx.tooltipRect.ttHeight || 0;
    const sliceEl = w.dom.baseEl.querySelector(
      `.apexcharts-pie-area[j='${j}']`
    );
    if (sliceEl) {
      const cx = parseFloat(sliceEl.getAttribute("data:cx"));
      const cy = parseFloat(sliceEl.getAttribute("data:cy"));
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
  /** radialBar — one ring per series, single value each */
  _showTooltipRadialBar(i, _j, ttCtx, tooltipEl) {
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
      const angle = parseFloat(arcEl.getAttribute("data:angle")) || 0;
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
      const centroid = Utils.polarToCartesian(centerX, centerY, ringRadius, midAngle);
      const x = centroid.x + (w.layout.translateX || 0);
      const y = centroid.y + (w.layout.translateY || 0);
      tooltipEl.style.left = x - ttWidth / 2 + "px";
      tooltipEl.style.top = y - ttHeight - 10 + "px";
    }
  }
  /** heatmap / treemap — position tooltip using element bounding rect */
  _showTooltipHeatTree(i, j, ttCtx, tooltipEl, type) {
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
    const cell = w.dom.baseEl.querySelector(
      `.${rectClass}[i='${i}'][j='${j}']`
    );
    if (cell) {
      const wrapRect = w.dom.elWrap.getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      const cellCx = cellRect.left - wrapRect.left;
      const cellCy = cellRect.top - wrapRect.top;
      const cellWidth = cellRect.width;
      const cellHeight = cellRect.height;
      const cx = parseFloat(cell.getAttribute("cx"));
      const cellWidthAttr = parseFloat(cell.getAttribute("width"));
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
export {
  default2 as default
};
